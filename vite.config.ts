import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 상대 경로 base: GitHub Pages(/ai-eyewear/) 등 어떤 하위 경로에 올려도 동작.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
