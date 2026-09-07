// src/fetch.js
// ─────────────────────────────────────────────────────────────
// rss-parser로 소스 피드를 수집하고,
// 최근 7일 아이템만 정규화해서 배열로 반환한다.
// id는 여기서 만들지 않는다 — DB 저장 시점에 생성.
// ─────────────────────────────────────────────────────────────

import Parser from "rss-parser";
import { sources } from "./sources.js";

const parser = new Parser({ timeout: 15_000 });
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * 모든 소스 피드를 병렬 수집 → 정규화된 아이템 배열 반환.
 * @returns {Promise<Array<{url:string, source:string, source_tier:string,
 *           raw_title:string, summary:string, published_at:string}>>}
 */
export async function fetchAll() {
  const results = await Promise.allSettled(
    sources.map((src) => parser.parseURL(src.url).then((feed) => ({ feed, src }))),
  );

  const cutoff = Date.now() - MAX_AGE_MS;
  const items = [];

  for (const r of results) {
    if (r.status === "rejected") {
      const src = sources[results.indexOf(r)];
      console.warn(`[fetch] 피드 실패 — ${src?.name}: ${r.reason?.message ?? r.reason}`);
      continue;
    }

    const { feed, src } = r.value;

    for (const entry of feed.items) {
      const url = entry.link ?? "";
      const raw_title = entry.title ?? "";
      if (!url || !raw_title) continue;

      const published_at = entry.isoDate ?? entry.pubDate ?? "";
      const ts = new Date(published_at).getTime();
      if (ts && ts < cutoff) continue;

      items.push({
        url,
        source: src.name,
        source_tier: src.tier,
        raw_title,
        summary: entry.contentSnippet ?? "",
        published_at,
      });
    }
  }

  return items;
}
