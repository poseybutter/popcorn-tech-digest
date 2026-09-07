// scripts/try-pipeline.js
// ─────────────────────────────────────────────────────────────
// fetch → prefilter → curate → assemble 파이프라인 시험 실행.
// 실행: npm run try:pipeline
// ─────────────────────────────────────────────────────────────

import crypto from "node:crypto";
import { fetchAll } from "../src/fetch.js";
import { prefilter } from "../src/prefilter.js";
import { curate } from "../src/curate.js";
import { assemble } from "../src/assemble.js";

function printItem(item, prefix = "") {
  const s = item.score?.toFixed(1) ?? "?";
  console.log(
    `${prefix}[${item.lane} / 점수 ${s}]  ` +
    `적용 ${item.applicability} · 인사이트 ${item.insight}  ` +
    `${item.source ?? "?"}`,
  );
  console.log(`${prefix}  제목: ${item.title}`);
  console.log(`${prefix}  원제: ${item.raw_title ?? "?"}`);
  console.log(`${prefix}  👉 ${item.hook}`);
  console.log(`${prefix}  💡 ${item.takeaway}`);
}

async function main() {
  // ── 1. 피드 수집 ──
  console.log("[1/4] 피드 수집 중…");
  const raw = await fetchAll();
  console.log(`  → ${raw.length}건 수집`);

  if (!raw.length) {
    console.log("수집된 글이 없습니다. 네트워크를 확인하세요.");
    return;
  }

  // ── 2. 사전 필터 ──
  console.log("[2/4] 프리필터…");
  const filtered = prefilter(raw);
  console.log(`  → ${filtered.length}건 통과 (${raw.length - filtered.length}건 컷)`);

  // ── 3. id 부여 ──
  const candidates = filtered.map((item) => ({
    id: crypto.randomUUID(),
    ...item,
  }));

  // ── 4. LLM 큐레이션 ──
  console.log(`[3/4] Gemini 큐레이션 중… (${candidates.length}건)`);
  const curated = await curate(candidates);
  console.log(`  → ${curated.length}건 반환`);

  // ── 5. 배치 ──
  console.log("[4/4] 드래프트 배치…");
  const draft = assemble(curated, candidates);
  console.log("");

  // ── 출력 ──
  console.log("=".repeat(72));

  console.log("\n⭐ HERO");
  if (draft.hero) {
    printItem(draft.hero, "  ");
  } else {
    console.log("  이번 주 없음");
  }

  console.log(`\n🔧 SIDES (${draft.sides.length}건)`);
  for (const item of draft.sides) {
    printItem(item, "  ");
    console.log("");
  }

  console.log(`🌱 NEXT (${draft.next.length}건)`);
  for (const item of draft.next) {
    printItem(item, "  ");
    console.log("");
  }

  console.log(`🗑️  DROPPED: ${draft.dropped.length}건`);

  console.log("\n" + "=".repeat(72));
  const total = (draft.hero ? 1 : 0) + draft.sides.length + draft.next.length + draft.dropped.length;
  console.log(
    `다이제스트: hero ${draft.hero ? 1 : 0} + sides ${draft.sides.length} + next ${draft.next.length}` +
    ` | dropped ${draft.dropped.length} | 총 ${total}건`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
