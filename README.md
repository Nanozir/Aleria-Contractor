# Aleria: Contractor

A browser RPG set in the world of *A Guide for Heroes (Who'd Rather Not Be)*. Pick a race and difficulty, then:
- **Classic races:** survive as an Adventurer or Hunter until the Doomsday.
- **Scenario races:** play through a dedicated scenario.

## Play it on GitHub Pages

1. On GitHub, open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or run the **Deploy to GitHub Pages** workflow manually from the **Actions** tab).
4. The game is published at `https://<your-user>.github.io/Aleria-Contractor/`.

The workflow (`.github/workflows/deploy.yml`) builds the game with Vite and deploys the `dist/` folder.

## Run it locally

```bash
npm install
npm run dev      # dev server at http://127.0.0.1:5173
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Project layout

| Path | What it is |
|---|---|
| `src/App.jsx` | Main game shell: menus, the classic contractor loop, Doomsday, routing to scenarios |
| `src/combat/` | Shared turn-based combat engine (`engine.js`), its UI (`CombatScreen.jsx`), the monster roster (`monsters.js`) and the Lumenari boss (`LumenariFight.jsx`) |
| `src/cinematic/Cinematic.jsx` | Reusable cutscene player |
| `src/TenebrimScenario.jsx` + `src/tenebrim/` | Tenebrim scenario, "Unbound" |
| `src/DevilScenario.jsx` | Devil Underworld hub, "Warden of Sector Three" |
| `src/BeastkinScenario.jsx` + `src/beastkin/` | Beastkin scenario, "The Hollowmere Year" |
| `src/ElfScenario.jsx` + `src/elf/` | Elf survival scenario |
| `src/EquarScenario.jsx` | Equar merchant scenario |
| `src/contracts.js` | Daily contract board for Adventurers and Hunters |
| `public/audio/` | Music (MP3) |
| `public/img/` | Images |
| `docs/` | Design notes and the music brief |

## Debug cheats

Type these during play, then press **Enter**:

| Cheat | Effect |
|---|---|
| `givemoney` (repeat the word up to 3× for more, e.g. `givemoneymoney`) | Bronze |
| `endgamenow` | Skip to post-Doomsday |
| `doomsdaynow` | Trigger the Doomsday |
| `lumenarinow` | Jump to the Lumenari boss |

## Docs

- [`docs/DESIGN_NOTES.md`](docs/DESIGN_NOTES.md): how each system and scenario works, and what's planned next
- [`docs/MUSIC_BRIEF_FOR_GEMINI.md`](docs/MUSIC_BRIEF_FOR_GEMINI.md): brief for composing the missing music tracks
