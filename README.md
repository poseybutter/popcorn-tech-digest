# 🍿 IT TREND NEWS (퍼블팀 주간 큐레이션 봇)

Google Apps Script(GAS)와 Google Chat Webhook을 활용하여, 프론트엔드/퍼블리싱 팀에게 이번 주 읽어볼 만한 국내 기술 글을 골라 배달하는 **큐레이션 봇**입니다.

**매주 월요일 오후 1시**, 국내 139개 기술블로그(+선택한 추가 피드)에서 퍼블/AI 실무에 닿는 글만 엄선 5편을 Google Chat으로 전송합니다.

![Google Chat Card UI Example](https://img.shields.io/badge/Google_Chat-Cards_V2-blue?logo=googlechat)
![Language](<https://img.shields.io/badge/Language-JavaScript_(GAS)-yellow>)

---

## 변경 이력 (Changelog)

전체 변경 이력은 [CHANGELOG.md](./CHANGELOG.md)를 참고하세요.

---

## 기획 배경

-   **단일 고품질 소스로 단순화(v3.0):** 여러 RSS를 직접 긁고 방대한 차단 패턴으로 노이즈를 막던 구조를, 국내 139개 기술블로그를 집계하는 [TechBlogPosts](https://www.techblogposts.com/ko) 통합 피드 **하나**로 일원화했습니다. 유지보수 부담을 크게 줄이고 국내·한국어 콘텐츠 중심으로 전환했습니다.
-   매일 쏟아지는 국내 기술 블로그 글 속에서 **퍼블/프론트/AI 실무에 닿는 글만 가볍게** 골라 전달합니다.
-   **공유 문화 조성:** 나른한 월요일 오후 시간대를 타겟팅하여, 팀 내 기술 인사이트 공유를 활성화하고 업무 리프레시를 돕습니다.

---

## 핵심 기능

### 1. 단일 통합 소스 (TechBlogPosts)

국내 139개 기술블로그(토스·당근·무신사·네이버·카카오·쿠팡·우아한형제들 등)를 집계하는 [TechBlogPosts 통합 Atom 피드](https://www.techblogposts.com/rss.xml) **하나만** 구독합니다. 100% 한국어 콘텐츠라 번역이 필요 없고, 출처별 RSS를 직접 관리하던 부담이 사라졌습니다.

### 2. 6시간 누적 수집 (firehose 대응)

통합 피드는 **최신 10건**만 제공하므로, 주 1회 수집만으로는 대부분의 글을 놓칩니다. 이를 보완하기 위해 `dailyCollect()`가 **6시간마다** 피드를 읽어 링크 기준 중복을 제거하고 일자별 풀(`POOL_<날짜>`)에 누적합니다. 9일 지난 풀은 자동 정리됩니다.

### 3. 관련성 가중치 선별 (팀 스택 맞춤)

매주 월요일 `mainDigest()`가 최근 7일 누적 풀에서 점수순으로 **엄선 5건**을 발송합니다. 키워드를 3단계로 차등해 **팀이 실제로 쓰고 공부하는 주제**가 주로 올라오게 합니다. (대상 팀: HTML·CSS·SCSS·JS·jQuery 퍼블, 공공기관 유지보수)

-   **신선도:** 최신일수록 가점 (최대 +30)
-   **CORE (매치당 +25):** 퍼블 핵심 — HTML·CSS·SCSS·JS·jQuery, **인터랙션(GSAP·Swiper·애니메이션·스크롤)**, **웹접근성·웹표준(공공기관 필수)**, **KRDS·디자인시스템**, 레이아웃·성능
-   **AUX (매치당 +10):** 보조 — **AI 활용·트렌드·생산성, AI 보안 취약점**, **백엔드 인지(Java·Spring·PHP — 소통 비용 절감)**, **형상관리(Git·SVN)**
-   **NEG (매치당 −15):** 현재 불필요 — React·Vue·Svelte·Angular·Next.js 등 모던 SPA 프레임워크 (가라앉힘)
-   **하드 차단 없음:** 관련 글을 우선 노출하되, 부족하면 최신순으로 채워 빈손을 방지합니다.
-   가중치는 `SETTINGS.coreWeight`/`auxWeight`/`negWeight`, 키워드는 `CORE_KEYWORDS`/`AUX_KEYWORDS`/`NEG_KEYWORDS` 배열에서 조정합니다.

### 4. 소스 다양성 보장

한 출처가 독점하지 않도록 **출처당 최대 2건**으로 제한합니다.

### 5. 카드 구성 · 2줄 미리보기 · 한글 번역

각 항목은 **제목 · 출처 · 발행일 · 2줄 미리보기 · [보러가기] 버튼**으로 구성됩니다. 발송 직전 5건에만 다음을 적용합니다(가볍고 빠름).

-   **미리보기:** 피드가 제공하는 요약을 2줄로 표시. Medium 글(미리디 등 techblogposts)은 피드에 본문이 없어, **퍼블리케이션 피드(`medium.com/feed/<pub>`)에서 본문을 받아** 미리보기를 만듭니다(`enrichMediumBodies_`).
-   **본문 기반 React 감지:** 제목엔 안 드러나도 본문에 React 생태계 신호(react·useState·서버컴포넌트 등)가 있으면 NEG로 감점해 가라앉힙니다. (예: "DOM Reflow…60fps"는 React 글 → 하위로)
-   **한글 번역:** 영문 제목·미리보기는 `LanguageApp`으로 한국어 번역(이미 한국어면 그대로). 전체가 아닌 발송 5건만 번역해 비용이 적습니다.
-   **썸네일:** 큐레이션(인스타/Threads)에 이미지가 있으면 함께 노출.
-   **상단 고정 링크:** 카드 **맨 위**에 **Cursor · Claude · GSAP · Swiper** 체인지로그를 한 줄 인라인 링크로 노출(전사 AI 툴 + 핵심 인터랙션 라이브러리). `PINNED_LINKS`에서 수정합니다.

### 6. 소스 4타입

| 타입                 | 출처                                  | 처리 방식                                      |
| -------------------- | ------------------------------------- | ---------------------------------------------- |
| 메인                 | TechBlogPosts 통합 피드               | 소프트 가중치 (CORE/AUX 점수)                  |
| 신뢰 (`FRONTEND_FEEDS`, 내장) | CSS-Tricks·web.dev·Smashing·MDN | 관련성 게이트 면제 + **가점** (모든 글이 퍼블 관련) |
| 큐레이션 (`EXTRA_FEEDS`)      | 인스타/Threads 브릿지          | 게이트 면제 + **가점** · 썸네일 저장            |
| 전 분야 (`FIREHOSE_FEEDS`)    | GeekNews 등                    | 가점 없음 · **관련성 키워드 통과분만 저장**     |

`EXTRA_FEEDS`·`FIREHOSE_FEEDS`는 Script Properties에 URL을 줄바꿈/쉼표로 구분해 넣습니다. 모든 타입에 공통으로 월페이퍼·만우절·컨퍼런스 홍보 등 잡글은 `EXCLUDE_TITLE_RE`로 제외됩니다.

> **인스타그램/Threads 등 RSS가 없는 소스**는 [RSS.app](https://rss.app/) 같은 브릿지로 RSS를 만든 뒤 그 URL을 `EXTRA_FEEDS`에 넣으세요. (RSSHub 공개 인스턴스는 Threads 라우트가 403으로 막혀 권장하지 않음)
> - **인스타그램**: 로그인 벽으로 직접 수집 불가 + 카드뉴스형은 썸네일·캡션·링크만 들어옴(이미지 속 글자는 못 읽음).
> - **Threads**: 공개 프로필이라 더 안정적이고, 본문이 텍스트라 캡션이 온전히 들어옴. 같은 계정이면 **Threads 권장**.
> - **GeekNews**: `https://news.hada.io/rss/news` (Atom). 전 분야라 `FIREHOSE_FEEDS`에 넣어 노이즈를 거릅니다.

### 7. 썸네일 이미지

피드 항목에 이미지(`enclosure`/`media:content`/`media:thumbnail`)가 있으면 Google Chat 카드에 썸네일을 함께 노출합니다. (카드뉴스 훑어보기에 유용. 없으면 텍스트만)

### 8. 철저한 보안 관리

Webhook URL을 하드코딩하지 않고, GAS의 `Script Properties` 환경 변수를 사용하여 외부 노출을 차단합니다.

---

## 수집 소스 (Sources)

| 소스                        | 종류            | 비고                                      |
| --------------------------- | --------------- | ----------------------------------------- |
| TechBlogPosts 통합 피드     | Atom (RSS)      | 국내 139개 기술블로그 집계, 한국어 (메인)        |
| 퍼블 전문 블로그 (내장)     | RSS             | CSS-Tricks·web.dev·Smashing·MDN (영문, 게이트 면제) |
| EXTRA_FEEDS (선택)          | RSS / Atom      | 큐레이션 추가 피드 (인스타/Threads 브릿지)       |
| FIREHOSE_FEEDS (선택)       | RSS / Atom      | 전 분야 피드, 관련성 필터 (GeekNews 등)          |

> 메인 피드: `https://www.techblogposts.com/rss.xml` · 퍼블 전문 블로그는 코드의 `FRONTEND_FEEDS`에서 추가·수정

---

## 동작 흐름

| 함수             | 트리거            | 설명                                                  |
| ---------------- | ----------------- | ----------------------------------------------------- |
| `dailyCollect()` | 6시간마다         | 피드(최신 10건)를 누적 풀에 저장, 오래된 풀 정리       |
| `mainDigest()`   | 매주 월요일 13시  | 최근 7일 풀에서 점수순 엄선 5건 발송                   |
| `setupTriggers()`| 최초 1회 수동     | 위 두 트리거를 자동 생성                               |

---

## 사용 기술 (Tech Stack)

-   **Language:** JavaScript (Google Apps Script)
-   **API/Integration:** Google Chat Webhook API (Cards V2), PropertiesService, ScriptApp(Triggers)
-   **Data Processing:** Atom Feed Parsing (XmlService), 일자별 누적 풀 관리

---

## 설치 및 세팅 방법 (Installation)

1. [Google Apps Script](https://script.google.com/)에 접속하여 새 프로젝트를 생성합니다.
2. 본 저장소의 `chatbot.gs` 코드를 복사하여 에디터에 붙여넣습니다.
3. 알림을 받을 Google Chat 스페이스에서 **[웹후크 관리]**를 통해 URL을 발급받습니다.
4. GAS 에디터 좌측 톱니바퀴(프로젝트 설정) > **[스크립트 속성]**에 추가합니다.
    - **속성:** `WEBHOOK_URL` / **값:** 발급받은 웹후크 주소 (필수)
    - **속성:** `EXTRA_FEEDS` / **값:** 큐레이션 피드 URL — 인스타/Threads 브릿지 (줄바꿈·쉼표 구분, 선택)
    - **속성:** `FIREHOSE_FEEDS` / **값:** 전 분야 피드 URL — 예: `https://news.hada.io/rss/news` (선택)
5. **최초 1회** `setupTriggers()` 함수를 수동 실행합니다.
    - `dailyCollect`(6시간마다) + `mainDigest`(월요일 13시) 트리거가 자동 생성됩니다.
    - 며칠간 풀이 쌓인 뒤 첫 발송이 가장 풍성합니다. 바로 테스트하려면 `dailyCollect()`를 몇 번 수동 실행한 뒤 `debugDigest()`로 확인하세요.

### 디버그 & 유지보수 함수

| 함수              | 설명                                              |
| ----------------- | ------------------------------------------------- |
| `dailyCollect()`  | 피드 수집 수동 실행 (테스트용)                    |
| `debugDigest()`   | 누적 풀 현황 + 이번 주 선별 5건 미리보기 로그     |
| `mainDigest()`    | 발송 수동 실행                                     |
| `resetPool()`     | 누적 풀 전체 초기화                               |
| `setupTriggers()` | 트리거 생성 / `clearTriggers()` 트리거 제거       |

---

## 기여하기 (Contributing)

팀원 여러분이 새로운 RSS 피드 추가, 키워드 수정, 기능 개선 등 다양한 아이디어를 직접 반영할 수 있도록 Fork & PR 방식으로 협업합니다.

#### 1. Fork 및 Clone

```bash
# 1. GitHub에서 프로젝트를 Fork (웹 상단의 Fork 버튼 클릭)

# 2. Fork한 저장소를 로컬에 Clone
git clone https://github.com/YOUR_GITHUB_USERNAME/popcorn-tech-digest.git
cd popcorn-tech-digest
```

#### 2. Upstream 저장소 설정

```bash
# 원본 저장소를 upstream으로 추가
git remote add upstream https://github.com/OWNER_GITHUB_USERNAME/popcorn-tech-digest.git

# remote 저장소 확인 (origin → 내 Fork, upstream → 원본)
git remote -v
```

#### 3. 브랜치 생성 및 작업

```bash
# main 브랜치에서 새 브랜치 생성 (본인 이름 사용)
git checkout -b feature/YOUR_NAME
```

> 브랜치명은 `feature/이름` 형식으로 통일해 주세요.

#### 4. 변경사항 Commit

```bash
git add .
git commit -m "feat: 노마드코더 RSS 피드 추가"
```

**Commit 메시지 컨벤션**

| 태그       | 설명                                   |
| ---------- | -------------------------------------- |
| `feat`     | 새로운 기능 추가 (RSS 피드, 키워드 등) |
| `fix`      | 버그 수정                              |
| `refactor` | 코드 리팩토링                          |
| `docs`     | README 등 문서 수정                    |
| `chore`    | 기타 수정                              |

#### 5. Upstream 동기화 후 Push

```bash
# PR 전 원본 저장소 최신화 필수
git fetch upstream
git merge upstream/main

# 본인 Fork에 Push
git push origin feature/YOUR_NAME
```

#### 6. Pull Request 생성

GitHub에서 Fork 저장소로 이동 후 **"Compare & pull request"** 버튼을 클릭합니다.

**PR 작성 예시**

```
제목: feat: 토스/당근테크 유튜브 채널 추가

본문:
## 변경 내용
- 토스 유튜브 채널 추가 (UCeg5g-vWgtgzQ0cYNV2Cyow)
- 당근테크 유튜브 채널 추가 (UC8tsBsQBuF7QybxgLmStihA)

## 변경 이유
유튜브 소스 다양성 강화
```

> PR을 보내주시면 검토 후 머지하겠습니다. 언제든지 아이디어와 개선사항을 공유해 주세요! 📬
