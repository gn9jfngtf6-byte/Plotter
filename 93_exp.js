// ═════════════════════════════════════════════════════════════════
// MODUL 93: Expo — Rechenkern der Umgebung «Exponential- und Logarithmusfunktionen» (ohne DOM, node-testbar)
//
// Baut auf 60_dif.js (Dif.E = exakte Brüche) und 80_lin.js (Lin.Qn) auf. Eine Funktion ist immer
//     f(x) = a · b^x + d          (a ≠ 0, b > 0, b ≠ 1; Basis e als Sonderfall F.e = true)
//   b > 1  exponentielles Wachstum (Wachstumsfaktor b, Prozentsatz p = (b − 1)·100 %)
//   b < 1  exponentieller Zerfall (Abnahme um (1 − b)·100 %)
//   d      waagrechte Asymptote y = d
//
//   Expo.mk(a, b, d, e)           Funktion aus Zahlen (e = true: Basis e, b wird ignoriert); a = 0 → F.deg
//   Expo.fOf(F)                   numerische Funktion x ↦ f(x)
//   Expo.evalExact(F, x)          {x, y, xq, yq, exact}: exakt, wenn x ganz und b ein Bruch ist
//   Expo.bTex(F)                  Basis als LaTeX ('e', '2', '\frac{1}{2}')
//   Expo.fTex(F, lhs)             LaTeX der Funktionsgleichung
//   Expo.growth(F)                {kind:'grow'|'decay', pct, factor}
//   Expo.doubling(F)              Verdoppelungs- bzw. Halbwertszeit T = ln 2 / |ln b|
//   Expo.solve(F, c)              Gleichung a·b^x + d = c: {kind:'one'|'none'|'deg', r, rq, x, exact, kq}
//   Expo.logExact(bq, yq)         log_b y als Bruch, wenn er aufgeht (sonst null)
//   Expo.logb(b, y)               log_b y numerisch
//   Expo.eN(n)                    (1 + 1/n)^n
//   Expo.fromAst(ast), Expo.raw(F)   Eingabe «2*3^x+1», «e^x», «100*1.05^x», «0.5^x» → F und zurück
//   Rechenwege (Schritte und SV.Doc): 93b_exp_docs.js
// ═════════════════════════════════════════════════════════════════
const Expo = (function () {
  const E = Dif.E, Qn = Lin.Qn;
  const q0 = E.q0, q1 = E.q1, qm1 = E.qNeg(E.q1);
  const num = E.qNum, add = E.qAdd, sub = E.qSub, mul = E.qMul, div = E.qDiv, neg = E.qNeg, isZ = E.qIsZero;
  const rnd = x => Math.round(x * 1e6) / 1e6 + 0;

  function mk(a, b, d, e) {
    const aq = Qn(a), dq = Qn(d === undefined ? 0 : d);
    let bv = e ? Math.E : Number(b);
    if (!(bv > 0) || !isFinite(bv)) bv = 2;
    if (!e && Math.abs(bv - 1) < 1e-9) bv = 2;
    const bq = e ? null : Qn(bv);
    return { a: num(aq), b: e ? Math.E : num(bq), d: num(dq), aq, bq, dq, e: !!e, deg: isZ(aq), grow: (e ? Math.E : num(bq)) > 1 };
  }
  const fOf = F => x => F.a * Math.pow(F.b, x) + F.d;

  // ── exakte Werte ──
  function evalExact(F, x) {
    const xq = Qn(x), y = fOf(F)(num(xq));
    let yq = null;
    if (!F.e && E.qIsInt(xq) && Number(E.qAbs(xq).n) <= 20) yq = add(mul(F.aq, E.qPow(F.bq, Number(xq.n))), F.dq);
    return { x: num(xq), y: yq ? num(yq) : y, xq, yq, exact: !!yq };
  }
  // ganzzahlige k-te Wurzel eines BigInt ≥ 0, oder null
  function iroot(N, k) {
    if (N < 0n) return null;
    if (N < 2n) return N;
    let x = BigInt(Math.round(Math.pow(Number(N), 1 / k)));
    for (let dd = -2n; dd <= 2n; dd++) { const c = x + dd; if (c >= 0n && c ** BigInt(k) === N) return c; }
    return null;
  }
  // log_b y exakt als Bruch p/q (q ≤ 6, |p| ≤ 40), sonst null
  function logExact(bq, yq) {
    if (!bq || !yq || E.qSgn(yq) <= 0 || E.qSgn(bq) <= 0 || E.qEq(bq, q1)) return null;
    if (E.qEq(yq, q1)) return q0;
    for (let q = 1; q <= 6; q++) {
      const rn = iroot(bq.n, q), rd = iroot(bq.d, q); if (rn === null || rd === null) continue;
      const r = E.Q(rn, rd);                                            // r = b^(1/q)
      for (let p = 1; p <= 40; p++) {
        if (E.qEq(E.qPow(r, p), yq)) return E.Q(p, q);
        if (E.qEq(E.qPow(r, -p), yq)) return E.Q(-p, q);
      }
    }
    return null;
  }
  const logb = (b, y) => Math.log(y) / Math.log(b);

  // ── Wachstum, Verdoppelung ──
  function growth(F) {
    const b = F.b;
    return { kind: b > 1 ? 'grow' : 'decay', factor: b, pct: (b - 1) * 100, pctq: F.e ? null : mul(sub(F.bq, q1), E.Q(100)) };
  }
  function doubling(F) {
    const b = F.b, T = Math.log(2) / Math.abs(Math.log(b));
    return { kind: b > 1 ? 'double' : 'half', T };
  }

  // ── Gleichung a·b^x + d = c ──
  function solve(F, c) {
    const C = Qn(c);
    if (F.deg) return { kind: 'deg', C };
    const rq = div(sub(C, F.dq), F.aq), r = num(rq);
    if (E.qSgn(rq) <= 0) return { kind: 'none', C, rq, r, why: E.qSgn(rq) === 0 ? 'zero' : 'neg' };
    const kq = F.e ? null : logExact(F.bq, rq);
    const x = kq ? num(kq) : logb(F.b, r);
    return { kind: 'one', C, rq, r, x, kq, exact: !!kq };
  }

  const eN = n => Math.pow(1 + 1 / n, n);

  // ── LaTeX ──
  const tx = q => E.qTex(q), sg = q => (E.qSgn(q) < 0 ? '-' : '+') + tx(E.qAbs(q));
  // Basis: ganze Zahl, einfacher Bruch (Nenner ≤ 4) oder Dezimalzahl (0.9, 1.03, 0.917)
  const bDec = bq => (bq.d !== 1n && bq.d > 4n);
  const bTex = F => (F.e ? 'e' : bDec(F.bq) ? Dif.fmtT(num(F.bq), 4) : tx(F.bq));
  const bTexP = F => (F.e ? 'e' : (F.bq.d !== 1n && !bDec(F.bq) ? '\\left(' + tx(F.bq) + '\\right)' : bTex(F)));
  const aPre = aq => (E.qEq(aq, q1) ? '' : E.qEq(aq, qm1) ? '-' : tx(aq) + '\\cdot ');
  function fTex(F, lhs, ex) {
    lhs = lhs === undefined ? 'y' : lhs; ex = ex || 'x';
    let s;
    if (F.deg) s = tx(F.dq);
    else { s = aPre(F.aq) + bTexP(F) + '^{' + ex + '}'; if (!isZ(F.dq)) s += sg(F.dq); }
    return (lhs ? lhs + '=' : '') + s;
  }
  const logTex = (F, arg) => (F.e ? '\\ln' : '\\log_{' + bTex(F) + '}') + (arg === undefined ? '' : (arg.length > 1 && !/^[a-z]$/.test(arg) ? '\\left(' + arg + '\\right)' : ' ' + arg));
  const logTexB = (bq, e, arg) => logTex({ e, bq }, arg);

  // ── Eingabe: AST (14_mathinput.js) → F ──
  // erkennt a*b^x + d, b^x, a*e^x + d, exp(x), b^(-x) (→ Basis 1/b), b^(k*x) (→ Basis b^k), a*b^x/c …
  function fromAst(ast) {
    if (!ast) return null;
    const isNum = n => n && (n.type === 'num' || (n.type === 'neg' && isNum(n.x)) || ((n.type === 'div' || n.type === 'mul' || n.type === 'add' || n.type === 'sub') && isNum(n.a) && isNum(n.b)));
    const val = n => { if (!n) return NaN; if (n.type === 'num') return parseFloat(n.v); if (n.type === 'neg') return -val(n.x); const a = val(n.a), b = val(n.b); return n.type === 'div' ? a / b : n.type === 'mul' ? a * b : n.type === 'add' ? a + b : a - b; };
    const isX = n => n && n.type === 'id' && n.v === 'x';
    const isE = n => n && (n.type === 'id' || n.type === 'const') && (n.v === 'e' || n.v === 'EC');   // Eingabefeld liefert «EC» für e
    const kOf = n => {                                                // Exponent k·x → k
      if (isX(n)) return 1;
      if (n && n.type === 'neg') { const k = kOf(n.x); return k === null ? null : -k; }
      if (n && n.type === 'mul') { if (isNum(n.a) && isX(n.b)) return val(n.a); if (isNum(n.b) && isX(n.a)) return val(n.b); }
      if (n && n.type === 'div' && isX(n.a) && isNum(n.b)) return 1 / val(n.b);
      return null;
    };
    const core = n => {                                               // b^(kx), e^(kx), exp(kx) → {b, e}
      if (!n) return null;
      if (n.type === 'pow') {
        const k = kOf(n.b); if (k === null || !isFinite(k) || k === 0) return null;
        if (isE(n.a)) return k === 1 ? { b: Math.E, e: true } : { b: Math.exp(k), e: false };
        if (isNum(n.a)) { const b = val(n.a); if (!(b > 0)) return null; return { b: Math.pow(b, k), e: false }; }
        return null;
      }
      if (n.type === 'call' && n.name === 'exp' && n.args.length === 1) { const k = kOf(n.args[0]); if (k === null || k === 0) return null; return k === 1 ? { b: Math.E, e: true } : { b: Math.exp(k), e: false }; }
      return null;
    };
    const term = n => {
      if (!n) return null;
      if (n.type === 'neg') { const t = term(n.x); return t ? Object.assign(t, { a: -t.a }) : null; }
      const c0 = core(n); if (c0) return Object.assign(c0, { a: 1 });
      if (n.type === 'mul') { if (isNum(n.a)) { const c = core(n.b); return c ? Object.assign(c, { a: val(n.a) }) : null; } if (isNum(n.b)) { const c = core(n.a); return c ? Object.assign(c, { a: val(n.b) }) : null; } }
      if (n.type === 'div' && isNum(n.b)) { const t = term(n.a); return t ? Object.assign(t, { a: t.a / val(n.b) }) : null; }
      return null;
    };
    let d = 0, body = ast;
    if ((ast.type === 'add' || ast.type === 'sub') && isNum(ast.b)) { d = ast.type === 'add' ? val(ast.b) : -val(ast.b); body = ast.a; }
    else if (ast.type === 'add' && isNum(ast.a)) { d = val(ast.a); body = ast.b; }
    else if (ast.type === 'sub' && isNum(ast.a)) { d = val(ast.a); body = { type: 'neg', x: ast.b }; }
    const t = term(body); if (!t || !isFinite(t.a) || !isFinite(d) || !(t.b > 0) || Math.abs(t.b - 1) < 1e-9) return null;
    return mk(t.a, t.b, d, t.e);
  }
  // Rohausdruck für das Eingabefeld
  function raw(F) {
    const qr = z => { const n = Number(z.n), dd = Number(z.d); return dd === 1 ? String(n) : '(' + n + '/' + dd + ')'; };
    const one = E.qEq(E.qAbs(F.aq), q1), an = E.qSgn(F.aq) < 0 ? '-' : '';
    const base = F.e ? 'EC' : (F.bq.d === 1n ? String(F.bq.n) : F.bq.d > 4n ? String(Math.round(F.b * 1e6) / 1e6) : '(' + Number(F.bq.n) + '/' + Number(F.bq.d) + ')');
    let s = (one ? an : qr(F.aq) + '*') + base + '^x';
    if (!isZ(F.dq)) s += (E.qSgn(F.dq) < 0 ? '-' : '+') + qr(E.qAbs(F.dq));
    return s;
  }

  return { rnd, Qn, mk, fOf, evalExact, logExact, logb, growth, doubling, solve, eN, bTex, bTexP, fTex, logTex, logTexB, aPre, fromAst, raw, iroot };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Expo;
