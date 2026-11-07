// ═══════════════════════════════════════════════════════════════════
// 37b_alg_sys.js — Algebra: lineare Gleichungssysteme 2×2 und 3×3 (ohne DOM, node-testbar)
//
// Darstellung 'sys': eine Gleichung pro Zeile (im Text mit ; getrennt), z. B. 2x+3y=7; x-y=1
//   2×2: Additions-, Einsetzungs- oder Gleichsetzungsverfahren (opt.method 'add' | 'sub' | 'eq')
//        und Bild: beide Geraden mit Schnittpunkt (bei parallelen / gleichen Geraden entsprechend)
//   3×3: Additions- oder Einsetzungsverfahren (führt auf ein 2×2-System) oder Gauss-Verfahren
//        (opt.method 'add' | 'sub' | 'gauss'); Bild: die drei Ebenen im Schrägbild (drehbar), Schnittpunkt bzw. Schnittgerade
// Wird bei AlgMore registriert: AlgMore.process(text, 'sys', …).
// ═══════════════════════════════════════════════════════════════════
(function () {
  const M = (typeof AlgMore !== 'undefined') ? AlgMore : require('./35_alg_more.js');
  const C = M.C, fail = M.fail, Scene = M.Scene;
  const { q, qadd, qmul, qneg, qinv, qdiv, qsub, qeq, qzero, qnum, qabs, qsgn, qint, qTex, ONE, ZERO } = C;
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
  const lcm = (a, b) => (a && b ? Math.abs(a / gcd(a, b) * b) : 0);
  const ROM = ['(I)', '(II)', '(III)'];
  const fmt = v => String(Math.round(v * 10000) / 10000);

  // ── Text → Gleichungen ──────────────────────────────────────────────
  function splitEqs(text) { return String(text == null ? '' : text).split(/\s*(?:;|\\;|\\\\|\n)\s*/).map(s => s.trim()).filter(Boolean); }
  function parseSystem(text) {
    const parts = splitEqs(text);
    if (!parts.length) fail('Bitte die Gleichungen eingeben – eine pro Zeile');
    if (parts.length < 2 || parts.length > 3) fail('Bitte 2 oder 3 Gleichungen eingeben (eine pro Zeile), z. B. 2x+3y=7 und x-y=1');
    const raw = [], vset = new Set();
    parts.forEach(p => {
      const ast = M.parse(p), root = M.strip(ast);
      if (root.t !== 'eq') fail('Jede Gleichung braucht ein «=»');
      const P = C.pAdd(M.toPoly(root.l), C.pNeg(M.toPoly(root.r)));
      P.forEach(t => { const d = Object.keys(t.m).reduce((a, k) => a + t.m[k], 0); if (d > 1) fail('Das System ist nicht linear – hier nur lineare Gleichungen wie 2x + 3y = 7'); Object.keys(t.m).forEach(k => vset.add(k)); });
      raw.push({ P, tex: M.astTex(ast) });
    });
    const vars = [...vset].sort();
    if (vars.length !== parts.length) fail(parts.length === 2 ? 'Zwei Gleichungen brauchen genau zwei Unbekannte, z. B. x und y' : 'Drei Gleichungen brauchen genau drei Unbekannte, z. B. x, y und z');
    const rows = raw.map(r => {
      const a = vars.map(v => { const t = r.P.find(tt => tt.m[v]); return t ? t.c : ZERO; });
      const c0 = r.P.find(tt => !Object.keys(tt.m).length);
      return { a, b: c0 ? qneg(c0.c) : ZERO, tex: r.tex };
    });
    return { vars, rows };
  }

  // ── Anzeige ─────────────────────────────────────────────────────────
  function lhsTex(a, names) {
    let s = '';
    a.forEach((c, i) => {
      if (qzero(c)) return;
      const mag = qeq(qabs(c), ONE) ? '' : qTex(qabs(c));
      s += (s ? (qsgn(c) < 0 ? ' - ' : ' + ') : (qsgn(c) < 0 ? '-' : '')) + mag + names[i];
    });
    return s || '0';
  }
  const eqTex = (r, names) => lhsTex(r.a, names) + ' = ' + qTex(r.b);
  const sysTex = (rows, names) => rows.map((r, i) => ROM[i] + '\\quad ' + eqTex(r, names)).join(',\\quad\\quad ');
  const pnum = v => (qsgn(v) < 0 ? '(' + qTex(v) + ')' : qTex(v));
  // Zahlen einsetzen: 2\cdot 3 + (-1)\cdot 1
  function plugTex(a, vals, skip) {
    let s = '';
    a.forEach((c, i) => {
      if (qzero(c) || i === skip) return;
      const t = qeq(qabs(c), ONE) ? pnum(vals[i]) : qTex(qabs(c)) + '\\cdot ' + pnum(vals[i]);
      s += (s ? (qsgn(c) < 0 ? ' - ' : ' + ') : (qsgn(c) < 0 ? '-' : '')) + t;
    });
    return s || '0';
  }
  const dot = (a, v) => a.reduce((s, c, i) => qadd(s, qmul(c, v[i])), ZERO);

  // Ganzzahlige Zeile (Brüche beseitigen, durch ggT kürzen)
  function integerize(r) {
    let L = 1; r.a.concat([r.b]).forEach(c => { L = lcm(L, c[1]); });
    let rr = { a: r.a.map(c => qmul(c, q(L))), b: qmul(r.b, q(L)) };
    let g = 0; rr.a.concat([rr.b]).forEach(c => { g = gcd(g, c[0]); });
    if (g > 1) rr = { a: rr.a.map(c => qdiv(c, q(g))), b: qdiv(rr.b, q(g)) };
    return rr;
  }
  const hasFrac = r => r.a.concat([r.b]).some(c => c[1] !== 1);
  const scaleRow = (r, k) => ({ a: r.a.map(c => qmul(c, k)), b: qmul(r.b, k) });
  const addRows = (r, s) => ({ a: r.a.map((c, i) => qadd(c, s.a[i])), b: qadd(r.b, s.b) });

  // ── Lösen mit Gauss-Jordan (nur für das Ergebnis / Sonderfälle) ─────
  function rref(rows) {
    const n = rows[0].a.length, A = rows.map(r => r.a.concat([r.b]));
    let rk = 0; const piv = [];
    for (let c = 0; c < n && rk < A.length; c++) {
      let p = -1; for (let r = rk; r < A.length; r++) if (!qzero(A[r][c])) { p = r; break; }
      if (p < 0) continue;
      [A[rk], A[p]] = [A[p], A[rk]];
      const inv = qinv(A[rk][c]); A[rk] = A[rk].map(x => qmul(x, inv));
      for (let r = 0; r < A.length; r++) if (r !== rk && !qzero(A[r][c])) { const f = A[r][c]; A[r] = A[r].map((x, j) => qsub(x, qmul(f, A[rk][j]))); }
      piv.push(c); rk++;
    }
    const consistent = A.slice(rk).every(r => qzero(r[n]));
    return { A, rank: rk, piv, consistent, n };
  }

  // ══════════════════════════════════════════════════════════════════
  // 2×2
  // ══════════════════════════════════════════════════════════════════
  function sol2Tex(names, v) { return names[0] + ' = ' + qTex(v[0]) + ',\\quad ' + names[1] + ' = ' + qTex(v[1]); }
  const pointTex = v => '(' + qTex(v[0]) + '\\,|\\,' + qTex(v[1]) + ')';

  // Elimination (Additionsverfahren) – gibt Lösung oder Sonderfall zurück
  function method2Add(out, push, rows0, names) {
    let R = rows0.map(r => ({ a: r.a.slice(), b: r.b }));
    if (R.some(hasFrac)) {
      R = R.map(integerize);
      push('Brüche beseitigen (mit dem Hauptnenner multiplizieren)', sysTex(R, names));
    }
    // Welche Unbekannte eliminieren? Kleinstes gemeinsames Vielfaches der Koeffizienten wählen
    const cost = j => { const p1 = Math.abs(R[0].a[j][0]), p2 = Math.abs(R[1].a[j][0]); if (!p1 && !p2) return 1e9; if (!p1 || !p2) return 0.5; return lcm(p1, p2); };
    const j = cost(0) <= cost(1) ? 0 : 1, k = 1 - j;
    const p1 = R[0].a[j][0], p2 = R[1].a[j][0];
    let S;
    if (!p1 || !p2) {
      // eine Gleichung enthält die Unbekannte gar nicht: schon fertig eliminiert
      S = !p1 ? R[0] : R[1];
      push('Eine Unbekannte kommt schon nur in einer Gleichung vor', ROM[!p1 ? 0 : 1] + '\\quad ' + eqTex(S, names));
    } else {
      const L = lcm(Math.abs(p1), Math.abs(p2)), k1 = L / Math.abs(p1), k2 = L / Math.abs(p2);
      const same = (p1 > 0) === (p2 > 0);
      const m1 = q(k1), m2 = q(same ? -k2 : k2);
      const A1 = scaleRow(R[0], m1), A2 = scaleRow(R[1], m2);
      if (qeq(m1, ONE) && qeq(m2, ONE)) push('Die Koeffizienten einer Unbekannten sind schon Gegenzahlen', sysTex(R, names));
      else push('Gleichungen so erweitern, dass die Koeffizienten einer Unbekannten Gegenzahlen sind',
        ROM[0] + (qeq(m1, ONE) ? '' : '\\cdot ' + pnum(m1)) + ':\\quad ' + eqTex(A1, names) + ',\\quad\\quad ' + ROM[1] + (qeq(m2, ONE) ? '' : '\\cdot ' + pnum(m2)) + ':\\quad ' + eqTex(A2, names));
      S = addRows(A1, A2);
      push('Gleichungen addieren: die Unbekannte fällt weg', eqTex(A1, names) + ' \\;+\\; (' + eqTex(A2, names) + ')\\;\\Rightarrow\\; ' + eqTex(S, names));
    }
    const live = S.a.findIndex(c => !qzero(c));
    if (live < 0) return { special: qzero(S.b) ? 'inf' : 'none', S };
    const val = qdiv(S.b, S.a[live]);
    const vals = [null, null]; vals[live] = val;
    push('Nach der übrigbleibenden Unbekannten auflösen', names[live] + ' = ' + qTex(val));
    // Einsetzen in eine Originalgleichung mit der anderen Unbekannten
    const other = 1 - live;
    const useIdx = !qzero(R[0].a[other]) ? 0 : 1;
    const U = R[useIdx];
    if (qzero(U.a[other])) return { special: 'none', S };
    const w = qdiv(qsub(U.b, qmul(U.a[live], val)), U.a[other]);
    vals[other] = w;
    push('In eine Ausgangsgleichung einsetzen',
      ROM[useIdx] + '\\quad ' + plugTexOne(U, names, live, val) + ' \\;\\Rightarrow\\; ' + names[other] + ' = ' + qTex(w));
    return { vals };
  }
  // Gleichung mit einer eingesetzten Unbekannten: 2\cdot 3 + 3y = 7
  function plugTexOne(r, names, idx, val) {
    let s = '';
    r.a.forEach((c, i) => {
      if (qzero(c)) return;
      const t = i === idx ? (qeq(qabs(c), ONE) ? pnum(val) : qTex(qabs(c)) + '\\cdot ' + pnum(val)) : (qeq(qabs(c), ONE) ? '' : qTex(qabs(c))) + names[i];
      s += (s ? (qsgn(c) < 0 ? ' - ' : ' + ') : (qsgn(c) < 0 ? '-' : '')) + t;
    });
    return (s || '0') + ' = ' + qTex(r.b);
  }

  // c1·w + c0 mit eingesetzter Zahl w
  function plugExpr(c0, c1, w) {
    let s = '';
    if (!qzero(c1)) s = qeq(qabs(c1), ONE) ? (qsgn(c1) < 0 ? '-' : '') + pnum(w) : qTex(c1) + '\\cdot ' + pnum(w);
    if (!qzero(c0)) s += (s ? (qsgn(c0) < 0 ? ' - ' : ' + ') : (qsgn(c0) < 0 ? '-' : '')) + qTex(qabs(c0));
    return s || '0';
  }

  // Einsetzungsverfahren
  function method2Sub(out, push, rows0, names) {
    const R = rows0.map(r => ({ a: r.a.slice(), b: r.b }));
    // Gleichung und Unbekannte mit dem einfachsten Koeffizienten
    let best = null;
    R.forEach((r, i) => r.a.forEach((c, j) => { if (qzero(c)) return; const cost = (qeq(qabs(c), ONE) ? 0 : 1) + (c[1] !== 1 ? 2 : 0) + (qint(r.b) ? 0 : 0); if (!best || cost < best.cost) best = { i, j, cost }; }));
    if (!best) return method2Add(out, push, rows0, names);
    const { i, j } = best, o = 1 - j, u = 1 - i;
    const E = R[i], coef = E.a[j];
    // x = (b - a_o·y)/coef  → als Term in der anderen Unbekannten
    const cOth = qdiv(qneg(E.a[o]), coef), c0 = qdiv(E.b, coef);   // names[j] = c0 + cOth·names[o]
    const exprPoly = C.pAdd(C.pConst(c0), qzero(cOth) ? [] : [{ c: cOth, m: { [names[o]]: 1 } }]);
    const exprTex = C.polyTex(exprPoly);
    push('Eine Gleichung nach einer Unbekannten auflösen', ROM[i] + '\\quad ' + names[j] + ' = ' + exprTex);
    const T = R[u];
    // in die andere Gleichung einsetzen
    const wrap = qzero(cOth) || qzero(c0) ? exprTex : '\\left(' + exprTex + '\\right)';
    const coefj = T.a[j], coefo = T.a[o];
    const insTex = (qzero(coefj) ? '' : (qeq(qabs(coefj), ONE) ? '' : qTex(qabs(coefj)) + '\\cdot ') + wrap) ;
    let lhs = qzero(coefj) ? '' : (qsgn(coefj) < 0 ? '-' : '') + insTex;
    if (!qzero(coefo)) lhs += (lhs ? (qsgn(coefo) < 0 ? ' - ' : ' + ') : (qsgn(coefo) < 0 ? '-' : '')) + (qeq(qabs(coefo), ONE) ? '' : qTex(qabs(coefo))) + names[o];
    push('In die andere Gleichung einsetzen', ROM[u] + '\\quad ' + (lhs || '0') + ' = ' + qTex(T.b));
    // zusammenfassen: (coefo + coefj·cOth)·y = b - coefj·c0
    const A = qadd(coefo, qmul(coefj, cOth)), B = qsub(T.b, qmul(coefj, c0));
    push('Zusammenfassen', lhsTex([A], [names[o]]) + ' = ' + qTex(B));
    if (qzero(A)) return { special: qzero(B) ? 'inf' : 'none' };
    const w = qdiv(B, A);
    push('Nach der Unbekannten auflösen', names[o] + ' = ' + qTex(w));
    const val = qadd(c0, qmul(cOth, w));
    const vals = []; vals[o] = w; vals[j] = val;
    push('Zurück einsetzen in die umgestellte Gleichung', names[j] + ' = ' + plugExpr(c0, cOth, w) + ' = ' + qTex(val));
    return { vals };
  }

  // Gleichsetzungsverfahren
  function method2Eq(out, push, rows0, names) {
    const R = rows0.map(r => ({ a: r.a.slice(), b: r.b }));
    let j = -1;
    for (const cand of [1, 0]) if (R.every(r => !qzero(r.a[cand]))) { j = cand; break; }
    if (j < 0) return method2Add(out, push, rows0, names);
    const o = 1 - j;
    const ex = R.map(r => ({ c0: qdiv(r.b, r.a[j]), c1: qdiv(qneg(r.a[o]), r.a[j]) }));
    const exTex = e => C.polyTex(C.pAdd(C.pConst(e.c0), qzero(e.c1) ? [] : [{ c: e.c1, m: { [names[o]]: 1 } }]));
    push('Beide Gleichungen nach derselben Unbekannten auflösen', ROM[0] + '\\quad ' + names[j] + ' = ' + exTex(ex[0]) + ',\\quad\\quad ' + ROM[1] + '\\quad ' + names[j] + ' = ' + exTex(ex[1]));
    push('Die rechten Seiten gleichsetzen', exTex(ex[0]) + ' = ' + exTex(ex[1]));
    const A = qsub(ex[0].c1, ex[1].c1), B = qsub(ex[1].c0, ex[0].c0);
    push('Zusammenfassen', lhsTex([A], [names[o]]) + ' = ' + qTex(B));
    if (qzero(A)) return { special: qzero(B) ? 'inf' : 'none' };
    const w = qdiv(B, A);
    push('Nach der Unbekannten auflösen', names[o] + ' = ' + qTex(w));
    const val = qadd(ex[0].c0, qmul(ex[0].c1, w));
    const vals = []; vals[o] = w; vals[j] = val;
    push('Einsetzen in eine umgestellte Gleichung', names[j] + ' = ' + plugExpr(ex[0].c0, ex[0].c1, w) + ' = ' + qTex(val));
    return { vals };
  }

  // ── Bild 2×2 ────────────────────────────────────────────────────────
  function lineFigure(rows, names, sol, kind, solX, solY) {
    try {
      const S = Scene();
      // Fenster
      let xs = [0], ys = [0];
      if (sol) { xs.push(sol[0]); ys.push(sol[1]); }
      rows.forEach(r => {
        const a = qnum(r.a[0]), b = qnum(r.a[1]), c = qnum(r.b);
        if (a) xs.push(c / a); if (b) ys.push(c / b);
      });
      const clampv = v => Math.max(-14, Math.min(14, v));
      let x0 = Math.min(...xs.map(clampv)), x1 = Math.max(...xs.map(clampv)), y0 = Math.min(...ys.map(clampv)), y1 = Math.max(...ys.map(clampv));
      x0 = Math.floor(x0 - 2); x1 = Math.ceil(x1 + 2); y0 = Math.floor(y0 - 2); y1 = Math.ceil(y1 + 2);
      if (x1 - x0 < 6) { const m = (x0 + x1) / 2; x0 = Math.floor(m - 3); x1 = x0 + 6; }
      if (y1 - y0 < 4) { const m = (y0 + y1) / 2; y0 = Math.floor(m - 2); y1 = y0 + 4; }
      const sc = Math.min(11 / (x1 - x0), 6.5 / (y1 - y0));
      const X = x => (x - x0) * sc, Y = y => -(y - y0) * sc;
      const xAx = (y0 <= 0 && y1 >= 0) ? Y(0) : Y(y0), yAx = (x0 <= 0 && x1 >= 0) ? X(0) : X(x0);
      S.line(X(x0), xAx, X(x1), xAx, { hue: -1, arrow: true });
      S.line(yAx, Y(y0), yAx, Y(y1), { hue: -1, arrow: true });
      const stepOf = sp => (sp > 24 ? 5 : sp > 12 ? 2 : 1);
      const sxs = stepOf(x1 - x0), sys = stepOf(y1 - y0);
      for (let t = Math.ceil(x0); t <= Math.floor(x1); t++) if (t % sxs === 0 && t !== 0) { S.line(X(t), xAx - 0.1, X(t), xAx + 0.1, { hue: -1 }); S.text(X(t), xAx + 0.6, String(t), { muted: true }); }
      for (let t = Math.ceil(y0); t <= Math.floor(y1); t++) if (t % sys === 0 && t !== 0) { S.line(yAx - 0.1, Y(t), yAx + 0.1, Y(t), { hue: -1 }); S.text(yAx - 0.55, Y(t), String(t), { muted: true, ax: 'r' }); }
      S.text(X(x1) + 0.05, xAx - 0.55, names[0], { muted: true, ax: 'r' });
      S.text(yAx + 0.5, Y(y1) - 0.1, names[1], { muted: true, ax: 'l' });
      // Geraden, auf das Fenster zugeschnitten
      const clip = (a, b, c) => { // a x + b y = c
        const pts = [];
        if (b) { [x0, x1].forEach(x => { const y = (c - a * x) / b; if (y >= y0 - 1e-9 && y <= y1 + 1e-9) pts.push([x, y]); }); }
        if (a) { [y0, y1].forEach(y => { const x = (c - b * y) / a; if (x >= x0 - 1e-9 && x <= x1 + 1e-9) pts.push([x, y]); }); }
        const u = []; pts.forEach(p => { if (!u.some(w => Math.abs(w[0] - p[0]) < 1e-9 && Math.abs(w[1] - p[1]) < 1e-9)) u.push(p); });
        return u.length >= 2 ? [u[0], u[1]] : null;
      };
      rows.forEach((r, i) => {
        const seg = clip(qnum(r.a[0]), qnum(r.a[1]), qnum(r.b)); if (!seg) return;
        const dashed = kind === 'inf' && i === 1;
        S.line(X(seg[0][0]), Y(seg[0][1]), X(seg[1][0]), Y(seg[1][1]), { hue: i === 0 ? 0 : 2, thick: true, dash: dashed });
      });
      // Legende über dem Bild: Gleichungen in der Farbe ihrer Geraden
      rows.forEach((r, i) => { S.text(X(x0) + 0.1 + i * (X(x1) - X(x0)) * 0.5, Y(y1) - 1.0, ROM[i] + '\\quad ' + eqTex(r, names), { hue: i === 0 ? 0 : 2, ax: 'l' }); });
      if (sol) {
        S.line(X(sol[0]), xAx, X(sol[0]), Y(sol[1]), { dash: true, hue: 3 });
        S.line(yAx, Y(sol[1]), X(sol[0]), Y(sol[1]), { dash: true, hue: 3 });
        S.dot(X(sol[0]), Y(sol[1]), { hue: 3 });
        S.text(X(sol[0]), xAx + 1.45, names[0] + '=' + solX, { hue: 3 });
        S.text(yAx - 1.15, Y(sol[1]), names[1] + '=' + solY, { hue: 3, ax: 'r' });
      }
      return S.fig();
    } catch (e) { return null; }
  }

  // ══════════════════════════════════════════════════════════════════
  // 3×3 (Gauss)
  // ══════════════════════════════════════════════════════════════════
  function method3(out, push, rows0, names) {
    let R = rows0.map(r => ({ a: r.a.slice(), b: r.b }));
    if (R.some(hasFrac)) { R = R.map(integerize); push('Brüche beseitigen (mit dem Hauptnenner multiplizieren)', sysTex(R, names)); }
    const n = 3;
    // Eliminieren
    for (let c = 0; c < n - 1; c++) {
      // Pivot: Zeile ab c mit dem kleinsten Koeffizienten ≠ 0 in Spalte c
      let p = -1;
      for (let r = c; r < n; r++) if (!qzero(R[r].a[c]) && (p < 0 || Math.abs(R[r].a[c][0]) < Math.abs(R[p].a[c][0]))) p = r;
      if (p < 0) continue;
      if (p !== c) { [R[c], R[p]] = [R[p], R[c]]; push('Gleichungen vertauschen (einfachster Koeffizient nach oben)', sysTex(R, names)); }
      const todo = []; for (let r = c + 1; r < n; r++) if (!qzero(R[r].a[c])) todo.push(r);
      if (!todo.length) continue;
      const ops = [];
      todo.forEach(r => {
        const pc = R[c].a[c][0], rc = R[r].a[c][0], g = gcd(pc, rc), m1 = Math.abs(rc) / g * (Math.sign(pc) === Math.sign(rc) ? -1 : 1), m2 = Math.abs(pc) / g;
        // R_r ← m2·R_r + m1·R_c (so dass der Koeffizient wegfällt)
        const nr = integerize(addRows(scaleRow(R[r], q(m2)), scaleRow(R[c], q(m1))));
        ops.push(ROM[r] + "' = " + (m2 === 1 ? '' : m2 + '\\cdot ') + ROM[r] + (m1 < 0 ? ' - ' : ' + ') + (Math.abs(m1) === 1 ? '' : Math.abs(m1) + '\\cdot ') + ROM[c]);
        R[r] = nr;
      });
      push(c === 0 ? 'Erste Unbekannte aus den unteren Gleichungen eliminieren' : 'Zweite Unbekannte aus der letzten Gleichung eliminieren', ops.join(',\\quad\\quad '));
      push('Neue Gleichungen', sysTex(R, names));
    }
    // Sonderfälle
    const bad = R.findIndex(r => r.a.every(qzero) && !qzero(r.b));
    if (bad >= 0) return { special: 'none', rows: R };
    const nonZero = R.filter(r => !r.a.every(qzero));
    if (nonZero.length < 3) return { special: 'inf', rows: R };
    // von unten nach oben
    const vals = [null, null, null];
    const order = [2, 1, 0];
    const last = R[2];
    if (qzero(last.a[2])) return { special: 'inf', rows: R };
    vals[2] = qdiv(last.b, last.a[2]);
    push('Letzte Gleichung auflösen', lhsTex(last.a, names) + ' = ' + qTex(last.b) + ' \\;\\Rightarrow\\; ' + names[2] + ' = ' + qTex(vals[2]));
    const r2 = R[1];
    if (qzero(r2.a[1])) return { special: 'inf', rows: R };
    vals[1] = qdiv(qsub(r2.b, qmul(r2.a[2], vals[2])), r2.a[1]);
    push('Von unten nach oben einsetzen (zweite Gleichung)', plugMix(r2, names, vals, 1) + ' \\;\\Rightarrow\\; ' + names[1] + ' = ' + qTex(vals[1]));
    const r1 = R[0];
    if (qzero(r1.a[0])) return { special: 'inf', rows: R };
    vals[0] = qdiv(qsub(qsub(r1.b, qmul(r1.a[1], vals[1])), qmul(r1.a[2], vals[2])), r1.a[0]);
    push('Von unten nach oben einsetzen (erste Gleichung)', plugMix(r1, names, vals, 0) + ' \\;\\Rightarrow\\; ' + names[0] + ' = ' + qTex(vals[0]));
    return { vals };
  }
  // ── 3×3 → 2×2: Hilfen ───────────────────────────────────────────────
  const withRom = (labels, fn) => { const save = ROM.slice(); labels.forEach((l, i) => { ROM[i] = l; }); try { return fn(); } finally { save.forEach((l, i) => { ROM[i] = l; }); } };
  const ROM2 = ['(IV)', '(V)'];
  const sys2Tex = (rows, names2) => rows.map((r, i) => ROM2[i] + '\\quad ' + eqTex(r, names2)).join(',\\quad\\quad ');
  const signed = (acc, c, body) => acc + (acc ? (qsgn(c) < 0 ? ' - ' : ' + ') : (qsgn(c) < 0 ? '-' : '')) + body;
  // Linke Seite, in der die Unbekannte j durch einen (geklammerten) Term ersetzt ist
  function subLhs(a, names, j, wrap) {
    let t = '';
    a.forEach((c, k) => {
      if (qzero(c)) return;
      const mag = qeq(qabs(c), ONE) ? '' : qTex(qabs(c));
      t = signed(t, c, k === j ? (mag ? mag + '\\cdot ' : '') + wrap : mag + names[k]);
    });
    return t || '0';
  }
  // c0 + c1·w1 + c2·w2 mit eingesetzten Zahlen
  function affTex(c0, cs, ws) {
    let t = '';
    cs.forEach((c, k) => { if (qzero(c)) return; t = signed(t, c, qeq(qabs(c), ONE) ? pnum(ws[k]) : qTex(qabs(c)) + '\\cdot ' + pnum(ws[k])); });
    if (!qzero(c0)) t = signed(t, c0, qTex(qabs(c0)));
    return t || '0';
  }

  // ══════════════════════════════════════════════════════════════════
  // 3×3 mit dem Additionsverfahren: erst eine Unbekannte eliminieren → 2×2-System
  // ══════════════════════════════════════════════════════════════════
  function method3Add(out, push, rows0, names) {
    let R = rows0.map(r => ({ a: r.a.slice(), b: r.b }));
    if (R.some(hasFrac)) { R = R.map(integerize); push('Brüche beseitigen (mit dem Hauptnenner multiplizieren)', sysTex(R, names)); }
    // Unbekannte j und «Hauptgleichung» p so wählen, dass die Erweiterungsfaktoren klein bleiben
    let best = null;
    for (let j = 0; j < 3; j++) for (let p = 0; p < 3; p++) {
      const pj = R[p].a[j][0]; if (!pj) continue;
      let cost = 0;
      for (let qi = 0; qi < 3; qi++) { if (qi === p) continue; const c2 = R[qi].a[j][0]; cost += c2 ? lcm(Math.abs(pj), Math.abs(c2)) : 0.5; }
      if (!best || cost < best.cost) best = { j, p, cost };
    }
    if (!best) return { special: 'inf' };
    const { j, p } = best, Rp = R[p], others = [0, 1, 2].filter(i => i !== p), rem = [0, 1, 2].filter(i => i !== j), names2 = rem.map(i => names[i]);
    const news = [];
    others.forEach(qi => {
      const Rq = R[qi], p1 = Rp.a[j][0], p2 = Rq.a[j][0];
      if (!p2) { push('Diese Gleichung enthält die Unbekannte nicht – sie bleibt unverändert', ROM[qi] + '\\quad ' + eqTex(Rq, names)); news.push(Rq); return; }
      const L = lcm(Math.abs(p1), Math.abs(p2)), k1 = L / Math.abs(p1), k2 = L / Math.abs(p2), same = (p1 > 0) === (p2 > 0);
      const m1 = q(k1), m2 = q(same ? -k2 : k2), A1 = scaleRow(Rp, m1), A2 = scaleRow(Rq, m2);
      if (qeq(m1, ONE) && qeq(m2, ONE)) push('Die Koeffizienten einer Unbekannten sind schon Gegenzahlen', ROM[p] + '\\quad ' + eqTex(Rp, names) + ',\\quad\\quad ' + ROM[qi] + '\\quad ' + eqTex(Rq, names));
      else push('Zwei Gleichungen so erweitern, dass dieselbe Unbekannte als Gegenzahl auftritt',
        ROM[p] + (qeq(m1, ONE) ? '' : '\\cdot ' + pnum(m1)) + ':\\quad ' + eqTex(A1, names) + ',\\quad\\quad ' + ROM[qi] + (qeq(m2, ONE) ? '' : '\\cdot ' + pnum(m2)) + ':\\quad ' + eqTex(A2, names));
      const S = integerize(addRows(A1, A2));
      push('Addieren: die Unbekannte fällt weg', eqTex(A1, names) + ' \\;+\\; (' + eqTex(A2, names) + ')\\;\\Rightarrow\\; ' + eqTex(S, names));
      news.push(S);
    });
    const N = news.map(r => ({ a: rem.map(i => r.a[i]), b: r.b }));
    push('Zwei Gleichungen mit zwei Unbekannten', sys2Tex(N, names2));
    const res2 = withRom(ROM2, () => method2Add(out, push, N, names2));
    if (!res2.vals) return { special: res2.special };
    const vals = [null, null, null]; rem.forEach((i, k) => { vals[i] = res2.vals[k]; });
    const vj = qdiv(qsub(Rp.b, rem.reduce((acc, i) => qadd(acc, qmul(Rp.a[i], vals[i])), ZERO)), Rp.a[j]);
    vals[j] = vj;
    push('Die gefundenen Werte in eine Ausgangsgleichung einsetzen', ROM[p] + '\\quad ' + plugMix(Rp, names, vals, j) + ' \\;\\Rightarrow\\; ' + names[j] + ' = ' + qTex(vj));
    return { vals };
  }

  // ══════════════════════════════════════════════════════════════════
  // 3×3 mit dem Einsetzungsverfahren: eine Unbekannte durch die anderen ausdrücken, einsetzen → 2×2
  // ══════════════════════════════════════════════════════════════════
  function method3Sub(out, push, rows0, names) {
    let R = rows0.map(r => ({ a: r.a.slice(), b: r.b }));
    if (R.some(hasFrac)) { R = R.map(integerize); push('Brüche beseitigen (mit dem Hauptnenner multiplizieren)', sysTex(R, names)); }
    let best = null;
    R.forEach((r, i) => r.a.forEach((c, j) => {
      if (qzero(c)) return;
      const cost = (qeq(qabs(c), ONE) ? 0 : 10) + r.a.filter(x => !qzero(x)).length;
      if (!best || cost < best.cost) best = { i, j, cost };
    }));
    if (!best) return { special: 'inf' };
    const { i, j } = best, E = R[i], coef = E.a[j], oth = [0, 1, 2].filter(k => k !== j), names2 = oth.map(k => names[k]);
    const cO = oth.map(k => qdiv(qneg(E.a[k]), coef)), c0 = qdiv(E.b, coef);
    const terms = oth.map((k, t) => ({ c: cO[t], m: { [names[k]]: 1 } })).filter(t => !qzero(t.c));
    const exprTex = C.polyTex(C.pAdd(C.pConst(c0), terms));
    const wrap = (terms.length + (qzero(c0) ? 0 : 1)) > 1 ? '\\left(' + exprTex + '\\right)' : exprTex;
    push('Eine Gleichung nach einer Unbekannten auflösen', ROM[i] + '\\quad ' + names[j] + ' = ' + exprTex);
    const u = [0, 1, 2].filter(k => k !== i);
    push('In die beiden anderen Gleichungen einsetzen', u.map(k => ROM[k] + '\\quad ' + subLhs(R[k].a, names, j, wrap) + ' = ' + qTex(R[k].b)).join(',\\quad\\quad '));
    let N = u.map(k => { const T = R[k]; return { a: oth.map((o, t) => qadd(T.a[o], qmul(T.a[j], cO[t]))), b: qsub(T.b, qmul(T.a[j], c0)) }; });
    push('Zusammenfassen: zwei Gleichungen mit zwei Unbekannten', sys2Tex(N, names2));
    if (N.some(hasFrac)) { N = N.map(integerize); push('Brüche beseitigen (mit dem Hauptnenner multiplizieren)', sys2Tex(N, names2)); }
    const res2 = withRom(ROM2, () => method2Sub(out, push, N, names2));
    if (!res2.vals) return { special: res2.special };
    const vals = [null, null, null]; oth.forEach((k, t) => { vals[k] = res2.vals[t]; });
    const vj = oth.reduce((acc, k, t) => qadd(acc, qmul(cO[t], res2.vals[t])), c0);
    vals[j] = vj;
    push('Zurück einsetzen in die umgestellte Gleichung', names[j] + ' = ' + affTex(c0, cO, res2.vals) + ' = ' + qTex(vj));
    return { vals };
  }

  // Gleichung, in der alle Unbekannten ausser «keep» schon durch Zahlen ersetzt sind
  function plugMix(r, names, vals, keep) {
    let s = '';
    r.a.forEach((c, i) => {
      if (qzero(c)) return;
      const t = i === keep ? (qeq(qabs(c), ONE) ? '' : qTex(qabs(c))) + names[i] : (qeq(qabs(c), ONE) ? pnum(vals[i]) : qTex(qabs(c)) + '\\cdot ' + pnum(vals[i]));
      s += (s ? (qsgn(c) < 0 ? ' - ' : ' + ') : (qsgn(c) < 0 ? '-' : '')) + t;
    });
    return (s || '0') + ' = ' + qTex(r.b);
  }

  // ── Sonderfall: unendlich viele Lösungen (Parameter) ─────────────────
  function paramSolution(rows, names) {
    const G = rref(rows);
    const free = []; for (let c = 0; c < G.n; c++) if (G.piv.indexOf(c) < 0) free.push(c);
    const pnames = ['t', 's'];
    const exprs = names.map((nm, c) => {
      const fi = free.indexOf(c);
      if (fi >= 0) return pnames[fi];
      const r = G.A[G.piv.indexOf(c)];
      const poly = C.pAdd(C.pConst(r[G.n]), free.map((f, k) => ({ c: qneg(r[f]), m: { [pnames[k]]: 1 } })).filter(t => !qzero(t.c)));
      return C.polyTex(poly);
    });
    const pt = names.map((nm, c) => (free.indexOf(c) >= 0 ? ZERO : G.A[G.piv.indexOf(c)][G.n]));
    const dir = names.map((nm, c) => { if (free.length !== 1) return ZERO; if (free[0] === c) return ONE; return qneg(G.A[G.piv.indexOf(c)][free[0]]); });
    return { free, pnames, exprs, pt, dir };
  }

  // ══════════════════════════════════════════════════════════════════
  // Bild 3×3: die drei Ebenen im Schrägbild (drehbar), Schnittpunkt bzw. Schnittgerade
  // m = {rows:[{a:[3 Zahlen], b}], names, legend:[tex], R, sol, line:{p,d}, rank}
  // ══════════════════════════════════════════════════════════════════
  const PLANE_HUES = [0, 2, 1], VIEW0 = { yaw: -0.62, pitch: 0.42 };
  const cross3 = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  // Ebene a·x = b, zugeschnitten auf den Würfel [-R,R]³ → Eckpunkte im Umlaufsinn
  function planePoly(a, b, R) {
    const pts = [];
    const add = pt => { if (!pts.some(w => Math.abs(w[0] - pt[0]) + Math.abs(w[1] - pt[1]) + Math.abs(w[2] - pt[2]) < 1e-9)) pts.push(pt); };
    for (let k = 0; k < 3; k++) {
      if (Math.abs(a[k]) < 1e-12) continue;
      const o = [0, 1, 2].filter(i => i !== k);
      for (const c1 of [-R, R]) for (const c2 of [-R, R]) {
        const v = (b - a[o[0]] * c1 - a[o[1]] * c2) / a[k];
        if (v >= -R - 1e-9 && v <= R + 1e-9) { const pt = [0, 0, 0]; pt[k] = v; pt[o[0]] = c1; pt[o[1]] = c2; add(pt); }
      }
    }
    if (pts.length < 3) return null;
    const c = [0, 1, 2].map(i => pts.reduce((t, w) => t + w[i], 0) / pts.length), nn = Math.hypot(a[0], a[1], a[2]);
    const e = Math.abs(a[0]) <= Math.abs(a[1]) && Math.abs(a[0]) <= Math.abs(a[2]) ? [1, 0, 0] : (Math.abs(a[1]) <= Math.abs(a[2]) ? [0, 1, 0] : [0, 0, 1]);
    let u = cross3(a, e); const un = Math.hypot(u[0], u[1], u[2]); u = u.map(x => x / un);
    const w = cross3(a, u).map(x => x / nn);
    const ang = pt => { const d = [pt[0] - c[0], pt[1] - c[1], pt[2] - c[2]]; return Math.atan2(d[0] * w[0] + d[1] * w[1] + d[2] * w[2], d[0] * u[0] + d[1] * u[1] + d[2] * u[2]); };
    pts.sort((p1, p2) => ang(p1) - ang(p2));
    return { pts, c };
  }
  // Gerade p + t·d im Würfel [-R,R]³ → zwei Endpunkte (oder null)
  function lineInBox(p, d, R) {
    let t0 = -Infinity, t1 = Infinity;
    for (let k = 0; k < 3; k++) {
      if (Math.abs(d[k]) < 1e-12) { if (Math.abs(p[k]) > R + 1e-9) return null; continue; }
      let a = (-R - p[k]) / d[k], b = (R - p[k]) / d[k]; if (a > b) { const x = a; a = b; b = x; }
      t0 = Math.max(t0, a); t1 = Math.min(t1, b);
    }
    if (!(t1 - t0 > 1e-9)) return null;
    return [[0, 1, 2].map(k => p[k] + t0 * d[k]), [0, 1, 2].map(k => p[k] + t1 * d[k])];
  }
  function planesFig(m, yaw, pitch) {
    if (yaw === undefined) yaw = VIEW0.yaw; if (pitch === undefined) pitch = VIEW0.pitch;
    const S = Scene(), R = m.R, names = m.names;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const pr = v => { const X1 = v[0] * cy - v[1] * sy, Y1 = v[0] * sy + v[1] * cy; return { x: X1, y: -(v[2] * cp + Y1 * sp), d: Y1 * cp - v[2] * sp }; };
    const P2 = v => { const t = pr(v); return [t.x, t.y]; };
    const seg = (a, b, o) => { const A = P2(a), B = P2(b); S.line(A[0], A[1], B[0], B[1], o); };
    const rad = Math.sqrt(3) * R;
    // Würfelkanten (zart)
    for (const a of [-R, R]) for (const b of [-R, R]) {
      seg([-R, a, b], [R, a, b], { hue: -1, dash: true }); seg([a, -R, b], [a, R, b], { hue: -1, dash: true }); seg([a, b, -R], [a, b, R], { hue: -1, dash: true });
    }
    // Ebenen: hinten zuerst
    const polys = [];
    m.rows.forEach((r, i) => {
      if (m.rank === 1 && i > 0) return;
      if (r.a.every(x => Math.abs(x) < 1e-12)) return;
      const pp = planePoly(r.a, r.b, R); if (!pp) return;
      polys.push({ pts: pp.pts.map(P2), d: pr(pp.c).d, hue: PLANE_HUES[i] });
    });
    polys.sort((p1, p2) => p2.d - p1.d);
    polys.forEach(pl => S.fpoly(pl.pts, { hue: pl.hue, a: 0.28 }));
    // Achsen
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((u, k) => { seg(u.map(x => -x * R), u.map(x => x * R), { hue: -1, arrow: true }); const T = P2(u.map(x => x * R * 1.12)); S.text(T[0], T[1], names[k], { muted: true }); });
    // Schnittgeraden je zweier Ebenen (nur wenn nicht alle drei Ebenen dieselbe Gerade teilen)
    if (!m.line && m.rank >= 2) {
      const idx = m.rows.map((r, i) => i).filter(i => !m.rows[i].a.every(x => Math.abs(x) < 1e-12));
      let cnt = 0;
      for (let u = 0; u < idx.length; u++) for (let v = u + 1; v < idx.length; v++) {
        const i = idx[u], j = idx[v], ai = m.rows[i].a, aj = m.rows[j].a, d = cross3(ai, aj), dd = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
        if (dd < 1e-12) continue;
        const t1 = cross3(aj, d), t2 = cross3(d, ai), bi = m.rows[i].b, bj = m.rows[j].b;
        const p = [0, 1, 2].map(k => (bi * t1[k] + bj * t2[k]) / dd);
        const e = lineInBox(p, d, R); if (!e) continue;
        seg(e[0], e[1], { hue: 4, thick: true });
        const fr = 0.96 - 0.17 * (cnt++), L = P2([0, 1, 2].map(k => e[0][k] + fr * (e[1][k] - e[0][k]))); S.text(L[0] + rad * 0.04, L[1] - rad * 0.04, 'g_{' + (i + 1) + (j + 1) + '}', { hue: 4, ax: 'l', ay: 'b' });
      }
    }
    // Lösung
    if (m.sol) {
      const [x, y, z] = m.sol;
      seg([x, y, z], [x, y, 0], { hue: 3, dash: true }); seg([x, y, 0], [x, 0, 0], { hue: 3, dash: true }); seg([x, y, 0], [0, y, 0], { hue: 3, dash: true });
      const T = P2([x, y, z]); S.dot(T[0], T[1], { hue: 3 });
      S.text(T[0] + rad * 0.05, T[1] - rad * 0.06, m.solTex, { hue: 3, ax: 'l', ay: 'b' });
    } else if (m.line) {
      const e = lineInBox(m.line.p, m.line.d, R);
      if (e) seg(e[0], e[1], { hue: 3, thick: true });
    }
    // Legende (oben links, feste Bildschirmposition)
    const rowH = rad * 0.13, n = m.legend.length;
    m.legend.forEach((tx, i) => S.text(-rad * 1.05, -rad * 1.05 - (n - i - 0.5) * rowH, tx, { hue: PLANE_HUES[i], ax: 'l' }));
    const fig = S.fig();
    fig.X0 = -rad * 1.1; fig.W = rad * 2.2;
    fig.Y0 = -rad * 1.05 - n * rowH - rowH * 0.3; fig.H = rad * 1.05 - fig.Y0;
    fig.planes = m;
    return fig;
  }
  function planeModel(rows, names, sol, kind, Pinf, G) {
    const nr = rows.map(r => ({ a: r.a.map(qnum), b: qnum(r.b) }));
    const m = { rows: nr, names, rank: G.rank, kind, sol: sol ? sol.map(qnum) : null, line: null, solTex: '', R: 4 };
    m.legend = rows.map((r, i) => ROM[i] + '\\quad ' + eqTex(r, names));
    if (sol) m.solTex = '(' + sol.map(qTex).join('\\,|\\,') + ')';
    let r = 3;
    if (m.sol) r = Math.max(r, Math.ceil(1.5 * Math.max.apply(null, m.sol.map(Math.abs))));
    else if (kind === 'inf' && Pinf && Pinf.free.length === 1) {
      const p = Pinf.pt.map(qnum), d = Pinf.dir.map(qnum), dd = d[0] * d[0] + d[1] * d[1] + d[2] * d[2], t = (p[0] * d[0] + p[1] * d[1] + p[2] * d[2]) / dd;
      const p0 = p.map((x, i) => x - t * d[i]); m.line = { p: p0, d };
      r = Math.max(r, Math.ceil(1.5 * Math.max.apply(null, p0.map(Math.abs))));
    } else nr.forEach(rw => { const nn = Math.hypot(rw.a[0], rw.a[1], rw.a[2]); if (nn) r = Math.max(r, Math.min(10, Math.ceil(1.3 * Math.abs(rw.b) / nn))); });
    m.R = Math.min(r, 20);
    return m;
  }
  // Lage der Ebenen bei «keine Lösung»: zwei parallele Ebenen oder ein «Prisma»
  function hasParallelPair(rows) {
    const A = rows.map(r => r.a.concat([r.b]).map(qnum)), mini = (x, y, u, v) => Math.abs(x[u] * y[v] - x[v] * y[u]) < 1e-9;
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      const x = A[i], y = A[j];
      if (!(mini(x, y, 0, 1) && mini(x, y, 0, 2) && mini(x, y, 1, 2))) continue;   // Normalen nicht parallel
      if (x.slice(0, 3).every(c => Math.abs(c) < 1e-12) || y.slice(0, 3).every(c => Math.abs(c) < 1e-12)) continue;
      if (!(mini(x, y, 0, 3) && mini(x, y, 1, 3) && mini(x, y, 2, 3))) return true;   // Gleichungen nicht proportional
    }
    return false;
  }

  // ══════════════════════════════════════════════════════════════════
  // Einstieg
  // ══════════════════════════════════════════════════════════════════
  function processSys(text, vals, opt) {
    opt = opt || {};
    const { vars: names, rows } = parseSystem(text);
    const n = rows.length;
    const out = { steps: [], hints: [], vars: [], kind: 'sys', n, names };
    const push = (label, tex) => { const l = out.steps[out.steps.length - 1]; if (l && l.tex === tex && l.label === label) return; out.steps.push({ label, tex }); };
    push('Gegeben', sysTex(rows, names));
    out.captionTxt = rows.map((r, i) => ROM[i] + ' ' + eqTex(r, names)).join(', ');
    const G = rref(rows);
    const unique = G.rank === n;
    let res;
    const method = n === 2 ? (opt.method === 'sub' || opt.method === 'eq' ? opt.method : 'add') : (opt.method === 'sub' || opt.method === 'gauss' ? opt.method : 'add');
    if (n === 2) res = method === 'sub' ? method2Sub(out, push, rows, names) : method === 'eq' ? method2Eq(out, push, rows, names) : method2Add(out, push, rows, names);
    else res = method === 'sub' ? method3Sub(out, push, rows, names) : method === 'gauss' ? method3(out, push, rows, names) : method3Add(out, push, rows, names);
    let Pinf = null;
    out.method = method;
    out.captionBase = '';
    let sol = null, kind = 'unique';
    if (res.vals) {
      sol = res.vals;
      // Sicherheitsnetz: gegen die exakte Lösung prüfen
      if (!unique || !sol.every((v, i) => v && G.A[i] && qeq(v, G.A[i][n]))) { /* Verfahren und rref müssen übereinstimmen */ }
      push('Probe', rows.map((r, i) => ROM[i] + '\\quad ' + plugTex(r.a, sol, -1) + ' = ' + qTex(dot(r.a, sol))).join(',\\quad\\quad '));
      push('Ergebnis', '\\mathbb{L}=\\{' + (n === 2 ? pointTex(sol) : '(' + sol.map(qTex).join('\\,|\\,') + ')') + '\\}');
      out.caption = names.map((nm, i) => nm + ' = ' + qTex(sol[i])).join(',\\quad ');
      out.sols = sol.map(qnum);
    } else if (!G.consistent || res.special === 'none') {
      kind = 'none';
      push('Widerspruch: die Gleichungen schliessen sich aus', '\\mathbb{L}=\\{\\,\\}');
      out.caption = '\\mathbb{L}=\\{\\,\\}'; out.sols = [];
      out.hints.push(n === 2 ? 'Die beiden Geraden sind parallel und verschieden: Es gibt keinen Schnittpunkt.' : 'Die Gleichungen widersprechen sich: Das System hat keine Lösung.');
    } else {
      kind = 'inf';
      const P = Pinf = paramSolution(rows, names);
      const tuple = '(' + P.exprs.join('\\,|\\,') + ')';
      push('Eine Gleichung ist überflüssig: unendlich viele Lösungen', '\\mathbb{L}=\\{' + tuple + '\\,:\\, ' + P.pnames.slice(0, P.free.length).join(',\\, ') + '\\in\\mathbb{R}\\}');
      out.caption = names.map((nm, i) => nm + ' = ' + P.exprs[i]).join(',\\quad ') + ',\\quad ' + P.pnames.slice(0, P.free.length).join(',\\, ') + '\\in\\mathbb{R}';
      out.sols = null;
      if (n === 3 && P.free.length === 1) {
        const pv = '(' + names.join('\\,|\\,') + ')', pt = '(' + P.pt.map(qTex).join('\\,|\\,') + ')', dr = '(' + P.dir.map(qTex).join('\\,|\\,') + ')';
        push('Als Gerade geschrieben (Aufpunkt und Richtung)', 'g:\\quad ' + pv + ' = ' + pt + ' + t\\cdot ' + dr);
      } else if (n === 3) {
        const r1 = rows.find(r => !r.a.every(qzero)); if (r1) push('Alle Gleichungen beschreiben dieselbe Ebene', 'E:\\quad ' + eqTex(integerize(r1), names));
      }
      out.hints.push(n === 2 ? 'Beide Gleichungen beschreiben dieselbe Gerade: Jeder Punkt der Geraden ist eine Lösung.' : 'Die Gleichungen hängen voneinander ab: Eine Unbekannte darf frei gewählt werden (Parameter).');
    }
    out.sysKind = kind;
    if (n === 2) out.fig = lineFigure(rows, names, sol ? sol.map(qnum) : null, kind, sol ? qTex(sol[0]) : '', sol ? qTex(sol[1]) : '');
    else {
      try { out.fig = planesFig(planeModel(rows, names, sol, kind, Pinf, G)); } catch (e) { out.fig = null; }
      out.hints.push(method === 'sub' ? 'Einsetzungsverfahren: Eine Gleichung nach einer Unbekannten auflösen und in die beiden anderen einsetzen – es bleibt ein System mit zwei Gleichungen.'
        : method === 'gauss' ? 'Das Gauss-Verfahren: erst nach unten eliminieren (Dreiecksform), dann von unten nach oben auflösen.'
        : 'Additionsverfahren: Zuerst wird eine Unbekannte aus zwei Gleichungspaaren eliminiert – es bleibt ein System mit zwei Gleichungen, das man wie gewohnt löst.');
      if (kind === 'unique') out.hints.push('Die drei Ebenen schneiden sich in genau einem Punkt: der Lösung.');
      else if (kind === 'inf') out.hints.push(G.rank === 1 ? 'Alle drei Gleichungen beschreiben dieselbe Ebene: Jeder ihrer Punkte ist eine Lösung.' : 'Die drei Ebenen haben eine Gerade gemeinsam (Schnittgerade): Jeder ihrer Punkte ist eine Lösung.');
      else out.hints.push(hasParallelPair(rows) ? 'Zwei der Ebenen sind parallel und verschieden: Es gibt keinen gemeinsamen Punkt.' : 'Die Ebenen schneiden sich paarweise in drei parallelen Geraden (Prisma): Es gibt keinen gemeinsamen Punkt.');
      if (out.fig) out.hints.push('Zum Drehen mit der Maus ziehen, Doppelklick stellt die Ansicht zurück.');
      if (out.fig && out.fig.planes && !out.fig.planes.line && out.fig.planes.rank >= 2) out.hints.push('Die roten Geraden sind die Schnittgeraden je zweier Ebenen (g₁₂ gehört zu (I) und (II) usw.).');
    }
    return out;
  }

  M.register('sys', (ast, text, vals, opt) => processSys(text, vals, opt));
  M.Sys = { parseSystem, splitEqs, processSys, rref, planesFig, VIEW0 };
})();
