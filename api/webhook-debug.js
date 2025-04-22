export default function handler(req, res) {
  console.log('\n📝 DEBUG WEBHOOK RECEIVED:', {
    headers: req.headers,
    body: req.body
  });
  res.status(200).send('OK');
}