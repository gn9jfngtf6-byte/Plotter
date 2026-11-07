// ═════════════════════════════════════════════════════════════════
// MODUL 99: Inv — Rechenkern der Umgebung «Umkehrfunktionen» (ohne DOM, node-testbar)
//
// Baut auf 90_pow.js (Pow), 93_exp.js (Expo), 80_lin.js (Lin) und 60_dif.js (Dif.E) auf. Eine Funktion R hat einen Typ:
//   lin   f(x) = m·x + q                        {type:'lin', m, q, mq, qq}
//   pow   f(x) = a·(x − v)^(m/n) + h            {type:'pow', F}   (Pow)
//   exp   f(x) = a·b^x + d                      {type:'exp', F}   (Expo)
//   log   f(x) = a·log_b(x − v) + d             {type:'log', a, b, v, d, e, aq, vq, dq, bq}
//
//   Inv.mk(type, P) / Inv.lin(m,q) / Inv.pow(F) / Inv.exp(F) / Inv.log(a,b,v,d,e)
//   Inv.fromAst(ast), Inv.raw(R)             Eingabe «2x+1», «(x-1)^2+2», «2^x», «log(x-1)», «logn(x,2)», «log10(x)» → R
//   Inv.info(R)                              {D, W (tex, lo, hi), inj (umkehrbar auf D), r0 (natürliche Einschränkung x ≥ r0), rSide}
//   Inv.fOf(R), Inv.invOf(R)                 numerische Funktion und Umkehrfunktion (bei Einschränkung: rechter Ast)
//   Inv.fTex(R, lhs), Inv.invTex(R, lhs)     LaTeX von f und f⁻¹
//   Inv.invDW(R)                             {D, W} der Umkehrfunktion (tex)
//   Inv.restrict(R, r)                       Kopie mit Einschränkung x ≥ r (für nicht umkehrbare Funktionen)
//   Inv.hits(R, k, x0, x1)                   Schnittstellen der waagrechten Geraden y = k mit f in [x0; x1] (numerisch)
//   Inv.PAIRS                                bekannte Paare (x², √x; x³, ³√x; 2^x, log₂; e^x, ln; 10^x, lg; 1/x; sin, arcsin; cos, arccos; tan, arctan)
//   Rechenwege (Schritte und SV.Doc): 99b_inv_docs.js
// ═════════════════════════════════════════════════════════════════
const Inv = (function () {
  const E = Dif.E, Qn = Lin.Qn;
  const q0 = E.q0, q1 = E.q1, qm1 = E.qNeg(E.q1);
  const num = E.qNum, isZ = E.qIsZero, tx = q => E.qTex(q), sg = q => (E.qSgn(q) < 0 ? '-' : '+') + tx(E.qAbs(q));
  const rnd = x => Math.round(x * 1e6) / 1e6 + 0;
  const RR = '\\mathbb{R}';

  // ── Konstruktoren ──
  const lin = (m, q) => { const mq = Qn(m), qq = Qn(q === undefined ? 0 : q); return { type: 'lin', m: num(mq), q: num(qq), mq: isZ(mq) ? q1 : mq, qq, deg: false }; };
  const pow = F => ({ type: 'pow', F, deg: !!F.deg });
  const exp = F => ({ type: 'exp', F, deg: !!F.deg });
  const log = (a, b, v, d, e) => {
    const aq = Qn(a === undefined ? 1 : a), vq = Qn(v === undefined ? 0 : v), dq = Qn(d === undefined ? 0 : d);
    let bv = e ? Math.E : Number(b); if (!(bv > 0) || Math.abs(bv - 1) < 1e-9) bv = e ? Math.E : 10;
    const bq = e ? null : Qn(bv);
    return { type: 'log', a: num(aq), b: e ? Math.E : num(bq), v: num(vq), d: num(dq), e: !!e, aq, vq, dq, bq, deg: isZ(aq) };
  };
  function mk(type, P) { return type === 'lin' ? lin(P.m, P.q) : type === 'pow' ? pow(P.F) : type === 'exp' ? exp(P.F) : log(P.a, P.b, P.v, P.d, P.e); }
  const restrict = (R, r) => Object.assign({}, R, { r: r === null || r === undefined ? null : Number(r) });

  // ── Funktionen ──
  function fOf(R) {
    if (R.type === 'lin') return x => R.m * x + R.q;
    if (R.type === 'pow') return Pow.fOf(R.F);
    if (R.type === 'exp') return Expo.fOf(R.F);
    return x => (x > R.v ? R.a * Math.log(x - R.v) / Math.log(R.b) + R.d : NaN);
  }
  function invOf(R) {
    if (R.type === 'lin') return y => (y - R.q) / R.m;
    if (R.type === 'pow') { const F = R.F; return y => F.v + Pow.pw((y - F.h) / F.a, F.n, F.m); }
    if (R.type === 'exp') { const F = R.F; return y => { const t = (y - F.d) / F.a; return t > 0 ? Math.log(t) / Math.log(F.b) : NaN; }; }
    return y => R.v + Math.pow(R.b, (y - R.d) / R.a);
  }

  // ── Definitions- und Wertebereich, Umkehrbarkeit ──
  const ivTex = (lo, hi, lc, hc) => (lo === null ? ']-\\infty' : (lc ? '[' : ']') + tx(Qn(lo))) + ';\\,' + (hi === null ? '\\infty[' : tx(Qn(hi)) + (hc ? ']' : '['));
  function info(R) {
    if (R.type === 'lin') return { D: { tex: RR, lo: null, hi: null }, W: { tex: RR, lo: null, hi: null }, inj: true, r0: null };
    if (R.type === 'exp') { const F = R.F; return { D: { tex: RR, lo: null, hi: null }, W: F.a > 0 ? { tex: ']' + tx(F.dq) + ';\\,\\infty[', lo: F.d, hi: null } : { tex: ']-\\infty;\\,' + tx(F.dq) + '[', lo: null, hi: F.d }, inj: true, r0: null }; }
    if (R.type === 'log') return { D: { tex: ']' + tx(R.vq) + ';\\,\\infty[', lo: R.v, hi: null, open: true }, W: { tex: RR, lo: null, hi: null }, inj: true, r0: null };
    const F = R.F, D0 = Pow.domain(F), W0 = Pow.range(F);
    const evenM = F.m % 2 === 0;                                     // gerader Zähler: nicht umkehrbar (achsensymmetrisch zu x = v)
    const D = { tex: D0.tex, lo: D0.kind === 'ge' || D0.kind === 'gt' ? F.v : null, hi: null, open: D0.kind === 'gt' || D0.kind === 'ne', hole: D0.kind === 'ne' ? F.v : null };
    const W = { tex: W0.tex, lo: null, hi: null };
    const r = R.r === null || R.r === undefined ? null : R.r;
    if (!evenM) return { D, W, inj: true, r0: null };
    // Einschränkung auf x ≥ r (Standard: rechter Ast ab v)
    const rr = r === null ? F.v : r, strict = F.m < 0 && Math.abs(rr - F.v) < 1e-9;
    const Dr = { tex: (strict ? ']' : '[') + tx(Qn(rr)) + ';\\,\\infty[', lo: rr, hi: null, open: strict };
    const f = fOf(R), yr = f(rr), up = (F.a > 0) === (F.m > 0);         // rechts von v steigend?
    const Wr = rr <= F.v + 1e-9 ? W : (up ? { tex: '[' + tx(Qn(rnd(yr))) + ';\\,\\infty[', lo: yr, hi: null } : { tex: ']-\\infty;\\,' + tx(Qn(rnd(yr))) + ']', lo: null, hi: yr });
    return { D, W, inj: false, r0: F.v, r: rr, Dr, Wr, up };
  }
  // Umkehrfunktion: D und W (vertauscht; bei Einschränkung die des rechten Astes)
  function invDW(R) { const I = info(R); return I.inj ? { D: I.W, W: I.D } : { D: I.Wr, W: I.Dr }; }

  // ── LaTeX ──
  function fTex(R, lhs) {
    lhs = lhs === undefined ? 'f(x)' : lhs;
    let s;
    if (R.type === 'lin') s = Lin.lineTex(Lin.mk(R.m, R.q), '').replace(/^=/, '');
    else if (R.type === 'pow') s = Pow.fTex(R.F, '');
    else if (R.type === 'exp') s = Expo.fTex(R.F, '');
    else { const inner = isZ(R.vq) ? 'x' : '(x' + sg(E.qNeg(R.vq)) + ')'; s = (E.qEq(R.aq, q1) ? '' : E.qEq(R.aq, qm1) ? '-' : tx(R.aq) + '\\cdot ') + (R.e ? '\\ln' : '\\log_{' + tx(R.bq) + '}') + (inner === 'x' ? ' x' : inner) + (isZ(R.dq) ? '' : sg(R.dq)); }
    return (lhs ? lhs + '=' : '') + s;
  }
  // Term (x − h)/a als LaTeX (für die Umkehrung); gibt {s, simple}
  function innerTex(hq, aq, varName) {
    const v = varName || 'x';
    const top = isZ(hq) ? v : v + sg(E.qNeg(hq));
    if (E.qEq(aq, q1)) return { s: top, simple: isZ(hq) };
    if (E.qEq(aq, qm1)) return { s: isZ(hq) ? '-' + v : '-' + v + sg(hq), simple: false };
    return { s: '\\frac{' + top + '}{' + tx(aq) + '}', simple: false };
  }
  function invTex(R, lhs, varName) {
    lhs = lhs === undefined ? 'f^{-1}(x)' : lhs; const v = varName || 'x';
    let s;
    if (R.type === 'lin') { const m1 = E.qInv(R.mq), q1n = E.qNeg(E.qDiv(R.qq, R.mq)); s = Lin.lineTex(Lin.mkQ(m1, q1n), '').replace(/^=/, '').replace(/x/g, v); }
    else if (R.type === 'pow') {
      const F = R.F, inn = innerTex(F.hq, F.aq, v), am = Math.abs(F.m);
      const top = isZ(F.hq) ? v : v + sg(E.qNeg(F.hq));
      const recip = '\\frac{' + tx(F.aq) + '}{' + top + '}';                       // 1/t = a/(x − h)
      const root = (k, body) => (k === 2 ? '\\sqrt{' : '\\sqrt[' + k + ']{') + body + '}';
      const par = b => (/^[a-z]$/.test(b) || b.startsWith('\\sqrt') ? b : '\\left(' + b + '\\right)');
      const base = F.m > 0 ? inn.s : recip;                                        // t bzw. 1/t
      let t;
      if (am === 1) t = F.n === 1 ? base : par(base) + '^{' + F.n + '}';
      else t = F.n === 1 ? root(am, base) : '\\left(' + root(am, base) + '\\right)^{' + F.n + '}';
      s = t + (isZ(F.vq) ? '' : sg(F.vq));
    } else if (R.type === 'exp') { const F = R.F, inn = innerTex(F.dq, F.aq, v); s = Expo.logTex(F, inn.s); }
    else { const inn = innerTex(R.dq, R.aq, v), bt = R.e ? 'e' : (R.bq.d !== 1n ? '\\left(' + tx(R.bq) + '\\right)' : tx(R.bq)); s = bt + '^{' + inn.s + '}' + (isZ(R.vq) ? '' : sg(R.vq)); }
    return (lhs ? lhs + '=' : '') + s;
  }

  // ── Eingabe ──
  function fromAst(ast) {
    if (!ast) return null;
    const isNum = n => n && (n.type === 'num' || (n.type === 'neg' && isNum(n.x)) || ((n.type === 'div' || n.type === 'mul' || n.type === 'add' || n.type === 'sub') && isNum(n.a) && isNum(n.b)));
    const val = n => { if (!n) return NaN; if (n.type === 'num') return parseFloat(n.v); if (n.type === 'neg') return -val(n.x); const a = val(n.a), b = val(n.b); return n.type === 'div' ? a / b : n.type === 'mul' ? a * b : n.type === 'add' ? a + b : a - b; };
    const isX = n => n && n.type === 'id' && n.v === 'x';
    const linP = n => {
      if (!n) return null;
      if (isX(n)) return { k: 1, m: 0 };
      if (isNum(n)) return { k: 0, m: val(n) };
      if (n.type === 'neg') { const l = linP(n.x); return l ? { k: -l.k, m: -l.m } : null; }
      if (n.type === 'add' || n.type === 'sub') { const a = linP(n.a), b = linP(n.b); if (!a || !b) return null; const s = n.type === 'add' ? 1 : -1; return { k: a.k + s * b.k, m: a.m + s * b.m }; }
      if (n.type === 'mul') { const a = linP(n.a), b = linP(n.b); if (!a || !b) return null; if (a.k === 0) return { k: a.m * b.k, m: a.m * b.m }; if (b.k === 0) return { k: b.m * a.k, m: b.m * a.m }; return null; }
      if (n.type === 'div') { const a = linP(n.a); if (!a || !isNum(n.b)) return null; const d = val(n.b); return { k: a.k / d, m: a.m / d }; }
      return null;
    };
    const l = linP(ast); if (l && isFinite(l.k) && Math.abs(l.k) > 1e-12) return lin(l.k, l.m);
    // Logarithmus a·log(x − v) + d
    const inner = n => { if (isX(n)) return 0; if (n && (n.type === 'sub' || n.type === 'add') && isX(n.a) && isNum(n.b)) return n.type === 'sub' ? val(n.b) : -val(n.b); if (n && n.type === 'add' && isNum(n.a) && isX(n.b)) return -val(n.a); return null; };
    const core = n => {
      if (!n || n.type !== 'call') return null;
      if (n.name === 'log' && n.args.length === 1) { const v = inner(n.args[0]); return v === null ? null : { v, b: Math.E, e: true }; }
      if (n.name === 'log10' && n.args.length === 1) { const v = inner(n.args[0]); return v === null ? null : { v, b: 10, e: false }; }
      if (n.name === 'logn' && n.args.length === 2 && isNum(n.args[1])) { const v = inner(n.args[0]), b = val(n.args[1]); return v === null || !(b > 0) || Math.abs(b - 1) < 1e-9 ? null : { v, b, e: false }; }
      if (n.name === 'log' && n.args.length === 2 && isNum(n.args[0])) { const v = inner(n.args[1]), b = val(n.args[0]); return v === null || !(b > 0) ? null : { v, b, e: false }; }
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
    const t = term(body); if (t && isFinite(t.a) && t.a !== 0 && isFinite(d)) return log(t.a, t.b, t.v, d, t.e);
    const Fe = Expo.fromAst(ast); if (Fe && !Fe.deg) return exp(Fe);
    const Fp = Pow.fromAst(ast); if (Fp && !Fp.deg) return pow(Fp);
    return null;
  }
  function raw(R) {
    const qr = z => { const n = Number(z.n), dd = Number(z.d); return dd === 1 ? String(n) : '(' + n + '/' + dd + ')'; };
    if (R.type === 'lin') { const one = E.qEq(E.qAbs(R.mq), q1), an = E.qSgn(R.mq) < 0 ? '-' : ''; return (one ? an : qr(R.mq) + '*') + 'x' + (isZ(R.qq) ? '' : (E.qSgn(R.qq) < 0 ? '-' : '+') + qr(E.qAbs(R.qq))); }
    if (R.type === 'pow') return Pow.raw(R.F);
    if (R.type === 'exp') return Expo.raw(R.F);
    const inner = isZ(R.vq) ? 'x' : 'x' + (E.qSgn(R.vq) < 0 ? '+' : '-') + qr(E.qAbs(R.vq));
    const fn = R.e ? 'log(' + inner + ')' : (R.bq.d === 1n && R.bq.n === 10n ? 'log10(' + inner + ')' : 'logn(' + inner + ',' + qr(R.bq) + ')');
    const one = E.qEq(E.qAbs(R.aq), q1), an = E.qSgn(R.aq) < 0 ? '-' : '';
    return (one ? an : qr(R.aq) + '*') + fn + (isZ(R.dq) ? '' : (E.qSgn(R.dq) < 0 ? '-' : '+') + qr(E.qAbs(R.dq)));
  }

  // ── Schnittstellen von y = k mit f (numerisch, Vorzeichenwechsel + Bisektion) ──
  function hits(R, k, x0, x1, n) {
    const f = fOf(R), N = n || 600, out = [];
    let px = x0, py = f(px) - k;
    for (let i = 1; i <= N; i++) {
      const x = x0 + (x1 - x0) * i / N; const y = f(x) - k;
      if (isFinite(py) && isFinite(y) && Math.abs(y - py) < 50 * Math.abs(k || 1) + 50) {
        if (py === 0) out.push(px);
        else if ((py < 0) !== (y < 0)) { let a = px, b = x, fa = py; for (let j = 0; j < 40; j++) { const m = (a + b) / 2, fm = f(m) - k; if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m; } out.push((a + b) / 2); }
      }
      px = x; py = y;
    }
    return out.filter((v, i, arr) => i === 0 || Math.abs(v - arr[i - 1]) > 1e-6);
  }

  // ── bekannte Paare ──
  const PAIRS = [
    { id: 'sq', name: 'x² und √x', f: x => (x >= 0 ? x * x : NaN), g: y => (y >= 0 ? Math.sqrt(y) : NaN), fTex: 'f(x)=x^2', gTex: 'f^{-1}(x)=\\sqrt{x}', Df: '[0;\\,\\infty[', Wf: '[0;\\,\\infty[', Dg: '[0;\\,\\infty[', Wg: '[0;\\,\\infty[', note: 'x² ist nur für x ≥ 0 umkehrbar (sonst gehört zu jedem y > 0 zweimal ein x).', noteTex: '$x^2$ ist nur für $x\\ge0$ umkehrbar (sonst gehört zu jedem $y>0$ zweimal ein $x$).', x0: 2, xr: [0, null], gray: x => x * x },
    { id: 'cube', name: 'x³ und ³√x', f: x => x * x * x, g: y => Math.cbrt(y), fTex: 'f(x)=x^3', gTex: 'f^{-1}(x)=\\sqrt[3]{x}', Df: RR, Wf: RR, Dg: RR, Wg: RR, note: 'x³ ist streng monoton wachsend und darum auf ganz ℝ umkehrbar.', noteTex: '$x^3$ ist streng monoton wachsend und darum auf ganz $\\mathbb{R}$ umkehrbar.', x0: 1.5, xr: null },
    { id: 'exp2', name: '2^x und log₂ x', f: x => Math.pow(2, x), g: y => (y > 0 ? Math.log2(y) : NaN), fTex: 'f(x)=2^x', gTex: 'f^{-1}(x)=\\log_{2} x', Df: RR, Wf: ']0;\\,\\infty[', Dg: ']0;\\,\\infty[', Wg: RR, note: 'Der Logarithmus fragt nach dem Exponenten: log₂ 8 = 3, weil 2³ = 8.', noteTex: 'Der Logarithmus fragt nach dem Exponenten: $\\log_2 8=3$, weil $2^3=8$.', x0: 2, xr: null },
    { id: 'expe', name: 'e^x und ln x', f: x => Math.exp(x), g: y => (y > 0 ? Math.log(y) : NaN), fTex: 'f(x)=e^x', gTex: 'f^{-1}(x)=\\ln x', Df: RR, Wf: ']0;\\,\\infty[', Dg: ']0;\\,\\infty[', Wg: RR, note: 'ln ist der Logarithmus zur Basis e ≈ 2,718: ln(eˣ) = x und e^(ln x) = x.', noteTex: '$\\ln$ ist der Logarithmus zur Basis $e\\approx2.718$: $\\ln(e^x)=x$ und $e^{\\ln x}=x$.', x0: 1, xr: null },
    { id: 'exp10', name: '10^x und lg x', f: x => Math.pow(10, x), g: y => (y > 0 ? Math.log10(y) : NaN), fTex: 'f(x)=10^x', gTex: 'f^{-1}(x)=\\lg x=\\log_{10} x', Df: RR, Wf: ']0;\\,\\infty[', Dg: ']0;\\,\\infty[', Wg: RR, note: 'lg 1000 = 3, weil 10³ = 1000: Der Zehnerlogarithmus zählt die Stellen.', noteTex: '$\\lg 1000=3$, weil $10^3=1000$: Der Zehnerlogarithmus zählt die Stellen.', x0: 0.5, xr: null },
    { id: 'rec', name: '1/x und 1/x', f: x => (x !== 0 ? 1 / x : NaN), g: y => (y !== 0 ? 1 / y : NaN), fTex: 'f(x)=\\frac{1}{x}', gTex: 'f^{-1}(x)=\\frac{1}{x}', Df: RR + '\\setminus\\{0\\}', Wf: RR + '\\setminus\\{0\\}', Dg: RR + '\\setminus\\{0\\}', Wg: RR + '\\setminus\\{0\\}', note: '1/x ist zu sich selbst invers: Der Graph ist symmetrisch zur Winkelhalbierenden.', noteTex: '$\\frac{1}{x}$ ist zu sich selbst invers: Der Graph ist symmetrisch zur Winkelhalbierenden.', x0: 2, xr: null },
    { id: 'sin', name: 'sin x und arcsin x', f: x => (x >= -Math.PI / 2 && x <= Math.PI / 2 ? Math.sin(x) : NaN), g: y => (y >= -1 && y <= 1 ? Math.asin(y) : NaN), fTex: 'f(x)=\\sin x', gTex: 'f^{-1}(x)=\\arcsin x', Df: '[-\\frac{\\pi}{2};\\,\\frac{\\pi}{2}]', Wf: '[-1;\\,1]', Dg: '[-1;\\,1]', Wg: '[-\\frac{\\pi}{2};\\,\\frac{\\pi}{2}]', note: 'sin ist nur auf [−π/2; π/2] umkehrbar (dort streng monoton); arcsin liefert Winkel aus diesem Bereich.', noteTex: '$\\sin$ ist nur auf $[-\\frac{\\pi}{2};\\frac{\\pi}{2}]$ umkehrbar (dort streng monoton); $\\arcsin$ liefert Winkel aus diesem Bereich.', x0: 0.8, xr: [-Math.PI / 2, Math.PI / 2], gray: x => Math.sin(x) },
    { id: 'cos', name: 'cos x und arccos x', f: x => (x >= 0 && x <= Math.PI ? Math.cos(x) : NaN), g: y => (y >= -1 && y <= 1 ? Math.acos(y) : NaN), fTex: 'f(x)=\\cos x', gTex: 'f^{-1}(x)=\\arccos x', Df: '[0;\\,\\pi]', Wf: '[-1;\\,1]', Dg: '[-1;\\,1]', Wg: '[0;\\,\\pi]', note: 'cos ist nur auf [0; π] umkehrbar; arccos liefert Winkel zwischen 0 und π.', noteTex: '$\\cos$ ist nur auf $[0;\\pi]$ umkehrbar; $\\arccos$ liefert Winkel zwischen $0$ und $\\pi$.', x0: 1, xr: [0, Math.PI], gray: x => Math.cos(x) },
    { id: 'tan', name: 'tan x und arctan x', f: x => (x > -Math.PI / 2 && x < Math.PI / 2 ? Math.tan(x) : NaN), g: y => Math.atan(y), fTex: 'f(x)=\\tan x', gTex: 'f^{-1}(x)=\\arctan x', Df: ']-\\frac{\\pi}{2};\\,\\frac{\\pi}{2}[', Wf: RR, Dg: RR, Wg: ']-\\frac{\\pi}{2};\\,\\frac{\\pi}{2}[', note: 'tan ist auf ]−π/2; π/2[ streng monoton; arctan hat die waagrechten Asymptoten y = ±π/2.', noteTex: '$\\tan$ ist auf $]-\\frac{\\pi}{2};\\frac{\\pi}{2}[$ streng monoton; $\\arctan$ hat die waagrechten Asymptoten $y=\\pm\\frac{\\pi}{2}$.', x0: 1, xr: [-Math.PI / 2, Math.PI / 2], gray: x => Math.tan(x) }
  ];

  return { rnd, Qn, lin, pow, exp, log, mk, restrict, fOf, invOf, info, invDW, fTex, invTex, innerTex, fromAst, raw, hits, PAIRS };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Inv;
