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

  // ── 중국 지급시 (344) ──────────────────────────────────────────────────────
  // 성(省)이 지급시로 세분화되면서 들어온 것들. 위의 32개 성 이름은 카탈로그
  // (regions.pmtiles)에 아직 남아 있으므로 함께 둔다 — 시드가 카탈로그보다
  // 앞서 있는 상태이고, 둘 다 화면에 닿을 수 있다.
  //
  // 표기는 외래어 표기법의 중국어 표기(신해혁명 이후 지명은 현대 중국어 발음).
  // 소수민족 자치주는 "…족"을 붙여 성격이 드러나게 했다 — 지도에서 그게
  // 자치주라는 사실이 1935년 보드의 서사에 실제로 쓰인다.
  Anqing: "안칭", Bengbu: "벙부", Bozhou: "보저우", Chaohu: "차오후",
  Chizhou: "츠저우", Chuzhou: "추저우", Fuyang: "푸양", Hefei: "허페이",
  Huaibei: "화이베이", Huainan: "화이난", Huangshan: "황산", "Lu'an": "루안",
  "Ma'anshan": "마안산", Suzhou: "쑤저우", Tongling: "퉁링", Wuhu: "우후",
  Xuancheng: "쉬안청",
  Fuzhou: "푸저우", Longyan: "룽옌", Nanping: "난핑", Ningde: "닝더",
  Putian: "푸톈", Quanzhou: "취안저우", Sanming: "싼밍", Xiamen: "샤먼",
  Zhangzhou: "장저우",
  Baiyin: "바이인", Dingxi: "딩시", "Gannan Tibetan": "간난 티베트족",
  Jiayuguan: "자위관", Jinchang: "진창", Jiuquan: "주취안", Lanzhou: "란저우",
  "Linxia Hui": "린샤 후이족", Longnan: "룽난", Pingliang: "핑량",
  Qingyang: "칭양", Tianshui: "톈수이", Wuwei: "우웨이", Zhangye: "장예",
  Chaozhou: "차오저우", Dongguan: "둥관", Foshan: "포산", Guangzhou: "광저우",
  Heyuan: "허위안", Huizhou: "후이저우", Jiangmen: "장먼", Jieyang: "제양",
  Maoming: "마오밍", Meizhou: "메이저우", Qingyuan: "칭위안", Shantou: "산터우",
  Shanwei: "산웨이", Shaoguan: "사오관", Shenzhen: "선전", Yangjiang: "양장",
  Yunfu: "윈푸", Zhanjiang: "잔장", Zhaoqing: "자오칭", Zhongshan: "중산",
  Zhuhai: "주하이",
  Baise: "바이써", Beihai: "베이하이", Chongzuo: "충쭤", Fangchenggang: "팡청강",
  Guigang: "구이강", Guilin: "구이린", Hechi: "허츠", Hezhou: "허저우",
  Laibin: "라이빈", Liuzhou: "류저우", Nanning: "난닝", Qinzhou: "친저우",
  Wuzhou: "우저우", Yulin: "위린",
  Anshun: "안순", Bijie: "비제", Guiyang: "구이양", Liupanshui: "류판수이",
  "Qiandongnan Miao and Dong": "첸둥난 먀오족 둥족",
  "Qiannan Buyei and Miao": "첸난 부이족 먀오족",
  "Qianxinan Buyei and Miao": "첸시난 부이족 먀오족",
  Tongren: "퉁런", Zunyi: "쭌이",
  Haikou: "하이커우", Hainan: "하이난", Sanya: "싼야",
  Baoding: "바오딩", Cangzhou: "창저우", Chengde: "청더", Handan: "한단",
  Hengshui: "헝수이", Langfang: "랑팡", Qinhuangdao: "친황다오",
  Shijiazhuang: "스자좡", Tangshan: "탕산", Xingtai: "싱타이",
  Zhangjiakou: "장자커우",
  Daqing: "다칭", "Daxing'anling": "다싱안링", Harbin: "하얼빈", Hegang: "허강",
  Heihe: "헤이허", Jiamusi: "자무쓰", Jixi: "지시", Mudanjiang: "무단장",
  Qiqihar: "치치하얼", Qitaihe: "치타이허", Shuangyashan: "솽야산",
  Suihua: "쑤이화", Yichun: "이춘",
  Anyang: "안양", Hebi: "허비", Jiaozuo: "자오쭤", Jiyuanshi: "지위안시",
  Kaifeng: "카이펑", Luohe: "뤄허", Luoyang: "뤄양", Nanyang: "난양",
  Pingdingshan: "핑딩산", Puyang: "푸양", Sanmenxia: "싼먼샤", Shangqiu: "상추",
  Xinxiang: "신샹", Xinyang: "신양", Xuchang: "쉬창", Zhengzhou: "정저우",
  Zhoukou: "저우커우", Zhumadian: "주마뎬",
  "Enshi Tujia and Miao": "언스 투자족 먀오족", Ezhou: "어저우",
  Huanggang: "황강", Huangshi: "황스", Jingmen: "징먼", Jingzhou: "징저우",
  Qianjiang: "첸장", Shennongjia: "선눙자", Shiyan: "스옌",
  "Suizhou Shi": "쑤이저우", Tianmen: "톈먼", Wuhan: "우한", Xiangfan: "샹판",
  Xianning: "셴닝", Xiantao: "셴타오", Xiaogan: "샤오간", Yichang: "이창",
  Changde: "창더", Changsha: "창사", Chenzhou: "천저우", Hengyang: "헝양",
  Huaihua: "화이화", Loudi: "러우디", Shaoyang: "사오양", Xiangtan: "샹탄",
  "Xiangxi Tujia and Miao": "샹시 투자족 먀오족", Yiyang: "이양",
  Yongzhou: "융저우", Yueyang: "웨양", Zhangjiajie: "장자제", Zhuzhou: "주저우",
  Changzhou: "창저우", "Huai'an": "화이안", Lianyungang: "롄윈강",
  Nanjing: "난징", Nantong: "난퉁", Suqian: "쑤첸", Taizhou: "타이저우",
  Wuxi: "우시", Xuzhou: "쉬저우", Yancheng: "옌청", Yangzhou: "양저우",
  Zhenjiang: "전장",
  Ganzhou: "간저우", "Ji'an": "지안", Jingdezhen: "징더전", Jiujiang: "주장",
  Nanchang: "난창", Pingxiang: "핑샹", Shangrao: "상라오", Xinyu: "신위",
  Yingtan: "잉탄",
  Baicheng: "바이청", Baishan: "바이산", Changchun: "창춘", Jilin: "지린",
  Liaoyuan: "랴오위안", Siping: "쓰핑", Songyuan: "쑹위안", Tonghua: "퉁화",
  "Yanbian Korean": "옌볜 조선족",
  Anshan: "안산", Benxi: "번시", Chaoyang: "차오양", Dalian: "다롄",
  Dandong: "단둥", Fushun: "푸순", Fuxin: "푸신", Huludao: "후루다오",
  Jinzhou: "진저우", Liaoyang: "랴오양", Panjin: "판진", Shenyang: "선양",
  Tieling: "톄링",
  Alxa: "아라산", Baotou: "바오터우", Baynnur: "바옌나오얼", Chifeng: "츠펑",
  Hohhot: "후허하오터", Hulunbuir: "후룬베이얼", Ordos: "어얼둬쓰",
  Tongliao: "퉁랴오", "Ulaan Chab": "울란차브", Wuhai: "우하이",
  "Xilin Gol": "시린궈러", "Xing'an": "싱안",
  Guyuan: "구위안", Shizuishan: "스쭈이산", Wuzhong: "우중", Yinchuan: "인촨",
  Zhongwei: "중웨이",
  "Golog Tibetan": "궈뤄 티베트족", "Gyêgu Tibetan": "위수 티베트족",
  "Haibei Tibetan": "하이베이 티베트족", Haidong: "하이둥",
  "Hainan Tibetan": "하이난 티베트족",
  "Haixi Mongol and Tibetan": "하이시 몽골족 티베트족",
  "Huangnan Tibetan": "황난 티베트족", Xining: "시닝",
  Ankang: "안캉", Baoji: "바오지", Hanzhong: "한중", Shangluo: "상뤄",
  Tongchuan: "퉁촨", Weinan: "웨이난", "Xi'an": "시안", Xianyang: "셴양",
  "Yan'an": "옌안",
  Binzhou: "빈저우", Dezhou: "더저우", Dongying: "둥잉", Heze: "허쩌",
  Jinan: "지난", Jining: "지닝", Laiwu: "라이우", Liaocheng: "랴오청",
  Linyi: "린이", Qingdao: "칭다오", Rizhao: "르자오", "Tai'an": "타이안",
  Weifang: "웨이팡", Weihai: "웨이하이", Yantai: "옌타이", Zaozhuang: "짜오좡",
  Zibo: "쯔보",
  Changzhi: "창즈", Datong: "다퉁", Jincheng: "진청", Jinzhong: "진중",
  Linfen: "린펀", Luliang: "뤼량", Shuozhou: "숴저우", Taiyuan: "타이위안",
  Xinzhou: "신저우", Yangquan: "양취안", Yuncheng: "윈청",
  Bazhong: "바중", Chengdu: "청두", Dazhou: "다저우", Deyang: "더양",
  "Garzê Tibetan": "간쯔 티베트족", "Guang'an": "광안", Guangyuan: "광위안",
  Leshan: "러산", "Liangshan Yi": "량산 이족", Luzhou: "루저우",
  Meishan: "메이산", Mianyang: "몐양", Nanchong: "난충", Neijiang: "네이장",
  "Ngawa Tibetan and Qiang": "아바 티베트족 창족", Panzhihua: "판즈화",
  Suining: "쑤이닝", "Ya'an": "야안", Yibin: "이빈", Zigong: "쯔궁",
  Ziyang: "쯔양",
  Aksu: "아커쑤", Altay: "알타이", "Bayin'gholin Mongol": "바인궈렁 몽골족",
  "Börtala Mongol": "보얼타라 몽골족", "Changji Hui": "창지 후이족",
  Hami: "하미", "Ili Kazakh": "이리 카자흐족", Karamay: "커라마이",
  Kashgar: "카스", Khotan: "허톈", "Kizilsu Kirghiz": "커쯔러쑤 키르기스족",
  Shihezi: "스허쯔", Tacheng: "타청", Turfan: "투루판", "Ürümqi": "우루무치",
  Chamdo: "창두", Lhasa: "라싸", Nagchu: "나취", Ngari: "아리",
  Nyingtri: "린즈", Shannan: "산난", Shigatse: "시가체",
  Baoshan: "바오산", "Chuxiong Yi": "추슝 이족", "Dali Bai": "다리 바이족",
  "Dehong Dai and Jingpo": "더훙 다이족 징포족",
  "Dêqên Tibetan": "디칭 티베트족", "Honghe Hani and Yi": "훙허 하니족 이족",
  Kunming: "쿤밍", Lijiang: "리장", Lincang: "린창", "Nujiang Lisu": "누장 리수족",
  "Pu'er": "푸얼", Qujing: "취징",
  "Wenshan Zhuang and Miao": "원산 좡족 먀오족",
  "Xishuangbanna Dai": "시솽반나 다이족", Yuxi: "위시", Zhaotong: "자오퉁",
  Hangzhou: "항저우", Huzhou: "후저우", Jiaxing: "자싱", Jinhua: "진화",
  Lishui: "리수이", Ningbo: "닝보", Quzhou: "취저우", Shaoxing: "사오싱",
  Wenzhou: "원저우", Zhoushan: "저우산",

  // ── 프랑스 데파르트망 (96) ─────────────────────────────────────────────────
  // 레지옹 13개는 1935년 프랑스를 그리기엔 너무 굵었다(원본은 111). 데파르트망은
  // 1790년부터 프랑스의 실제 행정 단위이고, 시대 프리셋 어디에 놓아도 맞는다.
  Ain: "앵", Allier: "알리에", "Ardèche": "아르데슈", Cantal: "캉탈",
  "Drôme": "드롬", "Haute-Loire": "오트루아르", "Haute-Savoie": "오트사부아",
  "Isère": "이제르", Loire: "루아르", "Puy-de-Dôme": "퓌드돔", "Rhône": "론",
  Savoie: "사부아", "Côte-d'Or": "코트도르", Doubs: "두", "Haute-Saône": "오트손",
  Jura: "쥐라", "Nièvre": "니에브르", "Saône-et-Loire": "손에루아르",
  "Territoire de Belfort": "벨포르 지방", Yonne: "욘", "Côtes-d'Armor": "코트다르모르",
  "Finistère": "피니스테르", "Ille-et-Vilaine": "일에빌렌", Morbihan: "모르비앙",
  Cher: "셰르", "Eure-et-Loir": "외르에루아르", Indre: "앵드르",
  "Indre-et-Loire": "앵드르에루아르", "Loir-et-Cher": "루아르에셰르", Loiret: "루아레",
  "Corse-du-Sud": "남코르스", "Haute-Corse": "오트코르스", Ardennes: "아르덴",
  Aube: "오브", "Bas-Rhin": "바랭", "Haut-Rhin": "오랭", "Haute-Marne": "오트마른",
  Marne: "마른", "Meurthe-et-Moselle": "뫼르트에모젤", Meuse: "뫼즈",
  Moselle: "모젤", Vosges: "보주", Aisne: "엔", Nord: "노르", Oise: "우아즈",
  "Pas-de-Calais": "파드칼레", Somme: "솜", Essonne: "에손",
  "Hauts-de-Seine": "오드센", Paris: "파리", "Seine-et-Marne": "센에마른",
  "Seine-Saint-Denis": "센생드니", "Val-d'Oise": "발두아즈",
  "Val-de-Marne": "발드마른", Yvelines: "이블린", Calvados: "칼바도스",
  Eure: "외르", Manche: "망슈", Orne: "오른", "Seine-Maritime": "센마리팀",
  Charente: "샤랑트", "Charente-Maritime": "샤랑트마리팀", "Corrèze": "코레즈",
  Creuse: "크뢰즈", "Deux-Sèvres": "되세브르", Dordogne: "도르도뉴",
  Gironde: "지롱드", "Haute-Vienne": "오트비엔", Landes: "랑드",
  "Lot-et-Garonne": "로에가론", "Pyrénées-Atlantiques": "피레네자틀랑티크",
  Vienne: "비엔", "Ariège": "아리에주", Aude: "오드", Aveyron: "아베롱",
  Gard: "가르", Gers: "제르", "Haute-Garonne": "오트가론",
  "Hautes-Pyrénées": "오트피레네", "Hérault": "에로", Lot: "로", "Lozère": "로제르",
  "Pyrénées-Orientales": "피레네조리앙탈", Tarn: "타른",
  "Tarn-et-Garonne": "타른에가론", "Loire-Atlantique": "루아르아틀랑티크",
  "Maine-et-Loire": "멘에루아르", Mayenne: "마옌", Sarthe: "사르트",
  "Vendée": "방데", "Alpes-de-Haute-Provence": "알프드오트프로방스",
  "Alpes-Maritimes": "알프마리팀", "Bouches-du-Rhône": "부슈뒤론",
  "Hautes-Alpes": "오트잘프", Var: "바르", Vaucluse: "보클뤼즈",

  // ── 이탈리아 프로빈차 (110) ────────────────────────────────────────────────
  Chieti: "키에티", "L'Aquila": "라퀼라", Pescara: "페스카라", Teramo: "테라모",
  Bari: "바리", "Barletta-Andria-Trani": "바를레타안드리아트라니",
  Brindisi: "브린디시", Foggia: "포자", Lecce: "레체", Taranto: "타란토",
  Matera: "마테라", Potenza: "포텐차", Catanzaro: "카탄차로", Cosenza: "코젠차",
  Crotone: "크로토네", "Reggio Di Calabria": "레조디칼라브리아",
  "Vibo Valentia": "비보발렌티아", Avellino: "아벨리노", Benevento: "베네벤토",
  Caserta: "카세르타", Napoli: "나폴리", Salerno: "살레르노", Bologna: "볼로냐",
  Ferrara: "페라라", "Forli'-Cesena": "폴리체세나", Modena: "모데나",
  Parma: "파르마", Piacenza: "피아첸차", Ravenna: "라벤나",
  "Reggio Nell'Emilia": "레조넬에밀리아", Rimini: "리미니", Gorizia: "고리치아",
  Pordenone: "포르데노네", Trieste: "트리에스테", Udine: "우디네",
  Frosinone: "프로시노네", Latina: "라티나", Rieti: "리에티", Roma: "로마",
  Viterbo: "비테르보", Genova: "제노바", Imperia: "임페리아",
  "La Spezia": "라스페치아", Savona: "사보나", Bergamo: "베르가모",
  Brescia: "브레시아", Como: "코모", Cremona: "크레모나", Lecco: "레코",
  Lodi: "로디", Mantua: "만토바", Milano: "밀라노",
  "Monza and Brianza": "몬차브리안차", Pavia: "파비아", Sondrio: "손드리오",
  Varese: "바레세", Ancona: "안코나", "Ascoli Piceno": "아스콜리피체노",
  Fermo: "페르모", Macerata: "마체라타",
  // GADM이 "Pesaro e Urbino"의 공백을 잃어버린 채 보낸다 — 키는 카탈로그 표기
  // 그대로여야 하므로 잘못된 쪽을 키로 두고 한국어만 바로 적는다.
  "Pesaro EUrbino": "페사로에우르비노",
  Campobasso: "캄포바소", Isernia: "이세르니아", Alessandria: "알레산드리아",
  Asti: "아스티", Biella: "비엘라", Cuneo: "쿠네오", Novara: "노바라",
  Torino: "토리노", "Verbano-Cusio-Ossola": "베르바노쿠시오오솔라",
  Vercelli: "베르첼리", Cagliari: "칼리아리",
  "Carbonia-Iglesias": "카르보니아이글레시아스", "Medio Campidano": "메디오캄피다노",
  Nuoro: "누오로", Ogliastra: "올리아스트라", "Olbia-Tempio": "올비아템피오",
  Oristano: "오리스타노", Sassari: "사사리", Agrigento: "아그리젠토",
  Caltanissetta: "칼타니세타", Catania: "카타니아", Enna: "엔나",
  Messina: "메시나", Palermo: "팔레르모", Ragusa: "라구사", Syracuse: "시라쿠사",
  Trapani: "트라파니", Arezzo: "아레초", Florence: "피렌체", Grosseto: "그로세토",
  Livorno: "리보르노", Lucca: "루카", "Massa Carrara": "마사카라라", Pisa: "피사",
  Pistoia: "피스토이아", Prato: "프라토", Siena: "시에나", Bolzano: "볼차노",
  Trento: "트렌토", Perugia: "페루자", Terni: "테르니", Aosta: "아오스타",
  Belluno: "벨루노", Padua: "파도바", Rovigo: "로비고", Treviso: "트레비소",
  Venezia: "베네치아", Verona: "베로나", Vicenza: "비첸차",

  // ── 독일 NUTS-2 행정관구 (38) ──────────────────────────────────────────────
  // 16개 주로는 1939년 보드에서 프랑스 96 옆에 16이라 너무 굵었고, GADM level-2
  // (Kreis 403)는 원본 89의 4.5배라 과했다. Eurostat GISCO의 NUTS-2가 그 사이
  // 층이고, 독일에서는 그게 통계 구역이 아니라 진짜 행정관구(Regierungsbezirk)다.
  // 아래는 주 이름과 겹치지 않는 것만 — 겹치는 아홉(베를린·함부르크·브레멘·
  // 브란덴부르크·자를란트·튀링겐·작센안할트·슐레스비히홀슈타인·
  // 메클렌부르크포어포메른)은 이미 주 목록에 있다.
  Oberbayern: "오버바이에른", Niederbayern: "니더바이에른", Oberpfalz: "오버팔츠",
  Oberfranken: "오버프랑켄", Mittelfranken: "미텔프랑켄", Unterfranken: "운터프랑켄",
  Schwaben: "슈바벤", Stuttgart: "슈투트가르트", Karlsruhe: "카를스루에",
  Freiburg: "프라이부르크", "Tübingen": "튀빙겐", Darmstadt: "다름슈타트",
  "Gießen": "기센", Kassel: "카셀", Braunschweig: "브라운슈바이크",
  Hannover: "하노버", "Lüneburg": "뤼네부르크", "Weser-Ems": "베저엠스",
  "Düsseldorf": "뒤셀도르프", "Köln": "쾰른", "Münster": "뮌스터",
  Detmold: "데트몰트", Arnsberg: "아른스베르크", Koblenz: "코블렌츠",
  Trier: "트리어", "Rheinhessen-Pfalz": "라인헤센팔츠", Dresden: "드레스덴",
  Chemnitz: "켐니츠", Leipzig: "라이프치히",

  // ── 독일 주 (16) ──────────────────────────────────────────────────────────
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
