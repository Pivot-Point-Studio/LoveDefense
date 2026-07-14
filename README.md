# Love Defense

상대의 진짜 의도를 맞히며 서로의 연애 커뮤니케이션 스타일을 이해하는 채팅 디펜스 게임

## 기술 스택

- React
- Vite
- JavaScript
- Supabase
- Vercel
- Node.js 24.x
- npm 12.x

## 시작하기

### 1. 저장소 클론

```bash
git clone <https://github.com/Pivot-Point-Studio/LoveDefense.git>
cd LoveDefense
```

### 2. Node.js 버전 확인

Node.js 24.x와 npm 12.x 사용을 권장합니다.

```bash
node --version
npm --version
```

### 3. 의존성 설치

`package-lock.json`에 기록된 버전으로 설치합니다.

```bash
npm ci
```

### 4. 환경변수 설정

`.env.example`을 복사해 `.env` 파일을 생성합니다.

```bash
cp .env.example .env
```

`.env`에 Supabase 프로젝트 정보를 입력합니다.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

`.env` 파일은 보안상 Git에 커밋하지 않습니다.

### 5. 개발 서버 실행

```bash
npm run dev
```

기본적으로 `http://localhost:5173`에서 실행됩니다.

## npm 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 로컬 확인 |
| `npm run lint` | ESLint 검사 |

## Supabase

Supabase 클라이언트는 [src/lib/supabase.js](src/lib/supabase.js)에서 생성합니다.

```js
import { supabase } from './lib/supabase'
```

Supabase의 `URL`과 `anon key`는 Vite 환경변수인 `VITE_` 접두사를 사용해야 합니다.

서비스 롤 키나 기타 비밀 키는 프론트엔드 환경변수에 저장하지 않습니다.

## 배포

Vercel에서 Git 저장소를 연결하면 기본 설정으로 배포할 수 있습니다.

- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm ci`

Vercel 프로젝트 설정의 Environment Variables에 다음 값을 등록합니다.

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

`vercel.json`에는 React SPA 라우팅을 위한 rewrite 설정이 포함되어 있습니다.

## 코드 검사 및 빌드

커밋 또는 Pull Request 전에 다음 명령을 실행합니다.

```bash
npm run lint
npm run build
```

## 디렉터리 구조

```text
.
├─ src/
│  ├─ lib/
│  │  └─ supabase.js    # Supabase 클라이언트
│  ├─ App.jsx           # 애플리케이션 루트 컴포넌트
│  ├─ index.css         # 전역 스타일
│  └─ main.jsx          # 애플리케이션 진입점
├─ .env.example         # 환경변수 예시
├─ eslint.config.js      # ESLint 설정
├─ vercel.json           # Vercel SPA 설정
├─ vite.config.js        # Vite 설정
└─ package.json
```
