# Event Modding Guide (for another AI or contributor)

How to add new story events to the scenarios without breaking anything. This guide covers code structure only, not what the content should be.

## Where events live

| Scenario | Event file | How events are scheduled |
|---|---|---|
| Beastkin (Hollowmere) | `src/beastkin/logic.js` → `EVENTS` | `endDay()` in the same file (scripted beats by day, random outsiders) |
| Tenebrim (Unbound) | `src/tenebrim/events.js` → `EVENTS` | `endDay()` in `src/tenebrim/logic.js` (random night events), actions, combat results |
| Devil (Sector Three) | `src/DevilScenario.jsx` → `STORY` | `nextStory()` (reputation thresholds) and the day-change effect |

## Event format

Every event is a function of the game state `g` that returns:

```js
myEvent: (g, data) => ({
  title: "Title shown in the event panel",
  tone: "#hexcolor",            // accent colour
  text: "What happens. \n\n allowed for paragraphs.",
  choices: [
    {
      label: "What the player does",
      hint: "Shown under the label: costs, odds, consequences",
      disabled: g.food < 6,     // optional boolean
      run: (g, data) => {       // mutate g directly; the UI already cloned it
        g.food -= 6;
        g.trust = clamp(g.trust + 5);
        log(g, "Message for the journal", "heal"); // types: info, dmg, heal, sys, reward, lumen
      },
    },
  ],
}),
```

- **Opening an event:** set `g.event = { id: "myEvent", data: {...} }` from anywhere in the logic.
- **Chaining events:** set `g.event` again inside a `run`.
- **Starting a fight:** call `startFight(g, "kindName", ["enemyId", ...], { allies, title })`. Then handle `kindName` in `applyCombatResult` (rewards and penalties) and in `afterCombat` (what happens next).
- **Enemies:** define them in the scenario's enemy table. For Beastkin that's `BK_ENEMIES` in `src/beastkin/data.js`; the format is in `src/combat/monsters.js`. Every move needs a `tell` so the player can read the attack.
- **Sub-type specific variants:** branch on `g.subtype` (`lizardman`, `angelos`, `canine`, `melano`, `gemea`, `ursan`), as the outsider event does for Melano's "Bellow".

## Scheduling a Beastkin event

In `endDay()` in `src/beastkin/logic.js`:

```js
if (g.day === 8 && !g.flags.myEvent) { g.flags.myEvent = true; g.event = { id: "myEvent" }; return; }
```

- The year has 20 days: Spring 1–5, Summer 6–10, Autumn 11–15, Winter 16–20. Harvest Night is the end of day 15.
- `seasonOf(g)` returns the current season.

## Optional content behind a setting

Content that shouldn't be in the base game should sit behind an opt-in toggle that is **off by default**:

1. Add a flag to the settings modal in `src/App.jsx` and store it in `localStorage` (for example `aleria_optional_content`).
2. Check the flag before scheduling: `if (localStorage.getItem("aleria_optional_content") === "on") { ... }`.
3. Keep such events in their own file (for example `src/beastkin/optionalEvents.js`) and spread them into `EVENTS`, so they are easy to remove.

## Testing

- Build with `npm run build`. It must finish with no errors.
- Play the event in `npm run dev`. The Beastkin scenario saves to `localStorage` key `aleria_beastkin_save`; delete that key to restart.
