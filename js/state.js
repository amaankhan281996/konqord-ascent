// Game state, saving, real-life quest logic, and the hero/loot/ally rules.

const KEY = "konqord-ascent-v1";
const uid = () => Math.random().toString(36).slice(2, 9);
const localDay = (d = new Date()) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
const isoWeek = day => { const d = new Date(day + "T12:00:00"); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7); const y = new Date(d.getFullYear(), 0, 4); return d.getFullYear() + "-W" + (1 + Math.round(((d - y) / 864e5 - 3 + (y.getDay() + 6) % 7) / 7)); };
const need = lv => Math.round(100 * Math.pow(1.18, lv - 1));
const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];

function newGame() {
  return {
    v: 1, day: localDay(), level: 1, xp: 0, gold: 40, energy: 30, points: 0,
    stats: { STR: 10, VIT: 10, INT: 10, PER: 10, SEN: 10, WIL: 10 },
    statXp: { STR: 0, VIT: 0, INT: 0, PER: 0, SEN: 0, WIL: 0 },
    streak: 0, best: 0, freezes: 1, restWeek: "", restToday: false, total: 0, history: {}, ach: [], bonusClaimed: false,
    quests: starterQuests(), questsV2: true, anime: [],
    amounts: {}, catDays: {}, catTotals: {}, body: {}, goals: { ...DEFAULT_GOALS }, lastReview: mondayOf(localDay()), reviews: [],
    shop: DEFAULT_REWARDS.map(([name, cost]) => ({ id: uid(), name, cost })),
    log: [{ t: localDay(), m: "Emzi awakens at the foot of the tower. Clear real quests to gain energy and strength." }],
    tower: { floor: 1, stage: 0, highest: 1 },
    potions: 3, ethers: 1, boxes: ["rare"], gifts: [],
    gear: [], equip: { weapon: null, armor: null, charm: null },
    renown: 0, bonds: {}, party: [],
    sp: 0, tree: [], shards: 0,
  };
}

function starterQuests() {
  return DEFAULT_QUESTS.map(([name, cat, diff, unit, target, opt = {}]) => ({
    id: uid(), name, cat, diff, daily: true, done: false, unit, target, base: target, scaledAt: 0, hist: [],
    perWeek: opt.perWeek || 0, days: opt.days || null, optional: !!opt.optional, kind: opt.kind || "", facts: opt.facts || "",
  }));
}

function mondayOf(day) { const d = new Date(day + "T12:00:00"); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return localDay(d); }
function addDays(day, n) { const d = new Date(day + "T12:00:00"); d.setDate(d.getDate() + n); return localDay(d); }

// Older saves get the tracking fields added without losing progress.
function migrate(s) {
  s.amounts ??= {}; s.catDays ??= {}; s.catTotals ??= {}; s.body ??= {}; s.goals ??= { ...DEFAULT_GOALS };
  s.lastReview ??= mondayOf(localDay()); s.reviews ??= [];
  s.sp ??= s.level - 1; s.tree ??= []; s.shards ??= 0; // skill points back-paid for levels already earned
  // Emzi's tree was rebuilt around volt and metaphysic mana: refund every point.
  if (!s.treeV2) { s.tree = []; s.sp = s.level - 1; s.treeV2 = true; }
  // Give the original starter quests a count so they can be tracked and scaled.
  const OLD = [[/push-ups/i, "reps", 30], [/run or brisk walk/i, "min", 30], [/language lesson/i, "min", 15], [/chess puzzle/i, "min", 15],
    [/deep work/i, "min", 120], [/water/i, "glasses", 8], [/watch one episode/i, "min", 25]];
  s.quests.forEach(q => {
    if (!s.unitsMapped && !q.unit) { const m = OLD.find(([re]) => re.test(q.name)); q.unit = m ? m[1] : ""; q.target = m ? m[2] : 0; q.base = q.target; }
    q.unit ??= ""; q.target ??= 0; q.base ??= q.target; q.scaledAt ??= 0;
  });
  s.unitsMapped = true;
  // Switch to the personal routine (gym/swim, Duolingo, Switch 2, writing, Calo, anime, social).
  if (!s.questsV2) {
    s.quests = starterQuests(); s.goals = { ...DEFAULT_GOALS }; s.questsV2 = true;
    s.log.unshift({ t: localDay(), m: "Quest board rebuilt around your routine." });
  }
  // Swim is counted in laps.
  s.quests.filter(q => /^Swim session$/.test(q.name) && q.unit === "m").forEach(q => { q.unit = "laps"; q.target = q.base = 20; q.scaledAt = (s.amounts[q.id] || []).length; });
  s.goals.social ??= DEFAULT_GOALS.social; s.goals.beeyo ??= DEFAULT_GOALS.beeyo; s.anime ??= [];
  // Rebuild past daily EXP from the log the first time.
  if (!s.xpDays) { s.xpDays = {}; s.log.forEach(l => { const m = /\+(\d+) EXP/.exec(l.m); if (m) s.xpDays[l.t] = (s.xpDays[l.t] || 0) + +m[1]; }); }
  s.pet ??= { mood: 70, at: Date.now(), fedAt: 0, pettedAt: 0, stage: 0 };
  s.beeyo ??= { mins: 0, seen: [] }; s.meals ??= {}; s.workouts ??= {}; s.prs ??= {};
  // Apply your answers: Duolingo streak, Switch 2 any game, writing in minutes, swim in metres,
  // gym log, Calo meal log, and Beeyo time.
  if (!s.questsV3) {
    const set = (re, f) => s.quests.filter(q => re.test(q.name)).forEach(f);
    set(/^Duolingo$/, q => { q.name = "Keep my Duolingo streak"; q.unit = ""; q.target = q.base = 0; });
    set(/Switch 2/, q => { q.name = "Play on Switch 2"; q.diff = "E"; q.unit = ""; q.target = q.base = 0; });
    set(/^Write Konqord$/, q => { q.unit = "min"; q.target = q.base = 45; q.scaledAt = 0; });
    set(/^Swim session$/, q => { q.unit = "m"; q.target = q.base = 1000; q.scaledAt = 0; });
    set(/^Gym session$/, q => { q.unit = ""; q.target = q.base = 0; q.kind = "gym"; });
    set(/Calo/, q => { q.kind = "calo"; });
    if (!s.quests.some(q => q.kind === "beeyo")) s.quests.push(...starterQuests().filter(q => q.kind === "beeyo"));
    s.questsV3 = true;
  }
  if (!s.quests.some(q => q.kind === "fact")) s.quests.push(...starterQuests().filter(q => q.kind === "fact"));
  s.factsSeen ??= { animal: [], obscure: [] };
  s.quests.forEach(q => { q.hist ??= []; q.perWeek ??= 0; q.days ??= null; q.optional ??= false; q.kind ??= ""; });
  return s;
}

let S;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
S = migrate(!S || S.v !== 1 ? newGame() : S); // new games also get every field migrate adds
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const log = m => { S.log.unshift({ t: localDay(), m }); S.log = S.log.slice(0, 120); };

// ---------- Real-life side ----------

const streakMult = () => 1 + Math.min(S.streak, 20) * 0.05;
const weekdayOf = day => new Date(day + "T12:00:00").getDay();
const activeToday = q => !q.days || q.days.includes(weekdayOf(S.day));
// Daily quests required today; weekly quests (gym, swim) are optional on any given day.
const dailies = () => S.quests.filter(q => q.daily && !q.perWeek && !q.optional && activeToday(q));
const weekCount = q => (q.hist || []).filter(d => d >= mondayOf(S.day)).length;
const dailyDone = () => { const d = dailies(); return S.restToday || (d.length > 0 && d.every(q => q.done)); };

function rollover() {
  const t = localDay();
  if (S.day === t) return;
  const gap = Math.max(1, Math.round((new Date(t) - new Date(S.day)) / 864e5));
  // Yesterday (the last active day) plus any fully skipped days in between.
  let missed = (dailyDone() ? 0 : 1) + (gap - 1);
  if (dailyDone() && !S.restToday) S.streak++;
  while (missed > 0 && S.freezes > 0) { S.freezes--; missed--; log("A streak freeze shattered. Your streak is safe."); }
  if (missed > 0) {
    if (S.streak) log(`Daily quest failed. Streak of ${S.streak} lost.`);
    S.streak = 0;
    const loss = Math.min(S.gold, 15 * missed);
    if (loss) { S.gold -= loss; log(`Penalty: −${loss} gold.`); }
  }
  S.best = Math.max(S.best, S.streak);
  S.quests = S.quests.filter(q => q.daily || !q.done);
  S.quests.forEach(q => { if (q.daily) q.done = false; });
  S.day = t; S.bonusClaimed = false; S.restToday = false;
  save();
}

// EXP earned per day, for the history on the Life tab.
const xpToday = n => { S.xpDays[S.day] = Math.max(0, (S.xpDays[S.day] || 0) + n); };

function gainXp(xp) {
  S.xp += xp; xpToday(xp);
  while (S.xp >= need(S.level)) {
    S.xp -= need(S.level); S.level++; S.points += 3; S.sp++;
    log(`Level up → ${S.level}. +3 stat points.`);
    UI.toast(`Level up! Emzi is now level ${S.level}.`);
    log("+1 skill point.");
  }
}

function questReward(q, amount) {
  const d = DIFF[q.diff], m = streakMult();
  if (q.kind === "beeyo") { const f = beeyoFactor(amount ?? BEEYO_PEAK_MIN); return { xp: Math.round(BEEYO_MAX.xp * f * m), g: Math.round(BEEYO_MAX.g * f * m), en: Math.round(BEEYO_MAX.en * f) }; }
  return { xp: Math.round(d.xp * m), g: Math.round(d.g * m), en: d.en };
}

const questTotal = q => (S.amounts[q.id] || []).reduce((n, e) => n + e.a, 0);
const bump = (obj, key, n) => { obj[key] = Math.max(0, (obj[key] || 0) + n); };
const catDay = (day = S.day) => S.catDays[day] || (S.catDays[day] = {});

// Raise a quest's target once you keep hitting it.
function maybeScale(q) {
  const since = (S.amounts[q.id] || []).slice(q.scaledAt);
  if (!q.target || q.kind === "beeyo" || since.length < SCALE_HITS) return;
  const recent = since.slice(-SCALE_WINDOW);
  if (recent.filter(e => e.a >= q.target).length < SCALE_HITS) return;
  const next = Math.max(q.target + 1, Math.round(q.target * 1.1));
  q.scaledAt = S.amounts[q.id].length; // only logs after this raise count toward the next one
  setTimeout(() => UI.toast(`Quest leveled up: ${q.name} → ${next} ${q.unit}`), 700);
  log(`“${q.name}” target raised ${q.target} → ${next} ${q.unit}. You've outgrown it.`);
  q.target = next;
}

function toggleQuest(id, amount) {
  const q = S.quests.find(x => x.id === id); if (!q) return;
  if (!q.done) q.lastAmt = amount;
  const r = questReward(q, q.lastAmt), stat = CATS[q.cat].stat;
  if (!q.done) {
    q.done = true; S.total++; S.history[S.day] = (S.history[S.day] || 0) + 1; (q.hist ||= []).push(S.day);
    bump(catDay(), q.cat, 1); bump(S.catTotals, q.cat, 1);
    if (q.unit && amount > 0) { (S.amounts[q.id] ||= []).push({ d: S.day, a: amount }); maybeScale(q); }
    checkTitles();
    gainXp(r.xp); S.gold += r.g; S.energy = Math.min(ENERGY_MAX, S.energy + r.en); S.renown += 1;
    S.statXp[stat] += DIFF[q.diff].xp;
    while (S.statXp[stat] >= STAT_XP_PER_POINT) { S.statXp[stat] -= STAT_XP_PER_POINT; S.stats[stat]++; log(`${stat} rose to ${S.stats[stat]} from real training.`); }
    log(`Cleared “${q.name}” +${r.xp} EXP +${r.g}g +${r.en} energy`);
    if (!S.bonusClaimed && dailies().length && dailies().every(x => x.done)) {
      S.bonusClaimed = true; gainXp(50); S.gold += 30; S.points += 1; S.boxes.push(rollRarity(0.1));
      log("Daily quest complete: +50 EXP, +30 gold, +1 stat point, +1 loot box.");
      setTimeout(() => UI.toast("Daily Quest complete! A loot box appeared."), 500);
    }
  } else {
    q.done = false; S.total = Math.max(0, S.total - 1); S.history[S.day] = Math.max(0, (S.history[S.day] || 1) - 1);
    if (q.hist && q.hist[q.hist.length - 1] === S.day) q.hist.pop();
    bump(catDay(), q.cat, -1); bump(S.catTotals, q.cat, -1);
    const a = S.amounts[q.id]; if (a && a.length && a[a.length - 1].d === S.day) a.pop();
    S.xp = Math.max(0, S.xp - r.xp); xpToday(-r.xp); S.gold = Math.max(0, S.gold - r.g); S.energy = Math.max(0, S.energy - r.en);
    S.statXp[stat] = Math.max(0, S.statXp[stat] - DIFF[q.diff].xp);
  }
  checkAch(); save();
}

function takeRestDay() {
  const w = isoWeek(S.day);
  if (S.restWeek === w || S.restToday) return false;
  S.restWeek = w; S.restToday = true; log("Rest day taken. Your streak is safe today.");
  save(); return true;
}

const ACH = [
  ["First Step", s => s.total >= 1], ["Quest x50", s => s.total >= 50], ["Quest x250", s => s.total >= 250], ["Quest x1000", s => s.total >= 1000],
  ["3-Day Streak", s => s.best >= 3], ["Week Warrior", s => s.best >= 7], ["Unbroken Month", s => s.best >= 30],
  ["Floor 10", s => s.tower.highest > 10], ["Floor 25", s => s.tower.highest > 25], ["Floor 50", s => s.tower.highest > 50], ["Tower Conqueror", s => s.tower.highest > 100],
  ["Level 10", s => s.level >= 10], ["Level 25", s => s.level >= 25], ["First Bond", s => Object.values(s.bonds).some(b => b >= 3)],
];
function checkAch() {
  ACH.forEach(([n, f]) => {
    if (!S.ach.includes(n) && f(S)) { S.ach.push(n); S.gold += 50; S.boxes.push("rare"); log(`Achievement: ${n} (+50 gold, rare loot box)`); UI.toast(`Achievement: ${n}`); }
  });
}

// ---------- Hero ----------

const itemById = id => S.gear.find(g => g.id === id);
function equipped() { return Object.values(S.equip).map(itemById).filter(Boolean); }

// Buffs from real quests cleared today, one per category.
const todayBuffs = () => Object.keys(CAT_BUFFS).filter(c => (S.catDays[S.day] || {})[c] > 0);
const earnedTitles = () => LIFE_TITLES.filter(t => (S.catTotals[t.cat] || 0) >= t.need);

function checkTitles() {
  LIFE_TITLES.forEach(t => {
    if ((S.catTotals[t.cat] || 0) === t.need && !S.ach.includes("title:" + t.id)) {
      S.ach.push("title:" + t.id); log(`Title earned: ${t.name}.`);
      setTimeout(() => UI.toast(`Title earned: ${t.name}`), 1200);
    }
  });
}

// ---------- Skill tree, awakenings, sets ----------

const treeNodes = () => TREE.flatMap(b => b.nodes.map((n, i) => ({ ...n, branch: b, idx: i })));
const knows = id => S.tree.includes(id);
const knowsSkill = sk => sk.base || treeNodes().some(n => n.skill === sk.id && knows(n.id));
const mySkills = () => SKILLS.filter(knowsSkill);
function canLearn(n) {
  const prev = n.branch.nodes[n.idx - 1];
  return !knows(n.id) && (!prev || knows(prev.id)) && S.level >= n.lv && S.sp >= n.cost;
}
function learn(id) {
  const n = treeNodes().find(x => x.id === id);
  if (!n || !canLearn(n)) return false;
  S.sp -= n.cost; S.tree.push(id);
  log(`Skill tree: learned ${n.name}.`); UI.toast(`Learned ${n.name}`);
  save(); return true;
}
function resetTree() {
  const spent = treeNodes().filter(n => knows(n.id)).reduce((a, n) => a + n.cost, 0);
  const cost = 100 + S.level * 10;
  if (!spent || S.gold < cost) return false;
  S.gold -= cost; S.sp += spent; S.tree = []; log(`Skill tree reset for ${cost} gold.`); save(); return true;
}

const awakenings = () => AWAKENINGS.filter(a => S.tower.highest > a.floor);
const awakening = () => awakenings().pop() || null;

const gearStat = (it, k) => Math.round((it[k] || 0) * (1 + 0.1 * (it.lvl || 0)));
function activeSets() {
  const count = {};
  equipped().forEach(it => { if (it.set) count[it.set] = (count[it.set] || 0) + 1; });
  return Object.entries(count).map(([id, n]) => ({ id, n, set: GEAR_SETS[id] }));
}
const upgradeCost = it => ({ shards: Math.round(((it.lvl || 0) + 1) * 4 * RARITY[it.rarity].mult), gold: ((it.lvl || 0) + 1) * 25 });
function upgradeGear(id) {
  const it = itemById(id); if (!it || (it.lvl || 0) >= MAX_UPGRADE) return false;
  const c = upgradeCost(it); if (S.shards < c.shards || S.gold < c.gold) return false;
  S.shards -= c.shards; S.gold -= c.gold; it.lvl = (it.lvl || 0) + 1;
  log(`Upgraded ${it.name} to +${it.lvl}.`); save(); return true;
}

function hero() {
  const s = S.stats, g = equipped().reduce((a, it) => { for (const k of ["atk", "def", "hp", "mag"]) a[k] += gearStat(it, k); return a; }, { atk: 0, def: 0, hp: 0, mag: 0 });
  const shield = S.party.includes("uchita") ? 1.15 : 1;
  const m = { atk: 1, mag: 1, hp: 1, mp: 1, def: 1, crit: 0, eva: 0 };
  todayBuffs().forEach(c => { const b = CAT_BUFFS[c]; if (b.stat === "all") { m.atk += b.v; m.mag += b.v; m.hp += b.v; } else m[b.stat] += b.v; });
  earnedTitles().forEach(t => { m[t.stat] += t.v; });
  treeNodes().forEach(n => { if (n.stat && knows(n.id)) m[n.stat] += n.v; });
  activeSets().forEach(({ n, set }) => [n >= 2 && set.two, n >= 3 && set.three].filter(Boolean).forEach(b => {
    if (b.stat === "all") { m.atk += b.v; m.mag += b.v; m.hp += b.v; } else m[b.stat] += b.v;
  }));
  const aw = awakening(); if (aw) for (const k of ["atk", "mag", "hp", "mp", "def"]) m[k] += aw.v;
  return {
    maxHp: Math.round((80 + s.VIT * 8 + S.level * 12 + g.hp) * m.hp),
    maxMp: Math.round((20 + s.WIL * 3 + s.INT * 2 + S.level * 2) * m.mp),
    atk: Math.round((6 + s.STR * 1.5 + S.level * 2.2 + g.atk) * m.atk),
    mag: Math.round((5 + s.INT * 2 + S.level * 1.8 + g.mag) * m.mag),
    def: Math.round((2 + s.VIT * 0.6 + s.WIL * 0.4 + g.def) * shield * m.def),
    crit: Math.min(0.6, 0.05 + s.PER * 0.005 + m.crit),
    eva: Math.min(0.4, 0.03 + s.SEN * 0.004 + m.eva),
  };
}

// ---------- Body log and weekly review ----------

function setBody(day, field, value) {
  const e = S.body[day] || (S.body[day] = {});
  if (value === "" || value == null || isNaN(value)) delete e[field]; else e[field] = +value;
  save();
}

function weekSummary(monday) {
  const days = [...Array(7)].map((_, i) => addDays(monday, i));
  const cats = {}; Object.keys(CATS).forEach(c => cats[c] = days.reduce((n, d) => n + ((S.catDays[d] || {})[c] || 0), 0));
  const goalTotal = Object.values(S.goals).reduce((a, b) => a + b, 0);
  const met = Object.keys(S.goals).reduce((n, c) => n + Math.min(cats[c], S.goals[c]), 0);
  const quests = days.reduce((n, d) => n + (S.history[d] || 0), 0);
  const weights = days.map(d => S.body[d]?.weight).filter(v => v != null);
  const sleeps = days.map(d => S.body[d]?.sleep).filter(v => v != null);
  return {
    monday, cats, quests, pct: goalTotal ? met / goalTotal : 0,
    activeDays: days.filter(d => S.history[d] > 0).length,
    weightChange: weights.length > 1 ? +(weights[weights.length - 1] - weights[0]).toFixed(1) : null,
    avgSleep: sleeps.length ? +(sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(1) : null,
  };
}

// On the first open of a new week, review last week and pay out.
function pendingReview() {
  const thisMon = mondayOf(localDay());
  if (S.lastReview >= thisMon) return null;
  const sum = weekSummary(addDays(thisMon, -7));
  S.lastReview = thisMon;
  sum.reward = sum.pct >= 1 ? "epic" : sum.pct >= 0.8 ? "rare" : sum.pct >= 0.5 ? "common" : null;
  if (sum.reward) { S.boxes.push(sum.reward); S.gold += Math.round(150 * sum.pct); }
  S.reviews.unshift(sum); S.reviews = S.reviews.slice(0, 12);
  log(`Weekly review: ${Math.round(sum.pct * 100)}% of goals met${sum.reward ? `, earned a ${RARITY[sum.reward].name} loot box` : ""}.`);
  save(); return sum;
}
const power = () => { const h = hero(); return Math.round(h.maxHp / 4 + h.atk * 2 + h.mag * 1.5 + h.def * 2); };

// ---------- Tower ----------

const areaOf = floor => Math.min(9, Math.floor((floor - 1) / 10));

function enemyFor(floor, stage) {
  const boss = stage === 3, ai = areaOf(floor), area = AREAS[ai];
  const scale = Math.pow(1.11, floor - 1);
  let name, look, id;
  if (boss) {
    const nb = NAMED_BOSSES[floor];
    name = nb ? nb.name : `${area.name} Guardian, Floor ${floor}`;
    look = nb ? nb.look : { kind: pick(["knight", "beast", "wraith"], SPR.rng(SPR.hash("f" + floor))), body: area.ground, accent: area.accent, eye: "#f2c14e" };
    id = `boss-${floor}`;
  } else {
    name = MINIONS[ai][(stage + floor) % 3];
    look = SPR.minionLook(name, ai);
    id = "mob-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }
  const mult = boss ? (NAMED_BOSSES[floor] ? 3.4 : 2.8) : 1 + stage * 0.15;
  return {
    id, name, look, boss, floor,
    maxHp: Math.round(70 * scale * mult),
    atk: Math.round(9 * Math.pow(1.095, floor - 1) * (boss ? 1.35 : 1)),
    def: Math.round(1 + floor * 0.9),
  };
}

// ---------- Loot ----------

function rollRarity(boost = 0) {
  const r = Math.random() * 100;
  const leg = RARITY.legendary.w + boost * 10, epic = RARITY.epic.w + boost * 20, rare = RARITY.rare.w + boost * 20;
  if (r < leg) return "legendary";
  if (r < leg + epic) return "epic";
  if (r < leg + epic + rare) return "rare";
  return "common";
}

function makeGear(rarity, floor) {
  const slot = pick(["weapon", "armor", "charm"]), R = RARITY[rarity];
  const base = (3 + floor * 0.9 + S.level * 0.5) * R.mult;
  const sets = Object.entries(GEAR_SETS).filter(([, st]) => floor >= st.from);
  const setId = Math.random() < 0.6 ? pick(sets)[0] : null;
  const it = { id: uid(), slot, rarity, name: setId ? GEAR_SETS[setId].pieces[slot] : pick(GEAR_NAMES[slot]), floor, set: setId, lvl: 0 };
  if (slot === "weapon") { it.atk = Math.round(base * 1.2); if (Math.random() < .4) it.mag = Math.round(base * .5); }
  if (slot === "armor") { it.def = Math.round(base * .6); it.hp = Math.round(base * 3); }
  if (slot === "charm") { it.mag = Math.round(base); it.hp = Math.round(base * 1.5); }
  return it;
}
const gearScore = it => gearStat(it, "atk") * 2 + gearStat(it, "mag") * 1.5 + gearStat(it, "def") * 2 + gearStat(it, "hp") / 4;

function openBox(index) {
  const rarity = S.boxes[index]; if (!rarity) return null;
  S.boxes.splice(index, 1);
  const R = RARITY[rarity], f = S.tower.highest, out = [];
  const gold = Math.round((20 + f * 4) * R.mult * (0.7 + Math.random() * 0.6));
  S.gold += gold; out.push({ t: `${gold} gold`, c: "#f2c14e" });
  if (Math.random() < .55) { const n = rarity === "common" ? 1 : 2; S.potions += n; out.push({ t: `${n} × Healing Potion`, c: "#4ade9a" }); }
  if (Math.random() < .3 + R.mult * .05) { S.ethers += 1; out.push({ t: "Mana Ether", c: "#4fb6ff" }); }
  const gearChance = { common: .35, rare: .65, epic: .9, legendary: 1 }[rarity];
  if (Math.random() < gearChance) { const it = makeGear(rarity, f); S.gear.push(it); out.push({ t: `${R.name} ${it.name}`, c: R.c, item: it }); }
  if (Math.random() < .25 + (rarity !== "common" ? .15 : 0)) { const gname = pick(GIFTS); S.gifts.push(gname); out.push({ t: `Gift: ${gname}`, c: "#ff9fcf" }); }
  if (rarity === "legendary" || (rarity === "epic" && Math.random() < .3)) { S.freezes++; out.push({ t: "Streak Freeze", c: "#bfe6ff" }); }
  const sh = Math.round((4 + f / 3) * R.mult); S.shards += sh; out.push({ t: `${sh} Mana Shards`, c: "#5ce1e6" });
  const ren = Math.round(5 * R.mult); S.renown += ren; out.push({ t: `${ren} renown`, c: "#a78bfa" });
  log(`Opened a ${R.name} loot box: ${out.map(o => o.t).join(", ")}.`);
  save(); return { rarity, out };
}

// ---------- Allies ----------

const allyUnlocked = a => S.tower.highest >= a.unlock;
const bond = id => S.bonds[id] || 0;
const bondCost = id => 15 + bond(id) * 12;
function raiseBond(id, useGift) {
  if (bond(id) >= 10) return false;
  if (useGift) { if (!S.gifts.length) return false; S.gifts.shift(); }
  else { if (S.renown < bondCost(id)) return false; S.renown -= bondCost(id); }
  S.bonds[id] = bond(id) + 1;
  const a = ALLIES.find(x => x.id === id);
  log(`Bond with ${a.name} rose to ${S.bonds[id]}.`);
  if (S.bonds[id] === 2) UI.toast(`${a.name} can now join your party.`);
  checkAch(); save(); return true;
}
function toggleParty(id) {
  if (S.party.includes(id)) S.party = S.party.filter(x => x !== id);
  else if (bond(id) >= 2 && S.party.length < 2) S.party.push(id);
  else return false;
  save(); return true;
}
const allyPower = id => Math.round((6 + S.level * 2 + S.tower.highest * 1.6) * (1 + bond(id) * 0.15));

// ---------- Anime ----------

const showById = id => S.anime.find(a => a.id === id);
const watching = () => S.anime.filter(a => a.status === "watching");
function startShow(id) {
  const p = ANIME_PICKS.find(x => x.id === id); if (!p || showById(id)) return;
  S.anime.push({ id, title: p.title, eps: p.eps, ep: 0, status: "watching" });
  log(`Started watching ${p.title}.`); save();
}
// Loving a show is a separate flag; only "Complete" moves it to the watched history.
function addEpisodes(id, n) {
  const a = showById(id); if (!a) return;
  a.ep = Math.max(0, Math.min(a.eps, a.ep + n));
  if (a.ep >= a.eps && a.status === "watching") setTimeout(() => UI.toast(`Last episode of ${a.title} logged. Mark it complete when you're done.`), 600);
  save();
}
function setShow(id, status) {
  const a = showById(id); if (!a) return;
  a.status = status; if (status === "completed") { a.ep = a.eps; a.doneOn = S.day; }
  log(`${a.title}: ${{ completed: "completed", dropped: "dropped", watching: "back to watching" }[status] || status}.`); save();
}
function toggleLove(id) { const a = showById(id); if (a) { a.loved = !a.loved; if (a.loved) log(`Loved ${a.title}.`); save(); } }
// "Already watched": counts as seen without logging episodes.
function seenPick(id) { const p = ANIME_PICKS.find(x => x.id === id); S.anime.push({ id, title: p.title, eps: p.eps, ep: p.eps, status: "seen", doneOn: S.day }); log(`Marked ${p.title} as already watched.`); save(); }
function skipPick(id) { S.anime.push({ id, title: ANIME_PICKS.find(x => x.id === id).title, eps: 0, ep: 0, status: "skipped" }); save(); }

// ---------- Beeyo ----------

// Add real minutes together; returns the newly unlocked scene, if any.
function addBeeyoTime(min) {
  S.beeyo.mins += min;
  const scene = BEEYO_SCENES.find(sc => S.beeyo.mins >= sc.at && !S.beeyo.seen.includes(sc.at));
  if (scene) { S.beeyo.seen.push(scene.at); log(`New moment with Beeyo: ${scene.title}.`); }
  save(); return scene || null;
}

// ---------- Gym ----------

const exerciseNames = () => [...new Set(Object.values(S.workouts).flat().map(w => w.ex))].sort();
function logWorkout(sets) {
  const prs = [];
  sets.forEach(w => { if (w.kg > (S.prs[w.ex] || 0)) { if (S.prs[w.ex]) prs.push(`${w.ex} ${w.kg} kg`); S.prs[w.ex] = w.kg; } });
  (S.workouts[S.day] ||= []).push(...sets);
  if (prs.length) { log(`New personal best: ${prs.join(", ")}.`); setTimeout(() => UI.toast(`New PR! ${prs[0]}`), 900); S.boxes.push("rare"); }
  save(); return prs;
}

// ---------- Meals ----------

// Nutrition score 0–100 for one meal: protein per calorie, a sensible portion size,
// fat share of calories, and having all three macros present.
function mealScore(m) {
  const kcal = +m.kcal || 0, p = +m.protein || 0, c = +m.carbs || 0, f = +m.fat || 0;
  if (!kcal) return 0;
  const pDensity = p / kcal * 100;                         // grams of protein per 100 kcal
  const protein = Math.min(40, pDensity / 8 * 40);         // 8 g / 100 kcal or more is full marks
  const portion = kcal >= 300 && kcal <= 750 ? 25 : kcal < 300 ? 25 * kcal / 300 : Math.max(0, 25 - (kcal - 750) / 20);
  const fatShare = f * 9 / kcal;
  const fat = fatShare <= 0.35 ? 20 : Math.max(0, 20 - (fatShare - 0.35) * 100);
  const balance = (p > 0) + (c > 0) + (f > 0) === 3 ? 15 : 5;
  return Math.round(protein + portion + fat + balance);
}
const mealGrade = sc => sc >= 85 ? "S" : sc >= 70 ? "A" : sc >= 55 ? "B" : sc >= 40 ? "C" : "D";

function addMeal(m) {
  m.score = mealScore(m); m.xp = Math.round(5 + m.score * 0.5); m.g = Math.round(m.xp / 2);
  (S.meals[S.day] ||= []).push(m);
  gainXp(m.xp); S.gold += m.g; S.statXp.VIT += Math.round(m.score / 4);
  while (S.statXp.VIT >= STAT_XP_PER_POINT) { S.statXp.VIT -= STAT_XP_PER_POINT; S.stats.VIT++; }
  log(`Logged ${m.name}: ${m.kcal} kcal, ${m.protein} g protein. Nutrition ${mealGrade(m.score)} (+${m.xp} EXP).`);
  setTimeout(() => UI.toast(`Meal grade ${mealGrade(m.score)}: +${m.xp} EXP`), 300);
  save();
}
function removeMeal(i) {
  const m = (S.meals[S.day] || []).splice(i, 1)[0];
  if (m?.xp) { S.xp = Math.max(0, S.xp - m.xp); xpToday(-m.xp); S.gold = Math.max(0, S.gold - (m.g || 0)); }
  save();
}
const caloLogged = (day = S.day) => CALO_SLOTS.filter(sl => (S.meals[day] || []).some(m => m.slot === sl));
const mealTotals = (day = S.day) => (S.meals[day] || []).reduce((t, m) => { for (const k of ["kcal", "protein", "carbs", "fat"]) t[k] += +m[k] || 0; return t; }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });

// ---------- Facts ----------

// Today's fact for a quest: the same fact all day, a new unread one each day.
function factFor(q) {
  const list = FACTS[q.facts] || [], seen = S.factsSeen[q.facts] ||= [];
  q.fact ??= null;
  if (q.fact && q.fact.d === S.day) return list[q.fact.i];
  if (seen.length >= list.length) seen.length = 0;
  const unread = list.map((_, i) => i).filter(i => !seen.includes(i));
  const i = unread[Math.floor(Math.random() * unread.length)];
  q.fact = { d: S.day, i }; seen.push(i); save();
  return list[i];
}

// ---------- Pet ----------

// Mood drifts down about 2 points an hour; feeding and petting lift it.
const petStageIdx = () => PET_STAGES.reduce((i, st, k) => S.level >= st.from ? k : i, 0);
function petMood() { const p = S.pet; return Math.max(0, Math.round(p.mood - (Date.now() - p.at) / 36e5 * 2)); }
function setMood(v) { S.pet.mood = Math.max(0, Math.min(100, v)); S.pet.at = Date.now(); }
const FEED_GAP = 3 * 36e5, PET_GAP = 10 * 6e4;
function feedPet() {
  if (Date.now() - S.pet.fedAt < FEED_GAP) return null;
  const treat = PET_TREATS[Math.floor(Math.random() * PET_TREATS.length)];
  setMood(petMood() + 30); S.pet.fedAt = Date.now(); save(); return treat;
}
function patPet() {
  if (Date.now() - S.pet.pettedAt < PET_GAP) return false;
  setMood(petMood() + 10); S.pet.pettedAt = Date.now(); save(); return true;
}
// Returns the new stage when the pet just evolved (checked after each render).
function checkEvolution() {
  const k = petStageIdx();
  if (k > S.pet.stage) { S.pet.stage = k; log(`${PET_STAGES[k - 1].name} evolved into ${PET_STAGES[k].name}!`); save(); return PET_STAGES[k]; }
  return null;
}
