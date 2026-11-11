// ═════════════════════════════════════════════════════════════════
// MODUL 60c: dif_kd — Kurvendiskussion (ohne DOM, node-testbar)
//
//   Dif.kd(F, win)    Analyse: Symmetrie, Verhalten im Unendlichen, Nullstellen, Extrema, Wendepunkte,
//                     Monotonie- und Krümmungsintervalle. Polynome exakt (Brüche, Wurzeln), sonst
//                     numerisch im Fenster win = [a, b] (Näherungswerte).
//   Dif.kdDoc(K)      Rechenweg als SV.Doc (Schritt für Schritt wie im Dossier)
//   Dif.monoDoc(K)    kurze Fassung: Vorzeichentabelle von f' (für «Graphisches Ableiten»)
//
// Doc-Erweiterung: Block {k:'tab', head:[…], rows:[[…]]} (Tabelle, Zellen mit $…$-Formeln).
// ═════════════════════════════════════════════════════════════════
(function () {
  const E = Dif.E, S = Dif.S;
  const { tx, tex, fmtT, hasX, DOC, polyAst } = Dif;
  const q0 = E.q0;

  // ───────────────────── Hilfen ─────────────────────
  const sgnStr = s => (s > 0 ? '+' : s < 0 ? '-' : '0');
  function bisect(g, a, b, ga, gb) {                    // Nullstelle im Intervall mit Vorzeichenwechsel
    for (let i = 0; i < 100; i++) {
      const m = (a + b) / 2, gm = g(m);
      if (!isFinite(gm)) return NaN;
      if (gm === 0) return m;
      if ((ga < 0) === (gm < 0)) { a = m; ga = gm; } else { b = m; gb = gm; }
      if (b - a < 1e-13 * (1 + Math.abs(a))) break;
    }
    return (a + b) / 2;
  }
  // Nullstellen von g im Fenster durch Vorzeichenwechsel (nur Stellen, an denen g stetig ist)
  function scanRoots(g, a, b, N) {
    N = N || 4000; const out = []; let px = a, pv = g(a);
    // Rundungsrauschen (z. B. f'' von |x| ist ±1e-16 statt 0) ist kein Vorzeichenwechsel
    let sc = 0; for (let i = 0; i <= 200; i++) { const v = g(a + (b - a) * i / 200); if (isFinite(v)) sc = Math.max(sc, Math.abs(v)); }
    const noise = 1e-9 * (1 + sc);
    for (let i = 1; i <= N; i++) {
      const x = a + (b - a) * i / N, v = g(x);
      if (isFinite(pv) && isFinite(v) && pv !== 0 && (pv < 0) !== (v < 0) && Math.max(Math.abs(pv), Math.abs(v)) > noise) {
        const r = bisect(g, px, x, pv, v);
        if (isFinite(r) && Math.abs(g(r)) < 1e-6 * (1 + Math.abs(pv) + Math.abs(v)) + 1e-9) out.push(r);
      } else if (isFinite(v) && v === 0 && isFinite(pv) && Math.abs(pv) > noise) out.push(x);
      px = x; pv = v;
    }
    return out.filter((r, i) => !i || Math.abs(r - out[i - 1]) > 1e-8);
  }
  // Stellen, an denen f' das Vorzeichen sprunghaft wechselt, f aber stetig ist (Knick, z. B. |x| bei 0)
  function scanKinks(f, g, a, b, N) {
    N = N || 2000; const out = []; let px = a, pv = g(a);
    for (let i = 1; i <= N; i++) {
      const x = a + (b - a) * i / N, v = g(x);
      if (!isFinite(v)) continue;                         // einzelne undefinierte Stelle (f' bei 0 für |x|) überspringen
      if (isFinite(pv) && (pv < 0) !== (v < 0) && pv !== 0 && v !== 0) {
        let lo = px, hi = x, gl = pv;
        for (let k = 0; k < 80 && hi - lo > 1e-13 * (1 + Math.abs(lo)); k++) { const m = (lo + hi) / 2, gm = g(m); if (!isFinite(gm)) { lo = hi = m; break; } if ((gm < 0) === (gl < 0)) { lo = m; gl = gm; } else hi = m; }
        const r = (lo + hi) / 2;
        const jump = Math.abs(g(r - 1e-7) - g(r + 1e-7)) > 1e-3 * (1 + Math.abs(pv) + Math.abs(v));
        const cont = isFinite(f(r)) && Math.abs(f(r - 1e-7) - f(r + 1e-7)) < 1e-5 * (1 + Math.abs(f(r)));
        if (isFinite(r) && jump && cont) {
          const rr = Math.abs(r - Math.round(r * 1e6) / 1e6) < 1e-8 ? Math.round(r * 1e6) / 1e6 : r;
          out.push(rr);
        }
      }
      px = x; pv = v;
    }
    return out;
  }
  const rootObj = (val, exactObj) => (exactObj || { val, tex: fmtT(val, 4), exact: false });
  function signAround(g, r, lo, hi) {                   // Vorzeichen links und rechts von r
    const d = Math.max(1e-6, Math.min(1e-3, Math.min(r - lo, hi - r) / 2 || 1e-3));
    return [Math.sign(g(r - d)), Math.sign(g(r + d))];
  }

  // ───────────────────── Analyse ─────────────────────
  function kd(F, win) {
    win = win || [-10, 10];
    const K = { F, win, poly: false, exact: false, zeros: [], crit: [], infl: [], sym: 'none', limits: null, mono: [], curv: [] };
    const f0 = F.f(0), f1 = F.f(1), f2 = F.f(2);
    const P = F.P && E.pDeg(F.P) >= 1 ? E.pTrim(F.P) : null;
    // Symmetrie
    if (P) {
      const ex = []; P.forEach((c, i) => { if (!E.qIsZero(c)) ex.push(i); });
      if (ex.every(i => i % 2 === 0)) K.sym = 'even'; else if (ex.every(i => i % 2 === 1)) K.sym = 'odd';
    } else {
      let ev = true, od = true, any = false;
      [0.3, 0.9, 1.7, 2.6, 4.1].forEach(x => { const a = f0(x), b = f0(-x); if (isFinite(a) && isFinite(b)) { any = true; if (Math.abs(a - b) > 1e-9 * (1 + Math.abs(a))) ev = false; if (Math.abs(a + b) > 1e-9 * (1 + Math.abs(a))) od = false; } });
      if (any) K.sym = ev ? 'even' : od ? 'odd' : 'none';
    }
    if (P) {
      K.poly = true; K.exact = true;
      const n = E.pDeg(P), lc = P[n], P1 = E.pDeriv(P), P2 = E.pDeriv(P1), P3 = E.pDeriv(P2);
      K.P = P; K.P1 = P1; K.P2 = P2; K.P3 = P3; K.deg = n;
      const sp = E.qSgn(lc);
      K.limits = { plus: sp > 0 ? 1 : -1, minus: (n % 2 === 0 ? sp : -sp) > 0 ? 1 : -1 };
      const rootsOf = (Q, label) => { const d = DOC(); const r = S.solvePoly(d, Q, {}); return { doc: d, roots: S.sortDedupe((r && r.roots) || []) }; };
      K.zerosRes = rootsOf(P); K.zeros = K.zerosRes.roots;
      if (E.pDeg(P1) >= 1) { K.r1 = rootsOf(P1); } else K.r1 = { doc: DOC(), roots: [] };
      if (E.pDeg(P2) >= 1) { K.r2 = rootsOf(P2); } else K.r2 = { doc: DOC(), roots: [] };
      const yAt = (r, Q) => (r.fe ? { fe: E.pEvalFe(Q, r.fe), exact: true, num: E.feNum(E.pEvalFe(Q, r.fe)) } : { fe: null, exact: false, num: E.pEvalNum(Q, r.val) });
      const yTex = y => (y.exact ? E.feTex(y.fe) : fmtT(y.num, 4));
      // Extrema
      const xs1 = K.r1.roots.map(r => r.val), nums1 = xs1;
      K.crit = K.r1.roots.map((r, i) => {
        const y = yAt(r, P), s2 = r.fe ? E.feSgn(E.pEvalFe(P2, r.fe)) : Math.sign(E.pEvalNum(P2, r.val));
        let type, how;
        if (s2 !== 0) { type = s2 < 0 ? 'max' : 'min'; how = 'f2'; }
        else {
          const [a, b] = signAround(F.f(1), r.val, i ? xs1[i - 1] : -Infinity, i < xs1.length - 1 ? xs1[i + 1] : Infinity);
          type = a > 0 && b < 0 ? 'max' : a < 0 && b > 0 ? 'min' : 'saddle'; how = 'sign';
        }
        return { x: r.val, xTex: r.tex, root: r, y: y.num, yTex: yTex(y), exact: !!(r.exact && y.exact), type, how, s2 };
      });
      // Wendepunkte
      const xs2 = K.r2.roots.map(r => r.val);
      K.infl = [];
      K.r2.roots.forEach((r, i) => {
        const [a, b] = signAround(F.f(2), r.val, i ? xs2[i - 1] : -Infinity, i < xs2.length - 1 ? xs2[i + 1] : Infinity);
        if (!(a * b < 0)) return;                                    // kein Vorzeichenwechsel von f'' → kein Wendepunkt
        const y = yAt(r, P), sl = yAt(r, P1), s3 = r.fe ? E.feSgn(E.pEvalFe(P3, r.fe)) : Math.sign(E.pEvalNum(P3, r.val));
        K.infl.push({ x: r.val, xTex: r.tex, root: r, y: y.num, yTex: yTex(y), slope: sl.num, slopeTex: yTex(sl), exact: !!(r.exact && y.exact), s3, saddle: Math.abs(sl.num) < 1e-9, from: a, to: b });
      });
    } else {
      // numerisch
      const [a, b] = win;
      K.zeros = scanRoots(f0, a, b).map(v => rootObj(v));
      const c1 = scanRoots(f1, a, b), c2 = scanRoots(f2, a, b);
      const kinks = scanKinks(f0, f1, a, b).filter(x => !c1.some(c => Math.abs(c - x) < 1e-6));
      K.crit = c1.map((x, i) => {
        const y = f0(x), s2 = Math.sign(f2(x)); let type = s2 < 0 ? 'max' : s2 > 0 ? 'min' : 'saddle';
        const [l, r] = signAround(f1, x, i ? c1[i - 1] : a, i < c1.length - 1 ? c1[i + 1] : b);
        if (l > 0 && r < 0) type = 'max'; else if (l < 0 && r > 0) type = 'min'; else if (l * r > 0) type = 'saddle';
        return { x, xTex: fmtT(x, 4), y, yTex: fmtT(y, 4), exact: false, type, how: 'sign', s2 };
      }).filter(c => isFinite(c.y));
      kinks.forEach(x => {                                   // Knick: f' springt mit Vorzeichenwechsel → Extremum ohne waagrechte Tangente
        const y = f0(x), [l, r] = [Math.sign(f1(x - 1e-6)), Math.sign(f1(x + 1e-6))];
        if (isFinite(y) && l * r < 0) K.crit.push({ x, xTex: fmtT(x, 4), y, yTex: fmtT(y, 4), exact: false, type: l > 0 ? 'max' : 'min', how: 'kink', s2: NaN, kink: true, from: l, to: r });
      });
      K.crit.sort((p, q) => p.x - q.x);
      K.infl = c2.filter(x => !kinks.some(k => Math.abs(k - x) < 1e-6)).map(x => ({ x, xTex: fmtT(x, 4), y: f0(x), yTex: fmtT(f0(x), 4), slope: f1(x), slopeTex: fmtT(f1(x), 4), exact: false, saddle: Math.abs(f1(x)) < 1e-6 })).filter(c => isFinite(c.y));
      K.fmin = F.f(0)(a);
    }
    // Intervalle (Monotonie / Krümmung)
    const intervals = (cuts, g, lo, hi) => {
      const pts = [lo].concat(cuts.filter(x => x > lo && x < hi), [hi]), out = [];
      for (let i = 0; i + 1 < pts.length; i++) {
        let m;
        if (!isFinite(pts[i]) && !isFinite(pts[i + 1])) m = 0; else if (!isFinite(pts[i])) m = pts[i + 1] - 1; else if (!isFinite(pts[i + 1])) m = pts[i] + 1; else m = (pts[i] + pts[i + 1]) / 2;
        let v = g(m); if (!isFinite(v)) { for (const t of [0.25, 0.75, 0.1, 0.9]) { const mm = isFinite(pts[i]) && isFinite(pts[i + 1]) ? pts[i] + (pts[i + 1] - pts[i]) * t : m; v = g(mm); if (isFinite(v)) break; } }
        out.push({ lo: pts[i], hi: pts[i + 1], sign: Math.sign(v) });
      }
      return out;
    };
    const lo = K.poly ? -Infinity : win[0], hi = K.poly ? Infinity : win[1];
    K.mono = intervals(K.crit.filter(c => c.type !== 'saddle' || true).map(c => c.x), f1, lo, hi);
    // Sattelstellen (f' ohne Vorzeichenwechsel) lassen das Vorzeichen unverändert → Intervalle gleichen Vorzeichens zusammenfassen
    K.mono = K.mono.reduce((acc, it) => { const l = acc[acc.length - 1]; if (l && l.sign === it.sign) l.hi = it.hi; else acc.push(Object.assign({}, it)); return acc; }, []);
    K.curv = intervals(K.infl.map(c => c.x), f2, lo, hi);
    return K;
  }

  // ───────────────────── Darstellung ─────────────────────
  const ptTex = (name, c) => name + '\\left(' + c.xTex + '\\,\\middle|\\,' + c.yTex + '\\right)';
  const approx = c => (c.exact ? '' : '\\approx ');
  const ptTexA = (name, c) => name + '\\left(' + (c.exact ? '' : '\\approx ') + c.xTex + '\\,\\middle|\\,' + (c.exact ? '' : '\\approx ') + c.yTex + '\\right)';
  const TYPE = { max: ['H', 'Hochpunkt'], min: ['T', 'Tiefpunkt'], saddle: ['S', 'Sattelpunkt'] };
  const bnd = (v, left) => (v === -Infinity ? '-\\infty' : v === Infinity ? '\\infty' : fmtT(v, 4));
  // Intervallgrenze als LaTeX: exakt, falls es eine Stelle der Liste ist
  const edgeTex = (v, list) => { if (v === -Infinity) return '-\\infty'; if (v === Infinity) return '\\infty'; const c = list.find(q => Math.abs(q.x - v) < 1e-9); return c ? c.xTex : fmtT(v, 4); };

  function signTable(K, which) {
    // Kopf: x < c1 | c1 | c1 < x < c2 | c2 | …; Zeilen: f' (oder f'') und f
    const cs = which === 'curv' ? K.infl : K.crit, ints = which === 'curv' ? K.curv : K.mono;
    const g = which === 'curv' ? "f''(x)" : "f'(x)";
    // alle Schnittstellen (auch Sattelstellen, damit die Tabelle zu den Stellen passt)
    const pts = cs.slice().sort((a, b) => a.x - b.x);
    const head = ['$x$'], r1 = ['$' + g + '$'], r2 = ['$f$'];
    const sgnAt = i => { // Vorzeichen im Abschnitt i (vor pts[i])
      // numerische Analyse: die Intervalle reichen nur über das Fenster (nicht bis ±∞)
      const lo = Math.max(i === 0 ? -Infinity : pts[i - 1].x, ints.length ? ints[0].lo : -Infinity), hi = Math.min(i === pts.length ? Infinity : pts[i].x, ints.length ? ints[ints.length - 1].hi : Infinity);
      const it = ints.find(q => q.lo <= lo + 1e-12 && q.hi >= hi - 1e-12);
      return it ? it.sign : 0;
    };
    const word = s => (which === 'curv' ? (s > 0 ? 'Linkskurve' : s < 0 ? 'Rechtskurve' : '–') : (s > 0 ? 'steigt' : s < 0 ? 'fällt' : '–'));
    for (let i = 0; i <= pts.length; i++) {
      const lo = i === 0 ? null : pts[i - 1], hi = i === pts.length ? null : pts[i];
      head.push('$' + (lo && hi ? lo.xTex + '<x<' + hi.xTex : lo ? 'x>' + lo.xTex : hi ? 'x<' + hi.xTex : '\\mathbb{R}') + '$');
      const s = sgnAt(i);
      r1.push('$' + sgnStr(s) + '$'); r2.push(word(s));
      if (hi) {
        head.push('$' + hi.xTex + '$'); r1.push(hi.kink ? 'n. d.' : '$0$');
        if (which === 'curv') r2.push(hi.saddle ? 'Terrassenpunkt' : 'Wendepunkt');
        else r2.push(TYPE[hi.type][1]);
      }
    }
    return { head, rows: [r1, r2] };
  }

  function kdDoc(K) {
    const d = DOC(), F = K.F;
    d.h('Die Funktion'); d.e('f(x)=' + tx(F.ast));
    if (!K.poly) d.note('Die Funktion ist kein Polynom: Nullstellen, Extrema und Wendepunkte werden numerisch im Fenster $[' + fmtT(K.win[0], 3) + ',' + fmtT(K.win[1], 3) + ']$ gesucht. Alle Werte sind Näherungen.');
    // 1 Symmetrie, Verhalten
    d.h('1. Symmetrie und Verhalten im Unendlichen');
    if (K.sym === 'even') d.p('Es kommen nur gerade Hochzahlen vor (bzw. $f(-x)=f(x)$): Der Graph ist **achsensymmetrisch** zur $y$-Achse.');
    else if (K.sym === 'odd') d.p('Es kommen nur ungerade Hochzahlen vor (bzw. $f(-x)=-f(x)$): Der Graph ist **punktsymmetrisch** zum Ursprung.');
    else d.p('Es ist keine einfache Symmetrie zu erkennen.');
    if (K.poly) {
      const s = v => (v > 0 ? '\\infty' : '-\\infty');
      d.e('x\\to\\infty:\\ f(x)\\to ' + s(K.limits.plus) + ',\\qquad x\\to-\\infty:\\ f(x)\\to ' + s(K.limits.minus), 'Verhalten im Unendlichen');
      d.note('Entscheidend ist der Summand mit der höchsten Hochzahl: $' + E.pTex(K.P.map((c, i) => (i === K.deg ? c : q0)), 'x') + '$.');
    }
    // 2 Achsenschnittpunkte
    d.h('2. Nullstellen und $y$-Achsenabschnitt');
    const y0 = F.f(0)(0);
    if (isFinite(y0)) d.e('f(0)=' + (K.poly ? E.qTex(K.P[0]) : fmtT(y0, 4)), 'y-Achsenabschnitt');
    if (K.poly) { const sd = DOC(); d.sub(K.zerosRes.doc); }
    if (K.zeros.length) d.res('Nullstellen: ' + K.zeros.map(z => '$x' + (z.exact === false ? '\\approx ' : '=') + z.tex + '$').join(', '));
    else d.res('Keine Nullstellen' + (K.poly ? '.' : ' im Fenster.'));
    // 3 Ableitungen
    d.h('3. Ableitungen');
    d.e("f'(x)=" + tx(F.deriv(1)));
    d.e("f''(x)=" + tx(F.deriv(2)));
    if (K.poly) d.e("f'''(x)=" + tx(F.deriv(3)));
    // 4 Extrema
    d.h('4. Extrema (Hoch- und Tiefpunkte)');
    d.p('**Notwendig:** $f\'(x)=0$ (waagrechte Tangente).');
    if (K.poly) { if (E.pDeg(K.P1) >= 1) d.sub(K.r1.doc); else d.e("f'(x)=" + E.qTex(K.P1[0] || q0) + '\\ne 0'); }
    if (!K.crit.length) d.res('Keine Extrema' + (K.poly ? '.' : ' im Fenster.'));
    else {
      d.p('**Hinreichend:** $f\'(x_0)=0$ und $f\'\'(x_0)<0$ ergibt ein Maximum, $f\'(x_0)=0$ und $f\'\'(x_0)>0$ ein Minimum (bei $f\'\'(x_0)=0$ entscheidet der Vorzeichenwechsel von $f\'$).');
      K.crit.forEach(c => {
        const sub = DOC();
        const x = c.xTex;
        if (c.how === 'kink') sub.p('Bei $x_0=' + x + '$ hat der Graph einen **Knick**: $f\'(x_0)$ existiert nicht, aber $f\'$ wechselt das Vorzeichen (von $' + sgnStr(c.from) + '$ nach $' + sgnStr(c.to) + '$) — ' + (c.type === 'max' ? 'Maximum' : 'Minimum') + ' ohne waagrechte Tangente.');
        else if (c.how === 'f2') sub.e("f''\\left(" + x + '\\right)=' + (K.poly && c.root.fe ? E.feTex(E.pEvalFe(K.P2, c.root.fe)) : fmtT(F.f(2)(c.x), 4)) + (c.s2 < 0 ? '<0' : '>0'), c.s2 < 0 ? 'Maximum' : 'Minimum');
        else sub.p('Hier ist $f\'\'(x_0)=0$: der Vorzeichenwechsel von $f\'$ entscheidet — ' + (c.type === 'saddle' ? 'kein Vorzeichenwechsel: **Sattelpunkt** (waagrechte Tangente ohne Extremum).' : c.type === 'max' ? 'Wechsel von $+$ nach $-$: Maximum.' : 'Wechsel von $-$ nach $+$: Minimum.'));
        sub.e('f\\left(' + x + '\\right)=' + c.yTex + (c.exact ? '' : '\\ (\\text{Näherung})'), 'y-Koordinate mit f');
        sub.res(ptTexA(TYPE[c.type][0], c).replace(/^/, '$') + '$ — ' + TYPE[c.type][1]);
        d.sub(sub);
      });
    }
    // 5 Wendepunkte
    d.h('5. Wendepunkte');
    d.p('**Notwendig:** $f\'\'(x)=0$. **Hinreichend:** $f\'\'$ wechselt das Vorzeichen (oder $f\'\'\'(x_0)\\ne0$).');
    if (K.poly) { if (E.pDeg(K.P2) >= 1) d.sub(K.r2.doc); else d.e("f''(x)=" + E.qTex(K.P2[0] || q0) + (E.qIsZero(K.P2[0] || q0) ? '' : '\\ne 0')); }
    if (!K.infl.length) d.res('Keine Wendepunkte' + (K.poly ? '.' : ' im Fenster.'));
    else K.infl.forEach(c => {
      const sub = DOC();
      if (K.poly && c.root.fe && c.s3 !== 0) sub.e("f'''\\left(" + c.xTex + '\\right)=' + E.feTex(E.pEvalFe(K.P3, c.root.fe)) + '\\ne 0', 'Wendestelle');
      else sub.p('$f\'\'$ wechselt bei $x_0$ das Vorzeichen (von $' + sgnStr(c.from) + '$ nach $' + sgnStr(c.to) + '$): **Wendestelle**.');
      sub.e('f\\left(' + c.xTex + '\\right)=' + c.yTex + (c.exact ? '' : '\\ (\\text{Näherung})'), 'y-Koordinate mit f');
      sub.e("f'\\left(" + c.xTex + '\\right)=' + c.slopeTex, 'Steigung der Wendetangente');
      sub.res((c.saddle ? ptTexA('S', c) : ptTexA('W', c)).replace(/^/, '$') + '$ — ' + (c.saddle ? 'Terrassenpunkt (Wendepunkt mit waagrechter Tangente)' : 'Wendepunkt'));
      d.sub(sub);
    });
    // 6 Tabellen
    d.h('6. Vorzeichentabellen');
    if (K.crit.length || K.mono.length) { const t = signTable(K, 'mono'); d.p('Monotonie (Vorzeichen von $f\'$):'); d.b.push({ k: 'tab', head: t.head, rows: t.rows }); }
    if (K.infl.length || K.curv.length) { const t = signTable(K, 'curv'); d.p('Krümmung (Vorzeichen von $f\'\'$):'); d.b.push({ k: 'tab', head: t.head, rows: t.rows }); }
    // 7 Ergebnis
    d.h('7. Ergebnis');
    const lines = [];
    K.crit.forEach(c => lines.push('$' + ptTexA(TYPE[c.type][0], c) + '$ — ' + TYPE[c.type][1]));
    K.infl.forEach(c => lines.push('$' + ptTexA(c.saddle ? 'S' : 'W', c) + '$ — ' + (c.saddle ? 'Terrassenpunkt' : 'Wendepunkt')));
    if (isFinite(y0)) lines.push('$S_y\\left(0\\,\\middle|\\,' + (K.poly ? E.qTex(K.P[0]) : fmtT(y0, 4)) + '\\right)$ — $y$-Achsenabschnitt');
    K.zeros.forEach((z, i) => lines.push('$N_{' + (i + 1) + '}\\left(' + (z.exact === false ? '\\approx ' : '') + z.tex + '\\,\\middle|\\,0\\right)$ — Nullstelle'));
    lines.forEach(l => d.p(l));
    return d;
  }

  function monoDoc(K) {
    const d = DOC(), F = K.F;
    d.h('Ableitungsfunktion'); d.e("f'(x)=" + tx(F.deriv(1)));
    d.p('Wo $f\'>0$ ist, **steigt** der Graph von $f$; wo $f\'<0$ ist, **fällt** er. Bei einer Nullstelle von $f\'$ mit Vorzeichenwechsel hat $f$ einen Hoch- oder Tiefpunkt.');
    if (K.crit.length || K.mono.length) { const t = signTable(K, 'mono'); d.b.push({ k: 'tab', head: t.head, rows: t.rows }); }
    K.crit.forEach(c => d.p('$' + ptTexA(TYPE[c.type][0], c) + '$ — ' + TYPE[c.type][1]));
    if (K.exact === false) d.note('Näherungswerte im sichtbaren Bereich.');
    return d;
  }

  Object.assign(Dif, { kd, kdDoc, monoDoc, signTable, scanRoots, TYPE, edgeTex });
})();
