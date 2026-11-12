let saveQueue = []; // itens pendentes de salvar: { type: 'file'|'result', data }
let libraryItems = [];

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${tab}`));
  if (tab === 'library') renderLibrary();
}

function buildQuery() {
  const query = document.getElementById('search-query').value.trim();
  const artist = document.getElementById('search-artist').value.trim();
  return artist ? `${query} ${artist}` : query;
}

function openNextFromQueue() {
  if (!saveQueue.length) return;
  document.getElementById('save-title').value = document.getElementById('search-query').value;
  document.getElementById('save-artist').value = document.getElementById('search-artist').value;
  fillTagSelect();
  document.getElementById('save-status').value = 'quero aprender';
  document.getElementById('save-modal').hidden = false;
}

const NEW_TAG = '__new__';
function fillTagSelect(selId = 'save-tag-select', inputId = 'save-tag') {
  const sel = document.getElementById(selId);
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  sel.innerHTML = '<option value="">Sem pasta</option>' +
    Library.allTags(libraryItems).map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('') +
    `<option value="${NEW_TAG}">➕ Criar nova pasta...</option>`;
  sel.value = '';
  const input = document.getElementById(inputId);
  input.value = '';
  input.hidden = true;
}

// ---- Edição de partitura salva ----
let editingId = null;
function openEditModal(id) {
  const item = libraryItems.find((i) => i.id === id);
  if (!item) return;
  editingId = id;
  document.getElementById('edit-title').value = item.title || '';
  document.getElementById('edit-artist').value = item.artist || '';
  fillTagSelect('edit-tag-select', 'edit-tag');
  const sel = document.getElementById('edit-tag-select');
  if (item.tag) {
    if (![...sel.options].some((o) => o.value === item.tag)) {
      const opt = new Option(item.tag, item.tag);
      sel.insertBefore(opt, sel.options[sel.options.length - 1]);
    }
    sel.value = item.tag;
  }
  document.getElementById('edit-status').value = item.status || 'quero aprender';
  document.getElementById('edit-modal').hidden = false;
}

function setupEditModal() {
  document.getElementById('edit-cancel').onclick = () => {
    document.getElementById('edit-modal').hidden = true;
  };
  document.getElementById('edit-confirm').onclick = async () => {
    const title = document.getElementById('edit-title').value.trim();
    if (!title) return alert('O nome da música não pode ficar vazio.');
    const v = document.getElementById('edit-tag-select').value;
    const tag = v === NEW_TAG ? document.getElementById('edit-tag').value.trim() : v;
    try {
      const item = await DB.get(editingId);
      item.title = title;
      item.artist = document.getElementById('edit-artist').value.trim();
      item.tag = tag;
      item.status = document.getElementById('edit-status').value;
      await DB.update(item);
      Viewer.title = item.title;
      const pos = Viewer.items.findIndex((i) => i.id === item.id);
      if (pos >= 0) Viewer.items[pos] = item;
    } catch (err) {
      return alert('Não foi possível salvar as alterações.');
    }
    document.getElementById('edit-modal').hidden = true;
    renderLibrary();
  };
}

// ---- Importação em massa ----
let bulkFiles = [];
function openBulkModal(files) {
  bulkFiles = files;
  document.getElementById('bulk-count').textContent = `${files.length} imagens selecionadas`;
  fillTagSelect('bulk-tag-select', 'bulk-tag');
  document.getElementById('bulk-status').value = 'quero aprender';
  document.getElementById('bulk-progress').textContent = '';
  document.getElementById('bulk-confirm').disabled = false;
  document.getElementById('bulk-modal').hidden = false;
}

// Reduz a imagem (lado maior 1800px, JPEG) para não estourar o armazenamento do tablet.
function shrinkImage(file, maxSide = 1800) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

function setupBulkImport() {
  document.getElementById('bulk-cancel').onclick = () => {
    document.getElementById('bulk-modal').hidden = true;
    bulkFiles = [];
  };
  document.getElementById('bulk-confirm').onclick = async () => {
    const v = document.getElementById('bulk-tag-select').value;
    const tag = v === NEW_TAG ? document.getElementById('bulk-tag').value.trim() : v;
    const status = document.getElementById('bulk-status').value;
    const btn = document.getElementById('bulk-confirm');
    const progress = document.getElementById('bulk-progress');
    btn.disabled = true;
    let ok = 0, failed = 0;
    for (let i = 0; i < bulkFiles.length; i++) {
      progress.textContent = `Importando ${i + 1} de ${bulkFiles.length}...`;
      const file = bulkFiles[i];
      try {
        const dataUrl = await shrinkImage(file);
        if (!dataUrl) throw new Error('imagem inválida');
        await Library._save(dataUrl, {
          title: file.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim() || 'Sem título',
          artist: '', tag, status
        });
        ok++;
      } catch (err) {
        failed++;
      }
    }
    bulkFiles = [];
    document.getElementById('bulk-modal').hidden = true;
    if (failed) alert(`${ok} importada(s). ${failed} não puderam ser importadas.`);
    switchTab('library');
  };
}

// ---- Botão X nos campos de texto ----
function setupClearButtons() {
  document.querySelectorAll('input[type="text"]').forEach((input) => {
    if (!input.placeholder) input.placeholder = ' ';
    const wrap = document.createElement('span');
    wrap.className = 'clearable';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'clear-btn';
    btn.setAttribute('aria-label', 'Apagar texto');
    btn.textContent = '✕';
    btn.onclick = () => {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
    };
    wrap.appendChild(btn);
  });
}

let previewResult = null;
function openPreview(r) {
  previewResult = r;
  const img = document.getElementById('preview-img');
  img.onerror = () => { if (img.src !== r.thumbnail) img.src = r.thumbnail; };
  img.src = r.fullImage || r.thumbnail;
  document.getElementById('preview-modal').hidden = false;
}

function renderResults(results) {
  const grid = document.getElementById('search-results');
  grid.innerHTML = '';
  if (!results.length) {
    document.getElementById('search-status').textContent = 'Nenhuma partitura encontrada. Tente outro nome, ou use os botões abaixo.';
    return;
  }
  document.getElementById('search-status').textContent = `${results.length} resultado(s) — toque para ampliar`;
  for (const r of results) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<img src="${r.thumbnail}" loading="lazy"><div class="card-label">${r.title || ''}</div>`;
    card.onclick = () => openPreview(r);
    grid.appendChild(card);
  }
}

async function updateUsageCounter() {
  const el = document.getElementById('usage-counter');
  const usage = await Search.usage();
  if (!usage || usage.limit == null) { el.textContent = ''; return; }
  el.textContent = `Buscas usadas este mês: ${usage.used}/${usage.limit}`;
  const left = usage.left ?? (usage.limit - usage.used);
  el.classList.toggle('warn', left <= 10);
  const submitBtn = document.querySelector('#search-form button[type="submit"]');
  if (left <= 0) {
    el.textContent += ' — limite atingido, use os botões abaixo';
    submitBtn.disabled = true;
  } else {
    submitBtn.disabled = false;
  }
}

async function renderLibrary() {
  libraryItems = await Library.getAll();
  const tagSelect = document.getElementById('lib-filter-tag');
  const currentTag = tagSelect.value;
  tagSelect.innerHTML = '<option value="">Todas as pastas</option>' +
    Library.allTags(libraryItems).map((t) => `<option value="${t}">${t}</option>`).join('');
  tagSelect.value = currentTag;
  applyLibraryFilter();
}

function applyLibraryFilter() {
  const text = document.getElementById('lib-search').value;
  const tag = document.getElementById('lib-filter-tag').value;
  const status = document.getElementById('lib-filter-status').value;
  const filtered = Library.filter(libraryItems, text, tag, status);
  const grid = document.getElementById('library-results');
  grid.innerHTML = '';
  document.getElementById('library-empty').hidden = libraryItems.length > 0;

  for (const item of filtered) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <span class="fav-star">${item.favorite ? '⭐' : ''}</span>
      <img src="${item.image}">
      <div class="card-label">${item.title}${item.artist ? ' - ' + item.artist : ''}</div>
      <div class="card-tag">${item.tag ? item.tag + ' · ' : ''}${item.status}</div>`;
    card.onclick = (e) => Viewer.open(filtered, filtered.indexOf(item));
    card.oncontextmenu = (e) => { e.preventDefault(); showItemMenu(item); };
    grid.appendChild(card);
  }
}

function showItemMenu(item) {
  const fav = confirm(`"${item.title}"\n\nOK = favoritar/desfavoritar\nCancelar = apagar da biblioteca`);
  if (fav) {
    Library.toggleFavorite(item.id).then(renderLibrary);
  } else if (confirm('Apagar esta partitura da biblioteca?')) {
    DB.remove(item.id).then(renderLibrary);
  }
}

function setupVoiceSearch() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const btn = document.getElementById('voice-btn');
  if (!Recognition) { btn.hidden = true; return; }
  btn.onclick = () => {
    const rec = new Recognition();
    rec.lang = 'pt-BR';
    btn.textContent = '🔴';
    rec.onresult = (e) => {
      document.getElementById('search-query').value = e.results[0][0].transcript;
      btn.textContent = '🎤';
    };
    rec.onerror = () => { btn.textContent = '🎤'; };
    rec.onend = () => { btn.textContent = '🎤'; };
    rec.start();
  };
}

function init() {
  Viewer.init();
  setupVoiceSearch();

  document.querySelectorAll('.tab-btn').forEach((b) => b.onclick = () => switchTab(b.dataset.tab));

  document.getElementById('search-form').onsubmit = async (e) => {
    e.preventDefault();
    const query = document.getElementById('search-query').value.trim();
    const artist = document.getElementById('search-artist').value.trim();
    document.getElementById('search-status').textContent = 'Buscando...';
    document.getElementById('search-results').innerHTML = '';
    try {
      const results = await Search.run(query, artist);
      renderResults(results);
    } catch (err) {
      document.getElementById('search-status').textContent = err.message;
    }
    updateUsageCounter();
  };

  document.getElementById('open-musescore').onclick = () => {
    const q = buildQuery();
    if (!q) return alert('Digite o nome da música primeiro.');
    window.open(`https://musescore.com/sheetmusic?text=${encodeURIComponent(q)}`, '_blank');
  };

  document.getElementById('open-google').onclick = () => {
    const q = buildQuery();
    if (!q) return alert('Digite o nome da música primeiro.');
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent('partitura ' + q)}`, '_blank');
  };

  document.getElementById('add-from-gallery').onclick = () => {
    document.getElementById('gallery-input').click();
  };
  document.getElementById('gallery-input').onchange = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length > 1) return openBulkModal(files);
    saveQueue.push(...files.map((file) => ({ type: 'file', data: file })));
    openNextFromQueue();
  };

  setupEditModal();
  for (const [selId, inputId] of [['save-tag-select', 'save-tag'], ['bulk-tag-select', 'bulk-tag'], ['edit-tag-select', 'edit-tag']]) {
    document.getElementById(selId).onchange = (e) => {
      const input = document.getElementById(inputId);
      input.hidden = e.target.value !== NEW_TAG;
      if (!input.hidden) input.focus();
    };
  }
  setupBulkImport();
  setupClearButtons();
  document.getElementById('preview-cancel').onclick = () => {
    document.getElementById('preview-modal').hidden = true;
  };
  document.getElementById('preview-save').onclick = () => {
    document.getElementById('preview-modal').hidden = true;
    saveQueue.push({ type: 'result', data: previewResult });
    openNextFromQueue();
  };

  document.getElementById('save-cancel').onclick = () => {
    saveQueue.shift();
    document.getElementById('save-modal').hidden = true;
    openNextFromQueue();
  };
  document.getElementById('save-confirm').onclick = async () => {
    const pending = saveQueue.shift();
    const meta = {
      title: document.getElementById('save-title').value.trim(),
      artist: document.getElementById('save-artist').value.trim(),
      tag: (() => {
        const v = document.getElementById('save-tag-select').value;
        return v === NEW_TAG ? document.getElementById('save-tag').value.trim() : v;
      })(),
      status: document.getElementById('save-status').value
    };
    document.getElementById('save-modal').hidden = true;
    try {
      if (pending?.type === 'file') await Library.saveFromFile(pending.data, meta);
      if (pending?.type === 'result') await Library.saveFromResult(pending.data, meta);
    } catch (err) {
      alert(err.message);
    }
    if (saveQueue.length) {
      openNextFromQueue();
    } else {
      switchTab('library');
    }
  };

  updateUsageCounter();

  document.getElementById('lib-search').oninput = applyLibraryFilter;
  document.getElementById('lib-filter-tag').onchange = applyLibraryFilter;
  document.getElementById('lib-filter-status').onchange = applyLibraryFilter;
  Library.getAll().then((items) => { libraryItems = items; });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
