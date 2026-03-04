/**
 * 🍿 퍼블팀 주간 뉴스레터 봇 (VVIP 카테고리 고정형)
 * - 라이브러리(Swiper 등) 및 핵심 AI(Cursor, Gemini) 별도 카테고리 고정
 * - 구글 챗 400 에러 방지 (유튜브 라이브 스트리밍, 빈 링크 차단)
 */

const SETTINGS = {
  maxItemsPerSource: 12,        
  maxSendPerCategory: 3,        
  lookbackDays: 30,             
  maxPerSourceInDigest: 2,      

  summaryMaxLen: 120,
  titleMaxLen: 80,

  youtubeMustKeywords: [
    "css", "scss", "sass", "html", "접근성", "a11y", "퍼블", "퍼블리싱", "웹", "프론트", "ui", "ux", 
    "gsap", "swiper", "jquery", "devtools", "성능", "cursor", "claude", "gemini", "figma", "notion",
    "자동화", "n8n", "zapier", "make", "ai", "llm", "langchain", "에이전트", "agent"
  ],
  // 🚫 에러의 주범인 '스트리밍 중', '라이브' 추가 차단!
  youtubeBlockKeywords: [
    "주식", "매매", "코인", "게임", "먹방", "asmr", "브이로그", "shorts", "일상", "여행", "개그", "예능", "스트리밍 중", "라이브"
  ],
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0 Safari/537.36"
};

const EXCLUDE_KEYWORDS = ["국방부", "해커톤", "부스", "mwc", "ces", "채용", "주총", "사고", "사건"];

const SOURCES = [
  // 🤖 AI & 공식 블로그
  { name: "Cursor Blog", url: "https://cursor.sh/atom.xml", icon: "https://cursor.sh/favicon.ico", kind: "atom_ai" },
  { name: "Google AI (Gemini)", url: "http://feeds.feedburner.com/GoogleAiBlog", icon: "https://www.google.com/favicon.ico", kind: "rss_ai" },
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml", icon: "https://openai.com/favicon.ico", kind: "rss_ai" },
  
  // 📺 유튜브 
  { name: "윤자동 (업무자동화)", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCYg51KBo-UcA4QILcYl5LEw", icon: "https://www.youtube.com/favicon.ico", kind: "youtube" },
  { name: "시민개발자 구씨", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC8r0_U2G1W_6PGEB-l4L7eA", icon: "https://www.youtube.com/favicon.ico", kind: "youtube" }, // 임시 ID, 실제 ID로 변경 필요
  { name: "노마드코더", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCUpJs89fSBXNolQGOYKn0YQ", icon: "https://www.youtube.com/favicon.ico", kind: "youtube" },
  { name: "조코딩", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCQNE2JmbasNYbjGAcuBiRRg", icon: "https://www.youtube.com/favicon.ico", kind: "youtube" },
  { name: "코딩애플", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCSLrpBAzr-ROVGHQ5EmxnUg", icon: "https://www.youtube.com/favicon.ico", kind: "youtube" },
  { name: "드림코딩", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC_4u-bXaba7yrRz_6x6kb_w", icon: "https://www.youtube.com/favicon.ico", kind: "youtube" },
  { name: "1분코딩", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC2nAWCKpk_RkEEl2h2G3A8Q", icon: "https://www.youtube.com/favicon.ico", kind: "youtube" },
  { name: "우아한테크", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC-mOekGSesms0agFntnQang", icon: "woowahan.com/favicon.ico", kind: "youtube" },
  
  // 📰 국내/해외 블로그 
  { name: "무신사 기술블로그", url: "https://techblog.musinsa.com/feed/", icon: "https://techblog.musinsa.com/favicon.ico", kind: "rss" },
  { name: "29CM 기술블로그", url: "https://medium.com/feed/29cm", icon: "https://www.29cm.co.kr/favicon.ico", kind: "rss" },
  { name: "토스 테크", url: "https://toss.tech/rss.xml", icon: "https://toss.im/favicon.ico", kind: "rss" },
  { name: "당근 테크", url: "https://medium.com/feed/daangn", icon: "https://www.daangn.com/favicon.ico", kind: "rss" },
  { name: "GeekNews", url: "https://news.hada.io/rss/news", icon: "https://news.hada.io/favicon.ico", kind: "rss" },
  
  // 📦 필수 라이브러리 릴리즈
  { name: "Sass(SCSS) 공식", url: "https://sass-lang.com/feed.xml", icon: "https://sass-lang.com/favicon.ico", kind: "library" }, 
  { name: "jQuery Releases", url: "https://github.com/jquery/jquery/releases.atom", icon: "https://jquery.com/favicon.ico", kind: "library" }, 
  { name: "GSAP Releases", url: "https://github.com/greensock/GSAP/releases.atom", icon: "https://gsap.com/favicon.ico", kind: "library" },
  { name: "Swiper Releases", url: "https://github.com/nolimits4web/swiper/releases.atom", icon: "https://swiperjs.com/favicon.ico", kind: "library" }
];

// ✨ 카테고리 고정 (순서대로 출력됩니다)
const CATEGORIES = [
  { key: "CORE_AI", label: "🤖 전사 도입 AI 필수 업데이트 (Cursor/Gemini)", keywords: [] }, // VVIP 전용석
  { key: "LIB_UPDATES", label: "📦 필수 라이브러리 릴리즈", keywords: [] }, // VVIP 전용석
  { key: "TOP_PICKS", label: "🌟 금주의 팝콘 픽 (기타 강추)", keywords: [] }, 
  { key: "PUBLISHING", label: "✨ UI/UX 퍼블리싱 & 인터랙션", keywords: ["scss", "sass", "css", "html", "인터랙션", "마크업", "figma", "피그마", "접근성", "a11y", "애니메이션"] },
  { key: "GENERAL", label: "🏢 IT 업계 실무 & 자동화 꿀팁", keywords: ["프론트엔드", "최적화", "javascript", "js", "생산성", "협업", "자동화", "n8n", "make"] },
  { key: "YOUTUBE", label: "📺 주말에 몰아보는 코딩 유튜브", keywords: [] }
];

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
  
  // VVIP 제외하고 나머지 중에 Top 3 뽑기
  for (const it of sorted) {
    if (it.category.key === "CORE_AI" || it.category.key === "LIB_UPDATES") continue;
    
    if (topPicks.length >= 3) break;
    if (!sourceCount[it.sourceName]) {
      topPicks.push(it);
      sourceCount[it.sourceName] = 1;
    }
  }

  const topPickLinks = new Set(topPicks.map(x => x.link));
  const groupedSections = [];

  for (const cat of CATEGORIES) {
    if (cat.key === "TOP_PICKS") continue; // 위에서 따로 처리함
    
    const pool = sorted.filter(it => it.category.key === cat.key && !topPickLinks.has(it.link));
    const chosen = [];
    
    for (const it of pool) {
      if (chosen.length >= SETTINGS.maxSendPerCategory) break;
      
      // VVIP 카테고리(AI, 라이브러리)는 출처 독점 제한을 두지 않고 업데이트 된 건 다 보여줍니다.
      if (cat.key !== "CORE_AI" && cat.key !== "LIB_UPDATES") {
        const cnt = sourceCount[it.sourceName] || 0;
        if (cnt >= SETTINGS.maxPerSourceInDigest) continue;
        sourceCount[it.sourceName] = cnt + 1;
      }
      chosen.push(it);
    }
    if (chosen.length) groupedSections.push({ category: cat, items: chosen });
  }

  sendPopcornCard_(webhookUrl, topPicks, groupedSections);
}

function collectItems_() {
  const items = [];
  const now = new Date();

  for (const source of SOURCES) {
    try {
      const xml = fetchAndSanitizeXml_(source.url, source.name);
      if (!xml) continue;

      const parsed = parseFeed_(xml, source);

      for (const entry of parsed.slice(0, SETTINGS.maxItemsPerSource)) {
        // ✨ 안전장치: 링크가 비어있거나 올바른 URL이 아니면 에러 방지를 위해 스킵!
        if (!entry.link || !entry.link.startsWith("http")) continue; 
        if (!entry.title) continue;
        if (entry.publishedAt && (now - entry.publishedAt) > SETTINGS.lookbackDays * 24 * 60 * 60 * 1000) continue;

        const cleanTitle = normalizeSpaces_(stripHtml_(entry.title));
        const lowerTitle = cleanTitle.toLowerCase();

        if (EXCLUDE_KEYWORDS.some(kw => lowerTitle.includes(kw))) continue;

        if (source.kind === "youtube") {
          if (entry.link.includes("/shorts/")) continue;
          const must = SETTINGS.youtubeMustKeywords.some(k => lowerTitle.includes(k));
          if (!must) continue;
          const blocked = SETTINGS.youtubeBlockKeywords.some(k => lowerTitle.includes(k));
          if (blocked) continue;
        }

        let summaryText = "";
        const isRelease = source.kind === "library" || source.kind === "atom_ai" || source.name.includes("Cursor") || source.name.includes("AI");
        
        if (isRelease) {
          summaryText = summarizeRelease_(entry.summary);
          if (summaryText.length > 5) {
            try { summaryText = LanguageApp.translate(summaryText, "en", "ko"); } catch(e) {}
          }
        } else {
          summaryText = trimTo_(stripHtml_(entry.summary), SETTINGS.summaryMaxLen);
        }

        const item = {
          title: trimTo_(cleanTitle, SETTINGS.titleMaxLen),
          link: entry.link,
          summary: summaryText,
          sourceName: source.name,
          sourceKind: source.kind,
          publishedAt: entry.publishedAt,
          category: null,
          score: 0
        };

        item.category = classifyCategory_(item, source);
        if (item.category) {
          item.score = scoreItem_(item, source);
          items.push(item);
        }
      }
    } catch (e) { console.log(`[${source.name}] 오류: ${e}`); }
  }
  return items;
}

// ✨ 분류 로직 완벽 분리
function classifyCategory_(item, source) {
  const text = (item.title + " " + item.summary + " " + item.link).toLowerCase();
  
  // 1. Cursor, Gemini 등의 핵심 AI는 무조건 CORE_AI 석으로!
  if (text.includes("cursor") || text.includes("gemini") || source.kind === "atom_ai" || source.kind === "rss_ai") {
    return CATEGORIES.find(c => c.key === "CORE_AI");
  }
  // 2. 라이브러리 공식 소스는 무조건 LIB_UPDATES 석으로!
  if (source.kind === "library" || source.name.includes("Sass")) {
    return CATEGORIES.find(c => c.key === "LIB_UPDATES");
  }
  // 3. 유튜브
  if (source.kind === "youtube") return CATEGORIES.find(c => c.key === "YOUTUBE");
  
  // 4. 나머지 분류
  for (const cat of CATEGORIES) {
    if (cat.key !== "TOP_PICKS" && cat.key !== "CORE_AI" && cat.key !== "LIB_UPDATES" && cat.keywords && cat.keywords.some(k => text.includes(k))) return cat;
  }
  return CATEGORIES.find(c => c.key === "GENERAL");
}

function scoreItem_(item, source) {
  let score = 0;
  const text = (item.title + " " + item.summary + " " + item.link).toLowerCase();

  // VVIP 소스 기본 점수 (자기들끼리 정렬용)
  if (item.category && (item.category.key === "CORE_AI" || item.category.key === "LIB_UPDATES")) score += 100;
  
  if (source.kind === "youtube") score += 20;
  if (/(scss|sass|figma|n8n|make|자동화|접근성)/i.test(text)) score += 30;

  return score + Math.floor(Math.random() * 5);
}

// -------------------- Data Processing --------------------
function fetchAndSanitizeXml_(url, sourceName) {
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { "User-Agent": SETTINGS.userAgent } });
  if (res.getResponseCode() >= 400) return null;
  let xml = res.getContentText();
  if (xml.toLowerCase().includes("<!doctype html>") || xml.toLowerCase().startsWith("<html")) return null;
  xml = xml.replace(/&(?!(amp|apos|quot|lt|gt|#\d+|#x[0-9a-fA-F]+);)/g, "&amp;");
  xml = xml.replace(/<content:encoded[\s\S]*?<\/content:encoded>/gi, "<content:encoded></content:encoded>");
  return xml.replace(/<hr>/gi, "<hr/>").replace(/<br>/gi, "<br/>");
}

function parseFeed_(xml, source) {
  const doc = XmlService.parse(xml);
  const root = doc.getRootElement();
  const channel = root.getChild("channel");
  
  if (channel) {
    return channel.getChildren("item").map(item => ({
      title: item.getChildText("title") || "",
      link: (item.getChildText("link") || "").trim(),
      summary: item.getChildText("description") || item.getChildText("summary") || "",
      publishedAt: parseDateSafe_(item.getChildText("pubDate") || item.getChildText("date"))
    }));
  }

  const ns = root.getNamespace();
  return (root.getChildren("entry", ns) || []).map(entry => {
    let link = "";
    const links = entry.getChildren("link", ns) || [];
    for (const l of links) {
      if (l.getAttribute("href") && (!l.getAttribute("rel") || l.getAttribute("rel").getValue() === "alternate")) {
        link = l.getAttribute("href").getValue(); break;
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
  const cleaned = normalizeSpaces_(stripHtml_(raw || "")).replace(/\(#\d+\)/g, "").replace(/\b[0-9a-f]{7,40}\b/gi, "").trim();
  const chunks = cleaned.split(/[\n•\-]\s+/).map(x => x.trim()).filter(Boolean);
  const picked = chunks.filter(x => /(security|bug|fix|crash|breaking|feature|new|add|improve)/i.test(x));
  return (picked.length ? picked : chunks).slice(0, 3).map(x => `- ${trimTo_(x, 80)}`).join("\n");
}

// -------------------- UI & Utils --------------------
function sendPopcornCard_(webhookUrl, topPicks, sections) {
  const dateStr = Utilities.formatDate(new Date(), "Asia/Seoul", "MM/dd");
  const widgets = [];

  // 🍿 멘트 수정: 월요일 오후 1시 감성 듬뿍 추가!
  widgets.push({ 
    decoratedText: { 
      text: "<b>☕ 나른한 월요일 오후, 팝콘처럼 톡톡 튀는 IT 소식!</b><br/><font color=\"#5f6368\">월요병을 이겨낼 우리 팀 필수 스택 업데이트를 정리해 왔어요.</font>", 
      wrapText: true 
    } 
  });

  // 1. 핵심 AI와 라이브러리 섹션 (VVIP를 최상단에 강제 배치)
  const coreSections = sections.filter(sec => sec.category.key === "CORE_AI" || sec.category.key === "LIB_UPDATES");
  coreSections.forEach(sec => {
    widgets.push({ divider: {} });
    widgets.push({ decoratedText: { text: `<b>${sec.category.label}</b>`, wrapText: true } });
    sec.items.forEach(it => widgets.push(...makeItemWidgets_(it)));
  });

  // 2. 금주의 팝콘 픽
  if (topPicks && topPicks.length) {
    widgets.push({ divider: {} });
    widgets.push({ decoratedText: { text: "<b>🌟 금주의 팝콘 픽 (기타 강추)</b>", wrapText: true } });
    topPicks.forEach(it => widgets.push(...makeItemWidgets_(it)));
  }

  // 3. 나머지 섹션 배치
  const otherSections = sections.filter(sec => sec.category.key !== "CORE_AI" && sec.category.key !== "LIB_UPDATES");
  otherSections.forEach(sec => {
    widgets.push({ divider: {} });
    widgets.push({ decoratedText: { text: `<b>${sec.category.label}</b>`, wrapText: true } });
    sec.items.forEach(it => widgets.push(...makeItemWidgets_(it)));
  });

  const payload = {
    cardsV2: [{
      cardId: "weeklyPopcornDigest",
      card: {
        header: { 
          title: "🍿 이번 주 뭐볼까?", 
          // 🍿 멘트 수정: 월요병 극복 큐레이션
          subtitle: `${dateStr} · 월요병 극복 큐레이션`, 
          imageType: "CIRCLE", 
          imageUrl: "https://fonts.gstatic.com/s/i/googlematerialicons/movie_filter/v15/24px.svg" 
        },
        sections: [{ widgets }]
      }
    }]
  };
  UrlFetchApp.fetch(webhookUrl, { method: "post", contentType: "application/json", payload: JSON.stringify(payload) });
}

function makeItemWidgets_(it) {
  const dateStr = it.publishedAt ? Utilities.formatDate(it.publishedAt, "Asia/Seoul", "MM/dd") : "";
  const topLabel = `${it.sourceName}${dateStr ? " · " + dateStr : ""}`;
  
  const summaryFormatted = it.summary.replace(/\n/g, "<br/>");
  const summaryLine = summaryFormatted ? `<br/><font color="#808080">${summaryFormatted}</font>` : "";

  return [
    { decoratedText: { topLabel, text: `<b>${escapeHtml_(it.title)}</b>${summaryLine}`, wrapText: true } },
    { buttonList: { buttons: [{ text: "보러가기", onClick: { openLink: { url: it.link } } }] } }
  ];
}

function getWebhookUrl_() { return PropertiesService.getScriptProperties().getProperty("WEBHOOK_URL") || ""; }
function sendSimpleText_(url, text) { UrlFetchApp.fetch(url, { method: "post", contentType: "application/json", payload: JSON.stringify({ text }) }); }
function parseDateSafe_(s) { if (!s) return null; const d = new Date(s); return isNaN(d.getTime()) ? null : d; }
function stripHtml_(s) { return String(s || "").replace(/<[^>]*>/g, " "); }
function normalizeSpaces_(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
function trimTo_(s, maxLen) { const str = String(s || ""); return str.length <= maxLen ? str : str.slice(0, Math.max(0, maxLen - 1)) + "…"; }
function escapeHtml_(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
