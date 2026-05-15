# pulse-worklog-admin

> **맥박의 pulse.worklog 콘텐츠 관리 도구.**
> Next.js 16 기반 로컬 전용 마크다운 위키 + 발행 자동화.

콘텐츠 자산은 [`pulse-worklog`](https://github.com/rucas-kim/pulse-worklog) repo에. 이 도구는 그걸 *로컬 파일 시스템*으로 읽고 편집·발행해요.

---

## 핵심 기능

- 🗂 **4탭 글 목록** — 아이디어 · 후보 풀 · 발행 대기 · 발행 완료
- ✏️ **인라인 마크다운 편집** — textarea로 본문 직접 수정 + 저장
- 📋 **섹션별 복사 버튼** — Threads 체이닝 글은 메인·하위별로 카드 분할 + 카드마다 [복사]. 복사 진행 표시.
- 📤 **원클릭 발행** — 클릭하면 `published_at` 자동 입력 + 파일을 `_published/YYYY-MM/`으로 이동
- 🔍 **검색·필터·정렬** — 영역(A·B·C·자기계발)·상태·발행 예정일·발행일·수정일
- 🌱 **새싹 디자인** — 라이트/다크 자동, Pretendard 한글 폰트, 모바일 반응형

## 빠른 시작

### 1. 환경 설정
```bash
git clone https://github.com/rucas-kim/pulse-worklog-admin.git
cd pulse-worklog-admin
npm install
```

### 2. `.env.local` 작성
```env
CONTENT_DIR=/absolute/path/to/pulse-worklog
```

콘텐츠 repo가 어디 있는지 알려주면 돼요. `pulse-worklog` repo의 절대 경로.

### 3. 실행
```bash
npm run dev
```

→ http://localhost:3000

---

## 폴더 구조

```
pulse-worklog-admin/
├── app/
│   ├── page.tsx                       ← 메인: 4탭 + 글 목록
│   ├── post/[folder]/[slug]/page.tsx  ← 글 보기·편집
│   ├── actions.ts                     ← Server Actions (저장·발행)
│   ├── layout.tsx
│   └── globals.css                    ← 디자인 토큰 + Pretendard
├── components/
│   ├── TabBar.tsx                     ← 4탭 + 카운트
│   ├── PostCard.tsx                   ← 글 카드 (제목·미리보기·상태·영역)
│   ├── Badge.tsx                      ← Category / Status 배지
│   ├── EmptyState.tsx                 ← 빈 폴더 안내
│   ├── FilterBar.tsx                  ← 검색·필터·정렬 (URL 쿼리)
│   ├── Markdown.tsx                   ← react-markdown
│   ├── SectionCard.tsx                ← 섹션 1개 + 복사 버튼
│   ├── SectionList.tsx                ← 전체 섹션 + 복사 진행
│   ├── PostEditor.tsx                 ← 인라인 편집
│   └── PublishButton.tsx              ← 발행 모달
└── lib/
    ├── types.ts                       ← Post / Frontmatter / Section
    ├── posts.ts                       ← fs 기반 글 읽기 + 안전 경로
    ├── sections.ts                    ← H1 헤더 기반 섹션 분할
    └── filter.ts                      ← filterAndSort
```

## 워크플로

```
콘텐츠 repo의 폴더 ─► 도구 4탭으로 매핑
├── _ideas/      → 아이디어
├── _drafts/     → 후보 풀
├── _queue/      → 발행 대기
└── _published/  → 발행 완료
       ↑
   발행 버튼 클릭 시 파일이 자동 이동
```

발행 흐름:
1. 메인 탭에서 글 카드 클릭
2. 글 페이지에서 섹션 카드별 [📋 복사] → Threads/Instagram 앱에 붙여넣기
3. 모든 섹션 복사 완료 후 [📤 발행] 클릭
4. 모달에서 permalink 입력 (선택) → 확정
5. 파일이 `_published/YYYY-MM/`로 이동, `status: published`, `published_at` 자동 입력
6. 발행 완료 탭에서 확인

## 디자인 시스템

- **액센트**: 🌱 emerald-500 (새싹 그린)
- **영역 색상**: A(blue) · B(pink) · C(emerald) · 자기계발(amber)
- **상태 색상**: candidate(yellow) · queued(blue) · published(emerald) · rejected(zinc)
- **폰트**: Pretendard Variable (한글) + system mono
- **다크 모드**: `prefers-color-scheme` 자동

## 보안·룰

- 로컬 전용. 인증·DB·외부 호출 없음.
- 모든 파일 IO는 `CONTENT_DIR` 내부로만 제한 (`ensureSafePath`)
- `.env.local`은 `.gitignore`로 차단
- 콘텐츠 자체는 별도 repo (private 또는 public) — 이 도구는 *읽고 쓸 뿐*

## 기술

- **Next.js 16.2** + **React 19** (App Router, Server Actions)
- **TypeScript 5**
- **Tailwind CSS v4** (`@theme` 인라인 토큰)
- **gray-matter** (frontmatter)
- **react-markdown** + **remark-gfm**

## 라이선스

개인 프로젝트. 사용·수정·실험 자유.
