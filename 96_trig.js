// ═════════════════════════════════════════════════════════════════
// MODUL 96: Trig — Rechenkern der Umgebung «Trigonometrische Funktionen» (ohne DOM, node-testbar)
//
// Baut auf 60_dif.js (Dif.E = exakte Brüche und Fe = p + q·√d) und 80_lin.js (Lin.Qn) auf.
//   Trig.deg2rad(φ), Trig.rad2deg(x)      Umrechnung Grad ↔ Bogenmass
//   Trig.radTex(φ)                         Bogenmass als Vielfaches von π ('\frac{\pi}{6}', '\pi', '2\pi', sonst Dezimalzahl)
//   Trig.degTex(φ)                         '30^\circ'
//   Trig.exact(φ)                          {sin, cos, tan} als Fe (exakt) für Vielfache von 30° und 45°, sonst null; tan: null bei Polstelle
//   Trig.vals(φ)                           {sin, cos, tan, sinT, cosT, tanT, exact, quad, pole}  (Texte exakt oder gerundet)
//   Trig.quadrant(φ)                       1…4 (0 auf den Achsen)
//   Trig.mk(a, b, c, d, kind)              allgemeine Sinusfunktion f(x) = a·sin(b(x − c)) + d  (kind 'sin'|'cos'; a ≠ 0, b > 0)
//   Trig.fOf(F)                            numerische Funktion
//   Trig.props(F)                          {amp, T, Tq (Periode als Vielfaches von π), max, min, c, d, zeros(k), maxAt(k)}
//   Trig.fTex(F, lhs)                      LaTeX
//   Trig.fromAst(ast), Trig.raw(F)         Eingabe «2*sin(3*(x-1))+1», «-cos(2x)», «sin(x-pi/2)» → F und zurück
//   Rechenwege (Schritte und SV.Doc): 96b_trig_docs.js
// ═════════════════════════════════════════════════════════════════
const Trig = (function () {
  const E = Dif.E, Qn = Lin.Qn;
  const q0 = E.q0, q1 = E.q1, qm1 = E.qNeg(E.q1);
  const num = E.qNum, isZ = E.qIsZero;
  const rnd = x => Math.round(x * 1e6) / 1e6 + 0;
  const deg2rad = d => d * Math.PI / 180, rad2deg = x => x * 180 / Math.PI;
  const norm = d => { let r = d % 360; if (r < 0) r += 360; return Math.abs(r) < 1e-9 || Math.abs(r - 360) < 1e-9 ? 0 : r; };

  // ── Winkel als Text ──
  // Bogenmass φ° = φ/180·π; Bruch nur, wenn er einfach ist (Nenner ≤ 36)
  function piFrac(deg) {
    const q = Qn(deg / 180);
    if (q.d > 36n) return null;
    return q;
  }
  function piTex(q) {                                           // q·π als LaTeX
    if (!q || isZ(q)) return '0';
    const s = E.qSgn(q) < 0 ? '-' : '', a = E.qAbs(q);
    if (a.d === 1n) return s + (a.n === 1n ? '' : String(a.n)) + '\\pi';
    return s + '\\frac{' + (a.n === 1n ? '' : String(a.n)) + '\\pi}{' + a.d + '}';
  }
  const radTex = deg => { const q = piFrac(deg); return q ? piTex(q) : Dif.fmtT(deg2rad(deg), 3); };
  const degTex = deg => Dif.fmtT(deg, 2) + '^\\circ';

  // ── exakte Werte an besonderen Winkeln ──
  const F = (p, q, d) => E.Fe(Qn(p), Qn(q), d);                 // p + q√d
  const SIN = { 0: F(0, 0, 1), 30: F(0.5, 0, 1), 45: F(0, 0.5, 2), 60: F(0, 0.5, 3), 90: F(1, 0, 1) };
  function exact(deg) {
    const d = norm(deg), k30 = Math.abs(d / 30 - Math.round(d / 30)) < 1e-7, k45 = Math.abs(d / 45 - Math.round(d / 45)) < 1e-7;
    if (!k30 && !k45) return null;                                // nur Vielfache von 30° und 45°
    const ref = d <= 90 ? d : d <= 180 ? 180 - d : d <= 270 ? d - 180 : 360 - d;
    const s0 = SIN[Math.round(ref)], c0 = SIN[Math.round(90 - ref)];
    if (!s0 || !c0) return null;
    const ss = d > 180 && d < 360 ? -1 : 1, cs = d > 90 && d < 270 ? -1 : 1;
    const sin = ss < 0 ? E.feNeg(s0) : s0, cos = cs < 0 ? E.feNeg(c0) : c0;
    const tan = E.feIsZero(cos) ? null : E.feDiv(sin, cos);
    return { sin, cos, tan, pole: E.feIsZero(cos) };
  }
  function quadrant(deg) { const d = norm(deg); if (d % 90 === 0) return 0; return Math.floor(d / 90) + 1; }
  function vals(deg) {
    const x = deg2rad(deg), ex = exact(deg), s = Math.sin(x), c = Math.cos(x);
    const pole = ex ? ex.pole : Math.abs(c) < 1e-9;
    const fmt = v => Dif.fmtT(v, 4);
    return {
      sin: s, cos: c, tan: pole ? NaN : s / c, exact: !!ex, pole, quad: quadrant(deg),
      sinT: ex ? E.feTex(ex.sin) : fmt(s), cosT: ex ? E.feTex(ex.cos) : fmt(c),
      tanT: pole ? '\\text{nicht definiert}' : (ex && ex.tan ? E.feTex(ex.tan) : fmt(s / c)),
      approx: !ex
    };
  }

  // ── allgemeine Sinusfunktion ──
  // b und c dürfen Vielfache von π sein (bpi, cpi als Bruch, sonst null); dann rechnet T = 2/bpi ohne π.
  const piQ = v => { const r = piFrac(rad2deg(v)); return r && r.d <= 12n && !isZ(r) ? r : null; };
  function mk(a, b, c, d, kind) {
    const aq = Qn(a), dq = Qn(d === undefined ? 0 : d);
    c = c === undefined ? 0 : Number(c); b = Number(b);
    if (!isFinite(b) || Math.abs(b) < 1e-9) b = 1;
    let sgn = 1; if (b < 0) { b = -b; sgn = -1; }
    const kd = kind === 'cos' ? 'cos' : 'sin';
    const aa = sgn < 0 && kd === 'sin' ? E.qNeg(aq) : aq;                        // sin(−u) = −sin u, cos(−u) = cos u
    const bpi = piQ(b), bq = bpi ? null : Qn(b), bv = bpi ? num(bpi) * Math.PI : num(bq);
    const cpi = piQ(c), cq = cpi ? null : Qn(c), cv = cpi ? num(cpi) * Math.PI : num(cq);
    return { a: num(aa), b: bv, c: cv, d: num(dq), aq: aa, bq, bpi, cq, cpi, dq, kind: kd, deg: isZ(aq) };
  }
  // Stelle x als Vielfaches von π (wenn einfach) oder Dezimalzahl
  const xTex = x => { if (Math.abs(x) < 1e-9) return '0'; const q = piQ(x); return q ? piTex(q) : Dif.fmtT(x, 3); };
  const fOf = F => x => F.a * (F.kind === 'cos' ? Math.cos(F.b * (x - F.c)) : Math.sin(F.b * (x - F.c))) + F.d;
  // Periode T = 2π/b: als Bruch·π (TTex) bzw. rational, wenn b ein Vielfaches von π ist
  function periodTex(F, div) {
    div = div || 1;
    if (F.bpi) return tx(E.qDiv(E.Q(2), E.qMul(F.bpi, E.Q(div))));
    return piTex(E.qDiv(E.Q(2), E.qMul(F.bq, E.Q(div))));
  }
  function props(F) {
    const T = 2 * Math.PI / F.b, amp = Math.abs(F.a), up = F.a > 0;
    const maxAt0 = F.kind === 'sin' ? (up ? T / 4 : 3 * T / 4) : (up ? 0 : T / 2);
    return { amp, ampq: E.qAbs(F.aq), T, TTex: periodTex(F), T2Tex: periodTex(F, 2), T4Tex: periodTex(F, 4), max: F.d + amp, min: F.d - amp, up, maxAt: k => F.c + maxAt0 + k * T, minAt: k => F.c + maxAt0 + T / 2 + k * T, zeroAt: k => F.c + (F.kind === 'sin' ? 0 : T / 4) + k * T / 2 };
  }

  // ── LaTeX ──
  const tx = q => E.qTex(q), sg = q => (E.qSgn(q) < 0 ? '-' : '+') + tx(E.qAbs(q));
  const aPre = aq => (E.qEq(aq, q1) ? '' : E.qEq(aq, qm1) ? '-' : tx(aq) + '\\cdot ');
  const bTex = F => (F.bpi ? piTex(F.bpi) : tx(F.bq));
  const cTexAbs = F => (F.cpi ? piTex(E.qAbs(F.cpi)) : tx(E.qAbs(F.cq)));
  const cTex = F => (F.cpi ? piTex(F.cpi) : tx(F.cq));
  const cSgn = F => (F.cpi ? E.qSgn(F.cpi) : E.qSgn(F.cq));
  // Argument b(x − c) als LaTeX
  function argTex(F) {
    const inner = cSgn(F) === 0 ? 'x' : 'x' + (cSgn(F) < 0 ? '+' : '-') + cTexAbs(F);
    if (!F.bpi && E.qEq(F.bq, q1)) return inner;
    const bt = bTex(F); return bt + (inner === 'x' ? (/[a-z]$/i.test(bt) ? ' x' : 'x') : '(' + inner + ')');
  }
  function fTex(F, lhs) {
    lhs = lhs === undefined ? 'y' : lhs;
    let s = F.deg ? tx(F.dq) : aPre(F.aq) + '\\' + F.kind + '\\left(' + argTex(F) + '\\right)' + (isZ(F.dq) ? '' : sg(F.dq));
    return (lhs ? lhs + '=' : '') + s;
  }

  // ── Eingabe: AST (14_mathinput.js) → F ──
  function fromAst(ast) {
    if (!ast) return null;
    const isPi = n => n && n.type === 'id' && n.v === 'pi';
    const isNum = n => n && (n.type === 'num' || isPi(n) || (n.type === 'neg' && isNum(n.x)) || ((n.type === 'div' || n.type === 'mul' || n.type === 'add' || n.type === 'sub') && isNum(n.a) && isNum(n.b)));
    const val = n => { if (!n) return NaN; if (n.type === 'num') return parseFloat(n.v); if (isPi(n)) return Math.PI; if (n.type === 'neg') return -val(n.x); const a = val(n.a), b = val(n.b); return n.type === 'div' ? a / b : n.type === 'mul' ? a * b : n.type === 'add' ? a + b : a - b; };
    const isX = n => n && n.type === 'id' && n.v === 'x';
    const lin = n => {                                              // k·x + m  →  {k, m}
      if (!n) return null;
      if (isX(n)) return { k: 1, m: 0 };
      if (isNum(n)) return { k: 0, m: val(n) };
      if (n.type === 'neg') { const l = lin(n.x); return l ? { k: -l.k, m: -l.m } : null; }
      if (n.type === 'add' || n.type === 'sub') { const a = lin(n.a), b = lin(n.b); if (!a || !b) return null; const s = n.type === 'add' ? 1 : -1; return { k: a.k + s * b.k, m: a.m + s * b.m }; }
      if (n.type === 'mul') { const a = lin(n.a), b = lin(n.b); if (!a || !b) return null; if (a.k === 0) return { k: a.m * b.k, m: a.m * b.m }; if (b.k === 0) return { k: b.m * a.k, m: b.m * a.m }; return null; }
      if (n.type === 'div') { const a = lin(n.a); if (!a || !isNum(n.b)) return null; const v = val(n.b); return { k: a.k / v, m: a.m / v }; }
      return null;
    };
    const core = n => {
      if (!n || n.type !== 'call' || (n.name !== 'sin' && n.name !== 'cos') || n.args.length !== 1) return null;
      const l = lin(n.args[0]); if (!l || !isFinite(l.k) || l.k === 0) return null;
      return { kind: n.name, b: l.k, c: -l.m / l.k };
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
    const t = term(body); if (!t || !isFinite(t.a) || !isFinite(d) || !isFinite(t.c)) return null;
    return mk(t.a, t.b, t.c, d, t.kind);
  }
  // Rohausdruck für das Eingabefeld (b, c als Vielfache von pi, wenn möglich)
  function raw(F) {
    const qr = z => { const n = Number(z.n), dd = Number(z.d); return dd === 1 ? String(n) : '(' + n + '/' + dd + ')'; };
    const piR = r => { const ar = E.qAbs(r); return (ar.n === 1n ? '' : ar.n + '*') + 'pi' + (ar.d === 1n ? '' : '/' + ar.d); };
    const one = E.qEq(E.qAbs(F.aq), q1), an = E.qSgn(F.aq) < 0 ? '-' : '';
    const cs = cSgn(F) === 0 ? '' : (cSgn(F) < 0 ? '+' : '-') + (F.cpi ? piR(F.cpi) : qr(E.qAbs(F.cq)));
    const bs = F.bpi ? (E.qEq(F.bpi, q1) ? 'pi' : '(' + piR(F.bpi) + ')') : (E.qEq(F.bq, q1) ? '' : qr(F.bq));
    const arg = bs ? bs + '*' + (cs ? '(x' + cs + ')' : 'x') : 'x' + cs;
    let s = (one ? an : qr(F.aq) + '*') + F.kind + '(' + arg + ')';
    if (!isZ(F.dq)) s += (E.qSgn(F.dq) < 0 ? '-' : '+') + qr(E.qAbs(F.dq));
    return s;
  }

  return { rnd, Qn, deg2rad, rad2deg, norm, piFrac, piTex, radTex, degTex, xTex, exact, quadrant, vals, mk, fOf, props, periodTex, fTex, argTex, bTex, cTex, cSgn, aPre, fromAst, raw };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Trig;
