let fileQueue = [];
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
  if (!fileQueue.length) return;
  document.getElementById('save-title').value = document.getElementById('search-query').value;
  document.getElementById('save-artist').value = document.getElementById('search-artist').value;
  document.getElementById('save-tag').value = '';
  document.getElementById('save-status').value = 'quero aprender';
  document.getElementById('save-modal').hidden = false;
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

  document.getElementById('search-form').onsubmit = (e) => e.preventDefault();

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
    fileQueue = Array.from(e.target.files || []);
    e.target.value = '';
    openNextFromQueue();
  };

  document.getElementById('save-cancel').onclick = () => {
    fileQueue.shift();
    document.getElementById('save-modal').hidden = true;
    openNextFromQueue();
  };
  document.getElementById('save-confirm').onclick = async () => {
    const file = fileQueue.shift();
    const meta = {
      title: document.getElementById('save-title').value.trim(),
      artist: document.getElementById('save-artist').value.trim(),
      tag: document.getElementById('save-tag').value.trim(),
      status: document.getElementById('save-status').value
    };
    document.getElementById('save-modal').hidden = true;
    if (file) await Library.saveFromFile(file, meta);
    if (fileQueue.length) {
      openNextFromQueue();
    } else {
      switchTab('library');
    }
  };

  document.getElementById('lib-search').oninput = applyLibraryFilter;
  document.getElementById('lib-filter-tag').onchange = applyLibraryFilter;

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
