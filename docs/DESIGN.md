# Love Defense Design System

연애 디펜스는 따뜻하고 친근한 모바일 대화 게임이다. 서비스의 핵심 시각 언어는 분홍색과 보라색의 브랜드 그라데이션, 부드러운 카드형 UI, 선명한 상태 표시, 읽기 쉬운 한국어 타이포그래피다.

## Design Principles

- 대화와 감정 상태가 가장 먼저 보이도록 구성한다.
- 주요 행동은 분홍·보라 그라데이션으로 강조한다.
- 화면은 밝고 깨끗한 바탕 위에 카드와 상태 영역을 배치한다.
- 모바일 한 손 사용을 기준으로 충분한 터치 영역과 여백을 유지한다.
- 시각적 변경은 게임 기능과 상태 흐름을 방해하지 않아야 한다.

## Colors

| Name | Value | Usage |
|------|-------|-------|
| Brand Gradient | `linear-gradient(135deg, #7638fa 0%, #d300c5 52%, #ff0169 100%)` | 주요 버튼, 히어로, 채팅 헤더, 활성 상태 |
| Ultraviolet | `#7638fa` | 그라데이션 시작점, 보라 강조 |
| Plasma Magenta | `#d300c5` | 핵심 브랜드 색상, 링크·라벨 |
| Signal Pink | `#ff0169` | 그라데이션 끝점, 감정 강조 |
| Brand Soft | `#f8ecff` | 보조 배경, 선택 전 상태 |
| Brand Ink | `#321645` | 브랜드가 적용된 어두운 텍스트 |
| Paper White | `#ffffff` | 앱 캔버스, 카드, 입력창 |
| App Background | `#fbf8ff` | 페이지 기본 배경 |
| Graphite | `#17212b` | 본문과 기본 텍스트 |
| Muted Text | `#78888b` | 설명, 보조 정보, 날짜 |
| Error | `#c04c4c` | 입력 오류와 실패 안내 |

브랜드 그라데이션은 `135deg` 방향을 사용하며 색상 순서를 뒤집지 않는다. 넓은 강조 영역과 주요 인터랙션에 사용하고, 긴 본문이나 작은 텍스트에는 사용하지 않는다.

## Typography

기본 서체는 `DM Sans`, 한국어 fallback은 `Noto Sans KR`이다.

| Role | Size | Weight | Usage |
|------|------|--------|-------|
| Display | 48–76px | 400 | 랜딩 타이틀 |
| Page heading | 32px | 400–800 | 페이지 제목 |
| Section heading | 20–24px | 400–800 | 섹션 제목 |
| Body | 14–16px | 400 | 설명과 대화 |
| Caption | 10–12px | 400–800 | 라벨, 상태, 날짜 |

제목은 짧고 명확하게 표시하며, 본문은 `1.5–1.75`의 줄 간격으로 읽기 쉽게 유지한다. 라벨과 상태 표시는 영문 대문자 또는 짧은 한국어를 사용할 수 있다.

## Layout

- 서비스는 최대 약 `620px` 너비의 모바일 앱 셸을 기준으로 한다.
- 콘텐츠 기본 패딩은 모바일 `24px`, 넓은 화면에서는 `32px`까지 사용할 수 있다.
- 하단 탭은 화면 하단에 고정한다.
- 주요 섹션 간 간격은 `18–30px`, 카드 내부 패딩은 `16–24px`를 기본으로 한다.
- 채팅 화면은 헤더, 스테이지 상태, 관계 상태, 메시지 영역, 입력 영역 순서를 유지한다.
- 스플래시는 전체 화면을 사용하며 중앙 로고와 하단 `AI-POWERED` 라벨을 배치한다.

## Components

### Splash Screen

브랜드 그라데이션 배경 위에 흰색 `love-defense.svg` 로고를 중앙에 표시한다. 로고에는 느린 pulse 애니메이션을 적용하고, 하단에 반투명한 `AI-POWERED` 라벨을 둔다. 로딩 문구를 노출하지 않는다.

### Hero Card

홈과 연습 화면의 핵심 콘텐츠를 담는다. 분홍·보라 그라데이션 또는 연한 보라색 배경을 사용하고, 제목·설명·주요 행동을 함께 배치한다. 장식 아이콘은 흰색 또는 밝은 색으로 표시한다.

### Buttons

- 주요 버튼: 브랜드 그라데이션 배경, 흰색 텍스트
- 보조 버튼: `#f8ecff` 배경, 마젠타 텍스트
- 밝은 버튼: 흰색 배경, 어두운 보라색 텍스트
- 버튼은 최소 `44px` 이상의 터치 높이를 확보한다.
- hover 시 그라데이션 명도와 그림자만 부드럽게 변화시킨다.

### Cards

카드는 흰색 배경, 얇은 회색 테두리, `18–26px` 모서리, 가벼운 그림자를 사용한다. 카드 안의 정보는 제목, 보조 설명, 상태 또는 행동 순서로 정리한다.

### Chat

- 상대 메시지: 밝은 보라색 계열 배경
- 사용자 메시지: 브랜드 그라데이션 배경과 흰색 텍스트
- 채팅 헤더: 브랜드 그라데이션
- 관계 HP와 진행률: 브랜드 그라데이션 채움
- 입력 영역: 흰색 카드와 명확한 포커스 테두리

메시지와 상태 정보의 의미는 색상만으로 전달하지 않고 텍스트와 함께 제공한다.

### Navigation

하단 탭은 흰색 반투명 바탕과 상단 구분선을 사용한다. 현재 선택된 탭은 브랜드 그라데이션 배경과 흰색 아이콘·텍스트로 표시한다.

## Motion

- 스플래시 로고: `3s ease-in-out` pulse
- 버튼 hover: 짧은 색상·그림자 변화
- 진행률: `0.3–0.4s ease` 전환
- 시스템 전환과 토스트는 짧은 fade/scale 애니메이션을 사용한다.
- `prefers-reduced-motion: reduce` 환경에서는 장식 애니메이션을 줄이거나 제거한다.

## Accessibility

- 로고 이미지에는 의미 있는 `alt` 텍스트를 제공한다.
- 텍스트와 배경의 대비를 충분히 유지한다.
- 버튼과 입력창은 키보드 및 터치로 조작할 수 있어야 한다.
- 오류와 로딩 상태는 시각적 색상 외에도 텍스트로 전달한다.
- 모바일 최소 너비 `320px`에서도 콘텐츠가 잘리지 않아야 한다.

## Assets

```text
src/assets/
├─ brand/
│  ├─ love-defense.svg       # 흰색 서비스 로고
│  └─ love-defense-logo.png  # 로고 이미지 원본
├─ favicon/                  # 브라우저 및 모바일 아이콘
└─ icons/                    # UI 아이콘
```

스플래시와 브랜드 영역에서는 `src/assets/brand/love-defense.svg`를 사용한다. favicon은 `src/assets/favicon/favicon.ico`를 기본으로 사용한다.

## Dark Mode

다크모드는 단순한 색상 반전이 아니라 True Black Canvas와 3단계 서피스 계층을 사용하는 별도 테마다. 화면 전체가 어두운 환경에서도 대화, 입력, 상태 정보가 명확히 구분되어야 한다.

### Theme Behavior

- 최초 실행 시 브라우저·운영체제의 `prefers-color-scheme`를 기본값으로 사용한다.
- 사용자 페이지에서 라이트모드와 다크모드를 직접 전환할 수 있다.
- 수동 선택값은 `love-defense-theme` 키로 `localStorage`에 저장한다.
- 저장된 선택값은 시스템 설정보다 우선한다.
- 초기 HTML 단계에서 테마를 적용해 라이트 화면이 잠깐 보이는 테마 플래시를 방지한다.
- `color-scheme`와 브라우저 `theme-color`도 현재 테마와 동기화한다.

### Dark Semantic Tokens

```css
[data-theme="dark"] {
  color-scheme: dark;

  --color-bg-canvas: #000000;
  --color-bg-surface-1: #171717;
  --color-bg-surface-2: #262626;
  --color-bg-surface-3: #2D2D2D;

  --color-text-primary: #FAFAFA;
  --color-text-secondary: #B3B3B3;
  --color-text-muted: #999999;
  --color-text-disabled: #6F6F6F;

  --color-icon-primary: #F5F5F5;
  --color-icon-secondary: #A0A0A0;
  --color-border-subtle: rgba(255, 255, 255, 0.08);

  --color-accent-start: #7330CB;
  --color-accent-end: #6937CE;
  --color-focus: #4C52DC;
  --color-error: #FF7B88;
  --color-success: #6EE7A1;

  --state-hover: rgba(255, 255, 255, 0.06);
  --state-pressed: rgba(255, 255, 255, 0.12);

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-pill: 999px;
}
```

### Surface Hierarchy

| Surface | Value | Usage |
|---|---|---|
| Canvas | `#000000` | 채팅 기록과 메인 화면 배경 |
| Surface 1 | `#171717` | 하단 툴바, 넓은 고정 영역, 일반 카드 |
| Surface 2 | `#262626` | 상대방 메시지, 입력창, 메뉴 |
| Surface 3 | `#2D2D2D` | 강조 컨트롤, 티어 항목, 키, 선택 가능한 컨트롤 |

서피스 계층만으로 요소의 깊이와 그룹을 표현한다. 카드·메시지·입력창에는 무거운 그림자를 사용하지 않으며, 강한 테두리는 피한다. 구분선이 필요할 때만 `--color-border-subtle`을 사용한다.

### Dark Chat Rules

- 채팅 Canvas는 `#000000`을 사용한다.
- 하단 시스템 툴바는 Surface 1을 사용한다.
- 상대방 메시지와 입력창은 Surface 2를 사용한다.
- 사용자가 보낸 메시지는 다음 보라색 세로 그라데이션을 사용한다.

```css
background: linear-gradient(180deg, #7330CB 0%, #6937CE 100%);
color: #FFFFFF;
```

- 메시지 버블은 `--radius-lg`, 입력창과 주요 버튼은 `--radius-pill`을 기본으로 한다.
- 본문은 `--color-text-primary`, 설명은 `--color-text-secondary`, placeholder와 메타데이터는 `--color-text-muted`를 사용한다.

### Interaction States

| State | Treatment |
|---|---|
| Default | 현재 서피스와 텍스트 token |
| Hover | `--state-hover` 흰색 반투명 오버레이 |
| Pressed | `--state-pressed` 오버레이 |
| Selected | 브랜드 컬러 또는 한 단계 밝은 서피스 |
| Focus | `--color-focus` 포커스 링 |
| Disabled | 텍스트·아이콘 명도 감소와 조작 불가 커서 |
| Error | 어두운 배경용 밝은 빨강 + 오류 문구·형태 보조 |
| Success | 어두운 배경용 밝은 초록 + 라벨·아이콘 보조 |
| Loading | Surface 1~3 명도 차이를 이용한 shimmer/skeleton |

상태를 색상 하나로만 표현하지 않는다. 라벨, 아이콘, 포커스 링, 형태 변화 또는 disabled 상태를 함께 사용한다.

### Dark Mode Accessibility Checklist

- 아이콘 그래픽은 약 22–24px, 터치 영역은 최소 44px로 분리한다.
- 키보드 포커스가 검정 Canvas 위에서 명확히 보이는지 확인한다.
- 본문·보조·placeholder·disabled 텍스트의 명도 위계를 유지한다.
- 로고, 이미지, 차트, 결과 그래픽을 다크 배경에서 별도 검수한다.
- `prefers-reduced-motion`에서는 shimmer와 pulse를 정지하거나 최소화한다.
- 브라우저 상태바, 모바일 내비게이션 바, 키보드가 선택 테마와 일치하는지 확인한다.
