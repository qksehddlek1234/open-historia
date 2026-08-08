/*! Open Historia — preset fleet rebuild © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Regenerate EVERY preset scenario from its spec, then re-sync prompt packs —
// one command, so "the presets" can never be half-current again:
//
//   node scripts/presets/rebuild-all.mjs
//
// Order matters twice: prompts.json is copied from the default scenario at
// build time and then sync-prompts refreshes the changed keys from the current
// JS defaults, so a rebuild always ends on the newest prompt text. And the
// manifest merge is idempotent, so rerunning this is always safe. Requires
// public/assets/regions.pmtiles and cities-seed.json (repo install assets).
//
// The generated folders are LARGE (each regions.geojson clones the world seed)
// and deliberately gitignored — the SPECS are the source of truth; scenario
// folders are build products, like dist/.

import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

const specs = readdirSync(__dirname)
  .filter((name) => name.endsWith(".spec.mjs"))
  .sort();
if (specs.length === 0) {
  console.error("[rebuild-all] no *.spec.mjs found — nothing to build");
  process.exit(1);
}

console.log(`[rebuild-all] ${specs.length}개 프리셋 스펙 재생성:\n`);
const failed = [];
for (const spec of specs) {
  try {
    execFileSync(process.execPath, [path.join(__dirname, "build-preset.mjs"), path.join(__dirname, spec)], {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
    });
  } catch {
    failed.push(spec);
  }
}

console.log("[rebuild-all] 프롬프트 팩 동기화:");
try {
  execFileSync(process.execPath, [path.join(__dirname, "sync-prompts.mjs")], {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });
} catch {
  failed.push("sync-prompts.mjs");
}

if (failed.length > 0) {
  console.error(`\n[rebuild-all] 실패 ${failed.length}건: ${failed.join(", ")} — 위 로그 확인`);
  process.exit(1);
}
console.log(`\n[rebuild-all] 완료 — ${specs.length}개 프리셋 + 프롬프트 동기화. 서버 재시작 후 시나리오 목록에서 확인.`);
