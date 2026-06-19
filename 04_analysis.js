// ═══════════════════════════════════════════════════════════════════
// MODUL: analysis — Spezielle Punkte & Flächenberechnung
// Enthält:  computeSpecials(), renderSpecialList()
//           toggleArea(), setAreaFromIsects(), computeArea()
// Ändern:  Suchgenauigkeit → SPECIAL_STEPS / AREA_STEPS Konstanten
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// SPEZIELLE PUNKTE BERECHNEN (Extrema, Nullstellen, Wendepunkte, Schnittpunkte)
// ═══════════════════════════════════════════════════════════════════

// Token-basiertes Debounce + Abbruch:
// Jede neue Anfrage erhöht _specialsRunToken → laufende async-Berechnung erkennt
// dass sie veraltet ist und bricht ab (ohne Ergebnis zu schreiben).
let _specialsRunToken = 0;
let _specialsTimer = null;
function scheduleComputeSpecials() {
  clearTimeout(_specialsTimer);
  const token = ++_specialsRunToken;
  _specialsTimer = setTimeout(() => {
    _specialsTimer = null;
    if (token !== _specialsRunToken) return;
    computeSpecials(token);
  }, 120);
}
// Sofortiger Abbruch (bei Drag-Start, Zoom, etc.)
function cancelComputeSpecials() {
  clearTimeout(_specialsTimer);
  _specialsTimer = null;
  _specialsRunToken++;
}

// Berechnet alle speziellen Punkte für alle sichtbaren Funktionen.
// Algorithmus: Abtasten in 'steps' Schritten, Vorzeichenwechsel erkennen,
// dann Bisektionsverfahren für genaue Position (40 Iterationen → ~14 Stellen Genauigkeit).
//
// Anpassen:
// - Mehr Präzision: steps=6000 (langsamer aber genauer)
// - Toleranz für Duplikate: tol=1e-3 (weniger Punkte)
// GCD (ganzzahlig)
function gcdInt(a, b) { a=Math.abs(Math.round(a)); b=Math.abs(Math.round(b)); while(b){const t=b;b=a%b;a=t;} return a||1; }

// Zerlegt D in p²·q (q quadratfrei): gibt {coef:p, radicand:q} zurück
function simplifyRadical(D) {
  if (D <= 0) return null;
  let p = 1, q = Math.round(D);
  for (let k = 2; k * k <= q; k++) {
    while (q % (k*k) === 0) { q = q/(k*k); p *= k; }
  }
  return { coef: p, radicand: q };
}

// Bruch als Text: 3/2 → "3/2", 2/1 → "2"
function fmtExact(num, den) {
  den = den || 1;
  const g = gcdInt(Math.abs(num), Math.abs(den));
  const n = Math.round(num/g), d = Math.round(den/g);
  if (d === 1) return String(n);
  if (d < 0) return `${-n}/${-d}`;
  return `${n}/${d}`;
}

// Versucht analytische Nullstellen für quadratische Ausdrücke (auch mit Dezimal-Koeffizienten).
// Skaliert Koeffizienten auf ganze Zahlen → verhindert Dezimalzahlen im Nenner (z.B. 4.2→42/10).
function tryAnalyticalZerosEx(fi_idx, expr) {
  const a2 = deriv2(expr, 0);
  if (!isFinite(a2) || Math.abs(a2) < 1e-6) return [];
  const a = a2 / 2, b = deriv1(expr, 0), c = safeEval(expr, 0);
  if (!isFinite(a) || !isFinite(b) || !isFinite(c)) return [];
  const check = safeEval(expr, 1);
  if (!isFinite(check) || Math.abs(a + b + c - check) > 0.05) return [];
  const D = b*b - 4*a*c;
  if (D < -1e-8) return [];
  const col = functions[fi_idx] ? functions[fi_idx].color : '#000';

  // Hilfsfunktion: √radicand mit Vinculum (Strich über der Zahl)
  const fmtSqrt = (radicand) =>
    `√<span style="display:inline-block;border-top:1.5px solid currentColor;line-height:1;padding:0 1px;">${radicand}</span>`;

  // Hilfsfunktion: coef·√radicand / den als HTML-Bruch mit Bruchstrich
  // Verwendet display:inline-block + display:block — funktioniert in allen Browsern zuverlässig
  const fmtRadFrac = (coef, radicand, den) => {
    const sqrtPart = radicand === 1 ? '' : fmtSqrt(radicand);
    const coefStr  = (coef === 1 && radicand !== 1) ? '' : String(coef);
    const top = radicand === 1 ? coefStr : `${coefStr}${sqrtPart}`;
    if (den === 1) return top;
    return `<span style="display:inline-block;vertical-align:middle;text-align:center;margin:0 2px;font-size:0.92em;">`
         + `<span style="display:block;border-bottom:1.5px solid currentColor;padding:1px 4px;">${top}</span>`
         + `<span style="display:block;padding:1px 4px;">${den}</span>`
         + `</span>`;
  };

  // Kleinsten Skalierungsfaktor finden, sodass a, b, c ganzzahlig werden
  let scale = 1;
  for (const s of [1, 2, 4, 5, 10, 20, 25, 50, 100, 200, 500]) {
    if ([a, b, c].every(v => Math.abs(v * s - Math.round(v * s)) < 1e-3)) {
      scale = s; break;
    }
  }
  const aI = Math.round(a * scale), bI = Math.round(b * scale), cI = Math.round(c * scale);
  const DInt = bI * bI - 4 * aI * cI;
  if (DInt < 0) return [];

  // Doppelte Nullstelle
  if (DInt === 0) {
    const x0 = -bI / (2 * aI);
    const z = { kind:'zero', fi:fi_idx, x:x0, y:0, col };
    z.exactLabel = `(${fmtExact(-bI, 2 * aI)} | 0)`;
    return [z];
  }

  const sr = simplifyRadical(DInt);
  if (!sr) return [];

  // x = (−bI ± sr.coef·√sr.radicand) / (2·aI) — gemeinsam kürzen
  const den = 2 * aI;
  const numC = -bI, numR = sr.coef;
  const g = gcdInt(gcdInt(Math.abs(numC), numR), Math.abs(den));
  let nc = numC / g, nr = numR / g, d = den / g;

  // Nenner immer positiv (damit Bruchdarstellung eindeutig ist)
  if (d < 0) { nc = -nc; nr = -nr; d = -d; }

  const constStr = fmtExact(nc, d);           // konstanter Anteil als Bruch-Text
  const radHtml  = fmtRadFrac(nr, sr.radicand, d);  // Wurzel-Anteil als HTML (Sidebar)
  // Reintext-Version für Canvas (kein HTML):
  const radText  = d === 1
    ? (nr === 1 ? `√${sr.radicand}` : `${nr}√${sr.radicand}`)
    : (nr === 1 ? `√${sr.radicand}/${d}` : `${nr}√${sr.radicand}/${d}`);

  const xPlus  = (-bI + Math.sqrt(DInt)) / den;
  const xMinus = (-bI - Math.sqrt(DInt)) / den;
  const z1 = { kind:'zero', fi:fi_idx, x:xPlus,  y:0, col };
  const z2 = { kind:'zero', fi:fi_idx, x:xMinus, y:0, col };

  // HTML-Label (Sidebar/Tooltip) — mit Bruchstrich
  const mkLbl = (pm) => {
    if (constStr === '0') return `(${pm > 0 ? '' : '−'}${radHtml} | 0)`;
    return `(${constStr} ${pm > 0 ? '+' : '−'} ${radHtml} | 0)`;
  };
  // Reintext-Label (Canvas fillText) — kein HTML
  const mkTxt = (pm) => {
    if (constStr === '0') return `(${pm > 0 ? '' : '-'}${radText} | 0)`;
    return `(${constStr} ${pm > 0 ? '+' : '-'} ${radText} | 0)`;
  };

  const pm1 = den > 0 ? +1 : -1;
  z1.exactLabel = mkLbl(pm1);   z1.textLabel = mkTxt(pm1);
  z2.exactLabel = mkLbl(-pm1);  z2.textLabel = mkTxt(-pm1);
  return [z1, z2];
}

async function computeSpecials(myToken) {
  // Zeit-basiertes Yielding — WICHTIG: nicht async, gibt null ODER eine echte
  // setTimeout-Promise zurück. Nur wenn eine Promise zurückkommt, wird awaited.
  // await einer bereits aufgelösten Promise (Microtask) gibt dem Browser KEINE Kontrolle —
  // erst ein setTimeout-Macro-Task erlaubt echtes Browser-Yielding.
  const BUDGET_MS = 8; // max. Blockierzeit pro Chunk (~eine Hälfte eines 60fps-Frames)
  let _lastYield = performance.now();
  // WICHTIG: _lastYield wird NICHT hier gesetzt sondern erst nach dem await (unten).
  // Würde man es hier setzen, wäre beim nächsten Aufruf schon 10–15ms vergangen
  // (setTimeout-Latenz) → sofortiger Yield auf jedem Schritt → 21.000 × 10ms = Minuten.
  const yieldIfNeeded = () => {
    if (performance.now() - _lastYield > BUDGET_MS) {
      return new Promise(r => setTimeout(r, 0)); // echter Macro-Task → Browser bekommt Kontrolle
    }
    return null; // kein Yield nötig — NICHT awaiten (kein Microtask-Overhead)
  };
  const cancelled = () => myToken !== _specialsRunToken;

  const acc = []; // lokaler Akkumulator — erst am Ende in specials schreiben
  const steps = 3000;
  const dx = (view.xmax - view.xmin) / steps;
  const tol = 1e-4;

  for (let fi_idx = 0; fi_idx < functions.length; fi_idx++) {
    const fi = functions[fi_idx];
    if (!fi.expr.trim() || fi.visible === false) continue;
    const col = fi.color;
    const isLin = isLinearFunc(fi.expr);

    // ── Nullstellen: Vorzeichenwechsel von f(x) ──────────────────
    let py = null, ppx = null;
    for (let s = 0; s <= steps; s++) {
      { const _yp = yieldIfNeeded(); if (_yp) { await _yp; _lastYield = performance.now(); if (cancelled()) return; } }
      const x = view.xmin + s * dx, y = safeEval(fi.expr, x);
      if (!isFinite(y)) { py = null; continue; }
      if (py !== null && Math.sign(y) !== Math.sign(py) && py !== 0) {
        let lo = ppx, hi = x;
        for (let it = 0; it < 40; it++) { const m = (lo+hi)/2, ym = safeEval(fi.expr, m); if (Math.sign(ym) === Math.sign(py)) lo = m; else hi = m; }
        const mx = (lo+hi)/2;
        const mxVal = safeEval(fi.expr, mx);
        if (isFinite(mxVal) && Math.abs(mxVal) < 1.0 &&
            !acc.some(p => p.kind==='zero' && p.fi===fi_idx && Math.abs(p.x-mx)<tol))
          acc.push({ kind:'zero', fi:fi_idx, x:mx, y:0, col });
      }
      py = y; ppx = x;
    }

    { const _yp = yieldIfNeeded(); if (_yp) { await _yp; if (cancelled()) return; } }

    // ── Berührungs-Nullstellen (kein Vorzeichenwechsel, z.B. Doppelwurzel) ──
    // Lineare Funktionen können keine Berührungs-Nullstellen haben
    { let da = null, db = null, xa = null, xb = null;
      for (let s = 0; s <= steps && !isLin; s++) {
        { const _yp = yieldIfNeeded(); if (_yp) { await _yp; _lastYield = performance.now(); if (cancelled()) return; } }
        const xc = view.xmin + s * dx;
        const yc = safeEval(fi.expr, xc);
        if (!isFinite(yc)) { da = db = xa = xb = null; continue; }
        const dc = Math.abs(yc);
        if (da !== null && db !== null && db < da && db < dc && db < 1e-2) {
          let lo = xa, hi = xc;
          for (let it = 0; it < 60; it++) {
            const m1 = lo + (hi-lo)/3, m2 = hi - (hi-lo)/3;
            const d1 = Math.abs(safeEval(fi.expr, m1)), d2 = Math.abs(safeEval(fi.expr, m2));
            if (d1 < d2) hi = m2; else lo = m1;
          }
          const mx = (lo+hi)/2, mxVal = safeEval(fi.expr, mx);
          if (isFinite(mxVal) && Math.abs(mxVal) < 1e-8 &&
              !acc.some(p => p.kind==='zero' && p.fi===fi_idx && Math.abs(p.x-mx)<tol))
            acc.push({ kind:'zero', fi:fi_idx, x: Math.abs(mx)<1e-9?0:mx, y:0, col });
        }
        da = db; db = dc; xa = xb; xb = xc;
      }
    }

    { const _yp = yieldIfNeeded(); if (_yp) { await _yp; if (cancelled()) return; } }

    // ── Analytische Nullstellen (exakte Darstellung) ─────────────
    const _anaZeros = tryAnalyticalZerosEx(fi_idx, fi.expr);
    if (_anaZeros.length > 0) {
      const tol2 = 0.05;
      _anaZeros.forEach(az => {
        const existing = acc.findIndex(p => p.kind==='zero' && p.fi===fi_idx && Math.abs(p.x-az.x)<tol2);
        if (existing >= 0) acc[existing] = az;
        else if (!acc.some(p=>p.kind==='zero'&&p.fi===fi_idx&&Math.abs(p.x-az.x)<tol)) acc.push(az);
      });
    }

    // ── y-Achsen-Schnittpunkt ─────────────────────────────────────
    if (view.xmin < 0 && view.xmax > 0) {
      const yy = safeEval(fi.expr, 0);
      if (isFinite(yy)) acc.push({ kind:'yaxis', fi:fi_idx, x:0, y:yy, col });
    }

    // ── Schnittpunkte zwischen Funktionen ──────────────────────────
    for (let fj_idx = fi_idx + 1; fj_idx < functions.length; fj_idx++) {
      const fj = functions[fj_idx]; if (!fj.expr.trim()) continue;
      let pd = null, ppx2 = null;
      for (let s = 0; s <= steps; s++) {
        { const _yp = yieldIfNeeded(); if (_yp) { await _yp; _lastYield = performance.now(); if (cancelled()) return; } }
        const x = view.xmin + s * dx, yi = safeEval(fi.expr, x), yj = safeEval(fj.expr, x);
        if (!isFinite(yi) || !isFinite(yj)) { pd = null; continue; }
        const d = yi - yj;
        if (pd !== null && Math.sign(d) !== Math.sign(pd) && pd !== 0) {
          let lo = ppx2, hi = x;
          for (let it = 0; it < 40; it++) { const m = (lo+hi)/2, dm = safeEval(fi.expr, m) - safeEval(fj.expr, m); if (Math.sign(dm) === Math.sign(pd)) lo = m; else hi = m; }
          const mx = (lo+hi)/2, my = safeEval(fi.expr, mx);
          if (!acc.some(p => p.kind==='isect' && p.fi===fi_idx && p.fj===fj_idx && Math.abs(p.x-mx)<tol))
            acc.push({ kind:'isect', fi:fi_idx, fj:fj_idx, x:mx, y:my, col });
        }
        pd = d; ppx2 = x;
      }

      { const _yp = yieldIfNeeded(); if (_yp) { await _yp; _lastYield = performance.now(); if (cancelled()) return; } }

      // ── Berührungs-Schnittpunkte ──────────────────────────────────
      { let da = null, db = null, xa = null, xb = null;
        for (let s = 0; s <= steps; s++) {
          { const _yp = yieldIfNeeded(); if (_yp) { await _yp; _lastYield = performance.now(); if (cancelled()) return; } }
          const xc = view.xmin + s * dx;
          const yi = safeEval(fi.expr, xc), yj = safeEval(fj.expr, xc);
          if (!isFinite(yi) || !isFinite(yj)) { da = db = xa = xb = null; continue; }
          const dc = Math.abs(yi - yj);
          if (da !== null && db !== null && db < da && db < dc) {
            let lo = xa, hi = xc;
            for (let it = 0; it < 60; it++) {
              const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;
              const d1 = Math.abs(safeEval(fi.expr, m1) - safeEval(fj.expr, m1));
              const d2 = Math.abs(safeEval(fi.expr, m2) - safeEval(fj.expr, m2));
              if (d1 < d2) hi = m2; else lo = m1;
            }
            const mx = (lo + hi) / 2;
            const dmin = Math.abs(safeEval(fi.expr, mx) - safeEval(fj.expr, mx));
            const my_i = safeEval(fi.expr, mx), my_j = safeEval(fj.expr, mx);
            const scale = Math.max(Math.abs(my_i), Math.abs(my_j), 1);
            if (dmin < scale * 1e-5 &&
                !acc.some(p => p.kind === 'isect' && p.fi === fi_idx && p.fj === fj_idx && Math.abs(p.x - mx) < tol))
              acc.push({ kind: 'isect', fi: fi_idx, fj: fj_idx, x: mx, y: my_i, col });
          }
          da = db; db = dc; xa = xb; xb = xc;
        }
      }
    }

    { const _yp = yieldIfNeeded(); if (_yp) { await _yp; if (cancelled()) return; } }

    // ── Extrema (f'=0) und Wendepunkte (f''=0) ───────────────────
    // Lineare Funktionen haben konstante Ableitung → kein Scan nötig (spart 27.000 safeEval-Aufrufe)
    let pd1 = null, pd2 = null;
    if (isLin) { pd1 = null; }
    for (let s = 1; s < steps && !isLin; s++) {
      { const _yp = yieldIfNeeded(); if (_yp) { await _yp; _lastYield = performance.now(); if (cancelled()) return; } }
      const x = view.xmin + s * dx;
      const d1 = deriv1(fi.expr, x), d2 = deriv2(fi.expr, x);
      if (!isFinite(d1) || !isFinite(d2)) { pd1 = null; pd2 = null; continue; }

      if (pd1 !== null && Math.sign(d1) !== Math.sign(pd1) && pd1 !== 0) {
        let lo = view.xmin + (s-1) * dx, hi = x;
        for (let it = 0; it < 40; it++) { const m = (lo+hi)/2, dm = deriv1(fi.expr, m); if (Math.sign(dm) === Math.sign(pd1)) lo = m; else hi = m; }
        const mx = (lo+hi)/2, my = safeEval(fi.expr, mx);
        const kind = deriv2(fi.expr, mx) < 0 ? 'max' : 'min';
        if (isFinite(my) && !acc.some(p => p.fi===fi_idx && p.kind===kind && Math.abs(p.x-mx)<tol))
          acc.push({ kind, fi:fi_idx, x:mx, y:my, col });
      }

      if (!isLin && pd2 !== null && Math.sign(d2) !== Math.sign(pd2) && pd2 !== 0
          && Math.abs(d2) > 1e-4 && Math.abs(pd2) > 1e-4) {
        let lo = view.xmin + (s-1) * dx, hi = x;
        for (let it = 0; it < 40; it++) { const m = (lo+hi)/2, dm = deriv2(fi.expr, m); if (Math.sign(dm) === Math.sign(pd2)) lo = m; else hi = m; }
        const mx = (lo+hi)/2, my = safeEval(fi.expr, mx);
        const d2L = deriv2(fi.expr, mx - 1e-3), d2R = deriv2(fi.expr, mx + 1e-3);
        const realWP = isFinite(d2L) && isFinite(d2R) && Math.sign(d2L) !== Math.sign(d2R) && Math.abs(d2L) > 1e-4 && Math.abs(d2R) > 1e-4;
        const hasKink = /\babs\s*\(|\bsqrt\s*\(|\bnthroot\s*\(/.test(fi.expr);
        const fNearL = safeEval(fi.expr, mx - 1e-3), fNearR = safeEval(fi.expr, mx + 1e-3);
        const yRange = Math.abs(view.ymax - view.ymin);
        const fNearOK = isFinite(fNearL) && isFinite(fNearR)
                     && Math.abs(fNearL - fNearR) < Math.max(100, yRange * 20);
        if (!hasKink && realWP && fNearOK && isFinite(my) && !acc.some(p => p.fi===fi_idx && p.kind==='inf' && Math.abs(p.x-mx)<tol))
          acc.push({ kind:'inf', fi:fi_idx, x:mx, y:my, col });
      }
      pd1 = d1; pd2 = d2;
    }

    { const _yp = yieldIfNeeded(); if (_yp) { await _yp; if (cancelled()) return; } }
  }

  // ── Asymptoten & Pole ─────────────────────────────────────────────
  const BIG = 1e7;
  for (let fi_idx = 0; fi_idx < functions.length; fi_idx++) {
    const fi_obj = functions[fi_idx];
    if (!fi_obj.expr.trim() || fi_obj.visible === false) continue;
    const col = fi_obj.color;
    const isLin = isLinearFunc(fi_obj.expr);

    if (!isLin) {
      const yP = [safeEval(fi_obj.expr, BIG), safeEval(fi_obj.expr, BIG*0.9), safeEval(fi_obj.expr, BIG*0.8)];
      const yM = [safeEval(fi_obj.expr, -BIG), safeEval(fi_obj.expr, -BIG*0.9), safeEval(fi_obj.expr, -BIG*0.8)];
      const conv = (arr) => arr.every(isFinite) && (Math.max(...arr) - Math.min(...arr)) < 1e-2;
      const addAsymp = (val, dir) => {
        if (!acc.some(p => p.kind==='asymp' && p.fi===fi_idx && Math.abs(p.y - val) < 1e-4))
          acc.push({ kind:'asymp', fi:fi_idx, x:0, y:val, col, dir, asympKey:`asymp_${fi_idx}_${parseFloat(val.toFixed(6))}` });
      };
      if (conv(yP)) { const v = yP[0]; if (isFinite(v)) addAsymp(v, '+∞'); }
      if (conv(yM)) { const v = yM[0]; if (isFinite(v)) addAsymp(v, '-∞'); }

      for (const [arr, dirSign, dirStr] of [[yP, 1, '+∞'], [yM, -1, '-∞']]) {
        if (!arr.every(isFinite)) continue;
        if (conv(arr)) continue;
        const dX = BIG * 0.1 * dirSign;
        const s1 = (arr[0] - arr[1]) / dX;
        const s2 = (arr[1] - arr[2]) / dX;
        if (!isFinite(s1) || !isFinite(s2) || Math.abs(s1) < 1e-6) continue;
        if (Math.abs(s1 - s2) > Math.abs(s1) * 0.05 + 0.05) continue;
        const slope = (s1 + s2) / 2;
        const intercept = arr[0] - slope * BIG * dirSign;
        if (!isFinite(intercept)) continue;
        const _fv1 = safeEval(fi_obj.expr, 1), _fv2 = safeEval(fi_obj.expr, 2);
        if (isFinite(_fv1) && isFinite(_fv2) &&
            Math.abs(_fv1 - (slope + intercept)) < 0.01 &&
            Math.abs(_fv2 - (2*slope + intercept)) < 0.01) continue;
        const slopeR = parseFloat((Math.round(slope * 1e5) / 1e5).toFixed(5));
        const intR   = parseFloat((Math.round(intercept * 1e4) / 1e4).toFixed(4));
        if (!acc.some(p => p.kind === 'asymp' && p.fi === fi_idx && p.oblique &&
                           Math.abs(p.slope - slopeR) < 0.01 && Math.abs(p.intercept - intR) < 0.01))
          acc.push({ kind:'asymp', fi:fi_idx, x:0, y:0, col, dir:dirStr,
                     oblique:true, slope:slopeR, intercept:intR,
                     asympKey:`asymp_${fi_idx}_oblique_${dirStr}` });
      }

      // Vertikale Pole
      const pSteps = 1200;
      const pDx = (view.xmax - view.xmin) / pSteps;
      const yR = view.ymax - view.ymin;
      const MERGE_POLE = (view.xmax - view.xmin) / 50;
      let prevPy = NaN, prevPx = null;

      const bisectPole = (lo, hi) => {
        const ylo0 = safeEval(fi_obj.expr, lo), yhi0 = safeEval(fi_obj.expr, hi);
        const bothFin = isFinite(ylo0) && isFinite(yhi0);
        const sLo = Math.sign(ylo0);
        let ax = (lo + hi) / 2;
        for (let it = 0; it < 50; it++) {
          const m = (lo + hi) / 2, ym = safeEval(fi_obj.expr, m);
          if (!isFinite(ym)) hi = m;
          else if (bothFin && Math.sign(ym) === sLo) lo = m;
          else if (bothFin) hi = m;
          else lo = m;
          ax = (lo + hi) / 2;
        }
        const ri = Math.round(ax);
        const axNice = Math.abs(ri - ax) < 1e-4 ? ri : parseFloat(ax.toFixed(4));
        if (!acc.some(p => p.kind==='pole' && p.fi===fi_idx && Math.abs(p.x - ax) < MERGE_POLE))
          acc.push({ kind:'pole', fi:fi_idx, x:axNice, y:0, col });
      };

      for (let s = 0; s <= pSteps; s++) {
        { const _yp = yieldIfNeeded(); if (_yp) { await _yp; _lastYield = performance.now(); if (cancelled()) return; } }
        const px = view.xmin + s * pDx;
        const py = safeEval(fi_obj.expr, px);
        if (prevPx !== null && isFinite(prevPy)) {
          if (!isFinite(py)) {
            // py ist unendlich → Pol direkt erkannt (1/x, 1/x² usw.)
            bisectPole(prevPx, px);
          } else if (Math.abs(py - prevPy) > yR * 6) {
            // Grosser Sprung — auch ohne Vorzeichenwechsel (deckt 1/x² ab)
            bisectPole(prevPx, px);
          } else if (Math.abs(prevPy) > yR * 20 && Math.abs(py) > yR * 20
                     && Math.sign(prevPy) === Math.sign(py)) {
            // Beide Werte sehr gross und gleiches Vorzeichen: Pol könnte dazwischen liegen
            // (Scan hat Polstelle übersprungen) → Mittelpunkt prüfen
            const midX = (prevPx + px) / 2;
            const midY = safeEval(fi_obj.expr, midX);
            if (!isFinite(midY) || Math.abs(midY) > Math.max(Math.abs(prevPy), Math.abs(py)) * 2) {
              bisectPole(prevPx, px);
            }
          }
        }
        prevPy = py; prevPx = px;
      }
    }

    { const _yp = yieldIfNeeded(); if (_yp) { await _yp; if (cancelled()) return; } }
  }

  // Ergebnis übernehmen — nur wenn Token noch gültig (kein neuerer Lauf hat gestartet)
  specials = acc;
  renderSpecialList();
  scheduleDraw();
}

// Lesbare Labels und CSS-Klassen für die verschiedenen Punkt-Typen
function kindLabel(k) { return k==='max'?'Max' : k==='min'?'Min' : k==='inf'?'Wende' : k==='zero'?'Nullst.' : k==='yaxis'?'y-Achse' : k==='asymp'?'Asym.' : '∩'; }
function kindBadge(k) { return k==='max'?'badge-max' : k==='min'?'badge-min' : k==='inf'?'badge-inf' : k==='zero'?'badge-zero' : k==='yaxis'?'badge-yax' : k==='asymp'?'badge-yax' : 'badge-isect'; }

// Rendert die Spezielle-Punkte-Liste in der Sidebar.
// Gruppiert periodische Punkte (z.B. alle Nullstellen von sin) zu einem zusammenfassenden Eintrag.
function renderSpecialList() {
  const el = document.getElementById('special-list');
  if (!specials.length) { el.innerHTML = '<span style="font-size:11px;color:#9ca3af;">—</span>'; return; }
  el.innerHTML = '';
  // Gruppieren nach Funktion + Typ + evtl. zweiter Funktion (für Schnittpunkte)
  const groups = {};
  specials.filter(pt => isKindVisible(pt.kind)).forEach(pt => {
    const key = `${pt.fi}_${pt.kind}${pt.fj !== undefined ? '_' + pt.fj : ''}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(pt);
  });
  // Koordinaten ohne exactLabel → Dezimal (keine falschen Brüche für numerisch gefundene Punkte)
  const ptLabel = pt => pt.exactLabel || `(${niceNumDec(pt.x)} | ${niceNumDec(pt.y)})`;

  Object.values(groups).forEach(grp => {
    if (grp.length < 2) { grp.forEach(pt => addSPRow(el, pt, ptLabel(pt))); return; }
    if (grp.some(pt => pt.exactLabel)) { grp.forEach(pt => addSPRow(el, pt, ptLabel(pt))); return; }
    const per = detectPeriod(grp.map(p => p.x));
    if (!per) { grp.forEach(pt => addSPRow(el, pt, ptLabel(pt))); return; }
    // Periodisch: nur einen zusammenfassenden Eintrag
    const pf = usePiMode() ? asPiFraction(per.period) : null;
    const pStr = pf ? formatPi(pf.p, pf.q) : parseFloat(per.period.toFixed(precision)).toString();
    addSPRow(el, grp[0], `(${niceNumDec(per.base)} + ${pStr}·k | ${niceNumDec(grp[0].y)})`);
  });

  // Smart-Buttons in der Funktionsliste aktualisieren
  if (typeof updateSmartButtons === 'function') updateSmartButtons();
}

// Erstellt eine einzelne Zeile in der Spezielle-Punkte-Liste
function addSPRow(el, pt, label) {
  const wrapper = document.createElement('div');
  const row = document.createElement('div'); row.className = 'sp-row';
  row.style.flexWrap = 'wrap';
  const dot = document.createElement('div'); dot.className = 'dot'; dot.style.background = pt.col; dot.style.marginTop = '3px';
  const badge = document.createElement('span'); badge.className = 'badge ' + kindBadge(pt.kind); badge.textContent = kindLabel(pt.kind);
  const lbl = document.createElement('span');
  if (pt.kind === 'asymp') {
    if (pt.oblique) {
      const sS = Math.abs(pt.slope-1)<1e-5?'':(Math.abs(pt.slope+1)<1e-5?'−':niceNumDec(pt.slope)+'·');
      const bS = Math.abs(pt.intercept)<1e-5?'':(pt.intercept>0?` + ${niceNumDec(pt.intercept)}`:` − ${niceNumDec(Math.abs(pt.intercept))}`);
      lbl.textContent = `f${pt.fi+1} y = ${sS}x${bS}  (${t('sp_oblique')}, x→${pt.dir})`;
    } else {
      lbl.textContent = `f${pt.fi+1} y = ${niceNumDec(pt.y)}  (x→${pt.dir})`;
    }
  } else if (pt.kind === 'pole') {
    lbl.textContent = `f${pt.fi+1} x = ${niceNumDec(pt.x)}  (${t('sp_vert_asymp_lbl')})`;
  } else {
    lbl.innerHTML  = (pt.kind === 'isect' ? `f${pt.fi+1}∩f${pt.fj+1} ` : `f${pt.fi+1} `) + label;
  }

  // Lösungsweg-Button (nur für lösbare Typen)
  const fn = functions[pt.fi];
  const canSolve = fn && (pt.kind === 'zero' || pt.kind === 'max' || pt.kind === 'min' || pt.kind === 'inf' || pt.kind === 'isect' || pt.kind === 'asymp' || pt.kind === 'yaxis' || pt.kind === 'pole');
  if (canSolve) {
    const solveBtn = document.createElement('button');
    solveBtn.textContent = '?'; solveBtn.title = t('title_solve_btn');
    solveBtn.style.cssText = 'font-size:9px;padding:1px 5px;margin-left:4px;flex-shrink:0;';
    let open = false;
    const solveDiv = document.createElement('div');
    solveDiv.style.cssText = 'display:none;font-size:10.5px;line-height:1.6;padding:5px 8px 5px 24px;color:var(--text);background:var(--bg-range);border-radius:5px;margin-bottom:4px;white-space:pre-wrap;font-family:system-ui;border-left:3px solid ' + pt.col + ';';
    solveBtn.onclick = () => {
      open = !open;
      solveBtn.textContent = open ? '▲' : '?';
      if (open && !solveDiv.textContent) solveDiv.innerHTML = generateSolveSteps(pt);
      solveDiv.style.display = open ? 'block' : 'none';
    };
    row.append(dot, badge, lbl, solveBtn);
    wrapper.append(row, solveDiv);
  } else {
    row.append(dot, badge, lbl);
    wrapper.appendChild(row);
  }
  el.appendChild(wrapper);
}

// Generiert Gymnasiums-gerechte Lösungswege für Sonderpunkte
function generateSolveSteps(pt) {
  const fn = functions[pt.fi]; if (!fn) return '(Funktion nicht gefunden)';
  const expr = fn.expr.trim();
  const fi = pt.fi;
  const fLabel = `f<sub>${fi+1}</sub>(x)`;

  // Hilfsfunktionen
  function r(v, d=2) { return parseFloat(v.toFixed(d)).toString(); }
  function rr(v) { return niceCoeff(v, Math.max(precision, 2)); }
  function rrSign(v) { return v >= 0 ? `+ ${rr(v)}` : `- ${rr(Math.abs(v))}`; }
  // Format a factor (number being multiplied): negative gets parentheses
  function rrFactor(v) { return v < 0 ? `(${rr(v)})` : rr(v); }
  function fixMM(s) {
    return s.replace(/\+\s*-\s*(\d)/g, '- $1')
            .replace(/-\s*-\s*(\d)/g, '+ $1')
            .replace(/\+\s*\+\s*/g, '+ ');
  }

  function getLinCoeffs() {
    const a = deriv1(expr, 0), b = safeEval(expr, 0);
    if (!isFinite(a) || !isFinite(b)) return null;
    if (Math.abs(deriv2(expr, 0)) > 0.01) return null;
    // Verifikation bei x=1 und x=2 (verhindert sin(x)-Fehlklassifikation)
    const _c1 = safeEval(expr,1), _c2 = safeEval(expr,2);
    if (isFinite(_c1) && Math.abs(a+b-_c1) > 0.05*Math.max(1,Math.abs(_c1))) return null;
    if (isFinite(_c2) && Math.abs(2*a+b-_c2) > 0.05*Math.max(1,Math.abs(_c2))) return null;
    return { a: parseFloat(a.toFixed(6)), b: parseFloat(b.toFixed(6)) };
  }
  function getQuadCoeffs() {
    const a2 = deriv2(expr, 0);
    if (!isFinite(a2) || Math.abs(a2) < 1e-6) return null;
    const a = a2 / 2, b = deriv1(expr, 0), c = safeEval(expr, 0);
    if (!isFinite(a) || !isFinite(b) || !isFinite(c)) return null;
    // Mehrere Stichproben — verhindert Fehlklassifikation von gebrochenrationalen Fkt.
    for (const x of [1, 2, -1, -2, 3, 5]) {
      const act = safeEval(expr, x);
      if (!isFinite(act)) return null; // Pol an dieser Stelle → kein Polynom
      const pred = a*x*x + b*x + c;
      if (Math.abs(pred - act) > Math.abs(act) * 0.01 + 0.05) return null;
    }
    return { a: parseFloat(a.toFixed(6)), b: parseFloat(b.toFixed(6)), c: parseFloat(c.toFixed(6)) };
  }
  // Erkennt f(x) = a·x^n + c für beliebiges ganzzahliges n ≠ 0,1,2
  // (n negativ = Bruchform a/x^|n|; n positiv = reine Potenz)
  function getPureMonomialCoeffs() {
    // Asymptotischer Wert c: für n<0 von großem x, für n>0 von f(0)
    const f0 = safeEval(expr, 0);
    let c;
    if (isFinite(f0)) {
      c = f0; // n > 0: f(0) = a·0^n + c = c
    } else {
      c = safeEval(expr, 1e6); // n < 0: Pol bei 0, Asymptote bei ∞
      if (!isFinite(c)) return null;
    }
    const f1 = safeEval(expr, 1);
    if (!isFinite(f1)) return null;
    const a = f1 - c;
    if (Math.abs(a) < 1e-9) return null;
    const f2 = safeEval(expr, 2);
    if (!isFinite(f2)) return null;
    const ratio = (f2 - c) / a; // = 2^n
    if (!isFinite(ratio) || ratio <= 0) return null;
    const nFloat = Math.log(ratio) / Math.log(2);
    const n = Math.round(nFloat);
    if (Math.abs(nFloat - n) > 0.02) return null; // n muss ganzzahlig sein
    if (n === 0 || n === 1 || n === 2) return null; // durch andere Detektoren abgedeckt
    // Verifikation an mehreren Punkten
    for (const x of [3, 4, 0.5, -1, -2]) {
      const fx = safeEval(expr, x);
      if (!isFinite(fx)) continue;
      const expected = a * Math.pow(x, n) + c;
      if (Math.abs(fx - expected) > Math.abs(expected) * 0.01 + 1e-6) return null;
    }
    return { a: parseFloat(a.toFixed(8)), n, c: parseFloat(c.toFixed(8)) };
  }
  function getExpCoeffs() {
    const a = safeEval(expr, 0);
    if (!isFinite(a) || Math.abs(a) < 1e-9) return null;
    const f1 = safeEval(expr, 1), f2 = safeEval(expr, 2), fm1 = safeEval(expr, -1);
    if (!isFinite(f1) || Math.abs(f1) < 1e-9) return null;
    const b = f1 / a;
    if (b <= 0 || Math.abs(b - 1) < 1e-6) return null;
    if (!isFinite(f2) || Math.abs(a * b * b - f2) > Math.abs(f2) * 0.01 + 0.01) return null;
    if (isFinite(fm1) && Math.abs(a / b - fm1) > Math.abs(fm1) * 0.01 + 0.01) return null;
    return { a: parseFloat(a.toFixed(6)), b: parseFloat(b.toFixed(6)) };
  }

  // ── Exakte Darstellung für Ergebniswerte (π, √, Bruch) ──────────────
  function nn(v) { return niceNum(v); }

  // ── Kubische Funktion ax³ + bx² + cx + d erkennen ───────────────────
  function getCubicCoeffs() {
    const H = 0.1;
    // Näherung der 3. Ableitung via finite Differenzen; f'''(0)/6 = a
    const d3 = (safeEval(expr, 3*H) - 3*safeEval(expr, H) + 3*safeEval(expr, -H) - safeEval(expr, -3*H)) / (8*H*H*H);
    const a = d3 / 6;
    if (!isFinite(a) || Math.abs(a) < 1e-5) return null;
    // 4. Ableitung ≈ 0 für kubische Funktion (für Grad ≥ 4 bleibt sie endlich)
    const d4 = (safeEval(expr, 2*H) - 4*safeEval(expr, H) + 6*safeEval(expr, 0) - 4*safeEval(expr, -H) + safeEval(expr, -2*H)) / (H*H*H*H);
    if (Math.abs(d4) > 2 + 3*Math.abs(a)) return null;
    const b = deriv2(expr, 0) / 2;
    const c = deriv1(expr, 0);
    const d = safeEval(expr, 0);
    if (!isFinite(b) || !isFinite(c) || !isFinite(d)) return null;
    // Verifikation
    for (const x of [1, 2, -1, -2, 1.5]) {
      const pred = a*x*x*x + b*x*x + c*x + d;
      const act = safeEval(expr, x);
      if (!isFinite(act) || Math.abs(pred - act) > 0.05*(Math.abs(act)+1)) return null;
    }
    return { a: parseFloat(a.toFixed(5)), b: parseFloat(b.toFixed(5)),
             c: parseFloat(c.toFixed(5)), d: parseFloat(d.toFixed(5)) };
  }

  // ── Trigonometrische Funktion charakterisieren ───────────────────────
  // Gibt zurück: { kind:'sin'|'cos'|'tan', mixed, ok, a(Amplitude), d(Offset), period }
  function getTrigInfo() {
    const hasSin = /\bsin\s*\(/.test(expr);
    const hasCos = /\bcos\s*\(/.test(expr);
    const hasTan = /\btan\s*\(/.test(expr);
    if (!hasSin && !hasCos && !hasTan) return null;
    const kind = hasSin ? 'sin' : (hasCos ? 'cos' : 'tan');
    const mixed = [hasSin, hasCos, hasTan].filter(Boolean).length > 1;

    // Stichproben über ±3π (600 Punkte)
    const ys = [];
    for (let i = 0; i <= 600; i++) {
      const y = safeEval(expr, -3*PI + i * 6*PI/600);
      if (isFinite(y) && Math.abs(y) < 1e5) ys.push(y);
    }
    if (ys.length < 100) return { kind, mixed, ok: false };

    const maxY = Math.max(...ys), minY = Math.min(...ys);
    const a = (maxY - minY) / 2;   // Amplitude
    const d = (maxY + minY) / 2;   // Vertikalverschiebung

    // Periode schätzen: Nulldurchgänge der zentrierten Funktion (f(x)−d)
    let prev = null, prevX = null, cross = [];
    for (let i = 0; i <= 600; i++) {
      const x = -3*PI + i * 6*PI/600;
      const y = safeEval(expr, x) - d;
      if (!isFinite(y)) { prev = null; continue; }
      const s = Math.sign(y);
      if (prev !== null && s !== 0 && prev !== 0 && s !== prev && cross.length < 20)
        cross.push((prevX + x) / 2);
      prev = s; prevX = x;
    }
    let period = null;
    if (cross.length >= 4) {
      const diffs = [];
      for (let i = 2; i < Math.min(cross.length, 10); i++) diffs.push(cross[i] - cross[i-2]);
      diffs.sort((a,b) => a-b);
      const med = diffs[Math.floor(diffs.length/2)];
      if (asPiFraction(med)) period = med;
    }
    return { kind, mixed, ok: true, a, d, period };
  }

  // ── Zerlegung f(x) = m·x + b + R/(x−h) erkennen (Pol + schräge Asymptote) ──
  // Gibt {h, m, b, R} zurück wenn f(x) in dieser Form darstellbar ist.
  function getRationalDecomposition() {
    const poles = specials.filter(sp => sp.kind === 'pole' && sp.fi === fi);
    if (poles.length !== 1) return null;
    const h = poles[0].x;
    const oblAsymp = specials.find(sp => sp.kind === 'asymp' && sp.fi === fi && sp.oblique);
    if (!oblAsymp) return null;
    const { slope: m, intercept: b } = oblAsymp;
    // Berechne R = (f(x) − (m·x + b))·(x − h) an mehreren Punkten — muss konstant sein
    let R = null;
    for (const x of [h+1, h+2, h+3, h-1, h-2]) {
      if (Math.abs(x - h) < 0.1) continue;
      const fx = safeEval(expr, x);
      if (!isFinite(fx)) continue;
      const Rx = (fx - (m*x + b)) * (x - h);
      if (R === null) { R = Rx; }
      else if (Math.abs(Rx - R) > Math.abs(R) * 0.05 + 0.1) return null;
    }
    if (R === null || !isFinite(R)) return null;
    return { h: parseFloat(h.toFixed(5)), m: parseFloat(m.toFixed(5)),
             b: parseFloat(b.toFixed(5)), R: parseFloat(R.toFixed(5)) };
  }

  // ── Einfache gebrochenrationale Funktion a/(x−h)+k erkennen ─────────
  function getRationalSimple() {
    const poles = specials.filter(sp => sp.kind === 'pole' && sp.fi === fi);
    if (poles.length !== 1) return null;
    const h = poles[0].x;
    const y1 = safeEval(expr, h+1), y2 = safeEval(expr, h+2);
    if (!isFinite(y1) || !isFinite(y2)) return null;
    const a = 2*(y1 - y2);      // aus y1=a+k und y2=a/2+k → y1−y2=a/2
    const k = y1 - a;
    if (!isFinite(a) || Math.abs(a) < 1e-8) return null;
    const ym1 = safeEval(expr, h-1);
    if (isFinite(ym1) && Math.abs(-a + k - ym1) > Math.abs(ym1)*0.02 + 0.02) return null;
    return { a: parseFloat(a.toFixed(5)), h: parseFloat(h.toFixed(5)), k: parseFloat(k.toFixed(5)) };
  }

  // ── Lösungswinkel für sin(θ)=k (π-Bruch wenn Tabellenwert) ──────────
  function sinAngle(k) {
    if (!isFinite(k) || Math.abs(k) > 1+1e-6) return null;
    const arc = Math.asin(Math.max(-1, Math.min(1, k)));
    const pf  = asPiFraction(arc);
    const arcStr  = pf ? formatPi(pf.p, pf.q) : `arcsin(${nn(k)})`;
    const suppl   = PI - arc;
    const pfS     = asPiFraction(suppl);
    const suppStr = pfS ? formatPi(pfS.p, pfS.q) : `π − ${arcStr}`;
    return { arc, arcStr, suppStr, isTable: !!pf };
  }
  // ── Lösungswinkel für cos(θ)=k ───────────────────────────────────────
  function cosAngle(k) {
    if (!isFinite(k) || Math.abs(k) > 1+1e-6) return null;
    const arc = Math.acos(Math.max(-1, Math.min(1, k)));
    const pf  = asPiFraction(arc);
    const arcStr = pf ? formatPi(pf.p, pf.q) : `arccos(${nn(k)})`;
    return { arc, arcStr, isTable: !!pf };
  }

  let steps = '';

  if (pt.kind === 'pole') {
    steps += `<b>${t('solve_vert_asymp')} von ${fLabel}</b>\n\n`;
    steps += `${t('solve_find_where_inf')}\n\n`;
    steps += `${t('solve_approach')}: ${t('solve_denom_zero')}\n\n`;
    const rat = getRationalSimple();
    if (rat) {
      const { a, h, k } = rat;
      const hSign = h >= 0 ? `− ${rr(h)}` : `+ ${rr(-h)}`;
      const kPart = Math.abs(k) < 1e-6 ? '' : (k > 0 ? ` + ${rr(k)}` : ` − ${rr(-k)}`);
      steps += `f(x) ≈ ${rr(a)}/(x ${hSign})${kPart}\n\n`;
      steps += `Nenner = 0:\n`;
      steps += `  x ${hSign} = 0\n`;
      steps += `  x = <b>${rr(h)}</b>\n\n`;
    } else {
      steps += `${t('solve_num_approx')}: x ≈ <b>${rr(pt.x)}</b>\n\n`;
    }
    const yL = safeEval(expr, pt.x - 0.001);
    const yR = safeEval(expr, pt.x + 0.001);
    steps += `→ x = <b>${rr(pt.x)}</b> ${t('solve_is_vert_asymp')}\n\n`;
    steps += `${t('solve_limit_beh')}:\n`;
    steps += `  lim f(x) für x → ${rr(pt.x)}⁻:  ${!isFinite(yL) ? '±∞' : yL < 0 ? '−∞' : '+∞'}\n`;
    steps += `  lim f(x) für x → ${rr(pt.x)}⁺:  ${!isFinite(yR) ? '±∞' : yR < 0 ? '−∞' : '+∞'}`;

  } else if (pt.kind === 'asymp') {
    const exp = getExpCoeffs();
    const rat = getRationalSimple();
    const dec = getRationalDecomposition();

    if (pt.oblique) {
      // ── Schräge Asymptote ───────────────────────────────────────────
      const { slope: m, intercept: b } = pt;
      const sS = Math.abs(m-1)<1e-5?'x':(Math.abs(m+1)<1e-5?'−x':`${rr(m)}x`);
      const bS = Math.abs(b)<1e-6?'':(b>0?` + ${rr(b)}`:` − ${rr(-b)}`);
      steps += `<b>${t('solve_oblique_asymp')} von ${fLabel}</b>\n\n`;
      if (dec) {
        const { h, R } = dec;
        const hSign = Math.abs(h)<1e-5?'x':(h<0?`x + ${rr(-h)}`:`x − ${rr(h)}`);
        const RSign = R>=0?`+ ${rr(R)}`:`− ${rr(-R)}`;
        steps += `<u>Methode: Polynomdivision → Zerlegung f(x) = Ganzanteil + Restbruch</u>\n\n`;
        steps += `f(x) = ${sS}${bS}  ${RSign}/(${hSign})\n\n`;
        steps += `Für x → ±∞:  ${rr(R)}/(${hSign}) → 0\n\n`;
        steps += `→ <b>Schräge Asymptote: y = ${sS}${bS}</b>\n\n`;
        steps += `<u>Nachweis der Zerlegung (Pol bei x = ${rr(h)}):</u>\n`;
        steps += `  Rest R = (f(x) − (${sS}${bS})) · (${hSign})\n`;
        steps += `  R = ${rr(R)} = konst. ✓\n\n`;
        const yFar = safeEval(expr, 10000), yAFar = m*10000 + b;
        steps += `<u>${t('solve_control')}:</u>  f(10000) − y_A(10000) = ${rr(yFar)} − ${rr(yAFar)} = ${rr(yFar-yAFar)} ≈ 0 ✓`;
      } else {
        steps += `<u>Methode: Grenzwert der Steigung und des Abstands</u>\n\n`;
        steps += `Steigung:  m = lim(x→±∞) f(x)/x\n`;
        steps += `  f(10000)/10000 ≈ ${rr(safeEval(expr, 10000)/10000)}  →  m = ${rr(m)}\n\n`;
        steps += `Achsenabschnitt:  b = lim(x→±∞) [f(x) − ${rr(m)}x]\n`;
        steps += `  f(10000) − ${rr(m)}·10000 ≈ ${rr(safeEval(expr, 10000) - m*10000)}  →  b = ${rr(b)}\n\n`;
        steps += `→ <b>Schräge Asymptote: y = ${sS}${bS}</b>`;
      }

    } else {
      // ── Horizontale Asymptote ────────────────────────────────────────
      steps += `<b>${t('solve_asymp')} von ${fLabel}</b>\n\n`;
      if (exp) {
        const { a, b } = exp;
        steps += `Funktionstyp: f(x) = ${rr(a)}·${rr(b)}ˣ\n\n`;
        steps += `Horizontale Asymptote:\n`;
        steps += `  lim(x → +∞) f(x) = ${b > 1 ? '+∞' : '0'}  (${b>1?'Wachstum':'Zerfall'})\n`;
        steps += `  lim(x → −∞) f(x) = ${b > 1 ? '0' : '+∞'}\n\n`;
        steps += `→ y = 0 ist horizontale Asymptote\n`;
        steps += `  (Exponentäre Funktion: Wertebereich ${a>0?'y > 0':'y < 0'}, erreicht nie y = 0)\n\n`;
        if (b > 1) {
          steps += `b = ${rr(b)} > 1 → exponentielle Zunahme\n`;
          steps += `Verdopplungsrate: Δx = ${rr(Math.log(2)/Math.log(b))}`;
        } else {
          steps += `0 < b = ${rr(b)} < 1 → exponentielle Abnahme\n`;
          steps += `Halbwertszeit: Δx = ${rr(Math.log(0.5)/Math.log(b))}`;
        }
      } else if (rat) {
        const { a: rA, h: rH, k: rK } = rat;
        const hSign = Math.abs(rH)<1e-5?'x':(rH<0?`x + ${rr(-rH)}`:`x − ${rr(rH)}`);
        steps += `f(x) = ${rr(rA)}/(${hSign}) + ${rr(rK)}\n\n`;
        steps += `<u>Grenzwert für x → ±∞:</u>\n`;
        steps += `  lim(x → ±∞) ${rr(rA)}/(${hSign}) = 0\n`;
        steps += `  (Zähler konstant, Nenner → ∞)\n\n`;
        steps += `  lim(x → ±∞) f(x) = 0 + ${rr(rK)} = <b>${rr(rK)}</b>\n\n`;
        steps += `→ <b>Horizontale Asymptote: y = ${rr(rK)}</b>\n\n`;
        const yFar = safeEval(expr, 10000);
        steps += `${t('solve_control')}: f(10000) = ${rr(yFar)} ≈ ${rr(rK)} ✓`;
      } else {
        steps += `<u>Grenzwert für x → ${pt.dir}:</u>\n\n`;
        steps += `  lim f(x) ≈ <b>${rr(pt.y)}</b>\n\n`;
        const xFar = pt.dir === '+∞' ? 10000 : -10000;
        steps += `${t('solve_control')}: f(${xFar}) = ${rr(safeEval(expr, xFar))}`;
      }
    }

  } else if (pt.kind === 'yaxis') {
    steps += `<b>${t('solve_yaxis_sect')} von ${fLabel}</b>\n\n`;
    steps += `${t('solve_given')}: f(0)\n\n`;
    const lin = getLinCoeffs();
    const quad = getQuadCoeffs();
    const exp = getExpCoeffs();
    if (lin) {
      const { a, b } = lin;
      steps += `f(x) = ${rr(a)}x ${rrSign(b)}\n\n`;
      steps += `f(0) = ${rr(a)}·0 ${rrSign(b)}\n`;
      steps += `f(0) = <b>${rr(b)}</b>\n\n`;
      steps += `${t('solve_yaxis_intersect')}: S = (0 | <b>${rr(b)}</b>)`;
    } else if (quad) {
      const { a, b, c } = quad;
      steps += `f(x) = ${rr(a)}x² ${rrSign(b)}x ${rrSign(c)}\n\n`;
      steps += `f(0) = ${rr(a)}·0² ${rrSign(b)}·0 ${rrSign(c)}\n`;
      steps += `f(0) = <b>${rr(c)}</b>\n\n`;
      steps += `${t('solve_yaxis_intersect')}: S = (0 | <b>${rr(c)}</b>)`;
    } else if (exp) {
      const { a, b } = exp;
      steps += `f(x) = ${rr(a)}·${rr(b)}ˣ\n\n`;
      steps += `f(0) = ${rr(a)}·${rr(b)}⁰ = ${rr(a)}·1 = <b>${rr(a)}</b>\n\n`;
      steps += `${t('solve_yaxis_intersect')}: S = (0 | <b>${rr(a)}</b>)`;
    } else {
      steps += `f(0) = <b>${r(pt.y, 3)}</b>`;
    }

  } else if (pt.kind === 'zero') {
    steps += `<b>${t('solve_zero')} von ${fLabel}</b>\n\n`;
    steps += `${t('solve_given')}: x mit f(x) = 0\n\n`;
    const lin = getLinCoeffs();
    const ratEarly = getRationalSimple(); // vor quad prüfen — verhindert Fehlklassifikation
    const quad = ratEarly ? null : getQuadCoeffs();
    const exp = getExpCoeffs();

    if (lin) {
      const { a, b } = lin;
      steps += `f(x) = ${rr(a)}x ${rrSign(b)} = 0\n`;
      if (Math.abs(a) < 1e-8) {
        steps += Math.abs(b) < 1e-8 ? t('solve_all_x_zero') : t('solve_no_zero_const');
      } else {
        steps += `${rr(a)}x = ${rr(-b)}\n`;
        steps += `x = ${rr(-b)} ÷ ${rr(a)} = <b>${rr(pt.x)}</b>`;
      }
    } else if (exp) {
      const { a, b } = exp;
      steps += `f(x) = ${rr(a)}·${rr(b)}ˣ = 0\n\n`;
      steps += `Da ${rr(b)} > 0 ist ${rr(b)}ˣ > 0 für alle x.\n`;
      steps += `Da a = ${rr(a)} ≠ 0, gilt f(x) ≠ 0 für alle x.\n`;
      steps += `→ <b>${t('solve_no_zero_exp')}</b>`;
    } else if (quad) {
      const { a, b, c } = quad;
      steps += `f(x) = ${rr(a)}x² ${rrSign(b)}x ${rrSign(c)} = 0\n\n`;
      const D = b*b - 4*a*c;
      steps += `${t('solve_disc')}: D = b² − 4ac\n`;
      steps += `  D = (${rr(b)})² − 4·(${rr(a)})·(${rr(c)})\n`;
      steps += `  D = ${rr(b*b)} − (${rr(4*a*c)}) = <b>${rr(D)}</b>\n\n`;
      if (D < -1e-8) {
        steps += t('solve_no_real_zeros');
      } else if (Math.abs(D) < 1e-8) {
        const x0 = -b / (2*a);
        steps += `D = 0 → Doppelte Nullstelle:\n`;
        steps += `x = −b / (2a) = ${rr(-b)} / ${rr(2*a)} = <b>${rr(x0)}</b>\n\n`;
        steps += `Faktorisiert: f(x) = ${rr(a)}·(x − ${rr(x0)})²`;
      } else {
        const sqD = Math.sqrt(D);
        const x1 = (-b + sqD) / (2*a), x2 = (-b - sqD) / (2*a);
        const DI2 = Math.round(D); const srM = simplifyRadical(DI2);
        const sqStr2 = srM && srM.radicand > 1
          ? (srM.coef>1 ? `${srM.coef}√${srM.radicand}` : `√${srM.radicand}`)
          : `√${rr(D)}`;
        // Vieta: ganzzahlige oder einfache Wurzeln
        const _xSr = rr(Math.min(x1,x2)), _xLr = rr(Math.max(x1,x2));
        const _aF = Math.abs(a-1)<1e-5 ? "" : (Math.abs(a+1)<1e-5 ? "-" : rr(a)+"·");
        const _fp1 = `(x${-Math.min(x1,x2)<0?" + "+rr(Math.abs(Math.min(x1,x2))):" − "+rr(Math.abs(Math.min(x1,x2)))})`;
        const _fp2 = `(x${-Math.max(x1,x2)<0?" + "+rr(Math.abs(Math.max(x1,x2))):" − "+rr(Math.abs(Math.max(x1,x2)))})`;
        const isInt = v => Math.abs(v - Math.round(v)) < 0.01;
        if (isInt(x1) && isInt(x2)) {
          steps += `<u>Faktorisierung (Vieta):</u>\n\n`;
          steps += `  Gesucht: x₁, x₂  mit\n`;
          steps += `  x₁ + x₂ = ${rr(-b/a)}  und  x₁ · x₂ = ${rr(c/a)}\n\n`;
          steps += `  → x₁ = ${_xSr},   x₂ = ${_xLr}\n\n`;
          steps += `  f(x) = ${_aF}${_fp1}·${_fp2}\n\n`;
          steps += `  Nullstellen: x₁ = <b>${_xSr}</b>,   x₂ = <b>${_xLr}</b>`;
        } else {
          steps += `${t('solve_midnight')}: x = (−b ± √D) / (2a)\n\n`;
          steps += `  x = (−(${rr(b)}) ± √${rr(D)}) / (2·${rr(a)})\n`;
          steps += `  D = ${rr(D)}  →  √D = ${sqStr2}\n\n`;
          steps += `  x₁ = (${rr(-b)} + ${sqStr2}) / ${rr(2*a)}\n`;
          steps += `  x₂ = (${rr(-b)} − ${sqStr2}) / ${rr(2*a)}\n\n`;
          steps += `  x₁ = <b>${rr(x1)}</b>,  x₂ = <b>${rr(x2)}</b>`;
        }
      }
    } else {
      // Hochgestellte Ziffern für Exponent-Anzeige
      const nSup = (k) => (['','','²','³','⁴','⁵','⁶','⁷','⁸','⁹'][k] || `^${k}`);
      const pm = getPureMonomialCoeffs();
      if (pm) {
        const { a, n, c } = pm;
        const m = Math.abs(n); // Betrag des Exponenten
        // Formatierung des Koeffizienten a als Bruch/Ganzzahl
        const aNum = niceNum(a);
        if (n < 0) {
          // ─── Bruchform: f(x) = a/x^m + c = 0 ───────────────────
          const aDisp = aNum.includes('/') ? `(${aNum})` : aNum;
          steps += `f(x) = ${aDisp}/x${nSup(m)} ${rrSign(c)} = 0\n\n`;
          steps += `<u>Schritt 1: Konstante auf die andere Seite</u>\n`;
          steps += `  ${aDisp}/x${nSup(m)} = ${rr(-c)}\n\n`;
          steps += `<u>Schritt 2: x${nSup(m)} berechnen</u>\n`;
          steps += `  Beide Seiten · x${nSup(m)} (x ≠ 0):\n`;
          steps += `  ${aNum} = ${rr(-c)}·x${nSup(m)}\n`;
          const val = a / (-c);
          steps += `  x${nSup(m)} = ${aNum} / ${rr(-c)} = <b>${niceNum(val)}</b>\n\n`;
          steps += `<u>Schritt 3: ${m === 2 ? 'Quadrat' : m + '. Potenz'}wurzel ziehen</u>\n`;
          if (val < 0 && m % 2 === 0) {
            steps += `  x${nSup(m)} = ${niceNum(val)} < 0\n`;
            steps += `  → <b>Keine reelle Nullstelle</b> (gerade Potenz)`;
          } else if (m % 2 === 0) {
            const xVal = Math.pow(val, 1 / m);
            steps += `  x = ±√(${niceNum(val)})\n\n`;
            steps += `  x₁ = +<b>${niceNum(xVal)}</b>\n`;
            steps += `  x₂ = −<b>${niceNum(xVal)}</b>`;
          } else {
            const xVal = Math.pow(Math.abs(val), 1 / m) * Math.sign(val);
            steps += `  x = ${m === 3 ? '∛' : `${nSup(m)}√`}(${niceNum(val)}) = <b>${niceNum(xVal)}</b>`;
          }
        } else {
          // ─── Potenzform: f(x) = a·x^n + c = 0 ──────────────────
          const aPrefix = Math.abs(a) === 1 ? (a < 0 ? '−' : '') : `${aNum}·`;
          steps += `f(x) = ${aPrefix}x${nSup(n)} ${rrSign(c)} = 0\n\n`;
          steps += `<u>Schritt 1: x${nSup(n)} isolieren</u>\n`;
          steps += `  ${aPrefix}x${nSup(n)} = ${rr(-c)}\n`;
          const val = -c / a;
          steps += `  x${nSup(n)} = ${rr(-c)} / ${rr(a)} = <b>${niceNum(val)}</b>\n\n`;
          steps += `<u>Schritt 2: ${n === 2 ? 'Quadrat' : n + '. Potenz'}wurzel ziehen</u>\n`;
          if (val < 0 && n % 2 === 0) {
            steps += `  x${nSup(n)} = ${niceNum(val)} < 0\n`;
            steps += `  → <b>Keine reelle Nullstelle</b> (gerade Potenz)`;
          } else if (n % 2 === 0) {
            const xVal = Math.pow(val, 1 / n);
            steps += `  x = ±√(${niceNum(val)})\n\n`;
            steps += `  x₁ = +<b>${niceNum(xVal)}</b>\n`;
            steps += `  x₂ = −<b>${niceNum(xVal)}</b>`;
          } else {
            const xVal = Math.pow(Math.abs(val), 1 / n) * Math.sign(val);
            steps += `  x = ${n === 3 ? '∛' : `${nSup(n)}√`}(${niceNum(val)}) = <b>${niceNum(xVal)}</b>`;
          }
        }
      } else {
        // Trig, gebrochenrational oder generisch
        const trig = getTrigInfo();
        const rat  = ratEarly; // bereits oben berechnet (vor quad)
        if (trig && !trig.mixed && trig.ok && Math.abs(trig.a) > 1e-6) {
          const { kind, a, d } = trig;
          const k    = -d / a;                       // trig(·) = k
          const kStr = nn(k);
          const kindDE = kind === 'sin' ? 'Sinus' : kind === 'cos' ? 'Kosinus' : 'Tangens';
          steps += `<b>Methode: ${kindDE}-Gleichung</b>\n\n`;
          if (Math.abs(a - 1) > 0.01 || Math.abs(d) > 1e-4) {
            steps += `${fLabel} = 0  →  ${kind}(·) isolieren:\n`;
            if (Math.abs(d) > 1e-4) steps += `  ${nn(a)}·${kind}(·) = ${nn(-d)}\n`;
            steps += `  ${kind}(·) = ${kStr}\n\n`;
          } else {
            steps += `${kind}(·) = ${kStr}\n\n`;
          }

          if (kind === 'tan') {
            if (Math.abs(k) < 1e-6) {
              steps += `<u>Tabellenwert:</u> tan(k·π) = 0\n`;
              steps += `  →  · = k·π  (k ∈ ℤ)\n\n`;
            } else {
              const arcT = Math.atan(k); const pfT = asPiFraction(arcT);
              const arcStr = pfT ? formatPi(pfT.p, pfT.q) : `arctan(${kStr})`;
              steps += `<u>Tabellenwert:</u> tan(${arcStr}) = ${kStr}\n`;
              steps += `  →  · = ${arcStr} + k·π  (k ∈ ℤ)\n\n`;
            }
            steps += `Hier: x = <b>${nn(pt.x)}</b>`;

          } else if (kind === 'sin') {
            if (Math.abs(k) > 1+1e-6) {
              steps += `|${kStr}| > 1  →  <b>Keine reelle Nullstelle</b>`;
            } else if (Math.abs(k) < 1e-6) {
              steps += `<u>Tabellenwert:</u> sin(k·π) = 0\n  →  · = k·π  (k ∈ ℤ)\n\n`;
              steps += `Hier: x = <b>${nn(pt.x)}</b>`;
            } else if (Math.abs(Math.abs(k)-1) < 1e-6) {
              const aStr = k > 0 ? 'π/2' : '−π/2';
              steps += `<u>Tabellenwert:</u> sin(${aStr}) = ${kStr}\n  →  · = ${aStr} + 2k·π  (k ∈ ℤ)\n\n`;
              steps += `Hier: x = <b>${nn(pt.x)}</b>`;
            } else {
              const info = sinAngle(k);
              if (info && info.isTable) {
                steps += `<u>Tabellenwert (Einheitskreis):</u>\n  sin(${info.arcStr}) = ${kStr}\n\n`;
                steps += `<u>Allgemeine Lösung:</u>\n`;
                if (Math.abs(info.arc - (PI-info.arc)) < 1e-6) {
                  steps += `  · = ${info.arcStr} + 2k·π  (k ∈ ℤ)\n\n`;
                } else {
                  steps += `  · = ${info.arcStr} + 2k·π  (1. Quadrant)\n`;
                  steps += `  · = ${info.suppStr} + 2k·π  (2. Quadrant)\n\n`;
                }
              } else {
                steps += `Kein exakter Tabellenwert  →  numerisch:\n`;
                steps += `  · = arcsin(${kStr}) + 2k·π\n`;
                steps += `  · = π − arcsin(${kStr}) + 2k·π\n\n`;
              }
              steps += `Hier: x = <b>${nn(pt.x)}</b>`;
            }

          } else { // cos
            if (Math.abs(k) > 1+1e-6) {
              steps += `|${kStr}| > 1  →  <b>Keine reelle Nullstelle</b>`;
            } else if (Math.abs(k) < 1e-6) {
              steps += `<u>Tabellenwert:</u> cos(π/2) = 0\n  →  · = π/2 + k·π  (k ∈ ℤ)\n\n`;
              steps += `Hier: x = <b>${nn(pt.x)}</b>`;
            } else if (Math.abs(Math.abs(k)-1) < 1e-6) {
              const aStr = k > 0 ? '0 (bzw. 2π)' : 'π';
              steps += `<u>Tabellenwert:</u> cos(${aStr}) = ${kStr}\n  →  · = ${k>0?'':'π + '}2k·π  (k ∈ ℤ)\n\n`;
              steps += `Hier: x = <b>${nn(pt.x)}</b>`;
            } else {
              const info = cosAngle(k);
              if (info && info.isTable) {
                steps += `<u>Tabellenwert (Einheitskreis):</u>\n  cos(${info.arcStr}) = ${kStr}\n\n`;
                steps += `<u>Allgemeine Lösung:</u>\n  · = ±${info.arcStr} + 2k·π  (k ∈ ℤ)\n\n`;
              } else {
                steps += `Kein exakter Tabellenwert  →  numerisch:\n`;
                steps += `  · = ±arccos(${kStr}) + 2k·π\n\n`;
              }
              steps += `Hier: x = <b>${nn(pt.x)}</b>`;
            }
          }

        } else if (rat) {
          const { a: rA, h: rH, k: rK } = rat;
          const hS = Math.abs(rH)<1e-5?'x':(rH<0?`x + ${nn(-rH)}`:`x − ${nn(rH)}`);
          steps += `<b>Nullstelle der gebrochenrationalen Funktion:</b>\n\n`;
          steps += `f(x) = ${nn(rA)}/(${hS}) ${rK >= 0 ? '+' : '−'} ${nn(Math.abs(rK))} = 0\n\n`;
          steps += `<u>Schritt 1:</u>  Bruchterm auf die andere Seite\n`;
          steps += `  ${nn(rA)}/(${hS}) = ${nn(-rK)}\n\n`;
          steps += `<u>Schritt 2:</u>  Gleichung auflösen  (×(${hS}))\n`;
          steps += `  ${nn(rA)} = ${nn(-rK)}·(${hS})\n`;
          if (Math.abs(rK) > 1e-6) {
            steps += `  ${hS} = ${nn(rA)}/(${nn(-rK)}) = ${nn(rA/(-rK))}\n`;
            steps += `  x = <b>${nn(pt.x)}</b>`;
          } else {
            steps += `  Zähler ${nn(rA)} ≠ 0  →  <b>Keine Nullstelle</b>`;
          }
        } else {
          const decZ = getRationalDecomposition();
          if (decZ) {
            const { h, m, b: bD, R } = decZ;
            const sS = Math.abs(m-1)<1e-5?'x':(Math.abs(m+1)<1e-5?'−x':`${rr(m)}x`);
            const bS = Math.abs(bD)<1e-6?'':(bD>0?` + ${rr(bD)}`:` − ${rr(-bD)}`);
            const hSign = Math.abs(h)<1e-5?'x':(h<0?`x + ${rr(-h)}`:`x − ${rr(h)}`);
            // Mult. by (x-h): m·x(x-h)+b(x-h)+R=0 → A·x²+B·x+C=0
            const A = m, B = bD - m*h, C = -bD*h + R;
            steps += `<b>Nullstelle: f(x) = ${sS}${bS} + ${rr(R)}/(${hSign}) = 0</b>\n\n`;
            steps += `<u>Schritt 1:</u>  Beide Seiten × (${hSign})\n`;
            steps += `  (${sS}${bS})·(${hSign}) + ${rr(R)} = 0\n\n`;
            steps += `<u>Schritt 2:</u>  Ausmultiplizieren → quadratische Gleichung\n`;
            steps += `  ${rr(A)}x² ${rrSign(B)}x ${rrSign(C)} = 0\n\n`;
            const D = B*B - 4*A*C;
            if (Math.abs(A) < 1e-6) {
              steps += `  ${rr(B)}x ${rrSign(C)} = 0  →  x = <b>${rr(-C/B)}</b>`;
            } else if (Math.abs(D) < 1e-6) {
              const x0 = -B/(2*A);
              steps += `  D = ${rr(D)} ≈ 0\n  → Doppelte Nullstelle: x = <b>${rr(x0)}</b>\n`;
              steps += `  (Berührungsnullstelle — kein Vorzeichenwechsel)`;
            } else if (D < 0) {
              steps += `  D = ${rr(D)} < 0  →  <b>Keine reelle Nullstelle</b>`;
            } else {
              const sq = Math.sqrt(D);
              const x1 = (-B+sq)/(2*A), x2 = (-B-sq)/(2*A);
              const srZ = simplifyRadical(Math.round(D*1e4)/1e4);
              const sqStr = srZ&&srZ.radicand>1?(srZ.coef>1?`${srZ.coef}√${srZ.radicand}`:`√${srZ.radicand}`):`√${rr(D)}`;
              steps += `  D = ${rr(D)}\n`;
              steps += `  x₁ = (${rr(-B)} + ${sqStr}) / ${rr(2*A)} = <b>${rr(x1)}</b>\n`;
              steps += `  x₂ = (${rr(-B)} − ${sqStr}) / ${rr(2*A)} = <b>${rr(x2)}</b>`;
            }
          } else {
            steps += `f(x) = 0\nNumerisch: x ≈ <b>${nn(pt.x)}</b>`;
          }
        }
      }
    }
  } else if (pt.kind === 'max' || pt.kind === 'min') {
    const kindStr = pt.kind === 'max' ? t('solve_max') : t('solve_min');
    steps += `<b>${kindStr} von ${fLabel}</b>\n\n`;
    const quad = getQuadCoeffs();
    if (quad) {
      const { a, b, c } = quad;
      steps += `f(x) = ${rr(a)}x² ${rrSign(b)}x ${rrSign(c)}\n\n`;
      steps += `<u>Methode: Scheitelpunktformel</u>\n`;
      steps += `  xₛ = −b/(2a) = −(${rr(b)}) / (2·${rr(a)})\n`;
      steps += `  xₛ = ${rr(-b)} / ${rr(2*a)} = <b>${rr(pt.x)}</b>\n`;
      const ys = safeEval(expr, pt.x);
      steps += `  yₛ = f(${rr(pt.x)}) = <b>${rr(ys)}</b>\n\n`;
      steps += `${t('solve_vertex')}:\n`;
      steps += `  f(x) = ${rr(a)}·(x − ${rr(pt.x)})² ${rrSign(ys)}\n\n`;
      steps += `<u>${t('solve_proof')} mit Ableitung:</u>\n`;
      steps += `  f'(x) = ${rr(2*a)}x ${rrSign(b)}\n`;
      steps += `  f'(${rr(pt.x)}) = ${rr(2*a*pt.x + b)} ≈ 0 ✓\n`;
      steps += `  f''(x) = ${rr(2*a)} ${a<0?'< 0 → Hochpunkt':'> 0 → Tiefpunkt'}`;
    } else {
      // Kubisch, trigonometrisch oder generisch
      const cubic = getCubicCoeffs();
      const trig  = getTrigInfo();
      const kindStr = pt.kind === 'max' ? 'Hochpunkt' : 'Tiefpunkt';

      if (cubic) {
        const { a, b, c, d } = cubic;
        steps += `<b>${kindStr}: Ableitung der kubischen Funktion</b>\n\n`;
        steps += `f(x) = ${rr(a)}x³ ${rrSign(b)}x² ${rrSign(c)}x ${rrSign(d)}\n\n`;
        steps += `<u>1. Ableitung:</u>\n  f'(x) = ${rr(3*a)}x² ${rrSign(2*b)}x ${rrSign(c)}\n\n`;
        steps += `<u>Extremum: f'(x) = 0</u>\n`;
        const A = 3*a, B = 2*b, C = c;
        const D = B*B - 4*A*C;
        steps += `  ${rr(A)}x² ${rrSign(B)}x ${rrSign(C)} = 0\n`;
        steps += `  D = (${rr(B)})² − 4·${rr(A)}·${rr(C)} = ${rr(B*B)} − ${rr(4*A*C)} = ${nn(D)}\n\n`;
        if (D < -1e-8) {
          steps += `  D < 0  →  <b>Kein reelles Extremum</b>`;
        } else if (Math.abs(D) < 1e-8) {
          const xs = -B/(2*A);
          steps += `  D = 0  →  Sattelstelle (kein echtes Extremum): x = ${nn(xs)}`;
        } else {
          const sqD = Math.sqrt(D);
          const x1 = (-B+sqD)/(2*A), x2 = (-B-sqD)/(2*A);
          const srD = simplifyRadical(Math.round(D * 1e4)/1e4);
          const sqStr = srD && srD.radicand > 1
            ? (srD.coef > 1 ? `${srD.coef}√${srD.radicand}` : `√${srD.radicand}`)
            : `√${nn(D)}`;
          steps += `  x = (−(${rr(B)}) ± ${sqStr}) / (2·${rr(A)})\n`;
          steps += `  x₁ = ${nn(x1)},  x₂ = ${nn(x2)}\n\n`;
          steps += `<u>2. Ableitung (bestimmt Hoch/Tiefpunkt):</u>\n`;
          steps += `  f''(x) = ${rr(6*a)}x ${rrSign(2*b)}\n`;
          const thisX = Math.abs(x1 - pt.x) < Math.abs(x2 - pt.x) ? x1 : x2;
          const d2at  = 6*a*thisX + 2*b;
          steps += `  f''(${nn(thisX)}) ≈ ${rr(d2at)} ${d2at < 0 ? '< 0  → Hochpunkt ✓' : '> 0  → Tiefpunkt ✓'}\n\n`;
          steps += `Extremum: (${nn(pt.x)} | <b>${nn(pt.y)}</b>)`;
        }

      } else if (trig && !trig.mixed && trig.ok && trig.kind !== 'tan') {
        const { kind, a, d } = trig;
        const kindDE  = kind === 'sin' ? 'Sinus' : 'Kosinus';
        const condStr = pt.kind === 'max' ? '1' : '−1';
        const angleStr = pt.kind === 'max'
          ? (kind === 'sin' ? 'π/2' : '0 (bzw. 2π)')
          : (kind === 'sin' ? '3π/2 (bzw. −π/2)' : 'π');
        const extremVal = pt.kind === 'max' ? (a + d) : (-a + d);
        steps += `<b>${kindStr}: ${kindDE}-funktion</b>\n\n`;
        steps += `<u>Amplitude:</u> a ≈ ${nn(a)},  <u>Mittellinie:</u> d ≈ ${nn(d)}\n\n`;
        steps += `${kindStr} wenn ${kind}(·) = ${condStr}:\n`;
        steps += `  ·  = ${angleStr} + 2k·π  (k ∈ ℤ)\n\n`;
        steps += `${pt.kind === 'max' ? 'Maximaler' : 'Minimaler'} Wert:\n`;
        steps += `  f = ${pt.kind === 'max' ? '+' : '−'}${nn(a)} + ${nn(d)} = <b>${nn(extremVal)}</b>\n\n`;
        steps += `Hier: (${nn(pt.x)} | <b>${nn(pt.y)}</b>)`;

      } else {
        const decE = getRationalDecomposition();
        if (decE) {
          const { h, m, b: bD, R } = decE;
          const sS = Math.abs(m-1)<1e-5?'x':(Math.abs(m+1)<1e-5?'−x':`${rr(m)}x`);
          const bS = Math.abs(bD)<1e-6?'':(bD>0?` + ${rr(bD)}`:` − ${rr(-bD)}`);
          const hSign = Math.abs(h)<1e-5?'x':(h<0?`x + ${rr(-h)}`:`x − ${rr(h)}`);
          steps += `<u>Methode: Ableitung der Zerlegung f(x) = ${sS}${bS} + ${rr(R)}/(${hSign})</u>\n\n`;
          steps += `f'(x) = ${rr(m)} − ${rr(R)}/(${hSign})²\n\n`;
          steps += `<u>Extremum: f'(x) = 0</u>\n`;
          steps += `  ${rr(m)} = ${rr(R)}/(${hSign})²\n`;
          steps += `  (${hSign})² = ${rr(R)}/${rr(m)} = ${rr(R/m)}\n`;
          if (R/m < -1e-9) {
            steps += `  ${rr(R/m)} < 0  →  <b>Keine reelle Lösung</b>`;
          } else {
            const sq = Math.sqrt(Math.max(0, R/m));
            const sqRound = Math.round(sq*1e6)/1e6;
            const isIntSq = Math.abs(sqRound - Math.round(sqRound)) < 1e-4;
            const sqStr = isIntSq ? String(Math.round(sqRound)) : `√${rr(R/m)}`;
            steps += `  ${hSign} = ±${sqStr}\n`;
            const x1 = h + sq, x2 = h - sq;
            steps += `  x₁ = ${rr(h)} + ${sqStr} = <b>${rr(x1)}</b>\n`;
            steps += `  x₂ = ${rr(h)} − ${sqStr} = <b>${rr(x2)}</b>\n\n`;
            steps += `<u>2. Ableitung (Nachweis Hoch/Tiefpunkt):</u>\n`;
            steps += `  f''(x) = 2·${rr(R)}/(${hSign})³\n`;
            const d2v1 = 2*R/Math.pow(x1-h, 3), d2v2 = 2*R/Math.pow(x2-h, 3);
            steps += `  f''(${rr(x1)}) = ${rr(d2v1)} ${d2v1<0?'< 0  → Hochpunkt ✓':'> 0  → Tiefpunkt ✓'}\n`;
            steps += `  f''(${rr(x2)}) = ${rr(d2v2)} ${d2v2<0?'< 0  → Hochpunkt ✓':'> 0  → Tiefpunkt ✓'}\n\n`;
            const thisX = Math.abs(pt.x - x1) < Math.abs(pt.x - x2) ? x1 : x2;
            const thisY = safeEval(expr, thisX);
            steps += `Extremum: (<b>${rr(thisX)}</b> | <b>${rr(thisY)}</b>)`;
          }
        } else {
          steps += `<u>f'(x) = 0 setzen  (numerisch):</u>\n\n`;
          steps += `  x ≈ <b>${nn(pt.x)}</b>\n`;
          steps += `  f(${nn(pt.x)}) = <b>${nn(pt.y)}</b>\n\n`;
          const d2 = deriv2(expr, pt.x);
          steps += `<u>2. Ableitung (Nachweis):</u>\n`;
          steps += `  f''(${nn(pt.x)}) ≈ ${r(d2,3)} ${d2<0?'< 0  → Hochpunkt':'> 0  → Tiefpunkt'}`;
        }
      }
    }
  } else if (pt.kind === 'isect') {
    const fn2 = functions[pt.fj]; if (!fn2) return '(Funktion nicht gefunden)';
    const fj = pt.fj;
    steps += `<b>Schnittpunkt f<sub>${fi+1}</sub> ∩ f<sub>${fj+1}</sub></b>\n\n`;
    steps += `Gesucht: x mit f${fi+1}(x) = f${fj+1}(x)\n\n`;

    const lin1 = getLinCoeffs();
    const expr2 = fn2.expr.trim();
    const lin2 = (() => {
      const a = deriv1(expr2, 0), b = safeEval(expr2, 0);
      if (Math.abs(deriv2(expr2, 0)) > 0.01) return null;
      return { a: parseFloat(a.toFixed(6)), b: parseFloat(b.toFixed(6)) };
    })();
    const quad1 = getQuadCoeffs();
    const quad2 = (() => {
      const a2v = deriv2(expr2, 0);
      if (Math.abs(a2v) < 1e-6) return null;
      const a = a2v/2, b = deriv1(expr2, 0), c = safeEval(expr2, 0);
      if (Math.abs(a+b+c - safeEval(expr2,1)) > 0.01) return null;
      return { a: parseFloat(a.toFixed(6)), b: parseFloat(b.toFixed(6)), c: parseFloat(c.toFixed(6)) };
    })();

    if (lin1 && lin2) {
      const { a: a1, b: b1 } = lin1, { a: a2, b: b2 } = lin2;
      steps += `f${fi+1}(x) = ${rr(a1)}x ${rrSign(b1)}\n`;
      steps += `f${fj+1}(x) = ${rr(a2)}x ${rrSign(b2)}\n\n`;
      steps += `Gleichsetzen:\n`;
      steps += `  ${rr(a1)}x ${rrSign(b1)} = ${rr(a2)}x ${rrSign(b2)}\n`;
      const da = a1 - a2, db = b2 - b1;
      if (Math.abs(da) < 1e-8) {
        steps += Math.abs(db) < 1e-8 ? `→ ${t('solve_same')}` : `→ ${t('solve_parallel')}`;
      } else {
        steps += `  ${rr(da)}x = ${rr(db)}\n`;
        steps += `  x = ${rr(db)} / ${rr(da)} = <b>${rr(pt.x)}</b>\n\n`;
        steps += `  y = f${fi+1}(${rr(pt.x)}) = <b>${rr(pt.y)}</b>\n\n`;
        steps += `Schnittpunkt: S = (<b>${rr(pt.x)}</b> | <b>${rr(pt.y)}</b>)`;
      }
    } else if ((lin1 && quad2) || (quad1 && lin2)) {
      const linC = lin1 || lin2, quadC = quad2 || quad1;
      const { a: a1, b: b1 } = linC;
      const { a, b, c } = quadC;
      const isSwapped = !lin1;
      steps += `Gleichsetzen:\n`;
      steps += `  ${rr(a1)}x ${rrSign(b1)} = ${rr(a)}x² ${rrSign(b)}x ${rrSign(c)}\n`;
      const A = a, B = b - a1, C = c - b1;
      steps += `  0 = ${rr(A)}x² ${rrSign(B)}x ${rrSign(C)}\n\n`;
      const D = B*B - 4*A*C;
      steps += `Diskriminante: D = (${rr(B)})² − 4·${rr(A)}·${rr(C)} = <b>${rr(D)}</b>\n\n`;
      if (D < -1e-8) {
        steps += t('solve_no_isect_d');
      } else if (Math.abs(D) < 1e-8) {
        const xs = -B/(2*A), ys = a1*xs + b1;
        steps += `D = 0 → Berührpunkt (Tangente):\n  S = (<b>${rr(xs)}</b> | <b>${rr(ys)}</b>)`;
      } else {
        const sqD = Math.sqrt(D);
        const x1 = (-B+sqD)/(2*A), x2 = (-B-sqD)/(2*A);
        const y1 = a1*x1+b1, y2 = a1*x2+b1;
        steps += `  x₁ = (${rr(-B)} + √${rr(D)}) / ${rr(2*A)} = <b>${rr(x1)}</b>\n`;
        steps += `  x₂ = (${rr(-B)} − √${rr(D)}) / ${rr(2*A)} = <b>${rr(x2)}</b>\n\n`;
        steps += `  S₁ = (<b>${rr(x1)}</b> | <b>${rr(y1)}</b>),  S₂ = (<b>${rr(x2)}</b> | <b>${rr(y2)}</b>)`;
      }
    } else if (quad1 && quad2) {
      const { a: a1, b: b1, c: c1 } = quad1, { a: a2, b: b2, c: c2 } = quad2;
      const A = a1-a2, B = b1-b2, C = c1-c2;
      steps += `Gleichsetzen:\n`;
      steps += `  ${rr(a1)}x² ${rrSign(b1)}x ${rrSign(c1)} = ${rr(a2)}x² ${rrSign(b2)}x ${rrSign(c2)}\n`;
      if (Math.abs(A) < 1e-8) {
        if (Math.abs(B) < 1e-8) { steps += Math.abs(C)<1e-8?t('solve_same_parabola'):t('solve_no_isect'); }
        else {
          const xs = -C/B, ys = safeEval(expr, xs);
          steps += `  0 = ${rr(B)}x ${rrSign(C)}\n`;
          steps += `  x = <b>${rr(xs)}</b>\n\n`;
          steps += `  y = f${fi+1}(${rr(xs)}) = <b>${rr(ys)}</b>\n\n`;
          steps += `Schnittpunkt: S = (<b>${rr(xs)}</b> | <b>${rr(ys)}</b>)`;
        }
      } else {
        steps += `  0 = ${rr(A)}x² ${rrSign(B)}x ${rrSign(C)}\n`;
        const D = B*B-4*A*C;
        steps += `  D = (${rr(B)})² − 4·${rr(A)}·${rr(C)} = <b>${rr(D)}</b>\n\n`;
        if (D < -1e-8) { steps += t('solve_no_isect'); }
        else if (Math.abs(D) < 1e-8) {
          const xs = -B/(2*A), ys = safeEval(expr, xs);
          steps += `  D = 0 → Berührpunkt:\n`;
          steps += `  x = <b>${rr(xs)}</b>,  y = <b>${rr(ys)}</b>\n\n`;
          steps += `Schnittpunkt: S = (<b>${rr(xs)}</b> | <b>${rr(ys)}</b>)`;
        } else {
          const sq=Math.sqrt(D);
          const x1=(-B+sq)/(2*A), x2=(-B-sq)/(2*A);
          const y1=safeEval(expr,x1), y2=safeEval(expr,x2);
          steps += `  x₁ = (${rr(-B)} + √${rr(D)}) / ${rr(2*A)} = <b>${rr(x1)}</b>\n`;
          steps += `  x₂ = (${rr(-B)} − √${rr(D)}) / ${rr(2*A)} = <b>${rr(x2)}</b>\n\n`;
          steps += `  y₁ = f${fi+1}(${rr(x1)}) = <b>${rr(y1)}</b>\n`;
          steps += `  y₂ = f${fi+1}(${rr(x2)}) = <b>${rr(y2)}</b>\n\n`;
          steps += `S₁ = (<b>${rr(x1)}</b> | <b>${rr(y1)}</b>),  S₂ = (<b>${rr(x2)}</b> | <b>${rr(y2)}</b>)`;
        }
      }
    } else {
      steps += `f${fi+1}(x) = f${fj+1}(x)\n(Analytisch nicht allgemein lösbar)\n\n`;
      steps += `Numerisch: x ≈ <b>${nn(pt.x)}</b>, y ≈ <b>${nn(pt.y)}</b>`;
    }

  } else if (pt.kind === 'inf') {
    steps += `<b>Wendepunkt von ${fLabel}</b>\n\n`;
    const quad  = getQuadCoeffs();
    const cubic = getCubicCoeffs();
    const trig  = getTrigInfo();

    if (quad && !cubic) {
      // Parabel hat keinen Wendepunkt
      steps += `f(x) = ${rr(quad.a)}x² ${rrSign(quad.b)}x ${rrSign(quad.c)}\n\n`;
      steps += `<u>2. Ableitung:</u>\n  f''(x) = ${rr(2*quad.a)}\n\n`;
      steps += `f''(x) ist konstant  →  <b>Kein Wendepunkt</b>\n`;
      steps += `(Parabeln sind überall konvex oder überall konkav.)`;

    } else if (cubic) {
      const { a, b, c, d } = cubic;
      steps += `f(x) = ${rr(a)}x³ ${rrSign(b)}x² ${rrSign(c)}x ${rrSign(d)}\n\n`;
      steps += `<u>1. Ableitung:</u>\n  f'(x) = ${rr(3*a)}x² ${rrSign(2*b)}x ${rrSign(c)}\n\n`;
      steps += `<u>2. Ableitung:</u>\n  f''(x) = ${rr(6*a)}x ${rrSign(2*b)}\n\n`;
      steps += `<u>Wendepunkt: f''(x) = 0</u>\n`;
      steps += `  ${rr(6*a)}x ${rrSign(2*b)} = 0\n`;
      steps += `  ${rr(6*a)}x = ${rr(-2*b)}\n`;
      const xW = -b/(3*a);
      steps += `  x = ${rr(-2*b)} / ${rr(6*a)} = <b>${nn(xW)}</b>\n\n`;
      steps += `<u>Vorzeichentest (Krümmung wechselt):</u>\n`;
      const d2L = deriv2(expr, xW - 0.1), d2R = deriv2(expr, xW + 0.1);
      steps += `  f''(x − ε) ≈ ${r(d2L,3)} ${d2L<0?'< 0  (konkav)':'> 0  (konvex)'}\n`;
      steps += `  f''(x + ε) ≈ ${r(d2R,3)} ${d2R<0?'< 0  (konkav)':'> 0  (konvex)'}\n`;
      steps += `  → Vorzeichenwechsel ✓\n\n`;
      steps += `Wendepunkt: W = (<b>${nn(pt.x)}</b> | <b>${nn(pt.y)}</b>)`;

    } else if (trig && !trig.mixed && trig.ok && trig.kind !== 'tan') {
      const { kind, a, d, period } = trig;
      const derKind = kind === 'sin' ? 'cos' : 'sin';
      const kindDE  = kind === 'sin' ? 'Sinus' : 'Kosinus';
      steps += `${fLabel} ist eine ${kindDE}-funktion.\n\n`;
      steps += `<u>Ableitungsregeln:</u>\n`;
      steps += `  f(x) ≈ ${nn(a)}·${kind}(b·x) + ${nn(d)}\n`;
      steps += `  f'(x) ≈ ${nn(a)}·b·${derKind}(b·x)\n`;
      steps += `  f''(x) ≈ −${nn(a)}·b²·${kind}(b·x)\n\n`;
      steps += `<u>Wendepunkt: f''(x) = 0</u>\n`;
      steps += `  ${kind}(b·x) = 0\n`;
      steps += `  <u>Tabellenwert:</u> ${kind}(k·π) = 0  →  b·x = k·π  (k ∈ ℤ)\n\n`;
      if (period) {
        const pfP  = asPiFraction(period);
        const pfH  = asPiFraction(period/2);
        const perStr  = pfP ? formatPi(pfP.p, pfP.q) : `≈${r(period,3)}`;
        const halfStr = pfH ? formatPi(pfH.p, pfH.q) : `≈${r(period/2,3)}`;
        steps += `Periode T = ${perStr}  →  Wendepunkte im Abstand ${halfStr}\n\n`;
      }
      steps += `<u>Funktionswert am Wendepunkt:</u>\n`;
      steps += `  ${kind}(b·x) = 0  →  f(x) = ${nn(a)}·0 + ${nn(d)} = <b>${nn(d)}</b>\n\n`;
      const d2L = deriv2(expr, pt.x - 0.05), d2R = deriv2(expr, pt.x + 0.05);
      steps += `<u>Vorzeichenkontrolle (f''):</u>\n`;
      steps += `  f''(x − ε) ≈ ${r(d2L,3)} ${d2L<0?'< 0':'> 0'}\n`;
      steps += `  f''(x + ε) ≈ ${r(d2R,3)} ${d2R<0?'< 0':'> 0'}  → Vorzeichenwechsel ✓\n\n`;
      steps += `W = (<b>${nn(pt.x)}</b> | <b>${nn(pt.y)}</b>)`;

    } else {
      // Allgemeiner numerischer Fall
      steps += `<u>Bedingung: f''(x) = 0 mit Vorzeichenwechsel</u>\n\n`;
      steps += `Numerisch: x ≈ <b>${nn(pt.x)}</b>\n`;
      steps += `f(${nn(pt.x)}) ≈ <b>${nn(pt.y)}</b>\n\n`;
      const d2L = deriv2(expr, pt.x - 0.1), d2R = deriv2(expr, pt.x + 0.1);
      steps += `<u>Vorzeichentest:</u>\n`;
      steps += `  f''(x − ε) ≈ ${r(d2L,3)} ${d2L<0?'< 0  (konkav)':'> 0  (konvex)'}\n`;
      steps += `  f''(x + ε) ≈ ${r(d2R,3)} ${d2R<0?'< 0  (konkav)':'> 0  (konvex)'}\n`;
      steps += `  → Vorzeichenwechsel: ${Math.sign(d2L) !== Math.sign(d2R) ? '✓  Wendepunkt bestätigt' : '— kein echter Wendepunkt'}\n\n`;
      steps += `W = (<b>${nn(pt.x)}</b> | <b>${nn(pt.y)}</b>)`;
    }
  }
  return fixMM(steps) || `Numerisch: x ≈ ${nn(pt.x)}, y ≈ ${nn(pt.y)}`;
}

// ═══════════════════════════════════════════════════════════════════
// FLÄCHE ZWISCHEN FUNKTIONEN (Numerische Integration)
// ═══════════════════════════════════════════════════════════════════

// Berechnet die Fläche zwischen zwei Funktionen im Intervall [x1, x2].
// Algorithmus: Simpson-Regel mit n=2000 Teilintervallen.
// Genauigkeit: O(h^4) → für die meisten Zwecke ausreichend.
// Anpassen: n=4000 für mehr Präzision (doppelt so langsam)
function computeArea(expr1, expr2, x1, x2) {
  const n = 2000, hh = (x2 - x1) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const x = x1 + i * hh;
    const d = Math.abs(safeEval(expr1, x) - safeEval(expr2, x));
    if (!isFinite(d)) continue;
    // Simpson-Gewichte: 1, 4, 2, 4, 2, ..., 4, 1
    const w = (i === 0 || i === n) ? 1 : (i % 2 === 0 ? 2 : 4);
    sum += w * d;
  }
  return sum * hh / 3;
}

// Gibt den Funktionsausdruck für einen Flächen-Select-Wert zurück.
// '__axis' → x-Achse (y=0)
function getAreaExpr(val) {
  if (val === '__axis') return '0';
  const i = parseInt(val);
  return (functions[i] && functions[i].expr) ? functions[i].expr : '0';
}

// Schaltet Flächen-Anzeige an/aus
function toggleArea() {
  showArea = !showArea;
  const btn = document.getElementById('area-toggle-btn');
  btn.classList.toggle('active-btn', showArea);
  btn.textContent = showArea ? t('btn_area_hide') : t('btn_area');
  if (showArea) updateAreaResult();
  scheduleDraw();
}

// Berechnet und zeigt die Fläche an
function updateAreaResult() {
  const f1v = document.getElementById('area-f1').value, f2v = document.getElementById('area-f2').value;
  const x1 = parseFloat(document.getElementById('area-x1').value), x2 = parseFloat(document.getElementById('area-x2').value);
  if (isNaN(x1) || isNaN(x2) || x1 >= x2) { document.getElementById('area-result').textContent = ''; return; }
  document.getElementById('area-result').textContent = `Fläche ≈ ${computeArea(getAreaExpr(f1v), getAreaExpr(f2v), x1, x2).toFixed(precision)}`;
}

// Befüllt die Dropdowns für Flächen-Auswahl mit aktuellen Funktionen
function syncAreaSelects() {
  const s1 = document.getElementById('area-f1'), s2 = document.getElementById('area-f2');
  const v1 = s1.value, v2 = s2.value; s1.innerHTML = ''; s2.innerHTML = '';
  functions.forEach((fn, i) => {
    [s1, s2].forEach(s => { const o = document.createElement('option'); o.value = i; o.textContent = `f${i+1}`; s.appendChild(o); });
  });
  [s1, s2].forEach(s => { const o = document.createElement('option'); o.value = '__axis'; o.textContent = t('lbl_xaxis'); s.appendChild(o); });
  try { s1.value = v1; } catch(e) {}
  try { s2.value = v2; } catch(e) {}
  if (!s2.value) s2.value = '__axis';
}

// Neuberechnung der Fläche wenn Grenzen oder Funktionen geändert werden
['area-x1','area-x2','area-f1','area-f2'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => { if (showArea) { updateAreaResult(); scheduleDraw(); } });
});

