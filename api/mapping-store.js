// /api/mapping-store.js
import fs from 'fs';

// Path to the mapping file in /tmp (writable in Vercel)
const MAPPING_FILE = '/tmp/livechat_mappings.json';

export default async function handler(req, res) {
  try {
    // Only allow POST and GET
    if (req.method === 'POST') {
      // Store mapping
      const { chatId, sessionId } = req.body;
      
      if (!chatId || !sessionId) {
        return res.status(400).json({ success: false, error: 'Missing chatId or sessionId' });
      }
      
      // Read existing mappings
      let mappings = {};
      try {
        if (fs.existsSync(MAPPING_FILE)) {
          mappings = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
        }
      } catch (e) {
        console.log('Error reading mapping file:', e);
      }
      
      // Add new mapping
      mappings[chatId] = sessionId;
      
      // Write updated mappings
      fs.writeFileSync(MAPPING_FILE, JSON.stringify(mappings));
      
      return res.status(200).json({ success: true });
    } 
    else if (req.method === 'GET') {
      // Get mapping for chatId
      const { chatId } = req.query;
      
      if (!chatId) {
        return res.status(400).json({ success: false, error: 'Missing chatId' });
      }
      
      // Read mappings
      let mappings = {};
      try {
        if (fs.existsSync(MAPPING_FILE)) {
          mappings = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
        }
      } catch (e) {
        console.log('Error reading mapping file:', e);
      }
      
      // Return mapping
      return res.status(200).json({ 
        success: true,
        sessionId: mappings[chatId] || null
      });
    }
    
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Mapping store error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}