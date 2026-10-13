# Aleria: Contractor

A browser RPG set in the world of *A Guide for Heroes (Who'd Rather Not Be)*. Pick a race and difficulty, then:
- **Classic races:** survive as an Adventurer or Hunter until the Doomsday.
- **Scenario races:** play through a dedicated scenario.

## Play it on GitHub Pages

The game is published at `https://<your-user>.github.io/Aleria-Contractor/`. It works with either **Settings → Pages → Source** option:
- **Deploy from a branch** (`main`, root): the repo root already holds the playable build (`index.html` + `assets/`).
- **GitHub Actions**: the **Deploy to GitHub Pages** workflow builds and publishes the site.

On every push to `main`, the workflow rebuilds the game and commits the fresh `index.html` + `assets/`, so both options stay up to date.

## Run it locally

```bash
npm install
npm run dev         # dev server; open http://127.0.0.1:5173/game.html
npm run build:site  # build and refresh the playable index.html + assets/ in the repo root
```

- `game.html` is the source entry; `index.html` and `assets/` are generated. Don't edit them by hand.
- Music and images stay in `public/` and are loaded from there directly; nothing is copied.

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
