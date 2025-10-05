// Vercel serverless function to proxy Türkiye API requests
// This bypasses CORS issues in production

module.exports = async (req, res) => {
  // Sadece GET isteklerine izin ver
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // İstek URL'ini al ve Türkiye API'ye yönlendir
    const url = new URL(req.url, `https://${req.headers.host}`);
    const apiPath = url.pathname.replace('/api/turkey', '');
    const queryString = url.search;

    // Türkiye API base URL'i
    const targetUrl = `https://turkiyeapi.dev/api/v1${apiPath}${queryString}`;

    console.log('Proxying request to:', targetUrl);

    // Türkiye API'ye istek at
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ozkafkasemlak.com-proxy/1.0'
      }
    });

    // Response'u kontrol et
    if (!response.ok) {
      console.error('Türkiye API error:', response.status, response.statusText);
      return res.status(response.status).json({
        error: 'Türkiye API request failed',
        status: response.status
      });
    }

    // JSON response'u al ve client'a gönder
    const data = await response.json();

    // CORS başlıkları ekle
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 saat cache

    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
