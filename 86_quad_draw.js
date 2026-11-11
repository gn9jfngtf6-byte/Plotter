// ═══════════════════════════════════════════════════════════════════
// 86_quad_draw.js — Quadratische Funktionen: Bilder (Szenen)
//
// Gleiche Bauweise wie die linearen Funktionen (81_lin_draw.js liefert Hilfen: linPt, linFree, linLayout, linTab, linFmt …)
// und die Differentialrechnung (61_dif_draw.js: Rahmen, Kurven, Textblöcke, Tabellen). Gleicher Massstab in x und y.
//
// Ansichten:  par   Parameter und drei Formen (Normalparabel, a-Griff, Scheitel, Nullstellen, Tabelle)
//             vtx   Scheitelpunkt und quadratische Ergänzung (Normalparabel wird gestreckt und verschoben)
//             zer   Nullstellen und Diskriminante (Mitternachtsformel, quadratische Ergänzung, Vieta)
//             cmb   Parabel und Gerade (Sekante, Tangente, Passante) / Parabel aus Punkten
// Kontext C: {view, Q, win, fs, exp, show, form, method, mode, L, x0, P, sv, pp, n1, n2, tt}
// Farben: Parabel blau, Scheitel violett, Nullstellen grün, y-Achsenabschnitt orange, Streckfaktor a rot.
// ═══════════════════════════════════════════════════════════════════
const QD_F = ST_B, QD_S = ST_V, QD_N = ST_G, QD_Y = ST_O, QD_A = ST_R;
const quadFn = Q => difRaw(x => Q.a * x * x + Q.b * x + Q.c, difRN(Q.a) + '*x^2+' + difRN(Q.b) + '*x+' + difRN(Q.c));

// ── Bildausschnitt: Rahmen um die wichtigen Punkte (und den Ursprung), gleicher Massstab ──
function quadNiceUp(v) {
  if (v <= 4) return 4;
  const e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e, c = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(x => x >= f - 1e-9);
  return c * e;
}
function quadWindow(C, r, need) {
  const w = C.win || {};
  if (isFinite(w.x0) && isFinite(w.x1) && isFinite(w.y0) && isFinite(w.y1) && w.x1 > w.x0 && w.y1 > w.y0) { const E = { x0: w.x0, x1: w.x1, y0: w.y0, y1: w.y1 }; return autoWin('quad', '', E, need, C, E); }
  const fs = C.fs, ratio = Math.max(0.25, Math.min(3, (r.h - fs * 4.5) / Math.max(50, r.w - fs * 3.9)));
  let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
  (need || []).forEach(p => { if (isFinite(p[0]) && isFinite(p[1]) && Math.abs(p[0]) < 1e6 && Math.abs(p[1]) < 1e6) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } });
  const cx = Math.round((x0 + x1) / 2 * 2) / 2, cy = Math.round((y0 + y1) / 2 * 2) / 2;
  const hx = quadNiceUp(Math.max((x1 - x0) / 2 * 1.3, (y1 - y0) / 2 * 1.3 / ratio, 3.5));
  return autoWin('quad', C.view + '|' + C.mode + '|' + ratio.toFixed(2), { x0: cx - hx, x1: cx + hx, y0: cy - hx * ratio, y1: cy + hx * ratio }, need, C);
}
// wichtige Punkte einer Parabel (für den Ausschnitt)
function quadNeed(Q, extra) {
  const need = [[0, Q.c]].concat(extra || []), v = Quad.vertex(Q);
  if (v) { need.push([v.x, v.y]); const R = Quad.roots(Q); if (R.kind === 'two') need.push([R.x1, 0], [R.x2, 0]); else if (R.kind === 'one') need.push([R.x1, 0]); }
  return need;
}
const quadCurve = (S, m, Q, o) => difCurve(S, m, quadFn(Q), Object.assign({ col: QD_F, lw: 2.6, hl: 'f' }, o || {}));
const quadDeg = (S, m, C, txt) => S.rich(m.L + (m.R - m.L) / 2, m.T + C.fs * 1.5, '\\text{' + txt + '}', { size: C.fs * 0.95, col: ST_R, al: 'c', bs: 'm' });

// Beschriftung: Punkt mit Koordinaten
const quadCoord = (n, x, y) => n + '(' + linFmtS(x) + '\\,|\\,' + linFmtS(y) + ')';
const quadSlope = (Q, x) => 2 * Q.a * x + Q.b;
// Richtung der Tangente im Punkt x (Welt)
const quadTanDir = (Q, x) => [1, quadSlope(Q, x)];

// ═════════════ Parameter und drei Formen ═════════════
function quadScenePar(S, W, H, C) {
  const Q = C.Q, fs = C.fs, v = Quad.vertex(Q), R3 = Quad.roots(Q);
  const wide = W >= 820;
  const R = linLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: wide ? [1.25, 1.05, 1.5] : [1.6, 1.3] }]);
  const need = quadNeed(Q, v ? [[v.x + 1, v.y + Q.a]] : []);
  const win = quadWindow(C, R[0], need);
  const m = difFrame(S, R[0], win, C, { title: '\\col{b}{' + Quad.stdTex(Q, 'f(x)') + '}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (Q.deg) { quadCurve(S, m, Q); quadDeg(S, m, C, 'Für a = 0 ist es eine Gerade.'); return; }
  if (C.show.normal) difCurve(S, m, difRaw(x => x * x, 'x^2'), { col: 'M', lw: 1.6, dash: true, a: 0.75, exp: C.exp });
  if (C.show.axis) difSeg(S, m, v.x, win.y0 - 1, v.x, win.y1 + 1, { col: QD_S, lw: 1.3, dash: true, a: 0.8 });
  quadCurve(S, m, Q, { exp: C.exp });
  // Streckfaktor: 1 nach rechts, a nach oben
  difSeg(S, m, v.x, v.y, v.x + 1, v.y, { col: ST_B, lw: 2, dash: true }); difSeg(S, m, v.x + 1, v.y, v.x + 1, v.y + Q.a, { col: QD_A, lw: 2.4 });
  difLabel(S, m, m.X(v.x + 0.5), m.Y(v.y), '\\col{b}{1}', C, { w: fs * 2, dy: Q.a >= 0 ? fs * 1.15 : -fs * 1.15 });
  linPt(S, m, 'A', v.x + 1, v.y + Q.a, C, { fill: QD_A, r: 4.8, lab: '\\col{r}{a=' + linFmt(Q.a) + '}', lines: [[1, quadSlope(Q, v.x + 1)]], w: fs * 5 });
  if (R3.kind === 'two') { linPt(S, m, 'N1', R3.x1, 0, C, { fill: QD_N, lab: '\\col{g}{N_1}', dy: fs * 1.5, dx: 0, w: fs * 3 }); linPt(S, m, 'N2', R3.x2, 0, C, { fill: QD_N, lab: '\\col{g}{N_2}', dy: fs * 1.5, dx: 0, w: fs * 3 }); }
  else if (R3.kind === 'one') linPt(S, m, null, R3.x1, 0, C, { fill: QD_N, lab: '\\col{g}{N}', dy: fs * 1.5, dx: 0, w: fs * 3 });
  linPt(S, m, 'c', 0, Q.c, C, { fill: QD_Y, r: 4.8, lab: '\\col{o}{c=' + linFmt(Q.c) + '}', lines: [[0, 1], quadTanDir(Q, 0)], w: fs * 5 });
  linPt(S, m, 'S', v.x, v.y, C, { fill: QD_S, r: 5.8, lab: '\\col{v}{' + quadCoord('S', v.x, v.y) + '}', lines: [[1, 0], [0, 1]], w: fs * 8 });
  // rechts: drei Formen, Kenndaten, Wertetabelle
  const f3 = Quad.factorTex(Q, 'y'), act = C.form;
  const forms = [{ s: '\\text{Standardform}', col: 'M', size: 0.8 }, { s: '\\col{b}{' + Quad.stdTex(Q) + '}', bold: act === 'std' },
    { s: '\\text{Scheitelform}', col: 'M', size: 0.8 }, { s: '\\col{v}{' + Quad.vertexTex(Q) + '}', bold: act === 'vert' },
    { s: '\\text{Nullstellenform}', col: 'M', size: 0.8 }, f3 ? { s: '\\col{g}{' + f3 + '}', bold: act === 'fact' } : { s: '\\text{keine Nullstellen}', col: 'M' }];
  difLines(S, R[1], forms, C, { max: fs * 1.15 });
  const D = Quad.disc(Q), info = [];
  info.push({ s: Q.a > 0 ? '\\text{nach oben geöffnet}\\colon\\ \\text{Minimum}' : '\\text{nach unten geöffnet}\\colon\\ \\text{Maximum}', col: 'M', size: 0.9 });
  info.push({ s: Math.abs(Q.a) > 1 ? '|a|>1\\colon\\ \\text{enger als die Normalparabel}' : Math.abs(Q.a) < 1 ? '|a|<1\\colon\\ \\text{weiter als die Normalparabel}' : '|a|=1\\colon\\ \\text{wie die Normalparabel}', col: 'M', size: 0.9 });
  info.push({ s: '\\col{v}{S(' + linQ(v.xq) + '\\,|\\,' + linQ(v.yq) + ')}\\quad x=' + linQ(v.xq), size: 0.95 });
  info.push({ s: 'D=b^2-4ac=\\col{o}{' + linQ(D) + '}\\ \\Rightarrow\\ ' + (R3.kind === 'two' ? '\\text{zwei Nullstellen}' : R3.kind === 'one' ? '\\text{eine Nullstelle}' : '\\text{keine Nullstelle}'), size: 0.95 });
  difLines(S, R[2], info, C, { max: fs * 1.1 });
  if (!wide) return;
  const x0 = Math.round(v.x), xs = [-3, -2, -1, 0, 1, 2, 3].map(k => x0 + k), f = quadFn(Q);
  const rows = xs.map(x => [linFmt(x).replace('-', '−'), linFmt(f(x))]);
  linTab(S, R[3], [{ h: 'x', w: 4 }, { h: 'f(x)', w: 6 }], rows, Math.abs(v.x - x0) < 1e-9 ? 3 : -1, C);
}

// ═════════════ Scheitelpunkt und quadratische Ergänzung ═════════════
function quadSceneVtx(S, W, H, C) {
  const Q = C.Q, fs = C.fs, v = Quad.vertex(Q), t = C.tt === undefined ? 1 : C.tt;
  const R = linLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: [1.7, 0.7] }]);
  const need = quadNeed(Q, []);
  const win = quadWindow(C, R[0], need);
  const u1 = Math.max(0, Math.min(1, t * 3)), u2 = Math.max(0, Math.min(1, t * 3 - 1)), u3 = Math.max(0, Math.min(1, t * 3 - 2));
  const stage = t >= 1 ? '\\col{v}{y=a(x-x_s)^2+y_s}' : u2 === 0 ? '\\col{r}{\\text{1. Strecken mit a}}' : u3 === 0 ? '\\col{b}{\\text{2. Verschieben in x-Richtung}}' : '\\col{g}{\\text{3. Verschieben in y-Richtung}}';
  const m = difFrame(S, R[0], win, C, { title: stage, xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (Q.deg) { quadCurve(S, m, Q); quadDeg(S, m, C, 'Für a = 0 ist es eine Gerade.'); return; }
  const s = 1 + (Q.a - 1) * u1, xv = v.x * u2, yv = v.y * u3;
  difCurve(S, m, difRaw(x => x * x, 'x^2'), { hl: 'np', col: 'M', lw: 1.6, dash: true, a: 0.75, exp: C.exp });
  if (t < 1) quadCurve(S, m, Q, { lw: 1.4, dash: true, a: 0.45, col: QD_S, exp: C.exp });
  difSeg(S, m, xv, win.y0 - 1, xv, win.y1 + 1, { col: QD_S, lw: 1.3, dash: true, a: 0.8 });
  difCurve(S, m, difRaw(x => s * (x - xv) * (x - xv) + yv, difRN(s) + '*(x-' + difRN(xv) + ')^2+' + difRN(yv)), { hl: 'f', col: QD_F, lw: 2.8, exp: C.exp });
  if (u2 > 0 && v.x !== 0) difSeg(S, m, 0, 0, xv, 0, { hl: 'sh', col: ST_B, lw: 2.4 });
  if (u3 > 0 && v.y !== 0) difSeg(S, m, xv, 0, xv, yv, { hl: 'sh', col: ST_G, lw: 2.4 });
  linPt(S, m, null, xv, yv, C, { fill: QD_S, r: 6, lab: '\\col{v}{' + quadCoord('S', xv, yv) + '}', lines: [[1, 0], [0, 1]], w: fs * 8 });
  difLabel(S, m, m.X(win.x1) - fs * 4.2, m.T + fs * 1.6, '\\col{r}{a=' + linFmt(s) + '}', C, { w: fs * 5 });
  difLines(S, R[1], Quad.sceneLines(Quad.st.vtx(Q, { short: true })), C, { max: fs * 1.15 });
  const info = [{ s: Q.a > 0 ? '\\text{nach oben geöffnet}\\colon\\ \\text{Minimum}' : '\\text{nach unten geöffnet}\\colon\\ \\text{Maximum}', col: 'M', size: 0.9 }, { s: '\\col{v}{S(' + linQ(v.xq) + '\\,|\\,' + linQ(v.yq) + ')}\\quad x=' + linQ(v.xq), bold: true }];
  difLines(S, R[2], info, C, { max: fs * 1.1 });
}

// ═════════════ Nullstellen und Diskriminante ═════════════
function quadSceneZer(S, W, H, C) {
  const Q = C.Q, fs = C.fs, v = Quad.vertex(Q), R3 = Quad.roots(Q);
  const R = linLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: [2.0, 1.0] }]);
  const win = quadWindow(C, R[0], quadNeed(Q, []));
  const m = difFrame(S, R[0], win, C, { title: '\\col{b}{' + Quad.stdTex(Q, 'f(x)') + '}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (Q.deg) { quadCurve(S, m, Q); quadDeg(S, m, C, 'Für a = 0 ist es eine Gerade.'); return; }
  if (v) difSeg(S, m, v.x, win.y0 - 1, v.x, win.y1 + 1, { col: QD_S, lw: 1.2, dash: true, a: 0.6 });
  quadCurve(S, m, Q, { exp: C.exp });
  if (R3.kind === 'two') {
    linPt(S, m, 'N1', R3.x1, 0, C, { fill: QD_N, r: 5.6, lab: '\\col{g}{' + quadCoord('N_1', R3.x1, 0) + '}', lines: [[1, 0], quadTanDir(Q, R3.x1)], w: fs * 8 });
    linPt(S, m, 'N2', R3.x2, 0, C, { fill: QD_N, r: 5.6, lab: '\\col{g}{' + quadCoord('N_2', R3.x2, 0) + '}', lines: [[1, 0], quadTanDir(Q, R3.x2)], w: fs * 8 });
  } else if (R3.kind === 'one') linPt(S, m, null, R3.x1, 0, C, { fill: QD_Y, r: 5.8, lab: '\\col{o}{' + quadCoord('N', R3.x1, 0) + '}', lines: [[1, 0]], w: fs * 8 });
  if (v) linPt(S, m, 'S', v.x, v.y, C, { fill: QD_S, r: 4.8 });
  linPt(S, m, 'c', 0, Q.c, C, { fill: QD_Y, r: 4.6 });
  difLines(S, R[1], Quad.sceneLines(Quad.st.roots(Q, C.method)), C, { max: fs * 1.15 });
  const Dq = Quad.disc(Q), word = R3.kind === 'two' ? '\\text{zwei Nullstellen}' : R3.kind === 'one' ? '\\text{eine Nullstelle}' : '\\text{keine Nullstelle}', rel = R3.kind === 'two' ? '>0' : R3.kind === 'one' ? '=0' : '<0';
  // Rechnung der Diskriminante mit den aktuellen Zahlen; während der Animation als Kasten hervorgehoben (am Halt bei D = 0 kräftig)
  const kc = R3.kind === 'two' ? 'g' : R3.kind === 'one' ? 'o' : 'r', kcol = R3.kind === 'two' ? ST_G : R3.kind === 'one' ? ST_O : ST_R, pz = x => (x < 0 ? '(' + linFmt(x) + ')' : linFmt(x));
  const dCalc = 'D=b^2-4ac=' + pz(Q.b) + '^2-4\\cdot ' + pz(Q.a) + '\\cdot ' + pz(Q.c) + '=' + (Dq && Math.abs(Number(Dq.d)) === 1 ? linQ(Dq) : linFmt(Math.round((Q.b * Q.b - 4 * Q.a * Q.c) * 1e4) / 1e4));
  const info = [{ s: '\\col{' + kc + '}{' + dCalc + '}', bold: true }, { s: '\\col{' + kc + '}{D' + rel + '\\colon\\ ' + word + '}', bold: true }];
  if (C.zerAnim) {
    // Kasten im Bild (auch wenn rechts die Rechenweg-Karte liegt): in der freien Ecke gegenüber der Parabelöffnung
    const stop = C.zerAnim === 'stop', z = fs * (stop ? 1.25 : 1.1), l1 = '\\col{' + kc + '}{' + dCalc + '}', l2 = '\\col{' + kc + '}{D' + rel + '\\colon\\ ' + word + '}', l3 = stop ? '\\text{Der Scheitel liegt auf der x-Achse.}' : null;
    const wd = t => (typeof finRichSize === 'function' ? finRichSize(t, z).w : difCellBox(t, z).w), bw = Math.min(m.R - m.L - fs * 1.6, Math.max(wd(l1) * 1.1, wd(l2) * 1.1, l3 ? wd(l3) : 0) + fs * 2.0), lh = z * 1.75, bh = lh * (l3 ? 3 : 2) + fs * 0.7;
    const bx = m.L + fs * 0.8, by = Q.a > 0 ? m.B - bh - fs * 4.6 : m.T + fs * 2.0;   // unten Platz lassen (dort erscheinen Hinweise)
    S.rect(bx, by, bw, bh, { fill: 'W', a: 0.94, r: 8, noclip: true });
    S.rect(bx, by, bw, bh, { fill: kcol, a: stop ? 0.24 : 0.1, stroke: kcol, lw: stop ? 2.6 : 1.3, r: 8, noclip: true });
    [l1, l2, l3].filter(Boolean).forEach((t, i) => S.rich(bx + fs * 0.8, by + fs * 0.35 + lh * (i + 0.5), t, { size: z, col: 'T', al: 'l', bs: 'm', bold: i < 2 }));
  }
  if (R3.kind === 'two') { info.push({ s: '\\col{g}{N_1(' + linQ2(R3.fe1) + '\\,|\\,0)}\\quad \\col{g}{N_2(' + linQ2(R3.fe2) + '\\,|\\,0)}', bold: true }); }
  else if (R3.kind === 'one') info.push({ s: '\\col{o}{N(' + linQ2(R3.fe1) + '\\,|\\,0)}', bold: true });
  else info.push({ s: '\\text{Die Parabel liegt ganz ' + (Q.a > 0 ? 'oberhalb' : 'unterhalb') + ' der x-Achse.}', col: 'M' });
  difLines(S, R[2], info, C, { max: fs * 1.1 });
}
const linQ2 = f => Dif.E.feTex(f);

// ═════════════ Parabel und Gerade / Parabel aus Punkten ═════════════
function quadSceneCmb(S, W, H, C) {
  const Q = C.Q, fs = C.fs, mode = C.mode;
  const R = linLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: [2.4, 0.9] }]);
  const bad = !Q;
  let titleTex, need = [], pts = [];
  if (mode === 'line') {
    const W2 = Quad.withLine(Q, C.L);
    need = quadNeed(Q, [[0, C.L.vert ? 0 : C.L.q]].concat(W2.pts.map(p => [p.x, p.y])));
    if (C.show.tan) need.push([C.x0, quadFn(Q)(C.x0)]);
    titleTex = '\\col{b}{' + Quad.stdTex(Q, 'f(x)') + '}\\ \\ \\col{o}{' + Lin.lineTex(C.L, 'g(x)') + '}';
    if (C.L.vert) titleTex = '\\col{b}{' + Quad.stdTex(Q, 'f(x)') + '}\\ \\ \\col{o}{' + Lin.lineTex(C.L) + '}';
  } else if (mode === 'pts') { need = C.P.slice(); titleTex = bad ? '\\text{Drei Punkte}' : '\\col{b}{' + Quad.stdTex(Q, 'f(x)') + '}'; }
  else if (mode === 'vp') { need = [C.sv, C.pp]; titleTex = bad ? '\\text{Scheitelpunkt und Punkt}' : '\\col{b}{' + Quad.stdTex(Q, 'f(x)') + '}'; }
  else { need = [[C.n1, 0], [C.n2, 0], C.pp]; titleTex = bad ? '\\text{Nullstellen und Punkt}' : '\\col{b}{' + Quad.stdTex(Q, 'f(x)') + '}'; }
  if (Q && !Q.deg && mode !== 'line') need = need.concat(quadNeed(Q, []));
  const win = quadWindow(C, R[0], need);
  const m = difFrame(S, R[0], win, C, { title: titleTex, xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  const lines = [], info = [];
  if (mode === 'line') {
    const L = C.L, W2 = Quad.withLine(Q, L), f = quadFn(Q);
    quadCurve(S, m, Q, { exp: C.exp });
    linLine(S, m, L, { hl: 'L', col: QD_Y, lw: 2.4 });
    if (!L.vert) { linPt(S, m, 'y1', 0, L.q, C, { fill: QD_Y, r: 4.6 }); linPt(S, m, 'lm', 1, L.m + L.q, C, { fill: ST_R, r: 4 }); }
    else linPt(S, m, 'lx', L.x, win.y0 + (win.y1 - win.y0) * 0.1, C, { fill: QD_Y, r: 4.6 });
    const word = W2.kind === 'secant' ? '\\text{Sekante: zwei Schnittpunkte}' : W2.kind === 'tangent' ? '\\text{Tangente: ein Berührpunkt}' : W2.kind === 'passant' ? '\\text{Passante: kein Schnittpunkt}' : '\\text{ein Schnittpunkt}';
    const colw = W2.kind === 'secant' || W2.kind === 'vert' ? QD_N : W2.kind === 'tangent' ? QD_Y : QD_A;
    W2.pts.forEach((p, i) => linPt(S, m, null, p.x, p.y, C, { fill: colw, r: 6, lab: '\\col{' + (W2.kind === 'tangent' ? 'o' : 'g') + '}{' + quadCoord(W2.kind === 'tangent' ? 'B' : 'S_' + (i + 1), p.x, p.y) + '}', lines: [linDir(L), quadTanDir(Q, p.x)], w: fs * 8.5 }));
    if (C.show.tan) {
      const T = Quad.tangentAt(Q, C.x0);
      linLine(S, m, T, { col: QD_S, lw: 2, dash: true });
      linPt(S, m, 'T', C.x0, f(C.x0), C, { fill: QD_S, r: 5.2, lab: '\\col{v}{' + quadCoord('T', C.x0, f(C.x0)) + '}', lines: [linDir(T)], w: fs * 8 });
    }
    info.push({ s: word, col: colw, bold: true });
    Quad.sceneLines(Quad.st.line(Q, L)).forEach(l => lines.push(l));
    if (C.show.tan) { info.push({ s: '\\col{v}{\\text{Tangente}\\colon\\ ' + Lin.lineTex(Quad.tangentAt(Q, C.x0)) + '}', bold: true }); }
  } else {
    const P = mode === 'pts' ? C.P : mode === 'vp' ? [C.sv, C.pp] : [[C.n1, 0], [C.n2, 0], C.pp];
    if (bad) quadDeg(S, m, C, mode === 'pts' ? 'Zwei Punkte haben dasselbe x: keine Funktion.' : 'a ist nicht bestimmt: P liegt auf der Achse oder einer Nullstelle.');
    else if (Q.deg) { linLine(S, m, Lin.mkQ(Q.bq, Q.cq), { col: QD_F, lw: 2.4 }); quadDeg(S, m, C, 'Die Punkte liegen auf einer Geraden: keine Parabel.'); }
    else {
      quadCurve(S, m, Q, { exp: C.exp });
      const v = Quad.vertex(Q); if (v && mode !== 'vp') linPt(S, m, null, v.x, v.y, C, { fill: QD_S, r: 4.4, lab: '\\col{v}{' + quadCoord('S', v.x, v.y) + '}', lines: [[1, 0], [0, 1]], w: fs * 8 });
    }
    if (mode === 'pts') P.forEach((p, i) => linPt(S, m, 'P' + (i + 1), p[0], p[1], C, { fill: ST_B, r: 5.4, lab: quadCoord('P_' + (i + 1), p[0], p[1]), lines: Q && !Q.deg ? [quadTanDir(Q, p[0])] : [[1, 0]], w: fs * 8 }));
    else if (mode === 'vp') {
      linPt(S, m, 'S', C.sv[0], C.sv[1], C, { fill: QD_S, r: 5.8, lab: '\\col{v}{' + quadCoord('S', C.sv[0], C.sv[1]) + '}', lines: [[1, 0], [0, 1]], w: fs * 8 });
      linPt(S, m, 'P', C.pp[0], C.pp[1], C, { fill: ST_B, r: 5.4, lab: quadCoord('P', C.pp[0], C.pp[1]), lines: Q && !Q.deg ? [quadTanDir(Q, C.pp[0])] : [[1, 0]], w: fs * 8 });
    } else {
      linPt(S, m, 'N1', C.n1, 0, C, { fill: QD_N, r: 5.6, lab: '\\col{g}{' + quadCoord('N_1', C.n1, 0) + '}', lines: [[1, 0], Q && !Q.deg ? quadTanDir(Q, C.n1) : [0, 1]], w: fs * 8 });
      linPt(S, m, 'N2', C.n2, 0, C, { fill: QD_N, r: 5.6, lab: '\\col{g}{' + quadCoord('N_2', C.n2, 0) + '}', lines: [[1, 0], Q && !Q.deg ? quadTanDir(Q, C.n2) : [0, 1]], w: fs * 8 });
      linPt(S, m, 'P', C.pp[0], C.pp[1], C, { fill: ST_B, r: 5.4, lab: quadCoord('P', C.pp[0], C.pp[1]), lines: Q && !Q.deg ? [quadTanDir(Q, C.pp[0])] : [[1, 0]], w: fs * 8 });
    }
    const r = mode === 'pts' ? Quad.st.pts(P[0], P[1], P[2]) : mode === 'vp' ? Quad.st.vp(P[0], P[1]) : Quad.st.np(P[0], P[1], P[2]);
    Quad.sceneLines(r).forEach(l => lines.push(l));
  }
  difLines(S, R[1], lines, C, { max: fs * 1.15 });
  difLines(S, R[2], info, C, { max: fs * 1.1 });
}

// ═════════════ Quadratische Optimierung: Preis, Umsatz, Kosten, Gewinn ═════════════
function quadSceneOpt(S, W, H, C) {
  const M = Quad.optModel(C.oA, C.oB, C.oKf, C.okv), fs = C.fs, p = Math.max(0, Math.min(M.pMax, C.op));
  const R = linLayout(W, H, [{ w: 0.64, rows: [1] }, { w: 0.36, rows: [1.1, 1] }], 2);
  let win = C.win || {};
  if (!(isFinite(win.x0) && isFinite(win.x1) && win.x1 > win.x0 && isFinite(win.y0) && isFinite(win.y1) && win.y1 > win.y0)) {
    const hi = Math.max(M.U(M.pU), M.K(0), M.G(M.pG)), lo = Math.min(0, M.G(0), M.G(M.pMax), M.K(M.pMax));
    win = { x0: -M.pMax * 0.04, x1: M.pMax * 1.06, y0: lo - (hi - lo) * 0.06, y1: hi + (hi - lo) * 0.12 };
  }
  const m = difFrame(S, R[0], win, C, { title: '\\col{b}{U}\\text{, }\\col{o}{K}\\text{ und }\\col{g}{G}\\text{ in Abhängigkeit vom Preis}', xlab: 'p', ylab: '\\text{Fr.}' });
  S.maps.main = m;
  const dom = f => q => (q >= 0 && q <= M.pMax ? f(q) : NaN);
  difCurve(S, m, dom(M.K), { col: ST_O, lw: 2.2, hl: 'K', exp: C.exp });
  difCurve(S, m, dom(M.U), { col: ST_B, lw: 2.6, hl: 'U', exp: C.exp });
  difCurve(S, m, dom(M.G), { col: ST_G, lw: 2.6, hl: 'G', exp: C.exp });
  // Gewinnzone
  if (M.zeros.length) { const z0 = Math.max(0, M.zeros[0]), z1 = Math.min(M.pMax, M.zeros[1]); if (z1 > z0) { const pts = [[m.X(z0), m.Y(0)]]; for (let i = 0; i <= 40; i++) { const q = z0 + (z1 - z0) * i / 40; pts.push([m.X(q), m.Y(M.G(q))]); } pts.push([m.X(z1), m.Y(0)]); S.poly(shlP(S, 'Gz', pts), { fill: ST_G, col: ST_G, a: 0.14, close: true, lw: 0.5 }); } }
  // besondere Punkte
  linPt(S, m, null, M.pU, M.U(M.pU), C, { fill: ST_B, r: 5.4, hl: 'Um', lab: '\\col{b}{U_{max}=' + linFmt(M.U(M.pU)) + '}', lines: [[1, 0]], w: fs * 8 });
  linPt(S, m, null, M.pG, M.G(M.pG), C, { fill: ST_G, r: 5.4, hl: 'Gm', lab: '\\col{g}{G_{max}=' + linFmt(M.G(M.pG)) + '}', lines: [[1, 0]], w: fs * 8 });
  M.zeros.forEach(z => { if (z >= 0 && z <= M.pMax) linPt(S, m, null, z, 0, C, { fill: ST_G, r: 4.4, hl: 'GS', lab: '\\col{g}{' + linFmt(Math.round(z * 100) / 100) + '}', dy: fs * 1.4, dx: 0, w: fs * 4 }); });
  // gewählter Preis
  const px = m.X(p); S.line(px, m.T, px, m.B, { col: ST_V, lw: 1.1, dash: true, a: 0.8 });
  [[M.U, ST_B], [M.K, ST_O], [M.G, ST_G]].forEach(([f, col]) => difDot(S, m, p, f(p), { fill: col, r: 4 }));
  linPt(S, m, 'p', p, 0, C, { fill: ST_V, r: 6, lab: '\\col{v}{p=' + linFmt(Math.round(p * 100) / 100) + '}', dy: fs * 1.45, dx: 0, w: fs * 5 });
  // rechts oben: Nachfrage
  const w2 = { x0: -M.pMax * 0.04, x1: M.pMax * 1.06, y0: -M.A * 0.06, y1: M.A * 1.12 };
  const m2 = difFrame(S, R[1], w2, C, { title: '\\text{Nachfrage } x(p)', xlab: 'p', ylab: 'x' });
  difSeg(S, m2, 0, M.A, M.pMax, 0, { col: ST_V, lw: 2.4, hl: 'xp' });
  const xp = M.x(p); difSeg(S, m2, p, 0, p, xp, { col: 'M', lw: 1, dash: true }); difSeg(S, m2, 0, xp, p, xp, { col: 'M', lw: 1, dash: true });
  linPt(S, m2, null, p, xp, C, { fill: ST_V, r: 4.6, lab: 'x=' + linFmt(Math.round(xp * 100) / 100), lines: [[1, -M.B]], w: fs * 5 });
  // rechts unten: Werte beim gewählten Preis
  const r2 = v => linFmt(Math.round(v * 100) / 100);
  difLines(S, R[2], [{ s: 'p=' + r2(p) + '\\ \\Rightarrow\\ x=' + r2(xp) }, { s: '\\col{b}{U=p\\cdot x=' + r2(M.U(p)) + '}' }, { s: '\\col{o}{K=' + r2(M.Kf) + '+' + r2(M.kv) + '\\cdot x=' + r2(M.K(p)) + '}' },
    { s: '\\col{g}{G=U-K=' + r2(M.G(p)) + '}', bold: true }, { s: M.G(p) >= 0 ? '\\text{Gewinn}' : '\\text{Verlust}', col: M.G(p) >= 0 ? ST_G : ST_R }], C, { max: fs * 1.1 });
}

const QUAD_SCENES = { par: quadScenePar, vtx: quadSceneVtx, zer: quadSceneZer, cmb: quadSceneCmb, opt: quadSceneOpt };
function quadBuildScene(W, H, C) {
  const S = linScene(), fn = QUAD_SCENES[C.view];
  if (fn) fn(S, W, H, C);
  return S;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { quadBuildScene, QUAD_SCENES, quadWindow };
