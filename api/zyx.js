export default async function handler(req, res) {
  const targetHost = process.env.MOCK_API_URL;
  if (!targetHost) return res.status(500).json({ error: 'MOCK_API_URL is not defined in Vercel Environment Variables' });

  // Robust path handling for both /api/zyx and /zyx
  // Example: /api/zyx/login -> /login
  // Example: /zyx/login -> /login
  const cleanPath = req.url.replace(/^\/api\/zyx/, '').replace(/^\/zyx/, '');
  const url = `${targetHost}${cleanPath}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.VITE_API_TOKEN || ''
      },
      // Only include body for non-GET methods
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
    });

    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Proxy Error: ' + e.message });
  }
}
