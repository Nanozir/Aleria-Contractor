import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" keeps every asset path relative, so the build works on GitHub Pages
// (https://<user>.github.io/<repo>/) as well as on a local dev server.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
