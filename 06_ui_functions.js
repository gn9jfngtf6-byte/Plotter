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
  if (rangeSpan) _updateRangeSpan(fn.expr, fn.domainMin, fn.domainMax, fn.domainExcluded, fn.domainGaps, rangeSpan);
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
function _updateRangeSpan(expr, domainMin, domainMax, domainExcluded, domainGaps, rangeSpan) {
  if (!expr || !expr.trim()) { rangeSpan.textContent = ''; return; }
  const { rangeMin, rangeMax, rangeExcluded } = computeRange(expr, domainMin, domainMax, domainExcluded || [], domainGaps || []);
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
  try { rng = computeRange(fn.expr, domainMin, domainMax, excluded, gaps); }
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
  _setPanelDW('lin-slopeform-dw', _findByPattern('m*x+q'));
  const linFitFn = (typeof linPanelDef !== 'undefined' && linPanelDef && linPanelDef.lastFi != null)
    ? functions[linPanelDef.lastFi] : null;
  _setPanelDW('lin-dw', linFitFn && linFitFn.visible !== false ? linFitFn : null);

  // Quadratische Funktionen: letztes "Berechnen"-Ergebnis (kein Schieberegler)
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
}

// ═══════════════════════════════════════════════════════════════════
// MODUL: ui_functions — Funktionsliste in der Sidebar
// Enthält:  renderFuncList(), addFunction(), removeFunction()
//           syncAreaSelects(), renderPreview(), setActiveInput()
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
      clearEvalCache(); syncParams(); syncAreaSelects(); scheduleComputeSpecials();
      if (showArea) updateAreaResult(); syncLinearExtra(); scheduleDraw();
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
    eye.onclick = () => { fn.visible = !fn.visible; renderFuncList(); scheduleComputeSpecials(); if (showArea) updateAreaResult(); scheduleDraw(); };

    // Löschen-Button — bereinigt auch zugehörige Graph-Punkte
    const del = document.createElement('button'); del.className = 'del-btn'; del.textContent = '✕';
    del.onclick = () => {
      // Graph-Punkte auf dieser Funktion entfernen
      graphPoints = graphPoints.filter(gp => gp.fi !== i);
      // Indizes der Graph-Punkte auf höheren Funktionen anpassen
      graphPoints.forEach(gp => { if (gp.fi > i) gp.fi--; });
      functions.splice(i, 1);
      linkedLines = linkedLines.filter(ll => ll.fi !== i);
      linkedLines.forEach(ll => { if (ll.fi > i) ll.fi--; });
      if (activeInput?.fi === i) activeInput = null;
      clearEvalCache(); renderFuncList(); syncParams(); syncAreaSelects(); scheduleComputeSpecials(); if (showArea) updateAreaResult();
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
        _updateRangeSpan(fn.expr, fn.domainMin, fn.domainMax, fn.domainExcluded, fn.domainGaps, rangeSpan), 300);
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
      setTimeout(() => _updateRangeSpan(fn.expr, fn.domainMin, fn.domainMax, fn.domainExcluded, fn.domainGaps, rangeSpan), 50);
    }

    const funcItem = document.createElement('div');
    funcItem.append(row, preview, domainRow, smartBtns, solvePanel);
    el.appendChild(funcItem);
    // 3-Strich-Kontextmenü auf sinnvolle Einträge reduzieren (siehe 14_mathinput.js) --
    // das math-field "mountet" sich intern erst asynchron nach dem Einhängen
    // ins DOM (nicht synchron danach) -- deshalb per Microtask verzoegern,
    // sonst greift die Zuweisung ins Leere bzw. wirft einen Fehler.
    queueMicrotask(() => { inp.menuItems = mlFilterMenuItems(inp.menuItems); });
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
  renderFuncList(); syncParams(); syncAreaSelects();
  document.getElementById('func-list').lastChild?.querySelector('input')?.focus();
}

// Neue Funktion mit vorgegebenem Rohausdruck hinzufügen (z.B. Ableitung oder
// Stammfunktion eines bestehenden f_i) — wird über die Analysis-Knöpfe unter
// dem Eingabefeld aufgerufen (siehe appendCalculusButtons()).
function addDerivedFunction(rawExpr) {
  functions.push({ expr: rawExpr, color: COLORS[functions.length % COLORS.length], visible: true });
  clearEvalCache(); renderFuncList(); syncParams(); syncAreaSelects(); scheduleComputeSpecials();
  if (showArea) updateAreaResult();
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
    clearEvalCache(); renderFuncList(); syncParams(); syncAreaSelects(); scheduleComputeSpecials();
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

// Alles löschen (Funktionen, Punkte, Geraden, Einheitskreis-Punkte, Graph-Punkte)
function clearAll() {
  functions = []; params = {}; points = []; specials = []; graphPoints = []; unitCirclePts = []; linkedLines = [];
  line2ptPicking = false; line2ptPts = []; slopeTriPts = []; slopeTriPtsMap = {}; showArea = false; clearEvalCache();
  // Senkrechte/Mittelsenkrechte-Referenzen zurücksetzen (siehe 11_fitting.js) —
  // sonst würden nach dem Löschen alte fi-Indizes auf neue, unabhängige
  // Funktionen zeigen und drawPerpMarkers() falsche Marker zeichnen.
  perpMeta = {}; linActiveFi = -1; linPerpFi = -1; linBisectorFi = -1;
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
  document.getElementById('area-toggle-btn').classList.remove('active-btn');
  document.getElementById('area-toggle-btn').textContent = t('btn_area');
  document.getElementById('area-result').textContent = '';
  renderFuncList(); renderPointList(); syncParams(); syncAreaSelects(); renderSpecialList(); scheduleDraw();
}

// View auf Standardbereich zurücksetzen
function resetView() { view = { xmin:-10, xmax:10, ymin:-6, ymax:6 }; syncInputs(); scheduleComputeSpecials(); scheduleDraw(); }

// Bereich aus den Eingabefeldern übernehmen
function applyRange() {
  view.xmin = parseFloat(document.getElementById('xmin').value) || view.xmin;
  view.xmax = parseFloat(document.getElementById('xmax').value) || view.xmax;
  view.ymin = parseFloat(document.getElementById('ymin').value) || view.ymin;
  view.ymax = parseFloat(document.getElementById('ymax').value) || view.ymax;
  scheduleComputeSpecials(); if (showArea) updateAreaResult(); scheduleDraw();
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
  syncInputs(); scheduleComputeSpecials(); if (showArea) updateAreaResult(); scheduleDraw();
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
    clearEvalCache(); renderFuncList(); syncParams(); syncAreaSelects(); scheduleComputeSpecials();
    if (showArea) updateAreaResult(); pushHistory(); scheduleDraw(); return true;
  }
  return false;
}

// Nachkommastellen-Einstellung übernehmen
function setPrecision() { precision = parseInt(document.getElementById('precision-sel').value); rerender(); }

// Alles neu berechnen und zeichnen (z.B. nach Einstellungsänderung)
function rerender() { scheduleComputeSpecials(); if (showArea) updateAreaResult(); scheduleDraw(); }

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
};
const SMART_BTN_ORDER = ['zero', 'yaxis', 'max', 'min', 'inf', 'asymp', 'isect'];

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
// (informativ, legt keine neue Funktion an). Nutzt die bereits vorhandene
// Grenzwert-Erkennung aus 15_domain_range.js (daBoundaryLimit).
function showLimitsInfinityTooltip(fi) {
  const fn = functions[fi];
  const tooltip = document.getElementById('solve-tooltip');
  const titleEl = document.getElementById('solve-tooltip-title');
  const content = document.getElementById('solve-tooltip-content');
  if (!tooltip || !titleEl || !content || !fn) return;

  const lm = daBoundaryLimit(fn.expr, -Infinity, 1);
  const lp = daBoundaryLimit(fn.expr, Infinity, -1);
  const fmt = res => {
    if (!res) return '?';
    if (res.kind === 'inf') return res.sign > 0 ? '+∞' : '−∞';
    if (res.kind === 'value') return niceNum(res.v);
    return 'nicht bestimmbar';
  };

  titleEl.innerHTML = `f<sub>${fi+1}</sub>&thinsp;Grenzwerte im Unendlichen`;
  titleEl.style.color = fn.color || '';
  content.innerHTML =
    `<div style="margin-bottom:4px;">lim<sub>x→−∞</sub>&thinsp;f<sub>${fi+1}</sub>(x) = ${fmt(lm)}</div>` +
    `<div>lim<sub>x→+∞</sub>&thinsp;f<sub>${fi+1}</sub>(x) = ${fmt(lp)}</div>`;

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
    isect: t('solve_isect'), asymp: t('solve_asymp'), pole: t('solve_pole')
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

