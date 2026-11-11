// ═══════════════════════════════════════════════════════════════════
// MODUL 15: domain_range — robuste, AST-gestützte Erkennung von
// Definitionsbereich (D_f) und Wertemenge (W_f).
//
// Ersetzt die frühere rein-numerische Scan-Heuristik (blindes Abtasten
// von [-500,500] mit festem Raster) durch einen zweistufigen Ansatz:
//
//   1) SYMBOLISCH: der Rohausdruck wird über den Parser aus
//      14_mathinput.js (miParseRaw) in einen AST zerlegt. Jede
//      Teilstruktur, die eine mathematische Bedingung erzwingt
//      (Nenner ≠ 0, Wurzel-Radikand ≥ 0, Log-Argument > 0, log_b-Basis
//      > 0 und ≠ 1, tan-Polstellen bei cos(...)=0, Exponent mit
//      nicht-ganzzahligem Exponent → Basis ≥ 0), liefert eine
//      "Bedingung" mit ihrer eigenen Teil-Formel als Rohausdruck-String.
//   2) NUMERISCH je Bedingung: für jede Bedingung wird NUR die
//      betroffene Teil-Formel ausgewertet (nicht die ganze Funktion),
//      und deren Nullstellen bzw. Vorzeichen-/Gültigkeits-Wechsel
//      werden über ein feines Raster + Bisektions-Verfeinerung exakt
//      lokalisiert. Das ist deutlich zuverlässiger als das Abtasten
//      der GESAMTEN (oft viel komplizierteren) Gesamtfunktion, weil
//      jede Bedingung für sich meist ein einfaches, gutmütiges
//      Vorzeichenverhalten hat.
//
// Zusätzlich läuft ein numerisches Sicherheitsnetz über die gesamte
// Funktion, das nicht symbolisch erfasste NaN-Bereiche (z.B. x^y mit
// variablem, nicht offensichtlich ganzzahligem Exponenten) als
// weitere Lücken ergänzt.
//
// Datenmodell (an fn gespeichert, siehe 06_ui_functions.js):
//   fn.domainMin / fn.domainMax : äussere Grenzen (null = unbeschränkt)
//   fn.domainExcluded           : Array einzelner ausgeschlossener x-Werte (Polstellen)
//   fn.domainGaps               : Array {lo, hi} ausgeschlossener Teilintervalle
//                                  innerhalb [domainMin, domainMax]
//                                  (z.B. sqrt(x^2-4) → domainGaps=[{lo:-2,hi:2}])
// ═══════════════════════════════════════════════════════════════════

const DA_EPS = 1e-9;
const DA_LO = -1500, DA_HI = 1500;      // Suchfenster für Bedingungs-Nullstellen
const DA_STEPS = 9000;                    // → Rasterweite 1/3 (fein genug für Bisektion)
const DA_MIN_GAP_WIDTH = 1e-4;            // schmaler als das → als Punkt behandeln, nicht als Lücke

// ---------- 1) Symbolische Bedingungs-Sammlung ----------
// Läuft über den AST und sammelt Bedingungen der Form:
//   {kind:'ne0', expr}       Teilausdruck darf nicht 0 sein (Nenner)
//   {kind:'ge0', expr}       Teilausdruck muss ≥ 0 sein (sqrt, gerade nthroot, Basis bei nicht-ganzz. Exponent)
//   {kind:'gt0', expr}       Teilausdruck muss > 0 sein (log, log10, logn-Argument und -Basis)
//   {kind:'ne_val', expr, val} Teilausdruck darf nicht val sein (log_b: Basis ≠ 1)
//   {kind:'cos_ne0', expr}   cos(Teilausdruck) darf nicht 0 sein (tan-Polstellen)
// Löst einen AST-Knoten als aktuelle Zahl auf — entweder ein Zahlen-Literal
// ODER ein Schieberegler-Parameter (a,b,c,n,v,h,…) mit seinem AKTUELLEN Wert
// (siehe params{} / syncParams() in 03_math.js). Wird für die pow-Exponent-
// und nthroot-Index-Erkennung gebraucht: bei "a*(x-v)^n+h" bzw.
// "a*nthroot(x-v,n)+h" (Potenz-/Wurzel-Panel, 11_fitting.js) ist n ein
// normaler Schieberegler-Parameter, kein Zahlen-Literal im Ausdruck — ohne
// diese Auflösung würde die symbolische Bedingungs-Erkennung (gerade/
// ungerade, ganzzahlig?) komplett übersprungen und nur noch das gröbere
// numerische Sicherheitsnetz (daSafetyNetGaps) greifen, das den Rand des
// Suchfensters (DA_LO/DA_HI) anders als die symbolische Prüfung NICHT auf
// "geht wirklich bis ±∞" testet — Ergebnis wäre eine unschöne Pseudo-Lücke
// wie "ℝ \ (−1500, 0)" statt des korrekten "[0, +∞)" für z.B. √(x−v) mit v=0.
function daNumLiteral(node) {
  if (!node) return null;
  if (node.type === 'num') { const v = parseFloat(node.v); return isFinite(v) ? v : null; }
  if (node.type === 'neg') { const v = daNumLiteral(node.x); return v == null ? null : -v; }
  if (node.type === 'id' && typeof params !== 'undefined' && params[node.v] && isFinite(params[node.v].val))
    return params[node.v].val;
  // Konstante Teilausdrücke (z.B. der sehr natürliche Fall "x^(1/2)" statt
  // "x^0.5") rekursiv zu einer Zahl zusammenfalten — löst sich automatisch
  // wieder in null auf, sobald irgendwo x (oder ein unbekannter Bezeichner)
  // vorkommt, weil dann ein 'id'-Blatt keine params[...]-Auflösung findet.
  // Ohne das wurde z.B. bei "x^(1/2)" der Exponent NICHT als 0.5 erkannt,
  // die ge0-Bedingung (Basis≥0) komplett übersprungen, und die Domain fiel
  // auf das grobe numerische Sicherheitsnetz zurück, das die willkürliche
  // Suchfenstergrenze als "Lücke" anzeigte (siehe Kommentar oben).
  if (node.type === 'add' || node.type === 'sub' || node.type === 'mul' || node.type === 'div') {
    const va = daNumLiteral(node.a), vb = daNumLiteral(node.b);
    if (va == null || vb == null) return null;
    if (node.type === 'add') return va + vb;
    if (node.type === 'sub') return va - vb;
    if (node.type === 'mul') return va * vb;
    return vb !== 0 ? va / vb : null;
  }
  if (node.type === 'pow') {
    const va = daNumLiteral(node.a), vb = daNumLiteral(node.b);
    if (va == null || vb == null) return null;
    const r = Math.pow(va, vb);
    return isFinite(r) ? r : null;
  }
  return null;
}

function daCollectConstraints(node, out) {
  if (!node || typeof node !== 'object') return;
  switch (node.type) {
    case 'num': case 'id':
      return;
    case 'neg':
      daCollectConstraints(node.x, out);
      return;
    case 'add': case 'sub': case 'mul':
      daCollectConstraints(node.a, out);
      daCollectConstraints(node.b, out);
      return;
    case 'div':
      daCollectConstraints(node.a, out);
      daCollectConstraints(node.b, out);
      out.push({ kind: 'ne0', expr: miToRaw(node.b, 0) });
      return;
    case 'pow': {
      daCollectConstraints(node.a, out);
      daCollectConstraints(node.b, out);
      const ev = daNumLiteral(node.b);
      if (ev != null) {
        if (!Number.isInteger(ev))
          out.push({ kind: 'ge0', expr: miToRaw(node.a, 0) });
        // Negativer Exponent (z.B. (x−v)⁻², typisch beim Potenz-Panel
        // "n negativ gerade/ungerade") bedeutet Division durch die Basis —
        // ohne diese Bedingung übersieht computeDomain() die Polstelle bei
        // Basis=0 komplett (der AST hat hier keinen 'div'-Knoten, der sie
        // sonst automatisch einträgt), computeRange() hält den Bereich dann
        // fälschlich für EIN durchgehendes Stück und liefert statt einer
        // echten Unendlichkeits-Grenze nur eine riesige, aber endliche Zahl
        // aus dem groben Innen-Raster nahe der (unbekannten) Polstelle.
        // Für einen nicht-ganzzahligen negativen Exponenten (z.B. −0.5)
        // ergibt ge0 (Basis≥0) UND ne0 (Basis≠0) zusammen exakt Basis>0.
        if (ev < 0)
          out.push({ kind: 'ne0', expr: miToRaw(node.a, 0) });
      }
      // Variabler Exponent mit variabler Basis (x^x, x^(1/x)): wie üblich nur für Basis > 0 definiert
      const hasX = n => !!n && typeof n === 'object' && (n.type === 'id' ? n.v === 'x' : Object.keys(n).some(k => { const v = n[k]; return Array.isArray(v) ? v.some(hasX) : (v && typeof v === 'object' && hasX(v)); }));
      if (ev == null && hasX(node.b) && hasX(node.a)) out.push({ kind: 'gt0', expr: miToRaw(node.a, 0) });
      // Sonst (Exponent hängt von x ab, oder ist ein unbekannter Bezeichner):
      // nicht statisch entscheidbar — wird vom numerischen Sicherheitsnetz
      // (daSafetyNetGaps) aufgefangen.
      return;
    }
    case 'call': {
      node.args.forEach(a => daCollectConstraints(a, out));
      const a0 = node.args[0] ? miToRaw(node.args[0], 0) : null;
      if (node.name === 'sqrt' && a0 != null)
        out.push({ kind: 'ge0', expr: a0 });
      if (node.name === 'nthroot' && a0 != null && node.args[1]) {
        const nv = daNumLiteral(node.args[1]);
        if (nv != null && Number.isInteger(nv) && Math.abs(nv % 2) === 0)
          out.push({ kind: 'ge0', expr: a0 });
        // nicht-literales/unbekanntes n: Sicherheitsnetz übernimmt
      }
      if ((node.name === 'log' || node.name === 'log10') && a0 != null)
        out.push({ kind: 'gt0', expr: a0 });
      if ((node.name === 'logn' || node.name === 'logbase') && node.args.length >= 2) {
        if (a0 != null) out.push({ kind: 'gt0', expr: a0 });
        const b0 = miToRaw(node.args[1], 0);
        out.push({ kind: 'gt0', expr: b0 });
        out.push({ kind: 'ne_val', expr: b0, val: 1 });
      }
      if (node.name === 'tan' && a0 != null)
        out.push({ kind: 'cos_ne0', expr: a0 });
      if ((node.name === 'asin' || node.name === 'acos') && a0 != null) {     // −1 ≤ Argument ≤ 1 (Ränder eingeschlossen)
        out.push({ kind: 'ge0', expr: '1-(' + a0 + ')' });
        out.push({ kind: 'ge0', expr: '(' + a0 + ')+1' });
      }
      return;
    }
    default:
      return;
  }
}

// ---------- 2) Numerische Auswertung je Bedingung ----------

// Bisektions-Verfeinerung einer Nullstelle zwischen (a,fa) und (b,fb) mit Vorzeichenwechsel.
// Hinweis: NaN ("nicht definiert") und ±Infinity ("überläuft, aber mathematisch
// gültig, z.B. exp(1000)") werden bewusst unterschiedlich behandelt — nur NaN
// gilt als "nicht auswertbar", Infinity hat weiterhin ein gültiges Vorzeichen.
function daBisectZero(f, a, b, fa) {
  for (let k = 0; k < 60; k++) {
    const m = (a + b) / 2, fm = f(m);
    if (isNaN(fm)) { b = m; continue; } // NaN in der Mitte: zur sichereren (definierten) Seite gehen
    if ((fa < 0) === (fm < 0)) { a = m; fa = fm; } else { b = m; }
  }
  return (a + b) / 2;
}

// Findet alle Nullstellen von f über [lo,hi] (nur zwischen zwei DEFINIERTEN (nicht-NaN)
// Werten mit Vorzeichenwechsel — reine NaN-Übergänge zählen hier nicht als Nullstelle).
function daFindZeros(f, lo, hi, steps) {
  const zeros = [];
  const dx = (hi - lo) / steps;
  let prevX = lo, prevY = f(lo), ppY = NaN;
  // «Nahe null» zählt nur, wenn |f| dort ein lokales Minimum hat (Berührstelle wie (x−1)²) — sonst wäre
  // z.B. e^x (für x < −21 kleiner als 10⁻⁹) eine ganze Reihe von «Nullstellen» (x²/e^x: D = ℝ \ {…}).
  const dip = (p0, p1, p2) => (isNaN(p0) || Math.abs(p0) > Math.abs(p1)) && (isNaN(p2) || Math.abs(p2) > Math.abs(p1));
  for (let i = 1; i <= steps; i++) {
    const x = lo + i * dx;
    const y = f(x);
    // WICHTIG: die "nahe Null"-Prüfung hängt NUR von prevY ab und darf nicht davon
    // abhängen, ob der NÄCHSTE Punkt y definiert ist. Sonst wird eine Nullstelle,
    // die GENAU am Rand des eigenen Definitionsbereichs liegt und direkt danach in
    // NaN übergeht (z.B. der Nenner-Term sqrt(1-x) bei 1/sqrt(1-x): touchiert exakt
    // 0 bei x=1, für x>1 sofort NaN — kein Vorzeichenwechsel, nur "→0→NaN"), je nach
    // Abtastrichtung übersehen. Der Vorzeichenwechsel-Test bleibt weiterhin an
    // beide endlichen Werte gebunden.
    if (!isNaN(prevY) && Math.abs(prevY) < DA_EPS && dip(ppY, prevY, y)) zeros.push(prevX);
    else if (!isNaN(prevY) && !isNaN(y) && (prevY < 0) !== (y < 0)) zeros.push(daBisectZero(f, prevX, x, prevY));
    ppY = prevY; prevX = x; prevY = y;
  }
  // Letzten abgetasteten Punkt (x=hi) ebenfalls prüfen — er wird im Loop oben nie
  // als "prevY" behandelt.
  if (!isNaN(prevY) && Math.abs(prevY) < DA_EPS && dip(ppY, prevY, NaN)) zeros.push(prevX);
  return zeros;
}

// Findet die ausgeschlossenen Intervalle einer ge0/gt0-Bedingung über [lo,hi].
// Gibt Liste von [a,b] zurück; a=lo bzw. b=hi bedeutet "reicht (mind.) bis zum
// Rand des Suchfensters" — wird vom Aufrufer noch auf echte Unbeschränktheit geprüft.
// WICHTIG: "erlaubt" bewertet NaN als nicht erlaubt, aber +Infinity/-Infinity
// bekommen ihr normales Vorzeichenverhalten (Infinity > irgendwas ist true) —
// so wird ein Bedingungsterm, der lediglich double-überläuft (z.B. exp(x) für
// grosses x als Radikand), nicht fälschlich als Definitionslücke gewertet.
function daFindExcludedIntervals(f, lo, hi, steps, strict) {
  const allowed = y => isNaN(y) ? false : (strict ? y > DA_EPS : y > -DA_EPS);
  const dx = (hi - lo) / steps;
  const intervals = [];
  let prevX = lo, prevY = f(lo), prevAllowed = allowed(f(lo));
  let curStart = prevAllowed ? null : lo;
  for (let i = 1; i <= steps; i++) {
    const x = lo + i * dx;
    const y = f(x);
    const isAllowed = allowed(y);
    if (isAllowed !== prevAllowed) {
      // Grenze verfeinern (funktioniert für endliche wie NaN-Übergänge, da 'allowed'
      // NaN konsequent als "nicht erlaubt" behandelt)
      let a = prevX, b = x, aAllowed = prevAllowed;
      for (let k = 0; k < 60; k++) {
        const m = (a + b) / 2;
        if (allowed(f(m)) === aAllowed) a = m; else b = m;
      }
      const bnd = (a + b) / 2;
      if (prevAllowed && !isAllowed) curStart = bnd;
      else if (!prevAllowed && isAllowed) { intervals.push([curStart, bnd]); curStart = null; }
    }
    prevX = x; prevY = y; prevAllowed = isAllowed;
  }
  if (curStart !== null) intervals.push([curStart, hi]);
  return intervals;
}

// Prüft ob ein am Suchfensterrand liegendes Intervallende tatsächlich nach
// ±∞ weiterreicht (statt nur zufällig am Fensterrand zu enden).
function daExtendsToInfinity(f, x0, dir, strict) {
  const allowed = y => isNaN(y) ? false : (strict ? y > DA_EPS : y > -DA_EPS);
  const probes = [Math.abs(x0) + 500, Math.abs(x0) + 5000, Math.abs(x0) + 50000];
  return probes.every(p => !allowed(f(dir * p)));
}

// ---------- 3) Zusammenführen der Bedingungen zu einem Gesamt-Ausschluss ----------

// Verschmilzt eine Liste [a,b]-Intervalle (a<=b, sortiert oder nicht) zu einer
// minimalen Menge disjunkter, sich berührender-verschmolzener Intervalle.
function daMergeIntervals(intervals) {
  if (!intervals.length) return [];
  const s = intervals.slice().sort((p, q) => p[0] - q[0]);
  const out = [s[0].slice()];
  for (let i = 1; i < s.length; i++) {
    const last = out[out.length - 1], cur = s[i];
    if (cur[0] <= last[1] + 1e-6) last[1] = Math.max(last[1], cur[1]);
    else out.push(cur.slice());
  }
  return out;
}

// Berechnet den Definitionsbereich eines Rohausdrucks.
// Gibt {domainMin, domainMax, excluded, gaps} zurück.
function computeDomain(expr) {
  if (!expr || !expr.trim()) return { domainMin: null, domainMax: null, domainMinOpen: false, domainMaxOpen: false, excluded: [], gaps: [] };

  let ast;
  try { ast = miParseRaw(expr); } catch (ex) { ast = null; }

  // Getrennt gesammelt: "Intervall"-Ausschlüsse (ge0/gt0 + Sicherheitsnetz —
  // definieren echte Bereichsgrenzen/Lücken) und "Punkt"-Ausschlüsse (ne0,
  // cos_ne0, ne_val — einzelne Polstellen). Getrennt gehalten, damit ein
  // Polstellen-Punkt, der GENAU auf dem Rand einer Intervallgrenze liegt
  // (z.B. 1/sqrt(x): x=0 ist zugleich Rand von sqrt's Bereich UND eigene
  // Nullstelle des Nenners), beim Verschmelzen nicht verloren geht.
  const intervalExclusions = [];
  const pointExclusions = [];
  // Sammelt für jede Bedingung, die bis ±∞ reicht, deren INNEREN Rand
  // (= Kandidat für domainMin/domainMax) zusammen mit der Info, ob die
  // Bedingung strikt war (gt0, z.B. log-Argument > 0) oder nicht-strikt
  // (ge0, z.B. sqrt-Radikand ≥ 0) — nötig, damit _domainLabel() später
  // zwischen "(0, +∞)" (log(x), 0 NICHT im Definitionsbereich) und
  // "[0, +∞)" (sqrt(x), 0 SEHR WOHL im Definitionsbereich) unterscheiden
  // kann, statt wie bisher immer die geschlossene Klammer zu zeigen.
  const boundaryStrict = [];

  if (ast) {
    const constraints = [];
    daCollectConstraints(ast, constraints);
    for (const c of constraints) {
      try {
        if (c.kind === 'ne0') {
          const f = x => safeEval(c.expr, x);
          daFindZeros(f, DA_LO, DA_HI, DA_STEPS).forEach(z => pointExclusions.push(z));
        } else if (c.kind === 'ne_val') {
          const f = x => safeEval(c.expr, x) - c.val;
          daFindZeros(f, DA_LO, DA_HI, DA_STEPS).forEach(z => pointExclusions.push(z));
        } else if (c.kind === 'cos_ne0') {
          const f = x => Math.cos(safeEval(c.expr, x));
          daFindZeros(f, DA_LO, DA_HI, DA_STEPS).forEach(z => pointExclusions.push(z));
        } else if (c.kind === 'ge0' || c.kind === 'gt0') {
          const strict = c.kind === 'gt0';
          const f = x => safeEval(c.expr, x);
          const ivs = daFindExcludedIntervals(f, DA_LO, DA_HI, DA_STEPS, strict);
          ivs.forEach(([a, b]) => {
            let lo = a, hi = b;
            if (a <= DA_LO + 1e-9 && daExtendsToInfinity(f, DA_LO, -1, strict)) { lo = -Infinity; boundaryStrict.push({ edge: b, strict }); }
            if (b >= DA_HI - 1e-9 && daExtendsToInfinity(f, DA_HI, 1, strict)) { hi = Infinity; boundaryStrict.push({ edge: a, strict }); }
            intervalExclusions.push([lo, hi]);
          });
        }
      } catch (ex) { /* einzelne Bedingung überspringen, Rest bleibt gültig */ }
    }
  }

  // Numerisches Sicherheitsnetz: Gesamtfunktion nochmals scannen, um nicht
  // symbolisch erfasste NaN-Bereiche zu ergänzen (z.B. x^(1/x), variable Exponenten).
  // Schmale Treffer (< DA_MIN_GAP_WIDTH) werden als Punkte, breite als Intervalle geführt.
  daSafetyNetGaps(expr).forEach(([a, b]) => {
    if (b - a < DA_MIN_GAP_WIDTH) { pointExclusions.push((a + b) / 2); return; }
    // Jenseits von |x| ≈ 709 läuft e^x über (Infinity/Infinity = NaN bei e^x/(1+e^x), tanh …): kein echter Rand
    if (a >= 700 || b <= -700) return;
    // Reicht die Lücke bis an den Rand des Suchfensters und bleibt die Funktion auch weit draussen
    // undefiniert, so ist sie unbeschränkt (sonst stünde z.B. bei einer unbekannten Funktion «ℝ \ (1, 1500)»).
    const nanFar = sg => [1e4 + 0.37, 1e6 + 0.37].every(t => isNaN(safeEval(expr, sg * t)));   // nicht ganzzahlig (x^x ist bei −10000 zufällig definiert)
    const closedAt = e => !isNaN(safeEval(expr, daSnap(e)));
    if (a <= DA_LO + 1e-9 && nanFar(-1)) { a = -Infinity; boundaryStrict.push({ edge: daSnap(b), strict: !closedAt(b) }); }
    if (b >= DA_HI - 1e-9 && nanFar(1)) { b = Infinity; boundaryStrict.push({ edge: daSnap(a), strict: !closedAt(a) }); }
    intervalExclusions.push([a, b]);
  });

  const mergedIv = daMergeIntervals(intervalExclusions.filter(([a, b]) => isFinite(a) || isFinite(b) || a === -Infinity || b === Infinity));

  let domainMin = null, domainMax = null;
  const gaps = [];
  mergedIv.forEach(([a, b]) => {
    if (a === -Infinity) { domainMin = isFinite(b) ? b : domainMin; return; }
    if (b === Infinity) { domainMax = isFinite(a) ? a : domainMax; return; }
    if (b - a < DA_MIN_GAP_WIDTH) { pointExclusions.push((a + b) / 2); return; }   // z.B. ln|x|: nur x = 0 fehlt
    gaps.push({ lo: a, hi: b });
  });

  // War IRGENDEINE der Bedingungen, die zu domainMin/domainMax geführt hat,
  // strikt (gt0)? Dann ist die jeweilige Grenze NICHT im Definitionsbereich
  // enthalten (offene Klammer), sonst schon (geschlossene Klammer) — siehe
  // boundaryStrict oben.
  const domainMinOpen = domainMin != null && boundaryStrict.some(b => b.strict && Math.abs(b.edge - domainMin) < 1e-6);
  const domainMaxOpen = domainMax != null && boundaryStrict.some(b => b.strict && Math.abs(b.edge - domainMax) < 1e-6);

  // Punkte, die STRIKT innerhalb eines bereits ausgeschlossenen Intervalls liegen,
  // sind redundant (die Lücke deckt sie schon ab) — Punkte auf/ausserhalb der
  // Intervallgrenzen bleiben als eigenständige Polstellen erhalten.
  const isStrictlyInsideExclusion = x => {
    if (domainMin != null && x < domainMin - 1e-7) return true;
    if (domainMax != null && x > domainMax + 1e-7) return true;
    return gaps.some(g => x > g.lo + 1e-7 && x < g.hi - 1e-7);
  };
  const excluded = [...new Set(pointExclusions.filter(x => !isStrictlyInsideExclusion(x)).map(daSnap))]
    .sort((a, b) => a - b);

  // loIn/hiIn: gehört der Rand der Lücke noch zum Definitionsbereich? (√(x²−4): ±2 ja → ℝ \ (−2, 2); ln(x²−1): ±1 nein → ℝ \ [−1, 1])
  const gapsOut = gaps.map(g => { const lo = daSnap(g.lo), hi = daSnap(g.hi); return { lo, hi, loIn: isFinite(safeEval(expr, lo)), hiIn: isFinite(safeEval(expr, hi)) }; }).sort((a, b) => a.lo - b.lo);

  return {
    domainMin: domainMin != null ? daSnap(domainMin) : null,
    domainMax: domainMax != null ? daSnap(domainMax) : null,
    domainMinOpen, domainMaxOpen,
    excluded, gaps: gapsOut,
  };
}

function daSnap(v) {
  const r = Math.round(v * 10000) / 10000;
  return Math.abs(v - r) < 1e-6 ? r : parseFloat(v.toFixed(6));
}

// Sicherheitsnetz: grober Gesamt-Scan der Funktion selbst, findet NaN-Bereiche
// die die symbolische Analyse nicht kennt (z.B. Basis<0 bei variablem Exponenten
// wie x^(1/x) für x<0, oder generell nicht modellierte Konstrukte).
function daSafetyNetGaps(expr) {
  const steps = 4000;
  const lo = DA_LO, hi = DA_HI;
  const dx = (hi - lo) / steps;
  const out = [];
  // "definiert" heisst hier: nicht NaN. ±Infinity (z.B. exp(x) für grosses x,
  // doubles überlaufen ab ~709) ist ein mathematisch gültiger (wenn auch nicht
  // darstellbarer) Grenzwert und KEINE Definitionslücke — nur NaN ist das.
  let prevFin = !isNaN(safeEval(expr, lo)), curStart = prevFin ? null : lo, prevX = lo;
  for (let i = 1; i <= steps; i++) {
    const x = lo + i * dx;
    const fin = !isNaN(safeEval(expr, x));
    if (fin !== prevFin) {
      // Grenze grob verfeinern
      let a = prevX, b = x, aFin = prevFin;
      for (let k = 0; k < 40; k++) {
        const m = (a + b) / 2;
        if (!isNaN(safeEval(expr, m)) === aFin) a = m; else b = m;
      }
      const bnd = (a + b) / 2;
      if (prevFin && !fin) curStart = bnd;
      else if (!prevFin && fin && curStart !== null) { out.push([curStart, bnd]); curStart = null; }
    }
    prevFin = fin; prevX = x;
  }
  if (curStart !== null) out.push([curStart, hi]);
  return out;
}

// ---------- 4) Wertemenge (W_f) ----------
//
// Nutzt den jetzt (dank computeDomain) bekannten korrekten Definitionsbereich:
// zerlegt ihn in seine zusammenhängenden Teilstücke (getrennt durch Lücken/
// Polstellen), sucht in jedem Teilstück die kritischen Stellen (f'=0, über
// Vorzeichenwechsel von deriv1 statt blindem Raster — findet auch schmale/
// steile Extrema zuverlässig) und wertet Grenzverhalten an jedem Rand
// (endlich erreicht / offen mit endlichem Grenzwert / Polstelle / unbeschränkt)
// sauber aus. Ergebnis wird über alle Teilstücke zusammengeführt.

// Baut die Liste der zusammenhängenden Definitionsbereich-Teilstücke als
// [{lo, hi, loOpen, hiOpen}] — lo/hi können ±Infinity sein.
function daDomainPieces(domainMin, domainMax, excluded, gaps, domainMinOpen, domainMaxOpen) {
  const lo0 = domainMin != null ? domainMin : -Infinity;
  const hi0 = domainMax != null ? domainMax : Infinity;
  // Alle "Schnitte" (Punkte UND Lücken) sortiert sammeln
  const cuts = [];
  (excluded || []).forEach(p => cuts.push({ at: p, width: 0 }));
  (gaps || []).forEach(g => cuts.push({ at: (g.lo + g.hi) / 2, width: g.hi - g.lo, lo: g.lo, hi: g.hi, loIn: !!g.loIn, hiIn: !!g.hiIn }));
  cuts.sort((a, b) => a.at - b.at);

  const pieces = [];
  // WICHTIG: eine gesetzte domainMin/domainMax-Grenze ist NICHT automatisch
  // geschlossen — z.B. bei log(x) ist domainMin=0 aus einer STRIKTEN
  // Bedingung (Argument>0) hergeleitet, log(0) ist nicht definiert. Die
  // Offenheit wird daher vom Aufrufer übergeben (siehe computeDomain()s
  // domainMinOpen/domainMaxOpen); ohne sie explizit zu übergeben, wird
  // konservativ auf "offen" zurückgefallen (nie fälschlich als geschlossen/
  // erreicht angezeigt).
  let curLo = lo0, curLoOpen = domainMin != null ? !!domainMinOpen : true;
  cuts.forEach(c => {
    if (c.width === 0) {
      // isolierter Punkt: Teilstück endet offen davor, neues beginnt offen danach
      pieces.push({ lo: curLo, hi: c.at, loOpen: curLoOpen, hiOpen: true });
      curLo = c.at; curLoOpen = true;
    } else {
      pieces.push({ lo: curLo, hi: c.lo, loOpen: curLoOpen, hiOpen: !c.loIn });
      curLo = c.hi; curLoOpen = !c.hiIn;
    }
  });
  pieces.push({ lo: curLo, hi: hi0, loOpen: curLoOpen, hiOpen: domainMax != null ? !!domainMaxOpen : true });
  // Entartete/leere Teilstücke (lo>=hi, ausser beide unendlich) verwerfen
  return pieces.filter(p => p.hi - p.lo > 1e-9 || !isFinite(p.hi - p.lo));
}

// Grenzwert von f an einem Rand x0 (von innerhalb des Teilstücks kommend,
// dir=+1 bedeutet "von rechts nähern" also x0 ist die LINKE Grenze, dir=-1
// bedeutet "von links nähern" also x0 ist die RECHTE Grenze).
// Gibt {kind:'value',v} | {kind:'inf',sign} | {kind:'unknown'} zurück.
function daBoundaryLimit(expr, x0, dir, open) {
  if (!isFinite(x0)) {
    // Verhalten im Unendlichen: Trend über mehrere weit auseinanderliegende Punkte.
    // WICHTIG: welche Seite (x→+∞ oder x→-∞) wir untersuchen, entscheidet sich
    // über das VORZEICHEN von x0 selbst (x0=-Infinity → sehr negative Sondierungen,
    // x0=+Infinity → sehr positive) — NICHT über dir. dir beschreibt nur die
    // Annäherungsrichtung bei einem ENDLICHEN Rand (siehe unten) und ist hier
    // bedeutungslos; würde man stattdessen dir verwenden, bekäme man (da für den
    // linken Teilstück-Rand stets dir=+1 und für den rechten stets dir=-1 übergeben
    // wird) systematisch die falsche Seite ausgewertet.
    const xs = x0 < 0 ? [-1e4, -1e6, -1e8] : [1e4, 1e6, 1e8];
    const ys = xs.map(x => safeEval(expr, x));
    // Weit draussen nur NaN, weil Zwischenwerte überlaufen (e^x/(1+e^x) = Infinity/Infinity): näher am Ursprung
    // nachsehen — ist die Funktion dort schon (bis auf Rundung) konstant, ist das der Grenzwert.
    if (ys.some(isNaN) && !ys.some(v => v === Infinity || v === -Infinity)) {
      const ms = (x0 < 0 ? [-40, -150, -600] : [40, 150, 600]).map(x => safeEval(expr, x));
      if (ms.every(isFinite) && Math.abs(ms[2] - ms[1]) <= 1e-12 * Math.max(1, Math.abs(ms[2])) && Math.abs(ms[1] - ms[0]) <= 1e-9 * Math.max(1, Math.abs(ms[2]))) {
        const tolA = 1e-12 * Math.max(1, Math.abs(ms[2]));
        const achieved = [3, 10].every(t => { const yy = safeEval(expr, x0 < 0 ? -t : t); return isFinite(yy) && Math.abs(yy - ms[2]) <= tolA; });
        return { kind: 'value', v: ms[2], achieved };
      }
    }
    // Läuft ein Sondierungswert bereits in echtes ±Infinity über (z.B. exp(1e6)),
    // ist das selbst ein eindeutiges, sogar stärkeres Unbeschränktheits-Signal —
    // nicht erst als "unknown" verwerfen.
    if (ys[2] === Infinity) return { kind: 'inf', sign: 1 };
    if (ys[2] === -Infinity) return { kind: 'inf', sign: -1 };
    if (ys.every(isFinite)) {
      const diff1 = Math.abs(ys[1] - ys[0]), diff2 = Math.abs(ys[2] - ys[1]);
      // Konvergenz-Test: entweder sind die Differenzen bereits absolut winzig
      // (funktioniert für "normal" skalierte Funktionen), ODER die Differenz
      // schrumpft von Schritt zu Schritt (Faktor 100 in x je Schritt) — das
      // relative Kriterium ist nötig, weil ein fester absoluter Schwellwert bei
      // skalierten Funktionen (z.B. 2/(x-3) statt 1/(x-3)) leicht knapp verfehlt
      // wird, obwohl die Funktion genauso eindeutig konvergiert, nur mit
      // grösserem Vorfaktor. Schwelle bewusst hoch (0.9): eine Potenz-artige
      // Konvergenz f~x^-p schrumpft von Schritt zu Schritt um den Faktor 100^-p —
      // für 1/nthroot(...,n) ist p=1/n, d.h. schon bei n=4 (1/nthroot(x,4)) nur
      // Faktor ~0.32, bei n=6 ~0.46. Ein zu niedriger Schwellwert (z.B. 0.2) würde
      // solche (mathematisch eindeutig konvergenten, nur SEHR langsam
      // konvergierenden) Grenzwerte als "unknown" verwerfen. 0.9 deckt noch
      // n bis ~40 ab und bleibt trotzdem klar unter dem Verhältnis 1.0, das eine
      // echt divergente, aber selbstähnlich wachsende Funktion wie log(x) selbst
      // bei beliebig weit auseinanderliegenden Sondierungspunkten liefert (log
      // wächst pro Dekaden-Schritt immer um denselben Betrag, Verhältnis exakt 1).
      const convergedAbs = diff2 < 1e-4 && diff1 < 1e-4;
      const convergedRel = diff1 > 1e-300 && diff2 < 0.9 * diff1;
      if (convergedAbs || convergedRel) {
        // Aitken-Δ²-Extrapolation: bei LANGSAMER (potenzartiger) Konvergenz ist
        // ys[2] selbst (Funktionswert bei x=±1e8) noch spürbar vom wahren
        // Grenzwert entfernt (z.B. 1/nthroot(x,4) liefert bei x=1e8 erst ≈0.01,
        // nicht 0). Da die Differenzen bei geometrisch gestaffelten x-Werten
        // (Faktor 100 je Schritt) näherungsweise geometrisch schrumpfen, liefert
        // Aitkens Δ²-Verfahren aus denselben drei Stichproben einen deutlich
        // präziseren Schätzwert für den wahren Grenzwert, ohne weitere
        // Funktionsauswertungen zu benötigen.
        const denom = ys[2] - 2 * ys[1] + ys[0];
        const d21 = ys[2] - ys[1];
        const extrapolated = Math.abs(denom) > 1e-300 ? ys[2] - (d21 * d21) / denom : ys[2];
        let limV = isFinite(extrapolated) ? extrapolated : ys[2];
        // Konvergiert -> horizontale Asymptote. Zusätzlich prüfen, ob der
        // Grenzwert bereits an einer MODERATEN (nicht extremen) Stelle praktisch
        // exakt erreicht wird — dann handelt es sich nicht um ein blosses,
        // niemals erreichtes Supremum/Infimum, sondern um einen echten, auf dem
        // ganzen Strahl angenommenen Wert (z.B. abs(x)/x ist für x<0 konstant
        // -1 — das "Grenzverhalten" IST der überall erreichte Wert, nicht nur
        // eine Annäherung). Ohne diese Prüfung würde ein bei sehr schneller
        // Konvergenz (z.B. exp(x)→0 für x→-∞, unterläuft Gleitkomma-Genauigkeit
        // schon ab x≈-745) über Stichproben "erreichter" Wert fälschlich mit
        // dieser (dann tatsächlich NICHT erreichten) Grenze verwechselt.
        // Plausibilitätsprüfung gegen falsch-positive "Konvergenz": bei
        // beschränkten OSZILLIERENDEN Funktionen (z.B. cos(x)) können die drei
        // weit auseinanderliegenden Stichproben (1e4/1e6/1e8) durch reinen
        // Zufall wie eine schrumpfende Differenz aussehen, obwohl gar keine
        // Konvergenz vorliegt — der obige Test würde dann einen sinnlosen
        // Aitken-extrapolierten "Grenzwert" liefern. Zur Kontrolle wird ein
        // VIERTER, noch weiter entfernter Stichpunkt (1e10) ausgewertet: bei
        // echter (auch sehr langsamer, potenzartiger) Konvergenz muss sich der
        // Funktionswert dort dem extrapolierten Grenzwert mindestens so weit
        // genähert haben wie bei x=±1e8 (der Abstand zum Grenzwert darf nicht
        // wachsen) — bei einer oszillierenden Funktion ist der Abstand dort
        // hingegen im Wesentlichen unabhängig vom vorherigen und typischerweise
        // NICHT kleiner.
        const farX = x0 < 0 ? -1e10 : 1e10;
        const farY = safeEval(expr, farX);
        const distNear = Math.abs(ys[2] - limV);
        const floor = 1e-6 * Math.max(1, Math.abs(limV));
        const plausible = isFinite(farY) && Math.abs(farY - limV) <= Math.max(distNear, floor) * 1.05 + floor;
        if (!plausible) return { kind: 'unknown' };
        // Zweite Schätzung mit quadrierten Abständen (10⁴, 10⁸, 10¹⁶): erfasst auch logarithmisch langsame
        // Konvergenz (1/ln x → 0), bei der die erste Schätzung bei ≈ 0,04 hängen bleibt. Nur bei streng
        // monotonem Verlauf (sonst könnte eine Schwingung wie sin(2x) zufällig so aussehen).
        const zs = (x0 < 0 ? [-1e4, -1e8, -1e16] : [1e4, 1e8, 1e16]).map(x => safeEval(expr, x));
        const seqM = [ys[0], ys[1], ys[2], zs[2]], up = seqM.every((v, i) => i === 0 || v > seqM[i - 1]), dn = seqM.every((v, i) => i === 0 || v < seqM[i - 1]);
        if (zs.every(isFinite) && (up || dn)) {
          const den2 = zs[2] - 2 * zs[1] + zs[0], d2 = zs[2] - zs[1];
          const lim2 = Math.abs(den2) > 1e-300 ? zs[2] - (d2 * d2) / den2 : zs[2];
          // f(10¹⁶) liegt schon jenseits der ersten Schätzung → diese war falsch (zu langsame Konvergenz)
          if (isFinite(lim2) && (up ? zs[2] > limV + 1e-9 : zs[2] < limV - 1e-9)) limV = lim2;
        }
        // Erreicht nur, wenn die Funktion schon an moderaten Stellen GENAU den Grenzwert hat (konstanter Strahl
        // wie abs(x)/x) — e^(−x²) ist bei x = 10 zwar winzig (≈ 4·10⁻⁴⁴), aber nicht 0.
        const tolA = 1e-12 * Math.max(1, Math.abs(limV));
        const achieved = [3, 10].every(t => { const yy = safeEval(expr, x0 < 0 ? -t : t); return isFinite(yy) && Math.abs(yy - limV) <= tolA; });
        return { kind: 'value', v: limV, achieved };
      }
      if (ys[2] > ys[1] + 0.5 && ys[1] > ys[0] + 0.5) return { kind: 'inf', sign: 1 };
      if (ys[2] < ys[1] - 0.5 && ys[1] < ys[0] - 0.5) return { kind: 'inf', sign: -1 };
    }
    return { kind: 'unknown' };
  }
  // Endlicher Rand: erst direkt versuchen (Rand gehört evtl. zum Definitionsbereich).
  // ABER: eine numerisch nur ANGENÄHERTE Polstelle (z.B. eine per Bisektion
  // gefundene tan-Nullstelle von cos(x), die nie exakt auf dem Gleitkomma-Gitter
  // liegt) kann hier einen riesigen, aber zufällig noch endlichen Wert liefern
  // (z.B. tan(x0)≈1.6e16 statt echtem ±∞) — das ist kein erreichter Wertebereichs-
  // Randwert, sondern eine Asymptote. Ab einer Grössenordnung, die für einen
  // Schulplotter ohnehin nicht mehr sinnvoll "erreicht" ist, wird das als
  // Unbeschränktheit statt als echter Wert gewertet.
  // Offener Rand (Polstelle, Lücke): NICHT direkt auswerten. Die Stelle ist auf 6 Nachkommastellen gerundet
  // (3.141593 statt π) und liegt darum oft knapp auf der falschen Seite — f(x0) hätte dann das falsche
  // Vorzeichen (1/sin x) oder wäre ein scheinbar «erreichter» endlicher Wert. Von innen her annähern,
  // aber nicht näher als der Rundungsfehler (5·10⁻⁷).
  if (open) {
    const ysO = [1e-2, 1e-3, 1e-4, 3e-5, 1e-5, 5e-6].map(e => safeEval(expr, x0 + dir * e));   // absolut: die Rundung ist absolut, und bei x0 = 100π wäre 0,01·x0 schon über der nächsten Polstelle
    const lastO = ysO[ysO.length - 1];
    if (lastO === Infinity) return { kind: 'inf', sign: 1 };
    if (lastO === -Infinity) return { kind: 'inf', sign: -1 };
    const fy = ysO.filter(isFinite);
    if (fy.length >= 2) {
      const l = fy[fy.length - 1], pv = fy[fy.length - 2], f0 = fy[0];
      // Konvergenz: Differenzen schrumpfen ungefähr linear mit dem Abstand (stetig fortsetzbar)
      if (Math.abs(l - pv) < 2e-4 * Math.max(1, Math.abs(l))) return { kind: 'value', v: l };
      if (Math.abs(l) > 1e3 && Math.abs(l) > Math.abs(pv)) return { kind: 'inf', sign: l > 0 ? 1 : -1 };
      if (l > pv && l - f0 > 1e-9 && Math.abs(l) > 50) return { kind: 'inf', sign: 1 };
      if (l < pv && l - f0 < -1e-9 && Math.abs(l) > 50) return { kind: 'inf', sign: -1 };
    }
    // sonst wie bisher weiter unten (feinere Annäherung)
  }
  const direct0 = safeEval(expr, x0), direct = open && Math.abs(direct0) > 1e6 ? NaN : direct0;   // offen: nur ein harmloser Wert zählt (1/ln x bei 0 → −0)
  if (isFinite(direct)) {
    if (Math.abs(direct) > 1e6) {
      // Ein Bisektions-Artefakt einer echten (aber nur numerisch angenäherten)
      // Polstelle von einem echten, grossen aber STABILEN Funktionswert an
      // einer legitimen Bereichsgrenze unterscheiden (z.B. x³ mit
      // domainMax=150 → f(150)=3 375 000, ein ganz normaler, tatsächlich
      // angenommener Randwert — kein Pol!). Unterscheidungskriterium: bei
      // einer echten Polstelle wächst/schwankt |f| noch STARK, sobald man
      // den (nur numerisch angenäherten) Rand auch nur minimal in Richtung
      // Definitionsbereich verlässt (weil man sich dabei relativ gesehen
      // weiter von der WAHREN, exakten Polstelle entfernt/annähert als vom
      // hier verwendeten x0); bei einem echten, stetigen Randwert ändert
      // sich |f| dort dagegen kaum. Ohne diese Prüfung würde ein völlig
      // legitimer grosser Wert fälschlich als "unbeschränkt" ausgegeben.
      const step = Math.max(Math.abs(x0), 1) * 1e-6;
      const near = safeEval(expr, x0 + dir * step);
      const stable = isFinite(near) && Math.abs(near) > Math.abs(direct) * 0.5 && Math.abs(near) < Math.abs(direct) * 2;
      if (!stable) {
        // Vorzeichen von INNEN bestimmen: die angenäherte Polstelle x0 kann knapp auf der falschen Seite liegen
        // (1/sin x bei x0 ≈ kπ), dann hätte f(x0) das falsche Vorzeichen.
        const inner = safeEval(expr, x0 + dir * 2e-6);
        return { kind: 'inf', sign: (isFinite(inner) && Math.abs(inner) > 1e3 ? inner : direct) > 0 ? 1 : -1 };
      }
    }
    return { kind: 'value', v: direct, achieved: true };
  }
  // Offener Rand: einseitigen Grenzwert über schrumpfende Epsilon-Folge schätzen.
  // Epsilon-Folge geht bis 1e-12, damit auch LANGSAM divergierende Ränder (z.B.
  // log(x) für x→0+, wächst nur logarithmisch) sicher als Divergenz erkannt werden.
  const epsList = [1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-8, 1e-10, 1e-12].map(e => e * Math.max(1, Math.abs(x0)));
  const rawYs = epsList.map(e => safeEval(expr, x0 + dir * e));
  const lastRaw = rawYs[rawYs.length - 1];
  if (lastRaw === Infinity) return { kind: 'inf', sign: 1 };
  if (lastRaw === -Infinity) return { kind: 'inf', sign: -1 };
  const ys = rawYs.filter(isFinite);
  if (ys.length < 2) return { kind: 'unknown' };
  const last = ys[ys.length - 1], prev = ys[ys.length - 2], first = ys[0];
  if (Math.abs(last - prev) < 1e-3 * Math.max(1, Math.abs(last))) return { kind: 'value', v: last };
  // Nicht konvergiert: monotone Divergenz über das GESAMTE Fenster prüfen — das
  // erkennt auch langsames (z.B. logarithmisches) Wachstum zuverlässig, ohne sich
  // auf einen fixen Betrags-Schwellwert zu verlassen (der bei log(x) o.ä. erst
  // viel zu spät bzw. nie erreicht würde).
  // (über die GANZE Folge monoton — sin(1/x) bei 0 springt zufällig hin und her und ist nicht divergent)
  const incr = ys.every((v, i) => i === 0 || v >= ys[i - 1]), decr = ys.every((v, i) => i === 0 || v <= ys[i - 1]);
  if (incr && last > prev && last - first > 1e-9) return { kind: 'inf', sign: 1 };
  if (decr && last < prev && last - first < -1e-9) return { kind: 'inf', sign: -1 };
  if (!incr && !decr) return { kind: 'unknown' };
  // Grosse, noch wachsende Werte ohne klar monotonen Trend: konservativ als
  // Divergenz werten statt als (falschen) erreichten Randwert.
  if (Math.abs(last) > 1e3) return { kind: 'inf', sign: last > 0 ? 1 : -1 };
  return { kind: 'value', v: last };
}

// Findet kritische Punkte (f'=0) im offenen Intervall (lo,hi) über Vorzeichenwechsel
// der numerischen Ableitung — deutlich präziser als reines Raster-Sampling.
// Stützstellen für ein Teilstück: gleichmässig über das ganze Stück und zusätzlich dicht im
// Schulbereich |x| ≤ 60 (sonst liegen bei unbeschränkten Stücken bis zu 6,7 Einheiten zwischen
// zwei Punkten, und eng beieinanderliegende Extrema wie bei x⁴ − 2x² gehen verloren).
function daSampleXs(lo, hi) {
  const L = isFinite(lo) ? lo : -1e4, H = isFinite(hi) ? hi : 1e4, span = H - L;
  if (!(span > 0)) return [];
  const xs = [], n = Math.min(3000, Math.max(300, Math.round(span * 15)));
  for (let i = 0; i <= n; i++) xs.push(L + span * i / n);
  const a = Math.max(L, -60), b = Math.min(H, 60);
  if (b > a && (b - a) / n * 1.0001 < span / n) { const m = Math.min(3000, Math.max(300, Math.round((b - a) * 25))); for (let i = 0; i <= m; i++) xs.push(a + (b - a) * i / m); }
  xs.sort((p, q) => p - q);
  return xs.filter((x, i) => i === 0 || x - xs[i - 1] > 1e-12 * Math.max(1, Math.abs(x)));
}
function daCriticalPoints(expr, lo, hi) {
  const L = isFinite(lo) ? lo : -1e4, H = isFinite(hi) ? hi : 1e4;
  const span = H - L;
  if (!(span > 0)) return [];
  const f = x => deriv1(expr, x);
  // Nur echte Vorzeichenwechsel von f′: ein bloss winziges f′ (z.B. 2^(1/x) kurz vor 0, wo alles
  // gegen 0 unterläuft) ist kein Extremum und darf keinen «erreichten» Wert liefern.
  const m0 = Math.min(span * 0.01, Math.max(span * 1e-6, 2e-6));          // Abstand zu den (auf 10⁻⁶ gerundeten) Rändern
  const xs = daSampleXs(L + m0, H - m0), pts = [];
  let px = xs[0], py = f(px);
  for (let i = 1; i < xs.length; i++) {
    const x = xs[i], y = f(x);
    if (isFinite(py) && isFinite(y) && py !== 0 && y !== 0 && (py < 0) !== (y < 0)) pts.push(daBisectZero(f, px, x, py));
    else if (y === 0 && isFinite(py) && py !== 0 && i + 1 < xs.length) { const y2 = f(xs[i + 1]); if (isFinite(y2) && y2 !== 0 && (py < 0) !== (y2 < 0)) pts.push(x); }
    px = x; py = y;
  }
  // Echtes Extremum? Beide Nachbarn müssen merklich darüber (Minimum) bzw. darunter (Maximum) liegen —
  // sonst ist es nur Rundungsrauschen von f′ in einem flachen Unterlauf-Bereich (3^x − 5 weit links).
  return pts.filter(x => {
    const y = safeEval(expr, x); if (!isFinite(y)) return false;
    const d = Math.min(1e-3 * Math.max(1, Math.abs(x)), 0.25 * Math.min(x - L, H - x)), a = safeEval(expr, x - d), c = safeEval(expr, x + d), t = 1e-13 * Math.max(1, Math.abs(y));
    if (!isFinite(a) || !isFinite(c)) return true;
    return (a - y > t && c - y > t) || (y - a > t && y - c > t);
  });
}

// Berechnet die Wertemenge eines Rohausdrucks über dem (bereits bekannten)
// Definitionsbereich. Gibt {rangeMin, rangeMax, rangeExcluded} zurück —
// gleiche Form wie zuvor detectRange(), damit _updateRangeSpan() unverändert
// weiterfunktioniert.
function computeRange(expr, domainMin, domainMax, excluded, gaps, domainMinOpen, domainMaxOpen) {
  const EMPTY = { rangeMin: null, rangeMax: null, rangeExcluded: [], rangeParts: [] };
  if (!expr || !expr.trim()) return EMPTY;

  const pieces = daDomainPieces(domainMin, domainMax, excluded, gaps, domainMinOpen, domainMaxOpen);
  if (!pieces.length) return EMPTY;

  // Auf jedem zusammenhängenden Teilstück ist die (stetige) Funktion ein Intervall
  // [inf, sup] (Ränder offen oder geschlossen). Die Wertemenge ist die VEREINIGUNG
  // dieser Intervalle — so werden auch echte Lücken wie bei x + 1/x
  // ((−∞, −2] ∪ [2, ∞)) oder 1/(x² − 4) richtig erkannt, und ein Grenzwert, der
  // anderswo doch angenommen wird (x/(x² + 1) → 0, aber f(0) = 0), gilt nicht als Lücke.
  // min/max werden als {v, achieved, src} getrackt: achieved=true → Wert wird von
  // einem echten x angenommen; src 'crit' = echtes lokales Extremum (Vorzeichenwechsel von f′).
  const parts = [];
  // Viele Polstellen (1/sin x, tan x …): Die Suche nach Polstellen reicht nur bis ±1500. Die beiden äussersten,
  // scheinbar unbeschränkten Stücke enthalten in Wahrheit weitere Polstellen und würden ℝ vortäuschen —
  // die Funktion wiederholt sich dort, also genügen die inneren Stücke.
  const manyPoles = (excluded || []).length > 20 && pieces.length > 3;
  pieces.forEach(p => {
    if (manyPoles && (!isFinite(p.lo) || !isFinite(p.hi))) return;
    let minC = { v: Infinity, achieved: false, src: '' }, maxC = { v: -Infinity, achieved: false, src: '' };
    let unboundedBelow = false, unboundedAbove = false;
    // Gleichstand (±1e−9): die bessere Stelle behalten — echtes Extremum vor Raster, sonst die Stelle näher bei 0
    // (dort ist kein Unterlauf), aber nur wenn der Wert dadurch nicht schlechter wird.
    const better = (c, v, achieved, src, x, sg) => achieved && (!c.achieved || (src === 'crit' && c.src !== 'crit') ||
      (src === c.src && x !== undefined && c.x !== undefined && Math.abs(x) < Math.abs(c.x) && sg * (v - c.v) <= 0));
    const considerMin = (v, achieved, src, x) => {
      if (v < minC.v - 1e-9) minC = { v, achieved, src, x };
      else if (Math.abs(v - minC.v) <= 1e-9 && better(minC, v, achieved, src, x, 1)) minC = { v, achieved, src, x };
    };
    const considerMax = (v, achieved, src, x) => {
      if (v > maxC.v + 1e-9) maxC = { v, achieved, src, x };
      else if (Math.abs(v - maxC.v) <= 1e-9 && better(maxC, v, achieved, src, x, -1)) maxC = { v, achieved, src, x };
    };
    // Ein Rasterwert gilt bei Gleichstand mit einem Grenzwert nur als echt erreicht, wenn er nicht auf einem
    // numerisch völlig flachen Stück liegt (Unterlauf: e^(−x²) ist ab |x| ≈ 27 exakt 0.0, obwohl nie 0).
    const genuine = (c, v) => {
      if (!c.achieved) return false;
      if (Math.abs(c.v - v) > 1e-12 * Math.max(1, Math.abs(v))) return false;   // nur angenähert (1 − 10⁻⁹ ist nicht 1)
      if (c.src === 'crit' || c.src === 'edge') return true;
      if (c.x === undefined) return false;
      const h = 1e-3 * Math.max(1, Math.abs(c.x));
      const sc = 1e-12 * Math.max(1, Math.abs(c.v)), ya = safeEval(expr, c.x - h), yb = safeEval(expr, c.x + h);
      return isFinite(ya) && isFinite(yb) && Math.abs(ya - c.v) > sc && Math.abs(yb - c.v) > sc;   // auf beiden Seiten echt anders
    };
    // Randauswertung bei x0 = ±∞ (bzw. Grenzwert an einem offenen Rand): bei Gleichstand mit einem
    // Raster-Kandidaten gewinnt der Grenzwert (z.B. exp(x) unterläuft für x < −745 exakt zu 0.0,
    // erreicht 0 aber nie) — ausser der Kandidat ist ein echtes lokales Extremum (x²·e^(−x²): f(0) = 0).
    const considerMinLim = (v, achieved) => {
      if (v < minC.v - 1e-9) minC = { v, achieved, src: 'lim' };
      else if (Math.abs(v - minC.v) <= 1e-9) minC = Object.assign({}, minC, { achieved: achieved || genuine(minC, v) });
    };
    const considerMaxLim = (v, achieved) => {
      if (v > maxC.v + 1e-9) maxC = { v, achieved, src: 'lim' };
      else if (Math.abs(v - maxC.v) <= 1e-9) maxC = Object.assign({}, maxC, { achieved: achieved || genuine(maxC, v) });
    };
    // Grobes Raster im Inneren (offene Ränder selbst nicht, siehe Grenzwert-Block unten)
    const xs = daSampleXs(p.lo, p.hi);
    let inMin = Infinity, inMax = -Infinity;                 // Werte im Bereich |x| ≤ 1000 (für wachsende Schwingungen)
    for (let i = 0; i < xs.length; i++) {
      if (i === 0 && p.loOpen) continue;
      if (i === xs.length - 1 && p.hiOpen) continue;
      const x = xs[i];
      const y = safeEval(expr, x);
      if (isFinite(y) && Math.abs(x) <= 1000) { if (y < inMin) inMin = y; if (y > inMax) inMax = y; }
      // 'grid0': Wert an einer moderaten Stelle (|x| ≤ 50) — kein Unterlauf-Artefakt weit draussen
      if (isFinite(y)) { considerMin(y, true, 'grid', x); considerMax(y, true, 'grid', x); }
    }
    // Kritische Punkte (echte Vorzeichenwechsel von f′)
    daCriticalPoints(expr, p.lo, p.hi).forEach(x => {
      const y = safeEval(expr, x);
      if (isFinite(y)) { considerMin(y, true, 'crit', x); considerMax(y, true, 'crit', x); }
    });
    // Ränder
    [{ x0: p.lo, dir: 1, open: p.loOpen }, { x0: p.hi, dir: -1, open: p.hiOpen }].forEach(({ x0, dir, open }) => {
      const lim = daBoundaryLimit(expr, x0, dir, isFinite(x0) && open);
      if (lim.kind === 'inf') { if (lim.sign > 0) unboundedAbove = true; else unboundedBelow = true; }
      else if (lim.kind === 'value') {
        const achieved = !!lim.achieved && (!isFinite(x0) || !open);
        if (!isFinite(x0) || open) { considerMinLim(lim.v, achieved); considerMaxLim(lim.v, achieved); }
        else { considerMin(lim.v, achieved, 'edge'); considerMax(lim.v, achieved, 'edge'); }
      }
    });
    // Riesige, aber endliche Werte (z.B. sin(x)·e^(−x) für x → −∞, wo der Grenzwert «unbekannt» bleibt) sind unbeschränkt
    if (isFinite(minC.v) && minC.v < -1e15) unboundedBelow = true;
    if (isFinite(maxC.v) && maxC.v > 1e15) unboundedAbove = true;
    // Schwingung mit wachsender Amplitude (x·sin x): das «Maximum» liegt am Rand des Suchfensters und ist
    // viel grösser als alles bei |x| ≤ 1000 → in Wahrheit unbeschränkt
    if (isFinite(maxC.v) && maxC.x !== undefined && Math.abs(maxC.x) > 5000 && isFinite(inMax) && maxC.v > 2 * Math.max(1, Math.abs(inMax)) + 1) unboundedAbove = true;
    if (isFinite(minC.v) && minC.x !== undefined && Math.abs(minC.x) > 5000 && isFinite(inMin) && minC.v < -2 * Math.max(1, Math.abs(inMin)) - 1) unboundedBelow = true;
    if (!isFinite(minC.v) && !isFinite(maxC.v) && !unboundedBelow && !unboundedAbove) return;
    parts.push({
      lo: unboundedBelow || !isFinite(minC.v) ? -Infinity : minC.v, loC: !unboundedBelow && isFinite(minC.v) && minC.achieved,
      hi: unboundedAbove || !isFinite(maxC.v) ? Infinity : maxC.v, hiC: !unboundedAbove && isFinite(maxC.v) && maxC.achieved
    });
  });
  if (!parts.length) return EMPTY;

  const rnd = v => {
    if (!isFinite(v)) return v;
    if (Math.abs(v) < 1e-6) return 0;
    const a = Math.abs(v);
    return parseFloat(v.toFixed(a >= 100 ? 0 : a >= 10 ? 1 : 2));
  };
  // Vereinigen (sich überlappende oder an einem eingeschlossenen Wert berührende Intervalle verschmelzen)
  parts.sort((a, b) => (a.lo === b.lo ? (b.loC ? 1 : 0) - (a.loC ? 1 : 0) : a.lo < b.lo ? -1 : 1));
  const tol = (a, b) => 1e-7 * Math.max(1, isFinite(a) ? Math.abs(a) : 0, isFinite(b) ? Math.abs(b) : 0);
  const merged = [];
  parts.forEach(c => {
    const last = merged[merged.length - 1];
    if (last && (c.lo < last.hi - tol(c.lo, last.hi) || (Math.abs(c.lo - last.hi) <= tol(c.lo, last.hi) && (c.loC || last.hiC)) || (last.hi === Infinity))) {
      if (Math.abs(c.lo - last.lo) <= tol(c.lo, last.lo)) last.loC = last.loC || c.loC;
      if (c.hi > last.hi + tol(c.hi, last.hi)) { last.hi = c.hi; last.hiC = c.hiC; }
      else if (Math.abs(c.hi - last.hi) <= tol(c.hi, last.hi)) last.hiC = last.hiC || c.hiC;
    } else merged.push(Object.assign({}, c));
  });
  const out = merged.map(m => ({ lo: rnd(m.lo), loC: m.loC, hi: rnd(m.hi), hiC: m.hiC }));
  // Bisherige Form (Hülle + ausgeschlossene Einzelwerte) für die übrigen Aufrufer
  const first = out[0], lastP = out[out.length - 1];
  const rangeMin = isFinite(first.lo) ? first.lo : null, rangeMax = isFinite(lastP.hi) ? lastP.hi : null;
  const excl = [];
  for (let i = 0; i + 1 < out.length; i++) if (out[i].hi === out[i + 1].lo) excl.push(out[i].hi);
  if (rangeMin != null && !first.loC) excl.push(rangeMin);
  if (rangeMax != null && !lastP.hiC) excl.push(rangeMax);
  return { rangeMin, rangeMax, rangeExcluded: [...new Set(excl)], rangeParts: out };
}

if (typeof module !== 'undefined') {
  module.exports = {
    daCollectConstraints, daFindZeros, daFindExcludedIntervals, daMergeIntervals,
    computeDomain, computeRange, daDomainPieces, daBoundaryLimit, daCriticalPoints,
  };
}
