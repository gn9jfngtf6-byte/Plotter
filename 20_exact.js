// ═══════════════════════════════════════════════════════════════════
// MODUL 20: exact — EXAKTE Rechenbasis für die Lösungswege
//
// Warum ein eigenes Modul? Die Lösungswege (20–22) sollen nie mit gerundeten
// Fliesskommazahlen "rechnen" (z.B. x = 0.9999999 oder "1x² + 0x − 3"), sondern
// exakt wie im Unterricht: mit Brüchen, Wurzeln und Polynomen. Nerdamer
// (CDN) wäre dafür nicht zuverlässig genug (z.B. solve('x^2-2') liefert eine
// rationale Näherung für √2, sqrt(3)^3-3*sqrt(3) wird nicht zu 0 vereinfacht);
// deshalb rechnet dieses Modul selbst — vollständig exakt:
//
//   Q   — Bruch p/q mit BigInt (nie Rundungsfehler)
//   Fe  — Zahl a + b·√d (a,b ∈ Q, d quadratfrei): genau der Zahlenbereich, in dem
//         die Lösungen quadratischer Gleichungen liegen
//   Poly— Polynom mit Q-Koeffizienten (Division, Ableitung, Auswertung, ggT)
//   evalFe/ratFromAst — AST (aus 14_mathinput.js) → exakte Polynome/Brüche
//
// Alles liegt im Namensraum EX (keine globalen Namenskollisionen). Dieses
// Modul braucht keinen DOM und ist per Node testbar (module.exports unten).
// ═══════════════════════════════════════════════════════════════════
const EX = (function () {
  const B = BigInt;

  // ───────────────────────── Brüche (Q) ─────────────────────────
  function gcdB(a, b) {
    if (a < 0n) a = -a; if (b < 0n) b = -b;
    while (b) { const t = a % b; a = b; b = t; }
    return a;
  }
  function Q(n, d) {
    n = B(n); d = (d === undefined) ? 1n : B(d);
    if (d === 0n) throw new Error('Q: Division durch 0');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcdB(n, d);
    if (g > 1n) { n /= g; d /= g; }
    return { n, d };
  }
  const q0 = Q(0), q1 = Q(1);
  const qAdd = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
  const qSub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
  const qMul = (a, b) => Q(a.n * b.n, a.d * b.d);
  const qDiv = (a, b) => Q(a.n * b.d, a.d * b.n);
  const qNeg = a => ({ n: -a.n, d: a.d });
  const qInv = a => Q(a.d, a.n);
  const qIsZero = a => a.n === 0n;
  const qIsInt = a => a.d === 1n;
  const qSgn = a => a.n > 0n ? 1 : a.n < 0n ? -1 : 0;
  const qEq = (a, b) => a.n === b.n && a.d === b.d;
  const qCmp = (a, b) => { const l = a.n * b.d, r = b.n * a.d; return l < r ? -1 : l > r ? 1 : 0; };
  const qAbs = a => a.n < 0n ? qNeg(a) : a;
  function qNum(a) {
    const r = Number(a.n) / Number(a.d);
    if (isFinite(r)) return r;
    // sehr grosse BigInt: über Dezimalstring skalieren
    const s = (a.n < 0n ? -a.n : a.n).toString().length - a.d.toString().length;
    return (a.n < 0n ? -1 : 1) * Math.pow(10, s);
  }
  function qPow(a, k) {
    if (k < 0) return qPow(qInv(a), -k);
    let r = q1; for (let i = 0; i < k; i++) r = qMul(r, a); return r;
  }
  // "12.5" / "3" / ".25"  →  exakter Bruch (Dezimalschreibweise ist exakt!)
  function qFromDec(s) {
    s = String(s).trim();
    const m = /^(\d*)\.?(\d*)$/.exec(s);
    if (!m || (m[1] === '' && m[2] === '')) return null;
    const ip = m[1] || '0', fp = m[2] || '';
    return Q(B(ip + fp), 10n ** B(fp.length));
  }
  // Float → "schöner" Bruch (nur für Parameterwerte / Notfälle); null wenn keiner passt
  function qFromFloat(v) {
    if (!isFinite(v)) return null;
    if (Math.abs(v - Math.round(v)) < 1e-12) return Q(Math.round(v));
    const tol = 1e-9 * Math.max(1, Math.abs(v));
    for (let d = 2; d <= 4000; d++) {
      const p = Math.round(v * d);
      if (Math.abs(p / d - v) < tol) return Q(p, d);
    }
    return null;
  }
  // LaTeX: ganze Zahl oder \frac{n}{d}; Vorzeichen vor dem Bruch
  function qTex(a) {
    const neg = a.n < 0n, n = neg ? -a.n : a.n;
    return (neg ? '-' : '') + (a.d === 1n ? String(n) : '\\frac{' + n + '}{' + a.d + '}');
  }
  // in Klammern, wenn negativ (für Einsetzen: "(-2)^2")
  const qTexP = a => a.n < 0n ? '\\left(' + qTex(a) + '\\right)' : qTex(a);

  // ──────────────── Wurzeln a + b√d (Fe) ────────────────
  // d quadratfrei (> 1) wenn b ≠ 0, sonst d = 1.
  function sqrtSplit(n) {            // n = s²·r, r quadratfrei  →  {s, r}
    let s = 1n, rem = n, res = 1n;
    for (let p = 2n; p < 200000n && p * p <= rem; p += (p === 2n ? 1n : 2n)) {
      if (rem % p !== 0n) continue;
      let e = 0;
      while (rem % p === 0n) { rem /= p; e++; }
      s *= p ** B(Math.floor(e / 2));
      if (e % 2) res *= p;
    }
    res *= rem;
    return { s, r: res };
  }
  function Fe(p, q, d) {
    if (q === undefined || qIsZero(q)) return { p, q: q0, d: 1n };
    return { p, q, d: B(d) };
  }
  const feQ = q => ({ p: q, q: q0, d: 1n });
  const feInt = n => feQ(Q(n));
  const feIsRat = a => qIsZero(a.q);
  function feSqrtQ(q) {              // √q als Fe, null wenn q < 0
    if (q.n < 0n) return null;
    if (q.n === 0n) return feQ(q0);
    const { s, r } = sqrtSplit(q.n * q.d);
    const c = Q(s, q.d);
    if (r === 1n) return feQ(c);
    return { p: q0, q: c, d: r };
  }
  function _d(a, b) { if (qIsZero(a.q)) return b.d; if (qIsZero(b.q)) return a.d; return a.d === b.d ? a.d : null; }
  function feAdd(a, b) { const d = _d(a, b); if (d === null) return null; return Fe(qAdd(a.p, b.p), qAdd(a.q, b.q), d); }
  function feSub(a, b) { const d = _d(a, b); if (d === null) return null; return Fe(qSub(a.p, b.p), qSub(a.q, b.q), d); }
  function feNeg(a) { return Fe(qNeg(a.p), qNeg(a.q), a.d); }
  function feMul(a, b) {
    const d = _d(a, b); if (d === null) return null;
    const dd = qIsZero(a.q) && qIsZero(b.q) ? 1n : d;
    const p = qAdd(qMul(a.p, b.p), qMul(qMul(a.q, b.q), Q(dd)));
    const q = qAdd(qMul(a.p, b.q), qMul(a.q, b.p));
    return Fe(p, q, dd);
  }
  function feIsZero(a) { return qIsZero(a.p) && qIsZero(a.q); }
  function feDiv(a, b) {
    if (feIsZero(b)) return null;
    if (feIsRat(b)) { const iv = qInv(b.p); return Fe(qMul(a.p, iv), qMul(a.q, iv), a.d); }
    const d = _d(a, b); if (d === null) return null;
    // (a)/(p2 + q2√d) = a·(p2 − q2√d) / (p2² − q2²·d)
    const conj = Fe(b.p, qNeg(b.q), d);
    const den = qSub(qMul(b.p, b.p), qMul(qMul(b.q, b.q), Q(d)));
    if (qIsZero(den)) return null;
    const num = feMul(a, conj); if (!num) return null;
    const iv = qInv(den);
    return Fe(qMul(num.p, iv), qMul(num.q, iv), d);
  }
  function fePow(a, k) {
    if (k < 0) { const r = fePow(a, -k); return r && feDiv(feInt(1), r); }
    let r = feInt(1);
    for (let i = 0; i < k; i++) { r = feMul(r, a); if (!r) return null; }
    return r;
  }
  function feNum(a) { return qNum(a.p) + (qIsZero(a.q) ? 0 : qNum(a.q) * Math.sqrt(Number(a.d))); }
  function feEq(a, b) { return qEq(a.p, b.p) && qEq(a.q, b.q) && (qIsZero(a.q) || a.d === b.d); }
  function feSgn(a) {                // exaktes Vorzeichen
    const s1 = qSgn(a.p), s2 = qSgn(a.q);
    if (s2 === 0) return s1; if (s1 === 0) return s2; if (s1 === s2) return s1;
    const l = a.p.n * a.p.n * a.q.d * a.q.d;            // p² vs q²·d  (Nenner gekürzt multipliziert)
    const r = a.q.n * a.q.n * a.d * a.p.d * a.p.d;
    return l > r ? s1 : l < r ? s2 : 0;
  }
  // LaTeX in der Form \frac{p + q√d}{r}
  function feTex(a) {
    if (qIsZero(a.q)) return qTex(a.p);
    const r = (a.p.d * a.q.d) / gcdB(a.p.d, a.q.d);        // kgV der Nenner
    let P = a.p.n * (r / a.p.d), Qc = a.q.n * (r / a.q.d);
    let g = gcdB(gcdB(P, Qc), r); if (g === 0n) g = 1n;
    P /= g; Qc /= g; const R = r / g;
    const sq = '\\sqrt{' + a.d + '}';
    const qa = Qc < 0n ? -Qc : Qc;
    const qTerm = (qa === 1n ? '' : String(qa)) + sq;
    if (P === 0n) {
      const body = qTerm;
      if (R === 1n) return (Qc < 0n ? '-' : '') + body;
      return (Qc < 0n ? '-' : '') + '\\frac{' + body + '}{' + R + '}';
    }
    const num = String(P) + (Qc < 0n ? '-' : '+') + qTerm;
    return R === 1n ? num : '\\frac{' + num + '}{' + R + '}';
  }
  const feTexP = a => (feIsRat(a) ? qTexP(a.p) : '\\left(' + feTex(a) + '\\right)');

  // ───────────────────── Polynome (Q-Koeffizienten, aufsteigend) ─────────────────────
  function pTrim(p) { let n = p.length; while (n > 0 && qIsZero(p[n - 1])) n--; return p.slice(0, n); }
  const pDeg = p => pTrim(p).length - 1;            // -1 für das Nullpolynom
  const pIsZero = p => pTrim(p).length === 0;
  function pConst(q) { return qIsZero(q) ? [] : [q]; }
  function pAdd(a, b) { const n = Math.max(a.length, b.length), r = []; for (let i = 0; i < n; i++) r.push(qAdd(a[i] || q0, b[i] || q0)); return pTrim(r); }
  function pSub(a, b) { const n = Math.max(a.length, b.length), r = []; for (let i = 0; i < n; i++) r.push(qSub(a[i] || q0, b[i] || q0)); return pTrim(r); }
  function pNeg(a) { return a.map(qNeg); }
  function pScale(a, c) { return pTrim(a.map(x => qMul(x, c))); }
  function pMul(a, b) {
    if (!a.length || !b.length) return [];
    const r = new Array(a.length + b.length - 1).fill(null).map(() => q0);
    for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) r[i + j] = qAdd(r[i + j], qMul(a[i], b[j]));
    return pTrim(r);
  }
  function pPow(a, k) { let r = [q1]; for (let i = 0; i < k; i++) r = pMul(r, a); return r; }
  function pDeriv(a) { const r = []; for (let i = 1; i < a.length; i++) r.push(qMul(a[i], Q(i))); return pTrim(r); }
  function pDivmod(a, b) {                          // → {q, r}
    a = pTrim(a); b = pTrim(b);
    if (!b.length) throw new Error('Polynomdivision durch 0');
    let r = a.slice(), q = [];
    const db = b.length - 1, lb = b[db];
    while (r.length - 1 >= db && r.length) {
      const k = r.length - 1 - db, c = qDiv(r[r.length - 1], lb);
      q[k] = c;
      for (let i = 0; i <= db; i++) r[i + k] = qSub(r[i + k], qMul(c, b[i]));
      r = pTrim(r);
    }
    for (let i = 0; i < q.length; i++) if (!q[i]) q[i] = q0;
    return { q: pTrim(q), r: pTrim(r) };
  }
  function pMonic(a) { a = pTrim(a); if (!a.length) return a; const l = qInv(a[a.length - 1]); return a.map(x => qMul(x, l)); }
  function pGcd(a, b) {
    a = pTrim(a); b = pTrim(b);
    while (b.length) { const r = pDivmod(a, b).r; a = b; b = r; }
    return pMonic(a);
  }
  function pEvalQ(p, x) { let r = q0; for (let i = p.length - 1; i >= 0; i--) r = qAdd(qMul(r, x), p[i]); return r; }
  function pEvalFe(p, x) {
    let r = feQ(q0);
    for (let i = p.length - 1; i >= 0; i--) { r = feMul(r, x); if (!r) return null; r = feAdd(r, feQ(p[i])); if (!r) return null; }
    return r;
  }
  function pEvalNum(p, x) { let r = 0; for (let i = p.length - 1; i >= 0; i--) r = r * x + qNum(p[i]); return r; }
  // → ganzzahliges, teilerfremdes Polynom;  k mit  prim = k · P
  function pPrimitive(p) {
    p = pTrim(p); if (!p.length) return { P: p, k: q1 };
    let L = 1n; p.forEach(c => { L = (L * c.d) / gcdB(L, c.d); });
    let ints = p.map(c => c.n * (L / c.d));
    let g = 0n; ints.forEach(c => { g = gcdB(g, c); }); if (g === 0n) g = 1n;
    return { P: ints.map(c => Q(c / g)), k: Q(L, g) };
  }
  // LaTeX: "x^{3}-3x+1" (höchster Grad zuerst). v = Variablenname
  function pTex(p, v) {
    v = v || 'x'; p = pTrim(p);
    if (!p.length) return '0';
    let out = '';
    for (let i = p.length - 1; i >= 0; i--) {
      const c = p[i]; if (qIsZero(c)) continue;
      const neg = c.n < 0n, a = qAbs(c);
      const isOne = qEq(a, q1);
      let term;
      if (i === 0) term = qTex(a);
      else {
        const coef = isOne ? '' : (a.d === 1n ? String(a.n) : '\\frac{' + a.n + '}{' + a.d + '}');
        term = coef + v + (i === 1 ? '' : '^{' + i + '}');
      }
      out += out === '' ? (neg ? '-' : '') + term : (neg ? '-' : '+') + term;
    }
    return out;
  }
  // Teiler einer positiven BigInt (n ≤ ~1e12, sonst null)
  function divisors(n) {
    if (n < 0n) n = -n; if (n === 0n) return null;
    if (n > 1000000000000n) return null;
    const N = Number(n), res = [];
    for (let i = 1; i * i <= N; i++) if (N % i === 0) { res.push(B(i)); if (i * i !== N) res.push(B(N / i)); }
    return res.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }
  // Rationale-Wurzel-Kandidaten ±p/q (p | a0, q | an) eines GANZZAHLIGEN Polynoms mit a0 ≠ 0
  function ratRootCandidates(P) {
    P = pTrim(P);
    const a0 = P[0].n, an = P[P.length - 1].n;
    const dp = divisors(a0), dq = divisors(an);
    if (!dp || !dq) return null;
    const seen = new Set(), out = [];
    dp.forEach(p => dq.forEach(q => {
      if (gcdB(p, q) !== 1n) return;
      [Q(p, q), Q(-p, q)].forEach(c => { const key = c.n + '/' + c.d; if (!seen.has(key)) { seen.add(key); out.push(c); } });
    }));
    out.sort((a, b) => { const c = qCmp(qAbs(a), qAbs(b)); return c !== 0 ? c : -qCmp(a, b); });
    return { dp, dq, cands: out };
  }
  // Division durch (x − r) mit Horner → {q: Quotient, r: Rest, row: Horner-Zeile}
  function hornerDiv(P, r) {
    const n = P.length - 1, row = new Array(n + 1);
    row[n] = P[n];
    for (let i = n - 1; i >= 0; i--) row[i] = qAdd(P[i], qMul(row[i + 1], r));
    const rest = row[0], quo = row.slice(1);
    return { q: pTrim(quo), r: rest, row };
  }

  // ───────────────────── AST → exakte Polynome / Brüche ─────────────────────
  // Knotenformen wie in 14_mathinput.js: num/id/neg/add/sub/mul/div/pow/call.
  function numNodeQ(node) { return qFromDec(node.v); }
  // Polynom in v (alle anderen Bezeichner ausser x ⇒ null, also nicht-polynomial)
  function polyFromAst(node, v) {
    v = v || 'x';
    switch (node.type) {
      case 'num': { const q = numNodeQ(node); return q ? pConst(q) : null; }
      case 'id': return node.v === v ? [q0, q1] : null;
      case 'neg': { const a = polyFromAst(node.x, v); return a && pNeg(a); }
      case 'add': case 'sub': {
        const a = polyFromAst(node.a, v), b = polyFromAst(node.b, v);
        return a && b ? (node.type === 'add' ? pAdd(a, b) : pSub(a, b)) : null;
      }
      case 'mul': { const a = polyFromAst(node.a, v), b = polyFromAst(node.b, v); return a && b ? pMul(a, b) : null; }
      case 'div': {
        const a = polyFromAst(node.a, v), b = polyFromAst(node.b, v);
        if (!a || !b || pDeg(b) !== 0) return null;
        return pScale(a, qInv(b[0]));
      }
      case 'pow': {
        const a = polyFromAst(node.a, v), e = exactQ(node.b);
        if (!a || !e || !qIsInt(e) || e.n < 0n || e.n > 24n) return null;
        return pPow(a, Number(e.n));
      }
      default: return null;
    }
  }
  // Konstanter, x-freier Zahlenausdruck → Q (nur +,−,·,/, ganzzahlige Potenzen)
  function exactQ(node) {
    switch (node.type) {
      case 'num': return numNodeQ(node);
      case 'neg': { const a = exactQ(node.x); return a && qNeg(a); }
      case 'add': case 'sub': case 'mul': case 'div': {
        const a = exactQ(node.a), b = exactQ(node.b); if (!a || !b) return null;
        if (node.type === 'add') return qAdd(a, b);
        if (node.type === 'sub') return qSub(a, b);
        if (node.type === 'mul') return qMul(a, b);
        return qIsZero(b) ? null : qDiv(a, b);
      }
      case 'pow': {
        const a = exactQ(node.a), e = exactQ(node.b);
        if (!a || !e || !qIsInt(e) || e.n > 24n || e.n < -24n) return null;
        if (qIsZero(a) && e.n < 0n) return null;
        return qPow(a, Number(e.n));
      }
      default: return null;
    }
  }
  // Rationale Funktion → {N, D} (Polynome, D ≠ 0); null falls nicht rational
  function ratFromAst(node, v) {
    v = v || 'x';
    const P = polyFromAst(node, v);
    if (P) return { N: P, D: [q1] };
    switch (node.type) {
      case 'neg': { const a = ratFromAst(node.x, v); return a && { N: pNeg(a.N), D: a.D }; }
      case 'add': case 'sub': {
        const a = ratFromAst(node.a, v), b = ratFromAst(node.b, v); if (!a || !b) return null;
        const t1 = pMul(a.N, b.D), t2 = pMul(b.N, a.D);
        return { N: node.type === 'add' ? pAdd(t1, t2) : pSub(t1, t2), D: pMul(a.D, b.D) };
      }
      case 'mul': { const a = ratFromAst(node.a, v), b = ratFromAst(node.b, v); return a && b && { N: pMul(a.N, b.N), D: pMul(a.D, b.D) }; }
      case 'div': {
        const a = ratFromAst(node.a, v), b = ratFromAst(node.b, v);
        if (!a || !b || pIsZero(b.N)) return null;
        return { N: pMul(a.N, b.D), D: pMul(a.D, b.N) };
      }
      case 'pow': {
        const a = ratFromAst(node.a, v), e = exactQ(node.b);
        if (!a || !e || !qIsInt(e) || e.n > 24n || e.n < -24n) return null;
        const k = Number(e.n < 0n ? -e.n : e.n);
        const N = pPow(a.N, k), D = pPow(a.D, k);
        if (e.n >= 0n) return { N, D };
        return pIsZero(N) ? null : { N: D, D: N };
      }
      default: return null;
    }
  }
  // N/D auf Hauptnenner reduzieren (ggT kürzen) → {N, D, g}  (g = gekürzter gemeinsamer Faktor)
  function ratReduce(r) {
    const g = pGcd(r.N, r.D);
    if (pDeg(g) <= 0) return { N: r.N, D: r.D, g: [q1] };
    return { N: pDivmod(r.N, g).q, D: pDivmod(r.D, g).q, g };
  }

  // Exakte Auswertung eines x-abhängigen Ausdrucks an Fe-Stelle xv → Fe | null
  function evalFe(node, xv, v) {
    v = v || 'x';
    switch (node.type) {
      case 'num': { const q = numNodeQ(node); return q && feQ(q); }
      case 'id': return node.v === v ? xv : null;
      case 'neg': { const a = evalFe(node.x, xv, v); return a && feNeg(a); }
      case 'add': case 'sub': case 'mul': case 'div': {
        const a = evalFe(node.a, xv, v), b = a && evalFe(node.b, xv, v); if (!a || !b) return null;
        return node.type === 'add' ? feAdd(a, b) : node.type === 'sub' ? feSub(a, b) : node.type === 'mul' ? feMul(a, b) : feDiv(a, b);
      }
      case 'pow': {
        const a = evalFe(node.a, xv, v), e = exactQ(node.b); if (!a || !e) return null;
        if (qIsInt(e) && e.n >= -24n && e.n <= 24n) return fePow(a, Number(e.n));
        if (e.d === 2n && feIsRat(a) && qIsInt(Q(e.n)) && e.n >= -9n && e.n <= 9n) {
          const s = feSqrtQ(a.p); return s && fePow(s, Number(e.n));
        }
        return null;
      }
      case 'call': {
        if (node.name === 'sqrt') {
          const a = evalFe(node.args[0], xv, v);
          if (!a || !feIsRat(a)) return null;
          return feSqrtQ(a.p);
        }
        if (node.name === 'abs') { const a = evalFe(node.args[0], xv, v); return a && (feSgn(a) < 0 ? feNeg(a) : a); }
        return null;
      }
      default: return null;
    }
  }

  // ───────────────────── Ausdrücke aus Fe/Q als AST ─────────────────────
  const num = s => ({ type: 'num', v: String(s) });
  function astQ(q) {
    const neg = q.n < 0n, n = neg ? -q.n : q.n;
    const nd = q.d === 1n ? num(n) : { type: 'div', a: num(n), b: num(q.d) };
    return neg ? { type: 'neg', x: nd } : nd;
  }
  function astFe(a) {
    if (qIsZero(a.q)) return astQ(a.p);
    const r = (a.p.d * a.q.d) / gcdB(a.p.d, a.q.d);
    let P = a.p.n * (r / a.p.d), Qc = a.q.n * (r / a.q.d);
    let g = gcdB(gcdB(P, Qc), r); if (g === 0n) g = 1n;
    P /= g; Qc /= g; const R = r / g;
    const sq = { type: 'call', name: 'sqrt', args: [num(a.d)] };
    const qa = Qc < 0n ? -Qc : Qc;
    const qTerm = qa === 1n ? sq : { type: 'mul', a: num(qa), b: sq };
    let body;
    if (P === 0n) body = Qc < 0n ? { type: 'neg', x: qTerm } : qTerm;
    else body = { type: Qc < 0n ? 'sub' : 'add', a: P < 0n ? { type: 'neg', x: num(-P) } : num(P), b: qTerm };
    return R === 1n ? body : { type: 'div', a: body, b: num(R) };
  }

  // ───────────────────── Winkel (Vielfache von π) ─────────────────────
  // Lineare Form  c + p·π  mit c, p ∈ Q  — Argumente von sin/cos/tan an exakten Stellen
  function lfFromAst(node, xlf, v) {
    v = v || 'x';
    switch (node.type) {
      case 'num': { const q = numNodeQ(node); return q && { c: q, p: q0 }; }
      case 'id':
        if (node.v === 'pi') return { c: q0, p: q1 };
        return node.v === v ? xlf : null;
      case 'neg': { const a = lfFromAst(node.x, xlf, v); return a && { c: qNeg(a.c), p: qNeg(a.p) }; }
      case 'add': case 'sub': {
        const a = lfFromAst(node.a, xlf, v), b = a && lfFromAst(node.b, xlf, v); if (!a || !b) return null;
        return node.type === 'add' ? { c: qAdd(a.c, b.c), p: qAdd(a.p, b.p) } : { c: qSub(a.c, b.c), p: qSub(a.p, b.p) };
      }
      case 'mul': {
        const a = lfFromAst(node.a, xlf, v), b = a && lfFromAst(node.b, xlf, v); if (!a || !b) return null;
        if (qIsZero(a.p)) return { c: qMul(a.c, b.c), p: qMul(a.c, b.p) };
        if (qIsZero(b.p)) return { c: qMul(b.c, a.c), p: qMul(b.c, a.p) };
        return null;                                       // π·π o.ä. nicht linear
      }
      case 'div': {
        const a = lfFromAst(node.a, xlf, v), b = a && lfFromAst(node.b, xlf, v);
        if (!a || !b || !qIsZero(b.p) || qIsZero(b.c)) return null;
        const iv = qInv(b.c); return { c: qMul(a.c, iv), p: qMul(a.p, iv) };
      }
      default: return null;
    }
  }
  // exakte Werte von sin/cos/tan bei r·π  (r ∈ Q, Nenner | 12 ... hier: 1,2,3,4,6)
  const SQ2 = feSqrtQ(Q(1, 2)), SQ3_2 = feSqrtQ(Q(3, 4));
  function trigAtPi(name, r) {                          // r = Q (Vielfaches von π) → Fe | null
    const modTwo = x => { const two = 2n * x.d; return Q(((x.n % two) + two) % two, x.d); };
    const half = Q(1, 2);
    const sinTab = { '0/1': feInt(0), '1/6': feQ(half), '1/4': SQ2, '1/3': SQ3_2, '1/2': feInt(1), '2/3': SQ3_2, '3/4': SQ2, '5/6': feQ(half), '1/1': feInt(0) };
    function sinOf(x) {                                  // x ∈ [0,2)
      if (qCmp(x, Q(1)) > 0) { const y = sinOf(qSub(x, Q(1))); return y && feNeg(y); }
      return sinTab[x.n + '/' + x.d] || null;
    }
    const m = modTwo(r);
    if (name === 'sin') return sinOf(m);
    if (name === 'cos') return sinOf(modTwo(qSub(half, m)));
    if (name === 'tan') {
      const s = sinOf(m), c = sinOf(modTwo(qSub(half, m)));
      if (!s || !c || feIsZero(c)) return null;
      return feDiv(s, c);
    }
    return null;
  }

  return {
    B, Q, q0, q1, qAdd, qSub, qMul, qDiv, qNeg, qInv, qIsZero, qIsInt, qSgn, qEq, qCmp, qAbs, qNum, qPow, qFromDec, qFromFloat, qTex, qTexP,
    gcdB, sqrtSplit, Fe, feQ, feInt, feIsRat, feSqrtQ, feAdd, feSub, feNeg, feMul, feDiv, fePow, feNum, feEq, feSgn, feIsZero, feTex, feTexP,
    pTrim, pDeg, pIsZero, pConst, pAdd, pSub, pNeg, pScale, pMul, pPow, pDeriv, pDivmod, pMonic, pGcd, pEvalQ, pEvalFe, pEvalNum, pPrimitive, pTex,
    divisors, ratRootCandidates, hornerDiv,
    polyFromAst, exactQ, ratFromAst, ratReduce, evalFe, astQ, astFe, lfFromAst, trigAtPi
  };
})();

if (typeof module !== 'undefined') module.exports = EX;
