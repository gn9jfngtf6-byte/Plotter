// ═══════════════════════════════════════════════════════════════════
// 97_trig_draw.js — Trigonometrische Funktionen: Bilder (Szenen)
//
// Gleiche Bauweise wie 94_exp_draw.js (Hilfen aus 81_lin_draw.js und 61_dif_draw.js). Die x-Achse der Graphen trägt
// Vielfache von π (difFrame mit xstep/xfmt) oder Grad; der Einheitskreis ist ein eigener quadratischer Rahmen (gleicher Massstab).
//
// Ansichten:  circ  Einheitskreis → Sinus und Kosinus (ziehbarer Punkt P, Bogen, Sinus- und Kosinuskurve, Tabelle besonderer Winkel)
//             gen   allgemeine Sinusfunktion a·sin(b(x − c)) + d (Griffe S, A, T; Verwandlung der Grundfunktion mit Animation)
//             tan   Tangens am Einheitskreis (Tangentenabschnitt), Graph mit Polstellen, Beziehungen
// Kontext C: {view, deg, unit ('deg'|'rad'), F, tt, win, fs, exp, smooth, show}
// Farben: Sinus rot, Kosinus blau, Tangens grün, Winkel violett, Grundfunktion grau, Asymptoten rot gestrichelt.
// ═══════════════════════════════════════════════════════════════════
const TR_S = ST_R, TR_C = ST_B, TR_T = ST_G, TR_A = ST_V, TR_P = ST_O;
const trPi = x => Trig.piTex(Trig.Qn(x / Math.PI));

// Striche auf der x-Achse: Vielfache von π (rad) oder Grad
function trigAxis(C, win, pxW) {
  if (C.unit === 'deg') { const st = [15, 30, 45, 90, 180, 360].find(s => (win.x1 - win.x0) / s * C.fs * 3.2 <= pxW) || 360; return { xstep: st, xfmt: v => (Math.round(v) + '^\\circ').replace('-', '-') }; }
  const st = [Math.PI / 6, Math.PI / 4, Math.PI / 2, Math.PI, 2 * Math.PI].find(s => (win.x1 - win.x0) / s * C.fs * 3.2 <= pxW) || 2 * Math.PI;
  return { xstep: st, xfmt: v => trPi(v) };
}
// Ausschnitt eines Graphen (unabhängige Achsen), ruhig gleitend
function trigWindow(C, r, T, need, key) {
  const w = C.win || {};
  if (isFinite(w.x0) && isFinite(w.x1) && isFinite(w.y0) && isFinite(w.y1) && w.x1 > w.x0 && w.y1 > w.y0) { const E = { x0: w.x0, x1: w.x1, y0: w.y0, y1: w.y1 }; return autoWin('trig', '', E, need, C, E); }
  return autoWin('trig', C.view + '|' + key, T, need, C);
}
// Quadratischer Rahmen für den Einheitskreis: Fenster [-s, s]², Massstab gleich
function trigCircleFrame(S, r, C, s, title) {
  const fs = C.fs, head = title ? fs * 2 : 0;
  const availW = r.w - fs * 3.9, availH = r.h - fs * 2.5 - head, side = Math.max(60, Math.min(availW, availH));
  const rr = { x: r.x + (r.w - side - fs * 3.9) / 2, y: r.y, w: side + fs * 3.9, h: side + fs * 2.5 + head };
  const m = difFrame(S, rr, { x0: -s, x1: s, y0: -s, y1: s }, C, { title, xlab: 'x', ylab: 'y' });
  m.bottom = rr.y + rr.h;
  return m;
}
// Einheitskreis und Graph nebeneinander, auf gleicher Höhe und im gleichen Massstab in y (Fenster [−s, s]):
// So liegt P auf dem Kreis genau auf der Höhe seines Funktionswerts im Graphen; eine gestrichelte Linie verbindet beide.
// Rechts daneben (falls Platz) die Tabelle; ohne Rechenweg-Karte darunter die Formelzeilen.
function trigBand(W, H, C, tab) {
  const fs = C.fs, pad = Math.round(Math.min(W, H) * 0.02) + 6, head = fs * 2, gap = fs * 1.2;
  const below = C.cardOpen ? 0 : 0.34;
  const rowH = (H - 2 * pad) * (1 - below) - (below ? pad : 0);
  const side = Math.max(60, Math.min(rowH - fs * 2.5 - head, (W - 2 * pad) * 0.4 - fs * 3.9));
  const h = side + fs * 2.5 + head, cw = side + fs * 3.9;
  const rc = { x: pad, y: pad, w: cw, h };
  const tw = tab ? 15.6 * fs : 0, rest = W - 2 * pad - cw - gap;
  const tabRight = tab && rest - tw - gap >= 320;
  const rg = { x: pad + cw + gap, y: pad, w: rest - (tabRight ? tw + gap : 0), h };
  const rt = tabRight ? { x: W - pad - tw, y: pad + head * 0.5, w: tw, h: Math.max(h, rowH) } : null;
  const low = below || C.exp ? { x: pad, y: pad + h + pad, w: W - 2 * pad, h: H - (pad + h + pad) - pad } : null;
  let rl = null, rt2 = null;
  if (low && low.h > fs * 3) { if (tab && !tabRight) { rl = { x: low.x, y: low.y, w: low.w * 0.58, h: low.h }; rt2 = { x: low.x + low.w * 0.6, y: low.y, w: low.w * 0.4, h: low.h }; } else rl = low; }
  return { rc, rg, rt: rt || rt2, rl };
}
const trAngLab = (C, deg) => (C.unit === 'deg' ? Trig.degTex(deg) : Trig.radTex(deg));
// Bogen um O mit Radius rad (Welt) von 0 bis φ
function trigArc(S, m, rad, deg, o) {
  const n = Math.max(8, Math.round(Math.abs(deg) / 4)), pts = [];
  for (let i = 0; i <= n; i++) { const a = Trig.deg2rad(deg) * i / n; pts.push([m.X(rad * Math.cos(a)), m.Y(rad * Math.sin(a))]); }
  S.poly(pts, o);
}

// ═════════════ Einheitskreis → Sinus und Kosinus ═════════════
function trigSceneCirc(S, W, H, C) {
  const fs = C.fs, deg = C.deg, x = Trig.deg2rad(deg), sn = Math.sin(x), cs = Math.cos(x), v = Trig.vals(deg), wide = W >= 820;
  const B = trigBand(W, H, C, C.show.tab), s0 = 1.35;
  void wide;
  // Kreis
  const mc = trigCircleFrame(S, B.rc, C, s0, '\\text{Einheitskreis}\\quad\\col{v}{\\varphi=' + trAngLab(C, deg) + '}');
  S.maps.circ = mc;
  S.circ(mc.X(0), mc.Y(0), mc.X(1) - mc.X(0), { stroke: 'L', lw: 1.8 });
  trigArc(S, mc, 0.28, deg, { col: TR_A, lw: 2 });
  if (Math.abs(deg) > 8) S.rich(mc.X(0.42 * Math.cos(x / 2)), mc.Y(0.42 * Math.sin(x / 2)), '\\col{v}{\\varphi}', { size: fs, col: 'T', al: 'c', bs: 'm' });
  difSeg(S, mc, 0, 0, cs, sn, { col: 'T', lw: 1.4 });
  if (C.show.cos) difSeg(S, mc, 0, 0, cs, 0, { col: TR_C, lw: 3.4 });
  difSeg(S, mc, cs, 0, cs, sn, { col: TR_S, lw: 3.4 });
  if (C.show.cos) S.rich(mc.X(cs / 2), mc.Y(0) + (sn >= 0 ? fs * 1.0 : -fs * 1.0), '\\col{b}{\\cos\\varphi}', { size: fs * 0.95, col: 'T', al: 'c', bs: 'm' });
  S.rich(mc.X(cs) + (cs >= 0 ? fs * 0.5 : -fs * 0.5), mc.Y(sn / 2), '\\col{r}{\\sin\\varphi}', { size: fs * 0.95, col: 'T', al: cs >= 0 ? 'l' : 'r', bs: 'm' });
  linPt(S, mc, null, 0, 0, C, { fill: 'T', r: 3 });
  linPt(S, mc, 'P', cs, sn, C, { fill: TR_A, r: 6, lab: '\\col{v}{P(' + linFmtS(cs) + '\\,|\\,' + linFmtS(sn) + ')}', lines: [[cs, sn], [1, 0], [0, 1]], w: fs * 8 });
  // Tabelle besonderer Winkel unter dem Kreis
  const tb = B.rt;
  if (tb && tb.h > fs * 7 && C.show.tab) {
    const angs = [0, 30, 45, 60, 90, 180, 270];
    const rows = angs.map(a => { const q = Trig.vals(a); return [a + '^\\circ', Trig.radTex(a), '\\col{r}{' + q.sinT + '}', '\\col{b}{' + q.cosT + '}']; });
    linTab(S, tb, [{ h: '\\varphi', w: 3.4 }, { h: '\\text{Bogen}', w: 3.6 }, { h: '\\sin\\varphi', w: 4 }, { h: '\\cos\\varphi', w: 4 }], rows, angs.indexOf(Trig.norm(deg)), C);
  }
  // Graph
  const degU = C.unit === 'deg', k = degU ? 180 / Math.PI : 1, X = degU ? deg : x;
  const T0 = degU ? { x0: -40, x1: 400, y0: -1.6, y1: 1.6 } : { x0: -0.7, x1: 2 * Math.PI + 0.7, y0: -1.6, y1: 1.6 };
  const win = Object.assign({}, trigWindow(C, B.rg, T0, [[X, sn], [X, cs]], 'circ' + C.unit), { y0: -s0, y1: s0 });   // gleiche Höhe wie der Kreis
  const ax = trigAxis(C, win, B.rg.w - fs * 3.9);
  const mg = difFrame(S, B.rg, win, C, Object.assign({ title: '\\col{r}{y=\\sin x}' + (C.show.cos ? '\\quad\\col{b}{y=\\cos x}' : ''), xlab: degU ? '\\varphi' : 'x', ylab: 'y' }, ax));
  S.maps.main = mg;
  if (C.show.cos) difCurve(S, mg, t => Math.cos(t / k), { col: TR_C, lw: 2.2, exp: C.exp });
  difCurve(S, mg, t => Math.sin(t / k), { col: TR_S, lw: 2.6, exp: C.exp });
  difSeg(S, mg, X, win.y0, X, win.y1, { col: TR_A, lw: 1.2, dash: true, a: 0.8 });
  difSeg(S, mg, X, 0, X, sn, { col: TR_S, lw: 3.2 });
  if (C.show.cos) linPt(S, mg, 'GC', X, cs, C, { fill: TR_C, r: 5, lab: Math.abs(sn - cs) < 0.25 ? undefined : '\\col{b}{' + linFmtS(cs) + '}', lines: [[1, -Math.sin(x) * (degU ? 1 / k : 1)], [0, 1]], w: fs * 4 });
  // Verbindung: P auf dem Kreis – Funktionswert im Graphen (gleiche Höhe)
  if (X >= win.x0 && X <= win.x1) S.line(mc.X(cs), mc.Y(sn), mg.X(X), mg.Y(sn), { col: TR_S, lw: 1.2, dash: true, a: 0.55, noclip: true });
  linPt(S, mg, 'G', X, sn, C, { fill: TR_S, r: 5.6, lab: '\\col{r}{\\sin\\varphi=' + linFmtS(sn) + '}', dx: fs * 4.4, dy: sn >= 0 ? -fs * 1.3 : fs * 1.3, w: fs * 7 });   // rechts oberhalb: nicht auf der Verbindungslinie
  if (B.rl) difLines(S, B.rl, Trig.sceneLines(Trig.st.circ(deg)), C, { max: fs * 1.12 });
}

// ═════════════ allgemeine Sinusfunktion ═════════════
function trigSceneGen(S, W, H, C) {
  const F = C.F, fs = C.fs, t = C.tt === undefined ? 1 : C.tt, P = Trig.props(F), f = Trig.fOf(F);
  const R = linLayout(W, H, [{ w: 0.6, rows: [2.3] }, { w: 0.4, rows: [2.0, 1.0] }]);
  const u = i => Math.max(0, Math.min(1, t * 4 - i));
  const a = 1 + (F.a - 1) * u(0), b = 1 + (F.b - 1) * u(1), c = F.c * u(2), d = F.d * u(3);
  const G = { a: Math.abs(a) < 1e-6 ? 1e-6 : a, b: Math.max(1e-6, b), c, d, kind: F.kind }, g = Trig.fOf(G);
  const stage = t >= 1 ? '\\col{b}{' + Trig.fTex(F, 'f(x)') + '}' : u(1) === 0 ? '\\col{r}{\\text{1. Amplitude: Strecken mit a}' + (F.a < 0 ? '\\text{, Spiegeln}' : '') + '}' : u(2) === 0 ? '\\col{v}{\\text{2. Periode: Faktor b im Argument}}' : u(3) === 0 ? '\\col{b}{\\text{3. Verschieben in x-Richtung um c}}' : '\\col{g}{\\text{4. Verschieben in y-Richtung um d}}';
  const T = P.T;
  const need = [[F.c, F.d], [F.c + T, F.d], [P.maxAt(0), P.max], [P.minAt(0), P.min], [0, 0], [-T / 4, 0]];
  const T0 = { x0: Math.min(-Math.PI / 2, F.c - T / 4) - 0.3, x1: Math.max(2 * Math.PI, F.c + 1.3 * T) + 0.3, y0: Math.min(-1.5, P.min - 0.5), y1: Math.max(1.5, P.max + 0.5) };
  const win = trigWindow(C, R[0], T0, need, 'gen');
  const ax = trigAxis(Object.assign({}, C, { unit: 'rad' }), win, R[0].w - fs * 3.9);
  const m = difFrame(S, R[0], win, C, Object.assign({ title: stage, xlab: 'x', ylab: 'y' }, ax));
  S.maps.main = m;
  if (F.deg) { difLine(S, m, 0, F.d, 0, { col: TR_C, lw: 2.4 }); return; }
  if (C.show.base) difCurve(S, m, x => (F.kind === 'cos' ? Math.cos(x) : Math.sin(x)), { col: 'M', lw: 1.4, dash: true, a: 0.7, exp: C.exp });
  if (t < 1) difCurve(S, m, f, { col: TR_A, lw: 1.3, dash: true, a: 0.45, exp: C.exp });
  if (C.show.mid) { difLine(S, m, 0, d, 0, { col: TR_T, lw: 1.2, dash: true, a: 0.8 }); S.rich(m.R - fs * 0.4, m.Y(d) - fs * 0.8, '\\col{g}{y=' + linFmtS(d) + '}', { size: fs * 0.85, col: 'T', al: 'r', bs: 'm' }); }
  if (C.show.amp && t >= 1) { difLine(S, m, 0, P.max, 0, { col: TR_S, lw: 1, dash: true, a: 0.5 }); difLine(S, m, 0, P.min, 0, { col: TR_S, lw: 1, dash: true, a: 0.5 }); }
  difCurve(S, m, g, { col: TR_C, lw: 2.8, exp: C.exp });
  if (t >= 1) {
    // Periode als Strecke auf der Mittellinie, Amplitude als Pfeil
    if (C.show.per) { difSeg(S, m, F.c, F.d, F.c + T, F.d, { col: TR_A, lw: 2.6 }); S.rich(m.X(F.c + T / 2), m.Y(F.d) + fs * 1.1 * (F.a > 0 ? 1 : -1), '\\col{v}{T=' + P.TTex + '}', { size: fs * 0.95, col: 'T', al: 'c', bs: 'm' }); }
    if (C.show.amp) { const xm = P.maxAt(0); difSeg(S, m, xm, F.d, xm, P.max, { col: TR_S, lw: 2.4 }); S.rich(m.X(xm) + fs * 0.9, m.Y((F.d + P.max) / 2), '\\col{r}{|a|=' + linFmtS(P.amp) + '}', { size: fs * 0.95, col: 'T', al: 'l', bs: 'm' }); }
    const ys = F.kind === 'cos' ? F.d + F.a : F.d;
    linPt(S, m, 'S', F.c, ys, C, { fill: TR_C, r: 5.8, lab: '\\col{b}{S(' + Trig.xTex(F.c) + '\\,|\\,' + linFmtS(ys) + ')}', lines: [[1, 0], [0, 1]], w: fs * 7 });
    linPt(S, m, 'A', P.maxAt(0), P.max, C, { fill: TR_S, r: 5.4, lab: '\\col{r}{H(' + Trig.xTex(P.maxAt(0)) + '\\,|\\,' + linFmtS(P.max) + ')}', lines: [[1, 0], [0, 1]], w: fs * 7 });
    linPt(S, m, 'T', F.c + T, ys, C, { fill: TR_A, r: 5.4, lab: '\\col{v}{' + Trig.xTex(F.c + T) + '}', lines: [[1, 0], [0, 1]], w: fs * 4 });
  }
  difLines(S, R[1], Trig.sceneLines(Trig.st.gen(F)), C, { max: fs * 1.12 });
  const info = [{ s: '\\text{Amplitude } |a|=' + Dif.E.qTex(P.ampq) + ',\\quad \\text{Periode } T=\\frac{2\\pi}{b}=' + P.TTex, size: 0.95 },
    { s: '\\text{Hochpunkte bei } x=' + Trig.xTex(P.maxAt(0)) + '+k\\cdot T,\\quad \\text{Tiefpunkte bei } x=' + Trig.xTex(P.minAt(0)) + '+k\\cdot T', size: 0.9, col: 'M' }];
  difLines(S, R[2], info, C, { max: fs * 1.08 });
}

// ═════════════ Tangens ═════════════
function trigSceneTan(S, W, H, C) {
  const fs = C.fs, deg = C.deg, x = Trig.deg2rad(deg), sn = Math.sin(x), cs = Math.cos(x), v = Trig.vals(deg), wide = W >= 820;
  const B = trigBand(W, H, C, false); void wide;
  const tn = v.pole ? NaN : sn / cs, big = 2.2;
  const mc = trigCircleFrame(S, B.rc, C, big, '\\text{Einheitskreis}\\quad\\col{v}{\\varphi=' + trAngLab(C, deg) + '}');
  S.maps.circ = mc;
  S.circ(mc.X(0), mc.Y(0), mc.X(1) - mc.X(0), { stroke: 'L', lw: 1.8 });
  difSeg(S, mc, 1, -big - 1, 1, big + 1, { col: TR_T, lw: 1.3, dash: true, a: 0.8 });
  S.rich(mc.X(1) + fs * 0.4, mc.T + fs * 0.9, '\\col{g}{x=1}', { size: fs * 0.85, col: 'T', al: 'l', bs: 'm' });
  trigArc(S, mc, 0.35, deg, { col: TR_A, lw: 2 });
  // Strahl durch P bis zur Tangente (bzw. bis zum Rand)
  const far = big * 1.6;
  if (!v.pole && Math.abs(tn) <= big + 1) { difSeg(S, mc, 0, 0, cs >= 0 ? 1 : -1, cs >= 0 ? tn : -tn, { col: 'T', lw: 1.3 }); if (cs < 0) difSeg(S, mc, 0, 0, 1, tn, { col: 'T', lw: 1.1, dash: true, a: 0.6 }); }
  else difSeg(S, mc, 0, 0, cs * far, sn * far, { col: 'T', lw: 1.3 });
  difSeg(S, mc, cs, 0, cs, sn, { col: TR_S, lw: 2.6, a: 0.8 });
  difSeg(S, mc, 0, 0, cs, 0, { col: TR_C, lw: 2.6, a: 0.8 });
  if (!v.pole) { difSeg(S, mc, 1, 0, 1, tn, { col: TR_T, lw: 3.6 }); linPt(S, mc, null, 1, tn, C, { fill: TR_T, r: 5 }); }   // Wert steht beim Graphen (gestrichelte Verbindung)
  else S.rich(mc.X(1) + fs * 0.4, mc.Y(0) - fs * 1.4, '\\col{r}{\\text{Polstelle}}', { size: fs * 0.9, col: 'T', al: 'l', bs: 'm' });
  linPt(S, mc, null, 0, 0, C, { fill: 'T', r: 3 });
  linPt(S, mc, 'P', cs, sn, C, { fill: TR_A, r: 6, lab: '\\col{v}{P}', lines: [[cs, sn], [1, 0]], w: fs * 2.5 });
  // Graph
  const degU = C.unit === 'deg', k = degU ? 180 / Math.PI : 1, X = degU ? deg : x;
  const T0 = degU ? { x0: -200, x1: 380, y0: -4, y1: 4 } : { x0: -1.2 * Math.PI, x1: 2.2 * Math.PI, y0: -4, y1: 4 };
  const win = Object.assign({}, trigWindow(C, B.rg, T0, [[X, isFinite(tn) ? Math.max(-2, Math.min(2, tn)) : 0]], 'tan' + C.unit), { y0: -big, y1: big });   // gleiche Höhe wie der Kreis
  const ax = trigAxis(C, win, B.rg.w - fs * 3.9);
  const mg = difFrame(S, B.rg, win, C, Object.assign({ title: '\\col{g}{y=\\tan x}' + (C.show.sc ? '\\quad\\col{r}{\\sin}\\ \\col{b}{\\cos}' : ''), xlab: degU ? '\\varphi' : 'x', ylab: 'y' }, ax));
  S.maps.main = mg;
  // Polstellen
  for (let j = -6; j <= 6; j++) { const xp = (Math.PI / 2 + j * Math.PI) * k; if (xp > win.x0 && xp < win.x1) difSeg(S, mg, xp, win.y0, xp, win.y1, { col: TR_S, lw: 1.2, dash: true, a: 0.7 }); }
  if (C.show.sc) { difCurve(S, mg, t => Math.sin(t / k), { col: TR_S, lw: 1.3, a: 0.6, exp: C.exp }); difCurve(S, mg, t => Math.cos(t / k), { col: TR_C, lw: 1.3, a: 0.6, exp: C.exp }); }
  difCurve(S, mg, t => Math.tan(t / k), { col: TR_T, lw: 2.6, exp: C.exp });
  difSeg(S, mg, X, win.y0, X, win.y1, { col: TR_A, lw: 1.2, dash: true, a: 0.8 });
  if (!v.pole && Math.abs(tn) < 100) { difSeg(S, mg, X, 0, X, tn, { col: TR_T, lw: 3.2 }); linPt(S, mg, 'G', X, tn, C, { fill: TR_T, r: 5.6, lab: '\\col{g}{\\tan\\varphi' + (v.exact ? '=' : '\\approx') + linFmtS(tn) + '}', lines: [[1, (1 + tn * tn) * (degU ? 1 / k : 1)], [0, 1], [1, 0]], w: fs * 7 }); }
  if (!v.pole && Math.abs(tn) <= big && X >= win.x0 && X <= win.x1) S.line(mc.X(1), mc.Y(tn), mg.X(X), mg.Y(tn), { col: TR_T, lw: 1.2, dash: true, a: 0.55, noclip: true });   // Tangentenabschnitt – Funktionswert
  if (B.rl) difLines(S, B.rl, Trig.sceneLines(Trig.st.tan(deg)), C, { max: fs * 1.12 });
}

const TRIG_SCENES = { circ: trigSceneCirc, gen: trigSceneGen, tan: trigSceneTan };
function trigBuildScene(W, H, C) {
  const S = linScene(), fn = TRIG_SCENES[C.view];
  if (fn) fn(S, W, H, C);
  return S;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { trigBuildScene, TRIG_SCENES };
