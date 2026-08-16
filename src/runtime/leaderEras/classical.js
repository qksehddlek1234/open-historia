/*! Open Historia — officeholders on record, 1–999 AD © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Era pack: antiquity and the early middle ages, 0001-01-01 → 0999-12-31.
//
// THE RECORD USED TO STOP AT 1000 AD, AND THE FLEET'S OLDEST BOARD FELL OFF IT.
// The four packs beside this one begin with high-medieval/1000, so roman-117 —
// the empire at its greatest extent, thirteen polities — seeded ONE leader out
// of thirteen, and that one was worse than a miss: "Han Dynasty" found nothing,
// fell through to its own alias "China", and matched a row in the MODERN table
// whose window is unbounded, so Emperor An of Han was recorded as having a head
// of state of "(없음)". Twelve empty thrones and one wrong one, on a board whose
// whole subject is who rules what.
//
// Conventions and doctrine as leaderReference.js and the packs beside this one:
//
//   • ONLY WHAT IS ON RECORD. A ruler whose seat in this decade is agreed gets
//     named; a seat that is genuinely disputed, unrecorded, or had no single
//     holder gets its INSTITUTION instead — the Ragusa precedent. This matters
//     more here than in any later pack, because for half of this world the
//     king lists are reconstructions: Aksum before GDRT, Meroe's 2nd century,
//     Funan before Fan Shiman, the northern Xiongnu after 91. Naming a plausible
//     king for any of those would be inventing history that the model would then
//     repeat as fact, and it would be indistinguishable from the real ones
//     beside it.
//   • THE ERA'S OWN TITLE, in Korean, as the period gave it — 황제·샤한샤·
//     왕중왕·선우·태조대왕.
//   • The deputy slot carries whoever actually governed where that is the
//     historically interesting fact: the Dowager Deng behind Han's boy emperor,
//     Hadrian holding Syria while Trajan campaigned east of it.
export const ERA = { key: "classical", from: "0001-01-01", until: "0999-12-31" };

export const REFERENCE = {
  // ---- Rome and Parthia ------------------------------------------------------------
  "Roman Empire": {
    // The board opens on 1 January 117 and Trajan has seven months to live —
    // he dies at Selinus in August and Hadrian is acclaimed in Antioch two days
    // later. Both windows are here so a campaign that runs past August gets the
    // succession from the record instead of from the model.
    leader: [
      { name: "황제 트라야누스 (옵티무스 프린켑스)", from: "0098-01-28", until: "0117-08-09" },
      { name: "황제 하드리아누스", from: "0117-08-11", until: "0138-07-10" },
    ],
    // Hadrian is governor of Syria on this date, holding the empire's eastern
    // command while Trajan is in Mesopotamia — the man behind the throne in the
    // literal sense, and the reason the succession went the way it did.
    deputy: [
      { name: "시리아 총독 하드리아누스 (동방 사령)", from: "0117-01-01", until: "0117-08-09" },
    ],
  },
  "Parthian Empire": {
    // Two kings and a Roman puppet. Osroes I holds the west against Vologases III
    // in the east through this whole period, and on top of that Trajan crowned
    // Parthamaspates in Ctesiphon in 116 — a client king who is expelled within
    // a year of Trajan's death. The double election is written into the name, as
    // the high-medieval pack does for Philip and Otto: the split IS the state of
    // Parthia in 117, not a detail about it.
    leader: [
      {
        name: "샤한샤 오스로에스 1세 (크테시폰은 트라야누스가 세운 파르타마스파테스가 쥐고 있고, 동부는 볼로가세스 3세가 다툰다)",
        from: "0109-01-01",
        until: "0129-12-31",
      },
      { name: "샤한샤 볼로가세스 3세", from: "0129-12-31", until: "0147-12-31" },
    ],
  },

  // ---- The east --------------------------------------------------------------------
  "Kushan Empire": {
    // Kushan chronology is argued in decades, not years — the Rabatak
    // inscription fixed the ORDER of the kings and Falk's reading puts
    // Kanishka's accession at 127. Who sits in 117 is agreed even where the
    // exact regnal years are not, so the name stands and the softness is here
    // in the comment rather than smuggled into a false precision.
    leader: [
      { name: "왕중왕 비마 카드피세스", from: "0113-01-01", until: "0127-01-01" },
      { name: "왕중왕 카니슈카 1세", from: "0127-01-01", until: "0150-01-01" },
    ],
  },
  "Han Dynasty": {
    leader: [
      { name: "황제 안제 (유호)", from: "0106-09-23", until: "0125-04-30" },
    ],
    // The emperor is twelve in 117 and does not govern. The Dowager Deng Sui
    // holds the court until her death in 121 — this is the fact about Han China
    // in this decade, and the deputy slot exists for exactly it.
    deputy: [
      { name: "등태후 (섭정)", from: "0106-09-23", until: "0121-04-17" },
    ],
  },
  Goguryeo: {
    // Taejo's reign as the Samguk Sagi gives it — 53 to 146, which is long
    // enough that historians read it as more than one king's worth of years
    // compressed into one name. It is nonetheless the record, and 117 sits well
    // inside it.
    leader: [
      { name: "태조대왕", from: "0053-01-01", until: "0146-01-01" },
    ],
  },
  Xiongnu: {
    // The northern Xiongnu were broken at Ikh Bayan in 91 and the chanyu who
    // followed are not on record — the Chinese histories lose sight of them
    // westward. The southern chanyu Tandi is recorded, but he is a Han vassal
    // inside the frontier, not the steppe power this board puts in Mongolia.
    // So: the office, and the reason it is empty.
    leader: [
      { name: "선우 (북흉노 — 91년 패주 이후 재위자가 기록에 없다)", from: "0091-01-01", until: "0155-12-31" },
    ],
  },
  Anuradhapura: {
    // Sri Lanka keeps the best king list in this pack. The Mahavamsa runs
    // Vasabha → Vankanasika Tissa → Gajabahu I without a gap, and 117 is three
    // years into Gajabahu's reign.
    leader: [
      { name: "왕 바사바", from: "0067-01-01", until: "0111-01-01" },
      { name: "왕 반카나시카 티사", from: "0111-01-01", until: "0114-01-01" },
      { name: "왕 가자바후 1세", from: "0114-01-01", until: "0136-01-01" },
    ],
  },
  Funan: {
    // The Chinese envoys who describe Funan arrive in the 3rd century and the
    // first ruler they name is Fan Shiman. Everything before him — Kaundinya,
    // Hun P'an-huang — comes from foundation legend, and the 2nd-century throne
    // has no holder anyone can name.
    leader: [
      { name: "푸난의 왕 (2세기 재위자는 기록에 없다 — 이름이 남는 첫 왕은 3세기의 판시만)", from: "0001-01-01", until: "0205-01-01" },
      { name: "왕 판시만", from: "0205-01-01", until: "0225-01-01" },
    ],
  },

  // ---- The Caucasus, Arabia and Africa ---------------------------------------------
  "Kingdom of Iberia": {
    // Pharasmanes, the king who refused Hadrian's summons and later received
    // Antoninus Pius' embassy. The Georgian chronicles and the classical sources
    // number him differently (II in the Roman-facing literature, III in the
    // Kartlis Tskhovreba count), so the epithet carries him rather than the
    // numeral alone.
    leader: [
      { name: "왕 파르스만 2세 (용맹왕)", from: "0116-01-01", until: "0132-01-01" },
    ],
  },
  "Himyarite Kingdom": {
    // "King of Saba and dhu-Raydan" is a title that several men hold in this
    // century and the South Arabian inscriptions do not let anyone put one of
    // them on this date with confidence. The unification under Shammar Yuharish
    // — the moment Himyar becomes the answer for all of Yemen — is late 3rd
    // century, well past this board.
    leader: [
      { name: "사바와 두라이단의 왕 (2세기 초 재위자는 비문으로 확정되지 않았다)", from: "0001-01-01", until: "0275-01-01" },
    ],
  },
  "Kingdom of Kush": {
    // Meroe's king list survives, but it is anchored by pyramid attribution
    // rather than dated events, and the 2nd century AD is where the anchors are
    // thinnest — the same name moves by fifty years between reconstructions.
    leader: [
      { name: "메로에의 쿠쉬 왕 (2세기 재위자는 왕명표에서 확정되지 않았다)", from: "0001-01-01", until: "0300-01-01" },
    ],
  },
  "Kingdom of Aksum": {
    // Aksum's first king who is more than a name on a list is GDRT, around 200,
    // known from South Arabian inscriptions describing his intervention across
    // the strait. Before him the regnal lists are late compilations.
    leader: [
      { name: "네구스 (117년 재위자는 기록에 없다 — 확실한 첫 왕은 3세기 초의 GDRT)", from: "0001-01-01", until: "0200-01-01" },
      { name: "네구스 GDRT", from: "0200-01-01", until: "0230-01-01" },
    ],
  },

  // ---- Beyond the frontier ---------------------------------------------------------
  "Caledonian Tribes": {
    // Not a state and not a throne. Rome fights and treats with the Caledonii,
    // the Maeatae and their neighbours as a shifting confederation, and the one
    // war-leader the sources name — Calgacus at Mons Graupius in 83 — reaches us
    // only through a speech Tacitus wrote for him.
    leader: [
      { name: "칼레도니아 부족 연맹 (단일 수장 없음)", from: "0001-01-01", until: "0300-01-01" },
    ],
  },
};

// No political-figures table for this pack. The later packs carry ministers,
// generals and opposition leaders because the record supports a second rank of
// named people; for most of this world it does not, and a second rank of
// invented names is exactly what this file exists to prevent.
export const POLITICAL_FIGURES = {};

export const ALIASES = {
  Rome: "Roman Empire",
  SPQR: "Roman Empire",
  Parthia: "Parthian Empire",
  Arsacids: "Parthian Empire",
  Kushans: "Kushan Empire",
  Kusana: "Kushan Empire",
  "Han China": "Han Dynasty",
  "Eastern Han": "Han Dynasty",
  Koguryo: "Goguryeo",
  "Northern Xiongnu": "Xiongnu",
  Axum: "Kingdom of Aksum",
  "Aksumite Empire": "Kingdom of Aksum",
  Meroe: "Kingdom of Kush",
  Nubia: "Kingdom of Kush",
  Himyar: "Himyarite Kingdom",
  "Arabia Felix": "Himyarite Kingdom",
  Ceylon: "Anuradhapura",
  Lanka: "Anuradhapura",
  "Caucasian Iberia": "Kingdom of Iberia",
  Kartli: "Kingdom of Iberia",
  "Nokor Phnom": "Funan",
  Caledonia: "Caledonian Tribes",
};
