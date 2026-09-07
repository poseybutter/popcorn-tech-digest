// src/prefilter.js
// ─────────────────────────────────────────────────────────────
// curate(LLM) 호출 전 싼 비용으로 노이즈를 걸러내는 사전 필터.
// 점수를 매기거나 순위를 정하지 않는다 — 판단은 LLM 역할.
// 규칙 두 가지만:
//   1) aggregator/firehose 소스에서 퍼블 신호가 없는 글 컷
//   2) 한 소스가 과도하게 많은 글을 물어오는 것 방지 (소스별 상한)
// ─────────────────────────────────────────────────────────────

// 퍼블팀 실무 관련 최소 신호. 이 목록에 매치가 하나도 없는
// aggregator/firehose 글은 LLM에 보내지 않는다.
const PUBLISHING_SIGNALS = [
  // 마크업·스타일·언어
  "html", "css", "scss", "sass", "javascript", "js", "jquery",
  // 인터랙션·애니메이션 라이브러리
  "gsap", "scrolltrigger", "swiper", "lottie",
  // 접근성
  "접근성", "웹접근성", "a11y", "wcag", "aria", "screen reader",
  // 레이아웃·반응형
  "layout", "레이아웃", "grid", "flex", "반응형", "responsive", "container query",
  // 브라우저·성능
  "브라우저", "browser", "safari", "chrome", "webkit",
  "성능", "performance", "lighthouse", "core web vitals",
  // 인터랙션·모션
  "애니메이션", "animation", "인터랙션", "interaction", "scroll", "transition",
  // 시각·타이포
  "svg", "font", "웹폰트", "typography",
  // 디자인 시스템
  "design system", "디자인 시스템", "컴포넌트", "component",
  // 퍼블 도구
  "figma", "피그마",
];

// 소스 하나가 통과시킬 수 있는 최대 건수
const MAX_PER_SOURCE = 2;

/**
 * fetch 결과를 받아 노이즈를 걸러낸 배열을 반환한다.
 * 입출력 형태 동일: { url, source, source_tier, raw_title, summary, published_at }
 * @param {Array} items
 * @param {{ maxPerSource?: number }} [opts]
 * @returns {Array}
 */
export function prefilter(items, opts = {}) {
  const cap = opts.maxPerSource ?? MAX_PER_SOURCE;

  // ── 규칙 1: aggregator/firehose 노이즈 컷 ──
  const afterNoiseCut = items.filter((item) => {
    if (item.source_tier !== "aggregator" && item.source_tier !== "firehose") {
      return true; // official/expert는 관대하게 통과
    }
    const text = `${item.raw_title} ${item.summary}`.toLowerCase();
    return PUBLISHING_SIGNALS.some((kw) => text.includes(kw));
  });

  // ── 규칙 2: 소스별 상한 (최신순 N건만) ──
  const grouped = new Map();
  for (const item of afterNoiseCut) {
    const list = grouped.get(item.source) ?? [];
    list.push(item);
    grouped.set(item.source, list);
  }

  const result = [];
  for (const [, list] of grouped) {
    if (list.length <= cap) {
      result.push(...list);
      continue;
    }
    // published_at 최신순 정렬 → 상위 cap건
    list.sort((a, b) => {
      const ta = new Date(a.published_at || 0).getTime();
      const tb = new Date(b.published_at || 0).getTime();
      return tb - ta;
    });
    result.push(...list.slice(0, cap));
  }

  return result;
}
