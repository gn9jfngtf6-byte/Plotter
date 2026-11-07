// ═══════════════════════════════════════════════════════════════════
// 41_stat_draw.js — Wahrscheinlichkeit und Statistik: Bilder (Szenen)
//
// Jedes Experiment baut aus seinen Daten eine «Szene» (Liste einfacher Zeichenteile:
// Rechteck, Linie, Kreis, Vieleck, Text). Dieselbe Szene wird auf den Canvas gemalt
// (42_stat_ui.js) und als TikZ ausgegeben. Farben: ALG_HUES (34_alg_ui.js) oder
// die Platzhalter 'T' Text, 'M' gedämpft, 'G' Gitter, 'L' Achse.
// ═══════════════════════════════════════════════════════════════════
const ST_B = '#378ADD', ST_G = '#2fa36b', ST_O = '#f08a24', ST_V = '#8a5cd0', ST_R = '#d9486b', ST_T = '#13a5a5';

function stScene() {
  const p = [];
  const add = (t, o) => { p.push(Object.assign({ t }, o)); };
  return {
    p,
    rect(x, y, w, h, o) { add('rect', Object.assign({ x, y, w, h }, o || {})); },
    line(x1, y1, x2, y2, o) { add('line', Object.assign({ x1, y1, x2, y2 }, o || {})); },
    circ(x, y, r, o) { add('circ', Object.assign({ x, y, r }, o || {})); },
    poly(pts, o) { add('poly', Object.assign({ pts }, o || {})); },
    text(x, y, s, o) { add('text', Object.assign({ x, y, s: String(s) }, o || {})); },
    rich(x, y, s, o) { add('text', Object.assign({ x, y, s: String(s), rich: true }, o || {})); }
  };
}
// ── Zuschneiden auf Graphenfenster ──
// difFrame (61_dif_draw.js) meldet jedes Fenster in S.frames an ([L, T, R, B] in Pixeln). Flächen, Linien und Kreise,
// die in ein Fenster hineinragen, werden beim Zeichnen (statPaint) und im LaTeX-Export (stSceneTex) auf dieses Fenster
// zugeschnitten, damit Dreiecke, Rechtecke der Riemann-Summe, Winkelbögen usw. beim Verschieben und Zoomen nicht über
// den Rand hinaus gezeichnet werden. Texte bleiben unberührt (Beschriftungen werden ohnehin im Fenster gehalten);
// Elemente ganz ausserhalb (Tabellen, Achsenstriche) ebenfalls. p.noclip schaltet das für ein Element ab.
function stItemBox(p) {
  if (p.t === 'line') return [Math.min(p.x1, p.x2), Math.min(p.y1, p.y2), Math.max(p.x1, p.x2), Math.max(p.y1, p.y2)];
  if (p.t === 'rect') return [Math.min(p.x, p.x + p.w), Math.min(p.y, p.y + p.h), Math.max(p.x, p.x + p.w), Math.max(p.y, p.y + p.h)];
  if (p.t === 'circ') return [p.x - p.r, p.y - p.r, p.x + p.r, p.y + p.r];
  if (p.t === 'poly' && p.pts && p.pts.length) { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; p.pts.forEach(q => { if (q[0] < a) a = q[0]; if (q[0] > c) c = q[0]; if (q[1] < b) b = q[1]; if (q[1] > d) d = q[1]; }); return [a, b, c, d]; }
  return null;
}
function stAutoClip(S) {
  if (!S || !S.frames || !S.frames.length || S._clipped) return;
  S._clipped = true;
  const M = 1.5;                                                                // Rand, damit Rahmenlinie und Punkte am Rand ganz sichtbar bleiben
  // f = [L, T, R, B, x0, y0, x1, y1]: Zeichenfläche und ganze Layout-Zelle des Fensters (mit Achsenbeschriftung)
  const inCell = (b, f) => Math.min(b[2], f[6]) - Math.max(b[0], f[4]) >= 0 && Math.min(b[3], f[7]) - Math.max(b[1], f[5]) >= 0;
  const inPlot = (b, f, t) => b[0] >= f[0] - t && b[2] <= f[2] + t && b[1] >= f[1] - t && b[3] <= f[3] + t;
  S.p.forEach(p => {
    if (p.clip || p.noclip || p.t === 'text') return;
    const b = stItemBox(p); if (!b || !b.every(isFinite)) return;
    const hit = S.frames.filter(f => inCell(b, f));
    if (!hit.length) return;                                                    // gehört zu keinem Fenster (Tabelle, Text-Spalte …)
    if (p.t === 'circ' && p.r < 14 && hit.some(f => p.x >= f[0] - 2 && p.x <= f[2] + 2 && p.y >= f[1] - 2 && p.y <= f[3] + 2)) return;   // Punkte am Rand ganz zeigen
    if (hit.length === 1 && inPlot(b, hit[0], p.t === 'line' ? 4 : 0.5)) return;   // liegt drin (Achsenstriche ragen 3 px hinaus)
    p.clip = hit.map(f => [f[0] - M, f[1] - M, f[2] - f[0] + 2 * M, f[3] - f[1] + 2 * M]);
  });
}
// Schriftgrösse der Bilder: normal 11–17 px nach Fläche; im Beamer-Modus grösser, aber mit der Fläche begrenzt
// (früher fest 2.2×: Tabellen und Beschriftungen frassen dann das Bild auf)
function stSceneFs(W, H, div) {
  const b = Math.max(11, Math.min(17, Math.round(Math.min(W, H) / (div || 46))));
  return (typeof beamMode !== 'undefined' && beamMode) ? Math.round(Math.max(b * 1.4, Math.min(26, Math.min(W, H) / 34))) : b;
}
// Breite der Rechenweg-Karte rechts (im Beamer-Modus breiter, weil die Schrift grösser ist)
function stCardW(w, f) { const bm = typeof beamMode !== 'undefined' && beamMode; return Math.round(Math.min(bm ? 600 : 480, Math.max(bm ? 420 : 330, w * (bm ? 0.38 : (f || 0.36))))); }
// Zoomen mit Rad oder Trackpad: sanft und proportional zur Bewegung (wie im Hauptfenster, höchstens 6 % pro Ereignis)
function stWheelF(e) { const raw = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaMode === 2 ? e.deltaY * 300 : e.deltaY; return 1 + Math.sign(raw) * Math.min(Math.abs(raw) / 800, 0.06); }
const stClipRects = c => (c && c.length && typeof c[0] === 'number' ? [c] : c || []);
const stFmt = (v, d) => Stat.fmt(v, d);
const stPct = v => Stat.fmt(v * 100, 1) + ' %';
const stFrac = (a, b) => a + '/' + b;

// ── Aufteilung der Fläche: Spalten mit Zeilen (breit) bzw. alles untereinander (schmal) ──
// ── Grosses Bild, wenn die Rechenweg-Karte rechts offen ist ──
// Der Rechenweg steht dann schon in der Karte; Zellen, die nur Text enthalten (Formelzeilen neben dem Graphen), wären doppelt.
// stSoloBuild baut die Szene zuerst probeweise und merkt sich, welche Layout-Zellen ein Graphenfenster (difFrame), eine Tabelle
// (difTable) oder ausdrücklich Behaltenes (stKeep) enthalten; danach wird nur mit diesen Zellen gebaut – sie teilen sich die ganze
// Fläche. Die übrigen Zellen landen ausserhalb des Bildes (unsichtbar). Ohne Karte und im LaTeX-Export bleibt alles wie gehabt.
const STLAY = { mode: null, cells: null, marks: null, fmarks: null, keep: null, fr: null, used: false, cache: {} };
function stMark(x, y) {
  if (STLAY.mode !== 'probe' || !STLAY.cells) return;
  STLAY.cells.forEach((c, i) => { if (x >= c.x - 1 && x <= c.x + c.w + 1 && y >= c.y - 1 && y <= c.y + c.h + 1) STLAY.marks.add(i); });
}
const stKeep = r => { if (r) stMark(r.x + r.w / 2, r.y + r.h / 2); };
function stKeepFrame(r) {                                                     // Zelle mit Graphenfenster
  if (!r || STLAY.mode !== 'probe' || !STLAY.cells) return;
  const x = r.x + r.w / 2, y = r.y + r.h / 2;
  STLAY.cells.forEach((c, i) => { if (x >= c.x - 1 && x <= c.x + c.w + 1 && y >= c.y - 1 && y <= c.y + c.h + 1) { STLAY.marks.add(i); STLAY.fmarks.add(i); } });
}
function stSoloBuild(build, W, H, C, key, solo) {
  if (!solo || C.exp) return build(W, H, C);
  const ck = key + '|' + (W >= 820 ? 'w' : 'n');
  let keep = STLAY.cache[ck];
  if (!keep) {
    STLAY.mode = 'probe'; STLAY.cells = null; STLAY.marks = new Set(); STLAY.fmarks = new Set();
    try { build(W, H, Object.assign({}, C, { smooth: false, probe: true })); } catch (e) { /* dann eben alles */ } finally { STLAY.mode = null; }
    keep = STLAY.cells && STLAY.marks.size && STLAY.marks.size < STLAY.cells.length ? { k: Array.from(STLAY.marks), f: Array.from(STLAY.fmarks) } : 'all';
    STLAY.cache[ck] = keep;
  }
  if (keep === 'all') return build(W, H, C);
  STLAY.mode = 'keep'; STLAY.keep = new Set(keep.k); STLAY.fr = new Set(keep.f); STLAY.used = false;
  try { return build(W, H, C); } finally { STLAY.mode = null; STLAY.keep = null; }
}
function stLayout(W, H, spec) {
  if (STLAY.mode === 'probe' && !STLAY.cells) { const out = stLayout0(W, H, spec); STLAY.cells = out; return out; }
  if (STLAY.mode === 'keep' && !STLAY.used) {
    STLAY.used = true;
    let k = 0; const map = [];
    // Spalten ohne Graphenfenster (nur Tabelle) werden schmaler, damit das Bild möglichst gross wird
    const spec2 = spec.map(c => { const rows = []; let fr = false; c.rows.forEach(rw => { if (STLAY.keep.has(k)) { rows.push(rw); map.push(k); if (STLAY.fr.has(k)) fr = true; } k++; }); return { w: c.w * (fr || !STLAY.fr.size ? 1 : 0.8), rows }; }).filter(c => c.rows.length);
    if (!spec2.length || map.length === k) return stLayout0(W, H, spec);
    const sw = spec2.reduce((a, c) => a + c.w, 0); spec2.forEach(c => { c.w /= sw; });
    const got = stLayout0(W, H, spec2), out = [];
    for (let i = 0; i < k; i++) out.push({ x: -1e5, y: -1e5, w: W * 0.4, h: H * 0.4, off: true });
    map.forEach((idx, j) => { out[idx] = got[j]; });
    return out;
  }
  return stLayout0(W, H, spec);
}
function stLayout0(W, H, spec) {
  const pad = Math.round(Math.min(W, H) * 0.02) + 6, out = [];
  if (W >= 820) {
    const avail = W - pad * (spec.length + 1); let x = pad;
    spec.forEach(c => {
      const cw = avail * c.w, hh = H - pad * (c.rows.length + 1), sum = c.rows.reduce((a, b) => a + b, 0); let y = pad;
      c.rows.forEach(rw => { const rh = hh * rw / sum; out.push({ x, y, w: cw, h: rh }); y += rh + pad; });
      x += cw + pad;
    });
  } else {
    const all = []; spec.forEach(c => c.rows.forEach(rw => all.push(rw)));
    const sum = all.reduce((a, b) => a + b, 0), hh = H - pad * (all.length + 1); let y = pad;
    all.forEach(rw => { const rh = hh * rw / sum; out.push({ x: pad, y, w: W - 2 * pad, h: rh }); y += rh + pad; });
  }
  return out;
}

// ── Achsenstriche ──
function stTicks(max, n) {
  const st = Stat.niceStep(max, n || 5), t = [];
  for (let k = 0; k * st <= max + st * 1e-6; k++) t.push(Math.round(k * st * 1e9) / 1e9);
  return { st, t };
}
const stTickLabel = (v, st) => { const d = st >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(st) - 1e-9)); return String(Math.round(v * Math.pow(10, d)) / Math.pow(10, d)); };

// ── Säulendiagramm ──
// bars: [{label, v, col}]; o: {title, ymax, yfmt, theory:[…], theoryLabel, hline:{v,label,col}, vals:bool, xlabel, yPct}
function stBarChart(S, r, bars, o, C) {
  o = o || {}; const fs = C.fs;
  const left = fs * 3.4, right = fs * 0.8, top = o.title ? fs * 1.9 : fs * 0.7, bottom = fs * (o.xlabel ? 3.4 : 2.2);
  const px = r.x + left, py = r.y + top, pw = Math.max(10, r.w - left - right), ph = Math.max(10, r.h - top - bottom);
  let mx = 0; bars.forEach(b => { mx = Math.max(mx, b.v || 0); }); (o.theory || []).forEach(v => { mx = Math.max(mx, v); }); if (o.hline) mx = Math.max(mx, o.hline.v);
  mx = Math.max(o.ymax || 0, mx * 1.12, 1e-9);
  const tk = stTicks(mx, 4), ymax = Math.max(mx, tk.t[tk.t.length - 1]);
  const Y = v => py + ph - v / ymax * ph;
  if (o.title) S.text(r.x + r.w / 2, r.y + fs * 0.9, o.title, { size: fs * 0.95, col: 'T', al: 'c', bold: true });
  tk.t.forEach(v => {
    S.line(px, Y(v), px + pw, Y(v), { col: 'G', lw: 1 });
    S.text(px - fs * 0.4, Y(v), o.yfmt ? o.yfmt(v) : stTickLabel(v, tk.st), { size: fs * 0.8, col: 'M', al: 'r', bs: 'm' });
  });
  const nb = bars.length, slot = pw / nb, bw = slot * 0.74;
  bars.forEach((b, i) => {
    const xc = px + slot * (i + 0.5), h = Math.max(0, (b.v || 0) / ymax * ph);
    if (h > 0) S.rect(xc - bw / 2, py + ph - h, bw, h, { fill: b.col || ST_B, a: 0.85 });
    if (o.vals && b.v > 0 && slot > fs * 2.6) S.text(xc, Y(b.v) - fs * 0.35, o.vfmt ? o.vfmt(b.v) : stFmt(b.v, 3), { size: fs * 0.7, col: 'M', al: 'c', bs: 'b' });
    const skip = Math.ceil(fs * 1.9 / slot);
    if (b.label !== undefined && b.label !== '' && i % skip === 0) S.text(xc, py + ph + fs * 0.8, b.label, { size: fs * 0.82, col: 'M', al: 'c', bs: 't' });
  });
  (o.theory || []).forEach((v, i) => { const xc = px + slot * (i + 0.5); S.line(xc - bw / 2 - 2, Y(v), xc + bw / 2 + 2, Y(v), { col: ST_R, lw: 2.2 }); });
  if (o.hline) { S.line(px, Y(o.hline.v), px + pw, Y(o.hline.v), { col: o.hline.col || ST_R, lw: 1.6, dash: true }); if (o.hline.label) S.text(px + pw, Y(o.hline.v) - fs * 0.3, o.hline.label, { size: fs * 0.8, col: o.hline.col || ST_R, al: 'r', bs: 'b' }); }
  S.line(px, py + ph, px + pw, py + ph, { col: 'L', lw: 1.4 });
  if (o.theory && o.theory.length && o.theoryLabel) S.text(px + pw, r.y + (o.title ? fs * 0.9 : fs * 0.6) + (o.title ? fs * 1.2 : 0), o.theoryLabel, { size: fs * 0.8, col: ST_R, al: 'r', bs: 'm' });
  if (o.xlabel) S.text(px + pw / 2, r.y + r.h - fs * 0.5, o.xlabel, { size: fs * 0.85, col: 'M', al: 'c', bs: 'b' });
  return { px, py, pw, ph, ymax, X: i => px + slot * (i + 0.5), Y, slot };
}

// ── Liniendiagramm (x logarithmisch oder linear) ──
// series: [{pts:[[x,y]], col, lw}]; o: {title, xlog, xmin, xmax, ymin, ymax, hlines:[{v,label,col}], xlabel, marks:[{x,y,col}], vlines}
function stLineChart(S, r, series, o, C) {
  o = o || {}; const fs = C.fs;
  const left = fs * 3.4, right = fs * 1.2, top = o.title ? fs * 1.9 : fs * 0.7, bottom = fs * (o.xlabel ? 3.4 : 2.2);
  const px = r.x + left, py = r.y + top, pw = Math.max(10, r.w - left - right), ph = Math.max(10, r.h - top - bottom);
  let xmin = o.xmin !== undefined ? o.xmin : 1, xmax = o.xmax !== undefined ? o.xmax : 10;
  if (o.xlog) { xmin = Math.max(1, xmin); xmax = Math.max(xmax, xmin * 10); xmax = Math.pow(10, Math.ceil(Math.log10(xmax) - 1e-9)); }
  let ymin = o.ymin !== undefined ? o.ymin : 0, ymax = o.ymax;
  if (ymax === undefined) { ymax = 0; series.forEach(s => s.pts.forEach(p => { if (p[1] !== null) ymax = Math.max(ymax, p[1]); })); (o.hlines || []).forEach(h => { ymax = Math.max(ymax, h.v); }); ymax *= 1.15; }
  if (!(ymax > ymin)) ymax = ymin + 1;
  const tk = stTicks(ymax - ymin, 4), yt = tk.t.map(v => ymin + v).filter(v => v <= ymax + 1e-9);
  const lg = v => Math.log10(Math.max(v, 1e-9));
  const X = x => px + (o.xlog ? (lg(x) - lg(xmin)) / (lg(xmax) - lg(xmin)) : (x - xmin) / (xmax - xmin)) * pw;
  const Y = y => py + ph - (Math.max(ymin, Math.min(ymax, y)) - ymin) / (ymax - ymin) * ph;
  if (o.title) S.text(r.x + r.w / 2, r.y + fs * 0.9, o.title, { size: fs * 0.95, col: 'T', al: 'c', bold: true });
  yt.forEach(v => { S.line(px, Y(v), px + pw, Y(v), { col: 'G', lw: 1 }); S.text(px - fs * 0.4, Y(v), o.yfmt ? o.yfmt(v) : stTickLabel(v, tk.st), { size: fs * 0.8, col: 'M', al: 'r', bs: 'm' }); });
  if (o.xlog) { for (let e = Math.round(lg(xmin)); e <= Math.round(lg(xmax)); e++) { const v = Math.pow(10, e), x = X(v); S.line(x, py, x, py + ph, { col: 'G', lw: 1 }); S.text(x, py + ph + fs * 0.8, String(v), { size: fs * 0.8, col: 'M', al: 'c', bs: 't' }); } }
  else { const t2 = stTicks(xmax - xmin, 5); t2.t.forEach(v => { const x = X(xmin + v); S.line(x, py, x, py + ph, { col: 'G', lw: 1 }); S.text(x, py + ph + fs * 0.8, stTickLabel(xmin + v, t2.st), { size: fs * 0.8, col: 'M', al: 'c', bs: 't' }); }); }
  (o.hlines || []).forEach(h => { S.line(px, Y(h.v), px + pw, Y(h.v), { col: h.col || ST_R, lw: 1.6, dash: true }); if (h.label) S.text(px + pw, Y(h.v) - fs * 0.3, h.label, { size: fs * 0.8, col: h.col || ST_R, al: 'r', bs: 'b' }); });
  series.forEach(s => {
    const pts = s.pts.filter(p => p[1] !== null && p[1] !== undefined && p[0] >= xmin - 1e-9).map(p => [X(Math.min(p[0], xmax)), Y(p[1])]);
    if (pts.length > 1) S.poly(pts, { col: s.col || ST_B, lw: s.lw || 2 });
    else if (pts.length === 1) S.circ(pts[0][0], pts[0][1], 2.5, { fill: s.col || ST_B });
  });
  (o.marks || []).forEach(m => S.circ(X(m.x), Y(m.y), 4.5, { fill: m.col || ST_V }));
  S.line(px, py + ph, px + pw, py + ph, { col: 'L', lw: 1.4 }); S.line(px, py, px, py + ph, { col: 'L', lw: 1.4 });
  if (o.xlabel) S.text(px + pw / 2, r.y + r.h - fs * 0.5, o.xlabel, { size: fs * 0.85, col: 'M', al: 'c', bs: 'b' });
  return { px, py, pw, ph, X, Y, xmin, xmax, ymin, ymax };
}

// ── Tabelle ──  cols: [{h, w (in Schriftgrössen), al}]; rows: [[text…]]; o: {hl: Zeilenindex, bold: letzte Zeile, fs}
function stTable(S, x, y, cols, rows, o, C) {
  o = o || {}; const fs = o.fs || C.fs, rh = fs * 1.75;
  const tw = cols.reduce((a, c) => a + c.w * fs, 0);
  S.rect(x, y, tw, rh, { fill: ST_B, a: 0.12 });
  let cx = x;
  cols.forEach(c => { const w = c.w * fs; S.text(c.al === 'l' ? cx + fs * 0.4 : cx + w / 2, y + rh / 2, c.h, { size: fs * 0.92, col: 'T', al: c.al === 'l' ? 'l' : 'c', bs: 'm', bold: true }); cx += w; });
  S.line(x, y + rh, x + tw, y + rh, { col: 'L', lw: 1.2 });
  rows.forEach((row, i) => {
    const yy = y + rh * (i + 1);
    if (o.hl === i) S.rect(x, yy, tw, rh, { fill: ST_V, a: 0.14 });
    const last = o.sum && i === rows.length - 1;
    if (last) S.line(x, yy, x + tw, yy, { col: 'L', lw: 1.2 });
    let cx2 = x;
    cols.forEach((c, j) => { const w = c.w * fs; S.text(c.al === 'l' ? cx2 + fs * 0.4 : cx2 + w / 2, yy + rh / 2, row[j], { size: fs * 0.92, col: row.col && row.col[j] ? row.col[j] : 'T', al: c.al === 'l' ? 'l' : 'c', bs: 'm', bold: last }); cx2 += w; });
  });
  return { w: tw, h: rh * (rows.length + 1) };
}
function stTableFs(C, r, cols, nrows) { return Math.min(C.fs, r.w / cols.reduce((a, c) => a + c.w, 0), r.h / ((nrows + 1) * 1.75)); }

// ── Textblock: Zeilen {s, bold, col, size} ──
function stLines(S, x, y, lines, C, o) {
  o = o || {}; const fs = o.fs || C.fs; let yy = y;
  lines.forEach(l => {
    if (l === null) { yy += fs * 0.7; return; }
    if (typeof l === 'string') l = { s: l };
    const sz = fs * (l.size || 1);
    S.text(o.al === 'c' ? x : x, yy + sz * 0.6, l.s, { size: sz, col: l.col || 'T', al: o.al || 'l', bs: 'm', bold: !!l.bold });
    yy += sz * 1.5;
  });
  return yy;
}
function stFitLines(lines, r, C, minF) {            // Schriftgrösse so wählen, dass alle Zeilen in r passen
  let fs = C.fs;
  const need = f => lines.reduce((a, l) => a + (l === null ? f * 0.7 : f * ((l && l.size) || 1) * 1.5), 0);
  const wid = f => lines.reduce((m, l) => Math.max(m, l === null ? 0 : String(l.s !== undefined ? l.s : l).length * f * ((l && l.size) || 1) * 0.56), 0);
  while (fs > (minF || 9) && (need(fs) > r.h || wid(fs) > r.w)) fs -= 0.5;
  return fs;
}

// ── Würfel / Münze zeichnen ──
function stDie(S, cx, cy, size, v, sides, col) {
  const h = size / 2;
  if (sides === 2) {
    S.circ(cx, cy, h, { fill: ST_O, a: 0.35, stroke: ST_O, lw: 2 });
    S.text(cx, cy, v === 1 ? 'Kopf' : 'Zahl', { size: size * 0.28, col: 'T', al: 'c', bs: 'm', bold: true });
    return;
  }
  S.rect(cx - h, cy - h, size, size, { fill: col || ST_B, a: 0.16, stroke: col || ST_B, lw: 2, r: size * 0.16 });
  if (sides === 6) {
    const d = size * 0.24, pos = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
    (pos[v] || []).forEach(p => S.circ(cx + p[0] * d, cy + p[1] * d, size * 0.075, { fill: 'T' }));
  } else S.text(cx, cy, String(v), { size: size * 0.45, col: 'T', al: 'c', bs: 'm', bold: true });
}
const stSideLabel = (sides, i) => (sides === 2 ? (i === 0 ? 'Kopf' : 'Zahl') : String(i));

// ═══════════════════════════════════════════════════════════════════
// Die Szenen der Experimente: (S, W, H, C) mit C = {fs, P, D, st}
// ═══════════════════════════════════════════════════════════════════
const ST_SCENES = {};

// ── Würfel / Münze und zwei Würfel ──
function stSceneDice(S, W, H, C) {
  const P = C.P, D = C.D, lo = Stat.diceLo(P), probs = Stat.diceProbs(P), n = D.n, nb = probs.length;
  const R = stLayout(W, H, [{ w: 0.6, rows: [0.5, 0.5] }, { w: 0.4, rows: [0.27, 0.73] }]);
  const watch = P.watch >= lo && P.watch < lo + nb ? P.watch : lo;
  const lab = i => (P.nd === 2 ? String(lo + i) : stSideLabel(P.sides, lo + i));
  const bars = D.counts.map((c, i) => ({ label: lab(i), v: n ? c / n : 0, col: lo + i === watch ? ST_V : ST_B }));
  const ymax = Math.max(...probs) * 1.9;
  stBarChart(S, R[0], bars, { title: 'Relative Häufigkeit der Ergebnisse', ymax, theory: C.show.theory ? probs : [], theoryLabel: 'Theorie (rote Striche)', vals: nb <= 12 && n > 0, vfmt: v => stFmt(v, 2), xlabel: P.nd === 2 ? 'Augensumme' : (P.sides === 2 ? 'Ergebnis' : 'Augenzahl') }, C);
  const wl = lab(watch - lo), wp = probs[watch - lo];
  stLineChart(S, R[1], [{ pts: D.hist.map(h => [h[0], h[1]]), col: ST_V, lw: 2 }], { title: 'Verlauf: relative Häufigkeit von «' + wl + '»', xlog: true, xmin: 1, xmax: Math.max(10, n), ymin: 0, ymax: Math.min(1, Math.max(wp * 2.2, 0.1)), hlines: C.show.theory ? [{ v: wp, label: 'Theorie ' + stFmt(wp, 3), col: ST_R }] : [], xlabel: 'Anzahl Würfe n (logarithmisch)' }, C);
  // letzter Wurf
  const r2 = R[2], ds = Math.min(r2.h * 0.5, r2.w * 0.2, 90);
  S.text(r2.x + r2.w / 2, r2.y + C.fs * 0.9, 'Letzter Wurf', { size: C.fs * 0.95, col: 'T', al: 'c', bold: true });
  if (D.last.length) D.last.forEach((v, i) => stDie(S, r2.x + r2.w / 2 + (i - (D.last.length - 1) / 2) * ds * 1.3, r2.y + C.fs * 1.9 + ds / 2, ds, v, P.sides, i ? ST_G : ST_B));
  S.text(r2.x + r2.w / 2, r2.y + r2.h - C.fs * 0.8, 'Anzahl Würfe: n = ' + n, { size: C.fs, col: 'T', al: 'c', bs: 'm', bold: true });
  // Tabelle
  const cols = [{ h: P.nd === 2 ? 'Summe' : (P.sides === 2 ? 'Ergebnis' : 'Augenzahl'), w: 4.8 }, { h: 'H', w: 3.8 }, { h: 'h = H/n', w: 10.2 }, { h: 'h in %', w: 4.6 }, { h: 'Theorie', w: 4.4 }];
  const rows = D.counts.map((c, i) => [lab(i), String(c), n ? stFrac(c, n) + ' = ' + stFmt(c / n, 3) : '–', n ? stFmt(c / n * 100, 1) : '–', stFmt(probs[i], 3)]);
  rows.push(['Summe', String(n), n ? stFrac(n, n) + ' = 1' : '–', n ? '100' : '–', '1']);
  const r3 = R[3], tfs = stTableFs(C, { w: r3.w, h: r3.h - C.fs * 4 }, cols, rows.length);
  stTable(S, r3.x, r3.y, cols, rows, { hl: watch - lo, sum: true, fs: tfs }, C);
  const ty = r3.y + tfs * 1.75 * (rows.length + 1) + C.fs * 0.8;
  stLines(S, r3.x, ty, [{ s: 'H = absolute Häufigkeit (wie oft?)', col: 'M', size: 0.85 }, { s: 'h = relative Häufigkeit = H geteilt durch n', col: 'M', size: 0.85 }], C);
}
ST_SCENES.dice = ST_SCENES.dice2 = stSceneDice;

// ── Galtonbrett ──
// Geometrie des Bretts (auch für die Kugel-Animation in 42_stat_ui.js)
function stGaltonGeom(r, rows) {
  const dx = Math.min(r.w / (rows + 2), r.h / 14), cx = r.x + r.w / 2;
  const triH = Math.min(r.h * 0.52, dx * 1.1 * rows), dy = triH / Math.max(1, rows);
  const yTop = r.y + r.h * 0.07 + dy, binTop = yTop + rows * dy + dy * 0.4, binBot = r.y + r.h - 4;
  return { dx, dy, cx, yTop, binTop, binBot, binH: binBot - binTop, rb: Math.max(1.5, Math.min(dx * 0.27, dy * 0.3)) };
}
function stGaltonPos(g, rows, bits, u, ty) {     // Ort der Kugel bei Fortschritt u (0 … rows+1); ty = Höhe, auf der sie liegen bleibt
  const kAt = t => { let k = 0; for (let i = 0; i < t; i++) k += bits[i]; return k; };
  const xs = t => g.cx + (kAt(t) - t / 2) * g.dx, ys = t => g.yTop + (t - 1) * g.dy;
  if (u >= rows) { const f2 = Math.min(1, u - rows); return { x: xs(rows), y: ys(rows) + (ty - ys(rows)) * f2 * f2 }; }
  const s = Math.floor(u), f = u - s, e = f * f * (3 - 2 * f);
  return { x: xs(s) + (xs(s + 1) - xs(s)) * e, y: ys(s) + g.dy * (0.2 * f + 0.8 * f * f) - g.dy * 0.3 * f * (1 - f) };
}
function stSceneGalton(S, W, H, C) {
  const P = C.P, D = C.D, rows = P.rows;
  const R = stLayout(W, H, [{ w: 0.66, rows: [1] }, { w: 0.34, rows: [1] }]);
  const r = R[0], g = stGaltonGeom(r, rows);
  // Stifte
  for (let i = 0; i < rows; i++) for (let j = 0; j <= i; j++) S.circ(g.cx + (j - i / 2) * g.dx, g.yTop + i * g.dy, Math.max(1.6, g.rb * 0.4), { fill: 'M' });
  // Fächer
  const binX = k => g.cx + (k - rows / 2) * g.dx;
  for (let k = 0; k <= rows + 1; k++) S.line(g.cx + (k - 0.5 - rows / 2) * g.dx, g.binTop, g.cx + (k - 0.5 - rows / 2) * g.dx, g.binBot, { col: 'L', lw: 1 });
  S.line(g.cx - (rows / 2 + 0.5) * g.dx, g.binBot, g.cx + (rows / 2 + 0.5) * g.dx, g.binBot, { col: 'L', lw: 1.4 });
  const mx = Math.max(1, ...D.counts), d2 = g.rb * 2.05, cap = Math.floor((g.binH - 4) / d2);
  const stacked = mx <= cap, sc = (g.binH - 6) / mx;
  C.geom = { g, stacked, sc, d2, binX };
  D.counts.forEach((c, k) => {
    if (!c) return;
    if (stacked) for (let t = 0; t < c; t++) S.circ(binX(k), g.binBot - g.rb - 2 - t * d2, g.rb, { fill: ST_B, a: 0.85 });
    else S.rect(binX(k) - g.dx * 0.42, g.binBot - c * sc, g.dx * 0.84, c * sc, { fill: ST_B, a: 0.8 });
  });
  (C.st.fx || []).forEach(bl => {
    if (bl.u < 0) return;
    const k = bl.bits.reduce((x, y) => x + y, 0), ty = stacked ? g.binBot - g.rb - 2 - D.counts[k] * d2 : g.binBot - D.counts[k] * sc;
    const q = stGaltonPos(g, rows, bl.bits, bl.u, ty); S.circ(q.x, q.y, g.rb, { fill: ST_O, a: 0.95 });
  });
  // Theorie über den Fächern
  const n = D.n, tstyle = C.show.theory;
  if (n > 0 && tstyle) {
    const bin = Stat.binomAll(rows, P.p);
    const hOf = pk => (stacked ? pk * n * d2 : pk * n * sc);
    bin.forEach((pk, k) => { const hh = hOf(pk); S.rect(binX(k) - g.dx * 0.42, g.binBot - hh, g.dx * 0.84, hh, { stroke: ST_R, lw: 2, nofill: true }); });
  }
  if (n > 0 && C.show.normal) {
    const mu = rows * P.p, sd = Math.sqrt(rows * P.p * (1 - P.p)), pts = [];
    if (sd > 0) for (let i = 0; i <= 80; i++) { const k = -0.5 + (rows + 1) * i / 80, hh = Stat.normPdf(k, mu, sd) * n * (stacked ? d2 : sc); pts.push([g.cx + (k - rows / 2) * g.dx, g.binBot - hh]); }
    if (pts.length) S.poly(pts, { col: ST_V, lw: 2.4 });
  }
  // Fächer-Nummern
  if (g.dx > C.fs * 0.9) for (let k = 0; k <= rows; k++) S.text(binX(k), g.binBot + 1, String(k), { size: Math.min(C.fs * 0.8, g.dx * 0.5), col: 'M', al: 'c', bs: 't' });
  // rechts: Zahlen
  const r2 = R[1], st = Stat.histStats(D.counts, i => i), mu = rows * P.p, sd = Math.sqrt(rows * P.p * (1 - P.p));
  const lines = [{ s: 'Kugeln: n = ' + n, bold: true }, null,
    { s: 'Mittelwert  x̄ = ' + stFmt(st.mean, 2) }, { s: 'Theorie  n·p = ' + stFmt(mu, 2), col: ST_R, size: 0.9 }, null,
    { s: 'Streuung  s = ' + stFmt(st.sd, 2) }, { s: 'Theorie  √(n·p·q) = ' + stFmt(sd, 2), col: ST_R, size: 0.9 }, null,
    { s: 'Jede Kugel: ' + rows + ' Mal links (' + stFmt(1 - P.p, 2) + ') oder rechts (' + stFmt(P.p, 2) + ').', col: 'M', size: 0.85 },
    { s: 'Fach k = Anzahl «rechts». Das gibt', col: 'M', size: 0.85 }, { s: 'die Binomialverteilung B(' + rows + '; ' + stFmt(P.p, 2) + ').', col: 'M', size: 0.85 }];
  const ffs = stFitLines(lines, { w: r2.w, h: r2.h * 0.42 }, C);
  const yEnd = stLines(S, r2.x, r2.y, lines, C, { fs: ffs });
  if (rows <= 20) {
    const cols = [{ h: 'Fach k', w: 3.6 }, { h: 'Anzahl', w: 3.8 }, { h: 'h', w: 3.6 }, { h: 'Binomial', w: 4.6 }];
    const bin = Stat.binomAll(rows, P.p), rws = D.counts.map((c, k) => [String(k), String(c), n ? stFmt(c / n, 3) : '–', stFmt(bin[k], 3)]);
    const avail = { w: r2.w, h: r2.y + r2.h - yEnd - C.fs * 0.5 }, tfs = stTableFs(C, avail, cols, rws.length);
    if (tfs >= 8) stTable(S, r2.x, yEnd + C.fs * 0.3, cols, rws, { fs: tfs }, C);
  }
}
ST_SCENES.galton = stSceneGalton;

// ── Monte-Carlo-π ──
function stSceneEstimate(S, W, H, C, opt) {        // gemeinsame rechte Hälfte: Zahlen + Verlauf der Schätzung
  const R = opt.R, D = C.D;
  stLines(S, R[0].x, R[0].y, opt.lines, C, { fs: stFitLines(opt.lines, R[0], C) });
  stLineChart(S, R[1], [{ pts: D.hist.map(h => [h[0], h[1]]), col: ST_V, lw: 2 }], { title: opt.title, xlog: true, xmin: 1, xmax: Math.max(10, D.n), ymin: opt.ymin, ymax: opt.ymax, hlines: [{ v: Math.PI, label: 'π = 3.1416', col: ST_R }], xlabel: opt.xlabel, yfmt: v => String(Math.round(v * 100) / 100) }, C);
}
function stScenePi(S, W, H, C) {
  const D = C.D, n = D.n, est = n ? 4 * D.inside / n : null;
  const R = stLayout(W, H, [{ w: 0.5, rows: [1] }, { w: 0.5, rows: [0.4, 0.6] }]);
  const r = R[0], side = Math.min(r.w - C.fs * 3, r.h - C.fs * 3), x0 = r.x + (r.w - side) / 2 + C.fs, y0 = r.y + (r.h - side) / 2 + C.fs * 0.5;
  S.rect(x0, y0, side, side, { stroke: 'L', lw: 1.6, fill: 'G', a: 0.12 });
  const arc = []; for (let i = 0; i <= 60; i++) { const a = Math.PI / 2 * i / 60; arc.push([x0 + Math.cos(a) * side, y0 + side - Math.sin(a) * side]); }
  S.poly(arc, { col: ST_R, lw: 2.2 });
  const pr = Math.max(1.2, Math.min(3.4, side / 220));
  D.pts.forEach(p => S.circ(x0 + p[0] * side, y0 + side - p[1] * side, pr, { fill: p[2] ? ST_B : ST_O, a: 0.85 }));
  S.text(x0, y0 + side + C.fs * 0.7, '0', { size: C.fs * 0.8, col: 'M', al: 'c', bs: 't' }); S.text(x0 + side, y0 + side + C.fs * 0.7, '1', { size: C.fs * 0.8, col: 'M', al: 'c', bs: 't' });
  S.text(x0 - C.fs * 0.5, y0, '1', { size: C.fs * 0.8, col: 'M', al: 'r', bs: 'm' });
  S.text(x0 + side * 0.62, y0 + side * 0.62, 'x² + y² = 1', { size: C.fs * 0.85, col: ST_R, al: 'l', bs: 'm' });
  const lines = [{ s: 'Punkte insgesamt: n = ' + n, bold: true }, { s: 'im Viertelkreis (blau): k = ' + D.inside }, null,
    { s: 'Anteil  k/n = ' + (n ? stFrac(D.inside, n) + ' = ' + stFmt(D.inside / n, 4) : '–') },
    { s: 'Fläche Viertelkreis : Quadrat = π/4 : 1', col: 'M', size: 0.88 },
    { s: 'π ≈ 4 · k/n = ' + (n ? stFmt(est, 4) : '–'), bold: true, col: ST_V, size: 1.15 },
    n ? { s: 'Abweichung: ' + stFmt(Math.abs(est - Math.PI), 4), col: 'M', size: 0.88 } : { s: ' ' }];
  stSceneEstimate(S, W, H, C, { R: [R[1], R[2]], lines, title: 'Verlauf der Näherung für π', xlabel: 'Anzahl Punkte n (logarithmisch)', ymin: 2.4, ymax: 4 });
}
ST_SCENES.pi = stScenePi;

// ── Buffon ──
function stSceneBuffon(S, W, H, C) {
  const P = C.P, D = C.D, n = D.n, l = P.l, est = D.cross > 0 ? 2 * l * n / D.cross : null;
  const R = stLayout(W, H, [{ w: 0.5, rows: [1] }, { w: 0.5, rows: [0.44, 0.56] }]);
  const r = R[0], fw = Stat.BUF_W, fh = Stat.BUF_H, sc = Math.min((r.w - C.fs * 2) / fw, (r.h - C.fs * 2) / fh), x0 = r.x + (r.w - fw * sc) / 2, y0 = r.y + (r.h - fh * sc) / 2;
  S.rect(x0, y0, fw * sc, fh * sc, { stroke: 'L', lw: 1.4, fill: 'G', a: 0.1 });
  for (let k = 0; k <= fh; k++) S.line(x0, y0 + k * sc, x0 + fw * sc, y0 + k * sc, { col: 'M', lw: 1.6 });
  S.text(x0 + fw * sc, y0 - C.fs * 0.4, 'Linienabstand d = 1', { size: C.fs * 0.82, col: 'M', al: 'r', bs: 'b' });
  D.needles.forEach(nd => {
    const [x, y, th, c] = nd, dx = Math.cos(th) * l / 2, dy = Math.sin(th) * l / 2;
    const ax = Math.max(0, Math.min(fw, x - dx)), bx = Math.max(0, Math.min(fw, x + dx));
    const ya = y - dy, yb = y + dy; if (ya < 0 && yb < 0 || ya > fh && yb > fh) return;
    S.line(x0 + (x - dx) * sc, y0 + ya * sc, x0 + (x + dx) * sc, y0 + yb * sc, { col: c ? ST_R : ST_B, lw: c ? 2.2 : 1.6, clip: [x0, y0, fw * sc, fh * sc] });
  });
  const lines = [{ s: 'Nadeln: n = ' + n + ',  Länge l = ' + stFmt(l, 2), bold: true }, { s: 'Linie getroffen (rot): k = ' + D.cross }, null,
    { s: 'Trefferanteil  k/n = ' + (n ? stFrac(D.cross, n) + ' = ' + stFmt(D.cross / n, 4) : '–') },
    { s: 'Theorie: 2·l / (π·d) = ' + stFmt(Stat.buffonProb(l), 4), col: ST_R, size: 0.9 },
    { s: 'π ≈ 2·l·n / k = ' + (n && D.cross ? stFmt(est, 4) : '–'), bold: true, col: ST_V, size: 1.15 },
    n && D.cross ? { s: 'Abweichung: ' + stFmt(Math.abs(est - Math.PI), 4), col: 'M', size: 0.88 } : { s: ' ' }];
  stSceneEstimate(S, W, H, C, { R: [R[1], R[2]], lines, title: 'Verlauf der Näherung für π', xlabel: 'Anzahl Nadeln n (logarithmisch)', ymin: 2, ymax: 5 });
}
ST_SCENES.buffon = stSceneBuffon;

// ── Ziegenproblem ──
function stSceneMonty(S, W, H, C) {
  const D = C.D, n = D.n, M = C.st.play || {}, R = stLayout(W, H, [{ w: 0.52, rows: [0.6, 0.4] }, { w: 0.48, rows: [0.3, 0.7] }]);
  const r = R[0], dw = Math.min(r.w / 3.6, r.h * 0.6, 190), dh = dw * 1.45, gap = dw * 0.28, tx = r.x + (r.w - (3 * dw + 2 * gap)) / 2, ty = r.y + C.fs * 2.4;
  const g = M.phase ? { car: M.car, pick: M.pick, open: M.open, show: M.phase === 'done' } : (D.last ? Object.assign({ show: true }, D.last) : null);
  S.text(r.x + r.w / 2, r.y + C.fs * 0.9, g ? (M.phase ? (M.phase === 'pick' ? 'Wähle eine Tür!' : M.phase === 'swap' ? 'Bleiben oder wechseln?' : (M.won ? 'Gewonnen!' : 'Leider eine Ziege.')) : 'Letztes Spiel (simuliert)') : 'Tür 1, 2 oder 3: Wo steht das Auto?', { size: C.fs * 1.05, col: 'T', al: 'c', bold: true });
  for (let d = 0; d < 3; d++) {
    const x = tx + d * (dw + gap), opened = g && (g.open === d || g.show);
    S.rect(x, ty, dw, dh, { fill: opened ? 'G' : ST_O, a: opened ? 0.22 : 0.45, stroke: g && g.pick === d ? ST_V : ST_O, lw: g && g.pick === d ? 4 : 2, r: dw * 0.06 });
    if (opened && g) S.text(x + dw / 2, ty + dh / 2, d === g.car ? '🚗' : '🐐', { size: dw * 0.5, col: 'T', al: 'c', bs: 'm', emoji: true });
    else S.text(x + dw / 2, ty + dh / 2, String(d + 1), { size: dw * 0.4, col: 'T', al: 'c', bs: 'm', bold: true });
    S.text(x + dw / 2, ty + dh + C.fs * 0.9, 'Tür ' + (d + 1) + (g && g.pick === d ? ' (gewählt)' : '') + (g && g.open === d && !g.show ? ' (offen)' : ''), { size: C.fs * 0.82, col: g && g.pick === d ? ST_V : 'M', al: 'c', bs: 'm' });
  }
  // Tabelle
  const r1 = R[1], cols = [{ h: 'Strategie', w: 5.2, al: 'l' }, { h: 'Spiele', w: 4 }, { h: 'gewonnen', w: 5 }, { h: 'h = H/n', w: 9.5 }];
  const rows = [['bleiben', String(n), String(D.stay), n ? stFrac(D.stay, n) + ' = ' + stFmt(D.stay / n, 3) : '–'], ['wechseln', String(n), String(D.swap), n ? stFrac(D.swap, n) + ' = ' + stFmt(D.swap / n, 3) : '–']];
  rows[0].col = [ST_B, null, null, null]; rows[1].col = [ST_G, null, null, null];
  const tfs = stTableFs(C, { w: r1.w, h: r1.h * 0.5 }, cols, rows.length);
  stTable(S, r1.x, r1.y, cols, rows, { fs: tfs }, C);
  let yy = r1.y + tfs * 1.75 * 3 + C.fs * 0.7;
  const mp = C.st.playStats || { n: 0, stay: 0, swap: 0 };
  stLines(S, r1.x, yy, [{ s: 'Theorie: bleiben 1/3, wechseln 2/3', col: ST_R, size: 0.9 }, mp.n ? { s: 'Von Hand gespielt: ' + mp.n + ' Spiele, gewonnen: ' + (mp.stay + mp.swap) + ' (bleiben ' + mp.stay + ' von ' + mp.nStay + ', wechseln ' + mp.swap + ' von ' + mp.nSwap + ')', col: 'M', size: 0.82 } : null].filter(Boolean), C);
  // Verlauf
  stLineChart(S, R[3], [{ pts: D.hist.map(h => [h[0], h[1]]), col: ST_B }, { pts: D.hist.map(h => [h[0], h[2]]), col: ST_G }], { title: 'Gewinnanteil: bleiben (blau), wechseln (grün)', xlog: true, xmin: 1, xmax: Math.max(10, n), ymin: 0, ymax: 1, hlines: [{ v: 1 / 3, label: '1/3', col: ST_B }, { v: 2 / 3, label: '2/3', col: ST_G }], xlabel: 'Anzahl Spiele n (logarithmisch)', yfmt: v => String(Math.round(v * 100) / 100) }, C);
  const ex = [{ s: 'Hinter einer Tür steht ein Auto, hinter den', size: 0.92 }, { s: 'anderen beiden je eine Ziege. Du wählst eine Tür.', size: 0.92 }, { s: 'Der Moderator öffnet eine andere Tür mit einer', size: 0.92 }, { s: 'Ziege. Bleibst du oder wechselst du?', size: 0.92 }, null,
    { s: 'Bleiben gewinnt nur, wenn die erste Wahl', col: 'M', size: 0.85 }, { s: 'schon das Auto war (1/3). Sonst gewinnt', col: 'M', size: 0.85 }, { s: 'Wechseln (2/3).', col: 'M', size: 0.85 }];
  stLines(S, R[2].x, R[2].y, ex, C, { fs: stFitLines(ex, R[2], C) });
}
ST_SCENES.monty = stSceneMonty;

// ── Geburtstagsparadoxon ──
function stSceneBirthday(S, W, H, C) {
  const P = C.P, D = C.D, n = D.n, R = stLayout(W, H, [{ w: 0.5, rows: [1] }, { w: 0.5, rows: [0.38, 0.32, 0.3] }]);
  const r = R[0], cols = 24, rowsN = Math.ceil(P.days / cols), cs = Math.min((r.w - C.fs * 2) / cols, (r.h - C.fs * 5) / rowsN), x0 = r.x + (r.w - cs * cols) / 2, y0 = r.y + C.fs * 2.2;
  S.text(r.x + r.w / 2, r.y + C.fs * 0.9, 'Kalender: letzte Gruppe von ' + P.k + ' Personen', { size: C.fs * 0.95, col: 'T', al: 'c', bold: true });
  const cnt = {}; D.last.forEach(d => { cnt[d] = (cnt[d] || 0) + 1; });
  for (let d = 0; d < P.days; d++) {
    const x = x0 + (d % cols) * cs, y = y0 + Math.floor(d / cols) * cs, c = cnt[d] || 0;
    S.rect(x + 1, y + 1, cs - 2, cs - 2, { fill: c > 1 ? ST_R : c === 1 ? ST_B : 'G', a: c > 1 ? 0.9 : c === 1 ? 0.75 : 0.18 });
    if (c > 1 && cs > C.fs * 1.1) S.text(x + cs / 2, y + cs / 2, String(c), { size: Math.min(cs * 0.6, C.fs), col: '#ffffff', al: 'c', bs: 'm', bold: true });
  }
  const yb = y0 + rowsN * cs + C.fs * 0.9;
  const has = D.last.length ? Stat.birthdayHasMatch(D.last) : null;
  S.text(r.x + r.w / 2, yb, has === null ? '' : (has ? 'Mindestens zwei gleiche Geburtstage (rot).' : 'Alle Geburtstage verschieden.'), { size: C.fs, col: has ? ST_R : 'T', al: 'c', bs: 'm', bold: true });
  S.text(r.x + r.w / 2, yb + C.fs * 1.5, 'Jedes Kästchen ist ein Tag im Jahr (' + P.days + ' Tage).', { size: C.fs * 0.82, col: 'M', al: 'c', bs: 'm' });
  const pth = Stat.birthdayProb(P.k, P.days);
  const lines = [{ s: 'Gruppen gezogen: n = ' + n, bold: true }, { s: 'davon mit gleichem Geburtstag: H = ' + D.hits }, null,
    { s: 'h = H/n = ' + (n ? stFrac(D.hits, n) + ' = ' + stFmt(D.hits / n, 3) : '–'), col: ST_V, bold: true },
    { s: 'Theorie: P = 1 − (365·364·…)/365^k = ' + stFmt(pth, 3), col: ST_R, size: 0.9 }];
  stLines(S, R[1].x, R[1].y, lines, C, { fs: stFitLines(lines, R[1], C) });
  const kmax = 60, pts = []; for (let k = 1; k <= kmax; k++) pts.push([k, Stat.birthdayProb(k, P.days)]);
  stLineChart(S, R[2], [{ pts, col: ST_B, lw: 2.2 }], { title: 'P(mind. zwei gleiche Geburtstage) in Abhängigkeit von k', xmin: 0, xmax: kmax, ymin: 0, ymax: 1, hlines: [{ v: 0.5, label: '50 %', col: 'M' }], marks: [{ x: P.k, y: Math.min(pth, 1), col: ST_V }], xlabel: 'Anzahl Personen k', yfmt: v => String(Math.round(v * 100) / 100) }, C);
  stLineChart(S, R[3], [{ pts: D.hist.map(h => [h[0], h[1]]), col: ST_V }], { title: 'Verlauf: relative Häufigkeit', xlog: true, xmin: 1, xmax: Math.max(10, n), ymin: 0, ymax: 1, hlines: [{ v: pth, label: 'Theorie ' + stFmt(pth, 3), col: ST_R }], xlabel: 'Anzahl Gruppen n (logarithmisch)', yfmt: v => String(Math.round(v * 100) / 100) }, C);
}
ST_SCENES.birthday = stSceneBirthday;

// ── Zufallsspaziergang ──
function stSceneWalk(S, W, H, C) {
  const P = C.P, D = C.D, s = D.steps, R = stLayout(W, H, [{ w: 0.6, rows: [1] }, { w: 0.4, rows: [0.58, 0.42] }]);
  const sd1 = 2 * Math.sqrt(P.p * (1 - P.p)), drift = 2 * P.p - 1;
  const xmax = Math.max(20, Math.ceil(Math.max(s, 1) * 1.05 / 10) * 10);
  let ymaxAbs = Math.max(10, 4 * sd1 * Math.sqrt(Math.max(1, s)) * 0.8 + Math.abs(drift) * s);
  D.paths.forEach(p => p.forEach(v => { ymaxAbs = Math.max(ymaxAbs, Math.abs(v)); }));
  ymaxAbs = Math.ceil(ymaxAbs / 5) * 5;
  const r = R[0], left = C.fs * 3.4, top = C.fs * 1.9, bottom = C.fs * 3.4, px = r.x + left, py = r.y + top, pw = r.w - left - C.fs, ph = r.h - top - bottom;
  const X = t => px + t / xmax * pw, Y = v => py + ph / 2 - v / ymaxAbs * ph / 2;
  S.text(r.x + r.w / 2, r.y + C.fs * 0.9, 'Wege von ' + D.pos.length + ' Läufern (die ersten ' + D.paths.length + ' gezeichnet)', { size: C.fs * 0.95, col: 'T', al: 'c', bold: true });
  const tk = stTicks(ymaxAbs, 4);
  const kk = Math.floor(ymaxAbs / tk.st + 1e-9); for (let q = -kk; q <= kk; q++) { const v = q * tk.st; S.line(px, Y(v), px + pw, Y(v), { col: v === 0 ? 'L' : 'G', lw: v === 0 ? 1.4 : 1 }); S.text(px - C.fs * 0.4, Y(v), stTickLabel(v, tk.st), { size: C.fs * 0.8, col: 'M', al: 'r', bs: 'm' }); }
  const t2 = stTicks(xmax, 5); t2.t.forEach(v => { S.line(X(v), py, X(v), py + ph, { col: 'G', lw: 1 }); S.text(X(v), py + ph + C.fs * 0.8, stTickLabel(v, t2.st), { size: C.fs * 0.8, col: 'M', al: 'c', bs: 't' }); });
  if (C.show.theory && s > 0) {
    const up = [], dn = [], mid = [];
    for (let t = 0; t <= s; t++) { const m = drift * t, e = sd1 * Math.sqrt(t); up.push([X(t), Y(m + e)]); dn.push([X(t), Y(m - e)]); mid.push([X(t), Y(m)]); }
    S.poly(up, { col: ST_R, lw: 1.8, dash: true }); S.poly(dn, { col: ST_R, lw: 1.8, dash: true });
  }
  D.paths.forEach((p, i) => { const pts = p.map((v, t) => [X(t), Y(v)]); if (pts.length > 1) S.poly(pts, { col: ALG_HUES[i % 6], lw: i === 0 ? 2.4 : 1.2, a: i === 0 ? 1 : 0.55 }); });
  S.line(px, py + ph, px + pw, py + ph, { col: 'L', lw: 1.4 });
  S.text(px + pw / 2, r.y + r.h - C.fs * 0.5, 'Schritt t' + (C.show.theory ? '   (rot gestrichelt: ±1 Standardabweichung = ±√t)' : ''), { size: C.fs * 0.85, col: 'M', al: 'c', bs: 'b' });
  // Verteilung der Orte
  const mu = drift * s, sd = sd1 * Math.sqrt(Math.max(s, 0));
  const w = sd > 0 ? 2 * Math.max(1, Math.round(sd / 6)) : 2, lo = -s - 1, nbn = Math.max(1, Math.ceil((2 * s + 2) / w)), counts = Stat.zeros(nbn);
  D.pos.forEach(v => { const j = Math.max(0, Math.min(nbn - 1, Math.floor((v - lo) / w))); counts[j]++; });
  const nw = D.pos.length, c0 = Math.max(0, Math.floor(((mu - 4.2 * Math.max(sd, 1)) - lo) / w)), c1 = Math.min(nbn - 1, Math.ceil(((mu + 4.2 * Math.max(sd, 1)) - lo) / w));
  const bars = []; for (let j = c0; j <= c1; j++) { const a = lo + j * w, b = a + w - 1, ctr = (a + b) / 2; bars.push({ label: w === 2 ? String(Math.round(ctr)) : '', v: counts[j] / nw, j, ctr }); }
  const theory = (C.show.theory && s > 0) ? bars.map(b => { let p = 0; for (let v = lo + b.j * w; v < lo + (b.j + 1) * w; v++) { if (((v + s) & 1) === 0) p += 2 * Stat.normPdf(v, mu, sd); } return p; }) : [];
  const ch = stBarChart(S, R[1], bars.map((b, i) => ({ label: i % Math.max(1, Math.ceil(bars.length / 8)) === 0 ? String(Math.round(b.ctr)) : '', v: b.v, col: ST_B })), { title: 'Wo sind die Läufer nach ' + s + ' Schritten?', theory, theoryLabel: 'Normalverteilung', xlabel: 'Ort', yfmt: v => stFmt(v, 2) }, C);
  const mean = D.pos.reduce((a, b) => a + b, 0) / nw, sdev = Math.sqrt(D.pos.reduce((a, b) => a + (b - mean) * (b - mean), 0) / nw);
  const lines = [{ s: 'Schritte: t = ' + s + (s >= Stat.WALK_MAX ? ' (Ende)' : ''), bold: true }, { s: 'Mittel der Orte: ' + stFmt(mean, 2) + '  (Theorie ' + stFmt(mu, 2) + ')' }, { s: 'Streuung: ' + stFmt(sdev, 2) + '  (Theorie ' + stFmt(sd, 2) + ')', }];
  stLines(S, R[2].x, R[2].y, lines, C, { fs: stFitLines(lines, R[2], C) });
}
ST_SCENES.walk = stSceneWalk;

// ── Zentraler Grenzwertsatz ──
function stScenePop(S, r, P, C) {                  // die Ausgangsverteilung (eine Einzelmessung)
  const d = Stat.CLT_DISTS[P.dist], fs = C.fs;
  if (P.dist === 'dice') { stBarChart(S, r, [1, 2, 3, 4, 5, 6].map(v => ({ label: String(v), v: 1 / 6, col: ST_G })), { title: 'Ausgangsverteilung: ein Würfel', ymax: 0.3, yfmt: v => stFmt(v, 2) }, C); return; }
  const left = fs * 3.4, top = fs * 1.9, bottom = fs * 2.2, px = r.x + left, py = r.y + top, pw = r.w - left - fs, ph = r.h - top - bottom;
  const hi = P.dist === 'exp' ? 5 : 1, f = x => P.dist === 'uniform' ? 1 : P.dist === 'exp' ? Math.exp(-x) : 1 / (Math.PI * Math.sqrt(Math.max(1e-4, x * (1 - x))));
  const ymx = P.dist === 'arcsine' ? 3 : P.dist === 'exp' ? 1.1 : 1.4, X = x => px + x / hi * pw, Y = y => py + ph - Math.min(y, ymx) / ymx * ph;
  S.text(r.x + r.w / 2, r.y + fs * 0.9, 'Ausgangsverteilung: ' + d.name, { size: fs * 0.95, col: 'T', al: 'c', bold: true });
  const pts = [[X(0), Y(0)]]; for (let i = 0; i <= 80; i++) { const x = hi * (i / 80); pts.push([X(x), Y(f(Math.min(Math.max(x, 1e-4), hi - 1e-4)))]); } pts.push([X(hi), Y(0)]);
  S.poly(pts, { col: ST_G, lw: 2.2, fill: ST_G, a: 0.25, close: true });
  S.line(px, py + ph, px + pw, py + ph, { col: 'L', lw: 1.4 });
  const t2 = stTicks(hi, 4); t2.t.forEach(v => S.text(X(v), py + ph + fs * 0.8, stTickLabel(v, t2.st), { size: fs * 0.8, col: 'M', al: 'c', bs: 't' }));
  S.line(X(d.mu), py, X(d.mu), py + ph, { col: ST_R, lw: 1.4, dash: true });
}
function stSceneClt(S, W, H, C) {
  const P = C.P, D = C.D, d = Stat.CLT_DISTS[P.dist], n = P.n, b = Stat.cltBins(P), m = D.m;
  const R = stLayout(W, H, [{ w: 0.64, rows: [0.3, 0.7] }, { w: 0.36, rows: [1] }]);
  stScenePop(S, R[0], P, C);
  const se = d.sd / Math.sqrt(n), centers = []; for (let j = 0; j < b.nb; j++) centers.push(b.lo + (j + 0.5) * b.w);
  const dens = D.counts.map(c => (m ? c / m / b.w : 0));
  const theory = centers.map(x => Stat.normPdf(x, d.mu, se));
  const bars = D.counts.map((c, j) => ({ label: '', v: dens[j], col: ST_B }));
  const r = R[1], left = C.fs * 3.4, top = C.fs * 1.9, bottom = C.fs * 3.4, px = r.x + left, py = r.y + top, pw = r.w - left - C.fs, ph = r.h - top - bottom;
  let mx = Math.max(...theory) * 1.15, mxd = Math.max(...dens); mx = Math.max(mx, mxd * 1.1);
  const tk = stTicks(mx, 4), ymax = Math.max(mx, tk.t[tk.t.length - 1]), Y = v => py + ph - v / ymax * ph, slot = pw / b.nb;
  S.text(r.x + r.w / 2, r.y + C.fs * 0.9, 'Mittelwerte von Stichproben der Grösse n = ' + n, { size: C.fs * 0.95, col: 'T', al: 'c', bold: true });
  tk.t.forEach(v => { S.line(px, Y(v), px + pw, Y(v), { col: 'G', lw: 1 }); S.text(px - C.fs * 0.4, Y(v), stTickLabel(v, tk.st), { size: C.fs * 0.8, col: 'M', al: 'r', bs: 'm' }); });
  dens.forEach((v, j) => { if (v > 0) S.rect(px + j * slot + slot * 0.06, Y(v), slot * 0.88, py + ph - Y(v), { fill: ST_B, a: 0.8 }); });
  if (C.show.normal) { const pts = centers.map((x, j) => [px + (j + 0.5) * slot, Y(theory[j])]); S.poly(pts, { col: ST_R, lw: 2.4 }); }
  S.line(px, py + ph, px + pw, py + ph, { col: 'L', lw: 1.4 });
  const nt = 5; for (let i = 0; i <= nt; i++) { const x = b.lo + b.w * b.nb * i / nt; S.text(px + pw * i / nt, py + ph + C.fs * 0.8, stFmt(x, 2), { size: C.fs * 0.8, col: 'M', al: 'c', bs: 't' }); }
  S.text(px + pw / 2, r.y + r.h - C.fs * 0.5, 'Mittelwert x̄ der Stichprobe (Säulenfläche = relative Häufigkeit)', { size: C.fs * 0.82, col: 'M', al: 'c', bs: 'b' });
  const mean = m ? D.sum / m : 0, sdv = m ? Math.sqrt(Math.max(0, D.sum2 / m - mean * mean)) : 0;
  const lines = [{ s: 'Stichproben: m = ' + m, bold: true }, null, { s: 'Mittel der Mittelwerte' }, { s: m ? stFmt(mean, 3) : '–', bold: true, col: ST_V, size: 1.1 }, { s: 'Theorie μ = ' + stFmt(d.mu, 3), col: ST_R, size: 0.9 }, null,
    { s: 'Streuung der Mittelwerte' }, { s: m ? stFmt(sdv, 3) : '–', bold: true, col: ST_V, size: 1.1 }, { s: 'Theorie σ/√n = ' + stFmt(se, 3), col: ST_R, size: 0.9 }, null,
    { s: 'Ausgangsverteilung: σ = ' + stFmt(d.sd, 3), col: 'M', size: 0.85 }, null];
  if (D.last.length) { lines.push({ s: 'Letzte Stichprobe:', size: 0.9, col: 'M' }); lines.push({ s: D.last.map(v => stFmt(v, 1)).join(', ') + (n > 12 ? ' …' : ''), size: 0.82, col: 'M' }); lines.push({ s: 'x̄ = ' + stFmt(D.last.length === n ? D.last.reduce((a, c) => a + c, 0) / n : NaN, 2), size: 0.9 }); }
  const r2 = R[2]; stLines(S, r2.x, r2.y, lines, C, { fs: stFitLines(lines, r2, C) });
}
ST_SCENES.clt = stSceneClt;

// ── Konfidenzintervalle ──
function stSceneCi(S, W, H, C) {
  const P = C.P, D = C.D, m = D.m, truth = P.kind === 'mu' ? P.mu : P.p, z = Stat.zFor(P.level);
  const R = stLayout(W, H, [{ w: 0.6, rows: [1] }, { w: 0.4, rows: [0.5, 0.5] }]);
  const r = R[0], left = C.fs * 1.2, top = C.fs * 3.3, bottom = C.fs * 3.7, px = r.x + left, py = r.y + top, pw = r.w - left - C.fs, ph = r.h - top - bottom;
  const half = P.kind === 'mu' ? 3.6 * P.sigma / Math.sqrt(P.n) : 3.6 * Math.sqrt(Math.max(0.0025, P.p * (1 - P.p)) / P.n);
  const lo = truth - half, hi = truth + half, X = v => px + (v - lo) / (hi - lo) * pw;
  S.text(r.x + r.w / 2, r.y + C.fs * 0.9, 'Die letzten ' + D.ivs.length + ' Konfidenzintervalle', { size: C.fs * 0.95, col: 'T', al: 'c', bold: true });
  const t2 = stTicks(hi - lo, 5), t0 = Math.ceil(lo / t2.st) * t2.st;
  for (let v = t0; v <= hi + 1e-9; v += t2.st) { S.line(X(v), py, X(v), py + ph, { col: 'G', lw: 1 }); S.text(X(v), py + ph + C.fs * 0.8, stTickLabel(Math.round(v / t2.st) * t2.st, t2.st), { size: C.fs * 0.8, col: 'M', al: 'c', bs: 't' }); }
  const rh = ph / Stat.CI_KEEP;
  D.ivs.forEach((iv, i) => {
    const y = py + (i + 0.5) * rh, col = iv[3] ? ST_B : ST_R, a = Math.max(lo, iv[0]), b = Math.min(hi, iv[1]);
    S.line(X(a), y, X(b), y, { col, lw: Math.max(1.2, Math.min(4, rh * 0.55)) });
    S.circ(X(Math.max(lo, Math.min(hi, iv[2]))), y, Math.max(1.2, Math.min(3, rh * 0.4)), { fill: col });
  });
  S.line(X(truth), py - C.fs * 0.3, X(truth), py + ph, { col: ST_V, lw: 2.2 });
  S.text(X(truth), py - C.fs * 0.55, (P.kind === 'mu' ? 'wahres μ = ' : 'wahres p = ') + stFmt(truth, 3), { size: C.fs * 0.9, col: ST_V, al: 'c', bs: 'b', bold: true });
  S.text(px + pw / 2, r.y + r.h - C.fs * 0.4, 'blau: überdeckt den wahren Wert   rot: verfehlt ihn', { size: C.fs * 0.82, col: 'M', al: 'c', bs: 'b' });
  const lines = [{ s: 'Stichproben: m = ' + m, bold: true }, { s: 'Intervall überdeckt ' + (P.kind === 'mu' ? 'μ' : 'p') + ': H = ' + D.hit }, null,
    { s: 'h = H/m = ' + (m ? stFrac(D.hit, m) + ' = ' + stFmt(D.hit / m, 3) : '–'), bold: true, col: ST_V },
    { s: 'Vertrauensniveau: ' + stFmt(P.level * 100, 1) + ' %  (z = ' + stFmt(z, 3) + ')', col: ST_R, size: 0.9 }, null,
    P.kind === 'mu' ? { s: 'Intervall: x̄ ± z·σ/√n,  σ = ' + stFmt(P.sigma, 1) + ', n = ' + P.n, col: 'M', size: 0.85 } : { s: 'Intervall: p̂ ± z·√(p̂·(1−p̂)/n),  n = ' + P.n, col: 'M', size: 0.85 },
    { s: 'Halbe Breite ≈ ' + stFmt(P.kind === 'mu' ? z * P.sigma / Math.sqrt(P.n) : z * Math.sqrt(P.p * (1 - P.p) / P.n), 3), col: 'M', size: 0.85 }];
  stLines(S, R[1].x, R[1].y, lines, C, { fs: stFitLines(lines, R[1], C) });
  stLineChart(S, R[2], [{ pts: D.hist.map(h => [h[0], h[1]]), col: ST_V }], { title: 'Verlauf: Anteil der überdeckenden Intervalle', xlog: true, xmin: 1, xmax: Math.max(10, m), ymin: 0, ymax: 1, hlines: [{ v: P.level, label: stFmt(P.level, 2), col: ST_R }], xlabel: 'Anzahl Stichproben m (logarithmisch)', yfmt: v => String(Math.round(v * 100) / 100) }, C);
}
ST_SCENES.ci = stSceneCi;

// ── Test-Paradox (Bayes) ──
function stSceneBayes(S, W, H, C) {
  const P = C.P, D = C.D, c = D.counts, N = c.reduce((a, b) => a + b, 0);
  const R = stLayout(W, H, [{ w: 0.5, rows: [1] }, { w: 0.5, rows: [0.42, 0.58] }]);
  const r = R[0], gc = 40, gr = Math.ceil(N / gc), cs = Math.min((r.w - C.fs) / gc, (r.h - C.fs * 4) / gr), x0 = r.x + (r.w - cs * gc) / 2, y0 = r.y + C.fs * 2.2;
  S.text(r.x + r.w / 2, r.y + C.fs * 0.9, N + ' Personen: jeder Punkt ist eine Person', { size: C.fs * 0.95, col: 'T', al: 'c', bold: true });
  const colOf = [ST_R, ST_O, ST_V, ST_G], al = [0.95, 0.9, 0.9, 0.35]; let idx = 0;
  c.forEach((cnt, g) => { for (let t = 0; t < cnt; t++, idx++) S.circ(x0 + (idx % gc + 0.5) * cs, y0 + (Math.floor(idx / gc) + 0.5) * cs, cs * 0.38, { fill: colOf[g], a: al[g] }); });
  const ly = y0 + gr * cs + C.fs * 1.0, names = ['krank, Test positiv', 'krank, Test negativ', 'gesund, Test positiv', 'gesund, Test negativ'];
  names.forEach((nm, g) => { const lx = r.x + (g % 2) * r.w / 2 + C.fs, yy = ly + Math.floor(g / 2) * C.fs * 1.6; S.circ(lx, yy, C.fs * 0.4, { fill: colOf[g], a: al[g] }); S.text(lx + C.fs, yy, nm + ': ' + c[g], { size: C.fs * 0.88, col: 'T', al: 'l', bs: 'm' }); });
  // Vierfeldertafel
  const r1 = R[1], cols = [{ h: '', w: 5.2, al: 'l' }, { h: 'positiv', w: 5 }, { h: 'negativ', w: 5 }, { h: 'Summe', w: 4.6 }];
  const rows = [['krank', String(c[0]), String(c[1]), String(c[0] + c[1])], ['gesund', String(c[2]), String(c[3]), String(c[2] + c[3])], ['Summe', String(c[0] + c[2]), String(c[1] + c[3]), String(N)]];
  rows[0].col = [ST_R, ST_R, ST_O, null]; rows[1].col = [ST_V, ST_V, ST_G, null];
  const tfs = stTableFs(C, { w: r1.w, h: r1.h * 0.9 }, cols, rows.length);
  S.text(r1.x, r1.y + C.fs * 0.5, 'Vierfeldertafel (Anzahl Personen)', { size: C.fs * 0.95, col: 'T', al: 'l', bs: 'm', bold: true });
  stTable(S, r1.x, r1.y + C.fs * 1.3, cols, rows, { fs: tfs, sum: true }, C);
  const pos = c[0] + c[2], post = pos ? c[0] / pos : 0, th = Stat.bayesPosterior(P);
  const lines = [{ s: 'Von allen positiv Getesteten (' + pos + ') sind wirklich krank:', bold: true }, { s: 'P(krank | positiv) = ' + c[0] + '/' + pos + ' = ' + stPct(post), bold: true, col: ST_V, size: 1.25 },
    { s: 'Theorie (Bayes): ' + stFmt(P.sens, 2) + '·' + stFmt(P.prev, 3) + ' / (' + stFmt(P.sens, 2) + '·' + stFmt(P.prev, 3) + ' + ' + stFmt(1 - P.spec, 2) + '·' + stFmt(1 - P.prev, 3) + ') = ' + stPct(th), col: ST_R, size: 0.88 }, null,
    { s: 'Krankheitshäufigkeit ' + stPct(P.prev) + ', Sensitivität ' + stPct(P.sens) + ', Spezifität ' + stPct(P.spec) + '.', col: 'M', size: 0.85 },
    { s: 'Sensitivität = P(positiv | krank),  Spezifität = P(negativ | gesund)', col: 'M', size: 0.82 }];
  stLines(S, R[2].x, R[2].y, lines, C, { fs: stFitLines(lines, R[2], C) });
}
ST_SCENES.bayes = stSceneBayes;

// Gesamtszene für Canvas und Export
function stBuildScene(W, H, C) {
  const S = stScene(), f = ST_SCENES[C.mode];
  if (f) f(S, W, H, C);
  return S;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { stScene, stLayout, stBuildScene, ST_SCENES };
