// ═══════════════════════════════════════════════════════════════════
// 112a_set_venn.js — Mengen und Intervalle, Teil 2: Venn-Diagramme (2 oder 3 Mengen) und Übungen
//
// SetV (ohne DOM): Mengenterme wie (A ∪ B) ∩ C' lesen; Wert = Bitmenge der Felder des Venn-Diagramms
// (Feld m = Bitmaske der Mengen, die einen Punkt enthalten: A = 1, B = 2, C = 4). Elemente und Anzahlen.
// SetEx (ohne DOM): Aufgaben erzeugen und prüfen (Intervall schreiben, Intervall-Operation,
// Venn-Diagramm schraffieren, Elemente bestimmen, Anzahlen im Venn-Diagramm).
// Bild: setVenn() zeichnet Grundmenge, Kreise, Schraffur, Elemente/Anzahlen. Szenen setSceneVenn, setSceneEx.
// Oberfläche und Zustand stehen in 112_set.js (Ansichten 'venn' und 'ex'); diese Datei wird davor geladen.
// ═══════════════════════════════════════════════════════════════════

const SetV = (function () {
  const NAMES = ['A', 'B', 'C'];
  const full = n => (1 << (1 << n)) - 1;                                 // alle Felder
  const setBits = (k, n) => { let v = 0; for (let m = 0; m < (1 << n); m++) if (m & (1 << k)) v |= 1 << m; return v; };
  // Term lesen: Vereinigung ∪ u | + oder · Schnitt ∩ n & * und · Differenz \ - ∖ ohne · Komplement A' ¬A ~A nicht A, Ā
  function parse(src, n) {
    let s = String(src || '').replace(/\s+/g, ' ').replace(/\boder\b/g, '∪').replace(/\bund\b/g, '∩').replace(/\bohne\b/g, '\\').replace(/\bnicht\b/g, '¬')
      .replace(/[uU|+]/g, '∪').replace(/[n&*]/g, '∩').replace(/[∖\-−]/g, '\\').replace(/\\+/g, '\\').replace(/[~!]/g, '¬').replace(/ᶜ/g, "'").replace(/Ā/g, "A'").replace(/\s/g, '');
    let i = 0;
    const err = m => { const e = new Error(m); e.set = true; throw e; };
    function expr() { let a = term(); while (s[i] === '∪' || s[i] === '\\') { const op = s[i++]; const b = term(); a = { k: op === '∪' ? 'or' : 'diff', a, b }; } return a; }
    function term() { let a = fac(); while (s[i] === '∩') { i++; const b = fac(); a = { k: 'and', a, b }; } return a; }
    function fac() {
      if (s[i] === '¬') { i++; return { k: 'not', a: fac() }; }
      let a = atom(); while (s[i] === "'") { i++; a = { k: 'not', a }; } return a;
    }
    function atom() {
      const c = s[i];
      if (c === '(') { i++; const a = expr(); if (s[i] !== ')') err('Klammer fehlt'); i++; return { k: 'par', a }; }
      const up = (c || '').toUpperCase(), j = NAMES.indexOf(up);
      if (j >= 0) { if (j >= n) err('Nur ' + NAMES.slice(0, n).join(', ') + ' möglich'); i++; return { k: 'set', j }; }
      if (up === 'G') { i++; return { k: 'G' }; }
      if (c === '∅' || (c === '{' && s[i + 1] === '}')) { i += c === '∅' ? 1 : 2; return { k: 'E' }; }
      err(c ? 'Unerwartetes Zeichen «' + c + '»' : 'Term unvollständig');
    }
    try { const t = expr(); if (i < s.length) err('Unerwartetes Zeichen «' + s[i] + '»'); return { ok: true, t }; } catch (e) { return { ok: false, err: e.set ? e.message : 'Term nicht lesbar' }; }
  }
  function val(t, n) {
    switch (t.k) {
      case 'set': return setBits(t.j, n); case 'G': return full(n); case 'E': return 0; case 'par': return val(t.a, n);
      case 'not': return full(n) & ~val(t.a, n); case 'and': return val(t.a, n) & val(t.b, n); case 'or': return val(t.a, n) | val(t.b, n);
      default: return val(t.a, n) & ~val(t.b, n);
    }
  }
  function tex(t) {
    switch (t.k) {
      case 'set': return NAMES[t.j]; case 'G': return 'G'; case 'E': return '\\{\\,\\}'; case 'par': return '(' + tex(t.a) + ')';
      case 'not': return '\\overline{' + (t.a.k === 'par' ? tex(t.a.a) : tex(t.a)) + '}';
      case 'and': return tex(t.a) + '\\cap ' + tex(t.b); case 'or': return tex(t.a) + '\\cup ' + tex(t.b); default: return tex(t.a) + '\\setminus ' + tex(t.b);
    }
  }
  // Teilterme in Rechenreihenfolge (für den Rechenweg), ohne einzelne Mengen und Klammern
  function steps(t, out) { out = out || []; if (t.a) steps(t.a, out); if (t.b) steps(t.b, out); if (t.k !== 'set' && t.k !== 'par' && t.k !== 'G' && t.k !== 'E') out.push(t); return out; }
  const usesNot = t => !!t && (t.k === 'not' || usesNot(t.a) || usesNot(t.b));
  // Feld m in Worten / als Term
  function regionName(m, n) {
    const ins = [], outs = []; for (let k = 0; k < n; k++) (m & (1 << k) ? ins : outs).push(NAMES[k]);
    if (!ins.length) return 'in keiner Menge';
    if (ins.length === 1) return 'nur in ' + ins[0];
    return 'in ' + ins.slice(0, -1).join(', ') + ' und ' + ins[ins.length - 1] + (outs.length ? ', nicht in ' + outs.join(', ') : '');
  }
  function regionTex(m, n) { const p = []; for (let k = 0; k < n; k++) p.push(m & (1 << k) ? NAMES[k] : '\\overline{' + NAMES[k] + '}'); return p.join('\\cap '); }
  // Elemente: Liste lesen («1, 2, 3», «{a; b}»), Feld jedes Elements
  const parseEls = s => { const t = String(s || '').replace(/[{}]/g, ' ').trim(); if (!t || t === '∅') return []; const a = t.split(/[,;\s]+/).filter(Boolean).map(x => x.replace(/^\+/, '')); return a.filter((x, i) => a.indexOf(x) === i); };
  const sortEls = a => a.slice().sort((x, y) => { const u = parseFloat(x), v = parseFloat(y); return isFinite(u) && isFinite(v) ? u - v : String(x).localeCompare(String(y)); });
  function universe(sets, G) { const u = G && G.length ? G.slice() : []; sets.forEach(S => S.forEach(x => { if (u.indexOf(x) < 0) u.push(x); })); return sortEls(u); }
  function regionOf(x, sets) { let m = 0; sets.forEach((S, k) => { if (S.indexOf(x) >= 0) m |= 1 << k; }); return m; }
  const elsOf = (bits, sets, U) => U.filter(x => bits & (1 << regionOf(x, sets)));
  const elsTex = a => (a.length ? '\\{' + sortEls(a).join(',\\,') + '\\}' : '\\{\\,\\}');
  return { NAMES, full, setBits, parse, val, tex, steps, usesNot, regionName, regionTex, parseEls, sortEls, universe, regionOf, elsOf, elsTex };
})();
if (typeof module !== 'undefined' && module.exports) module.exports.SetV = SetV;

// ═════════════ Venn: Geometrie (Einheitskoordinaten, y nach oben, wie im Dossier) ═════════════
const SETV_GEO = {
  2: { c: [[-0.55, 0], [0.55, 0]], g: [-2.05, 2.05, -1.38, 1.5] },
  3: { c: [[0, 0.55], [-0.7, -0.6], [0.7, -0.6]], g: [-2.15, 2.15, -1.9, 1.9] }
};
const setVMask = (n, x, y) => { let m = 0; SETV_GEO[n].c.forEach((c, k) => { if (Math.hypot(x - c[0], y - c[1]) < 1) m |= 1 << k; }); return m; };
// Ankerpunkt je Feld: Punkt mit dem grössten Abstand zu allen Rändern (einmal berechnet)
const SETV_ANCH = {};
function setVAnchors(n) {
  if (SETV_ANCH[n]) return SETV_ANCH[n];
  const G = SETV_GEO[n], best = {};
  for (let x = G.g[0] + 0.05; x < G.g[1]; x += 0.04) for (let y = G.g[2] + 0.05; y < G.g[3]; y += 0.04) {
    const m = setVMask(n, x, y);
    let cl = Math.min(x - G.g[0], G.g[1] - x, y - G.g[2], G.g[3] - y); G.c.forEach(c => { cl = Math.min(cl, Math.abs(Math.hypot(x - c[0], y - c[1]) - 1)); });
    if (!best[m] || cl > best[m].cl) best[m] = { x, y, cl };
  }
  best[0] = n === 3 ? { x: 0, y: -1.66 } : { x: 0, y: -1.13 };                  // aussen: unten in der Mitte
  return (SETV_ANCH[n] = best);
}
// Venn-Diagramm in die Zelle r zeichnen. o: {n, hatch: Bitmenge, hcol, marks: {m: Farbe}, els: {m: [Text]}, elCol(m, x), counts: [..], title, hl}
function setVenn(S, r, C, o) {
  const fs = C.fs, n = o.n, G = SETV_GEO[n], top = r.y + (o.title ? fs * 2.6 : fs * 0.6), H = r.y + r.h - top - fs * 0.4, W = r.w - fs * 1.2;
  const sc = Math.min(W / (G.g[1] - G.g[0]), H / (G.g[3] - G.g[2])), cx = r.x + r.w / 2, cy = top + H / 2, gmx = (G.g[0] + G.g[1]) / 2, gmy = (G.g[2] + G.g[3]) / 2;
  const X = x => cx + (x - gmx) * sc, Y = y => cy - (y - gmy) * sc, ux = p => gmx + (p - cx) / sc, uy = p => gmy - (p - cy) / sc;
  if (typeof stKeepFrame === 'function') stKeepFrame(r);
  if (o.title) S.rich(r.x + fs * 0.6, r.y + fs * 1.2, o.title, { size: fs * 1.1, col: 'T', al: 'l', bs: 'm' });
  const gx0 = X(G.g[0]), gx1 = X(G.g[1]), gy0 = Y(G.g[3]), gy1 = Y(G.g[2]);
  S.rect(gx0, gy0, gx1 - gx0, gy1 - gy0, { stroke: 'L', lw: 1.4 });
  S.rich(gx0 + fs * 0.5, gy0 + fs * 0.9, 'G', { size: fs * 1.1, col: 'M', al: 'l', bs: 'm' });
  shlBox(S, 'G', gx0, gy0, gx1, gy1); if (o.hl === 'venn') shlBox(S, 'venn', gx0, gy0, gx1, gy1);
  // Schraffur: Linien unter 45°, an den Kreisen und am Rechteck zerschnitten; Teilstücke im Ziel werden gezeichnet
  const hatch = (bits, col, gap, lw) => {
    if (!bits) return;
    const d = [Math.SQRT1_2, Math.SQRT1_2], step = gap / sc * Math.SQRT2;
    for (let c = G.g[0] - G.g[3]; c <= G.g[1] - G.g[2]; c += step) {
      // Punkt p(t) = (c, 0) + t·d  (Linie x − y = c)
      let t0 = -Infinity, t1 = Infinity;
      [[0, G.g[0], G.g[1]], [1, G.g[2], G.g[3]]].forEach(([k, lo, hi]) => { const p0 = k ? 0 : c, a = (lo - p0) / d[k], b = (hi - p0) / d[k]; t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b)); });
      if (!(t1 > t0)) continue;
      const ts = [t0, t1];
      G.c.forEach(q => { const px = c - q[0], py = -q[1], B = 2 * (px * d[0] + py * d[1]), Cc = px * px + py * py - 1, D = B * B - 4 * Cc; if (D > 0) { const sq = Math.sqrt(D); [(-B - sq) / 2, (-B + sq) / 2].forEach(t => { if (t > t0 && t < t1) ts.push(t); }); } });
      ts.sort((a, b) => a - b);
      for (let k = 0; k + 1 < ts.length; k++) {
        const tm = (ts[k] + ts[k + 1]) / 2, mx = c + tm * d[0], my = tm * d[1];
        if (bits & (1 << setVMask(n, mx, my))) { const a = [X(c + ts[k] * d[0]), Y(ts[k] * d[1])], b = [X(c + ts[k + 1] * d[0]), Y(ts[k + 1] * d[1])]; S.line(a[0], a[1], b[0], b[1], { col, lw, a: 0.85 }); if (o.hl) shl(S, o.hl, [a, b]); }
      }
    }
  };
  if (o.marks) Object.keys(o.marks).forEach(col => hatch(o.marks[col], col, fs * 0.55, 2));
  if (o.hatch) hatch(o.hatch, o.hcol || ST_G, fs * 0.55, 2);
  G.c.forEach((q, k) => {
    S.circ(X(q[0]), Y(q[1]), sc, { stroke: 'T', lw: 2.2 }); shlC(S, SetV.NAMES[k], X(q[0]), Y(q[1]), sc);
    const lp = (n === 3 ? [[0, 1.72], [-1.7, -1.45], [1.7, -1.45]] : [[-1.3, 1.08], [1.3, 1.08]])[k];
    S.rich(X(lp[0]), Y(lp[1]), (o.names || SetV.NAMES)[k], { size: fs * 1.25, col: 'T', al: 'c', bs: 'm', bold: true });
  });
  // Elemente oder Anzahlen in die Felder
  const A = setVAnchors(n);
  for (let m = 0; m < (1 << n); m++) {
    const an = A[m]; if (!an) continue; const px = X(an.x), py = Y(an.y);
    shlC(S, 'reg', px, py, fs * 1.1);
    const bg = (x, y, txt, k) => S.rect(x - (String(txt).length * 0.62 + 0.5) * fs * k / 2, y - fs * k * 0.68, (String(txt).length * 0.62 + 0.5) * fs * k, fs * k * 1.36, { fill: 'W', a: 0.85 });
    if (o.counts) { const v = o.counts[m]; bg(px, py, v === null || v === undefined ? '?' : v, 1.15); S.rich(px, py, v === null || v === undefined ? '?' : String(v), { size: fs * 1.15, col: o.cntCol ? o.cntCol(m) : 'T', al: 'c', bs: 'm', bold: true }); continue; }
    const L = o.els && o.els[m]; if (!L || !L.length) continue;
    const per = L.length <= 2 ? L.length : L.length <= 6 ? 3 : 4, rows = Math.ceil(L.length / per), dx = fs * 1.55, dy = fs * 1.3;
    L.forEach((t, i) => { const rI = Math.floor(i / per), cI = i % per, inRow = Math.min(per, L.length - rI * per); bg(px + (cI - (inRow - 1) / 2) * dx, py + (rI - (rows - 1) / 2) * dy, t, 1); S.rich(px + (cI - (inRow - 1) / 2) * dx, py + (rI - (rows - 1) / 2) * dy, t, { size: fs * 1.0, col: o.elCol ? o.elCol(m, t) : 'T', al: 'c', bs: 'm', bold: o.elCol && o.elCol(m, t) !== 'T' }); });
  }
  return { n, X, Y, ux, uy, sc, inG: (px, py) => px >= gx0 && px <= gx1 && py >= gy0 && py <= gy1 };
}

// ═════════════ Übungen ═════════════
const SetEx = (function () {
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
  const KINDS = [['ivw', 'Intervall schreiben'], ['ivop', 'Operationen mit Intervallen'], ['shade', 'Venn-Diagramm schraffieren'], ['el', 'Elemente bestimmen'], ['cnt', 'Anzahlen im Venn-Diagramm (3 Mengen)']];
  const T2 = ['A∩B', 'A∪B', 'A\\B', 'B\\A', "A'", "(A∪B)'", "(A∩B)'", "A'∩B", "A∪B'", "A'∩B'", "A'∪B'", '(A∪B)\\(A∩B)'];
  const T3 = ['A∩B∩C', 'A∪B∪C', '(A∪B)∩C', 'A∩(B∪C)', '(A∩B)∪C', 'A\\(B∪C)', '(A∩B)\\C', "A'∩(B∪C)", "(A∪B∪C)'", '(A\\B)∪(B∩C)', "A∩B'∩C", '(A∪B)\\C', "(A∩B)∪(A∩C)", "C\\(A∩B)", "(A∪C)∩B'"];
  const recent = [];
  const fresh = (list, key) => { for (let k = 0; k < 12; k++) { const v = pick(list), id = key + '|' + JSON.stringify(v); if (recent.indexOf(id) < 0) { recent.push(id); if (recent.length > 8) recent.shift(); return v; } } return pick(list); };
  // ── Intervalle lesen: «[-2, 3)», «]-2; 3[», «(-∞, 4]», Vereinigung mit ∪ oder u, leer: {}, ∅
  function parseIv(src) {
    let s = String(src || '').replace(/\s+/g, '').replace(/−/g, '-').replace(/∞|unendlich|infinity/gi, 'inf');
    if (!s) return null;
    if (/^(\{\}|∅|leer|\{\})$/i.test(s)) return [];
    const parts = s.split(/∪|[uU]|\|/), out = [];
    for (const p of parts) {
      let m = p.match(/^\{(-?[\d.,]+)\}$/);
      if (m) { const v = parseFloat(m[1].replace(',', '.')); if (!isFinite(v)) return null; out.push(SetI.mk(v, v, true, true)); continue; }
      m = p.match(/^([\[\]\(])([^;,]+(?:[.,]\d+)?)[;,]([^;,\[\]\(\)]+)([\[\]\)])$/) || p.match(/^([\[\]\(])(.+?);(.+?)([\[\]\)])$/);
      if (!m) return null;
      const num = t => { t = t.replace(',', '.'); if (/^\+?inf$/i.test(t)) return Infinity; if (/^-inf$/i.test(t)) return -Infinity; const v = parseFloat(t); return isFinite(v) && /^[+-]?[\d.]+$/.test(t) ? v : NaN; };
      const a = num(m[2]), b = num(m[3]); if (isNaN(a) || isNaN(b) || a > b) return null;
      if ((m[1] === '[' && a === -Infinity) || (m[4] === ']' && b === Infinity)) return { bad: 'Bei ±∞ ist die Klammer immer offen.' };
      out.push(SetI.mk(a, b, m[1] === '[', m[4] === ']'));
    }
    return SetI.union(out);
  }
  const same = (P, Q) => P.length === Q.length && P.every((I, k) => I.a === Q[k].a && I.b === Q[k].b && I.ca === Q[k].ca && I.cb === Q[k].cb);
  const rndIv = inf => { let a = ri(-6, 5), b = a + ri(1, 6); const I = { a, b, ca: Math.random() < 0.5, cb: Math.random() < 0.5 }; if (inf && Math.random() < 0.3) { if (Math.random() < 0.5) I.a = -Infinity; else I.b = Infinity; } return SetI.mk(I.a, I.b, I.ca, I.cb); };
  const enc = v => (v === Infinity ? 'inf' : v === -Infinity ? '-inf' : v), dec = v => (v === 'inf' ? Infinity : v === '-inf' ? -Infinity : v);
  const ivE = I => ({ a: enc(I.a), b: enc(I.b), ca: I.ca, cb: I.cb }), ivD = I => SetI.mk(dec(I.a), dec(I.b), I.ca, I.cb);
  function make(kind) {
    if (kind === 'ivw') { const I = rndIv(true); return { kind, I: ivE(I), show: fresh(['builder', 'ineq', 'line'], 'ivw') }; }
    if (kind === 'ivop') {
      for (let k = 0; k < 30; k++) { const A = rndIv(true), B = rndIv(k < 20), op = fresh(['and', 'or', 'amb', 'bma', 'ca'], 'ivop'); const R = SetI.apply(op, A, B); if (k < 25 && (op !== 'ca' && R.length === 0 && Math.random() < 0.7)) continue; return { kind, A: ivE(A), B: ivE(B), op }; }
    }
    if (kind === 'shade') { const n = Math.random() < 0.45 ? 2 : 3; return { kind, n, expr: fresh(n === 2 ? T2 : T3, 'sh' + n) }; }
    if (kind === 'el') {
      const n = Math.random() < 0.4 ? 2 : 3, N = 12, U = Array.from({ length: N }, (_, i) => String(i + 1)), sets = [];
      for (let k = 0; k < n; k++) sets.push(SetV.sortEls(U.filter(() => Math.random() < 0.38)));
      sets.forEach(S => { if (S.length < 2) S.push(String(ri(1, N))); });
      const expr = fresh(n === 2 ? T2 : T3, 'el' + n), useG = SetV.usesNot(SetV.parse(expr, n).t);
      return { kind, n, expr, sets: sets.map(S => SetV.sortEls(S.filter((x, i) => S.indexOf(x) === i))), G: useG ? '1, 2, …, 12' : '' };
    }
    // Anzahlen: Feldzahlen zufällig, gegeben sind Mengen und Schnittmengen
    const c = [ri(0, 8), ri(8, 40), ri(6, 35), ri(2, 12), ri(5, 30), ri(1, 10), ri(1, 10), ri(1, 6)];
    const ctx = fresh([['Sprachen im Dorf', 'Italienisch (I)', 'Deutsch (D)', 'Französisch (F)', 'Einwohner'], ['Sportarten in der Klasse', 'Fussball (F)', 'Volleyball (V)', 'Schwimmen (S)', 'Schülerinnen und Schüler'], ['Abos', 'Zeitung (Z)', 'Streaming (S)', 'Fitness (F)', 'Personen'], ['Wahlfächer', 'Chor (C)', 'Theater (T)', 'Robotik (R)', 'Lernende']], 'cnt');
    const q = fresh([['nur A', 1 << 1], ['nur B', 1 << 2], ['nur C', 1 << 4], ['genau zwei Mengen', (1 << 3) | (1 << 5) | (1 << 6)], ['A oder B', (1 << 1) | (1 << 2) | (1 << 3) | (1 << 5) | (1 << 6) | (1 << 7)], ['keine Menge', 1], ['A, aber nicht C', (1 << 1) | (1 << 3)], ['mindestens zwei Mengen', (1 << 3) | (1 << 5) | (1 << 6) | (1 << 7)]], 'cntq');
    return { kind: 'cnt', n: 3, c, ctx, q };
  }
  const qBits = t => t.q[1];
  const sum = (c, bits) => c.reduce((s, v, m) => s + (bits & (1 << m) ? v : 0), 0);
  function givens(t) {
    const c = t.c, tot = c.reduce((a, b) => a + b, 0), s1 = k => sum(c, SetV.setBits(k, 3)), s2 = (j, k) => sum(c, SetV.setBits(j, 3) & SetV.setBits(k, 3));
    return { tot, A: s1(0), B: s1(1), C: s1(2), AB: s2(0, 1), AC: s2(0, 2), BC: s2(1, 2), ABC: c[7] };
  }
  function check(t, ans, xs) {
    if (t.kind === 'ivw' || t.kind === 'ivop') {
      const P = parseIv(ans); if (P === null) return { ok: false, msg: 'Nicht lesbar. Beispiele: [−2, 3)  oder  ]−2; 3[  oder  (−∞, 1] ∪ [4, ∞)' };
      if (P.bad) return { ok: false, msg: P.bad };
      const R = t.kind === 'ivw' ? [ivD(t.I)] : SetI.apply(t.op, ivD(t.A), ivD(t.B));
      if (same(P, R)) return { ok: true, msg: 'Richtig!' };
      const sameEnds = P.length === R.length && P.every((I, k) => I.a === R[k].a && I.b === R[k].b);
      return { ok: false, msg: sameEnds ? 'Die Grenzen stimmen, aber prüfe, ob die Randpunkte dazugehören.' : 'Noch nicht richtig. Zeichne die Intervalle auf der Zahlengeraden.' };
    }
    if (t.kind === 'shade') {
      const want = SetV.val(SetV.parse(t.expr, t.n).t, t.n);
      if (xs === want) return { ok: true, msg: 'Richtig!' };
      const miss = want & ~xs, extra = xs & ~want, cnt = b => { let k = 0; for (; b; b &= b - 1) k++; return k; };
      return { ok: false, msg: (miss ? cnt(miss) + ' Feld(er) fehlen' : '') + (miss && extra ? ', ' : '') + (extra ? cnt(extra) + ' Feld(er) zu viel' : '') + '.' };
    }
    if (t.kind === 'el') {
      const P = SetV.parseEls(ans), R = solveEl(t).res;
      if (P.length === R.length && P.every(x => R.indexOf(x) >= 0)) return { ok: true, msg: 'Richtig!' };
      return { ok: false, msg: 'Noch nicht richtig' + (P.some(x => R.indexOf(x) < 0) ? ' (es hat zu viele Elemente)' : ' (es fehlen Elemente)') + '.' };
    }
    const v = parseFloat(String(ans).replace(',', '.')), want = sum(t.c, qBits(t));
    return v === want ? { ok: true, msg: 'Richtig!' } : { ok: false, msg: 'Noch nicht richtig. Fülle das Venn-Diagramm von der Mitte nach aussen.' };
  }
  function solveEl(t) { const sets = t.sets, U = SetV.universe(sets, t.G ? Array.from({ length: 12 }, (_, i) => String(i + 1)) : []), T = SetV.parse(t.expr, t.n).t; return { U, T, res: SetV.elsOf(SetV.val(T, t.n), sets, U) }; }
  // Aufgabentext (LaTeX) und Rechenweg
  function prompt(t) {
    if (t.kind === 'ivw') { const I = ivD(t.I); return t.show === 'builder' ? 'Schreibe als Intervall: $' + SetI.builder([I]) + '$' : t.show === 'ineq' ? 'Schreibe als Intervall: alle $x\\in\\mathbb{R}$ mit $' + SetI.ineqTex(I) + '$' : 'Schreibe das Intervall auf der Zahlengeraden in Intervallschreibweise.'; }
    if (t.kind === 'ivop') return 'Bestimme $' + SetI.OPTEX[t.op].replace('\\overline{A}', '\\overline{A}\\ (\\text{in }\\mathbb{R})') + '$ für $A=' + SetI.ivTex(ivD(t.A), 'r') + '$ und $B=' + SetI.ivTex(ivD(t.B), 'r') + '$.';
    if (t.kind === 'shade') return 'Schraffiere $' + SetV.tex(SetV.parse(t.expr, t.n).t) + '$: Klicke im Venn-Diagramm die Felder an.';
    if (t.kind === 'el') return 'Bestimme $' + SetV.tex(SetV.parse(t.expr, t.n).t) + '$ in aufzählender Form' + (t.G ? ' (Grundmenge $G=\\{1,\\ldots,12\\}$)' : '') + '.';
    const g = givens(t), nm = t.ctx.slice(1, 4).map(s => s.replace(/ \(.\)/, ''));
    return 'Von ' + g.tot + ' ' + t.ctx[4] + ': ' + g.A + ' ' + nm[0] + ', ' + g.B + ' ' + nm[1] + ', ' + g.C + ' ' + nm[2] + '; ' + nm[0] + ' und ' + nm[1] + ': ' + g.AB + ', ' + nm[0] + ' und ' + nm[2] + ': ' + g.AC + ', ' + nm[1] + ' und ' + nm[2] + ': ' + g.BC + ', alle drei: ' + g.ABC + '. Wie viele ' + cntQ(t) + '?';
  }
  function cntQ(t) { const nm = t.ctx.slice(1, 4).map(s => s.replace(/ \(.\)/, '')), q = t.q[0]; return q === 'nur A' ? 'nur ' + nm[0] : q === 'nur B' ? 'nur ' + nm[1] : q === 'nur C' ? 'nur ' + nm[2] : q === 'genau zwei Mengen' ? 'genau zwei davon' : q === 'A oder B' ? nm[0] + ' oder ' + nm[1] : q === 'keine Menge' ? 'keines davon' : q === 'A, aber nicht C' ? nm[0] + ', aber nicht ' + nm[2] : 'mindestens zwei davon'; }
  function doc(t) {
    const d = Dif.DOC();
    d.h('Aufgabe'); d.p(prompt(t));
    if (t.kind === 'ivw') { const I = ivD(t.I); d.h('Lösung'); d.p('Randpunkte ablesen; eckige Klammer nach innen, wenn der Randpunkt dazugehört (gefüllter Punkt, $\\le$), sonst runde (oder nach aussen gedrehte) Klammer. Bei $\\pm\\infty$ immer offen.'); d.e(SetI.ivTex(I, 'r') + '=' + SetI.ivTex(I, 'f') + '=' + SetI.builder([I])); d.res('$' + SetI.ivTex(I, 'r') + '$'); }
    else if (t.kind === 'ivop') { const D = SetI.opDoc(ivD(t.A), ivD(t.B), t.op, 'r'); d.h('Lösung'); D.b.slice(1).forEach(b => d.b.push(b)); }
    else if (t.kind === 'shade' || t.kind === 'el') {
      const T = SetV.parse(t.expr, t.n).t; d.h('Lösung');
      if (t.kind === 'el') { const s = solveEl(t); t.sets.forEach((S, k) => d.e(SetV.NAMES[k] + '=' + SetV.elsTex(S))); if (t.G) d.e('G=\\{1,2,\\ldots,12\\}'); SetV.steps(T).forEach(u => d.e(SetV.tex(u) + '=' + SetV.elsTex(SetV.elsOf(SetV.val(u, t.n), t.sets, s.U)))); d.res('$' + SetV.tex(T) + '=' + SetV.elsTex(s.res) + '$'); }
      else { d.p('Schritt für Schritt von innen nach aussen (zuerst die Klammern):'); SetV.steps(T).forEach(u => d.e(SetV.tex(u)).op(setVBitsWords(SetV.val(u, t.n), t.n))); d.res('Schraffiert: ' + setVBitsWords(SetV.val(T, t.n), t.n)); }
    } else {
      const g = givens(t), c = t.c, nm = t.ctx.slice(1, 4).map(s => s.replace(/.*\((.)\)/, '$1'));
      d.h('Lösung: von der Mitte nach aussen');
      d.e('\\text{alle drei: }' + c[7]);
      d.e('\\text{nur }' + nm[0] + '\\text{ und }' + nm[1] + ':\\ ' + g.AB + '-' + c[7] + '=' + c[3]);
      d.e('\\text{nur }' + nm[0] + '\\text{ und }' + nm[2] + ':\\ ' + g.AC + '-' + c[7] + '=' + c[5]);
      d.e('\\text{nur }' + nm[1] + '\\text{ und }' + nm[2] + ':\\ ' + g.BC + '-' + c[7] + '=' + c[6]);
      d.e('\\text{nur }' + nm[0] + ':\\ ' + g.A + '-' + c[3] + '-' + c[5] + '-' + c[7] + '=' + c[1]);
      d.e('\\text{nur }' + nm[1] + ':\\ ' + g.B + '-' + c[3] + '-' + c[6] + '-' + c[7] + '=' + c[2]);
      d.e('\\text{nur }' + nm[2] + ':\\ ' + g.C + '-' + c[5] + '-' + c[6] + '-' + c[7] + '=' + c[4]);
      d.e('\\text{keines: }' + g.tot + '-' + [1, 2, 3, 4, 5, 6, 7].map(m => c[m]).join('-') + '=' + c[0]);
      d.res(cntQ(t).replace(/^./, s => s.toUpperCase()) + ': $' + sum(c, qBits(t)) + '$');
    }
    return d;
  }
  return { KINDS, make, check, prompt, doc, parseIv, solveEl, qBits, sum, ivD, givens };
})();
function setVBitsWords(bits, n) { const a = []; for (let m = (1 << n) - 1; m >= 0; m--) if (bits & (1 << m)) a.push(SetV.regionName(m, n)); return a.length ? a.join('; ') : 'kein Feld'; }

// ═════════════ Szenen ═════════════
function setVennData(C) {
  const n = C.vn, sets = [C.vA, C.vB, C.vC].slice(0, n).map(SetV.parseEls), G = SetV.parseEls(C.vG), P = SetV.parse(C.vx, n);
  return { n, sets, G, P, U: SetV.universe(sets, G), bits: P.ok ? SetV.val(P.t, n) : 0 };
}
// Reihenfolge für die Animation: die vorkommenden Mengen einzeln, danach die Teilterme in Rechenreihenfolge
function setVennSeq(t, n) {
  const used = [], walk = u => { if (!u) return; if (u.k === 'set' && used.indexOf(u.j) < 0) used.push(u.j); walk(u.a); walk(u.b); }; walk(t);
  const out = used.sort((p, q) => p - q).map(j => ({ tex: SetV.NAMES[j], bits: SetV.setBits(j, n) }));
  SetV.steps(t).forEach(u => out.push({ tex: SetV.tex(u), bits: SetV.val(u, n) }));
  return out;
}
function setSceneVenn(S, W, H, C) {
  const fs = C.fs, D = setVennData(C), R = stLayout(W, H, [{ w: 0.66, rows: [1] }, { w: 0.34, rows: [1] }]);
  const title = D.P.ok ? '\\col{g}{' + SetV.tex(D.P.t) + '}' : '\\col{r}{\\text{' + D.P.err + '}}';
  const els = {}, cnt = C.vm === 'cnt' ? C.vK.slice(0, 1 << D.n) : null;
  if (C.vm === 'el') D.U.forEach(x => { const m = SetV.regionOf(x, D.sets); (els[m] || (els[m] = [])).push(x); });
  // Animation (C.vAnim): der Term entsteht Schritt für Schritt – erst die einzelnen Mengen, dann von innen nach aussen
  const sq = D.P.ok ? setVennSeq(D.P.t, D.n) : [], an = D.P.ok && typeof C.vAnim === 'number' && sq[C.vAnim] ? sq[C.vAnim] : null, hb = an ? an.bits : D.bits;
  const V = setVenn(S, R[0], C, { n: D.n, hatch: hb, hl: 'res', title: an ? '\\col{v}{' + an.tex + '}' : title, els, counts: cnt, elCol: (m) => (hb & (1 << m) ? ST_G : 'T'), cntCol: m => (hb & (1 << m) ? ST_G : 'T') });
  S.maps.venn = V;
  const L = [];
  if (an) {
    L.push({ s: '\\text{Schritt ' + (C.vAnim + 1) + ' von ' + sq.length + '}', col: 'M', size: 0.9 }); L.push(null);
    sq.forEach((u, i) => { if (i <= C.vAnim) L.push({ s: (i === C.vAnim ? '\\col{v}{' + u.tex + '}' : u.tex) + (C.vm === 'el' ? '=' + SetV.elsTex(SetV.elsOf(u.bits, D.sets, D.U)) : ''), size: i === C.vAnim ? 1 : 0.9, bold: i === C.vAnim }); });
  } else if (D.P.ok) {
    L.push({ s: '\\col{g}{' + SetV.tex(D.P.t) + '}', bold: true, hl: 'res' });
    if (C.vm === 'el') L.push({ s: '\\col{g}{=' + SetV.elsTex(SetV.elsOf(D.bits, D.sets, D.U)) + '}', hl: 'res' });
    if (C.vm === 'cnt') L.push({ s: '\\col{g}{|' + SetV.tex(D.P.t) + '|=' + SetEx.sum(cnt, D.bits) + '}', hl: 'res' });
    L.push(null);
    SetV.steps(D.P.t).slice(0, -1).forEach(u => L.push({ s: SetV.tex(u) + (C.vm === 'el' ? '=' + SetV.elsTex(SetV.elsOf(SetV.val(u, D.n), D.sets, D.U)) : ''), size: 0.9 }));
  }
  difLines(S, R[1], L, C, { max: fs * 1.15 });
}
function setSceneEx(S, W, H, C) {
  const fs = C.fs, t = C.xt; if (!t) return;
  const done = C.xr === 'ok' || C.xr === 'shown';
  if (t.kind === 'ivw' || t.kind === 'ivop') {
    const R = stLayout(W, H, [{ w: 1, rows: [1] }]), r = R[0];
    const ls = t.kind === 'ivw' ? [SetEx.ivD(t.I)] : [SetEx.ivD(t.A), SetEx.ivD(t.B)], res = t.kind === 'ivw' ? ls : SetI.apply(t.op, ls[0], ls[1]);
    const m = setFrame(S, r, setWin(ls, C), C, null); S.maps.main = m;
    const h = (m.B - m.T) / 3, y = k => m.T + h * (k + 0.55);
    if (t.kind === 'ivw') {
      if (t.show === 'line' || done) setLine(S, m, y(0.6), ls, ST_B, C, { lab: 'b', name: done ? '\\col{b}{' + SetI.ivTex(ls[0], C.st) + '}' : '\\col{b}{?}' });
      else S.rich((m.L + m.R) / 2, y(0.6), t.show === 'builder' ? SetI.builder(ls) : 'x\\in\\mathbb{R},\\ ' + SetI.ineqTex(ls[0]), { size: fs * 1.6, col: 'T', al: 'c', bs: 'm' });
    } else {
      setLine(S, m, y(0), [ls[0]], ST_B, C, { name: '\\col{b}{A=' + SetI.ivTex(ls[0], C.st) + '}', noNum: true });
      setLine(S, m, y(1), [ls[1]], ST_O, C, { name: '\\col{o}{B=' + SetI.ivTex(ls[1], C.st) + '}', noNum: true });
      setLine(S, m, y(2), done ? res : [], ST_G, C, { name: '\\col{g}{' + setOpTex(t.op) + '=' + (done ? SetI.setTex(res, C.st) : '\\ ?') + '}' });
    }
    return;
  }
  const R = stLayout(W, H, [{ w: 1, rows: [1] }]);
  if (t.kind === 'shade') {
    const want = SetV.val(SetV.parse(t.expr, t.n).t, t.n), xs = C.xs || 0, chk = C.xr === 'ok' || C.xr === 'bad' || C.xr === 'shown';
    const marks = {};
    if (C.xr === 'shown') marks[ST_G] = want;
    else if (chk) { marks[ST_G] = xs & want; marks[ST_R] = xs & ~want; }
    else marks[ST_B] = xs;
    const V = setVenn(S, R[0], C, { n: t.n, marks, hl: 'venn', title: '\\text{Schraffiere }' + SetV.tex(SetV.parse(t.expr, t.n).t) });
    S.maps.venn = V;
  } else if (t.kind === 'el') {
    const s = SetEx.solveEl(t), els = {}; s.U.forEach(x => { const m = SetV.regionOf(x, t.sets); (els[m] || (els[m] = [])).push(x); });
    const V = setVenn(S, R[0], C, { n: t.n, els, hatch: done ? SetV.val(s.T, t.n) : 0, elCol: m => (done && SetV.val(s.T, t.n) & (1 << m) ? ST_G : 'T'), hl: 'venn', title: SetV.tex(s.T) + '=\\ ' + (done ? '\\col{g}{' + SetV.elsTex(s.res) + '}' : '?') });
    S.maps.venn = V;
  } else {
    const nm = t.ctx.slice(1, 4).map(s => s.replace(/.*\((.)\)/, '$1'));
    const V = setVenn(S, R[0], C, { n: 3, counts: done ? t.c : t.c.map(() => null), hatch: done ? SetEx.qBits(t) : 0, hl: 'venn', cntCol: m => (done && SetEx.qBits(t) & (1 << m) ? ST_G : 'T'), names: nm, title: '\\text{' + t.ctx[0] + ': ' + t.ctx.slice(1, 4).join(', ') + '}' });
    S.maps.venn = V;
  }
}
