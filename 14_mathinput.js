// ═══════════════════════════════════════════════════════════════════
// MODUL 14: MathInput — robuster Konverter zwischen MathLive (ASCIIMath/
// LaTeX) und dem Rohausdruck-Format des Plotters.
//
// Statt Regex-Ketten wird ein kleiner, korrekter Parser verwendet:
// Text → Tokens → AST → Zieltext. Das ist robust gegenüber beliebiger
// Verschachtelung (Brüche in Brüchen, Klammern in Klammern, ...), was
// mit reinen Regex-Ersetzungen strukturell nicht zuverlässig möglich ist.
// ═══════════════════════════════════════════════════════════════════

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
      const juxtaposeOk = node.a.type === 'num' && (node.b.type === 'id' || node.b.type === 'call' || node.b.type === 'pow');
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
