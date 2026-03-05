# 🍿 Popcorn Tech Digest Bot (퍼블팀 주간 큐레이션 봇)

Google Apps Script(GAS)와 Google Chat Webhook을 활용하여, 프론트엔드/퍼블리싱 팀에게 꼭 필요한 IT 기술 트렌드와 업데이트 소식을 배달해 주는 **스마트 큐레이션 봇**입니다.

직장인이 가장 피곤함을 느끼는 **매주 월요일 오후 1시**, 식곤증과 월요병을 날려버릴 수 있도록 "퇴근길에 팝콘 먹듯 가볍고 재밌게" 소비할 수 있는 알짜배기 정보만 큐레이션하여 전송합니다.

![Google Chat Card UI Example](https://img.shields.io/badge/Google_Chat-Cards_V2-blue?logo=googlechat)
![Language](<https://img.shields.io/badge/Language-JavaScript_(GAS)-yellow>)

## 기획 배경 (Why?)

- 고객 선제적 서비스(Before Service): 최신 기술 트렌드와 라이브러리 업데이트를 상시 모니터링하여, 고객의 요구가 있기 전 선제적으로 기술적 제안과 최적의 솔루션을 제공하기 위함입니다.
- 매일 쏟아지는 기술 블로그와 유튜브 영상 속에서 **실무에 진짜 필요한 정보만 필터링**할 필요성 대두.
- 전사적으로 적극 활용 중인 필수 스택(`Cursor`, `Gemini`, `Swiper`, `GSAP` 등), 즉 사내 주요 도구의 업데이트 소식을 팀원 모두가 빠르게 파악하고 프로젝트 품질과 생산성을 유지합니다.
- 공유 문화 조성: 나른한 월요일 오후 시간대를 타겟팅하여, 팀 내 기술 인사이트 공유를 활성화하고 업무 리프레시를 돕습니다.

## 핵심 기능 (Key Features)

### 1. VVIP 카테고리 고정 (우선순위 노출)

회사 필수 도입 툴 및 라이브러리의 릴리즈 소식은 다른 뉴스 알고리즘에 밀리지 않도록 **최상단 VVIP 섹션에 강제 고정 배치**합니다.

### 2. 3줄 요약 & 영문 자동 번역 (AI Translation)

영어로 작성된 GitHub 릴리즈 노트나 해외 공식 블로그 글에서 핵심 내용(버그 픽스, 신기능 등)만 3줄로 추출합니다. 추출된 영문 요약본은 **Google Language API를 통해 한국어로 자동 번역**되어 챗 카드에 출력됩니다.

### 3. 스마트 노이즈 캔슬링 (정밀 예외 처리)

- 직무와 무관한 뉴스(정치, 주총, 행사 등)를 네거티브 키워드로 차단합니다.
- Google Chat API 400 에러를 유발하는 빈 링크, 유튜브 쇼츠(Shorts), 라이브 스트리밍 영상을 원천 차단하여 시스템 안정성을 확보했습니다.

### 4. 소스 독점 방지 알고리즘 (Quota System)

특정 유튜브 채널이나 기업 블로그가 뉴스레터를 도배하지 않도록, 한 출처당 최대 노출 개수를 2개로 제한하여 정보의 다양성을 유지합니다.

### 5. 철저한 보안 관리

Webhook URL을 하드코딩하지 않고, GAS의 `Script Properties(스크립트 속성)` 환경 변수를 사용하여 외부 노출로부터 안전하게 보호합니다.

## 사용 기술 (Tech Stack)

- **Language:** JavaScript (Google Apps Script)
- **API/Integration:** Google Chat Webhook API (Cards V2 JSON format), Google LanguageApp
- **Data Processing:** XML / RSS / Atom Feed Parsing, Regex (정규표현식 데이터 정제)

## 설치 및 세팅 방법 (Installation)

1. [Google Apps Script](https://script.google.com/)에 접속하여 새 프로젝트를 생성합니다.
2. 본 저장소의 `chatbot.gs` 코드를 복사하여 에디터에 붙여넣습니다.
3. 알림을 받을 Google Chat 스페이스에서 **[웹후크 관리]**를 통해 URL을 발급받습니다.
4. GAS 에디터 좌측 톱니바퀴(프로젝트 설정) > **[스크립트 속성]**에 다음을 추가합니다.
    - **속성:** `WEBHOOK_URL`
    - **값:** `발급받은 웹후크 주소`
5. 좌측 시계 아이콘(트리거) 메뉴에서 `mainDigest` 함수가 **매주 월요일 오후 1시 ~ 2시** 사이에 실행되도록 [시간 주도형] 트리거를 설정합니다.

## 구조 및 카테고리

- **🤖 전사 도입 AI 필수 업데이트:** Cursor, Gemini 등 핵심 AI 툴 최신 소식 (VVIP)
- **📦 필수 라이브러리 릴리즈:** Swiper, GSAP, jQuery, SCSS 공식 업데이트 (VVIP)
- **🌟 금주의 팝콘 픽:** 알고리즘 점수 기반 가장 추천하는 아티클 Top 3
- **✨ UI/UX 퍼블리싱 & 인터랙션:** Figma, CSS, 접근성 관련 실무 팁
- **🏢 IT 업계 실무 & 자동화 꿀팁:** 업무 자동화(n8n, Make), 프론트엔드 최적화
- **📺 주말에 몰아보는 코딩 유튜브:** 노마드코더, 조코딩, 윤자동 등 엄선된 실무 영상

---

## 기여하기 (Contributing)

### Fork를 통한 협업 방법

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

# remote 저장소 확인
git remote -v
# origin   → 본인의 Fork 저장소
# upstream → 원본 저장소 (이 레포)
```

#### 3. 브랜치 생성 및 작업

```bash
# main 브랜치에서 새 브랜치 생성 (본인 이름 사용)
git checkout -b feature/YOUR_NAME

# 예시
git checkout -b feature/gildong
```

> 브랜치명은 `feature/이름` 형식으로 통일해 주세요.

#### 4. 변경사항 Commit

```bash
# 변경사항 확인
git status

# 변경사항 추가
git add .

# Commit 작성 (아래 컨벤션 참고)
git commit -m "feat: 노마드코더 RSS 피드 추가"
```

**Commit 메시지 컨벤션**

| 태그       | 설명                                   |
| ---------- | -------------------------------------- |
| `feat`     | 새로운 기능 추가 (RSS 피드, 키워드 등) |
| `fix`      | 버그 수정                              |
| `refactor` | 코드 리팩토링                          |
| `docs`     | README 등 문서 수정                    |
| `chore`    | 기타 잡다한 수정                       |

#### 5. Upstream 동기화 (최신 상태 유지)

PR을 보내기 전, 원본 저장소의 최신 변경사항을 반드시 반영해 주세요.

```bash
# upstream의 최신 변경사항 가져오기
git fetch upstream

# 현재 브랜치에 upstream/main 병합
git merge upstream/main

# 충돌(Conflict)이 발생했다면 해결 후 다시 commit
```

#### 6. Fork 저장소에 Push

```bash
# 본인의 Fork 저장소에 Push
git push origin feature/YOUR_NAME
```

#### 7. Pull Request 생성

1. GitHub에서 본인의 Fork 저장소로 이동합니다.
2. 상단에 표시되는 **"Compare & pull request"** 버튼을 클릭합니다.
3. PR 제목과 설명을 아래 형식에 맞게 작성합니다.
4. **"Create Pull Request"** 버튼을 클릭하여 제출합니다.

**PR 작성 예시**

```
제목: feat: 디자인 관련 RSS 피드 3개 추가

본문:
## 변경 내용
- Smashing Magazine RSS 피드 추가
- CSS-Tricks RSS 피드 추가
- 네거티브 키워드에 '채용' 추가

## 변경 이유
UI/UX 카테고리 콘텐츠 다양성 강화를 위해 추가했습니다.
```

> PR을 보내주시면 검토 후 머지하겠습니다. 언제든지 아이디어와 개선사항을 공유해 주세요! 🍿
