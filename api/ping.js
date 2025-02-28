// api/ping.js
export default function handler(req, res) {
  res.status(200).json({
    message: 'Server is running',
    mongodb_uri_exists: !!process.env.MONGODB_URI,
    timestamp: new Date().toISOString()
  });
}
