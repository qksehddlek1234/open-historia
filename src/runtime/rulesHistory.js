/*! Open Historia — telling an old rules copy from one a person wrote © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE STAMP, borrowed wholesale from timelineLibrary.js.
//
// A save holds its own `simulationRules`, and the prompt is built from THAT, not
// from the scenario. Two things follow and both were live:
//
//   • a campaign started before a board was finished keeps the unfinished rules
//     forever. wwii-1935-buildup-session runs on 1,622 characters where the
//     scenario now has 11,918 — an exact match for the board's very first build.
//   • the field is editable from the library bar, so anything that "fixes" the
//     first case can destroy a player's own writing.
//
// The timeline had the same shape and solved it by stamping the copy. This does
// the same for rules, with one addition: the timeline adopts an unstamped copy
// by matching a DATE RANGE, which is a guess. Here the match is exact, against
// data/rules-history.json — every text each board has ever shipped. A copy that
// hashes to one of them is a build we made. A copy that hashes to none of them
// was typed by a person, and is never touched by anything in this file.
//
// EVERY UNCERTAIN CASE RESOLVES TO "LEAVE IT ALONE". A missing manifest, a board
// with no history, a text that matches nothing, a contract wording that has
// changed since the save was written — all of them return null. The cost of a
// miss is a campaign that keeps running exactly as it does today; the cost of a
// wrong adopt is somebody's writing gone.
import { stripContracts } from "./simulationContracts.js";

const normalize = (value) => (typeof value === "string" ? value.trim() : "");

/**
 * FNV-1a, 64-bit, hex. Not a cryptographic choice — the manifest generator uses
 * sha256 and this has to agree with it, so the generator's hash is what ships
 * and this function exists only where node:crypto is not available. See
 * hashRules below, which prefers the real thing.
 */
const fallbackHash = (text) => {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
};

let sha256 = null;
try {
  // Node has it; the browser bundle does not, and the browser never runs this.
  const crypto = await import("node:crypto");
  sha256 = (text) => crypto.createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);
} catch {
  sha256 = null;
}

export const hashRules = (text) => {
  const value = normalize(text);
  return sha256 ? sha256(value) : fallbackHash(value);
};

export const RECONCILE = {
  current: "current",
  refreshed: "refreshed",
  adopted: "adopted",
  authored: "authored",
  unknown: "unknown",
  // The board text is right and the CONTRACT LIST is not. Its own verdict
  // because it is safe in a way the others are not: `contracts` is derived from
  // the spec and has no editor anywhere in the UI, so a save whose list
  // disagrees with its scenario is simply out of date and can always be synced.
  // Found on the live wwii-1935 save, which adopted the board's 6,466 characters
  // and kept an empty contract list — better than the 1,622 it had, but 5,452
  // characters short of what a fresh game on that scenario gets.
  contracts: "contracts",
};

/**
 * What should happen to this save's rules copy.
 *
 * Returns a verdict every time — callers act only on `adopted` and `refreshed`,
 * but a build script that reports what it is NOT doing is worth more than one
 * that silently skips.
 *
 * @param world         the save's world state
 * @param scenarioId    the scenario it was started from
 * @param scenarioWorld the scenario's world.json TODAY
 * @param history       data/rules-history.json, parsed
 */
export const reconcileRules = (world, scenarioId, scenarioWorld, history) => {
  const held = normalize(world?.simulationRules);
  const current = normalize(scenarioWorld?.simulationRules);
  // The contract list travels with the rules. Adopting the scenario's current
  // board text and leaving the save's old list behind gives the campaign the
  // words and not the contracts — which is what happened to wwii-1935 on the
  // first run of this.
  const contracts = Array.isArray(scenarioWorld?.contracts) ? [...scenarioWorld.contracts] : [];
  const heldContracts = Array.isArray(world?.contracts) ? [...world.contracts] : null;
  const sameContracts = heldContracts !== null
    && heldContracts.length === contracts.length
    && heldContracts.every((key, i) => key === contracts[i]);
  // The contracts are stripped before hashing because the manifest records the
  // BOARD's text. A save from before the split carries them inline; one from
  // after does not. Both reduce to the same thing here.
  const { rules: board } = stripContracts(held);
  const heldHash = hashRules(board);
  const currentHash = hashRules(current);

  if (heldHash === currentHash) {
    if (sameContracts) return { verdict: RECONCILE.current, heldHash, chars: board.length };
    return {
      verdict: RECONCILE.contracts,
      heldHash,
      chars: board.length,
      from: heldContracts,
      contracts,
      source: { id: scenarioId, hash: currentHash, chars: current.length },
    };
  }

  const known = history?.boards?.[scenarioId];
  if (!Array.isArray(known) || known.length === 0) {
    // No history for this board — we cannot tell a build from a person, so it
    // is a person as far as this code is concerned.
    return { verdict: RECONCILE.unknown, heldHash, chars: board.length };
  }

  const stamp = world?.simulationRulesSource ?? null;
  const stamped = normalize(stamp?.hash);
  if (stamped && known.some((entry) => entry.hash === stamped)) {
    // Stamped as one of ours and the board has moved on since.
    return {
      verdict: RECONCILE.refreshed,
      heldHash,
      chars: board.length,
      rules: current,
      contracts,
      source: { id: scenarioId, hash: currentHash, chars: current.length },
    };
  }

  const match = known.find((entry) => entry.hash === heldHash);
  if (match) {
    // Unstamped, but it is a text this board actually shipped. Adopt it: bring
    // the campaign up to date and stamp the copy so the next move is a plain
    // refresh rather than another archaeology run.
    return {
      verdict: RECONCILE.adopted,
      heldHash,
      chars: board.length,
      from: match,
      rules: current,
      contracts,
      source: { id: scenarioId, hash: currentHash, chars: current.length },
    };
  }

  // Matches nothing this board ever shipped. Somebody wrote it.
  return { verdict: RECONCILE.authored, heldHash, chars: board.length };
};
