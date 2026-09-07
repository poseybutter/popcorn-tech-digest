// scripts/try-notify.js
// ─────────────────────────────────────────────────────────────
// 가짜 draft로 notify()를 호출해 실제 Chat space 수신 확인.
// 실행: npm run try:notify
// ─────────────────────────────────────────────────────────────

import { notify } from "../src/notify.js";

const fakeDraft = {
  hero: {
    id: "test-hero",
    title: "Safari에서 CSS field-sizing 지원 시작",
    applicability: 7,
    insight: 6,
    lane: "now",
    source: "WebKit",
  },
  sides: [
    { id: "test-side-1", title: "접근성 자동 검사 도구 비교", lane: "now", source: "Deque" },
    { id: "test-side-2", title: "GSAP ScrollTrigger 실전 패턴", lane: "now", source: "CSS-Tricks" },
  ],
  next: [
    { id: "test-next-1", title: "CSS random() 함수 제안", lane: "next", source: "Chrome Developers" },
  ],
  dropped: [],
};

async function main() {
  console.log("notify() 호출 중…");

  await notify({
    draft: fakeDraft,
    meta: { model: "gemini-2.5-flash", numFetched: 24, numPrefiltered: 12 },
    consoleUrl: "https://console.example.com/draft/test",
  });

  console.log("전송 완료! Chat space에서 메시지를 확인하세요.");
}

main().catch((err) => {
  if (err.message.includes("NOTIFY_WEBHOOK_URL")) {
    console.error(`\n  ${err.message}\n  .env 파일에 NOTIFY_WEBHOOK_URL을 넣어주세요.\n`);
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});
