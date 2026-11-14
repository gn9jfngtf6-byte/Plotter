// ═════════════════════════════════════════════════════════════════
// MODUL 90b: Rechenwege der Potenz- und Wurzelfunktionen (zu 90_pow.js, ohne DOM)
//
// Schritte {k, s, sc} wie bei 85b_quad_docs.js: k 'h' Überschrift, 'p' Text (**fett**, $Formel$), 'e' Formelzeile,
// 'res' Ergebnis, 'note' Hinweis; sc = Farbbuchstabe, wenn die Zeile auch im Bild erscheint.
//   Pow.st.fam(n, xp)         Potenzfunktion x^n: Symmetrie, gemeinsame Punkte, Monotonie, Verhalten, Wert an der Stelle xp
//   Pow.st.neg(n, xp)         x^(−n) = 1/x^n: Definitionslücke, Asymptoten, Symmetrie, Verhalten
//   Pow.st.root(n, m, xp)     ⁿ√x als Umkehrfunktion von x^n, Definitionsbereich, Potenzschreibweise, x^(m/n)
//   Pow.st.gen(F)             allgemeine Form a(x−v)^p + h: Strecken, Spiegeln, Verschieben; D, W, Symmetrie, Asymptoten
//   Pow.st.eq(F, y0)          Gleichung f(x) = y0 mit Fallunterscheidung und Probe
// Pow.doc(r) → SV.Doc, Pow.sceneLines(r) → Zeilen im Bild
// ═════════════════════════════════════════════════════════════════
(function () {
  const E = Dif.E, { DOC, fmtT } = Dif;
  const q0 = E.q0, q1 = E.q1;
  const T = q => E.qTex(q), TP = q => E.qTexP(q), TPP = q => (q.n < 0n || q.d !== 1n ? '\\left(' + T(q) + '\\right)' : T(q));   // Brüche und negative Zahlen in Klammern
  const ordW = n => (n === 2 ? 'Quadratwurzel' : n === 3 ? 'dritte Wurzel' : n + '-te Wurzel'), ordP = n => (n === 2 ? 'das Quadrat' : n === 3 ? 'die dritte Potenz' : 'die ' + n + '-te Potenz'), ordPK = n => (n === 1 ? 'der Kehrwert' : n === 2 ? 'der Kehrwert des Quadrats' : n === 3 ? 'der Kehrwert der dritten Potenz' : 'der Kehrwert der ' + n + '-ten Potenz');
  const sg = q => (E.qSgn(q) < 0 ? '-' : '+') + T(E.qAbs(q));
  const nv = v => fmtT(v, 4), ap = v => '\\approx' + nv(v);
  const mul = E.qMul, add = E.qAdd, sub = E.qSub, div = E.qDiv, neg = E.qNeg, isZ = E.qIsZero;
  const pt = (x, y) => '(' + x + '\\,|\\,' + y + ')';
  const mkSt = () => { const st = []; const f = k => (s, sc) => { st.push({ k, s, sc }); }; return { st, h: f('h'), p: f('p'), e: f('e'), res: f('res'), note: f('note') }; };
  const rootTex = (n, inner) => (n === 2 ? '\\sqrt{' + inner + '}' : '\\sqrt[' + n + ']{' + inner + '}');
  const xpow = (n, x) => (n === 1 ? x : x + '^' + (n < 10 ? n : '{' + n + '}'));
  const evalTex = (F, x) => { const r = Pow.evalExact(F, x); return r.exact ? T(r.yq) : ap(r.y); };     // f(x) exakt oder ≈
  const numTex = q => T(q);

  // ───────── Potenzfunktionen x^n ─────────
  function fam(n, xp) {
    const B = mkSt(), even = n % 2 === 0, F = Pow.base(n, 1), X = Pow.Qn(xp);
    B.e('f(x)=' + xpow(n, 'x'), 'b');
    B.p('**Symmetrie:** Setze $-x$ ein. Das Vorzeichen eines Produkts aus $' + n + '$ Faktoren $(-x)$ hängt davon ab, ob $' + n + '$ gerade oder ungerade ist.');
    if (n === 1) { B.e('f(-x)=-x=-f(x)'); B.p('$n=1$ ist ungerade: Der Graph ist die erste Winkelhalbierende, **punktsymmetrisch** zum Ursprung.'); }
    else if (even) { B.e('f(-x)=(-x)^' + n + '=(-1)^' + n + '\\cdot x^' + n + '=x^' + n + '=f(x)', 'v'); B.p('$n$ gerade: $f(-x)=f(x)$, der Graph ist **achsensymmetrisch zur y-Achse**.'); }
    else { B.e('f(-x)=(-x)^' + n + '=(-1)^' + n + '\\cdot x^' + n + '=-x^' + n + '=-f(x)', 'v'); B.p('$n$ ungerade: $f(-x)=-f(x)$, der Graph ist **punktsymmetrisch zum Ursprung**.'); }
    B.p('**Gemeinsame Punkte:** Alle Potenzfunktionen gehen durch $(0\\,|\\,0)$ und $(1\\,|\\,1)$' + (even ? ' und, weil $n$ gerade ist, durch $(-1\\,|\\,1)$.' : ' und, weil $n$ ungerade ist, durch $(-1\\,|\\,-1)$.'));
    B.e('f(0)=0,\\quad f(1)=1,\\quad f(-1)=' + (even ? '1' : '-1'), 'g');
    B.p('**Monotonie und Verlauf:** ' + (even ? 'Für $x<0$ fällt der Graph, für $x>0$ steigt er; im Ursprung liegt der tiefste Punkt (Minimum).' : 'Der Graph steigt auf ganz $\\mathbb{R}$ (streng monoton wachsend).'));
    B.e(even ? 'x\\to\\pm\\infty\\colon\\ f(x)\\to+\\infty' : 'x\\to+\\infty\\colon\\ f(x)\\to+\\infty,\\qquad x\\to-\\infty\\colon\\ f(x)\\to-\\infty');
    if (n > 1) B.p('**Vergleich mit kleineren Exponenten:** Für $0<|x|<1$ wird $|x|^n$ mit wachsendem $n$ kleiner, für $|x|>1$ grösser. Darum liegen die Graphen zwischen $-1$ und $1$ unter der Normalparabel und ausserhalb darüber. Je grösser $n$, desto flacher nahe $0$ und desto steiler aussen.');
    B.p('**Wert an der Stelle** $x=' + T(X) + '$:');
    B.e('f(' + T(X) + ')=' + TPP(X) + '^' + n + '=' + evalTex(F, xp), 'o');
    B.res('$f(x)=' + xpow(n, 'x') + '$ ist ' + (even ? 'achsensymmetrisch, $D=\\mathbb{R}$, $W=[0;\\,\\infty[$' : 'punktsymmetrisch, $D=\\mathbb{R}$, $W=\\mathbb{R}$'));
    return { title: 'Potenzfunktion mit natürlichem Exponenten', st: B.st };
  }

  // ───────── negative Exponenten ─────────
  function negp(n, xp) {
    const B = mkSt(), even = n % 2 === 0, F = Pow.base(-n, 1), X = Pow.Qn(xp);
    B.e('f(x)=x^{-' + n + '}=\\frac{1}{' + xpow(n, 'x') + '}', 'b');
    B.p('**Definitionsbereich:** Der Nenner darf nicht $0$ werden, also ist $x=0$ ausgeschlossen (Definitionslücke, Polstelle).');
    B.e('D=\\mathbb{R}\\setminus\\{0\\}', 'g');
    B.p('**Symmetrie:** ' + (even ? '$f(-x)=\\frac{1}{(-x)^' + n + '}=\\frac{1}{x^' + n + '}=f(x)$: achsensymmetrisch zur $y$-Achse.' : '$f(-x)=\\frac{1}{(-x)^' + n + '}=-\\frac{1}{x^' + n + '}=-f(x)$: punktsymmetrisch zum Ursprung.'));
    B.p('**Verhalten nahe der Definitionslücke:** Nähert sich $x$ der $0$, wird der Nenner winzig und der Bruch riesig.');
    B.e(even ? 'x\\to0^+\\colon\\ f(x)\\to+\\infty,\\qquad x\\to0^-\\colon\\ f(x)\\to+\\infty' : 'x\\to0^+\\colon\\ f(x)\\to+\\infty,\\qquad x\\to0^-\\colon\\ f(x)\\to-\\infty', 'r');
    B.p('**Verhalten für grosse Beträge:** Für grosse $|x|$ wird der Nenner riesig, der Bruch geht gegen $0$, ohne $0$ zu erreichen.');
    B.e('x\\to\\pm\\infty\\colon\\ f(x)\\to0', 'r');
    B.res('Senkrechte Asymptote $x=0$ ($y$-Achse) und waagrechte Asymptote $y=0$ ($x$-Achse)');
    B.p('**Gemeinsame Punkte:** $f(1)=1$ und $f(-1)=' + (even ? '1' : '-1') + '$. Für $0<|x|<1$ ist $|f(x)|>1$, für $|x|>1$ ist $|f(x)|<1$.');
    B.p('**Wert an der Stelle** $x=' + T(X) + '$:');
    if (isZ(X)) B.e('f(0)\\ \\text{ist nicht definiert}', 'o');
    else B.e('f(' + T(X) + ')=\\frac{1}{' + TPP(X) + '^' + n + '}=' + evalTex(F, xp), 'o');
    return { title: 'Potenzfunktion mit negativem Exponenten', st: B.st };
  }

  // ───────── Wurzelfunktionen ─────────
  function root(n, m, xp) {
    const B = mkSt(), even = n % 2 === 0, R = Pow.base(1, n), X = Pow.Qn(Math.max(even ? 0 : -1e9, xp));
    B.p('**Umkehrung:** Die Wurzelfunktion macht das Potenzieren rückgängig. Aus $y=x^' + n + '$ wird nach $x$ aufgelöst' + (even ? ' (nur für $x\\ge0$, damit die Zuordnung eindeutig ist)' : '') + ', dann werden $x$ und $y$ vertauscht.');
    B.e('y=x^' + n + '\\ \\Rightarrow\\ x=' + rootTex(n, 'y') + '\\ \\Rightarrow\\ \\text{Umkehrfunktion: } y=' + rootTex(n, 'x'), 'b');
    B.p('Der Graph der Umkehrfunktion ist das **Spiegelbild** des Graphen von $y=x^' + n + '$ an der Winkelhalbierenden $y=x$: Jeder Punkt $(x\\,|\\,y)$ wird zu $(y\\,|\\,x)$.');
    B.p('**Definitions- und Wertebereich:** ' + (even ? 'Eine gerade Wurzel aus einer negativen Zahl gibt es in $\\mathbb{R}$ nicht; die Wurzel ist nie negativ.' : 'Eine ungerade Wurzel gibt es auch aus negativen Zahlen, z.B. $' + rootTex(n, '-' + Math.pow(2, n)) + '=-2$.'));
    B.e(even ? 'D=[0;\\,\\infty[,\\qquad W=[0;\\,\\infty[' : 'D=\\mathbb{R},\\qquad W=\\mathbb{R}', 'g');
    B.p('**Potenzschreibweise:** Die Wurzel ist eine Potenz mit dem Exponenten $\\frac{1}{' + n + '}$, denn $\\left(x^{1/' + n + '}\\right)^' + n + '=x^{' + n + '/' + n + '}=x$.');
    B.e(rootTex(n, 'x') + '=x^{\\frac{1}{' + n + '}}', 'v');
    const xv = Pow.evalExact(Pow.base(n, 1), xp), back = Pow.evalExact(R, xv.y);
    B.p('**Beispiel** mit $x=' + T(X) + '$: erst potenzieren, dann die Wurzel ziehen.');
    B.e(TPP(X) + '^' + n + '=' + (xv.exact ? T(xv.yq) : ap(xv.y)) + ',\\qquad ' + rootTex(n, xv.exact ? T(xv.yq) : nv(xv.y)) + '=' + T(X), 'o');
    if (m && m !== 1) {
      const G = Pow.base(m, n), ex = Pow.evalExact(G, xp);
      B.p('**Rationaler Exponent** $\\frac{' + m + '}{' + n + '}$: Zähler = potenzieren, Nenner = Wurzel ziehen, in beliebiger Reihenfolge.');
      B.e('x^{\\frac{' + m + '}{' + n + '}}=' + rootTex(n, 'x^' + m) + '=\\left(' + rootTex(n, 'x') + '\\right)^' + m, 'v');
      B.e(TP(X) + '^{\\frac{' + m + '}{' + n + '}}=\\left(' + rootTex(n, T(X)) + '\\right)^' + m + '=' + (ex.exact ? T(ex.yq) : ap(ex.y)), 'o');
      B.note('Für $x\\ge1$ gilt: Je grösser der Exponent, desto grösser die Potenz: $' + (m > n ? 'x^{' + m + '/' + n + '}>x' : 'x^{' + m + '/' + n + '}<x') + '$. Zwischen $0$ und $1$ ist es umgekehrt.');
    }
    B.res('$y=' + rootTex(n, 'x') + '=x^{1/' + n + '}$ ist die Umkehrfunktion von $y=x^' + n + '$' + (even ? ' (für $x\\ge0$)' : ''));
    return { title: 'Wurzelfunktion als Umkehrfunktion', st: B.st };
  }

  // ───────── allgemeine Form ─────────
  function gen(F) {
    const B = mkSt(), a = F.aq, v = F.vq, h = F.hq, base = Pow.baseTex(F.m, F.n);
    if (F.deg) { B.note('Für $a=0$ ist $f$ konstant: $f(x)=' + T(h) + '$.'); return { title: 'Allgemeine Form', st: B.st }; }
    B.e(Pow.fTex(F, 'f(x)'), 'b');
    B.p('**Grundfunktion:** $g(x)=' + base + '$. Daraus entsteht $f$ in drei Schritten.');
    const sa = E.qAbs(a), one = E.qEq(sa, q1);
    B.p('**Schritt 1:** ' + (one ? 'Kein Strecken ($|a|=1$)' : (E.qCmp(sa, q1) > 0 ? 'Strecken in $y$-Richtung mit dem Faktor $' + T(sa) + '$' : 'Stauchen in $y$-Richtung mit dem Faktor $' + T(sa) + '$')) + (E.qSgn(a) < 0 ? ', dazu **Spiegeln an der x-Achse** ($a<0$).' : '.'));
    B.e('y=' + Pow.fTex(Pow.mk(F.a, 0, 0, F.m, F.n), ''), 'r');
    B.p('**Schritt 2:** ' + (isZ(v) ? 'Keine Verschiebung in $x$-Richtung ($v=0$).' : 'Verschieben um $' + T(E.qAbs(v)) + '$ nach ' + (E.qSgn(v) > 0 ? 'rechts' : 'links') + ': $x$ wird durch $(x' + sg(neg(v)) + ')$ ersetzt.'));
    B.e('y=' + Pow.fTex(Pow.mk(F.a, F.v, 0, F.m, F.n), ''), 'b');
    B.p('**Schritt 3:** ' + (isZ(h) ? 'Keine Verschiebung in $y$-Richtung ($h=0$).' : 'Verschieben um $' + T(E.qAbs(h)) + '$ nach ' + (E.qSgn(h) > 0 ? 'oben' : 'unten') + '.'));
    B.e(Pow.fTex(F, 'y'), 'g');
    const D = Pow.domain(F), W = Pow.range(F), S = Pow.symmetry(F), A = Pow.asymptotes(F);
    B.p('**Definitions- und Wertebereich:** ' + (D.kind === 'all' ? 'Alle $x$ sind erlaubt.' : D.kind === 'ne' ? 'Der Nenner wird bei $x=' + T(v) + '$ null: Definitionslücke.' : D.kind === 'ge' ? 'Unter der geraden Wurzel darf nichts Negatives stehen: $x-' + T(v) + '\\ge0$.' : 'Unter der Wurzel im Nenner muss etwas Positives stehen: $x>' + T(v) + '$.'));
    B.e('D=' + D.tex + ',\\qquad W=' + W.tex, 'v');
    if (A) { B.p('**Asymptoten:** Die Definitionslücke verschiebt sich nach $x=' + T(v) + '$, die waagrechte Asymptote nach $y=' + T(h) + '$.'); B.e('x=' + T(v) + ',\\qquad y=' + T(h), 'r'); }
    if (S.kind === 'even') B.res('Achsensymmetrisch zur Geraden $x=' + T(v) + '$; ' + (F.m > 0 ? (E.qSgn(a) > 0 ? 'tiefster' : 'höchster') + ' Punkt $S' + pt(T(v), T(h)) + '$' : 'Asymptoten $x=' + T(v) + '$ und $y=' + T(h) + '$'));
    else if (S.kind === 'odd') B.res('Punktsymmetrisch zum Punkt $Z' + pt(T(v), T(h)) + '$');
    else B.res('Startpunkt $P' + pt(T(v), T(h)) + '$' + (F.m < 0 ? ' ist ausgeschlossen (Asymptoten $x=' + T(v) + '$, $y=' + T(h) + '$)' : ', der Graph verläuft nach rechts ' + (Pow.risingRight(F) ? 'aufwärts' : 'abwärts')));
    return { title: 'Allgemeine Form: Strecken, Spiegeln, Verschieben', st: B.st };
  }

  // ───────── Gleichung f(x) = y0 ─────────
  function eq(F, y0) {
    const B = mkSt(), R = Pow.solve(F, y0), Y = R.Y, m = F.m, n = F.n, am = Math.abs(m);
    if (R.kind === 'deg') { B.note('Für $a=0$ ist $f$ konstant.'); return { title: 'Gleichung', st: B.st }; }
    const inner = Pow.innerOf(F), par = inner === 'x' ? 'x' : '(' + inner + ')', lhs = inner, pw = Pow.termTex(inner, m, n), pwE = Pow.termTex(inner, m, n, 'exp');
    B.p('**Schritt 1:** Gleichung aufstellen: Für welche $x$ ist $f(x)=' + T(Y) + '$?');
    B.e(Pow.fTex(F, '') + '=' + T(Y), 'b');
    const steps = [];
    if (!isZ(F.hq)) steps.push('\\quad|\\ ' + (E.qSgn(F.hq) > 0 ? '-' : '+') + T(E.qAbs(F.hq)));
    if (!E.qEq(F.aq, q1)) steps.push('\\quad|\\ :' + TP(F.aq));
    B.p('**Schritt 2:** Die Potenz isolieren' + (steps.length ? ': ' + (isZ(F.hq) ? '' : '$' + T(E.qAbs(F.hq)) + '$ ' + (E.qSgn(F.hq) > 0 ? 'subtrahieren' : 'addieren')) + (!isZ(F.hq) && !E.qEq(F.aq, q1) ? ', dann ' : '') + (E.qEq(F.aq, q1) ? '' : 'durch $' + T(F.aq) + '$ teilen') + '.' : ' (hier ist nichts zu tun).'));
    B.e(pw + '=' + T(R.cq) + (n > 1 || m < 0 ? '\\qquad\\text{bzw.}\\qquad ' + pwE + '=' + T(R.cq) : ''), 'v');
    const c = R.cq, cs = E.qSgn(c);
    const what = n === 1 ? (m > 0 ? ordP(am) : ordPK(am)) : (m === 1 ? 'die ' + ordW(n) : 'eine Potenz mit dem Exponenten $' + Pow.pTex(m, n) + '$');
    B.p('**Schritt 3: Fallunterscheidung.** Links steht ' + what + ' von $' + par + '$, rechts $' + T(c) + (cs > 0 ? '>0' : cs < 0 ? '<0' : '=0') + '$.');
    if (R.kind === 'none') {
      const why = R.why === 'root-neg' ? (m > 0 ? 'Eine gerade Wurzel ist nie negativ' : 'Ein Bruch mit einer geraden Wurzel im Nenner ist immer positiv') : R.why === 'even-neg' ? 'Eine gerade Potenz ist nie negativ' : 'Ein Bruch mit Zähler $' + (E.qEq(E.qAbs(F.aq), q1) ? '1' : T(E.qAbs(F.aq))) + '$ wird nie $0$';
      B.p(why + ': **keine Lösung**.');
      B.res('Die Gleichung hat keine Lösung: $L=\\{\\}$');
      return { title: 'Gleichung lösen', st: B.st };
    }
    // Wurzel ziehen bzw. potenzieren
    const tTex = R.tAbsQ ? T(R.tAbsQ) : (n === 1 ? (m > 0 ? rootTex(am, T(E.qAbs(c))) : rootTex(am, T(E.qInv(E.qAbs(c))))) : (am === 1 ? TP(E.qAbs(c)) + '^' + n : rootTex(am, TP(E.qAbs(c)) + '^' + n)));
    if (n === 1 && m > 0) {
      if (R.twoSided && cs > 0) { B.p('Gerade Potenz, rechts positiv: **zwei Lösungen**, die ' + ordW(am) + ' mit beiden Vorzeichen.'); B.e(lhs + '=\\pm' + rootTex(am, T(c)) + (R.tAbsQ ? '=\\pm' + T(R.tAbsQ) : '\\approx\\pm' + nv(R.tAbsNum)), 'g'); }
      else if (cs === 0) { B.p('Die Potenz ist $0$, also ist die Basis $0$: **eine Lösung**.'); B.e(lhs + '=0', 'g'); }
      else { B.p('Ungerade Potenz: Die ' + ordW(am) + ' gibt es für jedes Vorzeichen, **genau eine Lösung**.'); B.e(lhs + '=' + rootTex(am, T(c)) + (R.sols[0].exact ? '=' + T(R.sols[0].tq) : ap(R.sols[0].t)), 'g'); }
    } else if (n === 1 && m < 0) {
      B.p('Kehrwert bilden, dann die ' + ordW(am) + ' ziehen' + (R.twoSided ? ' (gerade Potenz: beide Vorzeichen)' : '') + '.');
      B.e(xpow(am, par) + '=' + T(E.qInv(c)) + '\\ \\Rightarrow\\ ' + par + '=' + (R.twoSided ? '\\pm' : '') + rootTex(am, T(E.qInv(c))) + (R.tAbsQ ? '=' : '\\approx') + (R.twoSided ? '\\pm' : (cs < 0 ? '-' : '')) + (R.tAbsQ ? T(R.tAbsQ) : nv(R.tAbsNum)), 'g');
    } else {
      B.p((m === 1 ? 'Beide Seiten mit $' + n + '$ potenzieren: Das hebt die Wurzel auf.' : 'Beide Seiten mit dem Kehrwert des Exponenten potenzieren: $\\left(' + par + '^{' + Pow.pTex(m, n) + '}\\right)^{' + Pow.pTex(n, am) + '}=' + par + '$.') + (R.twoSided ? ' Gerader Zähler: beide Vorzeichen.' : ''));
      B.e(lhs + '=' + (R.twoSided ? '\\pm' : '') + TPP(c) + '^{' + Pow.pTex(n, m) + '}' + (R.tAbsQ ? '=' : '\\approx') + (R.twoSided ? '\\pm' : (cs < 0 ? '-' : '')) + (R.tAbsQ ? T(R.tAbsQ) : nv(R.tAbsNum)), 'g');
    }
    if (!isZ(F.vq)) B.p('**Schritt 4:** $' + T(E.qAbs(F.vq)) + '$ ' + (E.qSgn(F.vq) > 0 ? 'addieren' : 'subtrahieren') + ', um $x$ zu erhalten.');
    const rootForm = n === 1 ? (m > 0 ? rootTex(am, T(E.qAbs(c))) : rootTex(am, T(E.qInv(E.qAbs(c))))) : (am === 1 ? TPP(E.qAbs(c)) + '^' + n : rootTex(am, TPP(E.qAbs(c)) + '^' + n));
    const solTex = s => (s.exact ? T(s.xq) : (isZ(F.vq) ? (s.sg < 0 ? '-' : '') : T(F.vq) + (s.sg < 0 ? '-' : '+')) + rootForm + ap(s.x));
    const xs = R.sols.map(solTex);
    B.e(R.sols.map((s, i) => 'x' + (R.sols.length > 1 ? '_' + (i + 1) : '') + '=' + solTex(s)).join(',\\qquad '), 'g');
    // Probe
    const f = Pow.fOf(F), pr = R.sols.map(s => 'f(' + (s.exact ? T(s.xq) : nv(s.x)) + ')' + (Math.abs(f(s.x) - num(Y)) < 1e-6 ? '=' : '\\approx') + T(Y)).join(',\\quad ');
    B.p('**Probe:** Einsetzen in $f$.'); B.e(pr, 'o');
    B.res(R.kind === 'two' ? 'Zwei Lösungen: $L=\\{' + xs.join(';\\ ') + '\\}$' : 'Eine Lösung: $L=\\{' + xs[0] + '\\}$');
    return { title: 'Gleichung lösen', st: B.st };
  }
  const num = E.qNum;

  // ───────── Ausgabe ─────────
  function doc(r) { return Dif.stDoc(r); }
  function sceneLines(r) { return Dif.stLines(r); }
  Pow.st = { fam, neg: negp, root, gen, eq };
  Pow.doc = doc; Pow.sceneLines = sceneLines;
  Pow.famDoc = (n, x) => doc(fam(n, x)); Pow.negDoc = (n, x) => doc(negp(n, x)); Pow.rootDoc = (n, m, x) => doc(root(n, m, x)); Pow.genDoc = F => doc(gen(F)); Pow.eqDoc = (F, y) => doc(eq(F, y));
})();
