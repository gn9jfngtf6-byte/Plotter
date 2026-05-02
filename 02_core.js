// ═══════════════════════════════════════════════════════════════════
// MODUL: core — Konstanten, globaler Zustand, Canvas-Setup, Koordinaten
// Enthält:  COLORS, RESERVED, view, functions[], points[]
//           setupCanvas(), toCanvas(), fromCanvas(), gridStep()
//           scheduleDraw(), toggleDarkMode()
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
             get label(){ return darkMode?'#6b7280':'#9ca3af'; },
             get anno(){ return darkMode?'#c4c9d6':'#4b5563'; },
             get bg(){ return darkMode?'#16181d':'#ffffff'; } };

let darkMode = false;
function toggleDarkMode() {
  darkMode = !darkMode;
  document.body.classList.toggle('dark', darkMode);
  document.getElementById('dark-btn').textContent = darkMode ? '☀' : '🌙';
  scheduleDraw();
}

// Reservierte Namen die NICHT als Parameter erkannt werden sollen.
// Neue eingebaute Funktionen hier eintragen wenn man sie in safeEval ergänzt.
const RESERVED = new Set(['x','sin','cos','tan','sqrt','abs','log','exp','pi','EC','nthroot','logn','log10','logbase','e']);

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

// precision: Anzahl Nachkommastellen für Koordinaten-Anzeige
// Geändert durch setPrecision() via Dropdown
let precision = 1;

// showArea: true wenn Flächen-Visualisierung aktiv
let showArea = false;

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
  requestAnimationFrame(() => { drawPending = false; draw(); });
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

  isoView = getIsoView(w, h); // isometrischen View für diesen Frame berechnen
  return { w, h };
}

// CSS-Grösse des Canvas-Containers (ohne DPR-Faktor)
function getW() { return document.getElementById('canvas-wrap').clientWidth || 600; }
function getH() { return document.getElementById('canvas-wrap').clientHeight || 500; }

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

// Berechnet einen schönen Gitternetz-Abstand für einen gegebenen Bereich.
// Ziel: ca. 6 Gitterlinien sichtbar. Ergebnis ist immer 1, 2 oder 5 × 10^n.
// range: z.B. view.xmax - view.xmin = 20 → gridStep = 2 oder 5
function gridStep(range) {
  const density = parseInt(document.getElementById('grid-density')?.value || 6);
  const raw = range / density;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const r = raw / mag;
  if (r < 1.5) return mag;
  if (r < 3.5) return 2 * mag;
  if (r < 7.5) return 5 * mag;
  return 10 * mag;
}

