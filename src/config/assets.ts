// 모든 미디어 경로의 유일한 정의 위치.
// 디스크: public/assets/...  →  브라우저 URL: /assets/...
// 배포 경로(GitHub Pages 하위 경로 등)와 무관하게 동작하도록 BASE_URL 기준으로 만든다.
const BASE = import.meta.env.BASE_URL;
const HERO_FRAME_COUNT = 90;

export const assets = {
  hero: {
    frameCount: HERO_FRAME_COUNT,
    frameWidth: 1600,
    frameHeight: 900,
    frameFps: 15, // 시퀀스 추출 FPS. 실제 재생 타이밍은 스크롤 진행도만 사용.
    frames: Array.from(
      { length: HERO_FRAME_COUNT },
      (_, i) => `${BASE}assets/hero/frames/frame_${String(i + 1).padStart(4, "0")}.webp`,
    ),
  },
  reinterpret: {
    originalImage: `${BASE}assets/reinterpret/reinterpret_original.webp`,
    aiVideo: `${BASE}assets/reinterpret/reinterpret_ai.mp4`,
    aiPoster: `${BASE}assets/reinterpret/reinterpret_ai_poster.webp`,
  },
  reframe: {
    states: [
      `${BASE}assets/reframe/reframe_00_distract.webp`,
      `${BASE}assets/reframe/reframe_01_left_removed.webp`,
      `${BASE}assets/reframe/reframe_02_sides_removed.webp`,
      `${BASE}assets/reframe/reframe_03_focus_sunlit.webp`,
    ],
  },
  remember: {
    images: Array.from(
      { length: 12 },
      (_, i) => `${BASE}assets/remember/memory_${String(i + 1).padStart(2, "0")}.webp`,
    ),
    selectedMemoryId: "09",
    originalVideo: `${BASE}assets/remember/memory_09_loop.mp4`,
    videoAspect: 16 / 9,
  },
  product: {
    image: `${BASE}assets/product/ai_glasses_product.webp`,
  },
} as const;
