// frontend/api/turkey/index.js
// TürkiyeAPI isteklerini proxy'leyen Vercel Serverless Function

export default async function handler(req, res) {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
  
    try {
      // Örneğin istek: /api/turkey/provinces → /provinces
      const path = req.url.replace('/api/turkey', '');
      const targetUrl = `https://turkiyeapi.dev/api/v1${path}`;
  
      console.log('Proxying request to:', targetUrl);
  
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
  
      if (!response.ok) {
        console.error('Türkiye API error:', response.status, response.statusText);
        res.status(response.status).json({
          error: 'Türkiye API request failed',
          status: response.status
        });
        return;
      }
  
      const data = await response.json();
  
      // CORS izinleri ekle
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 saat cache
  
      res.status(200).json(data);
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
  