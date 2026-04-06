# 🍿 Popcorn Tech Digest Bot (퍼블팀 주간 큐레이션 봇)

Google Apps Script(GAS)와 Google Chat Webhook을 활용하여, 프론트엔드/퍼블리싱 팀에게 꼭 필요한 IT 기술 트렌드와 업데이트 소식을 배달해 주는 **스마트 큐레이션 봇**입니다.

직장인이 가장 피곤함을 느끼는 **매주 월요일 오후 1시**, 식곤증과 월요병을 날려버릴 수 있도록 "퇴근길에 팝콘 먹듯 가볍고 재밌게" 소비할 수 있는 알짜배기 정보만 큐레이션하여 전송합니다.

![Google Chat Card UI Example](https://img.shields.io/badge/Google_Chat-Cards_V2-blue?logo=googlechat)
![Language](<https://img.shields.io/badge/Language-JavaScript_(GAS)-yellow>)

---

## 변경 이력 (Changelog)

전체 변경 이력은 [CHANGELOG.md](./CHANGELOG.md)를 참고하세요.

---

## 기획 배경

-   **고객 선제적 서비스(Before Service):** 최신 기술 트렌드와 라이브러리 업데이트를 상시 모니터링하여, 고객의 요구가 있기 전 선제적으로 기술적 제안과 최적의 솔루션을 제공하기 위함입니다.
-   매일 쏟아지는 기술 블로그와 유튜브 영상 속에서 **실무에 진짜 필요한 정보만 필터링**할 필요성 대두.
-   전사적으로 적극 활용 중인 필수 스택(`Cursor`, `Gemini`, `Swiper`, `GSAP` 등)의 업데이트 소식을 팀원 모두가 빠르게 파악하고 프로젝트 품질과 생산성을 유지합니다.
-   **공유 문화 조성:** 나른한 월요일 오후 시간대를 타겟팅하여, 팀 내 기술 인사이트 공유를 활성화하고 업무 리프레시를 돕습니다.

---

## 핵심 기능

### 1. VVIP 카테고리 고정 - 우선순위 노출

회사 필수 도입 툴 및 라이브러리의 릴리즈 소식은 다른 뉴스 알고리즘에 밀리지 않도록 **최상단 VVIP 섹션에 강제 고정 배치**합니다.

### 2. Cursor 소스 우선 노출 (+40 보너스 점수)

전사 도입 툴인 Cursor의 블로그와 Changelog를 타 소스 대비 **+40 보너스 점수**로 항상 우선 노출합니다.
Cursor 공식 블로그 RSS가 간헐적으로 불안정한 점을 보완하기 위해, **공식 피드와 비공식 미러 피드를 이중으로 수집**하고 제목 기반 중복 제거를 적용합니다.

### 3. 소스 다양성 보장

특정 출처가 섹션을 독점하지 않도록 소스별 최대 노출 개수를 제한합니다.

-   **CORE_AI 섹션:** 소스당 최대 1개, 최대 5개 전송 (여러 소스에서 골고루 노출)
-   **일반 섹션:** 소스당 최대 2개 제한

### 4. 7일 기준 최신 글만 수집

지난 **7일 이내** 발행된 글만 수집하여 항상 그 주의 최신 소식만 전달합니다.
(라이브러리 릴리즈 감지는 버전 누락 방지를 위해 30일 기준 유지)

### 5. 3줄 요약 & 한국어 자동 번역

영문으로 작성된 릴리즈 노트나 해외 블로그 글의 핵심 내용(버그 픽스, 신기능 등)을 3줄로 추출하고, **Google LanguageApp을 통해 한국어로 자동 번역**합니다. 한국어 원문은 번역을 건너뜁니다.

### 6. 스마트 노이즈 캔슬링

-   직무와 무관한 뉴스(정치, 주총, 채용 등)를 네거티브 키워드로 차단합니다.
-   기업 홍보성 케이스 스터디, 유튜브 Shorts, 라이브 스트리밍을 원천 차단합니다.
-   여러 피드에서 동일 제목의 글이 수집될 경우 자동 중복 제거합니다.

### 7. 라이브러리 릴리즈 감지 & 버전 캐싱

Script Properties에 각 라이브러리의 최신 버전을 캐싱하여, **신규 릴리즈가 있을 때만 알림**합니다.
신규 릴리즈가 없는 주에는 현재 안정 버전과 함께 **[릴리즈 보기] 버튼**을 제공합니다.

### 8. 유튜브 캐시 폴백

GAS 서버 IP 차단으로 유튜브 피드 수집에 실패하더라도, 이전에 성공한 데이터를 **CacheService에 13일간 보관**하여 가능한 한 안정적으로 영상을 제공합니다.

### 9. 철저한 보안 관리

Webhook URL을 하드코딩하지 않고, GAS의 `Script Properties` 환경 변수를 사용하여 외부 노출을 차단합니다.

---

## 수집 소스 (Sources)

### 🤖 AI 필수 업데이트

| 소스                                       | 종류 |
| ------------------------------------------ | ---- |
| Cursor Blog (공식 + 비공식 미러 이중 수집) | RSS  |
| Cursor Changelog (GitHub Releases)         | RSS  |
| OpenAI Blog                                | RSS  |
| Google DeepMind                            | RSS  |
| Google for Developers                      | RSS  |
| HuggingFace Blog                           | RSS  |

### 📦 필수 라이브러리

| 소스       | 릴리즈 페이지                           |
| ---------- | --------------------------------------- |
| Swiper     | github.com/nolimits4web/swiper/releases |
| GSAP       | gsap.com/blog                           |
| jQuery     | github.com/jquery/jquery/releases       |
| Sass(SCSS) | github.com/sass/dart-sass/releases      |

### 🏢 IT 업계 / 실무

| 소스              | 종류 |
| ----------------- | ---- |
| 무신사 기술블로그 | RSS  |
| 토스 테크         | RSS  |
| 당근 테크         | RSS  |
| GeekNews          | RSS  |
| CSS-Tricks        | RSS  |
| web.dev           | RSS  |
| Smashing Magazine | RSS  |
| MDN Blog          | RSS  |
| CSS Weekly        | RSS  |
| Frontend Focus    | RSS  |
| NAVER D2          | RSS  |

### 📺 유튜브 (7개 채널)

| 채널            | 분류                 |
| --------------- | -------------------- |
| 개발동생        | AI 도구 / 프론트엔드 |
| 조코딩          | AI 도구 / 웹개발     |
| 노마드코더      | 웹개발               |
| 우아한테크      | 테크                 |
| 토스            | 테크                 |
| 당근테크        | 테크                 |
| 시민개발자 구씨 | 노코드 / AI          |

> ⚠️ 유튜브는 GAS 서버 IP 차단 이슈로 일부 채널이 간헐적으로 수집될 수 있습니다. 수집 성공 시 13일간 캐시에 보관되어 폴백으로 활용됩니다.

---

## 카테고리 구조

| 섹션                           | 설명                                          | 우선순위           |
| ------------------------------ | --------------------------------------------- | ------------------ |
| 🤖 전사 도입 AI 필수 업데이트  | Cursor, Gemini 등 핵심 AI 툴 최신 소식        | VVIP (최상단 고정) |
| 📦 필수 라이브러리 릴리즈      | Swiper, GSAP, jQuery, SCSS 공식 업데이트      | VVIP (최상단 고정) |
| 🌟 금주의 팝콘 픽              | 알고리즘 점수 기반 가장 추천하는 아티클 Top 3 | 상단               |
| ✨ UI/UX 퍼블리싱 & 인터랙션   | CSS, 접근성, 인터랙션 관련 실무 팁            | 중간               |
| 🏢 IT 업계 실무 & 자동화 꿀팁  | 업무 자동화, 프론트엔드 최적화 관련 소식      | 중간               |
| 📺 주말에 몰아보는 코딩 유튜브 | 엄선된 실무 유튜브 영상                       | 하단               |

---

## 사용 기술 (Tech Stack)

-   **Language:** JavaScript (Google Apps Script)
-   **API/Integration:** Google Chat Webhook API (Cards V2), Google LanguageApp, CacheService, PropertiesService
-   **Data Processing:** XML / RSS / Atom Feed Parsing, UrlFetchApp.fetchAll (병렬 수집)

---

## 설치 및 세팅 방법 (Installation)

1. [Google Apps Script](https://script.google.com/)에 접속하여 새 프로젝트를 생성합니다.
2. 본 저장소의 `chatbot.gs` 코드를 복사하여 에디터에 붙여넣습니다.
3. 알림을 받을 Google Chat 스페이스에서 **[웹후크 관리]**를 통해 URL을 발급받습니다.
4. GAS 에디터 좌측 톱니바퀴(프로젝트 설정) > **[스크립트 속성]**에 다음을 추가합니다.
    - **속성:** `WEBHOOK_URL` / **값:** 발급받은 웹후크 주소
5. **최초 1회** `seedLibVersionCache()` 함수를 수동 실행하여 현재 라이브러리 버전을 캐시에 저장합니다.
    > ⚠️ 이 과정을 생략하면 첫 주에 모든 라이브러리가 신규 릴리즈로 오탐됩니다.
6. 좌측 시계 아이콘(트리거) 메뉴에서 `mainDigest` 함수가 **매주 월요일 오후 1시 ~ 2시** 사이에 실행되도록 [시간 주도형] 트리거를 설정합니다.

### 디버그 & 유지보수 함수

| 함수                     | 설명                                          |
| ------------------------ | --------------------------------------------- |
| `debugDigest()`          | 수집 현황 및 유튜브 필터링 진단 로그 출력     |
| `seedLibVersionCache()`  | 현재 라이브러리 버전을 캐시에 저장 (최초 1회) |
| `resetLibVersionCache()` | 라이브러리 버전 캐시 초기화                   |

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

> PR을 보내주시면 검토 후 머지하겠습니다. 언제든지 아이디어와 개선사항을 공유해 주세요! 🍿
