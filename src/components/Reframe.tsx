import { useEffect, useRef } from "react";
import { assets } from "../config/assets";
import { content } from "../config/content";
import { motion } from "../config/motion";
import { gsap, addIntro } from "../lib/gsap";

const { introVh, gapVh, holdVh, steps } = motion.reframe;
const { gauge } = motion.reframe;

// 눈금별 흐트러짐 값. 시드 고정 난수라 새로고침해도 같은 모양이다.
const gaugeTicks = (() => {
  let seed = 0x9e3779b9;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const spread = () => rand() * 2 - 1;
  return Array.from({ length: gauge.ticks }, () => ({
    x: spread() * gauge.scatterXPx,
    y: spread() * gauge.scatterYPx,
    rotation: spread() * gauge.scatterDeg,
    scaleX: 1 + spread() * gauge.scatterScale,
    opacity: 0.35 + rand() * 0.65,
    settle: gauge.settleFrom + rand() * (1 - gauge.settleFrom),
  }));
})();

const totalVh =
  introVh + steps.reduce((sum, s) => sum + gapVh + s.durationVh, 0) + holdVh;

export function Reframe() {
  const sectionRef = useRef<HTMLElement>(null);
  const layerRefs = useRef<(HTMLImageElement | null)[]>([]);
  const dimRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const gaugeRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const tickRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: motion.scrub.smooth,
          invalidateOnRefresh: true,
        },
      });

      addIntro(tl, titleRef.current, dimRef.current, 0, introVh);
      tl.fromTo(
        gaugeRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: introVh * 0.3 },
        introVh * 0.6,
      );

      // 상태 01~03: 변경 영역 중심에서 번지는 마스크로 다음 상태를 드러낸다.
      let at = introVh;
      steps.forEach((step, i) => {
        at += gapVh;
        const layer = layerRefs.current[i + 1]!;
        const reveal = { r: 0 };
        const apply = () => {
          const r = reveal.r;
          const image =
            r >= step.reachVw
              ? "none"
              : `radial-gradient(circle at ${step.originX * 100}% ${step.originY * 100}%, #000 ${(
                  r - step.featherVw
                ).toFixed(2)}vw, transparent ${r.toFixed(2)}vw)`;
          layer.style.maskImage = image;
          layer.style.webkitMaskImage = image;
          layer.style.visibility = r <= 0 ? "hidden" : "visible";
        };
        apply();
        tl.to(
          reveal,
          { r: step.reachVw, duration: step.durationVh, ease: "sine.inOut", onUpdate: apply },
          at,
        );
        at += step.durationVh;
      });

      // 눈금 인디케이터: 상태 전환 전체 구간에 걸쳐 위(DISTRACT) → 아래(FOCUS)
      tl.fromTo(
        markerRef.current,
        { yPercent: 0 },
        { yPercent: 100, duration: at - introVh },
        introVh,
      );
      // 눈금: DISTRACT에서는 제각각 흐트러져 있다가 FOCUS에 가까워질수록 반듯하게 정렬된다.
      const span = at - introVh;
      gaugeTicks.forEach((tick, i) => {
        tl.fromTo(
          tickRefs.current[i],
          {
            x: tick.x,
            y: tick.y,
            rotation: tick.rotation,
            scaleX: tick.scaleX,
            opacity: tick.opacity,
          },
          {
            x: 0,
            y: 0,
            rotation: 0,
            scaleX: 1,
            opacity: 1,
            duration: span * tick.settle,
            ease: "power1.inOut",
          },
          introVh,
        );
      });
      tl.set({}, {}, totalVh);
    });
    return () => ctx.revert();
  }, []);

  const { title, subtitle, topLabel, bottomLabel, sceneAlt } = content.reframe;

  return (
    <section
      className="reframe"
      data-scene="reframe"
      ref={sectionRef}
      style={{ height: `${100 + totalVh}vh` }}
    >
      <div className="stage reframe-stage">
        {assets.reframe.states.map((src, i) => (
          <img
            key={src}
            className="reframe-layer"
            ref={(el) => {
              layerRefs.current[i] = el;
            }}
            src={src}
            alt={i === 0 ? sceneAlt : ""}
            aria-hidden={i === 0 ? undefined : true}
            draggable={false}
          />
        ))}
        <div className="scene-dim" ref={dimRef} />
        <div className="reframe-gauge" ref={gaugeRef} aria-hidden="true">
          <span className="reframe-gauge-label">{topLabel}</span>
          <div className="reframe-gauge-track">
            {gaugeTicks.map((_, i) => (
              <b
                key={i}
                className="reframe-gauge-tick"
                ref={(el) => {
                  tickRefs.current[i] = el;
                }}
                style={{ top: `${(i / gauge.ticks) * 100}%` }}
              />
            ))}
            <div className="reframe-gauge-marker" ref={markerRef}>
              <i />
            </div>
          </div>
          <span className="reframe-gauge-label">{bottomLabel}</span>
        </div>
        <div className="scene-title scene-title--hero" ref={titleRef}>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
    </section>
  );
}
