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
    if (C.show.upper) S.poly(shlP(S, 'up', stair('hi')), { fill: ST_B, col: ST_B, a: 0.26, close: true, lw: 1.2 });
    if (C.show.lower) S.poly(shlP(S, 'lo', stair('lo')), { fill: ST_G, col: ST_G, a: 0.42, close: true, lw: 1.2 });
    if (n <= 60) rs.rects.forEach(r => {
      const x0 = m.X(r.x0), x1 = m.X(r.x1);
      if (C.show.upper) S.rect(x0, Math.min(cy(m.Y(r.hi)), cy(Y0)), x1 - x0, Math.abs(cy(m.Y(r.hi)) - cy(Y0)), { stroke: ST_B, lw: 1.1 });
      if (C.show.lower) S.rect(x0, Math.min(cy(m.Y(r.lo)), cy(Y0)), x1 - x0, Math.abs(cy(m.Y(r.lo)) - cy(Y0)), { stroke: ST_G, lw: 1.1 });
    });
  }
  difCurve(S, m, f, { hl: 'f', col: 'T', lw: 2.4, exp: C.exp });
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
// ── Integralfunktion: Ausschnitt um die interessanten Stellen ──
// x-Bereich: Nullstellen, Extrema und Wendepunkte von f (dort hat F_a Extrema bzw. Wendepunkte; difSmartWin aus 61_dif_draw.js),
// sonst ein Standardbereich um 0; die untere Grenze a und die Stelle x liegen immer mit etwas Rand im Bild.
// base: zwischengespeichertes Ergebnis von difSmartWin (oder null). Ergebnis {x0, x1, y0, y1} für f; F_a passt sich darunter an.
function itgHsWin(F, base, a, x) {
  const f = F.f(0); let x0 = base ? base.x0 : -3, x1 = base ? base.x1 : 3, keep = !!base;
  const inc = v => { if (!isFinite(v)) return; const sp = x1 - x0; if (v < x0 + sp * 0.06) { x0 = v - sp * 0.12; keep = false; } if (v > x1 - sp * 0.06) { x1 = v + sp * 0.12; keep = false; } };
  inc(a); inc(x);
  if (!keep) { const st = Stat.niceStep(x1 - x0, 10) / 2; x0 = Math.floor(x0 / st + 1e-9) * st; x1 = Math.ceil(x1 / st - 1e-9) * st; }
  const y = keep ? [base.y0, base.y1] : difAutoY(f, x0, x1);
  return { x0, x1, y0: y[0], y1: y[1] };
}
function itgSceneHs(S, W, H, C) {
  const F = C.F, f = F.f(0), a = C.a, x = C.x, fs = C.fs, Fa = itgFa(F, a), cw = C.win || {};
  const R = stLayout(W, H, [{ w: 1, rows: [1.25, 1] }]);
  const expl = isFinite(cw.x0) && isFinite(cw.x1) && cw.x1 > cw.x0;      // vom Benutzer verschoben oder gezoomt
  const win = !expl && C.smart ? { x0: C.smart.x0, x1: C.smart.x1, y0: C.smart.y0, y1: C.smart.y1 } : itgWindow(C, [f]);
  const m1 = difFrame(S, R[0], win, C, { title: 'f(x)', xlab: 'x', ylab: 'y', info: 'x=\\col{b}{' + itgFmt(x) + '}' });
  const win2 = { x0: win.x0, x1: win.x1, y0: 0, y1: 1 };
  if (expl && isFinite(cw.s0) && isFinite(cw.s1) && cw.s1 > cw.s0) { win2.y0 = cw.s0; win2.y1 = cw.s1; }   // eigener y-Bereich des unteren Bildes
  else { const ya = difAutoY(Fa, win.x0, win.x1); win2.y0 = ya[0]; win2.y1 = ya[1]; }
  const Fx = Fa(x), m2 = difFrame(S, R[1], win2, C, { title: '\\col{v}{F_a(x)}=\\int_{a}^{x}f(t)\\,dt', xlab: 'x', ylab: 'y', info: '\\col{v}{F_a(' + itgFmt(x) + ')=' + itgFmt(Fx) + '}' });
  S.maps.main = m1; S.maps.sub = m2;
  if (C.show.shade !== false) itgShade(S, m1, f, null, a, x);
  difCurve(S, m1, f, { hl: 'f', col: 'T', lw: 2.4, exp: C.exp });
  difCurve(S, m2, Fa, { hl: 'Fa', col: ST_V, lw: 2.4, colorAt: t => (f(t) >= 0 ? ITG_POS : ITG_NEG), exp: C.exp });
  const fx = f(x);
  // senkrechte Verbindung und Punkte
  if (isFinite(fx) && isFinite(Fx)) {
    S.line(m1.X(x), m1.T, m1.X(x), m1.B, { col: ST_B, lw: 1.2, dash: true });
    S.line(m2.X(x), m2.T, m2.X(x), m2.B, { col: ST_B, lw: 1.2, dash: true });
    if (C.show.tangent !== false) difLine(S, m2, x, Fx, fx, { hl: 'tan', col: ST_G, lw: 2, a: 0.95 });
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
  if (G && C.show.anti !== false) difCurve(S, m, G, { hl: 'F', col: ST_V, lw: 2.2, exp: C.exp });
  difCurve(S, m, f, { hl: 'f', col: 'T', lw: 2.4, exp: C.exp });
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
  difCurve(S, m, f, { hl: 'f', col: 'T', lw: 2.4, exp: C.exp });
  if (g) difCurve(S, m, g, { hl: 'g', col: ST_V, lw: 2.4, exp: C.exp });
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
  const ang = typeof C.rotAng === 'number' && ok && b > a ? C.rotAng : null;   // Animation: der Graph dreht sich um die x-Achse
  if (ang !== null) {
    // Punkt des Graphen nach Drehung um den Winkel t (Blick schräg von der Seite: Kreise werden zu schmalen Ellipsen)
    const N = 90, at = (x, t) => { const r = f(x); if (!isFinite(r)) return null; const ry = m.Y(0) - m.Y(r); return [m.X(x) + Math.sin(t) * ry * 0.22, m.Y(0) - Math.cos(t) * ry]; };
    const curve = t => { const pts = []; for (let i = 0; i <= N; i++) { const q = at(a + (b - a) * i / N, t); if (q) pts.push(q); } return pts; };
    // überstrichene Fläche: frühere Lagen des Graphen (blass) und Kreisbögen an einigen Stellen
    for (let t = Math.PI / 6; t < ang - 0.05; t += Math.PI / 6) { const pts = curve(t); if (pts.length > 1) S.poly(pts, { col: ST_B, lw: 1.1, a: 0.35 }); }
    for (let i = 0; i <= 6; i++) { const x = a + (b - a) * i / 6, pts = []; for (let t = 0; t <= ang + 1e-9; t += Math.PI / 24) { const q = at(x, Math.min(t, ang)); if (q) pts.push(q); } const q = at(x, ang); if (q) pts.push(q); if (pts.length > 1) S.poly(pts, { col: ST_B, lw: i === 0 || i === 6 ? 1.6 : 1, a: i === 0 || i === 6 ? 0.9 : 0.5 }); }
    difCurve(S, m, f, { hl: 'f', col: 'T', lw: 2.4, exp: C.exp });
    const pts = curve(ang); if (pts.length > 1) S.poly(pts, { col: ST_V, lw: 2.6 });
  }
  if (ang === null && ok && b > a) for (let i = 0; i < n; i++) {
    const xm = a + (i + 0.5) * dx, r = f(xm); if (!isFinite(r)) continue; Vn += Math.PI * r * r * dx;
    const cx = m.X(xm), ry = Math.abs(m.Y(0) - m.Y(r)), rx = Math.min(Math.max(ry * 0.22, 2.5), (m.X(a + dx) - m.X(a)) * 0.9 + ry * 0.12);
    const pts = []; for (let k = 0; k <= 36; k++) { const t = 2 * Math.PI * k / 36; pts.push([cx + Math.cos(t) * rx, m.Y(0) - Math.sin(t) * ry]); }
    S.poly(shlP(S, 'disc', pts), { fill: ST_B, a: n > 40 ? 0.18 : 0.14, close: true, col: ST_B, lw: 1.1 });
  }
  if (ang === null) {
    difCurve(S, m, x => -f(x), { col: 'T', lw: 1.8, dash: true, exp: C.exp });
    difCurve(S, m, f, { hl: 'f', col: 'T', lw: 2.4, exp: C.exp });
    if (ok && b > a) { difSeg(S, m, a, -f(a), a, f(a), { col: ST_V, lw: 1.6 }); difSeg(S, m, b, -f(b), b, f(b), { col: ST_V, lw: 1.6 }); }
  }
  itgAxisPt(S, m, 'a', C.a, C, 'a'); itgAxisPt(S, m, 'b', C.b, C, 'b');
  const br = R[1], lines = [], at = itgQ(a), bt = itgQ(b);
  lines.push({ s: 'V=\\pi\\int_{' + at + '}^{' + bt + '}\\left(f(x)\\right)^{2}dx' });
  lines.push({ s: '\\text{Scheibe: }\\pi\\cdot f(x)^{2}\\cdot\\Delta x', col: 'M', size: 0.9 });
  if (ok && b > a) {
    if (ang === null) lines.push({ s: '\\col{b}{V_{' + n + '}\\approx ' + itgFmt(Vn) + '}\\ \\ \\text{(' + n + ' Scheiben)}' });
    else lines.push({ s: '\\col{v}{\\text{Der Graph dreht sich um die x-Achse.}}', size: 0.95 });
    const V = Int.volume(F, a, b), P = F.P && Dif.qOf(a) && Dif.qOf(b) ? Dif.E.pMul(Dif.E.pTrim(F.P), Dif.E.pTrim(F.P)) : null;
    lines.push(null);
    if (P) { const PI = Int.pInt(P), D = Dif.E.qSub(Dif.E.pEvalQ(PI, Dif.qOf(b)), Dif.E.pEvalQ(PI, Dif.qOf(a))); lines.push({ s: 'V=' + (Dif.E.qEq(D, Dif.E.q1) ? '' : Dif.E.qTex(D)) + '\\pi\\approx ' + itgFmt(V), col: ST_V, bold: true }); }
    else lines.push({ s: 'V\\approx ' + itgFmt(V), col: ST_V, bold: true });
  }
  difLines(S, br, lines, C, { max: fs * 1.25 });
}

// ═════════════ Partielle Integration: Kurve (u(x) | v(x)) und die zwei Flächen ═════════════
// Blau: Fläche zwischen Kurve und v-Achse = ∫ u dv = ∫ u·v′ dx; grün: zwischen Kurve und u-Achse = ∫ v du = ∫ v·u′ dx.
// Zusammen: grosses Rechteck u(b)·v(b) ohne kleines Rechteck u(a)·v(a). Rechts klein: u(x) und v(x) über x.
function itgPiCurve(U, V, a, b, N) {
  const u = U.f(0), v = V.f(0), out = [];
  for (let i = 0; i <= N; i++) { const x = a + (b - a) * i / N, p = [u(x), v(x), x]; if (isFinite(p[0]) && isFinite(p[1])) out.push(p); }
  return out;
}
function itgScenePi(S, W, H, C) {
  const U = C.U, V = C.V; if (!U || !V) return;
  const u = U.f(0), v = V.f(0), a = C.pa, b = C.pb, t = Math.min(Math.max(a, b), Math.max(Math.min(a, b), C.pt)), fs = C.fs;
  const R = stLayout(W, H, [{ w: 0.62, rows: [2.4] }, { w: 0.38, rows: [1, 1, 1.25] }]);
  const P = itgPiCurve(U, V, a, b, 240); if (P.length < 2) return;
  const sp = Math.abs(b - a) || 1, ext = itgPiCurve(U, V, a - sp * 0.6, b + sp * 0.6, 300);   // Fortsetzung (blass)
  const ua = u(a), va = v(a), ub = u(b), vb = v(b);
  // Ausschnitt: Kurve und Ursprung
  let win = C.win || {};
  if (!(isFinite(win.x0) && isFinite(win.x1) && win.x1 > win.x0 && isFinite(win.y0) && isFinite(win.y1) && win.y1 > win.y0)) {
    let u0 = 0, u1 = 0, v0 = 0, v1 = 0; P.forEach(p => { u0 = Math.min(u0, p[0]); u1 = Math.max(u1, p[0]); v0 = Math.min(v0, p[1]); v1 = Math.max(v1, p[1]); });
    const pu = (u1 - u0 || 1) * 0.16, pv = (v1 - v0 || 1) * 0.16;
    win = { x0: u0 - pu, x1: u1 + pu, y0: v0 - pv, y1: v1 + pv };
  }
  const qE = z => (Math.abs(z - Math.E) < 1e-9 ? 'e' : itgQ(z));
  const m = difFrame(S, R[0], win, C, { title: '\\text{Kurve}\\ \\big(u(x)\\,|\\,v(x)\\big),\\ ' + qE(Math.min(a, b)) + '\\le x\\le ' + qE(Math.max(a, b)), xlab: 'u', ylab: 'v' });
  S.maps.main = m;
  const X = m.X, Y = m.Y, Pm = P.map(p => [X(p[0]), Y(p[1])]);
  // kleines Rechteck u(a)·v(a) (grau) und die beiden Flächen
  S.poly(shlP(S, 'rect', [[X(0), Y(0)], [X(ua), Y(0)], [X(ua), Y(va)], [X(0), Y(va)]]), { fill: 'M', col: 'M', a: 0.22, close: true, lw: 0.6 });
  S.poly(shlP(S, 'vdu', [[X(ua), Y(0)]].concat(Pm, [[X(ub), Y(0)]])), { fill: ITG_POS, col: ITG_POS, a: 0.32, close: true, lw: 0.6 });
  S.poly(shlP(S, 'udv', [[X(0), Y(va)]].concat(Pm, [[X(0), Y(vb)]])), { fill: ST_B, col: ST_B, a: 0.30, close: true, lw: 0.6 });
  // Rechtecks-Ränder (gestrichelt)
  [[ub, 0, ub, vb], [0, vb, ub, vb], [ua, 0, ua, va], [0, va, ua, va]].forEach(q => itgSegN(S, m, q[0], q[1], q[2], q[3], { col: 'M', lw: 1.2, dash: true }));
  // Kurve: Fortsetzung blass, Stück von a bis b kräftig
  const Em = ext.map(p => [X(p[0]), Y(p[1])]); if (Em.length > 1) S.poly(Em, { col: 'M', lw: 1.3, a: 0.45, dash: true });
  S.poly(Pm, { col: 'T', lw: 2.6 }); shl(S, 'cur', Pm);
  // Flächen beschriften (Schwerpunkt grob)
  const N = Int.piNums(U, V, Math.min(a, b), Math.max(a, b));
  const cen = pts => { let sx = 0, sy = 0; pts.forEach(p => { sx += p[0]; sy += p[1]; }); return [sx / pts.length, sy / pts.length]; };
  const cB = cen([[X(0), Y(va)], [X(0), Y(vb)]].concat(Pm.map(q => [(q[0] + X(0)) / 2, q[1]]))), cG = cen([[X(ua), Y(0)], [X(ub), Y(0)]].concat(Pm.map(q => [q[0], (q[1] + Y(0)) / 2])));
  S.rich(cB[0], cB[1], '\\col{b}{\\int u\\,dv}', { size: fs * 1.05, col: 'T', al: 'c', bs: 'm' });
  S.rich(cG[0], cG[1], '\\col{g}{\\int v\\,du}', { size: fs * 1.05, col: 'T', al: 'c', bs: 'm' });
  if (Math.abs(X(ua) - X(0)) > fs * 4 && Math.abs(Y(va) - Y(0)) > fs * 1.8) S.rich((X(0) + X(ua)) / 2, (Y(0) + Y(va)) / 2, 'u(a)\\,v(a)', { size: fs * 0.9, col: 'M', al: 'c', bs: 'm' });
  // Punkte P(a), P(b) und der bewegliche Punkt P(x)
  const dot = (id, x, lab, col) => { const px = X(u(x)), py = Y(v(x)); if (!isFinite(px) || !isFinite(py)) return; S.circ(px, py, id === 't' ? 6 : 5, { fill: col, stroke: 'T', lw: 1.6 }); S.pts.push({ id, x: px, y: py, r: 12 }); difLabel(S, m, px + fs * 1.6, py - fs * 0.9, lab, C, { w: fs * 3.2 }); };
  dot('pa', a, 'x=' + qE(a), 'T'); dot('pb', b, 'x=' + qE(b), 'T');
  if (Math.abs(t - a) > 1e-9 && Math.abs(t - b) > 1e-9) dot('t', t, '\\col{v}{x=' + itgFmt(t) + '}', ST_V);
  // Achsen: u(a), u(b), v(a), v(b)
  const ax = Math.min(m.B, Math.max(m.T, Y(0))), ay = Math.min(m.R, Math.max(m.L, X(0)));
  if (Math.abs(X(ub) - X(ua)) > fs * 3) { S.rich(X(ua), ax + fs * 0.9, 'u(a)', { size: fs * 0.85, col: 'M', al: 'c', bs: 'm' }); S.rich(X(ub), ax + fs * 0.9, 'u(b)', { size: fs * 0.85, col: 'M', al: 'c', bs: 'm' }); }
  if (Math.abs(Y(vb) - Y(va)) > fs * 1.6) { S.rich(ay + fs * 0.4, Y(va) - fs * 0.6, 'v(a)', { size: fs * 0.85, col: 'M', al: 'l', bs: 'm' }); S.rich(ay + fs * 0.4, Y(vb) - fs * 0.6, 'v(b)', { size: fs * 0.85, col: 'M', al: 'l', bs: 'm' }); }
  // rechts: u(x) und v(x) über x, mit der Stelle x
  const lo = Math.min(a, b), hi = Math.max(a, b), xw = { x0: lo - sp * 0.15, x1: hi + sp * 0.15 };
  [[R[1], U, u, 'u(x)=' + Dif.tx(U.ast), ST_B], [R[2], V, v, 'v(x)=' + Dif.tx(V.ast), ITG_POS]].forEach(([r, F, f, ttl, col]) => {
    const yr = difAutoY(f, xw.x0, xw.x1, 200), w2 = { x0: xw.x0, x1: xw.x1, y0: Math.min(yr[0], 0), y1: Math.max(yr[1], 0) + 1e-9 };
    const m2 = difFrame(S, r, w2, C, { title: ttl, xlab: 'x', ylab: '' });
    difCurve(S, m2, f, { col, lw: 2.2, exp: C.exp });
    [a, b].forEach(x => itgSegN(S, m2, x, 0, x, f(x), { col: 'M', lw: 1, dash: true }));
    if (isFinite(f(t))) S.circ(m2.X(t), m2.Y(f(t)), 4.5, { fill: ST_V, stroke: 'T', lw: 1.2 });
  });
  // Rechenzeilen
  const lines = [
    { s: '\\int_a^b u\\,v\'\\,dx=\\Big[u\\,v\\Big]_a^b-\\int_a^b u\'\\,v\\,dx' }, null,
    { s: '\\col{b}{\\int u\\,dv}\\approx ' + itgFmt(N.I1) },
    { s: '\\col{g}{\\int v\\,du}\\approx ' + itgFmt(N.I2) },
    { s: 'u(b)\\,v(b)-u(a)\\,v(a)\\approx ' + itgFmt(N.ub * N.vb - N.ua * N.va), bold: true }
  ];
  difLines(S, R[3], lines, C, { max: fs * 1.2 });
}

// ═════════════ Substitution: Streifen links (x-Welt) ↔ Abbildung u = g(x) ↔ Streifen rechts (u-Welt) ═════════════
const ITG_STRIPS = ['#378ADD', '#2fa36b', '#f08a24', '#8a5cd0', '#d9486b', '#13a5a5'];
// Fläche zwischen Graph und Achse von x0 bis x1 (Vorzeichen egal) als Vieleck in einer Farbe
function itgSlice(S, m, f, x0, x1, col, a) {
  if (!(isFinite(x0) && isFinite(x1)) || x0 === x1) return;
  const N = Math.max(6, Math.min(80, Math.round(Math.abs(m.X(x1) - m.X(x0)) / 3))), clampY = y => Math.max(m.T - 2, Math.min(m.B + 2, y)), y0 = clampY(m.Y(0));
  const pts = [[m.X(x0), y0]];
  for (let i = 0; i <= N; i++) { const x = x0 + (x1 - x0) * i / N, y = f(x); if (!isFinite(y)) return; pts.push([m.X(x), clampY(m.Y(y))]); }
  pts.push([m.X(x1), y0]);
  S.poly(pts, { fill: col, col, a: a === undefined ? 0.42 : a, close: true, lw: 0.7 });
}
// Masse am markierten Streifen: Breite als Klammer an der Achse, Höhe als violette Strecke an der Stelle xp
function itgStripMeas(S, m, C, xL, xR, xp, yp, wl, hl, A) {
  const fs = C.fs, ay = Math.min(m.B, Math.max(m.T, m.Y(0))), XL = m.X(xL), XR = m.X(xR), px = m.X(xp), py = Math.min(m.B, Math.max(m.T, m.Y(yp)));
  const z = 0.88, box = s => (typeof difCellBox === 'function' ? difCellBox(s, fs * z) : { w: fs * z * 0.5 * s.length });
  if (xL !== xR && isFinite(XL) && isFinite(XR) && Math.max(XL, XR) > m.L && Math.min(XL, XR) < m.R) {
    const below = ay + fs * 2 <= m.B, yb = below ? ay + fs * 0.5 : ay - fs * 0.5, l = Math.max(m.L, Math.min(XL, XR)), r = Math.min(m.R, Math.max(XL, XR));
    S.line(l, yb, r, yb, { col: 'T', lw: 1.4 });
    [XL, XR].forEach(X => { if (X >= m.L - 0.5 && X <= m.R + 0.5) S.line(X, yb - 4, X, yb + 4, { col: 'T', lw: 1.4 }); });
    const wn = wl + '=' + itgFmt(Math.abs(xR - xL)), lab = r - l >= box(wn).w + 4 ? wn : r - l >= fs * 1.5 ? wl : '';
    if (lab) difLabel(S, m, (l + r) / 2, yb + (below ? fs * 0.95 : -fs * 0.85), lab, C, { w: box(lab).w, size: z });
  }
  if (isFinite(px) && isFinite(py) && px >= m.L && px <= m.R && Math.abs(py - ay) > 2) {
    S.line(px, ay, px, py, { col: ST_V, lw: 2.8 });
    const hn = hl + '\\approx ' + itgFmt(yp), w = box(hn).w, xr = Math.max(XL, XR, px) + 6;            // rechts neben dem Streifen, sonst links davon
    const x = xr + w <= m.R ? xr + w / 2 : Math.min(XL, XR, px) - 6 - w / 2;
    difLabel(S, m, x, py + (ay - py) * 0.55, hn, C, { w, size: z });
  }
  if (isFinite(A)) { const s = '\\col{v}{\\text{Streifen: Fläche}\\approx ' + itgFmt(A) + '}', w = box(s).w; difLabel(S, m, m.R - w / 2 - 8, m.T + fs * 0.85, s, C, { w, size: z }); }
}
function itgSceneSub(S, W, H, C) {
  const Fo = C.SF, G = C.SG; if (!Fo || !G) return;
  const IF = Int.subFn(Fo, G); if (!IF) return;
  const f = Fo.f(0), g = G.f(0), g1 = G.f(1), h = IF.f(0), a = C.sa, b = C.sb, n = Math.max(1, Math.min(60, Math.round(C.sn))), fs = C.fs;
  const lo = Math.min(a, b), hi = Math.max(a, b), sp = (hi - lo) || 1, t = Math.max(lo, Math.min(hi, C.st));
  const R = stLayout(W, H, [{ w: 0.37, rows: [2.5, 0.8] }, { w: 0.25, rows: [2.5, 0.8] }, { w: 0.38, rows: [2.5, 0.8] }]);
  const qE = z => (Math.abs(z - Math.E) < 1e-9 ? 'e' : itgQ(z));
  const xs = []; for (let i = 0; i <= n; i++) xs.push(a + (b - a) * i / n);
  const us = xs.map(g), ga = us[0], gb = us[n], uLo = Math.min(...us), uHi = Math.max(...us);
  const k0 = Math.min(n - 1, Math.max(0, Math.floor((t - lo) / sp * n)));      // Streifen mit der Stelle x (bei a > b gespiegelt)
  const kOf = i => (a <= b ? i : n - 1 - i), ks = kOf(k0), col = i => ITG_STRIPS[i % ITG_STRIPS.length];
  // Übergang x-Welt → u-Welt nur bei wachsendem g (sonst falten sich die Streifen)
  let canM = true; for (let i = 0; i <= 200; i++) { const d = g1(lo + sp * i / 200); if (!(isFinite(d) && d >= -1e-9)) { canM = false; break; } }
  const tm = canM ? Math.max(0, Math.min(1, +C.sm || 0)) : 0;
  // gemeinsamer Massstab für x-Welt und u-Welt: Breiten und Höhen direkt vergleichbar
  let w1 = C.win || {};
  if (!(isFinite(w1.x0) && isFinite(w1.x1) && w1.x1 > w1.x0 && isFinite(w1.y0) && isFinite(w1.y1) && w1.y1 > w1.y0)) {
    const L0 = Math.min(lo, uLo), L1 = Math.max(hi, uHi), ps = (L1 - L0) || 1, ya = difAutoY(h, lo, hi, 300), yb = difAutoY(f, uLo, uHi, 300);
    w1 = { x0: L0 - ps * 0.12, x1: L1 + ps * 0.12, y0: Math.min(0, ya[0], yb[0]), y1: Math.max(0, ya[1], yb[1]) };
    const py = (w1.y1 - w1.y0) * 0.1; w1.y0 -= w1.y0 < 0 ? py : 0; w1.y1 += py;
  }
  const inT = Dif.tx(simpOr(Dif.S.bin('mul', calcSubstitute(Fo.ast, 'x', G.ast), G.deriv(1)))), fT = Dif.tx(calcSubstitute(Fo.ast, 'x', Dif.S.idn('u')));
  const pc = Math.round(tm * 100);
  const m1 = difFrame(S, R[0], w1, C, tm === 0 ? { title: '\\text{x-Welt:}\\ ' + inT, xlab: 'x', ylab: '' }
    : tm < 1 ? { title: '\\text{Übergang x}\\to\\text{u:}\\ ' + pc + '\\,\\%', xlab: 'x\\to u', ylab: '' } : { title: '\\text{verformt}\\ =\\ \\text{u-Welt:}\\ f(u)=' + fT, xlab: 'u', ylab: '' });
  S.maps.main = m1;
  const xv = g(t), dX = xs[ks + 1] - xs[ks], dU = us[ks + 1] - us[ks], hv = h(t), fv = f(xv), dv = g1(t);
  const simp = (fn, x0, x1) => { const N = 600, hh = (x1 - x0) / N; let s = fn(x0) + fn(x1); for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * fn(x0 + i * hh); return s * hh / 3; };
  const sA = Math.abs(simp(h, xs[ks], xs[ks + 1]));
  if (tm === 0) {
    for (let i = 0; i < n; i++) itgSlice(S, m1, h, xs[i], xs[i + 1], col(i), i === ks ? 0.75 : 0.38);
    difCurve(S, m1, h, { hl: 'h', col: 'T', lw: 2.2, exp: C.exp });
    itgStripMeas(S, m1, C, xs[ks], xs[ks + 1], t, hv, '\\Delta x', 'f(g(x))\\cdot g\'(x)', sA);
    itgAxisPt(S, m1, 'sa', a, C, 'a=' + qE(a)); itgAxisPt(S, m1, 'sb', b, C, 'b=' + qE(b));
    const px = m1.X(t), py = Math.min(m1.B, Math.max(m1.T, m1.Y(0))); if (px >= m1.L && px <= m1.R) { S.line(px, m1.T, px, m1.B, { col: ST_V, lw: 1, dash: true, a: 0.7 }); S.circ(px, py, 5.5, { fill: ST_V, stroke: 'T', lw: 1.4 }); S.pts.push({ id: 'st', x: px, y: py, r: 12 }); }
  } else {
    // Verformung: Punkt x wandert nach (1−s)·x + s·g(x), Höhe wird durch die Dehnung (1−s) + s·g′(x) geteilt → Fläche bleibt gleich
    const X = x => (1 - tm) * x + tm * g(x), Y = x => (tm >= 1 ? f(g(x)) : h(x) / ((1 - tm) + tm * g1(x)));
    const cy = y => Math.max(m1.T - 2, Math.min(m1.B + 2, y)), y0 = cy(m1.Y(0));
    difCurve(S, m1, f, { col: 'M', lw: 1.3, dash: true, a: 0.55, exp: C.exp });
    for (let i = 0; i < n; i++) {
      const N = 40, pts = [[m1.X(X(xs[i])), y0]]; let ok = true;
      for (let j = 0; j <= N; j++) { const x = xs[i] + (xs[i + 1] - xs[i]) * j / N, px = m1.X(X(x)), py = m1.Y(Y(x)); if (!isFinite(px) || !isFinite(py)) { ok = false; break; } pts.push([px, cy(py)]); }
      pts.push([m1.X(X(xs[i + 1])), y0]);
      if (ok) S.poly(pts, { fill: col(i), col: col(i), a: i === ks ? 0.75 : 0.38, close: true, lw: 0.7 });
    }
    const cv = []; for (let j = 0; j <= 300; j++) { const x = lo + sp * j / 300, px = m1.X(X(x)), py = m1.Y(Y(x)); if (isFinite(px) && isFinite(py) && px >= m1.L - 1 && px <= m1.R + 1) cv.push([px, cy(py)]); }
    if (cv.length > 1) S.poly(cv, { col: 'T', lw: 2.2 });
    [[a, 'g(a)'], [b, 'g(b)']].forEach(([x, lab]) => { const px = m1.X(X(x)); if (px >= m1.L - 1 && px <= m1.R + 1) { S.circ(px, y0, 4.5, { fill: 'T', stroke: 'T', lw: 1.2 }); if (tm >= 1) difLabel(S, m1, px, y0 + fs * 1.35, lab, C, { w: fs * 2.4 }); } });
    const px = m1.X(X(t)); if (px >= m1.L && px <= m1.R) S.line(px, m1.T, px, m1.B, { col: ST_V, lw: 1, dash: true, a: 0.7 });
    itgStripMeas(S, m1, C, 0, 0, NaN, NaN, '', '', sA);
  }
  // Mitte: u = g(x), farbige Abschnitte auf beiden Achsen
  const us0 = (uHi - uLo) || 1;
  const yr2 = difAutoY(g, lo - sp * 0.15, hi + sp * 0.15, 200);
  const w2 = { x0: lo - sp * 0.15, x1: hi + sp * 0.15, y0: Math.min(yr2[0], uLo - us0 * 0.1), y1: Math.max(yr2[1], uHi + us0 * 0.1) };
  const m2 = difFrame(S, R[2], w2, C, { title: 'u=g(x)=' + Dif.tx(G.ast), xlab: 'x', ylab: 'u' });
  const ax2 = Math.min(m2.B, Math.max(m2.T, m2.Y(Math.max(w2.y0, Math.min(w2.y1, 0))))), ay2 = Math.min(m2.R, Math.max(m2.L, m2.X(Math.max(w2.x0, Math.min(w2.x1, 0)))));
  for (let i = 0; i < n; i++) {
    const sw = i === ks ? 5 : 3.5;
    S.line(m2.X(xs[i]), ax2, m2.X(xs[i + 1]), ax2, { col: col(i), lw: sw });
    S.line(ay2, m2.Y(us[i]), ay2, m2.Y(us[i + 1]), { col: col(i), lw: sw });
  }
  xs.forEach((x, i) => { if (n <= 24 || i === 0 || i === n) { S.line(m2.X(x), ax2, m2.X(x), m2.Y(us[i]), { col: 'M', lw: 0.8, dash: true, a: 0.7 }); S.line(m2.X(x), m2.Y(us[i]), ay2, m2.Y(us[i]), { col: 'M', lw: 0.8, dash: true, a: 0.7 }); } });
  difCurve(S, m2, g, { hl: 'g', col: 'T', lw: 2.2, exp: C.exp });
  // Tangente in x: Steigung g′(x) = Streckfaktor
  if (isFinite(xv) && isFinite(dv)) { difLine(S, m2, t, xv, dv, { col: ST_V, lw: 1.3, dash: true }); S.circ(m2.X(t), m2.Y(xv), 5, { fill: ST_V, stroke: 'T', lw: 1.3 }); }
  { const mx = (m2.X(xs[ks]) + m2.X(xs[ks + 1])) / 2, my = (m2.Y(us[ks]) + m2.Y(us[ks + 1])) / 2;
    if (Math.abs(m2.X(xs[ks + 1]) - m2.X(xs[ks])) >= fs * 1.4) difLabel(S, m2, mx, ax2 - fs * 0.75, '\\Delta x', C, { w: fs * 2 });
    if (Math.abs(m2.Y(us[ks + 1]) - m2.Y(us[ks])) >= fs * 0.9) difLabel(S, m2, ay2 + fs * 1.3, my, '\\Delta u', C, { w: fs * 2 }); }
  // unten: f(u) über u, gleicher Massstab wie oben
  const m3 = difFrame(S, R[4], m1.win, C, { title: '\\text{u-Welt:}\\ f(u)=' + fT, xlab: 'u', ylab: '' });
  for (let i = 0; i < n; i++) itgSlice(S, m3, f, us[i], us[i + 1], col(i), i === ks ? 0.75 : 0.38);
  difCurve(S, m3, f, { col: 'T', hl: 'fu', lw: 2.2, exp: C.exp });
  itgStripMeas(S, m3, C, us[ks], us[ks + 1], xv, fv, '\\Delta u', 'f(u)', sA);
  [[ga, 'g(a)'], [gb, 'g(b)']].forEach(([u, lab]) => { const px = m3.X(u), py = Math.min(m3.B, Math.max(m3.T, m3.Y(0))); if (px >= m3.L - 1 && px <= m3.R + 1) { S.circ(px, py, 4.5, { fill: 'T', stroke: 'T', lw: 1.2 }); difLabel(S, m3, px, py + fs * 1.35, lab, C, { w: fs * 2.4 }); } });
  if (isFinite(xv)) { const px = m3.X(xv); if (px >= m3.L && px <= m3.R) S.line(px, m3.T, px, m3.B, { col: ST_V, lw: 1, dash: true, a: 0.7 }); }
  // Zeilen unter den Bildern: Rechteck Breite·Höhe ≈ Streifenfläche, links und rechts gleich
  const IL = simp(h, a, b), IR = simp(f, ga, gb), sL = simp(h, xs[ks], xs[ks + 1]), F4 = itgFmt;
  const strip = '\\col{v}{\\text{Streifen}}\\approx ' + F4(sL);
  difLines(S, R[1], tm > 0 ? [{ s: '\\text{Fläche bleibt}\\approx ' + F4(IL), bold: true }, { s: '\\text{Breite}\\times g\'(x),\\ \\text{Höhe}\\div g\'(x)' }]
    : [{ s: '\\int_{' + qE(a) + '}^{' + qE(b) + '}' + inT + '\\,dx\\approx ' + F4(IL), bold: true }, { s: '\\Delta x\\cdot f(g(x))\\,g\'(x)\\approx ' + F4(dX) + '\\cdot ' + F4(hv) + '\\approx ' + F4(dX * hv) }, { s: strip }], C, { max: fs * 1.1 });
  difLines(S, R[3], [{ s: '\\Delta u\\approx g\'(x)\\cdot\\Delta x' }, { s: F4(dU) + '\\approx ' + F4(dv) + '\\cdot ' + F4(dX) }], C, { max: fs * 1.1 });
  difLines(S, R[5], [{ s: '\\int_{g(a)}^{g(b)}f(u)\\,du\\approx ' + F4(IR), bold: true }, { s: '\\Delta u\\cdot f(u)\\approx ' + F4(dU) + '\\cdot ' + F4(fv) + '\\approx ' + F4(dU * fv) }, { s: strip }], C, { max: fs * 1.1 });
  if (!canM && C.sm > 0) difLabel(S, m1, (m1.L + m1.R) / 2, m1.T + fs, '\\text{Übergang nur bei wachsendem g}', C, { col: ST_R });
}
const simpOr = n => { try { return calcSimplify(n); } catch (e) { return n; } };

const ITG_SCENES = { sum: itgSceneSum, hs: itgSceneHs, rg: itgSceneRg, ar: itgSceneAr, rot: itgSceneRot, pi: itgScenePi, sub: itgSceneSub };
function itgBuildScene(W, H, C) {
  const S = itgScene(), fn = ITG_SCENES[C.view];
  if (fn && (C.view === 'pi' ? C.U && C.V : C.view === 'sub' ? C.SF && C.SG : C.F)) fn(S, W, H, C);
  return S;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { itgBuildScene, ITG_SCENES, itgWindow, itgShade };
