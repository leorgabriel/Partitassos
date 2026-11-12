const Search = {
  async run(query, artist) {
    const term = artist ? `${query} ${artist}` : query;
    const r = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
    const data = await r.json();
    if (!r.ok || data.error) throw new Error('Falha na busca. Tente de novo em instantes.');
    return data.results || [];
  },

  async usage() {
    const r = await fetch('/api/usage');
    if (!r.ok) return null;
    return r.json();
  }
};
