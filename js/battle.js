// Turn-based tower battles. Emzi acts, party allies assist, then the enemy strikes.

let B = null;
const vary = () => 0.9 + Math.random() * 0.2;

function startBattle() {
  if (S.energy < BATTLE_COST) return false;
  if (S.tower.stage === 3 && !dailyDone()) return false; // floor bosses only on days your dailies are done
  S.energy -= BATTLE_COST; save();
  const h = hero(), e = enemyFor(S.tower.floor, S.tower.stage);
  B = { e, ehp: e.maxHp, eatkMult: 1, hp: h.maxHp, mp: h.maxMp, guard: 0, turn: 0, busy: false, over: null, fx: [], lines: [`${e.name} blocks the way.`] };
  UI.renderBattle(); return true;
}

function say(m) { B.lines.unshift(m); B.lines = B.lines.slice(0, 6); }
function hitEnemy(amount, label, crit) {
  amount = Math.max(1, Math.round(amount));
  B.ehp = Math.max(0, B.ehp - amount);
  B.fx.push({ on: "enemy", t: (crit ? "CRIT " : "") + amount, c: crit ? "#f2c14e" : "#ffffff" });
  say(`${label} deals ${amount}${crit ? " (critical!)" : ""}.`);
}
function healHero(amount, label) {
  const h = hero(); amount = Math.round(Math.min(amount, h.maxHp - B.hp));
  B.hp += amount; B.fx.push({ on: "hero", t: "+" + amount, c: "#4ade9a" }); say(`${label} restores ${amount} HP.`);
}

function playerAct(kind, arg) {
  if (!B || B.busy || B.over) return;
  const h = hero(), e = B.e;
  if (kind === "skill") {
    const sk = SKILLS.find(s => s.id === arg);
    if (!sk || !knowsSkill(sk) || B.mp < sk.mp) return;
    B.mp -= sk.mp;
    if (sk.kind === "heal") healHero(h.maxHp * sk.power, sk.name);
    else if (sk.kind === "guard") { B.guard = 3; say("Aegis Stance: damage halved for 3 turns."); }
    else if (sk.kind === "blind") { B.blind = 3; say(`${sk.name}: ${e.name}'s senses are dulled for 3 turns.`); }
    else {
      for (let i = 0; i < (sk.hits || 1); i++) {
        const crit = Math.random() < h.crit;
        const def = sk.pierce ? 0 : e.def;
        const base = sk.kind === "mag" ? h.mag * sk.power - def * 0.25 : h.atk * sk.power - def * 0.5;
        hitEnemy(base * vary() * (crit ? 1.75 : 1), sk.name, crit);
      }
      if (sk.stun && B.ehp > 0 && Math.random() < sk.stun) { B.stun = 1; say(`${e.name} is stunned by the voltage!`); }
      if (sk.hpCost) { const c = Math.round(h.maxHp * sk.hpCost); B.hp = Math.max(1, B.hp - c); B.fx.push({ on: "hero", t: "-" + c, c: "#b07cff" }); say(`The purple miasma burns Emzi for ${c}.`); }
    }
  } else if (kind === "defend") { B.guard = Math.max(B.guard, 1); B.mp = Math.min(h.maxMp, B.mp + Math.round(h.maxMp * .1)); say("Emzi braces and gathers mana."); }
  else if (kind === "potion") { if (S.potions < 1) return; S.potions--; healHero(h.maxHp * 0.45, "Healing Potion"); }
  else if (kind === "ether") { if (S.ethers < 1) return; S.ethers--; const n = Math.round(h.maxMp * .5); B.mp = Math.min(h.maxMp, B.mp + n); say(`Mana Ether restores ${n} MP.`); }
  else if (kind === "flee") { B.over = "fled"; say("Emzi retreats down the stairs."); log(`Retreated from ${e.name} on floor ${e.floor}.`); save(); UI.renderBattle(); return; }
  B.busy = true; UI.renderBattle();
  if (B.ehp <= 0) return setTimeout(win, 600);
  setTimeout(alliesAct, 550);
}

function alliesAct() {
  const h = hero();
  S.party.forEach(id => {
    if (B.ehp <= 0) return;
    const a = ALLIES.find(x => x.id === id), p = allyPower(id);
    if (a.role === "heal") return healHero(h.maxHp * 0.12, a.name + "'s " + a.ability);
    if (a.role === "shield") { B.guard = Math.max(B.guard, 1); return say(`${a.name}'s ${a.ability} shields Emzi.`); }
    if (a.role === "speed") { hitEnemy(p * .6 * vary(), a.name); if (B.ehp > 0) hitEnemy(p * .6 * vary(), a.name); return; }
    if (a.role === "crit") { const c = Math.random() < .45; return hitEnemy(p * vary() * (c ? 2 : 1), a.name + "'s " + a.ability, c); }
    if (a.role === "frost") { hitEnemy(p * vary(), a.name + "'s " + a.ability); if (B.eatkMult > .7) { B.eatkMult -= .1; say(`${B.e.name} is chilled and weakened.`); } return; }
    if (a.role === "fire") return hitEnemy(p * 1.3 * vary(), a.name + "'s " + a.ability);
    hitEnemy(p * vary() * (a.role === "gold" ? .7 : 1), a.name + "'s " + a.ability);
  });
  UI.renderBattle();
  if (B.ehp <= 0) return setTimeout(win, 600);
  setTimeout(enemyAct, S.party.length ? 550 : 0);
}

function enemyAct() {
  const h = hero(), e = B.e; B.turn++;
  if (B.stun > 0) { B.stun--; say(`${e.name} is stunned and can't act.`); B.busy = false; B.mp = Math.min(h.maxMp, B.mp + 2); return UI.renderBattle(); }
  const heavy = e.boss && B.turn % 3 === 0;
  const blindMiss = B.blind > 0 ? 0.35 : 0;
  if (B.blind > 0) B.blind--;
  if (e.boss && B.turn % 3 === 2) say(`${e.name} is gathering power…`);
  if (Math.random() < h.eva + blindMiss && !heavy) { B.fx.push({ on: "hero", t: "MISS", c: "#9fb0c6" }); say(`Emzi dodges ${e.name}'s attack.`); }
  else {
    let dmg = e.atk * B.eatkMult * (heavy ? 1.7 : 1) * (0.9 + Math.random() * .25) - h.def * 0.6;
    if (B.guard > 0) dmg *= 0.5;
    dmg = Math.max(1, Math.round(dmg));
    B.hp = Math.max(0, B.hp - dmg);
    B.fx.push({ on: "hero", t: "-" + dmg, c: "#ff5d6c" });
    say(`${e.name} ${heavy ? "unleashes a devastating blow" : "strikes"} for ${dmg}.`);
  }
  if (B.guard > 0) B.guard--;
  B.mp = Math.min(h.maxMp, B.mp + 2);
  B.busy = false;
  if (B.hp <= 0) return lose();
  UI.renderBattle();
}

function win() {
  const e = B.e, t = S.tower;
  B.over = "won"; B.busy = false;
  const gold = Math.round((8 + e.floor * 3) * (e.boss ? 4 : 1));
  const ren = e.boss ? 10 + e.floor * 2 : 2;
  S.gold += gold; S.renown += ren;
  const shards = Math.round((e.boss ? 6 : 1 + Math.random() * 2) * (1 + e.floor / 15));
  S.shards += shards;
  const reward = [`${gold} gold`, `${ren} renown`, `${shards} Mana Shards`];
  if (S.party.includes("yvento")) { const bonus = Math.round(gold * .25); S.gold += bonus; reward.push(`${bonus} bonus gold (Yvento)`); }
  if (e.boss || Math.random() < .35) { const r = rollRarity(e.boss ? .25 + (NAMED_BOSSES[e.floor] ? .3 : 0) : 0); S.boxes.push(r); reward.push(`${RARITY[r].name} loot box`); }
  B.reward = reward;
  if (e.boss) {
    const prevArea = areaOf(t.floor);
    t.floor = Math.min(101, t.floor + 1); t.stage = 0; t.highest = Math.max(t.highest, t.floor);
    log(`Floor ${e.floor} cleared: defeated ${e.name}.`);
    const aw = AWAKENINGS.find(a => a.floor === e.floor);
    if (aw && t.highest === e.floor + 1) { B.awaken = aw; log(`Awakening: Emzi becomes ${aw.name}. All stats +${Math.round(aw.v * 100)}%.`); }
    if (t.floor <= 100 && areaOf(t.floor) !== prevArea) { B.unlock = `New region unlocked: ${AREAS[areaOf(t.floor)].name}`; log(B.unlock); }
    const met = ALLIES.filter(a => a.unlock === t.highest).map(a => a.name);
    if (met.length) { B.met = `You met ${met.join(" and ")}.`; log(B.met); }
  } else { t.stage++; log(`Defeated ${e.name} on floor ${e.floor}.`); }
  checkAch(); save(); UI.renderBattle();
}

function lose() {
  B.over = "lost"; B.busy = false;
  log(`Emzi fell to ${B.e.name} on floor ${B.e.floor}. Train in real life and return stronger.`);
  save(); UI.renderBattle();
}
