// contracts.js — Daily contract board for the classic contractor life (Human / Equar / Tetrabrachian / surface Devil).
// Lore: the Hunter Association holds legal priority on monster contracts, so Star-3+ bounties are Hunter work.
// Adventurers take escorts, gathering and lower-tier hunts, and are paid by rank.
import { MONSTERS } from "./combat/monsters";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const ADV_JOBS = [
  { title: "Escort a salt caravan", desc: "Three wagons to the next town. Something has been following the road.", count: [1, 2], pay: 1.1 },
  { title: "Herb gathering in the wilds", desc: "An apothecary needs moonleaf. The wilds have other ideas.", count: [1, 1], pay: 0.9 },
  { title: "Clear a den near the farms", desc: "Livestock keep disappearing. Find out why.", count: [2, 2], pay: 1.0 },
  { title: "Dungeon survey (shallow floors)", desc: "Map the first curls of a young dungeon for the guild.", count: [2, 3], pay: 1.25 },
];
const HUNT_JOBS = [
  { title: "Bounty", desc: "A single confirmed threat. Kill it, bring proof.", count: [1, 1], pay: 1.4 },
  { title: "Pack cull", desc: "Several of them, working together.", count: [2, 3], pay: 1.2 },
];

// maxStar: what the world currently throws at you (rises with the Doomsday)
export function generateContracts({ cls, hunterStars = 1, maxStar = 2, count = 3 }) {
  const isHunter = cls === "hunter";
  const out = [];
  for (let i = 0; i < count; i++) {
    const job = isHunter ? pick(HUNT_JOBS) : pick(ADV_JOBS);
    // Hunters are cleared up to one star above their qualification; adventurers rarely see Star-3+
    const cap = isHunter ? Math.min(5, Math.max(maxStar, hunterStars + 1)) : Math.min(maxStar, 3);
    const lo = Math.max(1, cap - 2);
    const star = Math.max(lo, Math.min(cap, lo + Math.floor(Math.random() * (cap - lo + 1))));
    const pool = MONSTERS.filter(m => m.star === star);
    const lead = pick(pool.length ? pool : MONSTERS.filter(m => m.star <= cap));
    const n = job.count[0] + Math.floor(Math.random() * (job.count[1] - job.count[0] + 1));
    const others = MONSTERS.filter(m => m.star <= Math.max(1, star - 1));
    const enemies = [lead.id, ...Array.from({ length: n - 1 }, () => (Math.random() < 0.5 ? lead.id : pick(others.length ? others : [lead]).id))];
    const overQualified = isHunter && star > hunterStars + 0;
    out.push({
      id: `${Date.now()}_${i}`, title: job.title === "Bounty" ? `Bounty: ${lead.name}` : job.title, desc: job.desc,
      lead: lead.name, leadDesc: lead.desc, star, enemies, pay: job.pay * (overQualified ? 1.3 : 1), risky: overQualified,
    });
  }
  return out;
}
