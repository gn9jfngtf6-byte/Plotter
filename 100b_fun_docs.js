// ═════════════════════════════════════════════════════════════════
// MODUL 100b: Rechenwege der Einführung in Funktionen (zu 100_fun.js, ohne DOM)
//
// Schritte {k, s, sc} wie bei 93b_exp_docs.js: k 'h' Überschrift, 'p' Text (**fett**, $Formel$), 'e' Formelzeile,
// 'res' Ergebnis, 'note' Hinweis, 'tab' Tabelle; sc = Farbbuchstabe, wenn die Zeile auch im Bild erscheint.
//   Fun.st.map(Fx, x0, step, n)     Zuordnung und Wertetabelle: Einsetzen Schritt für Schritt, Schreibweisen, Punkte
//   Fun.st.bars(Fx, h, bars)        Balken über den Stellen: Stellen im Abstand h, Werte, h → 0 ergibt den Graphen
//   Fun.st.def(Fx, P, x0, x1, t)    Funktionsbegriff: Definitionsbereich, Wertebereich, Nullstellen, y-Achsenabschnitt, Monotonie, senkrechte Gerade
//   Fun.st.app(A, Fx, x)            Anwendung: Grössen, Einheiten, Ablesen, Änderung
// Fun.doc(r) → SV.Doc, Fun.sceneLines(r) → Zeilen im Bild
// ═════════════════════════════════════════════════════════════════
(function () {
  const E = Dif.E, { DOC, fmtT } = Dif;
  const T = q => E.qTex(q);
  const nv = (v, d) => fmtT(v, d === undefined ? 4 : d);
  const mkSt = () => { const st = []; const f = k => (s, sc) => { st.push({ k, s, sc }); }; return { st, h: f('h'), p: f('p'), e: f('e'), res: f('res'), note: f('note'), tab: (head, rows) => { st.push({ k: 'tab', head, rows }); } }; };
  const niceX = x => Fun.numTex(x);

  // ───────── Zuordnung und Wertetabelle ─────────
  function map(Fx, x0, step, n) {
    const B = mkSt(), rows = Fun.table(Fx, x0, step, n);
    B.p('**Funktion = eindeutige Zuordnung:** Eine Funktion $f$ ordnet **jeder** Zahl $x$ aus dem Definitionsbereich **genau eine** Zahl $y=f(x)$ zu. Die Rechenvorschrift sagt, wie aus $x$ der Wert $y$ entsteht.');
    B.e('f(x)=' + Fx.tex, 'b');
    B.p('**Wertetabelle:** Man wählt Stellen $x$ (hier ab $' + niceX(x0) + '$ im Abstand $' + niceX(step) + '$) und setzt jede in die Vorschrift ein. Das Einsetzen Schritt für Schritt:');
    rows.slice(0, 4).forEach(r => { if (r.ok) B.e('f(' + r.xT + ')=' + (r.sub ? r.sub + '=' : '') + r.yT, 'g'); else B.e('f(' + r.xT + ')\\ \\text{ist nicht definiert}', 'r'); });
    B.tab(['$x$'].concat(rows.map(r => '$' + r.xT + '$')), [['$f(x)$'].concat(rows.map(r => '$' + r.yT + '$'))]);
    B.p('**Schreibweisen:** $f(x)=\\ldots$ (Funktionsgleichung), $y=f(x)$, $x\\mapsto f(x)$ (Zuordnungspfeil). Die Zahl $x$ heisst **Argument** oder Stelle, $f(x)$ **Funktionswert**.');
    B.p('**Punkte im Koordinatensystem:** Jede Zeile der Tabelle ist ein Punkt $(x\\,|\\,f(x))$: $x$ nach rechts, $f(x)$ nach oben. Alle Punkte zusammen bilden den **Graphen** von $f$.');
    const r0 = rows.find(r => r.ok);
    if (r0) B.e('(x\\,|\\,f(x))=(' + r0.xT + '\\,|\\,' + r0.yT + ')', 'v');
    B.res('Zu jedem $x$ gehört genau ein Funktionswert $f(x)$; die Wertetabelle entsteht durch Einsetzen, der Graph aus den Punkten $(x\\,|\\,f(x))$');
    return { title: 'Zuordnung und Wertetabelle', st: B.st };
  }

  // ───────── Balken über den Stellen ─────────
  function bars(Fx, h, bs) {
    const B = mkSt(), shown = (bs || []).filter(b => b.ok);
    B.e('f(x)=' + Fx.tex, 'b');
    if (!(h > 0)) {
      B.p('**Abstand 0:** Es gibt unendlich viele Stellen; die Balken rücken so dicht zusammen, dass nur noch ihre oberen Enden sichtbar sind – das ist der **Graph** der Funktion, eine durchgehende Kurve.');
      B.res('Der Graph ist die Menge aller Punkte $(x\\,|\\,f(x))$');
      return { title: 'Balken über den Stellen', st: B.st };
    }
    B.p('**Stellen im Abstand** $h=' + niceX(h) + '$: Über jeder Stelle $x=k\\cdot h$ steht ein Balken von der $x$-Achse bis zur Höhe $f(x)$. Ein negativer Wert gibt einen Balken nach unten.');
    B.e('x=\\ldots,\\ ' + [-1, 0, 1, 2].map(k => niceX(k * h)).join(',\\ ') + ',\\ \\ldots', 'v');
    const ex = shown.filter(b => Math.abs(b.x) <= 2.5 * h + 1e-9).slice(0, 4);
    ex.forEach(b => B.e('f(' + niceX(b.x) + ')=' + nv(b.y, 3), 'g'));
    B.p('**Je kleiner der Abstand,** desto mehr Balken: Bei $h=' + niceX(h) + '$ sind es im Bild ' + shown.length + '. Lässt man $h$ gegen $0$ gehen, verschmelzen die Balkenenden zur Kurve.');
    B.e('h\\to0\\colon\\ \\text{Balkenenden} \\to \\text{Graph}', 'o');
    B.res('Der Graph ist die Linie durch alle Balkenenden $(x\\,|\\,f(x))$ – für jede Stelle $x$ genau ein Punkt');
    return { title: 'Balken über den Stellen', st: B.st };
  }

  // ───────── Funktionsbegriff ─────────
  function def(Fx, P, x0, x1, t) {
    const B = mkSt(), ft = Fx.f(t);
    B.e('f(x)=' + Fx.tex, 'b');
    const R = Fun.dw(Fx);
    B.p('**Definitionsbereich** $D$: alle $x$, die man in die Vorschrift einsetzen darf – für die ganze Funktion, nicht nur im Bild. Verboten ist, durch $0$ zu teilen, die Wurzel aus einer negativen Zahl zu ziehen und den Logarithmus einer Zahl $\\le0$ zu bilden.');
    if (R) {
      const why = { ne0: c => 'Nenner: $' + c.tex + '\\ne0$', ge0: c => 'unter der Wurzel: $' + c.tex + '\\ge0$', gt0: c => 'im Logarithmus: $' + c.tex + '>0$', ne_val: c => '$' + c.tex + '\\ne' + c.val + '$', cos_ne0: c => 'beim Tangens: $\\cos(' + c.tex + ')\\ne0$' };
      const cs = R.conds.filter(c => why[c.kind]);
      if (cs.length) { B.p('**Bedingungen:**'); cs.forEach(c => { const t = why[c.kind](c); B.p(t.charAt(0).toUpperCase() + t.slice(1) + '.'); }); }   // je Bedingung eine Zeile: so bleibt jede für sich übersetzbar
      else B.p('Hier kommt keine dieser Rechnungen mit $x$ vor, also darf man jede Zahl einsetzen.');
      B.e('D=' + R.Dtex, 'r');
      B.p('**Wertebereich** $W$: alle Werte, die $f$ auf dem ganzen Definitionsbereich annimmt. Man findet ihn über den kleinsten und grössten Wert (Tief- und Hochpunkte) und über das Verhalten an den Rändern von $D$, bei Polstellen und für $x\\to\\pm\\infty$; ein Wert, dem sich der Graph nur annähert, gehört nicht dazu.');
      B.e('W=' + R.Wtex, 'r');
    } else B.p('**Wertebereich** $W$: alle Werte, die $f$ auf dem ganzen Definitionsbereich annimmt.');
    B.p('**y-Achsenabschnitt:** Der Graph schneidet die $y$-Achse bei $x=0$: ' + (P.yInt === null ? '$f(0)$ ist nicht definiert.' : ''));
    if (P.yInt !== null) B.e('f(0)=' + nv(P.yInt, 3), 'o');
    B.p('**Nullstellen:** Stellen $x$, an denen $f(x)=0$ ist, der Graph schneidet dort die $x$-Achse. ' + (P.zeros.length ? '' : 'Im Bild ist keine zu sehen.'));
    if (P.zeros.length) B.e(P.zeros.map((z, i) => 'x_' + (i + 1) + '=' + niceX(z)).join(',\\quad '), 'g');
    B.p('**Monotonie:** Wo der Graph von links nach rechts steigt, heisst $f$ **steigend**, wo er fällt, **fallend**. Zwischen den Abschnitten liegen Hoch- und Tiefpunkte.');
    const pl = Fun.polesIn(Fx, x0 - 1, x1 + 1), open = a => !isFinite(Fx.f(a)) || pl.some(q => Math.abs(q - a) < 1e-3);
    const br = (a, l) => (!open(a) ? (l ? '[' : ']') : (l ? ']' : '['));
    if (P.mono.length) B.e('\\text{im Bild: }' + P.mono.map(m => '\\text{' + (m.up ? 'steigt' : 'fällt') + ' auf } ' + br(m.a, true) + niceX(m.a) + ';\\,' + niceX(m.b) + br(m.b, false)).join(',\\ '), 'v');
    if (P.ext.length) B.e(P.ext.map(e => (e.kind === 'max' ? 'H' : 'T') + '(' + niceX(e.x) + '\\,|\\,' + nv(e.y, 3) + ')').join(',\\quad '), 'v');
    B.p('**Senkrechte-Geraden-Test:** Jede senkrechte Gerade $x=t$ trifft den Graphen einer Funktion **höchstens einmal** – zu jedem $x$ gehört ja nur ein Wert. ' + (isFinite(ft) ? 'Bei $x=' + niceX(t) + '$ ist das der Punkt $(' + niceX(t) + '\\,|\\,' + nv(ft, 3) + ')$.' : 'Bei $x=' + niceX(t) + '$ gibt es keinen Punkt (nicht definiert).'));
    B.note('Eine Kurve, die von einer senkrechten Geraden zweimal getroffen wird (z.B. ein Kreis), ist **kein** Funktionsgraph.');
    B.res(R ? '$D=' + R.Dtex + '$, $W=' + R.Wtex + '$; jede Stelle $x$ aus $D$ hat genau einen Funktionswert' : 'Definitionsbereich, Wertebereich, Nullstellen, y-Achsenabschnitt und Monotonie beschreiben den Graphen; jede Stelle hat genau einen Wert');
    return { title: 'Funktionsbegriff und Eigenschaften', st: B.st };
  }

  // ───────── Anwendung ─────────
  function app(A, Fx, x) {
    const B = mkSt(), y = Fx.f(x), y1 = Fx.f(x + A.step), xl = A.xlab.replace(/\\ \\text\{(.*?)\}/, ' $1'), fx = A.fn + '(' + A.xv + ')';
    B.st.push({ k: 'sit', s: A.descTex || A.desc, q: 'Welchen Wert hat $' + A.fn + '$ für $' + A.xv + '=' + nv(x, 2) + '$, und was bedeutet er?' });
    B.e(fx + '=' + Fun.subVar(Fx.tex, A.xv), 'b');
    B.p('**Ablesen:** Für $' + A.xv + '=' + nv(x, 2) + '$ liefert die Funktion den Wert $' + A.fn + '(' + nv(x, 2) + ')$. Im Bild: von $' + A.xv + '$ senkrecht zum Graphen, dann waagrecht zur Achse.');
    B.e(A.fn + '(' + nv(x, 2) + ')=' + nv(y, 3), 'g');
    B.p('**Bedeutung:** ' + A.say(x, y));
    if (isFinite(y1)) {
      B.p('**Änderung:** Geht $' + A.xv + '$ von $' + nv(x, 2) + '$ auf $' + nv(x + A.step, 2) + '$, ändert sich der Wert um');
      B.e(A.fn + '(' + nv(x + A.step, 2) + ')-' + A.fn + '(' + nv(x, 2) + ')=' + nv(y1, 3) + '-' + nv(y, 3) + '=' + nv(y1 - y, 3), 'o');
    }
    B.note('Achsen mit Grössen und Einheiten: waagrecht ' + xl + ', senkrecht ' + A.ylab.replace(/\\ \\text\{(.*?)\}/, ' $1').replace(/\\text\{|\}/g, '') + '. Nur Werte im sinnvollen Bereich ($' + A.xv + '\\ge0$) gehören zur Anwendung.');
    B.res(A.say(x, y));
    return { title: 'Anwendung: ' + A.name, st: B.st };
  }

  // ───────── Ausgabe ─────────
  function doc(r) {
    const d = DOC(); d.h(r.title);
    r.st.forEach(s => { if (s.k === 'h') d.h(s.s); else if (s.k === 'p') d.p(s.s); else if (s.k === 'e') d.e(s.s); else if (s.k === 'res') d.res(s.s); else if (s.k === 'note') d.note(s.s); else if (s.k === 'tab') d.b.push({ k: 'tab', head: s.head, rows: s.rows }); else if (s.k === 'sit') d.b.push({ k: 'sit', t: s.s, q: s.q || '' }); });
    return d;
  }
  function sceneLines(r) { return Dif.stLines(r); }
  Fun.st = { map, bars, def, app };
  Fun.doc = doc; Fun.sceneLines = sceneLines;
  Fun.mapDoc = (F, x0, s, n) => doc(map(F, x0, s, n)); Fun.barsDoc = (F, h, b) => doc(bars(F, h, b)); Fun.defDoc = (F, P, a, b, t) => doc(def(F, P, a, b, t)); Fun.appDoc = (A, F, x) => doc(app(A, F, x));
})();
