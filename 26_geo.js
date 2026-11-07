// ═══════════════════════════════════════════════════════════════════
// MODUL: geo — Geometrie (Kern, reine Mathematik, kein DOM)
// Konstruktions-Modell wie in einem dynamischen Geometrieprogramm: Jedes
// Objekt (Punkt, Strecke, Kreis, Vektor, Winkel …) steht in der Liste
// geoObjs[] und verweist über o.a[] (IDs) auf die Objekte, aus denen es
// entsteht. Zieht man einen freien Punkt, rechnet geoRecompute() alles
// Abhängige neu (Reihenfolge der Liste = Reihenfolge der Abhängigkeiten).
// Die Oberfläche (Zeichnen, Werkzeuge, Ziehen, Panel) steht in 27_geo_ui.js.
//
// Objekt:  {id, t, a:[ids], x, y (freie Punkte), n (Zahl / Index / Parameter),
//           k (Unterart), name, color, vis, lbl, aux, fill, stroke, fixed}
// Werte:   geoVals[id] = null (ungültig) oder
//   {k:'pt', x,y} · {k:'line'|'seg'|'ray', A,B} · {k:'circ', cx,cy,r}
//   {k:'ell', cx,cy,a,b,phi,F1,F2} · {k:'poly', pts, area, perim}
//   {k:'vec', A,B} · {k:'ang', A,B,C, val} · {k:'dot', …} · {k:'num', v, unit}
//
// Typen (o.t):
//   pt    freier Punkt (x,y)               pton  Punkt auf Objekt (n = Parameter)
//   mid   Mittelpunkt [A,B]                inter Schnittpunkt [o1,o2] (n = Index)
//   foot  Lotfusspunkt [P,L]               ctr   Dreieckspunkt [A,B,C] (k = centroid|circum|incenter|ortho)
//   seg|line|ray [A,B]                     perpl Lot [P,L]   parl Parallele [P,L]
//   pbis  Mittelsenkrechte [A,B]           abis  Winkelhalbierende [A,B(Scheitel),C]
//   tang  Tangente [P,Kurve] (n = Index)
//   circ  Kreis [M,P]  circr [M] (n = r)   circd Durchmesser [A,B]
//   circ3 Umkreis [A,B,C]                  incirc Inkreis [A,B,C]
//   ellf  Ellipse [F1,F2,P]                ella  Ellipse [M] (n = [a,b,phi°])
//   poly  Vieleck [P1…Pn]                  ang   Winkel [A,B,C] (≤ 180°)
//   vec   Vektor [A,B]                     vadd|vsub [u,v]   vscale [u] (n = k)   vproj [u,v]
//   dot   Skalarprodukt [u,v]              msum  Summe von Massen [m1,m2,…]
//   xf    Abbildung [Quelle, Via] (k = refl|reflp|rot|trans|dil, n = Winkel° bzw. Faktor)
//
// Ändern:  Toleranzen → GEO_EPS · Vorlagen → geoPreset() unten
// ═══════════════════════════════════════════════════════════════════

const GEO_EPS = 1e-9;
let geoObjs = [];            // alle Objekte in Abhängigkeits-Reihenfolge
let geoSeq = 0;              // Zähler für neue IDs
let geoVals = Object.create(null);   // id → berechneter Wert (oder null)

const GEO_FILE_VERSION = 1;

// ── kleine Vektor-Mathematik ────────────────────────────────────────
const G2 = {
  sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
  mul: (a, k) => ({ x: a.x * k, y: a.y * k }),
  dot: (a, b) => a.x * b.x + a.y * b.y,
  cross: (a, b) => a.x * b.y - a.y * b.x,
  len: a => Math.hypot(a.x, a.y),
  dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  mid: (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }),
  rot90: a => ({ x: -a.y, y: a.x }),
  unit(a) { const l = Math.hypot(a.x, a.y); return l < GEO_EPS ? null : { x: a.x / l, y: a.y / l }; },
  pt: (x, y) => ({ k: 'pt', x, y })
};
const geoIsLine = v => !!v && (v.k === 'line' || v.k === 'seg' || v.k === 'ray');
const geoIsCurve = v => !!v && (v.k === 'circ' || v.k === 'ell');
const geoFin = (...xs) => xs.every(Number.isFinite);

// ═══════════════════════════════════════════════════════════════════
// SCHNITTE
// ═══════════════════════════════════════════════════════════════════

// Teilt ein Objekt in einfache Bausteine (Vieleck → Kanten, Vektor → Strecke).
function geoPrims(v) {
  if (!v) return [];
  if (v.k === 'poly') {
    const r = [], n = v.pts.length;
    for (let i = 0; i < n; i++) r.push({ k: 'seg', A: v.pts[i], B: v.pts[(i + 1) % n] });
    return r;
  }
  if (v.k === 'vec') return [{ k: 'seg', A: v.A, B: v.B }];
  if (geoIsLine(v) || geoIsCurve(v)) return [v];
  return [];
}

// Parameter-Bereich: Gerade unbegrenzt, Strahl t≥0, Strecke 0≤t≤1 (t bezieht sich auf B−A).
function geoInRange(kind, t) {
  const e = 1e-9;
  if (kind === 'seg') return t >= -e && t <= 1 + e;
  if (kind === 'ray') return t >= -e;
  return true;
}

function geoLineLine(L1, L2) {
  const d1 = G2.sub(L1.B, L1.A), d2 = G2.sub(L2.B, L2.A);
  const den = G2.cross(d1, d2), sc = G2.len(d1) * G2.len(d2);
  if (sc < GEO_EPS || Math.abs(den) < 1e-12 * sc) return [];
  const w = G2.sub(L2.A, L1.A);
  const t = G2.cross(w, d2) / den, s = G2.cross(w, d1) / den;
  if (!geoInRange(L1.k, t) || !geoInRange(L2.k, s)) return [];
  return [G2.add(L1.A, G2.mul(d1, t))];
}

// Wurzeln einer quadratischen Gleichung a·t²+b·t+c=0, aufsteigend sortiert.
function geoQuad(a, b, c) {
  if (Math.abs(a) < 1e-14) return Math.abs(b) < 1e-14 ? [] : [-c / b];
  let disc = b * b - 4 * a * c;
  const sc = b * b + Math.abs(4 * a * c);
  if (disc < 0) { if (disc > -1e-12 * sc) disc = 0; else return []; }
  if (disc <= 1e-12 * sc) return [-b / (2 * a)];
  const s = Math.sqrt(disc);
  const q = -0.5 * (b + (b >= 0 ? s : -s));
  const r1 = q / a, r2 = q !== 0 ? c / q : r1;
  return r1 < r2 ? [r1, r2] : [r2, r1];
}

function geoLineCircle(L, Ci) {
  const d = G2.sub(L.B, L.A), f = G2.sub(L.A, { x: Ci.cx, y: Ci.cy });
  const ts = geoQuad(G2.dot(d, d), 2 * G2.dot(d, f), G2.dot(f, f) - Ci.r * Ci.r);
  return ts.filter(t => geoInRange(L.k, t)).map(t => G2.add(L.A, G2.mul(d, t)));
}

// Koordinaten im Ellipsen-System (Mittelpunkt im Ursprung, Hauptachse = x).
function geoToLocal(E, p) {
  const c = Math.cos(E.phi), s = Math.sin(E.phi), dx = p.x - E.cx, dy = p.y - E.cy;
  return { x: dx * c + dy * s, y: -dx * s + dy * c };
}
function geoFromLocal(E, q) {
  const c = Math.cos(E.phi), s = Math.sin(E.phi);
  return { x: E.cx + q.x * c - q.y * s, y: E.cy + q.x * s + q.y * c };
}

function geoLineEllipse(L, E) {
  const A = geoToLocal(E, L.A), B = geoToLocal(E, L.B);
  const d = G2.sub(B, A), a2 = E.a * E.a, b2 = E.b * E.b;
  const ts = geoQuad(d.x * d.x / a2 + d.y * d.y / b2,
    2 * (A.x * d.x / a2 + A.y * d.y / b2),
    A.x * A.x / a2 + A.y * A.y / b2 - 1);
  const dd = G2.sub(L.B, L.A);
  return ts.filter(t => geoInRange(L.k, t)).map(t => G2.add(L.A, G2.mul(dd, t)));
}

function geoCircleCircle(C1, C2) {
  const c1 = { x: C1.cx, y: C1.cy }, c2 = { x: C2.cx, y: C2.cy };
  const dv = G2.sub(c2, c1), d = G2.len(dv);
  if (d < GEO_EPS) return [];
  const tol = 1e-9 * Math.max(1, C1.r + C2.r);
  if (d > C1.r + C2.r + tol || d < Math.abs(C1.r - C2.r) - tol) return [];
  const a = (C1.r * C1.r - C2.r * C2.r + d * d) / (2 * d);
  const h2 = C1.r * C1.r - a * a;
  const e = { x: dv.x / d, y: dv.y / d }, base = G2.add(c1, G2.mul(e, a));
  const h = Math.sqrt(Math.max(0, h2));
  if (h < 1e-7 * Math.max(1, C1.r)) return [base];
  const n = G2.rot90(e);
  return [G2.add(base, G2.mul(n, h)), G2.sub(base, G2.mul(n, h))];   // links, rechts von c1→c2
}

// Punkt einer Kurve (Kreis/Ellipse) zum Parameter u, und die implizite Funktion F (0 = auf der Kurve).
function geoCurvePoint(K, u) {
  return K.k === 'circ' ? { x: K.cx + K.r * Math.cos(u), y: K.cy + K.r * Math.sin(u) }
    : geoFromLocal(K, { x: K.a * Math.cos(u), y: K.b * Math.sin(u) });
}
function geoCurveImplicit(K, p) {
  if (K.k === 'circ') return Math.hypot(p.x - K.cx, p.y - K.cy) - K.r;
  const q = geoToLocal(K, p);
  return Math.sqrt(q.x * q.x / (K.a * K.a) + q.y * q.y / (K.b * K.b)) - 1;
}

// Kreis/Ellipse mit Kreis/Ellipse: numerisch (Vorzeichenwechsel + Bisektion).
function geoCurveCurve(K1, K2) {
  const N = 720, res = [];
  let prevU = 0, prevF = geoCurveImplicit(K2, geoCurvePoint(K1, 0));
  for (let i = 1; i <= N; i++) {
    const u = i / N * 2 * Math.PI, f = geoCurveImplicit(K2, geoCurvePoint(K1, u));
    if (prevF === 0 || (prevF < 0) !== (f < 0)) {
      let lo = prevU, hi = u, flo = prevF;
      for (let it = 0; it < 60; it++) {
        const mi = (lo + hi) / 2, fm = geoCurveImplicit(K2, geoCurvePoint(K1, mi));
        if ((flo < 0) === (fm < 0)) { lo = mi; flo = fm; } else hi = mi;
      }
      const p = geoCurvePoint(K1, (lo + hi) / 2);
      if (!res.some(q => G2.dist(p, q) < 1e-7)) res.push(p);
    }
    prevU = u; prevF = f;
  }
  return res;
}

function geoPairIntersect(a, b) {
  const la = geoIsLine(a), lb = geoIsLine(b);
  if (la && lb) return geoLineLine(a, b);
  if (lb && !la) return geoPairIntersect(b, a);
  if (la) return b.k === 'circ' ? geoLineCircle(a, b) : geoLineEllipse(a, b);
  if (a.k === 'circ' && b.k === 'circ') return geoCircleCircle(a, b);
  return geoCurveCurve(a, b);
}

// Alle Schnittpunkte zweier Objekte (Vielecke/Vektoren werden in Kanten zerlegt).
function geoIntersections(v1, v2) {
  const res = [];
  for (const a of geoPrims(v1)) for (const b of geoPrims(v2)) {
    for (const p of geoPairIntersect(a, b)) {
      if (geoFin(p.x, p.y) && !res.some(q => G2.dist(p, q) < 1e-7)) res.push(G2.pt(p.x, p.y));
    }
  }
  return res;
}

// ═══════════════════════════════════════════════════════════════════
// BESONDERE PUNKTE / KREISE / TANGENTEN
// ═══════════════════════════════════════════════════════════════════

function geoCircumcenter(A, B, C) {
  const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
  const sc = Math.max(1, G2.len(G2.sub(B, A)) * G2.len(G2.sub(C, A)));
  if (Math.abs(d) < 1e-12 * sc) return null;
  const a2 = A.x * A.x + A.y * A.y, b2 = B.x * B.x + B.y * B.y, c2 = C.x * C.x + C.y * C.y;
  return G2.pt((a2 * (B.y - C.y) + b2 * (C.y - A.y) + c2 * (A.y - B.y)) / d,
               (a2 * (C.x - B.x) + b2 * (A.x - C.x) + c2 * (B.x - A.x)) / d);
}
function geoIncenter(A, B, C) {
  const a = G2.dist(B, C), b = G2.dist(C, A), c = G2.dist(A, B), s = a + b + c;
  if (s < GEO_EPS || Math.abs(G2.cross(G2.sub(B, A), G2.sub(C, A))) < 1e-12 * Math.max(1, b * c)) return null;
  return { p: G2.pt((a * A.x + b * B.x + c * C.x) / s, (a * A.y + b * B.y + c * C.y) / s),
           r: Math.abs(G2.cross(G2.sub(B, A), G2.sub(C, A))) / s };
}

// Tangenten an einen Kreis/eine Ellipse durch den Punkt P. Rückgabe: Liste von Geraden-Werten.
function geoTangents(P, K) {
  if (K.k === 'circ') {
    const c = { x: K.cx, y: K.cy }, d = G2.dist(P, c), tol = 1e-7 * Math.max(1, K.r);
    if (Math.abs(d - K.r) <= tol) {                     // P liegt auf dem Kreis
      const n = G2.unit(G2.sub(P, c)); if (!n) return [];
      return [{ k: 'line', A: P, B: G2.add(P, G2.rot90(n)) }];
    }
    if (d < K.r) return [];                             // innen: keine Tangente
    const th = Math.atan2(P.y - c.y, P.x - c.x), al = Math.acos(Math.min(1, K.r / d));
    return [th + al, th - al].map(w => {
      const T = G2.pt(c.x + K.r * Math.cos(w), c.y + K.r * Math.sin(w));
      return { k: 'line', A: P, B: T };
    });
  }
  // Ellipse: nur Tangente in einem Punkt der Ellipse
  const q = geoToLocal(K, P);
  const f = Math.sqrt(q.x * q.x / (K.a * K.a) + q.y * q.y / (K.b * K.b));
  if (Math.abs(f - 1) > 1e-6) return [];
  const gl = { x: q.x / (K.a * K.a), y: q.y / (K.b * K.b) };      // Normale (lokal)
  const dl = G2.rot90(G2.unit(gl));
  const c = Math.cos(K.phi), s = Math.sin(K.phi);
  const dir = { x: dl.x * c - dl.y * s, y: dl.x * s + dl.y * c };
  return [{ k: 'line', A: P, B: G2.add(P, dir) }];
}

// Parameter eines Punktes p auf dem Wirtsobjekt (für «Punkt auf Objekt» beim Ziehen).
function geoProjectParam(host, p) {
  if (!host) return 0;
  if (geoIsLine(host) || host.k === 'vec') {
    const d = G2.sub(host.B, host.A), dd = G2.dot(d, d);
    let t = dd < GEO_EPS ? 0 : G2.dot(G2.sub(p, host.A), d) / dd;
    if (host.k === 'seg' || host.k === 'vec') t = Math.max(0, Math.min(1, t));
    else if (host.k === 'ray') t = Math.max(0, t);
    return t;
  }
  if (host.k === 'circ') return Math.atan2(p.y - host.cy, p.x - host.cx);
  if (host.k === 'ell') { const q = geoToLocal(host, p); return Math.atan2(q.y / host.b, q.x / host.a); }
  if (host.k === 'poly') {                               // nächste Kante, Parameter = Kante + Anteil
    const n = host.pts.length; let best = Infinity, res = 0;
    for (let i = 0; i < n; i++) {
      const A = host.pts[i], B = host.pts[(i + 1) % n], d = G2.sub(B, A), dd = G2.dot(d, d);
      const t = dd < GEO_EPS ? 0 : Math.max(0, Math.min(1, G2.dot(G2.sub(p, A), d) / dd));
      const q = G2.add(A, G2.mul(d, t)), dist = G2.dist(p, q);
      if (dist < best - 1e-12) { best = dist; res = i + t; }
    }
    return res;
  }
  return 0;
}
function geoPointOn(host, t) {
  if (geoIsLine(host) || host.k === 'vec') {
    if (host.k === 'seg' || host.k === 'vec') t = Math.max(0, Math.min(1, t));
    else if (host.k === 'ray') t = Math.max(0, t);
    return G2.add(host.A, G2.mul(G2.sub(host.B, host.A), t));
  }
  if (host.k === 'circ' || host.k === 'ell') return geoCurvePoint(host, t);
  if (host.k === 'poly') {
    const n = host.pts.length, fl = Math.floor(t), i = ((fl % n) + n) % n, f = t - fl;
    const A = host.pts[i], B = host.pts[(i + 1) % n];
    return G2.add(A, G2.mul(G2.sub(B, A), f));
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// ABBILDUNGEN (Achsen-/Punktspiegelung, Drehung, Verschiebung, Streckung)
// ═══════════════════════════════════════════════════════════════════

// Matrix {a,b,c,d,e,f}: (x,y) → (a·x+b·y+e, c·x+d·y+f)
function geoMatrix(kind, via, n) {
  if (kind === 'refl') {                       // via = Gerade
    const d = G2.unit(G2.sub(via.B, via.A)); if (!d) return null;
    const a = 2 * d.x * d.x - 1, b = 2 * d.x * d.y, c = b, dd = 2 * d.y * d.y - 1;
    return { a, b, c, d: dd, e: via.A.x - (a * via.A.x + b * via.A.y), f: via.A.y - (c * via.A.x + dd * via.A.y) };
  }
  if (kind === 'reflp') return geoMatrix('dil', via, -1);
  if (kind === 'rot') {                        // via = Punkt, n = Winkel in Grad (gegen den Uhrzeigersinn)
    const w = (Number(n) || 0) * Math.PI / 180, co = Math.cos(w), si = Math.sin(w);
    return { a: co, b: -si, c: si, d: co, e: via.x - (co * via.x - si * via.y), f: via.y - (si * via.x + co * via.y) };
  }
  if (kind === 'trans') {                      // via = Vektor
    return { a: 1, b: 0, c: 0, d: 1, e: via.B.x - via.A.x, f: via.B.y - via.A.y };
  }
  if (kind === 'dil') {                        // via = Punkt, n = Faktor
    const k = Number(n); if (!isFinite(k) || Math.abs(k) < 1e-9) return null;
    return { a: k, b: 0, c: 0, d: k, e: via.x * (1 - k), f: via.y * (1 - k) };
  }
  return null;
}
const geoApplyM = (M, p) => ({ x: M.a * p.x + M.b * p.y + M.e, y: M.c * p.x + M.d * p.y + M.f });

function geoMapVal(v, M) {
  const P = p => { const q = geoApplyM(M, p); return G2.pt(q.x, q.y); };
  const s = Math.sqrt(Math.abs(M.a * M.d - M.b * M.c));
  switch (v.k) {
    case 'pt': return P(v);
    case 'line': case 'seg': case 'ray': return { k: v.k, A: P(v.A), B: P(v.B) };
    case 'vec': return { k: 'vec', A: P(v.A), B: P(v.B) };
    case 'circ': { const c = P({ x: v.cx, y: v.cy }); return { k: 'circ', cx: c.x, cy: c.y, r: v.r * s }; }
    case 'ell': {
      const c = P({ x: v.cx, y: v.cy });
      const ca = Math.cos(v.phi), sa = Math.sin(v.phi);
      const phi = Math.atan2(M.c * ca + M.d * sa, M.a * ca + M.b * sa);
      return { k: 'ell', cx: c.x, cy: c.y, a: v.a * s, b: v.b * s, phi, F1: P(v.F1), F2: P(v.F2) };
    }
    case 'poly': return geoMakePoly(v.pts.map(P));
    case 'ang': return { k: 'ang', A: P(v.A), B: P(v.B), C: P(v.C), val: v.val };
    default: return null;
  }
}

function geoMakePoly(pts) {
  let ar = 0, per = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    ar += a.x * b.y - b.x * a.y; per += G2.dist(a, b);
  }
  return { k: 'poly', pts, area: Math.abs(ar) / 2, signed: ar / 2, perim: per };
}

// ═══════════════════════════════════════════════════════════════════
// AUSWERTUNG EINES OBJEKTS
// ═══════════════════════════════════════════════════════════════════

function geoEvalObj(o, A) {
  const t = o.t;
  switch (t) {
    case 'pt': return geoFin(o.x, o.y) ? G2.pt(o.x, o.y) : null;
    case 'pton': { const p = geoPointOn(A[0], o.n || 0); return p && geoFin(p.x, p.y) ? G2.pt(p.x, p.y) : null; }
    case 'mid': return G2.pt((A[0].x + A[1].x) / 2, (A[0].y + A[1].y) / 2);
    case 'inter': { const r = geoIntersections(A[0], A[1]); return r[o.n || 0] || null; }
    case 'foot': {
      const L = A[0], d = G2.sub(A[1].B, A[1].A), dd = G2.dot(d, d);
      if (dd < GEO_EPS) return null;
      const tt = G2.dot(G2.sub(L, A[1].A), d) / dd; const p = G2.add(A[1].A, G2.mul(d, tt));
      return G2.pt(p.x, p.y);
    }
    case 'ctr': {
      const [P, Q, R] = A;
      if (o.k === 'centroid') return G2.pt((P.x + Q.x + R.x) / 3, (P.y + Q.y + R.y) / 3);
      if (o.k === 'circum') return geoCircumcenter(P, Q, R);
      if (o.k === 'incenter') { const r = geoIncenter(P, Q, R); return r && r.p; }
      if (o.k === 'ortho') { const U = geoCircumcenter(P, Q, R); return U && G2.pt(P.x + Q.x + R.x - 2 * U.x, P.y + Q.y + R.y - 2 * U.y); }
      return null;
    }
    case 'seg': case 'line': case 'ray':
      return G2.dist(A[0], A[1]) < GEO_EPS ? null : { k: t, A: G2.pt(A[0].x, A[0].y), B: G2.pt(A[1].x, A[1].y) };
    case 'perpl': case 'parl': {
      const d = G2.unit(G2.sub(A[1].B, A[1].A)); if (!d) return null;
      const dir = t === 'perpl' ? G2.rot90(d) : d;
      return { k: 'line', A: G2.pt(A[0].x, A[0].y), B: G2.pt(A[0].x + dir.x, A[0].y + dir.y) };
    }
    case 'pbis': {
      const d = G2.unit(G2.sub(A[1], A[0])); if (!d) return null;
      const M = G2.mid(A[0], A[1]), n = G2.rot90(d);
      return { k: 'line', A: G2.pt(M.x, M.y), B: G2.pt(M.x + n.x, M.y + n.y) };
    }
    case 'abis': {
      const u1 = G2.unit(G2.sub(A[0], A[1])), u2 = G2.unit(G2.sub(A[2], A[1])); if (!u1 || !u2) return null;
      let s = G2.add(u1, u2); if (G2.len(s) < 1e-9) s = G2.rot90(u1);
      s = G2.unit(s);
      return { k: 'line', A: G2.pt(A[1].x, A[1].y), B: G2.pt(A[1].x + s.x, A[1].y + s.y) };
    }
    case 'tang': { const r = geoTangents(A[0], A[1]); return r[o.n || 0] || null; }
    case 'circ': { const r = G2.dist(A[0], A[1]); return r < GEO_EPS ? null : { k: 'circ', cx: A[0].x, cy: A[0].y, r }; }
    case 'circr': return o.n > GEO_EPS ? { k: 'circ', cx: A[0].x, cy: A[0].y, r: o.n } : null;
    case 'circd': { const r = G2.dist(A[0], A[1]) / 2; const M = G2.mid(A[0], A[1]); return r < GEO_EPS ? null : { k: 'circ', cx: M.x, cy: M.y, r }; }
    case 'circ3': { const U = geoCircumcenter(A[0], A[1], A[2]); return U ? { k: 'circ', cx: U.x, cy: U.y, r: G2.dist(U, A[0]) } : null; }
    case 'incirc': { const r = geoIncenter(A[0], A[1], A[2]); return r ? { k: 'circ', cx: r.p.x, cy: r.p.y, r: r.r } : null; }
    case 'ellf': {
      const c = G2.dist(A[0], A[1]) / 2, a = (G2.dist(A[2], A[0]) + G2.dist(A[2], A[1])) / 2;
      if (a <= c + 1e-9) return null;
      const M = G2.mid(A[0], A[1]), phi = Math.atan2(A[1].y - A[0].y, A[1].x - A[0].x);
      return { k: 'ell', cx: M.x, cy: M.y, a, b: Math.sqrt(a * a - c * c), phi, F1: G2.pt(A[0].x, A[0].y), F2: G2.pt(A[1].x, A[1].y) };
    }
    case 'ella': {
      const [a, b, ph] = o.n || [3, 2, 0];
      if (!(a > GEO_EPS && b > GEO_EPS)) return null;
      const phi = (ph || 0) * Math.PI / 180, big = Math.max(a, b), c = Math.sqrt(big * big - Math.min(a, b) ** 2);
      const ax = a >= b ? { x: Math.cos(phi), y: Math.sin(phi) } : { x: -Math.sin(phi), y: Math.cos(phi) };
      return { k: 'ell', cx: A[0].x, cy: A[0].y, a, b, phi,
        F1: G2.pt(A[0].x - c * ax.x, A[0].y - c * ax.y), F2: G2.pt(A[0].x + c * ax.x, A[0].y + c * ax.y) };
    }
    case 'poly': return A.length >= 3 ? geoMakePoly(A.map(p => G2.pt(p.x, p.y))) : null;
    case 'ang': {
      const u = G2.unit(G2.sub(A[0], A[1])), v = G2.unit(G2.sub(A[2], A[1])); if (!u || !v) return null;
      return { k: 'ang', A: G2.pt(A[0].x, A[0].y), B: G2.pt(A[1].x, A[1].y), C: G2.pt(A[2].x, A[2].y),
               val: Math.acos(Math.max(-1, Math.min(1, G2.dot(u, v)))) };
    }
    case 'vec': return { k: 'vec', A: G2.pt(A[0].x, A[0].y), B: G2.pt(A[1].x, A[1].y) };
    case 'vadd': case 'vsub': {
      const u = G2.sub(A[0].B, A[0].A), w = G2.sub(A[1].B, A[1].A), s = t === 'vadd' ? 1 : -1;
      return { k: 'vec', A: A[0].A, B: G2.pt(A[0].A.x + u.x + s * w.x, A[0].A.y + u.y + s * w.y), from: A[0], via: A[1], sgn: s };
    }
    case 'vscale': {
      const k = o.n, u = G2.sub(A[0].B, A[0].A);
      return { k: 'vec', A: A[0].A, B: G2.pt(A[0].A.x + k * u.x, A[0].A.y + k * u.y) };
    }
    case 'vproj': {
      const u = G2.sub(A[0].B, A[0].A), w = G2.sub(A[1].B, A[1].A), ww = G2.dot(w, w);
      if (ww < GEO_EPS) return null;
      const f = G2.dot(u, w) / ww;
      return { k: 'vec', A: A[0].A, B: G2.pt(A[0].A.x + f * w.x, A[0].A.y + f * w.y) };
    }
    case 'dot': {
      const u = G2.sub(A[0].B, A[0].A), w = G2.sub(A[1].B, A[1].A), lu = G2.len(u), lw = G2.len(w);
      const d = G2.dot(u, w);
      const ok = lu > GEO_EPS && lw > GEO_EPS;
      const cs = ok ? Math.max(-1, Math.min(1, d / (lu * lw))) : null;
      return { k: 'dot', u, v: w, dot: d, lu, lv: lw, ang: ok ? Math.acos(cs) : null, perp: ok ? Math.abs(cs) < 1e-6 : Math.abs(d) < 1e-9 };
    }
    case 'msum': {
      let sum = 0, unit = null;
      for (const v of A) {
        let m;
        if (v.k === 'seg') m = G2.dist(v.A, v.B);
        else if (v.k === 'vec') m = G2.dist(v.A, v.B);
        else if (v.k === 'ang') m = v.val * 180 / Math.PI;
        else if (v.k === 'poly') m = v.area;
        else if (v.k === 'circ') m = v.r;
        else if (v.k === 'num') m = v.v;
        else return null;
        const u = v.k === 'ang' ? '°' : v.k === 'poly' ? 'FE' : '';
        if (unit === null) unit = u; else if (unit !== u) unit = '';
        sum += m;
      }
      return { k: 'num', v: sum, unit: unit || '' };
    }
    case 'xf': {
      const M = geoMatrix(o.k, A[1], o.n); if (!M) return null;
      return geoMapVal(A[0], M);
    }
    default: return null;
  }
}

// Erwartete Anzahl Argumente je Typ (null = beliebig/variabel).
const GEO_ARITY = { pt: 0, pton: 1, mid: 2, inter: 2, foot: 2, ctr: 3, seg: 2, line: 2, ray: 2, perpl: 2, parl: 2,
  pbis: 2, abis: 3, tang: 2, circ: 2, circr: 1, circd: 2, circ3: 3, incirc: 3, ellf: 3, ella: 1, poly: null, ang: 3,
  vec: 2, vadd: 2, vsub: 2, vscale: 1, vproj: 2, dot: 2, msum: null, xf: 2 };

// ═══════════════════════════════════════════════════════════════════
// LISTE VERWALTEN
// ═══════════════════════════════════════════════════════════════════

function geoRecompute() {
  const V = Object.create(null);
  for (const o of geoObjs) {
    let val = null;
    try {
      const A = o.a.map(id => V[id]);
      if (A.every(v => v)) {
        val = geoEvalObj(o, A);
        if (val && val.k === 'pt' && !geoFin(val.x, val.y)) val = null;
      }
    } catch (e) { val = null; }
    V[o.id] = val;
  }
  geoVals = V;
  return V;
}
function geoReset() { geoObjs = []; geoSeq = 0; geoVals = Object.create(null); }
function geoGet(id) { return geoObjs.find(o => o.id === id) || null; }
function geoVal(id) { return geoVals[id] || null; }
function geoGetVals() { return geoVals; }
function geoAll() { return geoObjs; }

// Namen vergeben: Punkte A, B, C …; Vektoren u, v, w …; Geraden a, b, c …; Kreise k, l, m …
const GEO_NAMESETS = {
  P: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  V: ['u', 'v', 'w', 's', 't', 'p', 'q', 'r'],
  L: 'abcdefghij'.split(''),
  K: ['k', 'l', 'm', 'n', 'o', 'q', 'r']
};
function geoNameClass(t, k) {
  if (['pt', 'pton', 'mid', 'inter', 'foot', 'ctr'].includes(t)) return 'P';
  if (['vec', 'vadd', 'vsub', 'vscale', 'vproj'].includes(t)) return 'V';
  if (['circ', 'circr', 'circd', 'circ3', 'incirc', 'ellf', 'ella'].includes(t)) return 'K';
  return 'L';
}
function geoFreeName(cls) {
  const used = new Set(geoObjs.map(o => o.name));
  const set = GEO_NAMESETS[cls];
  for (let r = 0; r < 100; r++) for (const c of set) {
    const nm = r === 0 ? c : c + r;
    if (!used.has(nm)) return nm;
  }
  return '?';
}

const GEO_COLORS = { pt: '#2563eb', der: '#7c3aed', line: '#0f766e', aux: '#64748b', circ: '#b45309', poly: '#1d4ed8',
  vec: '#dc2626', ang: '#ca8a04', img: '#059669', num: '#475569' };
function geoDefaultColor(t, aux) {
  if (aux) return GEO_COLORS.aux;
  if (t === 'pt' || t === 'pton') return GEO_COLORS.pt;
  if (['mid', 'inter', 'foot', 'ctr'].includes(t)) return GEO_COLORS.der;
  if (['circ', 'circr', 'circd', 'circ3', 'incirc', 'ellf', 'ella'].includes(t)) return GEO_COLORS.circ;
  if (t === 'poly') return GEO_COLORS.poly;
  if (['vec', 'vadd', 'vsub', 'vscale', 'vproj'].includes(t)) return GEO_COLORS.vec;
  if (t === 'ang') return GEO_COLORS.ang;
  if (t === 'xf') return GEO_COLORS.img;
  if (t === 'dot' || t === 'msum') return GEO_COLORS.num;
  return GEO_COLORS.line;
}

// Neues Objekt anlegen. opts: x,y,n,k,name,color,vis,lbl,aux,fill,stroke,fixed.
function geoAdd(t, args, opts) {
  opts = opts || {};
  const a = (args || []).slice();
  if (!(t in GEO_ARITY)) return null;
  if (GEO_ARITY[t] !== null && a.length !== GEO_ARITY[t]) return null;
  if (a.some(id => !geoGet(id))) return null;
  const id = 'g' + (++geoSeq);
  const o = { id, t, a, name: opts.name !== undefined ? opts.name : geoFreeName(geoNameClass(t)),
    color: opts.color || geoDefaultColor(t, opts.aux), vis: opts.vis !== false, lbl: opts.lbl !== false };
  if (t === 'pt') { o.x = opts.x || 0; o.y = opts.y || 0; }
  if (opts.n !== undefined) o.n = opts.n;
  if (opts.k !== undefined) o.k = opts.k;
  if (opts.aux) o.aux = true;
  if (opts.fixed) o.fixed = true;
  if (opts.fill !== undefined) o.fill = opts.fill;
  if (opts.stroke !== undefined) o.stroke = opts.stroke;
  if (opts.hideName) o.lbl = false;
  geoObjs.push(o);
  geoRecompute();
  return id;
}
const geoAddPoint = (x, y, opts) => geoAdd('pt', [], Object.assign({}, opts, { x, y }));

// Alle Objekte, die (direkt oder indirekt) von id abhängen.
function geoDependents(id) {
  const dep = new Set([id]);
  let grow = true;
  while (grow) {
    grow = false;
    for (const o of geoObjs) if (!dep.has(o.id) && o.a.some(x => dep.has(x))) { dep.add(o.id); grow = true; }
  }
  dep.delete(id);
  return dep;
}
// Löscht das Objekt samt allem, was davon abhängt. Rückgabe: Anzahl gelöschter Objekte.
function geoRemove(id) {
  if (!geoGet(id)) return 0;
  const dep = geoDependents(id); dep.add(id);
  const before = geoObjs.length;
  geoObjs = geoObjs.filter(o => !dep.has(o.id));
  geoRecompute();
  return before - geoObjs.length;
}
// Freie, bewegliche Punkte, aus denen id entsteht (für «ganzes Objekt verschieben»).
function geoFreeRoots(id) {
  const out = new Set(), seen = new Set();
  (function walk(i) {
    if (seen.has(i)) return; seen.add(i);
    const o = geoGet(i); if (!o) return;
    if (o.t === 'pt') { if (!o.fixed) out.add(i); return; }
    o.a.forEach(walk);
  })(id);
  return [...out];
}
function geoCapture() { return JSON.parse(JSON.stringify({ v: GEO_FILE_VERSION, seq: geoSeq, objs: geoObjs })); }
function geoApply(s) {
  if (!s || !Array.isArray(s.objs)) { geoReset(); return; }
  const sc = JSON.parse(JSON.stringify(s));
  geoObjs = sc.objs.filter(o => o && o.id && o.t in GEO_ARITY && Array.isArray(o.a));
  geoSeq = Math.max(sc.seq || 0, ...geoObjs.map(o => parseInt(String(o.id).slice(1), 10) || 0), 0);
  geoRecompute();
}

// ═══════════════════════════════════════════════════════════════════
// TEXTE (Zahlen, Gleichungen, Beschreibung für die Objektliste)
// ═══════════════════════════════════════════════════════════════════

function geoNum(v, d) {
  if (v === null || v === undefined || !isFinite(v)) return '–';
  d = d === undefined ? 2 : d;
  let s = (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
  if (s === '-0') s = '0';
  return s.replace('-', '−');
}
const geoDeg = r => r * 180 / Math.PI;

function geoLineEq(L) {
  const dx = L.B.x - L.A.x, dy = L.B.y - L.A.y;
  if (Math.abs(dx) < 1e-9 * Math.max(1, Math.abs(dy))) return 'x = ' + geoNum(L.A.x);
  const m = dy / dx, q = L.A.y - m * L.A.x;
  let s = 'y = ';
  const mm = Math.abs(m);
  if (mm < 1e-9) return s + geoNum(q);
  s += (m < 0 ? '−' : '') + (Math.abs(mm - 1) < 1e-9 ? '' : geoNum(mm)) + 'x';
  if (Math.abs(q) > 5e-3) s += (q < 0 ? ' − ' : ' + ') + geoNum(Math.abs(q));
  return s;
}
function geoShiftTxt(v, c) {                      // (x − c)
  if (Math.abs(c) < 5e-3) return v;
  return '(' + v + (c < 0 ? ' + ' : ' − ') + geoNum(Math.abs(c)) + ')';
}
function geoCircEq(C) {
  return geoShiftTxt('x', C.cx) + '² + ' + geoShiftTxt('y', C.cy) + '² = ' + geoNum(C.r * C.r);
}
function geoEllEq(E) {
  const q = ((E.phi % Math.PI) + Math.PI) % Math.PI;
  const axisAligned = q < 1e-6 || Math.abs(q - Math.PI) < 1e-6 || Math.abs(q - Math.PI / 2) < 1e-6;
  if (!axisAligned) return 'φ = ' + geoNum(geoDeg(E.phi)) + '°';
  const sw = Math.abs(q - Math.PI / 2) < 1e-6, a = sw ? E.b : E.a, b = sw ? E.a : E.b;
  return geoShiftTxt('x', E.cx) + '²/' + geoNum(a * a) + ' + ' + geoShiftTxt('y', E.cy) + '²/' + geoNum(b * b) + ' = 1';
}

const GEO_TYPE_DE = { pt: 'Punkt', pton: 'Punkt', mid: 'Mittelpunkt', inter: 'Schnittpunkt', foot: 'Lotfusspunkt', ctr: 'Punkt',
  seg: 'Strecke', line: 'Gerade', ray: 'Strahl', perpl: 'Lot', parl: 'Parallele', pbis: 'Mittelsenkrechte', abis: 'Winkelhalbierende',
  tang: 'Tangente', circ: 'Kreis', circr: 'Kreis', circd: 'Kreis', circ3: 'Umkreis', incirc: 'Inkreis', ellf: 'Ellipse', ella: 'Ellipse',
  poly: 'Vieleck', ang: 'Winkel', vec: 'Vektor', vadd: 'Vektor', vsub: 'Vektor', vscale: 'Vektor', vproj: 'Projektion',
  dot: 'Skalarprodukt', msum: 'Summe', xf: 'Bild' };
const GEO_CTR_DE = { centroid: 'Schwerpunkt', circum: 'Umkreismittelpunkt', incenter: 'Inkreismittelpunkt', ortho: 'Höhenschnittpunkt' };
const GEO_XF_DE = { refl: 'Spiegelung an Gerade', reflp: 'Punktspiegelung', rot: 'Drehung', trans: 'Verschiebung', dil: 'Streckung' };

function geoTypeLabel(o) {
  if (o.t === 'ctr') return GEO_CTR_DE[o.k] || 'Punkt';
  if (o.t === 'xf') return GEO_XF_DE[o.k] || 'Bild';
  return GEO_TYPE_DE[o.t] || o.t;
}
// Einzeilige Beschreibung mit den wichtigsten Werten (leer = Objekt ungültig).
function geoDescribe(o) {
  const v = geoVals[o.id];
  const nm = o.name;
  if (!v) return nm + ' = –';
  switch (v.k) {
    case 'pt': return nm + ' = (' + geoNum(v.x) + ' | ' + geoNum(v.y) + ')';
    case 'seg': return nm + ' = ' + geoNum(G2.dist(v.A, v.B));
    case 'line': return nm + ': ' + geoLineEq(v);
    case 'ray': return nm + ': ' + geoLineEq(v);
    case 'circ': return nm + ': ' + geoCircEq(v) + ',  r = ' + geoNum(v.r) + ',  U = ' + geoNum(2 * Math.PI * v.r) + ',  A = ' + geoNum(Math.PI * v.r * v.r);
    case 'ell': return nm + ': ' + geoEllEq(v) + ',  a = ' + geoNum(v.a) + ',  b = ' + geoNum(v.b) + ',  e = ' + geoNum(Math.sqrt(Math.abs(v.a * v.a - v.b * v.b)));
    case 'poly': return nm + ': A = ' + geoNum(v.area) + ',  U = ' + geoNum(v.perim);
    case 'vec': { const dx = v.B.x - v.A.x, dy = v.B.y - v.A.y; return nm + ' = (' + geoNum(dx) + ' | ' + geoNum(dy) + '),  |' + nm + '| = ' + geoNum(Math.hypot(dx, dy)); }
    case 'ang': return nm + ' = ' + geoNum(geoDeg(v.val)) + '°' + (Math.abs(geoDeg(v.val) - 90) < 1e-6 ? '  ∟' : '');
    case 'dot': return 'u·v = ' + geoNum(v.dot) + (v.ang !== null ? ',  ∠ ' + geoNum(geoDeg(v.ang)) + '°' : '') + (v.perp ? '  ⊥' : '');
    case 'num': return nm + ' = ' + geoNum(v.v) + (v.unit === '°' ? '°' : v.unit === 'FE' ? ' FE' : '');
  }
  return nm;
}

// Welche Zahlen eines Objekts lassen sich im Panel mit Schieber/Feld ändern?
// Rückgabe: [{key, label, min, max, step, get(o), set(o, v)}]
function geoNumSpecs(o) {
  switch (o.t) {
    case 'circr': return [{ key: 'r', label: 'r', min: 0.1, max: 20, step: 0.1, get: o => o.n, set: (o, v) => { o.n = v; } }];
    case 'ella': return [
      { key: 'a', label: 'a', min: 0.1, max: 20, step: 0.1, get: o => o.n[0], set: (o, v) => { o.n[0] = v; } },
      { key: 'b', label: 'b', min: 0.1, max: 20, step: 0.1, get: o => o.n[1], set: (o, v) => { o.n[1] = v; } },
      { key: 'phi', label: 'φ°', min: -180, max: 180, step: 1, get: o => o.n[2], set: (o, v) => { o.n[2] = v; } }];
    case 'vscale': return [{ key: 'k', label: 'k', min: -5, max: 5, step: 0.1, get: o => o.n, set: (o, v) => { o.n = v; } }];
    case 'xf':
      if (o.k === 'rot') return [{ key: 'w', label: 'α°', min: -360, max: 360, step: 1, get: o => o.n, set: (o, v) => { o.n = v; } }];
      if (o.k === 'dil') return [{ key: 'k', label: 'k', min: -5, max: 5, step: 0.1, get: o => o.n, set: (o, v) => { o.n = v; } }];
      return [];
    case 'pton': {
      const h = geoVals[o.a[0]];
      if (h && (h.k === 'circ')) return [{ key: 't', label: 'α°', min: -180, max: 180, step: 1,
        get: o => geoDeg(o.n || 0), set: (o, v) => { o.n = v * Math.PI / 180; } }];
      if (h && (h.k === 'ell')) return [{ key: 't', label: 'u°', min: -180, max: 180, step: 1,
        get: o => geoDeg(o.n || 0), set: (o, v) => { o.n = v * Math.PI / 180; } }];
      if (h && (geoIsLine(h) || h.k === 'vec')) return [{ key: 't', label: 't', min: h.k === 'line' ? -3 : 0, max: h.k === 'line' ? 3 : (h.k === 'ray' ? 5 : 1), step: 0.01,
        get: o => o.n || 0, set: (o, v) => { o.n = v; } }];
      return [];
    }
  }
  return [];
}

// ═══════════════════════════════════════════════════════════════════
// VORLAGEN (fertige Figuren, bestehen aus normalen, frei veränderbaren Objekten)
// frame = {cx, cy, u}: Mitte und Einheit (u mathematische Einheiten pro «Vorlagen-Einheit»). Alle frei ziehbaren Vorlagenpunkte haben GERADE
// Koordinaten und u = halber Gitterschritt, so dass sie auf Gitterpunkten liegen (Gitter-Snapping)
// ═══════════════════════════════════════════════════════════════════

const GEO_PRESETS = [
  { id: 'tri', label: 'Dreieck mit Seiten und Winkeln' },
  { id: 'circum', label: 'Dreieck: Umkreis (Mittelsenkrechten)' },
  { id: 'alt', label: 'Dreieck: Höhen und Höhenschnittpunkt' },
  { id: 'median', label: 'Dreieck: Seitenhalbierende und Schwerpunkt' },
  { id: 'incirc', label: 'Dreieck: Winkelhalbierende und Inkreis' },
  { id: 'euler', label: 'Dreieck: Eulersche Gerade' },
  { id: 'thales', label: 'Satz des Thales' },
  { id: 'periph', label: 'Zentri- und Peripheriewinkel' },
  { id: 'tangent', label: 'Tangenten an einen Kreis' },
  { id: 'ellipse', label: 'Ellipse mit Brennpunkten' },
  { id: 'pyth', label: 'Satz des Pythagoras' },
  { id: 'vadd', label: 'Vektoraddition' },
  { id: 'vdot', label: 'Skalarprodukt und Projektion' },
  { id: 'mirror', label: 'Spiegelung eines Dreiecks' },
  { id: 'rotate', label: 'Drehung eines Dreiecks' },
  { id: 'dilate', label: 'Zentrische Streckung' }
];

function geoPreset(id, frame) {
  const f = frame || { cx: 0, cy: 0, u: 1 };
  const X = x => f.cx + x * f.u, Y = y => f.cy + y * f.u;
  const P = (x, y, nm, o) => geoAddPoint(X(x), Y(y), Object.assign({ name: nm }, o));
  const aux = { aux: true };
  const made = [];
  const rec = id2 => { made.push(id2); return id2; };
  const triangle = (A0, B0, C0) => {
    const A = rec(P(A0[0], A0[1], 'A')), B = rec(P(B0[0], B0[1], 'B')), C = rec(P(C0[0], C0[1], 'C'));
    const poly = rec(geoAdd('poly', [A, B, C], { name: 'ABC', stroke: false }));
    const sa = rec(geoAdd('seg', [B, C], { name: 'a' })), sb = rec(geoAdd('seg', [C, A], { name: 'b' })), sc = rec(geoAdd('seg', [A, B], { name: 'c' }));
    return { A, B, C, poly, sa, sb, sc };
  };
  const tri0 = [[-6, -4], [6, -4], [2, 4]];
  switch (id) {
    case 'tri': {
      const T = triangle(...tri0);
      const al = rec(geoAdd('ang', [T.B, T.A, T.C], { name: 'α' })), be = rec(geoAdd('ang', [T.C, T.B, T.A], { name: 'β' })), ga = rec(geoAdd('ang', [T.A, T.C, T.B], { name: 'γ' }));
      rec(geoAdd('msum', [al, be, ga], { name: 'α+β+γ' }));
      break;
    }
    case 'circum': {
      const T = triangle(...tri0);
      const m1 = rec(geoAdd('pbis', [T.A, T.B], aux)), m2 = rec(geoAdd('pbis', [T.B, T.C], aux)), m3 = rec(geoAdd('pbis', [T.C, T.A], aux));
      const U = rec(geoAdd('inter', [m1, m2], { n: 0, name: 'U' }));
      rec(geoAdd('circ3', [T.A, T.B, T.C], { name: 'k' }));
      break;
    }
    case 'alt': {
      const T = triangle(...tri0);
      const ha = rec(geoAdd('perpl', [T.A, T.sa], aux)), hb = rec(geoAdd('perpl', [T.B, T.sb], aux)), hc = rec(geoAdd('perpl', [T.C, T.sc], aux));
      rec(geoAdd('inter', [ha, hb], { n: 0, name: 'H' }));
      break;
    }
    case 'median': {
      const T = triangle(...tri0);
      const Ma = rec(geoAdd('mid', [T.B, T.C], { name: 'Ma' })), Mb = rec(geoAdd('mid', [T.C, T.A], { name: 'Mb' })), Mc = rec(geoAdd('mid', [T.A, T.B], { name: 'Mc' }));
      rec(geoAdd('seg', [T.A, Ma], { aux: true, name: 'sa' })); rec(geoAdd('seg', [T.B, Mb], { aux: true, name: 'sb' })); rec(geoAdd('seg', [T.C, Mc], { aux: true, name: 'sc' }));
      rec(geoAdd('ctr', [T.A, T.B, T.C], { k: 'centroid', name: 'S' }));
      break;
    }
    case 'incirc': {
      const T = triangle(...tri0);
      rec(geoAdd('abis', [T.B, T.A, T.C], aux)); rec(geoAdd('abis', [T.C, T.B, T.A], aux)); rec(geoAdd('abis', [T.A, T.C, T.B], aux));
      rec(geoAdd('ctr', [T.A, T.B, T.C], { k: 'incenter', name: 'I' }));
      rec(geoAdd('incirc', [T.A, T.B, T.C], { name: 'k' }));
      break;
    }
    case 'euler': {
      const T = triangle(...tri0);
      const U = rec(geoAdd('ctr', [T.A, T.B, T.C], { k: 'circum', name: 'U' })), S = rec(geoAdd('ctr', [T.A, T.B, T.C], { k: 'centroid', name: 'S' }));
      const H = rec(geoAdd('ctr', [T.A, T.B, T.C], { k: 'ortho', name: 'H' }));
      rec(geoAdd('line', [U, H], { name: 'e', color: '#be185d' }));
      rec(geoAdd('circ3', [T.A, T.B, T.C], { name: 'k', aux: true }));
      break;
    }
    case 'thales': {
      const A = rec(P(-6, 0, 'A')), B = rec(P(6, 0, 'B'));
      const k = rec(geoAdd('circd', [A, B], { name: 'k' }));
      const Pp = rec(geoAdd('pton', [k], { n: 1.15, name: 'C' }));
      rec(geoAdd('seg', [A, B], { name: 'c' })); rec(geoAdd('seg', [A, Pp], { name: 'b' })); rec(geoAdd('seg', [B, Pp], { name: 'a' }));
      rec(geoAdd('ang', [A, Pp, B], { name: 'γ' }));
      break;
    }
    case 'periph': {
      const M = rec(P(0, 0, 'M')), R = rec(P(6, 0, 'R', { aux: true }));
      const k = rec(geoAdd('circ', [M, R], { name: 'k' }));
      const A = rec(geoAdd('pton', [k], { n: -2 * Math.PI / 3, name: 'A' })), B = rec(geoAdd('pton', [k], { n: -Math.PI / 3, name: 'B' }));
      const Pp = rec(geoAdd('pton', [k], { n: Math.PI / 2, name: 'P' }));
      rec(geoAdd('seg', [M, A], { name: 'MA', aux: true })); rec(geoAdd('seg', [M, B], { name: 'MB', aux: true }));
      rec(geoAdd('seg', [Pp, A], { name: 'PA' })); rec(geoAdd('seg', [Pp, B], { name: 'PB' }));
      rec(geoAdd('ang', [A, M, B], { name: 'ω' })); rec(geoAdd('ang', [A, Pp, B], { name: 'φ' }));
      break;
    }
    case 'tangent': {
      const M = rec(P(-4, 0, 'M')), R = rec(P(0, 0, 'R', { aux: true }));
      const k = rec(geoAdd('circ', [M, R], { name: 'k' }));
      const Pp = rec(P(8, 4, 'P'));
      const t1 = rec(geoAdd('tang', [Pp, k], { n: 0, name: 't1' })), t2 = rec(geoAdd('tang', [Pp, k], { n: 1, name: 't2' }));
      const T1 = rec(geoAdd('inter', [t1, k], { n: 0, name: 'T1' })), T2 = rec(geoAdd('inter', [t2, k], { n: 0, name: 'T2' }));
      rec(geoAdd('seg', [M, T1], { aux: true, name: 'r1' })); rec(geoAdd('seg', [M, T2], { aux: true, name: 'r2' }));
      rec(geoAdd('ang', [M, T1, Pp], { name: 'α' }));
      break;
    }
    case 'ellipse': {
      const F1 = rec(P(-4, 0, 'F₁')), F2 = rec(P(4, 0, 'F₂')), Pp = rec(P(0, 4, 'S'));
      const e = rec(geoAdd('ellf', [F1, F2, Pp], { name: 'e' }));
      const Q = rec(geoAdd('pton', [e], { n: 0.8, name: 'Q' }));
      const s1 = rec(geoAdd('seg', [Q, F1], { name: 'r₁' })), s2 = rec(geoAdd('seg', [Q, F2], { name: 'r₂' }));
      rec(geoAdd('msum', [s1, s2], { name: 'r₁+r₂' }));
      rec(geoAdd('tang', [Q, e], { n: 0, name: 't', aux: true }));
      break;
    }
    case 'pyth': {
      // rechtwinkliges Dreieck, gegen den Uhrzeigersinn: C (rechter Winkel), A, B
      const C = rec(P(-2, -2, 'C')), A = rec(P(2, -2, 'A')), B = rec(P(-2, 0, 'B'));
      rec(geoAdd('poly', [C, A, B], { name: 'ABC' }));
      const sq = (p, q, nm) => {   // Quadrat nach aussen über p→q (Dreieck gegen den Uhrzeigersinn)
        const q2 = rec(geoAdd('xf', [p, q], { k: 'rot', n: 90, name: nm + '1', lbl: false })), p2 = rec(geoAdd('xf', [q, p], { k: 'rot', n: -90, name: nm + '2', lbl: false }));
        return rec(geoAdd('poly', [p, q, q2, p2], { name: nm, color: '#0f766e' }));
      };
      const s1 = sq(C, A, 'Q₁'), s2 = sq(A, B, 'Q₃'), s3 = sq(B, C, 'Q₂');
      rec(geoAdd('msum', [s1, s3], { name: 'Q₁+Q₂' }));
      break;
    }
    case 'vadd': {
      const O = rec(P(-4, -2, 'O')), A = rec(P(0, 2, 'A')), B = rec(P(2, -4, 'B'));
      const u = rec(geoAdd('vec', [O, A], { name: 'u' })), v = rec(geoAdd('vec', [O, B], { name: 'v' }));
      rec(geoAdd('vadd', [u, v], { name: 'u+v' }));
      break;
    }
    case 'vdot': {
      const O = rec(P(-4, -2, 'O')), A = rec(P(4, 2, 'A')), B = rec(P(2, -4, 'B'));
      const u = rec(geoAdd('vec', [O, A], { name: 'u' })), v = rec(geoAdd('vec', [O, B], { name: 'v' }));
      rec(geoAdd('dot', [u, v], { name: 'u·v' }));
      rec(geoAdd('vproj', [u, v], { name: 'u∥', color: '#d97706' }));
      break;
    }
    case 'mirror': {
      const T = triangle([-6, 0], [-2, 0], [-4, 4]);
      const G1 = rec(P(2, -4, 'G₁', aux)), G2_ = rec(P(2, 6, 'G₂', aux));
      const g = rec(geoAdd('line', [G1, G2_], { name: 'g', color: '#be185d' }));
      rec(geoAdd('xf', [T.poly, g], { k: 'refl', name: 'A′B′C′' }));
      break;
    }
    case 'rotate': {
      const T = triangle([-6, 0], [-2, 0], [-4, 4]);
      const Z = rec(P(2, -2, 'Z'));
      rec(geoAdd('xf', [T.poly, Z], { k: 'rot', n: 60, name: 'A′B′C′' }));
      break;
    }
    case 'dilate': {
      const T = triangle([2, 0], [4, 0], [2, 2]);
      const Z = rec(P(-2, -2, 'Z'));
      rec(geoAdd('xf', [T.poly, Z], { k: 'dil', n: 2, name: 'A′B′C′' }));
      break;
    }
    default: return [];
  }
  return made;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { G2, geoReset, geoAdd, geoAddPoint, geoRecompute, geoGet, geoVal, geoGetVals, geoAll, geoRemove,
    geoDependents, geoFreeRoots, geoCapture, geoApply, geoDescribe, geoNum, geoIntersections, geoTangents, geoProjectParam,
    geoPointOn, geoMatrix, geoMapVal, geoCircumcenter, geoIncenter, geoLineEq, geoCircEq, geoEllEq, geoPreset, GEO_PRESETS,
    geoNumSpecs, geoTypeLabel, geoQuad, geoLineCircle, geoCircleCircle, geoLineEllipse, geoCurveCurve, geoLineLine };
}
