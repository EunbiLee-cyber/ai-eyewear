import { useEffect, useRef } from "react";
import { assets } from "../config/assets";
import { content } from "../config/content";
import { motion, prefersReducedMotion } from "../config/motion";
import { gsap, addIntro } from "../lib/gsap";

const { fadeVh } = motion.hero;
const { introVh, holdVh, mask, hintIdleMs } = motion.reinterpret;
// HERO 크로스페이드 동안 이미 고정돼 있도록 HERO 아래로 겹쳐 올린다.
const totalVh = fadeVh + introVh + holdVh;

/**
 * 제어점을 부드럽게 잇는 닫힌 곡선(Catmull-Rom → Bézier).
 * energy(0~1)는 커서 이동량 — 클수록 윤곽을 따라 도는 물결이 강해진다.
 */
function blobPath(
  cx: number,
  cy: number,
  radius: number,
  time: number,
  wobble: number,
  waveAmp: number,
) {
  const n = mask.points;
  const pts: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const noise =
      Math.sin(time * mask.wobbleSpeed + a * 2 + 0.6) * 0.6 +
      Math.sin(time * mask.wobbleSpeed * 1.63 - a * 3 + 2.1) * 0.4;
    const wave =
      Math.sin(a * mask.waveCount - time * mask.waveSpeed) * 0.65 +
      Math.sin(a * (mask.waveCount + 3) + time * mask.waveSpeed * 0.7) * 0.35;
    const r = radius * (1 + wobble * noise + waveAmp * wave);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let k = 0; k < n; k++) {
    const p0 = pts[(k - 1 + n) % n];
    const p1 = pts[k];
    const p2 = pts[(k + 1) % n];
    const p3 = pts[(k + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

const EMPTY_CLIP = "path('M0 0Z')";

export function Reinterpret() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current!;
    const video = videoRef.current!;
    const hintEl = hintRef.current!;
    // SVG clipPath(url) 참조는 일부 브라우저에서 영상 프레임 갱신을 멈추게 하므로 CSS path()로 직접 자른다.
    const setClip = (d: string) => {
      video.style.clipPath = d === EMPTY_CLIP ? d : `path('${d}')`;
    };
    setClip(EMPTY_CLIP);
    video.muted = true;
    let hintTimer = 0;
    let hintOn = false;
    const showHint = (on: boolean) => {
      if (on === hintOn) return;
      hintOn = on;
      hintEl.classList.toggle("is-visible", on);
    };
    const reduced = prefersReducedMotion();
    const follow = reduced ? motion.reduced.maskFollow : mask.follow;
    const wobble = reduced ? motion.reduced.maskWobble : mask.wobble;

    const waveAmp = reduced ? 0 : mask.waveAmp;

    let enabled = false; // 진입 연출이 끝난 뒤에만 인터랙션 허용
    let inside = false; // 커서가 프레임 위에 있는지
    let revealing = false; // enabled && inside
    let raf = 0;
    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let size = 0; // 0(숨김) ~ 1(완전 노출)
    let energy = 0; // 0(정지) ~ 1(빠르게 이동 중)
    let travelled = 0; // 직전 프레임 이후 커서 이동 거리(px)

    const tick = (time: number) => {
      pos.x += (target.x - pos.x) * follow;
      pos.y += (target.y - pos.y) * follow;
      size += ((revealing ? 1 : 0) - size) * (revealing ? mask.grow : mask.shrink);

      // 이동량 → 에너지: 움직이면 빠르게 차오르고, 멈추면 천천히 가라앉는다.
      const push = Math.min(1, travelled / (frame.clientWidth * mask.moveFullRatio));
      travelled = 0;
      energy += (push - energy) * (push > energy ? mask.energyRise : mask.energyFall);

      if (!revealing && size < 0.01) {
        // 완전 원본 복귀
        size = 0;
        energy = 0;
        raf = 0;
        setClip(EMPTY_CLIP);
        frame.dataset.masking = "false";
        return;
      }
      const ratio = mask.sizeRatio + (mask.moveSizeRatio - mask.sizeRatio) * energy;
      const radius = (frame.clientWidth * ratio * size) / 2;
      setClip(blobPath(pos.x, pos.y, radius, time, wobble, waveAmp * energy));
      raf = requestAnimationFrame(tick);
    };

    const sync = () => {
      if (!enabled) {
        window.clearTimeout(hintTimer);
        showHint(false);
      } else if (!hintOn && !hintTimer) {
        hintTimer = window.setTimeout(() => {
          hintTimer = 0;
          if (enabled) showHint(true);
        }, inside ? hintIdleMs : 0);
      }
      const next = enabled && inside;
      if (next === revealing) return;
      revealing = next;
      if (revealing) {
        if (size === 0) {
          // 새로 등장할 때는 커서 위치에서 바로 피어난다.
          pos.x = target.x;
          pos.y = target.y;
        }
        frame.dataset.masking = "true";
        if (video.paused) video.play().catch(() => {});
        if (!raf) raf = requestAnimationFrame(tick);
      }
    };

    // 커서 좌표(뷰포트 기준)는 마스크 활성화 여부와 무관하게 항상 기록한다.
    const pointer = { x: 0, y: 0, known: false };

    // 마지막 커서 좌표로 프레임 안/밖을 판정하고 마스크 목표 좌표를 갱신한다.
    // 커서가 멈춘 채 스크롤로 진입하면 pointerenter가 오지 않으므로 경계 이벤트에 의존하지 않는다.
    const locate = (fromPointer: boolean) => {
      if (!pointer.known) {
        inside = false;
        return;
      }
      const rect = frame.getBoundingClientRect();
      const x = pointer.x - rect.left;
      const y = pointer.y - rect.top;
      const now = x >= 0 && y >= 0 && x < rect.width && y < rect.height;
      if (fromPointer && inside && now) travelled += Math.hypot(x - target.x, y - target.y);
      target.x = x;
      target.y = y;
      inside = now;
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.known = true;
      locate(true);
      // 커서가 움직이는 동안 안내 문구를 숨기고, 멈추면 다시 띄운다.
      if (enabled && inside) {
        showHint(false);
        window.clearTimeout(hintTimer);
        hintTimer = window.setTimeout(() => {
          hintTimer = 0;
          if (enabled) showHint(true);
        }, hintIdleMs);
      }
      sync();
    };

    const onLeave = () => {
      inside = false;
      sync();
    };

    // 커서가 창 밖으로 나가거나 창이 포커스를 잃으면 좌표를 무효화한다(재진입 시 첫 이동에서 즉시 복구).
    const forget = () => {
      pointer.known = false;
      onLeave();
    };
    const onDocOut = (e: PointerEvent) => {
      if (!e.relatedTarget) forget();
    };

    frame.addEventListener("pointerenter", onMove);
    window.addEventListener("pointermove", onMove, { passive: true });
    frame.addEventListener("pointerleave", onLeave);
    frame.addEventListener("pointercancel", onLeave);
    document.addEventListener("pointerout", onDocOut);
    window.addEventListener("blur", forget);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: motion.scrub.smooth,
          invalidateOnRefresh: true,
          onToggle: (self) => {
            if (self.isActive) video.play().catch(() => {});
            else {
              onLeave();
              video.pause();
            }
          },
        },
        onUpdate: () => {
          enabled = tl.time() >= fadeVh + introVh * 0.9;
          frame.dataset.enabled = String(enabled);
          // 스크롤로 진입 연출이 끝난 순간, 이미 프레임 위에 있는 커서로 바로 활성화한다.
          locate(false);
          sync();
        },
      });
      // 0 ~ fadeVh: HERO가 위에서 사라지는 동안 어두운 진입 상태 유지
      addIntro(tl, titleRef.current, dimRef.current, fadeVh, introVh);
      tl.set({}, {}, totalVh);
    });

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(hintTimer);
      frame.removeEventListener("pointerenter", onMove);
      window.removeEventListener("pointermove", onMove);
      frame.removeEventListener("pointerleave", onLeave);
      frame.removeEventListener("pointercancel", onLeave);
      document.removeEventListener("pointerout", onDocOut);
      window.removeEventListener("blur", forget);
      ctx.revert();
    };
  }, []);

  const { title, subtitle, originalAlt, hint } = content.reinterpret;

  return (
    <section
      className="reinterpret"
      data-scene="reinterpret"
      ref={sectionRef}
      style={{ height: `${100 + totalVh}vh`, marginTop: `-${100 + fadeVh}vh` }}
    >
      <div className="stage reinterpret-stage">
        <div
          className="reinterpret-frame"
          ref={frameRef}
          data-enabled="false"
          data-masking="false"
        >
          <img
            className="reinterpret-layer"
            src={assets.reinterpret.originalImage}
            alt={originalAlt}
            draggable={false}
          />
          <video
            className="reinterpret-layer reinterpret-ai"
            ref={videoRef}
            src={assets.reinterpret.aiVideo}
            poster={assets.reinterpret.aiPoster}
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
          />
          <div className="scene-dim" ref={dimRef} />
        </div>
        <div className="scene-title scene-title--hero" ref={titleRef}>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <p className="explore-hint" ref={hintRef} aria-hidden="true">
          {hint}
        </p>
      </div>
    </section>
  );
}
