// ═══════════════════════════════════════════════════════════════════
// MODUL: events — Maus-, Touch-Events & Undo/Redo
// Enthält:  canvas mousedown/move/up/wheel
//           Touch-Pinch-Zoom, Pan, Punkt-Drag
//           commitAndUndo(), commitAndRedo(), pushHistory()
// Ändern:  Zoom-Geschwindigkeit → wheelDelta-Faktor in wheel-Handler
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// MAUS-EVENTS
// ═══════════════════════════════════════════════════════════════════

// mousedown: Prüft in fester Prioritätsreihenfolge was gedrückt wurde.
// Reihenfolge: Einheitskreis > Line-2pt-Picking > Graph-Punkt > Freier Punkt > Alt/Modus > View-Pan
canvas.addEventListener('mousedown', e => {
  e.preventDefault();
  const m = mousePos(e);

  // 0. Lösch-Modus: Objekt löschen
  if (deleteMode) { tryDeleteAt(m.x, m.y); return; }

  // 1. Einheitskreis-Punkt drag starten (höchste Priorität wenn Kreis aktiv)
  if (document.getElementById('chk-unitcircle').checked) {
    const ci = findNearCirclePt(m.x, m.y);
    if (ci >= 0) { drag = { type:'circlept', idx:ci }; canvas.style.cursor = 'grabbing'; return; }
    // Klick nahe Kreis: Punkt setzen/löschen (kein Drag)
    if (unitCircleHandleClick(m.x, m.y)) return;
  }

  // 1b. Fit-Pick-Modus: Koordinaten in das nächste leere Punktfeld eintragen
  if (fitPickMode) { fitPickClick(m.x, m.y); return; }

  // 1c. Steigungsdreieck-Pick-Modus
  if (slopeTriPickMode) { slopeTriPickClick(m.x, m.y); return; }

  // 2. Gerade-durch-2-Punkte Picking-Modus
  if (line2ptPicking) { line2ptPickClick(m.x, m.y); return; }

  // 3. Graph-Punkt-Modus: Punkt verschieben oder löschen oder neu setzen
  if (graphPtMode) {
    const gi = findNearGP(m.x, m.y);
    if (gi >= 0) {
      const gp = graphPoints[gi]; const fn = functions[gp.fi];
      const y = safeEval(fn?.expr || '', gp.x);
      // Klick auf Löschen-X (8px rechts, 6px oben vom Punkt-Zentrum)
      if (isFinite(y)) { const { cx, cy } = toCanvas(gp.x, y); if (Math.hypot(cx+8-m.x, cy-6-m.y) < 10) { graphPoints.splice(gi, 1); scheduleDraw(); return; } }
      drag = { type:'graphpt', idx:gi }; canvas.style.cursor = 'grabbing';
    } else {
      addGraphPoint(m.x, m.y); // neuen Punkt auf Kurve setzen
    }
    return;
  }

  // 3b. Graph-Punkte immer ziehbar (auch ohne graphPtMode) — Löschen per X
  {
    const gi = findNearGP(m.x, m.y);
    if (gi >= 0) {
      const gp = graphPoints[gi]; const fn = functions[gp.fi];
      const y = safeEval(fn?.expr || '', gp.x);
      if (isFinite(y)) {
        const { cx, cy } = toCanvas(gp.x, y);
        if (Math.hypot(cx+8-m.x, cy-6-m.y) < 10) { graphPoints.splice(gi, 1); scheduleDraw(); return; }
      }
      drag = { type:'graphpt', idx:gi }; canvas.style.cursor = 'grabbing'; return;
    }
  }

  // 4. Fit-Punkte: ziehbar (Funktionen durch gewählte Punkte)
  {
    const fpt = typeof findNearFitPt === 'function' ? findNearFitPt(m.x, m.y) : null;
    if (fpt) { drag = { type:'fitpt', fi: fpt.fi, pi: fpt.pi }; canvas.style.cursor = 'grabbing'; return; }
  }

  // 4b. Freie Punkte: immer ziehbar (kein Modus nötig)
  const pi = findNearPoint(m.x, m.y);
  if (pi >= 0) { drag = { type:'point', idx:pi }; canvas.style.cursor = 'grabbing'; return; }

  // 5. Alt+Klick oder Punkt-Modus: neuen freien Punkt setzen
  if (altDown || pointMode) { addPointAt(fromCanvas(m.x, m.y).x, fromCanvas(m.x, m.y).y); return; }

  // 6. View draggen (Standard: Klick auf leere Fläche)
  drag = { type:'view', startM:m, startView:{...view} }; canvas.style.cursor = 'grabbing';
});

// mousemove: Drag-Handler für alle Drag-Typen + Hover-Tracking
canvas.addEventListener('mousemove', e => {
  const m = mousePos(e);
  if (drag) {
    if (drag.type === 'view') {
      // View verschieben: Delta in Canvas-Pixeln → Mathe-Koordinaten umrechnen
      const w = getW(), h = getH();
      const dx = (m.x - drag.startM.x) / w * (drag.startView.xmax - drag.startView.xmin);
      const dy = (m.y - drag.startM.y) / h * (drag.startView.ymax - drag.startView.ymin);
      view.xmin = drag.startView.xmin - dx; view.xmax = drag.startView.xmax - dx;
      view.ymin = drag.startView.ymin + dy; view.ymax = drag.startView.ymax + dy; // y invertiert!
      syncInputs(); hoverPt = null; scheduleComputeSpecials(); scheduleDraw();

    } else if (drag.type === 'point') {
      // Freien Punkt verschieben: direkte Koordinaten-Übertragung
      const raw = fromCanvas(m.x, m.y);
      const pt2 = snapToGrid(raw.x, raw.y);
      points[drag.idx].x = pt2.x; points[drag.idx].y = pt2.y;
      // Alle verknüpften Geraden live aktualisieren
      updateAllLinkedLines();
      renderPointList(); // Koordinaten in Sidebar aktualisieren
      scheduleComputeSpecials(); // Spezielle Punkte neu berechnen (verzögert)
      // Tooltip mit aktuellen Koordinaten zeigen
      const tip = document.getElementById('tooltip');
      tip.style.display = 'block'; tip.style.left = (m.x+15)+'px'; tip.style.top = (m.y-25)+'px';
      tip.textContent = niceCoord(pt2.x, pt2.y);
      scheduleDraw();

    } else if (drag.type === 'graphpt') {
      // Graph-Punkt entlang Kurve verschieben: x-Koordinate ändern, y folgt der Funktion
      let newX = fromCanvas(m.x, m.y).x;
      let snapKind = '';
      const gp2 = graphPoints[drag.idx], fn2 = functions[gp2.fi];
      {
        const SNAP_PX = 20;
        const v2 = isoView || view;
        const pxPerUnit = getW() / (v2.xmax - v2.xmin);
        const snapDist = SNAP_PX / pxPerUnit;
        const mouseXMath = newX;
        // Immer: Snap zu Sonderpunkten (Extrema, Nullstellen, Schnittpunkte)
        let snapToSpecial = false;
        for (const sp of specials) {
          if (sp.fi !== gp2.fi && sp.fj !== gp2.fi) continue;
          if (Math.abs(mouseXMath - sp.x) < snapDist) {
            newX = sp.x; snapToSpecial = true; snapKind = sp.kind; break;
          }
        }
        // Gitter-Snapping nur wenn Checkbox aktiviert
        if (!snapToSpecial && document.getElementById('chk-gridsnap').checked) {
          const xs = gridStep(v2.xmax - v2.xmin);
          const snappedX = Math.round(mouseXMath / xs) * xs;
          if (Math.abs(mouseXMath - snappedX) < snapDist) newX = snappedX;
        }
      }
      graphPoints[drag.idx].x = newX;
      const gp = graphPoints[drag.idx], fn = functions[gp.fi];
      if (fn) {
        const y = safeEval(fn.expr, gp.x);
        const tip = document.getElementById('tooltip');
        const kindLabel = snapKind ? ` [${snapKind}]` : '';
        tip.style.display = 'block'; tip.style.left = (m.x+15)+'px'; tip.style.top = (m.y-25)+'px';
        tip.textContent = `f${gp.fi+1}: ${niceCoord(gp.x, isFinite(y) ? y : NaN)}${kindLabel}`;
      }
      scheduleDraw();

    } else if (drag.type === 'circlept') {
      // Einheitskreis-Punkt entlang Kreis drehen: Winkel aus Mausposition
      unitCirclePts[drag.idx].angle = circleAngleFromCanvas(m.x, m.y);
      scheduleDraw();

    } else if (drag.type === 'fitpt') {
      const fn = functions[drag.fi];
      if (fn && fn.fitPts) {
        const raw = fromCanvas(m.x, m.y);
        let pt2 = snapToGrid(raw.x, raw.y);
        // Nullstellenform: erste zwei Punkte auf x-Achse fixieren
        if (fn.fitType === 'roots' && drag.pi < 2) pt2 = { x: pt2.x, y: 0 };
        // Exp/Log 2-Punkte: Punkte dürfen nicht exakt gleiche x-Koordinate haben
        // (dx=0 → b=∞). Beim Überqueren Neuberechnung kurz überspringen — danach
        // rechnet die Formel auf der anderen Seite wieder korrekt.
        if (fn.fitPts.length >= 2 &&
            (fn.fitType === 'exponential' || fn.fitType === 'logarithm')) {
          const otherX = fn.fitPts[drag.pi === 0 ? 1 : 0].x;
          if (Math.abs(pt2.x - otherX) < 0.02) {
            // Punkt trotzdem verschieben, aber Neuberechnung weglassen
            fn.fitPts[drag.pi].x = pt2.x;
            fn.fitPts[drag.pi].y = pt2.y;
            scheduleDraw();
            return;
          }
        }
        fn.fitPts[drag.pi].x = pt2.x;
        fn.fitPts[drag.pi].y = pt2.y;
        recomputeFitFn(drag.fi);
        scheduleComputeSpecials();
        const tip = document.getElementById('tooltip');
        tip.style.display = 'block'; tip.style.left = (m.x+15)+'px'; tip.style.top = (m.y-25)+'px';
        tip.textContent = niceCoord(pt2.x, pt2.y);
        scheduleDraw();
      }
    }
    return; // kein Hover während Drag
  }

  // Kein Drag: Hover-Position tracken und Cursor anpassen
  hoverPt = fromCanvas(m.x, m.y).x;
  const nearPt = findNearPoint(m.x, m.y) >= 0;
  const nearGP = graphPtMode && findNearGP(m.x, m.y) >= 0;
  const nearCP = document.getElementById('chk-unitcircle').checked && findNearCirclePt(m.x, m.y) >= 0;
  const nearFP = typeof findNearFitPt === 'function' && !!findNearFitPt(m.x, m.y);
  // Grab-Cursor wenn Maus über ziehendem Element
  canvas.style.cursor = (nearPt || nearGP || nearCP || nearFP) ? 'grab' : 'default';
  scheduleDraw();
});

// mouseup: Drag beenden, Tooltip verstecken, Cursor zurücksetzen
canvas.addEventListener('mouseup', () => {
  // Undo-Eintrag nach Drag (Punkt verschieben) — muss VOR drag=null sein
  if (drag && (drag.type === 'point' || drag.type === 'graphpt' || drag.type === 'fitpt')) pushHistory();
  drag = null;
  document.getElementById('tooltip').style.display = 'none';
  // Cursor je nach aktivem Modus
  canvas.style.cursor = pointMode || graphPtMode || line2ptPicking ? 'crosshair' : 'grab';
  scheduleDraw();
});

// mouseleave: Hover-Linie ausblenden wenn Maus den Canvas verlässt
canvas.addEventListener('mouseleave', () => {
  hoverPt = null; drag = null;
  document.getElementById('tooltip').style.display = 'none';
  scheduleDraw();
});

// wheel: Zoomen mit Mausrad, Zoom-Zentrum = Mausposition
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const m = mousePos(e);
  const raw = e.deltaMode === 1 ? e.deltaY*20 : e.deltaMode === 2 ? e.deltaY*300 : e.deltaY;
  const factor = 1 + Math.sign(raw) * Math.min(Math.abs(raw)/800, 0.06);
  const pt = fromCanvas(m.x, m.y);
  view.xmin = pt.x + (view.xmin - pt.x) * factor;
  view.xmax = pt.x + (view.xmax - pt.x) * factor;
  view.ymin = pt.y + (view.ymin - pt.y) * factor;
  view.ymax = pt.y + (view.ymax - pt.y) * factor;
  syncInputs(); scheduleComputeSpecials(); if (showArea) updateAreaResult(); scheduleDraw();
}, { passive: false });

// ═══════════════════════════════════════════════════════════════════
// TOUCH-SUPPORT (Pinch-Zoom, Pan, Punkt-Drag)
// ═══════════════════════════════════════════════════════════════════

let touchState = null; // { type:'pan'|'pinch'|'drag', ... }

function touchPos(t) {
  const r = canvas.getBoundingClientRect();
  return { x: t.clientX - r.left, y: t.clientY - r.top };
}

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const touches = e.touches;

  if (touches.length === 1) {
    const m = touchPos(touches[0]);

    // 0. Lösch-Modus: Objekt löschen
    if (deleteMode) { tryDeleteAt(m.x, m.y); return; }

    // Einheitskreis-Punkt?
    if (document.getElementById('chk-unitcircle').checked) {
      const ci = findNearCirclePt(m.x, m.y);
      if (ci >= 0) { drag = { type:'circlept', idx:ci }; touchState = { type:'drag' }; return; }
      if (unitCircleHandleClick(m.x, m.y)) return;
    }

    // 1b. Fit-Pick-Modus: Koordinaten in das nächste leere Punktfeld eintragen
    if (fitPickMode) { fitPickClick(m.x, m.y); return; }

    // 1c. Steigungsdreieck-Pick-Modus
    if (slopeTriPickMode) { slopeTriPickClick(m.x, m.y); return; }

    // 2-Punkt-Picking?
    if (line2ptPicking) { line2ptPickClick(m.x, m.y); return; }

    // Graph-Punkt ziehen?
    const gi = findNearGP(m.x, m.y);
    if (gi >= 0) { drag = { type:'graphpt', idx:gi }; touchState = { type:'drag' }; return; }

    // Fit-Punkt ziehen?
    const fpt = typeof findNearFitPt === 'function' ? findNearFitPt(m.x, m.y) : null;
    if (fpt) { drag = { type:'fitpt', fi: fpt.fi, pi: fpt.pi }; touchState = { type:'drag' }; return; }

    // Freier Punkt ziehen?
    const pi = findNearPoint(m.x, m.y);
    if (pi >= 0) { drag = { type:'point', idx:pi }; touchState = { type:'drag' }; return; }

    // Punkt-setzen-Modus?
    if (pointMode) { addPointAt(fromCanvas(m.x, m.y).x, fromCanvas(m.x, m.y).y); return; }
    if (graphPtMode) { addGraphPoint(m.x, m.y); return; }

    // Pan — isoView beim Start merken für korrekte Panning-Geschwindigkeit
    // Ohne das ist vertikales Panning im Hochformat viel zu langsam,
    // da isoView.yrange >> view.yrange wenn Canvas hochformatig ist.
    const isoAtStart = isoView ? {...isoView} : {...view};
    touchState = { type:'pan', startM: m, startView: {...view}, startIso: isoAtStart };

  } else if (touches.length === 2) {
    const a = touchPos(touches[0]), b2 = touchPos(touches[1]);
    const dist = Math.hypot(a.x - b2.x, a.y - b2.y);
    const cx = (a.x + b2.x) / 2, cy2 = (a.y + b2.y) / 2;
    drag = null;
    touchState = { type:'pinch', startDist: dist, startView: {...view},
                   centerM: {x: cx, y: cy2}, centerPt: fromCanvas(cx, cy2) };
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!touchState) return;
  const touches = e.touches;

  if (touchState.type === 'drag' && drag && touches.length === 1) {
    const m = touchPos(touches[0]);
    // Dieselbe Logik wie mousemove
    if (drag.type === 'point') {
      const raw = fromCanvas(m.x, m.y);
      const pt2 = snapToGrid(raw.x, raw.y);
      points[drag.idx].x = pt2.x; points[drag.idx].y = pt2.y;
      updateAllLinkedLines(); renderPointList(); scheduleComputeSpecials();
      const tip = document.getElementById('tooltip');
      tip.style.display = 'block'; tip.style.left = (m.x+15)+'px'; tip.style.top = (m.y-25)+'px';
      tip.textContent = niceCoord(pt2.x, pt2.y);
    } else if (drag.type === 'graphpt') {
      let newX = fromCanvas(m.x, m.y).x;
      const gp2t = graphPoints[drag.idx];
      if (gp2t) {
        const SNAP_PX = 20;
        const v2 = isoView || view;
        const pxPerUnit = getW() / (v2.xmax - v2.xmin);
        const snapDist = SNAP_PX / pxPerUnit;
        const mouseXMath = newX;
        let snapped = false;
        for (const sp of specials) {
          if (sp.fi !== gp2t.fi && sp.fj !== gp2t.fi) continue;
          if (Math.abs(mouseXMath - sp.x) < snapDist) { newX = sp.x; snapped = true; break; }
        }
        if (!snapped && document.getElementById('chk-gridsnap').checked) {
          const xs = gridStep(v2.xmax - v2.xmin);
          const snappedX = Math.round(mouseXMath / xs) * xs;
          if (Math.abs(mouseXMath - snappedX) < snapDist) newX = snappedX;
        }
      }
      graphPoints[drag.idx].x = newX;
    } else if (drag.type === 'circlept') {
      unitCirclePts[drag.idx].angle = circleAngleFromCanvas(m.x, m.y);
    } else if (drag.type === 'fitpt') {
      const fn = functions[drag.fi];
      if (fn && fn.fitPts) {
        const raw = fromCanvas(m.x, m.y);
        let pt2 = snapToGrid(raw.x, raw.y);
        if (fn.fitType === 'roots' && drag.pi < 2) pt2 = { x: pt2.x, y: 0 };
        // Exp/Log 2-Punkte: Überqueren erlaubt, nur bei dx≈0 Neuberechnung überspringen
        if (fn.fitPts.length >= 2 &&
            (fn.fitType === 'exponential' || fn.fitType === 'logarithm')) {
          const otherX = fn.fitPts[drag.pi === 0 ? 1 : 0].x;
          if (Math.abs(pt2.x - otherX) < 0.02) {
            fn.fitPts[drag.pi].x = pt2.x;
            fn.fitPts[drag.pi].y = pt2.y;
            scheduleDraw();
            return;
          }
        }
        fn.fitPts[drag.pi].x = pt2.x;
        fn.fitPts[drag.pi].y = pt2.y;
        recomputeFitFn(drag.fi);
        scheduleComputeSpecials();
      }
    }
    scheduleDraw();

  } else if (touchState.type === 'pan' && touches.length === 1) {
    const m = touchPos(touches[0]);
    const w = getW(), h = getH();
    const sv = touchState.startView;
    const si = touchState.startIso || sv; // isoView beim Pan-Start → korrekte Geschwindigkeit
    // Absolutes Delta vom Pan-Startpunkt (verhindert Akkumulations-Fehler)
    const dx = (m.x - touchState.startM.x) / w * (si.xmax - si.xmin);
    const dy = (m.y - touchState.startM.y) / h * (si.ymax - si.ymin);
    view.xmin = sv.xmin - dx; view.xmax = sv.xmax - dx;
    view.ymin = sv.ymin + dy; view.ymax = sv.ymax + dy;
    syncInputs(); scheduleComputeSpecials(); scheduleDraw();

  } else if (touchState.type === 'pinch' && touches.length === 2) {
    const a = touchPos(touches[0]), b2 = touchPos(touches[1]);
    const dist = Math.hypot(a.x - b2.x, a.y - b2.y);
    const factor = touchState.startDist / dist;
    const cp = touchState.centerPt, sv = touchState.startView;
    view.xmin = cp.x + (sv.xmin - cp.x) * factor;
    view.xmax = cp.x + (sv.xmax - cp.x) * factor;
    view.ymin = cp.y + (sv.ymin - cp.y) * factor;
    view.ymax = cp.y + (sv.ymax - cp.y) * factor;
    syncInputs(); scheduleComputeSpecials(); scheduleDraw();
  }
}, { passive: false });

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  if (drag && (drag.type === 'point' || drag.type === 'graphpt' || drag.type === 'fitpt')) pushHistory();
  drag = null; touchState = null;
  document.getElementById('tooltip').style.display = 'none';
  scheduleDraw();
}, { passive: false });

// Alt-Taste tracken (Alt+Klick = Punkt setzen)
document.addEventListener('keydown', e => {
  if (e.altKey) altDown = true;
  // Strg+Z = Undo, Strg+Y / Strg+Shift+Z = Redo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); commitAndUndo(); }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); commitAndRedo(); }
});
document.addEventListener('keyup', e => { if (!e.altKey) altDown = false; });

// Neu zeichnen wenn Canvas-Container seine Grösse ändert (ResizeObserver)
new ResizeObserver(() => scheduleDraw()).observe(document.getElementById('canvas-wrap'));
window.addEventListener('resize', () => scheduleDraw()); // Fallback

// ═══════════════════════════════════════════════════════════════════
// UNDO / REDO
// ═══════════════════════════════════════════════════════════════════

// History-Stack: Array von serialisierten Zuständen (JSON-Strings)
// historyIdx zeigt auf den aktuellen Zustand.
let history = [], historyIdx = -1, historyPaused = false;

// Serialisiert den Plot-INHALT (ohne View/Zoom) für Undo/Redo.
// View-Änderungen (Pan, Zoom) werden bewusst nicht rückgängig gemacht.
function captureState() {
  return JSON.parse(JSON.stringify({
    functions, params, points, linkedLines,
    graphPoints, unitCirclePts, showArea
  }));
}

// Stellt einen serialisierten Inhalt-Zustand wieder her (View bleibt unverändert)
function applyState(s) {
  historyPaused = true;
  // Deep Copy! Ohne dies würden Live-Mutations die History-Einträge korrumpieren.
  const sc = JSON.parse(JSON.stringify(s));
  functions = sc.functions; params = sc.params; points = sc.points;
  linkedLines = sc.linkedLines; graphPoints = sc.graphPoints;
  unitCirclePts = sc.unitCirclePts; showArea = sc.showArea;
  // view wird NICHT wiederhergestellt
  clearEvalCache();
  renderFuncList(); renderPointList(); syncParams(); syncAreaSelects();
  scheduleComputeSpecials();
  document.getElementById('area-toggle-btn').classList.toggle('active-btn', showArea);
  document.getElementById('area-toggle-btn').textContent = showArea ? t('btn_area_hide') : t('btn_area');
  if (showArea) updateAreaResult();
  scheduleDraw();
  // Längere Verzögerung: verzögerte DOM-Events (blur, change) nach renderFuncList
  // sollen nicht in die History schreiben.
  setTimeout(() => { historyPaused = false; }, 250);
}

// Schreibt den aktuellen Zustand in den History-Stack.
// Identische Zustände werden nicht doppelt gespeichert (verhindert Mehrfach-Einträge).
// Max. 50 Einträge (Speicher schonen).
function pushHistory() {
  if (historyPaused) return;
  const cur = JSON.stringify(captureState());
  // Nicht speichern wenn identisch mit letztem Eintrag
  if (history.length > 0 && JSON.stringify(history[historyIdx]) === cur) return;
  history = history.slice(0, historyIdx + 1);
  history.push(JSON.parse(cur));
  if (history.length > 50) history.shift();
  historyIdx = history.length - 1;
  updateUndoRedoBtns();
}

function updateUndoRedoBtns() {
  document.getElementById('undo-btn').disabled = historyIdx <= 0;
  document.getElementById('redo-btn').disabled = historyIdx >= history.length - 1;
}

function undo() {
  if (historyIdx <= 0) return;
  historyIdx--;
  applyState(history[historyIdx]);
  updateUndoRedoBtns();
}

function redo() {
  if (historyIdx >= history.length - 1) return;
  historyIdx++;
  applyState(history[historyIdx]);
  updateUndoRedoBtns();
}

// Aktuellen Zustand zuerst committen, dann Undo/Redo.
// Verhindert dass ungesicherte Eingaben (noch kein blur) verloren gehen.
function commitAndUndo() {
  clearTimeout(_histDebounce);
  pushHistory(); // sichert z.B. noch laufende Eingaben
  undo();
}
function commitAndRedo() {
  clearTimeout(_histDebounce);
  pushHistory();
  redo();
}

// Undo-Hooks: wichtige Zustandsänderungen in History schreiben.
// Wir patchen die relevanten Funktionen mit einem pushHistory()-Aufruf.
const _addPointAt = addPointAt;
window.addPointAt = function(x, y) {
  const idx = _addPointAt(x, y);
  pushHistory();
  return idx;
};

const _deletePoint = deletePoint;
window.deletePoint = function(i) {
  _deletePoint(i);
  pushHistory();
};

const _addFunction = addFunction;
window.addFunction = function() {
  _addFunction();
  pushHistory();
};

const _clearAll = clearAll;
window.clearAll = function() {
  _clearAll();
  pushHistory();
};

// Undo bei mouseup nach Drag (Punkt verschieben) — bereits im mouseup-Handler oben integriert.

// Undo nach Funktions-Eingabe (blur des Textfeldes) — debounced um Mehrfach-Einträge zu vermeiden
let _histDebounce = null;
document.getElementById('func-list').addEventListener('change', () => {
  clearTimeout(_histDebounce);
  _histDebounce = setTimeout(pushHistory, 80);
}, true);

