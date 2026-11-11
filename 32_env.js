// ═══════════════════════════════════════════════════════════════════
// 32_env.js — Umgebungen (Themenwahl)
//
// Jedes Thema hat seine eigene Umgebung: eigene Daten, eigene Panels in der
// linken Leiste, eigener Rückgängig-Verlauf, eigene Ansicht und eigene Begriffe.
// Gewählt wird in der Toolbar (Knopf «#env-btn» mit Ausklappliste).
//
//   func  Funktionen (alle Funktionsarten, Balken, Folgen der Funktionswerte)
//   lin   Lineare Funktionen (Steigung & Achsenabschnitt, Gerade aufstellen, Schnitt zweier Geraden, Anwendungen, Nullstelle/Senkrechte/Mittelsenkrechte)
//   quad  Quadratische Funktionen (drei Formen, Scheitelpunkt & quadratische Ergänzung, Nullstellen & Diskriminante, Parabel & Gerade / Parabel aus Punkten)
//   pow   Potenz- und Wurzelfunktionen (x^n, negative Exponenten, Wurzeln und Umkehrung, allgemeine Form, Gleichungen)
//   exp   Exponential- und Logarithmusfunktionen (Wachstum und Zerfall, e, Logarithmus, Gleichungen und Anwendungen)
//   diff  Differentialrechnung (Sekante → Tangente, Graphisches Ableiten, Ableiten mit Regeln, Kurvendiskussion)
//   int   Integralrechnung (Ober-/Untersumme → Integral, Integralfunktion & Hauptsatz, Stammfunktion & Regeln, Flächen zwischen Kurven, Rotationskörper)
//   lo    Lineare Optimierung (Ungleichungen, Halbebene, Planungspolygon, Zielfunktion)
//   geo   Geometrie (2D)
//   sim   Ähnlichkeit (Ähnlichkeitsabbildungen, ähnliche Dreiecke, Strahlensätze, rechtwinkliges Dreieck mit Höhe)
//   seq   Folgen und Reihen (explizit/rekursiv, arithmetisch, geometrisch, Reihen, Grenzwert, Induktion)
//   alg   Algebra (Binomische Formeln, Faktorisieren, Potenzen, Wurzeln, Logarithmen, Bruchterme, Gleichungen)
//   3d    3D-Raum
//   stat  Wahrscheinlichkeit und Statistik (Zufallsexperimente)
//   fin   Finanzmathematik (Zeitstrahl, Summenzeichen, Sparplan, Kredit, Marchzins, konformer Zins)
//
// Funktionsweise: Die bestehenden Module arbeiten weiter mit ihren globalen Daten
// (functions, points, riemann, geoObjs …). Beim Wechsel wird der Zustand der
// verlassenen Umgebung gesichert (captureState() + Ansicht + Verlauf) und der
// Zustand der neuen Umgebung geladen (applyState()) bzw. ein leerer aufgebaut.
// Die Zuordnung der Panels steht im HTML (Attribut data-envs="func diff …"),
// die Sichtbarkeit regelt das CSS (body[data-env="…"]).
//
// Einhängepunkte in anderen Dateien (alle optional-verkettet):
//   09_events.js  captureState() → envCaptureExt() + env,  applyState() → envApplyExt()/envEnsure()
//   12_begriffe.js  Ordner tragen envs:[…]; renderBegriffe() zeigt nur die der Umgebung
//   30_3d_ui.js   td3dSet() wird von hier aufgerufen
// Neue Umgebung: Eintrag in ENV_LIST, Panels mit data-envs versehen, CSS-Regel in
// index.html ergänzen, Begriffe-Ordner mit envs versehen.
// ═══════════════════════════════════════════════════════════════════

const ENV_LIST = [
  { id: 'intro', icon: '📖', title: 'Funktionen: Einführung', desc: 'Einstieg in den Funktionsbegriff: Zuordnung und Wertetabelle, aus Punkten wird der Graph, Definitions- und Wertebereich, Nullstellen, Monotonie, Anwendungen mit Einheiten', open: ['intro-panel'] },
  { id: 'func', icon: 'ƒ', title: 'Funktionen: Werkzeug', desc: 'Beliebige Funktionen zeichnen und untersuchen: Nullstellen, Extrema, Ableitung, Stammfunktion, Parameter mit Schiebern, Balken über den Stellen, Punkte setzen', open: ['func-panel'] },
  { id: 'lin', icon: '📏', title: 'Lineare Funktionen', desc: 'Steigung und y-Achsenabschnitt, Gerade aufstellen, Schnitt zweier Geraden, Tarife und Bewegung, Nullstelle, Senkrechte und Mittelsenkrechte', open: ['lin-panel'] },
  { id: 'quad', icon: '🌉', title: 'Quadratische Funktionen', desc: 'Parameter und drei Formen, Scheitelpunkt und quadratische Ergänzung, Nullstellen und Diskriminante, Parabel und Gerade, Parabel aus Punkten, Optimierung (Preis, Umsatz, Gewinn)', open: ['quad-panel'] },
  { id: 'pow', icon: '🔢', title: 'Potenz- und Wurzelfunktionen', desc: 'Potenzfunktionen x^n, negative Exponenten, Wurzelfunktionen als Umkehrung, allgemeine Form a(x−v)^n + h, Potenz- und Wurzelgleichungen', open: ['pow-panel'] },
  { id: 'exp', icon: '📈', title: 'Exponential- und Logarithmusfunktionen', desc: 'Wachstum und Zerfall a·b^x, die Zahl e, Logarithmus als Umkehrung, Exponentialgleichungen und Anwendungen (Zinseszins, Zerfall, Abkühlung), Prozentrechnung mit Faktoren', open: ['exp-panel'] },
  { id: 'trig', icon: '∿', title: 'Trigonometrische Funktionen', desc: 'Einheitskreis mit Sinus und Kosinus, Bogenmass, allgemeine Sinusfunktion a·sin(b(x−c))+d mit Amplitude, Periode und Verschiebung, Tangens mit Polstellen und Beziehungen, rechtwinkliges Dreieck (sin, cos, tan), Sinus- und Kosinussatz, Vermessung', open: ['trig-panel'] },
  { id: 'inv', icon: '↔', title: 'Umkehrfunktionen', desc: 'Begriff der Umkehrfunktion (Spiegelung an y = x), Umkehrbarkeit und Einschränkung des Definitionsbereichs, Umkehrfunktion berechnen, bekannte Paare (x² und √x, 2^x und log₂ x, sin und arcsin …)', open: ['inv-panel'] },
  { id: 'diff', icon: '🧮', title: 'Differentialrechnung', desc: 'Grenzwerte von Funktionen, Differenzenquotient, Sekante und Tangente, Graphisches Ableiten, Ableitungsregeln, Kurvendiskussion, Extremwertprobleme, Polynom aus Bedingungen', open: ['dif-panel'] },
  { id: 'int', icon: '📶', title: 'Integralrechnung', desc: 'Ober- und Untersummen, Integralfunktion und Hauptsatz, Stammfunktion mit Regeln, partielle Integration und Substitution als Bild, Flächen zwischen Kurven, Rotationskörper', open: ['itg-panel'] },
  { id: 'lo', icon: '📐', title: 'Lineare Optimierung', desc: 'Ungleichungen mit einer und zwei Variablen, Ungleichungssysteme und Planungspolygon, Zielfunktion, Niveaulinie und Optimum, Textaufgaben', open: ['lo-panel'] },
  { id: 'geo', icon: '🔺', title: 'Geometrie (2D)', desc: 'Konstruktionen mit Punkten, Geraden, Kreisen und Dreiecken', open: ['geo-panel'] },
  { id: 'sim', icon: '△', title: 'Ähnlichkeit', desc: 'Ähnlichkeitsabbildungen (Spiegeln, Drehen, Strecken, Verschieben), ähnliche Dreiecke, Seitenverhältnisse, Strahlensätze, rechtwinkliges Dreieck mit Höhe', open: ['sim-panel'] },
  { id: 'seq', icon: '∑', title: 'Folgen und Reihen', desc: 'Folgen explizit und rekursiv, arithmetische und geometrische Folgen, Reihen und Summenzeichen, Grenzwert, unendliche geometrische Reihe, vollständige Induktion', open: ['seq-panel'] },
  { id: 'set', icon: '∪', title: 'Mengen und Intervalle', desc: 'Intervalle auf der Zahlengeraden in drei Schreibweisen (Intervall, Ungleichung, Mengenschreibweise), Schnittmenge, Vereinigung, Differenz und Komplement', open: ['set-panel'] },
  { id: 'alg', icon: '🧩', title: 'Algebra', desc: 'Binomische Formeln, Ausmultiplizieren, Faktorisieren, quadratische Ergänzung, Potenzen, Wurzeln, Logarithmen, Bruchterme, Gleichungen und Gleichungssysteme als Bild', open: ['alg-panel'] },
  { id: '3d', icon: '🧊', title: '3D-Raum', desc: 'Ebenen in Koordinatenform, Schnitte, Balken; Vektorgeometrie: Punkte und Vektoren, Geraden (Lage, Schnittpunkt), Skalarprodukt und Winkel, Abstände, Kugel', open: ['td-panel'] },
  { id: 'stat', icon: '🎲', title: 'Wahrscheinlichkeit & Statistik', desc: 'Zufallsexperimente zum Mitverfolgen: Würfel, Galtonbrett, π, Ziegenproblem, Grenzwertsatz, Konfidenzintervalle', open: ['stat-panel'] },
  { id: 'prob', icon: '📊', title: 'Statistik und Stochastik rechnen', desc: 'Datenanalyse (Mittelwert, Median, Quartile, Standardabweichung, Boxplot, Histogramm), Baumdiagramm und Pfadregeln, Binomialverteilung, Poissonverteilung, Erwartungswert und faire Spiele, Normalverteilung, Grenzwerte (Binomial → Poisson, Normal) mit Herleitung, Hypothesentest', open: ['prob-panel'] },
  { id: 'fin', icon: '💰', title: 'Finanzmathematik', desc: 'Zeitstrahl und Konten, Summenzeichen, Sparplan, Kredit mit Tilgungsplan, Zeitwert, Marchzins, konformer Zins', open: ['fin-panel'] }
];
const ENV_DEFAULT_VIEW = { xmin: -10, xmax: 10, ymin: -6, ymax: 6 };

// ── Reine Hilfen (ohne DOM, node-testbar) ────────────────────────────
function envById(id) { return ENV_LIST.find(e => e.id === id) || null; }
// Zu welcher Umgebung gehört ein gespeicherter Zustand ohne Angabe? (ältere Dateien)
function envGuess(sc) {
  if (!sc || typeof sc !== 'object') return 'func';
  if (sc.env && envById(sc.env)) return sc.env;
  const has = a => Array.isArray(a) && a.length > 0;
  const fnCount = Array.isArray(sc.functions) ? sc.functions.filter(f => f && f.expr && String(f.expr).trim()).length : 0;
  if (sc.td3d && has(sc.td3d.planes) && !fnCount) return '3d';
  if (sc.geo && has(sc.geo.objs) && !fnCount) return 'geo';
  if (has(sc.loConstraints) && !fnCount) return 'lo';
  if (sc.ext && has(sc.ext.sequences) && !fnCount) return 'seq';
  return 'func';
}
if (typeof module !== 'undefined' && module.exports) module.exports = { ENV_LIST, envById, envGuess };

if (typeof document !== 'undefined') {

const ENV = { cur: 'func', ws: {}, busy: false };
const $env = id => document.getElementById(id);
const envCopy = o => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));

// ── Zusatzdaten, die nicht in captureState() stehen ──────────────────
function envCaptureExt() {
  return envCopy({
    diffQuot: typeof diffQuot !== 'undefined' ? diffQuot : null,
    riemann: typeof riemann !== 'undefined' ? riemann : null,
    flaeche: typeof flaeche !== 'undefined' ? flaeche : null,
    sequences: typeof sequences !== 'undefined' ? sequences : [],
    activeSpecials: typeof activeSpecials !== 'undefined' ? [...activeSpecials] : [],
    slopeTriPtsMap: typeof slopeTriPtsMap !== 'undefined' ? slopeTriPtsMap : {},
    perpMeta: typeof perpMeta !== 'undefined' ? perpMeta : {},
    lin: typeof linActiveFi !== 'undefined' ? [linActiveFi, linPerpFi, linBisectorFi] : [-1, -1, -1],
    uc: !!($env('chk-unitcircle') && $env('chk-unitcircle').checked),
    st: !!($env('chk-slopetri') && $env('chk-slopetri').checked)
  });
}
function envApplyExt(ext) {
  const e = ext && typeof ext === 'object' ? envCopy(ext) : {};
  diffQuot = e.diffQuot || null;
  riemann = e.riemann || null;
  flaeche = e.flaeche || null;
  sequences = Array.isArray(e.sequences) ? e.sequences : [];
  activeSpecials = new Set(Array.isArray(e.activeSpecials) ? e.activeSpecials : []);
  slopeTriPtsMap = e.slopeTriPtsMap || {};
  slopeTriPts = []; slopeTriFi = -1;
  perpMeta = e.perpMeta || {};
  const l = Array.isArray(e.lin) ? e.lin : [-1, -1, -1];
  linActiveFi = l[0]; linPerpFi = l[1]; linBisectorFi = l[2];
  const uc = $env('chk-unitcircle'); if (uc) uc.checked = !!e.uc;
  const st = $env('chk-slopetri'); if (st) st.checked = !!e.st;
  // Oberfläche der Anwendungen angleichen
  if (riemann) {
    const sl = $env('riemann-n-slider'); if (sl) sl.value = String(riemann.n || 10);
    const sv = $env('riemann-n-val'); if (sv) sv.textContent = String(riemann.n || 10);
  }
  if (typeof renderSeqList === 'function') renderSeqList();
  if (typeof updateSmartButtons === 'function') updateSmartButtons();
  if (typeof renderSpecialList === 'function') renderSpecialList();
}

// Leerer Zustand einer Umgebung (wie beim ersten Start: eine leere Funktionszeile)
function envBlankState(id) {
  return { env: id, functions: [{ expr: '', color: (typeof COLORS !== 'undefined' ? COLORS[0] : '#378ADD'), visible: true }], params: {}, points: [], linkedLines: [], graphPoints: [], unitCirclePts: [], ext: {} };
}

// Beim Laden einer Datei / eines gespeicherten Zustands in die richtige Umgebung wechseln
function envEnsure(id) {
  if (!envById(id) || id === ENV.cur || ENV.busy) return;
  envSwitch(id);
}

// ── Laufende Bedienmodi beenden ──────────────────────────────────────
function envStopModes() {
  try { if (typeof pointerMode !== 'undefined' && pointerMode && typeof togglePointerMode === 'function') togglePointerMode(); } catch (e) {}
  for (let n = 0; n < 6; n++) {
    try {
      const gi = typeof guideInfo === 'function' ? guideInfo() : null;
      if (!gi || !gi.btns || !gi.btns.length) break;
      gi.btns[gi.btns.length - 1][1]();
    } catch (e) { break; }
  }
  try { if (typeof _endTouchAll === 'function' && typeof touchState !== 'undefined' && touchState) _endTouchAll(); } catch (e) {}
  try { drag = null; } catch (e) {}
  try { if (typeof geoTool !== 'undefined' && geoTool !== 'move' && typeof geoSetTool === 'function') geoSetTool('move'); } catch (e) {}
}

// ── Wechsel ──────────────────────────────────────────────────────────
function envSwitch(id) {
  if (!envById(id) || id === ENV.cur || ENV.busy) return false;
  ENV.busy = true;
  try {
    envStopModes();
    try { if (typeof hideSolveTooltip === 'function') hideSolveTooltip(); } catch (e) { /* ohne Oberfläche */ }   // Lösungsweg-Karte gehört zum alten Thema
    clearTimeout(_histDebounce);
    const sb = $env('sidebar');
    // 1. Zustand der verlassenen Umgebung sichern
    ENV.ws[ENV.cur] = { state: captureState(), view: Object.assign({}, view), stack: undoStack, idx: historyIdx, scroll: sb ? sb.scrollTop : 0 };
    // 2. neue Umgebung laden (oder leer beginnen)
    const first = !ENV.ws[id];
    const w = ENV.ws[id];
    ENV.cur = id;
    document.body.setAttribute('data-env', id);
    applyState(w ? w.state : envBlankState(id));
    if (typeof envHintShow === 'function') envHintShow();             // Überschrift des neuen Themas
    if (typeof td3dSet === 'function') td3dSet(id === '3d');
    view = w ? Object.assign({}, w.view) : Object.assign({}, ENV_DEFAULT_VIEW);
    if (typeof syncInputs === 'function') syncInputs();
    if (w) { undoStack = w.stack; historyIdx = w.idx; }
    else { undoStack = [envCopy(captureState())]; historyIdx = 0; }
    if (typeof updateUndoRedoBtns === 'function') updateUndoRedoBtns();
    // 3. Oberfläche
    if (first) {
      const e = envById(id);
      (e.open || []).forEach(pid => { const p = $env(pid); if (p) p.classList.remove('collapsed'); });
    }
    if (sb) sb.scrollTop = w ? (w.scroll || 0) : 0;
    envUpdateButton(); envMenuMark();
    if (typeof renderBegriffe === 'function') { const q = $env('begriffe-search'); renderBegriffe(q ? q.value : ''); }
    // Hinweisleiste: Meldung des alten Themas verwerfen, Applet-Zustände neu als Ausgangslage nehmen (kein Hinweis beim blossen Wechsel)
    try { guideTemp = null; clearTimeout(guideTempTimer); guideAppletInit = false; } catch (e) {}
    if (typeof guideSync === 'function') { try { guideKey = null; guideSync(); } catch (e) {} }
    if (typeof scheduleComputeSpecials === 'function') scheduleComputeSpecials();
    if (typeof scheduleDraw === 'function') scheduleDraw();
  } finally { ENV.busy = false; }
  return true;
}

// ── Knopf und Ausklappliste ──────────────────────────────────────────
function envUpdateButton() {
  const b = $env('env-btn'); if (!b) return;
  const e = envById(ENV.cur);
  b.textContent = '';
  b.append(document.createTextNode(e.icon + ' '), Object.assign(document.createElement('span'), { className: 'env-btn-t', textContent: e.title }),
    Object.assign(document.createElement('span'), { className: 'env-caret', textContent: '▾' }));
  b.setAttribute('aria-expanded', $env('env-menu') && $env('env-menu').style.display === 'block' ? 'true' : 'false');
}
function envBuildMenu() {
  const m = $env('env-menu'); if (!m || m.childNodes.length) return;
  ENV_LIST.forEach(e => {
    const it = document.createElement('button');
    it.type = 'button'; it.className = 'env-item'; it.setAttribute('data-env', e.id); it.setAttribute('role', 'menuitemradio');
    const ic = document.createElement('span'); ic.className = 'env-ic'; ic.textContent = e.icon;
    const tx = document.createElement('span'); tx.className = 'env-txt';
    const t = document.createElement('b'); t.textContent = e.title;
    const d = document.createElement('small'); d.textContent = e.desc;
    tx.append(t, d);
    it.append(ic, tx);
    it.addEventListener('click', () => { envCloseMenu(); envSwitch(e.id); if (window.innerWidth <= 700 && typeof openSidebar === 'function') { /* Leiste bleibt wie sie ist */ } });
    m.appendChild(it);
  });
  envMenuMark();
}
function envMenuMark() {
  const m = $env('env-menu'); if (!m) return;
  m.querySelectorAll('.env-item').forEach(it => it.setAttribute('aria-checked', it.getAttribute('data-env') === ENV.cur ? 'true' : 'false'));
}
function envToggleMenu() {
  const m = $env('env-menu'), b = $env('env-btn'); if (!m || !b) return;
  if (m.style.display === 'block') { envCloseMenu(); return; }
  envBuildMenu();
  m.style.display = 'block';
  if (typeof placeMenuUnder === 'function') placeMenuUnder(m, b);
  b.setAttribute('aria-expanded', 'true');
  setTimeout(() => document.addEventListener('click', envOutside), 0);
}
function envCloseMenu() {
  const m = $env('env-menu'); if (m) m.style.display = 'none';
  const b = $env('env-btn'); if (b) b.setAttribute('aria-expanded', 'false');
  document.removeEventListener('click', envOutside);
}
function envOutside(e) {
  const m = $env('env-menu'), b = $env('env-btn');
  if (m && !m.contains(e.target) && !(b && b.contains(e.target))) envCloseMenu();
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') envCloseMenu(); });

document.body.setAttribute('data-env', ENV.cur);
envUpdateButton();
if (typeof envHintShow === 'function') envHintShow();
// Erster Verlaufseintrag nochmals mit Umgebung und Zusatzdaten aufnehmen (sonst entsteht beim ersten Bearbeiten ein Scheineintrag)
if (typeof undoStack !== 'undefined' && undoStack.length <= 1 && typeof captureState === 'function') { undoStack = [envCopy(captureState())]; historyIdx = 0; if (typeof updateUndoRedoBtns === 'function') updateUndoRedoBtns(); }

window.ENV = ENV; window.ENV_LIST = ENV_LIST;
window.envSwitch = envSwitch; window.envEnsure = envEnsure; window.envToggleMenu = envToggleMenu;
window.envCaptureExt = envCaptureExt; window.envApplyExt = envApplyExt; window.envGuess = envGuess;
window.envCurrent = () => ENV.cur;

}

// ── Zurücksetzen: Knopf in der Überschrift (#env-hint, 02_core.js) setzt die aktuelle Umgebung in den Anfangszustand
//    zurück; die gewählte Ansicht bleibt. Rückgängig ist möglich (Verlauf). Eintrag: [Präfix der Funktionen, Ansichts-Schlüssel]
const ENV_RESET = { intro: ['fun', 'view'], lin: ['lin', 'view'], quad: ['quad', 'view'], pow: ['pow', 'view'], exp: ['exp', 'view'], trig: ['trig', 'view'], inv: ['inv', 'view'],
  diff: ['dif', 'view'], int: ['itg', 'view'], seq: ['seq', 'view'], lo: ['lop', 'view'], sim: ['sim', 'view'], set: ['set', 'view'], prob: ['prob', 'view'],
  stat: ['stat', 'mode'], fin: ['fin', 'mode'], alg: ['alg', 'mode'], '3d': ['td', 'view'] };
function envReset() {
  const e = typeof ENV !== 'undefined' ? ENV.cur : null, r = ENV_RESET[e]; if (!r) return;
  const cap = window[r[0] + 'Capture'], app = window[r[0] + 'Apply']; if (typeof app !== 'function') return;
  const keep = {}; try { const c = typeof cap === 'function' ? cap() : null; if (c && r[1] in c) keep[r[1]] = c[r[1]]; } catch (err) { /* ohne Ansicht */ }
  if (e === 'stat' && typeof statStopRun === 'function') statStopRun();
  try { app(keep); } catch (err) { console.warn('Zurücksetzen', err); }
  if (typeof scheduleDraw === 'function') scheduleDraw();
  if (typeof pushHistory === 'function') pushHistory();
}
