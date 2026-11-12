// ═══════════════════════════════════════════════════════════════════
// MODUL: geo_ui — Geometrie (Oberfläche): Werkzeuge, Zeichnen, Ziehen, Panel
// Das Konstruktions-Modell und alle Rechnungen stehen in 26_geo.js.
// Hier: Werkzeugleiste (Klick-Abläufe), Zeichnen auf dem Canvas, Treffer-
// prüfung für Maus UND Touch (hitR), Ziehen von Punkten/ganzen Objekten,
// Objektliste mit Messwerten und Schiebereglern, Vorlagen.
//
// Einhängepunkte (alle optional-verkettet, siehe jeweils die Kommentare dort):
//   08_draw.js   draw()            → drawGeo()
//   09_events.js canvasPress()     → geoPress(m) [Werkzeuge, Punkte ziehen]
//                                    geoPressBody(m) [ganzes Objekt ziehen]
//                canvasDragMoveBody → geoDragMove(m)
//                canvasRelease()    → geoToolClick(m) (Klick ins Leere)
//                captureState/applyState → geoCapture()/geoApply()
//   06_ui_functions.js tryDeleteAt → geoDeleteAt()
// Ändern:  Werkzeuge → GEO_TOOLS · Farben → GEO_COLORS (26_geo.js)
// ═══════════════════════════════════════════════════════════════════

let geoTool = 'move';        // aktives Werkzeug (Id aus GEO_TOOLS)
let geoPicks = [];           // bisher gewählte Objekte des laufenden Werkzeug-Ablaufs
let geoShowNames = true, geoShowVals = true;
let geoHoverId = null;       // Objekt unter Maus / in der Liste
let geoMouse = null;         // letzte Mausposition (Canvas-Pixel) für Vorschau
const GEO_PRIME = '′';

// ── Hilfen ──────────────────────────────────────────────────────────
const geoPx = p => { const c = toCanvas(p.x, p.y); return { x: c.cx, y: c.cy }; };
function geoPpu() { return Math.abs(toCanvas(1, 0).cx - toCanvas(0, 0).cx) || 1; }
function geoHexA(c, a) {
  const m = /^#([0-9a-f]{6})$/i.exec(c || '');
  if (!m) return c || 'rgba(0,0,0,' + a + ')';
  const n = parseInt(m[1], 16);
  return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}
function geoNiceFloor(x) {
  if (!(x > 0)) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(x))), r = x / mag;
  return (r >= 5 ? 5 : r >= 2 ? 2 : 1) * mag;
}
function geoFrame() {
  // Vorlagen: u = halber Gitterschritt (alle freien Vorlagenpunkte haben gerade Koordinaten → liegen auf Gitterpunkten).
  const v = isoView || view;
  const span = Math.min(v.xmax - v.xmin, v.ymax - v.ymin);
  const gs = typeof gridSnapStep === 'function' ? gridSnapStep() : geoNiceFloor(span / 10);
  let m = 1;
  for (const k of [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]) { m = k; if (span / (gs * k) <= 18) break; }
  const r = x => parseFloat((Math.round(x / (gs * m)) * gs * m).toPrecision(12));
  return { cx: r((v.xmin + v.xmax) / 2), cy: r((v.ymin + v.ymax) / 2), u: gs * m / 2 };
}
function geoUnit() { return geoFrame().u * 2; }   // ein ganzer Gitterschritt
function geoSnap(p) { return typeof snapToGrid === 'function' ? snapToGrid(p.x, p.y) : p; }
function geoCanvasActive() {
  return !(typeof pointMode !== 'undefined' && pointMode) && !(typeof graphPtMode !== 'undefined' && graphPtMode) &&
    !(typeof line2ptPicking !== 'undefined' && line2ptPicking) && !(typeof fitPickMode !== 'undefined' && fitPickMode) &&
    !(typeof slopeTriPickMode !== 'undefined' && slopeTriPickMode) && !(typeof perpFlowKind !== 'undefined' && perpFlowKind);
}
const $geo = id => document.getElementById(id);

// ═══════════════════════════════════════════════════════════════════
// WERKZEUGE
// args: Art der nacheinander zu wählenden Objekte
//   pt (Punkt, ins Leere klicken legt einen an) · line (Gerade/Strecke/Strahl) · curve (Kreis/Ellipse)
//   lc (Gerade, Kurve, Vieleck oder Vektor) · vec · src (beliebiges Objekt) · poly (variabel)
// ═══════════════════════════════════════════════════════════════════
const GEO_TOOLS = [
  { grp: 'Grundobjekte', id: 'move', label: 'Ziehen', args: [], steps: ['Punkte und Figuren mit der Maus bzw. dem Finger ziehen'] },
  { id: 'pt', label: 'Punkt', args: [], steps: ['Klicken: neuer Punkt (auf einer Linie oder einem Kreis wird er daran gebunden)'] },
  { id: 'seg', label: 'Strecke', args: ['pt', 'pt'], steps: ['Strecke: ersten Punkt wählen', 'Strecke: zweiten Punkt wählen'], make: p => [['seg', p]] },
  { id: 'line', label: 'Gerade', args: ['pt', 'pt'], steps: ['Gerade: ersten Punkt wählen', 'Gerade: zweiten Punkt wählen'], make: p => [['line', p]] },
  { id: 'ray', label: 'Strahl', args: ['pt', 'pt'], steps: ['Strahl: Anfangspunkt wählen', 'Strahl: zweiten Punkt wählen'], make: p => [['ray', p]] },
  { id: 'poly', label: 'Vieleck', args: ['poly'], steps: ['Vieleck: Eckpunkte nacheinander wählen, zum Schliessen den ersten Punkt nochmals wählen'] },
  { id: 'circ', label: 'Kreis', args: ['pt', 'pt'], steps: ['Kreis: Mittelpunkt wählen', 'Kreis: Punkt auf dem Kreis wählen'], make: p => [['circ', p]] },
  { id: 'circr', label: 'Kreis (Radius)', args: ['pt'], steps: ['Kreis mit Radius: Mittelpunkt wählen (Radius danach in der Liste ändern)'],
    make: p => [['circr', p, { n: 2 * geoUnit() }]] },
  { id: 'circd', label: 'Kreis (Durchmesser)', args: ['pt', 'pt'], steps: ['Kreis über Durchmesser: ersten Endpunkt wählen', 'zweiten Endpunkt wählen'], make: p => [['circd', p]] },
  { id: 'circ3', label: 'Kreis (3 Punkte)', args: ['pt', 'pt', 'pt'], steps: ['Kreis durch 3 Punkte: 1. Punkt', '2. Punkt', '3. Punkt'], make: p => [['circ3', p]] },
  { id: 'ellf', label: 'Ellipse (Brennpunkte)', args: ['pt', 'pt', 'pt'], steps: ['Ellipse: ersten Brennpunkt wählen', 'zweiten Brennpunkt wählen', 'Punkt auf der Ellipse wählen'], make: p => [['ellf', p]] },
  { id: 'ella', label: 'Ellipse (a, b)', args: ['pt'], steps: ['Ellipse mit Halbachsen: Mittelpunkt wählen (a, b danach in der Liste ändern)'],
    make: p => [['ella', p, { n: [3 * geoUnit(), 2 * geoUnit(), 0] }]] },
  { id: 'del', label: 'Löschen', args: [], steps: ['Objekt anklicken, um es (samt allem, was davon abhängt) zu löschen'] },

  { grp: 'Konstruieren', id: 'mid', label: 'Mittelpunkt', args: ['pt', 'pt'], steps: ['Mittelpunkt: ersten Punkt wählen', 'zweiten Punkt wählen'], make: p => [['mid', p]] },
  { id: 'inter', label: 'Schnittpunkt', args: ['lc', 'lc'], steps: ['Schnittpunkt: erstes Objekt wählen', 'zweites Objekt wählen'], make: 'inter' },
  { id: 'foot', label: 'Lotfusspunkt', args: ['pt', 'line'], steps: ['Lotfusspunkt: Punkt wählen', 'Gerade wählen'], make: p => [['foot', p]] },
  { id: 'perpl', label: 'Lot', args: ['pt', 'line'], steps: ['Senkrechte: Punkt wählen', 'Gerade wählen'], make: p => [['perpl', p]] },
  { id: 'parl', label: 'Parallele', args: ['pt', 'line'], steps: ['Parallele: Punkt wählen', 'Gerade wählen'], make: p => [['parl', p]] },
  { id: 'pbis', label: 'Mittelsenkrechte', args: ['pt', 'pt'], steps: ['Mittelsenkrechte: ersten Punkt wählen', 'zweiten Punkt wählen'], make: p => [['pbis', p]] },
  { id: 'abis', label: 'Winkelhalbierende', args: ['pt', 'pt', 'pt'], steps: ['Winkelhalbierende: Punkt auf dem ersten Schenkel', 'Scheitelpunkt wählen', 'Punkt auf dem zweiten Schenkel'], make: p => [['abis', p]] },
  { id: 'tang', label: 'Tangente', args: ['pt', 'curve'], steps: ['Tangente: Punkt wählen', 'Kreis oder Ellipse wählen'], make: 'tang' },

  { grp: 'Dreieck', id: 'ctrS', label: 'Schwerpunkt', args: ['pt', 'pt', 'pt'], steps: ['Schwerpunkt: 1. Ecke', '2. Ecke', '3. Ecke'], make: p => [['ctr', p, { k: 'centroid' }]] },
  { id: 'ctrU', label: 'Umkreismittelpunkt', args: ['pt', 'pt', 'pt'], steps: ['Umkreismittelpunkt: 1. Ecke', '2. Ecke', '3. Ecke'], make: p => [['ctr', p, { k: 'circum' }]] },
  { id: 'ctrI', label: 'Inkreismittelpunkt', args: ['pt', 'pt', 'pt'], steps: ['Inkreismittelpunkt: 1. Ecke', '2. Ecke', '3. Ecke'], make: p => [['ctr', p, { k: 'incenter' }]] },
  { id: 'ctrH', label: 'Höhenschnittpunkt', args: ['pt', 'pt', 'pt'], steps: ['Höhenschnittpunkt: 1. Ecke', '2. Ecke', '3. Ecke'], make: p => [['ctr', p, { k: 'ortho' }]] },
  { id: 'circ3u', label: 'Umkreis', args: ['pt', 'pt', 'pt'], steps: ['Umkreis: 1. Ecke', '2. Ecke', '3. Ecke'], make: p => [['circ3', p]] },
  { id: 'incirc', label: 'Inkreis', args: ['pt', 'pt', 'pt'], steps: ['Inkreis: 1. Ecke', '2. Ecke', '3. Ecke'], make: p => [['incirc', p]] },

  { grp: 'Messen', id: 'ang', label: 'Winkel', args: ['pt', 'pt', 'pt'], steps: ['Winkel: Punkt auf dem ersten Schenkel', 'Scheitelpunkt wählen', 'Punkt auf dem zweiten Schenkel'], make: p => [['ang', p]] },
  { id: 'dist', label: 'Abstand Punkt–Gerade', args: ['pt', 'line'], steps: ['Abstand: Punkt wählen', 'Gerade wählen'], make: 'dist' },
  { id: 'dot', label: 'Skalarprodukt', args: ['vec', 'vec'], steps: ['Skalarprodukt: ersten Vektor wählen', 'zweiten Vektor wählen'], make: p => [['dot', p, { name: 'u·v' }]] },

  { grp: 'Vektoren', id: 'vec', label: 'Vektor', args: ['pt', 'pt'], steps: ['Vektor: Anfangspunkt wählen', 'Endpunkt (Spitze) wählen'], make: p => [['vec', p]] },
  { id: 'ovec', label: 'Ortsvektor', args: ['pt'], steps: ['Ortsvektor: Punkt wählen (Pfeil vom Ursprung dorthin)'], make: 'ovec' },
  { id: 'vadd', label: 'u + v', args: ['vec', 'vec'], steps: ['Summe: ersten Vektor wählen', 'zweiten Vektor wählen'], make: p => [['vadd', p, { name: geoVecName(p[0]) + '+' + geoVecName(p[1]) }]] },
  { id: 'vsub', label: 'u − v', args: ['vec', 'vec'], steps: ['Differenz: ersten Vektor wählen', 'zweiten Vektor wählen'], make: p => [['vsub', p, { name: geoVecName(p[0]) + '−' + geoVecName(p[1]) }]] },
  { id: 'vscale', label: 'k · u', args: ['vec'], steps: ['Vielfaches: Vektor wählen (k danach in der Liste ändern)'], make: p => [['vscale', p, { n: 2, name: 'k·' + geoVecName(p[0]) }]] },
  { id: 'vproj', label: 'Projektion', args: ['vec', 'vec'], steps: ['Projektion: Vektor wählen, der projiziert wird', 'Vektor wählen, auf den projiziert wird'], make: p => [['vproj', p, { name: geoVecName(p[0]) + '∥' }]] },

  { grp: 'Abbildungen', id: 'refl', label: 'Achsenspiegelung', args: ['src', 'line'], steps: ['Spiegeln: Objekt wählen', 'Spiegelachse (Gerade) wählen'], make: p => [['xf', p, { k: 'refl' }]] },
  { id: 'reflp', label: 'Punktspiegelung', args: ['src', 'pt'], steps: ['Punktspiegelung: Objekt wählen', 'Zentrum (Punkt) wählen'], make: p => [['xf', p, { k: 'reflp' }]] },
  { id: 'rot', label: 'Drehung', args: ['src', 'pt'], steps: ['Drehen: Objekt wählen', 'Drehzentrum (Punkt) wählen (Winkel danach in der Liste ändern)'], make: p => [['xf', p, { k: 'rot', n: 90 }]] },
  { id: 'trans', label: 'Verschiebung', args: ['src', 'vec'], steps: ['Verschieben: Objekt wählen', 'Verschiebungsvektor wählen'], make: p => [['xf', p, { k: 'trans' }]] },
  { id: 'dil', label: 'Streckung', args: ['src', 'pt'], steps: ['Strecken: Objekt wählen', 'Streckzentrum (Punkt) wählen (Faktor danach in der Liste ändern)'], make: p => [['xf', p, { k: 'dil', n: 2 }]] }
];
const geoToolById = id => GEO_TOOLS.find(t => t.id === id);
function geoVecName(id) { const o = geoGet(id); return o ? o.name : '?'; }

// ═══════════════════════════════════════════════════════════════════
// TREFFER (Abstand in Pixeln zu einem Objekt)
// ═══════════════════════════════════════════════════════════════════
function geoSegDist(a, b, m, kind) {
  const dx = b.x - a.x, dy = b.y - a.y, dd = dx * dx + dy * dy;
  let t = dd < 1e-9 ? 0 : ((m.x - a.x) * dx + (m.y - a.y) * dy) / dd;
  if (kind === 'seg' || kind === 'vec') t = Math.max(0, Math.min(1, t));
  else if (kind === 'ray') t = Math.max(0, t);
  return Math.hypot(m.x - (a.x + t * dx), m.y - (a.y + t * dy));
}
function geoPolyInside(pts, p) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    if ((pts[i].y > p.y) !== (pts[j].y > p.y) && p.x < (pts[j].x - pts[i].x) * (p.y - pts[i].y) / (pts[j].y - pts[i].y) + pts[i].x) c = !c;
  }
  return c;
}
function geoEllipsePts(v, n) {
  const r = [];
  for (let i = 0; i < n; i++) r.push(geoPx(geoCurvePoint(v, i / n * 2 * Math.PI)));
  return r;
}
function geoDistPx(v, mx, my) {
  const m = { x: mx, y: my };
  switch (v.k) {
    case 'pt': { const p = geoPx(v); return Math.hypot(p.x - mx, p.y - my); }
    case 'line': case 'seg': case 'ray': return geoSegDist(geoPx(v.A), geoPx(v.B), m, v.k);
    case 'vec': return geoSegDist(geoPx(v.A), geoPx(v.B), m, 'vec');
    case 'circ': { const c = geoPx({ x: v.cx, y: v.cy }); return Math.abs(Math.hypot(c.x - mx, c.y - my) - v.r * geoPpu()); }
    case 'ell': {
      const pts = geoEllipsePts(v, 96); let best = Infinity;
      for (let i = 0; i < pts.length; i++) best = Math.min(best, geoSegDist(pts[i], pts[(i + 1) % pts.length], m, 'seg'));
      return best;
    }
    case 'poly': {
      const pts = v.pts.map(geoPx); let best = Infinity;
      for (let i = 0; i < pts.length; i++) best = Math.min(best, geoSegDist(pts[i], pts[(i + 1) % pts.length], m, 'seg'));
      if (best > 6 && geoPolyInside(pts, m)) best = 6;       // Inneres: schwächerer Treffer als Kanten/Ecken
      return best;
    }
  }
  return Infinity;
}
const GEO_KIND_OK = {
  pt: v => v.k === 'pt',
  line: v => v.k === 'line' || v.k === 'seg' || v.k === 'ray',
  curve: v => v.k === 'circ' || v.k === 'ell',
  lc: v => ['line', 'seg', 'ray', 'circ', 'ell', 'poly', 'vec'].includes(v.k),
  vec: v => v.k === 'vec',
  src: v => ['pt', 'line', 'seg', 'ray', 'circ', 'ell', 'poly', 'vec'].includes(v.k),
  any: v => ['pt', 'line', 'seg', 'ray', 'circ', 'ell', 'poly', 'vec'].includes(v.k)
};
// Nächstes Objekt der gewünschten Art unter (mx,my) oder null. Punkte haben Vorrang.
function geoFindAt(mx, my, kind, exclude) {
  const ok = GEO_KIND_OK[kind] || GEO_KIND_OK.any;
  let best = null, bd = Infinity;
  const objs = geoAll();
  for (let i = objs.length - 1; i >= 0; i--) {
    const o = objs[i], v = geoVal(o.id);
    if (!v || o.vis === false || !ok(v) || (exclude && exclude.includes(o.id))) continue;
    const lim = v.k === 'pt' ? hitR(14) : hitR(8);
    let d = geoDistPx(v, mx, my);
    if (d > lim) continue;
    if (v.k === 'pt') d -= 5;                  // Punkte bevorzugen
    if (d < bd) { bd = d; best = o.id; }
  }
  return best;
}

// ═══════════════════════════════════════════════════════════════════
// WERKZEUG-ABLAUF
// ═══════════════════════════════════════════════════════════════════
function geoStatus(text, warn) {
  const el = $geo('geo-status');
  if (el) { el.textContent = text || ''; el.style.color = warn ? '#c2262a' : ''; }
  geoUpdateHint(text, warn);
}
// Hinweisleiste auf der Zeichenfläche (unten): zeigt den nächsten Schritt des Werkzeugs, auch wenn die
// Seitenleiste (Handy!) gerade zu ist. Die Leiste selbst gehört zum gemeinsamen Modul 28_guide.js
// (gleiche Leiste für alle klick-geführten Abläufe); hier wird nur der aktuelle Text abgelegt.
let geoHintText = '', geoHintWarn = false;
function geoUpdateHint(text, warn) {
  geoHintText = text || ''; geoHintWarn = !!warn;
  if (typeof guideSync === 'function') guideSync();
}
function geoStepText() {
  const t = geoToolById(geoTool);
  if (!t) return '';
  if (t.id === 'poly') return geoPicks.length < 3 ? t.steps[0] : 'Vieleck: weitere Ecke wählen oder den ersten Punkt nochmals wählen (Schliessen)';
  return t.steps[Math.min(geoPicks.length, t.steps.length - 1)] || '';
}
function geoSetTool(id) {
  geoTool = geoToolById(id) ? id : 'move';
  geoPicks = [];
  document.querySelectorAll('#geo-tools button[data-tool]').forEach(b => b.classList.toggle('active-btn', b.dataset.tool === geoTool));
  geoStatus(geoStepText());
  const ab = document.querySelector('#geo-tools button.active-btn'); if (ab) { const d = ab.closest('details'); if (d) d.open = true; }
  const fin = $geo('geo-finish'); if (fin) fin.style.display = geoTool === 'poly' ? '' : 'none';
  geoUpdateHint(geoStepText());
  if (typeof canvas !== 'undefined') canvas.style.cursor = geoTool === 'move' ? 'grab' : 'crosshair';
  scheduleDraw();
}
function geoToolActive() { return geoTool !== 'move' && geoCanvasActive(); }
function geoCommit() {          // nach jeder Änderung der Konstruktion
  geoRecompute(); geoRenderList();
  if (typeof pushHistory === 'function') pushHistory();
  scheduleDraw();
}

function geoPrimeName(id) {
  const o = geoGet(id); if (!o) return undefined;
  const used = new Set(geoAll().map(x => x.name));
  let nm = o.name + GEO_PRIME;
  while (used.has(nm)) nm += GEO_PRIME;
  return nm;
}
function geoPolyName(ids) {
  const nm = ids.map(i => (geoGet(i) || {}).name || '?');
  return nm.every(n => n.length <= 2) ? nm.join('') : undefined;
}

// Führt die Konstruktion zum gewählten Werkzeug aus.
function geoRunTool(t, picks) {
  const created = [];
  const add = (type, args, opts) => { const id = geoAdd(type, args, opts); if (id) created.push(id); return id; };
  if (t.make === 'inter') {
    const pts = geoIntersections(geoVal(picks[0]), geoVal(picks[1]));
    if (!pts.length) { geoStatus('Diese beiden Objekte schneiden sich nicht.', true); return false; }
    for (let i = 0; i < Math.min(pts.length, 4); i++) add('inter', picks.slice(), { n: i });
  } else if (t.make === 'tang') {
    const n = geoTangents(geoVal(picks[0]), geoVal(picks[1])).length;
    if (!n) { geoStatus('Von diesem Punkt aus gibt es keine Tangente (bei der Ellipse muss er auf der Ellipse liegen).', true); return false; }
    for (let i = 0; i < n; i++) add('tang', picks.slice(), { n: i });
  } else if (t.make === 'dist') {
    const f = add('foot', picks.slice(), { aux: true, lbl: false });
    if (f) add('seg', [picks[0], f], { color: '#be185d' });
  } else if (t.make === 'ovec') {
    let O = geoAll().find(o => o.t === 'pt' && o.fixed && o.x === 0 && o.y === 0);
    const oid = O ? O.id : geoAddPoint(0, 0, { name: 'O', fixed: true });
    if (picks[0] === oid) { geoStatus('Der Ursprung selbst hat keinen Ortsvektor.', true); return false; }
    const pn = geoGet(picks[0]).name, low = pn.toLowerCase();
    add('vec', [oid, picks[0]], { name: geoAll().some(o => o.name === low) ? undefined : low });
  } else if (t.id === 'poly') {
    add('poly', picks.slice(), { name: geoPolyName(picks) });
  } else {
    for (const [type, args, opts] of t.make(picks)) {
      const o = Object.assign({}, opts);
      if (type === 'xf') o.name = geoPrimeName(picks[0]);
      if (type === 'poly') o.name = geoPolyName(args);
      add(type, args, o);
    }
  }
  return created.length > 0;
}

// Ein gewähltes Objekt (Id) dem laufenden Ablauf hinzufügen.
function geoAcceptPick(id) {
  const t = geoToolById(geoTool); if (!t || !t.args.length) return;
  if (t.id === 'poly') {
    if (geoPicks.length >= 3 && id === geoPicks[0]) return geoFinishPoly();
    if (geoPicks.includes(id)) { geoStatus('Dieser Punkt ist schon dabei.', true); return; }
    geoPicks.push(id); geoStatus(geoStepText()); scheduleDraw(); return;
  }
  if (geoPicks.includes(id)) { geoStatus('Dieses Objekt ist schon gewählt.', true); return; }
  geoPicks.push(id);
  if (geoPicks.length >= t.args.length) {
    const picks = geoPicks.slice();
    geoPicks = [];
    if (geoRunTool(t, picks)) { geoCommit(); geoStatus(geoStepText()); }
    else geoStatus($geo('geo-status') ? $geo('geo-status').textContent : '', true);
  } else geoStatus(geoStepText());
  scheduleDraw();
}
function geoFinishPoly() {
  const t = geoToolById('poly');
  if (geoPicks.length < 3) { geoStatus('Ein Vieleck braucht mindestens 3 Ecken.', true); return; }
  const picks = geoPicks.slice(); geoPicks = [];
  if (geoRunTool(t, picks)) geoCommit();
  geoStatus(geoStepText());
}

function geoNewFreePoint(m) {
  const p = geoSnap(fromCanvas(m.x, m.y));
  // Rastet der neue Punkt genau auf einen vorhandenen Punkt, wird dieser wiederverwendet (keine doppelten Punkte).
  const same = geoAll().find(o => { const v = geoVal(o.id); return v && v.k === 'pt' && o.vis !== false && Math.abs(v.x - p.x) < 1e-9 && Math.abs(v.y - p.y) < 1e-9; });
  return same ? same.id : geoAddPoint(p.x, p.y);
}
// Welche Art Objekt erwartet das Werkzeug als Nächstes?
function geoWantKind() {
  const t = geoToolById(geoTool); if (!t || !t.args.length) return null;
  return t.id === 'poly' ? 'pt' : t.args[Math.min(geoPicks.length, t.args.length - 1)];
}

// Pressen mit aktivem Werkzeug. true = verarbeitet.
function geoPressTool(m) {
  const t = geoToolById(geoTool); if (!t) return false;
  if (t.id === 'del') {
    const id = geoFindAt(m.x, m.y, 'any');
    if (id) { geoRemove(id); geoCommit(); }
    return true;
  }
  if (t.id === 'pt') {
    // vorhandener Punkt: nichts tun; Linie/Kreis: Punkt daran binden; sonst frei
    if (geoFindAt(m.x, m.y, 'pt')) return true;
    const host = geoFindAt(m.x, m.y, 'any');
    if (host) {
      const hv = geoVal(host), raw = fromCanvas(m.x, m.y);
      if (hv && ['line', 'seg', 'ray', 'circ', 'ell', 'poly', 'vec'].includes(hv.k)) {
        geoAdd('pton', [host], { n: geoProjectParam(hv, raw) }); geoCommit(); return true;
      }
    }
    return false;                              // ins Leere: Klick-Kandidat (siehe geoPress)
  }
  const kind = geoWantKind(); if (!kind) return true;
  const hit = geoFindAt(m.x, m.y, kind, t.id === 'poly' ? geoPicks.slice(1) : geoPicks);
  if (hit) { geoAcceptPick(hit); return true; }
  return false;
}

// Klick ins Leere (Maus/Finger wurde nicht gezogen): Punkt anlegen, wo ein Punkt gebraucht wird.
function geoToolClick(m) {
  if (!geoToolActive()) return;
  const t = geoToolById(geoTool); if (!t) return;
  if (t.id === 'pt') { geoNewFreePoint(m); geoCommit(); return; }
  if (geoWantKind() === 'pt') {
    const id = geoNewFreePoint(m);
    geoRenderList();
    geoAcceptPick(id);
  }
}

// ═══════════════════════════════════════════════════════════════════
// EREIGNIS-EINHÄNGEPUNKTE (09_events.js)
// ═══════════════════════════════════════════════════════════════════

// Ziehbare Punkte: freie Punkte und Punkte auf Objekten (nicht fixierte)
function geoGrabPoint(mx, my) {
  let best = null, bd = hitR(14);
  for (const o of geoAll()) {
    if ((o.t !== 'pt' && o.t !== 'pton') || o.fixed || o.vis === false) continue;
    const v = geoVal(o.id); if (!v) continue;
    const d = geoDistPx(v, mx, my);
    if (d <= bd) { bd = d; best = o; }
  }
  return best;
}
function geoGrabBody(mx, my) {
  let best = null, bd = hitR(8) + 0.5;
  const objs = geoAll();
  for (let i = objs.length - 1; i >= 0; i--) {
    const o = objs[i], v = geoVal(o.id);
    if (!v || o.vis === false || o.t === 'pt' || o.t === 'pton') continue;
    if (!['line', 'seg', 'ray', 'circ', 'ell', 'poly', 'vec'].includes(v.k)) continue;
    if (!geoFreeRoots(o.id).length) continue;
    const d = geoDistPx(v, mx, my);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}

function geoPress(m) {
  if (!geoAll().length && !geoToolActive()) return false;
  if (geoToolActive()) {
    if (geoPressTool(m)) return true;
    const want = geoToolById(geoTool).id === 'pt' ? 'pt' : geoWantKind();
    if (want === 'pt') {                       // Klick-Kandidat: wird beim Loslassen zum Punkt, beim Ziehen zum Verschieben der Ansicht
      cancelComputeSpecials();
      drag = { type: 'view', startM: m, startView: { ...view }, startIso: isoView ? { ...isoView } : { ...view }, geoClick: { x: m.x, y: m.y } };
      canvas.style.cursor = 'grabbing';
      return true;
    }
    return false;
  }
  const o = geoGrabPoint(m.x, m.y);
  if (o) {
    const v = geoVal(o.id);
    drag = { type: 'geo', mode: 'pt', id: o.id };
    canvas.style.cursor = 'grabbing';
    return true;
  }
  return false;
}
function geoPressBody(m) {
  if (!geoAll().length || geoToolActive()) return false;
  const o = geoGrabBody(m.x, m.y); if (!o) return false;
  const roots = geoFreeRoots(o.id).map(id => { const r = geoGet(id); return { id, x0: r.x, y0: r.y }; });
  if (!roots.length) return false;
  drag = { type: 'geo', mode: 'body', id: o.id, roots, m0: fromCanvas(m.x, m.y) };
  canvas.style.cursor = 'grabbing';
  return true;
}
function geoDragMove(m) {
  if (!drag || drag.type !== 'geo') return;
  const o = geoGet(drag.id); if (!o) return;
  const raw = fromCanvas(m.x, m.y);
  const tip = $geo('tooltip');
  if (drag.mode === 'pt') {
    if (o.t === 'pt') {
      const p = geoSnap(raw); o.x = p.x; o.y = p.y;
    } else if (o.t === 'pton') {
      const host = geoVal(o.a[0]);
      if (host) {
        let t = geoProjectParam(host, raw);
        if (host.k === 'circ' && gridSnapOn()) {       // Winkel rastet bei 15°-Schritten ein, wenn nahe
          const step = Math.PI / 12, s = Math.round(t / step) * step;
          if (Math.abs(s - t) < 0.05) t = s;
        }
        o.n = t;
      }
    }
    geoRecompute();
    const v = geoVal(o.id);
    if (v && tip) { tip.style.display = 'block'; placeDragTip(tip, m); tip.textContent = o.name + ' ' + niceCoordDec(v.x, v.y, false, 2); }
  } else {                                              // ganzes Objekt verschieben
    let dx = raw.x - drag.m0.x, dy = raw.y - drag.m0.y;
    if (gridSnapOn()) {                                 // der erste Eckpunkt rastet ein, alle anderen folgen
      const r0 = drag.roots[0], s = geoSnap({ x: r0.x0 + dx, y: r0.y0 + dy });
      dx = s.x - r0.x0; dy = s.y - r0.y0;
    }
    for (const r of drag.roots) { const q = geoGet(r.id); if (q) { q.x = r.x0 + dx; q.y = r.y0 + dy; } }
    geoRecompute();
  }
  scheduleDraw();
}
function geoHover(m) {          // true wenn die Maus über etwas Ziehbarem/Wählbarem steht
  geoMouse = m;
  let id = null, grab = false;
  if (!geoAll().length) { geoHoverId = null; return false; }
  if (geoToolActive()) {
    const kind = geoToolById(geoTool).id === 'pt' || geoToolById(geoTool).id === 'del' ? 'any' : geoWantKind();
    id = kind ? geoFindAt(m.x, m.y, kind, geoPicks) : null;
    grab = !!id;
  } else {
    const p = geoGrabPoint(m.x, m.y);
    if (p) { id = p.id; grab = true; }
    else { const b = geoGrabBody(m.x, m.y); if (b) { id = b.id; grab = true; } }
  }
  if (id !== geoHoverId) { geoHoverId = id; }
  return grab;
}
// Für den Löschen-Modus der Werkzeugleiste (06_ui_functions.js tryDeleteAt).
function geoDeleteAt(mx, my) {
  if (!geoAll().length) return false;
  const id = geoFindAt(mx, my, 'any');
  if (!id) return false;
  geoRemove(id); geoCommit();
  return true;
}
// Nach Undo/Redo/Laden (applyState): Oberfläche an das Modell angleichen.
function geoAfterApply() {
  geoPicks = [];
  if (geoHoverId && !geoGet(geoHoverId)) geoHoverId = null;
  geoRenderList();
  geoStatus(geoStepText());
}

// ═══════════════════════════════════════════════════════════════════
// ZEICHNEN
// ═══════════════════════════════════════════════════════════════════
function geoHalo(text, x, y, color, font, align) {
  ctx.font = font; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 3.5; ctx.strokeStyle = C.bg; ctx.lineJoin = 'round'; ctx.strokeText(text, x, y);
  ctx.fillStyle = color; ctx.fillText(text, x, y);
}
function geoArrowHead(a, b, color, size) {
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - size * Math.cos(ang - 0.38), b.y - size * Math.sin(ang - 0.38));
  ctx.lineTo(b.x - size * Math.cos(ang + 0.38), b.y - size * Math.sin(ang + 0.38));
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
function geoFarLine(A, B, kind, w, h) {      // Endpunkte (Pixel) einer unbegrenzten Geraden/eines Strahls
  const a = geoPx(A), b = geoPx(B);
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, ext = (w + h) * 3;
  const ux = dx / l, uy = dy / l;
  return { p: kind === 'ray' ? a : { x: a.x - ux * ext, y: a.y - uy * ext }, q: { x: a.x + ux * ext, y: a.y + uy * ext } };
}

function drawGeo() {
  const objs = geoAll();
  const t = geoToolById(geoTool);
  if (!objs.length && !(geoToolActive() && geoPicks.length)) return;
  const w = getW(), h = getH();
  const labels = [];
  const lw = bw(2), font = bf(13) + 'px system-ui,-apple-system,sans-serif';
  const fontB = '600 ' + bf(13) + 'px system-ui,-apple-system,sans-serif';
  const picked = new Set(geoPicks);

  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.setLineDash([]);
  const style = (o, base) => {
    const hot = o.id === geoHoverId, sel = picked.has(o.id);
    ctx.strokeStyle = sel ? '#f59e0b' : o.color;
    ctx.lineWidth = (o.aux ? Math.max(1.2, lw * 0.65) : lw) + (hot || sel ? 1.5 : 0);
    ctx.setLineDash(o.aux ? [6, 4] : []);
    ctx.globalAlpha = o.aux ? 0.9 : 1;
  };

  // Durchgang 1: Flächen (Vielecke)
  for (const o of objs) {
    const v = geoVal(o.id); if (!v || o.vis === false || v.k !== 'poly') continue;
    const pts = v.pts.map(geoPx);
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    if (o.fill !== false) { ctx.fillStyle = geoHexA(o.color, o.id === geoHoverId ? 0.22 : 0.12); ctx.fill(); }
    if (o.stroke !== false) { style(o); ctx.stroke(); }
    if (geoShowVals && o.lbl && v.area > 0) {
      const c = pts.reduce((s, p) => ({ x: s.x + p.x / pts.length, y: s.y + p.y / pts.length }), { x: 0, y: 0 });
      labels.push({ text: 'A = ' + geoNum(v.area), x: c.x, y: c.y, color: o.color, align: 'center' });
    }
  }
  // Durchgang 2: Kurven
  for (const o of objs) {
    const v = geoVal(o.id); if (!v || o.vis === false) continue;
    if (v.k === 'circ') {
      const c = geoPx({ x: v.cx, y: v.cy }), r = v.r * geoPpu();
      if (r > 1e6) continue;
      ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, 2 * Math.PI); style(o); ctx.stroke();
      if (geoShowNames && o.lbl && !o.aux) labels.push({ text: o.name, x: c.x + r * 0.7071 + 6, y: c.y - r * 0.7071 - 6, color: o.color });
    } else if (v.k === 'ell') {
      const pts = geoEllipsePts(v, 180);
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); style(o); ctx.stroke();
      if (o.t === 'ella') for (const F of [v.F1, v.F2]) {
        const p = geoPx(F); ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI); ctx.fillStyle = o.color; ctx.fill();
      }
      if (geoShowNames && o.lbl && !o.aux) { const p = geoPx(geoCurvePoint(v, Math.PI / 4)); labels.push({ text: o.name, x: p.x + 6, y: p.y - 8, color: o.color }); }
    }
  }
  // Durchgang 3: Geraden, Strecken, Strahlen
  for (const o of objs) {
    const v = geoVal(o.id); if (!v || o.vis === false || !(v.k === 'line' || v.k === 'seg' || v.k === 'ray')) continue;
    let p, q;
    if (v.k === 'seg') { p = geoPx(v.A); q = geoPx(v.B); }
    else { const f = geoFarLine(v.A, v.B, v.k, w, h); p = f.p; q = f.q; }
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); style(o); ctx.stroke();
    if (v.k === 'seg' && o.lbl && !o.aux && (geoShowVals || geoShowNames)) {
      const a = geoPx(v.A), b = geoPx(v.B), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
      const txt = (geoShowNames ? o.name : '') + (geoShowNames && geoShowVals ? ' = ' : '') + (geoShowVals ? geoNum(G2.dist(v.A, v.B)) : '');
      labels.push({ text: txt, x: mx - dy / l * 13, y: my + dx / l * 13, color: o.color, align: 'center' });
    } else if (v.k !== 'seg' && geoShowNames && o.lbl && !o.aux) {
      const f = geoFarLine(v.A, v.B, v.k, w, h), a = geoPx(v.A);
      // Name nahe am sichtbaren Teil: bei A (falls im Bild), sonst gar nicht
      if (a.x > 20 && a.x < w - 20 && a.y > 20 && a.y < h - 20) labels.push({ text: o.name, x: a.x + 8, y: a.y + 14, color: o.color });
    }
  }
  // Durchgang 4: Vektoren
  for (const o of objs) {
    const v = geoVal(o.id); if (!v || o.vis === false || v.k !== 'vec') continue;
    const a = geoPx(v.A), b = geoPx(v.B);
    const hs = bw(11);
    if (o.t === 'vadd' && v.from && v.via) {                   // Konstruktionshilfe: Spitze-an-Fuss und Parallelogramm
      ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = geoHexA(o.color, 0.55); ctx.lineWidth = Math.max(1.2, lw * 0.7);
      const w2 = G2.sub(v.via.B, v.via.A), u2 = G2.sub(v.from.B, v.from.A);
      const t1 = geoPx(v.from.B), t2 = geoPx(v.B), s1 = geoPx(G2.add(v.A, w2));
      ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.moveTo(s1.x, s1.y); ctx.lineTo(t2.x, t2.y); ctx.stroke();
      ctx.restore();
    }
    if (o.t === 'vproj') {                                      // Lot von der Spitze von u auf die Projektion
      const par = geoVal(o.a[0]);
      if (par) { ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = geoHexA(o.color, 0.6); ctx.lineWidth = Math.max(1.2, lw * 0.7);
        const tp = geoPx(par.B); ctx.beginPath(); ctx.moveTo(tp.x, tp.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore(); }
    }
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    style(o);
    if (len > 0.5) {
      const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len, cut = Math.min(hs * 0.8, len);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x - ux * cut, b.y - uy * cut); ctx.stroke();
      geoArrowHead(a, b, ctx.strokeStyle, Math.min(hs, len));
    }
    if (o.lbl && geoShowNames && len > 0.5) {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
      labels.push({ text: (o.name.length === 1 ? '→' : '') + o.name, x: mx - dy / len * 15, y: my + dx / len * 15, color: o.color, align: 'center' });
    }
  }
  // Durchgang 5: Winkel
  for (const o of objs) {
    const v = geoVal(o.id); if (!v || o.vis === false || v.k !== 'ang') continue;
    const B = geoPx(v.B), A = geoPx(v.A), Cc = geoPx(v.C);
    const a1 = Math.atan2(A.y - B.y, A.x - B.x), a2 = Math.atan2(Cc.y - B.y, Cc.x - B.x);
    let da = a2 - a1; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    const r = bw(26), isRight = Math.abs(v.val - Math.PI / 2) < 0.006;
    if (isRight) {
      const s = r * 0.62, u1 = { x: Math.cos(a1), y: Math.sin(a1) }, u2 = { x: Math.cos(a2), y: Math.sin(a2) };
      const p0 = { x: B.x + u1.x * s, y: B.y + u1.y * s }, p1 = { x: B.x + (u1.x + u2.x) * s, y: B.y + (u1.y + u2.y) * s }, p2 = { x: B.x + u2.x * s, y: B.y + u2.y * s };
      ctx.beginPath(); ctx.moveTo(B.x, B.y); ctx.lineTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.closePath();
      ctx.fillStyle = geoHexA(o.color, 0.18); ctx.fill();
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
    } else {
      ctx.beginPath(); ctx.moveTo(B.x, B.y); ctx.arc(B.x, B.y, r, a1, a1 + da, da < 0); ctx.closePath();
      ctx.fillStyle = geoHexA(o.color, 0.18); ctx.fill();
      ctx.beginPath(); ctx.arc(B.x, B.y, r, a1, a1 + da, da < 0);
    }
    style(o); ctx.setLineDash([]); ctx.lineWidth = Math.max(1.4, lw * 0.8); ctx.stroke();
    if (o.lbl && (geoShowVals || geoShowNames)) {
      const mid = a1 + da / 2;
      const txt = (geoShowNames ? o.name : '') + (geoShowNames && geoShowVals ? ' = ' : '') + (geoShowVals ? geoNum(geoDeg(v.val)) + '°' : '');
      labels.push({ text: txt, x: B.x + Math.cos(mid) * (r + 34), y: B.y + Math.sin(mid) * (r + 26), color: o.color, align: 'center' });
    }
  }
  ctx.globalAlpha = 1; ctx.setLineDash([]);

  // Vorschau (Gummiband) für das laufende Werkzeug
  if (geoToolActive() && geoMouse && geoPicks.length && !drag) {
    const last = geoVal(geoPicks[geoPicks.length - 1]);
    if (last && last.k === 'pt') {
      const a = geoPx(last); ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = geoHexA('#f59e0b', 0.9); ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (geoTool === 'circ') ctx.arc(a.x, a.y, Math.hypot(geoMouse.x - a.x, geoMouse.y - a.y), 0, 2 * Math.PI);
      else if (['seg', 'line', 'ray', 'vec', 'poly', 'circd'].includes(geoTool)) { ctx.moveTo(a.x, a.y); ctx.lineTo(geoMouse.x, geoMouse.y); }
      ctx.stroke(); ctx.restore();
    }
  }

  // Durchgang 6: Punkte (oben)
  for (const o of objs) {
    const v = geoVal(o.id); if (!v || o.vis === false || v.k !== 'pt') continue;
    const p = geoPx(v);
    if (p.x < -30 || p.x > w + 30 || p.y < -30 || p.y > h + 30) continue;
    const free = o.t === 'pt' || o.t === 'pton', hot = o.id === geoHoverId, sel = picked.has(o.id);
    const r = (free ? bw(5.5) : bw(4.3)) + (hot ? 1.5 : 0);
    if (free && !o.fixed) { ctx.beginPath(); ctx.arc(p.x, p.y, r + 4, 0, 2 * Math.PI); ctx.fillStyle = geoHexA(o.color, hot ? 0.22 : 0.1); ctx.fill(); }
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = o.color; ctx.fill();
    ctx.lineWidth = sel ? 3 : 1.6; ctx.strokeStyle = sel ? '#f59e0b' : C.bg; ctx.stroke();
    if (o.lbl && geoShowNames) labels.push({ text: o.name, x: p.x + 8, y: p.y - 10, color: o.color, bold: true });
  }
  // Durchgang 7: Beschriftungen
  for (const L of labels) geoHalo(L.text, L.x, L.y, L.color, L.bold ? fontB : font, L.align);
  // Messwerte ohne eigenen Ort im Bild (Summen, Skalarprodukt): oben links als Anzeige
  if (geoShowVals) {
    let yy = bf(22);
    for (const o of objs) {
      if ((o.t !== 'msum' && o.t !== 'dot') || o.vis === false || !geoVal(o.id)) continue;
      geoHalo(geoDescribe(o), 14, yy, o.color === GEO_COLORS.num ? C.anno : o.color, fontB, 'left');
      yy += bf(20);
    }
  }
  ctx.restore();
  geoUpdateTexts();
}

// ═══════════════════════════════════════════════════════════════════
// OBJEKTLISTE (Panel)
// ═══════════════════════════════════════════════════════════════════
let geoRows = {};
function geoMk(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }

function geoRenderList() {
  const box = $geo('geo-list'); if (!box) return;
  box.innerHTML = ''; geoRows = {};
  const objs = geoAll();
  const cnt = $geo('geo-count'); if (cnt) cnt.textContent = objs.length ? '(' + objs.length + ')' : '';
  if (!objs.length) { const e = geoMk('div', 'hint', 'Noch nichts konstruiert. Wähle ein Werkzeug und klicke in die Zeichenfläche, oder lade eine Vorlage.'); box.appendChild(e); return; }
  objs.forEach(o => {
    const row = geoMk('div', 'geo-row');
    row.addEventListener('mouseenter', () => { geoHoverId = o.id; scheduleDraw(); });
    row.addEventListener('mouseleave', () => { if (geoHoverId === o.id) { geoHoverId = null; scheduleDraw(); } });
    const col = document.createElement('input'); col.type = 'color'; col.value = /^#[0-9a-f]{6}$/i.test(o.color) ? o.color : '#2563eb'; col.className = 'geo-col';
    col.title = 'Farbe';
    col.addEventListener('input', () => { o.color = col.value; scheduleDraw(); });
    col.addEventListener('change', () => { if (typeof pushHistory === 'function') pushHistory(); });
    const txt = geoMk('span', 'geo-txt');
    txt.setAttribute('translate', 'no');                // Beschreibung = Namen, Zahlen, Formeln (sprachneutral)
    txt.title = 'Doppelklick: umbenennen';
    txt.addEventListener('dblclick', () => {
      const nn = window.prompt('Neuer Name:', o.name);
      if (nn && nn.trim()) { o.name = nn.trim(); geoRenderList(); if (typeof pushHistory === 'function') pushHistory(); scheduleDraw(); }
    });
    const eyeIc = v => v === false ? '&#x1F648;' : '&#128065;';   // wie in der Funktionsliste
    const eye = geoMk('button', 'del-btn'); eye.innerHTML = eyeIc(o.vis);
    eye.title = 'ein-/ausblenden';
    eye.addEventListener('click', () => { o.vis = o.vis === false; eye.innerHTML = eyeIc(o.vis); row.classList.toggle('geo-hidden', o.vis === false); if (typeof pushHistory === 'function') pushHistory(); scheduleDraw(); });
    const del = geoMk('button', 'del-btn', '✕');
    del.title = 'löschen (samt abhängigen Objekten)';
    del.addEventListener('click', () => {
      const n = geoDependents(o.id).size;
      if (n > 0 && !window.confirm('«' + o.name + '» und ' + n + ' davon abhängige Objekte löschen?')) return;
      geoRemove(o.id); geoCommit();
    });
    row.appendChild(col); row.appendChild(txt); row.appendChild(eye); row.appendChild(del);
    if (o.vis === false) row.classList.add('geo-hidden');
    if (o.aux) row.classList.add('geo-aux');
    const specs = geoNumSpecs(o);
    const ctl = [];
    if (specs.length) {
      const wrap = geoMk('div', 'geo-nums');
      specs.forEach(sp => {
        const lab = geoMk('span', 'geo-lab', sp.label);
        const rng = document.createElement('input'); rng.type = 'range'; rng.min = sp.min; rng.max = sp.max; rng.step = sp.step; rng.className = 'geo-rng';
        const num = document.createElement('input'); num.type = 'number'; num.step = 'any'; num.className = 'geo-num'; num.inputMode = 'decimal';
        const apply = v => {
          if (!isFinite(v)) return;
          sp.set(o, v); geoRecompute(); scheduleDraw(); geoUpdateTexts(true);
        };
        rng.addEventListener('input', () => { num.value = rng.value; apply(parseFloat(rng.value)); });
        num.addEventListener('input', () => { rng.value = num.value; apply(parseFloat(num.value)); });
        const done = () => { if (typeof pushHistory === 'function') pushHistory(); };
        rng.addEventListener('change', done); num.addEventListener('change', done);
        wrap.appendChild(lab); wrap.appendChild(rng); wrap.appendChild(num);
        ctl.push({ sp, rng, num });
      });
      row.appendChild(wrap);
    }
    box.appendChild(row);
    geoRows[o.id] = { row, txt, ctl, last: null };
  });
  geoUpdateTexts(true);
}

function geoUpdateTexts(force) {
  for (const o of geoAll()) {
    const r = geoRows[o.id]; if (!r) continue;
    const d = geoDescribe(o);
    if (force || r.last !== d) { r.txt.textContent = d; r.last = d; r.row.classList.toggle('geo-bad', !geoVal(o.id)); }
    r.ctl.forEach(c => {
      const val = c.sp.get(o);
      const act = document.activeElement;
      if (isFinite(val) && act !== c.rng && act !== c.num) {
        const s = String(Math.round(val * 1000) / 1000);
        if (c.num.value !== s) { c.num.value = s; c.rng.value = s; }
      }
    });
  }
}

function geoClearAll() {
  if (!geoAll().length) return;
  geoReset(); geoPicks = []; geoCommit(); geoStatus(geoStepText());
}
function geoLoadPreset(id) {
  if (!id) return;
  geoReset(); geoPicks = [];
  geoPreset(id, geoFrame());
  geoSetTool('move');
  geoCommit();
}

// ═══════════════════════════════════════════════════════════════════
// PANEL AUFBAUEN
// ═══════════════════════════════════════════════════════════════════
function geoBuildPanel() {
  const tools = $geo('geo-tools'); if (!tools) return;
  tools.innerHTML = '';
  let grpBox = null, gi = 0;
  GEO_TOOLS.forEach(t => {
    if (t.grp) {
      const det = geoMk('details', 'geo-box'); det.dataset.grp = t.grp;
      if (gi++ < 2) det.open = true;                  // Grundobjekte + Konstruieren sind anfangs offen
      det.appendChild(geoMk('summary', '', t.grp));
      grpBox = geoMk('div', 'geo-toolrow'); det.appendChild(grpBox); tools.appendChild(det);
    }
    const b = geoMk('button', 'geo-tool', t.label);
    b.dataset.tool = t.id; b.title = t.steps[0];
    b.addEventListener('click', () => {
      geoSetTool(geoTool === t.id && t.id !== 'move' ? 'move' : t.id);
      // Handy: Seitenleiste schliessen, damit man gleich in die Zeichenfläche tippen kann (wie bei den Pick-Modi)
      if (geoTool !== 'move' && window.innerWidth <= 700 && typeof closeSidebar === 'function' && !(typeof sbIsSheet === 'function' && sbIsSheet())) closeSidebar();   // als Blatt unten (hochkant) bleibt die Leiste offen
    });
    grpBox.appendChild(b);
  });
  const ps = $geo('geo-presetsel');
  if (ps) {
    ps.innerHTML = '';
    const o0 = document.createElement('option'); o0.value = ''; o0.textContent = 'Vorlage laden …'; ps.appendChild(o0);
    GEO_PRESETS.forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = p.label; ps.appendChild(o); });
    ps.addEventListener('change', () => {
      const id = ps.value; ps.value = '';
      if (!id) return;
      if (geoAll().length > 3 && !window.confirm('Die bisherige Konstruktion wird durch die Vorlage ersetzt (rückgängig mit Undo). Fortfahren?')) return;
      geoLoadPreset(id);
      if (window.innerWidth <= 700 && typeof closeSidebar === 'function' && !(typeof sbIsSheet === 'function' && sbIsSheet())) closeSidebar();
    });
  }
  // Gitter-Snapping: dieselbe Einstellung wie unter «Einstellungen», hier nur nochmals griffbereit
  const gs = $geo('geo-chk-snap'), gm = $geo('chk-gridsnap');
  if (gs && gm) {
    const sync = () => { gs.checked = gm.checked; };
    gs.addEventListener('change', () => { gm.checked = gs.checked; gm.dispatchEvent(new Event('change')); });
    gm.addEventListener('change', sync);
    const gp = $geo('geo-panel'); if (gp) { gp.addEventListener('pointerenter', sync); gp.addEventListener('focusin', sync); }
    sync();
  }
  const cn = $geo('geo-chk-names'), cv = $geo('geo-chk-vals');
  if (cn) cn.addEventListener('change', () => { geoShowNames = cn.checked; scheduleDraw(); });
  if (cv) cv.addEventListener('change', () => { geoShowVals = cv.checked; scheduleDraw(); });
  const clr = $geo('geo-clear'); if (clr) clr.addEventListener('click', () => {
    if (geoAll().length > 3 && !window.confirm('Die ganze Konstruktion löschen?')) return;
    geoClearAll();
  });
  const fin = $geo('geo-finish'); if (fin) { fin.style.display = 'none'; fin.addEventListener('click', geoFinishPoly); }
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || geoTool === 'move') return;
    const tg = e.target && e.target.tagName;
    if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'MATH-FIELD') return;
    geoSetTool('move');
  });
  geoSetTool('move');
  geoRenderList();
}
geoBuildPanel();   // das Skript steht am Ende des <body>: die Panel-Elemente existieren schon

// ═══════════════════════════════════════════════════════════════════
// LATEX-EXPORT (TikZ/pgfplots) — wird von generateLatex() in 07_export.js aufgerufen
// opt: {coord(v), col(hex), xmin, xmax, ymin, ymax}. Rückgabe: Zeilen für den axis-Block.
// Gezeichnet wird dasselbe wie auf dem Canvas (drawGeo): Flächen, Kurven, Geraden/Strecken,
// Vektoren, Winkel, Punkte, Beschriftungen und die Mess-Anzeigen (Summe, Skalarprodukt).
// ═══════════════════════════════════════════════════════════════════
const GEO_TEX_CHARS = { 'α': '\\alpha ', 'β': '\\beta ', 'γ': '\\gamma ', 'δ': '\\delta ', 'ω': '\\omega ', 'φ': '\\varphi ', 'ε': '\\varepsilon ',
  'π': '\\pi ', 'λ': '\\lambda ', 'μ': '\\mu ', 'σ': '\\sigma ', 'τ': '\\tau ', 'ρ': '\\rho ',
  '′': "'", '″': "''", '·': '\\cdot ', '−': '-', '–': '-', '∠': '\\angle ', '⊥': '\\perp ', '∥': '\\parallel ', '°': '^{\\circ}', '²': '^{2}', '³': '^{3}',
  '₁': '_{1}', '₂': '_{2}', '₃': '_{3}', '₄': '_{4}', '→': '\\to ', '∟': '', '|': '\\,|\\,', '%': '\\%', '&': '\\&', '#': '\\#', '_': '\\_', '{': '\\{', '}': '\\}', '^': '\\^{}', '~': '\\~{}', '\\': '\\backslash ' };
function geoTexText(s) {
  let o = '';
  for (const ch of String(s)) o += GEO_TEX_CHARS[ch] !== undefined ? GEO_TEX_CHARS[ch] : ch;
  return o;
}

// Liang–Barsky: Strecke p–q auf das Rechteck zuschneiden. null = ausserhalb.
function geoClipSeg(p, q, R) {
  let t0 = 0, t1 = 1; const dx = q.x - p.x, dy = q.y - p.y;
  const test = (pp, qq) => { if (pp === 0) return qq >= 0; const r = qq / pp; if (pp < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } return true; };
  if (test(-dx, p.x - R.xmin) && test(dx, R.xmax - p.x) && test(-dy, p.y - R.ymin) && test(dy, R.ymax - p.y)) {
    return [{ x: p.x + t0 * dx, y: p.y + t0 * dy }, { x: p.x + t1 * dx, y: p.y + t1 * dy }];
  }
  return null;
}

function geoToPgf(opt) {
  const objs = geoAll();
  if (!objs.length) return '';
  const co = opt.coord, R = { xmin: opt.xmin, xmax: opt.xmax, ymin: opt.ymin, ymax: opt.ymax };
  const span = Math.max(R.xmax - R.xmin, R.ymax - R.ymin), big = span * 40;
  const inBig = p => Math.abs(p.x) < big + Math.abs(R.xmin) + Math.abs(R.xmax) && Math.abs(p.y) < big + Math.abs(R.ymin) + Math.abs(R.ymax);
  const P = p => `(axis cs:${co(p.x)},${co(p.y)})`;
  const clr = o => opt.col(o.color);
  const sty = o => (o.aux ? 'thin, dashed' : 'thick');
  const arcR = span * 0.035;
  const gtn = v => geoTexText(geoNum(v));       // 2 Nachkommastellen wie auf dem Canvas
  let s = '  % Geometrie (Konstruktion aus dem Geometrie-Panel)\n';
  const labels = [];

  // Flächen
  for (const o of objs) {
    const v = geoVal(o.id); if (!v || o.vis === false || v.k !== 'poly' || !v.pts.every(inBig)) continue;
    const path = v.pts.map(P).join(' -- ');
    const draw = o.stroke === false ? 'draw=none' : `draw=${clr(o)}, ${sty(o)}`;
    s += `  \\path[${draw}, fill=${o.fill === false ? 'none' : clr(o) + ', fill opacity=0.14'}] ${path} -- cycle;\n`;
    if (geoShowVals && o.lbl && v.area > 0) {
      const c = v.pts.reduce((a, p) => ({ x: a.x + p.x / v.pts.length, y: a.y + p.y / v.pts.length }), { x: 0, y: 0 });
      s += `  \\node[font=\\scriptsize, color=${clr(o)}] at ${P(c)} {$A=${gtn(v.area)}$};\n`;
    }
  }
  // Kurven: Kreis und Ellipse als Parameterkurve in Achseneinheiten
  for (const o of objs) {
    const v = geoVal(o.id); if (!v || o.vis === false || (v.k !== 'circ' && v.k !== 'ell')) continue;
    let A, B, Cc, D, cx, cy;
    if (v.k === 'circ') { cx = v.cx; cy = v.cy; A = v.r; B = 0; Cc = 0; D = v.r; }
    else { cx = v.cx; cy = v.cy; A = v.a * Math.cos(v.phi); B = -v.b * Math.sin(v.phi); Cc = v.a * Math.sin(v.phi); D = v.b * Math.cos(v.phi); }
    if (Math.abs(cx) > big || Math.abs(cy) > big || Math.max(Math.abs(A), Math.abs(D), Math.abs(B), Math.abs(Cc)) > big) continue;
    s += `  \\addplot[color=${clr(o)}, ${sty(o)}, domain=0:360, samples=181, variable=t] ({${co(cx)}+${co(A)}*cos(t)+${co(B)}*sin(t)}, {${co(cy)}+${co(Cc)}*cos(t)+${co(D)}*sin(t)});\n`;
    if (geoShowNames && o.lbl && !o.aux) {
      const p = geoCurvePoint(v, Math.PI / 4); labels.push({ p, text: o.name, color: clr(o), anchor: 'south west' });
    }
  }
  // Geraden, Strecken, Strahlen
  for (const o of objs) {
    const v = geoVal(o.id); if (!v || o.vis === false || !(v.k === 'line' || v.k === 'seg' || v.k === 'ray')) continue;
    let p, q;
    if (v.k === 'seg') { p = v.A; q = v.B; }
    else {
      const d = G2.unit(G2.sub(v.B, v.A)), L = span * 100;
      p = v.k === 'ray' ? v.A : G2.sub(v.A, G2.mul(d, L)); q = G2.add(v.A, G2.mul(d, L));
    }
    const c = geoClipSeg(p, q, R); if (!c) continue;
    let node = '';
    if (v.k === 'seg' && o.lbl && !o.aux && (geoShowVals || geoShowNames)) {
      const txt = (geoShowNames ? geoTexText(o.name) : '') + (geoShowNames && geoShowVals ? '=' : '') + (geoShowVals ? gtn(G2.dist(v.A, v.B)) : '');
      node = ` node[midway, above, sloped, font=\\scriptsize, color=${clr(o)}] {$${txt}$}`;
    }
    s += `  \\draw[color=${clr(o)}, ${sty(o)}] ${P(c[0])} -- ${P(c[1])}${node};\n`;
  }
  // Vektoren (mit Konstruktionshilfen)
  for (const o of objs) {
    const v = geoVal(o.id); if (!v || o.vis === false || v.k !== 'vec') continue;
    if (o.t === 'vadd' && v.from && v.via) {
      const w2 = G2.sub(v.via.B, v.via.A);
      s += `  \\draw[color=${clr(o)}, thin, dashed] ${P(v.from.B)} -- ${P(v.B)};\n  \\draw[color=${clr(o)}, thin, dashed] ${P(G2.add(v.A, w2))} -- ${P(v.B)};\n`;
    }
    if (o.t === 'vproj') { const par = geoVal(o.a[0]); if (par) s += `  \\draw[color=${clr(o)}, thin, dashed] ${P(par.B)} -- ${P(v.B)};\n`; }
    if (G2.dist(v.A, v.B) > 1e-9) {
      const nm = o.lbl && geoShowNames ? ` node[midway, above, sloped, font=\\scriptsize, color=${clr(o)}] {$${o.name.length === 1 ? '\\vec{' + geoTexText(o.name) + '}' : geoTexText(o.name)}$}` : '';
      s += `  \\draw[->, color=${clr(o)}, thick] ${P(v.A)} -- ${P(v.B)}${nm};\n`;
    }
  }
  // Winkel
  for (const o of objs) {
    const v = geoVal(o.id); if (!v || o.vis === false || v.k !== 'ang') continue;
    const a1 = Math.atan2(v.A.y - v.B.y, v.A.x - v.B.x), a2 = Math.atan2(v.C.y - v.B.y, v.C.x - v.B.x);
    let da = a2 - a1; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    if (Math.abs(v.val - Math.PI / 2) < 0.006) {
      const r = arcR * 0.7, u1 = { x: Math.cos(a1), y: Math.sin(a1) }, u2 = { x: Math.cos(a2), y: Math.sin(a2) };
      const p0 = G2.add(v.B, G2.mul(u1, r)), p1 = G2.add(v.B, G2.mul(G2.add(u1, u2), r)), p2 = G2.add(v.B, G2.mul(u2, r));
      s += `  \\draw[color=${clr(o)}, thin] ${P(p0)} -- ${P(p1)} -- ${P(p2)};\n`;
    } else {
      s += `  \\addplot[color=${clr(o)}, thin, domain=${co(a1 * 180 / Math.PI)}:${co((a1 + da) * 180 / Math.PI)}, samples=24, variable=t] ({${co(v.B.x)}+${co(arcR)}*cos(t)}, {${co(v.B.y)}+${co(arcR)}*sin(t)});\n`;
    }
    if (o.lbl && (geoShowVals || geoShowNames)) {
      const mid = a1 + da / 2, rr = arcR * 2.1;
      const txt = (geoShowNames ? geoTexText(o.name) : '') + (geoShowNames && geoShowVals ? '=' : '') + (geoShowVals ? gtn(v.val * 180 / Math.PI) + '^{\\circ}' : '');
      s += `  \\node[font=\\scriptsize, color=${clr(o)}] at (axis cs:${co(v.B.x + rr * Math.cos(mid))},${co(v.B.y + rr * Math.sin(mid))}) {$${txt}$};\n`;
    }
  }
  // Punkte
  for (const o of objs) {
    const v = geoVal(o.id); if (!v || o.vis === false || v.k !== 'pt') continue;
    if (v.x < R.xmin || v.x > R.xmax || v.y < R.ymin || v.y > R.ymax) continue;
    s += `  \\addplot[color=${clr(o)}, only marks, mark=*, mark size=${(o.t === 'pt' || o.t === 'pton') ? '2' : '1.5'}pt] coordinates {(${co(v.x)},${co(v.y)})};\n`;
    if (o.lbl && geoShowNames) labels.push({ p: v, text: o.name, color: clr(o), anchor: 'south west', bold: true });
  }
  for (const L of labels) {
    s += `  \\node[anchor=${L.anchor}, font=\\small${L.bold ? '\\bfseries' : ''}, color=${L.color}, inner sep=1.5pt] at ${P(L.p)} {$${geoTexText(L.text)}$};\n`;
  }
  // Messwerte ohne eigenen Ort (Summe, Skalarprodukt): oben links
  if (geoShowVals) {
    let i = 0;
    for (const o of objs) {
      if ((o.t !== 'msum' && o.t !== 'dot') || o.vis === false || !geoVal(o.id)) continue;
      s += `  \\node[anchor=north west, font=\\small, color=${clr(o)}] at (rel axis cs:0.02,${(0.98 - 0.06 * i).toFixed(2)}) {$${geoTexText(geoDescribe(o))}$};\n`;
      i++;
    }
  }
  return s;
}
