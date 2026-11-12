const Library = {
  async saveFromFile(file, meta) {
    const dataUrl = await blobToDataUrl(file);
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

  filter(items, text, tag) {
    const t = (text || '').toLowerCase();
    return items.filter((i) => {
      const matchText = !t || i.title.toLowerCase().includes(t) || (i.artist || '').toLowerCase().includes(t);
      const matchTag = !tag || i.tag === tag;
      return matchText && matchTag;
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
