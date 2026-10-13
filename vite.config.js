import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The repo root is the website: GitHub Pages can serve it straight from the main branch
// ("Deploy from a branch") or through the Actions workflow, and both work.
// - game.html is the source entry. `npm run build:site` builds it and writes the playable
//   index.html + assets/ to the repo root (scripts/publish-root.mjs).
// - Static files stay in public/ and are loaded from ./public/... (see src/assets.js),
//   so the music is never copied or moved.
// - base "./" keeps every path relative for https://<user>.github.io/<repo>/.
export default defineConfig({
  plugins: [react()],
  base: "./",
  publicDir: false,
  build: { rollupOptions: { input: "game.html" } },
  server: { open: "/game.html" },
});
