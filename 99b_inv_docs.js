// ═════════════════════════════════════════════════════════════════
// MODUL 99b: Rechenwege der Umkehrfunktionen (zu 99_inv.js, ohne DOM)
//
// Schritte {k, s, sc} wie bei 93b_exp_docs.js: k 'h' Überschrift, 'p' Text (**fett**, $Formel$), 'e' Formelzeile,
// 'res' Ergebnis, 'note' Hinweis; sc = Farbbuchstabe, wenn die Zeile auch im Bild erscheint.
//   Inv.st.mirror(R, xp)       Begriff: Zuordnung rückwärts, Spiegelung an y = x, D und W tauschen
//   Inv.st.test(R, k)          Umkehrbarkeit: waagrechte Gerade y = k, strenge Monotonie, Einschränkung des Definitionsbereichs
//   Inv.st.calc(R, x0)         Umkehrfunktion berechnen: nach x auflösen, Variablen tauschen, D/W, Probe
//   Inv.st.pairs(P, x0)        Bekannte Paare: Verkettung f⁻¹(f(x)) = x, Bereiche, Hinweis
// Inv.doc(r) → SV.Doc, Inv.sceneLines(r) → Zeilen im Bild
// ═════════════════════════════════════════════════════════════════
(function () {
  const E = Dif.E, { DOC, fmtT } = Dif;
  const q1 = E.q1, qm1 = E.qNeg(E.q1);
  const T = q => E.qTex(q), isZ = E.qIsZero;
  const nv = (v, d) => fmtT(v, d === undefined ? 4 : d);
  const mkSt = () => { const st = []; const f = k => (s, sc) => { st.push({ k, s, sc }); }; return { st, h: f('h'), p: f('p'), e: f('e'), res: f('res'), note: f('note') }; };
  const pt = (x, y) => '(' + x + '\\,|\\,' + y + ')';
  const val = (R, x) => { const y = Inv.fOf(R)(x); return isFinite(y) ? nv(y, 3) : '\\text{–}'; };
  const sgn = q => (E.qSgn(q) < 0 ? '-' : '+') + T(E.qAbs(q));

  // ───────── Begriff: Spiegelung an y = x ─────────
  function mirror(R, xp) {
    const B = mkSt(), I = Inv.info(R), f = Inv.fOf(R), yp = f(xp), DW = Inv.invDW(R);
    B.p('**Zuordnung rückwärts lesen:** $f$ ordnet jedem $x$ einen Wert $y=f(x)$ zu. Die **Umkehrfunktion** $f^{-1}$ macht das rückgängig: Sie ordnet jedem Wert $y$ das ursprüngliche $x$ zu. In der Wertetabelle werden dazu einfach die beiden Zeilen vertauscht.');
    B.e('f(' + nv(xp, 3) + ')=' + val(R, xp) + '\\quad\\Rightarrow\\quad f^{-1}(' + val(R, xp) + ')=' + nv(xp, 3), 'b');
    B.p('**Graph:** Jeder Punkt $P(a\\,|\\,b)$ auf dem Graphen von $f$ wird zum Punkt $P\'(b\\,|\\,a)$ auf dem Graphen von $f^{-1}$. Koordinaten tauschen heisst **Spiegeln an der Winkelhalbierenden** $y=x$.');
    B.e('P' + pt(nv(xp, 3), val(R, xp)) + '\\ \\to\\ P\'' + pt(val(R, xp), nv(xp, 3)), 'v');
    B.p('**Bereiche tauschen:** Was bei $f$ herauskommt (Wertebereich), darf bei $f^{-1}$ hinein (Definitionsbereich), und umgekehrt.');
    B.e('D_{f^{-1}}=W_f=' + DW.D.tex + ',\\qquad W_{f^{-1}}=D_f=' + DW.W.tex, 'g');
    if (!I.inj) B.note('$f$ ist nur auf dem eingeschränkten Bereich $x\\ge' + T(Inv.Qn(I.r)) + '$ umkehrbar (sonst gehören zu einem $y$ zwei $x$); der andere Ast ist grau gezeichnet.');
    B.e(Inv.invTex(R), 'r');
    B.note('Schreibweise: $f^{-1}$ ist **nicht** $\\frac{1}{f}$; die $-1$ bedeutet Umkehrung, nicht Kehrwert.');
    B.res('$f^{-1}$ ordnet jedem Funktionswert sein $x$ zu; der Graph ist das Spiegelbild von $f$ an $y=x$');
    return { title: 'Umkehrfunktion: Begriff', st: B.st };
  }

  // ───────── Umkehrbarkeit und Einschränkung ─────────
  function mono(R) {
    if (R.type === 'lin') return R.m > 0 ? 'streng monoton wachsend' : 'streng monoton fallend';
    if (R.type === 'exp') return (R.F.a > 0) === (R.F.b > 1) ? 'streng monoton wachsend' : 'streng monoton fallend';
    if (R.type === 'log') return (R.a > 0) === (R.b > 1) ? 'streng monoton wachsend' : 'streng monoton fallend';
    const F = R.F; return (F.a > 0) === (F.m > 0) ? 'streng monoton wachsend' : 'streng monoton fallend';
  }
  function test(R, k, hits) {
    const B = mkSt(), I = Inv.info(R), n = hits ? hits.length : 0;
    B.p('**Kriterium:** Eine Funktion ist umkehrbar, wenn jeder Wert $y$ **höchstens einmal** angenommen wird. Im Bild: Jede **waagrechte Gerade** $y=k$ schneidet den Graphen höchstens einmal. Das ist sicher erfüllt, wenn $f$ streng monoton ist.');
    B.e('y=' + nv(k, 3) + '\\colon\\ ' + (n === 0 ? '\\text{kein Schnittpunkt}' : n === 1 ? '\\text{ein Schnittpunkt bei } x=' + nv(hits[0], 3) : n + '\\text{ Schnittpunkte bei } ' + hits.map(x => 'x=' + nv(x, 3)).join(',\\ ')), 'o');
    if (I.inj) {
      B.p('**Hier:** $f$ ist auf dem ganzen Definitionsbereich ' + mono(R) + '. Jede waagrechte Gerade trifft den Graphen höchstens einmal, also ist $f$ **umkehrbar**.');
      B.e('D_f=' + I.D.tex + ',\\qquad W_f=' + I.W.tex, 'g');
      B.e(Inv.invTex(R), 'r');
      B.res('$f$ ist auf $D_f=' + I.D.tex + '$ umkehrbar (' + mono(R) + ')');
    } else {
      B.p('**Hier:** $f$ ist **nicht umkehrbar**: Der Graph ist symmetrisch zur Geraden $x=' + T(Inv.Qn(I.r0)) + '$, zu jedem Wert $y$ (ausser am Scheitel) gehören **zwei** Stellen $x$. Die Umkehrung wäre keine Funktion.');
      B.p('**Abhilfe – Einschränkung:** Man lässt nur einen Ast zu, zum Beispiel $x\\ge' + T(Inv.Qn(I.r)) + '$. Dort ist $f$ ' + (I.up ? 'streng monoton wachsend' : 'streng monoton fallend') + ' und darum umkehrbar.');
      B.e('D\'=' + I.Dr.tex + ',\\qquad W\'=' + I.Wr.tex, 'g');
      B.e(Inv.invTex(R) + '\\qquad(x\\in' + I.Wr.tex + ')', 'r');
      B.note('Auch der linke Ast $x\\le' + T(Inv.Qn(I.r0)) + '$ wäre möglich; dann bekäme die Wurzel ein Minuszeichen. Man wählt meist den Ast, der zur Aufgabe passt.');
      B.res('$f$ ist erst nach Einschränkung auf $D\'=' + I.Dr.tex + '$ umkehrbar');
    }
    return { title: 'Umkehrbarkeit und Einschränkung', st: B.st };
  }

  // ───────── Umkehrfunktion berechnen ─────────
  function calc(R, x0) {
    const B = mkSt(), I = Inv.info(R), DW = Inv.invDW(R), f = Inv.fOf(R), g = Inv.invOf(R);
    B.p('**Schritt 1:** Funktionsgleichung mit $y$ schreiben.');
    B.e(Inv.fTex(R, 'y'), 'b');
    B.p('**Schritt 2:** Die Gleichung **nach x auflösen** (die Rechenschritte rückgängig machen, von aussen nach innen).');
    if (R.type === 'lin') {
      const steps = [];
      if (!isZ(R.qq)) steps.push('y' + sgn(E.qNeg(R.qq)) + '=' + Lin.lineTex(Lin.mk(R.m, 0), '').replace(/^=/, '') + '\\qquad|\\ ' + (E.qSgn(R.qq) > 0 ? '-' : '+') + T(E.qAbs(R.qq)));
      if (!E.qEq(R.mq, q1)) steps.push('x=' + Inv.invTex(R, '', 'y') + '\\qquad|\\ :' + T(R.mq));
      else steps.push('x=' + Inv.invTex(R, '', 'y'));
      steps.forEach(s => B.e(s));
    } else if (R.type === 'pow') {
      const F = R.F, inner = Pow.innerOf(F), pw = Pow.termTex(inner, F.m, F.n), inn = Inv.innerTex(F.hq, F.aq, 'y');
      const ops = []; if (!isZ(F.hq)) ops.push((E.qSgn(F.hq) > 0 ? '-' : '+') + T(E.qAbs(F.hq))); if (!E.qEq(F.aq, q1)) ops.push(':' + T(F.aq));
      B.e(pw + '=' + inn.s + (ops.length ? '\\qquad|\\ ' + ops.join(',\\ ') : ''));
      const am = Math.abs(F.m);
      if (F.n === 1 && F.m > 0) B.p(am === 1 ? 'Jetzt steht $x' + (isZ(F.vq) ? '' : sgn(E.qNeg(F.vq))) + '$ frei.' : (am === 2 ? 'Die Quadratwurzel' : 'Die ' + am + '-te Wurzel') + ' ziehen' + (am % 2 === 0 ? ' (wegen der Einschränkung $x\\ge' + T(F.vq) + '$ nur das positive Vorzeichen)' : '') + '.');
      else if (F.n === 1) B.p('Kehrwert bilden' + (am > 1 ? ', dann die ' + (am === 2 ? 'Quadratwurzel' : am + '-te Wurzel') + ' ziehen' : '') + '.');
      else B.p('Die Wurzel verschwindet durch Potenzieren mit $' + F.n + '$' + (am > 1 ? ', die Potenz durch die ' + am + '-te Wurzel' : '') + '.');
      B.e('x=' + Inv.invTex(R, '', 'y'));
    } else if (R.type === 'exp') {
      const F = R.F, inn = Inv.innerTex(F.dq, F.aq, 'y');
      const ops = []; if (!isZ(F.dq)) ops.push((E.qSgn(F.dq) > 0 ? '-' : '+') + T(E.qAbs(F.dq))); if (!E.qEq(F.aq, q1)) ops.push(':' + T(F.aq));
      B.e(Expo.bTexP(F) + '^{x}=' + inn.s + (ops.length ? '\\qquad|\\ ' + ops.join(',\\ ') : ''));
      B.p('Der Exponent wird mit dem **Logarithmus** zur Basis $' + Expo.bTex(F) + '$ geholt (Umkehrung des Potenzierens).');
      B.e('x=' + Inv.invTex(R, '', 'y'));
    } else {
      const inn = Inv.innerTex(R.dq, R.aq, 'y'), lg = (R.e ? '\\ln' : '\\log_{' + T(R.bq) + '}'), arg = isZ(R.vq) ? 'x' : '(x' + sgn(E.qNeg(R.vq)) + ')';
      const ops = []; if (!isZ(R.dq)) ops.push((E.qSgn(R.dq) > 0 ? '-' : '+') + T(E.qAbs(R.dq))); if (!E.qEq(R.aq, q1)) ops.push(':' + T(R.aq));
      B.e(lg + arg + '=' + inn.s + (ops.length ? '\\qquad|\\ ' + ops.join(',\\ ') : ''));
      B.p('Der Logarithmus wird durch **Potenzieren** mit der Basis $' + (R.e ? 'e' : T(R.bq)) + '$ aufgehoben.');
      B.e('x=' + Inv.invTex(R, '', 'y'));
    }
    B.p('**Schritt 3:** Die Variablen **vertauschen** ($x\\leftrightarrow y$), damit die Umkehrfunktion wie gewohnt mit $x$ geschrieben wird.');
    B.e(Inv.invTex(R), 'g');
    B.p('**Schritt 4:** Definitions- und Wertebereich tauschen' + (I.inj ? '.' : ' (mit der Einschränkung $x\\ge' + T(Inv.Qn(I.r)) + '$ von $f$).'));
    B.e('D_{f^{-1}}=' + DW.D.tex + ',\\qquad W_{f^{-1}}=' + DW.W.tex, 'v');
    const y0 = f(x0), back = g(y0);
    if (isFinite(y0) && isFinite(back)) { B.p('**Probe:** Erst $f$, dann $f^{-1}$ anwenden muss wieder $x$ ergeben.'); B.e('f(' + nv(x0, 3) + ')=' + nv(y0, 3) + ',\\qquad f^{-1}(' + nv(y0, 3) + ')=' + nv(back, 3), 'o'); }
    B.res('$' + Inv.invTex(R) + '$ mit $D_{f^{-1}}=' + DW.D.tex + '$');
    return { title: 'Umkehrfunktion berechnen', st: B.st };
  }

  // ───────── bekannte Paare ─────────
  function pairs(P, x0) {
    const B = mkSt(), y0 = P.f(x0), back = P.g(y0);
    B.e(P.fTex, 'b'); B.e(P.gTex, 'g');
    B.p('**Verkettung:** Wendet man erst $f$ und dann $f^{-1}$ an (oder umgekehrt), kommt die Ausgangszahl zurück. Das ist die Definition der Umkehrfunktion.');
    B.e('f^{-1}(f(x))=x\\qquad\\text{und}\\qquad f(f^{-1}(x))=x', 'v');
    if (isFinite(y0) && isFinite(back)) B.e('f(' + nv(x0, 3) + ')=' + nv(y0, 3) + ',\\qquad f^{-1}(' + nv(y0, 3) + ')=' + nv(back, 3), 'o');
    B.p('**Bereiche:** $D_f=' + P.Df + '$, $W_f=' + P.Wf + '$; bei der Umkehrfunktion vertauscht: $D_{f^{-1}}=' + P.Dg + '$, $W_{f^{-1}}=' + P.Wg + '$.');
    B.note(P.noteTex || P.note);
    B.res('$' + P.fTex.replace(/^f\(x\)=/, '') + '$ und $' + P.gTex.replace(/^f\^\{-1\}\(x\)=/, '') + '$ sind Umkehrfunktionen voneinander');
    return { title: 'Bekannte Paare', st: B.st };
  }

  // ───────── Ausgabe ─────────
  function doc(r) { return Dif.stDoc(r); }
  function sceneLines(r) { return Dif.stLines(r); }
  Inv.st = { mirror, test, calc, pairs };
  Inv.doc = doc; Inv.sceneLines = sceneLines;
  Inv.mirrorDoc = (R, x) => doc(mirror(R, x)); Inv.testDoc = (R, k, h) => doc(test(R, k, h)); Inv.calcDoc = (R, x) => doc(calc(R, x)); Inv.pairsDoc = (P, x) => doc(pairs(P, x));
})();
