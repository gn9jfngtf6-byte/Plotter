// ═════════════════════════════════════════════════════════════════
// MODUL 60: dif — Rechenkern der Umgebung «Differentialrechnung» (ohne DOM, node-testbar)
//
// Baut auf 14_mathinput.js (Parser/AST), 16_calculus.js (symbolische Ableitung),
// 20_exact.js (Brüche, Wurzeln, Polynome), 21_solver.js (Gleichungslöser mit Rechenweg).
//
//   Dif.makeFn(raw)        Funktion aus dem Rohausdruck: Auswertung f, f', f'', f''' (exakt wo möglich)
//   Dif.dqTable(F, x0)     Differenzenquotienten für h → 0 von rechts und links, Grenzwert, Knickerkennung
//   Dif.hMethodDoc(F, x0)  h-Methode in 4 Schritten (Polynome exakt), sonst Rechenweg mit Regeln
//   Dif.rulesDoc(F)        Ableiten Schritt für Schritt mit benannten Regeln (Potenz-, Faktor-, Summen-,
//                          Produkt-, Quotienten-, Kettenregel)
//   Dif.tangentDoc(F, x0)  Tangente und Normale in P(x0 | f(x0))
//   Dif.kd(F, win)         Kurvendiskussion (Polynome exakt, sonst numerisch) und Dif.kdDoc(K)
//   Dif.monoTable(K)       Vorzeichentabelle von f' (steigt / fällt) für «Graphisches Ableiten»
//
// Alle Texte der Rechenwege sind feste deutsche Sätze (werden übersetzt); Formeln stehen in $…$ bzw.
// in Formelzeilen (LaTeX).
// ═════════════════════════════════════════════════════════════════
const Dif = (function () {
  const E = EX, S = SV;
  const num = S.num, bin = S.bin, neg = S.neg, call = S.call, idn = S.idn;
  const hasX = n => calcContainsVar(n, 'x');
  const T = n => { try { return miToLatex(n); } catch (e) { return '?'; } };
  const simp = n => { try { return calcSimplify(n); } catch (e) { return n; } };
  const DOC = () => new S.Doc();

  // ───────────────────── Funktion ─────────────────────
  const xp = k => (k === 1 ? idn('x') : bin('pow', idn('x'), num(k)));
  function polyAst(P) {
    P = E.pTrim(P); let acc = null;
    for (let k = P.length - 1; k >= 0; k--) {
      const c = P[k]; if (E.qIsZero(c)) continue;
      const ng = c.n < 0n, a = E.qAbs(c);
      const mono = k === 0 ? E.astQ(a) : E.qEq(a, E.q1) ? xp(k) : bin('mul', E.astQ(a), xp(k));
      acc = acc === null ? (ng ? neg(mono) : mono) : bin(ng ? 'sub' : 'add', acc, mono);
    }
    return acc || num(0);
  }
  // ───────────────────── Schöner LaTeX-Ausdruck (Lehrbuchschreibweise) ─────────────────────
  // 2x\cos(x^{2}), \frac{a}{b}, e^{2x}, \sqrt{u}; Vorzeichen vor den Faktoren; Malpunkt nur zwischen Zahlen/Brüchen
  const TRIG = { sin: '\\sin', cos: '\\cos', tan: '\\tan', asin: '\\arcsin', acos: '\\arccos', atan: '\\arctan' };
  function mulFactors(n, out) { if (n.type === 'mul') { mulFactors(n.a, out); mulFactors(n.b, out); } else out.push(n); return out; }
  function pr(n) {
    switch (n.type) {
      case 'num': { const v = String(n.v).replace(',', '.'); return v.charAt(0) === '-' ? { s: v, p: 1, neg: true, num: true } : { s: v, p: 4, num: true }; }
      case 'id': return { s: n.v === 'EC' ? 'e' : n.v === 'pi' ? '\\pi' : n.v, p: 4 };
      case 'neg': { const r = pr(n.x); return { s: '-' + (r.p < 2 ? '\\left(' + r.s + '\\right)' : r.s), p: 1, neg: true }; }
      case 'add': { const a = pr(n.a), b = pr(n.b); return { s: a.s + (b.neg ? '' : '+') + b.s, p: 1, sum: true }; }
      case 'sub': { const a = pr(n.a), b = pr(n.b); return { s: b.neg ? a.s + '+' + b.s.slice(1) : a.s + '-' + (b.sum ? '\\left(' + b.s + '\\right)' : b.s), p: 1, sum: true }; }
      case 'mul': {
        let fs = mulFactors(n, []), sign = 1;
        fs = fs.map(f => { while (f.type === 'neg' || (f.type === 'num' && String(f.v).charAt(0) === '-')) { if (f.type === 'neg') f = f.x; else f = { type: 'num', v: String(f.v).slice(1) }; sign = -sign; } return f; });
        const rank = f => (f.type === 'num' ? 0 : (f.type === 'id' || (f.type === 'pow' && f.a.type === 'id' && f.a.v !== 'EC' && f.b.type !== 'x')) ? 1 : f.type === 'call' && f.name !== 'exp' ? 2 : (f.type === 'pow' && f.a.type === 'id' && f.a.v === 'EC') || (f.type === 'call' && f.name === 'exp') ? 3 : 4);
        fs = fs.map((f, i) => ({ f, i })).sort((A, B) => rank(A.f) - rank(B.f) || A.i - B.i).map(o => o.f);
        const ps = fs.map(f => { const r = pr(f); return r.p < 2 ? { s: '\\left(' + r.s + '\\right)', p: 4, num: false, par: true } : r; });
        let out = '';
        ps.forEach((r, i) => {
          if (i > 0) {
            const prev = ps[i - 1], prevNode = fs[i - 1], node = fs[i];
            const needDot = (prev.num && (r.num || /^[0-9]/.test(r.s))) || prevNode.type === 'div' || node.type === 'div' || (prev.par && r.par);
            const thin = !prev.num && !r.par && (/^(e\^|\\[A-Za-z])/.test(r.s)) && !/^\\frac|^\\left/.test(r.s);
            out += needDot ? '\\cdot ' : thin ? '\\,' : '';
          }
          out += r.s;
        });
        return { s: (sign < 0 ? '-' : '') + out, p: sign < 0 ? 1 : 2, neg: sign < 0 };
      }
      case 'div': { const a = pr(n.a), b = pr(n.b); return { s: '\\frac{' + a.s + '}{' + b.s + '}', p: 2 }; }
      case 'pow': {
        const e = n.b, b0 = n.a;
        if (e.type === 'div' && e.a.type === 'num' && e.a.v === '1' && e.b.type === 'num') {
          const r = pr(b0); return { s: (e.b.v === '2' ? '\\sqrt{' : '\\sqrt[' + e.b.v + ']{') + r.s + '}', p: 4 };
        }
        if (b0.type === 'id' && b0.v === 'EC') return { s: 'e^{' + pr(e).s + '}', p: 4 };
        if (b0.type === 'call' && TRIG[b0.name] && b0.args.length === 1 && (e.type === 'num')) { const a = pr(b0.args[0]); return { s: TRIG[b0.name] + '^{' + pr(e).s + '}(' + a.s + ')', p: 4 }; }
        const r = pr(b0), re = pr(e);
        return { s: (r.p < 4 ? '\\left(' + r.s + '\\right)' : r.s) + '^{' + re.s + '}', p: 3.5 };
      }
      case 'call': {
        const a = n.args.map(pr), f = n.name, A = a[0] ? a[0].s : '';
        if (TRIG[f]) return { s: TRIG[f] + (/\\frac/.test(A) ? '\\left(' + A + '\\right)' : '(' + A + ')'), p: 4 };
        if (f === 'log') return { s: '\\ln' + (/\\frac/.test(A) ? '\\left(' + A + '\\right)' : '(' + A + ')'), p: 4 };
        if (f === 'exp') return { s: 'e^{' + A + '}', p: 4 };
        if (f === 'sqrt') return { s: '\\sqrt{' + A + '}', p: 4 };
        if (f === 'abs') return { s: '\\left|' + A + '\\right|', p: 4 };
        return { s: '\\operatorname{' + f + '}(' + a.map(q => q.s).join(',') + ')', p: 4 };
      }
      default: return { s: '?', p: 4 };
    }
  }
  const tex = n => { try { return pr(n).s; } catch (e) { return T(n); } };
  // ausmultiplizierter Polynomterm (nur Summe von Monomen c·x^k)? Dann Standarddarstellung des Polynoms
  function isMono(n) {
    if (!hasX(n)) return n.type === 'num' || n.type === 'neg' || n.type === 'div' || n.type === 'sub' ? !hasX(n) : !hasX(n);
    if (isXn(n)) return true;
    if (n.type === 'neg') return isMono(n.x);
    if (n.type === 'mul') return (!hasX(n.a) && isMono(n.b)) || (!hasX(n.b) && isMono(n.a));
    if (n.type === 'div') return !hasX(n.b) && isMono(n.a);
    return false;
  }
  const isXn = n => (n.type === 'id' && n.v === 'x') || (n.type === 'pow' && n.a.type === 'id' && n.a.v === 'x' && !hasX(n.b));
  function isExpanded(n) { return (n.type === 'add' || n.type === 'sub') ? isExpanded(n.a) && isExpanded(n.b) : isMono(n); }
  // ausmultiplizierte Teil-Polynome (mind. 2 Summanden) in Standardform bringen
  function canon(n) {
    if (!n || typeof n !== 'object') return n;
    if ((n.type === 'add' || n.type === 'sub') && hasX(n) && isExpanded(n)) { let P = null; try { P = E.polyFromAst(n, 'x'); } catch (e) { P = null; } if (P) return polyAst(P); }
    switch (n.type) {
      case 'num': case 'id': return n;
      case 'neg': return { type: 'neg', x: canon(n.x) };
      case 'call': return { type: 'call', name: n.name, args: n.args.map(canon) };
      default: return { type: n.type, a: canon(n.a), b: canon(n.b) };
    }
  }
  // Ausdruck als LaTeX: ausmultiplizierte Polynome in Standardform (absteigend), sonst Lehrbuchschreibweise
  function tx(n) {
    if (isExpanded(n) && hasX(n)) { let P = null; try { P = E.polyFromAst(n, 'x'); } catch (e) { P = null; } if (P) return E.pTex(P, 'x'); }
    return tex(canon(simp(n)));
  }
  // in Klammern, wenn eine Summe/Differenz (für Einsetzen in Produkte)
  const txP = n => { const m = simp(n); return (m.type === 'add' || m.type === 'sub' || (m.type === 'neg')) ? '\\left(' + tx(n) + '\\right)' : tx(n); };
  // Ausdruck genau wie eingegeben (ohne Vereinfachung)
  const txRaw = n => tex(n);

  // Funktion aus Rohausdruck. null, falls ungültig oder nirgends definiert.
  function makeFn(raw) {
    let ast;
    try { ast = miParseRaw(String(raw || '').trim()); } catch (e) { return null; }
    if (!ast) return null;
    let P = null; try { P = E.polyFromAst(ast, 'x'); } catch (e) { P = null; }
    const F = { raw: String(raw).trim(), ast, P, ders: [ast], fns: [] };
    F.fns[0] = x => S.evalNum(ast, x);
    // erlaubt nur den Ausdruck in x (keine freien Parameter)
    let ok = false;
    for (const x of [1, 2, 0.5, -1, 3, 0.1, -2, 0.7, 5]) { const v = F.fns[0](x); if (isFinite(v)) { ok = true; break; } }
    if (!ok) return null;
    F.deriv = k => {                                       // k-te Ableitung als AST (Cache)
      while (F.ders.length <= k) {
        const prev = F.ders[F.ders.length - 1];
        let d;
        if (F.P) { const Pk = F.P.slice(); let q = Pk; for (let i = 0; i < F.ders.length; i++) q = E.pDeriv(q); d = polyAst(q); }
        else { try { d = (typeof calcDiff === 'function' ? calcDiff(prev, 'x') : null) || calcDiffOwn(prev, 'x'); } catch (e) { try { d = calcDiffOwn(prev, 'x'); } catch (e2) { d = null; } } }
        if (!d) return null;
        F.ders.push(d);
      }
      return F.ders[k];
    };
    F.f = k => {                                           // numerische Funktion der k-ten Ableitung
      if (!F.fns[k]) { const a = F.deriv(k); if (!a) return () => NaN; F.fns[k] = x => S.evalNum(a, x); }
      return F.fns[k];
    };
    return F;
  }

  // ───────────────────── Zahlen ─────────────────────
  const MINUS = '−';
  // Zahl kurz und ohne Rundungsrauschen: höchstens d Nachkommastellen, ohne Nullen am Ende
  function fmt(v, d) {
    if (!isFinite(v)) return '?';
    d = d === undefined ? 4 : d;
    let s = String(parseFloat(v.toFixed(d)));
    if (s === '-0') s = '0';
    return s;
  }
  const fmtM = (v, d) => fmt(v, d).replace('-', MINUS);          // mit echtem Minuszeichen (Anzeige)
  const fmtT = (v, d) => fmt(v, d);                              // LaTeX: ASCII-Minus
  // x0 (Kommazahl) → exakter Bruch, wenn es eine «schöne» Zahl ist
  function toQ(x) { return E.qFromFloat ? E.qFromFloat(x) : E.qFromDec ? E.qFromDec(String(x)) : null; }
  function qOf(x) {
    let q = null; try { q = E.qFromFloat(x); } catch (e) { q = null; }
    if (!q) { const r = Math.round(x * 1e6) / 1e6; try { q = E.qFromDec(String(r)); } catch (e) { q = null; } }
    return q;
  }
  const exactTex = fe => E.feTex(fe);

  // ───────────────────── Differenzenquotient numerisch ─────────────────────
  const H_RIGHT = [2, 1, 0.5, 0.1, 0.01, 0.001];
  function dqTable(F, x0) {
    const f = F.f(0), f0 = f(x0), res = { x0, f0, right: [], left: [], status: 'ok' };
    if (!isFinite(f0)) { res.status = 'undef'; return res; }
    H_RIGHT.forEach(h => {
      res.right.push({ h, y: f(x0 + h), dq: (f(x0 + h) - f0) / h });
      res.left.push({ h: -h, y: f(x0 - h), dq: (f(x0 - h) - f0) / -h });
    });
    const e = 1e-6, dR = (f(x0 + e) - f0) / e, dL = (f(x0 - e) - f0) / -e;
    res.limR = dR; res.limL = dL;
    const fin = isFinite(dR) && isFinite(dL);
    if (!fin) res.status = 'undef';
    else if (Math.abs(dR - dL) > 1e-3 * (1 + Math.abs(dR) + Math.abs(dL))) res.status = 'kink';
    else if (Math.abs(dR) > 1e5) res.status = 'steep';
    // Ableitung (exakt über die symbolische Ableitung, sonst Näherung)
    const d1 = F.f(1)(x0);
    res.fp = isFinite(d1) ? d1 : (res.status === 'ok' ? (dR + dL) / 2 : NaN);
    return res;
  }

  // ───────────────────── Winkel/Hilfen ─────────────────────
  const fact = n => { let r = 1n; for (let i = 2n; i <= BigInt(n); i++) r *= i; return r; };
  const binom = (n, k) => fact(n) / (fact(k) * fact(n - k));

  return { E, S, makeFn, polyAst, tx, txP, txRaw, tex, isExpanded, T, simp, fmt, fmtM, fmtT, qOf, hasX, dqTable, H_RIGHT, fact, binom, DOC, MINUS, exactTex, xp };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Dif;
