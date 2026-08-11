/*! Open Historia — the player-sovereignty contract © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE RULE THE ORIGINAL PUTS FIRST, AND THE ONE WE NEVER STATED.
//
// Read off World War II++ (natriumchl), the preset the player actually plays.
// Its rules open with "Absolute Player Sovereignty [NON-NEGOTIABLE]" and give a
// concrete failure: playing Germany, the simulation must NOT remilitarise the
// Rhineland on its own. Every scripted thing the player's own country would
// historically do is suspended until the player orders it.
//
// We have "the player is the player, not the head of state" (CLAUDE.md #4), but
// that governs how the player is ADDRESSED. It never said the simulation may not
// act FOR them. On a historical preset the difference is the whole game: if the
// engine helpfully runs the player's country down its historical rails, the
// player is watching a documentary about themselves.
//
// The mirror clause matters just as much and the original states it too: the
// player may not act for anyone ELSE. They may persuade, threaten, bribe or
// invade — attempts, never decrees.
// SPLIT IN TWO, because the two halves have different redundancy profiles and
// the injection layer needs to address them separately.
//
// The OWN-STATE half is stated, clause for clause, by the jump prompts' own
// [Player Agency — critical] section ("Never execute actions FOR the player…
// IF AND ONLY IF the player specifically took an action… If the player chooses
// not to act, assume it was deliberate"). Measured before this split was made:
// duplicate-scan.mjs finds all four probe phrases in jumpForward and
// autoJumpForward, and in NO other consumer. Sending this half to those two
// tasks pays twice for one rule on the two largest prompts in the fleet.
//
// The OTHER-STATES half exists nowhere else in any prompt. It is also a
// different rule — the player commanding OTHER governments, attempts not
// decrees — and losing it was the reason the measured cell could not simply be
// switched off (docs/analysis/cell-ab-2026-08-11.md, 3차).
//
// PLAYER_SOVEREIGNTY stays the exact concatenation: every board's build, every
// save-migration hash and every byte pin sees the same string as before.
export const PLAYER_SOVEREIGNTY_OWN_STATE =
  " THE PLAYER'S COUNTRY DOES NOTHING THE PLAYER DID NOT ORDER. This is not a "
  + "style note; it is the first rule of the simulation. Before narrating any "
  + "act BY the player's own polity — a mobilisation, a remilitarisation, a "
  + "treaty signed, a purge begun, an election called, a colony reorganised — "
  + "check that the player actually ordered it this turn. If they did not, it "
  + "does not happen, however historical it would be and however obviously the "
  + "period points that way. A player's country that sat still sat still, and "
  + "the world reacts to that inaction as the real world would: rivals move "
  + "into the vacuum, allies grow anxious, and the historical moment passes to "
  + "someone else. What the period WOULD have done to them still happens — "
  + "other powers act, deadlines expire, crises arrive — but the player's own "
  + "hand moves only when the player moves it.";

export const PLAYER_SOVEREIGNTY_OTHER_STATES =
  " THE SAME WALL STANDS THE OTHER "
  + "WAY: the player commands their own state and nobody else's. They may "
  + "persuade, pressure, bribe, subvert or invade another polity, and each of "
  + "those is an ATTEMPT whose outcome the other polity's own interests decide "
  + "— never an instruction that other governments carry out.";

export const PLAYER_SOVEREIGNTY = PLAYER_SOVEREIGNTY_OWN_STATE + PLAYER_SOVEREIGNTY_OTHER_STATES;
