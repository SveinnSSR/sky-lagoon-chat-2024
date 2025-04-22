export default function handler(req, res) {
  console.log('\n✅ Webhook test endpoint reached');
  res.status(200).send('Webhook endpoint is reachable');
}