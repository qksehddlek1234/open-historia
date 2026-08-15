/*! Open Historia — officeholders on record, 1000–1443 © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Era pack: the high and late Middle Ages, 1000-01-01 → 1443-12-31 — the window
// the record did not reach. medieval-1200 seeded 2 of its 56 polities and
// mongol-1300 seeded 3 of 64, which meant that on both boards nearly every
// throne was the model's to invent, every jump, with nothing to check it
// against. Conventions and doctrine as leaderReference.js and the packs beside
// this one:
//
//   • ONLY WHAT IS ON RECORD. A ruler whose dates are firm is named; a seat
//     whose holder in this decade is genuinely disputed, or a polity that had
//     no single head, gets its INSTITUTION instead — the Ragusa precedent
//     ("렉토르 (월례 윤번제)"). Inventing a name for a chair we cannot fill is
//     the one failure this file exists to prevent, because a plausible
//     invention is indistinguishable from a fact once it is in the prompt.
//   • THE ERA'S OWN TITLE, in Korean, the way the period gave it: 황제·칼리프
//     ·술탄·대공·도제·총대주교가 아니라 그 자리가 실제로 불린 이름.
//   • Chains run through BOTH board dates where a polity appears on both
//     (1200-01-01 and 1300-01-01), so one key answers both boards and the
//     window arithmetic picks the right holder.
//   • The deputy slot carries the person who actually governed where that is
//     the historically interesting fact — Choe Chung-heon behind Goryeo's
//     throne, the Hōjō regents behind Kamakura's shoguns.
export const ERA = { key: "high-medieval", from: "1000-01-01", until: "1443-12-31" };

export const REFERENCE = {
  // ---- Latin Christendom -----------------------------------------------------------
  "Holy Roman Empire": {
    // 1198년 이중 선거 — 슈타우펜의 필리프와 벨프의 오토가 동시에 왕이었다.
    // 그 자체가 1200년 제국의 상태이므로 부제로 적는다.
    leader: [
      { name: "국왕 필리프 폰 슈바벤 (오토 4세와 대립왕)", from: "1198-03-08", until: "1208-06-21" },
      { name: "황제 오토 4세", from: "1208-06-21", until: "1215-07-25" },
      { name: "황제 프리드리히 2세", from: "1220-11-22", until: "1250-12-13" },
      { name: "국왕 알브레히트 1세 폰 합스부르크", from: "1298-07-27", until: "1308-05-01" },
      { name: "국왕 하인리히 7세", from: "1308-11-27", until: "1313-08-24" },
    ],
  },
  "Angevin Empire": {
    leader: [
      { name: "국왕 존 (실지왕)", from: "1199-04-06", until: "1216-10-19" },
      { name: "국왕 헨리 3세", from: "1216-10-19", until: "1272-11-16" },
    ],
  },
  "Kingdom of England": {
    leader: [
      { name: "국왕 존 (실지왕)", from: "1199-04-06", until: "1216-10-19" },
      { name: "국왕 에드워드 1세 (스코틀랜드의 망치)", from: "1272-11-16", until: "1307-07-07" },
      { name: "국왕 에드워드 2세", from: "1307-07-07", until: "1327-01-20" },
    ],
  },
  "Kingdom of Scotland": {
    leader: [
      { name: "국왕 윌리엄 1세 (사자왕)", from: "1165-12-09", until: "1214-12-04" },
      { name: "국왕 알렉산더 2세", from: "1214-12-04", until: "1249-07-06" },
      // 1296년 존 발리올 폐위 이후 1306년 로버트 브루스 대관까지 왕좌가 비어
      // 있다. 1300년의 스코틀랜드를 다스린 것은 왕이 아니라 수호자들이다.
      { name: "스코틀랜드 수호자단 (공위기 — 왕좌 공백)", from: "1296-07-10", until: "1306-03-25" },
      { name: "국왕 로버트 1세 브루스", from: "1306-03-25", until: "1329-06-07" },
    ],
  },
  "Kingdom of France": {
    leader: [
      { name: "국왕 필리프 2세 오귀스트", from: "1180-09-18", until: "1223-07-14" },
      { name: "국왕 필리프 4세 (미남왕)", from: "1285-10-05", until: "1314-11-29" },
    ],
  },
  "Crown of Castile": {
    leader: [
      { name: "국왕 알폰소 8세", from: "1158-08-31", until: "1214-10-06" },
      { name: "국왕 페르난도 4세", from: "1295-04-25", until: "1312-09-07" },
      { name: "국왕 알폰소 11세", from: "1312-09-07", until: "1350-03-26" },
    ],
  },
  "Crown of Aragon": {
    leader: [
      { name: "국왕 페드로 2세 (가톨릭왕)", from: "1196-04-25", until: "1213-09-12" },
      { name: "국왕 하이메 2세 (정의왕)", from: "1291-06-18", until: "1327-11-02" },
    ],
  },
  "Kingdom of Navarre": {
    leader: [
      { name: "국왕 산초 7세 (강건왕)", from: "1194-06-27", until: "1234-04-07" },
      { name: "여왕 후아나 1세 (프랑스 왕비 겸위)", from: "1274-07-22", until: "1305-04-02" },
    ],
  },
  "Kingdom of Portugal": {
    leader: [
      { name: "국왕 산슈 1세 (개척왕)", from: "1185-12-06", until: "1211-03-26" },
      { name: "국왕 디니스 1세 (농부왕)", from: "1279-02-16", until: "1325-01-07" },
    ],
  },
  "Papal States": {
    leader: [
      { name: "교황 인노첸시오 3세", from: "1198-01-08", until: "1216-07-16" },
      { name: "교황 보니파시오 8세", from: "1294-12-24", until: "1303-10-11" },
      { name: "교황 클레멘스 5세 (아비뇽 이거)", from: "1305-06-05", until: "1314-04-20" },
    ],
  },
  "Kingdom of Sicily": {
    // 1198년 콘스탄체 사후 어린 프리드리히의 후견인은 교황 인노첸시오 3세다.
    leader: [
      { name: "국왕 페데리코 1세 (제위 프리드리히 2세, 미성년 — 교황 후견)", from: "1198-11-27", until: "1250-12-13" },
    ],
    deputy: [
      { name: "후견인 교황 인노첸시오 3세", from: "1198-11-27", until: "1216-07-16" },
    ],
  },
  "Kingdom of Naples": {
    leader: [
      { name: "국왕 카를로 2세 당주 (절름발이왕)", from: "1285-01-07", until: "1309-05-05" },
      { name: "국왕 로베르토 (현명왕)", from: "1309-05-05", until: "1343-01-20" },
    ],
  },
  "Kingdom of Trinacria": {
    // 1282년 시칠리아 만종 이후의 섬 왕국 — 1302년 칼타벨로타 화약으로 공인.
    leader: [
      { name: "국왕 페데리코 3세", from: "1295-12-15", until: "1337-06-25" },
    ],
  },
  "Republic of Venice": {
    leader: [
      { name: "도제 엔리코 단돌로", from: "1192-01-01", until: "1205-06-01" },
      { name: "도제 피에트로 그라데니고", from: "1289-11-25", until: "1311-08-13" },
    ],
  },
  "Kingdom of Hungary": {
    leader: [
      { name: "국왕 임레", from: "1196-04-23", until: "1204-11-30" },
      { name: "국왕 언드라시 2세", from: "1205-05-29", until: "1235-09-21" },
      { name: "국왕 언드라시 3세 (아르파드 왕조 최후)", from: "1290-07-23", until: "1301-01-14" },
      { name: "국왕 카로이 1세 (앙주 왕조)", from: "1310-08-27", until: "1342-07-16" },
    ],
  },
  "Duchy of Poland": {
    // 분열기 — 종주 대공위가 크라쿠프를 두고 오갔다.
    leader: [
      { name: "종주 대공 미에슈코 3세 (노공)", from: "1199-01-01", until: "1202-03-13" },
      { name: "종주 대공 레셰크 1세 (백공)", from: "1202-03-13", until: "1227-11-24" },
    ],
  },
  "Kingdom of Poland": {
    // 1300년 바츨라프 2세의 대관은 그 해 8월 — 보드 날짜(1월 1일)에는 아직
    // 크라쿠프 공이다. 핀이 잡아낸 세 번째 같은 함정.
    leader: [
      { name: "크라쿠프 공 바츨라프 2세 (대관 전)", from: "1291-08-01", until: "1300-08-01" },
      { name: "국왕 바츨라프 2세 (프셰미슬 왕조)", from: "1300-08-01", until: "1305-06-21" },
      { name: "국왕 브와디스와프 1세 (단신왕)", from: "1320-01-20", until: "1333-03-02" },
    ],
  },
  "Grand Principality of Serbia": {
    leader: [
      { name: "대주판 스테판 네마니치 (초대 대관왕)", from: "1196-03-25", until: "1228-09-24" },
    ],
  },
  "Kingdom of Serbia": {
    leader: [
      { name: "국왕 스테판 우로시 2세 밀루틴", from: "1282-01-01", until: "1321-10-29" },
    ],
  },
  "Bulgarian Empire": {
    leader: [
      { name: "차르 칼로얀 (로마인 도살자)", from: "1197-01-01", until: "1207-10-08" },
      { name: "차르 테오도르 스베토슬라프", from: "1300-01-01", until: "1322-01-01" },
    ],
  },
  "Kingdom of Denmark": {
    leader: [
      { name: "국왕 크누드 6세", from: "1182-05-12", until: "1202-11-12" },
      { name: "국왕 발데마르 2세 (승리왕)", from: "1202-11-12", until: "1241-03-28" },
      { name: "국왕 에리크 6세 멘베드", from: "1286-11-22", until: "1319-11-13" },
    ],
  },
  "Kingdom of Norway": {
    leader: [
      { name: "국왕 스베레 시구르손", from: "1184-06-15", until: "1202-03-09" },
      { name: "국왕 호콘 3세", from: "1202-03-09", until: "1204-01-01" },
      { name: "국왕 호콘 5세", from: "1299-07-10", until: "1319-05-08" },
    ],
  },
  "Kingdom of Sweden": {
    leader: [
      { name: "국왕 스베르케르 2세 (연소왕)", from: "1196-01-01", until: "1208-01-01" },
      { name: "국왕 비리에르 망누손", from: "1290-01-01", until: "1318-01-01" },
    ],
    deputy: [
      // 왕이 어릴 때 실권은 야를에게 있었다 — 1300년의 스웨덴이 그 상태다.
      { name: "야를 토르길스 크누트손 (섭정)", from: "1290-01-01", until: "1306-01-01" },
    ],
  },
  "Grand Duchy of Lithuania": {
    leader: [
      { name: "대공 비테니스", from: "1295-01-01", until: "1316-01-01" },
      { name: "대공 게디미나스", from: "1316-01-01", until: "1341-12-01" },
    ],
  },
  "Teutonic Order": {
    leader: [
      { name: "총장 고트프리트 폰 호엔로에", from: "1297-01-01", until: "1303-10-19" },
      { name: "총장 지크프리트 폰 포이흐트방겐 (본부를 마리엔부르크로)", from: "1303-10-19", until: "1311-03-05" },
    ],
  },
  "Crusader States": {
    // 아크레의 왕국·안티오키아 공국·트리폴리 백국·키프로스가 한 색이므로,
    // 그중 왕국의 왕관을 적고 나머지는 제도로 남긴다.
    leader: [
      { name: "예루살렘 국왕 아모리 (키프로스 왕 겸위)", from: "1197-10-01", until: "1205-04-01" },
      { name: "예루살렘 여왕 마리아 드 몽페라 (섭정 장 디블랭)", from: "1205-04-01", until: "1212-01-01" },
    ],
  },
  "Kingdom of Cyprus": {
    leader: [
      { name: "국왕 아모리 드 뤼지냥", from: "1197-09-22", until: "1205-04-01" },
      { name: "국왕 앙리 2세 드 뤼지냥", from: "1285-05-24", until: "1324-08-31" },
    ],
  },

  // ---- Byzantium, Rum, the Caucasus ------------------------------------------------
  "Byzantine Empire": {
    leader: [
      { name: "황제 알렉시오스 3세 앙겔로스", from: "1195-04-08", until: "1203-07-17" },
      { name: "황제 안드로니코스 2세 팔레올로고스", from: "1282-12-11", until: "1328-05-24" },
    ],
  },
  "Sultanate of Rum": {
    leader: [
      { name: "술탄 쉴레이만샤 2세", from: "1196-01-01", until: "1204-07-01" },
      { name: "술탄 카이휘스레브 1세 (복위)", from: "1205-01-01", until: "1211-01-01" },
    ],
  },
  "Ottoman Beylik": {
    // 1299년 독립 선언으로 잡는 통설을 따른다 — 이 보드의 날짜가 그 원년이다.
    leader: [
      { name: "베이 오스만 1세", from: "1299-01-01", until: "1324-01-01" },
    ],
  },
  "Kingdom of Georgia": {
    leader: [
      { name: "여왕 타마르 대왕", from: "1184-03-27", until: "1213-01-18" },
      { name: "국왕 다비트 8세", from: "1292-01-01", until: "1311-01-01" },
    ],
  },
  "Cilician Armenia": {
    leader: [
      { name: "국왕 레본 1세 (대왕)", from: "1198-01-06", until: "1219-05-02" },
      { name: "국왕 헤툼 2세", from: "1289-01-01", until: "1307-11-17" },
    ],
  },
  "Empire of Trebizond": {
    leader: [
      { name: "황제 알렉시오스 1세 메가스 콤네노스", from: "1204-04-01", until: "1222-02-01" },
    ],
  },

  // ---- Dar al-Islam ----------------------------------------------------------------
  "Almohad Caliphate": {
    leader: [
      { name: "칼리프 무함마드 알나시르", from: "1199-01-01", until: "1213-12-25" },
      { name: "칼리프 유수프 2세 알무스탄시르", from: "1213-12-25", until: "1224-01-01" },
    ],
  },
  "Ayyubid Sultanate": {
    // 1200-01-01의 카이로는 아직 조카의 것이다 — 핀이 잡아낸 한 달 차이:
    // 알아딜이 술탄위를 실제로 쥐는 것은 1200년 2월이고, 그때까지는 명목상
    // 알만수르가 앉아 있고 숙부와 알아프달이 그 자리를 두고 다툰다.
    leader: [
      { name: "술탄 알만수르 나시르 앗딘 (명목 — 숙부 알아딜과 알아프달의 각축)", from: "1198-11-29", until: "1200-02-01" },
      { name: "술탄 알아딜 1세 (사파딘)", from: "1200-02-01", until: "1218-08-31" },
      { name: "술탄 알카밀", from: "1218-08-31", until: "1238-03-06" },
    ],
  },
  "Abbasid Caliphate": {
    leader: [
      { name: "칼리프 알나시르 리딘 알라", from: "1180-03-02", until: "1225-10-05" },
      { name: "칼리프 알무스타심 (최후의 바그다드 칼리프)", from: "1242-01-01", until: "1258-02-20" },
    ],
  },
  "Khwarazmian Empire": {
    // 같은 이유의 반년 차이: 테키시는 1200년 7월에 죽는다.
    leader: [
      { name: "샤 알라 앗딘 테키시", from: "1172-01-01", until: "1200-07-03" },
      { name: "샤 알라 앗딘 무함마드 2세", from: "1200-08-03", until: "1220-12-01" },
      { name: "샤 잘랄 앗딘 밍부르누", from: "1220-12-01", until: "1231-08-15" },
    ],
  },
  "Ghurid Empire": {
    // 형제 공치 — 술탄은 기야스 앗딘, 인도 원정을 이끈 것은 무이즈 앗딘이다.
    leader: [
      { name: "술탄 기야스 앗딘 무함마드", from: "1163-01-01", until: "1203-03-13" },
      { name: "술탄 무이즈 앗딘 무함마드 (구르의 무함마드)", from: "1203-03-13", until: "1206-03-15" },
    ],
    deputy: [
      { name: "인도 총독 쿠트브 앗딘 아이바크", from: "1192-01-01", until: "1206-03-15" },
    ],
  },
  "Delhi Sultanate": {
    leader: [
      { name: "술탄 알라 앗딘 할지", from: "1296-07-19", until: "1316-01-04" },
      { name: "술탄 기야스 앗딘 투글루크", from: "1320-09-08", until: "1325-02-01" },
    ],
    deputy: [
      { name: "장군 말리크 카푸르 (데칸 원정 사령)", from: "1299-01-01", until: "1316-02-01" },
    ],
  },
  "Mamluk Sultanate": {
    leader: [
      { name: "술탄 알나시르 무함마드 (2차 재위)", from: "1299-01-01", until: "1309-03-01" },
      { name: "술탄 알나시르 무함마드 (3차 재위)", from: "1310-03-05", until: "1341-06-07" },
    ],
  },
  "Hafsid Sultanate": {
    leader: [
      { name: "술탄 아부 아시다 무함마드 2세", from: "1295-01-01", until: "1309-01-01" },
    ],
  },
  "Zayyanid Kingdom": {
    leader: [
      { name: "술탄 아부 사이드 우스만 1세", from: "1283-01-01", until: "1304-01-01" },
    ],
  },
  "Marinid Sultanate": {
    leader: [
      { name: "술탄 아부 야쿠브 유수프 안나스르", from: "1286-01-01", until: "1307-05-13" },
    ],
  },
  "Rasulid Yemen": {
    leader: [
      { name: "술탄 알무아야드 다우드", from: "1296-01-01", until: "1321-01-01" },
    ],
  },
  "Emirate of Granada": {
    leader: [
      { name: "술탄 무함마드 2세 알파키흐", from: "1273-01-01", until: "1302-04-08" },
      { name: "술탄 무함마드 3세", from: "1302-04-08", until: "1309-03-14" },
    ],
  },

  // ---- The steppe and the four uluses ----------------------------------------------
  "Yuan Dynasty": {
    leader: [
      { name: "성종 테무르 카안", from: "1294-05-10", until: "1307-02-10" },
      { name: "무종 카이샨 카안", from: "1307-06-21", until: "1311-01-27" },
    ],
  },
  "Golden Horde": {
    leader: [
      { name: "칸 톡타", from: "1291-01-01", until: "1312-01-01" },
      { name: "칸 우즈베크", from: "1313-01-01", until: "1341-01-01" },
    ],
  },
  "Chagatai Khanate": {
    leader: [
      { name: "칸 두와", from: "1282-01-01", until: "1307-01-01" },
    ],
  },
  "Ilkhanate": {
    leader: [
      { name: "일칸 가잔 (이슬람 개종)", from: "1295-11-03", until: "1304-05-17" },
      { name: "일칸 울제이투", from: "1304-07-19", until: "1316-12-16" },
    ],
    deputy: [
      { name: "재상 라시드 앗딘 하마다니 (집사 편찬)", from: "1298-01-01", until: "1318-07-17" },
    ],
  },
  "Volga Bulgaria": {
    // 볼가 불가르의 1200년 통치자는 사료가 이름을 남기지 않았다.
    leader: [{ name: "볼가 불가르의 에미르들 (개별 통치자 미상)" }],
  },

  // ---- The Rus' ---------------------------------------------------------------------
  "Kievan Rus'": {
    // 하나의 나라가 아니라 류리크 가문의 공국들이다. 키예프 대공위는 이
    // 시기 손바뀜이 잦았고, 실제 최강자는 블라디미르의 대공이었다.
    leader: [
      { name: "키예프 대공 류리크 로스티슬라비치", from: "1194-01-01", until: "1202-01-02" },
      { name: "키예프 대공 로만 므스티슬라비치 (갈리치아-볼히니아)", from: "1202-01-02", until: "1205-06-19" },
    ],
    deputy: [
      { name: "블라디미르 대공 프세볼로트 3세 (큰 둥지)", from: "1176-01-01", until: "1212-04-15" },
    ],
  },
  "Russian Principalities": {
    leader: [
      { name: "블라디미르 대공 안드레이 3세 (고로데츠)", from: "1294-01-01", until: "1304-07-27" },
      { name: "블라디미르 대공 미하일 (트베리)", from: "1304-01-01", until: "1318-11-22" },
    ],
  },
  "Galicia-Volhynia": {
    leader: [
      { name: "공 레프 1세", from: "1269-01-01", until: "1301-01-01" },
      { name: "국왕 유리 1세", from: "1301-01-01", until: "1308-01-01" },
    ],
  },

  // ---- East Asia ---------------------------------------------------------------------
  "Southern Song": {
    leader: [
      { name: "영종 조확", from: "1194-07-24", until: "1224-09-17" },
    ],
    deputy: [
      { name: "재상 한탁주 (개희북벌 주도)", from: "1195-01-01", until: "1207-11-24" },
    ],
  },
  "Jin Dynasty": {
    leader: [
      { name: "장종 완안경", from: "1189-01-20", until: "1208-12-29" },
    ],
  },
  "Western Xia": {
    leader: [
      { name: "환종 이순우", from: "1193-01-01", until: "1206-01-01" },
    ],
  },
  "Kingdom of Dali": {
    leader: [
      { name: "국왕 단지흥", from: "1172-01-01", until: "1200-01-01" },
      { name: "국왕 단지렴", from: "1200-01-01", until: "1204-01-01" },
    ],
  },
  "Tibet": {
    // 분열기(사분오열 시대) — 단일 수반이 없다. 원의 종주권 아래 사캬가
    // 세속 권력을 쥐는 것은 1264년 이후다.
    leader: [
      { name: "분열기의 지방 영주들 (단일 수반 없음)", from: "1000-01-01", until: "1263-12-31" },
      { name: "사캬 제사(帝師)와 폰첸 (원의 종주권 아래)", from: "1264-01-01", until: "1354-01-01" },
    ],
  },
  "Goryeo": {
    leader: [
      { name: "신종", from: "1197-09-01", until: "1204-01-01" },
      { name: "충렬왕 (원의 부마)", from: "1274-06-01", until: "1308-07-01" },
    ],
    deputy: [
      // 왕은 있으나 다스리는 자는 따로 있었다 — 최씨 무신정권.
      { name: "무신집정 최충헌", from: "1196-04-01", until: "1219-09-29" },
    ],
  },
  "Kamakura Japan": {
    leader: [
      { name: "쇼군 미나모토노 요리이에", from: "1199-02-06", until: "1203-09-07" },
      { name: "쇼군 미나모토노 사네토모", from: "1203-09-07", until: "1219-02-13" },
      { name: "쇼군 히사아키 친왕 (황족 장군)", from: "1289-10-09", until: "1308-09-19" },
    ],
    deputy: [
      { name: "싯켄 호조 도키마사", from: "1203-09-07", until: "1205-07-19" },
      { name: "싯켄 호조 사다토키", from: "1284-08-01", until: "1301-09-01" },
    ],
  },

  // ---- South and Southeast Asia --------------------------------------------------------
  "Chola Empire": {
    leader: [
      { name: "국왕 쿨로퉁가 촐라 3세", from: "1178-01-01", until: "1218-01-01" },
    ],
  },
  "Pandya Empire": {
    leader: [
      { name: "국왕 마라바르만 쿨라세카라 판디안 1세", from: "1268-01-01", until: "1310-01-01" },
    ],
  },
  "Hoysala Kingdom": {
    leader: [
      { name: "국왕 발랄라 3세", from: "1291-01-01", until: "1343-08-01" },
    ],
  },
  "Yadava Kingdom": {
    leader: [
      { name: "국왕 라마찬드라 (데바기리)", from: "1271-01-01", until: "1311-01-01" },
    ],
  },
  "Kakatiya Kingdom": {
    leader: [
      { name: "국왕 프라타파루드라 2세", from: "1289-01-01", until: "1323-01-01" },
    ],
  },
  "Kingdom of Polonnaruwa": {
    // 1196년 니샹카 말라 사후의 계승 혼란 — 1200년 왕좌의 주인이 해마다
    // 바뀌었고 사료도 서로 어긋난다.
    leader: [
      { name: "계승 혼란기의 왕들 (1196년 이후 잦은 교체)", from: "1196-01-01", until: "1215-01-01" },
    ],
  },
  "Kingdom of Pagan": {
    leader: [
      { name: "국왕 나라파티시투", from: "1174-01-01", until: "1211-08-18" },
    ],
  },
  "Sukhothai": {
    leader: [
      { name: "국왕 람캄행 대왕", from: "1279-01-01", until: "1298-01-01" },
      { name: "국왕 러타이", from: "1298-01-01", until: "1323-01-01" },
    ],
  },
  "Dai Viet": {
    leader: [
      { name: "리 까오 똥", from: "1175-01-01", until: "1210-11-01" },
      { name: "쩐 아인 똥", from: "1293-03-01", until: "1314-04-01" },
    ],
  },
  "Khmer Empire": {
    leader: [
      { name: "국왕 자야바르만 7세 (앙코르 톰의 건설자)", from: "1181-01-01", until: "1218-01-01" },
      { name: "국왕 인드라바르만 3세", from: "1295-01-01", until: "1308-01-01" },
    ],
  },
  "Majapahit": {
    leader: [
      { name: "국왕 크르타라자사 자야와르다나 (라덴 위자야)", from: "1293-11-10", until: "1309-01-01" },
    ],
  },
  "Srivijaya": {
    // 13세기의 스리위자야는 이름만 남은 항구 연맹이다 — 마하라자의 계보가
    // 끊겨 사료가 개인을 특정하지 못한다.
    leader: [{ name: "말레이 항시 연맹의 마하라자들 (계보 불명)" }],
  },

  // ---- Africa ---------------------------------------------------------------------------
  "Zagwe Ethiopia": {
    leader: [
      { name: "네구스 게브레 메스켈 랄리벨라 (암반 교회의 건설자)", from: "1181-01-01", until: "1221-01-01" },
    ],
  },
  "Ethiopian Empire": {
    leader: [
      { name: "네구스 웨뎀 아라드", from: "1299-01-01", until: "1314-01-01" },
      { name: "네구스 암다 세욘 1세", from: "1314-01-01", until: "1344-01-01" },
    ],
  },
  "Makuria": {
    // 누비아 왕들의 계보는 이 세기에 단편적으로만 남았다.
    leader: [{ name: "동골라의 왕들 (계보 단편)" }],
  },
  "Mali Empire": {
    leader: [
      { name: "만사 아부바카르 2세", from: "1310-01-01", until: "1312-01-01" },
      { name: "만사 무사 1세", from: "1312-01-01", until: "1337-01-01" },
    ],
  },

  // ── medieval-1200 확장 1이 데려온 열 자리 ──────────────────────────────
  // 라구사 교리: 재위를 짚을 수 있으면 사람, 계보가 흔들리면 기관. 아래 다섯은
  // 사람이 확실하고(귀네드·포위스·칼리아리·보스니아·서요), 나머지는 왕가나
  // 회의체다 — 없는 사람을 지어내는 것이 가장 나쁜 답이다.
  "Kingdom of Gwynedd": {
    // 1200년은 흐이웰린이 사촌들을 밀어내고 귀네드를 단독으로 쥔 해다.
    leader: [{ name: "대공 흐이웰린 압 이오르웨르스 (대왕)", from: "1195-01-01", until: "1240-04-11" }],
  },
  "Powys Wenwynwyn": {
    leader: [{ name: "공 그웬윈윈 압 오와인", from: "1195-01-01", until: "1216-01-01" }],
  },
  "Kingdom of Desmond": {
    // 12세기 말 맥카시가는 왕위를 두고 갈라져 있었고 어느 계보를 정통으로
    // 볼지가 사료마다 다르다 — 사람을 고르는 대신 왕가를 앉힌다.
    leader: [{ name: "맥카시 왕가 (데스몬드 왕위)" }],
  },
  "Kingdom of Thomond": {
    // 도널 모르 우아 브리언 사후(1194)의 계승 분쟁 — 같은 이유로 왕가.
    leader: [{ name: "우아 브리언 왕가 (토몬드 왕위)" }],
  },
  "Icelandic Commonwealth": {
    // 아이슬란드에는 왕이 없다. 그게 이 나라의 정의다 — 알싱기와 법률연설자가
    // 통치의 전부이고, 국가원수 자리는 비어 있는 것이 옳다.
    leader: [{ name: "알싱기 (법률연설자 주재)" }],
    headOfState: [{ name: "(없음 — 왕을 두지 않는 자유국)" }],
  },
  "Judicate of Cagliari": {
    leader: [{ name: "판관 굴리엘모 1세 디 마사", from: "1188-01-01", until: "1214-01-01" }],
  },
  "Judicate of Arborea": {
    // 12세기 말 아르보레아 판관 계보는 사료가 엇갈린다.
    leader: [{ name: "아르보레아 판관 (계보 이설)" }],
  },
  "Banate of Bosnia": {
    leader: [{ name: "반 쿨린", from: "1180-01-01", until: "1204-01-01" }],
  },
  "Qara Khitai": {
    leader: [{ name: "구르칸 예뤼 즈루구", from: "1197-01-01", until: "1211-01-01" }],
  },
  "Cuman–Kipchak Confederation": {
    // 데시티키프차크에 단일 군주는 없다 — 서로 다른 칸들의 연합이고, 한 사람을
    // 앉히면 그 사실이 지워진다.
    leader: [{ name: "쿠만 칸들의 연합 (단일 군주 없음)" }],
    headOfState: [{ name: "(없음 — 부족 칸 연합)" }],
  },

  // ── medieval-1200 확장 2: 인도 아대륙 열한 자리 ───────────────────────
  // 1200년 전후로 왕위가 실제로 바뀐 자리가 셋이나 된다(야다바 1200, 카카티야
  // 1199, 네팔 1200) — 보드 날짜가 그 경계 위에 앉아 있으므로 구간을 그대로
  // 적는다. 계보가 흔들리는 둘은 라구사 교리대로 왕조로 남겼다.
  "Chaulukya of Gujarat": {
    leader: [{ name: "국왕 비마 2세", from: "1178-01-01", until: "1240-01-01" }],
  },
  "Paramara of Malwa": {
    leader: [
      { name: "국왕 빈디야바르만", from: "1175-01-01", until: "1194-01-01" },
      { name: "국왕 수바타바르만", from: "1194-01-01", until: "1209-01-01" },
    ],
  },
  "Kalachuri of Ratanpur": {
    // 라탄푸르 분가의 12세기 말 계보는 비문마다 어긋난다.
    leader: [{ name: "라탄푸르 칼라추리 왕가" }],
  },
  "Seuna Yadava": {
    leader: [
      { name: "국왕 자이투기 1세", from: "1191-01-01", until: "1200-01-01" },
      { name: "국왕 신하나 2세", from: "1200-01-01", until: "1247-01-01" },
    ],
  },
  "Hoysala Empire": {
    // 1189년 서찰루키아가 무너지고 발랄라 2세가 데칸을 가져간다.
    leader: [{ name: "국왕 비라 발랄라 2세", from: "1173-01-01", until: "1220-01-01" }],
  },
  "Venad": {
    // 쿨라셰카라 붕괴(1102) 이후 케랄라는 베나드·코지코드·코치로 갈렸고,
    // 그중 한 사람을 케랄라 전체의 왕으로 앉힐 근거가 없다.
    leader: [{ name: "베나드의 왕들 (케랄라 분립기)" }],
  },
  "Kakatiya Dynasty": {
    leader: [
      { name: "국왕 마하데바", from: "1195-01-01", until: "1199-01-01" },
      { name: "국왕 가나파티데바", from: "1199-01-01", until: "1262-01-01" },
    ],
  },
  "Eastern Ganga Dynasty": {
    leader: [{ name: "국왕 아낭가비마 2세", from: "1198-01-01", until: "1211-01-01" }],
  },
  "Sena Dynasty": {
    // 박티야르 킬지의 습격은 1203~04년 — 1200년의 벵골은 아직 세나의 것이다.
    leader: [{ name: "국왕 락슈마나 세나", from: "1178-01-01", until: "1206-01-01" }],
  },
  "Kamarupa": {
    // 카마루파 후기 왕들의 계보는 단편적이다.
    leader: [{ name: "카마루파의 왕들 (계보 단편)" }],
  },
  // ── medieval-1200 확장 3: 제국의 제후 스물다섯 자리 ──────────────────
  // 1200년은 이중 선거(1198) 한복판이라 "황제"라는 한 사람에게 제국을 맡길 수
  // 없는 해다. 세 자리는 보드 날짜 그 해에 주인이 바뀐다 — **마인츠·잘츠부르크·
  // 리에주** — 그래서 구간으로 적었다.
  "Duchy of Saxony": {
    leader: [{ name: "공작 베른하르트 3세 (아스카니아)", from: "1180-01-01", until: "1212-02-09" }],
  },
  "Brunswick-Lüneburg": {
    // 사자공 하인리히의 아들. 1198년부터 대립왕이고, 1209년에 황제가 된다.
    leader: [{ name: "공작 오토 4세 (벨프 — 대립왕)", from: "1198-06-09", until: "1218-05-19" }],
  },
  "Margraviate of Brandenburg": {
    leader: [{ name: "변경백 오토 2세", from: "1184-01-01", until: "1205-07-04" }],
  },
  "Margraviate of Meissen": {
    leader: [{ name: "변경백 디트리히 1세 (베틴)", from: "1197-01-01", until: "1221-02-17" }],
  },
  "Landgraviate of Thuringia": {
    // 루도빙거는 튀링겐과 헤센을 한 손에 쥔다.
    leader: [{ name: "방백 헤르만 1세", from: "1190-01-01", until: "1217-04-25" }],
  },
  "Duchy of Bavaria": {
    leader: [{ name: "공작 루트비히 1세 (비텔스바흐)", from: "1183-01-01", until: "1231-09-15" }],
  },
  "Duchy of Swabia": {
    // 슈바벤 공작 필리프는 1198년부터 스스로를 로마인의 왕이라 부른다.
    leader: [{ name: "공작 필리프 폰 슈바벤 (대립왕)", from: "1196-01-01", until: "1208-06-21" }],
  },
  "County of Holstein": {
    leader: [{ name: "백작 아돌프 3세 폰 샤우엔부르크", from: "1164-01-01", until: "1203-01-01" }],
  },
  "Archbishopric of Cologne": {
    // 1180년부터 베스트팔렌 공작을 겸한다.
    leader: [{ name: "대주교 아돌프 폰 알테나", from: "1193-01-01", until: "1205-01-01" }],
  },
  "Archbishopric of Mainz": {
    leader: [
      { name: "대주교 콘라트 폰 비텔스바흐", from: "1183-01-01", until: "1200-10-25" },
      { name: "대주교 지크프리트 2세", from: "1200-10-25", until: "1230-09-09" },
    ],
  },
  "Archbishopric of Trier": {
    leader: [{ name: "대주교 요한 1세", from: "1189-01-01", until: "1212-07-15" }],
  },
  "Duchy of Austria": {
    // 게오르겐베르크 협약(1192)으로 슈타이어마르크가 바벤베르크에 붙었다.
    leader: [{ name: "공작 레오폴트 6세", from: "1198-01-01", until: "1230-07-28" }],
  },
  "Duchy of Carinthia": {
    leader: [{ name: "공작 울리히 2세 (스판하임)", from: "1181-01-01", until: "1202-08-10" }],
  },
  "Archbishopric of Salzburg": {
    leader: [
      { name: "대주교 아달베르트 3세", from: "1183-01-01", until: "1200-04-08" },
      { name: "대주교 에버하르트 2세", from: "1200-04-08", until: "1246-12-01" },
    ],
  },
  "County of Tyrol": {
    leader: [{ name: "백작 알베르트 3세", from: "1190-01-01", until: "1253-01-01" }],
  },
  "Kingdom of Bohemia": {
    // 1198년의 세습 왕관 — 제국 안이되 제 왕국이다.
    leader: [{ name: "국왕 오타카르 1세 (프르셰미슬)", from: "1197-01-01", until: "1230-12-15" }],
  },
  "Duchy of Brabant": {
    leader: [{ name: "공작 하인리히 1세", from: "1183-01-01", until: "1235-09-05" }],
  },
  "County of Flanders": {
    // 1202년에 4차 십자군을 이끌고 떠나 라틴 제국의 첫 황제가 된다.
    leader: [{ name: "백작 보두앵 9세", from: "1195-01-01", until: "1205-01-01" }],
  },
  "Prince-Bishopric of Liège": {
    leader: [
      { name: "주교 알베르 드 퀴크", from: "1194-01-01", until: "1200-02-01" },
      { name: "주교 위그 드 피에르퐁", from: "1200-02-01", until: "1229-04-12" },
    ],
  },
  "County of Luxembourg": {
    // 1190년대 말 룩셈부르크 백작위 계승은 사료가 엇갈린다.
    leader: [{ name: "룩셈부르크 백작가" }],
  },
  "County of Holland": {
    leader: [{ name: "백작 디르크 7세", from: "1190-01-01", until: "1203-11-04" }],
  },
  "Bishopric of Utrecht": {
    leader: [{ name: "주교 디르크 판 아레", from: "1197-01-01", until: "1212-01-01" }],
  },
  "Frisian Freedom": {
    // 영주를 두지 않은 것이 이 땅의 정체성이다 — 아이슬란드와 같은 이유로
    // 국가원수 자리를 비운다.
    leader: [{ name: "프리지아 자유민 회의 (영주 없음)" }],
    headOfState: [{ name: "(없음 — 영주를 두지 않는 자유)" }],
  },
  "County of Guelders": {
    leader: [{ name: "백작 오토 1세", from: "1182-01-01", until: "1207-01-01" }],
  },
  "Duchy of Zähringen": {
    // 부르고뉴 왕국의 제국 총독. 1218년 그의 죽음으로 가문이 끊긴다.
    leader: [{ name: "공작 베르톨트 5세", from: "1186-01-01", until: "1218-02-18" }],
  },
  // ── medieval-1200 확장 4: 이탈리아 코뮌 열넷 ──────────────────────────
  // 여기서 기관을 앉히는 건 자료가 없어서가 아니다. **코뮌은 사람이 아니라
  // 제도가 다스린다** — 집정관단은 여럿이 함께, 포데스타는 외지에서 데려와
  // 임기 1년이다. 한 사람을 왕처럼 앉히면 그 도시가 어떤 곳이었는지가 지워진다.
  // 라구사의 "렉토르 (월례 윤번제)"와 같은 자리다. 군주 넷만 사람이다.
  "Commune of Milan": {
    leader: [{ name: "밀라노 집정관단 (롬바르디아 동맹 맹주)" }],
    headOfState: [{ name: "(없음 — 코뮌)" }],
  },
  "Commune of Verona": {
    leader: [{ name: "베로나 코뮌 포데스타 (임기 1년)" }],
    headOfState: [{ name: "(없음 — 코뮌)" }],
  },
  "Republic of Genoa": {
    leader: [{ name: "제노바 집정관단 (코뮌 총회 선출)" }],
    headOfState: [{ name: "(없음 — 코뮌)" }],
  },
  "Republic of Pisa": {
    leader: [{ name: "피사 집정관단" }],
    headOfState: [{ name: "(없음 — 코뮌)" }],
  },
  "Commune of Florence": {
    leader: [{ name: "피렌체 코뮌 포데스타 (임기 1년)" }],
    headOfState: [{ name: "(없음 — 코뮌)" }],
  },
  "Commune of Siena": {
    leader: [{ name: "시에나 코뮌 포데스타" }],
    headOfState: [{ name: "(없음 — 코뮌)" }],
  },
  "Commune of Lucca": {
    leader: [{ name: "루카 코뮌 집정관단" }],
    headOfState: [{ name: "(없음 — 코뮌)" }],
  },
  "Commune of Bologna": {
    leader: [{ name: "볼로냐 코뮌 포데스타 (법학 도시의 자치)" }],
    headOfState: [{ name: "(없음 — 코뮌)" }],
  },
  "Commune of Modena": {
    leader: [{ name: "모데나 코뮌 포데스타" }],
    headOfState: [{ name: "(없음 — 코뮌)" }],
  },
  "Commune of Piacenza": {
    leader: [{ name: "피아첸차 코뮌 포데스타 (롬바르디아 동맹)" }],
    headOfState: [{ name: "(없음 — 코뮌)" }],
  },
  "Marquisate of Montferrat": {
    // 2년 뒤 제4차 십자군을 이끌고, 그 뒤 테살로니키 왕이 된다.
    leader: [{ name: "후작 보니파초 1세", from: "1192-01-01", until: "1207-09-04" }],
  },
  "County of Savoy": {
    leader: [{ name: "백작 토마 1세", from: "1189-01-01", until: "1233-03-01" }],
  },
  "Bishopric of Trent": {
    leader: [{ name: "주교 콘라트 2세 폰 베제노", from: "1188-01-01", until: "1205-01-01" }],
  },
  "Patriarchate of Aquileia": {
    leader: [{ name: "총대주교 펠레그리노 2세", from: "1195-01-01", until: "1204-08-13" }],
  },
  // ── medieval-1200 확장 5: 사하라 이남 아프리카 열한 자리 ──────────────
  // 열하나 중 열이 기관인데, 이탈리아 코뮌과 **이유가 정반대다**. 거긴 제도가
  // 다스려서 기관이 정답이었다. 여긴 사람이 다스렸는데 **왕명부가 단편이거나
  // 구전이라 이름이 안 남았다**. 없는 이름을 지어내지 않는 것이 이 파일의 첫
  // 규칙이고, 기록의 밀도 차이를 그대로 보여 주는 편이 정직하다.
  "Takrur": {
    leader: [{ name: "타크루르의 왕 (왕명부 단편)" }],
  },
  "Ghana Empire": {
    // 1200년의 와가두는 소소의 봉신으로 쪼그라들어 있다.
    leader: [{ name: "와가두의 가나 (소소 종주 아래)" }],
  },
  "Sosso Kingdom": {
    // 이 배치에서 유일하게 이름이 확실한 사람. 즉위 연도는 사료마다 달라
    // 구간을 적지 않는다 — 1235년 키리나에서 순디아타에게 진다.
    leader: [{ name: "왕 수만구루 칸테 (소소의 대장장이 왕)" }],
  },
  "Gao Kingdom": {
    leader: [{ name: "가오의 자 (왕명부 이설)" }],
  },
  "Kanem Empire": {
    // 두나마 다발레미의 치세는 1210년부터 — 보드 날짜에는 아직이다.
    leader: [{ name: "사이파와 왕조의 마이" }],
  },
  "Hausa City-States": {
    // 하우사 바크와이는 일곱 도시의 무리다. 한 사람을 앉히면 그게 지워진다.
    leader: [{ name: "하우사 일곱 도시의 사르키들 (단일 군주 없음)" }],
    headOfState: [{ name: "(없음 — 도시국가 연합)" }],
  },
  Ife: {
    leader: [{ name: "이페의 오오니" }],
  },
  "Kingdom of Alodia": {
    leader: [{ name: "소바의 왕 (누비아 기독교 왕국)" }],
  },
  "Kilwa Sultanate": {
    // 시라지 왕조의 계보는 킬와 연대기 판본마다 어긋난다.
    leader: [{ name: "킬와의 술탄 (시라지 계보 이설)" }],
  },
  "Sultanate of Mogadishu": {
    leader: [{ name: "모가디슈의 술탄 (베나디르 상인 과두)" }],
  },
  Mapungubwe: {
    // 이 왕국에 대해 우리가 아는 것은 거의 전부 고고학이다 — 언덕 위의
    // 왕과 금 코뿔소는 남았지만 이름은 남지 않았다.
    leader: [{ name: "마풍구브웨 언덕의 왕 (고고학 기록만)" }],
  },
  "Nepal Mandala": {
    leader: [{ name: "국왕 아리말라", from: "1200-01-01", until: "1216-01-01" }],
  },
};

// A scenario's own spelling for the same seat.
export const ALIASES = {
  "Kingdom of England": "Angevin Empire",
  "Ethiopian Empire": "Zagwe Ethiopia",
  "Kingdom of Serbia": "Grand Principality of Serbia",
  "Kingdom of Poland": "Duchy of Poland",
  "Russian Principalities": "Kievan Rus'",
};
