# AI EYEWEAR — SEE. LOOK AT. WATCH.

**🔗 Live: https://eunbilee-cyber.github.io/ai-eyewear/** (데스크톱, 폭 1024px 이상)

데스크톱 중심의 인터랙티브 원페이지 포트폴리오 사이트. 명세는 [`PRD.md`](./PRD.md), 리소스 목록은 [`ASSETS.md`](./ASSETS.md).

`HERO → REINTERPRET → REFRAME → REMEMBER → ENDING → PRODUCT`

React + TypeScript + Vite, 스크롤 연동은 GSAP ScrollTrigger(`scrub`) + CSS `position: sticky` 고정 스테이지.
휠 이벤트를 가로채거나 스크롤을 잠그지 않으며, 모든 상태는 스크롤 위치로만 결정되어 역스크롤 시 그대로 되돌아갑니다.

## 실행

```bash
npm install
npm run dev          # 개발 서버 (http://localhost:5173)
npm run check:assets # 필수 미디어 111개 검사
npm run build        # check:assets → 타입 검사 → dist/ 빌드
npm run preview      # 빌드 결과 확인
```

`npm run build`는 에셋 검사가 실패하면(누락·빈 파일·형식 불일치·HERO 프레임 번호 공백) 누락 경로를 출력하고 중단합니다.

## 구조

```text
public/assets/            # 미디어 111개 (파일명·경로 고정, 수정 금지)
scripts/check-assets.mjs  # 에셋 실물 검사
src/
├── config/
│   ├── assets.ts         # 모든 미디어 경로 (유일한 정의 위치)
│   ├── content.ts        # 섹션 문구, HUD 텍스트
│   └── motion.ts         # 스크롤 구간·이징·궤도·HUD 위치 등 모든 모션 수치
├── components/
│   ├── Hero.tsx                 # S01 — 90장 WebP 시퀀스(canvas) 스크롤 연동
│   ├── Reinterpret.tsx          # S02 — 드래그 마스크
│   ├── Reframe.tsx              # S03 — 4개 상태 전환 + DISTRACT/FOCUS 눈금
│   ├── RememberEndingStage.tsx  # S04+S05 — 자동 회전 궤도·스크롤 확대·영상·HUD·엔딩 (video 1개 공유)
│   ├── ProductPanel.tsx
│   └── DesktopNotice.tsx        # 폭 1024px 미만 안내 화면
├── lib/gsap.ts           # 플러그인 등록, 공통 진입 연출
└── styles/               # globals.css, scenes.css
```

## 수정 방법

| 바꾸고 싶은 것 | 위치 |
|---|---|
| 문구, HUD 라벨/값 | `src/config/content.ts` |
| 미디어 경로 | `src/config/assets.ts` (+ `scripts/check-assets.mjs`의 목록) |
| HERO 스크롤 길이·크로스페이드 길이 | `motion.hero` (`framesVh`, `holdVh`, `fadeVh`) |
| S02 마스크 크기·지연·윤곽 | `motion.reinterpret.mask` |
| S03 단계별 길이·전환 중심점 | `motion.reframe.steps` |
| S04 단계별 스크롤 길이 | `motion.remember.segments` |
| 궤도 반지름·자동 회전 속도·위치별 카드 크기·확대 구간 | `motion.remember.orbit` |
| 확대된 사진 → 원본 영상 전환 타이밍 | `motion.remember.video` |
| HUD 단계 전환(등장 거리·전환 시간) | `motion.remember.hud` |
| 엔딩 문구 등장 거리·디밍 | `motion.remember.ending` |
| 데스크톱 판정 폭 | `motion.desktopMinWidth` |
| 모션 줄이기 설정 값 | `motion.reduced` |

길이 단위 `...Vh`는 뷰포트 높이의 %이자 그 연출에 배정된 스크롤 거리입니다. 값을 바꾸면 섹션 높이가 함께 계산되므로 다른 곳을 고칠 필요가 없습니다.

## 배포

`main` 브랜치에 push하면 GitHub Actions(`.github/workflows/deploy.yml`)가 빌드 후 GitHub Pages에 자동 배포합니다.
`vite.config.ts`의 `base: "./"`와 `assets.ts`의 `import.meta.env.BASE_URL` 덕분에 하위 경로(`/ai-eyewear/`)에서도 에셋 경로가 깨지지 않습니다.

## 구현 메모

- **HERO**: 프레임은 `Math.min(89, Math.floor(progress * 90))`로 매핑, 지연 없는 직접 연동. 타이머·자동재생 없음. 첫 프레임 우선으로 90장을 프리로드하고, 아직 로드되지 않은 프레임은 가장 가까운 프레임으로 대체해 깜빡임을 막습니다. 마지막 프레임은 S02의 16:9 프레임 크기로 줄어들며 사라져 같은 코트 구도로 이어집니다.
- **REINTERPRET**: 버튼을 누른 채 6px 이상 움직여야 드래그로 인정. 마스크는 SVG `clipPath`를 rAF로 갱신하며 누적되지 않습니다. 해제·이탈·`pointercancel`·창 blur 시 원본으로 복귀.
- **REFRAME**: 같은 좌표계에 겹친 4장을, 변경 영역 중심에서 번지는 원형 마스크(가장자리 페더)로 순서대로 드러냅니다.
- **REMEMBER→ENDING**: `memory_09_loop.mp4`의 `<video>`는 하나만 렌더링됩니다. 화면에 노출되기 전에는 첫 화면에서 대기하고, 노출된 뒤 ENDING이 끝날 때까지 seek·재로드 없이 계속 재생됩니다. HUD 3개는 서로 다른 스크롤 구간에 묶여 있습니다(`setTimeout` 없음).
- **`memory_09.webp` ↔ 영상 첫 화면**: 정지 이미지가 영상보다 타이트한 프레이밍이라, 영상을 `select.videoMatchScale`(1.22) 배율에서 시작해 1로 풀어주며 크로스페이드합니다. 리소스를 교체해 구도가 일치하면 1로 두면 됩니다.
- **제품 이미지**: `ai_glasses_product.webp`는 투명 배경이 아니라 어두운 배경과 위아래 글자가 포함돼 있습니다. 파일은 그대로 두고 CSS 마스크(`.product-visual img`)로 안경 주변만 남겨 패널 배경에 녹였습니다. 투명 배경 이미지로 교체하면 해당 `mask-image` 두 줄을 지우면 됩니다.
- **모바일/좁은 화면**: 폭 1024px 미만에서는 안내 화면만 렌더링하고 미디어를 요청하지 않습니다.
- **`prefers-reduced-motion`**: 궤도 자동 회전 속도·마스크 일렁임을 줄입니다.
