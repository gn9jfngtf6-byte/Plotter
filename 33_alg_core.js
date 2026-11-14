// ═══════════════════════════════════════════════════════════════════
// 33_alg_core.js — Algebra: Rechenkern (ohne DOM, node-testbar)
//
// Terme mit mehreren Variablen (Buchstaben), exakte Brüche, Ausmultiplizieren,
// Faktorisieren, quadratische Ergänzung, Pascal'sches Dreieck — und die
// Beschreibung der Bilder (Flächenmodelle) als Liste einfacher Zeichenbefehle
// («Primitive»), die sowohl das Canvas (34_alg_ui.js) als auch der LaTeX-Export
// (TikZ) verwenden.
//
// Zahlen: Brüche [Zähler, Nenner] (ganze Zahlen). Polynom: Liste von
// {c:[n,d], m:{x:2,y:1}}, sortiert (höchster Grad zuerst), ohne Nullen.
// Einstieg für die Oberfläche: AlgCore.process(text, mode, vals, opt).
// ═══════════════════════════════════════════════════════════════════
const AlgCore = (function () {
  class AlgError extends Error {}
  const fail = msg => { throw new AlgError(msg); };

  // ── Brüche ─────────────────────────────────────────────────────────
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
  function q(n, d) {
    if (d === undefined) d = 1;
    if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d)) fail('Zahl zu gross');
    if (d === 0) fail('Division durch 0');
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    return [n / g, d / g];
  }
  const qadd = (a, b) => q(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
  const qmul = (a, b) => { const g1 = gcd(a[0], b[1]) || 1, g2 = gcd(b[0], a[1]) || 1; return q((a[0] / g1) * (b[0] / g2), (a[1] / g2) * (b[1] / g1)); };
  const qneg = a => [-a[0], a[1]];
  const qinv = a => { if (a[0] === 0) fail('Division durch 0'); return q(a[1], a[0]); };
  const qdiv = (a, b) => qmul(a, qinv(b));
  const qsub = (a, b) => qadd(a, qneg(b));
  const qeq = (a, b) => a[0] === b[0] && a[1] === b[1];
  const qzero = a => a[0] === 0;
  const qnum = a => a[0] / a[1];
  const qabs = a => [Math.abs(a[0]), a[1]];
  const qsgn = a => Math.sign(a[0]);
  const qint = a => a[1] === 1;
  function qpow(a, n) { let r = [1, 1]; for (let i = 0; i < n; i++) r = qmul(r, a); return r; }
  const ONE = [1, 1], ZERO = [0, 1];

  // ── Polynome ───────────────────────────────────────────────────────
  const mkey = m => Object.keys(m).filter(k => m[k] > 0).sort().map(k => k + ':' + m[k]).join(',');
  const mdeg = m => Object.values(m).reduce((a, b) => a + b, 0);
  function cmpTerm(a, b) {
    const da = mdeg(a.m), db = mdeg(b.m);
    if (da !== db) return db - da;
    const vars = [...new Set([...Object.keys(a.m), ...Object.keys(b.m)])].sort();
    for (const v of vars) { const ea = a.m[v] || 0, eb = b.m[v] || 0; if (ea !== eb) return eb - ea; }
    return 0;
  }
  function pNorm(list) {
    const mp = new Map();
    for (const t of list) {
      const m = {}; Object.keys(t.m).forEach(k => { if (t.m[k] > 0) m[k] = t.m[k]; });
      const k = mkey(m);
      if (mp.has(k)) { const e = mp.get(k); e.c = qadd(e.c, t.c); } else mp.set(k, { c: t.c, m });
    }
    const out = [...mp.values()].filter(t => !qzero(t.c));
    out.sort(cmpTerm);
    return out;
  }
  const pConst = c => pNorm([{ c, m: {} }]);
  const pVar = v => pNorm([{ c: ONE, m: { [v]: 1 } }]);
  const pAdd = (a, b) => pNorm(a.concat(b));
  const pNeg = a => a.map(t => ({ c: qneg(t.c), m: t.m }));
  const pSub = (a, b) => pAdd(a, pNeg(b));
  function pMul(a, b) {
    if (a.length * b.length > 4000) fail('Term zu gross');
    const out = [];
    for (const s of a) for (const t of b) {
      const m = Object.assign({}, s.m); Object.keys(t.m).forEach(k => { m[k] = (m[k] || 0) + t.m[k]; });
      out.push({ c: qmul(s.c, t.c), m });
    }
    return pNorm(out);
  }
  function pPow(a, n) { let r = pConst(ONE); for (let i = 0; i < n; i++) r = pMul(r, a); return r; }
  const pScale = (a, c) => pNorm(a.map(t => ({ c: qmul(t.c, c), m: t.m })));
  const pEq = (a, b) => a.length === b.length && a.every((t, i) => qeq(t.c, b[i].c) && mkey(t.m) === mkey(b[i].m));
  const pIsConst = a => a.every(t => mdeg(t.m) === 0);
  const pVars = a => [...new Set(a.flatMap(t => Object.keys(t.m)))].sort();
  const pDegree = (a, v) => a.reduce((mx, t) => Math.max(mx, v ? (t.m[v] || 0) : mdeg(t.m)), 0);
  function pEval(a, vals) {
    let s = 0;
    for (const t of a) { let r = qnum(t.c); for (const k of Object.keys(t.m)) r *= Math.pow(vals && vals[k] !== undefined ? vals[k] : 1, t.m[k]); s += r; }
    return s;
  }
  const pOne = pConst(ONE);

  // ── Schreibweise ───────────────────────────────────────────────────
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const sup = n => String(n).split('').map(c => SUP[c] || c).join('');
  function qTex(a) { const s = a[0] < 0 ? '-' : ''; return a[1] === 1 ? s + Math.abs(a[0]) : s + '\\frac{' + Math.abs(a[0]) + '}{' + a[1] + '}'; }
  function qTxt(a) { const s = a[0] < 0 ? '−' : ''; return a[1] === 1 ? s + Math.abs(a[0]) : s + Math.abs(a[0]) + '/' + a[1]; }
  function varsTex(m) { return Object.keys(m).sort().map(k => k + (m[k] > 1 ? '^{' + m[k] + '}' : '')).join(''); }
  function varsTxt(m) { return Object.keys(m).sort().map(k => k + (m[k] > 1 ? sup(m[k]) : '')).join(''); }
  function termMag(t, tex) {
    const vs = tex ? varsTex(t.m) : varsTxt(t.m), c = qabs(t.c);
    if (!vs) return tex ? qTex(c) : qTxt(c);
    if (qeq(c, ONE)) return vs;
    if (c[1] !== 1) return (tex ? qTex(c) : '(' + qTxt(c) + ')') + vs;
    return c[0] + vs;
  }
  function termStr(t, first, tex) {
    const neg = t.c[0] < 0, mag = termMag(t, tex);
    if (first) return (neg ? (tex ? '-' : '−') : '') + mag;
    return (tex ? (neg ? ' - ' : ' + ') : (neg ? ' − ' : ' + ')) + mag;
  }
  const polyTex = p => p.length ? p.map((t, i) => termStr(t, i === 0, true)).join('') : '0';
  const polyTxt = p => p.length ? p.map((t, i) => termStr(t, i === 0, false)).join('') : '0';
  const isSimpleTerm = t => qeq(qabs(t.c), ONE) && Object.keys(t.m).length === 1 && Object.values(t.m)[0] === 1;
  // Term als Faktor/Basis: bei Bedarf in Klammern
  function termParTex(t) {
    const mag = termMag(Object.assign({}, t, { c: qabs(t.c) }), true);
    const simple = isSimpleTerm(t) || (Object.keys(t.m).length === 0 && qint(t.c));
    return simple ? mag : '(' + mag + ')';
  }

  // ── Eingabe lesen ──────────────────────────────────────────────────
  function tokenize(src) {
    let s = String(src == null ? '' : src)
      .replace(/[−–—]/g, '-').replace(/[·×⋅]/g, '*').replace(/\\cdot/g, '*')
      .replace(/²/g, '^2').replace(/³/g, '^3').replace(/\s+/g, '');
    if (/sin|cos|tan|cot|sqrt|root|log|exp|ln(?=\()/i.test(s)) fail('Funktionen wie sin, sqrt oder log gibt es in dieser Darstellung nicht – Wurzeln und Logarithmen haben eigene Darstellungen.');
    const toks = []; let i = 0;
    while (i < s.length) {
      const rest = s.slice(i);
      let m = /^\d+(?:[.,]\d+)?/.exec(rest);
      if (m) { toks.push({ t: 'num', v: m[0].replace(',', '.') }); i += m[0].length; continue; }
      m = /^[A-Za-z]/.exec(rest);
      if (m) { toks.push({ t: 'id', v: m[0] }); i++; continue; }
      if ('+-*/^()'.indexOf(s[i]) >= 0) { toks.push({ t: 'op', v: s[i] }); i++; continue; }
      fail('Unbekanntes Zeichen «' + s[i] + '»');
    }
    return toks;
  }
  function decimalToQ(str) {
    const [a, b] = str.split('.');
    if (!b) return q(parseInt(a, 10));
    return q(parseInt(a + b, 10), Math.pow(10, b.length));
  }
  function parse(src) {
    const toks = tokenize(src); let pos = 0;
    const peek = () => toks[pos];
    const isOp = v => peek() && peek().t === 'op' && peek().v === v;
    function expr() {
      const items = []; let sign = 1;
      if (isOp('-')) { pos++; sign = -1; } else if (isOp('+')) pos++;
      let t = term(); items.push(sign < 0 ? { t: 'neg', a: t } : t);
      while (isOp('+') || isOp('-')) {
        const neg = peek().v === '-'; pos++;
        t = term(); items.push(neg ? { t: 'neg', a: t } : t);
      }
      return items.length === 1 ? items[0] : { t: 'add', a: items };
    }
    function startsPrimary() { const k = peek(); return k && (k.t === 'num' || k.t === 'id' || (k.t === 'op' && k.v === '(')); }
    function term() {
      const parts = [unary()];
      for (;;) {
        if (isOp('*')) { pos++; parts.push(unary()); }
        else if (isOp('/')) {
          pos++; const d = unary(); const dp = evalAst(d);
          if (!dp.length || !pIsConst(dp)) fail('Durch Terme mit Variablen wird hier nicht geteilt');
          parts.push({ t: 'num', v: qinv(dp[0].c) });
        } else if (startsPrimary()) parts.push(power());
        else break;
      }
      return parts.length === 1 ? parts[0] : { t: 'mul', a: parts };
    }
    function unary() {
      if (isOp('-')) { pos++; return { t: 'neg', a: unary() }; }
      if (isOp('+')) { pos++; return unary(); }
      return power();
    }
    function power() {
      const b = primary();
      if (isOp('^')) {
        pos++;
        let n;
        if (isOp('(')) { pos++; const e = expr(); if (!isOp(')')) fail('Klammer fehlt'); pos++; const ep = evalAst(e); if (!ep.length || !pIsConst(ep) || !qint(ep[0].c)) fail('Exponent muss eine ganze Zahl sein'); n = ep[0].c[0]; }
        else { let neg = false; if (isOp('-')) { pos++; neg = true; } const k = peek(); if (!k || k.t !== 'num' || k.v.indexOf('.') >= 0) fail('Exponent muss eine ganze Zahl sein'); pos++; n = parseInt(k.v, 10) * (neg ? -1 : 1); }
        if (n < 0) fail('Nur Exponenten ≥ 0');
        if (n > 20) fail('Exponent zu gross');
        return { t: 'pow', a: b, n };
      }
      return b;
    }
    function primary() {
      const k = peek();
      if (!k) fail('Term unvollständig');
      if (k.t === 'num') { pos++; return { t: 'num', v: decimalToQ(k.v) }; }
      if (k.t === 'id') { pos++; return { t: 'var', n: k.v }; }
      if (isOp('(')) { pos++; const e = expr(); if (!isOp(')')) fail('Klammer fehlt'); pos++; return { t: 'paren', a: e }; }
      fail('Unerwartetes Zeichen «' + k.v + '»');
    }
    if (!toks.length) fail('Bitte einen Term eingeben');
    const e = expr();
    if (pos < toks.length) fail('Unerwartetes Zeichen «' + toks[pos].v + '»');
    return e;
  }
  function evalAst(n) {
    switch (n.t) {
      case 'num': return pConst(n.v);
      case 'var': return pVar(n.n);
      case 'paren': return evalAst(n.a);
      case 'neg': return pNeg(evalAst(n.a));
      case 'add': return n.a.map(evalAst).reduce(pAdd, []);
      case 'mul': return n.a.map(evalAst).reduce(pMul, pOne);
      case 'pow': return pPow(evalAst(n.a), n.n);
    }
    fail('Unbekannter Knoten');
  }
  const parsePoly = src => evalAst(parse(src));

  // ── Aufbau des Terms erkennen ──────────────────────────────────────
  // Zerlegt in Vorfaktor (Monom) und Summen-Faktoren. pw = {p, n}, falls der ganze Term (Summe)^n ist.
  function structure(ast) {
    const st = { mono: pOne, sums: [], zero: false };
    function flat(n) {
      switch (n.t) {
        case 'paren': flat(n.a); return;
        case 'num': st.mono = pMul(st.mono, pConst(n.v)); return;
        case 'neg': st.mono = pScale(st.mono, q(-1)); flat(n.a); return;
        case 'mul': n.a.forEach(flat); return;
        case 'pow': {
          const bp = evalAst(n.a);
          if (bp.length > 1 && n.n >= 1) { for (let i = 0; i < n.n; i++) st.sums.push(bp); st.pwBase = bp; st.pwN = n.n; return; }
          st.mono = pMul(st.mono, evalAst(n)); return;
        }
        default: {
          const p = evalAst(n);
          if (p.length === 0) st.zero = true;
          else if (p.length === 1) st.mono = pMul(st.mono, p);
          else st.sums.push(p);
        }
      }
    }
    flat(ast);
    const res = { pre: st.mono, sums: st.sums, zero: st.zero };
    const isOneMono = pEq(st.mono, pOne);
    if (st.pwBase && st.sums.length === st.pwN && isOneMono) res.pw = { p: st.pwBase, n: st.pwN };
    return res;
  }
  // (U+V)(U−V)? Gibt {u, v} (Glieder) zurück
  function diffOfSquaresPair(F, G) {
    if (F.length !== 2 || G.length !== 2) return null;
    for (const [u, v] of [[F[0], F[1]], [F[1], F[0]]]) {
      const ok1 = G.some(t => mkey(t.m) === mkey(u.m) && qeq(t.c, u.c));
      const ok2 = G.some(t => mkey(t.m) === mkey(v.m) && qeq(t.c, qneg(v.c)));
      if (ok1 && ok2) return { u, v };
      const n1 = G.some(t => mkey(t.m) === mkey(u.m) && qeq(t.c, qneg(u.c)));
      const n2 = G.some(t => mkey(t.m) === mkey(v.m) && qeq(t.c, v.c));
      if (n1 && n2) return { u: v, v: u, flip: true };
    }
    return null;
  }

  // ── Teilschritte für Ausmultiplizieren ────────────────────────────
  const tmul = (s, t) => { const m = Object.assign({}, s.m); Object.keys(t.m).forEach(k => { m[k] = (m[k] || 0) + t.m[k]; }); return { c: qmul(s.c, t.c), m }; };
  const tpos = t => ({ c: qabs(t.c), m: t.m });
  function binom(n, k) { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); }
  function pascalRow(n) { const r = []; for (let k = 0; k <= n; k++) r.push(binom(n, k)); return r; }
  const sgnTex = neg => (neg ? ' - ' : ' + ');
  // Summe mehrerer Teilprodukte, jedes als {neg, tex}
  function joinSigned(parts) { return parts.map((p, i) => (i === 0 ? (p.neg ? '-' : '') : sgnTex(p.neg)) + p.tex).join(''); }

  // Verteilungsschritt: jedes Glied von F mit jedem von G (Reihenfolge Zeile für Zeile)
  function distribStep(F, G) {
    const parts = [];
    F.forEach(s => G.forEach(t => { const neg = (s.c[0] < 0) !== (t.c[0] < 0); parts.push({ neg, tex: termParTex(s) + '\\cdot ' + termParTex(t) }); }));
    return joinSigned(parts);
  }

  function expandInfo(src) {
    const ast = parse(src);
    const result = evalAst(ast);
    const S = structure(ast);
    const info = { result, steps: [], kind: 'none', factors: [], pre: S.pre, pw: S.pw || null };
    if (S.zero) { info.kind = 'none'; return info; }
    const L = [];
    if (!pEq(S.pre, pOne)) L.push(S.pre);
    S.sums.forEach(p => L.push(p));
    info.factors = L;
    const srcTex = L.map(p => p.length > 1 ? '(' + polyTex(p) + ')' : polyTex(p)).join('');
    info.srcTex = S.pw ? '(' + polyTex(S.pw.p) + ')^{' + S.pw.n + '}' : srcTex;
    const R = polyTex(result);
    if (L.length <= 1 && !(S.pw)) { info.kind = 'none'; return info; }

    if (L.length === 2 && pEq(L[0], L[1]) && L[0].length >= 2) {
      info.kind = 'sq';
      const A = L[0];
      if (A.length === 2) {
        let a = A[0], b = A[1];
        if (a.c[0] < 0) { a = { c: qneg(a.c), m: a.m }; b = { c: qneg(b.c), m: b.m }; }
        const neg = b.c[0] < 0; b = tpos(b);
        info.sq = { a, b, neg };
        const aT = termParTex(a), bT = termParTex(b);
        info.steps.push({ label: neg ? 'Zweite binomische Formel' : 'Erste binomische Formel', tex: neg ? '(a-b)^2 = a^2 - 2ab + b^2' : '(a+b)^2 = a^2 + 2ab + b^2' });
        const plainAB = isSimpleTerm(a) && isSimpleTerm(b);
        if (!plainAB) info.steps.push({ label: 'Wähle', tex: 'a = ' + termMag(a, true) + ',\\quad b = ' + termMag(b, true) });
        if (!plainAB) info.steps.push({ label: 'Einsetzen', tex: '(' + aT.replace(/^\((.*)\)$/, '$1') + (neg ? ' - ' : ' + ') + bT.replace(/^\((.*)\)$/, '$1') + ')^2 = ' + aT + '^{2}' + (neg ? ' - ' : ' + ') + '2\\cdot ' + aT + '\\cdot ' + bT + ' + ' + bT + '^{2}' });
        info.steps.push({ label: 'Ausrechnen', tex: R });
      } else {
        info.steps.push({ label: 'Jedes Glied mit jedem multiplizieren', tex: srcTex + ' = ' + distribStep(A, A) });
        info.steps.push({ label: 'Zusammenfassen', tex: R });
      }
    } else if (L.length === 2 && diffOfSquaresPair(L[0], L[1])) {
      info.kind = 'diffsq';
      const d = diffOfSquaresPair(L[0], L[1]);
      info.ds = { u: tpos(d.u), v: tpos(d.v), flip: !!d.flip };
      const uT = termParTex(tpos(d.u)), vT = termParTex(tpos(d.v));
      info.steps.push({ label: 'Dritte binomische Formel', tex: '(a+b)(a-b) = a^2 - b^2' });
      if (!(isSimpleTerm(tpos(d.u)) && isSimpleTerm(tpos(d.v)))) {
        info.steps.push({ label: 'Wähle', tex: 'a = ' + termMag(tpos(d.u), true) + ',\\quad b = ' + termMag(tpos(d.v), true) });
        info.steps.push({ label: 'Einsetzen', tex: srcTex + ' = ' + uT + '^{2} - ' + vT + '^{2}' });
      }
      info.steps.push({ label: 'Ausrechnen', tex: R });
    } else if (L.length === 2) {
      info.kind = 'prod';
      info.steps.push({ label: 'Jedes Glied der ersten Klammer mit jedem der zweiten multiplizieren', tex: srcTex + ' = ' + distribStep(L[0], L[1]) });
      info.steps.push({ label: 'Zusammenfassen', tex: R });
    } else if (L.length === 3 && pEq(L[0], L[1]) && pEq(L[1], L[2]) && L[0].length === 2) {
      info.kind = 'cube';
      let a = L[0][0], b = L[0][1];
      if (a.c[0] < 0) { a = { c: qneg(a.c), m: a.m }; b = { c: qneg(b.c), m: b.m }; }
      const neg = b.c[0] < 0; b = tpos(b);
      info.sq = { a, b, neg };
      const aT = termParTex(a), bT = termParTex(b), sg = neg ? ' - ' : ' + ';
      info.steps.push({ label: neg ? 'Binomische Formel für die dritte Potenz' : 'Binomische Formel für die dritte Potenz', tex: neg ? '(a-b)^3 = a^3 - 3a^2b + 3ab^2 - b^3' : '(a+b)^3 = a^3 + 3a^2b + 3ab^2 + b^3' });
      const plain3 = isSimpleTerm(a) && isSimpleTerm(b);
      if (!plain3) info.steps.push({ label: 'Wähle', tex: 'a = ' + termMag(a, true) + ',\\quad b = ' + termMag(b, true) });
      if (!plain3) info.steps.push({ label: 'Einsetzen', tex: aT + '^{3}' + sg + '3\\cdot ' + aT + '^{2}\\cdot ' + bT + (neg ? ' + ' : ' + ') + '3\\cdot ' + aT + '\\cdot ' + bT + '^{2}' + sg + bT + '^{3}' });
      info.steps.push({ label: 'Ausrechnen', tex: R });
    } else {
      info.kind = L.length >= 3 ? 'multi' : 'none';
      if (L.length >= 3) {
        let acc = L[0]; let accTex = L[0].length > 1 ? '(' + polyTex(L[0]) + ')' : polyTex(L[0]);
        for (let i = 1; i < L.length; i++) {
          const nxt = pMul(acc, L[i]);
          info.steps.push({ label: i === 1 ? 'Zuerst die ersten beiden Faktoren ausmultiplizieren' : 'Dann mit dem nächsten Faktor multiplizieren', tex: accTex + '\\cdot (' + polyTex(L[i]) + ') = ' + polyTex(nxt) });
          acc = nxt; accTex = '(' + polyTex(nxt) + ')';
        }
      }
    }
    // Binomischer Lehrsatz-Zusatz für (A+B)^n
    if (S.pw && S.pw.p.length === 2 && S.pw.n >= 2) info.binomN = S.pw.n;
    return info;
  }

  // ── Faktorisieren ──────────────────────────────────────────────────
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function content(p) { // positiver rationaler gemeinsamer Teiler der Koeffizienten
    let L = 1, G = 0;
    p.forEach(t => { L = lcm(L, t.c[1]); });
    p.forEach(t => { G = gcd(G, t.c[0] * (L / t.c[1])); });
    return q(G, L);
  }
  function monoGcd(p) {
    const m = {};
    const vars = pVars(p);
    vars.forEach(v => { m[v] = Math.min(...p.map(t => t.m[v] || 0)); });
    Object.keys(m).forEach(k => { if (!m[k]) delete m[k]; });
    return m;
  }
  function pDivMono(p, m) { return pNorm(p.map(t => { const mm = Object.assign({}, t.m); Object.keys(m).forEach(k => { mm[k] -= m[k]; }); return { c: t.c, m: mm }; })); }
  const isSqQ = c => { const n = Math.round(Math.sqrt(c[0])), d = Math.round(Math.sqrt(c[1])); return c[0] >= 0 && n * n === c[0] && d * d === c[1] ? q(n, d) : null; };
  function sqrtTerm(t) { // t = u² mit positivem Koeffizienten?
    if (t.c[0] < 0) return null;
    const r = isSqQ(t.c); if (!r) return null;
    const m = {}; for (const k of Object.keys(t.m)) { if (t.m[k] % 2) return null; m[k] = t.m[k] / 2; }
    return { c: r, m };
  }
  // Univariat: Koeffizientenliste [c0, c1, …] aus Polynom in Variable v
  function uniCoeffs(p, v) {
    const dg = pDegree(p, v), co = new Array(dg + 1).fill(null).map(() => ZERO);
    for (const t of p) { if (Object.keys(t.m).some(k => k !== v)) return null; co[t.m[v] || 0] = qadd(co[t.m[v] || 0], t.c); }
    return co;
  }
  function fromUni(co, v) { return pNorm(co.map((c, i) => ({ c, m: i ? { [v]: i } : {} }))); }
  // Rationale Nullstellen eines ganzzahligen Polynoms (Liste aufsteigend), Satz über rationale Nullstellen
  function intDivisors(n) { n = Math.abs(n); const out = []; for (let i = 1; i * i <= n; i++) if (n % i === 0) { out.push(i); if (i * i !== n) out.push(n / i); } return out; }
  function findRationalRoot(co) {
    // auf ganze Koeffizienten bringen
    let L = 1; co.forEach(c => { L = lcm(L, c[1]); });
    const ic = co.map(c => c[0] * (L / c[1]));
    let lo = 0; while (lo < ic.length && ic[lo] === 0) lo++;
    if (lo > 0) return ZERO;
    const a0 = ic[0], an = ic[ic.length - 1];
    if (Math.abs(a0) > 1e9 || Math.abs(an) > 1e9) return null;
    const n = ic.length - 1, big = ic.map(c => BigInt(c));
    for (const pp of intDivisors(a0)) for (const qq of intDivisors(an)) {
      if (gcd(pp, qq) !== 1) continue;
      for (const sg of [1, -1]) {            // exakte Probe mit BigInt: Σ c_i · p^i · q^(n−i) = 0 (kein Überlaufen)
        const P = BigInt(sg * pp), Q = BigInt(qq); let sum = 0n;
        for (let i = 0; i <= n; i++) sum += big[i] * P ** BigInt(i) * Q ** BigInt(n - i);
        if (sum === 0n) return q(sg * pp, qq);
      }
    }
    return null;
  }
  function divLinearUni(co, r) { // (co) / (x − r)
    const n = co.length - 1, out = new Array(n); let carry = ZERO;
    for (let i = n; i >= 1; i--) { carry = qadd(co[i], qmul(carry, r)); out[i - 1] = carry; }
    return out;
  }
  // Ganzzahliger quadratischer Faktor a·x² + u·x + v eines Polynoms vom Grad ≥ 4 (ohne rationale Nullstelle); [v, u, a] und Quotient oder null
  function findQuadFactor(co) {
    let L = 1; co.forEach(c => { L = lcm(L, c[1]); });
    const ic = co.map(c => c[0] * (L / c[1]));
    const n = ic.length - 1, a0 = ic[0], an = ic[n];
    if (!a0 || !an || Math.abs(a0) > 1e6 || Math.abs(an) > 1e6) return null;
    const U = Math.min(300, 2 * ic.reduce((t, c) => t + Math.abs(c), 0));
    for (const a of intDivisors(an)) for (const vv of intDivisors(a0)) for (const sg of [1, -1]) {
      const v = sg * vv;
      for (let u = -U; u <= U; u++) {
        if (gcd(gcd(a, u), v) !== 1) continue;
        const r = ic.slice(), Q = new Array(n - 1); let good = true;
        for (let i = n; i >= 2; i--) {
          if (r[i] % a !== 0) { good = false; break; }
          const qi = r[i] / a; Q[i - 2] = qi;
          r[i - 1] -= qi * u; r[i - 2] -= qi * v;
          if (Math.abs(r[i - 1]) > 1e12 || Math.abs(r[i - 2]) > 1e12) { good = false; break; }
        }
        if (good && r[0] === 0 && r[1] === 0) return { g: [q(v), q(u), q(a)], quo: Q.map(x => q(x, L)) };
      }
    }
    return null;
  }
  // Ist p (1 oder 3 Glieder) das Quadrat eines Binoms/Monoms? → Basis oder null
  function squareBase(sub) {
    if (sub.length === 1) { const u = sqrtTerm(sub[0]); return u ? pNorm([u]) : null; }
    if (sub.length !== 3) return null;
    for (let i = 0; i < 3; i++) {
      const mid = sub[i], o = sub.filter((_, j) => j !== i);
      const u = sqrtTerm(o[0]), v = sqrtTerm(o[1]);
      if (!u || !v) continue;
      const prod = tmul(u, v), twice = { c: qmul(prod.c, q(2)), m: prod.m };
      if (mkey(twice.m) === mkey(mid.m) && qeq(qabs(mid.c), twice.c)) return pNorm([u, mid.c[0] > 0 ? v : { c: qneg(v.c), m: v.m }]);
    }
    return null;
  }
  // Zerlegt p in Faktoren. Gibt den Zahlenfaktor m zurück, sodass p = m · ∏ fac. Hängt Faktoren {p, e} an fac an.
  function splitRec(p, fac, notes, depth) {
    depth = depth || 0;
    if (!p.length) return ZERO;
    if (pIsConst(p)) return p[0].c;
    if (p.length === 1 || depth > 6) { fac.push({ p, e: 1 }); return ONE; }
    // Differenz zweier Quadrate
    if (p.length === 2) {
      const [s, t] = p[0].c[0] > 0 ? [p[0], p[1]] : [p[1], p[0]];
      if (s.c[0] > 0 && t.c[0] < 0) {
        const u = sqrtTerm(s), v = sqrtTerm({ c: qneg(t.c), m: t.m });
        if (u && v) {
          notes.push('diffsq');
          const m1 = splitRec(pNorm([u, v]), fac, notes, depth + 1);
          const m2 = splitRec(pNorm([u, { c: qneg(v.c), m: v.m }]), fac, notes, depth + 1);
          return qmul(m1, m2);
        }
      }
    }
    // Vollständiges Quadrat mit drei Gliedern
    if (p.length === 3) {
      for (let i = 0; i < 3; i++) {
        const mid = p[i], o = p.filter((_, j) => j !== i);
        const u = sqrtTerm(o[0]), v = sqrtTerm(o[1]);
        if (u && v) {
          const prod = tmul(u, v);
          const twice = { c: qmul(prod.c, q(2)), m: prod.m };
          if (mkey(twice.m) === mkey(mid.m) && qeq(qabs(mid.c), twice.c)) {
            notes.push(mid.c[0] > 0 ? 'sqplus' : 'sqminus');
            const base = pNorm([u, mid.c[0] > 0 ? v : { c: qneg(v.c), m: v.m }]);
            const sub = []; const m1 = splitRec(base, sub, notes, depth + 1);
            sub.forEach(f => fac.push({ p: f.p, e: f.e * 2 }));
            return qmul(m1, m1);
          }
        }
      }
    }
    // Quadrat abspalten: A² − B² mit mehrgliedrigem A (z. B. a² − 2ab + b² − c²)
    if (p.length >= 4 && p.length <= 7) {
      const idx = p.map((_, i) => i), n = p.length;
      const combos = [];
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) combos.push([i, j, k]);
      for (const cb of combos) {
        const S = cb.map(i => p[i]), R = idx.filter(i => !cb.includes(i)).map(i => p[i]);
        if (R.length !== 1 && R.length !== 3) continue;
        const neg = L => L.map(t => ({ c: qneg(t.c), m: t.m }));
        let A = squareBase(S), B = A ? squareBase(neg(R)) : null;
        if (!(A && B)) { B = squareBase(neg(S)); A = B ? squareBase(R) : null; }
        if (A && B) {
          notes.push('sqdiffgrp');
          const m1 = splitRec(pAdd(A, pNeg(B)), fac, notes, depth + 1);
          const m2 = splitRec(pAdd(A, B), fac, notes, depth + 1);
          return qmul(m1, m2);
        }
      }
    }
    // Eine Variable (oder zwei, homogen): rationale Nullstellen
    const vars = pVars(p);
    if (vars.length === 1 || (vars.length === 2 && isHomogeneous(p))) {
      const v = vars[0], w = vars.length === 2 ? vars[1] : null;
      const tmp = w ? pNorm(p.map(t => { const m = Object.assign({}, t.m); delete m[w]; return { c: t.c, m }; })) : p;
      const co0 = uniCoeffs(tmp, v);
      if (co0 && co0.length > 2 && co0.length <= 9) {
        let co = co0; const roots = [];
        for (let guard = 0; guard < 8 && co.length > 1; guard++) {
          const r = findRationalRoot(co); if (r === null) break;
          roots.push(r); co = divLinearUni(co, r);
        }
        if (!roots.length && co.length >= 5) {
          const fq = findQuadFactor(co);
          if (fq) {
            notes.push('quadfac');
            let G = fromUni(fq.g, v), H = fromUni(fq.quo, v);
            if (w) { G = homogenize(G, v, w); H = homogenize(H, v, w); }
            const cg = content(G), ch = content(H);
            let Gp = pScale(G, qinv(cg)), Hp = pScale(H, qinv(ch)), sg = ONE;
            if (Gp[0].c[0] < 0) { Gp = pNeg(Gp); sg = qneg(sg); }
            if (Hp[0].c[0] < 0) { Hp = pNeg(Hp); sg = qneg(sg); }
            return qmul(qmul(cg, ch), qmul(sg, qmul(splitRec(Gp, fac, notes, depth + 1), splitRec(Hp, fac, notes, depth + 1))));
          }
        }
        if (roots.length) {
          notes.push(co0.length === 3 ? 'quad' : 'roots');
          let m = ONE;
          roots.forEach(r => {
            const lin = w ? pNorm([{ c: q(r[1]), m: { [v]: 1 } }, { c: q(-r[0]), m: { [w]: 1 } }]) : pNorm([{ c: q(r[1]), m: { [v]: 1 } }, { c: q(-r[0]), m: {} }]);
            fac.push({ p: lin, e: 1 }); m = qmul(m, q(1, r[1]));
          });
          if (co.length > 1) {
            let R = fromUni(co, v); if (w) R = homogenize(R, v, w);
            const cr = content(R); let Rp = pScale(R, qinv(cr)); let sg = ONE;
            if (Rp[0].c[0] < 0) { Rp = pNeg(Rp); sg = q(-1); }
            m = qmul(m, qmul(cr, sg));
            m = qmul(m, splitRec(Rp, fac, notes, depth + 1));
          } else m = qmul(m, co[0]);
          return m;
        }
      }
    }
    fac.push({ p, e: 1 });
    return ONE;
  }
  function isHomogeneous(p) { const d = mdeg(p[0].m); return p.every(t => mdeg(t.m) === d); }
  function homogenize(pu, v, w) { const d = pDegree(pu, v); return pNorm(pu.map(t => { const m = Object.assign({}, t.m); const e = m[v] || 0; if (d - e > 0) m[w] = d - e; return { c: t.c, m }; })); }

  function factorPolyEx(p) {
    if (!p.length) return { k: ZERO, fac: [], notes: [], ok: true };
    const notes = [];
    let k = ONE; const fac = [];
    const cont = content(p);
    let rest = pScale(p, qinv(cont));
    if (rest[0].c[0] < 0 && rest.length > 1) { rest = pNeg(rest); k = qneg(k); }
    k = qmul(k, cont);
    const mg = monoGcd(rest);
    let gcfNote = false;
    if (Object.keys(mg).length) { rest = pDivMono(rest, mg); Object.keys(mg).sort().forEach(v => fac.push({ p: pVar(v), e: mg[v] })); gcfNote = true; }
    else if (!qeq(cont, ONE) && rest.length > 1) gcfNote = true;
    if (gcfNote) notes.push('gcf');
    const sub = [];
    k = qmul(k, splitRec(rest, sub, notes, 0));
    sub.forEach(f => fac.push(f));
    const merged = [];
    fac.forEach(f => { const o = merged.find(g => pEq(g.p, f.p)); if (o) o.e += f.e; else merged.push({ p: f.p, e: f.e }); });
    merged.sort((a, b) => pDegree(a.p) - pDegree(b.p) || cmpTerm(a.p[0], b.p[0]));
    merged.forEach(f => { if (f.p.length > 1 && f.p[0].c[0] < 0) { f.p = pNeg(f.p); if (f.e % 2) k = qneg(k); } });
    let prod = pConst(k); merged.forEach(f => { prod = pMul(prod, pPow(f.p, f.e)); });
    return { k, fac: merged, notes, ok: pEq(prod, p) };
  }

  function factorTex(info) {
    const parts = [];
    const k = info.k;
    const facs = info.fac.map(f => {
      const base = f.p.length > 1 ? '(' + polyTex(f.p) + ')' : polyTex(f.p);
      return base + (f.e > 1 ? '^{' + f.e + '}' : '');
    });
    let s = facs.join('');
    if (!qeq(k, ONE)) {
      if (qeq(k, q(-1))) s = '-' + (s || '1');
      else s = qTex(k) + (s.startsWith('(') || !s ? '' : '') + (s || '');
    }
    return s || '1';
  }

  function factorTxt(info) {
    const k = info.k;
    const facs = info.fac.map(f => (f.p.length > 1 ? '(' + polyTxt(f.p) + ')' : polyTxt(f.p)) + (f.e > 1 ? sup(f.e) : ''));
    let s = facs.join('');
    if (qeq(k, q(-1))) s = '−' + (s || '1');
    else if (!qeq(k, ONE)) s = (k[1] === 1 ? qTxt(k) : '(' + qTxt(k) + ')') + s;
    return s || '1';
  }

  // Schritte zum Faktorisieren
  function factorSteps(p) {
    const info = factorPolyEx(p);
    const steps = [];
    if (!info.ok) return { info, steps, irreducible: true };
    const nonTrivial = !(info.fac.length === 1 && info.fac[0].e === 1 && qeq(info.k, ONE)) && !(info.fac.length === 0);
    steps.push({ label: 'Gegeben', tex: polyTex(p) });
    const notes = info.notes;
    const hasGcf = notes.includes('gcf');
    const facTex = factorTex(info);
    if (hasGcf) {
      const cont = content(p), mg = monoGcd(pScale(p, qinv(cont)));
      const g = (qeq(cont, ONE) ? '' : qTex(cont)) + varsTex(mg);
      const inner = pDivMono(pScale(p, qinv(cont)), mg);
      if (g) steps.push({ label: 'Gemeinsamen Faktor ausklammern', tex: polyTex(p) + ' = ' + g + '\\,(' + polyTex(inner) + ')' });
    }
    if (notes.includes('diffsq')) steps.push({ label: 'Dritte binomische Formel rückwärts', tex: 'a^2 - b^2 = (a+b)(a-b)' });
    if (notes.includes('sqplus')) steps.push({ label: 'Erste binomische Formel rückwärts', tex: 'a^2 + 2ab + b^2 = (a+b)^2' });
    if (notes.includes('sqminus')) steps.push({ label: 'Zweite binomische Formel rückwärts', tex: 'a^2 - 2ab + b^2 = (a-b)^2' });
    if (notes.includes('quad')) {
      const lin = info.fac.filter(f => f.p.length > 1 && pDegree(f.p) === 1);
      steps.push({ label: 'Nullstellen suchen (Satz von Vieta bzw. Lösungsformel)', tex: 'x \\in \\{' + rootsTex(p) + '\\}' });
    }
    if (notes.includes('sqdiffgrp')) steps.push({ label: 'Quadrat abspalten, dann dritte binomische Formel rückwärts', tex: 'A^2 - B^2 = (A+B)(A-B)' });
    if (notes.includes('quadfac')) steps.push({ label: 'Ansatz mit quadratischen Faktoren (Koeffizientenvergleich)', tex: '(ax^2+ux+v)\\cdot(\\dots)' });
    if (notes.includes('roots')) steps.push({ label: 'Rationale Nullstellen suchen und Linearfaktoren abspalten', tex: 'x \\in \\{' + rootsTex(p) + '\\}' });
    steps.push({ label: nonTrivial ? 'Faktorisiert' : 'Nicht weiter zerlegbar', tex: polyTex(p) + (nonTrivial ? ' = ' + facTex : '') });
    return { info, steps, nonTrivial };
  }
  function rootsTex(p) {
    const vs = pVars(p); if (!vs.length) return '';
    const v = vs[0];
    let tmp = p;
    if (vs.length === 2) tmp = pNorm(p.map(t => { const m = Object.assign({}, t.m); delete m[vs[1]]; return { c: t.c, m }; }));
    const co0 = uniCoeffs(tmp, v); if (!co0) return '';
    let co = co0; const roots = [];
    for (let g = 0; g < 8 && co.length > 1; g++) { const r = findRationalRoot(co); if (r === null) break; roots.push(r); co = divLinearUni(co, r); }
    const uniq = []; roots.forEach(r => { if (!uniq.some(u => qeq(u, r))) uniq.push(r); });
    uniq.sort((a, b) => qnum(a) - qnum(b));
    return uniq.map(qTex).join(', ');
  }

  // ── Quadratische Ergänzung ────────────────────────────────────────
  function completeSquare(p) {
    const vs = pVars(p);
    if (vs.length !== 1) fail('Quadratische Ergänzung: genau eine Variable nötig, z. B. x^2 + 6x + 5');
    const v = vs[0], co = uniCoeffs(p, v);
    if (!co || co.length !== 3) fail('Quadratische Ergänzung: Term vom Grad 2 nötig, z. B. x^2 + 6x + 5');
    const a = co[2], b = co[1], c = co[0];
    const pp = qdiv(b, a), h = qdiv(pp, q(2)), h2 = qmul(h, h);
    const k = qsub(c, qmul(a, h2)); // Scheitel y
    return { v, a, b, c, p: pp, h, h2, k, S: [qneg(h), k] };
  }
  function completeSteps(cs) {
    const v = cs.v, steps = [];
    const vv = (e) => e;
    const aTex = qeq(cs.a, ONE) ? '' : qeq(cs.a, qneg(ONE)) ? '-' : qTex(cs.a);
    const pTex = (qsgn(cs.p) >= 0 ? ' + ' : ' - ') + (qeq(qabs(cs.p), ONE) ? '' : qTex(qabs(cs.p))) + v;
    const cTex = zeroOrSigned(cs.c);
    steps.push({ label: 'Gegeben', tex: polyTex(fromUniCs(cs)) });
    if (qzero(cs.b)) { steps.push({ label: 'Bereits in Scheitelform', tex: aTex + v + '^{2}' + cTex }); return steps; }
    steps.push({ label: qeq(cs.a, ONE) ? 'Quadratisches und lineares Glied zusammennehmen' : 'Den Faktor vor dem Quadrat ausklammern', tex: aTex + (aTex ? '\\left(' : '') + v + '^{2}' + pTex + (aTex ? '\\right)' : '') + cTex });
    const h2T = qTex(cs.h2);
    steps.push({ label: 'Quadratische Ergänzung: das Quadrat der halben Zahl vor der Variablen addieren und subtrahieren', tex: aTex + (aTex ? '\\left(' : '') + v + '^{2}' + pTex + ' + ' + (cs.h2[1] === 1 ? h2T : h2T) + ' - ' + h2T + (aTex ? '\\right)' : '') + cTex });
    const hSign = (qsgn(cs.h) >= 0 ? ' + ' : ' - ') + qTex(qabs(cs.h));
    steps.push({ label: 'Binomische Formel rückwärts', tex: aTex + (aTex ? '\\left(' : '') + '(' + v + hSign + ')^{2} - ' + h2T + (aTex ? '\\right)' : '') + cTex });
    const kTex = qTex(cs.k);
    steps.push({ label: 'Scheitelform', tex: aTex + '(' + v + hSign + ')^{2}' + (qzero(cs.k) ? '' : (qsgn(cs.k) >= 0 ? ' + ' : ' - ') + qTex(qabs(cs.k))) });
    steps.push({ label: 'Scheitelpunkt', tex: 'S\\left(' + qTex(qneg(cs.h)) + '\\,|\\,' + kTex + '\\right)' });
    return steps;
  }
  function fromUniCs(cs) { return fromUni([cs.c, cs.b, cs.a], cs.v); }
  function zeroOrSigned(c) { return qzero(c) ? '' : (qsgn(c) >= 0 ? ' + ' : ' - ') + qTex(qabs(c)); }

  // ── Zeichnung: Befehle ─────────────────────────────────────────────
  // Einheitenkoordinaten, y nach unten. Primitive:
  //  {k:'rect',x,y,w,h,hue,neg,dash,label,alpha}   {k:'text',x,y,s,a:'c'|'l'|'r',b:bool,dy}
  //  {k:'poly',pts,hue,neg,label,lx,ly}  {k:'line',x1,y1,x2,y2,dash}  {k:'cell' wie rect}
  const termVal = (t, vals) => { let r = qnum(qabs(t.c)); for (const k of Object.keys(t.m)) r *= Math.pow(vals && vals[k] !== undefined ? vals[k] : 1, t.m[k]); return r; };
  function hueIndex(keys) { const map = {}; let n = 0; keys.forEach(k => { if (!(k in map)) map[k] = n++ % 6; }); return map; }

  function figBox(F, G, vals, opt) {
    opt = opt || {};
    const res = opt.result || pMul(F, G);
    const hues = hueIndex(res.map(t => mkey(t.m)));
    const prims = [];
    const cw = F.map(t => Math.max(termVal(t, vals), 1e-6)), rh = G.map(t => Math.max(termVal(t, vals), 1e-6));
    const W = cw.reduce((a, b) => a + b, 0), H = rh.reduce((a, b) => a + b, 0);
    let x = 0;
    F.forEach((s, i) => {
      let y = 0;
      G.forEach((t, j) => {
        const pr = tmul(s, t), neg = pr.c[0] < 0;
        const hue = hues[mkey(pr.m)];
        const cell = { k: 'rect', x, y, w: cw[i], h: rh[j], hue: hue === undefined ? 0 : hue, neg, label: termStr(pr, true, false) };
        if (opt.cellFilter) opt.cellFilter(cell, i, j);
        prims.push(cell); y += rh[j];
      });
      x += cw[i];
    });
    x = 0;
    F.forEach((s, i) => { prims.push({ k: 'text', x: x + cw[i] / 2, y: -0.0, s: termStr(s, true, false), a: 'c', dock: 'top' }); x += cw[i]; });
    let y = 0;
    G.forEach((t, j) => { prims.push({ k: 'text', x: 0, y: y + rh[j] / 2, s: termStr(t, true, false), a: 'r', dock: 'left' }); y += rh[j]; });
    return { prims, W, H, hues };
  }

  // Kacheln (Algebra-Plättchen): nur für eine Variable und Linearfaktoren mit kleinen ganzen Zahlen
  function tileSpec(F, v) {
    const pieces = [];
    for (const t of F) {
      const ks = Object.keys(t.m);
      if (!qint(t.c)) return null;
      const n = Math.abs(t.c[0]), neg = t.c[0] < 0;
      if (ks.length === 0) { for (let i = 0; i < n; i++) pieces.push({ deg: 0, neg }); }
      else if (ks.length === 1 && ks[0] === v && t.m[v] === 1) { for (let i = 0; i < n; i++) pieces.push({ deg: 1, neg }); }
      else return null;
      if (pieces.length > 30) return null;
    }
    return pieces;
  }
  function figTiles(F, G, vals) {
    const vs = [...new Set(pVars(F).concat(pVars(G)))];
    if (vs.length > 1) return null;
    const v = vs[0] || 'x';
    const pf = tileSpec(F, v), pg = tileSpec(G, v);
    if (!pf || !pg || pf.length * pg.length > 400) return null;
    const X = vals && vals[v] !== undefined ? vals[v] : 2;
    const w = d => (d ? X : 1);
    const prims = []; let x = 0;
    pf.forEach(a => {
      let y = 0;
      pg.forEach(b => {
        const neg = a.neg !== b.neg, deg = a.deg + b.deg;
        prims.push({ k: 'rect', x, y, w: w(a.deg), h: w(b.deg), hue: deg === 2 ? 0 : deg === 1 ? 1 : 2, neg, tile: true, label: deg === 2 ? v + '²' : deg === 1 ? v : '1' });
        y += w(b.deg);
      });
      x += w(a.deg);
    });
    const W = pf.reduce((s, a) => s + w(a.deg), 0), H = pg.reduce((s, b) => s + w(b.deg), 0);
    // Beschriftung der Seiten: Gruppen
    x = 0;
    F.forEach(t => { const n = Math.abs(qnum(t.c)); const len = (Object.keys(t.m).length ? X : 1) * n; prims.push({ k: 'text', x: x + len / 2, y: 0, s: termStr(t, true, false), a: 'c', dock: 'top' }); x += len; });
    let y = 0;
    G.forEach(t => { const n = Math.abs(qnum(t.c)); const len = (Object.keys(t.m).length ? X : 1) * n; prims.push({ k: 'text', x: 0, y: y + len / 2, s: termStr(t, true, false), a: 'r', dock: 'left' }); y += len; });
    return { prims, W, H, tiles: true };
  }

  // (a−b)² als Quadrat mit abgeschnittenem Rand: zwei volle Streifen a·b werden abgezogen, das Eckquadrat b² dabei doppelt
  function figSubSquare(aT, bT, vals) {
    const av = termVal(aT, vals), bv = termVal(bT, vals);
    const big = av >= bv ? aT : bT, small = av >= bv ? bT : aT;
    const M = Math.max(av, bv), m = Math.min(av, bv), r = M - m;
    const bigS = termStr(tpos(big), true, false), smallS = termStr(tpos(small), true, false);
    const ab = termStr(tmul(tpos(big), tpos(small)), true, false), bb = termStr(tmul(tpos(small), tpos(small)), true, false);
    const prims = [];
    prims.push({ k: 'rect', x: 0, y: 0, w: r, h: r, hue: 3, neg: false, label: '(' + bigS + ' − ' + smallS + ')²' });
    prims.push({ k: 'rect', x: r, y: 0, w: m, h: M, hue: 0, neg: true, label: ab, lbox: [r, 0, m, r] });
    prims.push({ k: 'rect', x: 0, y: r, w: M, h: m, hue: 0, neg: true, label: ab, lbox: [0, r, r, m] });
    prims.push({ k: 'rect', x: r, y: r, w: m, h: m, hue: 1, neg: true, over: true, label: bb });
    prims.push({ k: 'rect', x: 0, y: 0, w: M, h: M, outline: true });
    prims.push({ k: 'text', x: M / 2, y: 0, s: bigS, a: 'c', dock: 'top' });
    prims.push({ k: 'text', x: 0, y: M / 2, s: bigS, a: 'r', dock: 'left' });
    prims.push({ k: 'text', x: M, y: r + m / 2, s: smallS, a: 'l', dock: 'right' });
    prims.push({ k: 'text', x: r + m / 2, y: M, s: smallS, a: 'c', dock: 'bottom' });
    return { prims, W: M, H: M, bigS, smallS };
  }

  // (a+b)(a−b) = a² − b²: L-Form und Rechteck
  function figDiffSquares(uT, vT, vals) {
    const av = termVal(uT, vals), bv = termVal(vT, vals);
    const neg = av < bv;
    const A = Math.max(av, bv), B = Math.min(av, bv), r = A - B;
    const big = neg ? vT : uT, small = neg ? uT : vT;
    const bigS = termStr(tpos(big), true, false), smallS = termStr(tpos(small), true, false);
    const gap = Math.max(A, 1) * 0.35;
    const prims = [];
    prims.push({ k: 'rect', x: 0, y: B, w: A, h: r, hue: 0, label: '' });
    prims.push({ k: 'rect', x: 0, y: 0, w: r, h: B, hue: 1, label: '' });
    prims.push({ k: 'rect', x: r, y: 0, w: B, h: B, hue: 2, dash: true, ghost: true, label: termStr(tmul(tpos(small), tpos(small)), true, false) });
    prims.push({ k: 'text', x: A / 2, y: A, s: bigS, a: 'c', dock: 'bottom' });
    prims.push({ k: 'text', x: 0, y: B / 2, s: smallS, a: 'r', dock: 'left' });
    prims.push({ k: 'text', x: 0, y: B + r / 2, s: bigS + ' − ' + smallS, a: 'r', dock: 'left' });
    prims.push({ k: 'text', x: r + B / 2, y: 0, s: smallS, a: 'c', dock: 'top' });
    const ox = A + gap;
    prims.push({ k: 'rect', x: ox, y: B, w: A, h: r, hue: 0, label: '' });
    prims.push({ k: 'rect', x: ox + A, y: B, w: B, h: r, hue: 1, label: '' });
    prims.push({ k: 'text', x: ox + (A + B) / 2, y: B + r, s: bigS + ' + ' + smallS, a: 'c', dock: 'bottom' });
    prims.push({ k: 'text', x: ox + A + B, y: B + r / 2, s: bigS + ' − ' + smallS, a: 'l', dock: 'right' });
    prims.push({ k: 'text', x: A + gap / 2, y: B + r / 2, s: '=', a: 'c', big: true });
    return { prims, W: ox + A + B, H: A, neg, A, B };
  }

  // Würfel (a+b)³ in Schrägbild, explode ∈ [0,1]
  function figCube(aT, bT, vals, explode) {
    const a = termVal(aT, vals), b = termVal(bT, vals), e = (explode || 0) * Math.max(a, b) * 0.9;
    const S = 0.5, ca = Math.SQRT1_2 * S; // Tiefe-Verkürzung (45°, halbe Länge)
    const blocks = [];
    for (let ix = 0; ix < 2; ix++) for (let iy = 0; iy < 2; iy++) for (let iz = 0; iz < 2; iz++) {
      const nb = ix + iy + iz; // Anzahl b-Kanten
      const dx = ix ? b : a, dy = iy ? b : a, dz = iz ? b : a;
      const x0 = ix ? a + e : 0, y0 = iy ? a + e : 0, z0 = iz ? a + e : 0;
      blocks.push({ ix, iy, iz, nb, x0, y0, z0, dx, dy, dz });
    }
    // hinten (grosses y) zuerst, dann unten, dann links
    blocks.sort((p, q2) => (q2.iy - p.iy) || (p.iz - q2.iz) || (p.ix - q2.ix));
    const prims = [];
    const P = (x, y, z) => [x + y * ca, -(z + y * ca)];   // z nach oben → y der Zeichnung negativ
    blocks.forEach(B => {
      const { x0, y0, z0, dx, dy, dz } = B;
      const hue = [0, 1, 2, 3][B.nb];
      const front = [P(x0, y0, z0), P(x0 + dx, y0, z0), P(x0 + dx, y0, z0 + dz), P(x0, y0, z0 + dz)];
      const top = [P(x0, y0, z0 + dz), P(x0 + dx, y0, z0 + dz), P(x0 + dx, y0 + dy, z0 + dz), P(x0, y0 + dy, z0 + dz)];
      const right = [P(x0 + dx, y0, z0), P(x0 + dx, y0 + dy, z0), P(x0 + dx, y0 + dy, z0 + dz), P(x0 + dx, y0, z0 + dz)];
      prims.push({ k: 'poly', pts: front, hue, shade: 0 }, { k: 'poly', pts: top, hue, shade: 1 }, { k: 'poly', pts: right, hue, shade: 2 });
    });
    const xs = prims.flatMap(p => p.pts.map(q2 => q2[0])), ys = prims.flatMap(p => p.pts.map(q2 => q2[1]));
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    // cube: Rohdaten für die drehbare, durchsichtige Ansicht (34_alg_ui.js); prims bleiben für den TikZ-Export
    return { prims, W: x1 - x0, H: y1 - y0, X0: x0, Y0: y0, a, b, cube: { a, b, e, blocks: blocks.map(B => ({ x0: B.x0, y0: B.y0, z0: B.z0, dx: B.dx, dy: B.dy, dz: B.dz, nb: B.nb })) } };
  }

  function figPascal(n, N) {
    N = Math.max(N || 0, Math.min(n, 12), 4);
    const prims = [];
    for (let r = 0; r <= N; r++) {
      const row = pascalRow(r);
      row.forEach((c, k) => {
        prims.push({ k: 'cellnum', x: (k - r / 2), y: r * 0.9, s: String(c), hi: r === n, row: r, col: k });
      });
    }
    return { prims, W: N + 1, H: (N + 1) * 0.9, N };
  }

  // ── Alles zusammen ─────────────────────────────────────────────────
  // mode: 'expand' | 'factor' | 'complete' | 'binom'
  function processRaw(text, mode, vals, opt) {
    opt = opt || {};
    const out = { ok: false, error: null, text, mode, steps: [], fig: null, caption: '', vars: [], kind: 'none', hints: [] };
    let poly, ast;
    try { ast = parse(text); poly = evalAst(ast); } catch (e) { if (e instanceof AlgError) { out.error = e.message; return out; } throw e; }
    out.poly = poly; out.vars = pVars(poly);
    const exp = expandInfo(text);
    out.expand = exp;
    // Variablen auch aus nicht ausmultiplizierten Faktoren (x − x kürzt sich sonst weg)
    try {
      const allv = new Set(out.vars); exp.factors.forEach(f => pVars(f).forEach(v => allv.add(v))); (String(text).match(/[A-Za-z]/g) || []).forEach(v => allv.add(v)); out.vars = [...allv].sort();
    } catch (e) { /* ignorieren */ }
    try {
      if (mode === 'expand') buildExpand(out, exp, vals, opt);
      else if (mode === 'factor') buildFactor(out, poly, vals, opt);
      else if (mode === 'complete') buildComplete(out, poly, vals, opt);
      else if (mode === 'binom') buildBinom(out, exp, poly, vals, opt);
      else out.error = 'Unbekannte Darstellung';
    } catch (e) { if (e instanceof AlgError) { out.error = e.message; return out; } throw e; }
    out.ok = !out.error;
    return out;
  }

  function buildExpand(out, exp, vals, opt) {
    out.kind = exp.kind; out.steps = exp.steps.slice();
    out.caption = (exp.srcTex ? exp.srcTex + ' = ' : '') + polyTex(exp.result);
    out.captionTxt = polyTxt(exp.result);
    out.lineTxt = (exp.pw ? '(' + polyTxt(exp.pw.p) + ')' + sup(exp.pw.n) : exp.factors.map(p => (p.length > 1 ? '(' + polyTxt(p) + ')' : polyTxt(p))).join('')) + ' = ' + polyTxt(exp.result);
    if (exp.kind === 'none') {
      out.hints.push(exp.factors.length === 0 && exp.result.length <= 1 ? 'Gib einen Term mit Klammern ein, z. B. (3x − 4y)^2.' : 'Hier gibt es nichts auszumultiplizieren.');
      return;
    }
    const style = opt.style || 'area';   // 'area' (Fläche abschneiden) oder 'box'
    if (exp.kind === 'sq') {
      const A = exp.factors[0];
      if (A.length === 2 && exp.sq.neg && style === 'area') out.fig = figSubSquare(exp.sq.a, exp.sq.b, vals);
      else out.fig = tileMaybe(exp.factors[0], exp.factors[1], vals, opt, exp);
    } else if (exp.kind === 'diffsq') {
      if (style === 'area') out.fig = figDiffSquares(exp.ds.u, exp.ds.v, vals);
      else out.fig = tileMaybe(exp.factors[0], exp.factors[1], vals, opt, exp);
    } else if (exp.kind === 'prod') {
      out.fig = tileMaybe(exp.factors[0], exp.factors[1], vals, opt, exp);
    } else if (exp.kind === 'cube') {
      if (!exp.sq.neg) {
        out.fig = figCube(exp.sq.a, exp.sq.b, vals, opt.explode);
        out.fig.legend = exp.result.map((t, i) => ({ hue: i, s: termStr(t, true, false) }));
      }
      else out.hints.push('Das Würfelbild gibt es nur für (a + b)³ mit positiven Gliedern.');
      if (out.fig && out.fig.cube) out.hints.push('Zum Drehen mit der Maus ziehen, Doppelklick stellt die Ansicht zurück.');
    } else if (exp.kind === 'multi') {
      out.hints.push('Bei drei oder mehr Faktoren gibt es keine Figur – die Schritte zeigen das Ausmultiplizieren.');
    }
  }
  function tileMaybe(F, G, vals, opt, exp) {
    if (opt.tiles) { const t = figTiles(F, G, vals); if (t) return t; }
    return figBox(F, G, vals, { result: exp.result });
  }

  function buildFactor(out, poly, vals, opt) {
    if (!poly.length) { out.hints.push('Der Term ist 0.'); return; }
    const fs = factorSteps(poly);
    out.steps = fs.steps; out.factorInfo = fs.info;
    out.kind = 'factor';
    if (!fs.info.ok) { out.hints.push('Dieser Term lässt sich hier nicht zerlegen.'); return; }
    out.caption = polyTex(poly) + (fs.nonTrivial ? ' = ' + factorTex(fs.info) : '');
    out.captionTxt = polyTxt(poly);
    out.lineTxt = polyTxt(poly) + (fs.nonTrivial ? ' = ' + factorTxt(fs.info) : '');
    if (!fs.nonTrivial) { out.hints.push('Der Term ist über den rationalen Zahlen nicht weiter zerlegbar.'); return; }
    // Figur: Produkt der ersten beiden «Hauptfaktoren»
    let kPoly = pConst(fs.info.k);
    const facs = [];
    fs.info.fac.forEach(f => { for (let i = 0; i < f.e; i++) facs.push(f.p); });
    // Faktoren zu zwei Rechtecksseiten bündeln: Zahl und Monome in den Faktor mit Variablen
    let rectF = null, rectG = null;
    const sumF = facs.filter(p => p.length > 1), monoF = facs.filter(p => p.length === 1);
    let pre = kPoly; monoF.forEach(m => { pre = pMul(pre, m); });
    if (sumF.length === 1) { rectF = pre; rectG = sumF[0]; if (pEq(pre, pOne)) { out.hints.push('Der Term ist bereits ein einziger Faktor.'); return; } }
    else if (sumF.length === 2) { rectF = pMul(pre, sumF[0]); rectG = sumF[1]; }
    else if (sumF.length > 2) { out.hints.push('Mit mehr als zwei Klammern gibt es keine Figur.'); return; }
    if (rectF && rectG) {
      if (rectF.length > 6) { out.hints.push('Der Term hat zu viele Glieder für eine Figur.'); return; }
      if (opt.tiles) { const t = figTiles(rectF, rectG, vals); if (t) { out.fig = t; return; } }
      out.fig = figBox(rectF, rectG, vals, { result: poly });
    }
  }

  function buildComplete(out, poly, vals, opt) {
    const cs = completeSquare(poly);
    out.cs = cs; out.kind = 'complete';
    out.steps = completeSteps(cs);
    const hs = qsgn(cs.h) >= 0 ? ' + ' : ' − ';
    const F = pNorm([{ c: ONE, m: { [cs.v]: 1 } }, { c: cs.h, m: {} }]);
    out.caption = polyTex(poly) + ' = ' + (qeq(cs.a, ONE) ? '' : qeq(cs.a, qneg(ONE)) ? '-' : qTex(cs.a)) + '(' + cs.v + (qsgn(cs.h) >= 0 ? ' + ' : ' - ') + qTex(qabs(cs.h)) + ')^{2}' + (qzero(cs.k) ? '' : (qsgn(cs.k) >= 0 ? ' + ' : ' - ') + qTex(qabs(cs.k)));
    out.captionTxt = polyTxt(poly);
    out.lineTxt = polyTxt(poly) + ' = ' + (qeq(cs.a, ONE) ? '' : qTxt(cs.a)) + '(' + cs.v + (qsgn(cs.h) >= 0 ? ' + ' : ' − ') + qTxt(qabs(cs.h)) + ')²' + (qzero(cs.k) ? '' : (qsgn(cs.k) >= 0 ? ' + ' : ' − ') + qTxt(qabs(cs.k)));
    if (qzero(cs.h)) { out.hints.push('Der Term ist bereits in Scheitelform.'); return; }
    const fig = figBox(F, F, vals, {
      result: pMul(F, F),
      cellFilter: (cell, i, j) => { if (i === 1 && j === 1) { cell.dash = true; cell.fresh = true; cell.label = termStr({ c: cs.h2, m: {} }, true, false); } }
    });
    fig.complete = true; fig.hasA = !qeq(cs.a, ONE);
    out.fig = fig;
  }

  function buildBinom(out, exp, poly, vals, opt) {
    const pw = exp.pw;
    if (!pw || pw.p.length !== 2) {
      out.hints.push('Gib eine Potenz mit einer Summe aus zwei Gliedern ein, z. B. (a + b)^5 oder (2x − 3)^6.');
      out.kind = 'none'; return;
    }
    const n = pw.n;
    if (n > 12) fail('Für das Pascal-Dreieck bitte n ≤ 12 wählen.');
    out.kind = 'binom'; out.n = n;
    let a = pw.p[0], b = pw.p[1];
    const row = pascalRow(n);
    out.row = row;
    const aT = termParTex(tpos(a)), bT = termParTex(tpos(b));
    const sgnA = a.c[0] < 0, sgnB = b.c[0] < 0;
    out.steps.push({ label: 'Binomischer Lehrsatz', tex: '(a+b)^{' + n + '} = ' + row.map((c, k) => (c === 1 ? '' : c) + (n - k > 0 ? 'a' + (n - k > 1 ? '^{' + (n - k) + '}' : '') : '') + (k > 0 ? 'b' + (k > 1 ? '^{' + k + '}' : '') : '')).join(' + ') });
    out.steps.push({ label: 'Wähle', tex: 'a = ' + polyTex([tpos(a)]) + ',\\quad b = ' + polyTex([tpos(b)]) });
    // Einsetzen
    const subs = row.map((c, k) => (c === 1 ? '' : c + '\\cdot ') + sub(aT, n - k) + sub(bT, k)).map(s => s || '1');
    function sub(base, e) { return e === 0 ? '' : (e === 1 ? base : base + '^{' + e + '}'); }
    const plain = row.map((c, k) => { let s = c === 1 ? '' : c + '\\cdot '; const parts = []; if (n - k > 0) parts.push(sub(termParTex(a), n - k)); if (k > 0) parts.push(sub(termParTex(b), k)); return s + parts.join('\\cdot '); });
    out.steps.push({ label: 'Einsetzen', tex: '(' + polyTex(pw.p) + ')^{' + n + '} = ' + plain.join(' + ') });
    out.steps.push({ label: 'Ausrechnen', tex: polyTex(poly) });
    out.caption = '(' + polyTex(pw.p) + ')^{' + n + '} = ' + polyTex(poly);
    out.captionTxt = polyTxt(poly);
    out.lineTxt = '(' + polyTxt(pw.p) + ')' + sup(n) + ' = ' + polyTxt(poly);
    out.fig = figPascal(n, Math.max(n, 6));
    out.fig.n = n; out.fig.row = row;
  }

  // Runde Klammern, die Brüche oder Wurzeln enthalten, in \left( \right) umwandeln (mitwachsende Klammern)
  function bigParens(tex) {
    if (!tex || tex.indexOf('\\frac') < 0) return tex;
    const s = String(tex), st = [], pairs = [];
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '(' && s.slice(Math.max(0, i - 5), i) !== '\\left') st.push(i);
      else if (s[i] === ')' && s.slice(Math.max(0, i - 6), i) !== '\\right') { if (st.length) pairs.push([st.pop(), i]); }
    }
    const rep = new Map();
    pairs.forEach(([a, b]) => { if (s.slice(a, b).indexOf('\\frac') >= 0) { rep.set(a, '\\left('); rep.set(b, '\\right)'); } });
    let out = '';
    for (let i = 0; i < s.length; i++) out += rep.has(i) ? rep.get(i) : s[i];
    return out;
  }
  function process(text, mode, vals, opt) {
    const out = processRaw(text, mode, vals, opt);
    if (out && out.steps) out.steps.forEach(st => { st.tex = bigParens(st.tex); });
    if (out && out.caption) out.caption = bigParens(out.caption);
    return out;
  }

  return {
    AlgError, q, qadd, qmul, qneg, qinv, qdiv, qsub, qeq, qzero, qnum, qabs, qsgn, qint, qpow, qTex, qTxt, ONE, ZERO,
    pNorm, pConst, pVar, pAdd, pNeg, pSub, pMul, pPow, pScale, pEq, pIsConst, pVars, pDegree, pEval, polyTex, polyTxt, termStr, termMag, termParTex,
    parse, evalAst, parsePoly, structure, expandInfo, factorPolyEx, factorTex, factorSteps, factorTxt, completeSquare, completeSteps,
    pascalRow, binom, termVal, figBox, figTiles, figSubSquare, figDiffSquares, figCube, figPascal, process, bigParens, sup, mkey, tmul
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = AlgCore;
