const Library = {
  async saveFromFile(file, meta) {
    const dataUrl = await blobToDataUrl(file);
    return this._save(dataUrl, meta);
  },

  async saveFromResult(result, meta) {
    const r = await fetch(`/api/image?url=${encodeURIComponent(result.fullImage)}`);
    const data = await r.json();
    if (!r.ok || !data.dataUrl) throw new Error('Não foi possível baixar essa imagem.');
    return this._save(data.dataUrl, meta);
  },

  async _save(dataUrl, meta) {
    const item = {
      title: meta.title,
      artist: meta.artist,
      tag: meta.tag || '',
      status: meta.status,
      favorite: false,
      savedAt: Date.now(),
      image: dataUrl
    };
    return DB.add(item);
  },

  async toggleFavorite(id) {
    const item = await DB.get(id);
    item.favorite = !item.favorite;
    await DB.update(item);
    return item;
  },

  async getAll() {
    const items = await DB.getAll();
    return items.sort((a, b) => b.savedAt - a.savedAt);
  },

  filter(items, text, tag, status, favOnly) {
    const t = (text || '').toLowerCase();
    return items.filter((i) => {
      const matchText = !t || i.title.toLowerCase().includes(t) || (i.artist || '').toLowerCase().includes(t);
      const matchTag = !tag || i.tag === tag;
      const matchStatus = !status || i.status === status;
      const matchFav = !favOnly || i.favorite;
      return matchText && matchTag && matchStatus && matchFav;
    });
  },

  allTags(items) {
    return [...new Set(items.map((i) => i.tag).filter(Boolean))];
  }
};

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
