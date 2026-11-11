// ═══════════════════════════════════════════════════════════════════
// 38_alg_learn.js — Algebra: Beispiele, Merkblatt und Üben (ohne DOM, node-testbar)
//
// AlgLearn.EXAMPLES[mode]  Beispielgalerie (vorgelöst, mit Erklärtext zum Bild)
// AlgLearn.LAWS[mode]      Merkblatt der Gesetze (Klick lädt ein Beispiel)
// AlgLearn.INTRO[mode]     die Idee des Bildes in einem Satz
// AlgLearn.newTask(mode)   Zufallsaufgabe; AlgLearn.check(task, antwort) → {ok, msg}
// Die Oberfläche steht in 39_alg_learn_ui.js.
// ═══════════════════════════════════════════════════════════════════
const AlgLearn = (function () {
  const M = (typeof AlgMore !== 'undefined') ? AlgMore : require('./35_alg_more.js');
  if (typeof require !== 'undefined' && typeof AlgMore === 'undefined') { try { require('./36_alg_root.js'); require('./37_alg_eq.js'); require('./37b_alg_sys.js'); } catch (e) { /* im Browser schon geladen */ } }

  // ── Idee des Bildes ────────────────────────────────────────────────
  const INTRO = {
    expand: 'Ein Produkt ist eine Fläche: Jede Klammer ist eine Seite des Rechtecks, die Teilrechtecke sind die Teilprodukte.',
    factor: 'Faktorisieren heisst: aus der Fläche wieder ein Rechteck legen. Die Seitenlängen sind die Faktoren.',
    complete: 'Fehlt dem Quadrat nur noch ein kleines Eckquadrat, dann ergänzt man genau dieses – und hat ein vollständiges Quadrat.',
    binom: 'Die Zeilen des Pascal\'schen Dreiecks sind die Koeffizienten von (a + b)ⁿ.',
    pow: 'Jede Hochzahl ist eine Reihe von Bausteinen: Multiplizieren legt Reihen aneinander, Dividieren kürzt Bausteine weg. Eine Hochzahl m/n besteht aus m Bruchbausteinen der Breite 1/n.',
    log: 'Der Logarithmus fragt nach der Hochzahl: «2 hoch wie viel ergibt 8?» Er ist die Umkehrung des Potenzierens. Unten steht der Rechenweg Schritt für Schritt.',
    frac: 'Gleiche Faktoren in Zähler und Nenner kürzt man. Die Definitionsmenge sagt, wo der Nenner null würde. Unten steht der Rechenweg Schritt für Schritt.',
    eq: 'Eine Gleichung ist eine Waage: Was man auf einer Seite tut, tut man auch auf der anderen. Quadratische Gleichungen sind Nullstellen einer Parabel.',
    sys: 'Jede Gleichung mit zwei Unbekannten ist eine Gerade. Die Lösung des Systems ist der Schnittpunkt der beiden Geraden. Bei drei Gleichungen ist jede Gleichung eine Ebene im Raum: Man führt das System auf zwei Gleichungen zurück (Additions- oder Einsetzungsverfahren) oder eliminiert nach Gauss.'
  };

  // ── Beispielgalerie [Titel, Term, Erklärung, Optionen] ─────────────
  const EXAMPLES = {
    expand: [
      ['Erste binomische Formel', '(a+b)^2', 'Das Quadrat mit der Seite a + b besteht aus dem Quadrat a², dem Quadrat b² und zwei Rechtecken ab.'],
      ['Zweite binomische Formel', '(a-b)^2', 'Vom Quadrat a² werden zwei Streifen ab abgezogen. Das Eckquadrat b² wurde dabei zweimal weggenommen und kommt einmal zurück.'],
      ['Dritte binomische Formel', '(a+b)(a-b)', 'Ein Streifen wird umgelegt: Übrig bleibt a² − b², ein Rechteck mit den Seiten a + b und a − b.'],
      ['Mit Zahlen und zwei Variablen', '(3x-4y)^2', 'Die Formel bleibt dieselbe: a = 3x und b = 4y. Darum 9x² − 24xy + 16y².'],
      ['Zwei Klammern mit Kacheln', '(x+2)(x+3)', 'Jede Kachel ist eine Fläche: ein x², fünf x und sechs 1.', { tiles: true }],
      ['Mit negativen Gliedern', '(2x+1)(x-3)', 'Negative Teilflächen werden abgezogen. Rot sind die negativen Kacheln.', { tiles: true }],
      ['Der Würfel', '(a+b)^3', 'Der Würfel mit der Kante a + b besteht aus a³, b³, drei Quadern a²b und drei Quadern ab².']
    ],
    factor: [
      ['Gemeinsamer Faktor', '6x^2+9x', 'Beide Glieder enthalten 3x. Man klammert es aus: 3x(2x + 3).'],
      ['Plättchen legen (Vieta)', 'x^2+5x+6', 'Ein x², fünf x und sechs 1 werden zu einem Rechteck gelegt. Gesucht: zwei Zahlen mit Produkt 6 und Summe 5.', { tiles: true }],
      ['Mit Minuszeichen', 'x^2-x-6', 'Produkt −6 und Summe −1: die Zahlen sind −3 und 2.', { tiles: true }],
      ['Differenz von Quadraten', 'x^2-9', 'Aus x² − 9 wird (x + 3)(x − 3): Der Streifen wird umgelegt.', { tiles: true }],
      ['Binomische Formel erkennen', '4x^2-12xy+9y^2', 'Quadrat, doppeltes Produkt, Quadrat: es ist (2x − 3y)².'],
      ['Erst ausklammern', '2x^2-8', 'Zuerst den gemeinsamen Faktor 2, dann die dritte binomische Formel: 2(x + 2)(x − 2).']
    ],
    complete: [
      ['Einfaches Beispiel', 'x^2+6x+5', 'Das Quadrat x² mit zwei Rechtecken 3x lässt eine Ecke 3² = 9 offen. Man ergänzt sie und zieht sie wieder ab.'],
      ['Mit negativem Glied', 'x^2-4x+1', 'Die Hälfte von −4 ist −2; das Quadrat ergänzen: (x − 2)² − 3.'],
      ['Mit Faktor vor x²', '2x^2-8x+3', 'Zuerst die 2 ausklammern, dann ergänzen: 2(x − 2)² − 5. Der Scheitelpunkt ist S(2 | −5).']
    ],
    binom: [
      ['Fünfte Potenz', '(a+b)^5', 'Die Zeile 5 des Pascal\'schen Dreiecks: 1, 5, 10, 10, 5, 1.'],
      ['Mit Zahlen', '(2x-3)^4', 'a = 2x und b = −3: Jedes Glied hat einen Koeffizienten aus Zeile 4 mal die Potenzen von 2 und −3.'],
      ['Achte Potenz', '(a+b)^8', 'Auch für grosse Hochzahlen: Die Binomialkoeffizienten stehen in Zeile 8.']
    ],
    pow: [
      ['Produktregel', 'x^3*x^4', 'Gleiche Basis: Die Reihen werden aneinandergelegt, die Hochzahlen addieren sich.'],
      ['Quotientenregel', 'x^5/x^2', 'Gleiche Bausteine oben und unten werden gekürzt: Die Hochzahlen werden subtrahiert.'],
      ['Potenz einer Potenz', '(x^2)^3', 'Drei Reihen mit je zwei Bausteinen: Die Hochzahlen werden multipliziert.'],
      ['Potenz eines Produkts', '(a*b)^3', 'Dreimal das Paar a·b: Man erhält a³ und b³, die Hochzahl gilt für jeden Faktor.'],
      ['Potenz eines Quotienten', '(a/b)^3', 'Dreimal der Bruch a/b: oben a³, unten b³.'],
      ['Negative Hochzahl', 'a^-3', 'Eine negative Hochzahl bedeutet den Kehrwert: Die Bausteine wandern in den Nenner.'],
      ['Mit Zahlen', '2^3*2^4', 'Dieselbe Regel gilt für Zahlen: 2³ · 2⁴ = 2⁷ = 128.'],
      ['Verschiedene Basen', '4^2*2^3', 'Erst auf gleiche Basis bringen: 4 = 2², dann ist es 2⁴ · 2³ = 2⁷.'],
      ['Alles zusammen', '(a^2*b)^3/(a*b^2)', 'Zuerst Klammern auflösen, dann gleiche Basen zusammenfassen: a⁶b³ / (ab²) = a⁵b.'],
      ['Wurzel vereinfachen', 'sqrt(12)', '12 = 2² · 3: Aus dem Quadrat 2² kann man 2 vor die Wurzel ziehen. Es bleibt 2√3.'],
      ['Wurzel als Potenz', 'x^(3/2)', 'Die Hochzahl 3/2 sind drei halbe Bausteine: ein ganzer Baustein x und ein halber, also x·√x.'],
      ['Wurzeln multiplizieren', 'sqrt(x)*sqrt(x)', 'Zwei halbe Bausteine ergeben einen ganzen: √x · √x = x.'],
      ['Dritte Wurzel', 'root(3,54)', '54 = 2 · 3³: Aus der dritten Potenz 3³ wird 3, es bleibt 3·∛2.'],
      ['Nenner rational machen', '1/sqrt(2)', 'Man erweitert mit √2: 1/√2 = √2/2. Der Nenner enthält keine Wurzel mehr.'],
      ['Rationale Hochzahl', '8^(2/3)', '8 = 2³, also ist 8^(2/3) = 2² = 4. Die Hochzahl 2/3 bedeutet «dritte Wurzel, dann quadrieren».'],
      ['Wurzeln addieren', 'sqrt(12)+sqrt(27)', 'Erst vereinfachen: 2√3 + 3√3. Gleichartige Wurzeln zählt man zusammen: 5√3.'],
      ['Wurzeln subtrahieren', 'sqrt(18)-sqrt(2)', '√18 = 3√2; dann 3√2 − √2 = 2√2.'],
      ['Gemischte Hochzahlen', 'root(3,x^2)*root(3,x)', 'Zwei Drittel und ein Drittel ergeben einen ganzen Baustein: ∛(x²) · ∛x = x.']
    ],
    log: [
      ['Logarithmus ablesen', 'log_2(8)', '«2 hoch wie viel ergibt 8?» Es ist 2³ = 8, also ist log₂ 8 = 3.'],
      ['Zehnerlogarithmus', 'log(1000)', '10³ = 1000, also ist log₁₀ 1000 = 3.'],
      ['Natürlicher Logarithmus', 'ln(e^3)', 'ln ist der Logarithmus zur Basis e. Weil e³ gerade «e hoch 3» ist, gilt ln e³ = 3. Ausserdem ist ln e = 1 und ln 1 = 0.'],
      ['ln und e zusammenfassen', 'ln(e^2)+ln(e^3)', 'Die Hochzahlen von e addieren sich: ln e² + ln e³ = ln e⁵ = 5.'],
      ['Zwischen zwei ganzen Zahlen', 'log_2(5)', '5 liegt zwischen 2² = 4 und 2³ = 8: Der Logarithmus liegt zwischen 2 und 3 (≈ 2,32).'],
      ['Argument zerlegen', 'log_2(x^3*y/z)', 'Produkt wird Summe, Quotient wird Differenz, Hochzahl wird Faktor: 3·log₂x + log₂y − log₂z.'],
      ['Zusammenfassen', '3*log_2(x)-log_2(y)+2', 'Umgekehrt: Faktoren in die Hochzahl, Summe zu Produkt, Differenz zu Quotient.'],
      ['Exponentialgleichung', '2^x=20', 'Man wendet den Logarithmus an: x = log₂ 20 ≈ 4,32.'],
      ['Logarithmusgleichung', 'log_2(x+1)=3', 'Logarithmus als Hochzahl: x + 1 = 2³ = 8, also x = 7.']
    ],
    frac: [
      ['Zahlenbruch kürzen', '12/18', '12 = 2·2·3 und 18 = 2·3·3: Die gemeinsamen Faktoren 2 und 3 werden gekürzt, es bleibt 2/3.'],
      ['Binomische Formel kürzen', '(x^2-4)/(x+2)', 'Zähler in Faktoren: (x + 2)(x − 2). Der Faktor x + 2 kürzt sich. Achtung: x ≠ −2.'],
      ['Ausklammern und kürzen', '(x^2-1)/(x^2-x)', 'Zähler (x + 1)(x − 1), Nenner x(x − 1): Es bleibt (x + 1)/x.'],
      ['Brüche multiplizieren', '(x+1)/(x-2)*(x-2)/(x+3)', 'Zähler mal Zähler, Nenner mal Nenner – dann kürzen: (x + 1)/(x + 3).'],
      ['Zahlenbrüche addieren', '1/2+1/3', 'Hauptnenner 6: 3/6 + 2/6 = 5/6.'],
      ['Bruchterme addieren', '1/x+1/(x+1)', 'Hauptnenner x(x + 1); die Zähler werden entsprechend erweitert.'],
      ['Mit Kürzen am Schluss', 'x/(x^2-1)-1/(x+1)', 'Hauptnenner (x + 1)(x − 1); nach dem Zusammenfassen kürzt sich ein Faktor.'],
      ['Mit zwei Variablen', '(a^2-b^2)/(a+b)', 'Dritte binomische Formel im Zähler: Es bleibt a − b.']
    ],
    eq: [
      ['Waage: x auf beiden Seiten', '3x+2=x+8', 'Auf beiden Seiten dasselbe wegnehmen: erst ein x, dann zwei Einer, dann halbieren. Es bleibt x = 3.'],
      ['Mit Klammer', '2(x-1)=3x+4', 'Zuerst die Klammer auflösen, dann wie eine Waage umformen: x = −6.'],
      ['Mit Brüchen', '(x+1)/2=x/3-1', 'Brüche und Klammern werden zusammengefasst; die Lösung ist x = −9. Die Probe bestätigt es.'],
      ['Quadratische Gleichung', 'x^2-5x+6=0', 'Die Lösungen sind die Nullstellen der Parabel: x = 2 und x = 3.'],
      ['Mit Wurzel in der Lösung', 'x^2+2x-1=0', 'Die Diskriminante ist 8: Die Lösungen sind −1 ± √2.'],
      ['Dritter Grad', 'x^3-6x^2+11x-6=0', 'Eine Lösung erraten, dann Polynomdivision: x = 1, 2, 3.'],
      ['Bruchgleichung', '1/x+1/(x+1)=1', 'Zuerst die Definitionsmenge (x ≠ 0, −1), dann alles auf einen Bruch und den Zähler null setzen.'],
      ['Scheinlösung beim Kürzen', '(x^2-1)/(x-1)=2', 'Es sieht aus wie x = 1 – doch 1 liegt nicht in der Definitionsmenge: keine Lösung.'],
      ['Wurzelgleichung', 'sqrt(x+2)=x', 'Quadrieren ist keine Äquivalenzumformung: Die Probe entlarvt x = −1 als Scheinlösung (im Graphen der offene Punkt).'],
      ['Exponentialgleichung', '2^x=20', 'Im Graphen schneidet die Kurve y = 2ˣ die Gerade y = 20 bei x ≈ 4,32. Rechnerisch ist das x = log₂ 20.']
    ],
    sys: [
      ['Additionsverfahren', '2x+3y=7;x-y=1', 'Man multipliziert so, dass eine Unbekannte in beiden Gleichungen entgegengesetzte Koeffizienten hat. Beim Addieren fällt sie weg. Die Geraden schneiden sich in (2 | 1).'],
      ['Gleiche Koeffizienten', '3x+2y=12;3x-2y=0', 'Hier sind die y-Koeffizienten schon Gegenzahlen: Addieren genügt. Schnittpunkt (2 | 3).'],
      ['Einsetzungsverfahren', 'x+2y=5;3x-y=1', 'Die erste Gleichung nach x auflösen, in die zweite einsetzen, die Gleichung mit einer Unbekannten lösen. Schnittpunkt (1 | 2).', { method: 'sub' }],
      ['Gleichsetzungsverfahren', 'y=2x-1;y=-x+5', 'Beide Gleichungen sind schon nach y aufgelöst: Man setzt die rechten Seiten gleich. Schnittpunkt (2 | 3).', { method: 'eq' }],
      ['Mit Brüchen', 'x/2+y/3=1;x-y=2', 'Zuerst die Brüche beseitigen (mit dem Hauptnenner multiplizieren), dann wie gewohnt. Schnittpunkt (2 | 0).'],
      ['Keine Lösung (parallel)', 'x+y=2;2x+2y=5', 'Die Geraden haben dieselbe Steigung, aber verschiedene Achsenabschnitte: Sie sind parallel und schneiden sich nie.'],
      ['Unendlich viele Lösungen', 'x+y=2;2x+2y=4', 'Die zweite Gleichung ist das Doppelte der ersten: Beide beschreiben dieselbe Gerade.'],
      ['Drei Gleichungen (Additionsverfahren)', 'x+y+z=6;2x-y+z=3;x+2y-z=2', 'Zwei Gleichungspaare so addieren, dass dieselbe Unbekannte wegfällt. Es bleibt ein System mit zwei Gleichungen. Schnittpunkt der drei Ebenen: (1 | 2 | 3).'],
      ['Drei Gleichungen (Einsetzungsverfahren)', 'x+y+z=6;2x-y+z=3;x+2y-z=2', 'Eine Gleichung nach x auflösen und in die beiden anderen einsetzen. Es bleibt ein System mit zwei Gleichungen, das man wie gewohnt löst.', { method: 'sub' }],
      ['Drei Gleichungen (Gauss)', 'x+y+z=6;2x-y+z=3;x+2y-z=2', 'Erst x aus den unteren Gleichungen eliminieren, dann y aus der letzten. Von unten nach oben auflösen: z = 3, y = 2, x = 1.', { method: 'gauss' }],
      ['Drei Gleichungen, mehr Rechenarbeit', '2x+y-z=1;x-2y+3z=6;3x+y+z=8', 'Das Gauss-Verfahren funktioniert immer gleich: eliminieren, bis eine Dreiecksform entsteht.', { method: 'gauss' }],
      ['Schnittgerade (unendlich viele Lösungen)', 'x+y+z=3;x-y=1;2x+z=4', 'Die dritte Gleichung folgt aus den ersten beiden: Die drei Ebenen haben eine ganze Gerade gemeinsam.'],
      ['Keine Lösung (Prisma)', 'x+y+z=1;x-y=0;2x+z=2', 'Je zwei Ebenen schneiden sich in einer Geraden, aber die drei Geraden sind parallel: Es gibt keinen gemeinsamen Punkt.']
    ]
  };

  // ── Merkblatt [Name, LaTeX, Beispiel (Term) oder null] ─────────────
  const LAWS = {
    sys: [
      ['Additionsverfahren', 'k\\cdot(\\mathrm{I})+m\\cdot(\\mathrm{II})', '2x+3y=7;x-y=1'],
      ['Einsetzungsverfahren', 'x=p+qy,\\quad a(p+qy)+by=c', 'x+2y=5;3x-y=1'],
      ['Gleichsetzungsverfahren', 'y=f(x),\\; y=g(x)\\;\\Rightarrow\\; f(x)=g(x)', 'y=2x-1;y=-x+5'],
      ['Drei Gleichungen auf zwei zurückführen', '(\\mathrm{I}),(\\mathrm{II}),(\\mathrm{III})\\;\\Rightarrow\\;(\\mathrm{IV}),(\\mathrm{V})', 'x+y+z=6;2x-y+z=3;x+2y-z=2'],
      ['Lösungsmenge bei drei Gleichungen', '\\mathbb{L}=\\{P\\},\\;g,\\;E,\\;\\{\\,\\}', 'x+y+z=3;x-y=1;2x+z=4'],
      ['Gauss-Verfahren', 'x+y+z=6,\\; y-2z=-4,\\; -z=-3', 'x+y+z=6;2x-y+z=3;x+2y-z=2'],
      ['Parallele Geraden', '0=c\\;(c\\neq 0)\\;\\Rightarrow\\;\\mathbb{L}=\\{\\,\\}', 'x+y=2;2x+2y=5'],
      ['Gleiche Geraden', '0=0\\;\\Rightarrow\\; t\\in\\mathbb{R}', 'x+y=2;2x+2y=4']
    ],
    expand: [
      ['Distributivgesetz', 'a(b+c)=ab+ac', '2(x+3)'],
      ['Erste binomische Formel', '(a+b)^{2}=a^{2}+2ab+b^{2}', '(a+b)^2'],
      ['Zweite binomische Formel', '(a-b)^{2}=a^{2}-2ab+b^{2}', '(a-b)^2'],
      ['Dritte binomische Formel', '(a+b)(a-b)=a^{2}-b^{2}', '(a+b)(a-b)'],
      ['Zwei Klammern', '(a+b)(c+d)=ac+ad+bc+bd', '(x+2)(x+3)']
    ],
    factor: [
      ['Ausklammern', 'ab+ac=a(b+c)', '6x^2+9x'],
      ['Satz von Vieta', 'x^{2}+px+q=(x+u)(x+v),\\quad u+v=p,\\; u\\cdot v=q', 'x^2+5x+6'],
      ['Differenz von Quadraten', 'a^{2}-b^{2}=(a+b)(a-b)', 'x^2-9'],
      ['Binomische Formeln rückwärts', 'a^{2}\\pm 2ab+b^{2}=(a\\pm b)^{2}', 'x^2+6x+9']
    ],
    complete: [
      ['Quadratische Ergänzung', 'x^{2}+px=\\left(x+\\frac{p}{2}\\right)^{2}-\\left(\\frac{p}{2}\\right)^{2}', 'x^2+6x+5'],
      ['Scheitelform', 'a(x-u)^{2}+v\\;\\Rightarrow\\; S(u\\,|\\,v)', '2x^2-8x+3']
    ],
    binom: [
      ['Binomischer Lehrsatz', '(a+b)^{n}=\\sum_{k=0}^{n}\\binom{n}{k}a^{n-k}b^{k}', '(a+b)^5'],
      ['Pascal\'sches Dreieck', '\\binom{n}{k}=\\binom{n-1}{k-1}+\\binom{n-1}{k}', '(a+b)^6']
    ],
    pow: [
      ['Produktregel', 'a^{m}\\cdot a^{n}=a^{m+n}', 'x^3*x^4'],
      ['Quotientenregel', '\\frac{a^{m}}{a^{n}}=a^{m-n}', 'x^5/x^2'],
      ['Potenz einer Potenz', '\\left(a^{m}\\right)^{n}=a^{m\\cdot n}', '(x^2)^3'],
      ['Potenz eines Produkts', '(a\\cdot b)^{n}=a^{n}\\cdot b^{n}', '(a*b)^3'],
      ['Potenz eines Quotienten', '\\left(\\frac{a}{b}\\right)^{n}=\\frac{a^{n}}{b^{n}}', '(a/b)^3'],
      ['Negative Hochzahl', 'a^{-n}=\\frac{1}{a^{n}}', 'a^-3'],
      ['Hochzahl null', 'a^{0}=1\\quad(a\\neq 0)', 'x^3/x^3'],
      ['Wurzel als Potenz', '\\sqrt[n]{a}=a^{\\frac{1}{n}}', 'sqrt(x)*sqrt(x)'],
      ['Rationale Hochzahl', 'a^{\\frac{m}{n}}=\\sqrt[n]{a^{m}}', '8^(2/3)'],
      ['Produkt von Wurzeln', '\\sqrt{a}\\cdot\\sqrt{b}=\\sqrt{a\\cdot b}', 'sqrt(2)*sqrt(8)'],
      ['Quotient von Wurzeln', '\\frac{\\sqrt{a}}{\\sqrt{b}}=\\sqrt{\\frac{a}{b}}', 'sqrt(x^3)/sqrt(x)'],
      ['Wurzel vereinfachen', '\\sqrt{k^{2}\\cdot a}=k\\sqrt{a}', 'sqrt(12)'],
      ['Nenner rational machen', '\\frac{1}{\\sqrt{a}}=\\frac{\\sqrt{a}}{a}', '1/sqrt(2)'],
      ['Gleichartige Wurzeln addieren', 'p\\sqrt{a}+r\\sqrt{a}=(p+r)\\sqrt{a}', 'sqrt(12)+sqrt(27)']
    ],
    log: [
      ['Definition', '\\log_{b}a=x\\;\\Leftrightarrow\\; b^{x}=a', 'log_2(8)'],
      ['Produktregel', '\\log_{b}(u\\cdot v)=\\log_{b}u+\\log_{b}v', 'log_2(x*y)'],
      ['Quotientenregel', '\\log_{b}\\frac{u}{v}=\\log_{b}u-\\log_{b}v', 'log_2(x/y)'],
      ['Potenzregel', '\\log_{b}(u^{n})=n\\cdot\\log_{b}u', 'log_2(x^3)'],
      ['Basiswechsel', '\\log_{b}a=\\frac{\\log a}{\\log b}', 'log_2(5)'],
      ['Besondere Werte', '\\log_{b}1=0,\\quad \\log_{b}b=1,\\quad b^{\\log_{b}a}=a', 'log_2(1)']
    ],
    frac: [
      ['Kürzen', '\\frac{a\\cdot c}{b\\cdot c}=\\frac{a}{b}', '(x^2-4)/(x+2)'],
      ['Erweitern', '\\frac{a}{b}=\\frac{a\\cdot c}{b\\cdot c}', '1/x+1/(x+1)'],
      ['Addieren', '\\frac{a}{b}+\\frac{c}{d}=\\frac{ad+bc}{bd}', '1/x+1/(x+1)'],
      ['Multiplizieren', '\\frac{a}{b}\\cdot\\frac{c}{d}=\\frac{ac}{bd}', '(x+1)/(x-2)*(x-2)/(x+3)'],
      ['Dividieren', '\\frac{a}{b}:\\frac{c}{d}=\\frac{a}{b}\\cdot\\frac{d}{c}', '(x/(x+1))/((x^2)/(x^2-1))'],
      ['Definitionsmenge', 'B\\neq 0\\;\\Rightarrow\\;\\frac{A}{B}', '(x^2-1)/(x^2-x)']
    ],
    eq: [
      ['Äquivalenzumformung', 'T_{1}=T_{2}\\;\\Leftrightarrow\\; T_{1}+c=T_{2}+c', '3x+2=x+8'],
      ['Lösungsformel', 'ax^{2}+bx+c=0\\;\\Rightarrow\\; x_{1,2}=\\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}', 'x^2-5x+6=0'],
      ['Satz vom Nullprodukt', 'a\\cdot b=0\\;\\Rightarrow\\; a=0\\;\\lor\\; b=0', 'x^2+x=0'],
      ['Bruchgleichung', '\\frac{N(x)}{D(x)}=0\\;\\Leftrightarrow\\; N(x)=0\\;\\land\\; D(x)\\neq 0', '1/x+1/(x+1)=1'],
      ['Quadrieren (Probe nötig!)', 'A=B\\;\\Rightarrow\\; A^{2}=B^{2}', 'sqrt(x+2)=x']
    ]
  };

  // ── Rechnen mit Termen (für die Prüfung) ───────────────────────────
  function evalNum(n, v) {
    switch (n.t) {
      case 'num': return n.v[0] / n.v[1];
      case 'var': return v[n.n] === undefined ? NaN : v[n.n];
      case 'neg': return -evalNum(n.a, v);
      case 'paren': return evalNum(n.a, v);
      case 'add': return n.a.reduce((s, x) => s + evalNum(x, v), 0);
      case 'mul': return n.a.reduce((s, x) => s * evalNum(x, v), 1);
      case 'div': { const d = evalNum(n.b, v); return d === 0 ? NaN : evalNum(n.a, v) / d; }
      case 'pow': { const b = evalNum(n.a, v), e = evalNum(n.e, v); if (b < 0 && !Number.isInteger(e)) return NaN; return Math.pow(b, e); }
      case 'call': { const a = evalNum(n.a, v); if (!(a > 0)) return NaN; if (n.fn === 'ln') return Math.log(a); return Math.log(a) / Math.log(n.base || 10); }
    }
    return NaN;
  }
  const walk = (n, f) => { if (!n) return; f(n); if (Array.isArray(n.a)) n.a.forEach(x => walk(x, f)); else if (n.a) walk(n.a, f); if (n.b) walk(n.b, f); if (n.e) walk(n.e, f); if (n.l) walk(n.l, f); if (n.r) walk(n.r, f); };
  const varsOf = n => { const s = new Set(); walk(n, x => { if (x.t === 'var') s.add(x.n); }); return [...s]; };
  function equivalent(a, b, rnd) {
    rnd = rnd || Math.random;
    const vs = [...new Set(varsOf(a).concat(varsOf(b)))];
    let good = 0;
    for (let i = 0; i < 8 && good < 4; i++) {
      const v = {}; vs.forEach(k => { v[k] = 0.6 + Math.round(rnd() * 28) / 10 + 0.013 * i; });
      const x = evalNum(a, v), y = evalNum(b, v);
      if (!isFinite(x) || !isFinite(y)) continue;
      if (Math.abs(x - y) > 1e-7 * Math.max(1, Math.abs(x), Math.abs(y))) return false;
      good++;
    }
    return good >= 1;
  }
  const hasParen = n => { let r = false; walk(n, x => { if (x.t === 'paren') r = true; }); return r; };
  const callCount = n => { let c = 0; walk(n, x => { if (x.t === 'call') c++; }); return c; };
  const atomicCalls = n => { let ok = true; walk(n, x => { if (x.t === 'call') { const a = M.strip(x.a); if (a.t !== 'var' && a.t !== 'num') ok = false; } }); return ok; };
  const hasSquareParen = n => { let r = false; walk(n, x => { if (x.t === 'pow' && !x.sqrt && x.a.t === 'paren' && x.e.t === 'num' && x.e.v[0] === 2 && x.e.v[1] === 1) r = true; }); return r; };

  // ── Texte für Rückmeldungen ────────────────────────────────────────
  const MSG = {
    ok: 'Richtig!',
    unreadable: 'Das kann ich nicht lesen: ',
    notEquiv: 'Das ist nicht gleichwertig zur Aufgabe – rechne noch einmal nach.',
    notExpanded: 'Gleichwertig, aber noch nicht ausmultipliziert (es dürfen keine Klammern mehr stehen).',
    notFactored: 'Gleichwertig, aber noch kein Produkt – faktorisiere weiter.',
    notComplete: 'Gleichwertig, aber ohne vollständiges Quadrat (x + …)² – ergänze quadratisch.',
    notSimple: 'Gleichwertig, aber noch nicht ganz vereinfacht.',
    notCancelled: 'Gleichwertig, aber der Bruch lässt sich noch kürzen.',
    notOne: 'Gleichwertig, aber schreibe es als einen einzigen Bruch.',
    notAtomic: 'Gleichwertig, aber im Logarithmus steht noch ein Produkt, ein Quotient oder eine Potenz.',
    notSingle: 'Gleichwertig, aber fasse alles zu einem einzigen Logarithmus zusammen.',
    notNormal: 'Gleichwertig, aber nicht in der Normalform: Zahl vor die Wurzel, Wurzeln zusammenfassen, Nenner ohne Wurzel.',
    setWrong: 'Das stimmt noch nicht – prüfe die Lösungen (Probe!).',
    setNone: 'Gib die Lösung(en) an, z. B. 3 oder 2; 3 oder «keine».',
    lawWrong: 'Nicht ganz – schau dir das Gesetz noch einmal an.',
    sysFormat: 'Gib alle Unbekannten an, z. B. x = 1; y = 2 (oder (1 | 2)).',
    sysWrong: 'Das stimmt noch nicht – setze in beide Gleichungen ein (Probe!).',
    empty: 'Bitte zuerst eine Antwort eingeben.'
  };

  // ── Zufall ─────────────────────────────────────────────────────────
  const mk = rnd => ({
    ri: (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1)),
    pick: arr => arr[Math.floor(rnd() * arr.length)],
    nz: (lo, hi) => { let v = 0; while (!v) v = lo + Math.floor(rnd() * (hi - lo + 1)); return v; },
    shuffle: arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  });
  const sg = n => (n < 0 ? '-' : '+') + Math.abs(n);
  const co = (n, s) => (n === 1 ? s : n === -1 ? '-' + s : n + s);
  const pstr = (a, b, c, v) => { v = v || 'x'; let s = co(a, v + '^2'); if (b) s += (b < 0 ? '-' : '+') + co(Math.abs(b), v); if (c) s += sg(c); return s; };
  const lin = (a, b, v) => (a === 0 ? String(b) : co(a, v || 'x') + (b ? sg(b) : ''));

  // Aufgabentypen: je Stufe (1 leicht, 2 mittel, 3 schwer) eine Liste von Varianten → {text, …}
  const lin3 = (r, x, y, z) => { let t = ''; ['x', 'y', 'z'].forEach((v, i) => { const c = r[i]; if (!c) return; t += (t ? (c < 0 ? '-' : '+') : (c < 0 ? '-' : '')) + (Math.abs(c) === 1 ? '' : Math.abs(c)) + v; }); return t + '=' + (r[0] * x + r[1] * y + r[2] * z); };
  const qs = v => { const r = Math.round(v * 6); return (r % 6 === 0) ? String(r / 6) : (r % 3 === 0 ? ((r / 3) + '/2') : (r % 2 === 0 ? ((r / 2) + '/3') : (r + '/6'))); };
  const LEVELS = 3;
  const V = (R, lvl, lists) => { const l = lists[Math.max(1, Math.min(lvl || 1, lists.length)) - 1]; return R.pick(l)(R); };
  const sgn = R => R.pick(['+', '-']);
  const lg = b => 'log_' + b;
  const GENS = {
    expand: [[
      R => ({ text: R.ri(2, 5) + '(x' + sg(R.nz(-6, 6)) + ')' }),
      R => ({ text: '(x' + sg(R.nz(-5, 5)) + ')(x' + sg(R.nz(-5, 5)) + ')' }),
      R => ({ text: '(x' + sgn(R) + R.ri(1, 7) + ')^2' }),
      R => { const a = R.ri(2, 9); return { text: '(x+' + a + ')(x-' + a + ')' }; },
      R => ({ text: 'x(x' + sg(R.nz(-6, 6)) + ')' })
    ], [
      R => ({ text: '(' + lin(R.ri(2, 3), R.nz(-6, 6)) + ')(' + lin(R.ri(1, 3), R.nz(-6, 6)) + ')' }),
      R => ({ text: '(' + co(R.ri(2, 4), 'x') + sgn(R) + R.ri(1, 5) + ')^2' }),
      R => { const a = R.ri(2, 4), b = R.ri(1, 6); return { text: '(' + co(a, 'x') + '+' + b + ')(' + co(a, 'x') + '-' + b + ')' }; },
      R => ({ text: '(a' + sgn(R) + 'b)^2' }),
      R => ({ text: '(x' + sg(R.nz(-4, 4)) + ')(x^2' + sg(R.nz(-3, 3)) + 'x' + sg(R.nz(-4, 4)) + ')' }),
      R => ({ text: R.ri(2, 4) + '(x' + sg(R.nz(-3, 3)) + ')(x' + sg(R.nz(-3, 3)) + ')' })
    ], [
      R => ({ text: '(' + co(R.ri(2, 4), 'x') + sgn(R) + co(R.ri(2, 5), 'y') + ')^2' }),
      R => ({ text: '(x' + sgn(R) + R.ri(1, 3) + ')^3' }),
      R => ({ text: '(x' + sg(R.nz(-3, 3)) + ')(x' + sg(R.nz(-3, 3)) + ')(x' + sg(R.nz(-3, 3)) + ')' }),
      R => ({ text: '(' + lin(R.ri(2, 3), R.nz(-3, 3)) + ')(x^2' + sg(R.nz(-3, 3)) + 'x' + sg(R.nz(-5, 5)) + ')' }),
      R => ({ text: '(x^2+' + R.ri(2, 5) + ')(x^2-' + R.ri(2, 5) + ')' }),
      R => ({ text: '(' + co(R.ri(2, 3), 'a') + sgn(R) + co(R.ri(2, 3), 'b') + ')(' + co(R.ri(2, 3), 'a') + sgn(R) + co(R.ri(1, 3), 'b') + ')' })
    ]],
    factor: [[
      R => { const m = R.ri(2, 6); return { text: m + 'x+' + m * R.ri(2, 6) }; },
      R => ({ text: 'x^2+' + R.ri(2, 9) + 'x' }),
      R => ({ text: 'x^2-' + Math.pow(R.ri(2, 10), 2) }),
      R => { const u = R.ri(1, 6), v = R.ri(1, 6); return { text: pstr(1, u + v, u * v) }; },
      R => { const m = R.ri(2, 5), b = R.ri(1, 5); return { text: m * b + 'x^2+' + m + 'x' }; }
    ], [
      R => { let u = R.nz(-7, 7), v = R.nz(-7, 7); while (u === v || u + v === 0) v = R.nz(-7, 7); return { text: pstr(1, u + v, u * v) }; },
      R => { const a = R.ri(2, 7); return { text: pstr(1, R.pick([2, -2]) * a, a * a) }; },
      R => ({ text: co(Math.pow(R.ri(2, 4), 2), 'x^2') + '-' + Math.pow(R.ri(2, 7), 2) }),
      R => { const m = R.ri(2, 4), a = R.ri(2, 5), b = R.ri(2, 5); return { text: co(m * a, 'x^2') + sg(R.pick([-1, 1]) * m * b) + 'x' }; },
      R => { const u = R.ri(1, 5), v = R.ri(1, 5); return { text: pstr(1, -(u + v), u * v) }; }
    ], [
      R => { const m = R.ri(2, 4); let u = R.nz(-5, 5), v = R.nz(-5, 5); while (u === v || u + v === 0) v = R.nz(-5, 5); return { text: pstr(m, m * (u + v), m * u * v) }; },
      R => { const m = R.ri(2, 5), b = R.ri(2, 6); return { text: co(m, 'x^2') + '-' + m * b * b }; },
      R => { const a = R.ri(2, 3), b = R.ri(2, 4); return { text: co(a * a, 'x^2') + sgn(R) + (2 * a * b) + 'xy+' + b * b + 'y^2' }; },
      R => { const p = R.ri(2, 3), u = R.nz(-4, 4), q = R.ri(1, 2), v = R.nz(-4, 4); return { text: pstr(p * q, p * v + q * u, u * v) }; },
      R => { const a = R.ri(2, 5), b = R.ri(2, 5); return { text: co(a * a, 'x^2') + '-' + co(b * b, 'y^2') }; }
    ]],
    complete: [[
      R => ({ text: pstr(1, 2 * R.ri(1, 3), R.nz(-8, 8)) }),
      R => ({ text: pstr(1, 2 * R.ri(1, 4), R.ri(1, 9)) }),
      R => ({ text: pstr(1, 4 * R.ri(1, 2), R.nz(-6, 6)) })
    ], [
      R => ({ text: pstr(1, 2 * R.nz(-5, 5), R.nz(-9, 9)) }),
      R => ({ text: pstr(1, 2 * R.nz(-6, 6), R.nz(-12, 12)) }),
      R => ({ text: pstr(1, -2 * R.ri(1, 6), R.ri(1, 8)) })
    ], [
      R => ({ text: pstr(R.ri(2, 3), 2 * R.ri(2, 3) * R.nz(-2, 2), R.nz(-8, 8)) }),
      R => ({ text: pstr(R.ri(2, 4), 4 * R.nz(-3, 3), R.nz(-9, 9)) }),
      R => ({ text: pstr(R.pick([2, 3]), -6 * R.ri(1, 2), R.nz(-7, 7)) })
    ]],
    binom: [[
      R => ({ text: '(a+b)^' + R.ri(3, 4) }),
      R => ({ text: '(x+' + R.ri(1, 3) + ')^3' }),
      R => ({ text: '(a-b)^3' })
    ], [
      R => ({ text: '(x+' + R.ri(1, 3) + ')^4' }),
      R => ({ text: '(' + R.ri(2, 3) + 'x' + sgn(R) + '1)^3' }),
      R => ({ text: '(a+b)^5' }),
      R => ({ text: '(x-' + R.ri(1, 3) + ')^4' })
    ], [
      R => ({ text: '(' + R.ri(2, 3) + 'x-' + R.ri(2, 3) + ')^4' }),
      R => ({ text: '(' + R.ri(2, 3) + 'a' + sgn(R) + R.ri(2, 3) + 'b)^3' }),
      R => ({ text: '(a-' + R.ri(2, 3) + 'b)^5' }),
      R => ({ text: '(x+' + R.ri(1, 2) + ')^6' })
    ]],
    pow: [[
      R => ({ text: 'x^' + R.ri(2, 6) + '*x^' + R.ri(2, 6) }),
      R => { const b = R.ri(2, 4); return { text: 'x^' + (R.ri(2, 4) + b) + '/x^' + b }; },
      R => ({ text: '(x^' + R.ri(2, 5) + ')^' + R.ri(2, 4) }),
      R => { const b = R.pick([2, 3, 5]); return { text: b + '^' + R.ri(2, 4) + '*' + b + '^' + R.ri(2, 4) }; },
      R => ({ text: '(a*b)^' + R.ri(2, 4) }),
      R => ({ text: '(a/b)^' + R.ri(2, 4) })
    ], [
      R => ({ text: '(x^' + R.ri(2, 4) + '*y^' + R.ri(1, 3) + ')^' + R.ri(2, 3) }),
      R => ({ text: '(a^' + R.ri(2, 5) + '*b^' + R.ri(1, 4) + ')/(a^' + R.ri(1, 4) + '*b^' + R.ri(1, 4) + ')' }),
      R => { const v = R.pick(['x', 'a', 'z']); return { text: v + '^-' + R.ri(2, 5) + '*' + v + '^' + R.ri(2, 6) }; },
      R => { const b = R.pick([2, 3, 5]); return { text: b + '^' + R.ri(2, 4) + '/' + b + '^' + R.ri(5, 7) }; },
      R => ({ text: '4^' + R.ri(2, 3) + '*2^' + R.ri(2, 4) }),
      R => ({ text: '1/x^' + R.ri(2, 5) + '*x^' + R.ri(1, 3) }),
      R => { const a = R.ri(2, 4); return { text: 'x^' + a + '/x^' + (a + R.ri(1, 3)) }; },
      R => ({ text: '(x^-' + R.ri(1, 3) + ')^' + R.ri(2, 3) })
    ], [
      R => { const n = R.pick([2, 3, 5, 6, 7]), kk = R.ri(2, 6); return { text: 'sqrt(' + kk * kk * n + ')' }; },
      R => { const a = R.pick([2, 3, 5]), m = R.ri(2, 5); return { text: 'sqrt(' + a + ')*sqrt(' + a * m * m + ')' }; },
      R => ({ text: 'x^(' + R.ri(3, 9) + '/2)' }),
      R => { const n = R.pick([2, 3, 5]); return { text: R.ri(2, 6) + '*sqrt(' + n + ')+' + R.ri(2, 6) + '*sqrt(' + n + ')' }; },
      R => ({ text: R.pick(['1', '2', '3']) + '/sqrt(' + R.pick([2, 3, 5, 7]) + ')' }),
      R => { const c = R.ri(2, 4); return { text: 'root(3,' + c * c * c * R.pick([2, 3, 4]) + ')' }; },
      R => { const n = R.pick([2, 3, 5]); return R.pick([{ text: 'sqrt(' + n * 4 + ')+sqrt(' + n * 9 + ')' }, { text: 'sqrt(' + n * 16 + ')-sqrt(' + n + ')' }, { text: 'sqrt(' + n * 25 + ')-2*sqrt(' + n + ')' }]); },
      R => R.pick([{ text: '8^(2/3)' }, { text: '27^(1/3)' }, { text: '16^(3/4)' }, { text: '9^(3/2)' }, { text: '4^(-1/2)' }, { text: '125^(2/3)' }, { text: '32^(2/5)' }, { text: '8^(-2/3)' }]),
      R => R.pick([{ text: 'x^(1/2)*x^(1/3)' }, { text: 'sqrt(x)*x' }, { text: 'root(3,x^2)*root(3,x)' }, { text: 'x^(3/2)/x^(1/2)' }, { text: 'sqrt(x^3)/sqrt(x)' }]),
      R => R.pick([{ text: 'sqrt(18)-sqrt(2)' }, { text: 'sqrt(50)-sqrt(18)' }, { text: 'sqrt(8)*sqrt(2)' }, { text: 'sqrt(12)*sqrt(3)' }, { text: 'sqrt(27)/sqrt(3)' }])
    ]],
    log: [[
      R => { const b = R.pick([2, 3, 5, 10]), e = R.ri(2, 4); return { text: lg(b) + '(' + Math.pow(b, e) + ')', kind: 'num', expect: e }; },
      R => { const b = R.pick([2, 3, 4, 5]); return { text: 'log_' + b + '(' + b + ')', kind: 'num', expect: 1 }; },
      R => { const b = R.pick([2, 3, 5, 10]); return { text: lg(b) + '(1)', kind: 'num', expect: 0 }; },
      R => { const b = R.pick([2, 3]), e = R.ri(1, 3); return { text: 'log_' + b + '(1/' + Math.pow(b, e) + ')', kind: 'num', expect: -e }; },
      R => { const e = R.ri(2, 5); return { text: 'ln(e^' + e + ')', kind: 'num', expect: e }; },
      R => R.pick([{ text: 'ln(e)', kind: 'num', expect: 1 }, { text: 'ln(1)', kind: 'num', expect: 0 }]),
      R => { const e = R.ri(1, 3); return { text: 'ln(1/e^' + e + ')', kind: 'num', expect: -e }; }
    ], [
      R => ({ text: lg(R.pick([2, 3, 10])) + '(x*y)', logKind: 'expand' }),
      R => ({ text: lg(R.pick([2, 3, 10])) + '(x^' + R.ri(2, 4) + '*y)', logKind: 'expand' }),
      R => { const b = R.pick([2, 3]); return { text: 'log_' + b + '(x)+log_' + b + '(y)', logKind: 'condense' }; },
      R => { const b = R.pick([2, 3]); return { text: R.ri(2, 4) + '*log_' + b + '(x)', logKind: 'condense' }; },
      R => { const b = R.pick([2, 3]), e1 = R.ri(2, 4), e2 = R.ri(1, 3); return { text: 'log_' + b + '(' + Math.pow(b, e1) + ')+log_' + b + '(' + Math.pow(b, e2) + ')', kind: 'num', expect: e1 + e2 }; },
      R => { const b = R.pick([2, 3]), e1 = R.ri(3, 5), e2 = R.ri(1, 2); return { text: 'log_' + b + '(' + Math.pow(b, e1) + ')-log_' + b + '(' + Math.pow(b, e2) + ')', kind: 'num', expect: e1 - e2 }; },
      R => { const b = R.pick([2, 3]), e = R.ri(2, 3), a = R.ri(2, 3); return { text: a + '*log_' + b + '(' + Math.pow(b, e) + ')', kind: 'num', expect: a * e }; },
      R => { const e1 = R.ri(2, 4), e2 = R.ri(1, 3); return { text: 'ln(e^' + e1 + ')+ln(e^' + e2 + ')', kind: 'num', expect: e1 + e2 }; },
      R => { const e1 = R.ri(3, 5), e2 = R.ri(1, 2); return { text: 'ln(e^' + e1 + ')-ln(e^' + e2 + ')', kind: 'num', expect: e1 - e2 }; },
      R => { const a = R.ri(2, 4), e = R.ri(2, 3); return { text: a + '*ln(e^' + e + ')', kind: 'num', expect: a * e }; },
      R => ({ text: R.pick(['ln(x*y)', 'ln(x^2*y)', 'ln(x^3*y)', 'ln(x*y^2)']), logKind: 'expand' }),
      R => ({ text: R.pick(['ln(x)+ln(y)', '2*ln(x)', '3*ln(x)', 'ln(x)+ln(z)']), logKind: 'condense' })
    ], [
      R => ({ text: lg(R.pick([2, 3, 10])) + '(x^' + R.ri(2, 3) + '*y/z^' + R.ri(2, 3) + ')', logKind: 'expand' }),
      R => { const b = R.pick([2, 3]); return { text: R.ri(2, 4) + '*log_' + b + '(x)-log_' + b + '(y)+log_' + b + '(z)', logKind: 'condense' }; },
      R => { const b = R.pick([2, 3, 5]); return { text: 'log_' + b + '(x+' + R.ri(1, 5) + ')=' + R.ri(2, 3), kind: 'solve' }; },
      R => ({ text: R.pick(['ln(x^2*y/z)', 'ln(x*y^2/z^3)', 'ln(x^3/y^2)']), logKind: 'expand' }),
      R => ({ text: R.pick(['2*ln(x)+ln(y)-ln(z)', '3*ln(x)-ln(y)', 'ln(x)-2*ln(y)+ln(z)']), logKind: 'condense' }),
      R => { const b = R.pick([2, 3, 5]); return { text: b + '^x=' + Math.pow(b, R.ri(2, 3)), kind: 'solve' }; },
      R => { const b = R.pick([2, 3, 5]), c = R.ri(1, 5); return { text: b + '^(x+' + c + ')=' + Math.pow(b, R.ri(2, 3) + c), kind: 'solve' }; },
      R => ({ text: R.pick(['2^x=20', '3^x=50', '5^x=100', '2^x=7', '10^x=300']), kind: 'solve' })
    ]],
    frac: [[
      R => { const g = R.pick([2, 3, 4, 5, 6]); let p = R.ri(2, 5), r = R.ri(2, 5); while (p === r) r = R.ri(2, 6); return { text: g * p + '/' + g * r }; },
      R => { const a = R.ri(2, 6); return { text: '(x^2-' + a * a + ')/(x+' + a + ')' }; },
      R => { const m = R.ri(2, 5), b = R.ri(2, 5); return { text: '(' + m + 'x+' + m * b + ')/' + m }; },
      R => ({ text: '(x^2+' + R.ri(2, 6) + 'x)/x' }),
      R => { const a = R.ri(2, 6); return { text: '(x+' + a + ')/(x^2-' + a * a + ')' }; }
    ], [
      R => { const a = R.ri(1, 5), b = R.ri(1, 5); return { text: '(x^2+' + (a + b) + 'x+' + a * b + ')/(x+' + a + ')' }; },
      R => { const a = R.ri(2, 5); return { text: '(x^2-' + a + 'x)/(x^2-' + a * a + ')' }; },
      R => { const a = R.ri(2, 5); return { text: '(x^2-' + 2 * a + 'x+' + a * a + ')/(x-' + a + ')' }; },
      R => { const a = R.ri(1, 4), b = R.ri(1, 4), c = R.ri(1, 4); return { text: '(x+' + a + ')/(x-' + b + ')*(x-' + b + ')/(x+' + (c === a ? c + 1 : c) + ')' }; },
      R => ({ text: R.pick(['1/2+1/3', '1/2+1/4', '2/3+1/6', '3/4-1/6', '1/3+1/5', '5/6-1/4']) }),
      R => ({ text: '(a^2-b^2)/(a' + sgn(R) + 'b)' })
    ], [
      R => ({ text: '1/x+1/(x+' + R.ri(1, 4) + ')' }),
      R => { const a = R.ri(1, 4); return { text: 'x/(x+' + a + ')-1/(x+' + a + ')' }; },
      R => { const a = R.ri(2, 4); return { text: '1/(x-' + a + ')+1/(x+' + a + ')' }; },
      R => { const a = R.ri(2, 4); return { text: '(x^2-' + a * a + ')/(x^2+' + 2 * a + 'x+' + a * a + ')' }; },
      R => { const a = R.ri(1, 3); return { text: 'x/(x^2-' + a * a + ')-1/(x+' + a + ')' }; },
      R => ({ text: R.pick(['3/4+5/6', '2/3-3/8', '5/6+7/9', '3/5-1/4+1/2']) }),
      R => { const a = R.ri(2, 4); return { text: '2/(x-' + a + ')+3/(x+' + a + ')' }; },
      R => ({ text: R.pick(['(x/(x+1))/((x^2)/(x^2-1))', '((x+2)/x)/((x^2-4)/x^2)']) })
    ]],
    sys: [[
      R => { const x = R.nz(-6, 6), y = R.nz(-6, 6); return { text: 'x+y=' + (x + y) + ';x-y=' + (x - y) }; },
      R => { const x = R.nz(-6, 6), y = R.nz(-6, 6), a = R.ri(2, 4); return { text: a + 'x+y=' + (a * x + y) + ';' + a + 'x-y=' + (a * x - y) }; },
      R => { const x = R.nz(-6, 6), y = R.nz(-6, 6), a = R.ri(2, 4); return { text: 'x+' + a + 'y=' + (x + a * y) + ';x-' + a + 'y=' + (x - a * y) }; },
      R => { const x = R.nz(-6, 6), y = R.nz(-6, 6), a = R.ri(2, 5); return { text: 'y=' + a + 'x' + sg(y - a * x) + ';y=-x' + sg(y + x) }; }
    ], [
      R => { const x = R.nz(-6, 6), y = R.nz(-6, 6), a = R.ri(2, 5), b = R.ri(2, 5); let c = R.ri(2, 5); if (c === a) c++; return { text: a + 'x+' + b + 'y=' + (a * x + b * y) + ';x-' + c + 'y=' + (x - c * y) }; },
      R => { const x = R.nz(-5, 5), y = R.nz(-5, 5), a = R.ri(2, 4), b = R.ri(2, 4), c = R.ri(1, 3), d = R.ri(2, 5); if (a * d + b * c === 0 || a * d === b * c) return { text: 'x+y=' + (x + y) + ';x-y=' + (x - y) }; return { text: a + 'x-' + b + 'y=' + (a * x - b * y) + ';' + co(c, 'x') + '+' + d + 'y=' + (c * x + d * y) }; },
      R => { const x = R.nz(-6, 6), y = R.nz(-6, 6), a = R.ri(2, 4), b = R.ri(2, 4); return { text: a + 'x+' + b + 'y=' + (a * x + b * y) + ';' + (a + 1) + 'x+' + b + 'y=' + ((a + 1) * x + b * y) }; },
      R => { const x = R.nz(-6, 6), y = R.nz(-6, 6), a = R.ri(2, 5); return { text: 'x=' + a + 'y' + sg(x - a * y) + ';' + (a + 1) + 'x-y=' + ((a + 1) * x - y) }; }
    ], [
      R => { let x = R.nz(-4, 4), y = R.nz(-4, 4), z = R.nz(-4, 4); const t = [[1, 1, 1], [2, -1, 1], [1, 2, -1]]; return { text: t.map(r => lin3(r, x, y, z)).join(';') }; },
      R => { let x = R.nz(-4, 4), y = R.nz(-4, 4), z = R.nz(-4, 4); const t = [[2, 1, -1], [1, -2, 3], [3, 1, 1]]; return { text: t.map(r => lin3(r, x, y, z)).join(';') }; },
      R => { let x = R.nz(-4, 4), y = R.nz(-4, 4), z = R.nz(-4, 4); const t = [[1, -1, 1], [2, 1, 1], [1, 1, -2]]; return { text: t.map(r => lin3(r, x, y, z)).join(';') }; },
      R => { const x = R.nz(-6, 6), y = R.nz(-6, 6); const a = 2 * R.ri(1, 3), b = 3 * R.ri(1, 3); return { text: 'x/2+y/3=' + qs(x / 2 + y / 3) + ';x-y=' + (x - y) }; },
      R => { let x = R.nz(-4, 4), y = R.nz(-4, 4), z = R.nz(-4, 4); const t = [[3, 2, -1], [1, -1, 2], [2, 3, 1]]; return { text: t.map(r => lin3(r, x, y, z)).join(';') }; }
    ]],
    eq: [[
      R => { const s2 = R.nz(-8, 8), a = R.ri(2, 6), c = R.ri(1, a - 1), b = R.nz(-9, 9); return { text: lin(a, b) + '=' + lin(c, a * s2 + b - c * s2) }; },
      R => { const s2 = R.nz(-9, 9), a = R.ri(2, 6), b = R.nz(-9, 9); return { text: lin(a, b) + '=' + (a * s2 + b) }; },
      R => { const s2 = R.nz(-9, 9), b = R.nz(-9, 9); return { text: 'x' + sg(b) + '=' + (s2 + b) }; },
      R => { const s2 = R.ri(2, 9), a = R.ri(2, 5); return { text: a + 'x=' + a * s2 }; }
    ], [
      R => { const s2 = R.nz(-6, 6), m = R.nz(-4, 4), a = R.ri(2, 4), n = R.ri(1, a + 3); return { text: a + '(x' + sg(m) + ')=' + lin(n, a * (s2 + m) - n * s2) }; },
      R => { const u = R.nz(-6, 6), v = R.nz(-6, 6); return { text: pstr(1, -(u + v), u * v) + '=0' }; },
      R => ({ text: 'x^2=' + Math.pow(R.ri(2, 9), 2) }),
      R => ({ text: 'x^2-' + R.ri(2, 6) + 'x=0' }),
      R => { const a = R.ri(2, 4), b = R.ri(2, 5); let a2 = a; if (a2 === b) a2 = a + 1; return { text: 'x/' + a2 + '+x/' + b + '=' + R.ri(1, 6) * (a2 + b) }; },
      R => ({ text: '(x+1)/' + R.ri(2, 5) + '=' + R.ri(1, 6) })
    ], [
      R => { const a = R.ri(1, 4), c = R.ri(1, 4); return { text: '1/(x+' + a + ')=' + R.ri(1, 3) + '/(x+' + (a + c) + ')' }; },
      R => { const s2 = R.ri(2, 7); return { text: 'sqrt(x+' + (s2 * s2 - s2) + ')=x' }; },
      R => ({ text: pstr(1, 2 * R.nz(-4, 4), -R.ri(1, 6)) + '=0' }),
      R => { const u = R.nz(-4, 4), v = R.nz(-4, 4), w = R.nz(-4, 4); return { text: '(x' + sg(-u) + ')(x' + sg(-v) + ')(x' + sg(-w) + ')=0' }; },
      R => ({ text: '1/x+1/(x+' + R.ri(1, 3) + ')=1' }),
      R => { const s2 = R.ri(3, 6); return { text: 'sqrt(2x+' + (s2 * s2 - 2 * s2) + ')=x' }; },
      R => R.pick([{ text: '(x^2-1)/(x-1)=2' }, { text: 'x^4-5x^2+4=0' }, { text: 'x^3=8' }, { text: 'x+3/x=4' }, { text: 'x^2-2x+1=0' }]),
      R => ({ text: pstr(R.ri(2, 3), R.nz(-6, 6), R.nz(-5, -1)) + '=0' })
    ]]
  };

  // Weitere Varianten, damit sich Aufgaben nur selten wiederholen (je Thema und Stufe angehängt)
  const VV = R => R.pick(['x', 'y', 'a', 'b', 'z', 't']);
  const VW = R => { const p = R.pick([['x', 'y'], ['a', 'b'], ['u', 'v'], ['x', 'z'], ['p', 'q'], ['m', 'n']]); return R.pick([p, [p[1], p[0]]]); };
  const MORE = {
    expand: [[
      R => { const v = VV(R); return { text: R.ri(2, 9) + '(' + v + sg(R.nz(-9, 9)) + ')' }; },
      R => { const v = VV(R); return { text: '-' + R.ri(2, 6) + '(' + v + sg(R.nz(-9, 9)) + ')' }; },
      R => { const v = VV(R); return { text: '(' + v + sg(R.nz(-9, 9)) + ')(' + v + sg(R.nz(-9, 9)) + ')' }; },
      R => { const v = VV(R); return { text: '(' + v + sgn(R) + R.ri(1, 10) + ')^2' }; },
      R => { const v = VV(R), k = R.ri(2, 12); return { text: '(' + v + '-' + k + ')(' + v + '+' + k + ')' }; },
      R => { const [v, w] = VW(R); return { text: v + '(' + v + sgn(R) + w + ')' }; }
    ], [
      R => { const [v, w] = VW(R); return { text: '(' + co(R.ri(2, 5), v) + sgn(R) + co(R.ri(1, 4), w) + ')(' + co(R.ri(1, 4), v) + sgn(R) + co(R.ri(2, 5), w) + ')' }; },
      R => { const [v, w] = VW(R); return { text: '(' + co(R.ri(2, 5), v) + sgn(R) + co(R.ri(1, 5), w) + ')^2' }; },
      R => { const v = VV(R), a = R.ri(2, 6), b = R.ri(1, 9); return { text: '(' + co(a, v) + '-' + b + ')(' + co(a, v) + '+' + b + ')' }; },
      R => { const v = VV(R); return { text: co(R.nz(-5, 5), v) + '(' + v + '^2' + sg(R.nz(-6, 6)) + v + sg(R.nz(-9, 9)) + ')' }; },
      R => { const v = VV(R); return { text: '(' + v + sg(R.nz(-6, 6)) + ')^2-(' + v + sg(R.nz(-6, 6)) + ')^2' }; }
    ], [
      R => { const v = VV(R); return { text: '(' + co(R.ri(2, 3), v) + sgn(R) + R.ri(1, 4) + ')^3' }; },
      R => { const [v, w] = VW(R); return { text: '(' + v + sgn(R) + w + ')^3' }; },
      R => { const [v, w] = VW(R); return { text: '(' + v + '+' + w + sgn(R) + R.ri(1, 5) + ')^2' }; },
      R => { const v = VV(R), k = R.ri(2, 6); return { text: '(' + v + '^2+' + k + ')(' + v + '+' + R.ri(1, 4) + ')(' + v + '-' + R.ri(1, 4) + ')' }; },
      R => { const [v, w] = VW(R), a = R.ri(2, 5), b = R.ri(2, 5); return { text: '(' + co(a, v) + '+' + co(b, w) + ')^2-(' + co(a, v) + '-' + co(b, w) + ')^2' }; }
    ]],
    factor: [[
      R => { const m = R.ri(2, 9); return { text: m + 'x' + sg(m * R.nz(-9, 9)) }; },
      R => { const v = VV(R); return { text: v + '^2' + sg(R.nz(-12, 12)) + v }; },
      R => { const v = VV(R); return { text: v + '^2-' + Math.pow(R.ri(2, 12), 2) }; },
      R => { const u = R.ri(1, 9), w = R.ri(1, 9); return { text: pstr(1, u + w, u * w) }; },
      R => { const m = R.ri(2, 9), a = R.ri(1, 6), b = R.ri(1, 6); const [v, w] = VW(R); return { text: co(m * a, v) + '+' + co(m * b, w) }; }
    ], [
      R => { let u = R.nz(-9, 9), w = R.nz(-9, 9); while (u === w || u + w === 0) w = R.nz(-9, 9); return { text: pstr(1, u + w, u * w) }; },
      R => { const a = R.ri(2, 11); return { text: pstr(1, R.pick([2, -2]) * a, a * a) }; },
      R => { const [v, w] = VW(R); return { text: co(Math.pow(R.ri(2, 6), 2), v + '^2') + '-' + co(Math.pow(R.ri(1, 6), 2), w + '^2') }; },
      R => { const m = R.ri(2, 6), v = VV(R); return { text: co(m, v + '^3') + sg(R.pick([-1, 1]) * m * R.ri(2, 6)) + v + '^2' }; }
    ], [
      R => { const m = R.pick([2, 3, 5]); let u = R.nz(-6, 6), w = R.nz(-6, 6); while (u === w || u + w === 0) w = R.nz(-6, 6); return { text: pstr(-m, -m * (u + w), -m * u * w) }; },
      R => { const v = VV(R), m = R.ri(2, 5), b = R.ri(2, 7); return { text: co(m, v + '^3') + '-' + m * b * b + v }; },
      R => { const v = VV(R); let u = R.ri(1, 4), w = R.ri(1, 4); if (u === w) w++; return { text: v + '^4-' + (u * u + w * w) + v + '^2+' + u * u * w * w }; },
      R => { const p = R.ri(2, 4), u = R.nz(-5, 5), q = R.ri(2, 3), w = R.nz(-5, 5); return { text: pstr(p * q, p * w + q * u, u * w) }; }
    ]],
    complete: [[
      R => ({ text: pstr(1, 2 * R.ri(1, 7), R.nz(-12, 12)) }),
      R => ({ text: pstr(1, -2 * R.ri(1, 7), R.nz(-12, 12)) })
    ], [
      R => ({ text: pstr(1, 2 * R.nz(-9, 9), R.nz(-20, 20)) }),
      R => ({ text: pstr(1, R.pick([1, 3, 5, 7, -1, -3, -5]), R.nz(-6, 6)) })
    ], [
      R => ({ text: pstr(R.pick([2, 3, 4, 5]), 2 * R.pick([2, 3, 4, 5]) * R.nz(-3, 3), R.nz(-12, 12)) }),
      R => ({ text: pstr(-R.pick([1, 2, 3]), 2 * R.pick([1, 2, 3]) * R.nz(-4, 4), R.nz(-9, 9)) })
    ]],
    binom: [[
      R => ({ text: '(' + VV(R) + sgn(R) + R.ri(1, 5) + ')^3' }),
      R => { const [v, w] = VW(R); return { text: '(' + v + sgn(R) + w + ')^' + R.ri(3, 4) }; },
      R => ({ text: '(' + R.ri(1, 4) + sgn(R) + VV(R) + ')^3' })
    ], [
      R => ({ text: '(' + VV(R) + sgn(R) + R.ri(1, 4) + ')^4' }),
      R => ({ text: '(' + co(R.ri(2, 5), VV(R)) + sgn(R) + R.ri(1, 3) + ')^3' }),
      R => { const [v, w] = VW(R); return { text: '(' + v + sgn(R) + w + ')^' + R.ri(5, 6) }; },
      R => ({ text: '(' + VV(R) + '^2' + sgn(R) + R.ri(1, 3) + ')^3' })
    ], [
      R => ({ text: '(' + co(R.ri(2, 3), VV(R)) + sgn(R) + R.ri(1, 3) + ')^' + R.ri(4, 5) }),
      R => { const [v, w] = VW(R); return { text: '(' + co(R.ri(2, 3), v) + sgn(R) + co(R.ri(2, 4), w) + ')^' + R.ri(3, 4) }; },
      R => ({ text: '(' + VV(R) + sgn(R) + R.ri(1, 2) + ')^' + R.ri(6, 7) }),
      R => ({ text: '(' + VV(R) + '^2' + sgn(R) + R.ri(1, 3) + ')^4' })
    ]],
    pow: [[
      R => { const v = VV(R); return { text: v + '^' + R.ri(2, 9) + '*' + v + '^' + R.ri(2, 9) }; },
      R => { const v = VV(R), b = R.ri(2, 6); return { text: v + '^' + (R.ri(1, 6) + b) + '/' + v + '^' + b }; },
      R => ({ text: '(' + VV(R) + '^' + R.ri(2, 6) + ')^' + R.ri(2, 5) }),
      R => { const v = VV(R); return { text: R.ri(2, 6) + v + '^' + R.ri(2, 5) + '*' + R.ri(2, 6) + v + '^' + R.ri(2, 5) }; },
      R => { const v = VV(R), c = R.ri(2, 4), b = R.ri(2, 4); return { text: '(' + c + v + '^' + b + ')^' + R.ri(2, 3) }; },
      R => { const v = VV(R), b = R.ri(1, 4), m = R.ri(2, 5); return { text: m * R.ri(2, 4) + v + '^' + (b + R.ri(1, 5)) + '/(' + m + v + '^' + b + ')' }; }
    ], [
      R => { const [v, w] = VW(R); return { text: '(' + v + '^' + R.ri(2, 5) + '*' + w + '^' + R.ri(1, 4) + ')^' + R.ri(2, 4) }; },
      R => { const [v, w] = VW(R); return { text: '(' + v + '^' + R.ri(3, 7) + '*' + w + '^' + R.ri(2, 6) + ')/(' + v + '^' + R.ri(1, 3) + '*' + w + '^' + R.ri(1, 3) + ')' }; },
      R => { const v = VV(R); return { text: v + '^-' + R.ri(2, 7) + '*' + v + '^' + R.ri(2, 9) }; },
      R => { const v = VV(R); return { text: '(' + v + '^' + R.ri(2, 4) + ')^-' + R.ri(1, 3) }; },
      R => { const b = R.pick([2, 3, 5, 10]); return { text: b + '^' + R.ri(3, 9) + '/' + b + '^' + R.ri(1, 6) }; }
    ], [
      R => { const n = R.pick([2, 3, 5, 6, 7, 10, 11]), kk = R.ri(2, 9); return { text: 'sqrt(' + kk * kk * n + ')' }; },
      R => { const n = R.pick([2, 3, 5, 6, 7]), p = R.ri(2, 5), q = R.ri(2, 5); return { text: 'sqrt(' + p * p * n + ')' + sgn(R) + 'sqrt(' + q * q * n + ')' }; },
      R => { const c = R.ri(2, 5), n = R.pick([2, 3, 4, 5]); return { text: 'root(3,' + c * c * c * n + ')' }; },
      R => { const b = R.pick([[4, 2], [9, 2], [16, 2], [25, 2], [8, 3], [27, 3], [64, 3], [16, 4], [81, 4], [32, 5]]), m = R.pick([1, 2, 3, -1]); return { text: b[0] + '^(' + m + '/' + b[1] + ')' }; },
      R => { const v = VV(R), p = R.ri(1, 4), q = R.pick([2, 3, 4]); return { text: v + '^(' + p + '/' + q + ')*' + v + '^(' + R.ri(1, 4) + '/' + q + ')' }; },
      R => ({ text: R.ri(1, 6) + '/sqrt(' + R.pick([2, 3, 5, 6, 7, 10]) + ')' })
    ]],
    log: [[
      R => { const b = R.pick([2, 3, 4, 5, 6, 7, 10]), e = R.ri(1, b <= 3 ? 6 : b <= 7 ? 4 : 5); return { text: lg(b) + '(' + Math.pow(b, e) + ')', kind: 'num', expect: e }; },
      R => { const b = R.pick([2, 3, 4, 5, 10]), e = R.ri(1, 3); return { text: lg(b) + '(1/' + Math.pow(b, e) + ')', kind: 'num', expect: -e }; },
      R => { const e = R.ri(-4, 9); return { text: 'ln(e^' + (e < 0 ? '(' + e + ')' : e) + ')', kind: 'num', expect: e }; },
      R => { const p = R.pick([[4, 8, 3 / 2], [4, 2, 1 / 2], [9, 3, 1 / 2], [9, 27, 3 / 2], [8, 2, 1 / 3], [8, 4, 2 / 3], [16, 4, 1 / 2], [16, 8, 3 / 4], [25, 5, 1 / 2], [27, 3, 1 / 3], [27, 9, 2 / 3], [100, 10, 1 / 2]]); return { text: lg(p[0]) + '(' + p[1] + ')', kind: 'num', expect: p[2] }; }
    ], [
      R => { const [v, w] = VW(R), b = R.pick([2, 3, 5, 10]); return { text: lg(b) + '(' + v + '^' + R.ri(2, 5) + '*' + w + ')', logKind: 'expand' }; },
      R => { const [v, w] = VW(R), b = R.pick([2, 3, 5, 10]); return { text: lg(b) + '(' + v + '/' + w + '^' + R.ri(2, 4) + ')', logKind: 'expand' }; },
      R => { const [v, w] = VW(R); return { text: 'ln(' + v + '^' + R.ri(2, 5) + '/' + w + ')', logKind: 'expand' }; },
      R => { const [v, w] = VW(R), b = R.pick([2, 3, 5, 10]); return { text: lg(b) + '(' + v + ')' + sgn(R) + lg(b) + '(' + w + ')', logKind: 'condense' }; },
      R => { const [v, w] = VW(R), b = R.pick([2, 3, 5, 10]); return { text: R.ri(2, 5) + '*' + lg(b) + '(' + v + ')+' + lg(b) + '(' + w + ')', logKind: 'condense' }; },
      R => { const [v, w] = VW(R); return { text: R.ri(2, 4) + '*ln(' + v + ')-ln(' + w + ')', logKind: 'condense' }; },
      R => { const b = R.pick([2, 3, 5]), e1 = R.ri(2, 5), e2 = R.ri(1, 4), a = R.ri(2, 4); return { text: a + '*' + lg(b) + '(' + Math.pow(b, e1) + ')-' + lg(b) + '(' + Math.pow(b, e2) + ')', kind: 'num', expect: a * e1 - e2 }; }
    ], [
      R => { const b = R.pick([2, 3, 5]), a = R.ri(1, 3), c = R.nz(-6, 9), k = R.ri(1, 3); return { text: lg(b) + '(' + lin(a, c) + ')=' + k, kind: 'solve' }; },
      R => { const b = R.pick([2, 3, 5]), k = R.ri(2, 4), m = R.ri(2, 5); return { text: m + '*' + b + '^x=' + m * Math.pow(b, k), kind: 'solve' }; },
      R => { const b = R.pick([2, 3]), k = R.ri(1, 3); return { text: b + '^(2x' + sg(R.nz(-3, 3)) + ')=' + Math.pow(b, 2 * k + 1), kind: 'solve' }; },
      R => ({ text: R.pick(['2', '3', '5', '10', '1.5', '1.08']) + '^x=' + R.pick(['10', '30', '40', '75', '200', '1000']), kind: 'solve' }),
      R => { const [v, w] = VW(R), b = R.pick([2, 3, 10]); return { text: lg(b) + '(' + v + '^' + R.ri(2, 4) + '/(' + w + '^' + R.ri(2, 3) + '*z))', logKind: 'expand' }; },
      R => { const [v, w] = VW(R); return { text: R.ri(2, 4) + '*ln(' + v + ')+' + R.ri(2, 3) + '*ln(' + w + ')-ln(z)', logKind: 'condense' }; }
    ]],
    frac: [[
      R => { const g = R.ri(2, 12); let p = R.ri(1, 9), r = R.ri(2, 9); while (p === r || Math.abs(p % r) === 0 && p > r) r = R.ri(2, 9); return { text: g * p + '/' + g * r }; },
      R => { const v = VV(R), m = R.ri(2, 9), b = R.nz(-9, 9); return { text: '(' + m + v + sg(m * b) + ')/' + m }; },
      R => { const v = VV(R), a = R.ri(2, 9); return { text: '(' + v + '^2-' + a * a + ')/(' + v + sgn(R) + a + ')' }; }
    ], [
      R => { const a = R.nz(-6, 6), b = R.nz(-6, 6); return { text: '(' + pstr(1, a + b, a * b) + ')/(x' + sg(a) + ')' }; },
      R => { const b1 = R.ri(2, 9); let b2 = R.ri(2, 12); if (b1 === b2) b2++; return { text: R.ri(1, b1 - 1 || 1) + '/' + b1 + sgn(R) + R.ri(1, b2 - 1) + '/' + b2 }; },
      R => { const m = R.ri(2, 6), a = R.ri(1, 6); return { text: '(' + m + 'x^2-' + m * a * a + ')/(' + m + 'x+' + m * a + ')' }; },
      R => { const [v, w] = VW(R); return { text: '(' + v + '^2-' + w + '^2)/(' + v + '^2' + sgn(R) + '2' + v + w + '+' + w + '^2)' }; }
    ], [
      R => { let p = R.ri(1, 6), q = R.ri(1, 6); if (p === q) q++; return { text: R.ri(1, 5) + '/(x' + sgn(R) + p + ')' + sgn(R) + R.ri(1, 5) + '/(x' + sgn(R) + q + ')' }; },
      R => { const p = R.ri(1, 5); return { text: R.ri(1, 6) + '/(x^2-' + p * p + ')+' + R.ri(1, 4) + '/(x+' + p + ')' }; },
      R => { let p = R.ri(1, 5), q = R.ri(1, 5); if (p === q) q++; return { text: '(' + pstr(1, p + q, p * q) + ')/(' + pstr(1, -(p + q), p * q) + ')' }; },
      R => { const b = [R.ri(2, 6), R.ri(3, 8), R.ri(4, 12)]; return { text: R.ri(1, b[0] - 1) + '/' + b[0] + sgn(R) + R.ri(1, b[1] - 1) + '/' + b[1] + sgn(R) + R.ri(1, b[2] - 1) + '/' + b[2] }; },
      R => { const a = R.ri(1, 4); return { text: 'x/(x-' + a + ')-' + a + '/(x+' + a + ')' }; }
    ]],
    eq: [[
      R => { const s2 = R.nz(-12, 12), a = R.nz(-9, 9), b = R.nz(-15, 15); return { text: lin(a, b) + '=' + (a * s2 + b) }; },
      R => { const s2 = R.nz(-9, 9), a = R.ri(3, 9), c = R.nz(-9, 9), b = R.nz(-9, 9); if (a === c) return { text: lin(a, b) + '=' + (a * s2 + b) }; return { text: lin(a, b) + '=' + lin(c, (a - c) * s2 + b) }; }
    ], [
      R => { const u = R.nz(-9, 9), v = R.nz(-9, 9); return { text: '(x' + sg(-u) + ')(x' + sg(-v) + ')=0' }; },
      R => { const k = R.ri(2, 12), m = R.ri(2, 5); return { text: m + 'x^2=' + m * k * k }; },
      R => { const u = R.nz(-8, 8); let v = R.nz(-8, 8); return { text: pstr(1, -(u + v), u * v) + '=0' }; },
      R => { const m = R.ri(2, 5), k = R.nz(-6, 6); return { text: m + 'x^2' + sg(-m * k) + 'x=0' }; },
      R => { const s2 = R.nz(-6, 6), a = R.ri(3, 6), b = R.nz(-5, 5), c = R.ri(1, a - 1); return { text: a + '(x' + sg(b) + ')-' + c + '(x' + sg(b) + ')=' + (a - c) * (s2 + b) }; }
    ], [
      R => { let p = R.ri(1, 4), q = R.ri(1, 4); if (p === q) q = p + 1; return { text: 'x^4-' + (p * p + q * q) + 'x^2+' + p * p * q * q + '=0' }; },
      R => { let p = R.ri(1, 6), q = R.ri(1, 6); if (p === q) q++; return { text: 'x+' + p * q + '/x=' + (p + q) }; },
      R => { const k = R.ri(2, 5); return { text: 'x^3=' + k * k * k }; },
      R => { const a = R.ri(1, 4), b = R.ri(2, 5), p = R.ri(1, 4), q = R.ri(5, 9); return { text: a + '/(x+' + p + ')=' + b + '/(x+' + q + ')' }; },
      R => { const s2 = R.ri(2, 8), m = R.ri(1, 3); return { text: 'sqrt(' + m + 'x+' + (s2 * s2 - m * s2) + ')=x' }; },
      R => { let A = R.ri(1, 4), B = R.nz(-9, 9), Cc = R.nz(-9, 9); if (B * B - 4 * A * Cc < 0) Cc = -Math.abs(Cc); return { text: pstr(A, B, Cc) + '=0' }; }   // immer mit reellen Lösungen
    ]]
  };
  Object.keys(MORE).forEach(m => MORE[m].forEach((l, i) => { GENS[m][i].push(...l); }));

  // Zuletzt gestellte Aufgaben je Thema und Stufe (auch über das Neuladen hinweg): werden möglichst nicht wiederholt
  const RECENT_N = 60, RECENT_LS = 'j10.algRecent';
  let RECENT = {};
  try { if (typeof localStorage !== 'undefined') RECENT = JSON.parse(localStorage.getItem(RECENT_LS) || '{}') || {}; } catch (e) { RECENT = {}; }
  const recentHas = (k, t) => (RECENT[k] || []).indexOf(t) >= 0;
  const recentAdd = (k, t) => { const a = (RECENT[k] = (RECENT[k] || []).filter(x => x !== t)); a.push(t); if (a.length > RECENT_N) a.splice(0, a.length - RECENT_N); try { if (typeof localStorage !== 'undefined') localStorage.setItem(RECENT_LS, JSON.stringify(RECENT)); } catch (e) { /* ohne Speicher */ } };

  // Gesetze erkennen: [Gleichung in LaTeX, richtiger Name]
  const LAW_MODES = ['pow', 'log'];
  function lawItems(mode, R) {
    const v = R.pick(['x', 'a', 'z']), a = R.ri(2, 5), b = R.ri(2, 5), c = R.ri(2, 4), nn = R.pick([2, 3, 4]);
    if (mode === 'pow') return [
      ['Produktregel', v + '^{' + a + '}\\cdot ' + v + '^{' + b + '}=' + v + '^{' + (a + b) + '}'],
      ['Quotientenregel', '\\frac{' + v + '^{' + (a + b) + '}}{' + v + '^{' + b + '}}=' + v + '^{' + a + '}'],
      ['Potenz einer Potenz', '\\left(' + v + '^{' + a + '}\\right)^{' + c + '}=' + v + '^{' + a * c + '}'],
      ['Potenz eines Produkts', '(' + v + 'y)^{' + c + '}=' + v + '^{' + c + '}y^{' + c + '}'],
      ['Potenz eines Quotienten', '\\left(\\frac{' + v + '}{y}\\right)^{' + c + '}=\\frac{' + v + '^{' + c + '}}{y^{' + c + '}}'],
      ['Negative Hochzahl', v + '^{-' + a + '}=\\frac{1}{' + v + '^{' + a + '}}'],
      ['Hochzahl null', v + '^{0}=1']
    ].concat([
      ['Wurzel als Potenz', '\\sqrt[' + nn + ']{' + v + '}=' + v + '^{\\frac{1}{' + nn + '}}'],
      ['Produkt von Wurzeln', '\\sqrt{' + a + '}\\cdot\\sqrt{' + b + '}=\\sqrt{' + a * b + '}'],
      ['Quotient von Wurzeln', '\\frac{\\sqrt{' + a * b + '}}{\\sqrt{' + b + '}}=\\sqrt{' + a + '}'],
      ['Wurzel vereinfachen', '\\sqrt{' + c * c * a + '}=' + c + '\\sqrt{' + a + '}'],
      ['Nenner rational machen', '\\frac{1}{\\sqrt{' + a + '}}=\\frac{\\sqrt{' + a + '}}{' + a + '}'],
      ['Rationale Hochzahl', v + '^{\\frac{' + a + '}{' + b + '}}=\\sqrt[' + b + ']{' + v + '^{' + a + '}}']
    ]);
    const B = R.pick([2, 3, 5]);
    return [
      ['Produktregel', '\\log_{' + B + '}(' + v + 'y)=\\log_{' + B + '}' + v + '+\\log_{' + B + '}y'],
      ['Quotientenregel', '\\log_{' + B + '}\\frac{' + v + '}{y}=\\log_{' + B + '}' + v + '-\\log_{' + B + '}y'],
      ['Potenzregel', '\\log_{' + B + '}(' + v + '^{' + a + '})=' + a + '\\cdot\\log_{' + B + '}' + v],
      ['Basiswechsel', '\\log_{' + B + '}' + v + '=\\frac{\\log_{10} ' + v + '}{\\log_{10} ' + B + '}'],
      ['Besondere Werte', '\\log_{' + B + '}' + B + '=1'],
      ['Natürlicher Logarithmus', '\\ln x=\\log_{e}x,\\quad \\ln e=1,\\quad \\ln e^{k}=k', 'ln(e^3)'],
      ['Definition', '\\log_{' + B + '}' + (Math.pow(B, 2)) + '=2\\;\\Leftrightarrow\\;' + B + '^{2}=' + Math.pow(B, 2)]
    ];
  }

  // ── Antworten lesen ────────────────────────────────────────────────
  function parseSet(str) {
    let s = String(str || '').replace(/\\left|\\right|\\[,;:! ]/g, ' ').replace(/\\mathbb\{L\}|L\s*=/g, ' ').replace(/[{}]/g, ' ');
    if (/^\s*$/.test(s)) return null;
    if (/keine|∅|\\emptyset|\\varnothing|leer/i.test(s)) return [];
    s = M.normalize(s).replace(/x_?\{?\d?\}?\s*=/g, ' ').replace(/x\s*=/g, ' ').replace(/,(?=\s|$)/g, ' ');
    const parts = s.split(/[;]|\boder\b|\bund\b|\s{1,}/).map(x => x.trim()).filter(Boolean);
    const vals = [];
    for (const p of parts) {
      let v;
      try { v = evalNum(M.parse(p.replace(/,/g, '.')), {}); } catch (e) { return undefined; }
      if (!isFinite(v)) return undefined; vals.push(v);
    }
    return vals;
  }
  const sameSet = (a, b, tol) => { if (a.length !== b.length) return false; const x = a.slice().sort((p, q) => p - q), y = b.slice().sort((p, q) => p - q); return x.every((v, i) => Math.abs(v - y[i]) <= tol); };

  // ── Prüfen ─────────────────────────────────────────────────────────
  const flat = t => String(t).replace(/\\cdot|\\,|\s/g, '');
  function simplifiedRoot(ans, ast) { try { return flat(M.Root.canon(ast)) === flat(M.astTex(ast)); } catch (e) { return false; } }
  // Potenzen: einfach genug, wenn das Programm daran nichts mehr ändert
  function simplifiedPow(ans, ast) {
    const r = M.process(ans, 'pow', {}, {}); if (!r.ok) return false;
    if (r.steps.length <= 1) return true;
    const fin = String(r.caption || '').split(/ = /).pop();
    return flat(fin).replace(/[{}]/g, '') === flat(M.astTex(ast)).replace(/[{}]/g, '');
  }
  function checkExpr(task, ans, rnd) {
    if (!String(ans || '').trim()) return { ok: false, msg: MSG.empty };
    let sa; try { sa = M.parse(ans); } catch (e) { return { ok: false, msg: MSG.unreadable + (e.message || '') }; }
    const ta = M.parse(task.text);
    if (!equivalent(sa, ta, rnd)) return { ok: false, msg: MSG.notEquiv };
    const top = M.strip(sa), m = task.sub || task.mode;
    if (m === 'expand' || m === 'binom') { if (hasParen(sa)) return { ok: false, msg: MSG.notExpanded }; }
    else if (m === 'factor') { if (!(top.t === 'mul' || (top.t === 'pow' && top.a.t === 'paren') || (top.t === 'neg' && M.strip(top.a).t === 'mul'))) return { ok: false, msg: MSG.notFactored }; }
    else if (m === 'complete') { if (!hasSquareParen(sa)) return { ok: false, msg: MSG.notComplete }; }
    else if (m === 'pow') { if (!simplifiedPow(ans, sa)) return { ok: false, msg: MSG.notSimple }; }
    else if (m === 'root') { if (!simplifiedRoot(ans, sa)) return { ok: false, msg: MSG.notNormal }; }
    else if (m === 'frac') {
      let hasDiv = false; walk(sa, x => { if (x.t === 'div') hasDiv = true; });
      if (top.t === 'add' && hasDiv) return { ok: false, msg: MSG.notOne };
      const r = M.process(ans, 'frac', {}, {});
      if (r.ok && r.steps.some(s => s.label === 'Gemeinsame Faktoren kürzen')) return { ok: false, msg: MSG.notCancelled };
    } else if (m === 'log') {
      if (task.logKind === 'expand' && !atomicCalls(sa)) return { ok: false, msg: MSG.notAtomic };
      if (task.logKind === 'condense' && callCount(sa) !== 1) return { ok: false, msg: MSG.notSingle };
    }
    return { ok: true, msg: MSG.ok };
  }
  function checkSet(task, ans) {
    const v = parseSet(ans);
    if (v === null) return { ok: false, msg: MSG.empty };
    if (v === undefined) return { ok: false, msg: MSG.setNone };
    const tol = task.tol || 1e-6;
    if (task.allReal) return { ok: false, msg: MSG.setWrong };
    return sameSet(v, task.expect, tol) ? { ok: true, msg: MSG.ok } : { ok: false, msg: MSG.setWrong };
  }
  // Antwort auf ein Gleichungssystem: «x=2; y=1», «(2|1)», «x=2, y=1» (auch Reihenfolge vertauscht, wenn beschriftet)
  function parseSysAnswer(str, names) {
    let s0 = String(str || '').replace(/\\left|\\right/g, '').replace(/\\mathbb\{L\}|L\s*=/g, ' ').replace(/\\[,;:! ]/g, ' ').replace(/\\[{}]/g, ' ');
    s0 = M.normalize(s0).replace(/[{}()\[\]]/g, ' ').replace(/\|/g, ';');
    if (/^\s*$/.test(s0)) return null;
    const tryParse = txt => {
      const parts = txt.split(/[;,\n]|\s{2,}/).map(x => x.trim()).filter(Boolean);
      const lab = {}; let nl = 0; const plain = [];
      for (const p of parts) {
        const m = /^([A-Za-z])\s*=\s*(.+)$/.exec(p);
        let v; try { v = evalNum(M.parse((m ? m[2] : p).replace(/,/g, '.')), {}); } catch (e) { return undefined; }
        if (!isFinite(v)) return undefined;
        if (m) { lab[m[1]] = v; nl++; } else plain.push(v);
      }
      if (nl === names.length && names.every(n => n in lab)) return names.map(n => lab[n]);
      if (nl === 0 && plain.length === names.length) return plain;
      return undefined;
    };
    let r = tryParse(s0);
    if (r === undefined) r = tryParse(s0.replace(/(\d),(\d)/g, '$1.$2'));
    return r;
  }
  function checkSys(task, ans) {
    const v = parseSysAnswer(ans, task.names);
    if (v === null) return { ok: false, msg: MSG.empty };
    if (v === undefined) return { ok: false, msg: MSG.sysFormat };
    return v.every((x, i) => Math.abs(x - task.expect[i]) <= (task.tol || 1e-6)) ? { ok: true, msg: MSG.ok } : { ok: false, msg: MSG.sysWrong };
  }
  function check(task, ans, rnd) {
    if (!task) return { ok: false, msg: MSG.empty };
    if (task.kind === 'law') return ans === task.expect ? { ok: true, msg: MSG.ok } : { ok: false, msg: MSG.lawWrong };
    if (task.kind === 'set') return checkSet(task, ans);
    if (task.kind === 'sys') return checkSys(task, ans);
    if (task.kind === 'num') { const v = parseSet(ans); if (v === null) return { ok: false, msg: MSG.empty }; if (v === undefined || v.length !== 1) return { ok: false, msg: MSG.setNone }; return Math.abs(v[0] - task.expect) < 1e-6 ? { ok: true, msg: MSG.ok } : { ok: false, msg: MSG.notEquiv }; }
    return checkExpr(task, ans, rnd);
  }

  // ── Aufgabe ziehen ─────────────────────────────────────────────────
  const PROMPT = {
    expand: 'Multipliziere aus:', factor: 'Faktorisiere:', complete: 'Schreibe mit vollständigem Quadrat:', binom: 'Multipliziere aus:',
    pow: 'Vereinfache:', log: 'Rechne:', frac: 'Vereinfache und kürze:', eq: 'Löse die Gleichung:', sys: 'Löse das Gleichungssystem:'
  };
  const isRat = v => Math.abs(v * 12 - Math.round(v * 12)) < 1e-9;
  function newTask(mode, rnd, kind, level) {
    rnd = rnd || Math.random; const R = mk(rnd);
    level = Math.max(1, Math.min(LEVELS, level || 1));
    if (kind === 'law' && LAW_MODES.indexOf(mode) >= 0) {
      const items = lawItems(mode, R), lk = 'law' + mode; let it = R.pick(items);
      for (let k = 0; k < 12 && recentHas(lk, it[0]); k++) it = R.pick(items);
      if ((RECENT[lk] || []).length >= Math.min(5, items.length - 1)) RECENT[lk].shift(); recentAdd(lk, it[0]);
      const names = [...new Set(items.map(x => x[0]))];
      const opts = R.shuffle([it[0]].concat(R.shuffle(names.filter(n => n !== it[0])).slice(0, 3)));
      return { mode, kind: 'law', title: 'Welches Gesetz wurde angewendet?', tex: it[1], options: opts, expect: it[0], solMode: mode, solText: null };
    }
    if (!GENS[mode]) return null;
    const rk = mode + level, fresh = t => { recentAdd(rk, t.text); return t; };
    for (let tries = 0; tries < 80; tries++) {
      const g = V(R, level, GENS[mode]);
      if (tries < 60 && recentHas(rk, g.text)) continue;                  // kürzlich gestellt: neu ziehen
      let task = Object.assign({ mode, kind: 'expr', title: PROMPT[mode], solMode: mode, solText: g.text, level }, g);
      if (mode === 'pow' && /sqrt|root|\^\(-?\d+\/\d+\)/.test(g.text)) task.sub = 'root';
      if (mode === 'eq') {
        const r = M.process(g.text, 'eq', {}, {});
        if (!r.ok || !r.sols) continue;
        task.kind = 'set'; task.expect = r.sols.map(x => (typeof x === 'number' ? x : x.val)).filter(x => isFinite(x));
        task.tol = task.expect.every(isRat) ? 1e-6 : 0.01; task.title = PROMPT.eq;
      } else if (mode === 'log') {
        if (g.kind === 'solve') {
          const r = M.process(g.text, 'eq', {}, {}); if (!r.ok) continue;
          const lastNum = /(?:=|\\approx)\s*(-?\d+(?:\.\d+)?)\s*$/.exec(r.caption || '');
          const val = lastNum ? parseFloat(lastNum[1]) : null; if (val === null) continue;
          task.kind = 'set'; task.expect = [val]; task.tol = 0.01; task.title = 'Löse die Gleichung:';
          task.solMode = 'log';
        } else if (g.kind === 'num') { task.title = 'Berechne:'; }
        else task.title = g.logKind === 'expand' ? 'Zerlege in einzelne Logarithmen:' : 'Fasse zu einem Logarithmus zusammen:';
      }
      if (mode === 'sys') {
        let r; try { r = M.process(g.text, 'sys', {}, {}); } catch (e) { continue; }
        if (!r.ok || !r.sols || r.sysKind !== 'unique') continue;
        task.kind = 'sys'; task.expect = r.sols; task.names = r.names; task.tol = 1e-6;
        task.title = r.names.length === 2 ? 'Löse das Gleichungssystem (Antwort z. B. x = 1; y = 2):' : 'Löse das Gleichungssystem (Antwort z. B. x = 1; y = 2; z = 3):';
        task.tex = M.fieldLatex(g.text);
        return fresh(task);
      }
      try { M.parse(g.text); task.tex = M.fieldLatex(g.text); } catch (e) { continue; }
      return fresh(task);
    }
    return null;
  }
  return { INTRO, EXAMPLES, LAWS, LAW_MODES, LEVELS, MSG, newTask, check, equivalent, evalNum, parseSet };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = AlgLearn;
