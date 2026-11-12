// ═══════════════════════════════════════════════════════════════════
// 33_topics.js — Themenübersicht, Suche, Willkommen, Hilfe und Hinweise
//
// Die Übersicht (#topics) liegt über der ganzen Fläche: Gruppen mit Kacheln (Symbol, Titel,
// kurze Beschreibung, ausklappbare Liste der Unterthemen) und ein Suchfeld, das über Titel, Ansichten und Stichworte sucht und direkt in die
// passende Ansicht springt. Dazu: Willkommen beim ersten Besuch, Hilfe «?» in der Kopfzeile, Hinweis unten in der
// Seitenleiste («Anderes Thema gesucht?») und ein kurzer Tipp im Bild beim Einstieg in ein Thema.
// Umgebungen und Wechsel: 32_env.js (ENV_LIST, envSwitch). Ansichten der Umgebungen: *_VIEWS/*_MODES der Module.
// Alle Texte deutsch; die Oberflächenübersetzung (23_autotranslate.js) übersetzt sie wie alle anderen.
// ═══════════════════════════════════════════════════════════════════

// Gruppen der Übersicht
const TOPIC_GROUPS = [
  { id: 'fn', title: 'Funktionen', envs: ['intro', 'func', 'lin', 'quad', 'pow', 'exp', 'trig', 'inv'] },
  { id: 'ana', title: 'Analysis', envs: ['diff', 'int', 'seq'] },
  { id: 'alg', title: 'Algebra', envs: ['set', 'alg'] },
  { id: 'geo', title: 'Geometrie', envs: ['geo', 'sim', '3d'] },
  { id: 'sto', title: 'Stochastik', envs: ['stat', 'prob'] },
  { id: 'app', title: 'Anwendungen', envs: ['fin', 'lo'] }
];
// Farbe je Themengruppe (Startseite: Symbolkachel, Gruppentitel, Schnellwahl)
const TOPIC_COL = { fn: '#3d7bf7', ana: '#7c5cf0', alg: '#e8590c', geo: '#12a150', sto: '#d6336c', app: '#c98a00' };
// Suchvorschläge unter dem Suchfeld der Startseite: [Stichwort, Themengruppe]
const TOPIC_SUGG = [['Parabel', 'fn'], ['Steigung', 'fn'], ['Sinus', 'fn'], ['Logarithmus', 'fn'], ['Tangente', 'ana'], ['Integral', 'ana'], ['Binomische Formeln', 'alg'], ['Strahlensatz', 'geo'], ['Vektoren', 'geo'], ['Normalverteilung', 'sto'], ['Baumdiagramm', 'sto'], ['Zinseszins', 'app']];
// Stichworte je Ansicht (deutsch; die Suche vergleicht auch mit den angezeigten, übersetzten Titeln)
const TOPIC_KW = {
  func: { func: 'Funktion zeichnen Graph Funktionsgraph Werkzeug beliebige Funktion Parameter Schieber Nullstellen Extrema Ableitung Stammfunktion', bars: 'Balken Stellen Punkte Abstand Funktionswerte Schrittweite Wertetabelle' },
  exp: { grow: 'Exponentialfunktion Wachstum Zerfall Basis Faktor Prozent Halbwertszeit Verdoppelungszeit Asymptote lineares Wachstum', e: 'Eulersche Zahl e Grenzwert Tangente Steigung e hoch x Ableitung', log: 'Logarithmus Logarithmusfunktion Umkehrfunktion ln lg Logarithmengesetze Basiswechsel Spiegelung', eq: 'Exponentialgleichung lösen logarithmieren Zinseszins Bevölkerung Bakterien Medikament radioaktiver Zerfall Abkühlung Anwendung' },
  trig: { circ: 'Einheitskreis Sinus Kosinus Winkel Bogenmass Grad Radiant besondere Winkel 30 45 60 Quadrant Sinuskurve', gen: 'allgemeine Sinusfunktion Amplitude Periode Phase Phasenverschiebung Mittellinie Frequenz Schwingung Kosinusfunktion Strecken Verschieben', tan: 'Tangens Polstelle Asymptote Steigung Beziehungen sin² + cos² = 1 Symmetrie Periode π Tangente am Einheitskreis' },
  inv: { mirror: 'Umkehrfunktion Begriff Spiegelung Winkelhalbierende y = x Wertetabelle rückwärts Koordinaten tauschen Definitionsbereich Wertebereich', test: 'Umkehrbarkeit umkehrbar streng monoton waagrechte Gerade Einschränkung Definitionsbereich einschränken Ast Scheitel injektiv', calc: 'Umkehrfunktion berechnen nach x auflösen Variablen vertauschen Rechenweg Probe Verkettung', pairs: 'bekannte Paare Quadrat Wurzel Potenz Logarithmus Exponential ln e hoch x arcsin arccos arctan Kehrwert selbstinvers' },
  intro: { map: 'Funktion Zuordnung Wertetabelle einsetzen Funktionswert Argument Schreibweise Graph Punkte Einführung Einstieg', def: 'Funktionsbegriff Definitionsbereich Wertebereich Nullstellen y-Achsenabschnitt steigend fallend Monotonie Hochpunkt Tiefpunkt senkrechte Gerade Test Kreis keine Funktion', app: 'Anwendungen Einheiten Grössen Weg Zeit Fall Wurf Temperatur Tarif Bremsweg Abkühlung Fläche ablesen' },
  sim: { map: 'Ähnlichkeit ähnlich Ähnlichkeitsabbildung zentrische Streckung Streckfaktor k Zentrum Drehung Spiegelung Verschiebung Punktspiegelung Seitenverhältnis Bild Original kongruent Fläche', test: 'ähnliche Dreiecke Winkel vergleichen entsprechende Ecken Seitenverhältnisse gleich ähnlich oder nicht Zuordnung', ray: 'Strahlensatz Strahlensätze erster zweiter Parallelen V-Figur X-Figur Verhältnisgleichung fehlende Länge', right: 'rechtwinkliges Dreieck Höhe Höhensatz Kathetensatz Thaleskreis drei ähnliche Dreiecke Pythagoras' },
  lin: { par: 'Steigung y-Achsenabschnitt Steigungsdreieck Wertetabelle Gerade m q Steigungswinkel', two: 'Gerade durch zwei Punkte Punkt und Steigung Geradengleichung aufstellen Parallele Senkrechte', sys: 'Schnittpunkt zweier Geraden Gleichsetzen Einsetzen Additionsverfahren Gleichungssystem parallel identisch Schnittwinkel', app: 'Anwendung Sachaufgabe Tarife Handy Taxi Abo Break-even Bewegung Treffpunkt Verfolgung Zeit Ort', perp: 'Nullstelle Senkrechte Lotfusspunkt Abstand Mittelsenkrechte orthogonal rechtwinklig' },
  quad: { par: 'Parabel Standardform Scheitelform Nullstellenform Normalparabel Streckfaktor Öffnung Parameter a b c', vtx: 'Scheitelpunkt quadratische Ergänzung Verschiebung Strecken Minimum Maximum Symmetrieachse', zer: 'Nullstellen Diskriminante Mitternachtsformel Lösungsformel abc-Formel pq-Formel Vieta quadratische Gleichung', cmb: 'Parabel und Gerade Sekante Tangente Passante Schnittpunkte Berührpunkt Parabel durch drei Punkte Scheitel und Punkt' },
  pow: { fam: 'Potenzfunktion x hoch n Exponent gerade ungerade Symmetrie Spiegelpunkt', neg: 'negativer Exponent Hyperbel 1/x Asymptote Definitionslücke Polstelle Kehrwert', root: 'Wurzelfunktion Quadratwurzel Kubikwurzel Umkehrfunktion Spiegelung Winkelhalbierende rationaler Exponent Potenzschreibweise', gen: 'allgemeine Form Strecken Spiegeln Verschieben Parameter a v h Definitionsbereich Wertebereich Grundfunktion', eq: 'Potenzgleichung Wurzelgleichung lösen Fallunterscheidung x hoch n gleich c' },
  diff: { tan: 'Sekante Tangente Differenzenquotient Differentialquotient Steigung Ableitung Grenzwert h gegen 0 momentane Änderungsrate', gr: 'graphisches Ableiten Ableitungsfunktion Steigungsfunktion f strich Skizze', rg: 'Ableitungsregeln Potenzregel Produktregel Quotientenregel Kettenregel Summenregel ableiten', kd: 'Kurvendiskussion Extrema Hochpunkt Tiefpunkt Wendepunkt Monotonie Krümmung Nullstellen Symmetrie' },
  int: { sum: 'Obersumme Untersumme Riemann Integral Fläche Streifen Rechtecke', hs: 'Integralfunktion Hauptsatz Stammfunktion bestimmtes Integral Grenzen', rg: 'Stammfunktion integrieren Regeln Potenzregel unbestimmtes Integral Konstante', ar: 'Fläche zwischen Kurven Flächeninhalt Graphen eingeschlossene Fläche', rot: 'Rotationskörper Volumen Rotationsvolumen Drehkörper Scheiben' },
  seq: { sig: 'Summenzeichen Sigma untere Grenze obere Grenze Summand Laufvariable Index ausschreiben Indexverschiebung', def: 'Folge Glieder explizit rekursiv Startwert Vorgänger Nachfolger Streichhölzer Muster', ari: 'arithmetische Folge Differenz d lineares Wachstum Kinosaal', geo: 'geometrische Folge Quotient q exponentielles Wachstum Zerfall Papier falten ab welchem Glied Logarithmus', sum: 'Reihe Summenzeichen Partialsumme arithmetische Reihe Gauss geometrische Reihe Schachbrett Summe', lim: 'Grenzwert Konvergenz konvergent divergent Epsilon Streifen unendliche geometrische Reihe halber Weg', ind: 'vollständige Induktion Induktionsanfang Induktionsschritt Domino Beweis Summenformel Primzahl Gegenbeispiel' },
  alg: { expand: 'Ausmultiplizieren Distributivgesetz binomische Formeln Klammern auflösen', factor: 'Faktorisieren Ausklammern Linearfaktoren Satz von Vieta', complete: 'quadratische Ergänzung Scheitelform Quadrat', binom: 'binomischer Lehrsatz Pascalsches Dreieck Binomialkoeffizient', pow: 'Potenzgesetze Wurzelgesetze Potenzen Wurzeln rationale Exponenten', log: 'Logarithmen Logarithmengesetze Basiswechsel', frac: 'Bruchterme kürzen erweitern Hauptnenner Definitionsmenge', eq: 'Gleichungen lösen Äquivalenzumformung Waage Bruchgleichung Wurzelgleichung quadratische Gleichung', sys: 'Gleichungssysteme Additionsverfahren Einsetzungsverfahren Gleichsetzungsverfahren Gauss' },
  geo: { _: 'Konstruktion Dreieck Kreis Gerade Strecke Winkel Mittelsenkrechte Winkelhalbierende Thaleskreis Umkreis Inkreis Höhe Schwerpunkt Pythagoras Tangente Ellipse' },
  '3d': { pl: 'Ebene Koordinatenform Normalenvektor Achsenabschnitte Spurgeraden Schnittgerade Schnittwinkel Raum Gleichungssystem', vec: 'Vektor Punkt Ortsvektor Verbindungsvektor Betrag Länge Mittelpunkt Komponenten', line: 'Gerade Parameterform Richtungsvektor windschief parallel identisch Schnittpunkt Lage', dot: 'Skalarprodukt Winkel senkrecht orthogonal Vektorprodukt Kreuzprodukt Parallelogramm', dist: 'Abstand Punkt Ebene Gerade Hessesche Normalform Lotfusspunkt Lot', sph: 'Kugel Kugelgleichung Radius Mittelpunkt Schnittkreis Tangentialebene' },
  stat: { dice: 'Würfel Münze Wahrscheinlichkeit relative Häufigkeit Gesetz der grossen Zahlen', dice2: 'Augensumme zwei Würfel Verteilung', galton: 'Galtonbrett Binomialverteilung Glockenkurve', pi: 'Monte Carlo Kreiszahl Zufallspunkte', buffon: 'Buffon Nadel Nadelexperiment', monty: 'Ziegenproblem Monty Hall bedingte Wahrscheinlichkeit Türen', birthday: 'Geburtstagsparadoxon Gegenereignis', walk: 'Zufallsspaziergang Random Walk Irrfahrt', clt: 'Zentraler Grenzwertsatz Mittelwert Stichprobe Normalverteilung', ci: 'Konfidenzintervall Vertrauensintervall Schätzen Stichprobe', bayes: 'Bayes Test Paradox bedingte Wahrscheinlichkeit falsch positiv Vierfeldertafel', urn: 'Urne Kugeln ziehen mit ohne Zurücklegen Baumdiagramm hypergeometrisch Pfadregel' },
  fin: { line: 'Zeitstrahl Konto Aufzinsen Abzinsen Zahlung Zeitwert', sum: 'Summenzeichen Rente Reihe', save: 'Sparplan Rente vorschüssig nachschüssig Endwert Raten', loan: 'Kredit Tilgungsplan Annuität Zins Hypothek Restschuld', value: 'Zeitwert Zinseszins Barwert Endwert Zinsfaktor', march: 'Marchzins Kalender Tage Zinstage 30/360', conform: 'konformer Zins unterjährig effektiver Zins Zinsperiode' },
  set: { iv: 'Intervall Zahlengerade offen geschlossen halboffen Ungleichung Mengenschreibweise eckige Klammer unendlich', op: 'Schnittmenge Vereinigung Differenz Komplement Mengenoperation Intervalle und oder ohne', venn: 'Venn-Diagramm Mengenoperation drei Mengen Grundmenge Schnitt Vereinigung Differenz Komplement De Morgan Anzahlen Elemente schraffieren', ex: 'Übungen Aufgaben Intervall Venn-Diagramm schraffieren Elemente Anzahlen üben' },
  prob: { data: 'Datenanalyse Mittelwert Median Modus Quartile Boxplot Histogramm Kreisdiagramm Säulendiagramm Standardabweichung Spannweite Statistik', tree: 'Baumdiagramm Pfadregel Produktregel Summenregel Urne ohne Zurücklegen mit Zurücklegen mehrstufig', bin: 'Binomialverteilung Bernoulli-Kette Treffer Binomialkoeffizient mindestens höchstens', lim: 'Grenzwert Grenzübergang Herleitung Poisson Normalverteilung de Moivre Laplace n gegen unendlich Näherung Binomialverteilung stetig diskret Glockenkurve', poi: 'Poissonverteilung Poisson seltene Ereignisse Lambda λ mittlere Anzahl Anrufe Druckfehler Zerfall Näherung Binomialverteilung', ev: 'Zufallsgrösse Erwartungswert faires Spiel Einsatz Gewinn Glücksrad', norm: 'Normalverteilung Glockenkurve Standardisieren z-Wert Phi Sigma-Regeln σ-Bereiche 68 95 99.7 Prozent 1.96 Quantil linksseitig rechtsseitig beidseitig einseitig zweiseitig Standardabweichung Vertrauensbereich', test: 'Hypothesentest Nullhypothese Signifikanzniveau Ablehnungsbereich Fehler 1. Art einseitig zweiseitig' },
  lo: { ung1: 'lineare Ungleichung eine Variable Intervall Zeichen umkehren negative Zahl Handyabo Lösungsmenge', half: 'Ungleichung zwei Variablen Halbebene Grenzgerade Testpunkt gestrichelt durchgezogen Kino Popcorn', poly: 'Ungleichungssystem Planungspolygon Eckpunkte Nichtnegativität ganzzahlig Computerhersteller', opt: 'Zielfunktion Optimum Maximum Minimum Niveaulinie Eckpunktprinzip Gewinn Kosten Schreinerei Textaufgabe lineare Optimierung' }
};
// Kurzbeschreibung je Thema für die Kacheln der Startseite (zwei Sätze)
const TOPIC_ABOUT = {
  intro: 'Was ist eine Funktion? Werte einsetzen, die Wertetabelle füllen und zusehen, wie aus Punkten ein Graph wird. Dazu Definitions- und Wertebereich.',
  func: 'Das freie Werkzeug: eine beliebige Funktion eintippen und Nullstellen, Extrema, Ableitung und Stammfunktion untersuchen, Parameter mit Schiebern.',
  lin: 'Geraden verstehen und aufstellen: Steigung und y-Achsenabschnitt, Gerade durch zwei Punkte und Schnittpunkte. Dazu Anwendungen wie Tarife und Bewegungen.',
  quad: 'Parabeln in drei Formen: Scheitelpunkt und quadratische Ergänzung, Nullstellen mit der Lösungsformel, Parabel und Gerade. Alles lässt sich im Bild ziehen.',
  pow: 'Von x² über 1/x bis √x: wie der Exponent die Form des Graphen bestimmt, Wurzeln als Umkehrung und die allgemeine Form mit Strecken und Verschieben.',
  exp: 'Wachstum und Zerfall mit a·bˣ, die Zahl e und der Logarithmus als Umkehrung. Exponentialgleichungen Schritt für Schritt, mit Zins und Zerfall.',
  trig: 'Sinus und Kosinus am Einheitskreis, Grad und Bogenmass. Die allgemeine Sinusfunktion mit Amplitude, Periode und Verschiebung, dazu der Tangens.',
  inv: 'Umkehren heisst spiegeln an der Geraden y\u00a0=\u00a0x. Wann eine Funktion umkehrbar ist, wie man die Umkehrfunktion berechnet und welche Paare man kennen sollte.',
  diff: 'Von der Sekante zur Tangente: Differenzenquotient und Ableitung, graphisches Ableiten, die Ableitungsregeln und eine vollständige Kurvendiskussion.',
  int: 'Flächen mit Rechtecken annähern, Integralfunktion und Hauptsatz, Stammfunktionen mit Regeln. Dazu Flächen zwischen Kurven und Rotationskörper.',
  seq: 'Folgen explizit und rekursiv, arithmetisch und geometrisch, Reihen mit dem Summenzeichen, Grenzwerte und vollständige Induktion – alles als Punkte zum Ziehen.',
  alg: 'Termumformungen als Bild: binomische Formeln, Ausmultiplizieren und Faktorisieren, Potenzen, Wurzeln und Logarithmen, Bruchterme und Gleichungen.',
  geo: 'Konstruieren wie mit Zirkel und Lineal: Punkte, Geraden, Kreise und Dreiecke mit ihren besonderen Linien und Punkten.',
  sim: 'Ein fixes Dreieck und sein Bild nach Verschiebung, Drehung um den Ursprung, Spiegelung an der x- oder y-Achse und zentrischer Streckung: Die Seitenverhältnisse stehen als Brüche daneben. Dazu Strahlensätze und das rechtwinklige Dreieck mit Höhe.',
  '3d': 'Vektorgeometrie im Raum: Ebenen entdecken, Punkte und Vektoren, Geraden, Skalarprodukt und Winkel, Abstände und Kugel. Den Raum drehst du mit der Maus.',
  stat: 'Zufallsexperimente zum Mitverfolgen: Würfel, Galtonbrett, Ziegenproblem und mehr. Relative Häufigkeiten nähern sich der Wahrscheinlichkeit.',
  fin: 'Geld und Zeit: Zeitstrahl und Konten, Sparpläne, Kredite mit Tilgungsplan, Marchzins und konformer Zins, jeweils mit vollständigem Rechenweg.',
  set: 'Intervalle auf der Zahlengeraden in drei Schreibweisen: als Intervall, als Ungleichung und in Mengenschreibweise. Dazu Schnittmenge, Vereinigung, Differenz und Komplement von zwei Intervallen.',
  prob: 'Statistik und Stochastik zum Rechnen: Kennwerte und Diagramme einer Datenreihe, Baumdiagramme, Binomial- und Normalverteilung, Erwartungswert und Hypothesentest, jeweils mit Rechenweg.',
  lo: 'Vom Text zum Optimum: Ungleichungen als Halbebenen, Planungspolygon mit Eckpunkten und eine Niveaulinie, die du bis zum Optimum verschiebst.'
};
// Tipp im Bild beim Einstieg in ein Thema
const TOPIC_TIPS = {
  func: 'Tippe eine Funktion ein (z.B. x^2-2x). Ziehe im Bild, zoome mit dem Rad; Doppelklick setzt den Ausschnitt zurück.',
  lin: 'Ziehe die Punkte im Bild. Oben links wählst du die Ansicht, rechts steht der Rechenweg.',
  quad: 'Ziehe Scheitel, Nullstellen oder den roten Punkt a. Oben links wählst du die Ansicht, rechts steht der Rechenweg.',
  pow: 'Ziehe den Punkt P oder die Griffe. Oben links wählst du die Ansicht, rechts steht der Rechenweg.',
  exp: 'Ziehe die Punkte im Bild oder die orange Gerade. Oben links wählst du die Ansicht, rechts steht der Rechenweg.',
  trig: 'Ziehe den Punkt P auf dem Kreis oder die Griffe im Graphen. Oben links wählst du die Ansicht, rechts steht der Rechenweg.',
  inv: 'Ziehe den Punkt P auf f: Sein Spiegelpunkt liegt auf der Umkehrfunktion. Oben links wählst du die Ansicht, rechts steht der Rechenweg.',
  intro: 'Tippe eine Funktion ein und ziehe die Punkte im Bild. Oben links wählst du die Ansicht, rechts steht der Rechenweg.',
  sim: 'Ziehe die Ecken und die Griffe im Bild. Oben links wählst du die Ansicht, rechts steht der Rechenweg.',
  diff: 'Ziehe die Punkte auf dem Graphen. Oben links wählst du die Ansicht, rechts steht der Rechenweg.',
  int: 'Ziehe die Grenzen a und b. Oben links wählst du die Ansicht, rechts steht der Rechenweg.',
  seq: 'Ziehe die Punkte im Bild. Oben links wählst du die Ansicht, rechts steht der Rechenweg.',
  alg: 'Gib einen Term ein und wähle links, was damit geschehen soll; das Bild zeigt die Umformung.',
  geo: 'Wähle links ein Werkzeug und klicke ins Bild; die Leiste unten sagt dir, was als Nächstes zu wählen ist.',
  '3d': 'Ziehe im Bild, um den Raum zu drehen; oben links wählst du die Ansicht, rechts steht der Rechenweg.',
  stat: 'Wähle links ein Experiment und starte es; die Geschwindigkeit lässt sich einstellen.',
  fin: 'Wähle links eine Ansicht und ändere die Zahlen; das Bild und der Rechenweg passen sich an.',
  set: 'Ziehe die Randpunkte im Bild. Links wählst du offen oder geschlossen, unendlich und die Operation; rechts steht der Rechenweg.',
  prob: 'Ziehe die Punkte im Bild oder ändere links die Zahlen; oben links wählst du die Ansicht, rechts steht der Rechenweg.',
  lo: 'Gib links die Ungleichungen ein und ziehe die Niveaulinie oder den Testpunkt im Bild. Rechts steht der Rechenweg.'
};
// Hilfe zum Thema (Knopf «? Hilfe zum Thema» in der Leiste): Besonderheiten der Bedienung je Thema. Der Rest der Hilfe
// entsteht aus dem, was ohnehin da ist: Kurzbeschreibung (TOPIC_ABOUT), Aufgabe und Erklärung der aktuellen Ansicht
// (*_DESC der Module), die Bedienelemente des Panels (helpScan) und die Liste aller Ansichten.
const TOPIC_HELP = {
  intro: ['Die drei Ansichten bauen aufeinander auf: zuerst Werte einsetzen (Wertetabelle und Punkte), dann die Eigenschaften, zum Schluss Anwendungen mit Einheiten.',
    'Punkte im Bild rasten auf runden Werten ein; mit gedrückter Shift-Taste ziehst du frei.',
    'Bei «Anwendungen» tragen die Achsen Grössen mit Einheiten; die gestrichelten Ablesehilfen führen vom Punkt zu beiden Achsen.'],
  func: ['Tippe den Term ins Feld (z. B. x^2-2x, sin(x), sqrt(x)). «+ Funktion» fügt einen weiteren Graphen hinzu; das Auge blendet ihn aus, ✕ löscht ihn, der Farbpunkt wechselt die Farbe.',
    'Buchstaben wie a, b, c im Term werden zu Parametern mit Schiebereglern.',
    'Unter dem Term: «D: ℝ» schränkt den Definitionsbereich ein; die Knöpfe f′, ∫, f⁻¹ und lim∞ zeigen Ableitung, Stammfunktion, Umkehrfunktion und das Verhalten im Unendlichen.',
    'Oben in der Leiste: «Punkt setzen» (freier Punkt), «Punkt auf Graph» (gleitet auf dem Graphen), «Löschen» (Punkte anklicken) und «Pointer» zum Zeigen.',
    'Ziehen verschiebt den Ausschnitt, Mausrad oder zwei Finger zoomen, Doppelklick setzt ihn zurück.',
    'Im Panel «Export» holst du das Bild als JPEG oder LaTeX und wählst, welche Sonderpunkte (Nullstellen, Extrema, Schnittpunkte …) ins LaTeX kommen.'],
  lin: ['Punkte rasten auf dem Raster ein (Shift: frei). Steigung m und Achsenabschnitt q lassen sich auch links als Zahl eingeben.',
    'Bei «Schnitt zweier Geraden» wählst du das Lösungsverfahren (Gleichsetzen, Einsetzen, Addition) für den Rechenweg.',
    'Bei «Anwendungen» sind die Achsen beschriftet (z. B. Minuten und Franken); «▶ x wandert nach rechts» fährt die Stelle ab.'],
  quad: ['Je nach Ansicht lassen sich der Scheitel S, der rote Punkt a (Öffnung), der Achsenabschnitt c und die Nullstellen ziehen.',
    'Links wählst du die Form der Eingabe: Standardform, Scheitelform oder Nullstellenform. Der Rechenweg rechnet sie ineinander um.',
    'Bei «Nullstellen» wählst du das Verfahren (z. B. Mitternachtsformel), bei «Parabel und Gerade» die Aufgabe (Schnitt, Parabel aus Punkten …).',
    'Bei «Optimierung» ziehst du den Preis p; Nachfrage, Umsatz und Gewinn reagieren sofort.'],
  pow: ['Den Exponenten n änderst du links mit ◀ ▶ oder über ein Beispiel.',
    'Der Punkt P läuft auf dem Graphen; «Spiegelpunkt P′ zeigen» macht die Symmetrie sichtbar.',
    'Bei der allgemeinen Form verwandelt «▶ Grundfunktion verwandeln» die Grundfunktion Schritt für Schritt (strecken, verschieben); «Fertig» springt ans Ende.',
    'Bei den Gleichungen ziehst du die waagrechte Gerade y = y₀: Ihre Schnittpunkte mit dem Graphen sind die Lösungen.'],
  exp: ['Die Punkte bei x = 0 (Anfangswert a) und x = 1 (Faktor b) legen die Funktion fest; «Basis e» schaltet auf die natürliche Basis um.',
    'Bei «Exponentialgleichungen» wählst du links eine Anwendung (Zinseszins, Zerfall, Abkühlung …) oder eine freie Gleichung; die Gerade y = c lässt sich ziehen.',
    'Bei «Prozentrechnung» ziehst du die Säulen; «＋ Schritt» und «− Schritt» ändern die Anzahl Veränderungen, und du wählst vorwärts oder rückwärts.'],
  trig: ['Winkel in Grad oder im Bogenmass: links umschalten. Die Beispiele springen zu den besonderen Winkeln (30°, 45°, 60° …).',
    '«▶ Winkel drehen» lässt P auf dem Kreis laufen und zeichnet die Kurve; «⟲ φ = 0°» setzt den Winkel zurück.',
    'Bei der allgemeinen Sinusfunktion ziehst du den Startpunkt S, den Hochpunkt H und das Periodenende; «▶ Grundfunktion verwandeln» zeigt die Schritte einzeln.',
    'Bei den Dreiecken wählst du links, was gegeben ist; danach rechnet der Rechenweg mit sin, cos, tan bzw. mit dem Sinus- oder Kosinussatz.'],
  inv: ['Die Funktion wählst du über «Beispiel wählen …» oder tippst sie ein (lineare Funktionen, Potenz-, Exponential- und Logarithmusfunktionen).',
    'Bei «Umkehrbarkeit» ziehst du die waagrechte Gerade y = k und die rote Grenze r, die den Definitionsbereich einschränkt.',
    'Die Winkelhalbierende y = x und die Umkehrfunktion f⁻¹ lassen sich links ein- und ausblenden.'],
  diff: ['Eigene Funktion ins Feld «f(x) =» tippen und «Übernehmen»; die Stelle x₀ ziehst du im Bild oder änderst sie links mit ◀ ▶.',
    'Sekante → Tangente: Q zu P ziehen oder «▶ h → 0» drücken; «h = 1» stellt den Abstand wieder her. Links wählst du, ob Q rechts oder links von P liegt.',
    'Graphisches Ableiten: Ein Klick setzt die Stelle, Ziehen verschiebt den Ausschnitt, an der gestrichelten Linie ziehst du den Punkt. Der Ausschnitt richtet sich nach der Funktion; «⟲ Ausschnitt» stellt ihn wieder her. Mit «f′ verstecken» skizzierst du die Ableitung selbst.',
    'Kurvendiskussion: «Färbung von f» zeigt Steigen und Fallen oder die Krümmung; f′ und f″ lassen sich einzeichnen.',
    'Polynom aus Bedingungen: Mit «＋ Bedingung» gibst du Punkte, Extrem- und Wendepunkte oder Steigungen vor und ziehst sie im Bild.'],
  int: ['Die Grenzen a und b ziehst du auf der x-Achse; eine eigene Funktion tippst du ins Feld.',
    'Ober- und Untersumme: Anzahl n links erhöhen oder «▶ n → ∞» starten; «n = 4» setzt zurück.',
    'Integralfunktion und Hauptsatz: Ein Klick ins Bild setzt die Stelle x, an der gestrichelten Linie lässt sie sich ziehen. Ziehen im Bild verschiebt den Ausschnitt (oben f, unten Fa getrennt), das Mausrad bzw. zwei Finger zoomen; Doppelklick oder «⟲ Ausschnitt» stellt den automatischen Ausschnitt wieder her.',
    'Flächen: Links wählst du, ob die Fläche zur x-Achse oder zwischen f und g gesucht ist; «Grenzen auf die Nullstellen setzen» hilft beim Start.',
    'Partielle Integration und Substitution sind als Bild erklärt: Punkte und Grenzen ziehen, bei der Substitution «▶ Streifen in die u-Welt verformen».'],
  lo: ['Ungleichungen tippst du links ein (z. B. 2x + 3y <= 12); «+ Ungleichung» fügt eine weitere Zeile hinzu.',
    '«x ≥ 0, y ≥ 0» schaltet die Nichtnegativität ein, «nur ganze Zahlen» beschränkt auf Stückzahlen.',
    'Zielfunktion: «Maximum» oder «Minimum» wählen, dann die Niveaulinie ziehen oder «Niveaulinie zum Optimum» drücken.'],
  geo: ['Links ein Werkzeug wählen (z. B. «Punkt», «Strecke», «Kreis») und ins Bild klicken; der Hinweis unten im Panel sagt, was als Nächstes anzuklicken ist.',
    'Mit «Ziehen» bewegst du Punkte und Figuren: Alles Abgeleitete (Mittelpunkte, Lote, Schnittpunkte) folgt.',
    'Weitere Werkzeuge stecken in den aufklappbaren Gruppen «Konstruieren», «Dreieck», «Messen», «Vektoren» und «Abbildungen».',
    '«Vorlage laden …» bringt fertige Konstruktionen. «Am Gitter einrasten», «Namen anzeigen» und «Masse anzeigen» lassen sich abschalten.',
    '«Löschen» entfernt angeklickte Objekte, «Alles löschen» leert das Blatt.'],
  sim: ['Das Original ABC bleibt fest. Unter «Abbildung» wählst du genau eine Grundabbildung: Verschiebung, Drehung um den Ursprung, Spiegelung an der x- oder y-Achse oder zentrische Streckung von Z aus. Das Bild A′B′C′ zeigt dann nur diese eine Abbildung; du kannst es auch mit der Maus verschieben, drehen bzw. strecken.',
    '«Mehrere nacheinander» verknüpft die Abbildungen in fester Reihenfolge: spiegeln, um O drehen, von Z aus strecken, verschieben.',
    '«Abbildung vorführen …» spielt einzelne Abbildungen ab; «⟲ Bild auf das Original legen» stellt den Anfang wieder her.',
    'Winkel und Seitenlängen lassen sich links einblenden; rechts stehen die Seitenverhältnisse als Brüche.'],
  seq: ['Folge eingeben: explizit als Term in n (z. B. 3n+1) oder rekursiv; die Art schaltest du links um.',
    'Arithmetische und geometrische Folgen: a₁ und a₂ ziehen. Die rote Zielgerade t zeigt, welches Glied einen Wert erreicht.',
    'Summenzeichen: Fährst du mit der Maus über die untere oder obere Grenze, leuchtet der zugehörige Summand auf.',
    'Grenzwert: grünen Punkt ε ziehen oder «▶ Animation: ε → 0» starten – der Streifen wird schmaler, und es kommen Glieder dazu.'],
  set: ['Randpunkte auf der Zahlengeraden ziehen; links legst du fest, ob ein Rand dazugehört («gehört dazu») oder das Intervall bis −∞ bzw. ∞ reicht.',
    'Die Schreibweise offener Intervalle ist wählbar: runde Klammer (a, b) oder nach aussen gedrehte eckige Klammer.',
    'Venn-Diagramm: Operation wählen oder einen eigenen Term mit den Tasten A, B, ∪, ∩, \\ und Ā eingeben; 2 oder 3 Mengen, Felder mit Elementen oder Anzahlen.',
    'Übungen: Aufgabenart wählen, Antwort eintippen oder Felder anklicken, dann «Prüfen». «Lösung zeigen» und «Neue Aufgabe» stehen daneben.'],
  alg: ['Oben im Panel wählst du die Art der Umformung (Ausmultiplizieren, Faktorisieren … Gleichungssysteme).',
    'Darunter drei Reiter: «Beispiele» (fertige Aufgaben zum Anklicken), «Gesetze» (die Regeln dazu) und «Üben» (Aufgaben zum Selberlösen).',
    'Mit ‹ und › blätterst du durch die Beispiele; unter «Eigene Aufgabe eingeben» tippst du einen eigenen Term oder eine eigene Gleichung.',
    'Das Bild zeigt die Umformung (Flächen, Plättchen, Waage), die Karte rechts den Rechenweg Schritt für Schritt.'],
  '3d': ['Raum drehen: im Bild ziehen. Mausrad zoomt, Umschalt+Ziehen verschiebt, Doppelklick stellt die Standardansicht her.',
    '«Von oben», «Von vorn» und «Von der Seite» zeigen die Risse; «Bereich ±» legt fest, wie weit die Achsen reichen.',
    'Ebenen entdecken: Gleichung eintippen und «+ Ebene». Buchstaben wie a, b, c, d in der Gleichung werden zu Schiebereglern.',
    'In den anderen Ansichten gibst du Punkte, Vektoren und Geraden links als Koordinaten ein; die Beispiele füllen die Felder aus.'],
  stat: ['«+1», «+10», «+100» und «+1000» führen so viele Versuche aus; «▶ Dauerlauf» lässt das Experiment laufen, der Regler stellt die Geschwindigkeit ein.',
    '«↺ Neu beginnen» löscht die Zählung.',
    'Beobachte, wie sich die relative Häufigkeit dem theoretischen Wert nähert (gestrichelte Linie bzw. «Theoretische Wahrscheinlichkeiten zeigen»).',
    'Beim Ziegenproblem spielst du selbst: «Neues Spiel starten» und eine Tür anklicken.'],
  prob: ['Zahlen links ändern oder Punkte, Grenzen und Balken im Bild ziehen – beides gehört zusammen.',
    'Datenanalyse: Eigene Werte tippst du links als Liste ein.',
    '«Grenzwerte»: Mit dem Regler oder «▶ n wachsen lassen» geht die Binomialverteilung in die Poisson- bzw. Normalverteilung über; der Rechenweg enthält die Herleitung der Formel mit den aktuellen Zahlen.',
    'Normalverteilung: Grenze ziehen oder die Grenze x, die Anzahl σ bzw. die Prozentzahl eintippen – die anderen beiden rechnen mit. «Art» schaltet zwischen linksseitig, rechtsseitig, zwischen zwei Grenzen und beidseitig um. Die Knöpfe 1σ, 2σ, 3σ und 90 %, 95 %, 99 % setzen die Merkzahlen.',
    'Jede Ansicht hat Beispiele; der Rechenweg rechts zeigt Formel und Zwischenschritte mit deinen Zahlen.'],
  fin: ['Zahlen links ändern (Regler oder Feld): Zeitstrahl, Formel und Tabelle rechnen sofort neu.',
    'Der Zeitstrahl zeigt jede Zahlung als Pfeil; das «?» markiert, was gesucht ist.',
    'Unter «Verwandte Umgebungen» springst du zu Folgen und Summen oder zu Potenzen und Logarithmen.']
};
const TOPIC_LS = 'jsqrt10_welcome_seen';

(function () {
  if (typeof document === 'undefined') return;
  const $ = id => document.getElementById(id);
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  // ── Ansichten einer Umgebung: [{id, title, go()}] ──
  function viewsOf(env) {
    const sel = (id, list) => list.map(([v, t]) => ({ id: v, title: t, go: () => { const s = $(id); if (s) { s.value = v; s.dispatchEvent(new Event('change')); } } }));
    const panel = (pid, t, id) => ({ id, title: t, go: () => { const p = $(pid); if (p) { p.classList.remove('collapsed'); setTimeout(() => p.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60); } } });
    switch (env) {
      case 'func': return [panel('func-panel', 'Funktionen zeichnen und untersuchen', 'func'), panel('fb-panel', 'Balken über den Stellen', 'bars')];
      case 'lin': return sel('lin-view', typeof LIN_VIEWS !== 'undefined' ? LIN_VIEWS : []);
      case 'quad': return sel('quad-view', typeof QUAD_VIEWS !== 'undefined' ? QUAD_VIEWS : []);
      case 'pow': return sel('pow-view', typeof POW_VIEWS !== 'undefined' ? POW_VIEWS : []);
      case 'exp': return sel('exp-view', typeof EXP_VIEWS !== 'undefined' ? EXP_VIEWS : []);
      case 'trig': return sel('trig-view', typeof TRIG_VIEWS !== 'undefined' ? TRIG_VIEWS : []);
      case 'inv': return sel('inv-view', typeof INV_VIEWS !== 'undefined' ? INV_VIEWS : []);
      case 'intro': return sel('intro-view', typeof FUN_VIEWS !== 'undefined' ? FUN_VIEWS : []);
      case 'sim': return sel('sim-view', typeof SIM_VIEWS !== 'undefined' ? SIM_VIEWS : []);
      case 'seq': return sel('seq-view', typeof SEQ_VIEWS !== 'undefined' ? SEQ_VIEWS : []);
      case 'lo': return sel('lo-view', typeof LOP_VIEWS !== 'undefined' ? LOP_VIEWS : []);
      case 'set': return sel('set-view', typeof SET_VIEWS !== 'undefined' ? SET_VIEWS : []);
      case 'prob': return sel('prob-view', typeof PB_VIEWS !== 'undefined' ? PB_VIEWS : []);
      case '3d': return sel('td-view', typeof VG_VIEWS !== 'undefined' ? VG_VIEWS : []);
      case 'diff': return sel('dif-view', typeof DIF_VIEWS !== 'undefined' ? DIF_VIEWS : []);
      case 'int': return sel('itg-view', typeof ITG_VIEWS !== 'undefined' ? ITG_VIEWS : []);
      case 'stat': return sel('stat-mode', typeof STAT_MODES !== 'undefined' ? STAT_MODES : []);
      case 'fin': return sel('fin-mode', typeof FIN_MODES !== 'undefined' ? FIN_MODES : []);
      case 'alg': return (typeof ALG_MODES !== 'undefined' ? ALG_MODES : []).map(([v, t]) => ({ id: v, title: t, go: () => { const b = document.querySelector('#alg-modes .alg-mode[data-mode="' + v + '"]'); if (b) b.click(); } }));
      default: return [];
    }
  }
  // In eine Umgebung (und Ansicht) springen
  function topicGo(env, viewId) {
    topicsClose();
    if (typeof envSwitch === 'function') envSwitch(env);
    if (viewId) { const v = viewsOf(env).find(x => x.id === viewId); if (v) setTimeout(v.go, 30); }
    if (window.innerWidth <= 700 && typeof closeSidebar === 'function' && !viewId) closeSidebar();
    lsSet(TOPIC_LS, '1');
    try { topicTipShow(env); } catch (e) {}
  }

  // ── Bild zum Ziehen auf der Startseite: Punkt auf einer Kurve, Tangente und Steigungsdreieck rechnen mit ──
  // Läuft ohne das Zeichenwerkzeug der Themen (reines SVG); wandert anfangs langsam von selbst, bis jemand zugreift.
  let heroDemoStart = () => {};
  function heroDemo() {
    const NS = 'http://www.w3.org/2000/svg', W = 420, H = 250, U = 52, XA = -2.4, XB = 2.3;
    const sv = (t, a, kids) => { const e = document.createElementNS(NS, t); for (const k in (a || {})) e.setAttribute(k, a[k]); (kids || []).forEach(c => e.appendChild(c)); return e; };
    const X = x => W / 2 + x * U, Y = y => H / 2 - y * U, f = x => 0.2 * x * x * x - 1.2 * x, df = x => 0.6 * x * x - 1.2;
    const fmt = v => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2).replace('-', '−'), r1 = v => Math.round(v * 10) / 10;
    const grid = []; for (let i = -4; i <= 4; i++) { if (i) grid.push('M' + X(i) + ' 0V' + H); if (i && Math.abs(i) <= 2) grid.push('M0 ' + Y(i) + 'H' + W); }
    let d = ''; for (let i = 0; i <= 140; i++) { const x = -4.1 + 8.2 * i / 140; d += (i ? 'L' : 'M') + r1(X(x)) + ' ' + r1(Y(f(x))); }
    const tan = sv('path', { class: 'tp-d-tan' }), tri = sv('path', { class: 'tp-d-tri' }), halo = sv('circle', { class: 'tp-d-halo', r: 13 }), pt = sv('circle', { class: 'tp-d-pt', r: 7 });
    const l1 = sv('text', { class: 'tp-d-lab', 'text-anchor': 'middle' }), lm = sv('text', { class: 'tp-d-lab tp-d-m' });
    l1.textContent = '1';
    const fl = sv('text', { class: 'tp-d-f', x: X(0.25), y: 22 }); fl.textContent = 'f(x) = 0.2x³ − 1.2x';
    const svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'tp-d-svg', tabindex: '0', role: 'slider', 'aria-label': 'Punkt auf dem Graphen verschieben', 'aria-valuemin': XA, 'aria-valuemax': XB },
      [sv('path', { class: 'tp-d-grid', d: grid.join('') }), sv('path', { class: 'tp-d-ax', d: 'M0 ' + Y(0) + 'H' + W + 'M' + X(0) + ' 0V' + H }), sv('path', { class: 'tp-d-curve', d: d }), tri, l1, lm, tan, halo, pt, fl]);
    const read = el('div', 'tp-d-read'); read.setAttribute('translate', 'no');
    const rx = el('span'), ry = el('span', 'tp-d-ry'), rm = el('span', 'tp-d-rm'); read.append(rx, ry, rm);
    let x = 1.1, drag = false, raf = 0, t0 = 0;
    let auto = true; try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) auto = false; } catch (e) {}
    const draw = () => {
      const y = f(x), m = df(x), k = 105 / U / Math.sqrt(1 + m * m);
      tan.setAttribute('d', 'M' + r1(X(x - k)) + ' ' + r1(Y(y - k * m)) + 'L' + r1(X(x + k)) + ' ' + r1(Y(y + k * m)));
      tri.setAttribute('d', 'M' + r1(X(x)) + ' ' + r1(Y(y)) + 'H' + r1(X(x + 1)) + 'V' + r1(Y(y + m)));
      l1.setAttribute('x', r1(X(x + 0.5))); l1.setAttribute('y', r1(Y(y) + (m >= 0 ? 15 : -6)));
      lm.setAttribute('x', r1(X(x + 1) + 6)); lm.setAttribute('y', r1(Y(y + m / 2) + 4)); lm.textContent = fmt(m);
      [halo, pt].forEach(c => { c.setAttribute('cx', r1(X(x))); c.setAttribute('cy', r1(Y(y))); });
      rx.textContent = 'x = ' + fmt(x); ry.textContent = 'f(x) = ' + fmt(y); rm.textContent = 'f′(x) = ' + fmt(m);
      svg.setAttribute('aria-valuenow', fmt(x).replace('−', '-'));
    };
    const set = v => { x = Math.max(XA, Math.min(XB, v)); draw(); };
    const box = el('div', 'tp-demo tp-d-idle');
    const stop = () => { auto = false; box.classList.remove('tp-d-idle'); };
    const at = ev => { const r = svg.getBoundingClientRect(); return (ev.clientX - r.left) / (r.width || 1) * (W / U) - W / 2 / U; };
    svg.addEventListener('pointerdown', ev => { stop(); drag = true; try { svg.setPointerCapture(ev.pointerId); } catch (e) {} set(at(ev)); ev.preventDefault(); });
    svg.addEventListener('pointermove', ev => { if (drag) set(at(ev)); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => svg.addEventListener(n, () => { drag = false; }));
    svg.addEventListener('keydown', ev => { const s = ev.key === 'ArrowLeft' ? -0.1 : ev.key === 'ArrowRight' ? 0.1 : 0; if (s) { stop(); set(x + s); ev.preventDefault(); } });
    const tick = ts => {
      raf = 0; if (!auto || !box.isConnected || box.offsetParent === null) return;   // unsichtbar: anhalten, topicsOpen stösst wieder an
      if (!t0) t0 = ts; if (ts - t0 > 49000) { stop(); return; }
      set(2.25 * Math.sin((ts - t0) / 2600 + 0.5)); raf = requestAnimationFrame(tick);
    };
    heroDemoStart = () => { if (auto && !raf) raf = requestAnimationFrame(tick); };
    const cap = el('div', 'tp-d-cap'), more = el('button', 'tp-d-more', 'Mehr dazu ›'); more.type = 'button'; more.title = 'Differentialrechnung öffnen'; more.addEventListener('click', () => topicGo('diff', 'tan'));
    cap.append(el('div', 'tp-d-hint', 'Probier es aus: Verschiebe den Punkt.'), more);
    box.append(svg, read, cap); draw();
    return box;
  }

  // Der Name im Fliesstext: J und Wurzelzeichen, dessen Strich über die ganze 10 reicht (das Zeichen √ allein deckt nur nichts ab: «J√10» liest sich wie J√1·0)
  function brandTxt() {
    const s = el('span', 'jw'); s.setAttribute('translate', 'no'); s.setAttribute('role', 'img'); s.setAttribute('aria-label', 'J Wurzel 10');
    s.innerHTML = 'J<span class="jw-h">√</span><span class="jw-r"><svg viewBox="0 0 12 20" preserveAspectRatio="none" aria-hidden="true"><path vector-effect="non-scaling-stroke" d="M0.6 11.6L3 10.4L6.4 17.8L11.3 0.68H12.2"/></svg>10</span>';
    return s;
  }

  // ── Übersicht ──
  let built = false;
  function build() {
    if (built) return; built = true;
    const ov = $('topics'); ov.replaceChildren();
    const box = el('div', 'tp-box');
    // Kopf: Willkommen, Suche, drei Schritte
    const head = el('div', 'tp-head');
    // Der Name im Titel ist das Logo selbst (gleiche Wortmarke wie oben links)
    const h = el('div', 'tp-title'); const tb = el('b', null, 'Willkommen bei '); const mk = document.querySelector('.brand-mark'); const mark = mk ? mk.cloneNode(true) : brandTxt(); mark.id = ''; mark.classList.add('tp-mark-inline'); mark.setAttribute('translate', 'no'); mark.setAttribute('aria-label', 'J Wurzel 10'); tb.appendChild(mark);
    h.append(tb);
    // «Weiter mit …»: zurück zum zuletzt gewählten Thema (statt ✕; ein Klick auf den Hintergrund schliesst die Startseite nicht)
    const cl = el('button', 'tp-continue'); cl.type = 'button'; cl.id = 'tp-continue'; cl.addEventListener('click', topicsClose);
    // Sprachwahl: Knopf mit Landesflagge, Ausklappliste (gleiche Liste wie der Sprachknopf oben rechts, 01_i18n.js)
    const FLAG = { de: '🇩🇪', en: '🇬🇧', fr: '🇫🇷', es: '🇪🇸', it: '🇮🇹', pl: '🇵🇱', cs: '🇨🇿', el: '🇬🇷', hu: '🇭🇺' };
    const langs = el('div', 'tp-langs'); langs.setAttribute('translate', 'no');
    const lb = el('button', 'tp-langbtn'); lb.type = 'button'; lb.id = 'tp-langbtn'; lb.setAttribute('aria-haspopup', 'listbox'); lb.setAttribute('aria-expanded', 'false'); lb.title = 'Sprache';
    const lm = el('div', 'tp-langmenu'); lm.id = 'tp-langmenu'; lm.setAttribute('role', 'listbox'); lm.style.display = 'none';
    (typeof LANG_ORDER !== 'undefined' ? LANG_ORDER : ['de']).forEach(code => {
      const L = typeof LANGUAGES !== 'undefined' ? LANGUAGES[code] : null, b = el('button', 'tp-lang'); b.type = 'button'; b.setAttribute('data-lang', code); b.setAttribute('role', 'option'); b.lang = code;
      b.append(el('span', 'tp-flag', FLAG[code] || '🏳'), el('span', null, (L && L.name) || code.toUpperCase()));
      b.addEventListener('click', ev => { ev.stopPropagation(); lm.style.display = 'none'; lb.setAttribute('aria-expanded', 'false'); if (typeof setLang === 'function') setLang(code); langsMark(); });
      lm.appendChild(b);
    });
    lb.addEventListener('click', ev => { ev.stopPropagation(); const open = lm.style.display !== 'none'; lm.style.display = open ? 'none' : 'block'; lb.setAttribute('aria-expanded', open ? 'false' : 'true'); });
    document.addEventListener('click', () => { lm.style.display = 'none'; lb.setAttribute('aria-expanded', 'false'); });
    langs.append(lb, lm);
    langs._flag = FLAG;
    head.append(h, langs, cl);
    // Bühne: Leitsatz, Beschreibung, Suche und Eckdaten; daneben ein Bild zum Ziehen
    const hero = el('div', 'tp-hero'), heroBody = el('div', 'tp-hero-body'), heroL = el('div', 'tp-hero-l');
    const sw = el('div', 'tp-search');
    const inp = el('input'); inp.type = 'search'; inp.id = 'topics-q'; inp.placeholder = 'Wonach suchst du? z.B. Tangente, Nullstellen, Zinseszins …'; inp.autocomplete = 'off'; inp.setAttribute('aria-label', 'Themen durchsuchen');
    sw.append(el('span', 'tp-lupe', '🔍'), inp);
    const facts = el('div', 'tp-facts');
    // Suchvorschläge: Stichwörter quer durch die Themen (Farbe = Themengruppe); ein Klick sucht danach
    TOPIC_SUGG.forEach(([t, g]) => {
      const b = el('button', 'tp-fact', t); b.type = 'button'; b.style.setProperty('--g', TOPIC_COL[g] || 'var(--accent)');
      b.addEventListener('click', () => { inp.value = b.textContent; topicsSearch(inp.value); if (res.style.display === 'none' || !res.querySelector('button')) topicsSearch(t); if (window.innerWidth > 700) inp.focus(); });   // übersetztes Wort ohne Treffer: deutsches Stichwort
      facts.appendChild(b);
    });
    heroL.append(el('div', 'tp-claim', 'Mathematik erleben, ausprobieren, verstehen.'),
      (() => { const p = el('p', 'tp-lead'); p.append('Im ', brandTxt(), ' gibt es zu verschiedenen mathematischen Themen eine interaktive Umgebung mit Graphen, Bildern, Beispielen und Lösungswegen.'); return p; })(),
      sw, facts);
    heroBody.append(heroL, heroDemo());
    hero.append(head, heroBody);
    // Gruppen
    const groups = el('div', 'tp-groups'); groups.id = 'tp-groups';
    TOPIC_GROUPS.forEach(g => {
      const n = g.envs.filter(id => typeof envById !== 'function' || envById(id)).length;
      const sec = el('section', 'tp-group'); sec.id = 'tp-g-' + g.id; sec.style.setProperty('--n', String(Math.min(4, Math.max(1, n)))); sec.style.setProperty('--g', TOPIC_COL[g.id] || 'var(--accent)'); sec.append(el('h2', null, g.title));
      const grid = el('div', 'tp-grid');
      g.envs.forEach(id => {
        const e = typeof envById === 'function' ? envById(id) : null; if (!e) return;
        const card = el('div', 'tp-card'); card.setAttribute('data-env', id);
        const top = el('button', 'tp-card-top'); top.type = 'button';
        top.append(el('span', 'tp-ic', e.icon), (() => { const t = el('span', 'tp-txt'); t.append(el('b', null, e.title), el('small', 'tp-kw', e.desc)); return t; })()); top.title = 'Thema öffnen';
        top.addEventListener('click', () => topicGo(id));
        const ab = el('p', 'tp-about', TOPIC_ABOUT[id] || e.desc); ab.title = ab.textContent; ab.addEventListener('click', () => topicGo(id));
        card.append(top, ab);
        const vs = viewsOf(id);
        if (vs.length) {
          const more = el('button', 'tp-more'); more.type = 'button'; more.setAttribute('aria-expanded', 'false');
          more.append(el('span', null, 'Unterthemen'), el('small', null, String(vs.length)), el('span', 'tp-caret', '▾'));
          const list = el('div', 'tp-views'); list.hidden = true;
          vs.forEach(v => { const b = el('button', 'tp-view'); b.type = 'button'; b.append(el('span', null, v.title), el('span', 'tp-view-go', '›')); b.setAttribute('data-view', v.id); b.setAttribute('data-kw', (TOPIC_KW[id] && TOPIC_KW[id][v.id]) || ''); b.addEventListener('click', () => topicGo(id, v.id)); list.appendChild(b); });
          more.addEventListener('click', () => {
            const open = list.hidden;
            document.querySelectorAll('#tp-groups .tp-card.tp-open').forEach(c => { if (c !== card) { c.classList.remove('tp-open'); c.querySelector('.tp-views').hidden = true; c.querySelector('.tp-more').setAttribute('aria-expanded', 'false'); } });
            list.hidden = !open; card.classList.toggle('tp-open', open); more.setAttribute('aria-expanded', open ? 'true' : 'false');
          });
          card.append(more, list);
        } else {
          const go = el('button', 'tp-more tp-more-go'); go.type = 'button'; go.append(el('span', null, 'Thema öffnen'), el('span', 'tp-caret', '→')); go.addEventListener('click', () => topicGo(id)); card.appendChild(go);
        }
        card.setAttribute('data-kw', (TOPIC_KW[id] && TOPIC_KW[id]._) || '');
        grid.appendChild(card);
      });
      sec.appendChild(grid); groups.appendChild(sec);
    });
    const res = el('div', 'tp-results'); res.id = 'tp-results'; res.style.display = 'none';
    const foot = el('div', 'tp-foot', 'Diese Startseite öffnest du jederzeit mit «Startseite» oben links, dem Logo oder dem Themenknopf in der Leiste. «Weiter mit …» oben rechts führt zurück zum zuletzt gewählten Thema.');
    box.append(hero, groups, res, foot); ov.appendChild(box);
    ov.addEventListener('click', ev => { if (ev.target.closest && ev.target.closest('.tp-card.tp-open')) return; document.querySelectorAll('#tp-groups .tp-card.tp-open').forEach(c => { c.classList.remove('tp-open'); c.querySelector('.tp-views').hidden = true; c.querySelector('.tp-more').setAttribute('aria-expanded', 'false'); }); });
    inp.addEventListener('input', () => topicsSearch(inp.value));
    inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { const first = res.querySelector('button'); if (first) first.click(); } });
  }
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9äöüßáéíóúàèìòùâêîôûçñăąćęłńśźżčďěňřšťůýžőű\u0370-\u03ff\u1f00-\u1fff€]+/gi, ' ').trim();
  function topicsSearch(q) {
    const res = $('tp-results'), groups = $('tp-groups');
    const words = norm(q).split(' ').filter(w => w.length >= 2);
    const bx = document.querySelector('#topics .tp-box'); if (bx) bx.classList.toggle('tp-searching', !!words.length);
    if (!words.length) { heroDemoStart(); res.style.display = 'none'; groups.style.display = ''; return; }
    groups.style.display = 'none'; res.style.display = ''; res.replaceChildren();
    const hits = [];
    document.querySelectorAll('#tp-groups .tp-card').forEach(card => {
      const id = card.getAttribute('data-env'), title = card.querySelector('.tp-card-top b').textContent, desc = card.querySelector('.tp-about').textContent + ' ' + card.querySelector('.tp-card-top small').textContent;
      const base = norm(title + ' ' + desc + ' ' + card.getAttribute('data-kw'));
      const views = [...card.querySelectorAll('.tp-view')];
      let cardScore = words.reduce((s, w) => s + (norm(title).includes(w) ? 3 : base.includes(w) ? 1 : 0), 0);
      views.forEach(b => {
        const vt = (b.firstChild && b.firstChild.textContent) || b.textContent, hay = norm(vt + ' ' + b.getAttribute('data-kw'));
        const sc = words.reduce((s, w) => s + (norm(vt).includes(w) ? 3 : hay.includes(w) ? 2 : 0), 0);
        if (sc > 0 && words.every(w => (hay + ' ' + base).includes(w))) hits.push({ sc: sc + cardScore * 0.5, env: id, view: b.getAttribute('data-view'), label: title + ' › ' + vt, icon: card.querySelector('.tp-ic').textContent });
      });
      if (cardScore > 0 && words.every(w => base.includes(w))) hits.push({ sc: cardScore, env: id, view: null, label: title, icon: card.querySelector('.tp-ic').textContent, desc: card.querySelector('.tp-about').textContent });
    });
    hits.sort((a, b) => b.sc - a.sc);
    if (!hits.length) { res.appendChild(el('div', 'tp-none', 'Nichts gefunden. Versuche ein anderes Wort, zum Beispiel «Nullstelle», «Tangente», «Fläche» oder «Zins».')); return; }
    res.appendChild(el('div', 'tp-res-head', hits.length === 1 ? '1 Treffer' : hits.length + ' Treffer'));
    hits.slice(0, 40).forEach(h => {
      const b = el('button', 'tp-hit'); b.type = 'button';
      b.append(el('span', 'tp-ic', h.icon), (() => { const t = el('span', 'tp-txt'); t.append(el('b', null, h.label)); if (h.desc) t.append(el('small', null, h.desc)); return t; })());
      b.addEventListener('click', () => topicGo(h.env, h.view)); res.appendChild(b);
    });
  }
  function langsMark() {
    const cur = typeof currentLang !== 'undefined' ? currentLang : 'de';
    document.querySelectorAll('#topics .tp-lang').forEach(b => { const on = b.getAttribute('data-lang') === cur; b.classList.toggle('tp-lang-cur', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
    const lb = $('tp-langbtn'), wrap = document.querySelector('#topics .tp-langs'); if (!lb || !wrap) return;
    const L = typeof LANGUAGES !== 'undefined' ? LANGUAGES[cur] : null;
    lb.replaceChildren(el('span', 'tp-flag', (wrap._flag && wrap._flag[cur]) || '🏳'), el('span', 'tp-langname', (L && L.name) || cur.toUpperCase()), el('span', 'tp-caret', '▾'));
  }
  function topicsOpen(welcome) {
    build(); langsMark();
    const ov = $('topics'); ov.style.display = 'flex'; document.body.classList.add('topics-open');
    const cur = typeof ENV !== 'undefined' ? ENV.cur : 'func';
    const ce = typeof envById === 'function' ? envById(cur) : null, cb = $('tp-continue');
    if (cb) { cb.replaceChildren(el('span', 'tp-cont-l', 'Weiter mit'), el('b', null, ce ? ce.title : ''), el('span', 'tp-cont-arrow', '→')); cb.title = 'Zurück zum zuletzt gewählten Thema'; }
    document.querySelectorAll('#tp-groups .tp-card').forEach(c => c.classList.toggle('tp-cur', c.getAttribute('data-env') === cur));
    const q = $('topics-q'); if (q) { q.value = ''; topicsSearch(''); if (window.innerWidth > 700) setTimeout(() => q.focus(), 50); }
    const b = $('env-btn'); if (b) b.setAttribute('aria-expanded', 'true');
    heroDemoStart();
    const bc = $('boot-cover'); if (bc) { requestAnimationFrame(() => bc.classList.add('gone')); setTimeout(() => bc.remove(), 250); }   // Startbild (index.html) weg
  }
  function topicsClose() {
    const ov = $('topics'); if (!ov || ov.style.display === 'none') return;
    ov.style.display = 'none'; document.body.classList.remove('topics-open');
    const bc = $('boot-cover'); if (bc) bc.remove();
    const b = $('env-btn'); if (b) b.setAttribute('aria-expanded', 'false');
  }
  function topicsToggle() { const ov = $('topics'); if (ov && ov.style.display === 'flex') topicsClose(); else topicsOpen(false); }

  // ── Hilfe: Reiter «Dieses Thema» (Besonderheiten der Umgebung und der aktuellen Ansicht) und «Allgemein» ──
  const HELP_SEL = { lin: 'lin-view', quad: 'quad-view', pow: 'pow-view', exp: 'exp-view', trig: 'trig-view', inv: 'inv-view', intro: 'intro-view', sim: 'sim-view', seq: 'seq-view', lo: 'lo-view', set: 'set-view', prob: 'prob-view', '3d': 'td-view', diff: 'dif-view', int: 'itg-view', stat: 'stat-mode', fin: 'fin-mode' };
  const helpDesc = env => { try { return ({ intro: typeof FUN_DESC !== 'undefined' && FUN_DESC, lin: typeof LIN_DESC !== 'undefined' && LIN_DESC, quad: typeof QUAD_DESC !== 'undefined' && QUAD_DESC, pow: typeof POW_DESC !== 'undefined' && POW_DESC, exp: typeof EXP_DESC !== 'undefined' && EXP_DESC, trig: typeof TRIG_DESC !== 'undefined' && TRIG_DESC, inv: typeof INV_DESC !== 'undefined' && INV_DESC, diff: typeof DIF_DESC !== 'undefined' && DIF_DESC, int: typeof ITG_DESC !== 'undefined' && ITG_DESC, lo: typeof LOP_DESC !== 'undefined' && LOP_DESC, sim: typeof SIM_DESC !== 'undefined' && SIM_DESC, seq: typeof SEQ_DESC !== 'undefined' && SEQ_DESC, set: typeof SET_DESC !== 'undefined' && SET_DESC, prob: typeof PB_DESC !== 'undefined' && PB_DESC, '3d': typeof VG_DESC !== 'undefined' && VG_DESC, stat: typeof STAT_DESC !== 'undefined' && STAT_DESC, fin: typeof FIN_DESC !== 'undefined' && FIN_DESC })[env] || null; } catch (e) { return null; } };
  const helpPlain = t => String(t || '').replace(/\{\{(.+?)\|[^|{}]*\}\}/g, '$1');
  // Hilfetexte so aufbauen, dass sie dieselben Übersetzungen nutzen wie die Oberfläche: ein Satz mit {{Wort|ids}} wie in der
  // Zeile über dem Bild (Wörter als eigene Elemente), Titel als eigenes Element in einem festen Rahmentext.
  function helpTxt(raw, cls) {
    const sp = el('span', cls || 'tp-help-t'), text = String(raw || ''), re = /\{\{(.+?)\|([^|{}]*)\}\}/g; let i = 0, m;
    while ((m = re.exec(text))) { if (m.index > i) sp.append(text.slice(i, m.index)); sp.append(el('span', 'eh-l', m[1])); i = re.lastIndex; }
    if (i < text.length) sp.append(text.slice(i));
    return sp;
  }
  const helpName = t => el('span', 'tp-help-n', t);
  function helpCurView(env) {
    if (env === 'alg') { const b = document.querySelector('#alg-modes .alg-mode.active-btn'); return b ? b.getAttribute('data-mode') : null; }
    const s = HELP_SEL[env] && $(HELP_SEL[env]); return s ? s.value : null;
  }
  // Was das Panel der aktuellen Ansicht anbietet (aus den sichtbaren Bedienelementen gelesen – stimmt darum immer)
  function helpScan(env) {
    const e = typeof envById === 'function' ? envById(env) : null, pn = e && e.open && $(e.open[0]), out = []; if (!pn) return out;
    const vis = x => x.offsetParent !== null, src = x => (window.AI18N && AI18N.srcText ? AI18N.srcText(x) : x.textContent) || '', txt = x => src(x).replace(/\s+/g, ' ').trim(), all = q => [...pn.querySelectorAll(q)];   // src: deutscher Ursprungstext, auch wenn gerade eine Übersetzung angezeigt wird
    const join = (parts, sep) => { const a = []; parts.forEach((t, i) => { if (i) a.push(sep); a.push([t]); }); return a; };   // Zeilen aus Bausteinen: [Text] wird einzeln übersetzt, Trenner bleiben
    const viewSel = HELP_SEL[env] && $(HELP_SEL[env]);
    if (env === 'func') return out;                                          // steht alles bei den Besonderheiten
    if (all('math-field').some(vis)) out.push('Eingabefeld: eigenen Term eintippen und mit ' + (all('button').some(x => vis(x) && txt(x) === 'Übernehmen') ? '«Übernehmen» oder ' : '') + 'Enter bestätigen. Das Panel «Tastatur» hilft bei Zeichen wie ², √ und π.');
    const sels = all('select').filter(x => vis(x) && x !== viewSel);
    sels.forEach(x => { const o0 = txt(x.options[0] || x); if (/wählen|einsetzen|laden|vorführen/i.test(o0)) out.push(['«', [o0], '»: ', [(x.options.length - 1) + ' fertige Beispiele, die alles passend einstellen.']]); });
    const lblOf = x => { const r = x.parentElement; if (!r) return ''; const c = [...r.children].find(k => k !== x && !k.contains(x) && /^(LABEL|SPAN|DIV)$/.test(k.tagName) && txt(k) && txt(k).length < 34 && !k.querySelector('select,input,button')); return c ? txt(c).replace(/[:：]\s*$/, '') : ''; };
    sels.forEach(x => { const o0 = txt(x.options[0] || x); if (!/wählen|einsetzen|laden|vorführen|…|\.\.\./i.test(o0) && x.options.length >= 2 && x.options.length <= 7 && [...x.options].every(o => txt(o).length <= 44 && !/^[-\d.,\s]+$/.test(txt(o)))) { const l = lblOf(x); out.push((l ? ['«', [l], '»: '] : [['Zur Wahl:'], ' ']).concat(join([...x.options].map(txt), ' · '), ['.'])); } });
    const anim = all('button').filter(x => vis(x) && /^▶\s*\S/.test(txt(x)) && txt(x).length > 2).map(txt);
    if (anim.length) { const a = [['Animation:'], ' «']; anim.forEach((t, i) => { if (i) a.push('», «'); a.push([t]); }); a.push('».'); out.push(a); }
    const chk = all('label').filter(x => vis(x) && x.querySelector('input[type=checkbox]') && !/Rechenweg als Karte/.test(txt(x))).map(txt).filter(t => t.length < 60);
    if (chk.length) out.push([['Ein- und ausblenden:'], ' '].concat(join(chk.slice(0, 9), ' · '), [chk.length > 9 ? ' ….' : '.']));
    // das Übliche in einem Satz (ausführlich im Reiter «Allgemeine Bedienung»)
    const gen = [];
    if (all('button').some(x => vis(x) && txt(x) === '◀')) gen.push('Zahlenfelder mit ◀ ▶');
    if (all('button').some(x => /Ausschnitt/.test(txt(x)))) gen.push('Mausrad oder zwei Finger zoomen, Ziehen verschiebt, «⟲ Ausschnitt» stellt ihn wieder her');
    const rs = document.querySelector('#env-hint .eh-reset'); if (rs && vis(rs)) gen.push('«⟲ Zurücksetzen» über dem Bild stellt den Anfang wieder her');
    if (all('label').some(x => /Rechenweg als Karte/.test(txt(x)))) gen.push('der Rechenweg steht in der Karte rechts');
    if (all('button').some(x => txt(x) === 'JPEG')) gen.push('Export als JPEG oder LaTeX links unten');
    if (gen.length) out.push([['Wie überall:'], ' '].concat(join(gen, '; '), ['.']));
    return out;
  }
  function helpEnvBody(env) {
    const box = el('div', 'tp-help-body'), e = typeof envById === 'function' ? envById(env) : null; if (!e) return box;
    const sec = (title, items, cls) => { const s = el('section', 'tp-help-sec' + (cls ? ' ' + cls : '')); { const h = el('h2'); (Array.isArray(title) ? title : [title]).forEach(x => h.append(x)); s.append(h); } if (items && items.length) { const ul = el('ul'); items.forEach(i => { const li = el('li'); if (Array.isArray(i)) i.forEach(sg => li.append(Array.isArray(sg) ? el('span', null, sg[0]) : sg)); else li.textContent = i; ul.appendChild(li); }); s.appendChild(ul); } return s; };
    if (TOPIC_ABOUT[env]) box.append(el('p', 'tp-help-about', TOPIC_ABOUT[env]));
    const views = viewsOf(env), cur = helpCurView(env), cv = views.find(v => v.id === cur), D = helpDesc(env);
    const dOf = id => { if (env === 'alg') return ['', typeof AlgLearn !== 'undefined' && AlgLearn.INTRO && AlgLearn.INTRO[id] ? AlgLearn.INTRO[id] : '']; const d = D && D[id]; return !d ? ['', ''] : Array.isArray(d) ? [d[0] || '', d[1] || ''] : [d, '']; };   // Rohtexte (mit {{Wort|ids}})
    // aktuelle Ansicht
    if (cv || (typeof ENVH !== 'undefined' && ENVH.by[env] && ENVH.by[env].text)) {
      const d = cv ? dOf(cv.id) : ['', ''], task = d[0] || (typeof ENVH !== 'undefined' && ENVH.by[env] ? ENVH.by[env].text : '') || (TOPIC_TIPS[env] && !d[1] ? TOPIC_TIPS[env] : '');
      const s = sec(cv ? ['Du bist in der Ansicht «', helpName(cv.title), '»'] : 'Darum geht es hier', null, 'tp-help-now');
      if (task) { const p1 = el('p'); p1.append(el('b', null, 'Das machst du:'), ' ', helpTxt(task)); s.append(p1); }
      if (d[1] && d[1] !== task) { const p2 = el('p'); p2.append(el('b', null, 'Das siehst du:'), ' ', helpTxt(d[1])); s.append(p2); }
      box.append(s);
    }
    const sc = helpScan(env); if (sc.length) box.append(sec('Das kannst du in dieser Ansicht einstellen', sc));
    if (TOPIC_HELP[env]) box.append(sec(['Besonderheiten im Thema «', helpName(e.title), '»'], TOPIC_HELP[env]));
    // alle Ansichten
    if (views.length > 1) {
      const s = sec('Alle Ansichten dieses Themas (anklicken, um zu wechseln)'), list = el('div', 'tp-help-views');
      views.forEach(v => {
        const b = el('button', 'tp-help-view' + (v.id === cur ? ' on' : '')); b.type = 'button';
        const d = dOf(v.id), full = d[1] || d[0];   // ganzer Text (dieselbe Übersetzung wie in der Leiste), per CSS auf zwei Zeilen gekürzt
        b.append(el('b', null, v.title)); if (full) b.append(helpTxt(full, 'tp-help-vd'));
        b.addEventListener('click', () => { helpClose(); v.go(); });
        list.appendChild(b);
      });
      s.appendChild(list); box.append(s);
    }
    return box;
  }
  function helpGenBody() {
    const box = el('div', 'tp-help-body');
    const sec = (title, items) => { const s = el('section', 'tp-help-sec'); s.append(el('h2', null, title)); const ul = el('ul'); items.forEach(i => { const li = el('li'); if (Array.isArray(i)) i.forEach(sg => li.append(Array.isArray(sg) ? el('span', null, sg[0]) : sg)); else li.textContent = i; ul.appendChild(li); }); s.appendChild(ul); return s; };
    box.append(
      sec('Thema finden', ['«Startseite» oben links, das Logo und der Knopf mit dem Themennamen in der Leiste öffnen die Startseite mit allen Themen.', 'Dort kannst du nach Begriffen suchen (z.B. «Tangente», «Nullstellen», «Zinseszins») und direkt in die passende Ansicht springen.', 'Jedes Thema hat links oben eine Auswahl «Ansicht» mit mehreren Unterthemen.', 'Der Knopf «? Hilfe zum Thema» in der Leiste erklärt, was im aktuellen Thema und in der aktuellen Ansicht besonders ist.']),
      sec('Im Bild arbeiten', ['Punkte und farbige Griffe lassen sich mit der Maus oder dem Finger ziehen; sie rasten auf dem Raster ein. Mit gedrückter Shift-Taste ziehst du frei.', 'Mausrad oder zwei Finger zoomen, Ziehen auf leerer Fläche verschiebt, Doppelklick setzt den Ausschnitt zurück.', 'Die Zahlenfelder links haben Pfeile ◀ ▶ für Schritte; Eingabe mit Enter bestätigen.', 'Unterstrichene Wörter im Satz über dem Bild heben beim Darüberfahren die zugehörigen Teile im Bild hervor.']),
      sec('Rechenweg und Export', ['Die Karte rechts zeigt den Rechenweg Schritt für Schritt und verändert sich mit dem Bild. Sie lässt sich mit ✕ schliessen und links wieder einschalten.', 'Unter «Export» bekommst du das Bild als JPEG oder als LaTeX (TikZ) und den Rechenweg als LaTeX-Text zum Kopieren.', 'Rückgängig und Wiederholen stehen oben links (auch Cmd/Ctrl+Z).']),
      sec('Weiteres', ['Dark Mode und Beamer-Modus (grosse Schrift, hoher Kontrast) oben rechts.', 'Die Sprache wählst du oben rechts; die Oberfläche wird übersetzt.', 'Speichern und Laden: Im Thema «Funktionen» im Panel «Export»; der Zustand jedes Themas bleibt beim Wechsel erhalten.']));
    return box;
  }
  // which: 'env' (Hilfe zum aktuellen Thema, Standard) oder 'gen' (allgemeine Bedienung)
  function helpOpen(which) {
    let d = $('help-dlg');
    if (!d) {
      d = el('div'); d.id = 'help-dlg'; d.className = 'tp-overlay';
      d.appendChild(el('div', 'tp-box tp-help')); document.body.appendChild(d);
      d.addEventListener('click', ev => { if (ev.target === d) helpClose(); });
    }
    const env = typeof ENV !== 'undefined' ? ENV.cur : null, e = env && typeof envById === 'function' ? envById(env) : null;
    const tab = which === 'gen' || !e ? 'gen' : 'env', box = d.firstChild; box.replaceChildren();
    const head = el('div', 'tp-head'), t = el('div', 'tp-title');
    t.append((() => { const b = el('b'); if (tab === 'env') b.append('Hilfe: ', helpName(e.title)); else b.textContent = 'Hilfe'; return b; })(), (() => { const s = el('span', 'tp-sub'); if (tab === 'env') s.textContent = 'Was in diesem Thema und in dieser Ansicht besonders ist'; else s.append('So bedienst du ', brandTxt()); return s; })());
    const cl = el('button', 'tp-close', '✕'); cl.type = 'button'; cl.setAttribute('aria-label', 'Schliessen'); cl.addEventListener('click', helpClose); head.append(t, cl);
    const tabs = el('div', 'tp-help-tabs');
    const mk = (id, label) => { const b = el('button', 'tp-help-tab' + (tab === id ? ' on' : ''), label); b.type = 'button'; b.addEventListener('click', () => helpOpen(id)); return b; };
    if (e) tabs.append(mk('env', 'Dieses Thema'), mk('gen', 'Allgemeine Bedienung'));
    box.append(head, tabs, tab === 'env' ? helpEnvBody(env) : helpGenBody());
    d.style.display = 'flex'; d.scrollTop = 0;
  }
  function helpClose() { const d = $('help-dlg'); if (d) d.style.display = 'none'; }

  // ── Hinweis unten in der Seitenleiste ──
  function footRefresh() {
    const sb = $('sidebar'); if (!sb) return;
    let f = $('topic-foot');
    if (!f) {
      f = el('div'); f.id = 'topic-foot';
      const d = el('div', 'tf-desc'); d.append(el('span', 'tf-lead', 'Du bist im Thema'), document.createTextNode(' '), (() => { const b = el('b', 'tf-env'); b.id = 'tf-env'; return b; })(), document.createTextNode('. '), el('span', 'tf-more', 'Anderes Thema gesucht? Die Startseite zeigt alle Themen und hat eine Suche.'));
      f.append(d, (() => { const r = el('div', 'tf-row'); const b1 = el('button', null, '🏠 Startseite'); b1.type = 'button'; b1.addEventListener('click', () => topicsOpen(true)); const b2 = el('button', null, '? Hilfe zum Thema'); b2.type = 'button'; b2.addEventListener('click', () => helpOpen('env')); r.append(b1, b2); return r; })());
      sb.appendChild(f);
    }
    const e = typeof envById === 'function' && typeof ENV !== 'undefined' ? envById(ENV.cur) : null;
    f.querySelector('.tf-env').textContent = e ? e.title : '';   // Anführungszeichen per CSS: so gilt die Übersetzung des Titels
  }

  // ── Tipp im Bild ──
  const tipSeen = {};
  let tipTimer = 0;
  function topicTipShow(env, now) {
    const wrap = $('canvas-wrap'); if (!wrap || !TOPIC_TIPS[env] || tipSeen[env]) return;
    if (!now) { tipSeen[env] = true; setTimeout(() => { tipSeen[env] = false; topicTipShow(env, true); }, 350); return; }   // erst nach dem Aufbau der Karte (Breite)
    tipSeen[env] = true;
    let t = $('topic-tip');
    if (!t) { t = el('div'); t.id = 'topic-tip'; const x = el('button', null, '✕'); x.type = 'button'; x.setAttribute('aria-label', 'Tipp schliessen'); x.addEventListener('click', topicTipHide); t.append(el('span', 'tt-txt'), x); wrap.appendChild(t); }
    t.querySelector('.tt-txt').textContent = '💡 ' + TOPIC_TIPS[env];
    t.style.display = 'flex';
    const card = $('dif-card'), dock = card && card.style.display === 'flex' && !card.classList.contains('dif-card-sheet') ? card.offsetWidth : 0;   // Karte rechts: Tipp in der freien Breite zentrieren
    t.style.left = Math.round((wrap.clientWidth - dock) / 2) + 'px'; t.style.maxWidth = Math.max(240, wrap.clientWidth - dock - 24) + 'px';
    clearTimeout(tipTimer); tipTimer = setTimeout(topicTipHide, 16000);
  }
  function topicTipHide() { const t = $('topic-tip'); if (t) t.style.display = 'none'; clearTimeout(tipTimer); }
  const cv = $('canvas'); if (cv) ['mousedown', 'touchstart', 'wheel'].forEach(ev => cv.addEventListener(ev, () => { const t = $('topic-tip'); if (t && t.style.display === 'flex') setTimeout(topicTipHide, 1500); }, { passive: true, capture: true }));

  // Umgebungswechsel beobachten (Attribut data-env am body)
  new MutationObserver(() => { footRefresh(); try { topicTipShow(document.body.getAttribute('data-env')); } catch (e) {} }).observe(document.body, { attributes: true, attributeFilter: ['data-env'] });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') { topicsClose(); helpClose(); } });
  document.addEventListener('langchange', () => setTimeout(langsMark, 50));
  // Logo öffnet die Übersicht
  const brand = document.querySelector('.brand-name'); if (brand) { brand.style.cursor = 'pointer'; brand.title = 'Startseite'; brand.addEventListener('click', () => topicsOpen(false)); }

  // Neu laden (gleicher Tab): dort weitermachen, wo man war. Beim Verlassen der Seite wird der Zustand aller Themen
  // in sessionStorage abgelegt (gilt nur für diesen Tab; ein neuer Besuch beginnt wieder auf der Startseite).
  const SESS = 'j10.session';
  const sessSave = () => {
    try {
      if (typeof captureState !== 'function' || typeof ENV === 'undefined') return;
      const ws = {}; Object.keys(ENV.ws || {}).forEach(id => { const w = ENV.ws[id]; if (id !== ENV.cur && w && w.state) ws[id] = { state: w.state, view: w.view }; });
      const o = $('topics'), sb = $('sidebar');
      sessionStorage.setItem(SESS, JSON.stringify({ t: Date.now(), cur: ENV.cur, state: captureState(), view: Object.assign({}, view), ws, home: !!(o && o.style.display === 'flex'), scroll: sb ? sb.scrollTop : 0 }));
    } catch (e) { /* Speicher voll oder gesperrt: dann eben Startseite */ }
  };
  window.addEventListener('pagehide', sessSave); window.addEventListener('beforeunload', sessSave);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') sessSave(); });
  const sessRestore = () => {
    let d = null; try { d = JSON.parse(sessionStorage.getItem(SESS) || 'null'); } catch (e) { d = null; }
    if (!d || !d.state || typeof applyState !== 'function' || typeof ENV === 'undefined') return false;
    try {
      Object.keys(d.ws || {}).forEach(id => { const w = d.ws[id]; if (w && w.state && id !== d.cur) ENV.ws[id] = { state: w.state, view: w.view || Object.assign({}, view), stack: [w.state], idx: 0, scroll: 0 }; });
      applyState(d.state);
      if (d.view) view = Object.assign({}, view, d.view);
      if (typeof undoStack !== 'undefined') { undoStack = [JSON.parse(JSON.stringify(captureState()))]; historyIdx = 0; if (typeof updateUndoRedoBtns === 'function') updateUndoRedoBtns(); }
      if (typeof syncInputs === 'function') syncInputs();
      if (typeof scheduleDraw === 'function') scheduleDraw();
      const sb = $('sidebar'); if (sb && d.scroll) setTimeout(() => { sb.scrollTop = d.scroll; }, 50);
      const bc = $('boot-cover'); if (bc) { requestAnimationFrame(() => bc.classList.add('gone')); setTimeout(() => bc.remove(), 250); }
      return ENV.cur === d.cur && !d.home;                                // war die Startseite offen: wieder dort
    } catch (e) { return false; }
  };

  // Start: Fusszeile, Tipp, Willkommen beim ersten Besuch
  // Startseite: die Übersicht mit Begrüssung erscheint bei jedem Laden
  const start = () => { footRefresh(); setTimeout(() => { try { topicTipShow(typeof ENV !== 'undefined' ? ENV.cur : 'func'); } catch (e) {} }, 900); try { if (!sessRestore()) topicsOpen(true); } catch (e) { const bc = $('boot-cover'); if (bc) bc.remove(); } setTimeout(() => { const o = $('topics'); if (o && o.style.display === 'flex') topicsOpen(true); }, 300); /* sofort zeigen (Startbild weg), nach dem Start der übrigen Module nochmals auffrischen */ const hb = $('home-btn'); if (hb) hb.addEventListener('click', () => topicsOpen(true)); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  window.topicsOpen = topicsOpen; window.topicsClose = topicsClose; window.topicsToggle = topicsToggle; window.topicGo = topicGo; window.helpOpen = helpOpen; window.helpClose = helpClose; window.topicsSearch = topicsSearch;
  window.topicViewsOf = viewsOf;
})();
