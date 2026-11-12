// Proxy de imagem: baixa a imagem no servidor (evita bloqueio de CORS no navegador)
// e devolve como base64 para ser salva no IndexedDB do app.
export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'missing url' });

  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const buf = Buffer.from(await r.arrayBuffer());
    const type = r.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Cache-Control', 's-maxage=86400');
    res.status(200).json({ dataUrl: `data:${type};base64,${buf.toString('base64')}` });
  } catch (e) {
    res.status(502).json({ error: 'fetch failed' });
  }
}
