// CSS für Exponenten-Kursor-Hervorhebung und Anker-Darstellung injizieren
(function() {
  if (document.getElementById('sup-cursor-style')) return;
  const s = document.createElement('style'); s.id = 'sup-cursor-style';
  s.textContent =
    '.preview-sup.sup-cursor-active{outline:1.5px solid rgba(55,138,221,0.75);background:rgba(55,138,221,0.11);border-radius:2px;}' +
    '.func-inp-ce .pf-cursor-anchor{vertical-align:baseline!important;font-size:1em!important;}' +
    '.func-inp-ce .pf-inline{vertical-align:middle;display:inline;font-size:1em;}' +
    '.func-inp-ce::-webkit-scrollbar{height:3px;}' +
    '.func-inp-ce::-webkit-scrollbar-thumb{background:var(--border-input);border-radius:3px;}' +
    '.smart-btn-row{display:flex;flex-wrap:wrap;gap:3px;margin:2px 0 5px 28px;min-height:0;}' +
    '.smart-btn{font-size:10px;padding:2px 8px;border-radius:10px;border:1.5px solid;cursor:pointer;background:transparent;transition:background 0.15s,color 0.15s;white-space:nowrap;line-height:1.5;font-family:system-ui,sans-serif;}' +
    '.smart-btn:hover{filter:brightness(1.15);}' +
    '.smart-btn.sb-active{color:#fff!important;}';
  document.head.appendChild(s);
})();

// ═══════════════════════════════════════════════════════════════════
// DEFINITIONSBEREICH (D_f) & WERTEMENGE (W_f): automatische Erkennung
// ═══════════════════════════════════════════════════════════════════
// Die eigentliche Berechnung erfolgt symbolisch+numerisch in
// 15_domain_range.js (computeDomain / computeRange) — siehe dort für die
// Herleitung. Dieser Abschnitt bindet das nur noch an die UI an.

// Speichert pro Funktionsobjekt: { timer, userSet }
// WeakMap: wird automatisch geleert wenn die Funktion aus dem Array entfernt wird
const _fnDomState = new WeakMap();
function _domSt(fn) {
  if (!_fnDomState.has(fn)) _fnDomState.set(fn, { timer: null, userSet: false });
  return _fnDomState.get(fn);
}

// Erzeugt den Anzeigetext für den Domänen-Button, inklusive Ausnahmen
// (isolierte Polstellen UND ausgeschlossene Teilintervalle/"Lücken", z.B.
// D_f = ℝ \ (−2, 2) für sqrt(x²−4)).
function _domainLabel(fn) {
  const allExcl = fn.domainExcluded || [];
  const gaps = fn.domainGaps || [];
  const hasBounds = fn.domainMin != null || fn.domainMax != null;
  // Liegt ein ausgeschlossener Punkt GENAU auf domainMin/domainMax (z.B. 1/sqrt(1-x):
  // die Definitionslücke bei x=1 fällt mit der oberen Bereichsgrenze zusammen), wird
  // das nicht als zusätzliche "\ {1}"-Ausnahme neben "[…, 1]" angezeigt, sondern als
  // offene Klammer "…, 1)" — mathematisch dasselbe, aber die erwartete Schreibweise.
  const closeTo = (a, b) => a != null && b != null && Math.abs(a - b) < 1e-6;
  const minOpen = allExcl.some(v => closeTo(v, fn.domainMin));
  const maxOpen = allExcl.some(v => closeTo(v, fn.domainMax));
  const excl = allExcl.filter(v => !closeTo(v, fn.domainMin) && !closeTo(v, fn.domainMax));
  const pieces = [];
  if (excl.length > 0 && excl.length <= 4) pieces.push(`{${excl.join(', ')}}`);
  else if (excl.length > 4)               pieces.push('{…}');
  if (gaps.length > 0 && gaps.length <= 3) gaps.forEach(g => pieces.push(`(${g.lo}, ${g.hi})`));
  else if (gaps.length > 3)               pieces.push('(…)');
  const exclStr = pieces.length ? ` \\ ${pieces.length > 1 ? '(' + pieces.join(' ∪ ') + ')' : pieces[0]}` : '';
  if (!hasBounds) return pieces.length ? `D: ℝ${exclStr}` : 'D: ℝ';
  const dmn = fn.domainMin != null ? fn.domainMin : '−∞';
  const dmx = fn.domainMax != null ? fn.domainMax : '+∞';
  // Offene Klammer auch wenn die Grenze selbst aus einer STRIKTEN Bedingung
  // stammt (z.B. log-Argument > 0 -> "(0, +∞)" statt "[0, +∞)" für log(x)) —
  // siehe domainMinOpen/domainMaxOpen in computeDomain() (15_domain_range.js).
  const lB = (fn.domainMin == null || minOpen || fn.domainMinOpen) ? '(' : '[';
  const rB = (fn.domainMax == null || maxOpen || fn.domainMaxOpen) ? ')' : ']';
  return `D: ${lB}${dmn}, ${dmx}${rB}${exclStr}`;
}

// Wendet erkannten Definitionsbereich auf fn + UI-Elemente an
function _applyDetectedDomain(fn, domainToggle, vonInp, bisInp, rangeSpan) {
  const det = computeDomain(fn.expr);
  fn.domainMin = det.domainMin;
  fn.domainMax = det.domainMax;
  fn.domainMinOpen = !!det.domainMinOpen;
  fn.domainMaxOpen = !!det.domainMaxOpen;
  fn.domainExcluded = det.excluded || [];
  fn.domainGaps = det.gaps || [];
  domainToggle.textContent = _domainLabel(fn);
  vonInp.value = fn.domainMin != null ? fn.domainMin : '';
  bisInp.value = fn.domainMax != null ? fn.domainMax : '';
  if (rangeSpan) _updateRangeSpan(fn.expr, fn.domainMin, fn.domainMax, fn.domainExcluded, fn.domainGaps, rangeSpan, fn.domainMinOpen, fn.domainMaxOpen);
  clearEvalCache(); scheduleComputeSpecials(); scheduleDraw();
}

// Reiner Formatierer: berechnete Wertemenge -> Anzeigetext ("W: […]").
// Extrahiert aus _updateRangeSpan(), damit dieselbe Formatierung sowohl von
// der Pro-Zeilen-Anzeige (Sidebar) als auch von der neuen Panel-Anzeige
// (siehe updatePanelDomainRanges() weiter unten) genutzt werden kann.
function _rangeLabel(rangeMin, rangeMax, rangeExcluded) {
  const excl = rangeExcluded || [];
  if (rangeMin === null && rangeMax === null) {
    // ℝ mit möglichen Ausnahmen (z.B. ℝ\{0})
    const exclStr = excl.length > 0 && excl.length <= 3 ? ` \\ {${excl.join(', ')}}`
                  : excl.length > 3 ? ' \\ {…}' : '';
    return `W: ℝ${exclStr}`;
  }
  const lo = rangeMin != null ? rangeMin : '−∞';
  const hi = rangeMax != null ? rangeMax : '+∞';
  // Offene Klammer wenn der Grenzwert in excl enthalten ist (asymptotisch angenähert)
  const lB = (rangeMin == null || excl.includes(rangeMin)) ? '(' : '[';
  const rB = (rangeMax == null || excl.includes(rangeMax)) ? ')' : ']';
  // Nur solche excl-Werte im \{}-Teil anzeigen, die nicht schon als Intervallgrenze sichtbar sind
  const inner = excl.filter(v => v !== rangeMin && v !== rangeMax);
  const exclStr = inner.length > 0 && inner.length <= 3 ? ` \\ {${inner.join(', ')}}`
                : inner.length > 3 ? ' \\ {…}' : '';
  return `W: ${lB}${lo}, ${hi}${rB}${exclStr}`;
}

// Aktualisiert das rangeSpan-Element mit der berechneten Wertemenge
function _updateRangeSpan(expr, domainMin, domainMax, domainExcluded, domainGaps, rangeSpan, domainMinOpen, domainMaxOpen) {
  if (!expr || !expr.trim()) { rangeSpan.textContent = ''; return; }
  const { rangeMin, rangeMax, rangeExcluded } = computeRange(expr, domainMin, domainMax, domainExcluded || [], domainGaps || [], domainMinOpen, domainMaxOpen);
  rangeSpan.textContent = _rangeLabel(rangeMin, rangeMax, rangeExcluded);
}

// ═══════════════════════════════════════════════════════════════════
// D_f / W_f DIREKT IN DEN FUNKTIONSTYP-PANELS (Lineare, Quadratische,
// Exponential-, Logarithmus-, Potenz-/Wurzel- und trigonometrische
// Funktionen) — analog zur Pro-Zeilen-Anzeige oben, aber direkt im
// jeweiligen Menüpunkt und LIVE abhängig von den aktuell eingestellten
// Schiebereglerwerten (nicht nur bei Ausdrucksänderung). Wird zentral aus
// computeSpecials() (04_analysis.js) heraus bei jeder Schieber-/Funktions-
// änderung neu aufgerufen — dadurch automatisch "live", ohne dass jede
// einzelne UI-Stelle (Slider-oninput, Aufschalten-Knopf, …) selbst daran
// denken muss.
// ═══════════════════════════════════════════════════════════════════

// Berechnet D_f/W_f frisch für eine konkrete Funktion, mit den AKTUELLEN
// Parameterwerten (computeDomain/computeRange werten numerisch über
// safeEval() aus, das liest params{} live — siehe 15_domain_range.js).
// Eine vom Nutzer in der Sidebar manuell eingeschränkte Domain (_domSt(fn).userSet,
// siehe oben) wird als zusätzliche äussere Schranke übernommen, da das die
// tatsächlich gezeichnete Kurve ist.
function _panelDomainRangeFor(fn) {
  if (!fn || !fn.expr || !fn.expr.trim()) return null;
  let det;
  try { det = computeDomain(fn.expr); } catch (e) { return null; }
  let domainMin = det.domainMin, domainMax = det.domainMax;
  let domainMinOpen = !!det.domainMinOpen, domainMaxOpen = !!det.domainMaxOpen;
  const excluded = det.excluded || [], gaps = det.gaps || [];
  if (_domSt(fn).userSet) {
    // Manuell eingegebene Grenzen gelten als eingeschlossen (geschlossene
    // Klammer, siehe updateDomainFromInputs() oben) — nur wenn sie die
    // natürliche Grenze tatsächlich verschärfen, übernehmen wir sie.
    if (fn.domainMin != null && (domainMin == null || fn.domainMin > domainMin)) { domainMin = fn.domainMin; domainMinOpen = false; }
    if (fn.domainMax != null && (domainMax == null || fn.domainMax < domainMax)) { domainMax = fn.domainMax; domainMaxOpen = false; }
  }
  let rng;
  try { rng = computeRange(fn.expr, domainMin, domainMax, excluded, gaps, domainMinOpen, domainMaxOpen); }
  catch (e) { rng = { rangeMin: null, rangeMax: null, rangeExcluded: [] }; }
  return {
    domainMin, domainMax, domainMinOpen, domainMaxOpen, domainExcluded: excluded, domainGaps: gaps,
    rangeMin: rng.rangeMin, rangeMax: rng.rangeMax, rangeExcluded: rng.rangeExcluded || [],
  };
}

// Formatiert D_f + W_f einer Funktion als einzeiligen Anzeigetext (oder '' bei Fehler)
function _panelDWText(fn) {
  const r = _panelDomainRangeFor(fn);
  if (!r) return '';
  const dLabel = _domainLabel({ domainMin: r.domainMin, domainMax: r.domainMax, domainMinOpen: r.domainMinOpen, domainMaxOpen: r.domainMaxOpen, domainExcluded: r.domainExcluded, domainGaps: r.domainGaps });
  const wLabel = _rangeLabel(r.rangeMin, r.rangeMax, r.rangeExcluded);
  return dLabel + '   ' + wLabel;
}

// Schreibt (oder leert) die D_f/W_f-Anzeige eines Panel-Elements
function _setPanelDW(elId, fn) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = fn ? _panelDWText(fn) : '';
}

// Schreibt (oder leert) die "explizite Formel" eines Panel-Elements — bei
// Funktionen mit Schiebereglern (z.B. y=mx+q) werden die Parameter durch
// ihre AKTUELLEN Schieberwerte ersetzt (exprWithValues(), 03_math.js) und
// hübsch gerendert (exprToMathLiveHtml(), 07_export.js), z.B. "f(x) = 2x+1"
// statt der symbolischen Form "m·x+q". Wird wie _setPanelDW() zentral aus
// updatePanelDomainRanges() aufgerufen, aktualisiert sich also live bei
// jeder Schieber-Bewegung.
function _setPanelFormula(elId, fn) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (!fn) { el.textContent = ''; return; }
  el.style.color = '#1D9E75';
  const substituted = typeof exprWithValues === 'function' ? exprWithValues(fn.expr) : fn.expr;
  const html = typeof exprToMathLiveHtml === 'function' ? exprToMathLiveHtml(substituted) : substituted;
  el.innerHTML = '✓ f(x) = ' + html;
}

// Findet die (erste sichtbare) Funktion, deren normalisierter Ausdruck exakt
// einem gegebenen Muster entspricht — dieselbe Zuordnungslogik, die die
// "Aufschalten"-Knöpfe selbst benutzen (siehe linAddSlopeForm()/
// expAddGeneralForm()/logAddGeneralForm()/powerAddGeneralForm()/
// trigAddFunction() in 11_fitting.js bzw. weiter oben in dieser Datei).
function _findByPattern(pattern) {
  const norm = e => e.replace(/\s+/g, '');
  const p = norm(pattern);
  const fi = functions.findIndex(fn => fn.visible !== false && norm(fn.expr || '') === p);
  return fi === -1 ? null : functions[fi];
}

// Zentrale Aktualisierung ALLER sechs Panel-Anzeigen auf einen Schlag — wird
// aus computeSpecials() aufgerufen, also bei jeder Schieber-Bewegung, jedem
// Aufschalten/Löschen/Ein-Ausblenden einer Funktion und jeder Ausdrucks-
// änderung automatisch neu ausgeführt.
function updatePanelDomainRanges() {
  // Lineare Funktionen: entweder die Steigungsform y=mx+q (mit Schiebern,
  // eigenes Anzeige-Element) oder das letzte "Berechnen"-Ergebnis aus 2
  // Punkten (kein Schieberegler, aber ebenfalls anzeigenswert).
  _setPanelFormula('lin-slopeform-result', _findByPattern('m*x+q'));
  _setPanelDW('lin-slopeform-dw', _findByPattern('m*x+q'));
  const linFitFn = (typeof linPanelDef !== 'undefined' && linPanelDef && linPanelDef.lastFi != null)
    ? functions[linPanelDef.lastFi] : null;
  _setPanelDW('lin-dw', linFitFn && linFitFn.visible !== false ? linFitFn : null);

  // Quadratische Funktionen: Standardform + Scheitelpunktsform mit Schiebern
  // (analog zur Steigungsform bei linearen Funktionen), plus letztes
  // "Berechnen"-Ergebnis aus Punkten (kein Schieberegler).
  _setPanelFormula('quad-standardform-result', _findByPattern('a*x^2+b*x+c'));
  _setPanelDW('quad-standardform-dw', _findByPattern('a*x^2+b*x+c'));
  _setPanelFormula('quad-vertexform-result', _findByPattern('a*(x-v)^2+h'));
  _setPanelDW('quad-vertexform-dw', _findByPattern('a*(x-v)^2+h'));
  const quadFitFn = (typeof quadPanelDef !== 'undefined' && quadPanelDef && quadPanelDef.lastFi != null)
    ? functions[quadPanelDef.lastFi] : null;
  _setPanelDW('quad-dw', quadFitFn && quadFitFn.visible !== false ? quadFitFn : null);

  // Exponential-/Logarithmusfunktionen: allgemeine Form mit Schiebern
  _setPanelDW('exp-generalform-dw', _findByPattern('a*b^x+c'));
  _setPanelDW('log-generalform-dw', _findByPattern('a*logn(x,b)+c'));

  // Potenz-/Wurzelfunktionen: allgemeine Form des GERADE im Panel gewählten
  // Falls (Dropdown #power-subtype) — dasselbe Muster wie powerAddGeneralForm().
  if (typeof POWER_CASES !== 'undefined') {
    const subtype = document.getElementById('power-subtype')?.value || 'pos_even';
    const cfg = POWER_CASES[subtype];
    _setPanelDW('power-generalform-dw', cfg ? _findByPattern(cfg.expr) : null);
  }

  // Trigonometrische Funktionen: sin/cos/tan haben keine Schieberegler — D_f/W_f
  // sind konstant, werden aber über dieselbe Berechnung angezeigt (bleibt robust,
  // z.B. falls domänenbeschränkt) — je eine Zeile pro aktuell aufgeschalteter Funktion.
  const trigEl = document.getElementById('trig-dw');
  if (trigEl) {
    const lines = [];
    ['sin', 'cos', 'tan'].forEach(kind => {
      const fn = _findByPattern(kind + '(x)');
      if (fn) {
        const txt = _panelDWText(fn);
        if (txt) lines.push(`<div>${kind}(x):&nbsp; ${txt}</div>`);
      }
    });
    trigEl.innerHTML = lines.join('');
  }

  // Trigonometrische Funktionen, allgemeine Form y = a·sin(b(x−c))+d (bzw.
  // cos/tan) — analog zur allgemeinen Form bei Exponential-/Log-/Potenz-
  // funktionen oben, aber abhängig vom gewählten Typ (Dropdown
  // #trig-gen-subtype), da sin/cos/tan jeweils einen eigenen Ausdrucks-String
  // ergeben (siehe trigAddGeneralForm(), 11_fitting.js).
  if (typeof TRIG_GENERAL_FNAMES !== 'undefined') {
    const subtypeT = document.getElementById('trig-gen-subtype')?.value || 'sin';
    const fnameT = TRIG_GENERAL_FNAMES[subtypeT] || 'sin';
    const exprT = `a*${fnameT}(b*(x-c))+d`;
    const fnT = _findByPattern(exprT);
    _setPanelFormula('trig-generalform-result', fnT);
    _setPanelDW('trig-generalform-dw', fnT);
  }
}

// ═══════════════════════════════════════════════════════════════════
// MODUL: ui_functions — Funktionsliste in der Sidebar
// Enthält:  renderFuncList(), addFunction(), removeFunction()
//           renderPreview(), setActiveInput()
// Ändern:  Standardausdruck neuer Funktionen → addFunction()
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// ANZEIGEFORMATIERUNG DES FUNKTIONSAUSDRUCKS
// ═══════════════════════════════════════════════════════════════════

// Rundet alle Dezimalzahlen im Ausdruck auf die eingestellte Nachkommazahl.
// Nur für die Anzeige im Eingabefeld — fn.expr (volle Präzision) bleibt unberührt.
// Beispiel (precision=2): "5.65685424949*1.189207115^x" → "5.66*1.19^x"
function exprToDisplayStr(expr) {
  return expr.replace(/\d+\.\d+/g, m => parseFloat(parseFloat(m).toFixed(precision)).toString());
}

// ═══════════════════════════════════════════════════════════════════
// FUNKTIONSLISTE (Sidebar)
// ═══════════════════════════════════════════════════════════════════

// Rendert die Funktionsliste in der Sidebar.
// Live-Geraden (verknüpft mit Punkten) haben blauen Hintergrund.
function renderFuncList() {
  const el = document.getElementById('func-list'); el.innerHTML = '';
  functions.forEach((fn, i) => {
    if (fn.visible === undefined) fn.visible = true;
    const isLinked = linkedLines.some(ll => ll.fi === i);

    const row = document.createElement('div'); row.className = 'func-row';

    // Farbpunkt — klickbar zum Öffnen des Farbwählers
    const dot = document.createElement('div'); dot.className = 'dot';
    dot.style.background = fn.color; dot.style.opacity = fn.visible ? '1' : '0.3';
    dot.style.cursor = 'pointer'; dot.title = t('title_color');
    dot.onclick = e => { e.stopPropagation(); openColorPicker(e, i); };

    // Funktionsnummer-Label mit Subscript (HTML)
    const lbl = document.createElement('span');
    lbl.style.cssText = 'font-size:11px;color:#6b7280;min-width:24px;flex-shrink:0;';
    lbl.innerHTML = `f<sub>${i+1}</sub>:`;

    // MathLive-Eingabefeld (robuster Mathe-Editor statt des früheren
    // contenteditable-Divs — siehe 14_mathinput.js für den Konverter
    // Rohausdruck <-> LaTeX/ASCIIMath). MathLive bringt eigene, ausgereifte
    // Cursor-/Touch-/Tastatur-Navigation mit; die frühere Cursor-Hakelei
    // rund um Brüche/Exponenten entfällt dadurch vollständig.
    const inp = document.createElement('math-field');
    inp.className = 'func-inp-ce';
    // align-self:stretch — das Feld soll genauso hoch sein wie die Spalte aus
    // Auge/Löschen/Menü daneben (statt in der Zeilenmitte kleiner zu wirken).
    inp.style.cssText = `font-size:15px;padding:2px 8px;border:1px solid var(--border-input);border-radius:6px;background:var(--bg-input);color:var(--text);flex:1;min-width:0;align-self:stretch;box-sizing:border-box;${fn.visible ? '' : 'opacity:0.45;'}`;
    // Auf Touch-Geräten würde MathLive per Default (Policy "auto") bei JEDEM
    // Antippen des Feldes sofort die grosse, fast schwarze Bildschirmtastatur
    // aufklappen — das verdeckt dann gut die Hälfte des Bildschirms und
    // macht Eingabefeld + Vorschau unlesbar. Mit "manual" bleibt sie zu, bis
    // der Nutzer aktiv auf das (weiterhin sichtbare) Tastatur-Icon tippt.
    inp.mathVirtualKeyboardPolicy = 'manual';

    // Safari-Fix: Ein Klick auf einen Tastatur-Button (z.B. "Bruch" oder "√x")
    // sitzt ausserhalb des <math-field>; MathLive markiert den frisch
    // eingefügten Platzhalter zwar als ausgewählt, aber Safari übernimmt den
    // :focus-Zustand des Custom-Elements danach nicht immer rechtzeitig
    // (bekannte WebKit-Eigenart bei Shadow-DOM-Elementen mit delegatesFocus).
    // MathLive rendert die Auswahl dann in ihrem "nicht fokussiert"-Stil statt
    // im blauen Auswahl-Ton — das erscheint als dunkelgraue Fläche im Feld.
    // MathLive selbst exportiert `.ML__selection` nicht als ::part(), daher
    // direkt ein kleines Style-Tag ins Shadow-DOM dieses Feldes einfügen, das
    // den Auswahl-Hintergrund unabhängig vom :focus-Status erzwingt.
    if (inp.shadowRoot) {
      const selFix = document.createElement('style');
      selFix.textContent = '.ML__selection{background:var(--_selection-background-color, rgba(55,138,221,0.25)) !important;}';
      inp.shadowRoot.appendChild(selFix);
    }

    if (isLinked) { inp.style.background = '#f0f9ff'; inp.title = t('title_live_line'); }
    inp.setAttribute('data-raw', fn.expr || '');
    if (!fn.expr || !fn.expr.trim()) inp.setAttribute('placeholder', t('eg_fn'));

    // Setzt das Feld (Anzeige + data-raw) aus einem Rohausdruck-String neu —
    // wird initial und von aussen (z.B. nach Kurvenanpassung) über
    // renderFuncList() erneut aufgerufen, das jede Zeile frisch aufbaut.
    function mlSetFromRaw(raw) {
      let latex = '';
      try { latex = (raw && raw.trim()) ? rawToLatex(raw) : ''; } catch (ex) { latex = ''; }
      inp.setAttribute('data-raw', raw || '');
      inp.value = latex;
      _mlMoveCursorToEnd(inp); // siehe 14_mathinput.js — Cursor-nach-setValue()-Fix
    }
    mlSetFromRaw(fn.expr);
    inp._mlSetFromRaw = mlSetFromRaw;

    inp.addEventListener('focusin', () => {
      inp.style.borderColor = '#378ADD';
      setActiveInput(inp, i);
    });
    inp.addEventListener('focusout', () => {
      inp.style.borderColor = '';
      if (!historyPaused) { clearTimeout(_histDebounce); _histDebounce = setTimeout(pushHistory, 100); }
    });

    inp.addEventListener('input', () => {
      let raw;
      try {
        raw = asciiMathToRaw(inp.getValue('ascii-math'));
      } catch (ex) {
        // Unvollständiger Zwischenzustand während des Tippens (z.B. "2+",
        // leerer Bruchnenner) — bisherigen Rohausdruck unverändert lassen
        // statt Funktion/Graph kaputtzumachen. Sobald der Ausdruck wieder
        // gültig ist, greift dieser Handler beim nächsten Tastendruck erneut.
        return;
      }
      inp.setAttribute('data-raw', raw);
      fn.expr = raw;
      clearEvalCache(); syncParams(); scheduleComputeSpecials();
       syncLinearExtra(); scheduleDraw();
      // Definitionsbereich bei Ausdrucksänderung neu erkennen (wenn nicht manuell gesetzt)
      const _ds = _domSt(fn);
      _ds.userSet = false;
      clearTimeout(_ds.timer);
      fn.domainMin = null; fn.domainMax = null; fn.domainMinOpen = false; fn.domainMaxOpen = false;
      fn.domainExcluded = []; fn.domainGaps = [];
      domainToggle.textContent = 'D: ℝ'; vonInp.value = ''; bisInp.value = '';
      if (raw.trim()) {
        _ds.timer = setTimeout(() => {
          if (_domSt(fn).userSet) return;
          _applyDetectedDomain(fn, domainToggle, vonInp, bisInp, rangeSpan);
        }, 700);
      } else {
        rangeSpan.textContent = '';
      }
    });

    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
    });

    const preview = document.createElement('div'); // Dummy, nicht mehr verwendet
    preview.style.display = 'none';

    // Auge-Button
    const eye = document.createElement('button'); eye.className = 'del-btn';
    eye.innerHTML = fn.visible ? '&#128065;' : '&#x1F648;'; eye.title = fn.visible ? t('btn_hide_fn') : t('btn_show_fn');
    eye.onclick = () => { fn.visible = !fn.visible; renderFuncList(); scheduleComputeSpecials();  scheduleDraw(); };

    // Löschen-Button — bereinigt auch zugehörige Graph-Punkte
    const del = document.createElement('button'); del.className = 'del-btn'; del.textContent = '✕';
    del.onclick = () => {
      // Graph-Punkte auf dieser Funktion entfernen
      graphPoints = graphPoints.filter(gp => gp.fi !== i);
      // Indizes der Graph-Punkte auf höheren Funktionen anpassen
      graphPoints.forEach(gp => { if (gp.fi > i) gp.fi--; });
      // Differenzenquotient-Applet: beendet sich, falls seine Funktion
      // gelöscht wird; Index anpassen, falls eine frühere Funktion entfernt wurde.
      if (diffQuot) { if (diffQuot.fi === i) diffQuot = null; else if (diffQuot.fi > i) diffQuot.fi--; }
      // Ober-/Untersummen-Applet: beendet sich, falls fi1 gelöscht wird;
      // Index anpassen, falls eine frühere Funktion entfernt wurde.
      if (riemann) {
        if (riemann.fi1 === i) riemann = null;
        else if (riemann.fi1 > i) riemann.fi1--;
      }
      // Flächen-Applet (evtl. mit zwei Funktionen fi1/fi2, siehe flaeche
      // oben in 02_core.js): beendet sich, falls fi1 gelöscht wird oder fi2
      // (sofern gesetzt, axis==='g') gelöscht wird; Indizes anpassen, falls
      // eine frühere Funktion entfernt wurde.
      if (flaeche) {
        if (flaeche.fi1 === i || flaeche.fi2 === i) {
          flaeche = null;
        } else {
          if (flaeche.fi1 > i) flaeche.fi1--;
          if (flaeche.fi2 !== null && flaeche.fi2 > i) flaeche.fi2--;
        }
      }
      functions.splice(i, 1);
      linkedLines = linkedLines.filter(ll => ll.fi !== i);
      linkedLines.forEach(ll => { if (ll.fi > i) ll.fi--; });
      if (activeInput?.fi === i) activeInput = null;
      clearEvalCache(); renderFuncList(); syncParams(); scheduleComputeSpecials(); 
      pushHistory(); scheduleDraw();
    };
    // Menü-Knopf ("☰") — MathLive zeigt diesen normalerweise selbst rechts
    // im Eingabefeld an (::part(menu-toggle), per CSS in index.html jetzt
    // versteckt). Stattdessen hier als eigener Knopf UNTER Auge/Löschen,
    // damit das Feld mehr Platz hat. Ruft MathLive's öffentliche
    // showMenu()-Methode auf; öffnet/schliesst selbst per Zustandsprüfung,
    // dadurch entfällt der frühere Workaround für den (nur beim internen,
    // jetzt versteckten Knopf auftretenden) "schliesst manchmal nicht"-Bug.
    const menuBtn = document.createElement('button');
    menuBtn.className = 'del-btn'; menuBtn.innerHTML = '&#9776;'; menuBtn.title = 'Menü';
    menuBtn.onclick = () => {
      const menu = inp._mathfield && inp._mathfield.menu;
      if (menu && menu.state !== 'closed') { menu.hide(); return; }
      const r = menuBtn.getBoundingClientRect();
      inp.showMenu({ location: { x: r.left, y: r.bottom } });
    };

    // Auge + Löschen + Menü untereinander statt nebeneinander stapeln, damit
    // das Eingabefeld mehr horizontalen Platz bekommt.
    const btnCol = document.createElement('div');
    btnCol.style.cssText = 'display:flex;flex-direction:column;gap:2px;flex-shrink:0;';
    btnCol.append(eye, del, menuBtn);
    row.append(dot, lbl, inp, btnCol);
    const smartBtns = document.createElement('div');
    smartBtns.className = 'smart-btn-row';
    smartBtns.id = `smart-btns-${i}`;
    const solvePanel = document.createElement('div');
    solvePanel.id = `solve-panel-${i}`;
    // ── Definitionsbereich-Zeile ──────────────────────────────────────
    const domainRow = document.createElement('div');
    domainRow.style.cssText = 'margin:0 0 4px 28px;';

    const hasDomain = fn.domainMin != null || fn.domainMax != null;

    const domainToggle = document.createElement('button');
    domainToggle.className = 'smart-btn';
    domainToggle.style.cssText = `border-color:${fn.color}66;color:${fn.color};font-size:10px;padding:1px 7px;border-radius:10px;white-space:nowrap;background:transparent;border:1.5px solid;cursor:pointer;font-family:system-ui,sans-serif;line-height:1.5;`;
    domainToggle.textContent = _domainLabel(fn);
    domainToggle.title = 'Definitionsbereich einschränken';

    const domainLine1 = document.createElement('div');
    domainLine1.style.cssText = 'display:flex;align-items:center;gap:4px;';

    const domainInputs = document.createElement('div');
    domainInputs.style.cssText = `display:${hasDomain ? 'flex' : 'none'};align-items:center;gap:3px;flex-wrap:nowrap;margin-top:3px;`;

    const vonInp = document.createElement('input'); vonInp.type = 'number'; vonInp.step = '0.5';
    vonInp.placeholder = '−∞'; vonInp.style.cssText = 'width:52px;font-size:11px;padding:2px 4px;border:1px solid var(--border-input);border-radius:4px;background:var(--bg-input);color:var(--text);';
    if (fn.domainMin != null) vonInp.value = fn.domainMin;

    const bisInp = document.createElement('input'); bisInp.type = 'number'; bisInp.step = '0.5';
    bisInp.placeholder = '+∞'; bisInp.style.cssText = 'width:52px;font-size:11px;padding:2px 4px;border:1px solid var(--border-input);border-radius:4px;background:var(--bg-input);color:var(--text);';
    if (fn.domainMax != null) bisInp.value = fn.domainMax;

    const mkSpan = t => { const s = document.createElement('span'); s.textContent = t; s.style.cssText = 'font-size:11px;color:var(--text-muted);'; return s; };

    const domainClear = document.createElement('button'); domainClear.textContent = '✕';
    domainClear.style.cssText = 'font-size:10px;padding:1px 5px;border-radius:4px;border:1px solid var(--border-input);background:var(--bg-btn);color:var(--text-muted);cursor:pointer;';
    domainClear.title = 'Zurücksetzen (D = ℝ)';
    domainClear.onclick = () => {
      fn.domainMin = null; fn.domainMax = null;
      clearEvalCache(); scheduleComputeSpecials(); scheduleDraw();
      renderFuncList();
    };

    // rangeSpan VOR updateDomainFromInputs deklarieren (wird in Closure referenziert)
    const rangeSpan = document.createElement('span');
    rangeSpan.style.cssText = 'font-size:10px;color:var(--text-muted);white-space:nowrap;padding-left:6px;opacity:0.85;';

    const updateDomainFromInputs = () => {
      // Manuelle Eingabe → Auto-Erkennung stoppen
      const _ds = _domSt(fn); _ds.userSet = true; clearTimeout(_ds.timer);
      const minV = vonInp.value.trim() === '' ? null : parseFloat(vonInp.value);
      const maxV = bisInp.value.trim() === '' ? null : parseFloat(bisInp.value);
      fn.domainMin = (minV != null && isFinite(minV)) ? minV : null;
      fn.domainMax = (maxV != null && isFinite(maxV)) ? maxV : null;
      // Manuell eingegebene Grenzen gelten per Konvention als eingeschlossen
      // (geschlossene Klammer) — der Nutzer hat diesen Wert ja selbst gewählt.
      fn.domainMinOpen = false; fn.domainMaxOpen = false;
      domainToggle.textContent = _domainLabel(fn);
      // Wertemenge nach kurzer Pause neu berechnen (rechenintensiv)
      clearTimeout(rangeSpan._rangeTimer);
      rangeSpan._rangeTimer = setTimeout(() =>
        _updateRangeSpan(fn.expr, fn.domainMin, fn.domainMax, fn.domainExcluded, fn.domainGaps, rangeSpan, fn.domainMinOpen, fn.domainMaxOpen), 300);
      clearEvalCache(); scheduleComputeSpecials();
      if (!historyPaused) { clearTimeout(_histDebounce); _histDebounce = setTimeout(pushHistory, 400); }
      scheduleDraw();
    };
    vonInp.oninput = updateDomainFromInputs;
    bisInp.oninput = updateDomainFromInputs;

    domainToggle.onclick = () => {
      const open = domainInputs.style.display === 'none';
      domainInputs.style.display = open ? 'flex' : 'none';
    };

    domainInputs.append(mkSpan('['), vonInp, mkSpan(','), bisInp, mkSpan(']'), domainClear);
    domainLine1.append(domainToggle, rangeSpan);
    domainRow.append(domainLine1, domainInputs);

    // Beim ersten Rendern mit befülltem Ausdruck aber ohne Domain: auto-erkennen
    if (fn.expr.trim() && fn.domainMin == null && fn.domainMax == null && !_domSt(fn).userSet) {
      const _ds = _domSt(fn);
      clearTimeout(_ds.timer);
      _ds.timer = setTimeout(() => {
        if (_domSt(fn).userSet) return;
        _applyDetectedDomain(fn, domainToggle, vonInp, bisInp, rangeSpan);
      }, 200);
    } else if (fn.expr.trim()) {
      // Domain bereits bekannt (z.B. nach manuellem Setzen oder Laden): Wertemenge sofort berechnen
      setTimeout(() => _updateRangeSpan(fn.expr, fn.domainMin, fn.domainMax, fn.domainExcluded, fn.domainGaps, rangeSpan, fn.domainMinOpen, fn.domainMaxOpen), 50);
    }

    const funcItem = document.createElement('div');
    funcItem.append(row, preview, domainRow, smartBtns, solvePanel);
    el.appendChild(funcItem);
    // 3-Strich-Kontextmenü auf sinnvolle Einträge reduzieren (siehe 14_mathinput.js) --
    // das math-field "mountet" sich intern erst asynchron nach dem Einhängen
    // ins DOM (nicht synchron danach). Ein einzelner Microtask reicht dafür
    // NICHT zuverlässig aus -- das führte (erst sichtbar geworden, nachdem das
    // g(x)-Aufschalten-Problem behoben war und dieser Codepfad dadurch
    // tatsächlich zuverlässig erreicht wird) zu vereinzelten "Mathfield not
    // mounted"-Fehlern. Wie bei mlPrewarmFocus() (14_mathinput.js) daher über
    // zwei requestAnimationFrame-Ticks verzögern; try/catch als zusätzliches
    // Sicherheitsnetz, falls der Mount ausnahmsweise selbst dann noch nicht
    // fertig ist (das Kontextmenü behält dann einfach die Standardeinträge --
    // kein funktionaler Schaden).
    requestAnimationFrame(() => requestAnimationFrame(() => {
      try { inp.menuItems = mlFilterMenuItems(inp.menuItems); } catch (ex) { /* siehe Kommentar oben */ }
    }));
    // Fokus-Warm-up (siehe mlPrewarmFocus(), 14_mathinput.js) — ohne das gehen
    // beim allerersten Fokussieren dieser frisch erzeugten Zeile die ersten
    // eingetippten Zeichen verloren/werden verstümmelt, falls sofort nach dem
    // Anklicken weitergetippt wird.
    mlPrewarmFocus(inp);
  });
  // Steigungsdreieck-Sektion anzeigen wenn lineare Funktion vorhanden
  const le = document.getElementById('linear-extra');
  if (le) {
    const hasLinearFn = functions.some(fn => fn.expr && fn.expr.trim() && fn.visible !== false && isLinearFunc(fn.expr));
    if (hasLinearFn) le.style.display = 'block';
    // Nur verstecken wenn KEIN linear-live Typ und keine lineare Funktion
    else {
      const fitType = document.getElementById('fit-type')?.value;
      if (fitType !== 'linear_live' && fitType !== 'linear') le.style.display = 'none';
    }
  }
  // Smart-Buttons nach Neuaufbau der Liste aktualisieren
  if (typeof updateSmartButtons === 'function') updateSmartButtons();
  updateFuncLabelsOverlay();
}

// Synchronisiert die Sichtbarkeit der Steigungsdreieck-Sektion
function syncLinearExtra() {
  const le = document.getElementById('linear-extra');
  if (!le) return;
  const hasLinearFn = functions.some(fn => fn.expr && fn.expr.trim() && fn.visible !== false && isLinearFunc(fn.expr));
  const fitType = document.getElementById('fit-type')?.value;
  if (hasLinearFn || fitType === 'linear' || fitType === 'linear_live') {
    le.style.display = 'block';
  } else {
    le.style.display = 'none';
  }
}

// Öffnet den Farbwähler-Popup für Funktion i
let colorPickerFi = -1;
function openColorPicker(e, fi) {
  colorPickerFi = fi;
  const popup = document.getElementById('color-popup');
  popup.innerHTML = '';
  ALL_COLORS.forEach(col => {
    const sw = document.createElement('div'); sw.className = 'color-swatch';
    sw.style.background = col;
    if (col === functions[fi]?.color) sw.classList.add('selected');
    sw.onclick = ev => { ev.stopPropagation(); if (functions[colorPickerFi]) { functions[colorPickerFi].color = col; } renderFuncList(); scheduleDraw(); closeColorPicker(); };
    popup.appendChild(sw);
  });
  popup.classList.add('active');
  // Positionieren nahe dem Klick-Punkt
  const rect = e.target.getBoundingClientRect();
  popup.style.left = (rect.right + 4) + 'px';
  popup.style.top = Math.min(rect.top, window.innerHeight - 160) + 'px';
}
function closeColorPicker() {
  document.getElementById('color-popup').classList.remove('active');
  colorPickerFi = -1;
}
// Klick irgendwo sonst schliesst den Picker
document.addEventListener('click', e => {
  const popup = document.getElementById('color-popup');
  if (popup && popup.classList.contains('active') && !popup.contains(e.target)) closeColorPicker();
});

// Neue leere Funktion hinzufügen und Eingabefeld fokussieren
function addFunction() {
  functions.push({ expr: '', color: COLORS[functions.length % COLORS.length], visible: true });
  renderFuncList(); syncParams();
  document.getElementById('func-list').lastChild?.querySelector('input')?.focus();
}

// Neue Funktion mit vorgegebenem Rohausdruck hinzufügen (z.B. Ableitung oder
// Stammfunktion eines bestehenden f_i) — wird über die Analysis-Knöpfe unter
// dem Eingabefeld aufgerufen (siehe appendCalculusButtons()).
function addDerivedFunction(rawExpr) {
  functions.push({ expr: rawExpr, color: COLORS[functions.length % COLORS.length], visible: true });
  clearEvalCache(); renderFuncList(); syncParams(); scheduleComputeSpecials();
  
  pushHistory(); scheduleDraw();
}

// ── Trigonometrische Funktionen: sin/cos/tan mit Einheitskreis-Punkt ─────
// "Aufschalten"-Knöpfe im Panel "Trigonometrische Funktionen" (Unterrichts-
// Feature, analog zu linAddSlopeForm() in 11_fitting.js): fügt sin(x)/cos(x)/
// tan(x) hinzu (falls nicht schon vorhanden) und aktiviert den Einheitskreis
// (chk-unitcircle). Es gibt dafür EINEN einzigen ziehbaren Punkt — den ganz
// normalen, bereits bestehenden Einheitskreis-Punkt (unitCirclePts, siehe
// findNearCirclePt()/unitCircleHandleClick() in 08_draw.js). drawUnitCircle()
// zeichnet für jeden unitCirclePts-Eintrag ohnehin schon automatisch die
// Projektion (Hypotenuse + Gegen-/Ankathete + gestrichelte Linie) auf JEDE
// sichtbare sin/cos/tan-Funktion — das ist also derselbe Punkt, der sowohl
// auf dem Kreis als auch (via seiner Projektion) auf dem Graphen erscheint.
// Ziehen geht von beiden Seiten: auf dem Kreis direkt (drag.type='circlept',
// 09_events.js) oder auf dem Projektions-Punkt auf dem Graphen
// (drag.type='trigproj', nutzt findNearTrigProjDot() in 08_draw.js) — beide
// Wege ändern denselben unitCirclePts[i].angle.
// (Frühere Version nutzte zusätzlich einen zweiten, unabhängigen Punkt auf
// graphPoints — das führte zu zwei sich überlagernden/konkurrierenden
// Punkten für dieselbe Sache und wurde deshalb wieder entfernt.)
function trigAddFunction(kind) {
  const exprMap = { sin: 'sin(x)', cos: 'cos(x)', tan: 'tan(x)' };
  const expr = exprMap[kind];
  if (!expr) return;
  const norm = e => e.replace(/\s+/g, '');

  let fi = functions.findIndex(fn => norm(fn.expr) === expr);
  if (fi === -1) {
    functions.push({ expr, color: COLORS[functions.length % COLORS.length], visible: true });
    fi = functions.length - 1;
    clearEvalCache(); renderFuncList(); syncParams(); scheduleComputeSpecials();
  } else if (functions[fi].visible === false) {
    functions[fi].visible = true; // versteckte Funktion wieder einblenden
    renderFuncList(); scheduleComputeSpecials();
  }

  // Genau EIN gemeinsamer Einheitskreis-Punkt für alle aufgeschalteten
  // trigonometrischen Funktionen — nur anlegen, falls noch keiner existiert.
  if (unitCirclePts.length === 0) {
    unitCirclePts.push({ angle: PI / 4 }); // Start: 45°, dort sin=cos
  }
  document.getElementById('chk-unitcircle').checked = true;
  pushHistory();
  scheduleDraw();
}

// ── Differenzenquotient-Applet: "Einstieg ins Thema Differentialrechnung" ──
// Aufschalten-Knopf im Panel "Differenzenquotient" (siehe index.html): liest
// die im math-field #diffquot-fn-input eingegebene Funktion (Fallback x²,
// falls das Feld leer ist) und legt den State für Punkt A und Punkt B an —
// analog zu trigAddFunction()/linAddSlopeForm(). BEIDE Punkte sind ziehbar
// (Nutzerwunsch) — anders als in einer früheren Version, in der A fix war.
// Erneutes Klicken (z.B. nach dem Ziehen von A/B, oder mit geänderter
// Funktion im Eingabefeld) setzt A/B auf sinnvolle, für die jeweilige
// Funktion gültige Startpunkte zurück (_dqPickStartPoints()) und passt den
// View entsprechend an (_dqFitView()). Ist der eingegebene Ausdruck ungültig
// oder an keiner sinnvollen Stelle definiert, wird das Eingabefeld rot
// gerahmt (gleiche Konvention wie loSetObjective(), 17_linopt.js) und NICHT
// aufgeschaltet — der bisherige Zustand bleibt unverändert erhalten.
function diffQuotSetup() {
  const inp = document.getElementById('diffquot-fn-input');
  const raw = inp ? (inp.getAttribute('data-raw') || '').trim() : '';
  const expr = raw || 'x^2';

  const pts = _dqPickStartPoints(expr);
  if (!pts) {
    if (inp) inp.style.borderColor = '#e24b4a';
    return;
  }
  if (inp) inp.style.borderColor = '';

  const norm = e => e.replace(/\s+/g, '');
  let fi = functions.findIndex(fn => norm(fn.expr) === norm(expr));
  if (fi === -1) {
    fi = _fillEmptyOrNewFnSlot(expr);
    clearEvalCache(); renderFuncList(); syncParams(); scheduleComputeSpecials();
  } else if (functions[fi].visible === false) {
    functions[fi].visible = true; // versteckte Funktion wieder einblenden
    renderFuncList(); scheduleComputeSpecials();
  } else if (norm(functions[fi].expr) !== norm(expr)) {
    // Gleiche Stelle im Array, aber leicht abweichende (wenn auch äquivalente)
    // Schreibweise — Ausdruck aktualisieren, damit er exakt dem entspricht,
    // was im Eingabefeld steht.
    functions[fi].expr = expr;
    clearEvalCache(); renderFuncList(); scheduleComputeSpecials();
  }

  diffQuot = { fi, xA: pts.xA, xB: pts.xB };

  // View so anpassen, dass A und B (samt etwas Rand) bequem sichtbar sind —
  // generisch statt des früheren, auf x² zugeschnittenen festen Views. Nur
  // einmalig beim Aufschalten (nicht bei jedem Draw), damit spätere
  // Verschiebungen/Zoom durch den Nutzer erhalten bleiben.
  _dqFitView(pts.xA, pts.xB, expr);
  syncInputs();

  pushHistory();
  scheduleComputeSpecials();
  scheduleDraw();
}

// Sucht ein Paar Startpunkte (xA, xB) für eine beliebige Funktion, an denen
// beide Werte definiert (endlich) sind — nötig, da die früheren festen
// Defaults (xA=1, xB=3, eigentlich für x² gedacht) bei einer anderen Funktion
// z.B. an einer Definitionslücke (1/(x-1)) oder einem eingeschränkten
// Definitionsbereich (sqrt(x-5)) fehlschlagen können. Probiert zunächst eine
// Reihe plausibler Kandidatenpaare durch, dann als letzten Versuch ein
// grobes Raster über einen weiten Bereich. Gibt {xA, xB} zurück, oder null
// wenn KEIN Paar funktioniert (Ausdruck vermutlich leer/ungültig oder nirgends
// definiert).
function _dqPickStartPoints(expr) {
  if (!expr || !expr.trim()) return null;
  const candidates = [
    [1, 3], [0.5, 2], [-1, 1], [0.5, 1.5], [1, 2],
    [2, 4], [-2, -1], [0.1, 1], [-3, -1], [0.2, 0.5]
  ];
  for (const [a, b] of candidates) {
    const ya = safeEval(expr, a), yb = safeEval(expr, b);
    if (isFinite(ya) && isFinite(yb)) return { xA: a, xB: b };
  }
  // Letzter Versuch: grobes Raster über einen weiten Bereich absuchen —
  // deckt auch exotischere Definitionsbereiche ab.
  const found = [];
  for (let x = -20; x <= 20 && found.length < 2; x += 0.5) {
    if (isFinite(safeEval(expr, x))) found.push(x);
  }
  if (found.length >= 2) return { xA: found[0], xB: found[1] };
  return null;
}

// Passt den View so an, dass A und B (samt Rand) sichtbar sind — generische
// Ersetzung für den früheren festen View (der auf A(1|1)/B(3|9) bei f(x)=x²
// zugeschnitten war). Tastet zusätzlich ein paar Zwischenstellen um A/B ab,
// damit der sichtbare Kurvenverlauf zwischen den Punkten nicht durch den
// y-Bereich abgeschnitten wird.
function _dqFitView(xA, xB, expr) {
  const xLo = Math.min(xA, xB), xHi = Math.max(xA, xB);
  const xSpan = Math.max(xHi - xLo, 0.5);
  const sampleLo = xLo - xSpan, sampleHi = xHi + xSpan;
  const ys = [];
  for (let i = 0; i <= 10; i++) {
    const x = sampleLo + (sampleHi - sampleLo) * (i / 10);
    const y = safeEval(expr, x);
    if (isFinite(y)) ys.push(y);
  }
  const yA = safeEval(expr, xA), yB = safeEval(expr, xB);
  if (isFinite(yA)) ys.push(yA);
  if (isFinite(yB)) ys.push(yB);
  if (!ys.length) ys.push(0, 1);
  const ymin = Math.min(...ys), ymax = Math.max(...ys);
  const xPad = Math.max(xSpan * 0.8, 1);
  const yPad = Math.max((ymax - ymin) * 0.35, 1);
  view = { xmin: xLo - xPad, xmax: xHi + xPad, ymin: ymin - yPad, ymax: ymax + yPad };
}

// Richtet das Funktions-Eingabefeld (#diffquot-fn-input, math-field) einmalig
// ein — analog zu loSetupObjectiveField() (17_linopt.js) bzw. dem Aufbau
// eines Funktionsfelds in renderFuncList() weiter oben in dieser Datei.
// Wird einmalig beim Start aufgerufen (siehe DOMContentLoaded in index.html).
function diffQuotSetupField() {
  const inp = document.getElementById('diffquot-fn-input');
  if (!inp || inp._dqSetup) return;
  inp._dqSetup = true;
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
    _mlMoveCursorToEnd(inp); // siehe 14_mathinput.js — Cursor-nach-setValue()-Fix
  }
  inp._mlSetFromRaw = mlSetFromRaw;
  // Bewusst leer statt mit "x^2" vorbelegt (frühere Version) -- Nutzer-Meldung:
  // Vorbelegte Felder lassen den Cursor beim Klicken+Sofort-Weitertippen an
  // einer für MathLive "falschen" Stelle stehen (siehe _mlMoveCursorToEnd(),
  // 14_mathinput.js -- der dortige Fix half nicht zuverlässig genug). Ein
  // leeres Feld umgeht das Problem komplett, da dann normal getippt wird
  // (genau wie beim ohnehin schon leeren ersten Funktionsfeld f1).
  mlSetFromRaw('');
  mlPrewarmFocus(inp); // siehe 14_mathinput.js — Fokus-Warm-up
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

// ── Ober-/Untersummen-Applet: "Einstieg in den Integralbegriff" ──
// Eigenständiger Menüpunkt (September 2026 wieder von "Fläche" getrennt,
// Nutzerwunsch). EIN Eingabefeld f(x) (#riemann-fn-input, Fallback x² falls
// leer). Der Aufschalten-Knopf legt den State für die Intervallgrenzen a und
// b an — analog zu diffQuotSetup() oben. Anders als beim Differenzenquotient
// liegen a und b auf der x-Achse (y=0), nicht auf der Kurve, da sie ein
// Intervall markieren statt eine Kurvenstelle. Erneutes Klicken (z.B. nach
// geänderter Funktion) setzt a/b neu. Ungültiger/nirgends definierter
// Ausdruck für f: Eingabefeld rot rahmen (gleiche Konvention wie
// diffQuotSetup()), NICHT aufschalten.
function riemannSetup() {
  const inp = document.getElementById('riemann-fn-input');
  const raw = inp ? (inp.getAttribute('data-raw') || '').trim() : '';
  const expr = raw || 'x^2';

  const iv = _riemannPickInterval(expr);
  if (!iv) {
    if (inp) inp.style.borderColor = '#e24b4a';
    return;
  }
  if (inp) inp.style.borderColor = '';

  const fi1 = _ensurePlottedFn(expr);

  const nSlider = document.getElementById('riemann-n-slider');
  const n = nSlider ? (parseInt(nSlider.value, 10) || 10) : 10;

  riemann = { fi1, xA: iv.xA, xB: iv.xB, n };

  // Symbolische Stammfunktion EINMALIG hier berechnen (nicht bei jedem
  // Neuzeichnen — calcIntegrate()/nerdamer.integrate() sind vergleichsweise
  // teuer) — siehe _riemannComputeAntideriv() unten. drawRiemann()
  // (08_draw.js) liest riemann.antiderivRaw nur noch aus und wertet ihn
  // numerisch an den aktuellen Grenzen a/b aus (billig).
  riemann.antiderivRaw = _riemannComputeAntideriv(expr);

  // View so anpassen, dass das Intervall samt Rand sichtbar ist — analog zu
  // _dqFitView() beim Differenzenquotient-Applet.
  _riemannFitView(iv.xA, iv.xB, expr);
  syncInputs();

  pushHistory();
  scheduleComputeSpecials();
  scheduleDraw();
}

// Füllt beim Anlegen einer neuen Funktion (aus Differenzenquotient/Ober- und
// Untersummen/Flächen — überall dort, wo der Nutzer eine Funktion NICHT direkt
// in der Funktionsliste, sondern über das eigene Eingabefeld eines Applets
// erzeugt) zuerst eine vorhandene LEERE Zeile (f_1, f_2, ...) auf, statt immer
// eine neue ans Ende anzuhängen. Nutzer-Meldung: "wird die oben automatisch zu
// f_2 zugewiesen auch wenn f_1 leer ist" — f_1 bleibt sonst dauerhaft leer,
// obwohl dort Platz wäre. Reihenfolge bleibt dabei unangetastet: die erste
// leere Zeile (per Array-Index) gewinnt, nicht zwingend f_1 im Speziellen.
// Behält die Farbe der wiederverwendeten Zeile bei (die hatte sie schon als
// leere Zeile), statt sie neu zuzuweisen.
function _fillEmptyOrNewFnSlot(exprStr) {
  const emptyIdx = functions.findIndex(fn => !fn.expr || !fn.expr.trim());
  if (emptyIdx !== -1) {
    functions[emptyIdx].expr = exprStr;
    functions[emptyIdx].visible = true;
    return emptyIdx;
  }
  functions.push({ expr: exprStr, color: COLORS[functions.length % COLORS.length], visible: true });
  return functions.length - 1;
}

// Sucht eine bestehende Funktion mit äquivalentem Ausdruck (bis auf
// Whitespace) und liefert deren Index, oder legt sie neu an — gemeinsamer
// Helfer für riemannSetup()/flaecheSetup() (gleiches "finde oder erstelle"-
// Muster wie an mehreren Stellen in diesem File, hier aber geteilt, da
// flaecheSetup() ihn für BIS ZU ZWEI Funktionen f/g braucht).
function _ensurePlottedFn(exprStr) {
  const norm = e => e.replace(/\s+/g, '');
  let fi = functions.findIndex(fn => norm(fn.expr) === norm(exprStr));
  if (fi === -1) {
    fi = _fillEmptyOrNewFnSlot(exprStr);
    clearEvalCache(); renderFuncList(); syncParams(); scheduleComputeSpecials();
  } else if (functions[fi].visible === false) {
    functions[fi].visible = true; // versteckte Funktion wieder einblenden
    renderFuncList(); scheduleComputeSpecials();
  } else if (norm(functions[fi].expr) !== norm(exprStr)) {
    // Gleiche Stelle im Array, aber leicht abweichende (wenn auch äquivalente)
    // Schreibweise — Ausdruck aktualisieren, damit er exakt dem entspricht,
    // was im Eingabefeld steht.
    functions[fi].expr = exprStr;
    clearEvalCache(); renderFuncList(); scheduleComputeSpecials();
  }
  return fi;
}

// ── Flächen-Applet ── siehe die ausführliche Dokumentation bei "let flaeche"
// (02_core.js) für die drei Randarten (axis 'x'/'y'/'g') und das Zahlenfeld-
// vs-Ziehen-Snapping-Verhalten. flaecheSetMode() schaltet zwischen den drei
// Randarten um (zeigt/versteckt #flaeche-fn2-input entsprechend). Aufschalten
// (Knopf, ruft flaecheSetup()) berechnet jeweils ein sinnvolles Startintervall
// und füllt DANACH die Zahlenfelder #flaeche-a-input/#flaeche-b-input mit den
// gefundenen Werten (Nutzer kann sie danach frei überschreiben).
function flaecheGetMode() {
  const sel = document.getElementById('flaeche-mode');
  return sel ? sel.value : 'x';
}

function flaecheSetMode() {
  const mode = flaecheGetMode();
  const row2 = document.getElementById('flaeche-fn2-row');
  if (row2) row2.style.display = mode === 'g' ? '' : 'none';
  const lblA = document.getElementById('flaeche-a-label');
  const lblB = document.getElementById('flaeche-b-label');
  if (lblA) lblA.textContent = mode === 'y' ? 'a (y) =' : 'a (x) =';
  if (lblB) lblB.textContent = mode === 'y' ? 'b (y) =' : 'b (x) =';
}

function flaecheSetup() {
  const inp = document.getElementById('flaeche-fn-input');
  const raw = inp ? (inp.getAttribute('data-raw') || '').trim() : '';
  const expr = raw || 'x^2';
  const mode = flaecheGetMode();

  const inp2 = document.getElementById('flaeche-fn2-input');
  const raw2 = inp2 ? (inp2.getAttribute('data-raw') || '').trim() : '';
  const gExpr = mode === 'g' ? (raw2 || null) : '0';

  if (mode === 'g' && !gExpr) {
    if (inp2) inp2.style.borderColor = '#e24b4a';
    return;
  }
  if (inp2) inp2.style.borderColor = '';

  let fi1, fi2 = null, a, b, antiderivRaw = null;

  if (mode === 'x' || mode === 'g') {
    const iv = _flaechePickXInterval(expr, gExpr);
    if (!iv) {
      if (inp) inp.style.borderColor = '#e24b4a';
      if (mode === 'g' && inp2) inp2.style.borderColor = '#e24b4a';
      return;
    }
    if (inp) inp.style.borderColor = '';
    fi1 = _ensurePlottedFn(expr);
    if (mode === 'g') fi2 = _ensurePlottedFn(gExpr);
    a = iv.xA; b = iv.xB;
    antiderivRaw = _riemannComputeAntiderivDiff(expr, gExpr);
    _riemannFitView(a, b, mode === 'g' ? [expr, gExpr] : expr);
  } else {
    // axis === 'y': Startintervall auf der y-Achse — die beiden y-Werte am
    // linken/rechten Rand der aktuellen View (siehe _flaechePickYInterval()
    // unten), kein Schnittpunkt-Snapping (keine zweite Kurve involviert).
    const iv = _flaechePickYInterval(expr);
    if (!iv) {
      if (inp) inp.style.borderColor = '#e24b4a';
      return;
    }
    if (inp) inp.style.borderColor = '';
    fi1 = _ensurePlottedFn(expr);
    a = iv.yA; b = iv.yB;
    // Keine symbolische Stammfunktion in diesem Modus (x(y) liegt i.A. nicht
    // symbolisch vor) — drawFlaeche() (08_draw.js) berechnet hier direkt eine
    // numerische Flächennäherung (Trapezregel über x(y), kontinuierlich
    // verfolgt per _flaecheYInvertNear() oben).
    _flaecheFitViewY(a, b, expr);
  }

  flaeche = { fi1, fi2, axis: mode, a, b, antiderivRaw };

  const aInp = document.getElementById('flaeche-a-input');
  const bInp = document.getElementById('flaeche-b-input');
  if (aInp) aInp.value = niceNumDec(a);
  if (bInp) bInp.value = niceNumDec(b);

  syncInputs();
  pushHistory();
  scheduleComputeSpecials();
  scheduleDraw();
}

// Wird von den Zahlenfeldern #flaeche-a-input/#flaeche-b-input bei jeder
// Änderung aufgerufen (oninput) — übernimmt den getippten Wert IMMER frei,
// OHNE Schnittpunkt-Snapping (Nutzerwunsch: Zahlen-Eingabe = freie Werte,
// nur das Ziehen im Graphen soll weiterhin snappen, siehe drag.type===
// 'flaechept' in 09_events.js). Ungültige/leere Eingabe wird ignoriert (alter
// Wert bleibt bestehen), bis eine gültige Zahl eingegeben wird.
function flaecheSetBound(which, val) {
  if (!flaeche) return;
  const n = parseFloat(val);
  if (!isFinite(n)) return;
  if (which === 'a') flaeche.a = n; else flaeche.b = n;
  scheduleDraw();
}

// Sucht ein sinnvolles Start-y-Intervall für den axis==='y'-Modus: der
// sichtbare y-Wertebereich von f über die aktuelle View (Minimum und Maximum
// der abgetasteten Werte) — analog im Geiste zu _riemannPickInterval(), aber
// für y-Grenzen statt x-Grenzen. WICHTIG: bewusst Minimum/Maximum statt der
// Werte an den beiden Rändern (x=xmin/x=xmax) — bei achsensymmetrischen
// Funktionen wie x^2 sind Rand-Werte oft IDENTISCH (f(-10)=f(10)=100), was
// ein degeneriertes Nullintervall ergäbe, obwohl die Kurve sichtbar einen
// grossen y-Bereich überstreicht. Gibt null zurück, wenn f im gesamten
// Suchbereich nirgends endlich ist oder (nahezu) konstant ist (kein
// sinnvolles Intervall).
function _flaechePickYInterval(expr) {
  const xLo = view.xmin, xHi = view.xmax;
  const steps = 60;
  let yMin = null, yMax = null;
  for (let i = 0; i <= steps; i++) {
    const x = xLo + (xHi - xLo) * (i / steps);
    const y = safeEval(expr, x);
    if (!isFinite(y)) continue;
    if (yMin === null || y < yMin) yMin = y;
    if (yMax === null || y > yMax) yMax = y;
  }
  if (yMin === null || yMax === null || Math.abs(yMax - yMin) < 1e-9) return null;
  return { yA: yMin, yB: yMax };
}

// Passt den View für den axis==='y'-Modus an: schliesst das y-Intervall
// [yA, yB] (samt Rand) UND die y-Achse (x=0) sowie die zugehörigen x(y)-Werte
// ein — analog im Geiste zu _riemannFitView(), aber für ein y- statt ein
// x-Intervall. Sucht x(y) an mehreren Stützstellen zwischen yA und yB (über
// den bisherigen View-x-Bereich als Suchraum, mit Rand — siehe
// _riemannIsectSearchRange()) und spannt den View so auf, dass Kurve,
// y-Achse und beide Grenzlinien y=yA/y=yB sichtbar sind.
function _flaecheFitViewY(yA, yB, expr) {
  const yLo = Math.min(yA, yB), yHi = Math.max(yA, yB);
  const [xSearchLo, xSearchHi] = _riemannIsectSearchRange();
  const xs = [0]; // y-Achse immer einschliessen
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const y = yLo + (yHi - yLo) * (i / steps);
    const x = _flaecheYInvert(expr, y, xSearchLo, xSearchHi);
    if (x !== null) xs.push(x);
  }
  if (xs.length === 1) xs.push(1); // Fallback: keine Inversion gefunden
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  const ySpan = Math.max(yHi - yLo, 0.5);
  const xSpan = Math.max(xmax - xmin, 0.5);
  const yPad = Math.max(ySpan * 0.4, 1);
  const xPad = Math.max(xSpan * 0.3, 1);
  view = { xmin: xmin - xPad, xmax: xmax + xPad, ymin: yLo - yPad, ymax: yHi + yPad };
}

// Invertiert y=f(x) numerisch für ein gegebenes y — sucht ALLE x mit f(x)=y
// im Bereich [xLo, xHi] (Wiederverwendung von _riemannFindIntersections()
// gegen die KONSTANTE y, exakt dasselbe Bisektionsverfahren wie beim
// Schnittpunkte-Suchen zwischen zwei Funktionen) und liefert die Lösung mit
// dem kleinsten Abstand zur y-Achse (bei mehrdeutigen/nicht-monotonen
// Funktionen die "innerste" Lösung — bei den in der Schule üblichen
// monotonen Abschnitten gibt es ohnehin nur eine). null, wenn f den Wert y
// im Suchbereich nirgends annimmt.
function _flaecheYInvert(expr, y, xLo, xHi) {
  const roots = _riemannFindIntersections(expr, String(y), xLo, xHi);
  if (!roots.length) return null;
  roots.sort((r1, r2) => Math.abs(r1) - Math.abs(r2));
  return roots[0];
}

// Wie _flaecheYInvert(), aber verankert auf einen bekannten Nachbarwert
// xNear statt global "die Lösung am nächsten zur y-Achse" zu suchen — dafür
// aus zwei Gründen nötig: (1) PERFORMANCE — _flaecheYInvert() macht pro
// Aufruf eine globale, 4000 Stützstellen dichte Suche; drawFlaeche()
// (08_draw.js) ruft die Inversion aber für JEDEN Pixel-/Stützstellen-Schritt
// entlang der Kurve auf, was bei tausenden Aufrufen pro Neuzeichnung
// (insbesondere während des Ziehens) extrem langsam wird. Die lokale Suche
// hier nutzt nur "steps" (klein) Stützstellen in einem schmalen Fenster um
// xNear. (2) KORREKTHEIT — bei NICHT
// injektiven Funktionen wie x² gibt es zu einem y i.A. MEHRERE x-Lösungen
// (z.B. +2 und −2 für y=4); die globale "am nächsten zur y-Achse"-Regel kann
// zwischen den beiden Ästen hin- und herspringen, sobald beide (nahezu)
// gleich weit entfernt sind — das erzeugte den Zickzack-/Streifen-Fülleffekt
// beim Zeichnen. Mit einer auf den VORHERIGEN Punkt verankerten Suche bleibt
// die Kurve durchgehend auf demselben Ast. Fällt auf die globale Suche
// zurück, wenn im lokalen Fenster nichts gefunden wird (z.B. Rand des
// Definitionsbereichs oder ein senkrechter Kurvenabschnitt, wo x(y) im
// Fenster keine Lösung hat).
function _flaecheYInvertNear(expr, y, xNear, radius, xSearchLo, xSearchHi) {
  const lo = Math.max(xNear - radius, xSearchLo);
  const hi = Math.min(xNear + radius, xSearchHi);
  if (hi > lo) {
    const roots = _riemannFindIntersections(expr, String(y), lo, hi, 100);
    if (roots.length) {
      let best = roots[0], bestD = Math.abs(roots[0] - xNear);
      for (const r of roots) { const d = Math.abs(r - xNear); if (d < bestD) { bestD = d; best = r; } }
      return best;
    }
  }
  return _flaecheYInvert(expr, y, xSearchLo, xSearchHi);
}

// Berechnet den x-Suchbereich für Schnittpunkt-Suche (_riemannFindIntersections)
// relativ zur aktuellen View — ein View breit auf jeder Seite zusätzlich, damit
// auch knapp ausserhalb des sichtbaren Bereichs liegende Schnittpunkte beim
// Ziehen erreichbar sind, aber die Suche nicht beliebig weit (und langsam)
// über den für den Nutzer relevanten Bereich hinausgeht.
function _riemannIsectSearchRange() {
  const vw = Math.max(view.xmax - view.xmin, 1);
  return [view.xmin - vw, view.xmax + vw];
}

// Sucht ALLE Schnittpunkte (x-Werte mit f(x)=g(x)) im Bereich [xLo, xHi] —
// Vorzeichenwechsel von f−g abtasten (dense sampling) + Bisektion, exakt das
// gleiche numerische Verfahren wie die "Schnittpunkte zwischen Funktionen"-
// Suche in computeSpecials() (04_analysis.js), aber über einen fest
// vorgegebenen Bereich statt der aktuellen View (wird u.a. beim initialen
// Aufschalten VOR dem View-Fit gebraucht) und OHNE spätere Nerdamer-
// Verfeinerung (hier reicht die numerische Genauigkeit für Snapping völlig).
// steps (optional, Default 4000): Anzahl Stichproben — von
// _flaecheYInvertNear() bewusst KLEIN gewählt für eine schnelle lokale Suche
// (siehe dort), alle anderen Aufrufer lassen den Default stehen.
function _riemannFindIntersections(expr1, expr2, xLo, xHi, steps) {
  steps = steps || 4000;
  const dx = (xHi - xLo) / steps;
  const roots = [];
  // Toleranz für "trifft eine Stichprobe direkt (fast) exakt" — siehe unten.
  const EPS = 1e-6;
  const pushRoot = x => { if (!roots.some(r => Math.abs(r - x) < 1e-6)) roots.push(x); };
  let pd = null, ppx = null;
  for (let s = 0; s <= steps; s++) {
    const x = xLo + s * dx;
    const y1 = safeEval(expr1, x), y2 = safeEval(expr2, x);
    if (!isFinite(y1) || !isFinite(y2)) { pd = null; continue; }
    const d = y1 - y2;
    if (pd === null) {
      // Direkt nach einer Definitionslücke (oder ganz am Anfang des Bereichs)
      // neu gestartet — es gibt kein voriges Vorzeichen zum Vergleichen, die
      // übliche Vorzeichenwechsel-Erkennung unten greift hier also nicht.
      // Liegt der Schnittpunkt aber GENAU auf dieser ersten gültigen
      // Stichprobe (Beispiel: sqrt(x) vs. x^2 — deren einzige Definitions-
      // lücke bei x<0 endet exakt bei x=0, wo beide Funktionen ausserdem
      // übereinstimmen), würde dieser Schnittpunkt sonst NIE erkannt.
      // Deshalb separat auf "praktisch Null" prüfen.
      if (Math.abs(d) < EPS) pushRoot(x);
    } else if (Math.sign(d) !== Math.sign(pd) && pd !== 0) {
      let lo = ppx, hi = x;
      for (let it = 0; it < 40; it++) {
        const m = (lo + hi) / 2;
        const dm = safeEval(expr1, m) - safeEval(expr2, m);
        if (Math.sign(dm) === Math.sign(pd)) lo = m; else hi = m;
      }
      pushRoot((lo + hi) / 2);
    }
    pd = d; ppx = x;
  }
  return roots;
}

// Wählt ein Startintervall [xA, xB] für den Zwei-Funktionen-Modus: die beiden
// Schnittpunkte von f und g, die x=0 einschliessen (bzw. — falls keine dies
// tun, oder x=0 selbst ausserhalb liegt — die beiden Schnittpunkte mit dem
// kleinsten Abstand zu 0). Sucht zunächst im (View±1 View)-Bereich
// (_riemannIsectSearchRange()), bei weniger als 2 Treffern zusätzlich in
// einem grosszügigen festen Bereich — deckt auch den Fall ab, dass die
// aktuelle View zufällig in einen schnittpunktfreien Ausschnitt gezoomt ist.
// Gibt null zurück, wenn insgesamt weniger als 2 Schnittpunkte gefunden
// wurden (kein sinnvolles Flächenintervall möglich).
function _riemannPickIsectInterval(expr1, expr2) {
  const [vlo, vhi] = _riemannIsectSearchRange();
  let roots = _riemannFindIntersections(expr1, expr2, vlo, vhi);
  if (roots.length < 2) {
    const wide = _riemannFindIntersections(expr1, expr2, -100, 100);
    if (wide.length > roots.length) roots = wide;
  }
  if (roots.length < 2) return null;
  roots.sort((a, b) => a - b);
  // Grösster Schnittpunkt <= 0 und kleinster Schnittpunkt > 0 (NICHT >= 0 --
  // liegt ein Schnittpunkt exakt bei x=0 selbst, wie z.B. bei sqrt(x) vs.
  // x^2, würde er sonst in BEIDEN Filtern landen und below/above zeigten auf
  // denselben Eintrag statt auf sein Nachbarpaar, sodass xA=xB=0 ein
  // entartetes Nullintervall ergäbe statt des eigentlichen [0, nächster
  // positiver Schnittpunkt]).
  let belowIdx = -1, aboveIdx = -1;
  for (let i = 0; i < roots.length; i++) if (roots[i] <= 0) belowIdx = i;
  for (let i = 0; i < roots.length; i++) if (roots[i] > 0) { aboveIdx = i; break; }
  if (belowIdx !== -1 && aboveIdx !== -1) {
    return { xA: roots[belowIdx], xB: roots[aboveIdx] };
  }
  const sorted = roots.slice().sort((a, b) => Math.abs(a) - Math.abs(b));
  const two = [sorted[0], sorted[1]].sort((a, b) => a - b);
  return { xA: two[0], xB: two[1] };
}

// Snapt eine gezogene x-Position auf den nächstgelegenen Schnittpunkt aus
// isects, aber NUR wenn dieser nah genug ist (innerhalb snapDist, siehe
// Aufrufer für die Umrechnung von Bildschirm-Pixeln in Daten-Einheiten,
// gleiche SNAP_PX-Konvention wie z.B. bei graphpt/loobj in 09_events.js) —
// Nutzerwunsch: "sie sollten an den Schnittpunkten snappen, aber diese auch
// wieder verlassen, wenn ich den Punkt weiterziehe". Ist kein Schnittpunkt
// nah genug, wird stattdessen die freie Mausposition übernommen.
// WICHTIG: KEIN "darf den anderen Punkt nicht überspringen"-Constraint mehr
// (frühere Version hatte das analog zu diffquotpt/riemannpt) — a und b
// dürfen sich beim Ziehen frei überholen. Grund: dieser Constraint erzeugte
// einen Deadlock, sobald a und b sich berührten — die beim Antippen des
// verschmolzenen Punkts EINMALIG festgelegte Seite ("a≥b" oder "a≤b") liess
// sich dann nur noch in EINER Richtung verlassen, die andere Richtung blieb
// für immer gesperrt (gemeldeter Fehler: "wenn sich a und b treffen,
// verschwinden sie beide und ich kann sie nicht mehr auseinanderziehen").
// drawFlaeche()/die Flächenberechnung nutzen ohnehin überall lo=min(a,b)/
// hi=max(a,b), ein Vertauschen von a und b ist also technisch unbedenklich.
function _riemannSnapX(rawX, isects, snapDist) {
  if (!isects || !isects.length) return rawX;
  let best = isects[0], bestD = Math.abs(isects[0] - rawX);
  for (const x of isects) { const d = Math.abs(x - rawX); if (d < bestD) { bestD = d; best = x; } }
  return (snapDist != null && bestD >= snapDist) ? rawX : best;
}

// Symbolische Stammfunktion F von f (nach x), als Rohausdruck-String (miToRaw)
// — nutzt calcIntegrate() (16_calculus.js: bevorzugt nerdamer.integrate(),
// numerisch gegengeprüft, mit Fallback auf die eigene bereichsbeschränkte
// Engine). Gibt null zurück, wenn keine elementare Stammfunktion gefunden
// wurde (drawRiemann() zeigt dann die bisherige rein numerische Näherung).
function _riemannComputeAntideriv(expr) {
  try {
    const ast = miParseRaw(expr);
    const iAst = calcIntegrate(ast, 'x');
    if (!iAst) return null;
    return miToRaw(iAst, 0);
  } catch (ex) { return null; }
}

// Wie _riemannComputeAntideriv(), aber für die Differenz f−g (Stammfunktion
// von f−g liefert direkt das bestimmte Integral ∫(f−g)dx = F(b)−F(a); da a/b
// im Zwei-Funktionen-Modus stets zwischen zwei Schnittpunkten liegen, ändert
// f−g dort das Vorzeichen nicht, und |F(b)−F(a)| entspricht daher der Fläche
// zwischen f und g im Intervall — siehe drawRiemann(), 08_draw.js).
function _riemannComputeAntiderivDiff(expr1, expr2) {
  try {
    const ast1 = miParseRaw(expr1), ast2 = miParseRaw(expr2);
    const iAst = calcIntegrate({ type: 'sub', a: ast1, b: ast2 }, 'x');
    if (!iAst) return null;
    return miToRaw(iAst, 0);
  } catch (ex) { return null; }
}

// Sucht ein Start-x-Intervall für den Flächen-Modus 'x'/'g': bevorzugt über
// Schnittpunkte von f und g (bzw. f und der x-Achse) ein natürlich
// begrenztes Intervall (_riemannPickIsectInterval()) — ideal, wenn eine
// solche Fläche existiert (z.B. zwei sich schneidende Parabeln, oder eine
// Funktion mit zwei Nullstellen). WICHTIG: viele im Unterricht übliche
// Funktionen haben aber KEIN solches Schnittpunkt-Paar — z.B. berührt x^2
// die x-Achse nur einmal (bei x=0), oder f und g schneiden sich gar nicht
// (z.B. f=x^2+5 gegenüber g=x). "Aufschalten" darf in diesen Fällen NICHT
// einfach nichts tun (Nutzer-Beschwerde: "passiert gar nichts") — stattdessen
// Fallback auf _riemannPickInterval(expr) (dasselbe generische "wo ist f
// überwiegend definiert"-Intervall wie beim Ober-/Untersummen-Panel), das
// der Nutzer danach über die Zahlenfelder oder per Ziehen frei anpassen kann.
function _flaechePickXInterval(expr, gExpr) {
  const iv = _riemannPickIsectInterval(expr, gExpr);
  if (iv) return iv;
  return _riemannPickInterval(expr);
}

// Sucht ein sinnvolles Startintervall [xA, xB] für eine beliebige Funktion, in
// dem sie überwiegend definiert ist — analog zu _dqPickStartPoints() oben,
// aber für ein ganzes Intervall statt zwei Einzelpunkte (die Grenzen selbst
// liegen auf der x-Achse und sind daher immer "definiert"; entscheidend ist,
// dass die Funktion IM Intervall an genügend Stellen einen endlichen Wert
// hat, sonst wären keine sinnvollen Rechtecke zu sehen). Gibt {xA, xB}
// zurück, oder null, wenn der Ausdruck nirgends brauchbar definiert ist.
function _riemannPickInterval(expr) {
  if (!expr || !expr.trim()) return null;
  const candidates = [
    [0, 2], [0, 1], [-1, 1], [1, 3], [0.5, 2.5],
    [-2, 2], [0.1, 2], [-3, -1], [2, 4], [0.2, 1.5]
  ];
  const enoughDefined = (a, b) => {
    let ok = 0;
    for (let i = 0; i <= 10; i++) {
      const x = a + (b - a) * (i / 10);
      if (isFinite(safeEval(expr, x))) ok++;
    }
    return ok >= 8; // mind. 8 von 11 Stichproben endlich
  };
  for (const [a, b] of candidates) {
    if (enoughDefined(a, b)) return { xA: a, xB: b };
  }
  // Letzter Versuch: grobes Raster über einen weiten Bereich absuchen, um
  // einen zusammenhängenden definierten Abschnitt zu finden.
  const defined = [];
  for (let x = -20; x <= 20; x += 0.25) {
    defined.push(isFinite(safeEval(expr, x)) ? x : null);
  }
  let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
  for (let i = 0; i < defined.length; i++) {
    if (defined[i] !== null) {
      if (curStart === -1) curStart = i;
      curLen++;
      if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
    } else {
      curStart = -1; curLen = 0;
    }
  }
  if (bestLen >= 4) {
    const xA = defined[bestStart];
    const xB = defined[bestStart + bestLen - 1];
    if (xB > xA) return { xA, xB };
  }
  return null;
}

// Passt den View so an, dass das Intervall [xA, xB] samt Rand sichtbar ist —
// analog zu _dqFitView() beim Differenzenquotient-Applet, aber die x-Achse
// (y=0) wird immer eingeschlossen, da die Rechtecke dort beginnen.
// exprOrExprs: ein einzelner Ausdruck (String) ODER ein Array von Ausdrücken
// (im Zwei-Funktionen-Modus, damit BEIDE Kurven beim Einpassen berücksichtigt
// werden).
function _riemannFitView(xA, xB, exprOrExprs) {
  const exprs = Array.isArray(exprOrExprs) ? exprOrExprs : [exprOrExprs];
  const xLo = Math.min(xA, xB), xHi = Math.max(xA, xB);
  const xSpan = Math.max(xHi - xLo, 0.5);
  const sampleLo = xLo - xSpan * 0.3, sampleHi = xHi + xSpan * 0.3;
  const ys = [0]; // x-Achse immer einschliessen
  for (let i = 0; i <= 20; i++) {
    const x = sampleLo + (sampleHi - sampleLo) * (i / 20);
    exprs.forEach(expr => {
      const y = safeEval(expr, x);
      if (isFinite(y)) ys.push(y);
    });
  }
  if (ys.length === 1) ys.push(1);
  const ymin = Math.min(...ys), ymax = Math.max(...ys);
  const xPad = Math.max(xSpan * 0.6, 1);
  const yPad = Math.max((ymax - ymin) * 0.25, 1);
  view = { xmin: xLo - xPad, xmax: xHi + xPad, ymin: ymin - yPad, ymax: ymax + yPad };
}

// Richtet das Funktions-Eingabefeld des Panels ein (#riemann-fn-input) —
// exakt analog zu diffQuotSetupField() oben. Wird einmalig beim Start
// aufgerufen (siehe DOMContentLoaded in index.html).
function riemannSetupField() {
  function setupOne(inp, defaultRaw) {
    if (!inp || inp._riemannSetup) return;
    inp._riemannSetup = true;
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
      _mlMoveCursorToEnd(inp); // siehe 14_mathinput.js — Cursor-nach-setValue()-Fix
    }
    inp._mlSetFromRaw = mlSetFromRaw;
    mlSetFromRaw(defaultRaw);
    // Fokus-"Warm-up" (siehe mlPrewarmFocus(), 14_mathinput.js).
    mlPrewarmFocus(inp);
    inp.addEventListener('focusin', () => { inp.style.borderColor = '#378ADD'; setActiveInput(inp, -1); });
    inp.addEventListener('focusout', () => { inp.style.borderColor = ''; });
    inp.addEventListener('input', () => {
      let raw;
      try { raw = asciiMathToRaw(inp.getValue('ascii-math')); }
      catch (ex) { return; }
      inp.setAttribute('data-raw', raw);
      inp.style.borderColor = '';
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
  }
  setupOne(document.getElementById('riemann-fn-input'), ''); // leer statt "x^2" -- siehe diffQuotSetupField() oben
}

// Richtet BEIDE Funktions-Eingabefelder des Flächen-Panels ein
// (#flaeche-fn-input für f, #flaeche-fn2-input für das nur bei
// axis==='g' sichtbare g) — exakt dasselbe Muster wie riemannSetupField()
// oben (bewusst dupliziert statt geteilt, analog zur bestehenden Konvention
// in diesem File, jedes Applet richtet seine eigenen Felder selbst ein).
// Wird einmalig beim Start aufgerufen (siehe DOMContentLoaded in index.html).
function flaecheSetupField() {
  function setupOne(inp, defaultRaw) {
    if (!inp || inp._riemannSetup) return;
    inp._riemannSetup = true;
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
      _mlMoveCursorToEnd(inp); // siehe 14_mathinput.js — Cursor-nach-setValue()-Fix
    }
    inp._mlSetFromRaw = mlSetFromRaw;
    // WICHTIG: immer aufrufen, auch mit defaultRaw='' (g-Feld) — analog zum
    // etablierten Muster bei den einzelnen Funktions-Zeilen (mlSetFromRaw(fn.expr)
    // weiter oben, unconditional) — setzt explizit inp.value = '' und
    // data-raw = '' statt das Attribut ganz wegzulassen (Konsistenz).
    mlSetFromRaw(defaultRaw);
    // Fokus-"Warm-up" (siehe mlPrewarmFocus(), 14_mathinput.js) — behebt den
    // eigentlichen Grund für "g(x) wird beim Aufschalten ignoriert": ohne
    // diesen Warm-up gehen die ersten Zeichen verloren/werden verstümmelt,
    // wenn man das Feld anklickt und SOFORT weitertippt (typischer Ablauf
    // beim erstmaligen Ausfüllen von g(x)).
    mlPrewarmFocus(inp);
    inp.addEventListener('focusin', () => { inp.style.borderColor = '#378ADD'; setActiveInput(inp, -1); });
    inp.addEventListener('focusout', () => { inp.style.borderColor = ''; });
    inp.addEventListener('input', () => {
      let raw;
      try { raw = asciiMathToRaw(inp.getValue('ascii-math')); }
      catch (ex) { return; }
      inp.setAttribute('data-raw', raw);
      inp.style.borderColor = '';
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
  }
  setupOne(document.getElementById('flaeche-fn-input'), ''); // leer statt "x^2" -- siehe diffQuotSetupField() oben
  setupOne(document.getElementById('flaeche-fn2-input'), '');
}

// Wird vom n-Schieberegler (#riemann-n-slider, siehe index.html) bei jeder
// Bewegung aufgerufen — passt nur riemann.n an (kein Neuaufbau der
// Intervallgrenzen/des Views nötig) und aktualisiert die Zahl daneben
// (#riemann-n-val). Kein pushHistory() hier (würde bei jeder Zwischenposition
// des Schiebereglers die Historie zumüllen) — analog zum Verhalten der
// generischen Parameter-Schieberegler (syncParams(), 03_math.js).
function riemannSetN(val) {
  const n = Math.max(1, parseInt(val, 10) || 1);
  const valSpan = document.getElementById('riemann-n-val');
  if (valSpan) valSpan.textContent = String(n);
  if (riemann) {
    riemann.n = n;
    scheduleDraw();
  }
}

// Alles löschen (Funktionen, Punkte, Geraden, Einheitskreis-Punkte, Graph-Punkte)
function clearAll() {
  functions = []; params = {}; points = []; specials = []; graphPoints = []; unitCirclePts = []; linkedLines = [];
  line2ptPicking = false; line2ptPts = []; slopeTriPts = []; slopeTriPtsMap = {}; diffQuot = null; riemann = null; flaeche = null; clearEvalCache();
  // Senkrechte/Mittelsenkrechte-Referenzen zurücksetzen (siehe 11_fitting.js) —
  // sonst würden nach dem Löschen alte fi-Indizes auf neue, unabhängige
  // Funktionen zeigen und drawPerpMarkers() falsche Marker zeichnen.
  perpMeta = {}; linActiveFi = -1; linPerpFi = -1; linBisectorFi = -1;
  if (typeof _perpFlowStop === 'function') _perpFlowStop(); // laufenden Senkrechte/Mittelsenkrechte-Klickablauf abbrechen
  const perpRes = document.getElementById('lin-perp-result'); if (perpRes) perpRes.textContent = '';
  // Lineare Optimierung zurücksetzen (siehe 17_linopt.js)
  if (typeof loConstraints !== 'undefined') {
    loConstraints = []; loObjA = 1; loObjB = 1; loObjK = 0; loObjActive = false; loMode = 'max';
    loObjKMin = -10; loObjKMax = 10;
    if (typeof clearLoEvalCache === 'function') clearLoEvalCache();
    if (typeof renderLoConstraints === 'function') renderLoConstraints();
    const loBox = document.getElementById('lo-loesungsweg-box'); if (loBox) { loBox.innerHTML = ''; loBox.style.display = ''; }
    const loInp = document.getElementById('lo-obj-input');
    if (loInp) { (loInp._mlSetFromRaw ? loInp._mlSetFromRaw('') : (loInp.value = '')); loInp.style.borderColor = ''; }
    if (typeof loSyncObjSliderFull === 'function') loSyncObjSliderFull();
    document.getElementById('lo-mode-max')?.classList.add('active-btn');
    document.getElementById('lo-mode-min')?.classList.remove('active-btn');
  }
  // Folgen zurücksetzen (siehe 13_sequences.js) — fehlte bisher hier, wurde beim
  // Aufräumen des LaTeX-Exports entdeckt: "Alles löschen" liess bestehende Folgen
  // (Punkte + Verbindungslinie) sowohl auf dem Canvas als auch im Export unbemerkt
  // stehen.
  if (typeof sequences !== 'undefined') {
    sequences = [];
    if (typeof renderSeqList === 'function') renderSeqList();
  }
  renderFuncList(); renderPointList(); syncParams(); renderSpecialList(); scheduleDraw();
}

// View auf Standardbereich zurücksetzen
function resetView() { view = { xmin:-10, xmax:10, ymin:-6, ymax:6 }; syncInputs(); scheduleComputeSpecials(); scheduleDraw(); }

// Bereich aus den Eingabefeldern übernehmen
function applyRange() {
  view.xmin = parseFloat(document.getElementById('xmin').value) || view.xmin;
  view.xmax = parseFloat(document.getElementById('xmax').value) || view.xmax;
  view.ymin = parseFloat(document.getElementById('ymin').value) || view.ymin;
  view.ymax = parseFloat(document.getElementById('ymax').value) || view.ymax;
  scheduleComputeSpecials();  scheduleDraw();
}

// Schreibt den aktuellen View in die Eingabefelder
function syncInputs() {
  document.getElementById('xmin').value = parseFloat(view.xmin.toFixed(4));
  document.getElementById('xmax').value = parseFloat(view.xmax.toFixed(4));
  document.getElementById('ymin').value = parseFloat(view.ymin.toFixed(4));
  document.getElementById('ymax').value = parseFloat(view.ymax.toFixed(4));
}

// Zoom um Faktor: factor<1 = reinzoomen, factor>1 = rauszoomen
// Zoom-Zentrum: Mitte des aktuellen Views
// Anpassen: factor=1/2 für aggressiveres Zoomen
function zoomBy(factor) {
  const cx = (view.xmin + view.xmax) / 2, cy = (view.ymin + view.ymax) / 2;
  const hw = (view.xmax - view.xmin) / 2 * factor, hh = (view.ymax - view.ymin) / 2 * factor;
  view.xmin = cx - hw; view.xmax = cx + hw; view.ymin = cy - hh; view.ymax = cy + hh;
  syncInputs(); scheduleComputeSpecials();  scheduleDraw();
}

// Wird aufgerufen wenn isometrische Checkbox geändert wird
function onIsometricChange() { syncInputs(); scheduleDraw(); }

// Punkt-setzen-Modus (Klick ohne Alt setzt Punkt)
function togglePointMode() {
  pointMode = !pointMode; if (pointMode) { graphPtMode = false; line2ptPicking = false; deleteMode = false; }
  document.getElementById('point-mode-btn').classList.toggle('active-btn', pointMode);
  document.getElementById('graph-pt-btn').classList.remove('active-btn');
  document.getElementById('line2pt-btn').classList.remove('active-btn');
  document.getElementById('delete-mode-btn').classList.remove('active-btn');
  document.body.classList.remove('delete-mode');
  canvas.style.cursor = pointMode ? 'crosshair' : 'grab';
}

// Graph-Punkt-Modus (Klick legt Punkt auf nächste Kurve)
function toggleGraphPtMode() {
  graphPtMode = !graphPtMode; if (graphPtMode) { pointMode = false; line2ptPicking = false; deleteMode = false; }
  document.getElementById('graph-pt-btn').classList.toggle('active-btn', graphPtMode);
  document.getElementById('point-mode-btn').classList.remove('active-btn');
  document.getElementById('line2pt-btn').classList.remove('active-btn');
  document.getElementById('delete-mode-btn').classList.remove('active-btn');
  document.body.classList.remove('delete-mode');
  canvas.style.cursor = graphPtMode ? 'crosshair' : 'grab';
}

// Laserpointer-Modus: Maus/Stift/Touch zeigt großen roten Leuchtpunkt, kein Pan/Drag
function togglePointerMode() {
  pointerMode = !pointerMode;
  if (pointerMode) {
    pointMode = false; graphPtMode = false; deleteMode = false; line2ptPicking = false;
    document.getElementById('point-mode-btn').classList.remove('active-btn');
    document.getElementById('graph-pt-btn').classList.remove('active-btn');
    document.getElementById('delete-mode-btn').classList.remove('active-btn');
    document.body.classList.remove('delete-mode');
  } else {
    pointerPos = null;
  }
  document.getElementById('pointer-mode-btn').classList.toggle('active-btn', pointerMode);
  canvas.style.cursor = pointerMode ? 'none' : 'grab';
  scheduleDraw();
}

// Lösch-Modus: Klick auf beliebiges Objekt im Plot löscht es
function toggleDeleteMode() {
  deleteMode = !deleteMode;
  if (deleteMode) { pointMode = false; graphPtMode = false; line2ptPicking = false; }
  document.getElementById('delete-mode-btn').classList.toggle('active-btn', deleteMode);
  document.getElementById('point-mode-btn').classList.remove('active-btn');
  document.getElementById('graph-pt-btn').classList.remove('active-btn');
  document.getElementById('line2pt-btn').classList.remove('active-btn');
  document.body.classList.toggle('delete-mode', deleteMode);
  canvas.style.cursor = deleteMode ? 'crosshair' : 'grab';
}

// Versucht im Lösch-Modus ein Objekt an Position (mx, my) zu löschen.
// Priorität: freier Punkt → Graph-Punkt → Funktion (nächster Graph)
// Gibt true zurück wenn etwas gelöscht wurde.
function tryDeleteAt(mx, my) {
  // Freier Punkt?
  const pi = findNearPoint(mx, my);
  if (pi >= 0) { deletePoint(pi); pushHistory(); return true; }
  // Graph-Punkt?
  const gi = findNearGP(mx, my);
  if (gi >= 0) { graphPoints.splice(gi, 1); scheduleDraw(); return true; }
  // Funktion (nächster Graph innerhalb 20px vertikal)?
  const pt = fromCanvas(mx, my);
  let bestFi = -1, bestDist = 20;
  functions.forEach((fn, i) => {
    if (!fn.expr.trim() || fn.visible === false) return;
    const y = safeEval(fn.expr, pt.x); if (!isFinite(y)) return;
    const dist = Math.abs(toCanvas(pt.x, y).cy - my);
    if (dist < bestDist) { bestDist = dist; bestFi = i; }
  });
  if (bestFi >= 0) {
    graphPoints = graphPoints.filter(gp => gp.fi !== bestFi);
    graphPoints.forEach(gp => { if (gp.fi > bestFi) gp.fi--; });
    functions.splice(bestFi, 1);
    linkedLines = linkedLines.filter(ll => ll.fi !== bestFi);
    linkedLines.forEach(ll => { if (ll.fi > bestFi) ll.fi--; });
    if (activeInput?.fi === bestFi) activeInput = null;
    clearEvalCache(); renderFuncList(); syncParams(); scheduleComputeSpecials();
     pushHistory(); scheduleDraw(); return true;
  }
  return false;
}

// Nachkommastellen-Einstellung übernehmen
function setPrecision() { precision = parseInt(document.getElementById('precision-sel').value); rerender(); }

// Alles neu berechnen und zeichnen (z.B. nach Einstellungsänderung)
function rerender() { scheduleComputeSpecials();  scheduleDraw(); }

// Gibt zurück welcher Label-Modus aktiv ist: 'all', 'none', 'hover'
function getLabelMode() { return document.getElementById('label-mode').value; }

// Früher: prüfte globale Ein-/Ausblenden-Checkboxen im (inzwischen entfernten)
// "Spezielle Punkte"-Sidebar-Panel — je Punkt-Typ (Max/Min/Wende/Nullst./...).
// Dieses Panel gab es doppelt zu den Smart-Buttons direkt unter jeder Funktion
// und wurde auf Nutzerwunsch entfernt. Alle Punkt-Typen gelten seither als
// immer sichtbar; die Funktion bleibt (statt Aufrufer anzupassen) als simpler
// Stub bestehen, siehe 05_points.js, 08_draw.js, renderSpecialList() in 04_analysis.js.
function isKindVisible(kind) {
  return true;
}

// Prüft ob ein spezieller Punkt angezeigt werden soll.
// Smart-Buttons steuern NUR den Lösungsweg-Panel und die Asymptoten-Linien —
// sie blenden KEINE anderen Punkte (z.B. Hochpunkt) aus.
// Die Sichtbarkeit der Punkte wird ausschliesslich durch isKindVisible() (globale Checkboxen) gesteuert.
function isPointActive(pt) {
  return true; // Punkte immer anzeigen; isKindVisible() filtert nach Typ
}

// ═══════════════════════════════════════════════════════════════════
// SMART-BUTTONS — Relevante Sonderpunkte direkt unter der Funktion
// ═══════════════════════════════════════════════════════════════════

// Konfiguration für jeden Punkt-Typ: Beschriftung (kurz, für den Knopf selbst —
// bei vielen Spezialpunkten pro Funktion wird die Knopfleiste sonst zu breit),
// ausgeschriebener Name (für den Tooltip/title), Farbe, Checkbox-ID.
const SMART_BTN_CONFIG = {
  zero:  { label: 'NS',   full: 'Nullstellen',  color: '#92400e', checkId: 'show-zero'  },
  yaxis: { label: 'Sy',   full: 'y-Achse',       color: '#BD10E0', checkId: 'show-yaxis' },
  max:   { label: 'Max',  full: 'Hochpunkt',     color: '#e24b4a', checkId: 'show-max'   },
  min:   { label: 'Min',  full: 'Tiefpunkt',     color: '#1D9E75', checkId: 'show-min'   },
  inf:   { label: 'WP',   full: 'Wendepunkt',    color: '#7F77DD', checkId: 'show-inf'   },
  asymp: { label: 'Asym', full: 'Asymptoten',    color: '#f59e0b', checkId: 'show-asymp' },
  isect: { label: 'SP',   full: 'Schnittpunkt',  color: '#378ADD', checkId: 'show-isect' },
  // Hebbare Lücke: Grenzwert im Endlichen (Gegenstück zu 'asymp', das nur
  // Grenzwerte im UNENDLICHEN + Polstellen abdeckt). Wird von computeSpecials()
  // erzeugt, wenn eine ursprünglich als Pol erkannte Stelle sich per CAS
  // (ndPoleOrHole(), 18_nerdamer_limits.js) als hebbare Lücke mit endlichem
  // Grenzwert herausstellt (siehe 04_analysis.js).
  hole:  { label: 'Lücke', full: 'Hebbare Lücke', color: '#6B7280', checkId: 'show-hole' },
};
const SMART_BTN_ORDER = ['zero', 'yaxis', 'max', 'min', 'inf', 'asymp', 'hole', 'isect'];

// Aktualisiert die Smart-Buttons für alle Funktionen basierend auf dem specials-Array.
// Wird nach computeSpecials() / renderSpecialList() und nach renderFuncList() aufgerufen.
function updateSmartButtons() {
  functions.forEach((fn, i) => {
    const container = document.getElementById(`smart-btns-${i}`);
    if (!container) return;
    container.innerHTML = '';
    if (!fn.expr || !fn.expr.trim() || fn.visible === false) return;

    // Welche Typen kommen für diese Funktion vor?
    const foundKinds = new Set();
    specials.forEach(sp => {
      if (sp.fi === i) {
        foundKinds.add(sp.kind);
        // Polstellen zählen als "Asymptoten"-Kategorie im Smart-Button
        if (sp.kind === 'pole') foundKinds.add('asymp');
      }
      if (sp.fj === i) foundKinds.add(sp.kind); // Schnittpunkte: für beide Funktionen
    });

    SMART_BTN_ORDER.forEach(kind => {
      if (!foundKinds.has(kind)) return;
      const cfg = SMART_BTN_CONFIG[kind];
      if (!cfg) return;

      const key = `${i}:${kind}`;
      const isActive = activeSpecials.has(key);

      const btn = document.createElement('button');
      btn.className = 'smart-btn' + (isActive ? ' sb-active' : '');
      btn.textContent = cfg.label;
      btn.style.borderColor = cfg.color;
      btn.title = `${cfg.full} für f${i+1} ${isActive ? 'ausblenden' : 'einblenden'}`;
      if (isActive) {
        btn.style.background = cfg.color;
        btn.style.color = '#fff';
      } else {
        btn.style.color = cfg.color;
        btn.style.background = 'transparent';
      }

      btn.onclick = () => {
        if (kind === 'asymp') {
          // Asymptoten: Linien ein-/ausblenden (toggle) + Lösungsweg-Tooltip
          const wasActive = activeSpecials.has(key);
          if (wasActive) activeSpecials.delete(key); else activeSpecials.add(key);
          updateSmartButtons();
          scheduleDraw();
          // Tooltip: beim Aktivieren ersten Lösungsweg zeigen, beim Deaktivieren schliessen
          const tooltip = document.getElementById('solve-tooltip');
          const activePt = window._activeTooltipPt;
          const tooltipIsThisAsymp = tooltip && tooltip.style.display !== 'none' &&
                                     activePt && activePt.fi === i &&
                                     (activePt.kind === 'asymp' || activePt.kind === 'pole');
          if (wasActive) {
            if (tooltipIsThisAsymp && typeof hideSolveTooltip === 'function') hideSolveTooltip();
          } else {
            const pts = specials.filter(sp => sp.fi === i && (sp.kind === 'asymp' || sp.kind === 'pole'));
            if (pts.length > 0 && typeof showSolveTooltip === 'function') showSolveTooltip(pts);
          }
        } else {
          // Alle anderen Typen: Lösungsweg-Tooltip für ersten sichtbaren Punkt öffnen
          // – zweiter Klick auf denselben Knopf: Tooltip wieder schliessen (Toggle)
          const tooltip = document.getElementById('solve-tooltip');
          const already = tooltip && tooltip.style.display !== 'none' &&
                          window._activeTooltipPt && window._activeTooltipPt.fi === i &&
                          window._activeTooltipPt.kind === kind;
          if (already) { if (typeof hideSolveTooltip === 'function') hideSolveTooltip(); return; }

          // activeSpecials toggeln für Canvas-Markierung
          if (activeSpecials.has(key)) activeSpecials.delete(key); else activeSpecials.add(key);
          updateSmartButtons();
          scheduleDraw();

          const pts = specials.filter(sp => sp.fi === i && sp.kind === kind);
          if (pts.length === 0) return;
          // Bevorzuge sichtbaren Punkt; Fallback: erster
          const pt = pts.find(p =>
            p.x >= view.xmin && p.x <= view.xmax &&
            p.y >= view.ymin && p.y <= view.ymax
          ) || pts[0];
          if (typeof showSolveTooltip === 'function') showSolveTooltip(pt);
        }
      };
      container.appendChild(btn);
    });

    // Immer sichtbare Analysis-Knöpfe (unabhängig von erkannten Spezialpunkten)
    appendCalculusButtons(container, fn, i);

    // Solve-Panel leeren — Lösungswege erscheinen als Tooltip (Canvas-Overlay)
    const solvePanel = document.getElementById(`solve-panel-${i}`);
    if (solvePanel) solvePanel.innerHTML = '';
  });
}

// ═══════════════════════════════════════════════════════════════════
// ANALYSIS-KNÖPFE — Grenzwerte im Unendlichen, Ableitungsfunktion,
// unbestimmtes Integral. Anders als die Smart-Buttons oben (die nur
// gefundene Spezialpunkte ein-/ausblenden) erscheinen diese drei IMMER,
// solange die Funktion einen nicht-leeren Ausdruck hat — unabhängig
// davon, ob überhaupt Spezialpunkte gefunden wurden. Ableitung/Integral
// legen dabei jeweils eine NEUE Funktion an (siehe addDerivedFunction()),
// statt nur eine Anzeige umzuschalten.
// ═══════════════════════════════════════════════════════════════════
const CALC_BTN_COLORS = { lim: '#0F766E', deriv: '#B45309', integral: '#6D28D9' };

function appendCalculusButtons(container, fn, i) {
  // Grenzwerte im Unendlichen (rein informativ, öffnet Tooltip)
  const limBtn = document.createElement('button');
  limBtn.className = 'smart-btn';
  limBtn.textContent = 'lim∞'; // kurz für "Grenzwerte im Unendlichen" — voller Name im title
  limBtn.style.borderColor = CALC_BTN_COLORS.lim;
  limBtn.style.color = CALC_BTN_COLORS.lim;
  limBtn.title = `Grenzwerte im Unendlichen für f${i+1} anzeigen`;
  limBtn.onclick = () => {
    const tooltip = document.getElementById('solve-tooltip');
    const already = tooltip && tooltip.style.display !== 'none' &&
                    window._activeTooltipPt && window._activeTooltipPt.fi === i &&
                    window._activeTooltipPt.kind === 'liminf';
    if (already) { hideSolveTooltip(); return; }
    showLimitsInfinityTooltip(i);
  };
  container.appendChild(limBtn);

  // Ableitungsfunktion — erzeugt f'(x) als neue Funktion (immer möglich)
  const dBtn = document.createElement('button');
  dBtn.className = 'smart-btn';
  dBtn.textContent = "f'"; // kurz für "Ableitungsfunktion" — voller Name im title
  dBtn.style.borderColor = CALC_BTN_COLORS.deriv;
  dBtn.style.color = CALC_BTN_COLORS.deriv;
  dBtn.title = `Ableitung von f${i+1} als neue Funktion einfügen`;
  dBtn.onclick = () => {
    try {
      const ast = miParseRaw(fn.expr);
      const dAst = calcDiff(ast, 'x');
      const raw = miToRaw(dAst, 0);
      addDerivedFunction(raw);
    } catch (ex) {
      showCalcMessage(i, `f<sub>${i+1}</sub>&thinsp;Ableitungsfunktion`, 'Die Ableitung konnte nicht gebildet werden.');
    }
  };
  container.appendChild(dBtn);

  // Unbestimmtes Integral — erzeugt eine Stammfunktion als neue Funktion,
  // sofern eine elementare Stammfunktion im unterstützten Umfang existiert.
  const iBtn = document.createElement('button');
  iBtn.className = 'smart-btn';
  iBtn.textContent = '∫'; // kurz für "Unbestimmtes Integral" — voller Name im title
  iBtn.style.borderColor = CALC_BTN_COLORS.integral;
  iBtn.style.color = CALC_BTN_COLORS.integral;
  iBtn.title = `Stammfunktion von f${i+1} als neue Funktion einfügen`;
  iBtn.onclick = () => {
    let iAst = null, raw = null;
    try {
      const ast = miParseRaw(fn.expr);
      iAst = calcIntegrate(ast, 'x');
      if (iAst) raw = miToRaw(iAst, 0);
    } catch (ex) { iAst = null; raw = null; }
    if (!iAst || !raw) {
      showCalcMessage(i, `f<sub>${i+1}</sub>&thinsp;Unbestimmtes Integral`,
        'Für diese Funktion konnte keine elementare Stammfunktion gefunden werden.');
      return;
    }
    addDerivedFunction(raw);
  };
  container.appendChild(iBtn);
}

// Zeigt lim x→−∞ und lim x→+∞ von f_i im bestehenden Lösungsweg-Tooltip an
// (informativ, legt keine neue Funktion an).
// Bevorzugt die bereits mit dem externen CAS (Nerdamer) verfeinerten Werte aus
// `specials` (computeSpecials() Phase 2 "Nerdamer-Verfeinerung", 04_analysis.js
// / 18_nerdamer_limits.js) — dieselbe Quelle, die auch der "Asymptoten"-Smart-
// Button und die Koordinaten-Beschriftungen im Graph verwenden. So zeigt dieser
// Knopf für horizontale Asymptoten denselben, exakten Wert statt einer eigenen,
// rein numerischen Schätzung, die geringfügig abweichen könnte. Nur wenn (noch)
// kein CAS-Ergebnis vorliegt, wird auf die numerische Grenzwert-Schätzung aus
// 15_domain_range.js (daBoundaryLimit) zurückgegriffen.
function showLimitsInfinityTooltip(fi) {
  const fn = functions[fi];
  const tooltip = document.getElementById('solve-tooltip');
  const titleEl = document.getElementById('solve-tooltip-title');
  const content = document.getElementById('solve-tooltip-content');
  if (!tooltip || !titleEl || !content || !fn) return;

  function limitFor(dirLabel, x0, dir) {
    const asympEntry = (typeof specials !== 'undefined' ? specials : []).find(
      sp => sp.kind === 'asymp' && sp.fi === fi && sp.dir === dirLabel && !sp.oblique
    );
    // pt wird mitgegeben (nicht nur der Wert) — damit unten bei Bedarf derselbe
    // vollständige Lösungsweg wie beim "Asymptoten"-Smart-Button erzeugt werden
    // kann (generateSolveSteps(pt)), statt nur den nackten Grenzwert zu zeigen.
    if (asympEntry) return { kind: 'value', v: asympEntry.y, pt: asympEntry };
    return daBoundaryLimit(fn.expr, x0, dir);
  }
  const lm = limitFor('-∞', -Infinity, 1);
  const lp = limitFor('+∞', Infinity, -1);
  const fmt = res => {
    if (!res) return '?';
    if (res.kind === 'inf') return res.sign > 0 ? '+∞' : '−∞';
    if (res.kind === 'value') return niceNum(res.v);
    return 'nicht bestimmbar';
  };

  titleEl.innerHTML = `f<sub>${fi+1}</sub>&thinsp;Grenzwerte im Unendlichen`;
  titleEl.style.color = fn.color || '';

  // Für Richtungen mit einem bestätigten endlichen Grenzwert (asympEntry
  // vorhanden) denselben vollständigen, exakten Lösungsweg zeigen wie beim
  // "Asymptoten"-Smart-Button (generateSolveSteps()) — inkl. Erweitern mit dem
  // konjugierten Ausdruck bei Wurzel±linear-Termen usw. — statt nur den
  // fertigen Wert. Der generische Kopf ("Asymptote / Grenzwert von f…(x)")
  // wird dabei entfernt, da der Tooltip-Titel hier bereits "Grenzwerte im
  // Unendlichen" zeigt.
  function stepsFor(res) {
    if (!res || res.kind !== 'value' || !res.pt || typeof generateSolveSteps !== 'function') return null;
    try {
      const full = generateSolveSteps(res.pt);
      // Nicht-gierig bis zum ERSTEN schliessenden </b> — der Kopf selbst
      // enthält verschachteltes Markup (z.B. "f<sub>1</sub>(x)"), [^<]* würde
      // dort also fälschlich gar nicht matchen und der Kopf bliebe stehen.
      return full.replace(/^<b>[\s\S]*?<\/b>\s*\n*/, '').trim();
    } catch (e) { return null; }
  }
  const stepsM = stepsFor(lm);
  const stepsP = stepsFor(lp);
  // Manche Herleitungen (gebrochenrational, exponentiell) beschreiben BEIDE
  // Richtungen bereits selbst in einem Text ("x → ±∞" bzw. explizit sowohl
  // "x → +∞" als auch "x → −∞"), auch wenn nur EINE Richtung einen endlichen
  // Grenzwert (und damit einen asympEntry/pt) hat — die andere divergiert dort
  // z.B. gegen +∞. In dem Fall wäre eine "x → +∞:"-Beschriftung über dem Block
  // irreführend, da der Text selbst schon beide Richtungen behandelt.
  const isBidirectional = s => !!s && (/±∞/.test(s) || (/x → −∞/.test(s) && /x → \+∞/.test(s)));

  if (stepsM && stepsP && stepsM === stepsP) {
    // Dieselbe Herleitung deckt beide Richtungen ab (z.B. gebrochenrationale
    // oder exponentielle Asymptote — dort ist der Text nicht richtungsabhängig).
    content.innerHTML = stepsM;
  } else if (stepsM && !stepsP && isBidirectional(stepsM)) {
    content.innerHTML = stepsM;
  } else if (stepsP && !stepsM && isBidirectional(stepsP)) {
    content.innerHTML = stepsP;
  } else if (stepsM || stepsP) {
    const blocks = [];
    const divider = `<div style="border-top:1px solid var(--border);margin:6px 0 4px;"></div>`;
    if (stepsM) blocks.push(`<div style="opacity:0.7;font-style:italic;margin-bottom:4px;">x → −∞:</div>${stepsM}`);
    else blocks.push(`<div>lim<sub>x→−∞</sub>&thinsp;f<sub>${fi+1}</sub>(x) = ${fmt(lm)}</div>`);
    if (stepsP) blocks.push(`<div style="opacity:0.7;font-style:italic;margin-bottom:4px;">x → +∞:</div>${stepsP}`);
    else blocks.push(`<div>lim<sub>x→+∞</sub>&thinsp;f<sub>${fi+1}</sub>(x) = ${fmt(lp)}</div>`);
    content.innerHTML = blocks.join(divider);
  } else {
    content.innerHTML =
      `<div style="margin-bottom:4px;">lim<sub>x→−∞</sub>&thinsp;f<sub>${fi+1}</sub>(x) = ${fmt(lm)}</div>` +
      `<div>lim<sub>x→+∞</sub>&thinsp;f<sub>${fi+1}</sub>(x) = ${fmt(lp)}</div>`;
  }

  window._activeTooltipPt = { fi, kind: 'liminf' };
  tooltip.style.display = 'block';
}

// Kleine Info-/Fehlermeldung im selben Tooltip-Panel (statt eines blockierenden
// alert()) — z.B. wenn keine elementare Stammfunktion gefunden werden konnte.
function showCalcMessage(fi, title, html) {
  const tooltip = document.getElementById('solve-tooltip');
  const titleEl = document.getElementById('solve-tooltip-title');
  const content = document.getElementById('solve-tooltip-content');
  if (!tooltip || !titleEl || !content) return;
  const fn = functions[fi];
  titleEl.innerHTML = title;
  titleEl.style.color = fn ? fn.color : '';
  content.innerHTML = html;
  window._activeTooltipPt = { fi, kind: 'calcmsg' };
  tooltip.style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════════
// LÖSUNGSWEG-TOOLTIP — erscheint oben rechts im Canvas
// ═══════════════════════════════════════════════════════════════════

// pts: einzelner Punkt ODER Array von Punkten (z.B. alle Asymptoten einer Funktion)
function showSolveTooltip(pts) {
  const tooltip = document.getElementById('solve-tooltip');
  const titleEl = document.getElementById('solve-tooltip-title');
  const content = document.getElementById('solve-tooltip-content');
  if (!tooltip || !titleEl || !content) return;

  const ptsArr = Array.isArray(pts) ? pts : [pts];
  if (ptsArr.length === 0) return;
  const pt = ptsArr[0];
  const fn = functions[pt.fi];

  const kindNames = {
    max: t('solve_max'), min: t('solve_min'), inf: t('solve_inf'),
    zero: t('solve_zero'), yaxis: t('solve_yaxis_sect'),
    isect: t('solve_isect'), asymp: t('solve_asymp'), pole: t('solve_pole'),
    // 'hole' folgt hier (wie SMART_BTN_CONFIG oben) dem Präzedenzfall neuerer
    // Ergänzungen, fest auf Deutsch statt über t()/01_i18n.js — konsistent mit
    // den anderen kürzlich hinzugefügten Lösungsweg-Texten dieser Datei.
    hole: 'Hebbare Lücke'
  };

  // Titel: bei mehreren Punkten nur Art + Funktionsnummer, ohne Koordinate
  if (ptsArr.length > 1) {
    titleEl.innerHTML = `f<sub>${pt.fi+1}</sub>&thinsp;Asymptoten`;
  } else {
    let coordStr = '';
    if (pt.kind === 'asymp') {
      if (pt.oblique) {
        coordStr = fmtObliqueAsymLabel(pt.slope, pt.intercept);
      } else { coordStr = fmtHorizontalAsymLabel(pt.y); }
    } else if (pt.kind === 'pole') {
      coordStr = fmtVerticalAsymLabel(pt.x);
    } else {
      coordStr = pt.exactLabel || niceCoord(pt.x, pt.y);
    }
    titleEl.innerHTML = `f<sub>${pt.fi+1}</sub>&thinsp;${kindNames[pt.kind] || pt.kind}&ensp;<span style="font-weight:400;opacity:0.75">${coordStr}</span>`;
  }
  titleEl.style.color = fn ? fn.color : '';

  // Inhalt: alle Punkte mit Trennlinie
  if (ptsArr.length === 1) {
    content.innerHTML = generateSolveSteps(pt);
  } else {
    content.innerHTML = ptsArr.map((p, idx) => {
      const divider = idx > 0 ? `<div style="border-top:1px solid var(--border);margin:6px 0 4px;"></div>` : '';
      return divider + generateSolveSteps(p);
    }).join('');
  }

  window._activeTooltipPt = pt;
  tooltip.style.display = 'block';
}

function hideSolveTooltip() {
  const tooltip = document.getElementById('solve-tooltip');
  if (tooltip) tooltip.style.display = 'none';
  window._activeTooltipPt = null;
}

// ═══════════════════════════════════════════════════════════════════
// FUNKTIONS-LABEL-OVERLAY — HTML-Box oben rechts im Canvas
// Zeigt formatierte Ausdrücke (Brüche, Exponenten) statt Canvas-Text
// ═══════════════════════════════════════════════════════════════════
function updateFuncLabelsOverlay() {
  const el = document.getElementById('func-labels-overlay');
  if (!el) return;
  const show = document.getElementById('chk-funclabels')?.checked !== false;
  if (!show) { el.style.display = 'none'; return; }

  const rows = functions
    .map((fn, i) => ({ fn, i }))
    .filter(({ fn }) => fn.expr && fn.expr.trim() && fn.visible !== false);

  if (rows.length === 0) { el.style.display = 'none'; return; }

  el.innerHTML = rows.map(({ fn, i }) => {
    // Parameterwerte einsetzen + vereinfachen, dann exakt wie im Eingabefeld rendern
    const substituted = typeof exprWithValues === 'function'
      ? exprWithValues(fn.expr)
      : (typeof exprToDisplayStr === 'function' ? exprToDisplayStr(fn.expr) : fn.expr);
    const html = typeof exprToMathLiveHtml === 'function' ? exprToMathLiveHtml(substituted) : substituted;
    let domainSuffix = '';
    if (fn.domainMin != null || fn.domainMax != null) {
      const dlo = fn.domainMin != null ? fn.domainMin : '−∞';
      const dhi = fn.domainMax != null ? fn.domainMax : '+∞';
      domainSuffix = `<span style="font-size:0.85em;opacity:0.7;">&thinsp;, x ∈ [${dlo}, ${dhi}]</span>`;
    }
    return `<div class="flo-row">
      <span class="flo-dot" style="background:${fn.color};"></span>
      <span class="flo-expr">f<sub>${i+1}</sub>(x) = ${html}${domainSuffix}</span>
    </div>`;
  }).join('');
  el.style.display = 'block';
}

