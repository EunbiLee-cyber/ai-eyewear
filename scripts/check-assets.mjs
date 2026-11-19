// 필수 미디어 111개(WebP 109 + MP4 2) 실물 검사.
// 존재 여부 · 빈 파일 · 확장자/시그니처 · HERO 시퀀스 번호 연속성과 90장 개수를 확인한다.
import { existsSync, readdirSync, statSync, openSync, readSync, closeSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = join(root, "public", "assets");

const HERO_FRAME_COUNT = 90;
const pad = (n, len) => String(n).padStart(len, "0");

const heroFrames = Array.from(
  { length: HERO_FRAME_COUNT },
  (_, i) => `hero/frames/frame_${pad(i + 1, 4)}.webp`,
);

const required = [
  ...heroFrames,
  "reinterpret/reinterpret_original.webp",
  "reinterpret/reinterpret_ai.mp4",
  "reinterpret/reinterpret_ai_poster.webp",
  "reframe/reframe_00_distract.webp",
  "reframe/reframe_01_left_removed.webp",
  "reframe/reframe_02_sides_removed.webp",
  "reframe/reframe_03_focus_sunlit.webp",
  ...Array.from({ length: 12 }, (_, i) => `remember/memory_${pad(i + 1, 2)}.webp`),
  "remember/memory_09_loop.mp4",
  "product/ai_glasses_product.webp",
];

const errors = [];

function signatureOk(file, ext) {
  const buf = Buffer.alloc(12);
  const fd = openSync(file, "r");
  try {
    readSync(fd, buf, 0, 12, 0);
  } finally {
    closeSync(fd);
  }
  if (ext === "webp") {
    return buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP";
  }
  if (ext === "mp4") return buf.toString("ascii", 4, 8) === "ftyp";
  return false;
}

for (const rel of required) {
  const file = join(assetsDir, rel);
  const shown = `public/assets/${rel}`;
  if (!existsSync(file)) {
    errors.push(`누락: ${shown}`);
    continue;
  }
  if (statSync(file).size === 0) {
    errors.push(`빈 파일: ${shown}`);
    continue;
  }
  const ext = rel.split(".").pop();
  if (!signatureOk(file, ext)) errors.push(`형식 불일치(.${ext} 아님): ${shown}`);
}

// HERO 시퀀스: 정확히 frame_0001~frame_0090, 공백·중복·여분 없음
const framesDir = join(assetsDir, "hero", "frames");
if (existsSync(framesDir)) {
  const present = readdirSync(framesDir).filter((f) => !f.startsWith("."));
  const expected = new Set(heroFrames.map((f) => f.split("/").pop()));
  for (const f of present) {
    if (!expected.has(f)) errors.push(`HERO 시퀀스 규칙 외 파일: public/assets/hero/frames/${f}`);
  }
  const valid = present.filter((f) => expected.has(f));
  if (valid.length !== HERO_FRAME_COUNT) {
    errors.push(`HERO 프레임 개수 ${valid.length}장 (필요: ${HERO_FRAME_COUNT}장)`);
  }
} else {
  errors.push("누락 폴더: public/assets/hero/frames/");
}

const webp = required.filter((f) => f.endsWith(".webp")).length;
const mp4 = required.filter((f) => f.endsWith(".mp4")).length;

if (errors.length > 0) {
  console.error(`\n✖ 에셋 검사 실패 — ${errors.length}건\n`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error("\n누락된 리소스를 지정 경로에 배치한 뒤 다시 실행하세요. 구현/빌드를 중단합니다.\n");
  process.exit(1);
}

console.log(
  `✔ 에셋 검사 통과 — 총 ${required.length}개 (WebP ${webp} + MP4 ${mp4}), HERO 시퀀스 frame_0001~frame_${pad(HERO_FRAME_COUNT, 4)} 연속 ${HERO_FRAME_COUNT}장`,
);
