/*! Open Historia — the end-of-turn scheduled events tab © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// WHAT IS ALREADY ON THE CALENDAR, SHOWN BEFORE IT ARRIVES.
//
// Read off World War II++ (natriumchl). Its rules give this a section of its own
// and state the purpose plainly: prevent confusion by showing upcoming
// fixed-date events. At every end of turn it prints ONE card listing every event
// whose date is already determined, with the time left on each.
//
// We had nothing like it, and the gap shows up as a specific failure rather than
// a missing nicety: a player who jumps six months has no way to know they just
// jumped over an election, a treaty deadline, or a mobilisation date. They find
// out afterwards, in the past tense, and the only remedy is to already know the
// period's calendar by heart. That is the same class of problem as the silent
// dropped action — something the engine knew and did not say.
//
// The format is the original's, because the original's is right: name, date,
// and the interval, so the player can price a jump before making it.
export const SCHEDULED_EVENTS =
  " END EVERY TURN WITH WHAT IS ALREADY ON THE CALENDAR. After the turn's events "
  + "(and after any internal-politics event), emit ONE final event titled exactly "
  + "\"Scheduled Events\" listing every future occurrence whose date is already "
  + "determined — elections, referendums, treaty and ultimatum deadlines, "
  + "scheduled withdrawals and handovers, conference dates, terms of office "
  + "expiring, announced offensives, plan target dates. One per line, in this "
  + "shape: \"<Name> (<whose>): <date>: in <time remaining>\" — for example "
  + "\"Next Election (France): 7 June 1941: in 3 days\" or \"Troop Withdrawal from "
  + "Romania: 11 July 1941: in 1 month 7 days\". Keep each line's description to "
  + "one short sentence at most. EVERYTHING GOES IN THE ONE CARD — never split "
  + "the calendar across several events. A polity that holds elections has at "
  + "least one entry (its next one). If genuinely nothing is scheduled, omit the "
  + "card entirely rather than printing an empty one. These dates are FORECASTS, "
  + "not promises: a scheduled thing can be brought forward, postponed or "
  + "cancelled by what happens, and when it moves, the next card shows the new "
  + "date. This card is a notice board — it carries no map changes, no transfers "
  + "and no impacts of any kind.";
