// ═══════════════════════════════════════════════════════════════════
// 91_pow_draw.js — Potenz- und Wurzelfunktionen: Bilder (Szenen)
//
// Gleiche Bauweise wie 86_quad_draw.js (Hilfen aus 81_lin_draw.js: linPt, linLayout, linTab, linFmt …; aus 61_dif_draw.js:
// difFrame, difCurve, difSeg, difLines). Der Massstab ist hier nicht in beiden Richtungen gleich (Potenzen wachsen schnell);
// nur die Wurzel-Ansicht (Spiegelung an y = x) verlangt gleiche Einheiten.
//
// Ansichten:  fam   Potenzfunktionen x^n (Familie, Symmetrie, Spiegelpunkt, Wertetabelle)
//             neg   negative Exponenten x^(−n) (Hyperbel, Asymptoten, Symmetrie)
//             root  Wurzelfunktion als Umkehrfunktion (Spiegelung an y = x, Potenzschreibweise, x^(m/n))
//             gen   allgemeine Form a(x−v)^p + h (Strecken, Spiegeln, Verschieben mit Animation)
//             eq    Gleichung f(x) = y0 (Fallunterscheidung, Lösungen im Bild)
// Kontext C: {view, F, n, m, xp, y0, tt, win, fs, exp, smooth, show}
// Farben: Funktion blau, Wurzel grün, Grundfunktion/Familie grau, Asymptoten rot, Spiegelpunkt violett, Gerade y0 orange.
// ═══════════════════════════════════════════════════════════════════
const PW_F = ST_B, PW_R = ST_G, PW_A = ST_R, PW_M = ST_V, PW_Y = ST_O;

function powNiceUp(v) {
  if (v <= 0) return 1;
  const e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e, c = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(x => x >= f - 1e-9);
  return c * e;
}
// Ausschnitt: unabhängige Achsen (o.eq: gleicher Massstab). o.x/o.y: Mindestbereich; need: Punkte, die drin sein sollen
function powWindow(C, r, need, o) {
  o = o || {};
  const w = C.win || {};
  if (isFinite(w.x0) && isFinite(w.x1) && isFinite(w.y0) && isFinite(w.y1) && w.x1 > w.x0 && w.y1 > w.y0) { const E = { x0: w.x0, x1: w.x1, y0: w.y0, y1: w.y1 }; return autoWin('pow', '', E, need, C, E); }
  const fs = C.fs, ratio = Math.max(0.25, Math.min(3, (r.h - fs * 4.5) / Math.max(50, r.w - fs * 3.9)));
  let x0 = o.x ? o.x[0] : -3, x1 = o.x ? o.x[1] : 3, y0 = o.y ? o.y[0] : -3, y1 = o.y ? o.y[1] : 3;
  (need || []).forEach(p => { if (isFinite(p[0]) && isFinite(p[1]) && Math.abs(p[0]) < 1e5 && Math.abs(p[1]) < 1e5) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } });
  const px = Math.max(0.5, (x1 - x0) * 0.12), py = Math.max(0.5, (y1 - y0) * 0.12);
  x0 -= px; x1 += px; y0 -= py; y1 += py;
  let T;
  if (o.eq) {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hx = powNiceUp(Math.max((x1 - x0) / 2, (y1 - y0) / 2 / ratio));
    T = { x0: cx - hx, x1: cx + hx, y0: cy - hx * ratio, y1: cy + hx * ratio };
  } else {
    const hx = powNiceUp((x1 - x0) / 2), hy = powNiceUp((y1 - y0) / 2), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    T = { x0: cx - hx, x1: cx + hx, y0: cy - hy, y1: cy + hy };
  }
  return autoWin('pow', C.view + '|' + (o.key || '') + '|' + ratio.toFixed(2), T, need, C);
}
const powCurve = (S, m, F, o) => difCurve(S, m, Pow.fOf(F), Object.assign({ col: PW_F, lw: 2.6, hl: 'f' }, o || {}));
const powMsg = (S, m, C, txt) => S.rich(m.L + (m.R - m.L) / 2, m.T + C.fs * 1.5, '\\text{' + txt + '}', { size: C.fs * 0.95, col: ST_R, al: 'c', bs: 'm' });
const powCoord = (n, x, y) => n + '(' + linFmtS(x) + '\\,|\\,' + linFmtS(y) + ')';
const powQ = q => Dif.E.qTex(q);
// Wert für Tabellen: exakt (Bruch) oder gerundet
function powVal(F, x) { const r = Pow.evalExact(F, x); if (!isFinite(r.y)) return '\\text{–}'; return r.exact ? powQ(r.yq) : linFmt(r.y); }
// Asymptoten einer Funktion mit negativem Exponenten
function powAsym(S, m, F, win) {
  const A = Pow.asymptotes(F); if (!A) return;
  difSeg(S, m, A.x, win.y0 - 1, A.x, win.y1 + 1, { col: PW_A, lw: 1.4, dash: true, a: 0.8 });
  difSeg(S, m, win.x0 - 1, A.y, win.x1 + 1, A.y, { col: PW_A, lw: 1.4, dash: true, a: 0.8 });
}
// Richtung der Kurve im Punkt x (für freie Beschriftung)
function powDir(F, x) { const f = Pow.fOf(F), h = 1e-3, d = (f(x + h) - f(x - h)) / (2 * h); return isFinite(d) ? [1, d] : [0, 1]; }

// ═════════════ Potenzfunktionen x^n ═════════════
function powSceneFam(S, W, H, C) {
  const n = C.n, fs = C.fs, F = Pow.base(n, 1), f = Pow.fOf(F), xp = C.xp, even = n % 2 === 0;
  const wide = W >= 820;
  const R = linLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: wide ? [1.25, 0.95, 1.6] : [1.6, 1.3] }]);
  const need = [[0, 0], [1, 1], [-1, even ? 1 : -1], [xp, f(xp)], [-xp, f(-xp)]];
  const win = powWindow(C, R[0], need, { x: [-2.5, 2.5], y: [-3, 3], key: 'fam' });
  const m = difFrame(S, R[0], win, C, { title: '\\col{b}{f(x)=x^{' + n + '}}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (C.show.fam) [1, 2, 3, 4, 5, 6].forEach(k => { if (k !== n) difCurve(S, m, difRaw(x => Math.pow(x, k), 'x^' + k), { col: 'M', lw: 1.1, a: 0.35, exp: C.exp }); });
  powCurve(S, m, F, { exp: C.exp });
  const nearP = x => Math.abs(xp - x) < 0.75 || (C.show.mirror && Math.abs(-xp - x) < 0.75);
  linPt(S, m, null, 1, 1, C, Object.assign({ fill: PW_R, r: 4.2 }, nearP(1) ? {} : { lab: '\\col{g}{(1\\,|\\,1)}', lines: [powDir(F, 1)], w: fs * 4 }));
  linPt(S, m, null, -1, even ? 1 : -1, C, Object.assign({ fill: PW_R, r: 4.2 }, nearP(-1) ? {} : { lab: '\\col{g}{(-1\\,|\\,' + (even ? '1' : '-1') + ')}', lines: [powDir(F, -1)], w: fs * 4.5 }));
  linPt(S, m, null, 0, 0, C, { fill: PW_R, r: 3.6 });
  if (C.show.mirror && Math.abs(xp) > 1e-9) {
    const yq = f(-xp);
    if (even) difSeg(S, m, -xp, yq, xp, yq, { col: PW_M, lw: 1.4, dash: true, a: 0.8 });
    else difSeg(S, m, -xp, yq, xp, f(xp), { col: PW_M, lw: 1.4, dash: true, a: 0.8 });
    linPt(S, m, null, -xp, yq, C, { fill: PW_M, r: 5, lab: '\\col{v}{' + powCoord("P'", -xp, yq) + '}', lines: [powDir(F, -xp), even ? [1, 0] : [xp, f(xp)]], w: fs * 8 });
  }
  linPt(S, m, 'P', xp, f(xp), C, { fill: PW_F, r: 5.8, lab: '\\col{b}{' + powCoord('P', xp, f(xp)) + '}', lines: [powDir(F, xp), even ? [1, 0] : [xp, f(xp)]], w: fs * 8 });
  const info = [{ s: '\\col{b}{f(x)=x^{' + n + '}}', bold: true },
    { s: even ? '\\text{n gerade: } f(-x)=f(x)' : '\\text{n ungerade: } f(-x)=-f(x)', size: 0.95 },
    { s: even ? '\\text{achsensymmetrisch zur y-Achse}' : '\\text{punktsymmetrisch zum Ursprung}', col: 'M', size: 0.9 },
    { s: 'D=\\mathbb{R},\\quad W=' + (even ? '[0;\\,\\infty[' : '\\mathbb{R}'), size: 0.95 },
    { s: '\\col{b}{f(' + linFmt(xp) + ')=' + powVal(F, xp) + '}', size: 0.95 }];
  if (C.show.mirror && Math.abs(xp) > 1e-9) info.push({ s: '\\col{v}{f(' + linFmt(-xp) + ')=' + powVal(F, -xp) + '}', size: 0.95 });
  difLines(S, R[1], info, C, { max: fs * 1.12 });
  const beh = [{ s: '\\text{Verlauf}', col: 'M', size: 0.8 },
    { s: even ? 'x\\to\\pm\\infty\\colon\\ f(x)\\to+\\infty' : 'x\\to\\pm\\infty\\colon\\ f(x)\\to\\pm\\infty', size: 0.92 },
    { s: even ? '\\text{fällt für } x<0,\\ \\text{steigt für } x>0' : '\\text{steigt auf ganz } \\mathbb{R}', size: 0.9, col: 'M' },
    n > 1 ? { s: '0<|x|<1\\colon\\ |x|^{' + n + '}<|x|,\\qquad |x|>1\\colon\\ |x|^{' + n + '}>|x|', size: 0.88, col: 'M' } : { s: '\\text{Winkelhalbierende } y=x', size: 0.9, col: 'M' }];
  difLines(S, R[2], beh, C, { max: fs * 1.08 });
  if (!wide) return;
  const xs = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
  const rows = xs.map(x => [linFmt(x).replace('-', '−'), powVal(F, x)]);
  linTab(S, R[3], [{ h: 'x', w: 4 }, { h: 'x^{' + n + '}', w: 6 }], rows, -1, C);
}

// ═════════════ negative Exponenten ═════════════
function powSceneNeg(S, W, H, C) {
  const n = C.n, fs = C.fs, F = Pow.base(-n, 1), f = Pow.fOf(F), xp = Math.abs(C.xp) < 1e-9 ? 0.5 : C.xp, even = n % 2 === 0;
  const wide = W >= 820;
  const R = linLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: wide ? [1.3, 1.0, 1.5] : [1.7, 1.2] }]);
  const need = [[1, 1], [-1, even ? 1 : -1], [xp, Math.max(-6, Math.min(6, f(xp)))], [-xp, Math.max(-6, Math.min(6, f(-xp)))]];
  const win = powWindow(C, R[0], need, { x: [-4, 4], y: [-4, 4], key: 'neg' });
  const m = difFrame(S, R[0], win, C, { title: '\\col{b}{f(x)=x^{-' + n + '}=\\frac{1}{x^{' + n + '}}}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  powAsym(S, m, F, win);
  if (C.show.fam) [1, 2, 3, 4].forEach(k => { if (k !== n) difCurve(S, m, difRaw(x => Math.pow(x, -k), 'x^(-' + k + ')'), { col: 'M', lw: 1.1, a: 0.35, exp: C.exp }); });
  powCurve(S, m, F, { exp: C.exp });
  const nearP = x => Math.abs(xp - x) < 0.75 || (C.show.mirror && Math.abs(-xp - x) < 0.75);
  linPt(S, m, null, 1, 1, C, Object.assign({ fill: PW_R, r: 4.2 }, nearP(1) ? {} : { lab: '\\col{g}{(1\\,|\\,1)}', lines: [powDir(F, 1)], w: fs * 4 }));
  linPt(S, m, null, -1, even ? 1 : -1, C, Object.assign({ fill: PW_R, r: 4.2 }, nearP(-1) ? {} : { lab: '\\col{g}{(-1\\,|\\,' + (even ? '1' : '-1') + ')}', lines: [powDir(F, -1)], w: fs * 4.5 }));
  if (C.show.mirror) {
    const yq = f(-xp);
    if (even) difSeg(S, m, -xp, yq, xp, yq, { col: PW_M, lw: 1.4, dash: true, a: 0.8 }); else difSeg(S, m, -xp, yq, xp, f(xp), { col: PW_M, lw: 1.4, dash: true, a: 0.8 });
    linPt(S, m, null, -xp, yq, C, { fill: PW_M, r: 5, lab: '\\col{v}{' + powCoord("P'", -xp, yq) + '}', lines: [powDir(F, -xp), even ? [1, 0] : [xp, f(xp)]], w: fs * 8 });
  }
  linPt(S, m, 'P', xp, f(xp), C, { fill: PW_F, r: 5.8, lab: '\\col{b}{' + powCoord('P', xp, f(xp)) + '}', lines: [powDir(F, xp), even ? [1, 0] : [xp, f(xp)]], w: fs * 8 });
  const info = [{ s: '\\col{b}{f(x)=\\frac{1}{x^{' + n + '}}}', bold: true },
    { s: 'D=\\mathbb{R}\\setminus\\{0\\},\\quad W=' + (even ? ']0;\\,\\infty[' : '\\mathbb{R}\\setminus\\{0\\}'), size: 0.95 },
    { s: '\\col{r}{\\text{Asymptoten: } x=0 \\text{ und } y=0}', size: 0.92 },
    { s: even ? '\\text{achsensymmetrisch zur y-Achse}' : '\\text{punktsymmetrisch zum Ursprung}', col: 'M', size: 0.9 },
    { s: '\\col{b}{f(' + linFmt(xp) + ')=' + powVal(F, xp) + '}', size: 0.95 }];
  difLines(S, R[1], info, C, { max: fs * 1.12 });
  const beh = [{ s: '\\text{Verhalten}', col: 'M', size: 0.8 },
    { s: 'x\\to0^+\\colon\\ f(x)\\to+\\infty,\\quad x\\to0^-\\colon\\ f(x)\\to' + (even ? '+' : '-') + '\\infty', size: 0.88 },
    { s: 'x\\to\\pm\\infty\\colon\\ f(x)\\to0', size: 0.92 }];
  difLines(S, R[2], beh, C, { max: fs * 1.08 });
  if (!wide) return;
  const xs = [-4, -2, -1, -0.5, -0.25, 0.25, 0.5, 1, 2, 4];
  const rows = xs.map(x => [linFmt(x).replace('-', '−'), powVal(F, x)]);
  linTab(S, R[3], [{ h: 'x', w: 4 }, { h: 'x^{-' + n + '}', w: 6 }], rows, -1, C);
}

// ═════════════ Wurzelfunktion als Umkehrfunktion ═════════════
function powSceneRoot(S, W, H, C) {
  const n = C.n, mm = C.m || 1, fs = C.fs, even = n % 2 === 0, P = Pow.base(n, 1), Rt = Pow.base(1, n), G = Pow.base(mm, n);
  const fP = Pow.fOf(P), fR = Pow.fOf(Rt);
  const xp = even ? Math.max(0, C.xp) : C.xp, yp = fP(xp);
  const R = linLayout(W, H, [{ w: 0.5, rows: [2.3] }, { w: 0.5, rows: [1.9, 1.1] }]);
  if (R[0].w > R[0].h * 1.45) { const nw = R[0].h * 1.45; R[0].x += (R[0].w - nw) / 2; R[0].w = nw; }   // Spiegelung an y = x: Bild nicht zu breit
  const need = [[0, 0], [1, 1], [xp, Math.max(-8, Math.min(8, yp))], [Math.max(-8, Math.min(8, yp)), xp], [4, fR(4)]];
  const win = powWindow(C, R[0], need, { x: even ? [-1, 4] : [-3, 3], y: even ? [-1, 4] : [-3, 3], eq: true, key: 'root' + n });
  const rootT = n === 2 ? '\\sqrt{x}' : '\\sqrt[' + n + ']{x}';
  const m = difFrame(S, R[0], win, C, { title: '\\col{g}{g(x)=' + rootT + '}\\ \\ \\col{b}{f(x)=x^{' + n + '}}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (C.show.diag) difLine(S, m, 0, 0, 1, { hl: 'diag', col: 'M', lw: 1.2, dash: true, a: 0.7 });
  if (C.show.pow) difCurve(S, m, difRaw(x => (even && x < 0 ? NaN : fP(x)), fP.rawOf()), { hl: 'pw', col: PW_F, lw: 2.2, a: 0.9, exp: C.exp });
  if (C.show.rat && mm !== 1) difCurve(S, m, Pow.fOf(G), { col: PW_Y, lw: 2.2, exp: C.exp });
  const fl = typeof C.flip === 'number';                                    // Animation: xⁿ klappt um y = x und wird zur Wurzelfunktion
  if (fl) difFlip(S, m, x => (even && x < 0 ? NaN : fP(x)), C.flip, { col: PW_R, lw: 2.8, a: 0.85 });
  else difCurve(S, m, fR, { hl: 'rt', col: PW_R, lw: 2.8, exp: C.exp });
  if (fl) { const s2 = (xp + yp) / 2, d2 = (xp - yp) / 2; difSeg(S, m, xp, yp, yp, xp, { col: PW_M, lw: 1.3, dash: true, a: 0.8 }); linPt(S, m, 'P', xp, yp, C, { fill: PW_F, r: 5.6 }); linPt(S, m, null, s2 + C.flip * d2, s2 - C.flip * d2, C, { fill: PW_R, r: 5.6 }); }
  else if (C.show.pow) {
    difSeg(S, m, xp, yp, yp, xp, { col: PW_M, lw: 1.3, dash: true, a: 0.8 });
    linPt(S, m, 'P', xp, yp, C, { fill: PW_F, r: 5.6, lab: '\\col{b}{' + powCoord('P', xp, yp) + '}', lines: [powDir(P, xp), [1, 1]], w: fs * 8 });
    linPt(S, m, null, yp, xp, C, { fill: PW_R, r: 5.6, lab: '\\col{g}{' + powCoord("P'", yp, xp) + '}', lines: [powDir(Rt, yp), [1, 1]], w: fs * 8 });
  } else linPt(S, m, 'P', yp, xp, C, { fill: PW_R, r: 5.6, lab: '\\col{g}{' + powCoord('P', yp, xp) + '}', lines: [powDir(Rt, yp)], w: fs * 8 });
  const lines = [{ s: '\\col{g}{g(x)=' + rootT + '=x^{\\frac{1}{' + n + '}}}', bold: true },
    { s: '\\text{Umkehrfunktion von } \\col{b}{f(x)=x^{' + n + '}}' + (even ? '\\ (x\\ge0)' : ''), size: 0.92 },
    { s: even ? 'D_g=[0;\\,\\infty[,\\quad W_g=[0;\\,\\infty[' : 'D_g=\\mathbb{R},\\quad W_g=\\mathbb{R}', size: 0.95 },
    { s: '\\col{b}{P(' + linFmtS(xp) + '\\,|\\,' + powVal(P, xp) + ')}\\ \\to\\ \\col{g}{P\'(' + powVal(P, xp) + '\\,|\\,' + linFmtS(xp) + ')}', size: 0.95 }];
  if (mm !== 1 && C.show.rat) lines.push({ s: '\\col{o}{x^{\\frac{' + mm + '}{' + n + '}}=' + (n === 2 ? '\\sqrt{x^{' + mm + '}}' : '\\sqrt[' + n + ']{x^{' + mm + '}}') + '=\\left(' + rootT + '\\right)^{' + mm + '}}', size: 0.95 });
  difLines(S, R[1], lines, C, { max: fs * 1.12 });
  const ks = even ? [0, 1, 2, 3] : [-2, -1, 0, 1, 2];
  const rows = ks.map(k => [linFmt(Math.pow(k, n)).replace('-', '−'), String(k).replace('-', '−')]);
  linTab(S, R[2], [{ h: 'x', w: 4.5 }, { h: rootT, w: 5 }], rows, -1, C);
}

// ═════════════ allgemeine Form ═════════════
function powSceneGen(S, W, H, C) {
  const F = C.F, fs = C.fs, t = C.tt === undefined ? 1 : C.tt;
  const R = linLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: [1.9, 0.9] }]);
  const u1 = Math.max(0, Math.min(1, t * 3)), u2 = Math.max(0, Math.min(1, t * 3 - 1)), u3 = Math.max(0, Math.min(1, t * 3 - 2));
  const s = 1 + (F.a - 1) * u1, xv = F.v * u2, yv = F.h * u3;
  const G = Pow.mk(s === 0 ? 1e-6 : s, xv, yv, F.m, F.n), g = Pow.fOf(G), f = Pow.fOf(F);
  const stage = t >= 1 ? '\\col{b}{' + Pow.fTex(F, 'f(x)') + '}' : u2 === 0 ? '\\col{r}{\\text{1. Strecken mit a}' + (F.a < 0 ? '\\text{ und Spiegeln}' : '') + '}' : u3 === 0 ? '\\col{b}{\\text{2. Verschieben in x-Richtung}}' : '\\col{g}{\\text{3. Verschieben in y-Richtung}}';
  const need = [[0, 0], [F.v, F.h], [F.v + 1, F.h + F.a], [F.v - 1, f(F.v - 1)], [F.v + 2, f(F.v + 2)]].filter(p => isFinite(p[1]) && Math.abs(p[1]) < 12);
  if (F.m < 0) { need.push([F.v + 0.5, f(F.v + 0.5)], [F.v - 0.5, f(F.v - 0.5)]); }
  const win = powWindow(C, R[0], need.map(p => [p[0], Math.max(-10, Math.min(10, p[1]))]), { x: [-3, 3], y: [-3, 3], key: 'gen' + F.kind });
  const m = difFrame(S, R[0], win, C, { title: stage, xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (F.deg) { powCurve(S, m, F); powMsg(S, m, C, 'Für a = 0 ist f konstant.'); return; }
  difCurve(S, m, Pow.fOf(Pow.base(F.m, F.n)), { hl: 'base', col: 'M', lw: 1.5, dash: true, a: 0.7, exp: C.exp });
  if (t < 1) powCurve(S, m, F, { lw: 1.4, dash: true, a: 0.45, col: PW_M, exp: C.exp });
  powAsym(S, m, G, win);
  difCurve(S, m, g, { hl: 'f', col: PW_F, lw: 2.8, exp: C.exp });
  if (u2 > 0 && F.v !== 0) difSeg(S, m, 0, 0, xv, 0, { col: ST_B, lw: 2.4 });
  if (u3 > 0 && F.h !== 0) difSeg(S, m, xv, 0, xv, yv, { col: ST_G, lw: 2.4 });
  // Streckfaktor: 1 nach rechts, a nach oben (vom Punkt (v|h) aus)
  if (isFinite(g(xv + 1))) {
    difSeg(S, m, xv, yv, xv + 1, yv, { col: ST_B, lw: 1.8, dash: true }); difSeg(S, m, xv + 1, yv, xv + 1, yv + s, { col: PW_A, lw: 2.2 });
    linPt(S, m, t >= 1 ? 'A' : null, xv + 1, yv + s, C, { fill: PW_A, r: 4.8, lab: '\\col{r}{a=' + linFmt(s) + '}', lines: [powDir(G, xv + 1)], w: fs * 5 });
  }
  const sym = Pow.symmetry(F), name = F.m < 0 ? 'Z' : sym.kind === 'odd' ? 'Z' : sym.kind === 'even' ? 'S' : 'P';
  linPt(S, m, t >= 1 ? 'S' : null, xv, yv, C, { fill: PW_M, r: F.m < 0 ? 4.2 : 5.8, stroke: PW_M, lab: '\\col{v}{' + powCoord(name, xv, yv) + '}', lines: [[1, 0], [0, 1]], w: fs * 8 });
  difLines(S, R[1], Pow.sceneLines(Pow.st.gen(F)), C, { max: fs * 1.12 });
  const info = [], A = Pow.asymptotes(F);
  if (A) info.push({ s: '\\col{r}{\\text{Asymptoten: } x=' + powQ(F.vq) + ',\\ y=' + powQ(F.hq) + '}', size: 0.92 });
  else info.push({ s: sym.kind === 'even' ? '\\text{achsensymmetrisch zu } x=' + powQ(F.vq) : sym.kind === 'odd' ? '\\text{punktsymmetrisch zu } Z(' + powQ(F.vq) + '\\,|\\,' + powQ(F.hq) + ')' : '\\text{Startpunkt } P(' + powQ(F.vq) + '\\,|\\,' + powQ(F.hq) + ')', col: 'M', size: 0.9 });
  difLines(S, R[2], info, C, { max: fs * 1.08 });
}

// ═════════════ Gleichung f(x) = y0 ═════════════
function powSceneEq(S, W, H, C) {
  const F = C.F, fs = C.fs, y0 = C.y0, f = Pow.fOf(F), Rs = Pow.solve(F, y0);
  const R = linLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: [2.2, 0.8] }]);
  const need = [[0, 0], [F.v, F.h], [F.v + 1, F.h + F.a], [0, y0]].filter(p => isFinite(p[1]));
  if (Rs.kind !== 'deg') Rs.sols.forEach(s => need.push([s.x, y0]));
  const win = powWindow(C, R[0], need.map(p => [Math.max(-12, Math.min(12, p[0])), Math.max(-10, Math.min(10, p[1]))]), { x: [-3, 3], y: [-3, 3], key: 'eq' + F.kind });
  const m = difFrame(S, R[0], win, C, { title: '\\col{b}{' + Pow.fTex(F, 'f(x)') + '}\\quad\\col{o}{y=' + linFmt(y0) + '}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (F.deg) { powCurve(S, m, F); powMsg(S, m, C, 'Für a = 0 ist f konstant.'); return; }
  powAsym(S, m, F, win);
  powCurve(S, m, F, { exp: C.exp });
  difLine(S, m, 0, y0, 0, { hl: 'yl', col: PW_Y, lw: 2.2 });
  linPt(S, m, 'Y', win.x0 + (win.x1 - win.x0) * 0.08, y0, C, { fill: PW_Y, r: 5.2, lab: '\\col{o}{y=' + linFmt(y0) + '}', dy: -fs * 1.4, dx: fs * 1.5, w: fs * 5 });
  Rs.sols.forEach((s, i) => {
    difSeg(S, m, s.x, 0, s.x, y0, { col: PW_R, lw: 1.3, dash: true, a: 0.8 });
    linPt(S, m, null, s.x, y0, C, { fill: PW_R, r: 5.8, lab: '\\col{g}{x' + (Rs.sols.length > 1 ? '_' + (i + 1) : '') + '=' + linFmtS(s.x) + '}', lines: [[1, 0], powDir(F, s.x)], w: fs * 6 });
    linPt(S, m, null, s.x, 0, C, { fill: PW_R, r: 3.6 });
  });
  difLines(S, R[1], Pow.sceneLines(Pow.st.eq(F, y0)), C, { max: fs * 1.12 });
  const word = Rs.kind === 'two' ? '\\text{zwei Lösungen}' : Rs.kind === 'one' ? '\\text{eine Lösung}' : '\\text{keine Lösung}';
  const info = [{ s: '\\col{' + (Rs.kind === 'none' ? 'r' : 'g') + '}{' + Pow.termTex(Pow.innerOf(F), F.m, F.n) + '=' + powQ(Rs.cq) + '\\ \\Rightarrow\\ ' + word + '}', bold: true }];
  const D = Pow.domain(F); info.push({ s: 'D=' + D.tex + ',\\quad W=' + Pow.range(F).tex, size: 0.92, col: 'M' });
  difLines(S, R[2], info, C, { max: fs * 1.08 });
}

const POW_SCENES = { fam: powSceneFam, neg: powSceneNeg, root: powSceneRoot, gen: powSceneGen, eq: powSceneEq };
function powBuildScene(W, H, C) {
  const S = linScene(), fn = POW_SCENES[C.view];
  if (fn) fn(S, W, H, C);
  return S;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { powBuildScene, POW_SCENES, powWindow };
