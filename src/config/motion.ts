// 스크롤 구간 · 이징 · 속도 · 궤도 파라미터의 유일한 정의 위치.
// 길이 단위 "Vh"는 뷰포트 높이의 %이며, 곧 해당 연출에 배정된 스크롤 거리다.

/** S04 HUD Bounding Box 하나의 배치. 모든 좌표는 원본 영상 픽셀 기준. */
export type HudTarget = {
  box: { x: number; y: number; w: number; h: number };
  line: [number, number][];
  label: { x: number; y: number; align: "left" | "right"; place: "above" | "below" };
  /** 피사체가 움직이는 경우: 영상 재생 시간(초)별 박스 [t, left, top, right, bottom].
   *  키프레임 사이는 부드럽게 보간하고, 연결선·텍스트는 박스 좌상단 이동량만큼 따라간다.
   *  없으면 box 위치에 고정. 첫 키(0초)와 마지막 키(영상 길이)는 같은 값이어야 루프가 끊기지 않는다. */
  track?: [number, number, number, number, number][];
};

export const motion = {
  /** 이 폭 미만에서는 데스크톱 안내 화면만 표시 */
  desktopMinWidth: 1024,

  /** ScrollTrigger scrub. HERO는 지연 없는 직접 연동, 나머지는 약한 스무딩 */
  scrub: { smooth: 0.45 },

  /** S02·S03·S04 공통 진입 연출 */
  intro: {
    dim: 0.7, // 진입 시 암전 강도
    titleLiftVh: 26, // 타이틀이 위로 사라지는 거리
  },

  hero: {
    framesVh: 360, // 90프레임을 넘기는 스크롤 거리
    holdVh: 30, // 마지막 프레임 유지
    fadeVh: 90, // S02로의 크로스페이드
    preloadConcurrency: 6,
    copyLiftVh: 18, // 스크롤 시작 시 문구가 위로 사라지는 거리
    copyFadeVh: 40, // 문구가 완전히 사라지는 스크롤 거리
  },

  reinterpret: {
    introVh: 110,
    holdVh: 120, // 커서 탐색을 위한 고정 구간
    hintIdleMs: 1400, // 커서가 이 시간 동안 멈춰 있으면 MOVE TO EXPLORE 안내가 다시 나타난다
    mask: {
      sizeRatio: 0.23, // 커서가 멈춰 있을 때 마스크 지름 / 컨테이너 폭
      moveSizeRatio: 0.46, // 커서를 움직일 때 커지는 최대 지름 / 컨테이너 폭
      moveFullRatio: 0.012, // 프레임당 이 거리(컨테이너 폭 대비)만큼 움직이면 최대 크기
      energyRise: 0.12, // 움직일 때 커지는 속도
      energyFall: 0.035, // 멈춘 뒤 원래 크기로 돌아가는 속도
      follow: 0.16, // 프레임당 커서 추종 비율 (작을수록 늦게 따라옴)
      grow: 0.2, // 등장 속도
      shrink: 0.34, // 퇴장 속도
      points: 36, // 윤곽 제어점 수 (물결을 그릴 만큼 촘촘하게)
      wobble: 0.1, // 정지 상태의 윤곽 요철 강도
      wobbleSpeed: 0.0017, // 윤곽 일렁임 속도(rad/ms)
      waveCount: 7, // 이동 중 윤곽을 따라 도는 물결 수
      waveAmp: 0.1, // 물결 높이 (반경 대비)
      waveSpeed: 0.006, // 물결이 흐르는 속도(rad/ms)
    },
  },

  reframe: {
    introVh: 90,
    gapVh: 22, // 상태 사이 정지 구간
    holdVh: 60, // FOCUS 최종 상태 유지
    // 우측 눈금 인디케이터: DISTRACT에서는 눈금이 흐트러져 있다가 FOCUS로 갈수록 정렬된다.
    gauge: {
      ticks: 24,
      scatterXPx: 9, // 좌우 이탈 최대치
      scatterYPx: 5, // 상하 이탈 최대치
      scatterDeg: 34, // 기울기 최대치
      scatterScale: 0.9, // 길이 편차 (1 ± 값)
      settleFrom: 0.72, // 전체 구간 중 이 지점부터 눈금이 하나씩 정렬을 마친다 (1에서 전부 정렬)
    },
    // 각 단계: 변경 영역을 중심으로 번지는 원형 마스크 + 가장자리 크로스페이드
    steps: [
      { durationVh: 95, originX: 0.12, originY: 0.66, featherVw: 22, reachVw: 100 }, // 좌측 가구 제거
      { durationVh: 95, originX: 0.92, originY: 0.42, featherVw: 22, reachVw: 95 }, // 우측 가구 제거
      { durationVh: 105, originX: 0.0, originY: 0.38, featherVw: 70, reachVw: 190 }, // 창에서 들어오는 햇빛
    ],
  },

  remember: {
    // 스크롤 단계(PRD 9장 표 순서). 합계 + 100vh가 스테이지 섹션 높이.
    // 진입 연출(스크롤 vh, 섹션 상단이 화면 상단에 닿은 시점 = 0)
    //   카피·시계 동시 등장(섹션이 들어오는 동안) → hold → 카피 fade out + 초침 소멸(같은 시작점)
    //   → 시계가 우측에서 중앙으로 이동 → 기억 이미지 등장 → 궤도 회전·확대 시작
    intro: {
      enterStart: "top 70%", // 카피·시계 fade in 시작(섹션 진입 중)
      enterEnd: "top 5%", // fade in 완료
      holdVh: 30, // 카피·시계가 그대로 머무는 구간
      fadeVh: 70, // 카피 fade out = 초침 fade out 구간(동일 시작)
      copyLiftPx: 28, // 카피가 사라지며 위로 이동하는 거리
      moveDelay: 0.85, // fadeVh 의 이 비율 지점부터 시계 이동 시작(카피가 충분히 사라진 뒤)
      moveVh: 80, // 시계 우측 → 중앙 이동
      clockRightVw: 24, // 초기 시계 위치: 화면 중앙에서 오른쪽으로 이 값(vw)만큼
      cardsVh: 45, // 시계가 중앙에 도착한 뒤 기억 이미지가 나타나는 구간
      orbitDelay: 0.5, // cardsVh 의 이 비율 지점부터 궤도 진행(회전) 시작
    },
    segments: {
      orbitVh: 420, // 궤도 구간 전체 = 확대 진행률 0~1
      hudVh: 60, // HUD 단계(활성 영역) 1개당
      hudExitVh: 60,
      copyVh: 46, // 엔딩 문구 1개당
      promiseVh: 50,
      holdVh: 40,
    },
    // 회전은 시간(자동), 확대는 스크롤 진행률 — 서로 독립.
    orbit: {
      // 자동 회전(시계 방향): 초침처럼 한 칸씩 끊어서 움직인다. 시간 기반이며 스크롤 진행률과 무관.
      // 타이틀이 완전히 사라진 뒤(궤도 진행 > 0)부터 째깍이기 시작한다.
      tickDeg: 10, // 한 번에 도는 각도. 180의 약수여야 09번이 정확히 오른쪽에 멈춘다
      tickSec: 0.8, // 째깍 간격
      tickMoveSec: 0.22, // 한 칸을 움직이는 시간(나머지는 정지)
      tickOvershoot: 1.6, // 멈출 때 살짝 넘어갔다 돌아오는 정도(0이면 없음)
      startAngleDeg: 180, // 시작 시 09번의 위치(0 = 맨 오른쪽, 180 = 맨 왼쪽). 18칸 뒤 오른쪽 전경에 도착
      catchUpTickSec: 0.3, // 09번 선택 구간에서 09번이 아직 오른쪽에 오지 않았을 때의 째깍 간격
      radiusVh: 33, // 초기 궤도 반지름
      // 카드 폭은 궤도상 위치로 결정된다: 맨 왼쪽 = left, 맨 오른쪽 = right 사이를 보간
      startWidthVh: { left: 4, right: 13 }, // 초기: 겹치지 않는 작은 원형 배열
      endLeftWidthVh: 24, // 마지막 상태의 왼쪽 카드 폭
      endCover: 1.12, // 마지막 상태의 오른쪽 카드 폭 = 화면을 덮는 폭 × 이 값
      growStart: 0.22, // 이 진행률까지는 작은 원형 배열 유지
      exitStart: 0.62, // 이 진행률부터 궤도가 커지며 화면 밖으로 밀려난다
      endRadiusScale: 1.6, // 마지막 상태의 궤도 반지름 배율
      endShift: 1, // 마지막에 궤도 중심이 왼쪽으로 이동하는 양(마지막 반지름 대비). 1 = 오른쪽 카드가 화면 중앙
      // 시계 기준 길이(초기 궤도 반지름 대비) = 초침 100%, 분침 75%, 시침 45%. 바늘 각도는 실제 KST 시간.
      // 카드 안쪽 모서리의 최소 거리(≈ 반지름 × 0.774)보다 짧게 잡아 초침이 어떤 방향에서도 사진에 닿지 않는다.
      handLength: 0.65,
      // 지정 이미지(09)는 이 구간 동안 궤도에서 빠져나와 화면 중앙의 최전경으로 확대된다.
      // 회전 위치와 무관하게 마지막 전경은 항상 09번이다.
      selectStart: 0.66,
      selectEnd: 0.88, // 이 진행률에 09번이 영상과 같은 프레이밍으로 화면을 가득 채움
      // 우측 강조 구간의 기록 정보 라벨(한 번에 1개). 각도 0 = 맨 오른쪽, + = 시계 방향(아래로 지나감)
      // 째깍 위치는 이미지마다 -10° → 0° → +10° 이므로, [-5°, 15°) 이면
      // 정중앙 도착 시 나타나 한 칸 더 머문 뒤 사라지고, 다음 이미지가 오기 전 잠깐 비어 있다.
      label: {
        enterDeg: -5, // 이 각도를 넘어 오른쪽 중앙에 가까워지면 표시
        exitDeg: 15, // 이 각도를 지나면 숨김
        gapPx: 18, // 이미지 가장자리와 텍스트 사이 간격
        marginPx: 24, // 화면 가장자리 안전 여백
        maxCardVw: 0.5, // 강조 이미지가 화면 폭의 이 비율보다 커지면(확대 연출) 숨김
        fadeMs: 280,
      },
    },
    video: {
      fadeStart: 0.88, // 궤도 진행률 기준: 09번 위로 동일 구도의 원본 영상이 겹쳐지기 시작
      fadeEnd: 0.96,
      // 정지 이미지가 영상 첫 화면보다 타이트한 프레이밍이라, 영상을 이 배율에서 시작해
      // 1로 풀어주며(궤도 구간 끝까지) 컷이 튀지 않게 잇는다. 1이면 보정 없음.
      startScale: 1.22,
    },
    hud: {
      vignette: 0.5, // HUD 표시 중 주변부 디밍
      // Bounding Box 3개: 처음엔 모두 희미한 테두리만, 스크롤 단계마다 하나씩 활성화된다.
      enterVh: 18, // 희미한 박스 3개가 나타나는 스크롤 거리
      idleVh: 40, // 박스만 보이고 아무것도 활성화되지 않은 첫 구간(enterVh 포함)
      transitionMs: 520, // 활성 ↔ 비활성 색상·opacity 전환 시간
      // 좌표계 = 원본 영상 픽셀(memory_09_loop.mp4, 1920×1080). 화면에서는 object-fit: cover
      // 크롭을 그대로 재현한 프레임 위에 놓이므로 뷰포트가 바뀌어도 피사체와 정렬된다.
      frame: { w: 1920, h: 1080 },
      // 박스·연결선·텍스트 좌표는 서로 독립. 순서는 content.remember.hud 와 같다.
      //   box   : 피사체를 감싸는 사각형 x, y, w, h
      //   line  : 박스 테두리 위 한 점에서 시작해 텍스트로 이어지는 연결선 꺾임점들
      //   label : 텍스트 기준점 x, y / align = 기준점의 좌·우 어느 쪽으로 글이 뻗는지 /
      //           place = 기준점 위(above)·아래(below)
      targets: [
        {
          // 01 — 케이스 앞 안경. 2~4.5초·8~10초에 손가락에 들려 올라갔다 내려온다(12초 루프).
          box: { x: 205, y: 684, w: 1620, h: 326 },
          // 실제 영상 프레임에서 측정한 값(0.5초 간격)
          track: [
            [0, 205, 684, 1825, 1010],
            [1.6, 205, 684, 1825, 1010],
            [2.0, 205, 665, 1825, 1000],
            [2.5, 150, 568, 1800, 985],
            [3.0, 165, 503, 1800, 950],
            [3.5, 165, 552, 1805, 988],
            [4.0, 205, 609, 1830, 995],
            [4.5, 205, 665, 1830, 1005],
            [5.0, 205, 684, 1825, 1010],
            [7.5, 205, 684, 1825, 1010],
            [8.0, 205, 609, 1825, 997],
            [8.5, 140, 560, 1800, 975],
            [9.0, 120, 509, 1800, 960],
            [9.5, 150, 560, 1805, 985],
            [10.0, 205, 665, 1825, 1005],
            [10.5, 205, 684, 1825, 1010],
            [12, 205, 684, 1825, 1010],
          ],
          line: [
            [968, 684],
            [1004, 646],
            [1260, 646],
          ],
          label: { x: 1010, y: 640, align: "left", place: "above" },
        },
        {
          // 02 — 왼쪽 배경 실내: 스탠드 조명·창·꽃병
          box: { x: 86, y: 168, w: 330, h: 496 },
          line: [
            [416, 236],
            [456, 186],
            [700, 186],
          ],
          label: { x: 462, y: 180, align: "left", place: "above" },
        },
        {
          // 03 — 오른쪽 어깨·셔츠에 떨어지는 자연광
          box: { x: 1482, y: 330, w: 378, h: 290 },
          line: [
            [1716, 330],
            [1756, 270],
            [1796, 270],
          ],
          label: { x: 1796, y: 264, align: "right", place: "above" },
        },
      ] as HudTarget[],
      memoryLog: { insetVw: 2.6, insetVh: 4 }, // MEMORY LOG — 화면(영상) 오른쪽 위 가장자리 고정
    },
    ending: {
      dim: 0.26, // 문구 가독성을 위한 영상 디밍
      risePx: 44, // 문구가 아래에서 올라오는 거리
    },
  },

  /** prefers-reduced-motion: 회전 속도·일렁임을 줄인 안전 값 */
  reduced: {
    orbitTickSec: 2,
    maskWobble: 0,
    maskFollow: 1,
  },
} as const;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
