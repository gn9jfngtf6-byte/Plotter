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
  { id: 'alg', title: 'Algebra', envs: ['alg'] },
  { id: 'geo', title: 'Geometrie', envs: ['geo', 'sim', '3d'] },
  { id: 'sto', title: 'Stochastik', envs: ['stat'] },
  { id: 'app', title: 'Anwendungen', envs: ['fin', 'lo'] }
];
// Stichworte je Ansicht (deutsch; die Suche vergleicht auch mit den angezeigten, übersetzten Titeln)
const TOPIC_KW = {
  func: { func: 'Funktion zeichnen Graph Funktionsgraph Werkzeug beliebige Funktion Parameter Schieber Nullstellen Extrema Ableitung Stammfunktion', bars: 'Balken Stellen Punkte Abstand Funktionswerte Schrittweite Wertetabelle' },
  exp: { grow: 'Exponentialfunktion Wachstum Zerfall Basis Faktor Prozent Halbwertszeit Verdoppelungszeit Asymptote lineares Wachstum', e: 'Eulersche Zahl e Grenzwert Tangente Steigung e hoch x Ableitung', log: 'Logarithmus Logarithmusfunktion Umkehrfunktion ln lg Logarithmengesetze Basiswechsel Spiegelung', eq: 'Exponentialgleichung lösen logarithmieren Zinseszins Bevölkerung Bakterien Medikament radioaktiver Zerfall Abkühlung Anwendung' },
  trig: { circ: 'Einheitskreis Sinus Kosinus Winkel Bogenmass Grad Radiant besondere Winkel 30 45 60 Quadrant Sinuskurve', gen: 'allgemeine Sinusfunktion Amplitude Periode Phase Phasenverschiebung Mittellinie Frequenz Schwingung Kosinusfunktion Strecken Verschieben', tan: 'Tangens Polstelle Asymptote Steigung Beziehungen sin² + cos² = 1 Symmetrie Periode π Tangente am Einheitskreis' },
  inv: { mirror: 'Umkehrfunktion Begriff Spiegelung Winkelhalbierende y = x Wertetabelle rückwärts Koordinaten tauschen Definitionsbereich Wertebereich', test: 'Umkehrbarkeit umkehrbar streng monoton waagrechte Gerade Einschränkung Definitionsbereich einschränken Ast Scheitel injektiv', calc: 'Umkehrfunktion berechnen nach x auflösen Variablen vertauschen Rechenweg Probe Verkettung', pairs: 'bekannte Paare Quadrat Wurzel Potenz Logarithmus Exponential ln e hoch x arcsin arccos arctan Kehrwert selbstinvers' },
  intro: { map: 'Funktion Zuordnung Wertetabelle einsetzen Funktionswert Argument Schreibweise Graph Punkte Einführung Einstieg', bars: 'Balken Stellen Abstand Punkte Graph Kurve entsteht Schrittweite Animation', def: 'Funktionsbegriff Definitionsbereich Wertebereich Nullstellen y-Achsenabschnitt steigend fallend Monotonie Hochpunkt Tiefpunkt senkrechte Gerade Test Kreis keine Funktion', app: 'Anwendungen Einheiten Grössen Weg Zeit Fall Wurf Temperatur Tarif Bremsweg Abkühlung Fläche ablesen' },
  sim: { map: 'Ähnlichkeit ähnlich Ähnlichkeitsabbildung zentrische Streckung Streckfaktor k Zentrum Drehung Spiegelung Verschiebung Punktspiegelung Seitenverhältnis Bild Original kongruent Fläche', test: 'ähnliche Dreiecke Winkel vergleichen entsprechende Ecken Seitenverhältnisse gleich ähnlich oder nicht Zuordnung', ray: 'Strahlensatz Strahlensätze erster zweiter Parallelen V-Figur X-Figur Verhältnisgleichung fehlende Länge', right: 'rechtwinkliges Dreieck Höhe Höhensatz Kathetensatz Thaleskreis drei ähnliche Dreiecke Pythagoras' },
  lin: { par: 'Steigung y-Achsenabschnitt Steigungsdreieck Wertetabelle Gerade m q Steigungswinkel', two: 'Gerade durch zwei Punkte Punkt und Steigung Geradengleichung aufstellen Parallele Senkrechte', sys: 'Schnittpunkt zweier Geraden Gleichsetzen Einsetzen Additionsverfahren Gleichungssystem parallel identisch Schnittwinkel', app: 'Anwendung Sachaufgabe Tarife Handy Taxi Abo Break-even Bewegung Treffpunkt Verfolgung Zeit Ort', perp: 'Nullstelle Senkrechte Lotfusspunkt Abstand Mittelsenkrechte orthogonal rechtwinklig' },
  quad: { par: 'Parabel Standardform Scheitelform Nullstellenform Normalparabel Streckfaktor Öffnung Parameter a b c', vtx: 'Scheitelpunkt quadratische Ergänzung Verschiebung Strecken Minimum Maximum Symmetrieachse', zer: 'Nullstellen Diskriminante Mitternachtsformel Lösungsformel abc-Formel pq-Formel Vieta quadratische Gleichung', cmb: 'Parabel und Gerade Sekante Tangente Passante Schnittpunkte Berührpunkt Parabel durch drei Punkte Scheitel und Punkt' },
  pow: { fam: 'Potenzfunktion x hoch n Exponent gerade ungerade Symmetrie Spiegelpunkt', neg: 'negativer Exponent Hyperbel 1/x Asymptote Definitionslücke Polstelle Kehrwert', root: 'Wurzelfunktion Quadratwurzel Kubikwurzel Umkehrfunktion Spiegelung Winkelhalbierende rationaler Exponent Potenzschreibweise', gen: 'allgemeine Form Strecken Spiegeln Verschieben Parameter a v h Definitionsbereich Wertebereich Grundfunktion', eq: 'Potenzgleichung Wurzelgleichung lösen Fallunterscheidung x hoch n gleich c' },
  diff: { tan: 'Sekante Tangente Differenzenquotient Differentialquotient Steigung Ableitung Grenzwert h gegen 0 momentane Änderungsrate', gr: 'graphisches Ableiten Ableitungsfunktion Steigungsfunktion f strich Skizze', rg: 'Ableitungsregeln Potenzregel Produktregel Quotientenregel Kettenregel Summenregel ableiten', kd: 'Kurvendiskussion Extrema Hochpunkt Tiefpunkt Wendepunkt Monotonie Krümmung Nullstellen Symmetrie' },
  int: { sum: 'Obersumme Untersumme Riemann Integral Fläche Streifen Rechtecke', hs: 'Integralfunktion Hauptsatz Stammfunktion bestimmtes Integral Grenzen', rg: 'Stammfunktion integrieren Regeln Potenzregel unbestimmtes Integral Konstante', ar: 'Fläche zwischen Kurven Flächeninhalt Graphen eingeschlossene Fläche', rot: 'Rotationskörper Volumen Rotationsvolumen Drehkörper Scheiben' },
  seq: { def: 'Folge Glieder explizit rekursiv Startwert Vorgänger Nachfolger Streichhölzer Muster', ari: 'arithmetische Folge Differenz d lineares Wachstum Kinosaal', geo: 'geometrische Folge Quotient q exponentielles Wachstum Zerfall Papier falten ab welchem Glied Logarithmus', sum: 'Reihe Summenzeichen Partialsumme arithmetische Reihe Gauss geometrische Reihe Schachbrett Summe', lim: 'Grenzwert Konvergenz konvergent divergent Epsilon Streifen unendliche geometrische Reihe halber Weg', ind: 'vollständige Induktion Induktionsanfang Induktionsschritt Domino Beweis Summenformel Primzahl Gegenbeispiel' },
  alg: { expand: 'Ausmultiplizieren Distributivgesetz binomische Formeln Klammern auflösen', factor: 'Faktorisieren Ausklammern Linearfaktoren Satz von Vieta', complete: 'quadratische Ergänzung Scheitelform Quadrat', binom: 'binomischer Lehrsatz Pascalsches Dreieck Binomialkoeffizient', pow: 'Potenzgesetze Wurzelgesetze Potenzen Wurzeln rationale Exponenten', log: 'Logarithmen Logarithmengesetze Basiswechsel', frac: 'Bruchterme kürzen erweitern Hauptnenner Definitionsmenge', eq: 'Gleichungen lösen Äquivalenzumformung Waage Bruchgleichung Wurzelgleichung quadratische Gleichung', sys: 'Gleichungssysteme Additionsverfahren Einsetzungsverfahren Gleichsetzungsverfahren Gauss' },
  geo: { _: 'Konstruktion Dreieck Kreis Gerade Strecke Winkel Mittelsenkrechte Winkelhalbierende Thaleskreis Umkreis Inkreis Höhe Schwerpunkt Pythagoras Tangente Ellipse' },
  '3d': { _: 'Ebene Koordinatenform Normalenvektor Achsenabschnitte Spurgeraden Schnittgerade Schnittwinkel Abstand Punkt Ebene Raum Vektor Gleichungssystem' },
  stat: { dice: 'Würfel Münze Wahrscheinlichkeit relative Häufigkeit Gesetz der grossen Zahlen', dice2: 'Augensumme zwei Würfel Verteilung', galton: 'Galtonbrett Binomialverteilung Glockenkurve', pi: 'Monte Carlo Kreiszahl Zufallspunkte', buffon: 'Buffon Nadel Nadelexperiment', monty: 'Ziegenproblem Monty Hall bedingte Wahrscheinlichkeit Türen', birthday: 'Geburtstagsparadoxon Gegenereignis', walk: 'Zufallsspaziergang Random Walk Irrfahrt', clt: 'Zentraler Grenzwertsatz Mittelwert Stichprobe Normalverteilung', ci: 'Konfidenzintervall Vertrauensintervall Schätzen Stichprobe', bayes: 'Bayes Test Paradox bedingte Wahrscheinlichkeit falsch positiv Vierfeldertafel', urn: 'Urne Kugeln ziehen mit ohne Zurücklegen Baumdiagramm hypergeometrisch Pfadregel' },
  fin: { line: 'Zeitstrahl Konto Aufzinsen Abzinsen Zahlung Zeitwert', sum: 'Summenzeichen Rente Reihe', save: 'Sparplan Rente vorschüssig nachschüssig Endwert Raten', loan: 'Kredit Tilgungsplan Annuität Zins Hypothek Restschuld', value: 'Zeitwert Zinseszins Barwert Endwert Zinsfaktor', march: 'Marchzins Kalender Tage Zinstage 30/360', conform: 'konformer Zins unterjährig effektiver Zins Zinsperiode' },
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
  sim: 'Ein fixes Dreieck und sein Bild, das du drehst, streckst, spiegelst und verschiebst: Die Seitenverhältnisse stehen als Brüche daneben. Dazu Strahlensätze und das rechtwinklige Dreieck mit Höhe.',
  '3d': 'Ebenen im Raum in Koordinatenform: Achsenabschnitte, Spurgeraden, Schnittgeraden und Abstände. Den Raum drehst du mit der Maus.',
  stat: 'Zufallsexperimente zum Mitverfolgen: Würfel, Galtonbrett, Ziegenproblem und mehr. Relative Häufigkeiten nähern sich der Wahrscheinlichkeit.',
  fin: 'Geld und Zeit: Zeitstrahl und Konten, Sparpläne, Kredite mit Tilgungsplan, Marchzins und konformer Zins, jeweils mit vollständigem Rechenweg.',
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
  '3d': 'Ziehe im Bild, um den Raum zu drehen; links stellst du die Ebenen ein.',
  stat: 'Wähle links ein Experiment und starte es; die Geschwindigkeit lässt sich einstellen.',
  fin: 'Wähle links eine Ansicht und ändere die Zahlen; das Bild und der Rechenweg passen sich an.',
  lo: 'Gib links die Ungleichungen ein und ziehe die Niveaulinie oder den Testpunkt im Bild. Rechts steht der Rechenweg.'
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

  // ── Übersicht ──
  let built = false;
  function build() {
    if (built) return; built = true;
    const ov = $('topics'); ov.replaceChildren();
    const box = el('div', 'tp-box');
    // Kopf: Willkommen, Suche, drei Schritte
    const head = el('div', 'tp-head');
    // Der Name im Titel ist das Logo selbst (gleiche Wortmarke wie oben links)
    const h = el('div', 'tp-title'); const tb = el('b', null, 'Willkommen bei '); const mk = document.querySelector('.brand-mark'); const mark = mk ? mk.cloneNode(true) : el('span', null, 'J√10'); mark.id = ''; mark.classList.add('tp-mark-inline'); mark.setAttribute('translate', 'no'); mark.setAttribute('aria-label', 'J Wurzel 10'); tb.appendChild(mark);
    h.append(tb, el('span', 'tp-sub', 'Mathematik zum Anfassen: Bilder, an denen du ziehen kannst, und Rechenwege, die mitdenken.'));
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
    const sw = el('div', 'tp-search');
    const inp = el('input'); inp.type = 'search'; inp.id = 'topics-q'; inp.placeholder = 'Wonach suchst du? z.B. Tangente, Nullstellen, Zinseszins …'; inp.autocomplete = 'off'; inp.setAttribute('aria-label', 'Themen durchsuchen');
    sw.append(el('span', 'tp-lupe', '🔍'), inp);
    const wel = el('div', 'tp-welcome'); wel.id = 'tp-welcome';
    const steps = el('div', 'tp-steps');
    [['🗂', 'Thema wählen', 'Unten findest du alle Themen mit ihren Ansichten. Ein Klick genügt; zurück kommst du jederzeit mit «Startseite» oben links.'],
     ['✋', 'Im Bild ziehen', 'Punkte und farbige Griffe lassen sich verschieben. Das Mausrad zoomt, ein Doppelklick setzt den Ausschnitt zurück.'],
     ['📝', 'Rechenweg lesen', 'Rechts erklärt eine Karte Schritt für Schritt, was im Bild geschieht. Unter «Export» gibt es LaTeX und JPEG.']].forEach(([ic, t, d], k) => {
      const c = el('div', 'tp-step'); c.append(el('span', 'tp-step-ic', ic), (() => { const x = el('div'); x.append(el('b', null, (k + 1) + ' · ' + t), el('span', null, d)); return x; })()); steps.appendChild(c);
    });
    wel.append(steps);
    const allH = el('h1', 'tp-all', 'Alle Themen');
    // Schnellwahl der Themengruppen (springt zur Gruppe)
    const nav = el('div', 'tp-nav'); nav.id = 'tp-nav';
    TOPIC_GROUPS.forEach(g => { const b = el('button', 'tp-navbtn'); b.type = 'button'; b.append(el('span', null, g.title), el('small', null, String(g.envs.filter(id => typeof envById !== 'function' || envById(id)).length))); b.addEventListener('click', () => { const t = document.getElementById('tp-g-' + g.id); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); nav.appendChild(b); });
    // Gruppen
    const groups = el('div', 'tp-groups'); groups.id = 'tp-groups';
    TOPIC_GROUPS.forEach(g => {
      const n = g.envs.filter(id => typeof envById !== 'function' || envById(id)).length;
      const sec = el('section', 'tp-group'); sec.id = 'tp-g-' + g.id; sec.style.setProperty('--n', String(Math.min(4, Math.max(1, n)))); sec.append(el('h2', null, g.title));
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
    box.append(head, sw, nav, wel, allH, groups, res, foot); ov.appendChild(box);
    ov.addEventListener('click', ev => { if (ev.target.closest && ev.target.closest('.tp-card.tp-open')) return; document.querySelectorAll('#tp-groups .tp-card.tp-open').forEach(c => { c.classList.remove('tp-open'); c.querySelector('.tp-views').hidden = true; c.querySelector('.tp-more').setAttribute('aria-expanded', 'false'); }); });
    inp.addEventListener('input', () => topicsSearch(inp.value));
    inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { const first = res.querySelector('button'); if (first) first.click(); } });
  }
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9äöüßáéíóúàèìòùâêîôûçñăąćęłńśźżčďěňřšťůýž€]+/gi, ' ').trim();
  function topicsSearch(q) {
    const res = $('tp-results'), groups = $('tp-groups'), wel = $('tp-welcome');
    const words = norm(q).split(' ').filter(w => w.length >= 2);
    const allH = document.querySelector('#topics .tp-all');
    const nav = $('tp-nav');
    if (!words.length) { res.style.display = 'none'; groups.style.display = ''; if (wel) wel.style.display = ''; if (allH) allH.style.display = ''; if (nav) nav.style.display = ''; return; }
    groups.style.display = 'none'; if (wel) wel.style.display = 'none'; if (allH) allH.style.display = 'none'; if (nav) nav.style.display = 'none'; res.style.display = ''; res.replaceChildren();
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
    const wel = $('tp-welcome'); if (wel) wel.style.display = '';
    const cur = typeof ENV !== 'undefined' ? ENV.cur : 'func';
    const ce = typeof envById === 'function' ? envById(cur) : null, cb = $('tp-continue');
    if (cb) { cb.replaceChildren(el('span', 'tp-cont-l', 'Weiter mit'), el('b', null, ce ? ce.title : ''), el('span', 'tp-cont-arrow', '→')); cb.title = 'Zurück zum Thema «' + (ce ? ce.title : '') + '»'; }
    document.querySelectorAll('#tp-groups .tp-card').forEach(c => c.classList.toggle('tp-cur', c.getAttribute('data-env') === cur));
    const q = $('topics-q'); if (q) { q.value = ''; topicsSearch(''); if (window.innerWidth > 700) setTimeout(() => q.focus(), 50); }
    const b = $('env-btn'); if (b) b.setAttribute('aria-expanded', 'true');
  }
  function topicsClose() {
    const ov = $('topics'); if (!ov || ov.style.display === 'none') return;
    ov.style.display = 'none'; document.body.classList.remove('topics-open');
    const b = $('env-btn'); if (b) b.setAttribute('aria-expanded', 'false');
  }
  function topicsToggle() { const ov = $('topics'); if (ov && ov.style.display === 'flex') topicsClose(); else topicsOpen(false); }

  // ── Hilfe ──
  function helpOpen() {
    let d = $('help-dlg');
    if (!d) {
      d = el('div'); d.id = 'help-dlg'; d.className = 'tp-overlay';
      const box = el('div', 'tp-box tp-help');
      const head = el('div', 'tp-head'); const t = el('div', 'tp-title'); t.append(el('b', null, 'Hilfe'), el('span', 'tp-sub', 'So bedienst du J√10'));
      const cl = el('button', 'tp-close', '✕'); cl.type = 'button'; cl.setAttribute('aria-label', 'Schliessen'); cl.addEventListener('click', helpClose); head.append(t, cl);
      const sec = (title, items) => { const s = el('section', 'tp-help-sec'); s.append(el('h2', null, title)); const ul = el('ul'); items.forEach(i => ul.appendChild(el('li', null, i))); s.appendChild(ul); return s; };
      box.append(head,
        sec('Thema finden', ['«Startseite» oben links, das Logo und der Knopf mit dem Themennamen in der Leiste öffnen die Startseite mit allen Themen.', 'Dort kannst du nach Begriffen suchen (z.B. «Tangente», «Nullstellen», «Zinseszins») und direkt in die passende Ansicht springen.', 'Jedes Thema hat links oben eine Auswahl «Ansicht» mit mehreren Unterthemen.']),
        sec('Im Bild arbeiten', ['Punkte und farbige Griffe lassen sich mit der Maus oder dem Finger ziehen; sie rasten auf dem Raster ein. Mit gedrückter Shift-Taste ziehst du frei.', 'Mausrad oder zwei Finger zoomen, Ziehen auf leerer Fläche verschiebt, Doppelklick setzt den Ausschnitt zurück.', 'Die Zahlenfelder links haben Pfeile ◀ ▶ für Schritte; Eingabe mit Enter bestätigen.']),
        sec('Rechenweg und Export', ['Die Karte rechts zeigt den Rechenweg Schritt für Schritt und verändert sich mit dem Bild. Sie lässt sich mit ✕ schliessen und links wieder einschalten.', 'Unter «Export» bekommst du das Bild als JPEG oder als LaTeX (TikZ) und den Rechenweg als LaTeX-Text zum Kopieren.', 'Rückgängig und Wiederholen stehen oben links (auch Cmd/Ctrl+Z).']),
        sec('Weiteres', ['Dark Mode und Beamer-Modus (grosse Schrift, hoher Kontrast) oben rechts.', 'Die Sprache wählst du oben rechts; die Oberfläche wird übersetzt.', 'Speichern und Laden: Im Thema «Funktionen» im Panel «Export»; der Zustand jedes Themas bleibt beim Wechsel erhalten.']));
      d.appendChild(box); document.body.appendChild(d);
      d.addEventListener('click', ev => { if (ev.target === d) helpClose(); });
    }
    d.style.display = 'flex';
  }
  function helpClose() { const d = $('help-dlg'); if (d) d.style.display = 'none'; }

  // ── Hinweis unten in der Seitenleiste ──
  function footRefresh() {
    const sb = $('sidebar'); if (!sb) return;
    let f = $('topic-foot');
    if (!f) {
      f = el('div'); f.id = 'topic-foot';
      const d = el('div', 'tf-desc'); d.append(el('span', 'tf-lead', 'Du bist im Thema'), document.createTextNode(' '), el('b', 'tf-env'), document.createTextNode('. '), el('span', 'tf-more', 'Anderes Thema gesucht? Die Startseite zeigt alle Themen und hat eine Suche.'));
      f.append(d, (() => { const r = el('div', 'tf-row'); const b1 = el('button', null, '🏠 Startseite'); b1.type = 'button'; b1.addEventListener('click', () => topicsOpen(true)); const b2 = el('button', null, '? Hilfe'); b2.type = 'button'; b2.addEventListener('click', helpOpen); r.append(b1, b2); return r; })());
      sb.appendChild(f);
    }
    const e = typeof envById === 'function' && typeof ENV !== 'undefined' ? envById(ENV.cur) : null;
    f.querySelector('.tf-env').textContent = e ? '«' + e.title + '»' : '';
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

  // Start: Fusszeile, Tipp, Willkommen beim ersten Besuch
  // Startseite: die Übersicht mit Begrüssung erscheint bei jedem Laden
  const start = () => { footRefresh(); setTimeout(() => { try { topicTipShow(typeof ENV !== 'undefined' ? ENV.cur : 'func'); } catch (e) {} }, 900); setTimeout(() => topicsOpen(true), 300); const hb = $('home-btn'); if (hb) hb.addEventListener('click', () => topicsOpen(true)); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  window.topicsOpen = topicsOpen; window.topicsClose = topicsClose; window.topicsToggle = topicsToggle; window.topicGo = topicGo; window.helpOpen = helpOpen; window.helpClose = helpClose; window.topicsSearch = topicsSearch;
  window.topicViewsOf = viewsOf;
})();
