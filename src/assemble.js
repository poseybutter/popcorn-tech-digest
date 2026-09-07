// src/assemble.js
// ─────────────────────────────────────────────────────────────
// curate 결과를 드래프트 구조로 배치한다.
// 점수 계산과 소스 중복 제한만 — 키워드 매칭·쿼터·카테고리 배정 없음.
// 순수 함수, 부수효과 없음.
// ─────────────────────────────────────────────────────────────

const INSIGHT_WEIGHT = 0.5;   // 점수 = applicability + insight * INSIGHT_WEIGHT
const MAX_SIDES = 3;          // hero 옆 곁들임 최대
const MAX_NEXT = 2;           // next 레인 최대
const MAX_PER_SOURCE = 2;     // hero + sides 내 같은 source 상한

function score(item) {
  return item.applicability + item.insight * INSIGHT_WEIGHT;
}

// 결정론적 정렬: 점수 → insight → applicability → id
function compareDesc(a, b) {
  return (b.score - a.score)
    || (b.insight - a.insight)
    || (b.applicability - a.applicability)
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/**
 * @param {Array<{id,applicability,insight,lane,title,hook,takeaway}>} curated
 * @param {Array<{id,url,source,source_tier,raw_title,summary,published_at}>} originals
 * @returns {{ hero: object|null, sides: object[], next: object[], dropped: object[] }}
 */
export function assemble(curated, originals = []) {
  const originMap = new Map(originals.map((o) => [o.id, o]));

  // curate 결과 + 원본 메타 병합, 점수 부여
  const merged = curated.map((c) => ({
    ...(originMap.get(c.id) ?? {}),
    ...c,
    score: score(c),
  }));

  // 레인별 분리
  const nowPool = [];
  const nextPool = [];
  const dropped = [];

  for (const item of merged) {
    if (item.lane === "now") nowPool.push(item);
    else if (item.lane === "next") nextPool.push(item);
    else dropped.push(item);
  }

  // ── now → hero + sides ──
  nowPool.sort(compareDesc);

  let hero = null;
  const sides = [];
  const sourceCount = {};

  for (const item of nowPool) {
    const src = item.source ?? "";

    if (!hero) {
      hero = item;
      sourceCount[src] = 1;
      continue;
    }

    if (sides.length >= MAX_SIDES) {
      dropped.push(item);
      continue;
    }

    if ((sourceCount[src] ?? 0) >= MAX_PER_SOURCE) {
      dropped.push(item);
      continue;
    }

    sides.push(item);
    sourceCount[src] = (sourceCount[src] ?? 0) + 1;
  }

  // ── next → applicability > 0만, 점수순 상위 MAX_NEXT ──
  nextPool.sort(compareDesc);

  const next = [];
  for (const item of nextPool) {
    if (item.applicability === 0) {
      dropped.push(item);
      continue;
    }
    if (next.length >= MAX_NEXT) {
      dropped.push(item);
      continue;
    }
    next.push(item);
  }

  return { hero, sides, next, dropped };
}
