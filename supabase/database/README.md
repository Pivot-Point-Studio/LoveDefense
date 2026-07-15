# Database assets

SQL Editor에 적용하는 데이터베이스 자산입니다.

1. `schema.sql` — 테이블, 제약조건, 트리거
2. `policies.sql` — RLS 정책
3. `functions.sql` — leaderboard RPC
4. `seed.sql` — 선택적인 개발용 초기 데이터

`functions/`의 Edge Function 코드와 분리해, 데이터베이스 변경과 서버 런타임 코드를 각각 관리합니다.
