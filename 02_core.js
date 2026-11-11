// ═══════════════════════════════════════════════════════════════════
// MODUL: core — Konstanten, globaler Zustand, Canvas-Setup, Koordinaten
// Enthält:  COLORS, RESERVED, view, functions[], points[]
//           setupCanvas(), toCanvas(), fromCanvas(), gridStep()
//           scheduleDraw(), toggleDarkMode(), toggleSettingsMenu()
// Ändern:  Standardfarben → COLORS[]
//           Startansicht  → view = {xmin,xmax,ymin,ymax}
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// KONSTANTEN — hier zentral anpassen
// ═══════════════════════════════════════════════════════════════════

// Farben der Funktionen (werden der Reihe nach vergeben).
// Erweiterbar: einfach weitere Hex-Farben anhängen.
const COLORS = ['#378ADD','#D85A30','#1D9E75','#D4537E','#7F77DD','#BA7517'];

// Alle wählbaren Farben für den Farbwähler-Popup (5×5 Raster)
const ALL_COLORS = [
  // Reihe 1: Blau-Töne
  '#1e3a8a','#2563eb','#378ADD','#60a5fa','#bfdbfe',
  // Reihe 2: Rot/Orange-Töne
  '#7f1d1d','#ef4444','#D85A30','#f97316','#fed7aa',
  // Reihe 3: Grün-Töne
  '#14532d','#16a34a','#1D9E75','#4ade80','#bbf7d0',
  // Reihe 4: Violett/Pink-Töne
  '#4c1d95','#7F77DD','#D4537E','#ec4899','#fbcfe8',
  // Reihe 5: Neutral-Töne
  '#111827','#374151','#6b7280','#9ca3af','#BA7517'
];

// Farben für manuell gesetzte Punkte (P1, P2, …)
const POINT_COLORS = ['#F5A623','#7ED321','#BD10E0','#4A90E2','#E74C3C'];

// Füllfarben für Flächen-Visualisierung (halbtransparent)
const AREA_ALPHAS = ['rgba(55,138,221,0.15)','rgba(216,90,48,0.15)','rgba(29,158,117,0.15)','rgba(127,119,221,0.15)'];

// Farben für Gitternetz, Achsen, Labels, Hintergrund — dynamisch je nach Dark Mode
const C = { get grid(){ return darkMode?'#2d3140':'#e5e7eb'; },
             get axis(){ return darkMode?'#6b7280':'#6b7280'; },
             get label(){ return beamMode?(darkMode?'#ffffff':'#000000'):(darkMode?'#6b7280':'#9ca3af'); },
             get anno(){ return beamMode?(darkMode?'#ffffff':'#000000'):(darkMode?'#c4c9d6':'#4b5563'); },
             get bg(){ return darkMode?'#16181d':'#ffffff'; } };

// ═══════════════════════════════════════════════════════════════════
// MOBILE MATHLIVE-TASTATUR (Bildschirmtastatur der math-field-Felder)
// ═══════════════════════════════════════════════════════════════════
// MathLive zeigt standardmässig 4 Tastaturen an (123/Symbole/abc/griechisch)
// mit einer riesigen Menge an Zeichen (Mengenlehre, griechisches Alphabet,
// beliebige Buchstaben, …) — für diese App komplett überdimensioniert.
// Ersetzt das durch GENAU EINE eigene Tastatur, die inhaltlich der bereits
// bestehenden Sidebar-Tastatur (#kbd-body, siehe index.html + kbdInsert() in
// 03_math.js) entspricht: gleiche Symbole/Funktionen, dazu Ziffern (die die
// Sidebar-Tastatur nicht hat, da dort meist die physische Tastatur tippt)
// und Pfeiltasten zur Navigation innerhalb der Formel (links/rechts sowie
// hoch/runter, z.B. um zwischen Zähler/Nenner eines Bruchs zu wechseln).
// Auf der Hauptseite stehen als Buchstaben nur x, n und y sowie «=» (für Gleichungen); alle übrigen Buchstaben
// (Parameter a, b, k … der Funktionen, Variablen der Algebra) liegen auf der zweiten Seite «abc» — ohne sie liess
// sich auf einem Tablet ohne Tastatur z.B. «a·x²» oder «(a+b)²» gar nicht eingeben. Keine griechischen Buchstaben
// ausser π (das hat die Sidebar-Tastatur auch schon), keine Mengenlehre-Symbole.
// "[left]", "[right]", "[up]", "[down]", "[backspace]", "[undo]", "[redo]",
// "[hide-keyboard]", "[hr]", "[separator]" sind von MathLive selbst
// vordefinierte Tasten (siehe KEYCAP_SHORTCUTS in mathlive.js).
// Die Ziffern stehen bewusst als klassisches 3×3-Ziffernblock rechts (wie ein
// Taschenrechner: 7 8 9 / 4 5 6 / 1 2 3, darunter 0 und ",") statt als eine
// lange Zehnerreihe — dafür werden die übrigen Tasten links in 6er-Zeilen
// aufgeteilt, sodass rechts durchgehend Platz für die 3 Ziffern-Spalten bleibt.
const _kbdFracLabel =
  '<span style="display:inline-block;text-align:center;line-height:1.05;font-size:0.8em;">' +
  '<span style="display:block;">□</span>' +
  '<span style="display:block;border-top:1.5px solid currentColor;">□</span>' +
  '</span>';
try {
  if (window.mathVirtualKeyboard) {
    window.mathVirtualKeyboard.layouts = [{
      label: '123',
      rows: [
        [
          'x', 'n', '\\pi', 'e', '(', ')',
          '7', '8', '9'
        ],
        [
          '+', '-', '\\cdot', { latex: '\\frac{#@}{#?}', label: _kbdFracLabel },
          { latex: '#@^{2}', label: 'x²' }, { latex: '#@^{#?}', label: 'xⁿ' },
          '4', '5', '6'
        ],
        [
          { latex: 'e^{#?}', label: 'eˣ' }, { latex: '\\sqrt{#?}', label: '√x' },
          { latex: '\\sqrt[3]{#?}', label: 'ⁿ√x' }, { latex: '\\left|#?\\right|', label: '|x|' },
          { latex: '\\sin(#?)', label: 'sin' }, { latex: '\\cos(#?)', label: 'cos' },
          '1', '2', '3'
        ],
        [
          { latex: '\\tan(#?)', label: 'tan' }, { latex: '\\ln(#?)', label: 'ln' },
          { latex: '\\log_{10}(#?)', label: 'log₁₀' }, { latex: '\\log_{2}(#?)', label: 'logₙ' },
          'y', '=',
          { latex: '0', label: '0', width: 2 }, '[.]'
        ],
        ['[hr]'],
        [
          '[undo]', '[redo]', '[separator]',
          '[left]', '[right]', '[up]', '[down]',
          { label: '[backspace]', class: 'action hide-shift' },
          '[hide-keyboard]'
        ]
      ]
    }, 'alphabetic'];   // zweite Seite «abc»: Buchstaben für Parameter (a, b, k …) und Variablen der Algebra
  }
} catch (e) { /* MathLive evtl. noch nicht geladen — Standard-Tastatur bleibt aktiv */ }

let _kbdOpen = false;
function toggleKbd() {
  // Die Tastatur ist ein normales Sidebar-Panel (#kbd-panel); das Einklappen übernimmt
  // der generische Panel-Code (11_fitting.js). Funktion bleibt als Kompatibilitäts-Aufruf.
  const p = document.getElementById('kbd-panel');
  if (p) p.classList.toggle('collapsed');
}

// Einstellungen-Popover (obere Leiste, ⚙-Knopf) — gleiches Fixed-Position-Muster
// wie das Sprachmenü (toggleLangMenu() in 01_i18n.js): Popover unter dem Knopf
// positionieren, bei Klick ausserhalb wieder schliessen. Der Inhalt (Achsen-
// Schriftgrösse, Gitternetz, Nachkommastellen, π-Notation, Zahlendarstellung,
// Beschriftungen) ist statisches HTML in index.html, daher hier nur Ein-/Ausblenden
// + Positionierung nötig (kein dynamischer Aufbau wie beim Sprachmenü).
// Popover unter einem Knopf platzieren und im Fenster halten: Die Knöpfe
// Darstellung/Einstellungen/Sprache sitzen rechts in der Toolbar — mit
// "left = Knopf-Linkskante" ragte das Menü rechts aus dem Bildschirm.
// Menü muss bereits sichtbar (display:block) sein, damit seine Breite messbar ist.
function placeMenuUnder(menu, btn) {
  if (!menu || !btn) return;
  const r = btn.getBoundingClientRect();
  const w = menu.offsetWidth;
  const margin = 8;
  let left = r.left;
  if (left + w > window.innerWidth - margin) left = r.right - w;      // rechtsbündig zum Knopf
  left = Math.max(margin, Math.min(left, window.innerWidth - w - margin));
  menu.style.top = (r.bottom + 6) + 'px';
  menu.style.left = left + 'px';
}

function toggleSettingsMenu() {
  const menu = document.getElementById('settings-menu');
  if (!menu) return;
  if (menu.style.display === 'none' || !menu.style.display) {
    const btn = document.getElementById('settings-btn');
    menu.style.display = 'block';
    placeMenuUnder(menu, btn);
    setTimeout(() => { document.addEventListener('click', closeSettingsMenuOutside, { once: true }); }, 0);
  } else {
    closeSettingsMenu();
  }
}
function closeSettingsMenu() {
  const menu = document.getElementById('settings-menu');
  if (menu) menu.style.display = 'none';
  document.removeEventListener('click', closeSettingsMenuOutside);
}
function closeSettingsMenuOutside(e) {
  const menu = document.getElementById('settings-menu');
  const btn = document.getElementById('settings-btn');
  if (menu && !menu.contains(e.target) && e.target !== btn) closeSettingsMenu();
}

let darkMode = false;
function toggleDarkMode() {
  darkMode = !darkMode;
  document.body.classList.toggle('dark', darkMode);
  const dbtn = document.getElementById('dark-btn');
  // Beschriftung bleibt (wie die übrigen Toolbar-Knöpfe) Emoji + Text; das
  // data-i18n-Attribut wird mitgewechselt, damit applyI18n() bei einem
  // Sprachwechsel nicht wieder den falschen Text einsetzt.
  dbtn.setAttribute('data-i18n', darkMode ? 'btn_lightmode' : 'btn_darkmode');
  dbtn.textContent = t(darkMode ? 'btn_lightmode' : 'btn_darkmode');
  scheduleDraw();
}

// ── Beamer-Modus ─────────────────────────────────────────────────────
let beamMode = false;
let _wakeLock = null;

// Hilfsfunktionen: skalieren LineWidth und FontSize im Beam-Modus
function bw(w) { return beamMode ? w * 1.9 : w; }
function bf(px) { return beamMode ? Math.round(px * 2.2) : px; }
function br(r) { return beamMode ? r * 2.2 : r; }  // Kreis-Radius

async function toggleBeamMode() {
  beamMode = !beamMode;
  const btn = document.getElementById('beam-btn');
  document.body.classList.toggle('beam', beamMode);
  if (btn) {
    btn.classList.toggle('active-btn', beamMode);
    btn.title = beamMode ? 'Beamer-Modus AUS' : 'Beamer-Modus EIN';
  }
  if (beamMode) {
    if ('wakeLock' in navigator) {
      try { _wakeLock = await navigator.wakeLock.request('screen'); } catch(e) {}
    }
  } else {
    if (_wakeLock) { try { _wakeLock.release(); } catch(e) {} _wakeLock = null; }
  }
  scheduleDraw();
}

// Wake Lock nach Tab-Wechsel wieder aktivieren (iOS gibt ihn automatisch frei)
document.addEventListener('visibilitychange', async () => {
  if (beamMode && document.visibilityState === 'visible' && 'wakeLock' in navigator) {
    try { _wakeLock = await navigator.wakeLock.request('screen'); } catch(e) {}
  }
});

// Reservierte Namen die NICHT als Parameter erkannt werden sollen.
// Neue eingebaute Funktionen hier eintragen wenn man sie in safeEval ergänzt.
const RESERVED = new Set(['x','sin','cos','tan','sqrt','abs','log','exp','pi','EC','nthroot','logn','log10','logbase','e','asin','acos','atan']);

const PI = Math.PI; // Abkürzung für häufige Verwendung

// ═══════════════════════════════════════════════════════════════════
// GLOBALER ZUSTAND — alle veränderlichen Daten
// ═══════════════════════════════════════════════════════════════════

// functions[]: Array von {expr: string, color: string, visible: boolean}
// - expr: Mathematischer Ausdruck als String, z.B. "sin(x)" oder "a*x+b"
// - color: Hex-Farbe des Graphen
// - visible: ob der Graph gezeichnet wird
let functions = [];

// params: Objekt mit Parameternamen als Keys
// params['a'] = {val: 1, min: -5, max: 5, step: 0.01}
// - val: aktueller Wert (wird vom Schieber gesteuert)
// - min/max: Schieber-Grenzen
// - step: Schrittweite des Schiebers
let params = {};

// points[]: Array von {x, y, color} — manuell gesetzte freie Punkte
// Diese sind IMMER ziehbar (kein Modus nötig).
let points = [];

// specials[]: berechnete besondere Punkte (Extrema, Nullstellen, Wendepunkte, Schnittpunkte)
// Format: {kind:'max'|'min'|'inf'|'zero'|'yaxis'|'isect', fi, x, y, col, [fj]}
// Wird von computeSpecials() befüllt.
let specials = [];

// activeSpecials: Set mit Schlüsseln "fi:kind" (z.B. "0:zero", "1:max")
// Steuert welche speziellen Punkte pro Funktion auf dem Canvas sichtbar sind.
// Default leer → nichts sichtbar. Wird durch Smart-Buttons gesteuert.
let activeSpecials = new Set();

// linkedLines[]: Geraden die durch zwei Punkte aus points[] definiert sind.
// Format: {fi: Funktionsindex, pi1: Punktindex1, pi2: Punktindex2}
// Wenn ein Punkt gezogen wird, wird die verknüpfte Geraden-Funktion sofort neu berechnet.
let linkedLines = [];

// graphPoints[]: Punkte die auf einem Graphen "kleben" und entlang verschoben werden können.
// Format: {fi: Funktionsindex, x: x-Koordinate, color: string}
// Der y-Wert ergibt sich immer aus safeEval(functions[fi].expr, x).
let graphPoints = [];

// unitCirclePts[]: Punkte auf dem Einheitskreis, vom Nutzer gesetzt.
// Format: {angle: Winkel in Radiant [0, 2π)}
// Sind draggable (entlang des Kreises verschiebbar).
// Projizieren auf alle sichtbaren Funktionen: x=Winkel, y=f(Winkel).
let unitCirclePts = [];

// diffQuot: Differenzenquotient-Applet ("Einstieg ins Thema Differential-
// rechnung", eigener Menüpunkt). Genau EINE Instanz — kein Array/Map wie bei
// den anderen Features, da es sich um ein dediziertes Applet handelt. Die
// Funktion ist FREI wählbar (Eingabefeld #diffquot-fn-input, Fallback x²),
// beide Punkte A und B sind ziehbar (Nutzerwunsch).
// Format: { fi: Funktionsindex der aufgeschalteten Funktion,
//           xA: number (ziehbar), xB: number (ziehbar entlang der Kurve) }
// h = xB - xA (Δx); m = (f(xB)-f(xA))/h ist der Differenzenquotient — zieht
// man xA und xB näher zusammen, nähert sich m dem Differentialquotienten
// f'(xA) an. Siehe diffQuotSetup() (06_ui_functions.js), drawDiffQuot()
// (08_draw.js) und drag.type==='diffquotpt' (09_events.js).
let diffQuot = null;

// riemann: Ober-/Untersummen-Applet ("Einstieg in den Integralbegriff",
// eigener Menüpunkt). Genau EINE Instanz, analog zu diffQuot oben. Die
// Funktion ist FREI wählbar (Eingabefeld #riemann-fn-input, Fallback x²),
// die Intervallgrenzen a (xA) und b (xB) sind ziehbar — aber auf der x-Achse
// (y=0), nicht auf der Kurve wie bei diffQuot, da sie hier ein Intervall
// markieren statt einen Kurvenpunkt.
// Format: { fi1: Funktionsindex, xA: number (ziehbar, Intervallgrenze a),
//           xB: number (ziehbar, Intervallgrenze b), n: number (Anzahl
//           Teilintervalle), antiderivRaw: string|null (symbolische
//           Stammfunktion von f als Rohausdruck, EINMALIG in riemannSetup()
//           berechnet) }
// IMMER Funktion vs. x-Achse (kein Zwei-Funktionen-Modus mehr — das ist jetzt
// der eigenständige Menüpunkt "Flächen", siehe flaeche unten; auf
// ausdrücklichen Nutzerwunsch wieder getrennt). Ober-/Untersumme werden über
// eine dichte Stichprobe pro Teilintervall numerisch angenähert (echtes
// Supremum/Infimum) und als Rechtecke dargestellt. Je grösser n, desto näher
// rücken beide Summen an das exakte Integral heran.
// Die Sidebar (#riemann-dw) zeigt den exakten Integralwert bevorzugt als
// geschlossenen symbolischen Ausdruck (antiderivRaw, ausgewertet an den
// aktuellen Grenzen — siehe _riemannSymbolicIntegral(), 08_draw.js), mit
// Fallback auf die numerische Simpson-Näherung (computeSignedIntegral(),
// 04_analysis.js), falls keine elementare Stammfunktion gefunden wurde.
// Siehe riemannSetup() (06_ui_functions.js).
let riemann = null;

// flaeche: "Flächen"-Applet (eigener Menüpunkt, September 2026 wieder von den
// Ober-/Untersummen getrennt — Nutzerwunsch). Genau EINE Instanz. Funktion f
// FREI wählbar (#flaeche-fn-input), plus GENAU EINE der drei Randarten:
//   axis === 'x': Fläche zwischen f und der x-Achse (g(x)=0).
//   axis === 'y': Fläche zwischen f und der y-Achse.
//   axis === 'g': Fläche zwischen f und einer zweiten Funktion g
//                 (#flaeche-fn2-input, fi2 gesetzt).
// Format: { fi1, fi2: Funktionsindex der 2. Funktion ODER null (nur bei
//           axis==='g' gesetzt), axis: 'x'|'y'|'g', a: number, b: number
//           (ziehbare Grenzen — bei axis 'x'/'g' auf der x-Achse, bei axis
//           'y' AUF DER Y-ACHSE, siehe unten), antiderivRaw: string|null }
// axis 'x' und 'g' laufen technisch über denselben Code (g wird bei axis='x'
// einfach als der Ausdruck "0" behandelt) — Schnittpunkte von f und g (bzw.
// f und der x-Achse) bestimmen dabei das Startintervall und das Snap-
// Verhalten beim Ziehen (_riemannPickIsectInterval()/_riemannSnapX(),
// 06_ui_functions.js, wiederverwendet aus dem alten Zwei-Funktionen-Modus),
// damit im Intervall (a,b) kein Vorzeichenwechsel von f−g auftritt. a/b sind
// dabei x-Werte.
// axis 'y' ist konzeptionell anders: a und b sind y-WERTE (Grenzen AUF der
// y-Achse, Standard-Schulkonzept "Fläche zwischen Kurve, y-Achse, y=a, y=b"
// — x wird dabei als Funktion von y betrachtet). Da x(y) im Allgemeinen
// nicht symbolisch vorliegt, wird die Fläche hier rein NUMERISCH über
// wiederholte Nullstellensuche (dieselbe Bisektion wie
// _riemannFindIntersections(), aber gegen die Konstante y statt gegen g)
// plus Trapezregel angenähert — kein symbolischer Ausdruck in diesem Modus.
// WICHTIG: x(y) wird dabei kontinuierlich (auf den Vorgänger verankert)
// verfolgt statt bei jedem y-Wert neu global gesucht (_flaecheYInvertNear(),
// 06_ui_functions.js) — sowohl aus Performance-Gründen als auch, weil bei
// NICHT injektiven Funktionen wie x² sonst zwischen den beiden Ästen (±√y)
// hin- und hergesprungen würde. drawFlaeche() (08_draw.js) berechnet die
// Fläche direkt über dieselben Stützpunkte, die auch gezeichnet werden.
// Kein Schnittpunkt-Snapping (es gibt keine "zweite Kurve", an der man
// snappen könnte) — a/b sind bei axis 'y' also immer frei ziehbar/eingebbar.
// In JEDEM Modus können a/b zusätzlich direkt in Zahlenfeldern eingegeben
// werden (#flaeche-a-input/#flaeche-b-input) — das übernimmt den Wert IMMER
// frei, ohne Snapping (siehe flaecheSetBound(), 06_ui_functions.js).
// Siehe flaecheSetup() (06_ui_functions.js), drawFlaeche() (08_draw.js) und
// drag.type==='flaechept' (09_events.js).
let flaeche = null;

// line2ptPicking: true wenn "Im Plot klicken"-Modus aktiv ist
// line2ptPts: zwischengespeicherte Punkt-Indizes während dem Picking [{idx}]
let line2ptPicking = false, line2ptPts = [];

// view: der aktuell sichtbare Ausschnitt in Mathe-Koordinaten.
// Wird von zoom/pan/resize verändert.
// Anpassen für anderen Startausschnitt: view = {xmin:-5, xmax:5, ymin:-3, ymax:3};
let view = { xmin:-10, xmax:10, ymin:-6, ymax:6 };

// drag: aktuell laufende Drag-Aktion.
// null = kein Drag aktiv.
// {type:'view', startM:{x,y}, startView:{...}}   → Canvas verschieben
// {type:'point', idx:i}                           → Punkt i aus points[] ziehen
// {type:'graphpt', idx:i}                         → Graph-Punkt i ziehen
// {type:'circlept', idx:i}                        → Einheitskreis-Punkt i drehen
let drag = null;

// hoverPt: x-Koordinate der aktuellen Mausposition (für Hover-Linie und Funktionswerte)
// null = Maus nicht über Canvas
let hoverPt = null;

// altDown: true wenn Alt-Taste gedrückt (Alt+Klick setzt Punkt)
let altDown = false;

// pointMode: true wenn "Punkt setzen"-Button aktiv (Klick setzt Punkt ohne Alt)
// graphPtMode: true wenn "Auf Graph"-Button aktiv
// deleteMode: true wenn "Löschen"-Button aktiv (Klick löscht Objekt)
let pointMode = false, graphPtMode = false, deleteMode = false;

// pointerMode: true wenn Laserpointer aktiv (Maus/Stift/Touch zeigt großen Leuchtpunkt)
// pointerPos: aktuelle Pointer-Position in Canvas-Pixeln {x, y} oder null
let pointerMode = false, pointerPos = null;

// precision: Anzahl Nachkommastellen für Koordinaten-Anzeige
// Geändert durch setPrecision() via Dropdown
let precision = 1;

// lastW/lastH: Canvas-Grösse vom letzten Frame.
// Wird für Resize-Erkennung gebraucht (Punkt 12: mehr sehen, nicht strecken).
let lastW = null, lastH = null;

// ═══════════════════════════════════════════════════════════════════
// RAF-SCHEDULING (Performance)
// ═══════════════════════════════════════════════════════════════════

// Verhindert mehrfaches Zeichnen pro Frame. Statt draw() direkt aufzurufen,
// immer scheduleDraw() verwenden — dann wird draw() genau 1x pro Animationsframe
// ausgeführt, egal wie oft scheduleDraw() aufgerufen wird.
let drawPending = false;
function scheduleDraw() {
  if (drawPending) return;
  drawPending = true;
  requestAnimationFrame(() => {
    drawPending = false;
    if (typeof updateFuncLabelsOverlay === 'function') updateFuncLabelsOverlay();
    draw();
  });
}

// Canvas-Element und 2D-Zeichenkontext
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// ═══════════════════════════════════════════════════════════════════
// ISOMETRISCHE KOORDINATEN (gleiche Achsenskalierung)
// ═══════════════════════════════════════════════════════════════════

// Isometrischer Modus ist immer aktiv (quadratisches Grid).
function isometricMode() { return true; }

// Berechnet einen erweiterten View so dass px/Einheit in x und y gleich sind.
// Dazu wird der Canvas in der Richtung mit weniger Platz ausgeweitet.
// Beispiel: Canvas 800×400, view x[-10,10], y[-6,6]:
//   ppu_x = 800/20 = 40px/Einheit
//   ppu_y = 400/12 = 33px/Einheit  ← kleinerer Massstab
//   → x-Range wird auf 800/33 ≈ 24 Einheiten ausgeweitet
// Der Rückgabewert ist ein neues View-Objekt, view wird NICHT verändert.
function getIsoView(w, h) {
  if (!isometricMode()) return view;
  const ppu = Math.min(w / (view.xmax - view.xmin), h / (view.ymax - view.ymin));
  const xC = (view.xmin + view.xmax) / 2, yC = (view.ymin + view.ymax) / 2;
  return { xmin: xC - w/ppu/2, xmax: xC + w/ppu/2, ymin: yC - h/ppu/2, ymax: yC + h/ppu/2 };
}

// Wird zu Beginn von draw() berechnet und von toCanvas/fromCanvas verwendet.
// IMMER den isoView verwenden, nie direkt view!
let isoView = null;

// Richtet den Canvas für High-DPI-Displays ein und erkennt Grössenänderungen.
// Bei Grössenänderung wird der View proportional ausgeweitet (mehr sehen, nicht strecken).
// ─────────────── Zoom-Grenzen (Schutz vor Einfrieren/Rechenfehlern) ───────────────
// Fliesskommazahlen haben nur ~15-16 Stellen. Zoomt man weit hinein, während man weit von
// der y-Achse entfernt ist (z.B. x ≈ -8 oder x ≈ -1e6), wird der Gitterabstand kleiner als der
// Abstand zweier benachbarter Zahlen: "gx += Schritt" ändert gx dann nicht mehr, und jede
// Gitter-/Beschriftungs-Schleife läuft endlos (= Programm friert ein). Darum wird der
// Ausschnitt in JEDEM Frame (setupCanvas) auf einen sicheren Bereich begrenzt:
//   • Spanne mindestens VIEW_MIN_REL × |Mitte| (≈ 1e-11 relativ, ~4500 Zahlenschritte pro Gitterlinie)
//     bzw. absolut VIEW_MIN_ABS (nahe 0 darf man sehr tief hinein),
//   • Spanne höchstens VIEW_MAX_SPAN (darüber wird alles zu Pixelbrei und Zahlen laufen über).
// Da die Ansicht isometrisch ist (gleicher Massstab in x und y), wird der Massstab (Pixel pro
// Einheit) begrenzt und beide Spannen werden gemeinsam um die Mitte skaliert.
const VIEW_MIN_REL = 1e-11, VIEW_MIN_ABS = 1e-200, VIEW_MAX_SPAN = 1e13;
function limitView(w, h) {
  const v = view;
  let xs = v.xmax - v.xmin, ys = v.ymax - v.ymin;
  if (!isFinite(v.xmin) || !isFinite(v.xmax) || !isFinite(v.ymin) || !isFinite(v.ymax) || !(xs > 0) || !(ys > 0)) {
    v.xmin = -10; v.xmax = 10; v.ymin = -6; v.ymax = 6;   // kaputter Ausschnitt (NaN/∞/umgedreht) → Startansicht
    return true;
  }
  const xC = (v.xmin + v.xmax) / 2, yC = (v.ymin + v.ymax) / 2;
  const minX = Math.max(Math.abs(xC) * VIEW_MIN_REL, VIEW_MIN_ABS);
  const minY = Math.max(Math.abs(yC) * VIEW_MIN_REL, VIEW_MIN_ABS);
  const ppu = Math.min(w / xs, h / ys);
  const ppuMax = Math.min(w / minX, h / minY);
  const ppuMin = Math.max(w, h) / VIEW_MAX_SPAN;
  let s = 1;
  if (ppu > ppuMax) s = ppu / ppuMax;         // zu weit hineingezoomt → aufweiten
  else if (ppu < ppuMin) s = ppu / ppuMin;    // zu weit hinaus → zusammenziehen
  if (s === 1 || !isFinite(s)) return false;
  xs *= s; ys *= s;
  v.xmin = xC - xs / 2; v.xmax = xC + xs / 2;
  v.ymin = yC - ys / 2; v.ymax = yC + ys / 2;
  return true;
}

function setupCanvas() {
  const dpr = window.devicePixelRatio || 1; // Pixeldichte (z.B. 2 für Retina)
  const wrap = document.getElementById('canvas-wrap');
  const w = wrap.clientWidth || 600, h = wrap.clientHeight || 500;

  // Grössenänderung erkannt: View proportional skalieren
  if (lastW !== null && (w !== lastW || h !== lastH)) {
    const xC = (view.xmin + view.xmax) / 2, yC = (view.ymin + view.ymax) / 2;
    const xR = (view.xmax - view.xmin) * (w / lastW); // neue x-Range proportional zu neuer Breite
    const yR = (view.ymax - view.ymin) * (h / lastH); // neue y-Range proportional zu neuer Höhe
    view.xmin = xC - xR/2; view.xmax = xC + xR/2;
    view.ymin = yC - yR/2; view.ymax = yC + yR/2;
    syncInputs(); // Eingabefelder aktualisieren
  }
  lastW = w; lastH = h;

  // Canvas-Pixelgrösse an DPR anpassen (für scharfe Darstellung auf Retina)
  const tw = Math.round(w * dpr), th = Math.round(h * dpr);
  if (canvas.width !== tw || canvas.height !== th) { canvas.width = tw; canvas.height = th; }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Skalierungsmatrix

  if (limitView(w, h)) { try { syncInputs(); } catch (e) {} }   // Zoom-Grenzen (siehe oben)
  isoView = getIsoView(w, h); // isometrischen View für diesen Frame berechnen
  return { w, h };
}

// CSS-Grösse des Canvas-Containers (ohne DPR-Faktor)
// Gemessene Grösse wird zwischengespeichert (clientWidth erzwingt jedes Mal ein Layout — toCanvas()
// läuft tausende Male pro Zeichnen/Berechnung). Ein ResizeObserver hält den Wert aktuell.
let _wrapW = 0, _wrapH = 0, _wrapRO = null;
function _measureWrap() {
  const el = document.getElementById('canvas-wrap');
  _wrapW = el ? el.clientWidth : 0; _wrapH = el ? el.clientHeight : 0;
  if (!_wrapRO && el && typeof ResizeObserver !== 'undefined') {
    _wrapRO = new ResizeObserver(() => { _wrapW = 0; _wrapH = 0; if (typeof scheduleDraw === 'function') scheduleDraw(); });
    _wrapRO.observe(el);
  }
}
function getW() { if (!_wrapW) _measureWrap(); return _wrapW || 600; }
function getH() { if (!_wrapH) _measureWrap(); return _wrapH || 500; }

// Zuletzt benutztes Eingabegerät: true nach einer Touch-Berührung, false nach Mausbewegung/-klick.
// Steuert die Grösse der Trefferflächen (hitR) und die Lage des Live-Tooltips (09_events.js).
let inputIsTouch = false;
// Trefferradius in Pixeln: Maus = base, Finger = base + 12 (ein Fingertipp ist viel ungenauer als ein Mauszeiger).
function hitR(base) { return inputIsTouch ? base + 12 : base; }

// Mausposition relativ zum Canvas-Element (in CSS-Pixeln)
function mousePos(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

// Mathe-Koordinaten → Canvas-Pixel
// Verwendet isoView (isometrisch erweitert) für korrekte Darstellung.
function toCanvas(x, y) {
  const w = getW(), h = getH(), v = isoView || view;
  return {
    cx: ((x - v.xmin) / (v.xmax - v.xmin)) * w,      // linear von xmin→0 bis xmax→w
    cy: h - ((y - v.ymin) / (v.ymax - v.ymin)) * h    // y ist invertiert (Canvas-y wächst nach unten)
  };
}

// Canvas-Pixel → Mathe-Koordinaten (Umkehrfunktion von toCanvas)
function fromCanvas(cx, cy) {
  const w = getW(), h = getH(), v = isoView || view;
  return {
    x: v.xmin + (cx / w) * (v.xmax - v.xmin),
    y: v.ymin + ((h - cy) / h) * (v.ymax - v.ymin)
  };
}

// ───────────────── Gitter-Snapping (zentral, Einstellung "Gitter-Snapping" = #chk-gridsnap) ─────────────────
// Ein einziger Schalter steuert ALLES Einrasten. Regeln:
//   • freie Punkte (setzen/ziehen, Fit-Punkte, Punkte der 2-Punkte-Gerade): rasten immer auf den nächsten
//     GITTERPUNKT ein (snapToGrid(), 05_points.js),
//   • Punkte, die an einen Graphen/eine Achse gebunden sind (Graph-Punkte, Steigungsdreieck, Differenzenquotient-
//     Punkt A, Grenzen a/b der Ober-/Untersummen und Flächen): rasten auf die nächste GITTERLINIE ein, sobald sie
//     höchstens 20 Pixel daneben liegen (man kann sich also wieder davon lösen).
// WICHTIG: Der Schritt ist exakt der des GEZEICHNETEN Gitters (draw(): kleinere Seite des isometrischen Ausschnitts) —
// früher rechnete ein Teil der Ereignisse mit der Breite statt der kleineren Seite und rastete dadurch auf
// Linien ein, die gar nicht gezeichnet waren.
function gridSnapOn() { const c = document.getElementById('chk-gridsnap'); return !!(c && c.checked); }
function gridSnapStep() {
  const v = isoView || view;
  return gridStep(Math.min(v.xmax - v.xmin, v.ymax - v.ymin));
}
const GRID_SNAP_PX = 20;
function snapGridLineX(x) {
  if (!gridSnapOn() || !isFinite(x)) return x;
  const v = isoView || view, xs = gridSnapStep();
  const pxPerUnit = getW() / (v.xmax - v.xmin);
  if (!(xs > 0) || !(pxPerUnit > 0)) return x;
  const s = Math.round(x / xs) * xs;
  return Math.abs(x - s) < GRID_SNAP_PX / pxPerUnit ? parseFloat(s.toPrecision(12)) : x;
}
function snapGridLineY(y) {
  if (!gridSnapOn() || !isFinite(y)) return y;
  const v = isoView || view, ys = gridSnapStep();
  const pxPerUnit = getH() / (v.ymax - v.ymin);
  if (!(ys > 0) || !(pxPerUnit > 0)) return y;
  const s = Math.round(y / ys) * ys;
  return Math.abs(y - s) < GRID_SNAP_PX / pxPerUnit ? parseFloat(s.toPrecision(12)) : y;
}

// Berechnet einen schönen Gitternetz-Abstand für einen gegebenen Bereich.
// Ziel: ca. so viele Gitterlinien sichtbar wie in "Gitternetz-Feinheit" eingestellt
// (Default: 10, fein). Ergebnis ist immer 1, 2 oder 5 × 10^n.
// range: z.B. view.xmax - view.xmin = 20 → gridStep = 2 oder 5
function gridStep(range) {
  const density = parseInt(document.getElementById('grid-density')?.value || 10);
  const raw = range / (density > 0 ? density : 10);
  if (!(raw > 0) || !isFinite(raw)) return 1;   // Schutz: kaputter Bereich → harmloser Standardabstand
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const r = raw / mag;
  if (r < 1.5) return mag;
  if (r < 3.5) return 2 * mag;
  if (r < 7.5) return 5 * mag;
  return 10 * mag;
}



// ── Überschrift über dem Bild: Hinweis zur aktuellen Ansicht eines Themas ──
// Text mit {{Wort|id1,id2}}: Fährt man über das Wort, werden die ziehbaren Punkte mit diesen ids im Bild (S.pts) hervorgehoben.
// Jedes Thema meldet seinen Hinweis mit envHint(thema, text, () => szene); angezeigt wird der des aktiven Themas.
const ENVH = { by: {}, get: null, ids: null, raf: 0, rings: [], t: 0 };
function envHintCur() { return typeof ENV !== 'undefined' ? ENV.cur : document.body.getAttribute('data-env'); }
function envHint(env, text, getS) { ENVH.by[env] = { text: text || '', get: getS || null }; if (env === envHintCur()) envHintShow(); }
function envHintShow() {
  const el = document.getElementById('env-hint'); if (!el) return;
  const h = ENVH.by[envHintCur()], text = h ? h.text : '';
  ENVH.get = h ? h.get : null;
  if (!text) { el.style.display = 'none'; el.dataset.t = ''; envHintOff(); return; }
  el.style.display = '';
  if (el.dataset.t === text) return;
  el.dataset.t = text; envHintOff(); el.replaceChildren();
  const re = /\{\{(.+?)\|([^|{}]*)\}\}/g; let i = 0, m;   // das Wort darf selbst | enthalten, z.B. (x | f(x))
  while ((m = re.exec(text))) {
    if (m.index > i) el.append(text.slice(i, m.index));
    const s = document.createElement('span'); s.className = 'eh-l'; s.textContent = m[1]; s.dataset.ids = m[2]; el.append(s); i = re.lastIndex;
  }
  if (i < text.length) el.append(text.slice(i));
  // Knopf «Zurücksetzen» (32_env.js envReset) rechts oben in der Überschrift
  if (typeof ENV_RESET !== 'undefined' && ENV_RESET[envHintCur()]) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'eh-reset'; b.textContent = '⟲ Zurücksetzen';
    b.title = 'Alles in dieser Ansicht in den Anfangszustand zurücksetzen (Rückgängig ist möglich)';
    b.addEventListener('click', () => { if (typeof envReset === 'function') envReset(); });
    el.prepend(b);
  }
}
function envHintOn(ids) { ENVH.ids = ids; ENVH.lastS = null; cancelAnimationFrame(ENVH.raf); const tick = () => { if (!ENVH.ids) return; envHintPlace(); ENVH.raf = requestAnimationFrame(tick); }; tick(); }
function envHintOff() { ENVH.ids = null; ENVH.lastS = null; cancelAnimationFrame(ENVH.raf); if (ENVH.svg) { ENVH.svg.remove(); ENVH.svg = null; } }
// Hervorhebung als SVG über dem Bild: Punkte (S.pts) als Ring, Linien/Kurven (S.hl.pts) als leuchtender Strich, Kästen und Kreise (S.hl.box/c)
function envHintPlace() {
  const wrap = document.getElementById('canvas-wrap'), cv = document.getElementById('canvas'); if (!wrap || !cv) return;
  let S = null; try { S = ENVH.get && ENVH.get(); } catch (e) { S = null; }
  const wr = wrap.getBoundingClientRect(), cr = cv.getBoundingClientRect(), ox = cr.left - wr.left, oy = cr.top - wr.top;
  const key = ox + ',' + oy + ',' + cr.width + ',' + cr.height;
  if (S === ENVH.lastS && key === ENVH.key && ENVH.svg) return;           // Bild unverändert
  ENVH.lastS = S; ENVH.key = key;
  const ids = ENVH.ids || [], has = id => ids.includes(id), NS = 'http://www.w3.org/2000/svg';
  if (!ENVH.svg) { ENVH.svg = document.createElementNS(NS, 'svg'); ENVH.svg.setAttribute('class', 'eh-svg'); wrap.appendChild(ENVH.svg); }
  const g = ENVH.svg; g.replaceChildren(); g.style.left = ox + 'px'; g.style.top = oy + 'px'; g.setAttribute('width', cr.width); g.setAttribute('height', cr.height);
  const add = (tag, at) => { const e = document.createElementNS(NS, tag); Object.keys(at).forEach(k => e.setAttribute(k, at[k])); g.appendChild(e); return e; };
  const f1 = v => Math.round(v * 10) / 10;
  ((S && S.hl) || []).filter(h => has(h.id)).forEach(h => {
    if (h.pts) { const d = 'M' + h.pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + (h.close ? 'Z' : ''); add('path', { d, class: 'eh-glow' }); add('path', { d, class: 'eh-core' }); }
    else if (h.box) add('rect', { x: h.box[0], y: h.box[1], width: h.box[2] - h.box[0], height: h.box[3] - h.box[1], rx: 6, class: 'eh-box' });
    else if (h.c) add('circle', { cx: h.c[0], cy: h.c[1], r: h.c[2], class: 'eh-ring' });
  });
  ((S && S.pts) || []).filter(p => has(p.id)).forEach(p => add('circle', { cx: p.x, cy: p.y, r: 15, class: 'eh-ring' }));
}
(function () {
  const el = document.getElementById('env-hint'); if (!el) return;
  const lnk = e => (e.target && e.target.closest ? e.target.closest('.eh-l') : null);
  el.addEventListener('mouseover', e => { const s = lnk(e); if (s) envHintOn(s.dataset.ids.split(',')); });
  el.addEventListener('mouseout', e => { const s = lnk(e); if (s && !s.contains(e.relatedTarget)) envHintOff(); });
  el.addEventListener('click', e => { const s = lnk(e); if (!s) return; envHintOn(s.dataset.ids.split(',')); clearTimeout(ENVH.t); ENVH.t = setTimeout(envHintOff, 1800); });   // Berührung
})();
