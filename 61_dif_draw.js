// ═══════════════════════════════════════════════════════════════════
// 61_dif_draw.js — Differentialrechnung: Bilder (Szenen)
//
// Wie bei Statistik und Finanzmathematik baut jede Ansicht eine «Szene» (Rechteck, Linie, Kreis,
// Vieleck, Text; Formeln als Rich-Text), die auf den Canvas gemalt (statPaint) und als TikZ
// ausgegeben wird (stSceneTex). Kurven und Geraden werden hier selbst auf den Bildausschnitt
// zugeschnitten (TikZ kennt keinen Zuschnitt), Polstellen unterbrechen die Kurve.
//
// Ansichten:  tan  Sekante → Tangente (h-Tabelle, Steigungsdreieck)
//             gr   Graphisches Ableiten (f über f')
//             rg   Ableiten mit Regeln (Tangente und Normale)
//             kd   Kurvendiskussion (Nullstellen, Extrema, Wendepunkte)
// Farben wie im Dossier: h blau, Δy rot, Sekante violett, Tangente grün.
// Kontext C: {view, F, win:{x0,x1,y0,y1}, x0, h, show:{…}, trace:[…], K, fs, exp}
// ═══════════════════════════════════════════════════════════════════
const DIF_UP = ST_G, DIF_DOWN = ST_O;           // steigt grün, fällt orange

function difScene() { const S = stScene(); S.hits = []; S.pts = []; S.maps = {}; return S; }
const difNum = (v, d) => (typeof Dif !== 'undefined' ? Dif.fmt(v, d === undefined ? 4 : d) : String(v));
const difPad = v => difNum(v, 4);

// ── Bildausschnitt: y-Bereich automatisch (Ausreisser wie Polstellen werden ignoriert) ──
function difAutoY(g, x0, x1, N) {
  N = N || 400; const v = [];
  for (let i = 0; i <= N; i++) { const y = g(x0 + (x1 - x0) * i / N); if (isFinite(y) && Math.abs(y) < 1e12) v.push(y); }
  if (v.length < 3) return [-5, 5];
  v.sort((a, b) => a - b);
  const q = p => v[Math.min(v.length - 1, Math.max(0, Math.round(p * (v.length - 1))))];
  let lo = q(0.1), hi = q(0.9); const span = (hi - lo) || 1;
  if (v[0] >= lo - 0.35 * span) lo = v[0];
  if (v[v.length - 1] <= hi + 0.35 * span) hi = v[v.length - 1];
  let sp = hi - lo; if (sp < 1e-9) { lo -= 1; hi += 1; sp = 2; }
  const pad = sp * 0.14; lo -= pad; hi += pad; sp = hi - lo;
  if (lo > 0 && lo < sp * 0.55) lo = -pad;
  if (hi < 0 && -hi < sp * 0.55) hi = pad;
  return [lo, hi];
}
// Vollständiger Ausschnitt aus C.win (y automatisch, wenn nicht gesetzt)
function difWindow(C, g) {
  const w = C.win || {}, x0 = isFinite(w.x0) ? w.x0 : -5, x1 = isFinite(w.x1) && w.x1 > x0 ? w.x1 : x0 + 10;
  let y0 = w.y0, y1 = w.y1;
  if (!(isFinite(y0) && isFinite(y1) && y1 > y0)) {
    const a = difAutoY(g, x0, x1); y0 = a[0]; y1 = a[1];
    // Kurvendiskussion: Bild auf die besonderen Punkte zuschneiden (Extrema, Wendepunkte), damit man sie erkennt
    const K = C.view === 'kd' ? C.K : null;
    if (K) {
      const ys = [0].concat(K.crit.map(c => c.y), K.infl.map(c => c.y)).filter(isFinite);
      const lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys), sp = hi - lo;
      if (sp > 1e-9 && ys.length > 2) { const pad = sp * 0.9; y0 = Math.max(y0, lo - pad); y1 = Math.min(y1, hi + pad); if (!(y1 > y0)) { y0 = lo - pad; y1 = hi + pad; } }
    }
  }
  return { x0, x1, y0, y1 };
}

// ── Zuschnitt einer Strecke auf ein Rechteck (Liang–Barsky) ──
function difClip(ax, ay, bx, by, L, T, R, B) {
  let t0 = 0, t1 = 1; const dx = bx - ax, dy = by - ay;
  const tst = (p, q) => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
    return true;
  };
  if (tst(-dx, ax - L) && tst(dx, R - ax) && tst(-dy, ay - T) && tst(dy, B - ay)) return [ax + t0 * dx, ay + t0 * dy, ax + t1 * dx, ay + t1 * dy, t0, t1];
  return null;
}

// ── Rahmen mit Gitter, Achsen und Beschriftung ──
// r: Rechteck, win: Ausschnitt, o: {title (Rich, links), info (Rich, rechts), xlab, ylab, xstep/ystep (feste Schrittweite), xfmt (Rich-Beschriftung der x-Striche)}
function difFrame(S, r, win, C, o) {
  o = o || {}; const fs = C.fs, head = (o.title || o.info) ? fs * 2.0 : 0;
  const L = r.x + fs * 2.9, R = r.x + r.w - fs * 1.0, T = r.y + fs * 0.6 + head, B = r.y + r.h - fs * 1.9;
  const m = {
    L, R, T, B, win, r,
    X: x => L + (x - win.x0) / (win.x1 - win.x0) * (R - L), Y: y => B - (y - win.y0) / (win.y1 - win.y0) * (B - T),
    IX: p => win.x0 + (p - L) / (R - L) * (win.x1 - win.x0), IY: p => win.y0 + (B - p) / (B - T) * (win.y1 - win.y0)
  };
  if (!(R - L > 20 && B - T > 20)) return m;
  (S.frames || (S.frames = [])).push([L, T, R, B, r.x, r.y, r.x + r.w, r.y + r.h]);
  if (typeof stKeepFrame === 'function') stKeepFrame(r);                // zum Zuschneiden (stAutoClip in 41_stat_draw.js)
  const sx = o.xstep || Stat.niceStep(win.x1 - win.x0, Math.max(3, Math.min(12, (R - L) / (fs * 4.5)))), sy = o.ystep || Stat.niceStep(win.y1 - win.y0, Math.max(3, Math.min(9, (B - T) / (fs * 3.2))));
  const ticks = (a, b, st) => { const out = []; for (let k = Math.ceil(a / st - 1e-9); k * st <= b + st * 1e-9 && out.length < 60; k++) out.push(Math.round(k * st * 1e9) / 1e9); return out; };
  const tx = ticks(win.x0, win.x1, sx), ty = ticks(win.y0, win.y1, sy), lab = (v, st) => stTickLabel(v, st).replace('-', '−');
  tx.forEach(v => { S.line(m.X(v), T, m.X(v), B, { col: 'G', lw: 1 }); });
  ty.forEach(v => { S.line(L, m.Y(v), R, m.Y(v), { col: 'G', lw: 1 }); });
  S.rect(L, T, R - L, B - T, { stroke: 'L', lw: 1 });
  const ax = Math.min(B, Math.max(T, m.Y(0))), ay = Math.min(R, Math.max(L, m.X(0)));
  if (win.y0 < 0 && win.y1 > 0) S.line(L, ax, R, ax, { col: 'L', lw: 1.6 });
  if (win.x0 < 0 && win.x1 > 0) S.line(ay, T, ay, B, { col: 'L', lw: 1.6 });
  tx.forEach(v => { S.line(m.X(v), B, m.X(v), B + 3, { col: 'L', lw: 1 }); if (o.xfmt) S.rich(m.X(v), B + fs * 1.0, o.xfmt(v), { size: fs * 0.82, col: 'M', al: 'c', bs: 'm' }); else S.text(m.X(v), B + fs * 1.0, lab(v, sx), { size: fs * 0.82, col: 'M', al: 'c', bs: 'm' }); });
  ty.forEach(v => { S.line(L - 3, m.Y(v), L, m.Y(v), { col: 'L', lw: 1 }); S.text(L - fs * 0.45, m.Y(v), lab(v, sy), { size: fs * 0.82, col: 'M', al: 'r', bs: 'm' }); });
  S.rich(R - fs * 0.5, B - fs * 0.9, o.xlab || 'x', { size: fs, col: 'M', al: 'r', bs: 'm' });
  S.rich(L + fs * 0.6, T + fs * 0.9, o.ylab || 'y', { size: fs, col: 'M', al: 'l', bs: 'm' });
  if (o.title) S.rich(L, r.y + fs * 1.1, o.title, { size: fs * 1.05, col: 'T', al: 'l', bs: 'm' });
  if (o.info) S.rich(R, r.y + fs * 1.1, o.info, { size: fs * 1.0, col: 'T', al: 'r', bs: 'm' });
  return m;
}

// ── Kurve y = g(x) im Rahmen; colorAt(x) färbt abschnittsweise ──
function difCurve(S, m, g, o) {
  o = o || {}; const { L, R, T, B, win } = m, W = R - L, N = Math.max(160, Math.min(900, Math.round(W * (o.exp ? 0.7 : 1.1)))), hgt = win.y1 - win.y0;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = win.x0 + (win.x1 - win.x0) * i / N; let y = NaN; try { y = g(x); } catch (e) { y = NaN; }
    pts.push({ x, y, ok: isFinite(y) && Math.abs(y) < 1e9, c: o.colorAt ? o.colorAt(x + (win.x1 - win.x0) / N / 2) : o.col });
  }
  let run = null, runCol = null;
  const flush = () => { if (run && run.length > 1) S.poly(run, { col: runCol, lw: o.lw || 2.2, dash: o.dash, a: o.a }); run = null; };
  for (let i = 0; i + 1 < pts.length; i++) {
    const p = pts[i], q = pts[i + 1];
    if (!p.ok || !q.ok) { flush(); continue; }
    if (Math.abs(q.y - p.y) > 3 * hgt && (p.y > 0) !== (q.y > 0)) { flush(); continue; }      // Polstelle
    const c = o.colorAt ? p.c : o.col;
    const seg = difClip(m.X(p.x), m.Y(p.y), m.X(q.x), m.Y(q.y), L, T, R, B);
    if (!seg) { flush(); continue; }
    if (run && c !== runCol) flush();
    const cont = run && Math.abs(run[run.length - 1][0] - seg[0]) < 0.01 && Math.abs(run[run.length - 1][1] - seg[1]) < 0.01;
    if (!cont) { flush(); run = [[seg[0], seg[1]]]; runCol = c; }
    run.push([seg[2], seg[3]]);
    if (seg[5] < 1) flush();
  }
  flush();
}
// Gerade durch (x0, y0) mit Steigung k
function difLine(S, m, x0, y0, k, o) {
  const { L, R, T, B, win } = m; if (!isFinite(k) || !isFinite(y0)) return;
  const a = m.X(win.x0 - 1), b = m.X(win.x1 + 1), ya = m.Y(y0 + k * (win.x0 - 1 - x0)), yb = m.Y(y0 + k * (win.x1 + 1 - x0));
  const s = difClip(a, ya, b, yb, L, T, R, B); if (s) S.line(s[0], s[1], s[2], s[3], o);
}
const difInside = (m, px, py, e) => px >= m.L - (e || 0) && px <= m.R + (e || 0) && py >= m.T - (e || 0) && py <= m.B + (e || 0);
function difDot(S, m, x, y, o) {
  o = o || {}; const px = m.X(x), py = m.Y(y); if (!isFinite(px) || !isFinite(py) || !difInside(m, px, py, 1)) return null;
  S.circ(px, py, o.r || 4.5, { fill: o.fill || 'T', stroke: o.stroke || o.fill || 'T', lw: o.lw || 1.5, a: o.a });
  return [px, py];
}
function difSeg(S, m, x1, y1, x2, y2, o) {                           // Strecke in Weltkoordinaten (zugeschnitten)
  const s = difClip(m.X(x1), m.Y(y1), m.X(x2), m.Y(y2), m.L, m.T, m.R, m.B); if (s) S.line(s[0], s[1], s[2], s[3], o);
}
// Beschriftung eines Punktes in Pixeln, innerhalb des Rahmens gehalten
function difLabel(S, m, px, py, s, C, o) {
  o = o || {}; const fs = C.fs, size = fs * (o.size || 1);
  const bx = typeof difCellBox === 'function' ? difCellBox(s, size) : { w: o.w || fs * 3.2, h: size * 1.2 }, w = Math.min(o.w || bx.w, bx.w) || fs * 3.2;
  const x = Math.min(m.R - w / 2, Math.max(m.L + w / 2, px + (o.dx || 0))), y = py + (o.dy || 0);
  S.rich(x, y, s, { size, col: o.col || 'T', al: 'c', bs: 'm' });
  (S.labs || (S.labs = [])).push({ x0: x - w / 2, x1: x + w / 2, y0: y - bx.h / 2, y1: y + bx.h / 2 });   // belegte Fläche (für spätere Beschriftungen)
}
// Überdeckung eines Rechtecks mit bereits belegten Flächen (Summe der Schnittflächen)
function difLabHit(S, b) {
  let a = 0; (S.labs || []).forEach(q => { const w = Math.min(b.x1, q.x1) - Math.max(b.x0, q.x0), h = Math.min(b.y1, q.y1) - Math.max(b.y0, q.y0); if (w > 0 && h > 0) a += w * h; });
  return a;
}

// ── Textblock aus Rich-Zeilen: {s, col, size, gap} ──
// Höhe einer Rich-Zeile in Schriftgrössen: Brüche brauchen mehr Platz, verschachtelte Brüche (Bruch im Zähler) noch mehr
function difFracDepth(s) {
  let depth = 0, best = 0; const open = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && s.startsWith('\\frac', i)) { while (open.length && open[open.length - 1] >= depth) open.pop(); open.push(depth); best = Math.max(best, open.length); }
    else if (c === '{') depth++;
    else if (c === '}') { depth--; while (open.length && open[open.length - 1] > depth) open.pop(); }
  }
  return best;
}
const difRichH = l => (difFracDepth(l.s) > 1 ? 3.7 : /\\frac|\\sqrt|\\left|\\int|\\sum/.test(l.s) ? 2.45 : 1.6) * (l.size || 1);
function difLines(S, r, lines, C, o) {
  o = o || {}; const vis = s => s.replace(/\\col\{[a-z]\}|\\text|\\[a-zA-Z]+|[{}\\^_]/g, '').length;
  // Höhe und Breite jeder Zeile: wenn möglich mit dem Formelsatz gemessen (Brüche, Wurzeln, Klammern wirklich so hoch,
  // wie sie gezeichnet werden), sonst geschätzt. Gemessen wird einmal bei Grösse 10 und dann linear skaliert.
  const meas = lines.map(l => {
    if (l === null) return null;
    if (typeof finRichSize === 'function') { try { const m = finRichSize(l.s, 10 * (l.size || 1), l.bold); if (isFinite(m.h) && m.h > 0 && isFinite(m.w)) return { a: m.a / 10, d: m.d / 10, w: m.w / 10, ok: true }; } catch (e) { /* Schätzung */ } }
    return { a: difRichH(l) * 0.62, d: difRichH(l) * 0.38, w: vis(l.s) * 0.5 * (l.size || 1), ok: false };
  });
  const gap = 0.42;                                                             // Abstand zwischen zwei Zeilen (in Schriftgrössen)
  const lineH = (m, f) => (m.ok ? Math.max((m.a + m.d + gap) * f, 1.55 * f) : (m.a + m.d) * f);
  const fit = (ms, w, h) => { let f = Math.min(C.fs * 1.12, o.max || 99); const nd = g => ms.reduce((a, m) => a + (m === null ? g * 0.6 : lineH(m, g)), 0), wd = g => ms.reduce((mx, m) => Math.max(mx, m === null ? 0 : m.w * g), 0); while (f > (o.min || 7.5) && (nd(f) > h || wd(f) > w)) f -= 0.5; return f; };
  let fs = fit(meas, r.w, r.h);
  // Zu klein, aber Platz in der Breite: in zwei Spalten setzen (geteilt nach Höhe, ohne ausgeblendete Leerzeilen am Spaltenanfang)
  if (!o.oneCol && o.al !== 'c' && lines.length >= 4 && fs < C.fs * 0.9) {
    const tot = meas.reduce((a, m) => a + (m === null ? 0.6 : m.a + m.d + 0.42), 0); let acc = 0, cut = 1;
    for (let i = 0; i < meas.length; i++) { acc += meas[i] === null ? 0.6 : meas[i].a + meas[i].d + 0.42; if (acc >= tot / 2) { cut = i + 1; break; } }
    cut = Math.max(1, Math.min(lines.length - 1, cut));
    const cw = (r.w - C.fs * 1.5) / 2, f2 = Math.min(fit(meas.slice(0, cut), cw, r.h), fit(meas.slice(cut), cw, r.h));
    if (f2 > fs + 0.5) {
      const o2 = Object.assign({}, o, { oneCol: true, max: f2, min: f2 });
      const y1 = difLines(S, { x: r.x, y: r.y, w: cw, h: r.h }, lines.slice(0, cut), C, o2);
      const y2 = difLines(S, { x: r.x + cw + C.fs * 1.5, y: r.y, w: cw, h: r.h }, lines.slice(cut).filter((l, i) => i > 0 || l !== null), C, o2);
      return Math.max(y1, y2);
    }
  }
  let y = r.y;
  lines.forEach((l, i) => {
    const m = meas[i];
    if (l === null) { y += fs * 0.6; return; }
    const hh = lineH(m, fs), x = o.al === 'c' ? r.x + r.w / 2 : r.x;
    if (m.ok) {
      // Grundlinie so setzen, dass die Zeile (Oberlänge bis Unterlänge) mittig in ihrem Platz steht
      const top = y + (hh - (m.a + m.d) * fs) / 2;
      S.rich(x, top, l.s, { size: fs * (l.size || 1), col: l.col || 'T', al: o.al === 'c' ? 'c' : 'l', bs: 't', bold: l.bold });
    } else S.rich(x, y + hh / 2, l.s, { size: fs * (l.size || 1), col: l.col || 'T', al: o.al === 'c' ? 'c' : 'l', bs: 'm', bold: l.bold });
    y += hh;
  });
  return y;
}
// Tabelle aus Rich-Zellen; cols: [{h, w}] (w in Schriftgrössen); hl: Zeile hervorheben.
// Jede Zeile ist so hoch wie ihr höchster Eintrag (Brüche, Wurzeln) – gemessen mit dem Formelsatz (finRichSize), mindestens 1.85·fs.
// Ein Eintrag, der breiter als seine Spalte ist, wird in der Schrift verkleinert (höchstens auf 60 %).
function difCellBox(s, size) {
  s = String(s === undefined || s === null ? '' : s);
  if (typeof finRichSize === 'function') { try { const m = finRichSize(s, 10); if (isFinite(m.h) && m.h > 0) return { w: m.w * size / 10, h: m.h * size / 10 }; } catch (e) { /* Schätzung */ } }
  const plain = s.replace(/\\col\{[a-z]\}|\\text|\\[a-zA-Z]+|[{}\\^_]/g, '');
  return { w: plain.length * 0.55 * size, h: (/\\frac|\\sqrt/.test(s) ? 2.3 : 1.15) * size };
}
function difTableRows(cols, rows, fs) {                               // Zeilenhöhen (Kopf zuerst) und Schriftgrössen der Zellen
  const one = (cells, base) => {
    const sizes = cols.map((c, j) => { const b = difCellBox(cells[j], base), avail = c.w * fs - fs * 0.35; return b.w > avail && b.w > 0 ? base * Math.max(0.6, avail / b.w) : base; });
    const h = cols.reduce((mx, c, j) => Math.max(mx, difCellBox(cells[j], sizes[j]).h + fs * 0.55), fs * 1.85);
    return { h, sizes };
  };
  return [one(cols.map(c => c.h), fs * 0.95)].concat(rows.map(r => one(r, fs * 0.92)));
}
// Gesamthöhe einer Tabelle bei Schriftgrösse fs (zum Einpassen)
function difTableH(cols, rows, fs) { return difTableRows(cols, rows, fs).reduce((a, r) => a + r.h, 0); }
function difTable(S, x, y, cols, rows, fs, hl, hlCol) {
  if (typeof stMark === 'function') stMark(x + 2, y + 2);
  const L = difTableRows(cols, rows, fs), tw = cols.reduce((a, c) => a + c.w * fs, 0), th = L.reduce((a, r) => a + r.h, 0);
  S.rect(x, y, tw, L[0].h, { fill: ST_B, a: 0.12 });
  let cx = x;
  cols.forEach((c, j) => { S.rich(cx + c.w * fs / 2, y + L[0].h / 2, c.h, { size: L[0].sizes[j], col: 'T', al: 'c', bs: 'm' }); cx += c.w * fs; });
  S.line(x, y + L[0].h, x + tw, y + L[0].h, { col: 'L', lw: 1.2 });
  let yy = y + L[0].h;
  rows.forEach((row, i) => {
    const rh = L[i + 1].h;
    if (hl === i) S.rect(x, yy, tw, rh, { fill: hlCol || ST_V, a: 0.16 });
    if (i > 0) S.line(x, yy, x + tw, yy, { col: 'G', lw: 1 });
    let c2 = x;
    cols.forEach((c, j) => { S.rich(c2 + c.w * fs / 2, yy + rh / 2, row[j], { size: L[i + 1].sizes[j], col: (row.col && row.col[j]) || 'T', al: 'c', bs: 'm' }); c2 += c.w * fs; });
    yy += rh;
  });
  S.rect(x, y, tw, th, { stroke: 'L', lw: 1 });
  return { w: tw, h: th };
}

// ═════════════ Sekante → Tangente ═════════════
const DIF_SCENES = {};
function difSceneTan(S, W, H, C) {
  const F = C.F, f = F.f(0), x0 = C.x0, h = C.h, fs = C.fs;
  const R = stLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: [1.45, 1.05] }]);
  const win = difWindow(C, f), m = difFrame(S, R[0], win, C, { title: 'f(x)', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  const T = Dif.dqTable(F, x0), f0 = T.f0;
  difCurve(S, m, f, { col: 'T', lw: 2.4, exp: C.exp });
  const ok = isFinite(f0);
  let tanOk = ok && (T.status === 'ok' || T.status === 'steep') && isFinite(T.fp);
  if (ok && C.show.tangent && tanOk) difLine(S, m, x0, f0, T.fp, { col: ST_G, lw: 2, a: 0.95 });
  const x1 = x0 + h, f1 = ok ? f(x1) : NaN, q = ok && Math.abs(h) > 1e-12 && isFinite(f1);
  if (q) {
    const sl = (f1 - f0) / h;
    difLine(S, m, x0, f0, sl, { col: ST_V, lw: 2.2 });
    if (C.show.triangle !== false) {
      difSeg(S, m, x0, f0, x1, f0, { col: ST_B, lw: 3 });
      difSeg(S, m, x1, f0, x1, f1, { col: ST_R, lw: 3 });
      const px = m.X(x1), py = m.Y(f1), p0 = m.X(x0), q0 = m.Y(f0);
      if (Math.abs(px - p0) > fs * 1.4) difLabel(S, m, (px + p0) / 2, q0 + (f1 >= f0 ? fs * 1.15 : -fs * 1.15), '\\col{b}{h}', C, { w: fs * 1.5 });
      if (Math.abs(py - q0) > fs * 1.8) difLabel(S, m, px + (px >= p0 ? 1 : -1) * fs * 1.7, (py + q0) / 2, '\\col{r}{\\Delta y}', C, { w: fs * 2.4 });
    }
  }
  // h = 0: Q fällt auf P (Q wird zuerst angeboten, damit man es wieder wegziehen kann)
  const meet = ok && h === 0;
  if (meet) {
    const Q = difDot(S, m, x0, f0, { fill: ST_V, stroke: 'T', r: 8 });
    if (Q) { S.pts.push({ id: 'Q', x: Q[0], y: Q[1], r: 10 }); }
  }
  if (ok) {
    const P = difDot(S, m, x0, f0, { fill: 'T', r: meet ? 3.6 : 5.2 });
    if (P) { if (!meet) S.pts.push({ id: 'P', x: P[0], y: P[1], r: 10 }); difLabel(S, m, P[0], P[1] - fs * (meet ? 1.5 : 1.1), meet ? 'P=Q' : 'P', C, { w: fs * (meet ? 2.6 : 1.5), dx: -fs * 0.4 }); }
  }
  if (q) {
    const Q = difDot(S, m, x1, f1, { fill: ST_V, stroke: 'T', r: 5.2 });
    if (Q) { S.pts.push({ id: 'Q', x: Q[0], y: Q[1], r: 10 }); difLabel(S, m, Q[0], Q[1] - fs * 1.1, 'Q', C, { w: fs * 1.5, dx: fs * 0.4 }); }
  }
  if (!ok) { S.rich(m.L + (m.R - m.L) / 2, m.T + (m.B - m.T) / 2, '\\text{An dieser Stelle ist f nicht definiert.}', { size: fs, col: ST_R, al: 'c', bs: 'm' }); }
  // Tabellen h → 0 von rechts und links
  const tr = R[1], lines = [];
  const cols = [{ h: 'h', w: 3.6 }, { h: 'f(x_0+h)', w: 5.0 }, { h: '\\col{v}{m_s}', w: 4.4 }];
  if (ok && T.status !== 'undef' || ok) {
    const tfs = Math.max(7.5, Math.min(fs, (tr.w - 10) / (2 * 13.0 + 1), (tr.h - fs * 2.6) / (1.85 * (T.right.length + 2))));
    const gap = tfs * 1.0, tw = 13.0 * tfs, x00 = tr.x + Math.max(0, (tr.w - (2 * tw + gap)) / 2), yT = tr.y + tfs * 2.0;
    S.rich(x00 + tw / 2, tr.y + tfs * 0.9, '\\text{von rechts, }h>0', { size: tfs, col: 'T', al: 'c', bs: 'm' });
    S.rich(x00 + tw + gap + tw / 2, tr.y + tfs * 0.9, '\\text{von links, }h<0', { size: tfs, col: 'T', al: 'c', bs: 'm' });
    const nd = v => (isFinite(v) ? difNum(v, 4) : '\\text{n.d.}'), row = d => [difNum(d.h, 4), nd(d.y), nd(d.dq)];
    const hlR = T.right.findIndex(d => Math.abs(d.h - h) < 1e-12), hlL = T.left.findIndex(d => Math.abs(d.h - h) < 1e-12);
    const tabR = difTable(S, x00, yT, cols, T.right.map(row), tfs, hlR), tabL = difTable(S, x00 + tw + gap, yT, cols, T.left.map(row), tfs, hlL);
    const lim = (v, side) => (isFinite(v) ? 'm_s\\to ' + difNum(v, 3) : '\\text{kein Grenzwert}');
    const yL = yT + tabR.h + tfs * 0.9;
    S.rich(x00 + tw / 2, yL, '\\text{Grenzwert für}\\ h\\to 0\\text{:}\\ \\col{v}{' + lim(T.limR) + '}', { size: tfs, col: 'T', al: 'c', bs: 'm' });
    S.rich(x00 + tw + gap + tw / 2, yL, '\\text{Grenzwert für}\\ h\\to 0\\text{:}\\ \\col{v}{' + lim(T.limL) + '}', { size: tfs, col: 'T', al: 'c', bs: 'm' });
  }
  // Formeln und Schlussfolgerung
  const br = R[2], sym = '\\col{v}{m_s}=\\frac{\\col{r}{\\Delta y}}{\\col{b}{h}}=\\frac{f(x_0+h)-f(x_0)}{h}';
  lines.push({ s: sym });
  if (meet && tanOk) lines.push({ s: '\\col{b}{h=0}:\\ \\ \\col{v}{m_s}=\\col{g}{' + difNum(T.fp, 4) + '}' });
  if (q) {
    const dy = f1 - f0;
    lines.push({ s: '\\col{b}{h=' + difNum(h, 4) + '}:\\ \\ \\frac{\\col{r}{' + difNum(dy, 4) + '}}{\\col{b}{' + difNum(h, 4) + '}}=\\col{v}{' + difNum(dy / h, 4) + '}' });
  }
  lines.push(null);
  if (ok) {
    if (T.status === 'kink') {
      lines.push({ s: '\\text{Die Grenzwerte von links und rechts sind verschieden:}', col: ST_R });
      lines.push({ s: '\\text{An dieser Stelle ist f nicht differenzierbar (Knick).}', col: ST_R });
    } else if (T.status === 'undef') {
      lines.push({ s: '\\text{Hier gibt es keine endliche Steigung.}', col: ST_R });
    } else if (T.status === 'steep') {
      lines.push({ s: '\\text{Die Steigung wird beliebig gross:}', col: ST_R });
      lines.push({ s: '\\text{Senkrechte Tangente: f ist nicht differenzierbar.}', col: ST_R });
    } else {
      lines.push({ s: '\\text{Beide Grenzwerte sind gleich:}' });
      lines.push({ s: "f'(x_0)=\\col{g}{" + difNum(T.fp, 4) + '}\\ \\ \\text{(Steigung der Tangente)}' });
    }
  }
  difLines(S, br, lines, C, { max: fs * 1.25 });
}
DIF_SCENES.tan = difSceneTan;

// ═════════════ Graphisches Ableiten ═════════════
function difMonoColor(F, mode) {
  if (!mode || mode === 'none') return null;
  const g = F.f(mode === 'curv' ? 2 : 1);
  return x => { const v = g(x); return !isFinite(v) ? 'T' : mode === 'curv' ? (v > 1e-9 ? ST_B : v < -1e-9 ? ST_O : 'T') : (v > 1e-9 ? DIF_UP : v < -1e-9 ? DIF_DOWN : 'T'); };
}
function difSceneGr(S, W, H, C) {
  const F = C.F, f = F.f(0), d1 = F.f(1), x0 = C.x0, fs = C.fs;
  const R = stLayout(W, H, [{ w: 1, rows: [1.25, 1] }]);
  const win = difWindow(C, f), fp0 = d1(x0), f00 = f(x0);
  const ok = isFinite(f00), okd = isFinite(fp0);
  const word = !okd ? '' : fp0 > 1e-9 ? '\\col{g}{\\text{steigt}}' : fp0 < -1e-9 ? '\\col{o}{\\text{fällt}}' : '\\text{waagrecht}';
  const m1 = difFrame(S, R[0], win, C, { title: 'f(x)', info: ok && okd ? "f'(x_0)=" + difNum(fp0, 3) + '\\ \\ ' + word : '', xlab: 'x', ylab: 'y' });
  const ya = difAutoY(d1, win.x0, win.x1), w2 = { x0: win.x0, x1: win.x1, y0: ya[0], y1: ya[1] };
  const m2 = difFrame(S, R[1], w2, C, { title: "f'(x)", info: C.show.hidefp ? '\\text{Skizziere die Ableitung selbst.}' : '', xlab: 'x', ylab: "y" });
  S.maps.main = m1; S.maps.sub = m2;
  // Stellen mit f' = 0
  if (C.show.crit && C.K) {
    C.K.crit.concat([]).forEach(c => { if (c.x > win.x0 && c.x < win.x1) { [m1, m2].forEach(mm => S.line(mm.X(c.x), mm.T, mm.X(c.x), mm.B, { col: ST_V, lw: 1.2, dash: true, a: 0.8 })); } });
  }
  difCurve(S, m1, f, { col: 'T', lw: 2.4, colorAt: difMonoColor(F, C.show.color || 'mono'), exp: C.exp });
  if (!C.show.hidefp) difCurve(S, m2, d1, { col: ST_R, lw: 2.4, exp: C.exp });
  else (C.trace || []).forEach(tx => { const y = d1(tx); if (isFinite(y)) difDot(S, m2, tx, y, { fill: ST_R, r: 2.6, a: 0.8 }); });
  if (ok) {
    if (C.show.tangent !== false && okd) difLine(S, m1, x0, f00, fp0, { col: ST_G, lw: 2 });
    const px = m1.X(x0);
    if (isFinite(px) && px >= m1.L && px <= m1.R) {
      S.line(px, m1.Y(f00), px, m2.B, { col: 'M', lw: 1, dash: true, a: 0.9 });
      const P = difDot(S, m1, x0, f00, { fill: 'T', r: 5.2 });
      if (P) S.pts.push({ id: 'x0', x: P[0], y: P[1], r: 11 });
      if (okd) {
        const Q = difDot(S, m2, x0, fp0, { fill: ST_R, stroke: 'T', r: 5.6 });
        if (Q) { S.pts.push({ id: 'x0', x: Q[0], y: Q[1], r: 11 }); S.line(m2.L, Q[1], Q[0], Q[1], { col: ST_R, lw: 1, dash: true, a: 0.7 }); difLabel(S, m2, m2.L - fs * 0.0, Q[1] - fs * 0.0, '', C); }
      }
    }
  }
}
DIF_SCENES.gr = difSceneGr;

// ═════════════ Ableiten mit Regeln ═════════════
function difSceneRg(S, W, H, C) {
  const F = C.F, f = F.f(0), d1 = F.f(1), x0 = C.x0, fs = C.fs;
  const R = stLayout(W, H, [{ w: 0.6, rows: [1.7] }, { w: 0.4, rows: [1] }]);
  const win = difWindow(C, f), m = difFrame(S, R[0], win, C, { title: 'f(x)', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (C.show.deriv) difCurve(S, m, d1, { col: ST_R, lw: 1.8, dash: true, a: 0.9, exp: C.exp });
  difCurve(S, m, f, { col: 'T', lw: 2.4, exp: C.exp });
  const y0 = f(x0), k = d1(x0), ok = isFinite(y0), okd = isFinite(k);
  if (ok && okd) {
    difLine(S, m, x0, y0, k, { col: ST_G, lw: 2 });
    if (C.show.normal && Math.abs(k) > 1e-9) difLine(S, m, x0, y0, -1 / k, { col: ST_O, lw: 2 });
    else if (C.show.normal) { const px = m.X(x0); S.line(px, m.T, px, m.B, { col: ST_O, lw: 2 }); }
  }
  if (ok) { const P = difDot(S, m, x0, y0, { fill: 'T', r: 5.2 }); if (P) { S.pts.push({ id: 'x0', x: P[0], y: P[1], r: 11 }); difLabel(S, m, P[0], P[1] - fs * 1.1, 'P', C, { w: fs * 1.5, dx: -fs * 0.4 }); } }
  // Zusammenfassung rechts
  const L = [];
  const tex = a => (a ? Dif.tx(a) : '?');
  L.push({ s: 'f(x)=' + tex(F.ast), size: 1 });
  const dd = F.deriv(1); L.push({ s: "f'(x)=" + tex(dd), col: ST_R });
  L.push(null);
  if (ok && okd) {
    const q = y0 - k * x0, lin = (a, b) => (Math.abs(a) < 1e-12 ? difNum(b, 3) : (Math.abs(a - 1) < 1e-12 ? '' : Math.abs(a + 1) < 1e-12 ? '-' : difNum(a, 3)) + 'x' + (Math.abs(b) < 1e-12 ? '' : (b > 0 ? '+' : '-') + difNum(Math.abs(b), 3)));
    L.push({ s: 'P(' + difNum(x0, 3) + '\\,|\\,' + difNum(y0, 3) + ')' });
    L.push({ s: "m_t=f'(" + difNum(x0, 3) + ')=\\col{g}{' + difNum(k, 4) + '}' });
    L.push({ s: '\\col{g}{t\\colon\\ y=' + lin(k, q) + '}' });
    if (C.show.normal) {
      if (Math.abs(k) > 1e-9) { const mn = -1 / k; L.push({ s: '\\col{o}{n\\colon\\ y=' + lin(mn, y0 - mn * x0) + '}' }); } else L.push({ s: '\\col{o}{n\\colon\\ x=' + difNum(x0, 3) + '}' });
    }
  } else L.push({ s: '\\text{An dieser Stelle gibt es keine Tangente.}', col: ST_R });
  difLines(S, R[1], L, C, { max: fs * 1.3 });
}
DIF_SCENES.rg = difSceneRg;

// ═════════════ Kurvendiskussion ═════════════
function difSceneKd(S, W, H, C) {
  const F = C.F, f = F.f(0), K = C.K, fs = C.fs;
  const R = stLayout(W, H, [{ w: 0.62, rows: [1.8] }, { w: 0.38, rows: [1] }]);
  const win = difWindow(C, f), m = difFrame(S, R[0], win, C, { title: 'f(x)', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (C.show.d2) difCurve(S, m, F.f(2), { col: ST_V, lw: 1.8, dash: true, exp: C.exp });
  if (C.show.d1) difCurve(S, m, F.f(1), { col: ST_R, lw: 1.8, dash: true, exp: C.exp });
  difCurve(S, m, f, { col: 'T', lw: 2.4, colorAt: difMonoColor(F, C.show.color), exp: C.exp });
  const P = [];                                                   // Punkte: {x, y, kind, label}
  if (K) {
    const pt = (c, nm) => (nm + '(' + c.xTex + '\\,|\\,' + c.yTex + ')');
    K.zeros.forEach((z, i) => { const x = z.val !== undefined ? z.val : z.x; if (isFinite(x)) P.push({ x, y: 0, k: 'N', s: 'N' + (K.zeros.length > 1 ? '_{' + (i + 1) + '}' : '') + '(' + z.tex + '\\,|\\,0)' }); });
    K.crit.forEach(c => P.push({ x: c.x, y: c.y, k: c.type, s: pt(c, Dif.TYPE[c.type][0]) }));
    K.infl.forEach(c => P.push({ x: c.x, y: c.y, k: 'W', s: pt(c, c.saddle ? 'S' : 'W') }));
    const y00 = f(0); if (isFinite(y00) && !K.zeros.some(z => Math.abs((z.val !== undefined ? z.val : z.x)) < 1e-9)) P.push({ x: 0, y: y00, k: 'Y', s: 'S_y(0\\,|\\,' + difNum(y00, 3) + ')' });
  }
  const COL = { N: ST_B, max: ST_R, min: ST_G, saddle: ST_V, W: ST_O, Y: 'M' };
  // Zusammenfallende Punkte (z. B. Nullstelle und Tiefpunkt im Ursprung) nur einmal beschriften: die wichtigere Art gewinnt
  const rank = { max: 0, min: 0, saddle: 1, W: 2, N: 3, Y: 4 };
  const keep = P.filter((p, i) => !P.some((q, j) => j !== i && Math.abs(q.x - p.x) < 1e-9 && Math.abs(q.y - p.y) < 1e-9 && (rank[q.k] < rank[p.k] || (rank[q.k] === rank[p.k] && j < i))));
  const few = keep.length <= 12, placed = [];
  keep.forEach(p => {
    if (!(p.x >= win.x0 && p.x <= win.x1 && p.y >= win.y0 && p.y <= win.y1)) return;
    const c = COL[p.k], d = difDot(S, m, p.x, p.y, { fill: c, stroke: 'T', r: 4.6, lw: 1.2 });
    if (!(d && few)) return;
    const up = p.k !== 'min' && p.k !== 'N', w = p.s.replace(/\\[a-z]+|[{}\\]/g, '').length * 0.5 * fs * 0.85 + fs;
    let dy = up ? -fs * 1.25 : fs * 1.35;
    for (let t = 0; t < 4; t++) {
      const cx = Math.min(m.R - w / 2, Math.max(m.L + w / 2, d[0])), cy = d[1] + dy;
      if (!placed.some(b => Math.abs(b.x - cx) < (b.w + w) / 2 && Math.abs(b.y - cy) < fs * 1.2)) { placed.push({ x: cx, y: cy, w }); break; }
      dy += up ? -fs * 1.25 : fs * 1.25;
    }
    difLabel(S, m, d[0], d[1] + dy, p.s, C, { w, size: 0.85, col: 'T' });
  });
  // Ergebnisse rechts
  const L = [];
  if (!K) L.push({ s: '\\text{Keine Analyse möglich.}', col: ST_R });
  else {
    const sy = { even: '\\text{achsensymmetrisch zur y-Achse}', odd: '\\text{punktsymmetrisch zum Ursprung}', none: '\\text{keine einfache Symmetrie}' }[K.sym];
    L.push({ s: sy, size: 0.95 });
    const list = (nm, a, tf) => { L.push({ s: nm, bold: true, size: 0.95 }); if (!a.length) L.push({ s: '\\text{keine}', col: 'M', size: 0.9 }); a.slice(0, 6).forEach(q => L.push({ s: tf(q), size: 0.95 })); if (a.length > 6) L.push({ s: '\\ldots', col: 'M' }); };
    L.push(null);
    list('\\text{Nullstellen}', K.zeros, z => 'x=' + z.tex);
    L.push(null);
    list('\\text{Extrempunkte}', K.crit, c => Dif.TYPE[c.type][0] + '(' + c.xTex + '\\,|\\,' + c.yTex + ')');
    L.push(null);
    list('\\text{Wendepunkte}', K.infl, c => (c.saddle ? 'S' : 'W') + '(' + c.xTex + '\\,|\\,' + c.yTex + ')');
    if (!K.poly) { L.push(null); L.push({ s: '\\text{Näherungswerte im sichtbaren Bereich.}', col: 'M', size: 0.85 }); }
  }
  difLines(S, R[1], L, C, { max: fs * 1.2 });
}
DIF_SCENES.kd = difSceneKd;

function difBuildScene(W, H, C) {
  const S = difScene(), fn = DIF_SCENES[C.view];
  if (fn && C.F) fn(S, W, H, C);
  return S;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { difBuildScene, DIF_SCENES, difAutoY, difClip, difCurve, difFrame, difScene };
