// ═══════════════════════════════════════════════════════════════════
// 104_sim_draw.js — Ähnlichkeit: Bilder (Szenen)
//
// Gleiche Bauweise wie 99c_inv_draw.js (Szene aus Linien, Flächen, Rich-Text; statPaint zeichnet, stSceneTex exportiert).
// Gleicher Massstab in x und y (Längen und Winkel sind echt).
// Ansichten:  map    fixes Dreieck ABC und Bild A′B′C′ unter Spiegelung, Drehung, Streckung, Verschiebung
//             test   zwei freie Dreiecke ABC und PQR: Winkel vergleichen, Zuordnung, Seitenverhältnisse
//             ray    Strahlensätze (V- und X-Figur), D wahlweise frei (nicht parallel)
//             right  rechtwinkliges Dreieck mit Höhe: drei ähnliche Dreiecke nebeneinander
// Kontext C: {view, P, T, Q, ray, rt, win, fs, exp, smooth, show}
// Farben: Seite a (gegenüber A) rot, b grün, c blau – entsprechende Seiten haben im Bild dieselbe Farbe.
//         Winkel α orange, β violett, γ schwarz. Bilddreieck violett hinterlegt, Zentrum Z orange.
// ═══════════════════════════════════════════════════════════════════
const SM_SIDE = [ST_R, ST_G, ST_B], SM_SL = ['r', 'g', 'b'], SM_ANG = [ST_O, ST_V, 'T'], SM_AL = ['o', 'v', ''];
const SM_GREEK = ['\\alpha', '\\beta', '\\gamma'];
const smCol = (l, s) => (l ? '\\col{' + l + '}{' + s + '}' : s);

function simWindow(C, r, need, key) {
  const w = C.win || {};
  if (isFinite(w.x0) && isFinite(w.x1) && isFinite(w.y0) && isFinite(w.y1) && w.x1 > w.x0 && w.y1 > w.y0) { const E = { x0: w.x0, x1: w.x1, y0: w.y0, y1: w.y1 }; return autoWin('sim', '', E, need, C, E); }
  const fs = C.fs, ratio = Math.max(0.3, Math.min(3, (r.h - fs * 4.5) / Math.max(50, r.w - fs * 3.9)));
  let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
  need.forEach(p => { if (isFinite(p[0]) && isFinite(p[1]) && Math.abs(p[0]) < 1e4 && Math.abs(p[1]) < 1e4) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } });
  const pad = Math.max(1, 0.12 * Math.max(x1 - x0, y1 - y0)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const hx = Math.ceil((Math.max((x1 - x0) / 2, (y1 - y0) / 2 / ratio) + pad) * 2) / 2;
  return autoWin('sim', C.view + '|' + key + '|' + ratio.toFixed(2), { x0: cx - hx, x1: cx + hx, y0: cy - hx * ratio, y1: cy + hx * ratio }, need, C);
}
const smPx = (m, p) => [m.X(p[0]), m.Y(p[1])];
const smIn = (m, q) => isFinite(q[0]) && isFinite(q[1]) && q[0] >= m.L - 1 && q[0] <= m.R + 1 && q[1] >= m.T - 1 && q[1] <= m.B + 1;

// Dreieck: Fläche und farbige Seiten (cols[i] = Seite gegenüber Ecke i)
function simTri(S, m, P, o) {
  o = o || {};
  const q = P.map(p => smPx(m, p));
  if (o.fill) S.poly(q, { fill: o.fill, a: o.a === undefined ? 0.12 : o.a, col: o.fill, lw: 0.6, close: true, clip: [m.L, m.T, m.R - m.L, m.B - m.T] });
  [0, 1, 2].forEach(i => difSeg(S, m, P[(i + 1) % 3][0], P[(i + 1) % 3][1], P[(i + 2) % 3][0], P[(i + 2) % 3][1], { col: o.cols ? o.cols[i] : (o.col || 'T'), lw: o.lw || 2.6, dash: o.dash, a: o.sa }));
  return q;
}
// Winkelbogen bei Ecke V zwischen den Richtungen zu U und W (alles in Pixeln); Beschriftung auf der Winkelhalbierenden
function simArcPx(S, V, U, W, rr, col, lab, C, o) {
  o = o || {};
  if (S.frames && S.frames.length && !o.free && !S.frames.some(f => V[0] >= f[0] - 1 && V[0] <= f[2] + 1 && V[1] >= f[1] - 1 && V[1] <= f[3] + 1)) return;   // Ecke ausserhalb des Fensters
  const a1 = Math.atan2(U[1] - V[1], U[0] - V[0]), a2 = Math.atan2(W[1] - V[1], W[0] - V[0]);
  let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d <= -Math.PI) d += 2 * Math.PI;
  if (!(rr > 5)) return;
  const deg = Math.abs(d) * 180 / Math.PI;
  if (Math.abs(deg - 90) < 0.05 && !o.noRight) {                     // rechter Winkel: Quadrat
    const s = rr * 0.6, e1 = [Math.cos(a1) * s, Math.sin(a1) * s], e2 = [Math.cos(a2) * s, Math.sin(a2) * s];
    S.poly([[V[0] + e1[0], V[1] + e1[1]], [V[0] + e1[0] + e2[0], V[1] + e1[1] + e2[1]], [V[0] + e2[0], V[1] + e2[1]]], { col, lw: 1.4 });
    if (o.dot !== false) S.circ(V[0] + (e1[0] + e2[0]) * 0.5, V[1] + (e1[1] + e2[1]) * 0.5, 1.4, { fill: col });
  } else {
    const pts = []; for (let i = 0; i <= 24; i++) { const a = a1 + d * i / 24; pts.push([V[0] + Math.cos(a) * rr, V[1] + Math.sin(a) * rr]); }
    if (o.fill) S.poly([V].concat(pts), { fill: col, a: 0.16, col, lw: 0.1, close: true });
    S.poly(pts, { col, lw: 1.7 });
  }
  if (lab) { const ls = o.ls || 0.9, am = a1 + d / 2, r2 = rr + C.fs * (deg < 35 ? 1.05 : 0.75) * ls / 0.9; S.rich(V[0] + Math.cos(am) * r2, V[1] + Math.sin(am) * r2, lab, { size: C.fs * ls, col: 'T', al: 'c', bs: 'm' }); (S.labs || (S.labs = [])).push({ x0: V[0] + Math.cos(am) * r2 - C.fs * 0.5, x1: V[0] + Math.cos(am) * r2 + C.fs * 0.5, y0: V[1] + Math.sin(am) * r2 - C.fs * 0.5, y1: V[1] + Math.sin(am) * r2 + C.fs * 0.5 }); }
}
function simAngles(S, q, cols, labs, C, scale, ls) {                // ls: Schriftgrösse der Winkelnamen (Anteil von fs)
  [0, 1, 2].forEach(i => {
    const V = q[i], U = q[(i + 1) % 3], W = q[(i + 2) % 3], sl = Math.min(Math.hypot(U[0] - V[0], U[1] - V[1]), Math.hypot(W[0] - V[0], W[1] - V[1]));
    simArcPx(S, V, U, W, Math.min(C.fs * 1.7 * (scale || 1), sl * 0.32), cols[i], labs ? labs[i] : null, C, { fill: true, ls });
  });
}
// Ecken beschriften (nach aussen, weg vom Schwerpunkt) und als ziehbare Punkte anmelden
function simVerts(S, m, P, names, ids, C, o) {
  o = o || {}; const fs = C.fs, q = P.map(p => smPx(m, p)), G = [(q[0][0] + q[1][0] + q[2][0]) / 3, (q[0][1] + q[1][1] + q[2][1]) / 3];
  q.forEach((p, i) => {
    if (!smIn(m, p)) return;
    S.circ(p[0], p[1], o.r || 5, { fill: o.fill || 'T', stroke: o.stroke || 'T', lw: 1.3 });
    if (ids && ids[i]) S.pts.push({ id: ids[i], x: p[0], y: p[1], r: 11 });
    const dx = p[0] - G[0], dy = p[1] - G[1], l = Math.hypot(dx, dy) || 1;
    difLabel(S, m, p[0] + dx / l * fs * 1.25, p[1] + dy / l * fs * 1.25, o.lab ? '\\col{' + o.lab + '}{' + names[i] + '}' : names[i], C, { size: 1.05 });
    (S.labs || (S.labs = [])).push({ x0: p[0] - 7, x1: p[0] + 7, y0: p[1] - 7, y1: p[1] + 7 });
  });
  return q;
}
// Länge an der Seitenmitte, nach aussen versetzt
function simLen(S, m, P, Q, G, txt, C, o) {
  o = o || {}; const p = smPx(m, P), q = smPx(m, Q), g = smPx(m, G), mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
  let nx = -(q[1] - p[1]), ny = q[0] - p[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
  if ((mx - g[0]) * nx + (my - g[1]) * ny < 0) { nx = -nx; ny = -ny; }
  if (Math.hypot(q[0] - p[0], q[1] - p[1]) < C.fs * 2.2 || !smIn(m, [mx, my])) return;
  const d = C.fs * (o.d || 0.95);
  difLabel(S, m, mx + nx * d * (Math.abs(ny) > 0.8 ? 1 : 1.6), my + ny * d, txt, C, { size: 0.85 });
}
// Bruch zweier Längen mit Zahlen (für das Bild)
const smFr = (a, b, va, vb, col) => smCol(col, '\\frac{|' + a + '|}{|' + b + '|}=\\frac{' + Sim.n(va) + '}{' + Sim.n(vb) + '}' + Sim.eqs(va, vb, va / vb) + Sim.n(va / vb));
const smFr2 = (a, b, va, vb, ca, cb) => '\\frac{' + smCol(ca, '|' + a + '|') + '}{' + smCol(cb, '|' + b + '|') + '}=\\frac{' + smCol(ca, Sim.n(va)) + '}{' + smCol(cb, Sim.n(vb)) + '}' + Sim.eqs(va, vb, va / vb) + Sim.n(va / vb);
const smDeg = v => Sim.n(v, 1) + '^\\circ';

// ═════════════ Ähnlichkeitsabbildungen ═════════════
// Kurzbeschreibung der Abbildung (rechts über dem Bild)
function simMapInfo(T, K) {
  const t = x => '\\text{' + x + '}', one = K.length === 1 ? K[0] : '';
  if (!K.length) return t('Bild = Original');
  if (one === 'trans') return t('Verschiebung um ') + '(' + Sim.n(T.v[0]) + '\\,|\\,' + Sim.n(T.v[1]) + ')';
  if (one === 'rot') return t('Drehung um ') + 'O' + t(' um ') + smDeg(T.phi);
  if (one === 'refl') return t('Spiegelung an der ') + Sim.axisOf(T) + t('-Achse');
  if (one === 'point') return t('Punktspiegelung an ') + 'Z';
  if (one === 'dil') return t('Zentrische Streckung von ') + 'Z' + t(' aus, ') + 'k=' + Sim.n(T.k);
  return K.map(k => t({ refl: 'Spiegelung', rot: 'Drehung', point: 'Streckung', dil: 'Streckung', trans: 'Verschiebung' }[k])).join(',\\ ') + (K.indexOf('dil') >= 0 ? ',\\ |k|=' + Sim.n(Math.abs(T.k)) : '');
}
function simSceneMap(S, W, H, C) {
  const fs = C.fs, P = C.P, T = C.T, Q = P.map(p => Sim.apply(T, p)), t1 = Sim.tri(P[0], P[1], P[2]), t2 = Sim.tri(Q[0], Q[1], Q[2]), k = Math.abs(T.k), sh = C.show;
  const Rl = linLayout(W, H, [{ w: 0.57, rows: [2.3] }, { w: 0.43, rows: [1.3, 1.2] }]);
  const K = Sim.kinds(T), has = x => K.indexOf(x) >= 0, dil = has('dil') || has('point') || C.mk === 'dil', rot = has('rot') || C.mk === 'rot', one = K.length === 1 ? K[0] : '';
  const need = P.concat(Q, [[0, 0]]); if (dil) need.push(T.z);        // Z zählt nur bei einer Streckung
  const win = simWindow(C, Rl[0], need, 'map');
  const m = difFrame(S, Rl[0], win, C, { title: '\\triangle ABC\\sim\\triangle A\'B\'C\'', info: simMapInfo(T, K), xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  const clip = [m.L, m.T, m.R - m.L, m.B - m.T];
  // Spiegelachse = x- oder y-Achse, hervorgehoben
  if (T.refl) {
    if (Sim.axisOf(T) === 'x') { difSeg(S, m, win.x0, 0, win.x1, 0, { col: ST_T, lw: 2.4, dash: true }); if (win.y0 < 0 && win.y1 > 0) difLabel(S, m, m.R - fs * 3.6, m.Y(0) - fs * 0.85, '\\text{Spiegelachse}', C, { size: 0.82 }); }
    else { difSeg(S, m, 0, win.y0, 0, win.y1, { col: ST_T, lw: 2.4, dash: true }); if (win.x0 < 0 && win.x1 > 0) difLabel(S, m, m.X(0) + fs * 3.4, m.T + fs * 2.0, '\\text{Spiegelachse}', C, { size: 0.82 }); }
  }
  // Hilfslinien: zeigen bei EINER Grundabbildung, wie Original und Bild zusammenhängen
  if (sh.rays && one) {
    if (one === 'dil' || one === 'point') [0, 1, 2].forEach(i => { difSeg(S, m, T.z[0], T.z[1], P[i][0], P[i][1], { col: 'M', lw: 1, dash: true, a: 0.6 }); difSeg(S, m, T.z[0], T.z[1], Q[i][0], Q[i][1], { col: ST_V, lw: 1, dash: true, a: 0.55 }); });
    else if (one === 'rot') {
      const ph = Sim.normA(T.phi), nA = Math.max(8, Math.round(Math.abs(ph) / 4));
      [0, 1, 2].forEach(i => {                                         // Kreisbogen um O von der Ecke zu ihrem Bild
        difSeg(S, m, 0, 0, P[i][0], P[i][1], { col: 'M', lw: 1, dash: true, a: 0.6 }); difSeg(S, m, 0, 0, Q[i][0], Q[i][1], { col: ST_V, lw: 1, dash: true, a: 0.55 });
        const pts = []; for (let j = 0; j <= nA; j++) pts.push(smPx(m, Sim.rotU(ph * j / nA, P[i])));
        S.poly(pts, { col: ST_V, lw: 1.1, a: 0.6, clip });
      });
      const o = smPx(m, [0, 0]), far = [0, 1, 2].reduce((a, i) => (Math.hypot(P[i][0], P[i][1]) > Math.hypot(P[a][0], P[a][1]) ? i : a), 0);
      if (smIn(m, o) && Math.abs(ph) > 4) simArcPx(S, o, smPx(m, P[far]), smPx(m, Q[far]), fs * 1.5, ST_V, '\\col{v}{' + smDeg(Math.abs(ph)) + '}', C, { noRight: true, ls: 0.78 });
    } else [0, 1, 2].forEach(i => difSeg(S, m, P[i][0], P[i][1], Q[i][0], Q[i][1], { col: ST_V, lw: 1, dash: true, a: 0.6 }));   // Spiegelung: senkrecht zur Achse; Verschiebung: parallel und gleich lang
  }
  const q1 = simTri(S, m, P, { fill: 'M', a: 0.1, cols: SM_SIDE }), q2 = simTri(S, m, Q, { fill: ST_V, a: 0.13, cols: SM_SIDE });
  if (sh.angles) { simAngles(S, q1, SM_ANG, SM_GREEK.map((g, i) => smCol(SM_AL[i], g)), C, 0.85, 0.75); simAngles(S, q2, SM_ANG, SM_GREEK.map((g, i) => smCol(SM_AL[i], g + "'")), C, 0.85, 0.75); }
  if (sh.lens) {
    const g1 = Sim.centroid(P), g2 = Sim.centroid(Q);
    [0, 1, 2].forEach(i => { const j = (i + 1) % 3, l = (i + 2) % 3; simLen(S, m, P[j], P[l], g1, smCol(SM_SL[i], Sim.n([t1.a, t1.b, t1.c][i])), C); simLen(S, m, Q[j], Q[l], g2, smCol(SM_SL[i], Sim.n([t2.a, t2.b, t2.c][i])), C); });
  }
  const zp = smPx(m, T.z), op = smPx(m, [0, 0]);
  const zo = dil && Math.hypot(T.z[0], T.z[1]) < 1e-9;                 // Zentrum im Ursprung: nur EIN Punkt, beschriftet «Z = O»
  if (rot && !zo && smIn(m, op)) { S.circ(op[0], op[1], 4.6, { fill: ST_V, stroke: 'T', lw: 1.2 }); difLabel(S, m, op[0] - fs * 0.9, op[1] + fs * 1.0, '\\col{v}{O}', C, { size: 1.05 }); }
  if (dil && smIn(m, zp)) { S.circ(zp[0], zp[1], 5.4, { fill: ST_O, stroke: 'T', lw: 1.2 }); S.pts.push({ id: 'Z', x: zp[0], y: zp[1], r: 11 }); difLabel(S, m, zp[0] - fs * (zo && rot ? 1.7 : 0.9), zp[1] + fs * 1.0, zo && rot ? '\\col{o}{Z=O}' : '\\col{o}{Z}', C, { size: 1.05 }); }
  simVerts(S, m, P, ['A', 'B', 'C'], ['A', 'B', 'C'], C);
  simVerts(S, m, Q, ["A'", "B'", "C'"], ['A2', 'B2', 'C2'], C, { fill: ST_V, lab: 'v' });
  S.tris = [{ id: 'IMG', q: q2 }];
  // rechts: Verhältnisse
  const L1 = [{ s: '\\text{Entsprechende Seiten: Bild : Original}', bold: true, size: 0.95 }];
  [2, 0, 1].forEach(i => { const nm = ['BC', 'CA', 'AB'][i], np = ["B'C'", "C'A'", "A'B'"][i]; L1.push({ s: smFr(np, nm, [t2.a, t2.b, t2.c][i], [t1.a, t1.b, t1.c][i], SM_SL[i]) }); });
  L1.push({ s: '\\Rightarrow\\ \\text{alle gleich: }|k|=' + Sim.n(k), bold: true });
  difLines(S, Rl[1], L1, C, { max: fs * 1.1 });
  const L2 = [{ s: '\\text{Seitenverhältnisse in jedem Dreieck}', bold: true, size: 0.95 },
    { s: smFr2("A'C'", "C'B'", t2.b, t2.a, 'g', 'r') + '\\quad ' + smFr2('AC', 'CB', t1.b, t1.a, 'g', 'r') },
    { s: smFr2("A'B'", "C'B'", t2.c, t2.a, 'b', 'r') + '\\quad ' + smFr2('AB', 'CB', t1.c, t1.a, 'b', 'r') },
    null,
    { s: '\\text{Winkel: }' + smCol('o', '\\alpha=\\alpha\'=' + smDeg(t1.al)) + ',\\ ' + smCol('v', '\\beta=\\beta\'=' + smDeg(t1.be)) + ',\\ \\gamma=\\gamma\'=' + smDeg(t1.ga), size: 0.92 }];
  if (Rl[2]) difLines(S, Rl[2], L2, C, { max: fs * 1.1 });
}

// ═════════════ Ähnlich oder nicht? ═════════════
function simSceneTest(S, W, H, C) {
  const fs = C.fs, P = C.P, Q = C.Q, t1 = Sim.tri(P[0], P[1], P[2]), t2 = Sim.tri(Q[0], Q[1], Q[2]), M = Sim.match(t1, t2), p = M.p, sh = C.show;
  const Rl = linLayout(W, H, [{ w: 0.57, rows: [2.3] }, { w: 0.43, rows: [1.15, 1.35] }]);
  const win = simWindow(C, Rl[0], P.concat(Q), 'test');
  const img = [0, 1, 2].map(i => 'PQR'[p[i]]);
  const head = !t1.ok || !t2.ok ? '\\text{entartet}' : M.sim ? '\\col{g}{\\triangle ABC\\sim\\triangle ' + img.join('') + '}' : '\\col{r}{\\text{nicht ähnlich}}';
  const m = difFrame(S, Rl[0], win, C, { title: head, xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  // Farben des zweiten Dreiecks nach der Zuordnung: Ecke p[i] von PQR entspricht Ecke i von ABC
  const c2 = [0, 0, 0], a2 = [0, 0, 0], l2 = ['', '', ''];
  [0, 1, 2].forEach(i => { c2[p[i]] = SM_SIDE[i]; a2[p[i]] = SM_ANG[i]; l2[p[i]] = SM_AL[i]; });
  const q1 = simTri(S, m, P, { fill: 'M', a: 0.1, cols: SM_SIDE }), q2 = simTri(S, m, Q, { fill: ST_V, a: 0.13, cols: c2 });
  if (sh.angles) {
    simAngles(S, q1, SM_ANG, [t1.al, t1.be, t1.ga].map((v, i) => smCol(SM_AL[i], Sim.n(v, 1) + '°')), C);
    simAngles(S, q2, a2, [t2.al, t2.be, t2.ga].map((v, i) => smCol(l2[i], Sim.n(v, 1) + '°')), C);
  }
  if (sh.lens) {
    const g1 = Sim.centroid(P), g2 = Sim.centroid(Q);
    [0, 1, 2].forEach(i => { const j = (i + 1) % 3, l = (i + 2) % 3; simLen(S, m, P[j], P[l], g1, smCol(SM_SL[i], Sim.n([t1.a, t1.b, t1.c][i])), C, { d: 1.1 }); });
    [0, 1, 2].forEach(i => { const j = (i + 1) % 3, l = (i + 2) % 3, ci = p.indexOf(i); simLen(S, m, Q[j], Q[l], g2, smCol(SM_SL[ci], Sim.n([t2.a, t2.b, t2.c][i])), C, { d: 1.1 }); });
  }
  simVerts(S, m, P, ['A', 'B', 'C'], ['A', 'B', 'C'], C);
  simVerts(S, m, Q, ['P', 'Q', 'R'], ['P', 'Q', 'R'], C, { fill: ST_V, lab: 'v' });
  S.tris = [{ id: 'T2', q: q2 }, { id: 'T1', q: q1 }];
  const A1 = [t1.al, t1.be, t1.ga], A2 = [t2.al, t2.be, t2.ga];
  const L1 = [{ s: '\\text{Winkel vergleichen}', bold: true, size: 0.95 }];
  [0, 1, 2].forEach(i => { const same = Math.abs(A1[i] - A2[p[i]]) < 0.05; L1.push({ s: smCol(SM_AL[i], SM_GREEK[i] + '=' + smDeg(A1[i])) + (same ? '\\ =\\ ' : '\\ \\col{r}{\\neq}\\ ') + smCol(SM_AL[i], '\\angle ' + img[i] + '=' + smDeg(A2[p[i]])) }); });
  difLines(S, Rl[1], L1, C, { max: fs * 1.1 });
  const L2 = [{ s: '\\text{Entsprechende Seiten}', bold: true, size: 0.95 }];
  [2, 0, 1].forEach(i => { const s1 = 'ABC'[(i + 1) % 3] + 'ABC'[(i + 2) % 3], s2 = img[(i + 1) % 3] + img[(i + 2) % 3]; L2.push({ s: smFr(s2, s1, [t2.a, t2.b, t2.c][p[i]], [t1.a, t1.b, t1.c][i], SM_SL[i]) }); });
  if (t1.ok && t2.ok) L2.push(M.sim ? { s: '\\col{g}{\\Rightarrow\\ \\text{alle gleich: ähnlich mit Faktor }' + Sim.n(M.k) + '}', bold: true } : { s: '\\col{r}{\\Rightarrow\\ \\text{nicht alle gleich: nicht ähnlich}}', bold: true });
  if (M.sim) L2.push({ s: '\\text{' + (M.same ? 'gleich orientiert (ohne Spiegelung)' : 'gegensinnig (mit Spiegelung)') + '}', size: 0.88, col: 'M' });
  if (Rl[2]) difLines(S, Rl[2], L2, C, { max: fs * 1.1 });
}

// ═════════════ Strahlensätze ═════════════
function simSceneRay(S, W, H, C) {
  const fs = C.fs, r = C.ray, R = Sim.ray(r.Z, r.A, r.B, r.t, r.free ? r.s : null), sh = C.show;
  const Rl = linLayout(W, H, [{ w: 0.57, rows: [2.3] }, { w: 0.43, rows: [1.8, 0.7] }]);
  const win = simWindow(C, Rl[0], [R.Z, R.A, R.B, R.C, R.D], 'ray');
  const m = difFrame(S, Rl[0], win, C, { title: R.par ? '\\col{o}{AB\\parallel CD}' : '\\col{r}{AB\\ \\text{und}\\ CD\\ \\text{nicht parallel}}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  const big = (win.x1 - win.x0) * 4, Z = R.Z;
  [[R.A, R.C, ST_B], [R.B, R.D, ST_G]].forEach(([U, V, col]) => {
    const d = Sim.sub(U, Z), l = Math.hypot(d[0], d[1]) || 1, e = [d[0] / l, d[1] / l];
    difSeg(S, m, Z[0], Z[1], Z[0] + e[0] * big, Z[1] + e[1] * big, { col: 'T', lw: 1.3 });
    if (R.cross) difSeg(S, m, Z[0], Z[1], Z[0] - e[0] * big, Z[1] - e[1] * big, { col: 'T', lw: 1.3 });
    difSeg(S, m, Z[0], Z[1], U[0], U[1], { col, lw: 3 }); difSeg(S, m, Z[0], Z[1], V[0], V[1], { col, lw: 3, a: 0.55 });
  });
  // Parallelen (verlängert gestrichelt)
  [[R.A, R.B], [R.C, R.D]].forEach(([U, V], i) => {
    const d = Sim.sub(V, U), l = Math.hypot(d[0], d[1]) || 1, e = [d[0] / l, d[1] / l];
    difSeg(S, m, U[0] - e[0] * big, U[1] - e[1] * big, U[0] + e[0] * big, U[1] + e[1] * big, { col: R.par || !i ? ST_O : ST_R, lw: 1, dash: true, a: 0.5 });
  });
  const q1 = simTri(S, m, [R.Z, R.A, R.B], { fill: 'M', a: 0.1, cols: ['T', 'T', ST_O], lw: 0.01 }), q2 = simTri(S, m, [R.Z, R.C, R.D], { fill: ST_V, a: 0.1, cols: ['T', 'T', R.par ? ST_O : ST_R], lw: 0.01 });
  difSeg(S, m, R.A[0], R.A[1], R.B[0], R.B[1], { col: ST_O, lw: 2.8 }); difSeg(S, m, R.C[0], R.C[1], R.D[0], R.D[1], { col: R.par ? ST_O : ST_R, lw: 2.8 });
  if (sh.angles) {
    const zq = q1[0], rr = fs * 1.5;
    simArcPx(S, zq, q1[1], q1[2], rr, 'T', '', C, { fill: true });
    const ang = (V, U, Wp, col, lab) => simArcPx(S, V, U, Wp, Math.min(fs * 1.4, Math.hypot(U[0] - V[0], U[1] - V[1]) * 0.3), col, lab, C, { fill: true });
    ang(q1[1], q1[0], q1[2], ST_O, ''); ang(q2[1], q2[0], q2[2], ST_O, '');
    ang(q1[2], q1[0], q1[1], ST_V, ''); ang(q2[2], q2[0], q2[1], R.par ? ST_V : ST_R, '');
  }
  if (sh.lens) {
    const G = Sim.centroid([R.Z, R.A, R.B]);
    // Abschnitte auf jedem Strahl zwischen aufeinanderfolgenden Punkten
    [[R.A, R.C, R.t, 'b'], [R.B, R.D, R.s, 'g']].forEach(([U, V, t, c]) => {
      const pts = [[0, Z], [1, U], [t, V]].sort((a, b) => a[0] - b[0]);
      for (let i = 0; i + 1 < pts.length; i++) simLen(S, m, pts[i][1], pts[i + 1][1], G, smCol(c, Sim.n(Sim.dist(pts[i][1], pts[i + 1][1]))), C);
    });
    simLen(S, m, R.A, R.B, R.Z, smCol('o', Sim.n(R.AB)), C); simLen(S, m, R.C, R.D, R.Z, smCol(R.par ? 'o' : 'r', Sim.n(R.CD)), C);
  }
  const zp = smPx(m, Z);
  if (smIn(m, zp)) { S.circ(zp[0], zp[1], 5.4, { fill: ST_O, stroke: 'T', lw: 1.2 }); S.pts.push({ id: 'Z', x: zp[0], y: zp[1], r: 11 }); difLabel(S, m, zp[0] - fs * 1.0, zp[1] + fs * 0.6, '\\col{o}{Z}', C, { size: 1.05 }); }
  const lab = (P, nm, id, fill, col) => { const p = smPx(m, P); if (!smIn(m, p)) return; S.circ(p[0], p[1], 5, { fill, stroke: 'T', lw: 1.2 }); if (id) S.pts.push({ id, x: p[0], y: p[1], r: 11 }); linFreeLab(S, m, p, nm, C, col); };
  lab(R.A, 'A', 'A', 'T'); lab(R.B, 'B', 'B', 'T'); lab(R.C, 'C', 'C', ST_V, 'v'); lab(R.D, 'D', r.free ? 'D' : null, r.free ? ST_V : '#ffffff', 'v');
  // rechts
  const rel = R.par ? '\\ =\\ ' : '\\ \\col{r}{\\neq}\\ ';
  const L1 = [{ s: R.par ? '\\triangle ZAB\\sim\\triangle ZCD' : '\\col{r}{\\triangle ZAB\\ \\text{und}\\ \\triangle ZCD\\ \\text{nicht ähnlich}}', bold: true },
    { s: '\\text{1. Strahlensatz}', bold: true, size: 0.92 },
    { s: smFr('ZA', 'ZC', R.ZA, R.ZC, 'b') + rel + smFr('ZB', 'ZD', R.ZB, R.ZD, 'g') },
    { s: '\\text{2. Strahlensatz}', bold: true, size: 0.92 },
    { s: smFr('AB', 'CD', R.AB, R.CD, 'o') + rel + smCol('b', '\\frac{|ZA|}{|ZC|}') } ];
  if (!R.cross && R.par) L1.push({ s: '\\text{Abschnitte: }' + smFr('ZA', 'AC', R.ZA, R.AC, 'b') + '=' + smFr('ZB', 'BD', R.ZB, R.BD, 'g'), size: 0.9 });
  difLines(S, Rl[1], L1, C, { max: fs * 1.1, oneCol: true });
  if (Rl[2]) {
    const L2 = R.par ? [{ s: '\\text{Fehlende Länge mit Verhältnisgleichung}', bold: true, size: 0.92 }, { s: '|CD|=|AB|\\cdot\\frac{|ZC|}{|ZA|}=' + Sim.n(R.AB) + '\\cdot\\frac{' + Sim.n(R.ZC) + '}{' + Sim.n(R.ZA) + '}' + Sim.eqs(R.CD, R.AB, R.ZC, R.ZA) + Sim.n(R.CD) }]
      : [{ s: '\\col{r}{\\text{Nicht parallel: Die Strahlensätze gelten nicht.}}', bold: true }, { s: '\\text{Ziehe D, bis CD parallel zu AB ist.}', col: 'M', size: 0.92 }];
    difLines(S, Rl[2], L2, C, { max: fs * 1.1 });
  }
}
// Punktbeschriftung, die belegten Flächen ausweicht
function linFreeLab(S, m, p, nm, C, col) {
  const fs = C.fs, f = linFree(m, p, [], fs, fs * 2, fs * 1.2, S, fs * 1.3, [fs * 0.9, -fs * 1.1]);
  difLabel(S, m, p[0] + f[0], p[1] + f[1], col ? '\\col{' + col + '}{' + nm + '}' : nm, C, { size: 1.05 });
  (S.labs || (S.labs = [])).push({ x0: p[0] - 7, x1: p[0] + 7, y0: p[1] - 7, y1: p[1] + 7 });
}

// ═════════════ Rechtwinkliges Dreieck mit Höhe ═════════════
function simSceneRight(S, W, H, C) {
  const fs = C.fs, r = C.rt, R = Sim.right(r.A, r.B, r.d), sh = C.show;
  const Rl = linLayout(W, H, [{ w: 0.55, rows: [2.3] }, { w: 0.45, rows: [1.2, 1.15, 0.55] }]);
  if (!(R.c > 0.05)) { S.maps.main = difFrame(S, Rl[0], simWindow(C, Rl[0], [r.A, r.B], 'right0'), C, { title: '\\text{A und B fallen zusammen}' }); return; }
  const nn = Sim.mul(Sim.sub(R.C, R.D), 1 / (R.h || 1)), top = Sim.add(R.M, Sim.mul(nn, R.c / 2));
  const win = simWindow(C, Rl[0], [R.A, R.B, R.C, top], 'right');
  const m = difFrame(S, Rl[0], win, C, { title: '\\triangle ADC\\sim\\triangle CDB\\sim\\triangle ACB', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  // Thaleskreis (Halbkreis auf der Seite von C)
  const e = Sim.mul(Sim.sub(R.B, R.A), 1 / R.c), arc = [];
  for (let i = 0; i <= 60; i++) { const a = Math.PI * i / 60, P = Sim.add(R.M, Sim.add(Sim.mul(e, Math.cos(a) * R.c / 2), Sim.mul(nn, Math.sin(a) * R.c / 2))); arc.push(smPx(m, P)); }
  S.poly(arc, { col: 'M', lw: 1.1, dash: true, a: 0.7, clip: [m.L, m.T, m.R - m.L, m.B - m.T] });
  const qa = simTri(S, m, [R.A, R.D, R.C], { fill: ST_O, a: 0.16, col: 'T', lw: 0.01 }), qb = simTri(S, m, [R.C, R.D, R.B], { fill: ST_G, a: 0.16, col: 'T', lw: 0.01 });
  simTri(S, m, [R.A, R.B, R.C], { cols: ['T', 'T', 'T'], lw: 2.4 });
  difSeg(S, m, R.C[0], R.C[1], R.D[0], R.D[1], { col: ST_V, lw: 2.2 });
  const pA = smPx(m, R.A), pB = smPx(m, R.B), pC = smPx(m, R.C), pD = smPx(m, R.D);
  simArcPx(S, pD, pC, pB, fs * 1.1, 'T', '', C, { dot: true });
  simArcPx(S, pC, pA, pB, fs * 0.9, 'T', '', C, { dot: true });
  if (sh.angles) {
    const lim = (V, U) => Math.min(fs * 1.7, Math.hypot(U[0] - V[0], U[1] - V[1]) * 0.35);
    simArcPx(S, pA, pB, pC, lim(pA, pD), ST_O, smCol('o', '\\alpha'), C, { fill: true });
    simArcPx(S, pB, pC, pA, lim(pB, pD), ST_V, smCol('v', '\\beta'), C, { fill: true });
    simArcPx(S, pC, pA, pD, lim(pC, pD) * 1.25, ST_V, smCol('v', '\\beta'), C, { fill: true });
    simArcPx(S, pC, pD, pB, lim(pC, pD) * 1.25, ST_O, smCol('o', '\\alpha'), C, { fill: true });
  }
  if (sh.lens) {
    const G = Sim.centroid([R.A, R.B, R.C]);
    simLen(S, m, R.A, R.D, R.C, Sim.n(R.p), C); simLen(S, m, R.D, R.B, R.C, Sim.n(R.q), C);
    simLen(S, m, R.A, R.C, G, Sim.n(R.b), C); simLen(S, m, R.C, R.B, G, Sim.n(R.a), C);
    const hp = smPx(m, Sim.add(R.D, Sim.mul(nn, R.h / 2)));
    if (R.h * (m.X(1) - m.X(0)) > fs * 2.4) difLabel(S, m, hp[0] + fs * 1.3, hp[1], smCol('v', Sim.n(R.h)), C, { size: 0.85 });
  }
  [[R.A, 'A', 'A', 'T'], [R.B, 'B', 'B', 'T'], [R.C, 'C', 'C', ST_V], [R.D, 'D', null, '#ffffff']].forEach(([P, nm, id, fill]) => {
    const p = smPx(m, P); if (!smIn(m, p)) return; S.circ(p[0], p[1], id === 'C' ? 5.8 : 5, { fill, stroke: 'T', lw: 1.2 }); if (id) S.pts.push({ id, x: p[0], y: p[1], r: 12 });
    const d = Sim.sub(P, R.M);
    const dir = nm === 'C' ? [nn[0], -nn[1]] : nm === 'D' ? [-nn[0], nn[1]] : (() => { const l = Math.hypot(d[0], d[1]) || 1; return [d[0] / l, -d[1] / l]; })();
    difLabel(S, m, p[0] + dir[0] * fs * 1.2, p[1] + dir[1] * fs * 1.2, nm, C, { size: 1.05 });
  });
  // rechts oben: die drei Dreiecke in gleicher Lage (Hypotenuse unten, α links, β rechts)
  const TR = [{ nm: ['A', 'D', 'C'], hyp: R.b, adj: R.p, fill: ST_O }, { nm: ['C', 'D', 'B'], hyp: R.a, adj: R.h, fill: ST_G }, { nm: ['A', 'C', 'B'], hyp: R.c, adj: R.b, fill: 'M' }];
  const ca = Math.cos(Sim.rad(R.al)), sa = Math.sin(Sim.rad(R.al)), r1 = Rl[1];
  if (typeof stKeep === 'function') stKeep(r1);                   // die drei Dreiecke gehören zum Bild
  const gap = fs * 3.4, sum = TR.reduce((a, t) => a + t.hyp, 0), hmax = Math.max(...TR.map(t => t.adj * sa));
  const sc = Math.min((r1.w - gap * 2 - fs) / sum, (r1.h - fs * 3.4) / Math.max(1e-6, hmax));
  let x = r1.x + Math.max(fs * 0.5, (r1.w - sum * sc - gap * 2) / 2);
  const base = r1.y + fs * 1.4 + hmax * sc;
  TR.forEach(t => {
    const P0 = [x, base], P2 = [x + t.hyp * sc, base], P1 = [x + t.adj * ca * sc, base - t.adj * sa * sc];
    S.poly([P0, P1, P2], { fill: t.fill, a: 0.18, col: 'T', lw: 1.8, close: true });
    S.line(P0[0], P0[1], P2[0], P2[1], { col: 'T', lw: 2.2 });
    S.line(P1[0], P1[1], P2[0], P2[1], { col: ST_O, lw: 2.4 }); S.line(P0[0], P0[1], P1[0], P1[1], { col: ST_V, lw: 2.4 });
    const rr = Math.min(fs * 1.2, t.hyp * sc * 0.2);
    simArcPx(S, P0, P2, P1, rr, ST_O, '', C, { fill: true, free: true }); simArcPx(S, P2, P1, P0, rr, ST_V, '', C, { fill: true, free: true }); simArcPx(S, P1, P0, P2, rr * 0.8, 'T', '', C, { free: true });
    S.rich(P0[0] - fs * 0.5, P0[1] + fs * 0.2, t.nm[0], { size: fs * 0.9, col: 'T', al: 'r', bs: 'm' });
    S.rich(P2[0] + fs * 0.5, P2[1] + fs * 0.2, t.nm[2], { size: fs * 0.9, col: 'T', al: 'l', bs: 'm' });
    S.rich(P1[0], P1[1] - fs * 0.7, t.nm[1], { size: fs * 0.9, col: 'T', al: 'c', bs: 'm' });
    S.rich((P0[0] + P2[0]) / 2, base + fs * 1.2, '\\triangle ' + t.nm.join(''), { size: fs * 0.88, col: 'T', al: 'c', bs: 'm' });
    x += t.hyp * sc + gap;
  });
  // Tabelle: Seiten gegenüber α, β, Hypotenuse; Verhältnis
  const cell = (nm, v) => '|' + nm + '|' + Sim.eqs(v) + Sim.n(v);
  const rows = [
    [smCol('o', '\\text{gegenüber }\\alpha'), smCol('o', cell('DC', R.h)), smCol('o', cell('DB', R.q)), smCol('o', cell('BC', R.a))],
    [smCol('v', '\\text{gegenüber }\\beta'), smCol('v', cell('AD', R.p)), smCol('v', cell('CD', R.h)), smCol('v', cell('AC', R.b))],
    ['\\text{Hypotenuse}', cell('AC', R.b), cell('CB', R.a), cell('AB', R.c)],
    ['\\frac{' + smCol('o', '\\text{geg. }\\alpha') + '}{' + smCol('v', '\\text{geg. }\\beta') + '}', '\\frac{' + Sim.n(R.h) + '}{' + Sim.n(R.p) + '}' + Sim.eqs(R.h, R.p, R.h / R.p) + Sim.n(R.h / R.p), '\\frac{' + Sim.n(R.q) + '}{' + Sim.n(R.h) + '}' + Sim.eqs(R.q, R.h, R.q / R.h) + Sim.n(R.q / R.h), '\\frac{' + Sim.n(R.a) + '}{' + Sim.n(R.b) + '}' + Sim.eqs(R.a, R.b, R.a / R.b) + Sim.n(R.a / R.b)]
  ];
  linTab(S, Rl[2] ? Rl[2] : Rl[1], [{ h: '', w: 6.2 }, { h: '\\triangle ADC', w: 6.4 }, { h: '\\triangle CDB', w: 6.4 }, { h: '\\triangle ACB', w: 6.4 }], rows, 3, C);
  if (Rl[3]) difLines(S, Rl[3], [{ s: '\\text{Höhensatz: }|CD|^2=|AD|\\cdot|DB|\\quad ' + Sim.n(R.h) + '^2' + Sim.eqs(R.h * R.h) + Sim.n(R.p) + '\\cdot' + Sim.n(R.q) + Sim.eqs(R.p * R.q) + Sim.n(R.p * R.q, 4) }, { s: '\\text{Kathetensatz: }|AC|^2=|AB|\\cdot|AD|\\quad ' + Sim.n(R.b) + '^2' + Sim.eqs(R.b * R.b) + Sim.n(R.c) + '\\cdot' + Sim.n(R.p) + Sim.eqs(R.c * R.p) + Sim.n(R.c * R.p, 4) }], C, { max: fs * 1.05 });
}

const SIM_SCENES = { map: simSceneMap, test: simSceneTest, ray: simSceneRay, right: simSceneRight };
function simBuildScene(W, H, C) {
  const S = linScene(), fn = SIM_SCENES[C.view];
  S.tris = [];
  if (fn) fn(S, W, H, C);
  return S;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { simBuildScene, SIM_SCENES, simWindow };
