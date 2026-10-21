// Placeholder pixel sprites, drawn in code from each character's description.
// To use real art, drop a PNG at sprites/<id>.png (e.g. sprites/emzi.png, sprites/phila.png,
// sprites/boss-25.png) and add its id to sprites/index.json; it replaces the generated sprite.

const SPR = (() => {
  const cache = {}, overrides = {};
  const OUTLINE = "#0a0d16";

  function hash(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
  function rng(seed) { return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const ch = s => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
    return "#" + [16, 8, 0].map(s => ch(s).toString(16).padStart(2, "0")).join("");
  }

  function canvas(w, h) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d");
    const px = (x, y, col) => { if (col && x >= 0 && y >= 0 && x < w && y < h) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } };
    const rect = (x, y, rw, rh, col) => { for (let i = 0; i < rw; i++) for (let j = 0; j < rh; j++) px(x + i, y + j, col); };
    return { c, g, px, rect, w, h };
  }

  function outline(k) {
    const d = k.g.getImageData(0, 0, k.w, k.h).data;
    const on = (x, y) => x >= 0 && y >= 0 && x < k.w && y < k.h && d[(y * k.w + x) * 4 + 3] > 0;
    const spots = [];
    for (let y = 0; y < k.h; y++) for (let x = 0; x < k.w; x++)
      if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) spots.push([x, y]);
    spots.forEach(([x, y]) => k.px(x, y, OUTLINE));
  }

  function humanoid(L) {
    const k = canvas(22, 30), { px, rect } = k;
    const skinS = shade(L.skin, .82), outS = shade(L.outfit, .72), hairS = shade(L.hair, .75);
    if (L.hood) { rect(5, 3, 12, 10, L.hood); rect(6, 2, 10, 1, L.hood); }
    // head
    rect(7, 5, 8, 8, L.skin); rect(13, 6, 2, 7, skinS);
    px(7, 5, null);
    // hair
    rect(6, 3, 10, 3, L.hair); rect(7, 2, 8, 1, L.hair); rect(6, 6, 1, 3, L.hair); rect(15, 6, 1, 3, L.hair);
    rect(12, 3, 4, 3, hairS);
    if (L.style === "long") { rect(5, 6, 2, 11, L.hair); rect(15, 6, 2, 11, hairS); }
    if (L.style === "bob") { rect(5, 6, 2, 6, L.hair); rect(15, 6, 2, 6, hairS); if (L.tips) { rect(5, 11, 2, 1, L.tips); rect(15, 11, 2, 1, L.tips); rect(6, 5, 3, 1, L.tips); } }
    if (L.style === "messy") { [7, 9, 12, 14].forEach(x => px(x, 1, L.hair)); px(16, 4, L.hair); }
    if (L.style === "ears") { rect(6, 0, 2, 3, L.hair); rect(14, 0, 2, 3, L.hair); px(7, 1, L.accent); px(14, 1, L.accent); }
    if (L.style === "horns") { [[6, 2], [5, 1], [5, 0], [15, 2], [16, 1], [16, 0]].forEach(([x, y]) => px(x, y, L.accent)); }
    // face
    px(9, 8, L.eyes); px(12, 8, L.eyes); px(9, 7, "#ffffff"); px(12, 7, "#ffffff");
    px(10, 11, skinS); px(11, 11, skinS);
    // body
    rect(10, 13, 2, 1, skinS);
    rect(7, 14, 8, 7, L.outfit); rect(12, 14, 3, 7, outS);
    rect(9, 14, 4, 1, L.accent); rect(10, 15, 2, 3, L.accent);
    rect(7, 20, 8, 1, L.accent);
    rect(5, 14, 2, 6, L.outfit); rect(15, 14, 2, 6, outS);
    rect(5, 20, 2, 1, L.skin); rect(15, 20, 2, 1, skinS);
    // legs
    rect(8, 21, 2, 6, L.legs); rect(12, 21, 2, 6, shade(L.legs, .75));
    rect(7, 27, 3, 1, "#2a2030"); rect(12, 27, 3, 1, "#2a2030");
    // weapon
    const steel = "#dbe8f7", steelS = "#8fa3bd";
    if (L.weapon === "sword") { rect(18, 7, 1, 13, steel); rect(19, 8, 1, 12, steelS); rect(17, 20, 4, 1, L.accent); rect(18, 21, 2, 2, "#5a3a2a"); }
    if (L.weapon === "lance") { rect(18, 1, 1, 27, L.accent); rect(17, 0, 3, 3, "#bfe6ff"); px(18, 0, "#ffffff"); rect(17, 12, 3, 1, L.accent); }
    if (L.weapon === "staff") { rect(18, 4, 1, 24, "#6b4a2a"); rect(17, 1, 3, 3, L.accent); px(18, 2, "#ffffff"); }
    if (L.weapon === "dagger") { rect(17, 16, 1, 4, steel); rect(16, 20, 3, 1, L.accent); }
    if (L.weapon === "claws") { [[4, 21], [6, 21], [15, 21], [17, 21]].forEach(([x, y]) => px(x, y, steel)); }
    outline(k);
    return k.c.toDataURL();
  }

  function monster(L, seedKey, big) {
    const S = big ? 34 : 28, k = canvas(S, S), { px, rect } = k, r = rng(hash(seedKey));
    const B = L.body, BS = shade(B, .7), A = L.accent, E = L.eye || "#ff5d6c";
    const m = S / 2 | 0;
    if (L.kind === "beast") {
      rect(4, 10, S - 8, S - 16, B); rect(4, S - 10, S - 8, 4, BS);
      rect(S - 12, 5, 9, 9, B); px(S - 6, 8, E); px(S - 9, 8, E);
      [6, 10, S - 12, S - 8].forEach(x => rect(x, S - 6, 3, 5, BS));
      for (let i = 0; i < 5; i++) px(6 + (r() * (S - 14) | 0), 9, A);
      rect(S - 10, 12, 6, 1, "#ffffff");
    } else if (L.kind === "knight") {
      rect(m - 4, 3, 9, 8, B); rect(m - 3, 6, 7, 2, OUTLINE); px(m - 2, 6, E); px(m + 2, 6, E);
      rect(m - 1, 1, 3, 2, A);
      rect(m - 7, 11, 15, 11, B); rect(m + 1, 11, 7, 11, BS); rect(m - 7, 11, 15, 2, A);
      rect(m - 10, 12, 3, 9, BS); rect(m + 8, 12, 3, 9, BS);
      rect(m - 5, 22, 4, S - 24, BS); rect(m + 2, 22, 4, S - 24, BS);
      rect(m + 11, 2, 2, 22, "#dbe8f7"); rect(m + 9, 22, 6, 2, A);
    } else if (L.kind === "wraith") {
      rect(m - 6, 4, 13, 10, B); rect(m - 4, 7, 9, 4, OUTLINE); px(m - 2, 9, E); px(m + 2, 9, E);
      for (let y = 14; y < S - 3; y++) { const w = 14 - (y - 14) / 3; rect(m - (w / 2 | 0), y, w | 0, 1, y % 3 ? B : BS); }
      for (let t = 0; t < 4; t++) { let x = m - 8 + t * 5; for (let y = S - 8; y < S - 1; y++) { x += r() < .5 ? -1 : 1; px(x, y, A); } }
      rect(m - 6, 4, 13, 1, A);
    } else if (L.kind === "devourer") {
      for (let i = 0; i < 3; i++) { const x = m - 13 + i * 9; rect(x, 6, 8, 7, B); rect(x + 1, 13, 6, 2, BS); px(x + 2, 9, E); px(x + 5, 9, E); }
      for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2; px(m + Math.round(Math.cos(t) * 14), 4 + Math.round(Math.sin(t) * 3), A); }
      rect(m - 6, 15, 13, 12, B); for (let y = 16; y < 26; y += 2) rect(m - 5, y, 11, 1, BS);
      rect(m - 9, 16, 3, 10, BS); rect(m + 7, 16, 3, 10, BS);
      rect(m - 4, 27, 3, S - 28, BS); rect(m + 2, 27, 3, S - 28, BS);
    } else { // slime / labit
      for (let y = 8; y < S - 3; y++) { const w = Math.min(S - 6, (y - 6) * 2); rect(m - (w / 2 | 0), y, w, 1, y > S - 8 ? BS : B); }
      px(m - 3, 14, E); px(m + 3, 14, E); rect(m - 2, 18, 5, 1, OUTLINE);
      rect(m - 4, 3, 2, 6, B); rect(m + 3, 3, 2, 6, B);
      for (let i = 0; i < 4; i++) px(m - 6 + (r() * 12 | 0), 11 + (r() * 6 | 0), A);
    }
    outline(k);
    return k.c.toDataURL();
  }

  function src(id, look, kind, big) {
    if (overrides[id]) return overrides[id];
    const key = id + (kind || "");
    return cache[key] || (cache[key] = kind === "monster" ? monster(look, id, big) : humanoid(look));
  }

  // Load hand-made art listed in sprites/index.json; generated sprites stay as fallback.
  async function probe(done) {
    let ids = [];
    try { ids = await (await fetch("sprites/index.json")).json(); } catch (e) {}
    let left = ids.length;
    if (!left) return;
    ids.forEach(entry => {
      // Entries are "<id>" for a PNG, or a file name like "emzi.gif" for other formats.
      const id = entry.replace(/\.\w+$/, ""), file = /\.\w+$/.test(entry) ? entry : entry + ".png";
      const im = new Image();
      im.onload = () => { overrides[id] = im.src; if (!--left) done(); };
      im.onerror = () => { if (!--left) done(); };
      im.src = `sprites/${file}`;
    });
  }

  function minionLook(name, areaIdx) {
    const a = AREAS[areaIdx], h = hash(name), kinds = ["beast", "wraith", "slime", "knight"];
    const tints = ["#5a6b8a", "#6b4a5a", "#4a6b5a", "#7a6a4a", "#5a4a7a"];
    return { kind: kinds[h % kinds.length], body: tints[(h >> 3) % tints.length], accent: a.accent, eye: "#ff5d6c" };
  }

  return { src, probe, minionLook, hash, rng };
})();
