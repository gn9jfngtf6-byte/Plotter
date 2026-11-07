// ═══════════════════════════════════════════════════════════════════
// 71_int_draw.js — Integralrechnung: Bilder (Szenen)
//
// Gleiche Bauweise wie die Differentialrechnung (61_dif_draw.js, dessen Rahmen, Kurven, Beschriftungen,
// Textblöcke und Tabellen hier wiederverwendet werden): jede Ansicht baut eine Szene, die auf den Canvas
// gemalt (statPaint) und als TikZ ausgegeben wird (stSceneTex).
//
// Ansichten:  sum  Ober-/Untersumme → Integral (n-Tabelle, Rechtecke)
//             hs   Integralfunktion und Hauptsatz (f über F_a)
//             rg   Stammfunktion mit Regeln, bestimmtes Integral
//             ar   Flächen zwischen Kurven (Schnittstellen, Teilflächen)
//             rot  Rotationskörper um die x-Achse (Scheiben)
// Kontext C: {view, F, G, mode, win:{x0,x1,y0,y1}, a, b, n, x, rotN, show:{…}, fs, exp}
// Farben: Untersumme grün, Obersumme blau, Fläche über der Achse grün, unter der Achse orange,
//         Integralfunktion/Stammfunktion violett.
// ═══════════════════════════════════════════════════════════════════
const ITG_POS = ST_G, ITG_NEG = ST_O;
const itgNum = (v, d) => difNum(v, d);
const itgScene = difScene;

// ── Bildausschnitt: x aus den Grenzen, y automatisch (Ausschnitt des Benutzers hat Vorrang) ──
function itgWindow(C, fns) {
  const w = C.win || {}; let x0 = w.x0, x1 = w.x1;
  if (!(isFinite(x0) && isFinite(x1) && x1 > x0)) {
    const lo = Math.min(C.a, C.b), hi = Math.max(C.a, C.b), sp = Math.max(hi - lo, 1);
    x0 = Math.min(lo, 0) - sp * 0.35; x1 = hi + sp * 0.35;
    if (lo > 0 && lo < sp * 1.2) x0 = -sp * 0.25;                // die y-Achse bleibt sichtbar, wenn sie nahe ist
    if (hi < 0 && -hi < sp * 1.2) x1 = sp * 0.25;
  }
  let y0 = w.y0, y1 = w.y1;
  if (!(isFinite(y0) && isFinite(y1) && y1 > y0)) {
    let lo = Infinity, hi = -Infinity;
    fns.forEach(g => { const r = difAutoY(g, x0, x1); lo = Math.min(lo, r[0]); hi = Math.max(hi, r[1]); });
    if (!isFinite(lo)) { lo = -5; hi = 5; }
    y0 = lo; y1 = hi;
  }
  return { x0, x1, y0, y1 };
}

// ── Fläche zwischen zwei Kurven (g = null: x-Achse) zwischen x0 und x1, nach Vorzeichen eingefärbt ──
function itgShade(S, m, f, g, x0, x1, o) {
  o = o || {}; if (!isFinite(x0) || !isFinite(x1) || x0 === x1) return;
  if (x1 < x0) { const t = x0; x0 = x1; x1 = t; }
  const gf = g || (() => 0), N = Math.max(40, Math.min(400, Math.round((x1 - x0) / (m.win.x1 - m.win.x0) * (m.R - m.L) / 2)));
  const clampY = y => Math.max(m.T - 2, Math.min(m.B + 2, y));
  let run = null;
  const flush = () => {
    if (run && run.top.length > 1) {
      const pts = run.top.concat(run.bot.slice().reverse());
      { const c = run.pos ? (o.pos || ITG_POS) : (o.neg || ITG_NEG); S.poly(pts, { fill: c, col: c, a: o.a === undefined ? 0.38 : o.a, close: true, lw: 0.6 }); }
    }
    run = null;
  };
  let px = x0, pd = f(x0) - gf(x0);
  const pt = (x, yf, yg) => ({ t: [m.X(x), clampY(m.Y(yf))], b: [m.X(x), clampY(m.Y(yg))] });
  for (let i = 1; i <= N; i++) {
    const x = x0 + (x1 - x0) * i / N, yf = f(x), yg = gf(x), d = yf - yg;
    if (!isFinite(d) || !isFinite(pd)) { flush(); px = x; pd = d; continue; }
    const pos = (pd + d) / 2 >= 0;
    if ((pd > 0 && d < 0) || (pd < 0 && d > 0)) {                // Nulldurchgang: Streifen teilen
      const t = pd / (pd - d), xm = px + (x - px) * t, ym = f(xm), gm = gf(xm), a = pt(xm, ym, gm);
      if (!run || run.pos !== (pd > 0)) { flush(); const p0 = pt(px, f(px), gf(px)); run = { pos: pd > 0, top: [p0.t], bot: [p0.b] }; }
      run.top.push(a.t); run.bot.push(a.b); flush();
      const p1 = pt(xm, ym, gm); run = { pos: d > 0, top: [p1.t], bot: [p1.b] };
      const q = pt(x, yf, yg); run.top.push(q.t); run.bot.push(q.b);
    } else {
      if (!run || run.pos !== pos) { flush(); const p0 = pt(px, f(px), gf(px)); run = { pos, top: [p0.t], bot: [p0.b] }; }
      const q = pt(x, yf, yg); run.top.push(q.t); run.bot.push(q.b);
    }
    px = x; pd = d;
  }
  flush();
}
// Punkt auf der x-Achse (ziehbar), mit Beschriftung
function itgAxisPt(S, m, id, x, C, lab, col) {
  const py = Math.min(m.B, Math.max(m.T, m.Y(0))), px = m.X(x);
  if (!(px >= m.L - 1 && px <= m.R + 1)) return;
  S.circ(px, py, 5.2, { fill: col || 'T', stroke: 'T', lw: 1.6 });
  S.pts.push({ id, x: px, y: py, r: 11 });
  difLabel(S, m, px, py + C.fs * 1.35, lab || id, C, { w: C.fs * 1.5 });
}
const itgFmt = v => (isFinite(v) ? itgNum(v, 4) : '?');
// Zahl als Bruch, wenn sie exakt ist (LaTeX)
function itgQ(v) { const q = Dif.qOf(v); return q ? Dif.E.qTex(q) : itgFmt(v); }
const itgSegN = (S, m, x1, y1, x2, y2, o) => difSeg(S, m, x1, y1, x2, y2, o);

// ═════════════ Ober-/Untersumme → Integral ═════════════
function itgSceneSum(S, W, H, C) {
  const F = C.F, f = F.f(0), a = C.a, b = C.b, n = C.n, fs = C.fs;
  const R = stLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: [1.45, 1.05] }]);
  const win = itgWindow(C, [f]), m = difFrame(S, R[0], win, C, { title: 'f(x)', xlab: 'x', ylab: 'y', info: '\\text{n}=' + n });
  S.maps.main = m;
  const lo = Math.min(a, b), hi = Math.max(a, b), rs = Int.riemann(F, lo, hi, n), ok = rs.ok;
  const Y0 = m.Y(0), cy = y => Math.max(m.T - 2, Math.min(m.B + 2, y));
  const stair = key => { const p = [[m.X(lo), cy(Y0)]]; rs.rects.forEach(r => { if (!isFinite(r[key])) return; p.push([m.X(r.x0), cy(m.Y(r[key]))], [m.X(r.x1), cy(m.Y(r[key]))]); }); p.push([m.X(hi), cy(Y0)]); return p; };
  if (ok && a !== b) {
    if (C.show.upper) S.poly(stair('hi'), { fill: ST_B, col: ST_B, a: 0.26, close: true, lw: 1.2 });
    if (C.show.lower) S.poly(stair('lo'), { fill: ST_G, col: ST_G, a: 0.42, close: true, lw: 1.2 });
    if (n <= 60) rs.rects.forEach(r => {
      const x0 = m.X(r.x0), x1 = m.X(r.x1);
      if (C.show.upper) S.rect(x0, Math.min(cy(m.Y(r.hi)), cy(Y0)), x1 - x0, Math.abs(cy(m.Y(r.hi)) - cy(Y0)), { stroke: ST_B, lw: 1.1 });
      if (C.show.lower) S.rect(x0, Math.min(cy(m.Y(r.lo)), cy(Y0)), x1 - x0, Math.abs(cy(m.Y(r.lo)) - cy(Y0)), { stroke: ST_G, lw: 1.1 });
    });
  }
  difCurve(S, m, f, { col: 'T', lw: 2.4, exp: C.exp });
  itgAxisPt(S, m, 'a', a, C, 'a'); itgAxisPt(S, m, 'b', b, C, 'b');
  if (!ok && a !== b) S.rich(m.L + (m.R - m.L) / 2, m.T + (m.B - m.T) / 2, '\\text{Die Funktion ist im Intervall nicht überall definiert.}', { size: fs, col: ST_R, al: 'c', bs: 'm' });
  // Tabelle n → U_n, O_n
  const tr = R[1], I = Int.def(F, lo, hi), cols = [{ h: 'n', w: 3.4 }, { h: '\\col{g}{U_n}', w: 5.0 }, { h: '\\col{b}{O_n}', w: 5.0 }, { h: 'O_n-U_n', w: 5.0 }];
  const ns = Int.SUM_NS.slice(); if (ns.indexOf(n) < 0) { ns.push(n); ns.sort((p, q) => p - q); }
  const rows = ns.map(k => { const r = k === n ? rs : Int.riemann(F, lo, hi, k); return [String(k), isFinite(r.lo) ? itgNum(r.lo, 4) : '?', isFinite(r.up) ? itgNum(r.up, 4) : '?', isFinite(r.up - r.lo) ? itgNum(r.up - r.lo, 4) : '?']; });
  if (isFinite(I.val)) rows.push(['\\infty', itgNum(I.val, 4), itgNum(I.val, 4), '0']);
  const tfs = Math.max(7.5, Math.min(fs, (tr.w - 6) / 19.5, (tr.h - fs * 1.2) / (difTableH(cols, rows, 10) / 10)));
  const tw = 18.4 * tfs, x00 = tr.x + Math.max(0, (tr.w - tw) / 2);
  difTable(S, x00, tr.y + tfs * 0.4, cols, rows, tfs, ns.indexOf(n), ST_V);
  // Formeln
  const br = R[2], lines = [], dxs = (b - a) / n;
  lines.push({ s: '\\Delta x=\\frac{b-a}{n}=\\frac{' + itgQ(b) + (a === 0 ? '' : '-' + (a < 0 ? '\\left(' + itgQ(a) + '\\right)' : itgQ(a))) + '}{' + n + '}=\\col{b}{' + itgFmt(Math.abs(dxs)) + '}' });
  if (ok) lines.push({ s: '\\col{g}{U_n=' + itgFmt(rs.lo) + '}\\ \\le\\ \\int_{' + itgQ(a) + '}^{' + itgQ(b) + '}f(x)\\,dx\\ \\le\\ \\col{b}{O_n=' + itgFmt(rs.up) + '}' });
  lines.push(null);
  if (isFinite(I.val)) lines.push({ s: '\\int_{' + itgQ(a) + '}^{' + itgQ(b) + '}f(x)\\,dx=' + (I.q ? Dif.E.qTex(I.q) + (I.q.d === 1n ? '' : '\\approx ' + itgFmt(I.val)) : '\\approx ' + itgFmt(I.val)), col: ST_V, bold: true });
  difLines(S, br, lines, C, { max: fs * 1.25 });
}

// ═════════════ Integralfunktion und Hauptsatz ═════════════
function itgFa(F, a) {
  const f = F.f(0), G = Int.antiNum(F), ga = G ? G(a) : 0;
  if (G && isFinite(ga)) return x => G(x) - ga;
  return x => (x === a ? 0 : Int.simpson(f, a, x, 160));
}
function itgSceneHs(S, W, H, C) {
  const F = C.F, f = F.f(0), a = C.a, x = C.x, fs = C.fs, Fa = itgFa(F, a);
  const R = stLayout(W, H, [{ w: 1, rows: [1.25, 1] }]);
  const win = itgWindow(C, [f]);
  const m1 = difFrame(S, R[0], win, C, { title: 'f(x)', xlab: 'x', ylab: 'y', info: 'x=\\col{b}{' + itgFmt(x) + '}' });
  const win2 = { x0: win.x0, x1: win.x1, y0: 0, y1: 1 }, ya = difAutoY(Fa, win.x0, win.x1);
  win2.y0 = ya[0]; win2.y1 = ya[1];
  const Fx = Fa(x), m2 = difFrame(S, R[1], win2, C, { title: '\\col{v}{F_a(x)}=\\int_{a}^{x}f(t)\\,dt', xlab: 'x', ylab: 'y', info: '\\col{v}{F_a(' + itgFmt(x) + ')=' + itgFmt(Fx) + '}' });
  S.maps.main = m1; S.maps.sub = m2;
  if (C.show.shade !== false) itgShade(S, m1, f, null, a, x);
  difCurve(S, m1, f, { col: 'T', lw: 2.4, exp: C.exp });
  difCurve(S, m2, Fa, { col: ST_V, lw: 2.4, colorAt: t => (f(t) >= 0 ? ITG_POS : ITG_NEG), exp: C.exp });
  const fx = f(x);
  // senkrechte Verbindung und Punkte
  if (isFinite(fx) && isFinite(Fx)) {
    S.line(m1.X(x), m1.T, m1.X(x), m1.B, { col: ST_B, lw: 1.2, dash: true });
    S.line(m2.X(x), m2.T, m2.X(x), m2.B, { col: ST_B, lw: 1.2, dash: true });
    if (C.show.tangent !== false) difLine(S, m2, x, Fx, fx, { col: ST_G, lw: 2, a: 0.95 });
    const P1 = difDot(S, m1, x, fx, { fill: ST_B, stroke: 'T', r: 5.2 });
    const P2 = difDot(S, m2, x, Fx, { fill: ST_V, stroke: 'T', r: 5.2 });
    if (P1) S.pts.push({ id: 'x', x: P1[0], y: P1[1], r: 11 });
    if (P2) S.pts.push({ id: 'x', x: P2[0], y: P2[1], r: 11 });
    if (P2) {                                         // Beschriftung auf der Seite der Tangente, wo die Kurve nicht verläuft
      const hh = (win.x1 - win.x0) * 1e-3, convex = f(x + hh) - f(x - hh) >= 0, sg = (fx >= 0 ? 1 : -1) * (convex ? 1 : -1);
      difLabel(S, m2, P2[0], P2[1] + (convex ? fs * 2.3 : -fs * 2.3), "\\col{g}{F_a'(x)=f(x)=" + itgFmt(fx) + '}', C, { w: fs * 12, dx: sg * fs * 5.5 });
    }
  }
  itgAxisPt(S, m1, 'a', a, C, 'a');
  itgAxisPt(S, m2, 'a2', a, C, 'a');
  S.pts.forEach(p => { if (p.id === 'a2') p.id = 'a'; });
}

// ═════════════ Stammfunktion mit Regeln und bestimmtes Integral ═════════════
function itgSceneRg(S, W, H, C) {
  const F = C.F, f = F.f(0), a = C.a, b = C.b, fs = C.fs, A = Int.anti(F), G = Int.antiNum(F);
  const R = stLayout(W, H, [{ w: 0.6, rows: [1.7] }, { w: 0.4, rows: [1] }]);
  const fns = [f]; if (G && C.show.anti !== false) fns.push(x => G(x) - (isFinite(G(a)) ? G(a) : 0));
  const win = itgWindow(C, fns), m = difFrame(S, R[0], win, C, { title: 'f(x)', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (C.show.fill !== false) itgShade(S, m, f, null, a, b);
  if (G && C.show.family) [-2, -1, 1, 2].forEach(c => difCurve(S, m, x => G(x) + c * Math.max(1, (win.y1 - win.y0) / 8), { col: ST_V, lw: 1.1, a: 0.35, dash: true, exp: C.exp }));
  if (G && C.show.anti !== false) difCurve(S, m, x => G(x), { col: ST_V, lw: 2.2, exp: C.exp });
  difCurve(S, m, f, { col: 'T', lw: 2.4, exp: C.exp });
  itgAxisPt(S, m, 'a', a, C, 'a'); itgAxisPt(S, m, 'b', b, C, 'b');
  // Rechenzeilen
  const br = R[1], lines = [], I = Int.def(F, a, b);
  const at = itgQ(a), bt = itgQ(b);
  if (A) {
    const Ft = F.P ? Dif.E.pTex(F._PI, 'x') : Dif.tx(A);
    lines.push({ s: 'f(x)=' + Dif.tx(F.ast) });
    lines.push({ s: '\\col{v}{F(x)}=' + Ft + '+C', col: 'T' });
    lines.push(null);
    lines.push({ s: '\\int_{' + at + '}^{' + bt + '}f(x)\\,dx=\\Big[F(x)\\Big]_{' + at + '}^{' + bt + '}=F(' + bt + ')-F(' + at + ')' });
    if (isFinite(I.val)) {
      const Gf = x => S2eval(A, x);
      lines.push({ s: '=' + itgFmt(Gf(b)) + '-' + (Gf(a) < 0 ? '\\left(' + itgFmt(Gf(a)) + '\\right)' : itgFmt(Gf(a))) });
      lines.push({ s: '=' + (I.q ? Dif.E.qTex(I.q) + (I.q.d === 1n ? '' : '\\approx ' + itgFmt(I.val)) : '\\approx ' + itgFmt(I.val)), col: ST_V, bold: true });
    }
  } else {
    lines.push({ s: 'f(x)=' + Dif.tx(F.ast) });
    lines.push({ s: '\\text{Keine Stammfunktion in einfacher Form.}', col: ST_R });
    if (isFinite(I.val)) lines.push({ s: '\\int_{' + at + '}^{' + bt + '}f(x)\\,dx\\approx ' + itgFmt(I.val), col: ST_V, bold: true });
  }
  difLines(S, br, lines, C, { max: fs * 1.25 });
}
const S2eval = (A, x) => Dif.S.evalNum(A, x);

// ═════════════ Flächen zwischen Kurven ═════════════
function itgSceneAr(S, W, H, C) {
  const F = C.F, G = C.mode === 'g' ? C.G : null, f = F.f(0), g = G ? G.f(0) : null, a = C.a, b = C.b, fs = C.fs;
  const R = stLayout(W, H, [{ w: 0.6, rows: [1.8] }, { w: 0.4, rows: [1] }]);
  const win = itgWindow(C, g ? [f, g] : [f]), m = difFrame(S, R[0], win, C, { title: g ? 'f(x)\\ \\text{und}\\ \\col{v}{g(x)}' : 'f(x)', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  const res = Int.areas(F, G, a, b);
  res.parts.forEach(p => itgShade(S, m, f, g, p.x0, p.x1));
  difCurve(S, m, f, { col: 'T', lw: 2.4, exp: C.exp });
  if (g) difCurve(S, m, g, { col: ST_V, lw: 2.4, exp: C.exp });
  res.pts.slice(1, -1).forEach((p, i) => {
    const P = difDot(S, m, p.x, f(p.x), { fill: ST_R, stroke: 'T', r: 4.6 });
    if (P) difLabel(S, m, P[0], P[1] - fs * 1.2, 'x_{' + (i + 1) + '}', C, { w: fs * 2 });
  });
  itgAxisPt(S, m, 'a', a, C, 'a'); itgAxisPt(S, m, 'b', b, C, 'b');
  // Tabelle der Teilflächen + Ergebnis
  const tr = R[1], cols = [{ h: '\\text{Stück}', w: 4.2 }, { h: '\\text{Integral}', w: 5.6 }, { h: '\\text{Fläche}', w: 5.6 }];
  const rows = res.parts.map((p, i) => { const r = ['A_{' + (i + 1) + '}', itgFmt(p.val), itgFmt(p.area)]; r.col = [null, p.sign < 0 ? ITG_NEG : ITG_POS, null]; return r; });
  rows.push(['A', itgFmt(res.parts.reduce((s, p) => s + p.val, 0)), itgFmt(res.total)]);
  const maxRows = Math.max(3, rows.length), hU = Math.max(difTableH(cols, rows, 10) / 10, 1.85 * (maxRows + 1)), tfs = Math.max(7.5, Math.min(fs, (tr.w - 6) / 16.4, (tr.h - fs * 5.5) / hU));
  difTable(S, tr.x + Math.max(0, (tr.w - 15.4 * tfs) / 2), tr.y + tfs * 0.4, cols, rows, tfs, rows.length - 1, ST_V);
  const ty = tr.y + tfs * 0.4 + difTableH(cols, rows, tfs) + fs * 0.8;
  const lines = [{ s: 'h(x)=' + (g ? 'f(x)-g(x)' : 'f(x)'), col: 'M', size: 0.9 }];
  lines.push({ s: '\\col{g}{\\text{grün}}\\ \\text{oberhalb, }\\col{o}{\\text{orange}}\\ \\text{unterhalb}', col: 'M', size: 0.85 });
  lines.push({ s: 'A=' + res.parts.map((p, i) => 'A_{' + (i + 1) + '}').join('+') + '\\approx ' + itgFmt(res.total), col: ST_V, bold: true });
  difLines(S, { x: tr.x, y: ty, w: tr.w, h: Math.max(10, tr.y + tr.h - ty) }, lines, C, { max: fs * 1.1 });
}

// ═════════════ Rotationskörper ═════════════
function itgSceneRot(S, W, H, C) {
  const F = C.F, f = F.f(0), a = Math.min(C.a, C.b), b = Math.max(C.a, C.b), fs = C.fs, n = C.rotN;
  const R = stLayout(W, H, [{ w: 0.6, rows: [1.7] }, { w: 0.4, rows: [1] }]);
  const win = itgWindow(C, [f, x => -f(x)]); win.y0 = Math.min(win.y0, -win.y1); win.y1 = Math.max(win.y1, -win.y0);
  const m = difFrame(S, R[0], win, C, { title: 'f(x)\\ \\text{und}\\ -f(x)', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  const dx = (b - a) / n, ok = Int.finiteOn(f, a, b);
  let Vn = 0;
  if (ok && b > a) for (let i = 0; i < n; i++) {
    const xm = a + (i + 0.5) * dx, r = f(xm); if (!isFinite(r)) continue; Vn += Math.PI * r * r * dx;
    const cx = m.X(xm), ry = Math.abs(m.Y(0) - m.Y(r)), rx = Math.min(Math.max(ry * 0.22, 2.5), (m.X(a + dx) - m.X(a)) * 0.9 + ry * 0.12);
    const pts = []; for (let k = 0; k <= 36; k++) { const t = 2 * Math.PI * k / 36; pts.push([cx + Math.cos(t) * rx, m.Y(0) - Math.sin(t) * ry]); }
    S.poly(pts, { fill: ST_B, a: n > 40 ? 0.18 : 0.14, close: true, col: ST_B, lw: 1.1 });
  }
  difCurve(S, m, x => -f(x), { col: 'T', lw: 1.8, dash: true, exp: C.exp });
  difCurve(S, m, f, { col: 'T', lw: 2.4, exp: C.exp });
  if (ok && b > a) { difSeg(S, m, a, -f(a), a, f(a), { col: ST_V, lw: 1.6 }); difSeg(S, m, b, -f(b), b, f(b), { col: ST_V, lw: 1.6 }); }
  itgAxisPt(S, m, 'a', C.a, C, 'a'); itgAxisPt(S, m, 'b', C.b, C, 'b');
  const br = R[1], lines = [], at = itgQ(a), bt = itgQ(b);
  lines.push({ s: 'V=\\pi\\int_{' + at + '}^{' + bt + '}\\left(f(x)\\right)^{2}dx' });
  lines.push({ s: '\\text{Scheibe: }\\pi\\cdot f(x)^{2}\\cdot\\Delta x', col: 'M', size: 0.9 });
  if (ok && b > a) {
    lines.push({ s: '\\col{b}{V_{' + n + '}\\approx ' + itgFmt(Vn) + '}\\ \\ \\text{(' + n + ' Scheiben)}' });
    const V = Int.volume(F, a, b), P = F.P && Dif.qOf(a) && Dif.qOf(b) ? Dif.E.pMul(Dif.E.pTrim(F.P), Dif.E.pTrim(F.P)) : null;
    lines.push(null);
    if (P) { const PI = Int.pInt(P), D = Dif.E.qSub(Dif.E.pEvalQ(PI, Dif.qOf(b)), Dif.E.pEvalQ(PI, Dif.qOf(a))); lines.push({ s: 'V=' + (Dif.E.qEq(D, Dif.E.q1) ? '' : Dif.E.qTex(D)) + '\\pi\\approx ' + itgFmt(V), col: ST_V, bold: true }); }
    else lines.push({ s: 'V\\approx ' + itgFmt(V), col: ST_V, bold: true });
  }
  difLines(S, br, lines, C, { max: fs * 1.25 });
}

const ITG_SCENES = { sum: itgSceneSum, hs: itgSceneHs, rg: itgSceneRg, ar: itgSceneAr, rot: itgSceneRot };
function itgBuildScene(W, H, C) {
  const S = itgScene(), fn = ITG_SCENES[C.view];
  if (fn && C.F) fn(S, W, H, C);
  return S;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { itgBuildScene, ITG_SCENES, itgWindow, itgShade };
