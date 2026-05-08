// ═══════════════════════════════════════════════════════════════════
// MODUL: draw — Alle Zeichenfunktionen & Haupt-draw()-Loop
// Enthält:  draw(), drawGrid(), drawFunctions(), drawSpecials()
//           drawAsymptotes(), drawSlopeTri(), drawUnitCircle()
//           drawGraphPoints(), renderMathText(), drawFuncLabels()
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
// Mittelpunkt liegt bei (-1, 0) damit cos(x)-Graph direkt ausgerichtet ist:
// Der Punkt auf dem Kreis bei Winkel a hat x-Koordinate cosA-1, y-Koordinate sinA.
// Auf dem cos-Graphen liegt der Punkt bei (a, cosA) → senkrechte Verbindungslinie.
// Für sin(x) bleibt die waagrechte Verbindung korrekt (sinA = y-Wert).
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
  const v = isoView || view;
  const steps = 1200, dx = (v.xmax - v.xmin) / steps;
  ctx.save(); ctx.setLineDash([6,4]); ctx.lineWidth = 1.2;
  functions.forEach(fn => {
    if (!fn.expr.trim() || fn.visible === false) return;
    ctx.strokeStyle = fn.color + '99';
    let prevY = null, prevX = null;
    // Erkannte Pol-Positionen (exakt per Bisektion verfeinert)
    const poles = [];
    const MERGE_DIST = (v.xmax - v.xmin) / 50; // zwei Kandidaten innerhalb dieses Abstands = selber Pol

    const addPole = (lo, hi) => {
      // Kandidaten-x = Mitte; verfeinern per Bisektion auf den Pol
      let ax = (lo + hi) / 2;
      // Prüfe ob lo/hi wirklich ein Pol ist (Vorzeichenwechsel ins Unendliche)
      // Verfeinere auf 20 Iterationen
      for (let it = 0; it < 20; it++) {
        const m = (lo + hi) / 2;
        const ym = safeEval(fn.expr, m);
        if (!isFinite(ym)) { hi = m; } else { lo = m; }
        ax = (lo + hi) / 2;
      }
      // Mergen: Pol nur hinzufügen wenn kein bereits gefundener Pol zu nahe
      if (!poles.some(p => Math.abs(p - ax) < MERGE_DIST)) {
        poles.push(ax);
        const { cx } = toCanvas(ax, 0);
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
      }
    };

    for (let s = 0; s <= steps; s++) {
      const x = v.xmin + s * dx, y = safeEval(fn.expr, x);
      if (prevY !== null && prevX !== null) {
        // Übergang endlich → unendlich
        if (isFinite(prevY) && !isFinite(y)) {
          addPole(prevX, x);
        }
        // Grosser Sprung mit Vorzeichenwechsel → Pol
        else if (isFinite(prevY) && isFinite(y) &&
                 Math.abs(y - prevY) > (v.ymax - v.ymin) * 6 &&
                 Math.sign(y) !== Math.sign(prevY)) {
          addPole(prevX, x);
        }
      }
      prevY = isFinite(y) ? y : null; prevX = x;
    }

    // ── Horizontale Asymptoten: Grenzwert für x→+∞ und x→-∞ ──────────
    // Werte an sehr grossen x (weit ausserhalb des sichtbaren Bereichs)
    const BIG = 1e6;
    const yPlusInf  = [safeEval(fn.expr, BIG),   safeEval(fn.expr, BIG*0.9),   safeEval(fn.expr, BIG*0.8)];
    const yMinusInf = [safeEval(fn.expr, -BIG),  safeEval(fn.expr, -BIG*0.9),  safeEval(fn.expr, -BIG*0.8)];
    const allFinP = yPlusInf.every(isFinite), allFinM = yMinusInf.every(isFinite);
    const hAsyms = [];
    // Konvergenz prüfen: alle drei Werte müssen nahe beieinander sein
    if (allFinP && Math.max(...yPlusInf) - Math.min(...yPlusInf) < 1e-3) {
      const haVal = yPlusInf[0];
      // Nur zeichnen wenn innerhalb des sichtbaren y-Bereichs
      if (haVal > v.ymin - 0.1 && haVal < v.ymax + 0.1) {
        // Vermeiden: Asymptote bei y=0 wenn es einfach die x-Achse ist
        const notXAxis = !isLinearFunc(fn.expr) || Math.abs(haVal) > 1e-4;
        if (notXAxis && !hAsyms.some(a => Math.abs(a - haVal) < 0.01)) hAsyms.push(haVal);
      }
    }
    if (allFinM && Math.max(...yMinusInf) - Math.min(...yMinusInf) < 1e-3) {
      const haVal = yMinusInf[0];
      if (haVal > v.ymin - 0.1 && haVal < v.ymax + 0.1) {
        const notXAxis = !isLinearFunc(fn.expr) || Math.abs(haVal) > 1e-4;
        if (notXAxis && !hAsyms.some(a => Math.abs(a - haVal) < 0.01)) hAsyms.push(haVal);
      }
    }
    hAsyms.forEach(haVal => {
      const { cy: hy } = toCanvas(0, haVal);
      ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(w, hy); ctx.stroke();
    });
  });
  ctx.restore();
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

    // ── Priorität 2: Standard-Dreieck Δx=1 im sichtbaren Bereich ──────
    // Standard: Δx = 1 (zeigt direkt die Steigung: Δy = m)
    const triW = 1;
    const xRange = v.xmax - v.xmin;
    // Platziere Dreieck im unteren Drittel des sichtbaren x-Bereichs
    let testX = v.xmin + xRange * 0.15;
    // Korrektur: sicherstellen dass das Dreieck im View liegt
    if (testX + triW > v.xmax - xRange*0.05) testX = v.xmax - xRange*0.15 - triW;
    if (testX < v.xmin + xRange*0.05) testX = v.xmin + xRange*0.05;

    const y0 = safeEval(fn.expr, testX), y1 = safeEval(fn.expr, testX + triW);
    if (!isFinite(y0) || !isFinite(y1)) return;
    // Beide Punkte müssen im sichtbaren y-Bereich liegen
    const ypad = (v.ymax - v.ymin) * 0.15;
    if (y0 < v.ymin - ypad || y0 > v.ymax + ypad || y1 < v.ymin - ypad || y1 > v.ymax + ypad) {
      // Versuch: Dreieck in der Mitte
      testX = (v.xmin + v.xmax) / 2 - 0.5;
      const y0b = safeEval(fn.expr, testX), y1b = safeEval(fn.expr, testX + triW);
      if (!isFinite(y0b) || !isFinite(y1b)) return;
      if (y0b < v.ymin - ypad || y0b > v.ymax + ypad || y1b < v.ymin - ypad || y1b > v.ymax + ypad) return;
      drawTriBetween(fn, testX, testX + triW);
      return;
    }
    drawTriBetween(fn, testX, testX + triW);
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
//   - sin/cos-Projektionslinien
//   - cos-Punkt auf x-Achse (grün), sin-Punkt auf y-Achse (orange)
//   - Gestrichelte Verbindungslinien zu allen sichtbaren Graphen
//     (Winkel a auf x-Achse, f(a) auf y-Achse)
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

    // Horizontale Projektionslinie: Punkt → y-Achse (zeigt cosA+(-1) = x-Koordinate relativ zu Mitte)
    ctx.strokeStyle = '#1D9E7555'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox, py); ctx.lineTo(px, py); ctx.stroke();
    ctx.setLineDash([]);

    // sin-Marker auf y-Achse (x=0) als orange Punkt bei (0, sinA)
    const { cx: yAxisX } = toCanvas(0, 0);
    const { cy: sinYc } = toCanvas(0, sinA);
    ctx.beginPath(); ctx.arc(yAxisX, sinYc, 4, 0, 2*PI); ctx.fillStyle = '#D85A30'; ctx.fill();

    // cos-Marker: cosA liegt auf x-Achse bei x=cosA-1 (relativ zum Mittelpunkt),
    // aber auf dem Graph bei y=cosA → Marker auf y-Achse bei (0, cosA)
    const { cy: cosYc } = toCanvas(0, cosA);
    ctx.beginPath(); ctx.arc(yAxisX, cosYc, 4, 0, 2*PI);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.strokeStyle = '#1D9E75'; ctx.lineWidth = 1.5; ctx.stroke();

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

    // Projektion auf alle sichtbaren Graphen
    // Typ-Erkennung via Ausdrucks-Pattern statt Wert-Vergleich (zuverlässiger):
    //   sin-artig: Ausdruck enthält sin( ohne cos/tan dominierend
    //   cos-artig: Ausdruck enthält cos( ohne sin/tan dominierend
    //   tan-artig: Ausdruck enthält tan(
    // Für sin: x_graph = a,       Verbindung waagrecht von y-Achse
    // Für cos: x_graph = a - π/2, Verbindung waagrecht von y-Achse (selbe Höhe da cos(a-π/2)=sin(a))
    // Für tan: geometrische Tangentenkonstruktion
    functions.forEach(fn => {
      if (!fn.expr.trim() || fn.visible === false) return;

      const expr = fn.expr.trim();
      const hasSin = /\bsin\s*\(/.test(expr);
      const hasCos = /\bcos\s*\(/.test(expr);
      const hasTan = /\btan\s*\(/.test(expr);

      // Typ bestimmen: primäre Trigo-Funktion
      const isSinLike = hasSin && !hasCos && !hasTan;
      const isCosLike = hasCos && !hasSin && !hasTan;
      const isTanLike = hasTan && !hasSin && !hasCos;

      const tanA = sinA / cosA;
      const { cx: yAx } = toCanvas(0, 0); // x-Position der y-Achse auf Canvas

      if (isSinLike) {
        // sin: x_graph = a, waagrecht von sin-Marker (y-Achse) → Graph
        const xG = a, yG = safeEval(fn.expr, xG);
        if (!isFinite(yG) || xG < v.xmin || xG > v.xmax || yG < v.ymin || yG > v.ymax) return;
        const { cx: gx, cy: gy } = toCanvas(xG, yG);
        ctx.setLineDash([4,3]); ctx.strokeStyle = fn.color + '88'; ctx.lineWidth = 1.2;
        const { cy: sinYc2 } = toCanvas(0, sinA);
        ctx.beginPath(); ctx.moveTo(yAx, sinYc2); ctx.lineTo(gx, gy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(gx, gy, 6, 0, 2*PI); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
        ctx.strokeStyle = fn.color; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(gx, gy, 2.5, 0, 2*PI); ctx.fillStyle = fn.color; ctx.fill();

      } else if (isCosLike) {
        // cos: x_graph = a - π/2, y = cos(a - π/2) = sin(a)
        // Verbindung waagrecht vom sin-Marker (gleiche Höhe = sinA)
        const xG = a - PI/2, yG = safeEval(fn.expr, xG);
        if (!isFinite(yG) || xG < v.xmin || xG > v.xmax || yG < v.ymin || yG > v.ymax) return;
        const { cx: gx, cy: gy } = toCanvas(xG, yG);
        ctx.setLineDash([4,3]); ctx.strokeStyle = fn.color + '88'; ctx.lineWidth = 1.2;
        const { cy: sinYcCos } = toCanvas(0, sinA); // sinA = cos(a-π/2) → selbe Höhe
        ctx.beginPath(); ctx.moveTo(yAx, sinYcCos); ctx.lineTo(gx, gy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(gx, gy, 6, 0, 2*PI); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
        ctx.strokeStyle = fn.color; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(gx, gy, 2.5, 0, 2*PI); ctx.fillStyle = fn.color; ctx.fill();

      } else if (isTanLike) {
        const yAtA = safeEval(fn.expr, a);
        if (Math.abs(cosA) < 0.01) return; // nahe an Pol
        if (!isFinite(tanA) || tanA < v.ymin || tanA > v.ymax) return;
        const { cy: tanYc } = toCanvas(0, tanA);
        // Gerade: Kreismittelpunkt → Kreispunkt → y-Achse (verlängert)
        ctx.setLineDash([4,3]); ctx.strokeStyle = fn.color + '88'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(px, py); ctx.lineTo(yAx, tanYc); ctx.stroke();
        ctx.setLineDash([]);
        // Marker auf y-Achse
        ctx.beginPath(); ctx.arc(yAx, tanYc, 4, 0, 2*PI);
        ctx.fillStyle = '#fff'; ctx.fill();
        ctx.strokeStyle = fn.color; ctx.lineWidth = 1.5; ctx.stroke();
        // Waagrechte Linie von y-Achse zum Graphpunkt
        const xG = a, yG = yAtA;
        if (!isFinite(yG) || xG < v.xmin || xG > v.xmax || yG < v.ymin || yG > v.ymax) return;
        const { cx: gx, cy: gy } = toCanvas(xG, yG);
        ctx.setLineDash([4,3]); ctx.strokeStyle = fn.color + '88'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(yAx, tanYc); ctx.lineTo(gx, gy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(gx, gy, 6, 0, 2*PI); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
        ctx.strokeStyle = fn.color; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(gx, gy, 2.5, 0, 2*PI); ctx.fillStyle = fn.color; ctx.fill();

      } else {
        // Andere: senkrecht von x-Achse → Graphpunkt
        const xG = a, yG = safeEval(fn.expr, xG);
        if (!isFinite(yG) || xG < v.xmin || xG > v.xmax || yG < v.ymin || yG > v.ymax) return;
        const { cx: gx, cy: gy } = toCanvas(xG, yG);
        ctx.setLineDash([4,3]); ctx.strokeStyle = fn.color + '88'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(gx, oy); ctx.lineTo(gx, gy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(gx, gy, 6, 0, 2*PI); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
        ctx.strokeStyle = fn.color; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(gx, gy, 2.5, 0, 2*PI); ctx.fillStyle = fn.color; ctx.fill();
      }
    });
  });
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════
// MATHE-TEXT CANVAS RENDERING (Superscript für ^, Subscript für _)
// ═══════════════════════════════════════════════════════════════════

// Zeichnet Text auf Canvas mit Superscript (^n) und Bruch-Rendering ((a)/(b)).
// Gibt die Gesamtbreite zurück.
function drawMathLabel(ctx, text, x, y, color) {
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  const baseFont = ctx.font;

  // ── Schritt 1: Text in Segmente aufteilen: normal, hochgestellt, Bruch ──
  // Zuerst Brüche (a)/(b) erkennen, dann ^{...} / ^n
  const segs = [];
  const fracRe = /\(([^()]*)\)\/\(([^()]*)\)/;

  function parseSupSeg(raw) {
    // Teile in normale und hochgestellte Teile auf
    const re = /\^(\{[^}]*\}|[^\s\+\-\*·()\^]+)/;
    let rest = raw, m;
    while ((m = re.exec(rest)) !== null) {
      if (m.index > 0) segs.push({ type: 'text', s: rest.slice(0, m.index) });
      const supText = m[1].startsWith('{') ? m[1].slice(1, -1) : m[1];
      segs.push({ type: 'sup', s: supText });
      rest = rest.slice(m.index + m[0].length);
    }
    if (rest) segs.push({ type: 'text', s: rest });
  }

  let rest = text, m;
  while ((m = fracRe.exec(rest)) !== null) {
    if (m.index > 0) parseSupSeg(rest.slice(0, m.index));
    segs.push({ type: 'frac', num: m[1], den: m[2] });
    rest = rest.slice(m.index + m[0].length);
  }
  if (rest) parseSupSeg(rest);

  // ── Schritt 2: Segmente zeichnen ──
  let cx = x;
  segs.forEach(seg => {
    if (seg.type === 'frac') {
      // Bruch: Zähler oben, Linie, Nenner unten — kleiner Font
      ctx.font = 'bold 9px system-ui,sans-serif';
      const nw = ctx.measureText(seg.num).width;
      const dw = ctx.measureText(seg.den).width;
      const fw = Math.max(nw, dw) + 4;
      ctx.fillStyle = color;
      ctx.fillText(seg.num, cx + (fw - nw) / 2, y - 3);  // Zähler
      ctx.fillRect(cx, y, fw, 1);                          // Bruchlinie
      ctx.fillText(seg.den, cx + (fw - dw) / 2, y + 9);   // Nenner
      ctx.font = baseFont;
      cx += fw + 2;
    } else if (seg.type === 'sup') {
      ctx.font = `bold 8px system-ui,sans-serif`;
      ctx.fillStyle = color;
      ctx.fillText(seg.s, cx, y - 5);
      cx += ctx.measureText(seg.s).width + 1;
      ctx.font = baseFont;
    } else {
      ctx.font = baseFont;
      ctx.fillStyle = color;
      ctx.fillText(seg.s, cx, y);
      cx += ctx.measureText(seg.s).width;
    }
  });
  return cx - x;
}

// Misst die Breite eines Math-Labels (ohne zu zeichnen) — für Hintergrundrechtecke.
function measureMathLabel(ctx, text) {
  const baseFont = ctx.font;
  const fracRe = /\(([^()]*)\)\/\(([^()]*)\)/g;
  let width = 0, last = 0, m;
  while ((m = fracRe.exec(text)) !== null) {
    // Text vor dem Bruch
    width += ctx.measureText(text.slice(last, m.index)).width;
    // Bruchbreite (kleiner Font)
    ctx.font = 'bold 9px system-ui,sans-serif';
    const fw = Math.max(ctx.measureText(m[1]).width, ctx.measureText(m[2]).width) + 6;
    ctx.font = baseFont;
    width += fw;
    last = m.index + m[0].length;
  }
  width += ctx.measureText(text.slice(last)).width;
  return width;
}

// ═══════════════════════════════════════════════════════════════════
// FUNKTIONSBESCHRIFTUNGEN IM PLOT
// ═══════════════════════════════════════════════════════════════════

// Zeichnet Labels direkt auf die Graphen im Plot.
// Algorithmus: Sucht eine "gute" Position im rechten Drittel des Views
// (weit weg von anderen Graphen, nicht am Rand).
// Anpassen: xc = v.xmin + (0.1 + ...) für Labels weiter links
function drawFuncLabels(w, h) {
  if (!document.getElementById('chk-funclabels').checked) return;
  const v = isoView || view;
  ctx.font = 'bold 12px system-ui,sans-serif';
  functions.forEach((fn, i) => {
    if (!fn.expr.trim() || fn.visible === false) return;

    // Beste Position finden: 15 Kandidaten im rechten Bereich des Views
    let bestX = null, bestY = null, bestScore = -Infinity;
    for (let c = 0; c < 15; c++) {
      const xc = v.xmin + (0.55 + 0.38 * c/14) * (v.xmax - v.xmin);
      const yc = safeEval(fn.expr, xc);
      if (!isFinite(yc) || yc <= v.ymin || yc >= v.ymax) continue;
      // Score: Abstand von anderen Graphen belohnen, Randnähe bestrafen
      let score = 0;
      functions.forEach((f2, j) => {
        if (j === i || !f2.expr.trim()) return;
        const y2 = safeEval(f2.expr, xc);
        if (isFinite(y2)) score -= 10 / (Math.abs(yc - y2) + 0.3);
      });
      if (yc < v.ymin + 0.15*(v.ymax-v.ymin) || yc > v.ymax - 0.15*(v.ymax-v.ymin)) score -= 5;
      if (score > bestScore) { bestScore = score; bestX = xc; bestY = yc; }
    }
    if (bestX === null) return;

    const { cx, cy } = toCanvas(bestX, bestY);
    // Label-Text: bei Live-Geraden die aktuelle Formel anzeigen
    const ll = linkedLines.find(l => l.fi === i);
    let rawExpr;
    if (ll) { const res = computeLinkedLine(ll); rawExpr = res ? res.label : fn.expr; }
    else rawExpr = fn.expr.length > 18 ? fn.expr.slice(0,16)+'…' : fn.expr;

    // Schönere Darstellung: * → ·, ^n → hochgestellt per Superscript-Rendering
    const labelPrefix = `f${subDigit(i+1)}(x)=`;
    const labelExpr = rawExpr.replace(/\*/g, '·');

    // Messe Gesamtbreite für Hintergrundrechteck (berücksichtigt Brüche)
    const fullLabel = labelPrefix + labelExpr;
    const hasFrac = /\([^()]*\)\/\([^()]*\)/.test(fullLabel);
    const tw = measureMathLabel(ctx, fullLabel);
    const rectH = hasFrac ? 26 : 20;
    const rectTop = hasFrac ? cy - 18 : cy - 15;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.beginPath(); ctx.roundRect(cx + 4, rectTop, tw + 10, rectH, 4); ctx.fill();
    ctx.strokeStyle = fn.color + (ll ? 'cc' : '44'); ctx.lineWidth = ll ? 1.5 : 1; ctx.stroke();

    // Text mit Superscript- und Bruch-Rendering
    drawMathLabel(ctx, fullLabel, cx + 9, cy, fn.color);
    ctx.restore();
  });
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

// Zeichnet ein Label mit automatischer Kollisionsvermeidung
function drawLabel(ctx, text, cx, cy, col, dir = 'r') {
  ctx.fillStyle = col || C.anno;
  const p = placeLabel(ctx, text, cx, cy, dir);
  ctx.fillText(text, p.x, p.y);
}

// Zeichnet einen speziellen Punkt (Extremum, Nullstelle, Wendepunkt, Schnittpunkt)
// in der entsprechenden Farbe und Form.
function drawSpecialDot(cx, cy, kind, col) {
  if (kind === 'max') { // Hochpunkt: gefüllter roter Kreis
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 2*PI); ctx.fillStyle = '#e24b4a'; ctx.fill();
  } else if (kind === 'min') { // Tiefpunkt: gefüllter grüner Kreis
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 2*PI); ctx.fillStyle = '#1D9E75'; ctx.fill();
  } else if (kind === 'inf') { // Wendepunkt: lila Dreieck
    ctx.beginPath(); ctx.moveTo(cx, cy-6); ctx.lineTo(cx+5, cy+4); ctx.lineTo(cx-5, cy+4); ctx.closePath(); ctx.fillStyle = '#7F77DD'; ctx.fill();
  } else { // Nullstelle / y-Achse / Schnittpunkt: offener Kreis in Funktionsfarbe
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 2*PI); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.strokeStyle = kind === 'yaxis' ? '#BD10E0' : col; ctx.lineWidth = 2; ctx.stroke();
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
  const fnt = '12px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif';

  // ── 1. Hintergrund ────────────────────────────────────────────
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
  ctx.font = fnt;

  // ── 2. Gitternetz ─────────────────────────────────────────────
  ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.setLineDash([]);
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
  ctx.strokeStyle = C.axis; ctx.lineWidth = 2; ctx.setLineDash([]);
  const o = toCanvas(0, 0);
  // x-Achse: bei y=0, aber immer im sichtbaren Bereich (oben/unten eingeklemmt)
  const xAxisY = Math.min(Math.max(o.cy, 0), h);
  ctx.beginPath(); ctx.moveTo(0, xAxisY); ctx.lineTo(w, xAxisY); ctx.stroke();
  // y-Achse: bei x=0, ebenfalls eingeklemmt
  const yAxisX = Math.min(Math.max(o.cx, 0), w);
  ctx.beginPath(); ctx.moveTo(yAxisX, 0); ctx.lineTo(yAxisX, h); ctx.stroke();

  // Achsenbeschriftung (Zahlenwerte an den Gitterlinien)
  ctx.fillStyle = C.label; ctx.font = fnt;
  ctx.textAlign = 'center';
  for (let gx = Math.ceil(v.xmin/xStep)*xStep; gx <= v.xmax + xStep*0.01; gx += xStep) {
    if (Math.abs(gx) > xStep * 0.01) { // Ursprung überspringen (dort steht "0" auf y-Achse)
      const { cx } = toCanvas(gx, 0);
      ctx.fillText(niceNum(gx, true), cx, Math.min(Math.max(xAxisY + 15, 15), h - 3));
    }
  }
  ctx.textAlign = 'right';
  for (let gy = Math.ceil(v.ymin/yStep)*yStep; gy <= v.ymax + yStep*0.01; gy += yStep) {
    if (Math.abs(gy) > yStep * 0.01) {
      const { cy } = toCanvas(0, gy);
      ctx.fillText(niceNum(gy, true), Math.min(Math.max(yAxisX - 6, 6), w - 6), cy + 4);
    }
  }

  // ── 4. Einheitskreis ──────────────────────────────────────────
  if (document.getElementById('chk-unitcircle').checked) drawUnitCircle(w, h);

  // ── 5. Asymptoten ─────────────────────────────────────────────
  if (document.getElementById('chk-asymptotes').checked) drawAsymptotes(w, h);

  // ── 6. Fläche ─────────────────────────────────────────────────
  if (showArea) {
    const f1v = document.getElementById('area-f1').value, f2v = document.getElementById('area-f2').value;
    const x1 = parseFloat(document.getElementById('area-x1').value), x2 = parseFloat(document.getElementById('area-x2').value);
    if (!isNaN(x1) && !isNaN(x2) && x1 < x2) {
      const e1 = getAreaExpr(f1v), e2 = getAreaExpr(f2v), fi = f1v === '__axis' ? -1 : parseInt(f1v);
      const aCol = fi >= 0 ? AREA_ALPHAS[fi % AREA_ALPHAS.length] : 'rgba(186,117,23,0.15)';
      const steps = Math.round(w * 2), xs = [], y1s = [], y2s = [];
      for (let i = 0; i <= steps; i++) {
        const x = x1 + (i/steps) * (x2-x1), ya = safeEval(e1, x), yb = safeEval(e2, x);
        if (isFinite(ya) && isFinite(yb)) { xs.push(x); y1s.push(ya); y2s.push(yb); }
      }
      if (xs.length > 1) {
        // Fläche als geschlossener Pfad (oben: f1, unten zurück: f2)
        ctx.beginPath();
        xs.forEach((x, i) => { const { cx, cy } = toCanvas(x, y1s[i]); i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy); });
        for (let i = xs.length-1; i >= 0; i--) { const { cx, cy } = toCanvas(xs[i], y2s[i]); ctx.lineTo(cx, cy); }
        ctx.closePath(); ctx.fillStyle = aCol; ctx.fill();
        // Gestrichelte Grenzen bei x1 und x2
        const edgeCol = fi >= 0 ? functions[fi].color + '88' : '#BA751788';
        ctx.strokeStyle = edgeCol; ctx.lineWidth = 1; ctx.setLineDash([5,4]);
        const { cx: lx1 } = toCanvas(x1, 0), { cx: lx2 } = toCanvas(x2, 0);
        ctx.beginPath(); ctx.moveTo(lx1, 0); ctx.lineTo(lx1, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(lx2, 0); ctx.lineTo(lx2, h); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  // ── 7. Funktionsgraphen ───────────────────────────────────────
  // Abtastanzahl = Canvas-Breite × 2 (ein Punkt pro halben Pixel = sehr glatt)
  const steps = Math.round(w * 2);
  const yRange = v.ymax - v.ymin;
  const yClamp = yRange * 200; // verhindert Canvas int32-Overflow bei grossen Potenzen
  functions.forEach(fn => {
    if (!fn.expr.trim() || fn.visible === false) return;
    ctx.strokeStyle = fn.color; ctx.lineWidth = 2.5; ctx.setLineDash([]);
    ctx.beginPath();
    let started = false, prevY = null;
    for (let i = 0; i <= steps; i++) {
      const x = v.xmin + (i/steps) * (v.xmax - v.xmin), y = safeEval(fn.expr, x);
      if (!isFinite(y)) { started = false; prevY = null; continue; } // Lücke (z.B. log(<0))
      // Grosser Sprung → Linie unterbrechen (verhindert senkrechte "Linien" bei Asymptoten)
      if (prevY !== null && Math.abs(y - prevY) > yRange * 5) { started = false; }
      // y-Clamping: sehr grosse Werte auf sicheren Bereich begrenzen (int32-Overflow vermeiden)
      const yDraw = y < v.ymin - yClamp ? v.ymin - yClamp : y > v.ymax + yClamp ? v.ymax + yClamp : y;
      const { cx, cy } = toCanvas(x, yDraw);
      if (!started) { ctx.moveTo(cx, cy); started = true; } else { ctx.lineTo(cx, cy); }
      prevY = y;
    }
    ctx.stroke();
  });

  // ── 8. Steigungsdreieck ───────────────────────────────────────
  if (document.getElementById('chk-slopetri').checked) drawSlopeTri(w, h);

  // ── 9. Funktionsbeschriftungen ────────────────────────────────
  drawFuncLabels(w, h);

  // ── 10. Spezielle Punkte ──────────────────────────────────────
  ctx.font = fnt;
  const lmode = getLabelMode();
  resetLabels(); // Kollisionsrechtecke zurücksetzen
  const drawnPos = []; // bereits gezeichnete Positionen (für Duplikat-Vermeidung)
  specials.filter(pt => isKindVisible(pt.kind)).forEach(pt => {
    if (pt.x < v.xmin || pt.x > v.xmax || pt.y < v.ymin || pt.y > v.ymax) return;
    const { cx, cy } = toCanvas(pt.x, pt.y);
    const dup = drawnPos.find(d => Math.hypot(d.cx-cx, d.cy-cy) < 8);
    drawSpecialDot(cx, cy, pt.kind, pt.col);
    // Hover: Label anzeigen wenn Maus nahe (30px)
    const nearHover = hoverPt !== null && Math.abs(toCanvas(pt.x, 0).cx - toCanvas(hoverPt, 0).cx) < 30;
    if (!dup) {
      if (lmode === 'all' || (lmode === 'hover' && nearHover)) {
        drawLabel(ctx, niceCoord(pt.x, pt.y), cx, cy, C.anno, 'r');
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
      const ptLbl = (pt.label || `P${i+1}`) + niceCoord(pt.x, pt.y);
      ctx.fillStyle = C.anno; ctx.font = fnt; ctx.textAlign = 'left';
      drawLabel(ctx, ptLbl, cx, cy, C.anno, 'r');
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
  // Nur wenn Maus über Canvas und kein Drag aktiv
  if (hoverPt !== null && !drag) {
    const { cx: hcx } = toCanvas(hoverPt, 0);
    // Vertikale gestrichelte Linie an Mausposition
    ctx.setLineDash([4,4]); ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(hcx, 0); ctx.lineTo(hcx, h); ctx.stroke(); ctx.setLineDash([]);

    // Textanzeige: x-Wert + alle f(x)-Werte
    const lines = [`x = ${niceNum(hoverPt)}`];
    functions.forEach((fn, i) => {
      if (!fn.expr.trim() || fn.visible === false) return;
      const y = safeEval(fn.expr, hoverPt);
      if (isFinite(y)) lines.push(`f${functions.length > 1 ? i+1 : ''}(x) = ${niceNum(y)}`);
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
}

