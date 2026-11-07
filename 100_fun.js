// ═════════════════════════════════════════════════════════════════
// MODUL 100: Fun — Rechenkern der Umgebung «Funktionen: Einführung» (ohne DOM, node-testbar)
//
// Baut auf 60_dif.js (Dif.makeFn: beliebiger Term in x, Dif.tex), 22_steps.js (ST.valueAt: exaktes Einsetzen) und
// 80_lin.js (Lin.Qn) auf. Eine Funktion ist ein beliebiger Term in x.
//   Fun.mk(raw)                    {raw, ast, f, tex} oder null
//   Fun.row(Fx, x)                 Wertetabellen-Zeile {x, xq, xT, y, yT, sub (Einsetzen als LaTeX), exact}
//   Fun.table(Fx, x0, step, n)     n Zeilen ab x0 im Abstand step
//   Fun.bars(Fx, h, x0, x1)        Stellen x = k·h im Bereich (höchstens 400) mit Werten
//   Fun.props(Fx, x0, x1)          numerische Eigenschaften im Bereich: Nullstellen, y-Achsenabschnitt, Extrema, Monotonie, Lücken, min/max
//   Fun.APPS                       Anwendungen mit Grössen und Einheiten
//   Rechenwege (Schritte und SV.Doc): 100b_fun_docs.js
// ═════════════════════════════════════════════════════════════════
const Fun = (function () {
  const E = Dif.E, Qn = Lin.Qn;
  const rnd = x => Math.round(x * 1e6) / 1e6 + 0;
  const fmt = (v, d) => Dif.fmtT(v, d === undefined ? 4 : d);

  function mk(raw) {
    const F = Dif.makeFn(raw); if (!F) return null;
    let tex = ''; try { tex = Dif.tex(F.ast); } catch (e) { tex = String(raw); }
    tex = tex.replace(/\\(pi|alpha|beta|theta)(?=[A-Za-z])/g, '\\$1 ');          // «\pix» → «\pi x»
    return { raw: F.raw, ast: F.ast, F, f: F.fns[0], tex };
  }
  // Zeile der Wertetabelle: exakt, wenn ST.valueAt es schafft, sonst gerundet
  function row(Fx, x) {
    const xq = Qn(x), xT = E.qTex(xq);
    let r = null;
    if (typeof ST !== 'undefined' && ST && ST.valueAt) { try { r = ST.valueAt(Fx.ast, { val: E.qNum(xq), tex: xT, fe: E.feQ(xq) }); } catch (e) { r = null; } }
    const y = r ? r.val : Fx.f(E.qNum(xq));
    const yT = !isFinite(y) ? '\\text{–}' : (r && r.tex ? r.tex : fmt(y));
    return { x: E.qNum(xq), xq, xT, y, yT, sub: r ? r.subTex : '', exact: !!(r && r.exact), ok: isFinite(y) };
  }
  function table(Fx, x0, step, n) {
    const rows = []; step = step || 1; n = Math.max(1, Math.min(40, Math.round(n || 7)));
    for (let i = 0; i < n; i++) rows.push(row(Fx, rnd(x0 + i * step)));
    return rows;
  }
  // Balken: Stellen x = k·h in [x0; x1]
  function bars(Fx, h, x0, x1) {
    const out = []; if (!(h > 0)) return out;
    const k0 = Math.ceil(x0 / h - 1e-9), k1 = Math.floor(x1 / h + 1e-9);
    if (k1 - k0 > 400) return out;
    for (let k = k0; k <= k1; k++) { const x = rnd(k * h), y = Fx.f(x); out.push({ x, y, ok: isFinite(y) }); }
    return out;
  }
  // numerische Eigenschaften im Bereich [x0; x1]
  // Polstellen/ausgeschlossene Punkte von D im Bereich [x0; x1] (aus dw, sonst leer)
  function polesIn(Fx, x0, x1) {
    const R = dw(Fx); if (!R) return [];
    const out = [];
    if (R.per) { const { x0: a, p } = R.per; for (let k = Math.ceil((x0 - a) / p); a + k * p <= x1 && out.length < 200; k++) out.push(a + k * p); return out; }
    R.D.forEach((P, i) => { if (i && !P.loC && Math.abs(P.lo - R.D[i - 1].hi) < 1e-9 && P.lo >= x0 && P.lo <= x1) out.push(P.lo); });
    return out;
  }
  function props(Fx, x0, x1) {
    const f = Fx.f, N = 800, xs = [], ys = [], poles = polesIn(Fx, x0, x1), nearPole = x => poles.some(q => Math.abs(q - x) < (x1 - x0) / N * 2.5);
    for (let i = 0; i <= N; i++) { const x = x0 + (x1 - x0) * i / N; let y = NaN; try { y = f(x); } catch (e) { y = NaN; } xs.push(x); ys.push(isFinite(y) && Math.abs(y) < 1e9 ? y : NaN); }
    const refine = (a, b, g) => { let fa = g(a); for (let j = 0; j < 40; j++) { const m = (a + b) / 2, fm = g(m); if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; };
    const zeros = [];
    for (let i = 0; i + 1 <= N; i++) {
      if (!isFinite(ys[i]) || !isFinite(ys[i + 1])) continue;
      if (ys[i] === 0) zeros.push(xs[i]);
      else if ((ys[i] < 0) !== (ys[i + 1] < 0) && Math.abs(ys[i + 1] - ys[i]) < 1e3 && !nearPole(xs[i])) { const z = refine(xs[i], xs[i + 1], f); if (Math.abs(f(z)) < 1e-4) zeros.push(z); }
    }
    const dedupe = a => a.filter((v, i) => i === 0 || Math.abs(v - a[i - 1]) > 1e-6).map(v => rnd(v));
    // Extrema über die Steigungsänderung (Vorzeichen der Differenzen)
    const ext = [];
    for (let i = 1; i + 1 <= N; i++) {
      if (!isFinite(ys[i - 1]) || !isFinite(ys[i]) || !isFinite(ys[i + 1])) continue;
      const d1 = ys[i] - ys[i - 1], d2 = ys[i + 1] - ys[i];
      if (d1 > 0 && d2 < 0) ext.push({ kind: 'max', x: xs[i], y: ys[i] });
      else if (d1 < 0 && d2 > 0) ext.push({ kind: 'min', x: xs[i], y: ys[i] });
    }
    // Extrema verfeinern (goldener Schnitt)
    ext.forEach(e => { let a = e.x - (x1 - x0) / N, b = e.x + (x1 - x0) / N; const s = e.kind === 'max' ? -1 : 1; for (let j = 0; j < 60; j++) { const m1 = a + (b - a) * 0.382, m2 = a + (b - a) * 0.618; if (s * f(m1) < s * f(m2)) b = m2; else a = m1; } e.x = rnd((a + b) / 2); e.y = f(e.x); });
    for (let i = ext.length - 1; i >= 0; i--) if (nearPole(ext[i].x) || !isFinite(ext[i].y) || Math.abs(ext[i].y) > 1e6) ext.splice(i, 1);   // keine «Extrema» an Polstellen
    // Monotonie-Abschnitte zwischen Extrema und Lücken
    const gaps = []; let inGap = false;
    for (let i = 0; i <= N; i++) { if (!isFinite(ys[i])) { if (!inGap) { gaps.push([xs[i], xs[i]]); inGap = true; } else gaps[gaps.length - 1][1] = xs[i]; } else inGap = false; }
    const cuts = [x0].concat(ext.map(e => e.x)).concat(gaps.flat()).concat(poles).concat([x1]).filter(v => isFinite(v)).sort((a, b) => a - b);
    const mono = [];
    for (let i = 0; i + 1 < cuts.length; i++) {
      const a = cuts[i], b = cuts[i + 1]; if (b - a < 1e-6) continue;
      const m = (a + b) / 2, ya = f(a + (b - a) * 0.05), yb = f(b - (b - a) * 0.05), ym = f(m);
      if (!isFinite(ya) || !isFinite(yb) || !isFinite(ym)) continue;
      mono.push({ a: rnd(a), b: rnd(b), up: yb > ya });
    }
    const fin = ys.filter(v => isFinite(v));
    const y0 = f(0);
    return { zeros: dedupe(zeros), yInt: isFinite(y0) ? y0 : null, ext, mono, gaps: gaps.map(g => [rnd(g[0]), rnd(g[1])]), min: fin.length ? Math.min.apply(null, fin) : null, max: fin.length ? Math.max.apply(null, fin) : null, defined: fin.length === ys.length };
  }

  // ── Definitions- und Wertebereich der GANZEN Funktion (nicht des Bildausschnitts) ──
  // Nutzt die Bedingungen aus 15_domain_range.js (computeDomain: Nenner ≠ 0, Radikand ≥ 0, log-Argument > 0, tan-Pole);
  // die Wertemenge wird je zusammenhängendem Stück von D bestimmt (Inneres, kritische Punkte, Grenzwerte an den Rändern)
  // und als Vereinigung von Intervallen ausgegeben (z.B. 1/(x²−1): ]−∞; −1] ∪ ]0; ∞[). Nur im Browser verfügbar.
  const PI = Math.PI;
  // «Schöne» Zahl erkennen: ganz, Bruch (Nenner ≤ 12), Vielfaches von π, Wurzel — nur mit kleinen Zählern (sonst Dezimalzahl)
  function niceOf(v) {
    if (!isFinite(v)) return null;
    const sg = v < 0 ? -1 : 1, a = Math.abs(v), near = (x, y) => Math.abs(x - y) < 2e-6 * Math.max(1, Math.abs(y)), S = sg < 0 ? '-' : '';
    if (near(a, Math.round(a)) && Math.round(a) <= 1e6) return { v: sg * Math.round(a), tex: S + Math.round(a) };
    for (let d = 2; d <= 12; d++) { const n = Math.round(a * d); if (n <= 120 && near(a, n / d)) return { v: sg * n / d, tex: S + '\\frac{' + n + '}{' + d + '}' }; }
    for (let d = 1; d <= 12; d++) { const n = Math.round(a / PI * d); if (n > 0 && n <= 36 && near(a, n * PI / d)) return { v: sg * n * PI / d, tex: S + (d === 1 ? (n === 1 ? '' : n) + '\\pi' : '\\frac{' + (n === 1 ? '' : n) + '\\pi}{' + d + '}') }; }
    for (let r = 2; r <= 60; r++) { if (Math.sqrt(r) % 1 === 0) continue; for (let d = 1; d <= 6; d++) { const n = Math.round(a * d / Math.sqrt(r)); if (n > 0 && n <= 12 && near(a, n * Math.sqrt(r) / d)) { const t = (n === 1 ? '' : n) + '\\sqrt{' + r + '}'; return { v: sg * n * Math.sqrt(r) / d, tex: S + (d === 1 ? t : '\\frac{' + t + '}{' + d + '}') }; } } }
    return null;
  }
  function numTex(v) { if (!isFinite(v)) return v > 0 ? '\\infty' : '-\\infty'; const n = niceOf(v); return n ? n.tex : fmt(v, 3); }
  // gerundete Grenze (6 Stellen) auf den exakten Wert zurückführen (√3 statt 1.732051)
  function snapNum(v) { const n = niceOf(v); return n ? n.v : v; }
  // Intervall-Liste [{lo, hi, loC, hiC}] → LaTeX (ℝ, ℝ\{…}, Vereinigung)
  function setTex(iv) {
    if (!iv.length) return '\\{\\}';
    const pt = I => Math.abs(I.hi - I.lo) < 1e-12 && I.loC;
    if (iv.every(pt)) return '\\{' + iv.map(I => numTex(I.lo)).join(';\\,') + '\\}';
    if (iv.length === 1 && Math.abs(iv[0].hi - iv[0].lo) < 1e-12 && iv[0].loC) return '\\{' + numTex(iv[0].lo) + '\\}';
    // Stücke, die nur durch einzelne Punkte getrennt sind: Hülle \ {Punkte}
    if (iv.length > 1 && iv.every((I, i) => i === 0 || (Math.abs(I.lo - iv[i - 1].hi) < 1e-9 && !I.loC && !iv[i - 1].hiC))) {
      const a = iv[0], b = iv[iv.length - 1], pts = '\\setminus\\{' + iv.slice(1).map(I => numTex(I.lo)).join(';\\,') + '\\}';
      if (a.lo === -Infinity && b.hi === Infinity) return '\\mathbb{R}' + pts;
      return (a.loC ? '[' : ']') + numTex(a.lo) + ';\\,' + numTex(b.hi) + (b.hiC ? ']' : '[') + pts;
    }
    const all = iv[0].lo === -Infinity && iv[iv.length - 1].hi === Infinity;
    // nur einzelne Punkte fehlen: ℝ \ {…}
    if (all && iv.every((I, i) => i === 0 || (Math.abs(I.lo - iv[i - 1].hi) < 1e-9 && !I.loC && !iv[i - 1].hiC))) {
      if (iv.length === 1) return '\\mathbb{R}';
      return '\\mathbb{R}\\setminus\\{' + iv.slice(1).map(I => numTex(I.lo)).join(';\\,') + '\\}';
    }
    // genau eine Lücke (offen oder geschlossen) zwischen zwei unbeschränkten Stücken: ℝ \ ]a; b[
    if (all && iv.length === 2) { const a = iv[0], b = iv[1]; return '\\mathbb{R}\\setminus' + (a.hiC ? ']' : '[') + numTex(a.hi) + ';\\,' + numTex(b.lo) + (b.loC ? '[' : ']'); }
    const one = I => pt(I) ? '\\{' + numTex(I.lo) + '\\}' : (I.loC ? '[' : ']') + numTex(I.lo) + ';\\,' + numTex(I.hi) + (I.hiC ? ']' : '[');
    if (iv.length > 4) return iv.slice(0, 2).map(one).join('\\cup') + '\\cup\\ldots';
    return iv.map(one).join('\\cup');
  }
  // Polstellen in gleichen Abständen (tan): {x0, p}
  function periodic(ex) {
    if (ex.length < 6) return null;
    const p = ex[1] - ex[0]; if (!(p > 1e-6)) return null;
    for (let i = 2; i < ex.length; i++) if (Math.abs(ex[i] - ex[i - 1] - p) > 1e-3) return null;
    let x0 = ex.reduce((b, v) => (v >= -1e-9 && (b === null || v < b) ? v : b), null); if (x0 === null) x0 = ex[ex.length - 1];
    return { x0: snapNum(x0), p: snapNum(p) };
  }
  const DW_CACHE = {};
  function dw(Fx) {
    if (typeof computeDomain !== 'function' || typeof safeEval !== 'function') return null;
    if (DW_CACHE[Fx.raw]) return DW_CACHE[Fx.raw];
    const r = dw0(Fx); if (r) DW_CACHE[Fx.raw] = r; return r;
  }
  function dw0(Fx) {
    const raw = Fx.raw, ev = x => { let y = NaN; try { y = safeEval(raw, x); } catch (e) { y = NaN; } return y; };
    let d; try { d = computeDomain(raw); } catch (e) { return null; }
    const ex0 = (d.excluded || []).slice().sort((a, b) => a - b), per = periodic(ex0), ex = ex0.map(snapNum);
    // Ist der Rand a (von innen in Richtung dir) eingeschlossen? Auch wenn f(a) wegen Rundung (√3² ≈ 2.9999…) NaN liefert,
    // zählt er, sobald f sich dort stetig mit endlichem Wert fortsetzt (Wurzel), nicht aber bei einem Pol (Logarithmus).
    const valAt = (a, dir) => { const y = ev(a); if (isFinite(y)) return y; const y1 = ev(a + dir * 1e-12), y2 = ev(a + dir * 1e-6); return isFinite(y1) && isFinite(y2) && Math.abs(y1 - y2) < 0.01 ? y1 : NaN; };
    const isPt = a => ex.some(v => Math.abs(v - a) < 1e-9);
    const closedAt = (a, dir) => !isPt(a) && isFinite(valAt(a, dir));
    const cuts = [];
    ex.forEach(v => cuts.push({ lo: v, hi: v, loC: false, hiC: false }));
    (d.gaps || []).forEach(g => { const a = snapNum(g.lo), b = snapNum(g.hi); cuts.push({ lo: a, hi: b, loC: closedAt(a, -1), hiC: closedAt(b, 1) }); });
    cuts.sort((a, b) => a.lo - b.lo);
    const dMin = d.domainMin != null ? snapNum(d.domainMin) : null, dMax = d.domainMax != null ? snapNum(d.domainMax) : null;
    const pieces = []; let lo = dMin != null ? dMin : -Infinity, loC = dMin != null && !d.domainMinOpen && closedAt(dMin, 1);
    cuts.forEach(c => { if (c.lo < lo - 1e-9) return; pieces.push({ lo, hi: c.lo, loC, hiC: c.loC }); lo = c.hi; loC = c.hiC; });
    const hi = dMax != null ? dMax : Infinity;
    pieces.push({ lo, hi, loC, hiC: dMax != null && !d.domainMaxOpen && closedAt(dMax, -1) });
    const D = pieces.filter(P => P.hi - P.lo > 1e-9 || (P.hi === P.lo && P.loC && P.hiC));
    if (!D.length) return { empty: true, Dtex: '\\{\\}', Wtex: '\\{\\}', D: [], W: [], conds: [] };
    // Wertemenge je Stück (bei periodischen Polstellen genügen die Stücke um x0)
    let Wp = D;
    if (per) Wp = D.filter(P => P.hi > per.x0 - 1.5 * per.p && P.lo < per.x0 + 1.5 * per.p);
    else if (Wp.length > 12) Wp = Wp.slice(0, 12);
    const W = [];
    Wp.forEach(P => {
      // mn/mx: {v, c (angenommen), x (Stelle)}
      let mn = { v: Infinity, c: false, x: 0 }, mx = { v: -Infinity, c: false, x: 0 }, ub = false, lb = false;
      const take = (v, c, x) => {
        if (!isFinite(v)) return;
        if (v < mn.v - 1e-9) mn = { v, c, x }; else if (Math.abs(v - mn.v) <= 1e-9 && c && !mn.c) mn = { v, c, x };
        if (v > mx.v + 1e-9) mx = { v, c, x }; else if (Math.abs(v - mx.v) <= 1e-9 && c && !mx.c) mx = { v, c, x };
      };
      const L = isFinite(P.lo) ? P.lo : Math.min(-200, P.hi - 200), H = isFinite(P.hi) ? P.hi : Math.max(200, P.lo + 200), span = Math.max(H - L, 1e-9), N = Math.min(3000, Math.max(400, Math.round(span * 20)));
      for (let i = 1; i < N; i++) { const x = L + span * i / N; take(ev(x), true, x); }
      { const a = Math.max(L, -20), b = Math.min(H, 20); if (b > a) for (let i = 1; i < 2000; i++) { const x = a + (b - a) * i / 2000; take(ev(x), true, x); } }   // fein in der Nähe des Ursprungs
      // Extremstellen verfeinern (goldener Schnitt um die beste Stichprobe)
      const refine = (m, sgn) => { if (!isFinite(m.v)) return; const h = Math.max(span / N, 0.02); let a = Math.max(L, m.x - h), b = Math.min(H, m.x + h); for (let k = 0; k < 60; k++) { const u = a + (b - a) * 0.382, w = a + (b - a) * 0.618, fu = ev(u), fw = ev(w); if (!isFinite(fu) || !isFinite(fw)) break; if (sgn * fu < sgn * fw) b = w; else a = u; } const x = (a + b) / 2; take(ev(x), true, x); };
      refine(mn, 1); refine(mx, -1);
      if (typeof daCriticalPoints === 'function') { try { daCriticalPoints(raw, P.lo, P.hi).forEach(x => take(ev(x), true, x)); } catch (e) {} }
      [[P.lo, 1, P.loC], [P.hi, -1, P.hiC]].forEach(([x0, dir, closed]) => {
        if (closed) { take(valAt(x0, dir), true, x0); return; }
        let lim = null; try { lim = daBoundaryLimit(raw, x0, dir); } catch (e) { lim = null; }
        if (!lim) return;
        if (lim.kind === 'inf') { if (lim.sign > 0) ub = true; else lb = true; return; }
        if (lim.kind !== 'value') return;
        const v = lim.v, ach = !isFinite(x0) && !!lim.achieved;
        // Grenzwert im Unendlichen, nur angenähert (2^x → 0): ein Stichprobenwert weit draussen, der ihn praktisch erreicht, zählt nicht
        const far = m => !isFinite(x0) && Math.abs(m.x) > 50 && Math.abs(m.v - v) < 1e-6 * (1 + Math.abs(v));
        if (!ach && far(mn)) mn = { v, c: false, x: x0 };
        if (!ach && far(mx)) mx = { v, c: false, x: x0 };
        take(v, ach, x0);
      });
      if (!isFinite(mn.v) && !lb && !ub) return;
      const sn = v => { const q = snapNum(v); return Math.abs(q) < 1e-9 ? 0 : q; };
      W.push({ lo: lb ? -Infinity : sn(mn.v), hi: ub ? Infinity : sn(mx.v), loC: !lb && mn.c, hiC: !ub && mx.c });
    });
    // Vereinigen
    W.sort((a, b) => a.lo - b.lo || (b.loC ? 1 : 0) - (a.loC ? 1 : 0));
    const Wm = [];
    W.forEach(I => {
      const last = Wm[Wm.length - 1];
      if (last && (I.lo < last.hi - 1e-9 || (Math.abs(I.lo - last.hi) <= 1e-9 && (I.loC || last.hiC)))) {
        if (I.hi > last.hi + 1e-9) { last.hi = I.hi; last.hiC = I.hiC; } else if (Math.abs(I.hi - last.hi) <= 1e-9) last.hiC = last.hiC || I.hiC;
        if (Math.abs(I.lo - last.lo) <= 1e-9) last.loC = last.loC || I.loC;
      } else Wm.push(Object.assign({}, I));
    });
    // D als LaTeX (periodische Polstellen als x0 + k·p)
    const Dtex = per ? '\\mathbb{R}\\setminus\\{' + numTex(per.x0) + '+k\\cdot ' + numTex(per.p) + '\\mid k\\in\\mathbb{Z}\\}' : setTex(D);
    // Bedingungen für den Rechenweg
    const conds = [];
    if (typeof daCollectConstraints === 'function') {
      try { const out = []; daCollectConstraints(miParseRaw(raw), out); out.forEach(c => { let t = c.expr; try { t = Dif.tex(miParseRaw(c.expr)); } catch (e) {} const key = c.kind + '|' + t; if (!conds.some(q => q.key === key)) conds.push({ key, kind: c.kind, tex: t, val: c.val }); }); } catch (e) {}
    }
    return { D, W: Wm, Dtex, Wtex: setTex(Wm), per, conds };
  }

  // ── Anwendungen: {id, name, raw, fn, xv, xlab, ylab, xmin, xmax, ymin, ymax, step, desc, say(x, y)} ──
  const APPS = [
    { id: 'fall', name: 'Freier Fall', raw: '5*x^2', fn: 's', xv: 't', xlab: 't\\ \\text{(s)}', ylab: 's\\ \\text{(m)}', xmin: 0, xmax: 5, ymin: 0, ymax: 130, step: 1, x0: 3, descTex: 'Fallstrecke $s$ eines Steins nach $t$ Sekunden: $s(t)=5t^2$ (ohne Luftwiderstand).', desc: 'Fallstrecke s eines Steins nach t Sekunden: s(t) = 5·t² (ohne Luftwiderstand).', say: (x, y) => 'Nach ' + fmt(x, 2) + ' s ist der Stein ' + fmt(y, 1) + ' m gefallen.' },
    { id: 'velo', name: 'Velofahrt (Weg–Zeit)', raw: '15*x', fn: 's', xv: 't', xlab: 't\\ \\text{(h)}', ylab: 's\\ \\text{(km)}', xmin: 0, xmax: 4, ymin: 0, ymax: 65, step: 0.5, x0: 2.5, descTex: 'Gleichmässige Fahrt mit 15 km/h: zurückgelegter Weg $s$ nach $t$ Stunden, $s(t)=15t$.', desc: 'Gleichmässige Fahrt mit 15 km/h: zurückgelegter Weg s nach t Stunden, s(t) = 15·t.', say: (x, y) => 'Nach ' + fmt(x, 2) + ' h sind ' + fmt(y, 1) + ' km zurückgelegt.' },
    { id: 'wurf', name: 'Ballwurf', raw: '1.5+10*x-5*x^2', fn: 'h', xv: 't', xlab: 't\\ \\text{(s)}', ylab: 'h\\ \\text{(m)}', xmin: 0, xmax: 2.5, ymin: 0, ymax: 8, step: 0.25, x0: 0.5, descTex: 'Höhe $h$ eines Balls, der aus 1,5 m Höhe mit 10 m/s nach oben geworfen wird: $h(t)=1.5+10t-5t^2$.', desc: 'Höhe h eines Balls, der aus 1,5 m Höhe mit 10 m/s nach oben geworfen wird: h(t) = 1,5 + 10t − 5t².', say: (x, y) => 'Nach ' + fmt(x, 2) + ' s ist der Ball ' + fmt(y, 2) + ' m hoch' + (y < 0 ? ' – er ist schon gelandet.' : '.') },
    { id: 'temp', name: 'Tagestemperatur', raw: '15-8*cos(pi*x/12)', fn: 'T', xv: 't', xlab: 't\\ \\text{(h)}', ylab: 'T\\ \\text{(°C)}', xmin: 0, xmax: 24, ymin: 0, ymax: 26, step: 3, x0: 15, descTex: 'Temperaturverlauf an einem Sommertag: $T(t)=15-8\\cos\\left(\\frac{\\pi t}{12}\\right)$, $t$ in Stunden ab Mitternacht.', desc: 'Temperaturverlauf an einem Sommertag: T(t) = 15 − 8·cos(πt/12), t in Stunden ab Mitternacht.', say: (x, y) => 'Um ' + fmt(x, 1) + ' Uhr sind es ' + fmt(y, 1) + ' °C.' },
    { id: 'tarif', name: 'Handytarif', raw: '20+0.1*x', fn: 'K', xv: 'n', xlab: 'n\\ \\text{(Minuten)}', ylab: 'K\\ \\text{(Fr.)}', xmin: 0, xmax: 400, ymin: 0, ymax: 65, step: 50, x0: 150, descTex: 'Monatskosten $K$: Grundgebühr 20 Fr. plus 10 Rp. pro Gesprächsminute, $K(n)=20+0.1n$.', desc: 'Monatskosten K: Grundgebühr 20 Fr. plus 10 Rp. pro Gesprächsminute, K(n) = 20 + 0,1·n.', say: (x, y) => 'Bei ' + fmt(x, 0) + ' Minuten kostet der Monat ' + fmt(y, 2) + ' Fr.' },
    { id: 'brems', name: 'Bremsweg', raw: 'x^2/100', fn: 's', xv: 'v', xlab: 'v\\ \\text{(km/h)}', ylab: 's\\ \\text{(m)}', xmin: 0, xmax: 130, ymin: 0, ymax: 175, step: 10, x0: 50, descTex: 'Faustregel für den Bremsweg bei Tempo $v$: $s(v)=\\left(\\frac{v}{10}\\right)^2=\\frac{v^2}{100}$.', desc: 'Faustregel für den Bremsweg bei Tempo v: s(v) = (v/10)² = v²/100.', say: (x, y) => 'Bei ' + fmt(x, 0) + ' km/h beträgt der Bremsweg etwa ' + fmt(y, 1) + ' m.' },
    { id: 'kaffee', name: 'Abkühlung', raw: '20+60*0.9^x', fn: 'T', xv: 't', xlab: 't\\ \\text{(min)}', ylab: 'T\\ \\text{(°C)}', xmin: 0, xmax: 40, ymin: 0, ymax: 90, step: 5, x0: 10, descTex: 'Kaffee mit 80 °C kühlt im 20 °C warmen Raum ab: $T(t)=20+60\\cdot0.9^t$.', desc: 'Kaffee mit 80 °C kühlt im 20 °C warmen Raum ab: T(t) = 20 + 60·0,9ᵗ.', say: (x, y) => 'Nach ' + fmt(x, 1) + ' min hat der Kaffee ' + fmt(y, 1) + ' °C.' },
    { id: 'quad', name: 'Fläche eines Quadrats', raw: 'x^2', fn: 'A', xv: 'a', xlab: 'a\\ \\text{(cm)}', ylab: 'A\\ \\text{(cm}^2\\text{)}', xmin: 0, xmax: 6, ymin: 0, ymax: 38, step: 1, x0: 2.5, descTex: 'Flächeninhalt $A$ eines Quadrats mit Seitenlänge $a$: $A(a)=a^2$.', desc: 'Flächeninhalt A eines Quadrats mit Seitenlänge a: A(a) = a².', say: (x, y) => 'Ein Quadrat mit Seite ' + fmt(x, 2) + ' cm hat die Fläche ' + fmt(y, 2) + ' cm².' }
  ];

  // Variable x im LaTeX durch einen anderen Buchstaben ersetzen (nicht in Befehlen wie \exp)
  const subVar = (tex, v) => String(tex).replace(/(?<![A-Za-z\\])x(?![A-Za-z])/g, v);
  return { rnd, Qn, mk, row, table, bars, props, APPS, subVar, dw, numTex, setTex, polesIn };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Fun;
