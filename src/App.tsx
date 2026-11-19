import { useSyncExternalStore } from "react";
import { motion } from "./config/motion";
import { content } from "./config/content";
import { Hero } from "./components/Hero";
import { Reinterpret } from "./components/Reinterpret";
import { ReinterpretNote } from "./components/ReinterpretNote";
import { Reframe } from "./components/Reframe";
import { RememberEndingStage } from "./components/RememberEndingStage";
import { ProductPanel } from "./components/ProductPanel";
import { DesktopNotice } from "./components/DesktopNotice";

const desktopQuery = `(min-width: ${motion.desktopMinWidth}px)`;

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(desktopQuery);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(desktopQuery).matches;

export default function App() {
  const isDesktop = useSyncExternalStore(subscribe, getSnapshot);

  // 좁은 화면에서는 무거운 미디어를 마운트하지 않고 경량 안내만 보여준다.
  if (!isDesktop) return <DesktopNotice />;

  return (
    <main>
      <Hero />
      <Reinterpret />
      <ReinterpretNote />
      <Reframe />
      <ReinterpretNote note={content.reframe.note} />
      <RememberEndingStage />
      <ProductPanel />
    </main>
  );
}
