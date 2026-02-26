export default async function handler(req, res) {
  const { path, ...query } = req.query;
  if (!path) return res.status(400).json({ error: 'Missing path' });

  const params = new URLSearchParams({
    ...query,
    token: process.env.VITE_API_TOKEN || '',
  });

  const url = `https://api.viotp.com/${path}?${params}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
