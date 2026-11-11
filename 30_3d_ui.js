// ═══════════════════════════════════════════════════════════════════
// MODUL: 3d_ui — 3D-Raum: Zeichnen, Drehen, Panel (Rechnung: 29_3d.js)
//
// Schalter «3D-Raum» in der Leiste oben: Der Plot zeigt dann ein räumliches
// Koordinatensystem (orthogonale Projektion, selbst gerechnet – keine Bibliothek)
// und im Menü erscheint nur noch das Panel «3D-Raum». Ebenen werden in
// Koordinatenform eingegeben (2x + 3y − z = 6).
//
// Bedienung:  Ziehen = drehen · Mausrad / Pinch = zoomen · Umschalt+Ziehen
//             bzw. zwei Finger = verschieben · Doppelklick = Standardansicht
//
// Einbindung in bestehende Dateien (alles optional-verkettet):
//   08_draw.js      draw() ruft td3dDraw() statt der 2D-Zeichnung auf
//   09_events.js    captureState()/applyState() nehmen den 3D-Zustand mit (Undo/Speichern)
//   07_export.js    generateLatex() ruft td3dLatex() auf
//   Mausbedienung:  Capture-Listener am Canvas (hier unten), stoppen die 2D-Handler
//
// Ändern:  Farben → TD_COLORS (29_3d.js) · Zeichenreihenfolge → td3dDraw()
//          Standardansicht → TD_VIEW_DEFAULT · Voreinstellungen → TD_PRESETS
// ═══════════════════════════════════════════════════════════════════

const TD_VIEW_DEFAULT = { az: 115, el: 25 };
const TD = {
  on: false,
  view: 'pl',          // Ansicht: 'pl' Ebenen entdecken, sonst Vektorgeometrie (31b_vg.js)
  az: TD_VIEW_DEFAULT.az, el: TD_VIEW_DEFAULT.el,
  zoom: 1, px: 0, py: 0,
  range: 6,
  planes: [],          // {id, eq, color, vis}   (+ Cache: _k, _pl)
  seq: 0,
  opt: { grid: true, gridxz: false, gridyz: false, box: false, icpt: true, traces: true, tracexy: true, tracexz: true, traceyz: true, normal: false, inter: true, names: true },
  bar: { on: false, id: '', step: 1, sstep: 0.1, vals: false, coords: false, hide: false, dots: false }   // Balken über den Gitterpunkten (z-Wert der Ebene)
};
const TD_PRESETS = [
  { t: 'Eine Ebene: 2x + 3y − z = 6', eq: ['2x+3y-z=6'] },
  { t: 'Koordinatenebenen', eq: ['z=0', 'y=0', 'x=0'] },
  { t: 'Zwei Ebenen mit Schnittgerade', eq: ['x+y+z=6', 'x-y=0'] },
  { t: 'Drei Ebenen mit Schnittpunkt', eq: ['x+y+z=6', 'x=2', 'y=3'] },
  { t: 'Parallele Ebenen', eq: ['x+y+z=2', 'x+y+z=7'] },
  { t: 'Ebene mit Schiebern: ax + by + cz = d', eq: ['ax+by+cz=d'] }
];
const TD_SUB = '₀₁₂₃₄₅₆₇₈₉';
const tdSub = n => String(n).split('').map(c => TD_SUB[+c]).join('');
const $td = id => document.getElementById(id);

function td3dActive() { return TD.on; }

// ── Ebenen verwalten ────────────────────────────────────────────────
function tdPl(p) {                       // geparste Ebene (mit Cache); Parameter a, b, c … aus den Schiebern
  const k = p.eq + '|' + JSON.stringify(p.par || {});
  if (p._k !== k) { p._k = k; p._pl = tdParsePlane(p.eq, p.par); }
  return p._pl;
}
// Parameter der Gleichung (Buchstaben a–d …): bestehende Werte bleiben, neue starten bei 1
function tdSyncPar(p) {
  const old = p.par || {}, par = {};
  tdParamNames(p.eq).forEach(n => { par[n] = (typeof old[n] === 'number' && isFinite(old[n])) ? old[n] : 1; });
  p.par = par;
  if (!(p.pstep > 0)) p.pstep = 0.1;
}
function tdValid() { return TD.planes.filter(p => p.vis && !tdPl(p).error).map(p => ({ p, pl: tdPl(p), i: TD.planes.indexOf(p) })); }
function tdName(i) { return 'E' + tdSub(i + 1); }
function tdAddPlane(eq, noHist, didactic) {
  const pl = tdParsePlane(eq);
  if (pl.error) return pl.error;
  if (TD.planes.length >= 6) return 'Höchstens 6 Ebenen';
  TD.seq++;
  const np = { id: 'e' + TD.seq, eq: String(eq).trim(), color: TD_COLORS[(TD.seq - 1) % TD_COLORS.length], vis: true, par: {}, pstep: 0.1 };
  tdSyncPar(np);
  const first = TD.planes.length === 0;
  TD.planes.push(np);
  // Didaktischer Einstieg: bei der ersten eingegebenen Ebene zuerst nur Balken (Abstand 2, mit Höhen und Koordinaten);
  // Ebene, Spurgeraden usw. schaltet man danach Schritt für Schritt dazu. Ohne Balken möglich (Ebene parallel zur z-Achse) → normale Ansicht.
  if (didactic && first && Math.abs(tdPl(np).c) > TD_EPS) {
    Object.assign(TD.bar, { on: true, id: np.id, step: 2, vals: true, coords: true, hide: true, dots: false });
    Object.assign(TD.opt, { icpt: false, traces: false, inter: false, names: false });
  }
  tdChanged(noHist);
  return null;
}
// Scrollposition der Seitenleiste festhalten: Beim Neuaufbau des Panels darf sie nicht springen
function tdKeepScroll(fn) {
  const sb = $td('sidebar'), y = sb ? sb.scrollTop : 0;
  fn();
  if (sb && sb.scrollTop !== y) { sb.scrollTop = y; if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => { if (sb.scrollTop !== y) sb.scrollTop = y; }); }
}
function tdChanged(noHist) {
  tdKeepScroll(tdRenderPanel);
  if (!noHist && typeof pushHistory === 'function') pushHistory();
  tdSyncHint();
  if (typeof scheduleDraw === 'function') scheduleDraw();
}

// ── Zustand (Undo / Speichern) ──────────────────────────────────────
function tdCapture() {
  return JSON.parse(JSON.stringify({
    planes: TD.planes.map(p => ({ id: p.id, eq: p.eq, color: p.color, vis: p.vis, par: p.par || {}, pstep: p.pstep || 0.1 })),
    seq: TD.seq, range: TD.range, opt: TD.opt, bar: TD.bar, view: TD.view || 'pl', vg: typeof vgCapture === 'function' ? vgCapture() : undefined
  }));
}
function tdApply(s) {
  // ohne gespeicherten Zustand (erster Besuch, «Zurücksetzen»): eine Beispielebene, damit das Bild nicht leer ist
  if (!s || !Array.isArray(s.planes)) { TD.planes = []; TD.seq = 0; if (!s || !s.view || s.view === 'pl') tdAddPlane('2x+3y-z=6', true); }
  else {
    TD.planes = s.planes.filter(p => p && typeof p.eq === 'string').slice(0, 6)
      .map(p => { const q = { id: String(p.id || ''), eq: p.eq, color: p.color || TD_COLORS[0], vis: p.vis !== false, par: (p.par && typeof p.par === 'object') ? Object.assign({}, p.par) : {}, pstep: p.pstep > 0 ? p.pstep : 0.1 }; tdSyncPar(q); return q; });
    TD.seq = Math.max(s.seq || 0, TD.planes.length);
    if (s.range > 0) TD.range = s.range;
    if (s.opt) Object.keys(TD.opt).forEach(k => { if (k in s.opt) TD.opt[k] = !!s.opt[k]; });
    if (s.bar) { TD.bar.on = !!s.bar.on; TD.bar.id = String(s.bar.id || ''); TD.bar.vals = !!s.bar.vals; TD.bar.coords = !!s.bar.coords; TD.bar.hide = !!s.bar.hide; TD.bar.dots = !!s.bar.dots; if (s.bar.step >= 0) TD.bar.step = s.bar.step; if (s.bar.sstep > 0) TD.bar.sstep = s.bar.sstep; }
  }
  TD.view = s && typeof VG_VIEWS !== 'undefined' && VG_VIEWS.some(v => v[0] === s.view) ? s.view : 'pl';
  if (typeof vgApply === 'function') vgApply(s && s.vg);
  tdKeepScroll(tdRenderPanel);
}

// ═══════════════════════════════════════════════════════════════════
// Zeichnen
// ═══════════════════════════════════════════════════════════════════
// Balken-Daten: gewählte (oder erste geeignete) Ebene, Gitterpunkte und z-Werte; null, wenn nichts anzuzeigen ist
function tdBarData(capN) {
  if (!TD.bar.on || !(TD.bar.step > 0)) return null;         // Gitterabstand 0 → keine Balken
  const cand = tdValid().filter(it => Math.abs(it.pl.c) > TD_EPS);
  if (!cand.length) return null;
  const it = cand.find(c => c.p.id === TD.bar.id) || cand[0];
  // nicht zu viele Balken: Abstand als Vielfaches des gewünschten Abstands vergröbern
  const cap = capN || 60, k = Math.max(1, Math.ceil(TD.range / (TD.bar.step * cap) - 1e-9));
  const step = Math.round(TD.bar.step * k * 1e6) / 1e6;
  const pts = tdBars(it.pl, TD.range, step);
  return pts ? { it, pts, step, coarse: k > 1 } : null;
}

// Id der Ebene, die ausgeblendet wird (nur Balken sichtbar) – nur wenn tatsächlich Balken gezeichnet werden
function tdBarHideId() {
  if (!TD.bar.hide) return null;
  const b = tdBarData(1);
  return b ? b.it.p.id : null;
}

function tdGeom(w, h) {
  const R = TD.range;
  const s = Math.min(w, h) / (2 * 1.42 * R) * TD.zoom;
  const v = { az: TD.az, el: TD.el }; v._m = tdViewMat(v);
  const cx = w / 2 + TD.px, cy = h / 2 + TD.py;
  return {
    R, s, v, cx, cy,
    P: p => { const q = tdProject(p, v); return { x: cx + q.sx * s, y: cy - q.sy * s, d: q.depth }; }
  };
}

function td3dDraw(w, h) {
  const dk = typeof vgDock === 'function' ? vgDock(w, h) : [0, 0];   // Rechenweg-Karte (Vektorgeometrie)
  const g = tdGeom(w - dk[0], h - dk[1]), R = g.R, P = g.P;
  const dark = typeof darkMode !== 'undefined' && darkMode;
  const lw = x => (typeof bw === 'function' ? bw(x) : x);
  const fs = x => (typeof bf === 'function' ? bf(x) : x);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
  const box = { x: [-R, R], y: [-R, R], z: [-R, R] };
  const line = (a, b, col, wd, dash) => {
    const p = P(a), q = P(b);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
    ctx.strokeStyle = col; ctx.lineWidth = lw(wd); ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
  };
  const text = (str, x, y, col, size, align, bold) => {
    ctx.font = (bold ? '600 ' : '') + fs(size) + 'px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif';
    ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = lw(3.5); ctx.strokeStyle = C.bg; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y);
    ctx.fillStyle = col; ctx.fillText(str, x, y);
  };
  const dot = (p3, col, r) => {
    const p = P(p3); ctx.beginPath(); ctx.arc(p.x, p.y, lw(r || 3.5), 0, 7);
    ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = lw(1.5); ctx.strokeStyle = C.bg; ctx.stroke();
  };
  const arrow = (a, b, col, wd, head) => {
    const p = P(a), q = P(b), ang = Math.atan2(q.y - p.y, q.x - p.x), hl = lw(head || 9);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x - Math.cos(ang) * hl * 0.6, q.y - Math.sin(ang) * hl * 0.6);
    ctx.strokeStyle = col; ctx.lineWidth = lw(wd); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(q.x, q.y);
    ctx.lineTo(q.x - hl * Math.cos(ang - 0.38), q.y - hl * Math.sin(ang - 0.38));
    ctx.lineTo(q.x - hl * Math.cos(ang + 0.38), q.y - hl * Math.sin(ang + 0.38));
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  };
  const step = tdNiceStep(R);

  // 1. Gitter der Koordinatenebenen (xy = Grundfläche, xz, yz) und Rahmen
  const nT0 = Math.floor(R / step + 1e-9);
  const gridPlane = (mk) => {                       // mk(u, v) → Punkt; u, v laufen von −R bis R
    ctx.beginPath(); [[-R, -R], [R, -R], [R, R], [-R, R]].forEach(([u, v], k) => { const q = P(mk(u, v)); if (k) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }); ctx.closePath();
    ctx.globalAlpha = dark ? 0.07 : 0.05; ctx.fillStyle = C.axis; ctx.fill(); ctx.globalAlpha = 1;
    for (let t = -nT0; t <= nT0; t++) {
      const v = t * step;
      line(mk(v, -R), mk(v, R), C.grid, 1);
      line(mk(-R, v), mk(R, v), C.grid, 1);
    }
  };
  if (TD.opt.grid) gridPlane((u, v) => [u, v, 0]);
  if (TD.opt.gridxz) gridPlane((u, v) => [u, 0, v]);
  if (TD.opt.gridyz) gridPlane((u, v) => [0, u, v]);
  if (TD.opt.box) {
    tdBoxEdges(box).forEach(([a, b]) => line(a, b, C.grid, 1, [4, 4]));
  }

  // 2. Achsen mit Marken
  const axes = [{ v: [1, 0, 0], n: 'x' }, { v: [0, 1, 0], n: 'y' }, { v: [0, 0, 1], n: 'z' }];
  axes.forEach(ax => {
    const a = ax.v.map(c => -c * R), b = ax.v.map(c => c * R), tip = ax.v.map(c => c * R * 1.1);
    line(a, b, C.axis, 1.6);
    arrow(b, tip, C.axis, 1.6, 9);
    const o = P([0, 0, 0]), u = P(ax.v);
    const dx = u.x - o.x, dy = u.y - o.y, len = Math.hypot(dx, dy);
    if (len * step > 14) {                     // Marken nur, wenn die Achse nicht auf den Betrachter zeigt
      const nx = -dy / len, ny = dx / len;
      for (let t = -Math.floor(R / step + 1e-9); t <= Math.floor(R / step + 1e-9); t++) {
        if (t === 0) continue;
        const p = P(ax.v.map(c => c * t * step));
        ctx.beginPath(); ctx.moveTo(p.x - nx * 3, p.y - ny * 3); ctx.lineTo(p.x + nx * 3, p.y + ny * 3);
        ctx.strokeStyle = C.axis; ctx.lineWidth = lw(1.2); ctx.stroke();
        if (len * step > 22) { const sg = ny > 0.05 ? 1 : ny < -0.05 ? -1 : (nx > 0 ? 1 : -1); text(tdNum(t * step, 2), p.x + nx * sg * 11, p.y + ny * sg * 11, C.label, 10); }
      }
    }
    const tp = P(ax.v.map(c => c * R * 1.1)), dirx = tp.x - o.x, diry = tp.y - o.y, dl = Math.hypot(dirx, diry) || 1;
    text(ax.n, tp.x + dirx / dl * 11, tp.y + diry / dl * 11, C.anno, 14, 'center', true);
  });
  { const o = P([0, 0, 0]); text('O', o.x - 9, o.y + 9, C.label, 10); }
  // Vektorgeometrie (31b_vg.js): eigene Objekte statt der Ebenen
  if (TD.view && TD.view !== 'pl' && typeof vgDraw === 'function') {
    vgDraw({ g, P, line, text, dot, arrow, lw, dark });
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    if (typeof drawLaserPointer === 'function') drawLaserPointer();
    return g;
  }

  // 3. Ebenen (hinten zuerst), halbtransparent
  const items = tdValid().map(it => {
    const poly = tdPlanePolygon(it.pl, box);
    const cen = poly.length ? poly.reduce((s, p) => V3.add(s, p), [0, 0, 0]).map(c => c / poly.length) : null;
    return Object.assign(it, { poly, cen, depth: cen ? P(cen).d : 0 });
  }).sort((a, b) => b.depth - a.depth);
  const hideId = tdBarHideId();
  // verlinkte Überschrift (02_core.js envHint): Ebenen, Spurgeraden, Achsenabschnitte, Schnitte als hervorhebbare Linienzüge
  const hS = typeof VG !== 'undefined' ? (VG.S = { pts: [], hl: [] }) : null;
  const hlP = (id, pts3, close) => { if (hS) hS.hl.push({ id, pts: pts3.map(p => { const q = P(p); return [q.x, q.y]; }), close: !!close }); };
  const hlC = (id, p3) => { if (hS) { const q = P(p3); hS.hl.push({ id, c: [q.x, q.y, 10] }); } };
  items.forEach(it => {
    if (it.poly.length < 3 || it.p.id === hideId) return;
    hlP('E', it.poly, true);
    ctx.beginPath();
    it.poly.forEach((p3, k) => { const q = P(p3); if (k) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
    ctx.closePath();
    ctx.globalAlpha = dark ? 0.30 : 0.26; ctx.fillStyle = it.p.color; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = it.p.color; ctx.lineWidth = lw(1.6); ctx.stroke();
  });

  // 3b. Balken: von jedem Gitterpunkt (x|y|0) senkrecht zum Punkt (x|y|z) auf der Ebene
  const bars = tdBarData();
  if (bars) {
    const col = bars.it.p.color, sp = bars.step * g.s * 0.6;
    const dense = sp < 5;                                    // sehr dichtes Gitter: nur Striche, keine Punkte
    const wd = dense ? Math.max(0.7, sp * 0.55) : Math.max(1.6, Math.min(6, sp * 0.32));
    const list = bars.pts.map(q => ({ q, d: P([q.x, q.y, 0]).d })).sort((a, b) => b.d - a.d);
    ctx.strokeStyle = col; ctx.lineWidth = lw(wd); ctx.lineCap = 'butt';
    list.forEach(({ q }) => {
      const a = P([q.x, q.y, 0]), t = P([q.x, q.y, q.z]);
      if (!dense && !TD.bar.dots) { ctx.beginPath(); ctx.arc(a.x, a.y, lw(Math.max(1.6, wd * 0.55)), 0, 7); ctx.fillStyle = C.axis; ctx.fill(); }
      if (TD.bar.dots) {                                     // nur Punkte auf der Ebene, keine Balken
        ctx.beginPath(); ctx.arc(t.x, t.y, lw(Math.max(1.8, Math.min(5.5, sp * 0.3))), 0, 7); ctx.fillStyle = col; ctx.fill();
        return;
      }
      if (Math.abs(q.z) < 1e-9) return;
      ctx.globalAlpha = dense ? 0.5 : 0.85; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(t.x, t.y); ctx.stroke(); ctx.globalAlpha = 1;
      if (!dense) { ctx.beginPath(); ctx.arc(t.x, t.y, lw(wd * 0.75), 0, 7); ctx.fillStyle = col; ctx.fill(); }
    });
    ctx.lineCap = 'round';
    // Koordinaten (x | y) der Gitterpunkte unter den Balken — nur, wenn genug Platz ist
    const tight = TD.bar.coords && sp < 40;
    if (!!TD._tight !== tight) { TD._tight = tight; tdBarNote(); }
    if (TD.bar.coords && !tight) list.forEach(({ q }) => {
      const a = P([q.x, q.y, 0]);
      text('(' + tdNum(q.x, 2) + ' | ' + tdNum(q.y, 2) + ')', a.x, a.y + 12, C.anno, 10);
    });
    if (TD.bar.vals && sp >= 24) list.forEach(({ q }) => {
      if (Math.abs(q.z) < 1e-9) return;
      const t = P([q.x, q.y, q.z]);
      text(tdNum(q.z, 2), t.x, t.y - (q.z >= 0 ? 10 : -10), col, 10);
    });
  }

  // 4. Spurgeraden, Achsenabschnitte, Normalenvektor
  items.forEach(it => {
    if (it.poly.length < 3) return;
    const col = it.p.color;
    if (TD.opt.traces) tdTraces(it.pl, box).forEach((t, k) => { if (t && TD.opt[['tracexy', 'tracexz', 'traceyz'][k]]) { line(t.A, t.B, col, 3); hlP('sp', [t.A, t.B]); } });
    if (TD.opt.icpt) tdIntercepts(it.pl).forEach(q => {
      if (!q || q.some(c => Math.abs(c) > R + 1e-9)) return;
      if (q.every(c => Math.abs(c) < 1e-12)) return;
      dot(q, col, 4); hlC('ac', q);
      const pp = P(q);
      text('(' + q.map(c => tdNum(c, 2)).join(' | ') + ')', pp.x + 6, pp.y - 12, col, 11, 'left');
    });
    if (TD.opt.normal) {
      const F = tdFootOrigin(it.pl), nl = V3.len(tdNormal(it.pl)), L = R * 0.4;
      if (F.every(c => Math.abs(c) <= R)) {
        const tip = V3.add(F, V3.mul(tdNormal(it.pl), L / nl));
        dot(F, col, 3);
        arrow(F, tip, col, 2.4, 11);
        const tp = P(tip); text('n' + (items.length > 1 ? tdSub(it.i + 1) : ''), tp.x + 9, tp.y - 9, col, 13, 'center', true);
      }
    }
  });

  // 5. Schnittgeraden und Schnittpunkte
  const rel = tdRelations(items.slice().sort((a, b) => a.i - b.i));   // Reihenfolge E₁, E₂ … (nicht nach Tiefe)
  if (TD.opt.inter) {
    rel.pairs.forEach(r => {
      if (!r.L) return;
      const t = tdClipLine(r.L.P, r.L.u, box); if (!t || t[1] - t[0] < 1e-9) return;
      const A = V3.add(r.L.P, V3.mul(r.L.u, t[0])), B = V3.add(r.L.P, V3.mul(r.L.u, t[1]));
      line(A, B, C.anno, 3); hlP('sg', [A, B]);
      const m = P(V3.add(A, V3.mul(V3.sub(B, A), 0.5)));
      text('g' + tdSub(r.a.i + 1) + tdSub(r.b.i + 1), m.x + 8, m.y - 10, C.anno, 12, 'left', true);
    });
    rel.triples.forEach(r => {
      if (!r.S || r.S.some(c => Math.abs(c) > R + 1e-9)) return;
      dot(r.S, C.anno, 5); hlC('S', r.S);
      const pp = P(r.S);
      text('S(' + r.S.map(c => tdNum(c, 2)).join(' | ') + ')', pp.x + 8, pp.y - 12, C.anno, 12, 'left', true);
    });
  }

  // 6. Namen der Ebenen
  if (TD.opt.names) items.forEach(it => {
    if (it.poly.length < 3) return;
    // Beschriftung an der Ecke des Vielecks, die im Bild am weitesten oben/rechts liegt (ausserhalb der Mitte)
    let best = null;
    it.poly.forEach(p3 => { const q = P(p3); const sc = q.x * 0.35 - q.y; if (!best || sc > best.sc) best = { q, sc }; });
    const c = P(it.cen);
    const dx = best.q.x - c.x, dy = best.q.y - c.y, dl = Math.hypot(dx, dy) || 1;
    text(tdName(it.i), best.q.x - dx / dl * 16, best.q.y - dy / dl * 16, it.p.color, 14, 'center', true);
  });
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  g.rel = rel;
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
  return g;
}

// Lage der Ebenen zueinander (für Zeichnung und Panel)
function tdRelations(items) {
  const pairs = [], triples = [];
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const L = tdPlanePlane(items[i].pl, items[j].pl);
    pairs.push({ a: items[i], b: items[j], L: L.parallel ? null : L, parallel: !!L.parallel, same: !!L.same,
                 angle: tdAnglePlanes(items[i].pl, items[j].pl) });
  }
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) for (let k = j + 1; k < items.length; k++) {
    triples.push({ a: items[i], b: items[j], c: items[k], S: tdThreePlanes(items[i].pl, items[j].pl, items[k].pl) });
  }
  return { pairs, triples };
}

// ═══════════════════════════════════════════════════════════════════
// LaTeX-Export (TikZ, ohne pgfplots): Die Projektion steckt in den Basisvektoren
// x={(…)}, y={(…)}, z={(…)} — alle Punkte stehen als (x,y,z) im Code und lassen sich
// von Hand ändern. Reihenfolge und Darstellung wie auf dem Bildschirm.
// ═══════════════════════════════════════════════════════════════════
function td3dLatex() {
  const R = TD.range, v = { az: TD.az, el: TD.el }; v._m = tdViewMat(v);
  const u = 3.8 / R;                                 // cm pro Einheit: der halbe Rahmen ist 3.8 cm gross
  const f = x => { const r = Math.round(x * 1e4) / 1e4; return String(Object.is(r, -0) ? 0 : r); };
  const c3 = p => '(' + p.map(x => (typeof x === 'string' ? x : f(x))).join(',') + ')';
  const bx = a => { const q = tdProject(a, v); return '(' + f(q.sx * u) + 'cm,' + f(q.sy * u) + 'cm)'; };
  const box = { x: [-R, R], y: [-R, R], z: [-R, R] };
  const tex = x => String(x).replace(/−/g, '-');
  // Anker: der Text soll von der Achse weg zeigen
  const anchor = (dx, dy) => {
    const a = Math.atan2(dy, dx) * 180 / Math.PI;           // Richtung des Ziels auf dem Bildschirm (y oben)
    const names = ['west', 'south west', 'south', 'south east', 'east', 'north east', 'north', 'north west'];
    return names[((Math.round(a / 45) % 8) + 8) % 8];       // Ziel nach rechts → Text links davon (west)
  };
  const sdir = d => { const q = tdProject(d, v); return [q.sx, q.sy]; };
  const L = [];
  const items = tdValid().map(it => {
    const poly = tdPlanePolygon(it.pl, box);
    const cen = poly.length ? poly.reduce((s, p) => V3.add(s, p), [0, 0, 0]).map(c => c / poly.length) : null;
    return Object.assign(it, { poly, cen, depth: cen ? tdProject(cen, v).depth : 0 });
  }).sort((a, b) => b.depth - a.depth);
  const step = tdNiceStep(R), nT = Math.floor(R / step + 1e-9);
  const lbl = 'fill=white, fill opacity=0.75, text opacity=1, inner sep=1pt';

  L.push('% 3D-Raum aus J\\sqrt{10} — benötigt nur \\usepackage{tikz}');
  L.push('% Blickrichtung: Azimut ' + f(TD.az) + '°, Elevation ' + f(TD.el) + '°; ' + f(u) + ' cm pro Einheit (Skalierung: [scale=…])');
  items.forEach(it => {
    const h = String(it.p.color).replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(h)) L.push('\\definecolor{tdE' + (it.i + 1) + '}{RGB}{' + [0, 2, 4].map(k => parseInt(h.substr(k, 2), 16)).join(',') + '}');
  });
  const colOf = it => /^#[0-9a-fA-F]{6}$/.test(it.p.color) ? 'tdE' + (it.i + 1) : 'blue';
  L.push('\\begin{tikzpicture}[x={' + bx([1, 0, 0]) + '}, y={' + bx([0, 1, 0]) + '}, z={' + bx([0, 0, 1]) + '},');
  L.push('  line cap=round, line join=round, >=stealth]');

  [['grid', 'Grundfläche z = 0', (a, b) => [a, b, 0]], ['gridxz', 'xz-Ebene y = 0', (a, b) => [a, 0, b]], ['gridyz', 'yz-Ebene x = 0', (a, b) => [0, a, b]]].forEach(([k, nm, mk]) => {
    if (!TD.opt[k]) return;
    const ts = Array.from({ length: 2 * nT + 1 }, (_, i) => f((i - nT) * step)).join(',');
    L.push('  % Gitter (' + nm + ')');
    L.push('  \\fill[gray, opacity=0.05] ' + [[-R, -R], [R, -R], [R, R], [-R, R]].map(([a, b]) => c3(mk(a, b))).join(' -- ') + ' -- cycle;');
    L.push('  \\foreach \\t in {' + ts + '} {');
    L.push('    \\draw[gray!30, very thin] ' + c3(mk('\\t', f(-R))) + ' -- ' + c3(mk('\\t', f(R))) + ';');
    L.push('    \\draw[gray!30, very thin] ' + c3(mk(f(-R), '\\t')) + ' -- ' + c3(mk(f(R), '\\t')) + ';');
    L.push('  }');
  });
  if (TD.opt.box) {
    L.push('  % Rahmen');
    tdBoxEdges(box).forEach(([a, b]) => L.push('  \\draw[gray!50, dashed, thin] ' + c3(a) + ' -- ' + c3(b) + ';'));
  }
  L.push('  % Achsen');
  [['x', [1, 0, 0]], ['y', [0, 1, 0]], ['z', [0, 0, 1]]].forEach(([n, d]) => {
    const a = d.map(c => -c * R), b = d.map(c => c * R), tip = d.map(c => c * R * 1.1);
    L.push('  \\draw[->, thick] ' + c3(a) + ' -- ' + c3(tip) + ' node[anchor=' + anchor(...sdir(d)) + '] {$' + n + '$};');
    const dir = sdir(d);
    if (Math.hypot(dir[0], dir[1]) * u * step > 0.25) {
      for (let t = -nT; t <= nT; t++) {
        if (!t) continue;
        const p = d.map(c => c * t * step);
        const perp = [-dir[1], dir[0]], sg = perp[1] > 0.05 ? 1 : perp[1] < -0.05 ? -1 : (perp[0] > 0 ? 1 : -1);
        L.push('  \\fill ' + c3(p) + ' circle (0.5pt) node[font=\\tiny, anchor=' + anchor(-perp[0] * sg, -perp[1] * sg) + ', inner sep=2pt] {$' + tex(tdNum(t * step, 2)) + '$};');
      }
    }
  });

  if (TD.view && TD.view !== 'pl' && typeof vgTex === 'function') { vgTex(L, { c3, f, lbl, u }); L.push('\\end{tikzpicture}'); return L.join('\n'); }
  const hideId = tdBarHideId();
  items.forEach(it => {
    if (it.poly.length < 3) return;
    const col = colOf(it);
    if (it.p.id === hideId) { L.push('  % ' + tdName(it.i).replace(/[₀-₉]/g, c => TD_SUB.indexOf(c)) + ': ' + tex(tdPlaneStr(it.pl)) + ' (Ebene ausgeblendet)'); return; }
    L.push('  % ' + tdName(it.i).replace(/[₀-₉]/g, c => TD_SUB.indexOf(c)) + ': ' + tex(tdPlaneStr(it.pl)));
    L.push('  \\filldraw[fill=' + col + ', fill opacity=0.25, draw=' + col + ', thick] ' + it.poly.map(c3).join(' -- ') + ' -- cycle;');
  });
  { const bars = tdBarData(10);                        // höchstens ~440 Balken im Code
    if (bars) {
      const col = colOf(bars.it);
      L.push('  % Balken: z-Wert der Ebene ' + tdName(bars.it.i).replace(/[₀-₉]/g, c => TD_SUB.indexOf(c)) + ' über jedem Gitterpunkt (Abstand ' + f(bars.step) + (bars.step > TD.bar.step + 1e-9 ? ', gröber als im Plot, damit der Code kurz bleibt' : '') + ')');
      bars.pts.slice().sort((a, b) => tdProject([b.x, b.y, 0], v).depth - tdProject([a.x, a.y, 0], v).depth).forEach(q => {
        if (TD.bar.dots) {
          L.push('  \\fill[' + col + '] ' + c3([q.x, q.y, q.z]) + ' circle (1.4pt)' + (TD.bar.vals && Math.abs(q.z) >= 1e-9 ? ' node[font=\\tiny, ' + col + ', anchor=' + (q.z >= 0 ? 'south' : 'north') + '] {$' + tex(tdNum(q.z, 2)) + '$}' : '') + ';');
          return;
        }
        if (Math.abs(q.z) < 1e-9) { L.push('  \\fill[gray] ' + c3([q.x, q.y, 0]) + ' circle (0.6pt);'); return; }
        L.push('  \\draw[' + col + ', line width=1.6pt] ' + c3([q.x, q.y, 0]) + ' -- ' + c3([q.x, q.y, q.z]) + (TD.bar.vals ? ' node[font=\\tiny, ' + col + ', anchor=' + (q.z >= 0 ? 'south' : 'north') + '] {$' + tex(tdNum(q.z, 2)) + '$}' : '') + ';');
        L.push('  \\fill[' + col + '] ' + c3([q.x, q.y, q.z]) + ' circle (1pt);');
      });
      if (TD.bar.coords) {
        if (bars.step * u >= 0.7) bars.pts.forEach(q => L.push('  \\node[font=\\tiny, gray, anchor=north, inner sep=1.5pt] at ' + c3([q.x, q.y, 0]) + ' {$(' + tex(tdNum(q.x, 2)) + '\\,|\\,' + tex(tdNum(q.y, 2)) + ')$};'));
        else L.push('  % Koordinaten der Gitterpunkte weggelassen: Gitter zu eng für die Beschriftung (Abstand vergrössern)');
      }
    } }
  items.forEach(it => {
    if (it.poly.length < 3) return;
    const col = colOf(it), nm = 'E_{' + (it.i + 1) + '}';
    if (TD.opt.traces) tdTraces(it.pl, box).forEach((t, k) => { if (t && TD.opt[['tracexy', 'tracexz', 'traceyz'][k]]) L.push('  \\draw[' + col + ', very thick] ' + c3(t.A) + ' -- ' + c3(t.B) + ';'); });
    if (TD.opt.icpt) tdIntercepts(it.pl).forEach(q => {
      if (!q || q.some(c => Math.abs(c) > R + 1e-9) || q.every(c => Math.abs(c) < 1e-12)) return;
      L.push('  \\fill[' + col + '] ' + c3(q) + ' circle (1.5pt) node[font=\\scriptsize, ' + col + ', anchor=south west, ' + lbl + '] {$(' + q.map(c => tex(tdNum(c, 2))).join('\\,|\\,') + ')$};');
    });
    if (TD.opt.normal) {
      const F = tdFootOrigin(it.pl), nl = V3.len(tdNormal(it.pl));
      if (F.every(c => Math.abs(c) <= R)) {
        const tip = V3.add(F, V3.mul(tdNormal(it.pl), R * 0.4 / nl));
        L.push('  \\draw[->, ' + col + ', very thick] ' + c3(F) + ' -- ' + c3(tip) + ' node[anchor=south west, ' + col + ', ' + lbl + '] {$\\vec n' + (items.length > 1 ? '_{' + (it.i + 1) + '}' : '') + '$};');
      }
    }
    if (TD.opt.names) {
      let best = null;
      it.poly.forEach(p3 => { const q = tdProject(p3, v); const sc = q.sx * 0.35 + q.sy; if (!best || sc > best.sc) best = { p3, sc }; });
      const pos = V3.add(best.p3, V3.mul(V3.sub(it.cen, best.p3), 0.14));
      L.push('  \\node[' + col + ', font=\\bfseries, ' + lbl + '] at ' + c3(pos) + ' {$' + nm + '$};');
    }
  });
  if (TD.opt.inter) {
    const rel = tdRelations(items.slice().sort((a, b) => a.i - b.i));
    rel.pairs.forEach(r => {
      if (!r.L) return;
      const t = tdClipLine(r.L.P, r.L.u, box); if (!t || t[1] - t[0] < 1e-9) return;
      const A = V3.add(r.L.P, V3.mul(r.L.u, t[0])), B = V3.add(r.L.P, V3.mul(r.L.u, t[1]));
      L.push('  \\draw[very thick] ' + c3(A) + ' -- ' + c3(B) + ' node[pos=0.5, anchor=south west, ' + lbl + '] {$g_{' + (r.a.i + 1) + (r.b.i + 1) + '}$};');
    });
    rel.triples.forEach(r => {
      if (!r.S || r.S.some(c => Math.abs(c) > R + 1e-9)) return;
      L.push('  \\fill ' + c3(r.S) + ' circle (2pt) node[anchor=south west, font=\\small, ' + lbl + '] {$S(' + r.S.map(c => tex(tdNum(c, 2))).join('\\,|\\,') + ')$};');
    });
  }
  L.push('\\end{tikzpicture}');
  // Gleichungen als Kommentar am Ende (zum Nachlesen)
  const eqs = items.slice().sort((a, b) => a.i - b.i).map(it => '% E' + (it.i + 1) + ': ' + tex(tdPlaneStr(it.pl)));
  return L.join('\n') + (eqs.length ? '\n' + eqs.join('\n') : '');
}
function td3dMakeLatex() {
  const ta = $td('td-latex-out'); if (!ta) return;
  ta.value = td3dLatex();
  return ta.value;
}
function td3dCopyLatex() {
  const ta = $td('td-latex-out'); if (!ta) return;
  if (!ta.value) td3dMakeLatex();
  const m = $td('td-latex-msg');
  const done = () => { if (m) { m.textContent = (typeof t === 'function' ? t('msg_copied') : 'Kopiert'); setTimeout(() => { m.textContent = ''; }, 2500); } };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done).catch(() => { ta.select(); document.execCommand('copy'); done(); });
  else { ta.select(); document.execCommand('copy'); done(); }
}

// ═══════════════════════════════════════════════════════════════════
// Ansicht: Drehen, Zoomen, Verschieben
// ═══════════════════════════════════════════════════════════════════
let tdAnim = null;
function tdSetView(az, el, instant) {
  cancelAnimationFrame(tdAnim);
  if (instant) { TD.az = az; TD.el = el; scheduleDraw(); return; }
  const a0 = TD.az, e0 = TD.el, t0 = performance.now(), dur = 380;
  let da = ((az - a0) % 360 + 540) % 360 - 180;       // kürzester Weg
  const tick = now => {
    const k = Math.min(1, (now - t0) / dur), f = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    TD.az = a0 + da * f; TD.el = e0 + (el - e0) * f;
    scheduleDraw();
    if (k < 1) tdAnim = requestAnimationFrame(tick); else { TD.az = ((az % 360) + 360) % 360; TD.el = el; scheduleDraw(); }
  };
  tdAnim = requestAnimationFrame(tick);
}
function td3dResetView() { cancelAnimationFrame(tdAnim); TD.zoom = 1; TD.px = 0; TD.py = 0; tdSetView(TD_VIEW_DEFAULT.az, TD_VIEW_DEFAULT.el); }
function tdHintDone() { if (TD._hintDone) return; TD._hintDone = true; const h = $td('td-hint'); if (h) h.classList.add('td-hint-done'); }
function tdRotateBy(dx, dy) {
  tdHintDone();
  cancelAnimationFrame(tdAnim);
  TD.az = ((TD.az - dx * 0.45) % 360 + 360) % 360;
  TD.el = Math.max(-90, Math.min(90, TD.el + dy * 0.45));
  scheduleDraw();
}
function tdZoomBy(f, fx, fy) {                 // f > 1 = heranzoomen; Zentrum (fx,fy) in Canvas-Pixeln
  tdHintDone();
  const nz = Math.max(0.25, Math.min(8, TD.zoom * f)), r = nz / TD.zoom;
  if (fx != null) {
    const w = getW(), h = getH(), cx = w / 2 + TD.px, cy = h / 2 + TD.py;
    TD.px += (fx - cx) * (1 - r); TD.py += (fy - cy) * (1 - r);
  }
  TD.zoom = nz; scheduleDraw();
}

// Maus und Touch: Capture-Listener am Canvas laufen vor den 2D-Handlern (09_events.js)
(function tdWireEvents() {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = (cx, cy) => { const r = cv.getBoundingClientRect(); return { x: cx - r.left, y: cy - r.top }; };
  let dr = null;      // {x,y,pan}
  const stop = e => { e.stopImmediatePropagation(); };
  cv.addEventListener('mousedown', e => {
    if (!TD.on) return;
    e.preventDefault(); stop(e);
    if (typeof pointerMode !== 'undefined' && pointerMode) return;   // Laserpointer: nicht drehen
    cancelAnimationFrame(tdAnim);
    const m = pos(e.clientX, e.clientY);
    dr = { x: m.x, y: m.y, pan: e.shiftKey || e.button === 2 || e.button === 1 };
    cv.style.cursor = dr.pan ? 'move' : 'grabbing';
  }, true);
  cv.addEventListener('mousemove', e => { if (TD.on) stop(e); }, true);
  cv.addEventListener('mouseup', e => { if (TD.on) stop(e); }, true);
  cv.addEventListener('mouseleave', e => { if (TD.on) stop(e); }, true);
  window.addEventListener('mousemove', e => {
    if (!TD.on || !dr) return;
    const m = pos(e.clientX, e.clientY), dx = m.x - dr.x, dy = m.y - dr.y;
    dr.x = m.x; dr.y = m.y;
    if (dr.pan || e.shiftKey) { TD.px += dx; TD.py += dy; scheduleDraw(); } else tdRotateBy(dx, dy);
  }, true);    // Capture: die Canvas-Listener oben stoppen das Ereignis sonst vor dem Bubbling zum Fenster
  window.addEventListener('mouseup', () => { if (dr) { dr = null; cv.style.cursor = 'grab'; } }, true);
  cv.addEventListener('contextmenu', e => { if (TD.on) e.preventDefault(); }, true);
  cv.addEventListener('dblclick', e => { if (!TD.on) return; stop(e); td3dResetView(); }, true);
  cv.addEventListener('wheel', e => {
    if (!TD.on) return;
    e.preventDefault(); stop(e);
    const raw = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaMode === 2 ? e.deltaY * 300 : e.deltaY;
    const m = pos(e.clientX, e.clientY);
    tdZoomBy(1 - Math.sign(raw) * Math.min(Math.abs(raw) / 800, 0.08), m.x, m.y);
  }, { capture: true, passive: false });

  // Touch: ein Finger = drehen, zwei Finger = zoomen + verschieben
  let tp = null;
  const tpos = t => pos(t.clientX, t.clientY);
  const two = ts => { const a = tpos(ts[0]), b = tpos(ts[1]); return { d: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };
  cv.addEventListener('touchstart', e => {
    if (!TD.on) return;
    e.preventDefault(); stop(e);
    if (typeof pointerMode !== 'undefined' && pointerMode) return;   // Laserpointer: nicht drehen
    cancelAnimationFrame(tdAnim);
    const ae = document.activeElement;
    if (e.touches.length === 1 && ae && ae !== document.body && typeof ae.blur === 'function' && /^(MATH-FIELD|INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) ae.blur();
    if (e.touches.length === 1) { const m = tpos(e.touches[0]); tp = { n: 1, x: m.x, y: m.y }; }
    else if (e.touches.length >= 2) { tp = Object.assign({ n: 2 }, two(e.touches)); }
  }, { capture: true, passive: false });
  cv.addEventListener('touchmove', e => {
    if (!TD.on) return;
    e.preventDefault(); stop(e);
    if (!tp) return;
    if (e.touches.length === 1 && tp.n === 1) {
      const m = tpos(e.touches[0]); tdRotateBy(m.x - tp.x, m.y - tp.y); tp.x = m.x; tp.y = m.y;
    } else if (e.touches.length >= 2) {
      const c = two(e.touches);
      if (tp.n !== 2) { tp = Object.assign({ n: 2 }, c); return; }
      TD.px += c.x - tp.x; TD.py += c.y - tp.y;
      tdZoomBy(c.d / tp.d, c.x, c.y);
      tp = Object.assign({ n: 2 }, c);
    }
  }, { capture: true, passive: false });
  const tend = e => {
    if (!TD.on) return;
    e.preventDefault(); stop(e);
    if (e.touches.length === 0) tp = null;
    else if (e.touches.length === 1) { const m = tpos(e.touches[0]); tp = { n: 1, x: m.x, y: m.y }; }
    else tp = Object.assign({ n: 2 }, two(e.touches));
  };
  cv.addEventListener('touchend', tend, { capture: true, passive: false });
  cv.addEventListener('touchcancel', e => { tend(e); tp = null; }, { capture: true, passive: false });
  // Pfeiltasten drehen, + / − zoomen (nur wenn gerade kein Eingabefeld aktiv ist)
  document.addEventListener('keydown', e => {
    if (!TD.on) return;
    const ae = document.activeElement;
    if (ae && /^(INPUT|TEXTAREA|SELECT|MATH-FIELD)$/.test(ae.tagName)) return;
    const k = e.key;
    if (k === 'ArrowLeft') tdRotateBy(-12, 0);
    else if (k === 'ArrowRight') tdRotateBy(12, 0);
    else if (k === 'ArrowUp') tdRotateBy(0, -12);
    else if (k === 'ArrowDown') tdRotateBy(0, 12);
    else if (k === '+' || k === '=') tdZoomBy(1.15);
    else if (k === '-') tdZoomBy(1 / 1.15);
    else return;
    e.preventDefault();
  });
})();

// ═══════════════════════════════════════════════════════════════════
// Schalter 2D ↔ 3D
// ═══════════════════════════════════════════════════════════════════
// Zwischen 3D und dem Funktionen-Thema wechseln (über die Umgebungen, siehe 32_env.js)
function td3dToggle() { if (typeof envSwitch === 'function') envSwitch(TD.on ? 'func' : '3d'); else td3dSet(!TD.on); }
function td3dSet(on) {
  on = !!on;
  if (on === TD.on) return;
  if (on) {
    // laufende 2D-Modi sauber beenden
    try { if (typeof pointerMode !== 'undefined' && pointerMode && typeof togglePointerMode === 'function') togglePointerMode(); } catch (e) {}
    for (let n = 0; n < 4; n++) {
      try {
        const gi = typeof guideInfo === 'function' ? guideInfo() : null;
        if (!gi || !gi.btns || !gi.btns.length) break;
        gi.btns[gi.btns.length - 1][1]();
      } catch (e) { break; }
    }
    try { if (typeof _endTouchAll === 'function' && typeof touchState !== 'undefined' && touchState) _endTouchAll(); } catch (e) {}
    try { if (typeof drag !== 'undefined') drag = null; } catch (e) {}
  }
  TD.on = on;
  document.body.classList.toggle('mode3d', on);
  const b = $td('td-btn');
  if (b) { b.classList.toggle('active-btn', on); b.textContent = on ? '📈 2D-Plot' : '🧊 3D-Raum'; }
  const cv = $td('canvas'); if (cv) cv.style.cursor = on ? 'grab' : 'default';
  if (on) {
    const tp = $td('td-panel'); if (tp && !TD._opened) { TD._opened = true; tp.classList.remove('collapsed'); }   // beim ersten Mal aufgeklappt
    tdRenderPanel(); const sb = $td('sidebar'); if (sb) sb.scrollTop = 0;
  }
  tdSyncHint(); tdLegend();
  if (typeof guideSync === 'function') { try { guideKey = null; guideSync(); } catch (e) {} }
  if (typeof scheduleDraw === 'function') scheduleDraw();
}
// Legende oben rechts im Raum: gleiche Karte wie die Funktionsbeschriftungen im 2D-Plot (#func-labels-overlay)
function tdLegend() {
  const el = $td('td-legend'); if (!el) return;
  const chk = $td('chk-funclabels');
  const items = TD.on && (TD.view || 'pl') === 'pl' && !(chk && chk.checked === false) ? TD.planes.map((p, i) => ({ p, i })).filter(o => o.p.vis && !tdPl(o.p).error) : [];
  if (!items.length) { el.style.display = 'none'; el.replaceChildren(); return; }
  const fr = document.createDocumentFragment();
  items.forEach(o => {
    const row = tdEl('div', 'flo-row');
    const dot = tdEl('span', 'flo-dot'); dot.style.background = o.p.color;
    const ex = tdEl('span', 'flo-expr', tdName(o.i) + ': ' + tdPlaneStr(tdPl(o.p))); ex.setAttribute('translate', 'no');
    row.append(dot, ex); fr.appendChild(row);
  });
  el.replaceChildren(fr);
  el.style.display = 'block';
}
function tdSyncHint() {
  const h = $td('td-hint'); if (!h) return;
  h.style.display = TD.on ? 'block' : 'none';
  h.classList.toggle('td-hint-done', !!TD._hintDone);
}

// ═══════════════════════════════════════════════════════════════════
// Panel
// ═══════════════════════════════════════════════════════════════════
function tdEl(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function tdNoTr(parent, txt, tag) { const s = tdEl(tag || 'span', null, txt); s.setAttribute('translate', 'no'); parent.appendChild(s); return s; }
function tdVec(v) { return '(' + v.map(c => tdFrac(c)).join(' | ') + ')'; }

// Infozeilen einer Ebene (Normalenvektor, Achsenabschnitte, Abstand; bei Parametern auch die aktuelle Gleichung)
function tdFillInfo(p) {
  const pl = tdPl(p), bad = !!pl.error;
  if (p._row) p._row.classList.toggle('td-bad', bad);
  if (p._err) p._err.textContent = bad ? pl.error : '';
  const info = p._info; if (!info) return;
  if (bad) { info.replaceChildren(); return; }
  const fr = document.createDocumentFragment();
  if (p.par && Object.keys(p.par).length) { const l0 = tdEl('div', null, 'Aktuelle Gleichung '); tdNoTr(l0, tdPlaneStr(pl)); fr.appendChild(l0); }
  const l1 = tdEl('div', null, 'Normalenvektor '); tdNoTr(l1, 'n = ' + tdVec(tdNormal(pl)));
  fr.appendChild(l1);
  const ic = tdIntercepts(pl), ics = [];
  ['x', 'y', 'z'].forEach((n, k) => { if (ic[k]) ics.push(n + ' = ' + tdFrac(ic[k][k])); });
  if (ics.length && Math.abs(pl.d) > 1e-12) { const l2 = tdEl('div', null, 'Achsenabschnitte '); tdNoTr(l2, ics.join(', ')); fr.appendChild(l2); }
  const l3 = tdEl('div', null, 'Abstand vom Ursprung '); tdNoTr(l3, tdNum(tdDistOrigin(pl), 3)); fr.appendChild(l3);
  info.replaceChildren(fr);
}
// Nach einer Änderung eines Schiebers: nur die abgeleiteten Anzeigen auffrischen (der Schieber bleibt bestehen)
function tdRefreshDerived(p) {
  tdFillInfo(p); tdRenderRel(); tdRenderBarSelect(); tdBarNote(); tdLegend(); scheduleDraw();
}
function tdFmtPar(v) { return String(Math.round(v * 10000) / 10000); }
function tdParBox(p) {
  const names = Object.keys(p.par || {});
  if (!names.length) return null;
  const box = tdEl('div', 'td-parbox');
  names.forEach(n => {
    const r = tdEl('div', 'td-par');
    const lb = tdEl('b', 'td-parname', n); lb.setAttribute('translate', 'no');
    const sl = tdEl('input', 'td-parsl'); sl.type = 'range'; sl.min = '-10'; sl.max = '10'; sl.step = String(p.pstep); sl.value = String(p.par[n]);
    const nu = tdEl('input', 'td-parnum'); nu.type = 'number'; nu.step = String(p.pstep); nu.value = tdFmtPar(p.par[n]);
    sl.addEventListener('input', () => { const v = Math.round(parseFloat(sl.value) * 10000) / 10000; p.par[n] = v; nu.value = tdFmtPar(v); tdRefreshDerived(p); });
    sl.addEventListener('change', () => { if (typeof pushHistory === 'function') pushHistory(); });
    nu.addEventListener('input', () => { const v = parseFloat(String(nu.value).replace(',', '.')); if (!isFinite(v)) return; p.par[n] = v; sl.value = String(v); tdRefreshDerived(p); });
    nu.addEventListener('change', () => { if (!isFinite(parseFloat(nu.value))) nu.value = tdFmtPar(p.par[n]); if (typeof pushHistory === 'function') pushHistory(); });
    r.append(lb, sl, nu); box.appendChild(r);
  });
  const sr = tdEl('div', 'td-par td-parstep');
  sr.appendChild(tdEl('span', 'td-parlab', 'Schrittweite'));
  const sel = tdEl('select', 'td-parsel'); sel.setAttribute('translate', 'no');
  ['0.01', '0.05', '0.1', '0.25', '0.5', '1'].forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = v.replace('.', ','); sel.appendChild(o); });
  sel.value = String(p.pstep);
  sel.addEventListener('change', () => { p.pstep = parseFloat(sel.value) || 0.1; tdChanged(); });
  sr.appendChild(sel); box.appendChild(sr);
  return box;
}

function tdRenderList() {
  const list = $td('td-list'); if (!list) return;
  // Erst in einem Fragment aufbauen und dann in einem Schritt austauschen: Würde die Liste vorher geleert,
  // könnte ein zwischenzeitliches Layout (Safari rechnet beim Setzen eines Schiebers neu) die Seitenleiste nach oben springen lassen.
  const frag = document.createDocumentFragment();
  TD.planes.forEach((p, i) => {
    const wrap = tdEl('div', 'td-plane');
    const row = tdEl('div', 'td-row' + (p.vis ? '' : ' td-off'));
    const col = tdEl('input', 'geo-col'); col.type = 'color'; col.value = p.color; col.title = 'Farbe';
    col.addEventListener('input', () => { p.color = col.value; scheduleDraw(); });
    col.addEventListener('change', () => { tdChanged(); });
    const nm = tdEl('b', 'td-name', tdName(i)); nm.setAttribute('translate', 'no');
    const inp = tdEl('input', 'td-eq'); inp.type = 'text'; inp.value = p.eq; inp.spellcheck = false; inp.setAttribute('translate', 'no');
    inp.autocomplete = 'off'; inp.autocapitalize = 'off';
    inp.addEventListener('change', () => { p.eq = inp.value.trim(); tdSyncPar(p); tdChanged(); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); });
    const eye = tdEl('button', 'del-btn'); eye.title = 'Ein-/ausblenden';
    eye.innerHTML = typeof eyeIc === 'function' ? eyeIc(p.vis) : (p.vis ? '👁' : '–');
    eye.addEventListener('click', () => { p.vis = !p.vis; tdChanged(); });
    const del = tdEl('button', 'del-btn', '✕'); del.title = 'Löschen';
    del.addEventListener('click', () => { TD.planes.splice(i, 1); tdChanged(); });
    row.append(col, nm, inp, eye, del);
    wrap.appendChild(row);
    const err = tdEl('div', 'td-err'); wrap.appendChild(err);
    const pb = tdParBox(p); if (pb) wrap.appendChild(pb);
    const info = tdEl('div', 'td-info'); wrap.appendChild(info);
    p._row = row; p._err = err; p._info = info;
    frag.appendChild(wrap);
    tdFillInfo(p);
  });
  list.replaceChildren(frag);
}

// Lage der Ebenen
function tdRenderRel() {
  const relBox = $td('td-rel'); if (!relBox) return;
  const out = document.createDocumentFragment();
  const items = tdValid();
  const rel = tdRelations(items);
  rel.pairs.forEach(r => {
    const d = tdEl('div', 'td-relrow');
    const nm = tdName(r.a.i) + ' ∩ ' + tdName(r.b.i);
    if (r.parallel) {
      tdNoTr(d, nm + ': ', 'b'); d.appendChild(document.createTextNode(r.same ? 'identisch' : 'parallel, kein Schnitt'));
    } else {
      tdNoTr(d, nm + ': ', 'b'); d.appendChild(document.createTextNode('Schnittgerade '));
      tdNoTr(d, 'g: ' + tdLineStr(r.L));
      const w = tdEl('div', 'td-sub', 'Schnittwinkel '); tdNoTr(w, tdNum(r.angle, 1) + '°'); d.appendChild(w);
    }
    out.appendChild(d);
  });
  rel.triples.forEach(r => {
    const d = tdEl('div', 'td-relrow');
    tdNoTr(d, tdName(r.a.i) + ' ∩ ' + tdName(r.b.i) + ' ∩ ' + tdName(r.c.i) + ': ', 'b');
    if (r.S) { d.appendChild(document.createTextNode('Schnittpunkt ')); tdNoTr(d, 'S' + tdVec(r.S)); }
    else d.appendChild(document.createTextNode('kein einzelner Schnittpunkt'));
    out.appendChild(d);
  });
  relBox.replaceChildren(out);
  const rb = $td('td-relbox'); if (rb) rb.style.display = relBox.childNodes.length ? '' : 'none';
}

// Auswahl der Ebene für die Balken (nur Ebenen, die nicht parallel zur z-Achse sind)
function tdRenderBarSelect() {
  const sel = $td('td-b-plane'), note = $td('td-b-note');
  const cand = TD.planes.map((p, i) => ({ p, i })).filter(o => !tdPl(o.p).error && Math.abs(tdPl(o.p).c) > TD_EPS);
  if (sel) {
    const fr = document.createDocumentFragment();
    cand.forEach(o => { const op = document.createElement('option'); op.value = o.p.id; op.textContent = tdName(o.i) + ': ' + tdPlaneStr(tdPl(o.p)); op.setAttribute('translate', 'no'); fr.appendChild(op); });
    sel.replaceChildren(fr);
    if (cand.length) sel.value = (cand.find(o => o.p.id === TD.bar.id) || cand[0]).p.id;
    sel.style.display = cand.length > 1 ? '' : 'none';
  }
  if (note) note.textContent = TD.bar.on && !cand.length ? 'Dafür braucht es eine Ebene, die nicht parallel zur z-Achse ist.' : '';
}

function tdRenderPanel() {
  tdRenderList();
  tdRenderRel();
  // Optionen
  Object.keys(TD.opt).forEach(k => { const c = $td('td-o-' + k); if (c) c.checked = !!TD.opt[k]; });
  ['tracexy', 'tracexz', 'traceyz'].forEach(k => { const c = $td('td-o-' + k); if (c) { c.disabled = !TD.opt.traces; if (c.parentNode) c.parentNode.style.opacity = TD.opt.traces ? '' : '0.5'; } });
  // Balken
  { const on = $td('td-b-on'), st = $td('td-b-step'), vl = $td('td-b-vals');
    if (on) on.checked = TD.bar.on;
    if (vl) vl.checked = TD.bar.vals;
    const cb = $td('td-b-coords'); if (cb) cb.checked = TD.bar.coords;
    const bh = $td('td-b-hide'); if (bh) bh.checked = TD.bar.hide;
    const bd = $td('td-b-dots'); if (bd) bd.checked = TD.bar.dots;
    const ss = $td('td-b-sstep'); if (ss) ss.value = String(TD.bar.sstep);
    if (st) { st.step = TD.bar.sstep; st.value = TD.bar.step; }
    tdBarLabel();
    tdRenderBarSelect();
    tdBarNote();
  }
  const rg = $td('td-range'); if (rg && document.activeElement !== rg) rg.value = TD.range;
  tdLegend();
  if (typeof vgRefreshUI === 'function') vgRefreshUI();
}

// Anzeige neben dem Schieber und Hinweis, wenn das Gitter vergröbert gezeichnet wird
function tdBarLabel() {
  const l = $td('td-b-stepv'); if (l) l.textContent = String(Math.round(TD.bar.step * 1000) / 1000).replace('.', ',');
}
function tdBarNote() {
  const n = $td('td-b-note2'); if (!n) return;
  const b = tdBarData();
  const fr = document.createDocumentFragment();
  if (TD.bar.on && TD.bar.coords && TD._tight) { const d = document.createElement('div'); d.textContent = 'Beschriftung zu eng: Gitterabstand vergrössern oder hineinzoomen.'; fr.appendChild(d); }
  if (b && b.coarse) { fr.appendChild(document.createTextNode('Zu viele Balken: gezeichnet wird mit Abstand ')); tdNoTr(fr, String(b.step).replace('.', ',')); }
  n.replaceChildren(fr);
}

function tdAddFromInput() {
  const inp = $td('td-input'), err = $td('td-add-err'); if (!inp) return;
  const v = inp.value.trim();
  if (!v) { if (err) err.textContent = 'Bitte eine Gleichung eingeben.'; return; }
  const e = tdAddPlane(v, false, true);
  if (err) err.textContent = e || '';
  if (!e) inp.value = '';
}

(function tdWirePanel() {
  const add = $td('td-add'), inp = $td('td-input');
  if (add) add.addEventListener('click', tdAddFromInput);
  if (inp) {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); tdAddFromInput(); } });
    inp.addEventListener('input', () => { const err = $td('td-add-err'); if (err) err.textContent = ''; });
  }
  const sel = $td('td-presetsel');
  if (sel) {
    sel.innerHTML = '';
    const o0 = document.createElement('option'); o0.value = ''; o0.textContent = 'Beispiel einsetzen …'; sel.appendChild(o0);
    TD_PRESETS.forEach((p, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = p.t; sel.appendChild(o); });
    sel.addEventListener('change', () => {
      const p = TD_PRESETS[parseInt(sel.value, 10)]; sel.value = '';
      if (!p) return;
      TD.planes = []; TD.seq = 0;
      p.eq.forEach(q => tdAddPlane(q, true));
      tdChanged();
    });
  }
  Object.keys(TD.opt).forEach(k => {
    const c = $td('td-o-' + k);
    if (c) c.addEventListener('change', () => { TD.opt[k] = c.checked; tdChanged(); });
  });
  const fl = $td('chk-funclabels'); if (fl) fl.addEventListener('change', tdLegend);
  const bo = $td('td-b-on'); if (bo) bo.addEventListener('change', () => { TD.bar.on = bo.checked; tdChanged(); });
  const bk = $td('td-b-coords'); if (bk) bk.addEventListener('change', () => { TD.bar.coords = bk.checked; tdChanged(); });
  const bdt = $td('td-b-dots'); if (bdt) bdt.addEventListener('change', () => { TD.bar.dots = bdt.checked; tdChanged(); });
  const bhd = $td('td-b-hide'); if (bhd) bhd.addEventListener('change', () => { TD.bar.hide = bhd.checked; tdChanged(); });
  const bv = $td('td-b-vals'); if (bv) bv.addEventListener('change', () => { TD.bar.vals = bv.checked; tdChanged(); });
  const bp = $td('td-b-plane'); if (bp) bp.addEventListener('change', () => { TD.bar.id = bp.value; tdChanged(); });
  const bs = $td('td-b-step');
  if (bs) {
    const set = () => { const v = parseFloat(bs.value); if (isFinite(v) && v >= 0) TD.bar.step = Math.round(v * 1000) / 1000; tdBarLabel(); tdBarNote(); };
    bs.addEventListener('input', () => { set(); scheduleDraw(); });     // live beim Ziehen
    bs.addEventListener('change', () => { set(); tdChanged(); });         // Undo-Eintrag beim Loslassen
  }
  const ss = $td('td-b-sstep');
  if (ss) ss.addEventListener('change', () => {
    const v = parseFloat(ss.value); if (!(v > 0)) return;
    TD.bar.sstep = v;
    if (bs) { bs.step = v; TD.bar.step = Math.round(parseFloat(bs.value) * 1000) / 1000; }   // Wert auf die neue Schrittweite einrasten
    tdChanged();
  });
  const rg = $td('td-range');
  if (rg) rg.addEventListener('change', () => {
    const v = parseFloat(String(rg.value).replace(',', '.'));
    TD.range = isFinite(v) && v >= 1 ? Math.min(v, 100) : TD.range;
    rg.value = TD.range; tdChanged();
  });
  const views = { 'td-v-std': [TD_VIEW_DEFAULT.az, TD_VIEW_DEFAULT.el], 'td-v-front': [0, 0], 'td-v-side': [90, 0], 'td-v-top': [0, 90] };
  Object.keys(views).forEach(id => { const b = $td(id); if (b) b.addEventListener('click', () => tdSetView(views[id][0], views[id][1])); });
  const bj = $td('td-jpeg'); if (bj) bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  const bl = $td('td-latex'); if (bl) bl.addEventListener('click', td3dMakeLatex);
  const bc = $td('td-latex-copy'); if (bc) bc.addEventListener('click', td3dCopyLatex);
  const clr = $td('td-clear');
  if (clr) clr.addEventListener('click', () => { if (!TD.planes.length) return; TD.planes = []; TD.seq = 0; tdChanged(); });
  tdKeepScroll(tdRenderPanel);
})();
