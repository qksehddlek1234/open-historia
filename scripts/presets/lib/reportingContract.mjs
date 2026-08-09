/*! Open Historia — what a turn must actually report © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THREE THINGS THE ORIGINAL'S BEST PRESETS DEMAND AND WE NEVER ASKED FOR.
//
// From the 2026-08-09 re-audit (docs/analysis/presets-original.md). Two presets
// carry these and both are among the most played of their era: "1946: Dawn of
// Cold War" (1.9M rounds, 7,790 characters of rules — the collection notes call
// it the textbook system preset) and "Millennium Dawn" (1.5M, 8,060).
//
// Our own rules for those two dates are 2,203 and 2,679 characters. The gap is
// not padding: it is three specific obligations we place on nobody.
//
// 1. A BATTLE WITH NO NUMBERS. Millennium Dawn requires both sides' strength
//    and casualties in every combat event. Without it a war reads as adjectives
//    — "fierce fighting", "heavy losses" — for twenty turns, and the player has
//    no way to tell a won battle from a lost one except by the map. Numbers also
//    force the model to keep a war's arithmetic consistent turn to turn, which
//    is the actual failure being prevented.
//
// 2. A TREATY WITH NO NAME. 1946 requires every war-ending treaty to be recorded
//    as "Treaty of <city>". It sounds cosmetic and is not: a named treaty is a
//    thing later turns can refer to, break, revise and resent. An unnamed
//    settlement is forgotten by the next consolidation, and the grievance it was
//    supposed to create never exists.
//
// 3. A TURN THAT IS ALL ABOUT THE PLAYER, or none of it. Millennium Dawn fixes
//    the split explicitly: 60-70% of events concern the player's sphere, 30-40%
//    the wider world. Both failure modes are real and we have seen both — a turn
//    that narrates only the player's own orders (the world stops existing) and a
//    turn that narrates a world tour while the player's own war goes unmentioned.
//
// Deliberately NOT taken from those presets, and recorded as backlog rather than
// silently dropped: 1946's five-tier great-power ranking with numeric promotion
// thresholds, its Budget stat, and its battalion-name strength notation
// "[Country] Armed Forces (27/30)". Those are engine features, not prompt text —
// we already carry unit strength as a number and country stats as a sheet, and
// bolting a second scoring system on through prose would put the two at odds.
export const REPORTING_CONTRACT =
  " A BATTLE IS REPORTED WITH NUMBERS. Any event that narrates fighting — an "
  + "assault, a siege, a landing, an air raid, a naval action, a border clash — "
  + "states what each side committed and what each side lost, in figures, at "
  + "whatever precision the period can actually know: divisions and thousands of "
  + "men in an industrial war, hundreds in a colonial skirmish, ships and "
  + "aircraft where those are the currency. Keep the arithmetic consistent from "
  + "turn to turn — an army that lost half its strength last month does not "
  + "attack at full strength this month — and where a figure is contested or "
  + "propagandised, say whose figure it is. Without numbers a war is twenty "
  + "turns of adjectives and the player cannot tell a victory from a defeat. "

  + "A WAR ENDS IN A NAMED TREATY. When fighting stops by agreement, record the "
  + "settlement as \"Treaty of <place>\" — the town where it was signed, in the "
  + "period's own naming habit — and state its actual terms: what changed hands, "
  + "what was paid, what was forbidden, who guaranteed it. A named treaty is "
  + "something later turns can invoke, revise, evade or resent; an unnamed "
  + "settlement is forgotten by the next consolidation and the grievance it "
  + "should have created never exists. An armistice or ceasefire that settles "
  + "nothing is NOT a treaty and should not be dressed as one. "

  + "A TURN IS MOSTLY, BUT NOT ONLY, THE PLAYER'S. Roughly two thirds of a "
  + "turn's events should touch the player's own sphere — their orders, their "
  + "borders, their allies and rivals, the consequences arriving on them — and "
  + "roughly one third should be the rest of the world getting on with its own "
  + "business, including things the player has no part in and may not even hear "
  + "about. A turn that narrates only the player's orders has quietly deleted "
  + "the world; a turn that tours the globe while the player's own war goes "
  + "unmentioned has deleted the player.";
