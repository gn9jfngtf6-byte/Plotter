// ═══════════════════════════════════════════════════════════════════
// MODUL 16: calculus — SYMBOLISCHE Ableitung und (bereichsbeschränkte)
// unbestimmte Integration auf dem Rohausdruck-AST aus 14_mathinput.js.
//
// Wichtig: Dies ist KEIN vollständiges Computer-Algebra-System. Die
// Ableitung deckt IMMER alle unterstützten Ausdrucksformen ab (Summen-,
// Produkt-, Quotienten-, Ketten- und allgemeine Potenzregel). Die
// Integration ist bewusst auf einen begrenzten, aber für den Schul-
// gebrauch typischen Funktionsumfang beschränkt (Polynome, einfache
// Brüche, elementare Funktionen mit LINEAREM inneren Argument, a^x,
// sowie das Muster u'/u -> ln|u|). Wird kein Ergebnis gefunden, liefert
// calcIntegrate() null — der Aufrufer zeigt dann eine entsprechende
// Meldung statt eines falschen Ergebnisses an.
//
// AST-Knotenformen (identisch zu 14_mathinput.js):
//   {type:'num', v:'3'}            {type:'id', v:'x'}
//   {type:'call', name:'sin', args:[...]}
//   {type:'neg', x:...}
//   {type:'add'|'sub'|'mul'|'div'|'pow', a:..., b:...}
// ═══════════════════════════════════════════════════════════════════

// ---------- Konstruktoren ----------
function calcNum(v) {
  if (!isFinite(v)) v = 0;
  if (Math.abs(v - Math.round(v)) < 1e-9) return { type: 'num', v: String(Math.round(v)) };
  let s = v.toFixed(10);
  s = s.replace(/0+$/, '').replace(/\.$/, '');
  return { type: 'num', v: s };
}
function calcId(name) { return { type: 'id', v: name }; }
function calcNumVal(node) {
  if (!node || node.type !== 'num') return null;
  const v = parseFloat(node.v);
  return isFinite(v) ? v : null;
}
function calcGcd(a, b) {
  a = Math.round(Math.abs(a)); b = Math.round(Math.abs(b));
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}
// Erzeugt den Wert av/bv als EXAKTEN Knoten: bei ganzzahligem Ergebnis eine
// einzelne Zahl, bei ganzzahligen av/bv sonst einen gekürzten Bruch (div-Knoten,
// wird von miToRaw als "(Zähler)/(Nenner)" gedruckt und dank der Konvention in
// 14_mathinput.js hübsch als Bruch angezeigt) — NIE eine Dezimalnäherung wie
// 0.6666666667, die Genauigkeit vortäuscht/verliert. Nur wenn av oder bv selbst
// bereits nicht ganzzahlig ist (seltener Grenzfall), wird normal dezimal geteilt.
function calcFracFromInts(av, bv) {
  const g = calcGcd(av, bv) || 1;
  let na = av / g, nb = bv / g;
  if (nb < 0) { na = -na; nb = -nb; }
  if (nb === 1) return calcNum(na);
  return { type: 'div', a: calcNum(na), b: calcNum(nb) };
}
// Berechnet {n,d}^bv (bv ganzzahlig, auch negativ) als exakten Bruch-Knoten.
function calcFracPow(frac, bv) {
  const e = Math.abs(bv);
  const numPow = Math.pow(frac.n, e), denPow = Math.pow(frac.d, e);
  return bv >= 0 ? calcFracFromInts(numPow, denPow) : calcFracFromInts(denPow, numPow);
}
function calcFracNum(av, bv) {
  if (bv === 0) return calcNum(av / bv); // Division durch 0: Grenzfall unverändert durchreichen
  if (Number.isInteger(av) && Number.isInteger(bv)) return calcFracFromInts(av, bv);
  return calcNum(av / bv);
}
// Ist node ein reiner Zahlenbruch (Zähler UND Nenner beide 'num')? Wird als
// bereits fertig vereinfachte Koeffizientenform behandelt (siehe calcSimplify
// 'mul'), damit sich die Bruch-Herausziehen-Regel nicht mit der Zähler-
// Kürzungsregel im 'div'-Fall gegenseitig endlos aufschaukelt.
function calcIsNumFrac(node) {
  return !!node && node.type === 'div' && node.a.type === 'num' && node.b.type === 'num';
}
// Liest node als exakten rationalen Wert {n,d} (Zähler/Nenner, beide ganzzahlig)
// aus — für eine einzelne ganzzahlige 'num' oder einen reinen Zahlenbruch. Sonst
// null (kein bekannter exakter Bruch, z.B. weil eine Variable beteiligt ist).
function calcAsFrac(node) {
  if (!node) return null;
  if (node.type === 'num') {
    const v = parseFloat(node.v);
    if (!isFinite(v) || !Number.isInteger(v)) return null;
    return { n: v, d: 1 };
  }
  if (calcIsNumFrac(node)) return { n: parseFloat(node.a.v), d: parseFloat(node.b.v) };
  return null;
}
// Sammelt rekursiv alle Faktoren einer Mal-/Vorzeichen-Kette ein (löst dabei
// auch verschachtelte 'neg' auf und zählt deren Vorzeichen in signRef.sign
// zusammen) — Grundlage für die Koeffizienten-Sammlung in calcSimplify('mul').
function calcCollectMulFactors(node, out, signRef) {
  if (node.type === 'mul') { calcCollectMulFactors(node.a, out, signRef); calcCollectMulFactors(node.b, out, signRef); return; }
  if (node.type === 'neg') { signRef.sign *= -1; calcCollectMulFactors(node.x, out, signRef); return; }
  out.push(node);
}

// ---------- Enthält Variable? (rein strukturell) ----------
function calcContainsVar(node, name) {
  if (!node) return false;
  switch (node.type) {
    case 'num': return false;
    case 'id': return node.v === name;
    case 'call': return node.args.some(a => calcContainsVar(a, name));
    case 'neg': return calcContainsVar(node.x, name);
    default: return calcContainsVar(node.a, name) || calcContainsVar(node.b, name);
  }
}

// ---------- Strukturelle Substitution (exakt, keine Numerik) ----------
function calcSubstitute(node, name, repl) {
  switch (node.type) {
    case 'num': return node;
    case 'id': return node.v === name ? repl : node;
    case 'call': return { type: 'call', name: node.name, args: node.args.map(a => calcSubstitute(a, name, repl)) };
    case 'neg': return { type: 'neg', x: calcSubstitute(node.x, name, repl) };
    default: return { type: node.type, a: calcSubstitute(node.a, name, repl), b: calcSubstitute(node.b, name, repl) };
  }
}

// ---------- Strukturelle Gleichheit (numerisch tolerant, kommutativ bei +/·) ----------
function calcEqual(n1, n2) {
  if (!n1 || !n2) return false;
  if (n1.type === 'num' && n2.type === 'num') {
    const v1 = parseFloat(n1.v), v2 = parseFloat(n2.v);
    return Math.abs(v1 - v2) < 1e-9 * Math.max(1, Math.abs(v1), Math.abs(v2));
  }
  if (n1.type !== n2.type) return false;
  switch (n1.type) {
    case 'id': return n1.v === n2.v;
    case 'call':
      return n1.name === n2.name && n1.args.length === n2.args.length &&
             n1.args.every((a, i) => calcEqual(a, n2.args[i]));
    case 'neg': return calcEqual(n1.x, n2.x);
    case 'add': case 'mul':
      return (calcEqual(n1.a, n2.a) && calcEqual(n1.b, n2.b)) ||
             (calcEqual(n1.a, n2.b) && calcEqual(n1.b, n2.a));
    case 'sub': case 'div': case 'pow':
      return calcEqual(n1.a, n2.a) && calcEqual(n1.b, n2.b);
    default: return false;
  }
}

// ---------- Vereinfachung (Konstantenfaltung + einfache Identitäten) ----------
function calcSimplify(node) {
  if (!node) return node;
  if (node.type === 'num' || node.type === 'id') return node;

  if (node.type === 'call') {
    const args = node.args.map(calcSimplify);
    if (args.length === 1) {
      const v = calcNumVal(args[0]);
      if (v != null) {
        if (node.name === 'sin' && v === 0) return calcNum(0);
        if (node.name === 'cos' && v === 0) return calcNum(1);
        if (node.name === 'exp' && v === 0) return calcNum(1);
        if (node.name === 'log' && v === 1) return calcNum(0);
        if (node.name === 'sqrt' && v === 0) return calcNum(0);
        if (node.name === 'sqrt' && v >= 0) {
          const r = Math.sqrt(v);
          if (Math.abs(r - Math.round(r)) < 1e-9) return calcNum(Math.round(r));
        }
      }
    }
    return { type: 'call', name: node.name, args };
  }

  if (node.type === 'neg') {
    const x = calcSimplify(node.x);
    if (x.type === 'num') return calcNum(-parseFloat(x.v));
    if (x.type === 'neg') return x.x;
    // Vorzeichen in den Zähler eines Bruchs hineinziehen: -(A/B) -> (-A)/B — nötig
    // damit verschachtelte Brüche (z.B. "-(x^4/4)/6") sich zu einem Bruch mit
    // zusammengefasstem Nenner vereinfachen können (siehe 'div'-Fall unten).
    if (x.type === 'div') return calcSimplify({ type: 'div', a: { type: 'neg', x: x.a }, b: x.b });
    return { type: 'neg', x };
  }

  const a = calcSimplify(node.a), b = calcSimplify(node.b);
  const av = calcNumVal(a), bv = calcNumVal(b);

  switch (node.type) {
    case 'add': {
      if (av === 0) return b;
      if (bv === 0) return a;
      { const fa = calcAsFrac(a), fb = calcAsFrac(b);
        if (fa && fb) return calcFracFromInts(fa.n * fb.d + fb.n * fa.d, fa.d * fb.d); }
      if (av != null && bv != null) return calcNum(av + bv);
      if (b.type === 'neg') return calcSimplify({ type: 'sub', a, b: b.x });
      if (calcEqual(a, b)) return calcSimplify({ type: 'mul', a: calcNum(2), b: a });
      return { type: 'add', a, b };
    }
    case 'sub': {
      if (bv === 0) return a;
      if (av === 0) return calcSimplify({ type: 'neg', x: b });
      { const fa = calcAsFrac(a), fb = calcAsFrac(b);
        if (fa && fb) return calcFracFromInts(fa.n * fb.d - fb.n * fa.d, fa.d * fb.d); }
      if (av != null && bv != null) return calcNum(av - bv);
      if (calcEqual(a, b)) return calcNum(0);
      if (b.type === 'neg') return calcSimplify({ type: 'add', a, b: b.x });
      return { type: 'sub', a, b };
    }
    case 'mul': {
      if (av === 0 || bv === 0) return calcNum(0);
      // Bruch (mit variablem Anteil) als Faktor nach aussen ziehen: c*(P/Q) -> (c*P)/Q,
      // (P/Q)*c -> (c*P)/Q (typisches Muster bei Stammfunktionen, z.B.
      // "a*(x^3/3)" -> "(a*x^3)/3"). AUSNAHME: ist der Bruch selbst schon ein reiner
      // Zahlenbruch (z.B. 1/2 als Koeffizient), NICHT herausziehen — das ist bereits
      // die Endform, und ein Herausziehen würde mit der Koeffizienten-Sammlung unten
      // in eine Endlosschleife laufen (hin und her zwischen beiden Darstellungen).
      if (a.type === 'div' && !calcIsNumFrac(a)) return calcSimplify({ type: 'div', a: { type: 'mul', a: a.a, b }, b: a.b });
      if (b.type === 'div' && !calcIsNumFrac(b)) return calcSimplify({ type: 'div', a: { type: 'mul', a, b: b.a }, b: b.b });

      // Alle Zahlen-/Bruch-Faktoren der GESAMTEN Mal-Kette einsammeln (auch nicht
      // direkt benachbarte, z.B. "(1/2)*a*2*x" -> "a*x") und zu EINEM Koeffizienten
      // zusammenfassen; die restlichen (variablen) Faktoren bleiben als Produkt stehen.
      const factors = [];
      const signRef = { sign: 1 };
      calcCollectMulFactors(a, factors, signRef);
      calcCollectMulFactors(b, factors, signRef);
      let coefN = signRef.sign, coefD = 1, anyFrac = false;
      const rest = [];
      for (const f of factors) {
        const fr = calcAsFrac(f);
        if (fr) { coefN *= fr.n; coefD *= fr.d; anyFrac = true; }
        else rest.push(f);
      }
      if (anyFrac) {
        const coef = calcFracFromInts(coefN, coefD);
        const coefVal = calcNumVal(coef);
        const restNode = rest.length ? rest.reduce((acc, f) => acc ? { type: 'mul', a: acc, b: f } : f) : null;
        if (coefVal === 0) return calcNum(0);
        if (coefVal === 1) return restNode || calcNum(1);
        if (coefVal === -1) return restNode ? { type: 'neg', x: restNode } : calcNum(-1);
        return restNode ? { type: 'mul', a: coef, b: restNode } : coef;
      }
      if (bv != null && av == null) return { type: 'mul', a: b, b: a }; // Zahl nach vorn
      return { type: 'mul', a, b };
    }
    case 'div': {
      if (av === 0) return calcNum(0);
      if (bv === 1) return a;
      if (bv === -1) return calcSimplify({ type: 'neg', x: a });
      if (av != null && bv != null && bv !== 0) return calcFracNum(av, bv);
      if (calcEqual(a, b)) return calcNum(1);
      // Verschachtelte Brüche zusammenziehen: (A/B)/C -> A/(B*C),  A/(B/C) -> (A*C)/B
      // (typisches Muster bei Stammfunktionen, z.B. "(x^4/4)/3" -> "x^4/12")
      if (a.type === 'div') return calcSimplify({ type: 'div', a: a.a, b: { type: 'mul', a: a.b, b } });
      if (b.type === 'div') return calcSimplify({ type: 'div', a: { type: 'mul', a, b: b.b }, b: b.a });
      // Division über Summen/Differenzen verteilen — NUR wenn C eine reine Zahl
      // (bzw. ein Zahlenbruch) ist: (A±B)/c -> A/c ± B/c, dann vereinfacht sich
      // jeder Summand einzeln (typisch bei Polynom-Stammfunktionen, z.B. "/4").
      // Bei einem VARIABLEN Nenner (z.B. Quotientenregel-Ergebnisse mit "/(x-2)^2")
      // NICHT verteilen — das würde eine einzelne saubere Bruch-Darstellung nur in
      // mehrere Brüche mit demselben Nenner zerlegen, ohne dass sich etwas kürzt.
      if ((a.type === 'add' || a.type === 'sub') && calcAsFrac(b)) {
        return calcSimplify({ type: a.type, a: { type: 'div', a: a.a, b }, b: { type: 'div', a: a.b, b } });
      }
      // Zähler mit numerischem (ggf. bruchartigem) Faktor mit dem Nenner verrechnen:
      // (c*rest)/d -> (c/d)*rest  (typisch z.B. "(9*x^2)/9" -> "x^2", "((3/2)*x^2)/4" -> "(3/8)*x^2")
      if (a.type === 'mul') {
        const bFrac = calcAsFrac(b);
        if (bFrac) {
          const aFracA = calcAsFrac(a.a);
          if (aFracA) return calcSimplify({ type: 'mul', a: calcFracFromInts(aFracA.n * bFrac.d, aFracA.d * bFrac.n), b: a.b });
          const aFracB = calcAsFrac(a.b);
          if (aFracB) return calcSimplify({ type: 'mul', a: calcFracFromInts(aFracB.n * bFrac.d, aFracB.d * bFrac.n), b: a.a });
        }
      }
      // Nenner mit numerischem Faktor mit dem Zähler verrechnen: c/(d*rest) -> (c/d)/rest
      // (typisch z.B. "-12/(16*x^2)" -> "(-3/4)/x^2")
      if (b.type === 'mul') {
        const aFrac = calcAsFrac(a);
        if (aFrac) {
          const combine = (factor, rest) => {
            const bFrac = calcAsFrac(factor);
            if (!bFrac) return null;
            let n = aFrac.n * bFrac.d, d = aFrac.d * bFrac.n;
            const g = calcGcd(n, d) || 1;
            if (g <= 1) return null; // nichts kürzbar -> Regel NICHT anwenden (sonst Endlosschleife)
            n /= g; d /= g;
            if (d < 0) { n = -n; d = -d; }
            return calcSimplify({ type: 'div', a: calcNum(n), b: d === 1 ? rest : { type: 'mul', a: calcNum(d), b: rest } });
          };
          const r1 = combine(b.a, b.b); if (r1) return r1;
          const r2 = combine(b.b, b.a); if (r2) return r2;
        }
      }
      return { type: 'div', a, b };
    }
    case 'pow': {
      if (bv === 0) return calcNum(1);
      if (bv === 1) return a;
      if (av === 0) return calcNum(0);
      if (av === 1) return calcNum(1);
      if (av != null && bv != null && Number.isInteger(bv) && Math.abs(bv) <= 20) {
        const r = Math.pow(av, bv);
        if (isFinite(r)) return calcNum(r);
      }
      // Potenz über einen ganzzahligen Zahlenfaktor verteilen: (c*rest)^n -> c^n*rest^n
      // (typisch bei Ableitungen von Ausdrücken wie "3/(4*x)" -> Nenner "(4*x)^2" -> "16*x^2")
      if (Number.isInteger(bv) && Math.abs(bv) <= 20 && a.type === 'mul') {
        const fracA = calcAsFrac(a.a);
        if (fracA) return calcSimplify({ type: 'mul', a: calcFracPow(fracA, bv), b: { type: 'pow', a: a.b, b } });
        const fracB = calcAsFrac(a.b);
        if (fracB) return calcSimplify({ type: 'mul', a: calcFracPow(fracB, bv), b: { type: 'pow', a: a.a, b } });
      }
      return { type: 'pow', a, b };
    }
  }
  return node;
}

// ---------- Vorverarbeitung: nthroot/log10/logn/logbase auf pow/div/log zurückführen ----------
function calcDesugar(node) {
  if (!node) return node;
  switch (node.type) {
    case 'num': case 'id': return node;
    case 'neg': return { type: 'neg', x: calcDesugar(node.x) };
    case 'call': {
      const args = node.args.map(calcDesugar);
      if (node.name === 'nthroot') {
        return { type: 'pow', a: args[0], b: { type: 'div', a: calcNum(1), b: args[1] } };
      }
      if (node.name === 'log10') {
        return { type: 'div', a: { type: 'call', name: 'log', args: [args[0]] }, b: { type: 'call', name: 'log', args: [calcNum(10)] } };
      }
      if (node.name === 'logn' || node.name === 'logbase') {
        return { type: 'div', a: { type: 'call', name: 'log', args: [args[0]] }, b: { type: 'call', name: 'log', args: [args[1]] } };
      }
      return { type: 'call', name: node.name, args };
    }
    default:
      return { type: node.type, a: calcDesugar(node.a), b: calcDesugar(node.b) };
  }
}

// ---------- Symbolische Ableitung (immer definiert für unterstützte Grammatik) ----------
function calcDiffRaw(node, v) {
  switch (node.type) {
    case 'num': return calcNum(0);
    case 'id': return calcNum(node.v === v ? 1 : 0);
    case 'neg': return { type: 'neg', x: calcDiffRaw(node.x, v) };
    case 'add': return { type: 'add', a: calcDiffRaw(node.a, v), b: calcDiffRaw(node.b, v) };
    case 'sub': return { type: 'sub', a: calcDiffRaw(node.a, v), b: calcDiffRaw(node.b, v) };
    case 'mul': {
      const da = calcDiffRaw(node.a, v), db = calcDiffRaw(node.b, v);
      return { type: 'add', a: { type: 'mul', a: da, b: node.b }, b: { type: 'mul', a: node.a, b: db } };
    }
    case 'div': {
      const da = calcDiffRaw(node.a, v), db = calcDiffRaw(node.b, v);
      return {
        type: 'div',
        a: { type: 'sub', a: { type: 'mul', a: da, b: node.b }, b: { type: 'mul', a: node.a, b: db } },
        b: { type: 'pow', a: node.b, b: calcNum(2) }
      };
    }
    case 'pow': {
      const aHasV = calcContainsVar(node.a, v), bHasV = calcContainsVar(node.b, v);
      if (!bHasV) {
        const da = calcDiffRaw(node.a, v);
        return { type: 'mul', a: { type: 'mul', a: node.b, b: { type: 'pow', a: node.a, b: { type: 'sub', a: node.b, b: calcNum(1) } } }, b: da };
      }
      if (!aHasV) {
        const db = calcDiffRaw(node.b, v);
        return { type: 'mul', a: { type: 'mul', a: node, b: { type: 'call', name: 'log', args: [node.a] } }, b: db };
      }
      const da = calcDiffRaw(node.a, v), db = calcDiffRaw(node.b, v);
      return {
        type: 'mul', a: node, b: {
          type: 'add',
          a: { type: 'mul', a: db, b: { type: 'call', name: 'log', args: [node.a] } },
          b: { type: 'mul', a: node.b, b: { type: 'div', a: da, b: node.a } }
        }
      };
    }
    case 'call': {
      const u = node.args[0];
      const du = calcDiffRaw(u, v);
      switch (node.name) {
        case 'sin': return { type: 'mul', a: { type: 'call', name: 'cos', args: [u] }, b: du };
        case 'cos': return { type: 'neg', x: { type: 'mul', a: { type: 'call', name: 'sin', args: [u] }, b: du } };
        case 'tan': return { type: 'div', a: du, b: { type: 'pow', a: { type: 'call', name: 'cos', args: [u] }, b: calcNum(2) } };
        case 'sqrt': return { type: 'div', a: du, b: { type: 'mul', a: calcNum(2), b: { type: 'call', name: 'sqrt', args: [u] } } };
        case 'abs': return { type: 'mul', a: du, b: { type: 'div', a: u, b: { type: 'call', name: 'abs', args: [u] } } };
        case 'log': return { type: 'div', a: du, b: u };
        case 'exp': return { type: 'mul', a: { type: 'call', name: 'exp', args: [u] }, b: du };
        case 'asin': return { type: 'div', a: du, b: { type: 'call', name: 'sqrt', args: [{ type: 'sub', a: calcNum(1), b: { type: 'pow', a: u, b: calcNum(2) } }] } };
        case 'acos': return { type: 'neg', x: { type: 'div', a: du, b: { type: 'call', name: 'sqrt', args: [{ type: 'sub', a: calcNum(1), b: { type: 'pow', a: u, b: calcNum(2) } }] } } };
        case 'atan': return { type: 'div', a: du, b: { type: 'add', a: calcNum(1), b: { type: 'pow', a: u, b: calcNum(2) } } };
        default: return calcNum(0); // nach calcDesugar() nicht mehr erreichbar
      }
    }
    default: return calcNum(0);
  }
}

// Eigene (immer korrekte) Ableitung ohne Nerdamer-Politur — wird intern von
// calcIsLinear() verwendet (schnell, kein Nerdamer-Roundtrip nötig) sowie als
// Rückfallebene von calcDiff(), falls Nerdamer nicht verfügbar ist oder das
// Politur-Ergebnis den Numerik-Check nicht besteht.
function calcDiffOwn(node, v) {
  v = v || 'x';
  return calcSimplify(calcDiffRaw(calcDesugar(node), v));
}

// Prüft ob node AFFIN (linear) in v ist: node = m*v + k, mit m,k evtl. selbst
// symbolische (parameterabhängige) Teilausdrücke, aber ohne v. Rein symbolisch
// über die Ableitung + Einsetzen v=0 bestimmt — funktioniert daher auch bei
// Parametern (a, b, …) korrekt, ohne sie an aktuelle Schieberwerte zu binden.
function calcIsLinear(node, v) {
  v = v || 'x';
  if (!calcContainsVar(node, v)) return null;
  const d = calcDiffOwn(node, v);
  if (calcContainsVar(d, v)) return null;
  const k = calcSimplify(calcSubstitute(node, v, calcNum(0)));
  if (calcContainsVar(k, v)) return null;
  return { m: d, k };
}

// ---------- Unbestimmte Integration (bereichsbeschränkt) ----------
// node MUSS bereits über calcDesugar() vorverarbeitet sein (siehe calcIntegrate).
function calcAntiderivRaw(node, v) {
  if (!calcContainsVar(node, v)) {
    return { type: 'mul', a: node, b: calcId(v) };
  }
  switch (node.type) {
    case 'id': // enthält v und ist id -> muss v selbst sein
      return { type: 'div', a: { type: 'pow', a: node, b: calcNum(2) }, b: calcNum(2) };
    case 'neg': {
      const r = calcAntiderivRaw(node.x, v);
      return r ? { type: 'neg', x: r } : null;
    }
    case 'add': {
      const ra = calcAntiderivRaw(node.a, v), rb = calcAntiderivRaw(node.b, v);
      return (ra && rb) ? { type: 'add', a: ra, b: rb } : null;
    }
    case 'sub': {
      const ra = calcAntiderivRaw(node.a, v), rb = calcAntiderivRaw(node.b, v);
      return (ra && rb) ? { type: 'sub', a: ra, b: rb } : null;
    }
    case 'mul': {
      const aHas = calcContainsVar(node.a, v), bHas = calcContainsVar(node.b, v);
      if (!aHas) { const r = calcAntiderivRaw(node.b, v); return r ? { type: 'mul', a: node.a, b: r } : null; }
      if (!bHas) { const r = calcAntiderivRaw(node.a, v); return r ? { type: 'mul', a: node.b, b: r } : null; }
      return null; // Produkt zweier v-abhängiger Faktoren: ausserhalb des Funktionsumfangs
    }
    case 'div': {
      const aHas = calcContainsVar(node.a, v), bHas = calcContainsVar(node.b, v);
      if (!bHas) { const r = calcAntiderivRaw(node.a, v); return r ? { type: 'div', a: r, b: node.b } : null; }
      // Muster u'/u -> ln|u|
      const dB = calcSimplify(calcDiffRaw(node.b, v));
      if (calcEqual(calcSimplify(node.a), dB)) {
        return { type: 'call', name: 'log', args: [{ type: 'call', name: 'abs', args: [node.b] }] };
      }
      // konstanter Zähler / linearer Nenner: c/(mx+k) -> (c/m)*ln|mx+k|
      if (!aHas) {
        const lin = calcIsLinear(node.b, v);
        if (lin) {
          return { type: 'mul', a: { type: 'div', a: node.a, b: lin.m }, b: { type: 'call', name: 'log', args: [{ type: 'call', name: 'abs', args: [node.b] }] } };
        }
      }
      return null;
    }
    case 'pow': {
      const aHas = calcContainsVar(node.a, v), bHas = calcContainsVar(node.b, v);
      if (!bHas) {
        const nVal = calcNumVal(calcSimplify(node.b));
        const lin = calcIsLinear(node.a, v);
        if (lin) {
          if (nVal != null && Math.abs(nVal + 1) < 1e-9) {
            return { type: 'mul', a: { type: 'div', a: calcNum(1), b: lin.m }, b: { type: 'call', name: 'log', args: [{ type: 'call', name: 'abs', args: [node.a] }] } };
          }
          const newExp = { type: 'add', a: node.b, b: calcNum(1) };
          return { type: 'div', a: { type: 'pow', a: node.a, b: newExp }, b: { type: 'mul', a: lin.m, b: newExp } };
        }
        return null;
      }
      if (!aHas) {
        const lin = calcIsLinear(node.b, v);
        if (lin) {
          return { type: 'div', a: node, b: { type: 'mul', a: lin.m, b: { type: 'call', name: 'log', args: [node.a] } } };
        }
        return null;
      }
      return null; // beide Basis UND Exponent hängen von v ab -> ausserhalb des Funktionsumfangs
    }
    case 'call': {
      const u = node.args[0];
      const lin = calcIsLinear(u, v);
      if (!lin) return null; // inneres Argument nicht linear -> i.A. keine elementare Stammfunktion
      let base;
      switch (node.name) {
        case 'sin': base = { type: 'neg', x: { type: 'call', name: 'cos', args: [u] } }; break;
        case 'cos': base = { type: 'call', name: 'sin', args: [u] }; break;
        case 'tan': base = { type: 'neg', x: { type: 'call', name: 'log', args: [{ type: 'call', name: 'abs', args: [{ type: 'call', name: 'cos', args: [u] }] }] } }; break;
        case 'sqrt': base = { type: 'mul', a: { type: 'div', a: calcNum(2), b: calcNum(3) }, b: { type: 'pow', a: u, b: { type: 'div', a: calcNum(3), b: calcNum(2) } } }; break;
        case 'abs': base = { type: 'div', a: { type: 'mul', a: u, b: { type: 'call', name: 'abs', args: [u] } }, b: calcNum(2) }; break;
        case 'log': base = { type: 'sub', a: { type: 'mul', a: u, b: { type: 'call', name: 'log', args: [u] } }, b: u }; break;
        case 'exp': base = { type: 'call', name: 'exp', args: [u] }; break;
        case 'asin': base = { type: 'add', a: { type: 'mul', a: u, b: { type: 'call', name: 'asin', args: [u] } }, b: { type: 'call', name: 'sqrt', args: [{ type: 'sub', a: calcNum(1), b: { type: 'pow', a: u, b: calcNum(2) } }] } }; break;
        case 'acos': base = { type: 'sub', a: { type: 'mul', a: u, b: { type: 'call', name: 'acos', args: [u] } }, b: { type: 'call', name: 'sqrt', args: [{ type: 'sub', a: calcNum(1), b: { type: 'pow', a: u, b: calcNum(2) } }] } }; break;
        case 'atan': base = { type: 'sub', a: { type: 'mul', a: u, b: { type: 'call', name: 'atan', args: [u] } }, b: { type: 'mul', a: { type: 'div', a: calcNum(1), b: calcNum(2) }, b: { type: 'call', name: 'log', args: [{ type: 'add', a: calcNum(1), b: { type: 'pow', a: u, b: calcNum(2) } }] } } }; break;
        default: return null;
      }
      return { type: 'div', a: base, b: lin.m };
    }
    default: return null;
  }
}

// Eigene (bereichsbeschränkte) Stammfunktion — Rückfallebene, falls Nerdamer
// nicht verfügbar ist oder für einen Ausdruck kein (verifiziert korrektes)
// Ergebnis liefert.
function calcIntegrateOwn(node, v) {
  v = v || 'x';
  const des = calcDesugar(node);
  const r = calcAntiderivRaw(des, v);
  return r ? calcSimplify(r) : null;
}

// ═══════════════════════════════════════════════════════════════════
// Nerdamer-Brücke: unser Rohausdruck-AST <-> Nerdamer-Eingabe/Ausgabe-Strings.
// Nerdamer (CDN, siehe index.html) wird NUR für zwei Dinge benutzt:
//   1. Vereinfachung eines bereits (von unserer EIGENEN, nachweislich
//      korrekten calcDiffRaw) berechneten Ableitungsausdrucks — Nerdamer wird
//      NIE selbst zum Ableiten aufgerufen (bestätigte Nerdamer-Bugs bei
//      konstanter Exponentenbasis und logarithmischer Basis wechseln, siehe
//      unten).
//   2. nerdamer.integrate() — deutlich leistungsfähiger als unsere eigene
//      Engine (partielle Integration, Partialbruchzerlegung, …). Das Ergebnis
//      wird IMMER numerisch gegen die Ursprungsfunktion verifiziert (siehe
//      calcNumericAgree) — bei Abweichung (bestätigt z.B. bei
//      integrate('1/(1+cos(x))') -> fälschlich log(1+cos(x))) wird verworfen
//      und auf die eigene Engine zurückgefallen, statt ein falsches Ergebnis
//      anzuzeigen.
// ═══════════════════════════════════════════════════════════════════

// ---------- unser AST -> Nerdamer-Eingabestring ----------
function ndFromAst(node) {
  switch (node.type) {
    case 'num': return node.v;
    case 'id': return node.v === 'EC' ? 'e' : node.v;
    case 'neg': return '(-(' + ndFromAst(node.x) + '))';
    case 'add': return '(' + ndFromAst(node.a) + '+' + ndFromAst(node.b) + ')';
    case 'sub': return '(' + ndFromAst(node.a) + '-' + ndFromAst(node.b) + ')';
    case 'mul': return '(' + ndFromAst(node.a) + '*' + ndFromAst(node.b) + ')';
    case 'div': return '(' + ndFromAst(node.a) + '/' + ndFromAst(node.b) + ')';
    case 'pow': return '((' + ndFromAst(node.a) + ')^(' + ndFromAst(node.b) + '))';
    case 'call': {
      switch (node.name) {
        case 'nthroot': return '((' + ndFromAst(node.args[0]) + ')^(1/(' + ndFromAst(node.args[1]) + ')))';
        // WICHTIG: NIEMALS Nerdamers eingebaute 2-Argument log(x,b)-Syntax an
        // diff()/integrate() übergeben — bestätigter Nerdamer-Bug: sowohl
        // diff('log(x,3)','x') als auch integrate('log(x,3)','x') ignorieren
        // die Basis b bei der eigentlichen Rechnung (liefern falsche Werte, als
        // wäre es natürlicher Logarithmus). Stattdessen algebraisch als
        // log(x)/log(b) ausdrücken — das rechnet Nerdamer nachweislich korrekt
        // (log(b) wird dann nur als gewöhnliche Konstante behandelt).
        case 'log10': return '(log(' + ndFromAst(node.args[0]) + ')/log(10))';
        case 'logn': case 'logbase': return '(log(' + ndFromAst(node.args[0]) + ')/log(' + ndFromAst(node.args[1]) + '))';
        default: return node.name + '(' + node.args.map(ndFromAst).join(',') + ')';
      }
    }
    default: throw new Error('ndFromAst: unbekannter Typ ' + node.type);
  }
}

// ---------- Permissiver Parser für Nerdamer-Ausgabe ----------
// Wie miParse (14_mathinput.js), aber JEDE id gefolgt von '(' wird als
// Funktionsaufruf akzeptiert (nicht nur eine feste Namensliste) — Nerdamer
// kann Funktionsnamen ausgeben, die unser eigener Parser (noch) nicht kennt
// (sec, csc, cot, log mit 2 Argumenten für log_b).
function ndParse(tokens) {
  let p = 0;
  function peek() { return tokens[p]; }
  function next() { return tokens[p++]; }
  function expect(t) {
    if (!peek() || peek().t !== t) throw new Error('nd Parse-Fehler: erwartet "' + t + '", gefunden ' + JSON.stringify(peek()) + ' bei ' + p);
    return next();
  }
  function parseExpr() {
    let node = parseTerm();
    while (peek() && (peek().t === '+' || peek().t === '-')) {
      const op = next().t;
      const rhs = parseTerm();
      node = { type: op === '+' ? 'add' : 'sub', a: node, b: rhs };
    }
    return node;
  }
  function parseTerm() {
    let node = parseUnary();
    while (peek() && (peek().t === '*' || peek().t === '/' || canStartPrimary(peek()))) {
      if (peek().t === '*' || peek().t === '/') {
        const op = next().t;
        const rhs = parseUnary();
        node = { type: op === '*' ? 'mul' : 'div', a: node, b: rhs };
      } else {
        const rhs = parseUnary();
        node = { type: 'mul', a: node, b: rhs };
      }
    }
    return node;
  }
  function canStartPrimary(tok) { return !!tok && (tok.t === 'num' || tok.t === 'id' || tok.t === '('); }
  function parseUnary() {
    if (peek() && peek().t === '-') { next(); return { type: 'neg', x: parseUnary() }; }
    return parsePower();
  }
  function parsePower() {
    let node = parsePrimary();
    if (peek() && peek().t === '^') { next(); const exp = parseUnary(); node = { type: 'pow', a: node, b: exp }; }
    return node;
  }
  function parsePrimary() {
    const tok = peek();
    if (!tok) throw new Error('nd Parse-Fehler: unerwartetes Ende');
    if (tok.t === 'num') { next(); return { type: 'num', v: tok.v }; }
    if (tok.t === '(') { next(); const inner = parseExpr(); expect(')'); return inner; }
    if (tok.t === 'id') {
      next();
      if (peek() && peek().t === '(') {
        next();
        const args = [];
        if (!(peek() && peek().t === ')')) {
          args.push(parseExpr());
          while (peek() && peek().t === ',') { next(); args.push(parseExpr()); }
        }
        expect(')');
        return { type: 'call', name: tok.v, args };
      }
      return { type: 'id', v: tok.v };
    }
    throw new Error('nd Parse-Fehler: unerwartetes Token ' + JSON.stringify(tok) + ' bei ' + p);
  }
  const result = parseExpr();
  if (p < tokens.length) throw new Error('nd Parse-Fehler: Rest nicht verarbeitet ab ' + p);
  return result;
}
function ndParseRaw(s) { return ndParse(miTokenize(s)); }

// Konservative (nie falsch-positive) Prüfung: ist node garantiert >= 0?
function calcIsNonNegative(node) {
  if (node.type === 'num') return parseFloat(node.v) >= 0;
  if (node.type === 'call' && (node.name === 'sqrt' || node.name === 'exp' || node.name === 'abs')) return true;
  if (node.type === 'pow') {
    const bv = node.b.type === 'num' ? parseFloat(node.b.v) : null;
    if (bv != null && Number.isInteger(bv) && bv % 2 === 0) return true;
  }
  if (node.type === 'add') return calcIsNonNegative(node.a) && calcIsNonNegative(node.b);
  if (node.type === 'mul') return calcIsNonNegative(node.a) && calcIsNonNegative(node.b);
  return false;
}

// ---------- Nachbereitung: Nerdamer-AST -> unser AST ----------
const ND_KNOWN_FNAMES = new Set(['sin', 'cos', 'tan', 'sqrt', 'abs', 'log', 'exp', 'asin', 'acos', 'atan', 'sec', 'csc', 'cot']);

function ndFixup(node) {
  switch (node.type) {
    case 'num': return node;
    case 'id': return node.v === 'e' ? { type: 'id', v: 'EC' } : node;
    case 'neg': return { type: 'neg', x: ndFixup(node.x) };
    case 'call': {
      // Sonderfall: log(sec(u)) / log(csc(u)) -> Betrags-sichere Form, siehe
      // Kommentar unten — MUSS vor der generischen sec/csc/cot-Regel greifen.
      if (node.name === 'log' && node.args.length === 1) {
        const inner = node.args[0];
        if (inner.type === 'call' && inner.name === 'sec') {
          return { type: 'neg', x: { type: 'call', name: 'log', args: [{ type: 'call', name: 'abs', args: [ndFixup({ type: 'call', name: 'cos', args: inner.args })] }] } };
        }
        if (inner.type === 'call' && inner.name === 'csc') {
          return { type: 'neg', x: { type: 'call', name: 'log', args: [{ type: 'call', name: 'abs', args: [ndFixup({ type: 'call', name: 'sin', args: inner.args })] }] } };
        }
      }
      if (node.name === 'log' && node.args.length === 2) {
        // Defensiv: sollte Nerdamer (entgegen unserer Erwartung, da wir 2-Arg
        // log(x,b) nie als Eingabe an diff()/integrate() geben — bestätigter
        // Bug dort, siehe ndFromAst) dennoch irgendwo ein 2-Arg log ausgeben,
        // NICHT einfach zu logn/log10 umbenennen (Wert könnte durch denselben
        // Bug bereits falsch sein), sondern selbst algebraisch korrekt als
        // log(abs(x))/log(b) rekonstruieren.
        const b = ndFixup(node.args[1]);
        const xFixed = ndFixup({ type: 'call', name: 'log', args: [node.args[0]] });
        return { type: 'div', a: xFixed, b: { type: 'call', name: 'log', args: [b] } };
      }
      if (node.name === 'log' && node.args.length === 1) {
        // bare log(X) -> log(abs(X)) für Definitionsbereichs-Sicherheit, ausser
        // X ist strukturell garantiert nicht-negativ (dann unnötig/hässlich).
        const x = ndFixup(node.args[0]);
        if (calcIsNonNegative(x)) return { type: 'call', name: 'log', args: [x] };
        if (x.type === 'call' && x.name === 'abs') return { type: 'call', name: 'log', args: [x] };
        return { type: 'call', name: 'log', args: [{ type: 'call', name: 'abs', args: [x] }] };
      }
      const args = node.args.map(ndFixup);
      if (node.name === 'sec') return { type: 'div', a: { type: 'num', v: '1' }, b: { type: 'call', name: 'cos', args } };
      if (node.name === 'csc') return { type: 'div', a: { type: 'num', v: '1' }, b: { type: 'call', name: 'sin', args } };
      if (node.name === 'cot') return { type: 'div', a: { type: 'num', v: '1' }, b: { type: 'call', name: 'tan', args } };
      if (!ND_KNOWN_FNAMES.has(node.name)) throw new Error('ndFixup: unbekannte Funktion "' + node.name + '" in Nerdamer-Ergebnis');
      return { type: 'call', name: node.name, args };
    }
    default:
      return { type: node.type, a: ndFixup(node.a), b: ndFixup(node.b) };
  }
}

// ---------- Numerische Verifikation (Sicherheitsnetz gegen Nerdamer-Bugs) ----------
// Sammelt alle freien Bezeichner in node (ausser 'pi'/'EC', das sind Konstanten).
function calcCollectIds(node, out) {
  if (!node) return;
  if (node.type === 'id') { if (node.v !== 'EC' && node.v !== 'pi') out.add(node.v); return; }
  if (node.type === 'call') { node.args.forEach(a => calcCollectIds(a, out)); return; }
  if (node.type === 'neg') { calcCollectIds(node.x, out); return; }
  if (node.a !== undefined) { calcCollectIds(node.a, out); calcCollectIds(node.b, out); }
}
// Prüft, ob zwei AST-Knoten (bezüglich der Variable v sowie evtl. gemeinsamer
// Parameter) an mehreren Testpunkten numerisch übereinstimmen. Punkte, an
// denen eine Seite nicht auswertbar ist (Definitionslücke, NaN), werden
// übersprungen; es müssen mindestens 2 gültige Vergleiche geben und ALLE
// müssen übereinstimmen. Liefert bei jedem Fehler (z.B. Nerdamer nicht
// geladen) vorsichtshalber false.
const CALC_ND_TEST_X = [0.37, 1.91, -0.63, 2.71, -1.53, 0.81];
const CALC_ND_TEST_EXTRA = [0.83, -1.27, 2.19, -0.47, 1.61];
function calcNumericAgree(astA, astB, v) {
  if (typeof nerdamer === 'undefined') return false;
  try {
    const ids = new Set();
    calcCollectIds(astA, ids); calcCollectIds(astB, ids);
    ids.delete(v);
    const extra = {};
    let ti = 0;
    for (const id of ids) { extra[id] = CALC_ND_TEST_EXTRA[ti % CALC_ND_TEST_EXTRA.length]; ti++; }
    const strA = ndFromAst(astA), strB = ndFromAst(astB);
    let matched = 0, checked = 0;
    for (const xv of CALC_ND_TEST_X) {
      const subs = Object.assign({}, extra, { [v]: xv });
      let va, vb;
      try { va = parseFloat(nerdamer(strA).evaluate(subs).text('decimals', 10)); } catch (e) { continue; }
      try { vb = parseFloat(nerdamer(strB).evaluate(subs).text('decimals', 10)); } catch (e) { continue; }
      if (!isFinite(va) || !isFinite(vb)) continue;
      checked++;
      if (Math.abs(va - vb) < 1e-4 * Math.max(1, Math.abs(va), Math.abs(vb))) matched++;
      else return false; // eine klare Abweichung reicht, um sofort zu verwerfen
    }
    return checked >= 2 && matched === checked;
  } catch (e) { return false; }
}

// Öffentlich: symbolische Ableitung von node nach v (Standard 'x'), vereinfacht.
// Nutzt IMMER die eigene, nachweislich korrekte calcDiffRaw für die eigentliche
// Ableitung; Nerdamer wird nur zur kosmetischen Politur des Ergebnis-Strings
// herangezogen und deren Ergebnis numerisch gegengeprüft, bevor es benutzt wird.
function calcDiff(node, v) {
  v = v || 'x';
  const own = calcDiffRaw(calcDesugar(node), v);
  const ownSimplified = calcSimplify(own);
  if (typeof nerdamer === 'undefined') return ownSimplified;
  try {
    const ndStr = ndFromAst(own);
    const resultStr = nerdamer(ndStr).toString();
    const polished = calcSimplify(ndFixup(ndParseRaw(resultStr)));
    if (calcNumericAgree(own, polished, v)) return polished;
    return ownSimplified;
  } catch (ex) {
    return ownSimplified;
  }
}

// Öffentlich: Stammfunktion von node nach v (Standard 'x'), vereinfacht.
// Nutzt bevorzugt nerdamer.integrate() (deutlich leistungsfähiger als die
// eigene Engine), verifiziert das Ergebnis aber IMMER numerisch durch erneutes
// (eigenes, nachweislich korrektes) Differenzieren — bei Abweichung wird auf
// die eigene, bereichsbeschränkte Engine zurückgefallen. Gibt null zurück,
// wenn keine elementare Stammfunktion gefunden werden konnte (statt eines
// falschen Ergebnisses) — die Integrationskonstante C wird NICHT mit ausgegeben.
function calcIntegrate(node, v) {
  v = v || 'x';
  if (typeof nerdamer === 'undefined') return calcIntegrateOwn(node, v);
  try {
    const ndInputStr = ndFromAst(node);
    const resultStr = nerdamer.integrate(ndInputStr, v).toString();
    if (resultStr.indexOf('integrate(') !== -1) return calcIntegrateOwn(node, v);
    const candidate = calcSimplify(ndFixup(ndParseRaw(resultStr)));
    const candDeriv = calcSimplify(calcDiffRaw(candidate, v));
    if (!calcNumericAgree(node, candDeriv, v)) return calcIntegrateOwn(node, v);
    return candidate;
  } catch (ex) {
    return calcIntegrateOwn(node, v);
  }
}

// ═══════════════════════════════════════════════════════════════════
// UMKEHRFUNKTION (f⁻¹) — Term durch «Abschälen» des Ausdrucks
// ───────────────────────────────────────────────────────────────────
// Kommt x GENAU EINMAL im Ausdruck vor, wird die Gleichung y = f(x) von aussen
// nach innen aufgelöst (Gegenoperation Schritt für Schritt: + ↔ −, · ↔ ÷,
// ^n ↔ ⁿ√, exp ↔ ln, sin ↔ arcsin …). Zusätzlich werden die beiden
// Schulfälle mit mehrfachem x erkannt: gebrochen-lineare Funktionen
// (ax+b)/(cx+d) und quadratische Funktionen (Scheitelpunktform, mit ±-Zweig).
// Mehrdeutige Schritte (gerade Potenz, abs) liefern mehrere Kandidaten; welcher
// Zweig stimmt, entscheidet eine NUMERISCHE Probe f⁻¹(f(x)) = x auf dem
// aktuellen Definitionsbereich — so wird nie ein falscher Term ausgegeben.
// Die Umkehrfunktion wird wieder in der Variablen x geschrieben.
// ═══════════════════════════════════════════════════════════════════
function calcCountVar(node, name) {
  if (!node) return 0;
  switch (node.type) {
    case 'num': return 0;
    case 'id': return node.v === name ? 1 : 0;
    case 'call': return node.args.reduce((s, a) => s + calcCountVar(a, name), 0);
    case 'neg': return calcCountVar(node.x, name);
    default: return calcCountVar(node.a, name) + calcCountVar(node.b, name);
  }
}
function _ciCall(name, ...args) { return { type: 'call', name, args }; }
function _ciB(type, a, b) { return { type, a, b }; }

// Liefert alle Kandidaten-ASTs für x = f⁻¹(rhs) (rhs: AST in der neuen Variablen x).
function calcInvPeel(node, rhs) {
  const hasX = n => calcContainsVar(n, 'x');
  const peel = (n, r) => calcInvPeel(n, r);
  switch (node.type) {
    case 'id': return node.v === 'x' ? [rhs] : [];
    case 'neg': return peel(node.x, { type: 'neg', x: rhs });
    case 'add': return hasX(node.a) ? peel(node.a, _ciB('sub', rhs, node.b)) : peel(node.b, _ciB('sub', rhs, node.a));
    case 'sub': return hasX(node.a) ? peel(node.a, _ciB('add', rhs, node.b)) : peel(node.b, _ciB('sub', node.a, rhs));
    case 'mul': return hasX(node.a) ? peel(node.a, _ciB('div', rhs, node.b)) : peel(node.b, _ciB('div', rhs, node.a));
    case 'div': return hasX(node.a) ? peel(node.a, _ciB('mul', rhs, node.b)) : peel(node.b, _ciB('div', node.a, rhs));
    case 'pow': {
      if (hasX(node.a) && !hasX(node.b)) {
        // Exponent als Zahl bestimmen (falls konstant)
        let ev = null;
        const ids = new Set(); calcCollectIds(node.b, ids);
        if (ids.size === 0) { try { ev = safeEval(miToRaw(node.b, 0), 0); } catch (e) { ev = null; } }
        if (ev != null && !isFinite(ev)) ev = null;
        if (ev === 0) return [];
        if (ev === 1) return peel(node.a, rhs);
        if (ev === -1) return peel(node.a, _ciB('div', calcNum(1), rhs));
        if (ev != null && Number.isInteger(ev)) {
          const root = ev === 2 ? _ciCall('sqrt', rhs) : _ciCall('nthroot', rhs, calcNum(ev));
          if (ev % 2 === 0) return peel(node.a, root).concat(peel(node.a, { type: 'neg', x: root }));
          return peel(node.a, root);
        }
        return peel(node.a, _ciB('pow', rhs, _ciB('div', calcNum(1), node.b)));
      }
      if (!hasX(node.a) && hasX(node.b)) {
        if (node.a.type === 'id' && node.a.v === 'EC') return peel(node.b, _ciCall('log', rhs));
        if (node.a.type === 'num' && parseFloat(node.a.v) === 10) return peel(node.b, _ciCall('log10', rhs));
        return peel(node.b, _ciB('div', _ciCall('log', rhs), _ciCall('log', node.a)));
      }
      return [];
    }
    case 'call': {
      const a = node.args;
      const one = (a.length === 1 && hasX(a[0]));
      switch (node.name) {
        case 'sqrt': return one ? peel(a[0], _ciB('pow', rhs, calcNum(2))) : [];
        case 'exp':  return one ? peel(a[0], _ciCall('log', rhs)) : [];
        case 'log':  return one ? peel(a[0], _ciCall('exp', rhs)) : [];
        case 'log10': return one ? peel(a[0], _ciB('pow', calcNum(10), rhs)) : [];
        case 'sin':  return one ? peel(a[0], _ciCall('asin', rhs)) : [];
        case 'cos':  return one ? peel(a[0], _ciCall('acos', rhs)) : [];
        case 'tan':  return one ? peel(a[0], _ciCall('atan', rhs)) : [];
        case 'asin': return one ? peel(a[0], _ciCall('sin', rhs)) : [];
        case 'acos': return one ? peel(a[0], _ciCall('cos', rhs)) : [];
        case 'atan': return one ? peel(a[0], _ciCall('tan', rhs)) : [];
        case 'abs':  return one ? peel(a[0], rhs).concat(peel(a[0], { type: 'neg', x: rhs })) : [];
        case 'logn': case 'logbase':
          return (a.length === 2 && hasX(a[0]) && !hasX(a[1])) ? peel(a[0], _ciB('pow', a[1], rhs)) : [];
        case 'nthroot':
          return (a.length === 2 && hasX(a[0]) && !hasX(a[1])) ? peel(a[0], _ciB('pow', rhs, a[1])) : [];
        default: return [];
      }
    }
    default: return [];
  }
}

// Kandidaten bei mehrfachem x: gebrochen-linear und quadratisch.
function calcInvSpecial(ast) {
  const X = calcId('x');
  const out = [];
  try {
    // m x + k  →  x = (y − k)/m
    const L1 = calcIsLinear(ast, 'x');
    if (L1) { const lc = _ciB('div', _ciB('sub', X, L1.k), L1.m); lc.__keep = true; out.push(lc); return out; }
    // (a x + b)/(c x + d)  →  x = (b − d y)/(c y − a)
    if (ast.type === 'div') {
      const A = calcIsLinear(ast.a, 'x'), B = calcIsLinear(ast.b, 'x');
      if (A && B) {
        out.push(_ciB('div', _ciB('sub', A.k, _ciB('mul', B.k, X)), _ciB('sub', _ciB('mul', B.m, X), A.m)));
        return out;
      }
    }
    // a x² + b x + c  →  x = h ± √((y − k)/a),  h = −b/(2a),  k = c − b²/(4a)
    const d1 = calcDiffOwn(ast, 'x');
    const lin = calcIsLinear(d1, 'x');
    if (lin) {
      const a = calcSimplify(_ciB('div', lin.m, calcNum(2)));
      const b = lin.k;
      const c = calcSimplify(calcSubstitute(ast, 'x', calcNum(0)));
      if (!calcContainsVar(a, 'x') && !calcContainsVar(c, 'x')) {
        const h = _ciB('div', { type: 'neg', x: b }, _ciB('mul', calcNum(2), a));
        const k = _ciB('sub', c, _ciB('div', _ciB('pow', b, calcNum(2)), _ciB('mul', calcNum(4), a)));
        const root = _ciCall('sqrt', _ciB('div', _ciB('sub', X, k), a));
        out.push(_ciB('add', h, root));
        out.push(_ciB('sub', h, root));
      }
    }
  } catch (ex) { /* keine Sonderform */ }
  return out;
}

// Rundet Intervallgrenzen auf «schöne» Werte (Vielfache von π/12, 6 Dezimalen).
function calcInvSnap(v) {
  if (!isFinite(v)) return v;
  const u = Math.PI / 12, m = Math.round(v / u);
  if (Math.abs(v - m * u) < 3e-6) return m * u;
  for (const d of [1e2, 1e4, 1e6]) {
    const r = Math.round(v * d) / d;
    if (Math.abs(r - v) < 3e-6) return r;
  }
  return v;
}

// Kosmetik am Ergebnis: x−(−1) → x+1, x+(−2) → x−2, 0+t → t u.ä. (ändert den Wert nicht).
function calcInvTidy(node) {
  if (!node) return node;
  const negNum = n => n && n.type === 'num' && parseFloat(n.v) < 0;
  const absNum = n => calcNum(-parseFloat(n.v));
  switch (node.type) {
    case 'num': case 'id': return node;
    case 'neg': {
      const x = calcInvTidy(node.x);
      if (x.type === 'neg') return x.x;
      return { type: 'neg', x };
    }
    case 'call': return { type: 'call', name: node.name, args: node.args.map(calcInvTidy) };
    default: {
      let a = calcInvTidy(node.a), b = calcInvTidy(node.b);
      if (node.type === 'div') {
        const bv = calcNumVal(b);
        if (bv === 1) return a;
        if (bv === -1) return { type: 'neg', x: a };
      }
      if (node.type === 'sub') {
        if (b.type === 'neg') return calcInvTidy({ type: 'add', a, b: b.x });
        if (negNum(b)) return { type: 'add', a, b: absNum(b) };
      }
      if (node.type === 'add') {
        if (b.type === 'neg') return { type: 'sub', a, b: b.x };
        if (negNum(b)) return { type: 'sub', a, b: absNum(b) };
        if (a.type === 'neg' && b.type !== 'neg') return { type: 'sub', a: b, b: a.x };
      }
      return { type: node.type, a, b };
    }
  }
}

// Hauptfunktion. fn: Funktionsobjekt {expr, domainMin, domainMax, …}.
// Rückgabe:
//   { status:'ok', raw, ast }                     – Term gefunden und geprüft
//   { status:'noninj', intervals:[{lo,hi},…] }    – auf dem aktuellen D nicht umkehrbar;
//                                                   intervals: mögliche Einschränkungen
//   { status:'unsupported' }                       – kein Term bildbar (Spiegelbild trotzdem möglich)
//   { status:'error' }                             – Ausdruck nicht lesbar / nicht auswertbar
function calcInverse(fn) {
  let ast;
  try { ast = miParseRaw(fn.expr); } catch (e) { return { status: 'error' }; }
  if (calcCountVar(ast, 'x') === 0) return { status: 'noninj', intervals: [], constant: true };

  let cands = [];
  const linSpecial = calcInvSpecial(ast);
  if (calcCountVar(ast, 'x') === 1) cands = linSpecial.concat(calcInvPeel(ast, calcId('x')));
  else cands = linSpecial;
  cands = cands.slice(0, 8).map(c => {
    try { const s = calcInvTidy(c.__keep ? c : calcSimplify(c)); const raw = miToRaw(s, 0); return { ast: s, raw }; } catch (e) { return null; }
  }).filter(Boolean);

  // Probebereich: der aktuelle Definitionsbereich (sonst −20 … 20)
  const dMin = fn.domainMin != null ? fn.domainMin : null, dMax = fn.domainMax != null ? fn.domainMax : null;
  const L = dMin != null ? dMin : (dMax != null ? dMax - 40 : -20);
  const H = dMax != null ? dMax : (dMin != null ? dMin + 40 : 20);
  const N = 801;
  const xs = [], ys = [];
  for (let i = 0; i <= N; i++) {
    let x = L + (H - L) * i / N;
    if (i === 0 && dMin != null) x = L + (H - L) * 1e-6;       // Randpunkte minimal nach innen
    if (i === N && dMax != null) x = H - (H - L) * 1e-6;
    const y = safeEval(fn.expr, x);
    if (isFinite(y)) { xs.push(x); ys.push(y); }
  }
  if (xs.length < 20) return { status: 'error' };

  const passAt = (c, x, y) => {
    const g = safeEval(c.raw, y);
    return isFinite(g) && Math.abs(g - x) <= 1e-6 * Math.max(1, Math.abs(x));
  };
  // 1) Kandidat, der überall stimmt?
  for (const c of cands) {
    let ok = true;
    for (let i = 0; i < xs.length && ok; i++) if (!passAt(c, xs[i], ys[i])) ok = false;
    if (ok) return { status: 'ok', raw: c.raw, ast: c.ast };
  }
  // 2) Teilintervalle bestimmen, auf denen ein Kandidat stimmt (→ Einschränkungen vorschlagen)
  const intervals = [];
  cands.forEach(c => {
    const pass = xs.map((x, i) => passAt(c, x, ys[i]));
    let i = 0;
    while (i < xs.length) {
      if (!pass[i]) { i++; continue; }
      let j = i;
      while (j + 1 < xs.length && pass[j + 1]) j++;
      if (j - i >= 2) {
        let lo = xs[i], hi = xs[j];
        // Grenzen per Bisektion verfeinern (zwischen letztem guten und erstem schlechten Punkt)
        const refine = (good, bad) => {
          for (let k = 0; k < 50; k++) {
            const m = (good + bad) / 2, ym = safeEval(fn.expr, m);
            if (isFinite(ym) && passAt(c, m, ym)) good = m; else bad = m;
          }
          return good;
        };
        const atLeftEdge = i === 0, atRightEdge = j === xs.length - 1;
        lo = atLeftEdge ? (dMin != null ? dMin : null) : calcInvSnap(refine(xs[i], xs[i - 1]));
        hi = atRightEdge ? (dMax != null ? dMax : null) : calcInvSnap(refine(xs[j], xs[j + 1]));
        intervals.push({ lo, hi, n: j - i + 1 });
      }
      i = j + 1;
    }
  });
  if (intervals.length) {
    intervals.sort((p, q) => q.n - p.n);
    const uniq = [];
    intervals.forEach(iv => { if (!uniq.some(u => u.lo === iv.lo && u.hi === iv.hi)) uniq.push(iv); });
    return { status: 'noninj', intervals: uniq.slice(0, 4).map(iv => ({ lo: iv.lo, hi: iv.hi })) };
  }
  return { status: 'unsupported' };
}

if (typeof module !== 'undefined') {
  module.exports = {
    calcNum, calcId, calcContainsVar, calcSubstitute, calcEqual,
    calcSimplify, calcDesugar, calcDiff, calcIsLinear, calcIntegrate,
    calcDiffOwn, calcIntegrateOwn, calcDiffRaw, calcAntiderivRaw,
    ndFromAst, ndParseRaw, ndFixup, calcIsNonNegative, calcNumericAgree,
    calcInverse, calcInvPeel, calcCountVar
  };
}
