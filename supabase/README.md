# Supabase 설정

1. Supabase 프로젝트를 만들고 Authentication > Providers에서 Anonymous Sign-Ins를 켭니다.
2. SQL Editor에서 `schema.sql`, `policies.sql`, `functions.sql` 순서로 실행합니다. `seed.sql`은 선택 사항입니다.
3. Project URL과 Publishable/anon key를 확인해 프로젝트 루트 `.env`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`로 입력합니다.
4. `npm run dev`로 실행하고 브라우저 콘솔에서 인증/저장 오류를 확인합니다.

## OpenAI 턴 평가 배포

턴 평가와 상대방 대사 생성은 브라우저가 아닌 `evaluate-turn` Edge Function에서 실행됩니다.

```sh
supabase secrets set OPENAI_API_KEY=... OPENAI_MODEL=...
supabase functions deploy evaluate-turn
```

`OPENAI_API_KEY`와 `OPENAI_MODEL`은 Supabase Secret으로만 설정합니다. 클라이언트 `.env`에는 넣지 않습니다. 요청은 `evaluate_user_input`과 `generate_partner_dialogue`로 구분되며, 각각 최대 두 번 호출된 뒤에만 로컬 fallback으로 전환됩니다.

브라우저에는 공개용 키만 넣습니다. service_role, DB 비밀번호, OpenAI 키는 절대 넣지 않습니다. 익명 인증은 같은 브라우저의 세션으로 사용자를 식별하므로 브라우저 데이터를 지우면 기존 익명 계정에 다시 접근하기 어려울 수 있습니다. 서버 데이터는 삭제되지 않지만, 실제 서비스에서는 이메일·소셜 로그인으로 계정을 업그레이드하는 기능을 권장합니다.

기존 localStorage는 최초 인증 후 한 번 `loveDefense.serverMigrationVersion=1`로 이전됩니다. 성공 전에는 원본을 삭제하지 않으며 `*.backup.v1` 백업을 남깁니다. 검증 후에만 해당 백업 키를 개발자 도구에서 제거하세요. 오프라인 저장 대기열은 `loveDefense.pendingSyncQueue`입니다.
