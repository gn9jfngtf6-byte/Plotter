// ═════════════════════════════════════════════════════════════════
// MODUL 70: int — Rechenkern der Umgebung «Integralrechnung» (ohne DOM, node-testbar)
//
// Baut auf dem Kern der Differentialrechnung (60_dif.js: Dif.makeFn, Dif.tx, Dif.DOC …),
// 16_calculus.js (Stammfunktion), 20_exact.js (Brüche, Wurzeln, Polynome).
//
//   Int.anti(F)               Stammfunktion als AST (Polynome exakt), sonst null
//   Int.def(F, a, b)          bestimmtes Integral: {val, q (exakt, wenn möglich), how}
//   Int.riemann(F, a, b, n)   Unter- und Obersumme mit n gleich breiten Streifen (Rechtecke, Summen)
//   Int.sumTable(F, a, b)     Tabelle n → Untersumme, Obersumme, Differenz
//   Int.sumExact(F, a, b)     Ober-/Untersumme als Polynom in 1/n (Summenformeln), für wachsende/fallende Polynome
//   Int.areas(F, G, a, b)     Fläche zwischen f und g (G = null: x-Achse): Schnittstellen, Teilflächen
//   Int.volume(F, a, b)       Rotationsvolumen um die x-Achse (π·∫f²)
//   Rechenwege (SV.Doc): 70b_int_docs.js
// ═════════════════════════════════════════════════════════════════
const Int = (function () {
  const E = Dif.E, S = Dif.S;
  const { fmt, qOf, polyAst, hasX } = Dif;
  const q0 = E.q0, q1 = E.q1;

  // ───────────────────── Stammfunktion ─────────────────────
  function pInt(P) {                                   // Polynom integrieren (ohne Konstante)
    const r = [q0];
    for (let k = 0; k < P.length; k++) r.push(E.qDiv(P[k], E.Q(k + 1)));
    return E.pTrim(r);
  }
  function antiOf(ast) {
    let A = null;
    try { A = typeof calcIntegrateOwn === 'function' ? calcIntegrateOwn(ast, 'x') : null; } catch (e) { A = null; }
    if (!A && typeof nerdamer !== 'undefined' && typeof calcIntegrate === 'function') { try { A = calcIntegrate(ast, 'x'); } catch (e) { A = null; } }
    return A;
  }
  // Probe: F' = f an einigen Stellen
  function derivOk(A, f) {
    let n = 0;
    for (const x of [0.3, 0.9, 1.7, 2.4, -0.6, -1.3, 3.1, 0.55]) {
      const fx = f(x); if (!isFinite(fx)) continue;
      const h = 1e-5, d = (S.evalNum(A, x + h) - S.evalNum(A, x - h)) / (2 * h);
      if (!isFinite(d)) continue;
      if (Math.abs(d - fx) > 1e-4 * (1 + Math.abs(fx))) return false;
      n++;
    }
    return n >= 2;
  }
  function anti(F) {
    if (!F) return null;
    if (F._anti !== undefined) return F._anti;
    let A = null;
    if (F.P) { F._PI = pInt(F.P); A = polyAst(F._PI); }
    else { A = antiOf(F.ast); if (A && !derivOk(A, F.f(0))) A = null; }
    F._anti = A;
    return A;
  }
  const antiPoly = F => { anti(F); return F && F.P ? F._PI : null; };
  // Stammfunktion numerisch (nur wo sie existiert), sonst null
  function antiNum(F) { const A = anti(F); return A ? (x => S.evalNum(A, x)) : null; }

  // ───────────────────── numerische Integration ─────────────────────
  function simpson(f, a, b, N) {
    N = N || 2000; if (N % 2) N++;
    const h = (b - a) / N; let s = f(a) + f(b);
    for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
    return s * h / 3;
  }
  const finiteOn = (f, a, b) => { for (let i = 0; i <= 200; i++) { const y = f(a + (b - a) * i / 200); if (!isFinite(y)) return false; } return true; };

  // bestimmtes Integral
  function def(F, a, b) {
    const f = F.f(0), res = { a, b, val: NaN, q: null, how: 'num' };
    if (!(isFinite(a) && isFinite(b))) return res;
    if (a === b) { res.val = 0; res.q = q0; res.how = 'exact'; return res; }
    const P = antiPoly(F);
    if (P) {
      const qa = qOf(a), qb = qOf(b);
      if (qa && qb) { const v = E.qSub(E.pEvalQ(P, qb), E.pEvalQ(P, qa)); res.q = v; res.val = E.qNum(v); res.how = 'exact'; return res; }
      res.val = E.pEvalNum(P, b) - E.pEvalNum(P, a); res.how = 'anti'; return res;
    }
    if (!finiteOn(f, Math.min(a, b), Math.max(a, b))) return res;
    const G = antiNum(F);
    if (G && isFinite(G(a)) && isFinite(G(b)) && Math.abs(G(b) - G(a) - simpson(f, a, b, 400)) < 1e-4 * (1 + Math.abs(G(b) - G(a)))) { res.val = G(b) - G(a); res.how = 'anti'; return res; }
    res.val = simpson(f, a, b); res.how = 'num';
    return res;
  }

  // ───────────────────── Ober- und Untersumme ─────────────────────
  // Streifen [x_{i-1}, x_i]; Untersumme mit dem kleinsten, Obersumme mit dem grössten Funktionswert je Streifen
  function riemann(F, a, b, n) {
    const f = F.f(0), dx = (b - a) / n, rects = [], M = n <= 40 ? 60 : n <= 200 ? 24 : n <= 1000 ? 10 : 6;
    let lo = 0, up = 0, ok = true;
    for (let i = 0; i < n; i++) {
      const x0 = a + i * dx, x1 = x0 + dx; let mn = Infinity, mx = -Infinity;
      for (let j = 0; j <= M; j++) { const y = f(x0 + dx * j / M); if (!isFinite(y)) { ok = false; continue; } if (y < mn) mn = y; if (y > mx) mx = y; }
      if (!isFinite(mn)) { rects.push({ x0, x1, lo: NaN, hi: NaN }); ok = false; continue; }
      rects.push({ x0, x1, lo: mn, hi: mx }); lo += mn * dx; up += mx * dx;
    }
    return { n, a, b, dx, lo, up, rects, ok };
  }
  const SUM_NS = [4, 10, 50, 100, 500, 1000];
  function sumTable(F, a, b) {
    const rows = SUM_NS.map(n => { const r = riemann(F, a, b, n); return { n, lo: r.lo, up: r.up, diff: r.up - r.lo, ok: r.ok }; });
    return { rows, integral: def(F, a, b) };
  }
  // f wächst (1), fällt (−1) oder ist konstant (1) auf [a, b]; 0: nicht monoton
  function mono(F, a, b) {
    const f = F.f(0); let up = true, dn = true, prev = f(a);
    if (!isFinite(prev)) return 0;
    for (let i = 1; i <= 400; i++) {
      const y = f(a + (b - a) * i / 400); if (!isFinite(y)) return 0;
      if (y < prev - 1e-12 * (1 + Math.abs(prev))) up = false;
      if (y > prev + 1e-12 * (1 + Math.abs(prev))) dn = false;
      prev = y;
    }
    return up ? 1 : dn ? -1 : 0;
  }
  // Σ_{k=1}^{n} k^i / n^{i+1} als Polynom in u = 1/n
  const SF = [[[1, 1]], [[1, 2], [1, 2]], [[1, 3], [1, 2], [1, 6]], [[1, 4], [1, 2], [1, 4]]].map(r => r.map(([p, q]) => E.qDiv(E.Q(p), E.Q(q))));
  // Rechtssumme R(n) = Δx·Σ f(a+kΔx) als Polynom in 1/n; nur Polynome vom Grad ≤ 3 mit rationalen Grenzen
  function sumExact(F, a, b) {
    const P = F && F.P ? E.pTrim(F.P) : null, qa = qOf(a), qb = qOf(b);
    if (!P || !qa || !qb || E.pDeg(P) < 0 || E.pDeg(P) > 3 || !(b > a)) return null;
    const dir = mono(F, a, b); if (dir === 0) return null;
    const L = E.qSub(qb, qa), g = []; let cur = P;
    for (let i = 0; i <= E.pDeg(P); i++) { g.push(E.qDiv(E.pEvalQ(cur, qa), E.Q(Number(Dif.fact(i))))); cur = E.pDeriv(cur); }
    const R = [q0, q0, q0, q0];
    g.forEach((gi, i) => { const Lp = E.qPow(L, i + 1); SF[i].forEach((s, m) => { R[m] = E.qAdd(R[m], E.qMul(E.qMul(gi, Lp), s)); }); });
    const fa = E.pEvalQ(P, qa), fb = E.pEvalQ(P, qb);
    const Lf = R.slice(); Lf[1] = E.qAdd(Lf[1], E.qMul(L, E.qSub(fa, fb)));
    const inc = dir > 0;
    return { dir, inc, qa, qb, L, g, deg: E.pDeg(P), right: R, left: Lf, O: inc ? R : Lf, U: inc ? Lf : R, A0: R[0], fa, fb, P };
  }
  // Wert eines Polynoms in u = 1/n an der Stelle n
  const uVal = (c, n) => c.reduce((s, q, m) => s + E.qNum(q) / Math.pow(n, m), 0);

  // ───────────────────── Flächen zwischen Kurven ─────────────────────
  // Schnittstellen von f und g (g = null: Nullstellen von f) in [a, b]; Teilflächen mit Vorzeichen
  function areas(F, G, a, b) {
    const f = F.f(0), g = G ? G.f(0) : (() => 0), h = x => f(x) - g(x);
    if (!(b > a)) { const t = a; a = b; b = t; }
    let rts = [];
    try { rts = Dif.scanRoots(h, a, b, 2000).filter(r => r > a + 1e-9 && r < b - 1e-9); } catch (e) { rts = []; }
    // exakte Nullstellen bei Polynomen
    let ex = null;
    const Pf = F.P ? E.pTrim(F.P) : null, Pg = G ? (G.P ? E.pTrim(G.P) : null) : [];
    if (Pf && Pg) {
      const H = E.pSub(Pf, Pg);
      if (E.pDeg(H) >= 1 && E.pDeg(H) <= 4) { try { const d = new S.Doc(); const r = S.solvePoly(d, H, {}); ex = S.sortDedupe((r && r.roots) || []); } catch (e) { ex = null; } }
      else if (E.pDeg(H) < 1) ex = [];
    }
    const pts = [{ x: a, fe: null, tex: null }];
    const inside = [];
    if (ex) ex.forEach(r => { if (r.val > a + 1e-9 && r.val < b - 1e-9) inside.push({ x: r.val, fe: r.fe || null, tex: r.tex || null }); });
    else rts.forEach(r => inside.push({ x: r, fe: null, tex: null }));
    inside.sort((p, q) => p.x - q.x).forEach(p => pts.push(p));
    pts.push({ x: b, fe: null, tex: null });
    const parts = []; let total = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const x0 = pts[i].x, x1 = pts[i + 1].x;
      const val = simpson(h, x0, x1, 600);
      const sg = val > 0 ? 1 : val < 0 ? -1 : 0;
      parts.push({ x0, x1, val, sign: sg, area: Math.abs(val), p0: pts[i], p1: pts[i + 1] }); total += Math.abs(val);
    }
    return { a, b, pts, parts, total, exactRoots: !!ex, H: (Pf && Pg) ? E.pSub(Pf, Pg) : null };
  }

  // ───────────────────── Rotationskörper ─────────────────────
  function volume(F, a, b) {
    const f = F.f(0); if (!(b > a)) { const t = a; a = b; b = t; }
    const sq = x => { const y = f(x); return y * y; };
    if (!finiteOn(f, a, b)) return NaN;
    return Math.PI * simpson(sq, a, b, 2000);
  }

  return { pInt, anti, antiPoly, antiNum, antiOf, derivOk, def, simpson, finiteOn, riemann, sumTable, SUM_NS, mono, sumExact, uVal, areas, volume };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Int;
