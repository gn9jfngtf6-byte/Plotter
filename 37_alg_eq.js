// ═══════════════════════════════════════════════════════════════════
// 37_alg_eq.js — Algebra: Gleichungen (ohne DOM, node-testbar)
//
// Darstellung 'eq': lineare Gleichungen (Waage), quadratische und höhere (Parabel / Kurve),
// Bruchgleichungen (Definitionsmenge, Zahlengerade), Wurzelgleichungen (Quadrieren und Probe),
// Exponential- und Logarithmusgleichungen (weiter über die Logarithmen-Darstellung).
// Wird bei AlgMore registriert: AlgMore.process(text, 'eq', …).
// ═══════════════════════════════════════════════════════════════════
(function () {
  const M = (typeof AlgMore !== 'undefined') ? AlgMore : require('./35_alg_more.js');
  const C = M.C, fail = M.fail, strip = M.strip, Scene = M.Scene;
  const { q, qadd, qmul, qneg, qinv, qeq, qzero, qnum, qabs, qsgn, qint, qTex, ONE } = C;
  const Z = q(0);
  const fmt = v => String(Math.round(v * 10000) / 10000);
  const sub = (v, i, n) => (n > 1 ? v + '_{' + (i + 1) + '}' : v);

  // ── Polynome in einer Variablen: Array von Brüchen, Index = Grad ──
  const trim = a => { a = a.slice(); while (a.length && qzero(a[a.length - 1])) a.pop(); return a; };
  const padd = (a, b) => { const r = []; for (let i = 0; i < Math.max(a.length, b.length); i++) r.push(qadd(a[i] || Z, b[i] || Z)); return trim(r); };
  const pneg = a => a.map(qneg);
  const psub = (a, b) => padd(a, pneg(b));
  const pmul = (a, b) => { if (!a.length || !b.length) return []; const r = Array(a.length + b.length - 1).fill(Z); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] = qadd(r[i + j], qmul(x, y)); })); return trim(r); };
  const pscale = (a, c) => trim(a.map(x => qmul(x, c)));
  const deg = a => a.length - 1;
  const peval = (a, x) => { let r = Z; for (let i = a.length - 1; i >= 0; i--) r = qadd(qmul(r, x), a[i]); return r; };
  const pevalN = (a, x) => { let r = 0; for (let i = a.length - 1; i >= 0; i--) r = r * x + qnum(a[i]); return r; };
  function pdivmod(a, b) {
    let r = a.slice(), out = Array(Math.max(a.length - b.length + 1, 0)).fill(Z);
    while (r.length >= b.length && r.length) {
      const c = qmul(r[r.length - 1], qinv(b[b.length - 1])), d = r.length - b.length;
      out[d] = c; for (let i = 0; i < b.length; i++) r[i + d] = qadd(r[i + d], qneg(qmul(c, b[i])));
      r = trim(r); if (r.length && r.length === a.length) break;
      if (!r.length) break;
    }
    return [trim(out), trim(r)];
  }
  function pgcd(a, b) { a = trim(a); b = trim(b); while (b.length) { const r = pdivmod(a, b)[1]; a = b; b = r; } return a.length ? pscale(a, qinv(a[a.length - 1])) : a; }
  const toC = (a, v) => a.reduce((p, c, i) => (qzero(c) ? p : C.pAdd(p, [{ c, m: i ? { [v]: i } : {} }])), []);
  const ptex = (a, v) => (a.length ? C.polyTex(toC(a, v || 'x')) : '0');

  // ── Rationale Funktionen N/D ──
  const rNorm = r => {
    if (!r.D.length) fail('Division durch 0');
    if (!r.N.length) return { N: [], D: [ONE] };
    const g = pgcd(r.N, r.D);
    let N = r.N, D = r.D;
    if (deg(g) > 0) { N = pdivmod(N, g)[0]; D = pdivmod(D, g)[0]; }
    const k = qinv(D[D.length - 1]); return { N: pscale(N, k), D: pscale(D, k) };
  };
  const rAdd = (a, b) => rNorm({ N: padd(pmul(a.N, b.D), pmul(b.N, a.D)), D: pmul(a.D, b.D) });
  const rMul = (a, b) => rNorm({ N: pmul(a.N, b.N), D: pmul(a.D, b.D) });
  const rInv = a => { if (!a.N.length) fail('Division durch 0'); return rNorm({ N: a.D, D: a.N }); };
  function rat(n, v) {
    switch (n.t) {
      case 'num': return { N: trim([n.v]), D: [ONE] };
      case 'var': if (n.n !== v) fail('Hier nur eine Unbekannte (ein Buchstabe)'); return { N: [Z, ONE], D: [ONE] };
      case 'neg': { const r = rat(n.a, v); return { N: pneg(r.N), D: r.D }; }
      case 'paren': return rat(n.a, v);
      case 'add': return n.a.map(x => rat(x, v)).reduce(rAdd);
      case 'mul': return n.a.map(x => rat(x, v)).reduce(rMul);
      case 'div': return rMul(rat(n.a, v), rInv(rat(n.b, v)));
      case 'pow': {
        if (n.sqrt) fail('Hier nur eine Wurzel mit x pro Gleichung');
        const c = M.pConstVal(M.toPoly(n.e)); if (!c || !qint(c) || Math.abs(c[0]) > 12) fail('Hier nur ganze Hochzahlen bis 12');
        let r = { N: [ONE], D: [ONE] }; const b = rat(n.a, v);
        for (let i = 0; i < Math.abs(c[0]); i++) r = rMul(r, b);
        return c[0] < 0 ? rInv(r) : r;
      }
    }
    fail('Hier nicht erlaubt');
  }
  const walk = (n, f) => {
    if (!n) return; f(n);
    if (n.a !== undefined) { if (Array.isArray(n.a)) n.a.forEach(x => walk(x, f)); else walk(n.a, f); }
    if (n.b) walk(n.b, f); if (n.e) walk(n.e, f); if (n.l) walk(n.l, f); if (n.r) walk(n.r, f);
  };
  const contains = (n, v) => { let r = false; walk(n, x => { if (x.t === 'var' && x.n === v) r = true; }); return r; };
  const subst = (n, v, val) => {
    const go = x => {
      switch (x.t) {
        case 'var': return x.n === v ? (qint(val) && val[0] >= 0 ? { t: 'num', v: val } : { t: 'paren', a: { t: 'num', v: val } }) : x;
        case 'neg': case 'paren': return { t: x.t, a: go(x.a) };
        case 'add': case 'mul': return { t: x.t, a: x.a.map(go) };
        case 'div': return { t: 'div', a: go(x.a), b: go(x.b) };
        case 'pow': return Object.assign({}, x, { a: go(x.a), e: x.sqrt ? x.e : go(x.e) });
        default: return x;
      }
    };
    return go(n);
  };

  // ── Lösungen ──
  // sol = {tex, val, q (exakt oder null)}
  const qsol = r => ({ tex: qTex(r), val: qnum(r), q: r });
  function simplifySqrt(n) { let k = 1, r = n; for (let p = 2; p * p <= r; p++) while (r % (p * p) === 0) { r /= p * p; k *= p; } return [k, r]; }
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const lcmI = (a, b) => a / gcd(a, b) * b;
  function intCoefs(a) { // ganze, teilerfremde Koeffizienten (Vorzeichen so, dass der höchste positiv ist)
    let L = 1; a.forEach(c => { L = lcmI(L, c[1]); });
    let r = a.map(c => c[0] * (L / c[1]));
    let g = 0; r.forEach(x => { g = gcd(g, x); }); if (g > 1) r = r.map(x => x / g);
    if (r[r.length - 1] < 0) r = r.map(x => -x);
    return r;
  }
  function quadSolutions(a) { // a = [c, b, a] (Brüche)
    const [c, b, A] = intCoefs(a);
    const D = b * b - 4 * A * c;
    const info = { A, B: b, Cc: c, D };
    if (D < 0) return Object.assign(info, { sols: [] });
    if (D === 0) return Object.assign(info, { sols: [qsol(q(-b, 2 * A))] });
    const [k, r] = simplifySqrt(D);
    if (r === 1) {
      const s = [q(-b - k, 2 * A), q(-b + k, 2 * A)]; s.sort((x, y) => qnum(x) - qnum(y));
      return Object.assign(info, { sols: s.map(qsol), exact: true });
    }
    let g = gcd(gcd(b, k), 2 * A); const nb = -b / g, kk = k / g, den = 2 * A / g;
    const root = (kk === 1 ? '' : String(kk)) + '\\sqrt{' + r + '}';
    const frac = sg => { const num = (nb !== 0 ? String(nb) : '') + (sg < 0 ? '-' : (nb !== 0 ? '+' : '')) + root; return den === 1 ? num : '\\frac{' + num + '}{' + den + '}'; };
    const val = sg => (-b + sg * Math.sqrt(D)) / (2 * A);
    return Object.assign(info, { sols: [{ tex: frac(-1), val: val(-1), q: null }, { tex: frac(1), val: val(1), q: null }], k: kk, r, g });
  }
  function ratRoots(a) { // rationale Nullstellen durch Probieren (Grad ≤ 6), mit Vielfachheit nicht
    const ic = intCoefs(a); const lead = Math.abs(ic[ic.length - 1]), cst = Math.abs(ic[0]);
    const divs = n => { const d = []; for (let i = 1; i <= n && i < 2000; i++) if (n % i === 0) d.push(i); return d; };
    const out = [];
    if (ic[0] === 0) out.push(Z);
    if (cst !== 0) divs(cst).forEach(p => divs(lead).forEach(qq => [1, -1].forEach(s => { const r = q(s * p, qq); if (!out.some(o => qeq(o, r)) && qzero(peval(a, r))) out.push(r); })));
    out.sort((x, y) => qnum(x) - qnum(y)); return out;
  }
  // Alle reellen Lösungen von a(x) = 0 (Grad ≤ 4) → {sols, steps(optional)}
  function polySolutions(a) {
    a = trim(a); const d = deg(a);
    if (d < 1) return { sols: [] };
    if (d === 1) return { sols: [qsol(qneg(qmul(a[0], qinv(a[1]))))] };
    if (d === 2) return { sols: quadSolutions(a).sols };
    if (d > 4) fail('Hier nur Gleichungen bis zum 4. Grad');
    const rr = ratRoots(a); let rest = a; const sols = [];
    rr.forEach(r => { sols.push(qsol(r)); rest = pdivmod(rest, [qneg(r), ONE])[0]; });
    if (deg(rest) >= 1) { if (deg(rest) <= 2) polySolutions(rest).sols.forEach(s => sols.push(s)); else fail('Diese Gleichung lässt sich hier nicht lösen'); }
    const uniq = []; sols.forEach(s => { if (!uniq.some(u => Math.abs(u.val - s.val) < 1e-9)) uniq.push(s); });
    uniq.sort((x, y) => x.val - y.val); return { sols: uniq };
  }
  const setTex = sols => '\\mathbb{L}=\\{' + (sols.length ? sols.map(s => s.tex).join(';\\,') : '\\,') + '\\}';

  // ── Figuren ──
  const HUE = { x: 0, k: 3, neg: 4 };
  function balanceState(S, y0, side, yTopRef) {
    // side: {l:{a,b}, r:{a,b}} mit ganzzahligen Anzahlen
    const rows = s => Math.ceil((Math.abs(s.a) + Math.abs(s.b)) / 4);
    const nr = Math.max(rows(side.l), rows(side.r), 1);
    const put = (cx, s) => {
      const items = [];
      for (let i = 0; i < Math.abs(s.a); i++) items.push({ t: s.a < 0 ? '-x' : 'x', h: s.a < 0 ? HUE.neg : HUE.x });
      for (let i = 0; i < Math.abs(s.b); i++) items.push({ t: s.b < 0 ? '-1' : '1', h: s.b < 0 ? HUE.neg : HUE.k });
      items.forEach((it, i) => { const col = i % 4, row = Math.floor(i / 4); S.chip(cx - 2.3 + col * 1.2, y0 - 1.2 * (row + 1) + 0.08, 1.05, it.t, it.h, ''); });
      if (!items.length) S.text(cx, y0 - 0.7, '0', { muted: true });
    };
    put(-3.4, side.l); put(3.4, side.r);
    S.line(-6.2, y0, 6.2, y0, { thick: true, hue: -1 });
    S.line(0, y0, -0.7, y0 + 1.1, { hue: -1 }); S.line(0, y0, 0.7, y0 + 1.1, { hue: -1 }); S.line(-1.0, y0 + 1.1, 1.0, y0 + 1.1, { thick: true, hue: -1 });
    S.text(0, y0 - 0.7, '=', { big: true });
    return nr;
  }
  function waageFig(Pl, Pr, ctx) {
    try {
      const l = { a: Pl[1] || Z, b: Pl[0] || Z }, r = { a: Pr[1] || Z, b: Pr[0] || Z };
      const all = [l.a, l.b, r.a, r.b];
      const small = all.every(c => qint(c) && Math.abs(c[0]) <= 8);
      const S = Scene();
      const states = [];
      const cc = x => x[0];
      if (small && Math.abs(cc(l.a)) + Math.abs(cc(l.b)) <= 12 && Math.abs(cc(r.a)) + Math.abs(cc(r.b)) <= 12) {
        states.push({ l: { a: cc(l.a), b: cc(l.b) }, r: { a: cc(r.a), b: cc(r.b) } });
        const A2 = qadd(l.a, qneg(r.a)), D2 = qadd(r.b, qneg(l.b));
        const mid = { l: { a: cc(A2), b: 0 }, r: { a: 0, b: cc(D2) } };
        if (!(states[0].l.b === 0 && states[0].r.a === 0)) states.push(mid);
        if (Math.abs(cc(A2)) !== 1 || states.length === 1) { const sol = qmul(D2, qinv(A2)); if (qint(sol) && Math.abs(sol[0]) <= 12) states.push({ l: { a: 1, b: 0 }, r: { a: 0, b: sol[0] } }); else states.push({ l: { a: 1, b: 0 }, r: { a: 0, b: 0 }, label: qTex(sol) }); }
        else if (qeq(A2, q(-1))) states.push({ l: { a: 1, b: 0 }, r: { a: 0, b: -cc(D2) } });
        let y = 0; const ops = ctx.ops || [];
        states.forEach((st, i) => {
          const nr = Math.max(Math.ceil((Math.abs(st.l.a) + Math.abs(st.l.b)) / 4), Math.ceil((Math.abs(st.r.a) + Math.abs(st.r.b)) / 4), 1);
          y += nr * 1.2 + 0.9; const yb = y;
          balanceState(S, yb, st);
          if (st.label) { S.chip(2.0, yb - 1.12, 2.8, st.label, HUE.k, ''); }
          y = yb + 2.0;
          if (i < states.length - 1) { S.line(0, y - 0.4, 0, y + 0.5, { arrow: true, hue: -1 }); if (ops[i]) S.text(0.7, y + 0.05, ops[i], { ax: 'l', muted: true }); y += 1.1; }
        });
        return S.fig();
      }
      // grosse oder gebrochene Koeffizienten: Terme als Bausteine
      const term = (a, b) => { const p = []; if (!qzero(a)) p.push(C.polyTex(toC([Z, a], 'x'))); if (!qzero(b)) p.push(qTex(b)); return p; };
      const side = (cx, a, b) => { const items = []; if (!qzero(a)) items.push([C.polyTex(toC([Z, a], 'x')), HUE.x]); if (!qzero(b)) items.push([qTex(b), HUE.k]); let x = cx - (items.reduce((s, it) => s + Math.max(1.2, M.chipW(it[0])) + 0.2, 0) / 2); items.forEach(it => { const w = Math.max(1.2, M.chipW(it[0])); S.chip(x, -1.2, w, it[0], it[1], ''); x += w + 0.2; }); if (!items.length) S.text(cx, -0.7, '0', { muted: true }); };
      side(-3.6, l.a, l.b); side(3.6, r.a, r.b);
      S.line(-6.2, 0.1, 6.2, 0.1, { thick: true, hue: -1 }); S.line(0, 0.1, -0.7, 1.2, { hue: -1 }); S.line(0, 0.1, 0.7, 1.2, { hue: -1 }); S.line(-1.0, 1.2, 1.0, 1.2, { thick: true, hue: -1 });
      S.text(0, -0.7, '=', { big: true });
      return S.fig();
    } catch (e) { return null; }
  }
  function axesFig(S, x0, x1, y0, y1, sx, sy, o) { // Achsen mit Teilstrichen
    const X = x => (x - x0) * sx, Y = y => -(y - y0) * sy;
    const yAx = (y0 <= 0 && y1 >= 0) ? Y(0) : Y(y0);
    S.line(X(x0), yAx, X(x1), yAx, { hue: -1, arrow: true });
    if (x0 <= 0 && x1 >= 0 && !(o && o.noYAxis)) S.line(X(0), Y(y0), X(0), Y(y1), { hue: -1, arrow: true });
    const span = x1 - x0, step = span > 16 ? 5 : span > 8 ? 2 : 1;
    for (let t = Math.ceil(x0); t <= Math.floor(x1); t++) if (t % step === 0 && !(o && o.noTicks)) { S.line(X(t), yAx - 0.12, X(t), yAx + 0.12, { hue: -1 }); if (t !== 0) S.text(X(t), yAx + 0.65, String(t), { muted: true }); }
    return { X, Y, yAx };
  }
  function curveFig(Pf, sols, o) {
    try {
      o = o || {};
      const S = Scene(), rv = sols.map(s => s.val);
      let x0 = rv.length ? Math.min(...rv) : -1, x1 = rv.length ? Math.max(...rv) : 1;
      if (deg(Pf) === 2) { const vx = -qnum(Pf[1]) / (2 * qnum(Pf[2])); x0 = Math.min(x0, vx); x1 = Math.max(x1, vx); }
      const pad = Math.max(2.5, (x1 - x0) * 0.5); x0 = Math.floor(x0 - pad); x1 = Math.ceil(x1 + pad);
      if (x1 - x0 < 5) { const m = (x0 + x1) / 2; x0 = Math.floor(m - 2.5); x1 = x0 + 5; }
      const N = 80, pts = []; let ymin = 0, ymax = 0;
      for (let i = 0; i <= N; i++) { const x = x0 + (x1 - x0) * i / N, y = pevalN(Pf, x); pts.push([x, y]); }
      const ys = pts.map(p => p[1]).sort((a, b) => a - b);
      const lo = ys[Math.floor(ys.length * 0.02)], hi = ys[Math.ceil(ys.length * 0.98) - 1];
      ymin = Math.min(0, lo); ymax = Math.max(0, hi); if (ymax - ymin < 1e-6) { ymax = 1; ymin = -1; }
      const padY = (ymax - ymin) * 0.12; ymin -= padY; ymax += padY;
      const sx = 11 / (x1 - x0), sy = Math.min(6.5 / (ymax - ymin), sx * 1.4);
      const A = axesFig(S, x0, x1, ymin, ymax, sx, sy);
      const clip = pts.filter(p => p[1] >= ymin && p[1] <= ymax);
      S.curve(pts.filter(p => p[1] >= ymin - 1e-9 && p[1] <= ymax + 1e-9).map(p => [A.X(p[0]), A.Y(p[1])]), { hue: 0, thick: true });
      let lastX = -1e9, lvl = 0;
      sols.forEach((s, i) => { S.dot(A.X(s.val), A.yAx, { hue: 3 }); lvl = (A.X(s.val) - lastX < 1.9) ? 1 - lvl : 0; lastX = A.X(s.val); S.text(A.X(s.val), A.yAx + (lvl ? 2.2 : 1.35), 'x_{' + (sols.length > 1 ? i + 1 : '') + '}=' + s.tex, { hue: 3, ay: 't' }); });
      return S.fig();
    } catch (e) { return null; }
  }
  function lineFig(ex, ok, sc) { // Zahlengerade: ausgeschlossene Stellen, Lösungen, Scheinlösungen
    try {
      const S = Scene(), all = ex.concat(ok, sc).map(s => s.val);
      let x0 = Math.min(...all, 0), x1 = Math.max(...all, 0); const pad = Math.max(1.5, (x1 - x0) * 0.2); x0 = Math.floor(x0 - pad); x1 = Math.ceil(x1 + pad);
      if (x1 - x0 < 6) { x0 -= 2; x1 += 2; }
      const sx = 12 / (x1 - x0), A = axesFig(S, x0, x1, -1, 1, sx, 1, { noYAxis: true });
      ex.forEach(s => { S.dot(A.X(s.val), A.yAx, { hue: 4, open: true }); S.text(A.X(s.val), A.yAx - 0.85, 'x\\neq ' + s.tex, { hue: 4, ay: 'b' }); S.line(A.X(s.val), A.yAx - 0.6, A.X(s.val), A.yAx - 0.15, { hue: 4, dash: true }); });
      sc.forEach(s => { S.dot(A.X(s.val), A.yAx, { hue: 4, open: true }); S.text(A.X(s.val), A.yAx - 2.0, '\\times\\; x=' + s.tex, { hue: 4, ay: 'b' }); });
      ok.forEach(s => { S.dot(A.X(s.val), A.yAx, { hue: 3 }); S.text(A.X(s.val), A.yAx - 1.45, 'x=' + s.tex, { hue: 3, ay: 'b' }); });
      return S.fig();
    } catch (e) { return null; }
  }

  // ── Polynomgleichung (Seiten Pl, Pr) ──
  function solvePoly(Pl, Pr, out, push, v) {
    const F = psub(Pl, Pr), d = deg(F);
    if (d < 0) { push('Ergebnis', '0=0'); push('Lösung', '\\mathbb{L}=\\mathbb{R}'); out.caption = out.given + ' \\;\\Rightarrow\\; \\mathbb{L}=\\mathbb{R}'; out.hints.push('Die Gleichung ist immer wahr: jede Zahl ist eine Lösung.'); return []; }
    if (d === 0) { push('Zusammenfassen', qTex(F[0]) + '=0'); push('Lösung', '\\mathbb{L}=\\{\\,\\}'); out.caption = out.given + ' \\;\\Rightarrow\\; \\mathbb{L}=\\{\\,\\}'; out.hints.push('Die Gleichung ist nie wahr: es gibt keine Lösung.'); return []; }
    if (d === 1) return linear(Pl, Pr, out, push, v);
    if (d === 2) return quadratic(Pl, Pr, F, out, push, v);
    return higher(Pl, Pr, F, out, push, v);
  }
  function linear(Pl, Pr, out, push, v) {
    const a = Pl[1] || Z, b = Pl[0] || Z, c = Pr[1] || Z, dd = Pr[0] || Z;
    const A2 = qadd(a, qneg(c)), D2 = qadd(dd, qneg(b)), sol = qmul(D2, qinv(A2));
    const ops = [];
    if (!qzero(c)) { push('x-Terme auf die linke Seite', ptex([b, A2], v) + '=' + qTex(dd)); ops.push((qsgn(c) > 0 ? '-' : '+') + ptex([Z, qabs(c)], v)); }
    if (!qzero(b)) { push('Zahlen auf die rechte Seite', ptex([Z, A2], v) + '=' + qTex(D2)); ops.push((qsgn(b) > 0 ? '-' : '+') + qTex(qabs(b))); }
    if (!qeq(A2, ONE)) { push('Durch den Faktor vor x teilen', v + '=\\frac{' + qTex(D2) + '}{' + qTex(A2) + '}'); ops.push(':' + (qsgn(A2) < 0 ? '(' + qTex(A2) + ')' : qTex(A2))); }
    const s = qsol(sol);
    push('Lösung', v + '=' + s.tex);
    out.ctx = { ops };
    out.caption = out.given + ' \\;\\Rightarrow\\; ' + v + '=' + s.tex;
    return [s];
  }
  function quadratic(Pl, Pr, F, out, push, v) {
    const a = F[2], b = F[1] || Z, c = F[0] || Z;
    if (Pr.length) push('Alles auf eine Seite', ptex(F, v) + '=0');
    let res;
    const qs = quadSolutions(F);
    if (qzero(b)) {
      const rhs = qneg(qmul(c, qinv(a)));
      push('Nach ' + v + '² auflösen', v + '^{2}=' + qTex(rhs));
      if (qsgn(rhs) < 0) { push('Keine Lösung', v + '^{2}\\geq 0'); out.hints.push('Ein Quadrat ist nie negativ: keine reelle Lösung.'); res = []; }
      else if (qzero(rhs)) res = [qsol(Z)];
      else { push('Wurzel ziehen', v + '=\\pm\\sqrt{' + qTex(rhs) + '}'); res = qs.sols; }
    } else if (qzero(c)) {
      push(v + ' ausklammern', v + '\\left(' + ptex([b, a], v) + '\\right)=0');
      push('Satz vom Nullprodukt', v + '=0\\;\\lor\\;' + ptex([b, a], v) + '=0');
      res = qs.sols;
    } else {
      push('Lösungsformel', v + '_{1,2}=\\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}');
      push('Koeffizienten', 'a=' + qs.A + ',\\;b=' + qs.B + ',\\;c=' + qs.Cc);
      push('Diskriminante', 'D=b^{2}-4ac=' + qs.D);
      if (qs.D < 0) { push('Keine Lösung', 'D<0'); out.hints.push('D < 0: die Parabel schneidet die x-Achse nicht – keine reelle Lösung.'); res = []; }
      else if (qs.D === 0) { push('Doppelte Lösung', v + '=\\frac{-b}{2a}=' + qs.sols[0].tex); res = qs.sols; }
      else {
        push('Einsetzen', v + '_{1,2}=\\frac{' + (qs.B <= 0 ? String(-qs.B) : '-' + (qs.B < 0 ? '(' + qs.B + ')' : qs.B)) + '\\pm\\sqrt{' + qs.D + '}}{' + 2 * qs.A + '}');
        res = qs.sols;
      }
    }
    if (res.length) {
      push('Lösungen', res.map((s, i) => v + '_{' + (res.length > 1 ? i + 1 : '') + '}=' + s.tex).join(',\\;'));
      if (res.some(s => s.q === null)) push('Näherung', res.map((s, i) => v + '_{' + (i + 1) + '}\\approx ' + fmt(s.val)).join(',\\;'));
      if (res.length === 2 && res.every(s => s.q)) push('Faktorisiert', fac(a, res, v) + '=0');
    }
    out.caption = out.given + ' \\;\\Rightarrow\\; ' + setTex(res);
    return res;
  }
  const fac = (a, res, v) => (qeq(a, ONE) ? '' : qTex(a)) + res.map(s => '(' + v + (qsgn(s.q) > 0 ? '-' : '+') + qTex(qabs(s.q)) + ')').join('').replace(/\(x\+0\)|\(x-0\)/g, 'x');
  function higher(Pl, Pr, F, out, push, v) {
    push('Alles auf eine Seite', ptex(F, v) + '=0');
    const rr = ratRoots(F);
    if (!rr.length) fail('Diese Gleichung lässt sich hier nicht lösen (keine rationale Lösung zum Raten)');
    push('Lösung erraten', rr.map(r => v + '=' + qTex(r)).join(',\\;') + '\\;\\checkmark');
    let rest = F;
    rr.forEach(r => { const nx = pdivmod(rest, [qneg(r), ONE])[0]; push('Polynomdivision', '\\left(' + ptex(rest, v) + '\\right):\\left(' + v + (qsgn(r) > 0 ? '-' : '+') + qTex(qabs(r)).replace(/^0$/, '0') + '\\right)=' + ptex(nx, v)); rest = nx; });
    const res = polySolutions(F).sols;
    push('Lösungen', res.map((s, i) => v + '_{' + (i + 1) + '}=' + s.tex).join(',\\;'));
    out.caption = out.given + ' \\;\\Rightarrow\\; ' + setTex(res);
    return res;
  }

  // ── Bruchgleichung ──
  function fractionEq(root, v, out, push) {
    const L = rat(root.l, v), R = rat(root.r, v);
    // Nenner aus dem Term
    const dens = []; walk(root, n => {
      if (n.t === 'div') dens.push(rat(n.b, v).N);
      if (n.t === 'pow' && !n.sqrt) { const c = M.pConstVal(M.toPoly(n.e)); if (c && qsgn(c) < 0) dens.push(rat(n.a, v).N); }
    });
    const exclPolys = dens.filter(p => deg(p) >= 1);
    const excl = []; exclPolys.forEach(p => polySolutions(p).sols.forEach(s => { if (!excl.some(e => Math.abs(e.val - s.val) < 1e-9)) excl.push(s); }));
    excl.sort((a, b) => a.val - b.val);
    if (excl.length) push('Definitionsmenge', '\\mathbb{D}=\\mathbb{R}\\setminus\\{' + excl.map(s => s.tex).join(';\\,') + '\\}');
    const F = rNorm(rAdd(L, { N: pneg(R.N), D: R.D }));
    // Gemeinsamer Nenner aus den Nennern des Terms (ohne zu kürzen)
    let uniq = []; dens.filter(p => deg(p) >= 1).forEach(p => { if (!uniq.some(u => deg(u) === deg(p) && pscale(u, qinv(u[u.length - 1])).every((c, i) => qeq(c, pscale(p, qinv(p[p.length - 1]))[i])))) uniq.push(p); });
    uniq = uniq.filter(p => !uniq.some(o => o !== p && deg(o) > deg(p) && pdivmod(o, p)[1].length === 0));
    let Dst = [ONE]; uniq.forEach(p => { Dst = pmul(Dst, p); });
    let Nst = F.N;
    const qd = pdivmod(Dst, F.D); if (!qd[1].length) Nst = pmul(F.N, qd[0]); else Dst = F.D;
    push('Alles auf einen Bruch', '\\frac{' + ptex(Nst, v) + '}{' + ptex(Dst, v) + '}=0');
    push('Zähler gleich null', ptex(Nst, v) + '=0');
    const cand = Nst.length ? polySolutions(Nst).sols : [];
    if (!Nst.length) fail('Die Gleichung ist für alle erlaubten x wahr');
    push('Lösungen des Zählers', cand.length ? cand.map((s, i) => sub(v, i, cand.length) + '=' + s.tex).join(',\\;') : '\\mathbb{L}=\\{\\,\\}');
    const isEx = s => excl.some(e => Math.abs(e.val - s.val) < 1e-9);
    const ok = cand.filter(s => !isEx(s)), bad = cand.filter(isEx);
    // Scheinlösungen: Nullstelle des Nenners, die der Zähler "erzeugt" (durch Kürzen)
    if (bad.length) push('In der Definitionsmenge prüfen', bad.map(s => v + '=' + s.tex + '\\;\\notin\\;\\mathbb{D}').join(',\\;'));
    push('Lösung', setTex(ok));
    out.caption = out.given + ' \\;\\Rightarrow\\; ' + setTex(ok);
    out.fig = lineFig(excl, ok, bad);
    return ok;
  }

  // ── Wurzelgleichung ──
  function sqForm(n, v) { // a·√A + P
    const add = (x, y) => { if (x.A && y.A && !(x.A.length === y.A.length && x.A.every((c, i) => qeq(c, y.A[i])))) fail('Hier nur eine Wurzel mit x pro Gleichung'); return { a: qadd(x.a, y.a), A: x.A || y.A, P: padd(x.P, y.P) }; };
    switch (n.t) {
      case 'pow': if (n.sqrt && n.idx === 2 && contains(n.a, v)) { const r = rat(n.a, v); if (deg(r.D) > 0) fail('Hier nur Wurzeln aus einem Polynom'); return { a: ONE, A: pscale(r.N, qinv(r.D[0])), P: [] }; } break;
      case 'neg': { const r = sqForm(n.a, v); return { a: qneg(r.a), A: r.A, P: pneg(r.P) }; }
      case 'paren': return sqForm(n.a, v);
      case 'add': return n.a.map(x => sqForm(x, v)).reduce(add);
      case 'mul': {
        const hasS = n.a.filter(x => hasSq(x, v));
        if (hasS.length === 1) { const rest = n.a.filter(x => x !== hasS[0]); const k = rat({ t: 'mul', a: rest.length ? rest : [{ t: 'num', v: ONE }] }, v); if (deg(k.N) > 0 || deg(k.D) > 0) fail('Hier nur Zahlen vor der Wurzel'); const r = sqForm(hasS[0], v), c = qmul(k.N[0] || Z, qinv(k.D[0])); return { a: qmul(r.a, c), A: r.A, P: pscale(r.P, c) }; }
        if (hasS.length > 1) fail('Hier nur eine Wurzel mit x pro Gleichung'); break;
      }
      case 'div': { if (hasSq(n.b, v)) fail('Hier nur eine Wurzel im Zähler'); const d = rat(n.b, v); if (deg(d.N) > 0) fail('Hier nur durch Zahlen teilen'); const c = qinv(qmul(d.N[0] || Z, qinv(d.D[0]))); const r = sqForm(n.a, v); return { a: qmul(r.a, c), A: r.A, P: pscale(r.P, c) }; }
    }
    if (hasSq(n, v)) fail('Hier nur eine Wurzel mit x pro Gleichung');
    const r = rat(n, v); if (deg(r.D) > 0) fail('Brüche mit x im Nenner und Wurzeln zusammen gibt es hier nicht');
    return { a: Z, A: null, P: pscale(r.N, qinv(r.D[0])) };
  }
  const hasSq = (n, v) => { let r = false; walk(n, x => { if (x.t === 'pow' && x.sqrt && contains(x.a, v)) r = true; }); return r; };
  function rootEq(root, v, out, push) {
    const f = psub([], []); // Platzhalter
    const l = sqForm(root.l, v), r = sqForm(root.r, v);
    const a = qadd(l.a, qneg(r.a)), P = psub(l.P, r.P), A = l.A || r.A;
    if (!A || qzero(a)) fail('Hier muss die Wurzel mit x in der Gleichung vorkommen');
    const B = pscale(P, qneg(qinv(a)));
    const cond = ptex(A, v);
    push('Wurzel isolieren', '\\sqrt{' + cond + '}=' + ptex(B, v));
    const sq = pmul(B, B);
    push('Quadrieren', cond + '=' + (B.length === 2 && qzero(B[0]) && qeq(B[1], ONE) ? v + '^{2}' : '\\left(' + ptex(B, v) + '\\right)^{2}'));
    push('Ausrechnen', ptex(A, v) + '=' + ptex(sq, v));
    const F = psub(A, sq);
    const cand = deg(F) >= 1 ? (deg(F) <= 2 ? (deg(F) === 1 ? polySolutions(F).sols : quadSolutions(F).sols) : polySolutions(F).sols) : [];
    if (deg(F) >= 1) {
      push('Alles auf eine Seite', ptex(F, v) + '=0');
      push('Lösungen der quadrierten Gleichung', cand.length ? cand.map((s, i) => sub(v, i, cand.length) + '=' + s.tex).join(',\\;') : '\\mathbb{L}=\\{\\,\\}');
    } else if (!F.length) fail('Die Gleichung ist für alle x im Definitionsbereich wahr');
    const ok = [], bad = [];
    cand.forEach(s => {
      const Av = pevalN(A, s.val), Bv = pevalN(B, s.val);
      const good = Av >= -1e-9 && Bv >= -1e-9 && Math.abs(Math.sqrt(Math.max(Av, 0)) - Bv) < 1e-7;
      const subs = s.q ? ('\\sqrt{' + qTex(peval(A, s.q)) + '}=' + qTex(peval(B, s.q)) ) : ('\\sqrt{' + fmt(Av) + '}\\approx ' + fmt(Math.sqrt(Math.max(Av, 0))) + ',\\; ' + ptex(B, v) + '\\approx ' + fmt(Bv));
      let shown = subs;
      if (s.q) { const ra = peval(A, s.q), sr = Math.sqrt(qnum(ra)); shown = '\\sqrt{' + qTex(ra) + '}=' + (Number.isInteger(sr) || (qint(ra) && Number.isInteger(Math.sqrt(ra[0]))) ? fmt(sr) : '\\sqrt{' + qTex(ra) + '}') + ',\\quad ' + ptex(B, v) + '=' + qTex(peval(B, s.q)); if (!(ra[0] >= 0)) shown = '\\sqrt{' + qTex(ra) + '}\\;\\notin\\;\\mathbb{R}'; }
      push('Probe ' + v + '=' + s.tex, shown + '\\quad' + (good ? '\\checkmark' : '\\times'));
      (good ? ok : bad).push(s);
    });
    push('Lösung', setTex(ok));
    if (bad.length) out.hints.push('Quadrieren ist keine Äquivalenzumformung: darum ist die Probe nötig. ' + (bad.length === 1 ? 'Eine Lösung der quadrierten Gleichung ist eine Scheinlösung.' : 'Mehrere Lösungen sind Scheinlösungen.'));
    out.caption = out.given + ' \\;\\Rightarrow\\; ' + setTex(ok);
    out.fig = rootFig(A, B, ok, bad);
    return ok;
  }
  function rootFig(A, B, ok, bad) {
    try {
      const S = Scene(), all = ok.concat(bad).map(s => s.val);
      let x0 = all.length ? Math.min(...all) : -1, x1 = all.length ? Math.max(...all) : 1;
      // Definitionsbereich der Wurzel: Anfang
      const dom = []; for (let i = 0; i <= 200; i++) { const x = x0 - 4 + (x1 - x0 + 8) * i / 200; if (pevalN(A, x) >= 0) dom.push(x); }
      if (dom.length) { x0 = Math.min(x0, dom[0]); }
      const pad = Math.max(1.5, (x1 - x0) * 0.3); x0 = Math.floor(x0 - pad); x1 = Math.ceil(x1 + pad); if (x1 - x0 < 5) x1 = x0 + 5;
      const N = 100, up = [], dn = [], lin = [];
      for (let i = 0; i <= N; i++) { const x = x0 + (x1 - x0) * i / N, a = pevalN(A, x); if (a >= 0) { up.push([x, Math.sqrt(a)]); dn.push([x, -Math.sqrt(a)]); } lin.push([x, pevalN(B, x)]); }
      const ys = up.map(p => p[1]).concat(lin.map(p => p[1])).concat(dn.map(p => p[1])).sort((a, b) => a - b);
      let ymin = Math.min(0, ys[Math.floor(ys.length * 0.03)]), ymax = Math.max(0, ys[Math.ceil(ys.length * 0.97) - 1]); if (ymax - ymin < 1e-6) { ymax = 1; ymin = -1; }
      const py = (ymax - ymin) * 0.1; ymin -= py; ymax += py;
      const sx = 11 / (x1 - x0), sy = Math.min(6.5 / (ymax - ymin), sx * 1.4);
      const Ax = axesFig(S, x0, x1, ymin, ymax, sx, sy);
      const inR = p => p[1] >= ymin && p[1] <= ymax;
      S.curve(up.filter(inR).map(p => [Ax.X(p[0]), Ax.Y(p[1])]), { hue: 0, thick: true });
      if (bad.length) S.curve(dn.filter(inR).map(p => [Ax.X(p[0]), Ax.Y(p[1])]), { hue: 0, dash: true });
      S.curve(lin.filter(inR).map(p => [Ax.X(p[0]), Ax.Y(p[1])]), { hue: 1, thick: true });
      ok.forEach(s => { S.dot(Ax.X(s.val), Ax.Y(pevalN(B, s.val)), { hue: 3 }); S.line(Ax.X(s.val), Ax.Y(pevalN(B, s.val)), Ax.X(s.val), Ax.yAx, { dash: true, hue: 3 }); S.text(Ax.X(s.val), Ax.yAx + 1.2, 'x=' + s.tex, { hue: 3, ay: 't' }); });
      bad.forEach(s => { S.dot(Ax.X(s.val), Ax.Y(pevalN(B, s.val)), { hue: 4, open: true }); S.text(Ax.X(s.val), Ax.yAx + 1.2, '\\times', { hue: 4, ay: 't' }); });
      return S.fig();
    } catch (e) { return null; }
  }

  // Exponentialgleichung: beide Seiten als Graphen, die Lösung ist der Schnittpunkt
  function evalAst(n, x) {
    switch (n.t) {
      case 'num': return n.v[0] / n.v[1];
      case 'var': return x;
      case 'neg': return -evalAst(n.a, x);
      case 'paren': return evalAst(n.a, x);
      case 'add': return n.a.reduce((a, c) => a + evalAst(c, x), 0);
      case 'mul': return n.a.reduce((a, c) => a * evalAst(c, x), 1);
      case 'div': return evalAst(n.a, x) / evalAst(n.b, x);
      case 'pow': { const b = evalAst(n.a, x); return b > 0 || Number.isInteger(evalAst(n.e, x)) ? Math.pow(b, evalAst(n.e, x)) : NaN; }
    }
    return NaN;
  }
  function expFig(root) {
    try {
      const f = x => evalAst(root.l, x) - evalAst(root.r, x);
      let xs = null;
      for (let a = -30; a < 30 && xs === null; a += 0.05) { const fa = f(a), fb = f(a + 0.05); if (isFinite(fa) && isFinite(fb) && fa * fb <= 0) { let lo = a, hi = a + 0.05; for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid; } xs = (lo + hi) / 2; } }
      if (xs === null) return null;
      const yv = evalAst(root.r, xs); if (!isFinite(yv)) return null;
      const S = Scene(), x0 = Math.floor(xs - 5), x1 = Math.ceil(xs + 3);
      const N = 100, L1 = [], L2 = []; let ymax = Math.max(Math.abs(yv) * 1.8, 1);
      const ymin = Math.min(0, yv * 1.5) - 0.1 * ymax;
      for (let i = 0; i <= N; i++) { const x = x0 + (x1 - x0) * i / N; L1.push([x, evalAst(root.l, x)]); L2.push([x, evalAst(root.r, x)]); }
      const sx = 11 / (x1 - x0), sy = Math.min(6.5 / (ymax - ymin), sx * 1.4);
      const A = axesFig(S, x0, x1, ymin, ymax, sx, sy);
      const draw = (pts, hue) => S.curve(pts.filter(p => isFinite(p[1]) && p[1] >= ymin && p[1] <= ymax).map(p => [A.X(p[0]), A.Y(p[1])]), { hue, thick: true });
      draw(L1, 0); draw(L2, 1);
      S.line(A.X(xs), A.Y(yv), A.X(xs), A.yAx, { dash: true, hue: 3 });
      S.dot(A.X(xs), A.Y(yv), { hue: 3 });
      S.dot(A.X(xs), A.yAx, { hue: 3 });
      S.text(A.X(xs), A.yAx + 1.25, 'x\\approx ' + (Math.round(xs * 100) / 100), { hue: 3, ay: 't' });
      return S.fig();
    } catch (e) { return null; }
  }

  // ── Einstieg ──
  function processEq(ast, text, vals, opt) {
    const root = strip(ast);
    if (root.t !== 'eq') fail('Das ist keine Gleichung – es fehlt «=»');
    const vars = new Set(); walk(root, n => { if (n.t === 'var') vars.add(n.n); });
    if (!vars.size) fail('In der Gleichung fehlt die Variable');
    if (vars.size > 1) fail('Hier nur eine Unbekannte (ein Buchstabe)');
    const v = [...vars][0];
    let hasCall = false, xExp = false;
    walk(root, n => { if (n.t === 'call') hasCall = true; if (n.t === 'pow' && !n.sqrt && contains(n.e, v)) xExp = true; });
    if (hasCall || xExp) { const r = M.processLog(ast, text, vals, opt); r.kind = 'eq'; r.fig = (!hasCall && xExp) ? expFig(root) : null; return r; }
    const out = { steps: [], hints: [], vars: [], kind: 'eq', given: M.astTex(ast) };
    const push = (label, tex) => { const l = out.steps[out.steps.length - 1]; if (l && l.tex === tex) return; out.steps.push({ label, tex }); };
    push('Gegeben', out.given);
    let sols;
    if (hasSq(root, v)) sols = rootEq(root, v, out, push);
    else {
      const L = rat(root.l, v), R = rat(root.r, v);
      let xDen = false; walk(root, n => { if (n.t === 'div' && contains(n.b, v)) xDen = true; if (n.t === 'pow' && !n.sqrt) { const c = M.pConstVal(M.toPoly(n.e)); if (c && qsgn(c) < 0 && contains(n.a, v)) xDen = true; } });
      if (!xDen && deg(L.D) === 0 && deg(R.D) === 0) {
        const Pl = pscale(L.N, qinv(L.D[0])), Pr = pscale(R.N, qinv(R.D[0]));
        const simp = ptex(Pl, v) + '=' + ptex(Pr, v);
        if (simp.replace(/\s/g, '') !== out.given.replace(/\s/g, '')) push('Seiten vereinfachen', simp);
        sols = solvePoly(Pl, Pr, out, push, v);
        out.fig = null;
        if (sols.length) {
          const F = psub(Pl, Pr);
          if (deg(F) === 1) out.fig = waageFig(Pl, Pr, out.ctx || {});
          else out.fig = curveFig(F, sols);
          if (deg(F) >= 1 && sols.length) {
            // Probe bei einfachen Lösungen
            const s = sols[0];
            if (deg(F) === 1 && s.q) {
              const lt = M.astTex(subst(root.l, v, s.q)), rt = M.astTex(subst(root.r, v, s.q));
              push('Probe links', lt + '=' + qTex(peval(Pl, s.q)));
              push('Probe rechts', rt + '=' + qTex(peval(Pr, s.q)));
            }
          }
        } else if (deg(psub(Pl, Pr)) >= 2) out.fig = curveFig(psub(Pl, Pr), []);
      } else sols = fractionEq(root, v, out, push);
    }
    out.sols = (sols || []).map(x => x.val); out.allReal = out.steps.some(x => x.tex === '0=0');
    delete out.ctx;
    return out;
  }
  M.register('eq', processEq);
  M.Eq = { processEq, rat, polySolutions, quadSolutions, ratRoots, peval, pmul, padd, ptex };
})();
