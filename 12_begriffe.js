// ═══════════════════════════════════════════════════════════════════
// MODUL: begriffe — Mathematisches Glossar für das Gymnasialniveau
// ───────────────────────────────────────────────────────────────────
// Die Begriffe sind in thematische Ordner (Gruppen) gegliedert, die sich einzeln
// aufklappen lassen. Jeder Begriff: term (Titel), symbol (Formel/Kurzschreibweise),
// def (Erklärung), example (Beispiel), tags (zusätzliche Suchwörter, nur deutsch).
// Neue Begriffe: einfach in die passende Gruppe eintragen — die Übersetzung in die
// anderen Sprachen übernimmt 23_autotranslate.js (mitgelieferte Übersetzungen in
// i18n_seed_<xx>.js, alles andere übersetzt die Engine automatisch).
// ═══════════════════════════════════════════════════════════════════

const BEGRIFFE_GRUPPEN = [
  {
    id: 'grundlagen', icon: '🧭', title: 'Funktionen & Grundbegriffe',
    items: [
      {
        term: `Funktion`,
        symbol: `f: D → W,  x ↦ f(x)`,
        def: `Eine Funktion f ordnet jedem Element x der Definitionsmenge D genau ein Element f(x) der Wertemenge W zu. Kein x-Wert darf zwei verschiedene y-Werte haben.`,
        example: `f(x) = 2x + 1  ordnet jedem x genau einen Wert zu.`,
        tags: `grundlagen funktion`
      },
      {
        term: `Definitionsmenge`,
        symbol: `D  (oder D_f)`,
        def: `Die Menge aller x-Werte, für die f(x) definiert ist (existiert). Typische Einschränkungen: Nenner ≠ 0, Radikand ≥ 0, Argument des Logarithmus > 0.`,
        example: `f(x) = 1/x  →  D = ℝ \\ {0}   (alle reellen Zahlen ausser 0)`,
        tags: `grundlagen definitionsmenge`
      },
      {
        term: `Wertemenge`,
        symbol: `W  (oder W_f)`,
        def: `Die Menge aller y-Werte, die f(x) tatsächlich annimmt: W = {f(x) | x ∈ D}. Nicht zu verwechseln mit der Zielmenge, in die f im Prinzip abbildet (z. B. ℝ).`,
        example: `f(x) = x²  →  W = [0, +∞)   (nur nicht-negative Zahlen)`,
        tags: `grundlagen wertemenge`
      },
      {
        term: `Graph`,
        symbol: `G_f = {(x | f(x)) | x ∈ D}`,
        def: `Die Menge aller Punkte (x | f(x)) in der Koordinatenebene, die zur Funktion f gehören. Der Graph veranschaulicht den Verlauf der Funktion.`,
        example: `Der Graph von f(x) = x² ist eine nach oben geöffnete Parabel.`,
        tags: `grundlagen graph`
      },
      {
        term: `Wertetabelle`,
        symbol: `x | f(x)`,
        def: `Tabelle zusammengehöriger x- und y-Werte. Sie hilft, einzelne Punkte des Graphen zu berechnen und den Verlauf einer Funktion zu skizzieren.`,
        example: `f(x) = x² − 1:  x = −2, −1, 0, 1, 2  →  f(x) = 3, 0, −1, 0, 3`,
        tags: `grundlagen tabelle wertetabelle`
      },
      {
        term: `Intervall`,
        symbol: `[a, b],  (a, b),  [a, b),  (a, ∞)`,
        def: `Zusammenhängender Zahlenbereich. Eckige Klammer: Randpunkt gehört dazu. Runde Klammer: Randpunkt gehört nicht dazu. Unendlich ist nie eingeschlossen.`,
        example: `[1, 3] = {x | 1 ≤ x ≤ 3},   (−∞, 2) = {x | x < 2}`,
        tags: `grundlagen intervall`
      },
      {
        term: `Parameter`,
        symbol: `f(x) = a·x² + b·x + c`,
        def: `Eine frei wählbare Zahl in einer Funktionsgleichung, die den Graphen verändert, ohne die Funktionsart zu ändern. Im Plotter kann man Parameter mit Schiebern verändern.`,
        example: `f(x) = a·x²:  a vergrössert, verkleinert oder spiegelt die Parabel.`,
        tags: `grundlagen parameter schieber`
      },
      {
        term: `Stückweise definierte Funktion`,
        symbol: `f(x) = { g(x) für x < a;  h(x) für x ≥ a }`,
        def: `Funktion, die in verschiedenen Teilen der Definitionsmenge durch verschiedene Terme gegeben ist. An den Übergangsstellen muss man Stetigkeit und Differenzierbarkeit gesondert prüfen.`,
        example: `f(x) = |x| = { −x für x < 0;  x für x ≥ 0 }`,
        tags: `grundlagen stückweise definiert abschnittsweise`
      },
      {
        term: `Verkettung von Funktionen`,
        symbol: `(g ∘ f)(x) = g(f(x))`,
        def: `Man setzt zuerst x in die innere Funktion f ein und das Ergebnis dann in die äussere Funktion g. Die Reihenfolge ist wichtig: im Allgemeinen gilt g(f(x)) ≠ f(g(x)).`,
        example: `f(x) = x + 1,  g(x) = x²  →  g(f(x)) = (x+1)²,  f(g(x)) = x² + 1`,
        tags: `grundlagen verkettung komposition`
      },
      {
        term: `Umkehrfunktion`,
        symbol: `f⁻¹,  f⁻¹(f(x)) = x`,
        def: `Die Umkehrfunktion f⁻¹ «dreht» die Zuordnung um: sie ordnet jedem y-Wert wieder den ursprünglichen x-Wert zu. Sie existiert, wenn f streng monoton (also umkehrbar) ist. Berechnung: x und y vertauschen und nach y auflösen. Graphisch: Spiegelung an der 1. Winkelhalbierenden y = x.`,
        example: `f(x) = 2x+1  →  f⁻¹(x) = (x−1)/2`,
        tags: `umkehrfunktion`
      },
      {
        term: `Transformation von Graphen`,
        symbol: `g(x) = a·f(b·(x − c)) + d`,
        def: `Verschiebung: c nach rechts, d nach oben. Streckung in y-Richtung mit Faktor a (a < 0: Spiegelung an der x-Achse). Streckung in x-Richtung mit Faktor 1/b (b < 0: Spiegelung an der y-Achse).`,
        example: `f(x) = x²  →  g(x) = (x − 2)² + 1:  Parabel mit Scheitelpunkt (2 | 1)`,
        tags: `grundlagen transformation verschiebung streckung spiegelung`
      },
    ]
  },
  {
    id: 'gleichungen', icon: '🟰', title: 'Gleichungen & Nullstellen',
    items: [
      {
        term: `Nullstelle`,
        symbol: `f(x₀) = 0`,
        def: `Eine Stelle x₀, an der der Funktionswert null ist. Der Graph schneidet (oder berührt) die x-Achse. Berechnung: f(x) = 0 setzen und nach x auflösen.`,
        example: `f(x) = x² − 4  →  Nullstellen bei x = ±2`,
        tags: `punkte nullstelle`
      },
      {
        term: `Vielfachheit einer Nullstelle`,
        symbol: `f(x) = (x − x₀)ⁿ · g(x)`,
        def: `Gibt an, wie oft der Linearfaktor (x − x₀) im Produkt vorkommt. Einfache NS (n=1): Graph kreuzt die x-Achse. Doppelte NS (n=2): Graph berührt die x-Achse (Wendepunkt bei der NS möglich).`,
        example: `f(x) = (x−2)²(x+1)  →  NS x=2 mit Vielfachheit 2, NS x=−1 einfach`,
        tags: `punkte nullstelle vielfachheit`
      },
      {
        term: `Satz vom Nullprodukt`,
        symbol: `a·b = 0  ⟹  a = 0  oder  b = 0`,
        def: `Ein Produkt ist genau dann null, wenn mindestens ein Faktor null ist. Damit löst man faktorisierte Gleichungen: jeden Faktor einzeln gleich null setzen.`,
        example: `(x − 1)(x + 3) = 0  →  x = 1  oder  x = −3`,
        tags: `gleichungen nullprodukt nullstelle faktor`
      },
      {
        term: `Linearfaktorzerlegung`,
        symbol: `f(x) = a·(x − x₁)(x − x₂)·…·(x − xₙ)`,
        def: `Darstellung eines Polynoms als Produkt von Linearfaktoren (x − Nullstelle). Aus ihr lassen sich Nullstellen und ihre Vielfachheit direkt ablesen.`,
        example: `x² − 5x + 6 = (x − 2)(x − 3)`,
        tags: `gleichungen linearfaktor faktorisieren nullstelle polynom`
      },
      {
        term: `Polynomdivision`,
        symbol: `(x³ − 1) : (x − 1) = x² + x + 1`,
        def: `Schriftliches Teilen von Polynomen. Hat man eine Nullstelle x₁ erraten, spaltet man mit der Division durch (x − x₁) den Linearfaktor ab und erhält ein Polynom von kleinerem Grad.`,
        example: `x³ − 6x² + 11x − 6 hat die Nullstelle x = 1  →  Division durch (x − 1) ergibt x² − 5x + 6`,
        tags: `gleichungen polynomdivision nullstelle raten`
      },
      {
        term: `Substitution`,
        symbol: `z = x²  (bei  ax⁴ + bx² + c = 0)`,
        def: `Man ersetzt einen wiederkehrenden Ausdruck durch eine neue Variable, löst die einfachere Gleichung und setzt am Schluss zurück. Typisch bei biquadratischen Gleichungen.`,
        example: `x⁴ − 5x² + 4 = 0  →  z² − 5z + 4 = 0  →  z = 1 oder z = 4  →  x = ±1 oder x = ±2`,
        tags: `gleichungen substitution biquadratisch`
      },
      {
        term: `y-Achsenabschnitt`,
        symbol: `(0 | f(0))`,
        def: `Der Schnittpunkt des Graphen mit der y-Achse. Er wird berechnet, indem x = 0 in f(x) eingesetzt wird. Existiert immer, wenn 0 ∈ D.`,
        example: `f(x) = 3x − 5  →  y-Achsenabschnitt bei (0 | −5)`,
        tags: `punkte y-achse y-achsenabschnitt`
      },
      {
        term: `Schnittpunkt`,
        symbol: `f(x) = g(x)`,
        def: `Gemeinsamer Punkt zweier Graphen. Berechnung durch Gleichsetzen: f(x) = g(x) nach x auflösen, dann y = f(x) berechnen. Schneidet der Graph die x-Achse, so ist der Schnittpunkt eine Nullstelle (g(x) = 0).`,
        example: `f(x) = x², g(x) = x + 2  →  x²−x−2=0  →  x=−1 oder x=2`,
        tags: `punkte schnittpunkt`
      },
      {
        term: `Diskriminante`,
        symbol: `D = b² − 4ac  (für ax²+bx+c=0)`,
        def: `Bestimmt die Anzahl reeller Lösungen einer quadratischen Gleichung. D > 0: zwei reelle Lösungen. D = 0: genau eine (doppelte) Lösung. D < 0: keine reelle Lösung.`,
        example: `x²−5x+6=0: D=25−24=1>0  →  zwei Lösungen: x=2 und x=3`,
        tags: `diskriminante quadratisch nullstelle`
      },
      {
        term: `Mitternachtsformel (abc-Formel)`,
        symbol: `x₁,₂ = (−b ± √D) / (2a)`,
        def: `Allgemeine Lösungsformel für quadratische Gleichungen ax²+bx+c=0. Gibt beide Lösungen auf einmal mit D=b²−4ac (Diskriminante).`,
        example: `2x²+3x−2=0: D=9+16=25, x₁=(−3+5)/4=1/2, x₂=(−3−5)/4=−2`,
        tags: `quadratisch mitternachtsformel nullstelle`
      },
      {
        term: `Vieta'scher Wurzelsatz`,
        symbol: `x₁+x₂ = −b/a,  x₁·x₂ = c/a`,
        def: `Beziehung zwischen den Nullstellen x₁, x₂ und den Koeffizienten von ax²+bx+c. Nützlich um Nullstellen zu erraten oder zu verifizieren.`,
        example: `x²−5x+6: Summe=5, Produkt=6  →  x₁=2, x₂=3 (da 2+3=5, 2·3=6)`,
        tags: `quadratisch vieta nullstelle`
      },
    ]
  },
  {
    id: 'typen', icon: '📊', title: 'Funktionstypen',
    items: [
      {
        term: `Lineare Funktion`,
        symbol: `f(x) = mx + b`,
        def: `Polynomfunktion 1. Grades. Der Graph ist eine Gerade mit Steigung m und y-Achsenabschnitt b. Konstante Steigung: f'(x) = m. Keine Extrema, kein Wendepunkt. Nullstelle bei x = −b/m (für m ≠ 0).`,
        example: `f(x) = 2x − 3  →  Steigung m=2, y-Achsenabschnitt b=−3`,
        tags: `linear funktion gerade`
      },
      {
        term: `Quadratische Funktion (Parabel)`,
        symbol: `f(x) = ax² + bx + c  (a ≠ 0)`,
        def: `Polynomfunktion 2. Grades. Der Graph ist eine Parabel. Für a > 0: nach oben offen; a < 0: nach unten offen. Der Scheitelpunkt liegt bei xₛ = −b/(2a). Eine Parabel hat keinen Wendepunkt. Scheitelpunktform: f(x) = a(x − xₛ)² + yₛ.`,
        example: `f(x) = x²−4x+3  →  S=(2|−1), Nullstellen x=1 und x=3`,
        tags: `quadratisch parabel funktion`
      },
      {
        term: `Scheitelpunkt`,
        symbol: `xₛ = −b/(2a),  yₛ = f(xₛ)`,
        def: `Der Hochpunkt oder Tiefpunkt einer Parabel. Bei f(x) = ax² + bx + c berechnet man ihn mit xₛ = −b/(2a) oder durch quadratische Ergänzung. Scheitelpunktform: f(x) = a(x − xₛ)² + yₛ.`,
        example: `f(x) = x²−4x+3  →  xₛ = 2,  yₛ = −1  →  S = (2 | −1)`,
        tags: `extrema scheitelpunkt parabel quadratisch`
      },
      {
        term: `Polynomfunktion`,
        symbol: `f(x) = aₙxⁿ + … + a₁x + a₀`,
        def: `Summe von Termen der Form aₖxᵏ mit ganzzahligen, nicht-negativen Exponenten. Der Grad n bestimmt das Verhalten für grosse |x| und die maximale Anzahl Nullstellen (höchstens n). Überall definiert und beliebig oft differenzierbar.`,
        example: `f(x) = 2x³ − x + 5  (Grad 3 = kubisch)`,
        tags: `polynom funktion`
      },
      {
        term: `Potenzfunktion`,
        symbol: `f(x) = xⁿ  (n ∈ ℤ)`,
        def: `Gerades n > 0: achsensymmetrisch, nach oben offen wie die Parabel. Ungerades n > 0: punktsymmetrisch, von links unten nach rechts oben. Negatives n: Pol bei x = 0 und hyperbelartiger Verlauf mit der x-Achse als Asymptote.`,
        example: `f(x) = x², f(x) = x³, f(x) = x⁻¹ = 1/x`,
        tags: `potenz funktion`
      },
      {
        term: `Wurzelfunktion`,
        symbol: `f(x) = √x = x^(1/2),  D = [0, ∞)`,
        def: `Umkehrfunktion von x² für x ≥ 0. Definiert nur für Radikanden ≥ 0. Der Graph ist die halbe, nach rechts offene Parabel; die Steigung bei x = 0 ist unendlich (senkrechte Tangente).`,
        example: `√9 = 3,   √(x − 2) ist definiert für x ≥ 2`,
        tags: `typen wurzel funktion`
      },
      {
        term: `Gebrochen-rationale Funktion`,
        symbol: `f(x) = p(x)/q(x)`,
        def: `Quotient zweier Polynome p(x) (Zähler) und q(x) (Nenner). Definiert für alle x mit q(x) ≠ 0. Nullstellen des Nenners ergeben Polstellen oder hebbare Definitionslücken.`,
        example: `f(x) = (x+1)/(x−2)  →  Pol bei x=2, Nullstelle bei x=−1`,
        tags: `gebrochen rational funktion`
      },
      {
        term: `Exponentialfunktion`,
        symbol: `f(x) = a · bˣ  (a > 0, b > 0, b ≠ 1)`,
        def: `Funktion, bei der die Variable im Exponenten steht. a ist der Anfangswert f(0), b der Wachstumsfaktor pro Einheit. Für b > 1: exponentielles Wachstum. Für 0 < b < 1: exponentieller Zerfall. Der Graph liegt immer oberhalb der x-Achse (keine Nullstelle), die x-Achse ist horizontale Asymptote.`,
        example: `f(x) = 2ˣ: Verdoppelung mit jeder Einheit. f(x) = eˣ: natürliche Basis e ≈ 2.718`,
        tags: `exponential funktion wachstum zerfall`
      },
      {
        term: `Wachstum und Zerfall`,
        symbol: `N(t) = N₀ · bᵗ = N₀ · e^(k·t)`,
        def: `Beim exponentiellen Wachstum (k > 0) wächst die Grösse in gleichen Zeitabständen um denselben Faktor, beim Zerfall (k < 0) nimmt sie um denselben Faktor ab. Die Änderungsrate ist proportional zum aktuellen Bestand.`,
        example: `Bakterien verdoppeln sich jede Stunde:  N(t) = N₀ · 2ᵗ`,
        tags: `typen wachstum zerfall exponential`
      },
      {
        term: `Verdopplungszeit / Halbwertszeit`,
        symbol: `T = ln(2) / ln(b)`,
        def: `Die Zeit, in der sich eine exponentiell wachsende Grösse verdoppelt bzw. eine zerfallende Grösse halbiert. Sie hängt nur von b ab, nicht vom Anfangswert.`,
        example: `Halbwertszeit 5 Jahre:  N(t) = N₀ · 0.5^(t/5)`,
        tags: `typen halbwertszeit verdopplungszeit exponential`
      },
      {
        term: `Eulersche Zahl e`,
        symbol: `e ≈ 2.71828`,
        def: `Die Basis der natürlichen Exponentialfunktion eˣ. Besonderheit: Die Funktion eˣ ist ihre eigene Ableitung. Sie ist der Grenzwert von (1 + 1/n)ⁿ für n → ∞.`,
        example: `(eˣ)' = eˣ,   e⁰ = 1,   ln(e) = 1`,
        tags: `typen euler e exponential`
      },
      {
        term: `Logarithmusfunktion`,
        symbol: `f(x) = logₐ(x),  f(x) = ln(x)`,
        def: `Umkehrfunktion der Exponentialfunktion: logₐ(x) = y bedeutet aʸ = x. ln(x) = logₑ(x). Definitionsmenge: x > 0, Wertemenge: ℝ. Die y-Achse ist vertikale Asymptote, die Nullstelle liegt bei x = 1.`,
        example: `ln(e) = 1,  ln(1) = 0,  log₁₀(100) = 2`,
        tags: `logarithmus funktion`
      },
      {
        term: `Logarithmusgesetze`,
        symbol: `ln(a·b) = ln(a) + ln(b)
ln(a/b) = ln(a) − ln(b)
ln(aⁿ) = n·ln(a)`,
        def: `Die Gesetze gelten für jede Basis. Mit ihnen löst man Exponentialgleichungen: aˣ = c  ⟹  x = ln(c) / ln(a). Basiswechsel: logₐ(x) = ln(x) / ln(a).`,
        example: `2ˣ = 10  →  x = ln(10) / ln(2) ≈ 3.32`,
        tags: `typen logarithmus gesetze exponentialgleichung`
      },
      {
        term: `Betragsfunktion`,
        symbol: `f(x) = |x|`,
        def: `Gibt den absoluten (nicht-negativen) Wert von x zurück: |x| = x für x ≥ 0, |x| = −x für x < 0. Graph: V-förmig mit Knick bei x = 0. Nicht differenzierbar bei x = 0.`,
        example: `|−3| = 3,  |5| = 5,  |0| = 0`,
        tags: `betrag funktion absolut`
      },
    ]
  },
  {
    id: 'eigenschaften', icon: '🔍', title: 'Eigenschaften von Funktionen',
    items: [
      {
        term: `Monoton steigend`,
        symbol: `x₁ < x₂  ⟹  f(x₁) ≤ f(x₂)`,
        def: `Eine Funktion ist auf einem Intervall I monoton steigend, wenn grössere x-Werte auch grössere (oder gleich grosse) Funktionswerte liefern. Bei streng monoton steigend gilt striktes <.`,
        example: `f(x) = 2x + 1  ist auf ganz ℝ streng monoton steigend.`,
        tags: `monotonie steigend`
      },
      {
        term: `Monoton fallend`,
        symbol: `x₁ < x₂  ⟹  f(x₁) ≥ f(x₂)`,
        def: `Eine Funktion ist auf einem Intervall I monoton fallend, wenn grössere x-Werte kleinere (oder gleich grosse) Funktionswerte liefern. Bei streng monoton fallend gilt striktes >.`,
        example: `f(x) = −x + 3  ist auf ganz ℝ streng monoton fallend.`,
        tags: `monotonie fallend`
      },
      {
        term: `Achsensymmetrie (gerade Funktion)`,
        symbol: `f(−x) = f(x)  für alle x`,
        def: `Der Graph ist symmetrisch zur y-Achse. Eine Funktion ist gerade, wenn f(−x) = f(x) gilt. Alle Terme haben gerade Exponenten.`,
        example: `f(x) = x², f(x) = cos(x), f(x) = |x|`,
        tags: `symmetrie achsensymmetrie gerade`
      },
      {
        term: `Punktsymmetrie (ungerade Funktion)`,
        symbol: `f(−x) = −f(x)  für alle x`,
        def: `Der Graph ist punktsymmetrisch zum Ursprung (0|0). Eine Funktion ist ungerade, wenn f(−x) = −f(x) gilt. Alle Terme haben ungerade Exponenten.`,
        example: `f(x) = x³, f(x) = sin(x), f(x) = x`,
        tags: `symmetrie punktsymmetrie ungerade`
      },
      {
        term: `Verhalten im Unendlichen`,
        symbol: `x → +∞,   x → −∞`,
        def: `Beschreibt, wie sich f(x) für sehr grosse oder sehr kleine x verhält. Bei Polynomen bestimmt der Term mit der höchsten Potenz. Bei gebrochen-rationalen Funktionen entscheidet der Vergleich der Grade von Zähler und Nenner.`,
        example: `f(x) = −2x³ + x  →  f(x) → −∞ für x → +∞,  f(x) → +∞ für x → −∞`,
        tags: `eigenschaften verhalten unendlich globalverhalten`
      },
      {
        term: `Beschränktheit`,
        symbol: `m ≤ f(x) ≤ M  für alle x ∈ D`,
        def: `Eine Funktion ist nach oben (unten) beschränkt, wenn ihre Funktionswerte eine obere (untere) Schranke M (m) nicht überschreiten (unterschreiten). Sinus und Kosinus sind durch −1 und 1 beschränkt.`,
        example: `f(x) = 1/(1 + x²) ist beschränkt:  0 < f(x) ≤ 1`,
        tags: `eigenschaften beschränkt schranke`
      },
    ]
  },
  {
    id: 'ableitung', icon: '📈', title: 'Ableitung & Tangente',
    items: [
      {
        term: `Steigung`,
        symbol: `m = Δy / Δx`,
        def: `Das Verhältnis von vertikaler Änderung (Δy) zu horizontaler Änderung (Δx) zwischen zwei Punkten. Bei linearen Funktionen ist die Steigung konstant.`,
        example: `Durch (1|3) und (4|9):  m = (9−3)/(4−1) = 6/3 = 2`,
        tags: `steigung ableitung`
      },
      {
        term: `Steigungsdreieck`,
        symbol: `Δx (Ankathete), Δy (Gegenkathete)`,
        def: `Geometrische Darstellung der Steigung am Graphen: Man wählt zwei Punkte, zieht eine waagrechte Strecke (Δx) und eine senkrechte Strecke (Δy). Die Steigung ist m = Δy/Δx.`,
        example: `Bei m = 2/3 geht man 3 nach rechts und 2 nach oben.`,
        tags: `steigung dreieck`
      },
      {
        term: `Differenzenquotient`,
        symbol: `[f(x+h) − f(x)] / h  =  Δy / Δx`,
        def: `Die mittlere (durchschnittliche) Änderungsrate von f zwischen x und x+h. Geometrisch ist er die Steigung der Sekante durch (x | f(x)) und (x+h | f(x+h)).`,
        example: `f(x)=x²:  [f(x+h)−f(x)]/h = (2xh+h²)/h = 2x+h`,
        tags: `steigung ableitung differenzenquotient sekante`
      },
      {
        term: `Sekante`,
        symbol: `Steigung = [f(x₂)−f(x₁)]/(x₂−x₁)`,
        def: `Gerade, die den Graphen in zwei Punkten schneidet. Die Steigung der Sekante entspricht dem Differenzenquotienten — der durchschnittlichen Änderungsrate.`,
        example: `f(x)=x² durch (1|1) und (3|9):  m = (9−1)/(3−1) = 4`,
        tags: `steigung sekante ableitung`
      },
      {
        term: `Ableitung (Differentialquotient)`,
        symbol: `f'(x) = lim(h→0) [f(x+h)−f(x)]/h`,
        def: `Die momentane Änderungsrate von f an der Stelle x: der Grenzwert des Differenzenquotienten für h → 0. Geometrisch ist sie die Steigung der Tangente an den Graphen in (x | f(x)). Ist f'(x) > 0, so steigt f; ist f'(x) < 0, so fällt f.`,
        example: `f(x) = x³  →  f'(x) = 3x²`,
        tags: `steigung ableitung differentialquotient`
      },
      {
        term: `Momentane Änderungsrate`,
        symbol: `f'(t) = lim(h→0) [f(t+h) − f(t)] / h`,
        def: `Anwendungsbezogene Deutung der Ableitung: Geschwindigkeit als Ableitung des Weges, Beschleunigung als Ableitung der Geschwindigkeit, Wachstumsrate als Ableitung des Bestands.`,
        example: `s(t) = 5t²  →  Geschwindigkeit v(t) = s'(t) = 10t,  v(2) = 20`,
        tags: `ableitung änderungsrate geschwindigkeit`
      },
      {
        term: `Tangente`,
        symbol: `t(x) = f'(x₀)·(x−x₀) + f(x₀)`,
        def: `Gerade, die den Graphen im Punkt (x₀ | f(x₀)) berührt. Die Steigung der Tangente ist gleich f'(x₀). Die Tangente ist die beste lineare Näherung des Graphen an dieser Stelle.`,
        example: `f(x)=x², x₀=1:  t(x) = 2(x−1)+1 = 2x−1`,
        tags: `steigung tangente ableitung`
      },
      {
        term: `Normale`,
        symbol: `n(x) = −1/f'(x₀) · (x − x₀) + f(x₀)`,
        def: `Gerade, die im Berührpunkt (x₀ | f(x₀)) senkrecht auf der Tangente steht. Ihre Steigung ist der negative Kehrwert der Tangentensteigung: m_n = −1/m_t (falls f'(x₀) ≠ 0).`,
        example: `f(x) = x², x₀ = 1:  Tangente m = 2,  Normale m = −1/2`,
        tags: `ableitung normale tangente senkrecht`
      },
      {
        term: `Steigungswinkel`,
        symbol: `tan(α) = m,   α = arctan(m)`,
        def: `Der Winkel α zwischen einer Geraden und der positiven x-Achse. Er wird aus der Steigung m berechnet. Der Schnittwinkel zweier Graphen ist der Winkel zwischen ihren Tangenten.`,
        example: `m = 1  →  α = 45°;   m = √3  →  α = 60°`,
        tags: `ableitung steigungswinkel schnittwinkel winkel`
      },
      {
        term: `Differenzierbarkeit`,
        symbol: `f'(x₀) existiert`,
        def: `Eine Funktion ist an der Stelle x₀ differenzierbar, wenn der Differentialquotient dort existiert, d. h. der Graph eine eindeutige Tangente hat. Knicke, Sprünge und senkrechte Tangenten sind nicht differenzierbar. Differenzierbar ⟹ stetig (aber nicht umgekehrt).`,
        example: `f(x) = |x| ist stetig, aber bei x = 0 nicht differenzierbar (Knick).`,
        tags: `ableitung differenzierbar knick`
      },
      {
        term: `Potenz-, Faktor- und Summenregel`,
        symbol: `(xⁿ)' = n·xⁿ⁻¹,   (c·f)' = c·f',   (f+g)' = f'+g'`,
        def: `Die Grundregeln für Polynome: Exponent nach vorne holen und um 1 verkleinern; konstante Faktoren bleiben stehen; Summen werden gliedweise abgeleitet; Konstanten fallen weg.`,
        example: `f(x) = 4x³ − 5x + 7  →  f'(x) = 12x² − 5`,
        tags: `ableitung regeln potenzregel summenregel faktorregel`
      },
      {
        term: `Produktregel`,
        symbol: `(f·g)' = f'·g + f·g'`,
        def: `Ableitung eines Produkts: «Ableitung des ersten mal zweites plus erstes mal Ableitung des zweiten».`,
        example: `f(x) = x²·eˣ  →  f'(x) = 2x·eˣ + x²·eˣ = (2x + x²)·eˣ`,
        tags: `ableitung regeln produktregel`
      },
      {
        term: `Quotientenregel`,
        symbol: `(f/g)' = (f'·g − f·g') / g²`,
        def: `Ableitung eines Quotienten, gültig für g(x) ≠ 0: «Nenner mal Ableitung des Zählers minus Zähler mal Ableitung des Nenners, durch Nenner im Quadrat».`,
        example: `f(x) = x/(x+1)  →  f'(x) = [1·(x+1) − x·1] / (x+1)² = 1/(x+1)²`,
        tags: `ableitung regeln quotientenregel`
      },
      {
        term: `Kettenregel`,
        symbol: `(f(g(x)))' = f'(g(x)) · g'(x)`,
        def: `Ableitung einer verketteten Funktion: «äussere Ableitung mal innere Ableitung». Zuerst die äussere Funktion ableiten (mit unveränderter innerer Funktion), dann mit der Ableitung der inneren Funktion multiplizieren.`,
        example: `f(x) = sin(x²)  →  f'(x) = cos(x²)·2x`,
        tags: `ableitung regeln kettenregel`
      },
      {
        term: `Ableitungen wichtiger Funktionen`,
        symbol: `(eˣ)' = eˣ,  (ln x)' = 1/x,  (sin x)' = cos x,  (cos x)' = −sin x`,
        def: `Diese Grundableitungen werden zusammen mit den Ableitungsregeln für alle weiteren Funktionen gebraucht. Weitere: (√x)' = 1/(2√x), (aˣ)' = aˣ·ln(a), (tan x)' = 1/cos²(x).`,
        example: `f(x) = 3·ln(x)  →  f'(x) = 3/x`,
        tags: `ableitung grundableitungen exponential logarithmus sinus kosinus`
      },
    ]
  },
  {
    id: 'kurvendiskussion', icon: '⛰️', title: 'Extrema, Krümmung & Kurvendiskussion',
    items: [
      {
        term: `Lokales Maximum (Hochpunkt)`,
        symbol: `f'(x₀)=0, f''(x₀)<0`,
        def: `Ein Punkt (x₀ | f(x₀)), in dem f(x₀) grösser ist als alle benachbarten Funktionswerte. Notwendige Bedingung: f'(x₀) = 0. Hinreichend: f''(x₀) < 0 (oder f' wechselt von + nach −).`,
        example: `f(x) = −x² + 4  →  Hochpunkt bei (0 | 4)`,
        tags: `extrema maximum hochpunkt`
      },
      {
        term: `Lokales Minimum (Tiefpunkt)`,
        symbol: `f'(x₀)=0, f''(x₀)>0`,
        def: `Ein Punkt (x₀ | f(x₀)), in dem f(x₀) kleiner ist als alle benachbarten Funktionswerte. Notwendige Bedingung: f'(x₀) = 0. Hinreichend: f''(x₀) > 0 (oder f' wechselt von − nach +).`,
        example: `f(x) = x² − 2x  →  Tiefpunkt bei (1 | −1)`,
        tags: `extrema minimum tiefpunkt`
      },
      {
        term: `Stationäre Stelle (kritische Stelle)`,
        symbol: `f'(x₀) = 0`,
        def: `Stelle mit waagrechter Tangente. Dort kann ein Extremum oder ein Sattelpunkt liegen. Ob wirklich ein Extremum vorliegt, entscheidet man mit der 2. Ableitung oder dem Vorzeichenwechsel von f'.`,
        example: `f(x) = x³ − 3x  →  f'(x) = 3x² − 3 = 0  →  x = ±1`,
        tags: `extrema stationär kritisch waagrechte tangente`
      },
      {
        term: `Globales Extremum und Randextremum`,
        symbol: `f(x₀) ≥ f(x)  für alle x ∈ D`,
        def: `Das globale Maximum (Minimum) ist der grösste (kleinste) Funktionswert auf der ganzen Definitionsmenge. Auf einem abgeschlossenen Intervall [a, b] muss man neben den stationären Stellen auch die Randwerte f(a) und f(b) vergleichen.`,
        example: `f(x) = x² auf [−1, 3]:  globales Minimum f(0) = 0, globales Maximum f(3) = 9 (am Rand)`,
        tags: `extrema globales maximum minimum rand intervall`
      },
      {
        term: `Wendepunkt`,
        symbol: `f''(x₀)=0, Vorzeichenwechsel von f''`,
        def: `Punkt, an dem der Graph seine Krümmungsrichtung wechselt (von konkav zu konvex oder umgekehrt). Dort hat f' ein Extremum, die Tangente (Wendetangente) durchquert den Graphen. Notwendige Bedingung: f''(x₀) = 0. Hinreichend: f'' wechselt das Vorzeichen (oder f'''(x₀) ≠ 0).`,
        example: `f(x) = x³  →  Wendepunkt bei (0 | 0)`,
        tags: `krümmung wendepunkt`
      },
      {
        term: `Konvex (linksgekrümmt)`,
        symbol: `f''(x) > 0`,
        def: `Ein Graph ist auf einem Intervall konvex (nach oben offen, «Schüssel»), wenn die zweite Ableitung dort positiv ist. Jede Sekante liegt über dem Graphen.`,
        example: `f(x) = x²  ist überall konvex (f''=2 > 0)`,
        tags: `krümmung konvex`
      },
      {
        term: `Konkav (rechtsgekrümmt)`,
        symbol: `f''(x) < 0`,
        def: `Ein Graph ist auf einem Intervall konkav (nach unten offen, «Kuppel»), wenn die zweite Ableitung dort negativ ist. Jede Sekante liegt unter dem Graphen.`,
        example: `f(x) = −x²  ist überall konkav (f''=−2 < 0)`,
        tags: `krümmung konkav`
      },
      {
        term: `Sattelpunkt (Terrassenpunkt)`,
        symbol: `f'(x₀)=0, f''(x₀)=0, kein Extremum`,
        def: `Stelle, an der f'(x₀)=0 und f''(x₀)=0, aber kein Vorzeichenwechsel von f' vorliegt. Der Graph «zögert» kurz, steigt oder fällt aber weiter in dieselbe Richtung.`,
        example: `f(x) = x³  →  Sattelpunkt (= Wendepunkt) bei x = 0`,
        tags: `extrema sattelpunkt terrassenpunkt`
      },
      {
        term: `Kurvendiskussion`,
        symbol: `D, Symmetrie, NS, y-Achsenabschnitt, Extrema, Wendepunkte, Verhalten im Unendlichen`,
        def: `Systematische Untersuchung einer Funktion: Definitionsmenge, Symmetrie, Achsenschnittpunkte, Verhalten im Unendlichen (und Asymptoten), 1. Ableitung (Monotonie, Extrema), 2. Ableitung (Krümmung, Wendepunkte), Wertetabelle und Skizze des Graphen.`,
        example: `f(x) = x³ − 3x:  punktsymmetrisch, NS bei 0 und ±√3, Hochpunkt (−1 | 2), Tiefpunkt (1 | −2), Wendepunkt (0 | 0)`,
        tags: `kurvendiskussion funktionsuntersuchung`
      },
      {
        term: `Extremwertaufgabe (Optimierung)`,
        symbol: `Zielfunktion Z(x) → maximal / minimal`,
        def: `Aus einer Textaufgabe stellt man eine Zielfunktion auf (mit Nebenbedingung, um auf eine Variable zu reduzieren), bestimmt deren Extremstellen mit der Ableitung und prüft Randwerte sowie Definitionsmenge.`,
        example: `Rechteck mit Umfang 20: Fläche A(x) = x·(10 − x), A'(x) = 10 − 2x = 0  →  x = 5 (Quadrat)`,
        tags: `extrema extremwertaufgabe optimierung zielfunktion nebenbedingung`
      },
    ]
  },
  {
    id: 'grenzwerte', icon: '♾️', title: 'Grenzwerte, Stetigkeit & Asymptoten',
    items: [
      {
        term: `Grenzwert`,
        symbol: `lim(x→a) f(x) = L`,
        def: `f(x) nähert sich dem Wert L, wenn x sich dem Wert a annähert (ohne notwendigerweise gleich a zu sein). Einseitige Grenzwerte: lim(x→a⁺) von rechts, lim(x→a⁻) von links.`,
        example: `lim(x→0) sin(x)/x = 1  (wichtiger Grenzwert)`,
        tags: `grenzwert limes`
      },
      {
        term: `Stetigkeit`,
        symbol: `lim(x→a) f(x) = f(a)`,
        def: `Eine Funktion ist stetig in a, wenn der Grenzwert existiert und gleich dem Funktionswert f(a) ist. Anschaulich: Man kann den Graphen ohne Absetzen zeichnen — keine Sprünge, Lücken oder Pole. Polynome, Exponential- und Sinusfunktionen sind überall stetig.`,
        example: `f(x) = 1/x  ist stetig auf ℝ\\{0}, aber nicht stetig in x=0.`,
        tags: `stetigkeit stetig`
      },
      {
        term: `Definitionslücke (hebbar)`,
        symbol: `f(x) = (x² − 4)/(x − 2),  x ≠ 2`,
        def: `Stelle, an der der Nenner null wird, aber auch der Zähler null ist. Nach Kürzen des gemeinsamen Faktors bleibt ein Loch im Graphen statt eines Pols: der Grenzwert existiert und die Lücke lässt sich «heben».`,
        example: `(x² − 4)/(x − 2) = x + 2 für x ≠ 2  →  Gerade y = x + 2 mit Loch bei (2 | 4)`,
        tags: `grenzwert definitionslücke hebbar loch kürzen`
      },
      {
        term: `Asymptote`,
        symbol: `Abstand → 0  für  x → ±∞  oder  x → x₀`,
        def: `Eine Gerade, der sich der Graph beliebig nähert, ohne sie (in der Regel) zu erreichen. Es gibt vertikale, horizontale und schiefe Asymptoten.`,
        example: `f(x) = 1/x  hat bei x=0 eine vertikale und bei y=0 eine horizontale Asymptote.`,
        tags: `asymptote`
      },
      {
        term: `Vertikale Asymptote (Pol)`,
        symbol: `x = x₀,  lim(x→x₀) |f(x)| = ∞`,
        def: `Senkrechte Gerade x = x₀, bei der f(x) betragsmässig über alle Grenzen wächst, wenn x gegen x₀ geht. Entsteht typischerweise, wenn der Nenner einer gebrochenrationalen Funktion null wird.`,
        example: `f(x) = 1/(x−3)  →  Vertikale Asymptote x = 3`,
        tags: `asymptote vertikal pol polstelle`
      },
      {
        term: `Polstelle`,
        symbol: `Nenner(x₀) = 0,  Zähler(x₀) ≠ 0`,
        def: `Stelle, an der eine gebrochenrationale Funktion nicht definiert ist und gegen ±∞ strebt. Von links und rechts kann die Funktion unterschiedliche Vorzeichen haben.`,
        example: `f(x) = 1/x  →  Polstelle bei x = 0`,
        tags: `asymptote pol polstelle`
      },
      {
        term: `Horizontale Asymptote`,
        symbol: `y = k,  lim(x→±∞) f(x) = k`,
        def: `Waagrechte Gerade y = k, der sich der Graph für x → +∞ oder x → −∞ annähert. Bei gebrochen-rationalen Funktionen: Zählergrad < Nennergrad ⟹ y = 0; Zählergrad = Nennergrad ⟹ y = Quotient der führenden Koeffizienten.`,
        example: `f(x) = (2x+1)/(x−1)  →  Horizontale Asymptote y = 2`,
        tags: `asymptote horizontal`
      },
      {
        term: `Schiefe (oblique) Asymptote`,
        symbol: `y = mx + b`,
        def: `Eine nicht-waagrechte, nicht-senkrechte Gerade, der sich der Graph für x → ±∞ annähert. Tritt auf, wenn der Zählergrad genau um 1 grösser ist als der Nennergrad (Polynomdivision).`,
        example: `f(x) = (x²+1)/x = x + 1/x  →  schiefe Asymptote y = x`,
        tags: `asymptote schief oblique`
      },
    ]
  },
  {
    id: 'trigonometrie', icon: '〰️', title: 'Trigonometrie',
    items: [
      {
        term: `Einheitskreis`,
        symbol: `x² + y² = 1`,
        def: `Kreis mit Radius 1 um den Ursprung. Für einen Winkel α gilt: cos(α) = x-Koordinate, sin(α) = y-Koordinate des Punktes auf dem Einheitskreis. Grundlage aller Tabellenwerte.`,
        example: `Winkel π/3 (60°): Punkt (1/2 | √3/2) auf dem Einheitskreis`,
        tags: `trigonometrie einheitskreis`
      },
      {
        term: `Bogenmass`,
        symbol: `α_rad = α_grad · π / 180°`,
        def: `Winkelmass über die Länge des Kreisbogens am Einheitskreis: ein Winkel von 180° entspricht π, ein Vollwinkel 360° entspricht 2π. Bei Ableitungen und Graphen von sin und cos rechnet man immer im Bogenmass.`,
        example: `90° = π/2,   60° = π/3,   45° = π/4,   30° = π/6`,
        tags: `trigonometrie bogenmass winkel radiant grad`
      },
      {
        term: `Sinusfunktion`,
        symbol: `f(x) = sin(x)`,
        def: `Trigonometrische Funktion mit Periode 2π, Amplitude 1, Wertemenge [−1, 1]. sin(0)=0, sin(π/6)=1/2, sin(π/4)=√2/2, sin(π/3)=√3/2, sin(π/2)=1. Ungerade: sin(−x)=−sin(x).`,
        example: `sin(π/3) = √3/2 ≈ 0.866`,
        tags: `trigonometrie sinus sin`
      },
      {
        term: `Kosinusfunktion`,
        symbol: `f(x) = cos(x)`,
        def: `Trigonometrische Funktion mit Periode 2π, Amplitude 1, Wertemenge [−1, 1]. cos(0)=1, cos(π/6)=√3/2, cos(π/4)=√2/2, cos(π/3)=1/2, cos(π/2)=0. Gerade: cos(−x)=cos(x).`,
        example: `cos(π/3) = 1/2`,
        tags: `trigonometrie kosinus cos`
      },
      {
        term: `Tangensfunktion`,
        symbol: `f(x) = tan(x) = sin(x)/cos(x)`,
        def: `Trigonometrische Funktion mit Periode π. Pol bei x = π/2 + kπ. tan(0)=0, tan(π/6)=√3/3=1/√3, tan(π/4)=1, tan(π/3)=√3. Ungerade: tan(−x)=−tan(x).`,
        example: `tan(π/4) = 1,  tan(π/3) = √3 ≈ 1.732`,
        tags: `trigonometrie tangens tan`
      },
      {
        term: `Trigonometrischer Pythagoras`,
        symbol: `sin²(x) + cos²(x) = 1`,
        def: `Grundlegende Identität der Trigonometrie, direkt aus der Definition über den Einheitskreis. Gilt für alle x ∈ ℝ.`,
        example: `sin²(π/4) + cos²(π/4) = 1/2 + 1/2 = 1  ✓`,
        tags: `trigonometrie pythagoras identität`
      },
      {
        term: `Amplitude`,
        symbol: `a  bei  f(x) = a·sin(bx+c)+d`,
        def: `Die halbe Schwingungsbreite einer periodischen Funktion. Gibt an, wie weit der Graph maximal vom Mittelwert (Mittellinie) abweicht.`,
        example: `f(x) = 3·sin(x)  →  Amplitude = 3, Wertemenge [−3, 3]`,
        tags: `trigonometrie amplitude periode`
      },
      {
        term: `Periode`,
        symbol: `T = 2π/b  bei  f(x) = sin(bx)`,
        def: `Die kleinste positive Zahl T, nach der sich der Funktionswert wiederholt: f(x+T) = f(x). Für sin und cos: T = 2π/b. Für tan: T = π/b.`,
        example: `f(x) = sin(2x)  →  b=2, T = 2π/2 = π`,
        tags: `trigonometrie periode`
      },
      {
        term: `Frequenz`,
        symbol: `f = 1 / T`,
        def: `Anzahl Schwingungen pro Zeiteinheit; der Kehrwert der Periode T. Die Kreisfrequenz ω = 2π/T = b entspricht dem Faktor b in sin(b·t).`,
        example: `f(t) = sin(4πt)  →  T = 0.5, Frequenz 2 pro Sekunde`,
        tags: `trigonometrie frequenz kreisfrequenz`
      },
      {
        term: `Phasenverschiebung`,
        symbol: `c  bei  f(x) = sin(x − c)`,
        def: `Horizontale Verschiebung einer Schwingungsfunktion. Positives c verschiebt nach rechts, negatives c nach links.`,
        example: `f(x) = sin(x − π/2) = −cos(x)  →  um π/2 nach rechts verschoben`,
        tags: `trigonometrie phase phasenverschiebung`
      },
      {
        term: `Allgemeine Sinusfunktion`,
        symbol: `f(x) = a·sin(b·(x − c)) + d`,
        def: `Parameter: a Amplitude, b bestimmt die Periode T = 2π/b, c Phasenverschiebung (horizontale Verschiebung), d vertikale Verschiebung (Mittellinie y = d). Wertemenge: [d − |a|, d + |a|].`,
        example: `f(x) = 2·sin(3x) + 1  →  Amplitude 2, Periode 2π/3, Mittellinie y = 1`,
        tags: `trigonometrie sinus amplitude periode mittellinie parameter`
      },
      {
        term: `Trigonometrische Gleichungen`,
        symbol: `sin(x) = c  →  x = arcsin(c)  oder  x = π − arcsin(c)  (+ k·2π)`,
        def: `Wegen der Periodizität gibt es unendlich viele Lösungen. Man bestimmt zuerst die Lösungen in einer Periode (am Einheitskreis oder mit der Arkusfunktion) und addiert dann ganze Vielfache der Periode.`,
        example: `sin(x) = 1/2  →  x = π/6 + k·2π  oder  x = 5π/6 + k·2π`,
        tags: `trigonometrie gleichung lösungen periodisch arkus`
      },
      {
        term: `Arkusfunktionen`,
        symbol: `arcsin, arccos, arctan`,
        def: `Umkehrfunktionen von sin, cos und tan, jeweils eingeschränkt auf einen umkehrbaren Bereich. arcsin(x) liefert Winkel in [−π/2, π/2], arccos(x) in [0, π], arctan(x) in (−π/2, π/2).`,
        example: `arcsin(1/2) = π/6,   arctan(1) = π/4`,
        tags: `trigonometrie arkus arcsin arccos arctan umkehrfunktion`
      },
      {
        term: `Sinussatz und Kosinussatz`,
        symbol: `a/sin(α) = b/sin(β) = c/sin(γ),   c² = a² + b² − 2ab·cos(γ)`,
        def: `Berechnungen in beliebigen Dreiecken. Sinussatz: Seiten verhalten sich wie die Sinus der gegenüberliegenden Winkel. Kosinussatz: verallgemeinert den Satz des Pythagoras (für γ = 90° ist cos(γ) = 0).`,
        example: `a = 3, b = 4, γ = 90°  →  c² = 9 + 16 − 0 = 25  →  c = 5`,
        tags: `trigonometrie sinussatz kosinussatz dreieck`
      },
    ]
  },
  {
    id: 'integral', icon: '∫', title: 'Integralrechnung',
    items: [
      {
        term: `Stammfunktion`,
        symbol: `F'(x) = f(x),  F = ∫f(x)dx`,
        def: `Eine Funktion F, deren Ableitung die Ausgangsfunktion f ergibt. Ist nicht eindeutig: F(x) + C ist ebenfalls eine Stammfunktion (C: Integrationskonstante). Grundregel: ∫xⁿdx = xⁿ⁺¹/(n+1) + C  (n ≠ −1). Weiter: ∫eˣdx = eˣ + C, ∫1/x dx = ln|x| + C, ∫cos x dx = sin x + C.`,
        example: `f(x)=3x²  →  F(x)=x³+C`,
        tags: `integral stammfunktion integration`
      },
      {
        term: `Bestimmtes Integral`,
        symbol: `∫[a,b] f(x)dx = F(b) − F(a)`,
        def: `Berechnet die orientierte Fläche zwischen dem Graphen und der x-Achse im Intervall [a, b]. Bereiche oberhalb der x-Achse zählen positiv, Bereiche darunter negativ. Berechnung mit einer Stammfunktion F: ∫ f(x)dx = F(b) − F(a).`,
        example: `∫[0,2] x dx = [x²/2]₀² = 2 − 0 = 2`,
        tags: `integral bestimmt fläche`
      },
      {
        term: `Hauptsatz der Differential- und Integralrechnung`,
        symbol: `∫[a,b] f(x)dx = F(b) − F(a),   (∫[a,x] f(t)dt)' = f(x)`,
        def: `Verbindet Ableiten und Integrieren: Das bestimmte Integral lässt sich mit einer beliebigen Stammfunktion berechnen, und die Flächenfunktion ist eine Stammfunktion von f.`,
        example: `∫[1,3] 2x dx = [x²]₁³ = 9 − 1 = 8`,
        tags: `integral hauptsatz stammfunktion`
      },
      {
        term: `Integrationsregeln`,
        symbol: `∫(f+g) = ∫f + ∫g,   ∫c·f = c·∫f,   ∫[a,b] = ∫[a,c] + ∫[c,b]`,
        def: `Das Integral ist linear (Summen- und Faktorregel). Vertauscht man die Grenzen, wechselt das Vorzeichen. Ein Integral über [a, b] darf an einer Zwischenstelle c aufgeteilt werden.`,
        example: `∫[0,2] (3x² + 1)dx = [x³ + x]₀² = 10`,
        tags: `integral regeln linearität`
      },
      {
        term: `Flächeninhalt und orientierte Fläche`,
        symbol: `A = ∫[a,b] |f(x)| dx`,
        def: `Das Integral zählt Flächen unter der x-Achse negativ. Für den geometrischen Flächeninhalt zwischen Graph und x-Achse muss man an den Nullstellen aufteilen und die Beträge der Teilintegrale addieren.`,
        example: `f(x) = x³ − x auf [−1, 1]:  Integral = 0, aber Flächeninhalt = 1/2`,
        tags: `integral flächeninhalt orientiert nullstellen aufteilen`
      },
      {
        term: `Flächeninhalt zwischen Graphen`,
        symbol: `A = ∫[a,b] |f(x) − g(x)| dx`,
        def: `Fläche zwischen zwei Funktionsgraphen. Man zieht die untere Funktion von der oberen ab und integriert. Die Integrationsgrenzen sind meist die Schnittstellen. Wechseln die Graphen ihre Lage, muss man an den Schnittstellen aufteilen.`,
        example: `Fläche zwischen f(x)=x² und g(x)=x: A = ∫[0,1] (x−x²)dx = 1/6`,
        tags: `integral fläche`
      },
      {
        term: `Ober- und Untersumme`,
        symbol: `Uₙ ≤ ∫[a,b] f(x)dx ≤ Oₙ`,
        def: `Näherung der Fläche unter einem Graphen durch Rechtecke: Bei der Untersumme liegen alle Rechtecke unter dem Graphen, bei der Obersumme darüber. Für immer feinere Unterteilung (n → ∞) nähern sich beide dem Integral.`,
        example: `f(x) = x² auf [0, 1] mit n = 4:  U = 0.21875,  O = 0.46875,  Integral = 1/3`,
        tags: `integral obersumme untersumme riemann rechtecke`
      },
      {
        term: `Mittelwert einer Funktion`,
        symbol: `m = 1/(b − a) · ∫[a,b] f(x)dx`,
        def: `Der durchschnittliche Funktionswert auf [a, b]: die Höhe des Rechtecks über [a, b], das denselben Flächeninhalt hat wie die Fläche unter dem Graphen.`,
        example: `f(x) = x² auf [0, 3]:  m = (1/3)·9 = 3`,
        tags: `integral mittelwert durchschnitt`
      },
      {
        term: `Rotationsvolumen`,
        symbol: `V = π · ∫[a,b] (f(x))² dx`,
        def: `Rotiert der Graph von f über [a, b] um die x-Achse, entsteht ein Rotationskörper. Sein Volumen ist π mal das Integral des Quadrats der Funktion.`,
        example: `f(x) = x auf [0, 3]:  V = π·∫ x² dx = 9π  (Kegel mit r = 3, h = 3)`,
        tags: `integral rotationsvolumen volumen rotation`
      },
    ]
  },
  {
    id: 'folgen', icon: '🔢', title: 'Folgen & Reihen',
    items: [
      {
        term: `Folge`,
        symbol: `(aₙ) = a₁, a₂, a₃, …`,
        def: `Eine Funktion, die jeder natürlichen Zahl n einen Wert aₙ zuordnet. Angabe explizit (aₙ = Formel in n) oder rekursiv (aₙ₊₁ aus aₙ). Der Graph besteht aus einzelnen Punkten.`,
        example: `aₙ = 1/n:  1, 1/2, 1/3, 1/4, …`,
        tags: `folgen folge explizit rekursiv`
      },
      {
        term: `Arithmetische Folge`,
        symbol: `aₙ = a₁ + (n − 1)·d`,
        def: `Folge mit konstanter Differenz d aufeinanderfolgender Glieder. Der Graph liegt auf einer Geraden (lineares Wachstum). Summe der ersten n Glieder: sₙ = n·(a₁ + aₙ)/2.`,
        example: `3, 7, 11, 15, …   (d = 4):  a₁₀ = 3 + 9·4 = 39`,
        tags: `folgen arithmetisch differenz summe`
      },
      {
        term: `Geometrische Folge`,
        symbol: `aₙ = a₁ · qⁿ⁻¹`,
        def: `Folge mit konstantem Quotienten q aufeinanderfolgender Glieder (exponentielles Wachstum bzw. Zerfall). Summe der ersten n Glieder: sₙ = a₁·(qⁿ − 1)/(q − 1) für q ≠ 1.`,
        example: `2, 6, 18, 54, …   (q = 3):  a₅ = 2·3⁴ = 162`,
        tags: `folgen geometrisch quotient summe`
      },
      {
        term: `Konvergenz einer Folge`,
        symbol: `lim(n→∞) aₙ = g`,
        def: `Eine Folge konvergiert gegen den Grenzwert g, wenn ihre Glieder für grosse n beliebig nahe an g herankommen. Sonst divergiert sie. Eine geometrische Folge konvergiert gegen 0, falls |q| < 1.`,
        example: `aₙ = 1/n → 0;   aₙ = (1 + 1/n)ⁿ → e;   aₙ = (−1)ⁿ divergiert`,
        tags: `folgen konvergenz grenzwert divergenz`
      },
      {
        term: `Reihe und Summenzeichen`,
        symbol: `sₙ = a₁ + a₂ + … + aₙ = Σ(k=1..n) aₖ`,
        def: `Die Summe der Glieder einer Folge. Die Folge der Teilsummen sₙ nennt man Reihe. Die unendliche geometrische Reihe konvergiert für |q| < 1 gegen a₁/(1 − q).`,
        example: `1 + 1/2 + 1/4 + 1/8 + … = 2`,
        tags: `folgen reihe summe summenzeichen partialsumme`
      },
    ]
  },
  {
    id: 'optimierung', icon: '📐', title: 'Lineare Optimierung',
    items: [
      {
        term: `Nebenbedingungen (Ungleichungen)`,
        symbol: `a·x + b·y ≤ c`,
        def: `Lineare Ungleichungen, die die erlaubten Werte der Variablen einschränken. Jede Ungleichung beschreibt eine Halbebene, die von einer Geraden begrenzt wird.`,
        example: `x + y ≤ 6,   x ≥ 0,   y ≥ 0`,
        tags: `optimierung nebenbedingung ungleichung halbebene`
      },
      {
        term: `Planungspolygon (zulässiger Bereich)`,
        symbol: ``,
        def: `Die Menge aller Punkte, die alle Nebenbedingungen gleichzeitig erfüllen — der Durchschnitt der Halbebenen. Er ist ein (konvexes) Vieleck, dessen Ecken Schnittpunkte von Randgeraden sind.`,
        example: `x + y ≤ 6, x ≥ 0, y ≥ 0  →  Dreieck mit den Ecken (0|0), (6|0), (0|6)`,
        tags: `optimierung planungspolygon zulässig bereich`
      },
      {
        term: `Zielfunktion`,
        symbol: `Z(x, y) = p·x + q·y`,
        def: `Die Grösse, die maximiert oder minimiert werden soll (z. B. Gewinn oder Kosten). Die Niveaulinien Z(x, y) = const. sind parallele Geraden.`,
        example: `Gewinn Z = 3x + 2y`,
        tags: `optimierung zielfunktion gewinn kosten`
      },
      {
        term: `Ecken-Satz`,
        symbol: `Optimum liegt in einer Ecke`,
        def: `Hat eine lineare Zielfunktion auf einem beschränkten Planungspolygon ein Maximum oder Minimum, wird es in mindestens einer Ecke angenommen. Man verschiebt die Niveaulinie, bis sie die Ecke berührt, oder setzt alle Ecken in Z ein und vergleicht.`,
        example: `Z = 3x + 2y über (0|0), (6|0), (0|6):  Z = 0, 18, 12  →  Maximum 18 bei (6 | 0)`,
        tags: `optimierung ecken ecke maximum minimum`
      },
    ]
  },
  {
    id: 'geometrie', icon: '🔺', title: 'Geometrie (2D)',
    items: [
      {
        term: `Strecke, Strahl und Gerade`,
        symbol: `AB (Strecke) · [AB (Strahl) · AB (Gerade)`,
        def: `Eine Strecke hat zwei Endpunkte und eine feste Länge. Ein Strahl beginnt in einem Punkt und verläuft unbegrenzt in eine Richtung. Eine Gerade verläuft unbegrenzt in beide Richtungen; durch zwei verschiedene Punkte gibt es genau eine Gerade.`,
        example: `A(0 | 0), B(4 | 3):  Die Strecke AB hat die Länge 5.`,
        tags: `geometrie strecke strahl gerade`
      },
      {
        term: `Mittelpunkt einer Strecke`,
        symbol: `M = ((x₁ + x₂)/2 | (y₁ + y₂)/2)`,
        def: `Der Punkt, der die Strecke in zwei gleich lange Teile teilt. Seine Koordinaten sind die Mittelwerte der Koordinaten der Endpunkte.`,
        example: `A(1 | 2), B(5 | 6)  →  M(3 | 4)`,
        tags: `geometrie mittelpunkt strecke`
      },
      {
        term: `Mittelsenkrechte`,
        symbol: `m_AB`,
        def: `Die Gerade, die auf der Strecke AB senkrecht steht und durch ihren Mittelpunkt geht. Alle Punkte der Mittelsenkrechten sind von A und B gleich weit entfernt.`,
        example: `Die Mittelsenkrechten der drei Seiten eines Dreiecks schneiden sich im Umkreismittelpunkt.`,
        tags: `geometrie mittelsenkrechte symmetrieachse`
      },
      {
        term: `Winkelhalbierende`,
        symbol: `w_α`,
        def: `Die Gerade durch den Scheitel eines Winkels, die den Winkel in zwei gleich grosse Teile teilt. Alle ihre Punkte haben denselben Abstand von beiden Schenkeln.`,
        example: `Die drei Winkelhalbierenden eines Dreiecks schneiden sich im Inkreismittelpunkt.`,
        tags: `geometrie winkelhalbierende winkel`
      },
      {
        term: `Lot, Senkrechte und Lotfusspunkt`,
        symbol: `g ⊥ h`,
        def: `Eine Senkrechte steht im rechten Winkel (90°) auf einer Geraden. Das Lot von einem Punkt P auf eine Gerade g ist die Senkrechte durch P; ihr Schnittpunkt mit g heisst Lotfusspunkt. Die Länge von P bis zum Lotfusspunkt ist der Abstand von P zu g.`,
        example: `Abstand des Punktes P(0 | 3) von der x-Achse: 3 (Lotfusspunkt (0 | 0)).`,
        tags: `geometrie lot senkrechte lotfusspunkt abstand`
      },
      {
        term: `Parallele`,
        symbol: `g ∥ h`,
        def: `Zwei Geraden sind parallel, wenn sie sich nicht schneiden (oder gleich sind) und überall denselben Abstand haben. Durch einen Punkt ausserhalb einer Geraden gibt es genau eine Parallele dazu.`,
        example: `Parallele Geraden haben dieselbe Steigung: y = 2x + 1 und y = 2x − 3.`,
        tags: `geometrie parallele parallel`
      },
      {
        term: `Kreis`,
        symbol: `(x − m)² + (y − n)² = r²`,
        def: `Die Menge aller Punkte, die von einem Mittelpunkt M(m | n) den gleichen Abstand r (Radius) haben. Der Durchmesser ist 2r, der Umfang 2πr und der Flächeninhalt πr².`,
        example: `M(1 | 2), r = 3:  (x − 1)² + (y − 2)² = 9`,
        tags: `geometrie kreis radius durchmesser mittelpunkt`
      },
      {
        term: `Tangente an einen Kreis`,
        symbol: `t ⊥ MB`,
        def: `Eine Gerade, die den Kreis in genau einem Punkt B (Berührpunkt) berührt. Sie steht senkrecht auf dem Radius MB.`,
        example: `Kreis um den Ursprung mit r = 5, B(3 | 4):  Tangente 3x + 4y = 25`,
        tags: `geometrie tangente kreis berührpunkt`
      },
      {
        term: `Thaleskreis (Satz des Thales)`,
        symbol: `∠ACB = 90°`,
        def: `Liegt der Punkt C auf dem Kreis über dem Durchmesser AB, so ist der Winkel bei C ein rechter Winkel. Umgekehrt liegt der Scheitel jedes rechten Winkels über der Strecke AB auf diesem Kreis.`,
        example: `A(−2 | 0), B(2 | 0), C(0 | 2) auf dem Kreis um den Ursprung: Das Dreieck ABC ist rechtwinklig bei C.`,
        tags: `geometrie thales thaleskreis rechter winkel`
      },
      {
        term: `Winkelsumme im Dreieck`,
        symbol: `α + β + γ = 180°`,
        def: `Die drei Innenwinkel eines Dreiecks ergeben zusammen immer 180°. Im Viereck beträgt die Winkelsumme 360°.`,
        example: `α = 50°, β = 60°  →  γ = 70°`,
        tags: `geometrie winkelsumme dreieck winkel`
      },
      {
        term: `Satz des Pythagoras`,
        symbol: `a² + b² = c²`,
        def: `In einem rechtwinkligen Dreieck ist die Summe der Quadrate der beiden Katheten a und b gleich dem Quadrat der Hypotenuse c (der Seite gegenüber dem rechten Winkel).`,
        example: `a = 3, b = 4  →  c = 5`,
        tags: `geometrie pythagoras kathete hypotenuse rechtwinklig`
      },
      {
        term: `Schwerpunkt und Seitenhalbierende`,
        symbol: `S = (A + B + C)/3`,
        def: `Eine Seitenhalbierende verbindet eine Ecke des Dreiecks mit dem Mittelpunkt der gegenüberliegenden Seite. Die drei Seitenhalbierenden schneiden sich im Schwerpunkt S und werden von ihm im Verhältnis 2 : 1 geteilt.`,
        example: `A(0 | 0), B(6 | 0), C(0 | 3)  →  S(2 | 1)`,
        tags: `geometrie schwerpunkt seitenhalbierende dreieck`
      },
      {
        term: `Umkreis und Umkreismittelpunkt`,
        symbol: `U`,
        def: `Der Umkreis geht durch alle drei Ecken eines Dreiecks. Sein Mittelpunkt ist der Schnittpunkt der drei Mittelsenkrechten. Bei einem rechtwinkligen Dreieck liegt U in der Mitte der Hypotenuse.`,
        example: `A(0 | 0), B(4 | 0), C(0 | 4)  →  U(2 | 2), r = √8`,
        tags: `geometrie umkreis umkreismittelpunkt dreieck`
      },
      {
        term: `Inkreis und Inkreismittelpunkt`,
        symbol: `I`,
        def: `Der Inkreis berührt alle drei Seiten eines Dreiecks von innen. Sein Mittelpunkt ist der Schnittpunkt der drei Winkelhalbierenden.`,
        example: `Rechtwinkliges Dreieck mit den Katheten 3 und 4 und der Hypotenuse 5: Inkreisradius r = (3 + 4 − 5)/2 = 1`,
        tags: `geometrie inkreis inkreismittelpunkt dreieck winkelhalbierende`
      },
      {
        term: `Höhe und Höhenschnittpunkt`,
        symbol: `h_a, h_b, h_c · H`,
        def: `Eine Höhe ist das Lot von einer Ecke auf die gegenüberliegende Seite (bzw. deren Verlängerung). Die drei Höhen schneiden sich im Höhenschnittpunkt H.`,
        example: `Beim rechtwinkligen Dreieck liegt H im Scheitel des rechten Winkels.`,
        tags: `geometrie höhe höhenschnittpunkt dreieck`
      },
      {
        term: `Ellipse`,
        symbol: `|PF₁| + |PF₂| = 2a`,
        def: `Die Menge aller Punkte, für die die Summe der Abstände zu zwei festen Punkten (den Brennpunkten F₁ und F₂) konstant ist. Die Halbachsen a und b liegen in den Symmetrieachsen; es gilt e² = a² − b² für die Brennweite e.`,
        example: `x²/9 + y²/4 = 1:  a = 3, b = 2, e = √5`,
        tags: `geometrie ellipse brennpunkt halbachse`
      },
      {
        term: `Vieleck (Polygon)`,
        symbol: `n-Eck`,
        def: `Eine geschlossene Figur aus n Strecken. Die Innenwinkel eines n-Ecks ergeben zusammen (n − 2) · 180°. Ein regelmässiges Vieleck hat lauter gleich lange Seiten und gleich grosse Winkel.`,
        example: `Fünfeck: Winkelsumme 540°, im regelmässigen Fünfeck je 108°.`,
        tags: `geometrie vieleck polygon winkelsumme`
      },
    ]
  },
  {
    id: 'raum', icon: '🧊', title: '3D-Raum & Ebenen',
    items: [
      {
        term: `Koordinatensystem im Raum`,
        symbol: `P(x | y | z)`,
        def: `Ein Punkt im Raum wird durch drei Koordinaten angegeben. Die drei Koordinatenachsen stehen paarweise senkrecht aufeinander; je zwei Achsen spannen eine Koordinatenebene auf (xy-, xz- und yz-Ebene).`,
        example: `P(2 | 3 | 1): 2 in x-Richtung, 3 in y-Richtung, 1 in z-Richtung.`,
        tags: `raum koordinaten koordinatenebene achsen`
      },
      {
        term: `Ebene in Koordinatenform`,
        symbol: `a·x + b·y + c·z = d`,
        def: `Eine Ebene wird durch eine lineare Gleichung in x, y und z beschrieben. Ein Punkt liegt genau dann in der Ebene, wenn seine Koordinaten die Gleichung erfüllen.`,
        example: `2x + 3y − z = 6:  P(1 | 1 | −1) liegt in der Ebene (2 + 3 + 1 = 6).`,
        tags: `raum ebene koordinatenform gleichung`
      },
      {
        term: `Normalenvektor einer Ebene`,
        symbol: `n = (a | b | c)`,
        def: `Ein Vektor, der senkrecht auf der Ebene steht. Bei der Koordinatenform ax + by + cz = d sind die Koeffizienten a, b, c seine Komponenten.`,
        example: `x + y + z = 6  →  n = (1 | 1 | 1)`,
        tags: `raum normalenvektor normale ebene senkrecht`
      },
      {
        term: `Achsenabschnitte`,
        symbol: `x = d/a,  y = d/b,  z = d/c`,
        def: `Die Punkte, in denen die Ebene die Koordinatenachsen schneidet. Man erhält sie, indem man in der Ebenengleichung zwei Koordinaten null setzt.`,
        example: `x + y + z = 6  →  (6 | 0 | 0), (0 | 6 | 0), (0 | 0 | 6)`,
        tags: `raum achsenabschnitte achsenschnittpunkte`
      },
      {
        term: `Spurgeraden (Spuren)`,
        symbol: `Schnitt mit den Koordinatenebenen`,
        def: `Die Schnittgeraden einer Ebene mit den drei Koordinatenebenen. Setzt man z = 0, erhält man die Spur in der xy-Ebene; entsprechend y = 0 (xz-Ebene) und x = 0 (yz-Ebene). Die Spuren helfen, eine Ebene zu zeichnen.`,
        example: `x + y + z = 6, z = 0  →  Spur x + y = 6 in der xy-Ebene`,
        tags: `raum spurgerade spuren koordinatenebene`
      },
      {
        term: `Lage zweier Ebenen`,
        symbol: `parallel · identisch · schneidend`,
        def: `Zwei Ebenen sind parallel, wenn ihre Normalenvektoren Vielfache voneinander sind; sie sind identisch, wenn zusätzlich die ganzen Gleichungen Vielfache sind. Sonst schneiden sie sich in einer Geraden.`,
        example: `x + y + z = 6 und 2x + 2y + 2z = 5 sind parallel, aber nicht identisch.`,
        tags: `raum lage ebenen parallel identisch schnitt`
      },
      {
        term: `Schnittgerade zweier Ebenen`,
        symbol: `g = E₁ ∩ E₂`,
        def: `Die Menge aller Punkte, die in beiden Ebenen liegen. Man löst das Gleichungssystem aus den beiden Ebenengleichungen; die Richtung der Geraden steht senkrecht auf beiden Normalenvektoren (Kreuzprodukt n₁ × n₂).`,
        example: `x + y + z = 6 und x − y = 0  →  g: X = (2 | 2 | 2) + t · (1 | 1 | −2)`,
        tags: `raum schnittgerade ebenen kreuzprodukt`
      },
      {
        term: `Schnittwinkel zweier Ebenen`,
        symbol: `cos φ = |n₁ · n₂| / (|n₁| · |n₂|)`,
        def: `Der Winkel zwischen zwei sich schneidenden Ebenen ist der Winkel zwischen ihren Normalenvektoren (spitz gewählt, 0° ≤ φ ≤ 90°).`,
        example: `n₁ = (1 | 1 | 1), n₂ = (1 | −1 | 0)  →  n₁ · n₂ = 0  →  φ = 90°`,
        tags: `raum schnittwinkel winkel ebenen normalenvektor`
      },
      {
        term: `Abstand eines Punktes von einer Ebene`,
        symbol: `d = |a·x₀ + b·y₀ + c·z₀ − d| / √(a² + b² + c²)`,
        def: `Der kürzeste Abstand eines Punktes P(x₀ | y₀ | z₀) von der Ebene ax + by + cz = d, gemessen senkrecht zur Ebene (Hessesche Normalenform). Für den Ursprung vereinfacht sich die Formel zu |d| / |n|.`,
        example: `Ebene x + y + z = 6, Ursprung:  6 / √3 ≈ 3.46`,
        tags: `raum abstand punkt ebene hesse`
      },
      {
        term: `Schnittpunkt dreier Ebenen`,
        symbol: `lineares Gleichungssystem (3 × 3)`,
        def: `Drei Ebenen schneiden sich in genau einem Punkt, wenn das Gleichungssystem aus den drei Ebenengleichungen eindeutig lösbar ist (die Normalenvektoren sind dann nicht in einer gemeinsamen Ebene). Sonst gibt es keinen oder unendlich viele gemeinsame Punkte.`,
        example: `x = 1, y = 2, z = 3 schneiden sich in P(1 | 2 | 3).`,
        tags: `raum schnittpunkt drei ebenen gleichungssystem`
      },
      {
        term: `Ebene als Funktion von x und y`,
        symbol: `z = (d − a·x − b·y) / c`,
        def: `Ist c ≠ 0, lässt sich die Ebene nach z auflösen: Jedem Gitterpunkt (x | y) der xy-Ebene gehört genau ein z-Wert. Die Balken über dem Gitter zeigen diese z-Werte; verkleinert man den Gitterabstand, füllt sich die ganze Ebene.`,
        example: `x + y + z = 6:  Gitterpunkt (1 | 2) → z = 3`,
        tags: `raum funktion zwei variablen z-wert balken gitter`
      },
      {
        term: `Parameter in der Ebenengleichung`,
        symbol: `a, b, c, d als Schieber`,
        def: `Ersetzt man die Koeffizienten durch Parameter, entsteht eine Schar von Ebenen. Mit den Schiebern sieht man, wie sich Lage und Neigung der Ebene ändern: a, b, c bestimmen die Richtung des Normalenvektors, d den Abstand vom Ursprung.`,
        example: `ax + by + cz = d mit a = b = c = d = 1 ergibt x + y + z = 1.`,
        tags: `raum parameter schieber ebenenschar`
      },
    ]
  },
  {
    id: 'algebra', icon: '🧩', title: 'Algebra',
    items: [
      {
        term: `Term, Variable und Koeffizient`,
        symbol: `3x² − 4y`,
        def: `Ein Term ist ein mathematischer Ausdruck aus Zahlen, Variablen (Buchstaben) und Rechenzeichen. Der Koeffizient ist die Zahl vor der Variablen. Setzt man für die Variablen Zahlen ein, erhält man den Wert des Terms.`,
        example: `3x² − 4y: Koeffizienten 3 und −4; für x = 2 und y = 1 ist der Wert 3·4 − 4 = 8.`,
        tags: `algebra term variable koeffizient wert`
      },
      {
        term: `Distributivgesetz (Ausmultiplizieren)`,
        symbol: `a(b + c) = ab + ac`,
        def: `Beim Ausmultiplizieren wird jedes Glied einer Klammer mit jedem Glied der anderen Klammer multipliziert. Im Flächenbild ist jedes Teilprodukt ein Teilrechteck, und alle Teilrechtecke zusammen ergeben das grosse Rechteck.`,
        example: `(x + 2)(x + 3) = x² + 3x + 2x + 6 = x² + 5x + 6`,
        tags: `algebra ausmultiplizieren distributivgesetz klammern produkt flächenbild`
      },
      {
        term: `Erste binomische Formel`,
        symbol: `(a + b)² = a² + 2ab + b²`,
        def: `Das Quadrat einer Summe. Im Flächenbild besteht das Quadrat mit der Seite a + b aus dem Quadrat a², dem Quadrat b² und zwei Rechtecken ab.`,
        example: `(x + 3)² = x² + 6x + 9`,
        tags: `algebra binomische formel quadrat summe plus formel`
      },
      {
        term: `Zweite binomische Formel`,
        symbol: `(a − b)² = a² − 2ab + b²`,
        def: `Das Quadrat einer Differenz. Im Bild werden vom Quadrat a² zwei Streifen der Fläche ab abgezogen; das Eckquadrat b² wurde dabei zweimal weggenommen und wird einmal wieder addiert.`,
        example: `(3x − 4y)² = 9x² − 24xy + 16y²`,
        tags: `algebra binomische formel quadrat differenz minus formel`
      },
      {
        term: `Dritte binomische Formel`,
        symbol: `(a + b)(a − b) = a² − b²`,
        def: `Summe mal Differenz ergibt eine Differenz von Quadraten. Im Bild lässt sich ein Quadrat a² ohne Eckquadrat b² zu einem Rechteck mit den Seiten a + b und a − b umlegen.`,
        example: `103 · 97 = (100 + 3)(100 − 3) = 100² − 3² = 9991`,
        tags: `algebra binomische formel summe differenz plus minus quadrate formel`
      },
      {
        term: `Ausklammern und Faktorisieren`,
        symbol: `ab + ac = a(b + c)`,
        def: `Das Umkehren des Ausmultiplizierens: Ein Term wird als Produkt geschrieben. Zuerst klammert man den gemeinsamen Faktor aus, dann prüft man die binomischen Formeln und sucht die Nullstellen.`,
        example: `6x² + 9x = 3x(2x + 3)`,
        tags: `algebra faktorisieren ausklammern produkt zerlegen`
      },
      {
        term: `Satz von Vieta (Faktorisieren von x² + px + q)`,
        symbol: `x² + px + q = (x − x₁)(x − x₂)`,
        def: `Für die Nullstellen x₁ und x₂ gilt x₁ + x₂ = −p und x₁ · x₂ = q. Man sucht also zwei Zahlen mit dem Produkt q und der Summe −p. Im Bild bilden ein x²-Plättchen, p x-Plättchen und q Einerplättchen ein Rechteck.`,
        example: `x² + 5x + 6: Zahlen mit Produkt 6 und Summe 5 sind 2 und 3, also (x + 2)(x + 3).`,
        tags: `algebra vieta faktorisieren nullstellen plättchen kacheln`
      },
      {
        term: `Quadratische Ergänzung`,
        symbol: `x² + px + (p/2)² = (x + p/2)²`,
        def: `Man ergänzt einen Term mit x² und x durch das Quadrat der halben Zahl vor x zu einem vollständigen Quadrat. Im Bild fehlt dem Quadrat x² mit den beiden Rechtecken genau das Eckquadrat (p/2)².`,
        example: `x² + 6x + 5 = (x² + 6x + 9) − 9 + 5 = (x + 3)² − 4`,
        tags: `algebra quadratische ergänzung quadrat scheitelform halbe zahl`
      },
      {
        term: `Scheitelform und Scheitelpunkt`,
        symbol: `y = a(x − d)² + e`,
        def: `Die Scheitelform einer quadratischen Funktion entsteht durch quadratische Ergänzung. Sie zeigt den Scheitelpunkt S(d | e) der Parabel direkt.`,
        example: `y = x² + 6x + 5 = (x + 3)² − 4 hat den Scheitelpunkt S(−3 | −4).`,
        tags: `algebra scheitelform scheitelpunkt parabel`
      },
      {
        term: `Binomische Formel für die dritte Potenz`,
        symbol: `(a + b)³ = a³ + 3a²b + 3ab² + b³`,
        def: `Der Würfel mit der Kante a + b besteht aus einem Würfel a³, einem Würfel b³, drei Quadern a²b und drei Quadern ab².`,
        example: `(x + 2)³ = x³ + 6x² + 12x + 8`,
        tags: `algebra binomische formel dritte potenz würfel kubik`
      },
      {
        term: `Pascal'sches Dreieck`,
        symbol: `1  ·  1 1  ·  1 2 1  ·  1 3 3 1`,
        def: `Ein Zahlendreieck, in dem jede Zahl die Summe der beiden Zahlen darüber ist. Die Zeile n enthält die Koeffizienten von (a + b)ⁿ.`,
        example: `Zeile 4: 1, 4, 6, 4, 1, also (a + b)⁴ = a⁴ + 4a³b + 6a²b² + 4ab³ + b⁴.`,
        tags: `algebra pascal dreieck binomialkoeffizient zeile`
      },
      {
        term: `Binomischer Lehrsatz`,
        symbol: `(a + b)ⁿ = Σ C(n, k) aⁿ⁻ᵏ bᵏ`,
        def: `Er gibt alle Glieder von (a + b)ⁿ an. Der Binomialkoeffizient C(n, k) = n! / (k! (n − k)!) steht im Pascal'schen Dreieck in Zeile n an der Stelle k.`,
        example: `C(5, 2) = 10, darum kommt in (a + b)⁵ das Glied 10a³b² vor.`,
        tags: `algebra binomischer lehrsatz binomialkoeffizient potenz entwickeln pascal`
      },
      {
        term: `Potenz, Basis und Hochzahl`,
        symbol: `aⁿ = a · a · … · a`,
        def: `Eine Potenz aⁿ ist ein Produkt aus n gleichen Faktoren a. Die Zahl a heisst Basis, n heisst Hochzahl (Exponent). Eine Hochzahl 0 ergibt 1, eine negative Hochzahl bedeutet den Kehrwert: a⁻ⁿ = 1/aⁿ.`,
        example: `2⁵ = 2·2·2·2·2 = 32;  2⁻³ = 1/8;  5⁰ = 1`,
        tags: `algebra potenz basis hochzahl exponent kehrwert null`
      },
      {
        term: `Potenzgesetze`,
        symbol: `aᵐ·aⁿ = aᵐ⁺ⁿ,  (aᵐ)ⁿ = aᵐⁿ,  (ab)ⁿ = aⁿbⁿ`,
        def: `Gleiche Basen: Hochzahlen addieren beim Multiplizieren und subtrahieren beim Dividieren. Potenz einer Potenz: Hochzahlen multiplizieren. Potenz eines Produkts oder Quotienten: die Hochzahl gilt für jeden Faktor. Im Bild ist jede Hochzahl eine Reihe von Bausteinen.`,
        example: `x³·x⁴ = x⁷;  (a²b)³ = a⁶b³;  x⁵ / x² = x³`,
        tags: `algebra potenzgesetze potenzen produktregel quotientenregel potenz einer potenz bausteine`
      },
      {
        term: `Logarithmus`,
        symbol: `log_b(a) = x  ⇔  bˣ = a`,
        def: `Der Logarithmus log_b(a) ist die Hochzahl, mit der man die Basis b potenzieren muss, um a zu erhalten. Er ist die Umkehrung des Potenzierens. Im Bild ist die Frage «b hoch wie viel ergibt a?» an einer Potenzleiter 1, b, b², b³, … abzulesen: Die Antwort ist die Stufe.`,
        example: `log₂(8) = 3, weil 2³ = 8;  log₁₀(1000) = 3;  ln(e²) = 2`,
        tags: `algebra logarithmus basis hochzahl umkehrung ln lg zehnerlogarithmus`
      },
      {
        term: `Logarithmengesetze`,
        symbol: `log(uv) = log u + log v,  log(u/v) = log u − log v,  log(uⁿ) = n·log u`,
        def: `Der Logarithmus macht aus Produkten Summen, aus Quotienten Differenzen und aus Potenzen Vielfache. Beim Basiswechsel gilt log_b(a) = log(a) / log(b). Die Argumente müssen positiv sein.`,
        example: `log₂(x³y/z) = 3·log₂ x + log₂ y − log₂ z`,
        tags: `algebra logarithmengesetze logarithmus produkt quotient potenz basiswechsel summe differenz`
      },
      {
        term: `Bruchterm und Definitionsmenge`,
        symbol: `A/B,  B ≠ 0`,
        def: `Ein Bruchterm ist ein Bruch, in dem im Zähler oder Nenner eine Variable vorkommt. Der Nenner darf nie 0 sein: Alle Zahlen, die den Nenner null machen, gehören nicht zur Definitionsmenge. Im Bild sieht man sie als ausgelassene Stellen auf der Zahlengeraden.`,
        example: `(x² − 4)/(x + 2): D = ℝ \\ {−2}`,
        tags: `algebra bruchterm definitionsmenge nenner null ausschliessen zahlengerade`
      },
      {
        term: `Kürzen, Erweitern und Hauptnenner`,
        symbol: `(a·c)/(b·c) = a/b`,
        def: `Kürzen heisst Zähler und Nenner durch denselben Faktor teilen, Erweitern heisst sie mit demselben Faktor multiplizieren. Zum Addieren von Brüchen braucht man den Hauptnenner: das kleinste gemeinsame Vielfache der Nenner. Gekürzt werden können nur Faktoren, nie Summanden. Im Bild sind die Faktoren Bausteine, gleiche Bausteine oben und unten werden durchgestrichen.`,
        example: `(x² − 4)/(x + 2) = (x + 2)(x − 2)/(x + 2) = x − 2`,
        tags: `algebra kürzen erweitern hauptnenner faktoren bruch bruchterm`
      },
      {
        term: `Wurzel und rationale Hochzahl`,
        symbol: `ⁿ√a = a^(1/n),  a^(m/n) = ⁿ√(aᵐ)`,
        def: `Die n-te Wurzel ⁿ√a ist die positive Zahl, die n-mal mit sich multipliziert a ergibt. Sie ist dasselbe wie die Potenz a^(1/n); allgemein bedeutet die Hochzahl m/n: «n-te Wurzel ziehen, dann mit m potenzieren». So gelten die Potenzgesetze auch für Wurzeln. Eine Wurzel im Nenner macht man rational, indem man mit ihr erweitert.`,
        example: `√12 = 2√3;  8^(2/3) = (∛8)² = 4;  1/√2 = √2/2`,
        tags: `algebra wurzel quadratwurzel kubikwurzel rationale hochzahl exponent bruch nenner rational machen`
      },
      {
        term: `Gleichung und Äquivalenzumformung`,
        symbol: `T₁(x) = T₂(x)`,
        def: `Eine Gleichung sagt, dass zwei Terme gleich sind; gesucht sind die Zahlen für x, bei denen das stimmt (die Lösungsmenge L). Eine Äquivalenzumformung ändert die Lösungsmenge nicht: auf beiden Seiten dasselbe addieren, subtrahieren, mit einer Zahl ≠ 0 multiplizieren oder dividieren. Das Bild ist eine Waage, die im Gleichgewicht bleiben muss. Eine Probe durch Einsetzen zeigt, ob die Lösung stimmt.`,
        example: `3x + 2 = x + 8  ⇒  2x = 6  ⇒  x = 3,  L = {3}`,
        tags: `algebra gleichung äquivalenzumformung waage lösungsmenge probe lineare gleichung`
      },
      {
        term: `Quadratische Gleichung (Lösungsformel, Diskriminante)`,
        symbol: `ax² + bx + c = 0,  x = (−b ± √D) / 2a,  D = b² − 4ac`,
        def: `Die Lösungen sind die Nullstellen der Parabel y = ax² + bx + c. Die Diskriminante D entscheidet: D > 0 gibt zwei Lösungen, D = 0 eine doppelte, D < 0 keine reelle. Oft hilft Faktorisieren und der Satz vom Nullprodukt: ein Produkt ist null, wenn ein Faktor null ist.`,
        example: `x² − 5x + 6 = 0:  D = 1,  x = 2 oder x = 3`,
        tags: `algebra quadratische gleichung lösungsformel mitternachtsformel diskriminante nullstellen parabel nullprodukt`
      },
      {
        term: `Bruchgleichung und Scheinlösung`,
        symbol: `A(x)/B(x) = 0  ⇔  A(x) = 0 und B(x) ≠ 0`,
        def: `In einer Bruchgleichung steht die Unbekannte im Nenner. Zuerst bestimmt man die Definitionsmenge, dann bringt man alles auf einen Bruch und setzt den Zähler null. Eine Lösung, die den Nenner null macht, ist eine Scheinlösung und gehört nicht zur Lösungsmenge. Das gilt auch beim Quadrieren einer Wurzelgleichung: Quadrieren ist keine Äquivalenzumformung, darum ist die Probe nötig.`,
        example: `(x² − 1)/(x − 1) = 2: Es sieht aus wie x = 1, doch 1 ist nicht definiert, also L = { }.`,
        tags: `algebra bruchgleichung scheinlösung definitionsmenge wurzelgleichung quadrieren probe`
      },
      {
        term: `Lineares Gleichungssystem`,
        symbol: `a₁x + b₁y = c₁,  a₂x + b₂y = c₂`,
        def: `Ein Gleichungssystem besteht aus mehreren Gleichungen, die gleichzeitig gelten sollen. Mit zwei Unbekannten ist jede Gleichung eine Gerade, und die Lösung ist der Schnittpunkt. Es gibt drei Fälle: genau eine Lösung (die Geraden schneiden sich), keine Lösung (parallele Geraden) oder unendlich viele Lösungen (dieselbe Gerade). Bei drei Gleichungen mit drei Unbekannten rechnet man mit dem Gauss-Verfahren.`,
        example: `2x + 3y = 7 und x − y = 1: Schnittpunkt (2 | 1), also x = 2 und y = 1.`,
        tags: `algebra gleichungssystem lineares system schnittpunkt geraden parallel unendlich lösungen 2x2 3x3 gauss`
      },
      {
        term: `Additions-, Einsetzungs- und Gleichsetzungsverfahren`,
        symbol: `k·(I) + m·(II),   x = … einsetzen,   f(x) = g(x)`,
        def: `Additionsverfahren: Man multipliziert die Gleichungen so, dass eine Unbekannte entgegengesetzte Koeffizienten hat, und addiert; sie fällt weg. Einsetzungsverfahren: Man löst eine Gleichung nach einer Unbekannten auf und setzt das in die andere ein. Gleichsetzungsverfahren: Man löst beide Gleichungen nach derselben Unbekannten auf und setzt die rechten Seiten gleich. Zuletzt rechnet man die zweite Unbekannte aus und macht die Probe.`,
        example: `x + 2y = 5 und 3x − y = 1: x = 5 − 2y einsetzen ergibt 15 − 7y = 1, also y = 2 und x = 1.`,
        tags: `algebra additionsverfahren einsetzungsverfahren gleichsetzungsverfahren eliminieren gleichungssystem`
      },
    ]
  },
];

// Zuordnung der Ordner zu den Umgebungen (siehe 32_env.js): in jeder Umgebung erscheinen nur die passenden Begriffe.
// Neuer Ordner oder neue Umgebung → hier eintragen (fehlt ein Ordner, erscheint er überall).
const BEGRIFFE_ENVS = {
  grundlagen: ['func'], gleichungen: ['func'], typen: ['func'], eigenschaften: ['func'],
  ableitung: ['diff'], kurvendiskussion: ['func', 'diff'], grenzwerte: ['func', 'diff', 'seq'], trigonometrie: ['func'],
  integral: ['int'], folgen: ['seq'], optimierung: ['lo'], geometrie: ['geo'], raum: ['3d'], algebra: ['alg']
};
function _bgrInEnv(g) {
  const e = (typeof ENV !== 'undefined' && ENV.cur) || 'func';
  const l = BEGRIFFE_ENVS[g.id];
  return !l || l.indexOf(e) >= 0;
}

// Flache Liste aller Begriffe (jeweils mit Verweis auf die Gruppe).
const BEGRIFFE = [];
BEGRIFFE_GRUPPEN.forEach(g => g.items.forEach(b => BEGRIFFE.push(Object.assign({ group: g.id }, b))));

// ── Rendering & Suche ────────────────────────────────────────────────
// Das Glossar wird EINMAL vollständig aufgebaut; die Suche blendet nur Einträge ein/aus.
// Durchsucht wird der aktuell angezeigte Text (also bei anderer Sprache als Deutsch die
// Übersetzung, die 23_autotranslate.js direkt im DOM ersetzt) plus die deutschen Schlagwörter.

// Aufgeklappte Ordner (bleiben beim Filtern erhalten)
const _bgrOpenGroups = new Set();
let _bgrDom = null;          // [{ g, folder, fh, countEl, applyF, items:[{ b, wrap, setOpen }] }]
let _bgrEmpty = null;        // Hinweis «Kein Begriff gefunden.»
let _bgrWasSearching = false;

function _bgrEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _bgrBuild(el) {
  el.innerHTML = '';
  _bgrDom = [];
  BEGRIFFE_GRUPPEN.forEach(g => {
    const folder = document.createElement('div');
    folder.style.cssText = 'margin-bottom:7px;border-radius:7px;border:1px solid var(--border);overflow:hidden;';

    // Ordner-Kopf
    const fh = document.createElement('div');
    fh.style.cssText =
      'display:flex;align-items:center;gap:7px;padding:7px 9px;cursor:pointer;user-select:none;' +
      'background:var(--bg-btn);border-left:3px solid #378ADD;';
    fh.innerHTML =
      `<span style="font-size:13px;line-height:1;">${g.icon}</span>` +
      `<span class="bgr-ftitle" style="font-weight:700;font-size:12px;color:var(--text);flex:1;">${_bgrEsc(g.title)}</span>` +
      `<span class="bgr-fcount" style="font-size:10px;color:var(--text-muted);">${g.items.length}</span>` +
      `<span class="bgr-farrow" style="font-size:10px;color:var(--text-muted);transition:transform .18s;">▼</span>`;

    // Ordner-Inhalt
    const fb = document.createElement('div');
    fb.style.cssText = 'display:none;padding:6px 6px 2px;background:var(--bg-range);';

    const rec = { g, folder, fh, fb, countEl: fh.querySelector('.bgr-fcount'), items: [], searchOpen: false };
    rec.applyF = () => {
      const fopen = rec.searchOpen || _bgrOpenGroups.has(g.id);
      fb.style.display = fopen ? 'block' : 'none';
      fh.querySelector('.bgr-farrow').style.transform = fopen ? 'rotate(180deg)' : '';
    };
    fh.addEventListener('click', () => {
      const fopen = fb.style.display !== 'none';
      if (fopen) { _bgrOpenGroups.delete(g.id); rec.searchOpen = false; } else _bgrOpenGroups.add(g.id);
      rec.applyF();
    });

    g.items.forEach(b => { const it = _bgrItem(b); rec.items.push(it); fb.appendChild(it.wrap); });
    folder.append(fh, fb);
    el.appendChild(folder);
    _bgrDom.push(rec);
  });
  _bgrEmpty = document.createElement('span');
  _bgrEmpty.style.cssText = 'font-size:11px;color:var(--text-muted);display:none;';
  _bgrEmpty.textContent = 'Kein Begriff gefunden.';
  el.appendChild(_bgrEmpty);
}

function renderBegriffe(filter) {
  const el = document.getElementById('begriffe-list');
  if (!el) return;
  if (!_bgrDom) _bgrBuild(el);
  const q = (filter || '').toLowerCase().trim();

  let anyShown = false;
  _bgrDom.forEach(rec => {
    if (!_bgrInEnv(rec.g)) { rec.folder.style.display = 'none'; return; }   // gehört zu einem anderen Thema
    // Ordnertitel passt → alle Begriffe des Ordners anzeigen
    const titleHit = !!q && rec.fh.querySelector('.bgr-ftitle').textContent.toLowerCase().includes(q);
    let n = 0;
    rec.items.forEach(it => {
      const hit = !q || titleHit
        || it.wrap.textContent.toLowerCase().includes(q)   // angezeigter (ggf. übersetzter) Text
        || (it.b.tags || '').toLowerCase().includes(q)      // deutsche Schlagwörter
        || it.b.term.toLowerCase().includes(q);
      it.wrap.style.display = hit ? '' : 'none';
      if (hit) { n++; if (q) it.setOpen(true); }
      else if (q) it.setOpen(false);
    });
    if (!q && _bgrWasSearching) rec.items.forEach(it => it.setOpen(false));
    rec.countEl.textContent = n;
    rec.searchOpen = !!q && n > 0;
    rec.folder.style.display = n > 0 ? '' : 'none';
    rec.applyF();
    if (n > 0) anyShown = true;
  });
  _bgrEmpty.style.display = anyShown ? 'none' : '';
  _bgrWasSearching = !!q;
}

// Ein einzelner Begriff (aufklappbar)
function _bgrItem(b) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'margin-bottom:5px;border-radius:6px;overflow:hidden;border:1px solid var(--border);';

  // Header (klickbar zum Auf-/Zuklappen)
  const hdr = document.createElement('div');
  hdr.style.cssText =
    'display:flex;justify-content:space-between;align-items:center;' +
    'padding:5px 9px;cursor:pointer;background:var(--bg-btn);user-select:none;';
  hdr.innerHTML =
    `<span style="font-weight:600;font-size:11.5px;color:var(--text);">${_bgrEsc(b.term)}</span>` +
    `<span class="bgr-arrow" style="font-size:10px;color:var(--text-muted);transition:transform .18s;">▼</span>`;

  // Body (Formel + Definition + Beispiel)
  const body = document.createElement('div');
  body.style.cssText =
    'display:none;padding:7px 10px 8px;font-size:11px;line-height:1.65;' +
    'color:var(--text);background:var(--bg-range);';

  if (b.symbol) {
    body.innerHTML +=
      `<div style="font-family:monospace;font-size:10.5px;color:#378ADD;margin-bottom:5px;` +
      `background:var(--bg-btn);padding:3px 7px;border-radius:4px;display:inline-block;white-space:pre-wrap;">${_bgrEsc(b.symbol)}</div>`;
  }
  body.innerHTML += `<div style="margin-bottom:${b.example ? '5px' : '0'};white-space:pre-wrap;">${_bgrEsc(b.def)}</div>`;
  if (b.example) {
    // Beschriftung und Beispieltext sind getrennte Blöcke: Reine Formel-Beispiele
    // brauchen so keine Übersetzung, und «Bsp.:» wird nur einmal übersetzt.
    body.innerHTML +=
      `<div style="font-size:10.5px;color:var(--text-muted);border-top:1px solid var(--border);` +
      `margin-top:5px;padding-top:4px;display:flex;gap:5px;align-items:baseline;">` +
      `<div style="font-weight:600;flex:none;">Bsp.:</div>` +
      `<div style="font-family:monospace;white-space:pre-wrap;min-width:0;overflow-wrap:anywhere;">${_bgrEsc(b.example)}</div></div>`;
  }

  // Toggle
  let open = false;
  const apply = () => {
    body.style.display = open ? 'block' : 'none';
    hdr.querySelector('.bgr-arrow').style.transform = open ? 'rotate(180deg)' : '';
  };
  const setOpen = v => { open = !!v; apply(); };
  hdr.addEventListener('click', () => { open = !open; apply(); });

  wrap.append(hdr, body);
  return { b, wrap, setOpen };
}

// Beim Laden initialisieren
(function initBegriffe() {
  const inp = document.getElementById('begriffe-search');
  if (inp) {
    inp.addEventListener('input', () => renderBegriffe(inp.value));
  }
  renderBegriffe('');
})();
