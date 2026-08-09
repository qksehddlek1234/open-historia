/*! Open Historia — hand-written Korean for GADM region names © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// WHY THIS IS DATA AND NOT A TRANSLATION CALL.
//
// Region names reach the screen through translateLabel (runtime/translator.js),
// which returns the cached Korean if it has one and the raw English if it does
// not — then queues the string for the AI translator. So a board shows
// "경기도" next to "Gyeonggi-do" next to "Hokkaido" depending on what happened
// to be cached when you looked, which is exactly the 한영혼용 the player
// reported. Worse, a machine translator renders place names inconsistently
// between runs (음차 vs 의역) and mangles the diacritics GADM is full of.
//
// A place name is a fixed fact, not a sentence: it belongs in the shipped pack.
// This covers the twelve countries whose provinces the near-modern presets
// actually put on screen (338 names). Everything else still falls back to the
// live translator — no worse than before, and this file is where the next
// tranche goes.
//
//   node scripts/i18n/ko-region-names.mjs
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");

// GADM NAME_1 → 한국어. 키는 카탈로그의 표기 그대로여야 한다(어포스트로피와
// 발음구별부호 포함) — 한 글자만 달라도 매칭되지 않는다.
export const REGION_KO = {
  // ── 러시아 (83) ────────────────────────────────────────────────────────────
  Murmansk: "무르만스크", "Arkhangel'sk": "아르한겔스크", Nenets: "네네츠",
  "Yamal-Nenets": "야말네네츠", Kaliningrad: "칼리닌그라드", Karelia: "카렐리야",
  "City of St. Petersburg": "상트페테르부르크시", Leningrad: "레닌그라드주",
  Pskov: "프스코프", Novgorod: "노브고로드", "Tver'": "트베리",
  "Yaroslavl'": "야로슬라블", Vologda: "볼로그다", Vladimir: "블라디미르",
  Ivanovo: "이바노보", Kostroma: "코스트로마", Nizhegorod: "니즈니노브고로드",
  Smolensk: "스몰렌스크", Bryansk: "브랸스크", Kaluga: "칼루가", Orel: "오룔",
  "Moscow City": "모스크바시", Moskva: "모스크바주", Tula: "툴라",
  Lipetsk: "리페츠크", Kursk: "쿠르스크", Belgorod: "벨고로드",
  "Ryazan'": "랴잔", Tambov: "탐보프", Mordovia: "모르도바", Penza: "펜자",
  Voronezh: "보로네시", Volgograd: "볼고그라드", Rostov: "로스토프",
  Krasnodar: "크라스노다르", Adygey: "아디게야", "Karachay-Cherkess": "카라차이체르케스",
  "Stavropol'": "스타브로폴", "Kabardin-Balkar": "카바르디노발카르",
  Ingush: "인구셰티야", "North Ossetia": "북오세티야", Komi: "코미", Kirov: "키로프",
  "Mariy-El": "마리옐", "Perm'": "페름", Udmurt: "우드무르티야",
  Sverdlovsk: "스베르들롭스크", Chuvash: "추바시야", "Ul'yanovsk": "울리야놉스크",
  Samara: "사마라", Saratov: "사라토프", Tatarstan: "타타르스탄",
  Orenburg: "오렌부르크", "Astrakhan'": "아스트라한", Kalmyk: "칼미키야",
  Chechnya: "체첸", Dagestan: "다게스탄", Bashkortostan: "바시코르토스탄",
  Chelyabinsk: "첼랴빈스크", Kurgan: "쿠르간", "Khanty-Mansiy": "한티만시",
  "Tyumen'": "튜멘", Omsk: "옴스크", Tomsk: "톰스크", Novosibirsk: "노보시비르스크",
  Altay: "알타이 변경주", Kemerovo: "케메로보", Khakass: "하카시야",
  "Gorno-Altay": "알타이 공화국", Krasnoyarsk: "크라스노야르스크", Chukot: "추코트카",
  Sakha: "사하(야쿠티야)", Irkutsk: "이르쿠츠크", Tuva: "투바", Buryat: "부랴티야",
  "Zabaykal'ye": "자바이칼", Amur: "아무르", Yevrey: "유대인 자치주",
  "Primor'ye": "연해주", Magadan: "마가단", Khabarovsk: "하바롭스크",
  Sakhalin: "사할린", Kamchatka: "캄차카",

  // ── 우크라이나 (26) ────────────────────────────────────────────────────────
  Volyn: "볼린", "L'viv": "리비우", Rivne: "리브네", "Ternopil'": "테르노필",
  "Khmel'nyts'kyy": "흐멜니츠키", Zhytomyr: "지토미르", Vinnytsya: "빈니차",
  "Kiev City": "키이우시", Kiev: "키이우주", Chernihiv: "체르니히우",
  Cherkasy: "체르카시", Zakarpattia: "자카르파탸", "Ivano-Frankivs'k": "이바노프란키우스크",
  Chernivtsi: "체르니우치", Odessa: "오데사", Kirovohrad: "키로보흐라드",
  Mykolayiv: "미콜라이우", Kherson: "헤르손", Sumy: "수미", Poltava: "폴타바",
  Kharkiv: "하르키우", "Luhans'k": "루한스크", "Dnipropetrovs'k": "드니프로페트로우스크",
  Zaporizhia: "자포리자", Crimea: "크림", "Donets'k": "도네츠크",
  // 시드에만 있고 pmtiles 카탈로그에는 없는 행(시 단위 지역).
  "Sevastopol'": "세바스토폴",

  // ── 대한민국 (17) ─────────────────────────────────────────────────────────
  Incheon: "인천", Seoul: "서울", "Gyeonggi-do": "경기도",
  "Chungcheongbuk-do": "충청북도", "Gangwon-do": "강원도", Jeju: "제주",
  "Chungcheongnam-do": "충청남도", Sejong: "세종", "Jeollabuk-do": "전라북도",
  Daejeon: "대전", Gwangju: "광주", "Jeollanam-do": "전라남도", Daegu: "대구",
  "Gyeongsangbuk-do": "경상북도", Ulsan: "울산", "Gyeongsangnam-do": "경상남도",
  Busan: "부산",

  // ── 북한 (13) ─────────────────────────────────────────────────────────────
  Ryanggang: "량강도", "Rasŏn": "라선", "Hamgyŏng-bukto": "함경북도",
  "P'yŏngan-bukto": "평안북도", "Chagang-do": "자강도", "P'yŏngan-namdo": "평안남도",
  "P'yŏngyang": "평양", "Hwanghae-namdo": "황해남도", "Hwanghae-bukto": "황해북도",
  "Hamgyŏng-namdo": "함경남도", "Kaesŏng": "개성", "Kangwŏn-do": "강원도(북)",
  Kumgangsan: "금강산", "Sinŭiju": "신의주",

  // ── 일본 (47) ─────────────────────────────────────────────────────────────
  // GADM의 "Naoasaki"는 나가사키의 오타다 — 원문 그대로 키로 두어야 매칭된다.
  Naoasaki: "나가사키현", Saga: "사가현", Fukuoka: "후쿠오카현", Kumamoto: "구마모토현",
  Oita: "오이타현", Yamaguchi: "야마구치현", Miyazaki: "미야자키현", Shimane: "시마네현",
  Hiroshima: "히로시마현", Tottori: "돗토리현", Okayama: "오카야마현", "Hyōgo": "효고현",
  Ehime: "에히메현", Kochi: "고치현", Kagawa: "가가와현", Tokushima: "도쿠시마현",
  Okinawa: "오키나와현", Kagoshima: "가고시마현", Hokkaido: "홋카이도",
  Ishikawa: "이시카와현", Toyama: "도야마현", Akita: "아키타현", Niigata: "니가타현",
  Yamagata: "야마가타현", Tochigi: "도치기현", Fukushima: "후쿠시마현", Fukui: "후쿠이현",
  Kyoto: "교토부", Osaka: "오사카부", Shiga: "시가현", Nara: "나라현", Mie: "미에현",
  Gifu: "기후현", Aichi: "아이치현", Wakayama: "와카야마현", Nagano: "나가노현",
  Gunma: "군마현", Yamanashi: "야마나시현", Shizuoka: "시즈오카현", Saitama: "사이타마현",
  Ibaraki: "이바라키현", Chiba: "지바현", Kanagawa: "가나가와현", Tokyo: "도쿄도",
  Aomori: "아오모리현", Iwate: "이와테현", Miyagi: "미야기현",

  // ── 중국 (32) ─────────────────────────────────────────────────────────────
  "Xinjiang Uygur": "신장 위구르", Xizang: "시짱(티베트)", "Nei Mongol": "네이멍구",
  Liaoning: "랴오닝", Heilongjiang: "헤이룽장", Jilin: "지린", Gansu: "간쑤",
  Qinghai: "칭하이", "Ningxia Hui": "닝샤 후이", Shanxi: "산시(山西)",
  Shaanxi: "산시(陝西)", Sichuan: "쓰촨", Yunnan: "윈난", Chongqing: "충칭",
  Hubei: "후베이", Hunan: "후난", Guizhou: "구이저우", Guangxi: "광시",
  Hainan: "하이난", Beijing: "베이징", Hebei: "허베이", Tianjin: "톈진",
  Henan: "허난", Shandong: "산둥", Jiangsu: "장쑤", Anhui: "안후이",
  Jiangxi: "장시", Guangdong: "광둥", "Hong Kong": "홍콩", Fujian: "푸젠",
  Zhejiang: "저장", Shanghai: "상하이", Macau: "마카오",

  // ── 독일 (16) ─────────────────────────────────────────────────────────────
  "Schleswig-Holstein": "슐레스비히홀슈타인", Bremen: "브레멘", Niedersachsen: "니더작센",
  Hamburg: "함부르크", "Nordrhein-Westfalen": "노르트라인베스트팔렌", Saarland: "자를란트",
  "Rheinland-Pfalz": "라인란트팔츠", "Thüringen": "튀링겐", Hessen: "헤센",
  "Baden-Württemberg": "바덴뷔르템베르크", "Mecklenburg-Vorpommern": "메클렌부르크포어포메른",
  Berlin: "베를린", "Sachsen-Anhalt": "작센안할트", Brandenburg: "브란덴부르크",
  Sachsen: "작센", Bayern: "바이에른",

  // ── 프랑스 (13) ───────────────────────────────────────────────────────────
  Bretagne: "브르타뉴", "Pays de la Loire": "페이드라루아르", Normandie: "노르망디",
  "Hauts-de-France": "오드프랑스", "Île-de-France": "일드프랑스",
  "Centre-Val de Loire": "상트르발드루아르", "Nouvelle-Aquitaine": "누벨아키텐",
  "Grand Est": "그랑테스트", "Bourgogne-Franche-Comté": "부르고뉴프랑슈콩테",
  "Auvergne-Rhône-Alpes": "오베르뉴론알프", Occitanie: "옥시타니",
  "Provence-Alpes-Côte d'Azur": "프로방스알프코트다쥐르", Corse: "코르시카",

  // ── 영국 (4) ──────────────────────────────────────────────────────────────
  // GADM은 잉글랜드의 NAME_1을 "NA"로 흘렸다 — 지도에 그대로 뜨던 값이다.
  Scotland: "스코틀랜드", NA: "잉글랜드", Wales: "웨일스",

  // ── 영국 (46) ─────────────────────────────────────────────────────────────
  // ONS International Territorial Level 2 (2025, OGL). 처음엔 카운티·단일자치체
  // 218개를 넣었는데 러시아 83·미국 51 옆에서 영국만 218은 명백히 어긋났고,
  // 원본도 그 정도로 잘게 나누지 않는다. ITL2는 46개로 그 사이에 정확히 놓인다.
  "Tees Valley": "티스밸리", "Northumberland, Durham and Tyne & Wear": "노섬벌랜드·더럼·타인위어",
  Cumbria: "컴브리아", "Greater Manchester": "그레이터맨체스터", Lancashire: "랭커셔",
  Cheshire: "체셔", Merseyside: "머지사이드",
  "East Yorkshire and Northern Lincolnshire": "이스트요크셔·노스링컨셔",
  "North Yorkshire": "노스요크셔", "South Yorkshire": "사우스요크셔",
  "West Yorkshire": "웨스트요크셔", "Derbyshire and Nottinghamshire": "더비셔·노팅엄셔",
  "Leicestershire, Rutland and Northamptonshire": "레스터셔·러틀랜드·노샘프턴셔",
  Lincolnshire: "링컨셔", "Herefordshire, Worcestershire and Warwickshire": "헤리퍼드셔·우스터셔·워릭셔",
  "Shropshire and Staffordshire": "슈롭셔·스태퍼드셔", "West Midlands": "웨스트미들랜즈",
  "Bedfordshire and Hertfordshire": "베드퍼드셔·하트퍼드셔", Essex: "에식스",
  "Cambridgeshire and Peterborough": "케임브리지셔·피터버러", Norfolk: "노퍽", Suffolk: "서퍽",
  "Inner London - West": "이너런던 서부", "Inner London - East": "이너런던 동부",
  "Outer London - East and North East": "아우터런던 동·북동",
  "Outer London - South": "아우터런던 남부",
  "Outer London - West and North West": "아우터런던 서·북서",
  "Berkshire, Buckinghamshire and Oxfordshire": "버크셔·버킹엄셔·옥스퍼드셔",
  "Surrey, East and West Sussex": "서리·이스트/웨스트서식스",
  "Hampshire and Isle of Wight": "햄프셔·와이트섬", Kent: "켄트",
  "Cornwall and Isles of Scilly": "콘월·실리 제도", Devon: "데번",
  "West of England": "웨스트오브잉글랜드",
  "North Somerset, Somerset and Dorset": "노스서머싯·서머싯·도싯",
  "Gloucestershire and Wiltshire": "글로스터셔·윌트셔",
  "North Wales": "북웨일스", "Mid and South West Wales": "중·남서웨일스",
  "South East Wales": "남동웨일스", "Eastern Scotland": "동부 스코틀랜드",
  "East Central Scotland": "동중부 스코틀랜드", "Highlands and Islands": "하일랜드·아일랜즈",
  "West Central Scotland": "서중부 스코틀랜드", "North Eastern Scotland": "북동부 스코틀랜드",
  "Southern Scotland": "남부 스코틀랜드", "Northern Ireland": "북아일랜드",

  // ── 이탈리아 (20) ─────────────────────────────────────────────────────────
  "Valle d'Aosta": "발레다오스타", Lombardia: "롬바르디아", Piemonte: "피에몬테",
  Liguria: "리구리아", "Emilia-Romagna": "에밀리아로마냐", Toscana: "토스카나",
  "Trentino-Alto Adige": "트렌티노알토아디제", Veneto: "베네토",
  "Friuli-Venezia Giulia": "프리울리베네치아줄리아", Marche: "마르케", Umbria: "움브리아",
  Abruzzo: "아브루초", Lazio: "라치오", Molise: "몰리세", Apulia: "풀리아",
  Sardegna: "사르데냐", Campania: "캄파니아", Basilicata: "바실리카타",
  Calabria: "칼라브리아", Sicily: "시칠리아",

  // ── 폴란드 (16) ───────────────────────────────────────────────────────────
  Zachodniopomorskie: "서포모제", Lubuskie: "루부시", "Dolnośląskie": "하실롱스크",
  Pomorskie: "포모제", "Kujawsko-Pomorskie": "쿠야비포모제",
  "Warmińsko-Mazurskie": "바르미아마주리", Wielkopolskie: "대폴란드",
  "Łódzkie": "우치", Opolskie: "오폴레", "Śląskie": "실롱스크",
  "Świętokrzyskie": "시비엥토크시스키에", Mazowieckie: "마조프셰",
  "Małopolskie": "소폴란드", Podkarpackie: "포드카르파츠키에", Podlaskie: "포들라시에",
  Lubelskie: "루블린",

  // ── 미국 (51) ─────────────────────────────────────────────────────────────
  Alaska: "알래스카", Hawaii: "하와이", Washington: "워싱턴주", Oregon: "오리건",
  Idaho: "아이다호", Montana: "몬태나", Wyoming: "와이오밍", "North Dakota": "노스다코타",
  "South Dakota": "사우스다코타", Nebraska: "네브래스카", Minnesota: "미네소타",
  Iowa: "아이오와", California: "캘리포니아", Nevada: "네바다", Utah: "유타",
  Arizona: "애리조나", Colorado: "콜로라도", "New Mexico": "뉴멕시코", Kansas: "캔자스",
  Oklahoma: "오클라호마", Missouri: "미주리", Arkansas: "아칸소", Texas: "텍사스",
  Louisiana: "루이지애나", Wisconsin: "위스콘신", Michigan: "미시간", "New York": "뉴욕",
  Maine: "메인", Vermont: "버몬트", "New Hampshire": "뉴햄프셔",
  Massachusetts: "매사추세츠", Connecticut: "코네티컷", "Rhode Island": "로드아일랜드",
  Illinois: "일리노이", Indiana: "인디애나", Kentucky: "켄터키", Mississippi: "미시시피",
  Tennessee: "테네시", Alabama: "앨라배마", Ohio: "오하이오", "West Virginia": "웨스트버지니아",
  Virginia: "버지니아", Georgia: "조지아주", "North Carolina": "노스캐롤라이나",
  "South Carolina": "사우스캐롤라이나", Florida: "플로리다", Pennsylvania: "펜실베이니아",
  "District of Columbia": "컬럼비아 특별구", Maryland: "메릴랜드", "New Jersey": "뉴저지",
  Delaware: "델라웨어",
};

if (import.meta.url === url.pathToFileURL(process.argv[1] ?? "").href) {
  let written = 0;
  for (const packPath of [
    path.join(ROOT, "public", "lang", "ko.json"),
    path.join(ROOT, "server", "data", "lang", "ko.json"),
  ]) {
    const pack = JSON.parse(readFileSync(packPath, "utf8"));
    let changed = 0;
    for (const [en, ko] of Object.entries(REGION_KO)) {
      if (pack[en] !== ko) {
        pack[en] = ko;
        changed += 1;
      }
    }
    writeFileSync(packPath, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
    console.log(`${path.relative(ROOT, packPath)}: ${changed} region name(s) written`);
    written += changed;
  }
  console.log(`region names in the dictionary: ${Object.keys(REGION_KO).length}`);
}
