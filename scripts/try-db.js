// scripts/try-db.js
// ─────────────────────────────────────────────────────────────
// fetch → prefilter → curate → assemble → saveDraft 전체 파이프라인 시험.
// 실제 Supabase에 데이터가 들어가므로 확인 후 필요 시 삭제.
// 실행: npm run try:db
// ─────────────────────────────────────────────────────────────

import crypto from "node:crypto";
import { fetchAll } from "../src/fetch.js";
import { prefilter } from "../src/prefilter.js";
import { curate } from "../src/curate.js";
import { assemble } from "../src/assemble.js";
import { saveDraft } from "../src/db.js";

async function main() {
  console.log("[1/5] 피드 수집 중…");
  const raw = await fetchAll();
  console.log(`  → ${raw.length}건 수집`);

  if (!raw.length) {
    console.log("수집된 글이 없습니다.");
    return;
  }

  console.log("[2/5] 프리필터…");
  const filtered = prefilter(raw);
  console.log(`  → ${filtered.length}건 통과 (${raw.length - filtered.length}건 컷)`);

  const candidates = filtered.map((item) => ({
    id: crypto.randomUUID(),
    ...item,
  }));

  console.log(`[3/5] Gemini 큐레이션 중… (${candidates.length}건)`);
  const curated = await curate(candidates);
  console.log(`  → ${curated.length}건 반환`);

  console.log("[4/5] 드래프트 배치…");
  const draft = assemble(curated, candidates);
  console.log(
    `  → hero ${draft.hero ? 1 : 0} + sides ${draft.sides.length}` +
    ` + next ${draft.next.length} + dropped ${draft.dropped.length}`,
  );

  console.log("[5/5] Supabase 저장…");
  const { runId, draftId } = await saveDraft({
    items: candidates,
    curated,
    draft,
    meta: {
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      promptVersion: "v5.0",
      numFetched: raw.length,
      numPrefiltered: filtered.length,
    },
  });

  console.log("");
  console.log("완료!");
  console.log(`  run_id:   ${runId}`);
  console.log(`  draft_id: ${draftId}`);
  console.log("");
  console.log("Supabase Table Editor에서 runs / candidates / drafts / draft_items 테이블을 확인하세요.");
  console.log("테스트 데이터를 지우려면 해당 run_id 행을 삭제하면 됩니다.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
