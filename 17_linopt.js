// ═══════════════════════════════════════════════════════════════════
// MODUL: linopt — Lineare Optimierung (Unterrichts-Feature)
// Ein Ungleichungssystem (z.B. "2x+3y<=12") wird grafisch dargestellt,
// das Planungspolygon (zulässiger Bereich, automatisch nur 1. Quadrant:
// x≥0, y≥0) wird hervorgehoben. Eine Zielfunktion z=a·x+b·y lässt sich
// aufschalten und im Plot parallel verschieben (Gerade a·x+b·y=k) — sie
// snappt dabei leicht an die Eckpunkte des Planungspolygons. "Lösungsweg"
// wertet z an allen Eckpunkten aus und zeigt das Maximum/Minimum.
// Enthält:  loConstraints[], loObjA/B/K, loMode
//           evalXY() — safeEval()-Pendant für ZWEI Variablen (x UND y),
//             da safeEval() in 03_math.js nur eine Variable (x) kennt.
//           parseLoConstraint(), loClip(), computeFeasiblePolygon()
//           loAddConstraint()/loRemoveConstraint()/renderLoConstraints()
//           loSetObjective(), loSetMode(), loShowSolution()
//           drawLinOpt() — aufgerufen aus draw() in 08_draw.js
//           findNearLoHandle()/loUpdateFromDrag() — für 09_events.js
//           loParseFieldLatex()/loRawWithOpToLatex() — math-field-Ein-/Ausgabe
//             für Ungleichungen (Operator ≤/≥/= wird VOR asciiMathToRaw()/
//             rawToLatex() aus 14_mathinput.js abgetrennt, siehe Kommentar dort)
//           loSetupObjectiveField() — math-field-Einrichtung für "z = ..."
//           loObjKRange()/loSetupObjSlider()/loSyncObjSlider*() — Schieberegler
//             für z, im selben Stil/Verkabelung wie syncParams() (03_math.js)
// Ändern:  Farbe des Planungspolygons → LO_FILL/LO_STROKE unten
//           Snap-Toleranz (Zielgerade an Eckpunkte) → SNAP_PX in loUpdateFromDrag()
//           Grösse der "unendlich"-Box → LO_BOX_MIN in computeFeasiblePolygon()
// ═══════════════════════════════════════════════════════════════════

// loConstraints[]: {raw: "2x+3y<=12", visible: true, color: string}
let loConstraints = [];

// Zielfunktion z = loObjA·x + loObjB·y. Aktuell gezeichnete Gerade bei
// Wert loObjK (a·x+b·y = k). loObjActive: ob eine Zielfunktion aufgeschaltet
// und damit sichtbar/ziehbar ist.
let loObjA = 1, loObjB = 1, loObjK = 0, loObjActive = false;

// Grenzen des z-Schiebereglers (#lo-obj-slider) — werden beim Aufschalten
// der Zielfunktion aus dem aktuellen Sichtbereich hergeleitet (loObjKRange())
// und lassen sich über die Min/Max-Felder neben dem Schieber manuell anpassen.
let loObjKMin = -10, loObjKMax = 10;

// 'max' oder 'min' — wonach beim "Lösungsweg" gesucht wird.
let loMode = 'max';

const LO_FILL = 'rgba(55,138,221,0.16)';
const LO_STROKE = '#378ADD';
const LO_OBJ_COLOR = '#D4537E';
const LO_BOX_MIN = 1000; // math. Einheiten — weit über jeden sinnvollen Zoom hinaus

// ═══════════════════════════════════════════════════════════════════
// AUSWERTUNG LINEARER AUSDRÜCKE IN X UND Y
// ═══════════════════════════════════════════════════════════════════
// safeEval() (03_math.js) kennt nur eine Variable (x) — für Ungleichungen
// wie "2x+3y<=12" braucht es zwei. evalXY() ist das Pendant zu getEvalFn()/
// safeEval(), kompiliert aber eine Funktion(x,y) statt Funktion(x).
const loEvalXYCache = new Map();
function getLoEvalFn(expr) {
  if (loEvalXYCache.has(expr)) return loEvalXYCache.get(expr);
  let fn = null;
  try {
    let e = insertImplicitMult(expr);
    e = e.replace(/\^/g, '**').replace(/\bEC\b/g, '__EULER__');
    e = e.replace(/(^|[\(\+\-\*\/,\s])-([a-zA-Z_][a-zA-Z0-9_]*)\s*\*\*/g, '$10-$2**');
    e = fixNegParenPow(e);
    e = e.replace(/(^|[\(\+\-\*\/,\s])-(\d+\.?\d*)\s*\*\*/g, '$10-$2**');
    fn = new Function('x', 'y', 'sin', 'cos', 'tan', 'sqrt', 'abs', 'log', 'exp', 'pi', '__EULER__',
      `"use strict"; return (${e});`);
  } catch (ex) { fn = null; }
  loEvalXYCache.set(expr, fn);
  return fn;
}
function evalXY(expr, xVal, yVal) {
  if (!expr || !expr.trim()) return NaN;
  const fn = getLoEvalFn(expr);
  if (!fn) return NaN;
  try { return fn(xVal, yVal, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.log, Math.exp, PI, Math.E); }
  catch (ex) { return NaN; }
}
function clearLoEvalCache() { loEvalXYCache.clear(); }

// Zerlegt z.B. "2x+3y<=12" in {a, b, c, op} mit Bedeutung a·x+b·y {op} c.
// Methode: linke minus rechte Seite an drei Punkten auswerten — (0,0),
// (1,0), (0,1) liefern direkt a, b und den (negierten) Achsenabschnitt c.
// Ein vierter Kontrollpunkt (2,3) prüft, ob der Ausdruck WIRKLICH linear
// ist (sonst kämen aus den drei Punkten trotzdem irgendwelche a,b,c heraus,
// die aber an anderen Stellen nicht mehr stimmen würden).
// Gibt null zurück bei Syntaxfehler, fehlendem Operator oder Nichtlinearität.
function parseLoConstraint(raw) {
  if (!raw || !raw.trim()) return null;
  let s = raw.trim().replace(/\s+/g, '').replace(/≤/g, '<=').replace(/≥/g, '>=');
  const opMatch = s.match(/<=|>=|=|<|>/);
  if (!opMatch) return null;
  const op = opMatch[0];
  const idx = s.indexOf(op);
  const left = s.slice(0, idx), right = s.slice(idx + op.length);
  if (!left || !right) return null;

  const f = (x, y) => {
    const l = evalXY(left, x, y), r = evalXY(right, x, y);
    if (!isFinite(l) || !isFinite(r)) return NaN;
    return l - r;
  };
  const f00 = f(0, 0), f10 = f(1, 0), f01 = f(0, 1), f23 = f(2, 3);
  if (![f00, f10, f01, f23].every(isFinite)) return null;
  const a = f10 - f00, b = f01 - f00, c = -f00;
  const expected = a * 2 + b * 3 - c;
  if (Math.abs(expected - f23) > 1e-6) return null; // nicht linear
  if (Math.abs(a) < 1e-12 && Math.abs(b) < 1e-12) return null; // weder x noch y enthalten
  return { a, b, c, op };
}

// ═══════════════════════════════════════════════════════════════════
// MATHLIVE-EINGABE FÜR UNGLEICHUNGEN (Vergleichsoperator ≤/≥/=)
// ═══════════════════════════════════════════════════════════════════
// Der gemeinsame Ausdrucks-Parser (14_mathinput.js, asciiMathToRaw()/
// rawToLatex()) kennt bewusst NUR einzelne algebraische Ausdrücke, keine
// Vergleichsoperatoren — er wird auch von "F Funktionen" genutzt und soll
// dafür nicht verändert werden. Für die Ungleichungs-Zeilen hier wird der
// Operator daher VOR der Konvertierung abgetrennt; jede Seite läuft für
// sich durch die bestehenden, unveränderten Funktionen.

// Rohausdruck ("2x+3y<=12") → {left, right, op}. Nutzt dieselbe
// Operator-Suche wie parseLoConstraint() (erstes Vorkommen von <=,>=,=,<,>).
function loSplitRawAtOp(raw) {
  const s = (raw || '').trim();
  const m = s.match(/<=|>=|=|<|>/);
  if (!m) return null;
  const op = m[0], idx = s.indexOf(op);
  return { left: s.slice(0, idx), right: s.slice(idx + op.length), op };
}
const LO_OP_TO_LATEX = { '<=': '\\le ', '>=': '\\ge ', '=': '=', '<': '<', '>': '>' };

// Rohausdruck MIT Operator → LaTeX (zur Anzeige im math-field), z.B.
// "2x+3y<=12" → "2x+3y\le 12". Nutzt rawToLatex() unverändert für beide Seiten.
function loRawWithOpToLatex(raw) {
  const parts = loSplitRawAtOp(raw);
  if (!parts) return '';
  let l = '', r = '';
  try { l = parts.left.trim() ? rawToLatex(parts.left) : ''; } catch (ex) { l = ''; }
  try { r = parts.right.trim() ? rawToLatex(parts.right) : ''; } catch (ex) { r = ''; }
  return l + (LO_OP_TO_LATEX[parts.op] || parts.op) + r;
}

// Unsichtbares Hilfs-math-field (nie fokussierbar, nie sichtbar) — dient nur
// dazu, MathLive selbst einen LaTeX-Bruchstück (eine Seite der Ungleichung)
// nach ASCIIMath konvertieren zu lassen, damit wir NICHT von Hand nachbilden
// müssen, wie MathLive z.B. Brüche/Wurzeln als ASCIIMath ausgibt.
let _loScratchMF = null;
function loScratchField() {
  if (!_loScratchMF) {
    _loScratchMF = document.createElement('math-field');
    _loScratchMF.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    _loScratchMF.setAttribute('tabindex', '-1');
    _loScratchMF.mathVirtualKeyboardPolicy = 'manual';
    document.body.appendChild(_loScratchMF);
  }
  return _loScratchMF;
}
// LaTeX-Bruchstück (eine Seite der Ungleichung, OHNE Operator) → Rohausdruck.
function loLatexFragmentToRaw(latexFrag) {
  const s = (latexFrag || '').trim();
  if (!s) return '';
  try {
    const mf = loScratchField();
    mf.value = s;
    const ascii = mf.getValue('ascii-math');
    return asciiMathToRaw(ascii);
  } catch (ex) { return ''; }
}

// Findet den Vergleichsoperator im LaTeX-Wert eines math-field auf oberster
// Klammerungsebene (Tiefe 0 bzgl. {}), damit z.B. \frac{...}{...} nicht
// versehentlich als Fund gilt. Reihenfolge wichtig: längere Befehle (\leqslant,
// \leq) vor ihren Präfixen (\le) prüfen.
const LO_LATEX_OPS = [
  { re: /^\\leqslant/, op: '<=' }, { re: /^\\leq(?![a-zA-Z])/, op: '<=' }, { re: /^\\le(?![a-zA-Z])/, op: '<=' },
  { re: /^\\geqslant/, op: '>=' }, { re: /^\\geq(?![a-zA-Z])/, op: '>=' }, { re: /^\\ge(?![a-zA-Z])/, op: '>=' },
  { re: /^=/, op: '=' }, { re: /^</, op: '<' }, { re: /^>/, op: '>' },
];
function loSplitLatexAtOp(latex) {
  const s = latex || '';
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '{') { depth++; continue; }
    if (c === '}') { depth--; continue; }
    if (depth !== 0) continue;
    const rest = s.slice(i);
    for (const o of LO_LATEX_OPS) {
      const m = rest.match(o.re);
      if (m) return { leftLatex: s.slice(0, i), rightLatex: s.slice(i + m[0].length), op: o.op };
    }
  }
  return null;
}

// math-field-LaTeX-Wert (mit Operator) → Rohausdruck-String "links<=rechts"
// im selben Format, das parseLoConstraint()/loConstraints[].raw erwarten.
// Gibt null zurück solange kein Operator getippt wurde oder eine Seite
// (noch) nicht auswertbar ist (unvollständiger Zwischenzustand beim Tippen).
function loParseFieldLatex(latex) {
  const parts = loSplitLatexAtOp(latex);
  if (!parts) return null;
  const leftRaw = loLatexFragmentToRaw(parts.leftLatex);
  const rightRaw = loLatexFragmentToRaw(parts.rightLatex);
  if (!leftRaw || !rightRaw) return null;
  return leftRaw + parts.op + rightRaw;
}

// ═══════════════════════════════════════════════════════════════════
// PLANUNGSPOLYGON: Halbebenen-Schnitt (Sutherland-Hodgman-Clipping)
// ═══════════════════════════════════════════════════════════════════

// Schneidet ein konvexes Polygon mit der Halbebene a·x+b·y {op} c.
// op ∈ {'<=','<','>=','>'} — '=' wird vom Aufrufer als zwei Clips
// ('<=' UND '>=') behandelt (kollabiert das Polygon auf die Gerade).
function loClip(poly, a, b, c, op) {
  if (poly.length === 0) return poly;
  const inside = p => {
    const v = a * p.x + b * p.y;
    if (op === '<=' || op === '<') return v <= c + 1e-9;
    if (op === '>=' || op === '>') return v >= c - 1e-9;
    return true;
  };
  const intersect = (p1, p2) => {
    const d1 = a * p1.x + b * p1.y - c, d2 = a * p2.x + b * p2.y - c;
    const denom = d1 - d2;
    if (Math.abs(denom) < 1e-12) return p2;
    const t = d1 / denom;
    return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
  };
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i], prev = poly[(i - 1 + poly.length) % poly.length];
    const curIn = inside(cur), prevIn = inside(prev);
    if (curIn) { if (!prevIn) out.push(intersect(prev, cur)); out.push(cur); }
    else if (prevIn) out.push(intersect(prev, cur));
  }
  return out;
}

// Berechnet das Planungspolygon: Schnitt aller sichtbaren Ungleichungen
// UND x≥0, y≥0 (automatisch 1. Quadrant). Start ist ein sehr grosses
// Rechteck ("Unendlich"-Ersatz) — weit ausserhalb des sinnvollen Zoom-
// bereichs, damit auch unbeschränkte Bereiche korrekt (als riesiges
// Polygon) erkannt werden, siehe loShowSolution()/loUpdateFromDrag().
// Gibt {poly:[{x,y},...], box} zurück — box ist die halbe Kantenlänge
// des Start-Rechtecks (zur "liegt am Rand = unbeschränkt"-Erkennung).
function computeFeasiblePolygon() {
  const v = isoView || view;
  const box = Math.max(LO_BOX_MIN, (v.xmax - v.xmin) * 20, (v.ymax - v.ymin) * 20);
  let poly = [{ x: -box, y: -box }, { x: box, y: -box }, { x: box, y: box }, { x: -box, y: box }];
  poly = loClip(poly, 1, 0, 0, '>='); // x ≥ 0
  poly = loClip(poly, 0, 1, 0, '>='); // y ≥ 0
  loConstraints.forEach(con => {
    if (!con.visible) return;
    const p = parseLoConstraint(con.raw);
    if (!p) return;
    if (p.op === '=') { poly = loClip(poly, p.a, p.b, p.c, '<='); poly = loClip(poly, p.a, p.b, p.c, '>='); }
    else poly = loClip(poly, p.a, p.b, p.c, p.op);
  });
  return { poly, box };
}

// ═══════════════════════════════════════════════════════════════════
// UI: Ungleichungen hinzufügen/entfernen/rendern
// ═══════════════════════════════════════════════════════════════════

function loAddConstraint(initialRaw) {
  loConstraints.push({ raw: initialRaw || '', visible: true, color: COLORS[loConstraints.length % COLORS.length] });
  renderLoConstraints();
  pushHistory();
  scheduleDraw();
}
function loRemoveConstraint(i) {
  loConstraints.splice(i, 1);
  renderLoConstraints();
  pushHistory();
  scheduleDraw();
}
function loUpdateConstraint(i, raw) {
  if (!loConstraints[i]) return;
  loConstraints[i].raw = raw;
  scheduleDraw();
}

function renderLoConstraints() {
  const el = document.getElementById('lo-constraints'); if (!el) return;
  el.innerHTML = '';
  loConstraints.forEach((con, i) => {
    const row = document.createElement('div');
    row.className = 'func-row';

    const dot = document.createElement('div'); dot.className = 'dot';
    dot.style.background = con.color || COLORS[i % COLORS.length];
    dot.style.opacity = con.visible === false ? '0.3' : '1';
    dot.style.cursor = 'pointer'; dot.title = t('title_color');
    dot.onclick = () => { con.visible = con.visible === false ? true : false; renderLoConstraints(); pushHistory(); scheduleDraw(); };

    // MathLive-Eingabefeld — gleicher Schreibstil wie bei "F Funktionen"
    // (renderFuncList() in 06_ui_functions.js), inkl. Vergleichsoperator
    // (≤/≥/=), siehe loParseFieldLatex()/loRawWithOpToLatex() oben.
    const inp = document.createElement('math-field');
    inp.className = 'func-inp-ce';
    inp.style.cssText = 'font-size:13px;padding:2px 8px;border:1px solid var(--border-input);border-radius:6px;background:var(--bg-input);color:var(--text);flex:1;min-width:0;align-self:stretch;box-sizing:border-box;';
    inp.mathVirtualKeyboardPolicy = 'manual';
    if (inp.shadowRoot) {
      const selFix = document.createElement('style');
      selFix.textContent = '.ML__selection{background:var(--_selection-background-color, rgba(55,138,221,0.25)) !important;}';
      inp.shadowRoot.appendChild(selFix);
    }
    inp.setAttribute('data-raw', con.raw || '');
    if (!con.raw || !con.raw.trim()) inp.setAttribute('placeholder', t('eg_lo_constraint'));

    function mlSetFromRawOp(raw) {
      let latex = '';
      try { latex = (raw && raw.trim()) ? loRawWithOpToLatex(raw) : ''; } catch (ex) { latex = ''; }
      inp.setAttribute('data-raw', raw || '');
      inp.value = latex;
    }
    mlSetFromRawOp(con.raw);
    inp._mlSetFromRaw = mlSetFromRawOp;

    inp.addEventListener('focusin', () => {
      inp.style.borderColor = '#378ADD';
      setActiveInput(inp, -1);
    });
    inp.addEventListener('focusout', () => {
      inp.style.borderColor = (con.raw && !parseLoConstraint(con.raw)) ? '#e24b4a' : '';
      pushHistory();
    });

    // Inline-Validierung: rote Umrandung bei nicht-leerem, aber nicht
    // parsbarem/nichtlinearem Ausdruck (z.B. noch kein Operator getippt).
    // Leeres Feld ist explizit KEIN Fehlerzustand (wie beim alten <input>).
    inp.addEventListener('input', () => {
      const latex = inp.getValue('latex');
      if (!latex || !latex.trim()) {
        inp.setAttribute('data-raw', '');
        loUpdateConstraint(i, '');
        inp.style.borderColor = '';
        return;
      }
      const raw = loParseFieldLatex(latex);
      if (raw === null) {
        // Unvollständiger Zwischenzustand (z.B. Operator noch nicht getippt,
        // oder eine Seite noch nicht auswertbar) — bisherigen Rohausdruck
        // unverändert lassen statt Polygon/Gerade kaputtzumachen.
        return;
      }
      inp.setAttribute('data-raw', raw);
      loUpdateConstraint(i, raw);
      inp.style.borderColor = parseLoConstraint(raw) ? '' : '#e24b4a';
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
    if (con.raw && !parseLoConstraint(con.raw)) inp.style.borderColor = '#e24b4a';

    const del = document.createElement('button');
    del.className = 'del-btn'; del.textContent = '✕'; del.title = t('title_del_pt');
    del.onclick = () => loRemoveConstraint(i);

    row.append(dot, inp, del);
    el.appendChild(row);
  });
}

// ═══════════════════════════════════════════════════════════════════
// ZIELFUNKTION
// ═══════════════════════════════════════════════════════════════════

// Prüft/parst den Zielfunktions-Ausdruck (gleiche Linearitäts-Methode wie
// parseLoConstraint(), aber ohne Vergleichsoperator — "z=" davor wird
// toleriert und abgeschnitten, falls mitgetippt).
function loParseObjective(raw) {
  const cleaned = raw.trim().replace(/^z\s*=\s*/i, '');
  if (!cleaned) return null;
  const f = (x, y) => evalXY(cleaned, x, y);
  const f00 = f(0, 0), f10 = f(1, 0), f01 = f(0, 1), f23 = f(2, 3);
  if (![f00, f10, f01, f23].every(isFinite)) return null;
  const a = f10 - f00, b = f01 - f00;
  const expected = a * 2 + b * 3;
  if (Math.abs(expected - f23) > 1e-6) return null; // nicht linear
  if (Math.abs(a) < 1e-12 && Math.abs(b) < 1e-12) return null;
  return { a, b };
}

// Richtet das Zielfunktions-Eingabefeld (#lo-obj-input, math-field) einmalig
// ein — analog zum Aufbau eines Funktionsfelds in renderFuncList()
// (06_ui_functions.js), aber ohne Vergleichsoperator (nur "z = ..."-Ausdruck,
// das "z =" davor steht als eigenes <span> bereits statisch in index.html).
function loSetupObjectiveField() {
  const inp = document.getElementById('lo-obj-input');
  if (!inp || inp._loSetup) return;
  inp._loSetup = true;
  inp.mathVirtualKeyboardPolicy = 'manual';
  if (inp.shadowRoot) {
    const selFix = document.createElement('style');
    selFix.textContent = '.ML__selection{background:var(--_selection-background-color, rgba(55,138,221,0.25)) !important;}';
    inp.shadowRoot.appendChild(selFix);
  }
  function mlSetFromRaw(raw) {
    let latex = '';
    try { latex = (raw && raw.trim()) ? rawToLatex(raw) : ''; } catch (ex) { latex = ''; }
    inp.setAttribute('data-raw', raw || '');
    inp.value = latex;
  }
  inp._mlSetFromRaw = mlSetFromRaw;
  inp.addEventListener('focusin', () => { inp.style.borderColor = '#378ADD'; setActiveInput(inp, -1); });
  inp.addEventListener('focusout', () => { inp.style.borderColor = ''; });
  inp.addEventListener('input', () => {
    let raw;
    try { raw = asciiMathToRaw(inp.getValue('ascii-math')); }
    catch (ex) { return; } // unvollständiger Zwischenzustand — bisherigen Rohausdruck behalten
    inp.setAttribute('data-raw', raw);
    inp.style.borderColor = '';
  });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
}

function loSetObjective() {
  const inp = document.getElementById('lo-obj-input'); if (!inp) return;
  const raw = inp.getAttribute('data-raw') || '';
  const parsed = loParseObjective(raw);
  if (!parsed) { inp.style.borderColor = '#e24b4a'; return; }
  inp.style.borderColor = '';
  loObjA = parsed.a; loObjB = parsed.b;
  if (!loObjActive) {
    // Startposition: Gerade durch die Mitte des aktuellen Sichtbereichs
    const v = isoView || view;
    loObjK = loObjA * (v.xmin + v.xmax) / 2 + loObjB * (v.ymin + v.ymax) / 2;
  }
  loObjActive = true;
  document.getElementById('chk-lo-polygon') && (document.getElementById('chk-lo-polygon').checked = true);
  loSyncObjSliderFull();
  pushHistory();
  scheduleDraw();
}

function loSetMode(mode) {
  loMode = mode;
  document.getElementById('lo-mode-max')?.classList.toggle('active-btn', mode === 'max');
  document.getElementById('lo-mode-min')?.classList.toggle('active-btn', mode === 'min');
  pushHistory();
  scheduleDraw();
}

// ═══════════════════════════════════════════════════════════════════
// SCHIEBEREGLER FÜR z (loObjK) — #lo-obj-slider-row in index.html
// ═══════════════════════════════════════════════════════════════════
// Gleicher Aufbau UND gleiche Verkabelung wie die normalen Parameter-
// Schieber (syncParams() in 03_math.js): Name|Min|Schieber|Max in Zeile 1,
// Direktwert-Eingabe (FESTE Breite über .param-val-inp) + Schrittweiten-
// Auswahl in Zeile 2. Wichtig: die Direktwert-Anzeige ist dadurch ein
// Textfeld mit fixer Breite statt einer variabel breiten reinen Anzeige —
// sonst würde sich die Breite des Schiebers selbst beim Ziehen laufend
// mitverändern (genau das war der ursprüngliche Kritikpunkt).

// Leitet eine sinnvolle Start-Spannweite aus den vier Ecken des aktuellen
// Sichtbereichs her (nur beim Aufschalten der Zielfunktion verwendet) —
// skaliert automatisch mit Pan/Zoom, unabhängig davon ob das Planungspolygon
// beschränkt ist. Danach frei über die Min/Max-Felder anpassbar, genau wie
// bei jedem Parameter-Schieber.
function loObjKRange() {
  const v = isoView || view;
  let mn = Infinity, mx = -Infinity;
  [v.xmin, v.xmax].forEach(x => [v.ymin, v.ymax].forEach(y => {
    const k = loObjA * x + loObjB * y;
    if (k < mn) mn = k;
    if (k > mx) mx = k;
  }));
  if (!isFinite(mn) || !isFinite(mx) || mn === mx) { mn = -10; mx = 10; }
  return { min: Math.floor(mn), max: Math.ceil(mx) };
}

// Richtet den z-Schieber einmalig ein (Min/Max-Felder, Schieber, Direktwert-
// Feld, Schrittweiten-Auswahl) — Verkabelung 1:1 wie bei den Parameter-
// Schiebern in syncParams() (03_math.js), inkl. Direktwert-Eingabe, die auch
// "pi"/"e"/"pi/2" etc. akzeptiert (parseParamExpr()).
function loSetupObjSlider() {
  const sl = document.getElementById('lo-obj-slider');
  if (!sl || sl._loSetup) return;
  sl._loSetup = true;
  const mi = document.getElementById('lo-obj-slider-min');
  const ma = document.getElementById('lo-obj-slider-max');
  const vInp = document.getElementById('lo-obj-slider-val');
  const stSel = document.getElementById('lo-obj-slider-step');

  mi.onchange = () => { loObjKMin = parseParamExpr(mi.value) ?? loObjKMin; sl.min = loObjKMin; };
  ma.onchange = () => { loObjKMax = parseParamExpr(ma.value) ?? loObjKMax; sl.max = loObjKMax; };
  sl.oninput = () => {
    loObjK = parseFloat(sl.value);
    vInp.value = loObjK.toFixed(Math.max(precision, 3));
    scheduleDraw();
  };
  vInp.onchange = () => {
    const v = parseParamExpr(vInp.value);
    if (v !== null) {
      if (v > loObjKMax) { loObjKMax = Math.ceil(v); sl.max = loObjKMax; ma.value = loObjKMax; }
      if (v < loObjKMin) { loObjKMin = Math.floor(v); sl.min = loObjKMin; mi.value = loObjKMin; }
      loObjK = v; sl.value = loObjK; vInp.value = loObjK.toFixed(Math.max(precision, 3));
    }
    scheduleDraw();
  };
  stSel.onchange = () => { sl.step = parseFloat(stSel.value) || 0.1; };
}

// Leichtgewichtiger Sync (nur der aktuelle Wert) — beim Ziehen der
// Zielgeraden auf dem Plot, siehe loUpdateFromDrag() unten, sowie nach
// Undo/Redo/Laden. Lässt das Direktwert-Feld in Ruhe während es fokussiert
// ist (sonst würde eigene Eingabe dort mitten im Tippen überschrieben).
function loSyncObjSliderValue() {
  const sl = document.getElementById('lo-obj-slider'); if (!sl) return;
  sl.value = loObjK;
  const vInp = document.getElementById('lo-obj-slider-val');
  if (vInp && document.activeElement !== vInp) vInp.value = loObjK.toFixed(Math.max(precision, 3));
}

// Vollständiger Sync: Sichtbarkeit der Schieber-Zeile + (bei frischem
// Aufschalten) neu hergeleitete Min/Max-Grenzen + aktueller Wert.
function loSyncObjSliderFull() {
  const row = document.getElementById('lo-obj-slider-row'); if (!row) return;
  loSetupObjSlider();
  row.style.display = loObjActive ? '' : 'none';
  if (!loObjActive) return;
  const range = loObjKRange();
  loObjKMin = range.min; loObjKMax = range.max;
  if (loObjK < loObjKMin) loObjKMin = Math.floor(loObjK);
  if (loObjK > loObjKMax) loObjKMax = Math.ceil(loObjK);
  const sl = document.getElementById('lo-obj-slider');
  const mi = document.getElementById('lo-obj-slider-min');
  const ma = document.getElementById('lo-obj-slider-max');
  if (sl) { sl.min = loObjKMin; sl.max = loObjKMax; }
  if (mi) mi.value = loObjKMin;
  if (ma) ma.value = loObjKMax;
  loSyncObjSliderValue();
}

// ═══════════════════════════════════════════════════════════════════
// ZEICHNEN — aufgerufen aus draw() in 08_draw.js
// ═══════════════════════════════════════════════════════════════════

// Zeichnet die Randgerade einer Ungleichung a·x+b·y=c über den gesamten
// sichtbaren Bereich (analog zu drawLoObjectiveLine() unten).
function loDrawBoundaryLine(a, b, c, color) {
  const v = isoView || view;
  let p1, p2;
  if (Math.abs(b) > 1e-9) { p1 = { x: v.xmin, y: (c - a * v.xmin) / b }; p2 = { x: v.xmax, y: (c - a * v.xmax) / b }; }
  else if (Math.abs(a) > 1e-9) { p1 = { x: c / a, y: v.ymin }; p2 = { x: c / a, y: v.ymax }; }
  else return;
  const c1 = toCanvas(p1.x, p1.y), c2 = toCanvas(p2.x, p2.y);
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(c1.cx, c1.cy); ctx.lineTo(c2.cx, c2.cy); ctx.stroke();
  ctx.restore();
}

// Position des ziehbaren Griffs auf der Zielfunktions-Geraden — immer in
// der Mitte des aktuellen Sichtbereichs berechnet (kein separat gespeicherter
// Pixel-Zustand nötig, analog zu drawSlopeTri()/findNearSlopeTriB()).
function loGetHandlePos() {
  const v = isoView || view;
  if (Math.abs(loObjB) > 1e-9) {
    const xC = (v.xmin + v.xmax) / 2;
    return { x: xC, y: (loObjK - loObjA * xC) / loObjB };
  } else if (Math.abs(loObjA) > 1e-9) {
    const yC = (v.ymin + v.ymax) / 2;
    return { x: loObjK / loObjA, y: yC };
  }
  return { x: (v.xmin + v.xmax) / 2, y: (v.ymin + v.ymax) / 2 };
}

function drawLoObjectiveLine() {
  const v = isoView || view;
  let p1, p2;
  if (Math.abs(loObjB) > 1e-9) { p1 = { x: v.xmin, y: (loObjK - loObjA * v.xmin) / loObjB }; p2 = { x: v.xmax, y: (loObjK - loObjA * v.xmax) / loObjB }; }
  else if (Math.abs(loObjA) > 1e-9) { p1 = { x: loObjK / loObjA, y: v.ymin }; p2 = { x: loObjK / loObjA, y: v.ymax }; }
  else return;
  const c1 = toCanvas(p1.x, p1.y), c2 = toCanvas(p2.x, p2.y);

  ctx.save();
  ctx.strokeStyle = LO_OBJ_COLOR; ctx.lineWidth = 2.5; ctx.setLineDash([7, 4]);
  ctx.beginPath(); ctx.moveTo(c1.cx, c1.cy); ctx.lineTo(c2.cx, c2.cy); ctx.stroke();
  ctx.setLineDash([]);

  const h = loGetHandlePos(), hc = toCanvas(h.x, h.y);
  ctx.beginPath(); ctx.arc(hc.cx, hc.cy, 8, 0, 2 * PI); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
  ctx.strokeStyle = LO_OBJ_COLOR; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(hc.cx, hc.cy, 3, 0, 2 * PI); ctx.fillStyle = LO_OBJ_COLOR; ctx.fill();

  ctx.font = 'bold 11px system-ui,sans-serif'; ctx.fillStyle = LO_OBJ_COLOR; ctx.textAlign = 'left';
  ctx.fillText(`z = ${niceNum(loObjK)}`, hc.cx + 12, hc.cy - 8);
  ctx.restore();
}

// Haupt-Zeichenfunktion, aus draw() in 08_draw.js aufgerufen (immer wenn
// mind. eine Ungleichung existiert ODER eine Zielfunktion aktiv ist —
// unabhängig vom "Einheitskreis"-Toggle, das ist ein anderes Feature).
function drawLinOpt() {
  const showPoly = document.getElementById('chk-lo-polygon')?.checked;
  const validConstraints = loConstraints.filter(c => c.visible && parseLoConstraint(c.raw));

  if (showPoly && validConstraints.length > 0) {
    const { poly } = computeFeasiblePolygon();
    if (poly.length >= 3) {
      ctx.save();
      ctx.beginPath();
      poly.forEach((p, i) => { const c = toCanvas(p.x, p.y); if (i === 0) ctx.moveTo(c.cx, c.cy); else ctx.lineTo(c.cx, c.cy); });
      ctx.closePath();
      ctx.fillStyle = LO_FILL; ctx.fill();
      ctx.strokeStyle = LO_STROKE; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();

      // Eckpunkte des Planungspolygons hervorheben + Koordinaten beschriften
      poly.forEach(p => {
        const c = toCanvas(p.x, p.y);
        ctx.save();
        ctx.beginPath(); ctx.arc(c.cx, c.cy, 4.5, 0, 2 * PI);
        ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
        ctx.strokeStyle = LO_STROKE; ctx.lineWidth = 2; ctx.stroke();
        ctx.font = '11px system-ui,sans-serif'; ctx.fillStyle = '#1e40af'; ctx.textAlign = 'left';
        ctx.fillText(niceCoord(p.x, p.y), c.cx + 8, c.cy - 6);
        ctx.restore();
      });
    }
    // Randgeraden der einzelnen Ungleichungen (dünn, je eigene Farbe)
    loConstraints.forEach(con => {
      if (!con.visible) return;
      const p = parseLoConstraint(con.raw);
      if (p) loDrawBoundaryLine(p.a, p.b, p.c, con.color || LO_STROKE);
    });
  }

  if (loObjActive) drawLoObjectiveLine();
}

// ═══════════════════════════════════════════════════════════════════
// ZIEHEN DER ZIELFUNKTIONS-GERADEN (Hit-Test + Update) — für 09_events.js
// ═══════════════════════════════════════════════════════════════════

function findNearLoHandle(mx, my) {
  if (!loObjActive) return false;
  const h = loGetHandlePos(), c = toCanvas(h.x, h.y);
  const HIT = ('ontouchstart' in window) ? 22 : 14;
  return Math.hypot(c.cx - mx, c.cy - my) < HIT;
}

// Verschiebt die Zielfunktions-Gerade parallel auf die neue Mausposition
// und snappt dabei leicht an die Eckpunkte des Planungspolygons: liegt der
// (senkrechte, in Pixel gemessene) Abstand der Geraden zu einem Eckpunkt
// unter SNAP_PX, rastet k auf genau diesen Eckpunkt-Wert ein.
function loUpdateFromDrag(mx, my) {
  const pt = fromCanvas(mx, my);
  const kRaw = loObjA * pt.x + loObjB * pt.y;

  const { poly } = computeFeasiblePolygon();
  const v = isoView || view;
  const ppu = getW() / (v.xmax - v.xmin); // Pixel pro Mathe-Einheit (isometrisch)
  const norm = Math.hypot(loObjA, loObjB) || 1;
  const SNAP_PX = 18;
  const snapTol = SNAP_PX * norm / ppu; // Toleranz umgerechnet in "k"-Einheiten

  let bestK = null, bestDiff = snapTol;
  poly.forEach(p => {
    const vk = loObjA * p.x + loObjB * p.y;
    const diff = Math.abs(vk - kRaw);
    if (diff < bestDiff) { bestDiff = diff; bestK = vk; }
  });
  loObjK = bestK !== null ? bestK : kRaw;
  loSyncObjSliderValue();
}

// Baut aus den (bereits geparsten) Zielfunktions-Koeffizienten wieder einen
// Rohausdruck "AxBy" — für applyState() (09_events.js): der State speichert
// nur loObjA/loObjB (nicht den ursprünglich getippten Text), daher muss die
// Anzeige im math-field beim Wiederherstellen (Undo/Redo, Speicherstand-Laden)
// daraus rekonstruiert werden. Vorzeichen von b wird korrekt behandelt (sonst
// entstünde z.B. "3x+-2y", was rawToLatex() nicht als gültigen Ausdruck liest).
function loBuildObjRawFromAB(a, b) {
  const bSign = b < 0 ? '-' : '+';
  return `${niceNumDec(a)}x${bSign}${niceNumDec(Math.abs(b))}y`;
}

// ═══════════════════════════════════════════════════════════════════
// LÖSUNGSWEG: Zielfunktion an allen Eckpunkten auswerten, Max/Min finden
// ═══════════════════════════════════════════════════════════════════

function loShowSolution() {
  const box = document.getElementById('lo-loesungsweg-box'); if (!box) return;
  if (box.style.display === 'block') { box.style.display = ''; return; }

  function lwLine(text, indent, heading) {
    const cls = ['lw-line', indent ? 'lw-indent' : '', heading ? 'lw-heading' : ''].filter(Boolean).join(' ');
    return `<span class="${cls}">${text}</span>`;
  }

  if (!loObjActive) {
    box.innerHTML = `<span style="color:#e24b4a;">${t('lo_no_objective')}</span>`;
    box.style.display = 'block'; return;
  }
  const { poly, box: BOX } = computeFeasiblePolygon();
  if (poly.length < 3) {
    box.innerHTML = `<span style="color:#e24b4a;">${t('lo_infeasible')}</span>`;
    box.style.display = 'block'; return;
  }

  // "Echte" Eckpunkte (nicht nur Artefakte der weit aussenliegenden Box, die
  // computeFeasiblePolygon() als "Unendlich"-Ersatz nutzt) von Box-Artefakten
  // trennen — letztere sollen nicht mit Werten wie "1000" in der Liste
  // auftauchen, sondern nur die "unbeschränkt"-Meldung auslösen.
  const isBoxVertex = p => Math.abs(p.x) > BOX * 0.9 || Math.abs(p.y) > BOX * 0.9;
  const results = poly.map(p => ({ p, z: loObjA * p.x + loObjB * p.y, boxArtifact: isBoxVertex(p) }));
  let best = results[0];
  results.forEach(r => { if (loMode === 'max' ? r.z > best.z : r.z < best.z) best = r; });
  const nearEdge = best.boxArtifact;
  const realResults = results.filter(r => !r.boxArtifact);

  const html = [];
  html.push(lwLine(t('lo_heading_vertices'), false, true));
  (realResults.length ? realResults : results).forEach(r => {
    const isBest = r === best && !nearEdge;
    const style = isBest ? ' style="font-weight:700;color:#1D9E75;"' : '';
    html.push(`<span class="lw-line lw-indent"${style}>${niceCoord(r.p.x, r.p.y)}:  z = ${fracHTML(loObjA)}·${niceNum(r.p.x)} + ${fracHTML(loObjB)}·${niceNum(r.p.y)} = ${fracHTML(r.z)}</span>`);
  });
  if (nearEdge) {
    html.push(lwLine(t('lo_unbounded'), false, true));
  } else {
    html.push(lwLine(tf('lo_heading_result', { mode: loMode === 'max' ? t('lo_max') : t('lo_min'), point: niceCoord(best.p.x, best.p.y), val: fracHTML(best.z) }), false, true));
  }
  box.innerHTML = html.join('');
  box.style.display = 'block';
}
