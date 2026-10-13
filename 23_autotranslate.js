// ============================================================
// 23_autotranslate.js — automatische Übersetzung der gesamten Oberfläche
// ------------------------------------------------------------
// Ziel: JEDER sichtbare Text (auch in Zukunft neu hinzugefügte deutsche Texte)
// erscheint in der gewählten Sprache – ohne dass für jeden neuen Text ein
// Übersetzungs-Schlüssel gepflegt werden muss.
//
// Prinzip
//   • Quellsprache der App ist Deutsch. Der DOM wird beobachtet (MutationObserver).
//   • Jeder Text-"Block" (Absatz, Button, Label, Tooltip-Zeile, …) wird zu einer
//     Vorlage ("Template") gemacht: Zahlen, Formeln, Icons, Eingabefelder usw.
//     werden durch Platzhalter {0} {1} … geschützt, Auszeichnungen (<b>…</b>)
//     durch <0>…</0>. Nur diese Vorlage wird übersetzt – Zahlen/Formeln bleiben
//     garantiert unverändert, der Satz kann aber umgestellt werden.
//   • Nachschlage-Reihenfolge:  1. von Hand gepflegte Übersetzungen (01_i18n.js)
//                               2. mitgelieferte Seed-Dateien (i18n_seed_<xx>.js)
//                               3. lokaler Cache (localStorage)
//                               4. Online-Übersetzer (Kette, s.u.)
//   • Online-Kette: [optional: Google-Cloud-Schlüssel / LibreTranslate] →
//     Chrome-eigener Übersetzer (on-device) → Google (gtx) → MyMemory.
//     Jeder Dienst hat einen Schutzschalter (bei Fehlern wird er pausiert).
//   • Die Antwort wird geprüft (alle Platzhalter genau einmal vorhanden); sonst
//     wird satzteilweise übersetzt; sonst bleibt der deutsche Text stehen.
//   • Zurück auf Deutsch: die Originalvorlage wird exakt wiederhergestellt.
//
// Öffentliche API: AI18N.setLanguage(code), AI18N.tr(text), AI18N.refresh(),
//   AI18N.setOnline(bool), AI18N.setApiKey(key), AI18N.exportCache(lang),
//   AI18N.clearCache(), AI18N.status(), AI18N.onStatus(fn)
// ============================================================
(function () {
  'use strict';

  const SRC = 'de';
  const LS_LANG = 'plotter_lang', LS_CFG = 'plotter_i18n_cfg', LS_CACHE = l => 'plotter_i18n_cache_' + l;
  const CACHE_MAX = 4000;

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* voll / gesperrt */ } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  const cfg = Object.assign({ online: true, apiKey: '', libreUrl: '', libreKey: '' },
    (() => { try { return JSON.parse(lsGet(LS_CFG) || '{}'); } catch (e) { return {}; } })());
  function saveCfg() { lsSet(LS_CFG, JSON.stringify(cfg)); }

  const st = { lang: SRC, provider: '', error: '', pending: 0 };
  const statusListeners = [];
  function emitStatus() { st.pending = pending.size + inflight; statusListeners.forEach(f => { try { f(status()); } catch (e) {} }); }
  function status() { return { lang: st.lang, provider: st.provider, error: st.error, pending: pending.size + inflight, online: cfg.online }; }

  // ---------- Speicher je Sprache ----------
  const MEM = {};
  function mem(lang) {
    return MEM[lang] || (MEM[lang] = { cur: new Map(), rev: new Map(), native: new Set(), cache: new Map(), seed: null, prepared: false, dirty: false });
  }

  // Wortschatz-Erkennung: ist ein Text vermutlich schon in der Zielsprache (statt Deutsch)?
  // Nötig für Mischtexte, z.B. "f₁ Y-intercept (0|3)" = deutscher Rahmen + t()-Übersetzung.
  const WORD_RE = /\p{L}{3,}/gu;
  const TOKX = /\{\d+\}|<\/?\d+>/g;
  const DV = new Set();                   // deutsche Wörter
  const TV = {};                          // Zielsprache → Wörter
  let dvBuilt = false;
  function wordsOf(s) { return (s.replace(TOKX, ' ').toLowerCase().match(WORD_RE)) || []; }
  function addWords(set, s) { for (const w of wordsOf(s)) set.add(w); }
  function buildDV() {
    if (dvBuilt) return; dvBuilt = true;
    try { for (const k in LANGUAGES[SRC]) { const v = LANGUAGES[SRC][k]; if (typeof v === 'string') addWords(DV, v); } } catch (e) {}
  }
  function tv(lang) { return TV[lang] || (TV[lang] = new Set()); }
  function looksTarget(lang, key) {
    buildDV();
    const T = TV[lang]; if (!T) return false;
    const w = wordsOf(key); if (!w.length) return false;
    let t = 0, d = 0;
    for (const x of w) { if (T.has(x)) t++; if (DV.has(x)) d++; }
    return t > d;
  }

  // ============================================================
  // 1. Maskierung: Zahlen, Formeln, Platzhalter → {n}
  // ============================================================
  // Reihenfolge wichtig: {name}-Platzhalter, Zahlen, f(x)-Ausdrücke, Einzelzeichen < > { }, Emojis
  const MASK_RE = /\{[A-Za-z_]\w*\}|\d+(?:[.,]\d+)*(?:[eE][+-]?\d+)?|\b[A-Za-z]'*\([^()\s][^()]{0,24}\)|[<>{}]|\p{Extended_Pictographic}️?/gu;
  const LET2 = /\p{L}{2,}/u;
  const SKIPWORD = /^(?:sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|ln|lg|log|exp|lim|sup|inf|abs|sgn|px|cm|mm|ms|dx|dy|dt|dz|Hz|kg|km|mod|det|rad|deg|ggT|kgV)$/i;

  function maskText(s, items) {
    return s.replace(MASK_RE, m => '{' + (items.push({ t: 'lit', s: m }) - 1) + '}');
  }
  const TOK_RE = /\{(\d+)\}|<(\d+)>|<\/(\d+)>/g;

  // Segment (eine Zeile einer Vorlage) → {pre, core, post, key, map}
  // Aufzählungen aus Formeln/Zahlen ("{3}, {4}, {5}, …") ändern ihre Länge von Aufgabe zu Aufgabe.
  // Damit nicht für jede Länge ein eigener Schlüssel entsteht, steht im Schlüssel nur der ERSTE Platzhalter;
  // bei der Ausgabe wird er wieder zur vollständigen Aufzählung erweitert (Segment.runs).
  const RUN_RE = /\{\d+\}(?:, \{\d+\}){2,}/g;
  function canonSeg(chunk) {
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(chunk);
    const map = [], runs = {};
    const core = m[2].replace(RUN_RE, run => { const first = run.slice(0, run.indexOf('}') + 1); runs[+first.slice(1, -1)] = run; return first; });
    let key = core.replace(TOK_RE, (all, a, b, c) => {
      const u = +(a != null ? a : b != null ? b : c);
      let li = map.indexOf(u);
      if (li < 0) { li = map.length; map.push(u); }
      return a != null ? '{' + li + '}' : b != null ? '<' + li + '>' : '</' + li + '>';
    });
    key = key.replace(/[ \t]+/g, ' ');
    return { pre: m[1], post: m[3], key, map, runs };
  }
  function needsTr(key) {
    let plain = key.replace(TOK_RE, ' ').trim();
    plain = plain.replace(new RegExp('(?<![\\p{L}\\d])(?:' + SKIPWORD.source.slice(4, -2) + ')(?![\\p{L}\\d])', 'giu'), ' ');   // reine Formelzeilen wie "cos(b·x) = {0}" nicht übersetzen
    if (!LET2.test(plain)) return false;
    if (SKIPWORD.test(plain)) return false;
    return true;
  }
  function tokSig(s) {
    const a = [];
    s.replace(TOK_RE, m => { a.push(m); return m; });
    return a.sort().join('');
  }
  // Rohstring (nur Zahlen/Platzhalter maskiert, ohne DOM) → Canon-Schlüssel
  function canonString(s) { const items = []; return canonSeg(maskText(s, items)).key; }

  // Vorlage in Zeilen zerlegen (Trenner: \n und <br>-Platzhalter)
  function makeParts(u, items) {
    const parts = [];
    const re = /\n|\{(\d+)\}/g;
    let last = 0, m;
    const chunks = [], seps = [];
    while ((m = re.exec(u))) {
      const isSep = m[0] === '\n' || (items[+m[1]] && items[+m[1]].br);
      if (!isSep) continue;
      chunks.push(u.slice(last, m.index)); seps.push(m[0]); last = m.index + m[0].length;
    }
    chunks.push(u.slice(last));
    const balanced = c => {
      const o = {}, cl = {};
      c.replace(/<(\d+)>/g, (a, n) => { o[n] = (o[n] || 0) + 1; return a; });
      c.replace(/<\/(\d+)>/g, (a, n) => { cl[n] = (cl[n] || 0) + 1; return a; });
      const ks = new Set([...Object.keys(o), ...Object.keys(cl)]);
      for (const k of ks) if ((o[k] || 0) !== (cl[k] || 0)) return false;
      return true;
    };
    if (!chunks.every(balanced)) { chunks.length = 0; chunks.push(u); seps.length = 0; }
    chunks.forEach((c, i) => {
      const seg = canonSeg(c);
      seg.tr = needsTr(seg.key);
      parts.push(seg);
      if (i < seps.length) parts.push(seps[i]);
    });
    return parts;
  }

  // ============================================================
  // 2. Nachschlagen
  // ============================================================
  function prepareLang(lang) {
    const M = mem(lang);
    if (M.prepared || lang === SRC) return M;
    M.prepared = true;
    // a) von Hand gepflegte Übersetzungen (01_i18n.js) → kanonische Vorlagen
    try {
      const D = LANGUAGES[SRC] || {}, L = LANGUAGES[lang] || {};
      for (const k of Object.keys(L)) {
        if (typeof L[k] !== 'string' || typeof D[k] !== 'string') continue;
        const a = canonString(D[k]), b = canonString(L[k]);
        if (tokSig(a) !== tokSig(b)) continue;      // Platzhalter passen nicht zusammen → nicht verwenden
        M.cur.set(a, b);
        M.rev.set(b, a);
        M.native.add(b);
      }
      for (const k of Object.keys(L)) if (typeof L[k] === 'string') addWords(tv(lang), L[k]);
    } catch (e) {}
    // b) Cache aus localStorage
    try {
      const raw = lsGet(LS_CACHE(lang));
      if (raw) { const o = JSON.parse(raw); for (const k of Object.keys(o)) { M.cache.set(k, o[k]); M.native.add(o[k]); M.rev.set(o[k], k); addWords(DV, k); if (o[k] !== k) addWords(tv(lang), o[k]); } }
    } catch (e) {}
    return M;
  }
  function lookup(lang, key) {
    const M = mem(lang);
    let v = M.cur.get(key);
    if (v !== undefined) return v;
    if (M.seed) { v = M.seed[key]; if (v !== undefined) return v; }
    return M.cache.get(key);
  }
  function revFind(key) {
    for (const l in MEM) { const g = MEM[l].rev.get(key); if (g !== undefined) return g; }
    return undefined;
  }
  function seedRev(lang) {
    const M = mem(lang);
    if (!M.seed || M.seedRevDone) return;
    M.seedRevDone = true;
    buildDV(); M.rg = null;
    for (const k of Object.keys(M.seed)) { const v = M.seed[k]; M.native.add(v); if (!M.rev.has(v)) M.rev.set(v, k); addWords(tv(lang), v); addWords(DV, k); }
  }

  // Mischtexte wie "<0>Zero von f{1}(x)</0>" (Rahmen deutsch hart codiert, "Zero" aus t()):
  // bekannte Zielsprachen-Begriffe aus 01_i18n.js werden durch ihr deutsches Original ersetzt.
  function regerman(lang, key) {
    const M = mem(lang);
    if (!M.rg) {
      M.rg = [];
      buildDV();
      M.rev.forEach((de, tg) => {
        if (tg.length < 3 || tg === de || de.length > 60 || /[{}<>]/.test(tg + de)) return;
        const w = wordsOf(tg);
        if (w.length && w.every(x => DV.has(x))) return;      // Zielsprachen-Wort, das auch deutsch ist (z.B. "Maximum")
        M.rg.push({ tg, de, re: null });
      });
      M.rg.sort((a, b) => b.tg.length - a.tg.length);
    }
    let s = key;
    for (const e of M.rg) {
      if (s.indexOf(e.tg) < 0) continue;
      if (!e.re) e.re = new RegExp('(?<![\\p{L}\\d])' + e.tg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\p{L}\\d])', 'gu');
      e.re.lastIndex = 0;
      s = s.replace(e.re, e.de);
    }
    return s;
  }

  // Ergebnis für ein Segment: {out} oder {wait:srcKey}
  function resolveSeg(lang, key) {
    const v = lookup(lang, key);
    if (v !== undefined) return { out: v };
    const M = mem(lang);
    if (M.native.has(key)) return { out: key };         // schon in Zielsprache
    if (!M.seedLoaded) return { defer: true };           // Seed-Datei noch nicht da → später erneut versuchen, nichts anfragen
    const g = revFind(key);                              // Text einer anderen Sprache → deutsche Quelle
    if (g !== undefined && g !== key) {
      const v2 = lookup(lang, g);
      if (v2 !== undefined) return { out: v2 };
      return { wait: g };
    }
    if (looksTarget(lang, key)) return { out: key };     // Mischtext, überwiegend schon Zielsprache
    const g2 = regerman(lang, key);                      // Mischtext: t()-Teile zurück ins Deutsche, dann Seed/Übersetzer
    if (g2 !== key) {
      const v3 = lookup(lang, g2);
      return v3 !== undefined ? { out: v3 } : { wait: g2 };
    }
    return { wait: key };
  }

  // ---------- Seeds ----------
  const seedState = {};
  function ensureSeed(lang) {
    if (lang === SRC) return Promise.resolve();
    if (seedState[lang]) return seedState[lang];
    return (seedState[lang] = new Promise(res => {
      const M = mem(lang);
      const apply = () => { const S = (window.I18N_SEEDS || {})[lang]; if (S) { M.seed = S; seedRev(lang); } M.seedLoaded = true; res(); };
      if ((window.I18N_SEEDS || {})[lang]) return apply();
      const s = document.createElement('script');
      s.src = 'i18n_seed_' + lang + '.js';
      s.onload = apply; s.onerror = () => { M.seedLoaded = true; res(); };
      document.head.appendChild(s);
    }));
  }

  // ============================================================
  // 3. Text-Ausgabe aus Vorlage
  // ============================================================
  // Ergebnis-String (mit Platzhaltern auf Einheits-Ebene) oder null, falls etwas fehlt
  function outString(parts, lang, waiter) {
    let res = '', missing = false;
    for (const p of parts) {
      if (typeof p === 'string') { res += p; continue; }
      if (!p.tr) { res += p.pre + remap(p.key, p.map, p.runs) + p.post; continue; }
      const r = resolveSeg(lang, p.key);
      if (r.out !== undefined) res += p.pre + remap(r.out, p.map, p.runs) + p.post;
      else { missing = true; if (!r.defer) request(lang, r.wait, waiter); }
    }
    return missing ? null : res;
  }
  function remap(s, map, runs) {
    return s.replace(TOK_RE, (all, a, b, c) => {
      const k = +(a != null ? a : b != null ? b : c);
      const u = map[k];
      if (u === undefined) return all;
      if (a != null) return runs && runs[u] !== undefined ? runs[u] : '{' + u + '}';
      return b != null ? '<' + u + '>' : '</' + u + '>';
    });
  }
  // Übersetzung eines reinen Strings (kein DOM): alert(), Titel, t()-Fallback
  const trMemo = new Map();
  function tr(str) {
    if (st.lang === SRC || typeof str !== 'string' || !str) return str;
    const mk = st.lang + '\u0000' + str;
    if (trMemo.has(mk)) return trMemo.get(mk);
    if (!LET2.test(str)) return str;
    const items = [];
    const u = maskText(str, items);
    const parts = makeParts(u, items);
    const out = outString(parts, st.lang, null);
    if (out === null) return str;                         // wird nachgeladen; nächster Aufruf liefert Treffer
    const s2 = out.replace(/\{(\d+)\}/g, (a, n) => items[+n] ? items[+n].s : a);
    if (trMemo.size > 3000) trMemo.clear();
    trMemo.set(mk, s2);
    return s2;
  }

  // ============================================================
  // 4. Online-Übersetzer
  // ============================================================
  const pending = new Map();   // lang\0key → {lang,key,waiters:Set}
  let inflight = 0, flushTimer = null, flushing = false;
  const failedAt = new Map();

  function request(lang, key, waiter) {
    if (lang === SRC) return;
    const id = lang + '\u0000' + key;
    const fa = failedAt.get(id);
    if (fa && Date.now() - fa < 120000) return;
    let e = pending.get(id);
    if (!e) { e = { lang, key, waiters: new Set() }; pending.set(id, e); }
    if (waiter) e.waiters.add(waiter);
    schedule();
  }
  function schedule() {
    if (flushTimer || flushing) return;
    flushTimer = setTimeout(() => { flushTimer = null; flush(); }, 50);
    emitStatus();
  }

  const breaker = {};
  function bk(name) { return breaker[name] || (breaker[name] = { fails: 0, until: 0 }); }
  function bFail(name, err) { const b = bk(name); b.fails++; b.until = Date.now() + Math.min(600000, 4000 * Math.pow(2, b.fails)); st.error = name + ': ' + (err && err.message || err); }
  function bOk(name) { const b = bk(name); b.fails = 0; b.until = 0; st.provider = name; st.error = ''; }

  async function fetchT(url, opt, ms) {
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), ms || 9000);
    try { return await fetch(url, Object.assign({ signal: ac.signal }, opt || {})); } finally { clearTimeout(to); }
  }
  async function pool(items, n, fn) {
    const out = new Array(items.length); let i = 0;
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
    }));
    return out;
  }
  function decodeEnt(s) {
    return s.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  }

  const PROV = {
    mock: {
      name: 'mock',
      run: async (keys, lang) => {
        const f = window.__AI18N_MOCK;
        const r = await f(keys.slice(), lang);
        return r;
      }
    },
    gcloud: {
      name: 'Google Cloud',
      run: async (keys, lang) => {
        const r = await fetchT('https://translation.googleapis.com/language/translate/v2?key=' + encodeURIComponent(cfg.apiKey), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: keys, source: SRC, target: lang, format: 'text' })
        }, 12000);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const j = await r.json();
        return j.data.translations.map(t => t.translatedText != null ? decodeEnt(t.translatedText) : null);
      }
    },
    libre: {
      name: 'LibreTranslate',
      run: async (keys, lang) => pool(keys, 3, async k => {
        const r = await fetchT(cfg.libreUrl.replace(/\/+$/, '') + '/translate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: k, source: SRC, target: lang, format: 'text', api_key: cfg.libreKey || undefined })
        }, 12000);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const j = await r.json();
        return j.translatedText != null ? j.translatedText : null;
      })
    },
    chrome: {
      name: 'Chrome (lokal)',
      tr: {},
      avail: async function (lang) {
        if (typeof self.Translator === 'undefined' || !self.Translator.create) return false;
        try { const a = await self.Translator.availability({ sourceLanguage: SRC, targetLanguage: lang }); return a === 'available'; }
        catch (e) { return false; }
      },
      run: async function (keys, lang) {
        if (!(await this.avail(lang))) throw new Error('nicht verfügbar');
        let t = this.tr[lang];
        if (!t) t = this.tr[lang] = await self.Translator.create({ sourceLanguage: SRC, targetLanguage: lang });
        const out = [];
        for (const k of keys) out.push(await t.translate(k));
        return out;
      }
    },
    gtx: {
      name: 'Google Translate',
      run: async (keys, lang) => pool(keys, 4, async k => {
        const r = await fetchT('https://translate.googleapis.com/translate_a/single', {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'client=gtx&sl=auto&tl=' + encodeURIComponent(lang) + '&dt=t&q=' + encodeURIComponent(k)
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const j = await r.json();
        if (!j || !Array.isArray(j[0])) throw new Error('unerwartete Antwort');
        return j[0].map(s => (s && s[0]) || '').join('');
      })
    },
    mymemory: {
      name: 'MyMemory',
      run: async (keys, lang) => pool(keys, 3, async k => {
        const pieces = [];
        if (k.length <= 450) pieces.push(k);
        else { let cur = ''; for (const s of k.split(/(?<=[.!?;:])\s+/)) { if ((cur + ' ' + s).length > 450 && cur) { pieces.push(cur); cur = s; } else cur = cur ? cur + ' ' + s : s; } if (cur) pieces.push(cur); }
        const outs = [];
        for (const pc of pieces) {
          const r = await fetchT('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(pc) + '&langpair=' + SRC + '|' + encodeURIComponent(lang));
          if (!r.ok) throw new Error('HTTP ' + r.status);
          const j = await r.json();
          const t = j && j.responseData && j.responseData.translatedText;
          if (!t || j.responseStatus != 200 || /MYMEMORY WARNING|INVALID|QUERY LENGTH/i.test(t)) throw new Error('MyMemory: ' + (j && j.responseDetails || 'Limit'));
          outs.push(decodeEnt(t));
        }
        return outs.join(' ');
      })
    }
  };
  function providers() {
    const l = [];
    if (window.__AI18N_MOCK) l.push(PROV.mock);
    if (!cfg.online) return l;
    if (cfg.apiKey) l.push(PROV.gcloud);
    if (cfg.libreUrl) l.push(PROV.libre);
    l.push(PROV.chrome, PROV.gtx, PROV.mymemory);
    return l;
  }

  function normOut(s) {
    if (typeof s !== 'string') return null;
    s = s.replace(/&lt;\s*(\/?)\s*(\d+)\s*&gt;/g, '<$1$2>').replace(/<\s*\/\s*(\d+)\s*>/g, '</$1>').replace(/<\s*(\d+)\s*>/g, '<$1>').replace(/\{\s*(\d+)\s*\}/g, '{$1}').replace(/［\s*(\d+)\s*］/g, '{$1}');
    return s;
  }
  function valid(src, out) {
    if (out == null) return false;
    out = out.trim();
    if (!out) return false;
    if (tokSig(src) !== tokSig(out)) return false;
    // Wrapper-Reihenfolge: <n> vor </n>
    const seen = new Set();
    let ok = true;
    out.replace(TOK_RE, (a, x, o, c) => { if (o != null) seen.add(o); if (c != null && !seen.has(c)) ok = false; return a; });
    if (!ok) return false;
    if (out.length > src.length * 6 + 40) return false;
    return true;
  }

  async function runProv(p, keys, lang) {
    const res = await p.run(keys, lang);
    return keys.map((k, i) => normOut(res[i]));
  }

  // Übersetzt eine Liste von Schlüsseln mit einer Dienst-Kette. Ergebnis: Map key → Übersetzung
  async function translateKeys(keys, lang) {
    const result = new Map();
    let remaining = keys.slice();
    for (const p of providers()) {
      if (!remaining.length) break;
      const b = bk(p.name);
      if (Date.now() < b.until) continue;
      try {
        // 1. Versuch: ganze Vorlage
        const outs = await runProv(p, remaining, lang);
        bOk(p.name);
        const bad = [];
        remaining.forEach((k, i) => { if (valid(k, outs[i])) result.set(k, outs[i].trim()); else bad.push(k); });
        // 2. Versuch: stückweise zwischen den Platzhaltern
        for (const k of bad) {
          const o = await pieceWise(p, k, lang);
          if (o != null) result.set(k, o);
        }
      } catch (e) { bFail(p.name, e); }
      remaining = remaining.filter(k => !result.has(k));
    }
    return result;
  }
  async function pieceWise(p, key, lang) {
    const toks = key.split(/(\{\d+\}|<\d+>|<\/\d+>)/);
    const idx = [], texts = [];
    toks.forEach((t, i) => {
      if (i % 2 === 1) return;
      const core = t.trim();
      if (core && LET2.test(core)) { idx.push(i); texts.push(core); }
    });
    if (!texts.length) return null;
    const outs = await runProv(p, texts, lang);
    const res = toks.slice();
    for (let j = 0; j < idx.length; j++) {
      const o = outs[j];
      if (o == null || !o.trim() || /[{}<>]/.test(o)) return null;
      const t = toks[idx[j]];
      res[idx[j]] = /^\s*/.exec(t)[0] + o.trim() + /\s*$/.exec(t)[0];
    }
    return res.join('');
  }

  let persistTimer = null;
  function persistSoon(lang) {
    mem(lang).dirty = true;
    if (persistTimer) return;
    persistTimer = setTimeout(() => {
      persistTimer = null;
      for (const l in MEM) {
        const M = MEM[l];
        if (!M.dirty) continue;
        M.dirty = false;
        while (M.cache.size > CACHE_MAX) M.cache.delete(M.cache.keys().next().value);
        lsSet(LS_CACHE(l), JSON.stringify(Object.fromEntries(M.cache)));
      }
    }, 1500);
  }

  async function flush() {
    if (flushing) return;
    flushing = true;
    try {
      while (pending.size) {
        const lang = st.lang;
        await ensureSeed(lang);
        // veraltete Einträge (andere Sprache / inzwischen durch Seed gelöst) bereinigen
        const batch = [];
        for (const [id, e] of pending) {
          if (e.lang !== lang) { pending.delete(id); continue; }
          const v = lookup(lang, e.key);
          if (v !== undefined) { pending.delete(id); notify(e); continue; }
          batch.push(e);
          if (batch.length >= 24) break;
        }
        if (!batch.length) continue;
        inflight += batch.length; emitStatus();
        let res;
        try { res = await translateKeys(batch.map(e => e.key), lang); } catch (e) { res = new Map(); }
        inflight -= batch.length;
        if (st.lang !== lang) { batch.forEach(e => pending.delete(lang + '\u0000' + e.key)); continue; }
        const M = mem(lang);
        for (const e of batch) {
          pending.delete(lang + '\u0000' + e.key);
          const v = res.get(e.key);
          if (v !== undefined) { M.cache.set(e.key, v); M.native.add(v); M.rev.set(v, e.key); addWords(DV, e.key); if (v !== e.key) addWords(tv(lang), v); persistSoon(lang); }
          else failedAt.set(lang + '\u0000' + e.key, Date.now());
        }
        applying++;
        try { for (const e of batch) if (res.has(e.key)) notify(e); } finally { applying--; obs && obs.takeRecords(); }
        emitStatus();
        const anyOk = res.size > 0;
        if (!anyOk) { await new Promise(r => setTimeout(r, 400)); }
      }
    } finally { flushing = false; emitStatus(); }
  }
  function notify(e) { e.waiters.forEach(w => { try { w(); } catch (err) { } }); }

  // ============================================================
  // 5. DOM: Blöcke, Läufe, Datensätze
  // ============================================================
  const BLOCK = new Set('DIV P LI UL OL DL DT DD TABLE THEAD TBODY TFOOT TR TD TH CAPTION H1 H2 H3 H4 H5 H6 SECTION ARTICLE HEADER FOOTER NAV ASIDE FORM FIELDSET LEGEND BUTTON LABEL OPTION OPTGROUP SELECT DETAILS SUMMARY PRE BLOCKQUOTE MAIN HR A HTML HEAD BODY TITLE'.split(' '));
  const OPAQUE_TAG = new Set('SCRIPT STYLE NOSCRIPT SVG CANVAS MATH-FIELD IFRAME TEXTAREA INPUT IMG VIDEO AUDIO OBJECT EMBED CODE KBD SAMP'.split(' '));
  const FORMAT = new Set('B I U EM STRONG SUB SUP SMALL MARK S BIG SPAN FONT'.split(' '));
  const OPAQUE_CLS = /(?:^|\s)(?:ML__\S*|sv-m|ic|notranslate|katex\S*|mathfield\S*)(?:\s|$)/;
  const BLOCK_SEL = 'div,p,li,ul,ol,table,button,select,label,h1,h2,h3,h4,h5,h6,a,pre,details,tr,td';
  const ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];

  const records = new Set();
  const nodeRec = new WeakMap();
  const ownText = new WeakMap();      // Textknoten → erwarteter Inhalt (von uns gesetzt)
  const attrRecs = new WeakMap();     // Element → {attr: {de, shown}}
  const attrEls = new Set();
  const mlRecs = new Map();           // span.ML__text (Formel-Text, z. B. \\text{ausklammern}) → {core, lead, trail, rec}
  let applying = 0, obs = null;

  function isOpaque(el) {
    if (OPAQUE_TAG.has(el.tagName)) return true;
    const cn = el.className;
    if (typeof cn === 'string' && cn && OPAQUE_CLS.test(cn)) return true;
    if (el.getAttribute('translate') === 'no') return true;
    if (el.isContentEditable && el.tagName !== 'BODY') return true;
    return false;
  }
  function plainFormat(el) {
    if (!FORMAT.has(el.tagName)) return false;
    if (el.tagName === 'SPAN') {
      if (el.id || el.className) return false;
      for (const a of el.attributes) if (a.name !== 'style') return false;
      const s = el.getAttribute('style') || '';
      if (/display|position|float|flex|grid/i.test(s)) return false;
    } else if (el.id) return false;
    return true;
  }
  function curatedEl(el) {
    const k = el.getAttribute && el.getAttribute('data-i18n');
    if (!k) return false;
    const L = LANGUAGES[st.lang];
    return !!(L && L[k] !== undefined);
  }

  function serialize(nodes, items) {
    let s = '';
    for (const n of nodes) {
      if (n.nodeType === 3) { s += maskText(n.data, items); continue; }
      if (n.nodeType !== 1) continue;
      if (n.tagName === 'BR') { s += '{' + (items.push({ t: 'node', el: n, br: true }) - 1) + '}'; continue; }
      if (isOpaque(n) || !plainFormat(n) || !LET2.test(n.textContent)) {
        s += '{' + (items.push({ t: 'node', el: n }) - 1) + '}';
      } else {
        const i = items.push({ t: 'wrap', el: n }) - 1;
        s += '<' + i + '>' + serialize(Array.from(n.childNodes), items) + '</' + i + '>';
      }
    }
    return s;
  }

  // Zeichenkette mit Platzhaltern → Liste von DOM-Knoten (oder null bei Fehler)
  function buildNodes(str, items) {
    const root = document.createDocumentFragment();
    const stack = [root];
    let last = 0, m, buf = '';
    const re = new RegExp(TOK_RE.source, 'g');
    const top = () => stack[stack.length - 1];
    const flushTxt = () => { if (buf) { top().appendChild(document.createTextNode(buf)); buf = ''; } };   // benachbarten Text zu EINEM Knoten zusammenfassen
    const addNode = n => { flushTxt(); top().appendChild(n); };
    while ((m = re.exec(str))) {
      buf += str.slice(last, m.index); last = m.index + m[0].length;
      if (m[1] != null) {
        const it = items[+m[1]]; if (!it) return null;
        if (it.t === 'lit') buf += it.s;
        else if (it.t === 'node') addNode(it.el);
        else return null;
      } else if (m[2] != null) {
        const it = items[+m[2]]; if (!it || it.t !== 'wrap') return null;
        const c = it.el.cloneNode(false); addNode(c); stack.push(c);
      } else {
        if (stack.length < 2) return null;
        flushTxt(); stack.pop();
      }
    }
    if (stack.length !== 1) return null;
    buf += str.slice(last);
    flushTxt();
    return root;
  }

  function setDom(rec, want) {
    const first = rec.cur[0];
    const parent = first && first.parentNode;
    if (!parent || !rec.cur.every(n => n.parentNode === parent)) { records.delete(rec); return; }
    // Fall 1: ein einzelner Textknoten, nur Zahlen-/Formel-Platzhalter → Knoten behalten (Referenzen der App bleiben gültig)
    if (rec.cur.length === 1 && rec.cur[0].nodeType === 3 && rec.items.every(it => it.t === 'lit')) {
      const s = want.replace(/\{(\d+)\}/g, (a, n) => rec.items[+n] ? rec.items[+n].s : a);
      const node = rec.cur[0];
      if (node.data !== s) node.data = s;
      ownText.set(node, s);
      rec.shown = want;
      return;
    }
    // Anker, weil der erste alte Knoten selbst ein geschütztes Element sein kann, das beim Aufbau umgehängt wird
    const anchor = document.createComment('');
    parent.insertBefore(anchor, first);
    let frag = buildNodes(want, rec.items);
    if (!frag && want !== rec.german) { want = rec.german; frag = buildNodes(want, rec.items); }
    if (!frag) { parent.removeChild(anchor); return; }
    const nodes = Array.from(frag.childNodes);
    const keep = new Set(nodes);
    parent.insertBefore(frag, anchor);
    parent.removeChild(anchor);
    rec.cur.forEach(n => { if (n.parentNode === parent && !keep.has(n)) parent.removeChild(n); });
    rec.cur = nodes; rec.shown = want;
    nodes.forEach(n => { nodeRec.set(n, rec); if (n.nodeType === 3) ownText.set(n, n.data); else if (n.nodeType === 1) translateAttrs(n); });
    // geschützte Elemente mit eigenem Text separat behandeln
    rec.items.forEach(it => { if (it.t === 'node' && it.el.nodeType === 1 && !it.br && LET2.test(it.el.textContent)) walk(it.el); });
  }

  function applyRec(rec) {
    if (!rec.cur[0] || !rec.cur[0].parentNode) { records.delete(rec); return; }
    let out = null;
    if (st.lang !== SRC) out = outString(rec.parts, st.lang, rec.waiter);
    const want = out !== null ? out : rec.german;
    if (rec.shown === want && rec.shownLang === st.lang) return;
    rec.shownLang = st.lang;
    setDom(rec, want);
  }

  function handleRun(nodes) {
    let txt = '';
    for (const n of nodes) txt += n.textContent;
    if (!LET2.test(txt)) { return; }
    const items = [];
    const u = serialize(nodes, items);
    const parts = makeParts(u, items);
    if (!parts.some(p => typeof p !== 'string' && p.tr)) {
      // nichts zu übersetzen im Block selbst; geschützte Kinder mit Text trotzdem prüfen
      items.forEach(it => { if (it.t === 'node' && it.el.nodeType === 1 && !it.br && !isOpaque(it.el) && LET2.test(it.el.textContent)) walk(it.el); });
      return;
    }
    const rec = { items, parts, german: u, cur: nodes.slice(), shown: u, shownLang: SRC, waiter: null };
    rec.waiter = () => { if (records.has(rec)) { applying++; try { applyRec(rec); } finally { applying--; } } };
    records.add(rec);
    nodes.forEach(n => nodeRec.set(n, rec));
    if (records.size > 4000) pruneRecords();
    applyRec(rec);
    // Kinder-Elemente (geschützt, mit Text) einzeln bearbeiten, falls applyRec sie nicht neu gebaut hat
    if (rec.shown === u) items.forEach(it => { if (it.t === 'node' && it.el.nodeType === 1 && !it.br && !isOpaque(it.el) && LET2.test(it.el.textContent)) walk(it.el); });
  }
  function pruneRecords() {
    for (const r of records) if (!r.cur[0] || !r.cur[0].isConnected) records.delete(r);
  }

  function runMatchesRec(run) {
    const r = nodeRec.get(run[0]);
    if (!r || !records.has(r) || r.cur.length !== run.length) return false;
    for (let i = 0; i < run.length; i++) if (r.cur[i] !== run[i]) return false;
    // Textknoten unverändert?
    for (const n of run) if (n.nodeType === 3 && ownText.has(n) && ownText.get(n) !== n.data) return false;
    return true;
  }

  function dropOrRestore(rec) {
    const n = rec.cur[0];
    // Die App hat den von uns gesetzten Text selbst überschrieben → neuer deutscher Text, nichts zurücksetzen
    if (rec.cur.length === 1 && n && n.nodeType === 3 && ownText.has(n) && ownText.get(n) !== n.data) {
      records.delete(rec); nodeRec.delete(n); return;
    }
    restoreGerman(rec);
  }
  function restoreGerman(rec) {
    if (!rec.cur[0] || !rec.cur[0].parentNode) { records.delete(rec); return; }
    rec.shownLang = SRC;
    setDom(rec, rec.german);
    records.delete(rec);
    rec.cur.forEach(n => nodeRec.delete(n));
  }

  // Kinder eines Containers in Läufe zerlegen und verarbeiten (shallow = nicht in Block-Kinder absteigen)
  function walk(el, shallow) {
    if (el.nodeType !== 1) return;
    translateAttrs(el);
    if (isOpaque(el)) return;
    if (curatedEl(el)) return;
    for (let pass = 0; pass < 2; pass++) {
      const runs = []; const blocks = [];
      let cur = [];
      const flush = () => { if (cur.length) { runs.push(cur); cur = []; } };
      for (const c of Array.from(el.childNodes)) {
        if (c.nodeType === 3) { cur.push(c); continue; }
        if (c.nodeType !== 1) { flush(); continue; }
        translateAttrs(c);
        if (isOpaque(c)) { cur.push(c); continue; }
        if (BLOCK.has(c.tagName) || c.querySelector(BLOCK_SEL)) { flush(); blocks.push(c); continue; }
        cur.push(c);
      }
      flush();
      // gemischte Läufe (teils schon übersetzt) zuerst auf Deutsch zurücksetzen
      let mixed = false;
      for (const run of runs) {
        if (runMatchesRec(run)) continue;
        const recs = new Set();
        for (const n of run) { const r = nodeRec.get(n); if (r && records.has(r)) recs.add(r); }
        if (recs.size) { recs.forEach(dropOrRestore); mixed = true; }
      }
      if (mixed && pass === 0) continue;
      for (const run of runs) {
        if (runMatchesRec(run)) continue;
        handleRun(run);
      }
      if (!shallow) for (const b of blocks) walk(b, false);
      break;
    }
  }

  // ---------- Attribute ----------
  function translateAttrs(el) {
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const k = el.getAttribute('data-i18n-' + a);
      if (k) { const L = LANGUAGES[st.lang]; if (L && L[k] !== undefined) continue; }
      const val = el.getAttribute(a);
      if (!val || !LET2.test(val)) continue;
      let m = attrRecs.get(el);
      let r = m && m[a];
      if (r && r.shown === val) { applyAttr(el, a, r); continue; }
      const items = [];
      const u = maskText(val, items);
      const parts = makeParts(u, items);
      if (!parts.some(p => typeof p !== 'string' && p.tr)) continue;
      r = { items, parts, german: val, shown: val };
      r.waiter = () => { if (el.isConnected || true) { applying++; try { applyAttr(el, a, r); } finally { applying--; } } };
      if (!m) { m = {}; attrRecs.set(el, m); }
      m[a] = r; attrEls.add(el);
      applyAttr(el, a, r);
    }
  }
  function applyAttr(el, a, r) {
    let out = null;
    if (st.lang !== SRC) out = outString(r.parts, st.lang, r.waiter);
    let want;
    if (out === null) want = r.german;
    else want = out.replace(/\{(\d+)\}/g, (x, n) => r.items[+n] ? r.items[+n].s : x);
    if (el.getAttribute(a) !== want) el.setAttribute(a, want);
    r.shown = want;
  }

  // ---------- Text innerhalb gerenderter Formeln (\\text{…} → <span class="ML__text">) ----------
  // Die Formel selbst bleibt unangetastet; nur reine Textstücke (ohne Kindelemente) werden übersetzt.
  function mlTextOne(sp) {
    if (sp.childNodes.length !== 1 || sp.firstChild.nodeType !== 3) { mlRecs.delete(sp); return; }
    const node = sp.firstChild;
    let m = mlRecs.get(sp);
    if (m && m.node === node && node.data === m.shownFull) { applyMl(sp, m); return; }
    const full = node.data;
    if (!LET2.test(full)) return;
    const lead = full.match(/^\s*/)[0], trail = full.match(/\s*$/)[0];
    const core = full.slice(lead.length, full.length - trail.length);
    const items = [];
    const u = maskText(core, items);
    const parts = makeParts(u, items);
    if (!parts.some(p => typeof p !== 'string' && p.tr)) return;
    m = { node, lead, trail, german: core, items, parts, shownFull: full };
    m.waiter = () => { if (sp.isConnected && mlRecs.get(sp) === m) { applying++; try { applyMl(sp, m); } finally { applying--; } } };
    mlRecs.set(sp, m);
    applyMl(sp, m);
  }
  function applyMl(sp, m) {
    let out = null;
    if (st.lang !== SRC) out = outString(m.parts, st.lang, m.waiter);
    const core = out === null ? m.german : out.replace(/\{(\d+)\}/g, (x, n) => m.items[+n] ? m.items[+n].s : x);
    const full = m.lead + core + m.trail;
    if (m.node.data !== full) m.node.data = full;
    m.shownFull = full;
  }
  function mlTexts(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.classList && root.classList.contains('ML__text')) mlTextOne(root);
    if (!root.querySelectorAll) return;
    root.querySelectorAll('.ML__text').forEach(mlTextOne);
  }

  // ============================================================
  // 6. Beobachter
  // ============================================================
  function containerOf(node) {
    let p = node.nodeType === 1 ? node : node.parentNode;
    while (p && p.nodeType === 1 && p !== document.body && plainFormat(p) && p.parentNode && p.parentNode.nodeType === 1) p = p.parentNode;
    return p;
  }
  function inOpaque(el) {
    for (let p = el; p && p.nodeType === 1; p = p.parentNode) if (isOpaque(p)) return true;
    return false;
  }
  function onMutations(muts) {
    if (applying || st.lang === SRC) return;
    const shallow = new Set(), full = new Set(), attrs = new Set(), mlAdd = new Set();
    for (const m of muts) {
      if (m.type === 'childList') {
        const t = m.target; if (t.nodeType !== 1) continue;
        if (inOpaque(t)) { m.addedNodes.forEach(n => { if (n.nodeType === 1) mlAdd.add(n); }); continue; }
        shallow.add(containerOf(t));
        m.addedNodes.forEach(n => { if (n.nodeType === 1) { full.add(n); mlAdd.add(n); } });
      } else if (m.type === 'characterData') {
        const n = m.target;
        if (ownText.has(n) && ownText.get(n) === n.data) continue;
        const p = n.parentNode; if (!p || p.nodeType !== 1 || inOpaque(p)) continue;
        shallow.add(containerOf(p));
      } else if (m.type === 'attributes') {
        attrs.add(m.target);
      }
    }
    applying++;
    try {
      shallow.forEach(c => { if (c.isConnected) walk(c, true); });
      full.forEach(n => { if (n.isConnected && !inOpaque(n)) walk(n, false); });
      attrs.forEach(e => { if (e.isConnected) translateAttrs(e); });
      mlAdd.forEach(n => { if (n.isConnected) mlTexts(n); });
    } finally { applying--; obs.takeRecords(); }
  }

  function startObserver() {
    if (obs) return;
    obs = new MutationObserver(onMutations);
    obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  // ============================================================
  // 7. Sprachwechsel
  // ============================================================
  function refreshAll() {
    if (st.lang === SRC) { restoreAll(); return; }
    applying++;
    try {
      pruneRecords();
      for (const r of Array.from(records)) applyRec(r);
      for (const el of Array.from(attrEls)) {
        if (!el.isConnected) { attrEls.delete(el); continue; }
        const m = attrRecs.get(el); if (!m) continue;
        for (const a in m) { if (el.getAttribute(a) === m[a].shown || true) applyAttr(el, a, m[a]); }
      }
      for (const [sp, m] of Array.from(mlRecs)) { if (!sp.isConnected) mlRecs.delete(sp); else applyMl(sp, m); }
      walk(document.documentElement, false);
      mlTexts(document.body);
    } finally { applying--; obs && obs.takeRecords(); }
    emitStatus();
  }
  function restoreAll() {
    applying++;
    try {
      for (const r of Array.from(records)) restoreGerman(r);
      for (const el of Array.from(attrEls)) {
        const m = attrRecs.get(el); if (!m) continue;
        for (const a in m) { if (el.getAttribute(a) === m[a].shown) el.setAttribute(a, m[a].german); }
        attrRecs.delete(el);
      }
      attrEls.clear();
      for (const [sp, m] of Array.from(mlRecs)) { if (sp.isConnected && sp.firstChild === m.node && m.node.data === m.shownFull) m.node.data = m.lead + m.german + m.trail; }
      mlRecs.clear();
    } finally { applying--; obs && obs.takeRecords(); }
    trMemo.clear();
  }
  function setLanguage(lang) {
    st.lang = lang;
    try { document.documentElement.lang = lang; } catch (e) {}
    try { if (typeof MathfieldElement !== 'undefined') MathfieldElement.locale = lang; } catch (e) {}   // MathLive: eigene Tooltips/Tastatur-Texte (de, fr, es, it, pl, el; sonst Englisch)
    lsSet(LS_LANG, lang);
    trMemo.clear(); pending.clear(); failedAt.clear();
    startObserver();
    if (lang === SRC) { restoreAll(); emitStatus(); return; }
    prepareLang(lang);
    refreshAll();                                   // sofort (handgepflegt + Cache)
    ensureSeed(lang).then(() => { if (st.lang === lang) { trMemo.clear(); refreshAll(); } });
  }

  // ============================================================
  // 8. Einstellungen / Werkzeuge
  // ============================================================
  function setOnline(b) { cfg.online = !!b; saveCfg(); Object.keys(breaker).forEach(k => delete breaker[k]); failedAt.clear(); if (st.lang !== SRC) refreshAll(); emitStatus(); }
  function setApiKey(k) { cfg.apiKey = (k || '').trim(); saveCfg(); Object.keys(breaker).forEach(x => delete breaker[x]); failedAt.clear(); if (st.lang !== SRC) refreshAll(); }
  function exportCache(lang) {
    lang = lang || st.lang;
    const M = mem(lang);
    const o = {}; M.cache.forEach((v, k) => { o[k] = v; });
    const blob = new Blob([JSON.stringify({ lang, entries: o }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'i18n_cache_' + lang + '.json';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    return Object.keys(o).length;
  }
  function clearCache() {
    for (const l in MEM) { MEM[l].cache.clear(); lsDel(LS_CACHE(l)); MEM[l].prepared = false; MEM[l].cur.clear(); MEM[l].rev.clear(); MEM[l].native.clear(); MEM[l].seedRevDone = false; if (MEM[l].seed) seedRev(l); }
    failedAt.clear(); trMemo.clear();
    if (st.lang !== SRC) { prepareLang(st.lang); refreshAll(); }
  }
  function addSeed(lang, obj) {
    window.I18N_SEEDS = window.I18N_SEEDS || {};
    window.I18N_SEEDS[lang] = Object.assign(window.I18N_SEEDS[lang] || {}, obj);
    const M = mem(lang); M.seed = window.I18N_SEEDS[lang]; M.seedRevDone = false; seedRev(lang);
    M.seedLoaded = true; seedState[lang] = Promise.resolve();
  }

  // ---------- alert / confirm / prompt ----------
  ['alert', 'confirm', 'prompt'].forEach(fn => {
    const orig = window[fn];
    if (typeof orig !== 'function') return;
    window[fn] = function (msg, def) { return orig.call(window, typeof msg === 'string' ? tr(msg) : msg, def); };
  });

  window.AI18N = {
    setLanguage, tr, refresh: refreshAll, setOnline, setApiKey, exportCache, clearCache, addSeed, status,
    onStatus: f => { statusListeners.push(f); },
    cfg,
    savedLang: () => lsGet(LS_LANG),
    // nur für Tests
    _t: { resolveSeg, lookup, regerman, looksTarget, request, failedAt, MEM, records, pending, PROV, breaker, st, canonString, maskText, makeParts, valid, normOut, translateKeys, flush: () => flush(), whenIdle: async () => { for (let i = 0; i < 400 && (pending.size || inflight || flushing || flushTimer); i++) await new Promise(r => setTimeout(r, 25)); } }
  };

  // ---------- Einstellungs-Zeilen (Menü ⚙) ----------
  function renderStatus(s) {
    const el = document.getElementById('autotr-status');
    if (!el) return;
    const esc = x => String(x).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    let h;
    if (s.lang === SRC) h = 'Anzeige in der Originalsprache (Deutsch).';
    else if (s.pending > 0) h = 'Übersetzung läuft … (' + s.pending + ' offen)';
    else if (s.error && s.online) h = 'Online-Übersetzer nicht erreichbar – es gelten die mitgelieferten Übersetzungen.';
    else if (!s.online) h = 'Online-Übersetzung ist aus – es gelten die mitgelieferten Übersetzungen.';
    else if (s.provider) h = 'Zuletzt genutzt: <span translate="no">' + esc(s.provider) + '</span>';
    else h = 'Übersetzung bereit.';
    if (el.getAttribute('data-src') !== h) { el.setAttribute('data-src', h); el.innerHTML = h; }
  }
  function initSettingsUI() {
    const c = document.getElementById('autotr-online'); if (c) c.checked = !!cfg.online;
    const k = document.getElementById('autotr-key'); if (k) k.value = cfg.apiKey || '';
    statusListeners.push(renderStatus);
    renderStatus(status());
  }
  window.AI18N_renderStatus = renderStatus;

  // Start: gespeicherte Sprache wiederherstellen
  function boot() {
    startObserver();
    initSettingsUI();
    const saved = lsGet(LS_LANG);
    if (typeof LANGUAGES === 'undefined' || typeof setLang !== 'function') return;
    // Gespeicherte Sprache wiederherstellen; auch für Deutsch einmal anwenden (setzt die Tooltips/Titel der Oberfläche)
    setLang(saved && LANGUAGES[saved] ? saved : SRC);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
