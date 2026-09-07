// index.js
// ─────────────────────────────────────────────────────────────
// 오케스트레이터: fetch → 중복제거 → prefilter → curate → assemble → db → notify.
// GitHub Actions cron 또는 로컬에서 직접 실행.
// ─────────────────────────────────────────────────────────────

import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { fetchAll } from "./src/fetch.js";
import { prefilter } from "./src/prefilter.js";
import { curate } from "./src/curate.js";
import { assemble } from "./src/assemble.js";
import { getSentUrls, saveDraft } from "./src/db.js";
import { notify } from "./src/notify.js";

export async function runPipeline() {
  // ── 1. 피드 수집 ──
  console.log("[1/7] 피드 수집 중…");
  const raw = await fetchAll();
  console.log(`  → ${raw.length}건 수집`);

  if (!raw.length) {
    throw new Error("수집된 글이 0건입니다. 네트워크 또는 소스를 확인하세요.");
  }

  // ── 2. 발송 이력 중복 제거 ──
  console.log("[2/7] 발송 이력 중복 제거…");
  const sentUrls = await getSentUrls();
  const fresh = raw.filter((item) => !sentUrls.has(item.url));
  const deduped = raw.length - fresh.length;
  console.log(`  → ${deduped}건 이미 발송, ${fresh.length}건 신규`);

  if (!fresh.length) {
    throw new Error("신규 글이 0건입니다. 모든 수집 글이 이미 발송된 상태입니다.");
  }

  // ── 3. 프리필터 ──
  console.log("[3/7] 프리필터…");
  const filtered = prefilter(fresh);
  console.log(`  → ${filtered.length}건 통과 (${fresh.length - filtered.length}건 컷)`);

  // ── 4. LLM 큐레이션 ──
  const candidates = filtered.map((item) => ({
    id: crypto.randomUUID(),
    ...item,
  }));

  console.log(`[4/7] Gemini 큐레이션 중… (${candidates.length}건)`);
  const curated = await curate(candidates);
  console.log(`  → ${curated.length}건 반환`);

  // ── 5. 드래프트 배치 ──
  console.log("[5/7] 드래프트 배치…");
  const draft = assemble(curated, candidates);
  const nowCount = (draft.hero ? 1 : 0) + draft.sides.length;
  console.log(
    `  → hero ${draft.hero ? 1 : 0} + sides ${draft.sides.length}` +
    ` + next ${draft.next.length} + dropped ${draft.dropped.length}`,
  );

  // ── 6. Supabase 저장 ──
  console.log("[6/7] Supabase 저장…");
  const meta = {
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    promptVersion: "v5.0",
    numFetched: raw.length,
    numPrefiltered: filtered.length,
  };
  const { runId, draftId } = await saveDraft({
    items: candidates,
    curated,
    draft,
    meta,
  });
  console.log(`  → run_id: ${runId}, draft_id: ${draftId}`);

  // ── 7. 알림 발송 ──
  console.log("[7/7] 알림 발송…");
  await notify({
    draft,
    meta,
    consoleUrl: process.env.CONSOLE_URL || undefined,
  });

  console.log(`\n완료! now ${nowCount} · next ${draft.next.length}`);
  return { runId, draftId };
}

// 파일 직접 실행 시
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runPipeline().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
