// CSS für Exponenten-Kursor-Hervorhebung und Anker-Darstellung injizieren
(function() {
  if (document.getElementById('sup-cursor-style')) return;
  const s = document.createElement('style'); s.id = 'sup-cursor-style';
  s.textContent =
    '.preview-sup.sup-cursor-active{outline:1.5px solid rgba(55,138,221,0.75);background:rgba(55,138,221,0.11);border-radius:2px;}' +
    '.func-inp-ce .pf-cursor-anchor{vertical-align:baseline!important;font-size:1em!important;}';
  document.head.appendChild(s);
})();

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
// DOM → RAW-AUSDRUCK REKONSTRUKTION
// ═══════════════════════════════════════════════════════════════════

// Setzt den Cursor in einem contenteditable-Div auf Zeichen-Offset offset (im textContent).
function ceSetCursorAt(el, offset) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let rem = offset;
  while (walker.nextNode()) {
    const len = walker.currentNode.length;
    if (rem <= len) {
      const r = document.createRange();
      r.setStart(walker.currentNode, rem);
      r.collapse(true);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
      return;
    }
    rem -= len;
  }
  // Fallback: ans Ende
  const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
  window.getSelection().removeAllRanges(); window.getSelection().addRange(r);
}

// Rekonstruiert den Rohausdruck (für safeEval) aus dem gerenderten HTML des Eingabefeldes.
// Kehrt die Transformationen von exprToHtml um:
//   .preview-frac → (Zähler)/(Nenner)
//   .preview-sup  → ^Inhalt
//   ⋅ / ·         → *
//   π             → pi
//   alleinsteh. e → EC
// Wird aufgerufen wenn das Feld in "always-rendered"-Modus ist (oninput, onblur).
function ceRawFromDom(el) {
  function walk(node) {
    if (node.nodeType === 3 /* TEXT_NODE */) {
      return node.textContent
        .replace(/​/g, '')        // Zero-Width-Space (Cursor-Anker) entfernen
        .replace(/[⋅·]/g, '*')        // Mittelpunkt → Multiplikation
        .replace(/π/g, 'pi')           // π → pi
        .replace(/\be\b/g, 'EC');      // alleinsteh. e → EC (Eulersche Zahl)
    }
    if (node.nodeType === 1 /* ELEMENT_NODE */) {
      const cls = node.className || '';
      // Bruch: (Zähler)/(Nenner)
      if (cls.includes('preview-frac')) {
        const numEl = Array.from(node.children).find(c => c.classList.contains('pf-num'));
        const denEl = Array.from(node.children).find(c => c.classList.contains('pf-den'));
        const num = numEl ? Array.from(numEl.childNodes).map(walk).join('') : '';
        const den = denEl ? Array.from(denEl.childNodes).map(walk).join('') : '';
        return `(${num})/(${den})`;
      }
      // Hochgestellter Exponent: ^Inhalt
      // Bei komplexem Inhalt (mit Operatoren) in Klammern einschliessen → ^(n+1)
      if (cls.includes('preview-sup')) {
        const inner = Array.from(node.childNodes).map(walk).join('');
        const needsParens = /[+\-*\/]/.test(inner) && !inner.startsWith('(');
        return needsParens ? `^(${inner})` : `^${inner}`;
      }
      // Platzhalter-Span ignorieren
      if (node.style && node.style.fontStyle === 'italic') return '';
      // Cursor-Anker: Inhalt zurückgeben (ZWS wird im Text-Knoten-Handler gestrippt)
      if (cls.includes('pf-cursor-anchor')) return Array.from(node.childNodes).map(walk).join('');
      // Sonstige Elemente: rekursiv
      return Array.from(node.childNodes).map(walk).join('');
    }
    return '';
  }
  return Array.from(el.childNodes).map(walk).join('');
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
    // overflow-x:clip statt overflow-x:hidden — clip erzwingt kein overflow-y:auto (CSS-Spezifikation),
    // sodass overflow-y:visible wirksam bleibt und das Feld bei Brüchen vertikal wächst.
    inp.style.cssText = `font-family:'Cascadia Code','Fira Mono',monospace;font-size:12px;padding:4px 8px;border:1px solid var(--border-input);border-radius:6px;background:var(--bg-input);color:var(--text);outline:none;flex:1;min-width:0;cursor:text;overflow-x:clip;overflow-y:visible;white-space:nowrap;line-height:normal;min-height:28px;${fn.visible ? '' : 'opacity:0.45;'}`;
    if (isLinked) { inp.style.background = '#f0f9ff'; inp.title = t('title_live_line'); }

    // Guard: verhindert dass oninput feuert wenn ceRender() das HTML programmatisch setzt
    let ceRendering = false;

    // Ruhezustand: formatierte Darstellung (Brüche + Exponenten, Dezimalzahlen gerundet)
    function ceRender() {
      const raw = inp.getAttribute('data-raw') || '';
      const disp = raw ? exprToDisplayStr(raw) : '';
      ceRendering = true;
      if (exprNeedsPreview(raw)) {
        inp.innerHTML = exprToHtml(disp || raw);
        // Cursor-Anker: Span am Ende sicherstellen — begrenzt Schreibmarken-Höhe auf Schriftgrösse
        if (!inp.lastChild || !inp.lastChild.classList?.contains('pf-cursor-anchor')) {
          const anchor = document.createElement('span');
          anchor.className = 'pf-cursor-anchor';
          anchor.textContent = '​';
          inp.appendChild(anchor);
        }
      }
      else { inp.textContent = disp || ''; if (!disp) { inp.innerHTML = `<span style="color:var(--text-muted);font-style:italic;">${t('eg_fn')}</span>`; } }
      ceRendering = false;
    }
    ceRender();

    inp.onfocus = () => {
      // Feld bleibt immer gerendert — kein Wechsel auf Rohtext beim Fokussieren.
      inp.style.borderColor = '#378ADD';
      setActiveInput(inp, i);
      // Exponenten-Hervorhebung: aktuell aktiven sup blau umranden
      const onSelChange = () => {
        inp.querySelectorAll('.preview-sup').forEach(s => s.classList.remove('sup-cursor-active'));
        const sel = window.getSelection(); if (!sel.rangeCount) return;
        let nd = sel.getRangeAt(0).startContainer;
        while (nd && nd !== inp) {
          if (nd.nodeType === 1 && nd.classList?.contains('preview-sup')) { nd.classList.add('sup-cursor-active'); break; }
          nd = nd.parentNode;
        }
      };
      document.addEventListener('selectionchange', onSelChange);
      inp._onSelChange = onSelChange;
      // Leeres Feld: Platzhalter entfernen damit sofort getippt werden kann
      if (!(inp.getAttribute('data-raw') || '')) {
        ceRendering = true; inp.innerHTML = ''; ceRendering = false;
      }
      // Nach kbdFrac: Cursor in den Zähler des letzten Bruchs
      const nextCursor = inp.getAttribute('data-next-cursor');
      if (nextCursor) {
        inp.removeAttribute('data-next-cursor');
        const fracs = inp.querySelectorAll('.preview-frac');
        if (fracs.length > 0) {
          const numEl = fracs[fracs.length-1].querySelector('.pf-num');
          if (numEl) {
            const r = document.createRange(); r.selectNodeContents(numEl); r.collapse(false);
            window.getSelection().removeAllRanges(); window.getSelection().addRange(r);
            return;
          }
        }
      }
      // Standardfall: Cursor ans Ende
      const r = document.createRange(); r.selectNodeContents(inp); r.collapse(false);
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    };
    inp.onblur = () => {
      // selectionchange-Listener entfernen und Hervorhebung zurücksetzen
      if (inp._onSelChange) { document.removeEventListener('selectionchange', inp._onSelChange); inp._onSelChange = null; }
      inp.querySelectorAll('.preview-sup').forEach(s => s.classList.remove('sup-cursor-active'));
      // Rohausdruck aus dem gerenderten DOM rekonstruieren und neu rendern
      const raw = ceRawFromDom(inp);
      inp.setAttribute('data-raw', raw);
      inp.style.borderColor = '';
      ceRender();
      if (!historyPaused) { clearTimeout(_histDebounce); _histDebounce = setTimeout(pushHistory, 100); }
    };
    inp.oninput = () => {
      if (ceRendering) return;
      let raw = ceRawFromDom(inp);
      // Einfache a/b-Muster automatisch als Bruch rendern (z.B. x/2 → (x)/(2))
      const converted = raw.replace(/([a-zA-Z0-9_.]+)\/([a-zA-Z0-9_.]+)/g, '($1)/($2)');
      if (converted !== raw) {
        inp.setAttribute('data-raw', converted);
        ceRender();
        // Cursor ans Ende des Nenners des letzten Bruchs
        const fracs = inp.querySelectorAll('.preview-frac');
        if (fracs.length > 0) {
          const denEl = fracs[fracs.length-1].querySelector('.pf-den');
          if (denEl) {
            const r = document.createRange(); r.selectNodeContents(denEl); r.collapse(false);
            window.getSelection().removeAllRanges(); window.getSelection().addRange(r);
          }
        }
        raw = converted;
      }
      inp.setAttribute('data-raw', raw);
      fn.expr = raw;
      clearEvalCache(); syncParams(); syncAreaSelects(); scheduleComputeSpecials();
      if (showArea) updateAreaResult(); syncLinearExtra(); scheduleDraw();
    };
    // Keine Newlines; Brüche als Einheit löschen; Exponent-Escape mit ArrowRight
    inp.onkeydown = e => {
      if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
      // ArrowRight / Tab / ArrowDown / End: Aus dem Exponenten heraus navigieren (zwei Zustände)
      if (e.key === 'ArrowRight' || e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'End') {
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
          const range = sel.getRangeAt(0);
          let nd = range.startContainer;
          // Suche nach umgebenden sup- / anchor-Element
          let supEl = null, anchEl = null, tempNd = nd;
          while (tempNd && tempNd !== inp) {
            if (tempNd.nodeType === 1 && tempNd.classList?.contains('preview-sup')) { supEl = tempNd; break; }
            tempNd = tempNd.parentNode;
          }
          tempNd = nd;
          while (tempNd && tempNd !== inp) {
            if (tempNd.nodeType === 1 && tempNd.classList?.contains('pf-cursor-anchor')) { anchEl = tempNd; break; }
            tempNd = tempNd.parentNode;
          }
          const anchAfterSup = anchEl && anchEl.previousSibling?.classList?.contains('preview-sup');

          if (supEl) {
            // Zustand 1: Kursor im sup → in den Anker danach bewegen
            e.preventDefault();
            let anch = supEl.nextSibling;
            if (!anch || !anch.classList?.contains('pf-cursor-anchor')) {
              anch = document.createElement('span'); anch.className = 'pf-cursor-anchor'; anch.textContent = '​';
              supEl.parentNode.insertBefore(anch, supEl.nextSibling);
            }
            const nr = document.createRange();
            const tx = anch.firstChild;
            if (tx && tx.nodeType === 3) { nr.setStart(tx, tx.length); } else { nr.selectNodeContents(anch); nr.collapse(false); }
            nr.collapse(true); sel.removeAllRanges(); sel.addRange(nr);
            return;
          }
          if (anchAfterSup) {
            // Zustand 2: Kursor im Anker → hinter den Anker bewegen
            e.preventDefault();
            const nr = document.createRange();
            const after = anchEl.nextSibling;
            if (after && after.nodeType === 3) { nr.setStart(after, 0); }
            else if (after) { nr.setStartBefore(after); }
            else { nr.selectNodeContents(inp); nr.collapse(false); }
            nr.collapse(true); sel.removeAllRanges(); sel.addRange(nr);
            return;
          }
        }
      }
      // Backspace direkt nach einem Bruch: Bruch als Ganzes entfernen
      if (e.key === 'Backspace') {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        if (!range.collapsed) return; // Selektion → Browser löscht normal
        const node = range.startContainer, offset = range.startOffset;
        let fracToDelete = null;
        if (node.nodeType === 3 && offset === 0 &&
            node.previousSibling?.classList?.contains('preview-frac'))
          fracToDelete = node.previousSibling;
        else if (node === inp && offset > 0 &&
                 inp.childNodes[offset-1]?.classList?.contains('preview-frac'))
          fracToDelete = inp.childNodes[offset-1];
        if (fracToDelete) {
          e.preventDefault();
          fracToDelete.remove();
          const raw = ceRawFromDom(inp);
          inp.setAttribute('data-raw', raw); fn.expr = raw;
          clearEvalCache(); syncParams(); syncAreaSelects(); scheduleComputeSpecials();
          if (showArea) updateAreaResult(); scheduleDraw();
        }
      }
    };

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

