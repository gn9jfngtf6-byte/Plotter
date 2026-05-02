// ═══════════════════════════════════════════════════════════════════
// MODUL: math — Zahlenformat, Tastatur, safeEval, Ableitungen, Parameter
// Enthält:  niceNum(), safeEval(), derivative(), syncParams()
//           kbdInsert(), kbdFrac()
// Ändern:  Neue Funktion → in safeEval-Whitelist + RESERVED ergänzen
//           Neue Taste   → kbdInsert()-Aufruf im HTML + hier eintragen
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// ZAHLENFORMATIERUNG (π-Notation, Nachkommastellen)
// ═══════════════════════════════════════════════════════════════════

// CSS für mathematische Brüche (horizontaler Bruchstrich) ins DOM injizieren
(function injectFracCSS() {
  const s = document.createElement('style');
  s.textContent = `
    .mfrac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 2px;line-height:1.2;}
    .mfrac .mfrac-num{border-bottom:1px solid currentColor;padding:0 3px 1px;text-align:center;min-width:8px;}
    .mfrac .mfrac-den{padding:1px 3px 0;text-align:center;min-width:8px;}
    #loesungsweg-box{white-space:normal!important;font-family:monospace;}
    #loesungsweg-box .lw-line{display:block;line-height:2.4;padding-left:0;}
    #loesungsweg-box .lw-indent{padding-left:1.5em;}
    #loesungsweg-box .lw-heading{font-weight:600;margin-top:4px;letter-spacing:.02em;}
    #quad-loesungsweg-box{white-space:normal!important;font-family:monospace;}
    #quad-loesungsweg-box .lw-line{display:block;line-height:2.4;padding-left:0;}
    #quad-loesungsweg-box .lw-indent{padding-left:1.5em;}
    #quad-loesungsweg-box .lw-heading{font-weight:600;margin-top:4px;letter-spacing:.02em;}
  `;
  document.head.appendChild(s);
})();

// Gibt zurück ob π-Modus aktiv ist (Zahlen wie 3.14159 werden als π angezeigt).
function usePiMode() { return document.getElementById('pi-mode').value === 'pi'; }

// Versucht eine Zahl v als rationalen Vielfachen von π darzustellen.
// Sucht p/q mit p ∈ [-24,24], q ∈ [1,12] sodass |v - p*π/q| < tol.
// Gibt {p, q} zurück oder null wenn keine passende Darstellung gefunden.
function asPiFraction(v) {
  const tol = 1e-5; if (Math.abs(v) < tol) return null;
  for (let q = 1; q <= 12; q++)
    for (let p = -24; p <= 24; p++) {
      if (p === 0) continue;
      if (Math.abs(v - p * PI / q) < tol) return { p, q };
    }
  return null;
}

// Formatiert {p, q} als π-Bruch-String, z.B. {p:3, q:2} → "3π/2"
function formatPi(p, q) {
  const sign = p < 0 ? '-' : '', ap = Math.abs(p), ns = ap === 1 ? 'π' : `${ap}π`;
  return q === 1 ? `${sign}${ns}` : `${sign}${ns}/${q}`;
}

// Formatiert eine Zahl schön für die Anzeige.
// forAxis=true: keine unnötigen Nullen (parseFloat entfernt sie)
// Erkennt π-Vielfache wenn π-Modus aktiv.
// Anpassen: niceNum mit eigenem Format (z.B. Brüche)
function useFracMode() {
  const el = document.getElementById('frac-mode');
  return el && el.value === 'fraction';
}
function gcd(a, b) { return b < 0.0001 ? Math.round(a) : gcd(b, a % b); }
function asSimpleFrac(v) {
  if (Math.abs(v) < 1e-9 || !isFinite(v)) return null;
  const neg = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  if (Math.abs(abs - Math.round(abs)) < 1e-9) return null; // ganze Zahl
  // Zwei Toleranzstufen: exakt zuerst, dann Fallback für gerundete Werte
  for (const tol of [1e-9, 5e-5]) {
    for (let q = 2; q <= 100; q++) {
      const p = Math.round(abs * q);
      if (p > 0 && Math.abs(p / q - abs) < tol) {
        const g = gcd(p, q); return `${neg}${p/g}/${q/g}`;
      }
    }
  }
  return null;
}
function niceNum(v, forAxis) {
  if (!isFinite(v)) return '–';
  if (Math.abs(v) < 1e-9) return '0'; // sehr kleine Zahlen = 0
  if (usePiMode()) { const pf = asPiFraction(v); if (pf) return formatPi(pf.p, pf.q); }
  if (!forAxis) { const fr = asSimpleFrac(v); if (fr) return fr; } // immer Brüche versuchen
  if (forAxis) return parseFloat(v.toFixed(precision)).toString();
  return v.toFixed(precision);
}

// Gibt eine Zahl als HTML-Bruch zurück: <span class="mfrac">…</span> oder plain string.
// Wird für HTML-Ausgaben verwendet (Lösungsweg etc.)
function fracHTML(v) {
  if (!isFinite(v)) return '–';
  if (Math.abs(v) < 1e-9) return '0';
  if (Math.abs(v - Math.round(v)) < 1e-6) return String(Math.round(v));
  const fr = asSimpleFrac(v);
  if (fr && fr.includes('/')) {
    const slash = fr.lastIndexOf('/');
    const num = fr.substring(0, slash), den = fr.substring(slash + 1);
    return `<span class="mfrac"><span class="mfrac-num">${num}</span><span class="mfrac-den">${den}</span></span>`;
  }
  return parseFloat(v.toFixed(Math.max(precision, 2))).toString();
}

// Koordinaten-String, z.B. "(1/3 | 2)"
function niceCoord(x, y) { return `(${niceNum(x)} | ${niceNum(y)})`; }

// ═══════════════════════════════════════════════════════════════════
// PERIODIZITÄTSERKENNUNG (für Spezielle-Punkte-Liste)
// ═══════════════════════════════════════════════════════════════════

// Prüft ob ein Array von x-Werten periodisch ist (gleiche Abstände).
// xs: Array von x-Koordinaten gleichartiger Punkte (z.B. alle Nullstellen).
// Gibt {base, period} zurück oder null.
function detectPeriod(xs) {
  if (xs.length < 2) return null;
  const s = [...xs].sort((a,b) => a-b), diffs = [];
  for (let i = 1; i < s.length; i++) diffs.push(s[i] - s[i-1]);
  const d0 = diffs[0];
  // Periode erkannt wenn alle Abstände gleich sind (±0.1%)
  if (diffs.every(d => Math.abs(d - d0) < 1e-3 * Math.max(1, Math.abs(d0)))) return { base: s[0], period: d0 };
  return null;
}

// Gruppiert periodische Punkte zu einem zusammenfassenden Label.
// z.B. statt "(π/2 | 1), (5π/2 | 1), (9π/2 | 1)..." → "(π/2 + 2π·k | 1)"
function groupPeriodic(pts) {
  if (pts.length < 2) return pts.map(p => ({...p, label: niceCoord(p.x, p.y)}));
  const per = detectPeriod(pts.map(p => p.x));
  if (!per) return pts.map(p => ({...p, label: niceCoord(p.x, p.y)}));
  const pf = usePiMode() ? asPiFraction(per.period) : null;
  const periodStr = pf ? formatPi(pf.p, pf.q) : per.period.toFixed(precision);
  const baseX = per.base, baseY = pts.find(p => Math.abs(p.x - baseX) < 1e-3)?.y ?? 0;
  return pts.map((p, i) => ({...p, label: i === 0 ? `(${niceNum(baseX)} + ${periodStr}·k | ${niceNum(baseY)})` : null}));
}

// ═══════════════════════════════════════════════════════════════════
// MATHEMATIK-TASTATUR
// ═══════════════════════════════════════════════════════════════════

// Merkt sich welches Eingabefeld zuletzt fokussiert war.
// el: das <input>-Element, fi: Index in functions[] (oder -1 für andere Felder)
let activeInput = null;
function setActiveInput(el, fi) { activeInput = { el, fi }; }

// Globales Tracking: jedes Textfeld/Zahlenfeld merkt sich als aktives Ziel
document.addEventListener('focusin', e => {
  const t = e.target;
  if (t.tagName === 'INPUT' && (t.type === 'text' || t.type === 'number')) {
    if (!activeInput || activeInput.el !== t) activeInput = { el: t, fi: -1 };
  }
  // Contenteditable-Felder (Funktionseingaben) werden über setActiveInput gesetzt
  // Alle anderen contenteditable-Elemente ignorieren
});

// Fügt Text ins aktive Eingabefeld an der Cursor-Position ein.
function kbdInsert(before, after, extraArg) {
  if (!activeInput) return;
  const el = activeInput.el, fi = activeInput.fi;
  el.focus();

  // Contenteditable-Funktionsfeld (div[contenteditable])
  const isCE = el.contentEditable === 'true';
  if (isCE) {
    // Beim Fokussieren ist der Inhalt immer reiner Text
    const raw = el.getAttribute('data-raw') || el.textContent;
    // Selektion auslesen
    const selObj = window.getSelection();
    let selTxt = selObj.toString();

    // Insert-Text bestimmen
    let insert;
    if (before === 'EC') insert = fi >= 0 ? 'EC' : String(Math.E.toFixed(10));
    else if (before === 'pi') insert = fi >= 0 ? 'pi' : String(Math.PI.toFixed(10));
    else if (extraArg !== undefined) insert = before + (selTxt || 'x') + ',' + extraArg + ')';
    else if (after !== undefined) insert = before + (selTxt || 'x') + after;
    else insert = before;

    // In contenteditable einfügen
    document.execCommand('insertText', false, insert);
    const newRaw = el.textContent;
    el.setAttribute('data-raw', newRaw);
    if (fi >= 0 && functions[fi]) {
      functions[fi].expr = newRaw;
      syncParams(); syncAreaSelects(); scheduleComputeSpecials();
      if (showArea) updateAreaResult(); scheduleDraw();
    }
    return;
  }

  // Standard-Input (type=text oder type=number)
  const isNumInput = el.type === 'number';
  const start = isNumInput ? 0 : (el.selectionStart ?? el.value.length);
  const end   = isNumInput ? el.value.length : (el.selectionEnd ?? el.value.length);
  const sel = el.value.slice(start, end);

  let insert, cursorPos;
  if (before === 'EC') {
    insert = fi >= 0 ? 'EC' : String(Math.E.toFixed(10));
    cursorPos = start + insert.length;
  } else if (before === 'pi') {
    insert = fi >= 0 ? 'pi' : String(Math.PI.toFixed(10));
    cursorPos = start + insert.length;
  } else if (extraArg !== undefined) {
    const inner = sel || 'x';
    insert = before + inner + ',' + extraArg + ')';
    cursorPos = start + before.length + inner.length;
  } else if (after !== undefined) {
    const inner = sel || 'x';
    insert = before + inner + after;
    cursorPos = start + before.length + inner.length;
  } else {
    insert = before; cursorPos = start + insert.length;
  }

  const newVal = el.value.slice(0, start) + insert + el.value.slice(end);
  el.value = newVal;
  el.setSelectionRange(cursorPos, cursorPos);
  if (fi >= 0 && functions[fi]) {
    functions[fi].expr = newVal;
    syncParams(); syncAreaSelects(); scheduleComputeSpecials();
    if (showArea) updateAreaResult(); scheduleDraw();
  } else {
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

// Fügt einen Bruch (Zähler)/(Nenner) ein.
// Markierter Text wird zum Zähler; Cursor landet im Nenner.
function kbdFrac() {
  if (!activeInput) return;
  const el = activeInput.el, fi = activeInput.fi;
  el.focus();

  const isCE = el.contentEditable === 'true';
  if (isCE) {
    const selTxt = window.getSelection().toString();
    const insert = `(${selTxt})/()`;
    document.execCommand('insertText', false, insert);
    const newRaw = el.textContent;
    el.setAttribute('data-raw', newRaw);
    if (fi >= 0 && functions[fi]) {
      functions[fi].expr = newRaw;
      syncParams(); syncAreaSelects(); scheduleComputeSpecials();
      if (showArea) updateAreaResult(); scheduleDraw();
    }
    return;
  }

  const isNumInput = el.type === 'number';
  const start = isNumInput ? 0 : (el.selectionStart ?? el.value.length);
  const end   = isNumInput ? el.value.length : (el.selectionEnd ?? el.value.length);
  const sel   = el.value.slice(start, end);
  const num   = sel || '';
  const insert = `(${num})/()`;
  const cursorPos = start + num.length + 4;
  const newVal = el.value.slice(0, start) + insert + el.value.slice(end);
  el.value = newVal;
  el.setSelectionRange(cursorPos, cursorPos);
  if (fi >= 0 && functions[fi]) {
    functions[fi].expr = newVal;
    syncParams(); syncAreaSelects(); scheduleComputeSpecials();
    if (showArea) updateAreaResult(); scheduleDraw();
  } else {
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

// ═══════════════════════════════════════════════════════════════════
// FUNKTIONSAUSWERTUNG (safeEval)
// ═══════════════════════════════════════════════════════════════════

// Schrittweite für numerische Ableitung (5-Punkt-Formel).
// Kleiner = genauer, aber irgendwann Fliesskomma-Rauschen. 1e-5 ist ein guter Kompromiss.
const H = 1e-5;

// Cache für kompilierte Funktionen: {expr|params} → Function-Objekt
// Verhindert dass new Function() bei jedem Pixel aufgerufen wird (wäre sehr langsam).
// Cache wird geleert wenn Ausdruck oder Parameter sich ändern (clearEvalCache()).
const evalCache = new Map();

// Kompiliert einen Ausdruck zu einer JavaScript-Funktion und cacht das Ergebnis.
// expr: z.B. "sin(x) + a*x"
// pNames: Array von Parameternamen, z.B. ['a']
// Gibt die kompilierte Function zurück oder null bei Syntaxfehler.
function getEvalFn(expr, pNames) {
  const key = expr + '|' + pNames.join(',');
  if (evalCache.has(key)) return evalCache.get(key);
  try {
    // ^ → ** (Potenz), EC → __EULER__ (intern)
    // JS strict mode verbietet unäres Minus direkt vor **: -x**2 → SyntaxError
    // Lösung: Alle -TERM** Muster klammern: -x**2 → (-x)**2
    let e = expr.replace(/\^/g, '**').replace(/\bEC\b/g, '__EULER__');
    // Klammere: (Anfang oder nach Operator/Klammer auf) gefolgt von - und Term vor **
    // Schritt 1: Einfache Variable: -x** → (-x)**
    e = e.replace(/(^|[\(\+\-\*\/,\s])-([a-zA-Z_][a-zA-Z0-9_]*)\s*\*\*/g, '$1(-$2)**');
    // Schritt 2: Geklammerte Ausdrücke: -(...)** → (-(...))**  — bereits geklammert, kein Problem
    // Schritt 3: Zahl: -3** → (-3)**
    e = e.replace(/(^|[\(\+\-\*\/,\s])-(\d+\.?\d*)\s*\*\*/g, '$1(-$2)**');
    // Kompiliert zu: function(x, sin, cos, ..., a, b) { return (sin(x) + a*x); }
    // So werden Math-Funktionen und Parameter als lokale Variablen übergeben.
    const fn = new Function(
      'x', 'sin','cos','tan','sqrt','abs','log','exp','pi','__EULER__',
      'nthroot','logn','log10','logbase',
      ...pNames,
      `"use strict"; return (${e});`
    );
    evalCache.set(key, fn);
    return fn;
  } catch (ex) { return null; } // Syntaxfehler → null
}

// Wertet einen Funktionsausdruck für einen x-Wert aus.
// Gibt NaN zurück bei Syntaxfehler oder mathematisch undefiniertem Wert.
// xVal: der x-Wert (z.B. 1.5)
// Eingebaute Funktionen die man verwenden kann:
//   sin, cos, tan, sqrt, abs, log (=ln), exp (=eˣ)
//   nthroot(x,n) = ⁿ√x, logn(x,b) = log_b(x), log10(x)
//   pi = π, EC = e (Eulersche Zahl)
// Um neue Funktionen hinzuzufügen:
//   1. Neuen Parameter-Namen in new Function() einfügen (nach 'logbase')
//   2. Entsprechende Math.*-Funktion in fn(...) Aufruf einfügen
//   3. Button in .kbd ergänzen
function safeEval(expr, xVal) {
  if (!expr || !expr.trim()) return NaN;
  try {
    const pN = Object.keys(params), pV = pN.map(p => params[p].val);
    const fn = getEvalFn(expr, pN);
    if (!fn) return NaN;

    // Eingebaute Funktionen übergeben
    const nthroot = (v, n) => { if (n === 0) return NaN; const r = Math.pow(Math.abs(v), 1/n); return v < 0 ? (n%2===1 ? -r : NaN) : r; };
    const logn = (v, base) => Math.log(v) / Math.log(base);
    const log10 = (v) => Math.log(v) / Math.LN10;
    const logbase = (v, base) => Math.log(v) / Math.log(base); // Alias für logn

    return fn(xVal, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.log, Math.exp,
              PI, Math.E, nthroot, logn, log10, logbase, ...pV);
  } catch (ex) { return NaN; }
}

// Leert den safeEval-Cache. Aufrufen wenn:
// - Funktionsausdruck geändert wurde
// - Parameter-Werte geändert wurden
// - Eine Funktion gelöscht wurde
function clearEvalCache() { evalCache.clear(); }

// ═══════════════════════════════════════════════════════════════════
// NUMERISCHE ABLEITUNGEN (5-Punkt-Formeln)
// ═══════════════════════════════════════════════════════════════════

// Erste Ableitung f'(x) mit 5-Punkt-Formel (Fehler O(H^4))
// Genauer als einfacher Differenzenquotient (f(x+H)-f(x-H))/(2H)
function deriv1(expr, x) {
  return (-safeEval(expr, x+2*H) + 8*safeEval(expr, x+H) - 8*safeEval(expr, x-H) + safeEval(expr, x-2*H)) / (12*H);
}

// Zweite Ableitung f''(x) mit 5-Punkt-Formel (Fehler O(H^4))
// Verwendet für: Extrema erkennen (Vorzeichen von f'') und Wendepunkte (Vorzeichenwechsel von f'')
function deriv2(expr, x) {
  return (-safeEval(expr, x+2*H) + 16*safeEval(expr, x+H) - 30*safeEval(expr, x) + 16*safeEval(expr, x-H) - safeEval(expr, x-2*H)) / (12*H*H);
}

// Prüft ob eine Funktion überall f''≈0 hat (= lineare/affine Funktion).
// Testet an 12 verschiedenen x-Werten (inkl. weit ausserhalb üblicher Views).
// Threshold 1e-4 ist robust gegen numerisches Rauschen der 5-Punkt-Formel.
// Warum wichtig: Lineare Funktionen sollen keine Wendepunkte bekommen.
function isLinearFunc(expr) {
  // Relativer Schwellwert: skaliert mit |f(x)|, damit Bruch-Koeffizienten (1/3, 14/3)
  // die float64-Rundungsfehler der 5-Punkt-Formel nicht fälschlicherweise als nicht-linear werten.
  // Fehler der Formel ≈ 64·|f(x)|·ε_machine/H² → |d2|/(1+|f(x)|) bleibt bei echten Geraden klein.
  const pts = [-10, -2, -1, -0.3, 0, 0.3, 1, 2, 10, Math.PI];
  let count = 0;
  for (const x of pts) {
    const d2 = deriv2(expr, x);
    if (!isFinite(d2)) continue;
    const fv = safeEval(expr, x);
    const scale = 1 + (isFinite(fv) ? Math.abs(fv) : 0);
    if (Math.abs(d2) / scale > 1e-3) return false;
    count++;
  }
  return count > 0;
}

// ═══════════════════════════════════════════════════════════════════
// PARAMETER-ERKENNUNG UND -VERWALTUNG
// ═══════════════════════════════════════════════════════════════════

// Findet alle Bezeichner in einem Ausdruck die als Parameter gelten.
// Ausgeschlossen: reservierte Namen (sin, cos, pi, EC, ...) und Namen mit >2 Zeichen.
// Beispiel: "a*sin(x)+b*x" → ['a', 'b']
function extractParams(expr) {
  const clean = expr.replace(/\bEC\b/g, '__E__'); // EC vor Regex schützen
  const m = clean.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  return [...new Set(m)].filter(n => !RESERVED.has(n) && n.length <= 2);
}

// Gibt alle Parameter aus allen Funktionen zurück (sortiert, dedupliziert).
function getAllParams() {
  const a = new Set();
  functions.forEach(fn => extractParams(fn.expr).forEach(p => a.add(p)));
  return [...a].sort();
}

// Parst einen Parameterausdruck der auch "pi", "e", "pi/2" etc. enthalten darf.
// Gibt eine Zahl zurück oder null bei ungültigem Input.
function parseParamExpr(str) {
  str = str.trim().replace(/π/g, 'pi');
  try {
    const v = new Function('pi','e', `"use strict"; return (${str});`)(PI, Math.E);
    if (isFinite(v)) return v;
  } catch (ex) {}
  const n = parseFloat(str);
  return isFinite(n) ? n : null;
}

// Synchronisiert die Parameter-Schieber mit dem aktuellen Zustand der Funktionen.
// Wird aufgerufen wenn:
// - Eine Funktion geändert wird (neuer Buchstabe = neuer Parameter)
// - Eine Funktion gelöscht wird
// Neue Parameter bekommen Standardwerte {val:1, min:-5, max:5, step:0.01}.
// Um Standardwerte zu ändern: die Zeile params[p]={val:1,...} anpassen.
function syncParams() {
  const needed = getAllParams();
  // Neue Parameter mit Standardwerten initialisieren
  needed.forEach(p => { if (!params[p]) params[p] = { val:1, min:-5, max:5, step:0.01 }; });
  // Nicht mehr benötigte Parameter entfernen
  Object.keys(params).forEach(p => { if (!needed.includes(p)) delete params[p]; });

  const sec = document.getElementById('param-section'), list = document.getElementById('param-list');
  if (!needed.length) { sec.style.display = 'none'; return; } // verstecken wenn keine Parameter
  sec.style.display = ''; list.innerHTML = '';

  needed.forEach(p => {
    const pr = params[p];
    const wrap = document.createElement('div'); wrap.className = 'param-wrap';

    // Zeile 1: Parametername | Min-Eingabe | Schieber | Max-Eingabe
    const row1 = document.createElement('div'); row1.className = 'param-row';
    const nm = document.createElement('span'); nm.className = 'param-name'; nm.textContent = p + ' =';
    const mi = document.createElement('input'); mi.type = 'number'; mi.inputMode = 'decimal'; mi.value = pr.min; mi.step = '1'; mi.style.width = '42px';
    mi.onchange = () => { pr.min = parseParamExpr(mi.value) ?? pr.min; sl.min = pr.min; };
    const sl = document.createElement('input'); sl.type = 'range'; sl.min = pr.min; sl.max = pr.max; sl.step = pr.step; sl.value = pr.val; sl.style.flex = '1';
    const ma = document.createElement('input'); ma.type = 'number'; ma.inputMode = 'decimal'; ma.value = pr.max; ma.step = '1'; ma.style.width = '42px';
    ma.onchange = () => { pr.max = parseParamExpr(ma.value) ?? pr.max; sl.max = pr.max; };
    row1.append(nm, mi, sl, ma);

    // Zeile 2: Direkt-Wert-Eingabe (akzeptiert "pi", "e", "pi/2") + Schrittweite
    const row2 = document.createElement('div'); row2.className = 'param-ctrl-row';
    const vInp = document.createElement('input'); vInp.type = 'text'; vInp.inputMode = 'decimal'; vInp.className = 'param-val-inp';
    vInp.value = pr.val.toFixed(Math.max(precision, 3)); vInp.placeholder = 'z.B. pi, 1.5';
    vInp.onchange = () => {
      const v = parseParamExpr(vInp.value);
      if (v !== null) { pr.val = Math.min(pr.max, Math.max(pr.min, v)); sl.value = pr.val; vInp.value = pr.val.toFixed(Math.max(precision, 3)); }
      clearEvalCache(); scheduleComputeSpecials(); scheduleDraw();
    };
    sl.oninput = () => { pr.val = parseFloat(sl.value); vInp.value = pr.val.toFixed(Math.max(precision, 3)); clearEvalCache(); scheduleComputeSpecials(); scheduleDraw(); };

    // Schrittweiten-Auswahl Δ für den Schieber
    const stLbl = document.createElement('span'); stLbl.style.color = '#9ca3af'; stLbl.textContent = 'Δ:';
    const stSel = document.createElement('select'); stSel.style.cssText = 'font-size:10px;padding:1px 3px;border:1px solid #c8cdd6;border-radius:3px;';
    ['0.001','0.01','0.05','0.1','0.25','0.5','1'].forEach(v => {
      const o = document.createElement('option');
      o.value = v; o.textContent = v;
      if (parseFloat(v) === (pr.step || 0.01)) o.selected = true;
      stSel.appendChild(o);
    });
    stSel.onchange = () => { pr.step = parseFloat(stSel.value) || 0.01; sl.step = pr.step; };
    row2.append(vInp, stLbl, stSel);
    wrap.append(row1, row2); list.appendChild(wrap);
  });
}

