// ═══════════════════════════════════════════════════════════════════
// 99c_inv_draw.js — Umkehrfunktionen: Bilder (Szenen)
//
// Gleiche Bauweise wie 94_exp_draw.js. Spiegelung an y = x verlangt gleichen Massstab (o.eq) in den Ansichten
// mirror, calc und pairs; die Ansicht test (waagrechte Gerade) darf unabhängige Achsen haben.
//
// Ansichten:  mirror  Begriff: Wertetabelle rückwärts, Punkt P ↔ P′, Graph von f⁻¹ als Spiegelbild, D/W tauschen
//             test    Umkehrbarkeit: waagrechte Gerade y = k (ziehbar), Schnittstellen, Einschränkung x ≥ r (ziehbar)
//             calc    Umkehrfunktion berechnen: Rechenweg neben dem Bild
//             pairs   bekannte Paare (x²/√x, 2^x/log₂, e^x/ln, sin/arcsin …) mit Verkettung an der Stelle x₀
// Kontext C: {view, R, xp, k, r, pair, x0, win, fs, exp, smooth, show}
// Farben: f blau, f⁻¹ grün, Winkelhalbierende grau, Spiegelpunkt violett, Gerade y = k orange, Einschränkung rot.
// ═══════════════════════════════════════════════════════════════════
const IV_F = ST_B, IV_G = ST_G, IV_M = ST_V, IV_K = ST_O, IV_R = ST_R;

function invWindow(C, r, need, o) {
  o = o || {};
  const w = C.win || {};
  if (isFinite(w.x0) && isFinite(w.x1) && isFinite(w.y0) && isFinite(w.y1) && w.x1 > w.x0 && w.y1 > w.y0) { const E = { x0: w.x0, x1: w.x1, y0: w.y0, y1: w.y1 }; return autoWin('inv', '', E, need, C, E); }
  const fs = C.fs, ratio = Math.max(0.25, Math.min(3, (r.h - fs * 4.5) / Math.max(50, r.w - fs * 3.9)));
  let x0 = o.x ? o.x[0] : -3, x1 = o.x ? o.x[1] : 3, y0 = o.y ? o.y[0] : -3, y1 = o.y ? o.y[1] : 3;
  (need || []).forEach(p => { if (isFinite(p[0]) && isFinite(p[1]) && Math.abs(p[0]) < 1e5 && Math.abs(p[1]) < 1e5) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } });
  const px = Math.max(0.5, (x1 - x0) * 0.1), py = Math.max(0.5, (y1 - y0) * 0.1);
  x0 -= px; x1 += px; y0 -= py; y1 += py;
  let T;
  if (o.eq) { const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hx = powNiceUp(Math.max((x1 - x0) / 2, (y1 - y0) / 2 / ratio)); T = { x0: cx - hx, x1: cx + hx, y0: cy - hx * ratio, y1: cy + hx * ratio }; }
  else { const hx = powNiceUp((x1 - x0) / 2), hy = powNiceUp((y1 - y0) / 2), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; T = { x0: cx - hx, x1: cx + hx, y0: cy - hy, y1: cy + hy }; }
  return autoWin('inv', C.view + '|' + (o.key || '') + '|' + ratio.toFixed(2), T, need, C);
}
const invClamp = (y, lim) => Math.max(-lim, Math.min(lim, y));
const invCoord = (n, x, y) => n + '(' + linFmtS(x) + '\\,|\\,' + linFmtS(y) + ')';
// Beschriftung von P′: liegt P nahe der Winkelhalbierenden, kommt sie unter den Punkt (sonst überdeckt sie die von P)
const invLabQ = (x, y, fs, dirs) => (Math.abs(x - y) < 0.6 ? { dx: fs * 1.6, dy: fs * 1.5 } : { lines: dirs });
function invDir(f, x) { const h = 1e-3, d = (f(x + h) - f(x - h)) / (2 * h); return isFinite(d) ? [1, d] : [0, 1]; }
// quadratischer Bereich für Spiegelbilder
function invSquare(R0) { if (R0.w > R0.h * 1.3) { const nw = R0.h * 1.3; R0.x += (R0.w - nw) / 2; R0.w = nw; } return R0; }
// f (blau) mit Einschränkung: der zugelassene Ast kräftig, der Rest grau
function invDrawF(S, m, R, C, I) {
  const f = Inv.fOf(R);
  if (I.inj) { difCurve(S, m, f, { hl: 'f', col: IV_F, lw: 2.6, exp: C.exp }); return; }
  const r = I.r;
  difCurve(S, m, difRaw(x => (x < r ? f(x) : NaN), f.rawOf && f.rawOf()), { col: 'M', lw: 1.4, dash: true, a: 0.6, exp: C.exp });
  difCurve(S, m, difRaw(x => (x >= r ? f(x) : NaN), f.rawOf && f.rawOf()), { hl: 'f', col: IV_F, lw: 2.6, exp: C.exp });
}
const invDrawG = (S, m, R, C, o) => difCurve(S, m, Inv.invOf(R), Object.assign({ col: IV_G, lw: 2.6, exp: C.exp, hl: 'fi' }, o || {}));
// Stelle in den zugelassenen Bereich holen
function invClampX(R, x) {
  const I = Inv.info(R), lo = I.inj ? I.D.lo : I.r;
  if (lo !== null && lo !== undefined) { const strict = (I.inj ? I.D.open : I.Dr.open); if (x < lo + (strict ? 0.05 : 0)) x = lo + (strict ? 0.5 : 0); }
  if (I.D.hole !== null && I.D.hole !== undefined && Math.abs(x - I.D.hole) < 1e-9) x = I.D.hole + 0.5;
  return x;
}

// ═════════════ Begriff: Spiegelung ═════════════
function invSceneMirror(S, W, H, C) {
  const R = C.R, fs = C.fs, I = Inv.info(R), f = Inv.fOf(R), xp = invClampX(R, C.xp), yp = f(xp), wide = W >= 820;
  const Rl = linLayout(W, H, [{ w: 0.5, rows: [2.3] }, { w: 0.5, rows: wide ? [1.8, 1.2] : [1.6] }]);
  invSquare(Rl[0]);
  const lim = 8;
  const need = [[0, 0], [xp, invClamp(yp, lim)], [invClamp(yp, lim), xp]];
  const win = invWindow(C, Rl[0], need, { x: [-4, 4], y: [-4, 4], eq: true, key: 'mirror' + R.type });
  const m = difFrame(S, Rl[0], win, C, { title: '\\col{b}{' + Inv.fTex(R) + '}\\quad\\col{g}{' + Inv.invTex(R) + '}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (C.show.diag) difLine(S, m, 0, 0, 1, { hl: 'diag', col: 'M', lw: 1.2, dash: true, a: 0.7 });
  invDrawF(S, m, R, C, I);
  const fl = typeof C.flip === 'number';                                    // Animation: der Graph klappt um y = x
  if (fl) difFlip(S, m, I.inj ? f : (x => (x >= I.r ? f(x) : NaN)), C.flip, { col: IV_G, lw: 2.6, a: 0.85 });
  else if (C.show.inv) invDrawG(S, m, R, C);
  // Tabellenpunkte und ihre Spiegelbilder
  const xs = [-2, -1, 0, 1, 2, 3].map(k => invClampX(R, xp + k)).filter((v, i, a) => a.indexOf(v) === i);
  if (C.show.pts) xs.forEach(x => { const y = f(x); if (!isFinite(y) || Math.abs(x - xp) < 1e-9) return; linPt(S, m, null, x, y, C, { fill: IV_F, r: 3.4, a: 0.7 }); if (fl) { const s2 = (x + y) / 2, d2 = (x - y) / 2; linPt(S, m, null, s2 + C.flip * d2, s2 - C.flip * d2, C, { fill: IV_G, r: 3.4 }); } else if (C.show.inv) linPt(S, m, null, y, x, C, { fill: IV_G, r: 3.4 }); });
  if (isFinite(yp)) {
    difSeg(S, m, xp, yp, yp, xp, { col: IV_M, lw: 1.3, dash: true, a: 0.8 });
    linPt(S, m, 'P', xp, yp, C, { fill: IV_F, r: 5.8, lab: '\\col{b}{' + invCoord('P', xp, yp) + '}', lines: [invDir(f, xp), [1, 1]], w: fs * 8 });
    if (fl) { const s2 = (xp + yp) / 2, d2 = (xp - yp) / 2; linPt(S, m, null, s2 + C.flip * d2, s2 - C.flip * d2, C, { fill: IV_G, r: 5.8 }); }
    else if (C.show.inv) linPt(S, m, 'Q', yp, xp, C, Object.assign({ fill: IV_G, r: 5.8, lab: '\\col{g}{' + invCoord("P'", yp, xp) + '}', w: fs * 8 }, invLabQ(xp, yp, fs, [invDir(Inv.invOf(R), yp), [1, 1]])));
  }
  difLines(S, Rl[1], Inv.sceneLines(Inv.st.mirror(R, xp)), C, { max: fs * 1.12 });
  if (!wide) return;
  const rows = xs.map(x => [linFmtS(x).replace('-', '−'), isFinite(f(x)) ? linFmtS(f(x)).replace('-', '−') : '–']);
  const r2 = Rl[2], half = { x: r2.x, y: r2.y, w: r2.w / 2 - fs * 0.4, h: r2.h }, half2 = { x: r2.x + r2.w / 2 + fs * 0.4, y: r2.y, w: r2.w / 2 - fs * 0.4, h: r2.h };
  linTab(S, half, [{ h: 'x', w: 3.6 }, { h: '\\col{b}{f(x)}', w: 4 }], rows, xs.indexOf(xp), C);
  linTab(S, half2, [{ h: 'x', w: 4 }, { h: '\\col{g}{f^{-1}(x)}', w: 4 }], rows.map(r => [r[1], r[0]]), xs.indexOf(xp), C);
}

// ═════════════ Umkehrbarkeit: waagrechte Gerade ═════════════
function invSceneTest(S, W, H, C) {
  const R0 = C.R, fs = C.fs, I0 = Inv.info(R0), R = I0.inj ? R0 : Inv.restrict(R0, C.r), I = Inv.info(R), f = Inv.fOf(R), k = C.k;
  const Rl = linLayout(W, H, [{ w: 0.58, rows: [2.3] }, { w: 0.42, rows: [2.1, 0.9] }]);
  const lim = 12;
  const need = [[0, 0], [0, k], [-2, invClamp(f(-2), lim)], [2, invClamp(f(2), lim)]];
  if (!I.inj) need.push([I.r, invClamp(f(I.r), lim)], [I.r0, invClamp(f(I.r0), lim)]);
  const win = invWindow(C, Rl[0], need, { x: [-3, 3], y: [-3, 4], key: 'test' + R.type });
  const hits = Inv.hits(R0, k, win.x0, win.x1);
  const m = difFrame(S, Rl[0], win, C, { title: '\\col{b}{' + Inv.fTex(R) + '}\\quad\\col{o}{y=' + linFmtS(k) + '}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (!I.inj && C.show.inv) { difSeg(S, m, I.r, win.y0, I.r, win.y1, { col: IV_R, lw: 1.3, dash: true, a: 0.8 }); S.rich(m.X(I.r) + fs * 0.4, m.T + fs * 0.9, '\\col{r}{x\\ge' + linFmtS(I.r) + '}', { size: fs * 0.9, col: 'T', al: 'l', bs: 'm' }); }
  invDrawF(S, m, R, C, I);
  if (C.show.inv) { if (C.show.diag) difLine(S, m, 0, 0, 1, { col: 'M', lw: 1.1, dash: true, a: 0.6 }); invDrawG(S, m, R, C, { lw: 2, a: 0.85 }); }
  difLine(S, m, 0, k, 0, { hl: 'kl', col: IV_K, lw: 2.2 });
  linPt(S, m, 'K', win.x0 + (win.x1 - win.x0) * 0.08, k, C, { fill: IV_K, r: 5.2, lab: '\\col{o}{y=' + linFmtS(k) + '}', dy: -fs * 1.4, dx: fs * 1.5, w: fs * 5 });
  hits.forEach((x, i) => {
    const ok = I.inj || x >= I.r - 1e-9;
    difSeg(S, m, x, 0, x, k, { col: ok ? IV_G : 'M', lw: 1.2, dash: true, a: 0.8 });
    linPt(S, m, null, x, k, C, { fill: ok ? IV_G : 'M', r: 5.4, lab: '\\col{' + (ok ? 'g' : 'r') + '}{x' + (hits.length > 1 ? '_' + (i + 1) : '') + '=' + linFmtS(x) + '}', lines: [[1, 0], invDir(Inv.fOf(R0), x)], w: fs * 6 });
  });
  if (!I.inj) linPt(S, m, 'R', I.r, 0, C, { fill: IV_R, r: 5.6, lab: '\\col{r}{r=' + linFmtS(I.r) + '}', dy: fs * 1.4, w: fs * 5 });
  difLines(S, Rl[1], Inv.sceneLines(Inv.st.test(R, k, hits)), C, { max: fs * 1.12 });
  const n = hits.length, inWin = hits.filter(x => I.inj || x >= I.r - 1e-9).length;
  const info = [{ s: '\\col{' + (n > 1 ? 'r' : 'g') + '}{\\text{Gerade } y=' + linFmtS(k) + '\\text{: ' + (n === 0 ? 'kein Schnittpunkt' : n === 1 ? 'ein Schnittpunkt' : n + ' Schnittpunkte') + '}}', bold: true }];
  if (!I.inj) info.push({ s: '\\text{Auf } x\\ge' + linFmtS(I.r) + '\\text{: ' + (inWin <= 1 ? 'höchstens ein Schnittpunkt – umkehrbar' : 'zwei Schnittpunkte – Einschränkung zu klein') + '}', size: 0.92, col: 'M' });
  else info.push({ s: '\\text{f ist ' + (R.type === 'lin' ? (R.m > 0 ? 'steigend' : 'fallend') : 'streng monoton') + ': jede waagrechte Gerade trifft höchstens einmal}', size: 0.92, col: 'M' });
  difLines(S, Rl[2], info, C, { max: fs * 1.08 });
}

// ═════════════ Umkehrfunktion berechnen ═════════════
function invSceneCalc(S, W, H, C) {
  const R = C.R, fs = C.fs, I = Inv.info(R), f = Inv.fOf(R), x0 = invClampX(R, C.xp), y0 = f(x0);
  const Rl = linLayout(W, H, [{ w: 0.48, rows: [2.3] }, { w: 0.52, rows: [3] }]);
  invSquare(Rl[0]);
  const lim = 8, need = [[0, 0], [x0, invClamp(y0, lim)], [invClamp(y0, lim), x0]];
  const win = invWindow(C, Rl[0], need, { x: [-4, 4], y: [-4, 4], eq: true, key: 'calc' + R.type });
  const m = difFrame(S, Rl[0], win, C, { title: '\\col{b}{' + Inv.fTex(R) + '}\\quad\\col{g}{' + Inv.invTex(R) + '}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (C.show.diag) difLine(S, m, 0, 0, 1, { hl: 'diag', col: 'M', lw: 1.2, dash: true, a: 0.7 });
  invDrawF(S, m, R, C, I); invDrawG(S, m, R, C);
  if (isFinite(y0)) {
    difSeg(S, m, x0, y0, y0, x0, { col: IV_M, lw: 1.3, dash: true, a: 0.8 });
    linPt(S, m, 'P', x0, y0, C, { fill: IV_F, r: 5.8, lab: '\\col{b}{' + invCoord('P', x0, y0) + '}', lines: [invDir(f, x0), [1, 1]], w: fs * 8 });
    linPt(S, m, 'Q', y0, x0, C, Object.assign({ fill: IV_G, r: 5.4, lab: '\\col{g}{' + invCoord("P'", y0, x0) + '}', w: fs * 8 }, invLabQ(x0, y0, fs, [invDir(Inv.invOf(R), y0), [1, 1]])));
  }
  difLines(S, Rl[1], Inv.sceneLines(Inv.st.calc(R, x0)), C, { max: fs * 1.15 });
}

// ═════════════ bekannte Paare ═════════════
function invScenePairs(S, W, H, C) {
  const P = C.pair, fs = C.fs, wide = W >= 820;
  let x0 = C.x0; if (P.xr) { if (P.xr[0] !== null && x0 < P.xr[0]) x0 = P.xr[0]; if (P.xr[1] !== null && x0 > P.xr[1]) x0 = P.xr[1]; }
  if (P.id === 'rec' && Math.abs(x0) < 1e-9) x0 = 0.5;
  const y0 = P.f(x0);
  const Rl = linLayout(W, H, [{ w: 0.5, rows: [2.3] }, { w: 0.5, rows: wide ? [1.9, 1.1] : [1.6] }]);
  invSquare(Rl[0]);
  const lim = 8, need = [[0, 0], [x0, invClamp(y0, lim)], [invClamp(y0, lim), x0], [1, invClamp(P.f(1), lim)], [invClamp(P.f(1), lim), 1]];
  const win = invWindow(C, Rl[0], need, { x: [-3, 3], y: [-3, 3], eq: true, key: 'pair' + P.id });
  const m = difFrame(S, Rl[0], win, C, { title: '\\col{b}{' + P.fTex + '}\\quad\\col{g}{' + P.gTex + '}', xlab: 'x', ylab: 'y' });
  S.maps.main = m;
  if (C.show.diag) difLine(S, m, 0, 0, 1, { hl: 'diag', col: 'M', lw: 1.2, dash: true, a: 0.7 });
  if (P.gray) difCurve(S, m, P.gray, { col: 'M', lw: 1.3, dash: true, a: 0.6, exp: C.exp });
  if (P.xr) { P.xr.forEach(b => { if (b !== null) difSeg(S, m, b, win.y0, b, win.y1, { col: IV_R, lw: 1, dash: true, a: 0.5 }); }); }
  difCurve(S, m, P.f, { hl: 'f', col: IV_F, lw: 2.6, exp: C.exp });
  difCurve(S, m, P.g, { hl: 'fi', col: IV_G, lw: 2.6, exp: C.exp });
  if (isFinite(y0)) {
    difSeg(S, m, x0, y0, y0, x0, { col: IV_M, lw: 1.3, dash: true, a: 0.8 });
    linPt(S, m, 'P', x0, y0, C, { fill: IV_F, r: 5.8, lab: '\\col{b}{' + invCoord('P', x0, y0) + '}', lines: [invDir(P.f, x0), [1, 1]], w: fs * 8 });
    linPt(S, m, 'Q', y0, x0, C, Object.assign({ fill: IV_G, r: 5.4, lab: '\\col{g}{' + invCoord("P'", y0, x0) + '}', w: fs * 8 }, invLabQ(x0, y0, fs, [invDir(P.g, y0), [1, 1]])));
  }
  difLines(S, Rl[1], Inv.sceneLines(Inv.st.pairs(P, x0)), C, { max: fs * 1.12 });
  if (!wide) return;
  const info = [{ s: '\\col{b}{D_f=' + P.Df + ',\\ W_f=' + P.Wf + '}', size: 0.95 }, { s: '\\col{g}{D_{f^{-1}}=' + P.Dg + ',\\ W_{f^{-1}}=' + P.Wg + '}', size: 0.95 }];
  difLines(S, Rl[2], info, C, { max: fs * 1.08 });
}

const INV_SCENES = { mirror: invSceneMirror, test: invSceneTest, calc: invSceneCalc, pairs: invScenePairs };
function invBuildScene(W, H, C) {
  const S = linScene(), fn = INV_SCENES[C.view];
  if (fn) fn(S, W, H, C);
  return S;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { invBuildScene, INV_SCENES, invWindow };
