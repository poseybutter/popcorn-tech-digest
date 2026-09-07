// src/sources.js
// ─────────────────────────────────────────────────────────────
// RSS·changelog 소스 목록 (데이터).
// v4(GAS) RSS_SOURCES에서 이관. gate 필드는 v4 키워드 점수 체계와
// 함께 폐기 — 판단은 LLM(curate.js)이 한다.
// ─────────────────────────────────────────────────────────────

/** @type {Array<{url:string, name:string, tier:string, defaultCategory:string}>} */
export const sources = [
  // ── 국내 통합 피드 ──
  {
    url: "https://www.techblogposts.com/rss.xml",
    name: "TechBlogPosts",
    tier: "aggregator",
    defaultCategory: "workCase",
  },

  // ── 브라우저·플랫폼 공식 ──
  {
    url: "https://developer.mozilla.org/en-US/blog/rss.xml",
    name: "MDN",
    tier: "official",
    defaultCategory: "opsRisk",
  },
  {
    url: "https://web.dev/static/blog/feed.xml",
    name: "web.dev",
    tier: "official",
    defaultCategory: "opsRisk",
  },
  {
    url: "https://developer.chrome.com/static/blog/feed.xml",
    name: "Chrome Developers",
    tier: "official",
    defaultCategory: "opsRisk",
  },
  {
    url: "https://webkit.org/feed/",
    name: "WebKit",
    tier: "official",
    defaultCategory: "opsRisk",
  },

  // ── 접근성 전문 ──
  {
    url: "https://webaim.org/blog/feed/",
    name: "WebAIM",
    tier: "expert",
    defaultCategory: "opsRisk",
  },
  {
    url: "https://www.deque.com/blog/feed/",
    name: "Deque",
    tier: "expert",
    defaultCategory: "opsRisk",
  },

  // ── 프론트엔드·퍼블 실무 ──
  {
    url: "https://css-tricks.com/feed/",
    name: "CSS-Tricks",
    tier: "expert",
    defaultCategory: "workCase",
  },
  {
    url: "https://www.smashingmagazine.com/feed/",
    name: "Smashing Magazine",
    tier: "expert",
    defaultCategory: "workCase",
  },
  {
    url: "https://piccalil.li/feed.xml",
    name: "Piccalilli",
    tier: "expert",
    defaultCategory: "workCase",
  },

  // ── 라이브러리 공식 ──
  {
    url: "https://blog.jquery.com/feed/",
    name: "jQuery Blog",
    tier: "official",
    defaultCategory: "libraryWatch",
  },

  // ── AI 도구 ──
  {
    url: "https://developers.openai.com/codex/changelog/rss.xml",
    name: "Codex Changelog",
    tier: "official",
    defaultCategory: "aiTool",
  },
];

// ── 페이지 감시 대상 (v1에서는 미사용, 향후 스크래퍼 연동 시 활성화) ──
// export const pageWatchSources = [
//   { name: "OpenAI Release Notes",  url: "https://openai.com/products/release-notes/",                            tier: "official", defaultCategory: "aiTool" },
//   { name: "Cursor Changelog",      url: "https://cursor.com/changelog",                                          tier: "official", defaultCategory: "aiTool" },
//   { name: "Claude Release Notes",  url: "https://support.claude.com/en/articles/9263161-claude-release-notes",   tier: "official", defaultCategory: "aiTool" },
//   { name: "Gemini Updates",        url: "https://gemini.google.com/updates",                                     tier: "official", defaultCategory: "aiTool" },
//   { name: "Figma Release Notes",   url: "https://www.figma.com/release-notes/",                                  tier: "official", defaultCategory: "aiTool" },
//   { name: "Figma Blog",            url: "https://www.figma.com/blog/",                                           tier: "practice", defaultCategory: "workCase" },
//   { name: "GSAP Blog",             url: "https://gsap.com/blog/",                                                tier: "official", defaultCategory: "libraryWatch" },
//   { name: "Swiper Changelog",      url: "https://swiperjs.com/changelog",                                       tier: "official", defaultCategory: "libraryWatch" },
//   { name: "Sass Blog",             url: "https://sass-lang.com/blog/",                                           tier: "official", defaultCategory: "opsRisk" },
//   { name: "Masonry Docs",          url: "https://masonry.desandro.com/",                                         tier: "official", defaultCategory: "libraryWatch" },
// ];
