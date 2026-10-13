// ═══════════════════════════════════════════════════════════════════
// MODUL 22b: steps (Teil 2) — Polstellen, hebbare Lücken, Asymptoten,
// Grenzwerte im Unendlichen und das Einhängen der neuen Lösungsweg-Engine
// in die Oberfläche (ersetzt generateSolveSteps / showLimitsInfinityTooltip,
// fällt bei Fällen ausserhalb der Engine automatisch auf die alte zurück).
// ═══════════════════════════════════════════════════════════════════
(function () {
  const E = EX, S = SV, A = ST;
  const { Doc, num, bin, neg, call, idn, T, TC, evalNum, fmtNum } = S;
  const { fName, polyToAst, pT, pPar, valueAt, chainTex, coord, astOf, winFor, renderDoc } = A;

  const lead = P => { P = E.pTrim(P); return P[P.length - 1]; };
  const limTex = dir => '\\lim_{x\\to' + (dir > 0 ? '+' : '-') + '\\infty}';
  const infTex = s => s > 0 ? '+\\infty' : '-\\infty';
  const mono = (c, k) => (k === 0 ? E.qTex(c) : (E.qEq(c, E.q1) ? '' : E.qEq(c, E.qNeg(E.q1)) ? '-' : E.qTex(c)) + (k === 1 ? 'x' : 'x^{' + k + '}'));
  // Σ c_k x^(k-m)  (für "höchste Nennerpotenz ausklammern")
  function divTerms(P, m) {
    P = E.pTrim(P);
    const parts = [];
    for (let k = P.length - 1; k >= 0; k--) {
      const c = P[k]; if (E.qIsZero(c)) continue;
      const a = E.qAbs(c), sg = c.n < 0n ? '-' : '+';
      let t;
      if (k === m) t = E.qTex(a);
      else if (k < m) t = '\\frac{' + E.qTex(a) + '}{' + (m - k === 1 ? 'x' : 'x^{' + (m - k) + '}') + '}';
      else t = (E.qEq(a, E.q1) ? '' : E.qTex(a)) + (k - m === 1 ? 'x' : 'x^{' + (k - m) + '}');
      parts.push((parts.length ? sg : (sg === '-' ? '-' : '')) + t);
    }
    return parts.join('') || '0';
  }
  function reducedRat(ast) {
    const RF = E.ratFromAst(ast);
    if (!RF) return null;
    const red = E.ratReduce(RF);
    const pr = E.pPrimitive(red.D);
    return { N: E.pScale(red.N, pr.k), D: pr.P, g: red.g, N0: RF.N, D0: RF.D };
  }

  // ───────────────────── Grenzwert einer rationalen Funktion ─────────────────────
  // → {kind:'val', fe, tex} | {kind:'inf', sign} ; schreibt den Rechenweg in d
  function ratLimit(N, D, dir, d) {
    const n = E.pDeg(N), m = E.pDeg(D), a = lead(N), b = lead(D);
    const L = limTex(dir);
    const Ntex = pT(N), Dtex = pT(D);
    if (E.pIsZero(N)) { d.e(L + '\\ 0=0'); return { kind: 'val', fe: E.feInt(0), tex: '0' }; }
    if (m === 0) {                                   // Polynom (Nenner konstant)
      const P = E.pScale(N, E.qInv(D[0]));
      if (n === 0) { const q = P[0]; d.e(L + '\\ ' + E.qTex(q) + '=' + E.qTex(q)); return { kind: 'val', fe: E.feQ(q), tex: E.qTex(q) }; }
      const c = lead(P), odd = n % 2 === 1;
      const sign = (E.qSgn(c) > 0 ? 1 : -1) * (dir < 0 && odd ? -1 : 1);
      d.p('Bei einem Polynom bestimmt der **Summand mit der höchsten Potenz** das Verhalten:');
      d.e(L + '\\left(' + pT(P) + '\\right)=' + L + '\\ ' + mono(c, n) + '=' + infTex(sign));
      d.p((E.qSgn(c) > 0 ? 'Der Koeffizient ist positiv' : 'Der Koeffizient ist negativ') + ' und der Exponent $' + n + '$ ist ' + (odd ? 'ungerade' : 'gerade') +
        (odd && dir < 0 ? ' — bei $x\\to-\\infty$ wechselt das Vorzeichen.' : (dir < 0 ? ' — das Vorzeichen bleibt erhalten.' : '.')));
      return { kind: 'inf', sign };
    }
    if (n <= m) {
      d.p('Zählergrad $' + n + '$, Nennergrad $' + m + '$. Die **höchste Potenz des Nenners** ($x^{' + m + '}$) in Zähler und Nenner ausklammern und kürzen:');
      d.e(L + '\\frac{' + Ntex + '}{' + Dtex + '}=' + L + '\\frac{x^{' + m + '}\\cdot\\left(' + divTerms(N, m) + '\\right)}{x^{' + m + '}\\cdot\\left(' + divTerms(D, m) + '\\right)}=' +
        L + '\\frac{' + divTerms(N, m) + '}{' + divTerms(D, m) + '}');
      d.p('Alle Brüche mit $x$ im Nenner gehen gegen $0$:');
      const val = n < m ? E.q0 : E.qDiv(a, b);
      const topT = n < m ? '0' : E.qTex(a);
      d.e('=\\frac{' + topT + '}{' + E.qTex(b) + '}=' + E.qTex(val));
      return { kind: 'val', fe: E.feQ(val), tex: E.qTex(val) };
    }
    // Zählergrad > Nennergrad
    const sg0 = E.qSgn(E.qDiv(a, b)), diff = n - m;
    const sign = sg0 * (dir < 0 && diff % 2 === 1 ? -1 : 1);
    d.p('Zählergrad $' + n + '$ ist grösser als Nennergrad $' + m + '$ — der Zähler wächst schneller. Nur die höchsten Potenzen betrachten:');
    d.e(L + '\\frac{' + Ntex + '}{' + Dtex + '}=' + L + '\\frac{' + mono(a, n) + '}{' + mono(b, m) + '}=' + L + '\\ ' + (E.qEq(E.qDiv(a, b), E.q1) ? '' : E.qTexP(E.qDiv(a, b)) + '\\cdot ') + (diff === 1 ? 'x' : 'x^{' + diff + '}') + '=' + infTex(sign));
    return { kind: 'inf', sign };
  }


  // ───────────────────── Quotient aus Summen von P(x)·e^{kx} ─────────────────────
  function expTerms(n, sc, out) {
    if (n.type === 'add') return expTerms(n.a, sc, out) && expTerms(n.b, sc, out);
    if (n.type === 'sub') return expTerms(n.a, sc, out) && expTerms(n.b, E.qNeg(sc), out);
    if (n.type === 'neg') return expTerms(n.x, E.qNeg(sc), out);
    if (n.type === 'div') {
      const Pb = E.polyFromAst(n.b);
      if (Pb && E.pDeg(Pb) === 0 && !E.qIsZero(Pb[0])) return expTerms(n.a, E.qDiv(sc, Pb[0]), out);
      return false;
    }
    const st = A.toState(n);
    let P, k;
    if (st.t === 'poly') { P = st.P; k = E.q0; } else if (st.t === 'pe') { P = st.P; k = st.k; } else return false;
    P = E.pScale(P, sc);
    const ex = out.find(o => E.qEq(o.k, k));
    if (ex) ex.P = E.pAdd(ex.P, P); else out.push({ P, k });
    return true;
  }
  function expQuotLimit(ast, dir, d) {
    if (ast.type !== 'div') return null;
    const tn = [], td = [];
    if (!expTerms(ast.a, E.q1, tn) || !expTerms(ast.b, E.q1, td)) return null;
    const N = tn.filter(t => !E.pIsZero(t.P)), D = td.filter(t => !E.pIsZero(t.P));
    if (!N.length || !D.length) return null;
    if (![...N, ...D].some(t => !E.qIsZero(t.k))) return null;
    const pick = arr => arr.reduce((b, t) => E.qNum(t.k) * dir > E.qNum(b.k) * dir ? t : b);
    const n0 = pick(N), d0 = pick(D);
    const tt = t => A.stateTex(E.qIsZero(t.k) ? { t: 'poly', P: t.P } : { t: 'pe', P: t.P, k: t.k });
    const L = limTex(dir), multi = N.length > 1 || D.length > 1;
    if (multi) d.p('Bei Summen mit $e^{kx}$ bestimmt in Zähler und Nenner jeweils der **dominante Summand** das Verhalten — für $x\\to' + (dir > 0 ? '+' : '-') + '\\infty$ ist das der Summand, der am **stärksten wächst**:');
    d.e(L + '\\frac{' + T(ast.a) + '}{' + T(ast.b) + '}' + (multi ? '=' + L + '\\frac{' + tt(n0) + '}{' + tt(d0) + '}' : ''));
    const dk = E.qSub(n0.k, d0.k);
    if (E.qIsZero(dk)) {
      d.p('Die Exponentialfaktoren $e^{kx}$ **kürzen** sich:');
      d.e('=' + L + '\\frac{' + pT(n0.P) + '}{' + pT(d0.P) + '}');
      return ratLimit(n0.P, d0.P, dir, d);
    }
    const ratio = (E.pDeg(n0.P) === 0 && E.pDeg(d0.P) === 0) ? E.qTex(E.qDiv(n0.P[0], d0.P[0]))
      : '\\frac{' + pT(n0.P) + '}{' + pT(d0.P) + '}';
    const eTex = expTex2(dk);
    d.e('=' + L + '\\ ' + (ratio === '1' ? '' : ratio + '\\cdot ') + eTex);
    if (E.qSgn(dk) * dir < 0) { d.e('=0', eTex + '\\to 0'); return { kind: 'val', fe: E.feInt(0), tex: '0' }; }
    const g = E.pDeg(n0.P) - E.pDeg(d0.P);
    const sign = (E.qSgn(lead(n0.P)) * E.qSgn(lead(d0.P))) * (dir < 0 && g % 2 !== 0 ? -1 : 1);
    d.e('=' + infTex(sign), eTex + '\\to\\infty');
    return { kind: 'inf', sign };
  }
  const expTex2 = k => 'e^{' + (E.qEq(k, E.q1) ? '' : E.qEq(k, E.qNeg(E.q1)) ? '-' : E.qTex(k)) + 'x}';


  // ───────────────────── weitere Grenzwert-Regeln ─────────────────────
  const sgnInf = (sign) => sign > 0 ? '+\\infty' : '-\\infty';
  // Brüche, in denen Sinus/Kosinus (beschränkt) bzw. log(x) (langsam wachsend) durch ein Polynom geteilt wird
  function growthQuotLimit(ast, dir, d) {
    const D = E.polyFromAst(ast.b);
    if (!D || E.pDeg(D) < 1) return null;
    const N = ast.a, L = limTex(dir);
    if (N.type === 'call' && (N.name === 'sin' || N.name === 'cos') && N.args.length === 1) {
      d.p('Sinus und Kosinus bleiben immer zwischen $-1$ und $1$ — der Zähler ist **beschränkt**, der Nenner wächst über alle Grenzen. Der Bruch wird "eingequetscht" (**Einschnürungssatz**):');
      d.e('-\\frac{1}{\\left|' + T(ast.b) + '\\right|}\\le\\frac{' + T(N) + '}{' + T(ast.b) + '}\\le\\frac{1}{\\left|' + T(ast.b) + '\\right|}');
      d.e(L + '\\left(\\pm\\frac{1}{\\left|' + T(ast.b) + '\\right|}\\right)=0\\quad\\Rightarrow\\quad ' + L + '\\frac{' + T(N) + '}{' + T(ast.b) + '}=0');
      return { kind: 'val', fe: E.feInt(0), tex: '0' };
    }
    if (N.type === 'call' && N.name === 'log' && N.args.length === 1 && dir > 0) {
      const U = E.polyFromAst(N.args[0]);
      if (!U || E.pDeg(U) !== 1) return null;
      d.p('Der Logarithmus wächst für $x\\to\\infty$ **langsamer als jede Potenz** von $x$. Steht im Nenner eine Potenz, gewinnt der Nenner:');
      d.e(L + '\\frac{' + T(N) + '}{' + T(ast.b) + '}=0');
      return { kind: 'val', fe: E.feInt(0), tex: '0' };
    }
    return null;
  }
  // a^{cx} (konstante Basis), arctan, tanh, e^{u} mit konvergentem Exponenten
  function specialLimit(ast, dir, d) {
    const L = limTex(dir);
    if (ast.type === 'call' && ast.args.length === 1 && ast.args[0].type === 'id' && ast.args[0].v === 'x') {
      if (ast.name === 'atan' || ast.name === 'arctan') {
        d.p('Der Arkustangens nähert sich für $x\\to' + (dir > 0 ? '+' : '-') + '\\infty$ dem Wert $' + (dir > 0 ? '' : '-') + '\\frac{\\pi}{2}$ (bekannter Grenzwert).');
        d.e(L + '\\arctan(x)=' + (dir > 0 ? '' : '-') + '\\frac{\\pi}{2}');
        return { kind: 'val', fe: null, num: dir * Math.PI / 2, tex: (dir > 0 ? '' : '-') + '\\frac{\\pi}{2}' };
      }
      if (ast.name === 'tanh') {
        d.p('Der Tangens hyperbolicus nähert sich für $x\\to' + (dir > 0 ? '+' : '-') + '\\infty$ dem Wert $' + (dir > 0 ? '1' : '-1') + '$ (bekannter Grenzwert).');
        d.e(L + '\\tanh(x)=' + (dir > 0 ? '1' : '-1'));
        return { kind: 'val', fe: E.feInt(dir), tex: dir > 0 ? '1' : '-1' };
      }
    }
    // a^{c·x} mit konstanter Basis a>0, a≠1
    if (ast.type === 'pow') {
      const Ra = E.ratFromAst(ast.a);
      const lin = E.lfFromAst ? E.lfFromAst(ast.b, { c: E.q1, p: E.q0 }) : null;
      const lin0 = E.lfFromAst ? E.lfFromAst(ast.b, { c: E.q0, p: E.q0 }) : null;
      if (Ra && E.pDeg(Ra.D) === 0 && E.pDeg(Ra.N) === 0 && lin && lin0 && E.qIsZero(lin0.c) && E.qIsZero(lin0.p) && E.qIsZero(lin.p) && !E.qIsZero(lin.c)) {
        const a = E.qDiv(Ra.N[0], Ra.D[0]);
        if (E.qSgn(a) > 0 && !E.qEq(a, E.q1)) {
          const grows = (E.qNum(a) > 1 ? 1 : -1) * E.qSgn(lin.c) * dir;
          d.p(E.qNum(a) > 1 ? 'Die Basis $' + E.qTex(a) + '$ ist **grösser** als $1$: $' + T(ast) + '$ wird bei wachsendem Exponenten immer grösser, bei fallendem Exponenten immer kleiner.'
            : 'Die Basis $' + E.qTex(a) + '$ liegt **zwischen** $0$ und $1$: $' + T(ast) + '$ wird bei wachsendem Exponenten immer kleiner, bei fallendem Exponenten immer grösser.');
          if (grows < 0) { d.e(L + T(ast) + '=0'); return { kind: 'val', fe: E.feInt(0), tex: '0' }; }
          d.e(L + T(ast) + '=+\\infty'); return { kind: 'inf', sign: 1 };
        }
      }
    }
    // e^{u(x)}, wenn der Exponent einen endlichen Grenzwert hat (z.B. e^{1/x})
    const eu = ast.type === 'call' || ast.type === 'pow' ? (function () { const g = (ast.type === 'call' && ast.name === 'exp') ? ast.args[0] : (ast.type === 'pow' && ast.a.type === 'id' && ast.a.v === 'EC') ? ast.b : null; return g; })() : null;
    if (eu) {
      const st = A.toState(ast);
      if (st.t === 'pe' || st.t === 'pg') return null;
      const sub = new Doc();
      let lu = null; try { lu = limitOf(eu, dir, sub); } catch (e) { lu = null; }
      if (lu && lu.kind === 'val' && lu.fe) {
        d.p('Zuerst den **Exponenten** betrachten:');
        sub.b.forEach(b => d.b.push(b));
        const v = E.feNum(lu.fe);
        if (Math.abs(v) < 1e-12) { d.p('Der Exponent strebt gegen $0$, und $e^{0}=1$ (die Exponentialfunktion ist stetig):'); d.e(L + 'e^{' + T(eu) + '}=e^{0}=1'); return { kind: 'val', fe: E.feInt(1), tex: '1' }; }
        d.p('Die Exponentialfunktion ist stetig, also darf der Grenzwert in den Exponenten gezogen werden:');
        d.e(L + 'e^{' + T(eu) + '}=e^{' + lu.tex + '}');
        return { kind: 'val', fe: null, num: Math.exp(v), tex: 'e^{' + lu.tex + '}' };
      }
    }
    return null;
  }

  // ───────────────────── Grenzwert allgemein (rational + P·e^{kx}) ─────────────────────
  function flatSum(n, s, out) {
    if (n.type === 'add') { flatSum(n.a, s, out); flatSum(n.b, s, out); }
    else if (n.type === 'sub') { flatSum(n.a, s, out); flatSum(n.b, -s, out); }
    else if (n.type === 'neg') flatSum(n.x, -s, out);
    else out.push({ s, n });
    return out;
  }
  // → {kind:'val', fe, tex} | {kind:'inf', sign} | null
  function limitOf(ast, dir, d) {
    const R = reducedRat(ast);
    if (R) return ratLimit(R.N, R.D, dir, d);
    if (ast.type === 'div') { const qq = expQuotLimit(ast, dir, d); if (qq) return qq; const sq = growthQuotLimit(ast, dir, d); if (sq) return sq; }
    { const sp = specialLimit(ast, dir, d); if (sp) return sp; }
    const terms = flatSum(ast, 1, []);
    const res = [];
    let hasExp = false;
    for (const t of terms) {
      const pe = A.toState(t.n);
      if (pe.t === 'pg') {
        hasExp = true;
        const gdeg = E.pDeg(pe.g), gs = E.qSgn(lead(pe.g)) * (dir < 0 && gdeg % 2 === 1 ? -1 : 1);
        if (gs < 0) res.push({ kind: 'val', fe: E.feInt(0), tex: '0', s: t.s, txt: t.n });
        else {
          const c = lead(pe.P), n = E.pDeg(pe.P);
          res.push({ kind: 'inf', sign: t.s * (E.qSgn(c) > 0 ? 1 : -1) * (dir < 0 && n % 2 === 1 ? -1 : 1), s: t.s, txt: t.n });
        }
        continue;
      }
      if (pe.t === 'pe') {
        hasExp = true;
        const k = pe.k, kd = E.qSgn(k) * dir;
        const e = 'e^{' + (E.qEq(k, E.q1) ? '' : E.qEq(k, E.qNeg(E.q1)) ? '-' : E.qTex(k)) + 'x}';
        if (kd < 0) { res.push({ kind: 'val', fe: E.feInt(0), tex: '0', s: t.s, txt: t.n }); }
        else {
          const c = lead(pe.P), n = E.pDeg(pe.P);
          const sign = t.s * (E.qSgn(c) > 0 ? 1 : -1) * (dir < 0 && n % 2 === 1 ? -1 : 1);
          res.push({ kind: 'inf', sign, s: t.s, txt: t.n });
        }
        continue;
      }
      const r = reducedRat(t.n);
      if (!r) return null;
      const sub = new Doc();
      const rl = ratLimit(r.N, r.D, dir, sub);
      res.push(Object.assign({}, rl, { s: t.s, txt: t.n, sub }));
    }
    if (!hasExp) return null;
    const L = limTex(dir);
    const multi = res.length > 1;
    if (multi) d.p('Die Funktion ist eine Summe — jeden Summanden einzeln betrachten:');
    res.forEach(r => {
      const st = A.toState(r.txt), isPe = st.t === 'pe' || st.t === 'pg';
      const tt = (r.s < 0 ? '-' : '') + A.stateTex(st);
      const body = multi ? '\\left(' + tt + '\\right)' : '\\ ' + tt;
      if (r.kind === 'val' && r.tex === '0' && isPe) d.e(L + body + '=0', 'e^{kx}\\to 0');
      else if (r.kind === 'inf' && isPe) d.e(L + body + '=' + infTex(r.sign * r.s), 'e^{kx}\\to\\infty');
      else d.e(L + body + '=' + (r.kind === 'val' ? (r.s < 0 ? E.feTex(E.feNeg(r.fe)) : r.tex) : infTex(r.s < 0 ? -r.sign : r.sign)));
    });
    if (res.some(r => r.kind === 'inf')) {
      const sg = res.filter(r => r.kind === 'inf').map(r => r.sign);
      if (!sg.every(v => v === sg[0])) return null;
      d.p('Mindestens ein Summand wächst unbeschränkt:');
      d.e(L + '\\ f(x)=' + infTex(sg[0]));
      return { kind: 'inf', sign: sg[0] };
    }
    let acc = E.feInt(0);
    res.forEach(r => { acc = E.feAdd(acc, r.s < 0 ? E.feNeg(r.fe) : r.fe); });
    if (multi) { d.p('Summe der Grenzwerte:'); d.e(L + '\\ f(x)=' + E.feTex(acc)); }
    return { kind: 'val', fe: acc, tex: E.feTex(acc) };
  }
  const expNote = '$e^{kx}$ strebt für $kx\\to-\\infty$ gegen $0$ und für $kx\\to+\\infty$ gegen $+\\infty$ — und zwar schneller als jede Potenz von $x$.';

  // ───────────────────── Senkrechte Asymptote (Polstelle) ─────────────────────
  function signAround(ast, x0) {
    const dl = 1e-6 * (1 + Math.abs(x0));
    return { l: Math.sign(evalNum(ast, x0 - dl)), r: Math.sign(evalNum(ast, x0 + dl)) };
  }

  // ───────────────────── Polstellen nicht-rationaler Funktionen ─────────────────────
  // tan/cot/sec/csc, beliebige Brüche mit nicht-polynomialem Nenner, log(u) bei u=0
  function mapAst(n, f) {
    const r = f(n); if (r) return r;
    if (!n || typeof n !== 'object') return n;
    const c = Object.assign({}, n);
    if (n.a) c.a = mapAst(n.a, f);
    if (n.b) c.b = mapAst(n.b, f);
    if (n.x) c.x = mapAst(n.x, f);
    if (n.args) c.args = n.args.map(q => mapAst(q, f));
    return c;
  }
  function singularCands(ast) {
    const out = [];
    (function rec(n) {
      if (!n || typeof n !== 'object') return;
      if (n.type === 'call' && ['tan', 'cot', 'sec', 'csc'].indexOf(n.name) >= 0 && n.args.length === 1) {
        const u = n.args[0], cs = (n.name === 'tan' || n.name === 'sec');
        out.push({ S: n, kind: 'trig', D: call(cs ? 'cos' : 'sin', u),
          N: n.name === 'tan' ? call('sin', u) : n.name === 'cot' ? call('cos', u) : num(1) });
      } else if (n.type === 'div') out.push({ S: n, kind: 'div', N: n.a, D: n.b });
      else if (n.type === 'call' && n.name === 'log' && n.args.length === 1) out.push({ S: n, kind: 'log', D: n.args[0] });
      if (n.a) rec(n.a); if (n.b) rec(n.b); if (n.x) rec(n.x);
      if (n.args) n.args.forEach(rec);
    })(ast);
    return out;
  }
  function buildPoleGen(pt, ast) {
    const fi = pt.fi;
    const cands = singularCands(ast);
    for (const c of cands) {
      const sub = new Doc();
      let r;
      try { r = S.solveZero(sub, c.kind === 'log' ? c.D : c.D, { window: winFor(pt.x), noHeader: false }); } catch (e) { continue; }
      if (!r || !r.roots) continue;
      const m = A.nearest(r.roots, pt.x); if (!m) continue;
      const rest = mapAst(ast, n => n === c.S ? num(0) : null);
      if (c.kind !== 'log' && !isFinite(evalNum(rest, m.val))) continue;
      if (c.kind === 'log') {
        // übrige Summanden dürfen nicht selbst divergieren
        const restV = evalNum(mapAst(ast, n => n === c.S ? num(0) : null), m.val);
        if (!isFinite(restV)) continue;
      }
      const same = c.S === ast;
      const d = new Doc();
      const dl = 1e-6 * (1 + Math.abs(m.val));
      if (c.kind === 'log') {
        const fl = evalNum(ast, m.val - dl), fr = evalNum(ast, m.val + dl);
        if (!isFinite(fl) && !isFinite(fr)) continue;
        d.p('Der Logarithmus $' + T(c.S) + '$ ist nur für **positive** Argumente definiert. Nähert sich das Argument $' + T(c.D) + '$ der $0$, so geht $' + T(c.S) + '\\to-\\infty$ — der Graph hat dort eine **senkrechte Asymptote** (Polstelle am Rand des Definitionsbereichs).');
        d.h('Argument gleich $0$ setzen');
        d.e(T(c.D) + '=0');
        if (!(c.D.type === 'id')) sub.b.forEach(b => d.b.push(b)); else d.e('x=0');
        d.h('Verhalten an der Stelle $x=' + m.tex + '$');
        const lines = [];
        if (isFinite(fl)) lines.push('\\lim_{x\\to ' + m.tex + '^{-}}f(x)=' + (fl > 0 ? '+\\infty' : '-\\infty'));
        if (isFinite(fr)) lines.push('\\lim_{x\\to ' + m.tex + '^{+}}f(x)=' + (fr > 0 ? '+\\infty' : '-\\infty'));
        d.e(lines.join('\\qquad'));
        if (!isFinite(fl) || !isFinite(fr)) d.p('Auf der anderen Seite ist die Funktion nicht definiert (Argument negativ).');
        d.res('Senkrechte Asymptote: $x=' + m.tex + '$');
        d.meta = { x: m.val };
        return d;
      }
      // Nenner/Zähler-Fall
      const vN = valueAt(c.N, m);
      if (vN.sgn === 0 || !isFinite(vN.val)) continue;
      d.p('Eine **Polstelle** (senkrechte Asymptote) liegt bei einer Nullstelle des **Nenners** vor, an der der Zähler **nicht** $0$ ist.');
      if (c.kind === 'trig') {
        d.p('Zuerst als Bruch schreiben:');
        d.e(T(c.S) + '=\\frac{' + T(c.N) + '}{' + T(c.D) + '}');
      }
      if (!same) d.p('Die übrigen Summanden und Faktoren sind an dieser Stelle endlich — entscheidend ist der Bruch $' + (c.kind === 'trig' ? T(c.S) : T(c.S)) + '$.');
      d.h('Nenner gleich $0$ setzen');
      sub.b.forEach(b => d.b.push(b));
      d.h('Zähler an der Stelle $x=' + m.tex + '$ prüfen');
      d.e(chainTex('N(' + m.tex + ')', vN) + '\\neq0');
      d.p('Der Zähler ist $\\neq0$, der Nenner ist $0$ ⇒ **Polstelle** bei $x=' + m.tex + '$.');
      const sg = signAround(ast, m.val);
      if (!sg.l || !sg.r) continue;
      d.h('Verhalten an der Polstelle');
      d.e('\\lim_{x\\to ' + m.tex + '^{-}}f(x)=' + (sg.l > 0 ? '+' : '-') + '\\infty\\qquad\\lim_{x\\to ' + m.tex + '^{+}}f(x)=' + (sg.r > 0 ? '+' : '-') + '\\infty');
      d.p(sg.l === sg.r ? 'Das Vorzeichen bleibt gleich (**Pol ohne Vorzeichenwechsel**).' : 'Das Vorzeichen wechselt (**Pol mit Vorzeichenwechsel**).');
      d.res('Senkrechte Asymptote: $x=' + m.tex + '$' + (r.periodic && m.fam ? ' — wegen der Periodizität unendlich viele ($x=' + m.fam + '$, $k\\in\\mathbb{Z}$)' + (r.roots.some(q => Math.abs(evalNum(c.N, q.val)) < 1e-9) ? ', ausser dort, wo auch der Zähler $0$ wird' : '') : ''));
      if (!r.exact || !m.exact) A.approxNote(d);
      d.meta = { x: m.val };
      return d;
    }
    return null;
  }

  function buildPole(pt) {
    const ast = astOf(pt.fi); if (!ast) return null;
    const R = reducedRat(ast); if (!R || E.pDeg(R.D) < 1) return buildPoleGen(pt, ast);
    const d = new Doc(), fi = pt.fi;
    d.p('Eine **Polstelle** (senkrechte Asymptote) liegt bei einer Nullstelle des **Nenners** vor, an der der Zähler **nicht** $0$ ist.');
    const cancelled = E.pDeg(R.g) >= 1;
    let Nast, Dast, Dtxt;
    if (ast.type === 'div' && !cancelled && E.polyFromAst(ast.a) && E.polyFromAst(ast.b)) { Nast = ast.a; Dast = ast.b; }
    else {
      if (cancelled) {
        d.p('Zuerst **kürzen** (gemeinsamer Faktor $' + pT(E.pMonic ? E.pMonic(R.g) : R.g) + '$):');
        d.e(fName(fi, 0) + '(x)=\\frac{' + pT(R.N) + '}{' + pT(R.D) + '}');
      }
      Nast = polyToAst(R.N); Dast = polyToAst(R.D);
    }
    d.h('Nenner gleich $0$ setzen');
    const sub = new Doc();
    const r = S.solveZero(sub, Dast, { window: winFor(pt.x), noHeader: false });
    sub.b.forEach(b => d.b.push(b));
    const m = A.nearest(r.roots, pt.x); if (!m) return null;
    d.h('Zähler an der Stelle $x=' + m.tex + '$ prüfen');
    const vN = valueAt(Nast, m);
    d.e(chainTex('N(' + m.tex + ')', vN) + (vN.sgn === 0 ? '' : '\\neq0'));
    if (vN.sgn === 0) return null;
    d.p('Der Zähler ist $\\neq0$, der Nenner ist $0$ ⇒ **Polstelle** bei $x=' + m.tex + '$.');
    // Vielfachheit des Nennerfaktors (nur rationale Stelle exakt) + Verhalten
    const sg = signAround(ast, m.val);
    d.h('Verhalten an der Polstelle');
    const tl = sg.l > 0 ? '+\\infty' : '-\\infty', tr = sg.r > 0 ? '+\\infty' : '-\\infty';
    d.e('\\lim_{x\\to ' + m.tex + '^{-}}f(x)=' + tl + '\\qquad\\lim_{x\\to ' + m.tex + '^{+}}f(x)=' + tr);
    if (sg.l === sg.r) d.p('Das Vorzeichen bleibt gleich (**Pol ohne Vorzeichenwechsel**, gerade Vielfachheit des Nennerfaktors).');
    else d.p('Das Vorzeichen wechselt (**Pol mit Vorzeichenwechsel**, ungerade Vielfachheit des Nennerfaktors).');
    d.res('Senkrechte Asymptote: $x=' + m.tex + '$');
    d.meta = { x: m.val };
    return d;
  }

  // ───────────────────── Hebbare Lücke ─────────────────────
  function buildHole(pt) {
    const ast = astOf(pt.fi); if (!ast) return null;
    const RF = E.ratFromAst(ast); if (!RF) return null;
    const x0q = E.qFromFloat ? E.qFromFloat(pt.x) : null;
    if (!x0q) return null;
    // x0 rational?
    let N = E.pTrim(RF.N), D = E.pTrim(RF.D);
    const fi = pt.fi, d = new Doc();
    const guess = E.qFromFloat(pt.x);
    if (Math.abs(E.qNum(guess) - pt.x) > 1e-7) return null;
    const x0 = guess;
    const root = { val: E.qNum(x0), fe: E.feQ(x0), ast: E.astQ(x0), tex: E.qTex(x0), exact: true };
    if (!E.qIsZero(E.pEvalQ(N, x0)) || !E.qIsZero(E.pEvalQ(D, x0))) return null;
    d.p('Eine **hebbare Lücke** entsteht, wenn Zähler und Nenner an derselben Stelle $0$ werden und sich der Faktor kürzen lässt.');
    d.e(fName(fi, 0) + '(x)=' + (ast.type === 'div' ? T(ast) : '\\frac{' + pT(N) + '}{' + pT(D) + '}'));
    d.h('Zähler und Nenner an $x=' + root.tex + '$');
    d.e('N(' + root.tex + ')=0\\qquad D(' + root.tex + ')=0');
    d.p('Beide werden $0$, also ist $(x' + (E.qSgn(x0) > 0 ? '-' : '+') + E.qTex(E.qAbs(x0)) + ')$ ein gemeinsamer Faktor. **Polynomdivision** durch diesen Faktor:');
    const lin = [E.qNeg(x0), E.q1], linT = pT(lin);
    let guard = 0;
    while (E.qIsZero(E.pEvalQ(N, x0)) && E.qIsZero(E.pEvalQ(D, x0)) && guard++ < 6) {
      const qn = E.pDivmod(N, lin).q, qd = E.pDivmod(D, lin).q;
      d.e('\\left(' + pT(N) + '\\right):\\left(' + linT + '\\right)=' + pT(qn) + '\\qquad\\left(' + pT(D) + '\\right):\\left(' + linT + '\\right)=' + pT(qd));
      N = qn; D = qd;
    }
    d.h('Gekürzte Funktion');
    if (E.qIsZero(E.pEvalQ(D, x0))) return null;       // doch ein Pol → andere Engine
    let gAst, gTex;
    if (E.pDeg(D) === 0) { const P = E.pScale(N, E.qInv(D[0])); gAst = polyToAst(P); gTex = pT(P); }
    else { gAst = bin('div', polyToAst(N), polyToAst(D)); gTex = '\\frac{' + pT(N) + '}{' + pT(D) + '}'; }
    d.e('g(x)=' + gTex + '\\quad(x\\neq' + root.tex + ')');
    d.p('Den Wert $x=' + root.tex + '$ in die **gekürzte** Funktion $g$ einsetzen (dort ist $' + fName(fi, 0) + '$ selbst nicht definiert):');
    const vy = valueAt(gAst, root);
    d.e(chainTex('g(' + root.tex + ')', vy));
    const yv = { tex: vy.tex };
    d.res('Hebbare Lücke bei $' + coord(root.tex, yv.tex) + '$ — dort ist $f$ nicht definiert, der Graph hat ein „Loch“.');
    d.meta = { x: root.val, y: vy.val };
    return d;
  }

  // ───────────────────── Horizontale / schräge Asymptote ─────────────────────
  function buildAsymptote(pt) {
    let ast = astOf(pt.fi); if (!ast) return null;
    const dir = (pt.dir && String(pt.dir).indexOf('-') >= 0) ? -1 : 1;
    const d = new Doc(), fi = pt.fi;
    if (JSON.stringify(ast).indexOf('"abs"') >= 0) {            // Betrag: für grosse |x| ist das Vorzeichen des Inhalts fest
      const sgnTxt = [];
      const rep = mapAst(ast, n => {
        if (n.type === 'call' && n.name === 'abs' && n.args.length === 1) {
          const u = n.args[0], pos = evalNum(u, dir * 1e6) >= 0;
          sgnTxt.push('für $x\\to' + (dir > 0 ? '+' : '-') + '\\infty$ ist $' + T(u) + (pos ? '>0' : '<0') + '$, also $|' + T(u) + '|=' + (pos ? T(u) : '-(' + T(u) + ')') + '$');
          return pos ? u : neg(u);
        }
        return null;
      });
      const P1 = E.polyFromAst(rep);
      if (sgnTxt.length && P1 && E.pDeg(P1) === 1) {
        d.p('Bei einer Betragsfunktion fällt der Betrag für grosse $|x|$ weg: ' + sgnTxt.join('; ') + '.');
        d.e(fName(fi, 0) + '(x)=' + pT(P1));
        d.res('Schräge Asymptote (für $x\\to' + (dir > 0 ? '+' : '-') + '\\infty$): $y=' + pT(P1) + '$');
        d.meta = { slope: E.qNum(P1[1]), icpt: E.qNum(P1[0]) };
        return d;
      }
    }
    if (ast.type === 'call' && ast.name === 'sqrt' && ast.args.length === 1) {
      const Q = E.polyFromAst(ast.args[0]);
      if (Q && E.pDeg(Q) === 2 && E.qSgn(Q[2]) > 0) {
        const r = Math.sqrt(E.qNum(Q[2])), rq = E.qFromFloat(r);
        if (rq && Math.abs(E.qNum(rq) - r) < 1e-12 && E.qEq(E.qMul(rq, rq), Q[2])) {
          const pq = E.qDiv(Q[1], E.qMul(E.Q(2), Q[2]));
          const qq = E.qSub(Q[0], E.qDiv(E.qMul(Q[1], Q[1]), E.qMul(E.Q(4), Q[2])));
          const sl = dir > 0 ? rq : E.qNeg(rq);
          const P = [E.qMul(sl, pq), sl];
          const xp = E.qIsZero(pq) ? 'x' : '(x' + (E.qSgn(pq) > 0 ? '+' : '-') + E.qTex(E.qAbs(pq)) + ')';
          d.p('Für grosse $|x|$ dominiert der quadratische Term. **Quadratische Ergänzung** unter der Wurzel:');
          d.e(pT(Q) + '=' + (E.qEq(Q[2], E.q1) ? '' : E.qTexP(Q[2]) + '\\cdot ') + xp + '^{2}' + (E.qIsZero(qq) ? '' : (E.qSgn(qq) > 0 ? '+' : '-') + E.qTex(E.qAbs(qq))));
          d.p('Der konstante Rest ' + (E.qIsZero(qq) ? '$0$' : '$' + E.qTex(qq) + '$') + ' fällt gegenüber $' + xp + '^{2}$ nicht ins Gewicht, und $\\sqrt{u^{2}}=|u|$:');
          d.e('f(x)\\approx\\sqrt{' + (E.qEq(Q[2], E.q1) ? '' : E.qTexP(Q[2]) + '\\cdot ') + xp + '^{2}}=' + (E.qEq(rq, E.q1) ? '' : E.qTexP(rq) + '\\cdot ') + '\\left|' + xp + '\\right|');
          d.p('Für $x\\to' + (dir > 0 ? '+' : '-') + '\\infty$ ist $' + xp + (dir > 0 ? '>0' : '<0') + '$, also fällt der Betrag ' + (dir > 0 ? 'einfach weg' : 'mit einem Minuszeichen weg') + ':');
          d.res('Schräge Asymptote (für $x\\to' + (dir > 0 ? '+' : '-') + '\\infty$): $y=' + pT(P) + '$');
          d.meta = { slope: E.qNum(P[1]), icpt: E.qNum(P[0]) };
          return d;
        }
      }
    }
    const R = reducedRat(ast);
    if (R && E.pDeg(R.D) >= 1) {
      const n = E.pDeg(R.N), m = E.pDeg(R.D);
      if (pt.oblique || n === m + 1) {
        if (n !== m + 1) return null;
        d.p('Zählergrad $' + n + '$ = Nennergrad $' + m + '$ + 1 ⇒ **schräge Asymptote**. Sie ergibt sich aus der **Polynomdivision**:');
        const qr = E.pDivmod(R.N, R.D);
        d.e('\\left(' + pT(R.N) + '\\right):\\left(' + pT(R.D) + '\\right)=' + pT(qr.q) + (E.pIsZero(qr.r) ? '' : '+\\frac{' + pT(qr.r) + '}{' + pT(R.D) + '}'));
        d.p('Der Restbruch strebt für $x\\to\\pm\\infty$ gegen $0$ (Zählergrad < Nennergrad):');
        if (!E.pIsZero(qr.r)) d.e('\\lim_{x\\to\\pm\\infty}\\frac{' + pT(qr.r) + '}{' + pT(R.D) + '}=0');
        d.res('Schräge Asymptote: $y=' + pT(qr.q) + '$');
        d.meta = { slope: E.qNum(qr.q[1]), icpt: E.qNum(qr.q[0]) };
        return d;
      }
      if (n > m + 1) return null;
      d.p('Eine **waagrechte Asymptote** entspricht dem Grenzwert für $x\\to\\pm\\infty$.');
      const sub = new Doc();
      const lr = ratLimit(R.N, R.D, dir, sub);
      sub.b.forEach(b => d.b.push(b));
      if (lr.kind !== 'val') return null;
      if (n === m) d.p('Gleicher Grad in Zähler und Nenner ⇒ Verhältnis der **Leitkoeffizienten**. Für $x\\to-\\infty$ ergibt sich derselbe Wert.');
      else d.p('Nennergrad > Zählergrad ⇒ die $x$-Achse ist Asymptote. Für $x\\to-\\infty$ ergibt sich derselbe Wert.');
      d.res('Waagrechte Asymptote: $y=' + lr.tex + '$');
      d.meta = { y: lr.num !== undefined ? lr.num : E.feNum(lr.fe) };
      return d;
    }
    // exponentielle Formen: abklingende Exponentialterme + Polynom/rationaler Rest → schräge/waagrechte Asymptote
    {
      const terms = flatSum(ast, 1, []);
      const dec = [], rest = [];
      terms.forEach(t => {
        const st = A.toState(t.n);
        if (st.t === 'pe' && E.qSgn(st.k) * dir < 0) dec.push(t); else rest.push(t);
      });
      if (dec.length && rest.length) {
        const restAst = rest.map((t, i) => t).reduce((acc, t) => acc === null ? (t.s < 0 ? neg(t.n) : t.n) : bin(t.s < 0 ? 'sub' : 'add', acc, t.n), null);
        const RR = reducedRat(restAst);
        if (RR && E.pDeg(RR.D) >= 0) {
          const nn = E.pDeg(RR.N), mm = E.pDeg(RR.D);
          if (nn === mm + 1) {
            const qr = E.pDivmod(RR.N, RR.D);
            const decTex = dec.map(t => (t.s < 0 ? '-' : '+') + A.stateTex(A.toState(t.n))).join('').replace(/^\+/, '');
            const dd = new Doc();
            dd.p('Für $x\\to' + (dir > 0 ? '+' : '-') + '\\infty$ strebt der Summand $' + decTex + '$ gegen $0$ (' + 'Exponentialfunktion mit abnehmendem Exponenten). Es bleibt der Rest:');
            dd.e(fName(fi, 0) + '(x)\\ \\approx\\ ' + pT(qr.q) + (E.pIsZero(qr.r) ? '' : '+\\frac{' + pT(qr.r) + '}{' + pT(RR.D) + '}'));
            dd.res('Schräge Asymptote (für $x\\to' + (dir > 0 ? '+' : '-') + '\\infty$): $y=' + pT(qr.q) + '$');
            dd.meta = { slope: E.qNum(qr.q[1]), icpt: E.qNum(qr.q[0]) };
            return dd;
          }
        }
      }
    }
    const sub = new Doc();
    const lr = limitOf(ast, dir, sub);
    if (!lr || lr.kind !== 'val') return null;
    d.p('Eine **waagrechte Asymptote** entspricht dem Grenzwert für $x\\to' + (dir > 0 ? '+' : '-') + '\\infty$.');
    sub.b.forEach(b => d.b.push(b));
    if (/"EC"|"exp"/.test(JSON.stringify(ast))) d.note(expNote);
    d.res('Waagrechte Asymptote (für $x\\to' + (dir > 0 ? '+' : '-') + '\\infty$): $y=' + lr.tex + '$');
    d.meta = { y: lr.num !== undefined ? lr.num : E.feNum(lr.fe) };
    return d;
  }

  // ───────────────────── Grenzwerte im Unendlichen (beide Richtungen) ─────────────────────
  function buildLimitsInf(fi) {
    const ast = astOf(fi); if (!ast) return null;
    const out = new Doc();
    const L = [];
    for (const dir of [-1, 1]) {
      const sub = new Doc();
      const lr = limitOf(ast, dir, sub);
      if (!lr) return null;
      out.h('$x\\to' + (dir > 0 ? '+' : '-') + '\\infty$');
      sub.b.forEach(b => out.b.push(b));
      L.push(lr);
    }
    const fmt = (lr, dir) => limTex(dir) + '\\ ' + fName(fi, 0) + '(x)=' + (lr.kind === 'val' ? lr.tex : infTex(lr.sign));
    out.res('$' + fmt(L[0], -1) + '$<br>$' + fmt(L[1], 1) + '$');
    return out;
  }

  // ───────────────────── Verteiler ─────────────────────
  function buildFor(pt) {
    switch (pt.kind) {
      case 'yaxis': return A.buildYAxis(pt);
      case 'zero': return A.buildZero(pt);
      case 'max': case 'min': return A.buildExtremum(pt);
      case 'inf': return A.buildInflection(pt);
      case 'isect': return A.buildIsect(pt);
      case 'pole': return buildPole(pt);
      case 'hole': return buildHole(pt);
      case 'asymp': return buildAsymptote(pt);
      default: return null;
    }
  }
  Object.assign(A, { buildPole, buildHole, buildAsymptote, buildLimitsInf, buildFor, limitOf, ratLimit, reducedRat });

  // ───────────────────── Einhängen in die Oberfläche ─────────────────────
  if (typeof window !== 'undefined' && typeof window.generateSolveSteps === 'function' && !window.__svHooked) {
    window.__svHooked = true;
    const legacy = window.generateSolveSteps;
    window.generateSolveSteps = function (pt) {
      try {
        const d = buildFor(pt);
        if (d && d.b.length) return renderDoc(d);
      } catch (e) { if (window.console) console.warn('Lösungsweg-Engine:', e); }
      return legacy(pt);
    };
    // mehrere Asymptoten gleichzeitig: identische Herleitungen (z.B. schräge Asymptote für +∞ und −∞) nur einmal zeigen
    const legacyShow = window.showSolveTooltip;
    if (typeof legacyShow === 'function') {
      window.showSolveTooltip = function (pts) {
        if (Array.isArray(pts) && pts.length > 1) {
          const seen = new Set();
          pts = pts.filter(q => {
            if (q.kind !== 'asymp') return true;
            let rational = false;
            try { const a = astOf(q.fi); rational = !!(a && reducedRat(a)); } catch (e) { /* roh */ }
            const k = q.oblique ? 'o|' + (+q.slope).toFixed(6) + '|' + (+q.intercept).toFixed(6)
              : 'h|' + (+q.y).toFixed(6) + (rational ? '' : '|' + q.dir);
            if (seen.has(k)) return false;
            seen.add(k); return true;
          });
        }
        return legacyShow(pts);
      };
    }
    const legacyLim = window.showLimitsInfinityTooltip;
    if (typeof legacyLim === 'function') {
      window.showLimitsInfinityTooltip = function (fi) {
        let d = null;
        try { d = buildLimitsInf(fi); } catch (e) { if (window.console) console.warn('Lösungsweg-Engine (Grenzwerte):', e); }
        if (!d) return legacyLim(fi);
        const tooltip = document.getElementById('solve-tooltip');
        const titleEl = document.getElementById('solve-tooltip-title');
        const content = document.getElementById('solve-tooltip-content');
        const fn = functions[fi];
        if (!tooltip || !titleEl || !content || !fn) return legacyLim(fi);
        titleEl.innerHTML = 'f<sub>' + (fi + 1) + '</sub>&thinsp;Grenzwerte im Unendlichen';
        titleEl.style.color = fn.color || '';
        content.innerHTML = renderDoc(d);
        window._activeTooltipPt = { fi, kind: 'liminf' };
        tooltip.style.display = 'block';
      };
    }
  }
})();
