// ═══════════════════════════════════════════════════════════════════
// MODUL 21: solver — schulgerechter Gleichungslöser MIT Lösungsweg
//
// Teil A (diese Datei): Dokument-Baustein (Doc), Hilfsfunktionen, Polynom-
// gleichungen exakt (Ausklammern, Mitternachtsformel, Substitution, rationale
// Nullstellen + Horner-Division). Teil B (21b_equation.js): allgemeine
// Gleichungen (Brüche, Produkte, Umformen bei e^x/ln/√/trig, Substitution).
//
// Alles rechnet EXAKT (siehe 20_exact.js); Fliesskomma dient nur als
// Gegenprobe und als klar gekennzeichneter Notfall ("Näherung").
// ═══════════════════════════════════════════════════════════════════
const SV = (function () {
  const E = EX;

  // ───────────────────── Dokument (Folge von Blöcken) ─────────────────────
  // k:'h' Überschrift | 'p' Text (mit $…$-Formeln) | 'e' Formelzeile (+ op = Randnotiz)
  // 'res' Ergebnis | 'note' Hinweis | 'sub' eingerückter Unterabschnitt
  function Doc() { this.b = []; }
  Doc.prototype.h = function (t) { this.b.push({ k: 'h', t }); return this; };
  Doc.prototype.p = function (t) { this.b.push({ k: 'p', t }); return this; };
  Doc.prototype.e = function (t, op) { this.b.push({ k: 'e', t, op: op || '' }); return this; };
  Doc.prototype.op = function (op) { const l = this.b[this.b.length - 1]; if (l && l.k === 'e') l.op = op; return this; };
  Doc.prototype.res = function (t) { this.b.push({ k: 'res', t }); return this; };
  Doc.prototype.note = function (t) { this.b.push({ k: 'note', t }); return this; };
  Doc.prototype.sub = function (d) { this.b.push({ k: 'sub', b: d.b }); return this; };
  Doc.prototype.last = function () { return this.b[this.b.length - 1]; };

  // ───────────────────── AST-Helfer ─────────────────────
  const num = s => ({ type: 'num', v: String(s) });
  const bin = (type, a, b) => ({ type, a, b });
  const neg = x => ({ type: 'neg', x });
  const call = (name, ...args) => ({ type: 'call', name, args });
  const idn = v => ({ type: 'id', v });
  const PI = idn('pi'), EC = idn('EC');
  const containsX = (n, v) => calcContainsVar(n, v || 'x');
  function countX(n, v) {
    v = v || 'x';
    switch (n.type) {
      case 'num': return 0;
      case 'id': return n.v === v ? 1 : 0;
      case 'call': return n.args.reduce((s, a) => s + countX(a, v), 0);
      case 'neg': return countX(n.x, v);
      default: return countX(n.a, v) + countX(n.b, v);
    }
  }
  function T(n) { try { return miToLatex(n); } catch (e) { return '?'; } }
  const isNumNode = n => n.type === 'num';

  // Parameter (Schieberegler) durch ihren aktuellen Wert ersetzen
  function substParams(n) {
    switch (n.type) {
      case 'num': return n;
      case 'id': {
        if (n.v === 'x' || n.v === 'pi' || n.v === 'EC') return n;
        if (typeof params !== 'undefined' && params[n.v] && isFinite(params[n.v].val)) {
          const val = parseFloat(params[n.v].val.toFixed(8));
          const s = String(Math.abs(val));
          return val < 0 ? neg(num(s)) : num(s);
        }
        return n;
      }
      case 'neg': return neg(substParams(n.x));
      case 'call': return call(n.name, ...n.args.map(substParams));
      default: return bin(n.type, substParams(n.a), substParams(n.b));
    }
  }

  // Numerische Auswertung eines AST (nur Gegenprobe/Vorzeichen — nie Anzeige!)
  function evalNum(n, x) {
    switch (n.type) {
      case 'num': return parseFloat(n.v);
      case 'id':
        if (n.v === 'x') return x;
        if (n.v === 'pi') return Math.PI;
        if (n.v === 'EC') return Math.E;
        if (typeof params !== 'undefined' && params[n.v]) return params[n.v].val;
        return NaN;
      case 'neg': return -evalNum(n.x, x);
      case 'add': return evalNum(n.a, x) + evalNum(n.b, x);
      case 'sub': return evalNum(n.a, x) - evalNum(n.b, x);
      case 'mul': return evalNum(n.a, x) * evalNum(n.b, x);
      case 'div': return evalNum(n.a, x) / evalNum(n.b, x);
      case 'pow': {
        const a = evalNum(n.a, x), b = evalNum(n.b, x);
        if (a < 0 && Math.abs(b - Math.round(b)) > 1e-12) {
          // ungerade Wurzel aus negativer Zahl (x^(1/3)) — wie nthroot
          const inv = 1 / b;
          if (Math.abs(inv - Math.round(inv)) < 1e-9 && Math.round(inv) % 2 !== 0) return -Math.pow(-a, b);
        }
        return Math.pow(a, b);
      }
      case 'call': {
        const a = n.args.map(z => evalNum(z, x));
        switch (n.name) {
          case 'sin': return Math.sin(a[0]); case 'cos': return Math.cos(a[0]); case 'tan': return Math.tan(a[0]);
          case 'sqrt': return Math.sqrt(a[0]); case 'abs': return Math.abs(a[0]);
          case 'log': return Math.log(a[0]); case 'exp': return Math.exp(a[0]);
          case 'asin': return Math.asin(a[0]); case 'acos': return Math.acos(a[0]); case 'atan': return Math.atan(a[0]);
          case 'log10': return Math.log10(a[0]);
          case 'logn': case 'logbase': return Math.log(a[0]) / Math.log(a[1]);
          case 'nthroot': { const nn = a[1]; if (a[0] < 0 && Math.round(nn) % 2 !== 0) return -Math.pow(-a[0], 1 / nn); return Math.pow(a[0], 1 / nn); }
          default: return NaN;
        }
      }
      default: return NaN;
    }
  }
  const fmtNum = v => {
    if (!isFinite(v)) return '?';
    const a = Math.abs(v);
    const d = a >= 100 ? 2 : a >= 1 ? 3 : 4;
    return String(parseFloat(v.toFixed(d)));
  };

  // ───────────────────── Lösungs-Objekte ─────────────────────
  // {val, tex, ast, exact, fe?, lf?, fam?}
  function rootFe(fe) {
    return { val: E.feNum(fe), tex: E.feTex(fe), ast: E.astFe(fe), exact: true, fe };
  }
  function rootNum(val) {
    const s = fmtNum(val);
    return { val, tex: s, ast: s.charAt(0) === '-' ? neg(num(s.slice(1))) : num(s), exact: false };
  }
  function sortDedupe(roots) {
    roots.sort((a, b) => a.val - b.val);
    const out = [];
    roots.forEach(r => { if (!out.length || Math.abs(out[out.length - 1].val - r.val) > 1e-9) out.push(r); });
    return out;
  }
  const idx = (v, i) => v + '_{' + i + '}';

  // ───────────────────── numerische reelle Polynomwurzeln (Notfall) ─────────────────────
  function numRealRoots(P) {
    const c0 = E.pTrim(P).map(E.qNum);
    function rec(c) {
      const n = c.length - 1;
      if (n < 1) return [];
      if (n === 1) return [-c[0] / c[1]];
      const d = c.slice(1).map((v, i) => v * (i + 1));
      const crit = rec(d).sort((a, b) => a - b);
      const bound = 1 + Math.max(...c.slice(0, n).map(v => Math.abs(v / c[n])));
      const ev = x => { let r = 0; for (let i = n; i >= 0; i--) r = r * x + c[i]; return r; };
      const scale = Math.max(...c.map(Math.abs)) || 1;
      const pts = [-bound, ...crit, bound], out = [];
      for (let i = 0; i < pts.length - 1; i++) {
        let a = pts[i], b = pts[i + 1], fa = ev(a), fb = ev(b);
        if (Math.abs(fa) < 1e-10 * scale) { out.push(a); continue; }
        if (fa * fb < 0) {
          for (let it = 0; it < 200; it++) { const m = (a + b) / 2, fm = ev(m); if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; } }
          out.push((a + b) / 2);
        }
      }
      if (Math.abs(ev(pts[pts.length - 1])) < 1e-10 * scale) out.push(pts[pts.length - 1]);
      return out;
    }
    const r = rec(c0), u = [];
    r.sort((a, b) => a - b).forEach(x => { if (!u.length || Math.abs(u[u.length - 1] - x) > 1e-7) u.push(x); });
    return u;
  }

  // ───────────────────── Quadratische Gleichung (a,b,c ganzzahlig) ─────────────────────
  function sqrtTexSimplified(r) {           // r ∈ Q ≥ 0:  "\sqrt{12}=2\sqrt{3}" (nur wenn es sich ändert)
    const s = E.feSqrtQ(r);
    const plain = '\\sqrt{' + E.qTex(r) + '}';
    const st = E.feTex(s);
    return { plain, simp: st, changed: st !== plain };
  }
  // Operation "q abziehen" als Randnotiz:  q>0 → "-q",  q<0 → "+|q|"
  const subOp = q => (q.n < 0n ? '+' : '-') + E.qTex(E.qAbs(q));
  function quadratic(doc, a, b, c, v) {
    const roots = [];
    if (E.qIsZero(b)) {                                      // a·x² + c = 0
      const r = E.qDiv(E.qNeg(c), a);
      doc.op(subOp(c));
      doc.e((E.qEq(a, E.q1) ? '' : E.qTex(a)) + v + '^{2}=' + E.qTex(E.qNeg(c)));
      if (!E.qEq(a, E.q1)) { doc.op(':' + E.qTexP(a)); doc.e(v + '^{2}=' + E.qTex(r)); }
      if (r.n < 0n) {
        doc.p('Ein Quadrat ist nie negativ — die Gleichung hat **keine reelle Lösung**.');
        return roots;
      }
      const sq = sqrtTexSimplified(r);
      doc.op('\\sqrt{\\ }');
      doc.e(v + '=\\pm' + sq.plain + (sq.changed ? '=\\pm' + sq.simp : ''));
      const s = E.feSqrtQ(r);
      roots.push(rootFe(E.feNeg(s)), rootFe(s));
      return roots;
    }
    const aT = E.qTexP(a), bT = E.qTexP(b), cT = E.qTexP(c);
    doc.p('**Mitternachtsformel** mit $a=' + E.qTex(a) + ',\\ b=' + E.qTex(b) + ',\\ c=' + E.qTex(c) + '$:');
    doc.e(idx(v, '1,2') + '=\\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}');
    const D = E.qSub(E.qMul(b, b), E.qMul(Q4, E.qMul(a, c)));
    doc.e(idx(v, '1,2') + '=\\frac{-' + bT + '\\pm\\sqrt{' + bT + '^{2}-4\\cdot' + aT + '\\cdot' + cT + '}}{2\\cdot' + aT + '}');
    const twoA = E.qTex(E.qMul(Q2, a)), nb = E.qTex(E.qNeg(b));
    doc.e(idx(v, '1,2') + '=\\frac{' + nb + '\\pm\\sqrt{' + E.qTex(D) + '}}{' + twoA + '}');
    if (D.n < 0n) {
      doc.p('Die **Diskriminante** $D=' + E.qTex(D) + '<0$ ist negativ — **keine reelle Lösung**.');
      return roots;
    }
    if (D.n === 0n) {
      doc.p('Die **Diskriminante** ist $D=0$: genau eine (doppelte) Lösung.');
      const x0 = E.feDiv(E.feQ(E.qNeg(b)), E.feQ(E.qMul(Q2, a)));
      doc.e(v + '=' + E.feTex(x0));
      roots.push(rootFe(x0));
      return roots;
    }
    const sq = sqrtTexSimplified(D), sD = E.feSqrtQ(D);
    doc.p('Die **Diskriminante** ist $D=' + E.qTex(D) + '>0$' + (sq.changed || E.feIsRat(sD) ? ' mit $\\sqrt{D}=' + sq.simp + '$' : '') + ' — zwei Lösungen:');
    const den = E.feQ(E.qMul(Q2, a));
    const x1 = E.feDiv(E.feAdd(E.feQ(E.qNeg(b)), sD), den);
    const x2 = E.feDiv(E.feSub(E.feQ(E.qNeg(b)), sD), den);
    const f1 = '\\frac{' + nb + '+' + sq.simp + '}{' + twoA + '}';
    const f2 = '\\frac{' + nb + '-' + (E.feIsRat(sD) ? sq.simp : sq.simp) + '}{' + twoA + '}';
    const s1 = E.feTex(x1), s2 = E.feTex(x2);
    doc.e(idx(v, 1) + '=' + f1 + (s1 !== f1 ? '=' + s1 : ''));
    doc.e(idx(v, 2) + '=' + f2 + (s2 !== f2 ? '=' + s2 : ''));
    roots.push(rootFe(x1), rootFe(x2));
    return roots;
  }
  const Q2 = E.Q(2), Q4 = E.Q(4);

  // ───────────────────── Polynomgleichung P(v) = 0 ─────────────────────
  // P: Q-Koeffizienten (aufsteigend). o: {v, noHeader}
  // Liefert {roots, all?}; roots[] sind exakte (oder, klar markiert, numerische) Lösungs-Objekte.
  function solvePoly(doc, P0, o) {
    o = o || {};
    const v = o.v || 'x';
    let P = E.pTrim(P0), roots = [];
    if (!P.length) { doc.p('Alle Koeffizienten sind $0$ — jedes $' + v + '$ ist eine Lösung.'); return { roots: [], all: true }; }
    if (E.pDeg(P) === 0) { doc.p('Die Gleichung $' + E.qTex(P[0]) + '=0$ ist ein Widerspruch — **keine Lösung**.'); return { roots: [] }; }
    if (!o.noHeader) doc.e(E.pTex(P, v) + '=0');

    const ensure = () => { const l = doc.last(); if (!(l && l.k === 'e')) doc.e(E.pTex(P, v) + '=0'); };
    // 1) ganzzahlig & teilerfremd machen
    const pr = E.pPrimitive(P);
    if (!E.qEq(pr.k, E.q1)) {
      const k = pr.k;
      ensure();
      doc.op(k.n === 1n ? ':' + k.d : '\\cdot ' + E.qTexP(k));
      doc.e(E.pTex(pr.P, v) + '=0');
    }
    P = pr.P;

    // 2) x ausklammern
    let low = 0; while (E.qIsZero(P[low])) low++;
    // Monom  c·x^k = 0  ⇒  x = 0  (nichts auszuklammern, kein Restpolynom)
    if (low > 0 && E.pDeg(P) === low) {
      ensure();
      const lead = P[low], pw = v + (low > 1 ? '^{' + low + '}' : '');
      if (!E.qEq(lead, E.q1)) { doc.op(':' + E.qTexP(lead)); doc.e(pw + '=0'); }
      if (low > 1) { doc.op(low === 2 ? '\\sqrt{\\ }' : '\\sqrt[' + low + ']{\\ }'); doc.e(v + '=0'); }
      return { roots: [rootFe(E.feInt(0))] };
    }
    if (low > 0) {
      const R = P.slice(low);
      ensure();
      doc.op(v + '\\text{ ausklammern}');
      doc.e(v + (low > 1 ? '^{' + low + '}' : '') + '\\cdot\\left(' + E.pTex(R, v) + '\\right)=0', 'Satz vom Nullprodukt');
      doc.e(v + '=0\\quad\\text{oder}\\quad ' + E.pTex(R, v) + '=0');
      roots.push(rootFe(E.feInt(0)));
      P = R;
    }
    const deg = E.pDeg(P);
    if (deg === 1) {
      const a = P[1], b = P[0];
      const lastB = doc.last();
      if (!(lastB && lastB.k === 'e' && lastB.t === E.pTex(P, v) + '=0')) doc.e(E.pTex(P, v) + '=0');
      doc.op(subOp(b));
      if (!E.qEq(a, E.q1)) {
        doc.e((E.qEq(a, E.q1) ? '' : E.qEq(a, E.qNeg(E.q1)) ? '-' : E.qTex(a)) + v + '=' + E.qTex(E.qNeg(b)));
        doc.op(':' + E.qTexP(a));
      }
      const x0 = E.feQ(E.qDiv(E.qNeg(b), a));
      doc.e(v + '=' + E.feTex(x0));
      roots.push(rootFe(x0));
    } else if (deg === 2) {
      if (low > 0) doc.p('**Restgleichung** (quadratisch):');
      quadratic(doc, P[2], P[1], P[0], v).forEach(r => roots.push(r));
    } else {
      const onlyEven = P.every((c, i) => i % 2 === 0 || E.qIsZero(c));
      if (onlyEven && deg >= 4) {
        const Z = []; for (let i = 0; i <= deg; i += 2) Z.push(P[i]);
        doc.p('Es kommen nur **gerade Potenzen** von $' + v + '$ vor — Substitution $z=' + v + '^{2}$:');
        doc.e(E.pTex(Z, 'z') + '=0');
        const sub = new Doc();
        const zr = solvePoly(sub, Z, { v: 'z', noHeader: true });
        doc.sub(sub);
        zr.roots.forEach(zRoot => {
          if (!zRoot.fe) { roots.push(...(zRoot.val > 0 ? [rootNum(-Math.sqrt(zRoot.val)), rootNum(Math.sqrt(zRoot.val))] : [])); return; }
          const sgn = E.feSgn(zRoot.fe);
          if (sgn < 0) { doc.p('$z=' + zRoot.tex + '<0$: $' + v + '^{2}=' + zRoot.tex + '$ hat **keine reelle Lösung**.'); return; }
          if (sgn === 0) { doc.p('$z=0$ ⇒ $' + v + '=0$.'); roots.push(rootFe(E.feInt(0))); return; }
          if (E.feIsRat(zRoot.fe)) {
            const sq = sqrtTexSimplified(zRoot.fe.p), s = E.feSqrtQ(zRoot.fe.p);
            doc.p('Rücksubstitution: $' + v + '^{2}=' + zRoot.tex + '$ ⇒ $' + v + '=\\pm' + (sq.changed ? sq.plain + '=\\pm' + sq.simp : sq.simp) + '$.');
            roots.push(rootFe(E.feNeg(s)), rootFe(s));
          } else if (E.qIsZero(zRoot.fe.p) && E.qEq(zRoot.fe.q, E.q1)) {
            const val = Math.pow(zRoot.val * zRoot.val, 0.25), t = '\\sqrt[4]{' + String(zRoot.fe.d) + '}';
            doc.p('Rücksubstitution: $' + v + '^{2}=' + zRoot.tex + '$ ⇒ $' + v + '=\\pm' + t + '$.');
            const a4 = call('nthroot', num(String(zRoot.fe.d)), num(4));
            roots.push({ val: -val, tex: '-' + t, ast: neg(a4), exact: true }, { val, tex: t, ast: a4, exact: true });
          } else {
            const val = Math.sqrt(zRoot.val), t = '\\sqrt{' + zRoot.tex + '}';
            doc.p('Rücksubstitution: $' + v + '^{2}=' + zRoot.tex + '$ ⇒ $' + v + '=\\pm' + t + '$.');
            roots.push({ val: -val, tex: '-' + t, ast: neg(call('sqrt', zRoot.ast)), exact: true }, { val, tex: t, ast: call('sqrt', zRoot.ast), exact: true });
          }
        });
      } else if (P.slice(1, deg).every(c => E.qIsZero(c)) && !E.ratRootCandidates(P).cands.some(c => E.qIsZero(E.pEvalQ(P, c)))) {
        // Binomgleichung  a·x^n + c = 0  ohne rationale Lösung → n-te Wurzel
        const r = E.qDiv(E.qNeg(P[0]), P[deg]);
        if (!(doc.last() && doc.last().k === 'e' && doc.last().t === E.pTex(P, v) + '=0')) doc.e(E.pTex(P, v) + '=0');
        doc.op(subOp(P[0]));
        doc.e(v + '^{' + deg + '}=' + E.qTex(r));
        if (deg % 2 === 0 && E.qSgn(r) < 0) doc.p('Eine gerade Potenz ist nie negativ — **keine reelle Lösung**.');
        else {
          const absr = E.qAbs(r);
          const radT = '\\sqrt[' + deg + ']{' + E.qTex(absr) + '}';
          const rv = Math.pow(Number(absr.n) / Number(absr.d), 1 / deg);
          const astR = call('nthroot', E.astQ(absr), num(deg));
          doc.op('\\sqrt[' + deg + ']{\\ }');
          if (deg % 2 === 0) {
            doc.e(v + '=\\pm' + radT);
            roots.push({ val: -rv, tex: '-' + radT, ast: neg(astR), exact: true }, { val: rv, tex: radT, ast: astR, exact: true });
          } else {
            const sg = E.qSgn(r) < 0;
            doc.e(v + '=' + (sg ? '-' : '') + radT);
            roots.push({ val: sg ? -rv : rv, tex: (sg ? '-' : '') + radT, ast: sg ? neg(astR) : astR, exact: true });
          }
        }
      } else {
        rationalRoots(doc, P, v, roots);
      }
    }
    return { roots: sortDedupe(roots) };
  }

  // Rationale Nullstellen finden (Satz über rationale Nullstellen) + Horner-Division, rekursiv
  function rationalRoots(doc, P, v, roots) {
    let first = true, guard = 0;
    while (E.pDeg(P) >= 3 && guard++ < 12) {
      const info = E.ratRootCandidates(P);
      if (!info) break;
      if (first) {
        const a0 = P[0].n, an = P[P.length - 1].n;
        const abs0 = a0 < 0n ? -a0 : a0, absn = an < 0n ? -an : an;
        doc.p('**Satz über rationale Nullstellen**: Jede rationale Nullstelle $\\tfrac{p}{q}$ hat $p\\mid ' + abs0 + '$ (Teiler des konstanten Gliedes) und $q\\mid ' + absn + '$ (Teiler des Leitkoeffizienten). Mögliche Kandidaten:');
        const shown = info.cands.slice(0, 16).map(E.qTex).join(',\\ ');
        doc.e('\\left\\{' + shown + (info.cands.length > 16 ? ',\\ \\dots' : '') + '\\right\\}');
        first = false;
      } else {
        doc.p('Weitere Nullstelle des Restpolynoms $' + E.pTex(P, v) + '$ suchen:');
      }
      let found = null, shownFail = 0;
      const fails = [];
      for (const cnd of info.cands) {
        const val = E.pEvalQ(P, cnd);
        if (E.qIsZero(val)) { found = cnd; break; }
        if (shownFail < 3) { fails.push(cnd); shownFail++; }
      }
      if (!found) break;
      const lines = fails.map(cnd => 'P(' + E.qTex(cnd) + ')=' + E.qTex(E.pEvalQ(P, cnd)) + '\\neq 0');
      if (lines.length) doc.e(lines.join(',\\quad '));
      doc.e('P(' + E.qTex(found) + ')=0\\ \\checkmark');
      const h = E.hornerDiv(P, found);
      const lin = v + (found.n < 0n ? '+' : '-') + E.qTex(E.qAbs(found));
      doc.p('$' + v + '=' + E.qTex(found) + '$ ist eine Nullstelle. **Polynomdivision** (Horner-Schema) durch $(' + lin + ')$:');
      doc.e('\\left(' + E.pTex(P, v) + '\\right):\\left(' + lin + '\\right)=' + E.pTex(h.q, v));
      roots.push(rootFe(E.feQ(found)));
      P = h.q;
    }
    const deg = E.pDeg(P);
    if (deg === 2) {
      doc.p('**Restgleichung** (quadratisch): $' + E.pTex(P, v) + '=0$');
      const pr = E.pPrimitive(P).P;
      quadratic(doc, pr[2], pr[1], pr[0], v).forEach(r => roots.push(r));
    } else if (deg === 1) {
      const x0 = E.feQ(E.qDiv(E.qNeg(P[0]), P[1]));
      doc.e(v + '=' + E.feTex(x0)); roots.push(rootFe(x0));
    } else if (deg >= 3) {
      const nr = numRealRoots(P);
      doc.p('Das Restpolynom $' + E.pTex(P, v) + '$ hat **keine rationale Nullstelle** und lässt sich hier nicht in Wurzeln auflösen. ' +
        (nr.length ? '**Numerische Näherung** der reellen Nullstellen: ' + nr.map(r => '$' + v + '\\approx' + fmtNum(r) + '$').join(', ') + '.' : 'Es gibt keine weiteren reellen Nullstellen.'));
      nr.forEach(r => roots.push(rootNum(r)));
    }
  }

  return { Doc, E, num, bin, neg, call, idn, PI, EC, containsX, countX, T, substParams, evalNum, fmtNum, rootFe, rootNum, sortDedupe, idx, numRealRoots, quadratic, solvePoly, sqrtTexSimplified };
})();

if (typeof module !== 'undefined') module.exports = SV;
