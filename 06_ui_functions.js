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

    // Contenteditable-Eingabefeld (zeigt Brüche als echte Brüche im Ruhezustand)
    const inp = document.createElement('div');
    inp.contentEditable = 'true';
    inp.spellcheck = false;
    inp.className = 'func-inp-ce';
    inp.setAttribute('inputmode', 'decimal');
    inp.setAttribute('data-raw', fn.expr);
    inp.style.cssText = `font-family:'Cascadia Code','Fira Mono',monospace;font-size:12px;padding:4px 8px;border:1px solid var(--border-input);border-radius:6px;background:var(--bg-input);color:var(--text);outline:none;flex:1;min-width:0;cursor:text;overflow-x:hidden;overflow-y:visible;white-space:nowrap;line-height:1.6;min-height:28px;${fn.visible ? '' : 'opacity:0.45;'}`;
    if (isLinked) { inp.style.background = '#f0f9ff'; inp.title = 'Live-Gerade (durch Punkte definiert)'; }

    // Guard: verhindert dass oninput feuert wenn ceRender() das HTML programmatisch setzt
    let ceRendering = false;

    // Ruhezustand: formatierte Darstellung (Brüche + Exponenten, Dezimalzahlen gerundet)
    function ceRender() {
      const raw = inp.getAttribute('data-raw') || '';
      const disp = raw ? exprToDisplayStr(raw) : '';
      ceRendering = true;
      if (exprNeedsPreview(raw)) { inp.innerHTML = exprToHtml(disp || raw); }
      else { inp.textContent = disp || ''; if (!disp) { inp.innerHTML = '<span style="color:var(--text-muted);font-style:italic;">z.B. sin(x)</span>'; } }
      ceRendering = false;
    }
    ceRender();

    inp.onfocus = () => {
      // Umschalten auf Rohtext zum Bearbeiten
      const raw = inp.getAttribute('data-raw') || '';
      ceRendering = true;
      inp.textContent = raw;
      ceRendering = false;
      inp.style.borderColor = '#378ADD';
      setActiveInput(inp, i);
      // Cursor ans Ende
      const range = document.createRange(); range.selectNodeContents(inp); range.collapse(false);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    };
    inp.onblur = () => {
      const raw = inp.textContent;
      inp.setAttribute('data-raw', raw);
      inp.style.borderColor = '';
      ceRender();
      if (!historyPaused) { clearTimeout(_histDebounce); _histDebounce = setTimeout(pushHistory, 100); }
    };
    inp.oninput = () => {
      if (ceRendering) return; // Programmatische Änderung (ceRender) ignorieren
      const raw = inp.textContent;
      inp.setAttribute('data-raw', raw);
      fn.expr = raw;
      clearEvalCache(); syncParams(); syncAreaSelects(); scheduleComputeSpecials();
      if (showArea) updateAreaResult(); syncLinearExtra(); scheduleDraw();
    };
    // Keine Newlines erlauben
    inp.onkeydown = e => {
      if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
    };

    const preview = document.createElement('div'); // Dummy, nicht mehr verwendet
    preview.style.display = 'none';

    // Auge-Button
    const eye = document.createElement('button'); eye.className = 'del-btn';
    eye.innerHTML = fn.visible ? '&#128065;' : '&#x1F648;'; eye.title = fn.visible ? 'Ausblenden' : 'Einblenden';
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
    row.append(dot, lbl, inp, eye, del);
    const funcItem = document.createElement('div');
    funcItem.append(row, preview);
    el.appendChild(funcItem);
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

// Alles löschen (Funktionen, Punkte, Geraden, Einheitskreis-Punkte, Graph-Punkte)
function clearAll() {
  functions = []; params = {}; points = []; specials = []; graphPoints = []; unitCirclePts = []; linkedLines = [];
  line2ptPicking = false; line2ptPts = []; slopeTriPts = []; slopeTriPtsMap = {}; showArea = false; clearEvalCache();
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

// Prüft ob ein Punkt-Typ durch die Checkboxen sichtbar ist
function isKindVisible(kind) {
  const map = { max:'show-max', min:'show-min', inf:'show-inf', zero:'show-zero', yaxis:'show-yaxis', isect:'show-isect' };
  const id = map[kind]; if (!id) return true;
  const el = document.getElementById(id); return el ? el.checked : true;
}

