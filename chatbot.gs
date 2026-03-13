/**
 * 🍿 퍼블팀 주간 뉴스레터 봇 v2.1
 *
 * [v2.0 변경사항]
 * 1. 📦 라이브러리: Script Properties로 버전 캐싱 → 새 버전 나올 때만 알림, 없으면 "안정 버전" 표시
 * 2. 🤖 CORE_AI 분류: 소스명/도메인 기반으로 변경 → "CSS cursor 속성" 오분류 방지
 * 3. 📺 유튜브 키워드: 한국어 중심으로 대폭 보강
 * 4. 🌟 Top Picks 점수: 랜덤 제거 → 최신성 + 키워드 가중치 기반으로 개선
 * 5. 📰 RSS 소스: CSS-Tricks, web.dev, Smashing Magazine, MDN Blog 추가
 *
 * [v2.1 버그픽스]
 * 6. 📦 라이브러리 캐싱 로직 재설계: 소스별 "최신 글 제목"을 캐싱, 변경 시에만 통과
 * 7. ✨ PUBLISHING 카테고리 영어 CSS 키워드 보강 (popover, grid, flexbox 등)
 * 8. 🤖 CORE_AI 기업 홍보성 케이스 스터디 필터링 추가
 */

// 유튜브 필터링 진단 로그 (collectItems_ → debugDigest 공유용)
let YT_LOG = [];

const SETTINGS = {
    maxItemsPerSource: 12,
    maxSendPerCategory: 5,
    lookbackDays: 30,
    maxPerSourceInDigest: 2,

    summaryMaxLen: 120,
    titleMaxLen: 80,

    youtubeMustKeywords: [
        // 기술 (영어)
        "css",
        "scss",
        "sass",
        "html",
        "a11y",
        "gsap",
        "swiper",
        "jquery",
        "javascript",
        "typescript",
        "tailwind",
        "next.js",
        "nextjs",
        "react",
        "figma",
        "cursor",
        "claude",
        "gemini",
        "devtools",
        // 기술 (한국어) ← 대폭 보강
        "퍼블",
        "퍼블리싱",
        "마크업",
        "웹",
        "프론트",
        "프론트엔드",
        "반응형",
        "접근성",
        "인터랙션",
        "애니메이션",
        "클론코딩",
        "클론 코딩",
        "웹사이트 만들기",
        "웹개발",
        "웹 개발",
        "포트폴리오",
        "ui",
        "ux",
        "피그마",
        "성능",
        "최적화",
        // 자동화/AI (한국어) ← 보강
        "자동화",
        "노코드",
        "노 코드",
        "n8n",
        "make",
        "zapier",
        "ai",
        "llm",
        "에이전트",
        "agent",
        "생산성",
        "vibe coding",
        "vibe코딩",
        "바이브코딩",
        "클로드코드",
        "claude code",
        "replit",
        "실전",
        "튜토리얼",
        "강의",
        "업무",
    ],

    youtubeBlockKeywords: [
        "주식",
        "매매",
        "코인",
        "게임",
        "먹방",
        "asmr",
        "브이로그",
        "shorts",
        "일상",
        "여행",
        "개그",
        "예능",
        "스트리밍 중",
        "라이브",
    ],

    userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0 Safari/537.36",

    // ✨ CORE_AI 판단 기준: rss_ai kind면 전부 CORE_AI (소스명 목록은 참고용)
    coreAiSourceNames: [
        "OpenAI Blog",
        "Google DeepMind",
        "Google for Developers",
        "HuggingFace Blog",
        "Cursor Changelog",
        "Cursor Blog",
    ],
    coreAiSourceKinds: ["rss_ai"],
};

const EXCLUDE_KEYWORDS = [
    // 기존
    "국방부",
    "해커톤",
    "부스",
    "mwc",
    "ces",
    "채용",
    "주총",
    "사고",
    "사건",
    "정치",
    "선거",
    "대통령",
    "국회",
    // 추가: 퍼블리셔 무관 뉴스
    "전쟁",
    "연료",
    "제조업",
    "창업",
    "투자",
    "ipo",
    "인수 완료",
    "채권",
    "환율",
    // 추가: 행사/이벤트성 글
    "wallpaper",
    "wallpapers",
    "conference",
    "conf ",
    "smashingconf",
    "meet smashing",
    "amsterdam",
    "월페이퍼",
    "바탕화면",
];

// 🤖 CORE_AI 섹션에서 걸러낼 패턴 (기업 홍보 + 행사성 글)
const CORE_AI_BLOCK_PATTERNS = [
    // 기업 홍보성 케이스 스터디
    /\b(fixes|boosts|enables|built an|using openai|with openai|with chatgpt|case study)\b/i,
    // 행사/이벤트성 글
    /\b(save the date|i\/o 2026|google i\/o|cloud next|build hour|wednesday|conference|summit|event)\b/i,
    // 특정 지역/국가 홍보
    /\b(india|vegas|amsterdam|london|new york)\b/i,
];

const SOURCES = [
    // 🤖 AI & 공식 블로그
    // ※ OpenAI: /news/rss.xml이 /blog/rss.xml보다 더 넓은 공지 포함
    {
        name: "OpenAI Blog",
        url: "https://openai.com/news/rss.xml",
        icon: "https://openai.com/favicon.ico",
        kind: "rss_ai",
    },
    // ※ Google DeepMind: Gemini 관련 주요 발표 포함
    {
        name: "Google DeepMind",
        url: "https://deepmind.google/blog/rss.xml",
        icon: "https://deepmind.google/favicon.ico",
        kind: "rss_ai",
    },
    // ※ Google Developers: NotebookLM, Gemini API 등 실무 업데이트
    {
        name: "Google for Developers",
        url: "https://developers.googleblog.com/feeds/posts/default",
        icon: "https://developers.google.com/favicon.ico",
        kind: "rss_ai",
    },
    // ※ Anthropic: 공식 RSS 없음 → GeekNews가 Claude 소식을 잘 커버하므로 HuggingFace로 대체
    // HuggingFace: 최신 AI 모델/도구 발표 (Claude, GPT 등 실무 관련)
    {
        name: "HuggingFace Blog",
        url: "https://huggingface.co/blog/feed.xml",
        icon: "https://huggingface.co/favicon.ico",
        kind: "rss_ai",
    },
    // ※ Cursor: 공식 릴리즈 노트 (GitHub releases가 가장 안정적)
    {
        name: "Cursor Changelog",
        url: "https://github.com/getcursor/cursor/releases.atom",
        icon: "https://cursor.sh/favicon.ico",
        kind: "rss_ai",
    },
    {
        name: "Cursor Blog",
        url: "https://any-feeds.com/api/feeds/custom/cmkoaiogm0000lf04qmtirq2g/rss.xml",
        icon: "https://cursor.sh/favicon.ico",
        kind: "rss_ai",
    },
    {
        name: "Cursor Blog",
        url: "https://cursor.com/rss.xml",
        icon: "https://cursor.sh/favicon.ico",
        kind: "rss_ai",
    },

    // 📺 유튜브
    {
        name: "윤자동 (업무자동화)",
        url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCYg51KBo-UcA4QILcYl5LEw",
        icon: "https://www.youtube.com/favicon.ico",
        kind: "youtube",
    },
    {
        name: "시민개발자 구씨",
        url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCDLlMjELbrJdETmSiAB68AA",
        icon: "https://www.youtube.com/favicon.ico",
        kind: "youtube",
    },
    {
        name: "노마드코더",
        url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCUpJs89fSBXNolQGOYKn0YQ",
        icon: "https://www.youtube.com/favicon.ico",
        kind: "youtube",
    },
    {
        name: "조코딩",
        url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCYaDkwVaOhuoe_LuFr3lWkA",
        icon: "https://www.youtube.com/favicon.ico",
        kind: "youtube",
    },
    {
        name: "개발동생",
        url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC1_ZZYZsHh2_DzCXN4VGVcQ",
        icon: "https://www.youtube.com/favicon.ico",
        kind: "youtube",
    },

    {
        name: "우아한테크",
        url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC-mOekGSesms0agFntnQang",
        icon: "https://woowahan.com/favicon.ico",
        kind: "youtube",
    },
    {
        name: "토스",
        url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCeg5g-vWgtgzQ0cYNV2Cyow",
        icon: "https://www.youtube.com/favicon.ico",
        kind: "youtube",
    },
    {
        name: "당근테크",
        url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC8tsBsQBuF7QybxgLmStihA",
        icon: "https://www.youtube.com/favicon.ico",
        kind: "youtube",
    },

    // 📰 국내 기술 블로그
    {
        name: "무신사 기술블로그",
        url: "https://techblog.musinsa.com/feed/",
        icon: "https://techblog.musinsa.com/favicon.ico",
        kind: "rss",
    },
    {
        name: "29CM 기술블로그",
        url: "https://medium.com/feed/29cm",
        icon: "https://www.29cm.co.kr/favicon.ico",
        kind: "rss",
    },
    {
        name: "토스 테크",
        url: "https://toss.tech/rss.xml",
        icon: "https://toss.im/favicon.ico",
        kind: "rss",
    },
    {
        name: "당근 테크",
        url: "https://medium.com/feed/daangn",
        icon: "https://www.daangn.com/favicon.ico",
        kind: "rss",
    },
    {
        name: "GeekNews",
        url: "https://news.hada.io/rss/news",
        icon: "https://news.hada.io/favicon.ico",
        kind: "rss",
    },

    // 📰 해외 퍼블리셔 필수 블로그 ← 신규 추가
    {
        name: "CSS-Tricks",
        url: "https://css-tricks.com/feed/",
        icon: "https://css-tricks.com/favicon.ico",
        kind: "rss",
    },
    {
        name: "web.dev",
        url: "https://web.dev/feed.xml",
        icon: "https://web.dev/favicon.ico",
        kind: "rss",
    },
    {
        name: "Smashing Magazine",
        url: "https://www.smashingmagazine.com/feed/",
        icon: "https://www.smashingmagazine.com/favicon.ico",
        kind: "rss",
    },
    {
        name: "MDN Blog",
        url: "https://developer.mozilla.org/en-US/blog/rss.xml",
        icon: "https://developer.mozilla.org/favicon.ico",
        kind: "rss",
    },

    // 📦 필수 라이브러리 릴리즈
    {
        name: "Sass(SCSS) 공식",
        url: "https://sass-lang.com/feed.xml",
        icon: "https://sass-lang.com/favicon.ico",
        kind: "library",
        releasePageUrl: "https://github.com/sass/dart-sass/releases",
    },
    {
        name: "jQuery Releases",
        url: "https://github.com/jquery/jquery/releases.atom",
        icon: "https://jquery.com/favicon.ico",
        kind: "library",
        releasePageUrl: "https://github.com/jquery/jquery/releases",
    },
    {
        name: "GSAP Releases",
        url: "https://github.com/greensock/GSAP/releases.atom",
        icon: "https://gsap.com/favicon.ico",
        kind: "library",
        releasePageUrl: "https://gsap.com/blog/",
    },
    {
        name: "Swiper Releases",
        url: "https://github.com/nolimits4web/swiper/releases.atom",
        icon: "https://swiperjs.com/favicon.ico",
        kind: "library",
        releasePageUrl: "https://github.com/nolimits4web/swiper/releases",
    },
];

const CATEGORIES = [
    {
        key: "CORE_AI",
        label: "🤖 전사 도입 AI 필수 업데이트 (Cursor/Gemini)",
        keywords: [],
    },
    { key: "LIB_UPDATES", label: "📦 필수 라이브러리 릴리즈", keywords: [] },
    { key: "TOP_PICKS", label: "🌟 금주의 팝콘 픽 (기타 강추)", keywords: [] },
    {
        key: "PUBLISHING",
        label: "✨ UI/UX 퍼블리싱 & 인터랙션",
        keywords: [
            // 한국어
            "scss",
            "sass",
            "css",
            "html",
            "인터랙션",
            "마크업",
            "figma",
            "피그마",
            "접근성",
            "a11y",
            "애니메이션",
            "반응형",
            "웹 표준",
            // 영어 CSS/UI 키워드 보강 ← 신규
            "selector",
            "selects",
            "popover",
            "dialog",
            "grid",
            "flexbox",
            "flex",
            "z-index",
            "animation",
            "transition",
            "scroll",
            "web standard",
            "border",
            "layout",
            "typography",
            "color",
            "variable",
            "custom property",
            "tailwind",
            "component",
            "design system",
            "ux",
            "ui pattern",
        ],
    },
    {
        key: "GENERAL",
        label: "🏢 IT 업계 실무 & 자동화 꿀팁",
        keywords: [
            "프론트엔드",
            "최적화",
            "javascript",
            "js",
            "생산성",
            "협업",
            "자동화",
            "n8n",
            "make",
            "typescript",
        ],
    },
    { key: "YOUTUBE", label: "📺 주말에 몰아보는 코딩 유튜브", keywords: [] },
];

// ==================== 메인 함수 ====================

function mainDigest() {
    const webhookUrl = getWebhookUrl_();
    if (!webhookUrl) throw new Error("WEBHOOK_URL이 설정되지 않았습니다.");

    const allItems = collectItems_();
    if (allItems.length === 0) {
        sendSimpleText_(webhookUrl, "🍿 최근 새로운 소식이 없네요. 푹 쉬세요!");
        return;
    }

    const sorted = allItems.sort((a, b) => b.score - a.score);
    const sourceCount = {};
    const topPicks = [];

    for (const it of sorted) {
        if (it.category.key === "CORE_AI" || it.category.key === "LIB_UPDATES")
            continue;
        if (topPicks.length >= 3) break;
        if (!sourceCount[it.sourceName]) {
            topPicks.push(it);
            sourceCount[it.sourceName] = 1;
        }
    }

    const topPickLinks = new Set(topPicks.map((x) => x.link));
    const groupedSections = [];

    for (const cat of CATEGORIES) {
        if (cat.key === "TOP_PICKS") continue;

        const pool = sorted.filter(
            (it) => it.category.key === cat.key && !topPickLinks.has(it.link),
        );
        const chosen = [];
        const catSourceCount = {}; // 카테고리 내 소스별 카운트 (CORE_AI 독점 방지용)

        for (const it of pool) {
            if (chosen.length >= SETTINGS.maxSendPerCategory) break;

            if (cat.key === "CORE_AI") {
                // CORE_AI: 소스당 최대 1개로 제한 (다양한 소스 골고루 노출)
                const cnt = catSourceCount[it.sourceName] || 0;
                if (cnt >= 1) continue;
                catSourceCount[it.sourceName] = cnt + 1;
            } else if (cat.key !== "LIB_UPDATES") {
                const cnt = sourceCount[it.sourceName] || 0;
                if (cnt >= SETTINGS.maxPerSourceInDigest) continue;
                sourceCount[it.sourceName] = cnt + 1;
            }
            chosen.push(it);
        }

        // ✨ 라이브러리 섹션: 아이템이 없어도 "안정 버전" 메시지로 섹션 유지
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
    const items = [];
    const seenTitles = new Set();
    const now = new Date();
    const props = PropertiesService.getScriptProperties();
    YT_LOG = [];

    // ✨ 전체 소스를 fetchAll로 병렬 요청. 유튜브는 브라우저 헤더로 우회
    const requests = SOURCES.map((s) => ({
        url: s.url,
        muteHttpExceptions: true,
        headers:
            s.kind === "youtube"
                ? {
                      "User-Agent":
                          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                      Accept: "application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
                      "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
                      Referer: "https://www.youtube.com/",
                  }
                : { "User-Agent": SETTINGS.userAgent },
    }));
    const responses = UrlFetchApp.fetchAll(requests);
    const cache = CacheService.getScriptCache();

    for (let i = 0; i < SOURCES.length; i++) {
        const source = SOURCES[i];
        const cacheKey =
            source.kind === "youtube"
                ? `YT_FEED_${source.name.replace(/\s/g, "_")}`
                : null;
        try {
            const res = responses[i];
            let xml = null;

            if (res && res.getResponseCode() < 400) {
                const text = res.getContentText();
                if (
                    !text.toLowerCase().includes("<!doctype html>") &&
                    !text.toLowerCase().startsWith("<html")
                ) {
                    xml = text;
                    // ✨ 유튜브: 성공 시 캐시 저장 (6일 = 518400초)
                    if (cacheKey) {
                        try {
                            cache.put(cacheKey, xml, 518400);
                        } catch (e) {}
                    }
                }
            }

            // 유튜브: 실패 시 캐시 폴백
            if (!xml && cacheKey) {
                const cached = cache.get(cacheKey);
                if (cached) {
                    xml = cached;
                    YT_LOG.push({
                        name: source.name,
                        passed: 0,
                        blockedMust: [],
                        blockedKw: [],
                        blockedDate: 0,
                        shorts: 0,
                        failed: false,
                        fromCache: true,
                    });
                } else {
                    YT_LOG.push({
                        name: source.name,
                        passed: 0,
                        blockedMust: [],
                        blockedKw: [],
                        blockedDate: 0,
                        shorts: 0,
                        failed: true,
                        code: res ? res.getResponseCode() : "no_response",
                    });
                    continue;
                }
            } else if (!xml) {
                continue;
            }

            xml = xml.replace(
                /&(?!(amp|apos|quot|lt|gt|#\d+|#x[0-9a-fA-F]+);)/g,
                "&amp;",
            );
            xml = xml.replace(
                /<content:encoded[\s\S]*?<\/content:encoded>/gi,
                "<content:encoded></content:encoded>",
            );
            xml = xml.replace(/<hr>/gi, "<hr/>").replace(/<br>/gi, "<br/>");

            const parsed = parseFeed_(xml, source);

            if (source.kind === "library") {
                const propKey = `LIB_VER_${source.name.replace(/\s/g, "_")}`;
                const cachedLatest = props.getProperty(propKey) || "";
                const latestEntry = parsed[0];
                if (!latestEntry) continue;

                const latestTitle = normalizeSpaces_(
                    stripHtml_(latestEntry.title || ""),
                );
                if (latestTitle === cachedLatest) continue;

                for (const entry of parsed.slice(0, 3)) {
                    if (!entry.link || !entry.link.startsWith("http")) continue;
                    if (!entry.title) continue;
                    const cleanTitle = normalizeSpaces_(
                        stripHtml_(entry.title),
                    );
                    const rawSummary = summarizeRelease_(entry.summary);
                    let translatedSummary = rawSummary;
                    if (rawSummary.length > 5) {
                        try {
                            translatedSummary = LanguageApp.translate(
                                rawSummary,
                                "en",
                                "ko",
                            );
                        } catch (e) {}
                    }
                    items.push({
                        title: trimTo_(cleanTitle, SETTINGS.titleMaxLen),
                        link: entry.link,
                        summary: translatedSummary,
                        sourceName: source.name,
                        sourceKind: source.kind,
                        publishedAt: entry.publishedAt,
                        _propKey: propKey,
                        _propValue: latestTitle,
                        category: CATEGORIES.find(
                            (c) => c.key === "LIB_UPDATES",
                        ),
                        score:
                            100 +
                            (entry.publishedAt
                                ? Math.max(
                                      0,
                                      30 -
                                          (now - entry.publishedAt) /
                                              (1000 * 60 * 60 * 24),
                                  )
                                : 0),
                    });
                }
                continue;
            }

            // ✨ 유튜브 채널별 통계 집계
            let ytPassed = 0,
                ytBlockedMust = [],
                ytBlockedKw = [],
                ytBlockedDate = 0,
                ytShorts = 0;

            for (const entry of parsed.slice(0, SETTINGS.maxItemsPerSource)) {
                if (!entry.link || !entry.link.startsWith("http")) continue;
                if (!entry.title) continue;

                const cleanTitle = normalizeSpaces_(stripHtml_(entry.title));
                const lowerTitle = cleanTitle.toLowerCase();

                const effectiveLookback = source.kind === "library" ? 30 : 7;
                if (
                    entry.publishedAt &&
                    now - entry.publishedAt >
                        effectiveLookback * 24 * 60 * 60 * 1000
                ) {
                    if (source.kind === "youtube") ytBlockedDate++;
                    continue;
                }
                if (EXCLUDE_KEYWORDS.some((kw) => lowerTitle.includes(kw))) {
                    if (source.kind === "youtube") ytBlockedKw.push(cleanTitle);
                    continue;
                }

                if (
                    SETTINGS.coreAiSourceKinds.includes(source.kind) ||
                    SETTINGS.coreAiSourceNames.includes(source.name)
                ) {
                    if (
                        CORE_AI_BLOCK_PATTERNS.some((pat) =>
                            pat.test(cleanTitle),
                        )
                    )
                        continue;
                }

                if (source.kind === "youtube") {
                    if (entry.link.includes("/shorts/")) {
                        ytShorts++;
                        continue;
                    }
                    const must = SETTINGS.youtubeMustKeywords.some((k) =>
                        lowerTitle.includes(k),
                    );
                    if (!must) {
                        ytBlockedMust.push(cleanTitle);
                        continue;
                    }
                    const blocked = SETTINGS.youtubeBlockKeywords.some((k) =>
                        lowerTitle.includes(k),
                    );
                    if (blocked) {
                        ytBlockedKw.push(cleanTitle);
                        continue;
                    }
                    ytPassed++;
                }

                const isRelease = SETTINGS.coreAiSourceKinds.includes(
                    source.kind,
                );
                let summaryText = "";
                if (isRelease) {
                    summaryText = summarizeRelease_(entry.summary);
                    if (summaryText.length > 5) {
                        try {
                            summaryText = LanguageApp.translate(
                                summaryText,
                                "en",
                                "ko",
                            );
                        } catch (e) {}
                    }
                } else {
                    const rawSummary = trimTo_(
                        stripHtml_(entry.summary),
                        SETTINGS.summaryMaxLen,
                    );
                    if (rawSummary.length > 5) {
                        try {
                            summaryText = LanguageApp.translate(
                                rawSummary,
                                "",
                                "ko",
                            );
                        } catch (e) {
                            summaryText = rawSummary;
                        }
                    } else {
                        summaryText = rawSummary;
                    }
                }

                const item = {
                    title: trimTo_(cleanTitle, SETTINGS.titleMaxLen),
                    link: entry.link,
                    summary: summaryText,
                    sourceName: source.name,
                    sourceKind: source.kind,
                    publishedAt: entry.publishedAt,
                    _propKey: null,
                    _propValue: null,
                    category: null,
                    score: 0,
                };

                item.category = classifyCategory_(item, source);
                if (item.category) {
                    const titleKey = item.title.trim().toLowerCase();
                    if (!seenTitles.has(titleKey)) {
                        seenTitles.add(titleKey);
                        item.score = scoreItem_(item, source, now);
                        items.push(item);
                    }
                }
            }

            // 유튜브 채널 로그 저장
            if (source.kind === "youtube") {
                YT_LOG.push({
                    name: source.name,
                    passed: ytPassed,
                    blockedMust: ytBlockedMust,
                    blockedKw: ytBlockedKw,
                    blockedDate: ytBlockedDate,
                    shorts: ytShorts,
                });
            }
        } catch (e) {
            console.log(`[${source.name}] 오류: ${e}`);
        }
    }
    return items;
}

// ==================== 분류 로직 ====================

function classifyCategory_(item, source) {
    const text = (item.title + " " + item.summary).toLowerCase();

    // 1. ✨ CORE_AI: 소스명/kind 기반만 (키워드 오분류 방지)
    if (
        SETTINGS.coreAiSourceKinds.includes(source.kind) ||
        SETTINGS.coreAiSourceNames.includes(source.name)
    ) {
        return CATEGORIES.find((c) => c.key === "CORE_AI");
    }

    // 2. 라이브러리 공식 소스
    if (source.kind === "library") {
        return CATEGORIES.find((c) => c.key === "LIB_UPDATES");
    }

    // 3. 유튜브
    if (source.kind === "youtube")
        return CATEGORIES.find((c) => c.key === "YOUTUBE");

    // 4. 나머지 키워드 분류
    for (const cat of CATEGORIES) {
        if (
            ["TOP_PICKS", "CORE_AI", "LIB_UPDATES", "YOUTUBE"].includes(cat.key)
        )
            continue;
        if (cat.keywords && cat.keywords.some((k) => text.includes(k)))
            return cat;
    }

    return CATEGORIES.find((c) => c.key === "GENERAL");
}

// ==================== 점수 계산 ====================

function scoreItem_(item, source, now) {
    let score = 0;
    const text = (item.title + " " + item.summary).toLowerCase();

    // VVIP 기본 점수
    if (item.category.key === "CORE_AI" || item.category.key === "LIB_UPDATES")
        score += 100;

    // ✨ 최신성 점수 (랜덤 제거 → 날짜 기반)
    if (item.publishedAt) {
        const daysOld = (now - item.publishedAt) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 30 - daysOld); // 오늘 글 +30, 30일 된 글 +0
    }

    // 키워드 가중치
    const highValueKeywords = [
        "scss",
        "sass",
        "figma",
        "n8n",
        "make",
        "자동화",
        "접근성",
        "a11y",
        "반응형",
        "core web vitals",
        "web standard",
    ];
    const matchCount = highValueKeywords.filter((k) => text.includes(k)).length;
    score += matchCount * 15;

    // 유튜브 기본 보너스
    if (source.kind === "youtube") score += 10;

    // ✨ 퍼블리셔 핵심 소스 보너스
    const premiumSources = [
        "CSS-Tricks",
        "web.dev",
        "Smashing Magazine",
        "MDN Blog",
    ];
    if (premiumSources.includes(source.name)) score += 20;

    // ✨ Cursor 소스 보너스 (업무 직결 — 최우선)
    const cursorSources = ["Cursor Blog", "Cursor Changelog"];
    if (cursorSources.includes(source.name)) score += 40;

    return score;
}

// ==================== UI 렌더링 ====================

function sendPopcornCard_(webhookUrl, topPicks, sections) {
    const props = PropertiesService.getScriptProperties();
    const dateStr = Utilities.formatDate(new Date(), "Asia/Seoul", "MM/dd");
    const widgets = [];

    widgets.push({
        decoratedText: {
            text: '<b>☕ 나른한 월요일 오후, 팝콘처럼 톡톡 튀는 IT 소식!</b><br/><font color="#5f6368">월요병을 이겨낼 우리 팀 필수 스택 업데이트를 정리해 왔어요.</font>',
            wrapText: true,
        },
    });

    // 1. VVIP 섹션 (CORE_AI, LIB_UPDATES) 최상단 고정
    const coreSections = sections.filter(
        (sec) =>
            sec.category.key === "CORE_AI" ||
            sec.category.key === "LIB_UPDATES",
    );
    coreSections.forEach((sec) => {
        widgets.push({ divider: {} });
        widgets.push({
            decoratedText: {
                text: `<b>${sec.category.label}</b>`,
                wrapText: true,
            },
        });

        // ✨ 라이브러리 섹션이 비어있으면 현재 버전 + 링크 버튼 표시
        if (sec.category.key === "LIB_UPDATES" && sec.items.length === 0) {
            const props =
                PropertiesService.getScriptProperties().getProperties();
            const libSources = SOURCES.filter((s) => s.kind === "library");
            widgets.push({
                decoratedText: {
                    text: '<font color="#34a853">✅ 이번 주 신규 릴리즈 없음 — 현재 안정 버전이에요.</font>',
                    wrapText: true,
                },
            });
            libSources.forEach((src) => {
                const verKey = `LIB_VER_${src.name.replace(/\s/g, "_")}`;
                const ver = props[verKey] || "버전 정보 없음";
                const releaseUrl = src.releasePageUrl || src.url;
                widgets.push({
                    decoratedText: {
                        topLabel: src.name,
                        text: `<font color="#444">${ver}</font>`,
                        wrapText: true,
                        button: {
                            text: "릴리즈 보기",
                            onClick: { openLink: { url: releaseUrl } },
                        },
                    },
                });
            });
        } else {
            sec.items.forEach((it) => widgets.push(...makeItemWidgets_(it)));
        }
    });

    // 2. 금주의 팝콘 픽
    if (topPicks && topPicks.length) {
        widgets.push({ divider: {} });
        widgets.push({
            decoratedText: {
                text: "<b>🌟 금주의 팝콘 픽 (기타 강추)</b>",
                wrapText: true,
            },
        });
        topPicks.forEach((it) => widgets.push(...makeItemWidgets_(it)));
    }

    // 3. 나머지 섹션
    const otherSections = sections.filter(
        (sec) =>
            sec.category.key !== "CORE_AI" &&
            sec.category.key !== "LIB_UPDATES",
    );
    otherSections.forEach((sec) => {
        widgets.push({ divider: {} });
        widgets.push({
            decoratedText: {
                text: `<b>${sec.category.label}</b>`,
                wrapText: true,
            },
        });
        sec.items.forEach((it) => widgets.push(...makeItemWidgets_(it)));
    });

    const payload = {
        cardsV2: [
            {
                cardId: "weeklyPopcornDigest",
                card: {
                    header: {
                        title: "🍿 이번 주 뭐볼까?",
                        subtitle: `${dateStr} · 월요병 극복 큐레이션`,
                        imageType: "CIRCLE",
                        imageUrl:
                            "https://fonts.gstatic.com/s/i/googlematerialicons/movie_filter/v15/24px.svg",
                    },
                    sections: [{ widgets }],
                },
            },
        ],
    };

    UrlFetchApp.fetch(webhookUrl, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
    });

    // ✨ 전송 성공 후 라이브러리 버전 저장 (다음 주에 중복 전송 방지)
    for (const sec of sections) {
        if (sec.category.key === "LIB_UPDATES") {
            sec.items.forEach((it) => {
                if (it._propKey && it._propValue) {
                    props.setProperty(it._propKey, it._propValue);
                }
            });
        }
    }
}

function makeItemWidgets_(it) {
    const dateStr = it.publishedAt
        ? Utilities.formatDate(it.publishedAt, "Asia/Seoul", "MM/dd")
        : "";
    const topLabel = `${it.sourceName}${dateStr ? " · " + dateStr : ""}`;
    const summaryFormatted = it.summary.replace(/\n/g, "<br/>");
    const summaryLine = summaryFormatted
        ? `<br/><font color="#808080">${summaryFormatted}</font>`
        : "";

    return [
        {
            decoratedText: {
                topLabel,
                text: `<b>${escapeHtml_(it.title)}</b>${summaryLine}`,
                wrapText: true,
            },
        },
        {
            buttonList: {
                buttons: [
                    {
                        text: "보러가기",
                        onClick: { openLink: { url: it.link } },
                    },
                ],
            },
        },
    ];
}

// ==================== 디버그 함수 ====================

/**
 * GAS 에디터에서 직접 실행해서 수집 현황을 확인하세요.
 * 실행 로그(Ctrl+Enter)에서 결과를 볼 수 있습니다.
 */
function debugDigest() {
    const allItems = collectItems_();
    const summary = {};

    for (const item of allItems) {
        const key = item.category?.label || "미분류";
        if (!summary[key]) summary[key] = [];
        summary[key].push(`[${item.sourceName}] ${item.title}`);
    }

    console.log("=== 총 수집 아이템 수:", allItems.length, "===\n");

    for (const [cat, items] of Object.entries(summary)) {
        console.log(`▶ ${cat} (${items.length}개)`);
        items.forEach((t) => console.log("  -", t));
        console.log("");
    }

    // ✨ 유튜브 필터링 진단 (수집 과정에서 기록된 로그 활용 — 피드 재요청 없음)
    const ytLog = YT_LOG;
    console.log("=== 📺 유튜브 필터링 진단 ===");
    if (ytLog.length === 0) {
        console.log("  (유튜브 채널 데이터 없음 — 피드 로드 실패 가능성)");
    }
    for (const ch of ytLog) {
        if (ch.failed) {
            console.log(
                `  ❌ [${ch.name}] 피드 로드 실패 (code: ${ch.code}) — 캐시도 없음`,
            );
        } else if (
            ch.fromCache &&
            ch.passed === 0 &&
            ch.blockedMust.length === 0
        ) {
            console.log(
                `  💾 [${ch.name}] 캐시 폴백 사용 중 (실시간 피드 실패)`,
            );
        } else {
            console.log(
                `  ✅ [${ch.name}] 통과: ${ch.passed}개 | MUST미충족: ${ch.blockedMust.length} | EXCLUDE차단: ${ch.blockedKw.length} | 날짜초과: ${ch.blockedDate} | Shorts: ${ch.shorts}${ch.fromCache ? " 💾캐시" : ""}`,
            );
            ch.blockedMust
                .slice(0, 3)
                .forEach((t) => console.log(`    ❌ MUST미충족: ${t}`));
            ch.blockedKw
                .slice(0, 3)
                .forEach((t) => console.log(`    ⛔ EXCLUDE/BLOCK차단: ${t}`));
        }
    }

    const libItems = allItems.filter((i) => i.category?.key === "LIB_UPDATES");
    console.log("\n=== 📦 라이브러리 아이템:", libItems.length, "개 ===");
    if (libItems.length === 0) {
        console.log("ℹ️ 이번 주 라이브러리 신규 릴리즈 없음");
    } else {
        libItems.forEach((it) =>
            console.log(
                `  - [${it.sourceName}] ${it.title} (score: ${it.score})`,
            ),
        );
    }

    const props = PropertiesService.getScriptProperties().getProperties();
    console.log("\n=== 📌 저장된 라이브러리 버전 캐시 ===");
    Object.entries(props)
        .filter(([k]) => k.startsWith("LIB_VER_"))
        .forEach(([k, v]) => console.log(`  ${k}: ${v}`));
}

/**
 * 라이브러리 버전 캐시 초기화 (강제로 다시 전송하고 싶을 때 실행)
 */
function resetLibVersionCache() {
    const props = PropertiesService.getScriptProperties();
    const all = props.getProperties();
    Object.keys(all)
        .filter((k) => k.startsWith("LIB_VER_"))
        .forEach((k) => props.deleteProperty(k));
    console.log("✅ 라이브러리 버전 캐시를 초기화했습니다.");
}

/**
 * 📌 현재 피드의 최신 버전을 캐시에 바로 저장
 * 처음 세팅 시 실행 → 이후 debugDigest()에서 라이브러리 0개로 나오면 정상
 * (새 버전이 나왔을 때만 다시 올라옴)
 */
function seedLibVersionCache() {
    const props = PropertiesService.getScriptProperties();
    const libSources = SOURCES.filter((s) => s.kind === "library");

    for (const source of libSources) {
        try {
            const xml = fetchAndSanitizeXml_(source.url, source.name);
            if (!xml) {
                console.log(`[${source.name}] 피드 가져오기 실패`);
                continue;
            }

            const parsed = parseFeed_(xml, source);
            if (!parsed.length) continue;

            const latestTitle = normalizeSpaces_(
                stripHtml_(parsed[0].title || ""),
            );
            const propKey = `LIB_VER_${source.name.replace(/\s/g, "_")}`;
            props.setProperty(propKey, latestTitle);
            console.log(`✅ [${source.name}] 캐시 저장: "${latestTitle}"`);
        } catch (e) {
            console.log(`[${source.name}] 오류: ${e}`);
        }
    }
    console.log(
        "\n📌 seedLibVersionCache 완료! 이제 debugDigest()를 다시 실행해보세요.",
    );
    console.log("   → 라이브러리 아이템이 0개로 나오면 정상입니다.");
}

// ==================== 공통 유틸 ====================

function fetchAndSanitizeXml_(url, sourceName) {
    const res = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        headers: { "User-Agent": SETTINGS.userAgent },
    });
    if (res.getResponseCode() >= 400) return null;
    let xml = res.getContentText();
    if (
        xml.toLowerCase().includes("<!doctype html>") ||
        xml.toLowerCase().startsWith("<html")
    )
        return null;
    xml = xml.replace(
        /&(?!(amp|apos|quot|lt|gt|#\d+|#x[0-9a-fA-F]+);)/g,
        "&amp;",
    );
    xml = xml.replace(
        /<content:encoded[\s\S]*?<\/content:encoded>/gi,
        "<content:encoded></content:encoded>",
    );
    return xml.replace(/<hr>/gi, "<hr/>").replace(/<br>/gi, "<br/>");
}

function parseFeed_(xml, source) {
    const doc = XmlService.parse(xml);
    const root = doc.getRootElement();
    const channel = root.getChild("channel");

    if (channel) {
        return channel.getChildren("item").map((item) => ({
            title: item.getChildText("title") || "",
            link: (item.getChildText("link") || "").trim(),
            summary:
                item.getChildText("description") ||
                item.getChildText("summary") ||
                "",
            publishedAt: parseDateSafe_(
                item.getChildText("pubDate") || item.getChildText("date"),
            ),
        }));
    }

    const ns = root.getNamespace();
    return (root.getChildren("entry", ns) || []).map((entry) => {
        let link = "";
        const links = entry.getChildren("link", ns) || [];
        for (const l of links) {
            if (
                l.getAttribute("href") &&
                (!l.getAttribute("rel") ||
                    l.getAttribute("rel").getValue() === "alternate")
            ) {
                link = l.getAttribute("href").getValue();
                break;
            }
        }
        if (!link && links.length)
            link = links[0].getAttribute("href").getValue();

        return {
            title: entry.getChildText("title", ns) || "",
            link: link,
            summary:
                entry.getChildText("summary", ns) ||
                entry.getChildText("content", ns) ||
                "",
            publishedAt: parseDateSafe_(
                entry.getChildText("published", ns) ||
                    entry.getChildText("updated", ns),
            ),
        };
    });
}

function summarizeRelease_(raw) {
    const cleaned = normalizeSpaces_(stripHtml_(raw || ""))
        .replace(/\(#\d+\)/g, "")
        .replace(/\b[0-9a-f]{7,40}\b/gi, "")
        .trim();
    const chunks = cleaned
        .split(/[\n•\-]\s+/)
        .map((x) => x.trim())
        .filter(Boolean);
    const picked = chunks.filter((x) =>
        /(security|bug|fix|crash|breaking|feature|new|add|improve)/i.test(x),
    );
    return (picked.length ? picked : chunks)
        .slice(0, 3)
        .map((x) => `- ${trimTo_(x, 80)}`)
        .join("\n");
}

function getWebhookUrl_() {
    return (
        PropertiesService.getScriptProperties().getProperty("WEBHOOK_URL") || ""
    );
}
function sendSimpleText_(url, text) {
    UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({ text }),
    });
}
function parseDateSafe_(s) {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}
function stripHtml_(s) {
    return String(s || "").replace(/<[^>]*>/g, " ");
}
function normalizeSpaces_(s) {
    return String(s || "")
        .replace(/\s+/g, " ")
        .trim();
}
function trimTo_(s, maxLen) {
    const str = String(s || "");
    return str.length <= maxLen
        ? str
        : str.slice(0, Math.max(0, maxLen - 1)) + "…";
}
function escapeHtml_(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
