/*! Open Historia — shipped period timelines © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE SCENARIO'S SCHEDULE, SHIPPED WITH THE APP.
//
// periodTimeline.js knows what to DO with a timeline; this is where the ones
// that come in the box live, and how a save gets one.
//
// Until now it did not get one: the timeline had to be pasted into world state
// by hand, which meant a campaign started before the file existed ran on nothing,
// and a correction to the file never reached a campaign already in progress. Both
// are the same problem — the save held a COPY with no idea where it came from.
//
// So the copy is stamped. `world.periodTimelineSource` records which timeline the
// save is carrying and at what revision, and a launch that finds the shipped file
// has moved on replaces the entries and says so. Bump `revision` in the JSON
// whenever the entries change; leave it alone and nothing is touched.
//
// Replacing is safe TODAY because nothing but this file writes periodTimeline. If
// a scenario editor ever lets a designer edit the schedule in-game, this becomes a
// merge and the stamp is what makes that merge possible.
import coldwar1946 from "../../data/timelines/coldwar-1946.json" with { type: "json" };
import coldwar1989 from "../../data/timelines/coldwar-1989.json" with { type: "json" };
import korea1950 from "../../data/timelines/korea-1950.json" with { type: "json" };
import millennium2000 from "../../data/timelines/millennium-2000.json" with { type: "json" };
import modern2016 from "../../data/timelines/modern-2016.json" with { type: "json" };
import realWorld2026 from "../../data/timelines/real-world-2026.json" with { type: "json" };
import tno1962 from "../../data/timelines/tno-1962.json" with { type: "json" };
import { normalizeTimeline } from "./periodTimeline.js";

const normalizeString = (value) => String(value ?? "").trim();

const buildLibraryEntry = (source) => {
  const entries = normalizeTimeline(source?.entries);
  if (entries.length === 0) return null;
  return {
    id: normalizeString(source?.id),
    label: normalizeString(source?.label),
    // A save carrying revision N of this timeline is refreshed when the shipped
    // file is at N+1. Missing means 1, so an unversioned file seeds once and then
    // stays put rather than rewriting the save on every launch.
    revision: Number.isFinite(Number(source?.revision)) ? Math.trunc(Number(source.revision)) : 1,
    entries,
    // The window this timeline SERVES, which is not always the span of its own
    // entries. A timeline of things that have already happened brackets its
    // campaign; a timeline of things that are still coming starts after the
    // campaign does, and deriving `from` off the first entry would then lock
    // out the very campaign it was written for. So a file may declare its
    // window, and only falls back to its entries when it does not.
    from: normalizeString(source?.servesFrom) || entries[0].date,
    to: normalizeString(source?.servesTo) || entries[entries.length - 1].date,
  };
};

// Chronological, and the windows must not overlap — timelineForDate takes the
// first match, so two timelines covering one date would make the winner depend
// on the order of this array rather than on anything a designer decided.
// tests/timelines.mjs holds that line.
export const TIMELINE_LIBRARY = [coldwar1946, korea1950, tno1962, coldwar1989, millennium2000, modern2016, realWorld2026]
  .map(buildLibraryEntry).filter(Boolean).filter((entry) => entry.id);

export const timelineById = (id) => {
  const wanted = normalizeString(id);
  return wanted ? TIMELINE_LIBRARY.find((entry) => entry.id === wanted) ?? null : null;
};

// The timeline a campaign starting on this date belongs to. A campaign that
// begins outside every shipped range gets nothing — better than handing a 1848
// scenario the 2016 schedule.
export const timelineForDate = (date) => {
  const day = normalizeString(date);
  if (!day) return null;
  return TIMELINE_LIBRARY.find((entry) => day >= entry.from && day <= entry.to) ?? null;
};

export const SEED_REASONS = {
  none: "",
  seeded: "seeded",
  refreshed: "refreshed",
};

// What this save's timeline should be. Returns null when nothing needs to change,
// so the caller can leave world state alone on the overwhelming majority of turns.
//
// Three cases, in order:
//   • the save is stamped and the shipped file has moved on → refresh
//   • the save carries no timeline at all → seed from the campaign's date
//   • anything else (stamped and current, or unstamped but populated) → leave it
//
// The unstamped-but-populated case is the hand-injected save that started all
// this: it is adopted rather than replaced, because the entries in it may be the
// only copy of an authored schedule.
export const reconcileTimeline = (world, campaignDate) => {
  const stamp = world?.periodTimelineSource ?? null;
  const held = normalizeTimeline(world?.periodTimeline);

  const stamped = timelineById(stamp?.id);
  if (stamped) {
    const heldRevision = Number.isFinite(Number(stamp?.revision)) ? Math.trunc(Number(stamp.revision)) : 0;
    if (heldRevision >= stamped.revision) return null;
    return {
      reason: SEED_REASONS.refreshed,
      entries: stamped.entries,
      source: { id: stamped.id, revision: stamped.revision },
      label: stamped.label,
      from: heldRevision,
    };
  }

  if (held.length > 0) {
    // Populated but unstamped. Adopt it if it is recognisably one of ours —
    // matching id-less entries by date range — so a hand-injected save starts
    // receiving corrections instead of being frozen forever.
    const match = TIMELINE_LIBRARY.find((entry) => entry.from <= held[0].date && held[0].date <= entry.to);
    if (!match) return null;
    return {
      reason: SEED_REASONS.refreshed,
      entries: match.entries,
      source: { id: match.id, revision: match.revision },
      label: match.label,
      from: 0,
    };
  }

  const found = timelineForDate(campaignDate);
  if (!found) return null;
  return {
    reason: SEED_REASONS.seeded,
    entries: found.entries,
    source: { id: found.id, revision: found.revision },
    label: found.label,
    from: 0,
  };
};
