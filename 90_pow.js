// ═════════════════════════════════════════════════════════════════
// MODUL 90: pow — Rechenkern der Umgebung «Potenz- und Wurzelfunktionen» (ohne DOM, node-testbar)
//
// Baut auf 60_dif.js (Dif.E = exakte Brüche) und 80_lin.js (Lin.Qn) auf. Eine Funktion ist immer
//     f(x) = a · (x − v)^(m/n) + h          Exponent p = m/n (gekürzt, n ≥ 1, m ≠ 0)
//   n = 1, m > 0   Potenzfunktion (x−v)^m                       kind 'pos'
//   n = 1, m < 0   negativer Exponent 1/(x−v)^|m|  (Hyperbel)   kind 'neg'
//   n > 1, m = 1   Wurzelfunktion ⁿ√(x−v)                       kind 'root'
//   n > 1, sonst   rationaler Exponent ⁿ√((x−v)^m)              kind 'rat'
// ⁿ√t ist für ungerades n auch für t < 0 definiert (reelle ungerade Wurzel), für gerades n nur für t ≥ 0.
//
//   Pow.mk(a, v, h, m, n)        Funktion aus Zahlen (a ≠ 0; a = 0 → F.deg = true)
//   Pow.base(m, n)               Grundfunktion x^(m/n)
//   Pow.fOf(F)                   numerische Funktion x ↦ f(x)
//   Pow.pw(t, m, n)              t^(m/n) numerisch (NaN ausserhalb des Definitionsbereichs)
//   Pow.domain(F)                {kind:'all'|'ge'|'gt'|'ne', tex, txt}
//   Pow.range(F)                 {tex, txt}
//   Pow.symmetry(F)              {kind:'even'|'odd'|'none', txt}  (bezogen auf die Grundfunktion bzw. auf x = v / (v|h))
//   Pow.asymptotes(F)            null oder {x: v, y: h}
//   Pow.evalExact(F, x)          {x (num), y (num), xq, yq (Q|null), tex}  — exakt, wenn die Wurzel aufgeht
//   Pow.qRoot(q, k)              exakte k-te Wurzel eines Bruchs (Q oder null)
//   Pow.solve(F, y0)             Gleichung f(x) = y0: {c, cq, kind:'two'|'one'|'none'|'deg', sols:[{x, xq, texT, texX}], ...}
//   Pow.fTex(F, lhs, style)      LaTeX; style 'root' (Wurzelschreibweise, Standard) oder 'exp' (Potenzschreibweise x^{m/n})
//   Pow.baseTex(m, n, style), Pow.pTex(m, n), Pow.fromAst(ast)  Eingabe «2*(x-1)^3+1», «1/x^2», «sqrt(x-2)», «x^(2/3)» → F
//   Rechenwege (Schritte und SV.Doc): 90b_pow_docs.js
// ═════════════════════════════════════════════════════════════════
const Pow = (function () {
  const E = Dif.E, Qn = Lin.Qn;
  const q0 = E.q0, q1 = E.q1, qm1 = E.qNeg(E.q1);
  const num = E.qNum, add = E.qAdd, sub = E.qSub, mul = E.qMul, div = E.qDiv, neg = E.qNeg, isZ = E.qIsZero;
  const rnd = x => Math.round(x * 1e6) / 1e6 + 0;
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };

  // Exponent kürzen
  function expo(m, n) {
    m = Math.round(m); n = Math.round(n === undefined ? 1 : n);
    if (!n) n = 1; if (n < 0) { n = -n; m = -m; }
    if (!m) m = 1;
    const g = gcd(m, n) || 1;
    return { m: m / g, n: n / g };
  }
  const kindOf = (m, n) => (n === 1 ? (m > 0 ? 'pos' : 'neg') : (m === 1 ? 'root' : 'rat'));

  function mkQ(aq, vq, hq, m, n) {
    const p = expo(m, n);
    return { a: num(aq), v: num(vq), h: num(hq), aq, vq, hq, m: p.m, n: p.n, kind: kindOf(p.m, p.n), deg: isZ(aq), odd: p.n % 2 === 1, mEven: p.m % 2 === 0 };
  }
  const mk = (a, v, h, m, n) => mkQ(Qn(a), Qn(v === undefined ? 0 : v), Qn(h === undefined ? 0 : h), m, n);
  const base = (m, n) => mk(1, 0, 0, m, n);
  const withExp = (F, m, n) => mkQ(F.aq, F.vq, F.hq, m, n);

  // t^(m/n) numerisch
  function pw(t, m, n) {
    if (!isFinite(t)) return NaN;
    if (n === 1) { if (m < 0 && t === 0) return NaN; return Math.pow(t, m); }
    let r;
    if (t < 0) { if (n % 2 === 0) return NaN; r = -Math.pow(-t, 1 / n); } else r = Math.pow(t, 1 / n);
    if (m < 0 && r === 0) return NaN;
    return Math.pow(r, m);
  }
  const fOf = F => { const g = x => F.a * pw(x - F.v, F.m, F.n) + F.h; g.rawOf = () => { try { return raw(F); } catch (e) { return null; } }; return g; };

  // ── Definitionsbereich, Wertebereich, Symmetrie, Asymptoten ──
  function domain(F) {
    const vt = E.qTex(F.vq), m = F.m, n = F.n;
    if (n % 2 === 1) return m > 0 ? { kind: 'all', tex: '\\mathbb{R}', txt: 'alle reellen Zahlen' } : { kind: 'ne', tex: '\\mathbb{R}\\setminus\\{' + vt + '\\}', txt: 'alle reellen Zahlen ausser ' + vt };
    return m > 0 ? { kind: 'ge', tex: '[' + vt + ';\\,\\infty[', txt: 'x ≥ ' + vt } : { kind: 'gt', tex: ']' + vt + ';\\,\\infty[', txt: 'x > ' + vt };
  }
  function range(F) {
    const ht = E.qTex(F.hq), m = F.m, n = F.n, up = F.a > 0;
    if (F.deg) return { tex: '\\{' + ht + '\\}', txt: 'nur ' + ht };
    if (n % 2 === 1) {
      if (m > 0) return m % 2 === 1 ? { tex: '\\mathbb{R}' } : (up ? { tex: '[' + ht + ';\\,\\infty[' } : { tex: ']-\\infty;\\,' + ht + ']' });
      return Math.abs(m) % 2 === 1 ? { tex: '\\mathbb{R}\\setminus\\{' + ht + '\\}' } : (up ? { tex: ']' + ht + ';\\,\\infty[' } : { tex: ']-\\infty;\\,' + ht + '[' });
    }
    if (m > 0) return up ? { tex: '[' + ht + ';\\,\\infty[' } : { tex: ']-\\infty;\\,' + ht + ']' };
    return up ? { tex: ']' + ht + ';\\,\\infty[' } : { tex: ']-\\infty;\\,' + ht + '[' };
  }
  function symmetry(F) {
    if (F.n % 2 === 0) return { kind: 'none', txt: 'keine Symmetrie (der Definitionsbereich ist einseitig)' };
    return F.m % 2 === 0 ? { kind: 'even', txt: 'achsensymmetrisch' } : { kind: 'odd', txt: 'punktsymmetrisch' };
  }
  const asymptotes = F => (F.m < 0 ? { x: F.v, y: F.h } : null);
  // Monotonie der Grundfunktion rechts von v (für x > v)
  const risingRight = F => (F.a > 0) === (F.m > 0);

  // ── exakte Wurzeln ──
  function iroot(N, k) {                                   // ganzzahlige k-te Wurzel eines BigInt ≥ 0, oder null
    if (N < 0n) return null;
    if (N < 2n) return N;
    let x = BigInt(Math.round(Math.pow(Number(N), 1 / k)));
    for (let d = -2n; d <= 2n; d++) { const c = x + d; if (c >= 0n && c ** BigInt(k) === N) return c; }
    return null;
  }
  function qRoot(q, k) {                                   // k-te Wurzel von q als Bruch, wenn sie aufgeht (ungerades k auch negativ)
    if (k === 1) return q;
    const negq = q.n < 0n; if (negq && k % 2 === 0) return null;
    const n = iroot(negq ? -q.n : q.n, k), d = iroot(q.d, k);
    if (n === null || d === null) return null;
    return E.Q(negq ? -n : n, d);
  }
  // t^(m/n) exakt (Q) oder null
  function pwQ(tq, m, n) {
    if (isZ(tq)) return m > 0 ? q0 : null;
    const r = qRoot(tq, n); if (!r) return null;
    return E.qPow(r, m);
  }
  function evalExact(F, x) {
    const xq = Qn(x), tq = sub(xq, F.vq), p = pwQ(tq, F.m, F.n);
    const y = fOf(F)(num(xq));
    const yq = p ? add(mul(F.aq, p), F.hq) : null;
    return { x: num(xq), y: yq ? num(yq) : y, xq, yq, exact: !!yq };
  }

  // ── Gleichung f(x) = y0 ──
  // (x−v)^(m/n) = c mit c = (y0 − h)/a. Lösungen x = v + t, t = ±c^(n/m) je nach Fall.
  function solve(F, y0) {
    const Y = Qn(y0);
    if (F.deg) return { kind: 'deg', Y };
    const cq = div(sub(Y, F.hq), F.aq), c = num(cq), s = E.qSgn(cq), m = F.m, n = F.n;
    const am = Math.abs(m), oneSided = n % 2 === 0;                     // gerades n: nur t ≥ 0 (bzw. t > 0)
    const twoSided = !oneSided && m % 2 === 0;                           // zwei Lösungen ±
    let kind, ts = [], why;
    if (m > 0) {
      if (s < 0) { if (oneSided) { kind = 'none'; why = 'root-neg'; } else if (twoSided) { kind = 'none'; why = 'even-neg'; } else { kind = 'one'; ts = [-1]; } }
      else if (s === 0) { kind = 'one'; ts = [0]; }
      else { if (twoSided) { kind = 'two'; ts = [1, -1]; } else { kind = 'one'; ts = [1]; } }
    } else {
      if (s === 0) { kind = 'none'; why = 'zero'; }
      else if (s < 0) { if (oneSided) { kind = 'none'; why = 'root-neg'; } else if (twoSided) { kind = 'none'; why = 'even-neg'; } else { kind = 'one'; ts = [-1]; } }
      else { if (twoSided) { kind = 'two'; ts = [1, -1]; } else { kind = 'one'; ts = [1]; } }
    }
    // |t| = |c|^(n/|m|)
    const ac = E.qAbs(cq), acn = E.qPow(ac, n), rt = qRoot(acn, am), tAbsQ = rt ? (m < 0 ? (isZ(rt) ? null : E.qInv(rt)) : rt) : null;
    const tAbs = Math.pow(num(ac), n / am) * (m < 0 ? 1 : 1);
    const tAbsNum = m < 0 ? Math.pow(num(ac), -n / am) : Math.pow(num(ac), n / am);
    const sols = ts.map(sg => {
      const tq = tAbsQ ? (sg < 0 ? neg(tAbsQ) : (sg === 0 ? q0 : tAbsQ)) : null;
      const t = sg === 0 ? 0 : sg * tAbsNum;
      const xq = tq ? add(F.vq, tq) : null;
      return { sg, t, tq, x: xq ? num(xq) : F.v + t, xq, exact: !!tq };
    });
    sols.sort((p, q) => p.x - q.x);
    return { kind, why, Y, cq, c, sols, oneSided, twoSided, tAbsQ, tAbsNum, acn, am };
  }

  // ── LaTeX ──
  const tx = q => E.qTex(q), sg = q => (E.qSgn(q) < 0 ? '-' : '+') + tx(E.qAbs(q));
  const aPre = aq => (E.qEq(aq, q1) ? '' : E.qEq(aq, qm1) ? '-' : tx(aq));
  const pTex = (m, n) => { if (n < 0) { n = -n; m = -m; } return n === 1 ? String(m) : (m < 0 ? '-' : '') + '\\frac{' + Math.abs(m) + '}{' + n + '}'; };
  const pTexB = (m, n) => (n === 1 ? (m < 0 ? '{' + m + '}' : String(m)) : '{' + pTex(m, n) + '}');
  // Term (x − v)^(m/n) in Wurzel- (root) oder Potenzschreibweise (exp); inner: 'x' oder 'x-1' (ohne Klammern)
  function termTex(inner, m, n, style) {
    const simple = /^[a-z]$/.test(inner), par = simple ? inner : '(' + inner + ')';
    if (style === 'exp') return par + '^' + pTexB(m, n);
    const am = Math.abs(m), ex = am < 10 ? '^' + am : '^{' + am + '}';
    if (n === 1) { if (m > 0) return am === 1 ? inner : par + ex; return '\\frac{1}{' + (am === 1 ? inner : par + ex) + '}'; }
    const rad = am === 1 ? inner : par + ex;
    const root = (n === 2 ? '\\sqrt{' : '\\sqrt[' + n + ']{') + rad + '}';
    return m > 0 ? root : '\\frac{1}{' + root + '}';
  }
  const innerOf = F => (isZ(F.vq) ? 'x' : 'x' + sg(neg(F.vq)));
  function fTex(F, lhs, style) {
    lhs = lhs === undefined ? 'y' : lhs;
    let s;
    if (F.deg) s = tx(F.hq);
    else {
      const inner = innerOf(F), t = termTex(inner, F.m, F.n, style), A = aPre(F.aq), aOne = A === '' || A === '-';
      if (t.startsWith('\\frac{1}') && !aOne) s = (E.qSgn(F.aq) < 0 ? '-' : '') + '\\frac{' + tx(E.qAbs(F.aq)) + '}' + t.slice('\\frac{1}'.length);
      else if (!aOne && t === inner && inner !== 'x') s = A + '(' + inner + ')';
      else s = A + t;
      if (!isZ(F.hq)) s += sg(F.hq);
    }
    return (lhs ? lhs + '=' : '') + s;
  }
  const baseTex = (m, n, style) => termTex('x', m, n, style);

  // ── Eingabe: AST (14_mathinput.js) → F ──
  // erkennt  a*(x−v)^p + h,  a/(x−v)^k + h,  a*sqrt(x−v) + h,  a*nthroot(x−v, n) + h,  (x−v)^(m/n), x^-2 …
  function fromAst(ast) {
    if (!ast) return null;
    const isNum = n => n && (n.type === 'num' || (n.type === 'neg' && isNum(n.x)) || ((n.type === 'div' || n.type === 'mul' || n.type === 'add' || n.type === 'sub') && isNum(n.a) && isNum(n.b)));
    const val = n => { if (!n) return NaN; if (n.type === 'num') return parseFloat(n.v); if (n.type === 'neg') return -val(n.x); const a = val(n.a), b = val(n.b); return n.type === 'div' ? a / b : n.type === 'mul' ? a * b : n.type === 'add' ? a + b : a - b; };
    const isX = n => n && n.type === 'id' && n.v === 'x';
    const inner = n => {                                           // x − v  →  v
      if (isX(n)) return 0;
      if (n && (n.type === 'sub' || n.type === 'add') && isX(n.a) && isNum(n.b)) return n.type === 'sub' ? val(n.b) : -val(n.b);
      if (n && n.type === 'add' && isNum(n.a) && isX(n.b)) return -val(n.a);
      return null;
    };
    const expOf = n => {                                            // Exponent → {m, n} oder null
      if (isNum(n)) { const e = val(n); if (!isFinite(e)) return null; const d = [1, 2, 3, 4, 5, 6, 8, 10].find(dd => Math.abs(e * dd - Math.round(e * dd)) < 1e-9); return d ? expo(Math.round(e * d), d) : null; }
      return null;
    };
    const core = n => {                                             // (x−v)^p, sqrt(x−v), nthroot(x−v, k), x  →  {v, m, n} oder null
      if (!n) return null;
      const v0 = inner(n); if (v0 !== null) return { v: v0, m: 1, n: 1 };
      if (n.type === 'pow') { const v = inner(n.a), p = expOf(n.b); if (v === null || !p) return null; return { v, m: p.m, n: p.n }; }
      if (n.type === 'call' && n.name === 'sqrt' && n.args.length === 1) { const v = inner(n.args[0]); return v === null ? null : { v, m: 1, n: 2 }; }
      if (n.type === 'call' && n.name === 'nthroot' && n.args.length === 2 && isNum(n.args[1])) { const v = inner(n.args[0]), k = val(n.args[1]); return v === null || !(k >= 2) || k !== Math.round(k) ? null : { v, m: 1, n: k }; }
      if (n.type === 'call' && n.name === 'cbrt' && n.args.length === 1) { const v = inner(n.args[0]); return v === null ? null : { v, m: 1, n: 3 }; }
      return null;
    };
    const term = n => {                                             // a·core, core/a, a/core, core, −term
      if (!n) return null;
      if (n.type === 'neg') { const t = term(n.x); return t ? Object.assign(t, { a: -t.a }) : null; }
      const c0 = core(n); if (c0) return Object.assign(c0, { a: 1 });
      if (n.type === 'mul') { if (isNum(n.a)) { const c = core(n.b); return c ? Object.assign(c, { a: val(n.a) }) : null; } if (isNum(n.b)) { const c = core(n.a); return c ? Object.assign(c, { a: val(n.b) }) : null; } }
      if (n.type === 'div') {
        if (isNum(n.b)) { const t = term(n.a); return t ? Object.assign(t, { a: t.a / val(n.b) }) : null; }
        if (isNum(n.a)) { const c = core(n.b); return c ? { v: c.v, m: -c.m, n: c.n, a: val(n.a) } : null; }
      }
      return null;
    };
    let h = 0, body = ast;
    if ((ast.type === 'add' || ast.type === 'sub') && isNum(ast.b)) { h = ast.type === 'add' ? val(ast.b) : -val(ast.b); body = ast.a; }
    else if (ast.type === 'add' && isNum(ast.a)) { h = val(ast.a); body = ast.b; }
    else if (ast.type === 'sub' && isNum(ast.a)) { h = val(ast.a); body = { type: 'neg', x: ast.b }; }
    const t = term(body); if (!t || !isFinite(t.a) || !isFinite(h) || !isFinite(t.v)) return null;
    return mk(t.a, t.v, h, t.m, t.n);
  }
  // Rohausdruck für das Eingabefeld
  function raw(F) {
    const qr = z => { const n = Number(z.n), d = Number(z.d); return d === 1 ? String(n) : '(' + n + '/' + d + ')'; };
    const inner = isZ(F.vq) ? 'x' : '(x' + (E.qSgn(F.vq) < 0 ? '+' : '-') + qr(E.qAbs(F.vq)) + ')';
    const am = Math.abs(F.m);
    let core;
    if (F.n === 1) core = am === 1 ? inner : inner + '^' + am;
    else if (F.n === 2 && am === 1) core = 'sqrt(' + (isZ(F.vq) ? 'x' : inner.slice(1, -1)) + ')';
    else core = inner + '^(' + am + '/' + F.n + ')';
    let s;
    const one = E.qEq(E.qAbs(F.aq), q1), an = E.qSgn(F.aq) < 0 ? '-' : '';
    if (F.m < 0) s = (one ? an + '1' : qr(F.aq)) + '/' + core;
    else s = (one ? an : qr(F.aq) + '*') + core;
    if (!isZ(F.hq)) s += (E.qSgn(F.hq) < 0 ? '-' : '+') + qr(E.qAbs(F.hq));
    return s;
  }

  return { rnd, Qn, expo, kindOf, mk, mkQ, base, withExp, pw, fOf, domain, range, symmetry, asymptotes, risingRight, qRoot, pwQ, evalExact, solve, fTex, baseTex, termTex, pTex, aPre, innerOf, fromAst, raw };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Pow;
