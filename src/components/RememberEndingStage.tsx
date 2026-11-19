import { useEffect, useRef, type CSSProperties } from "react";
import { assets } from "../config/assets";
import { content } from "../config/content";
import { motion, prefersReducedMotion } from "../config/motion";
import { gsap, ScrollTrigger, clamp01, lerp } from "../lib/gsap";

const cfg = motion.remember;
const seg = cfg.segments;
const intro = cfg.intro;
const hudItems = content.remember.hud;
const hudFrame = cfg.hud.frame;
const pctX = (v: number) => `${((v / hudFrame.w) * 100).toFixed(4)}%`;
const pctY = (v: number) => `${((v / hudFrame.h) * 100).toFixed(4)}%`;
const headlineParts = content.ending.headlineParts;
const memoryLog = content.remember.memoryLog;
const memories = content.remember.memories;

// 스크롤 단계의 시작 지점(vh).
const T = (() => {
  // 진입: 카피 fade out 과 초침 소멸은 같은 지점(fadeStart)에서 시작한다.
  const fadeStart = intro.holdVh;
  const moveStart = fadeStart + intro.fadeVh * intro.moveDelay; // 카피가 충분히 사라진 뒤
  const cardsStart = moveStart + intro.moveVh; // 시계가 중앙에 도착
  // 궤도는 시계가 중앙에 도착하고 이미지가 나타나기 시작한 뒤부터 움직인다(회전·확대 모두).
  const orbitStart = cardsStart + intro.cardsVh * intro.orbitDelay;
  const orbitEnd = orbitStart + seg.orbitVh;
  const videoStart = orbitStart + seg.orbitVh * cfg.video.fadeStart;
  const videoEnd = orbitStart + seg.orbitVh * cfg.video.fadeEnd;
  const hudStart = orbitEnd;
  const hudSteps = hudStart + cfg.hud.idleVh; // 이 지점부터 박스 1 → 2 → 3 활성
  const hudExit = hudSteps + hudItems.length * seg.hudVh;
  const copyStart = hudExit + seg.hudExitVh;
  const promise = copyStart + headlineParts.length * seg.copyVh;
  const total = promise + seg.promiseVh + seg.holdVh;
  return { fadeStart, moveStart, cardsStart, orbitStart, orbitEnd, videoStart, videoEnd, hudStart, hudSteps, hudExit, copyStart, promise, total };
})();

const selectedIndex = Number(assets.remember.selectedMemoryId) - 1;
const DEG = Math.PI / 180;
const STEP_DEG = 360 / assets.remember.images.length;
const CARD_ASPECT = 3 / 2; // .orbit-card 의 aspect-ratio
const CARD_LAYOUT_VW = 60; // .orbit-card 의 레이아웃 폭(scenes.css)
const smooth = (t: number) => t * t * (3 - 2 * t);

// ── 실시간 아날로그 시계(KST) ─────────────────────────────
// 시계침은 궤도 회전·스크롤과 완전히 독립. 매 프레임 시스템 시간(Date.now())에서
// 각도를 직접 계산하므로 오래 열어두어도 오차가 누적되지 않는다.
const KST_OFFSET_MS = 9 * 3600 * 1000; // Asia/Seoul: UTC+9, 서머타임 없음
const clockAngles = (nowMs: number) => {
  const t = (nowMs + KST_OFFSET_MS) % (12 * 3600 * 1000); // 12시간 주기 내 경과(ms)
  return {
    hour: (t / (12 * 3600 * 1000)) * 360, // 12시 = 0°, 시계 방향
    minute: ((t % 3600000) / 3600000) * 360,
    second: ((t % 60000) / 60000) * 360, // 밀리초까지 반영 → 부드러운 연속 회전
  };
};
// 12시 방향(-y)으로 향하는 바늘 경로. base = 시작 두께, tip = 끝 두께.
const taperPath = (len: number, base: number, tip: number, tail = 0) => {
  const b = base / 2;
  const p = tip / 2;
  return `M${-b} ${tail} L${-p} ${-len} L${p} ${-len} L${b} ${tail} Z`;
};

export function RememberEndingStage() {
  const sectionRef = useRef<HTMLElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const clockRef = useRef<SVGSVGElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const noteWhenRef = useRef<HTMLSpanElement>(null);
  const noteWhatRef = useRef<HTMLSpanElement>(null);
  const hourRef = useRef<SVGGElement>(null);
  const minuteRef = useRef<SVGGElement>(null);
  const secondRef = useRef<SVGGElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const hudLayerRef = useRef<HTMLDivElement>(null);
  const hudRefs = useRef<(HTMLDivElement | null)[]>([]);
  const endingDimRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const promiseRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const section = sectionRef.current!;
    const group = groupRef.current!;
    const clock = clockRef.current!;
    const hourHand = hourRef.current!;
    const minuteHand = minuteRef.current!;
    const secondHand = secondRef.current!;
    const hourPath = hourHand.querySelector("path")!;
    const minutePath = minuteHand.querySelector("path")!;
    const secondLine = secondHand.querySelector("line")!;
    const secondTail = secondHand.querySelector("rect")!;
    let clockLen = 0;
    const video = videoRef.current!;
    const cards = [...cardRefs.current] as HTMLDivElement[]; // 복사본: 언마운트 시 ref가 null로 비워져도 안전
    const hudBoxes = [...hudRefs.current] as HTMLDivElement[];
    let hudStep = -1;
    // 움직이는 피사체를 따라가는 박스(track 이 있는 타깃만)
    const hudTracks = hudBoxes
      .map((el, i) => ({
        t: cfg.hud.targets[i],
        box: el.querySelector<HTMLElement>(".hud-box")!,
        rel: el.querySelector<HTMLElement>(".hud-rel")!,
      }))
      .filter((h) => h.t.track && h.t.track.length > 1);
    let hudVisible = false;

    const o = cfg.orbit;
    const reduced = prefersReducedMotion();
    const tickSec = reduced ? motion.reduced.orbitTickSec : o.tickSec;
    const overshoot = reduced ? 0 : o.tickOvershoot;
    // 한 칸 이동의 이징: 빠르게 넘어가 살짝 지나쳤다가 멈춘다(초침).
    const tickEase = (u: number) =>
      1 + (overshoot + 1) * Math.pow(u - 1, 3) + overshoot * Math.pow(u - 1, 2);

    // 스크롤(타임라인 스크럽)이 제어하는 상태. 회전각은 여기에 없다.
    const st = {
      grow: 0, // 궤도 구간 진행률 0~1 → 카드 크기·겹침·퇴장만 결정
      video: 0, // 원본 영상 노출 0~1
      videoScale: cfg.video.startScale as number,
      enter: 0, // 진입 시 시계 노출 0~1(카피와 동시)
      second: 1, // 초침 노출 1~0(카피 fade out 과 동시)
      clockMove: 0, // 시계 우측 → 중앙 0~1
      cards: 0, // 기억 이미지 노출 0~1(시계 중앙 도착 후)
    };
    // 시간이 제어하는 상태. 스크롤 진행률과 무관하게 일정 간격으로 한 칸씩 증가한다.
    const baseAngle = o.startAngleDeg - selectedIndex * STEP_DEG; // 09번이 startAngleDeg 에서 출발
    let ticks = 0; // 지금까지 째깍인 횟수
    let sinceTick: number = o.tickMoveSec; // 마지막 째깍 이후 경과(초). 처음엔 정지 상태
    let angle = baseAngle;
    let inView = false;

    // ── 우측 강조 구간 기록 라벨 ─────────────────────────────
    // 라벨 DOM 은 하나뿐이다. 활성 이미지 index 가 바뀌면 이전 텍스트를 페이드아웃한 뒤
    // 내용을 교체하고 새 이미지 옆에서 페이드인한다 → 두 이미지의 텍스트가 동시에 보이지 않는다.
    const note = noteRef.current!;
    const noteWhen = noteWhenRef.current!;
    const noteWhat = noteWhatRef.current!;
    const nc = o.label;
    note.style.setProperty("--note-ms", `${nc.fadeMs}ms`);
    let noteIdx = -1; // 현재 라벨에 들어 있는 텍스트의 이미지 index
    let noteOn = false; // 표시 클래스 적용 여부
    let noteHideAt = 0; // 페이드아웃이 끝나는 시각(performance.now)
    let noteW = 0;
    let noteH = 0;
    const gx = new Float32Array(cards.length);
    const gy = new Float32Array(cards.length);
    const gw = new Float32Array(cards.length);

    const setNote = (on: boolean) => {
      if (on === noteOn) return;
      noteOn = on;
      note.classList.toggle("is-visible", on);
      if (!on) noteHideAt = performance.now() + nc.fadeMs;
    };

    // target = 강조 구간에 있는 이미지 index(-1 = 없음). 매 렌더마다 호출.
    const syncNote = (target: number, vw: number, vh: number) => {
      if (target !== noteIdx) {
        if (noteOn) setNote(false);
        else if (performance.now() >= noteHideAt) {
          noteIdx = target;
          if (target >= 0) {
            const m = memories[target];
            noteWhen.textContent = `${m.date}  ${m.time}`;
            noteWhat.textContent = m.activity;
            noteW = note.offsetWidth;
            noteH = note.offsetHeight;
          }
        }
      }
      if (noteIdx < 0) return;
      if (target === noteIdx) setNote(true);

      // 위치: 해당 이미지의 오른쪽, 세로 중앙. 화면 밖으로 잘리면 이미지 아래(또는 위)로 보정.
      const w = gw[noteIdx];
      const h = w / CARD_ASPECT;
      const cxs = vw / 2 + gx[noteIdx];
      const cys = vh / 2 + gy[noteIdx];
      const m = nc.marginPx;
      let left = cxs + w / 2 + nc.gapPx;
      let top = cys - noteH / 2;
      if (left + noteW > vw - m) {
        left = cxs + w / 2 - noteW; // 이미지 오른쪽 끝에 맞춰 정렬
        top = cys + h / 2 + nc.gapPx;
        if (top + noteH > vh - m) top = cys - h / 2 - nc.gapPx - noteH;
      }
      left = Math.min(Math.max(left, m), vw - m - noteW);
      top = Math.min(Math.max(top, m), vh - m - noteH);
      note.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
    };

    const syncVideo = () => {
      video.style.opacity = String(st.video);
      video.style.transform = st.videoScale === 1 ? "" : `scale(${st.videoScale.toFixed(4)})`;
      video.style.visibility = st.video > 0 ? "visible" : "hidden";
      if (st.video > 0) {
        // 노출 시점부터 ENDING 끝까지 같은 인스턴스가 계속 재생된다(재시작·seek 없음).
        if (inView && video.paused) video.play().catch(() => {});
      } else if (!video.paused || video.currentTime !== 0) {
        // 영상이 전혀 보이지 않는 구간에서만 첫 화면으로 대기
        video.pause();
        video.currentTime = 0;
      }
      section.dataset.video = st.video > 0 ? "visible" : "hidden";
      group.style.visibility = st.video >= 1 ? "hidden" : "visible";
    };

    // HUD 활성 단계: 타임라인 위치(스크럽 반영)로부터 결정적으로 계산한다.
    // 같은 스크롤 위치 = 같은 단계 → 역스크롤 시 이전 단계로 정확히 복원된다.
    // 단계 간 색상·opacity 보간은 CSS transition 이 담당(스크롤 속도와 무관하게 부드럽게).
    const syncHud = (time: number) => {
      // -1 = 아무것도 활성화되지 않은 첫 구간(희미한 박스만), 이후 0 → 1 → 2
      const raw = Math.floor((time - T.hudSteps) / seg.hudVh);
      const step = Math.min(hudBoxes.length - 1, Math.max(-1, raw));
      hudVisible = time > T.hudStart && time < T.hudExit + seg.hudExitVh;
      if (step === hudStep) return;
      hudStep = step;
      hudBoxes.forEach((target, i) => {
        const active = i === step;
        target.classList.toggle("is-active", active);
        target.setAttribute("aria-hidden", active ? "false" : "true");
      });
    };

    // 궤도 렌더: 위치 = 회전각(시간), 크기 = 궤도상 좌우 위치 × 스크롤 진행률.
    const renderOrbit = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const unit = vh / 100;

      // 스크롤 진행률 → 확대량(0~1)과 퇴장량(0~1)
      const growT = smooth(clamp01((st.grow - o.growStart) / (1 - o.growStart)));
      const exitT = smooth(clamp01((st.grow - o.exitStart) / (1 - o.exitStart)));

      // 좌/우 끝 카드의 폭. 배율이 일정하게 느껴지도록 지수 보간한다.
      const coverW = Math.max(vw, vh * CARD_ASPECT) * o.endCover;
      const wRight0 = o.startWidthVh.right * unit;
      const wLeft0 = o.startWidthVh.left * unit;
      const wRight = wRight0 * Math.pow(coverW / wRight0, growT);
      const wLeft = wLeft0 * Math.pow((o.endLeftWidthVh * unit) / wLeft0, growT);

      // 퇴장: 궤도가 커지면서 중심이 왼쪽으로 빠져 구조 전체가 화면 밖으로 벗어난다.
      const radius0 = o.radiusVh * unit;
      const radius = radius0 * lerp(1, o.endRadiusScale, exitT);
      const cx = -radius0 * o.endRadiusScale * o.endShift * exitT;
      const layoutW = (CARD_LAYOUT_VW * vw) / 100;

      // 지정 이미지(09): 궤도 위 현재 위치에서 화면 중앙·최전경으로 빠져나오는 정도(0~1)
      const selT = smooth(clamp01((st.grow - o.selectStart) / (o.selectEnd - o.selectStart)));
      // 09번이 영상과 같은 프레이밍으로 화면을 덮는 폭
      const selectW = Math.max(vw, vh * assets.remember.videoAspect);

      let focus = -1; // 우측 강조 구간에 들어온 이미지 index
      for (let i = 0; i < cards.length; i++) {
        const deg = angle + i * STEP_DEG;
        const rel = ((((deg % 360) + 540) % 360) - 180); // -180~180, 0 = 맨 오른쪽
        if (rel >= o.label.enterDeg && rel < o.label.exitDeg) focus = i;
        const theta = deg * DEG; // 화면 좌표(y 아래) 기준 → 시계 방향
        const right = (Math.cos(theta) + 1) / 2; // 0 = 맨 왼쪽, 1 = 맨 오른쪽
        let x = cx + radius * Math.cos(theta);
        let y = radius * Math.sin(theta);
        let w = lerp(wLeft, wRight, right);
        let z = 1 + Math.round(right * 1000); // 오른쪽일수록 앞
        const el = cards[i];
        if (i === selectedIndex) {
          if (selT > 0) {
            x = lerp(x, 0, selT);
            y = lerp(y, 0, selT);
            w = w * Math.pow(selectW / w, selT);
            z = 2000;
          }
          el.style.borderRadius = selT > 0 ? `${(0.9 * (1 - selT)).toFixed(3)}vw` : "";
        }
        // 카드 자체는 회전시키지 않는다(정방향 유지).
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${(w / layoutW).toFixed(5)})`;
        el.style.zIndex = String(z);
        gx[i] = x;
        gy[i] = y;
        gw[i] = w;
      }

      // 라벨은 궤도가 움직이는 동안(타이틀 퇴장 후 ~ 09번 선택 전), 강조 이미지가 아직 작을 때만.
      const labelOk =
        focus >= 0 && st.grow > 0.0005 && st.grow < o.selectStart && gw[focus] < vw * o.label.maxCardVw;
      syncNote(labelOk ? focus : -1, vw, vh);

      // 시계: 각도는 실제 시간(renderClock)이 결정. 여기서는 노출·위치만 제어한다.
      //   진입 fade in → 초침 소멸 → 우측에서 중앙으로 이동 → 확대 시작 시 사라짐
      clock.style.opacity = String(st.enter * clamp01(1 - growT * 6));
      secondHand.style.opacity = String(st.second);
      const clockX = ((intro.clockRightVw * vw) / 100) * (1 - st.clockMove);
      clock.style.transform = clockX ? `translate3d(${clockX.toFixed(2)}px, 0, 0)` : "";
      group.style.setProperty("--orbit-cards", st.cards.toFixed(4));

      section.dataset.grow = st.grow.toFixed(3);
    };

    // 바늘 형상: 기존 시계침 길이(초기 궤도 반지름 × handLength)를 기준으로 리사이즈 때만 갱신
    const layoutClock = () => {
      const len = (o.radiusVh * window.innerHeight) / 100 * o.handLength;
      if (len === clockLen) return;
      clockLen = len;
      hourPath.setAttribute("d", taperPath(len * 0.45, 4, 1.2, 4));
      minutePath.setAttribute("d", taperPath(len * 0.75, 2.5, 0.4, 5));
      secondLine.setAttribute("y2", (-len).toFixed(1));
      const tail = Math.max(14, len * 0.16); // 카운터웨이트(중심축 뒤)
      secondLine.setAttribute("y1", tail.toFixed(1));
      secondTail.setAttribute("y", (tail * 0.45).toFixed(1));
      secondTail.setAttribute("height", (tail * 0.55).toFixed(1));
    };

    // 실시간 각도 적용. 궤도 회전·스크롤 상태를 전혀 참조하지 않는다.
    const renderClock = () => {
      const a = clockAngles(Date.now());
      hourHand.setAttribute("transform", `rotate(${a.hour.toFixed(3)})`);
      minuteHand.setAttribute("transform", `rotate(${a.minute.toFixed(3)})`);
      secondHand.setAttribute("transform", `rotate(${a.second.toFixed(3)})`);
    };

    // HUD 박스 추적: 영상 재생 시간 → 키프레임 보간. 스크롤과 무관하게 영상 루프에 맞춰 움직인다.
    const renderHudTracks = () => {
      const now = video.currentTime;
      for (const h of hudTracks) {
        const k = h.t.track!;
        let j = 0;
        while (j < k.length - 2 && now >= k[j + 1][0]) j++;
        const a = k[j];
        const b = k[j + 1];
        const u = smooth(clamp01((now - a[0]) / (b[0] - a[0] || 1)));
        const [l, t, r, bt] = [1, 2, 3, 4].map((n) => lerp(a[n], b[n], u));
        h.box.style.left = pctX(l);
        h.box.style.top = pctY(t);
        h.box.style.width = pctX(r - l);
        h.box.style.height = pctY(bt - t);
        // 연결선·텍스트: 박스 좌상단 이동량만큼 평행 이동(.hud-rel 은 프레임과 같은 크기 → % = 영상 비율)
        h.rel.style.translate = `${pctX(l - h.t.box.x)} ${pctY(t - h.t.box.y)}`;
      }
    };

    // 자동 회전: 프레임 시간만으로 째깍임을 진행한다. 궤도가 보이는 동안만 다시 그린다.
    const tick = (_time: number, deltaMs: number) => {
      sinceTick += Math.min(deltaMs, 100) / 1000;
      // 타이틀이 완전히 사라지기 전(궤도 진행 0)에는 움직이지 않는다.
      const running = inView && st.grow > 0.0005;
      // 09번 선택 구간: 09번이 맨 오른쪽(전경 자리)에 도착하면 그 자리에서 멈춘다.
      const selecting = st.grow >= o.selectStart;
      const selectedDeg = (((o.startAngleDeg + ticks * o.tickDeg) % 360) + 360) % 360;
      const settled = selecting && (selectedDeg < 0.5 || selectedDeg > 359.5);
      const interval = selecting ? Math.min(tickSec, o.catchUpTickSec) : tickSec;
      if (running && !settled && sinceTick >= interval) {
        ticks++;
        sinceTick = 0;
      }
      const move = tickEase(clamp01(sinceTick / o.tickMoveSec));
      angle = baseAngle + (ticks - 1 + move) * o.tickDeg;
      if (inView && st.video < 1) {
        renderOrbit();
        renderClock();
      }
      if (inView && hudVisible) renderHudTracks();
    };

    const onResize = () => {
      layoutClock();
      renderOrbit();
      renderClock();
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: motion.scrub.smooth,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          syncVideo();
          syncHud(tl.time());
        },
      });

      // 1. 진입: 섹션이 들어오는 동안 메인 카피와 시계가 함께 fade in (각자 자리에 고정)
      const copy = copyRef.current!;
      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: intro.enterStart,
            end: intro.enterEnd,
            scrub: motion.scrub.smooth,
          },
        })
        .fromTo(copy, { autoAlpha: 0 }, { autoAlpha: 1, ease: "power1.out", duration: 1 }, 0)
        .fromTo(st, { enter: 0 }, { enter: 1, ease: "power1.out", duration: 1 }, 0);

      // 2. 초침 소멸 + 메인 카피 fade out(위로 살짝) — 정확히 같은 시작점·같은 길이
      tl.fromTo(
        st,
        { second: 1 },
        { second: 0, ease: "sine.inOut", duration: intro.fadeVh },
        T.fadeStart,
      );
      tl.fromTo(
        copy,
        { y: 0, opacity: 1 },
        { y: -intro.copyLiftPx, opacity: 0, ease: "sine.inOut", duration: intro.fadeVh, immediateRender: false },
        T.fadeStart,
      );

      // 3. 시계: 카피가 충분히 사라진 뒤 우측 → 중앙. 크기는 그대로, 위치만 이동
      tl.fromTo(
        st,
        { clockMove: 0 },
        { clockMove: 1, ease: "power2.inOut", duration: intro.moveVh },
        T.moveStart,
      );

      // 4. 중앙 도착 후 기억 이미지가 시계 주위로 나타나며 궤도 인터랙션으로 이어진다
      tl.fromTo(
        st,
        { cards: 0 },
        { cards: 1, ease: "power1.out", duration: intro.cardsVh },
        T.cardsStart,
      );

      // 2. 궤도 구간: 스크롤은 확대 진행률만 움직인다(회전과 무관).
      tl.to(st, { grow: 1, duration: seg.orbitVh }, T.orbitStart);

      // 3. 화면을 덮은 09번 위로 동일 구도의 원본 영상이 겹쳐지며 S04 궤도 종료
      tl.to(st, { video: 1, duration: T.videoEnd - T.videoStart }, T.videoStart);
      tl.to(
        st,
        { videoScale: 1, duration: T.orbitEnd - T.videoStart, ease: "power2.out" },
        T.videoStart,
      );

      // 5~7. HUD: 희미한 Bounding Box 3개가 함께 나타나고, 스크롤 단계마다 01 → 02 → 03 활성 전환.
      //       전환 자체는 syncHud(onUpdate)가 담당한다.
      tl.fromTo(
        vignetteRef.current,
        { opacity: 0 },
        { opacity: cfg.hud.vignette, duration: seg.hudVh * 0.6 },
        T.hudStart,
      );
      tl.fromTo(
        hudLayerRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: cfg.hud.enterVh, ease: "power1.out" },
        T.hudStart,
      );

      // 8. HUD·보조 효과 퇴장 → 원본 영상만
      tl.to(
        hudLayerRef.current,
        { autoAlpha: 0, duration: seg.hudExitVh * 0.7, ease: "power1.inOut" },
        T.hudExit + seg.hudExitVh * 0.1,
      );
      tl.to(
        vignetteRef.current,
        { opacity: 0, duration: seg.hudExitVh * 0.7, ease: "power1.inOut", immediateRender: false },
        T.hudExit + seg.hudExitVh * 0.1,
      );

      // 9~11. ENDING 문구 SEE. / LOOK AT. / WATCH.
      tl.fromTo(
        endingDimRef.current,
        { opacity: 0 },
        { opacity: cfg.ending.dim, duration: seg.copyVh },
        T.copyStart,
      );
      wordRefs.current.forEach((word, i) => {
        tl.fromTo(
          word,
          { autoAlpha: 0, y: cfg.ending.risePx },
          { autoAlpha: 1, y: 0, duration: seg.copyVh * 0.8, ease: "power2.out" },
          T.copyStart + i * seg.copyVh + seg.copyVh * 0.1,
        );
      });
      // 12. 브랜드 문구
      tl.fromTo(
        promiseRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: seg.promiseVh * 0.8, ease: "power1.out" },
        T.promise + seg.promiseVh * 0.1,
      );
      // 13. 유지 후 pin 해제 → 일반 스크롤로 제품 패널
      tl.set({}, {}, T.total);

      // 스테이지가 화면 밖이면 영상 일시정지(위치 유지), 돌아오면 이어서 재생
      const visibility = ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          inView = self.isActive;
          if (!inView) video.pause();
          else if (st.video > 0) video.play().catch(() => {});
        },
        onRefresh: (self) => {
          inView = self.isActive;
        },
      });
      inView = visibility.isActive;
    });

    onResize();
    syncVideo();
    gsap.ticker.add(tick);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(tick);
      ctx.revert();
    };
  }, []);

  const { headline: introHeadline, body: introBody } = content.remember.intro;

  return (
    <section
      className="remember"
      data-scene="remember-ending"
      ref={sectionRef}
      style={{ height: `${100 + T.total}vh` }}
    >
      <div className="stage remember-stage">
        {/* S04 — 기억 이미지 궤도: 자동 회전 + 스크롤 확대 */}
        <div className="orbit" ref={groupRef}>
          {assets.remember.images.map((src, i) => (
            <div
              key={src}
              className="orbit-card"
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
            >
              <img src={src} alt="" decoding="async" draggable={false} />
            </div>
          ))}
          {/* 실시간 아날로그 시계(KST). 카드와 형제 요소로, 카드 transform 을 상속하지 않는다. */}
          <svg className="orbit-clock" ref={clockRef} width="2" height="2" aria-hidden="true">
            <defs>
              <radialGradient id="orbit-clock-hub" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#F4F6F7" />
                <stop offset="100%" stopColor="#A9B1B6" />
              </radialGradient>
            </defs>
            <g className="clock-hour" ref={hourRef}>
              <path />
            </g>
            <g className="clock-minute" ref={minuteRef}>
              <path />
            </g>
            <g className="clock-second" ref={secondRef}>
              <line x1="0" y1="0" x2="0" y2="0" />
              <rect x="-1" y="0" width="2" height="0" rx="1" />
            </g>
            <circle className="clock-hub" r="4.5" />
            <circle className="clock-hub-core" r="1.5" />
          </svg>
          {/* 우측 강조 구간 이미지의 기록 정보(한 번에 하나). 위치·내용은 컴포넌트가 index 기준으로 제어 */}
          <div className="orbit-note" ref={noteRef} aria-hidden="true">
            <span className="orbit-note-when" ref={noteWhenRef} />
            <span className="orbit-note-what" ref={noteWhatRef} />
          </div>
        </div>

        {/* S04 진입 메인 카피(좌상단) — 시계와 동시에 등장, 초침과 동시에 퇴장 */}
        <div className="remember-copy" ref={copyRef}>
          <h2 className="remember-copy-headline">{introHeadline}</h2>
          <p className="remember-copy-body">{introBody}</p>
        </div>

        {/* S04→S05 공유 원본 영상 — 단 하나의 <video> 인스턴스 */}
        <video
          className="remember-video"
          ref={videoRef}
          src={assets.remember.originalVideo}
          muted
          loop
          playsInline
          preload="auto"
          aria-label="안경을 집어 드는 순간의 기록 영상"
          tabIndex={-1}
        />

        {/* S04 — HUD: 영상 속 피사체를 감싸는 AI Bounding Box 3개 + MEMORY LOG */}
        <div className="hud-vignette" ref={vignetteRef} />
        <div
          className="hud-layer"
          ref={hudLayerRef}
          style={{ "--hud-ms": `${cfg.hud.transitionMs}ms` } as CSSProperties}
        >
          {/* 영상의 object-fit: cover 표시 영역과 정확히 같은 프레임(영상 픽셀 좌표계) */}
          <div className="hud-frame">
            {hudItems.map((item, i) => {
              const t = cfg.hud.targets[i];
              return (
                <div
                  key={item.id}
                  id={item.id}
                  className="hud-target"
                  aria-hidden="true"
                  ref={(el) => {
                    hudRefs.current[i] = el;
                  }}
                >
                  <i
                    className="hud-box"
                    style={{
                      left: pctX(t.box.x),
                      top: pctY(t.box.y),
                      width: pctX(t.box.w),
                      height: pctY(t.box.h),
                    }}
                  />
                  {/* 연결선 + 외부 텍스트: 박스가 움직이면 함께 평행 이동 */}
                  <div className="hud-rel">
                  <svg
                    className="hud-link"
                    viewBox={`0 0 ${hudFrame.w} ${hudFrame.h}`}
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <polyline
                      points={t.line.map((p) => p.join(",")).join(" ")}
                      pathLength={1}
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  <div
                    className={`hud-label hud-label--${t.label.align} hud-label--${t.label.place}`}
                    style={{ left: pctX(t.label.x), top: pctY(t.label.y) }}
                  >
                    <span className="hud-title">
                      <b>{item.index}</b>
                      {item.label}
                    </span>
                    <span className="hud-value">{item.value}</span>
                    <span className="hud-caption">{item.caption}</span>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>

          <dl
            className="hud-log"
            style={{
              right: `${cfg.hud.memoryLog.insetVw}vw`,
              top: `${cfg.hud.memoryLog.insetVh}vh`,
            }}
          >
            <dt>
              {memoryLog.title} <b>{memoryLog.entry}</b>
            </dt>
            <dd>
              {memoryLog.date}
              <span>{memoryLog.time}</span>
            </dd>
          </dl>
        </div>

        {/* S05 — ENDING 문구 */}
        <div className="ending-dim" ref={endingDimRef} />
        <div className="ending-copy">
          <h2 className="ending-headline">
            {headlineParts.map((part, i) => (
              <span
                key={part}
                ref={(el) => {
                  wordRefs.current[i] = el;
                }}
              >
                {part}
              </span>
            ))}
          </h2>
          <p className="ending-promise" ref={promiseRef}>
            {content.ending.promise}
          </p>
        </div>
      </div>
    </section>
  );
}
