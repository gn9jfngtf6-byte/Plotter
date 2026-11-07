// ═══════════════════════════════════════════════════════════════════
// MODUL: 3d — Räumliche Geometrie (Kern, reine Mathematik, kein DOM)
// Ebenen in Koordinatenform  a·x + b·y + c·z = d  einlesen, mit dem
// sichtbaren Würfel (Box) schneiden, Achsenabschnitte / Spurgeraden /
// Schnittgeraden / Schnittpunkte berechnen und orthogonal auf den Bildschirm
// projizieren. Die Oberfläche (Zeichnen, Drehen, Panel) steht in 30_3d_ui.js.
//
// Koordinaten:  rechtshändig, x nach vorn-links, y nach rechts, z nach oben
//               (so wie in den Schweizer Lehrmitteln gezeichnet).
// Ebene:   {a,b,c,d}                     (n = (a,b,c) ≠ 0)
// Box:     {x:[lo,hi], y:[lo,hi], z:[lo,hi]}
// Ansicht: {az, el}   Blickrichtung in Grad (Azimut um z, Elevation über der xy-Ebene)
//
// Ändern:  Toleranz → TD_EPS · Projektion → tdProject()
// ═══════════════════════════════════════════════════════════════════

const TD_EPS = 1e-9;

// ── Vektor-Mathematik (3D) ──────────────────────────────────────────
const V3 = {
  add: (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]],
  sub: (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]],
  mul: (p, k) => [p[0] * k, p[1] * k, p[2] * k],
  dot: (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2],
  cross: (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]],
  len: p => Math.hypot(p[0], p[1], p[2]),
  dist: (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
};

// ═══════════════════════════════════════════════════════════════════
// 1. Gleichung einlesen
// ═══════════════════════════════════════════════════════════════════
// Parameter: die Buchstaben a–d, k–n, p–t (ohne e) gelten als Zahlen, deren Wert in `params` steht
// (fehlt er, ist er 1). So sind Gleichungen wie  ax + by + cz = d  möglich; die Oberfläche
// zeigt dazu Schieber. Für die Rechnung bleibt die Gleichung linear in x, y, z.
const TD_PARAM_CH = 'abcdklmnpqrst';
function tdParamNames(src) {
  const seen = {};
  String(src || '').split('').forEach(c => { if (TD_PARAM_CH.indexOf(c) >= 0) seen[c] = true; });
  return Object.keys(seen).sort();
}
// Linearer Ausdruck in x,y,z: {x,y,z,c}. Erlaubt: + − * / ( ), Dezimalzahlen
// (Punkt oder Komma), Brüche, «2x», «2(x+1)», «x/2», «1/2 x», «3·x», Parameter (siehe oben).
function tdParseLinear(src, params) {
  const s = String(src)
    .replace(/[−–—]/g, '-').replace(/[·×⋅]/g, '*').replace(/[:÷]/g, '/')
    .replace(/(\d),(\d)/g, '$1.$2').replace(/\s+/g, '');
  let i = 0;
  const L = (x, y, z, c) => ({ x, y, z, c });
  const isConst = p => p.x === 0 && p.y === 0 && p.z === 0;
  const add = (p, q, k) => L(p.x + k * q.x, p.y + k * q.y, p.z + k * q.z, p.c + k * q.c);
  const scale = (p, k) => L(p.x * k, p.y * k, p.z * k, p.c * k);
  function fail(msg) { const e = new Error(msg); e.td = true; throw e; }
  function expr() {
    let v = term();
    while (i < s.length && (s[i] === '+' || s[i] === '-')) {
      const op = s[i++]; const t = term();
      v = add(v, t, op === '+' ? 1 : -1);
    }
    return v;
  }
  function startsFactor() { return i < s.length && (/[0-9.xyzXYZ(]/.test(s[i]) || TD_PARAM_CH.indexOf(s[i]) >= 0); }
  function term() {
    let v = unary();
    for (;;) {
      if (i < s.length && s[i] === '*') { i++; v = mulP(v, unary()); }
      else if (i < s.length && s[i] === '/') {
        i++; const d = unary();
        if (!isConst(d)) fail('Division durch eine Variable ist nicht linear');
        if (Math.abs(d.c) < TD_EPS) fail('Division durch Null');
        v = scale(v, 1 / d.c);
      } else if (startsFactor()) v = mulP(v, unary());   // 2x, 2(x+1), x y
      else break;
    }
    return v;
  }
  function mulP(p, q) {
    if (isConst(p)) return scale(q, p.c);
    if (isConst(q)) return scale(p, q.c);
    return fail('Nur lineare Gleichungen (kein x·y oder x²)');
  }
  function unary() {
    if (s[i] === '-') { i++; return scale(unary(), -1); }
    if (s[i] === '+') { i++; return unary(); }
    return atom();
  }
  function atom() {
    const ch = s[i];
    if (ch === '(') {
      i++; const v = expr();
      if (s[i] !== ')') fail('Klammer fehlt');
      i++; return v;
    }
    if (/[xyzXYZ]/.test(ch)) {
      i++;
      if (s[i] === '^' || s[i] === '²') fail('Nur lineare Gleichungen (kein x²)');
      const k = ch.toLowerCase();
      return L(k === 'x' ? 1 : 0, k === 'y' ? 1 : 0, k === 'z' ? 1 : 0, 0);
    }
    if (TD_PARAM_CH.indexOf(ch) >= 0) {
      i++;
      const pv = params && Object.prototype.hasOwnProperty.call(params, ch) ? Number(params[ch]) : 1;
      return L(0, 0, 0, Number.isFinite(pv) ? pv : 1);
    }
    const m = /^\d*\.?\d+(?:[eE][+-]?\d+)?|^\d+\.?/.exec(s.slice(i));
    if (m) { i += m[0].length; return L(0, 0, 0, parseFloat(m[0])); }
    return fail(i >= s.length ? 'Ausdruck unvollständig' : 'Unerwartetes Zeichen oder unbekannte Variable');
  }
  const v = expr();
  if (i < s.length) fail('Unerwartetes Zeichen oder unbekannte Variable');
  return v;
}

// «2x + 3y - z = 6» → {a,b,c,d}; Fehler → {error}
function tdParsePlane(str, params) {
  try {
    const s = String(str || '').trim();
    if (!s) return { error: 'leer' };
    const parts = s.split('=');
    if (parts.length !== 2) return { error: 'Genau ein «=» nötig' };
    if (!parts[0].trim() || !parts[1].trim()) return { error: 'Ausdruck unvollständig' };
    const l = tdParseLinear(parts[0], params), r = tdParseLinear(parts[1], params);
    const a = l.x - r.x, b = l.y - r.y, c = l.z - r.z, d = r.c - l.c;
    if (![a, b, c, d].every(Number.isFinite)) return { error: 'Ungültige Zahl' };
    if (Math.abs(a) < TD_EPS && Math.abs(b) < TD_EPS && Math.abs(c) < TD_EPS) {
      return { error: Math.abs(d) < TD_EPS ? 'Gleichung gilt immer – keine Ebene' : 'Widerspruch – keine Ebene' };
    }
    return { a: tdClean(a), b: tdClean(b), c: tdClean(c), d: tdClean(d) };
  } catch (e) {
    if (e && e.td) return { error: e.message };
    return { error: 'Gleichung nicht lesbar' };
  }
}
function tdClean(x) { const r = Math.round(x * 1e12) / 1e12; return Object.is(r, -0) ? 0 : r; }

// ── Anzeige ─────────────────────────────────────────────────────────
function tdNum(x, prec) {
  const r = Math.round(x * Math.pow(10, prec == null ? 3 : prec)) / Math.pow(10, prec == null ? 3 : prec);
  return String(Object.is(r, -0) ? 0 : r).replace('-', '−');
}
// Bruch, wenn schön (Nenner 2, 3, 4, 6, 8), sonst Dezimalzahl
function tdFrac(x) {
  if (Math.abs(x - Math.round(x)) < 1e-9) return tdNum(Math.round(x), 0);
  for (const q of [2, 3, 4, 6, 8]) {            // nur «schöne» Brüche; sonst Dezimalzahl (z. B. 3.3 statt 33/10)
    const p = Math.round(x * q);
    if (Math.abs(x - p / q) < 1e-9) return (p < 0 ? '−' : '') + Math.abs(p) + '/' + q;
  }
  return tdNum(x, 3);
}
// «2x + 3y − z = 6»
function tdPlaneStr(pl) {
  let s = '';
  [['a', 'x'], ['b', 'y'], ['c', 'z']].forEach(([k, v]) => {
    const co = pl[k]; if (Math.abs(co) < TD_EPS) return;
    const abs = Math.abs(co);
    const mag = Math.abs(abs - 1) < 1e-9 ? '' : tdFrac(abs);
    s += (s ? (co < 0 ? ' − ' : ' + ') : (co < 0 ? '−' : '')) + mag + v;
  });
  return s + ' = ' + tdFrac(pl.d);
}
// LaTeX-Form
function tdPlaneTex(pl) {
  return tdPlaneStr(pl).replace(/−/g, '-').replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');
}

// ═══════════════════════════════════════════════════════════════════
// 2. Ebene ∩ Box
// ═══════════════════════════════════════════════════════════════════
function tdBoxCorners(box) {
  const out = [];
  for (const x of box.x) for (const y of box.y) for (const z of box.z) out.push([x, y, z]);
  return out;
}
// Die 12 Kanten der Box als Punktepaare
function tdBoxEdges(box) {
  const e = [];
  const [x0, x1] = box.x, [y0, y1] = box.y, [z0, z1] = box.z;
  for (const y of [y0, y1]) for (const z of [z0, z1]) e.push([[x0, y, z], [x1, y, z]]);
  for (const x of [x0, x1]) for (const z of [z0, z1]) e.push([[x, y0, z], [x, y1, z]]);
  for (const x of [x0, x1]) for (const y of [y0, y1]) e.push([[x, y, z0], [x, y, z1]]);
  return e;
}
// Schnittfläche der Ebene mit der Box: geordnetes Vieleck (3–6 Ecken) oder []
function tdPlanePolygon(pl, box) {
  const n = [pl.a, pl.b, pl.c], nl = V3.len(n);
  const scale = Math.max(1, nl, Math.abs(pl.d));
  const tol = 1e-9 * scale;
  const f = p => V3.dot(n, p) - pl.d;
  const pts = [];
  const addPt = p => { if (!pts.some(q => V3.dist(p, q) < 1e-7 * Math.max(1, V3.len(p)))) pts.push(p); };
  for (const [p, q] of tdBoxEdges(box)) {
    const fp = f(p), fq = f(q);
    if (Math.abs(fp) <= tol) addPt(p);
    if (Math.abs(fq) <= tol) addPt(q);
    if ((fp < -tol && fq > tol) || (fp > tol && fq < -tol)) {
      const t = fp / (fp - fq);
      addPt([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1]), p[2] + t * (q[2] - p[2])]);
    }
  }
  if (pts.length < 3) return [];
  // nach Winkel um den Schwerpunkt ordnen (in der Ebene)
  const c = pts.reduce((s, p) => V3.add(s, p), [0, 0, 0]).map(v => v / pts.length);
  const nu = V3.mul(n, 1 / nl);
  const ref = Math.abs(nu[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const e1 = V3.cross(nu, ref), l1 = V3.len(e1);
  const u = V3.mul(e1, 1 / l1), v = V3.cross(nu, u);
  pts.sort((p, q) => {
    const dp = V3.sub(p, c), dq = V3.sub(q, c);
    return Math.atan2(V3.dot(dp, v), V3.dot(dp, u)) - Math.atan2(V3.dot(dq, v), V3.dot(dq, u));
  });
  return pts;
}

// Gerade P + t·u auf die Box zuschneiden → [t0,t1] oder null (Slab-Methode)
function tdClipLine(P, u, box) {
  let t0 = -Infinity, t1 = Infinity;
  const ranges = [box.x, box.y, box.z];
  for (let k = 0; k < 3; k++) {
    const lo = ranges[k][0], hi = ranges[k][1];
    if (Math.abs(u[k]) < TD_EPS) {
      if (P[k] < lo - 1e-9 || P[k] > hi + 1e-9) return null;
    } else {
      let a = (lo - P[k]) / u[k], b = (hi - P[k]) / u[k];
      if (a > b) { const t = a; a = b; b = t; }
      t0 = Math.max(t0, a); t1 = Math.min(t1, b);
    }
  }
  if (!(t1 - t0 > -1e-12) || !isFinite(t0) || !isFinite(t1)) return null;
  return [t0, t1];
}

// ═══════════════════════════════════════════════════════════════════
// 3. Eigenschaften einer Ebene
// ═══════════════════════════════════════════════════════════════════
function tdNormal(pl) { return [pl.a, pl.b, pl.c]; }
// Abstand des Ursprungs
function tdDistOrigin(pl) { return Math.abs(pl.d) / V3.len(tdNormal(pl)); }
// Lotfusspunkt vom Ursprung auf die Ebene
function tdFootOrigin(pl) {
  const n = tdNormal(pl), k = pl.d / V3.dot(n, n);
  return V3.mul(n, k);
}
// Abstand eines Punktes
function tdDistPoint(pl, P) { return Math.abs(V3.dot(tdNormal(pl), P) - pl.d) / V3.len(tdNormal(pl)); }
// Achsenabschnitte: Punkte auf den Achsen oder null (parallel zur Achse / durch den Ursprung)
function tdIntercepts(pl) {
  const co = [pl.a, pl.b, pl.c], out = [];
  for (let k = 0; k < 3; k++) {
    if (Math.abs(co[k]) < TD_EPS) { out.push(null); continue; }
    const p = [0, 0, 0]; p[k] = tdClean(pl.d / co[k]); out.push(p);
  }
  return out;
}
// Spurgeraden in den drei Koordinatenebenen: Strecken (in der Box) oder null
function tdTraces(pl, box) {
  const planes = [{ a: 0, b: 0, c: 1, d: 0 }, { a: 0, b: 1, c: 0, d: 0 }, { a: 1, b: 0, c: 0, d: 0 }]; // xy, xz, yz
  return planes.map(cp => {
    const L = tdPlanePlane(pl, cp);
    if (!L || L.parallel) return null;
    const t = tdClipLine(L.P, L.u, box);
    if (!t || t[1] - t[0] < 1e-9) return null;
    return { P: L.P, u: L.u, A: V3.add(L.P, V3.mul(L.u, t[0])), B: V3.add(L.P, V3.mul(L.u, t[1])) };
  });
}

// ═══════════════════════════════════════════════════════════════════
// 4. Lage zweier / dreier Ebenen
// ═══════════════════════════════════════════════════════════════════
// Schnittgerade: {P, u} (u normiert); parallel → {parallel:true, same:bool}
function tdPlanePlane(p, q) {
  const n1 = tdNormal(p), n2 = tdNormal(q);
  const u = V3.cross(n1, n2), ul = V3.len(u);
  const sc = V3.len(n1) * V3.len(n2);
  if (ul < 1e-9 * sc) {
    // parallele Normalen: gleiche Ebene?
    const k = V3.dot(n1, n2) / V3.dot(n2, n2);        // n1 = k·n2
    const same = Math.abs(p.d - k * q.d) < 1e-9 * Math.max(1, Math.abs(p.d));
    return { parallel: true, same };
  }
  // Aufpunkt: P = (d1·(n2×u) + d2·(u×n1)) / |u|²   (löst n1·P=d1, n2·P=d2, u·P=0)
  const a = V3.mul(V3.cross(n2, u), p.d), b = V3.mul(V3.cross(u, n1), q.d);
  const P = V3.mul(V3.add(a, b), 1 / (ul * ul));
  return { P: P.map(tdClean), u: V3.mul(u, 1 / ul) };
}
// Schnittpunkt dreier Ebenen (Cramer) oder null
function tdThreePlanes(p, q, r) {
  const n1 = tdNormal(p), n2 = tdNormal(q), n3 = tdNormal(r);
  const det = V3.dot(n1, V3.cross(n2, n3));
  const sc = V3.len(n1) * V3.len(n2) * V3.len(n3);
  if (Math.abs(det) < 1e-9 * sc) return null;
  const s = V3.add(V3.add(V3.mul(V3.cross(n2, n3), p.d), V3.mul(V3.cross(n3, n1), q.d)), V3.mul(V3.cross(n1, n2), r.d));
  return V3.mul(s, 1 / det).map(tdClean);
}
// Winkel zwischen zwei Ebenen in Grad (0…90)
function tdAnglePlanes(p, q) {
  const n1 = tdNormal(p), n2 = tdNormal(q);
  const c = Math.abs(V3.dot(n1, n2)) / (V3.len(n1) * V3.len(n2));
  return Math.acos(Math.min(1, c)) * 180 / Math.PI;
}
// Gerade als Parameterform-Text:  g: X = (1|2|3) + t·(a|b|c)
function tdLineStr(L) {
  // Richtungsvektor schön: durch kleinste |Komponente|≠0 teilen, wenn dann ganzzahlig-ähnlich
  let u = L.u.slice();
  const nz = u.filter(v => Math.abs(v) > 1e-9).map(Math.abs);
  const m = Math.min(...nz);
  u = u.map(v => v / m);
  for (let k = 1; k <= 12; k++) {
    const w = u.map(v => v * k);
    if (w.every(v => Math.abs(v - Math.round(v)) < 1e-6)) { u = w.map(Math.round); break; }
  }
  const first = u.find(v => Math.abs(v) > 1e-9);
  if (first < 0) u = u.map(v => -v);
  const vec = v => '(' + v.map(x => tdFrac(x)).join(' | ') + ')';
  return 'X = ' + vec(L.P) + ' + t·' + vec(u);
}

// Balken über dem Gitter: zu jedem Gitterpunkt (x|y) der xy-Ebene gehört der z-Wert der Ebene
// z = (d − a·x − b·y) / c. Punkte, deren z ausserhalb [−R, R] liegt, entfallen.
// Liefert [{x,y,z}] (Gitter ganzzahlig × step, Ursprung inklusive); null, wenn c = 0.
function tdBars(pl, R, step) {
  if (Math.abs(pl.c) < TD_EPS || !(step > 0) || !(R > 0)) return null;
  const n = Math.floor(R / step + 1e-9), out = [];
  if (n > 60) return null;
  for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
    const x = tdClean(i * step), y = tdClean(j * step), z = tdClean((pl.d - pl.a * x - pl.b * y) / pl.c);
    if (Math.abs(z) <= R + 1e-9) out.push({ x, y, z });
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════
// 5. Projektion (orthogonal)
// ═══════════════════════════════════════════════════════════════════
// Bildschirm-Koordinaten in Einheiten (rechts, oben) + Tiefe (grösser = weiter weg).
//   p1 = x·cos a + y·sin a      p2 = −x·sin a + y·cos a
//   rechts = p1    oben = z·cos e + p2·sin e    Tiefe = p2·cos e − z·sin e
function tdViewMat(view) {
  const a = view.az * Math.PI / 180, e = view.el * Math.PI / 180;
  return { ca: Math.cos(a), sa: Math.sin(a), ce: Math.cos(e), se: Math.sin(e) };
}
function tdProject(p, view) {
  const m = view._m || tdViewMat(view);
  const p1 = p[0] * m.ca + p[1] * m.sa, p2 = -p[0] * m.sa + p[1] * m.ca;
  return { sx: p1, sy: p[2] * m.ce + p2 * m.se, depth: p2 * m.ce - p[2] * m.se };
}
// Schöner Achsenschritt: 1, 2, 5, 10 … so dass etwa 4–8 Marken entstehen
function tdNiceStep(range) {
  const raw = range / 5, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
}

// Farben der Ebenen (gut unterscheidbar, auch hell/dunkel)
const TD_COLORS = ['#2f6fed', '#e8590c', '#2b9348', '#9c36b5', '#d6336c', '#0c8599'];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    V3, TD_EPS, TD_COLORS, tdParseLinear, tdParsePlane, tdParamNames, tdClean, tdNum, tdFrac, tdPlaneStr, tdPlaneTex,
    tdBoxCorners, tdBoxEdges, tdPlanePolygon, tdClipLine, tdNormal, tdDistOrigin, tdFootOrigin,
    tdDistPoint, tdIntercepts, tdTraces, tdBars, tdPlanePlane, tdThreePlanes, tdAnglePlanes, tdLineStr,
    tdViewMat, tdProject, tdNiceStep
  };
}
