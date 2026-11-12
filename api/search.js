// Serverless function (Vercel). Usa a SerpApi (plano free: 250 buscas/mês)
// para trazer resultados reais do Google Imagens sem bloqueio anti-robô.
export default async function handler(req, res) {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'missing q' });

  const key = process.env.SERPAPI_KEY;
  if (!key) return res.status(500).json({ error: 'missing SERPAPI_KEY env var' });

  const term = `partitura ${q}`;
  const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(term)}&hl=pt-br&gl=br&api_key=${key}`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    if (data.error) return res.status(502).json({ error: data.error });

    const results = (data.images_results || []).slice(0, 20).map((item) => ({
      source: 'google',
      title: item.title,
      thumbnail: item.thumbnail,
      fullImage: item.original,
      pageUrl: item.link
    }));

    res.setHeader('Cache-Control', 's-maxage=3600');
    res.status(200).json({ results });
  } catch (e) {
    res.status(502).json({ error: 'search failed' });
  }
}
