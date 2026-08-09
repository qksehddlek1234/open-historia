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
export const PLAYER_SOVEREIGNTY =
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
  + "hand moves only when the player moves it. THE SAME WALL STANDS THE OTHER "
  + "WAY: the player commands their own state and nobody else's. They may "
  + "persuade, pressure, bribe, subvert or invade another polity, and each of "
  + "those is an ATTEMPT whose outcome the other polity's own interests decide "
  + "— never an instruction that other governments carry out.";
