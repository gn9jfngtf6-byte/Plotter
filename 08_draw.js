// ═══════════════════════════════════════════════════════════════════
// MODUL: draw — Alle Zeichenfunktionen & Haupt-draw()-Loop
// Enthält:  draw(), drawGrid(), drawFunctions(), drawSpecials()
//           drawAsymptotes(), drawSlopeTri(), drawUnitCircle()
//           drawGraphPoints(), renderMathText()
// Ändern:  Liniendicke → ctx.lineWidth in den draw*()-Funktionen
//           Punkt-Radius → SPECIAL_R / GRAPH_PT_R Konstanten in core.js
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// GRAPH-PUNKTE (Punkte auf Graphen, verschiebbar entlang der Kurve)
// ═══════════════════════════════════════════════════════════════════

// Legt einen neuen Punkt auf die nächstgelegene Kurve.
// Findet die Funktion mit dem kleinsten vertikalen Abstand zur Klickposition.
// Snap-Radius: 50px vertikal — anpassen für grössere Trefferfläche
function addGraphPoint(mx, my) {
  const pt = fromCanvas(mx, my);
  let bestFi = -1, bestX = pt.x, bestDist = Infinity;
  functions.forEach((fn, i) => {
    if (!fn.expr.trim() || fn.visible === false) return;
    const y = safeEval(fn.expr, pt.x); if (!isFinite(y)) return;
    const dist = Math.abs(toCanvas(pt.x, y).cy - my); // vertikaler Abstand in Pixeln
    if (dist < bestDist) { bestDist = dist; bestFi = i; bestX = pt.x; }
  });
  if (bestFi < 0 || bestDist > 50) return; // zu weit weg von jeder Kurve
  graphPoints.push({ fi: bestFi, x: bestX, color: functions[bestFi].color });
  scheduleDraw();
}

// Sucht den nächstgelegenen Graph-Punkt zur Canvas-Position.
// Gibt Index zurück oder -1.
function findNearGP(mx, my) {
  for (let i = graphPoints.length - 1; i >= 0; i--) {
    const gp = graphPoints[i]; const fn = functions[gp.fi]; if (!fn || !fn.expr.trim()) continue;
    const y = safeEval(fn.expr, gp.x); if (!isFinite(y)) continue;
    const { cx, cy } = toCanvas(gp.x, y);
    // Auf Touch-Geräten größere Trefferfläche (22px statt 14px)
    const HIT_GP = ('ontouchstart' in window) ? 22 : 14;
    if (Math.hypot(cx - mx, cy - my) < HIT_GP) return i;
  }
  return -1;
}

// Zeichnet alle Graph-Punkte.
// Zeigt Punkt, Koordinaten-Label und gestrichelte Linie zur x-Achse.
// Löschen: kleines × oben rechts klicken (10px Trefferfläche).
function drawGraphPoints() {
  graphPoints.forEach((gp, i) => {
    const fn = functions[gp.fi]; if (!fn || !fn.expr.trim() || fn.visible === false) return;
    const y = safeEval(fn.expr, gp.x); if (!isFinite(y)) return;
    const { cx, cy } = toCanvas(gp.x, y);
    const { cy: cy0 } = toCanvas(gp.x, 0); // y=0 auf Canvas

    // Gestrichelte Linie zur x-Achse
    ctx.save(); ctx.setLineDash([3,3]); ctx.strokeStyle = gp.color + '88'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy0); ctx.stroke(); ctx.setLineDash([]);

    // Punkt (dicker Ring + kleiner Kern)
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 2*PI); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
    ctx.strokeStyle = gp.color; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 2*PI); ctx.fillStyle = gp.color; ctx.fill();

    // Koordinaten-Label
    ctx.font = '11px system-ui,sans-serif'; ctx.fillStyle = gp.color; ctx.textAlign = 'left';
    ctx.fillText(niceCoord(gp.x, y), cx + 12, cy - 2);
    ctx.restore();

    // Löschen-X (nur anzeigen wenn nicht gerade gezogen)
    const dragging = drag && drag.type === 'graphpt' && drag.idx === i;
    if (!dragging) {
      ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#e24b4a'; ctx.textAlign = 'center';
      ctx.fillText('×', cx + 8, cy - 6);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
// EINHEITSKREIS: Hilfsberechnung
// ═══════════════════════════════════════════════════════════════════

// Gibt die Canvas-Koordinaten des Kreismittelpunkts und den Radius zurück.
// Mittelpunkt liegt bei (0, 0), Radius 1 (Standard-Einheitskreis).
function getCircleParams() {
  const { cx: ox, cy: oy } = toCanvas(0, 0);   // Mittelpunkt bei (0, 0)
  const { cx: rx } = toCanvas(1, 0);            // Radius = Abstand von (0,0) zu (1,0) = 1 Einheit
  return { ox, oy, r: Math.abs(rx - ox) };
}

// Sucht den nächstgelegenen Einheitskreis-Punkt zur Canvas-Position.
// Gibt Index zurück oder -1.
function findNearCirclePt(mx, my) {
  const { ox, oy, r } = getCircleParams();
  for (let i = unitCirclePts.length - 1; i >= 0; i--) {
    const a = unitCirclePts[i].angle;
    // Punkt liegt bei (ox + r*cos(a), oy - r*sin(a)) — y invertiert!
    const px = ox + r * Math.cos(a), py = oy - r * Math.sin(a);
    if (Math.hypot(px - mx, py - my) < 14) return i;
  }
  return -1;
}

// Berechnet den Winkel (in Radiant, [0, 2π)) aus einer Canvas-Position relativ zum Ursprung.
function circleAngleFromCanvas(mx, my) {
  const { ox, oy } = getCircleParams();
  // atan2 gibt Winkel im Bereich (-π, π] zurück; y-Achse invertieren wegen Canvas
  const a = Math.atan2(-(my - oy), mx - ox);
  return ((a % (2*PI)) + (2*PI)) % (2*PI); // Normalisieren auf [0, 2π)
}

// Verarbeitet einen Klick nahe dem Einheitskreis.
// - Klick auf bestehenden Punkt: löschen
// - Klick auf leere Stelle: neuen Punkt setzen (mit Snap zu Standardwinkeln)
// Gibt true zurück wenn der Klick verarbeitet wurde (für Event-Weitergabe-Kontrolle).
// Snap-Toleranz: 0.15 rad ≈ 8.6° — anpassen für grössere Snap-Zone
function unitCircleHandleClick(mx, my) {
  const { ox, oy, r } = getCircleParams(); if (r < 2) return false;
  // Nur innerhalb von 22px um den Kreis reagieren
  if (Math.abs(Math.hypot(mx - ox, my - oy) - r) > 22) return false;

  // Bestehenden Punkt löschen?
  const idx = findNearCirclePt(mx, my);
  if (idx >= 0) { unitCirclePts.splice(idx, 1); scheduleDraw(); return true; }

  // Neuen Punkt mit Snap zu Standardwinkeln (0, π/6, π/4, π/3, π/2, ...)
  const raw = circleAngleFromCanvas(mx, my);
  const std = [0, PI/6, PI/4, PI/3, PI/2, 2*PI/3, 3*PI/4, 5*PI/6, PI, 7*PI/6, 5*PI/4, 4*PI/3, 3*PI/2, 5*PI/3, 7*PI/4, 11*PI/6];
  let snap = raw, snapDist = Infinity;
  std.forEach(a => { let d = Math.abs(a - raw); if (d > PI) d = 2*PI - d; if (d < snapDist) { snapDist = d; snap = a; } });
  unitCirclePts.push({ angle: snapDist < 0.15 ? snap : raw }); // snap wenn nah genug
  scheduleDraw(); return true;
}

// ═══════════════════════════════════════════════════════════════════
// ASYMPTOTEN ZEICHNEN
// ═══════════════════════════════════════════════════════════════════

// Erkennt und zeichnet vertikale Asymptoten (wo Funktion unendlich wird)
// und horizontale Asymptoten (Grenzwert für x→±∞).
// Algorithmus: Abtasten, grosse Sprünge oder NaN-Übergänge markieren.
// Anpassen: schwellwert (v.ymax-v.ymin)*8 für aggressivere Erkennung erhöhen.
function drawAsymptotes(w, h) {
  // Asymptoten werden aus dem specials-Cache gezeichnet (Scan in computeSpecials, nicht hier).
  // Pro Frame: nur noch zeichnen, kein safeEval-Scan mehr.
  window._asymLines = [];
  const v = isoView || view;
  ctx.save(); ctx.setLineDash([6, 4]); ctx.lineWidth = 1.2;

  functions.forEach((fn, fi_idx) => {
    if (!fn.expr.trim() || fn.visible === false) return;
    const _sShow = activeSpecials.has(`${fi_idx}:asymp`);
    if (!_sShow) return;
    ctx.strokeStyle = fn.color + '99';

    // ── Vertikale Asymptoten (Pole) aus specials-Cache ────────────
    specials.filter(sp => sp.kind === 'pole' && sp.fi === fi_idx).forEach(sp => {
      const { cx } = toCanvas(sp.x, 0);
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
      const lbl = fmtVerticalAsymLabel(sp.x);
      // MathLive-gerendert (wie Eingabefeld) statt Canvas-Text — Fallback auf
      // fillText falls latexToMathLiveHtml (noch) nicht verfügbar ist.
      const lblHtml = typeof latexToMathLiveHtml === 'function' ? latexToMathLiveHtml(fmtVerticalAsymLabel(sp.x, true)) : null;
      if (lblHtml) {
        drawMathLabel(lblHtml, cx + 3, 4, fn.color + 'cc', { align: 'left', baseline: 'top', fontSize: 10 });
      } else {
        ctx.save(); ctx.font = '10px system-ui'; ctx.fillStyle = fn.color + 'cc';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(lbl, cx + 3, 4); ctx.restore();
      }
      window._asymLines.push({ type: 'vertical', expr: null, label: lbl, color: fn.color });
    });

    // ── Horizontale Asymptoten aus specials-Cache ─────────────────
    specials.filter(sp => sp.kind === 'asymp' && sp.fi === fi_idx && !sp.oblique).forEach(sp => {
      const haVal = sp.y;
      if (haVal < v.ymin - 0.1 || haVal > v.ymax + 0.1) return;
      const { cy: hy } = toCanvas(0, haVal);
      ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(w, hy); ctx.stroke();
      const haLbl = fmtHorizontalAsymLabel(haVal);
      const haLblHtml = typeof latexToMathLiveHtml === 'function' ? latexToMathLiveHtml(fmtHorizontalAsymLabel(haVal, true)) : null;
      if (haLblHtml) {
        drawMathLabel(haLblHtml, w - 4, hy - 2, fn.color + 'cc', { align: 'right', baseline: 'bottom', fontSize: 10 });
      } else {
        ctx.save(); ctx.font = '10px system-ui'; ctx.fillStyle = fn.color + 'cc';
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText(haLbl, w - 4, hy - 2); ctx.restore();
      }
      function _fmtHa(val) {
        if (Math.abs(val) < 1e-9) return '0';
        if (Number.isInteger(val)) return String(val);
        for (let d = 1; d <= 24; d++) { const n = Math.round(val * d); if (n !== 0 && Math.abs(n/d - val) < 1e-5) return d === 1 ? String(n) : n+'/'+d; }
        return String(parseFloat(val.toFixed(4)));
      }
      window._asymLines.push({ type: 'horizontal', expr: _fmtHa(haVal), label: haLbl, color: fn.color, _val: haVal });
    });

    // ── Schräge Asymptoten aus specials-Cache ─────────────────────
    specials.filter(sp => sp.kind === 'asymp' && sp.fi === fi_idx && sp.oblique).forEach(sp => {
      const slopeR = sp.slope, intR = sp.intercept;
      if (window._asymLines.some(a => a.type==='oblique' && Math.abs(a._slope-slopeR)<1e-4 && Math.abs(a._int-intR)<1e-4)) return;
      const { cx: cxA, cy: cyA } = toCanvas(v.xmin, slopeR*v.xmin + intR);
      const { cx: cxB, cy: cyB } = toCanvas(v.xmax, slopeR*v.xmax + intR);
      ctx.beginPath(); ctx.moveTo(cxA, cyA); ctx.lineTo(cxB, cyB); ctx.stroke();
      const oaLbl = fmtObliqueAsymLabel(slopeR, intR);
      const midCx = (cxA+cxB)/2, midCy = (cyA+cyB)/2;
      const oaLblHtml = typeof latexToMathLiveHtml === 'function' ? latexToMathLiveHtml(fmtObliqueAsymLabel(slopeR, intR, true)) : null;
      if (oaLblHtml) {
        drawMathLabel(oaLblHtml, midCx, midCy - 4, fn.color + 'cc', { align: 'center', baseline: 'bottom', fontSize: 10 });
      } else {
        ctx.save(); ctx.font = '10px system-ui'; ctx.fillStyle = fn.color + 'cc';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(oaLbl, midCx, midCy - 4); ctx.restore();
      }
      window._asymLines.push({ type:'oblique', label:oaLbl, color:fn.color, _slope:slopeR, _int:intR });
    });

  });

  ctx.restore();
  if (typeof updateAsymPills === 'function') updateAsymPills();
}

// ═══════════════════════════════════════════════════════════════════
// STEIGUNGSDREIECK ZEICHNEN (nur für lineare Funktionen)
// ═══════════════════════════════════════════════════════════════════

// ── Canvas-Bruch-Renderer ──────────────────────────────────────────
// Zeichnet einen Wert: als echten Bruch mit Bruchstrich wenn möglich, sonst als Text.
// x,y: Ankerpunkt (Mittelpunkt der Bruchlinie bei Brüchen, Textmitte sonst)
// align: 'left' | 'center' | 'right'
// Gibt die Breite des gezeichneten Elements zurück.
function ctxFracVal(x, y, v, color, fontSize, align) {
  fontSize = fontSize || 10;
  const fr = asSimpleFrac(v);
  if (fr && fr.includes('/')) {
    const slash = fr.lastIndexOf('/');
    const num = fr.substring(0, slash), den = fr.substring(slash + 1);
    ctx.save();
    ctx.font = `${fontSize}px system-ui`;
    ctx.fillStyle = color; ctx.strokeStyle = color;
    const nW = ctx.measureText(num).width, dW = ctx.measureText(den).width;
    const lineW = Math.max(nW, dW) + 6;
    let lx = x;
    if (align === 'center') lx = x - lineW / 2;
    else if (align === 'right') lx = x - lineW;
    const cx2 = lx + lineW / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom'; ctx.fillText(num, cx2, y);
    ctx.lineWidth = 0.8; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(lx, y + 1); ctx.lineTo(lx + lineW, y + 1); ctx.stroke();
    ctx.textBaseline = 'top'; ctx.fillText(den, cx2, y + 3);
    ctx.restore();
    return lineW;
  }
  const txt = niceNum(v);
  ctx.save();
  ctx.font = `${fontSize}px system-ui`; ctx.fillStyle = color;
  ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(txt, x, y);
  ctx.restore();
  return ctx.measureText(txt).width;
}

// Zeichnet "m = p/q" oder "m = n" mit Bruchstrich wenn nötig.
function ctxSlopeLabel(x, y, slope, color, fontSize) {
  fontSize = fontSize || 10;
  ctx.save();
  ctx.font = `${fontSize}px system-ui`; ctx.fillStyle = color;
  const prefix = 'm = ';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(prefix, x, y);
  const pw = ctx.measureText(prefix).width;
  ctx.restore();
  ctxFracVal(x + pw, y, slope, color, fontSize, 'left');
}

// Zeichnet Steigungsdreiecke für lineare Funktionen.
// 1. Standard-Dreieck: Position im sichtbaren Bereich, Breite 1 Einheit
// 2. Dreieck zwischen zwei Graph-Punkten derselben linearen Funktion
function drawSlopeTri(w, h) {
  const v = isoView || view;

  // Hilfsfunktion: Dreieck zwischen zwei x-Positionen auf einer Funktion zeichnen
  function drawTriBetween(fn, xA, xB) {
    const xLeft = Math.min(xA, xB), xRight = Math.max(xA, xB);
    const yLeft  = safeEval(fn.expr, xLeft);
    const yRight = safeEval(fn.expr, xRight);
    if (!isFinite(yLeft) || !isFinite(yRight)) return;
    const dx = xRight - xLeft, dy = yRight - yLeft;
    const slope = dy / dx;

    const { cx: px0, cy: py0 } = toCanvas(xLeft,  yLeft);
    const { cx: px1, cy: py1 } = toCanvas(xRight, yRight);
    const { cx: px2, cy: py2 } = toCanvas(xRight, yLeft);  // rechte untere Ecke

    ctx.save();
    ctx.strokeStyle = fn.color; ctx.lineWidth = 1.5; ctx.setLineDash([5,3]);
    ctx.beginPath(); ctx.moveTo(px0, py0); ctx.lineTo(px2, py2); ctx.lineTo(px1, py1); ctx.stroke();
    ctx.setLineDash([]);

    const fs = 10; // fontSize
    const fracH = fs * 2 + 6; // Höhe eines Bruchs (2 Zeilen + Linie)
    const isFracDx = asSimpleFrac(dx) && asSimpleFrac(dx).includes('/');
    const isFracDy = asSimpleFrac(dy) && asSimpleFrac(dy).includes('/');
    const isFracSlope = asSimpleFrac(slope) && asSimpleFrac(slope).includes('/');

    // Δx-Label: horizontal zentriert unter/über der Grundlinie
    const belowY = dy >= 0
      ? py2 + (isFracDx ? fracH/2 + 4 : fs/2 + 4)
      : py2 - (isFracDx ? fracH/2 + 4 : fs/2 + 4);
    ctxFracVal((px0+px2)/2, belowY, dx, fn.color, fs, 'center');

    // Δy-Label: rechts neben der Vertikalen, untere Hälfte
    const midY = (py1 + py2) / 2;
    const dyY = midY + (isFracDy ? fracH/2 + 2 : fs/2 + 2);
    ctxFracVal(px2 + 6, dyY, dy, fn.color, fs, 'left');

    // m=-Label: rechts neben der Vertikalen, obere Hälfte
    const mY = midY - (isFracSlope ? fracH/2 + 2 : fs/2 + 2);
    ctxSlopeLabel(px2 + 6, mY, slope, fn.color, fs);

    // Punkte an den beiden Eckpunkten zeichnen mit Koordinaten-Label
    [[xLeft, yLeft, px0, py0], [xRight, yRight, px1, py1]].forEach(([x, y, cx, cy], idx) => {
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
      ctx.fillStyle = fn.color; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      // Koordinaten-Label mit Brüchen
      ctx.font = `${fs}px system-ui`; ctx.fillStyle = fn.color;
      const xStr = niceNum(x), yStr = niceNum(y);
      const lbl = `(${xStr}|${yStr})`;
      ctx.textAlign = idx === 0 ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(lbl, cx + (idx === 0 ? -7 : 7), cy - 10);
      ctx.restore();
    });
    ctx.restore();
  }

  functions.forEach((fn, fi) => {
    if (!fn.expr.trim() || fn.visible === false || !isLinearFunc(fn.expr)) return;
    const slope = deriv1(fn.expr, 0); if (!isFinite(slope)) return;

    // ── Priorität 1: Manuell gepickte Punkte (slopeTriPtsMap, per Funktion) ─
    const customPts = slopeTriPtsMap[fi];
    if (customPts && customPts.length === 2) {
      const xA = customPts[0].x, xB = customPts[1].x;
      if (Math.abs(xB - xA) > 0.001) { drawTriBetween(fn, xA, xB); return; }
    }
    // Legacy fallback: global slopeTriPts (rückwärtskompatibel)
    if (slopeTriPts.length === 2 && slopeTriPts[0].fi === fi && slopeTriPts[1].fi === fi) {
      const xA = slopeTriPts[0].x, xB = slopeTriPts[1].x;
      if (Math.abs(xB - xA) > 0.001) { drawTriBetween(fn, xA, xB); return; }
    }

    // ── Priorität 2: Standard-Dreieck Δx=1, verankert am y-Achsenabschnitt ──
    // Default: Punkt A bei x=0 (Achsenabschnitt) — macht die Katheten direkt
    // zu 1 (Δx) und m (Δy), analog zur "y = mx + q"-Steigungsform (Priorität
    // 1). Gilt jetzt auch für direkt ins Eingabefeld getippte lineare
    // Funktionen (Nutzerwunsch) — nicht nur für die dort explizit gesetzten
    // Punkte. Nur wenn x=0 ausserhalb des sichtbaren Bereichs liegt (z.B.
    // nach Verschieben/Zoomen des Views) oder das Dreieck dort aus dem
    // sichtbaren y-Bereich ragen würde, wird auf die bisherige Position
    // im sichtbaren Bereich zurückgefallen.
    const triW = 1;
    const xRange = v.xmax - v.xmin;
    const ypad = (v.ymax - v.ymin) * 0.15;
    const xPad = xRange * 0.05;

    // Prüft eine Kandidaten-Position: liegt sie (samt Δx=1) im sichtbaren
    // x-Bereich, und liegen beide Eckpunkte im sichtbaren y-Bereich?
    function tryTri(x) {
      if (x < v.xmin + xPad || x + triW > v.xmax - xPad) return null;
      const y0 = safeEval(fn.expr, x), y1 = safeEval(fn.expr, x + triW);
      if (!isFinite(y0) || !isFinite(y1)) return null;
      if (y0 < v.ymin - ypad || y0 > v.ymax + ypad || y1 < v.ymin - ypad || y1 > v.ymax + ypad) return null;
      return x;
    }

    let testX = tryTri(0); // 1. Wahl: y-Achsenabschnitt
    if (testX === null) {
      // 2. Wahl: alte Standardposition im unteren Drittel des sichtbaren Bereichs
      let fallback = v.xmin + xRange * 0.15;
      if (fallback + triW > v.xmax - xPad) fallback = v.xmax - xRange * 0.15 - triW;
      if (fallback < v.xmin + xPad) fallback = v.xmin + xPad;
      testX = tryTri(fallback);
    }
    if (testX === null) {
      // 3. Wahl: Mitte des sichtbaren Bereichs
      testX = tryTri((v.xmin + v.xmax) / 2 - 0.5);
    }
    if (testX === null) return; // keine sichtbare Position gefunden
    drawTriBetween(fn, testX, testX + triW);
  });
}

// ═══════════════════════════════════════════════════════════════════
// DIFFERENZENQUOTIENT-APPLET (Einstieg ins Thema Differentialrechnung)
// ═══════════════════════════════════════════════════════════════════
// Eigener Menüpunkt (Nutzerwunsch): FREI wählbare Funktion (Eingabefeld
// #diffquot-fn-input, Fallback x²) mit ZWEI ziehbaren Punkten A und B —
// siehe diffQuotSetup() (06_ui_functions.js) für den State
// (diffQuot = {fi, xA, xB}) und drag.type==='diffquotpt' (09_events.js) für
// das Ziehen von A/B. Alle Anzeigen dieses Applets (Punkt-Koordinaten,
// Katheten-Längen, Sidebar-Bruchkette) sind bewusst DEZIMAL-ONLY (niceNumDec()
// statt niceNum()/fracHTML()) — kein Wechsel zwischen Dezimalzahlen und
// Brüchen (Nutzerwunsch).

// Mindestabstand |h|, unterhalb dessen die Anzeige den Differenzenquotienten
// explizit als Annäherung an den Differentialquotienten (die Ableitung) framt.
const DIFFQUOT_NEAR_H = 0.25;

// Farbe für Sekante (Verbindungsgerade) und Steigungsdreieck (inkl. Katheten-
// Beschriftung) — bewusst NICHT die Funktionsfarbe (Nutzerwunsch: diese
// Konstruktion soll sich klar vom Funktionsgraphen abheben). Punkte A/B und
// deren Koordinaten-Labels bleiben bewusst in der Funktionsfarbe (Nutzerwunsch:
// "nur" Sekante+Dreieck sollen die Farbe wechseln, "sonst passt es gut").
// Wiederverwendung der bereits bestehenden neutralen Annotations-Farbe C.anno
// (02_core.js) — dadurch automatisch hell-/dunkel-/beamer-modus-tauglich,
// ohne einen weiteren eigenen Farbton einzuführen.
function dqConstrColor() { return C.anno; }

// Sucht den nähergelegenen Punkt (A ODER B, beide sind ziehbar) des
// Differenzenquotient-Applets zu einer Canvas-Position. Gibt 'A' oder 'B'
// zurück (je nachdem, welcher Punkt näher ist, falls beide in Trefferreichweite
// liegen — relevant wenn A und B nahe beieinander/zusammenfallen), sonst null.
function findNearDiffQuotHit(mx, my) {
  if (!diffQuot) return null;
  const fn = functions[diffQuot.fi]; if (!fn || fn.visible === false) return null;
  const HIT = ('ontouchstart' in window) ? 22 : 14;
  const yA = safeEval(fn.expr, diffQuot.xA), yB = safeEval(fn.expr, diffQuot.xB);
  let best = null, bestDist = Infinity;
  if (isFinite(yA)) {
    const { cx, cy } = toCanvas(diffQuot.xA, yA);
    const d = Math.hypot(cx - mx, cy - my);
    if (d < HIT && d < bestDist) { bestDist = d; best = 'A'; }
  }
  if (isFinite(yB)) {
    const { cx, cy } = toCanvas(diffQuot.xB, yB);
    const d = Math.hypot(cx - mx, cy - my);
    if (d < HIT && d < bestDist) { bestDist = d; best = 'B'; }
  }
  return best;
}

// Baut "(v)" bei negativem v, sonst nur "v" — DEZIMAL (niceNumDec(), kein
// Bruch-Umschalten). Für die Nenner-Zeile der ausgeschriebenen
// Differenzenquotient-Formel unten, z.B. "3 − (−1)" statt des
// missverständlichen "3 − -1".
function _dqParenDec(v) { const s = niceNumDec(v); return v < 0 ? `(${s})` : s; }

// Zeichnet das Differenzenquotient-Applet: Sekante durch A und B, Steigungs-
// dreieck (gestrichelt, MIT Katheten-Längenbeschriftung — Nutzerwunsch) sowie
// beide Punkte A und B im gleichen, ziehbaren Stil (kein Unterschied mehr
// zwischen "fix" und "beweglich"). Die Werte h/Δy/m erscheinen zusätzlich als
// EIN ausgeschriebener Bruchterm in der Sidebar (Schritt 5). Liegen A und B
// nahe genug beieinander, wird zusätzlich die Tangente in A eingeblendet und
// die Sidebar-Anzeige (#diffquot-dw) framt m explizit als Annäherung an den
// Differentialquotienten f'(xA) — siehe DIFFQUOT_NEAR_H oben.
function drawDiffQuot(w, h) {
  const dwEl = document.getElementById('diffquot-dw');
  if (!diffQuot) { if (dwEl) dwEl.innerHTML = ''; return; }
  const fn = functions[diffQuot.fi];
  if (!fn || fn.visible === false) { if (dwEl) dwEl.innerHTML = ''; return; }

  const v = isoView || view;
  const xA = diffQuot.xA, xB = diffQuot.xB;
  const yA = safeEval(fn.expr, xA), yB = safeEval(fn.expr, xB);
  if (!isFinite(yA) || !isFinite(yB)) return;
  const hVal = xB - xA;               // h = Δx
  const derivA = deriv1(fn.expr, xA); // wahrer Differentialquotient f'(xA)
  // Der gezogene Punkt darf den jeweils anderen nicht überspringen (siehe
  // 09_events.js: newX wird auf drag.side geklemmt) und darf exakt mit ihm
  // zusammenfallen (h=0). In dem Fall ist der Differenzenquotient
  // (yB−yA)/hVal ein 0/0-Ausdruck — die Sekante IST dann per Definition die
  // Tangente, daher wird m in diesem Grenzfall direkt auf den wahren
  // Differentialquotienten f'(xA) gesetzt (keine Division durch 0).
  const isCoincident = Math.abs(hVal) < 1e-9;
  const m = isCoincident ? derivA : (yB - yA) / hVal; // Differenzenquotient
  const isNear = Math.abs(hVal) < DIFFQUOT_NEAR_H;

  // ── 1. Sekante durch A und B, über den sichtbaren Bereich hinaus ─────
  {
    const { cx: sx0, cy: sy0 } = toCanvas(v.xmin, yA + m * (v.xmin - xA));
    const { cx: sx1, cy: sy1 } = toCanvas(v.xmax, yA + m * (v.xmax - xA));
    ctx.save();
    ctx.strokeStyle = dqConstrColor(); ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.lineTo(sx1, sy1); ctx.stroke();
    ctx.restore();
  }

  // ── 2. Tangente in A — nur eingeblendet, wenn A und B nahe genug beieinander
  //      liegen. Bei isCoincident IST die (oben gezeichnete) Sekante bereits
  //      exakt die Tangente (m=derivA) — ein zusätzlicher, optisch identischer
  //      Overlay wäre nur redundant, daher hier ausgelassen. ───────────────
  if (isNear && !isCoincident) {
    const { cx: tx0, cy: ty0 } = toCanvas(v.xmin, yA + derivA * (v.xmin - xA));
    const { cx: tx1, cy: ty1 } = toCanvas(v.xmax, yA + derivA * (v.xmax - xA));
    ctx.save();
    ctx.strokeStyle = '#7F27CE'; ctx.lineWidth = 1.6; ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(tx0, ty0); ctx.lineTo(tx1, ty1); ctx.stroke();
    ctx.restore();
  }

  // ── 3. Steigungsdreieck — gestrichelte Katheten MIT Längenbeschriftung
  //      (Nutzerwunsch), immer DEZIMAL (niceNumDec, kein Bruch-Umschalten).
  //      Die Werte erscheinen ZUSÄTZLICH als EIN ausgeschriebener Bruchterm
  //      in der Sidebar (Schritt 5, auf früheren Nutzerwunsch: "h und m nicht
  //      separat anzeigen, sondern als Differenzenquotient ausgeschrieben")
  //      — die Katheten-Beschriftung hier ist die geometrische Ergänzung
  //      dazu, direkt am Dreieck selbst. ──────────────────────────────────
  const xLeft = Math.min(xA, xB), xRight = Math.max(xA, xB);
  const yLeft = safeEval(fn.expr, xLeft), yRight = safeEval(fn.expr, xRight);
  const { cx: px0, cy: py0 } = toCanvas(xLeft, yLeft);
  const { cx: px1, cy: py1 } = toCanvas(xRight, yRight);
  const { cx: px2, cy: py2 } = toCanvas(xRight, yLeft);

  ctx.save();
  ctx.strokeStyle = dqConstrColor(); ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]);
  ctx.beginPath(); ctx.moveTo(px0, py0); ctx.lineTo(px2, py2); ctx.lineTo(px1, py1); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  const legH = Math.abs(xRight - xLeft), legV = Math.abs(yRight - yLeft);
  const dySigned = yB - yA;
  ctx.save();
  ctx.font = '10px system-ui'; ctx.fillStyle = dqConstrColor();
  if (legH > 1e-9) {
    // Waagrechte Kathete (Länge |Δx|): zentriert unter/über der Grundlinie —
    // "unter" wenn das Dreieck nach oben zeigt (dy>=0), sonst "über" (analog
    // zu drawSlopeTri()'s Δx-Label weiter oben in dieser Datei).
    const belowY = dySigned >= 0 ? py2 + 9 : py2 - 9;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(niceNumDec(legH), (px0 + px2) / 2, belowY);
  }
  if (legV > 1e-9) {
    // Senkrechte Kathete (Länge |Δy|): rechts neben der Vertikalen, vertikal zentriert
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(niceNumDec(legV), px2 + 6, (py1 + py2) / 2);
  }
  ctx.restore();

  // ── 4. Punkte A und B — BEIDE ziehbar, gleicher visueller Stil (Stil wie
  //      graphPoints; früher hatte A einen "fixiert"-Doppelring, das entfällt
  //      jetzt, Nutzerwunsch). Bei isCoincident fällt B optisch exakt mit A
  //      zusammen — ein zweiter, identisch überlagerter Kreis wäre nur
  //      redundant, daher wird dann nur EIN Punkt mit kombiniertem Label
  //      gezeichnet. ──────────────────────────────────────────────────────
  const { cx: cxA, cy: cyA } = toCanvas(xA, yA);
  const { cx: cxB, cy: cyB } = toCanvas(xB, yB);
  const draggingA = drag && drag.type === 'diffquotpt' && drag.which === 'A';
  const draggingB = drag && drag.type === 'diffquotpt' && drag.which === 'B';

  function drawDQPoint(cx, cy, dragging) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, dragging ? 10 : 8, 0, 2 * PI); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
    ctx.strokeStyle = fn.color; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 2 * PI); ctx.fillStyle = fn.color; ctx.fill();
    ctx.restore();
  }
  drawDQPoint(cxA, cyA, draggingA);
  if (!isCoincident) drawDQPoint(cxB, cyB, draggingB);

  ctx.save();
  ctx.font = 'bold 11px system-ui'; ctx.fillStyle = fn.color; ctx.textBaseline = 'middle';
  if (isCoincident) {
    // Kombiniertes Label "A=B(...)" statt zwei sich überlagernder Labels —
    // Seite (links/rechts) grob nach Position im Canvas gewählt (w = Canvas-Breite).
    const onLeftHalf = cxA < w / 2;
    ctx.textAlign = onLeftHalf ? 'left' : 'right';
    ctx.fillText(`A=B(${niceNumDec(xA)}|${niceNumDec(yA)})`, cxA + (onLeftHalf ? 13 : -13), cyA - 13);
  } else {
    ctx.textAlign = cxA <= cxB ? 'right' : 'left';
    ctx.fillText(`A(${niceNumDec(xA)}|${niceNumDec(yA)})`, cxA + (cxA <= cxB ? -13 : 13), cyA - 11);
    ctx.textAlign = cxB < cxA ? 'right' : 'left';
    ctx.fillText(`B(${niceNumDec(xB)}|${niceNumDec(yB)})`, cxB + (cxB < cxA ? -13 : 13), cyB + 13);
  }
  ctx.restore();

  // ── 5. Sidebar-Anzeige (#diffquot-dw): Differenzenquotient EINMAL
  //      AUSGESCHRIEBEN als Bruchkette (statt h und m getrennt anzuzeigen),
  //      z.B. m = (f(3)−f(1))/(3−1) = 8/2 = 4 — über das im Projekt bereits
  //      bestehende "Rechentool" .mfrac (03_math.js, dieselbe Bruch-
  //      Darstellung wie in den Lösungsweg-Boxen, siehe showLoesungsweg() in
  //      11_fitting.js), aber mit generischer f(x)-Schreibweise (statt der
  //      früheren, nur für x² gültigen Exponenten-Schreibweise x²) und
  //      IMMER dezimal (niceNumDec statt fracHTML) — Nutzerwunsch: kein
  //      Wechsel zwischen Dezimalzahlen und Brüchen.
  if (dwEl) {
    const dStr = niceNumDec(derivA), xAStr = niceNumDec(xA);
    let html = `<div>Differenzenquotient:</div>`;
    if (isCoincident) {
      // Grenzfall h=0: A und B liegen genau übereinander — kein 0/0-Bruch
      // anzeigen, sondern explizit den Übergang Sekante→Tangente benennen.
      html += `<div style="margin:4px 0;">A und B liegen jetzt genau übereinander (h = 0) — die Sekante ist zur Tangente geworden.</div>` +
              `<div style="color:#1D9E75;font-weight:600;">Differentialquotient: f'(${xAStr}) = <b>${dStr}</b></div>`;
    } else {
      const xAStr2 = niceNumDec(xA), xBStr = niceNumDec(xB);
      const denXA = _dqParenDec(xA); // vermeidet "3 − -1" in der Nenner-Zeile
      const frac0 = `<span class="mfrac"><span class="mfrac-num">f(${xBStr}) − f(${xAStr2})</span><span class="mfrac-den">${xBStr} − ${denXA}</span></span>`;
      const frac1 = `<span class="mfrac"><span class="mfrac-num">${niceNumDec(dySigned)}</span><span class="mfrac-den">${niceNumDec(hVal)}</span></span>`;
      html += `<div style="margin:4px 0;">m = ${frac0} = ${frac1} = <b>${niceNumDec(m)}</b></div>`;
      if (isNear) {
        html += `<div style="color:#1D9E75;font-weight:600;margin-top:3px;">→ A und B liegen nahe beieinander: m nähert sich dem Differentialquotienten f'(${xAStr}) = ${dStr}!</div>`;
      } else {
        html += `<div style="margin-top:3px;">Ziehe A und B näher zusammen, um zu sehen, wie m sich dem Differentialquotienten (f'(${xAStr}) = ${dStr}) annähert.</div>`;
      }
    }
    dwEl.innerHTML = html;
  }
}

// ═══════════════════════════════════════════════════════════════════
// OBER-/UNTERSUMMEN-APPLET: "Einstieg in den Integralbegriff"
// ═══════════════════════════════════════════════════════════════════
// Anzahl Stichproben je Teilintervall, um dessen (echtes) Supremum/Infimum
// numerisch anzunähern — bewusst NICHT nur die beiden Randwerte des
// Teilintervalls verwendet, da bei nicht-monotonen Funktionen (z.B. x² über
// ein Teilintervall wie [−0.1, 0.2]) das wahre Extremum in der MITTE liegen
// kann (hier: Minimum bei x=0), nicht an einem Rand — mit nur Randwerten
// wäre die berechnete Ober-/Untersumme mathematisch falsch.
const RIEMANN_SAMPLES_PER_STRIP = 24;

// Sucht den nähergelegenen Punkt (a ODER b, beide sind ziehbar) des
// Ober-/Untersummen-Applets zu einer Canvas-Position — analog zu
// findNearDiffQuotHit() oben, aber die Punkte liegen auf der x-Achse (y=0)
// statt auf der Kurve, da sie eine Intervallgrenze markieren.
function findNearRiemannHit(mx, my) {
  if (!riemann) return null;
  const fn = functions[riemann.fi1]; if (!fn || fn.visible === false) return null;
  const HIT = ('ontouchstart' in window) ? 22 : 14;
  let best = null, bestDist = Infinity;
  {
    const { cx, cy } = toCanvas(riemann.xA, 0);
    const d = Math.hypot(cx - mx, cy - my);
    if (d < HIT && d < bestDist) { bestDist = d; best = 'A'; }
  }
  {
    const { cx, cy } = toCanvas(riemann.xB, 0);
    const d = Math.hypot(cx - mx, cy - my);
    if (d < HIT && d < bestDist) { bestDist = d; best = 'B'; }
  }
  return best;
}

// Zeichnet das Ober-/Untersummen-Applet: n Rechtecke für Obersumme (orange)
// und n Rechtecke für Untersumme (teal), zwischen den ziehbaren
// Intervallgrenzen a und b. Beide Rechteck-Serien starten an der x-Achse
// (y=0) — bei positiver Funktion liegt die Untersumme-Fläche dadurch
// vollständig INNERHALB der Obersumme-Fläche (Untersumme wird NACH der
// Obersumme gezeichnet, also oben drauf), sodass als sichtbarer Orange-
// Streifen genau die Differenz Obersumme−Untersumme ("die Unschärfe" je
// Teilintervall) übrig bleibt — mit wachsendem n wird dieser Streifen immer
// dünner. Das Zwei-Kurven-Flächen-Applet ist ein eigener Menüpunkt, siehe
// drawFlaeche() weiter unten.
// Wird VOR den Funktionsgraphen gezeichnet (siehe draw(), Schritt 6), damit
// die Kurve(n) selbst oben drauf liegen. Intervallgrenzen-Marker und -Labels
// in der neutralen Farbe C.anno (Konstruktionselement, keine Funktionsfarbe
// — siehe dqConstrColor()-Konvention beim Differenzenquotient-Applet oben).
// Wertet die (einmalig in riemannSetup(), 06_ui_functions.js, symbolisch
// berechnete) Stammfunktion riemann.antiderivRaw an den aktuellen Grenzen
// xLeft/xRight numerisch aus und liefert deren LaTeX-Darstellung dazu — die
// eigentliche symbolische Integration (calcIntegrate()/nerdamer) passiert NUR
// einmal beim Aufschalten, hier (bei JEDEM Neuzeichnen, auch während des
// Ziehens) nur eine günstige safeEval()-Auswertung plus rawToLatex(). Gibt
// null zurück, wenn keine Stammfunktion vorliegt oder sie an einer der beiden
// Grenzen nicht auswertbar ist (z.B. Definitionslücke) — der Aufrufer fällt
// dann auf die rein numerische Näherung zurück.
function _riemannSymbolicIntegral(antiderivRaw, xLeft, xRight) {
  if (!antiderivRaw) return null;
  try {
    const Fa = safeEval(antiderivRaw, xLeft);
    const Fb = safeEval(antiderivRaw, xRight);
    if (!isFinite(Fa) || !isFinite(Fb)) return null;
    const FxLatex = rawToLatex(antiderivRaw);
    return { Fa, Fb, value: Fb - Fa, FxLatex };
  } catch (ex) { return null; }
}

function drawRiemann(w, h) {
  const dwEl = document.getElementById('riemann-dw');
  if (!riemann) { if (dwEl) dwEl.innerHTML = ''; return; }
  const fn1 = functions[riemann.fi1];
  if (!fn1 || fn1.visible === false) { if (dwEl) dwEl.innerHTML = ''; return; }

  const xA = riemann.xA, xB = riemann.xB;
  const xLeft = Math.min(xA, xB), xRight = Math.max(xA, xB);
  const n = Math.max(1, riemann.n || 10);
  const width = xRight - xLeft;

  // ── Intervallgrenzen a und b: ziehbare Markerpunkte auf der x-Achse ──
  // (gemeinsam für beide Modi verwendet, siehe unten).
  function drawBoundsMarkers() {
    const { cx: cxA, cy: cyAx } = toCanvas(xA, 0);
    const { cx: cxB } = toCanvas(xB, 0);
    const draggingA = drag && drag.type === 'riemannpt' && drag.which === 'A';
    const draggingB = drag && drag.type === 'riemannpt' && drag.which === 'B';
    function drawRPoint(cx, cy, dragging) {
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, dragging ? 10 : 8, 0, 2 * PI); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
      ctx.strokeStyle = C.anno; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 2 * PI); ctx.fillStyle = C.anno; ctx.fill();
      ctx.restore();
    }
    const isCoincident = Math.abs(xB - xA) < 1e-9;
    drawRPoint(cxA, cyAx, draggingA);
    if (!isCoincident) drawRPoint(cxB, cyAx, draggingB);

    ctx.save();
    ctx.font = 'bold 11px system-ui'; ctx.fillStyle = C.anno; ctx.textBaseline = 'middle';
    if (isCoincident) {
      ctx.textAlign = cxA < w / 2 ? 'left' : 'right';
      ctx.fillText(`a=b(${niceNumDec(xA)})`, cxA + (cxA < w / 2 ? 13 : -13), cyAx - 13);
    } else {
      ctx.textAlign = cxA <= cxB ? 'right' : 'left';
      ctx.fillText(`a(${niceNumDec(xA)})`, cxA + (cxA <= cxB ? -13 : 13), cyAx - 13);
      ctx.textAlign = cxB < cxA ? 'right' : 'left';
      ctx.fillText(`b(${niceNumDec(xB)})`, cxB + (cxB < cxA ? -13 : 13), cyAx - 13);
    }
    ctx.restore();
  }

  if (width < 1e-9) {
    if (dwEl) dwEl.innerHTML = '<div>Die Intervallgrenzen a und b liegen genau übereinander — kein Intervall.</div>';
    return;
  }

  // ── Ober-/Untersummen zwischen Funktion und x-Achse ──
  const stripW = width / n;
  let obersumme = 0, untersumme = 0;
  const OBER_FILL = 'rgba(216,90,48,0.30)', OBER_STROKE = 'rgba(216,90,48,0.85)';
  const UNTER_FILL = 'rgba(29,158,117,0.45)', UNTER_STROKE = 'rgba(29,158,117,0.9)';

  // Je Teilintervall dichte Stichprobe → echtes (angenähertes) Supremum/
  // Infimum statt nur der beiden Randwerte (siehe RIEMANN_SAMPLES_PER_STRIP
  // oben für die Begründung).
  const strips = [];
  for (let k = 0; k < n; k++) {
    const sxL = xLeft + k * stripW, sxR = xLeft + (k + 1) * stripW;
    let sup = -Infinity, inf = Infinity;
    for (let s = 0; s <= RIEMANN_SAMPLES_PER_STRIP; s++) {
      const x = sxL + (sxR - sxL) * (s / RIEMANN_SAMPLES_PER_STRIP);
      const y = safeEval(fn1.expr, x);
      if (!isFinite(y)) continue;
      if (y > sup) sup = y;
      if (y < inf) inf = y;
    }
    if (sup === -Infinity || inf === Infinity) continue; // Funktion hier nirgends definiert
    strips.push({ sxL, sxR, sup, inf });
    obersumme += sup * stripW;
    untersumme += inf * stripW;
  }

  function fillRect(sxL, sxR, yVal, fillCol, strokeCol) {
    const { cx: cxL, cy: cyBase } = toCanvas(sxL, 0);
    const { cx: cxR, cy: cyTop } = toCanvas(sxR, yVal);
    ctx.save();
    ctx.fillStyle = fillCol;
    ctx.fillRect(cxL, Math.min(cyBase, cyTop), cxR - cxL, Math.abs(cyBase - cyTop));
    ctx.strokeStyle = strokeCol; ctx.lineWidth = 1;
    ctx.strokeRect(cxL, Math.min(cyBase, cyTop), cxR - cxL, Math.abs(cyBase - cyTop));
    ctx.restore();
  }

  // Obersumme zuerst (liegt bei positiver Funktion "aussen"), Untersumme
  // danach darüber (liegt "innen") — siehe Erklärung in der Funktions-
  // dokumentation oben.
  strips.forEach(({ sxL, sxR, sup }) => fillRect(sxL, sxR, sup, OBER_FILL, OBER_STROKE));
  strips.forEach(({ sxL, sxR, inf }) => fillRect(sxL, sxR, inf, UNTER_FILL, UNTER_STROKE));

  drawBoundsMarkers();

  // ── Sidebar-Anzeige (#riemann-dw): Obersumme, Untersumme, Differenz und
  //    das exakte Integral als Referenzwert (computeSignedIntegral(),
  //    04_analysis.js) — je grösser n, desto näher rücken alle drei Werte
  //    zusammen. ────────────────────────────────────────────────────
  if (dwEl) {
    const diff = obersumme - untersumme;
    let html = `<div>n = ${n} Teilintervalle</div>`;
    html += `<div style="margin-top:4px;color:#D85A30;font-weight:600;">Obersumme O = ${niceNumDec(obersumme)}</div>`;
    html += `<div style="color:#1D9E75;font-weight:600;">Untersumme U = ${niceNumDec(untersumme)}</div>`;
    html += `<div style="margin-top:3px;">O − U = ${niceNumDec(diff)}</div>`;
    const sym = _riemannSymbolicIntegral(riemann.antiderivRaw, xLeft, xRight);
    if (sym) {
      // Symbolische Stammfunktion vorhanden — echter geschlossener Ausdruck
      // statt einer numerischen Simpson-Näherung (Nutzerwunsch: "einen
      // symbolischen Ausdruck für das Integral").
      const aL = latexNum(xLeft), bL = latexNum(xRight);
      const latex = `\\int_{${aL}}^{${bL}} f(x)\\,dx = \\Big[${sym.FxLatex}\\Big]_{${aL}}^{${bL}} = ${latexNum(sym.value)}`;
      html += `<div style="margin-top:4px;">Exaktes Integral (symbolisch):</div>`;
      html += `<div style="margin:2px 0 4px;">${latexToMathLiveHtml(latex)}</div>`;
    } else {
      const exact = (typeof computeSignedIntegral === 'function') ? computeSignedIntegral(fn1.expr, xLeft, xRight) : NaN;
      if (isFinite(exact)) {
        html += `<div style="margin-top:4px;">Exaktes Integral: <b>${niceNumDec(exact)}</b></div>`;
      }
    }
    if (n < 40) {
      html += `<div style="margin-top:3px;">Erhöhe n — O und U rücken näher an das exakte Integral heran.</div>`;
    } else {
      html += `<div style="margin-top:3px;color:#1D9E75;">O und U liegen jetzt sehr nahe beieinander!</div>`;
    }
    dwEl.innerHTML = html;
  }
}

// Trefferpunkt-Test für die ziehbaren Grenzmarker des Flächen-Applets —
// analog zu findNearRiemannHit() oben, aber die Marker sitzen je nach
// flaeche.axis auf unterschiedlichen Achsen: axis 'x'/'g' auf der x-Achse
// (a,0)/(b,0) wie beim Ober-/Untersummen-Applet, axis 'y' dagegen auf der
// y-Achse (0,a)/(0,b) — siehe drawFlaeche() unten.
function findNearFlaecheHit(mx, my) {
  if (!flaeche) return null;
  const fn = functions[flaeche.fi1]; if (!fn || fn.visible === false) return null;
  const HIT = ('ontouchstart' in window) ? 22 : 14;
  let best = null, bestDist = Infinity;
  const ptA = flaeche.axis === 'y' ? toCanvas(0, flaeche.a) : toCanvas(flaeche.a, 0);
  const ptB = flaeche.axis === 'y' ? toCanvas(0, flaeche.b) : toCanvas(flaeche.b, 0);
  {
    const d = Math.hypot(ptA.cx - mx, ptA.cy - my);
    if (d < HIT && d < bestDist) { bestDist = d; best = 'A'; }
  }
  {
    const d = Math.hypot(ptB.cx - mx, ptB.cy - my);
    if (d < HIT && d < bestDist) { bestDist = d; best = 'B'; }
  }
  return best;
}

// Zeichnet das Flächen-Applet — siehe die ausführliche Doku bei "let flaeche"
// (02_core.js) für die drei Randarten. axis 'x'/'g' laufen über denselben
// Zeichencode (g wird bei axis='x' einfach als Ausdruck "0" behandelt):
// schraffierte Fläche zwischen f und g, plus exaktem Wert (symbolisch wenn
// möglich, sonst computeArea(), 04_analysis.js). axis 'y' zeichnet
// stattdessen die Fläche zwischen der Kurve und der y-Achse (horizontale
// Grenzlinien bei y=a/y=b statt vertikale); x(y) wird dafür kontinuierlich
// verfolgt (_flaecheYInvertNear(), 06_ui_functions.js — wichtig für
// Performance UND Korrektheit bei nicht injektiven Funktionen wie x², siehe
// dortige Dokumentation) und zeigt eine rein NUMERISCHE Flächennäherung
// (Trapezregel über genau dieselben Stützpunkte, die auch gezeichnet
// werden — damit Anzeige und Zeichnung immer exakt übereinstimmen).
function drawFlaeche(w, h) {
  const dwEl = document.getElementById('flaeche-dw');
  if (!flaeche) { if (dwEl) dwEl.innerHTML = ''; return; }
  const fn1 = functions[flaeche.fi1];
  if (!fn1 || fn1.visible === false) { if (dwEl) dwEl.innerHTML = ''; return; }
  const hasG = flaeche.axis === 'g';
  const fn2 = hasG ? functions[flaeche.fi2] : null;
  if (hasG && (!fn2 || fn2.visible === false)) { if (dwEl) dwEl.innerHTML = ''; return; }

  const a = flaeche.a, b = flaeche.b;
  const lo = Math.min(a, b), hi = Math.max(a, b);
  if (hi - lo < 1e-9) {
    if (dwEl) dwEl.innerHTML = '<div>Die Grenzen a und b liegen genau übereinander — kein Intervall.</div>';
    return;
  }

  if (flaeche.axis === 'x' || flaeche.axis === 'g') {
    const expr2 = hasG ? fn2.expr : '0';
    const xLeft = lo, xRight = hi;

    function drawBoundsMarkersX() {
      const { cx: cxA, cy: cyAx } = toCanvas(a, 0);
      const { cx: cxB } = toCanvas(b, 0);
      const draggingA = drag && drag.type === 'flaechept' && drag.which === 'A';
      const draggingB = drag && drag.type === 'flaechept' && drag.which === 'B';
      function drawRPoint(cx, cy, dragging) {
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, dragging ? 10 : 8, 0, 2 * PI); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
        ctx.strokeStyle = C.anno; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 2 * PI); ctx.fillStyle = C.anno; ctx.fill();
        ctx.restore();
      }
      const isCoincident = Math.abs(b - a) < 1e-9;
      drawRPoint(cxA, cyAx, draggingA);
      if (!isCoincident) drawRPoint(cxB, cyAx, draggingB);
      ctx.save();
      ctx.font = 'bold 11px system-ui'; ctx.fillStyle = C.anno; ctx.textBaseline = 'middle';
      if (isCoincident) {
        ctx.textAlign = cxA < w / 2 ? 'left' : 'right';
        ctx.fillText(`a=b(${niceNumDec(a)})`, cxA + (cxA < w / 2 ? 13 : -13), cyAx - 13);
      } else {
        ctx.textAlign = cxA <= cxB ? 'right' : 'left';
        ctx.fillText(`a(${niceNumDec(a)})`, cxA + (cxA <= cxB ? -13 : 13), cyAx - 13);
        ctx.textAlign = cxB < cxA ? 'right' : 'left';
        ctx.fillText(`b(${niceNumDec(b)})`, cxB + (cxB < cxA ? -13 : 13), cyAx - 13);
      }
      ctx.restore();
    }

    const aCol = AREA_ALPHAS[flaeche.fi1 % AREA_ALPHAS.length];
    const width = xRight - xLeft;
    const steps = Math.round(w * 2), xs = [], y1s = [], y2s = [];
    for (let i = 0; i <= steps; i++) {
      const x = xLeft + (i / steps) * width, ya = safeEval(fn1.expr, x), yb = safeEval(expr2, x);
      if (isFinite(ya) && isFinite(yb)) { xs.push(x); y1s.push(ya); y2s.push(yb); }
    }
    if (xs.length > 1) {
      ctx.beginPath();
      xs.forEach((x, i) => { const { cx, cy } = toCanvas(x, y1s[i]); i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy); });
      for (let i = xs.length - 1; i >= 0; i--) { const { cx, cy } = toCanvas(xs[i], y2s[i]); ctx.lineTo(cx, cy); }
      ctx.closePath(); ctx.fillStyle = aCol; ctx.fill();
      const edgeCol = fn1.color + '88';
      ctx.strokeStyle = edgeCol; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
      const { cx: lx1 } = toCanvas(xLeft, 0), { cx: lx2 } = toCanvas(xRight, 0);
      ctx.beginPath(); ctx.moveTo(lx1, 0); ctx.lineTo(lx1, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx2, 0); ctx.lineTo(lx2, h); ctx.stroke();
      ctx.setLineDash([]);
    }

    drawBoundsMarkersX();

    if (dwEl) {
      const gLabel = hasG ? 'g' : 'der x-Achse';
      let html = `<div>Fläche zwischen f und ${gLabel} im Intervall [${niceNumDec(xLeft)}, ${niceNumDec(xRight)}]</div>`;
      const sym = _riemannSymbolicIntegral(flaeche.antiderivRaw, xLeft, xRight);
      if (sym) {
        const aL = latexNum(xLeft), bL = latexNum(xRight);
        const areaVal = Math.abs(sym.value);
        const gTex = hasG ? 'g(x)' : '0';
        let latex = `\\int_{${aL}}^{${bL}} \\big(f(x)-${gTex}\\big)\\,dx = \\Big[${sym.FxLatex}\\Big]_{${aL}}^{${bL}} = ${latexNum(sym.value)}`;
        html += `<div style="margin-top:4px;">Fläche (symbolisch):</div>`;
        html += `<div style="margin:2px 0 4px;">${latexToMathLiveHtml(latex)}</div>`;
        if (sym.value < 0) {
          html += `<div>Fläche = <b>${latexToMathLiveHtml('\\left|' + latexNum(sym.value) + '\\right| = ' + latexNum(areaVal))}</b></div>`;
        }
      } else {
        const exact = (typeof computeArea === 'function') ? computeArea(fn1.expr, expr2, xLeft, xRight) : NaN;
        if (isFinite(exact)) {
          html += `<div style="margin-top:4px;">Fläche ≈ <b>${niceNumDec(exact)}</b></div>`;
        }
      }
      dwEl.innerHTML = html;
    }
    return;
  }

  // ── axis === 'y': Fläche zwischen Kurve und y-Achse ──
  // WICHTIG (Performance + Korrektheit): x(y) wird hier NICHT mehr für jeden
  // Schritt global neu gesucht (_flaecheYInvert(), 4000 Stützstellen pro
  // Aufruf — bei h*1.5 Schritten macht das mehrere Millionen Auswertungen
  // PRO Neuzeichnung, spürbar beim Ziehen). Stattdessen wird die Kurve
  // kontinuierlich verfolgt: einmalig ein Startpunkt per globaler Suche,
  // danach jeder weitere Punkt per lokaler, auf den Vorgänger verankerter
  // Suche (_flaecheYInvertNear() — siehe dort). Das behebt gleichzeitig den
  // Zickzack-/Streifen-Fülleffekt bei nicht injektiven Funktionen wie x²
  // (dort gibt es zu jedem y ZWEI x-Lösungen ±√y; die globale "nächste zur
  // y-Achse"-Regel sprang unkontrolliert zwischen beiden Ästen).
  const [xSearchLo, xSearchHi] = _riemannIsectSearchRange();
  const steps = Math.min(400, Math.max(120, Math.round(h))), ys = [], xsCurve = [];
  const nearRadius = Math.max((xSearchHi - xSearchLo) * 0.1, 1);
  {
    let prevX = null;
    for (let i = 0; i <= steps; i++) {
      const y = lo + (i / steps) * (hi - lo);
      const x = prevX === null
        ? _flaecheYInvert(fn1.expr, y, xSearchLo, xSearchHi)
        : _flaecheYInvertNear(fn1.expr, y, prevX, nearRadius, xSearchLo, xSearchHi);
      if (x !== null) { ys.push(y); xsCurve.push(x); prevX = x; } else { prevX = null; }
    }
  }
  const aCol = AREA_ALPHAS[flaeche.fi1 % AREA_ALPHAS.length];
  if (xsCurve.length > 1) {
    ctx.beginPath();
    xsCurve.forEach((x, i) => { const { cx, cy } = toCanvas(x, ys[i]); i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy); });
    for (let i = ys.length - 1; i >= 0; i--) { const { cx, cy } = toCanvas(0, ys[i]); ctx.lineTo(cx, cy); }
    ctx.closePath(); ctx.fillStyle = aCol; ctx.fill();
    const edgeCol = fn1.color + '88';
    ctx.strokeStyle = edgeCol; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
    const { cy: ly1 } = toCanvas(0, lo), { cy: ly2 } = toCanvas(0, hi);
    ctx.beginPath(); ctx.moveTo(0, ly1); ctx.lineTo(w, ly1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, ly2); ctx.lineTo(w, ly2); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Grenzmarker AUF der y-Achse (x=0) statt auf der x-Achse.
  {
    const { cx: cxAx, cy: cyA } = toCanvas(0, a);
    const { cy: cyB } = toCanvas(0, b);
    const draggingA = drag && drag.type === 'flaechept' && drag.which === 'A';
    const draggingB = drag && drag.type === 'flaechept' && drag.which === 'B';
    function drawRPointY(cy, dragging) {
      ctx.save();
      ctx.beginPath(); ctx.arc(cxAx, cy, dragging ? 10 : 8, 0, 2 * PI); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
      ctx.strokeStyle = C.anno; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(cxAx, cy, 3, 0, 2 * PI); ctx.fillStyle = C.anno; ctx.fill();
      ctx.restore();
    }
    const isCoincident = Math.abs(b - a) < 1e-9;
    drawRPointY(cyA, draggingA);
    if (!isCoincident) drawRPointY(cyB, draggingB);
    ctx.save();
    ctx.font = 'bold 11px system-ui'; ctx.fillStyle = C.anno; ctx.textBaseline = 'middle';
    ctx.textAlign = cxAx < w / 2 ? 'left' : 'right';
    if (isCoincident) {
      ctx.fillText(`a=b(${niceNumDec(a)})`, cxAx + (cxAx < w / 2 ? 13 : -13), cyA);
    } else {
      ctx.fillText(`a(${niceNumDec(a)})`, cxAx + (cxAx < w / 2 ? 13 : -13), cyA);
      ctx.fillText(`b(${niceNumDec(b)})`, cxAx + (cxAx < w / 2 ? 13 : -13), cyB);
    }
    ctx.restore();
  }

  if (dwEl) {
    let html = `<div>Fläche zwischen f und der y-Achse im Intervall [${niceNumDec(lo)}, ${niceNumDec(hi)}] (y-Werte)</div>`;
    // Trapezregel über GENAU dieselben Stützpunkte (xsCurve/ys), die auch
    // gezeichnet wurden — statt einer separaten Berechnung (die z.B. bei
    // nicht injektiven Funktionen auf einem anderen Ast landen könnte als
    // die gezeichnete Fläche). So stimmen Anzeige und Zeichnung immer exakt
    // überein (auch relevant für den LaTeX-Export, siehe 07_export.js).
    let exact = NaN;
    if (xsCurve.length > 1) {
      exact = 0;
      for (let i = 1; i < xsCurve.length; i++) {
        exact += (Math.abs(xsCurve[i]) + Math.abs(xsCurve[i - 1])) / 2 * (ys[i] - ys[i - 1]);
      }
    }
    if (isFinite(exact)) {
      html += `<div style="margin-top:4px;">Fläche ≈ <b>${niceNumDec(exact)}</b> <span style="color:var(--text-muted);font-weight:400;">(numerische Näherung)</span></div>`;
    } else {
      html += `<div style="margin-top:4px;color:var(--text-muted);">Fläche konnte nicht berechnet werden — f ist im Intervall evtl. nicht (umkehrbar) definiert.</div>`;
    }
    dwEl.innerHTML = html;
  }
}

// ═══════════════════════════════════════════════════════════════════
// SENKRECHTE & MITTELSENKRECHTE: KONSTRUKTIONSMARKER
// ═══════════════════════════════════════════════════════════════════
// Zeichnet für jede über linAddPerp()/linAddBisector() erzeugte Funktion
// (siehe perpMeta in 11_fitting.js) den zugehörigen Konstruktionspunkt:
// bei einer Mittelsenkrechten die gestrichelte Ausgangsstrecke + den
// Mittelpunkt M, bei einer einfachen Senkrechten den frei gewählten Punkt Q
// — jeweils mit MathLive-gerenderter Koordinatenbeschriftung (gleiche
// Schrift wie überall, siehe drawMathLabel()). Unabhängig vom
// "Steigungsdreieck"-Kontrollkästchen, da dies eine eigene Konstruktion ist.
function drawPerpMarkers() {
  if (typeof perpMeta !== 'object' || !perpMeta) return;

  function dot(x, y, col) {
    const { cx, cy } = toCanvas(x, y);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2 * PI);
    ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    return { cx, cy };
  }
  function labelAt(cx, cy, letter, x, y, col) {
    const html = (typeof latexToMathLiveHtml === 'function')
      ? letter + latexToMathLiveHtml(niceCoord(x, y, true))
      : null;
    if (html) {
      drawMathLabel(html, cx + 7, cy - 8, col, { align: 'left', baseline: 'bottom', fontSize: 11 });
    } else {
      ctx.save();
      ctx.font = '11px system-ui'; ctx.fillStyle = col;
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(`${letter}${niceCoord(x, y)}`, cx + 7, cy - 8);
      ctx.restore();
    }
  }

  Object.keys(perpMeta).forEach(key => {
    const fi = parseInt(key, 10);
    const fn = functions[fi];
    const meta = perpMeta[fi];
    if (!fn || fn.visible === false || !meta) return;

    if (meta.kind === 'bisector' && meta.ptA && meta.ptB && meta.mid) {
      const a = toCanvas(meta.ptA.x, meta.ptA.y), b = toCanvas(meta.ptB.x, meta.ptB.y);
      ctx.save();
      ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 1.3; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(a.cx, a.cy); ctx.lineTo(b.cx, b.cy); ctx.stroke();
      ctx.restore();
      const { cx, cy } = dot(meta.mid.x, meta.mid.y, fn.color);
      labelAt(cx, cy, 'M', meta.mid.x, meta.mid.y, fn.color);
    } else if (meta.kind === 'perp' && meta.throughPt) {
      const { cx, cy } = dot(meta.throughPt.x, meta.throughPt.y, fn.color);
      labelAt(cx, cy, 'Q', meta.throughPt.x, meta.throughPt.y, fn.color);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
// EINHEITSKREIS ZEICHNEN
// ═══════════════════════════════════════════════════════════════════

// Zeichnet den Einheitskreis mit:
// - Gestricheltem Kreis
// - Standard-Winkelmarkierungen (0, π/6, π/4, ...)
// - Nutzerdefinierten Punkten mit:
//   - Radialer Linie vom Ursprung
//   - sin/cos-Projektionslinien (gestrichelt, auf x-/y-Achse) — zeigen den
//     Wert bereits direkt am Kreis, wie im Lehrbuch üblich
//   - Tangenskonstruktion (nur wenn eine tan-artige Funktion sichtbar ist):
//     die durch Ursprung und Kreispunkt verlängerte Gerade schneidet die
//     Tangente x=1 exakt bei y=tan(a) — die klassische, namensgebende
//     Herleitung, direkt am Kreis sichtbar.
//   - Punkt auf jedem sichtbaren sin/cos/tan-Graphen, dargestellt wie jede
//     andere Funktion auch (senkrechter Balken von der x-Achse) — OHNE
//     Verbindungslinie zum Kreispunkt (recherchiert an gängigen Schulbuch-/
//     GeoGebra-Standarddarstellungen: dort verbindet nie eine Linie den
//     Kreispunkt direkt mit dem Graphpunkt; die Zuordnung geschieht allein
//     über Farbe + synchrone Bewegung). x_graph: sin/tan → a (Fenster
//     0…2π), cos → a−π/2 (Fenster -π/2…3π/2) — cos wird damit strukturell
//     zu einem phasenverschobenen sin (cos(a−π/2)=sin(a)): bei Kreispunkt
//     (0,1) [a=π/2] liegt der Graphpunkt ebenfalls bei (0,1).
function drawUnitCircle(w, h) {
  const { ox, oy, r } = getCircleParams(); if (r < 2) return; // zu klein zum Zeichnen
  const v = isoView || view;

  ctx.save();
  // Gestrichelter Kreis
  ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]);
  ctx.beginPath(); ctx.arc(ox, oy, r, 0, 2*PI); ctx.stroke(); ctx.setLineDash([]);

  // Standard-Winkelmarkierungen (kleine Punkte + Winkel-Labels)
  const angles = [0, PI/6, PI/4, PI/3, PI/2, 2*PI/3, 3*PI/4, 5*PI/6, PI, 7*PI/6, 5*PI/4, 4*PI/3, 3*PI/2, 5*PI/3, 7*PI/4, 11*PI/6];
  ctx.font = '9px system-ui';
  angles.forEach(a => {
    const cosA = Math.cos(a), sinA = Math.sin(a);
    // Punkt auf Kreis in Canvas-Koordinaten (y invertieren!)
    const px = ox + r * cosA, py = oy - r * sinA;
    ctx.beginPath(); ctx.arc(px, py, 2.5, 0, 2*PI); ctx.fillStyle = '#adb5bd'; ctx.fill();
    // Label nur wenn Punkt im sichtbaren Bereich
    if (cosA >= v.xmin - 0.1 && cosA <= v.xmax + 0.1 && sinA >= v.ymin - 0.1 && sinA <= v.ymax + 0.1) {
      const lx = px + (cosA >= 0 ? 12 : -12), ly = py + (sinA <= 0 ? 13 : -4);
      ctx.fillStyle = '#6b7280'; ctx.textAlign = cosA >= 0 ? 'left' : 'right';
      const pf = asPiFraction(a); // π-Notation wenn möglich
      ctx.fillText(pf && usePiMode() ? formatPi(pf.p, pf.q) : `${Math.round(a*180/PI)}°`, lx, ly);
    }
  });

  // Nutzerdefinierte Punkte auf dem Einheitskreis (draggable)
  unitCirclePts.forEach((ucp) => {
    const a = ucp.angle;
    const cosA = Math.cos(a), sinA = Math.sin(a);
    // Position auf Kreis (Canvas)
    const px = ox + r * cosA, py = oy - r * sinA;

    // Radiale Linie: Mittelpunkt (-1,0) → Punkt auf Kreis
    ctx.strokeStyle = '#378ADD55'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(px, py); ctx.stroke();

    // Vertikale Projektionslinie: Punkt → x-Achse (zeigt sinA = y-Koordinate)
    ctx.strokeStyle = '#D85A3055'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(px, oy); ctx.lineTo(px, py); ctx.stroke();

    // Horizontale Projektionslinie: Punkt → y-Achse (zeigt cosA als x-Koordinate)
    ctx.strokeStyle = '#1D9E7555'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox, py); ctx.lineTo(px, py); ctx.stroke();
    ctx.setLineDash([]);

    // Haupt-Punkt auf dem Kreis
    ctx.beginPath(); ctx.arc(px, py, 9, 0, 2*PI); ctx.fillStyle = 'rgba(55,138,221,0.12)'; ctx.fill();
    ctx.strokeStyle = '#378ADD'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, 3, 0, 2*PI); ctx.fillStyle = '#378ADD'; ctx.fill();

    // Label: Winkel, cos-Wert, sin-Wert
    const pf = asPiFraction(a);
    const angleTxt = pf && usePiMode() ? formatPi(pf.p, pf.q) : `${niceNum(a*180/PI)}°`;
    const lx = px + (cosA >= 0 ? 13 : -13), ly = py + (sinA <= 0 ? 18 : -8);
    ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#1e40af'; ctx.textAlign = cosA >= 0 ? 'left' : 'right';
    ctx.fillText(angleTxt, lx, ly);
    ctx.font = '9px system-ui';
    ctx.fillStyle = '#1D9E75'; ctx.fillText(`cos=${niceNum(cosA)}`, lx, ly + 12);
    ctx.fillStyle = '#D85A30'; ctx.fillText(`sin=${niceNum(sinA)}`, lx, ly + 22);

    // Tangenskonstruktion (klassisch, namensgebend): die durch Ursprung und
    // Kreispunkt verlängerte Gerade schneidet die senkrechte Tangente x=1
    // exakt bei y = tan(a) — unabhängig vom Quadranten (bei Punkten in der
    // linken Kreishälfte verläuft die Verlängerung durch den Ursprung
    // hindurch, ergibt aber weiterhin exakt tan(a), siehe 09_events.js/
    // 07_export.js für dieselbe Formel). Wird nur gezeichnet, wenn eine
    // sichtbare tan-artige Funktion existiert — macht den Tangens-Wert
    // direkt am Kreis "graphisch ersichtlich", statt ihn nur auf dem
    // Graphen als Balken zu zeigen.
    const hasVisibleTan = functions.some(fn => {
      if (!fn.expr.trim() || fn.visible === false) return false;
      const e = fn.expr.trim();
      return /\btan\s*\(/.test(e) && !/\bsin\s*\(/.test(e) && !/\bcos\s*\(/.test(e);
    });
    if (hasVisibleTan && Math.abs(cosA) > 1e-6) {
      const tanA = sinA / cosA; // == tan(a) exakt, wie unten in der Projektion
      const { cx: tx, cy: ty } = toCanvas(1, tanA);
      const { cx: t0x, cy: t0y } = toCanvas(1, 0);
      ctx.strokeStyle = '#8B5CF6aa'; ctx.lineWidth = 1.3; ctx.setLineDash([]);
      // Verlängerte Gerade: Kreispunkt → Schnittpunkt auf der Tangente x=1
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(tx, ty); ctx.stroke();
      // Höhe auf der Tangente selbst (wie cos/sin als Streckenlänge gezeigt)
      ctx.strokeStyle = '#8B5CF655'; ctx.lineWidth = 2; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(t0x, t0y); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(tx, ty, 3, 0, 2*PI); ctx.fillStyle = '#8B5CF6'; ctx.fill();
      ctx.font = '9px system-ui'; ctx.fillStyle = '#8B5CF6'; ctx.textAlign = 'left';
      ctx.fillText(`tan=${niceNum(tanA)}`, tx + 6, ty + 3);
    }

    // Projektion auf alle sichtbaren Graphen
    // Typ-Erkennung via Ausdrucks-Pattern statt Wert-Vergleich (zuverlässiger):
    //   sin-artig: Ausdruck enthält sin( ohne cos/tan dominierend
    //   cos-artig: Ausdruck enthält cos( ohne sin/tan dominierend
    //   tan-artig: Ausdruck enthält tan(
    // x_graph je nach Typ (bestimmt, welches x-Fenster der Punkt beim
    // Herumziehen um den VOLLEN Kreis (Winkel a läuft 0…2π) überstreicht):
    //   sin/tan: x_graph = a       → Fenster 0…2π (Winkel entspricht direkt
    //            x; für tan siehe die Tangentenkonstruktion oben, die exakt
    //            denselben Wert zeigt)
    //   cos:     x_graph = a - π/2 → Fenster -π/2…3π/2. Macht cos strukturell
    //            identisch zu sin (der Graphwert entspricht wieder direkt
    //            der Höhe sinA des Kreispunkts, denn cos(a-π/2)=sin(a)) —
    //            einfach um π/2 phasenverschoben, wie bei Kreispunkt (0,1)
    //            (a=π/2): dort ist xG=0 und der Graphpunkt liegt ebenfalls
    //            bei (0,1).
    // Darstellung des Graphpunkts: WIE IM LEHRBUCH/GEOGEBRA ÜBLICH — keine
    // Verbindungslinie zwischen Kreispunkt und Graphpunkt (recherchiert an
    // mehreren Standard-Applets zu "Sinus/Kosinus am Einheitskreis": der
    // Kreis zeigt sinA/cosA bereits selbst über seine eigenen senkrechten/
    // waagrechten Projektionslinien oben, siehe dort; auf dem Graphen selbst
    // erscheint der Wert unabhängig davon als senkrechter Balken von der
    // x-Achse — exakt wie bei jeder anderen Funktion auch, siehe "Andere"
    // unten). Die einzige Verbindung ist die gleiche Farbe + synchrone
    // Bewegung, keine gezeichnete Linie zwischen den beiden Punkten.
    functions.forEach(fn => {
      if (!fn.expr.trim() || fn.visible === false) return;

      const expr = fn.expr.trim();
      const hasSin = /\bsin\s*\(/.test(expr);
      const hasCos = /\bcos\s*\(/.test(expr);
      const hasTan = /\btan\s*\(/.test(expr);
      const isCosLike = hasCos && !hasSin && !hasTan;

      const xG = isCosLike ? a - PI/2 : a;
      const yG = safeEval(fn.expr, xG);
      if (!isFinite(yG) || xG < v.xmin || xG > v.xmax || yG < v.ymin || yG > v.ymax) return;
      const { cx: gx, cy: gy } = toCanvas(xG, yG);
      ctx.setLineDash([4,3]); ctx.strokeStyle = fn.color + '88'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(gx, oy); ctx.lineTo(gx, gy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(gx, gy, 6, 0, 2*PI); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
      ctx.strokeStyle = fn.color; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(gx, gy, 2.5, 0, 2*PI); ctx.fillStyle = fn.color; ctx.fill();
    });
  });
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════
// TRIG-PROJEKTIONSPUNKT AUF DEM GRAPHEN ↔ EINHEITSKREIS (Hit-Test)
// ═══════════════════════════════════════════════════════════════════
// drawUnitCircle() zeichnet für JEDEN unitCirclePts-Eintrag automatisch die
// Projektion (Hypotenuse, Gegen-/Ankathete, gestrichelte Linie) auf jede
// sichtbare sin/cos/tan-artige Funktion — das ist der EINE Punkt, der über
// die "sin(x)/cos(x)/tan(x) aufschalten"-Knöpfe (trigAddFunction() in
// 06_ui_functions.js) auf den Einheitskreis gesetzt wird. Damit dieser
// Punkt nicht nur auf dem Kreis, sondern auch direkt auf dem Graphen
// gezogen werden kann (beides dieselbe Stelle, kein zweiter Punkt!),
// braucht es einen Hit-Test für die Graph-seitige Projektion — die
// Zieh-Logik selbst steht in 09_events.js (drag.type === 'trigproj').
// Formeln exakt wie in drawUnitCircle(): sin/tan → xG=a, cos → xG=a−π/2.
// Gibt bei mehreren Treffern den NÄCHSTEN zurück (nicht einfach den ersten),
// damit findNearCircleOrTrigHit() unten zuverlässig vergleichen kann.
function findNearTrigProjDot(mx, my) {
  const { ox, oy, r } = getCircleParams(); if (r < 2) return null;
  const HIT = ('ontouchstart' in window) ? 22 : 14;
  let best = null, bestDist = Infinity;
  for (let i = unitCirclePts.length - 1; i >= 0; i--) {
    const a = unitCirclePts[i].angle;
    for (const fn of functions) {
      if (!fn.expr.trim() || fn.visible === false) continue;
      const expr = fn.expr.trim();
      const hasSin = /\bsin\s*\(/.test(expr);
      const hasCos = /\bcos\s*\(/.test(expr);
      const hasTan = /\btan\s*\(/.test(expr);
      const isSinLike = hasSin && !hasCos && !hasTan;
      const isCosLike = hasCos && !hasSin && !hasTan;
      const isTanLike = hasTan && !hasSin && !hasCos;
      if (!isSinLike && !isCosLike && !isTanLike) continue;

      const kind = isSinLike ? 'sin' : isCosLike ? 'cos' : 'tan';
      const xG = isCosLike ? a - PI / 2 : a;
      const yG = safeEval(fn.expr, xG);
      if (!isFinite(yG)) continue;
      const { cx: gx, cy: gy } = toCanvas(xG, yG);
      const d = Math.hypot(gx - mx, gy - my);
      if (d < HIT && d < bestDist) { bestDist = d; best = { ucpIdx: i, kind, dist: d }; }
    }
  }
  return best;
}

// Kombinierter Hit-Test für mousedown/touchstart: prüft sowohl den
// Kreis-Punkt selbst als auch seine Projektion auf einen sichtbaren
// sin/cos/tan-Graphen, und gibt IMMER das Ziel zurück, dem die Maus/der
// Finger tatsächlich am nächsten ist ({type:'circlept',idx} oder
// {type:'trigproj',ucpIdx,kind}, sonst null).
// WICHTIG: Seit x_graph für cos direkt = a ist (kein −π/2-Versatz mehr),
// kann die Graph-Projektion bei manchen Winkeln (z.B. nahe der
// "Dottie-Zahl" a≈cos(a)≈0.739 rad, nicht weit vom Standard-Startwinkel
// π/4) fast exakt auf dem Kreis-Punkt selbst liegen. Ein simples "zuerst
// den einen Typ prüfen, dann den anderen" (frühere Version) würde dann
// IMMER denselben Typ greifen, selbst wenn die Maus eindeutig näher am
// jeweils anderen Punkt ist — für den Kreis-Punkt hiesse das: er lässt
// sich nicht mehr sauber der Maus folgend ziehen, weil stattdessen die
// Graph-Projektion mit ihrer ANDEREN Umkehrformel (x-Position statt
// Winkel-um-Mittelpunkt) den Drag übernimmt. Per Distanzvergleich bekommt
// zuverlässig das visuell nähere Ziel den Zugriff, unabhängig davon wie
// nah sich beide Trefferzonen kommen.
function findNearCircleOrTrigHit(mx, my) {
  const ci = findNearCirclePt(mx, my);
  const tp = findNearTrigProjDot(mx, my);
  let cDist = Infinity;
  if (ci >= 0) {
    const { ox, oy, r } = getCircleParams();
    const a = unitCirclePts[ci].angle;
    const px = ox + r * Math.cos(a), py = oy - r * Math.sin(a);
    cDist = Math.hypot(px - mx, py - my);
  }
  if (ci >= 0 && (!tp || cDist <= tp.dist)) return { type: 'circlept', idx: ci };
  if (tp) return { type: 'trigproj', ucpIdx: tp.ucpIdx, kind: tp.kind };
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// MATHE-BESCHRIFTUNGS-OVERLAY — Beschriftungen im selben Rendering wie das
// Eingabefeld (echte Bruchstriche, Wurzelzeichen, korrekte Vorzeichen), statt
// Canvas-fillText mit system-ui-Font. Nutzt dieselbe Engine wie das Funktions-
// Label-Overlay (updateFuncLabelsOverlay() in 06_ui_functions.js) — siehe
// exprToMathLiveHtml()/latexToMathLiveHtml() in 07_export.js für Details.
// Positionierung: toCanvas() liefert bereits CSS-Pixel (kein DPR-Faktor nötig,
// siehe setupCanvas()), daher direkt als position:absolute im #canvas-wrap
// verwendbar — dieselben Koordinaten wie für ctx.fillText().
// ═══════════════════════════════════════════════════════════════════
function clearMathLabelOverlay() {
  const ov = document.getElementById('canvas-label-overlay');
  if (ov) ov.innerHTML = '';
}
// html: fertiges HTML (z.B. von latexToMathLiveHtml() oder ein bereits
//       vorhandenes exaktes HTML-Label wie pt.exactLabel).
// x,y:  Ankerpunkt in CSS-Pixel-Canvas-Koordinaten (wie ctx.fillText).
// opts.align:    'left' (Default) | 'center' | 'right'   — wie ctx.textAlign
// opts.baseline: 'alphabetic' (Default) | 'top' | 'bottom' — wie ctx.textBaseline
//   ('alphabetic' wird wie 'bottom' behandelt — die optische Differenz durch
//   Unterlängen ist bei den hier verwendeten kurzen Labels vernachlässigbar.)
function drawMathLabel(html, x, y, color, opts) {
  const ov = document.getElementById('canvas-label-overlay');
  if (!ov || !html) return;
  const o = opts || {};
  const div = document.createElement('div');
  div.className = 'canvas-math-label';
  div.innerHTML = html;
  div.style.left = x + 'px';
  div.style.top = y + 'px';
  div.style.color = color || C.anno;
  div.style.fontSize = (o.fontSize || 11) + 'px';
  const align = o.align || 'left';
  const baseline = o.baseline || 'alphabetic';
  const tx = align === 'center' ? '-50%' : (align === 'right' ? '-100%' : '0%');
  const ty = baseline === 'top' ? '0%' : '-100%';
  div.style.transform = `translate(${tx}, ${ty})`;
  ov.appendChild(div);
}

// ═══════════════════════════════════════════════════════════════════
// LABEL-KOLLISIONSVERMEIDUNG
// ═══════════════════════════════════════════════════════════════════

// Speichert Rechtecke bereits platzierter Labels.
// Wird am Anfang jedes draw()-Aufrufs geleert.
let placedRects = [];
function resetLabels() { placedRects = []; }

// Findet eine kollisionsfreie Position für ein Label.
// dir: 'r' = Label rechts vom Punkt, 'l' = links
// Probiert mehrere Verschiebungen (oben/unten/links/rechts) bis keine Kollision.
function placeLabel(ctx, text, cx, cy, dir) {
  const m = ctx.measureText(text); const tw = m.width + 4, th = 14;
  // Mögliche Positionen in Prioritätsreihenfolge
  const offsets = dir === 'r'
    ? [[8,-th],[8,2],[8,-th*2],[-tw-8,-th],[-tw-8,2]]  // rechts: oben, unten, weit oben, links-oben, links-unten
    : [[0,-th-8],[0,6]];                                  // links: oben, unten
  for (const [ox, oy] of offsets) {
    const rx = cx + ox, ry = cy + oy, r = { x:rx, y:ry, w:tw, h:th };
    // Kollision prüfen mit allen bereits platzierten Labels
    if (!placedRects.some(e => rx < e.x+e.w && rx+tw > e.x && ry < e.y+e.h && ry+th > e.y)) {
      placedRects.push(r); return { x:rx, y:ry+th-2 }; // kollisionsfrei
    }
  }
  // Kein kollisionsfreier Platz: trotzdem zeichnen (erste Option)
  const [ox, oy] = offsets[0]; placedRects.push({ x:cx+ox, y:cy+oy, w:tw, h:th });
  return { x:cx+ox, y:cy+oy+th-2 };
}

// Zeichnet ein Label mit automatischer Kollisionsvermeidung.
// html (optional): wenn gesetzt, wird STATT ctx.fillText(text,...) ein
// MathLive-gerendertes HTML-Overlay-Label (drawMathLabel(), selbe Position)
// gezeichnet — 'text' dient dann nur noch der Breitenschätzung für die
// Kollisionsvermeidung (ctx.measureText), nicht der eigentlichen Anzeige.
function drawLabel(ctx, text, cx, cy, col, dir = 'r', html) {
  ctx.fillStyle = col || C.anno;
  const p = placeLabel(ctx, text, cx, cy, dir);
  if (html) { drawMathLabel(html, p.x, p.y, col, { align: 'left', baseline: 'alphabetic' }); return; }
  ctx.fillText(text, p.x, p.y);
}

// Zeichnet einen speziellen Punkt (Extremum, Nullstelle, Wendepunkt, Schnittpunkt)
// in der entsprechenden Farbe und Form.
function drawSpecialDot(cx, cy, kind, col) {
  const R = br(5);
  if (kind === 'max') { // Hochpunkt: gefüllter roter Kreis
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2*PI); ctx.fillStyle = '#e24b4a'; ctx.fill();
  } else if (kind === 'min') { // Tiefpunkt: gefüllter grüner Kreis
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2*PI); ctx.fillStyle = '#1D9E75'; ctx.fill();
  } else if (kind === 'inf') { // Wendepunkt: lila Dreieck
    const s = R * 1.2;
    ctx.beginPath(); ctx.moveTo(cx, cy-s); ctx.lineTo(cx+s, cy+s*0.8); ctx.lineTo(cx-s, cy+s*0.8); ctx.closePath(); ctx.fillStyle = '#7F77DD'; ctx.fill();
  } else { // Nullstelle / y-Achse / Schnittpunkt: offener Kreis in Funktionsfarbe
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2*PI); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.strokeStyle = kind === 'yaxis' ? '#BD10E0' : col; ctx.lineWidth = bw(2); ctx.stroke();
  }
}

// ═══════════════════════════════════════════════════════════════════
// HAUPT-ZEICHENFUNKTION draw()
// ═══════════════════════════════════════════════════════════════════

// Wird von scheduleDraw() via requestAnimationFrame aufgerufen.
// Zeichnet alles in einer definierten Reihenfolge (wichtig für Überlappung):
// 1. Hintergrund
// 2. Gitternetz
// 3. Achsen + Beschriftung
// 4. Einheitskreis
// 5. Asymptoten
// 6. Fläche
// 7. Funktionsgraphen
// 8. Steigungsdreieck
// 9. Funktionsbeschriftungen
// 10. Spezielle Punkte
// 11. Manuelle Punkte
// 12. Graph-Punkte
// 13. Hover-Linie
function draw() {
  const { w, h } = setupCanvas();
  const v = isoView || view; // isometrischer View für diesen Frame
  const axisFontSize = bf(parseInt(document.getElementById('axis-font-size')?.value || 12));
  const fnt = `${axisFontSize}px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif`;

  // Mathe-Beschriftungs-Overlay leeren (Asymptoten- + Punkt-Labels, siehe
  // drawMathLabel() weiter unten) — einmal pro draw()-Aufruf, VOR drawAsymptotes()
  // und der Spezielle-Punkte-Sektion, da beide neu hineinschreiben.
  clearMathLabelOverlay();

  // ── 1. Hintergrund ────────────────────────────────────────────
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
  ctx.font = fnt;

  // ── 2. Gitternetz ─────────────────────────────────────────────
  ctx.strokeStyle = C.grid; ctx.lineWidth = bw(1); ctx.setLineDash([]);
  const xyStep = gridStep(Math.min(v.xmax - v.xmin, v.ymax - v.ymin));
  const xStep = xyStep, yStep = xyStep;
  // Vertikale Gitterlinien
  for (let gx = Math.ceil(v.xmin/xStep)*xStep; gx <= v.xmax + xStep*0.01; gx += xStep) {
    const { cx } = toCanvas(gx, 0); ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
  }
  // Horizontale Gitterlinien
  for (let gy = Math.ceil(v.ymin/yStep)*yStep; gy <= v.ymax + yStep*0.01; gy += yStep) {
    const { cy } = toCanvas(0, gy); ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
  }

  // ── 3. Achsen ─────────────────────────────────────────────────
  ctx.strokeStyle = C.axis; ctx.lineWidth = bw(2); ctx.setLineDash([]);
  const o = toCanvas(0, 0);
  // x-Achse: bei y=0, aber immer im sichtbaren Bereich (oben/unten eingeklemmt)
  const xAxisY = Math.min(Math.max(o.cy, 0), h);
  ctx.beginPath(); ctx.moveTo(0, xAxisY); ctx.lineTo(w, xAxisY); ctx.stroke();
  // y-Achse: bei x=0, ebenfalls eingeklemmt
  const yAxisX = Math.min(Math.max(o.cx, 0), w);
  ctx.beginPath(); ctx.moveTo(yAxisX, 0); ctx.lineTo(yAxisX, h); ctx.stroke();

  // Achsenbeschriftung (Zahlenwerte an den Gitterlinien)
  ctx.fillStyle = C.label; ctx.font = fnt;
  const lblPad = bf(6); // Abstand vom Rand / von der Achse

  // X-Achsen-Zahlen: center-ausgerichtet über/unter der x-Achse
  // Position: wenn Achse sichtbar → direkt daneben; wenn ausserhalb → am Rand bleiben
  const xLblY_raw = xAxisY + bf(15);
  const xLblY = Math.min(Math.max(xLblY_raw, axisFontSize + 4), h - 4);
  ctx.textAlign = 'center';
  for (let gx = Math.ceil(v.xmin/xStep)*xStep; gx <= v.xmax + xStep*0.01; gx += xStep) {
    if (Math.abs(gx) > xStep * 0.01) {
      const { cx } = toCanvas(gx, 0);
      ctx.fillText(niceNum(gx, true), cx, xLblY);
    }
  }

  // Y-Achsen-Zahlen: rechts der y-Achse wenn Achse links/off-screen-links, sonst links
  const yAxisVisible = yAxisX > 0 && yAxisX < w;
  const yAxisOffLeft  = yAxisX <= 0;   // weit nach rechts bewegt
  const yAxisOffRight = yAxisX >= w;   // weit nach links bewegt
  for (let gy = Math.ceil(v.ymin/yStep)*yStep; gy <= v.ymax + yStep*0.01; gy += yStep) {
    if (Math.abs(gy) > yStep * 0.01) {
      const { cy } = toCanvas(0, gy);
      if (yAxisOffLeft) {
        // Achse links ausserhalb → Labels links im Bild, links-ausgerichtet
        ctx.textAlign = 'left';
        ctx.fillText(niceNum(gy, true), lblPad, cy + 4);
      } else if (yAxisOffRight) {
        // Achse rechts ausserhalb → Labels rechts im Bild, rechts-ausgerichtet
        ctx.textAlign = 'right';
        ctx.fillText(niceNum(gy, true), w - lblPad - 30, cy + 4);
      } else {
        // Achse sichtbar → links der y-Achse, rechts-ausgerichtet
        ctx.textAlign = 'right';
        ctx.fillText(niceNum(gy, true), Math.max(yAxisX - lblPad, lblPad + 20), cy + 4);
      }
    }
  }

  // ── 4. Einheitskreis ──────────────────────────────────────────
  // Zeichnet für jeden unitCirclePts-Eintrag auch die Projektion auf alle
  // sichtbaren sin/cos/tan-Graphen (siehe trigAddFunction() in
  // 06_ui_functions.js für die "aufschalten"-Knöpfe, findNearTrigProjDot()
  // oben für den zugehörigen Hit-Test zum Ziehen direkt auf dem Graphen).
  if (document.getElementById('chk-unitcircle').checked) {
    drawUnitCircle(w, h);
  }

  // ── 5. Asymptoten ─────────────────────────────────────────────
  const _smartAsymp = functions.some((_, i) => activeSpecials.has(`${i}:asymp`));
  if (_smartAsymp) drawAsymptotes(w, h);

  // ── 6. Ober-/Untersummen-Applet UND Flächen-Applet ────────────────
  // Werden VOR den Funktionsgraphen gezeichnet (siehe drawRiemann()/
  // drawFlaeche() oben), damit die Kurve(n) selbst oben drauf sichtbar
  // bleiben.
  if (typeof drawRiemann === 'function') drawRiemann(w, h);
  if (typeof drawFlaeche === 'function') drawFlaeche(w, h);

  // ── 6b. Lineare Optimierung ───────────────────────────────────
  // Planungspolygon + Zielfunktions-Gerade (siehe 17_linopt.js) — unabhängig
  // vom Einheitskreis-Toggle, eigenes Feature mit eigenem Panel.
  if (typeof drawLinOpt === 'function') drawLinOpt();

  // ── 7. Funktionsgraphen ───────────────────────────────────────
  // Abtastanzahl = Canvas-Breite × 2 (ein Punkt pro halben Pixel = sehr glatt)
  const steps = Math.round(w * 2);
  const yRange = v.ymax - v.ymin;
  const yClamp = yRange * 200; // verhindert Canvas int32-Overflow bei grossen Potenzen
  functions.forEach(fn => {
    if (!fn.expr.trim() || fn.visible === false) return;
    // x=N: vertikale gestrichelte Linie
    const _vm = fn.expr.trim().match(/^x\s*=\s*(-?[\d.]+(?:\/[\d.]+)?)$/);
    if (_vm) {
      const _p = _vm[1].split('/');
      const _xv = _p.length===2 ? parseFloat(_p[0])/parseFloat(_p[1]) : parseFloat(_p[0]);
      if (isFinite(_xv)) {
        const {cx:_vcx} = toCanvas(_xv, 0);
        ctx.save();
        ctx.strokeStyle=fn.color; ctx.lineWidth=1.8; ctx.setLineDash([6,4]);
        ctx.beginPath(); ctx.moveTo(_vcx,0); ctx.lineTo(_vcx,h); ctx.stroke();
        ctx.font='11px system-ui'; ctx.fillStyle=fn.color+'dd';
        ctx.textAlign='left'; ctx.textBaseline='top';
        ctx.fillText('x = '+_vm[1], _vcx+4, 6);
        ctx.restore();
      }
      return;
    }
    ctx.strokeStyle = fn.color;
    ctx.lineWidth = bw(fn.dashed ? 1.8 : 2.5);
    ctx.setLineDash(fn.dashed ? [6,4] : []);
    ctx.beginPath();
    let started = false, prevY = null;
    for (let i = 0; i <= steps; i++) {
      const x = v.xmin + (i/steps) * (v.xmax - v.xmin);
      // Definitionsbereich prüfen
      if ((fn.domainMin != null && x < fn.domainMin - 1e-9) ||
          (fn.domainMax != null && x > fn.domainMax + 1e-9)) {
        started = false; prevY = null; continue;
      }
      const y = safeEval(fn.expr, x);
      if (!isFinite(y)) { started = false; prevY = null; continue; } // Lücke (z.B. log(<0))
      // Grosser Sprung → Linie unterbrechen (verhindert senkrechte "Linien" bei Asymptoten)
      if (prevY !== null && Math.abs(y - prevY) > yRange * 5) { started = false; }
      // y-Clamping: sehr grosse Werte begrenzen (int32-Overflow vermeiden)
      const yDraw = y < v.ymin - yClamp ? v.ymin - yClamp : y > v.ymax + yClamp ? v.ymax + yClamp : y;
      const { cx, cy } = toCanvas(x, yDraw);
      if (!started) { ctx.moveTo(cx, cy); started = true; } else { ctx.lineTo(cx, cy); }
      prevY = y;
    }
    ctx.stroke();
    if (fn.dashed) ctx.setLineDash([]);

    // Endpunkt-Marker an den Grenzen des Definitionsbereichs
    if (fn.domainMin != null || fn.domainMax != null) {
      ctx.save();
      [fn.domainMin, fn.domainMax].forEach(bx => {
        if (bx == null) return;
        if (bx < v.xmin - 0.5 || bx > v.xmax + 0.5) return;
        const by = safeEval(fn.expr, bx);
        if (!isFinite(by)) return;
        const { cx: bcx, cy: bcy } = toCanvas(bx, by);
        ctx.beginPath(); ctx.arc(bcx, bcy, bw(4.5), 0, 2*PI);
        ctx.fillStyle = '#fff'; ctx.fill();
        ctx.strokeStyle = fn.color; ctx.lineWidth = bw(2); ctx.stroke();
      });
      ctx.restore();
    }
  });

  // ── 8. Steigungsdreieck ───────────────────────────────────────
  if (document.getElementById('chk-slopetri').checked) drawSlopeTri(w, h);
  // Senkrechte/Mittelsenkrechte-Marker: unabhängig vom Steigungsdreieck-
  // Kontrollkästchen, da eine eigene Konstruktion (siehe drawPerpMarkers()).
  if (typeof drawPerpMarkers === 'function') drawPerpMarkers();
  // Differenzenquotient-Applet: eigene, dedizierte Konstruktion (siehe
  // drawDiffQuot() oben) — unabhängig vom Steigungsdreieck-Kontrollkästchen.
  if (typeof drawDiffQuot === 'function') drawDiffQuot(w, h);

  // ── 9. Funktionsbeschriftungen ────────────────────────────────
  // Wird als HTML-Overlay gerendert (updateFuncLabelsOverlay) — kein Canvas-Text mehr

  // ── 10. Folgen (diskrete Punkte) ─────────────────────────────
  if (typeof drawSequences === 'function') drawSequences(w, h);

  // ── 11. Spezielle Punkte ──────────────────────────────────────
  ctx.font = fnt;
  const lmode = getLabelMode();
  resetLabels(); // Kollisionsrechtecke zurücksetzen
  const drawnPos = []; // bereits gezeichnete Positionen (für Duplikat-Vermeidung)
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  specials.filter(pt => isKindVisible(pt.kind) && isPointActive(pt) && pt.kind !== 'asymp' && pt.kind !== 'pole').forEach(pt => {
    if (pt.x < v.xmin || pt.x > v.xmax || pt.y < v.ymin || pt.y > v.ymax) return;
    const { cx, cy } = toCanvas(pt.x, pt.y);
    const dup = drawnPos.find(d => Math.hypot(d.cx-cx, d.cy-cy) < 8);
    drawSpecialDot(cx, cy, pt.kind, pt.col);
    // Hover: Label anzeigen wenn Maus nahe (30px)
    const nearHover = hoverPt !== null && Math.abs(toCanvas(pt.x, 0).cx - toCanvas(hoverPt, 0).cx) < 30;
    if (!dup) {
      if (lmode === 'all' || (lmode === 'hover' && nearHover)) {
        // pt.exactLabel: bereits fertiges HTML mit echtem Bruchstrich/Wurzel-Überstrich
        // (exakte quadratische Nullstellen, siehe 04_analysis.js) — sonst MathLive-
        // gerenderte Koordinate (Brüche/Wurzeln/π wie im Eingabefeld, kein "--2").
        const lblHtml = pt.exactLabel ||
          (typeof latexToMathLiveHtml === 'function' ? latexToMathLiveHtml(niceCoord(pt.x, pt.y, true)) : null);
        drawLabel(ctx, pt.textLabel || niceCoord(pt.x, pt.y), cx, cy, C.anno, 'r', lblHtml);
      }
      drawnPos.push({ cx, cy });
    }
  });

  // ── 11. Manuelle Punkte ───────────────────────────────────────
  // Immer ziehbar → Drag-Indikator-Ring anzeigen
  points.forEach((pt, i) => {
    if (pt.x < v.xmin || pt.x > v.xmax || pt.y < v.ymin || pt.y > v.ymax) return;
    const { cx, cy } = toCanvas(pt.x, pt.y);
    const isDragThis = drag && drag.type === 'point' && drag.idx === i;

    // Äusserer Ring: Drag-Indikator (grösser beim Ziehen)
    ctx.beginPath(); ctx.arc(cx, cy, isDragThis ? 12 : 10, 0, 2*PI);
    ctx.fillStyle = isDragThis ? pt.color + '22' : 'rgba(0,0,0,0.04)'; ctx.fill();
    ctx.strokeStyle = pt.color + '44'; ctx.lineWidth = 1; ctx.setLineDash([2,2]); ctx.stroke(); ctx.setLineDash([]);

    // Eigentlicher Punkt
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 2*PI); ctx.fillStyle = pt.color; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();

    // Label: immer beim Ziehen, sonst lmode-abhängig; Custom-Label verwenden
    const nearHoverPt = hoverPt !== null && Math.abs(toCanvas(pt.x, 0).cx - toCanvas(hoverPt, 0).cx) < 30 && Math.abs(toCanvas(0, pt.y).cy - toCanvas(0, 0).cy + toCanvas(pt.x, pt.y).cy - toCanvas(pt.x, 0).cy) < 30;
    if (lmode === 'all' || isDragThis || (lmode === 'hover' && nearHoverPt)) {
      const prefixText = pt.label || `P${i+1}`;
      const ptLbl = prefixText + niceCoord(pt.x, pt.y);
      // Präfix ("P1", oder ein Custom-Label des Nutzers) bleibt reiner Text;
      // nur die Koordinate selbst wird MathLive-gerendert (Brüche/Wurzeln/π).
      let lblHtml = null;
      if (typeof latexToMathLiveHtml === 'function') {
        const prefixHtml = typeof _mlEscapeHtml === 'function' ? _mlEscapeHtml(prefixText) : prefixText;
        lblHtml = prefixHtml + latexToMathLiveHtml(niceCoord(pt.x, pt.y, true));
      }
      ctx.fillStyle = C.anno; ctx.font = fnt; ctx.textAlign = 'left';
      drawLabel(ctx, ptLbl, cx, cy, C.anno, 'r', lblHtml);
    }

    // Gestrichelte Verbindungslinien zu allen verknüpften Live-Geraden
    linkedLines.filter(ll => ll.pi1 === i || ll.pi2 === i).forEach(ll => {
      const oi = ll.pi1 === i ? ll.pi2 : ll.pi1; const op = points[oi]; if (!op) return;
      const { cx: ox, cy: oy } = toCanvas(op.x, op.y);
      ctx.strokeStyle = (functions[ll.fi]?.color || '#999') + '55'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ox, oy); ctx.stroke(); ctx.setLineDash([]);
    });
  });

  // Vorschau: welcher Punkt ist als P1 im 2-Punkt-Picking-Modus ausgewählt
  if (line2ptPicking && line2ptPts.length > 0) {
    line2ptPts.forEach((lp, i) => {
      const pt = points[lp.idx]; if (!pt) return;
      const { cx, cy } = toCanvas(pt.x, pt.y);
      ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 2*PI); ctx.strokeStyle = '#378ADD'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = '#1e40af'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left'; ctx.fillText(`P${i+1}`, cx + 14, cy - 4);
    });
  }

  // Fit-Pick-Punkte: nur während aktivem Pick-Modus anzeigen (Vorschau)
  if (typeof fitPickPts !== 'undefined' && fitPickMode && fitPickPts.length > 0) {
    ctx.save();
    fitPickPts.forEach((pt, i) => {
      const { cx, cy } = toCanvas(pt.x, pt.y);
      ctx.setLineDash([3, 3]); ctx.strokeStyle = '#378ADD55'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, toCanvas(pt.x, 0).cy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 2 * PI);
      ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill();
      ctx.strokeStyle = '#378ADD'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, 2 * PI);
      ctx.fillStyle = '#378ADD'; ctx.fill();
      ctx.font = 'bold 11px system-ui,sans-serif';
      ctx.fillStyle = '#1e40af'; ctx.textAlign = 'left';
      ctx.fillText(`P${i + 1} ${niceCoord(pt.x, pt.y)}`, cx + 11, cy - 5);
    });
    ctx.restore();
  }

  // Fit-Punkte aller Funktionen — dauerhaft sichtbar + ziehbar
  functions.forEach((fn, fi) => {
    if (!fn.fitPts || !fn.fitPts.length || fn.visible === false) return;
    ctx.save();
    fn.fitPts.forEach((pt, pi) => {
      const { cx, cy } = toCanvas(pt.x, pt.y);
      // Gestrichelte Linie zur x-Achse
      ctx.setLineDash([3, 3]); ctx.strokeStyle = fn.color + '55'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, toCanvas(pt.x, 0).cy); ctx.stroke();
      ctx.setLineDash([]);
      // Weißer Ring in Funktionsfarbe
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 2 * PI);
      ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill();
      ctx.strokeStyle = fn.color; ctx.lineWidth = 2.5; ctx.stroke();
      // Kleiner Kern
      ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, 2 * PI);
      ctx.fillStyle = fn.color; ctx.fill();
      // Label Pₙ
      ctx.font = 'bold 10px system-ui,sans-serif';
      ctx.fillStyle = fn.color; ctx.textAlign = 'left';
      ctx.fillText(`P${pi + 1}`, cx + 9, cy - 6);
    });
    ctx.restore();
  });

  // ── Exp-Asymptote (dediziert, Knopf im Exp-Panel) ────────────
  if (typeof showExpAsymptote !== 'undefined' && showExpAsymptote &&
      typeof expPanelDef !== 'undefined' && expPanelDef.lastAsymptote !== undefined) {
    const hVal = expPanelDef.lastAsymptote;
    const v2 = isoView || view;
    if (hVal >= v2.ymin - 0.1 && hVal <= v2.ymax + 0.1) {
      const { cy: hy } = toCanvas(0, hVal);
      const col = expPanelDef.lastAsymptoteColor || '#378ADD';
      ctx.save();
      ctx.setLineDash([8, 5]); ctx.strokeStyle = col + 'bb'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(w, hy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '11px system-ui,sans-serif'; ctx.fillStyle = col;
      ctx.textAlign = 'right';
      ctx.fillText(`y = ${niceNum(hVal)}`, w - 6, hy - 5);
      ctx.restore();
    }
  }

  // ── Log-Asymptote (vertikal, Knopf im Log-Panel) ─────────────
  if (typeof showLogAsymptote !== 'undefined' && showLogAsymptote &&
      typeof logPanelDef !== 'undefined' && logPanelDef.lastAsymptote !== undefined) {
    const vVal = logPanelDef.lastAsymptote;
    const v2 = isoView || view;
    if (vVal >= v2.xmin - 0.1 && vVal <= v2.xmax + 0.1) {
      const { cx: vx } = toCanvas(vVal, 0);
      const col = logPanelDef.lastAsymptoteColor || '#378ADD';
      ctx.save();
      ctx.setLineDash([8, 5]); ctx.strokeStyle = col + 'bb'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(vx, 0); ctx.lineTo(vx, h); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '11px system-ui,sans-serif'; ctx.fillStyle = col;
      ctx.textAlign = 'left';
      ctx.fillText(`x = ${niceNum(vVal)}`, vx + 4, 14);
      ctx.restore();
    }
  }

  // ── 12. Graph-Punkte ──────────────────────────────────────────
  drawGraphPoints();

  // ── 13. Hover-Linie ───────────────────────────────────────────
  // Nur wenn Maus über Canvas, kein Drag aktiv und kein Pointer-Modus
  if (hoverPt !== null && !drag && !pointerMode) {
    const { cx: hcx } = toCanvas(hoverPt, 0);
    // Vertikale gestrichelte Linie an Mausposition
    ctx.setLineDash([4,4]); ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(hcx, 0); ctx.lineTo(hcx, h); ctx.stroke(); ctx.setLineDash([]);

    // Textanzeige: x-Wert + alle f(x)-Werte
    const lines = [`x = ${niceNumDec(hoverPt)}`];
    functions.forEach((fn, i) => {
      if (!fn.expr.trim() || fn.visible === false) return;
      const y = safeEval(fn.expr, hoverPt);
      if (isFinite(y)) lines.push(`f${functions.length > 1 ? i+1 : ''}(x) = ${niceNumDec(y)}`);
    });
    // Links oder rechts positionieren je nach Mausposition
    const lx = hcx + 10 > w - 160 ? hcx - 10 : hcx + 10;
    ctx.textAlign = hcx + 10 > w - 160 ? 'right' : 'left'; ctx.font = fnt; ctx.fillStyle = C.anno;
    lines.forEach((t, i) => ctx.fillText(t, lx, 20 + i*16));

    // Kleine farbige Punkte wo die Funktionen die Hover-Linie schneiden
    functions.forEach(fn => {
      if (!fn.expr.trim() || fn.visible === false) return;
      const y = safeEval(fn.expr, hoverPt); if (!isFinite(y)) return;
      const { cx, cy } = toCanvas(hoverPt, y);
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2*PI); ctx.fillStyle = fn.color; ctx.fill();
    });
  }

  // ── 14. Laserpointer ────────────────────────────────────────────
  if (pointerMode && pointerPos) {
    const px = pointerPos.x, py = pointerPos.y;
    ctx.save();
    // Mittlerer Ring
    ctx.beginPath();
    ctx.arc(px, py, 13, 0, 2 * PI);
    ctx.strokeStyle = 'rgba(255, 30, 30, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Innerer Leuchtpunkt
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, 2 * PI);
    ctx.fillStyle = 'rgba(255, 30, 30, 0.95)';
    ctx.shadowColor = '#ff2020';
    ctx.shadowBlur = 18;
    ctx.fill();
    // Kleiner heller Kern (Highlight)
    ctx.beginPath();
    ctx.arc(px - 2, py - 2, 2.5, 0, 2 * PI);
    ctx.fillStyle = 'rgba(255, 200, 200, 0.9)';
    ctx.shadowBlur = 0;
    ctx.fill();
    ctx.restore();
  }
}

