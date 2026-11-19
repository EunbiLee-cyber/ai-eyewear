// 섹션 문구, HUD 텍스트, 안내 문구.
export const content = {
  hero: {
    headline: "INTELLIGENCE EYEWEAR",
    left: "같은 세상",
    center: "완전히",
    right: "다른 시선",
  },
  reinterpret: {
    title: "REINTERPRET",
    subtitle: "익숙한 것은\n낯설고 새로운 시선으로",
    hint: "CLICK TO EXPLORE",
    originalAlt: "맑은 하늘 아래의 옥상 농구 코트",
    // S02 인터랙션 하단 설명. body는 [텍스트, 강조 여부] 조각으로 나눈다.
    note: {
      headline: "상상은 더 이상 머릿속에만 머무르지 않습니다.",
      body: [
        ["AI 필터를 통해 ", false],
        ["전혀 다른 세계를 직접 시선으로 느끼는 미래", true],
        [", 커서를 움직여 ", false],
        ["INTELLIGENCE EYEWEAR", true],
        ["가 제안하는 미래의 시각 경험을 미리 만나보세요. 같은 공간에서도 새로운 풍경을 발견하고, 새로운 시선으로 세상을 경험할 수 있습니다.", false],
      ],
    },
  },
  reframe: {
    title: "REFRAME",
    subtitle: "오직 원하는 것에만\n집중하도록",
    topLabel: "DISTRACT",
    bottomLabel: "FOCUS",
    sceneAlt: "책상과 노트북이 놓인 사무 공간. 스크롤에 따라 주변 가구가 정리되고 햇빛이 들어온다.",
    // S03 인터랙션 하단 설명. S02 note와 같은 형식.
    note: {
      headline: "시선에도 선택이 필요하니까.",
      body: [
        ["세상의 모든 것을 바라볼 필요는 없습니다. 불필요한 시각적 소음은 덜어내고, 원하는 순간에 온전히 집중하는 경험. ", false],
        ["INTELLIGENCE EYEWEAR", true],
        ["가 제안하는 ", false],
        ["시각적 노이즈 캔슬링", true],
        [". 스크롤을 내려 새로운 집중의 경험을 만나보세요.", false],
      ],
    },
  },
  remember: {
    // S04 진입 메인 카피(좌상단). 시계와 함께 나타나고 초침이 사라질 때 함께 사라진다.
    intro: {
      headline: "스쳐간 순간을, 다시 읽다.",
      body:
        "기억은 단순히 지나간 장면을 되돌려 보는 것에서 끝나지 않습니다. 그때의 시간과 공간, 미처 알아채지 못했던 작은 정보까지. INTELLIGENCE EYEWEAR는 기록된 순간을 새로운 시선으로 다시 탐색하는 미래를 제안합니다. 스크롤을 내려 기억 속에 담긴 정보를 발견해 보세요.",
    },
    selectedMemoryId: "09",
    // 시연용 표기 — 실제 추론 결과가 아니다. 단, memory_09 영상에 실제로 보이는 대상만 다룬다.
    // 반드시 3개, 배치는 motion.remember.hud.targets 와 같은 순서.
    hud: [
      { id: "hud-01", index: "01", label: "OBJECT DETECTED", value: "EYEWEAR", caption: "TORTOISESHELL FRAME" },
      { id: "hud-02", index: "02", label: "SCENE RECOGNITION", value: "INDOOR", caption: "WINDOW · LAMP · FLOWERS" },
      { id: "hud-03", index: "03", label: "AMBIENT LIGHT", value: "DAYLIGHT", caption: "WARM · DIFFUSED" },
    ],
    // 영상 가장자리에 고정되는 작은 기록 정보(시연용 값)
    memoryLog: { title: "MEMORY LOG", entry: "09", date: "2026.05.14", time: "09:42:16" },
    // 궤도 기억 이미지별 기록 정보. 순서 = assets.remember.images (memory_01 ~ memory_12)
    memories: [
      { date: "2030.11.19", time: "07:00", activity: "아침 식사" },
      { date: "2030.11.19", time: "08:00", activity: "출근길" },
      { date: "2030.11.19", time: "14:00", activity: "오후 업무" },
      { date: "2030.11.21", time: "09:00", activity: "주말 아침 러닝" },
      { date: "2030.11.22", time: "10:00", activity: "주말 아침 수영" },
      { date: "2030.11.22", time: "15:00", activity: "친구와 커피" },
      { date: "2030.11.22", time: "17:00", activity: "집으로 돌아가는 길" },
      { date: "2030.11.24", time: "14:00", activity: "겨울 바다" },
      { date: "2030.11.25", time: "13:00", activity: "약속 가는 길" },
      { date: "2030.11.26", time: "18:00", activity: "퇴근길" },
      { date: "2030.11.27", time: "07:30", activity: "출근 준비" },
      { date: "2030.11.27", time: "17:00", activity: "퇴근 전 회사" },
    ],
  },
  ending: {
    headlineParts: ["SEE.", "LOOK AT.", "WATCH."],
    promise: "Human-led, AI-assisted.",
    productHeadline: "이제 진짜로 경험해보세요",
    productCta: "안경 살펴보기",
    productAlt: "AI 안경 제품 이미지",
  },
  notice: {
    brand: "AI EYEWEAR",
    headline: "BEST VIEWED ON DESKTOP",
    body: "이 경험은 데스크톱 환경에 최적화되어 있습니다.",
  },
} as const;
