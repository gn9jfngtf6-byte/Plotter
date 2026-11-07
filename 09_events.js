// ═══════════════════════════════════════════════════════════════════
// MODUL: events — Maus-, Touch-Events & Undo/Redo
// Enthält:  canvas mousedown/move/up/wheel
//           Touch: Pinch-Zoom, Verschieben, Ziehen (nutzt dieselben Funktionen wie die Maus)
//           commitAndUndo(), commitAndRedo(), pushHistory()
// Ändern:  Zoom-Geschwindigkeit → wheelDelta-Faktor in wheel-Handler
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// MAUS-EVENTS
// ═══════════════════════════════════════════════════════════════════

// mousedown: Prüft in fester Prioritätsreihenfolge was gedrückt wurde.
// Reihenfolge: Einheitskreis > Line-2pt-Picking > Graph-Punkt > Freier Punkt > Alt/Modus > View-Pan
// pointermove/pointerleave: Laserpointer-Position tracken (Maus, Stift, Touch)
// Findet die Funktion (fi), deren Steigungsdreieck-Punkt B (zweiter,
// verschiebbarer Eckpunkt in slopeTriPtsMap) in Klick-/Touch-Nähe liegt.
// Punkt A (erster Eckpunkt, z.B. der y-Achsenabschnitt bei "y = mx + q")
// ist bewusst NICHT Teil dieser Suche — er dient als fixierter Anker und
// wird nie über diese Funktion verschoben (siehe linAddSlopeForm()).
function findNearSlopeTriB(mx, my) {
  const chk = document.getElementById('chk-slopetri');
  if (!chk || !chk.checked) return -1;
  for (const key in slopeTriPtsMap) {
    const fi = parseInt(key, 10);
    const fn = functions[fi];
    const pts = slopeTriPtsMap[fi];
    if (!fn || fn.visible === false || !pts || pts.length !== 2) continue;
    if (!fn.expr || !fn.expr.trim() || !isLinearFunc(fn.expr)) continue;
    const xB = pts[1].x;
    const yB = safeEval(fn.expr, xB);
    if (!isFinite(yB)) continue;
    const { cx, cy } = toCanvas(xB, yB);
    if (Math.hypot(cx - mx, cy - my) < hitR(10)) return fi;
  }
  return -1;
}

// Position des Live-Tooltips (Koordinaten beim Ziehen): bei der Maus rechts oben vom Zeiger,
// bei Touch deutlich ÜBER dem Finger, damit er nicht vom Finger verdeckt wird.
function placeDragTip(tip, m) {
  tip.style.display = 'block';
  if (inputIsTouch) {
    tip.style.left = Math.max(4, Math.min(m.x - 45, getW() - 140)) + 'px';
    tip.style.top = Math.max(4, m.y - 78) + 'px';
  } else {
    tip.style.left = (m.x + 15) + 'px';
    tip.style.top = (m.y - 25) + 'px';
  }
}

canvas.addEventListener('pointermove', e => {
  if (!pointerMode || !e.isPrimary) return;
  const r = canvas.getBoundingClientRect();
  pointerPos = { x: e.clientX - r.left, y: e.clientY - r.top };
  scheduleDraw();
});
canvas.addEventListener('pointerleave', e => {
  if (!pointerMode) return;
  pointerPos = null;
  scheduleDraw();
});

canvas.addEventListener('mousedown', e => {
  e.preventDefault();
  inputIsTouch = false;
  // Pointer-Modus: alle anderen Interaktionen blockieren
  if (pointerMode) return;
  canvasPress(mousePos(e));
});

// Gemeinsame Logik für MAUS und TOUCH: «Finger/Maus gedrückt an Position m».
// Wird vom mousedown-Handler (direkt) und vom touchstart-Handler (unten, nach
// kurzer Wartezeit, damit ein zweiter Finger noch einen Pinch statt einer
// Punkt-Aktion auslösen kann) aufgerufen. Früher gab es für Touch eine zweite,
// von Hand nachgepflegte Kopie dieser Logik — die hinkte der Maus-Variante
// hinterher (kein Löschen-Kreuz bei Graph-Punkten, keine Koordinaten-Anzeige
// beim Ziehen, andere Reihenfolge der Modi …). Jetzt gibt es nur noch EINE.
function canvasPress(m) {

  // 0. Lösch-Modus: Objekt löschen
  if (deleteMode) { tryDeleteAt(m.x, m.y); return; }

  // 0a. Geometrie (27_geo_ui.js): aktives Werkzeug, Punkte der Konstruktion ziehen
  if (typeof geoPress === 'function' && geoPress(m)) return;

  // 0b. Graph-Punkte immer ziehbar (auch ohne graphPtMode) — Löschen per X.
  // WICHTIG: Diese Prüfung muss VOR dem Einheitskreis-Klick-Handler (unten)
  // laufen — Graph-Punkte auf sin/cos/tan (siehe trigAddFunction() in
  // 06_ui_functions.js) liegen oft nur wenige Pixel vom Einheitskreis
  // entfernt (Radius=1 ≈ Funktionswert), sonst würde ein Klick darauf
  // stattdessen fälschlich einen neuen Einheitskreis-Punkt setzen.
  {
    // Löschen-Kreuz: nur ausserhalb des Punktkörpers (siehe findGraphPtDeleteHit(), 08_draw.js)
    const gdel = findGraphPtDeleteHit(m.x, m.y);
    if (gdel >= 0) { graphPoints.splice(gdel, 1); pushHistory(); scheduleDraw(); return; }
    const gi0 = findNearGP(m.x, m.y);
    if (gi0 >= 0) { drag = { type:'graphpt', idx:gi0 }; canvas.style.cursor = 'grabbing'; return; }
  }

  // 0c. Einheitskreis-Punkt selbst ODER seine Projektion auf dem Graphen
  // (sin/cos/tan aufgeschaltet über trigAddFunction(), siehe
  // 06_ui_functions.js) — beides derselbe Punkt (nicht zwei unabhängige!),
  // ziehbar auf BEIDEN Darstellungen. findNearCircleOrTrigHit() (08_draw.js)
  // entscheidet per Distanzvergleich, welches der beiden Ziele der Maus
  // tatsächlich näher liegt — WICHTIG, weil die Graph-Projektion (z.B. bei
  // cos nahe der "Dottie-Zahl" ≈0.739 rad) fast exakt auf dem Kreis-Punkt
  // liegen kann; ein einfaches "zuerst prüfen" würde dann immer denselben
  // Typ greifen, selbst wenn die Maus klar näher am anderen Punkt ist.
  if (document.getElementById('chk-unitcircle').checked) {
    const hit0 = findNearCircleOrTrigHit(m.x, m.y);
    if (hit0 && hit0.type === 'circlept') { drag = { type:'circlept', idx: hit0.idx }; canvas.style.cursor = 'grabbing'; return; }
    if (hit0 && hit0.type === 'trigproj') { drag = { type:'trigproj', ucpIdx: hit0.ucpIdx, kind: hit0.kind }; canvas.style.cursor = 'grabbing'; return; }
  }

  // 0d. Zielfunktions-Griff der linearen Optimierung immer ziehbar (siehe
  // 17_linopt.js: findNearLoHandle()/loUpdateFromDrag()) — sobald eine
  // Zielfunktion aufgeschaltet ist (loObjActive).
  if (typeof findNearLoHandle === 'function' && findNearLoHandle(m.x, m.y)) {
    drag = { type:'loobj' }; canvas.style.cursor = 'grabbing'; return;
  }

  // 1. Einheitskreis: Klick nahe dem Ring, aber auf keinen bestehenden Punkt
  // (das wurde schon in 0c abgefangen) → neuen Punkt setzen/löschen.
  if (document.getElementById('chk-unitcircle').checked) {
    if (unitCircleHandleClick(m.x, m.y)) return;
  }

  // 1b. Fit-Pick-Modus: Koordinaten in das nächste leere Punktfeld eintragen
  if (fitPickMode) { fitPickClick(m.x, m.y); return; }

  // 1c. Steigungsdreieck-Pick-Modus
  if (slopeTriPickMode) { slopeTriPickClick(m.x, m.y); return; }

  // 1d. Senkrechte/Mittelsenkrechte: 2-Schritt-Klick-Ablauf (Punkt+Gerade
  // bzw. 2 Punkte), siehe _perpFlowToggle()/perpFlowPickClick() in 11_fitting.js
  if (perpFlowKind) { perpFlowPickClick(m.x, m.y); return; }

  // 2. Gerade-durch-2-Punkte Picking-Modus
  if (line2ptPicking) { line2ptPickClick(m.x, m.y); return; }

  // 2b. Steigungsdreieck-Punkt B ziehen (verschiebbarer zweiter Eckpunkt,
  // z.B. bei "y = mx + q" — Punkt A bleibt fix am y-Achsenabschnitt).
  // Vor den Graph-Punkt-Checks, damit ein Klick auf diesen Punkt nicht
  // stattdessen einen neuen Graph-Punkt anlegt oder ihn ansonsten verdeckt.
  {
    const sfi = findNearSlopeTriB(m.x, m.y);
    if (sfi >= 0) { drag = { type:'slopetript', fi: sfi, pi: 1 }; canvas.style.cursor = 'grabbing'; return; }
  }

  // 2c. Differenzenquotient-Applet: Punkt A ODER B ziehen (siehe
  // diffQuotSetup() in 06_ui_functions.js / drawDiffQuot() in 08_draw.js).
  // BEIDE Punkte sind ziehbar (Nutzerwunsch) — findNearDiffQuotHit() gibt
  // zurück, welcher der beiden (falls überhaupt einer) getroffen wurde.
  {
    const dqHit = findNearDiffQuotHit(m.x, m.y);
    if (dqHit) {
      // 'side' merkt sich, auf welcher Seite des JEWEILS ANDEREN Punktes
      // sich der gezogene Punkt beim Start des Ziehens befand — der gezogene
      // Punkt darf den anderen beim Ziehen nicht überspringen, sondern
      // bleibt auf dieser Seite (siehe mousemove unten), darf aber exakt mit
      // ihm zusammenfallen.
      const otherX = dqHit === 'A' ? diffQuot.xB : diffQuot.xA;
      const ownX = dqHit === 'A' ? diffQuot.xA : diffQuot.xB;
      const side = ownX >= otherX ? 1 : -1;
      drag = { type:'diffquotpt', which: dqHit, side }; canvas.style.cursor = 'grabbing'; return;
    }
  }

  // 2d. Ober-/Untersummen-Applet: Intervallgrenze a ODER b ziehen — exakt
  // gleiches "kann nicht überspringen, darf zusammenfallen"-Muster wie beim
  // Differenzenquotient-Applet oben (2c), siehe riemannSetup() in
  // 06_ui_functions.js / drawRiemann() in 08_draw.js. Kein Schnittpunkt-
  // Snapping hier (nur Funktion vs. x-Achse, kein g mehr — das Snapping lebt
  // jetzt beim eigenständigen Flächen-Applet, siehe 2e unten).
  {
    const rHit = typeof findNearRiemannHit === 'function' ? findNearRiemannHit(m.x, m.y) : null;
    if (rHit) {
      const otherX = rHit === 'A' ? riemann.xB : riemann.xA;
      const ownX = rHit === 'A' ? riemann.xA : riemann.xB;
      const side = ownX >= otherX ? 1 : -1;
      drag = { type:'riemannpt', which: rHit, side, isects: null }; canvas.style.cursor = 'grabbing'; return;
    }
  }

  // 2e. Flächen-Applet: Grenze a ODER b ziehen — gleiches Muster wie beim
  // Ober-/Untersummen-Applet (2d), aber bei flaeche.axis==='y' liegen die
  // Punkte auf der y-Achse statt der x-Achse (siehe findNearFlaecheHit()/
  // drawFlaeche(), 08_draw.js). Schnittpunkt-Snapping nur bei axis 'x'/'g'
  // (dort ist "die andere Kurve" f bzw. g bzw. die x-Achse) — bei axis 'y'
  // gibt es keine zweite Kurve, daher kein Snapping (Nutzerwunsch). KEIN
  // "darf den anderen Punkt nicht überspringen"-Constraint (anders als bei
  // diffquotpt/riemannpt) — a und b dürfen sich frei überholen, siehe
  // _riemannSnapX(), 06_ui_functions.js, für die Begründung (das frühere
  // side-basierte Constraint blockierte nach dem Zusammentreffen von a und b
  // dauerhaft eine der beiden Zugrichtungen).
  {
    const fHit = typeof findNearFlaecheHit === 'function' ? findNearFlaecheHit(m.x, m.y) : null;
    if (fHit) {
      let isects = null;
      if (flaeche.axis !== 'y' && functions[flaeche.fi1]) {
        const expr2 = flaeche.axis === 'g' ? (functions[flaeche.fi2] && functions[flaeche.fi2].expr) : '0';
        if (expr2 !== undefined && expr2 !== null) {
          const [lo, hi] = _riemannIsectSearchRange();
          isects = _riemannFindIntersections(functions[flaeche.fi1].expr, expr2, lo, hi);
        }
      }
      drag = { type:'flaechept', which: fHit, isects, axis: flaeche.axis }; canvas.style.cursor = 'grabbing'; return;
    }
  }

  // 3. Graph-Punkt-Modus: Klick auf leere Stelle setzt neuen Punkt auf der
  // Kurve. Ein Klick auf einen BESTEHENDEN Graph-Punkt wurde schon oben
  // (0b, immer aktiv) abgefangen, bevor der Einheitskreis-Klick-Handler
  // drankommt — dieser Zweig behandelt daher nur noch das Neusetzen.
  if (graphPtMode) {
    addGraphPoint(m.x, m.y); // neuen Punkt auf Kurve setzen
    return;
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

  // 5b. Geometrie: ganze Figur (Strecke, Kreis, Vieleck …) ziehen
  if (typeof geoPressBody === 'function' && geoPressBody(m)) return;

  // 6. View draggen (Standard: Klick auf leere Fläche)
  cancelComputeSpecials(); // laufende Berechnung abbrechen während Pan
  // isoView beim Start merken: Pan-Geschwindigkeit muss sich auf den ANGEZEIGTEN (isometrischen)
  // Ausschnitt beziehen, sonst ist das Verschieben im Hochformat (Handy/Tablet) viel zu langsam.
  drag = { type:'view', startM:m, startView:{...view}, startIso: isoView ? {...isoView} : {...view} };
  canvas.style.cursor = 'grabbing';
}

// mousemove: Drag-Handler für alle Drag-Typen + Hover-Tracking
function canvasDragMove(m) {
  if (!drag) return false;
  canvasDragMoveBody(m);
  return true;
}
function canvasDragMoveBody(m) {
  if (drag.type === 'geo') { if (typeof geoDragMove === 'function') geoDragMove(m); return; }
  if (drag.type === 'view') {
    // View verschieben: Delta in Canvas-Pixeln → Mathe-Koordinaten umrechnen
    const w = getW(), h = getH();
    const si = drag.startIso || drag.startView;
    const dx = (m.x - drag.startM.x) / w * (si.xmax - si.xmin);
    const dy = (m.y - drag.startM.y) / h * (si.ymax - si.ymin);
    view.xmin = drag.startView.xmin - dx; view.xmax = drag.startView.xmax - dx;
    view.ymin = drag.startView.ymin + dy; view.ymax = drag.startView.ymax + dy; // y invertiert!
    syncInputs(); hoverPt = null; scheduleDraw(); // kein scheduleComputeSpecials während Pan

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
    tip.style.display = 'block'; placeDragTip(tip, m);
    // Live-Tooltip während des Ziehens → fest dezimal, 2 Nachkommastellen
    // (kein Bruch-Wechsel, Nutzerwunsch).
    tip.textContent = niceCoordDec(pt2.x, pt2.y, false, 2);
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
        const xs = gridSnapStep();
        const snappedX = Math.round(mouseXMath / xs) * xs;
        if (Math.abs(mouseXMath - snappedX) < snapDist) newX = snappedX;
      }
    }
    graphPoints[drag.idx].x = gpResolveX(graphPoints[drag.idx], newX, fromCanvas(m.x, m.y).x);
    const gp = graphPoints[drag.idx], fn = functions[gp.fi];
    if (fn) {
      const y = safeEval(fn.expr, gp.x);
      const tip = document.getElementById('tooltip');
      const kindLabel = snapKind ? ` [${snapKind}]` : '';
      tip.style.display = 'block'; placeDragTip(tip, m);
      // Live-Tooltip während des Ziehens → fest dezimal, 2 Nachkommastellen
      // (kein Bruch-Wechsel, Nutzerwunsch).
      tip.textContent = `f${gp.fi+1}: ${niceCoordDec(gp.x, isFinite(y) ? y : NaN, false, 2)}${kindLabel}`;
    }
    scheduleDraw();

  } else if (drag.type === 'circlept') {
    // Einheitskreis-Punkt entlang Kreis drehen: Winkel aus Mausposition
    unitCirclePts[drag.idx].angle = circleAngleFromCanvas(m.x, m.y);
    scheduleDraw();

  } else if (drag.type === 'loobj') {
    // Zielfunktions-Gerade parallel verschieben (Wert k), mit Snapping an
    // die Eckpunkte des Planungspolygons — siehe loUpdateFromDrag() in
    // 17_linopt.js.
    loUpdateFromDrag(m.x, m.y);
    const tip = document.getElementById('tooltip');
    tip.style.display = 'block'; placeDragTip(tip, m);
    // Live-Tooltip während des Ziehens → fest dezimal, 2 Nachkommastellen
    // (kein Bruch-Wechsel, Nutzerwunsch).
    tip.textContent = `z = ${niceNumDec(loObjK, false, 2)}`;
    scheduleDraw();

  } else if (drag.type === 'trigproj') {
    // Denselben Einheitskreis-Punkt über seine Projektion auf dem Graphen
    // verschieben — Umkehrformel je nach Funktionstyp (siehe
    // findNearTrigProjDot() in 08_draw.js: sin/tan xG=a, cos xG=a−π/2).
    const xG = fromCanvas(m.x, m.y).x;
    const a = drag.kind === 'cos' ? xG + PI / 2 : xG;
    unitCirclePts[drag.ucpIdx].angle = ((a % (2 * PI)) + (2 * PI)) % (2 * PI);
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
      tip.style.display = 'block'; placeDragTip(tip, m);
      // Live-Tooltip während des Ziehens → fest dezimal, 2 Nachkommastellen
      // (kein Bruch-Wechsel, Nutzerwunsch).
      tip.textContent = niceCoordDec(pt2.x, pt2.y, false, 2);
      scheduleDraw();
    }

  } else if (drag.type === 'slopetript') {
    // Steigungsdreieck-Punkt B entlang der Funktion verschieben (ändert Δx,
    // Punkt A bleibt unangetastet bei seinem fixen x-Wert, z.B. 0).
    let newX = fromCanvas(m.x, m.y).x;
    const fnS = functions[drag.fi], ptsS = slopeTriPtsMap[drag.fi];
    if (fnS && ptsS) {
      const xA = ptsS[0].x;
      const v2 = isoView || view;
      const pxPerUnit = getW() / (v2.xmax - v2.xmin);
      const snapDist = 20 / pxPerUnit;
      if (document.getElementById('chk-gridsnap').checked) {
        const xs = gridSnapStep();
        const snappedX = Math.round(newX / xs) * xs;
        if (Math.abs(newX - snappedX) < snapDist) newX = snappedX;
      }
      // Mindestabstand zu Punkt A, damit das Dreieck nicht auf Δx=0 kollabiert
      if (Math.abs(newX - xA) < 0.05) newX = xA + (newX >= xA ? 0.05 : -0.05);
      ptsS[1].x = newX;
      const yB = safeEval(fnS.expr, newX);
      const tip = document.getElementById('tooltip');
      tip.style.display = 'block'; placeDragTip(tip, m);
      // Live-Tooltip während des Ziehens → fest dezimal, 2 Nachkommastellen
      // (kein Bruch-Wechsel, Nutzerwunsch).
      tip.textContent = niceCoordDec(newX, isFinite(yB) ? yB : NaN, false, 2);
    }
    scheduleDraw();

  } else if (drag.type === 'diffquotpt') {
    // Differenzenquotient-Applet: den gezogenen Punkt (A ODER B, siehe
    // drag.which) entlang der Funktion verschieben — ändert h=Δx. Der
    // gezogene Punkt darf den jeweils ANDEREN Punkt beim Ziehen NICHT
    // überspringen — stattdessen fällt er mit ihm zusammen (h=0 exakt
    // erlaubt, Sekante=Tangente) und bleibt danach auf der Seite, auf der
    // das Ziehen begonnen hat (drag.side, s. mousedown).
    if (diffQuot) {
      let newX = fromCanvas(m.x, m.y).x;
      const fnD = functions[diffQuot.fi];
      const which = drag.which || 'B';
      const otherX = which === 'A' ? diffQuot.xB : diffQuot.xA;
      if (which === 'A') newX = dqSnapX(newX);   // A rastet an senkrechten Gitterlinien ein
      newX = drag.side >= 0 ? Math.max(newX, otherX) : Math.min(newX, otherX);
      if (which === 'A') diffQuot.xA = newX; else diffQuot.xB = newX;
      if (fnD) {
        const yNew = safeEval(fnD.expr, newX);
        const tip = document.getElementById('tooltip');
        tip.style.display = 'block'; placeDragTip(tip, m);
        // Live-Tooltip während des Ziehens → fest dezimal, 2 Nachkommastellen
        // (kein Bruch-Wechsel, Nutzerwunsch).
        tip.textContent = `${which}: ${niceCoordDec(newX, isFinite(yNew) ? yNew : NaN, false, 2)}`;
      }
    }
    scheduleDraw();

  } else if (drag.type === 'riemannpt') {
    // Ober-/Untersummen-Applet: die gezogene Intervallgrenze (a ODER b,
    // siehe drag.which) auf der x-Achse verschieben — exakt gleiches
    // "kann nicht überspringen, darf zusammenfallen"-Muster wie bei
    // diffquotpt oben, aber ohne Kurven-Bezug (die Grenzen liegen auf y=0).
    // Kein Schnittpunkt-Snapping hier (riemann ist seit dem Auftrennen in
    // "Ober-/Untersummen" und "Flächen" immer Einzelfunktions-Modus gegen
    // die x-Achse — die Schnittpunkt-Fläche lebt jetzt im Flächen-Applet,
    // siehe drag.type==='flaechept' unten).
    if (riemann) {
      let newX = fromCanvas(m.x, m.y).x;
      const which = drag.which || 'B';
      const otherX = which === 'A' ? riemann.xB : riemann.xA;
      newX = snapGridLineX(newX);   // Gitterlinien-Snapping (Einstellung "Gitter-Snapping")
      newX = drag.side >= 0 ? Math.max(newX, otherX) : Math.min(newX, otherX);
      if (which === 'A') riemann.xA = newX; else riemann.xB = newX;
      const tip = document.getElementById('tooltip');
      tip.style.display = 'block'; placeDragTip(tip, m);
      tip.textContent = `${which === 'A' ? 'a' : 'b'} = ${niceNumDec(newX)}`;
    }
    scheduleDraw();

  } else if (drag.type === 'flaechept') {
    // Flächen-Applet: die gezogene Grenze (a ODER b, siehe drag.which)
    // verschieben — bei axis 'x'/'g' auf der x-Achse (identisches Muster
    // wie riemannpt oben, inkl. Schnittpunkt-Snapping), bei axis 'y' AUF
    // DER Y-ACHSE (freie vertikale Bewegung, kein Snapping, siehe
    // drag.isects oben in mousedown). Das Snapping bei 'x'/'g' greift nur
    // INNERHALB eines Pixel-Radius um einen Schnittpunkt (SNAP_PX, gleiche
    // Konvention wie z.B. graphpt oben) — weit genug weggezogen, löst sich
    // der Punkt wieder vom Schnittpunkt und folgt frei der Maus
    // (Nutzerwunsch: "snappen, aber auch wieder verlassen können"). a und
    // b dürfen sich dabei frei überholen (siehe _riemannSnapX(),
    // 06_ui_functions.js, für die Begründung).
    if (flaeche) {
      const which = drag.which || 'B';
      let newV;
      if (drag.axis === 'y') {
        newV = snapGridLineY(fromCanvas(m.x, m.y).y);
      } else {
        newV = fromCanvas(m.x, m.y).x;
        const SNAP_PX = 20;
        const v2 = isoView || view;
        const pxPerUnit = getW() / (v2.xmax - v2.xmin);
        const snapDist = SNAP_PX / pxPerUnit;
        const rawV = newV;
        newV = _riemannSnapX(newV, drag.isects, snapDist);
        if (newV === rawV) newV = snapGridLineX(newV);   // kein Schnittpunkt in der Nähe → Gitterlinie
      }
      if (which === 'A') flaeche.a = newV; else flaeche.b = newV;
      const aInp = document.getElementById('flaeche-a-input');
      const bInp = document.getElementById('flaeche-b-input');
      if (which === 'A' && aInp) aInp.value = niceNumDec(newV);
      if (which === 'B' && bInp) bInp.value = niceNumDec(newV);
      const tip = document.getElementById('tooltip');
      tip.style.display = 'block'; placeDragTip(tip, m);
      tip.textContent = `${which === 'A' ? 'a' : 'b'} = ${niceNumDec(newV)}`;
    }
    scheduleDraw();
  }
}

canvas.addEventListener('mousemove', e => {
  inputIsTouch = false;
  const m = mousePos(e);
  if (canvasDragMove(m)) return; // kein Hover während Drag

  // Kein Drag: Hover-Position tracken und Cursor anpassen
  hoverPt = fromCanvas(m.x, m.y).x;
  const nearPt = findNearPoint(m.x, m.y) >= 0;
  // Graph-Punkte sind immer ziehbar (nicht nur im graphPtMode, siehe 0b in
  // mousedown) — der Grab-Cursor soll das entsprechend immer anzeigen.
  const nearGP = findNearGP(m.x, m.y) >= 0;
  const nearCP = document.getElementById('chk-unitcircle').checked && findNearCirclePt(m.x, m.y) >= 0;
  const nearTP = document.getElementById('chk-unitcircle').checked && !!findNearTrigProjDot(m.x, m.y);
  const nearFP = typeof findNearFitPt === 'function' && !!findNearFitPt(m.x, m.y);
  const nearSTB = findNearSlopeTriB(m.x, m.y) >= 0;
  const nearLO = typeof findNearLoHandle === 'function' && findNearLoHandle(m.x, m.y);
  const nearGeo = typeof geoHover === 'function' && geoHover(m);
  const nearDQ = !!findNearDiffQuotHit(m.x, m.y);
  const nearRS = typeof findNearRiemannHit === 'function' && !!findNearRiemannHit(m.x, m.y);
  const nearFS = typeof findNearFlaecheHit === 'function' && !!findNearFlaecheHit(m.x, m.y);
  // Grab-Cursor wenn Maus über ziehendem Element
  canvas.style.cursor = (nearPt || nearGP || nearCP || nearTP || nearFP || nearSTB || nearLO || nearDQ || nearRS || nearFS || nearGeo) ? 'grab' : 'default';
  if (typeof geoToolActive === 'function' && geoToolActive()) canvas.style.cursor = nearGeo ? 'pointer' : 'crosshair';
  scheduleDraw();
});

// mouseup: Drag beenden, Tooltip verstecken, Cursor zurücksetzen
canvas.addEventListener('mouseup', () => canvasRelease());
function canvasRelease() {
  // Undo-Eintrag nach Drag (Punkt verschieben) — muss VOR drag=null sein
  if (drag && (drag.type === 'point' || drag.type === 'graphpt' || drag.type === 'fitpt' || drag.type === 'slopetript' || drag.type === 'trigproj' || drag.type === 'loobj' || drag.type === 'diffquotpt' || drag.type === 'riemannpt' || drag.type === 'flaechept' || drag.type === 'geo')) pushHistory();
  // Nach Pan/Zoom: Sonderpunkte jetzt (einmalig) neu berechnen
  const wasPan = drag && drag.type === 'view';
  // Geometrie-Werkzeug: Klick ins Leere (Ansicht wurde nicht verschoben) → Punkt anlegen (27_geo_ui.js)
  const geoClk = (drag && drag.type === 'view' && drag.geoClick && drag.startView && view.xmin === drag.startView.xmin && view.xmax === drag.startView.xmax && view.ymin === drag.startView.ymin) ? drag.geoClick : null;
  drag = null;
  document.getElementById('tooltip').style.display = 'none';
  // Cursor je nach aktivem Modus
  canvas.style.cursor = pointMode || graphPtMode || line2ptPicking ? 'crosshair' : 'grab';
  if (wasPan) scheduleComputeSpecials();
  if (geoClk && typeof geoToolClick === 'function') geoToolClick(geoClk);
  scheduleDraw();
}

// mouseleave: Hover-Linie ausblenden wenn Maus den Canvas verlässt
canvas.addEventListener('mouseleave', () => {
  hoverPt = null; drag = null; pointerPos = null;
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
  syncInputs(); cancelComputeSpecials(); scheduleComputeSpecials();  scheduleDraw();
}, { passive: false });

// ═══════════════════════════════════════════════════════════════════
// TOUCH-SUPPORT (Ein-Finger: Objekt ziehen / verschieben, Zwei-Finger: Zoomen + Verschieben)
// ───────────────────────────────────────────────────────────────────
// Die Ein-Finger-Aktionen laufen über dieselben Funktionen wie die Maus
// (canvasPress / canvasDragMove / canvasRelease, siehe oben). Touch-spezifisch:
//  • Die erste Berührung wird kurz (TOUCH_PRESS_DELAY ms) zurückgehalten: landet in dieser
//    Zeit ein zweiter Finger, ist es ein Pinch — es wird KEIN Punkt gesetzt/gelöscht.
//    Bewegt sich der Finger oder wird er gehoben, wird die Aktion sofort ausgeführt.
//  • Pinch: Zoom UND Verschieben gleichzeitig, der Punkt unter der Mitte der beiden Finger
//    bleibt unter den Fingern (bezogen auf den isometrischen Ausschnitt).
//  • Wird bei einem Pinch ein Finger gehoben, bleibt der andere zum Verschieben aktiv.
//  • touchcancel / Fensterwechsel / Drehen setzen den Zustand zurück (sonst «klebt» ein Zug).
// ═══════════════════════════════════════════════════════════════════

let touchState = null; // null | {type:'pending'} | {type:'drag'} | {type:'tap'} | {type:'pinch', …}
let _pendingPress = null; // { m, timer }
const TOUCH_PRESS_DELAY = 70;

function touchPos(t) {
  const r = canvas.getBoundingClientRect();
  return { x: t.clientX - r.left, y: t.clientY - r.top };
}

// Führt die zurückgehaltene erste Berührung jetzt aus.
function _flushTouchPress() {
  if (!_pendingPress) return;
  clearTimeout(_pendingPress.timer);
  const m = _pendingPress.m;
  _pendingPress = null;
  canvasPress(m);
  touchState = { type: drag ? 'drag' : 'tap' };
}
function _dropTouchPress() {
  if (_pendingPress) { clearTimeout(_pendingPress.timer); _pendingPress = null; }
}

// Beendet jede laufende Touch-Aktion sauber (History-Eintrag, Tooltip, Sonderpunkte).
function _endTouchAll() {
  _dropTouchPress();
  if (drag) canvasRelease();
  touchState = null;
  const tip = document.getElementById('tooltip'); if (tip) tip.style.display = 'none';
  scheduleDraw();
}

function _startPinch(touches) {
  const a = touchPos(touches[0]), b2 = touchPos(touches[1]);
  const cx = (a.x + b2.x) / 2, cy = (a.y + b2.y) / 2;
  touchState = {
    type: 'pinch',
    startDist: Math.max(Math.hypot(a.x - b2.x, a.y - b2.y), 1),
    startIso: isoView ? { ...isoView } : { ...view },
    centerM: { x: cx, y: cy }, centerPt: fromCanvas(cx, cy),
    active: false          // wird true, sobald die Finger sich merklich bewegt haben (Totzone)
  };
}

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  inputIsTouch = true;
  // Pointer-Modus: Touch-Interaktion blockieren (pointermove übernimmt Position)
  if (pointerMode) return;
  const touches = e.touches;

  // Tippen auf die Zeichenfläche beendet die Texteingabe: Eingabefeld verlassen und Bildschirmtastatur
  // einklappen (preventDefault oben verhindert sonst das normale Verlassen des Fokus).
  if (touches.length === 1) {
    const ae = document.activeElement;
    if (ae && ae !== document.body && typeof ae.blur === 'function' && /^(MATH-FIELD|INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) ae.blur();
    try { if (window.mathVirtualKeyboard && window.mathVirtualKeyboard.visible) window.mathVirtualKeyboard.hide(); } catch (ex) { /* ignorieren */ }
  }
  if (touches.length === 1) {
    // Veralteter Zustand (z.B. verpasstes touchend)? → erst sauber beenden
    if (touchState) _endTouchAll();
    touchState = { type: 'pending' };
    _pendingPress = { m: touchPos(touches[0]), timer: setTimeout(_flushTouchPress, TOUCH_PRESS_DELAY) };

  } else if (touches.length === 2) {
    // Zweiter Finger: zurückgehaltene Berührung verwerfen, laufenden Zug (Punkt …) abschliessen
    _dropTouchPress();
    if (drag) canvasRelease();
    drag = null;
    const tip = document.getElementById('tooltip'); if (tip) tip.style.display = 'none';
    _startPinch(touches);
  }
  // 3 oder mehr Finger: ignorieren (der Pinch läuft mit den ersten zwei weiter)
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!touchState) return;
  const touches = e.touches;

  if (touchState.type === 'pending') {
    if (touches.length !== 1) return;
    _flushTouchPress();            // Finger bewegt sich → Aktion (Ziehen/Verschieben) beginnt jetzt
  }

  if (touchState.type === 'drag' && touches.length >= 1) {
    canvasDragMove(touchPos(touches[0]));

  } else if (touchState.type === 'pinch' && touches.length >= 2) {
    const st = touchState;
    const a = touchPos(touches[0]), b2 = touchPos(touches[1]);
    const dist = Math.max(Math.hypot(a.x - b2.x, a.y - b2.y), 1);
    const cx = (a.x + b2.x) / 2, cy = (a.y + b2.y) / 2;
    const w = getW(), h = getH();

    if (!st.active) {
      const zoomDelta = Math.abs(dist / st.startDist - 1);
      const panDelta = Math.hypot(cx - st.centerM.x, cy - st.centerM.y);
      if (zoomDelta > 0.03 || panDelta > 6) st.active = true; else return;
    }
    // Neuer Ausschnitt: Spannweite = Start-Spannweite × Faktor, und der Mathe-Punkt, der beim
    // Start unter der Fingermitte lag, liegt jetzt unter der AKTUELLEN Fingermitte.
    const factor = st.startDist / dist;
    const si = st.startIso, cp = st.centerPt;
    const spanX = (si.xmax - si.xmin) * factor, spanY = (si.ymax - si.ymin) * factor;
    view.xmin = cp.x - (cx / w) * spanX;          view.xmax = view.xmin + spanX;
    view.ymin = cp.y - (1 - cy / h) * spanY;      view.ymax = view.ymin + spanY;
    syncInputs(); scheduleDraw(); // kein scheduleComputeSpecials während Pinch
  }
}, { passive: false });

// Gemeinsame Behandlung von touchend / touchcancel
function _touchEnded(e, cancelled) {
  e.preventDefault();
  if (!touchState) return;
  const n = e.touches.length;

  if (touchState.type === 'pinch') {
    if (n >= 2) { _startPinch(e.touches); return; }          // 3 → 2 Finger: neu aufsetzen
    if (n === 1 && !cancelled) {
      // Ein Finger bleibt liegen → damit weiter verschieben (Ausgangspunkt = jetzige Position)
      cancelComputeSpecials();
      drag = { type: 'view', startM: touchPos(e.touches[0]), startView: { ...view },
               startIso: isoView ? { ...isoView } : { ...view } };
      touchState = { type: 'drag' };
      return;
    }
    touchState = null;
    scheduleComputeSpecials(); scheduleDraw();               // Nach Pinch: Sonderpunkte einmalig neu berechnen
    return;
  }
  if (touchState.type === 'pending') {
    if (cancelled) _dropTouchPress(); else _flushTouchPress();  // kurzes Antippen: Aktion jetzt ausführen
  }
  if (n === 0 || cancelled || touchState) _endTouchAll();
}
canvas.addEventListener('touchend', e => _touchEnded(e, false), { passive: false });
canvas.addEventListener('touchcancel', e => _touchEnded(e, true), { passive: false });
// Fenster verliert den Fokus / Bildschirm wird gedreht → kein hängender Zug
window.addEventListener('blur', () => { if (touchState) _endTouchAll(); });
window.addEventListener('orientationchange', () => { if (touchState) _endTouchAll(); });
// Safari (iOS und Mac): Seiten-Zoom per Pinch/Doppeltipp verhindern — auf der ganzen Seite, nicht nur auf der
// Zeichenfläche. Safari merkt sich die Seiten-Zoomstufe pro Website und wendet sie beim nächsten Laden an; die
// Pinch-Geste über der Zeichenfläche soll nur den Plot zoomen und diese gespeicherte Stufe nicht verändern.
['gesturestart', 'gesturechange', 'gestureend'].forEach(ev =>
  document.addEventListener(ev, e => e.preventDefault(), { passive: false, capture: true }));
// Trackpad-Pinch kommt in Chrome/Firefox (und teils Safari) als Mausrad mit Ctrl: ebenfalls kein Seiten-Zoom
document.addEventListener('wheel', e => { if (e.ctrlKey && e.cancelable) e.preventDefault(); }, { passive: false, capture: true });
// Falls Safari trotzdem mit gespeicherter Zoomstufe startet: Hinweis, wie man sie zurücksetzt (Cmd+0)
window.addEventListener('load', () => setTimeout(() => {
  try {
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|OPR/.test(navigator.userAgent);
    const z = window.outerWidth / Math.max(1, window.innerWidth);
    if (isSafari && z >= 1.45 && window.EGGS && EGGS.toast)
      EGGS.toast('Safari zeigt die Seite vergrössert an (gespeicherte Zoomstufe). Mit ⌘0 (Darstellung → Tatsächliche Grösse) stimmt es wieder.', 9000);
  } catch (err) {}
}, 1200));
// Langes Drücken (Kontextmenü / Textauswahl) auf der Zeichenfläche per Touch unterdrücken
canvas.addEventListener('contextmenu', e => { if (inputIsTouch) e.preventDefault(); });

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
let undoStack = [], historyIdx = -1, historyPaused = false;
let _historyPauseTimer = null; // s. applyState() unten

// Normalisiert eine Funktion für die History-Momentaufnahme: die
// Domain-Autoerkennung (_applyDetectedDomain(), 06_ui_functions.js) läuft
// ASYNCHRON über einen 200ms/700ms-Timer (renderFuncList() bzw. der
// input-Handler) und schreibt domainMin/domainMax/domainMinOpen/
// domainMaxOpen/domainExcluded/domainGaps auf fn — AUCH wenn das Ergebnis
// "keine Einschränkung" ist (Felder bleiben null/false/[]). Vorher sind
// diese Felder auf frisch angelegten/gerade erst getippten Funktionen
// schlicht NICHT vorhanden. captureState() (unten) wird an ganz
// unterschiedlichen Stellen relativ zu diesem Timer aufgerufen — je nachdem
// ob er schon gelaufen ist oder nicht, unterscheidet sich die JSON-
// Repräsentation ein und derselben (für den Nutzer identischen!) Funktion.
// pushHistory()'s Gleichheitsprüfung ist ein reiner JSON-String-Vergleich
// (siehe dort) und hält das fälschlich für eine echte Änderung — das
// erzeugt einen "Phantom"-Eintrag in der History, der historyIdx nach dem
// nächsten undo()/redo() wieder auf denselben (unveränderten!) Zustand
// zurückfallen lässt. Ergebnis genau wie berichtet: Vor-/Zurück-Knopf tut
// scheinbar nichts (ein Klick verpufft am Phantom-Eintrag) bzw. wirkt
// später sprunghaft (mehrere aufgehäufte Phantom-Einträge). Fix: diese
// Felder IMMER explizit auf denselben Default normalisieren, unabhängig
// davon ob der Timer schon gelaufen ist — macht die Momentaufnahme
// zeitpunkt-unabhängig und damit deterministisch vergleichbar.
function _normalizeFuncForHistory(fn) {
  const f = Object.assign({}, fn);
  if (f.domainMin === undefined) f.domainMin = null;
  if (f.domainMax === undefined) f.domainMax = null;
  if (f.domainMinOpen === undefined) f.domainMinOpen = false;
  if (f.domainMaxOpen === undefined) f.domainMaxOpen = false;
  if (f.domainExcluded === undefined) f.domainExcluded = [];
  if (f.domainGaps === undefined) f.domainGaps = [];
  return f;
}

// Serialisiert den Plot-INHALT (ohne View/Zoom) für Undo/Redo.
// View-Änderungen (Pan, Zoom) werden bewusst nicht rückgängig gemacht.
function captureState() {
  return JSON.parse(JSON.stringify({
    functions: functions.map(_normalizeFuncForHistory), params, points, linkedLines,
    graphPoints, unitCirclePts,
    // Lineare Optimierung (siehe 17_linopt.js) — optional-verkettet, da ältere
    // gespeicherte Zustände (vor Einführung dieses Features) diese Felder
    // nicht kennen; applyState() unten setzt dann einfach die Defaults.
    loConstraints, loObjA, loObjB, loObjK, loObjActive, loMode, loObjKMin, loObjKMax,
    // Geometrie (siehe 26_geo.js) — fehlt in älteren Zuständen, dann leer
    geo: typeof geoCapture === 'function' ? geoCapture() : undefined,
    // 3D-Raum (siehe 29_3d.js / 30_3d_ui.js)
    td3d: typeof tdCapture === 'function' ? tdCapture() : undefined,
    // Balken bei Funktionen (siehe 31_bars2d.js)
    bars2d: typeof fbCapture === 'function' ? fbCapture() : undefined,
    // Umgebung (siehe 32_env.js): welches Thema, plus die Zusatzdaten der Anwendungen
    // (Differenzenquotient, Integral, Folgen, besondere Punkte …)
    // Algebra (siehe 33_alg_core.js / 34_alg_ui.js)
    alg: typeof algCapture === 'function' ? algCapture() : undefined,
    // Wahrscheinlichkeit und Statistik (siehe 40_stat.js / 42_stat_ui.js)
    stat: typeof statCapture === 'function' ? statCapture() : undefined,
    // Finanzmathematik (siehe 50_fin.js / 52_fin_ui.js)
    fin: typeof finCapture === 'function' ? finCapture() : undefined,
    // Differentialrechnung (siehe 62_dif_ui.js)
    dif: typeof difCapture === 'function' ? difCapture() : undefined,
    itg: typeof itgCapture === 'function' ? itgCapture() : undefined,
    lin: typeof linCapture === 'function' ? linCapture() : undefined,
    quad: typeof quadCapture === 'function' ? quadCapture() : undefined,
    pow: typeof powCapture === 'function' ? powCapture() : undefined,
    exp: typeof expCapture === 'function' ? expCapture() : undefined,
    trig: typeof trigCapture === 'function' ? trigCapture() : undefined,
    inv: typeof invCapture === 'function' ? invCapture() : undefined,
    intro: typeof funCapture === 'function' ? funCapture() : undefined,
    sim: typeof simCapture === 'function' ? simCapture() : undefined,
    seqx: typeof seqCapture === 'function' ? seqCapture() : undefined,
    lox: typeof lopCapture === 'function' ? lopCapture() : undefined,
    env: typeof ENV !== 'undefined' ? ENV.cur : undefined,
    ext: typeof envCaptureExt === 'function' ? envCaptureExt() : undefined
  }));
}

// Stellt einen serialisierten Inhalt-Zustand wieder her (View bleibt unverändert)
function applyState(s) {
  historyPaused = true;
  // Deep Copy! Ohne dies würden Live-Mutations die History-Einträge korrumpieren.
  const sc = JSON.parse(JSON.stringify(s));
  // Gehört der Zustand zu einer anderen Umgebung (z. B. beim Laden einer Datei), zuerst dorthin wechseln
  if (typeof envEnsure === 'function' && typeof envGuess === 'function') envEnsure(envGuess(sc));
  // Fallbacks: ältere/fremde .plotter-Dateien kennen nicht alle Felder.
  functions = sc.functions || []; params = sc.params || {}; points = sc.points || [];
  linkedLines = sc.linkedLines || []; graphPoints = sc.graphPoints || [];
  unitCirclePts = sc.unitCirclePts || [];
  // Lineare Optimierung — Defaults falls aus einem älteren Zustand geladen
  // (siehe captureState() oben / 17_linopt.js).
  loConstraints = sc.loConstraints || []; loObjA = sc.loObjA ?? 1; loObjB = sc.loObjB ?? 1;
  loObjK = sc.loObjK ?? 0; loObjActive = sc.loObjActive || false; loMode = sc.loMode || 'max';
  loObjKMin = sc.loObjKMin ?? -10; loObjKMax = sc.loObjKMax ?? 10;
  if (typeof geoApply === 'function') { geoApply(sc.geo); if (typeof geoAfterApply === 'function') geoAfterApply(); }
  if (typeof tdApply === 'function') tdApply(sc.td3d);
  if (typeof fbApply === 'function') fbApply(sc.bars2d);
  if (typeof algApply === 'function') algApply(sc.alg);
  if (typeof statApply === 'function') statApply(sc.stat);
  if (typeof finApply === 'function') finApply(sc.fin);
  if (typeof difApply === 'function') difApply(sc.dif);
  if (typeof itgApply === 'function') itgApply(sc.itg);
  if (typeof linApply === 'function') linApply(sc.lin);
  if (typeof quadApply === 'function') quadApply(sc.quad);
  if (typeof powApply === 'function') powApply(sc.pow);
  if (typeof expApply === 'function') expApply(sc.exp);
  if (typeof trigApply === 'function') trigApply(sc.trig);
  if (typeof invApply === 'function') invApply(sc.inv);
  if (typeof funApply === 'function') funApply(sc.intro);
  if (typeof simApply === 'function') simApply(sc.sim);
  if (typeof seqApply === 'function') seqApply(sc.seqx);
  if (typeof lopApply === 'function') lopApply(sc.lox);
  if (typeof envApplyExt === 'function') envApplyExt(sc.ext);
  if (typeof clearLoEvalCache === 'function') clearLoEvalCache();
  if (typeof renderLoConstraints === 'function') renderLoConstraints();
  const loInp = document.getElementById('lo-obj-input');
  // State speichert nur die Koeffizienten (loObjA/loObjB), nicht den
  // ursprünglich getippten Text — Anzeige im math-field wird daraus
  // rekonstruiert (loBuildObjRawFromAB() behandelt das Vorzeichen von b
  // korrekt, siehe dort — sonst würde rawToLatex() an "3x+-2y" scheitern).
  if (loInp) {
    if (loObjActive && typeof loBuildObjRawFromAB === 'function' && loInp._mlSetFromRaw) {
      loInp._mlSetFromRaw(loBuildObjRawFromAB(loObjA, loObjB));
    } else if (loInp._mlSetFromRaw) {
      loInp._mlSetFromRaw('');
    } else {
      loInp.value = '';
    }
  }
  if (typeof loSyncObjSliderFull === 'function') loSyncObjSliderFull();
  document.getElementById('lo-mode-max')?.classList.toggle('active-btn', loMode === 'max');
  document.getElementById('lo-mode-min')?.classList.toggle('active-btn', loMode === 'min');
  // view wird NICHT wiederhergestellt
  clearEvalCache();
  renderFuncList(); renderPointList(); syncParams();
  scheduleComputeSpecials();
  scheduleDraw();
  // Längere Verzögerung: verzögerte DOM-Events (blur, change) nach renderFuncList
  // sollen nicht in die History schreiben.
  // WICHTIG: den vorherigen Pause-Timer löschen, bevor ein neuer gestartet
  // wird. Bei zwei schnell aufeinanderfolgenden Undo/Redo-Klicks (z.B.
  // gehaltene Ctrl+Z-Taste, Tastatur-Wiederholung) überlappen sich sonst
  // zwei unabhängige 250ms-Timer — der ÄLTERE setzt historyPaused=false
  // vorzeitig zurück, noch während der zweite applyState()-Aufruf gerade
  // nachwirkende DOM-Events (blur/change/input) absetzt. Diese können dann
  // unbemerkt eine verspätete pushHistory() auslösen und die History mit
  // einem weiteren Phantom-Eintrag verunreinigen (dieselbe Symptomatik wie
  // die Domain-Autoerkennung oben: Vor-/Zurück "tut nichts" bzw. später
  // "mehrere Schritte auf einmal").
  clearTimeout(_historyPauseTimer);
  _historyPauseTimer = setTimeout(() => { historyPaused = false; }, 250);
}

// Schreibt den aktuellen Zustand in den History-Stack.
// Identische Zustände werden nicht doppelt gespeichert (verhindert Mehrfach-Einträge).
// Max. 50 Einträge (Speicher schonen).
function pushHistory() {
  if (historyPaused) return;
  const cur = JSON.stringify(captureState());
  // Nicht speichern wenn identisch mit letztem Eintrag
  if (undoStack.length > 0 && JSON.stringify(undoStack[historyIdx]) === cur) return;
  undoStack = undoStack.slice(0, historyIdx + 1);
  undoStack.push(JSON.parse(cur));
  if (undoStack.length > 50) undoStack.shift();
  historyIdx = undoStack.length - 1;
  updateUndoRedoBtns();
}

function updateUndoRedoBtns() {
  document.getElementById('undo-btn').disabled = historyIdx <= 0;
  document.getElementById('redo-btn').disabled = historyIdx >= undoStack.length - 1;
}

function undo() {
  if (historyIdx <= 0) return;
  historyIdx--;
  applyState(undoStack[historyIdx]);
  updateUndoRedoBtns();
}

function redo() {
  if (historyIdx >= undoStack.length - 1) return;
  historyIdx++;
  applyState(undoStack[historyIdx]);
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

