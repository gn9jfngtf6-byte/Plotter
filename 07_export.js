// ═══════════════════════════════════════════════════════════════════
// MODUL: export — JPEG-Export & LaTeX-Export
// Enthält:  exportJPEG(), generateLatex(), copyLatex()
//           exprToPgf() (LaTeX-Quelltext-Konverter)
//           exprToMathLiveHtml() / latexToMathLiveHtml() (einheitliche Formel-Anzeige, siehe dort)
// Ändern:  JPEG-Qualität → toDataURL("image/jpeg", 0.95)
//           LaTeX-Vorlage → generateLatex()-Funktion
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// JPEG / LATEX EXPORT
// ═══════════════════════════════════════════════════════════════════

// Exportiert den aktuellen Plot als JPEG-Datei.
// Hover-Linie wird temporär ausgeblendet für sauberes Bild.
// Qualität: 0.95 (sehr hoch). Anpassen: toDataURL('image/jpeg', 0.8) für kleinere Datei.
function exportJPEG() {
  const prev = hoverPt; hoverPt = null; draw(); // ohne Hover-Linie zeichnen
  const off = document.createElement('canvas'); off.width = canvas.width; off.height = canvas.height;
  const oc = off.getContext('2d');
  oc.fillStyle = '#fff'; oc.fillRect(0, 0, off.width, off.height); // weisser Hintergrund (JPEG hat kein Alpha)
  oc.drawImage(canvas, 0, 0);
  const a = document.createElement('a');
  a.download = `plot_${Date.now()}.jpg`;
  a.href = off.toDataURL('image/jpeg', 0.95);
  a.click();
  hoverPt = prev; scheduleDraw();
}

// ═══════════════════════════════════════════════════════════════════
// LATEX-EXPORT
//   exprToPgf(expr)   → pgfplots-Ausdruck für \addplot{...}
//                       Sprache: gnuplot-ähnlich, Variable = \x
//                       Operatoren: * / + - ^ ( )
//                       Funktionen: sin, cos, tan, sqrt, ln, exp, abs, log10
// ═══════════════════════════════════════════════════════════════════

// Konvertiert JS-Ausdruck → pgfplots-Ausdruck (\x als Variable, gnuplot-Syntax)
// Unterstützte Funktionen: sin, cos, tan, sqrt, ln/log, exp, abs, log10, nthroot, logn
function exprToPgf(expr) {
  // Schritt 1: Vorverarbeitung
  let s = expr.trim();
  // nthroot(x,n) → (x)^(1/n)
  s = s.replace(/nthroot\(([^,]+),\s*([^)]+)\)/g, '(($1)^(1/($2)))');
  // logn(x,b) → ln(x)/ln(b)
  s = s.replace(/logn\(([^,]+),\s*([^)]+)\)/g, '(ln($1)/ln($2))');
  // log10(x) → log10(x) — pgfplots kennt log10
  // EC → 2.718281828
  s = s.replace(/\bEC\b/g, '2.718281828');
  // pi → pi (pgfplots kennt pi direkt)
  // ^ → ** schon gemacht? Nein, noch nicht. Machen wir hier:
  s = s.replace(/\^/g, '**');
  // log( → ln( (JS log = natürlicher Log)
  s = s.replace(/\blog\(/g, 'ln(');
  // exp(x) → exp(x) — pgfplots kennt exp
  // abs(x) → abs(x) — pgfplots kennt abs

  // Implizite Multiplikation (2x → 2*x) bevor x → \x
  s = s.replace(/(\d)([a-zA-Z])/g, '$1*$2');
  s = s.replace(/(\d)\(/g, '$1*(');
  s = s.replace(/\)\(/g, ')*(');
  s = s.replace(/\)([a-zA-Z])/g, ')*$1');

  // Schritt 2: x → \x (nur alleinstehende x-Variable, nicht in Funktionsnamen)
  s = s.replace(/\bx\b/g, '\\x');

  // Schritt 3: ** → ^ (pgfplots Potenz)
  s = s.replace(/\*\*/g, '^');

  // Schritt 4: Implizite Multiplikation mit \x entfernen wenn nötig:
  // pgfplots braucht explizites * z.B. 2*\x nicht 2\x
  // (bereits in JS-Ausdruck vorhanden)

  return s;
}

// ═══════════════════════════════════════════════════════════════════
// EINHEITLICHE FORMEL-DARSTELLUNG — exakt wie im Eingabefeld
// exprToMathLiveHtml(expr) rendert einen raw-Ausdruck GENAU so, wie er im
// MathLive-<math-field> erscheinen würde: derselbe Weg (miParseRaw → miToLatex)
// UND dieselbe Rendering-Engine (MathLive.convertLatexToMarkup — exakt die
// Funktion, die MathLive auch intern für die <math-field>-Elemente benutzt).
// Dadurch sind Legende, Kurven-Beschriftungen usw. IMMER konsistent mit der
// Eingabefeld-Schreibweise (arcsin statt asin, √ statt sqrt(...), echte
// Bruchstriche, hochgestellte Exponenten, ...) — ganz ohne eigene, potenziell
// abweichende Nachbau-Logik. NICHT für den LaTeX-Quelltext-Export verwenden
// (das bleibt exprToPgf oben, echter pgfplots-Ausdruck zum Copy-Paste).
// Ergebnis wird pro (bereits parameter-substituiertem) Ausdrucksstring
// gecacht, da MathLive.convertLatexToMarkup() relativ teuer ist und manche
// Aufrufer (z.B. das Beschriftungs-Overlay) bei jedem Redraw neu aufrufen.
// ═══════════════════════════════════════════════════════════════════
const _mlMarkupCache = new Map();
function _mlEscapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function exprToMathLiveHtml(rawExpr) {
  if (!rawExpr || !rawExpr.trim()) return '';
  if (_mlMarkupCache.has(rawExpr)) return _mlMarkupCache.get(rawExpr);
  let html;
  try {
    const latex = miToLatex(miParseRaw(rawExpr));
    html = (typeof MathLive !== 'undefined' && MathLive.convertLatexToMarkup)
      ? MathLive.convertLatexToMarkup(latex)
      : _mlEscapeHtml(rawExpr); // Fallback falls MathLive (noch) nicht geladen ist
  } catch (ex) {
    html = _mlEscapeHtml(rawExpr); // z.B. während des Tippens ein (noch) unvollständiger Ausdruck, oder Sonderformate wie "x = 3"
  }
  if (_mlMarkupCache.size > 300) _mlMarkupCache.clear(); // unbeschränktes Wachstum verhindern
  _mlMarkupCache.set(rawExpr, html);
  return html;
}

// Variante von exprToMathLiveHtml() für bereits fertiges LaTeX (kein Rohausdruck,
// daher kein miParseRaw/miToLatex-Schritt) — z.B. für die statischen Beschriftungen
// der Mathe-Tastatur-Tasten (⌨ Tastatur-Panel), damit "x²", "√x", "sin", ... dort
// in EXAKT derselben Schrift/Größe erscheinen wie im Eingabefeld, statt als
// Unicode-Annäherung (x², √) im normalen Browser-Font.
// Gecacht (wie exprToMathLiveHtml oben): ursprünglich nur einmal pro Taste beim
// Start aufgerufen, seit dem Lösungsweg-Fenster (generateSolveSteps() in
// 04_analysis.js, rr()) aber pro angezeigtem Zahlenwert bei JEDEM Tooltip-Öffnen
// — ohne Cache würde MathLive.convertLatexToMarkup() (laut eigenem Kommentar
// oben "relativ teuer") dort spürbar oft neu aufgerufen.
const _mlLatexMarkupCache = new Map();
function latexToMathLiveHtml(latex) {
  if (!latex) return '';
  if (_mlLatexMarkupCache.has(latex)) return _mlLatexMarkupCache.get(latex);
  let html;
  try {
    html = (typeof MathLive !== 'undefined' && MathLive.convertLatexToMarkup)
      ? MathLive.convertLatexToMarkup(latex)
      : _mlEscapeHtml(latex);
  } catch (ex) {
    html = _mlEscapeHtml(latex);
  }
  if (_mlLatexMarkupCache.size > 500) _mlLatexMarkupCache.clear();
  _mlLatexMarkupCache.set(latex, html);
  return html;
}

// Rundet eine View-Grenze auf eine "schöne" Zahl (ganze Zahl oder .5)
function roundViewBound(val) {
  // Runde auf nächste ganze Zahl (oder halbe Zahl wenn sehr nahe dran)
  const rounded = Math.round(val);
  const half = Math.round(val * 2) / 2;
  // Bevorzuge ganze Zahlen, sonst halbe
  if (Math.abs(val - rounded) < 0.5) return rounded;
  return half;
}

// Generiert pgfplots-LaTeX-Code — Funktionen + beschriftete Punkte
// Benötigt: \usepackage{pgfplots}  \pgfplotsset{compat=1.18}

// Konvertiert Zahl zu LaTeX-Bruch \frac{a}{b} wenn möglich, sonst Integer/Dezimal
function latexNum(v) {
  if (!isFinite(v)) return String(v);
  if (Math.abs(v) < 1e-9) return '0';
  if (Math.abs(v - Math.round(v)) < 1e-6) return String(Math.round(v));
  const neg = v < 0, abs = Math.abs(v);
  for (let q = 2; q <= 100; q++) {
    const p = Math.round(abs * q);
    if (Math.abs(p/q - abs) < 1e-6) {
      const g = gcdFrac(p, q);
      const frac = `\\frac{${p/g}}{${q/g}}`;
      return neg ? `-${frac}` : frac;
    }
  }
  return parseFloat(v.toFixed(4)).toString();
}

function generateLatex() {
  const v = isoView || view;
  const _ltxV = id => { const el=document.getElementById(id); return el&&el.value.trim()!==''?parseFloat(el.value):null; };
  const _ltxS = id => { const el=document.getElementById(id); return el?el.value:null; };
  const xminF = _ltxV('ltx-xmin') ?? roundViewBound(v.xmin);
  const xmaxF = _ltxV('ltx-xmax') ?? roundViewBound(v.xmax);
  const yminF = _ltxV('ltx-ymin') ?? roundViewBound(v.ymin);
  const ymaxF = _ltxV('ltx-ymax') ?? roundViewBound(v.ymax);
  const xRange = xmaxF - xminF, yRange = ymaxF - yminF;
  const pgfColors = ['blue','red','green!60!black','violet','orange!80!black','brown!70!black'];

  // ── Physikalische Achsenskalierung (cm pro Einheit) ───────────────
  function cmPerUnit(range) {
    if (range <= 3) return 3.0;
    if (range <= 5) return 2.5;
    if (range <= 8) return 2.0;
    if (range <= 12) return 1.5;
    if (range <= 20) return 1.0;
    if (range <= 35) return 0.6;
    return 0.4;
  }
  // WICHTIG: isometricMode() (02_core.js) ist immer aktiv — px/Einheit ist auf
  // dem Canvas für x UND y IMMER gleich (siehe getIsoView()), damit z.B. der
  // Einheitskreis dort immer als echter Kreis erscheint, nicht als Ellipse.
  // xRange/yRange kommen hier bereits aus isoView, sind bei nicht-quadratischem
  // Canvas also unterschiedlich gross (proportional zum Seitenverhältnis) —
  // wenn man cmPerUnit() TROTZDEM separat auf xRange und yRange anwendet,
  // können x und y in unterschiedliche "Bucket"-Stufen fallen (z.B. x=1.0cm,
  // y=0.6cm) und cm/Einheit wird für x und y verschieden: der Export zeichnet
  // dann in einem gestauchten Koordinatensystem, und aus dem Einheitskreis
  // wird eine Ellipse. Fix: EIN gemeinsamer cm/Einheit-Wert für beide Achsen
  // (an der grösseren der beiden Ranges bemessen, damit die Figur nicht zu
  // gross wird) — das erhält das Seitenverhältnis 1:1 pro Dateneinheit exakt
  // wie auf dem Canvas.
  const uCm = cmPerUnit(Math.max(xRange, yRange));
  const xCm = uCm.toFixed(1);
  const yCm = uCm.toFixed(1);

  // ── Tick-Berechnung ───────────────────────────────────────────────
  const _xts = _ltxV('ltx-xtickstep'), _yts = _ltxV('ltx-ytickstep');
  const xGS = (_xts && _xts > 0) ? _xts : gridStep(xRange);
  const yGS = (_yts && _yts > 0) ? _yts : gridStep(yRange);
  const xTickMin = Math.ceil(xminF / xGS) * xGS;
  const xTickMax = Math.floor(xmaxF / xGS) * xGS;
  const yTickMin = Math.ceil(yminF / yGS) * yGS;
  const yTickMax = Math.floor(ymaxF / yGS) * yGS;

  // Tick-String: {-3,...,3} oder {-3,-1,...,3} je nach Schrittweite
  function niceTickStr(lo, hi, step) {
    const isInt = Math.abs(step - Math.round(step)) < 1e-9;
    if (isInt) return `{${Math.round(lo)},${Math.round(lo+step)},...,${Math.round(hi)}}`;
    return `{${parseFloat(lo.toFixed(4))},${parseFloat((lo+step).toFixed(4))},...,${parseFloat(hi.toFixed(4))}}`;
  }

  // ── Pol-Erkennung: Domäne aufteilen ───────────────────────────────
  // Gibt Array von [lo, hi] Sub-Intervallen zurück wo die Funktion endlich ist.
  function getDomains(expr, xlo, xhi) {
    const steps = 500, dx = (xhi - xlo) / steps;
    const poles = [];
    let prevY = null, prevX = xlo;
    for (let s = 0; s <= steps; s++) {
      const x = xlo + s * dx, y = safeEval(expr, x);
      if (s > 0) {
        // prevY: endliche Zahl (letzter regulärer Wert) oder null (Sentinel = war nicht endlich)
        const bigJump = prevY !== null && isFinite(y) &&
          Math.abs(y - prevY) > yRange * 3 && Math.sign(y) !== Math.sign(prevY);
        if (bigJump || (prevY !== null && !isFinite(y)) || (prevY === null && isFinite(y))) {
          // Pol per Bisektion verfeinern (Richtung: endlich→unendlich)
          let lo2 = (prevY !== null) ? prevX : x;
          let hi2 = (prevY !== null) ? x : prevX;
          for (let it = 0; it < 25; it++) {
            const mid = (lo2 + hi2) / 2;
            if (isFinite(safeEval(expr, mid))) lo2 = mid; else hi2 = mid;
          }
          const poleX = (lo2 + hi2) / 2;
          if (!poles.some(p => Math.abs(p - poleX) < dx * 3)) poles.push(poleX);
        }
      }
      prevY = isFinite(y) ? y : null; prevX = x;
    }
    if (!poles.length) return [[xlo, xhi]];
    const gap = Math.max(0.02, xRange / 400);
    const bounds = [xlo, ...poles.sort((a,b) => a-b), xhi];
    const doms = [];
    for (let i = 0; i < bounds.length - 1; i++) {
      const a = i === 0 ? bounds[i] : bounds[i] + gap;
      const b = i === bounds.length - 2 ? bounds[i+1] : bounds[i+1] - gap;
      if (b > a + gap/2 && isFinite(safeEval(expr, (a+b)/2))) doms.push([a, b]);
    }
    return doms.length ? doms : [[xlo, xhi]];
  }

  // Rundet Domänen-Grenzen für lesbare Ausgabe (z.B. -0.09999 → -0.1)
  function fmtDom(val) { return parseFloat(val.toFixed(4)).toString(); }

  // ── Hilfsfunktionen ──────────────────────────────────────────────

  // Zahl → LaTeX-Math (π-Brüche/Brüche/Wurzeln für Labels, reine Dezimalzahl
  // für Koordinaten, siehe coord() weiter unten).
  // WICHTIG: Dieser lokale latexNum() ÜBERSCHATTET (shadowing) den gleich-
  // namigen, allgemeineren \frac{a}{b}-fähigen latexNum() ganz oben in dieser
  // Datei — bis eben hierher kannte diese Funktion NUR π-Vielfache, jeder
  // normale Bruch (z.B. 1/3) wurde als Dezimalzahl (0.33) ausgegeben, obwohl
  // dieselbe Zahl auf dem Canvas (niceNum()/niceCoord(), 03_math.js) als
  // echter Bruch bzw. sogar als Wurzelform (z.B. √2/2) angezeigt wird —
  // gemeldeter Fehler: "falls im Plot Brüche erscheinen, sollten diese beim
  // Latex-export auch erscheinen". Fix: dieselbe Formatierungs-Funktion wie
  // der Canvas verwenden (niceNum(val, false, true) — forAxis=false aktiviert
  // Bruch-/Wurzel-Erkennung, latex=true liefert \frac{}{}/\sqrt{}-LaTeX statt
  // Unicode), damit Export und Canvas für dieselbe Zahl garantiert identisch
  // aussehen.
  function latexNum(val) {
    if (!isFinite(val)) return '?';
    if (typeof niceNum === 'function') return niceNum(val, false, true);
    // Fallback, falls niceNum() aus irgendeinem Grund nicht verfügbar ist
    if (usePiMode()) {
      const pf = asPiFraction(val);
      if (pf) {
        const sign = pf.p < 0 ? '-' : '';
        const ap = Math.abs(pf.p);
        const ns = ap === 1 ? '\\pi' : `${ap}\\pi`;
        return pf.q === 1 ? `${sign}${ns}` : `${sign}\\frac{${ns}}{${pf.q}}`;
      }
    }
    return parseFloat(val.toFixed(precision)).toString();
  }

  // Koordinate → sicherer Dezimal-String (nie π, nie –)
  function coord(val) { return parseFloat(val.toFixed(6)).toString(); }

  // Hex-Farbe (#RRGGBB, z.B. aus COLORS[]/LO_STROKE/LO_OBJ_COLOR, siehe
  // 02_core.js/17_linopt.js) → pgfplots/xcolor-Inline-Farbe. Wird für Features
  // gebraucht, die ihre Farben nicht aus der festen pgfColors[]-Palette oben
  // nehmen, sondern eigene Hex-Werte verwenden (z.B. Ungleichungen der
  // linearen Optimierung, die dieselbe COLORS[]-Rotation wie functions[]
  // benutzen) — kein \definecolor nötig, direkt inline verwendbar.
  function hexToPgfColor(hex) {
    const m = /^#?([0-9a-fA-F]{6})$/.exec(hex || '');
    if (!m) return 'black';
    const r = parseInt(m[1].slice(0, 2), 16), g = parseInt(m[1].slice(2, 4), 16), b = parseInt(m[1].slice(4, 6), 16);
    return `{rgb,255:red,${r};green,${g};blue,${b}}`;
  }

  // ── Wurzelfunktionen: parametrischer LaTeX-Export ─────────────────
  // Nutzerwunsch: eine normal (dicht in x) gesampelte Wurzelkurve sieht am
  // Rand ihres Definitionsbereichs (z.B. bei x=0 für √x) unsauber/gerundet
  // aus, weil dort die Steigung gegen unendlich geht — pgfplots' übliches
  // \addplot{f(x)} tastet gleichmässig in x ab, also extrem grob genau dort,
  // wo die Kurve am steilsten ist. Fix (Nutzervorschlag): dieselbe Kurve
  // stattdessen PARAMETRISCH über t zeichnen, wobei t die WURZEL selbst ist
  // (analog zu "mit x² zeichnen und die Achsen/Domains vertauschen") — die
  // Steigung bzgl. t ist dort überall endlich, das Sampling wird gleichmässig
  // fein genau dort, wo es nötig ist.
  //
  // Erkennt Ausdrücke der Form  y = a·(c·x+k)^(1/n) + h  — also
  // a·sqrt(...)+h bzw. a·nthroot(...,n)+h, wobei das Innere der Wurzel LINEAR
  // in x mit Koeffizient ±1 ist (z.B. "x-3", "-x+2", "5-x", "x"). Deckt damit
  // sowohl die eingebaute "Wurzelfunktion"-Form aus dem Potenz-Panel ab
  // (POWER_CASES.root: 'a*nthroot(x-v,n)+h', siehe 11_fitting.js) als auch
  // frei getippte Ausdrücke wie "sqrt(x-2)" in einem beliebigen Funktions-
  // Feld. Erwartet den Ausdruck NACH Parameter-Substitution (_ltxSub/
  // exprWithValues), also rein numerisch. Gibt null zurück, wenn die Form
  // nicht passt (z.B. Wurzel-Inhalt nicht linear, oder mit Koeffizient ≠±1)
  // — dann greift weiter unten unverändert der normale Export-Pfad.
  function parseUnitLinearArg(sRaw) {
    const s = sRaw.replace(/\s+/g, '');
    if (s === 'x') return { coeff: 1, konst: 0 };
    if (s === '-x') return { coeff: -1, konst: 0 };
    let m = /^x([+-]\d+\.?\d*)$/.exec(s);           // x-3, x+2.5
    if (m) return { coeff: 1, konst: parseFloat(m[1]) };
    m = /^-x([+-]\d+\.?\d*)$/.exec(s);              // -x+3, -x-1
    if (m) return { coeff: -1, konst: parseFloat(m[1]) };
    m = /^([+-]?\d+\.?\d*)([+-])x$/.exec(s);        // 3-x, -2+x, 5+x
    if (m) return { coeff: (m[2] === '-') ? -1 : 1, konst: parseFloat(m[1]) };
    return null;
  }
  function detectRootForm(numExpr) {
    const s = (numExpr || '').replace(/\s+/g, '');
    const m = /^([+-]?[\d.]*)\*?(sqrt|nthroot)\(([^,()]+)(?:,([\d.]+))?\)([+-][\d.]+)?$/.exec(s);
    if (!m) return null;
    const [, aStr, fname, argStr, nStr, hStr] = m;
    let a;
    if (aStr === '' || aStr === '+') a = 1;
    else if (aStr === '-') a = -1;
    else { a = parseFloat(aStr); if (!isFinite(a)) return null; }
    const n = fname === 'sqrt' ? 2 : parseFloat(nStr);
    if (!isFinite(n) || n < 2 || Math.round(n) !== n) return null; // nur ganzzahlige Wurzelindizes ≥2
    const lin = parseUnitLinearArg(argStr);
    if (!lin) return null;
    const h = hStr ? parseFloat(hStr) : 0;
    return { a, n, coeff: lin.coeff, konst: lin.konst, h };
  }

  // Erkennt ob irgendeine sichtbare Funktion Trigo-Charakter hat
  function hasTrig() {
    return functions.some(fn => fn.visible !== false && fn.expr.trim() &&
      /\b(sin|cos|tan)\s*\(/.test(fn.expr));
  }

  // Kollisionsfreier anchor: wechselt je Index, y-Vorzeichen und Rand-Nähe
  const anchors = ['south west','north west','south east','north east'];
  function ptAnchor(x, y, idx) {
    // Naive Zuweisung: abwechselnd links/rechts, oben/unten
    const side = idx % 2 === 0 ? 'west' : 'east';
    const vert = y >= 0 ? 'south' : 'north';
    return `${vert} ${side}`;
  }

  // ── π-Achsenbeschriftung erkennen ────────────────────────────────
  // Wenn Trigo-Funktionen vorhanden: x-Achse mit π-Vielfachen beschriften
  let xtickStr = '', xticklabelStr = '';
  if (hasTrig()) {
    // Passenden Schritt wählen: π/2 wenn View klein, π wenn mittel, 2π wenn gross
    const xRange = xmaxF - xminF;
    const piStep = xRange <= 4*PI ? PI/2 : xRange <= 8*PI ? PI : 2*PI;
    const ticks = [], labels = [];
    const startTick = Math.ceil(xminF / piStep) * piStep;
    for (let t = startTick; t <= xmaxF + 1e-9; t += piStep) {
      ticks.push(coord(t));
      // Label
      const pf = asPiFraction(t);
      if (Math.abs(t) < 1e-9) {
        labels.push('$0$');
      } else if (pf) {
        const sign = pf.p < 0 ? '-' : '';
        const ap = Math.abs(pf.p);
        const ns = ap === 1 ? '\\pi' : `${ap}\\pi`;
        const lbl = pf.q === 1 ? `${sign}${ns}` : `${sign}\\frac{${ns}}{${pf.q}}`;
        labels.push(`$${lbl}$`);
      } else {
        labels.push(`$${parseFloat(t.toFixed(3))}$`);
      }
    }
    if (ticks.length) {
      xtickStr = `  xtick={${ticks.join(',')}},`;
      xticklabelStr = `  xticklabels={${labels.join(',')}},`;
    }
  }

  // ── Achsenbeschriftungsabstand (verhindert Überlappung) ──────────
  const xtickdist = hasTrig() ? '' : '';

  // ── Body zusammenbauen ───────────────────────────────────────────
  let body = '';

  // 0. Lineare Optimierung (Planungspolygon + Zielfunktions-Gerade) —
  // eigenes Unterrichts-Feature mit eigenen Datenstrukturen (loConstraints[],
  // loObjA/loObjB/loObjK, computeFeasiblePolygon(), siehe 17_linopt.js) und
  // KOMPLETT unabhängig von functions[]. Der LaTeX-Export hat das bisher
  // gar nicht berücksichtigt — beim Exportieren einer reinen Optimierungs-
  // Aufgabe blieb das Bild praktisch leer. Baut 1:1 nach, was drawLinOpt()
  // (08_draw.js/17_linopt.js) auf dem Canvas zeichnet: Polygon-Füllung +
  // Rand, Eckpunkte mit Koordinaten-Beschriftung, Randgeraden der einzelnen
  // Ungleichungen (über die volle Breite/Höhe des Sichtbereichs, wie
  // loDrawBoundaryLine()), und — falls aufgeschaltet — die Zielfunktions-
  // Gerade mit Griff-Punkt und "z=…"-Beschriftung (wie drawLoObjectiveLine()).
  // Zeichenreihenfolge VOR den Funktionsgraphen, damit Kurven ggf. über dem
  // Polygon liegen — exakt wie in draw() (Abschnitt 6b vor 7).
  if (typeof loConstraints !== 'undefined' && typeof parseLoConstraint === 'function') {
    const loShowPoly = document.getElementById('chk-lo-polygon')?.checked;
    const validLoConstraints = loConstraints.filter(c => c.visible && parseLoConstraint(c.raw));
    if (loShowPoly && validLoConstraints.length > 0 && typeof computeFeasiblePolygon === 'function') {
      const { poly, box: loBox } = computeFeasiblePolygon();
      if (poly.length >= 3) {
        body += `  % Lineare Optimierung: Planungspolygon\n`;
        const loStrokeCol = hexToPgfColor(typeof LO_STROKE !== 'undefined' ? LO_STROKE : '#378ADD');
        // WICHTIG: Bei unbeschränktem Planungspolygon (z.B. nur EINE Ungleichung
        // ohne obere Schranke) liefert computeFeasiblePolygon() Eckpunkte einer
        // riesigen "Unendlich"-Ersatz-Box (LO_BOX_MIN=1000 Einheiten, siehe
        // 17_linopt.js) — auf dem Canvas unproblematisch, da der Browser das
        // Zeichnen einfach am Canvas-Rand abschneidet. In pgfplots/TikZ dagegen
        // werden Koordinaten mit dem cm/Einheit-Massstab (x=…cm) multipliziert;
        // 1000 Einheiten × z.B. 1cm ergibt 1000cm, weit über TeX's fester
        // Dimensions-Obergrenze (~575cm) → "! Dimension too large."-Fehler, und
        // die Füllung wird dadurch kaputt/unvorhersehbar dargestellt (genau der
        // gemeldete Fehler: "Planungspolygon nicht ganz richtig ausgefüllt").
        // Fix: das Polygon VOR der Ausgabe exakt auf den sichtbaren
        // Achsenbereich zuschneiden (gleiche loClip()-Sutherland-Hodgman-
        // Clipping-Funktion, die computeFeasiblePolygon() selbst benutzt) —
        // alle exportierten Koordinaten bleiben dadurch innerhalb des
        // sichtbaren Bereichs, und pgfplots' eigenes axis-Clipping (clip=true,
        // Default) übernimmt exakt wie beim Canvas den optischen Feinschliff
        // am Rand.
        let fillPoly = poly;
        if (typeof loClip === 'function') {
          fillPoly = loClip(fillPoly, 1, 0, xmaxF, '<=');
          fillPoly = loClip(fillPoly, 1, 0, xminF, '>=');
          fillPoly = loClip(fillPoly, 0, 1, ymaxF, '<=');
          fillPoly = loClip(fillPoly, 0, 1, yminF, '>=');
        }
        if (fillPoly.length >= 3) {
          // WICHTIG: \addplot[...] coordinates {...} \closedcycle; (pgfplots'
          // "Funktionsplot"-Mechanismus) füllt ein Polygon wie dieses — mit
          // horizontalen/vertikalen Kanten und nicht-monotonem x-Verlauf, wie es
          // bei einem zugeschnittenen Planungspolygon entsteht — nachweislich
          // NUR TEILWEISE (getestet: nur ein kleines Teildreieck statt der
          // gesamten Fläche wurde gefüllt, unabhängig von axis-clip=true/false).
          // Das war der gemeldete Fehler ("Planungspolygon nicht ganz richtig
          // ausgefüllt"). Ein roher TikZ-Pfad (\path ... -- cycle;) mit
          // "axis cs:"-Koordinaten ist der pgfplots-Standardweg, um beliebige
          // Polygone zuverlässig zu füllen, und wurde hier gegen genau diesen
          // Fall getestet (funktioniert korrekt).
          const pathPts = fillPoly.map(p => `(axis cs:${coord(p.x)},${coord(p.y)})`).join(' -- ');
          body += `  \\path[draw=${loStrokeCol}, fill=blue!15, fill opacity=0.6, thick] ${pathPts} -- cycle;\n`;
        }
        // Eckpunkte beschriften: nur "echte" Eckpunkte (Schnittpunkte der
        // Ungleichungen), keine Artefakte der Unendlich-Ersatz-Box — analog zu
        // loShowSolution() (17_linopt.js), die dieselbe Unterscheidung trifft.
        const isLoBoxVertex = p => Math.abs(p.x) > loBox * 0.9 || Math.abs(p.y) > loBox * 0.9;
        poly.forEach(p => {
          if (isLoBoxVertex(p)) return;
          if (p.x < xminF - 0.5 || p.x > xmaxF + 0.5 || p.y < yminF - 0.5 || p.y > ymaxF + 0.5) return;
          body += `  \\addplot[color=${loStrokeCol}, fill=white, only marks, mark=*, mark size=2pt] coordinates {(${coord(p.x)},${coord(p.y)})};\n`;
          body += `  \\node[anchor=south west, font=\\tiny, color=${loStrokeCol}] at (axis cs:${coord(p.x)},${coord(p.y)}) {$\\left(${latexNum(p.x)}\\,|\\,${latexNum(p.y)}\\right)$};\n`;
        });
      }
      // Randgeraden der einzelnen Ungleichungen — jeweils volle Sichtbereichsbreite/-höhe
      body += `  % Randgeraden der Ungleichungen\n`;
      loConstraints.forEach((con) => {
        if (!con.visible) return;
        const p = parseLoConstraint(con.raw);
        if (!p) return;
        let p1, p2;
        if (Math.abs(p.b) > 1e-9) { p1 = { x: xminF, y: (p.c - p.a * xminF) / p.b }; p2 = { x: xmaxF, y: (p.c - p.a * xmaxF) / p.b }; }
        else if (Math.abs(p.a) > 1e-9) { p1 = { x: p.c / p.a, y: yminF }; p2 = { x: p.c / p.a, y: ymaxF }; }
        else return;
        const conCol = hexToPgfColor(con.color || '#378ADD');
        body += `  \\addplot[color=${conCol}, thin] coordinates {(${coord(p1.x)},${coord(p1.y)}) (${coord(p2.x)},${coord(p2.y)})};\n`;
      });
    }
    if (typeof loObjActive !== 'undefined' && loObjActive) {
      let p1, p2;
      if (Math.abs(loObjB) > 1e-9) { p1 = { x: xminF, y: (loObjK - loObjA * xminF) / loObjB }; p2 = { x: xmaxF, y: (loObjK - loObjA * xmaxF) / loObjB }; }
      else if (Math.abs(loObjA) > 1e-9) { p1 = { x: loObjK / loObjA, y: yminF }; p2 = { x: loObjK / loObjA, y: ymaxF }; }
      else { p1 = null; p2 = null; }
      if (p1 && p2) {
        const objCol = hexToPgfColor(typeof LO_OBJ_COLOR !== 'undefined' ? LO_OBJ_COLOR : '#D4537E');
        body += `  % Zielfunktions-Gerade\n`;
        body += `  \\addplot[color=${objCol}, thick, dashed] coordinates {(${coord(p1.x)},${coord(p1.y)}) (${coord(p2.x)},${coord(p2.y)})};\n`;
        if (typeof loGetHandlePos === 'function') {
          const hp = loGetHandlePos();
          if (hp.x >= xminF && hp.x <= xmaxF && hp.y >= yminF && hp.y <= ymaxF) {
            body += `  \\addplot[color=${objCol}, fill=white, only marks, mark=*, mark size=3pt] coordinates {(${coord(hp.x)},${coord(hp.y)})};\n`;
            body += `  \\node[anchor=south west, font=\\small\\bfseries, color=${objCol}] at (axis cs:${coord(hp.x)},${coord(hp.y)}) {$z=${latexNum(loObjK)}$};\n`;
          }
        }
      }
    }
  }

  // 0b. Ober-/Untersummen-Applet (riemann, siehe 06_ui_functions.js /
  // drawRiemann() in 08_draw.js) — eigene Konstruktion ausserhalb von
  // functions[] (nur die zugrundeliegende Funktion selbst wird weiter unten
  // automatisch mitexportiert, siehe Abschnitt "1. Funktionsgraphen") —
  // bisher komplett im Export gefehlt (Nutzerwunsch: "wenn du solche Sachen
  // neu machst, solltest du auch schauen, dass der Latex-Export auch
  // funktioniert"). Baut drawRiemann() nach: Obersumme-Rechtecke (orange) +
  // Untersumme-Rechtecke (teal, DARÜBER — dieselbe Farbreihenfolge wie auf
  // dem Canvas) + die beiden ziehbaren Intervallgrenzen a/b mit Koordinaten-
  // Label. VOR den Funktionsgraphen eingefügt, damit die Kurve später über
  // den Rechtecken liegt (exakt wie auf dem Canvas, Zeichenreihenfolge 6a vor
  // 7 in draw(), 08_draw.js). Immer Einzelfunktions-Modus (riemann hat seit
  // dem Auftrennen in "Ober-/Untersummen" und "Flächen" nur noch fi1/xA/xB/n
  // — die frühere Zwei-Funktionen-Fläche lebt jetzt eigenständig im
  // Flächen-Applet, siehe Abschnitt "2." unten).
  if (typeof riemann !== 'undefined' && riemann) {
    const rFn = functions[riemann.fi1];
    if (rFn && rFn.visible !== false) {
      const rxA = riemann.xA, rxB = riemann.xB;
      const rxLeft = Math.min(rxA, rxB), rxRight = Math.max(rxA, rxB);
      const rWidth = rxRight - rxLeft;
      const rn = Math.max(1, riemann.n || 10);
      if (rWidth > 1e-9) {
        const stripW = rWidth / rn;
        // Gleiche Stichprobendichte je Teilintervall wie drawRiemann() (siehe
        // RIEMANN_SAMPLES_PER_STRIP, 08_draw.js) — echtes Supremum/Infimum
        // statt nur der Randwerte, sonst bei nicht-monotonen Funktionen falsch.
        const SAMPLES = (typeof RIEMANN_SAMPLES_PER_STRIP !== 'undefined') ? RIEMANN_SAMPLES_PER_STRIP : 24;
        const rStrips = [];
        for (let k = 0; k < rn; k++) {
          const sxL = rxLeft + k * stripW, sxR = rxLeft + (k + 1) * stripW;
          let sup = -Infinity, inf = Infinity;
          for (let s = 0; s <= SAMPLES; s++) {
            const x = sxL + (sxR - sxL) * (s / SAMPLES);
            const y = safeEval(rFn.expr, x);
            if (!isFinite(y)) continue;
            if (y > sup) sup = y;
            if (y < inf) inf = y;
          }
          if (sup === -Infinity || inf === Infinity) continue; // hier nirgends definiert
          rStrips.push({ sxL, sxR, sup, inf });
        }
        if (rStrips.length) {
          // Gleiche feste Farben wie auf dem Canvas: COLORS[1]='#D85A30'
          // (Obersumme, orange) / COLORS[2]='#1D9E75' (Untersumme, teal) —
          // über hexToPgfColor() (siehe oben) statt eines xcolor-Namens, da
          // xcolor "teal" ohne zusätzliches Paket nicht garantiert verfügbar ist.
          const oberCol = hexToPgfColor('#D85A30'), unterCol = hexToPgfColor('#1D9E75');
          body += `  % Ober-/Untersummen-Applet (n=${rn})\n`;
          rStrips.forEach(({ sxL, sxR, sup }) => {
            body += `  \\path[draw=${oberCol}, fill=${oberCol}, fill opacity=0.35] (axis cs:${coord(sxL)},0) rectangle (axis cs:${coord(sxR)},${coord(sup)});\n`;
          });
          rStrips.forEach(({ sxL, sxR, inf }) => {
            body += `  \\path[draw=${unterCol}, fill=${unterCol}, fill opacity=0.55] (axis cs:${coord(sxL)},0) rectangle (axis cs:${coord(sxR)},${coord(inf)});\n`;
          });
        }
        // Intervallgrenzen a und b: neutrale Farbe (schwarz) — analog zu
        // dqConstrColor() beim Differenzenquotient-Applet (Konstruktions-
        // element, keine Funktionsfarbe).
        const rIsCoincident = Math.abs(rxB - rxA) < 1e-9;
        if (rIsCoincident) {
          body += `  \\addplot[black, fill=white, only marks, mark=*, mark size=3pt] coordinates {(${coord(rxA)},0)};\n`;
          body += `  \\node[anchor=south, font=\\small, yshift=2pt] at (axis cs:${coord(rxA)},0) {$a=b=${latexNum(rxA)}$};\n`;
        } else {
          body += `  \\addplot[black, fill=white, only marks, mark=*, mark size=3pt] coordinates {(${coord(rxA)},0) (${coord(rxB)},0)};\n`;
          body += `  \\node[anchor=south, font=\\small, yshift=2pt] at (axis cs:${coord(rxA)},0) {$a=${latexNum(rxA)}$};\n`;
          body += `  \\node[anchor=south, font=\\small, yshift=2pt] at (axis cs:${coord(rxB)},0) {$b=${latexNum(rxB)}$};\n`;
        }
      }
    }
  }

  // 1. Funktionsgraphen (mit Pol-Erkennung: Domäne aufteilen)
  // WICHTIG: name path muss VOR fill-between definiert werden!
  //
  // WICHTIG: Funktionen aus den Menüpunkten (z.B. y=mx+q, y=a·bˣ+c, y=a·(x−v)ⁿ+h,
  // …) speichern in fn.expr die ALLGEMEINE Form mit Parameter-BUCHSTABEN
  // (a,b,c,m,q,n,v,h,…), nicht die aktuellen Zahlenwerte — die Schieberegler
  // (params{}, siehe 03_math.js) liefern die Werte erst zur Auswertungszeit
  // (safeEval liest params LIVE). exprToPgf() ist dagegen ein reiner
  // TEXT-Konverter, der keinen Zugriff auf params{} hat: ohne vorherige
  // Substitution landet z.B. wortwörtlich "a*b^x+c" im exportierten
  // \addplot{...} — pgfplots kennt "a"/"b"/"c" dort nicht und kann die Kurve
  // nicht zeichnen. exprWithValues() (03_math.js) setzt die AKTUELLEN
  // Schieberegler-Werte textuell ein (liefert einen rein numerischen
  // Ausdruck), bevor exprToPgf() ihn in pgfplots-Syntax übersetzt.
  const _ltxSub = expr => (typeof exprWithValues === 'function') ? exprWithValues(expr) : expr;
  functions.forEach((fn, i) => {
    if (!fn.expr.trim() || fn.visible === false) return;
    // Ausdruck überspringen wenn er nirgends endlich ist (z.B. unvollständige Brüche wie "()/()")
    const testVals = [0, 1, -1, 2, -2].map(xv => safeEval(fn.expr, xv));
    if (testVals.every(v => !isFinite(v))) return;
    const col = pgfColors[i % pgfColors.length];

    // ── Wurzelfunktionen: parametrischer Plot statt Standard-\addplot ──
    // (siehe detectRootForm()/parseUnitLinearArg() weiter oben für die
    // ausführliche Begründung) — vermeidet die unsaubere/gerundete Optik am
    // Rand des Definitionsbereichs (unendliche Steigung), die beim üblichen
    // dichten x-Sampling entsteht.
    const rootForm = detectRootForm(_ltxSub(fn.expr));
    if (rootForm) {
      const { a: rA, n: rN, coeff: rC, konst: rK, h: rH } = rootForm;
      // Sichtbaren x-Bereich ggf. zusätzlich auf einen manuell gesetzten
      // Definitionsbereich einschränken (fn.domainMin/domainMax — gleiche
      // Konvention wie draw() in 08_draw.js).
      let xLoV = xminF, xHiV = xmaxF;
      if (fn.domainMin != null) xLoV = Math.max(xLoV, fn.domainMin);
      if (fn.domainMax != null) xHiV = Math.min(xHiV, fn.domainMax);
      // Bei geradem Wurzelindex (n gerade, z.B. sqrt = nthroot mit n=2) ist
      // arg(x)=rC·x+rK nur für arg≥0 reell definiert — sichtbaren Bereich auf
      // die "offene" Seite der Definitionsgrenze zuschneiden. Bei ungeradem n
      // ist arg(x) für ALLE x reell definiert (auch negativ) — dort geht es
      // nur um die Optik an der Stelle unendlicher Steigung (arg=0), nicht um
      // eine echte Einschränkung der Definitionsmenge.
      if (rN % 2 === 0) {
        const xEdge = -rK / rC;
        if (rC > 0) xLoV = Math.max(xLoV, xEdge); else xHiV = Math.min(xHiV, xEdge);
      }
      if (xHiV > xLoV + 1e-9) {
        const argAt = xv => rC * xv + rK;
        // t = ⁿ√(arg) — bei geradem n nur der nichtnegative Ast (reell
        // definiert), bei ungeradem n inkl. Vorzeichen (analog zu _nthroot(),
        // siehe 03_math.js).
        const tAt = xv => {
          const av = argAt(xv);
          if (rN % 2 === 0) return av < 0 ? 0 : Math.pow(av, 1 / rN);
          return av < 0 ? -Math.pow(-av, 1 / rN) : Math.pow(av, 1 / rN);
        };
        const tLo = tAt(xLoV), tHi = tAt(xHiV);
        // x(t) = (t^n − rK) / rC,  y(t) = rA·t + rH — Umkehrung von
        // t = ((rC·x+rK))^(1/n): t^n = rC·x+rK ⇔ x = (t^n−rK)/rC.
        const xExpr = `((\\x)^${rN}-(${coord(rK)}))/(${coord(rC)})`;
        const yExpr = `(${coord(rA)})*(\\x)+(${coord(rH)})`;
        body += `  \\addplot[${col}, thick, name path=F${i}, domain=${coord(tLo)}:${coord(tHi)}, samples=100] ({${xExpr}}, {${yExpr}});\n`;
      }
      return;
    }

    const pgfExpr = exprToPgf(_ltxSub(fn.expr));
    const doms = getDomains(fn.expr, xminF, xmaxF);
    doms.forEach(([dlo, dhi]) => {
      body += `  \\addplot[${col}, thick, name path=F${i}, domain=${fmtDom(dlo)}:${fmtDom(dhi)}, samples=100] {${pgfExpr}};\n`;
    });
  });

  // 1b. Folgen (diskrete Punkte, eigenes Feature — sequences[]/computeSeqTerms(),
  // siehe 13_sequences.js) — bisher ebenfalls nicht im LaTeX-Export enthalten.
  // Baut drawSequences() (08_draw.js) nach: optionale gestrichelte Verbindungslinie
  // + Kreis-Marker pro Folgenglied (n, a_n), begrenzt auf den sichtbaren Bereich.
  if (typeof sequences !== 'undefined' && typeof computeSeqTerms === 'function') {
    sequences.forEach((seq) => {
      if (!seq.visible || !seq.expr.trim()) return;
      const pts = computeSeqTerms(seq, false).filter(p => p.n >= xminF - 1 && p.n <= xmaxF + 1 && p.y >= yminF - 1 && p.y <= ymaxF + 1);
      if (!pts.length) return;
      const seqCol = hexToPgfColor(seq.color || '#378ADD');
      body += `  % Folge: ${seq.expr.trim()}\n`;
      if (seq.showLine) {
        const lineCoords = pts.map(p => `(${coord(p.n)},${coord(p.y)})`).join(' ');
        body += `  \\addplot[color=${seqCol}, opacity=0.4, thin, dashed] coordinates {${lineCoords}};\n`;
      }
      const ptCoords = pts.map(p => `(${coord(p.n)},${coord(p.y)})`).join(' ');
      body += `  \\addplot[color=${seqCol}, fill=white, only marks, mark=*, mark size=2.2pt] coordinates {${ptCoords}};\n`;
    });
  }

  // 2. Flächen-Applet (flaeche, siehe 06_ui_functions.js / drawFlaeche() in
  // 08_draw.js) — bisher wie das Ober-/Untersummen-Applet NICHT im Export
  // enthalten (Nutzerwunsch: "solche Sachen" sollen auch im Latex-Export
  // korrekt erscheinen). axis 'x'/'g': schraffierte Fläche zwischen f und g
  // (bzw. f und der x-Achse) per pgfplots fill-between — braucht die
  // name path-Plots aus Abschnitt "1." (deshalb HIER, danach platziert;
  // benötigt \usepgfplotslibrary{fillbetween}). axis 'y': KEIN fill-between
  // möglich, da x(y) i.A. nicht symbolisch vorliegt (siehe "let flaeche" in
  // 02_core.js) — stattdessen dieselben numerisch abgetasteten Randpunkte
  // wie auf dem Canvas (_flaecheYInvertNear(), 06_ui_functions.js — gleiche
  // Kontinuitäts-Verfolgung, damit z.B. bei x² nicht zwischen den beiden
  // Ästen ±√y gesprungen wird) als gefülltes Koordinaten-Polygon exportiert,
  // damit Canvas und Latex-Export exakt dieselbe Fläche zeigen.
  if (typeof flaeche !== 'undefined' && flaeche) {
    const fFn1 = functions[flaeche.fi1];
    const hasG = flaeche.axis === 'g';
    const fFn2 = hasG ? functions[flaeche.fi2] : null;
    const finiteAt = fn => fn && fn.visible !== false &&
      [0, 1, -1, 2, -2].map(xv => safeEval(fn.expr, xv)).some(isFinite);
    if (finiteAt(fFn1) && (!hasG || finiteAt(fFn2))) {
      const fA = flaeche.a, fB = flaeche.b;
      const fLo = Math.min(fA, fB), fHi = Math.max(fA, fB);
      const fillCol = pgfColors[flaeche.fi1 % pgfColors.length];

      if (flaeche.axis === 'x' || flaeche.axis === 'g') {
        if (fHi - fLo > 1e-9) {
          const d1c = coord(fLo), d2c = coord(fHi);
          let secondPath = `F${flaeche.fi2}`;
          body += `  % Fläche zwischen f und ${hasG ? 'g' : 'der x-Achse'} (Flächen-Applet)\n`;
          if (!hasG) {
            secondPath = 'FLAECHE_XACHSE';
            body += `  \\addplot[draw=none, name path=${secondPath}] coordinates {(${d1c},0) (${d2c},0)};\n`;
          }
          body += `  \\addplot[${fillCol}!30, fill opacity=0.5, draw=none]\n`;
          body += `    fill between[of=F${flaeche.fi1} and ${secondPath}, soft clip={domain=${d1c}:${d2c}}];\n`;
          body += `  \\addplot[black, fill=white, only marks, mark=*, mark size=3pt] coordinates {(${coord(fA)},0) (${coord(fB)},0)};\n`;
          body += `  \\node[anchor=south, font=\\small, yshift=2pt] at (axis cs:${coord(fA)},0) {$a=${latexNum(fA)}$};\n`;
          body += `  \\node[anchor=south, font=\\small, yshift=2pt] at (axis cs:${coord(fB)},0) {$b=${latexNum(fB)}$};\n`;
        } else {
          body += `  \\addplot[black, fill=white, only marks, mark=*, mark size=3pt] coordinates {(${coord(fA)},0)};\n`;
          body += `  \\node[anchor=south, font=\\small, yshift=2pt] at (axis cs:${coord(fA)},0) {$a=b=${latexNum(fA)}$};\n`;
        }
      } else {
        // axis === 'y' — numerisches Randpolygon statt fill-between.
        if (fHi - fLo > 1e-9) {
          const [xSearchLo, xSearchHi] = _riemannIsectSearchRange();
          const steps = 100;
          const nearRadius = Math.max((xSearchHi - xSearchLo) * 0.1, 1);
          const pts = [];
          let prevX = null;
          for (let i = 0; i <= steps; i++) {
            const y = fLo + (i / steps) * (fHi - fLo);
            const x = prevX === null
              ? _flaecheYInvert(fFn1.expr, y, xSearchLo, xSearchHi)
              : _flaecheYInvertNear(fFn1.expr, y, prevX, nearRadius, xSearchLo, xSearchHi);
            if (x !== null) { pts.push({ x, y }); prevX = x; } else { prevX = null; }
          }
          if (pts.length > 1) {
            body += `  % Fläche zwischen f und der y-Achse (Flächen-Applet)\n`;
            const boundary = pts.map(p => `(axis cs:${coord(p.x)},${coord(p.y)})`)
              .concat(pts.slice().reverse().map(p => `(axis cs:0,${coord(p.y)})`));
            body += `  \\path[fill=${fillCol}!30, fill opacity=0.5, draw=none] ${boundary.join(' -- ')} -- cycle;\n`;
            body += `  \\draw[${fillCol}!60, dashed, thin] (axis cs:${coord(xminF)},${coord(fLo)}) -- (axis cs:${coord(xmaxF)},${coord(fLo)});\n`;
            body += `  \\draw[${fillCol}!60, dashed, thin] (axis cs:${coord(xminF)},${coord(fHi)}) -- (axis cs:${coord(xmaxF)},${coord(fHi)});\n`;
          }
          body += `  \\addplot[black, fill=white, only marks, mark=*, mark size=3pt] coordinates {(0,${coord(fA)}) (0,${coord(fB)})};\n`;
          body += `  \\node[anchor=west, font=\\small, xshift=2pt] at (axis cs:0,${coord(fA)}) {$a=${latexNum(fA)}$};\n`;
          body += `  \\node[anchor=west, font=\\small, xshift=2pt] at (axis cs:0,${coord(fB)}) {$b=${latexNum(fB)}$};\n`;
        } else {
          body += `  \\addplot[black, fill=white, only marks, mark=*, mark size=3pt] coordinates {(0,${coord(fA)})};\n`;
          body += `  \\node[anchor=west, font=\\small, xshift=2pt] at (axis cs:0,${coord(fA)}) {$a=b=${latexNum(fA)}$};\n`;
        }
      }
    }
  }

  // 2b. Asymptoten (wenn Smart-Button aktiv)
  const _expSmartAsymp = functions.some((_, i) => activeSpecials.has(`${i}:asymp`));
  if (_expSmartAsymp) {
    functions.forEach((fn, i) => {
      if (!fn.expr.trim() || fn.visible === false) return;
      const testVals = [0, 1, -1, 2, -2].map(xv => safeEval(fn.expr, xv));
      if (testVals.every(v => !isFinite(v))) return;
      const col = pgfColors[i % pgfColors.length];
      // Vertikale Asymptoten: aus getDomains ableiten
      const doms = getDomains(fn.expr, xminF, xmaxF);
      for (let d = 0; d < doms.length - 1; d++) {
        const xPole = (doms[d][1] + doms[d+1][0]) / 2;
        if (xPole > xminF && xPole < xmaxF) {
          body += `  \\draw[${col}!60, dashed, thin] (axis cs:${coord(xPole)},${coord(yminF)}) -- (axis cs:${coord(xPole)},${coord(ymaxF)});\n`;
        }
      }
      // Horizontale Asymptoten: Grenzwert für x→±∞
      const BIG = 1e6;
      const yPI = [safeEval(fn.expr, BIG), safeEval(fn.expr, BIG*0.9), safeEval(fn.expr, BIG*0.8)];
      const yMI = [safeEval(fn.expr, -BIG), safeEval(fn.expr, -BIG*0.9), safeEval(fn.expr, -BIG*0.8)];
      const hAsymsLtx = [];
      if (yPI.every(isFinite) && Math.max(...yPI)-Math.min(...yPI) < 1e-3) {
        const hv = yPI[0];
        if (hv > yminF && hv < ymaxF && !hAsymsLtx.some(a=>Math.abs(a-hv)<0.01)) hAsymsLtx.push(hv);
      }
      if (yMI.every(isFinite) && Math.max(...yMI)-Math.min(...yMI) < 1e-3) {
        const hv = yMI[0];
        if (hv > yminF && hv < ymaxF && !hAsymsLtx.some(a=>Math.abs(a-hv)<0.01)) hAsymsLtx.push(hv);
      }
      hAsymsLtx.forEach(hv => {
        body += `  \\draw[${col}!60, dashed, thin] (axis cs:${coord(xminF)},${coord(hv)}) -- (axis cs:${coord(xmaxF)},${coord(hv)});\n`;
      });
      // Schräge Asymptoten aus specials-Cache
      if (typeof specials !== 'undefined') {
        const seenObl = [];
        specials.filter(sp => sp.kind === 'asymp' && sp.fi === i && sp.oblique).forEach(sp => {
          const key = `${sp.slope.toFixed(5)}_${sp.intercept.toFixed(4)}`;
          if (seenObl.includes(key)) return;
          seenObl.push(key);
          const y0 = sp.slope * xminF + sp.intercept;
          const y1 = sp.slope * xmaxF + sp.intercept;
          body += `  \\draw[${col}!60, dashed, thin] (axis cs:${coord(xminF)},${coord(y0)}) -- (axis cs:${coord(xmaxF)},${coord(y1)});\n`;
        });
      }
    });
  }

  // 3. Einheitskreis — Standardform: Mittelpunkt (0,0), Radius 1
  if (document.getElementById('chk-unitcircle').checked) {

    // Gestrichelter Einheitskreis bei (0,0) mit Radius 1
    body += `  \\addplot[gray!60, thick, dashed, domain=0:6.28319, samples=200]\n`;
    body += `    ({cos(deg(\\x))}, {sin(deg(\\x))});\n`;

    // Standard-Winkelmarkierungen: kleine Punkte + Winkel-Labels
    const stdAngles = [0, PI/6, PI/4, PI/3, PI/2, 2*PI/3, 3*PI/4, 5*PI/6,
                       PI, 7*PI/6, 5*PI/4, 4*PI/3, 3*PI/2, 5*PI/3, 7*PI/4, 11*PI/6];
    const stdCoordList = stdAngles.map(a => {
      const cA = Math.cos(a), sA = Math.sin(a);
      if (cA < xminF-0.3 || cA > xmaxF+0.3 || sA < yminF-0.3 || sA > ymaxF+0.3) return null;
      return `(${coord(cA)},${coord(sA)})`;
    }).filter(Boolean);
    if (stdCoordList.length)
      body += `  \\addplot[gray!50, only marks, mark=*, mark size=1pt] coordinates {${stdCoordList.join(' ')}};\n`;

    // Winkel-Labels
    stdAngles.forEach(a => {
      const cA = Math.cos(a), sA = Math.sin(a);
      if (cA < xminF-0.3 || cA > xmaxF+0.3 || sA < yminF-0.3 || sA > ymaxF+0.3) return;
      const pf2 = asPiFraction(a);
      const lbl = (pf2 && usePiMode()) ? latexNum(a) : `${Math.round(a*180/PI)}^{\\circ}`;
      const anc = cA >= 0 ? 'west' : 'east';
      body += `  \\node[anchor=${anc}, font=\\tiny, gray!70] at (axis cs:${coord(cA)},${coord(sA)}) {$${lbl}$};\n`;
    });

    // Nutzerdefinierte Punkte auf dem Einheitskreis (Koordinaten auf Standardkreis bei 0,0)
    unitCirclePts.forEach((ucp) => {
      const a = ucp.angle;
      const cosA = Math.cos(a), sinA = Math.sin(a);
      // Standardkreis: Punkt liegt bei (cos(a), sin(a))
      const cpxs = coord(cosA), cpys = coord(sinA);

      // 1. Radiallinie: Ursprung (0,0) → Kreispunkt
      body += `  \\addplot[blue!60, thick] coordinates {(0,0) (${cpxs},${cpys})};\n`;

      // 2. Vertikale Projektionslinie (sin): (cos(a),0) → Kreispunkt, orange gestrichelt
      body += `  \\addplot[orange!60, thin, dashed] coordinates {(${cpxs},0) (${cpxs},${cpys})};\n`;

      // 3. Horizontale Projektionslinie (cos): (0,sin(a)) → Kreispunkt, grün gestrichelt
      body += `  \\addplot[green!60!black!60, thin, dashed] coordinates {(0,${cpys}) (${cpxs},${cpys})};\n`;

      // 4. Kreispunkt: gefüllter blauer Punkt
      body += `  \\addplot[blue, only marks, mark=*, mark size=4pt] coordinates {(${cpxs},${cpys})};\n`;
      body += `  \\addplot[white, only marks, mark=o, mark size=3pt, line width=1.5pt] coordinates {(${cpxs},${cpys})};\n`;

      // 5. Labels: Winkel (blau, fett), cos= und sin=
      const pf = asPiFraction(a);
      const angleTxt = (pf && usePiMode()) ? latexNum(a) : `${parseFloat((a*180/PI).toFixed(1))}^{\\circ}`;
      const lblAnc = cosA >= 0 ? 'south west' : 'south east';
      const numAnc = cosA >= 0 ? 'north west' : 'north east';
      body += `  \\node[anchor=${lblAnc}, font=\\scriptsize\\bfseries, blue!80] at (axis cs:${cpxs},${cpys}) {$${angleTxt}$};\n`;
      body += `  \\node[anchor=${numAnc}, font=\\tiny, green!60!black] at (axis cs:${cpxs},${cpys}) {$\\cos=${latexNum(cosA)}$};\n`;
      body += `  \\node[anchor=${numAnc}, font=\\tiny, orange!80, yshift=-8pt] at (axis cs:${cpxs},${cpys}) {$\\sin=${latexNum(sinA)}$};\n`;

      // 5b. Tangenskonstruktion (klassisch): verlängerte Gerade Ursprung→
      // Kreispunkt schneidet die Tangente x=1 exakt bei y=tan(a) — nur wenn
      // eine sichtbare tan-artige Funktion existiert (siehe drawUnitCircle()
      // in 08_draw.js für dieselbe Formel/Begründung).
      const hasVisibleTanLtx = functions.some(fn => {
        if (!fn.expr.trim() || fn.visible === false) return false;
        const e = fn.expr.trim();
        return /\btan\s*\(/.test(e) && !/\bsin\s*\(/.test(e) && !/\bcos\s*\(/.test(e);
      });
      if (hasVisibleTanLtx && Math.abs(cosA) > 1e-6) {
        const tanA = sinA / cosA;
        body += `  \\addplot[violet!70, thin] coordinates {(${cpxs},${cpys}) (1,${coord(tanA)})};\n`;
        body += `  \\addplot[violet!40, thin, dashed] coordinates {(1,0) (1,${coord(tanA)})};\n`;
        body += `  \\addplot[violet, only marks, mark=*, mark size=1.5pt] coordinates {(1,${coord(tanA)})};\n`;
        body += `  \\node[anchor=west, font=\\tiny, violet] at (axis cs:1,${coord(tanA)}) {$\\tan=${latexNum(tanA)}$};\n`;
      }

      // 6. Punkt auf dem Graphen (exakt wie drawUnitCircle() in 08_draw.js):
      // KEINE Verbindungslinie zwischen Kreispunkt und Graphpunkt — der Kreis
      // zeigt sinA/cosA (und, für tan, die Tangentenkonstruktion oben) schon
      // selbst; auf dem Graphen erscheint der Wert unabhängig davon als
      // senkrechter Balken von der x-Achse, wie bei jeder anderen Funktion.
      // x_graph je Typ: sin/tan → a (Fenster 0…2π), cos → a-π/2 (Fenster
      // -π/2…3π/2) — macht cos strukturell identisch zu sin, nur um π/2
      // phasenverschoben (cos(a-π/2)=sin(a)).
      functions.forEach((fn, fi) => {
        if (!fn.expr.trim() || fn.visible === false) return;
        const expr = fn.expr.trim();
        const col = pgfColors[fi % pgfColors.length];
        const hasCos = /\bcos\s*\(/.test(expr) && !/\bsin\s*\(/.test(expr) && !/\btan\s*\(/.test(expr);

        const xG = hasCos ? a - PI/2 : a;
        const yG = safeEval(fn.expr, xG);
        if (!isFinite(yG) || xG < xminF || xG > xmaxF || yG < yminF || yG > ymaxF) return;
        body += `  \\addplot[${col}!60, thin, dashed] coordinates {(${coord(xG)},0) (${coord(xG)},${coord(yG)})};\n`;
        body += `  \\addplot[${col}, only marks, mark=o, mark size=3pt] coordinates {(${coord(xG)},${coord(yG)})};\n`;
        body += `  \\addplot[${col}, only marks, mark=*, mark size=1.5pt] coordinates {(${coord(xG)},${coord(yG)})};\n`;
      });
    });
  }

  // ── Checkbox-Einstellungen für LaTeX-Export ──────────────────────
  const ltxChk = id => document.getElementById(id)?.checked ?? true;
  const ltxKindOk = kind => {
    if (kind === 'zero')  return ltxChk('ltx-zeros');
    if (kind === 'max')   return ltxChk('ltx-max');
    if (kind === 'min')   return ltxChk('ltx-min');
    if (kind === 'inf')   return ltxChk('ltx-inf');
    if (kind === 'isect') return ltxChk('ltx-isect');
    if (kind === 'yaxis') return ltxChk('ltx-yaxis');
    return true;
  };
  const anchorList = ['south west','north west','south east','north east','south','north','west','east'];
  const subMap2 = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'};
  function normLabelLtx(lbl, fallback) {
    if (!lbl) return fallback;
    return lbl
      .replace(/_([₀₁₂₃₄₅₆₇₈₉]+)/g, (_, d) => '_{' + d.split('').map(c => subMap2[c]||c).join('') + '}')
      .replace(/([₀₁₂₃₄₅₆₇₈₉]+)/g, d => '_{' + d.split('').map(c => subMap2[c]||c).join('') + '}');
  }

  // 4a. Sonderpunkte (Nullstellen, Extrema etc.) — nach Checkbox gefiltert
  const spKindSymbol = { zero:'o', max:'triangle', min:'triangle*', inf:'square', isect:'otimes', yaxis:'diamond' };
  const spKindColor  = { zero:'black', max:'red!70!black', min:'blue!70!black', inf:'green!60!black', isect:'violet', yaxis:'orange!80!black' };
  let spNodeIdx = 0;
  specials.forEach(sp => {
    if (!ltxKindOk(sp.kind)) return;
    if (sp.x < xminF || sp.x > xmaxF || sp.y < yminF || sp.y > ymaxF) return;
    const xf = coord(sp.x), yf = coord(sp.y);
    const lx = latexNum(sp.x), ly = latexNum(sp.y);
    const sym = spKindSymbol[sp.kind] || '*';
    const col = spKindColor[sp.kind] || 'black';
    const anc = anchorList[spNodeIdx % anchorList.length];
    spNodeIdx++;
    body += `  \\addplot[${col}, only marks, mark=${sym}, mark size=2pt] coordinates {(${xf},${yf})};\n`;
    body += `  \\node[anchor=${anc}, font=\\tiny, ${col}] at (axis cs:${xf},${yf}) {$\\left(${lx}\\,|\\,${ly}\\right)$};\n`;
  });

  // 4b. Freie Punkte
  if (ltxChk('ltx-freepts')) {
    points.forEach((pt, i) => {
      const xf = coord(pt.x), yf = coord(pt.y);
      const lx = latexNum(pt.x), ly = latexNum(pt.y);
      const ptName = normLabelLtx(pt.label, `P_{${i+1}}`);
      const anc = anchorList[i % anchorList.length];
      body += `  \\addplot[only marks, mark=*, mark size=2.5pt, black] coordinates {(${xf},${yf})};\n`;
      body += `  \\node[anchor=${anc}, font=\\small] at (axis cs:${xf},${yf}) {$${ptName}\\left(${lx}\\,|\\,${ly}\\right)$};\n`;
    });
  }

  // 4c. Graph-Punkte
  if (ltxChk('ltx-graphpts')) {
    graphPoints.forEach((gp, i) => {
      const fn = functions[gp.fi]; if (!fn || fn.visible === false) return;
      const yVal = safeEval(fn.expr, gp.x); if (!isFinite(yVal)) return;
      const xf = coord(gp.x), yf = coord(yVal);
      const lx = latexNum(gp.x), ly = latexNum(yVal);
      const col = pgfColors[gp.fi % pgfColors.length];
      const anc = anchorList[(points.length + i) % anchorList.length];
      body += `  \\addplot[only marks, mark=o, mark size=3pt, ${col}] coordinates {(${xf},${yf})};\n`;
      body += `  \\node[anchor=${anc}, font=\\small, ${col}] at (axis cs:${xf},${yf}) {\\textcolor{${col}}{$\\left(${lx}\\,|\\,${ly}\\right)$}};\n`;
    });
  }

  // ── Steigungsdreieck im LaTeX ─────────────────────────────────────
  if (document.getElementById('chk-slopetri').checked) {
    const v2 = isoView || view;
    functions.forEach((fn, fi) => {
      if (!fn.expr.trim() || fn.visible === false || !isLinearFunc(fn.expr)) return;
      const slope = deriv1(fn.expr, 0); if (!isFinite(slope)) return;
      const col = pgfColors[fi % pgfColors.length];
      let xA, xB;
      const customPts = slopeTriPtsMap[fi];
      if (customPts && customPts.length === 2) {
        xA = Math.min(customPts[0].x, customPts[1].x);
        xB = Math.max(customPts[0].x, customPts[1].x);
      } else {
        xA = xminF + (xmaxF - xminF) * 0.15;
        xB = xA + 1;
      }
      const yA = safeEval(fn.expr, xA), yB = safeEval(fn.expr, xB);
      if (!isFinite(yA) || !isFinite(yB)) return;
      const dx = xB - xA, dy = yB - yA;
      // Dreieck: Ecken (xA,yA) → (xB,yA) → (xB,yB)
      const xAf = coord(xA), yAf = coord(yA), xBf = coord(xB), yBf = coord(yB);
      body += `  % Steigungsdreieck f${fi+1}\n`;
      body += `  \\addplot[${col}, dashed, thick] coordinates {(${xAf},${yAf}) (${xBf},${yAf}) (${xBf},${yBf})};\n`;
      // Label Δx
      const dxMid = coord((xA + xB) / 2);
      const dxStr = latexNum(dx);
      body += `  \\node[anchor=north, font=\\tiny, ${col}] at (axis cs:${dxMid},${yAf}) {$\\Delta x=${dxStr}$};\n`;
      // Label Δy und m: WICHTIG — Δy (=yB-yA) und m (=Steigung=dy/dx) sind nur
      // dann derselbe Zahlenwert, wenn Δx=1 ist (der Default ohne selbst
      // gewähltes Dreieck). Sobald der Nutzer das Steigungsdreieck im Canvas
      // verschoben/vergrössert hat (slopeTriPtsMap, siehe oben), ist Δx meist
      // ≠1 — die vorherige Version zeigte hier EINEN einzigen Knoten
      // "$\Delta y = m = ${slopeLatex}$", der fälschlich den STEIGUNGS-Wert
      // auch als "Δy" auswies, obwohl Δy=dy und m=dy/dx dann verschiedene
      // Zahlen sind (z.B. Δx=2, Δy=6, m=3 → die alte Ausgabe hätte fälschlich
      // "Δy = m = 3" gezeigt statt Δy=6). Fix: zwei getrennte Labels, exakt
      // wie drawSlopeTri()/ctxFracVal()+ctxSlopeLabel() (08_draw.js) auf dem
      // Canvas ebenfalls zwei getrennte Werte anzeigen (unterer Wert = Δy,
      // oberer Wert = m).
      const dyMid = coord((yA + yB) / 2);
      const dyStr = latexNum(dy);
      const slopeLatex = latexNum(slope);
      body += `  \\node[anchor=west, font=\\tiny, ${col}, yshift=-7pt] at (axis cs:${xBf},${dyMid}) {$\\Delta y=${dyStr}$};\n`;
      body += `  \\node[anchor=west, font=\\tiny, ${col}, yshift=7pt] at (axis cs:${xBf},${dyMid}) {$m=${slopeLatex}$};\n`;
      // Eckpunkte mit Koordinaten-Label — exakt wie drawTriBetween() (08_draw.js),
      // das an BEIDEN Dreiecksecken (xLeft|yLeft) und (xRight|yRight) einen
      // Koordinaten-Punkt beschriftet; im bisherigen Export fehlten diese ganz.
      const xAStr = latexNum(xA), yAStr = latexNum(yA), xBStr = latexNum(xB), yBStr = latexNum(yB);
      body += `  \\addplot[${col}, only marks, mark=*, mark size=2pt] coordinates {(${xAf},${yAf}) (${xBf},${yBf})};\n`;
      body += `  \\node[anchor=south east, font=\\tiny, ${col}] at (axis cs:${xAf},${yAf}) {$\\left(${xAStr}\\,|\\,${yAStr}\\right)$};\n`;
      body += `  \\node[anchor=south west, font=\\tiny, ${col}] at (axis cs:${xBf},${yBf}) {$\\left(${xBStr}\\,|\\,${yBStr}\\right)$};\n`;
    });
  }

  // ── Differenzenquotient-Applet im LaTeX ───────────────────────────
  // Baut drawDiffQuot() (08_draw.js) nach: Sekante durch A/B (+ Tangente in A,
  // falls A und B nahe genug beieinander liegen), Steigungsdreieck mit
  // Katheten-Beschriftung, Punkte A/B mit Koordinaten-Label — bisher
  // komplett im Export gefehlt (gleiche Kategorie Lücke wie beim Ober-/
  // Untersummen-Applet oben: nur die zugrundeliegende Funktion selbst wurde
  // automatisch mitexportiert, nicht die Konstruktion). Sekante und Dreieck
  // bewusst in neutralem Schwarz statt Funktionsfarbe — gleiche Konvention
  // wie dqConstrColor() auf dem Canvas; Punkte A/B bleiben in der
  // Funktionsfarbe (Nutzerwunsch, siehe drawDiffQuot()).
  if (typeof diffQuot !== 'undefined' && diffQuot) {
    const dFn = functions[diffQuot.fi];
    if (dFn && dFn.visible !== false) {
      const dxA = diffQuot.xA, dxB = diffQuot.xB;
      const dyA = safeEval(dFn.expr, dxA), dyB = safeEval(dFn.expr, dxB);
      if (isFinite(dyA) && isFinite(dyB)) {
        const dCol = pgfColors[diffQuot.fi % pgfColors.length];
        const dIsCoincident = Math.abs(dxB - dxA) < 1e-9;
        const dDerivA = deriv1(dFn.expr, dxA);
        const dM = dIsCoincident ? dDerivA : (dyB - dyA) / (dxB - dxA);
        body += `  % Differenzenquotient-Applet\n`;
        // Sekante über den gesamten sichtbaren Bereich
        const secY0 = dyA + dM * (xminF - dxA), secY1 = dyA + dM * (xmaxF - dxA);
        body += `  \\addplot[black, thick] coordinates {(${coord(xminF)},${coord(secY0)}) (${coord(xmaxF)},${coord(secY1)})};\n`;
        // Tangente in A: nur wenn A/B nahe beieinander (wie DIFFQUOT_NEAR_H
        // auf dem Canvas) UND nicht exakt zusammenfallend (dann ist die
        // Sekante oben bereits identisch mit der Tangente).
        const _NEAR_H = (typeof DIFFQUOT_NEAR_H !== 'undefined') ? DIFFQUOT_NEAR_H : 0.25;
        if (!dIsCoincident && Math.abs(dxB - dxA) < _NEAR_H) {
          const tanY0 = dyA + dDerivA * (xminF - dxA), tanY1 = dyA + dDerivA * (xmaxF - dxA);
          body += `  \\addplot[violet, thin, dashed] coordinates {(${coord(xminF)},${coord(tanY0)}) (${coord(xmaxF)},${coord(tanY1)})};\n`;
        }
        // Steigungsdreieck mit Katheten-Beschriftung (nur wenn A≠B — bei
        // Koinzidenz gäbe es kein sichtbares Dreieck)
        const dxLeft = Math.min(dxA, dxB), dxRight = Math.max(dxA, dxB);
        const dyLeft = safeEval(dFn.expr, dxLeft), dyRight = safeEval(dFn.expr, dxRight);
        if (!dIsCoincident && isFinite(dyLeft) && isFinite(dyRight)) {
          body += `  \\addplot[black, dashed, thick] coordinates {(${coord(dxLeft)},${coord(dyLeft)}) (${coord(dxRight)},${coord(dyLeft)}) (${coord(dxRight)},${coord(dyRight)})};\n`;
          const legHLtx = Math.abs(dxRight - dxLeft), legVLtx = Math.abs(dyRight - dyLeft);
          if (legHLtx > 1e-9) {
            body += `  \\node[anchor=north, font=\\tiny] at (axis cs:${coord((dxLeft + dxRight) / 2)},${coord(dyLeft)}) {$${latexNum(legHLtx)}$};\n`;
          }
          if (legVLtx > 1e-9) {
            body += `  \\node[anchor=west, font=\\tiny] at (axis cs:${coord(dxRight)},${coord((dyLeft + dyRight) / 2)}) {$${latexNum(legVLtx)}$};\n`;
          }
        }
        // Punkte A und B in Funktionsfarbe (wie auf dem Canvas)
        if (dIsCoincident) {
          body += `  \\addplot[${dCol}, fill=white, only marks, mark=*, mark size=3pt] coordinates {(${coord(dxA)},${coord(dyA)})};\n`;
          body += `  \\node[anchor=south west, font=\\small, ${dCol}] at (axis cs:${coord(dxA)},${coord(dyA)}) {$A=B\\left(${latexNum(dxA)}\\,|\\,${latexNum(dyA)}\\right)$};\n`;
        } else {
          body += `  \\addplot[${dCol}, fill=white, only marks, mark=*, mark size=3pt] coordinates {(${coord(dxA)},${coord(dyA)}) (${coord(dxB)},${coord(dyB)})};\n`;
          body += `  \\node[anchor=south east, font=\\small, ${dCol}] at (axis cs:${coord(dxA)},${coord(dyA)}) {$A\\left(${latexNum(dxA)}\\,|\\,${latexNum(dyA)}\\right)$};\n`;
          body += `  \\node[anchor=north west, font=\\small, ${dCol}] at (axis cs:${coord(dxB)},${coord(dyB)}) {$B\\left(${latexNum(dxB)}\\,|\\,${latexNum(dyB)}\\right)$};\n`;
        }
      }
    }
  }

  // ── Preamble ─────────────────────────────────────────────────────
  const axisLines = [];
  axisLines.push(`  xmin=${xminF}, xmax=${xmaxF}, ymin=${yminF}, ymax=${ymaxF},`);
  axisLines.push('  axis lines=middle,');
  axisLines.push('  xlabel=$x$, ylabel=$y$,');
  // Achsenbeschriftung: Position von y=0 und x=0 im Bildbereich [0,1] berechnen
  // (nicht hardcodiert auf 0.55, da bei asymmetrischem View die Achse nicht in der Mitte liegt)
  const _xAxisFrac = Math.max(0.03, Math.min(0.97, (0 - yminF) / (ymaxF - yminF)));
  const _yAxisFrac = Math.max(0.03, Math.min(0.97, (0 - xminF) / (xmaxF - xminF)));
  axisLines.push(`  every axis x label/.style={at={(axis description cs:0.975,${_xAxisFrac.toFixed(3)})},anchor=north},`);
  axisLines.push(`  every axis y label/.style={at={(axis description cs:${_yAxisFrac.toFixed(3)},0.975)},anchor=east},`);
  axisLines.push('  grid=both,');
  const _ltxFont = _ltxS('ltx-tickfont') || '\\footnotesize';
  const _ltxScale = (_ltxV('ltx-scale') ?? 1.0);
  const _xCmS = (parseFloat(xCm)*_ltxScale).toFixed(2);
  const _yCmS = (parseFloat(yCm)*_ltxScale).toFixed(2);
  axisLines.push(`  xticklabel style={font=${_ltxFont}},`);
  axisLines.push(`  yticklabel style={font=${_ltxFont}},`);
  axisLines.push(`  x=${_xCmS}cm, y=${_yCmS}cm,`);
  if (xtickStr) {
    axisLines.push(xtickStr);
    axisLines.push(xticklabelStr);
  } else {
    axisLines.push(`  xtick=${niceTickStr(xTickMin, xTickMax, xGS)},`);
    axisLines.push(`  ytick=${niceTickStr(yTickMin, yTickMax, yGS)},`);
  }
  axisLines.push('  scaled y ticks=false,');
  if (hasTrig()) axisLines.push('  trig format plots=rad,');

  const preamble = '';

  const out = [
    '% Preamble: \\usepgfplotslibrary{fillbetween}  (für Fläche zwischen Funktionen)',
    '\\begin{tikzpicture}',
    '\\begin{axis}[',
    axisLines.map(l => l).join('\n'),
    ']',
    body,
    '\\end{axis}',
    '\\end{tikzpicture}'
  ].join('\n');

  document.getElementById('latex-out').value = out;
}

function copyLatex() {
  const ta = document.getElementById('latex-out'); if (!ta.value) generateLatex();
  navigator.clipboard.writeText(ta.value).then(() => {
    const m = document.getElementById('latex-msg'); m.textContent = t('msg_copied'); setTimeout(() => m.textContent = '', 2500);
  }).catch(() => { ta.select(); document.execCommand('copy'); });
}

