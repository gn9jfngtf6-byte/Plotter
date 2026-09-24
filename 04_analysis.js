// ═══════════════════════════════════════════════════════════════════
// MODUL: analysis — Spezielle Punkte & Flächenberechnung
// Enthält:  computeSpecials(), renderSpecialList()
//           computeArea(), computeSignedIntegral()
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
// Eigene, nachweislich korrekte Ganzzahl-Faktorisierung — dient als Fallback
// für simplifyRadicalCAS() unten.
function simplifyRadical(D) {
  if (D <= 0) return null;
  let p = 1, q = Math.round(D);
  for (let k = 2; k * k <= q; k++) {
    while (q % (k*k) === 0) { q = q/(k*k); p *= k; }
  }
  return { coef: p, radicand: q };
}

// Vereinfacht √D mit dem externen CAS (Nerdamer): liefert {coef, radicand}
// mit coef·√radicand = √D und radicand quadratfrei (insb. radicand=1, wenn D
// eine Quadratzahl ist — dann ist √D schlicht die ganze Zahl coef).
// Nerdamers Ergebnis wird IMMER numerisch gegen √D geprüft (gleiches Prinzip
// wie calcDiff() in 16_calculus.js: CAS nur zur Politur, mit Sicherheitsnetz);
// bei jeder Abweichung, einem unerwarteten Ergebnisformat oder falls Nerdamer
// nicht geladen ist, Fallback auf die eigene simplifyRadical()-Faktorisierung.
function simplifyRadicalCAS(D) {
  const fallback = simplifyRadical(D);
  if (typeof nerdamer === 'undefined') return fallback;
  const Di = Math.round(D);
  if (Di <= 0) return fallback;
  try {
    const str = nerdamer('sqrt(' + Di + ')').toString().replace(/\s+/g, '');
    let coef, radicand;
    let m = str.match(/^(\d+)\*?sqrt\((\d+)\)$/);
    if (m) {
      coef = parseInt(m[1], 10); radicand = parseInt(m[2], 10);
    } else if ((m = str.match(/^sqrt\((\d+)\)$/))) {
      coef = 1; radicand = parseInt(m[1], 10);
    } else if (/^\d+$/.test(str)) {
      coef = parseInt(str, 10); radicand = 1;
    } else {
      return fallback; // unerwartetes Format → nicht riskieren
    }
    if (!Number.isFinite(coef) || !Number.isFinite(radicand)) return fallback;
    if (coef * coef * radicand !== Di) return fallback; // Sicherheitsnetz: exakte Gegenprobe
    return { coef, radicand };
  } catch (e) {
    return fallback;
  }
}

// Vereinfacht √D mit dem externen CAS — auch für NICHT-ganzzahliges D korrekt.
// simplifyRadicalCAS() oben rundet D intern (Math.round), was bei einer echten
// Bruch-Diskriminante wie D=17/4 STILLSCHWEIGEND ein falsches Ergebnis liefert
// (√4 statt √17/2). Diese Funktion rekonstruiert D stattdessen als exakten
// Bruch p/q (gleiche Nenner-Suche wie asSimpleFrac()/numToFrac()) und nutzt die
// Rationalisierung √(p/q) = √(p·q)/q, um den Zähler-Radikanden korrekt über
// simplifyRadicalCAS() zu vereinfachen. Liefert {coef, radicand, den} mit
// coef·√radicand/den = √D (radicand quadratfrei, coef/den vollständig gekürzt),
// oder null, falls D sich nicht als Bruch mit kleinem Nenner rekonstruieren lässt.
function simplifyRadicalCASFrac(D) {
  if (!(D > 0) || !isFinite(D)) return null;
  // Numerisches Rauschen glätten: D wird oft aus Koeffizienten berechnet, die
  // per finite-difference-Ableitung geschätzt wurden (z.B. getQuadCoeffs()),
  // was bei D=b²−4ac leicht ~1e-5 Abweichung vom "wahren" Wert erzeugt (z.B.
  // 11.999984 statt exakt 12). Auf 4 Nachkommastellen runden killt dieses
  // Rauschen, ohne echte Bruch-Diskriminanten wie 17/4=4.25 zu verfälschen.
  const Dc = Math.round(D * 1e4) / 1e4;
  // Fall 1: D ist (nahezu) ganzzahlig → einfacher Fall, direkt delegieren.
  if (Math.abs(Dc - Math.round(Dc)) < 1e-3) {
    const r = simplifyRadicalCAS(Math.round(Dc));
    return r ? { coef: r.coef, radicand: r.radicand, den: 1 } : null;
  }
  // Fall 2: D als exakten Bruch p/q rekonstruieren.
  let bestP = null, bestQ = null;
  for (const q of [2,3,4,5,6,7,8,9,10,12,16,20,25,32,40,50,64,100,1000,10000]) {
    const p = Math.round(Dc * q);
    if (p > 0 && Math.abs(p / q - Dc) < 1e-4) { bestP = p; bestQ = q; break; }
  }
  if (bestP === null) return null;
  const g0 = gcdInt(bestP, bestQ);
  const p = bestP / g0, q = bestQ / g0;
  // √(p/q) = √(p·q)/q  (Erweitern mit q: p/q = p·q/q²)
  const inner = simplifyRadicalCAS(p * q);
  if (!inner) return null;
  const g1 = gcdInt(inner.coef, q);
  const coef = inner.coef / g1, den = q / g1;
  // Sicherheitsnetz: numerische Gegenprobe gegen das (leicht verrauschte) D —
  // Toleranz analog zur Rauschglättung oben, nicht die strenge 1e-6-Grenze von
  // simplifyRadicalCAS()'s eigener Gegenprobe auf bereits exakten Ganzzahlen.
  const check = (coef * coef * inner.radicand) / (den * den);
  if (Math.abs(check - D) > Math.max(1e-3, Math.abs(D) * 1e-3)) return null;
  return { coef, radicand: inner.radicand, den };
}

// Formatiert das Ergebnis von simplifyRadicalCASFrac() als Text ("2√3/4", "√5",
// "3", …) oder — mit asHTML=true — als gestapelter Bruch (.mfrac, siehe
// 03_math.js) für den Nenner, passend zur rr()/fracHTML()-Darstellung.
function fmtRadicalFrac(sr, asHTML) {
  if (!sr) return null;
  const { coef, radicand, den } = sr;
  let numStr;
  if (radicand === 1) numStr = String(coef);
  else if (coef === 1) numStr = `√${radicand}`;
  else numStr = `${coef}√${radicand}`;
  if (den === 1) return numStr;
  if (asHTML) return `<span class="mfrac"><span class="mfrac-num">${numStr}</span><span class="mfrac-den">${den}</span></span>`;
  return `${numStr}/${den}`;
}

// LaTeX-Variante von fmtRadicalFrac() — liefert reines LaTeX ("2\sqrt{3}",
// "\frac{\sqrt{17}}{2}", …), gedacht zum Rendern über latexToMathLiveHtml()
// (siehe rr() in generateSolveSteps(), 04_analysis.js), damit ein Wurzel-
// ausdruck GENAUSO aussieht wie im Eingabefeld statt als Unicode-Annäherung.
function radicalToLatex(sr) {
  if (!sr) return null;
  const { coef, radicand, den } = sr;
  let numTex;
  if (radicand === 1) numTex = String(coef);
  else if (coef === 1) numTex = `\\sqrt{${radicand}}`;
  else numTex = `${coef}\\sqrt{${radicand}}`;
  if (den === 1) return numTex;
  return `\\frac{${numTex}}{${den}}`;
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

// Sucht eine RATIONALE Nullstelle eines kubischen Polynoms a·x³+b·x²+c·x+d via
// Rationale-Nullstellen-Satz — die im Unterricht übliche "Rateverfahren"-Methode:
// Kandidaten sind Teiler des Absolutglieds über Teiler des Leitkoeffizienten.
// Skaliert a,b,c,d zunächst auf ganze Zahlen (gleiches Prinzip wie
// tryAnalyticalZerosEx() oben), damit auch Dezimal-Koeffizienten (z.B. aus
// numerisch geschätzten Ableitungen) erfasst werden, und prüft jeden Kandidaten
// p/q per EXAKTER Ganzzahl-Gegenprobe (A·p³+B·p²·q+C·p·q²+D·q³ = 0 — kein
// Rundungsfehler möglich). Gibt {p, q, intCoeffs:[A,B,C,D]} zurück (Nullstelle
// = p/q, vollständig gekürzt) oder null, wenn kein rationaler Kandidat in den
// Suchgrenzen gefunden wird (dann bleibt nur der numerische Fallback).
function findRationalRootCubic(a, b, c, d) {
  const scales = [1,2,4,5,8,10,16,20,25,40,50,100,200,250,500,1000];
  let best = null;
  const isI = v => Math.abs(v - Math.round(v)) < 1e-3;
  for (const scale of scales) {
    const A = a*scale, B = b*scale, C = c*scale, D = d*scale;
    if (isI(A) && isI(B) && isI(C) && isI(D) && Math.abs(Math.round(A)) >= 1) {
      best = [Math.round(A), Math.round(B), Math.round(C), Math.round(D)];
      break;
    }
  }
  if (!best) return null;
  let [A, B, C, D] = best;
  if (A < 0) { A = -A; B = -B; C = -C; D = -D; } // Leitkoeffizient positiv normieren
  if (D === 0) return { p: 0, q: 1, intCoeffs: [A, B, C, D] }; // x = 0 ist Nullstelle
  const divisorsOf = (n) => {
    n = Math.abs(Math.round(n)); const res = [];
    for (let k = 1; k <= n && k <= 1000; k++) if (n % k === 0) res.push(k);
    return res;
  };
  const pDivs = divisorsOf(D), qDivs = divisorsOf(A);
  for (const q of qDivs) {
    for (const pAbs of pDivs) {
      for (const sign of [1, -1]) {
        const p = pAbs * sign;
        // Exakte Ganzzahl-Gegenprobe (keine Gleitkomma-Unsicherheit):
        const check = A*p*p*p + B*p*p*q + C*p*q*q + D*q*q*q;
        if (check === 0) {
          const g = gcdInt(Math.abs(p), q);
          return { p: p/g, q: q/g, intCoeffs: [A, B, C, D] };
        }
      }
    }
  }
  return null;
}

// Synthetische Division von A·x³+B·x²+C·x+D durch (x − p/q) — liefert die
// Koeffizienten {A, B, C} des quadratischen Quotienten A·x²+B·x+C (Rest ist
// exakt 0, da p/q laut findRationalRootCubic() eine exakte Nullstelle ist).
function polyDivideByRoot3(A, B, C, D, p, q) {
  const r = p / q;
  const b1 = B + A * r;
  const b2 = C + b1 * r;
  return { A, B: b1, C: b2 };
}

// ── Generische Polynom-Hilfsfunktionen (für "hebbare Lücke", s.u.) ────
// Erkennt einen beliebigen Ausdrucksstring s als Polynom bis Grad 3 (linear,
// quadratisch oder kubisch — niedrigster passender Grad zuerst) über dieselbe
// numerische Fit-Methode wie getLinCoeffs/getQuadCoeffs/getCubicCoeffs (finite
// Differenzen + Verifikation an mehreren Stichproben), nur nicht an den
// jeweils aktuellen Funktionsausdruck gebunden, sondern an EINEN BELIEBIGEN
// Teilausdruck (z.B. Zähler oder Nenner eines Bruchs). Gibt die Koeffizienten
// [c_n, …, c0] (höchster Grad zuerst) zurück, oder null (z.B. bei Wurzel/trig
// im Teilausdruck, oder Grad > 3).
function fitPolyStr(s) {
  const b0 = safeEval(s, 0), a1 = deriv1(s, 0), a2 = deriv2(s, 0);
  if (isFinite(a1) && isFinite(b0) && Math.abs(a2) < 0.01) {
    let ok = true;
    for (const x of [1, 2, -1, -2, 3]) {
      const act = safeEval(s, x);
      if (!isFinite(act) || Math.abs(a1*x + b0 - act) > Math.abs(act)*0.02 + 0.05) { ok = false; break; }
    }
    if (ok) return [parseFloat(a1.toFixed(6)), parseFloat(b0.toFixed(6))];
  }
  if (isFinite(a2) && Math.abs(a2) >= 1e-6) {
    const A = a2/2, B = deriv1(s, 0), C = safeEval(s, 0);
    let ok = isFinite(A) && isFinite(B) && isFinite(C);
    if (ok) for (const x of [1, 2, -1, -2, 3, 5]) {
      const act = safeEval(s, x);
      if (!isFinite(act)) { ok = false; break; }
      if (Math.abs(A*x*x + B*x + C - act) > Math.abs(act)*0.02 + 0.05) { ok = false; break; }
    }
    if (ok) return [parseFloat(A.toFixed(6)), parseFloat(B.toFixed(6)), parseFloat(C.toFixed(6))];
  }
  const H = 0.1;
  const d3 = (safeEval(s,3*H) - 3*safeEval(s,H) + 3*safeEval(s,-H) - safeEval(s,-3*H)) / (8*H*H*H);
  const A3 = d3/6;
  if (isFinite(A3) && Math.abs(A3) >= 1e-5) {
    const d4 = (safeEval(s,2*H) - 4*safeEval(s,H) + 6*safeEval(s,0) - 4*safeEval(s,-H) + safeEval(s,-2*H)) / (H*H*H*H);
    if (Math.abs(d4) <= 2 + 3*Math.abs(A3)) {
      const B3 = deriv2(s, 0)/2, C3 = deriv1(s, 0), D3 = safeEval(s, 0);
      let ok = isFinite(B3) && isFinite(C3) && isFinite(D3);
      if (ok) for (const x of [1, 2, -1, -2, 1.5]) {
        const act = safeEval(s, x);
        const pred = A3*x*x*x + B3*x*x + C3*x + D3;
        if (!isFinite(act) || Math.abs(pred - act) > 0.05*(Math.abs(act)+1)) { ok = false; break; }
      }
      if (ok) return [parseFloat(A3.toFixed(6)), parseFloat(B3.toFixed(6)), parseFloat(C3.toFixed(6)), parseFloat(D3.toFixed(6))];
    }
  }
  return null;
}
// Horner-Schema: exakte Polynomdivision von coeffs ([c_n,…,c0]) durch (x−r).
// Liefert Quotient (Grad n−1) und Rest (0, wenn r wirklich Nullstelle ist).
function polyDivideByLinearRoot(coeffs, r) {
  const b = [coeffs[0]];
  for (let i = 1; i < coeffs.length; i++) b.push(coeffs[i] + b[i-1]*r);
  return { quotient: b.slice(0, -1), remainder: b[b.length - 1] };
}
function evalPolyCoeffs(coeffs, x) {
  return coeffs.reduce((acc, c) => acc*x + c, 0);
}
// Findet reelle Nullstellen eines bis Grad 3 erkannten Polynoms — EXAKT über
// die Mitternachtsformel (Grad 2) bzw. das Rateverfahren via
// findRationalRootCubic() (Grad 3, nur falls eine rationale Nullstelle
// existiert — sonst ehrlich keine gefunden, kein numerisches Raten). Wird für
// die Nenner-Nullstellen bei der Suche nach hebbaren Lücken gebraucht (s.u.).
function findRealRootsOfPoly(coeffs) {
  const deg = coeffs.length - 1;
  if (deg === 1) {
    const [a, b] = coeffs;
    if (Math.abs(a) < 1e-9) return [];
    return [-b/a];
  }
  if (deg === 2) {
    const [a, b, c] = coeffs;
    if (Math.abs(a) < 1e-9) return Math.abs(b) < 1e-9 ? [] : [-c/b];
    const D = b*b - 4*a*c;
    if (D < -1e-6) return [];
    if (Math.abs(D) < 1e-6) return [-b/(2*a)];
    const sq = Math.sqrt(D);
    return [(-b+sq)/(2*a), (-b-sq)/(2*a)];
  }
  if (deg === 3) {
    const [a, b, c, d] = coeffs;
    const root = findRationalRootCubic(a, b, c, d);
    if (!root) return []; // keine rationale Nullstelle -> nicht abgedeckt (ehrlicher Verzicht)
    const x0 = root.p / root.q;
    const quad = polyDivideByRoot3(...root.intCoeffs, root.p, root.q);
    // intCoeffs sind ganzzahlig SKALIERT (siehe findRationalRootCubic) — für
    // die eigentlichen (unskalierten) Koeffizienten der Restquadratik zählt
    // hier nur die reelle Nullstellenmenge, der Skalierungsfaktor kürzt sich
    // beim Lösen der Mitternachtsformel ohnehin heraus.
    const rest = findRealRootsOfPoly([quad.A, quad.B, quad.C]);
    return [x0, ...rest];
  }
  return [];
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
  // Schutz vor Division durch 0 weiter unten (2*aI im Nenner): bei einer nur
  // numerisch (finite-Differenzen-Rauschen) knapp über der 1e-6-Schwelle
  // liegenden zweiten Ableitung kann a so winzig sein, dass es bei keiner der
  // Skalierungsstufen zu einer von 0 verschiedenen Ganzzahl gerundet wird
  // (z.B. bei "m·x+q" mit bestimmten Schieberegler-Werten beobachtet — echte
  // Gerade, fälschlich als Parabel mit a≈0 erkannt). Ohne diesen Guard entsteht
  // ein Phantom-Nullstellen-Paar mit x=NaN und einem ".../0"-Bruch im Label.
  if (aI === 0) return [];
  const DInt = bI * bI - 4 * aI * cI;
  if (DInt < 0) return [];

  // Doppelte Nullstelle
  if (DInt === 0) {
    const x0 = -bI / (2 * aI);
    const z = { kind:'zero', fi:fi_idx, x:x0, y:0, col };
    z.exactLabel = `(${fmtExact(-bI, 2 * aI)} | 0)`;
    return [z];
  }

  const sr = simplifyRadicalCAS(DInt);
  if (!sr) return [];

  // x = (−bI ± sr.coef·√sr.radicand) / (2·aI) — gemeinsam kürzen
  const den = 2 * aI;
  const numC = -bI, numR = sr.coef;
  const g = gcdInt(gcdInt(Math.abs(numC), numR), Math.abs(den));
  let nc = numC / g, nr = numR / g, d = den / g;

  // Nenner immer positiv (damit Bruchdarstellung eindeutig ist)
  if (d < 0) { nc = -nc; nr = -nr; d = -d; }

  // Diskriminante ist eine Quadratzahl (radicand=1 nach Vereinfachung durchs CAS)
  // → √D ist selbst ganzzahlig, beide Nullstellen sind schlicht rational.
  // Dann NICHT als "a ± b" stehen lassen (das wäre unausgerechnet, z.B. "2 ± 1"
  // statt 1 und 3) — stattdessen sauber zur fertigen Zahl zusammenrechnen.
  if (sr.radicand === 1) {
    const xPlusStr  = fmtExact(nc + nr, d);
    const xMinusStr = fmtExact(nc - nr, d);
    const z1 = { kind:'zero', fi:fi_idx, x:(-bI + Math.sqrt(DInt)) / den, y:0, col };
    const z2 = { kind:'zero', fi:fi_idx, x:(-bI - Math.sqrt(DInt)) / den, y:0, col };
    z1.exactLabel = z1.textLabel = `(${xPlusStr} | 0)`;
    z2.exactLabel = z2.textLabel = `(${xMinusStr} | 0)`;
    return [z1, z2];
  }

  // WICHTIG: nr kann hier (nach der "Nenner immer positiv"-Normalisierung
  // oben, Zeile 389) selbst negativ sein — x = nc + nr·√radicand ist dann
  // bereits die vollständige, korrekt vorzeichenbehaftete Formel für DIESE
  // eine Nullstelle. radHtml/radText dürfen daher nur den BETRAG von nr
  // zeigen (den Rest übernimmt das pm-Vorzeichen in mkLbl/mkTxt unten) —
  // sonst würde das Vorzeichen doppelt angewendet, z.B. "1 − -1√3" statt
  // "1 − √3" bei einer nach unten geöffneten Parabel wie -x²+2x+2.
  const nrAbs = Math.abs(nr);
  const constStr = fmtExact(nc, d);           // konstanter Anteil als Bruch-Text
  const radHtml  = fmtRadFrac(nrAbs, sr.radicand, d);  // Wurzel-Anteil als HTML (Sidebar)
  // Reintext-Version für Canvas (kein HTML):
  const radText  = d === 1
    ? (nrAbs === 1 ? `√${sr.radicand}` : `${nrAbs}√${sr.radicand}`)
    : (nrAbs === 1 ? `√${sr.radicand}/${d}` : `${nrAbs}√${sr.radicand}/${d}`);

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

  // z1 = xPlus = (nc + nr·√radicand)/d — das Vorzeichen des nr-Terms für
  // DIESE Nullstelle ist also schlicht das (bereits normalisierte) Vorzeichen
  // von nr selbst, NICHT das des ursprünglichen (unnormalisierten) Nenners
  // `den` — die frühere Herleitung aus `den` duplizierte das Vorzeichen, das
  // die Nenner-Normalisierung oben bereits in nr gespeichert hatte.
  const pm1 = nr >= 0 ? +1 : -1;
  z1.exactLabel = mkLbl(pm1);   z1.textLabel = mkTxt(pm1);
  z2.exactLabel = mkLbl(-pm1);  z2.textLabel = mkTxt(-pm1);
  return [z1, z2];
}

async function computeSpecials(myToken) {
  // D_f/W_f-Anzeige direkt in den Funktionstyp-Panels (siehe
  // updatePanelDomainRanges() in 06_ui_functions.js) — als allererstes und
  // synchron, damit sie bei JEDER Schieber-/Ausdrucksänderung automatisch
  // mit aktualisiert wird, ohne jede einzelne UI-Stelle einzeln anfassen zu
  // müssen. In try/catch, damit ein Fehler dort niemals die eigentliche
  // Spezialpunkte-Berechnung verhindert.
  try { if (typeof updatePanelDomainRanges === 'function') updatePanelDomainRanges(); } catch (e) {}

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

    // Filtere Sonderpunkte ausserhalb des Definitionsbereichs
    if (fi.domainMin != null || fi.domainMax != null) {
      const dMin = fi.domainMin != null ? fi.domainMin : -Infinity;
      const dMax = fi.domainMax != null ? fi.domainMax : Infinity;
      for (let j = acc.length - 1; j >= 0; j--) {
        const pt = acc[j];
        if (pt.fi !== fi_idx) continue;
        if (pt.x < dMin - 1e-9 || pt.x > dMax + 1e-9) acc.splice(j, 1);
      }
    }

    { const _yp = yieldIfNeeded(); if (_yp) { await _yp; if (cancelled()) return; } }
  }

  // ── Schnittpunkte zusätzlich gegen den Definitionsbereich der ZWEITEN
  // beteiligten Funktion filtern. Der Filter oben ("Filtere Sonderpunkte
  // ausserhalb des Definitionsbereichs") lief nur INNERHALB der fi_idx-
  // Schleife und prüfte einen Punkt daher ausschliesslich gegen
  // functions[pt.fi] — ein Schnittpunkt wird aber immer mit pt.fi < pt.fj
  // gespeichert (s. Schnittpunkte-Suche oben, fj_idx = fi_idx+1…), sodass
  // functions[pt.fj]s Bereichseinschränkung dort NIE geprüft wurde. Ohne
  // diesen separaten Durchlauf würde z.B. bei f1(x)=x (unbeschränkt) und
  // f2(x)=-x mit domainMin=1 der algebraische Schnittpunkt bei x=0
  // trotzdem angezeigt, obwohl f2 dort gar nicht definiert/gezeichnet ist.
  for (let j = acc.length - 1; j >= 0; j--) {
    const pt = acc[j];
    if (pt.kind !== 'isect') continue;
    const fj_obj = functions[pt.fj];
    if (!fj_obj) continue;
    const dMinJ = fj_obj.domainMin != null ? fj_obj.domainMin : -Infinity;
    const dMaxJ = fj_obj.domainMax != null ? fj_obj.domainMax : Infinity;
    if (pt.x < dMinJ - 1e-9 || pt.x > dMaxJ + 1e-9) acc.splice(j, 1);
  }

  // ── Asymptoten & Pole ─────────────────────────────────────────────
  const BIG = 1e7;
  // Unterscheidet echte Divergenz (z.B. log(x) an x→0+, |f| wächst UNBESCHRÄNKT
  // beim Annähern) von einem gewöhnlichen beschränkten Definitionsrand (z.B.
  // sqrt(x) an x=0, oder eine verschobene Wurzel wie (x-2)^(1/4)-1, die sich
  // einem endlichen Wert ≠0 nähert). Verglichen werden die DIFFERENZEN
  // aufeinanderfolgender, geometrisch verkleinerter Stichproben statt der
  // Rohwerte selbst — das macht den Test unabhängig von einer additiven
  // Verschiebung (h≠0): schrumpfen die Differenzen deutlich, konvergiert f
  // gegen EINEN endlichen Wert (auch ≠0) → kein Pol; bleiben sie gleich gross
  // (oder wachsen), divergiert f unbeschränkt → echter Pol.
  const probeDivergence = (expr, x0, dirSign) => {
    const f1 = safeEval(expr, x0 + dirSign * 1e-2);
    const f2 = safeEval(expr, x0 + dirSign * 1e-4);
    const f3 = safeEval(expr, x0 + dirSign * 1e-6);
    if (!isFinite(f1) || !isFinite(f2) || !isFinite(f3)) return true;
    const d12 = Math.abs(f2 - f1), d23 = Math.abs(f3 - f2);
    return !(d23 < d12 * 0.5 + 1e-9);
  };

  for (let fi_idx = 0; fi_idx < functions.length; fi_idx++) {
    const fi_obj = functions[fi_idx];
    if (!fi_obj.expr.trim() || fi_obj.visible === false) continue;
    const col = fi_obj.color;
    const isLin = isLinearFunc(fi_obj.expr);
    const dMin = fi_obj.domainMin != null ? fi_obj.domainMin : -Infinity;
    const dMax = fi_obj.domainMax != null ? fi_obj.domainMax : Infinity;

    if (!isLin) {
      // Horizontale/schräge Asymptoten nur in Richtungen prüfen, die der
      // Definitionsbereich überhaupt zulässt (sonst z.B. bei sqrt(x-2) mit
      // domainMin=2 fälschlich Richtung -∞ scannen).
      const canPlus  = dMax === Infinity;
      const canMinus = dMin === -Infinity;
      const yP = canPlus  ? [safeEval(fi_obj.expr, BIG), safeEval(fi_obj.expr, BIG*0.9), safeEval(fi_obj.expr, BIG*0.8)] : [NaN,NaN,NaN];
      const yM = canMinus ? [safeEval(fi_obj.expr, -BIG), safeEval(fi_obj.expr, -BIG*0.9), safeEval(fi_obj.expr, -BIG*0.8)] : [NaN,NaN,NaN];
      const conv = (arr) => arr.every(isFinite) && (Math.max(...arr) - Math.min(...arr)) < 1e-2;
      const addAsymp = (val, dir) => {
        if (!acc.some(p => p.kind==='asymp' && p.fi===fi_idx && Math.abs(p.y - val) < 1e-4))
          acc.push({ kind:'asymp', fi:fi_idx, x:0, y:val, col, dir, asympKey:`asymp_${fi_idx}_${parseFloat(val.toFixed(6))}` });
      };
      if (canPlus  && conv(yP)) { const v = yP[0]; if (isFinite(v)) addAsymp(v, '+∞'); }
      if (canMinus && conv(yM)) { const v = yM[0]; if (isFinite(v)) addAsymp(v, '-∞'); }

      const BIG_LO = 1e4; // zweite, deutlich kleinere Skala für den Kreuz-Skalen-Konsistenztest unten
      for (const [arr, dirSign, dirStr, dirOk] of [[yP, 1, '+∞', canPlus], [yM, -1, '-∞', canMinus]]) {
        if (!dirOk) continue;
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
        // Kreuz-Skalen-Konsistenz: eine ECHTE schräge Asymptote hat eine Steigung,
        // die bei JEDER hinreichend grossen Grössenordnung von x (nicht nur nahe
        // bei BIG=1e7) gleich ist. Sub-linear wachsende Funktionen wie sqrt(x)
        // sehen lokal bei x≈1e7 fälschlich "gerade" aus (Steigung ≈ 1/(2√x) ist
        // dort fast konstant), haben bei einer 1000× kleineren Skala aber eine
        // deutlich ANDERE Steigung — das deckt diesen falsch-positiven Fall auf.
        const arrLo = [safeEval(fi_obj.expr, BIG_LO*dirSign), safeEval(fi_obj.expr, BIG_LO*0.9*dirSign), safeEval(fi_obj.expr, BIG_LO*0.8*dirSign)];
        if (arrLo.every(isFinite)) {
          const dXLo = BIG_LO * 0.1 * dirSign;
          const slopeLo = ((arrLo[0]-arrLo[1])/dXLo + (arrLo[1]-arrLo[2])/dXLo) / 2;
          // Verhältnis-Vergleich statt absoluter Differenz: bei einer ECHTEN
          // schrägen Asymptote ist die Steigung bei jeder Grössenordnung von x
          // (fast) gleich gross, das Verhältnis also ≈1 — unabhängig davon, ob
          // die Steigung selbst gross oder (wie bei sqrt(x), ≈1.6e-4) winzig
          // ist. Eine additive Toleranz würde bei so kleinen Steigungen jede
          // noch so grosse relative Abweichung fälschlich durchlassen.
          if (isFinite(slopeLo) && Math.abs(slopeLo) > 1e-12) {
            const ratio = slope / slopeLo;
            if (!isFinite(ratio) || ratio < 0.5 || ratio > 2) continue;
          }
        }
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

      // Vertikale Pole — Scan nur im Schnitt aus Sichtfenster und Definitionsbereich
      const scanXMin = Math.max(view.xmin, dMin);
      const scanXMax = Math.min(view.xmax, dMax);
      if (scanXMax > scanXMin) {
      const pSteps = 1200;
      const pDx = (scanXMax - scanXMin) / pSteps;
      const yR = view.ymax - view.ymin;
      // Merge-Radius primär am Abtastschritt orientiert (nicht nur an der
      // Sichtfensterbreite) — verhindert, dass bei weit rausgezoomten Ansichten
      // eng benachbarte periodische Pole (z.B. tan(x), Abstand π) fälschlich
      // zu einem einzigen zusammengelegt werden.
      const MERGE_POLE = Math.max(pDx * 3, (view.xmax - view.xmin) / 500);
      let prevPy = NaN, prevPx = null;

      const findBoundary = (lo, hi) => {
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
        return ax;
      };
      // Eigene, richtungsklare Bisektion für den Übergang undefiniert -> definiert
      // (Definitionsrand, z.B. Wurzel-/Log-Funktion). findBoundary() oben geht
      // von der ANDEREN Anordnung aus (lo=definiert, hi=wird undefiniert/unendlich
      // — der klassische Pol-Fall) und würde hier, mit vertauschten Rollen
      // aufgerufen, in die falsche Richtung bisektieren (konvergiert fälschlich
      // fast zu lo statt zur echten Grenze). Hier: lo=undefiniert, hi=definiert.
      const findDomainBoundary = (loUndef, hiDef) => {
        let lo = loUndef, hi = hiDef;
        for (let it = 0; it < 50; it++) {
          const m = (lo + hi) / 2;
          const ym = safeEval(fi_obj.expr, m);
          if (isFinite(ym)) hi = m; else lo = m;
        }
        return hi; // knapp innerhalb des Definitionsbereichs, beliebig nah an der Grenze
      };
      const addPole = (ax) => {
        const ri = Math.round(ax);
        const axNice = Math.abs(ri - ax) < 1e-4 ? ri : parseFloat(ax.toFixed(4));
        // xRaw (volle Bisektions-Präzision, ungerundet) wird zusätzlich zum
        // gerundeten Anzeige-x gespeichert — Phase 2 (Nerdamer) braucht das,
        // um zu erkennen, ob die Polstelle sauber rational ist (siehe dort).
        if (!acc.some(p => p.kind==='pole' && p.fi===fi_idx && Math.abs(p.x - ax) < MERGE_POLE))
          acc.push({ kind:'pole', fi:fi_idx, x:axNice, y:0, col, xRaw:ax });
      };
      const bisectPole = (lo, hi) => { addPole(findBoundary(lo, hi)); };

      // Verifiziert, dass innerhalb [lo,hi] eine ECHTE Singularität liegt (|f|
      // wächst unbeschränkt, je näher man kommt), statt nur eine STEILE aber
      // stetige Funktion (z.B. a·b^x mit grosser Basis b) — bei der ein grober
      // Scan-Schritt ebenfalls einen riesigen Sprung zeigen kann, obwohl die
      // Funktion dort nirgends divergiert. Feinere Zwischenpunkte einer echten
      // Polstelle liegen beliebig nah an ihr und zeigen daher |f|-Werte, die
      // die Intervall-Randwerte um ein Vielfaches übersteigen; bei einer
      // stetigen (auch steilen) Funktion bleibt |f| innerhalb des schmalen
      // Intervalls dagegen in der gleichen Grössenordnung wie an den Rändern.
      const verifyInteriorPole = (lo, hi) => {
        const fLo = safeEval(fi_obj.expr, lo), fHi = safeEval(fi_obj.expr, hi);
        // Kleinerer der beiden Randbeträge als Referenz — bei einem echten Pol
        // steigt |f| zwischen den Rändern noch deutlich über BEIDE hinaus an
        // (auch über den bereits grösseren Rand), während eine stetige, nur
        // steile Funktion innerhalb des schmalen Fensters nahe am GRÖSSEREN
        // Randwert bleibt.
        const base = Math.max(Math.min(Math.abs(fLo), Math.abs(fHi)), 1e-9);
        const N = 24;
        for (let i = 1; i < N; i++) {
          const x = lo + (hi - lo) * i / N;
          const v = safeEval(fi_obj.expr, x);
          if (!isFinite(v)) return true;
          if (Math.abs(v) > base * 8) return true;
        }
        return false;
      };

      for (let s = 0; s <= pSteps; s++) {
        { const _yp = yieldIfNeeded(); if (_yp) { await _yp; _lastYield = performance.now(); if (cancelled()) return; } }
        const px = scanXMin + s * pDx;
        const py = safeEval(fi_obj.expr, px);
        if (prevPx !== null) {
          const prevFin = isFinite(prevPy), curFin = isFinite(py);
          if (prevFin && !curFin) {
            // py ist unendlich/undefiniert. Das deckt sowohl echte, beidseitige
            // Pole ab (1/x, 1/x² usw. — |f| divergiert von BEIDEN Seiten) als
            // auch einen rechtsseitigen (oberen) Definitionsrand, z.B. bei einer
            // vom Nutzer getippten Funktion wie sqrt(2-x) (definiert für x≤2).
            // probeDivergence unterscheidet auch hier: echte Divergenz (Pol) vs.
            // gewöhnliches Auslaufen an einem Wurzel-artigen Rand.
            const ax = findBoundary(prevPx, px);
            if (probeDivergence(fi_obj.expr, ax, -1)) addPole(ax);
          } else if (!prevFin && curFin) {
            // Übergang undefiniert -> definiert (z.B. links vom Definitionsrand
            // einer Wurzel- oder Log-Funktion). Nur als Pol werten, wenn |f|
            // beim Annähern tatsächlich divergiert (log-artig), nicht bloss
            // an einem gewöhnlichen Wurzel-Rand ausläuft (sqrt-artig). Der Scan
            // läuft links->rechts, der Definitionsbereich liegt hier also IMMER
            // rechts von der gefundenen Grenze (definedSign=+1).
            const ax = findDomainBoundary(prevPx, px);
            if (probeDivergence(fi_obj.expr, ax, 1)) addPole(ax);
          } else if (prevFin && curFin) {
            if (Math.abs(py - prevPy) > yR * 6 && verifyInteriorPole(prevPx, px)) {
              // Grosser Sprung — auch ohne Vorzeichenwechsel (deckt 1/x² ab) — und
              // bestätigt als ECHTE Divergenz, nicht bloss eine steile stetige Kurve.
              bisectPole(prevPx, px);
            } else if (Math.abs(prevPy) > yR * 20 && Math.abs(py) > yR * 20
                       && Math.sign(prevPy) === Math.sign(py)) {
              // Beide Werte sehr gross und gleiches Vorzeichen: Pol könnte dazwischen liegen
              // (Scan hat Polstelle übersprungen) → Mittelpunkt prüfen
              const midX = (prevPx + px) / 2;
              const midY = safeEval(fi_obj.expr, midX);
              if ((!isFinite(midY) || Math.abs(midY) > Math.max(Math.abs(prevPy), Math.abs(py)) * 2)
                  && verifyInteriorPole(prevPx, px)) {
                bisectPole(prevPx, px);
              }
            }
          }
        }
        prevPy = py; prevPx = px;
      }
      }
    }

    { const _yp = yieldIfNeeded(); if (_yp) { await _yp; if (cancelled()) return; } }
  }

  // ── Phase 2: Exakte Bestätigung/Verfeinerung via Nerdamer (CAS) ────────
  // Nerdamer wird als AUTORITATIV behandelt, wenn es eine eindeutige Antwort
  // liefert (Wert ODER "bestätigt kein Grenzwert") — sie ERSETZT dann das
  // numerische Heuristik-Ergebnis für diese Richtung/Stelle. Ist Nerdamer
  // nicht bestimmbar (Timeout/Fehler/periodisch/nicht auswertbar), bleibt
  // das bisherige numerische Ergebnis unverändert (nie schlechter als vorher).
  // Pol-Einträge werden von Phase 2 NUR entfernt (nie hinzugefügt) — die
  // numerische Bisektion bleibt die einzige Kandidatensuche für Pol-STELLEN,
  // da Nerdamer nicht selbst danach suchen kann, sondern nur eine gegebene
  // Kandidatenstelle bestätigen/widerlegen kann.
  //
  // WICHTIG: die Pol-vs-Lücke-Prüfung (ndPoleOrHole) darf NUR bei sauber
  // rationalen Polstellen (z.B. x=1 bei 1/(x-1)) angewendet werden. Bei
  // irrationalen Polstellen — typischerweise periodische Funktionen wie
  // tan(x) mit Polen bei π/2+k·π — liefert die numerische Bisektion nur eine
  // Dezimal-NÄHERUNG (z.B. 1.5708 statt π/2). Würde man diese Näherung an
  // Nerdamer übergeben, würde Nerdamer dort tatsächlich einen riesigen aber
  // ENDLICHEN Wert berechnen (nicht die wahre Unendlichkeit an der exakten
  // Stelle π/2) und den korrekt gefundenen Pol fälschlich als "hebbare Lücke"
  // verwerfen. _niceRationalOrNull erkennt daher zuerst, ob die (ungerundete)
  // Kandidatenstelle zu einem einfachen Bruch "schnappt" — nur dann wird
  // Nerdamer überhaupt gefragt.
  function _niceRationalOrNull(x, tol) {
    if (!isFinite(x) || Math.abs(x) > 1e6) return null;
    for (const d of [1,2,3,4,5,6,7,8,9,10,12,16,20,24]) {
      const n = Math.round(x * d);
      if (Math.abs(n / d - x) < tol) return n === 0 ? '0' : (d === 1 ? String(n) : `((${n})/(${d}))`);
    }
    return null;
  }
  // Nerdamer hat bestätigte Bugs (siehe Kommentare in 16_calculus.js /
  // 18_nerdamer_limits.js, z.B. der 2-Argument-log-Bug). Für schräge
  // Asymptoten wurde zusätzlich beobachtet, dass "limit(simplify(f(x)/x), x,
  // Infinity)" bei gebrochenen Exponenten (z.B. nthroot, a·(x-v)^(1/n)) einen
  // FALSCHEN, aber plausibel aussehenden Wert liefert (z.B. 1/4 statt 0 für
  // nthroot(x,4)/x) — Nerdamer wird daher NIE blind übernommen, sondern jedes
  // Ergebnis zusätzlich numerisch an einer weit aussen liegenden Stelle
  // gegengeprüft (analog zum calcNumericAgree-Muster in 16_calculus.js).
  // Bestätigt sich der Wert numerisch nicht, wird er verworfen und die
  // bisherige numerische Heuristik bleibt (unverändert) massgebend.
  const ND_VERIFY_X = 1e6;
  const verifyHorizontalND = (expr, dirStr, value) => {
    const x = dirStr === 'Infinity' ? ND_VERIFY_X : -ND_VERIFY_X;
    const fv = safeEval(expr, x);
    if (!isFinite(fv)) return false;
    return Math.abs(fv - value) < Math.max(Math.abs(value), 1) * 0.02 + 0.05;
  };
  const verifyObliqueND = (expr, dirStr, slope, intercept) => {
    const x = dirStr === 'Infinity' ? ND_VERIFY_X : -ND_VERIFY_X;
    const fv = safeEval(expr, x);
    const predicted = slope * x + intercept;
    if (!isFinite(fv) || !isFinite(predicted)) return false;
    return Math.abs(fv - predicted) < Math.max(Math.abs(predicted), 1) * 0.02 + 1;
  };
  const verifyHoleND = (expr, x0, holeValue) => {
    const eps = 1e-4;
    const fL = safeEval(expr, x0 - eps), fR = safeEval(expr, x0 + eps);
    if (!isFinite(fL) || !isFinite(fR)) return false;
    const tol = Math.max(Math.abs(holeValue), 1) * 0.05 + 0.05;
    return Math.abs(fL - holeValue) < tol && Math.abs(fR - holeValue) < tol;
  };

  // ── Hebbare Lücken: unabhängiger, rein algebraischer Erkennungs-Durchlauf ──
  // Der obige numerische Pol-Scanner (probeDivergence-Heuristik weiter oben)
  // erkennt nur Stellen, an denen |f| tatsächlich DIVERGIERT — eine hebbare
  // Lücke divergiert per Definition NICHT (f konvergiert von beiden Seiten
  // gegen einen endlichen Wert), taucht als Scan-Kandidat also so gut wie nie
  // auf und wird von der Pol-vs-Lücke-Umwandlung oben (die nur BESTEHENDE
  // Pol-Kandidaten via Nerdamer umwandelt) folglich auch nie erreicht.
  // Dieser Durchlauf sucht daher unabhängig davon UND rein algebraisch: für
  // jede Funktion, deren Ausdruck strukturell (auf oberster Ebene) ein Bruch
  // N(x)/D(x) ist, werden Zähler und Nenner als Polynome bis Grad 3 gefittet
  // (fitPolyStr, s.o.), alle reellen Nennernullstellen exakt bestimmt
  // (findRealRootsOfPoly, s.o.) und für jede geprüft, ob der Zähler dort
  // ebenfalls verschwindet — die klassische Schulmethode "Zähler/Nenner
  // faktorisieren, gemeinsamen Faktor kürzen, einsetzen" (siehe auch
  // getRationalHoleCancel() weiter unten, das denselben Ansatz für die
  // Lösungsweg-Anzeige eines bereits gefundenen 'hole'-Punkts nutzt).
  for (let fi_idx = 0; fi_idx < functions.length; fi_idx++) {
    const fi_obj = functions[fi_idx];
    if (!fi_obj.expr.trim() || fi_obj.visible === false) continue;
    // WICHTIG: hier bewusst KEIN isLinearFunc()-Ausschluss (anders als beim
    // numerischen Pol-Scanner oben) — isLinearFunc() samplet f''(x) nur an
    // einer festen Stichprobenmenge (u.a. x=-2,-1,0,1,2,...) und übersieht
    // dabei praktisch IMMER die isolierte Lücken-Stelle selbst (Mass 0).
    // Genau der klassische Fall (x²-4)/(x-2) sieht dadurch numerisch exakt
    // wie die Gerade x+2 aus und würde von isLinearFunc() fälschlich als
    // "linear" eingestuft — obwohl er strukturell ein echter Bruch mit
    // hebbarer Lücke ist. Die algebraische AST-Prüfung unten (nur "div" auf
    // oberster Ebene) ist präzise genug, ein zusätzlicher Linearitäts-Filter
    // würde hier nur den häufigsten Lehrbuch-Fall unterdrücken.
    const col = fi_obj.color;
    const dMin = fi_obj.domainMin != null ? fi_obj.domainMin : -Infinity;
    const dMax = fi_obj.domainMax != null ? fi_obj.domainMax : Infinity;

    let ast;
    try { ast = miParseRaw(fi_obj.expr); } catch (e) { continue; }
    if (!ast || ast.type !== 'div') continue; // nur "N(x)/D(x)" als GESAMTE Funktion

    let numRaw, denRaw;
    try { numRaw = miToRaw(ast.a, 0); denRaw = miToRaw(ast.b, 0); } catch (e) { continue; }

    const numCoeffs = fitPolyStr(numRaw);
    const denCoeffs = fitPolyStr(denRaw);
    if (!numCoeffs || !denCoeffs || denCoeffs.length < 2) continue;

    let roots;
    try { roots = findRealRootsOfPoly(denCoeffs); } catch (e) { continue; }
    if (!roots || !roots.length) continue;

    for (const x0 of roots) {
      if (!isFinite(x0)) continue;
      if (x0 < dMin - 1e-9 || x0 > dMax + 1e-9) continue;

      const numAtX0 = evalPolyCoeffs(numCoeffs, x0);
      const denScale = Math.max(1, Math.abs(evalPolyCoeffs(denCoeffs, x0 + 1)));
      if (Math.abs(numAtX0) > denScale * 1e-3) continue; // Zähler verschwindet NICHT -> echter Pol, keine Lücke

      const dn = polyDivideByLinearRoot(numCoeffs, x0);
      const dd = polyDivideByLinearRoot(denCoeffs, x0);
      if (!dd.quotient.length) continue; // Nenner war nur linear -> nach Kürzung konstant, unten weiter geprüft
      const qDVal = evalPolyCoeffs(dd.quotient, x0);
      if (Math.abs(qDVal) < 1e-6) continue; // Nenner hat dort eine MEHRFACHE Nullstelle -> bleibt (unbehandelter) Pol
      const qNVal = dn.quotient.length ? evalPolyCoeffs(dn.quotient, x0) : evalPolyCoeffs(numCoeffs, x0);
      const holeVal = qNVal / qDVal;
      if (!isFinite(holeVal)) continue;

      // Numerische Gegenprobe: f muss sich von BEIDEN Seiten tatsächlich holeVal nähern
      if (!verifyHoleND(fi_obj.expr, x0, holeVal)) continue;

      // Ggf. bestehenden Pol- oder Duplikat-Lücken-Eintrag an (fast) derselben
      // Stelle entfernen (z.B. wenn der numerische Scanner die Stelle durch
      // Zufall trotzdem als Pol-Kandidat aufgenommen hatte).
      for (let j = acc.length - 1; j >= 0; j--) {
        const p = acc[j];
        if (p.fi === fi_idx && (p.kind === 'pole' || p.kind === 'hole') && Math.abs(p.x - x0) < 1e-3) acc.splice(j, 1);
      }
      acc.push({ kind:'hole', fi:fi_idx, x:x0, y:holeVal, col });
    }
  }

  if (typeof ndEvalAsync === 'function') {
    for (let fi_idx = 0; fi_idx < functions.length; fi_idx++) {
      if (cancelled()) return;
      const fi_obj = functions[fi_idx];
      if (!fi_obj.expr.trim() || fi_obj.visible === false) continue;
      if (isLinearFunc(fi_obj.expr)) continue;
      const dMin = fi_obj.domainMin != null ? fi_obj.domainMin : -Infinity;
      const dMax = fi_obj.domainMax != null ? fi_obj.domainMax : Infinity;

      // -- Pol vs. hebbare Lücke (nur bei sauber rationaler Kandidatenstelle) --
      const poleEntries = acc.filter(p => p.kind === 'pole' && p.fi === fi_idx);
      for (const p of poleEntries) {
        if (cancelled()) return;
        const niceX = _niceRationalOrNull(p.xRaw != null ? p.xRaw : p.x, 1e-7);
        if (niceX === null) continue; // irrationale/periodische Stelle -> Nerdamer nicht befragen (s.o.)
        const verdict = await ndPoleOrHole(fi_obj.expr, niceX);
        if (verdict && verdict.isPole === false && verifyHoleND(fi_obj.expr, p.x, verdict.holeValue)) {
          // Hebbare Lücke (kein Pol): der Punkt bleibt erhalten, wird aber vom
          // (nicht existenten) Pol zu einem eigenen 'hole'-Sonderpunkt mit dem
          // exakten CAS-Grenzwert als y-Wert umgewandelt — statt (wie zuvor)
          // einfach gelöscht zu werden. So bekommt der/die Nutzer:in dafür
          // einen Smart-Button samt Lösungsweg statt dass die Lücke stillschweigend
          // verschwindet (siehe generateSolveSteps(), pt.kind === 'hole').
          p.kind = 'hole';
          p.y = verdict.holeValue;
        }
      }

      // -- Horizontale / schräge Asymptoten je Richtung --
      for (const [dirStr, dirLabel, domainOk] of [
        ['Infinity', '+∞', dMax === Infinity],
        ['-Infinity', '-∞', dMin === -Infinity]
      ]) {
        if (!domainOk) continue;
        if (cancelled()) return;
        let hz = await ndHorizontalLimit(fi_obj.expr, dirStr);
        if (hz.ok && !verifyHorizontalND(fi_obj.expr, dirStr, hz.value)) hz = { ok: false, confirmed: false };
        // "confirmed" (Nerdamer: kein endlicher Grenzwert) nur zum Entfernen
        // eines bestehenden numerischen Treffers nutzen, wenn dieser nicht
        // bereits durch eine starke numerische Konvergenz belegt ist — sonst
        // könnte ein unentdeckter Nerdamer-Fehler einen korrekten Befund
        // fälschlich löschen.
        const hasExistingHoriz = acc.some(p => p.fi === fi_idx && p.kind === 'asymp' && !p.oblique && p.dir === dirLabel);
        if (hz.ok || (hz.confirmed && !hasExistingHoriz)) {
          for (let j = acc.length - 1; j >= 0; j--) {
            const p = acc[j];
            if (p.fi === fi_idx && p.kind === 'asymp' && p.dir === dirLabel) acc.splice(j, 1);
          }
          if (hz.ok) {
            acc.push({ kind:'asymp', fi:fi_idx, x:0, y:hz.value, col: fi_obj.color, dir:dirLabel,
                       asympKey:`asymp_${fi_idx}_${parseFloat(hz.value.toFixed(6))}` });
            continue;
          }
        }
        if (cancelled()) return;
        let ob = await ndObliqueLimit(fi_obj.expr, dirStr);
        if (ob.ok && !verifyObliqueND(fi_obj.expr, dirStr, ob.slope, ob.intercept)) ob = { ok: false };
        if (ob.ok) {
          for (let j = acc.length - 1; j >= 0; j--) {
            const p = acc[j];
            if (p.fi === fi_idx && p.kind === 'asymp' && p.dir === dirLabel) acc.splice(j, 1);
          }
          const slopeR = parseFloat(ob.slope.toFixed(5)), intR = parseFloat(ob.intercept.toFixed(4));
          acc.push({ kind:'asymp', fi:fi_idx, x:0, y:0, col: fi_obj.color, dir:dirLabel,
                     oblique:true, slope:slopeR, intercept:intR,
                     asympKey:`asymp_${fi_idx}_oblique_${dirLabel}` });
        }
      }
      { const _yp = yieldIfNeeded(); if (_yp) { await _yp; if (cancelled()) return; } }
    }
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
// Das Sidebar-Panel "Spezielle Punkte" wurde auf Nutzerwunsch entfernt (redundant
// zu den Smart-Buttons direkt unter jeder Funktion) — #special-list existiert daher
// nicht mehr. updateSmartButtons() (weiter unten aufgerufen) bleibt aber nötig, da es
// genau diese Smart-Buttons aktualisiert; darum hier nur early-return statt die
// Funktion ganz zu entfernen.
function renderSpecialList() {
  const el = document.getElementById('special-list');
  if (!el) { if (typeof updateSmartButtons === 'function') updateSmartButtons(); return; }
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
      lbl.textContent = `f${pt.fi+1} ${fmtObliqueAsymLabel(pt.slope, pt.intercept)}  (${t('sp_oblique')}, x→${pt.dir})`;
    } else {
      lbl.textContent = `f${pt.fi+1} ${fmtHorizontalAsymLabel(pt.y)}  (x→${pt.dir})`;
    }
  } else if (pt.kind === 'pole') {
    lbl.textContent = `f${pt.fi+1} ${fmtVerticalAsymLabel(pt.x)}  (${t('sp_vert_asymp_lbl')})`;
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
  // numLatex(v): liefert das LaTeX für eine Zahl EXAKT wie im Eingabefeld —
  // dieselben Erkennungs-Bausteine wie niceNum() (π-Vielfache, Wurzelformen
  // via asSurd(), echte Brüche via asSimpleFrac()), aber mit einem Dezimal-
  // Fallback, der IMMER mindestens 2 Nachkommastellen zeigt (Math.max(precision,2),
  // wie zuvor bei fracHTML()) — unabhängig von der globalen Achsen-Präzisions-
  // Einstellung (Standard: 1 Nachkommastelle), die hier sonst z.B. "2.7" statt
  // "2.73" anzeigen würde.
  function numLatex(v) {
    if (!isFinite(v)) return '\\text{--}';
    if (Math.abs(v) < 1e-9) return '0';
    if (typeof usePiMode === 'function' && usePiMode()) {
      const pf = asPiFraction(v); if (pf) return formatPiLatex(pf.p, pf.q);
    }
    const sr = asSurd(v, true); if (sr) return sr;
    const fr = asSimpleFrac(v, true); if (fr) return fr;
    return parseFloat(v.toFixed(Math.max(precision, 2))).toString();
  }
  // rr(): rendert eine Zahl EXAKT wie im Eingabefeld — über dieselbe Engine
  // (MathLive.convertLatexToMarkup via latexToMathLiveHtml(), siehe 07_export.js)
  // statt einer eigenen Unicode/CSS-Nachbau-Schreibweise, mit numLatex() (s.o.)
  // als Quelle des LaTeX. Dadurch ist die Darstellung hier ununterscheidbar von
  // der im Eingabefeld/den Koordinatenbeschriftungen.
  function rr(v) { return latexToMathLiveHtml(numLatex(v)); }
  function rrSign(v) { return v >= 0 ? `+ ${rr(v)}` : `- ${rr(Math.abs(v))}`; }
  // Format a factor (number being multiplied): negative gets parentheses
  function rrFactor(v) { return v < 0 ? `(${rr(v)})` : rr(v); }
  // rrRad(sr, D): rendert einen (evtl. per simplifyRadicalCASFrac(D) bereits
  // vereinfachten) Wurzelausdruck √D exakt wie im Eingabefeld. sr === null
  // (CAS-Vereinfachung griff nicht) → Ersatz ist die LaTeX-Wurzel \sqrt{D}
  // direkt (NICHT ein eigener Unicode-"√" + separat gerenderte Zahl), damit der
  // Wurzelstrich wie im Eingabefeld über den ganzen Radikanden reicht.
  // rrPi(v): wie rr(), aber erkennt π-Vielfache IMMER (unabhängig vom globalen
  // π-Anzeigemodus-Toggle, genau wie rr()/asSimpleFrac() Brüche immer erkennen)
  // — für trigonometrische Nullstellen/Extrema, deren x-Wert exakt ein
  // π-Bruch ist (z.B. π/3), damit dort "x = π/3" statt einer Dezimalzahl
  // erscheint, wo immer ein exakter Tabellenwert gefunden wurde.
  function rrPi(v) {
    const pf = (typeof asPiFraction === 'function') ? asPiFraction(v) : null;
    if (pf) return latexToMathLiveHtml(formatPiLatex(pf.p, pf.q));
    return rr(v);
  }
  function rrRad(sr, D) {
    const latex = sr ? radicalToLatex(sr) : `\\sqrt{${numLatex(D)}}`;
    return latexToMathLiveHtml(latex);
  }
  // Zeigt f(x) EXAKT wie im Eingabefeld — über denselben Weg wie die Legende/
  // Kurven-Beschriftung (miParseRaw → miToLatex → MathLive-Rendering, siehe
  // exprToMathLiveHtml() in 07_export.js) — statt die Formel aus den intern
  // erkannten Koeffizienten (a,b,c,…) neu zusammenzusetzen. Das vermeidet u.a.
  // einen unnötigen Faktor "1" (z.B. "1x²" statt "x²") und zeigt bei Termen mit
  // mehreren Summanden (z.B. gebrochenrationale Funktionen) exakt die vom
  // Nutzer gewählte Reihenfolge statt einer intern rekonstruierten.
  function exprML(e) { return (typeof exprToMathLiveHtml === 'function') ? exprToMathLiveHtml(e) : _mlEscapeHtmlLocal(e); }
  function _mlEscapeHtmlLocal(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  // Räumt doppelte Vorzeichen auf, die beim Einsetzen negativer Werte entstehen
  // (z.B. "b - x" mit x=-2 → "b - -2" statt "b + 2"). Erkennt sowohl Bindestrich
  // "-" als auch das an anderen Stellen verwendete echte Minuszeichen "−" (z.B.
  // aus fmtObliqueAsymLabel) und beliebige Folgezeichen (Ziffer, Buchstabe,
  // Klammer, LaTeX-Backslash, öffnendes HTML-Tag — Letzteres seit rr() gestapelte
  // Brüche als "<span class=…>…" statt reinem Text liefert) statt nur einzelner
  // Ziffern — vorher wurden z.B. "- -(x+1)" oder "+ -√2" nicht erkannt. Mehrfach
  // angewendet, da eine Ersetzung ein weiteres Doppel-Vorzeichen freilegen kann.
  function fixMM(s) {
    for (let i = 0; i < 2; i++) {
      const before = s;
      s = s.replace(/\+\s*[-−]\s*(?=[\d(a-zA-Z\\√π<])/g, '- ')
           .replace(/[-−]\s*[-−]\s*(?=[\d(a-zA-Z\\√π<])/g, '+ ')
           .replace(/\+\s*\+\s*/g, '+ ');
      if (s === before) break;
    }
    return s;
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

  // Bestimmt das tatsächlich im Ausdruck GESCHRIEBENE Vorzeichen des
  // Koeffizienten vor dem sin/cos/tan-Aufruf. WICHTIG: rein numerisches
  // Sampling (wie die Amplitude a=(max−min)/2 unten) kann dieses Vorzeichen
  // NIE zuverlässig liefern — a·trig(·) mit a<0 ist graphisch identisch mit
  // |a|·trig(·+π) (Phasenverschiebung um π), die beiden Fälle sind vom
  // reinen Kurvenverlauf her nicht unterscheidbar. Was tatsächlich gemeint
  // ist, steht nur im AST des Ausdrucks — hier strukturell ausgelesen
  // (analog zu den anderen AST-Detektoren in dieser Datei), damit die
  // Lösungsweg-Gleichung ("a·trig(·) = −d") zum darüber gezeigten f(x)
  // passt, statt bei negativem Koeffizienten (z.B. "−sin(x)+d") ein
  // falsches, sich selbst widersprechendes Zwischenergebnis zu zeigen.
  function _trigNumLit(node) {
    if (!node) return null;
    if (node.type === 'num') { const v = parseFloat(node.v); return isFinite(v) ? v : null; }
    if (node.type === 'neg') { const v = _trigNumLit(node.x); return v == null ? null : -v; }
    if (node.type === 'id' && typeof params !== 'undefined' && params[node.v] && isFinite(params[node.v].val))
      return params[node.v].val;
    return null;
  }
  function findTrigSign(node, kind, sign) {
    if (!node || typeof node !== 'object') return null;
    switch (node.type) {
      case 'call':
        return node.name === kind ? sign : null;
      case 'neg':
        return findTrigSign(node.x, kind, -sign);
      case 'add': {
        const r1 = findTrigSign(node.a, kind, sign);
        return r1 != null ? r1 : findTrigSign(node.b, kind, sign);
      }
      case 'sub': {
        const r1 = findTrigSign(node.a, kind, sign);
        return r1 != null ? r1 : findTrigSign(node.b, kind, -sign);
      }
      case 'mul': {
        const litA = _trigNumLit(node.a), litB = _trigNumLit(node.b);
        if (litA != null) return findTrigSign(node.b, kind, sign * (litA < 0 ? -1 : 1));
        if (litB != null) return findTrigSign(node.a, kind, sign * (litB < 0 ? -1 : 1));
        const r1 = findTrigSign(node.a, kind, sign);
        return r1 != null ? r1 : findTrigSign(node.b, kind, sign);
      }
      case 'div':
        return findTrigSign(node.a, kind, sign);
      default:
        return null;
    }
  }

  // ── Trigonometrische Funktion charakterisieren ───────────────────────
  // Gibt zurück: { kind:'sin'|'cos'|'tan', mixed, ok, a(Amplitude), d(Offset), period, sign }
  // sign: das tatsächlich geschriebene Vorzeichen des Koeffizienten vor
  // trig(·) (+1 oder −1, per AST-Analyse — s.o.); a bleibt bewusst die
  // (immer positive) Amplitude, wie in der Fachsprache üblich.
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
    let sign = 1;
    try {
      const _ast = miParseRaw(expr);
      const _s = findTrigSign(_ast, kind, 1);
      if (_s != null) sign = _s;
    } catch (e) {}
    return { kind, mixed, ok: true, a, d, period, sign };
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

  // ── Wurzelterm ± linearer Term erkennen (z.B. √(x²+1) − x) ──────────
  // Erkennt f(x) = s·√(Px²+Qx+R) + (Dx+E) — die klassische "∞ − ∞"-Form bei
  // horizontalen Asymptoten von Wurzelfunktionen, die durch Erweitern mit dem
  // KONJUGIERTEN Ausdruck (3. binomische Formel (a+b)(a−b)=a²−b²) exakt gelöst
  // wird, statt nur numerisch zu approximieren. Arbeitet strukturell auf dem
  // AST (miParseRaw) — nicht auf einem numerischen Kurvenfit wie die übrigen
  // get*Coeffs()-Helfer — weil die Zerlegung in "Wurzel-Teil" und "linearer
  // Teil" eine strukturelle (keine numerische) Eigenschaft des Terms ist.
  function getSqrtLinearAsymp() {
    let ast;
    try { ast = miParseRaw(expr); } catch (e) { return null; }
    if (ast.type !== 'add' && ast.type !== 'sub') return null;
    const topSub = ast.type === 'sub';

    // Erkennt (evtl. negiertes/skaliertes) sqrt(...) → {coef, inner}
    function asSqrtTerm(node) {
      if (node.type === 'neg') {
        const r = asSqrtTerm(node.x);
        return r ? { coef: -r.coef, inner: r.inner } : null;
      }
      if (node.type === 'call' && node.name === 'sqrt' && node.args.length === 1) {
        return { coef: 1, inner: node.args[0] };
      }
      if (node.type === 'mul') {
        if (node.a.type === 'num') {
          const r = asSqrtTerm(node.b);
          return r ? { coef: parseFloat(node.a.v) * r.coef, inner: r.inner } : null;
        }
        if (node.b.type === 'num') {
          const r = asSqrtTerm(node.a);
          return r ? { coef: parseFloat(node.b.v) * r.coef, inner: r.inner } : null;
        }
      }
      return null;
    }

    const sqA = asSqrtTerm(ast.a);
    const sqB = asSqrtTerm(ast.b);
    if (!sqA && !sqB) return null;
    if (sqA && sqB) return null; // beide Seiten Wurzeln -> nicht dieser Fall

    let sqrtCoef, innerNode, otherNode, otherSign;
    if (sqA) {
      sqrtCoef = sqA.coef; innerNode = sqA.inner;
      otherNode = ast.b; otherSign = topSub ? -1 : 1;
    } else {
      sqrtCoef = topSub ? -sqB.coef : sqB.coef; innerNode = sqB.inner;
      otherNode = ast.a; otherSign = 1;
    }
    if (Math.abs(sqrtCoef) < 1e-9) return null;

    // Radikand als quadratisches Polynom Px²+Qx+R erkennen (numerischer Fit
    // auf dem Teilausdruck — miToRaw macht den Sub-AST wieder zu einem für
    // deriv1/deriv2/safeEval auswertbaren Rohtext).
    const innerRaw = miToRaw(innerNode, 0);
    const a2 = deriv2(innerRaw, 0);
    if (!isFinite(a2) || Math.abs(a2) < 1e-6) return null; // muss echt quadratisch sein
    // Rundung entfernt Fließkomma-/Ableitungsrauschen (deriv1/deriv2 sind
    // numerische Näherungen, keine exakten Werte) — sonst würde z.B. P=1
    // fälschlich als "0.9999998" statt als ganzzahliger Koeffizient "1"
    // erkannt und in polyStr3() unten explizit (statt weggelassen) angezeigt.
    const P = parseFloat((a2 / 2).toFixed(6)), Q = parseFloat(deriv1(innerRaw, 0).toFixed(6)), R = parseFloat(safeEval(innerRaw, 0).toFixed(6));
    if (!isFinite(P) || !isFinite(Q) || !isFinite(R) || P <= 0) return null;
    for (const x of [1, 2, -1, -2, 3]) {
      const act = safeEval(innerRaw, x);
      if (!isFinite(act)) return null;
      const pred = P*x*x + Q*x + R;
      if (Math.abs(pred - act) > Math.abs(act)*0.02 + 0.05) return null;
    }

    // Linearer "anderer" Teil D·x+E
    const otherRaw = miToRaw(otherNode, 0);
    const o0 = safeEval(otherRaw, 0), o1 = safeEval(otherRaw, 1), om1 = safeEval(otherRaw, -1);
    if (!isFinite(o0) || !isFinite(o1) || !isFinite(om1)) return null;
    const rawD = (o1 - om1) / 2, rawE = o0;
    const o2 = safeEval(otherRaw, 2);
    if (isFinite(o2) && Math.abs((rawD*2+rawE) - o2) > Math.abs(o2)*0.02 + 0.05) return null;
    const D = parseFloat((otherSign * rawD).toFixed(6)), E = parseFloat((otherSign * rawE).toFixed(6));
    if (Math.abs(D) < 1e-9) return null; // ohne linearen Anteil kein "∞−∞"-Fall

    // Gesamt-Verifikation gegen die tatsächliche Funktion
    for (const x of [1, 2, -1, 3, 5]) {
      const inVal = P*x*x + Q*x + R;
      if (inVal < 0) continue;
      const pred = sqrtCoef * Math.sqrt(inVal) + D*x + E;
      const act = safeEval(expr, x);
      if (!isFinite(act)) continue;
      if (Math.abs(pred - act) > Math.abs(act)*0.02 + 0.05) return null;
    }

    // Kürzungsbedingung für das x²-Glied nach dem Erweitern (muss gelten,
    // sonst gäbe es hier gar keinen endlichen Grenzwert — pt kam aber bereits
    // als bestätigte Asymptote herein)
    const s2 = sqrtCoef * sqrtCoef;
    if (Math.abs(s2*P - D*D) > 1e-4 * Math.max(1, s2*P, D*D)) return null;

    const K = parseFloat((s2*Q - 2*D*E).toFixed(6));
    const L = parseFloat((s2*R - E*E).toFixed(6));
    const sgn = pt.dir === '+∞' ? 1 : -1;
    const denomLead = sqrtCoef * sgn * Math.sqrt(P) - D;
    if (Math.abs(denomLead) < 1e-6) return null; // höhere Ordnung nötig -> nicht dieser Fall

    const limVal = Math.abs(K) < 1e-9 ? 0 : K / denomLead;
    if (!isFinite(limVal)) return null;
    // Muss mit dem bereits (numerisch/CAS) bestätigten Grenzwert pt.y übereinstimmen
    if (Math.abs(limVal - pt.y) > Math.abs(pt.y)*0.02 + 0.02) return null;

    return { sqrtCoef, P, Q, R, D, E, K, L, denomLead, limVal };
  }

  // ── Hebbare Lücke: Zähler/Nenner-Polynom exakt durch (x−x0) kürzen ──
  // Erkennt f(x) = N(x)/D(x) (Bruch als äusserste Struktur) und versucht,
  // N und D je als Polynom bis Grad 3 zu erkennen (dieselbe numerische
  // Fit-Methode wie getLinCoeffs/getQuadCoeffs/getCubicCoeffs, nur auf einem
  // beliebigen Teilausdruck statt auf dem gesamten expr). Sind beide bei x0
  // Nullstellen, wird EXAKT per Horner-Schema durch (x−x0) dividiert (nicht
  // numerisch angenähert) — das ist die Standard-Schulmethode für "hebbare
  // Lücken": Zähler und Nenner faktorisieren, gemeinsamen Faktor kürzen,
  // Ergebnis bei x0 einsetzen.
  function getRationalHoleCancel(x0) {
    let ast;
    try { ast = miParseRaw(expr); } catch (e) { return null; }
    if (ast.type !== 'div') return null; // nur "N(x)/D(x)" als GESAMTE Funktion

    // Fit als Polynom bis Grad 3 (liefert Koeffizienten [c_n,...,c0], höchster
    // Grad zuerst, oder null wenn s an keiner der Formen passt) sowie die
    // exakte Polynomdivision durch den Linearfaktor (x−x0, Horner-Schema) —
    // beides die TOP-LEVEL-Versionen (siehe fitPolyStr()/polyDivideByLinearRoot()/
    // evalPolyCoeffs() weiter oben in dieser Datei), die auch vom unabhängigen
    // Lücken-Erkennungs-Durchlauf in computeSpecials() verwendet werden — so
    // bleiben Erkennung und Lösungsweg-Anzeige garantiert konsistent.
    const numRaw = miToRaw(ast.a, 0), denRaw = miToRaw(ast.b, 0);
    const numCoeffs = fitPolyStr(numRaw), denCoeffs = fitPolyStr(denRaw);
    if (!numCoeffs || !denCoeffs) return null;

    const dn = polyDivideByLinearRoot(numCoeffs, x0), dd = polyDivideByLinearRoot(denCoeffs, x0);
    const tolN = Math.max(1, Math.abs(evalPolyCoeffs(numCoeffs, x0+1))) * 1e-3;
    const tolD = Math.max(1, Math.abs(evalPolyCoeffs(denCoeffs, x0+1))) * 1e-3;
    if (Math.abs(dn.remainder) > tolN || Math.abs(dd.remainder) > tolD) return null; // x0 kürzt nicht sauber
    if (!dn.quotient.length || !dd.quotient.length) return null; // konstant/konstant — kein sinnvoller Fall
    const qDVal = evalPolyCoeffs(dd.quotient, x0);
    if (Math.abs(qDVal) < 1e-6) return null; // Nenner nach EINER Kürzung immer noch 0 -> höhere Vielfachheit, nicht abgedeckt
    const qNVal = evalPolyCoeffs(dn.quotient, x0);
    const exactVal = qNVal / qDVal;
    if (Math.abs(exactVal - pt.y) > Math.abs(pt.y)*0.02 + 0.02) return null; // Gegenprobe zum gespeicherten y-Wert

    return { numCoeffs, denCoeffs, quotN: dn.quotient, quotD: dd.quotient, exactVal };
  }

  // ── Lösungswinkel für sin(θ)=k (π-Bruch wenn Tabellenwert) ──────────
  function sinAngle(k) {
    if (!isFinite(k) || Math.abs(k) > 1+1e-6) return null;
    const arc = Math.asin(Math.max(-1, Math.min(1, k)));
    const pf  = asPiFraction(arc);
    const arcStr  = pf ? formatPi(pf.p, pf.q) : `arcsin(${rr(k)})`;
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
    const arcStr = pf ? formatPi(pf.p, pf.q) : `arccos(${rr(k)})`;
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

  } else if (pt.kind === 'hole') {
    // ── Hebbare Lücke: Grenzwert im Endlichen ─────────────────────────
    steps += `<b>Hebbare Lücke von ${fLabel}</b>\n\n`;
    steps += `f(x) ist an der Stelle x = ${rr(pt.x)} nicht definiert (Zähler und Nenner werden dort beide 0) — der Grenzwert existiert dort aber.\n\n`;

    const cancel = getRationalHoleCancel(pt.x);
    if (cancel) {
      function polyToStr(coeffs) {
        const deg = coeffs.length - 1;
        const parts = [];
        coeffs.forEach((c, i) => {
          if (Math.abs(c) < 1e-4) return;
          const p = deg - i;
          const unit = p === 0 ? '' : p === 1 ? 'x' : `x${p === 2 ? '²' : p === 3 ? '³' : '^' + p}`;
          parts.push([c, unit]);
        });
        if (!parts.length) return '0';
        return parts.map(([v, unit], idx) => {
          const mag = (unit && Math.abs(Math.abs(v) - 1) < 1e-4) ? unit : `${rr(Math.abs(v))}${unit}`;
          if (idx === 0) return (v < 0 ? '-' : '') + mag;
          return (v < 0 ? '- ' : '+ ') + mag;
        }).join(' ');
      }
      const { numCoeffs, denCoeffs, quotN, quotD, exactVal } = cancel;
      const hSign = pt.x >= 0 ? `x − ${rr(pt.x)}` : `x + ${rr(-pt.x)}`;
      steps += `f(x) = [${polyToStr(numCoeffs)}] / [${polyToStr(denCoeffs)}]\n\n`;
      steps += `<u>x = ${rr(pt.x)} ist Nullstelle von Zähler UND Nenner</u> → (${hSign}) kürzt sich heraus:\n\n`;
      steps += `Polynomdivision:\n`;
      steps += `  [${polyToStr(numCoeffs)}] : (${hSign}) = ${polyToStr(quotN)}\n`;
      steps += `  [${polyToStr(denCoeffs)}] : (${hSign}) = ${polyToStr(quotD)}\n\n`;
      steps += `Gekürzt (für x ≠ ${rr(pt.x)}):  f(x) = [${polyToStr(quotN)}] / [${polyToStr(quotD)}]\n\n`;
      steps += `x = ${rr(pt.x)} einsetzen:\n`;
      steps += `  lim(x → ${rr(pt.x)}) f(x) = <b>${rr(exactVal)}</b>\n\n`;
      steps += `→ <b>Hebbare Lücke bei (${rr(pt.x)} | ${rr(exactVal)})</b>`;
    } else {
      const yL = safeEval(expr, pt.x - 0.001);
      const yR = safeEval(expr, pt.x + 0.001);
      steps += `${t('solve_limit_beh')}:\n`;
      steps += `  lim f(x) für x → ${rr(pt.x)}⁻:  ${isFinite(yL) ? rr(yL) : '?'}\n`;
      steps += `  lim f(x) für x → ${rr(pt.x)}⁺:  ${isFinite(yR) ? rr(yR) : '?'}\n\n`;
      steps += `Beide einseitigen Grenzwerte stimmen überein (CAS-bestätigt):\n`;
      steps += `  lim(x → ${rr(pt.x)}) f(x) = <b>${rr(pt.y)}</b>\n\n`;
      steps += `→ <b>Hebbare Lücke bei (${rr(pt.x)} | ${rr(pt.y)})</b>`;
    }

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
      const sqrtLin = (!exp && !rat) ? getSqrtLinearAsymp() : null;
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
        steps += `f(x) = ${exprML(expr)}\n\n`;
        steps += `<u>Grenzwert für x → ±∞:</u>\n`;
        steps += `  lim(x → ±∞) ${rr(rA)}/(${hSign}) = 0\n`;
        steps += `  (Zähler konstant, Nenner → ∞)\n\n`;
        steps += `  lim(x → ±∞) f(x) = 0 + ${rr(rK)} = <b>${rr(rK)}</b>\n\n`;
        steps += `→ <b>Horizontale Asymptote: y = ${rr(rK)}</b>\n\n`;
        const yFar = safeEval(expr, 10000);
        steps += `${t('solve_control')}: f(10000) = ${rr(yFar)} ≈ ${rr(rK)} ✓`;
      } else if (sqrtLin) {
        // ── Wurzelterm ± linearer Term: Erweitern mit dem konjugierten Ausdruck ──
        const { sqrtCoef: s, P, Q, R, D, E, K, L, denomLead, limVal } = sqrtLin;
        const s2 = s * s;

        // Baut "±c·x^k" - Terme ohne überflüssige Koeffizienten (1x² → x²) und
        // lässt Glieder mit Koeffizient 0 ganz weg (0x → nichts).
        function polyStr3(p, q, rc) {
          const terms = [];
          if (Math.abs(p) > 1e-9) terms.push([p, 'x²']);
          if (Math.abs(q) > 1e-9) terms.push([q, 'x']);
          if (Math.abs(rc) > 1e-9) terms.push([rc, '']);
          if (!terms.length) return '0';
          // Toleranz 1e-4 statt 1e-9: P/Q stammen z.T. aus deriv2()/deriv1()
          // (finite Differenzen) — bei P insbesondere kann durch Auslöschung
          // bei der Division durch 12H² (H=1e-5) ein Rundungsrauschen von
          // einigen 1e-6 entstehen (bestätigt: 0.999998 statt exakt 1 bei
          // sqrt(x²+4x+5)). Ohne diese Toleranz würde "x²" fälschlich als
          // "0.999998x²" statt als "x²" angezeigt.
          return terms.map(([v, unit], i) => {
            const mag = (unit && Math.abs(Math.abs(v) - 1) < 1e-4) ? unit : `${rr(Math.abs(v))}${unit}`;
            if (i === 0) return (v < 0 ? '-' : '') + mag;
            return (v < 0 ? '- ' : '+ ') + mag;
          }).join(' ');
        }
        // "natürliche" Darstellung von d·x+e (führendes Vorzeichen nur wenn negativ) —
        // zum Einsetzen als eigenständiger, in Klammern stehender Term (z.B. beim Quadrieren).
        function linNatural(d, e) { return polyStr3(0, d, e); }
        // wie linNatural, aber IMMER mit führendem "+ "/"- " — zum Anhängen an einen
        // bereits vorhandenen Term (z.B. hinter dem Wurzelausdruck).
        function linForceSign(d, e) {
          const nat = linNatural(d, e);
          return nat.startsWith('-') ? nat.replace(/^-/, '- ') : `+ ${nat}`;
        }
        function sqrtDispStr(sc, p, q, rc) {
          const core = `√(${polyStr3(p, q, rc)})`;
          if (Math.abs(sc - 1) < 1e-9) return core;
          if (Math.abs(sc + 1) < 1e-9) return `-${core}`;
          return `${rrFactor(sc)}·${core}`;
        }

        const sqrtDisp = sqrtDispStr(s, P, Q, R);
        const origSuffix = linForceSign(D, E);
        const conjSuffix = linForceSign(-D, -E);

        steps += `f(x) = ${exprML(expr)}\n\n`;
        steps += `<u>Grenzwert für x → ${pt.dir}:</u>  Typ „∞ − ∞" (Wurzelterm und linearer Term laufen gegenläufig gegen ∞)\n\n`;
        steps += `<u>Methode: Erweitern mit dem konjugierten Ausdruck</u> (3. binomische Formel: (a+b)(a−b) = a² − b²)\n\n`;
        steps += `Konjugierter Ausdruck: ${sqrtDisp} ${conjSuffix}\n\n`;
        steps += `f(x) = [(${sqrtDisp})² − (${linNatural(D, E)})²] / [${sqrtDisp} ${conjSuffix}]\n\n`;
        steps += `<u>Zähler (a² − b²):</u>\n`;
        steps += `  (${sqrtDisp})² = ${polyStr3(s2*P, s2*Q, s2*R)}\n`;
        steps += `  (${linNatural(D, E)})² = ${polyStr3(D*D, 2*D*E, E*E)}\n`;
        steps += `  Differenz: ${polyStr3(0, K, L)}  (x² kürzt sich!)\n\n`;
        steps += `f(x) = [${polyStr3(0, K, L)}] / [${sqrtDisp} ${conjSuffix}]\n\n`;
        if (Math.abs(K) < 1e-9) {
          steps += `Für x → ${pt.dir}: Zähler bleibt konstant (${rr(L)}), Nenner wächst über alle Grenzen (Wurzelterm dominiert)\n\n`;
          steps += `lim(x → ${pt.dir}) f(x) = ${rr(L)}/∞ = <b>0</b>\n\n`;
        } else {
          steps += `Für x → ${pt.dir}: Zähler und Nenner wachsen beide linear in x — das Verhältnis der Leitkoeffizienten ergibt den Grenzwert:\n\n`;
          steps += `lim(x → ${pt.dir}) f(x) = ${rr(K)} / ${rr(denomLead)} = <b>${rr(limVal)}</b>\n\n`;
        }
        steps += `→ <b>Horizontale Asymptote: y = ${rr(limVal)}</b>\n\n`;
        const xFar = pt.dir === '+∞' ? 10000 : -10000;
        steps += `${t('solve_control')}: f(${xFar}) = ${rr(safeEval(expr, xFar))} ≈ ${rr(limVal)} ✓`;
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
      steps += `f(x) = ${exprML(expr)}\n\n`;
      steps += `f(0) = ${rr(a)}·0 ${rrSign(b)}\n`;
      steps += `f(0) = <b>${rr(b)}</b>\n\n`;
      steps += `${t('solve_yaxis_intersect')}: S = (0 | <b>${rr(b)}</b>)`;
    } else if (quad) {
      const { a, b, c } = quad;
      steps += `f(x) = ${exprML(expr)}\n\n`;
      steps += `f(0) = ${rr(a)}·0² ${rrSign(b)}·0 ${rrSign(c)}\n`;
      steps += `f(0) = <b>${rr(c)}</b>\n\n`;
      steps += `${t('solve_yaxis_intersect')}: S = (0 | <b>${rr(c)}</b>)`;
    } else if (exp) {
      const { a, b } = exp;
      steps += `f(x) = ${exprML(expr)}\n\n`;
      steps += `f(0) = ${rr(a)}·${rr(b)}⁰ = ${rr(a)}·1 = <b>${rr(a)}</b>\n\n`;
      steps += `${t('solve_yaxis_intersect')}: S = (0 | <b>${rr(a)}</b>)`;
    } else {
      steps += `f(0) = <b>${rr(pt.y)}</b>`;
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
      steps += `f(x) = ${exprML(expr)} = 0\n`;
      if (Math.abs(a) < 1e-8) {
        steps += Math.abs(b) < 1e-8 ? t('solve_all_x_zero') : t('solve_no_zero_const');
      } else {
        steps += `${rr(a)}x = ${rr(-b)}\n`;
        steps += `x = ${rr(-b)} ÷ ${rr(a)} = <b>${rr(pt.x)}</b>`;
      }
    } else if (exp) {
      const { a, b } = exp;
      steps += `f(x) = ${exprML(expr)} = 0\n\n`;
      steps += `Da ${rr(b)} > 0 ist ${rr(b)}ˣ > 0 für alle x.\n`;
      steps += `Da a = ${rr(a)} ≠ 0, gilt f(x) ≠ 0 für alle x.\n`;
      steps += `→ <b>${t('solve_no_zero_exp')}</b>`;
    } else if (quad) {
      const { a, b, c } = quad;
      steps += `f(x) = ${exprML(expr)} = 0\n\n`;
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
        // simplifyRadicalCASFrac() statt simplifyRadicalCAS(Math.round(D)):
        // bei echten Bruch-Diskriminanten (z.B. D=17/4 aus nicht-ganzzahligen
        // Koeffizienten) rundete Math.round(D) den Radikanden VOR der CAS-
        // Vereinfachung und lieferte so ein falsches √D (Bugfix, siehe
        // simplifyRadicalCASFrac() weiter oben).
        const srM = simplifyRadicalCASFrac(D);
        const sqStr2 = rrRad(srM, D);
        // Vieta: ganzzahlige oder einfache Wurzeln
        const _xSr = rr(Math.min(x1,x2)), _xLr = rr(Math.max(x1,x2));
        const _aF = Math.abs(a-1)<1e-5 ? "" : (Math.abs(a+1)<1e-5 ? latexToMathLiveHtml("-") : rr(a)+"·");
        // Faktor zu Nullstelle r ist (x − r): bei positivem r also "x − r",
        // bei negativem r "x + |r|" (vorher stand hier fälschlich das
        // umgekehrte Vorzeichen, z.B. "(x + 1)" statt "(x − 1)" für r=1).
        const _fp1 = `(x${-Math.min(x1,x2)<0?" − "+rr(Math.abs(Math.min(x1,x2))):" + "+rr(Math.abs(Math.min(x1,x2)))})`;
        const _fp2 = `(x${-Math.max(x1,x2)<0?" − "+rr(Math.abs(Math.max(x1,x2))):" + "+rr(Math.abs(Math.max(x1,x2)))})`;
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
        // Wurzelzeichen (auch höhere Wurzeln ∛, ⁴√, …) als echtes LaTeX \sqrt[k]{}
        // gerendert (statt Unicode "∛"/"⁴√") — sieht dann wie im Eingabefeld aus.
        const rootLatex = (k, radicandLatex) => (k === 2 ? `\\sqrt{${radicandLatex}}` : `\\sqrt[${k}]{${radicandLatex}}`);
        const rootML = (k, val) => latexToMathLiveHtml(rootLatex(k, numLatex(val)));
        if (n < 0) {
          // ─── Bruchform: f(x) = a/x^m + c = 0 ───────────────────
          const aDisp = aNum.includes('/') ? `(${aNum})` : aNum;
          steps += `f(x) = ${exprML(expr)} = 0\n\n`;
          steps += `<u>Schritt 1: Konstante auf die andere Seite</u>\n`;
          steps += `  ${aDisp}/x${nSup(m)} = ${rr(-c)}\n\n`;
          steps += `<u>Schritt 2: x${nSup(m)} berechnen</u>\n`;
          steps += `  Beide Seiten · x${nSup(m)} (x ≠ 0):\n`;
          steps += `  ${aNum} = ${rr(-c)}·x${nSup(m)}\n`;
          const val = a / (-c);
          steps += `  x${nSup(m)} = ${aNum} / ${rr(-c)} = <b>${rr(val)}</b>\n\n`;
          steps += `<u>Schritt 3: ${m === 2 ? 'Quadrat' : m + '. Potenz'}wurzel ziehen</u>\n`;
          if (val < 0 && m % 2 === 0) {
            steps += `  x${nSup(m)} = ${rr(val)} < 0\n`;
            steps += `  → <b>Keine reelle Nullstelle</b> (gerade Potenz)`;
          } else if (m % 2 === 0) {
            const xVal = Math.pow(val, 1 / m);
            steps += `  x = ±${rootML(m, val)}\n\n`;
            steps += `  x₁ = +<b>${rr(xVal)}</b>\n`;
            steps += `  x₂ = −<b>${rr(xVal)}</b>`;
          } else {
            const xVal = Math.pow(Math.abs(val), 1 / m) * Math.sign(val);
            steps += `  x = ${rootML(m, val)} = <b>${rr(xVal)}</b>`;
          }
        } else {
          // ─── Potenzform: f(x) = a·x^n + c = 0 ──────────────────
          const aPrefix = Math.abs(a) === 1 ? (a < 0 ? '−' : '') : `${aNum}·`;
          steps += `f(x) = ${exprML(expr)} = 0\n\n`;
          steps += `<u>Schritt 1: x${nSup(n)} isolieren</u>\n`;
          steps += `  ${aPrefix}x${nSup(n)} = ${rr(-c)}\n`;
          const val = -c / a;
          steps += `  x${nSup(n)} = ${rr(-c)} / ${rr(a)} = <b>${rr(val)}</b>\n\n`;
          steps += `<u>Schritt 2: ${n === 2 ? 'Quadrat' : n + '. Potenz'}wurzel ziehen</u>\n`;
          if (val < 0 && n % 2 === 0) {
            steps += `  x${nSup(n)} = ${rr(val)} < 0\n`;
            steps += `  → <b>Keine reelle Nullstelle</b> (gerade Potenz)`;
          } else if (n % 2 === 0) {
            const xVal = Math.pow(val, 1 / n);
            steps += `  x = ±${rootML(n, val)}\n\n`;
            steps += `  x₁ = +<b>${rr(xVal)}</b>\n`;
            steps += `  x₂ = −<b>${rr(xVal)}</b>`;
          } else {
            const xVal = Math.pow(Math.abs(val), 1 / n) * Math.sign(val);
            steps += `  x = ${rootML(n, val)} = <b>${rr(xVal)}</b>`;
          }
        }
      } else {
        // Trig, gebrochenrational oder generisch
        const trig = getTrigInfo();
        const rat  = ratEarly; // bereits oben berechnet (vor quad)
        if (trig && !trig.mixed && trig.ok && Math.abs(trig.a) > 1e-6) {
          const { kind, a, d, sign } = trig;
          // aSigned: das tatsächlich vor trig(·) stehende (auch negative)
          // Vorzeichen berücksichtigen (s. findTrigSign oben) — a selbst
          // bleibt die (stets positive) Amplitude.
          const aSigned = a * sign;
          const k    = -d / aSigned;                  // trig(·) = k
          const kStr = rr(k);
          const kindDE = kind === 'sin' ? 'Sinus' : kind === 'cos' ? 'Kosinus' : 'Tangens';
          steps += `<b>Methode: ${kindDE}-Gleichung</b>\n\n`;
          if (Math.abs(aSigned - 1) > 0.01 || Math.abs(d) > 1e-4) {
            steps += `${fLabel} = 0  →  ${kind}(·) isolieren:\n`;
            if (Math.abs(d) > 1e-4) steps += `  ${rr(aSigned)}·${kind}(·) = ${rr(-d)}\n`;
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
            steps += `Hier: x = <b>${rrPi(pt.x)}</b>`;

          } else if (kind === 'sin') {
            if (Math.abs(k) > 1+1e-6) {
              steps += `|${kStr}| > 1  →  <b>Keine reelle Nullstelle</b>`;
            } else if (Math.abs(k) < 1e-6) {
              steps += `<u>Tabellenwert:</u> sin(k·π) = 0\n  →  · = k·π  (k ∈ ℤ)\n\n`;
              steps += `Hier: x = <b>${rrPi(pt.x)}</b>`;
            } else if (Math.abs(Math.abs(k)-1) < 1e-6) {
              const aStr = k > 0 ? 'π/2' : '−π/2';
              steps += `<u>Tabellenwert:</u> sin(${aStr}) = ${kStr}\n  →  · = ${aStr} + 2k·π  (k ∈ ℤ)\n\n`;
              steps += `Hier: x = <b>${rrPi(pt.x)}</b>`;
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
              steps += `Hier: x = <b>${rrPi(pt.x)}</b>`;
            }

          } else { // cos
            if (Math.abs(k) > 1+1e-6) {
              steps += `|${kStr}| > 1  →  <b>Keine reelle Nullstelle</b>`;
            } else if (Math.abs(k) < 1e-6) {
              steps += `<u>Tabellenwert:</u> cos(π/2) = 0\n  →  · = π/2 + k·π  (k ∈ ℤ)\n\n`;
              steps += `Hier: x = <b>${rrPi(pt.x)}</b>`;
            } else if (Math.abs(Math.abs(k)-1) < 1e-6) {
              const aStr = k > 0 ? '0 (bzw. 2π)' : 'π';
              steps += `<u>Tabellenwert:</u> cos(${aStr}) = ${kStr}\n  →  · = ${k>0?'':'π + '}2k·π  (k ∈ ℤ)\n\n`;
              steps += `Hier: x = <b>${rrPi(pt.x)}</b>`;
            } else {
              const info = cosAngle(k);
              if (info && info.isTable) {
                steps += `<u>Tabellenwert (Einheitskreis):</u>\n  cos(${info.arcStr}) = ${kStr}\n\n`;
                steps += `<u>Allgemeine Lösung:</u>\n  · = ±${info.arcStr} + 2k·π  (k ∈ ℤ)\n\n`;
              } else {
                steps += `Kein exakter Tabellenwert  →  numerisch:\n`;
                steps += `  · = ±arccos(${kStr}) + 2k·π\n\n`;
              }
              steps += `Hier: x = <b>${rrPi(pt.x)}</b>`;
            }
          }

        } else if (rat) {
          const { a: rA, h: rH, k: rK } = rat;
          const hS = Math.abs(rH)<1e-5?'x':(rH<0?`x + ${rr(-rH)}`:`x − ${rr(rH)}`);
          steps += `<b>Nullstelle der gebrochenrationalen Funktion:</b>\n\n`;
          steps += `f(x) = ${exprML(expr)} = 0\n\n`;
          steps += `<u>Schritt 1:</u>  Bruchterm auf die andere Seite\n`;
          steps += `  ${rr(rA)}/(${hS}) = ${rr(-rK)}\n\n`;
          steps += `<u>Schritt 2:</u>  Gleichung auflösen  (×(${hS}))\n`;
          steps += `  ${rr(rA)} = ${rr(-rK)}·(${hS})\n`;
          if (Math.abs(rK) > 1e-6) {
            steps += `  ${hS} = ${rr(rA)}/(${rr(-rK)}) = ${rr(rA/(-rK))}\n`;
            steps += `  x = <b>${rr(pt.x)}</b>`;
          } else {
            steps += `  Zähler ${rr(rA)} ≠ 0  →  <b>Keine Nullstelle</b>`;
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
            steps += `<b>Nullstelle: f(x) = ${exprML(expr)} = 0</b>\n\n`;
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
              const srZ = simplifyRadicalCASFrac(D);
              const sqStr = rrRad(srZ, D);
              steps += `  D = ${rr(D)}\n`;
              steps += `  x₁ = (${rr(-B)} + ${sqStr}) / ${rr(2*A)} = <b>${rr(x1)}</b>\n`;
              steps += `  x₂ = (${rr(-B)} − ${sqStr}) / ${rr(2*A)} = <b>${rr(x2)}</b>`;
            }
          } else {
            // Allgemeine kubische (oder höhergradige, per getCubicCoeffs() erkannte)
            // Funktion ohne einfache Bruchzerlegung: Rateverfahren (Satz von der
            // rationalen Nullstelle) + Polynomdivision + Mitternachtsformel für den
            // Rest — die im Unterricht übliche Methode, statt direkt numerisch
            // aufzugeben (siehe findRationalRootCubic()/polyDivideByRoot3() oben).
            const cubicZ = getCubicCoeffs();
            const rootInfo = cubicZ ? findRationalRootCubic(cubicZ.a, cubicZ.b, cubicZ.c, cubicZ.d) : null;
            if (cubicZ && rootInfo) {
              const { p, q, intCoeffs } = rootInfo;
              const [A, B, C, D] = intCoeffs;
              const r0 = p / q;
              steps += `<b>Nullstelle: f(x) = ${exprML(expr)} = 0</b>\n\n`;
              steps += `<u>Schritt 1: Rateverfahren (Satz von der rationalen Nullstelle)</u>\n`;
              steps += `  Kandidat x = ${rr(r0)} testen:  f(${rr(r0)}) = <b>0</b> ✓\n\n`;
              const hSignC = r0 >= 0 ? `x − ${rr(r0)}` : `x + ${rr(-r0)}`;
              steps += `<u>Schritt 2: Polynomdivision durch (${hSignC})</u>\n`;
              const quot = polyDivideByRoot3(A, B, C, D, p, q);
              // A,B,C,D sind ganzzahlig SKALIERT (s. findRationalRootCubic —
              // sucht den kleinsten Faktor, der alle vier Koeffizienten zu
              // Ganzzahlen macht). Für die ANZEIGE auf die tatsächlichen,
              // unskalierten Koeffizienten von f(x) zurückrechnen — sonst
              // zeigt "Schritt 2" das Ergebnis der Division des SKALIERTEN
              // Polynoms, das nicht mehr zum direkt darüber angezeigten f(x)
              // passt (z.B. f(x)=0.5x³−1.5x²−2x+6 : (x−2) würde als
              // "x²−x−6" statt korrekt "0.5x²−0.5x−3" erscheinen). Die
              // WURZELN der Restgleichung sind skalierungsinvariant (hängen
              // nur von den Verhältnissen B/A, C/A ab) — nur die Anzeige
              // ändert sich.
              const cubicScale = A / cubicZ.a;
              const quotA = quot.A / cubicScale, quotB = quot.B / cubicScale, quotC = quot.C / cubicScale;
              steps += `  → ${rr(quotA)}x² ${rrSign(quotB)}x ${rrSign(quotC)} = 0\n\n`;
              const Dq = quotB*quotB - 4*quotA*quotC;
              let otherRoots = [];
              steps += `<u>Schritt 3: Restgleichung lösen</u>\n`;
              if (Math.abs(Dq) < 1e-6) {
                const x0 = -quotB/(2*quotA);
                steps += `  D = 0  →  Doppelte Nullstelle: x = <b>${rr(x0)}</b>\n\n`;
                otherRoots = [x0];
              } else if (Dq < 0) {
                steps += `  D = ${rr(Dq)} < 0  →  Keine weiteren reellen Nullstellen\n\n`;
              } else {
                const sqDq = Math.sqrt(Dq);
                const qx1 = (-quotB+sqDq)/(2*quotA), qx2 = (-quotB-sqDq)/(2*quotA);
                const srQ = simplifyRadicalCASFrac(Dq);
                const sqStrQ = rrRad(srQ, Dq);
                steps += `  D = ${rr(Dq)}  →  √D = ${sqStrQ}\n`;
                steps += `  x = (${rr(-quotB)} ± ${sqStrQ}) / ${rr(2*quotA)}\n\n`;
                otherRoots = [qx1, qx2];
              }
              const allRoots = [r0, ...otherRoots].sort((x,y) => x-y);
              const subs = ['₁','₂','₃'];
              steps += `<u>Alle Nullstellen:</u>\n`;
              steps += '  ' + allRoots.map((rv,i) => `x${subs[i]||i+1} = <b>${rr(rv)}</b>`).join(',  ') + '\n\n';
              steps += `Hier: x = <b>${rr(pt.x)}</b>`;
            } else {
              steps += `f(x) = 0\nNumerisch: x ≈ <b>${rr(pt.x)}</b>`;
            }
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
      steps += `f(x) = ${exprML(expr)}\n\n`;
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
        steps += `f(x) = ${exprML(expr)}\n\n`;
        steps += `<u>1. Ableitung:</u>\n  f'(x) = ${rr(3*a)}x² ${rrSign(2*b)}x ${rrSign(c)}\n\n`;
        steps += `<u>Extremum: f'(x) = 0</u>\n`;
        const A = 3*a, B = 2*b, C = c;
        const D = B*B - 4*A*C;
        steps += `  ${rr(A)}x² ${rrSign(B)}x ${rrSign(C)} = 0\n`;
        steps += `  D = (${rr(B)})² − 4·${rr(A)}·${rr(C)} = ${rr(B*B)} − ${rr(4*A*C)} = ${rr(D)}\n\n`;
        if (D < -1e-8) {
          steps += `  D < 0  →  <b>Kein reelles Extremum</b>`;
        } else if (Math.abs(D) < 1e-8) {
          const xs = -B/(2*A);
          steps += `  D = 0  →  Sattelstelle (kein echtes Extremum): x = ${rr(xs)}`;
        } else {
          const sqD = Math.sqrt(D);
          const x1 = (-B+sqD)/(2*A), x2 = (-B-sqD)/(2*A);
          const srD = simplifyRadicalCASFrac(D);
          const sqStr = rrRad(srD, D);
          steps += `  x = (−(${rr(B)}) ± ${sqStr}) / (2·${rr(A)})\n`;
          steps += `  x₁ = ${rr(x1)},  x₂ = ${rr(x2)}\n\n`;
          steps += `<u>2. Ableitung (bestimmt Hoch/Tiefpunkt):</u>\n`;
          steps += `  f''(x) = ${rr(6*a)}x ${rrSign(2*b)}\n`;
          const thisX = Math.abs(x1 - pt.x) < Math.abs(x2 - pt.x) ? x1 : x2;
          const d2at  = 6*a*thisX + 2*b;
          steps += `  f''(${rr(thisX)}) ≈ ${rr(d2at)} ${d2at < 0 ? '< 0  → Hochpunkt ✓' : '> 0  → Tiefpunkt ✓'}\n\n`;
          steps += `Extremum: (${rr(pt.x)} | <b>${rr(pt.y)}</b>)`;
        }

      } else if (trig && !trig.mixed && trig.ok && trig.kind !== 'tan') {
        const { kind, a, d, sign } = trig;
        const kindDE  = kind === 'sin' ? 'Sinus' : 'Kosinus';
        // f(x) = sign·a·trig(·) + d (a = Amplitude, stets positiv). Der
        // WERT des Extremums ist unabhängig vom Vorzeichen immer d+a (Max)
        // bzw. d−a (Min) — aber WELCHER trig(·)-Wert (+1 oder −1) dorthin
        // führt, hängt vom tatsächlichen Vorzeichen ab: bei negativem
        // Koeffizienten (sign=−1) liefert trig(·)=−1 den Hochpunkt und
        // trig(·)=+1 den Tiefpunkt (vertauscht gegenüber sign=+1). Ohne
        // diese Unterscheidung würde z.B. bei f(x)=−sin(x) der Hochpunkt
        // fälschlich bei "· = π/2" (statt der tatsächlichen Stelle −π/2)
        // behauptet.
        const wantsPlusOne = (pt.kind === 'max') === (sign > 0);
        const condStr = wantsPlusOne ? '1' : '−1';
        const angleStr = wantsPlusOne
          ? (kind === 'sin' ? 'π/2' : '0 (bzw. 2π)')
          : (kind === 'sin' ? '3π/2 (bzw. −π/2)' : 'π');
        const extremVal = pt.kind === 'max' ? (a + d) : (-a + d);
        steps += `<b>${kindStr}: ${kindDE}-funktion</b>\n\n`;
        steps += `<u>Amplitude:</u> a ≈ ${rr(a)},  <u>Mittellinie:</u> d ≈ ${rr(d)}\n\n`;
        steps += `${kindStr} wenn ${kind}(·) = ${condStr}:\n`;
        steps += `  ·  = ${angleStr} + 2k·π  (k ∈ ℤ)\n\n`;
        steps += `${pt.kind === 'max' ? 'Maximaler' : 'Minimaler'} Wert:\n`;
        steps += `  f = ${pt.kind === 'max' ? '+' : '−'}${rr(a)} + ${rr(d)} = <b>${rr(extremVal)}</b>\n\n`;
        steps += `Hier: (${rrPi(pt.x)} | <b>${rr(pt.y)}</b>)`;

      } else {
        const decE = getRationalDecomposition();
        if (decE) {
          const { h, m, b: bD, R } = decE;
          const sS = Math.abs(m-1)<1e-5?'x':(Math.abs(m+1)<1e-5?'−x':`${rr(m)}x`);
          const bS = Math.abs(bD)<1e-6?'':(bD>0?` + ${rr(bD)}`:` − ${rr(-bD)}`);
          const hSign = Math.abs(h)<1e-5?'x':(h<0?`x + ${rr(-h)}`:`x − ${rr(h)}`);
          steps += `<u>Methode: Ableitung der Zerlegung f(x) = ${exprML(expr)}</u>\n\n`;
          steps += `f'(x) = ${rr(m)} − ${rr(R)}/(${hSign})²\n\n`;
          steps += `<u>Extremum: f'(x) = 0</u>\n`;
          steps += `  ${rr(m)} = ${rr(R)}/(${hSign})²\n`;
          steps += `  (${hSign})² = ${rr(R)}/${rr(m)} = ${rr(R/m)}\n`;
          if (R/m < -1e-9) {
            steps += `  ${rr(R/m)} < 0  →  <b>Keine reelle Lösung</b>`;
          } else {
            const sq = Math.sqrt(Math.max(0, R/m));
            // Wie bei den anderen Wurzelausdrücken in diesem Lösungsweg (Nullstellen,
            // Schnittpunkte): √(R/m) mit dem externen CAS vereinfachen statt nur auf
            // Ganzzahligkeit zu prüfen — sonst bliebe ein nicht-perfektes Quadrat wie
            // R/m=8 als unschönes "√8" statt als "2√2" stehen.
            const srE = simplifyRadicalCASFrac(R/m);
            const sqStr = rrRad(srE, R/m);
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
          steps += `  x ≈ <b>${rr(pt.x)}</b>\n`;
          steps += `  f(${rr(pt.x)}) = <b>${rr(pt.y)}</b>\n\n`;
          const d2 = deriv2(expr, pt.x);
          steps += `<u>2. Ableitung (Nachweis):</u>\n`;
          steps += `  f''(${rr(pt.x)}) ≈ ${r(d2,3)} ${d2<0?'< 0  → Hochpunkt':'> 0  → Tiefpunkt'}`;
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
    // Kubische Koeffizienten für BEIDE Funktionen (getCubicCoeffs() oben arbeitet
    // nur auf der äusseren `expr`/fi — hier dieselbe Erkennung für expr2/fj
    // nachgebaut) — ermöglicht das Rateverfahren (s.u.) auch für Schnittpunkte,
    // bei denen mind. eine Seite kubisch ist (sonst würde direkt numerisch
    // aufgegeben, obwohl f1(x)−f2(x) ein Polynom bis Grad 3 ist).
    const cubic1 = getCubicCoeffs();
    const cubic2 = (() => {
      const H = 0.1;
      const d3 = (safeEval(expr2,3*H)-3*safeEval(expr2,H)+3*safeEval(expr2,-H)-safeEval(expr2,-3*H))/(8*H*H*H);
      const a = d3/6;
      if (!isFinite(a) || Math.abs(a) < 1e-5) return null;
      const d4 = (safeEval(expr2,2*H)-4*safeEval(expr2,H)+6*safeEval(expr2,0)-4*safeEval(expr2,-H)+safeEval(expr2,-2*H))/(H*H*H*H);
      if (Math.abs(d4) > 2 + 3*Math.abs(a)) return null;
      const b = deriv2(expr2, 0)/2, c = deriv1(expr2, 0), d = safeEval(expr2, 0);
      if (!isFinite(b) || !isFinite(c) || !isFinite(d)) return null;
      for (const x of [1, 2, -1, -2, 1.5]) {
        const pred = a*x*x*x + b*x*x + c*x + d, act = safeEval(expr2, x);
        if (!isFinite(act) || Math.abs(pred - act) > 0.05*(Math.abs(act)+1)) return null;
      }
      return { a: parseFloat(a.toFixed(5)), b: parseFloat(b.toFixed(5)), c: parseFloat(c.toFixed(5)), d: parseFloat(d.toFixed(5)) };
    })();
    // Bringt zwei Polynom-Koeffizientensätze (linear {a,b} / quadratisch {a,b,c} /
    // kubisch {a,b,c,d}, höchster Grad zuerst) auf gemeinsame Form {a,b,c,d} und
    // bildet die Differenz — Basis für das Rateverfahren bei f1(x) − f2(x) = 0.
    function diffPoly3(p1, p2) {
      const norm = (p) => p.d !== undefined ? p : (p.c !== undefined ? { a: 0, b: p.a, c: p.b, d: p.c } : { a: 0, b: 0, c: p.a, d: p.b });
      const n1 = norm(p1), n2 = norm(p2);
      return { a: n1.a-n2.a, b: n1.b-n2.b, c: n1.c-n2.c, d: n1.d-n2.d };
    }

    if (lin1 && lin2) {
      const { a: a1, b: b1 } = lin1, { a: a2, b: b2 } = lin2;
      steps += `f${fi+1}(x) = ${exprML(expr)}\n`;
      steps += `f${fj+1}(x) = ${exprML(expr2)}\n\n`;
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
        // √D wie bei den Nullstellen mit dem externen CAS vereinfachen (statt
        // unvereinfacht als "√12" stehen zu lassen).
        const srI1 = simplifyRadicalCASFrac(D);
        const sqStrI1 = rrRad(srI1, D);
        steps += `  x₁ = (${rr(-B)} + ${sqStrI1}) / ${rr(2*A)} = <b>${rr(x1)}</b>\n`;
        steps += `  x₂ = (${rr(-B)} − ${sqStrI1}) / ${rr(2*A)} = <b>${rr(x2)}</b>\n\n`;
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
          // √D wie bei den Nullstellen mit dem externen CAS vereinfachen.
          const srI2 = simplifyRadicalCASFrac(D);
          const sqStrI2 = rrRad(srI2, D);
          steps += `  x₁ = (${rr(-B)} + ${sqStrI2}) / ${rr(2*A)} = <b>${rr(x1)}</b>\n`;
          steps += `  x₂ = (${rr(-B)} − ${sqStrI2}) / ${rr(2*A)} = <b>${rr(x2)}</b>\n\n`;
          steps += `  y₁ = f${fi+1}(${rr(x1)}) = <b>${rr(y1)}</b>\n`;
          steps += `  y₂ = f${fi+1}(${rr(x2)}) = <b>${rr(y2)}</b>\n\n`;
          steps += `S₁ = (<b>${rr(x1)}</b> | <b>${rr(y1)}</b>),  S₂ = (<b>${rr(x2)}</b> | <b>${rr(y2)}</b>)`;
        }
      }
    } else {
      // Mind. eine Seite kubisch (sonst wäre eine der Verzweigungen oben
      // gegriffen): f1(x) − f2(x) ist ein Polynom bis Grad 3 → dasselbe
      // Rateverfahren + Polynomdivision wie bei der kubischen Nullstelle oben
      // versuchen, statt direkt numerisch aufzugeben.
      const poly1 = cubic1 || quad1 || lin1, poly2 = cubic2 || quad2 || lin2;
      const diff = (poly1 && poly2) ? diffPoly3(poly1, poly2) : null;
      const rootInfoI = diff && Math.abs(diff.a) > 1e-6 ? findRationalRootCubic(diff.a, diff.b, diff.c, diff.d) : null;
      if (rootInfoI) {
        const { p, q, intCoeffs } = rootInfoI;
        const [A, B, C, D] = intCoeffs;
        const r0 = p / q;
        steps += `f${fi+1}(x) = ${exprML(expr)}\n`;
        steps += `f${fj+1}(x) = ${exprML(expr2)}\n\n`;
        steps += `Gleichsetzen  →  f${fi+1}(x) − f${fj+1}(x) = 0:\n`;
        steps += `  ${rr(diff.a)}x³ ${rrSign(diff.b)}x² ${rrSign(diff.c)}x ${rrSign(diff.d)} = 0\n\n`;
        steps += `<u>Schritt 1: Rateverfahren (Satz von der rationalen Nullstelle)</u>\n`;
        steps += `  Kandidat x = ${rr(r0)} testen:  ✓\n\n`;
        const hSignC = r0 >= 0 ? `x − ${rr(r0)}` : `x + ${rr(-r0)}`;
        steps += `<u>Schritt 2: Polynomdivision durch (${hSignC})</u>\n`;
        const quot = polyDivideByRoot3(A, B, C, D, p, q);
        // A,B,C,D sind ganzzahlig skaliert (s. findRationalRootCubic) — für
        // die Anzeige auf die unskalierten Koeffizienten von diff (das
        // direkt darüber gezeigte "a x³+b x²+c x+d = 0") zurückrechnen, s.
        // ausführlicher Kommentar bei der analogen Nullstellen-Berechnung
        // oben (pt.kind === 'zero', kubischer Fall).
        const cubicScale = A / diff.a;
        const quotA = quot.A / cubicScale, quotB = quot.B / cubicScale, quotC = quot.C / cubicScale;
        steps += `  → ${rr(quotA)}x² ${rrSign(quotB)}x ${rrSign(quotC)} = 0\n\n`;
        const Dq = quotB*quotB - 4*quotA*quotC;
        let otherRoots = [];
        steps += `<u>Schritt 3: Restgleichung lösen</u>\n`;
        if (Math.abs(Dq) < 1e-6) {
          const x0 = -quotB/(2*quotA);
          steps += `  D = 0  →  Doppelte Lösung: x = <b>${rr(x0)}</b>\n\n`;
          otherRoots = [x0];
        } else if (Dq < 0) {
          steps += `  D = ${rr(Dq)} < 0  →  Keine weiteren reellen Lösungen\n\n`;
        } else {
          const sqDq = Math.sqrt(Dq);
          const qx1 = (-quotB+sqDq)/(2*quotA), qx2 = (-quotB-sqDq)/(2*quotA);
          const srQ = simplifyRadicalCASFrac(Dq);
          const sqStrQ = rrRad(srQ, Dq);
          steps += `  D = ${rr(Dq)}  →  √D = ${sqStrQ}\n`;
          steps += `  x = (${rr(-quotB)} ± ${sqStrQ}) / ${rr(2*quotA)}\n\n`;
          otherRoots = [qx1, qx2];
        }
        const allRoots = [r0, ...otherRoots].sort((x,y) => x-y);
        const subs = ['₁','₂','₃'];
        steps += `<u>Alle Schnittstellen:</u>\n`;
        steps += '  ' + allRoots.map((rv,i) => {
          const yv = safeEval(expr, rv);
          return `x${subs[i]||i+1} = <b>${rr(rv)}</b> (y = <b>${rr(yv)}</b>)`;
        }).join(',  ') + '\n\n';
        steps += `Hier: S = (<b>${rr(pt.x)}</b> | <b>${rr(pt.y)}</b>)`;
      } else {
        steps += `f${fi+1}(x) = f${fj+1}(x)\n(Analytisch nicht allgemein lösbar)\n\n`;
        steps += `Numerisch: x ≈ <b>${rr(pt.x)}</b>, y ≈ <b>${rr(pt.y)}</b>`;
      }
    }

  } else if (pt.kind === 'inf') {
    steps += `<b>Wendepunkt von ${fLabel}</b>\n\n`;
    const quad  = getQuadCoeffs();
    const cubic = getCubicCoeffs();
    const trig  = getTrigInfo();

    if (quad && !cubic) {
      // Parabel hat keinen Wendepunkt
      steps += `f(x) = ${exprML(expr)}\n\n`;
      steps += `<u>2. Ableitung:</u>\n  f''(x) = ${rr(2*quad.a)}\n\n`;
      steps += `f''(x) ist konstant  →  <b>Kein Wendepunkt</b>\n`;
      steps += `(Parabeln sind überall konvex oder überall konkav.)`;

    } else if (cubic) {
      const { a, b, c, d } = cubic;
      steps += `f(x) = ${exprML(expr)}\n\n`;
      steps += `<u>1. Ableitung:</u>\n  f'(x) = ${rr(3*a)}x² ${rrSign(2*b)}x ${rrSign(c)}\n\n`;
      steps += `<u>2. Ableitung:</u>\n  f''(x) = ${rr(6*a)}x ${rrSign(2*b)}\n\n`;
      steps += `<u>Wendepunkt: f''(x) = 0</u>\n`;
      steps += `  ${rr(6*a)}x ${rrSign(2*b)} = 0\n`;
      steps += `  ${rr(6*a)}x = ${rr(-2*b)}\n`;
      const xW = -b/(3*a);
      steps += `  x = ${rr(-2*b)} / ${rr(6*a)} = <b>${rr(xW)}</b>\n\n`;
      steps += `<u>Vorzeichentest (Krümmung wechselt):</u>\n`;
      const d2L = deriv2(expr, xW - 0.1), d2R = deriv2(expr, xW + 0.1);
      steps += `  f''(x − ε) ≈ ${r(d2L,3)} ${d2L<0?'< 0  (konkav)':'> 0  (konvex)'}\n`;
      steps += `  f''(x + ε) ≈ ${r(d2R,3)} ${d2R<0?'< 0  (konkav)':'> 0  (konvex)'}\n`;
      steps += `  → Vorzeichenwechsel ✓\n\n`;
      steps += `Wendepunkt: W = (<b>${rr(pt.x)}</b> | <b>${rr(pt.y)}</b>)`;

    } else if (trig && !trig.mixed && trig.ok && trig.kind !== 'tan') {
      const { kind, a, d, period } = trig;
      const derKind = kind === 'sin' ? 'cos' : 'sin';
      const kindDE  = kind === 'sin' ? 'Sinus' : 'Kosinus';
      steps += `${fLabel} ist eine ${kindDE}-funktion.\n\n`;
      steps += `<u>Ableitungsregeln:</u>\n`;
      steps += `  f(x) ≈ ${rr(a)}·${kind}(b·x) + ${rr(d)}\n`;
      steps += `  f'(x) ≈ ${rr(a)}·b·${derKind}(b·x)\n`;
      steps += `  f''(x) ≈ −${rr(a)}·b²·${kind}(b·x)\n\n`;
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
      steps += `  ${kind}(b·x) = 0  →  f(x) = ${rr(a)}·0 + ${rr(d)} = <b>${rr(d)}</b>\n\n`;
      const d2L = deriv2(expr, pt.x - 0.05), d2R = deriv2(expr, pt.x + 0.05);
      steps += `<u>Vorzeichenkontrolle (f''):</u>\n`;
      steps += `  f''(x − ε) ≈ ${r(d2L,3)} ${d2L<0?'< 0':'> 0'}\n`;
      steps += `  f''(x + ε) ≈ ${r(d2R,3)} ${d2R<0?'< 0':'> 0'}  → Vorzeichenwechsel ✓\n\n`;
      steps += `W = (<b>${rr(pt.x)}</b> | <b>${rr(pt.y)}</b>)`;

    } else {
      // Allgemeiner numerischer Fall
      steps += `<u>Bedingung: f''(x) = 0 mit Vorzeichenwechsel</u>\n\n`;
      steps += `Numerisch: x ≈ <b>${rr(pt.x)}</b>\n`;
      steps += `f(${rr(pt.x)}) ≈ <b>${rr(pt.y)}</b>\n\n`;
      const d2L = deriv2(expr, pt.x - 0.1), d2R = deriv2(expr, pt.x + 0.1);
      steps += `<u>Vorzeichentest:</u>\n`;
      steps += `  f''(x − ε) ≈ ${r(d2L,3)} ${d2L<0?'< 0  (konkav)':'> 0  (konvex)'}\n`;
      steps += `  f''(x + ε) ≈ ${r(d2R,3)} ${d2R<0?'< 0  (konkav)':'> 0  (konvex)'}\n`;
      steps += `  → Vorzeichenwechsel: ${Math.sign(d2L) !== Math.sign(d2R) ? '✓  Wendepunkt bestätigt' : '— kein echter Wendepunkt'}\n\n`;
      steps += `W = (<b>${rr(pt.x)}</b> | <b>${rr(pt.y)}</b>)`;
    }
  }
  return fixMM(steps) || `Numerisch: x ≈ ${rr(pt.x)}, y ≈ ${rr(pt.y)}`;
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

// Berechnet das VORZEICHENBEHAFTETE bestimmte Integral einer einzelnen
// Funktion im Intervall [x1, x2] — im Unterschied zu computeArea() OHNE
// Betragsbildung, also der tatsächliche Wert ∫ f(x) dx (kann negativ werden
// bzw. sich teilweise aufheben, wenn die Funktion im Intervall unter die
// x-Achse fällt). Gleicher Algorithmus (Simpson-Regel, n=2000) wie
// computeArea() — siehe dort. Wird u.a. vom Ober-/Untersummen-Applet
// (drawRiemann() in 08_draw.js) als Referenzwert genutzt, gegen den die
// Riemannsummen konvergieren.
function computeSignedIntegral(expr, x1, x2) {
  const n = 2000, hh = (x2 - x1) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const x = x1 + i * hh;
    const y = safeEval(expr, x);
    if (!isFinite(y)) continue;
    const w = (i === 0 || i === n) ? 1 : (i % 2 === 0 ? 2 : 4);
    sum += w * y;
  }
  return sum * hh / 3;
}

