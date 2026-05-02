// ═══════════════════════════════════════════════════════════════════
// MODUL: fitting — Kurvenanpassung, Lösungswege & Initialisierung
// Enthält:  Panel-basiertes Fit-System (linear / quad / exp / potenz)
//           slopeTriTogglePick(), showLoesungsweg(), showQuadLoesungsweg()
//           INITIALISIERUNG: Startfunktionen, erster draw()-Aufruf
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// STEIGUNGSDREIECK: ZWEI-PUNKTE-PICK-MODUS
// ═══════════════════════════════════════════════════════════════════

let slopeTriPickMode = false;
let slopeTriPtsMap = {}; // per-function: fi -> [{x,fi},{x,fi}]
let slopeTriPts = []; // global für rückwärtskompatibilität (legacy)
let slopeTriFi = -1;  // Funktionsindex des ersten gewählten Punktes

function slopeTriTogglePick() {
  if (slopeTriPickMode) { slopeTriStopPick(); return; }
  slopeTriPickMode = true;
  slopeTriPts = []; slopeTriFi = -1;
  document.getElementById('slopetri-pick-btn').classList.add('active-btn');
  document.getElementById('chk-slopetri').checked = true;
  canvas.style.cursor = 'crosshair';
  document.getElementById('slopetri-pick-status').textContent = t('slope_pick1');
}
function slopeTriStopPick() {
  slopeTriPickMode = false;
  document.getElementById('slopetri-pick-btn').classList.remove('active-btn');
  canvas.style.cursor = 'grab';
  document.getElementById('slopetri-pick-status').textContent = slopeTriPts.length === 2 ? '✓ ' + t('slope_done') : '';
}
function slopeTriPickClick(mx, my) {
  let snapPtTri = null, snapDistTri = 15;
  points.forEach(p => { const c = toCanvas(p.x, p.y); const d = Math.hypot(c.cx - mx, c.cy - my); if (d < snapDistTri) { snapDistTri = d; snapPtTri = p; } });
  let snapXY = snapPtTri;
  if (!snapXY) {
    let bestSp = null, bestSpDist = 18;
    specials.forEach(sp => {
      const c = toCanvas(sp.x, sp.y);
      const d = Math.hypot(c.cx - mx, c.cy - my);
      if (d < bestSpDist) { bestSpDist = d; bestSp = sp; }
    });
    if (bestSp) {
      snapXY = { x: bestSp.x, y: bestSp.y };
    } else {
      const raw = fromCanvas(mx, my);
      snapXY = snapToGrid(raw.x, raw.y);
    }
  }
  const pt = { x: snapXY.x, y: snapXY.y };
  let bestFi = -1, bestDist = 50;
  if (snapPtTri) {
    const ptIdx = points.indexOf(snapPtTri);
    if (ptIdx >= 0) {
      const ll = linkedLines.find(l => l.pi1 === ptIdx || l.pi2 === ptIdx);
      if (ll && functions[ll.fi] && isLinearFunc(functions[ll.fi].expr)) {
        bestFi = ll.fi; bestDist = 0;
      }
    }
  }
  if (bestFi < 0) {
    functions.forEach((fn, i) => {
      if (!fn.expr.trim() || fn.visible === false || !isLinearFunc(fn.expr)) return;
      const y = safeEval(fn.expr, pt.x);
      if (!isFinite(y)) return;
      const distCanvas = Math.abs(toCanvas(pt.x, y).cy - toCanvas(pt.x, pt.y).cy);
      if (distCanvas < bestDist) { bestDist = distCanvas; bestFi = i; }
    });
  }
  if (slopeTriFi >= 0 && bestFi !== slopeTriFi) {
    const fn0 = functions[slopeTriFi];
    if (fn0 && fn0.expr) {
      const y0 = safeEval(fn0.expr, pt.x);
      const distOnChosen = isFinite(y0) ? Math.abs(toCanvas(pt.x, y0).cy - toCanvas(pt.x, pt.y).cy) : 9999;
      if (distOnChosen < 30) bestFi = slopeTriFi;
    }
  }
  if (bestFi < 0) {
    document.getElementById('slopetri-pick-status').textContent = t('msg_no_line_pt');
    return;
  }
  if (slopeTriPts.length === 0) {
    slopeTriFi = bestFi;
    slopeTriPts.push({ x: pt.x, fi: bestFi });
    document.getElementById('slopetri-pick-status').textContent = t('slope_pick2');
  } else {
    if (bestFi !== slopeTriFi) {
      document.getElementById('slopetri-pick-status').textContent = '⚠ ' + t('slope_same_line');
      return;
    }
    slopeTriPts.push({ x: pt.x, fi: bestFi });
    slopeTriPtsMap[bestFi] = [...slopeTriPts];
    slopeTriStopPick();
    scheduleDraw();
  }
}

// ═══════════════════════════════════════════════════════════════════
// QUADRATISCHE FUNKTIONEN — Hilfsfunktionen
// ═══════════════════════════════════════════════════════════════════

function extractQuadABC(expr) {
  const f0 = safeEval(expr, 0), f1 = safeEval(expr, 1), fn1 = safeEval(expr, -1);
  if (!isFinite(f0) || !isFinite(f1) || !isFinite(fn1)) return null;
  return { a: (f1 - 2*f0 + fn1) / 2, b: (f1 - fn1) / 2, c: f0 };
}

function isQuadraticFunc(expr) {
  const abc = extractQuadABC(expr);
  if (!abc || Math.abs(abc.a) < 1e-6) return false;
  const { a, b, c } = abc;
  return [-3, -2, 2, 3].every(x => {
    const actual = safeEval(expr, x);
    return isFinite(actual) && Math.abs(actual - (a*x*x + b*x + c)) < 1e-4 * (1 + Math.abs(actual));
  });
}

// ═══════════════════════════════════════════════════════════════════
// PANEL-BASIERTES FIT-SYSTEM
// ═══════════════════════════════════════════════════════════════════

// Konfiguration: Punktanzahl + Labels pro Typ
const FIT_CONFIG = {
  linear:           { pts: 2, labels: ['P₁','P₂'] },
  quadratic:        { pts: 3, labels: ['P₁','P₂','P₃'] },
  vertex:           { pts: 2, labels: ['Scheitelpunkt S','Punkt P'] },
  'roots':          { pts: 3, labels: ['Nullstelle x₁','Nullstelle x₂','Punkt P'] },
  exponential:      { pts: 2, labels: ['P₁','P₂'] },
  'exponential_h':  { pts: 3, labels: ['P₁','P₂','P₃'] },
  logarithm:        { pts: 2, labels: ['P₁','P₂'] },
  'logarithm_vh':   { pts: 3, labels: ['P₁','P₂','P₃'] },
  'positive power': { pts: 2, labels: ['P₁','P₂'] },
  'negative power': { pts: 3, labels: ['P₁','P₂','P₃'] },
  'square root':    { pts: 3, labels: ['P₁','P₂','P₃'] },
};

// ── Pick-Modus — globale Variablen (gelesen von 09_events.js) ─────
let fitPickMode  = false;   // irgend ein Panel ist im Pick-Modus
let fitPickPanel = null;    // welches Panel gerade pickt
let fitPickPts   = [];      // zuletzt geklickte Punkte — werden im Canvas angezeigt

// Panel-Definitionen (werden in initPanels() gesetzt)
let linPanelDef   = null;
let quadPanelDef  = null;
let expPanelDef   = null;
let logPanelDef   = null;
let powerPanelDef = null;

// ── Eingabefelder aufbauen ────────────────────────────────────────
function buildPanelInputs(containerId, labels, prefix) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  labels.forEach((lbl, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:5px;margin-bottom:5px;font-size:11px;';
    row.innerHTML =
      `<span style="min-width:80px;color:var(--text-muted);" id="${prefix}-lbl${i}">${lbl}:</span>` +
      `<span style="color:var(--text-muted);">x=</span>` +
      `<input type="text" id="${prefix}-x${i}" inputmode="decimal" pattern="-?[0-9]*\\.?[0-9]*" style="width:52px;" placeholder="—">` +
      `<span style="color:var(--text-muted);">y=</span>` +
      `<input type="text" id="${prefix}-y${i}" inputmode="decimal" pattern="-?[0-9]*\\.?[0-9]*" style="width:52px;" placeholder="—">`;
    container.appendChild(row);
  });
}

// Liest Punkte aus Panel-spezifischen Eingabefeldern
function panelGetPoints(prefix, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const x = parseFloat(document.getElementById(`${prefix}-x${i}`)?.value);
    const y = parseFloat(document.getElementById(`${prefix}-y${i}`)?.value);
    if (!isFinite(x) || !isFinite(y)) return null;
    pts.push({ x, y });
  }
  return pts;
}

// ── Generischer Pick-Modus ────────────────────────────────────────
function genericTogglePick(panelDef) {
  if (fitPickMode && fitPickPanel === panelDef) { genericStopPick(); return; }
  if (fitPickMode) genericStopPick();
  if (line2ptPicking) toggleLine2PtMode(); // laufendes line2pt stoppen
  fitPickMode = true;
  fitPickPanel = panelDef;
  panelDef.pickNext = 0;
  fitPickPts = []; // Vorherige Punkte löschen
  document.getElementById(panelDef.pickBtnId)?.classList.add('active-btn');
  canvas.style.cursor = 'crosshair';
  genericUpdatePickStatus();
  scheduleDraw();
}
function genericStopPick() {
  if (!fitPickMode || !fitPickPanel) return;
  document.getElementById(fitPickPanel.pickBtnId)?.classList.remove('active-btn');
  const statusEl = document.getElementById(fitPickPanel.statusId);
  if (statusEl) statusEl.textContent = '';
  fitPickMode = false;
  fitPickPanel = null;
  canvas.style.cursor = graphPtMode ? 'cell' : (pointMode ? 'crosshair' : 'grab');
}
function genericUpdatePickStatus() {
  if (!fitPickMode || !fitPickPanel) return;
  const pd = fitPickPanel;
  const statusEl = document.getElementById(pd.statusId);
  if (!statusEl) return;
  statusEl.textContent = pd.pickNext >= pd.nPts
    ? '✓ Alle Punkte gesetzt'
    : `Punkt ${pd.pickNext + 1}/${pd.nPts} klicken: ${pd.labels[pd.pickNext]}`;
}

// Wird von 09_events.js aufgerufen wenn fitPickMode aktiv ist
function fitPickClick(mx, my) {
  if (!fitPickMode || !fitPickPanel) return;
  const pd = fitPickPanel;
  // Snap auf freie Punkte (15px)
  let snapPt = null, snapDist = 15;
  points.forEach(p => { const c = toCanvas(p.x, p.y); const d = Math.hypot(c.cx - mx, c.cy - my); if (d < snapDist) { snapDist = d; snapPt = p; } });
  let pt;
  if (snapPt) {
    pt = snapPt;
  } else {
    const sp = findNearSpecial(mx, my);
    if (sp) {
      pt = sp;
    } else {
      let raw = fromCanvas(mx, my);
      if (document.getElementById('chk-gridsnap')?.checked) {
        const v2 = isoView || view;
        const gs = gridStep(v2.xmax - v2.xmin);
        const gsy = gridStep(v2.ymax - v2.ymin);
        raw = { x: Math.round(raw.x / gs) * gs, y: Math.round(raw.y / gsy) * gsy };
      }
      pt = raw;
    }
  }
  const rx = parseFloat(pt.x.toFixed(4)), ry = parseFloat(pt.y.toFixed(4));
  const xi = document.getElementById(`${pd.prefix}-x${pd.pickNext}`);
  const yi = document.getElementById(`${pd.prefix}-y${pd.pickNext}`);
  if (!xi || !yi) { genericStopPick(); return; }
  // Nullstellenform: erste zwei Picks immer auf x-Achse zwingen
  const curType = typeof pd.getCurrentType === 'function' ? pd.getCurrentType() : (pd.type || '');
  const forceXAxis = curType === 'roots' && pd.pickNext < 2;
  xi.value = rx;
  yi.value = forceXAxis ? 0 : ry;
  fitPickPts.push({ x: rx, y: forceXAxis ? 0 : ry }); // Punkt für Canvas-Anzeige merken
  const lbl = document.getElementById(`${pd.prefix}-lbl${pd.pickNext}`);
  if (lbl) { lbl.style.color = '#1D9E75'; setTimeout(() => { if (lbl) lbl.style.color = ''; }, 1000); }
  pd.pickNext++;
  if (pd.pickNext >= pd.nPts) {
    genericStopPick();
    pd.computeFn(); // automatisch berechnen wenn alle Punkte gesetzt
  } else {
    genericUpdatePickStatus();
  }
  scheduleDraw();
}

// ── Hilfsfunktion: genaue Zahlendarstellung für Ausdrücke ─────────
// Für Exponentialfunktionen müssen a und b exakt sein (keine Bruch-Näherungen),
// sonst geht die Kurve nicht durch die gewählten Punkte.
// Nur echte exakte Brüche (wie 3/2, 1/3) werden als Bruch dargestellt.
function expNumStr(v) {
  if (!isFinite(v)) return String(v);
  if (Math.abs(v - Math.round(v)) < 1e-10) return String(Math.round(v));
  // Bruch nur verwenden wenn er den Wert exakt (< 1e-11 relativ) darstellt
  const f = numToFrac(v);
  if (f && f.includes('/')) {
    const slash = f.indexOf('/');
    const p = parseInt(f.slice(0, slash)), q = parseInt(f.slice(slash + 1));
    if (Math.abs(p / q - v) < 1e-11 * Math.abs(v)) return f;
  } else if (f) {
    return f; // ganze Zahl
  }
  // Volle Präzision für den Ausdruck — nur so geht die Kurve exakt durch die Punkte.
  // Die gerundete Anzeige erscheint in der Erfolgsmeldung (display-Feld via fitNice).
  return parseFloat(v.toPrecision(12)).toString();
}

// ── Algorithmus-Kern ──────────────────────────────────────────────
// Gibt {expr, display} zurück oder wirft einen Fehler
function computeByType(type, pts) {
  if (type === 'linear') {
    const [p1, p2] = pts;
    if (Math.abs(p2.x - p1.x) < 1e-12) throw new Error(t('msg_x_diff'));
    const a = (p2.y - p1.y) / (p2.x - p1.x);
    const b = p1.y - a * p1.x;
    return { expr: fitFmtLinear(a, b), display: `f(x) = ${fitNice(a)}·x + ${fitNice(b)}` };

  } else if (type === 'quadratic') {
    const [p1, p2, p3] = pts;
    const A = [[p1.x**2, p1.x, 1, p1.y],
               [p2.x**2, p2.x, 1, p2.y],
               [p3.x**2, p3.x, 1, p3.y]];
    const sol = gaussElim3(A);
    if (!sol) throw new Error(t('msg_collinear'));
    const [a, b, c] = sol;
    return { expr: fitFmtQuad(a, b, c), display: `f(x) = ${fitNice(a)}·x² + ${fitNice(b)}·x + ${fitNice(c)}` };

  } else if (type === 'vertex') {
    const [S, P] = pts;
    const denom = (P.x - S.x) ** 2;
    if (Math.abs(denom) < 1e-12) throw new Error(t('msg_vertex_ax'));
    const a = (P.y - S.y) / denom;
    const s = S.x, tv = S.y;
    return { expr: fitFmtVertex(a, s, tv), display: `f(x) = ${fitNice(a)}·(x − ${fitNice(s)})² + ${fitNice(tv)}` };

  } else if (type === 'roots') {
    // Nullstellenform: x₁ und x₂ (y wird ignoriert, da = 0) + Punkt P
    const x1 = pts[0].x, x2 = pts[1].x, P = pts[2];
    if (Math.abs(x1 - x2) < 1e-12) throw new Error('x₁ und x₂ müssen verschieden sein');
    if (Math.abs(P.x - x1) < 1e-12 || Math.abs(P.x - x2) < 1e-12)
      throw new Error('Punkt P darf nicht auf einer Nullstelle liegen');
    const a = P.y / ((P.x - x1) * (P.x - x2));
    if (!isFinite(a) || Math.abs(a) < 1e-12) throw new Error('Kein eindeutiger Streckfaktor (P auf x-Achse?)');
    return { expr: fitFmtRoots(a, x1, x2),
             display: `f(x) = ${fitNice(a)}·(x − ${fitNice(x1)})·(x − ${fitNice(x2)})` };

  } else if (type === 'exponential') {
    const [p1, p2] = pts;
    if (p1.y === 0 || p2.y === 0) throw new Error('y-Werte dürfen nicht 0 sein');
    if (Math.sign(p1.y) !== Math.sign(p2.y)) throw new Error('Beide y-Werte müssen dasselbe Vorzeichen haben (beide positiv oder beide negativ)');
    if (Math.abs(p2.x - p1.x) < 1e-12) throw new Error(t('msg_x_diff'));
    // Absolutwerte für den Logarithmus — funktioniert auch wenn a < 0
    const b = Math.exp((Math.log(Math.abs(p2.y)) - Math.log(Math.abs(p1.y))) / (p2.x - p1.x));
    const a = p1.y / Math.pow(b, p1.x);
    const aS = expNumStr(a), bS = expNumStr(b);
    // Klammern um a/b wenn nötig (Bruch oder negatives Vorzeichen)
    const aPart = (aS.includes('/') || aS.startsWith('-')) ? `(${aS})` : aS;
    const bPart = (bS.includes('/') || bS.startsWith('-')) ? `(${bS})` : bS;
    return { expr: `${aPart}*${bPart}^x`, display: `f(x) = ${fitNice(a)} · ${fitNice(b)}^x`, asymptote: 0 };

  } else if (type === 'exponential_h') {
    // a·b^x + h durch 3 Punkte — Newton-Raphson auf h
    const [p1, p2, p3] = pts;
    if (Math.abs(p2.x - p1.x) < 1e-12 || Math.abs(p3.x - p1.x) < 1e-12 || Math.abs(p3.x - p2.x) < 1e-12)
      throw new Error(t('msg_x_diff'));

    // Für gegebenes h: b und a aus den ersten zwei Punkten berechnen
    function compAB(h) {
      const y1h = p1.y - h, y2h = p2.y - h;
      if (y1h === 0 || y2h === 0) return null;
      if (Math.sign(y1h) !== Math.sign(y2h)) return null;
      const b = Math.exp((Math.log(Math.abs(y2h)) - Math.log(Math.abs(y1h))) / (p2.x - p1.x));
      if (!isFinite(b) || b <= 0 || Math.abs(b - 1) < 1e-12) return null;
      const a = y1h / Math.pow(b, p1.x);
      if (!isFinite(a)) return null;
      return { a, b };
    }
    // F(h) = a(h)·b(h)^x3 + h − y3 = 0
    const eps = 1e-7;
    function F(h) {
      const r = compAB(h);
      if (!r) return NaN;
      return r.a * Math.pow(r.b, p3.x) + h - p3.y;
    }

    const yMin = Math.min(p1.y, p2.y, p3.y);
    const yMax = Math.max(p1.y, p2.y, p3.y);
    const spread = Math.max(yMax - yMin, 1);

    let bestH = null, bestErr = Infinity;
    // Mehrere Startwerte für Newton-Raphson probieren
    const starts = [yMin - spread, yMin - 1, yMin - 0.1, yMax + spread, yMax + 1, 0, -spread * 2, spread * 2];
    for (const h0 of starts) {
      let h = h0;
      for (let iter = 0; iter < 150; iter++) {
        const f = F(h);
        if (!isFinite(f)) break;
        const err = Math.abs(f);
        if (err < bestErr) { bestErr = err; bestH = h; }
        if (err < 1e-9) break;
        const df = (F(h + eps) - F(h - eps)) / (2 * eps);
        if (!isFinite(df) || Math.abs(df) < 1e-15) break;
        const raw = f / df;
        h -= Math.sign(raw) * Math.min(Math.abs(raw), spread * 3);
      }
    }

    if (bestH === null || bestErr > 1e-5)
      throw new Error('Keine Lösung gefunden. Wähle andere Punkte (y-Werte müssen unterschiedlich sein).');

    const res = compAB(bestH);
    if (!res) throw new Error('Berechnung fehlgeschlagen.');
    const { a, b } = res;
    const h = bestH;

    const aS = expNumStr(a), bS = expNumStr(b);
    const aPart = (aS.includes('/') || aS.startsWith('-')) ? `(${aS})` : aS;
    const bPart = (bS.includes('/') || bS.startsWith('-')) ? `(${bS})` : bS;
    const hAbs = Math.abs(h);
    const hS = expNumStr(hAbs);
    const hExpr = hAbs < 1e-9 ? '' : (h < 0 ? `-(${hS})` : `+(${hS})`);
    const hDisp = hAbs < 1e-9 ? '' : (h < 0 ? ` − ${fitNice(hAbs)}` : ` + ${fitNice(hAbs)}`);
    return {
      expr: `${aPart}*${bPart}^x${hExpr}`,
      display: `f(x) = ${fitNice(a)} · ${fitNice(b)}^x${hDisp}`,
      asymptote: h
    };

  } else if (type === 'logarithm') {
    // a·ln(x) + c durch 2 Punkte
    const [p1, p2] = pts;
    if (p1.x <= 0 || p2.x <= 0) throw new Error('x-Werte müssen positiv sein (ln nur für x > 0)');
    if (Math.abs(p2.x - p1.x) < 1e-12) throw new Error(t('msg_x_diff'));
    const lnDiff = Math.log(p2.x) - Math.log(p1.x); // = ln(x2/x1)
    if (Math.abs(lnDiff) < 1e-12) throw new Error('ln(x₂/x₁) ≈ 0 — Punkte zu ähnlich (x₁ ≈ x₂)');
    const a = (p2.y - p1.y) / lnDiff;
    const c = p1.y - a * Math.log(p1.x);
    const aS = expNumStr(a);
    const aPart = (aS.includes('/') || aS.startsWith('-')) ? `(${aS})` : aS;
    const cAbs = Math.abs(c), cS = expNumStr(cAbs);
    const cExpr = Math.abs(c) < 1e-9 ? '' : (c < 0 ? `-(${cS})` : `+(${cS})`);
    const cDisp = Math.abs(c) < 1e-9 ? '' : (c < 0 ? ` − ${fitNice(cAbs)}` : ` + ${fitNice(cAbs)}`);
    return {
      expr: `${aPart}*log(x)${cExpr}`,
      display: `f(x) = ${fitNice(a)} · ln(x)${cDisp}`,
      asymptote: 0, asymptoteVertical: true
    };

  } else if (type === 'logarithm_vh') {
    // a·ln(x − v) + h durch 3 Punkte — Newton-Raphson auf v
    const [p1, p2, p3] = pts;
    if (Math.abs(p2.x - p1.x) < 1e-12 || Math.abs(p3.x - p1.x) < 1e-12 || Math.abs(p3.x - p2.x) < 1e-12)
      throw new Error(t('msg_x_diff'));

    // Für gegebenes v: a und h aus p1, p2
    function compAH(v) {
      const x1v = p1.x - v, x2v = p2.x - v;
      if (x1v <= 0 || x2v <= 0) return null;
      const lnD = Math.log(x2v) - Math.log(x1v);
      if (Math.abs(lnD) < 1e-12) return null;
      const a = (p2.y - p1.y) / lnD;
      const h = p1.y - a * Math.log(x1v);
      if (!isFinite(a) || !isFinite(h)) return null;
      return { a, h };
    }
    // F(v) = a(v)·ln(x3−v) + h(v) − y3 = 0
    const eps = 1e-7;
    function Fv(v) {
      const r = compAH(v);
      if (!r) return NaN;
      const x3v = p3.x - v;
      if (x3v <= 0) return NaN;
      return r.a * Math.log(x3v) + r.h - p3.y;
    }

    const xMin = Math.min(p1.x, p2.x, p3.x);
    const spread = Math.max(Math.abs(xMin), 1);
    let bestV = null, bestErr = Infinity;
    const starts = [xMin - 0.1, xMin - 1, xMin - 5, xMin - 0.5, xMin - 10, xMin - 20, xMin - 50];
    for (const v0 of starts) {
      if (v0 >= xMin) continue;
      let v = v0;
      for (let iter = 0; iter < 150; iter++) {
        const f = Fv(v); if (!isFinite(f)) break;
        const err = Math.abs(f);
        if (err < bestErr) { bestErr = err; bestV = v; }
        if (err < 1e-9) break;
        const df = (Fv(v + eps) - Fv(v - eps)) / (2 * eps);
        if (!isFinite(df) || Math.abs(df) < 1e-15) break;
        const raw = f / df;
        v -= Math.sign(raw) * Math.min(Math.abs(raw), spread * 3);
        if (v >= xMin) v = xMin - 1e-4;
      }
    }
    if (bestV === null || bestErr > 1e-5)
      throw new Error('Keine Lösung gefunden. Wähle andere Punkte.');
    const res2 = compAH(bestV);
    if (!res2) throw new Error('Berechnung fehlgeschlagen.');
    const { a: la, h: lh } = res2;
    const lv = bestV;

    const laS = expNumStr(la);
    const laPart = (laS.includes('/') || laS.startsWith('-')) ? `(${laS})` : laS;
    const lvAbs = Math.abs(lv), lvS = expNumStr(lvAbs);
    const lvPart = Math.abs(lv) < 1e-9 ? 'x' : (lv < 0 ? `x+${lvS}` : `x-(${lvS})`);
    const lvDisp = Math.abs(lv) < 1e-9 ? 'x' : (lv < 0 ? `x + ${fitNice(lvAbs)}` : `x − ${fitNice(lvAbs)}`);
    const lhAbs = Math.abs(lh), lhS = expNumStr(lhAbs);
    const lhExpr = Math.abs(lh) < 1e-9 ? '' : (lh < 0 ? `-(${lhS})` : `+(${lhS})`);
    const lhDisp = Math.abs(lh) < 1e-9 ? '' : (lh < 0 ? ` − ${fitNice(lhAbs)}` : ` + ${fitNice(lhAbs)}`);
    return {
      expr: `${laPart}*log(${lvPart})${lhExpr}`,
      display: `f(x) = ${fitNice(la)} · ln(${lvDisp})${lhDisp}`,
      asymptote: lv, asymptoteVertical: true
    };

  } else if (type === 'positive power') {
    const [p1, p2] = pts;
    if (p1.x <= 0 || p2.x <= 0) throw new Error(t('msg_xpos_pow'));
    if (p1.y <= 0 || p2.y <= 0) throw new Error(t('msg_ypos'));
    if (Math.abs(p2.x - p1.x) < 1e-12) throw new Error(t('msg_x_diff'));
    const n = (Math.log(p2.y) - Math.log(p1.y)) / (Math.log(p2.x) - Math.log(p1.x));
    const a = p1.y / Math.pow(p1.x, n);
    return { expr: `(${fitFrac(a)})*x^(${fitFrac(n)})`, display: `f(x) = ${fitNice(a)} · x^${fitNice(n)}` };

  } else if (type === 'negative power') {
    const [p1, p2, p3] = pts;
    function fitNegPow(p1, p2, p3, n) {
      let v = (p1.x + p2.x + p3.x) / 3 - 0.5, h = (p1.y + p2.y + p3.y) / 3 * 0.1, a = 1;
      for (let iter = 0; iter < 200; iter++) {
        const f = (p, a, v, h) => a / Math.pow(p.x - v, n) + h - p.y;
        const r = [f(p1,a,v,h), f(p2,a,v,h), f(p3,a,v,h)];
        const J = [p1,p2,p3].map(p => { const D = Math.pow(p.x - v, n); return [1/D, a*n/Math.pow(p.x-v,n+1), 1]; });
        const JtJ = [[0,0,0],[0,0,0],[0,0,0]], Jtr = [0,0,0];
        for (let i=0;i<3;i++) for (let k=0;k<3;k++) {
          for (let j=0;j<3;j++) JtJ[k][j] += J[i][k]*J[i][j];
          Jtr[k] -= J[i][k]*r[i];
        }
        const aug = JtJ.map((row,i) => [...row, Jtr[i]]);
        const delta = gaussElim3(aug); if (!delta) break;
        const [da,dv,dh] = delta; a += da; v += dv; h += dh;
        if (Math.abs(da)+Math.abs(dv)+Math.abs(dh) < 1e-10) break;
      }
      const err = [p1,p2,p3].reduce((s,p) => s+(a/Math.pow(p.x-v,n)+h-p.y)**2, 0);
      return { a, v, h, err };
    }
    let best = null, bestN = 1;
    for (const tryN of [1,2]) {
      try { const r = fitNegPow(p1,p2,p3,tryN); if (!best || r.err < best.err) { best = r; bestN = tryN; } } catch(e) {}
    }
    if (!best || !isFinite(best.a)) throw new Error(t('msg_no_sol'));
    const {a, v, h} = best, nExp = bestN;
    const vPart = Math.abs(v)<1e-10?'x':(v<0?`x+${fitFrac(-v)}`:`x-${fitFrac(v)}`);
    const hPart = Math.abs(h)<1e-10?'':(h<0?`-(${fitFrac(-h)})`:`+(${fitFrac(h)})`);
    const vD = Math.abs(v)<1e-10?'x':(v<0?`x + ${fitNice(-v)}`:`x − ${fitNice(v)}`);
    const hD = Math.abs(h)<1e-10?'':(h<0?` − ${fitNice(-h)}`:`+ ${fitNice(h)}`);
    return { expr: `(${fitFrac(a)})/(${vPart})^${nExp}${hPart}`, display: `f(x) = ${fitNice(a)} / (${vD})^${nExp}${hD}` };

  } else if (type === 'square root') {
    const [p1, p2, p3] = pts;
    const v = p1.x, h = p1.y;
    if (p2.x <= v) throw new Error(t('msg_p2p3'));
    const a1 = (p2.y - h) / Math.sqrt(p2.x - v);
    const a2 = (p3.x <= v) ? a1 : (p3.y - h) / Math.sqrt(p3.x - v);
    const a = (a1 + (isFinite(a2) ? a2 : a1)) / (isFinite(a2) && p3.x > v ? 2 : 1);
    if (!isFinite(a)) throw new Error(t('msg_calc_fail'));
    const vPart = Math.abs(v)<1e-10?'x':(v<0?`x+${fitFrac(-v)}`:`x-${fitFrac(v)}`);
    const hPart = Math.abs(h)<1e-10?'':(h<0?`-(${fitFrac(-h)})`:`+(${fitFrac(h)})`);
    const vD = Math.abs(v)<1e-10?'x':(v<0?`x + ${fitNice(-v)}`:`x − ${fitNice(v)}`);
    const hD = Math.abs(h)<1e-10?'':(h<0?` − ${fitNice(-h)}`:`+ ${fitNice(h)}`);
    return { expr: `(${fitFrac(a)})*sqrt(${vPart})${hPart}`, display: `f(x) = ${fitNice(a)} · √(${vD})${hD}` };
  }
  throw new Error('Unbekannter Typ: ' + type);
}

// Generische Panel-Berechnung: liest Typ + Punkte, berechnet, fügt hinzu
function genericPanelCompute(panelDef) {
  const type = typeof panelDef.getCurrentType === 'function'
    ? panelDef.getCurrentType() : panelDef.type;
  const cfg = FIT_CONFIG[type];
  // Sicherstellen dass nPts aktuell ist (bei Subtyp-Wechsel)
  const nPts = cfg ? cfg.pts : panelDef.nPts;
  const pts = panelGetPoints(panelDef.prefix, nPts);
  const res = document.getElementById(panelDef.resultId);
  panelDef.lastExpr = '';
  if (res) { res.style.color = 'var(--text)'; res.textContent = ''; }
  if (!pts) {
    if (res) { res.style.color = '#e24b4a'; res.textContent = t('msg_fill_all'); }
    return;
  }
  try {
    const result = computeByType(type, pts);
    const { expr, display } = result;
    panelDef.lastExpr = expr;
    functions.push({ expr, color: COLORS[functions.length % COLORS.length], visible: true,
                     fitType: type, fitPts: pts.map(p => ({x: p.x, y: p.y})) });
    panelDef.lastFi = functions.length - 1;
    // Asymptote merken (für Exp- und Log-Panel)
    if (result.asymptote !== undefined) {
      panelDef.lastAsymptote = result.asymptote;
      panelDef.lastAsymptoteColor = functions[functions.length - 1].color;
      panelDef.lastAsymptoteVertical = result.asymptoteVertical || false;
    }
    renderFuncList(); syncParams(); syncAreaSelects(); computeSpecials(); scheduleDraw(); pushHistory();
    if (res) { res.style.color = '#1D9E75'; res.textContent = '✓ ' + display + ' ' + t('msg_added'); }
  } catch(e) {
    if (res) { res.style.color = '#e24b4a'; res.textContent = e.message; }
  }
}

// ── Lineare Funktionen (generisches Panel) ────────────────────────
function linUpdateInputs() {
  buildPanelInputs('lin-inputs', FIT_CONFIG.linear.labels, 'lin');
  const res = document.getElementById('lin-result');
  if (res) res.textContent = '';
  if (fitPickMode && fitPickPanel === linPanelDef) genericStopPick();
}
function linTogglePick() { genericTogglePick(linPanelDef); }
function linCompute() {
  const prevLen = functions.length;
  genericPanelCompute(linPanelDef);
  // Nach erfolgreicher Berechnung: Steigungsdreieck + Punkt-Anzeige
  if (functions.length > prevLen) {
    const fi = functions.length - 1;
    const x0 = parseFloat(document.getElementById('lin-x0')?.value);
    const y0 = parseFloat(document.getElementById('lin-y0')?.value);
    const x1 = parseFloat(document.getElementById('lin-x1')?.value);
    const y1 = parseFloat(document.getElementById('lin-y1')?.value);
    if (isFinite(x0) && isFinite(y0) && isFinite(x1) && isFinite(y1)) {
      slopeTriPtsMap[fi] = [{ x: x0, fi }, { x: x1, fi }]; // Steigungsdreieck
      document.getElementById('chk-slopetri').checked = true;
      fitPickPts = [{ x: x0, y: y0 }, { x: x1, y: y1 }];  // Punkte im Canvas
      scheduleDraw();
    }
  }
}

// ── Lineare Funktionen (Live-Gerade via 2 Punkte) ─────────────────
function linearTogglePick() {
  if (fitPickMode) genericStopPick(); // evtl. anderen Pick-Modus stoppen
  toggleLine2PtMode();
  const btn = document.getElementById('linear-pick-btn');
  if (btn) btn.classList.toggle('active-btn', line2ptPicking);
  const status = document.getElementById('linear-pick-status');
  if (status) status.textContent = line2ptPicking ? '1. Punkt klicken…' : '';
}

// ── Quadratische Funktionen ───────────────────────────────────────
function quadUpdateInputs() {
  const subtype = document.getElementById('quad-subtype')?.value || 'quadratic';
  const cfg = FIT_CONFIG[subtype];
  buildPanelInputs('quad-inputs', cfg.labels, 'quad');
  if (quadPanelDef) {
    quadPanelDef.nPts = cfg.pts;
    quadPanelDef.labels = cfg.labels;
  }
  // Nullstellenform: y-Eingaben der ersten zwei Punkte auf 0 sperren
  if (subtype === 'roots') {
    for (let i = 0; i < 2; i++) {
      const yEl = document.getElementById(`quad-y${i}`);
      if (yEl) {
        yEl.value = 0;
        yEl.disabled = true;
        yEl.style.opacity = '0.4';
        yEl.title = 'Nullstelle: y = 0';
      }
    }
  }
  // Pick-Status-Hinweis (wenn nicht gerade im Pick-Modus)
  if (!fitPickMode || fitPickPanel !== quadPanelDef) {
    const statusEl = document.getElementById('quad-pick-status');
    if (statusEl) statusEl.textContent = `${cfg.pts} Punkte wählen`;
  }
  const res = document.getElementById('quad-result');
  if (res) res.textContent = '';
  if (fitPickMode && fitPickPanel === quadPanelDef) genericStopPick();
}
function quadTogglePick() { genericTogglePick(quadPanelDef); }
function quadCompute()    { genericPanelCompute(quadPanelDef); }

// ── Exponentialfunktionen ─────────────────────────────────────────
function expUpdateInputs() {
  const subtype = document.getElementById('exp-subtype')?.value || 'exponential';
  const cfg = FIT_CONFIG[subtype];
  buildPanelInputs('exp-inputs', cfg.labels, 'exp');
  if (expPanelDef) {
    expPanelDef.nPts = cfg.pts;
    expPanelDef.labels = cfg.labels;
  }
  const hint = document.getElementById('exp-hint');
  if (hint) {
    hint.textContent = subtype === 'exponential'
      ? 'a·bˣ durch 2 Punkte  (y > 0)'
      : 'a·bˣ + h durch 3 Punkte';
  }
  const res = document.getElementById('exp-result');
  if (res) res.textContent = '';
  if (fitPickMode && fitPickPanel === expPanelDef) genericStopPick();
}
function expTogglePick() { genericTogglePick(expPanelDef); }
function expCompute()    { genericPanelCompute(expPanelDef); }

// ── Exp-Asymptote ─────────────────────────────────────────────────
let showExpAsymptote = false;
function toggleExpAsymptote() {
  showExpAsymptote = !showExpAsymptote;
  document.getElementById('exp-asym-btn')?.classList.toggle('active-btn', showExpAsymptote);
  scheduleDraw();
}

// ── Logarithmusfunktionen ──────────────────────────────────────────
function logUpdateInputs() {
  const subtype = document.getElementById('log-subtype')?.value || 'logarithm';
  const cfg = FIT_CONFIG[subtype];
  buildPanelInputs('log-inputs', cfg.labels, 'log');
  if (logPanelDef) {
    logPanelDef.nPts = cfg.pts;
    logPanelDef.labels = cfg.labels;
  }
  const hint = document.getElementById('log-hint');
  if (hint) {
    hint.textContent = subtype === 'logarithm'
      ? 'a·ln(x) + c durch 2 Punkte  (x > 0)'
      : 'a·ln(x − v) + h durch 3 Punkte';
  }
  const res = document.getElementById('log-result');
  if (res) res.textContent = '';
  if (fitPickMode && fitPickPanel === logPanelDef) genericStopPick();
}
function logTogglePick() { genericTogglePick(logPanelDef); }
function logCompute()    { genericPanelCompute(logPanelDef); }

// ── Log-Asymptote ──────────────────────────────────────────────────
let showLogAsymptote = false;
function toggleLogAsymptote() {
  showLogAsymptote = !showLogAsymptote;
  document.getElementById('log-asym-btn')?.classList.toggle('active-btn', showLogAsymptote);
  scheduleDraw();
}

// ── Log-Lösungsweg ────────────────────────────────────────────────
function showLogLoesungsweg() {
  const box = document.getElementById('log-lw-box');
  if (!box) return;
  if (box.style.display === 'block') { box.style.display = ''; return; }

  const subtype = document.getElementById('log-subtype')?.value;
  if (subtype !== 'logarithm') {
    box.innerHTML = '<span style="color:#e24b4a;">Lösungsweg nur für Typ a·ln(x) + c (2 Punkte).</span>';
    box.style.display = 'block'; return;
  }

  const x1 = parseFloat(document.getElementById('log-x0')?.value);
  const y1 = parseFloat(document.getElementById('log-y0')?.value);
  const x2 = parseFloat(document.getElementById('log-x1')?.value);
  const y2 = parseFloat(document.getElementById('log-y1')?.value);
  if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) {
    box.innerHTML = '<span style="color:#e24b4a;">Bitte zuerst 2 Punkte wählen.</span>';
    box.style.display = 'block'; return;
  }

  function fH(v)  { return fracHTML(v); }
  function fHa(v) { return fracHTML(Math.abs(v)); }
  function lwLine(text, indent) {
    return `<span class="${['lw-line', indent ? 'lw-indent' : ''].filter(Boolean).join(' ')}">${text}</span>`;
  }
  function mf(num, den) {
    return `<span class="mfrac"><span class="mfrac-num">${num}</span><span class="mfrac-den">${den}</span></span>`;
  }
  function sHead(title) {
    return `<span class="lw-line" style="display:block;font-weight:700;font-size:11.5px;`
         + `color:var(--active-border);padding-top:2px;letter-spacing:.02em;">${title}</span>`;
  }

  const lnDiff = Math.log(x2) - Math.log(x1);
  const a = (y2 - y1) / lnDiff;
  const c = y1 - a * Math.log(x1);
  const x1H = fH(x1), y1H = fH(y1), x2H = fH(x2), y2H = fH(y2);
  const aH = fH(a), cH = fH(c);
  const html = [sHead(`P₁(${x1H} | ${y1H})  und  P₂(${x2H} | ${y2H})`), lwLine('')];

  // Sonderfall: ein Punkt hat x = 1 → ln(1) = 0 → c direkt bekannt
  const p1IsOne = Math.abs(x1 - 1) < 1e-12;
  const p2IsOne = Math.abs(x2 - 1) < 1e-12;

  if (p1IsOne || p2IsOne) {
    const [xA, yA, xB, yB] = p1IsOne ? [x1, y1, x2, y2] : [x2, y2, x1, y1];
    const xAH = fH(xA), yAH = fH(yA), xBH = fH(xB), yBH = fH(yB);
    const lnXB = fH(Math.log(xB));

    html.push(
      sHead('▶ Sonderfall: Punkt auf x = 1'),
      lwLine(`Da x = ${xAH} gilt: &nbsp; f(${xAH}) = a·ln(${xAH}) + c = a·0 + c = c`, true),
      lwLine(`<b>→  c = ${yAH}</b>`, true),
      lwLine(''),
      sHead('▶ Schritt 2 — Faktor a bestimmen'),
      lwLine(`Einsetzen von c = ${yAH} in f(${xBH}) = ${yBH}:`, false),
      lwLine(`${yBH} = a · ln(${xBH}) + ${yAH}`, true),
      lwLine(`a · ln(${xBH}) = ${yBH} − ${yAH} = ${fH(yB - yA)}`, true),
      lwLine(`<b>a = ${mf(fH(yB - yA), `ln(${xBH})`)} = ${mf(fH(yB - yA), lnXB)} = ${aH}</b>`, true),
      lwLine(''),
      sHead('▶ Ergebnis'),
      lwLine(`f(x) = ${aH} · ln(x) + ${cH}`, true),
      lwLine('')
    );
  } else {
    // Allgemeiner Fall
    const dy = y2 - y1;
    const dyH = fH(dy);
    const ratioH = fH(x2 / x1);
    const lnRatioH = fH(lnDiff);
    const ln1H = fH(Math.log(x1));

    html.push(
      sHead('▶ Schritt 1 — Gleichungssystem aufstellen'),
      lwLine(`${y1H} = a · ln(${x1H}) + c   …(I)`, true),
      lwLine(`${y2H} = a · ln(${x2H}) + c   …(II)`, true),
      lwLine(''),
      sHead('▶ Schritt 2 — Subtraktion (II) − (I) &nbsp;→ c fällt weg'),
      lwLine(`${y2H} − ${y1H} = a · ln(${x2H}) − a · ln(${x1H})`, true),
      lwLine(`${dyH} = a · (ln(${x2H}) − ln(${x1H}))`, true),
      lwLine(''),
      lwLine('Logarithmusgesetz: &nbsp; ln(x₂) − ln(x₁) = ln(x₂ / x₁)', false),
      lwLine(`${dyH} = a · ln(${ratioH})`, true),
      lwLine(`<b>a = ${mf(dyH, `ln(${ratioH})`)} = ${mf(dyH, lnRatioH)} = ${aH}</b>`, true),
      lwLine(''),
      sHead('▶ Schritt 3 — c aus Gleichung (I)'),
      lwLine(`c = ${y1H} − ${aH} · ln(${x1H})`, true),
      lwLine(`c = ${y1H} − ${aH} · ${ln1H} = <b>${cH}</b>`, true),
      lwLine(''),
      sHead('▶ Ergebnis'),
      lwLine(`f(x) = ${aH} · ln(x) + ${cH}`, true),
      lwLine('')
    );
  }

  box.innerHTML = html.join('');
  box.style.display = 'block';
}

// ── Exp-Lösungsweg ────────────────────────────────────────────────
function showExpLoesungsweg() {
  const box = document.getElementById('exp-lw-box');
  if (!box) return;
  if (box.style.display === 'block') { box.style.display = ''; return; }

  const subtype = document.getElementById('exp-subtype')?.value;
  if (subtype !== 'exponential') {
    box.innerHTML = '<span style="color:#e24b4a;">Lösungsweg nur für Typ a·b<sup>x</sup> (2 Punkte).</span>';
    box.style.display = 'block'; return;
  }

  const x1 = parseFloat(document.getElementById('exp-x0')?.value);
  const y1 = parseFloat(document.getElementById('exp-y0')?.value);
  const x2 = parseFloat(document.getElementById('exp-x1')?.value);
  const y2 = parseFloat(document.getElementById('exp-y1')?.value);
  if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) {
    box.innerHTML = '<span style="color:#e24b4a;">Bitte zuerst 2 Punkte wählen.</span>';
    box.style.display = 'block'; return;
  }

  function fH(v)  { return fracHTML(v); }
  function fHa(v) { return fracHTML(Math.abs(v)); }
  function lwLine(text, indent) {
    const cls = ['lw-line', indent ? 'lw-indent' : ''].filter(Boolean).join(' ');
    return `<span class="${cls}">${text}</span>`;
  }
  function mf(num, den) {
    return `<span class="mfrac"><span class="mfrac-num">${num}</span><span class="mfrac-den">${den}</span></span>`;
  }
  function sHead(title) {
    return `<span class="lw-line" style="display:block;font-weight:700;font-size:11.5px;`
         + `color:var(--active-border);padding-top:2px;letter-spacing:.02em;">${title}</span>`;
  }

  const dx  = x2 - x1;
  const b   = Math.exp((Math.log(Math.abs(y2)) - Math.log(Math.abs(y1))) / dx);
  const a   = y1 / Math.pow(b, x1);

  const x1H = fH(x1), y1H = fH(y1), x2H = fH(x2), y2H = fH(y2);
  const bH  = fH(b),  aH  = fH(a);

  // Sonderfall: ein Punkt liegt auf der y-Achse (x = 0)
  const p1OnY = Math.abs(x1) < 1e-12;
  const p2OnY = Math.abs(x2) < 1e-12;
  const html  = [sHead(`P₁(${x1H} | ${y1H})  und  P₂(${x2H} | ${y2H})`), lwLine('')];

  if (p1OnY || p2OnY) {
    // ── Sonderfall: a direkt ablesen ──────────────────────────────
    // Normalisieren: yAxis-Punkt = (xA, yA), anderer Punkt = (xB, yB)
    const [xA, yA, xB, yB] = p1OnY ? [x1, y1, x2, y2] : [x2, y2, x1, y1];
    const xAH = fH(xA), yAH = fH(yA), xBH = fH(xB), yBH = fH(yB);
    const ratioAbs = Math.abs(yB / yA);
    const ratioH   = fH(ratioAbs);
    const xBAbsH   = fHa(xB);

    html.push(
      sHead('▶ Sonderfall: Punkt auf der y-Achse'),
      lwLine(`Da x = ${xAH} gilt: &nbsp; f(${xAH}) = a · b<sup>${xAH}</sup> = a · 1 = a`, true),
      lwLine(`<b>→  a = ${yAH}</b>`, true),
      lwLine(''),
      sHead('▶ Schritt 2 — Basis b durch Wurzelziehen'),
      lwLine(`Einsetzen von a = ${yAH} in f(${xBH}) = ${yBH}:`, false),
      lwLine(`${yBH} = ${yAH} · b<sup>${xBH}</sup>`, true),
      lwLine(`b<sup>${xBH}</sup> = ${mf(yBH, yAH)} = ${ratioH}`, true),
      lwLine(''),
      lwLine(`${xBAbsH}-te Wurzel auf beiden Seiten:`, false),
      lwLine(`<b>b = <sup>${xBAbsH}</sup>√<span style="text-decoration:overline;padding:0 2px">${ratioH}</span> = ${bH}</b>`, true),
      lwLine(''),
      sHead('▶ Ergebnis'),
      lwLine(`f(x) = ${aH} · ${bH}<sup>x</sup>`, true),
      lwLine('')
    );

  } else {
    // ── Kein Punkt auf der y-Achse → kein Lösungsweg ─────────────
    box.innerHTML = '<span style="color:#e24b4a;">Lösungsweg nur verfügbar, wenn einer der beiden Punkte auf der y-Achse liegt (x = 0).</span>';
    box.style.display = 'block'; return;
  }

  box.innerHTML = html.join('');
  box.style.display = 'block';
}

// ── Potenz- und Wurzelfunktionen ──────────────────────────────────
function powerUpdateInputs() {
  const subtype = document.getElementById('power-subtype')?.value || 'positive power';
  const cfg = FIT_CONFIG[subtype];
  buildPanelInputs('power-inputs', cfg.labels, 'pow');
  if (powerPanelDef) {
    powerPanelDef.nPts = cfg.pts;
    powerPanelDef.labels = cfg.labels;
  }
  const hint = document.getElementById('power-hint');
  if (hint) {
    if      (subtype === 'positive power') hint.textContent = 'a·xⁿ — 2 Punkte (x > 0, y > 0)';
    else if (subtype === 'negative power') hint.textContent = 'a/(x−v)ⁿ+h — 3 Punkte';
    else                                   hint.textContent = 'a·√(x−v)+h — P₁ = Startpunkt';
  }
  const res = document.getElementById('power-result');
  if (res) res.textContent = '';
  if (fitPickMode && fitPickPanel === powerPanelDef) genericStopPick();
}
function powerTogglePick() { genericTogglePick(powerPanelDef); }
function powerCompute()    { genericPanelCompute(powerPanelDef); }

// ── Fit-Punkte: suchen + neu berechnen ───────────────────────────

// Sucht den nächstgelegenen Fit-Punkt aller Funktionen (14px Radius)
function findNearFitPt(mx, my) {
  let best = null, bestDist = 14;
  functions.forEach((fn, fi) => {
    if (!fn.fitPts || fn.visible === false) return;
    fn.fitPts.forEach((pt, pi) => {
      const { cx, cy } = toCanvas(pt.x, pt.y);
      const d = Math.hypot(cx - mx, cy - my);
      if (d < bestDist) { bestDist = d; best = { fi, pi }; }
    });
  });
  return best;
}

// Lookup: fitType → Sidebar-Prefix
const FIT_PREFIX = {
  linear: 'lin', quadratic: 'quad', vertex: 'quad', roots: 'quad',
  exponential: 'exp', exponential_h: 'exp',
  logarithm: 'log', logarithm_vh: 'log',
  'positive power': 'pow', 'negative power': 'pow', 'square root': 'pow',
};

// Berechnet die Funktion fi aus ihren gespeicherten fitPts neu.
// Aktualisiert: Ausdruck, Sidebar-Inputs, Result-Div, Steigungsdreieck, Asymptote, Lösungsweg.
function recomputeFitFn(fi) {
  const fn = functions[fi];
  if (!fn || !fn.fitType || !fn.fitPts) return false;
  try {
    const result = computeByType(fn.fitType, fn.fitPts);
    fn.expr = result.expr;
    clearEvalCache();
    renderFuncList(); // Eingabefeld live aktualisieren

    // Asymptote auf panelDef aktualisieren
    if (result.asymptote !== undefined) {
      if (expPanelDef?.lastFi === fi) expPanelDef.lastAsymptote = result.asymptote;
      if (logPanelDef?.lastFi === fi) logPanelDef.lastAsymptote = result.asymptote;
    }

    // Steigungsdreieck für lineare Funktionen
    if (fn.fitType === 'linear' && fn.fitPts.length >= 2) {
      slopeTriPtsMap[fi] = [{ x: fn.fitPts[0].x, fi }, { x: fn.fitPts[1].x, fi }];
    }

    // Sidebar-Inputs + Result-Div aktualisieren
    const prefix = FIT_PREFIX[fn.fitType];
    if (prefix) {
      fn.fitPts.forEach((pt, i) => {
        const xi = document.getElementById(`${prefix}-x${i}`);
        const yi = document.getElementById(`${prefix}-y${i}`);
        if (xi) xi.value = parseFloat(pt.x.toFixed(4));
        if (yi) yi.value = parseFloat(pt.y.toFixed(4));
      });
      const resEl = document.getElementById(`${prefix}-result`);
      if (resEl) { resEl.style.color = '#1D9E75'; resEl.textContent = '✓ ' + result.display; }
    }

    // Offene Lösungsweg-Boxen live aktualisieren
    if (fn.fitType === 'linear') {
      const b = document.getElementById('loesungsweg-box');
      if (b?.style.display === 'block') showLoesungsweg();
    }
    if (fn.fitType === 'exponential') {
      const b = document.getElementById('exp-lw-box');
      if (b?.style.display === 'block') showExpLoesungsweg();
    }
    if (fn.fitType === 'logarithm') {
      const b = document.getElementById('log-lw-box');
      if (b?.style.display === 'block') showLogLoesungsweg();
    }
    if (['quadratic', 'vertex', 'roots'].includes(fn.fitType)) {
      const sp = document.getElementById('quad-sp-box');
      if (sp?.style.display === 'block') showQuadScheitelpunkt();
      const ns = document.getElementById('quad-ns-box');
      if (ns?.style.display === 'block') showQuadNullstellen();
    }

    return true;
  } catch(e) {
    return false; // z.B. Punkt in ungültigem Bereich
  }
}

// ── Hilfsfunktionen für Formatierung ─────────────────────────────

function fitNice(v) {
  if (!isFinite(v)) return String(v);
  if (Math.abs(v) < 1e-9) return '0';
  if (Math.abs(v - Math.round(v)) < 0.005) return String(Math.round(v));
  const neg = v < 0, absV = Math.abs(v);
  const tol = absV * 0.005;
  for (let q = 2; q <= 12; q++) {
    const p = Math.round(absV * q);
    if (p > 0 && Math.abs(p / q - absV) < tol) {
      const g = gcdFrac(p, q);
      return (neg ? '-' : '') + (p / g) + '/' + (q / g);
    }
  }
  return parseFloat(v.toPrecision(3)).toString();
}

function fitFrac(v) {
  if (!isFinite(v)) return String(v);
  if (Math.abs(v - Math.round(v)) < 1e-6) return String(Math.round(v));
  const f = numToFrac(v);
  if (f) return f;
  const rounded = parseFloat(v.toPrecision(4));
  if (Math.abs(rounded - Math.round(rounded)) < 1e-6) return String(Math.round(rounded));
  const neg = rounded < 0, absR = Math.abs(rounded);
  const tol = absR * 0.005;
  for (let q = 2; q <= 20; q++) {
    const p = Math.round(absR * q);
    if (p > 0 && Math.abs(p / q - absR) < tol) {
      const g = gcdFrac(p, q);
      return (neg ? '-' : '') + (p / g) + '/' + (q / g);
    }
  }
  return rounded.toString();
}

function fitFracAbs(v) { return fitFrac(Math.abs(v)); }

function fitCoef(v) {
  const s = fitFrac(v);
  return s.includes('/') ? `(${s})` : s;
}

function fitFmtLinear(a, b) {
  const am = Math.abs(a - 1) < 1e-9, amp = Math.abs(a + 1) < 1e-9;
  const apart = am ? 'x' : amp ? '-x' : `${fitCoef(a)}*x`;
  if (Math.abs(b) < 1e-10) return apart;
  const bf = fitFrac(Math.abs(b));
  const bPart = b < 0 ? `-(${bf})` : bf.includes('/') ? `+(${bf})` : `+${bf}`;
  return `${apart}${bPart}`;
}

// Formatiert ax² + bx + c — Vorzeichen aussen, b=±1 → ±x
function fitFmtQuad(a, b, c) {
  let s;
  if      (Math.abs(a - 1) < 1e-9)  { s = 'x^2'; }
  else if (Math.abs(a + 1) < 1e-9)  { s = '-x^2'; }
  else {
    const af = fitFracAbs(a);
    const ap = af.includes('/') ? `(${af})` : af;
    s = (a < 0 ? `-${ap}` : `${ap}`) + '*x^2';
  }
  if (Math.abs(b) > 1e-10) {
    if      (Math.abs(b - 1) < 1e-9)  { s += '+x'; }
    else if (Math.abs(b + 1) < 1e-9)  { s += '-x'; }
    else {
      const bf = fitFracAbs(b);
      const bp = bf.includes('/') ? `(${bf})` : bf;
      s += (b < 0 ? `-${bp}` : `+${bp}`) + '*x';
    }
  }
  if (Math.abs(c) > 1e-10) {
    const cf = fitFracAbs(c);
    const cp = cf.includes('/') ? `(${cf})` : cf;
    s += c < 0 ? `-${cp}` : `+${cp}`;
  }
  return s;
}

// Formatiert a(x−s)² + t — Vorzeichen aussen
function fitFmtVertex(a, s, t) {
  const inner = Math.abs(s) < 1e-10 ? 'x' : (s < 0 ? `x+${fitFracAbs(s)}` : `x-${fitFracAbs(s)}`);
  let expr;
  if      (Math.abs(a - 1) < 1e-9)  { expr = `(${inner})^2`; }
  else if (Math.abs(a + 1) < 1e-9)  { expr = `-(${inner})^2`; }
  else {
    const af = fitFracAbs(a);
    const ap = af.includes('/') ? `(${af})` : af;
    expr = (a < 0 ? `-${ap}` : `${ap}`) + `*(${inner})^2`;
  }
  if (Math.abs(t) > 1e-10) {
    const tf = fitFracAbs(t);
    const tp = tf.includes('/') ? `(${tf})` : tf;
    expr += t < 0 ? `-${tp}` : `+${tp}`;
  }
  return expr;
}

// Formatiert a·(x−x₁)·(x−x₂) — Nullstellenform
function fitFmtRoots(a, x1, x2) {
  const f1 = Math.abs(x1) < 1e-10 ? 'x' : `(x${x1 < 0 ? '+' + fitFracAbs(x1) : '-' + fitFracAbs(x1)})`;
  const f2 = Math.abs(x2) < 1e-10 ? 'x' : `(x${x2 < 0 ? '+' + fitFracAbs(x2) : '-' + fitFracAbs(x2)})`;
  if (Math.abs(a - 1) < 1e-9) return `${f1}*${f2}`;
  return `${fitCoef(a)}*${f1}*${f2}`;
}

// Gauss-Elimination für 3×3-System (augmentierte Matrix 3×4)
function gaussElim3(M) {
  for (let col = 0; col < 3; col++) {
    let maxRow = col, maxVal = Math.abs(M[col][col]);
    for (let row = col+1; row < 3; row++) {
      if (Math.abs(M[row][col]) > maxVal) { maxVal = Math.abs(M[row][col]); maxRow = row; }
    }
    if (maxVal < 1e-12) return null;
    [M[col], M[maxRow]] = [M[maxRow], M[col]];
    for (let row = col+1; row < 3; row++) {
      const f = M[row][col] / M[col][col];
      for (let k = col; k <= 3; k++) M[row][k] -= f * M[col][k];
    }
  }
  const x = [0, 0, 0];
  for (let i = 2; i >= 0; i--) {
    x[i] = M[i][3];
    for (let j = i+1; j < 3; j++) x[i] -= M[i][j] * x[j];
    x[i] /= M[i][i];
  }
  return x;
}

// ═══════════════════════════════════════════════════════════════════
// LÖSUNGSWEG FÜR QUADRATISCHE FUNKTIONEN
// ═══════════════════════════════════════════════════════════════════

function showQuadScheitelpunkt() {
  const box = document.getElementById('quad-sp-box');
  if (!box) return;
  if (box.style.display === 'block') { box.style.display = ''; return; }

  function fH(v)  { return fracHTML(v); }
  function fHa(v) { return fracHTML(Math.abs(v)); }
  function lwLine(text, indent, heading) {
    const cls = ['lw-line', indent ? 'lw-indent' : '', heading ? 'lw-heading' : ''].filter(Boolean).join(' ');
    return `<span class="${cls}">${text}</span>`;
  }
  function mf(num, den) {
    return `<span class="mfrac"><span class="mfrac-num">${num}</span><span class="mfrac-den">${den}</span></span>`;
  }
  function sHead(title) {
    return `<span class="lw-line" style="display:block;font-weight:700;font-size:11.5px;`
         + `color:var(--active-border);padding-top:2px;letter-spacing:.02em;">${title}</span>`;
  }
  // Nullstellenform: genau zwei (x±n)-Faktoren (muss VOR isVertexExpr geprüft werden)
  function isRootsExpr(expr) {
    const e = expr.replace(/\s/g, '');
    return (e.match(/\(x[+\-]/g) || []).length === 2;
  }
  // Scheitelpunktsform: (x±n)^2 — explizit ^2 verlangen, damit Nullstellenform nicht matcht
  function isVertexExpr(expr) {
    const e = expr.replace(/\s/g, '');
    return /\(x[+\-][^)]*\)\^2/.test(e) || /\(x\)\^2/.test(e);
  }

  const quadFuncs = functions.map((fn, fi) => ({ fn, fi }))
    .filter(({ fn }) => fn && fn.expr.trim() && isQuadraticFunc(fn.expr));

  if (!quadFuncs.length) {
    box.innerHTML = '<span style="color:#e24b4a;">Keine quadratische Funktion vorhanden.</span>';
    box.style.display = 'block';
    return;
  }

  const html = [];

  for (const { fn, fi } of quadFuncs) {
    const abc = extractQuadABC(fn.expr);
    if (!abc) continue;
    const { a, b, c } = abc;
    const aH = fH(a), bH = fH(b), cH = fH(c);

    // Funktions-Header
    let hdr = '';
    if      (Math.abs(a - 1) < 1e-9)  hdr = 'x²';
    else if (Math.abs(a + 1) < 1e-9)  hdr = '−x²';
    else                               hdr = `${aH}·x²`;
    if (Math.abs(b) > 1e-9) hdr += b > 0 ? ` + ${bH}·x` : ` − ${fHa(b)}·x`;
    if (Math.abs(c) > 1e-9) hdr += c > 0 ? ` + ${cH}`   : ` − ${fHa(c)}`;
    html.push(lwLine(`── f<sub>${fi+1}</sub>(x) = ${hdr} ──`, false, true));
    html.push(lwLine(''));

    const rootsForm  = isRootsExpr(fn.expr);
    const vertexForm = !rootsForm && isVertexExpr(fn.expr);
    const s = -b / (2 * a);
    // y_S = c − b²/(4a)  (exakt; gilt für alle drei Formen)
    const tVal = c - (b * b) / (4 * a);
    const sH = fH(s), tH = fH(tVal);

    // Für Nullstellenform: Nullstellen aus abc-Koeffizienten
    let rLow, rHigh;
    if (rootsForm) {
      const Dr = b*b - 4*a*c, sqDr = Math.sqrt(Math.max(Dr, 0));
      const r1 = (-b - sqDr)/(2*a), r2 = (-b + sqDr)/(2*a);
      rLow = Math.min(r1, r2); rHigh = Math.max(r1, r2);
    }

    // ══════════════════════ SCHEITELPUNKT ══════════════════════
    html.push(sHead('▶ Scheitelpunkt'));
    html.push(lwLine(''));

    if (vertexForm) {
      html.push(lwLine('Direkt ablesbar aus f(x) = a·(x − x<sub>S</sub>)² + y<sub>S</sub>:', false));
      html.push(lwLine(`→  x<sub>S</sub> = ${sH},   y<sub>S</sub> = ${tH}`, true));
    } else if (rootsForm) {
      const rLH = fH(rLow), rHH = fH(rHigh);
      html.push(lwLine('Mittelwert der Nullstellen:', false));
      html.push(lwLine(`x<sub>S</sub> = ${mf('x₁ + x₂', '2')} = ${mf(`${rLH} + ${rHH}`, '2')} = ${sH}`, true));
      html.push(lwLine(''));
      // y_S: Funktion an x_S auswerten — Zwischenschritt zeigen
      const d1 = s - rLow;                  // > 0
      const d2 = s - rHigh;                 // < 0, in Klammern
      const d1H = fH(d1), d2H = `(${fH(d2)})`;
      let yCalc;
      if      (Math.abs(a - 1) < 1e-9) yCalc = `${d1H}·${d2H}`;
      else if (Math.abs(a + 1) < 1e-9) yCalc = `(−1)·${d1H}·${d2H}`;
      else                              yCalc = `${aH}·${d1H}·${d2H}`;
      html.push(lwLine(`y<sub>S</sub> = f(x<sub>S</sub>) = ${yCalc} = ${tH}`, true));
    } else {
      // Normalform: Formel x_S = −b/(2a),  y_S = c − b²/(4a)
      const negBH = fH(-b), twoAH = fH(2 * a);
      const b2H   = fH(b * b), fourAH = fH(4 * a);
      html.push(lwLine(`x<sub>S</sub> = ${mf('−b', '2a')} = ${mf(negBH, twoAH)} = ${sH}`, true));
      html.push(lwLine(''));
      html.push(lwLine(`y<sub>S</sub> = c − ${mf('b²', '4a')} = ${cH} − ${mf(b2H, fourAH)} = ${tH}`, true));
    }
    html.push(lwLine(''));
    html.push(lwLine(`S = (${sH} | ${tH})`, true));

    // Scheitelpunktform für Normal- und Nullstellenform anzeigen
    if (!vertexForm) {
      html.push(lwLine(''));
      const inner = Math.abs(s) < 1e-10 ? 'x' : (s < 0 ? `x + ${fHa(s)}` : `x − ${sH}`);
      let spform;
      if      (Math.abs(a - 1) < 1e-9)  spform = `(${inner})²`;
      else if (Math.abs(a + 1) < 1e-9)  spform = `−(${inner})²`;
      else                               spform = `${aH}·(${inner})²`;
      if (Math.abs(tVal) > 1e-9) spform += tVal > 0 ? ` + ${tH}` : ` − ${fHa(tVal)}`;
      html.push(lwLine(`→ Scheitelpunktform: f<sub>${fi+1}</sub>(x) = ${spform}`, true));
    }
    html.push(lwLine(''));
  }

  box.innerHTML = html.join('');
  box.style.display = 'block';
}

function showQuadNullstellen() {
  const box = document.getElementById('quad-ns-box');
  if (!box) return;
  if (box.style.display === 'block') { box.style.display = ''; return; }

  function fH(v)  { return fracHTML(v); }
  function fHa(v) { return fracHTML(Math.abs(v)); }
  function lwLine(text, indent, heading) {
    const cls = ['lw-line', indent ? 'lw-indent' : '', heading ? 'lw-heading' : ''].filter(Boolean).join(' ');
    return `<span class="${cls}">${text}</span>`;
  }
  function mf(num, den) {
    return `<span class="mfrac"><span class="mfrac-num">${num}</span><span class="mfrac-den">${den}</span></span>`;
  }
  function sHead(title) {
    return `<span class="lw-line" style="display:block;font-weight:700;font-size:11.5px;`
         + `color:var(--active-border);padding-top:2px;letter-spacing:.02em;">${title}</span>`;
  }
  function isNice(v) {
    if (!isFinite(v)) return false;
    if (Math.abs(v - Math.round(v)) < 1e-6) return true;
    const abs = Math.abs(v);
    for (let q = 2; q <= 12; q++) {
      const p = Math.round(abs * q);
      if (p > 0 && Math.abs(p / q - abs) < 5e-6) return true;
    }
    return false;
  }
  function intRadStr(n) {
    const sqN = Math.sqrt(n);
    if (Math.abs(sqN - Math.round(sqN)) < 1e-6) return String(Math.round(sqN));
    let factor = 1, rest = n;
    for (let k = 2; k * k <= rest; k++) {
      while (rest % (k * k) === 0) { factor *= k; rest = rest / (k * k); }
    }
    return (rest === 1) ? String(factor) : (factor > 1 ? `${factor}·√${rest}` : `√${n}`);
  }
  function radStr(k) {
    if (k < 0) return '—';
    if (Math.abs(k) < 1e-9) return '0';
    const sqK = Math.sqrt(k);
    if (Math.abs(sqK - Math.round(sqK)) < 1e-6) return fH(Math.round(sqK));
    const fr = asSimpleFrac(k);
    if (fr && fr.includes('/')) {
      const sl = fr.lastIndexOf('/');
      const p = parseFloat(fr.slice(0, sl)), q = parseFloat(fr.slice(sl + 1));
      if (Number.isInteger(p) && Number.isInteger(q) && p > 0 && q > 0) {
        const sqQ = Math.sqrt(q);
        if (Math.abs(sqQ - Math.round(sqQ)) < 1e-6) {
          const sqQi = Math.round(sqQ);
          return sqQi === 1 ? intRadStr(p) : `${intRadStr(p)}/${sqQi}`;
        }
      }
    }
    const ki = Math.round(k);
    if (Math.abs(k - ki) < 1e-6 && ki > 0) return intRadStr(ki);
    return `√(${fH(k)})`;
  }
  // Nullstellenform: genau zwei (x±n)-Faktoren (muss VOR isVertexExpr geprüft werden)
  function isRootsExpr(expr) {
    const e = expr.replace(/\s/g, '');
    return (e.match(/\(x[+\-]/g) || []).length === 2;
  }
  // Scheitelpunktsform: (x±n)^2 — explizit ^2 verlangen, damit Nullstellenform nicht matcht
  function isVertexExpr(expr) {
    const e = expr.replace(/\s/g, '');
    return /\(x[+\-][^)]*\)\^2/.test(e) || /\(x\)\^2/.test(e);
  }

  const quadFuncs = functions.map((fn, fi) => ({ fn, fi }))
    .filter(({ fn }) => fn && fn.expr.trim() && isQuadraticFunc(fn.expr));

  if (!quadFuncs.length) {
    box.innerHTML = '<span style="color:#e24b4a;">Keine quadratische Funktion vorhanden.</span>';
    box.style.display = 'block';
    return;
  }

  const html = [];

  for (const { fn, fi } of quadFuncs) {
    const abc = extractQuadABC(fn.expr);
    if (!abc) continue;
    const { a, b, c } = abc;
    const aH = fH(a), bH = fH(b), cH = fH(c);

    // Funktions-Header
    let hdr = '';
    if      (Math.abs(a - 1) < 1e-9)  hdr = 'x²';
    else if (Math.abs(a + 1) < 1e-9)  hdr = '−x²';
    else                               hdr = `${aH}·x²`;
    if (Math.abs(b) > 1e-9) hdr += b > 0 ? ` + ${bH}·x` : ` − ${fHa(b)}·x`;
    if (Math.abs(c) > 1e-9) hdr += c > 0 ? ` + ${cH}`   : ` − ${fHa(c)}`;
    html.push(lwLine(`── f<sub>${fi+1}</sub>(x) = ${hdr} ──`, false, true));
    html.push(lwLine(''));

    const rootsForm  = isRootsExpr(fn.expr);
    const vertexForm = !rootsForm && isVertexExpr(fn.expr);
    const s = -b / (2 * a);
    const tVal = c - (b * b) / (4 * a);
    const sH = fH(s);

    // ══════════════════════ NULLSTELLEN ══════════════════════
    html.push(sHead('▶ Nullstellen'));
    html.push(lwLine(''));

    if (vertexForm) {
      // Scheitelpunktsform → algebraisch umformen
      const k     = -tVal / a;
      const kH    = fH(k);
      const sqK   = Math.sqrt(Math.max(k, 0));
      const xA    = s - sqK, xB = s + sqK;
      const xAH   = fH(xA),  xBH = fH(xB);
      // sDisp: x_S in Klammern wenn negativ (verhindert "x − -8")
      const sDisp = s < 0 ? `(${sH})` : sH;

      if (k < -1e-9) {
        html.push(lwLine(`a·(x − x<sub>S</sub>)² + y<sub>S</sub> = 0`, true));
        html.push(lwLine(`(x − ${sDisp})² = ${kH} &lt; 0`, true));
        html.push(lwLine('Keine reellen Nullstellen.', true));
      } else if (Math.abs(k) < 1e-9) {
        html.push(lwLine(`a·(x − x<sub>S</sub>)² + y<sub>S</sub> = 0`, true));
        html.push(lwLine(`(x − ${sDisp})² = 0`, true));
        html.push(lwLine(`Doppelnullstelle:  x₀ = x<sub>S</sub> = ${sH}`, true));
      } else {
        const sqKstr = radStr(k);
        html.push(lwLine(`a·(x − x<sub>S</sub>)² + y<sub>S</sub> = 0`, true));
        html.push(lwLine(`(x − ${sDisp})² = ${kH}`, true));
        html.push(lwLine(`x − ${sDisp} = ±${sqKstr}`, true));
        html.push(lwLine(''));
        html.push(lwLine(`x₁ = ${sH} − ${sqKstr} = ${xAH}`, true));
        html.push(lwLine(`x₂ = ${sH} + ${sqKstr} = ${xBH}`, true));
      }

    } else if (rootsForm) {
      // Nullstellenform: direkt ablesen
      const Dr = b*b - 4*a*c, sqDr = Math.sqrt(Math.max(Dr, 0));
      const r1 = (-b - sqDr)/(2*a), r2 = (-b + sqDr)/(2*a);
      const rLow = Math.min(r1, r2), rHigh = Math.max(r1, r2);
      const rLH = fH(rLow), rHH = fH(rHigh);
      html.push(lwLine('Direkt ablesbar aus f(x) = a·(x − x₁)·(x − x₂):', false));
      html.push(lwLine(`f(x) = 0  →  x − x₁ = 0  oder  x − x₂ = 0`, true));
      html.push(lwLine(''));
      html.push(lwLine(`x₁ = ${rLH},   x₂ = ${rHH}`, true));

    } else {
      // Normalform: Mitternachtsformel oder Faktorisieren
      const D    = b * b - 4 * a * c;
      const DH   = fH(D);
      const sqD  = Math.sqrt(Math.max(D, 0));
      const xP   = (-b + sqD) / (2 * a);   // x₁ (mit + √D)
      const xM   = (-b - sqD) / (2 * a);   // x₂ (mit − √D)
      const xPH  = fH(xP), xMH = fH(xM);
      const negBH = fH(-b), twoAH = fH(2 * a);

      // Diskriminante (Vorzeichen sicher darstellen)
      const b2  = b * b, fac = 4 * a * c;
      let dCalc;
      if      (Math.abs(fac) < 1e-9) dCalc = `${fH(b2)} = ${DH}`;
      else if (fac > 0)               dCalc = `${fH(b2)} − ${fH(fac)} = ${DH}`;
      else                            dCalc = `${fH(b2)} + ${fH(-fac)} = ${DH}`;

      if (D < -1e-9) {
        // Keine Nullstellen
        html.push(lwLine('Mitternachtsformel:', false));
        html.push(lwLine(`D = b² − 4ac = (${bH})² − 4·(${aH})·(${cH}) = ${dCalc}`, true));
        html.push(lwLine('D &lt; 0  →  Keine reellen Nullstellen.', true));

      } else if (Math.abs(D) < 1e-9) {
        // Doppelnullstelle
        html.push(lwLine('Mitternachtsformel:', false));
        html.push(lwLine(`D = b² − 4ac = (${bH})² − 4·(${aH})·(${cH}) = 0`, true));
        html.push(lwLine(`D = 0  →  Doppelnullstelle:`, true));
        html.push(lwLine(`x₀ = ${mf('−b', '2a')} = ${mf(negBH, twoAH)} = ${xPH}`, true));

      } else if (isNice(xP) && isNice(xM)) {
        // Faktorisieren (im Kopf möglich, Vieta)
        const xSmall = Math.min(xP, xM), xLarge = Math.max(xP, xM);
        const xSH = fH(xSmall), xLH = fH(xLarge);
        html.push(lwLine('Faktorisieren (im Kopf möglich):', false));
        if (Math.abs(a - 1) > 1e-9) {
          let mono = 'x²';
          const pa = b / a, qa = c / a;
          if (Math.abs(pa) > 1e-9) mono += pa > 0 ? ` + ${fH(pa)}·x` : ` − ${fHa(pa)}·x`;
          if (Math.abs(qa) > 1e-9) mono += qa > 0 ? ` + ${fH(qa)}`   : ` − ${fHa(qa)}`;
          html.push(lwLine(`÷ ${aH}:   ${mono} = 0`, true));
        }
        const sumR = fH(-b / a), prodR = fH(c / a);
        html.push(lwLine(`Gesucht: x₁, x₂  mit  x₁ + x₂ = ${sumR}  und  x₁ · x₂ = ${prodR}`, true));
        html.push(lwLine(`Durch Probieren:  x₁ = ${xSH},   x₂ = ${xLH}`, true));
        const sv = fH(xSmall + xLarge), pv = fH(xSmall * xLarge);
        html.push(lwLine(`Probe:  ${xSH} + ${xLH} = ${sv} ✓   |   ${xSH} · ${xLH} = ${pv} ✓`, true));
        html.push(lwLine(''));
        const fp1 = xSmall < 0 ? `(x + ${fHa(xSmall)})` : (Math.abs(xSmall) < 1e-9 ? 'x' : `(x − ${xSH})`);
        const fp2 = xLarge < 0 ? `(x + ${fHa(xLarge)})` : (Math.abs(xLarge) < 1e-9 ? 'x' : `(x − ${xLH})`);
        const aFact = Math.abs(a - 1) < 1e-9 ? '' : (Math.abs(a + 1) < 1e-9 ? '−' : `${aH}·`);
        html.push(lwLine(`f<sub>${fi+1}</sub>(x) = ${aFact}${fp1}·${fp2}`, true));
        html.push(lwLine(''));
        html.push(lwLine(`Nullstellen:  x₁ = ${xSH},   x₂ = ${xLH}`, true));

      } else {
        // Mitternachtsformel (vollständig)
        const sqDstr = radStr(D);
        html.push(lwLine('Mitternachtsformel:', false));
        html.push(lwLine(`D = b² − 4ac = (${bH})² − 4·(${aH})·(${cH}) = ${dCalc}`, true));
        html.push(lwLine(''));
        html.push(lwLine(`x<sub>1,2</sub> = ${mf('−b ± √D', '2a')} = ${mf(`${negBH} ± ${sqDstr}`, twoAH)}`, true));
        html.push(lwLine(''));
        html.push(lwLine(`x₁ = ${mf(`${negBH} + ${sqDstr}`, twoAH)} = ${xPH}`, true));
        html.push(lwLine(`x₂ = ${mf(`${negBH} − ${sqDstr}`, twoAH)} = ${xMH}`, true));
      }
    }

    html.push(lwLine(''));
  }

  box.innerHTML = html.join('');
  box.style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════════
// LÖSUNGSWEG FÜR GERADEN DURCH 2 PUNKTE
// ═══════════════════════════════════════════════════════════════════

function showLoesungsweg() {
  const box = document.getElementById('loesungsweg-box');
  if (!box) return;
  if (box.style.display === 'block') { box.style.display = ''; return; }

  function fH(v) { return fracHTML(v); }
  function parenH(v) { return v < 0 ? `(${fH(v)})` : fH(v); }
  function signH(v) { return v >= 0 ? `+ ${fH(v)}` : `- ${fH(Math.abs(v))}`; }
  function lwLine(text, indent, heading) {
    const cls = ['lw-line', indent ? 'lw-indent' : '', heading ? 'lw-heading' : ''].filter(Boolean).join(' ');
    return `<span class="${cls}">${text}</span>`;
  }

  const linFuncs = functions.map((fn, fi) => ({ fn, fi }))
    .filter(({ fn }) => fn && fn.expr.trim() && isLinearFunc(fn.expr));

  if (linFuncs.length === 0) {
    box.innerHTML = '<span style="color:#e24b4a;">' + t('no_line_yet') + '</span>';
    box.style.display = 'block'; return;
  }

  const html = [];
  linFuncs.forEach(({ fn, fi }) => {
    const m = deriv1(fn.expr, 0);
    const b = safeEval(fn.expr, 0);
    if (!isFinite(m) || !isFinite(b)) return;
    const mH = fH(m), bH = fH(b);

    const ll = linkedLines.find(l => l.fi === fi);
    const stPts = slopeTriPtsMap[fi];
    let ptA = null, ptB = null;
    if (ll && points[ll.pi1] && points[ll.pi2]) {
      ptA = points[ll.pi1]; ptB = points[ll.pi2];
    } else if (stPts && stPts.length === 2) {
      const xA = stPts[0].x, xB = stPts[1].x;
      const yA = safeEval(fn.expr, xA), yB = safeEval(fn.expr, xB);
      if (isFinite(yA) && isFinite(yB)) { ptA = { x: xA, y: yA }; ptB = { x: xB, y: yB }; }
    }
    // Fallback: lin-Panel-Eingabefelder (nach linCompute())
    if (!ptA) {
      const lx0 = parseFloat(document.getElementById('lin-x0')?.value);
      const ly0 = parseFloat(document.getElementById('lin-y0')?.value);
      const lx1 = parseFloat(document.getElementById('lin-x1')?.value);
      const ly1 = parseFloat(document.getElementById('lin-y1')?.value);
      if (isFinite(lx0) && isFinite(ly0) && isFinite(lx1) && isFinite(ly1)) {
        ptA = { x: lx0, y: ly0 }; ptB = { x: lx1, y: ly1 };
      }
    }

    if (ptA && ptB) {
      const dx = ptB.x - ptA.x, dy = ptB.y - ptA.y;
      const x1H = fH(ptA.x), y1H = fH(ptA.y), x2H = fH(ptB.x), y2H = fH(ptB.y);
      const dyH = fH(dy), dxH = fH(dx);
      const x1Ps = parenH(ptA.x), y1Ps = parenH(ptA.y);
      const mx1 = m * ptA.x;
      const mx1sign = mx1 >= 0 ? `− ${fH(Math.abs(mx1))}` : `+ ${fH(Math.abs(mx1))}`;
      html.push(
        lwLine(`── f<sub>${fi+1}</sub>(x): ${t('lw_two_pts')} (${x1H}|${y1H}) ${t('lw_and')} (${x2H}|${y2H}) ──`, false, true),
        lwLine(''),
        lwLine(`${t('lw_slope')}:`),
        lwLine(`m = <span class="mfrac"><span class="mfrac-num">y₂ − y₁</span><span class="mfrac-den">x₂ − x₁</span></span>`, true),
        lwLine(`= <span class="mfrac"><span class="mfrac-num">${y2H} − ${y1Ps}</span><span class="mfrac-den">${x2H} − ${x1Ps}</span></span>`, true),
        lwLine(`= <span class="mfrac"><span class="mfrac-num">${dyH}</span><span class="mfrac-den">${dxH}</span></span> = ${mH}`, true),
        lwLine(''),
        lwLine(`${t('lw_intercept')}:`),
        lwLine(`${t('lw_insert')} P₁=(${x1H}|${y1H}) in  y = m·x + q:`, true),
        lwLine(`${y1H} = ${mH}·${x1Ps} + q`, true),
        lwLine(`q = ${y1H} ${mx1sign}`, true),
        lwLine(`q = ${bH}`, true),
        lwLine(''),
        lwLine(`${t('lw_result')}:`, false, true),
        lwLine(`f<sub>${fi+1}</sub>(x) = ${mH}·x ${signH(b)}`, true),
        lwLine('')
      );
    } else {
      const ns = Math.abs(m) > 1e-9 ? fH(-b/m) : '—';
      html.push(
        lwLine(`── f<sub>${fi+1}</sub>(x) ──`, false, true),
        lwLine(''),
        lwLine(`f<sub>${fi+1}</sub>(x) = ${mH}·x ${signH(b)}`),
        lwLine(''),
        lwLine(`Steigung:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;m = ${mH}`),
        lwLine(`y-Achsenabschnitt:&nbsp;q = ${bH}`),
        lwLine(`Nullstelle:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;x₀ = ${ns}`),
        lwLine('')
      );
    }
  });

  box.innerHTML = html.join('');
  box.style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════════
// INITIALISIERUNG DER PANELS
// ═══════════════════════════════════════════════════════════════════

(function initPanels() {
  // Lineares Panel
  linPanelDef = {
    prefix: 'lin',
    pickBtnId: 'lin-pick-btn',
    statusId: 'lin-pick-status',
    resultId: 'lin-result',
    nPts: FIT_CONFIG.linear.pts,
    labels: FIT_CONFIG.linear.labels,
    pickNext: 0,
    lastExpr: '',
    type: 'linear',
    computeFn: linCompute,
  };

  // Quadratisches Panel
  quadPanelDef = {
    prefix: 'quad',
    pickBtnId: 'quad-pick-btn',
    statusId: 'quad-pick-status',
    resultId: 'quad-result',
    nPts: 3,
    labels: FIT_CONFIG.quadratic.labels,
    pickNext: 0,
    lastExpr: '',
    getCurrentType: () => document.getElementById('quad-subtype')?.value || 'quadratic',
    computeFn: quadCompute,
  };

  // Exponential-Panel
  expPanelDef = {
    prefix: 'exp',
    pickBtnId: 'exp-pick-btn',
    statusId: 'exp-pick-status',
    resultId: 'exp-result',
    nPts: FIT_CONFIG.exponential.pts,
    labels: FIT_CONFIG.exponential.labels,
    pickNext: 0,
    lastExpr: '',
    getCurrentType: () => document.getElementById('exp-subtype')?.value || 'exponential',
    computeFn: expCompute,
  };

  // Logarithmus-Panel
  logPanelDef = {
    prefix: 'log',
    pickBtnId: 'log-pick-btn',
    statusId: 'log-pick-status',
    resultId: 'log-result',
    nPts: FIT_CONFIG.logarithm.pts,
    labels: FIT_CONFIG.logarithm.labels,
    pickNext: 0,
    lastExpr: '',
    getCurrentType: () => document.getElementById('log-subtype')?.value || 'logarithm',
    computeFn: logCompute,
  };

  // Potenz-Panel
  powerPanelDef = {
    prefix: 'pow',
    pickBtnId: 'power-pick-btn',
    statusId: 'power-pick-status',
    resultId: 'power-result',
    nPts: FIT_CONFIG['positive power'].pts,
    labels: FIT_CONFIG['positive power'].labels,
    pickNext: 0,
    lastExpr: '',
    getCurrentType: () => document.getElementById('power-subtype')?.value || 'positive power',
    computeFn: powerCompute,
  };

  // Eingabefelder initial aufbauen
  linUpdateInputs();
  quadUpdateInputs();
  expUpdateInputs();
  logUpdateInputs();
  powerUpdateInputs();
})();

// ═══════════════════════════════════════════════════════════════════
// INITIALISIERUNG
// ═══════════════════════════════════════════════════════════════════

functions.push({ expr: '', color: COLORS[0], visible: true });

renderFuncList();
syncParams();
syncAreaSelects();
computeSpecials();
renderSavedList();
draw();
pushHistory();

// ── Zusammenklappbare Panels ──────────────────────────────────────
document.querySelectorAll('.panel').forEach(panel => {
  const title = panel.querySelector('.panel-title');
  if (!title) return;

  const arrow = document.createElement('span');
  arrow.className = 'panel-arrow';
  arrow.textContent = '▾';
  title.appendChild(arrow);

  const body = document.createElement('div');
  body.className = 'panel-body';
  Array.from(panel.children).forEach(child => {
    if (child !== title) body.appendChild(child);
  });
  panel.appendChild(body);

  // Alle Panels ausser erstes und param-section eingeklappt
  const allPanels = document.querySelectorAll('.panel');
  if (panel !== allPanels[0] && panel.id !== 'param-section') {
    panel.classList.add('collapsed');
  }

  title.addEventListener('click', () => {
    panel.classList.toggle('collapsed');
  });
});
