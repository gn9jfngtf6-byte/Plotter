// ═══════════════════════════════════════════════════════════════════
// MODUL: begriffe — Mathematisches Glossar für das Gymnasialniveau
// ═══════════════════════════════════════════════════════════════════

const BEGRIFFE = [
  // ── Grundlagen ────────────────────────────────────────────────────
  {
    term: 'Funktion',
    symbol: 'f: D → W,  x ↦ f(x)',
    def: 'Eine Funktion f ordnet jedem Element x der Definitionsmenge D genau ein Element f(x) der Wertemenge W zu. Kein x-Wert darf zwei verschiedene y-Werte haben.',
    example: 'f(x) = 2x + 1  ordnet jedem x genau einen Wert zu.',
    tags: 'grundlagen funktion'
  },
  {
    term: 'Definitionsmenge',
    symbol: 'D  (oder D_f)',
    def: 'Die Menge aller x-Werte, für die f(x) definiert ist (existiert). Typische Einschränkungen: Nenner ≠ 0, Radikand ≥ 0, Argument des Logarithmus > 0.',
    example: 'f(x) = 1/x  →  D = ℝ \\ {0}   (alle reellen Zahlen ausser 0)',
    tags: 'grundlagen definitionsmenge'
  },
  {
    term: 'Wertemenge',
    symbol: 'W  (oder W_f)',
    def: 'Die Menge aller y-Werte, die f(x) tatsächlich annimmt: W = {f(x) | x ∈ D}. Nicht zu verwechseln mit dem Wertebereich (dem Zielbereich).',
    example: 'f(x) = x²  →  W = [0, +∞)   (nur nicht-negative Zahlen)',
    tags: 'grundlagen wertemenge'
  },
  {
    term: 'Graph',
    symbol: 'G_f = {(x | f(x)) | x ∈ D}',
    def: 'Die Menge aller Punkte (x | f(x)) in der Koordinatenebene, die zur Funktion f gehören. Der Graph veranschaulicht den Verlauf der Funktion.',
    example: 'Der Graph von f(x) = x² ist eine nach oben geöffnete Parabel.',
    tags: 'grundlagen graph'
  },

  // ── Charakteristische Punkte ───────────────────────────────────────
  {
    term: 'Nullstelle',
    symbol: 'f(x₀) = 0',
    def: 'Eine Stelle x₀, an der der Funktionswert null ist. Der Graph schneidet (oder berührt) die x-Achse. Berechnung: f(x) = 0 setzen und nach x auflösen.',
    example: 'f(x) = x² − 4  →  Nullstellen bei x = ±2',
    tags: 'punkte nullstelle'
  },
  {
    term: 'Vielfachheit einer Nullstelle',
    symbol: 'f(x) = (x − x₀)ⁿ · g(x)',
    def: 'Gibt an, wie oft der Linearfaktor (x − x₀) im Produkt vorkommt. Einfache NS (n=1): Graph kreuzt die x-Achse. Doppelte NS (n=2): Graph berührt die x-Achse (Wendepunkt bei der NS möglich).',
    example: 'f(x) = (x−2)²(x+1)  →  NS x=2 mit Vielfachheit 2, NS x=−1 einfach',
    tags: 'punkte nullstelle vielfachheit'
  },
  {
    term: 'y-Achsenabschnitt',
    symbol: '(0 | f(0))',
    def: 'Der Schnittpunkt des Graphen mit der y-Achse. Er wird berechnet, indem x = 0 in f(x) eingesetzt wird. Existiert immer, wenn 0 ∈ D.',
    example: 'f(x) = 3x − 5  →  y-Achsenabschnitt bei (0 | −5)',
    tags: 'punkte y-achse y-achsenabschnitt'
  },
  {
    term: 'Schnittpunkt',
    symbol: 'f(x) = g(x)',
    def: 'Gemeinsamer Punkt zweier Graphen. Berechnung durch Gleichsetzen: f(x) = g(x) nach x auflösen, dann y = f(x) berechnen.',
    example: 'f(x) = x², g(x) = x + 2  →  x²−x−2=0  →  x=−1 oder x=2',
    tags: 'punkte schnittpunkt'
  },

  // ── Monotonie ─────────────────────────────────────────────────────
  {
    term: 'Monoton steigend',
    symbol: 'x₁ < x₂  ⟹  f(x₁) ≤ f(x₂)',
    def: 'Eine Funktion ist auf einem Intervall I monoton steigend, wenn grössere x-Werte auch grössere (oder gleich grosse) Funktionswerte liefern. Bei streng monoton steigend gilt striktes <.',
    example: 'f(x) = 2x + 1  ist auf ganz ℝ streng monoton steigend.',
    tags: 'monotonie steigend'
  },
  {
    term: 'Monoton fallend',
    symbol: 'x₁ < x₂  ⟹  f(x₁) ≥ f(x₂)',
    def: 'Eine Funktion ist auf einem Intervall I monoton fallend, wenn grössere x-Werte kleinere (oder gleich grosse) Funktionswerte liefern. Bei streng monoton fallend gilt striktes >.',
    example: 'f(x) = −x + 3  ist auf ganz ℝ streng monoton fallend.',
    tags: 'monotonie fallend'
  },

  // ── Extrema ───────────────────────────────────────────────────────
  {
    term: 'Lokales Maximum (Hochpunkt)',
    symbol: 'f\'(x₀)=0, f\'\'(x₀)<0',
    def: 'Ein Punkt (x₀ | f(x₀)), in dem f(x₀) grösser ist als alle benachbarten Funktionswerte. Notwendige Bedingung: f\'(x₀) = 0. Hinreichend: f\'\'(x₀) < 0.',
    example: 'f(x) = −x² + 4  →  Hochpunkt bei (0 | 4)',
    tags: 'extrema maximum hochpunkt'
  },
  {
    term: 'Lokales Minimum (Tiefpunkt)',
    symbol: 'f\'(x₀)=0, f\'\'(x₀)>0',
    def: 'Ein Punkt (x₀ | f(x₀)), in dem f(x₀) kleiner ist als alle benachbarten Funktionswerte. Notwendige Bedingung: f\'(x₀) = 0. Hinreichend: f\'\'(x₀) > 0.',
    example: 'f(x) = x² − 2x  →  Tiefpunkt bei (1 | −1)',
    tags: 'extrema minimum tiefpunkt'
  },
  {
    term: 'Scheitelpunkt',
    symbol: 'xₛ = −b/(2a),  yₛ = f(xₛ)',
    def: 'Der Hochpunkt oder Tiefpunkt einer Parabel. Bei f(x) = ax² + bx + c berechnet man ihn über die Scheitelpunktformel. Scheitelpunktform: f(x) = a(x − xₛ)² + yₛ.',
    example: 'f(x) = x²−4x+3  →  xₛ = 2,  yₛ = −1  →  S = (2 | −1)',
    tags: 'extrema scheitelpunkt parabel quadratisch'
  },

  // ── Krümmung & Wendepunkt ─────────────────────────────────────────
  {
    term: 'Wendepunkt',
    symbol: 'f\'\'(x₀)=0, Vorzeichenwechsel von f\'\'',
    def: 'Punkt, an dem die Kurve ihre Krümmungsrichtung wechselt (von konkav zu konvex oder umgekehrt). Notwendige Bedingung: f\'\'(x₀) = 0. Hinreichend: Vorzeichenwechsel von f\'\'.',
    example: 'f(x) = x³  →  Wendepunkt bei (0 | 0)',
    tags: 'krümmung wendepunkt'
  },
  {
    term: 'Konvex (linksgekrümmt)',
    symbol: 'f\'\'(x) > 0',
    def: 'Ein Graph ist auf einem Intervall konvex (nach unten offen, «Schüssel»), wenn die zweite Ableitung dort positiv ist. Jede Sekante liegt über dem Graphen.',
    example: 'f(x) = x²  ist überall konvex (f\'\'=2 > 0)',
    tags: 'krümmung konvex'
  },
  {
    term: 'Konkav (rechtsgekrümmt)',
    symbol: 'f\'\'(x) < 0',
    def: 'Ein Graph ist auf einem Intervall konkav (nach oben offen, «Kuppel»), wenn die zweite Ableitung dort negativ ist. Jede Sekante liegt unter dem Graphen.',
    example: 'f(x) = −x²  ist überall konkav (f\'\'=−2 < 0)',
    tags: 'krümmung konkav'
  },
  {
    term: 'Sattelpunkt (Terrassenpunkt)',
    symbol: 'f\'(x₀)=0, f\'\'(x₀)=0, kein Extremum',
    def: 'Stelle, an der f\'(x₀)=0 und f\'\'(x₀)=0, aber kein Vorzeichenwechsel von f\' vorliegt. Der Graph «zögert» kurz, steigt oder fällt aber weiter in dieselbe Richtung.',
    example: 'f(x) = x³  →  Sattelpunkt (= Wendepunkt) bei x = 0',
    tags: 'extrema sattelpunkt terrassenpunkt'
  },

  // ── Steigung & Ableitung ──────────────────────────────────────────
  {
    term: 'Steigung',
    symbol: 'm = Δy / Δx',
    def: 'Das Verhältnis von vertikaler Änderung (Δy) zu horizontaler Änderung (Δx) zwischen zwei Punkten. Bei linearen Funktionen ist die Steigung konstant.',
    example: 'Durch (1|3) und (4|9):  m = (9−3)/(4−1) = 6/3 = 2',
    tags: 'steigung ableitung'
  },
  {
    term: 'Differenzenquotient',
    symbol: '[f(x+h) − f(x)] / h',
    def: 'Die durchschnittliche Änderungsrate von f zwischen x und x+h. Geometrisch ist er die Steigung der Sekante durch (x | f(x)) und (x+h | f(x+h)).',
    example: 'f(x)=x²:  [f(x+h)−f(x)]/h = (2xh+h²)/h = 2x+h',
    tags: 'steigung ableitung differenzenquotient sekante'
  },
  {
    term: 'Ableitung (Differentialquotient)',
    symbol: 'f\'(x) = lim(h→0) [f(x+h)−f(x)]/h',
    def: 'Die momentane Änderungsrate von f an der Stelle x. Geometrisch ist sie die Steigung der Tangente an den Graphen in (x | f(x)). Wichtige Regeln: Potenzregel (xⁿ)\'=n·xⁿ⁻¹, Summenregel, Produktregel, Kettenregel.',
    example: 'f(x) = x³  →  f\'(x) = 3x²',
    tags: 'steigung ableitung differentialquotient'
  },
  {
    term: 'Tangente',
    symbol: 't(x) = f\'(x₀)·(x−x₀) + f(x₀)',
    def: 'Gerade, die den Graphen im Punkt (x₀ | f(x₀)) berührt. Die Steigung der Tangente ist gleich f\'(x₀). Die Tangente ist die beste lineare Näherung des Graphen an dieser Stelle.',
    example: 'f(x)=x², x₀=1:  t(x) = 2(x−1)+1 = 2x−1',
    tags: 'steigung tangente ableitung'
  },
  {
    term: 'Sekante',
    symbol: 'Steigung = [f(x₂)−f(x₁)]/(x₂−x₁)',
    def: 'Gerade, die den Graphen in zwei Punkten schneidet. Die Steigung der Sekante entspricht dem Differenzenquotienten — der durchschnittlichen Änderungsrate.',
    example: 'f(x)=x² durch (1|1) und (3|9):  m = (9−1)/(3−1) = 4',
    tags: 'steigung sekante ableitung'
  },
  {
    term: 'Steigungsdreieck',
    symbol: 'Δx (Ankathete), Δy (Gegenkathete)',
    def: 'Geometrische Darstellung der Steigung am Graphen: Man wählt zwei Punkte, zieht eine waagrechte Strecke (Δx) und eine senkrechte Strecke (Δy). Die Steigung ist m = Δy/Δx.',
    example: 'Bei m = 2/3 geht man 3 nach rechts und 2 nach oben.',
    tags: 'steigung dreieck'
  },
  {
    term: 'Ableitungsregeln',
    symbol: '',
    def: 'Potenzregel: (xⁿ)\' = n·xⁿ⁻¹\nFaktorregel: (c·f)\' = c·f\'\nSummenregel: (f±g)\' = f\'±g\'\nProduktregel: (f·g)\' = f\'·g + f·g\'\nKettenregel: (f(g(x)))\' = f\'(g(x))·g\'(x)',
    example: 'f(x) = sin(x²)  →  f\'(x) = cos(x²)·2x  (Kettenregel)',
    tags: 'ableitung regeln potenz produkt kette'
  },

  // ── Asymptoten ────────────────────────────────────────────────────
  {
    term: 'Asymptote',
    symbol: 'Abstand → 0  für  x → ±∞  oder  x → x₀',
    def: 'Eine Gerade, der sich der Graph beliebig nähert, ohne sie (in der Regel) zu erreichen. Es gibt vertikale, horizontale und schiefe Asymptoten.',
    example: 'f(x) = 1/x  hat bei x=0 eine vertikale und bei y=0 eine horizontale Asymptote.',
    tags: 'asymptote'
  },
  {
    term: 'Vertikale Asymptote (Pol)',
    symbol: 'x = x₀,  lim(x→x₀) |f(x)| = ∞',
    def: 'Senkrechte Gerade x = x₀, bei der f(x) betragsmässig über alle Grenzen wächst, wenn x gegen x₀ geht. Entsteht typischerweise, wenn der Nenner einer gebrochenrationalen Funktion null wird.',
    example: 'f(x) = 1/(x−3)  →  Vertikale Asymptote x = 3',
    tags: 'asymptote vertikal pol polstelle'
  },
  {
    term: 'Polstelle',
    symbol: 'Nenner(x₀) = 0,  Zähler(x₀) ≠ 0',
    def: 'Stelle, an der eine gebrochenrationale Funktion nicht definiert ist und gegen ±∞ strebt. Von links und rechts kann die Funktion unterschiedliche Vorzeichen haben.',
    example: 'f(x) = 1/x  →  Polstelle bei x = 0',
    tags: 'asymptote pol polstelle'
  },
  {
    term: 'Horizontale Asymptote',
    symbol: 'y = k,  lim(x→±∞) f(x) = k',
    def: 'Waagrechte Gerade y = k, der sich der Graph für x → +∞ oder x → −∞ annähert. Tritt auf, wenn Zähler- und Nennergrad einer gebrochenrationalen Funktion gleich sind.',
    example: 'f(x) = (2x+1)/(x−1)  →  Horizontale Asymptote y = 2',
    tags: 'asymptote horizontal'
  },
  {
    term: 'Schiefe (oblique) Asymptote',
    symbol: 'y = mx + b',
    def: 'Eine nicht-waagrechte, nicht-senkrechte Gerade, der sich der Graph für x → ±∞ annähert. Tritt auf, wenn der Zählergrad genau um 1 grösser ist als der Nennergrad (Polynomdivision).',
    example: 'f(x) = (x²+1)/x = x + 1/x  →  schiefe Asymptote y = x',
    tags: 'asymptote schief oblique'
  },

  // ── Symmetrie ─────────────────────────────────────────────────────
  {
    term: 'Achsensymmetrie (gerade Funktion)',
    symbol: 'f(−x) = f(x)  für alle x',
    def: 'Der Graph ist symmetrisch zur y-Achse. Eine Funktion ist gerade, wenn f(−x) = f(x) gilt. Alle Terme haben gerade Exponenten.',
    example: 'f(x) = x², f(x) = cos(x), f(x) = |x|',
    tags: 'symmetrie achsensymmetrie gerade'
  },
  {
    term: 'Punktsymmetrie (ungerade Funktion)',
    symbol: 'f(−x) = −f(x)  für alle x',
    def: 'Der Graph ist punktsymmetrisch zum Ursprung (0|0). Eine Funktion ist ungerade, wenn f(−x) = −f(x) gilt. Alle Terme haben ungerade Exponenten.',
    example: 'f(x) = x³, f(x) = sin(x), f(x) = x',
    tags: 'symmetrie punktsymmetrie ungerade'
  },

  // ── Funktionstypen ────────────────────────────────────────────────
  {
    term: 'Lineare Funktion',
    symbol: 'f(x) = mx + b',
    def: 'Polynomfunktion 1. Grades. Der Graph ist eine Gerade mit Steigung m und y-Achsenabschnitt b. Konstante Steigung: f\'(x) = m. Keine Extrema, kein Wendepunkt.',
    example: 'f(x) = 2x − 3  →  Steigung m=2, y-Achsenabschnitt b=−3',
    tags: 'linear funktion gerade'
  },
  {
    term: 'Quadratische Funktion (Parabel)',
    symbol: 'f(x) = ax² + bx + c  (a ≠ 0)',
    def: 'Polynomfunktion 2. Grades. Der Graph ist eine Parabel. Für a > 0: nach oben offen; a < 0: nach unten offen. Scheitelpunkt bei xₛ = −b/(2a). Hat genau einen Wendepunkt? Nein — Parabeln haben keinen Wendepunkt.',
    example: 'f(x) = x²−4x+3  →  S=(2|−1), Nullstellen x=1 und x=3',
    tags: 'quadratisch parabel funktion'
  },
  {
    term: 'Polynomfunktion',
    symbol: 'f(x) = aₙxⁿ + … + a₁x + a₀',
    def: 'Summe von Termen der Form aₖxᵏ mit ganzzahligen, nicht-negativen Exponenten. Grad n bestimmt das globale Verhalten. Überall definiert und stetig differenzierbar.',
    example: 'f(x) = 2x³ − x + 5  (Grad 3 = kubisch)',
    tags: 'polynom funktion'
  },
  {
    term: 'Potenzfunktion',
    symbol: 'f(x) = xⁿ  (n ∈ ℝ)',
    def: 'Für n gerade: achsensymmetrisch, Definitionsbereich ℝ. Für n ungerade: punktsymmetrisch, Definitionsbereich ℝ. Für n < 0: Pol bei x = 0, hyperbelartig.',
    example: 'f(x) = x², f(x) = x³, f(x) = x⁻¹ = 1/x',
    tags: 'potenz funktion'
  },
  {
    term: 'Gebrochen-rationale Funktion',
    symbol: 'f(x) = p(x)/q(x)',
    def: 'Quotient zweier Polynome p(x) (Zähler) und q(x) (Nenner). Definiert für alle x mit q(x) ≠ 0. Nullstellen des Nenners ergeben Polstellen oder hebbare Definitionslücken.',
    example: 'f(x) = (x+1)/(x−2)  →  Pol bei x=2, Nullstelle bei x=−1',
    tags: 'gebrochen rational funktion'
  },
  {
    term: 'Exponentialfunktion',
    symbol: 'f(x) = a · bˣ  (b > 0, b ≠ 1)',
    def: 'Funktion, bei der die Variable im Exponenten steht. Für b > 1: exponentielles Wachstum. Für 0 < b < 1: exponentieller Zerfall. Immer positiv, keine Nullstelle. Definitionsbereich: ℝ.',
    example: 'f(x) = 2ˣ: Verdoppelung mit jeder Einheit. f(x) = eˣ: natürliche Basis e ≈ 2.718',
    tags: 'exponential funktion wachstum zerfall'
  },
  {
    term: 'Logarithmusfunktion',
    symbol: 'f(x) = logₐ(x),  f(x) = ln(x)',
    def: 'Umkehrfunktion der Exponentialfunktion. ln(x) = log_e(x). Definitionsbereich: x > 0. Wertemenge: ℝ. Logarithmusgesetze: ln(a·b)=ln(a)+ln(b), ln(aⁿ)=n·ln(a).',
    example: 'ln(e) = 1,  ln(1) = 0,  log₁₀(100) = 2',
    tags: 'logarithmus funktion'
  },
  {
    term: 'Betragsfunktion',
    symbol: 'f(x) = |x|',
    def: 'Gibt den absoluten (nicht-negativen) Wert von x zurück: |x| = x für x ≥ 0, |x| = −x für x < 0. Graph: V-förmig mit Knick bei x = 0. Nicht differenzierbar bei x = 0.',
    example: '|−3| = 3,  |5| = 5,  |0| = 0',
    tags: 'betrag funktion absolut'
  },
  {
    term: 'Umkehrfunktion',
    symbol: 'f⁻¹,  f⁻¹(f(x)) = x',
    def: 'Die Umkehrfunktion f⁻¹ «dreht» die Zuordnung um: sie ordnet jedem y-Wert wieder den ursprünglichen x-Wert zu. Existiert, wenn f streng monoton (bijektiv) ist. Graphisch: Spiegelung an der 1. Winkelhalbierenden.',
    example: 'f(x) = 2x+1  →  f⁻¹(x) = (x−1)/2',
    tags: 'umkehrfunktion'
  },

  // ── Trigonometrie ─────────────────────────────────────────────────
  {
    term: 'Sinusfunktion',
    symbol: 'f(x) = sin(x)',
    def: 'Trigonometrische Funktion mit Periode 2π, Amplitude 1, Wertemenge [−1, 1]. sin(0)=0, sin(π/6)=1/2, sin(π/4)=√2/2, sin(π/3)=√3/2, sin(π/2)=1. Ungerade: sin(−x)=−sin(x).',
    example: 'sin(π/3) = √3/2 ≈ 0.866',
    tags: 'trigonometrie sinus sin'
  },
  {
    term: 'Kosinusfunktion',
    symbol: 'f(x) = cos(x)',
    def: 'Trigonometrische Funktion mit Periode 2π, Amplitude 1, Wertemenge [−1, 1]. cos(0)=1, cos(π/6)=√3/2, cos(π/4)=√2/2, cos(π/3)=1/2, cos(π/2)=0. Gerade: cos(−x)=cos(x).',
    example: 'cos(π/3) = 1/2',
    tags: 'trigonometrie kosinus cos'
  },
  {
    term: 'Tangensfunktion',
    symbol: 'f(x) = tan(x) = sin(x)/cos(x)',
    def: 'Trigonometrische Funktion mit Periode π. Pol bei x = π/2 + kπ. tan(0)=0, tan(π/6)=√3/3=1/√3, tan(π/4)=1, tan(π/3)=√3. Ungerade: tan(−x)=−tan(x).',
    example: 'tan(π/4) = 1,  tan(π/3) = √3 ≈ 1.732',
    tags: 'trigonometrie tangens tan'
  },
  {
    term: 'Einheitskreis',
    symbol: 'x² + y² = 1',
    def: 'Kreis mit Radius 1 um den Ursprung. Für einen Winkel α gilt: cos(α) = x-Koordinate, sin(α) = y-Koordinate des Punktes auf dem Einheitskreis. Grundlage aller Tabellenwerte.',
    example: 'Winkel π/3 (60°): Punkt (1/2 | √3/2) auf dem Einheitskreis',
    tags: 'trigonometrie einheitskreis'
  },
  {
    term: 'Amplitude',
    symbol: 'a  bei  f(x) = a·sin(bx+c)+d',
    def: 'Die halbe Schwingungsbreite einer periodischen Funktion. Gibt an, wie weit der Graph maximal vom Mittelwert (Mittellinie) abweicht.',
    example: 'f(x) = 3·sin(x)  →  Amplitude = 3, Wertemenge [−3, 3]',
    tags: 'trigonometrie amplitude periode'
  },
  {
    term: 'Periode',
    symbol: 'T = 2π/b  bei  f(x) = sin(bx)',
    def: 'Die kleinste positive Zahl T, nach der sich der Funktionswert wiederholt: f(x+T) = f(x). Für sin und cos: T = 2π/b. Für tan: T = π/b.',
    example: 'f(x) = sin(2x)  →  b=2, T = 2π/2 = π',
    tags: 'trigonometrie periode'
  },
  {
    term: 'Phasenverschiebung',
    symbol: 'c  bei  f(x) = sin(x − c)',
    def: 'Horizontale Verschiebung einer Schwingungsfunktion. Positives c verschiebt nach rechts, negatives c nach links.',
    example: 'f(x) = sin(x − π/2) = cos(x)  →  um π/2 nach rechts verschoben',
    tags: 'trigonometrie phase phasenverschiebung'
  },
  {
    term: 'Pythagoreischer Lehrsatz (Trigonometrie)',
    symbol: 'sin²(x) + cos²(x) = 1',
    def: 'Grundlegende Identität der Trigonometrie, direkt aus der Definition über den Einheitskreis. Gilt für alle x ∈ ℝ.',
    example: 'sin²(π/4) + cos²(π/4) = 1/2 + 1/2 = 1  ✓',
    tags: 'trigonometrie pythagoras identität'
  },

  // ── Integral & Stammfunktion ──────────────────────────────────────
  {
    term: 'Stammfunktion',
    symbol: 'F\'(x) = f(x),  F = ∫f(x)dx',
    def: 'Eine Funktion F, deren Ableitung die Ausgangsfunktion f ergibt. Ist nicht eindeutig: F(x) + C ist ebenfalls eine Stammfunktion (C: Integrationskonstante). Grundregel: ∫xⁿdx = xⁿ⁺¹/(n+1) + C',
    example: 'f(x)=3x²  →  F(x)=x³+C',
    tags: 'integral stammfunktion integration'
  },
  {
    term: 'Bestimmtes Integral',
    symbol: '∫[a,b] f(x)dx = F(b) − F(a)',
    def: 'Berechnet den vorzeichenbehafteten Flächeninhalt zwischen dem Graphen und der x-Achse im Intervall [a,b]. Bereiche oberhalb der x-Achse zählen positiv, darunter negativ.',
    example: '∫[0,2] x dx = [x²/2]₀² = 2 − 0 = 2',
    tags: 'integral bestimmt fläche'
  },
  {
    term: 'Flächeninhalt zwischen Graphen',
    symbol: 'A = ∫[a,b] |f(x) − g(x)| dx',
    def: 'Fläche zwischen zwei Funktionsgraphen. Man zieht die untere Funktion von der oberen ab und integriert. Vorzeichen beachten — bei Vorzeichenwechsel der Differenz aufteilen.',
    example: 'Fläche zwischen f(x)=x² und g(x)=x: A = ∫[0,1] (x−x²)dx = 1/6',
    tags: 'integral fläche'
  },

  // ── Grenzwert ─────────────────────────────────────────────────────
  {
    term: 'Grenzwert',
    symbol: 'lim(x→a) f(x) = L',
    def: 'f(x) nähert sich dem Wert L, wenn x sich dem Wert a annähert (ohne notwendigerweise gleich a zu sein). Einseitige Grenzwerte: lim(x→a⁺) von rechts, lim(x→a⁻) von links.',
    example: 'lim(x→0) sin(x)/x = 1  (wichtiger Grenzwert)',
    tags: 'grenzwert limes'
  },
  {
    term: 'Stetigkeit',
    symbol: 'lim(x→a) f(x) = f(a)',
    def: 'Eine Funktion ist stetig in a, wenn der Grenzwert existiert und gleich dem Funktionswert f(a) ist — keine Sprünge, Lücken oder Pole. Polynomfunktionen sind überall stetig.',
    example: 'f(x) = 1/x  ist stetig auf ℝ\\{0}, aber nicht stetig in x=0.',
    tags: 'stetigkeit stetig'
  },

  // ── Diskriminante ─────────────────────────────────────────────────
  {
    term: 'Diskriminante',
    symbol: 'D = b² − 4ac  (für ax²+bx+c=0)',
    def: 'Bestimmt die Anzahl reeller Lösungen einer quadratischen Gleichung. D > 0: zwei reelle Lösungen. D = 0: genau eine (doppelte) Lösung. D < 0: keine reelle Lösung.',
    example: 'x²−5x+6=0: D=25−24=1>0  →  zwei Lösungen: x=2 und x=3',
    tags: 'diskriminante quadratisch nullstelle'
  },
  {
    term: 'Mitternachtsformel (abc-Formel)',
    symbol: 'x₁,₂ = (−b ± √D) / (2a)',
    def: 'Allgemeine Lösungsformel für quadratische Gleichungen ax²+bx+c=0. Gibt beide Lösungen auf einmal mit D=b²−4ac (Diskriminante).',
    example: '2x²+3x−2=0: D=9+16=25, x₁=(−3+5)/4=1/2, x₂=(−3−5)/4=−2',
    tags: 'quadratisch mitternachtsformel nullstelle'
  },
  {
    term: 'Vieta\'scher Wurzelsatz',
    symbol: 'x₁+x₂ = −b/a,  x₁·x₂ = c/a',
    def: 'Beziehung zwischen den Nullstellen x₁, x₂ und den Koeffizienten von ax²+bx+c. Nützlich um Nullstellen zu erraten oder zu verifizieren.',
    example: 'x²−5x+6: Summe=5, Produkt=6  →  x₁=2, x₂=3 (da 2+3=5, 2·3=6)',
    tags: 'quadratisch vieta nullstelle'
  },
];

// ── Rendering & Suche ────────────────────────────────────────────────

function renderBegriffe(filter) {
  const el = document.getElementById('begriffe-list');
  if (!el) return;
  const q = (filter || '').toLowerCase().trim();

  const matches = BEGRIFFE.filter(b => {
    if (!q) return true;
    return b.term.toLowerCase().includes(q)
        || b.def.toLowerCase().includes(q)
        || (b.tags || '').toLowerCase().includes(q)
        || (b.example || '').toLowerCase().includes(q);
  });

  if (matches.length === 0) {
    el.innerHTML = '<span style="font-size:11px;color:var(--text-muted);">Kein Begriff gefunden.</span>';
    return;
  }

  el.innerHTML = '';
  matches.forEach(b => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin-bottom:6px;border-radius:6px;overflow:hidden;border:1px solid var(--border);';

    // Header (klickbar zum Auf-/Zuklappen)
    const hdr = document.createElement('div');
    hdr.style.cssText =
      'display:flex;justify-content:space-between;align-items:center;' +
      'padding:5px 9px;cursor:pointer;background:var(--bg-btn);user-select:none;';
    hdr.innerHTML =
      `<span style="font-weight:600;font-size:11.5px;color:var(--text);">${b.term}</span>` +
      `<span class="bgr-arrow" style="font-size:10px;color:var(--text-muted);transition:transform .18s;">▼</span>`;

    // Body (Definition + Formel + Beispiel)
    const body = document.createElement('div');
    body.style.cssText =
      'display:none;padding:7px 10px 8px;font-size:11px;line-height:1.65;' +
      'color:var(--text);background:var(--bg-range);';

    if (b.symbol) {
      body.innerHTML +=
        `<div style="font-family:monospace;font-size:10.5px;color:#378ADD;margin-bottom:5px;`+
        `background:var(--bg-btn);padding:3px 7px;border-radius:4px;display:inline-block;">${b.symbol}</div><br>`;
    }
    body.innerHTML += `<div style="margin-bottom:${b.example?'5px':'0'};white-space:pre-wrap;">${b.def}</div>`;
    if (b.example) {
      body.innerHTML +=
        `<div style="font-size:10.5px;color:var(--text-muted);border-top:1px solid var(--border);`+
        `margin-top:5px;padding-top:4px;font-family:monospace;white-space:pre-wrap;">` +
        `<span style="font-weight:600;">Bsp.:</span> ${b.example}</div>`;
    }

    // Toggle
    let open = !!q;  // bei Suche alles aufgeklappt
    if (open) { body.style.display = 'block'; hdr.querySelector('.bgr-arrow').style.transform = 'rotate(180deg)'; }
    hdr.addEventListener('click', () => {
      open = !open;
      body.style.display = open ? 'block' : 'none';
      hdr.querySelector('.bgr-arrow').style.transform = open ? 'rotate(180deg)' : '';
    });

    wrap.append(hdr, body);
    el.appendChild(wrap);
  });
}

// Beim Laden initialisieren
(function initBegriffe() {
  const inp = document.getElementById('begriffe-search');
  if (inp) {
    inp.addEventListener('input', () => renderBegriffe(inp.value));
  }
  renderBegriffe('');
})();
