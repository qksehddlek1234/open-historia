const textSchema = (description) => ({
  type: "string",
  description,
});

const nonEmptyTextSchema = (description) => ({
  ...textSchema(description),
  minLength: 1,
});

const stringArraySchema = (description) => ({
  type: "array",
  description,
  items: { type: "string" },
});

const actionSchema = {
  type: "object",
  description: "One concrete action the player can take.",
  properties: {
    id: textSchema("Optional stable action identifier."),
    title: textSchema("Short display title for the action."),
    text: textSchema("Concrete, executable description of the action."),
    kind: textSchema('Action kind: usually "action", or "chat" only for a diplomatic conversation.'),
    invitees: stringArraySchema("Exact polity names invited when this is a chat action."),
    chatStarter: textSchema("Opening diplomatic message when this is a chat action."),
  },
  required: ["title", "text"],
  additionalProperties: false,
};

const chatCountrySchema = {
  type: "object",
  description: "A polity participating in a generated diplomatic chat.",
  properties: {
    code: textSchema("Polity's FULL country name (\"Spain\"), never a country code."),
    name: nonEmptyTextSchema("Exact polity name."),
  },
  required: ["name"],
  additionalProperties: false,
};

const chatMessageSchema = {
  type: "object",
  description: "An opening or follow-up message in a generated diplomatic chat.",
  properties: {
    code: textSchema("Speaker polity's FULL country name (\"Spain\"), never a country code."),
    role: textSchema("Message role, such as leader or system."),
    speaker: textSchema("Exact name of the speaker."),
    text: textSchema("Message body."),
    time: textSchema("In-game date or time, when relevant."),
  },
  required: ["text"],
  additionalProperties: false,
};

const createdChatSchema = {
  type: "object",
  description:
    "A diplomatic chat opened toward the player. The initiating polity ALWAYS "
    + "speaks first: title and openingMessage are required - a blank, untitled "
    + "chat tells the player nothing about why they were contacted.",
  properties: {
    id: textSchema("Optional stable chat identifier."),
    title: nonEmptyTextSchema("Short title naming the purpose of the chat (e.g. 'French mediation offer')."),
    countries: {
      type: "array",
      description: "Participating polities.",
      minItems: 1,
      items: chatCountrySchema,
    },
    messages: {
      type: "array",
      description: "Messages with which the chat begins.",
      items: chatMessageSchema,
    },
    openingMessage: nonEmptyTextSchema(
      "The initiating polity's first message, in its leader's voice - why it "
      + "reached out and what it wants. Never written as the player.",
    ),
    speaker: nonEmptyTextSchema("Name of the polity sending the opening message. Never the player's polity."),
    linkedEventId: textSchema("Optional event identifier linking this chat to its cause."),
    source: textSchema("Optional source label."),
    status: textSchema("Optional chat status."),
  },
  required: ["countries", "title", "speaker", "openingMessage"],
  additionalProperties: false,
};

const regionTransferSchema = {
  type: "object",
  description: "A transfer of one map region to a new polity owner.",
  properties: {
    regionId: textSchema(
      "Exact map region identifier when known; otherwise the region's plain name "
      + "(the engine resolves names to ids).",
    ),
    regionName: textSchema("Human-readable region name, when known."),
    fromCode: textSchema("Previous owner's FULL country name (\"Spain\"), never a country code."),
    toCode: textSchema("New owner's FULL country name (\"Spain\"), never a country code such as \"ESP\"."),
    note: textSchema("Brief reason for the transfer."),
    wholeCountry: {
      type: "boolean",
      description:
        "Set true ONLY for a total conquest, annexation, unification or partition in "
        + "which one polity takes EVERY region another still holds. Then put the losing "
        + "polity's name in regionId instead of a region name, and this single entry "
        + "transfers all of its territory. Leave unset (the normal case) to transfer "
        + "one named region.",
    },
  },
  required: ["regionId", "toCode"],
  additionalProperties: false,
};

// AI-authored updates to a country's PERSISTENT stat sheet (world.countryStats[code]).
// Only fields that CHANGED this period are sent; everything else persists. Absolute
// values, not deltas. Kept self-contained (no percentageSchema dep, which is defined
// later). LIVE via the tool schema, so it reaches existing frozen-prompt games.
const statPct = (description) => ({ type: "integer", minimum: 0, maximum: 100, description });
const statsUpdateSchema = {
  type: "object",
  description:
    "Updated national statistics for this polity. Include ONLY the fields that changed this period "
    + "(a coup changes leader/government/stability; a war changes reputation/economy) — every field you "
    + "omit keeps its previous value. Values are absolute, not deltas.",
  properties: {
    capital: textSchema("Capital, only when it changes."),
    continent: textSchema("Continent / broad region, only when it changes."),
    government: textSchema("Government system and ideology, only when it changes."),
    leader: textSchema("New leader as official title + name (\"대통령 블라디미르 푸틴\"), only when it changes."),
    stability: statPct("National stability 0-100."),
    indices: {
      type: "object",
      properties: {
        sovereignty: statPct("Practical political sovereignty."),
        foodAutonomy: statPct("Domestic food autonomy."),
        energyAutonomy: statPct("Domestic energy autonomy."),
        economicIndependence: statPct("Economic independence."),
        internalSecurity: statPct("Internal security."),
        internationalReputation: statPct("International reputation / standing."),
      },
      additionalProperties: false,
    },
    economy: {
      type: "object",
      properties: {
        gdp: textSchema("GDP estimate."),
        gdpGrowth: textSchema("Annual GDP growth estimate."),
        gdpPerCapita: textSchema("GDP per capita estimate."),
        currency: textSchema("Currency."),
        inflation: textSchema("Inflation estimate."),
        unemployment: textSchema("Unemployment estimate."),
        publicDebt: textSchema("Public debt estimate."),
        budgetBalance: textSchema("Budget balance estimate."),
      },
      additionalProperties: false,
    },
    gdpBreakdown: {
      type: "object",
      description: "Agriculture/industry/services shares — send all three together so they still sum to ~100.",
      properties: {
        agriculture: statPct("Agriculture share of GDP."),
        industry: statPct("Industry share of GDP."),
        services: statPct("Services share of GDP."),
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

// A country's standing behavioural profile (see runtime/countryPersonality.js).
// PARTIAL by design: send only the axes an event actually moved, since anything
// omitted keeps the value the country already had.
const personalityAxis = (description) => ({ type: "number", description, minimum: 0, maximum: 100 });

const personalitySchema = {
  type: "object",
  description:
    "How this country BEHAVES, 0-100 each, only for axes this event actually moved "
    + "(a coup, a defeat, a betrayal, a generational shift). Omit entirely when the "
    + "country's character did not change.",
  properties: {
    aggression: personalityAxis("0 = protests, 100 = reaches for force early."),
    riskTolerance: personalityAxis("0 = waits for a safe position, 100 = gambles on a bad one."),
    loyalty: personalityAxis("0 = abandons commitments when they cost, 100 = honours them at a price."),
    expansionism: personalityAxis("0 = content with its borders, 100 = wants more land."),
    vengefulness: personalityAxis("0 = writes wrongs off, 100 = answers them however late."),
  },
  additionalProperties: false,
};

const polityChangeSchema = {
  type: "object",
  description: "A creation, rename, recolor, or metadata change for a polity.",
  properties: {
    code: textSchema("Polity's exact FULL country name (\"Spain\"), never a country code."),
    name: textSchema("New polity name, only when it changes."),
    color: textSchema("New six-digit hexadecimal color, only when it changes."),
    aliases: stringArraySchema("Alternative polity names."),
    // The prompt asks for this and gameState normalizes/clamps/writes it, but it
    // was missing here — and additionalProperties:false means a json_schema
    // provider could never emit it, so international reputation silently never
    // moved. Declaring it is what actually connects that feature.
    reputation: {
      type: "number",
      description:
        "International reputation 0-100, only when it changes. 0 is a pariah state, 100 is universally trusted.",
    },
    tags: stringArraySchema(
      "The country's defining traits after this change — ideology, alignment, posture "
      + "(e.g. socialist, authoritarian, anti-nato). Only when they change: send the "
      + "COMPLETE new list, not a delta. A revolution or a change of alignment should "
      + "rewrite these.",
    ),
    note: textSchema("Brief reason for the change."),
    stats: statsUpdateSchema,
    personality: personalitySchema,
  },
  required: ["code"],
  additionalProperties: false,
};

// Exported so the engine can PRUNE a polity change down to what the schema
// allows instead of losing the whole turn to one invented field. Field report:
// "$.events[4].impacts.polityChanges[0].stats.economy.researchAndDevelopment is
// not allowed" — the model had finally started reporting real world changes, and
// the turn was discarded because one of the numbers it chose to report had no
// slot to go in.
export const POLITY_CHANGE_SCHEMA = polityChangeSchema;

const unitSchema = {
  type: "object",
  description: "A military unit to create on the map.",
  properties: {
    id: textSchema("Stable unit identifier."),
    name: nonEmptyTextSchema("Display name for the unit."),
    type: {
      type: "string",
      description: "Unit type.",
      enum: ["infantry", "armor", "air", "naval", "artillery", "garrison"],
    },
    ownerCode: nonEmptyTextSchema("Owning polity's FULL country name (\"Spain\"), never a country code."),
    strength: {
      type: "integer",
      description: "Unit strength from 1 to 1000.",
      minimum: 1,
      maximum: 1000,
    },
    lng: {
      type: "number",
      description: "Longitude of the unit location.",
      minimum: -180,
      maximum: 180,
    },
    lat: {
      type: "number",
      description: "Latitude of the unit location.",
      minimum: -90,
      maximum: 90,
    },
    regionId: textSchema("Map region identifier, when known."),
    status: {
      type: "string",
      description: "Optional unit status.",
      enum: ["idle", "moving", "engaged", "pending"],
    },
    note: textSchema("Brief operational note."),
  },
  // ONLY what the engine cannot do without. A spawn with no name or no strength is
  // one the normalizer fills in (a name from its owner and type, strength 100) —
  // but a `required` here is not a request, it is a condition for the WHOLE TURN
  // being accepted, and a nameless battalion used to discard every event beside it
  // and drop the player into a fallback turn. Ask for the rest in the descriptions,
  // where the cost of the model skipping one is a duller name and not a lost turn.
  required: ["type", "ownerCode", "lng", "lat"],
  additionalProperties: false,
};

const unitOpSchema = {
  description: "A unit mutation. Use op spawn, move, strength, or remove and fill the fields that op needs.",
  anyOf: [
    {
      type: "object",
      properties: {
        op: { type: "string", enum: ["spawn"] },
        unit: unitSchema,
        // Models attach a reason to the OP as often as to the unit, and this branch
        // forbade every property it had not listed — so a spawn with a one-line note
        // beside it matched no branch and took the turn down with it.
        note: textSchema("Brief explanation of the operation."),
        regionId: textSchema("Region the unit is raised in, when known."),
      },
      required: ["op", "unit"],
      additionalProperties: false,
    },
    // The same spawn, written FLAT. Models routinely put the unit's fields beside
    // `op` rather than nesting them under `unit`, and the engine has always read
    // that shape (normalizeUnitOp falls back to the entry itself). Only this schema
    // refused it — the identical hole that was already patched for markerOps.
    {
      type: "object",
      properties: {
        op: { type: "string", enum: ["spawn"] },
        id: textSchema("Stable unit identifier."),
        name: textSchema("Display name for the unit."),
        type: { type: "string", description: "Unit type.", enum: ["infantry", "armor", "air", "naval", "artillery", "garrison"] },
        ownerCode: nonEmptyTextSchema("Owning polity's FULL country name (\"Spain\"), never a country code."),
        strength: { type: "integer", description: "Unit strength from 1 to 1000.", minimum: 1, maximum: 1000 },
        lng: { type: "number", description: "Longitude.", minimum: -180, maximum: 180 },
        lat: { type: "number", description: "Latitude.", minimum: -90, maximum: 90 },
        regionId: textSchema("Map region identifier, when known."),
        note: textSchema("Brief operational note."),
      },
      required: ["op", "type", "ownerCode", "lng", "lat"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        op: { type: "string", enum: ["move"] },
        unitId: nonEmptyTextSchema("Existing unit identifier."),
        toLng: { type: "number", minimum: -180, maximum: 180 },
        toLat: { type: "number", minimum: -90, maximum: 90 },
        regionId: textSchema("Destination region identifier, when known."),
        note: textSchema("Brief explanation of the operation."),
      },
      // Coordinates are what actually MOVES the unit, and the description says so —
      // but a move that names only a destination region is one op the engine drops,
      // not a reason to throw away every other event in the turn.
      required: ["op", "unitId"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        op: { type: "string", enum: ["strength"] },
        unitId: nonEmptyTextSchema("Existing unit identifier."),
        strength: { type: "integer", minimum: 0, maximum: 1000 },
        note: textSchema("Brief explanation of the operation."),
      },
      required: ["op", "unitId", "strength"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        op: { type: "string", enum: ["remove"] },
        unitId: nonEmptyTextSchema("Existing unit identifier."),
        note: textSchema("Brief explanation of the operation."),
      },
      required: ["op", "unitId"],
      additionalProperties: false,
    },
  ],
};

const markerSchema = {
  type: "object",
  description:
    "A named structure on the map. kind is free-form lowercase - city, military base, "
    + "bunker, missile silo, embassy, port, airfield, factory, monument, or anything else.",
  properties: {
    id: textSchema("Stable marker identifier."),
    name: nonEmptyTextSchema("Display name of the structure."),
    kind: nonEmptyTextSchema("What the structure is, as a short lowercase noun phrase."),
    ownerCode: textSchema("Owning polity's FULL country name (\"Spain\") when owned, never a country code."),
    lng: {
      type: "number",
      description: "Longitude of the structure.",
      minimum: -180,
      maximum: 180,
    },
    lat: {
      type: "number",
      description: "Latitude of the structure.",
      minimum: -90,
      maximum: 90,
    },
    size: {
      type: "number",
      description: "Importance/scale of the structure: 0.5 minor, 1 normal, 2 major, 3 monumental. Drives its size on the map.",
      minimum: 0.5,
      maximum: 3,
    },
    regionId: textSchema("Map region the structure stands in, when known."),
    note: textSchema("Brief description shown when the structure is inspected."),
    foundedAt: textSchema("In-game date the structure was built or founded."),
  },
  // `kind` is asked for in its description and defaulted to "landmark" by the
  // normalizer when it is missing, so requiring it here only ever converted a
  // nameless category into a lost turn. Same reasoning as unitSchema above.
  required: ["name", "lng", "lat"],
  additionalProperties: false,
};

const markerOpSchema = {
  description: "A structure/place mutation. Use op build, remove, or rename and fill the fields that op needs.",
  anyOf: [
    {
      type: "object",
      properties: {
        op: { type: "string", enum: ["build"] },
        marker: markerSchema,
      },
      required: ["op", "marker"],
      additionalProperties: false,
    },
    // The same build, written flat. Models routinely put the structure's fields
    // beside `op` instead of nesting them under `marker`, and the engine has always
    // read that shape (normalizeMarkerOp falls back to the entry itself). Only this
    // schema refused it — and because a rejected op fails the WHOLE payload, one
    // flattened building threw away the entire turn and left the player with
    // fallback events. Accept what we already understand.
    {
      type: "object",
      properties: {
        op: { type: "string", enum: ["build"] },
        id: textSchema("Stable marker identifier."),
        name: nonEmptyTextSchema("Name of the structure or place."),
        kind: textSchema("What it is: city, base, bunker, silo, embassy, port."),
        ownerCode: textSchema("Owning polity's FULL country name (\"Spain\"), never a country code."),
        lng: { type: "number", description: "Longitude.", minimum: -180, maximum: 180 },
        lat: { type: "number", description: "Latitude.", minimum: -90, maximum: 90 },
        size: { type: "number", description: "Importance/scale: 0.5 minor, 1 normal, 2 major, 3 monumental.", minimum: 0.5, maximum: 3 },
        regionId: textSchema("Map region the structure stands in, when known."),
        note: textSchema("Brief explanation."),
      },
      required: ["op", "name", "lng", "lat"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        op: { type: "string", enum: ["remove"] },
        markerId: textSchema("Existing marker identifier, when known."),
        name: nonEmptyTextSchema("Name of the structure to remove."),
        note: textSchema("Brief explanation of the removal."),
      },
      required: ["op", "name"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        op: { type: "string", enum: ["rename"] },
        markerId: textSchema("Existing marker identifier, when known."),
        name: nonEmptyTextSchema("Current name of the structure or city to rename."),
        newName: nonEmptyTextSchema("New display name."),
        note: textSchema("Brief explanation of the rename."),
      },
      required: ["op", "name", "newName"],
      additionalProperties: false,
    },
  ],
};
// Exported for the same reason POLITY_CHANGE_SCHEMA is: so the engine can PRUNE an
// op down to what the schema allows rather than losing the whole turn to one
// unexpected field. Both are anyOf lists discriminated by `op`, so the pruner
// picks the branch by that and drops what the branch has no slot for.
export const OP_SCHEMAS = {
  markerOps: markerOpSchema,
  unitOps: unitOpSchema,
};

// The same treatment for lists that hang off the TOP of a jump result rather
// than off an event. Live: one actionOutcomes row missing its `outcome` failed
// the whole payload — "$.actionOutcomes[7].outcome is required" — and the turn
// fell back to a generation that had rated nothing. Populated after the schema
// it points at is defined; see the assignment below JUMP_FORWARD_SCHEMA.
export const TOP_LEVEL_ITEM_SCHEMAS = {};

const impactsSchema = {
  type: "object",
  description: "Optional structured world-state effects. Include only effect arrays that are relevant.",
  properties: {
    actionIds: stringArraySchema("Player action identifiers resolved by the event."),
    createdChats: {
      type: "array",
      description: "Diplomatic chats opened by the event.",
      items: createdChatSchema,
    },
    polityChanges: {
      type: "array",
      description: "Polity metadata changes.",
      items: polityChangeSchema,
    },
    regionTransfers: {
      type: "array",
      description:
        "Map ownership changes. REQUIRED whenever the event text says territory was "
        + "captured, occupied, annexed, ceded, liberated, or otherwise changed hands - "
        + "one entry per affected region, or the map will not match the story.",
      items: regionTransferSchema,
    },
    unitOps: {
      type: "array",
      description: "Military unit operations.",
      items: unitOpSchema,
    },
    markerOps: {
      type: "array",
      description:
        "Structures built or destroyed on the map. Use whenever the event founds, "
        + "constructs, or destroys a named place - a city, military base, bunker, "
        + "missile silo, embassy, port - so the map shows it.",
      items: markerOpSchema,
    },
  },
  additionalProperties: false,
};

const eventSchema = {
  type: "object",
  description: "One dated campaign event produced by a timeline simulation.",
  properties: {
    id: textSchema("Optional stable event identifier."),
    date: textSchema("In-game date on which the event occurs."),
    title: textSchema("Concise event headline."),
    description: textSchema("Specific narrative description and consequences."),
    importance: textSchema("Importance label, normally minor or major."),
    kind: textSchema("Event category, such as world, player, diplomacy, or military."),
    notable: {
      type: "boolean",
      description: "Whether this event is important enough to stop an automatic jump.",
    },
    playerRelated: {
      type: "boolean",
      description: "Whether the event directly concerns the player polity.",
    },
    impacts: impactsSchema,
  },
  required: ["date", "title", "description"],
  additionalProperties: false,
};

const catalystSchema = {
  type: "object",
  description: "An interactive catalyst scene offered to the player.",
  properties: {
    title: textSchema("Short catalyst title."),
    premise: textSchema("Stable premise and stakes of the scene."),
    opening: textSchema("Immersive opening state requiring player input."),
    choices: {
      type: "array",
      description: "Two to five distinct choices available to the player.",
      minItems: 2,
      maxItems: 5,
      items: nonEmptyTextSchema("One player choice."),
    },
  },
  required: ["title", "premise", "opening", "choices"],
  additionalProperties: false,
};

const nullableCatalystSchema = {
  anyOf: [catalystSchema, { type: "null" }],
};

export const ACTIONS_SCHEMA = {
  type: "object",
  description: "Strategic topics of concern and concrete actions available under each topic.",
  properties: {
    topics: {
      type: "array",
      description: "Current strategic topics of concern.",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          id: textSchema("Optional stable topic identifier."),
          title: textSchema("Short title naming the concern."),
          description: textSchema("Why the concern matters now."),
          horizon: {
            type: "string",
            enum: ["immediate", "long"],
            description: "Strategic horizon: \"immediate\" for this period's live crisis management, \"long\" for a multi-year national task.",
          },
          actions: {
            type: "array",
            description: "Concrete actions addressing this concern.",
            minItems: 1,
            items: actionSchema,
          },
        },
        required: ["title", "description", "actions"],
        additionalProperties: false,
      },
    },
  },
  required: ["topics"],
  additionalProperties: false,
};

export const JUMP_FORWARD_SCHEMA = {
  type: "object",
  description: "A simulated timeline jump containing dated events and the resulting campaign state.",
  properties: {
    events: {
      type: "array",
      description: "Events occurring during the simulated period.",
      items: eventSchema,
    },
    stopDate: textSchema("Date at which the simulation stops."),
    summary: textSchema("Concise summary of the period and its strategic consequences."),
    clearActions: {
      type: "boolean",
      description: "Whether planned player actions were resolved by this jump.",
    },
    catalyst: nullableCatalystSchema,
    diplomaticOutreach: {
      type: "array",
      description:
        "Polities reaching out to the player ON THEIR OWN initiative - treaty "
        + "feelers, trade proposals, warnings, summit invitations - not tied to "
        + "any single event. One-on-one or group. Empty when nobody would "
        + "plausibly reach out this period.",
      items: createdChatSchema,
    },
    // TOP LEVEL, NOT NESTED IN AN EVENT'S IMPACTS — and that is the whole point.
    //
    // It shipped nested first and came back empty: 0 of 15 orders rated on the
    // turn it went live. That is the third time this session the same shape has
    // failed the same way. polityChanges[].stats: nested, 0 of 28 rounds. The
    // campaign ledger and the stat-shift pass: flat top-level arrays, filled on
    // the first turn each. A 12B model fills a flat list and skips a nested
    // optional object, however the prompt asks.
    actionOutcomes: {
      type: "array",
      description:
        "How each of the player's queued orders that this period resolved actually came out. "
        + "One row per order. An order you leave out is taken as a clean success.",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "The order's id, exactly as given in the queued-orders list." },
          outcome: {
            type: "string",
            enum: ["succeeded", "partial", "failed", "backfired"],
            description:
              "succeeded: as ordered. partial: happened smaller, later or at a cost. failed: did not happen. "
              + "backfired: did not happen and cost something — carry the impact that makes that real.",
          },
          note: { type: "string", description: "Why, in one short clause." },
        },
        required: ["id", "outcome"],
        additionalProperties: false,
      },
    },
  },
  required: ["events", "stopDate", "summary", "clearActions"],
  additionalProperties: false,
};

export const AUTO_JUMP_FORWARD_SCHEMA = JUMP_FORWARD_SCHEMA;

// Backstory events deliberately have NO impacts field: the scenario's world
// state already reflects everything that happened before round one, so a
// pre-game event is a record, never a change to apply.
const pregameEventSchema = {
  type: "object",
  description: "One dated historical event from BEFORE the game's start date.",
  properties: {
    date: textSchema("Date the event occurred, strictly before the game start date."),
    title: textSchema("Concise event headline."),
    description: textSchema("Specific narrative description and its consequences."),
    importance: textSchema("Importance label, normally minor or major."),
    kind: textSchema("Event category, such as world, player, diplomacy, or military."),
  },
  required: ["date", "title", "description"],
  additionalProperties: false,
};

export const PREGAME_HISTORY_SCHEMA = {
  type: "object",
  description: "The pre-game backstory: the events that led up to the start of the campaign.",
  properties: {
    events: {
      type: "array",
      description: "Chronological events from before round one, oldest first.",
      minItems: 1,
      maxItems: 12,
      items: pregameEventSchema,
    },
    summary: textSchema("One-paragraph summary of the era leading into the start date."),
  },
  required: ["events", "summary"],
  additionalProperties: false,
};

// The idle-time diplomatic drip: while the player sits between jumps, a polity
// may send a short note to their inbox. `chat: null` means nobody plausibly
// would right now - silence is the common, correct answer.
export const IDLE_DIPLOMACY_SCHEMA = {
  type: "object",
  description: "At most one short unprompted diplomatic note to the player, or null for silence.",
  properties: {
    chat: {
      anyOf: [
        { type: "null", description: "No polity would plausibly reach out right now." },
        createdChatSchema,
      ],
    },
  },
  required: ["chat"],
  additionalProperties: false,
};

// Bookkeeping only: which already-written events carried out which queued orders.
// Split off from the jump itself because local models reliably write the events
// and just as reliably forget the ids inside them — asked on its own, with the
// events already in hand and nothing else to do, the same model gets it right.
export const ACTION_COVERAGE_SCHEMA = {
  type: "object",
  description: "Which of the player's queued orders each generated event carried out.",
  properties: {
    assignments: {
      type: "array",
      description: "One entry per event that carried out at least one queued order; events that carried out none are omitted.",
      items: {
        type: "object",
        properties: {
          eventNumber: {
            type: "integer",
            description: "The event's number in the numbered list provided.",
          },
          actionIds: stringArraySchema("Short ids (A1, A7, …) of the queued orders this event carried out."),
        },
        required: ["eventNumber", "actionIds"],
        additionalProperties: false,
      },
    },
  },
  required: ["assignments"],
  additionalProperties: false,
};

export const DESCRIPTION_TO_ACTION_SCHEMA = {
  type: "object",
  description: "One structured game command converted from the player's freeform intent.",
  properties: {
    title: textSchema("Short display title for the command."),
    text: textSchema("Expanded command with enough detail for timeline simulation."),
    kind: textSchema('Command kind: "action" unless the player explicitly asked to open a diplomatic chat.'),
    invitees: stringArraySchema("Exact polity names invited to a chat; empty for a normal action."),
    chatStarter: textSchema("Opening message for a chat; empty for a normal action."),
  },
  required: ["title", "text", "kind"],
  additionalProperties: false,
};

export const NEXT_SPEAKER_SCHEMA = {
  type: "object",
  description: "The exact participant who should speak next in the diplomatic chat.",
  properties: {
    nextSpeaker: textSchema("Exact name of one chat participant other than the most recent speaker."),
  },
  required: ["nextSpeaker"],
  additionalProperties: false,
};

export const EVENT_CONSOLIDATOR_SCHEMA = {
  type: "object",
  description: "A continuity-safe summary of the supplied events and diplomatic chats.",
  properties: {
    summary: textSchema("Concise campaign history preserving major events, map changes, and diplomatic commitments."),
    // OPTIONAL, AND DELIBERATELY SO. The consolidator's prompt is frozen per
    // campaign, so a game already in progress will keep answering with only a
    // summary — and must stay valid when it does. The ledger instruction is
    // appended at call time; a model that heeds it gets its facts kept, and one
    // that does not still consolidates exactly as before.
    ledger: {
      type: "array",
      description: "Standing facts, keyed so a later round updates them instead of appending. Fact \"-\" retires a key.",
      items: {
        type: "object",
        properties: {
          key: textSchema("Stable slug, e.g. leader:south-korea or treaty:kr-us-thaad."),
          topic: textSchema("One of leader, territory, treaty, war, programme, relation, crisis, economy."),
          fact: textSchema("One line of what is true now. \"-\" retires the key."),
        },
        required: ["key", "fact"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary"],
  additionalProperties: false,
};

export const CATALYST_CREATION_SCHEMA = catalystSchema;

export const CATALYST_EXECUTOR_SCHEMA = {
  type: "object",
  description: "The next stage of an active catalyst after applying the player's choice.",
  properties: {
    summary: textSchema("Narration of the player's action, reactions, and resulting situation."),
    resolved: {
      type: "boolean",
      description: "Whether the catalyst has reached a definite conclusion.",
    },
    nextChoices: {
      type: "array",
      description: "Two to five choices for an unresolved next stage; empty when resolved.",
      maxItems: 5,
      items: nonEmptyTextSchema("One player choice."),
    },
  },
  required: ["summary", "resolved", "nextChoices"],
  additionalProperties: false,
};

export const CATALYST_SUMMARY_SCHEMA = {
  type: "object",
  description: "A resolved catalyst condensed into one campaign timeline event.",
  properties: {
    title: textSchema("Concise event headline."),
    description: textSchema("Complete but concise account of the catalyst outcome."),
    importance: textSchema("Event importance, normally major."),
  },
  required: ["title", "description", "importance"],
  additionalProperties: false,
};

export const GAME_MASTER_SCHEMA = {
  type: "object",
  description: "A direct game-master intervention and its structured world-state changes.",
  properties: {
    summary: textSchema("Concise account of how the GM request changed the world."),
    impacts: impactsSchema,
  },
  required: ["summary", "impacts"],
  additionalProperties: false,
};

const percentageSchema = (description) => ({
  type: "integer",
  description,
  minimum: 0,
  maximum: 100,
});

export const COUNTRY_STAT_SHEET_SCHEMA = {
  type: "object",
  description: "A complete national statistics sheet for the selected polity.",
  properties: {
    capital: nonEmptyTextSchema("Capital or primary seat of government."),
    continent: nonEmptyTextSchema("Continent or broad geographic region."),
    government: nonEmptyTextSchema("Government system and ideology."),
    leader: nonEmptyTextSchema("The person who actually runs the government — official title + one real name (\"대통령 블라디미르 푸틴\"), one person."),
    // The rest of the leadership picture: a ceremonial head of state above the
    // leader (monarch, figurehead president) and the second-in-command below
    // (vice president, prime minister under a president). REQUIRED, because an
    // optional field simply does not get filled (the 12B pattern, measured
    // again in round 8: every regenerated sheet came back missing both) — with
    // the sentinels "(없음)" / "(미확인)" as the honest ways out, which the
    // engine and the pane render as a blank row.
    headOfState: nonEmptyTextSchema("Ceremonial/formal head of state when DIFFERENT from the leader, as official title + name (\"국왕 하랄 5세\", \"천황 아키히토\"). When the leader IS the head of state, or the system has no such role, write exactly \"(없음)\"; when the office exists but the holder is unknown, \"(미확인)\"."),
    deputy: nonEmptyTextSchema("The second-ranking figure, as official title + name (\"부통령 조 바이든\", \"국무총리 황교안\"). When the system has no such office, write exactly \"(없음)\"; when the holder is unknown, \"(미확인)\"."),
    stability: percentageSchema("National stability from 0 to 100."),
    indices: {
      type: "object",
      properties: {
        sovereignty: percentageSchema("Practical political sovereignty."),
        foodAutonomy: percentageSchema("Domestic food autonomy."),
        energyAutonomy: percentageSchema("Domestic energy autonomy."),
        economicIndependence: percentageSchema("Economic independence."),
        internalSecurity: percentageSchema("Internal security."),
        internationalReputation: percentageSchema("International reputation / standing (0-100)."),
      },
      required: ["sovereignty", "foodAutonomy", "energyAutonomy", "economicIndependence", "internalSecurity", "internationalReputation"],
      additionalProperties: false,
    },
    economy: {
      type: "object",
      properties: {
        gdp: nonEmptyTextSchema("Era-appropriate gross domestic product estimate."),
        gdpGrowth: nonEmptyTextSchema("Annual GDP growth estimate."),
        gdpPerCapita: nonEmptyTextSchema("Era-appropriate GDP per capita estimate."),
        currency: nonEmptyTextSchema("Currency or dominant medium of exchange."),
        inflation: nonEmptyTextSchema("Inflation estimate."),
        unemployment: nonEmptyTextSchema("Unemployment estimate."),
        publicDebt: nonEmptyTextSchema("Public debt estimate."),
        budgetBalance: nonEmptyTextSchema("Budget surplus or deficit estimate."),
      },
      required: ["gdp", "gdpGrowth", "gdpPerCapita", "currency", "inflation", "unemployment", "publicDebt", "budgetBalance"],
      additionalProperties: false,
    },
    gdpBreakdown: {
      type: "object",
      properties: {
        agriculture: percentageSchema("Agriculture share of GDP."),
        industry: percentageSchema("Industry share of GDP."),
        services: percentageSchema("Services share of GDP."),
      },
      required: ["agriculture", "industry", "services"],
      additionalProperties: false,
    },
  },
  required: ["capital", "continent", "government", "leader", "headOfState", "deputy", "stability", "indices", "economy", "gdpBreakdown"],
  additionalProperties: false,
};

// WHAT THIS PERIOD DID TO THE NUMBERS.
//
// A separate, deliberately FLAT answer, because the nested one does not get
// filled. polityChanges[].stats has a flat member (stability) and nested ones
// (economy, indices); over 28 measured rounds the flat member was written 17
// times and the nested ones never. So this asks for a list of rows — country,
// field name, new value, why — and the engine puts each row where it belongs.
// See runtime/countryStatLedger.js for the field catalogue and the measurements.
export const COUNTRY_STAT_SHIFT_SCHEMA = {
  type: "object",
  properties: {
    changes: {
      type: "array",
      description:
        "One row per statistic this period actually moved. Return an EMPTY array when a period "
        + "changed nothing measurable — that is a normal answer, not a failure.",
      items: {
        type: "object",
        properties: {
          code: { type: "string", description: "The polity, named exactly as it appears in the events." },
          field: {
            type: "string",
            description: "Which statistic moved. Must be one of the field names listed in the prompt, spelled exactly.",
          },
          value: {
            type: "string",
            description:
              "The NEW value in full, never a change or a delta: \"38\" for a 0-100 standing, "
              + "\"1,340조 원\" for a money figure. Absolute, with its unit, and nothing else.",
          },
          reason: {
            type: "string",
            description: "The event from this period that moved it, in one short clause.",
          },
        },
        required: ["code", "field", "value"],
        additionalProperties: false,
      },
    },
  },
  required: ["changes"],
  additionalProperties: false,
};

TOP_LEVEL_ITEM_SCHEMAS.actionOutcomes = JUMP_FORWARD_SCHEMA.properties.actionOutcomes.items;
TOP_LEVEL_ITEM_SCHEMAS.diplomaticOutreach = JUMP_FORWARD_SCHEMA.properties.diplomaticOutreach.items;

// The dedicated rating pass. actionOutcomes has lived in the jump schema as an
// optional top-level list, and measured across two full turns the model left it
// empty both times while resolving 31 orders — the same 12B pattern that froze
// the stat sheet for 27 rounds until the question got its own flat pass. Same
// remedy: after the turn's events are settled, ONE small task whose entire
// output is this list.
export const ORDER_OUTCOME_RATING_SCHEMA = {
  type: "object",
  properties: {
    outcomes: {
      type: "array",
      description: "One row per order id listed in the prompt. An id left out is taken as a clean success.",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "The order's id, exactly as listed." },
          outcome: {
            type: "string",
            enum: ["succeeded", "partial", "failed", "backfired"],
            description:
              "succeeded: as ordered. partial: happened smaller, later or at a cost. failed: did not happen. "
              + "backfired: did not happen and made something worse.",
          },
          note: { type: "string", description: "Why, in one short clause." },
        },
        required: ["id", "outcome"],
        additionalProperties: false,
      },
    },
  },
  required: ["outcomes"],
  additionalProperties: false,
};

// The relations pass — same shape discipline as the rating pass: one flat
// required list, absolute levels, nothing else to fill.
export const DIPLOMATIC_RELATIONS_SCHEMA = {
  type: "object",
  properties: {
    relations: {
      type: "array",
      description: "The player's standing with each listed country AS IT NOW STANDS. Restate unchanged ones or leave them out; both mean no change.",
      items: {
        type: "object",
        properties: {
          country: { type: "string", description: "The country's name, exactly as listed." },
          level: {
            type: "string",
            enum: ["allied", "friendly", "neutral", "tense", "hostile"],
            description: "The standing as it now is — absolute, never a change.",
          },
          note: { type: "string", description: "What defines the standing right now, one short clause." },
        },
        required: ["country", "level"],
        additionalProperties: false,
      },
    },
  },
  required: ["relations"],
  additionalProperties: false,
};

// The outreach pass — the next field to earn this remedy. diplomaticOutreach
// has lived in the jump schema as an optional top-level list, and the live
// campaign's whole record after 42 rounds was FOUR chats, ONE of them
// AI-initiated ("요즘 들어서 AI들이 선 채팅을 안치는거 같네" — the player,
// noticing). Same 12B pattern (actionOutcomes, countryStatShift,
// diplomaticRelations), same remedy: one small task whose entire output is
// the question "who approaches the player this period, and why".
export const DIPLOMATIC_OUTREACH_PASS_SCHEMA = {
  type: "object",
  properties: {
    outreach: {
      type: "array",
      description:
        "Powers approaching the player ON THEIR OWN initiative this period. "
        + "Empty when this period gave nobody a concrete reason.",
      items: {
        type: "object",
        properties: {
          country: { type: "string", description: "The approaching polity, copied EXACTLY as listed." },
          title: { type: "string", description: "Short subject of the approach." },
          message: { type: "string", description: "The opening message, in that government's own voice." },
          reason: { type: "string", description: "The this-period event or standing that motivates it, one clause." },
        },
        required: ["country", "title", "message", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["outreach"],
  additionalProperties: false,
};

export const GAMEPLAY_SCHEMAS = Object.freeze({
  orderOutcomeRating: ORDER_OUTCOME_RATING_SCHEMA,
  diplomaticRelations: DIPLOMATIC_RELATIONS_SCHEMA,
  diplomaticOutreachPass: DIPLOMATIC_OUTREACH_PASS_SCHEMA,
  countryStatShift: COUNTRY_STAT_SHIFT_SCHEMA,
  actions: ACTIONS_SCHEMA,
  jumpForward: JUMP_FORWARD_SCHEMA,
  autoJumpForward: AUTO_JUMP_FORWARD_SCHEMA,
  descriptionToAction: DESCRIPTION_TO_ACTION_SCHEMA,
  nextSpeaker: NEXT_SPEAKER_SCHEMA,
  eventConsolidator: EVENT_CONSOLIDATOR_SCHEMA,
  catalystCreation: CATALYST_CREATION_SCHEMA,
  catalystExecutor: CATALYST_EXECUTOR_SCHEMA,
  catalystSummary: CATALYST_SUMMARY_SCHEMA,
  gameMaster: GAME_MASTER_SCHEMA,
  countryStatSheet: COUNTRY_STAT_SHEET_SCHEMA,
  idleDiplomacy: IDLE_DIPLOMACY_SCHEMA,
  pregameHistory: PREGAME_HISTORY_SCHEMA,
  actionCoverage: ACTION_COVERAGE_SCHEMA,
});

const makeTool = (name, description, schema) => Object.freeze({ name, description, schema });

export const ACTIONS_TOOL = makeTool(
  "submit_actions",
  "Submit strategic topics of concern and their suggested player actions.",
  ACTIONS_SCHEMA,
);

export const JUMP_FORWARD_TOOL = makeTool(
  "submit_jump_result",
  "Submit the events, stop date, summary, resolved-action state, and optional catalyst from a timeline jump.",
  JUMP_FORWARD_SCHEMA,
);

export const AUTO_JUMP_FORWARD_TOOL = makeTool(
  "submit_jump_result",
  "Submit the events and result of an automatic timeline jump that stops at the next notable moment.",
  AUTO_JUMP_FORWARD_SCHEMA,
);

export const DESCRIPTION_TO_ACTION_TOOL = makeTool(
  "submit_description_to_action",
  "Submit the structured action or diplomatic chat command derived from the player's freeform intent.",
  DESCRIPTION_TO_ACTION_SCHEMA,
);

export const NEXT_SPEAKER_TOOL = makeTool(
  "submit_next_speaker",
  "Submit the exact diplomatic chat participant who should speak next.",
  NEXT_SPEAKER_SCHEMA,
);

export const EVENT_CONSOLIDATOR_TOOL = makeTool(
  "submit_event_consolidation",
  "Submit a concise continuity summary of the supplied campaign events and chats.",
  EVENT_CONSOLIDATOR_SCHEMA,
);

export const CATALYST_CREATION_TOOL = makeTool(
  "submit_catalyst_creation",
  "Submit a new interactive catalyst scene and the choices available to the player.",
  CATALYST_CREATION_SCHEMA,
);

export const CATALYST_EXECUTOR_TOOL = makeTool(
  "submit_catalyst_execution",
  "Submit the result of the player's catalyst choice and either new choices or a resolved state.",
  CATALYST_EXECUTOR_SCHEMA,
);

export const CATALYST_SUMMARY_TOOL = makeTool(
  "submit_catalyst_summary",
  "Submit the final campaign event produced by a resolved catalyst.",
  CATALYST_SUMMARY_SCHEMA,
);

export const GAME_MASTER_TOOL = makeTool(
  "submit_game_master",
  "Submit the summary and structured map or world-state effects of a game-master request.",
  GAME_MASTER_SCHEMA,
);

export const COUNTRY_STAT_SHEET_TOOL = makeTool(
  "submit_country_stat_sheet",
  "Submit the complete validated national statistics sheet.",
  COUNTRY_STAT_SHEET_SCHEMA,
);

export const IDLE_DIPLOMACY_TOOL = makeTool(
  "submit_idle_diplomacy",
  "Submit at most one short unprompted diplomatic note to the player, or null for silence.",
  IDLE_DIPLOMACY_SCHEMA,
);

export const PREGAME_HISTORY_TOOL = makeTool(
  "submit_pregame_history",
  "Submit the pre-game backstory events that led up to the campaign's start date.",
  PREGAME_HISTORY_SCHEMA,
);

export const ACTION_COVERAGE_TOOL = makeTool(
  "submit_action_coverage",
  "Submit which generated events carried out which of the player's queued orders.",
  ACTION_COVERAGE_SCHEMA,
);

export const COUNTRY_STAT_SHIFT_TOOL = makeTool(
  "submit_stat_shifts",
  "Submit the national statistics this period moved, one flat row per statistic.",
  COUNTRY_STAT_SHIFT_SCHEMA,
);

export const GAMEPLAY_TOOLS = Object.freeze({
  countryStatShift: COUNTRY_STAT_SHIFT_TOOL,
  actions: ACTIONS_TOOL,
  jumpForward: JUMP_FORWARD_TOOL,
  autoJumpForward: AUTO_JUMP_FORWARD_TOOL,
  descriptionToAction: DESCRIPTION_TO_ACTION_TOOL,
  nextSpeaker: NEXT_SPEAKER_TOOL,
  eventConsolidator: EVENT_CONSOLIDATOR_TOOL,
  catalystCreation: CATALYST_CREATION_TOOL,
  catalystExecutor: CATALYST_EXECUTOR_TOOL,
  catalystSummary: CATALYST_SUMMARY_TOOL,
  gameMaster: GAME_MASTER_TOOL,
  countryStatSheet: COUNTRY_STAT_SHEET_TOOL,
  idleDiplomacy: IDLE_DIPLOMACY_TOOL,
  pregameHistory: PREGAME_HISTORY_TOOL,
  actionCoverage: ACTION_COVERAGE_TOOL,
});

export const getGameplayTool = (taskKey) => GAMEPLAY_TOOLS[taskKey] ?? null;

// A tool schema is sent with EVERY request and counts against the context window
// like any other text. The jump schema's prose descriptions came to 18.6 KB —
// a fifth of the whole request — on a 32k-token window where the prompt already
// left barely 2,000 tokens to write the turn in, which is what kept ending turns
// as "no parseable JSON" and canned fallbacks. The rules those descriptions carry
// are stated more forcefully in the prompt itself ([Actions You Can Take], the
// per-order duty list), so the wire copy keeps the STRUCTURE — properties, types,
// enums, required — and drops the prose. Measured: 18,591 -> 7,816 characters.
// Validation is unaffected: it runs against the full schema, not this copy.
export const slimSchemaForWire = (node) => {
  if (Array.isArray(node)) return node.map((entry) => slimSchemaForWire(entry));
  if (!node || typeof node !== "object") return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    // Descriptions are dropped wholesale: with tool_choice forcing the call, the
    // grammar is built from types, enums and `required` — the prose steers
    // nothing that the prompt is not already saying, and it costs a third of the
    // schema's size.
    if (key === "description" && typeof value === "string") continue;
    out[key] = slimSchemaForWire(value);
  }
  return out;
};

export const getSlimGameplayTool = (taskKey) => {
  const tool = GAMEPLAY_TOOLS[taskKey];
  if (!tool) return null;
  return { ...tool, schema: slimSchemaForWire(tool.schema) };
};

const valueType = (value) => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
};

const propertyPath = (path, key) =>
  /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`;

export const validateAgainstSchema = (schema, value, path) => {
  if (Array.isArray(schema.anyOf)) {
    const errors = schema.anyOf.map((candidate) => validateAgainstSchema(candidate, value, path));
    if (errors.some((error) => !error)) return "";
    return `${path} did not match any allowed schema: ${errors.join(" ")}`;
  }

  const actualType = valueType(value);
  const typeMatches = schema.type === "integer"
    ? actualType === "number" && Number.isInteger(value)
    : !schema.type || actualType === schema.type;
  if (!typeMatches) {
    return `${path} must be ${schema.type}; received ${valueType(value)}.`;
  }

  if ((schema.type === "number" || schema.type === "integer") && !Number.isFinite(value)) {
    return `${path} must be a finite number.`;
  }

  if ((schema.type === "number" || schema.type === "integer") && Number.isFinite(schema.minimum) && value < schema.minimum) {
    return `${path} must be at least ${schema.minimum}.`;
  }

  if ((schema.type === "number" || schema.type === "integer") && Number.isFinite(schema.maximum) && value > schema.maximum) {
    return `${path} must be at most ${schema.maximum}.`;
  }

  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    return `${path} must be one of ${schema.enum.map((entry) => JSON.stringify(entry)).join(", ")}.`;
  }

  if (schema.type === "string" && Number.isFinite(schema.minLength) && value.length < schema.minLength) {
    return `${path} must contain at least ${schema.minLength} character${schema.minLength === 1 ? "" : "s"}.`;
  }

  if (schema.type === "array") {
    if (Number.isFinite(schema.minItems) && value.length < schema.minItems) {
      return `${path} must contain at least ${schema.minItems} item${schema.minItems === 1 ? "" : "s"}.`;
    }
    if (Number.isFinite(schema.maxItems) && value.length > schema.maxItems) {
      return `${path} must contain at most ${schema.maxItems} items.`;
    }

    for (let index = 0; index < value.length; index += 1) {
      const error = validateAgainstSchema(schema.items ?? {}, value[index], `${path}[${index}]`);
      if (error) return error;
    }
  }

  if (schema.type === "object") {
    const properties = schema.properties ?? {};

    for (const key of schema.required ?? []) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        return `${propertyPath(path, key)} is required.`;
      }
    }

    for (const [key, entry] of Object.entries(value)) {
      const childSchema = properties[key];
      if (!childSchema) {
        if (schema.additionalProperties === false) {
          return `${propertyPath(path, key)} is not allowed.`;
        }
        continue;
      }

      const error = validateAgainstSchema(childSchema, entry, propertyPath(path, key));
      if (error) return error;
    }
  }

  return "";
};

const hasMeaningfulCatalyst = (value) =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  ([value.title, value.premise, value.opening].some(
    (entry) => typeof entry === "string" && entry.trim().length > 0,
  ) ||
    (Array.isArray(value.choices) && value.choices.length > 0));

const validateDistinctChoices = (choices, path) => {
  const normalized = choices.map((choice) => choice.trim().toLocaleLowerCase());
  const blankIndex = normalized.findIndex((choice) => !choice);
  if (blankIndex >= 0) return `${path}[${blankIndex}] must not be blank.`;
  if (new Set(normalized).size !== normalized.length) return `${path} must contain distinct choices.`;
  return "";
};

const findBlankString = (value, path = "$") => {
  if (typeof value === "string") return value.trim() ? "" : `${path} must not be blank.`;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const error = findBlankString(value[index], `${path}[${index}]`);
      if (error) return error;
    }
  } else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      const error = findBlankString(entry, propertyPath(path, key));
      if (error) return error;
    }
  }
  return "";
};

export const validateGameplayPayload = (taskKey, value) => {
  const schema = GAMEPLAY_SCHEMAS[taskKey];
  if (!schema) {
    return {
      valid: false,
      error: `Unknown gameplay task key: ${String(taskKey)}.`,
    };
  }

  const error = validateAgainstSchema(schema, value, "$");
  if (error) {
    return { valid: false, error };
  }

  if (taskKey === "jumpForward" || taskKey === "autoJumpForward") {
    if (!value.stopDate.trim()) {
      return { valid: false, error: "$.stopDate must not be empty." };
    }
    for (let index = 0; index < value.events.length; index += 1) {
      const event = value.events[index];
      for (const field of ["date", "title", "description"]) {
        if (!event[field].trim()) {
          return { valid: false, error: `$.events[${index}].${field} must not be empty.` };
        }
      }
    }
    const hasEvents = value.events.length > 0;
    const hasSummary = value.summary.trim().length > 0;
    if (!hasEvents && !hasSummary && !hasMeaningfulCatalyst(value.catalyst)) {
      return {
        valid: false,
        error: "Jump payload must contain at least one event, a nonempty summary, or a meaningful catalyst.",
      };
    }
    if (value.catalyst) {
      const catalystError = validateDistinctChoices(value.catalyst.choices, "$.catalyst.choices");
      if (catalystError) return { valid: false, error: catalystError };
    }
  }

  if (taskKey === "pregameHistory") {
    for (let index = 0; index < value.events.length; index += 1) {
      const event = value.events[index];
      for (const field of ["date", "title", "description"]) {
        if (!event[field].trim()) {
          return { valid: false, error: `$.events[${index}].${field} must not be empty.` };
        }
      }
    }
    if (!value.summary.trim()) {
      return { valid: false, error: "$.summary must not be empty." };
    }
  }

  const requiredTextByTask = {
    descriptionToAction: ["title", "text", "kind"],
    nextSpeaker: ["nextSpeaker"],
    eventConsolidator: ["summary"],
    catalystCreation: ["title", "premise", "opening"],
    catalystExecutor: ["summary"],
    catalystSummary: ["title", "description", "importance"],
    gameMaster: ["summary"],
  };
  for (const field of requiredTextByTask[taskKey] ?? []) {
    if (!value[field].trim()) {
      return { valid: false, error: `$.${field} must not be empty.` };
    }
  }

  if (taskKey === "catalystCreation") {
    const choiceError = validateDistinctChoices(value.choices, "$.choices");
    if (choiceError) return { valid: false, error: choiceError };
  }

  if (taskKey === "catalystExecutor") {
    if (value.resolved && value.nextChoices.length !== 0) {
      return { valid: false, error: "$.nextChoices must be empty when $.resolved is true." };
    }
    if (!value.resolved && value.nextChoices.length < 2) {
      return { valid: false, error: "$.nextChoices must contain between 2 and 5 choices while unresolved." };
    }
    const choiceError = validateDistinctChoices(value.nextChoices, "$.nextChoices");
    if (choiceError) return { valid: false, error: choiceError };
  }

  if (taskKey === "countryStatSheet") {
    const blankError = findBlankString(value);
    if (blankError) return { valid: false, error: blankError };
    const breakdown = value.gdpBreakdown;
    if (breakdown.agriculture + breakdown.industry + breakdown.services !== 100) {
      return { valid: false, error: "$.gdpBreakdown percentages must sum to 100." };
    }
  }

  if (taskKey === "actions") {
    for (let topicIndex = 0; topicIndex < value.topics.length; topicIndex += 1) {
      const topic = value.topics[topicIndex];
      if (!topic.title.trim()) return { valid: false, error: `$.topics[${topicIndex}].title must not be empty.` };
      for (let actionIndex = 0; actionIndex < topic.actions.length; actionIndex += 1) {
        const action = topic.actions[actionIndex];
        if (!action.title.trim() || !action.text.trim()) {
          return { valid: false, error: `$.topics[${topicIndex}].actions[${actionIndex}] must have nonempty title and text.` };
        }
      }
    }
  }

  return { valid: true, error: "" };
};
