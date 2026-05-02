// ═══════════════════════════════════════════════════════════════════
// MODUL: io — Speichern & Laden von Plot-Dateien
// Enthält:  savePlotFile(), loadPlotFile(), handleFileDrop()
//           savePlotLocal(), renderSavedList(), loadPlotLocal()
// Ändern:  Dateiformat → serializePlot() / deserializePlot()
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// SPEICHERN / LADEN
// ═══════════════════════════════════════════════════════════════════

// ── Datei-basiert (Download / File-Input) ──────────────────────────

// Speichert den aktuellen Zustand als .plotter-Datei auf dem Computer
function savePlotFile() {
  const name = (document.getElementById('save-name').value.trim() || 'plot');
  const data = JSON.stringify({ v: 1, state: captureState() }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name.endsWith('.plotter') ? name : name + '.plotter';
  a.click(); URL.revokeObjectURL(a.href);
  showSaveMsg(`✓ "${a.download}" heruntergeladen.`, '#1D9E75');
}

// Lädt eine .plotter-Datei vom Computer (via File-Input oder Drag & Drop)
function loadPlotFile(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      const state = parsed.state || parsed; // Rückwärtskompatibilität
      pushHistory();
      applyState(state);
      pushHistory();
      showSaveMsg(`✓ "${file.name}" geladen.`, '#378ADD');
    } catch { showSaveMsg('Fehler: ungültige Datei.', '#e24b4a'); }
    input.value = ''; // zurücksetzen damit dieselbe Datei nochmals geladen werden kann
  };
  reader.readAsText(file);
}

// Drag & Drop auf den Canvas: .plotter-Datei direkt reinziehen
document.getElementById('canvas-wrap').addEventListener('dragover', e => e.preventDefault());
document.getElementById('canvas-wrap').addEventListener('drop', e => {
  e.preventDefault(); handleFileDrop(e);
});

function handleFileDrop(e) {
  const file = e.dataTransfer?.files[0] || e.target?.files[0];
  if (!file) return;
  readPlotterFile(file);
}

function readPlotterFile(file) {
  if (!file.name.endsWith('.plotter') && !file.name.endsWith('.json')) {
    showSaveMsg('Nur .plotter/.json-Dateien.', '#e24b4a'); return;
  }
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const parsed = JSON.parse(ev.target.result);
      const state = parsed.state || parsed;
      pushHistory(); applyState(state); pushHistory();
      showSaveMsg(`✓ "${file.name}" geladen.`, '#378ADD');
    } catch { showSaveMsg('Fehler: ungültige Datei.', '#e24b4a'); }
  };
  reader.readAsText(file);
}

// ── Browser-lokaler Speicher (localStorage) ────────────────────────

const SAVE_KEY = 'plotter_saves_v1';

function getSaves() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); } catch { return {}; }
}

function savePlotLocal() {
  const name = document.getElementById('save-name-local').value.trim();
  if (!name) { showSaveMsg('Bitte einen Namen eingeben.', '#e24b4a'); return; }
  const saves = getSaves();
  saves[name] = captureState();
  localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
  showSaveMsg(`✓ "${name}" gespeichert.`, '#1D9E75');
  renderSavedList();
}

// Lädt einen gespeicherten Plot aus localStorage
function loadPlot(name) {
  const saves = getSaves();
  if (!saves[name]) return;
  pushHistory();
  applyState(saves[name]);
  pushHistory();
  showSaveMsg(`"${name}" geladen.`, '#378ADD');
}

function deleteSave(name) {
  const saves = getSaves();
  delete saves[name];
  localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
  renderSavedList();
}

function showSaveMsg(txt, col) {
  const m = document.getElementById('save-msg');
  m.textContent = txt; m.style.color = col;
  setTimeout(() => m.textContent = '', 3500);
}

function renderSavedList() {
  const el = document.getElementById('saved-list');
  const saves = getSaves();
  const names = Object.keys(saves);
  if (!names.length) { el.innerHTML = '<span style="color:#9ca3af;">Noch keine Slots.</span>'; return; }
  el.innerHTML = '';
  names.forEach(name => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:4px;margin-bottom:4px;';
    const lbl = document.createElement('span');
    lbl.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;color:#378ADD;';
    lbl.textContent = name; lbl.title = 'Laden: ' + name;
    lbl.onclick = () => loadPlot(name);
    const dl = document.createElement('button');
    dl.className = 'del-btn'; dl.textContent = '⬇'; dl.title = 'Als Datei exportieren';
    dl.onclick = () => {
      const saves2 = getSaves();
      const data = JSON.stringify({ v:1, state: saves2[name] }, null, 2);
      const blob = new Blob([data], { type:'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = name + '.plotter'; a.click(); URL.revokeObjectURL(a.href);
    };
    const del = document.createElement('button');
    del.className = 'del-btn'; del.textContent = '✕'; del.title = t('title_del_pt');
    del.onclick = () => { if (confirm(`"${name}" löschen?`)) deleteSave(name); };
    row.append(lbl, dl, del); el.appendChild(row);
  });
}

