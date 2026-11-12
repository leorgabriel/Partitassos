// Ponto único de configuração: aponte para a função serverless publicada
// (ex: Vercel). Em desenvolvimento local sem deploy, deixe vazio — a busca
// mostrará um aviso explicando como configurar.
const SEARCH_API_URL = ''; // ex: 'https://seu-app.vercel.app/api/search'

const Search = {
  async run(query, artist) {
    const term = artist ? `${query} ${artist}` : query;
    if (!SEARCH_API_URL) {
      throw new Error('API de busca não configurada. Veja o README para publicar a função serverless.');
    }
    const r = await fetch(`${SEARCH_API_URL}?q=${encodeURIComponent(term)}`);
    if (!r.ok) throw new Error('Falha na busca');
    const data = await r.json();
    return data.results || [];
  }
};
