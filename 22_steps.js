// ═══════════════════════════════════════════════════════════════════
// MODUL 22: steps — Lösungswege für Nullstellen, y-Achsenabschnitt,
// Hoch-/Tiefpunkte, Wendepunkte und Schnittpunkte (Schulstil, exakt).
//
// Baut auf 20_exact.js (exakte Arithmetik), 21_solver.js / 21b_equation.js
// (Gleichungslöser mit Rechenweg) auf. Teil 2 (22b_steps_asymptotes.js)
// ergänzt Polstellen, Lücken, Asymptoten, Grenzwerte und hängt die neue
// Engine in die Oberfläche ein (generateSolveSteps / Grenzwert-Tooltip).
//
// Darstellung: Fliesstext in KaTeX_Main (wie das Eingabefeld), ALLE Formeln
// und Zahlen über MathLive.convertLatexToMarkup — also exakt dieselbe
// Schrift wie im Eingabefeld.
// ═══════════════════════════════════════════════════════════════════
const ST = (function () {
  const E = EX, S = SV;
  const { Doc, num, bin, neg, call, idn, T, TC, par, evalNum, fmtNum, rootFe, rootNum, sortDedupe } = S;

  // ───────────────────── HTML-Darstellung eines Doc ─────────────────────
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const ML = latex => (typeof latexToMathLiveHtml === 'function') ? latexToMathLiveHtml(latex) : esc(latex);
  function inline(t) {
    return String(t).split(/(\$[^$]+\$)/).map(part => {
      if (part.length > 1 && part.charAt(0) === '$' && part.charAt(part.length - 1) === '$') return '<span class="sv-m">' + ML(part.slice(1, -1)) + '</span>';
      return esc(part).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/&lt;br&gt;/g, '<br>');
    }).join('');
  }
  function renderBlocks(bl) {
    return bl.map(b => {
      switch (b.k) {
        case 'h': return '<div class="sv-h">' + inline(b.t) + '</div>';
        case 'p': return '<div class="sv-p">' + inline(b.t) + '</div>';
        case 'e': return '<div class="sv-eq"><span class="sv-m sv-f">' + ML(b.t) + '</span>' +
          (b.op ? (/^[A-Za-z]/.test(b.op) && !/\\/.test(b.op) ? '<span class="sv-op">' + esc(b.op) + '</span>' : '<span class="sv-op" translate="no">' + ML(b.op) + '</span>') : '') + '</div>';
        case 'res': return '<div class="sv-res">' + inline(b.t) + '</div>';
        case 'note': return '<div class="sv-note">' + inline(b.t) + '</div>';
        case 'sub': return '<div class="sv-sub">' + renderBlocks(b.b) + '</div>';
        default: return '';
      }
    }).join('');
  }
  const renderDoc = d => '<div class="sv">' + renderBlocks(d.b) + '</div>';

  // ───────────────────── Funktion → AST ─────────────────────
  const fName = (fi, k) => 'f_{' + (fi + 1) + '}' + (k === 1 ? "'" : k === 2 ? "''" : k === 3 ? "'''" : '');
  // a + (−b) → a − b,  a − (−b) → a + b  (entsteht beim Einsetzen negativer Parameterwerte)
  function tidySigns(n) {
    switch (n.type) {
      case 'num': case 'id': return n;
      case 'neg': return neg(tidySigns(n.x));
      case 'call': return call(n.name, ...n.args.map(tidySigns));
      case 'add': case 'sub': {
        const a = tidySigns(n.a), b = tidySigns(n.b);
        if (b.type === 'neg') return bin(n.type === 'add' ? 'sub' : 'add', a, b.x);
        return bin(n.type, a, b);
      }
      default: return bin(n.type, tidySigns(n.a), tidySigns(n.b));
    }
  }
  function astOf(fi) {
    const fn = functions[fi];
    if (!fn || !fn.expr || !fn.expr.trim()) return null;
    try { return tidySigns(S.substParams(miParseRaw(fn.expr.trim()))); } catch (e) { return null; }
  }
  function winFor(x0) {
    const lo = Math.min(view.xmin, x0 - 1), hi = Math.max(view.xmax, x0 + 1);
    return [lo, hi];
  }
  const xTex = r => r.tex;
  const coord = (xt, yt) => '(' + xt + '\\,|\\,' + yt + ')';

  // ───────────────────── Polynom → AST (absteigend) ─────────────────────
  const xp = k => k === 1 ? idn('x') : bin('pow', idn('x'), num(k));
  function polyToAst(P) {
    P = E.pTrim(P);
    let acc = null;
    for (let k = P.length - 1; k >= 0; k--) {
      const c = P[k]; if (E.qIsZero(c)) continue;
      const ng = c.n < 0n, a = E.qAbs(c);
      let mono;
      if (k === 0) mono = E.astQ(a);
      else if (E.qEq(a, E.q1)) mono = xp(k);
      else mono = bin('mul', E.astQ(a), xp(k));
      acc = acc === null ? (ng ? neg(mono) : mono) : bin(ng ? 'sub' : 'add', acc, mono);
    }
    return acc || num(0);
  }
  const pT = P => E.pTex(P, 'x');
  const pPar = P => (E.pTrim(P).filter(c => !E.qIsZero(c)).length > 1) ? '\\left(' + pT(P) + '\\right)' : pT(P);

  // ───────────────────── Ableitungen (Zustände) ─────────────────────
  //   poly {P}            Polynom
  //   rat  {N, Den, base, pw}   N / base^pw   (Den = base^pw ausmultipliziert)
  //   pe   {P, k, c}      P(x)·e^{kx}
  //   gen  {ast}          sonst
  const expArgOf = f => (f.type === 'call' && f.name === 'exp') ? f.args[0] : (f.type === 'pow' && f.a.type === 'id' && f.a.v === 'EC') ? f.b : null;
  // P(x)·e^{g(x)} mit Polynomen P, g (Grad g ≥ 1); auch  P/e^{g}  und  P/Konstante
  function expFactor(ast) {
    const fs = [];
    (function rec(m) {
      if (m.type === 'mul') { rec(m.a); rec(m.b); }
      else if (m.type === 'neg') { fs.push(num(-1)); rec(m.x); }
      else if (m.type === 'div') {
        const gb = expArgOf(m.b);
        if (gb) { rec(m.a); fs.push(bin('pow', idn('EC'), neg(gb))); return; }
        const Pb = E.polyFromAst(m.b);
        if (Pb && E.pDeg(Pb) === 0 && !E.qIsZero(Pb[0])) { rec(m.a); fs.push(E.astQ(E.qInv(Pb[0]))); return; }
        fs.push(m);
      }
      else fs.push(m);
    })(ast);
    let P = [E.q1], g = null, bad = false;
    fs.forEach(f => {
      const ge = expArgOf(f);
      if (ge) {
        const gp = E.polyFromAst(ge);
        if (!gp || g || E.pDeg(gp) < 1) { bad = true; return; }
        g = gp; return;
      }
      const p = E.polyFromAst(f);
      if (!p) { bad = true; return; }
      P = E.pMul(P, p);
    });
    if (bad || !g) return null;
    return { P, g };
  }
  function pePart(ast) {                       // P(x)·e^{kx}  → {P,k} | null
    const r = expFactor(ast);
    if (!r) return null;
    const g = E.pTrim(r.g);
    if (g.length === 2 && E.qIsZero(g[0])) return { P: r.P, k: g[1] };
    return null;
  }
  function toState(ast) {
    const P = E.polyFromAst(ast);
    if (P) return { t: 'poly', P };
    const pe = pePart(ast);
    if (pe) return { t: 'pe', P: pe.P, k: pe.k };
    const pg = expFactor(ast);
    if (pg) return { t: 'pg', P: pg.P, g: pg.g };
    const RF = E.ratFromAst(ast);
    if (RF && E.pDeg(RF.D) >= 1) {
      const red = E.ratReduce(RF);
      const pr = E.pPrimitive(red.D);                       // pr.P = k·D
      const N = E.pScale(red.N, pr.k);
      return { t: 'rat', N, Den: pr.P, base: pr.P, pw: 1 };
    }
    return { t: 'gen', ast };
  }
  const expTex = k => 'e^{' + (E.qEq(k, E.q1) ? '' : E.qEq(k, E.qNeg(E.q1)) ? '-' : E.qTex(k)) + 'x}';
  function stateAst(s) {
    switch (s.t) {
      case 'poly': return polyToAst(s.P);
      case 'rat': return bin('div', polyToAst(s.N), s.pw >= 1 && s.base ? (s.pw === 1 ? polyToAst(s.base) : bin('pow', polyToAst(s.base), num(s.pw))) : polyToAst(s.Den));
      case 'pe': {
        const g = E.qEq(s.k, E.q1) ? idn('x') : bin('mul', E.astQ(s.k), idn('x'));
        const ex = bin('pow', idn('EC'), g);
        if (E.pDeg(s.P) === 0 && E.qEq(s.P[0], E.q1)) return ex;
        if (E.pDeg(s.P) === 0 && E.qEq(s.P[0], E.qNeg(E.q1))) return neg(ex);
        return bin('mul', polyToAst(s.P), ex);
      }
      case 'pg': {
        const ex = bin('pow', idn('EC'), polyToAst(s.g));
        if (E.pDeg(s.P) === 0 && E.qEq(s.P[0], E.q1)) return ex;
        if (E.pDeg(s.P) === 0 && E.qEq(s.P[0], E.qNeg(E.q1))) return neg(ex);
        return bin('mul', polyToAst(s.P), ex);
      }
      default: return s.ast;
    }
  }
  function stateTex(s) {
    switch (s.t) {
      case 'poly': return pT(s.P);
      case 'rat': return '\\frac{' + pT(s.N) + '}{' + (s.base && s.pw >= 1 ? (s.pw === 1 ? pT(s.base) : '\\left(' + pT(s.base) + '\\right)^{' + s.pw + '}') : pT(s.Den)) + '}';
      case 'pe': {
        if (E.pDeg(s.P) === 0 && E.qEq(s.P[0], E.q1)) return expTex(s.k);
        if (E.pDeg(s.P) === 0 && E.qEq(s.P[0], E.qNeg(E.q1))) return '-' + expTex(s.k);
        return pPar(s.P) + '\\cdot ' + expTex(s.k);
      }
      case 'pg': {
        const ex = 'e^{' + pT(s.g) + '}';
        if (E.pDeg(s.P) === 0 && E.qEq(s.P[0], E.q1)) return ex;
        if (E.pDeg(s.P) === 0 && E.qEq(s.P[0], E.qNeg(E.q1))) return '-' + ex;
        return pPar(s.P) + '\\cdot ' + ex;
      }
      default: return T(s.ast);
    }
  }
  // Ableiten: {s: neuer Zustand, rule: Regeltext, lines: [LaTeX…]}
  function diffState(s, fn) {
    switch (s.t) {
      case 'poly': {
        const d = E.pDeriv(s.P);
        return { s: { t: 'poly', P: d }, rule: 'Potenzregel $(x^{n})\'=n\\cdot x^{n-1}$ und Summenregel (jeden Summanden einzeln ableiten)', lines: [] };
      }
      case 'pe': {
        const dP = E.pDeriv(s.P), kP = E.pScale(s.P, s.k), Pn = E.pAdd(dP, kP);
        const lines = ['\\left(' + pT(s.P) + '\\right)\'\\cdot ' + expTex(s.k) + '+' + pPar(s.P) + '\\cdot\\left(' + expTex(s.k) + '\\right)\'',
          pPar(dP.length ? dP : [E.q0]) + '\\cdot ' + expTex(s.k) + '+' + pPar(s.P) + '\\cdot ' + (E.qEq(s.k, E.q1) ? '' : E.qTexP(s.k) + '\\cdot ') + expTex(s.k)];
        return { s: { t: 'pe', P: Pn, k: s.k }, rule: 'Produktregel $(u\\cdot v)\'=u\'\\cdot v+u\\cdot v\'$ mit $(e^{kx})\'=k\\cdot e^{kx}$ (Kettenregel)', lines, ausklammern: true };
      }
      case 'pg': {
        const dP = E.pDeriv(s.P), gd = E.pDeriv(s.g), Pn = E.pAdd(dP, E.pMul(s.P, gd));
        const ex = 'e^{' + pT(s.g) + '}';
        const wN = P => { const t = pPar(P); return t.charAt(0) === '-' ? '\\left(' + t + '\\right)' : t; };
        const lines = ['\\left(' + pT(s.P) + '\\right)\'\\cdot ' + ex + '+' + wN(s.P) + '\\cdot\\left(' + ex + '\\right)\'',
          wN(dP.length ? dP : [E.q0]) + '\\cdot ' + ex + '+' + wN(s.P) + '\\cdot\\left(' + pT(gd) + '\\right)\\cdot ' + ex];
        return { s: { t: 'pg', P: Pn, g: s.g }, rule: 'Produktregel $(u\\cdot v)\'=u\'\\cdot v+u\\cdot v\'$ mit $\\left(e^{g(x)}\\right)\'=g\'(x)\\cdot e^{g(x)}$ (Kettenregel)', lines, ausklammern: true };
      }
      case 'rat': {
        if (!s.base) s = { t: 'rat', N: s.N, Den: s.Den, base: s.Den, pw: 1 };
        const Nd = E.pDeriv(s.N), bd = E.pDeriv(s.base);
        const t1 = E.pMul(Nd, s.base), t2 = E.pScale(E.pMul(s.N, bd), E.Q(s.pw));
        const N1 = E.pSub(t1, t2), D1 = E.pPow(s.base, s.pw + 1);
        const lines = [];
        const u = '\\left(' + pT(s.N) + '\\right)', v = s.pw === 1 ? '\\left(' + pT(s.base) + '\\right)' : '\\left(' + pT(s.base) + '\\right)^{' + s.pw + '}';
        const vd = '\\left(' + pT(E.pMul(E.pDeriv(s.base), [E.Q(s.pw)])) + '\\right)';
        if (s.pw === 1) {
          lines.push('\\frac{\\left(' + pT(Nd) + '\\right)\\cdot\\left(' + pT(s.base) + '\\right)-\\left(' + pT(s.N) + '\\right)\\cdot\\left(' + pT(bd) + '\\right)}{\\left(' + pT(s.base) + '\\right)^{2}}');
        } else {
          lines.push('\\frac{\\left(' + pT(Nd) + '\\right)\\cdot\\left(' + pT(s.base) + '\\right)-' + s.pw + '\\cdot\\left(' + pT(s.N) + '\\right)\\cdot\\left(' + pT(bd) + '\\right)}{\\left(' + pT(s.base) + '\\right)^{' + (s.pw + 1) + '}}');
        }
        // kürzen
        let N2 = N1, base = s.base, pw = s.pw + 1, Den = D1, cancelled = false;
        if (!E.pIsZero(N1)) {
          const g = E.pGcd(N1, D1);
          if (E.pDeg(g) >= 1) {
            N2 = E.pDivmod(N1, g).q; Den = E.pDivmod(D1, g).q; cancelled = true;
            // Nenner wieder als Potenz von base darstellbar?
            let found = null;
            for (let j = pw; j >= 1; j--) {
              const cand = E.pPow(s.base, j), q = E.pDivmod(Den, cand);
              if (E.pIsZero(q.r) && E.pDeg(q.q) === 0) { found = { j, c: q.q[0] }; break; }
            }
            if (found) { pw = found.j; N2 = E.pScale(N2, found.c); Den = E.pPow(s.base, pw); }
            else { base = null; pw = 0; }
          }
        }
        // Zähler-Vorzeichen/Skalar: ggf. gemeinsamen rationalen Faktor in den Zähler belassen
        const ns = { t: 'rat', N: N2, Den, base, pw };
        return { s: ns, rule: 'Quotientenregel $\\left(\\frac{u}{v}\\right)\'=\\frac{u\'\\cdot v-u\\cdot v\'}{v^{2}}$', lines, cancelled, unsimp: { N: N1, D: D1 } };
      }
      default: {
        let d;
        try { d = calcSimplify(calcDiff(s.ast, 'x')); } catch (e) { return null; }
        const names = [];
        (function rec(n) {
          if (!n || typeof n !== 'object') return;
          if (n.type === 'mul' && containsX(n.a) && containsX(n.b)) names.push('Produktregel');
          if (n.type === 'div' && containsX(n.b)) names.push('Quotientenregel');
          if (n.type === 'call' && n.args[0] && n.args[0].type !== 'id' && containsX(n.args[0])) names.push('Kettenregel');
          if (n.type === 'pow' && containsX(n.a) && n.a.type !== 'id' && !containsX(n.b)) names.push('Kettenregel');
          ['a', 'b', 'x'].forEach(k => { if (n[k]) rec(n[k]); });
          if (n.args) n.args.forEach(rec);
        })(s.ast);
        const uniq = names.filter((v, i) => names.indexOf(v) === i);
        return { s: { t: 'gen', ast: d }, rule: uniq.length ? 'Verwendete Regeln: ' + uniq.join(', ') + '.' : 'Standardableitungen der Grundfunktionen.', lines: [] };
      }
    }
  }
  const containsX = n => S.containsX(n);

  // Ableitungskette f, f', f'', f''' als Doc-Zeilen + Zustände
  function derivChain(fi, ast, upto, doc) {
    const st = [toState(ast)];
    const hdr = [];
    for (let k = 1; k <= upto; k++) {
      const r = diffState(st[k - 1]);
      if (!r) return null;
      st.push(r.s);
      hdr.push(r);
    }
    // Ausgabe
    const rules = hdr.filter((r, i) => hdr.findIndex(q => q.rule === r.rule) === i).map(r => r.rule);
    rules.forEach(rl => doc.p(rl.charAt(rl.length - 1) === '.' ? rl : rl + ':'));
    for (let k = 1; k <= upto; k++) {
      const r = hdr[k - 1];
      let first = true;
      const fl = fName(fi, k) + '(x)';
      if (r.lines.length) {
        r.lines.forEach((ln, i) => {
          doc.e((i === 0 ? fl + '=' : '=') + ln);
        });
        if (r.cancelled) doc.e('=' + stateTex(r.s) + '\\quad(\\text{gekürzt})');
        else doc.e('=' + stateTex(r.s));
      } else doc.e(fl + '=' + stateTex(r.s));
    }
    return st;
  }

  function cleanTex(t) {
    return t.replace(/-\(\{e\}\^\{-1\}\)/g, '-\\frac{1}{e}').replace(/\{e\}\^\{-1\}/g, '\\frac{1}{e}')
      .replace(/-\((\{e\}\^\{[^{}]*\})\)/g, '-$1');
  }
  // ───────────────────── Auswertung an einer Stelle ─────────────────────
  // → {val, tex, subTex, exact, sgn}
  function valueAt(ast, root) {
    const rAst = root.ast || num(String(root.val));
    let sub, subTex = '';
    try { sub = calcSubstitute(ast, 'x', rAst); } catch (e) { sub = null; }
    try {
      // Einsetzen als Text: Platzhalter → Wert (negative Zahlen/Brüche/Summen in Klammern)
      const ph = T(calcSubstitute(ast, 'x', idn('ZZZ')));
      const rt = root.tex || '';
      const needs = /^-|\\frac|\d[+-]|[A-Za-z\\)}][+-]/.test(rt);
      const wrap = needs ? '\\left(' + rt + '\\right)' : rt;
      let t = ph;
      if (t === 'ZZZ') subTex = rt;
      else {
        t = t.replace(/(\d)\s*(\{?)ZZZ/g, '$1\\cdot $2ZZZ').replace(/ZZZ\s+(?=[{a-zA-Z(]|\\(?!cdot|left|right|quad))/g, 'ZZZ\\cdot ');
        t = t.replace(/\^\{ZZZ\}/g, '^{@E@}').replace(/\{ZZZ\}\^/g, '{@W@}^')
             .replace(/\\left\(ZZZ\\right\)/g, '\\left(@E@\\right)').replace(/\(ZZZ\)/g, '(@E@)')
             .replace(/\\left\(ZZZ/g, '\\left(@E@').replace(/\(ZZZ/g, '(@E@');
        subTex = t.replace(/@E@/g, rt).replace(/@W@/g, wrap).replace(/ZZZ/g, wrap);
      }
    } catch (e) { subTex = sub ? T(sub) : ''; }
    const direct = evalNum(ast, root.val);
    let tex = null, exact = false, val = direct, sgn = null;
    if (root.fe) {
      const fe = E.evalFe(ast, root.fe);
      if (fe) { tex = E.feTex(fe); exact = true; val = E.feNum(fe); sgn = E.feSgn(fe); }
    }
    if (tex === null && root.fe) {                              // P(x0)·e^{g(x0)}: Exponent exakt auswerten
      try {
        const st = toState(ast);
        if (st.t === 'pe' || st.t === 'pg') {
          const g = st.t === 'pe' ? [E.q0, st.k] : st.g;
          const gv = E.evalFe(polyToAst(g), root.fe), pv = E.evalFe(polyToAst(st.P), root.fe);
          if (gv && pv) {
            const gn = E.feNum(gv), pn = E.feNum(pv), pTex = E.feTex(pv);
            const eT = E.feIsZero && E.feIsZero(gv) ? null : 'e^{' + E.feTex(gv) + '}';
            if (E.feSgn(pv) === 0) tex = '0';
            else if (!eT) tex = pTex;
            else if (pTex === '1') tex = (E.feIsRat(gv) && E.qEq(gv.p, E.qNeg(E.q1))) ? '\\frac{1}{e}' : eT;
            else if (pTex === '-1') tex = (E.feIsRat(gv) && E.qEq(gv.p, E.qNeg(E.q1))) ? '-\\frac{1}{e}' : '-' + eT;
            else tex = (/[+-]/.test(pTex.slice(1)) ? '\\left(' + pTex + '\\right)' : pTex) + '\\cdot ' + eT;
            if (tex !== null) { exact = true; val = pn * Math.exp(gn); sgn = E.feSgn(pv); }
          }
        }
      } catch (e) { tex = null; }
    }
    if (tex === null && sub && root.exact !== false) {
      try {
        const s = S.simpConst(sub), v1 = evalNum(s, 0);
        if (isFinite(v1) && isFinite(direct) && Math.abs(v1 - direct) <= 1e-9 * (1 + Math.abs(direct))) { tex = TC(s); exact = true; val = v1; }
      } catch (e) { /* weiter */ }
    }
    if (tex === null) { tex = fmtNum(direct); exact = false; }
    tex = cleanTex(tex);
    if (sgn === null) sgn = Math.abs(val) < 1e-9 ? 0 : (val > 0 ? 1 : -1);
    return { val, tex, subTex: cleanTex(subTex), exact, sgn };
  }
  const cmpTex = (v) => v.sgn > 0 ? '>0' : v.sgn < 0 ? '<0' : '=0';
  function chainTex(prefix, v) {                       // "prefix = subst = value" (Substitution nur, wenn nicht zu lang)
    let t = prefix;
    if (v.subTex && v.subTex.length <= 90 && v.subTex.replace(/\s/g, '') !== v.tex.replace(/\s/g, '')) t += '=' + v.subTex;
    return t + (v.exact ? '=' : '\\approx ') + v.tex;
  }
  function nearest(roots, x0, tol) {
    let best = null, bd = Infinity;
    roots.forEach(r => { const d = Math.abs(r.val - x0); if (d < bd) { bd = d; best = r; } });
    return best && bd <= (tol || 1e-4) * (1 + Math.abs(x0)) ? best : null;
  }
  const approxNote = d => d.note('Diese Gleichung lässt sich nicht exakt lösen. Der Wert ist eine **numerische Näherung** (≈).');

  // ───────────────────── y-Achsenabschnitt ─────────────────────
  function buildYAxis(pt) {
    const ast = astOf(pt.fi); if (!ast) return null;
    const d = new Doc(), fi = pt.fi;
    d.p('Der Graph schneidet die y-Achse dort, wo $x=0$ ist. Also $' + fName(fi, 0) + '(0)$ berechnen:');
    const v = valueAt(ast, { val: 0, fe: E.feInt(0), ast: num(0), tex: '0', exact: true });
    if (!isFinite(v.val)) { d.res('$' + fName(fi, 0) + '(0)$ ist nicht definiert — es gibt **keinen** Schnittpunkt mit der y-Achse.'); return d; }
    d.e(chainTex(fName(fi, 0) + '(0)', v));
    d.res('Schnittpunkt mit der y-Achse: $S_y' + coord('0', v.tex) + '$');
    d.meta = { x: 0, y: v.val };
    return d;
  }

  // ───────────────────── Nullstellen ─────────────────────
  function listRoots(roots, name) {
    const show = roots.slice(0, 8);
    let t = show.map((r, i) => name + (roots.length > 1 ? '_{' + (i + 1) + '}' : '') + '=' + r.tex).join(',\\ ');
    if (roots.length > 8) t += ',\\ \\dots';
    return t;
  }
  function buildZero(pt) {
    const ast = astOf(pt.fi); if (!ast) return null;
    const d = new Doc(), fi = pt.fi;
    d.p('Nullstellen: Funktionswert $0$ setzen, also $' + fName(fi, 0) + '(x)=0$ lösen.');
    const sub = new Doc();
    const r = S.solveZero(sub, ast, { window: winFor(pt.x) });
    sub.b.forEach(b => d.b.push(b));
    const m = nearest(r.roots, pt.x);
    if (!m) return null;
    if (r.periodic) {
      d.res('Diese Nullstelle: $N' + coord(m.tex, '0') + '$ — wegen der Periodizität gibt es unendlich viele' + (m.fam ? ' (' + '$x=' + m.fam + '$, $k\\in\\mathbb{Z}$)' : '') + '.');
    } else {
      d.res(r.roots.length > 1 ? 'Alle Nullstellen: $' + listRoots(r.roots, 'x') + '$' : 'Nullstelle: $N' + coord(m.tex, '0') + '$');
    }
    if (!r.exact || !m.exact) approxNote(d);
    d.meta = { x: m.val, y: 0 };
    return d;
  }

  // ───────────────────── Extrema / Wendepunkte ─────────────────────
  // Vorzeichen der Ableitung links/rechts von x0 (Prüfstellen exakt rational)
  function signChange(dAst, x0, others) {
    const pts = others.filter(v => Math.abs(v - x0) > 1e-9).sort((a, b) => a - b);
    let left = x0 - 1, right = x0 + 1;
    const l = pts.filter(v => v < x0).pop(), rr = pts.filter(v => v > x0)[0];
    if (l !== undefined) left = (l + x0) / 2; else left = x0 - 1;
    if (rr !== undefined) right = (rr + x0) / 2; else right = x0 + 1;
    const simple = v => { const f = Math.round(v * 2) / 2; return Math.abs(f - v) < 0.5 * Math.abs(x0 - v) && f !== x0 ? f : parseFloat(v.toFixed(2)); };
    left = simple(left); right = simple(right);
    const sl = evalNum(dAst, left), sr = evalNum(dAst, right);
    return { left, right, sl, sr };
  }

  // Extremum an einem Knick der Betragsfunktion (nicht differenzierbar) → Funktionswerte vergleichen
  function buildKink(pt, ast) {
    if (JSON.stringify(ast).indexOf('"abs"') < 0) return null;
    const args = [];
    (function rec(n) {
      if (!n || typeof n !== 'object') return;
      if (n.type === 'call' && n.name === 'abs' && n.args.length === 1) args.push(n.args[0]);
      if (n.a) rec(n.a); if (n.b) rec(n.b); if (n.x) rec(n.x);
      if (n.args) n.args.forEach(rec);
    })(ast);
    const fi = pt.fi;
    for (const u of args) {
      const sub = new Doc();
      let r; try { r = S.solveZero(sub, u, { window: winFor(pt.x) }); } catch (e) { continue; }
      if (!r || !r.roots) continue;
      const m = nearest(r.roots, pt.x); if (!m) continue;
      const d = new Doc();
      d.p('Die Betragsfunktion $|' + T(u) + '|$ hat dort einen **Knick**, wo ihr Inhalt $0$ wird. An einem Knick ist $f$ **nicht differenzierbar** — die Bedingung $' + fName(fi, 1) + '(x)=0$ hilft nicht. Der Kandidat ist die Nullstelle des Betragsinhalts.');
      d.h('Knickstelle bestimmen');
      d.e(T(u) + '=0');
      sub.b.forEach(b => d.b.push(b));
      let h = 1; const others = r.roots.map(q => q.val).filter(v => Math.abs(v - m.val) > 1e-9);
      while (others.some(v => Math.abs(v - m.val) < 2 * h) && h > 0.01) h /= 2;
      d.h('Funktionswerte links und rechts vergleichen');
      const mk = x => ({ val: x, tex: fmtNum(x), ast: num(String(x)), exact: true });
      const vL = valueAt(ast, mk(m.val - h)), vM = valueAt(ast, m), vR = valueAt(ast, mk(m.val + h));
      d.e(chainTex(fName(fi, 0) + '(' + fmtNum(m.val - h) + ')', vL));
      d.e(chainTex(fName(fi, 0) + '(' + m.tex + ')', vM));
      d.e(chainTex(fName(fi, 0) + '(' + fmtNum(m.val + h) + ')', vR));
      const tol = 1e-9 * (1 + Math.abs(vM.val));
      const isMin = vL.val > vM.val + tol && vR.val > vM.val + tol, isMax = vL.val < vM.val - tol && vR.val < vM.val - tol;
      if (!isMin && !isMax) continue;
      if ((pt.kind === 'max' && isMin) || (pt.kind === 'min' && isMax)) continue;
      d.p(isMin ? 'Beide Nachbarwerte liegen **höher** als $' + fName(fi, 0) + '(' + m.tex + ')$ ⇒ **Tiefpunkt**.' : 'Beide Nachbarwerte liegen **tiefer** als $' + fName(fi, 0) + '(' + m.tex + ')$ ⇒ **Hochpunkt**.');
      const L = isMin ? 'T' : 'H';
      d.res((isMin ? 'Tiefpunkt' : 'Hochpunkt') + ': $' + L + coord(m.tex, vM.tex) + '$');
      if (!r.exact || !m.exact || !vM.exact) approxNote(d);
      d.meta = { x: m.val, y: vM.val };
      return d;
    }
    return null;
  }
  function buildExtremum(pt) {
    const ast = astOf(pt.fi); if (!ast) return null;
    { const k = buildKink(pt, ast); if (k) return k; }          // Knick der Betragsfunktion?
    const d = new Doc(), fi = pt.fi;
    d.h('1. Ableitungen bilden');
    const st = derivChain(fi, ast, 2, d); if (!st) return null;
    const d1 = stateAst(st[1]), d2 = stateAst(st[2]);
    d.h('2. Notwendige Bedingung: ' + '$' + fName(fi, 1) + '(x)=0$');
    const sub = new Doc();
    const r = S.solveZero(sub, d1, { window: winFor(pt.x) });
    sub.b.forEach(b => d.b.push(b));
    const m = nearest(r.roots, pt.x);
    if (!m) return null;
    d.h('3. Hinreichende Bedingung: ' + '$' + fName(fi, 2) + '(x_0)$ prüfen');
    d.p('Ist $' + fName(fi, 2) + '(x_0)<0$, liegt ein **Hochpunkt** vor, ist $' + fName(fi, 2) + '(x_0)>0$, ein **Tiefpunkt**.');
    const list = (r.roots.length <= 6 && !r.periodic) ? r.roots : [m];
    let clickedKind = null, clickedY = null;
    list.forEach(rt => {
      const v2 = valueAt(d2, rt);
      let kind = v2.sgn < 0 ? 'max' : v2.sgn > 0 ? 'min' : '0';
      d.e(chainTex(fName(fi, 2) + '(' + rt.tex + ')', v2) + cmpTex(v2) + '\\quad\\Rightarrow\\quad \\text{' + (kind === 'max' ? 'Hochpunkt' : kind === 'min' ? 'Tiefpunkt' : '?') + '}');
      if (kind === '0') {
        const sc = signChange(d1, rt.val, r.roots.map(q => q.val));
        d.p('$' + fName(fi, 2) + '(' + rt.tex + ')=0$ — kein Urteil möglich. **Vorzeichenwechsel** von $' + fName(fi, 1) + '$ prüfen: $' + fName(fi, 1) + '(' + fmtNum(sc.left) + ')' + (sc.sl > 0 ? '>0' : '<0') + '$ und $' + fName(fi, 1) + '(' + fmtNum(sc.right) + ')' + (sc.sr > 0 ? '>0' : '<0') + '$.');
        kind = sc.sl > 0 && sc.sr < 0 ? 'max' : sc.sl < 0 && sc.sr > 0 ? 'min' : 'none';
        d.p(kind === 'none' ? 'Kein Vorzeichenwechsel — **Terrassenpunkt**, kein Extremum.' : (kind === 'max' ? '$+\\to-$: **Hochpunkt**.' : '$-\\to+$: **Tiefpunkt**.'));
      }
      rt._kind = kind;
    });
    if (list.indexOf(m) < 0) list.push(m);
    clickedKind = m._kind || (valueAt(d2, m).sgn < 0 ? 'max' : 'min');
    d.h('4. y-Koordinate');
    const vy = valueAt(ast, m);
    d.e(chainTex(fName(fi, 0) + '(' + m.tex + ')', vy));
    const letter = (clickedKind === 'max' || (pt.kind === 'max' && !m._kind)) ? 'H' : 'T';
    d.res((letter === 'H' ? 'Hochpunkt' : 'Tiefpunkt') + ': $' + letter + coord(m.tex, vy.tex) + '$');
    if (!r.exact || !m.exact || !vy.exact) approxNote(d);
    // Konsistenz mit der numerischen Erkennung
    if ((pt.kind === 'max' && clickedKind === 'min') || (pt.kind === 'min' && clickedKind === 'max')) return null;
    d.meta = { x: m.val, y: vy.val };
    return d;
  }
  function buildInflection(pt) {
    const ast = astOf(pt.fi); if (!ast) return null;
    const d = new Doc(), fi = pt.fi;
    d.h('1. Ableitungen bilden');
    const st = derivChain(fi, ast, 3, d); if (!st) return null;
    const d1 = stateAst(st[1]), d2 = stateAst(st[2]), d3 = stateAst(st[3]);
    d.h('2. Notwendige Bedingung: ' + '$' + fName(fi, 2) + '(x)=0$');
    const sub = new Doc();
    const r = S.solveZero(sub, d2, { window: winFor(pt.x) });
    sub.b.forEach(b => d.b.push(b));
    const m = nearest(r.roots, pt.x, 3e-3);          // f'' numerisch ungenau, wenn f'''≈0
    if (!m) return null;
    d.h('3. Hinreichende Bedingung: ' + '$' + fName(fi, 3) + '(x_0)\\neq0$');
    const v3 = valueAt(d3, m);
    if (v3.sgn === 0) {                                        // f'''=0 → Vorzeichenwechsel von f'' prüfen
      d.e(chainTex(fName(fi, 3) + '(' + m.tex + ')', v3) + '=0');
      const sc = signChange(d2, m.val, r.roots.map(q => q.val));
      if (!(sc.sl * sc.sr < 0)) return null;
      d.p('$' + fName(fi, 3) + '(' + m.tex + ')=0$ — kein Urteil möglich. **Vorzeichenwechsel** von $' + fName(fi, 2) + '$ prüfen: $' + fName(fi, 2) + '(' + fmtNum(sc.left) + ')' + (sc.sl > 0 ? '>0' : '<0') + '$ und $' + fName(fi, 2) + '(' + fmtNum(sc.right) + ')' + (sc.sr > 0 ? '>0' : '<0') + '$.');
      d.p('$' + fName(fi, 2) + '$ wechselt das Vorzeichen ⇒ **Wendepunkt**.');
    } else
    d.e(chainTex(fName(fi, 3) + '(' + m.tex + ')', v3) + '\\neq0\\quad\\Rightarrow\\quad \\text{Wendepunkt}');
    const v1 = valueAt(d1, m);
    if (v1.sgn === 0) d.note('Zusätzlich ist $' + fName(fi, 1) + '(' + m.tex + ')=0$: ein **Terrassenpunkt** (Wendepunkt mit waagrechter Tangente).');
    d.h('4. y-Koordinate');
    const vy = valueAt(ast, m);
    d.e(chainTex(fName(fi, 0) + '(' + m.tex + ')', vy));
    d.res('Wendepunkt: $W' + coord(m.tex, vy.tex) + '$');
    if (!r.exact || !m.exact || !vy.exact) approxNote(d);
    d.meta = { x: m.val, y: vy.val };
    return d;
  }

  // ───────────────────── Schnittpunkte f_i = f_j ─────────────────────
  function buildIsect(pt) {
    const a = astOf(pt.fi), b = astOf(pt.fj); if (!a || !b) return null;
    const d = new Doc();
    d.p('Schnittpunkte: beide Funktionen gleichsetzen und die Differenz $0$ setzen.');
    d.e(fName(pt.fi, 0) + '(x)=' + fName(pt.fj, 0) + '(x)');
    d.e(T(a) + '=' + T(b));
    // Differenz exakt (Polynom/rational) oder via bin('sub')
    let diff = bin('sub', a, b), dTex, opTxt;
    const Ra = E.ratFromAst(a), Rb = E.ratFromAst(b);
    const PbP = E.polyFromAst(b);
    opTxt = '-' + (PbP ? pPar(PbP) : par(b));
    if (Ra && Rb) {
      const rr = E.ratReduce({ N: E.pSub(E.pMul(Ra.N, Rb.D), E.pMul(Rb.N, Ra.D)), D: E.pMul(Ra.D, Rb.D) });
      if (E.pDeg(rr.D) === 0) {
        const P = E.pScale(rr.N, E.qInv(rr.D[0]));
        diff = polyToAst(P); dTex = pT(P);
      } else { diff = bin('div', polyToAst(rr.N), polyToAst(rr.D)); dTex = '\\frac{' + pT(rr.N) + '}{' + pT(rr.D) + '}'; }
    } else {
      try { diff = S.simpDeep(bin('sub', a, b)); } catch (e) { /* roh */ }
      dTex = T(diff);
    }
    d.op(opTxt);
    d.e(dTex + '=0');
    const sub = new Doc();
    const r = S.solveZero(sub, diff, { window: winFor(pt.x), noHeader: true });
    sub.b.forEach(bl => d.b.push(bl));
    const m = nearest(r.roots, pt.x);
    if (!m) return null;
    d.h('y-Koordinate');
    const vy = valueAt(a, m);
    d.e(chainTex(fName(pt.fi, 0) + '(' + m.tex + ')', vy));
    d.res('Schnittpunkt: $S' + coord(m.tex, vy.tex) + '$');
    if (!r.exact || !m.exact || !vy.exact) approxNote(d);
    d.meta = { x: m.val, y: vy.val };
    return d;
  }

  return { renderDoc, renderBlocks, inline, ML, astOf, fName, winFor, polyToAst, pT, pPar, toState, stateAst, stateTex, diffState, derivChain, valueAt, chainTex, nearest, coord, listRoots, approxNote,
    buildYAxis, buildZero, buildExtremum, buildInflection, buildIsect, signChange, cmpTex };
})();
