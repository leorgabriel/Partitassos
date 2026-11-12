// Consulta a cota de uso da SerpApi (plano free) pra mostrar no app.
export default async function handler(req, res) {
  const key = process.env.SERPAPI_KEY;
  if (!key) return res.status(500).json({ error: 'missing SERPAPI_KEY env var' });

  try {
    const r = await fetch(`https://serpapi.com/account?api_key=${key}`);
    const data = await r.json();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      used: data.this_month_usage ?? null,
      limit: data.searches_per_month ?? null,
      left: data.plan_searches_left ?? null
    });
  } catch (e) {
    res.status(502).json({ error: 'usage check failed' });
  }
}
