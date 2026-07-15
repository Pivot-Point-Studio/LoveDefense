# Backend client layer

`src/backend`는 브라우저에서 Supabase와 Edge Function을 호출하는 코드만 담습니다.

- `config`: 공개 환경변수와 Supabase 설정
- `client`: Supabase 클라이언트와 공통 응답/오류 처리
- `auth`: 익명 인증과 현재 사용자 상태
- `repositories`: Supabase 테이블·RPC별 데이터 접근
- `integrations`: Edge Function, OpenAI 연동 어댑터
- `services`: 마이그레이션과 오프라인 동기화처럼 여러 저장소를 조합하는 기능

게임 규칙과 로컬 fallback 시나리오는 `src/game`, `src/data`, `src/services`에 둡니다. 화면이나 게임 로직에서 Supabase SDK를 직접 호출하지 않고 이 폴더를 통해 접근합니다.
