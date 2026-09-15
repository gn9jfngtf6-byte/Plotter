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
  let prevX = lo, prevY = f(lo);
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
    if (!isNaN(prevY) && Math.abs(prevY) < DA_EPS) zeros.push(prevX);
    else if (!isNaN(prevY) && !isNaN(y) && (prevY < 0) !== (y < 0)) zeros.push(daBisectZero(f, prevX, x, prevY));
    prevX = x; prevY = y;
  }
  // Letzten abgetasteten Punkt (x=hi) ebenfalls prüfen — er wird im Loop oben nie
  // als "prevY" behandelt.
  if (!isNaN(prevY) && Math.abs(prevY) < DA_EPS) zeros.push(prevX);
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
    if (b - a < DA_MIN_GAP_WIDTH) pointExclusions.push((a + b) / 2);
    else intervalExclusions.push([a, b]);
  });

  const mergedIv = daMergeIntervals(intervalExclusions.filter(([a, b]) => isFinite(a) || isFinite(b) || a === -Infinity || b === Infinity));

  let domainMin = null, domainMax = null;
  const gaps = [];
  mergedIv.forEach(([a, b]) => {
    if (a === -Infinity) { domainMin = isFinite(b) ? b : domainMin; return; }
    if (b === Infinity) { domainMax = isFinite(a) ? a : domainMax; return; }
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

  const gapsOut = gaps.map(g => ({ lo: daSnap(g.lo), hi: daSnap(g.hi) })).sort((a, b) => a.lo - b.lo);

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
function daDomainPieces(domainMin, domainMax, excluded, gaps) {
  const lo0 = domainMin != null ? domainMin : -Infinity;
  const hi0 = domainMax != null ? domainMax : Infinity;
  // Alle "Schnitte" (Punkte UND Lücken) sortiert sammeln
  const cuts = [];
  (excluded || []).forEach(p => cuts.push({ at: p, width: 0 }));
  (gaps || []).forEach(g => cuts.push({ at: (g.lo + g.hi) / 2, width: g.hi - g.lo, lo: g.lo, hi: g.hi }));
  cuts.sort((a, b) => a.at - b.at);

  const pieces = [];
  let curLo = lo0, curLoOpen = domainMin != null ? false : true;
  cuts.forEach(c => {
    if (c.width === 0) {
      // isolierter Punkt: Teilstück endet offen davor, neues beginnt offen danach
      pieces.push({ lo: curLo, hi: c.at, loOpen: curLoOpen, hiOpen: true });
      curLo = c.at; curLoOpen = true;
    } else {
      pieces.push({ lo: curLo, hi: c.lo, loOpen: curLoOpen, hiOpen: true });
      curLo = c.hi; curLoOpen = true;
    }
  });
  pieces.push({ lo: curLo, hi: hi0, loOpen: curLoOpen, hiOpen: domainMax != null ? false : true });
  // Entartete/leere Teilstücke (lo>=hi, ausser beide unendlich) verwerfen
  return pieces.filter(p => p.hi - p.lo > 1e-9 || !isFinite(p.hi - p.lo));
}

// Grenzwert von f an einem Rand x0 (von innerhalb des Teilstücks kommend,
// dir=+1 bedeutet "von rechts nähern" also x0 ist die LINKE Grenze, dir=-1
// bedeutet "von links nähern" also x0 ist die RECHTE Grenze).
// Gibt {kind:'value',v} | {kind:'inf',sign} | {kind:'unknown'} zurück.
function daBoundaryLimit(expr, x0, dir) {
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
        const limV = isFinite(extrapolated) ? extrapolated : ys[2];
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
        const nearX = x0 < 0 ? -10 : 10;
        const nearY = safeEval(expr, nearX);
        const achieved = isFinite(nearY) && Math.abs(nearY - limV) < 1e-6 * Math.max(1, Math.abs(limV));
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
  const direct = safeEval(expr, x0);
  if (isFinite(direct)) {
    if (Math.abs(direct) > 1e6) return { kind: 'inf', sign: direct > 0 ? 1 : -1 };
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
  if (last > prev && last - first > 1e-9) return { kind: 'inf', sign: 1 };
  if (last < prev && last - first < -1e-9) return { kind: 'inf', sign: -1 };
  // Grosse, noch wachsende Werte ohne klar monotonen Trend: konservativ als
  // Divergenz werten statt als (falschen) erreichten Randwert.
  if (Math.abs(last) > 1e3) return { kind: 'inf', sign: last > 0 ? 1 : -1 };
  return { kind: 'value', v: last };
}

// Findet kritische Punkte (f'=0) im offenen Intervall (lo,hi) über Vorzeichenwechsel
// der numerischen Ableitung — deutlich präziser als reines Raster-Sampling.
function daCriticalPoints(expr, lo, hi) {
  const L = isFinite(lo) ? lo : -1e4, H = isFinite(hi) ? hi : 1e4;
  const span = H - L;
  if (!(span > 0)) return [];
  const steps = Math.min(4000, Math.max(400, Math.round(span * 20)));
  const f = x => deriv1(expr, x);
  const pts = daFindZeros(f, L + span * 1e-6, H - span * 1e-6, steps);
  return pts.filter(x => isFinite(safeEval(expr, x)));
}

// Berechnet die Wertemenge eines Rohausdrucks über dem (bereits bekannten)
// Definitionsbereich. Gibt {rangeMin, rangeMax, rangeExcluded} zurück —
// gleiche Form wie zuvor detectRange(), damit _updateRangeSpan() unverändert
// weiterfunktioniert.
function computeRange(expr, domainMin, domainMax, excluded, gaps) {
  if (!expr || !expr.trim()) return { rangeMin: null, rangeMax: null, rangeExcluded: [] };

  const pieces = daDomainPieces(domainMin, domainMax, excluded, gaps);
  if (!pieces.length) return { rangeMin: null, rangeMax: null, rangeExcluded: [] };

  // min/max werden als {v, achieved} getrackt: achieved=true → Wert wird von
  // einem echten x im Definitionsbereich angenommen (Minimum/Maximum im
  // strengen Sinn); achieved=false → nur Infimum/Supremum (offener Rand /
  // Asymptote, wird beim Anzeigen als offene Klammer + Ausschluss geführt).
  let minC = { v: Infinity, achieved: false };
  let maxC = { v: -Infinity, achieved: false };
  let unboundedBelow = false, unboundedAbove = false;
  const openValuesSeen = []; // Werte, die NUR als offener Grenzwert auftraten (mögliche Lücken)

  function considerMin(v, achieved) {
    if (v < minC.v - 1e-9) minC = { v, achieved };
    else if (Math.abs(v - minC.v) <= 1e-9 && achieved && !minC.achieved) minC = { v, achieved };
  }
  function considerMax(v, achieved) {
    if (v > maxC.v + 1e-9) maxC = { v, achieved };
    else if (Math.abs(v - maxC.v) <= 1e-9 && achieved && !maxC.achieved) maxC = { v, achieved };
  }
  // Variante für Randauswertungen bei x0=±∞: daBoundaryLimit hat "erreicht" dort
  // bereits selbst über einen direkten Stichprobenpunkt an moderater Stelle
  // geprüft (siehe dort) — das ist zuverlässiger als ein Gleitkomma-Artefakt aus
  // dem groben Innen-Raster (z.B. exp(x) unterläuft für x<~-745 exakt zu 0.0,
  // obwohl der Grenzwert 0 nie wirklich erreicht wird). Bei GLEICHSTAND mit einem
  // bereits als "erreicht" markierten Raster-Kandidaten gewinnt daher hier die
  // Randauswertung, statt nur zu einem "erreicht" hochzustufen.
  function considerMinInf(v, achieved) {
    if (v < minC.v - 1e-9) minC = { v, achieved };
    else if (Math.abs(v - minC.v) <= 1e-9) minC = { v: minC.v, achieved };
  }
  function considerMaxInf(v, achieved) {
    if (v > maxC.v + 1e-9) maxC = { v, achieved };
    else if (Math.abs(v - maxC.v) <= 1e-9) maxC = { v: maxC.v, achieved };
  }

  pieces.forEach(p => {
    // Direkte Stichproben im Inneren (grobes Raster) als Basis — alle im
    // offenen Intervall ausgewerteten Punkte sind per Definition "erreicht".
    const L = isFinite(p.lo) ? p.lo : -1e4, H = isFinite(p.hi) ? p.hi : 1e4;
    const span = Math.max(H - L, 1e-6);
    const steps = Math.min(3000, Math.max(300, Math.round(span * 15)));
    for (let i = 0; i <= steps; i++) {
      const x = L + (span * i) / steps;
      const y = safeEval(expr, x);
      if (isFinite(y)) { considerMin(y, true); considerMax(y, true); }
    }
    // Kritische Punkte exakt lokalisieren (präziser als das Raster)
    daCriticalPoints(expr, p.lo, p.hi).forEach(x => {
      const y = safeEval(expr, x);
      if (isFinite(y)) { considerMin(y, true); considerMax(y, true); }
    });
    // Ränder auswerten
    [{ x0: p.lo, dir: 1, open: p.loOpen }, { x0: p.hi, dir: -1, open: p.hiOpen }].forEach(({ x0, dir, open }) => {
      const lim = daBoundaryLimit(expr, x0, dir);
      if (lim.kind === 'inf') { if (lim.sign > 0) unboundedAbove = true; else unboundedBelow = true; }
      else if (lim.kind === 'value') {
        // Bei x0=±∞ ist "open" (die Teilstück-Grenze ist unbeschränkt) immer
        // trivial wahr — das sagt nichts darüber aus, ob der Grenzwert selbst
        // erreicht wird. daBoundaryLimit hat das für den unendlichen Fall bereits
        // selbst geprüft (Wert an einer moderaten, nicht-extremen Stelle exakt
        // gleich dem Grenzwert → z.B. eine überall konstante Funktion), daher hier
        // NICHT zusätzlich durch "!open" blockieren. Bei einem endlichen Rand
        // bleibt die bisherige Regel (nur ein wirklich geschlossener, nicht
        // ausgeschlossener Rand zählt als erreicht).
        const achieved = !!lim.achieved && (!isFinite(x0) || !open);
        if (!isFinite(x0)) { considerMinInf(lim.v, achieved); considerMaxInf(lim.v, achieved); }
        else { considerMin(lim.v, achieved); considerMax(lim.v, achieved); }
        if (!achieved) openValuesSeen.push(lim.v);
      }
    });
  });

  if (!isFinite(minC.v) && !isFinite(maxC.v)) return { rangeMin: null, rangeMax: null, rangeExcluded: [] };

  const rnd = v => {
    if (Math.abs(v) < 1e-6) return 0;
    const a = Math.abs(v);
    return parseFloat(v.toFixed(a >= 100 ? 0 : a >= 10 ? 1 : 2));
  };

  const rangeMin = unboundedBelow ? null : (isFinite(minC.v) ? rnd(minC.v) : null);
  const rangeMax = unboundedAbove ? null : (isFinite(maxC.v) ? rnd(maxC.v) : null);
  const rangeMinOpen = !unboundedBelow && !minC.achieved;
  const rangeMaxOpen = !unboundedAbove && !maxC.achieved;
  // Offene Randwerte, die NICHT selbst zum Gesamt-min/max wurden, sind echte
  // Lücken im Inneren der Wertemenge (z.B. hebbare Lücken / innere Asymptoten).
  const excl = [...new Set(openValuesSeen.map(rnd))].filter(v =>
    (rangeMin == null || Math.abs(v - rangeMin) > 1e-6) &&
    (rangeMax == null || Math.abs(v - rangeMax) > 1e-6)
  );
  if (rangeMinOpen && rangeMin != null) excl.push(rangeMin);
  if (rangeMaxOpen && rangeMax != null) excl.push(rangeMax);

  return { rangeMin, rangeMax, rangeExcluded: excl };
}

if (typeof module !== 'undefined') {
  module.exports = {
    daCollectConstraints, daFindZeros, daFindExcludedIntervals, daMergeIntervals,
    computeDomain, computeRange, daDomainPieces, daBoundaryLimit, daCriticalPoints,
  };
}
