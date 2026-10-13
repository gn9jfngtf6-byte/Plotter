// ═══════════════════════════════════════════════════════════════════
// MODUL 21b: equation — allgemeiner Gleichungslöser (Fortsetzung von 21_solver.js)
//
// solveZero(doc, ast, ctx) löst  ast = 0  nach x — mit Lösungsweg:
//   • Produkt            → Satz vom Nullprodukt
//   • Bruch              → Zähler = 0, Nenner ≠ 0
//   • Polynom            → solvePoly (21_solver.js)
//   • quadratisch in u   → Substitution (u = e^x, sin x, cos x, ln x)
//   • x genau einmal     → Isolieren (Äquivalenzumformungen, Umkehrfunktionen)
//   • sin/cos/tan        → allgemeine Lösung mit k ∈ ℤ (exakte Sonderwinkel)
//   • sonst              → numerische Näherung, klar als solche gekennzeichnet
// Jede Lösung wird am Ende gegen die ursprüngliche Gleichung geprüft (Probe).
// ═══════════════════════════════════════════════════════════════════
(function () {
  const E = EX, S = SV;
  const { Doc, num, bin, neg, call, idn, PI, EC, containsX, countX, T, evalNum, fmtNum, rootFe, rootNum, sortDedupe } = S;

  // ───────────────────── Konstanten vereinfachen ─────────────────────
  const isLog = n => n.type === 'call' && n.name === 'log';
  const isExpOf = n => (n.type === 'call' && n.name === 'exp') ? n.args[0] : (n.type === 'pow' && n.a.type === 'id' && n.a.v === 'EC') ? n.b : null;
  function simpDeep(n) {
    switch (n.type) {
      case 'num': case 'id': return n;
      case 'neg': return neg(simpDeep(n.x));
      case 'add': case 'sub': case 'mul': return bin(n.type, simpDeep(n.a), simpDeep(n.b));
      case 'div': {
        const a = simpDeep(n.a), b = simpDeep(n.b);
        // log(r)/log(a)  mit r = a^m  →  m
        if (isLog(a) && isLog(b)) {
          const r = E.exactQ(a.args[0]), base = E.exactQ(b.args[0]);
          if (r && base && E.qSgn(r) > 0 && E.qSgn(base) > 0 && !E.qEq(base, E.q1)) {
            for (let m = -12; m <= 12; m++) if (E.qEq(E.qPow(base, m), r)) return E.astQ(E.Q(m));
          }
        }
        return bin('div', a, b);
      }
      case 'pow': {
        const a = simpDeep(n.a), b = simpDeep(n.b);
        if (a.type === 'id' && a.v === 'EC' && isLog(b)) return b.args[0];               // e^{ln u} = u
        return bin('pow', a, b);
      }
      case 'call': {
        const args = n.args.map(simpDeep);
        const nm = n.name;
        if (nm === 'log' && args.length === 1) {
          const u = args[0];
          if (u.type === 'id' && u.v === 'EC') return num(1);
          const ex = isExpOf(u); if (ex) return ex;                                        // ln(e^u) = u
          const q = E.exactQ(u); if (q && E.qEq(q, E.q1)) return num(0);
        }
        if (nm === 'exp' && args.length === 1) {
          if (isLog(args[0])) return args[0].args[0];
          const q = E.exactQ(args[0]); if (q && E.qIsZero(q)) return num(1);
        }
        if ((nm === 'sin' || nm === 'cos' || nm === 'tan') && args.length === 1) {
          const lf = E.lfFromAst(args[0], null);
          if (lf && E.qIsZero(lf.c)) {
            const v = E.trigAtPi(nm, lf.p); if (v) return E.astFe(v);
          } else if (lf && E.qIsZero(lf.p) && E.qIsZero(lf.c)) {
            const v = E.trigAtPi(nm, E.q0); if (v) return E.astFe(v);
          }
        }
        return call(nm, ...args);
      }
      default: return n;
    }
  }
  function simpConst(n) {
    n = simpDeep(n);
    const q = E.exactQ(n); if (q) return E.astQ(q);
    const fe = E.evalFe(n, E.feInt(0)); if (fe) return E.astFe(fe);
    try { return calcSimplify(n); } catch (e) { return n; }
  }
  function constFe(n) {
    const q = E.exactQ(n); if (q) return E.feQ(q);
    return E.evalFe(n, E.feInt(0));
  }
  function rootFromConst(R) {
    R = simpConst(R);
    const fe = constFe(R);
    if (fe) return rootFe(fe);
    const val = evalNum(R, 0);
    return { val, tex: T(R), ast: R, exact: true };
  }
  // LaTeX eines Ausdrucks: Polynome schulgerecht (3x^2-1), sonst wie im Eingabefeld
  function TP(n) {
    if (n.type !== 'pow') { try { const P = E.polyFromAst(n); if (P && E.pDeg(P) >= 1) return E.pTex(P, 'x'); } catch (e) { /* weiter */ } }
    return T(n);
  }
  // LaTeX einer Konstante: exakte Brüche/Wurzeln über den exakten Kern (schöner als miToLatex)
  function TC(n) {
    try { const fe = constFe(n); if (fe) return E.feTex(fe); } catch (e) { /* weiter */ }
    return T(n);
  }
  const par = n => { const t = containsX(n, 'x') ? T(n) : TC(n); return (n.type === 'neg' || n.type === 'add' || n.type === 'sub' || t.charAt(0) === '-') ? '\\left(' + t + '\\right)' : t; };

  // ───────────────────── Hilfen für Winkel (Vielfache von π) ─────────────────────
  const qpi = q => { // LaTeX von q·π
    if (E.qIsZero(q)) return '0';
    const neg_ = q.n < 0n, a = E.qAbs(q);
    const body = a.d === 1n ? (a.n === 1n ? '\\pi' : a.n + '\\pi') : '\\frac{' + (a.n === 1n ? '' : a.n) + '\\pi}{' + a.d + '}';
    return (neg_ ? '-' : '') + body;
  };
  function lfTex(lf) {
    const parts = [];
    if (!E.qIsZero(lf.c)) parts.push(E.qTex(lf.c));
    if (!E.qIsZero(lf.p)) parts.push(qpi(lf.p));
    if (!parts.length) return '0';
    return parts.reduce((s, t) => s === '' ? t : s + (t.charAt(0) === '-' ? t : '+' + t), '');
  }
  const kTex = p => { // LaTeX von p·k·π
    const neg_ = p.n < 0n, a = E.qAbs(p);
    const body = a.d === 1n ? (a.n === 1n ? 'k\\pi' : a.n + 'k\\pi') : '\\frac{' + (a.n === 1n ? '' : a.n) + 'k\\pi}{' + a.d + '}';
    return (neg_ ? '-' : '') + body;
  };
  function lfAst(lf) {
    let t = null;
    if (!E.qIsZero(lf.p)) {
      const a = E.qAbs(lf.p);
      let top = a.n === 1n ? PI : bin('mul', num(a.n), PI);
      top = a.d === 1n ? top : bin('div', top, num(a.d));
      t = lf.p.n < 0n ? neg(top) : top;
    }
    if (!E.qIsZero(lf.c)) {
      const c = E.astQ(lf.c);
      return t ? bin('add', c, t) : c;
    }
    return t || num(0);
  }
  const lfVal = lf => E.qNum(lf.c) + E.qNum(lf.p) * Math.PI;

  // sin/cos/tan-Gleichungen  name(g) = R  (g linear in x)  →  Familien g = u + per·k·π
  function specialAngle(name, c) {                      // c: Fe → r (Q, in π) | null
    const cands = name === 'cos' ? [0, 1, 2, 3, 4, 5, 6].map(i => ({ 0: E.Q(0), 1: E.Q(1, 6), 2: E.Q(1, 4), 3: E.Q(1, 3), 4: E.Q(1, 2), 5: E.Q(2, 3), 6: E.Q(3, 4) })[i]).concat([E.Q(5, 6), E.Q(1)])
      : [E.Q(0), E.Q(1, 6), E.Q(1, 4), E.Q(1, 3), E.Q(1, 2), E.Q(-1, 6), E.Q(-1, 4), E.Q(-1, 3), E.Q(-1, 2)];
    if (name === 'tan') cands.splice(cands.findIndex(q => qEqv(q, E.Q(1, 2))), 1), cands.splice(cands.findIndex(q => qEqv(q, E.Q(-1, 2))), 1);
    for (const r of cands) {
      const t = E.trigAtPi(name, r);
      if (t && E.feEq(t, c)) return r;
    }
    return null;
  }
  const qEqv = (a, b) => E.qEq(a, b);

  // Löst name(g)=R mit g = a·x + b (b = b1 + bp·π) und gibt die Wurzeln im Fenster zurück
  function trigCases(doc, name, g, R, v, ctx) {
    const lf0 = E.lfFromAst(g, { c: E.q0, p: E.q0 }, v), lf1 = E.lfFromAst(g, { c: E.q1, p: E.q0 }, v);
    if (!lf0 || !lf1) return null;
    const a = E.qSub(lf1.c, lf0.c);
    if (!E.qIsZero(E.qSub(lf1.p, lf0.p)) || E.qIsZero(a)) return null;      // Argument nicht linear (nur π-Anteil konstant)
    const b = lf0;                                                           // b = b.c + b.p·π
    const c = constFe(R);
    const cNum = evalNum(R, 0);
    if (!isFinite(cNum)) return null;
    if (name !== 'tan' && Math.abs(cNum) > 1 + 1e-12) {
      doc.p('Der Wert $' + T(R) + '$ liegt ausserhalb von $[-1;\\,1]$ — $\\' + name + '(\\cdot)$ nimmt ihn nie an: **keine Lösung**.');
      return [];
    }
    const win = ctx.window || [-10, 10];
    const fams = [];                       // {u: lf | {sym}, per: Q (Vielfaches von π)}
    const r = c ? specialAngle(name, c) : null;
    let alphaTex, alphaVal;
    if (r) { alphaTex = qpi(r); alphaVal = E.qNum(r) * Math.PI; }
    else {
      const fn = name === 'sin' ? 'arcsin' : name === 'cos' ? 'arccos' : 'arctan';
      alphaTex = '\\' + fn + '\\left(' + T(R) + '\\right)';
      alphaVal = name === 'sin' ? Math.asin(cNum) : name === 'cos' ? Math.acos(cNum) : Math.atan(cNum);
    }
    const q2 = E.Q(2), q1 = E.q1;
    // Familien bestimmen (zusammenfassen bei Sonderfällen)
    if (name === 'tan') fams.push({ u: r ? { c: E.q0, p: r } : null, uTex: alphaTex, uVal: alphaVal, per: q1 });
    else if (name === 'sin') {
      if (r && E.qIsZero(r)) fams.push({ u: { c: E.q0, p: E.q0 }, uTex: '0', uVal: 0, per: q1 });
      else if (r && E.qEq(E.qAbs(r), E.Q(1, 2))) fams.push({ u: { c: E.q0, p: r }, uTex: alphaTex, uVal: alphaVal, per: q2 });
      else {
        fams.push({ u: r ? { c: E.q0, p: r } : null, uTex: alphaTex, uVal: alphaVal, per: q2 });
        fams.push({ u: r ? { c: E.q0, p: E.qSub(q1, r) } : null, uTex: r ? qpi(E.qSub(q1, r)) : '\\pi-' + alphaTex, uVal: Math.PI - alphaVal, per: q2 });
      }
    } else { // cos
      if (r && E.qEq(r, E.Q(1, 2))) fams.push({ u: { c: E.q0, p: r }, uTex: alphaTex, uVal: alphaVal, per: q1 });
      else if (r && (E.qIsZero(r) || E.qEq(r, q1))) fams.push({ u: { c: E.q0, p: r }, uTex: alphaTex, uVal: alphaVal, per: q2 });
      else {
        fams.push({ u: r ? { c: E.q0, p: r } : null, uTex: alphaTex, uVal: alphaVal, per: q2 });
        fams.push({ u: r ? { c: E.q0, p: E.qNeg(r) } : null, uTex: r ? qpi(E.qNeg(r)) : '-' + alphaTex, uVal: -alphaVal, per: q2 });
      }
    }
    const gT = T(g), fnT = '\\' + name;
    const invFn = name === 'sin' ? '\\arcsin' : name === 'cos' ? '\\arccos' : '\\arctan';
    const simple = E.qEq(a, q1) && E.qIsZero(b.c) && E.qIsZero(b.p);
    const perT = f => E.qEq(f.per, q1) ? 'k\\pi' : '2k\\pi';
    doc.e(fnT + '\\left(' + gT + '\\right)=' + TC(R));
    doc.op(r ? '\\text{Sonderwinkel}' : invFn);
    if (!r && c === null) doc.note('Kein Sonderwinkel — der Winkel folgt aus der Umkehrfunktion (Taschenrechner).');
    if (fams.length === 2) doc.p('Wegen der Symmetrie der Funktion gibt es in jeder Periode **zwei** Lösungen:');
    const roots = [], fam = [];
    const aTex = E.qTexP(a);
    // Operation, um den Winkel g = a·x + b nach x aufzulösen
    const bVal = lfVal(b);
    const subB = (E.qIsZero(b.c) && E.qIsZero(b.p)) ? '' : (bVal < 0 ? '+' + lfTex({ c: E.qNeg(b.c), p: E.qNeg(b.p) }) : '-' + lfTex(b));
    const opSolve = [subB, E.qEq(a, q1) ? '' : ':' + aTex].filter(Boolean).join(',\\ ');
    if (simple) {
      // x selbst ist der Winkel
      doc.e(fams.map(f => 'x=' + (f.uTex === '0' ? '' : f.uTex + '+') + perT(f)).join('\\quad\\text{oder}\\quad ') + ',\\ k\\in\\mathbb{Z}');
    } else {
      doc.e(fams.map(f => gT + '=' + f.uTex + '+' + perT(f)).join('\\quad\\text{oder}\\quad ') + ',\\ k\\in\\mathbb{Z}');
      doc.op(opSolve);
    }
    fams.forEach((f, fi) => {
      let X0tex, X0lf = null;
      if (f.u) {
        X0lf = { c: E.qDiv(E.qNeg(b.c), a), p: E.qDiv(E.qSub(f.u.p, b.p), a) };
        X0tex = lfTex(X0lf);
      } else {
        const bT = lfTex(b);
        X0tex = simple ? f.uTex : '\\frac{' + f.uTex + (bT === '0' ? '' : '-' + (bVal < 0 ? '\\left(' + bT + '\\right)' : bT)) + '}{' + E.qTex(a) + '}';
      }
      const perK = (E.qEq(f.per, q1) ? E.qDiv(q1, a) : E.qDiv(q2, a));
      const kt = kTex(perK);
      const famTex = (X0tex === '0' ? '' : X0tex + (kt.charAt(0) === '-' ? '' : '+')) + kt;
      if (!simple) doc.e('x=' + famTex + ',\\ k\\in\\mathbb{Z}');
      fam.push(famTex);
      // Instanzen im Fenster
      const perVal = Math.abs(E.qNum(perK)) * Math.PI;
      const x0val = f.u ? lfVal(X0lf) : (f.uVal - lfVal(b)) / E.qNum(a);
      const kmin = Math.floor((win[0] - x0val) / perVal) - 1, kmax = Math.ceil((win[1] - x0val) / perVal) + 1;
      for (let k = Math.max(kmin, -40); k <= Math.min(kmax, 40); k++) {
        const val = x0val + E.qNum(perK) * Math.PI * k;
        if (val < win[0] - 1e-9 || val > win[1] + 1e-9) continue;
        if (X0lf) {
          const lf = { c: X0lf.c, p: E.qAdd(X0lf.p, E.qMul(perK, E.Q(k))) };
          roots.push({ val, tex: lfTex(lf), ast: lfAst(lf), exact: true, lf, fam: famTex, k });
        } else {
          const kk = E.qMul(perK, E.Q(k));
          const astx = bin('add', E.qIsZero(kk) ? num(0) : lfAst({ c: E.q0, p: kk }), bin('div', bin('sub', f.uTex.charAt(0) === '\\' && name !== 'tan' ? call(name === 'sin' ? 'asin' : 'acos', R) : call('atan', R), lfAst(b)), E.astQ(a)));
          roots.push({ val, tex: X0tex + (k === 0 ? '' : (E.qNum(kk) < 0 ? '' : '+') + qpi(kk)), ast: astx, exact: true, fam: famTex, k });
        }
      }
    });
    roots.periodic = true; roots.famTex = fam;
    return roots;
  }

  // ───────────────────── Isolieren (x kommt genau einmal vor) ─────────────────────
  // L enthält x genau einmal, R ist x-frei. Liefert Wurzeln (Array) oder null (nicht lösbar auf diesem Weg).
  function isolate(doc, L, R, v, ctx, depth) {
    depth = depth || 0;
    if (depth > 8) return null;
    const out = [];
    let guard = 0;
    R = simpConst(R);
    if (!ctx.noStart) doc.e(T(L) + '=' + TC(R));
    function step(op, Ln, Rn) { doc.op(op); L = Ln; R = simpConst(Rn); doc.e(T(L) + '=' + TC(R)); }
    function branch(title, Ln, Rn) {
      const sub = new Doc(); sub.p(title);
      sub.e(T(Ln) + '=' + TC(simpConst(Rn)));
      const r = isolate(sub, Ln, Rn, v, Object.assign({}, ctx, { noStart: true }), depth + 1);
      doc.sub(sub);
      return r;
    }
    const rVal = () => evalNum(R, 0);
    while (guard++ < 40) {
      switch (L.type) {
        case 'id':
          if (L.v !== v) return null;
          out.push(rootFromConst(R)); return out;
        case 'neg': step('\\cdot(-1)', L.x, neg(R)); continue;
        case 'add': {
          const xa = containsX(L.a, v), c = xa ? L.b : L.a, xs = xa ? L.a : L.b;
          if (containsX(c, v)) return null;
          const cs = simpConst(c);
          step(cs.type === 'neg' ? '+' + par(cs.x) : '-' + par(cs), xs, bin('sub', R, cs)); continue;
        }
        case 'sub': {
          if (containsX(L.a, v) && !containsX(L.b, v)) {
            const cs = simpConst(L.b);
            step(cs.type === 'neg' ? '-' + par(cs.x) : '+' + par(cs), L.a, bin('add', R, cs)); continue;
          }
          if (!containsX(L.a, v) && containsX(L.b, v)) {
            const cs = simpConst(L.a);
            doc.op('-' + par(cs));
            doc.e('-' + par(L.b) + '=' + TC(simpConst(bin('sub', R, cs))));
            L = neg(L.b); R = simpConst(bin('sub', R, cs));
            step('\\cdot(-1)', L.x, neg(R)); continue;
          }
          return null;
        }
        case 'mul': {
          const xa = containsX(L.a, v), c = xa ? L.b : L.a, xs = xa ? L.a : L.b;
          if (containsX(c, v)) return null;
          const cs = simpConst(c);
          const cq = constFe(cs); if (cq && E.feIsZero(cq)) return null;
          step(':' + par(cs), xs, bin('div', R, cs)); continue;
        }
        case 'div': {
          if (containsX(L.a, v) && !containsX(L.b, v)) {
            const cs = simpConst(L.b);
            step('\\cdot' + par(cs), L.a, bin('mul', R, cs)); continue;
          }
          if (!containsX(L.a, v) && containsX(L.b, v)) {
            const r0 = rVal();
            if (Math.abs(r0) < 1e-12) { doc.p('Ein Bruch mit konstantem Zähler $\\neq 0$ wird nie $0$ — **keine Lösung**.'); return []; }
            const a = simpConst(L.a), lb = L.b;
            doc.op('\\cdot ' + par(lb));
            doc.e(TC(a) + '=' + TC(simpConst(bin('mul', R, lb))));
            doc.op(':' + par(R));
            L = lb; R = simpConst(bin('div', a, R)); doc.e(T(L) + '=' + TC(R)); continue;
          }
          return null;
        }
        case 'pow': {
          if (containsX(L.a, v) && !containsX(L.b, v)) {
            const en = E.exactQ(L.b);
            const rv = rVal();
            if (!en) return null;
            if (E.qIsInt(en) && en.n >= 2n) {
              const nn = Number(en.n);
              if (nn % 2 === 0) {
                if (rv < -1e-12) { doc.p('Eine gerade Potenz ist nie negativ — **keine Lösung**.'); return []; }
                const rootAst = nn === 2 ? call('sqrt', R) : call('nthroot', R, num(nn));
                doc.op(nn === 2 ? '\\sqrt{\\ }' : '\\sqrt[' + nn + ']{\\ }');
                if (Math.abs(rv) < 1e-12) { L = L.a; R = num(0); doc.e(T(L) + '=0'); continue; }
                const rr = simpConst(rootAst);
                doc.e(T(L.a) + '=\\pm' + par(rr));
                const lA = L.a;
                const r1 = branch('Fall 1:', lA, rr), r2 = branch('Fall 2:', lA, neg(rr));
                if (!r1 && !r2) return null;
                return (r1 || []).concat(r2 || []);
              }
              doc.op('\\sqrt[' + nn + ']{\\ }');
              const rootAst = rv < 0 ? neg(call('nthroot', neg(R), num(nn))) : call('nthroot', R, num(nn));
              L = L.a; R = simpConst(rootAst); doc.e(T(L) + '=' + TC(R)); continue;
            }
            if (E.qIsInt(en) && en.n <= -1n) {                                   // g^(-n) = R  ⇒  g^n = 1/R
              if (Math.abs(rv) < 1e-12) { doc.p('Eine Potenz mit negativem Exponenten wird nie $0$ — **keine Lösung**.'); return []; }
              doc.op('\\text{Kehrwert}');
              L = bin('pow', L.a, E.astQ(E.qNeg(en))); R = simpConst(bin('div', num(1), R)); doc.e(T(L) + '=' + TC(R)); continue;
            }
            // gebrochener Exponent p/q:  g^(p/q) = R  ⇒  g = R^(q/p)   (nur R ≥ 0)
            if (rv < -1e-12) { doc.p('Eine Wurzel/Potenz mit gebrochenem Exponenten ist nie negativ — **keine Lösung**.'); return []; }
            const inv = E.qInv(en);
            doc.op('(\\ )^{' + E.qTex(inv) + '}');
            L = L.a; R = simpConst(bin('pow', R, E.astQ(inv))); doc.e(T(L) + '=' + TC(R)); continue;
          }
          if (!containsX(L.a, v) && containsX(L.b, v)) {                          // a^g = R
            const rv = rVal();
            if (!(rv > 0)) { doc.p('Eine Exponentialfunktion mit positiver Basis ist stets positiv — $' + T(L) + '=' + TC(R) + '$ hat **keine Lösung**.'); return []; }
            const base = L.a, g = L.b;
            if (base.type === 'id' && base.v === 'EC') { step('\\ln', g, call('log', R)); continue; }
            doc.op('\\ln');
            doc.e(T(g) + '\\cdot\\ln(' + T(base) + ')=\\ln(' + TC(R) + ')');
            doc.op(':\\ln(' + T(base) + ')');
            L = g; R = simpConst(bin('div', call('log', R), call('log', base))); doc.e(T(L) + '=' + TC(R)); continue;
          }
          return null;
        }
        case 'call': {
          const nm = L.name, a0 = L.args[0], rv = rVal();
          if (nm === 'exp') { if (!(rv > 0)) { doc.p('$e^{u}$ ist stets positiv — **keine Lösung**.'); return []; } step('\\ln', a0, call('log', R)); continue; }
          if (nm === 'log') { step('e^{(\\ )}', a0, bin('pow', EC, R)); continue; }
          if (nm === 'log10') { step('10^{(\\ )}', a0, bin('pow', num(10), R)); continue; }
          if (nm === 'logn' || nm === 'logbase') {
            if (containsX(L.args[1], v)) return null;
            step(T(L.args[1]) + '^{(\\ )}', a0, bin('pow', L.args[1], R)); continue;
          }
          if (nm === 'sqrt') {
            if (rv < -1e-12) { doc.p('Eine Quadratwurzel ist nie negativ — **keine Lösung**.'); return []; }
            step('(\\ )^{2}', a0, bin('pow', R, num(2))); continue;
          }
          if (nm === 'nthroot') {
            if (containsX(L.args[1], v)) return null;
            step('(\\ )^{' + T(L.args[1]) + '}', a0, bin('pow', R, L.args[1])); continue;
          }
          if (nm === 'abs') {
            if (rv < -1e-12) { doc.p('Ein Betrag ist nie negativ — **keine Lösung**.'); return []; }
            if (Math.abs(rv) < 1e-12) { step('\\text{Betrag}', a0, num(0)); continue; }
            doc.op('\\text{Betrag auflösen}');
            doc.e(T(a0) + '=' + TC(R) + '\\quad\\text{oder}\\quad ' + T(a0) + '=' + TC(simpConst(neg(R))));
            const lA = a0, rr = R;
            const r1 = branch('Fall 1:', lA, rr), r2 = branch('Fall 2:', lA, neg(rr));
            if (!r1 && !r2) return null;
            return (r1 || []).concat(r2 || []);
          }
          if (nm === 'atan') { step('\\tan', a0, call('tan', R)); continue; }
          if (nm === 'asin') { step('\\sin', a0, call('sin', R)); continue; }
          if (nm === 'acos') { step('\\cos', a0, call('cos', R)); continue; }
          if (nm === 'sin' || nm === 'cos' || nm === 'tan') {
            doc.op('');
            const dd = new Doc();
            const rr = trigCases(dd, nm, a0, R, v, ctx);
            if (rr === null) return null;
            // trigCases beginnt mit der Zeile "sin(g)=R" — die steht schon in doc; ersten e-Block überspringen
            dd.b.shift();
            dd.b.forEach(bl => doc.b.push(bl));
            return rr;
          }
          return null;
        }
        default: return null;
      }
    }
    return null;
  }

  // ───────────────────── Produkt / Nullprodukt ─────────────────────
  function flattenProduct(n) {
    const out = [];
    (function rec(m) {
      if (m.type === 'mul') { rec(m.a); rec(m.b); }
      else if (m.type === 'neg') rec(m.x);
      else if (m.type === 'div' && !containsX(m.b)) rec(m.a);
      else out.push(m);
    })(n);
    return out;
  }
  const isAlwaysPositive = f => isExpOf(f) !== null && f.type !== undefined && (f.type === 'call' || (f.type === 'pow' && f.a.type === 'id' && f.a.v === 'EC'));

  // ───────────────────── Probe: Lösungen gegen die Ursprungsgleichung prüfen ─────────────────────
  function holds(ast, x) {
    const val = evalNum(ast, x);
    if (!isFinite(val)) return false;
    if (Math.abs(val) < 1e-7) return true;
    const d = 1e-6 * (1 + Math.abs(x));
    const l = evalNum(ast, x - d), r = evalNum(ast, x + d);
    if (isFinite(l) && isFinite(r)) {
      const m = Math.max(Math.abs(l), Math.abs(r));
      if (Math.abs(val) < 1e-6 * (1 + m)) return true;
    }
    return false;
  }
  function checkRoots(doc, ast, roots, quiet) {
    const keep = [];
    roots.forEach(r => {
      if (holds(ast, r.val)) keep.push(r);
      else if (!quiet) doc.p('**Probe:** $x=' + r.tex + '$ erfüllt die Ausgangsgleichung nicht (Scheinlösung) — wird verworfen.');
    });
    return keep;
  }

  // numerische Notlösung (Vorzeichenwechsel + Bisektion im Fenster)
  function numericZeros(ast, win) {
    const lo = win[0], hi = win[1], N = 3000, out = [];
    let xp = lo, fp = evalNum(ast, xp);
    for (let i = 1; i <= N; i++) {
      const x = lo + (hi - lo) * i / N, f = evalNum(ast, x);
      if (isFinite(fp) && isFinite(f)) {
        if (fp === 0) out.push(xp);
        else if (fp * f < 0) {
          let a = xp, b = x, fa = fp;
          for (let k = 0; k < 80; k++) { const m = (a + b) / 2, fm = evalNum(ast, m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } }
          const rt = (a + b) / 2;
          if (Math.abs(evalNum(ast, rt)) < 1e-6 * (1 + Math.abs(fp) + Math.abs(f))) out.push(rt);
        }
      }
      xp = x; fp = f;
    }
    return out.map(r => tryExactRoot(ast, r) || rootNum(r));
  }
  // Numerische Nullstelle exakt erkennbar (ganz/rational oder Vielfaches von π)? — nur, wenn der exakte Kern die Probe BEWEIST
  function tryExactRoot(ast, val) {
    const isZeroExact = xAst => {
      try {
        const s = simpConst(calcSubstitute(ast, 'x', xAst));
        const q = E.exactQ(s); if (q) return E.qIsZero(q);
        const fe = E.evalFe(s, E.feInt(0)); return !!(fe && E.feIsZero(fe));
      } catch (e) { return false; }
    };
    for (const dd of [1, 2, 3, 4, 5, 6, 8, 10, 12]) {
      const n = Math.round(val * dd);
      if (Math.abs(val - n / dd) < 1e-7 && isZeroExact(E.astQ(E.Q(n, dd)))) return rootFe(E.feQ(E.Q(n, dd)));
    }
    for (const dd of [1, 2, 3, 4, 6, 8, 12]) {
      const n = Math.round(val / Math.PI * dd);
      if (n !== 0 && Math.abs(val - n * Math.PI / dd) < 1e-7) {
        const lf = { c: E.q0, p: E.Q(n, dd) };
        if (isZeroExact(lfAst(lf))) return { val: lfVal(lf), tex: lfTex(lf), ast: lfAst(lf), exact: true, lf };
      }
    }
    return null;
  }

  // ───────────────────── Substitution (quadratisch in e^x, sin x, cos x, ln x) ─────────────────────
  const SUBS = [
    { tex: 'e^{x}', match: n => (isExpOf(n) !== null) ? isExpOf(n) : null, wrap: n => n },
    { tex: '\\sin(x)', fn: 'sin' }, { tex: '\\cos(x)', fn: 'cos' }, { tex: '\\ln(x)', fn: 'log' },
    { tex: '\\sqrt{x}', fn: 'sqrt' }
  ];
  function replaceU(n, kind) {                          // → AST in z oder null
    switch (n.type) {
      case 'num': return n;
      case 'id': return n.v === 'x' ? (kind === 4 ? bin('pow', idn('z'), num(2)) : null) : n;
      case 'neg': { const a = replaceU(n.x, kind); return a && neg(a); }
      case 'add': case 'sub': case 'mul': case 'div': { const a = replaceU(n.a, kind), b = a && replaceU(n.b, kind); return a && b ? bin(n.type, a, b) : null; }
      case 'pow': {
        if (kind === 0) { const g = isExpOf(n); if (g) return expAsZ(g); }
        const a = replaceU(n.a, kind); if (!a) return null;
        const e = E.exactQ(n.b); if (!e) return null;
        return bin('pow', a, n.b);
      }
      case 'call': {
        if (kind === 0) { const g = isExpOf(n); if (g) return expAsZ(g); }
        else if (n.name === SUBS[kind].fn && n.args[0].type === 'id' && n.args[0].v === 'x') return idn('z');
        return null;
      }
      default: return null;
    }
  }
  function expAsZ(g) {                                  // e^(k·x) → z^k  (k ganz ≥ 1)
    const lf1 = E.lfFromAst(g, { c: E.q1, p: E.q0 }), lf0 = E.lfFromAst(g, { c: E.q0, p: E.q0 });
    if (!lf1 || !lf0 || !E.qIsZero(lf0.c) || !E.qIsZero(lf0.p) || !E.qIsZero(lf1.p) || !E.qIsInt(lf1.c) || lf1.c.n < 1n) return null;
    return lf1.c.n === 1n ? idn('z') : bin('pow', idn('z'), num(lf1.c.n));
  }
  function hasCall(n, name) {
    switch (n.type) {
      case 'num': case 'id': return false;
      case 'neg': return hasCall(n.x, name);
      case 'call': return n.name === name || n.args.some(a => hasCall(a, name));
      default: return hasCall(n.a, name) || hasCall(n.b, name);
    }
  }
  function trySubstitution(doc, ast, ctx) {
    for (let kind = 0; kind < SUBS.length; kind++) {
      if (kind === 4 && !hasCall(ast, 'sqrt')) continue;
      const z = replaceU(ast, kind);
      if (!z) continue;
      const P = E.polyFromAst(z, 'z');
      if (!P || E.pDeg(P) < 2) continue;
      const u = SUBS[kind];
      doc.p('Die Gleichung ist ein Polynom in $' + u.tex + '$ — **Substitution** $z=' + u.tex + '$:');
      doc.e(E.pTex(P, 'z') + '=0');
      const sub = new Doc();
      const zr = S.solvePoly(sub, P, { v: 'z', noHeader: true });
      doc.sub(sub);
      const roots = [];
      let complete = true;
      zr.roots.forEach(zRoot => {
        const sd = new Doc();
        let rr = null;
        const uAst = kind === 0 ? bin('pow', EC, idn('x')) : call(u.fn, idn('x'));
        sd.p('**Rücksubstitution** $' + u.tex + '=' + zRoot.tex + '$:');
        if (zRoot.exact) rr = isolate(sd, uAst, zRoot.ast, 'x', Object.assign({}, ctx), 1);
        else { complete = false; }
        if (rr) { doc.sub(sd); roots.push(...rr); } else if (!zRoot.exact) { complete = false; doc.p('$z\\approx' + zRoot.tex + '$ (numerisch)'); roots.push(...numericZeros(ast, ctx.window || [-10, 10])); }
      });
      return { roots: sortDedupe(roots), complete };
    }
    return null;
  }

  // ───────────────────── Gemeinsamen Faktor ausklammern (e^x, sin x, ln x, …) ─────────────────────
  function flattenSum(n, sgn, out) {
    if (n.type === 'add') { flattenSum(n.a, sgn, out); flattenSum(n.b, sgn, out); }
    else if (n.type === 'sub') { flattenSum(n.a, sgn, out); flattenSum(n.b, -sgn, out); }
    else if (n.type === 'neg') flattenSum(n.x, -sgn, out);
    else out.push({ s: sgn, n });
    return out;
  }
  function tryFactorOut(ast) {
    const terms = flattenSum(ast, 1, []);
    if (terms.length < 2) return null;
    const flat = terms.map(t => flattenProductAll(t.n));
    const nonPoly = f => containsX(f) && (!E.polyFromAst(f) || (f.type === 'id' && f.v === 'x'));
    const cand = flat[0].filter(nonPoly);
    for (const f of cand) {
      const key = T(f);
      if (!flat.every(fs => fs.some(g => T(g) === key))) continue;
      const rests = terms.map((t, i) => {
        let removed = false;
        const left = flat[i].filter(g => { if (!removed && T(g) === key) { removed = true; return false; } return true; });
        let prod = left.length ? left.reduce((a, b) => bin('mul', a, b)) : num(1);
        return t.s < 0 ? neg(prod) : prod;
      });
      const sum = rests.reduce((a, b) => b.type === 'neg' ? bin('sub', a, b.x) : bin('add', a, b));
      return { f, rest: simpDeep(sum), key };
    }
    return null;
  }
  function flattenProductAll(n) {                 // wie flattenProduct, behält aber konstante Brüche als Faktoren
    const out = [];
    (function rec(m) {
      if (m.type === 'mul') { rec(m.a); rec(m.b); } else out.push(m);
    })(n);
    return out;
  }

  // ───────────────────── Hauptlöser: ast = 0 ─────────────────────
  // ctx: {window:[lo,hi], depth, plain (kein Nullprodukt-Kopf)}
  // Rückgabe: { roots:[…], exact:boolean, periodic?:boolean }
  function solveZero(doc, ast, ctx) {
    ctx = ctx || {};
    ctx.depth = (ctx.depth || 0);
    const win = ctx.window || [-10, 10];

    // 1) Produkt mit ≥ 2 x-abhängigen Faktoren → Nullprodukt
    const factors = flattenProduct(ast), xf = factors.filter(f => containsX(f));
    if (xf.length >= 2 && ctx.depth < 4) {
      doc.p('**Satz vom Nullprodukt**: Ein Produkt ist genau dann $0$, wenn mindestens ein Faktor $0$ ist.');
      doc.e(xf.map(f => TP(f) + '=0').join('\\quad\\text{oder}\\quad '));
      let roots = [], exact = true, periodic = false;
      xf.forEach(f => {
        const sub = new Doc();
        let r;
        if (isAlwaysPositive(f)) { doc.p('Der Faktor $' + T(f) + '$ ist stets positiv, wird also nie $0$.'); return; }
        const polyF = E.polyFromAst(f);
        if (polyF && E.pDeg(polyF) === 1) {
          if (T(f) === 'x') { roots.push(rootFe(E.feInt(0))); return; }
          const x0 = E.feQ(E.qDiv(E.qNeg(polyF[0]), polyF[1]));
          doc.e(T(f) + '=0\\ \\Rightarrow\\ x=' + E.feTex(x0));
          roots.push(rootFe(x0)); return;
        }
        doc.p('Faktor $' + T(f) + '=0$:');
        r = solveZero(sub, f, Object.assign({}, ctx, { depth: ctx.depth + 1 }));
        doc.sub(sub);
        roots.push(...r.roots); exact = exact && r.exact; periodic = periodic || r.periodic;
      });
      roots = sortDedupe(checkRoots(doc, ast, roots));
      return { roots, exact, periodic };
    }
    // einzelner x-Faktor mit konstanten Vorfaktoren → nur diesen betrachten
    if (xf.length === 1 && factors.length > 1 && xf[0] !== ast) {
      return solveZero(doc, xf[0], ctx);
    }
    // Potenz einer x-Basis:  g^n = 0  ⇒  g = 0
    if (ast.type === 'pow' && containsX(ast.a) && !containsX(ast.b)) {
      const en = E.exactQ(ast.b);
      if (en && en.n > 0n) {
        doc.p('Eine Potenz ist nur dann $0$, wenn die Basis $0$ ist: $' + T(ast.a) + '=0$.');
        return solveZero(doc, ast.a, Object.assign({}, ctx, { depth: ctx.depth + 1 }));
      }
    }
    // 2) Bruch  N/D = 0  ⇒  N = 0, D ≠ 0
    if (ast.type === 'div' && containsX(ast.b)) {
      doc.p('Ein Bruch ist genau dann $0$, wenn der **Zähler** $0$ ist (und der Nenner $\\neq0$).');
      if (!containsX(ast.a)) { doc.p('Der Zähler $' + T(ast.a) + '$ ist konstant und $\\neq 0$ — **keine Nullstelle**.'); return { roots: [], exact: true }; }
      doc.e(TP(ast.a) + '=0');
      const sub = new Doc();
      const r = solveZero(sub, ast.a, Object.assign({}, ctx, { depth: ctx.depth + 1 }));
      doc.sub(sub);
      const keep = [];
      r.roots.forEach(rt => {
        const dv = evalNum(ast.b, rt.val);
        if (!isFinite(dv) || Math.abs(dv) < 1e-9) doc.p('$x=' + rt.tex + '$ macht den Nenner $0$ — keine Nullstelle (Definitionslücke).');
        else keep.push(rt);
      });
      return { roots: keep, exact: r.exact, periodic: r.periodic };
    }
    // 3) Polynom
    const P = E.polyFromAst(ast);
    if (P) {
      const r = S.solvePoly(doc, P, { v: 'x', noHeader: ctx.depth > 0 || ctx.noHeader });
      return { roots: r.roots, exact: r.roots.every(x => x.exact) };
    }
    // 4) rationale Funktion (Summe von Brüchen): auf einen Nenner bringen
    const RF = E.ratFromAst(ast);
    if (RF && E.pDeg(RF.D) >= 1) {
      const red = E.ratReduce(RF);
      doc.p('Auf den **Hauptnenner** bringen und zusammenfassen:');
      doc.e('\\frac{' + E.pTex(red.N, 'x') + '}{' + E.pTex(red.D, 'x') + '}=0');
      doc.p('Zähler $=0$ setzen:');
      doc.e(E.pTex(red.N, 'x') + '=0');
      const sub = new Doc();
      const r = S.solvePoly(sub, red.N, { v: 'x', noHeader: true });
      doc.sub(sub);
      const keep = [];
      r.roots.forEach(rt => {
        const dv = E.pEvalNum(red.D, rt.val);
        if (Math.abs(dv) < 1e-9) doc.p('$x=' + rt.tex + '$ macht den Nenner $0$ — keine Nullstelle.');
        else keep.push(rt);
      });
      return { roots: keep, exact: r.roots.every(x => x.exact) };
    }
    // 4a) A·sin(g) + B·cos(g) = 0  ⇒  tan(g) = -B/A
    {
      const terms = flattenSum(ast, 1, []);
      if (terms.length === 2 && ctx.depth < 4) {
        let sinT = null, cosT = null;
        terms.forEach(t => {
          const fs = flattenProductAll(t.n);
          const trig = fs.filter(f => f.type === 'call' && (f.name === 'sin' || f.name === 'cos') && containsX(f));
          const rest = fs.filter(f => !(f.type === 'call' && (f.name === 'sin' || f.name === 'cos')));
          if (trig.length !== 1 || rest.some(f => containsX(f))) return;
          const cq = rest.length ? constFe(rest.reduce((a, b) => bin('mul', a, b))) : E.feInt(1);
          if (!cq) return;
          const c = t.s < 0 ? E.feNeg(cq) : cq;
          if (trig[0].name === 'sin') sinT = { c, g: trig[0].args[0] }; else cosT = { c, g: trig[0].args[0] };
        });
        if (sinT && cosT && T(sinT.g) === T(cosT.g) && !E.feIsZero(sinT.c) && !E.feIsZero(cosT.c)) {
          const ratio = E.feNeg(E.feDiv(cosT.c, sinT.c));
          doc.p('Weder $\\sin(' + T(sinT.g) + ')$ noch $\\cos(' + T(sinT.g) + ')$ kann hier allein $0$ sein. Durch $\\cos(' + T(sinT.g) + ')$ teilen ergibt $\\tan$:');
          doc.e('\\tan\\left(' + T(sinT.g) + '\\right)=' + E.feTex(ratio));
          const sub = new Doc();
          const rr = trigCases(sub, 'tan', sinT.g, E.astFe(ratio), 'x', ctx);
          if (rr) { sub.b.shift(); sub.b.forEach(b => doc.b.push(b)); return { roots: sortDedupe(rr), exact: true, periodic: true }; }
        }
      }
    }
    // 4b) gemeinsamer nicht-polynomialer Faktor
    const fo = tryFactorOut(ast);
    if (fo && ctx.depth < 4) {
      doc.p('Den gemeinsamen Faktor $' + T(fo.f) + '$ **ausklammern**:');
      const prodAst = bin('mul', fo.f, fo.rest.type === 'add' || fo.rest.type === 'sub' ? fo.rest : fo.rest);
      doc.e(par(fo.f) + '\\cdot\\left(' + T(fo.rest) + '\\right)=0');
      return solveZero(doc, bin('mul', fo.f, fo.rest), Object.assign({}, ctx, { depth: ctx.depth + 1 }));
    }
    // 5) Substitution
    const sres = trySubstitution(doc, ast, ctx);
    if (sres) {
      const keep = checkRoots(doc, ast, sres.roots);
      return { roots: keep, exact: sres.complete };
    }
    // 6) Isolieren
    if (countX(ast) === 1) {
      const sub = new Doc();
      sub.e(T(ast) + '=0');
      const r = isolate(sub, ast, num(0), 'x', Object.assign({}, ctx, { noStart: true }), 0);
      if (r) {
        sub.b.forEach(b => doc.b.push(b));
        const keep = checkRoots(doc, ast, r);
        return { roots: sortDedupe(keep), exact: true, periodic: !!r.periodic };
      }
    }
    // 7) Notfall: numerisch
    doc.p('Diese Gleichung lässt sich **nicht** mit den üblichen Verfahren (Faktorisieren, Umkehrfunktion, Substitution) exakt nach $x$ auflösen.');
    const nz = numericZeros(ast, win);
    const allEx = nz.length > 0 && nz.every(r => r.exact);
    if (allEx) doc.p('Vorzeichenwechsel im sichtbaren Bereich gefunden; die Probe bestätigt die Werte **exakt**: ' + nz.map(r => '$x=' + r.tex + '$').join(', ') + '.');
    else if (nz.length) doc.p('**Numerische Näherung** (Vorzeichenwechsel + Bisektion): ' + nz.map(r => '$x' + (r.exact ? '=' : '\\approx') + r.tex + '$').join(', ') + '.');
    else doc.p('Im betrachteten Bereich wurde keine Nullstelle gefunden.');
    return { roots: nz, exact: nz.every(r => r.exact) };
  }

  Object.assign(S, { simpConst, simpDeep, constFe, rootFromConst, isolate, trigCases, solveZero, checkRoots, numericZeros, flattenProduct, lfTex, qpi, holds, par, TC });
})();
