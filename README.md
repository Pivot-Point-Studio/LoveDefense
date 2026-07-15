# Love Defense

기존 연애 대화 디펜스 게임을 유지하면서 사용자·게임·Stage·추천 표현·랭킹을 Supabase에 저장하는 Vite 앱입니다. 기존 UI와 게임 선택 방식은 유지되고, 서버 연결이 실패한 저장 작업은 `loveDefense.pendingSyncQueue`에 임시 보관됩니다.

## 실행

```bash
npm ci
copy .env.example .env
npm run dev
```

`.env`에는 공개용 값만 입력합니다.

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

## Supabase 설정

1. Supabase 프로젝트를 만들고 Anonymous Sign-Ins를 활성화합니다.
2. SQL Editor에서 `supabase/database/schema.sql` → `policies.sql` → `functions.sql` 순서로 실행합니다.
3. Project URL과 Publishable/anon key를 `.env`에 입력합니다.
4. `npm run dev`로 실행하고 브라우저 콘솔을 확인합니다.
5. 두 브라우저에서 플레이하면 공개 랭킹이 공유됩니다.

`service_role`, DB 비밀번호, OpenAI 키는 브라우저에 넣지 않습니다. 익명 인증은 같은 브라우저 세션을 식별자로 사용합니다. 브라우저 데이터를 지우면 기존 익명 계정을 복구하기 어려울 수 있으므로 실제 서비스에서는 이메일/소셜 계정 연결을 추가해야 합니다.

## 실제 localStorage 조사 및 이전

현재 발견된 키는 다음과 같습니다.

- `loveDefense.userProfile`: `{ nickname, mbti, expression, relationshipLength }` → `profiles`
- `loveDefense.gameHistory`: 결과 배열 `{ score, stage, success, scenario, createdAt }` → `game_sessions`
- `loveDefense.savedExpressions`: 추천 표현 문자열 배열 → `saved_expressions`

인증 후 `localDataMigrationService`가 한 번만 이전하고 `loveDefense.serverMigrationVersion=1`을 기록합니다. 성공 전에는 원본을 삭제하지 않으며 각 키의 `.backup.v1` 백업을 남깁니다. 서버 정상 상태에서는 화면 데이터가 서버 조회 결과를 우선합니다. 계속 남는 localStorage는 UI/비상 복구 목적의 `loveDefense.pendingSyncQueue`, migration 버전, 백업뿐입니다.

## 구조

- `src/backend`: Supabase 클라이언트, 인증, 저장소, Edge Function 연동
- `src/services`, `src/game`, `src/data`: 게임 도메인과 로컬 fallback 로직
- `supabase/database`: 스키마, RLS, leaderboard RPC, seed SQL
- `supabase/functions`: `evaluate-turn`, `generate-stage` Edge Function
- `tests-server.html`: 개발용 기본 인증/프로필 저장 테스트

## 검증

```bash
npm run lint
npm run build
```

## OpenAI 시나리오 생성 설정

게임은 `src/services/scenarioProviderFactory.js`를 통해 OpenAI 공급자를 먼저 사용하고, Supabase 미설정·15초 timeout·호출/검증 실패 시 로컬 `TemplateScenarioProvider`로 자동 전환합니다. 선택지를 누를 때 OpenAI를 다시 호출하지 않으며, 한 Stage 생성 시 한 번만 호출합니다.

OpenAI 키는 브라우저 환경변수나 Git 저장소에 넣지 마세요. Supabase CLI로 프로젝트에 직접 Secret을 등록합니다.

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set OPENAI_API_KEY=YOUR_OPENAI_KEY OPENAI_MODEL=YOUR_MODEL_NAME
supabase functions deploy generate-stage
```

`OPENAI_MODEL`은 프로젝트에서 사용할 Responses API 지원 모델명으로 지정합니다. `.env.example`에는 키 값이 없고, 프론트엔드에는 Supabase URL과 publishable/anon key만 둡니다. 최근 시나리오의 제목·요약·시작 대사·fingerprint는 `localStorage`의 `loveDefense.recentScenarios`에 보관하고, OpenAI 생성 성공 시 `scenario_history`에도 저장합니다. `supabase/database/schema.sql`을 먼저 적용해야 합니다.

테스트용 프로필은 닉네임에 `test-`를 포함합니다. SQL Editor에서 현재 익명 `auth.users.id`에 연결된 `profiles`, `leaderboard_entries` 등을 확인 후 삭제하세요. 운영 데이터로 테스트하지 마세요.
