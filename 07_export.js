// ═══════════════════════════════════════════════════════════════════
// MODUL: export — JPEG-Export & LaTeX-Export
// Enthält:  exportJPEG(), generateLatex(), copyLatex()
//           exprToPgf(), exprToMath() (Ausdrucks-Konverter)
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
// Zwei separate Konverter:
//   exprToPgf(expr)   → pgfplots-Ausdruck für \addplot{...}
//                       Sprache: gnuplot-ähnlich, Variable = \x
//                       Operatoren: * / + - ^ ( )
//                       Funktionen: sin, cos, tan, sqrt, ln, exp, abs, log10
//   exprToMath(expr)  → LaTeX-Math für $...$ (Legende, Beschriftungen)
//                       Sprache: echtes LaTeX-Math
// ═══════════════════════════════════════════════════════════════════

// Hilfs-Tokenizer: wandelt JS-Ausdruck in Token-Liste um
// Token: { type: 'num'|'var'|'op'|'fn'|'lp'|'rp'|'comma', val }
function tokenize(expr) {
  const tokens = [];
  let i = 0, s = expr.trim().replace(/\^/g, '**').replace(/\bEC\b/g, 'EC');
  while (i < s.length) {
    if (/\s/.test(s[i])) { i++; continue; }
    // Zahl
    if (/[\d.]/.test(s[i])) {
      let j = i; while (j < s.length && /[\d.eE+\-]/.test(s[j]) && !(j > i && /[eE]/.test(s[j-1]) === false && /[+\-]/.test(s[j]))) j++;
      // Einfacherer Ansatz
      let num = '';
      if (/\d/.test(s[i]) || s[i] === '.') {
        while (i < s.length && /[\d.]/.test(s[i])) num += s[i++];
        if (i < s.length && /[eE]/.test(s[i])) {
          num += s[i++];
          if (i < s.length && /[+\-]/.test(s[i])) num += s[i++];
          while (i < s.length && /\d/.test(s[i])) num += s[i++];
        }
        tokens.push({ type:'num', val: num }); continue;
      }
    }
    // Bezeichner (Funktion oder Variable)
    if (/[a-zA-Z_]/.test(s[i])) {
      let name = '';
      while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) name += s[i++];
      // Prüfe ob Funktionsaufruf (nächstes nicht-Whitespace ist '(')
      let k = i; while (k < s.length && /\s/.test(s[k])) k++;
      if (s[k] === '(') tokens.push({ type:'fn', val: name });
      else tokens.push({ type:'var', val: name });
      continue;
    }
    if (s[i] === '(') { tokens.push({ type:'lp', val:'(' }); i++; continue; }
    if (s[i] === ')') { tokens.push({ type:'rp', val:')' }); i++; continue; }
    if (s[i] === ',') { tokens.push({ type:'comma', val:',' }); i++; continue; }
    // Operator ** zuerst
    if (s.slice(i, i+2) === '**') { tokens.push({ type:'op', val:'**' }); i+=2; continue; }
    if ('+-*/'.includes(s[i])) { tokens.push({ type:'op', val:s[i] }); i++; continue; }
    i++; // unbekannt überspringen
  }
  return tokens;
}

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

  // Schritt 2: x → \x (nur alleinstehende x-Variable, nicht in Funktionsnamen)
  s = s.replace(/\bx\b/g, '\\x');

  // Schritt 3: ** → ^ (pgfplots Potenz)
  s = s.replace(/\*\*/g, '^');

  // Schritt 4: Implizite Multiplikation mit \x entfernen wenn nötig:
  // pgfplots braucht explizites * z.B. 2*\x nicht 2\x
  // (bereits in JS-Ausdruck vorhanden)

  return s;
}

// Konvertiert JS-Ausdruck → LaTeX-Math-String für $...$-Umgebung
// Gibt lesbares LaTeX zurück: \sin(x), \frac{...}{...}, x^{2} etc.
function exprToMath(expr) {
  let s = expr.trim();

  // Reihenfolge wichtig: zuerst längere Patterns
  // nthroot(x,n) → \sqrt[n]{x}
  s = s.replace(/nthroot\(([^,]+),\s*([^)]+)\)/g, '\\sqrt[$2]{$1}');
  // logn(x,b) → \log_{b}(x)
  s = s.replace(/logn\(([^,]+),\s*([^)]+)\)/g, '\\log_{$2}($1)');
  // log10(x) → \log_{10}(x)
  s = s.replace(/log10\(([^)]+)\)/g, '\\log_{10}($1)');
  // sqrt(x) → \sqrt{x}
  s = s.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
  // abs(x) → |x|
  s = s.replace(/abs\(([^)]+)\)/g, '|$1|');
  // log(x) → \ln(x)
  s = s.replace(/\blog\(/g, '\\ln(');
  // exp(x) → e^{x}
  s = s.replace(/exp\(([^)]+)\)/g, 'e^{$1}');
  // Trig-Funktionen
  s = s.replace(/\bsin\(/g, '\\sin(');
  s = s.replace(/\bcos\(/g, '\\cos(');
  s = s.replace(/\btan\(/g, '\\tan(');
  // EC → e
  s = s.replace(/\bEC\b/g, 'e');
  // pi → \pi
  s = s.replace(/\bpi\b/g, '\\pi');
  // Potenz ^ → ^{...} (nur für einfache Fälle, Zahlen und einfache Buchstaben)
  s = s.replace(/\^(-?\d+)/g, '^{$1}');
  s = s.replace(/\*\*/g, '^');
  s = s.replace(/\^(-?\d+)/g, '^{$1}');
  // Multiplikation: * → \cdot (aber ** bereits ersetzt)
  s = s.replace(/\*/g, '\\cdot ');

  // Brüche: (Zähler)/(Nenner) → \frac{Zähler}{Nenner}
  // Iterativ von innen nach außen (für verschachtelte Brüche)
  let prev;
  do {
    prev = s;
    s = s.replace(/\(([^()]*)\)\/\(([^()]*)\)/g, '\\frac{$1}{$2}');
  } while (s !== prev);

  // Runde Klammern: (...) → \left(...\right) damit sie sich bei \frac vergrössern
  // Iterativ von innen nach außen (vermeidet Konflikte mit verschachtelten Klammern)
  do {
    prev = s;
    s = s.replace(/\(([^()]*)\)/g, '\\left($1\\right)');
  } while (s !== prev);

  return s;
}

// Konvertiert JS-Ausdruck → HTML für Inline-Vorschau (Brüche, Exponenten, π).
// Wird für die Formel-Vorschau unter den Funktionseingabefeldern verwendet.
function exprToHtml(expr) {
  if (!expr) return '';
  let s = expr.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  // Einfache Zahlbrüche in Klammern: (-?Zahl/Zahl) → gestapelter Bruch
  // z.B. (1/4)*x → ¼·x,  (-2/3)*x → -⅔·x
  s = s.replace(/\((-?\d+)\/(\d+)\)/g,
    '<span class="preview-frac"><span class="pf-num">$1</span><span class="pf-den">$2</span></span>');
  // Brüche iterativ von innen nach außen: (a)/(b) → gestapelter Bruch
  let prev;
  do {
    prev = s;
    s = s.replace(/\(([^()]*)\)\/\(([^()]*)\)/g,
      '<span class="preview-frac"><span class="pf-num">$1</span><span class="pf-den">$2</span></span>');
  } while (s !== prev);
  // Hochgestellte Exponenten: ^{n}, ^(n+1) oder ^n
  s = s.replace(/\^(\{[^}]*\}|\([^)]*\)|[^\s+\-*·()^<]+)/g, (_, m) => {
    const inner = m.startsWith('{') ? m.slice(1,-1) : m.startsWith('(') ? m.slice(1,-1) : m;
    return `<sup class="preview-sup">${inner}</sup>`;
  });
  // Symbole verschönern: * → ·, pi → π, EC → e
  // Multiplikation direkt nach einem Bruch: ·x statt ·x (Leerzeichen entfernen)
  s = s.replace(/\*/g, '·').replace(/\bpi\b/g, 'π').replace(/\bEC\b/g, 'e');
  // Leerzeichen zwischen Bruch und Variable entfernen: </span>·x → </span>x
  s = s.replace(/(span>)\s*·\s*([a-zA-Z])/g, '$1$2');
  return s;
}

// Gibt true zurück wenn ein Ausdruck eine Vorschau lohnt (Bruch oder Potenz enthält).
function exprNeedsPreview(expr) {
  return /\([^()]*\)\/\([^()]*\)/.test(expr) || /\^/.test(expr)
    || /\(-?\d+\/\d+\)/.test(expr); // einfache Zahlbrüche wie (1/4)
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
function setAreaFromIsects() {
  const f1v = document.getElementById('area-f1').value;
  const f2v = document.getElementById('area-f2').value;
  const f1idx = f1v === '__axis' ? -1 : parseInt(f1v);
  const f2idx = f2v === '__axis' ? -1 : parseInt(f2v);
  const xs = specials
    .filter(sp => sp.kind === 'isect' &&
      ((sp.fi === f1idx && sp.fj === f2idx) || (sp.fi === f2idx && sp.fj === f1idx)))
    .map(sp => sp.x).sort((a, b) => a - b);
  if (xs.length === 0 && (f2v === '__axis' || f1v === '__axis')) {
    const fIdx = f2v === '__axis' ? f1idx : f2idx;
    specials.filter(sp => sp.kind === 'zero' && sp.fi === fIdx).forEach(sp => xs.push(sp.x));
    xs.sort((a, b) => a - b);
  }
  if (xs.length === 0) {
    const msgEl = document.getElementById('area-result');
    msgEl.innerHTML = '<span style="color:#e24b4a;">Keine Schnittpunkte gefunden</span>';
    setTimeout(() => { msgEl.innerHTML = ''; }, 2500);
    return;
  }
  document.getElementById('area-x1').value = parseFloat(xs[0].toFixed(4));
  document.getElementById('area-x2').value = parseFloat(xs[xs.length - 1].toFixed(4));
  if (showArea) updateAreaResult();
  scheduleDraw();
}

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

// Konvertiert JS-Ausdruck → LaTeX-Mathematik (für Beschriftungen, nicht für \addplot)
function exprToLatex(expr) {
  let s = expr.trim();
  // Ersetze Brüche im Stil (a/b) → \frac{a}{b}
  s = s.replace(/\((-?\d+)\/(\d+)\)\*/g, '\\frac{$1}{$2}');
  s = s.replace(/\((-?\d+)\/(\d+)\)/g, '\\frac{$1}{$2}');
  s = s.replace(/(-?\d+)\/(\d+)\*/g, '\\frac{$1}{$2}');
  // Koeffizienten: (n)* → n
  s = s.replace(/\((-?\d+)\)\*/g, '$1');
  // sqrt(x) → \sqrt{x}
  s = s.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
  // nthroot(x,n) → \sqrt[n]{x}
  s = s.replace(/nthroot\(([^,]+),\s*([^)]+)\)/g, '\\sqrt[$2]{$1}');
  // log( → \ln(
  s = s.replace(/\blog\(/g, '\\ln(');
  s = s.replace(/log10\(/g, '\\log_{10}(');
  // abs( → |
  s = s.replace(/abs\(([^)]+)\)/g, '|$1|');
  // EC → e
  s = s.replace(/\bEC\b/g, 'e');
  // x^2 → x^{2}, x^(n) → x^{n}
  s = s.replace(/x\^(\d+)/g, 'x^{$1}');
  s = s.replace(/x\^\(([^)]+)\)/g, 'x^{$1}');
  // * → \cdot (but not before \x or after \)
  s = s.replace(/\*/g, '\\cdot ');
  // x as variable
  s = s.replace(/\bx\b/g, 'x');
  // Remove outer parens around simple expressions
  s = s.replace(/^\(([^()]+)\)$/, '$1');
  return s;
}

function generateLatex() {
  const v = isoView || view;
  // Grenzen auf ganze Zahlen runden
  const xminF = roundViewBound(v.xmin), xmaxF = roundViewBound(v.xmax);
  const yminF = roundViewBound(v.ymin), ymaxF = roundViewBound(v.ymax);
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
  const xCm = cmPerUnit(xRange).toFixed(1);
  const yCm = cmPerUnit(yRange).toFixed(1);

  // ── Tick-Berechnung ───────────────────────────────────────────────
  const xGS = gridStep(xRange), yGS = gridStep(yRange);
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
          // Pol per Bisektion verfeinern
          let lo2 = prevX, hi2 = x;
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

  // Zahl → LaTeX-Math (π-Brüche für Labels, reine Dezimalzahl für Koordinaten)
  function latexNum(val) {
    if (!isFinite(val)) return '?';
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

  // 1. Funktionsgraphen (mit Pol-Erkennung: Domäne aufteilen)
  // WICHTIG: name path muss VOR fill-between definiert werden!
  functions.forEach((fn, i) => {
    if (!fn.expr.trim() || fn.visible === false) return;
    // Ausdruck überspringen wenn er nirgends endlich ist (z.B. unvollständige Brüche wie "()/()")
    const testVals = [0, 1, -1, 2, -2].map(xv => safeEval(fn.expr, xv));
    if (testVals.every(v => !isFinite(v))) return;
    const col = pgfColors[i % pgfColors.length];
    const pgfExpr = exprToPgf(fn.expr);
    const doms = getDomains(fn.expr, xminF, xmaxF);
    doms.forEach(([dlo, dhi]) => {
      body += `  \\addplot[${col}, thick, name path=F${i}, domain=${fmtDom(dlo)}:${fmtDom(dhi)}, samples=100] {${pgfExpr}};\n`;
    });
  });

  // 2. Fläche zwischen Funktionen (NACH den name path Plots, damit fill-between funktioniert)
  if (showArea) {
    const f1v = document.getElementById('area-f1').value;
    const f2v = document.getElementById('area-f2').value;
    const ax1 = parseFloat(document.getElementById('area-x1').value);
    const ax2 = parseFloat(document.getElementById('area-x2').value);
    if (isFinite(ax1) && isFinite(ax2) && ax1 < ax2) {
      const e1 = getAreaExpr(f1v), e2 = getAreaExpr(f2v);
      const fillCol = f1v !== '__axis' ? pgfColors[parseInt(f1v) % pgfColors.length] : 'blue';
      const d1c = coord(ax1), d2c = coord(ax2);
      if (e2 === '0') {
        // Fläche zur x-Achse
        body += `  % Fläche unter f(x) zur x-Achse\n`;
        body += `  \\addplot[${fillCol}!30, fill opacity=0.5, draw=none, domain=${d1c}:${d2c}, samples=120] {${exprToPgf(e1)}} \\closedcycle;\n`;
      } else {
        // Fläche zwischen zwei Funktionen (benötigt \usepgfplotslibrary{fillbetween})
        const fi1 = f1v === '__axis' ? -1 : parseInt(f1v);
        const fi2 = f2v === '__axis' ? -1 : parseInt(f2v);
        const np1 = fi1 >= 0 ? `F${fi1}` : 'xaxis';
        const np2 = fi2 >= 0 ? `F${fi2}` : 'xaxis';
        body += `  % Fläche zwischen f${fi1+1} und f${fi2+1}\n`;
        body += `  \\addplot[${fillCol}!30, fill opacity=0.5, draw=none]\n`;
        body += `    fill between[of=${np1} and ${np2}, soft clip={domain=${d1c}:${d2c}}];\n`;
      }
    }
  }

  // 2b. Asymptoten (wenn "Asymptoten anzeigen" aktiv)
  if (document.getElementById('chk-asymptotes').checked) {
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
      const tanA = Math.abs(cosA) > 0.01 ? sinA/cosA : null;

      // 1. Radiallinie: Ursprung (0,0) → Kreispunkt
      body += `  \\addplot[blue!60, thick] coordinates {(0,0) (${cpxs},${cpys})};\n`;

      // 2. Vertikale Projektionslinie (sin): (cos(a),0) → Kreispunkt, orange gestrichelt
      body += `  \\addplot[orange!60, thin, dashed] coordinates {(${cpxs},0) (${cpxs},${cpys})};\n`;

      // 3. Horizontale Projektionslinie (cos): (0,sin(a)) → Kreispunkt, grün gestrichelt
      body += `  \\addplot[green!60!black!60, thin, dashed] coordinates {(0,${cpys}) (${cpxs},${cpys})};\n`;

      // 4. sin-Marker auf y-Achse bei (0, sinA): oranger Punkt
      body += `  \\addplot[orange!80, only marks, mark=*, mark size=2.5pt] coordinates {(0,${coord(sinA)})};\n`;

      // 5. cos-Marker auf x-Achse bei (cosA, 0): grüner Punkt
      body += `  \\addplot[green!60!black, only marks, mark=*, mark size=2.5pt] coordinates {(${coord(cosA)},0)};\n`;

      // 6. Kreispunkt: gefüllter blauer Punkt
      body += `  \\addplot[blue, only marks, mark=*, mark size=4pt] coordinates {(${cpxs},${cpys})};\n`;
      body += `  \\addplot[white, only marks, mark=o, mark size=3pt, line width=1.5pt] coordinates {(${cpxs},${cpys})};\n`;

      // 7. Labels: Winkel (blau, fett), cos= und sin=
      const pf = asPiFraction(a);
      const angleTxt = (pf && usePiMode()) ? latexNum(a) : `${parseFloat((a*180/PI).toFixed(1))}^{\\circ}`;
      const lblAnc = cosA >= 0 ? 'south west' : 'south east';
      const numAnc = cosA >= 0 ? 'north west' : 'north east';
      body += `  \\node[anchor=${lblAnc}, font=\\scriptsize\\bfseries, blue!80] at (axis cs:${cpxs},${cpys}) {$${angleTxt}$};\n`;
      body += `  \\node[anchor=${numAnc}, font=\\tiny, green!60!black] at (axis cs:${cpxs},${cpys}) {$\\cos=${latexNum(cosA)}$};\n`;
      body += `  \\node[anchor=${numAnc}, font=\\tiny, orange!80, yshift=-8pt] at (axis cs:${cpxs},${cpys}) {$\\sin=${latexNum(sinA)}$};\n`;

      // 8. Verbindungslinien zu Graphen (exakt wie drawUnitCircle)
      functions.forEach((fn, fi) => {
        if (!fn.expr.trim() || fn.visible === false) return;
        const expr = fn.expr.trim();
        const col = pgfColors[fi % pgfColors.length];
        const hasSin = /\bsin\s*\(/.test(expr) && !/\bcos\s*\(/.test(expr) && !/\btan\s*\(/.test(expr);
        const hasCos = /\bcos\s*\(/.test(expr) && !/\bsin\s*\(/.test(expr) && !/\btan\s*\(/.test(expr);
        const hasTan = /\btan\s*\(/.test(expr) && !/\bsin\s*\(/.test(expr) && !/\bcos\s*\(/.test(expr);

        if (hasSin) {
          const xG = a, yG = safeEval(fn.expr, xG);
          if (!isFinite(yG) || xG < xminF || xG > xmaxF || yG < yminF || yG > ymaxF) return;
          body += `  \\addplot[${col}!60, thin, dashed] coordinates {(0,${coord(sinA)}) (${coord(xG)},${coord(yG)})};\n`;
          body += `  \\addplot[${col}, only marks, mark=o, mark size=3pt] coordinates {(${coord(xG)},${coord(yG)})};\n`;
          body += `  \\addplot[${col}, only marks, mark=*, mark size=1.5pt] coordinates {(${coord(xG)},${coord(yG)})};\n`;

        } else if (hasCos) {
          const xG = a - PI/2, yG = safeEval(fn.expr, xG);
          if (!isFinite(yG) || xG < xminF || xG > xmaxF || yG < yminF || yG > ymaxF) return;
          body += `  \\addplot[${col}!60, thin, dashed] coordinates {(0,${coord(sinA)}) (${coord(xG)},${coord(yG)})};\n`;
          body += `  \\addplot[${col}, only marks, mark=o, mark size=3pt] coordinates {(${coord(xG)},${coord(yG)})};\n`;
          body += `  \\addplot[${col}, only marks, mark=*, mark size=1.5pt] coordinates {(${coord(xG)},${coord(yG)})};\n`;

        } else if (hasTan && tanA !== null && isFinite(tanA)) {
          const yG = safeEval(fn.expr, a);
          if (!isFinite(tanA) || tanA < yminF || tanA > ymaxF) return;
          // Tangentengerade: Mittelpunkt → Kreispunkt → (0, tanA)
          body += `  \\addplot[${col}!60, thin, dashed] coordinates {(-1,0) (${cpxs},${cpys}) (0,${coord(tanA)})};\n`;
          // Tan-Marker auf y-Achse
          body += `  \\addplot[${col}, only marks, mark=o, mark size=2.5pt] coordinates {(0,${coord(tanA)})};\n`;
          if (isFinite(yG) && a >= xminF && a <= xmaxF && yG >= yminF && yG <= ymaxF) {
            body += `  \\addplot[${col}!60, thin, dashed] coordinates {(0,${coord(tanA)}) (${coord(a)},${coord(yG)})};\n`;
            body += `  \\addplot[${col}, only marks, mark=o, mark size=3pt] coordinates {(${coord(a)},${coord(yG)})};\n`;
            body += `  \\addplot[${col}, only marks, mark=*, mark size=1.5pt] coordinates {(${coord(a)},${coord(yG)})};\n`;
          }
        } else {
          const xG = a, yG = safeEval(fn.expr, xG);
          if (!isFinite(yG) || xG < xminF || xG > xmaxF || yG < yminF || yG > ymaxF) return;
          body += `  \\addplot[${col}!60, thin, dashed] coordinates {(${coord(xG)},0) (${coord(xG)},${coord(yG)})};\n`;
          body += `  \\addplot[${col}, only marks, mark=o, mark size=3pt] coordinates {(${coord(xG)},${coord(yG)})};\n`;
          body += `  \\addplot[${col}, only marks, mark=*, mark size=1.5pt] coordinates {(${coord(xG)},${coord(yG)})};\n`;
        }
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
      // Label Δy (= Steigung)
      const dyMid = coord((yA + yB) / 2);
      const slopeLatex = latexNum(slope);
      body += `  \\node[anchor=west, font=\\tiny, ${col}] at (axis cs:${xBf},${dyMid}) {$\\Delta y = m = ${slopeLatex}$};\n`;
    });
  }

  // ── Preamble ─────────────────────────────────────────────────────
  const axisLines = [];
  axisLines.push(`  xmin=${xminF}, xmax=${xmaxF}, ymin=${yminF}, ymax=${ymaxF},`);
  axisLines.push('  axis lines=middle,');
  axisLines.push('  xlabel=$x$, ylabel=$y$,');
  axisLines.push('  every axis x label/.style={at={(axis description cs:0.975,0.55)},anchor=north},');
  axisLines.push('  every axis y label/.style={at={(axis description cs:0.55,0.95)},anchor=east},');
  axisLines.push('  grid=both,');
  axisLines.push('  xticklabel style={font=\\tiny},');
  axisLines.push('  yticklabel style={font=\\tiny},');
  axisLines.push(`  x=${xCm}cm, y=${yCm}cm,`);
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
    '\\begin{tikzpicture}[scale=1.1]',
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

