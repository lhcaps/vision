import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ["motion"],
          flow: ["@xyflow/react"],
          icons: ["@phosphor-icons/react"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@visionflow/contracts": fileURLToPath(
        new URL("../../packages/contracts/src/index.ts", import.meta.url),
      ),
      "@visionflow/motion": fileURLToPath(
        new URL("../../packages/motion/src/index.ts", import.meta.url),
      ),
    },
  },
});
