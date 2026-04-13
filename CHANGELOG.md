# Changelog

## v2.8 (2026-04-13)

-   **소스 교체:** GeekNews → 요즘IT(`yozm.wishket.com`) 교체
-   **소스 추가:** Claude Code Changelog (anthropics/claude-code GitHub Releases Atom 피드)
-   **소스 제거:** Anthropic News / Anthropic Engineering (서드파티 피드 불안정으로 제거)
-   **CORE_AI 타이틀 변경:** "전사 도입 AI 필수 업데이트" → "전사 AI 툴 업데이트 소식"
-   **라이브러리 안내 문구 수정:** "현재 사용 중인 안정 버전" → "이번 주 새 릴리즈 없음 — 최신 버전이에요"
-   **CORE_AI_ALLOW_KEYWORDS 추가:** `anthropic`, `constitutional ai`, `responsible ai`, `ai safety`, `claude 3/4`, `claude opus/sonnet/haiku`, `sonnet`, `haiku`, `opus`
-   **CORE_AI_BLOCK_PATTERNS 추가:** OpenAI 팀별 가이드 글(`for marketing/sales/operations teams`), 마케팅성 제목 패턴(`chatgpt for`, `using skills`, `prompting fundamentals` 등) 차단
-   **HuggingFace 블로그 요약 폴백 처리:** `summarizeRelease_` 결과가 빈 경우 일반 번역으로 자동 폴백
-   **Claude Code Changelog lookbackDays 7일 제한:** 주간 단위 최신 릴리즈만 수집하도록 소스별 lookback 설정
-   **소스별 lookbackDays 옵션 추가:** SOURCES 배열에 `lookbackDays` 필드 추가 — 소스마다 개별 수집 기간 지정 가능

## v2.7 (2026-04-06)

-   **CORE_AI 섹션 제목 수정:** `Cursor/Gemini` → `Cursor · Gemini · ChatGPT`
-   **CORE_AI allowlist 보완:** `codex` 키워드 추가
-   **CORE_AI 차단 패턴 추가:** 금융 서비스 홍보글, 철학적 방향성 에세이 차단
-   **PUBLISHING 소스 재편:** Smashing Magazine을 강제 분류에서 제외 → 키워드 필터링으로 전환
-   **PUBLISHING 키워드 재편:** 디자이너용 키워드 제거 (`design system`, `ux`, `typography` 등), 퍼블팀 실무 CSS 키워드 추가 (`clip-path`, `view transition`, `container query`, `lighthouse` 등)
-   **PUBLISHING_BLOCK_PATTERNS 신설:** 디자인 원칙 글, 만우절 글, UX 리서치 글, 게임/3D 실험 글 차단
-   **국내 블로그 차단 패턴 추가:** 직무 개편 글, Rust/HWP 파서, OS 비교, GUI 역사 에세이 차단
-   **유튜브 blockKeywords 추가:** `자영업`, `마케팅`, `병의원`, `crm`, `채용합니다`, `취업`
-   **유튜브 캐시 만료 기간 확장:** 6일 → 13일 (IP 차단 대응)
-   **윤자동 채널 소스에서 제거:** 자영업/마케팅 중심 채널로 퍼블팀 관련성 낮음
-   **신규 소스 추가:** CSS Weekly, Frontend Focus, NAVER D2
-   **CSS Weekly/Frontend Focus 필터링:** CSS 무관 글 차단 (allowlist 방식 적용)

## v2.6 (2026-03-30)

-   **유튜브 신뢰채널 개념 제거:** 모든 채널에 동일한 mustKeyword 체크 적용 — 낚시성/무관 제목 자동 차단

## v2.5 (2026-03-30)

-   **Cursor Blog 요약 방식 수정:** Changelog는 릴리즈 노트 파싱(`summarizeRelease_`), Blog 포스트는 일반 번역으로 분리 — 요약 내용 혼입 버그 수정

## v2.4 (2026-03-30)

-   **프리미엄 퍼블 소스 강제 분류:** CSS-Tricks, web.dev, Smashing Magazine, MDN Blog → 항상 PUBLISHING 섹션으로 분류 (GENERAL 오분류 방지)
-   **유튜브 홍보성 영상 차단 강화:** `부트캠프`, `사전설명회`, `tmux` 등 차단 키워드 추가
-   **긱뉴스/국내 블로그 노이즈 차단:** SaaS 과금 모델, 비즈니스 에세이 등 퍼블팀 무관 글 패턴 추가

## v2.3 (2026-03-30)

-   **CORE_AI allowlist 방식 도입:** `rss_ai` 소스라도 Cursor/Gemini/Claude 등 실무 키워드가 없으면 드롭 — HuggingFace 논문·모델 글, Google 연구 에세이 등 오노출 방지
-   **날짜 없는 글 제외:** `publishedAt` 파싱 불가 글 자동 제외 (Google for Developers 등)
-   **국내 블로그 공통 차단 패턴 도입:** 기존 긱뉴스 전용이던 필터를 무신사/토스/당근 등 전체 국내 블로그로 확장 — 보안·취약점·블록체인·ML 연구 등 차단
-   **유튜브 lookback 14일로 확장:** 업로드 주기가 느린 채널 대응
-   **유튜브 mustKeywords 한국어 패턴 보강:** `만들기`, `구현`, `따라하기`, `코딩`, `개발`, `빌드` 등 추가

## v2.2 (2026-03-30)

-   **CORE_AI 차단 패턴 강화:** 기업 홍보성 케이스 스터디, 회사명+동사 패턴, HuggingFace 모델/임베딩 글 차단 패턴 확장
-   **라이브러리 최신 1개만 표시:** 기존 최대 3개 → 소스당 최신 1개만 수집
-   **유튜브 광고·홍보 영상 차단:** `솔라피`, `광고`, `협찬`, `무료특강` 등 차단 키워드 추가
-   **GENERAL 관련성 필터:** 퍼블팀 관련 키워드 없는 글은 GENERAL 섹션에서 제외
-   **DOMESTIC_SOURCES 필터 신설:** 긱뉴스 전용이던 차단 패턴을 국내 블로그 전체로 적용 준비

## v2.1 (2026-03-13)

-   **라이브러리 캐싱 로직 재설계:** 소스별 "최신 글 제목"을 캐싱하여 변경 시에만 통과하도록 개선
-   **PUBLISHING 카테고리 영어 CSS 키워드 보강:** `popover`, `grid`, `flexbox` 등 추가
-   **CORE_AI 기업 홍보성 케이스 스터디 필터링 추가**

## v2.0 (2026-03-13)

-   **Cursor 이중 피드 수집:** 공식 RSS(`cursor.com/rss.xml`)가 간헐적으로 비활성화되는 문제를 보완하기 위해 비공식 미러 피드를 추가로 수집. 제목 기반 중복 제거 적용
-   **Cursor 우선 노출:** Cursor Blog/Changelog에 +40 보너스 점수 부여
-   **CORE_AI 소스 다양성 개선:** 소스당 최대 노출 2개 → 1개로 축소, 최대 전송 수 3개 → 5개로 확대
-   **수집 기간 단축:** 일반 글 lookback 30일 → 7일 (라이브러리는 30일 유지)
-   **한국어 자동 번역 범위 확대:** 릴리즈 노트에만 적용되던 번역을 모든 RSS 글로 확대
-   **라이브러리 [릴리즈 보기] 버튼:** 신규 릴리즈 없는 주에도 각 라이브러리별 릴리즈 페이지 바로가기 버튼 제공
-   **유튜브 채널 정비:** 코딩애플·드림코딩·1분코딩 제거 / 개발동생·토스·당근테크 추가 (총 8개)
-   **유튜브 MUST 키워드 보강:** `바이브코딩`, `클로드코드`, `claude code`, `replit` 추가
-   **CORE_AI 분류 기준 변경:** 소스명/도메인 기반으로 변경 → "CSS cursor 속성" 오분류 방지
-   **Top Picks 점수 개선:** 랜덤 제거 → 최신성 + 키워드 가중치 기반으로 변경
-   **RSS 소스 추가:** CSS-Tricks, web.dev, Smashing Magazine, MDN Blog
