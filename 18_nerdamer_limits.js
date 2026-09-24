// ═══════════════════════════════════════════════════════════════════
// MODUL: nerdamer_limits — exakte Grenzwerte (Asymptoten) via Nerdamer (CAS)
// Enthält:  ndEvalAsync()          — Worker-Bridge mit hartem Timeout
//           ndStringWithParams()   — App-Ausdruck -> Nerdamer-String,
//                                    ALLE Parameter (a,b,c,v,n,h,...) durch
//                                    ihren aktuellen Schieberegler-Wert ersetzt
//           ndHorizontalLimit()    — lim(x→±∞) f(x), exakt
//           ndObliqueLimit()       — schräge Asymptote (Steigung + Achsenabschnitt), exakt
//           ndPoleOrHole()         — Pol vs. hebbare Lücke an einer Stelle x0
// Genutzt von: 04_analysis.js (computeSpecials(), Phase 2 "Nerdamer-Verfeinerung")
//
// WARUM EIN WEB WORKER? Nerdamers limit()-Implementierung kann sich bei
// bestimmten Ausdrücken aufhängen (bestätigt: abs(x)/x exakt an der Stelle
// x=0 — Endlosschleife, >2 Minuten im Test beobachtet, unabhängig von
// core.Settings.max_lim_depth). Ein hängender synchroner Aufruf im
// Haupt-Thread würde die ganze Seite einfrieren. Ein Worker lässt sich
// dagegen mit terminate() hart abbrechen — jede Anfrage bekommt daher ein
// festes Zeitlimit; läuft es ab, wird der Worker verworfen (und beim
// nächsten Aufruf neu erstellt) und die Anfrage gilt als "nicht bestimmbar"
// — der Aufrufer fällt dann auf die bisherige numerische Heuristik zurück,
// NIE auf einen Fehler oder Hänger.
//
// WARUM PARAMETER VORHER SUBSTITUIEREN (statt Nerdamer symbolisch rechnen zu
// lassen und erst hinterher einzusetzen)? Ein Ausdruck wie "(x^3-a)/(x-1)"
// hat für ein ALLGEMEINES (symbolisches) a bei x=1 einen echten Pol — nur für
// den SPEZIELLEN, aktuell eingestellten Wert a=1 kürzt sich das zu einer
// hebbaren Lücke. Würde man erst symbolisch rechnen und danach einsetzen,
// bekäme man das Ergebnis für den allgemeinen Fall (Pol), nicht für die
// aktuell angezeigte Kurve. Deshalb wird JEDE Parameter-Kennung schon vor
// dem Aufbau des Nerdamer-Strings durch ihren aktuellen Zahlenwert ersetzt —
// nur "x" bleibt symbolisch.
// ═══════════════════════════════════════════════════════════════════

const ND_LIMIT_TIMEOUT_MS = 700;
// Erlaubt einen lokalen/alternativen Nerdamer-Build zu verwenden (z.B. wenn
// die App offline oder hinter einem Firewall ohne CDN-Zugriff läuft, oder in
// einer Testumgebung ohne Netzwerk) — normalerweise unbenutzt (CDN Default).
const ND_WORKER_CDN_URL = (typeof window !== 'undefined' && window.ND_WORKER_CDN_URL_OVERRIDE)
  || 'https://cdn.jsdelivr.net/npm/nerdamer@1.1.13/all.min.js';

let _ndWorker = null;
let _ndWorkerReqId = 0;
const _ndWorkerPending = new Map();

function _ndWorkerSource() {
  return `
    self.importScripts(${JSON.stringify(ND_WORKER_CDN_URL)});
    self.onmessage = function(e) {
      const id = e.data.id, expr = e.data.expr;
      try {
        // .evaluate() ist nötig, da nerdamer bei irrationalen Zwischenwerten
        // (z.B. 3^7.3833 an einer nicht-runden Kandidaten-Stelle) das Ergebnis
        // sonst symbolisch/exakt stehen lässt (z.B. "2*3^7.3833+5") statt es zu
        // einer Dezimalzahl auszuwerten — was der strikte Zahlen-Parser im
        // Hauptthread sonst fälschlich als "nicht bestimmbar" verwerfen würde.
        const sym = nerdamer(expr).evaluate();
        self.postMessage({ id: id, ok: true, raw: sym.toString(), dec: sym.text('decimals', 12) });
      } catch (err) {
        self.postMessage({ id: id, ok: false, error: String(err && err.message || err) });
      }
    };
  `;
}

function _ndDiscardWorker(w) {
  try { w.terminate(); } catch (e) {}
  if (_ndWorker === w) _ndWorker = null;
}

function _ndGetWorker() {
  if (_ndWorker) return _ndWorker;
  if (typeof Worker === 'undefined') return null;
  try {
    const blob = new Blob([_ndWorkerSource()], { type: 'application/javascript' });
    const w = new Worker(URL.createObjectURL(blob));
    w.onmessage = (e) => {
      const id = e.data.id;
      const pending = _ndWorkerPending.get(id);
      if (!pending) return;
      _ndWorkerPending.delete(id);
      clearTimeout(pending.timer);
      pending.resolve(e.data);
    };
    w.onerror = () => {
      // Worker insgesamt kaputt (z.B. CDN nicht erreichbar/offline) — alle
      // offenen Anfragen sauber als "nicht bestimmbar" auflösen.
      for (const [, p] of _ndWorkerPending) { clearTimeout(p.timer); p.resolve({ ok: false, error: 'worker error' }); }
      _ndWorkerPending.clear();
      _ndWorker = null;
    };
    _ndWorker = w;
    return w;
  } catch (e) {
    return null;
  }
}

// Schickt einen fertigen Nerdamer-Ausdruck (String) an den Worker.
// Liefert IMMER ein Objekt (nie eine Exception): { ok:true, raw, dec } bei
// Erfolg, sonst { ok:false, error|timeout:true }. Blockiert nie länger als
// ND_LIMIT_TIMEOUT_MS — danach wird der Worker hart beendet.
function ndEvalAsync(exprStr) {
  return new Promise((resolve) => {
    const w = _ndGetWorker();
    if (!w) { resolve({ ok: false, error: 'no worker' }); return; }
    const id = ++_ndWorkerReqId;
    const timer = setTimeout(() => {
      _ndWorkerPending.delete(id);
      _ndDiscardWorker(w);
      resolve({ ok: false, timeout: true });
    }, ND_LIMIT_TIMEOUT_MS);
    _ndWorkerPending.set(id, { resolve, timer });
    try {
      w.postMessage({ id, expr: exprStr });
    } catch (e) {
      clearTimeout(timer);
      _ndWorkerPending.delete(id);
      resolve({ ok: false, error: String(e) });
    }
  });
}

// Nur eine sauber geparste Zahl (oder ±Infinity) akzeptieren — niemals ein
// blosses parseFloat() auf einen evtl. noch teil-symbolischen String
// anwenden (z.B. würde parseFloat("3*a") fälschlich 3 liefern).
function _ndStrictNumber(s) {
  if (typeof s !== 'string') return NaN;
  const t = s.trim();
  if (/^-?Infinity$/.test(t)) return t.charAt(0) === '-' ? -Infinity : Infinity;
  if (/^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(t)) return parseFloat(t);
  return NaN;
}

// Ersetzt in einem App-AST-Knoten jeden Bezeichner, der ein Schieberegler-
// Parameter ist (in params{}, siehe 03_math.js/syncParams()), durch seinen
// aktuellen Zahlenwert. "x" und "EC" (Eulersche Zahl) bleiben unangetastet.
function _ndSubstParams(node) {
  switch (node.type) {
    case 'num': return node;
    case 'id':
      if (node.v === 'x' || node.v === 'EC') return node;
      if (typeof params !== 'undefined' && params[node.v] && isFinite(params[node.v].val))
        return { type: 'num', v: String(params[node.v].val) };
      return node;
    case 'neg': return { type: 'neg', x: _ndSubstParams(node.x) };
    case 'call': return { type: 'call', name: node.name, args: node.args.map(_ndSubstParams) };
    default: return { type: node.type, a: _ndSubstParams(node.a), b: _ndSubstParams(node.b) };
  }
}

// App-Ausdruck (z.B. "a*(x-v)^n+h") -> Nerdamer-String mit bereits
// eingesetzten Parameterwerten (z.B. "((2)*(((x-(1))^(3)))+(0))"). Wirft bei
// Parse-/Konvertierungsfehlern (fängt der Aufrufer ab).
function ndStringWithParams(expr) {
  const ast = miParseRaw(expr);
  return ndFromAst(_ndSubstParams(ast));
}

// ── Horizontale Asymptote ────────────────────────────────────────────
// dirStr: 'Infinity' oder '-Infinity'. Rückgabe:
//   { ok:true,  value }        — exakter endlicher Grenzwert (Asymptote y=value)
//   { ok:false, confirmed:true }  — Nerdamer bestätigt: kein endlicher Grenzwert
//   { ok:false, confirmed:false } — nicht bestimmbar (Timeout/Fehler/nicht auswertbar)
async function ndHorizontalLimit(expr, dirStr) {
  let ndExpr;
  try { ndExpr = ndStringWithParams(expr); } catch (e) { return { ok: false, confirmed: false }; }
  const r = await ndEvalAsync(`limit(simplify(${ndExpr}), x, ${dirStr})`);
  if (!r.ok) return { ok: false, confirmed: false };
  const val = _ndStrictNumber(r.dec);
  if (Number.isNaN(val)) return { ok: false, confirmed: false };
  if (!isFinite(val)) return { ok: false, confirmed: true };
  return { ok: true, value: val };
}

// ── Schräge Asymptote ────────────────────────────────────────────────
// m = lim f(x)/x, dann b = lim (f(x) − m·x) — beides exakt und in der
// Reihenfolge berechnet (nie "grosse Zahl minus grosse Zahl" wie beim
// numerischen Verfahren, siehe Fallback in 04_analysis.js). "simplify"
// VOR "limit" ist nötig, da Nerdamer sonst bei getrennt divergierenden
// Termen (∞ − ∞) einen Rechenfehler wirft statt algebraisch zu kürzen.
async function ndObliqueLimit(expr, dirStr) {
  let ndExpr;
  try { ndExpr = ndStringWithParams(expr); } catch (e) { return { ok: false }; }
  const rm = await ndEvalAsync(`limit(simplify((${ndExpr})/x), x, ${dirStr})`);
  if (!rm.ok) return { ok: false };
  const m = _ndStrictNumber(rm.dec);
  if (Number.isNaN(m) || !isFinite(m) || Math.abs(m) < 1e-9) return { ok: false };
  // WICHTIG: für den zweiten Grenzwert die EXAKTE symbolische Steigung
  // (rm.raw, z.B. "1/3") einsetzen, nicht die auf 12 Nachkommastellen
  // gekürzte Dezimalzahl (rm.dec, "0.333333333333"). Bei jeder Steigung
  // ohne endliche Dezimaldarstellung (jeder Bruch mit anderem Nenner als
  // reinen 2er-/5er-Potenzen, z.B. 1/3, 1/6, 1/7, 1/9, 2/3, …) würde sonst
  // im zweiten Limit (f(x) − m·x) ein winziger Rest (wahre Steigung minus
  // gerundete Steigung) übrig bleiben, der mit x multipliziert für x→±∞
  // selbst gegen ±∞ läuft — der Achsenabschnitt b käme dann fälschlich als
  // "nicht bestimmbar" zurück und die exakte Methode entartete unbemerkt
  // zum ungenaueren numerischen Fallback, obwohl Nerdamer die Steigung
  // bereits exakt geliefert hatte (das war genau der Rechenfehler, den
  // diese CAS-Methode laut Kommentar oben eigentlich vermeiden soll).
  const rb = await ndEvalAsync(`limit(simplify((${ndExpr}) - (${rm.raw})*x), x, ${dirStr})`);
  if (!rb.ok) return { ok: false };
  const b = _ndStrictNumber(rb.dec);
  if (Number.isNaN(b) || !isFinite(b)) return { ok: false };
  return { ok: true, slope: m, intercept: b };
}

// ── Pol vs. hebbare Lücke ────────────────────────────────────────────
// x0: numerisch bereits gefundene Kandidaten-Stelle (aus dem Scan in
// 04_analysis.js). Zweiseitiger Nerdamer-Grenzwert dort:
//   endlich    -> hebbare Lücke, KEIN Pol       -> { isPole:false, holeValue }
//   unendlich  -> echter Pol (bestätigt)        -> { isPole:true }
//   nicht bestimmbar (Timeout/periodisch/Fehler) -> null (Aufrufer behält das
//                                                    bisherige numerische Urteil bei)
async function ndPoleOrHole(expr, x0) {
  let ndExpr;
  try { ndExpr = ndStringWithParams(expr); } catch (e) { return null; }
  const r = await ndEvalAsync(`limit(simplify(${ndExpr}), x, ${x0})`);
  if (!r.ok) return null;
  const val = _ndStrictNumber(r.dec);
  if (Number.isNaN(val)) return null;
  if (!isFinite(val)) return { isPole: true };
  return { isPole: false, holeValue: val };
}
