/**
 * 🍿 퍼블팀 주간 뉴스레터 봇
 * 최신 변경 이력은 README.md의 Changelog를 참고하세요.
 */

var YT_LOG = [];

var SETTINGS = {
  maxItemsPerSource: 12,
  maxSendPerCategory: 5,
  lookbackDays: 30,
  maxPerSourceInDigest: 2,
  youtubeLookbackDays: 14,

  summaryMaxLen: 120,
  titleMaxLen: 80,

  youtubeMustKeywords: [
    "css", "scss", "sass", "html", "a11y", "gsap", "swiper", "jquery",
    "javascript", "typescript", "tailwind", "next.js", "nextjs", "react",
    "figma", "cursor", "claude", "gemini", "devtools",
    "퍼블", "퍼블리싱", "마크업", "웹", "프론트", "프론트엔드",
    "반응형", "접근성", "인터랙션", "애니메이션", "클론코딩", "클론 코딩",
    "웹사이트 만들기", "웹개발", "웹 개발", "포트폴리오",
    "ui", "ux", "피그마", "성능", "최적화",
    "자동화", "노코드", "노 코드", "n8n", "make", "zapier",
    "ai", "llm", "에이전트", "agent", "생산성", "vibe coding", "vibe코딩", "바이브코딩",
    "클로드코드", "claude code", "replit",
    "실전", "튜토리얼", "강의", "업무",
    "만들기", "구현", "따라하기", "코딩", "개발", "빌드", "제작",
    "자동", "봇", "gpt", "챗봇", "노션", "obsidian", "슬랙", "slack"
  ],

  youtubeBlockKeywords: [
    "주식", "매매", "코인", "게임", "먹방", "asmr", "브이로그",
    "shorts", "일상", "여행", "개그", "예능", "스트리밍 중", "라이브",
    "솔라피", "광고", "협찬", "후원", "홍보", "이벤트", "무료특강",
    "지금 신청", "선착순", "할인", "프로모션", "공구", "체험단",
    "부트캠프", "사전설명회", "tmux"
  ],

  youtubeTrustedChannels: [
    "윤자동 (업무자동화)", "시민개발자 구씨", "노마드코더", "조코딩", "개발동생",
    "우아한테크", "토스", "당근테크"
  ],

  // ← 변경: Cursor Blog는 일반 번역, Cursor Changelog만 summarizeRelease_ 사용
  cursorChangelogSources: ["Cursor Changelog"],
  cursorBlogSources: ["Cursor Blog"],

  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0 Safari/537.36",

  coreAiSourceNames: [
    "OpenAI Blog", "Google DeepMind", "Google for Developers",
    "HuggingFace Blog", "Cursor Changelog", "Cursor Blog"
  ],
  coreAiSourceKinds: ["rss_ai"]
};

var CORE_AI_ALLOW_KEYWORDS = [
  "cursor", "composer",
  "gemini", "google ai studio", "notebooklm", "vertex ai",
  "chatgpt", "claude", "gpt-4", "gpt-5", "gpt-4o",
  "claude code", "vibe coding", "ai 코딩", "코딩 에이전트",
  "mcp", "copilot",
  "ai agent", "ai 에이전트", "llm api", "프롬프트 엔지니어링"
];

var EXCLUDE_KEYWORDS = [
  "국방부", "해커톤", "부스", "mwc", "ces", "채용", "주총", "사고", "사건",
  "정치", "선거", "대통령", "국회",
  "전쟁", "연료", "제조업", "창업", "투자", "ipo", "인수 완료", "채권", "환율",
  "wallpaper", "wallpapers", "conference", "conf ", "smashingconf", "meet smashing",
  "amsterdam", "월페이퍼", "바탕화면"
];

var CORE_AI_BLOCK_PATTERNS = [
  /\b(fixes|boosts|enables|built an|using openai|with openai|with chatgpt|case study)\b/i,
  /^[A-Z][a-zA-Z\s]+ (reshapes|transforms|reinvents|reimagines|revolutionizes|leverages|deploys|adopts|launches)/i,
  /\b(save the date|google i\/o|cloud next|build hour|conference|summit|event)\b/i,
  /\b(india|vegas|amsterdam|london|new york)\b/i,
  /\b(dataset|benchmark|leaderboard|paper|arxiv|fine.?tun|checkpoint|weights|inference|training|diffusion|llama|mistral|falcon|phi-|qwen|deepseek)\b/i,
  /^(liberate|unleash|introducing|announcing|welcoming)\b/i
];

var DOMESTIC_BLOG_BLOCK_PATTERNS = [
  /보안|취약점|해킹|침해|랜섬웨어|악성코드|보안 악몽|보안 위협|취약점 분석|보안 분석|침투 테스트|버그 바운티/,
  /\b(exploit|cve|zero.?day|ddos)\b/i,
  /블록체인|nft|web3|dao|defi|crypto|solidity/,
  /\b(postgres|mysql|redis|mongodb|elasticsearch|kafka|hadoop)\b/i,
  /쿠버네티스|kubernetes|helm|terraform/,
  /머신러닝|딥러닝|파인튜닝|모델 학습|데이터셋|레이블링/,
  /ios 앱|안드로이드 앱|flutter|앱스토어/i,
  /\bswift\b|\bkotlin\b/i,
  /ai를 쓰는 회사|ai를 만드는 회사|조직 문화|채용 전략|리더십/,
  /show gn.*?(서버|백엔드|cli 도구|api|sdk|라이브러리 만들|봇 만들)/i,
  /saas|과금 모델|구독 모델|비즈니스 모델|go.?to.?market/i,
  /암흑의 숲|인지적|철학적|사유|에세이/
];

var GENERAL_RELEVANCE_KEYWORDS = [
  "프론트엔드", "프론트", "퍼블", "마크업", "css", "html",
  "javascript", "js", "typescript", "최적화", "성능", "생산성",
  "협업", "자동화", "n8n", "make", "zapier", "figma", "피그마",
  "ux", "ui", "디자인", "웹", "claude code", "cursor", "노코드", "vibe"
];

var DOMESTIC_SOURCES = [
  "GeekNews", "무신사 기술블로그", "29CM 기술블로그", "토스 테크", "당근 테크"
];

var PUBLISHING_SOURCES = ["CSS-Tricks", "web.dev", "Smashing Magazine", "MDN Blog"];

var SOURCES = [
  { name: "OpenAI Blog",           url: "https://openai.com/news/rss.xml",                                           icon: "https://openai.com/favicon.ico",              kind: "rss_ai"  },
  { name: "Google DeepMind",       url: "https://deepmind.google/blog/rss.xml",                                      icon: "https://deepmind.google/favicon.ico",         kind: "rss_ai"  },
  { name: "Google for Developers", url: "https://developers.googleblog.com/feeds/posts/default",                     icon: "https://developers.google.com/favicon.ico",   kind: "rss_ai"  },
  { name: "HuggingFace Blog",      url: "https://huggingface.co/blog/feed.xml",                                      icon: "https://huggingface.co/favicon.ico",          kind: "rss_ai"  },
  { name: "Cursor Changelog",      url: "https://github.com/getcursor/cursor/releases.atom",                         icon: "https://cursor.sh/favicon.ico",               kind: "rss_ai"  },
  { name: "Cursor Blog",           url: "https://any-feeds.com/api/feeds/custom/cmkoaiogm0000lf04qmtirq2g/rss.xml", icon: "https://cursor.sh/favicon.ico",               kind: "rss_ai"  },
  { name: "Cursor Blog",           url: "https://cursor.com/rss.xml",                                                icon: "https://cursor.sh/favicon.ico",               kind: "rss_ai"  },

  { name: "윤자동 (업무자동화)", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCYg51KBo-UcA4QILcYl5LEw", icon: "https://www.youtube.com/favicon.ico", kind: "youtube" },
  { name: "시민개발자 구씨",     url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCDLlMjELbrJdETmSiAB68AA", icon: "https://www.youtube.com/favicon.ico", kind: "youtube" },
  { name: "노마드코더",          url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCUpJs89fSBXNolQGOYKn0YQ", icon: "https://www.youtube.com/favicon.ico", kind: "youtube" },
  { name: "조코딩",             url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCYaDkwVaOhuoe_LuFr3lWkA", icon: "https://www.youtube.com/favicon.ico", kind: "youtube" },
  { name: "개발동생",           url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC1_ZZYZsHh2_DzCXN4VGVcQ", icon: "https://www.youtube.com/favicon.ico", kind: "youtube" },
  { name: "우아한테크",          url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC-mOekGSesms0agFntnQang", icon: "https://woowahan.com/favicon.ico",   kind: "youtube" },
  { name: "토스",               url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCeg5g-vWgtgzQ0cYNV2Cyow", icon: "https://www.youtube.com/favicon.ico", kind: "youtube" },
  { name: "당근테크",            url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC8tsBsQBuF7QybxgLmStihA", icon: "https://www.youtube.com/favicon.ico", kind: "youtube" },

  { name: "무신사 기술블로그",   url: "https://techblog.musinsa.com/feed/",                icon: "https://techblog.musinsa.com/favicon.ico",     kind: "rss" },
  { name: "29CM 기술블로그",     url: "https://medium.com/feed/29cm",                     icon: "https://www.29cm.co.kr/favicon.ico",            kind: "rss" },
  { name: "토스 테크",           url: "https://toss.tech/rss.xml",                        icon: "https://toss.im/favicon.ico",                   kind: "rss" },
  { name: "당근 테크",           url: "https://medium.com/feed/daangn",                   icon: "https://www.daangn.com/favicon.ico",             kind: "rss" },
  { name: "GeekNews",            url: "https://news.hada.io/rss/news",                    icon: "https://news.hada.io/favicon.ico",               kind: "rss" },

  { name: "CSS-Tricks",          url: "https://css-tricks.com/feed/",                     icon: "https://css-tricks.com/favicon.ico",             kind: "rss" },
  { name: "web.dev",             url: "https://web.dev/feed.xml",                         icon: "https://web.dev/favicon.ico",                   kind: "rss" },
  { name: "Smashing Magazine",   url: "https://www.smashingmagazine.com/feed/",           icon: "https://www.smashingmagazine.com/favicon.ico",   kind: "rss" },
  { name: "MDN Blog",            url: "https://developer.mozilla.org/en-US/blog/rss.xml", icon: "https://developer.mozilla.org/favicon.ico",     kind: "rss" },

  { name: "Sass(SCSS) 공식",     url: "https://sass-lang.com/feed.xml",                   icon: "https://sass-lang.com/favicon.ico",              kind: "library", releasePageUrl: "https://github.com/sass/dart-sass/releases" },
  { name: "jQuery Releases",     url: "https://github.com/jquery/jquery/releases.atom",   icon: "https://jquery.com/favicon.ico",                 kind: "library", releasePageUrl: "https://github.com/jquery/jquery/releases" },
  { name: "GSAP Releases",       url: "https://github.com/greensock/GSAP/releases.atom",  icon: "https://gsap.com/favicon.ico",                   kind: "library", releasePageUrl: "https://gsap.com/blog/" },
  { name: "Swiper Releases",     url: "https://github.com/nolimits4web/swiper/releases.atom", icon: "https://swiperjs.com/favicon.ico",           kind: "library", releasePageUrl: "https://github.com/nolimits4web/swiper/releases" }
];

var CATEGORIES = [
  { key: "CORE_AI",     label: "🤖 전사 도입 AI 필수 업데이트 (Cursor/Gemini)", keywords: [] },
  { key: "LIB_UPDATES", label: "📦 필수 라이브러리 릴리즈",                      keywords: [] },
  { key: "TOP_PICKS",   label: "🌟 금주의 팝콘 픽 (기타 강추)",                   keywords: [] },
  {
    key: "PUBLISHING",
    label: "✨ UI/UX 퍼블리싱 & 인터랙션",
    keywords: [
      "scss", "sass", "css", "html", "인터랙션", "마크업", "figma", "피그마",
      "접근성", "a11y", "애니메이션", "반응형", "웹 표준",
      "selector", "selects", "popover", "dialog", "grid", "flexbox", "flex",
      "z-index", "animation", "transition", "scroll", "web standard",
      "border", "layout", "typography", "color", "variable", "custom property",
      "tailwind", "component", "design system", "ux", "ui pattern"
    ]
  },
  {
    key: "GENERAL",
    label: "🏢 IT 업계 실무 & 자동화 꿀팁",
    keywords: [
      "프론트엔드", "최적화", "javascript", "js", "생산성", "협업", "자동화", "n8n", "make", "typescript"
    ]
  },
  { key: "YOUTUBE", label: "📺 주말에 몰아보는 코딩 유튜브", keywords: [] }
];

// ==================== 메인 함수 ====================

function mainDigest() {
  var webhookUrl = getWebhookUrl_();
  if (!webhookUrl) throw new Error("WEBHOOK_URL이 설정되지 않았습니다.");

  var allItems = collectItems_();
  if (allItems.length === 0) {
    sendSimpleText_(webhookUrl, "🍿 최근 새로운 소식이 없네요. 푹 쉬세요!");
    return;
  }

  var sorted = allItems.sort(function(a, b) { return b.score - a.score; });
  var sourceCount = {};
  var topPicks = [];

  for (var i = 0; i < sorted.length; i++) {
    var it = sorted[i];
    if (it.category.key === "CORE_AI" || it.category.key === "LIB_UPDATES") continue;
    if (topPicks.length >= 3) break;
    if (!sourceCount[it.sourceName]) {
      topPicks.push(it);
      sourceCount[it.sourceName] = 1;
    }
  }

  var topPickLinks = {};
  topPicks.forEach(function(x) { topPickLinks[x.link] = true; });

  var groupedSections = [];

  for (var ci = 0; ci < CATEGORIES.length; ci++) {
    var cat = CATEGORIES[ci];
    if (cat.key === "TOP_PICKS") continue;

    var pool = sorted.filter(function(it) {
      return it.category.key === cat.key && !topPickLinks[it.link];
    });
    var chosen = [];
    var catSourceCount = {};

    for (var pi = 0; pi < pool.length; pi++) {
      var item = pool[pi];
      if (chosen.length >= SETTINGS.maxSendPerCategory) break;

      if (cat.key === "CORE_AI") {
        var cnt = catSourceCount[item.sourceName] || 0;
        if (cnt >= 1) continue;
        catSourceCount[item.sourceName] = cnt + 1;
      } else if (cat.key !== "LIB_UPDATES") {
        var cnt2 = sourceCount[item.sourceName] || 0;
        if (cnt2 >= SETTINGS.maxPerSourceInDigest) continue;
        sourceCount[item.sourceName] = cnt2 + 1;
      }
      chosen.push(item);
    }

    if (cat.key === "LIB_UPDATES") {
      groupedSections.push({ category: cat, items: chosen });
    } else if (chosen.length) {
      groupedSections.push({ category: cat, items: chosen });
    }
  }

  sendPopcornCard_(webhookUrl, topPicks, groupedSections);
}

// ==================== 아이템 수집 ====================

function collectItems_() {
  var items = [];
  var seenTitles = {};
  var now = new Date();
  var props = PropertiesService.getScriptProperties();
  YT_LOG = [];

  var requests = SOURCES.map(function(s) {
    return {
      url: s.url,
      muteHttpExceptions: true,
      headers: s.kind === "youtube"
        ? {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
            "Referer": "https://www.youtube.com/"
          }
        : { "User-Agent": SETTINGS.userAgent }
    };
  });

  var responses = UrlFetchApp.fetchAll(requests);
  var cache = CacheService.getScriptCache();

  for (var i = 0; i < SOURCES.length; i++) {
    var source = SOURCES[i];
    var cacheKey = source.kind === "youtube" ? "YT_FEED_" + source.name.replace(/\s/g, "_") : null;

    try {
      var res = responses[i];
      var xml = null;

      if (res && res.getResponseCode() < 400) {
        var text = res.getContentText();
        if (text.toLowerCase().indexOf("<!doctype html>") === -1 &&
            text.toLowerCase().indexOf("<html") !== 0) {
          xml = text;
          if (cacheKey) {
            try { cache.put(cacheKey, xml, 518400); } catch(e) {}
          }
        }
      }

      if (!xml && cacheKey) {
        var cached = cache.get(cacheKey);
        if (cached) {
          xml = cached;
          YT_LOG.push({ name: source.name, passed: 0, blockedMust: [], blockedKw: [], blockedDate: 0, shorts: 0, failed: false, fromCache: true });
        } else {
          YT_LOG.push({ name: source.name, passed: 0, blockedMust: [], blockedKw: [], blockedDate: 0, shorts: 0, failed: true, code: res ? res.getResponseCode() : "no_response" });
          continue;
        }
      } else if (!xml) {
        continue;
      }

      xml = xml.replace(/&(?!(amp|apos|quot|lt|gt|#\d+|#x[0-9a-fA-F]+);)/g, "&amp;");
      xml = xml.replace(/<content:encoded[\s\S]*?<\/content:encoded>/gi, "<content:encoded></content:encoded>");
      xml = xml.replace(/<hr>/gi, "<hr/>").replace(/<br>/gi, "<br/>");

      var parsed = parseFeed_(xml, source);

      if (source.kind === "library") {
        var propKey = "LIB_VER_" + source.name.replace(/\s/g, "_");
        var cachedLatest = props.getProperty(propKey) || "";
        var latestEntry = parsed[0];
        if (!latestEntry) continue;

        var latestTitle = normalizeSpaces_(stripHtml_(latestEntry.title || ""));
        if (latestTitle === cachedLatest) continue;

        var libEntry = parsed[0];
        if (!libEntry.link || libEntry.link.indexOf("http") !== 0) continue;
        if (!libEntry.title) continue;

        var libCleanTitle = normalizeSpaces_(stripHtml_(libEntry.title));
        var libRawSummary = summarizeRelease_(libEntry.summary);
        var libTranslated = libRawSummary;
        if (libRawSummary.length > 5) {
          try { libTranslated = LanguageApp.translate(libRawSummary, "en", "ko"); } catch(e) {}
        }
        items.push({
          title: trimTo_(libCleanTitle, SETTINGS.titleMaxLen),
          link: libEntry.link,
          summary: libTranslated,
          sourceName: source.name,
          sourceKind: source.kind,
          publishedAt: libEntry.publishedAt,
          _propKey: propKey,
          _propValue: latestTitle,
          category: CATEGORIES.filter(function(c) { return c.key === "LIB_UPDATES"; })[0],
          score: 100 + (libEntry.publishedAt ? Math.max(0, 30 - (now - libEntry.publishedAt) / (1000 * 60 * 60 * 24)) : 0)
        });
        continue;
      }

      var ytPassed = 0;
      var ytBlockedMust = [];
      var ytBlockedKw = [];
      var ytBlockedDate = 0;
      var ytShorts = 0;

      var sliced = parsed.slice(0, SETTINGS.maxItemsPerSource);
      for (var ei = 0; ei < sliced.length; ei++) {
        var entry = sliced[ei];
        if (!entry.link || entry.link.indexOf("http") !== 0) continue;
        if (!entry.title) continue;

        var cleanTitle = normalizeSpaces_(stripHtml_(entry.title));
        var lowerTitle = cleanTitle.toLowerCase();

        var effectiveLookback = source.kind === "youtube" ? SETTINGS.youtubeLookbackDays : 7;

        if (entry.publishedAt && (now - entry.publishedAt) > effectiveLookback * 24 * 60 * 60 * 1000) {
          if (source.kind === "youtube") ytBlockedDate++;
          continue;
        }

        if (!entry.publishedAt && source.kind !== "library" && source.kind !== "youtube") {
          continue;
        }

        if (EXCLUDE_KEYWORDS.some(function(kw) { return lowerTitle.indexOf(kw) !== -1; })) {
          if (source.kind === "youtube") ytBlockedKw.push(cleanTitle);
          continue;
        }

        if (DOMESTIC_SOURCES.indexOf(source.name) !== -1) {
          if (DOMESTIC_BLOG_BLOCK_PATTERNS.some(function(pat) { return pat.test(cleanTitle); })) continue;
        }

        if (SETTINGS.coreAiSourceKinds.indexOf(source.kind) !== -1 ||
            SETTINGS.coreAiSourceNames.indexOf(source.name) !== -1) {
          var aiText = (cleanTitle + " " + (entry.summary || "")).toLowerCase();
          var hasAllow = CORE_AI_ALLOW_KEYWORDS.some(function(k) { return aiText.indexOf(k) !== -1; });
          if (!hasAllow) continue;
          if (CORE_AI_BLOCK_PATTERNS.some(function(pat) { return pat.test(cleanTitle); })) continue;
        }

        if (source.kind === "youtube") {
          if (entry.link.indexOf("/shorts/") !== -1) { ytShorts++; continue; }

          var isBlocked = SETTINGS.youtubeBlockKeywords.some(function(k) { return lowerTitle.indexOf(k) !== -1; });
          if (isBlocked) { ytBlockedKw.push(cleanTitle); continue; }

          // mustKeyword 체크 — 모든 채널 동일 적용 (신뢰채널 예외 없음)
          var hasMust = SETTINGS.youtubeMustKeywords.some(function(k) { return lowerTitle.indexOf(k) !== -1; });
          if (!hasMust) { ytBlockedMust.push(cleanTitle); continue; }
          ytPassed++;
        }

        // ← 변경: 요약 방식 분기 — Changelog는 summarizeRelease_, Blog는 일반 번역
        var isChangelog = SETTINGS.cursorChangelogSources.indexOf(source.name) !== -1;
        var isCursorBlog = SETTINGS.cursorBlogSources.indexOf(source.name) !== -1;
        var isOtherAiSource = SETTINGS.coreAiSourceKinds.indexOf(source.kind) !== -1 && !isCursorBlog;

        var summaryText = "";
        if (isChangelog || isOtherAiSource) {
          // 릴리즈 노트 형식: bullet 파싱
          summaryText = summarizeRelease_(entry.summary);
          if (summaryText.length > 5) {
            try { summaryText = LanguageApp.translate(summaryText, "en", "ko"); } catch(e) {}
          }
        } else {
          // 일반 블로그 포스트: 앞부분 자르고 번역
          var rawSummary = trimTo_(stripHtml_(entry.summary), SETTINGS.summaryMaxLen);
          if (rawSummary.length > 5) {
            try { summaryText = LanguageApp.translate(rawSummary, "", "ko"); } catch(e) { summaryText = rawSummary; }
          } else {
            summaryText = rawSummary;
          }
        }

        var newItem = {
          title: trimTo_(cleanTitle, SETTINGS.titleMaxLen),
          link: entry.link,
          summary: summaryText,
          sourceName: source.name,
          sourceKind: source.kind,
          publishedAt: entry.publishedAt,
          _propKey: null,
          _propValue: null,
          category: null,
          score: 0
        };

        newItem.category = classifyCategory_(newItem, source);

        if (newItem.category && newItem.category.key === "GENERAL") {
          var genText = (newItem.title + " " + newItem.summary).toLowerCase();
          var isRelevant = GENERAL_RELEVANCE_KEYWORDS.some(function(k) { return genText.indexOf(k) !== -1; });
          if (!isRelevant) continue;
        }

        if (newItem.category) {
          var titleKey = newItem.title.trim().toLowerCase();
          if (!seenTitles[titleKey]) {
            seenTitles[titleKey] = true;
            newItem.score = scoreItem_(newItem, source, now);
            items.push(newItem);
          }
        }
      }

      if (source.kind === "youtube") {
        YT_LOG.push({
          name: source.name,
          passed: ytPassed,
          blockedMust: ytBlockedMust,
          blockedKw: ytBlockedKw,
          blockedDate: ytBlockedDate,
          shorts: ytShorts
        });
      }

    } catch(e) {
      console.log("[" + source.name + "] 오류: " + e);
    }
  }

  return items;
}

// ==================== 분류 로직 ====================

function classifyCategory_(item, source) {
  var text = (item.title + " " + item.summary).toLowerCase();

  if (SETTINGS.coreAiSourceKinds.indexOf(source.kind) !== -1 ||
      SETTINGS.coreAiSourceNames.indexOf(source.name) !== -1) {
    return CATEGORIES.filter(function(c) { return c.key === "CORE_AI"; })[0];
  }

  if (source.kind === "library") {
    return CATEGORIES.filter(function(c) { return c.key === "LIB_UPDATES"; })[0];
  }

  if (PUBLISHING_SOURCES.indexOf(source.name) !== -1) {
    return CATEGORIES.filter(function(c) { return c.key === "PUBLISHING"; })[0];
  }

  if (source.kind === "youtube") {
    return CATEGORIES.filter(function(c) { return c.key === "YOUTUBE"; })[0];
  }

  var skipKeys = ["TOP_PICKS", "CORE_AI", "LIB_UPDATES", "YOUTUBE"];
  for (var i = 0; i < CATEGORIES.length; i++) {
    var cat = CATEGORIES[i];
    if (skipKeys.indexOf(cat.key) !== -1) continue;
    if (cat.keywords && cat.keywords.some(function(k) { return text.indexOf(k) !== -1; })) {
      return cat;
    }
  }

  return CATEGORIES.filter(function(c) { return c.key === "GENERAL"; })[0];
}

// ==================== 점수 계산 ====================

function scoreItem_(item, source, now) {
  var score = 0;
  var text = (item.title + " " + item.summary).toLowerCase();

  if (item.category.key === "CORE_AI" || item.category.key === "LIB_UPDATES") score += 100;

  if (item.publishedAt) {
    var daysOld = (now - item.publishedAt) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 30 - daysOld);
  }

  var highValueKeywords = ["scss", "sass", "figma", "n8n", "make", "자동화", "접근성", "a11y", "반응형", "core web vitals", "web standard"];
  score += highValueKeywords.filter(function(k) { return text.indexOf(k) !== -1; }).length * 15;

  if (source.kind === "youtube") score += 10;

  if (PUBLISHING_SOURCES.indexOf(source.name) !== -1) score += 20;

  var cursorSources = ["Cursor Blog", "Cursor Changelog"];
  if (cursorSources.indexOf(source.name) !== -1) score += 40;

  return score;
}

// ==================== UI 렌더링 ====================

function sendPopcornCard_(webhookUrl, topPicks, sections) {
  var props = PropertiesService.getScriptProperties();
  var dateStr = Utilities.formatDate(new Date(), "Asia/Seoul", "MM/dd");
  var widgets = [];

  widgets.push({
    decoratedText: {
      text: "<b>☕ 나른한 월요일 오후, 팝콘처럼 톡톡 튀는 IT 소식!</b><br/><font color=\"#5f6368\">월요병을 이겨낼 우리 팀 필수 스택 업데이트를 정리해 왔어요.</font>",
      wrapText: true
    }
  });

  var coreSections = sections.filter(function(sec) {
    return sec.category.key === "CORE_AI" || sec.category.key === "LIB_UPDATES";
  });

  coreSections.forEach(function(sec) {
    widgets.push({ divider: {} });
    widgets.push({ decoratedText: { text: "<b>" + sec.category.label + "</b>", wrapText: true } });

    if (sec.category.key === "LIB_UPDATES" && sec.items.length === 0) {
      var allProps = PropertiesService.getScriptProperties().getProperties();
      var libSources = SOURCES.filter(function(s) { return s.kind === "library"; });
      widgets.push({
        decoratedText: {
          text: "<font color=\"#34a853\">✅ 이번 주 신규 릴리즈 없음 — 현재 안정 버전이에요.</font>",
          wrapText: true
        }
      });
      libSources.forEach(function(src) {
        var verKey = "LIB_VER_" + src.name.replace(/\s/g, "_");
        var ver = allProps[verKey] || "버전 정보 없음";
        var releaseUrl = src.releasePageUrl || src.url;
        widgets.push({
          decoratedText: {
            topLabel: src.name,
            text: "<font color=\"#444\">" + ver + "</font>",
            wrapText: true,
            button: { text: "릴리즈 보기", onClick: { openLink: { url: releaseUrl } } }
          }
        });
      });
    } else {
      sec.items.forEach(function(it) {
        makeItemWidgets_(it).forEach(function(w) { widgets.push(w); });
      });
    }
  });

  if (topPicks && topPicks.length) {
    widgets.push({ divider: {} });
    widgets.push({ decoratedText: { text: "<b>🌟 금주의 팝콘 픽 (기타 강추)</b>", wrapText: true } });
    topPicks.forEach(function(it) {
      makeItemWidgets_(it).forEach(function(w) { widgets.push(w); });
    });
  }

  var otherSections = sections.filter(function(sec) {
    return sec.category.key !== "CORE_AI" && sec.category.key !== "LIB_UPDATES";
  });

  otherSections.forEach(function(sec) {
    widgets.push({ divider: {} });
    widgets.push({ decoratedText: { text: "<b>" + sec.category.label + "</b>", wrapText: true } });
    sec.items.forEach(function(it) {
      makeItemWidgets_(it).forEach(function(w) { widgets.push(w); });
    });
  });

  var payload = {
    cardsV2: [{
      cardId: "weeklyPopcornDigest",
      card: {
        header: {
          title: "🍿 이번 주 뭐볼까?",
          subtitle: dateStr + " · 월요병 극복 큐레이션",
          imageType: "CIRCLE",
          imageUrl: "https://fonts.gstatic.com/s/i/googlematerialicons/movie_filter/v15/24px.svg"
        },
        sections: [{ widgets: widgets }]
      }
    }]
  };

  UrlFetchApp.fetch(webhookUrl, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  });

  sections.forEach(function(sec) {
    if (sec.category.key === "LIB_UPDATES") {
      sec.items.forEach(function(it) {
        if (it._propKey && it._propValue) props.setProperty(it._propKey, it._propValue);
      });
    }
  });
}

function makeItemWidgets_(it) {
  var dateStr = it.publishedAt ? Utilities.formatDate(it.publishedAt, "Asia/Seoul", "MM/dd") : "";
  var topLabel = it.sourceName + (dateStr ? " · " + dateStr : "");
  var summaryFormatted = it.summary.replace(/\n/g, "<br/>");
  var summaryLine = summaryFormatted ? "<br/><font color=\"#808080\">" + summaryFormatted + "</font>" : "";

  return [
    { decoratedText: { topLabel: topLabel, text: "<b>" + escapeHtml_(it.title) + "</b>" + summaryLine, wrapText: true } },
    { buttonList: { buttons: [{ text: "보러가기", onClick: { openLink: { url: it.link } } }] } }
  ];
}

// ==================== 디버그 함수 ====================

function debugDigest() {
  var allItems = collectItems_();
  var summary = {};

  allItems.forEach(function(item) {
    var key = item.category ? item.category.label : "미분류";
    if (!summary[key]) summary[key] = [];
    summary[key].push("[" + item.sourceName + "] " + item.title);
  });

  console.log("=== 총 수집 아이템 수:", allItems.length, "===\n");

  Object.keys(summary).forEach(function(cat) {
    console.log("▶ " + cat + " (" + summary[cat].length + "개)");
    summary[cat].forEach(function(t) { console.log("  -", t); });
    console.log("");
  });

  console.log("=== 📺 유튜브 필터링 진단 ===");
  if (YT_LOG.length === 0) {
    console.log("  (유튜브 채널 데이터 없음 — 피드 로드 실패 가능성)");
  }
  YT_LOG.forEach(function(ch) {
    if (ch.failed) {
      console.log("  ❌ [" + ch.name + "] 피드 로드 실패 (code: " + ch.code + ") — 캐시도 없음");
    } else if (ch.fromCache && ch.passed === 0 && ch.blockedMust.length === 0) {
      console.log("  💾 [" + ch.name + "] 캐시 폴백 사용 중 (실시간 피드 실패)");
    } else {
      console.log(
        "  ✅ [" + ch.name + "]" +
        " 통과: " + ch.passed + "개" +
        " | MUST미충족: " + ch.blockedMust.length +
        " | BLOCK차단: " + ch.blockedKw.length +
        " | 날짜초과: " + ch.blockedDate +
        " | Shorts: " + ch.shorts +
        (ch.fromCache ? " 💾캐시" : "")
      );
      ch.blockedMust.slice(0, 3).forEach(function(t) { console.log("    ❌ MUST미충족: " + t); });
      ch.blockedKw.slice(0, 3).forEach(function(t) { console.log("    ⛔ BLOCK차단: " + t); });
    }
  });

  var libItems = allItems.filter(function(i) { return i.category && i.category.key === "LIB_UPDATES"; });
  console.log("\n=== 📦 라이브러리 아이템:", libItems.length, "개 ===");
  if (libItems.length === 0) {
    console.log("ℹ️ 이번 주 라이브러리 신규 릴리즈 없음");
  } else {
    libItems.forEach(function(it) {
      console.log("  - [" + it.sourceName + "] " + it.title + " (score: " + it.score + ")");
    });
  }

  var allProps = PropertiesService.getScriptProperties().getProperties();
  console.log("\n=== 📌 저장된 라이브러리 버전 캐시 ===");
  Object.keys(allProps)
    .filter(function(k) { return k.indexOf("LIB_VER_") === 0; })
    .forEach(function(k) { console.log("  " + k + ": " + allProps[k]); });
}

function resetLibVersionCache() {
  var props = PropertiesService.getScriptProperties();
  var all = props.getProperties();
  Object.keys(all)
    .filter(function(k) { return k.indexOf("LIB_VER_") === 0; })
    .forEach(function(k) { props.deleteProperty(k); });
  console.log("✅ 라이브러리 버전 캐시를 초기화했습니다.");
}

function seedLibVersionCache() {
  var props = PropertiesService.getScriptProperties();
  var libSources = SOURCES.filter(function(s) { return s.kind === "library"; });

  libSources.forEach(function(source) {
    try {
      var xml = fetchAndSanitizeXml_(source.url);
      if (!xml) { console.log("[" + source.name + "] 피드 가져오기 실패"); return; }
      var parsed = parseFeed_(xml, source);
      if (!parsed.length) return;
      var latestTitle = normalizeSpaces_(stripHtml_(parsed[0].title || ""));
      var propKey = "LIB_VER_" + source.name.replace(/\s/g, "_");
      props.setProperty(propKey, latestTitle);
      console.log("✅ [" + source.name + "] 캐시 저장: \"" + latestTitle + "\"");
    } catch(e) {
      console.log("[" + source.name + "] 오류: " + e);
    }
  });

  console.log("\n📌 seedLibVersionCache 완료! debugDigest()를 다시 실행해보세요.");
}

// ==================== 공통 유틸 ====================

function fetchAndSanitizeXml_(url) {
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { "User-Agent": SETTINGS.userAgent } });
  if (res.getResponseCode() >= 400) return null;
  var xml = res.getContentText();
  if (xml.toLowerCase().indexOf("<!doctype html>") !== -1 || xml.toLowerCase().indexOf("<html") === 0) return null;
  xml = xml.replace(/&(?!(amp|apos|quot|lt|gt|#\d+|#x[0-9a-fA-F]+);)/g, "&amp;");
  xml = xml.replace(/<content:encoded[\s\S]*?<\/content:encoded>/gi, "<content:encoded></content:encoded>");
  return xml.replace(/<hr>/gi, "<hr/>").replace(/<br>/gi, "<br/>");
}

function parseFeed_(xml, source) {
  var doc = XmlService.parse(xml);
  var root = doc.getRootElement();
  var channel = root.getChild("channel");

  if (channel) {
    return channel.getChildren("item").map(function(item) {
      return {
        title: item.getChildText("title") || "",
        link: (item.getChildText("link") || "").trim(),
        summary: item.getChildText("description") || item.getChildText("summary") || "",
        publishedAt: parseDateSafe_(item.getChildText("pubDate") || item.getChildText("date"))
      };
    });
  }

  var ns = root.getNamespace();
  return (root.getChildren("entry", ns) || []).map(function(entry) {
    var link = "";
    var links = entry.getChildren("link", ns) || [];
    for (var i = 0; i < links.length; i++) {
      var l = links[i];
      if (l.getAttribute("href") &&
          (!l.getAttribute("rel") || l.getAttribute("rel").getValue() === "alternate")) {
        link = l.getAttribute("href").getValue();
        break;
      }
    }
    if (!link && links.length) link = links[0].getAttribute("href").getValue();

    return {
      title: entry.getChildText("title", ns) || "",
      link: link,
      summary: entry.getChildText("summary", ns) || entry.getChildText("content", ns) || "",
      publishedAt: parseDateSafe_(entry.getChildText("published", ns) || entry.getChildText("updated", ns))
    };
  });
}

function summarizeRelease_(raw) {
  var cleaned = normalizeSpaces_(stripHtml_(raw || ""))
    .replace(/\(#\d+\)/g, "")
    .replace(/\b[0-9a-f]{7,40}\b/gi, "")
    .trim();
  var chunks = cleaned.split(/[\n•\-]\s+/).map(function(x) { return x.trim(); }).filter(Boolean);
  var picked = chunks.filter(function(x) {
    return /(security|bug|fix|crash|breaking|feature|new|add|improve)/i.test(x);
  });
  return (picked.length ? picked : chunks).slice(0, 3).map(function(x) {
    return "- " + trimTo_(x, 80);
  }).join("\n");
}

function getWebhookUrl_() {
  return PropertiesService.getScriptProperties().getProperty("WEBHOOK_URL") || "";
}

function sendSimpleText_(url, text) {
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ text: text })
  });
}

function parseDateSafe_(s) {
  if (!s) return null;
  var d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function stripHtml_(s) {
  return String(s || "").replace(/<[^>]*>/g, " ");
}

function normalizeSpaces_(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function trimTo_(s, maxLen) {
  var str = String(s || "");
  return str.length <= maxLen ? str : str.slice(0, Math.max(0, maxLen - 1)) + "…";
}

function escapeHtml_(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
