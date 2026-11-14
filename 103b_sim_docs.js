// ═════════════════════════════════════════════════════════════════
// MODUL 103b: Rechenwege zur Ähnlichkeit (zu 103_sim.js, ohne DOM)
//
// Schritte {k, s} wie bei 99b_inv_docs.js: k 'h' Überschrift, 'p' Text (**fett**, $Formel$), 'e' Formelzeile,
// 'res' Ergebnis, 'note' Hinweis. Aufbau nach dem Dossier «Ähnlichkeit» (Abbildungen, ähnliche Dreiecke, Strahlensätze,
// rechtwinkliges Dreieck mit Höhe).
//   Sim.st.map(P, T)       Ähnlichkeitsabbildung: gleiche Winkel, entsprechende Seiten im Verhältnis |k|, Verhältnisse im Dreieck
//   Sim.st.test(P, Q)      zwei beliebige Dreiecke: Winkel vergleichen, Zuordnung der Ecken, Seitenverhältnisse
//   Sim.st.ray(R)          Strahlensätze (V- und X-Figur), Verhältnisgleichung für eine fehlende Länge
//   Sim.st.right(R)        drei ähnliche Dreiecke im rechtwinkligen Dreieck: Höhensatz, Kathetensatz
// Sim.doc(r) → SV.Doc
// ═════════════════════════════════════════════════════════════════
(function () {
  const { DOC } = Dif;
  const n = Sim.n, ex = Sim.ex;
  const mkSt = () => { const st = []; const f = k => s => { st.push({ k, s }); }; return { st, h: f('h'), p: f('p'), e: f('e'), res: f('res'), note: f('note') }; };
  const eq = (...v) => (v.every(x => ex(x)) ? '=' : '\\approx');
  const len = (nm, v) => '|' + nm + '|' + eq(v) + n(v);
  // Bruch zweier Längen mit Zahlen und Wert
  const fr = (a, b, va, vb) => '\\frac{|' + a + '|}{|' + b + '|}=\\frac{' + n(va) + '}{' + n(vb) + '}' + eq(va, vb, va / vb) + n(va / vb);
  const deg = v => n(v, 1) + '^\\circ';
  const pt = P => '(' + n(P[0]) + '\\,|\\,' + n(P[1]) + ')';
  const NM = ['A', 'B', 'C'], NP = ["A'", "B'", "C'"], NQ = ['P', 'Q', 'R'];
  const side = (N, i) => N[(i + 1) % 3] + N[(i + 2) % 3];             // Seite gegenüber Ecke i

  // ───────── Ähnlichkeitsabbildung ─────────
  function map(P, T) {
    const B = mkSt(), Q = P.map(p => Sim.apply(T, p)), t1 = Sim.tri(P[0], P[1], P[2]), t2 = Sim.tri(Q[0], Q[1], Q[2]), K = Sim.kinds(T), k = Math.abs(T.k);
    const parts = [], ax = Sim.axisOf(T);
    if (T.refl) parts.push('Spiegelung an der $' + ax + '$-Achse');
    if (K.indexOf('rot') >= 0) parts.push('Drehung um den Ursprung $O$ um $' + deg(T.phi) + '$');
    if (K.indexOf('point') >= 0) parts.push('Punktspiegelung an $Z' + pt(T.z) + '$ ($k=-1$)');
    else if (K.indexOf('dil') >= 0) parts.push('zentrische Streckung von $Z' + pt(T.z) + '$ aus mit $k=' + n(T.k) + '$');
    if (K.indexOf('trans') >= 0) parts.push('Verschiebung um $' + n(Math.abs(T.v[0])) + '$ nach ' + (T.v[0] < 0 ? 'links' : 'rechts') + ' und $' + n(Math.abs(T.v[1])) + '$ nach ' + (T.v[1] < 0 ? 'unten' : 'oben'));
    // Mehrere Abbildungen: jede als eigene Zeile (so bleibt jeder Satz für sich übersetzbar, statt dass alle Kombinationen eigene Sätze wären)
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    if (parts.length > 1) { B.p('**Abbildung:** Das Dreieck $ABC$ wird nacheinander abgebildet:'); parts.forEach((s, i) => B.p((i + 1) + '. ' + cap(s) + '.')); }
    else B.p('**Abbildung:** ' + (parts.length ? cap(parts[0]) + '.' : 'keine (das Bild liegt auf dem Original).'));
    // So hängen die Ecken zusammen (nur bei EINER Grundabbildung gibt es eine einfache Regel)
    if (K.length === 1) {
      const one = K[0], ph = Sim.normA(T.phi);
      if (one === 'trans') B.p('**Zusammenhang:** Jeder Punkt wandert um dieselbe Strecke in dieselbe Richtung: $P(x\\,|\\,y)\\mapsto P\'(x' + (T.v[0] < 0 ? '-' : '+') + n(Math.abs(T.v[0])) + '\\,|\\,y' + (T.v[1] < 0 ? '-' : '+') + n(Math.abs(T.v[1])) + ')$. Die Strecken $AA\'$, $BB\'$, $CC\'$ sind parallel und gleich lang.');
      else if (one === 'refl') B.p('**Zusammenhang:** Punkt und Bildpunkt liegen gleich weit von der Achse entfernt, ihre Verbindung steht senkrecht auf der Achse: $P(x\\,|\\,y)\\mapsto P\'(' + (ax === 'x' ? 'x\\,|\\,-y' : '-x\\,|\\,y') + ')$. Der Umlaufsinn kehrt sich um.');
      else if (one === 'rot') B.p('**Zusammenhang:** Punkt und Bildpunkt liegen auf demselben Kreis um $O$, der Winkel $\\angle POP\'$ ist für jeden Punkt $' + deg(Math.abs(ph)) + '$ (' + (ph > 0 ? 'gegen den' : 'im') + ' Uhrzeigersinn)' + (Math.abs(ph - 90) < 1e-9 ? ': $P(x\\,|\\,y)\\mapsto P\'(-y\\,|\\,x)$.' : Math.abs(ph + 90) < 1e-9 ? ': $P(x\\,|\\,y)\\mapsto P\'(y\\,|\\,-x)$.' : Math.abs(Math.abs(ph) - 180) < 1e-9 ? ': $P(x\\,|\\,y)\\mapsto P\'(-x\\,|\\,-y)$.' : '.'));
      else B.p('**Zusammenhang:** Punkt und Bildpunkt liegen auf einer Geraden durch $Z$, und es gilt $|ZP\'|=|k|\\cdot|ZP|$' + (T.k < 0 ? ' (für $k<0$ auf der anderen Seite von $Z$)' : '') + '. Entsprechende Seiten sind parallel.');
    }
    NM.forEach((nm, i) => B.e(nm + pt(P[i]) + '\\ \\mapsto\\ ' + NP[i] + pt(Q[i])));
    B.p('**Winkel bleiben gleich:** Bei jeder Ähnlichkeitsabbildung sind entsprechende Winkel gleich gross.');
    B.e('\\alpha=\\alpha\'=' + deg(t1.al) + ',\\quad\\beta=\\beta\'=' + deg(t1.be) + ',\\quad\\gamma=\\gamma\'=' + deg(t1.ga));
    B.p('**Entsprechende Seiten:** Jede Länge wird mit dem gleichen Faktor $|k|=' + n(k) + '$ multipliziert. Das Verhältnis Bild : Original ist für alle drei Seiten gleich:');
    [2, 0, 1].forEach(i => B.e(fr(side(NP, i), side(NM, i), [t2.a, t2.b, t2.c][i], [t1.a, t1.b, t1.c][i])));
    B.p('**Seitenverhältnisse im Dreieck bleiben erhalten:** Teilt man zwei Seiten desselben Dreiecks, erhält man im Bild dasselbe wie im Original.');
    B.e(fr("A'C'", "C'B'", t2.b, t2.a) + '\\qquad ' + fr('AC', 'CB', t1.b, t1.a));
    B.e(fr("A'B'", "C'B'", t2.c, t2.a) + '\\qquad ' + fr('AB', 'CB', t1.c, t1.a));
    B.p('**Flächen** werden mit $k^2$ multipliziert:');
    B.e('F_{A\'B\'C\'}=k^2\\cdot F_{ABC}=' + n(k * k, 4) + '\\cdot' + n(t1.area) + eq(t2.area) + n(t2.area));
    if (T.k < 0) B.note('Für $k<0$ liegt das Bild auf der anderen Seite von $Z$; es gilt $|ZA\'|=|k|\\cdot|ZA|$. Der Fall $k=-1$ ist die Punktspiegelung.');
    if (Math.abs(k - 1) < 1e-9 && K.length) B.note('Mit $|k|=1$ sind Bild und Original sogar kongruent (deckungsgleich): Verschiebung, Drehung und Spiegelung ändern keine Länge. Erst die zentrische Streckung macht aus «kongruent» «ähnlich».');
    B.res('$\\triangle ABC\\sim\\triangle A\'B\'C\'$: gleiche Winkel, alle entsprechenden Seitenverhältnisse gleich $' + n(k) + '$');
    return { title: 'Ähnlichkeitsabbildung', st: B.st };
  }

  // ───────── Ähnlich oder nicht? ─────────
  function test(P, Q) {
    const B = mkSt(), t1 = Sim.tri(P[0], P[1], P[2]), t2 = Sim.tri(Q[0], Q[1], Q[2]), M = Sim.match(t1, t2), A1 = [t1.al, t1.be, t1.ga], A2 = [t2.al, t2.be, t2.ga];
    B.p('**Merke:** Zwei Dreiecke sind ähnlich, wenn sie in allen drei Winkeln übereinstimmen. Wegen der Winkelsumme $180^\\circ$ genügen zwei gleiche Winkel.');
    B.e('\\triangle ABC:\\quad \\alpha=' + deg(A1[0]) + ',\\ \\beta=' + deg(A1[1]) + ',\\ \\gamma=' + deg(A1[2]));
    B.e('\\triangle PQR:\\quad \\angle P=' + deg(A2[0]) + ',\\ \\angle Q=' + deg(A2[1]) + ',\\ \\angle R=' + deg(A2[2]));
    if (!t1.ok || !t2.ok) { B.note('Ein Dreieck ist entartet (alle Ecken auf einer Geraden).'); B.res('kein Vergleich möglich'); return { title: 'Ähnlich oder nicht?', st: B.st }; }
    const p = M.p, img = [0, 1, 2].map(i => NQ[p[i]]);
    if (M.sim) {
      B.p('**Gleiche Winkel gefunden:** Die Ecken mit gleichen Winkeln entsprechen sich:');
      B.e('A\\leftrightarrow ' + img[0] + ',\\quad B\\leftrightarrow ' + img[1] + ',\\quad C\\leftrightarrow ' + img[2]);
      B.p('**Entsprechende Ecken in derselben Reihenfolge notieren**, dann sind die entsprechenden Seitenverhältnisse gleich:');
      [2, 0, 1].forEach(i => { const s2 = img[(i + 1) % 3] + img[(i + 2) % 3]; B.e(fr(s2, side(NM, i), [t2.a, t2.b, t2.c][p[i]], [t1.a, t1.b, t1.c][i])); });
      B.note(M.same ? 'Die Dreiecke sind gleich orientiert: Drehen, Strecken und Verschieben genügen.' : 'Die Dreiecke sind gegensinnig orientiert: Man braucht zusätzlich eine Spiegelung.');
      B.res('$\\triangle ABC\\sim\\triangle ' + img.join('') + '$ mit Faktor $' + n(M.k) + '$');
    } else {
      B.p('**Winkel vergleichen:** Auch bei der besten Zuordnung ($A\\leftrightarrow ' + img[0] + '$, $B\\leftrightarrow ' + img[1] + '$, $C\\leftrightarrow ' + img[2] + '$) unterscheiden sich die Winkel um bis zu $' + deg(M.err) + '$.');
      B.p('Darum sind auch die Seitenverhältnisse **nicht** alle gleich:');
      [2, 0, 1].forEach(i => { const s2 = img[(i + 1) % 3] + img[(i + 2) % 3]; B.e(fr(s2, side(NM, i), [t2.a, t2.b, t2.c][p[i]], [t1.a, t1.b, t1.c][i])); });
      B.res('Die Dreiecke sind nicht ähnlich');
    }
    return { title: 'Ähnlich oder nicht?', st: B.st };
  }

  // ───────── Strahlensätze ─────────
  function ray(R) {
    const B = mkSt();
    B.p(R.cross ? 'Zwei Geraden schneiden sich in $Z$. $A$ und $C$ liegen auf der einen, $B$ und $D$ auf der anderen Geraden, auf verschiedenen Seiten von $Z$ (X-Figur).' : 'Zwei Strahlen haben den gemeinsamen Anfangspunkt $Z$. $A$ und $C$ liegen auf dem einen, $B$ und $D$ auf dem anderen Strahl (V-Figur).');
    if (R.par) {
      B.p('**Ähnliche Dreiecke:** Weil $AB\\parallel CD$, stimmen $\\triangle ZAB$ und $\\triangle ZCD$ in allen Winkeln überein (' + (R.cross ? 'Scheitelwinkel bei $Z$, Wechselwinkel an Parallelen' : 'gemeinsamer Winkel bei $Z$, Stufenwinkel an Parallelen') + ').');
      B.e('AB\\parallel CD\\ \\Rightarrow\\ \\triangle ZAB\\sim\\triangle ZCD');
    } else {
      B.p('**Achtung:** $AB$ und $CD$ sind **nicht** parallel. Die Dreiecke $ZAB$ und $ZCD$ sind dann nicht ähnlich, die Strahlensätze gelten nicht:');
      B.e(fr('ZA', 'ZC', R.ZA, R.ZC) + '\\qquad ' + fr('ZB', 'ZD', R.ZB, R.ZD));
      B.res('Die Verhältnisse sind verschieden, weil $AB\\not\\parallel CD$');
      return { title: 'Strahlensätze', st: B.st };
    }
    B.p('**Erster Strahlensatz:** Die Abschnitte von $Z$ aus stehen auf beiden Strahlen im gleichen Verhältnis.');
    B.e('\\frac{|ZA|}{|ZC|}=\\frac{|ZB|}{|ZD|}');
    B.e(fr('ZA', 'ZC', R.ZA, R.ZC) + ',\\qquad ' + fr('ZB', 'ZD', R.ZB, R.ZD));
    if (!R.cross) { B.p('Ebenso die Abschnitte zwischen den Parallelen:'); B.e(fr('ZA', 'AC', R.ZA, R.AC) + ',\\qquad ' + fr('ZB', 'BD', R.ZB, R.BD)); }
    B.p('**Zweiter Strahlensatz:** Die Parallelen stehen im gleichen Verhältnis wie die Abschnitte von $Z$ aus.');
    B.e('\\frac{|AB|}{|CD|}=\\frac{|ZA|}{|ZC|}=\\frac{|ZB|}{|ZD|}');
    B.e(fr('AB', 'CD', R.AB, R.CD));
    B.p('**Fehlende Länge berechnen:** Gesucht ist $|CD|$, bekannt sind $|AB|$, $|ZA|$ und $|ZC|$. Verhältnisgleichung aufstellen und nach $|CD|$ auflösen:');
    B.e('\\frac{|CD|}{|AB|}=\\frac{|ZC|}{|ZA|}\\quad\\Rightarrow\\quad |CD|=|AB|\\cdot\\frac{|ZC|}{|ZA|}');
    B.e('|CD|=' + n(R.AB) + '\\cdot\\frac{' + n(R.ZC) + '}{' + n(R.ZA) + '}' + eq(R.AB, R.ZC, R.ZA, R.CD) + n(R.CD));
    B.note('Beim zweiten Strahlensatz gehören zu den Parallelen immer die Abschnitte von $Z$ aus, nicht die Abschnitte $|AC|$ und $|BD|$.');
    B.res('$\\frac{|ZA|}{|ZC|}=\\frac{|ZB|}{|ZD|}=\\frac{|AB|}{|CD|}' + eq(R.ZA / R.ZC) + n(R.ZA / R.ZC) + '$');
    return { title: 'Strahlensätze', st: B.st };
  }

  // ───────── Rechtwinkliges Dreieck mit Höhe ─────────
  function right(R) {
    const B = mkSt();
    B.p('**Drei Dreiecke in einem:** Die Höhe $CD$ teilt das rechtwinklige Dreieck $ABC$ in zwei Teildreiecke. Alle drei haben die Winkel $\\alpha$, $\\beta$ und $90^\\circ$, also gilt');
    B.e('\\alpha=' + deg(R.al) + ',\\quad\\beta=' + deg(R.be) + ',\\quad \\triangle ADC\\sim\\triangle CDB\\sim\\triangle ACB');
    B.p('Entsprechende Ecken in derselben Reihenfolge: $A\\leftrightarrow C\\leftrightarrow A$ (Winkel $\\alpha$), $D\\leftrightarrow D\\leftrightarrow C$ (rechter Winkel), $C\\leftrightarrow B\\leftrightarrow B$ (Winkel $\\beta$).');
    B.p('**Höhensatz** aus $\\triangle ADC\\sim\\triangle CDB$:');
    B.e('\\frac{|CD|}{|AD|}=\\frac{|DB|}{|CD|}\\quad\\Rightarrow\\quad |CD|^2=|AD|\\cdot|DB|');
    B.e('|CD|^2=' + n(R.p) + '\\cdot' + n(R.q) + eq(R.p * R.q) + n(R.p * R.q, 4) + ',\\qquad |CD|' + eq(R.h) + n(R.h));
    B.p('**Kathetensatz** aus $\\triangle ADC\\sim\\triangle ACB$ bzw. $\\triangle CDB\\sim\\triangle ACB$:');
    B.e('\\frac{|AC|}{|AB|}=\\frac{|AD|}{|AC|}\\ \\Rightarrow\\ |AC|^2=|AB|\\cdot|AD|=' + n(R.c) + '\\cdot' + n(R.p) + eq(R.c * R.p) + n(R.c * R.p, 4));
    B.e('\\frac{|BC|}{|AB|}=\\frac{|DB|}{|BC|}\\ \\Rightarrow\\ |BC|^2=|AB|\\cdot|DB|=' + n(R.c) + '\\cdot' + n(R.q) + eq(R.c * R.q) + n(R.c * R.q, 4));
    B.p('**Kontrolle mit Pythagoras:**');
    B.e('|AC|^2+|BC|^2=' + n(R.c * R.p, 4) + '+' + n(R.c * R.q, 4) + eq(R.c * R.c) + n(R.c * R.c, 4) + '=|AB|^2');
    B.note('Vorgehen: gleiche Winkel markieren, ähnliche Dreiecke mit entsprechenden Ecken in derselben Reihenfolge notieren, Verhältnisgleichung aufstellen und lösen.');
    B.res('$|CD|^2=|AD|\\cdot|DB|$, $|AC|^2=|AB|\\cdot|AD|$, $|BC|^2=|AB|\\cdot|DB|$');
    return { title: 'Rechtwinkliges Dreieck mit Höhe', st: B.st };
  }

  function doc(r) { return Dif.stDoc(r); }
  Sim.st = { map, test, ray, right };
  Sim.doc = doc;
  Sim.fr = fr; Sim.len = len; Sim.eqs = eq;
})();
