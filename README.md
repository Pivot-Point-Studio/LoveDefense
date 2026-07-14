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
2. SQL Editor에서 `supabase/schema.sql` → `policies.sql` → `functions.sql` 순서로 실행합니다.
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

- `src/services`: Supabase 단일 클라이언트, 익명 인증, 마이그레이션, 오프라인 큐
- `src/repositories`: 페이지에서 직접 `supabase.from`을 호출하지 않도록 한 저장소 계층
- `supabase/`: 스키마, RLS, leaderboard RPC, 설정 문서
- `tests-server.html`: 개발용 기본 인증/프로필 저장 테스트

## 검증

```bash
npm run lint
npm run build
```

테스트용 프로필은 닉네임에 `test-`를 포함합니다. SQL Editor에서 현재 익명 `auth.users.id`에 연결된 `profiles`, `leaderboard_entries` 등을 확인 후 삭제하세요. 운영 데이터로 테스트하지 마세요.
