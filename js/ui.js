// Screens and event handling.

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sprite = (id, look, cls = "", kind, big) => `<img class="spr ${cls}" src="${SPR.src(id, look, kind, big)}" alt="">`;
const bar = (v, max, cls) => `<div class="bar ${cls || ""}"><i style="width:${Math.max(0, Math.min(100, v / max * 100))}%"></i></div>`;

const UI = (() => {
  let tab = "quests", filter = "all", toastT;
  try { tab = localStorage.getItem("konqord-tab") || "quests"; } catch (e) {}

  function toast(m) { const el = $("toast"); el.textContent = m; el.classList.remove("show"); void el.offsetWidth; el.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 2600); }
  function modal(html) { const m = $("modal"); if (html == null) { m.hidden = true; m.innerHTML = ""; return; } m.innerHTML = `<div class="sheet">${html}</div>`; m.hidden = false; }

  function hud() {
    const rank = RANKS.filter(r => S.level >= r[0]).pop()[1];
    $("hud").innerHTML = `
      <span class="pill rank">${rank}</span>
      <span class="pill">LV ${S.level}</span>
      <span class="pill en" title="Energy">⚡ ${S.energy}</span>
      <span class="pill gold" title="Gold">${S.gold}g</span>
      <span class="pill st" title="Day streak">🔥 ${S.streak}</span>`;
    document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-current", b.dataset.tab === tab ? "page" : "false"));
  }

  // ---------- Quests ----------
  function quests() {
    const d = dailies(), dd = d.filter(q => q.done).length;
    const restUsed = S.restWeek === isoWeek(S.day);
    const head = dailyDone()
      ? `<b>${S.restToday ? "Rest day" : "Daily quest complete ✓"}</b><span>Streak is safe. ${S.restToday ? "" : "Loot box granted."}</span>`
      : `<b>Clear every daily quest</b><span class="warn">${24 - new Date().getHours()}h left · ${S.freezes ? `${S.freezes} streak freeze${S.freezes > 1 ? "s" : ""} will protect you` : "missing ends your streak"}</span>`;
    const list = S.quests.filter(q => (filter === "all" || q.cat === filter) && activeToday(q)).sort((a, b) => a.done - b.done || !!a.perWeek - !!b.perWeek);
    const offToday = S.quests.filter(q => !activeToday(q)).map(q => q.name);
    const buffs = todayBuffs();
    return petCard() + `
    <section class="win">
      <h2>Daily quest <small>${dd}/${d.length} · bonus ×${streakMult().toFixed(2)}</small></h2>
      <div class="daily-head">${head}</div>
      <div class="cats">${[["all", "All"], ...Object.entries(CATS).map(([k, c]) => [k, c.name])].map(([k, n]) => `<button data-filter="${k}" aria-pressed="${filter === k}">${n}</button>`).join("")}</div>
      <ul class="qlist">${list.map(q => {
        const c = CATS[q.cat], r = questReward(q);
        const today = q.done && q.unit ? (S.amounts[q.id] || []).filter(e => e.d === S.day).pop() : null;
        return `<li class="q ${q.done ? "done" : ""}" data-key="${q.id}" style="--c:${c.c}">
          <button class="check" data-quest="${q.id}" aria-label="${q.done ? "Undo" : "Complete"} ${esc(q.name)}">${q.done ? "✓" : ""}</button>
          <div class="qt"><div class="qn">${esc(q.name)}${q.kind === "calo" ? ` <span class="tgt">${caloLogged().length}/3 meals</span>` : ""}${q.unit ? ` <span class="tgt">${today ? `${today.a}/` : ""}${q.target} ${q.unit}</span>` : ""}</div><div class="qs">${q.perWeek ? `<span class="wk ${weekCount(q) >= q.perWeek ? "met" : ""}">${weekCount(q)}/${q.perWeek} this week</span> ` : ""}${c.name} · +${c.stat} · Rank ${q.diff}${q.daily ? "" : " · one-time"}${q.unit && questTotal(q) ? ` · ${questTotal(q).toLocaleString()} ${q.unit} total` : ""}</div></div>
          <div class="rew">${q.kind === "beeyo" ? "up to " : ""}+${r.xp} EXP<br><span class="g">+${r.g}g</span> <span class="e">⚡${r.en}</span></div>
          <button class="del" data-delquest="${q.id}" aria-label="Delete quest">×</button></li>`;
      }).join("") || `<li class="empty">No quests here yet. Add one below.</li>`}</ul>
      ${offToday.length ? `<p class="muted small">Not today: ${offToday.map(esc).join(", ")}.</p>` : ""}
      <p class="muted small">Gym and swim are weekly (2 each, 4 days total) and don't count toward the daily quest.</p>
      <form class="add" id="addQuest">
        <input id="qName" placeholder="New quest, e.g. 20 min Japanese flashcards" required maxlength="80">
        <select id="qCat" aria-label="Category">${Object.entries(CATS).map(([k, c]) => `<option value="${k}">${c.name}</option>`).join("")}</select>
        <select id="qDiff" aria-label="Difficulty">${Object.entries(DIFF).map(([k, v]) => `<option value="${k}" ${k === "C" ? "selected" : ""}>Rank ${k} · ${v.xp} EXP</option>`).join("")}</select>
        <select id="qUnit" aria-label="What to count">${UNITS.map(u => `<option value="${u}">${u ? "Count " + u : "No count"}</option>`).join("")}</select>
        <input id="qTarget" type="number" min="1" max="100000" placeholder="Target" aria-label="Starting target">
        <label class="tog"><input type="checkbox" id="qDaily" checked> Daily</label>
        <button class="btn" type="submit">Add</button>
      </form>
      <div class="rest">
        <button class="btn ghost" data-act="rest" ${restUsed || S.restToday ? "disabled" : ""}>${restUsed ? "Rest day used this week" : "Take this week's rest day"}</button>
        <span class="muted">${S.freezes} streak freeze${S.freezes === 1 ? "" : "s"} · best streak ${S.best}</span>
      </div>
    </section>
    <section class="win">
      <h2>Today's battle buffs <small>${buffs.length}/6 active</small></h2>
      <div class="buffs">${Object.entries(CAT_BUFFS).map(([c, b]) => `<span class="buff ${buffs.includes(c) ? "on" : ""}" style="--c:${CATS[c].c}"><b>${CATS[c].name}</b>${b.label}</span>`).join("")}</div>
      <p class="muted small">Clear any quest in a category to switch its buff on for today's battles.</p>
    </section>`;
  }

  // ---------- Pet ----------
  function petCard() {
    const st = PET_STAGES[petStageIdx()], next = PET_STAGES[petStageIdx() + 1], mood = petMood();
    const fedIn = S.pet.fedAt + FEED_GAP - Date.now();
    const feel = mood >= 80 ? "Overjoyed" : mood >= 55 ? "Happy" : mood >= 30 ? "Peckish" : "Lonely";
    return `<section class="pet" aria-label="Pet companion">
      <button class="pet-pic ${mood < 30 ? "sad" : ""}" data-act="pat" aria-label="Pet ${st.name}"><img src="${st.sprite}" alt="${st.name}"><span class="pet-shadow"></span></button>
      <div class="pet-info">
        <div class="pet-name"><b>${st.name}</b><span>Lv ${S.level}</span></div>
        <div class="pet-mood"><span>${feel}</span>${bar(mood, 100, "mood")}</div>
        <div class="pet-acts">
          <button class="btn ghost" data-act="feed" ${fedIn > 0 ? "disabled" : ""}>${fedIn > 0 ? `Full · ${Math.ceil(fedIn / 36e5)}h` : "Feed"}</button>
          <span class="muted small">${next ? `Evolves at Lv ${next.from}` : "Fully evolved"}</span>
        </div>
      </div>
    </section>`;
  }
  function petHearts() {
    const pic = document.querySelector(".pet-pic"); if (!pic || calm) return;
    const r = pic.getBoundingClientRect();
    for (let i = 0; i < 5; i++) {
      const h = document.createElement("span"); h.className = "heart-float"; h.textContent = "♥";
      h.style.cssText = `left:${r.left + r.width / 2 + (Math.random() - .5) * 40}px;top:${r.top + 20}px;animation-delay:${i * 70}ms`;
      document.body.appendChild(h); setTimeout(() => h.remove(), 1300);
    }
  }
  function showEvolution(st) {
    modal(`<div class="loot evo" style="--rc:#ff8a3d"><div class="burst"></div><h3>What? It's evolving!</h3>
      <img class="evo-pic" src="${st.sprite}" alt="${st.name}"><p class="fact-text" style="position:relative">Your companion evolved into <b>${st.name}</b>!</p>
      <button class="btn" data-act="close">Amazing</button></div>`);
  }

  // ---------- Life ----------
  function chart(field, label, unit, color) {
    const days = [...Array(30)].map((_, i) => addDays(S.day, i - 29));
    const pts = days.map((d, i) => [i, S.body[d]?.[field]]).filter(p => p[1] != null);
    if (pts.length < 2) return `<div class="chart empty"><b>${label}</b><span class="muted small">Log at least 2 days to see a chart.</span></div>`;
    const vs = pts.map(p => p[1]), lo = Math.min(...vs), hi = Math.max(...vs), pad = (hi - lo) * .15 || 1;
    const W = 300, H = 90, x = i => 6 + i / 29 * (W - 12), y = v => H - 8 - (v - lo + pad) / (hi - lo + pad * 2) * (H - 16);
    const path = pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join("");
    const last = pts[pts.length - 1];
    return `<div class="chart"><div class="ch-head"><b>${label}</b><span><b class="big">${last[1]}</b> ${unit}</span></div>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${label}, last 30 days, from ${lo} to ${hi} ${unit}">
        <line x1="0" x2="${W}" y1="${y(hi)}" y2="${y(hi)}" class="grid"/><line x1="0" x2="${W}" y1="${y(lo)}" y2="${y(lo)}" class="grid"/>
        <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
        <circle cx="${x(last[0])}" cy="${y(last[1])}" r="4" fill="${color}"/></svg>
      <div class="meta"><span>30 days ago</span><span>low ${lo} · high ${hi}</span><span>today</span></div></div>`;
  }

  function anime() {
    const active = S.anime.filter(a => a.status === "watching" || a.status === "dropped");
    const history = S.anime.filter(a => a.status === "completed" || a.status === "seen");
    const picks = ANIME_PICKS.filter(p => !showById(p.id));
    const heart = a => `<button class="love ${a.loved ? "on" : ""}" data-love="${a.id}" aria-pressed="${!!a.loved}" aria-label="Love ${esc(a.title)}">${a.loved ? "♥" : "♡"}</button>`;
    return `
      ${active.length ? `<ul class="shows">${active.map(a => `<li class="show ${a.status}">
        <div class="show-top"><div class="qt"><b>${esc(a.title)}</b><span class="small muted">${a.status === "dropped" ? "Dropped · " : ""}Episode ${a.ep}/${a.eps}</span></div>${heart(a)}</div>${bar(a.ep, a.eps || 1)}
        <div class="inv-acts">${a.status === "watching" ? `<button class="btn ghost" data-ep="${a.id}">+1 episode</button><button class="btn" data-show="${a.id}" data-st="completed">Complete</button><button class="btn ghost" data-show="${a.id}" data-st="dropped">Drop</button>`
          : `<button class="btn ghost" data-show="${a.id}" data-st="watching">Resume</button>`}</div></li>`).join("")}</ul>` : `<p class="muted small">Nothing on the go. Start one of the picks below.</p>`}
      ${picks.length ? `<h3 class="sub">Try next</h3><ul class="picks">${picks.slice(0, 4).map(p => `<li><div class="qt"><b>${esc(p.title)}</b><span class="small">${esc(p.why)}</span><span class="small muted">${p.eps} episodes</span></div>
        <div class="inv-acts"><button class="btn" data-startshow="${p.id}">Start watching</button><button class="btn ghost" data-seenshow="${p.id}">Already watched</button><button class="btn ghost" data-skipshow="${p.id}">Not for me</button></div></li>`).join("")}</ul>` : `<p class="muted small">You've tried every pick on the list.</p>`}
      ${history.length ? `<details class="watched"><summary>Watched history · ${history.length}</summary><ul class="totals">${history.map(a => `<li><span class="qt">${esc(a.title)}</span><span class="muted small">${a.status === "seen" ? "Watched before" : `Completed ${a.doneOn ? a.doneOn.slice(5) : ""}`}</span>${heart(a)}<span></span></li>`).join("")}</ul></details>` : ""}
      <p class="muted small">Logging the anime quest moves your show forward. ♥ marks the ones you love; Complete moves a show to your history.</p>`;
  }

  function life() {
    const b = S.body[S.day] || {}, mon = mondayOf(S.day), wk = weekSummary(mon);
    const h = S.history, days = [...Array(14)].map((_, i) => addDays(S.day, i - 13));
    const mx = Math.max(1, ...days.map(k => h[k] || 0));
    const counted = S.quests.filter(q => q.unit);
    const field = (id, label, unit, step, val) => `<label class="field"><span>${label}</span><input type="number" inputmode="decimal" step="${step}" min="0" id="body-${id}" data-body="${id}" value="${val ?? ""}" placeholder="—"><em>${unit}</em></label>`;
    return `
    <section class="win">
      <h2>Body &amp; food <small>today</small></h2>
      <div class="body-form">
        ${field("weight", "Weight", "kg", "0.1", b.weight)}${field("sleep", "Sleep", "hours", "0.5", b.sleep)}
        ${field("water", "Water", "glasses", "1", b.water)}${field("meals", "Healthy meals", "of 3", "1", b.meals)}
      </div>
      <div class="charts">${chart("weight", "Weight", "kg", "var(--p)")}${chart("sleep", "Sleep", "h", "var(--s)")}${chart("water", "Water", "glasses", "#5ce1e6")}${chart("meals", "Healthy meals", "/3", "#3dff9a")}</div>
    </section>
    <section class="win">
      <h2>Meals <small>${mealTotals().kcal} kcal today</small></h2>
      ${(() => { const t = mealTotals(), ms = S.meals[S.day] || []; return `
      <div class="macros"><span><b>${t.kcal}</b>kcal</span><span><b>${t.protein}</b>g protein</span><span><b>${t.carbs}</b>g carbs</span><span><b>${t.fat}</b>g fat</span></div>
      <ul class="totals">${ms.map((m, i) => `<li><span class="qt">${m.slot && m.slot !== "Other" ? `<span class="muted small">${m.slot} · </span>` : ""}<span class="grade g-${mealGrade(m.score || 0)}">${mealGrade(m.score || 0)}</span> ${esc(m.name)}</span><b>${m.kcal}</b><span class="muted small">kcal · ${m.protein} g P · +${m.xp || 0} EXP</span><button class="del" data-delmeal="${i}" aria-label="Remove meal">×</button></li>`).join("") || `<li class="empty">No meals logged today.</li>`}</ul>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="addmeal">+ Log meal</button><span class="muted small">On claude.ai you can snap the Calo sticker and Claude fills in the numbers. Photos aren't stored.</span></div>`; })()}
    </section>
    <section class="win">
      <h2>Gym <small>${Object.keys(S.prs).length} lifts tracked</small></h2>
      ${(() => { const days = Object.keys(S.workouts).sort().reverse().slice(0, 3);
        return `${Object.keys(S.prs).length ? `<h3 class="sub">Personal bests</h3><ul class="totals">${Object.entries(S.prs).sort().map(([ex, kg]) => `<li><span class="qt">${esc(ex)}</span><b>${kg}</b><span class="muted small">kg</span><span></span></li>`).join("")}</ul>` : ""}
        ${days.length ? `<h3 class="sub">Recent sessions</h3>${days.map(d => `<div class="session"><b>${d.slice(5)}</b><span class="small">${S.workouts[d].map(w => `${esc(w.ex)} ${w.sets}×${w.reps}${w.kg ? ` @ ${w.kg} kg` : ""}`).join(" · ")}</span></div>`).join("")}` : `<p class="muted small">Log a gym session from the Quests tab to start tracking lifts. Beating a personal best earns a Rare loot box.</p>`}`; })()}
    </section>
    <section class="win">
      <h2>Anime <small>${watching().length} watching</small></h2>
      ${anime()}
    </section>
    <section class="win">
      <h2>This week's goals <small>${Math.round(wk.pct * 100)}%</small></h2>
      <ul class="goals">${Object.entries(CATS).map(([c, cat]) => { const n = wk.cats[c], g = S.goals[c]; return `<li style="--c:${cat.c}">
        <span class="gn">${cat.name}</span>${bar(n, g || 1)}<span class="gv">${n}/<input type="number" min="0" max="50" data-goal="${c}" value="${g}" aria-label="${cat.name} weekly goal"></span></li>`; }).join("")}</ul>
      <p class="muted small">Hit 50% of your goals for a Common loot box, 80% for Rare, 100% for Epic, plus bonus gold.</p>
    </section>
    <section class="win">
      <h2>Lifetime totals</h2>
      <ul class="totals">${counted.map(q => `<li><span class="qt">${esc(q.name)}</span><b>${questTotal(q).toLocaleString()}</b><span class="muted small">${q.unit}</span><span class="muted small">target ${q.base} → ${q.target}</span></li>`).join("") || `<li class="empty">Add a count to a quest to track totals.</li>`}</ul>
    </section>
    <section class="win">
      <h2>Real-life titles <small>${earnedTitles().length}/${LIFE_TITLES.length} earned</small></h2>
      <ul class="titles">${LIFE_TITLES.map(t => { const n = S.catTotals[t.cat] || 0, ok = n >= t.need;
        return `<li class="${ok ? "on" : ""}"><div class="qt"><b>${t.name}</b><span class="small muted">${t.need} ${CATS[t.cat].name.toLowerCase()} quests · +${Math.round(t.v * 100)}% ${t.stat.toUpperCase()}</span></div>${ok ? `<span class="earned">Earned</span>` : `<span class="small">${n}/${t.need}</span>`}</li>`; }).join("")}</ul>
    </section>
    ${S.reviews.length ? `<section class="win"><h2>Past weeks</h2><ul class="totals">${S.reviews.map(r => `<li><span class="qt">Week of ${r.monday.slice(5)}</span><b>${Math.round(r.pct * 100)}%</b><span class="muted small">${r.quests} quests</span><span class="muted small">${r.reward ? RARITY[r.reward].name + " box" : "no box"}</span></li>`).join("")}</ul></section>` : ""}
    <section class="win">
      <h2>EXP history <small>${(S.xpDays[S.day] || 0).toLocaleString()} today</small></h2>
      ${(() => { const xd = days.map(k => S.xpDays[k] || 0), top = Math.max(1, ...xd), week = xd.slice(-7).reduce((a, b) => a + b, 0);
        return `<div class="xpbars" role="img" aria-label="EXP earned each day for the last 14 days">${days.map((k, i) => `<div class="xpcol ${k === S.day ? "today" : ""}" title="${k}: ${xd[i]} EXP">
          <span class="xpv">${xd[i] || ""}</span><i style="height:${xd[i] / top * 100}%"></i><span class="xpd">${new Date(k + "T12:00:00").toLocaleDateString(undefined, { weekday: "narrow" })}</span></div>`).join("")}</div>
        <div class="meta"><span>Last 7 days: ${week.toLocaleString()} EXP</span><span>Daily average: ${Math.round(week / 7)}</span></div>`; })()}
      <div class="ach">${ACH.map(([n]) => `<span class="${S.ach.includes(n) ? "on" : ""}">${n}</span>`).join("")}</div>
      <div class="logdays">${[...new Set(S.log.map(l => l.t))].slice(0, 10).map(d => `<details ${d === S.day ? "open" : ""}><summary><b>${d === S.day ? "Today" : new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</b><span>${(S.xpDays[d] || 0).toLocaleString()} EXP · ${S.history[d] || 0} quests</span></summary>
        <ul class="log">${S.log.filter(l => l.t === d).map(l => `<li>${esc(l.m)}</li>`).join("")}</ul></details>`).join("")}</div>
    </section>`;
  }

  // ---------- Tower ----------
  function tower() {
    const t = S.tower, done = t.floor > 100;
    const f = Math.min(t.floor, 100), area = AREAS[areaOf(f)];
    const e = done ? null : enemyFor(t.floor, t.stage);
    const bossLocked = e && e.boss && !dailyDone();
    const stages = [0, 1, 2, 3].map(i => `<span class="stage ${i < t.stage ? "cleared" : i === t.stage ? "now" : ""}">${i === 3 ? "Boss" : "Mini-boss " + (i + 1)}</span>`).join("");
    const floors = [...Array(10)].map((_, i) => { const n = area.floors[0] + i; return `<i class="${n < t.floor ? "cleared" : n === t.floor ? "now" : ""} ${NAMED_BOSSES[n] ? "named" : ""}" title="Floor ${n}${NAMED_BOSSES[n] ? ": " + NAMED_BOSSES[n].name : ""}">${n}</i>`; }).join("");
    return `
    <section class="win scene" style="--sky:${area.sky};--ground:${area.ground};--acc:${area.accent}">
      <h2>${done ? "The summit" : `Floor ${t.floor}`} <small>${done ? "All 100 cleared" : t.stage === 3 ? "Boss fight" : `Mini-boss ${t.stage + 1} of 3`}</small></h2>
      ${done ? `<p class="lead">Emzi has conquered all 100 floors. The Haloed Devourer is no more.</p>` : `
      <div class="stage-row">${stages}</div>
      <div class="arena">
        <div class="fighter">${sprite("emzi", HERO_LOOK, "hero")}<span>Emzi · PWR ${power()}</span></div>
        <div class="vs">vs</div>
        <div class="fighter">${sprite(e.id, e.look, "foe" + (e.boss ? " boss" : ""), "monster", e.boss)}<span>${esc(e.name)}</span></div>
      </div>
      <div class="foe-stats">HP ${e.maxHp} · ATK ${e.atk} · DEF ${e.def}${e.boss ? " · charges a heavy blow every 3rd turn" : ""}</div>
      <div class="energy-row">
        <div style="flex:1;min-width:0">${bar(S.energy, ENERGY_MAX, "en")}<div class="meta"><span>Energy ${S.energy}/${ENERGY_MAX}</span><span>${BATTLE_COST} per battle</span></div></div>
        <button class="btn big" data-act="fight" ${S.energy < BATTLE_COST || bossLocked ? "disabled" : ""}>${bossLocked ? "Boss sealed" : S.energy < BATTLE_COST ? "Need energy" : e.boss ? "Challenge boss" : "Enter battle"}</button>
      </div>
      ${bossLocked ? `<p class="lock-note">The floor boss only answers on days you clear every daily quest (${dailies().filter(q => q.done).length}/${dailies().length} today).</p>` : S.energy < BATTLE_COST ? `<p class="muted">Clear real quests to earn energy.</p>` : ""}
      ${todayBuffs().length ? `<div class="buffs small-buffs">${todayBuffs().map(c => `<span class="buff on" style="--c:${CATS[c].c}">${CAT_BUFFS[c].label}</span>`).join("")}</div>` : ""}`}
    </section>
    <section class="win">
      <h2>Floors <small>${area.floors[0]}–${area.floors[1]}</small></h2>
      <div class="floors">${floors}</div>
    </section>
    <section class="win">
      <h2>Regions <small>${areaOf(Math.min(S.tower.highest, 100)) + 1}/10 unlocked</small></h2>
      <div class="areas">${AREAS.map((a, i) => `<div class="area ${S.tower.highest >= a.floors[0] ? "open" : ""}" style="--acc:${THEMES[i].p};--acc2:${THEMES[i].s}"><b>${a.name}</b><span>${S.tower.highest >= a.floors[0] ? `Floors ${a.floors[0]}–${a.floors[1]}` : `Locked until floor ${a.floors[0]}`}</span></div>`).join("")}</div>
    </section>`;
  }

  function renderBattle() {
    if (!B) return modal(null);
    const h = hero(), e = B.e, area = AREAS[areaOf(e.floor)];
    const all = B.fx.splice(0);
    const fxFor = on => all.filter(f => f.on === on).map((f, i) => `<span class="float" style="color:${f.c};animation-delay:${i * 90}ms">${esc(f.t)}</span>`).join("");
    const party = S.party.map(id => { const a = ALLIES.find(x => x.id === id); return `<div class="mini">${sprite(a.id, a.look)}<span>${a.name}</span></div>`; }).join("");
    let controls;
    if (B.over) {
      const title = { won: e.boss ? `Floor ${e.floor} cleared!` : "Victory", lost: "Defeated", fled: "Retreated" }[B.over];
      controls = `<div class="result ${B.over}"><b>${title}</b>
        ${B.reward ? `<ul>${B.reward.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}
        ${B.awaken ? `<p class="awaken-msg" style="--aura:${B.awaken.aura}">Awakening: ${esc(B.awaken.name)}<span>${esc(B.awaken.desc)} All stats +${Math.round(B.awaken.v * 100)}%.</span></p>` : ""}
        ${B.unlock ? `<p class="unlock">${esc(B.unlock)}</p>` : ""}${B.met ? `<p class="unlock">${esc(B.met)} Visit Allies to befriend them.</p>` : ""}
        ${B.over === "lost" ? `<p class="muted">No progress lost. Clear real quests to grow stronger, then try again.</p>` : ""}
        <div class="row"><button class="btn" data-act="close-battle">Continue</button>
        ${B.over === "won" && S.energy >= BATTLE_COST && S.tower.floor <= 100 && !(S.tower.stage === 3 && !dailyDone()) ?`<button class="btn ghost" data-act="next-battle">Next battle (⚡${BATTLE_COST})</button>` : ""}</div></div>`;
    } else {
      const skills = mySkills().map(s => `<button class="act" data-skill="${s.id}" ${B.busy || B.mp < s.mp ? "disabled" : ""} title="${esc(s.desc)}"><b>${s.name}</b><span>${s.mp ? s.mp + " MP" : "free"}</span></button>`).join("");
      controls = `<div class="acts">${skills}
        <button class="act alt" data-act="defend" ${B.busy ? "disabled" : ""}><b>Defend</b><span>+MP, guard</span></button>
        <button class="act alt" data-act="potion" ${B.busy || !S.potions ? "disabled" : ""}><b>Potion</b><span>×${S.potions}</span></button>
        <button class="act alt" data-act="ether" ${B.busy || !S.ethers ? "disabled" : ""}><b>Ether</b><span>×${S.ethers}</span></button>
        <button class="act alt" data-act="flee" ${B.busy ? "disabled" : ""}><b>Retreat</b><span>keep progress</span></button>
      </div>${S.sp ? `<p class="muted small">You have ${S.sp} unspent skill point${S.sp > 1 ? "s" : ""}. Learn skills on the Emzi tab.</p>` : ""}`;
    }
    modal(`
      <div class="battle" style="--sky:${area.sky};--ground:${area.ground};--acc:${area.accent}">
        <div class="bhead"><span>Floor ${e.floor} · ${area.name}</span><span>Turn ${B.turn + 1}</span></div>
        <div class="field">
          <div class="side">
            <div class="who"><b>Emzi</b> ${B.guard ? `<em>guard ${B.guard}</em>` : ""}</div>
            ${bar(B.hp, h.maxHp, "hp")}<div class="meta"><span>HP ${B.hp}/${h.maxHp}</span></div>
            ${bar(B.mp, h.maxMp, "mp")}<div class="meta"><span>MP ${B.mp}/${h.maxMp}</span></div>
            <div class="stagepx">${sprite("emzi", HERO_LOOK, "hero" + (B.hp <= 0 ? " ko" : ""))}<div class="fx">${fxFor("hero")}</div></div>
            <div class="party">${party}</div>
          </div>
          <div class="side right">
            <div class="who"><b>${esc(e.name)}</b>${e.boss ? `<em>Floor boss</em>` : ""}</div>
            ${bar(B.ehp, e.maxHp, "ehp")}<div class="meta"><span>HP ${B.ehp}/${e.maxHp}</span></div>
            <div class="stagepx">${sprite(e.id, e.look, "foe" + (e.boss ? " boss" : "") + (B.ehp <= 0 ? " ko" : ""), "monster", e.boss)}<div class="fx">${fxFor("enemy")}</div></div>
          </div>
        </div>
        <ul class="blog">${B.lines.map(l => `<li>${esc(l)}</li>`).join("")}</ul>
        ${controls}
      </div>`);
  }

  // ---------- Hero ----------
  // Fire Emblem-style stat compass: a hexagon with one axis per stat.
  function radar(vals, labels) {
    const n = vals.length, R = 52, C = 70, max = Math.max(1, ...vals) * 1.15;
    const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [C + Math.cos(a) * r, C + Math.sin(a) * r]; };
    const ring = f => vals.map((_, i) => pt(i, R * f).map(v => v.toFixed(1)).join(",")).join(" ");
    const shape = vals.map((v, i) => pt(i, R * Math.max(.06, v / max)).map(x => x.toFixed(1)).join(",")).join(" ");
    return `<svg class="radar" viewBox="0 0 140 140" role="img" aria-label="${labels.map((l, i) => `${l} ${Math.round(vals[i])}`).join(", ")}">
      ${[1, .66, .33].map(f => `<polygon points="${ring(f)}" class="r-ring"/>`).join("")}
      ${vals.map((_, i) => { const [x, y] = pt(i, R); return `<line x1="${C}" y1="${C}" x2="${x}" y2="${y}" class="r-axis"/>`; }).join("")}
      <polygon points="${shape}" class="r-shape"/>
      ${labels.map((l, i) => { const [x, y] = pt(i, R + 11); return `<text x="${x}" y="${y}" class="r-lbl">${l}</text>`; }).join("")}
    </svg>`;
  }

  function heroView() {
    const h = hero(), aw = awakening(), nextAw = AWAKENINGS.find(a => S.tower.highest <= a.floor);
    const title = aw ? aw.name : TITLES.filter(t => S.level >= t[0]).pop()[1];
    const slots = ["weapon", "armor", "charm"];
    const inv = [...S.gear].sort((a, b) => (S.equip[b.slot] === b.id) - (S.equip[a.slot] === a.id) || gearScore(b) - gearScore(a));
    const statLine = it => ["atk", "mag", "def", "hp"].filter(k => it[k]).map(k => `+${gearStat(it, k)} ${k.toUpperCase()}`).join(" · ");
    const sets = activeSets();
    return `
    <section class="win fe-sheet">
      <div class="fe-banner"><span class="fe-name">Emzi</span><span class="fe-epithet">${esc(title)}</span></div>
      <div class="fe-grid">
        <div class="fe-col">
          <div class="fe-card">
            <div class="fe-id">
              <div class="fe-class">${aw ? esc(aw.name) : "Metaphysic mage"}</div>
              <div class="fe-row"><span>HP</span><b>${h.maxHp}<i>/</i>${h.maxHp}</b></div>
              <div class="fe-row"><span>Lv</span><b>${S.level}</b><span class="fe-next">Next ${need(S.level) - S.xp}</span></div>
              ${bar(S.xp, need(S.level), "fe-xp")}
              <div class="fe-row"><span>Rank</span><b>${RANKS.filter(r => S.level >= r[0]).pop()[1]}</b><span class="fe-next">SP ${S.sp}</span></div>
            </div>
            <div class="fe-portrait ${aw ? "awake" : ""}" style="${aw ? `--aura:${aw.aura}` : ""}">${sprite("emzi", HERO_LOOK, "hero")}</div>
          </div>
          <div class="fe-sec"><span>Combat stats</span></div>
          <div class="fe-split">
            <div class="fe-stats">
              ${[["Atk", h.atk], ["Mag", h.mag], ["Def", h.def], ["MP", h.maxMp], ["Crit", Math.round(h.crit * 100)], ["Avo", Math.round(h.eva * 100)]].map(([k, v]) => `<div class="fe-row"><span>${k}</span><b>${v}</b></div>`).join("")}
            </div>
            ${radar([h.atk, h.mag, h.def, h.maxMp / 3, h.crit * 200, h.eva * 200], ["Atk", "Mag", "Def", "MP", "Crit", "Avo"])}
          </div>
          <div class="fe-sec"><span>Basic stats</span><span>Rating <b>${power()}</b></span></div>
          <div class="fe-split">
            <div class="fe-stats">
              ${Object.keys(STATS).map(k => `<div class="fe-row fe-basic" title="${STATS[k]}"><span>${k[0] + k.slice(1).toLowerCase()}</span><b>${S.stats[k]}</b>
                <button class="plus" data-stat="${k}" ${S.points ? "" : "disabled"} aria-label="Add a point to ${k}">+</button>${bar(S.statXp[k], STAT_XP_PER_POINT, "thin")}</div>`).join("")}
            </div>
            ${radar(Object.keys(STATS).map(k => S.stats[k]), Object.keys(STATS).map(k => k[0] + k.slice(1).toLowerCase()))}
          </div>
          <p class="muted small">${S.points ? `<b class="gold">${S.points} unspent point${S.points > 1 ? "s" : ""}.</b> ` : ""}Each stat also rises on its own as you clear real quests in its category.</p>
        </div>
        <div class="fe-col">
          <div class="fe-sec"><span>Equipped</span><span>Upgrade</span></div>
          <ul class="fe-list">${slots.map(sl => { const it = itemById(S.equip[sl]); return `<li><span class="fe-ico">${{ weapon: "⚔", armor: "⛨", charm: "✦" }[sl]}</span><span class="fe-item" style="${it ? `color:${RARITY[it.rarity].c}` : ""}">${it ? esc(it.name) : `<i class="muted">No ${sl}</i>`}</span><b>${it ? `+${it.lvl || 0}` : ""}</b></li>`; }).join("")}</ul>
          <div class="fe-sec"><span>Items</span><span>Owned</span></div>
          <ul class="fe-list">
            <li><span class="fe-ico">⚗</span><span class="fe-item">Healing potion</span><b>${S.potions}</b></li>
            <li><span class="fe-ico">✧</span><span class="fe-item">Mana ether</span><b>${S.ethers}</b></li>
            <li><span class="fe-ico">◆</span><span class="fe-item">Mana shards</span><b>${S.shards}</b></li>
            <li><span class="fe-ico">❀</span><span class="fe-item">Gifts</span><b>${S.gifts.length}</b></li>
            <li><span class="fe-ico">❄</span><span class="fe-item">Streak freezes</span><b>${S.freezes}</b></li>
          </ul>
          <div class="fe-sec"><span>Skills</span><span>MP</span></div>
          <ul class="fe-list">${mySkills().map(sk => `<li title="${esc(sk.desc)}"><span class="fe-ico">${sk.kind === "mag" || sk.kind === "blind" ? "ϟ" : sk.kind === "heal" ? "✚" : "⚔"}</span><span class="fe-item">${sk.name}</span><b>${sk.mp || "–"}</b></li>`).join("")}</ul>
        </div>
        <div class="fe-col">
          <div class="fe-sec"><span>Personal ability</span></div>
          <ul class="fe-list"><li><span class="fe-ico">✺</span><span class="fe-item">${aw ? esc(aw.name) : "Fallen Sibyl"}</span><b></b></li></ul>
          <div class="fe-sec"><span>Learned abilities</span></div>
          <ul class="fe-list">${treeNodes().filter(n => n.stat && knows(n.id)).map(n => `<li title="${esc(n.desc)}"><span class="fe-ico" style="color:${n.branch.color}">◈</span><span class="fe-item">${n.name}</span><b class="small">${n.desc.split(".")[0]}</b></li>`).join("") || `<li class="fe-empty"><span class="fe-ico">◇</span><span class="fe-item muted">Learn passives in the skill tree</span><b></b></li>`}</ul>
          <div class="fe-sec"><span>Titles</span></div>
          <ul class="fe-list">${earnedTitles().map(t => `<li><span class="fe-ico">♛</span><span class="fe-item">${t.name}</span><b class="small">+${Math.round(t.v * 100)}% ${t.stat.toUpperCase()}</b></li>`).join("") || `<li class="fe-empty"><span class="fe-ico">◇</span><span class="fe-item muted">Earned from real-life milestones</span><b></b></li>`}</ul>
          <div class="fe-sec"><span>Today's blessings</span></div>
          <ul class="fe-list">${todayBuffs().map(c => `<li><span class="fe-ico" style="color:${CATS[c].c}">●</span><span class="fe-item">${CATS[c].name}</span><b class="small">${CAT_BUFFS[c].label}</b></li>`).join("") || `<li class="fe-empty"><span class="fe-ico">◇</span><span class="fe-item muted">Clear quests to bless today's battles</span><b></b></li>`}</ul>
        </div>
      </div>
    </section>
    <section class="win">
      <h2>Awakenings <small>${awakenings().length}/${AWAKENINGS.length}</small></h2>
      <ol class="awaken">${AWAKENINGS.map(a => { const on = S.tower.highest > a.floor; return `<li class="${on ? "on" : ""} ${a === nextAw ? "next" : ""}" style="--aura:${a.aura}">
        <span class="af">F${a.floor}</span><div class="qt"><b>${on ? a.name : a === nextAw ? a.name : "???"}</b><span class="small">${on || a === nextAw ? a.desc : "Climb higher to learn more."}</span></div><span class="small">${on ? "Awakened" : `+${Math.round(a.v * 100)}% all`}</span></li>`; }).join("")}</ol>
      <p class="muted small">Defeat the boss of each milestone floor to awaken. Each awakening permanently raises ATK, MAG, HP, MP and DEF.</p>
    </section>
    <section class="win">
      <h2>Skill tree <small>${S.sp} SP</small></h2>
      <div class="tree">${TREE.map(br => `<div class="branch" style="--bc:${br.color}"><h3>${br.name}</h3>${br.nodes.map((n, i) => {
        const node = { ...n, branch: br, idx: i }, have = knows(n.id), can = canLearn(node), prevOk = i === 0 || knows(br.nodes[i - 1].id);
        return `<button class="node ${have ? "have" : can ? "can" : ""}" data-learn="${n.id}" ${can ? "" : "disabled"} aria-label="${n.name}: ${n.desc}">
          <b>${n.name}</b><span>${n.desc}</span><em>${have ? "Learned" : !prevOk ? "Locked" : S.level < n.lv ? `LV ${n.lv}` : `${n.cost} SP`}</em></button>`; }).join("")}</div>`).join("")}</div>
      <div class="row tree-foot"><span class="muted small">1 SP per level. Learn each branch in order.</span>
        <button class="btn ghost" data-act="reset-tree" ${S.tree.length && S.gold >= 100 + S.level * 10 ? "" : "disabled"}>Reset tree · ${100 + S.level * 10}g</button></div>
    </section>
    <section class="win">
      <h2>Equipment <small>${S.shards} Mana Shards</small></h2>
      <div class="slots">${slots.map(sl => { const it = itemById(S.equip[sl]); return `<div class="slot"><span class="muted small">${sl}</span>${it ? `<b style="color:${RARITY[it.rarity].c}">${esc(it.name)}${it.lvl ? ` +${it.lvl}` : ""}</b><span class="small">${statLine(it)}</span>` : `<b class="muted">Empty</b>`}</div>`; }).join("")}</div>
      ${sets.length ? `<div class="sets">${sets.map(({ n, set }) => `<div class="setb"><b>${set.name} set ${n}/3</b><span class="${n >= 2 ? "on" : ""}">2: ${set.two.label}</span><span class="${n >= 3 ? "on" : ""}">3: ${set.three.label}</span></div>`).join("")}</div>` : ""}
      <h2 style="margin-top:16px">Inventory <small>${S.potions} potions · ${S.ethers} ethers · ${S.gifts.length} gifts</small></h2>
      <ul class="inv">${inv.map(it => { const on = S.equip[it.slot] === it.id, c = upgradeCost(it), maxed = (it.lvl || 0) >= MAX_UPGRADE;
        return `<li class="${on ? "eq" : ""}"><span class="dot" style="background:${RARITY[it.rarity].c}"></span><div class="qt"><b>${esc(it.name)}${it.lvl ? ` <span class="plus-lvl">+${it.lvl}</span>` : ""}</b><span class="small muted">${RARITY[it.rarity].name} ${it.slot}${it.set ? ` · ${GEAR_SETS[it.set].name} set` : ""} · ${statLine(it)}</span></div>
        <div class="inv-acts"><button class="btn ${on ? "ghost" : ""}" data-equip="${it.id}">${on ? "Unequip" : "Equip"}</button>
        <button class="btn ghost" data-upgrade="${it.id}" ${maxed || S.shards < c.shards || S.gold < c.gold ? "disabled" : ""}>${maxed ? "Max" : `Upgrade · ${c.shards}◆ ${c.gold}g`}</button>
        ${on ? "" : `<button class="del" data-sell="${it.id}" title="Sell" aria-label="Sell for ${Math.round(gearScore(it))} gold">${Math.round(gearScore(it))}g</button>`}</div></li>`; }).join("") || `<li class="empty">No gear yet. Loot boxes drop weapons, armor and charms.</li>`}</ul>
      <p class="muted small">Upgrades add 10% of an item's stats per level, up to +${MAX_UPGRADE}. Mana Shards drop from battles and loot boxes.</p>
    </section>`;
  }

  // ---------- Allies ----------
  function allies() {
    return beeyoCard() + `
    <section class="win">
      <h2>Allies <small>${S.renown} renown · ${S.gifts.length} gifts · party ${S.party.length}/2</small></h2>
      <p class="muted small">Spend renown or gifts to deepen bonds. At bond 2, an ally can join your party and fight beside Emzi.</p>
      <ul class="allies">${ALLIES.map(a => {
        const open = allyUnlocked(a), b = bond(a.id), inParty = S.party.includes(a.id);
        if (!open) return `<li class="ally locked"><div class="portrait sm">${sprite(a.id, a.look, "silhouette")}</div><div class="qt"><b>???</b><span class="small muted">Met on floor ${a.unlock}</span></div></li>`;
        return `<li class="ally"><div class="portrait sm">${sprite(a.id, a.look)}</div>
          <div class="qt"><b>${a.name}</b> <span class="small muted">· ${a.ability}</span><span class="small">${a.desc}</span>
          <div class="hearts">${[...Array(10)].map((_, i) => `<i class="${i < b ? "on" : ""}"></i>`).join("")}</div></div>
          <div class="ally-acts">
            <button class="btn ghost" data-bond="${a.id}" ${b >= 10 || S.renown < bondCost(a.id) ? "disabled" : ""}>${b >= 10 ? "Max bond" : `Spend time · ${bondCost(a.id)}`}</button>
            <button class="btn ghost" data-gift="${a.id}" ${b >= 10 || !S.gifts.length ? "disabled" : ""}>Give gift</button>
            <button class="btn ${inParty ? "" : "ghost"}" data-party="${a.id}" ${b < 2 || (!inParty && S.party.length >= 2) ? "disabled" : ""}>${inParty ? "In party" : "Add to party"}</button>
          </div></li>`;
      }).join("")}</ul>
    </section>`;
  }

  // ---------- Shop ----------
  function shop() {
    return `
    <section class="win">
      <h2>Loot boxes <small>${S.boxes.length} unopened</small></h2>
      <div class="boxes">${S.boxes.map((r, i) => `<button class="box" data-open="${i}" style="--rc:${RARITY[r].c}"><span class="lid"></span><b>${RARITY[r].name}</b></button>`).join("") || `<p class="muted">Earn loot boxes by finishing your daily quests, beating bosses and unlocking achievements.</p>`}</div>
    </section>
    <section class="win">
      <h2>Real-life rewards <small>${S.gold} gold</small></h2>
      <ul class="shop">${S.shop.map(r => `<li><span class="qt">${esc(r.name)}</span><span class="gold">${r.cost}g</span><button class="btn" data-buy="${r.id}" ${S.gold < r.cost ? "disabled" : ""}>Buy</button><button class="del" data-delreward="${r.id}" aria-label="Delete reward">×</button></li>`).join("")}</ul>
      <form class="addr" id="addReward"><input id="rName" placeholder="Reward, e.g. Order takeout" required maxlength="60"><input id="rCost" type="number" min="1" max="99999" placeholder="Gold" required aria-label="Cost in gold"><button class="btn" type="submit">Add</button></form>
    </section>
    <section class="win">
      <h2>Tower supplies</h2>
      <ul class="shop">
        <li><span class="qt">Healing Potion <span class="small muted">restores 45% HP</span></span><span class="gold">25g</span><button class="btn" data-supply="potion" ${S.gold < 25 ? "disabled" : ""}>Buy</button></li>
        <li><span class="qt">Mana Ether <span class="small muted">restores 50% MP</span></span><span class="gold">40g</span><button class="btn" data-supply="ether" ${S.gold < 40 ? "disabled" : ""}>Buy</button></li>
        <li><span class="qt">Streak Freeze <span class="small muted">saves your streak on a missed day</span></span><span class="gold">120g</span><button class="btn" data-supply="freeze" ${S.gold < 120 ? "disabled" : ""}>Buy</button></li>
      </ul>
    </section>
    <section class="win">
      <h2>Save data</h2>
      <p class="muted small">Progress is stored on this device. Copy a backup code to move it to another device.</p>
      <div class="row"><button class="btn ghost" data-act="export">Copy backup code</button><button class="btn ghost" data-act="import">Restore from code</button><button class="btn ghost danger" data-act="reset">Reset everything</button></div>
      <div id="saveArea"></div>
    </section>`;
  }

  const VIEWS = { quests, life, tower, hero: heroView, allies, shop };

  function logPrompt(q) {
    modal(`<form class="logq" id="logForm" data-q="${q.id}">
      <h3>${esc(q.name)}</h3>
      <label for="logAmt">How many ${q.unit} today?</label>
      <div class="row"><input id="logAmt" type="number" inputmode="decimal" min="0" step="any" value="${q.target}" required><span class="muted">${q.unit} · target ${q.target}</span></div>
      ${q.cat === "watch" && watching().length ? `<label for="logShow">Which show?</label><select id="logShow">${watching().map(a => `<option value="${a.id}">${esc(a.title)} · ep ${a.ep}/${a.eps}</option>`).join("")}<option value="">Something else</option></select>` : ""}
      <div class="row"><button class="btn" type="submit">Clear quest</button><button class="btn ghost" type="button" data-act="close">Cancel</button></div>
    </form>`);
    setTimeout(() => { const i = $("logAmt"); if (i) { i.focus(); i.select(); } }, 50);
  }

  // ---------- Gym, meals, Beeyo ----------
  function gymRow(prev, w) {
    const v = n => w ? (w[n] ?? "") : prev ? prev.querySelector(`[name=${n}]`).value : "";
    return `<div class="gymrow"><input name="ex" list="exList" placeholder="Exercise, e.g. Bench press" value="${w ? esc(w.ex) : ""}" required aria-label="Exercise">
      <input name="sets" type="number" min="1" inputmode="numeric" placeholder="Sets" value="${v("sets") || 3}" aria-label="Sets">
      <input name="reps" type="number" min="1" inputmode="numeric" placeholder="Reps" value="${v("reps") || 10}" aria-label="Reps">
      <input name="kg" type="number" min="0" step="0.5" inputmode="decimal" placeholder="kg" value="${v("kg") || ""}" aria-label="Weight in kg">
      <button type="button" class="del" data-delset="1" aria-label="Remove exercise">×</button></div>`;
  }
  function gymPrompt(q) {
    modal(`<form class="logq" id="gymForm" data-q="${q.id}">
      <h3>Gym session</h3>
      <label for="gymSay">Tell me what you did</label>
      <textarea id="gymSay" rows="3" placeholder="Tap the 🎤 on your keyboard and say it, e.g. “Bench press 3 sets of 10 at 60 kilos, then lat pulldown 3 by 12 at 45”"></textarea>
      <div class="row"><button type="button" class="btn" data-parsegym="1">Fill in from what I said</button><span class="muted small" id="gymStatus"></span></div>
      <div class="gymhead"><span>Exercise</span><span>Sets</span><span>Reps</span><span>kg</span><span></span></div>
      <div id="gymRows">${gymRow(null)}</div>
      <datalist id="exList">${exerciseNames().map(n => `<option value="${esc(n)}">`).join("")}</datalist>
      <button type="button" class="btn ghost" data-addset="1">+ Add exercise</button>
      <div class="row"><button class="btn" type="submit">Clear quest</button><button class="btn ghost" type="button" data-act="close">Cancel</button></div>
    </form>`);
  }

  // Turn a spoken or typed workout description into rows. Claude reads it on claude.ai;
  // elsewhere a simple pattern reader handles "bench press 3 sets of 10 at 60 kg".
  function parseWorkoutLocally(text) {
    return text.split(/[.;\n]|,? then |, and |,(?=\s*[a-z])/i).map(part => {
      const m = /^\s*(?:and\s+)?(.+?)\s+(\d+)\s*(?:sets?\s*(?:of|x|by)?|x|by)\s*(\d+)(?:\s*reps?)?(?:\s*(?:at|with|@)?\s*(\d+(?:\.\d+)?)\s*(?:kg|kilos?|kilograms?)?)?/i.exec(part);
      return m && { ex: m[1].replace(/^(i did|did)\s+/i, "").replace(/\b\w/g, c => c.toUpperCase()), sets: +m[2], reps: +m[3], kg: m[4] ? +m[4] : 0 };
    }).filter(Boolean);
  }
  async function parseWorkout() {
    const text = $("gymSay").value.trim(); if (!text) return toast("Say or type your workout first.");
    $("gymStatus").textContent = "Reading your workout…";
    let rows = null;
    try {
      const sample = window.claude?.use ? await window.claude.use("sample") : null;
      if (sample) rows = await sample.json(
        `A person described their gym workout (likely dictated, so expect speech-to-text mistakes). Extract every exercise as JSON only: {"exercises":[{"ex": string (proper exercise name, Title Case), "sets": number, "reps": number, "kg": number (0 if bodyweight; convert pounds to kg)}]}. If sets or reps vary, use the most common. Description: """${text}"""`,
        { modelTier: "quick" }).then(r => r.exercises);
    } catch (e) { rows = null; }
    if (!rows?.length) rows = parseWorkoutLocally(text);
    if (!rows.length) { $("gymStatus").textContent = "Couldn't pick out the exercises. Try “exercise, sets of reps, at weight”, or fill the rows in."; return; }
    $("gymRows").innerHTML = rows.map(w => gymRow(null, w)).join("");
    $("gymStatus").textContent = `Found ${rows.length} exercise${rows.length > 1 ? "s" : ""}. Check them, then clear the quest.`;
  }

  let mealSample = null;
  async function mealPrompt(q) {
    const calo = S.quests.find(x => x.kind === "calo" && !x.done && activeToday(x));
    modal(`<form class="logq" id="mealForm" data-q="${q ? q.id : ""}">
      <h3>Log a meal</h3>
      <div id="photoRow" hidden><label class="btn ghost photo-btn">📷 Read Calo sticker<input type="file" id="m-photo" accept="image/*" capture="environment" hidden></label><span class="muted small" id="photoStatus"></span></div>
      <div class="slots-pick" role="radiogroup" aria-label="Which meal">${[...CALO_SLOTS, "Other"].map(sl => { const done = caloLogged().includes(sl), next = CALO_SLOTS.find(x => !caloLogged().includes(x)) || "Other";
        return `<label class="slot-opt ${done ? "done" : ""}"><input type="radio" name="m-slot" value="${sl}" ${sl === next ? "checked" : ""}><span>${sl}${done ? " ✓" : ""}</span></label>`; }).join("")}</div>
      <label class="field"><span>Meal</span><input id="m-name" placeholder="e.g. Calo chicken shawarma bowl"></label>
      <div class="macro">
        <label class="field"><span>Calories</span><input id="m-kcal" type="number" min="0" inputmode="numeric"><em>kcal</em></label>
        <label class="field"><span>Protein</span><input id="m-protein" type="number" min="0" step="0.1" inputmode="decimal"><em>g</em></label>
        <label class="field"><span>Carbs</span><input id="m-carbs" type="number" min="0" step="0.1" inputmode="decimal"><em>g</em></label>
        <label class="field"><span>Fat</span><input id="m-fat" type="number" min="0" step="0.1" inputmode="decimal"><em>g</em></label>
      </div>
      <p class="muted small" id="mealPreview">Fill in the numbers to see the nutrition grade.</p>
      <div class="row"><button class="btn" type="submit">Log meal</button><button class="btn ghost" type="button" data-act="close">Cancel</button></div>
    </form>`);
    if (!q && calo) $("mealForm").dataset.q = calo.id;
    try { mealSample = mealSample || (window.claude?.use ? await window.claude.use("sample") : null); } catch (e) { mealSample = null; }
    const caps = mealSample ? await mealSample.limits().catch(() => null) : null;
    if (caps?.images && $("photoRow")) {
      $("photoRow").hidden = false;
      $("m-photo").accept = caps.images.mediaTypes.join(",");
      $("m-photo").addEventListener("change", readSticker);
    }
  }
  async function readSticker() {
    const file = $("m-photo")?.files?.[0]; if (!file || !mealSample) return;
    $("photoStatus").textContent = "Reading the sticker…";
    try {
      const r = await mealSample.json(
        'This photo shows a Calo meal label/sticker. Read it and reply with only JSON: {"name": string, "kcal": number, "protein": number, "carbs": number, "fat": number}. Use grams for macros. If a value is not visible, use 0.',
        { images: [file], modelTier: "quick" });
      for (const k of ["name", "kcal", "protein", "carbs", "fat"]) if (r[k] != null && $("m-" + k)) $("m-" + k).value = r[k];
      $("m-kcal").dispatchEvent(new Event("input", { bubbles: true }));
      $("photoStatus").textContent = "Filled in from the photo. Check the numbers, then log it.";
    } catch (e) {
      $("photoStatus").textContent = e?.code === "not_granted" ? "Photo reading isn't allowed here. Type the numbers instead." : "Couldn't read that photo. Type the numbers instead.";
    }
  }

  function factPrompt(q) {
    modal(`<div class="logq fact-card">
      <span class="fact-kind">${q.facts === "animal" ? "🐾 Animal fact" : "🔮 Obscure fact"}</span>
      <p class="fact-text">${esc(factFor(q))}</p>
      <div class="row"><button class="btn" data-factdone="${q.id}">Done</button><button class="btn ghost" data-act="close">Later</button></div>
    </div>`);
  }

  function playScene(sc) { showLine(sc, 0); }
  function showLine(sc, i) {
    if (i >= sc.lines.length) return modal(null), render();
    const [who, text] = sc.lines[i], isB = who === "Beeyo";
    modal(`<div class="scene-box">
      <div class="scene-title">${esc(sc.title)}</div>
      <div class="actors"><div class="actor ${isB ? "dim" : ""}">${sprite("emzi", HERO_LOOK, "hero")}</div><div class="actor ${isB ? "" : "dim"}">${sprite("beeyo", BEEYO_LOOK)}</div></div>
      <div class="dialog ${isB ? "beeyo" : ""}"><span class="speaker">${esc(who)}</span><p>${esc(text)}</p>
        <button class="btn" data-next="${i + 1}" data-sc="${sc.at}">${i + 1 < sc.lines.length ? "Next" : "Close"}</button></div>
    </div>`);
  }
  function beeyoCard() {
    const next = BEEYO_SCENES.find(sc => !S.beeyo.seen.includes(sc.at));
    const prevAt = [...BEEYO_SCENES].reverse().find(sc => S.beeyo.seen.includes(sc.at))?.at || 0;
    return `<section class="win beeyo-win">
      <h2>Beeyo <small>${Math.round(S.beeyo.mins / 60 * 10) / 10} h together</small></h2>
      <div class="ally"><div class="portrait sm">${sprite("beeyo", BEEYO_LOOK)}</div>
        <div class="qt"><b>Beeyo</b><span class="small">Emzi's beloved. Time together in real life unlocks moments here and gives Emzi Beeyo's blessing in battle that day.</span>
        ${next ? `${bar(S.beeyo.mins - prevAt, next.at - prevAt)}<span class="small muted">Next moment in ${next.at - S.beeyo.mins} min together</span>` : `<span class="small">Every moment unlocked.</span>`}</div></div>
      ${S.beeyo.seen.length ? `<div class="scenes">${BEEYO_SCENES.filter(sc => S.beeyo.seen.includes(sc.at)).map(sc => `<button class="btn ghost" data-scene="${sc.at}">▶ ${esc(sc.title)}</button>`).join("")}</div>` : ""}
    </section>`;
  }

  function showReview(r) {
    modal(`<div class="loot review" style="--rc:${r.reward ? RARITY[r.reward].c : "var(--p)"}"><div class="burst"></div>
      <h3>Weekly review</h3>
      <p class="muted">Week of ${r.monday}</p>
      <div class="big-pct">${Math.round(r.pct * 100)}%<span>of goals met</span></div>
      <ul>${Object.entries(r.cats).map(([c, n]) => `<li>${CATS[c].name}: ${n}/${S.goals[c]}</li>`).join("")}
        <li>${r.quests} quests · ${r.activeDays}/7 active days</li>
        ${r.avgSleep != null ? `<li>Average sleep ${r.avgSleep} h</li>` : ""}${r.weightChange != null ? `<li>Weight ${r.weightChange > 0 ? "+" : ""}${r.weightChange} kg</li>` : ""}
        <li style="color:var(--rc)">${r.reward ? `Reward: ${RARITY[r.reward].name} loot box + ${Math.round(150 * r.pct)} gold` : "Reach 50% next week for a loot box"}</li></ul>
      <button class="btn" data-act="close">Onward</button></div>`);
  }
  function applyTheme() {
    const t = THEMES[areaOf(Math.min(S.tower.floor, 100))], r = document.documentElement.style;
    r.setProperty("--p", t.p); r.setProperty("--s", t.s); r.setProperty("--on-p", t.on); r.setProperty("--bg", t.bg);
    document.querySelector('meta[name="theme-color"]').content = t.bg;
  }
  // Celebrate any quest that became done since the last render: pop the check, burst sparks, float the EXP.
  let doneBefore = new Set(S.quests.filter(q => q.done).map(q => q.id)), lastTab = null;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function celebrate(q) {
    const btn = document.querySelector(`[data-quest="${q.id}"]`); if (!btn) return;
    const card = btn.closest(".q"); card.classList.add("just-done"); btn.classList.add("pop");
    if (calm) return;
    const r = btn.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const colors = [CATS[q.cat].c, "var(--s)", "var(--gold)", "#fff"];
    for (let i = 0; i < 14; i++) {
      const p = document.createElement("i"); p.className = "spark";
      const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 40;
      p.style.cssText = `left:${cx}px;top:${cy}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;background:${colors[i % 4]}`;
      document.body.appendChild(p); setTimeout(() => p.remove(), 700);
    }
    const f = document.createElement("span"); f.className = "xp-float";
    f.textContent = `+${questReward(q, q.lastAmt).xp} EXP`;
    f.style.cssText = `left:${cx}px;top:${cy}px`;
    document.body.appendChild(f); setTimeout(() => f.remove(), 1100);
  }
  // Update the page in place instead of rebuilding it, so bars slide, images don't flicker
  // and moved cards (data-key) glide to their new spot.
  function patchNode(x, y) {
    if (x.nodeType !== y.nodeType || x.nodeName !== y.nodeName) { x.replaceWith(y); return; }
    if (x.nodeType !== 1) { if (x.nodeValue !== y.nodeValue) x.nodeValue = y.nodeValue; return; }
    for (const at of [...x.attributes]) if (!y.hasAttribute(at.name) && !(at.name === "open" && x.tagName === "DETAILS")) x.removeAttribute(at.name);
    for (const at of y.attributes) if (x.getAttribute(at.name) !== at.value) x.setAttribute(at.name, at.value);
    if (x === document.activeElement && /INPUT|TEXTAREA|SELECT/.test(x.tagName)) return;
    if (x.tagName === "INPUT") { if (x.type === "checkbox" || x.type === "radio") x.checked = y.hasAttribute("checked"); else x.value = y.getAttribute("value") ?? ""; }
    patchChildren(x, y);
  }
  function patchChildren(a, b) {
    const old = [...a.childNodes], keyed = new Map(old.filter(n => n.dataset?.key).map(n => [n.dataset.key, n]));
    const next = [...b.childNodes];
    next.forEach((n, i) => {
      let cur = n.dataset?.key && keyed.get(n.dataset.key);
      if (cur) keyed.delete(n.dataset.key); else cur = a.childNodes[i] && !a.childNodes[i].dataset?.key ? a.childNodes[i] : null;
      if (!cur) { a.insertBefore(n, a.childNodes[i] || null); return; }
      if (a.childNodes[i] !== cur) a.insertBefore(cur, a.childNodes[i] || null);
      patchNode(cur, n);
    });
    while (a.childNodes.length > next.length) a.lastChild.remove();
  }
  function morph(el, html) {
    const before = new Map([...el.querySelectorAll("[data-key]")].map(n => [n.dataset.key, n.getBoundingClientRect().top]));
    const t = document.createElement("div"); t.innerHTML = html; patchChildren(el, t);
    if (calm) return;
    el.querySelectorAll("[data-key]").forEach(n => {
      const top = before.get(n.dataset.key); if (top == null) return;
      const dy = top - n.getBoundingClientRect().top; if (Math.abs(dy) < 2) return;
      n.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.25,1.1,.4,1)" });
    });
  }
  function moveTabPill() {
    const on = document.querySelector(`#tabs [data-tab="${tab}"]`), pill = $("tabPill"); if (!on || !pill) return;
    pill.style.width = on.offsetWidth + "px"; pill.style.transform = `translateX(${on.offsetLeft}px)`;
  }
  function render() {
    applyTheme();
    hud();
    const v = $("view");
    if (tab !== lastTab) { v.innerHTML = VIEWS[tab](); v.classList.remove("enter"); void v.offsetWidth; v.classList.add("enter"); lastTab = tab; window.scrollTo({ top: 0 }); }
    else morph(v, VIEWS[tab]());
    moveTabPill();
    const evo = checkEvolution(); if (evo) setTimeout(() => showEvolution(evo), 400);
    const now = S.quests.filter(q => q.done);
    if (tab === "quests") now.filter(q => !doneBefore.has(q.id)).forEach(celebrate);
    doneBefore = new Set(now.map(q => q.id));
  }

  function showLoot(res) {
    modal(`<div class="loot" style="--rc:${RARITY[res.rarity].c}"><div class="burst"></div><h3>${RARITY[res.rarity].name} loot box</h3>
      <ul>${res.out.map((o, i) => `<li style="color:${o.c};animation-delay:${i * 120}ms">${esc(o.t)}</li>`).join("")}</ul>
      <button class="btn" data-act="close">Collect</button></div>`);
  }

  // ---------- Events ----------
  document.addEventListener("click", ev => {
    const b = ev.target.closest("button"); if (!b || b.disabled) return;
    const d = b.dataset;
    if (d.tab) { tab = d.tab; try { localStorage.setItem("konqord-tab", tab); } catch (e) {} render(); window.scrollTo(0, 0); return; }
    if (d.filter) { filter = d.filter; }
    else if (d.quest) {
      const q = S.quests.find(x => x.id === d.quest);
      if (!q.done && q.kind === "gym") return gymPrompt(q);
      if (!q.done && q.kind === "calo") return mealPrompt(q);
      if (!q.done && q.kind === "fact") return factPrompt(q);
      if (!q.done && q.unit) return logPrompt(q);
      if (q.done && q.kind === "beeyo") S.beeyo.mins = Math.max(0, S.beeyo.mins - (q.lastAmt || 0));
      if (q.done && q.kind === "gym" && S.workouts[S.day]) delete S.workouts[S.day];
      toggleQuest(d.quest);
    }
    else if (d.addset) { const rows = $("gymRows"); rows.insertAdjacentHTML("beforeend", gymRow(rows.lastElementChild)); return; }
    else if (d.delset) { const rows = $("gymRows"); if (rows.children.length > 1) b.closest(".gymrow").remove(); return; }
    else if (d.scene) return playScene(BEEYO_SCENES.find(sc => sc.at === +d.scene));
    else if (d.next != null) { const sc = BEEYO_SCENES.find(x => x.at === +d.sc); return showLine(sc, +d.next); }
    else if (d.readphoto != null) return readSticker();
    else if (d.parsegym) return parseWorkout();
    else if (d.factdone) { modal(null); toggleQuest(d.factdone); }
    else if (d.delmeal != null) removeMeal(+d.delmeal);
    else if (d.act === "addmeal") return mealPrompt(null);
    else if (d.delquest) { S.quests = S.quests.filter(q => q.id !== d.delquest); save(); }
    else if (d.stat && S.points > 0) { S.stats[d.stat]++; S.points--; save(); }
    else if (d.equip) { const it = itemById(d.equip); S.equip[it.slot] = S.equip[it.slot] === it.id ? null : it.id; save(); }
    else if (d.learn) learn(d.learn);
    else if (d.startshow) startShow(d.startshow);
    else if (d.skipshow) skipPick(d.skipshow);
    else if (d.seenshow) seenPick(d.seenshow);
    else if (d.ep) addEpisodes(d.ep, 1);
    else if (d.show) setShow(d.show, d.st);
    else if (d.love) toggleLove(d.love);
    else if (d.upgrade) { if (upgradeGear(d.upgrade)) toast("Upgraded!"); }
    else if (d.sell) { const it = itemById(d.sell); S.gold += Math.round(gearScore(it)); S.gear = S.gear.filter(g => g.id !== it.id); save(); }
    else if (d.bond) raiseBond(d.bond, false);
    else if (d.gift) raiseBond(d.gift, true);
    else if (d.party) toggleParty(d.party);
    else if (d.open) { const res = openBox(+d.open); if (res) { render(); return showLoot(res); } }
    else if (d.buy) { const r = S.shop.find(x => x.id === d.buy); if (r && S.gold >= r.cost) { S.gold -= r.cost; log(`Bought reward: ${r.name} (−${r.cost}g). Enjoy it.`); toast(`Reward unlocked: ${r.name}`); save(); } }
    else if (d.delreward) { S.shop = S.shop.filter(r => r.id !== d.delreward); save(); }
    else if (d.supply) {
      const cost = { potion: 25, ether: 40, freeze: 120 }[d.supply];
      if (S.gold >= cost) { S.gold -= cost; if (d.supply === "potion") S.potions++; if (d.supply === "ether") S.ethers++; if (d.supply === "freeze") S.freezes++; save(); toast("Purchased."); }
    }
    else if (d.skill) return playerAct("skill", d.skill);
    else if (d.act) {
      const a = d.act;
      if (a === "fight" || a === "next-battle") { if (!startBattle()) toast(S.energy < BATTLE_COST ? "Not enough energy. Clear real quests first." : "Clear today's dailies to face the boss."); render(); return renderBattle(); }
      if (["defend", "potion", "ether", "flee"].includes(a)) return playerAct(a);
      if (a === "close-battle") { B = null; modal(null); }
      if (a === "close") modal(null);
      if (a === "feed") { const tr = feedPet(); if (tr) { toast(`${PET_STAGES[petStageIdx()].name} loved the ${tr}!`); render(); petHearts(); document.querySelector(".pet-pic")?.classList.add("hop"); return; } }
      if (a === "pat") { const pic = document.querySelector(".pet-pic"); pic?.classList.remove("hop"); void pic?.offsetWidth; pic?.classList.add("hop"); if (patPet()) { render(); } petHearts(); return; }
      if (a === "reset-tree") { if (resetTree()) toast("Skill points refunded."); }
      if (a === "rest") { if (takeRestDay()) toast("Rest day taken. Recover well."); }
      if (a === "export") {
        const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
        $("saveArea").innerHTML = `<textarea id="saveCode" readonly rows="4">${code}</textarea>`;
        navigator.clipboard?.writeText(code).then(() => toast("Backup code copied."), () => { $("saveCode").select(); toast("Select and copy the code above."); });
        return;
      }
      if (a === "import") { $("saveArea").innerHTML = `<textarea id="importCode" rows="4" placeholder="Paste your backup code"></textarea><button class="btn" data-act="do-import">Restore</button>`; return; }
      if (a === "do-import") {
        try { const n = JSON.parse(decodeURIComponent(escape(atob($("importCode").value.trim())))); if (n.v !== 1) throw 0; S = n; save(); toast("Progress restored."); }
        catch (e) { toast("That code didn't work. Check that you copied all of it."); return; }
      }
      if (a === "reset") { $("saveArea").innerHTML = `<p>Erase all progress on this device?</p><div class="row"><button class="btn danger" data-act="do-reset">Erase</button><button class="btn ghost" data-act="cancel">Cancel</button></div>`; return; }
      if (a === "do-reset") { S = newGame(); save(); toast("Progress erased."); }
      if (a === "cancel") { $("saveArea").innerHTML = ""; return; }
    }
    render();
  });

  document.addEventListener("submit", ev => {
    ev.preventDefault();
    if (ev.target.id === "addQuest") {
      const unit = $("qUnit").value, target = unit ? Math.max(1, parseFloat($("qTarget").value) || 10) : 0;
      S.quests.push({ id: uid(), name: $("qName").value.trim(), cat: $("qCat").value, diff: $("qDiff").value, daily: $("qDaily").checked, done: false, unit, target, base: target, scaledAt: 0 });
    }
    if (ev.target.id === "logForm") {
      const amt = parseFloat($("logAmt").value) || 0, show = $("logShow")?.value;
      const q = S.quests.find(x => x.id === ev.target.dataset.q);
      modal(null); toggleQuest(q.id, amt);
      if (show) addEpisodes(show, Math.round(amt));
      if (q.kind === "beeyo") { const sc = addBeeyoTime(amt); render(); if (sc) return setTimeout(() => playScene(sc), 500); return; }
    }
    if (ev.target.id === "gymForm") {
      const sets = [...document.querySelectorAll(".gymrow")].map(r => ({
        ex: r.querySelector("[name=ex]").value.trim(), sets: +r.querySelector("[name=sets]").value || 0,
        reps: +r.querySelector("[name=reps]").value || 0, kg: +r.querySelector("[name=kg]").value || 0,
      })).filter(w => w.ex && w.sets && w.reps);
      if (!sets.length) { toast("Add at least one exercise with sets and reps."); return; }
      modal(null); logWorkout(sets); toggleQuest(ev.target.dataset.q);
    }
    if (ev.target.id === "mealForm") {
      const f = k => $("m-" + k).value;
      const slot = document.querySelector("[name=m-slot]:checked")?.value || "Other";
      addMeal({ slot, name: f("name").trim() || (slot === "Other" ? "Meal" : `Calo ${slot.toLowerCase()}`), kcal: +f("kcal") || 0, protein: +f("protein") || 0, carbs: +f("carbs") || 0, fat: +f("fat") || 0 });
      modal(null);
      // The Calo quest clears once breakfast, snack and lunch are all logged.
      const q = S.quests.find(x => x.kind === "calo" && !x.done && activeToday(x));
      if (q && caloLogged().length === CALO_SLOTS.length) toggleQuest(q.id);
    }
    if (ev.target.id === "addReward") S.shop.push({ id: uid(), name: $("rName").value.trim(), cost: Math.max(1, parseInt($("rCost").value, 10) || 1) });
    save(); render();
  });

  // Body log and goal inputs save as you type; re-render only the charts' section on change.
  // Live nutrition grade while filling in a meal.
  document.addEventListener("input", ev => {
    if (!ev.target.id?.startsWith("m-") || !$("mealPreview")) return;
    const f = k => $("m-" + k).value, sc = mealScore({ kcal: f("kcal"), protein: f("protein"), carbs: f("carbs"), fat: f("fat") });
    $("mealPreview").innerHTML = +f("kcal") ? `Nutrition grade <b class="grade g-${mealGrade(sc)}">${mealGrade(sc)}</b> · ${sc}/100 · +${Math.round(5 + sc * 0.5)} EXP` : "Fill in the numbers to see the nutrition grade.";
  });

  document.addEventListener("change", ev => {
    const t = ev.target;
    if (t.dataset.body) { setBody(S.day, t.dataset.body, t.value === "" ? "" : parseFloat(t.value)); render(); }
    if (t.dataset.goal) { S.goals[t.dataset.goal] = Math.max(0, parseInt(t.value, 10) || 0); save(); render(); }
  });

  return { render, renderBattle, toast, showReview };
})();

rollover();
UI.render();
{ const r = pendingReview(); if (r) { UI.render(); UI.showReview(r); } }
SPR.probe(() => UI.render());
setInterval(() => { if (S.day !== localDay()) { rollover(); UI.render(); } }, 60000);
