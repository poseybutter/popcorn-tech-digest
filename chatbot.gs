/**
 * 🍿 위클리 테크레터 (퍼블팀 주간 큐레이션 봇) — v3.0
 *
 * 메인 소스: TechBlogPosts 통합 피드(국내 139개 기술블로그 집계, 한국어).
 *   - 피드가 "최신 10건"만 주므로 6시간마다 누적 수집(dailyCollect)
 *   - 매주 월요일 누적 풀에서 관련성 점수로 엄선 5건 발송(mainDigest)
 *
 * 소스 타입: main(techblogposts) / trusted(해외 퍼블 블로그, 내장) /
 *   curated(인스타·Threads 브릿지) / firehose(GeekNews 등, 관련성 필터).
 *
 * 점수: 신선도 + CORE(팀 핵심: 퍼블·인터랙션·접근성·KRDS)×coreWeight
 *       + AUX(AI툴·백엔드 인지·형상관리)×auxWeight − NEG(React/Vue 등)×negWeight
 *       + 큐레이션/신뢰 소스 가점.
 *
 * 최초 1회: setupTriggers() 실행 → 6시간 수집 + 월요일 발송 트리거 자동 생성.
 * Script Properties: WEBHOOK_URL(필수), TRACKER_BASE_URL·EXTRA_FEEDS·FIREHOSE_FEEDS(선택).
 * 자세한 이력은 README.md / CHANGELOG.md 참고.
 *
 * 참고: GAS 트리거·에디터 Run이 인식하도록 진입점은 function 선언, 내부 헬퍼는 화살표 함수.
 */

const SETTINGS = {
  feedUrl: "https://www.techblogposts.com/rss.xml",

  maxSend: 5,            // 주간 발송 건수
  poolDays: 7,           // 누적 풀 보존/선별 기간
  maxPerSource: 2,       // 한 출처 최대 노출 건수 (다양성)
  maxStorePerDay: 35,    // 하루치 저장 상한(건수) — 바이트 상한과 함께 적용
  maxStoreBytes: 8500,   // 하루치 저장 상한(바이트) — Properties 9KB/값 보호(한글 UTF-8 대비)
  titleMaxLen: 90,
  summaryMaxLen: 150,

  coreWeight: 25,        // CORE 매치당 가점 (팀 핵심)
  auxWeight: 10,         // AUX 매치당 가점 (보조)
  negWeight: 15,         // NEG 매치당 감점 (현재 불필요 주제)
  extraFeedBonus: 20,    // 신뢰/큐레이션 소스 가점

  perFeedLimit: 12,      // 피드당 1회 수집 상한 (콜드스타트 백로그 방지)

  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
};

// CORE = 팀이 실제로 쓰고 공부하는 주제 (퍼블/인터랙션/접근성/표준/KRDS) — 큰 가점
const CORE_KEYWORDS = [
  // 마크업/스타일 (실제 스택: HTML·CSS·SCSS·JS·jQuery)
  "html", "css", "scss", "sass", "less", "마크업", "퍼블", "퍼블리싱", "스타일",
  "javascript", "js", "자바스크립트", "jquery", "제이쿼리", "바닐라", "vanilla",
  // 인터랙션/애니메이션 (지속 학습: GSAP·Swiper)
  "gsap", "scrolltrigger", "swiper", "슬라이더", "slider", "캐러셀", "carousel",
  "애니메이션", "animation", "transition", "트랜지션", "transform", "keyframe",
  "인터랙션", "interaction", "interactive", "인터랙티브", "모션", "motion", "lottie",
  "scroll", "스크롤", "scroll-driven", "패럴랙스", "parallax", "gesture",
  "마이크로 인터랙션", "micro-interaction", "hover", "호버",
  // 레이아웃/시각
  "layout", "레이아웃", "grid", "subgrid", "flex", "flexbox", "반응형", "responsive",
  "container query", "has()", "clamp", "z-index", "clip-path", "mask",
  "타이포", "typography", "폰트", "font", "웹폰트", "svg", "canvas", "webgl",
  // 접근성/웹표준 (공공기관 필수)
  "접근성", "웹접근성", "a11y", "wcag", "스크린리더", "screen reader", "aria",
  "시맨틱", "semantic", "웹표준", "웹 표준", "web standard", "크로스브라우징",
  // KRDS / 디자인시스템
  "krds", "디자인시스템", "디자인 시스템", "design system", "디자인 토큰", "design token",
  "컴포넌트", "component", "전자정부", "정부 웹", "공공",
  // 성능/품질
  "성능", "최적화", "performance", "lighthouse", "core web vitals", "web vitals",
  "렌더링", "render", "reflow", "repaint", "fps", "dom", "브라우저", "browser", "devtools"
];

// AUX = 보조 관심사 (AI 활용·생산성·백엔드 소통·형상관리) — 작은 가점
const AUX_KEYWORDS = [
  // AI 활용/트렌드/생산성
  "ai", "에이아이", "llm", "gpt", "claude", "클로드", "gemini", "제미나이", "chatgpt",
  "copilot", "cursor", "커서", "mcp", "codex", "코덱스", "obsidian", "옵시디언", "notion", "노션",
  "에이전트", "agent", "프롬프트", "prompt", "vibe", "바이브", "생산성", "자동화", "n8n",
  // AI 보안 취약점
  "ai 보안", "프롬프트 인젝션", "prompt injection", "jailbreak", "탈옥", "보안 취약", "취약점",
  // 백엔드 소통 비용 절감용 인지 (공공기관 스택)
  "java", "자바", "spring", "스프링", "php", "백엔드", "backend", "api", "sql", "데이터베이스", "database",
  // 형상관리/개발 일반
  "git", "깃", "svn", "형상관리", "버전 관리", "오픈소스", "open source", "라이브러리", "library",
  "코드", "코딩", "개발자", "리팩토링", "cli", "sdk"
];

// NEG = 현재 팀에 불필요한 주제 (모던 SPA 프레임워크) — 감점해서 가라앉힘
const NEG_KEYWORDS = [
  "react", "리액트", "vue", "vue.js", "svelte", "스벨트", "angular", "앵귤러",
  "next.js", "nextjs", "nuxt", "solidjs", "remix"
];

// 코드 내장 "신뢰 소스" — 퍼블/프론트 전문 블로그. 관련성 게이트 면제 + 가점.
// name으로 출처 라벨 고정(Smashing은 RSS author가 이메일이라 그대로 쓰면 지저분함).
const FRONTEND_FEEDS = [
  { url: "https://css-tricks.com/feed/",                     name: "CSS-Tricks" },
  { url: "https://web.dev/static/blog/feed.xml",             name: "web.dev" },
  { url: "https://www.smashingmagazine.com/feed/",           name: "Smashing Magazine" },
  { url: "https://developer.mozilla.org/en-US/blog/rss.xml", name: "MDN" }
];

// 코드 내장 큐레이션 피드 — 인스타/Threads를 RSS.app 브릿지로 변환. 게이트 면제 + 가점 + 썸네일/캡션.
const CURATED_FEEDS = [
  { url: "https://rss.app/feeds/UiIcuXQVpXhNex46.xml", name: "ai.trend.kr" },
  { url: "https://rss.app/feeds/s01IMm52zjqPpptl.xml", name: "ai.brief.kr" },
  { url: "https://rss.app/feeds/4qdXYyjPMGidr6kd.xml", name: "바이브마피아" },
  { url: "https://rss.app/feeds/0eVoqXItYWphq8Zp.xml", name: "AI Coffee Chat" }
];

// 매주 카드 하단에 고정 노출하는 링크 (전사 AI 툴 체인지로그 — 늘 챙겨봐야 하는 것)
const PINNED_LINKS = [
  { name: "Cursor 체인지로그", url: "https://cursor.com/ko/changelog" },
  { name: "Claude 릴리스 노트", url: "https://support.claude.com/en/articles/12138966-release-notes" }
];

// 공통 제외 — 월페이퍼/만우절/컨퍼런스 홍보 등 명백한 비기술 잡글
const EXCLUDE_TITLE_RE = /(wallpaper|월페이퍼|바탕화면|save the date|april.?fool|\bfools?\b|smashingconf|meet smashing|conference)/i;
// rss.app이 끼워넣는 프로필 헤더 항목
const PROFILE_NOISE_RE = /(•\s*Threads,?\s*Say more|^@[\w.]+\s*•)/i;

// ==================== 트리거 셋업 (진입점) ====================

/** 최초 1회 실행: 6시간 수집 + 월요일 13시 발송 트리거 생성 (기존 동일 트리거 제거 후 재생성) */
function setupTriggers() {
  clearTriggers();
  ScriptApp.newTrigger("dailyCollect").timeBased().everyHours(6).create();
  ScriptApp.newTrigger("mainDigest").timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(13).create();
  console.log("✅ 트리거 생성 완료 — dailyCollect(6시간마다), mainDigest(월 13시)");
}

function clearTriggers() {
  ScriptApp.getProjectTriggers()
    .filter((t) => ["dailyCollect", "mainDigest"].includes(t.getHandlerFunction()))
    .forEach((t) => ScriptApp.deleteTrigger(t));
}

// ==================== 수집 대상 피드 ====================

// main: techblogposts / trusted: 해외 퍼블 블로그(내장) /
// curated: CURATED_FEEDS + EXTRA_FEEDS / firehose: FIREHOSE_FEEDS
const getFeedList_ = (props) => {
  const feeds = [{ url: SETTINGS.feedUrl, type: "main" }];
  FRONTEND_FEEDS.forEach((f) => feeds.push({ url: f.url, type: "trusted", name: f.name }));
  CURATED_FEEDS.forEach((f) => feeds.push({ url: f.url, type: "curated", name: f.name }));
  parseExtraFeeds_(props.getProperty("EXTRA_FEEDS")).forEach((url) => feeds.push({ url, type: "curated" }));
  parseExtraFeeds_(props.getProperty("FIREHOSE_FEEDS")).forEach((url) => feeds.push({ url, type: "firehose" }));
  return feeds;
};

// ==================== 매일(6시간) 누적 수집 (진입점) ====================

function dailyCollect() {
  const props = PropertiesService.getScriptProperties();
  const feeds = getFeedList_(props);

  // 최근 풀 전체 링크로 중복 판정 (피드가 같은 글을 며칠간 반복 노출)
  const seen = {};
  recentPoolKeys_(props, SETTINGS.poolDays + 2)
    .forEach((k) => safeParseArray_(props.getProperty(k)).forEach((e) => { seen[e.l] = true; }));

  const todayKey = poolKeyFor_(new Date());
  let today = safeParseArray_(props.getProperty(todayKey));
  today.forEach((e) => { seen[e.l] = true; });

  let added = 0;
  feeds.forEach((feed) => {
    try {
      const xml = fetchFeedXml_(feed.url);
      if (!xml) { console.log(`⚠️ 피드 로드 실패: ${feed.url}`); return; }
      const parsed = parseFeed_(xml);

      parsed.entries.slice(0, SETTINGS.perFeedLimit).forEach((e) => {
        const link = normalizeLink_(e.link);
        if (!link || !link.startsWith("http") || !e.title) return;
        if (seen[link]) return;

        const title = normalizeSpaces_(stripHtml_(e.title));
        if (PROFILE_NOISE_RE.test(title)) return;             // rss.app 프로필 헤더
        if (EXCLUDE_TITLE_RE.test(title)) return;             // 공통 잡글
        if (feed.type === "firehose" && relevanceHits_(title) === 0) return; // firehose는 관련성 필수

        seen[link] = true;
        const item = {
          t: trimTo_(title, SETTINGS.titleMaxLen),
          l: link,
          s: feed.name || e.source || cleanSource_(parsed.feedTitle) || (feed.type === "curated" ? "큐레이션" : "기술블로그"),
          p: e.publishedAt ? e.publishedAt.toISOString() : ""
        };
        if (feed.type === "curated" || feed.type === "trusted") item.x = 1;       // 가점 대상
        if (feed.type === "curated") {                                            // 카드뉴스: 썸네일
          item.cu = 1;
          if (e.image) item.img = e.image;
        }
        if (e.summary) item.sm = trimTo_(normalizeSpaces_(stripHtml_(e.summary)), 160); // 피드 요약(메인은 없음)
        today.push(item);
        added += 1;
      });
    } catch (err) {
      console.log(`⚠️ 수집 오류(${feed.url}): ${err}`);
    }
  });

  today = capStore_(today);                          // 발행일 최신순 정렬 + 건수·바이트 상한
  props.setProperty(todayKey, JSON.stringify(today));
  prunePool_(props, SETTINGS.poolDays + 2);
  console.log(`✅ 수집 완료 — 신규 ${added}건, ${todayKey} 누적 ${today.length}건 (피드 ${feeds.length}개)`);
}

/** 발행일 최신순 정렬 후 건수·바이트 상한 적용 (한글 UTF-8 대비 Properties 9KB/값 보호) */
const capStore_ = (items) => {
  items.sort((a, b) => (b.p || "").localeCompare(a.p || ""));
  let capped = items.slice(0, SETTINGS.maxStorePerDay);
  while (capped.length > 1 && byteLen_(JSON.stringify(capped)) > SETTINGS.maxStoreBytes) {
    capped = capped.slice(0, -1);
  }
  return capped;
};

// ==================== 메인 발송 (진입점) ====================

function mainDigest() {
  const webhookUrl = getWebhookUrl_();
  if (!webhookUrl) throw new Error("WEBHOOK_URL이 설정되지 않았습니다.");

  const picks = selectPicks_();
  if (!picks.length) {
    sendSimpleText_(webhookUrl, "📬 이번 주는 모인 글이 없습니다. 다음 주에 다시 찾아뵙겠습니다.");
    return;
  }
  enrichPicks_(picks);                  // 발송 5건만: 한글 번역 + 미리보기 정리
  sendDigestCard_(webhookUrl, picks);
}

/** 누적 풀에서 점수순 → 출처 다양성 적용 → 상위 N건 */
const selectPicks_ = () => {
  const props = PropertiesService.getScriptProperties();
  const now = new Date();
  const cutoff = now.getTime() - SETTINGS.poolDays * 24 * 60 * 60 * 1000;

  const merged = {};
  recentPoolKeys_(props, SETTINGS.poolDays)
    .forEach((k) => safeParseArray_(props.getProperty(k)).forEach((e) => {
      if (!merged[e.l]) merged[e.l] = e;            // 링크 기준 중복 제거
    }));

  const items = Object.values(merged)
    .map((e) => {
      const publishedAt = parseDateSafe_(e.p);
      return {
        title: trimTo_(e.t, SETTINGS.titleMaxLen),
        link: e.l,
        sourceName: e.s,
        image: e.img || "",
        isCurated: !!e.cu,
        storedSummary: e.sm || "",
        publishedAt,
        score: scoreItem_(e.t, publishedAt, now, !!e.x)
      };
    })
    .filter((it) => !it.publishedAt || it.publishedAt.getTime() >= cutoff)
    .sort((a, b) => (b.score - a.score) || (timeOf_(b.publishedAt) - timeOf_(a.publishedAt)));

  const picks = [];
  const perSource = {};
  for (const it of items) {
    if (picks.length >= SETTINGS.maxSend) break;
    const cnt = perSource[it.sourceName] || 0;
    if (cnt >= SETTINGS.maxPerSource) continue;
    perSource[it.sourceName] = cnt + 1;
    picks.push(it);
  }
  return picks;
};

/** 신선도(≤30) + CORE×coreWeight + AUX×auxWeight − NEG×negWeight + 큐레이션/신뢰 가점 */
const scoreItem_ = (title, publishedAt, now, isExtra) => {
  const lower = String(title || "").toLowerCase();
  let score = freshnessScore_(publishedAt, now);
  score += countHits_(CORE_KEYWORDS, lower) * SETTINGS.coreWeight;
  score += countHits_(AUX_KEYWORDS, lower) * SETTINGS.auxWeight;
  score -= countHits_(NEG_KEYWORDS, lower) * SETTINGS.negWeight;
  if (isExtra) score += SETTINGS.extraFeedBonus;
  return score;
};

const freshnessScore_ = (publishedAt, now) =>
  publishedAt ? Math.max(0, 30 - (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;

/** firehose 통과 판정 — CORE/AUX 통틀어 키워드가 하나라도 있으면 통과 */
const relevanceHits_ = (title) => {
  const lower = String(title || "").toLowerCase();
  return countHits_(CORE_KEYWORDS, lower) + countHits_(AUX_KEYWORDS, lower);
};

const countHits_ = (keywords, lower) => keywords.filter((k) => lower.includes(k)).length;

/**
 * 발송 직전 5건에만 적용: 한글 번역 + 미리보기 정리.
 *   - 미리보기는 수집 때 피드에서 저장한 요약(sm). 해외 블로그·Threads는 있고,
 *     techblogposts 메인(미리디 등 Medium 글)은 피드가 요약을 주지 않아 제목만 표시됨.
 *   - 영문 제목·미리보기는 한국어로 번역(이미 한국어면 그대로).
 */
const enrichPicks_ = (picks) => {
  picks.forEach((it) => {
    it.title = maybeTranslate_(it.title);
    it.summary = maybeTranslate_(trimTo_(normalizeSpaces_(stripHtml_(it.storedSummary)), SETTINGS.summaryMaxLen));
  });
};

// ==================== 카드 렌더링 ====================

const sendDigestCard_ = (webhookUrl, picks) => {
  const dateStr = Utilities.formatDate(new Date(), "Asia/Seoul", "MM/dd");
  const trackerBase = getTrackerBaseUrl_();

  const widgets = [{
    decoratedText: {
      text: `<font color="#5f6368">이번 주 읽어볼 만한 글 ${picks.length}편을 정리했습니다.</font>`,
      wrapText: true
    }
  }];
  picks.forEach((it) => makeItemWidgets_(it, dateStr, trackerBase).forEach((w) => widgets.push(w)));

  // 하단 고정 링크 (전사 AI 툴 체인지로그)
  widgets.push({ divider: {} });
  widgets.push({ decoratedText: { text: "<b>🔧 전사 AI 툴 업데이트 (매주 고정)</b>", wrapText: true } });
  widgets.push({
    buttonList: {
      buttons: PINNED_LINKS.map((p) => ({ text: p.name, onClick: { openLink: { url: p.url } } }))
    }
  });

  const payload = {
    cardsV2: [{
      cardId: "weeklyTechLetter",
      card: {
        header: {
          title: "🍿 위클리 테크레터",
          subtitle: `${dateStr} · 퍼블팀`,
          imageType: "CIRCLE",
          imageUrl: "https://fonts.gstatic.com/s/i/googlematerialicons/movie_filter/v15/24px.svg"
        },
        sections: [{ widgets }]
      }
    }]
  };
  UrlFetchApp.fetch(webhookUrl, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  });
};

/** 한 아이템 → 카드 위젯 배열 (구분선 + 제목/미리보기 + 썸네일 + 버튼) */
const makeItemWidgets_ = (it, dateStr, trackerBase) => {
  const pubStr = it.publishedAt ? Utilities.formatDate(it.publishedAt, "Asia/Seoul", "MM/dd") : "";
  const topLabel = it.sourceName + (pubStr ? ` · ${pubStr}` : "");
  const linkUrl = buildTrackerUrl_(it, dateStr, trackerBase);

  let body = `<b>${escapeHtml_(it.title)}</b>`;
  if (it.summary) body += `<br/><font color="#5f6368">${escapeHtml_(it.summary)}</font>`;

  const widgets = [
    { divider: {} },
    { decoratedText: { topLabel, text: body, wrapText: true } }
  ];
  if (it.image) {
    widgets.push({ image: { imageUrl: it.image, altText: it.title, onClick: { openLink: { url: linkUrl } } } });
  }
  widgets.push({ buttonList: { buttons: [{ text: "보러가기", onClick: { openLink: { url: linkUrl } } }] } });
  return widgets;
};

/** 트래커 설정 시 클릭 추적 URL, 아니면 원본 링크 */
const buildTrackerUrl_ = (it, dateStr, trackerBase) => {
  if (!trackerBase) return it.link;
  const q = [
    ["url", it.link], ["source", it.sourceName], ["title", it.title], ["sent", dateStr]
  ].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  return `${trackerBase}?${q}`;
};

// ==================== 디버그 / 유지보수 (진입점) ====================

/** 현재 누적 풀과 이번 주 선별 결과를 콘솔에 출력 (발송·번역 없음) */
function debugDigest() {
  const props = PropertiesService.getScriptProperties();
  const keys = recentPoolKeys_(props, SETTINGS.poolDays + 2).sort();

  console.log("=== 📦 누적 풀 현황 ===");
  let total = 0;
  keys.forEach((k) => {
    const n = safeParseArray_(props.getProperty(k)).length;
    total += n;
    console.log(`  ${k}: ${n}건`);
  });
  console.log(`  (합계 ${total}건)\n`);

  const picks = selectPicks_();
  console.log(`=== 🌟 이번 주 선별 ${picks.length}건 ===`);
  picks.forEach((it, i) => {
    const d = it.publishedAt ? Utilities.formatDate(it.publishedAt, "Asia/Seoul", "MM/dd") : "-";
    console.log(`  ${i + 1}. [${it.sourceName} · ${d}] ${it.title} (score ${Math.round(it.score)})`);
  });
}

/** 누적 풀 전체 초기화 (테스트용) */
function resetPool() {
  const props = PropertiesService.getScriptProperties();
  Object.keys(props.getProperties())
    .filter((k) => k.startsWith("POOL_"))
    .forEach((k) => props.deleteProperty(k));
  console.log("✅ 누적 풀 초기화 완료");
}

// ==================== 풀 저장 유틸 ====================

const poolKeyFor_ = (date) => `POOL_${Utilities.formatDate(date, "Asia/Seoul", "yyyy-MM-dd")}`;

const poolKeyDate_ = (key) => parseDateSafe_(`${key.slice(5)}T00:00:00+09:00`);

const recentPoolKeys_ = (props, withinDays) => {
  const cutoff = new Date().getTime() - withinDays * 24 * 60 * 60 * 1000;
  return Object.keys(props.getProperties()).filter((k) => {
    if (!k.startsWith("POOL_")) return false;
    const d = poolKeyDate_(k);
    return d && d.getTime() >= cutoff;
  });
};

const prunePool_ = (props, keepDays) => {
  const cutoff = new Date().getTime() - keepDays * 24 * 60 * 60 * 1000;
  Object.keys(props.getProperties()).forEach((k) => {
    if (!k.startsWith("POOL_")) return;
    const d = poolKeyDate_(k);
    if (d && d.getTime() < cutoff) props.deleteProperty(k);
  });
};

const safeParseArray_ = (s) => {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
};

/** Medium 등의 ?source= 추적 파라미터 제거 (가독성·중복판정 개선) */
const normalizeLink_ = (link) => {
  const l = String(link || "").trim();
  const idx = l.indexOf("?source=");
  return idx !== -1 ? l.slice(0, idx) : l;
};

/** rss.app Threads 피드 제목의 지저분한 꼬리표 정리 (`... • Threads, Say more` 등) */
const cleanSource_ = (s) =>
  normalizeSpaces_(String(s || "").replace(/•\s*Threads.*$/i, "").replace(/\(@[\w.]+\)/, ""));

/** EXTRA_FEEDS/FIREHOSE_FEEDS 문자열(줄바꿈/쉼표 구분)을 URL 배열로 파싱 */
const parseExtraFeeds_ = (raw) =>
  String(raw || "").split(/[\n,]+/).map((s) => s.trim()).filter((s) => s.startsWith("http"));

// ==================== 피드 파싱 ====================

const fetchFeedXml_ = (url) => {
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { "User-Agent": SETTINGS.userAgent } });
  if (res.getResponseCode() >= 400) return null;
  const xml = res.getContentText();
  const lower = xml.toLowerCase();
  if (lower.indexOf("<!doctype html>") !== -1 || lower.indexOf("<html") === 0) return null;
  return xml.replace(/&(?!(amp|apos|quot|lt|gt|#\d+|#x[0-9a-fA-F]+);)/g, "&amp;");
};

/** RSS/Atom 피드 파싱. { feedTitle, entries } 반환. */
const parseFeed_ = (xml) => {
  const root = XmlService.parse(xml).getRootElement();
  const ns = root.getNamespace();
  const mediaNs = XmlService.getNamespace("http://search.yahoo.com/mrss/");
  const contentNs = XmlService.getNamespace("http://purl.org/rss/1.0/modules/content/");

  // RSS (<channel><item>)
  const channel = root.getChild("channel");
  if (channel) {
    const entries = channel.getChildren("item").map((item) => ({
      title: item.getChildText("title") || "",
      link: (item.getChildText("link") || "").trim(),
      source: item.getChildText("author") || item.getChildText("creator") || "",
      summary: item.getChildText("description") || item.getChildText("encoded", contentNs) || "",
      image: extractImage_(item, null, mediaNs),
      publishedAt: parseDateSafe_(item.getChildText("pubDate") || item.getChildText("date"))
    }));
    return { feedTitle: normalizeSpaces_(stripHtml_(channel.getChildText("title") || "")), entries };
  }

  // Atom (<feed><entry>)
  const entries = (root.getChildren("entry", ns) || []).map((entry) => {
    const author = entry.getChild("author", ns);
    return {
      title: entry.getChildText("title", ns) || "",
      link: atomLink_(entry, ns),
      source: author ? (author.getChildText("name", ns) || "") : "",
      summary: entry.getChildText("summary", ns) || entry.getChildText("content", ns) || "",
      image: extractImage_(entry, ns, mediaNs),
      publishedAt: parseDateSafe_(entry.getChildText("published", ns) || entry.getChildText("updated", ns))
    };
  });
  return { feedTitle: normalizeSpaces_(stripHtml_(root.getChildText("title", ns) || "")), entries };
};

/** Atom <entry>에서 대표 링크(href) 추출 — rel=alternate 우선 */
const atomLink_ = (entry, ns) => {
  const links = entry.getChildren("link", ns) || [];
  for (const l of links) {
    const href = l.getAttribute("href");
    const rel = l.getAttribute("rel");
    if (href && (!rel || rel.getValue() === "alternate")) return href.getValue().trim();
  }
  const first = links[0] && links[0].getAttribute("href");
  return first ? first.getValue().trim() : "";
};

/** 항목에서 이미지 URL 추출 (media:content / media:thumbnail / enclosure). 없으면 "" */
const extractImage_ = (el, atomNs, mediaNs) => {
  try {
    for (const c of (el.getChildren("content", mediaNs) || [])) {
      const url = c.getAttribute("url");
      const medium = c.getAttribute("medium");
      const type = c.getAttribute("type");
      if (url && (!medium || medium.getValue() === "image") && (!type || type.getValue().startsWith("image"))) {
        return url.getValue();
      }
    }
    const thumb = el.getChild("thumbnail", mediaNs);
    if (thumb && thumb.getAttribute("url")) return thumb.getAttribute("url").getValue();

    if (atomNs) {
      for (const l of (el.getChildren("link", atomNs) || [])) {
        const rel = l.getAttribute("rel");
        const type = l.getAttribute("type");
        const href = l.getAttribute("href");
        if (href && rel && rel.getValue() === "enclosure" && (!type || type.getValue().startsWith("image"))) {
          return href.getValue();
        }
      }
    } else {
      const enc = el.getChild("enclosure");
      const type = enc && enc.getAttribute("type");
      if (enc && enc.getAttribute("url") && (!type || type.getValue().startsWith("image"))) {
        return enc.getAttribute("url").getValue();
      }
    }
  } catch (e) { /* 네임스페이스 없는 피드 등은 무시 */ }
  return "";
};

// ==================== 공통 유틸 ====================

const getWebhookUrl_ = () => PropertiesService.getScriptProperties().getProperty("WEBHOOK_URL") || "";
const getTrackerBaseUrl_ = () => PropertiesService.getScriptProperties().getProperty("TRACKER_BASE_URL") || "";

const sendSimpleText_ = (url, text) => {
  UrlFetchApp.fetch(url, { method: "post", contentType: "application/json", payload: JSON.stringify({ text }) });
};

/** 영문이면 한국어로 번역, 이미 한국어면 그대로 (실패 시 원문 유지) */
const maybeTranslate_ = (text) => {
  const t = String(text || "").trim();
  if (!t || /[가-힣]/.test(t)) return t;        // 비었거나 이미 한국어
  try {
    return LanguageApp.translate(t, "en", "ko");
  } catch (e) {
    return t;
  }
};

const byteLen_ = (s) => Utilities.newBlob(String(s || "")).getBytes().length;
const timeOf_ = (date) => (date ? date.getTime() : 0);

const parseDateSafe_ = (s) => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const stripHtml_ = (s) => String(s || "").replace(/<[^>]*>/g, " ");
const normalizeSpaces_ = (s) => String(s || "").replace(/\s+/g, " ").trim();
const trimTo_ = (s, maxLen) => {
  const str = String(s || "");
  return str.length <= maxLen ? str : `${str.slice(0, Math.max(0, maxLen - 1))}…`;
};
const escapeHtml_ = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
