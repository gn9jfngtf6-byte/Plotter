// ═════════════════════════════════════════════════════════════════
// MODUL 106b: Rechenwege zu Folgen und Reihen (zu 106_seq.js, ohne DOM)
//
// Schritte {k, s}: 'h' Überschrift, 'p' Text (**fett**, $Formel$), 'e' Formelzeile, 'res' Ergebnis, 'note' Hinweis.
//   Sq.st.def(S, k)            Folge explizit/rekursiv: Einsetzen bzw. Glied für Glied
//   Sq.st.ari(A, k, t)         arithmetische Folge: d, rekursiv/explizit, a_k, a_n = t lösen
//   Sq.st.geo(G, k, t)         geometrische Folge: q, rekursiv/explizit, a_k, «ab welchem Glied» mit Logarithmus
//   Sq.st.sum(o)               Reihe: Summenzeichen, Formel (Gauss-Trick bzw. s − q·s), Wert
//   Sq.st.lim(o)               Grenzwert einer Folge (ε-Streifen) bzw. unendliche geometrische Reihe
//   Sq.st.ind(I, n)            vollständige Induktion (bzw. Gegenbeispiel n² − n + 41)
// Sq.doc(r) → SV.Doc
// ═════════════════════════════════════════════════════════════════
(function () {
  const { DOC } = Dif;
  const q = Sq.q;
  const mkSt = () => { const st = []; const f = k => s => { st.push({ k, s }); }; return { st, h: f('h'), p: f('p'), e: f('e'), res: f('res'), note: f('note') }; };
  const par = v => (v < 0 || /frac/.test(q(v)) ? '\\left(' + q(v) + '\\right)' : q(v));
  const sgn = v => (v < 0 ? '-' + q(-v) : '+' + q(v));

  // ───────── Folge: explizit oder rekursiv ─────────
  function def(S, k) {
    const B = mkSt(), N = Math.max(k, 6), t = Sq.terms(S, N);
    if (S.kind === 'exp') {
      B.p('**Explizite Darstellung:** Jedes Glied $a_n$ lässt sich direkt aus seiner Nummer $n$ berechnen.');
      B.e('a_n=' + S.tex);
      const r = Sq.termTex(S, k);
      B.p('**Glied Nummer ' + k + ':** $n=' + k + '$ einsetzen.');
      B.e('a_{' + k + '}=' + (r.sub ? r.sub + '=' : '') + r.tex);
    } else {
      B.p('**Rekursive Darstellung:** Man braucht den Startwert und die Regel vom Vorgänger $a_n$ zum Nachfolger $a_{n+1}$.');
      B.e('a_1=' + q(S.a1) + ',\\qquad a_{n+1}=' + S.tex);
      B.p('**Glied für Glied** bis $a_{' + k + '}$:');
      for (let i = 1; i < Math.min(k, 9); i++) B.e('a_{' + (i + 1) + '}=' + S.tex.replace(/a_n/g, par(t[i - 1])) + '=' + q(t[i]));
      if (k > 9) B.e('\\ldots\\qquad a_{' + k + '}=' + q(t[k - 1]));
      B.note('Für $a_{100}$ braucht man rekursiv alle 99 Glieder davor; explizit genügt Einsetzen.');
    }
    B.p('**Die ersten Glieder:**');
    B.e(t.slice(0, 6).map(q).join(',\\ ') + ',\\ \\ldots');
    const D = Sq.detect(t.slice(0, 6));
    if (D.ari !== null) B.note('Die Differenz benachbarter Glieder ist immer $d=' + q(D.ari) + '$: Die Folge ist **arithmetisch**.');
    else if (D.geo !== null) B.note('Der Quotient benachbarter Glieder ist immer $q=' + q(D.geo) + '$: Die Folge ist **geometrisch**.');
    B.res('$a_{' + k + '}=' + q(t[k - 1]) + '$');
    return { title: S.kind === 'exp' ? 'Folge: explizit' : 'Folge: rekursiv', st: B.st };
  }

  // ───────── arithmetische Folge ─────────
  function ari(A, k, t) {
    const B = mkSt();
    B.p('**Kennzeichen:** Die Differenz benachbarter Glieder ist konstant.');
    B.e('a_{n+1}-a_n=d=' + q(A.d));
    B.p('**Rekursiv:** $a_1=' + q(A.a1) + '$, $a_{n+1}=a_n' + sgn(A.d) + '$. **Explizit:** Bis zum $n$-ten Glied kommt $d$ genau $(n-1)$-mal dazu.');
    const c = A.a1 - A.d;
    B.e('a_n=a_1+(n-1)\\cdot d=' + q(A.a1) + '+(n-1)\\cdot ' + par(A.d) + (Math.abs(A.d) > 1e-12 ? '=' + (Math.abs(A.d - 1) < 1e-12 ? '' : Math.abs(A.d + 1) < 1e-12 ? '-' : q(A.d)) + 'n' + (Math.abs(c) > 1e-12 ? sgn(c) : '') : ''));
    B.e('a_{' + k + '}=' + q(A.a1) + '+' + (k - 1) + '\\cdot ' + par(A.d) + '=' + q(A.at(k)));
    if (isFinite(t)) {
      B.p('**Welches Glied** hat den Wert $' + q(t) + '$? Gleichung $a_n=' + q(t) + '$ nach $n$ auflösen:');
      const r = Sq.solveAri(A, t);
      B.e(q(A.a1) + '+(n-1)\\cdot ' + par(A.d) + '=' + q(t) + '\\quad\\Rightarrow\\quad n-1=\\frac{' + q(t) + '-' + par(A.a1) + '}{' + q(A.d) + '}=' + q(r.n - 1) + '\\quad\\Rightarrow\\quad n=' + q(r.n));
      B.note(r.ok ? 'Das ist das Glied $a_{' + Math.round(r.n) + '}$.' : 'Keine natürliche Zahl: Kein Glied der Folge hat genau diesen Wert.');
    }
    B.note('Arithmetische Folgen beschreiben **lineares Wachstum**: Die Punkte $(n\\,|\\,a_n)$ liegen auf einer Geraden mit Steigung $d$.');
    B.res('$a_n=' + q(A.a1) + '+(n-1)\\cdot ' + par(A.d) + '$, $a_{' + k + '}=' + q(A.at(k)) + '$');
    return { title: 'Arithmetische Folge', st: B.st };
  }

  // ───────── geometrische Folge ─────────
  function geo(G, k, t) {
    const B = mkSt();
    B.p('**Kennzeichen:** Der Quotient benachbarter Glieder ist konstant.');
    B.e('\\frac{a_{n+1}}{a_n}=q=' + q(G.q));
    B.p('**Rekursiv:** $a_1=' + q(G.a1) + '$, $a_{n+1}=a_n\\cdot ' + par(G.q) + '$. **Explizit:** Bis zum $n$-ten Glied wird $(n-1)$-mal mit $q$ multipliziert.');
    B.e('a_n=a_1\\cdot q^{\\,n-1}=' + q(G.a1) + '\\cdot ' + par(G.q) + '^{\\,n-1}');
    B.e('a_{' + k + '}=' + q(G.a1) + '\\cdot ' + par(G.q) + '^{' + (k - 1) + '}=' + q(G.at(k)));
    if (G.q > 1) B.note('$q>1$: **exponentielles Wachstum** um $' + Sq.fmt((G.q - 1) * 100, 2) + '\\,\\%$ pro Schritt.');
    else if (G.q > 0 && G.q < 1) B.note('$0<q<1$: **exponentieller Zerfall**, Abnahme um $' + Sq.fmt((1 - G.q) * 100, 2) + '\\,\\%$ pro Schritt.');
    else if (G.q < 0) B.note('$q<0$: Die Vorzeichen wechseln ab (alternierende Folge).');
    const r = isFinite(t) ? Sq.solveGeo(G, t) : null;
    if (r) {
      const rel = r.grow ? '>' : '<';
      B.p('**Ab welchem Glied** gilt $a_n' + rel + q(t) + '$? Ungleichung mit dem Logarithmus lösen' + (r.grow ? '' : ' (Achtung: $\\log q<0$, das Zeichen kehrt)') + ':');
      B.e(q(G.a1) + '\\cdot ' + par(G.q) + '^{\\,n-1}' + rel + q(t) + '\\quad\\Rightarrow\\quad ' + par(G.q) + '^{\\,n-1}' + rel + q(t / G.a1));
      B.e('n-1' + rel + '\\frac{\\log(' + q(t / G.a1) + ')}{\\log(' + q(G.q) + ')}\\approx' + Sq.fmt(r.x, 3) + '\\quad\\Rightarrow\\quad n=' + r.n);
      B.note('Kontrolle: $a_{' + (r.n - 1) + '}\\approx' + Sq.fmt(G.at(r.n - 1), 4) + '$, $a_{' + r.n + '}\\approx' + Sq.fmt(G.at(r.n), 4) + '$.');
    }
    B.res('$a_n=' + q(G.a1) + '\\cdot ' + par(G.q) + '^{\\,n-1}$, $a_{' + k + '}=' + q(G.at(k)) + '$' + (r ? ', ab $n=' + r.n + '$' : ''));
    return { title: 'Geometrische Folge', st: B.st };
  }

  // ───────── Reihen ─────────
  function sum(o) {
    const B = mkSt(), n = o.n;
    if (o.type === 'ari') {
      const A = o.A, an = A.at(n), s = Sq.sumAri(A, n);
      B.p('**Reihe** = Summe der ersten $n$ Glieder. Mit dem Summenzeichen:');
      B.e('s_{' + n + '}=\\sum_{k=1}^{' + n + '}\\left(' + q(A.a1) + '+(k-1)\\cdot ' + par(A.d) + '\\right)=' + q(A.a1) + '+' + par(A.at(2)) + '+\\ldots+' + par(an));
      B.p('**Trick von Gauss:** Die Summe vorwärts und rückwärts untereinander schreiben. Jede Spalte ergibt $a_1+a_n$, und es gibt $n$ Spalten: $2s_n=n\\cdot(a_1+a_n)$.');
      B.e('s_n=\\frac{n\\cdot(a_1+a_n)}{2}');
      B.e('a_{' + n + '}=' + q(A.a1) + '+' + (n - 1) + '\\cdot ' + par(A.d) + '=' + q(an) + ',\\qquad s_{' + n + '}=\\frac{' + n + '\\cdot(' + q(A.a1) + '+' + par(an) + ')}{2}=' + q(s));
      B.res('$s_{' + n + '}=' + q(s) + '$');
    } else {
      const G = o.G, s = Sq.sumGeo(G, n);
      B.p('**Geometrische Reihe:** Summe der ersten $n$ Glieder von $a_k=' + q(G.a1) + '\\cdot ' + par(G.q) + '^{\\,k-1}$.');
      B.e('s_{' + n + '}=\\sum_{k=1}^{' + n + '}' + q(G.a1) + '\\cdot ' + par(G.q) + '^{\\,k-1}=' + q(G.a1) + '+' + par(G.at(2)) + '+\\ldots+' + par(G.at(n)));
      B.p('**Herleitung:** $s_n-q\\cdot s_n$ – fast alle Summanden heben sich weg: $s_n(1-q)=a_1(1-q^n)$.');
      B.e('s_n=a_1\\cdot\\frac{q^n-1}{q-1}\\qquad(q\\neq1)');
      B.e('s_{' + n + '}=' + q(G.a1) + '\\cdot\\frac{' + par(G.q) + '^{' + n + '}-1}{' + q(G.q) + '-1}' + (Sq.isQ(s) && Math.abs(s) < 1e15 ? '=' : '\\approx') + (Math.abs(s) < 1e15 ? q(s) : Sq.fmt(s, 4)));
      B.res('$s_{' + n + '}' + (Math.abs(s) < 1e15 ? '=' + q(s) : '\\approx' + Sq.fmt(s, 4)) + '$');
    }
    return { title: o.type === 'ari' ? 'Arithmetische Reihe' : 'Geometrische Reihe', st: B.st };
  }

  // ───────── Grenzwert ─────────
  function lim(o) {
    const B = mkSt();
    if (o.type === 'ser') {
      const G = o.G, s = Sq.sumInf(G);
      B.p('**Unendliche geometrische Reihe:** Man addiert unendlich viele Glieder. Die Partialsummen sind');
      B.e('s_n=a_1\\cdot\\frac{1-q^n}{1-q}');
      if (Math.abs(G.q) < 1) {
        B.p('Für $|q|<1$ geht $q^n\\to0$, also nähern sich die Partialsummen einem Grenzwert:');
        B.e('s=\\lim_{n\\to\\infty}s_n=\\frac{a_1}{1-q}=\\frac{' + q(G.a1) + '}{1-' + par(G.q) + '}=' + q(s));
        B.e('s_{' + o.n + '}=' + q(Sq.sumGeo(G, o.n)) + ',\\qquad s-s_{' + o.n + '}=' + q(s - Sq.sumGeo(G, o.n)));
        B.res('$' + q(G.a1) + '+' + par(G.at(2)) + '+' + par(G.at(3)) + '+\\ldots=' + q(s) + '$');
      } else {
        B.p('Für $|q|\\ge1$ geht $q^n$ nicht gegen 0: Die Reihe hat **keinen** Grenzwert (divergent).');
        B.res('divergent, weil $|q|=' + q(Math.abs(G.q)) + '\\ge1$');
      }
      return { title: 'Unendliche geometrische Reihe', st: B.st };
    }
    const S = o.S, L = Sq.limit(S);
    B.e('a_n=' + (S.kind === 'exp' ? S.tex : '\\ldots'));
    if (L.conv) {
      B.p('**Konvergent:** Für grosse $n$ kommen die Glieder der Zahl $' + L.Ltex + '$ beliebig nahe.');
      B.e('\\lim_{n\\to\\infty}a_n=' + L.Ltex);
      if (S.kind === 'exp' && /frac/.test(S.tex)) B.note('Bei Brüchen Zähler und Nenner durch die höchste Potenz von $n$ teilen; dann gehen Terme wie $\\frac1n$ gegen 0.');
      const N = Sq.nEps(S, L.L, o.eps);
      B.p('**Streifen um den Grenzwert:** Für $\\varepsilon=' + Sq.qs(o.eps) + '$ liegen ab dem Glied $N$ alle Glieder im Streifen $' + L.Ltex + '\\pm' + Sq.qs(o.eps) + '$:');
      B.e(N ? '|a_n-' + L.Ltex + '|<' + Sq.qs(o.eps) + '\\quad\\text{für alle } n\\ge' + N : '\\text{(bis } n=2000 \\text{ nicht erreicht)}');
      B.note('Je schmaler der Streifen, desto später beginnt er: Zu jedem $\\varepsilon>0$ gibt es ein solches $N$. Wichtig: $\\lim\\frac1n=0$ und $\\lim q^n=0$ für $|q|<1$.');
      B.res('$\\lim\\limits_{n\\to\\infty}a_n=' + L.Ltex + '$');
    } else {
      B.p(L.kind === 'osc' ? '**Divergent:** Die Glieder springen hin und her und nähern sich keiner festen Zahl.' : '**Divergent:** Die Glieder werden beliebig gross' + (L.kind === '-inf' ? ' (negativ)' : '') + '.');
      B.res('divergent');
    }
    return { title: 'Grenzwert einer Folge', st: B.st };
  }

  // ───────── vollständige Induktion ─────────
  function ind(I, n) {
    const B = mkSt();
    if (I.prime) {
      B.p('**Beispiele beweisen nichts.** Die Werte von $n^2-n+41$ sind für $n=1,\\ldots,40$ alles Primzahlen:');
      B.e([1, 2, 3, 4, 5].map(k => I.p(k)).join(',\\ ') + ',\\ \\ldots,\\ ' + I.p(40));
      B.p('Aber für $n=41$:');
      B.e('41^2-41+41=41^2=1681=41\\cdot41');
      B.res('Die Vermutung ist falsch – ein einziges Gegenbeispiel genügt.');
      return { title: 'Vorsicht mit Vermutungen', st: B.st };
    }
    B.p('**Aussage** $A(n)$:');
    B.e(I.lhs + '=' + I.rhs);
    B.p('**1. Induktionsanfang** ($n=1$): beide Seiten berechnen.');
    B.e(q(I.s(1)) + '=' + q(I.r(1)) + '\\ \\checkmark');
    B.p('**2. Induktionsschritt.** Voraussetzung: $A(n)$ gilt für ein $n$. Behauptung: Dann gilt auch $A(n+1)$:');
    B.e(I.lhs + '+' + (/^[\\(0-9a-z]/.test(I.next) ? I.next : '(' + I.next + ')') + '=' + I.rhs1);
    B.p('**Beweis:** Die ersten $n$ Summanden durch die Voraussetzung ersetzen, dann umformen:');
    B.e('\\underbrace{' + I.lhs + '}_{=\\,' + I.rhs + '\\ \\text{(Voraussetzung)}}+' + I.next);
    I.step.forEach(s => B.e(s));
    B.p('**Bild:** Der erste Dominostein fällt (Anfang), und jeder Stein stösst seinen Nachfolger um (Schritt) – also fallen alle.');
    B.e('A(1)\\Rightarrow A(2)\\Rightarrow A(3)\\Rightarrow\\ldots\\Rightarrow A(' + n + ')\\Rightarrow\\ldots');
    let lhs = 0; for (let k = 1; k <= n; k++) lhs += I.s(k);
    B.note('Kontrolle für $n=' + n + '$: linke Seite $' + q(lhs) + '$, rechte Seite $' + q(I.r(n)) + '$.');
    B.res('$' + I.lhs + '=' + I.rhs + '$ gilt für alle $n\\ge1$.');
    return { title: 'Vollständige Induktion', st: B.st };
  }

  function doc(r) {
    const d = DOC(); d.h(r.title);
    r.st.forEach(s => { if (s.k === 'h') d.h(s.s); else if (s.k === 'p') d.p(s.s); else if (s.k === 'e') d.e(s.s); else if (s.k === 'res') d.res(s.s); else if (s.k === 'note') d.note(s.s); });
    return d;
  }
  Sq.st = { def, ari, geo, sum, lim, ind };
  Sq.doc = doc;
})();
