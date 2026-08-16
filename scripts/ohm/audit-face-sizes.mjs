/*!
 * Open Historia Map Editor
 * Copyright (c) 2026 Nicholas Krol - MIT License (see src/Editor/LICENSE).
 */

// Plan F — the face-size audit. A named face can be far larger than the polity
// whose name it carries, and nothing upstream notices.
//
//   node scripts/ohm/audit-face-sizes.mjs                     # every out/*.geojson
//   node scripts/ohm/audit-face-sizes.mjs <face-file.geojson> # one assembly
//
// WHY THIS IS A HEURISTIC AND NOT A GUARD
//
// assembleFaces names a face by containment: whichever polity centres fall
// inside it. Two labels inside one face is a `conflict` and is refused or
// resolved with measured guards. ONE label inside one face is assigned with no
// guard at all — and that is the hole. If the border between a small state and
// its neighbours never closed, the amalgam is one face, and if only the SMALL
// state's centre happens to land in it, the amalgam takes the small state's
// name in silence.
//
// Measured on victorian-1836 (2026-08-16), all three found by hand first:
//
//   Freie und Hansestadt Lübeck  main ring 2.086 deg² ≈ 15,000 km²   real ~300
//   Hohenzollern-Sigmaringen                2.583    ≈ 21,300        real ~1,142
//   Hessen-Homburg                          0.545    ≈  4,200        real ~275
//
// TWO CLEANER SIGNALS WERE TRIED AND BOTH FAILED. Recording them so the next
// person does not spend the afternoon again:
//
//   1. "Foreign centres inside the face's bbox." Does not discriminate —
//      Königreich Bayern tops that ranking with twelve, legitimately, because
//      a big country's bbox contains many small neighbours. Lübeck ties with
//      Granducato di Toscana, which is correct at 2.307 deg².
//   2. "Named faces that overlap each other." Faces do not overlap: sampling
//      every pair on 1836 found exactly one pair above 15%, and it is San
//      Marino sitting 100% inside Status Ecclesiasticus — an enclave drawn
//      correctly, not a defect. The walk produces a real partition; the
//      geometry is not wrong, only the NAME on one piece of it.
//
// So there is no ground-truth-free discriminator in the data: knowing that
// Hohenzollern-Sigmaringen is small is knowledge about the world, not about the
// file. What IS in the file is the polity's own words — a state that calls
// itself a free city or a principality is telling us its rough size. That is
// what this audits, and it is why this prints a list for a human instead of
// refusing anything.
//
// The fix for a confirmed hit is spec-side and already in use: faceKeepOut for
// the regions the face wrongly takes (keeps the face's good rings), or
// excludeFaces when the whole face is duplicate. See victorian-1836.spec.mjs.

import { readFileSync, readdirSync } from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "out");

// Tiered because the words carry different sizes, and every threshold sits ABOVE
// the largest CORRECT face measured in the fleet — a rule that cries wolf gets
// ignored, so the fleet must run silent except on real hits. It does: after the
// two corrections below, the only face that rings across fourteen boards is the
// one that is genuinely wrong.
//
//   도시국가 0.40   Lübeck rings at 2.086. The largest CORRECT free city measured
//                   is Freie Stadt Danzig at 0.272 — the Free City really was
//                   ~1,966 km², a territory rather than a city block. The first
//                   draft used 0.05 and called Danzig a defect.
//   공국(소) 0.20   Fürstentum Reuß-Gera 0.079 · Lippe 0.157 · Schaumburg-Lippe
//                   0.02 all clear it. These words only ever mean small.
//   공국     1.00   Ducato di Parma e Piacenza 0.687 (real ~6,000 km²) and
//                   Modena 0.617 clear it.
//
// AND ONE WORD WAS REMOVED ALTOGETHER. English "Principality of" carries no size
// in OHM's usage — it writes it for Liechtenstein AND for Novgorod. On the fleet
// it rang six times (Novgorod 59.5 deg², Vladimir-Suzdal 50.9, Galicia-Volhynia
// 28.2, Murom-Ryazan 18.1, Kyiv 12.6, Wallachia 7.7) and every one of those is
// the right size for what it names. Six false alarms to catch nothing is worse
// than no rule, so the word is gone and the German and Italian titles stay:
// those are the ones that actually mean "this is a small state".
const TIERS = [
  { limit: 0.40, label: "도시국가", words: ["freie und hansestadt", "freie stadt", "free city", "free and hanseatic", "hanseatic city", "reichsstadt", "città libera"] },
  { limit: 0.20, label: "공국(소)", words: ["fürstentum", "furstentum", "landgraviate", "landgrafschaft", "grafschaft", "hochstift", "abbey", "bishopric", "principato"] },
  { limit: 1.00, label: "공국", words: ["herzogtum", "ducato", "duchy of", "duché"] },
];
// "Grand" anywhere means the word is claiming size, so the duchy tier does not
// apply — Großherzogtum Mecklenburg-Schwerin 1.783 deg² and Granducato di Toscana
// 2.307 are both correct at that size.
const GRAND = ["großherzogtum", "grossherzogtum", "granducato", "grand duchy", "grand-duché"];

const ringsOf = (geometry) => {
  const out = [];
  const walk = (coords) => {
    if (!Array.isArray(coords) || coords.length === 0) return;
    if (Array.isArray(coords[0]) && typeof coords[0][0] === "number") { out.push(coords); return; }
    for (const child of coords) walk(child);
  };
  walk(geometry?.coordinates);
  return out;
};

// Shoelace in degrees. Comparing degrees to degrees is enough for a size smell,
// and converting to km² would only add a latitude term that cancels out of the
// comparison this makes.
const ringArea = (ring) => {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    sum += (x2 - x1) * (y2 + y1);
  }
  return Math.abs(sum) / 2;
};

export const auditFaceSizes = (featureCollection) => {
  const hits = [];
  for (const feature of featureCollection?.features ?? []) {
    const name = String(feature?.properties?.name ?? "");
    const lower = name.toLowerCase();
    if (GRAND.some((w) => lower.includes(w))) continue;
    const tier = TIERS.find((t) => t.words.some((w) => lower.includes(w)));
    if (!tier) continue;
    const rings = ringsOf(feature.geometry);
    if (rings.length === 0) continue;
    const main = rings.reduce((a, b) => (ringArea(a) >= ringArea(b) ? a : b));
    const area = ringArea(main);
    if (area <= tier.limit) continue;
    const xs = main.map((p) => p[0]);
    const ys = main.map((p) => p[1]);
    hits.push({
      name,
      tier: tier.label,
      area: +area.toFixed(3),
      limit: tier.limit,
      ratio: +(area / tier.limit).toFixed(1),
      rings: rings.length,
      bbox: [+Math.min(...xs).toFixed(2), +Math.min(...ys).toFixed(2), +Math.max(...xs).toFixed(2), +Math.max(...ys).toFixed(2)],
    });
  }
  return hits.sort((a, b) => b.ratio - a.ratio);
};

// ── CLI ──────────────────────────────────────────────────────────────────────
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(url.fileURLToPath(import.meta.url))) {
  const given = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const files = given.length > 0 ? given : readdirSync(OUT_DIR)
    .filter((f) => f.startsWith("era-borders-") && f.endsWith(".geojson"))
    .map((f) => path.join(OUT_DIR, f))
    .sort();

  let total = 0;
  for (const file of files) {
    let fc;
    try { fc = JSON.parse(readFileSync(file, "utf8")); } catch { continue; }
    const hits = auditFaceSizes(fc);
    if (hits.length === 0) continue;
    total += hits.length;
    console.log(`\n[ohm] ${path.basename(file)}`);
    for (const h of hits) {
      console.log(`  ${h.tier}  ${h.name.slice(0, 40).padEnd(42)}`
        + `주 링 ${String(h.area).padStart(7)}deg² = 문턱의 ${h.ratio}배 · 링 ${h.rings} · `
        + `bbox [${h.bbox.join(", ")}]`);
    }
  }
  if (total === 0) {
    console.log("[ohm] 이름이 스스로 말하는 크기보다 큰 면 없음.");
  } else {
    console.log(`\n[ohm] 의심 ${total}건. 이것은 판정이 아니라 **사람이 볼 목록**이다 —`);
    console.log("      면을 열어 실제 나라 크기와 비교하고, 맞으면 스펙에 faceKeepOut을 건다");
    console.log("      (면의 성한 링은 살리고 잘못 문 칸만 막는다). 파일 머리말 참조.");
  }
}
