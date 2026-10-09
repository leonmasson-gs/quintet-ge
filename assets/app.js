"use strict";
/* ---------- config (in the real game this lives in config/reel.json) ---------- */
const SPINS_PER_DAY = 3;
const SYM = [
  { id: "pitch", name: "Pitch", plural: "Pitches", rarity: "common", w: 24, p: 1 },
  { id: "ball", name: "Ball", plural: "Balls", rarity: "common", w: 20, p: 1 },
  { id: "tunnel", name: "Tunnel", plural: "Tunnels", rarity: "common", w: 16, p: 2 },
  { id: "floodlight", name: "Floodlight", plural: "Floodlights", rarity: "rare", w: 14, p: 3 },
  { id: "truss", name: "Truss", plural: "Trusses", rarity: "rare", w: 12, p: 4 },
  { id: "ticket", name: "Ticket", plural: "Tickets", rarity: "epic", w: 8, p: 8 },
  { id: "trophy", name: "Trophy", plural: "Trophies", rarity: "epic", w: 5, p: 15 },
  { id: "golden", name: "Golden Reel", plural: "Golden Reels", rarity: "legendary", w: 1, p: 40 }
];
const MULT = { none: 1, pair: 1, twopair: 2, three: 3, fullhouse: 5, four: 10, five: 25 };
const PAT_NAME = { none: "No match", pair: "One pair", twopair: "Two pair", three: "Three of a kind", fullhouse: "Full house", four: "Four of a kind", five: "Five of a kind" };
const TIERS = [{ name: "Bronze", min: 0 }, { name: "Silver", min: 200 }, { name: "Gold", min: 400 }, { name: "Platinum", min: 650 }];
const RAIL_MAX = 800, VAULT_TARGET = 5000;
const TOTAL_W = SYM.reduce((n, s) => n + s.w, 0);
const byId = Object.fromEntries(SYM.map(s => [s.id, s]));
const svg = inner => `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">${inner}</svg>`;
const ART = {
  pitch: svg(`<rect x="8" y="13" width="48" height="38" rx="3" fill="none" stroke="url(#g-bone)" stroke-width="4"/><path d="M32 13 V51" stroke="url(#g-bone)" stroke-width="3.2"/><circle cx="32" cy="32" r="8.5" fill="none" stroke="url(#g-bone)" stroke-width="3.2"/><path d="M8 24 H15 V40 H8 M56 24 H49 V40 H56" fill="none" stroke="url(#g-bone)" stroke-width="3.2" stroke-linejoin="round"/>`),
  ball: svg(`<circle cx="32" cy="32" r="25" fill="url(#g-bone)"/><polygon points="32,20 43.4,28.3 39.1,41.7 24.9,41.7 20.6,28.3" fill="#0E2A4D"/><path d="M32 20 V9.5 M43.4 28.3 L53.4 25 M39.1 41.7 L45.3 50.2 M24.9 41.7 L18.7 50.2 M20.6 28.3 L10.6 25" stroke="#0E2A4D" stroke-width="3" stroke-linecap="round"/>`),
  tunnel: svg(`<path d="M8 57 V32 A24 24 0 0 1 56 32 V57 H45 V32 A13 13 0 0 0 19 32 V57 Z" fill="url(#g-bone)"/><path d="M27 57 V37 A5 5 0 0 1 37 37 V57" fill="none" stroke="url(#g-bone)" stroke-width="3.4" stroke-linecap="round"/>`),
  floodlight: svg(`<rect x="29.5" y="30" width="5" height="26" rx="2" fill="url(#g-silver)"/><rect x="21" y="55" width="22" height="4.5" rx="2.2" fill="url(#g-silver)"/><rect x="11" y="6" width="42" height="26" rx="4.5" fill="url(#g-silver)"/><g fill="#0E2A4D"><circle cx="21.5" cy="14" r="4"/><circle cx="32" cy="14" r="4"/><circle cx="42.5" cy="14" r="4"/><circle cx="21.5" cy="24.5" r="4"/><circle cx="32" cy="24.5" r="4"/><circle cx="42.5" cy="24.5" r="4"/></g>`),
  truss: svg(`<path d="M7 53 L32 10 L57 53 Z" fill="none" stroke="url(#g-silver)" stroke-width="4.5" stroke-linejoin="round"/><path d="M19.5 31.5 H44.5 M19.5 31.5 L32 53 L44.5 31.5" fill="none" stroke="url(#g-silver)" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>`),
  ticket: svg(`<path d="M7 15 H57 V27 A5 5 0 0 0 57 37 V49 H7 V37 A5 5 0 0 0 7 27 Z" fill="url(#g-amber)"/><path d="M41 19 V45" stroke="#0E2A4D" stroke-width="2.6" stroke-dasharray="3.4 3.4"/><polygon points="24,22.5 26.8,28.6 33.4,29.3 28.4,33.7 29.9,40.2 24,36.8 18.1,40.2 19.6,33.7 14.6,29.3 21.2,28.6" fill="#0E2A4D"/>`),
  trophy: svg(`<path d="M17 8 H47 V26 C47 35.5 40.5 41 32 41 C23.5 41 17 35.5 17 26 Z" fill="url(#g-amber)"/><path d="M17 13 H9.5 V20 C9.5 26 13.5 28.5 18.5 28.5 M47 13 H54.5 V20 C54.5 26 50.5 28.5 45.5 28.5" fill="none" stroke="url(#g-amber)" stroke-width="3.6" stroke-linejoin="round"/><rect x="28.5" y="40" width="7" height="11" fill="url(#g-amber)"/><rect x="19" y="50" width="26" height="7.5" rx="2" fill="url(#g-amber)"/><path d="M23 13 V26 C23 31 26 34 30 35" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="3" stroke-linecap="round"/>`),
  golden: svg(`<circle cx="32" cy="32" r="27" fill="url(#g-gold)"/><circle cx="32" cy="32" r="19.5" fill="#0E2A4D"/><g stroke="url(#g-gold)" stroke-width="3.2" stroke-linecap="round"><path d="M32 15.5v10M32 38.5v10M15.5 32h10M38.5 32h10M20.3 20.3l7 7M36.7 36.7l7 7M43.7 20.3l-7 7M27.3 36.7l-7 7"/></g><circle cx="32" cy="32" r="5.2" fill="url(#g-gold)"/>`)
};

/* ---------- engine ---------- */
function rnd(n) { const a = new Uint32Array(1), lim = Math.floor(0xFFFFFFFF / n) * n; let x; do { crypto.getRandomValues(a); x = a[0]; } while (x >= lim); return x % n; }
function drawId() { let r = rnd(TOTAL_W); for (const s of SYM) { if (r < s.w) return s.id; r -= s.w; } }
function classify(ids) {
  const m = {}; ids.forEach(i => m[i] = (m[i] || 0) + 1);
  const c = Object.entries(m).sort((a, b) => b[1] - a[1]); const k = c.map(x => x[1]);
  let pat = "none";
  if (k[0] === 5) pat = "five"; else if (k[0] === 4) pat = "four"; else if (k[0] === 3 && k[1] === 2) pat = "fullhouse";
  else if (k[0] === 3) pat = "three"; else if (k[0] === 2 && k[1] === 2) pat = "twopair"; else if (k[0] === 2) pat = "pair";
  return { pat, top: c[0][0], topN: k[0], pairs: c.filter(x => x[1] === 2).map(x => x[0]), trip: c.filter(x => x[1] >= 3).map(x => x[0]) };
}
function score(ids, c) { return ids.reduce((n, i) => n + byId[i].p, 0) * MULT[c.pat]; }
function tierFor(pts) { let i = 0; TIERS.forEach((t, k) => { if (pts >= t.min) i = k; }); return { cur: TIERS[i], next: TIERS[i + 1] || null }; }
function exactOdds() {
  const prob = {}; let ev = 0, atLeastThree = 0;
  (function rec(d, combo, p) {
    if (d === 5) { const c = classify(combo); prob[c.pat] = (prob[c.pat] || 0) + p; ev += p * score(combo, c); if (c.topN >= 3) atLeastThree += p; return; }
    for (const s of SYM) rec(d + 1, combo.concat(s.id), p * s.w / TOTAL_W);
  })(0, [], 1);
  return { prob, ev, atLeastThree };
}

/* ---------- state ---------- */
const KEY = "quintet.v1";
const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);
function weekStart(d = new Date()) { const k = (d.getUTCDay() + 6) % 7; return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - k)).toISOString().slice(0, 10); }
function fresh() { return { v: 1, day: utcDay(), week: weekStart(), used: 0, points: 0, found: {}, seenHelp: false, skin: "matchday" }; }
let mem = null;
function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = mem; }
  if (!s || s.v !== 1) s = fresh();
  if (s.day !== utcDay()) { s.day = utcDay(); s.used = 0; }
  if (s.week !== weekStart()) { if (s.points > 0) s.recap = { tier: tierFor(s.points).cur.name, points: s.points }; s.week = weekStart(); s.points = 0; }
  return s;
}
let saveFailed = false;
function save() { mem = st; try { localStorage.setItem(KEY, JSON.stringify(st)); saveFailed = false; } catch (e) { saveFailed = true; } }
let st = load();

/* ---------- dom ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const stage = $("#cab"), reelsEl = $("#reels");
const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
let busy = false;

const START = ["pitch", "ball", "tunnel", "floodlight", "truss"];
const reels = START.map((id, i) => {
  const r = document.createElement("div"); r.className = "reel";
  r.innerHTML = `<div class="win" role="img"><div class="strip"></div></div>`;
  r.style.setProperty("--i", i); reelsEl.appendChild(r); setReel(r, id, i); return r;
});
function setReel(r, id, i) {
  const idx = i ?? reels.indexOf(r);
  const strip = $(".strip", r); strip.style.cssText = ""; strip.innerHTML = `<div class="cell">${ART[id]}</div>`;
  r.dataset.r = byId[id].rarity; $(".win", r).setAttribute("aria-label", `Reel ${idx + 1}: ${byId[id].name}`);
}
function spinReel(r, id, dur) {
  return new Promise(res => {
    if (!dur) { setReel(r, id); return res(); }
    const win = $(".win", r), strip = $(".strip", r), H = win.clientHeight, N = 16;
    const cells = []; for (let k = 0; k < N - 1; k++) cells.push(SYM[Math.floor(Math.random() * SYM.length)].id); cells.push(id);
    r.dataset.r = "spinning";
    strip.style.transition = "none"; strip.style.height = N * H + "px"; strip.style.transform = "translateY(0)";
    strip.innerHTML = cells.map(c => `<div class="cell" style="height:${H}px">${ART[c]}</div>`).join("");
    r.classList.add("moving"); void strip.offsetHeight;
    strip.style.transition = `transform ${dur}ms cubic-bezier(.15,.7,.15,1)`; strip.style.transform = `translateY(-${(N - 1) * H}px)`;
    setTimeout(() => { setReel(r, id); r.classList.remove("moving"); r.classList.add("settle"); setTimeout(() => r.classList.remove("settle"), 300); res(); }, dur + 40);
  });
}
function countUp(el, to) {
  el.classList.toggle("big", to >= 1000);
  if (reduce() || to === 0) { el.textContent = "+" + to; return; }
  const t0 = performance.now(), D = 700;
  (function f(t) { const k = Math.min(1, (t - t0) / D); el.textContent = "+" + Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0);
}
function idle() { $("#resNote").textContent = st.used >= SPINS_PER_DAY ? "Come back tomorrow for three more spins." : "Press Spin to play."; }
function clearResult() {
  stage.classList.remove("flash"); reelsEl.classList.remove("has-hit"); reels.forEach(r => r.classList.remove("hit", "soft"));
  $("#resPat").textContent = ""; $("#resPts").textContent = ""; $("#resNote").textContent = "";
}

async function doSpin(forced) {
  if (busy) return; if (!forced && st.used >= SPINS_PER_DAY) return;
  busy = true; renderPlay(); clearResult();
  const ids = forced || Array.from({ length: 5 }, drawId);
  await Promise.all(reels.map((r, i) => spinReel(r, ids[i], reduce() ? 0 : 1000 + i * 380)));
  const c = classify(ids), pts = score(ids, c);
  /* highlight exactly the symbols that make the scoring pattern, never a stray pair beside it */
  if (c.pat === "fullhouse") { reels.forEach(r => r.classList.add("hit")); }
  else if (c.trip.length) ids.forEach((id, i) => { if (c.trip.includes(id)) reels[i].classList.add("hit"); });
  else if (c.pat === "twopair") ids.forEach((id, i) => { if (c.pairs.includes(id)) reels[i].classList.add("soft"); });
  if (c.trip.length) reelsEl.classList.add("has-hit");
  const patTxt = c.topN >= 4 ? `${c.topN === 5 ? "Five" : "Four"} ${byId[c.top].plural}` : c.pat === "three" ? `Three ${byId[c.top].plural}` : PAT_NAME[c.pat];
  $("#resPat").textContent = patTxt; countUp($("#resPts"), pts);
  $("#resNote").textContent = forced ? "Demo spin. Not counted." : (MULT[c.pat] > 1 ? `Symbols × ${MULT[c.pat]}` : "");
  if (c.topN >= 4 && !reduce()) { stage.classList.add("flash"); setTimeout(() => stage.classList.remove("flash"), 1100); }
  if (!forced) { st.used++; st.points += pts; ids.forEach(i => st.found[i] = (st.found[i] || 0) + 1); save(); }
  busy = false; renderAll();
}

/* ---------- renderers ---------- */
function renderPlay() {
  const left = SPINS_PER_DAY - st.used, off = busy || left <= 0;
  $("#leftTxt").textContent = left > 0 ? `${left} spin${left === 1 ? "" : "s"} left today` : "All spins used. New spins at midnight UTC.";
  $("#pips").innerHTML = Array.from({ length: SPINS_PER_DAY }, (_, i) => `<i class="pip ${i < st.used ? "used" : ""}"></i>`).join("");
  const b = $("#spin"); b.setAttribute("aria-disabled", String(off)); b.textContent = busy ? "Spinning" : left > 0 ? "Spin" : "Back tomorrow";
  const { cur, next } = tierFor(st.points);
  const pct = Math.min(100, st.points / RAIL_MAX * 100);
  const ticks = TIERS.map((t, i) => `<span style="left:${t.min / RAIL_MAX * 100}%">${t.name}</span>`).join("");
  const marks = TIERS.slice(1).map(t => `<i style="left:${t.min / RAIL_MAX * 100}%"></i>`).join("");
  $("#tierCard").innerHTML = `<div class="row"><h2>This week: ${cur.name}</h2><span class="num">${st.points} points</span></div>
    <div class="rail" role="progressbar" aria-label="Points this week" aria-valuemin="0" aria-valuemax="${RAIL_MAX}" aria-valuenow="${Math.min(st.points, RAIL_MAX)}"><div class="fill" style="width:${pct}%"></div>${marks}</div>
    <div class="ticks" aria-hidden="true">${ticks}</div>
    <p class="muted">${next ? `${next.min - st.points} more points for ${next.name}. ` : "You have reached the top tier. "}Missing a day never takes points away.${saveFailed ? " Your browser is blocking storage, so this progress will not be saved." : ""}</p>`;
  $("#help").hidden = st.seenHelp;
  const rc = $("#recap"); rc.hidden = !st.recap;
  if (st.recap) $("#recapTxt").textContent = `Last week you reached ${st.recap.tier} with ${st.recap.points} points. A new week starts from zero.`;
}
function badge(s, n) {
  return `<div class="badge ${n ? "" : "locked"}"><div class="reel" data-r="${s.rarity}"><div class="win" role="img" aria-label="${s.name}${n ? "" : ", not found yet"}"><div class="cell">${ART[s.id]}</div></div></div>
  <div class="nm">${s.name}</div><div class="rk">${s.rarity[0].toUpperCase() + s.rarity.slice(1)}</div><div class="rk">${n ? "Found " + n : "Not found yet"}</div></div>`;
}
function renderColl() {
  const have = SYM.filter(s => st.found[s.id]).length;
  $("#collTxt").textContent = `${have} of ${SYM.length} symbols found.`;
  $("#coll").innerHTML = SYM.map(s => badge(s, st.found[s.id] || 0)).join("");
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function renderRoom() {
  const rng = mulberry(hash(weekStart())), adj = ["Amber", "Quiet", "Brisk", "Velvet", "Copper", "Mellow", "Swift", "Hollow", "Tidy", "Rusty", "Bold", "Lucky"], noun = ["Falcon", "Heron", "Otter", "Badger", "Marten", "Kestrel", "Lynx", "Plover", "Stoat", "Whippet", "Wren", "Ferret"];
  const dayFrac = Math.max(1, (new Date().getUTCDay() + 6) % 7 + 1) / 7;
  const others = [], used = new Set();
  while (others.length < 19) { const nm = adj[Math.floor(rng() * adj.length)] + " " + noun[Math.floor(rng() * noun.length)]; if (used.has(nm)) continue; used.add(nm); others.push({ nm, pts: Math.round((60 + rng() * 700) * dayFrac) }); }
  others.push({ nm: "You", pts: st.points, me: true });
  others.sort((a, b) => b.pts - a.pts);
  $("#roomTitle").textContent = `Reel Room ${10 + hash(weekStart()) % 80}`;
  $("#rank").innerHTML = `<tr><th>#</th><th>Player</th><th class="n">Points</th></tr>` + others.map((o, i) => `<tr class="${o.me ? "me" : ""}"><td>${i + 1}</td><td>${o.nm}</td><td class="n">${o.pts}</td></tr>`).join("");
  const base = 2600 + hash(utcDay()) % 1500, total = base + st.used;
  $("#vaultFill").style.width = Math.min(100, total / VAULT_TARGET * 100) + "%";
  $("#vaultBar").setAttribute("aria-valuenow", total);
  $("#vaultTxt").textContent = `${total.toLocaleString("en-GB")} of ${VAULT_TARGET.toLocaleString("en-GB")} spins today. You added ${st.used}.`;
}
let ODDS;
function renderOdds() {
  ODDS = ODDS || exactOdds(); const pc = x => x >= 0.01 ? (x * 100).toFixed(1) + "%" : (x * 100).toFixed(2) + "%";
  $("#symTable").innerHTML = `<tr><th>Symbol</th><th class="n">Chance per reel</th><th class="n">Points</th></tr>` + SYM.map(s => `<tr><td><span class="mini">${ART[s.id]}</span>${s.name}</td><td class="n">${pc(s.w / TOTAL_W)}</td><td class="n">${s.p}</td></tr>`).join("");
  $("#patTable").innerHTML = `<tr><th>Result</th><th class="n">Chance per spin</th><th class="n">Symbols ×</th></tr>` + ["none", "pair", "twopair", "three", "fullhouse", "four", "five"].map(k => `<tr><td>${PAT_NAME[k]}</td><td class="n">${((ODDS.prob[k] || 0) * 100).toFixed(2)}%</td><td class="n">${MULT[k]}</td></tr>`).join("");
  $("#oddsLine").textContent = `Three or more of the same symbol: ${pc(ODDS.atLeastThree)} of spins. Average score: ${ODDS.ev.toFixed(1)} points a spin. Nothing else changes the odds.`;
}
function renderAll() { renderPlay(); renderColl(); renderRoom(); }

/* ---------- wiring ---------- */
$("#spin").addEventListener("click", () => doSpin());
$("#recapX").addEventListener("click", () => { st.recap = null; save(); renderPlay(); });
$("#helpX").addEventListener("click", () => { st.seenHelp = true; save(); renderPlay(); $("#spin").focus(); });
$("#oddsBtn").addEventListener("click", e => { const o = $("#odds"); o.hidden = !o.hidden; e.currentTarget.setAttribute("aria-expanded", String(!o.hidden)); e.currentTarget.textContent = o.hidden ? "Show odds" : "Hide odds"; });
const tabs = $$(".tabs [role=tab]");
const HASH = { play: "", coll: "#collection", room: "#room" };
function tabFromHash() { const k = Object.keys(HASH).find(k => HASH[k] && HASH[k] === location.hash); return $("#t-" + (k || "play")); }
function showTab(t, focus, push) {
  tabs.forEach(x => { const on = x === t; x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1; $("#" + x.getAttribute("aria-controls")).hidden = !on; });
  if (focus) t.focus();
  if (push) { try { const h = HASH[t.id.slice(2)]; if (location.hash !== h) history.pushState(null, "", h || location.pathname + location.search); } catch (e) { /* history unavailable: tabs still work */ } }
}
tabs.forEach((t, i) => {
  t.addEventListener("click", () => showTab(t, false, true));
  t.addEventListener("keydown", e => {
    const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (k) { e.preventDefault(); showTab(tabs[(i + k + tabs.length) % tabs.length], true, true); }
    if (e.key === "Home") { e.preventDefault(); showTab(tabs[0], true, true); }
    if (e.key === "End") { e.preventDefault(); showTab(tabs[tabs.length - 1], true, true); }
  });
});
addEventListener("popstate", () => showTab(tabFromHash(), false, false));
showTab(tabFromHash(), false, false);
function setSkin(k) { st.skin = k; save(); $(".app").dataset.skin = k; $$(".looks button").forEach(b => b.setAttribute("aria-checked", String(b.dataset.skin === k))); }
$$(".looks button").forEach(b => b.addEventListener("click", () => setSkin(b.dataset.skin)));
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const DEMO = {
  three: () => shuffle(["ball", "ball", "ball", "tunnel", "truss"]), fullhouse: () => shuffle(["floodlight", "floodlight", "floodlight", "ticket", "ticket"]),
  four: () => shuffle(["truss", "truss", "truss", "truss", "pitch"]), crowns: () => Array(5).fill("trophy"), golden: () => Array(5).fill("golden")
};
$$("[data-demo]").forEach(b => b.addEventListener("click", () => {
  const k = b.dataset.demo;
  if (k === "unlock") { SYM.forEach(s => st.found[s.id] = st.found[s.id] || 1); save(); renderAll(); }
  else if (k === "reset") { st = fresh(); save(); clearResult(); setSkin(st.skin); renderAll(); idle(); }
  else doSpin(DEMO[k]());
}));
renderOdds(); setSkin(st.skin); renderAll(); idle();
