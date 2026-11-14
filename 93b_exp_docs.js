// ═════════════════════════════════════════════════════════════════
// MODUL 93b: Rechenwege der Exponential- und Logarithmusfunktionen (zu 93_exp.js, ohne DOM)
//
// Schritte {k, s, sc} wie bei 90b_pow_docs.js: k 'h' Überschrift, 'p' Text (**fett**, $Formel$), 'e' Formelzeile,
// 'res' Ergebnis, 'note' Hinweis; sc = Farbbuchstabe, wenn die Zeile auch im Bild erscheint.
//   Expo.st.grow(F, xp)        Wachstum und Zerfall: Startwert, Faktor, Prozent, Verdoppelungs-/Halbwertszeit, Wert an xp
//   Expo.st.e(x0)              Die Zahl e: Grenzwert (1+1/n)^n, Tangente an e^x, Ableitung von b^x
//   Expo.st.log(F, xp)         Logarithmus als Umkehrung von b^x: Spiegelung, D/W, Gesetze, Basiswechsel
//   Expo.st.eq(F, c, app)      Gleichung a·b^x + d = c mit Logarithmus (mit Anwendung: Deutung in Einheiten)
// Expo.doc(r) → SV.Doc, Expo.sceneLines(r) → Zeilen im Bild
// ═════════════════════════════════════════════════════════════════
(function () {
  const E = Dif.E, { DOC, fmtT } = Dif;
  const q0 = E.q0, q1 = E.q1;
  const T = q => E.qTex(q), TP = q => E.qTexP(q);
  const nv = (v, d) => fmtT(v, d === undefined ? 4 : d), ap = (v, d) => '\\approx' + nv(v, d);
  const mul = E.qMul, sub = E.qSub, div = E.qDiv, isZ = E.qIsZero;
  const mkSt = () => { const st = []; const f = k => (s, sc) => { st.push({ k, s, sc }); }; return { st, h: f('h'), p: f('p'), e: f('e'), res: f('res'), note: f('note') }; };
  const pct = F => { const g = Expo.growth(F); return g.pctq ? T(E.qAbs(g.pctq)) : nv(Math.abs(g.pct), 3); };
  const valTex = (F, x) => { const r = Expo.evalExact(F, x); return r.exact ? T(r.yq) : ap(r.y); };
  const xTex = x => T(Expo.Qn(x));
  const bT = F => Expo.bTex(F), bP = F => Expo.bTexP(F);

  // ───────── Wachstum und Zerfall ─────────
  function grow(F, xp) {
    const B = mkSt();
    if (F.deg) { B.note('Für $a=0$ ist $f$ konstant: $f(x)=' + T(F.dq) + '$.'); return { title: 'Exponentialfunktion', st: B.st }; }
    const g = Expo.growth(F), up = g.kind === 'grow', X = Expo.Qn(xp), hasD = !isZ(F.dq);
    B.e(Expo.fTex(F, 'f(x)'), 'b');
    B.p('**Startwert:** Bei $x=0$ ist $' + bP(F) + '^0=1$, also $f(0)=' + T(E.qAdd(F.aq, F.dq)) + '$' + (hasD ? ' (der Anfangswert $a=' + T(F.aq) + '$ liegt um $d=' + T(F.dq) + '$ verschoben)' : ': Der Faktor $a=' + T(F.aq) + '$ ist der Anfangswert') + '.');
    B.p('**Basis als Faktor:** Geht $x$ um $1$ weiter, wird ' + (hasD ? 'der Abstand zur Asymptote' : 'der Funktionswert') + ' mit $b=' + bT(F) + '$ multipliziert, immer mit demselben Faktor.');
    B.e('f(1)=' + valTex(F, 1) + ',\\quad f(2)=' + valTex(F, 2) + ',\\quad f(3)=' + valTex(F, 3), 'g');
    B.p('**Prozentsatz:** Aus $b=1+\\frac{p}{100}$ folgt $p=(b-1)\\cdot100$. ' + (up ? 'Weil $b>1$ ist, **wächst** $f$ um $' + pct(F) + '\\,\\%$ pro Schritt.' : 'Weil $b<1$ ist, **nimmt** $f$ um $' + pct(F) + '\\,\\%$ pro Schritt **ab** (Zerfall).'));
    B.e('p=(' + bT(F) + '-1)\\cdot100\\,\\%=' + (up ? '' : '-') + pct(F) + '\\,\\%', 'v');
    B.p('**Vergleich:** Lineares Wachstum **addiert** pro Schritt immer dieselbe Zahl, exponentielles Wachstum **multipliziert** immer mit demselben Faktor. Darum überholt jede wachsende Exponentialfunktion irgendwann jede Gerade.');
    const D = Expo.doubling(F);
    B.p('**' + (up ? 'Verdoppelungszeit' : 'Halbwertszeit') + ':** Nach welcher Zeit $T$ ist ' + (hasD ? 'der Abstand zur Asymptote' : 'der Wert') + ' ' + (up ? 'doppelt so gross' : 'halb so gross') + '? Aus $b^T=' + (up ? '2' : '\\frac{1}{2}') + '$ folgt mit dem Logarithmus:');
    B.e('T=\\frac{\\ln ' + (up ? '2' : '\\frac{1}{2}') + '}{\\ln ' + bT(F) + '}' + ap(D.T, 3), 'o');
    B.p('**Wert an der Stelle** $x=' + T(X) + '$:');
    B.e('f(' + T(X) + ')=' + Expo.aPre(F.aq) + bP(F) + '^{' + T(X) + '}' + (isZ(F.dq) ? '' : (E.qSgn(F.dq) < 0 ? '-' : '+') + T(E.qAbs(F.dq))) + '=' + valTex(F, xp), 'b');
    B.p('**Asymptote:** Für ' + (up ? '$x\\to-\\infty$' : '$x\\to+\\infty$') + ' wird $' + bP(F) + '^x$ winzig, der Graph schmiegt sich an die Gerade $y=' + T(F.dq) + '$. Der Wert $' + T(F.dq) + '$ wird nie erreicht.');
    B.e((up ? 'x\\to-\\infty' : 'x\\to+\\infty') + '\\colon\\ f(x)\\to' + T(F.dq), 'r');
    B.res('$f$ beschreibt exponentielle' + (up ? 's Wachstum' : 'n Zerfall') + ' mit dem Faktor $' + bT(F) + '$; $D=\\mathbb{R}$, $W=' + (F.a > 0 ? ']' + T(F.dq) + ';\\,\\infty[' : ']-\\infty;\\,' + T(F.dq) + '[') + '$');
    return { title: 'Exponentielles Wachstum und Zerfall', st: B.st };
  }

  // ───────── Die Zahl e ─────────
  function eDoc(x0) {
    const B = mkSt(), X = Expo.Qn(x0), m = Math.exp(x0);
    B.p('**Woher kommt e?** Ein Kapital wächst um $100\\,\\%$ pro Jahr. Wird der Zins in $n$ Teilschritten gutgeschrieben, wächst es mit dem Faktor $\\left(1+\\frac{1}{n}\\right)^n$. Je feiner die Schritte, desto näher kommt der Faktor einer festen Zahl:');
    B.e('n=1\\colon\\ 2,\\qquad n=10\\colon\\ ' + nv(Expo.eN(10), 4) + ',\\qquad n=100\\colon\\ ' + nv(Expo.eN(100), 4), 'g');
    B.e('n=1000\\colon\\ ' + nv(Expo.eN(1000), 5) + ',\\qquad n=10^6\\colon\\ ' + nv(Expo.eN(1e6), 5), 'g');
    B.e('e=\\lim_{n\\to\\infty}\\left(1+\\frac{1}{n}\\right)^n\\approx' + nv(Math.E, 5), 'b');
    B.p('**Die Besonderheit von** $f(x)=e^x$: Die Steigung der Tangente ist an jeder Stelle gleich dem Funktionswert. Die Funktion ist ihre eigene Ableitung.');
    B.e('f\'(x)=e^x=f(x)', 'v');
    B.p('**Tangente an der Stelle** $x_0=' + T(X) + '$: Steigung $m=e^{' + T(X) + '}$, Berührpunkt $T(' + T(X) + '\\,|\\,e^{' + T(X) + '})$.');
    B.e('m=e^{' + T(X) + '}' + ap(m, 3) + ',\\qquad t(x)=' + nv(m, 3) + '\\cdot(x' + (x0 < 0 ? '+' + T(E.qAbs(X)) : isZ(X) ? '' : '-' + T(X)) + ')+' + nv(m, 3), 'r');
    B.p('**Andere Basen:** Bei $2^x$ ist die Steigung im Punkt $(0\\,|\\,1)$ nur $\\ln2\\approx0{,}693$, bei $3^x$ schon $\\ln3\\approx1{,}099$. Genau bei der Basis $e$ ist sie $1$. Allgemein gilt:');
    B.e('\\left(b^x\\right)\'=\\ln(b)\\cdot b^x', 'g');
    B.note('Jede Exponentialfunktion lässt sich mit der Basis $e$ schreiben: $b^x=e^{x\\cdot\\ln b}$. Darum rechnet man in der Analysis fast nur mit $e^x$ und $\\ln$.');
    B.res('$e\\approx' + nv(Math.E, 5) + '$ ist die Basis, bei der Funktionswert und Steigung überall übereinstimmen');
    return { title: 'Die Zahl e und die Funktion e^x', st: B.st };
  }

  // ───────── Logarithmus als Umkehrung ─────────
  function logd(F, xp) {
    const B = mkSt(), X = Expo.Qn(xp), b = bT(F), bp = bP(F), lg = a => Expo.logTex(F, a);
    const y = Expo.evalExact(Expo.mk(1, F.b, 0, F.e), xp), yT = y.exact ? T(y.yq) : nv(y.y, 3);
    B.p('**Die Frage umdrehen:** Bei $f(x)=' + bp + '^x$ fragt man: Welcher Wert gehört zu $x$? Die Umkehrung fragt: **Mit welchem Exponenten** muss ich $' + b + '$ potenzieren, um $y$ zu erhalten? Dieser Exponent heisst **Logarithmus** von $y$ zur Basis $' + b + '$.');
    B.e('y=' + bp + '^x\\ \\Leftrightarrow\\ x=' + lg('y'), 'b');
    B.p('**Spiegelung:** Der Graph von $g(x)=' + lg('x') + '$ ist das Spiegelbild des Graphen von $f$ an der Winkelhalbierenden $y=x$: Aus $P(x\\,|\\,y)$ wird $P\'(y\\,|\\,x)$.');
    B.e('P(' + T(X) + '\\,|\\,' + yT + ')\\ \\to\\ P\'(' + yT + '\\,|\\,' + T(X) + '),\\qquad ' + lg(yT) + '=' + T(X), 'g');
    B.p('**Definitions- und Wertebereich tauschen:** $f$ nimmt nur positive Werte an ($W_f=\\,]0;\\,\\infty[$), also ist $g$ nur für positive Zahlen definiert. Die $y$-Achse ist senkrechte Asymptote von $g$.');
    B.e('D_g=\\,]0;\\,\\infty[,\\qquad W_g=\\mathbb{R}', 'v');
    B.p('**Besondere Werte:** $' + b + '^0=1$ und $' + b + '^1=' + b + '$, also:');
    B.e(lg('1') + '=0,\\qquad ' + lg(b) + '=1', 'g');
    B.p('**Logarithmengesetze** (aus den Potenzgesetzen): Ein Produkt wird zur Summe, ein Quotient zur Differenz, eine Potenz zum Vielfachen.');
    B.e(lg('u\\cdot v') + '=' + lg('u') + '+' + lg('v'));
    B.e(lg('\\tfrac{u}{v}') + '=' + lg('u') + '-' + lg('v'));
    B.e(lg('u^k') + '=k\\cdot' + lg('u'));
    if (!F.e) {
      B.p('**Basiswechsel:** Der Taschenrechner kennt $\\ln$ (Basis $e$) und $\\lg$ (Basis $10$). Jeden Logarithmus erhält man als Quotient:');
      B.e(lg('y') + '=\\frac{\\ln y}{\\ln ' + b + '}', 'o');
      B.p('**Beispiel:** $' + lg(yT) + '=\\dfrac{\\ln ' + yT + '}{\\ln ' + b + '}' + (y.exact ? '=' + T(X) : ap(Expo.logb(F.b, y.y), 3)) + '$.');
    } else B.p('**Natürlicher Logarithmus:** $\\ln$ ist der Logarithmus zur Basis $e$; er ist die Umkehrung von $e^x$: $\\ln(e^x)=x$ und $e^{\\ln y}=y$ für $y>0$.');
    B.res('$g(x)=' + lg('x') + '$ ist die Umkehrfunktion von $f(x)=' + bp + '^x$: $' + lg(bp + '^x') + '=x$ und $' + bp + '^{' + lg('x') + '}=x$');
    return { title: 'Logarithmus als Umkehrung', st: B.st };
  }

  // ───────── Gleichung a·b^x + d = c ─────────
  function eq(F, c, app) {
    const B = mkSt(), R = Expo.solve(F, c), C = R.C, xv = app ? app.xv : 'x', b = bT(F), bp = bP(F);
    if (R.kind === 'deg') { B.note('Für $a=0$ ist $f$ konstant.'); return { title: 'Exponentialgleichung', st: B.st }; }
    const fT = Expo.fTex(F, '', xv);
    B.p('**Schritt 1:** Gleichung aufstellen.' + (app ? '' : ' Für welches $x$ ist $f(x)=' + T(C) + '$?'));   // bei Anwendungen steht die Frage im Kasten «Situation»
    B.e(fT + '=' + T(C), 'b');
    const steps = [];
    if (!isZ(F.dq)) steps.push('$' + T(E.qAbs(F.dq)) + '$ ' + (E.qSgn(F.dq) > 0 ? 'subtrahieren' : 'addieren'));
    if (!E.qEq(F.aq, q1)) steps.push('durch $' + T(F.aq) + '$ teilen');
    B.p('**Schritt 2:** Die Potenz isolieren' + (steps.length ? ': ' + steps.join(', dann ') + '.' : ' (hier ist nichts zu tun).'));
    B.e(bp + '^{' + xv + '}=' + T(R.rq), 'v');
    if (R.kind === 'none') {
      B.p('Eine Potenz mit positiver Basis ist **immer positiv**, kann also nie ' + (R.why === 'zero' ? '$0$' : 'negativ') + ' werden: **keine Lösung**.');
      B.res('Die Gleichung hat keine Lösung: $L=\\{\\}$' + (app ? ' – der Wert $' + T(C) + '$ wird nie erreicht.' : ''));
      return { title: 'Exponentialgleichung lösen', st: B.st };
    }
    const lg = a => Expo.logTex(F, a);
    if (R.exact) {
      B.p('**Schritt 3:** Die rechte Seite als Potenz von $' + b + '$ schreiben, dann die Exponenten vergleichen.');
      B.e(bp + '^{' + xv + '}=' + bp + '^{' + T(R.kq) + '}\\ \\Rightarrow\\ ' + xv + '=' + T(R.kq), 'g');
      B.p('Dasselbe liefert der Logarithmus: $' + xv + '=' + lg(T(R.rq)) + '=' + T(R.kq) + '$.');
    } else {
      B.p('**Schritt 3: Logarithmieren.** Der gesuchte Exponent ist der Logarithmus von $' + T(R.rq) + '$ zur Basis $' + b + '$. Mit dem Taschenrechner über $\\ln$ (Basiswechsel):');
      B.e(xv + '=' + lg(T(R.rq)) + (F.e ? '' : '=\\frac{\\ln ' + TP(R.rq) + '}{\\ln ' + b + '}') + ap(R.x, 4), 'g');
      B.note('Allgemein: Aus $b^x=r$ folgt $x=\\log_b r=\\dfrac{\\ln r}{\\ln b}$ (für $r>0$).');
    }
    const f = Expo.fOf(F), pr = f(R.x);
    B.p('**Probe:** Einsetzen in die Gleichung.');
    B.e(Expo.aPre(F.aq) + bp + '^{' + (R.exact ? T(R.kq) : nv(R.x, 4)) + '}' + (isZ(F.dq) ? '' : (E.qSgn(F.dq) < 0 ? '-' : '+') + T(E.qAbs(F.dq))) + (Math.abs(pr - E.qNum(C)) < 1e-6 ? '=' : '\\approx') + T(C), 'o');
    if (app) B.res(app.ans(R.x) + ' ($' + xv + (R.exact ? '=' + T(R.kq) : ap(R.x, 3)) + '$)');
    else B.res('Eine Lösung: $L=\\{' + (R.exact ? T(R.kq) : lg(T(R.rq)) + ap(R.x, 4)) + '\\}$');
    return { title: 'Exponentialgleichung lösen', st: B.st };
  }

  // ───────── Ausgabe ─────────
  function doc(r) { return Dif.stDoc(r); }
  function sceneLines(r) { return Dif.stLines(r); }
  // Prozentrechnung: Grundwert G, Veränderungen pc[] in Prozent, vorwärts (fw) oder rückwärts aus dem Endwert E (bw)
  Expo.pctVals = (G, E, pc, bw) => {
    const q = pc.map(p => 1 + p / 100), Q = q.reduce((a, b) => a * b, 1), g0 = bw ? E / Q : G, v = [g0];
    q.forEach(f => v.push(v[v.length - 1] * f));
    return { q, Q, v };
  };
  Expo.pctDoc = (G, E, pc, bw) => {
    const d = Dif.DOC(), r = Expo.pctVals(G, E, pc, bw), n = v => Dif.fmtT(Math.round(v * 1e4) / 1e4, 6), pp = p => (p >= 0 ? '+' : '-') + n(Math.abs(p)) + '\\,\\%';
    d.h('Prozente als Faktoren');
    d.p('Eine **Zunahme** um $p\\,\\%$ heisst «mal $1+\\frac{p}{100}$», eine **Abnahme** um $p\\,\\%$ heisst «mal $1-\\frac{p}{100}$»:');
    pc.forEach((p, i) => d.e(pp(p) + '\\quad\\Rightarrow\\quad q_{' + (i + 1) + '}=' + n(r.q[i])));
    d.p('**Gesamtfaktor:** Die Faktoren werden multipliziert (nicht die Prozente addiert):');
    d.e('q=' + r.q.map(n).join('\\cdot ') + '=' + n(r.Q));
    const tot = (r.Q - 1) * 100;
    d.e('\\text{Gesamtveränderung: }(' + n(r.Q) + '-1)\\cdot 100\\,\\%=' + pp(tot));
    if (!bw) {
      d.p('**Vorwärts:** Grundwert mal Faktor ergibt den neuen Wert:');
      d.e(n(G) + '\\cdot ' + n(r.Q) + '=' + n(r.v[r.v.length - 1]));
      d.res('Neuer Wert: $' + n(r.v[r.v.length - 1]) + '$ (' + (tot >= 0 ? 'Zunahme' : 'Abnahme') + ' um $' + n(Math.abs(tot)) + '\\,\\%$)');
    } else {
      d.p('**Rückwärts:** Den Grundwert findet man, indem man den Endwert durch den Gesamtfaktor teilt:');
      d.e('G=\\frac{' + n(E) + '}{' + n(r.Q) + '}=' + n(r.v[0]));
      d.res('Grundwert: $G=' + n(r.v[0]) + '$');
      d.note('Achtung: Man darf nicht einfach $' + pp(-tot) + '$ rechnen – die Prozente beziehen sich auf einen anderen Grundwert.');
    }
    if (pc.length >= 2 && Math.abs(tot) > 1e-9 && Math.abs(pc.reduce((a, b) => a + b, 0)) < 1e-9) d.note('Die Prozente heben sich nicht auf: ' + pc.map(p => '$' + pp(p) + '$').join(' und ') + ' ergeben zusammen $' + pp(tot) + '$.');
    if (pc.length >= 2 && pc.every(p => p === pc[0])) d.note('Gleiche Veränderung ' + pc.length + '-mal: Faktor $' + n(r.q[0]) + '^{' + pc.length + '}$ – das ist exponentielles Wachstum bzw. exponentielle Abnahme.');
    return d;
  };
  Expo.st = { grow, e: eDoc, log: logd, eq };
  Expo.doc = doc; Expo.sceneLines = sceneLines;
  Expo.growDoc = (F, x) => doc(grow(F, x)); Expo.eDoc = x => doc(eDoc(x)); Expo.logDoc = (F, x) => doc(logd(F, x)); Expo.eqDoc = (F, c, app) => doc(eq(F, c, app));
})();
