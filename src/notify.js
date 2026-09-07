// src/notify.js
// ─────────────────────────────────────────────────────────────
// 본인 전용 Chat space에 "검수 준비됨" 알림.
// NOTIFY_WEBHOOK_URL만 사용 — 팀 발송용 CHAT_WEBHOOK_URL과 혼동 금지.
// 내장 fetch 사용, 별도 HTTP 라이브러리 금지.
// ─────────────────────────────────────────────────────────────

/**
 * @param {object} params
 * @param {object} params.draft       assemble() 결과 { hero, sides, next, dropped }
 * @param {object} [params.meta]      { model, numFetched, numPrefiltered 등 }
 * @param {string} [params.consoleUrl] 검수 콘솔 URL (없으면 생략)
 */
export async function notify({ draft, meta, consoleUrl }) {
  const webhookUrl = process.env.NOTIFY_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("NOTIFY_WEBHOOK_URL 환경변수가 설정되지 않았습니다.");
  }

  const heroTitle = draft.hero?.title ?? "이번 주 없음";
  const nowCount = (draft.hero ? 1 : 0) + draft.sides.length;
  const nextCount = draft.next.length;

  const lines = [
    "🍿 이번 주 다이제스트 드래프트 준비됨",
    `히어로: ${heroTitle}`,
    `구성: now ${nowCount} · next ${nextCount}`,
  ];

  if (consoleUrl) {
    lines.push(`검수: ${consoleUrl}`);
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: lines.join("\n") }),
  });

  if (res.status >= 300) {
    const body = await res.text().catch(() => "");
    throw new Error(`[notify] 전송 실패: ${res.status} ${body.slice(0, 200)}`);
  }
}
