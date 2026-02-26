export default async function handler(req, res) {
  // Lấy toàn bộ path sau /zyx/
  const { path, ...query } = req.query;

  const targetHost = process.env.MOCK_API_URL;
  if (!targetHost) return res.status(500).json({ error: 'MOCK_API_URL is not defined' });

  // Xây dựng URL đích
  const urlPath = req.url.split('?')[0].replace('/api/zyx', '');
  const params = new URLSearchParams(query).toString();
  const url = `${targetHost}${urlPath}${params ? '?' + params : ''}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.VITE_API_TOKEN || ''
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
