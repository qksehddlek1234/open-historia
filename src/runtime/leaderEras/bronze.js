/*! Open Historia — officeholders on record, 3001–1001 BC © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Era pack: the Bronze Age, -003000-01-01 → -001000-12-31 (3001 BC → 1001 BC).
//
// THE OLDEST BOARD HAD TWELVE EMPTY THRONES. bronze-1200bc seeded 0 of 12 —
// every polity on it opened with "(없음)" where its ruler should be, which is
// the state roman-117 was in before classical.js was written, and it has the
// same consequence: a board whose whole subject is who rules what hands the
// model an empty seat and lets it invent an occupant, every jump.
//
// TWO DATES FOR EVERY REIGN, AND ONLY ONE OF THEM IS WRITTEN HERE. The record
// below is in ASTRONOMICAL years, which is what ISO 8601 extended format means
// and what Date.parse reads: there is a year zero, so a reign of 1203–1197 BC
// is written -001202 → -001196. Off by one in the obvious direction and the
// board's own start date (1200 BC = -001199-01-01) falls outside the window of
// the man who held the seat on it. runtime/gameDate.js carries the same trap in
// its header and tests/game-date.mjs pins it; tests/bronze-era.mjs pins that
// every window here actually contains the board's opening day.
//
// Conventions and doctrine as classical.js and the packs beside it:
//
//   • ONLY WHAT IS ON RECORD, and in this era that rule does most of the work.
//     Seven of these twelve seats have no holder anyone can name on 1 January
//     1200 BC, so they carry their OFFICE and the reason it is empty — the
//     Aksum/Funan/Xiongnu form from classical.js. Naming a plausible king for
//     Mycenae or Wilusa would be inventing history the model then repeats as
//     fact, and it would sit indistinguishable beside Wu Ding, who is real.
//   • THE ERA'S OWN TITLE, in Korean, as the period used it — 파라오·대왕·
//     상왕·와낙스·추장.
//   • Where a seat is contested, the contest goes IN THE NAME (the Parthian
//     precedent): Egypt in 1200 BC is not simply Seti II's.
//
// SOURCING, HONESTLY. Each entry was proposed and then checked twice by
// independent passes — one asking whether primary evidence actually names the
// person (inscription, king list, oracle bone, treaty), one asking whether the
// reign window really contains 1200 BC under middle chronology and what a rival
// chronology would do to it. One entry was overturned by BOTH passes and is
// corrected here: "리부의 대추장" (wr ꜥꜣ n Rbw) is a hereditary title first
// documented under Shoshenq III around 795 BC — four centuries late. The
// contemporary Merneptah-era form is "리부의 추장" (wr n Rbw), which is what
// ships. Absolute dates in this era carry a few years of slack in any case;
// where a competing chronology would seat a different person, the entry says so
// rather than hiding it.
export const ERA = { key: "bronze", from: "-003000-01-01", until: "-001000-12-31" };

export const REFERENCE = {
  // ---- the Near East ---------------------------------------------------------------
  "New Kingdom Egypt": {
    // THE ONE SEAT HERE THAT IS GENUINELY CONTESTED, and the contest is written
    // into the name because it IS the state of Egypt in 1200 BC rather than a
    // footnote about it. Seti II is named by first-hand evidence — his prenomen
    // Userkheperure Setepenre, the Bark Shrine at Karnak, KV15, six regnal years
    // of Deir el-Medina administrative papyri — and on the majority arrangement
    // (Krauss, Dodson: he succeeds Merneptah directly) 1200 BC is his third or
    // fourth year. But Amenmesse, equally well attested with his own KV10 and
    // Karnak cartouches, holds Thebes and Nubia at exactly this moment. On the
    // Kitchen/von Beckerath/Shaw arrangement Amenmesse comes FIRST and the
    // 1 January 1200 BC seat is his outright.
    //
    // So: both men, in the name. Delete the second half of this string and the
    // entry can no longer stand as a person — it would have to fall back to the
    // office, which is the note the chronology pass ended on.
    leader: [
      {
        name: "파라오 세티 2세 (상이집트와 누비아는 대립왕 아멘메세가 쥐고 있다 — 배열에 따라 이 시점의 왕좌를 아멘메세로 보는 학설도 있다)",
        from: "-001202-01-01",
        until: "-001196-12-31",
      },
    ],
  },
  "Hittite Empire": {
    // The last Great King of Hatti, and the firmest seat on this board after Wu
    // Ding: the Nişantaş rock inscription names him as "Great King Suppiluliuma,
    // son of Great King Tudhaliya", Südburg Chamber 2 records his Alashiya and
    // Tarhuntassa campaigns, and the Nişantepe bullae and Ugarit letters agree.
    // 1200 BC is his seventh year; Hattusa is abandoned a decade later. No
    // chronology in use moves someone else into this seat.
    leader: [
      { name: "대왕 슈필룰리우마 2세", from: "-001206-01-01", until: "-001177-12-31" },
    ],
  },
  "Middle Assyrian Empire": {
    // Tukulti-Ninurta I — the name anyone reaches for — is seven years dead by
    // 1200 BC, killed in the coup of 1207. The seat belongs to his grandson, in
    // the short reigns that follow: three manuscripts of the Assyrian King List
    // (Nassouhi, Khorsabad, SDAS) enter Ashur-nirari III for six years, and
    // contemporary administrative tablets are dated by his limmu.
    leader: [
      { name: "왕 아슈르니라리 3세", from: "-001201-01-01", until: "-001196-12-31" },
    ],
  },
  "Kassite Babylonia": {
    // The steadiest window in this file: a thirty-year reign with 1200 BC in the
    // middle of it, and named by more than the king lists — a bronze statue
    // inscription from Ur, temple rebuilding bricks at Nippur and Isin, and
    // sixteen economic documents dated by his regnal years.
    leader: [
      { name: "왕 아다드슈마우수르", from: "-001215-01-01", until: "-001186-12-31" },
    ],
  },
  Elam: {
    // 1200 BC falls into a gap, and the gap is the finding. The Igehalkid line
    // has ended and the Shutrukids have not begun — Shutruk-Nahhunte I comes to
    // the throne around 1184. The one name that gets proposed for the interval,
    // Hallutash-Inshushinak, appears only as the patronymic in his son's
    // inscriptions: a father's name promoted to a reign by modern arrangement,
    // with no inscription of his own.
    leader: [
      {
        name: "안샨과 수사의 왕 (1200년의 재위자는 기록에 없다 — 이기할키드 왕조의 끝과 슈트루크 왕조 사이의 공백이다)",
        from: "-001209-01-01",
        until: "-001184-12-31",
      },
    ],
  },
  // ---- the Aegean and the sea ------------------------------------------------------
  "Mycenaean Kingdoms": {
    // The textbook case for naming an office. Linear B writes the title wa-na-ka
    // over and over — with the wanax's estate (te-me-no) and his second, the
    // ra-wa-ke-ta — and never once writes his personal name; the Hittite
    // archives call their opposite number "Great King of Ahhiyawa" and leave him
    // equally anonymous. Agamemnon and Nestor are epic, five centuries later.
    // And "Mycenaean Kingdoms" is plural on this board for a reason: Mycenae,
    // Pylos, Thebes and Tiryns are separate palaces, so there is no single seat
    // to fill even in principle.
    leader: [
      {
        name: "미케네 궁전의 와낙스 (선형문자 B는 직명만 적고 이름을 적지 않는다 — 궁전마다 따로 있었다)",
        from: "-001209-01-01",
        until: "-001189-12-31",
      },
    ],
  },
  Wilusa: {
    // The throne is documented; its occupant in 1200 BC is not. Muwatalli II's
    // treaty names King Alaksandu of Wilusa and his predecessor Kukkunni around
    // 1280, and the Milawata letter has Tudhaliya IV trying to restore the
    // deposed Walmu around 1240 — after which the record stops. Whether Walmu
    // was restored, and for how long, nobody knows. Priam and Hector are Greek
    // epic; the Alaksandu-as-Paris identification does not reach 1200 either.
    leader: [
      {
        name: "윌루사의 왕 (1200년의 재위자는 기록에 없다 — 이름이 남는 마지막 왕은 기원전 1240년경 폐위된 왈무다)",
        from: "-001209-01-01",
        until: "-001189-12-31",
      },
    ],
  },
  Alashiya: {
    // The trap on this board: one name IS known, and it still cannot be seated.
    // The Amarna letters carry a king of Alashiya who addresses Pharaoh as
    // "brother" and never signs his name; Suppiluliuma II's inscription calls
    // him only "the king of Alashiya". Kušmešuša, from the Urtenu archive at
    // Ugarit, is the single exception — and he is fixed only as a contemporary
    // of Niqmaddu III around 1225–1215, with no known accession or death. A
    // name being known is not the same as that name holding the seat in 1200.
    leader: [
      {
        name: "알라시야의 왕 (아마르나 서신의 왕들은 이름을 적지 않는다 — 유일하게 이름이 남은 쿠슈메슈샤도 1200년 재위 여부를 알 수 없다)",
        from: "-001209-01-01",
        until: "-001189-12-31",
      },
    ],
  },
  "Libu Tribes": {
    // THE ENTRY BOTH CHECKING PASSES OVERTURNED, and the correction is a title
    // rather than a person. Egyptian documents are the only source the Libu have
    // — they left no writing of their own — and the contemporary form under
    // Merneptah is "chief of the Libu" (wr n Rbw). "Great chief of the Libu"
    // (wr ꜥꜣ n Rbw) belongs to the 22nd Dynasty, first documented in Shoshenq
    // III's year 31 around 795 BC: four hundred years after this board opens.
    //
    // The one chief who is named, Meryey son of Ded, appears in Merneptah's year
    // 5 (c. 1208) and disappears from the record after his defeat at Perire; the
    // Libyan wars of Ramesses III name no Libu chief at all.
    leader: [
      {
        name: "리부의 추장 (1200년의 수장은 기록에 없다 — 이름이 남는 것은 기원전 1208년 페리레에서 패한 메리에이뿐이다)",
        from: "-001207-01-01",
        until: "-001174-12-31",
      },
    ],
  },
  // ---- beyond the Near Eastern world -----------------------------------------------
  "Shang Dynasty": {
    // The best-attested ruler on this board, and the evidence is a different KIND
    // from everything above it: his own divination record. The Bin-group oracle
    // bones are dated to his reign, later ritual inscriptions name him 父丁/武丁,
    // and Fu Hao's tomb cross-checks his consorts in bronze. Every chronology in
    // use — the Xia-Shang-Zhou Project's 1250–1192, the 2021 radiocarbon
    // re-measurement's 1254–1197, Nivison's 1238–1180 — seats him in 1200.
    leader: [
      { name: "상왕 무정 (武丁)", from: "-001249-01-01", until: "-001191-12-31" },
    ],
  },
  "Kingdom of Shu": {
    // Sanxingdui left no legible writing at all. The Shu king names — Cancong,
    // Boguan, Yufu, Duyu, Kaiming — come from the 3rd-century Chronicles of the
    // Kings of Shu and the 4th-century Huayang Guo Zhi, more than a thousand
    // years later, and it is not even settled whether they are individuals or
    // clan-dynasties. Seating any of them here would be the exact failure this
    // file exists to avoid.
    leader: [
      {
        name: "촉왕 (蜀王 — 삼성퇴는 판독 가능한 문자를 남기지 않았고, 전하는 왕명은 1,000년 뒤의 전승이다)",
        from: "-001599-01-01",
        until: "-001099-12-31",
      },
    ],
  },
  Olmec: {
    // No decipherable script, no later king list: any personal name here would be
    // 100% invention. The colossal heads and the throne-altars say a single ruler
    // existed; they cannot say who. Even the candidate script, the Cascajal
    // Block, is around 900 BC and neither authenticated nor read.
    leader: [
      {
        name: "산로렌소의 수장 (首長 — 올멕은 판독 가능한 문자를 남기지 않아 이름이 복원될 수 없다)",
        from: "-001399-01-01",
        until: "-000999-12-31",
      },
    ],
  },
};

export const POLITICAL_FIGURES = {};

// The spec's own aliases are tried by the preset builder before these, so this
// list is for the spellings a scenario or a player might use that the spec does
// not carry.
export const ALIASES = {
  Egypt: "New Kingdom Egypt",
  Kemet: "New Kingdom Egypt",
  "Nineteenth Dynasty": "New Kingdom Egypt",
  Hatti: "Hittite Empire",
  "the Hittites": "Hittite Empire",
  Assyria: "Middle Assyrian Empire",
  Assur: "Middle Assyrian Empire",
  Babylon: "Kassite Babylonia",
  Babylonia: "Kassite Babylonia",
  Karduniash: "Kassite Babylonia",
  Kassites: "Kassite Babylonia",
  Susa: "Elam",
  Elamites: "Elam",
  Mycenae: "Mycenaean Kingdoms",
  Ahhiyawa: "Mycenaean Kingdoms",
  Achaeans: "Mycenaean Kingdoms",
  Troy: "Wilusa",
  Ilios: "Wilusa",
  Cyprus: "Alashiya",
  Libya: "Libu Tribes",
  Libu: "Libu Tribes",
  Shang: "Shang Dynasty",
  Yin: "Shang Dynasty",
  Shu: "Kingdom of Shu",
  Sanxingdui: "Kingdom of Shu",
  "San Lorenzo": "Olmec",
  Olmecs: "Olmec",
};
