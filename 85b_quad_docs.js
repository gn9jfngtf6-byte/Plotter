// ═════════════════════════════════════════════════════════════════
// MODUL 85b: Rechenwege der quadratischen Funktionen (zu 85_quad.js, ohne DOM)
//
// Jeder Rechenweg ist eine Liste von Schritten {k, s, sc}:
//   k  'h' Überschrift, 'p' Text (mit **fett** und $Formel$), 'e' Formelzeile, 'res' Ergebnis (blauer Kasten), 'note' Hinweis
//   sc  (nur bei 'e' und 'res') Zeile erscheint auch im Bild; Farbbuchstabe (b, v, g, r, o) färbt sie dort
// Quad.st.xxx(…) liefert {title, st}; Quad.doc(r) macht daraus SV.Doc (Karte und LaTeX-Export), Quad.sceneLines(r) die Zeilen im Bild.
//   Quad.st.vtx(Q)             quadratische Ergänzung → Scheitelform, Scheitelpunkt
//   Quad.st.roots(Q, method)   Nullstellen: 'mnf' Mitternachtsformel, 'qe' quadratische Ergänzung, 'vieta' Satz von Vieta; Diskriminante
//   Quad.st.forms(Q)           alle drei Formen: Standard-, Scheitel-, Nullstellenform
//   Quad.st.line(Q, L)         Schnitt mit einer Geraden (Sekante, Tangente, Passante)
//   Quad.st.tan(Q, x0)         Tangente im Punkt x0
//   Quad.st.pts(P1,P2,P3)      Parabel durch drei Punkte;  Quad.st.vp(S,P)  Scheitelpunkt und Punkt;  Quad.st.np(N1,N2,P)  Nullstellen und Punkt
// ═════════════════════════════════════════════════════════════════
(function () {
  const E = Dif.E, { DOC, fmtT } = Dif;
  const q1 = E.q1, q0 = E.q0;
  const T = q => E.qTex(q), TP = q => E.qTexP(q), FT = f => E.feTex(f);
  const sg = q => (E.qSgn(q) < 0 ? '-' : '+') + T(E.qAbs(q));                         // ±Zahl
  const sgx = (q, v) => (E.qSgn(q) < 0 ? '-' : '+') + (E.qEq(E.qAbs(q), q1) ? '' : T(E.qAbs(q))) + v;   // ±q·v (Faktor 1 weglassen)
  const nv = v => fmtT(v, 4), ap = v => '\\approx' + nv(v);
  const mul = E.qMul, add = E.qAdd, sub = E.qSub, div = E.qDiv, neg = E.qNeg, isZ = E.qIsZero;
  const aPre = Quad.aPre, pt = (x, y) => '(' + x + '\\,|\\,' + y + ')';
  const feStr = f => FT(f) + (E.feIsRat(f) && E.qIsInt(f.p) ? '' : ap(E.feNum(f)));
  const rhsOf = (aq, bq, cq) => Quad.polyTex(aq, bq, cq, '').slice(1);
  const eq0 = Q => rhsOf(Q.aq, Q.bq, Q.cq) + '=0';
  const sq2 = q => mul(q, q);

  // Hilfen zum Aufbau
  const mkSt = () => { const st = []; const f = k => (s, sc) => { st.push({ k, s, sc }); }; return { st, h: f('h'), p: f('p'), e: f('e'), res: f('res'), note: f('note') }; };

  // ───────── quadratische Ergänzung ─────────
  function vtx(Q, opt) {
    opt = opt || {};
    const B = mkSt(), a = Q.aq, b = Q.bq, c = Q.cq, v = Quad.vertex(Q);
    if (!v) { B.note('Für $a=0$ ist dies keine Parabel, sondern eine Gerade.'); return { title: 'Quadratische Ergänzung', st: B.st }; }
    const A = aPre(a), one = E.qEq(a, q1);
    B.e(Quad.stdTex(Q, 'f(x)'), 'b');
    if (isZ(b)) {
      B.p('Es fehlt der Term mit $x$: Die Parabel ist schon in **Scheitelform**, der Scheitel liegt auf der $y$-Achse.');
      B.e(Quad.vertexTex(Q, 'f(x)'), 'v');
    } else {
      const p = div(b, a), h = div(p, E.Q(2));
      if (!one) { B.p('**Schritt 1:** Den Faktor $a=' + T(a) + '$ aus den Termen mit $x$ ausklammern.'); B.e('f(x)=' + A + '\\left(x^2' + sgx(p, 'x') + '\\right)' + (isZ(c) ? '' : sg(c)), 'v'); }
      else B.p('**Schritt 1:** Hier ist $a=1$, es muss nichts ausgeklammert werden.');
      B.p('**Schritt 2:** Quadratische Ergänzung: Die Hälfte des $x$-Koeffizienten, also $' + T(h) + '$, quadrieren, addieren und sofort wieder subtrahieren.');
      B.e('f(x)=' + A + '\\left(x^2' + sgx(p, 'x') + '+' + TP(h) + '^2-' + TP(h) + '^2\\right)' + (isZ(c) ? '' : sg(c)), 'g');
      B.p('**Schritt 3:** Die ersten drei Terme in der Klammer sind eine binomische Formel.');
      const ah2 = mul(a, sq2(h));
      B.e('f(x)=' + A + '\\left(x' + sg(h) + '\\right)^2' + sg(neg(ah2)) + (isZ(c) ? '' : sg(c)));
      B.p('**Schritt 4:** Zusammenfassen ergibt die Scheitelform.');
      B.e(Quad.vertexTex(Q, 'f(x)'), 'v');
    }
    B.res('Scheitelpunkt $S(' + T(v.xq) + '\\,|\\,' + T(v.yq) + ')$, Symmetrieachse $x=' + T(v.xq) + '$');
    if (!opt.short) {
      B.p('**Kurzformel:** Der Scheitel liegt bei $x_s=-\\frac{b}{2a}$, der $y$-Wert folgt durch Einsetzen.');
      B.e('x_s=-\\frac{' + T(b) + '}{2\\cdot' + TP(a) + '}=' + T(v.xq) + ',\\qquad y_s=f(' + T(v.xq) + ')=' + T(v.yq));
      B.note(E.qSgn(a) > 0 ? 'Wegen $a>0$ ist die Parabel nach oben geöffnet: Der Scheitel ist der **tiefste** Punkt (Minimum $y_s=' + T(v.yq) + '$).' : 'Wegen $a<0$ ist die Parabel nach unten geöffnet: Der Scheitel ist der **höchste** Punkt (Maximum $y_s=' + T(v.yq) + '$).');
      const sa = E.qAbs(a);
      B.note('Aus der Normalparabel $y=x^2$ entsteht die Parabel durch Strecken mit $' + T(sa) + '$' + (E.qSgn(a) < 0 ? ' und Spiegeln an der $x$-Achse' : '') + ', dann Verschieben um $' + T(v.xq) + '$ in $x$-Richtung und um $' + T(v.yq) + '$ in $y$-Richtung.');
    }
    return { title: 'Quadratische Ergänzung und Scheitelpunkt', st: B.st };
  }

  // ───────── Nullstellen ─────────
  function rootsEnd(B, Q, R, opt) {
    if (R.kind === 'two' || R.kind === 'one') {
      const ft = Quad.factorTex(Q, 'f(x)');
      if (R.kind === 'two' && R.fe1 && !(opt && opt.noVieta)) {
        const s = E.feAdd(R.fe1, R.fe2), pr = E.feMul(R.fe1, R.fe2);
        if (s && pr) {
          // Brüche sauber: −(−2)/1 → 2, c/a mit a = 1 → c, negative Nenner in den Zähler
          // Bruch mit den Originalzahlen (Klammern bei negativen), dann der Wert; bei a = 1 direkt der Wert
          const par = q => (E.qSgn(q) < 0 ? '(' + T(q) + ')' : T(q));
          const frac = (num, den, neg) => { const q = neg ? E.qNeg(E.qDiv(num, den)) : E.qDiv(num, den); return E.qSgn(den) === 1 && E.qNum(den) === 1 ? T(q) : (neg ? '-' : '') + '\\frac{' + par(num) + '}{' + par(den) + '}=' + T(q); };
          B.p('**Probe mit Vieta:** Für $ax^2+bx+c=0$ gilt $x_1+x_2=-\\frac{b}{a}$ und $x_1\\cdot x_2=\\frac{c}{a}$.');
          B.e('x_1+x_2=' + FT(s) + ',\\quad -\\frac{b}{a}=' + frac(Q.bq, Q.aq, true) + '\\ \\checkmark\\qquad x_1\\cdot x_2=' + FT(pr) + ',\\quad \\frac{c}{a}=' + frac(Q.cq, Q.aq, false) + '\\ \\checkmark');
        }
      }
      if (ft) { B.p('**Nullstellenform:**'); B.e(ft, 'b'); }
      B.res(R.kind === 'two' ? 'Nullstellen $N_1(' + FT(R.fe1) + '\\,|\\,0)$ und $N_2(' + FT(R.fe2) + '\\,|\\,0)$' + (R.rat ? '' : ', also $x_1' + ap(R.x1) + '$ und $x_2' + ap(R.x2) + '$') : 'Eine (doppelte) Nullstelle $x_0=' + FT(R.fe1) + '$: Die Parabel berührt die $x$-Achse im Scheitel.');
    } else if (R.kind === 'none') B.res('Keine Nullstelle: Die Parabel liegt ganz ' + (E.qSgn(Q.aq) > 0 ? 'oberhalb' : 'unterhalb') + ' der $x$-Achse.');
  }
  function mnfSteps(B, Q, R) {
    const a = Q.aq, b = Q.bq, c = Q.cq;
    B.p('**Schritt 1:** Gleichung $f(x)=0$ aufstellen und $a$, $b$, $c$ ablesen.');
    B.e(eq0(Q), 'b'); B.e('a=' + T(a) + ',\\quad b=' + T(b) + ',\\quad c=' + T(c));
    B.p('**Schritt 2:** Die Diskriminante $D=b^2-4ac$ sagt, wie viele Lösungen es gibt.');
    B.e('D=' + TP(b) + '^2-4\\cdot' + TP(a) + '\\cdot' + TP(c) + '=' + T(R.Dq), 'o');
    if (R.kind === 'none') { B.p('$D<0$: Der Radikand ist negativ, es gibt **keine reelle Lösung**.'); return; }
    if (R.kind === 'one') { B.p('$D=0$: Es gibt **genau eine** Lösung (doppelte Nullstelle).'); B.e('x=\\frac{-b}{2a}=\\frac{' + T(neg(b)) + '}{' + T(mul(E.Q(2), a)) + '}=' + FT(R.fe1), 'g'); return; }
    B.p('$D>0$: Es gibt **zwei** Lösungen. **Schritt 3:** Mitternachtsformel einsetzen.');
    B.e('x_{1,2}=\\frac{-b\\pm\\sqrt{D}}{2a}=\\frac{-' + TP(b) + '\\pm\\sqrt{' + T(R.Dq) + '}}{2\\cdot' + TP(a) + '}');
    B.e('x_{1,2}=\\frac{' + T(neg(b)) + '\\pm' + FT(R.sq) + '}{' + T(mul(E.Q(2), a)) + '}', 'g');
    B.e('x_1=' + feStr(R.fe1) + ',\\qquad x_2=' + feStr(R.fe2), 'g');
  }
  function qeSteps(B, Q, R) {
    const v = Quad.vertex(Q), a = Q.aq;
    B.p('**Schritt 1:** Mit der quadratischen Ergänzung in die Scheitelform bringen.');
    B.e(Quad.stdTex(Q, 'f(x)') + '=' + Quad.vertexTex(Q, '').slice(1), 'b');
    B.p('**Schritt 2:** Gleich null setzen und nach dem Quadrat auflösen.');
    B.e(Quad.vertexTex(Q, '').slice(1) + '=0');
    const r = div(neg(v.yq), a);
    if (isZ(v.xq)) B.e('x^2=' + T(r));
    else B.e('\\left(x' + sg(neg(v.xq)) + '\\right)^2=\\frac{' + T(neg(v.yq)) + '}{' + T(a) + '}=' + T(r));
    if (E.qSgn(r) < 0) { B.p('Ein Quadrat kann nicht negativ sein: **keine reelle Lösung**.'); return; }
    if (isZ(r)) { B.p('Das Quadrat ist $0$: **eine** Lösung.'); B.e('x=' + T(v.xq), 'g'); return; }
    B.p('**Schritt 3:** Wurzel ziehen, beide Vorzeichen beachten.');
    const sr = E.feSqrtQ(r);
    B.e('x' + sg(neg(v.xq)) + '=\\pm' + FT(sr) + '\\ \\Rightarrow\\ x=' + T(v.xq) + '\\pm' + FT(sr), 'g');
    B.e('x_1=' + feStr(R.fe1) + ',\\qquad x_2=' + feStr(R.fe2), 'g');
  }
  function vietaSteps(B, Q, R) {
    const a = Q.aq, b = Q.bq, c = Q.cq, p = div(b, a), q = div(c, a);
    B.p('**Schritt 1:** Durch $a$ teilen, damit vor $x^2$ eine $1$ steht (Normalform $x^2+px+q=0$).');
    B.e('x^2' + (isZ(p) ? '' : sgx(p, 'x')) + (isZ(q) ? '' : sg(q)) + '=0,\\quad p=' + T(p) + ',\\ q=' + T(q), 'b');
    if (R.kind === 'two' && R.rat) {
      B.p('**Schritt 2:** Gesucht sind zwei Zahlen mit Summe $-p$ und Produkt $q$ (Satz von Vieta).');
      B.e('x_1+x_2=' + T(neg(p)) + ',\\qquad x_1\\cdot x_2=' + T(q), 'o');
      B.e('x_1=' + T(R.fe1.p) + ',\\quad x_2=' + T(R.fe2.p) + '\\ \\Rightarrow\\ ' + T(R.fe1.p) + '+' + TP(R.fe2.p) + '=' + T(neg(p)) + ',\\ ' + TP(R.fe1.p) + '\\cdot' + TP(R.fe2.p) + '=' + T(q), 'g');
      B.p('**Schritt 3:** Daraus folgt die Zerlegung in Linearfaktoren.');
      B.e((E.qEq(a, q1) ? '' : '') + 'x^2' + (isZ(p) ? '' : sgx(p, 'x')) + (isZ(q) ? '' : sg(q)) + '=' + Quad.facTex(R.fe1) + Quad.facTex(R.fe2) + '=0');
    } else if (R.kind === 'one') {
      B.p('**Schritt 2:** Zwei gleiche Zahlen mit Summe $-p$ und Produkt $q$ (binomische Formel).');
      B.e('x_1=x_2=' + FT(R.fe1), 'g');
    } else if (R.kind === 'none') {
      B.p('Es gibt keine reellen Zahlen mit Summe $-p$ und Produkt $q$: **keine Nullstelle**.');
    } else {
      B.p('Die Lösungen sind keine einfachen Zahlen: Das Raten mit Vieta führt hier nicht weiter. Mit der Mitternachtsformel:');
      mnfSteps(B, Q, R);
    }
  }
  function roots(Q, method) {
    const B = mkSt(), R = Quad.roots(Q);
    if (R.kind === 'deg') { B.note('Für $a=0$ ist dies eine Gerade (siehe «Lineare Funktionen»).'); return { title: 'Nullstellen', st: B.st }; }
    method = method || 'mnf';
    if (method === 'qe') qeSteps(B, Q, R); else if (method === 'vieta') vietaSteps(B, Q, R); else mnfSteps(B, Q, R);
    rootsEnd(B, Q, R, { noVieta: method === 'vieta' });
    return { title: 'Nullstellen und Diskriminante', st: B.st };
  }

  // ───────── drei Formen ─────────
  function forms(Q) {
    const v = vtx(Q, { short: false }), r = roots(Q, 'mnf'), B = mkSt();
    B.h('Von der Standardform zur Scheitelform');
    const st = B.st.concat(v.st);
    st.push({ k: 'h', s: 'Zur Nullstellenform' });
    r.st.forEach(s => st.push(s));
    const f = Quad.factorTex(Q, 'f(x)');
    st.push({ k: 'h', s: 'Die drei Formen im Überblick' });
    st.push({ k: 'e', s: Quad.stdTex(Q, 'f(x)') + '\\qquad(\\text{Standardform})' });
    st.push({ k: 'e', s: Quad.vertexTex(Q, 'f(x)') + '\\qquad(\\text{Scheitelform})' });
    if (f) st.push({ k: 'e', s: f + '\\qquad(\\text{Nullstellenform})' });
    return { title: 'Die drei Formen', st };
  }

  // ───────── Parabel und Gerade ─────────
  function line(Q, L) {
    const B = mkSt(), W = Quad.withLine(Q, L);
    if (Q.deg) { B.note('Für $a=0$ ist dies keine Parabel.'); return { title: 'Parabel und Gerade', st: B.st }; }
    if (L.vert) {
      B.p('**Senkrechte Gerade:** Für $x=' + T(L.xq) + '$ den $y$-Wert der Parabel berechnen.');
      B.e('f(' + T(L.xq) + ')=' + FT(W.pts[0].fy), 'g');
      B.res('Genau ein Schnittpunkt $(' + T(L.xq) + '\\,|\\,' + FT(W.pts[0].fy) + ')$');
      return { title: 'Parabel und senkrechte Gerade', st: B.st };
    }
    B.p('**Schritt 1:** Gleichsetzen: Die Schnittpunkte erfüllen beide Gleichungen.');
    B.e(Quad.stdTex(Q, '').slice(1) + '=' + Lin.lineTex(L, '').slice(1), 'b');
    B.p('**Schritt 2:** Alles auf eine Seite bringen.');
    const E2 = W.E2;
    B.e(eq0(E2), 'v');
    B.p('**Schritt 3:** Die Diskriminante entscheidet über die Anzahl der Schnittpunkte.');
    B.e('D=' + TP(E2.bq) + '^2-4\\cdot' + TP(E2.aq) + '\\cdot' + TP(E2.cq) + '=' + T(W.Dq), 'o');
    if (W.kind === 'passant') {
      B.p('$D<0$: kein Schnittpunkt. Die Gerade ist eine **Passante**.');
      B.res('Gerade und Parabel schneiden sich nicht.');
    } else if (W.kind === 'tangent') {
      B.p('$D=0$: genau ein Schnittpunkt. Die Gerade **berührt** die Parabel: Sie ist eine **Tangente**.');
      const P = W.pts[0]; B.e('x=-\\frac{b}{2a}=' + FT(P.fx) + ',\\qquad y=' + FT(P.fy), 'g');
      B.res('Berührpunkt $B(' + FT(P.fx) + '\\,|\\,' + FT(P.fy) + ')$');
    } else {
      B.p('$D>0$: zwei Schnittpunkte. Die Gerade ist eine **Sekante**. Die Lösungen $x_1,x_2$ in die Geradengleichung einsetzen.');
      const R = W.R; B.e('x_{1,2}=\\frac{-b\\pm\\sqrt{D}}{2a}\\ \\Rightarrow\\ x_1=' + feStr(R.fe1) + ',\\ x_2=' + feStr(R.fe2), 'g');
      B.e('y_1=' + FT(W.pts[0].fy) + ',\\qquad y_2=' + FT(W.pts[1].fy), 'g');
      B.res('Schnittpunkte $S_1(' + FT(W.pts[0].fx) + '\\,|\\,' + FT(W.pts[0].fy) + ')$ und $S_2(' + FT(W.pts[1].fx) + '\\,|\\,' + FT(W.pts[1].fy) + ')$');
    }
    if (W.kind !== 'tangent') {
      const qt = Quad.tangentIntercept(Q, L.m);
      B.note('Berührbedingung: Bei der Steigung $m=' + T(L.mq) + '$ berührt die Gerade die Parabel genau dann, wenn $D=0$ ist, also für $q=' + T(qt) + '$: $y=' + Lin.lineTex(Lin.mkQ(L.mq, qt), '').slice(1) + '$.');
    }
    return { title: 'Parabel und Gerade', st: B.st };
  }
  function tan(Q, x0) {
    const B = mkSt(), X = Quad.Qn(x0);
    if (Q.deg) { B.note('Für $a=0$ ist dies keine Parabel.'); return { title: 'Tangente', st: B.st }; }
    const m = add(mul(mul(E.Q(2), Q.aq), X), Q.bq), y0 = add(add(mul(Q.aq, sq2(X)), mul(Q.bq, X)), Q.cq), L = Quad.tangentAt(Q, x0);
    B.p('**Schritt 1:** Die Steigung der Tangente ist die Ableitung an der Stelle $x_0=' + T(X) + '$.');
    B.e('f\'(x)=2ax+b=' + (E.qEq(mul(E.Q(2), Q.aq), q1) ? '' : T(mul(E.Q(2), Q.aq))) + 'x' + (isZ(Q.bq) ? '' : sg(Q.bq)), 'b');
    B.e('m=f\'(' + T(X) + ')=' + T(m), 'b');
    B.p('**Schritt 2:** Berührpunkt: $y$-Wert der Parabel bei $x_0$.');
    B.e('f(' + T(X) + ')=' + T(y0), 'g');
    B.p('**Schritt 3:** Punkt-Steigungs-Form.');
    B.e('y=m(x-x_0)+y_0=' + TP(m) + '\\left(x' + sg(neg(X)) + '\\right)' + sg(y0));
    B.res('Tangente $' + Lin.lineTex(L) + '$ im Punkt $T(' + T(X) + '\\,|\\,' + T(y0) + ')$');
    return { title: 'Tangente an die Parabel', st: B.st };
  }

  // ───────── Parabel aus Punkten ─────────
  const eqTerm = (c, v, first) => (E.qSgn(c) < 0 ? '-' : (first ? '' : '+')) + (E.qEq(E.qAbs(c), q1) ? '' : T(E.qAbs(c))) + v;
  function eq3(x, y) {                                               // a·x² + b·x + c = y, für ein festes x
    let s = '';
    [[sq2(x), 'a'], [x, 'b']].forEach(([cf, v]) => { if (!isZ(cf)) s += eqTerm(cf, v, s === ''); });
    return s + (s === '' ? 'c' : '+c') + '=' + T(y);
  }
  function pts(P1, P2, P3) {
    const B = mkSt(), Q = Quad.fromPoints(P1, P2, P3);
    if (!Q) { B.note('Zwei Punkte haben dasselbe $x$: Dann gibt es keine Funktion durch alle drei Punkte.'); return { title: 'Parabel durch drei Punkte', st: B.st }; }
    const X = [P1, P2, P3].map(p => Quad.Qn(p[0])), Y = [P1, P2, P3].map(p => Quad.Qn(p[1]));
    B.p('**Schritt 1:** Ansatz $f(x)=ax^2+bx+c$. Jeder Punkt liefert eine Gleichung.');
    ['I', 'II', 'III'].forEach((n, i) => B.e('\\text{(' + n + ')}\\ \\ ' + eq3(X[i], Y[i]) + '\\qquad P_' + (i + 1) + '(' + T(X[i]) + '\\,|\\,' + T(Y[i]) + ')', 'b'));
    B.p('**Schritt 2:** (II)$-$(I) und (III)$-$(II), jeweils durch die Differenz der $x$-Werte geteilt: So verschwindet $c$.');
    B.e('a\\cdot(' + T(add(X[0], X[1])) + ')+b=\\frac{' + T(sub(Y[1], Y[0])) + '}{' + T(sub(X[1], X[0])) + '}=' + T(Q.m12), 'o');
    B.e('a\\cdot(' + T(add(X[1], X[2])) + ')+b=\\frac{' + T(sub(Y[2], Y[1])) + '}{' + T(sub(X[2], X[1])) + '}=' + T(Q.m23), 'o');
    B.p('**Schritt 3:** Die beiden neuen Gleichungen voneinander abziehen: $b$ verschwindet.');
    B.e('a\\cdot(' + T(sub(X[2], X[0])) + ')=' + T(sub(Q.m23, Q.m12)) + '\\ \\Rightarrow\\ a=' + T(Q.aq), 'g');
    if (Q.deg) { B.note('Hier ist $a=0$: Die drei Punkte liegen auf einer Geraden, es gibt keine Parabel.'); return { title: 'Parabel durch drei Punkte', st: B.st }; }
    B.p('**Schritt 4:** $a$ einsetzen, um $b$ und dann $c$ zu bestimmen.');
    B.e('b=' + T(Q.m12) + '-' + TP(Q.aq) + '\\cdot' + TP(add(X[0], X[1])) + '=' + T(Q.bq) + ',\\qquad c=' + T(Y[0]) + '-' + TP(Q.aq) + '\\cdot' + TP(sq2(X[0])) + '-' + TP(Q.bq) + '\\cdot' + TP(X[0]) + '=' + T(Q.cq), 'g');
    B.res('$' + Quad.stdTex(Q, 'f(x)') + '$');
    B.e(Quad.vertexTex(Q, 'f(x)') + '\\qquad(\\text{Scheitelform})', 'v');
    return { title: 'Parabel durch drei Punkte', st: B.st };
  }
  function vp(S, P) {
    const B = mkSt(), Q = Quad.fromVertexPoint(S, P);
    const xs = Quad.Qn(S[0]), ys = Quad.Qn(S[1]), px = Quad.Qn(P[0]), py = Quad.Qn(P[1]);
    B.p('**Schritt 1:** Ansatz in Scheitelform mit dem Scheitel $S(' + T(xs) + '\\,|\\,' + T(ys) + ')$.');
    B.e('f(x)=a\\left(x' + sg(neg(xs)) + '\\right)^2' + sg(ys), 'b');
    if (!Q) { B.note('Der Punkt $P$ hat dasselbe $x$ wie der Scheitel: $a$ lässt sich so nicht bestimmen.'); return { title: 'Scheitelpunkt und Punkt', st: B.st }; }
    B.p('**Schritt 2:** Den Punkt $P(' + T(px) + '\\,|\\,' + T(py) + ')$ einsetzen und nach $a$ auflösen.');
    B.e(T(py) + '=a\\cdot' + TP(sub(px, xs)) + '^2' + sg(ys), 'o');
    B.e('a=\\frac{' + T(sub(py, ys)) + '}{' + T(sq2(sub(px, xs))) + '}=' + T(Q.aq), 'g');
    B.p('**Schritt 3:** Scheitelform aufschreiben und ausmultiplizieren.');
    B.e(Quad.vertexTex(Q, 'f(x)'), 'v');
    B.res('$' + Quad.stdTex(Q, 'f(x)') + '$');
    return { title: 'Parabel aus Scheitelpunkt und Punkt', st: B.st };
  }
  function np(N1, N2, P) {
    const B = mkSt(), Q = Quad.fromRootsPoint(N1, N2, P);
    const x1 = Quad.Qn(N1[0]), x2 = Quad.Qn(N2[0]), px = Quad.Qn(P[0]), py = Quad.Qn(P[1]);
    const fac = r => (isZ(r) ? 'x' : '(x' + sg(neg(r)) + ')');
    B.p('**Schritt 1:** Ansatz in Nullstellenform mit $x_1=' + T(x1) + '$ und $x_2=' + T(x2) + '$.');
    B.e('f(x)=a\\cdot' + fac(x1) + fac(x2), 'b');
    if (!Q) { B.note('Der Punkt $P$ liegt auf einer Nullstelle: $a$ lässt sich so nicht bestimmen.'); return { title: 'Nullstellen und Punkt', st: B.st }; }
    B.p('**Schritt 2:** Den Punkt $P(' + T(px) + '\\,|\\,' + T(py) + ')$ einsetzen und nach $a$ auflösen.');
    B.e(T(py) + '=a\\cdot' + TP(sub(px, x1)) + '\\cdot' + TP(sub(px, x2)), 'o');
    B.e('a=\\frac{' + T(py) + '}{' + T(mul(sub(px, x1), sub(px, x2))) + '}=' + T(Q.aq), 'g');
    B.p('**Schritt 3:** Nullstellenform aufschreiben und ausmultiplizieren.');
    B.e('f(x)=' + (E.qEq(Q.aq, q1) ? '' : E.qEq(Q.aq, E.qNeg(q1)) ? '-' : TP(Q.aq) + '\\cdot') + fac(x1) + fac(x2), 'v');
    B.res('$' + Quad.stdTex(Q, 'f(x)') + '$');
    return { title: 'Parabel aus Nullstellen und Punkt', st: B.st };
  }

  // ───────── Ausgabe ─────────
  function doc(r) {
    const d = DOC(); d.h(r.title);
    r.st.forEach(s => { if (s.k === 'h') d.h(s.s); else if (s.k === 'p') d.p(s.s); else if (s.k === 'e') d.e(s.s); else if (s.k === 'res') d.res(s.s); else if (s.k === 'note') d.note(s.s); });
    return d;
  }
  function sceneLines(r) {
    const out = [];
    r.st.forEach(s => {
      if (!s.sc || (s.k !== 'e' && s.k !== 'res')) return;
      const body = s.k === 'res' ? s.s.replace(/\$/g, '') : s.s;
      out.push({ s: typeof s.sc === 'string' && s.sc !== 'true' ? '\\col{' + s.sc + '}{' + body + '}' : body, bold: s.k === 'res' });
    });
    return out;
  }
  Quad.st = { vtx, roots, forms, line, tan, pts, vp, np };
  Quad.doc = doc; Quad.sceneLines = sceneLines;
  Quad.vtxDoc = (Q, o) => doc(vtx(Q, o)); Quad.rootsDoc = (Q, m) => doc(roots(Q, m)); Quad.formsDoc = Q => doc(forms(Q)); Quad.lineDoc = (Q, L) => doc(line(Q, L)); Quad.tanDoc = (Q, x) => doc(tan(Q, x));
  // Quadratische Optimierung: Nachfrage x(p) = A − B·p, Kosten K = Kf + kv·x → Umsatz U(p) = p·x(p), Gewinn G(p) = U − K
  Quad.optModel = (A, B, Kf, kv) => {
    const U = p => p * (A - B * p), K = p => Kf + kv * (A - B * p), G = p => U(p) - K(p);
    const ga = -B, gb = A + kv * B, gc = -(Kf + kv * A), D = gb * gb - 4 * ga * gc;
    const z = D >= 0 ? [(-gb + Math.sqrt(D)) / (2 * ga), (-gb - Math.sqrt(D)) / (2 * ga)].sort((u, v) => u - v) : [];
    return { A, B, Kf, kv, U, K, G, x: p => A - B * p, pMax: A / B, pU: A / (2 * B), pG: gb / (2 * B), ga, gb, gc, D, zeros: z };
  };
  Quad.optDoc = (A, B, Kf, kv) => {
    const M = Quad.optModel(A, B, Kf, kv), d = DOC(), n = v => nv(v), sgN = v => (v < 0 ? '-' : '+') + n(Math.abs(v));
    d.h('Preis, Umsatz und Gewinn');
    d.p('**Nachfrage:** Je höher der Preis $p$, desto weniger wird verkauft:');
    d.e('x(p)=' + n(A) + '-' + n(B) + 'p');
    d.p('**Umsatz** = Preis · verkaufte Menge:');
    d.e('U(p)=p\\cdot x(p)=p\\,(' + n(A) + '-' + n(B) + 'p)=-' + n(B) + 'p^2+' + n(A) + 'p');
    d.p('**Kosten** = Fixkosten + variable Kosten pro Stück · Menge:');
    d.e('K(p)=' + n(Kf) + '+' + n(kv) + '\\cdot(' + n(A) + '-' + n(B) + 'p)=' + n(Kf + kv * A) + sgN(-kv * B) + 'p');
    d.p('**Gewinn** = Umsatz − Kosten:');
    d.e('G(p)=U(p)-K(p)=' + n(M.ga) + 'p^2' + sgN(M.gb) + 'p' + sgN(M.gc));
    d.p('**Umsatzmaximum:** Der Scheitel der Umsatzparabel liegt in der Mitte zwischen ihren Nullstellen $p=0$ und $p=' + n(M.pMax) + '$:');
    d.e('p_U=\\frac{' + n(A) + '}{2\\cdot ' + n(B) + '}=' + n(M.pU)); d.e('x(p_U)=' + n(M.x(M.pU)) + ',\\qquad U_{max}=' + n(M.U(M.pU)));
    d.p('**Gewinnmaximum:** Scheitel der Gewinnparabel, $p=-\\frac{b}{2a}$:');
    d.e('p_G=-\\frac{' + n(M.gb) + '}{2\\cdot(' + n(M.ga) + ')}=' + n(M.pG)); d.e('x(p_G)=' + n(M.x(M.pG)) + ',\\qquad G_{max}=' + n(M.G(M.pG)));
    d.p('**Gewinnschwelle und Gewinngrenze:** $G(p)=0$ mit der Lösungsformel:');
    if (M.zeros.length) {
      d.e('p_{1,2}=\\frac{-' + (M.gb < 0 ? '(' + n(M.gb) + ')' : n(M.gb)) + '\\pm\\sqrt{' + n(M.D) + '}}{2\\cdot(' + n(M.ga) + ')}'); d.e('p_1\\approx ' + n(M.zeros[0]) + ',\\qquad p_2\\approx ' + n(M.zeros[1]));
      d.p('Zwischen diesen Preisen macht man Gewinn, ausserhalb Verlust.');
    } else d.note('Die Diskriminante ist negativ: Bei keinem Preis wird Gewinn erzielt.');
    d.res('Gewinnmaximaler Preis $p_G=' + n(M.pG) + '$ mit $G_{max}=' + n(M.G(M.pG)) + '$; umsatzmaximaler Preis $p_U=' + n(M.pU) + '$.');
    if (M.pG > M.pU + 1e-9) d.note('Der gewinnmaximale Preis ist höher als der umsatzmaximale: Wer weniger verkauft, hat auch weniger variable Kosten.');
    return d;
  };
  Quad.ptsDoc = (a, b, c) => doc(pts(a, b, c)); Quad.vpDoc = (S, P) => doc(vp(S, P)); Quad.npDoc = (a, b, P) => doc(np(a, b, P));
})();
