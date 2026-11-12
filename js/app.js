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
  document.getElementById('save-tag').value = '';
  document.getElementById('save-status').value = 'quero aprender';
  document.getElementById('save-modal').hidden = false;
}

function renderResults(results) {
  const grid = document.getElementById('search-results');
  grid.innerHTML = '';
  if (!results.length) {
    document.getElementById('search-status').textContent = 'Nenhuma partitura encontrada. Tente outro nome, ou use os botões abaixo.';
    return;
  }
  document.getElementById('search-status').textContent = `${results.length} resultado(s) — toque para salvar`;
  for (const r of results) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<img src="${r.thumbnail}" loading="lazy"><div class="card-label">${r.title || ''}</div>`;
    card.onclick = () => {
      saveQueue.push({ type: 'result', data: r });
      openNextFromQueue();
    };
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
  const filtered = Library.filter(libraryItems, text, tag);
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
      <div class="card-tag">${item.tag || item.status}</div>`;
    card.onclick = (e) => Viewer.open(item.image);
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
    saveQueue.push(...files.map((file) => ({ type: 'file', data: file })));
    e.target.value = '';
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
      tag: document.getElementById('save-tag').value.trim(),
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

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
