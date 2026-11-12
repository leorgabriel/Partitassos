// Serverless function (Vercel). Junta resultados de imagens do Bing com
// links de busca do MuseScore — sem precisar de nenhuma chave de API.
export default async function handler(req, res) {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'missing q' });

  const term = `partitura ${q}`;
  const results = [];

  try {
    const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(term)}&form=HDRSC2`;
    const r = await fetch(bingUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await r.text();
    const re = /<a[^>]+class="iusc"[^>]+m="([^"]+)"/g;
    let m;
    let count = 0;
    while ((m = re.exec(html)) && count < 12) {
      const json = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      try {
        const data = JSON.parse(json);
        if (!data.murl) continue;
        results.push({
          source: 'bing',
          title: data.t || q,
          thumbnail: data.turl || data.murl,
          fullImage: data.murl,
          pageUrl: data.purl || data.murl
        });
        count++;
      } catch (_) {
        // ignora item malformado e segue pro próximo
      }
    }
  } catch (e) {
    // segue sem os resultados do Bing se a busca falhar
  }

  try {
    const museUrl = `https://musescore.com/sheetmusic?text=${encodeURIComponent(q)}`;
    const r = await fetch(museUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await r.text();
    const cardRe = /<a[^>]+href="(\/user\/[^"]+\/scores\/[^"]+|\/sheetmusic\/[^"]+|https:\/\/musescore\.com\/[^"]*\/scores\/[^"]+)"[^>]*>[\s\S]{0,800}?<img[^>]+src="([^"]+)"/g;
    let m;
    let count = 0;
    while ((m = cardRe.exec(html)) && count < 10) {
      const link = m[1].startsWith('http') ? m[1] : `https://musescore.com${m[1]}`;
      results.push({
        source: 'musescore',
        title: q,
        thumbnail: m[2],
        fullImage: m[2],
        pageUrl: link
      });
      count++;
    }
  } catch (e) {
    // segue sem os resultados do MuseScore se a busca falhar
  }

  // remove duplicados por thumbnail
  const seen = new Set();
  const unique = results.filter((r) => {
    if (seen.has(r.thumbnail)) return false;
    seen.add(r.thumbnail);
    return true;
  });

  res.setHeader('Cache-Control', 's-maxage=3600');
  res.status(200).json({ results: unique });
}
