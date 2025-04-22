// /api/webhook-livechat.js
import { MongoClient } from 'mongodb';
import Pusher from 'pusher';

// MongoDB connection - make sure these environment variables are set in Vercel
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'skylagoon-chat-db';

// Pusher configuration - make sure these environment variables are set in Vercel
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

// Connect to MongoDB
async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  return { client, db };
}

// Find sessionId for a given chatId
async function findSessionIdForChat(chatId) {
  try {
    console.log(`\n🔍 Looking up mapping for chat ID: ${chatId}`);
    
    // First check in-memory
    if (global.liveChatSessionMappings && global.liveChatSessionMappings.has(chatId)) {
      const sessionId = global.liveChatSessionMappings.get(chatId);
      console.log(`\n✅ Found session mapping in memory: ${chatId} -> ${sessionId}`);
      return sessionId;
    }
    
    console.log(`\n🔍 Not found in memory, checking MongoDB...`);
    
    // Then check MongoDB
    const { client, db } = await connectToDatabase();
    // Log the collection existence
    const collections = await db.listCollections({name: 'livechat_mappings'}).toArray();
    console.log(`\n🔍 'livechat_mappings' collection exists: ${collections.length > 0}`);
    
    const mapping = await db.collection('livechat_mappings').findOne({ chatId: chatId });
    
    if (mapping && mapping.sessionId) {
      console.log(`\n✅ Found session mapping in MongoDB: ${chatId} -> ${mapping.sessionId}`);
      // Also update memory cache
      if (!global.liveChatSessionMappings) {
        global.liveChatSessionMappings = new Map();
      }
      global.liveChatSessionMappings.set(chatId, mapping.sessionId);
      return mapping.sessionId;
    }
    
    console.log(`\n⚠️ No mapping found in MongoDB for chat ID: ${chatId}`);
    return null;
  } catch (error) {
    console.error('\n❌ Error retrieving mapping:', error);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    console.log('\n📩 Received webhook from LiveChat:', {
      action: req.body.action,
      chat_id: req.body.payload?.chat?.id || req.body.payload?.chat_id
    });
    
    // Log full payload for debugging
    console.log('\n🔍 Full webhook payload:', JSON.stringify(req.body, null, 2));
    
    // Verify webhook is authentic
    if (!req.body.action || !req.body.payload) {
      console.warn('\n⚠️ Invalid webhook format');
      return res.status(400).json({ success: false, error: 'Invalid webhook format' });
    }
    
    // For incoming_event with message, process agent messages
    if (req.body.action === 'incoming_event' && 
        req.body.payload.event?.type === 'message') {
      
      const chatId = req.body.payload.chat_id;
      const event = req.body.payload.event;
      const authorId = event.author_id;
      const messageText = event.text;
      
      console.log(`\n📨 Processing message: "${messageText}" from ${authorId}`);
      
      // Ignore system messages
      if (messageText.includes('URGENT: AI CHATBOT TRANSFER')) {
        console.log('\n📝 Ignoring system message');
        return res.status(200).json({ success: true });
      }
      
      // Check if this is an agent message
      const isAgentMessage = authorId && authorId.includes('@');
      if (!isAgentMessage) {
        console.log('\n📝 Ignoring non-agent message');
        return res.status(200).json({ success: true });
      }
      
      // Find the session ID for this chat
      const sessionId = await findSessionIdForChat(chatId);
      if (!sessionId) {
        console.error(`\n❌ Could not find sessionId for chatId: ${chatId}`);
        return res.status(404).json({ success: false, error: 'Session not found' });
      }
      
      // Create agent message
      const agentMessage = {
        role: 'agent',
        content: messageText,
        author: authorId,
        timestamp: new Date().toISOString()
      };
      
      // Send to frontend via Pusher
      console.log(`\n📤 Broadcasting agent message to session: ${sessionId}`);
      await pusher.trigger('chat-channel', 'agent-message', {
        sessionId: sessionId,
        message: agentMessage,
        chatId: chatId
      });
      
      console.log('\n✅ Agent message broadcast successfully');
    }
    
    // Always return success to acknowledge receipt
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('\n❌ Webhook processing error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}