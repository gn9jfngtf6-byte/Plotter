// ═══════════════════════════════════════════════════════════════════
// MODUL: analysis — Spezielle Punkte & Flächenberechnung
// Enthält:  computeSpecials(), renderSpecialList()
//           toggleArea(), setAreaFromIsects(), computeArea()
// Ändern:  Suchgenauigkeit → SPECIAL_STEPS / AREA_STEPS Konstanten
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// SPEZIELLE PUNKTE BERECHNEN (Extrema, Nullstellen, Wendepunkte, Schnittpunkte)
// ═══════════════════════════════════════════════════════════════════

// Debounce: computeSpecials() läuft frühestens 120ms nach dem letzten Aufruf.
// Das verhindert unnötige Berechnungen während dem Tippen.
// Anpassen: setTimeout(..., 200) für langsamere Aktualisierung
let specialsScheduled = false;
function scheduleComputeSpecials() {
  if (specialsScheduled) return;
  specialsScheduled = true;
  setTimeout(() => { specialsScheduled = false; computeSpecials(); }, 120);
}

// Berechnet alle speziellen Punkte für alle sichtbaren Funktionen.
// Algorithmus: Abtasten in 'steps' Schritten, Vorzeichenwechsel erkennen,
// dann Bisektionsverfahren für genaue Position (40 Iterationen → ~14 Stellen Genauigkeit).
//
// Anpassen:
// - Mehr Präzision: steps=6000 (langsamer aber genauer)
// - Toleranz für Duplikate: tol=1e-3 (weniger Punkte)
function computeSpecials() {
  specials = [];
  const steps = 3000; // Anzahl Abtastpunkte über die aktuelle x-Range
  const dx = (view.xmax - view.xmin) / steps;
  const tol = 1e-4; // Minimalabstand um Duplikate zu vermeiden

  functions.forEach((fi, fi_idx) => {
    if (!fi.expr.trim() || fi.visible === false) return;
    const col = fi.color;
    const isLin = isLinearFunc(fi.expr); // lineare Funktionen haben keine Wendepunkte

    // ── Nullstellen: Vorzeichenwechsel von f(x) ──────────────────
    let py = null, ppx = null;
    for (let s = 0; s <= steps; s++) {
      const x = view.xmin + s * dx, y = safeEval(fi.expr, x);
      if (!isFinite(y)) { py = null; continue; }
      if (py !== null && Math.sign(y) !== Math.sign(py) && py !== 0) {
        // Vorzeichenwechsel: Bisektion zwischen ppx und x
        let lo = ppx, hi = x;
        for (let it = 0; it < 40; it++) { const m = (lo+hi)/2, ym = safeEval(fi.expr, m); if (Math.sign(ym) === Math.sign(py)) lo = m; else hi = m; }
        const mx = (lo+hi)/2;
        if (!specials.some(p => p.kind==='zero' && p.fi===fi_idx && Math.abs(p.x-mx)<tol))
          specials.push({ kind:'zero', fi:fi_idx, x:mx, y:0, col });
      }
      py = y; ppx = x;
    }

    // ── y-Achsen-Schnittpunkt: f(0) wenn 0 im Sichtbereich ───────
    if (view.xmin < 0 && view.xmax > 0) {
      const yy = safeEval(fi.expr, 0);
      if (isFinite(yy)) specials.push({ kind:'yaxis', fi:fi_idx, x:0, y:yy, col });
    }

    // ── Schnittpunkte zwischen Funktionen: Vorzeichenwechsel von f_i - f_j ──
    for (let fj_idx = fi_idx + 1; fj_idx < functions.length; fj_idx++) {
      const fj = functions[fj_idx]; if (!fj.expr.trim()) continue;
      let pd = null, ppx2 = null;
      for (let s = 0; s <= steps; s++) {
        const x = view.xmin + s * dx, yi = safeEval(fi.expr, x), yj = safeEval(fj.expr, x);
        if (!isFinite(yi) || !isFinite(yj)) { pd = null; continue; }
        const d = yi - yj;
        if (pd !== null && Math.sign(d) !== Math.sign(pd) && pd !== 0) {
          let lo = ppx2, hi = x;
          for (let it = 0; it < 40; it++) { const m = (lo+hi)/2, dm = safeEval(fi.expr, m) - safeEval(fj.expr, m); if (Math.sign(dm) === Math.sign(pd)) lo = m; else hi = m; }
          const mx = (lo+hi)/2, my = safeEval(fi.expr, mx);
          if (!specials.some(p => p.kind==='isect' && p.fi===fi_idx && p.fj===fj_idx && Math.abs(p.x-mx)<tol))
            specials.push({ kind:'isect', fi:fi_idx, fj:fj_idx, x:mx, y:my, col });
        }
        pd = d; ppx2 = x;
      }

      // ── Berührungs-Schnittpunkte: lokale Minima von |d| nahe 0 (kein Vorzeichenwechsel) ──
      // Erkennt z.B. x²-3x+2 ∩ 3x-7 → (x-3)²=0 (Tangentialpunkt)
      { let da = null, db = null, xa = null, xb = null;
        for (let s = 0; s <= steps; s++) {
          const xc = view.xmin + s * dx;
          const yi = safeEval(fi.expr, xc), yj = safeEval(fj.expr, xc);
          if (!isFinite(yi) || !isFinite(yj)) { da = db = xa = xb = null; continue; }
          const dc = Math.abs(yi - yj);
          if (da !== null && db !== null && db < da && db < dc) {
            // db ist lokales Minimum von |d| — per Goldenen Schnitt verfeinern
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
                !specials.some(p => p.kind === 'isect' && p.fi === fi_idx && p.fj === fj_idx && Math.abs(p.x - mx) < tol)) {
              specials.push({ kind: 'isect', fi: fi_idx, fj: fj_idx, x: mx, y: my_i, col });
            }
          }
          da = db; db = dc; xa = xb; xb = xc;
        }
      }
    }

    // ── Extrema (f'=0, Vorzeichenwechsel) und Wendepunkte (f''=0) ──
    let pd1 = null, pd2 = null;
    for (let s = 1; s < steps; s++) {
      const x = view.xmin + s * dx;
      const d1 = deriv1(fi.expr, x), d2 = deriv2(fi.expr, x);
      if (!isFinite(d1) || !isFinite(d2)) { pd1 = null; pd2 = null; continue; }

      // Extremum: Vorzeichenwechsel in f'
      if (pd1 !== null && Math.sign(d1) !== Math.sign(pd1) && pd1 !== 0) {
        let lo = view.xmin + (s-1) * dx, hi = x;
        for (let it = 0; it < 40; it++) { const m = (lo+hi)/2, dm = deriv1(fi.expr, m); if (Math.sign(dm) === Math.sign(pd1)) lo = m; else hi = m; }
        const mx = (lo+hi)/2, my = safeEval(fi.expr, mx);
        // f''(mx)<0 → Hochpunkt (max), f''(mx)>0 → Tiefpunkt (min)
        const kind = deriv2(fi.expr, mx) < 0 ? 'max' : 'min';
        if (isFinite(my) && !specials.some(p => p.fi===fi_idx && p.kind===kind && Math.abs(p.x-mx)<tol))
          specials.push({ kind, fi:fi_idx, x:mx, y:my, col });
      }

      // Wendepunkt: Vorzeichenwechsel in f'' UND robuste Prüfung
      // Bedingungen:
      // 1. Funktion ist nicht linear (isLin=false)
      // 2. Beide d2-Werte sind gross genug (>1e-4) um Rauschen auszuschliessen
      // 3. Bestätigung: d2 links und rechts des Kandidaten haben entgegengesetztes Vorzeichen
      // 4. Keine Knickstellen-Funktionen (abs, sqrt, nthroot haben keinen echten Wendepunkt)
      if (!isLin && pd2 !== null && Math.sign(d2) !== Math.sign(pd2) && pd2 !== 0
          && Math.abs(d2) > 1e-4 && Math.abs(pd2) > 1e-4) {
        let lo = view.xmin + (s-1) * dx, hi = x;
        for (let it = 0; it < 40; it++) { const m = (lo+hi)/2, dm = deriv2(fi.expr, m); if (Math.sign(dm) === Math.sign(pd2)) lo = m; else hi = m; }
        const mx = (lo+hi)/2, my = safeEval(fi.expr, mx);
        const d2L = deriv2(fi.expr, mx - 1e-3), d2R = deriv2(fi.expr, mx + 1e-3);
        const realWP = isFinite(d2L) && isFinite(d2R) && Math.sign(d2L) !== Math.sign(d2R) && Math.abs(d2L) > 1e-4 && Math.abs(d2R) > 1e-4;
        const hasKink = /\babs\s*\(|\bsqrt\s*\(|\bnthroot\s*\(/.test(fi.expr);
        if (!hasKink && realWP && isFinite(my) && !specials.some(p => p.fi===fi_idx && p.kind==='inf' && Math.abs(p.x-mx)<tol))
          specials.push({ kind:'inf', fi:fi_idx, x:mx, y:my, col });
      }
      pd1 = d1; pd2 = d2;
    }
  });

  // ── Horizontale Asymptoten für jede Funktion ─────────────────────
  const BIG = 1e7;
  functions.forEach((fi_obj, fi_idx) => {
    if (!fi_obj.expr.trim() || fi_obj.visible === false) return;
    if (isLinearFunc(fi_obj.expr)) return; // lineare Funktionen brauchen keine Asymptoten-Einträge
    const col = fi_obj.color;
    const yP = [safeEval(fi_obj.expr, BIG), safeEval(fi_obj.expr, BIG*0.9), safeEval(fi_obj.expr, BIG*0.8)];
    const yM = [safeEval(fi_obj.expr, -BIG), safeEval(fi_obj.expr, -BIG*0.9), safeEval(fi_obj.expr, -BIG*0.8)];
    const conv = (arr) => arr.every(isFinite) && (Math.max(...arr) - Math.min(...arr)) < 1e-2;
    const addAsymp = (val, dir) => {
      const key = `asymp_${fi_idx}_${parseFloat(val.toFixed(6))}`;
      if (!specials.some(p => p.kind==='asymp' && p.fi===fi_idx && Math.abs(p.y - val) < 1e-4))
        specials.push({ kind: 'asymp', fi: fi_idx, x: 0, y: val, col, dir, asympKey: key });
    };
    if (conv(yP)) { const v = yP[0]; if (isFinite(v)) addAsymp(v, '+∞'); }
    if (conv(yM)) { const v = yM[0]; if (isFinite(v)) addAsymp(v, '-∞'); }
  });

  renderSpecialList(); // Sidebar-Liste aktualisieren
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
  Object.values(groups).forEach(grp => {
    if (grp.length < 2) { grp.forEach(pt => addSPRow(el, pt, niceCoord(pt.x, pt.y))); return; }
    const per = detectPeriod(grp.map(p => p.x));
    if (!per) { grp.forEach(pt => addSPRow(el, pt, niceCoord(pt.x, pt.y))); return; }
    // Periodisch: nur einen zusammenfassenden Eintrag
    const pf = usePiMode() ? asPiFraction(per.period) : null;
    const pStr = pf ? formatPi(pf.p, pf.q) : per.period.toFixed(precision);
    addSPRow(el, grp[0], `(${niceNum(per.base)} + ${pStr}·k | ${niceNum(grp[0].y)})`);
  });
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
    lbl.textContent = `f${pt.fi+1} y = ${niceNum(pt.y)}  (x→${pt.dir})`;
  } else {
    lbl.textContent = (pt.kind === 'isect' ? `f${pt.fi+1}∩f${pt.fj+1} ` : `f${pt.fi+1} `) + label;
  }

  // Lösungsweg-Button (nur für lösbare Typen)
  const fn = functions[pt.fi];
  const canSolve = fn && (pt.kind === 'zero' || pt.kind === 'max' || pt.kind === 'min' || pt.kind === 'isect' || pt.kind === 'asymp' || pt.kind === 'yaxis');
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
    if (Math.abs(deriv2(expr, 0)) > 0.01) return null;
    return { a: parseFloat(a.toFixed(6)), b: parseFloat(b.toFixed(6)) };
  }
  function getQuadCoeffs() {
    const a2 = deriv2(expr, 0);
    if (Math.abs(a2) < 1e-6) return null;
    const a = a2 / 2, b = deriv1(expr, 0), c = safeEval(expr, 0);
    const check = safeEval(expr, 1);
    if (Math.abs(a + b + c - check) > 0.05) return null;
    return { a: parseFloat(a.toFixed(6)), b: parseFloat(b.toFixed(6)), c: parseFloat(c.toFixed(6)) };
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

  let steps = '';

  if (pt.kind === 'asymp') {
    const exp = getExpCoeffs();
    steps += `<b>${t('solve_asymp')} von ${fLabel}</b>\n\n`;
    if (exp) {
      const { a, b } = exp;
      steps += `Funktionstyp: f(x) = ${rr(a)}·${rr(b)}ˣ\n\n`;
      steps += `Horizontale Asymptote:\n`;
      steps += `  lim(x → +∞) f(x) = ${b > 1 ? '+∞' : '0'}  (${b>1?'Wachstum':'Zerfall'})\n`;
      steps += `  lim(x → −∞) f(x) = ${b > 1 ? '0' : '+∞'}\n\n`;
      steps += `→ y = 0 ist horizontale Asymptote\n`;
      steps += `  (Exponentäre Funktion hat Wertebereich ${a>0?'y > 0':'y < 0'}, erreicht nie y = 0)\n\n`;
      if (b > 1) {
        steps += `b = ${rr(b)} > 1 → exponentielle Zunahme\n`;
        steps += `Verdopplungsrate: Δx = ${rr(Math.log(2)/Math.log(b))}`;
      } else {
        steps += `0 < b = ${rr(b)} < 1 → exponentielle Abnahme\n`;
        steps += `Halbwertszeit: Δx = ${rr(Math.log(0.5)/Math.log(b))}`;
      }
    } else {
      steps += `y = ${rr(pt.y)} ist horizontale Asymptote\n\n`;
      steps += `Numerisch: lim(x → ${pt.dir}) f(x) ≈ <b>${rr(pt.y)}</b>`;
    }

  } else if (pt.kind === 'yaxis') {
    steps += `<b>y-Achsenabschnitt von ${fLabel}</b>\n\n`;
    steps += `Gesucht: f(0)\n\n`;
    const lin = getLinCoeffs();
    const quad = getQuadCoeffs();
    const exp = getExpCoeffs();
    if (lin) {
      const { a, b } = lin;
      steps += `f(x) = ${rr(a)}x ${rrSign(b)}\n\n`;
      steps += `f(0) = ${rr(a)}·0 ${rrSign(b)}\n`;
      steps += `f(0) = <b>${rr(b)}</b>\n\n`;
      steps += `Schnittpunkt mit y-Achse: S = (0 | <b>${rr(b)}</b>)`;
    } else if (quad) {
      const { a, b, c } = quad;
      steps += `f(x) = ${rr(a)}x² ${rrSign(b)}x ${rrSign(c)}\n\n`;
      steps += `f(0) = ${rr(a)}·0² ${rrSign(b)}·0 ${rrSign(c)}\n`;
      steps += `f(0) = <b>${rr(c)}</b>\n\n`;
      steps += `Schnittpunkt mit y-Achse: S = (0 | <b>${rr(c)}</b>)`;
    } else if (exp) {
      const { a, b } = exp;
      steps += `f(x) = ${rr(a)}·${rr(b)}ˣ\n\n`;
      steps += `f(0) = ${rr(a)}·${rr(b)}⁰ = ${rr(a)}·1 = <b>${rr(a)}</b>\n\n`;
      steps += `Schnittpunkt mit y-Achse: S = (0 | <b>${rr(a)}</b>)`;
    } else {
      steps += `f(0) = <b>${r(pt.y, 3)}</b>`;
    }

  } else if (pt.kind === 'zero') {
    steps += `<b>${t('solve_zero')} von ${fLabel}</b>\n\n`;
    steps += `${t('solve_given')}: x mit f(x) = 0\n\n`;
    const lin = getLinCoeffs();
    const quad = getQuadCoeffs();
    const exp = getExpCoeffs();

    if (lin) {
      const { a, b } = lin;
      steps += `f(x) = ${rr(a)}x ${rrSign(b)} = 0\n`;
      if (Math.abs(a) < 1e-8) {
        steps += Math.abs(b) < 1e-8 ? 'Jedes x ist eine Nullstelle.' : 'Keine Nullstelle (konstante Funktion).';
      } else {
        steps += `${rr(a)}x = ${rr(-b)}\n`;
        steps += `x = ${rr(-b)} ÷ ${rr(a)} = <b>${rr(pt.x)}</b>`;
      }
    } else if (exp) {
      const { a, b } = exp;
      steps += `f(x) = ${rr(a)}·${rr(b)}ˣ = 0\n\n`;
      steps += `Da ${rr(b)} > 0 ist ${rr(b)}ˣ > 0 für alle x.\n`;
      steps += `Da a = ${rr(a)} ≠ 0, gilt f(x) ≠ 0 für alle x.\n`;
      steps += `→ <b>Keine Nullstelle</b>`;
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
        const isNiceRoot = (x) => Math.abs(x*100 - Math.round(x*100)) < 0.5 && Math.abs(x) <= 20;
        if (isNiceRoot(x1) && isNiceRoot(x2)) {
          steps += `<u>${t('solve_factor')}:</u>\n`;
          steps += `x₁ = <b>${rr(x1)}</b>,  x₂ = <b>${rr(x2)}</b>\n\n`;
          steps += `f(x) = ${rr(a)}·(x − ${rr(x1)})(x − ${rr(x2)})\n\n`;
          steps += `<u>Probe:</u>\n`;
          steps += `  f(${rr(x1)}) = ${rr(safeEval(expr, x1))} ✓\n`;
          steps += `  f(${rr(x2)}) = ${rr(safeEval(expr, x2))} ✓`;
        } else {
          steps += `${t('solve_midnight')}: x = (−b ± √D) / (2a)\n\n`;
          steps += `  x = (−(${rr(b)}) ± √${rr(D)}) / (2·${rr(a)})\n`;
          steps += `  x = (${rr(-b)} ± ${rr(sqD)}) / ${rr(2*a)}\n\n`;
          steps += `  x₁ = (${rr(-b)} + ${rr(sqD)}) / ${rr(2*a)} = <b>${rr(x1)}</b>\n`;
          steps += `  x₂ = (${rr(-b)} − ${rr(sqD)}) / ${rr(2*a)} = <b>${rr(x2)}</b>`;
        }
      }
    } else {
      steps += `f(x) = 0\nNumerisch: x ≈ <b>${r(pt.x, 3)}</b>`;
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
      steps += `f'(x) = 0 setzen:\n`;
      steps += `Numerisch: xₛ ≈ <b>${r(pt.x, 3)}</b>\n`;
      steps += `f(${r(pt.x,3)}) = <b>${r(pt.y, 3)}</b>\n`;
      const d2 = deriv2(expr, pt.x);
      steps += `f''(${r(pt.x,3)}) = ${r(d2,3)} ${d2<0?'< 0 → Hochpunkt':'> 0 → Tiefpunkt'}`;
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
        else { steps += `  0 = ${rr(B)}x ${rrSign(C)}\n  x = <b>${rr(-C/B)}</b>`; }
      } else {
        steps += `  0 = ${rr(A)}x² ${rrSign(B)}x ${rrSign(C)}\n`;
        const D = B*B-4*A*C; steps += `  D = ${rr(D)}\n`;
        if (D < -1e-8) { steps += t('solve_no_isect'); }
        else { const sq=Math.sqrt(D); steps += `  x₁ = <b>${rr((-B+sq)/(2*A))}</b>,  x₂ = <b>${rr((-B-sq)/(2*A))}</b>`; }
      }
    } else {
      steps += `f${fi+1}(x) = f${fj+1}(x)\n(Analytisch nicht allgemein lösbar)\n\n`;
      steps += `Numerisch: x ≈ <b>${r(pt.x,3)}</b>, y ≈ <b>${r(pt.y,3)}</b>`;
    }
  }
  return fixMM(steps) || `Numerisch: x ≈ ${r(pt.x,3)}, y ≈ ${r(pt.y,3)}`;
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

