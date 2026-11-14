// ═══════════════════════════════════════════════════════════════════
// 81_lin_draw.js — Lineare Funktionen: Bilder (Szenen)
//
// Gleiche Bauweise wie Differential- und Integralrechnung (61_dif_draw.js liefert Rahmen, Kurven, Textblöcke,
// Tabellen): jede Ansicht baut eine Szene, die auf den Canvas gemalt (statPaint) und als TikZ ausgegeben
// wird (stSceneTex). Die Achsen haben gleichen Massstab, damit Steigung und Winkel stimmen.
//
// Ansichten:  par   Steigung und y-Achsenabschnitt (Steigungsdreieck, Wertetabelle, Nullstelle)
//             two   Gerade aufstellen (zwei Punkte oder Punkt und Steigung; Parallele, Senkrechte)
//             sys   Schnitt zweier Geraden (Tabelle, Schnittpunkt, Winkel)
//             app   Anwendungen (Tarife, Bewegung): Break-even / Treffpunkt
//             perp  Nullstelle, Senkrechte mit Lotfusspunkt, Mittelsenkrechte
// Kontext C: {view, L, G, win, fs, exp, show, dx, xp, tmode, p1, p2, R, meth, app, pre, xv, pmode}
// Farben: f blau, g violett, Steigung m violett, Δx blau, Δy rot, Nullstelle/Schnittpunkt grün.
// ═══════════════════════════════════════════════════════════════════
const LIN_F = ST_B, LIN_G = ST_V, LIN_DX = ST_B, LIN_DY = ST_R, LIN_PT = ST_G;
const linScene = difScene;
const linFmt = v => (isFinite(v) ? difNum(v, 4) : '?');
const linFmtS = v => (isFinite(v) ? difNum(v, 3) : '?');                // für Punktbeschriftungen (kürzer)
const linQ = q => (q ? Dif.E.qTex(q) : '?');
const linTxt = s => '\\text{' + s + '}';

// ── Bildausschnitt: gleicher Massstab in x und y; Mittelpunkt (0|0) wenn nichts verlangt wird ──
function linNiceUp(v) {
  if (v <= 6) return 6;
  const e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e, c = [1, 1.2, 1.5, 1.8, 2, 2.5, 3, 4, 5, 6, 8, 10].find(x => x >= f - 1e-9);
  return c * e;
}
// ── Ruhiger Bildausschnitt: bleibt stehen, solange alles Wichtige darin Platz hat; sonst gleitet er sanft zum neuen Ziel ──
// (nur auf dem Bildschirm: C.smooth; Export und Tests bekommen das Ziel direkt)
const AUTOWIN = {};
function autoWinRoom(T, f) {                                              // Ziel mit etwas Reserve, damit nicht bei jedem kleinen Schritt neu gezoomt wird
  const cx = (T.x0 + T.x1) / 2, cy = (T.y0 + T.y1) / 2, hx = (T.x1 - T.x0) / 2 * f, hy = (T.y1 - T.y0) / 2 * f;
  return { x0: cx - hx, x1: cx + hx, y0: cy - hy, y1: cy + hy };
}
// Passt der aktuelle Ausschnitt noch? 'ok' | 'out' (ein wichtiger Punkt liegt draussen/am Rand) | 'big' (viel zu weit herausgezoomt)
function autoWinFit(cur, need, T) {
  const mx = (cur.x1 - cur.x0) * 0.05, my = (cur.y1 - cur.y0) * 0.05;
  const inside = (need || []).concat([[0, 0]]).every(p => !isFinite(p[0]) || !isFinite(p[1]) || Math.abs(p[0]) > 1e6 || Math.abs(p[1]) > 1e6 ||
    (p[0] >= cur.x0 + mx && p[0] <= cur.x1 - mx && p[1] >= cur.y0 + my && p[1] <= cur.y1 - my));
  if (!inside) return 'out';
  if (cur.x1 - cur.x0 > 4 * (T.x1 - T.x0) || cur.y1 - cur.y0 > 4 * (T.y1 - T.y0)) return 'big';
  return 'ok';
}
// Ruhiger Ausschnitt: bleibt stehen, solange alles Wichtige Platz hat. Verlässt ein Punkt das Bild, gleitet er sofort (aber sanft)
// zu einem Ziel mit 50 % Reserve; ist das Bild nur viel zu gross, wartet er 0,7 s, ob es so bleibt, bevor er hineinzoomt.
function autoWin(name, key, T, need, C, explicit) {
  if (!C.smooth || typeof performance === 'undefined') return T;
  const st = AUTOWIN[name] || (AUTOWIN[name] = {});
  const now = performance.now();
  if (explicit) { st.cur = Object.assign({}, explicit); st.tgt = null; st.t = now; st.bigSince = 0; return T; }   // gezogen oder gezoomt: Ausschnitt übernehmen
  if (st.key !== key || !st.cur) { st.key = key; st.cur = Object.assign({}, T); st.tgt = null; st.t = now; st.bigSince = 0; return T; }
  const redraw = ms => { if (typeof difRedraw !== 'function') return; if (ms) { clearTimeout(st.tmo); st.tmo = setTimeout(() => difRedraw(), ms); } else if (!st.raf && typeof requestAnimationFrame === 'function') st.raf = requestAnimationFrame(() => { st.raf = 0; difRedraw(); }); };
  if (!st.tgt) {
    const fit = autoWinFit(st.cur, need, T);
    if (fit === 'out') { st.tgt = autoWinRoom(T, 1.5); st.t = now - 16; st.bigSince = 0; }
    else if (fit === 'big') { if (!st.bigSince) st.bigSince = now; if (now - st.bigSince >= 700) { st.tgt = autoWinRoom(T, 1.5); st.t = now - 16; st.bigSince = 0; } else redraw(720 - (now - st.bigSince)); }
    else st.bigSince = 0;
  } else if (autoWinFit(st.tgt, need, T) === 'out') st.tgt = autoWinRoom(T, 1.5);
  if (st.tgt) {
    const dt = Math.min(50, Math.max(1, now - st.t)); st.t = now;
    const k = 1 - Math.exp(-dt / 320), g = st.tgt, c = st.cur;
    ['x0', 'x1', 'y0', 'y1'].forEach(q => { c[q] += (g[q] - c[q]) * k; });
    if (Math.max(Math.abs(g.x0 - c.x0), Math.abs(g.x1 - c.x1), Math.abs(g.y0 - c.y0) * (g.x1 - g.x0) / Math.max(1e-9, g.y1 - g.y0)) < 0.002 * (g.x1 - g.x0)) { st.cur = Object.assign({}, g); st.tgt = null; }
    else redraw(0);
  } else st.t = now;
  return Object.assign({}, st.cur);
}
// need: Punkte [[x,y],…], die im Bild sein sollen
function linWindow(C, r, need) {
  const w = C.win || {};
  if (isFinite(w.x0) && isFinite(w.x1) && isFinite(w.y0) && isFinite(w.y1) && w.x1 > w.x0 && w.y1 > w.y0) { const E = { x0: w.x0, x1: w.x1, y0: w.y0, y1: w.y1 }; return autoWin('lin', '', E, need, C, E); }
  const fs = C.fs, ratio = Math.max(0.25, Math.min(3, (r.h - fs * 4.5) / Math.max(50, r.w - fs * 3.9)));
  let hx = 6;
  (need || []).forEach(p => { if (isFinite(p[0]) && isFinite(p[1])) hx = Math.max(hx, Math.abs(p[0]) * 1.2, Math.abs(p[1]) * 1.2 / ratio); });
  hx = linNiceUp(Math.min(hx, 1e6));
  return autoWin('lin', C.view + '|' + C.pmode + '|' + C.tmode + '|' + (C.pre ? C.pre.name : '') + '|' + ratio.toFixed(2), { x0: -hx, x1: hx, y0: -hx * ratio, y1: hx * ratio }, need, C);
}

// Gerade (auch senkrecht) im Rahmen
function linLine(S, m, L, o) {
  if (!L) return;
  if (L.vert) difSeg(S, m, L.x, m.win.y0 - 1, L.x, m.win.y1 + 1, o);
  else difLine(S, m, 0, L.q, L.m, o);
}
// Punkt mit Beschriftung; id: ziehbar
function linPt(S, m, id, x, y, C, o) {
  o = o || {};
  const P = difDot(S, m, x, y, { fill: o.fill || 'T', stroke: o.stroke || 'T', r: o.r || 5.2 }); if (!P) return null;
  if (id) S.pts.push({ id, x: P[0], y: P[1], r: 11 });
  if (o.hl) shlC(S, o.hl, P[0], P[1], (o.r || 5.2) + 7);
  const rr = (o.r || 5.2) + 2;
  if (o.lab !== undefined) {
    const fs = C.fs, bx = typeof difCellBox === 'function' ? difCellBox(o.lab, fs) : { w: o.est || fs * 4, h: fs * 1.3 };
    let dx = o.dx === undefined ? fs * 0.2 : o.dx, dy = o.dy === undefined ? -fs * 1.45 : o.dy;
    const boxAt = (ddx, ddy) => ({ x0: P[0] + ddx - bx.w / 2, x1: P[0] + ddx + bx.w / 2, y0: P[1] + ddy - bx.h / 2, y1: P[1] + ddy + bx.h / 2 });
    // frei wählen (o.lines: Geraden durch den Punkt meiden) oder feste Lage, die aber bereits belegten Flächen ausweicht
    if (o.lines || difLabHit(S, boxAt(dx, dy)) > 0) { const f = linFree(m, P, o.lines || [], fs, o.w || fs * 7, bx.w, S, bx.h, o.lines ? null : [dx, dy]); dx = f[0]; dy = f[1]; }
    difLabel(S, m, P[0], P[1], o.lab, C, { dx, dy, w: o.w || fs * 7, col: o.col });
  }
  (S.labs || (S.labs = [])).push({ x0: P[0] - rr, x1: P[0] + rr, y0: P[1] - rr, y1: P[1] + rr });   // der Punkt selbst ist belegt
  return P;
}
// Richtung einer Geraden in Weltkoordinaten
const linDir = L => (L.vert ? [0, 1] : [1, L.m]);
// Beschriftung eines Punktes dort, wo sie keine der durchlaufenden Geraden berührt (Weltrichtungen in lines)
function linFree(m, P, lines, fs, w, est, S, lh, pref) {
  const px = m.X(1) - m.X(0), py = m.Y(0) - m.Y(1), hw = (est || fs * 4.2) / 2, k = fs * 0.9 + hw, hh = (lh || fs * 1.3) / 2;
  const dirs = lines.map(d => { const a = [d[0] * px, -d[1] * py], l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; });
  const cands = (pref ? [pref] : []).concat([[0, -fs * 1.7], [0, fs * 1.7], [k, -fs * 1.2], [-k, -fs * 1.2], [k, fs * 1.2], [-k, fs * 1.2], [k + fs, 0], [-k - fs, 0], [0, -fs * 3], [0, fs * 3], [k, -fs * 2.6], [-k, -fs * 2.6], [k, fs * 2.6], [-k, fs * 2.6]]);
  let best = cands[0], bs = -Infinity;
  cands.forEach((c, i) => {
    let sc = dirs.length ? 1e9 : fs * 3;
    for (let ax = -2; ax <= 2; ax++) for (let ay = -1; ay <= 1; ay++) {
      const qx = c[0] + ax * hw / 2, qy = c[1] + ay * fs * 0.45;
      dirs.forEach(d => { sc = Math.min(sc, Math.abs(qx * d[1] - qy * d[0])); });
    }
    sc = Math.min(sc, fs * 3) - i * 0.4 - (Math.abs(c[1]) > fs * 2 ? fs * 0.6 : 0);
    if (S) {                                                            // andere Beschriftungen und Punkte nicht überdecken
      const cx = Math.min(m.R - hw, Math.max(m.L + hw, P[0] + c[0])), b = { x0: cx - hw, x1: cx + hw, y0: P[1] + c[1] - hh, y1: P[1] + c[1] + hh };
      const hit = difLabHit(S, b); if (hit > 0) sc -= fs * 4 + hit / (fs * 2);
      if (b.y0 < m.T - 2 || b.y1 > m.B + 2) sc -= fs * 2;               // nicht aus dem Rahmen
    }
    if (sc > bs) { bs = sc; best = c; }
  });
  return best;
}
const linCoord = (n, x, y) => n + '\\,(' + linFmtS(x) + '\\,|\\,' + linFmtS(y) + ')';
// Rechter-Winkel-Zeichen bei F, zwischen den Richtungen d1 und d2 (Weltkoordinaten)
function linRightMark(S, m, fx, fy, d1, d2, size, col) {
  const p0 = [m.X(fx), m.Y(fy)], v = d => { const q = [m.X(fx + d[0]) - p0[0], m.Y(fy + d[1]) - p0[1]], l = Math.hypot(q[0], q[1]) || 1; return [q[0] / l * size, q[1] / l * size]; };
  const a = v(d1), b = v(d2); if (!isFinite(a[0] + b[0])) return;
  S.poly([[p0[0] + a[0], p0[1] + a[1]], [p0[0] + a[0] + b[0], p0[1] + a[1] + b[1]], [p0[0] + b[0], p0[1] + b[1]]], { col: col || 'T', lw: 1.3 });
}
// Layout: breit zweispaltig, schmal untereinander (dann bekommt das Bild mehr Höhe)
function linLayout(W, H, spec, pw) {
  if (W < 820) { spec = spec.map((c, i) => ({ w: c.w, rows: c.rows.map(x => (i ? x * 0.8 : x)) })); spec[0].rows[0] = pw || 3.2; }
  return stLayout(W, H, spec);
}

// Wertetabelle: rows [[…]], Spalten
function linTab(S, r, cols, rows, hl, C) {
  const fs = C.fs, w0 = cols.reduce((a, c) => a + c.w, 0);
  const hUnit = difTableH(cols, rows, 10) / 10;                         // Höhe pro Schriftgrösse (gemessen, Brüche höher)
  const tfs = Math.max(7.5, Math.min(fs, (r.w - 6) / (w0 + 0.6), (r.h - fs * 0.8) / hUnit));
  const tw = w0 * tfs, x0 = r.x + Math.max(0, (r.w - tw) / 2);
  difTable(S, x0, r.y + tfs * 0.4, cols, rows, tfs, hl, ST_G);
}

// ═════════════ Steigung und y-Achsenabschnitt ═════════════
function linScenePar(S, W, H, C) {
  const L = C.L, fs = C.fs, dx = C.dx || 1, xp = C.xp;
  const R = linLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: [1.45, 1.05] }]);
  const Z = Lin.zero(L), need = [[0, L.q], [xp, L.m * xp + L.q], [xp + dx, L.m * (xp + dx) + L.q]]; if (Z.kind === 'one') need.push([Z.x, 0]);
  const win = linWindow(C, R[0], need);
  const m = difFrame(S, R[0], win, C, { title: '\\col{b}{' + Lin.lineTex(L, 'f(x)') + '}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  const f = x => L.m * x + L.q;
  linLine(S, m, L, { hl: 'g', col: LIN_F, lw: 2.6 });
  // Steigungsdreieck bei P(xp | f(xp))
  const x1 = xp, y1 = f(xp), x2 = xp + dx, y2 = f(x2);
  if (C.show.tri !== false && isFinite(dx) && dx !== 0) {
    difSeg(S, m, x1, y1, x2, y1, { hl: 'tri', col: LIN_DX, lw: 2.4 }); difSeg(S, m, x2, y1, x2, y2, { hl: 'tri', col: LIN_DY, lw: 2.4 });
    const px = m.X((x1 + x2) / 2), py = m.Y(y1);
    difLabel(S, m, px, py + (L.m >= 0 ? fs * 1.6 : -fs * 1.6), '\\col{b}{\\Delta x=' + linFmt(dx) + '}', C, { w: fs * 6 });
    difLabel(S, m, m.X(x2) + fs * 0.4, m.Y((y1 + y2) / 2), '\\col{r}{\\Delta y=' + linFmt(y2 - y1) + '}', C, { w: fs * 6, dx: fs * 3.2 });
  }
  linPt(S, m, 'p', x1, y1, C, { fill: LIN_F });
  // y-Achsenabschnitt
  linPt(S, m, 'q', 0, L.q, C, { fill: ST_V, lab: '\\col{v}{S(0\\,|\\,' + linFmt(L.q) + ')}', w: fs * 7, lines: [[0, 1], linDir(L)] });
  // Nullstelle
  if (C.show.zero !== false && Z.kind === 'one') linPt(S, m, null, Z.x, 0, C, { fill: LIN_PT, lab: '\\col{g}{N(' + linFmtS(Z.x) + '\\,|\\,0)}', w: fs * 7, lines: [[1, 0], linDir(L)] });
  // Tabelle
  const xs = [-3, -2, -1, 0, 1, 2, 3], rows = xs.map(x => [String(x).replace('-', '−'), linFmt(f(x))]);
  linTab(S, R[1], [{ h: 'x', w: 4 }, { h: 'f(x)', w: 6 }], rows, 3, C);
  // Formeln
  const lines = [{ s: '\\col{b}{' + Lin.lineTex(L, 'f(x)') + '}', bold: true }];
  lines.push({ s: '\\col{v}{m}=\\frac{\\col{r}{\\Delta y}}{\\col{b}{\\Delta x}}=\\frac{\\col{r}{' + linFmt(y2 - y1) + '}}{\\col{b}{' + linFmt(dx) + '}}=\\col{v}{' + linQ(L.mq) + '}' });
  lines.push({ s: '\\col{v}{q}=f(0)=\\col{v}{' + linQ(L.qq) + '}' });
  if (Z.kind === 'one') lines.push({ s: 'f(x_0)=0\\ \\Rightarrow\\ x_0=\\col{g}{' + linQ(Z.xq) + '}' });
  else lines.push({ s: Z.kind === 'none' ? '\\text{Keine Nullstelle}' : '\\text{Jede Stelle ist Nullstelle}', col: 'M' });
  lines.push({ s: '\\alpha=\\arctan(m)\\approx ' + linFmt(Lin.angle(L)) + '^{\\circ}', col: 'M', size: 0.95 });
  difLines(S, R[2], lines, C, { max: fs * 1.2 });
}

// ═════════════ Gerade aufstellen ═════════════
function linSceneTwo(S, W, H, C) {
  const fs = C.fs, p1 = C.p1, ps = C.tmode === 'ps';
  const p2 = ps ? [p1[0] + 1, p1[1] + C.tm] : C.p2;
  const R = linLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: [1.05, 1.45] }]);
  const need = [p1, p2]; if (C.show.par || C.show.perp) need.push(C.R);
  const win = linWindow(C, R[0], need);
  const m = difFrame(S, R[0], win, C, { title: ps ? '\\text{Punkt und Steigung}' : '\\text{Zwei Punkte}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  const L = ps ? Lin.fromPointSlope(p1[0], p1[1], C.tm) : Lin.fromPoints(p1[0], p1[1], p2[0], p2[1]);
  linLine(S, m, L, { hl: 'g', col: LIN_F, lw: 2.6 });
  if (!L.vert && !ps && p2[0] !== p1[0] && C.show.tri !== false) {
    difSeg(S, m, p1[0], p1[1], p2[0], p1[1], { hl: 'tri', col: LIN_DX, lw: 2, dash: true }); difSeg(S, m, p2[0], p1[1], p2[0], p2[1], { hl: 'tri', col: LIN_DY, lw: 2, dash: true });
    difLabel(S, m, m.X((p1[0] + p2[0]) / 2), m.Y(p1[1]) + (p2[1] >= p1[1] ? fs * 1.1 : -fs * 1.1), '\\col{b}{\\Delta x=' + linFmt(p2[0] - p1[0]) + '}', C, { w: fs * 6 });
    if (p2[1] !== p1[1]) difLabel(S, m, m.X(p2[0]), m.Y((p1[1] + p2[1]) / 2), '\\col{r}{\\Delta y=' + linFmt(p2[1] - p1[1]) + '}', C, { w: fs * 6, dx: (p2[0] >= p1[0] ? 1 : -1) * fs * 3.6 });
  }
  if (ps) { difSeg(S, m, p1[0], p1[1], p1[0] + 1, p1[1], { col: LIN_DX, lw: 2, dash: true }); difSeg(S, m, p1[0] + 1, p1[1], p1[0] + 1, p1[1] + C.tm, { col: LIN_DY, lw: 2.2 }); difLabel(S, m, m.X(p1[0] + 1), m.Y(p1[1] + C.tm / 2), '\\col{r}{m=' + linFmt(C.tm) + '}', C, { w: fs * 6, dx: fs * 3 }); }
  let N = null, Rl = null;
  if (C.show.par) { N = Lin.parallelThrough(L, C.R[0], C.R[1]); linLine(S, m, N, { hl: 'par', col: ST_G, lw: 2.2 }); }
  if (C.show.perp) { Rl = Lin.perpThrough(L, C.R[0], C.R[1]); linLine(S, m, Rl, { hl: 'perp', col: ST_O, lw: 2.2 }); }
  const triOn = !L.vert && !ps && p2[0] !== p1[0] && C.show.tri !== false;   // Beschriftungen weichen auch dem Steigungsdreieck aus
  linPt(S, m, 'P1', p1[0], p1[1], C, { fill: LIN_F, lab: linCoord('P', p1[0], p1[1]), w: fs * 8, lines: [linDir(L)].concat(triOn ? [[1, 0]] : []) });
  if (ps) linPt(S, m, 'P2', p2[0], p2[1], C, { fill: ST_V, r: 4.6 });
  else linPt(S, m, 'P2', p2[0], p2[1], C, { fill: LIN_F, lab: linCoord('Q', p2[0], p2[1]), w: fs * 8, lines: [linDir(L)].concat(triOn ? [[0, 1]] : []) });
  if (C.show.par || C.show.perp) linPt(S, m, 'R', C.R[0], C.R[1], C, { fill: 'T', lab: linCoord('R', C.R[0], C.R[1]), w: fs * 8, lines: [].concat(N ? [linDir(N)] : [], Rl ? [linDir(Rl)] : [[1, 0]]) });
  // rechts oben: Ergebnis, rechts unten: Rechnung
  const t1 = [], eq = L;
  t1.push({ s: '\\col{b}{' + Lin.lineTex(L) + '}', bold: true, size: 1.1 });
  if (!L.vert) t1.push({ s: '\\col{v}{m}=\\col{v}{' + linQ(L.mq) + '},\\quad \\col{v}{q}=\\col{v}{' + linQ(L.qq) + '}' });
  if (N) t1.push({ s: '\\col{g}{\\text{Parallele: }' + Lin.lineTex(N) + '}' });
  if (Rl) t1.push({ s: '\\col{o}{\\text{Senkrechte: }' + Lin.lineTex(Rl) + '}' });
  difLines(S, R[1], t1, C, { max: fs * 1.2 });
  const lines = [];
  if (L.vert) lines.push({ s: '\\text{Beide Punkte haben dasselbe }x\\text{: keine Funktion.}', col: 'M' });
  else if (ps) {
    lines.push({ s: '\\text{Gegeben: }m=' + linQ(L.mq) + '\\text{ und }P' });
    lines.push({ s: linQ(Lin.Qn(p1[1])) + '=' + (Dif.E.qIsZero(L.mq) ? '' : '(' + linQ(L.mq) + ')\\cdot(' + linQ(Lin.Qn(p1[0])) + ')+') + 'q' });
    lines.push({ s: 'q=\\col{v}{' + linQ(L.qq) + '}' });
  } else {
    const dX = Dif.E.qSub(Lin.Qn(p2[0]), Lin.Qn(p1[0])), dY = Dif.E.qSub(Lin.Qn(p2[1]), Lin.Qn(p1[1]));
    lines.push({ s: '\\col{v}{m}=\\frac{\\col{r}{y_Q-y_P}}{\\col{b}{x_Q-x_P}}=\\frac{\\col{r}{' + linQ(dY) + '}}{\\col{b}{' + linQ(dX) + '}}=\\col{v}{' + linQ(L.mq) + '}' });
    lines.push({ s: 'y_P=m\\cdot x_P+q\\ \\Rightarrow\\ q=\\col{v}{' + linQ(L.qq) + '}' });
  }
  lines.push({ s: Lin.lineTex(L), col: LIN_F, bold: true });
  difLines(S, R[2], lines, C, { max: fs * 1.2 });
}

// ═════════════ Schnitt zweier Geraden ═════════════
function linSceneSys(S, W, H, C) {
  const L1 = C.L, L2 = C.G, fs = C.fs, I = Lin.intersect(L1, L2);
  const R = linLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: [1.45, 1.05] }]);
  const need = [[0, L1.q], [0, L2.q]]; if (I.kind === 'point') need.push([I.x, I.y]);
  const win = linWindow(C, R[0], need);
  const m = difFrame(S, R[0], win, C, { title: '\\col{b}{' + Lin.lineTex(L1, 'f(x)') + '}\\ \\ \\col{v}{' + Lin.lineTex(L2, 'g(x)') + '}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  linLine(S, m, L1, { hl: 'g1', col: LIN_F, lw: 2.6 }); linLine(S, m, L2, { hl: 'g2', col: LIN_G, lw: 2.6 });
  linPt(S, m, 'y1', 0, L1.q, C, { fill: LIN_F, r: 4.4 }); linPt(S, m, 'y2', 0, L2.q, C, { fill: LIN_G, r: 4.4 });
  if (I.kind === 'point') {
    difSeg(S, m, I.x, 0, I.x, I.y, { col: LIN_PT, lw: 1.4, dash: true }); difSeg(S, m, 0, I.y, I.x, I.y, { col: LIN_PT, lw: 1.4, dash: true });
    linPt(S, m, null, I.x, I.y, C, { fill: LIN_PT, r: 6.5, lab: '\\col{g}{S(' + linFmtS(I.x) + '\\,|\\,' + linFmtS(I.y) + ')}', w: fs * 8, lines: [linDir(L1), linDir(L2)] });
  } else S.rich(m.L + (m.R - m.L) / 2, m.T + fs * 1.6, I.kind === 'same' ? '\\text{Die Geraden sind identisch.}' : '\\text{Die Geraden sind parallel: kein Schnittpunkt.}', { size: fs, col: ST_R, al: 'c', bs: 'm' });
  // Tabelle um den Schnittpunkt
  const x0 = I.kind === 'point' ? Math.round(I.x) : 0, xs = [x0 - 2, x0 - 1, x0, x0 + 1, x0 + 2];
  const rows = xs.map(x => [linFmt(x).replace('-', '−'), linFmt(L1.m * x + L1.q), linFmt(L2.m * x + L2.q)]);
  let hl = -1;
  if (I.kind === 'point') { const k = xs.indexOf(I.x); if (k >= 0) hl = k; else { rows.splice(2, 0, ['\\col{g}{' + linFmt(I.x) + '}', '\\col{g}{' + linFmt(I.y) + '}', '\\col{g}{' + linFmt(I.y) + '}']); hl = 2; xs.splice(2, 0, I.x); } }
  linTab(S, R[1], [{ h: 'x', w: 4.2 }, { h: '\\col{b}{f(x)}', w: 5 }, { h: '\\col{v}{g(x)}', w: 5 }], rows, hl, C);
  // Rechnung
  const lines = [];
  const rhs = L => Lin.lineTex(L, '').slice(1);
  if (I.kind === 'point') {
    const meth = C.meth;
    if (meth === 'eq') lines.push({ s: '\\col{b}{' + rhs(L1) + '}=\\col{v}{' + rhs(L2) + '}' });
    else if (meth === 'sub') lines.push({ s: 'y-' + linQ(L2.mq) + 'x=' + linQ(L2.qq) + '\\ \\text{mit }y=' + rhs(L1) });
    else lines.push({ s: '\\text{(I)}-\\text{(II)}\\colon\\ ' + linQ(Dif.E.qNeg(Dif.E.qSub(L1.mq, L2.mq))) + 'x=' + linQ(Dif.E.qNeg(Dif.E.qSub(L2.qq, L1.qq))) });
    lines.push({ s: '(m_1-m_2)\\,x=q_2-q_1\\ \\Rightarrow\\ x=\\col{g}{' + linQ(I.xq) + '}' });
    lines.push({ s: 'y=f(' + linQ(I.xq) + ')=\\col{g}{' + linQ(I.yq) + '}' });
    lines.push(null);
    lines.push({ s: 'S(' + linQ(I.xq) + '\\,|\\,' + linQ(I.yq) + ')', col: LIN_PT, bold: true });
    lines.push({ s: '\\varphi\\approx ' + linFmt(Lin.angleBetween(L1, L2)) + '^{\\circ}', col: 'M', size: 0.95 });
  } else {
    lines.push({ s: '(m_1-m_2)\\,x=q_2-q_1', col: 'M' });
    lines.push({ s: I.kind === 'same' ? '0\\cdot x=0\\ \\Rightarrow\\ \\text{immer erfüllt}' : '0\\cdot x=' + linQ(Dif.E.qSub(L2.qq, L1.qq)) + '\\ \\Rightarrow\\ \\text{keine Lösung}' });
  }
  difLines(S, R[2], lines, C, { max: fs * 1.2 });
}

// ═════════════ Anwendungen ═════════════
function linSceneApp(S, W, H, C) {
  const fs = C.fs, ap = C.app, A = ap.LA, B = ap.LB, I = ap.I, pre = C.pre, move = pre.kind === 'move';
  const R = linLayout(W, H, [{ w: 0.6, rows: [2.3] }, { w: 0.4, rows: [1.35, 1.15] }]);
  let xe = I.kind === 'point' && I.x > 0 ? I.x * 1.8 : 10; if (!(xe > 0)) xe = 10;
  const ys = [A.q, B.q, A.m * xe + A.q, B.m * xe + B.q, I.kind === 'point' ? I.y : 0, 0], lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys), pad = (hi - lo || 1) * 0.12;
  let win = { x0: -xe * 0.08, x1: xe, y0: lo - pad, y1: hi + pad };
  const w = C.win || {}; if (isFinite(w.x0) && isFinite(w.x1) && isFinite(w.y0) && isFinite(w.y1) && w.x1 > w.x0 && w.y1 > w.y0) win = { x0: w.x0, x1: w.x1, y0: w.y0, y1: w.y1 };
  const m = difFrame(S, R[0], win, C, { title: '\\col{b}{A(x)=' + Lin.lineTex(A, '').slice(1) + '}\\ \\ \\col{v}{B(x)=' + Lin.lineTex(B, '').slice(1) + '}', xlab: linTxt(pre.xl), ylab: linTxt(pre.yl) });
  S.maps.main = m;
  const f = L => x => L.m * x + L.q;
  // Bereich, in dem A günstiger ist: dünner Streifen unter der Achse
  linLine(S, m, A, { hl: 'g1', col: LIN_F, lw: 2.6 }); linLine(S, m, B, { hl: 'g2', col: LIN_G, lw: 2.6 });
  const xv = C.xv, ya = f(A)(xv), yb = f(B)(xv);
  difSeg(S, m, xv, win.y0, xv, Math.max(ya, yb), { col: 'M', lw: 1.2, dash: true });
  difDot(S, m, xv, ya, { fill: LIN_F, r: 4.6 }); difDot(S, m, xv, yb, { fill: LIN_G, r: 4.6 });
  const Py = Math.min(m.B, Math.max(m.T, m.Y(0)));
  S.circ(m.X(xv), Py, 5.4, { fill: 'T', stroke: 'T', lw: 1.6 }); S.pts.push({ id: 'xv', x: m.X(xv), y: Py, r: 11 });
  difLabel(S, m, m.X(xv), Py + fs * 1.45, 'x=' + linFmt(xv), C, { w: fs * 4 });
  if (I.kind === 'point' && isFinite(I.x)) {
    if (I.x >= win.x0 && I.x <= win.x1) { difSeg(S, m, I.x, 0, I.x, I.y, { col: LIN_PT, lw: 1.4, dash: true }); }
    linPt(S, m, null, I.x, I.y, C, { fill: LIN_PT, r: 6.5, lab: '\\col{g}{(' + linFmtS(I.x) + '\\,|\\,' + linFmtS(I.y) + ')}', w: fs * 8, lines: [linDir(A), linDir(B)] });
  }
  // Tabelle
  const xt = I.kind === 'point' && I.x > 0 ? [0, I.x / 2, I.x, I.x * 1.5, I.x * 2] : [0, 2, 4, 6, 8, 10];
  const rows = xt.map(x => [linFmt(x), linFmt(A.m * x + A.q), linFmt(B.m * x + B.q)]);
  linTab(S, R[1], [{ h: linTxt(pre.xl), w: 6.2 }, { h: '\\col{b}{A}', w: 4.4 }, { h: '\\col{v}{B}', w: 4.4 }], rows, I.kind === 'point' && I.x > 0 ? 2 : -1, C);
  // Rechnung
  const lines = [];
  lines.push({ s: '\\col{b}{A\\colon\\ \\text{' + pre.A.n + '}}\\quad \\col{v}{B\\colon\\ \\text{' + pre.B.n + '}}', size: 0.95 });
  lines.push({ s: '\\col{b}{A(' + linFmt(xv) + ')=' + linFmt(ya) + '}\\quad \\col{v}{B(' + linFmt(xv) + ')=' + linFmt(yb) + '}' });
  lines.push(null);
  if (I.kind === 'point') {
    lines.push({ s: 'A(x)=B(x)\\ \\Rightarrow\\ x=\\col{g}{' + linQ(I.xq) + '}' });
    lines.push({ s: (move ? '\\text{Treffpunkt}' : '\\text{Break-even}') + '\\colon\\ (' + linQ(I.xq) + '\\,|\\,' + linQ(I.yq) + ')', col: LIN_PT, bold: true });
    if (!move && I.x > 0) lines.push({ s: '\\text{links: }' + (ap.belowA ? '\\col{b}{A}' : '\\col{v}{B}') + '\\text{ günstiger}', col: 'M', size: 0.9 });
  } else lines.push({ s: I.kind === 'same' ? '\\text{Beide Modelle sind gleich.}' : (move ? '\\text{Die beiden treffen sich nie.}' : '\\text{Ein Angebot ist immer günstiger.}'), col: 'M' });
  difLines(S, R[2], lines, C, { max: fs * 1.2 });
}

// ═════════════ Nullstelle, Senkrechte, Mittelsenkrechte ═════════════
function linScenePerp(S, W, H, C) {
  const fs = C.fs, mode = C.pmode, L = C.L;
  const R = linLayout(W, H, [{ w: 0.6, rows: [2.3] }, { w: 0.4, rows: [1] }]);
  const lines = [];
  if (mode === 'zero') {
    const Z = Lin.zero(L), need = [[0, L.q]]; if (Z.kind === 'one') need.push([Z.x, 0]);
    const win = linWindow(C, R[0], need), m = difFrame(S, R[0], win, C, { title: '\\col{b}{' + Lin.lineTex(L, 'f(x)') + '}', xlab: 'x', ylab: 'y' }); S.maps.main = m;
    if (Z.kind === 'one' && L.q !== 0) S.poly([[m.X(0), m.Y(0)], [m.X(Z.x), m.Y(0)], [m.X(0), m.Y(L.q)]], { fill: ST_G, col: ST_G, a: 0.14, close: true, lw: 0.8 });
    linLine(S, m, L, { hl: 'g', col: LIN_F, lw: 2.6 });
    linPt(S, m, 'q', 0, L.q, C, { fill: ST_V, lab: '\\col{v}{S(0\\,|\\,' + linFmt(L.q) + ')}', w: fs * 7, lines: [[0, 1], linDir(L)] });
    if (Z.kind === 'one') linPt(S, m, 'N', Z.x, 0, C, { fill: LIN_PT, lab: '\\col{g}{N(' + linFmtS(Z.x) + '\\,|\\,0)}', w: fs * 7, lines: [[1, 0], linDir(L)] });
    lines.push({ s: '\\col{b}{' + Lin.lineTex(L, 'f(x)') + '}', bold: true });
    lines.push({ s: 'f(x)=0\\colon\\ ' + (Z.kind === 'one' ? Lin.lineTex(L, '').slice(1) + '=0' : '\\text{keine eindeutige Nullstelle}') });
    if (Z.kind === 'one') { lines.push({ s: 'x_0=-\\frac{q}{m}=-\\frac{' + linQ(L.qq) + '}{' + linQ(L.mq) + '}=\\col{g}{' + linQ(Z.xq) + '}' }); lines.push({ s: 'N(' + linQ(Z.xq) + '\\,|\\,0)\\quad S(0\\,|\\,' + linQ(L.qq) + ')', col: LIN_PT, bold: true }); }
  } else if (mode === 'perp') {
    const P = C.R, o = Lin.foot(L, P[0], P[1]), Fp = o.F, win = linWindow(C, R[0], [[0, L.q], P, [Fp.x, Fp.y]]);
    const m = difFrame(S, R[0], win, C, { title: '\\col{b}{' + Lin.lineTex(L, 'g') + '}\\quad \\col{o}{n\\colon\\ ' + Lin.lineTex(o.perp) + '}', xlab: 'x', ylab: 'y' }); S.maps.main = m;
    linLine(S, m, L, { hl: 'g', col: LIN_F, lw: 2.6 }); linLine(S, m, o.perp, { col: ST_O, lw: 2.2 });
    difSeg(S, m, P[0], P[1], Fp.x, Fp.y, { hl: 'lot', col: LIN_DY, lw: 2.6 });
    linRightMark(S, m, Fp.x, Fp.y, [1, L.m], [P[0] - Fp.x, P[1] - Fp.y], Math.max(7, fs * 0.8), 'T');
    linPt(S, m, null, Fp.x, Fp.y, C, { fill: LIN_PT, r: 5.4, lab: '\\col{g}{F(' + linFmtS(Fp.x) + '\\,|\\,' + linFmtS(Fp.y) + ')}', w: fs * 8, lines: [linDir(L), linDir(o.perp)] });
    linPt(S, m, 'R', P[0], P[1], C, { fill: 'T', lab: linCoord('P', P[0], P[1]), w: fs * 8, lines: [linDir(o.perp)] });
    difLabel(S, m, m.X((P[0] + Fp.x) / 2), m.Y((P[1] + Fp.y) / 2), '\\col{r}{d=' + linFmt(o.dist) + '}', C, { w: fs * 6, dx: fs * 2.6 });
    lines.push({ s: '\\col{b}{m}\\cdot\\col{o}{m_{\\perp}}=-1\\ \\Rightarrow\\ \\col{o}{m_{\\perp}}=' + linQ(o.perp.mq || null) });
    lines.push({ s: '\\col{o}{n\\colon\\ ' + Lin.lineTex(o.perp) + '}' });
    lines.push({ s: 'F=g\\cap n=\\col{g}{(' + linQ(Fp.xq) + '\\,|\\,' + linQ(Fp.yq) + ')}' });
    const fe = Dif.E.feSqrtQ(o.d2);
    lines.push({ s: '\\col{r}{d=|PF|}=' + (fe ? Dif.E.feTex(fe) : '\\sqrt{' + linQ(o.d2) + '}') + '\\approx ' + linFmt(o.dist), bold: true });
  } else {
    const A = C.p1, B = C.p2, o = Lin.bisector(A[0], A[1], B[0], B[1]), win = linWindow(C, R[0], [A, B]);
    const m = difFrame(S, R[0], win, C, { title: o ? '\\col{o}{' + Lin.lineTex(o.line) + '}' : '\\text{Mittelsenkrechte}', xlab: 'x', ylab: 'y' }); S.maps.main = m;
    if (o) {
      linLine(S, m, o.line, { col: ST_O, lw: 2.4 });
      difSeg(S, m, A[0], A[1], B[0], B[1], { col: LIN_F, lw: 2.6 });
      const Mx = o.M.x, My = o.M.y, d = o.line.vert ? [0, 1] : [1, o.line.m], nl = Math.hypot(d[0], d[1] * (m.B - m.T) / (win.y1 - win.y0) / ((m.R - m.L) / (win.x1 - win.x0))) || 1;
      const tt = (win.x1 - win.x0) * 0.22 / Math.max(0.2, Math.hypot(d[0], d[1])), T = [Mx + d[0] * tt, My + d[1] * tt];
      difSeg(S, m, T[0], T[1], A[0], A[1], { col: ST_R, lw: 1.5, dash: true }); difSeg(S, m, T[0], T[1], B[0], B[1], { col: ST_R, lw: 1.5, dash: true });
      linRightMark(S, m, Mx, My, [B[0] - A[0], B[1] - A[1]], d, Math.max(7, fs * 0.8), 'T');
      linPt(S, m, null, T[0], T[1], C, { fill: ST_R, r: 3.8 });
      difLabel(S, m, m.X((T[0] + A[0]) / 2), m.Y((T[1] + A[1]) / 2), '\\col{r}{d}', C, { w: fs * 2, dx: -fs * 0.9, dy: -fs * 0.8 }); difLabel(S, m, m.X((T[0] + B[0]) / 2), m.Y((T[1] + B[1]) / 2), '\\col{r}{d}', C, { w: fs * 2, dx: fs * 0.9, dy: -fs * 0.8 });
      linPt(S, m, null, Mx, My, C, { fill: LIN_PT, r: 4.8, lab: '\\col{g}{M(' + linFmtS(Mx) + '\\,|\\,' + linFmtS(My) + ')}', w: fs * 8, lines: [linDir(o.AB), linDir(o.line)] });
    }
    linPt(S, m, 'P1', A[0], A[1], C, { fill: LIN_F, lab: linCoord('A', A[0], A[1]), w: fs * 8, lines: [o ? linDir(o.AB) : [1, 0]] });
    linPt(S, m, 'P2', B[0], B[1], C, { fill: LIN_F, lab: linCoord('B', B[0], B[1]), w: fs * 8, lines: [o ? linDir(o.AB) : [1, 0]] });
    if (!o) lines.push({ s: '\\text{A und B fallen zusammen.}', col: 'M' });
    else {
      lines.push({ s: '\\col{g}{M}=\\left(\\frac{x_A+x_B}{2}\\,|\\,\\frac{y_A+y_B}{2}\\right)=\\col{g}{(' + linQ(o.M.xq) + '\\,|\\,' + linQ(o.M.yq) + ')}' });
      if (!o.AB.vert && !Dif.E.qIsZero(o.AB.mq)) lines.push({ s: 'm_{AB}=' + linQ(o.AB.mq) + '\\ \\Rightarrow\\ m=-\\frac{1}{m_{AB}}=\\col{o}{' + linQ(o.line.mq) + '}' });
      lines.push({ s: '\\col{o}{' + Lin.lineTex(o.line) + '}', bold: true });
    }
  }
  difLines(S, R[1], lines, C, { max: fs * 1.2 });
}

const LIN_SCENES = { par: linScenePar, two: linSceneTwo, sys: linSceneSys, app: linSceneApp, perp: linScenePerp };
function linBuildScene(W, H, C) {
  const S = linScene(), fn = LIN_SCENES[C.view];
  if (fn) fn(S, W, H, C);
  return S;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { linBuildScene, LIN_SCENES, linWindow };
