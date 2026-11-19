import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "../config/motion";

gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: "none" });

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 진입 구간 중 타이틀이 완전히 사라지기까지의 비율 */
export const INTRO_TITLE_OUT = 0.62;

/** S02·S03·S04 공통 진입: 타이틀이 위로 사라지고 암전이 걷힌다. */
export function addIntro(
  tl: gsap.core.Timeline,
  title: Element | null,
  dim: Element | null,
  at: number,
  duration: number,
) {
  tl.fromTo(
    title,
    { y: 0, autoAlpha: 1 },
    {
      y: () => -(window.innerHeight * motion.intro.titleLiftVh) / 100,
      autoAlpha: 0,
      ease: "power1.in",
      duration: duration * INTRO_TITLE_OUT,
    },
    at,
  ).fromTo(
    dim,
    { opacity: motion.intro.dim },
    { opacity: 0, ease: "power1.inOut", duration: duration * 0.7 },
    at + duration * 0.3,
  );
}

export { gsap, ScrollTrigger };
