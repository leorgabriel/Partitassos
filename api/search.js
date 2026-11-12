// Serverless function (Vercel). Mantém a API key do Google CSE fora do cliente
// e junta resultados do Google Imagens com links de busca do MuseScore.
export default async function handler(req, res) {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'missing q' });

  const key = process.env.GOOGLE_CSE_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  const term = `partitura ${q}`;

  const results = [];

  let googleError = null;
  if (key && cx) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(term)}&searchType=image&num=10&safe=active`;
      const r = await fetch(url);
      const data = await r.json();
      if (data.error) googleError = data.error.message;
      for (const item of data.items || []) {
        results.push({
          source: 'google',
          title: item.title,
          thumbnail: item.image?.thumbnailLink || item.link,
          fullImage: item.link,
          pageUrl: item.image?.contextLink || item.link
        });
      }
    } catch (e) {
      googleError = e.message;
    }
  } else {
    googleError = 'missing GOOGLE_CSE_KEY or GOOGLE_CSE_CX env vars';
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
  res.status(200).json({ results: unique, debug: { googleError } });
}
