// api/analytics-proxy.js
export default async function handler(req, res) {
    if (req.method === 'GET') {
      return res.status(200).send('Analytics proxy endpoint is working!');
    }
    
    if (req.method === 'POST') {
      try {
        const response = await fetch('https://hysing.svorumstrax.is/api/public-feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(req.body)
        });
        
        const data = await response.json();
        console.log('Analytics system response:', data);
        return res.status(200).json(data);
      } catch (error) {
        console.error('Error proxying to analytics:', error);
        return res.status(500).json({ error: 'Proxy error', message: error.message });
      }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  }
  