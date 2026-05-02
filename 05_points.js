// ═══════════════════════════════════════════════════════════════════
// MODUL: points — Freie Punkte, Live-Geraden, Gerade durch 2 Punkte
// Enthält:  addPointManual(), renderPointList()
//           line2ptToggle(), updateLiveLine()
// Ändern:  Punkt-Farben → POINT_COLORS[]
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// PUNKTE (freie Punkte, immer ziehbar)
// ═══════════════════════════════════════════════════════════════════

// Snap zu nächstem Gitterpunkt wenn Snapping aktiv
function snapToGrid(x, y) {
  if (!document.getElementById('chk-gridsnap').checked) return { x, y };
  const v = isoView || view;
  const xs = gridStep(v.xmax - v.xmin), ys = gridStep(v.ymax - v.ymin);
  return { x: Math.round(x / xs) * xs, y: Math.round(y / ys) * ys };
}

// Hilfsfunktion: Subscript-Zahl als Unicode-Zeichen
function subDigit(n) {
  const subs = '₀₁₂₃₄₅₆₇₈₉';
  return String(n).split('').map(c => subs[c] || c).join('');
}

// Fügt einen neuen freien Punkt hinzu. Gibt den neuen Index zurück.
// Punkte bekommen automatisch Farben aus POINT_COLORS und ein Standard-Label.
function addPointAt(x, y) {
  const snapped = snapToGrid(x, y);
  const idx = points.length;
  const label = `P${subDigit(idx + 1)}`;
  points.push({ x: snapped.x, y: snapped.y, color: POINT_COLORS[idx % POINT_COLORS.length], label });
  renderPointList();
  scheduleDraw();
  return points.length - 1; // Index des neuen Punktes
}

// Punkt aus den Sidebar-Eingabefeldern hinzufügen
function addPointManual() {
  addPointAt(parseFloat(document.getElementById('new-px').value) || 0,
             parseFloat(document.getElementById('new-py').value) || 0);
}

// Rendert die Punkt-Liste in der Sidebar (mit editierbarem Label)
function renderPointList() {
  const el = document.getElementById('point-list'); el.innerHTML = '';
  points.forEach((pt, i) => {
    if (!pt.label) pt.label = `P${i+1}`;
    const row = document.createElement('div'); row.className = 'sp-row'; row.style.alignItems = 'center';
    const dot = document.createElement('div'); dot.className = 'dot'; dot.style.background = pt.color; dot.style.marginTop = '2px'; dot.style.flexShrink = '0';

    // Editierbares Label-Feld
    const nameInp = document.createElement('input'); nameInp.type = 'text';
    nameInp.value = pt.label;
    nameInp.style.cssText = 'width:36px;font-size:11px;padding:1px 4px;border:1px solid var(--border-input);border-radius:4px;background:var(--bg-input);color:var(--text);';
    nameInp.title = 'Name des Punktes';
    nameInp.oninput = e => { points[i].label = e.target.value || `P${i+1}`; scheduleDraw(); };

    const coord = document.createElement('span'); coord.style.cssText = 'flex:1;font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    coord.textContent = niceCoord(pt.x, pt.y);
    const del = document.createElement('button'); del.className = 'del-btn'; del.textContent = '✕';
    del.onclick = () => deletePoint(i);
    row.append(dot, nameInp, coord, del); el.appendChild(row);
  });
}

// Löscht einen Punkt und bereinigt alle verknüpften Geraden.
// Indizes in linkedLines werden nach dem Löschen angepasst.
function deletePoint(i) {
  linkedLines = linkedLines.filter(ll => ll.pi1 !== i && ll.pi2 !== i);
  linkedLines.forEach(ll => { if (ll.pi1 > i) ll.pi1--; if (ll.pi2 > i) ll.pi2--; });
  points.splice(i, 1);
  // Standard-Labels für Punkte ohne eigenes Label nach dem Löschen aktualisieren
  points.forEach((pt, j) => {
    const defaultLabel = `P${subDigit(j+1)}`;
    // Wenn kein benutzerdefinierter Name, neu nummerieren
    if (!pt.label || /^P[₀-₉\d]+$/.test(pt.label)) pt.label = defaultLabel;
  });
  renderPointList(); scheduleComputeSpecials(); scheduleDraw();
}

// ═══════════════════════════════════════════════════════════════════
// LIVE-GERADEN DURCH PUNKTE
// ═══════════════════════════════════════════════════════════════════

// Berechnet Steigung und Achsenabschnitt einer Geraden durch zwei Punkte.
// Gibt {m, b, expr, label} zurück oder null wenn die Gerade senkrecht ist.
// Null-Terme (0*x oder +0) werden weggelassen.
function computeLinkedLine(ll) {
  const p1 = points[ll.pi1], p2 = points[ll.pi2];
  if (!p1 || !p2 || Math.abs(p2.x - p1.x) < 1e-12) return null;
  const m = (p2.y - p1.y) / (p2.x - p1.x), b = p1.y - m * p1.x;
  const p = Math.max(precision, 4);
  // Exakte Werte (kein Pre-Rounding) damit numToFrac 1/3 etc. korrekt erkennt
  return { m, b, ...buildLineExpr(m, b, p) };
}

// Erstellt einen Geraden-Ausdruck und Label ohne Null-Terme.
// Koeffizienten als Brüche (1/3 statt 0.33333) oder gerundete Dezimalzahlen.
function gcdFrac(a, b) { return b < 0.0001 ? Math.round(a) : gcdFrac(b, a % b); }
function numToFrac(v, maxDen=100) {
  if (!isFinite(v) || Math.abs(v) < 1e-9) return '0';
  if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
  const neg = v < 0, absV = Math.abs(v);
  // Toleranz 1e-9 für exakte Werte; 5e-5 als Fallback für gerundete Dezimalzahlen
  for (const tol of [1e-9, 5e-5]) {
    for (let q = 2; q <= maxDen; q++) {
      const p = Math.round(absV * q);
      if (p > 0 && Math.abs(p / q - absV) < tol) {
        const g = gcdFrac(p, q);
        return (neg ? '-' : '') + (p/g) + '/' + (q/g);
      }
    }
  }
  return null;
}
function niceCoeff(v, p) {
  if (useFracMode()) {
    const f = numToFrac(v);
    if (f) return f;
  }
  return parseFloat(v.toFixed(p)).toString();
}
function buildLineExpr(mR, bR, p) {
  p = p || Math.max(precision, 2);
  const mAbs = Math.abs(mR), bAbs = Math.abs(bR);
  const mZero = Math.abs(mR) < 1e-9, bZero = Math.abs(bR) < 1e-9;
  const mS = niceCoeff(mR, p), bS = niceCoeff(bR, p), bAbsS = niceCoeff(bAbs, p);

  // Hilfsfunktion: Zahl auf p Nachkommastellen runden (für expr-Fallback)
  function rndExpr(v) { return parseFloat(v.toFixed(p)); }

  let expr, label;
  if (mZero && bZero) {
    expr = '0'; label = '0';
  } else if (mZero) {
    const bFracC = numToFrac(bR); expr = bFracC ? (bFracC.includes('/') ? `(${bFracC})` : bFracC) : String(rndExpr(bR)); label = bS;
  } else if (bZero) {
    if (Math.abs(mR - 1) < 1e-9) { expr = 'x'; label = 'x'; }
    else if (Math.abs(mR + 1) < 1e-9) { expr = '-x'; label = '-x'; }
    else {
      const mFrac = numToFrac(mR); const mExpr = mFrac ? `(${mFrac})` : `(${rndExpr(mR)})`;
      expr = `${mExpr}*x`; label = `${mS}·x`;
    }
  } else {
    const mFrac = numToFrac(mR); const mExpr = mFrac ? `(${mFrac})` : `(${rndExpr(mR)})`;
    const mPart = Math.abs(mR - 1) < 1e-9 ? 'x' : (Math.abs(mR + 1) < 1e-9 ? '-x' : `${mExpr}*x`);
    const mLbl  = Math.abs(mR - 1) < 1e-9 ? 'x' : (Math.abs(mR + 1) < 1e-9 ? '-x' : `${mS}·x`);
    const sign = bR >= 0 ? '+' : '-';
    const bFrac = numToFrac(bAbs); const bExprRaw = bFrac || String(rndExpr(bAbs));
    const bExpr = bExprRaw.includes('/') ? `(${bExprRaw})` : bExprRaw;
    expr = `${mPart} ${sign} ${bExpr}`;
    label = `${mLbl} ${sign} ${bAbsS}`;
  }
  return { expr, label };
}

// Aktualisiert den Ausdruck aller verknüpften Geraden.
// Wird aufgerufen wenn ein Punkt verschoben wird.
function updateAllLinkedLines() {
  linkedLines.forEach(ll => {
    const res = computeLinkedLine(ll);
    if (!res || !functions[ll.fi]) return;
    functions[ll.fi].expr = res.expr; // Funktionsausdruck live aktualisieren

    // slopeTriPtsMap mitaktualisieren: x-Koordinaten der definierenden Punkte übernehmen
    // damit der Steigungsdreieck bei horizontaler Punktbewegung verankert bleibt
    if (slopeTriPtsMap[ll.fi] && slopeTriPtsMap[ll.fi].length === 2) {
      const p1 = points[ll.pi1], p2 = points[ll.pi2];
      if (p1 && p2) {
        const xA = Math.min(p1.x, p2.x), xB = Math.max(p1.x, p2.x);
        slopeTriPtsMap[ll.fi] = [{ x: xA, fi: ll.fi }, { x: xB, fi: ll.fi }];
      }
    }
  });
  clearEvalCache(); // Cache leeren da sich Ausdrücke geändert haben
  renderFuncList(); // Sidebar-Liste aktualisieren (zeigt neue Formel)
}

// Sucht den nächstgelegenen Punkt in 'points[]' zur Canvas-Position (mx, my).
// excludeIdx: Index der übersprungen wird (nützlich beim 2-Punkt-Picking)
// Gibt Index zurück oder -1 wenn keiner nahe genug ist.
// Snap-Radius: 14px — anpassen für grössere/kleinere Trefferfläche
function findNearPoint(mx, my, excludeIdx = -1) {
  const HIT = 14; // Trefferflächen-Radius in Canvas-Pixeln
  for (let i = points.length - 1; i >= 0; i--) { // rückwärts = oben liegende zuerst
    if (i === excludeIdx) continue;
    const { cx, cy } = toCanvas(points[i].x, points[i].y);
    if (Math.hypot(cx - mx, cy - my) < HIT) return i;
  }
  return -1;
}

// ═══════════════════════════════════════════════════════════════════
// GERADE DURCH 2 PUNKTE (interaktiv)
// ═══════════════════════════════════════════════════════════════════

// Schaltet den "Im Plot klicken"-Modus an/aus.
// In diesem Modus: Klick auf bestehenden Punkt snapped daran,
// Klick auf leere Stelle setzt neuen Punkt.
// Nach zwei Punkten wird eine Live-Gerade erstellt.
function toggleLine2PtMode() {
  line2ptPicking = !line2ptPicking;
  if (line2ptPicking) { pointMode = false; graphPtMode = false; line2ptPts = []; }
  document.getElementById('line2pt-btn').classList.toggle('active-btn', line2ptPicking);
  document.getElementById('point-mode-btn').classList.remove('active-btn');
  document.getElementById('graph-pt-btn').classList.remove('active-btn');
  canvas.style.cursor = line2ptPicking ? 'crosshair' : 'grab';
  updateLine2PtStatus();
}

// Aktualisiert den Statustext unter dem Button
function updateLine2PtStatus() {
  const st = document.getElementById('line2pt-status');
  if (!line2ptPicking) { st.textContent = ''; }
  else { st.textContent = line2ptPts.length === 0 ? t('status_p1') : t('status_p2'); }
  // Also update linear panel status
  const fpick = document.getElementById('linear-pick-status');
  if (fpick) {
    if (!line2ptPicking) fpick.textContent = '';
    else fpick.textContent = line2ptPts.length === 0 ? '1. Punkt klicken…' : '2. Punkt klicken…';
  }
}

// Sucht den nächsten speziellen Punkt (Extrema, Nullstellen etc.) in Snap-Reichweite.
// Gibt {x, y} oder null zurück.
function findNearSpecial(mx, my) {
  const HIT = 16;
  for (const sp of specials) {
    if (!isKindVisible(sp.kind)) continue;
    const { cx, cy } = toCanvas(sp.x, sp.y);
    if (Math.hypot(cx - mx, cy - my) < HIT) return { x: sp.x, y: sp.y };
  }
  return null;
}

// Verarbeitet einen Klick im "Im Plot klicken"-Modus.
// Snappt auf bestehende Punkte (14px), spezielle Punkte (16px) oder setzt neuen Punkt.
// Nach dem zweiten Klick: Gerade erstellen und Modus verlassen.
function line2ptPickClick(mx, my) {
  // Auf bestehenden freien Punkt snappen?
  const excludeIdx = line2ptPts.length > 0 ? line2ptPts[0].idx : -1;
  let idx = findNearPoint(mx, my, excludeIdx);
  if (idx < 0) {
    // Auf speziellen Punkt snappen (Extremum, Nullstelle, Wendepunkt...)?
    const sp = findNearSpecial(mx, my);
    // Prüfe ob dieser spezielle Punkt bereits als P1 verwendet wird
    const alreadyUsed = line2ptPts.length > 0 && sp &&
      Math.abs(points[line2ptPts[0].idx]?.x - sp.x) < 1e-9 &&
      Math.abs(points[line2ptPts[0].idx]?.y - sp.y) < 1e-9;
    if (sp && !alreadyUsed) {
      const ni = points.length;
      points.push({ x: sp.x, y: sp.y, color: POINT_COLORS[ni % POINT_COLORS.length], label: `P${subDigit(ni+1)}` });
      renderPointList();
      idx = points.length - 1;
    } else {
      // Neuen freien Punkt setzen (mit Grid-Snap wenn Checkbox aktiv)
      let pt = fromCanvas(mx, my);
      if (document.getElementById('chk-gridsnap')?.checked) {
        const gs = gridStep(isoView ? (isoView.xmax - isoView.xmin) : (view.xmax - view.xmin));
        pt = { x: Math.round(pt.x / gs) * gs, y: Math.round(pt.y / gs) * gs };
      }
      const ni = points.length;
      points.push({ x: pt.x, y: pt.y, color: POINT_COLORS[ni % POINT_COLORS.length], label: `P${subDigit(ni+1)}` });
      renderPointList();
      idx = points.length - 1;
    }
  }
  line2ptPts.push({ idx }); updateLine2PtStatus();

  if (line2ptPts.length === 2) {
    const i1 = line2ptPts[0].idx, i2 = line2ptPts[1].idx;
    if (i1 === i2) { document.getElementById('line2pt-status').textContent = t('status_same'); line2ptPts = []; scheduleDraw(); return; }

    const p1 = points[i1], p2 = points[i2];
    if (!p1 || !p2) { line2ptPts = []; return; }

    if (Math.abs(p2.x - p1.x) < 1e-10) {
      document.getElementById('line2pt-status').textContent = t('status_vert');
      line2ptPts = []; return;
    }

    // Gerade berechnen und als neue Funktion hinzufügen (Brüche / gerundete Koeff.)
    const slope = (p2.y - p1.y) / (p2.x - p1.x), intercept = p1.y - slope * p1.x;
    const pp = Math.max(precision, 4);
    const built = buildLineExpr(slope, intercept, pp); // exakt, kein Pre-Rounding
    functions.push({ expr: built.expr, color: COLORS[functions.length % COLORS.length], visible: true });
    const fi = functions.length - 1;
    linkedLines.push({ fi, pi1: i1, pi2: i2 });

    clearEvalCache(); renderFuncList(); syncParams(); syncAreaSelects(); scheduleComputeSpecials();
    const fnIdx = fi + 1;
    document.getElementById('line-msg').textContent = `f${fnIdx}(x) = ${built.label}`;
    document.getElementById('line-msg').style.color = '#1D9E75';

    // Modus verlassen + History speichern
    line2ptPts = []; line2ptPicking = false;
    document.getElementById('line2pt-btn').classList.remove('active-btn');
    document.getElementById('fit-pick-btn')?.classList.remove('active-btn');
    document.getElementById('linear-pick-btn')?.classList.remove('active-btn');
    canvas.style.cursor = 'grab'; updateLine2PtStatus();
    // Ergebnis im linearen Panel anzeigen
    const fres = document.getElementById('linear-result');
    if (fres) { fres.style.color = '#1D9E75'; fres.textContent = t('msg_line_add'); }
    const fpick = document.getElementById('linear-pick-status');
    if (fpick) fpick.textContent = t('msg_slope_rdy');
    // Steigungsdreieck automatisch mit den zwei definierten Punkten vorbelegen
    // Punkte nach x-Koordinate sortieren damit Dreieck von links nach rechts zeigt
    const xA = p1.x < p2.x ? p1.x : p2.x;
    const xB = p1.x < p2.x ? p2.x : p1.x;
    if (Math.abs(xB - xA) > 1e-9) {
      slopeTriPts = [{ x: xA, fi }, { x: xB, fi }];
      slopeTriPtsMap[fi] = [...slopeTriPts];
      document.getElementById('chk-slopetri').checked = true;
    }
    pushHistory(); scheduleDraw();
  } else {
    scheduleDraw(); // P1-Vorschau zeichnen
  }
}

// Gerade aus den Sidebar-Eingabefeldern erstellen (statisch, nicht live)
function addLineThrough2Pts() {
  const x1 = parseFloat(document.getElementById('lp1x').value);
  const y1 = parseFloat(document.getElementById('lp1y').value);
  const x2 = parseFloat(document.getElementById('lp2x').value);
  const y2 = parseFloat(document.getElementById('lp2y').value);
  const msg = document.getElementById('line-msg');
  if ([x1,y1,x2,y2].some(isNaN)) { msg.textContent = t('msg_invalid'); return; }
  if (Math.abs(x2 - x1) < 1e-10) { msg.textContent = 'Senkrechte (nicht darstellbar)'; return; }
  const m = (y2 - y1) / (x2 - x1), b = y1 - m * x1;
  const p = Math.max(precision, 4);
  const built = buildLineExpr(m, b, p); // exakt, kein Pre-Rounding
  functions.push({ expr: built.expr, color: COLORS[functions.length % COLORS.length], visible: true });
  clearEvalCache(); renderFuncList(); syncParams(); syncAreaSelects(); scheduleComputeSpecials();
  pushHistory(); scheduleDraw();
  msg.style.color = '#1D9E75';
  msg.textContent = `f${functions.length}(x) = ${built.label}`;
}

