import { useEffect, useRef } from "react";
import { assets } from "../config/assets";
import { content } from "../config/content";
import { motion } from "../config/motion";
import { ScrollTrigger, clamp01 } from "../lib/gsap";

const { framesVh, holdVh, fadeVh, preloadConcurrency, copyLiftVh, copyFadeVh } = motion.hero;

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current!;
    const stage = stageRef.current!;
    const canvas = canvasRef.current!;
    const copy = copyRef.current!;
    // 첫 진입(스크롤 0)은 시퀀스 첫 프레임 정지컷, 스크롤에 따라 프레임 진행
    const ctx = canvas.getContext("2d", { alpha: false })!;
    const { frames, frameCount } = assets.hero;

    // 압축된 원본만 보관한다(디코딩 비트맵은 브라우저 캐시에 맡김).
    const images: HTMLImageElement[] = new Array(frameCount);
    const ready: boolean[] = new Array(frameCount).fill(false);
    let current = 0; // 스크롤이 가리키는 프레임 인덱스 0~89
    let drawn = -1; // 캔버스에 실제 그려진 인덱스
    let disposed = false;

    /** 아직 로드되지 않은 프레임이면 가장 가까운 로드된 프레임으로 대체(깜빡임 방지) */
    const nearestReady = (index: number) => {
      if (ready[index]) return index;
      for (let d = 1; d < frameCount; d++) {
        if (index - d >= 0 && ready[index - d]) return index - d;
        if (index + d < frameCount && ready[index + d]) return index + d;
      }
      return -1;
    };

    const draw = (force = false) => {
      const index = nearestReady(current);
      if (index < 0 || (!force && index === drawn)) return;
      const img = images[index];
      const cw = canvas.width;
      const ch = canvas.height;
      // object-fit: cover 와 동일한 크롭
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      drawn = index;
      canvas.dataset.frame = String(index + 1);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(stage.clientWidth * dpr);
      const h = Math.round(stage.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      draw(true);
    };

    // 프리로드: 첫 프레임 우선, 이후 순서대로 제한된 동시성으로
    let next = 0;
    const loadNext = () => {
      if (disposed || next >= frameCount) return;
      const index = next++;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        ready[index] = true;
        if (!disposed && drawn !== current) draw();
        loadNext();
      };
      img.onerror = loadNext;
      img.src = frames[index];
      images[index] = img;
    };
    loadNext();
    for (let i = 1; i < preloadConcurrency; i++) loadNext();

    const update = (self: ScrollTrigger) => {
      const unit = window.innerHeight / 100;
      const scrolled = self.scroll() - self.start;
      // 진행도 → 프레임 인덱스 0~89
      const progress = clamp01(scrolled / (framesVh * unit));
      current = Math.min(frameCount - 1, Math.floor(progress * frameCount));
      draw();
      // 마지막 프레임 유지 후 S02로 크로스페이드
      const fade = clamp01((scrolled - (framesVh + holdVh) * unit) / (fadeVh * unit));
      stage.style.opacity = String(1 - fade);
      // 문구: 스크롤 시작과 함께 위로 올라가며 사라진다
      const lift = clamp01(scrolled / (copyFadeVh * unit));
      copy.style.transform = `translateY(${(-lift * copyLiftVh * unit).toFixed(1)}px)`;
      copy.style.opacity = String(1 - lift);
      stage.style.visibility = fade >= 1 ? "hidden" : "visible";
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      onUpdate: update,
      onRefresh: update,
    });

    resize();
    window.addEventListener("resize", resize);

    return () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      trigger.kill();
      images.forEach((img) => {
        if (img) img.onload = img.onerror = null;
      });
    };
  }, []);

  return (
    <section
      className="hero"
      data-scene="hero"
      ref={sectionRef}
      style={{ height: `${100 + framesVh + holdVh + fadeVh}vh` }}
    >
      <div className="stage hero-stage" ref={stageRef}>
        <canvas
          className="hero-canvas"
          ref={canvasRef}
          role="img"
          aria-label="AI 안경을 쓴 인물 주위를 돌아 농구 코트를 바라보는 시점으로 이동하는 장면"
        />
        <div className="hero-copy" ref={copyRef}>
          <p className="hero-text hero-side--left">{content.hero.left}</p>
          <p className="hero-text hero-side--right">{content.hero.right}</p>
          <p className="hero-text hero-side--center">{content.hero.center}</p>
          <h1 className="hero-text hero-headline">{content.hero.headline}</h1>
        </div>
      </div>
    </section>
  );
}
