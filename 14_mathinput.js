// ═══════════════════════════════════════════════════════════════════
// MODUL 14: MathInput — robuster Konverter zwischen MathLive (ASCIIMath/
// LaTeX) und dem Rohausdruck-Format des Plotters.
//
// Statt Regex-Ketten wird ein kleiner, korrekter Parser verwendet:
// Text → Tokens → AST → Zieltext. Das ist robust gegenüber beliebiger
// Verschachtelung (Brüche in Brüchen, Klammern in Klammern, ...), was
// mit reinen Regex-Ersetzungen strukturell nicht zuverlässig möglich ist.
// ═══════════════════════════════════════════════════════════════════

// BUG (Nutzer-Meldung, September 2026): "^2 wird zu \2" -- reproduzierbar in
// JEDEM Eingabefeld, SOFORT beim Tippen. Per Konsolen-Diagnose direkt beim
// Nutzer (nicht nur vermutet -- tatsächlich gemessen) geklärt:
//
//   COMPOSITIONSTART  {data:""}
//   COMPOSITIONUPDATE {data:"^"}
//   BEFOREINPUT       {data:"^", inputType:"insertCompositionText"}   <- Vorschau
//   KEYDOWN           {key:"Dead", code:"Equal", isComposing:true}
//   BEFOREINPUT       {data:null, inputType:"deleteCompositionText"}  <- Vorschau löschen
//   BEFOREINPUT       {data:"^", inputType:"insertFromComposition"}   <- ENDGÜLTIGE Eingabe
//   COMPOSITIONEND    {data:"^"}
//   KEYDOWN           {key:"2", code:"Digit2"}
//   BEFOREINPUT       {data:"2", inputType:"insertText"}
//
// "^" ist auf dieser Tastatur also technisch eine "tote"/kombinierende Taste
// (macOS-Zirkumflex, meist zum Bilden von ê/â gedacht) -- auch wenn sie sich
// für den Nutzer wie ein normaler, sofortiger Tastendruck anfühlt. Das
// Zeichen kommt deshalb NIE als normaler "keydown mit key:'^'" an (das hätte
// der frühere Fix unten abgefangen), sondern ausschliesslich über diesen
// mehrstufigen Kompositions-Mechanismus, zuletzt als "insertFromComposition".
// MathLive interpretiert offenbar nur Zeichen, die über den einfachen
// "insertText"-Weg ankommen, als Tastenkürzel (^ -> Hochstellung); über
// "insertFromComposition" ankommende Zeichen werden dagegen ganz offenbar nur
// als reiner (literaler) Text eingefügt -- das erklärt exakt das beobachtete
// Verhalten: "^" erscheint zunächst wie ein normales Zeichen, "2" danach
// landet als literaler Folgetext dahinter, sichtbar als "\2" (das "\" dürfte
// aus einer internen Fallback-Darstellung für dieses nicht interpretierte
// Zeichen stammen).
//
// (Ein früherer Versuch, das Problem über MathLive.setKeyboardLayoutLocale()
// zu beheben, war NICHT die Ursache und wurde wieder entfernt -- er erzeugte
// beim Nutzer sogar einen zusätzlichen, nutzlosen Konsolenfehler "Invalid
// keybindings for current keyboard layout".)
//
// Fix, Version 2 (Version 1 -- nur die "beforeinput"/"input"-Nachkorrektur
// unten -- hat das Problem laut Nutzer-Rückmeldung NICHT vollständig gelöst:
// statt "\2" erschien danach eine verschachtelte Doppel-Hochstellung, "2"
// als winziger Exponent OBEN AN "^" selbst statt an "x". Grund: preventDefault()
// auf dem "beforeinput" (insertFromComposition) greift auf diesem Browser
// offenbar NICHT zuverlässig, sodass zusätzlich zu unserer eigenen
// Hochstellung noch ein literales "^" landete -- und DARAUF baute die
// "input"-Nachkorrektur eine ZWEITE, verschachtelte Hochstellung).
//
// Version 2 setzt stattdessen so früh wie möglich an: bereits beim
// ALLERERSTEN "keydown" mit key:"Dead" (dem Start der Komposition) wird
// abgefangen und preventDefault() aufgerufen -- das verhindert im Idealfall,
// dass die ganze mehrstufige Kompositions-Sequenz (siehe oben) überhaupt
// erst losläuft. Da dies ein reines MATHEMATIK-Eingabefeld ist, in dem echte
// Akzentbuchstaben (é, ñ, ü als Fliesstext) praktisch nie vorkommen, wird
// JEDE "Dead"-Taste innerhalb eines math-field als "^" behandelt -- das ist
// für diesen Anwendungsfall ein sicherer, eng genug gefasster Kompromiss.
// Die spätere "beforeinput"/"input"-Nachkorrektur bleibt zusätzlich als
// Sicherheitsnetz bestehen (falls preventDefault() auf dem "Dead"-keydown
// die Komposition doch nicht stoppt), verzichtet dann aber -- über ein
// Flag pro Feld -- bewusst auf eine ZWEITE Hochstellung, falls der
// "Dead"-Abfang oben bereits gehandelt hat, und räumt in diesem Fall nur
// noch ein eventuell zusätzlich eingefügtes literales "^" wieder weg.
// Fix, Version 6 -- ROOT CAUSE DES SCHWARZEN KASTENS GEFUNDEN (per Konsolen-
// Diagnose beim Nutzer: kompletter interner Shadow-DOM-Inhalt des Feldes
// direkt nach dem Bug). Es ist weder ein natives Betriebssystem-Overlay
// (Versionen 3/4 haben das fälschlich vermutet) noch ein zusätzliches,
// gespeichertes Zeichen im exportierten LaTeX. Es ist ein echtes, aber
// VERWAISTES MathLive-internes Element:
//
//   <span class="ML__mathit">x</span>
//   <span class="ML__composition">^</span>   <-- genau das ist der Kasten
//   <span class="ML__msubsup">...2...</span>
//
// MathLive legt bei jedem "compositionupdate" intern einen eigenen
// "CompositionAtom" (Klasse "ML__composition", dafür siehe die CSS-Variable
// "--_composition-background-color" -- daher die dunkle Hintergrundfarbe)
// als Vorschau an der Cursor-Position an (Quelle: updateComposition() in
// MathLives editor-model/composition.ts). Bei "compositionend" entfernt
// MathLive ihn eigentlich wieder -- ABER nur, wenn das Atom an der
// AKTUELLEN Cursor-Position noch genau dieser CompositionAtom ist
// (removeComposition() prüft exakt das). Unser Fix ruft aber schon VORHER,
// direkt im "Dead"-keydown-Handler, moveToSuperscript() auf -- das bewegt
// den Cursor bereits in die neu erzeugte Hochstellung hinein. Wenn später
// (nach unserem Eingriff) trotzdem noch ein "compositionend" nachkommt,
// zeigt der Cursor dann nicht mehr auf den CompositionAtom, MathLives eigene
// Aufräum-Logik greift ins Leere, und der CompositionAtom bleibt für immer
// als Karteileiche im Modell hängen -- sichtbar als der schwarze Kasten.
//
// Der Fix: BEVOR wir in die Hochstellung wechseln, selbst prüfen, ob an der
// aktuellen Cursor-Position gerade ein CompositionAtom sitzt (er wurde durch
// das vorausgehende "compositionupdate" ja bereits eingefügt, siehe die
// gemessene Ereignis-Reihenfolge oben) -- und falls ja, ihn zuerst selbst
// entfernen (per "deleteBackward", da er exakt an der Cursor-Position sitzt
// -- das ist die öffentliche API-Entsprechung dessen, was MathLive intern
// bei "compositionend" auch tun würde). Erst danach in die Hochstellung
// wechseln. Die Prüfung, ob es das Element WIRKLICH gibt, ist wichtig,
// damit wir NIE versehentlich ein echtes, bereits getipptes Zeichen löschen,
// falls die Kompositions-Vorschau in einem Randfall doch noch nicht angelegt
// wurde.
function _mlRemovePendingCompositionAtom(mf) {
  // ANLAUF 1 (fehlgeschlagen, Nutzer-Rückmeldung "immer noch gleich"): Prüfung
  // über "mf.shadowRoot.querySelector('.ML__composition')" -- das gerenderte
  // Markup. Grund für den Fehlschlag, per Quellcode-Analyse gefunden:
  // MathLive rendert nach "compositionupdate" NICHT sofort synchron, sondern
  // nur verzögert über requestAnimationFrame (Funktion "requestUpdate()" in
  // MathLives Quellcode). Zum Zeitpunkt unseres "Dead"-keydown-Handlers (der
  // unmittelbar synchron danach läuft) stand das ".ML__composition"-Element
  // im Shadow-DOM also noch gar nicht -- die Prüfung fand deshalb IMMER
  // nichts und griff nie ein.
  //
  // ANLAUF 2: stattdessen direkt das interne Datenmodell abfragen (das wird
  // von "updateComposition()" SOFORT synchron aktualisiert, unabhängig vom
  // verzögerten Rendering). "mf.model" selbst ist von aussen nicht
  // zugänglich (liefert "undefined") -- aber "mf._mathfield.model" ist es
  // (per Test bestätigt: "_mathfield" ist zwar mit Unterstrich als intern
  // markiert, aber nicht wirklich privat/verborgen). Darüber lässt sich exakt
  // wie in MathLives eigener "removeComposition()"-Funktion prüfen, ob das
  // Atom an der aktuellen Cursor-Position gerade eine Kompositions-Vorschau
  // ist -- und falls ja, sie per "deleteBackward" entfernen, bevor wir in die
  // Hochstellung wechseln.
  try {
    const model = mf._mathfield && mf._mathfield.model;
    const atom = model && typeof model.at === 'function' ? model.at(model.position) : null;
    if (atom && atom.type === 'composition') {
      mf.executeCommand('deleteBackward');
      return true;
    }
  } catch (ex) { /* defensiv */ }
  return false;
}
function _mlHandleCaret(mf, isDeadCaret) {
  try {
    if (isDeadCaret) _mlRemovePendingCompositionAtom(mf);
    mf.executeCommand('moveToSuperscript');
  } catch (ex) { /* defensiv */ }
}
document.addEventListener('keydown', function (e) {
  if (e.defaultPrevented) return;
  const isCaret = e.key === '^';
  const isDeadCaret = e.key === 'Dead';
  if (!isCaret && !isDeadCaret) return;
  const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
  const mf = path.find(n => n && n.tagName === 'MATH-FIELD');
  if (!mf) return;
  e.preventDefault();
  e.stopPropagation();
  if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
  _mlHandleCaret(mf, isDeadCaret);
  if (isDeadCaret) mf.__mlDeadCaretHandled = true;
}, true);

document.addEventListener('beforeinput', function (e) {
  if (e.inputType !== 'insertFromComposition' || e.data !== '^') return;
  const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
  const mf = path.find(n => n && n.tagName === 'MATH-FIELD');
  if (!mf) return;
  const alreadyHandled = !!mf.__mlDeadCaretHandled;
  mf.__mlDeadCaretHandled = false;
  e.preventDefault();
  if (e.defaultPrevented) {
    // Browser hat die Einfügung tatsächlich abgebrochen.
    if (!alreadyHandled) _mlHandleCaret(mf);
    // sonst: der "Dead"-keydown-Abfang oben hat schon alles erledigt.
  } else {
    // preventDefault() wirkungslos -- Korrektur nachholen, sobald das
    // "input"-Ereignis bestätigt, dass das Zeichen trotzdem eingefügt wurde.
    mf.__mlPendingCaretFixMode = alreadyHandled ? 'cleanup-only' : 'full';
  }
}, true);
document.addEventListener('input', function (e) {
  const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
  const mf = path.find(n => n && n.tagName === 'MATH-FIELD');
  if (!mf || !mf.__mlPendingCaretFixMode) return;
  const mode = mf.__mlPendingCaretFixMode;
  mf.__mlPendingCaretFixMode = null;
  // Das eben zusätzlich eingefügte literale "^" wieder entfernen -- entweder
  // um danach ("full") sauber selbst in die Hochstellung zu wechseln, oder
  // ("cleanup-only") nur das Überbleibsel neben einer bereits vom
  // "Dead"-Abfang oben korrekt erstellten Hochstellung wegzuräumen.
  try { mf.executeCommand('deleteBackward'); } catch (ex) { /* defensiv */ }
  if (mode === 'full') _mlHandleCaret(mf);
}, true);

// BUG (Nutzer-Meldung, September 2026): "ich schreibe x^2 (das läuft super) und
// anschliessend /2 und es kommt zum Ausdruck x, und dann Bruch mit dem einsamen
// Index 2 im Zähler" -- reproduzierbar z.B. beim FRISCH GEÖFFNETEN Flächen-Panel,
// dessen Feld mit dem Standardbeispiel "x^2" VORBELEGT ist (mlSetFromRaw('x^2'),
// NICHT getippt) -- klickt man hinein und tippt sofort "/2", entsteht fälschlich
// x·(2-über-2) statt (x^2)/2.
//
// Root Cause (per Quellcode-Analyse von mathlive.js, MathModeEditor.insert()):
// "mf.value = ..." (das mlSetFromRaw() an allen Stellen im Projekt verwendet)
// ruft intern setValue() -> ModeEditor.insert() auf, OHNE options.selectionMode
// zu setzen -- Default dort ist "placeholder". Für eingefügten Text ohne
// \placeholder{} (wie "x^{2}") landet der Code im "else if (lastNewAtom)"-Zweig
// und setzt model.position = model.offsetOf(lastNewAtom) -- lastNewAtom ist hier
// der "x"-Atom samt seiner angehängten Hochstellungs-Branch (^{2}). Der
// resultierende Offset zeigt dabei NICHT "nach dem ganzen x^2-Konstrukt" (wie man
// erwarten würde), sondern faktisch INNERHALB der Hochstellung, hinter der "2" --
// exakt das beobachtete Symptom: ein "/" direkt danach wrapped nur die "2" (den
// Inhalt der aktuellen Branch), "x" bleibt aussen vor.
//
// Bei INTERAKTIV getipptem "x^2" tritt der Bug NICHT auf: dort läuft NIE
// setValue(), sondern MathLives eigene "smartSuperscript"-Logik
// (insertMathModeChar() in mathlive.js) springt nach der ERSTEN Ziffer im
// Exponenten automatisch per moveAfterParent() aus der Hochstellung heraus --
// deshalb "läuft x^2 super", wenn man es selbst tippt, aber nicht bei
// vorbelegten Feldern.
//
// Fix: nach JEDEM programmatischen "mf.value = ..." explizit den Cursor ans
// ECHTE Ende des Feldes setzen -- dieselbe Aktion, die [End] bzw. cmd+Rechts
// auslöst. Laut mathlive.js reine Modell-Zustandsänderung (setzt nur
// model.position = model.lastOffset), KEIN Fokus-Seiteneffekt -- sicher auch für
// Felder, die gerade NICHT fokussiert sind (z.B. beim initialen Aufbau vieler
// Felder auf einmal beim Start). Wird von allen mlSetFromRaw()-Implementierungen
// im Projekt direkt nach "inp.value = latex;" aufgerufen.
function _mlMoveCursorToEnd(mf) {
  try { mf.executeCommand('moveToMathfieldEnd'); } catch (ex) { /* defensiv */ }
}

const MI_FNAMES = new Set([
  'sin', 'cos', 'tan', 'sqrt', 'abs', 'log', 'exp',
  'nthroot', 'logn', 'log10', 'logbase',
  'asin', 'acos', 'atan'
]);

// ---------- Tokenizer ----------
function miTokenize(s) {
  const toks = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i + 1] || ''))) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      toks.push({ t: 'num', v: s.slice(i, j) });
      i = j; continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      // Bezeichner dürfen nach dem ersten Buchstaben auch Ziffern enthalten
      // (wichtig für "log10" als EIN Token, nicht "log"+"10").
      let j = i + 1;
      while (j < s.length && /[a-zA-Z0-9]/.test(s[j])) j++;
      toks.push({ t: 'id', v: s.slice(i, j) });
      i = j; continue;
    }
    if ('+-*/^(),_|'.includes(c)) { toks.push({ t: c, v: c }); i++; continue; }
    i++; // unbekanntes Zeichen defensiv überspringen
  }
  return toks;
}

// ---------- ASCIIMath-Dialekt-Kanonisierung (nur für MathLive-Input) ----------
// root(N)(X) -> nthroot(X,N) | log_B(X) -> logn(X,B) | ln(X) -> log(X) |
// bare log(X) -> log10(X) | bare e -> EC | |X| -> abs(X)
function miMatchParen(tokens, openIdx) {
  let depth = 0;
  for (let j = openIdx; j < tokens.length; j++) {
    if (tokens[j].t === '(') depth++;
    else if (tokens[j].t === ')') { depth--; if (depth === 0) return j; }
  }
  return null;
}

function miCanonicalizeAsciiMath(tokens) {
  let t = tokens.slice();
  let guard = 0;
  outer:
  while (guard++ < 1000) {
    for (let i = 0; i < t.length; i++) {
      const tok = t[i];

      if (tok.t === 'id' && tok.v === 'root' && t[i + 1] && t[i + 1].t === '(') {
        const closeN = miMatchParen(t, i + 1);
        if (closeN != null && t[closeN + 1] && t[closeN + 1].t === '(') {
          const closeX = miMatchParen(t, closeN + 1);
          if (closeX != null) {
            const nToks = t.slice(i + 2, closeN);
            const xToks = t.slice(closeN + 2, closeX);
            const repl = [{ t: 'id', v: 'nthroot' }, { t: '(', v: '(' }, ...xToks, { t: ',', v: ',' }, ...nToks, { t: ')', v: ')' }];
            t.splice(i, closeX - i + 1, ...repl);
            continue outer;
          }
        }
      }

      if (tok.t === 'id' && tok.v === 'log' && t[i + 1] && t[i + 1].t === '_') {
        if (t[i + 2] && t[i + 2].t === '(') {
          const closeB = miMatchParen(t, i + 2);
          if (closeB != null && t[closeB + 1] && t[closeB + 1].t === '(') {
            const closeX = miMatchParen(t, closeB + 1);
            if (closeX != null) {
              const bToks = t.slice(i + 3, closeB);
              const xToks = t.slice(closeB + 2, closeX);
              const repl = [{ t: 'id', v: 'logn' }, { t: '(', v: '(' }, ...xToks, { t: ',', v: ',' }, ...bToks, { t: ')', v: ')' }];
              t.splice(i, closeX - i + 1, ...repl);
              continue outer;
            }
          }
        } else if (t[i + 2] && (t[i + 2].t === 'num' || t[i + 2].t === 'id')) {
          const bTok = t[i + 2];
          if (t[i + 3] && t[i + 3].t === '(') {
            const closeX = miMatchParen(t, i + 3);
            if (closeX != null) {
              const xToks = t.slice(i + 4, closeX);
              const repl = [{ t: 'id', v: 'logn' }, { t: '(', v: '(' }, ...xToks, { t: ',', v: ',' }, bTok, { t: ')', v: ')' }];
              t.splice(i, closeX - i + 1, ...repl);
              continue outer;
            }
          }
        }
      }

      if (tok.t === 'id' && tok.v === 'ln') {
        t[i] = { t: 'id', v: 'log' };
        continue outer;
      }

      // MathLive kann den Arkusfunktionen-Namen je nach Version/Dialekt als
      // "arcsin"/"arccos"/"arctan" statt unserem "asin"/"acos"/"atan" ausgeben.
      if (tok.t === 'id' && (tok.v === 'arcsin' || tok.v === 'arccos' || tok.v === 'arctan')) {
        t[i] = { t: 'id', v: tok.v.slice(3) };
        continue outer;
      }

      if (tok.t === 'id' && tok.v === 'log' && t[i + 1] && t[i + 1].t === '(') {
        t[i] = { t: 'id', v: 'log10' };
        continue outer;
      }

      if (tok.t === 'id' && tok.v === 'e' && !(t[i + 1] && t[i + 1].t === '(')) {
        t[i] = { t: 'id', v: 'EC' };
        continue outer;
      }

      if (tok.t === '|') {
        let depth = 0, close = -1;
        for (let j = i + 1; j < t.length; j++) {
          if (t[j].t === '(') depth++;
          else if (t[j].t === ')') depth--;
          else if (t[j].t === '|' && depth === 0) { close = j; break; }
        }
        if (close !== -1) {
          const inner = t.slice(i + 1, close);
          const repl = [{ t: 'id', v: 'abs' }, { t: '(', v: '(' }, ...inner, { t: ')', v: ')' }];
          t.splice(i, close - i + 1, ...repl);
          continue outer;
        }
      }
    }
    break;
  }
  return t;
}

// ---------- Parser (rekursiver Abstieg) mit impliziter Multiplikation ----------
// expr := term (('+'|'-') term)*
// term := factor ( ('*'|'/') factor | factor )*      [Lücke ohne Operator = implizite '*']
// unary := '-' unary | power
// power := primary ('^' unary)?
// primary := NUM | ID ['(' args ')']  (nur bei bekanntem Funktionsnamen!) | '(' expr ')'
function miCanStartPrimary(tok) {
  return !!tok && (tok.t === 'num' || tok.t === 'id' || tok.t === '(');
}

function miParse(tokens) {
  let p = 0;
  function peek() { return tokens[p]; }
  function next() { return tokens[p++]; }
  function expect(t) {
    if (!peek() || peek().t !== t) throw new Error('Parse-Fehler: erwartet "' + t + '", gefunden ' + JSON.stringify(peek()) + ' bei Position ' + p);
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
    while (peek() && (peek().t === '*' || peek().t === '/' || miCanStartPrimary(peek()))) {
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
  function parseUnary() {
    if (peek() && peek().t === '-') {
      next();
      return { type: 'neg', x: parseUnary() };
    }
    return parsePower();
  }
  function parsePower() {
    let node = parsePrimary();
    if (peek() && peek().t === '^') {
      next();
      const exp = parseUnary();
      node = { type: 'pow', a: node, b: exp };
    }
    return node;
  }
  function parsePrimary() {
    const tok = peek();
    if (!tok) throw new Error('Parse-Fehler: unerwartetes Ende');
    if (tok.t === 'num') { next(); return { type: 'num', v: tok.v }; }
    if (tok.t === '(') {
      next();
      const inner = parseExpr();
      expect(')');
      return inner;
    }
    if (tok.t === 'id') {
      next();
      if (MI_FNAMES.has(tok.v) && peek() && peek().t === '(') {
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
    throw new Error('Parse-Fehler: unerwartetes Token ' + JSON.stringify(tok) + ' bei Position ' + p);
  }

  const result = parseExpr();
  if (p < tokens.length) throw new Error('Parse-Fehler: Rest nicht verarbeitet ab Position ' + p + ' (' + JSON.stringify(tokens.slice(p)) + ')');
  return result;
}

function miParseRaw(s) { return miParse(miTokenize(s)); }
function miParseAsciiMath(s) { return miParse(miCanonicalizeAsciiMath(miTokenize(s))); }

// ---------- Drucker: AST → Rohausdruck-Format ----------
// Konvention: Brüche werden IMMER als (Zähler)/(Nenner) gedruckt — beide
// Seiten geklammert — damit der Bruch beim erneuten Einlesen (miParseRaw)
// eindeutig als EIN div-Knoten erkannt wird, unabhängig von Operator-
// Vorrang-Regeln im Kontext drumherum.
const MI_PREC = { add: 1, sub: 1, mul: 2, div: 2, neg: 3, pow: 4 };
function miIsAtomic(n) { return n.type === 'num' || n.type === 'id' || n.type === 'call'; }

function miToRaw(node, parentPrec, side, parentType) {
  parentPrec = parentPrec || 0;
  side = side || 'l';
  let out, myPrec;
  switch (node.type) {
    case 'num': return node.v;
    case 'id': return node.v;
    case 'call':
      return node.name + '(' + node.args.map(a => miToRaw(a, 0)).join(',') + ')';
    case 'neg': {
      out = '-' + (miIsAtomic(node.x) ? miToRaw(node.x, 0) : '(' + miToRaw(node.x, 0) + ')');
      myPrec = MI_PREC.neg;
      break;
    }
    case 'pow': {
      const baseStr = miIsAtomic(node.a) ? miToRaw(node.a, 0) : '(' + miToRaw(node.a, 0) + ')';
      const expStr = miIsAtomic(node.b) ? miToRaw(node.b, 0) : '(' + miToRaw(node.b, 0) + ')';
      out = baseStr + '^' + expStr;
      myPrec = MI_PREC.pow;
      break;
    }
    case 'div': {
      out = '(' + miToRaw(node.a, 0) + ')/(' + miToRaw(node.b, 0) + ')';
      myPrec = MI_PREC.div;
      break;
    }
    case 'add': case 'sub': case 'mul': {
      const opChar = node.type === 'add' ? '+' : node.type === 'sub' ? '-' : '*';
      const myP = MI_PREC[node.type];
      const aStr = miToRaw(node.a, myP, 'l', node.type);
      let bStr = miToRaw(node.b, myP, 'r', node.type);
      // Sicherheitsnetz gegen "x--1.5" statt "x-(-1.5)" (z.B. bei "x-(-1.5)"
      // eingetippt, oder bei automatisch aus einem negativen Wert gebauten
      // Ausdrücken wie einer Tangentengleichung an einer Stelle x0<0):
      // miParseRaw() (der eigene AST-Parser) toleriert "--" problemlos als
      // zwei aufeinanderfolgende Minus, aber safeEval() kompiliert den
      // Rohtext über JAVASCRIPTS EIGENEN Compiler (new Function(...), siehe
      // getEvalFn() in 03_math.js) — dort ist "--" der Dekrement-Operator,
      // die Kompilierung schlägt fehl (SyntaxError, abgefangen -> überall
      // NaN). Beginnt die rechte Seite mit "-" und der Operator ist
      // ebenfalls "-", deshalb IMMER klammern (unabhängig von der sonstigen
      // Präzedenz-Logik unten, die nur "sieht", DASS b ein 'neg'-Knoten ist,
      // nicht WELCHES Zeichen b am Anfang tatsächlich druckt).
      if (opChar === '-' && bStr.charAt(0) === '-') bStr = '(' + bStr + ')';
      out = aStr + opChar + bStr;
      myPrec = myP;
      break;
    }
    default:
      throw new Error('miToRaw: unbekannter Knotentyp ' + node.type);
  }
  // Rechte Seite bei GLEICHER Präzedenz: nur bei nicht-assoziativen Kombinationen
  // sind Klammern zwingend nötig — sonst würde z.B. "5-(2+3)" fälschlich als
  // "5-2+3" (=6 statt 0) gedruckt. "a-(b-c)" und "a/(b/c)" ebenso zwingend;
  // "a+(b-c)"/"a*(b/c)" sind mathematisch auch ungeklammert korrekt, werden
  // hier aber (harmlos) trotzdem geklammert, wenn der Kindtyp sub/div/pow ist.
  const needsWrap = myPrec < parentPrec ||
    (myPrec === parentPrec && side === 'r' && (
      node.type === 'sub' || node.type === 'div' || node.type === 'pow' ||
      (node.type === 'add' && parentType === 'sub')
    ));
  return needsWrap ? '(' + out + ')' : out;
}

// ---------- Drucker: AST → LaTeX (für mf.setValue bei programmatischem Schreiben) ----------
function miToLatex(node, parentPrec, side, parentType) {
  parentPrec = parentPrec || 0;
  side = side || 'l';
  let out, myPrec;
  switch (node.type) {
    case 'num': return node.v;
    case 'id':
      if (node.v === 'pi') return '\\pi ';
      if (node.v === 'EC') return 'e';
      return node.v;
    case 'call': {
      const a0 = node.args[0];
      const l0 = a0 ? miToLatex(a0, 0) : '';
      switch (node.name) {
        case 'sin': return '\\sin(' + l0 + ')';
        case 'cos': return '\\cos(' + l0 + ')';
        case 'tan': return '\\tan(' + l0 + ')';
        case 'asin': return '\\arcsin(' + l0 + ')';
        case 'acos': return '\\arccos(' + l0 + ')';
        case 'atan': return '\\arctan(' + l0 + ')';
        case 'sqrt': return '\\sqrt{' + l0 + '}';
        case 'abs': return '\\left|' + l0 + '\\right|';
        case 'exp': return 'e^{' + l0 + '}';
        case 'nthroot': return '\\sqrt[' + miToLatex(node.args[1], 0) + ']{' + l0 + '}';
        case 'logn': case 'logbase':
          return '\\log_{' + miToLatex(node.args[1], 0) + '}(' + l0 + ')';
        case 'log10': return '\\log_{10}(' + l0 + ')';
        case 'log': return '\\ln(' + l0 + ')';
        default: return '\\operatorname{' + node.name + '}(' + node.args.map(a => miToLatex(a, 0)).join(',') + ')';
      }
    }
    case 'neg': {
      out = '-' + (miIsAtomic(node.x) ? miToLatex(node.x, 0) : '(' + miToLatex(node.x, 0) + ')');
      myPrec = MI_PREC.neg;
      break;
    }
    case 'pow': {
      out = '{' + miToLatex(node.a, 100) + '}^{' + miToLatex(node.b, 0) + '}';
      myPrec = MI_PREC.pow;
      break;
    }
    case 'div': {
      out = '\\frac{' + miToLatex(node.a, 0) + '}{' + miToLatex(node.b, 0) + '}';
      myPrec = 100;
      break;
    }
    case 'mul': {
      const aStr = miToLatex(node.a, MI_PREC.mul, 'l');
      // "5x", "5\sin(x)", "5x^2" dürfen ohne \cdot nebeneinander stehen (liest
      // sich eindeutig) — ABER "5*0.2^x" NICHT: node.b ist zwar 'pow', doch die
      // BASIS der Potenz (0.2) ist selbst eine Zahl, und "5" gefolgt von "0.2^x"
      // ohne \cdot sieht in MathLive/KaTeX wie "50.2^x" aus (Leerzeichen
      // zwischen zwei Ziffern-Atomen wird beim Rendern nicht dargestellt) —
      // Nutzerwunsch/Bugreport: "im Eingabefeld erscheint 50.2^x - es sollte
      // 5 · 0.2^x". Daher: bei 'pow' zusätzlich prüfen, ob die Basis selbst
      // eine Zahl ist, und in dem Fall NICHT juxtaposen.
      const juxtaposeOk = node.a.type === 'num' && (
        node.b.type === 'id' || node.b.type === 'call' ||
        (node.b.type === 'pow' && node.b.a.type !== 'num')
      );
      const bStr = miToLatex(node.b, MI_PREC.mul, 'r');
      out = aStr + (juxtaposeOk ? ' ' : ' \\cdot ') + bStr;
      myPrec = MI_PREC.mul;
      break;
    }
    case 'add': case 'sub': {
      const opChar = node.type === 'add' ? '+' : '-';
      const myP = MI_PREC[node.type];
      const aStr = miToLatex(node.a, myP, 'l', node.type);
      const bStr = miToLatex(node.b, myP, 'r', node.type);
      out = aStr + opChar + bStr;
      myPrec = myP;
      break;
    }
    default:
      throw new Error('miToLatex: unbekannter Knotentyp ' + node.type);
  }
  // Siehe miToRaw() für die Begründung: "a-(b+c)" braucht auf der rechten
  // Seite einer Subtraktion zwingend Klammern, sonst kippt das Vorzeichen.
  const needsWrap = myPrec < parentPrec ||
    (myPrec === parentPrec && side === 'r' && (
      node.type === 'sub' || node.type === 'pow' ||
      (node.type === 'add' && parentType === 'sub')
    ));
  return needsWrap ? '\\left(' + out + '\\right)' : out;
}

// ---------- Kontextmenü des math-field (die "⋮"/3-Strich-Menü-Schaltfläche) ----------
// Reduziert MathLives Standardmenü auf das, was für diese App sinnvoll ist:
// keine Matrizen (kein Matrix-Editor im Einsatz), kein separates "Einfügen"-
// Untermenü (Betrag/Wurzel/Logarithmus-Basis stehen bereits über die
// bestehende Tastatur-Sektion bereit), keine Schriftstil-/Text-/Hintergrund-
// farb-Optionen, und keine Compute-Engine-Befehle (Auswerten/Vereinfachen/
// Lösen) — die zugehörige Bibliothek ist hier gar nicht eingebunden, die
// Einträge würden also ohnehin nichts tun.
const ML_MENU_REMOVE_IDS = new Set([
  // Matrix-Bearbeitung (Zeilen/Spalten, Matrix einfügen)
  'add-row-above', 'add-row-below', 'add-column-before', 'add-column-after',
  'delete-row', 'delete-column', 'insert-matrix',
  // "Einfügen"-Untermenü (Betrag/Wurzel/Log-Basis etc. — bereits in der App-Tastatur)
  'insert',
  // Schriftstil / Textfarbe / Hintergrundfarbe
  'variant', 'color', 'background-color',
  // Compute Engine (nicht eingebunden, Einträge wären wirkungslos)
  'ce-evaluate', 'ce-simplify', 'ce-solve',
]);

function mlFilterMenuItems(items) {
  if (!Array.isArray(items)) return items;
  let out = items.filter(it => {
    if (it.id && ML_MENU_REMOVE_IDS.has(it.id)) return false;
    // Das Umgebungs-Untermenü (Klammerstil einer Matrix) hat selbst keine id,
    // nur seine Kinder ("environment-...") — nur relevant innerhalb einer Matrix.
    if (!it.id && Array.isArray(it.submenu) && it.submenu[0]?.id?.startsWith('environment-')) return false;
    return true;
  });
  // Überflüssige Trenner aufräumen (führend/doppelt/abschliessend)
  const cleaned = [];
  for (const it of out) {
    if (it.type === 'divider') {
      if (cleaned.length === 0) continue;
      if (cleaned[cleaned.length - 1].type === 'divider') continue;
    }
    cleaned.push(it);
  }
  if (cleaned.length && cleaned[cleaned.length - 1].type === 'divider') cleaned.pop();
  return cleaned;
}

// ---------- Einmaliger Fokus-"Warm-up" pro <math-field> ----------
// BUG (Nutzer-Meldung, September 2026): "g(x) wird ignoriert", "Funktion
// sqrt(x) wird nicht angezeigt", "^2/^3 wird zu \2/\3" — alle drei liessen
// sich auf dieselbe Ursache zurückführen: MathLive baut beim ALLERERSTEN
// Fokussieren eines neu ins DOM eingehängten <math-field>-Elements intern
// offenbar etwas asynchron auf (siehe auch den Kommentar bei
// queueMicrotask(...menuItems...) in renderFuncList(), 06_ui_functions.js,
// der dieselbe asynchrone Mount-Eigenart schon für einen anderen Zweck
// dokumentiert). Tippt man SOFORT nach diesem allerersten Fokussieren
// weiter (typischer Nutzer-Workflow: Feld anklicken und direkt den
// Ausdruck eintippen), gehen die ersten ein bis zwei Zeichen dabei
// nachweislich verloren bzw. werden falsch interpretiert — reproduziert
// z.B. mit "x^2" sofort nach Fokus eingetippt: das führende "x" ging
// verloren UND der Hochstellungs-Operator "^" blieb als literaler Text
// statt einer echten Hochstellung stehen. Beim zweiten und jedem weiteren
// Fokus desselben Elements tritt das Problem nicht mehr auf.
// Fix: jedes math-field-Element GENAU EINMAL (direkt nachdem es ins DOM
// eingehängt wurde) programmatisch fokussieren und sofort wieder
// unfokussieren — dieser interne Aufbau läuft dann VOR der ersten
// echten Nutzerinteraktion ab statt währenddessen. Der vorherige Fokus
// wird danach wiederhergestellt, damit dieser "Warm-up" nie sichtbar
// den Fokus stiehlt. Rein defensiv — darf niemals einen Fehler werfen
// (z.B. falls MathLive in einer zukünftigen Version .focus()/.blur()
// anders handhabt).
//
// WICHTIG: viele math-field-Elemente (z.B. f(x)/g(x) im Ober-/Untersummen-
// Panel) stecken in einem standardmässig EINGEKLAPPTEN, also unsichtbaren
// (display:none) Panel (siehe die "Zusammenklappbare Panels"-Sektion weiter
// unten in dieser Datei). .focus() auf einem nicht sichtbaren Element ist
// laut Spec wirkungslos (document.activeElement ändert sich nicht) — ABER
// (empirisch geprüft, nicht nur Spekulation): bei MathLive ist .focus() auf
// einem unsichtbaren <math-field> KEIN harmloses No-op — es hinterlässt das
// Element in einem kaputten internen Zustand, der auch NACH dem späteren
// Sichtbarwerden jeden weiteren echten Fokusversuch (Klick des Nutzers)
// verhindert (reproduziert: nach so einem verfrühten .focus()-Aufruf liess
// sich das betroffene Feld nie wieder fokussieren, Klicks blieben komplett
// wirkungslos). Deshalb HIER, VOR jedem .focus()-Aufruf, Sichtbarkeit
// prüfen (offsetParent !== null) und bei Unsichtbarkeit sofort abbrechen,
// OHNE .focus() überhaupt anzufassen — nicht erst danach über
// document.activeElement kontrollieren. _mlPrewarmed bleibt in diesem Fall
// ungesetzt, sodass ein SPÄTERER Aufruf (siehe Panel-Klick-Handler weiter
// unten in dieser Sektion, der nach dem Aufklappen erneut prewarmt) es
// erfolgreich nachholen kann, sobald das Element tatsächlich sichtbar ist.
function _mlPrewarmFocusNow(el) {
  if (!el || el.tagName !== 'MATH-FIELD' || el._mlPrewarmed) return;
  if (el.offsetParent === null) return; // unsichtbar (z.B. eingeklapptes Panel) -- .focus() NICHT anfassen
  try {
    const prevActive = document.activeElement;
    el.focus();
    if (document.activeElement !== el) return; // aus anderem Grund nicht fokussierbar -- später erneut versuchen
    el._mlPrewarmed = true;
    el.blur();
    if (prevActive && prevActive !== el && prevActive !== document.body && typeof prevActive.focus === 'function') {
      prevActive.focus();
    }
  } catch (ex) { /* ignorieren — siehe Kommentar oben */ }
}

// Öffentlicher Einstiegspunkt: verzögert den eigentlichen Warm-up (siehe
// oben) über zwei requestAnimationFrame-Ticks. Ein frisch ins DOM
// eingehängtes <math-field> "mountet" sich intern nachweislich nicht
// innerhalb desselben Microtask-Durchlaufs (führte vereinzelt zu einer
// von MathLive selbst geworfenen "Mathfield not mounted"-Fehlermeldung,
// wenn direkt danach fokussiert wurde) — zwei rAF-Ticks (statt nur
// queueMicrotask) geben dem Mount-Vorgang zuverlässig genug Zeit. Alle
// Aufrufer rufen einfach mlPrewarmFocus(el) auf, ohne sich selbst um
// Verzögerung/Zeitpunkt kümmern zu müssen.
function mlPrewarmFocus(el) {
  requestAnimationFrame(() => requestAnimationFrame(() => _mlPrewarmFocusNow(el)));
}

// ---------- Öffentliche API ----------
// Wirft bei unvollständigen/ungültigen Zwischenzuständen (z.B. während des
// Tippens: "2+", leerer Bruchnenner) bewusst eine Exception — der Aufrufer
// (06_ui_functions.js) fängt das ab und lässt den bisherigen Rohausdruck
// unverändert, statt die Funktion/den Graphen kaputtzumachen.
function asciiMathToRaw(asciiStr) {
  if (asciiStr == null || !asciiStr.trim()) return '';
  const ast = miParseAsciiMath(asciiStr);
  return miToRaw(ast, 0);
}
function rawToLatex(rawStr) {
  if (rawStr == null || !rawStr.trim()) return '';
  const ast = miParseRaw(rawStr);
  return miToLatex(ast, 0);
}

if (typeof module !== 'undefined') {
  module.exports = { miTokenize, miParse, miParseRaw, miParseAsciiMath, miToRaw, miToLatex, asciiMathToRaw, rawToLatex, miCanonicalizeAsciiMath, mlFilterMenuItems };
}
