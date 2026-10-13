// Copies the Vite build (dist/) into the repo root so GitHub Pages can serve the game
// directly from the branch: dist/game.html -> index.html, dist/assets -> assets/.
import { cpSync, rmSync, existsSync, writeFileSync } from "node:fs";

if (!existsSync("dist/game.html")) throw new Error("Run `vite build` first: dist/game.html is missing.");
rmSync("assets", { recursive: true, force: true });
cpSync("dist/assets", "assets", { recursive: true });
cpSync("dist/game.html", "index.html");
writeFileSync(".nojekyll", "");
console.log("Published build to index.html + assets/");
