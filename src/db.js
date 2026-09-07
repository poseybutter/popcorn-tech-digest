// src/db.js
// ─────────────────────────────────────────────────────────────
// Supabase 저장: 파이프라인 결과를 runs → candidates → drafts → draft_items에 기록.
// service_role 키 서버 전용 — 클라이언트 노출 절대 금지.
// ─────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Postgres timestamptz는 빈 문자열을 거부 — null로 변환
function tsOrNull(v) {
  return v ? v : null;
}

function throwIfError(result, context) {
  if (result.error) {
    throw new Error(`[db] ${context}: ${result.error.message}`);
  }
}

/**
 * 최근 sinceDays 이내에 발송(sent)된 draft에 실린 글의 url 집합.
 * 중복 발송 방지용 — curate 전에 이미 보낸 url을 제외한다.
 * @param {number} [sinceDays=60]
 * @returns {Promise<Set<string>>}
 */
export async function getSentUrls(sinceDays = 60) {
  const cutoff = new Date(Date.now() - sinceDays * 86_400_000).toISOString();

  // 1) 발송된 draft ID 목록
  const { data: drafts, error: dErr } = await supabase
    .from("drafts")
    .select("id")
    .eq("status", "sent")
    .gte("sent_at", cutoff);
  if (dErr) throw new Error(`[db] getSentUrls drafts: ${dErr.message}`);
  if (!drafts?.length) return new Set();

  const draftIds = drafts.map((d) => d.id);

  // 2) 해당 draft_items → candidates.url
  const { data: items, error: iErr } = await supabase
    .from("draft_items")
    .select("candidates(url)")
    .in("draft_id", draftIds);
  if (iErr) throw new Error(`[db] getSentUrls draft_items: ${iErr.message}`);

  return new Set(
    (items ?? []).map((i) => i.candidates?.url).filter(Boolean),
  );
}

/**
 * 파이프라인 결과를 Supabase에 저장한다.
 *
 * @param {object} params
 * @param {Array} params.items      원본 후보 (id, url, source, source_tier, raw_title, summary, published_at)
 * @param {Array} params.curated    curate() 결과 (id, applicability, insight, lane, title, hook, takeaway)
 * @param {object} params.draft     assemble() 결과 { hero, sides, next, dropped }
 * @param {object} params.meta      { model, promptVersion, numFetched, numPrefiltered }
 * @returns {Promise<{runId: string, draftId: string}>}
 */
export async function saveDraft({ items, curated, draft, meta }) {
  let runId = null;

  try {
    // ── 1. runs ──
    const runResult = await supabase
      .from("runs")
      .insert({
        status: "running",
        model: meta.model,
        prompt_version: meta.promptVersion,
        num_fetched: meta.numFetched,
        num_prefiltered: meta.numPrefiltered,
        num_candidates: curated.length,
      })
      .select("id")
      .single();
    throwIfError(runResult, "runs INSERT");
    runId = runResult.data.id;

    // ── 2. candidates ──
    const itemMap = new Map(items.map((it) => [it.id, it]));

    const candidateRows = curated.map((c) => {
      const orig = itemMap.get(c.id) ?? {};
      return {
        id: c.id,
        run_id: runId,
        url: orig.url ?? "",
        source: orig.source ?? "",
        source_tier: orig.source_tier ?? "",
        raw_title: orig.raw_title ?? "",
        summary: orig.summary ?? "",
        published_at: tsOrNull(orig.published_at),
        prefilter_pass: true,
        applicability: c.applicability,
        insight: c.insight,
        lane: c.lane,
        llm_title: c.title,
        llm_hook: c.hook,
        llm_takeaway: c.takeaway,
      };
    });

    const candResult = await supabase.from("candidates").insert(candidateRows);
    throwIfError(candResult, "candidates INSERT");

    // ── 3. drafts ──
    const today = new Date().toISOString().slice(0, 10);
    const draftResult = await supabase
      .from("drafts")
      .insert({
        run_id: runId,
        week_of: today,
        status: "draft",
      })
      .select("id")
      .single();
    throwIfError(draftResult, "drafts INSERT");
    const draftId = draftResult.data.id;

    // ── 4. draft_items ──
    const draftItemRows = [];

    if (draft.hero) {
      draftItemRows.push({
        draft_id: draftId,
        candidate_id: draft.hero.id,
        slot: "hero",
        position: 0,
        state: "pick",
      });
    }

    draft.sides.forEach((item, i) => {
      draftItemRows.push({
        draft_id: draftId,
        candidate_id: item.id,
        slot: "side",
        position: i + 1,
        state: "pick",
      });
    });

    draft.next.forEach((item, i) => {
      draftItemRows.push({
        draft_id: draftId,
        candidate_id: item.id,
        slot: "next",
        position: i + 1,
        state: "pick",
      });
    });

    if (draftItemRows.length) {
      const diResult = await supabase.from("draft_items").insert(draftItemRows);
      throwIfError(diResult, "draft_items INSERT");
    }

    // ── 5. runs.status → done ──
    const doneResult = await supabase
      .from("runs")
      .update({ status: "done" })
      .eq("id", runId);
    throwIfError(doneResult, "runs UPDATE done");

    return { runId, draftId };
  } catch (err) {
    // runs INSERT 자체가 실패했으면 run_id가 없으므로 update 시도 안 함
    if (runId) {
      try {
        await supabase
          .from("runs")
          .update({ status: "failed" })
          .eq("id", runId);
      } catch {
        // failed 업데이트 실패가 원인 에러를 덮지 않도록 무시
      }
    }
    throw err;
  }
}
