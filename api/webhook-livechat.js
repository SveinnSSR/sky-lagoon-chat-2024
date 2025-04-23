// /api/webhook-livechat.js
import { MongoClient } from 'mongodb';
import Pusher from 'pusher';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'skylagoon-chat-db';

// LiveChat credentials for direct API access
const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e'; 
const PAT = 'fra:rmSYYwBm3t_PdcnJIOfQf2aQuJc';

// Sky Lagoon Organization ID for filtering
const SKY_LAGOON_ORG_ID = '10d9b2c9-311a-41b4-94ae-b0c4562d7737';

// Message deduplication cache - NEW
if (!global.recentSentMessages) {
  global.recentSentMessages = new Map(); // Use Map to store timestamp with message
}

// Message source tracking - NEW
if (!global.messageSourceTracker) {
  global.messageSourceTracker = new Map(); // Track where messages originated
}

// Clean up old entries every few minutes to prevent memory leaks
setInterval(() => {
  if (global.recentSentMessages) {
    const now = Date.now();
    for (const [key, timestamp] of global.recentSentMessages.entries()) {
      // Remove entries older than 30 seconds
      if (now - timestamp > 30000) {
        global.recentSentMessages.delete(key);
      }
    }
  }
  
  // Clean up message source tracker too
  if (global.messageSourceTracker) {
    const now = Date.now();
    for (const [key, data] of global.messageSourceTracker.entries()) {
      if (now - data.timestamp > 60000) { // 1 minute
        global.messageSourceTracker.delete(key);
      }
    }
  }
}, 300000); // Clean every 5 minutes

// Pusher configuration
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
    
    // Check global webhook cache
    if (global.recentWebhooks && global.recentWebhooks.has(chatId)) {
      console.log('\n🔍 Checking recent webhooks for customer email...');
      const chat = global.recentWebhooks.get(chatId);
      
      if (chat && chat.users) {
        const customer = chat.users.find(user => user.type === 'customer');
        
        if (customer && customer.email && customer.email.includes('@skylagoon.com')) {
          // Extract session ID from email
          const sessionId = customer.email.replace('@skylagoon.com', '');
          console.log(`\n✅ Found session ID in webhook email: ${chatId} -> ${sessionId}`);
          
          // Store for future use
          if (!global.liveChatSessionMappings) {
            global.liveChatSessionMappings = new Map();
          }
          global.liveChatSessionMappings.set(chatId, sessionId);
          
          return sessionId;
        }
      }
    }
    
    // Direct API lookup if not found in memory
    try {
      console.log('\n🔍 Direct API lookup to get customer email...');
      const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
      
      const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${agentCredentials}`,
          'X-Region': 'fra'
        },
        body: JSON.stringify({ chat_id: chatId })
      });
      
      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        console.log('\n✅ Successfully retrieved chat data from LiveChat API');
        
        // Find customer in the users array
        const customer = chatData.users?.find(user => user.type === 'customer');
        
        if (customer && customer.email && customer.email.includes('@skylagoon.com')) {
          // Extract session ID from email - THIS IS THE KEY PART
          const sessionId = customer.email.replace('@skylagoon.com', '');
          console.log(`\n✅ Extracted session ID from email: ${chatId} -> ${sessionId}`);
          
          // Store for future use
          if (!global.liveChatSessionMappings) {
            global.liveChatSessionMappings = new Map();
          }
          global.liveChatSessionMappings.set(chatId, sessionId);
          
          return sessionId;
        }
      }
    } catch (apiError) {
      console.warn('\n⚠️ Error in direct API lookup:', apiError.message);
    }
    
    console.log(`\n🔍 Not found in memory or API, checking MongoDB...`);
    
    // Then check MongoDB as last resort
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
      type: req.body.payload?.event?.type,
      author: req.body.payload?.event?.author_id,
      chat_id: req.body.payload?.chat_id || req.body.payload?.chat?.id,
      organization_id: req.body.organization_id // Log organization ID
    });
    
    // Log full payload for debugging
    console.log('\n🔍 Full webhook payload:', JSON.stringify(req.body, null, 2));
    
    // Verify webhook is authentic
    if (!req.body.action || !req.body.payload) {
      console.warn('\n⚠️ Invalid webhook format');
      return res.status(400).json({ success: false, error: 'Invalid webhook format' });
    }
    
    // NEW: Filter out unrelated organizations
    if (req.body.organization_id && req.body.organization_id !== SKY_LAGOON_ORG_ID) {
      console.log(`\n⚠️ Ignoring webhook from unrelated organization: ${req.body.organization_id}`);
      return res.status(200).json({ success: true });
    }
    
    // Handle incoming_chat events - EXTRACT SESSION ID FROM EMAIL
    if (req.body.action === 'incoming_chat') {
      try {
        console.log('\n📝 Processing incoming_chat webhook...');
        
        // Extract chat data
        const chat = req.body.payload.chat;
        if (!chat || !chat.id) {
          console.warn('\n⚠️ Invalid chat payload in incoming_chat webhook');
          return res.status(200).json({ success: true });
        }
        
        const chatId = chat.id;
        console.log('\n🔍 Processing incoming_chat for chat ID:', chatId);
        
        // Store chat data for future reference
        if (!global.recentWebhooks) {
          global.recentWebhooks = new Map();
        }
        global.recentWebhooks.set(chatId, chat);
        console.log('\n💾 Stored webhook in memory cache');
        
        // Find the customer in the users array
        const users = chat.users || [];
        const customer = users.find(user => user.type === 'customer');
        
        if (customer && customer.email && customer.email.includes('@skylagoon.com')) {
          // CRITICAL STEP: Extract session ID from email
          const sessionId = customer.email.replace('@skylagoon.com', '');
          console.log(`\n✅ CRITICAL: Extracted session ID from email: ${chatId} -> ${sessionId}`);
          
          // Store this mapping in memory
          if (!global.liveChatSessionMappings) {
            global.liveChatSessionMappings = new Map();
          }
          global.liveChatSessionMappings.set(chatId, sessionId);
          console.log(`\n🔗 Stored mapping in memory: ${chatId} -> ${sessionId}`);
          
          // Test that the mapping was stored correctly
          const storedSessionId = global.liveChatSessionMappings.get(chatId);
          console.log(`\n🔍 Verification check: ${storedSessionId === sessionId ? 'PASSED ✓' : 'FAILED ✗'}`);
          
          // Add to recent sessions for fallback
          if (!global.recentSessions) {
            global.recentSessions = new Set();
          }
          global.recentSessions.add(sessionId);
          console.log(`\n📝 Added to recent sessions: ${sessionId}`);
          
          // Try to store in MongoDB
          try {
            const { db } = await connectToDatabase();
            
            // Ensure the collection exists
            const collections = await db.listCollections({name: 'livechat_mappings'}).toArray();
            if (collections.length === 0) {
              await db.createCollection('livechat_mappings');
            }
            
            // Store mapping
            await db.collection('livechat_mappings').updateOne(
              { chatId: chatId },
              { $set: { sessionId: sessionId, updatedAt: new Date() } },
              { upsert: true }
            );
            
            console.log('\n✅ Mapping stored in MongoDB');
          } catch (dbError) {
            console.warn('\n⚠️ MongoDB error:', dbError.message);
          }
        } else {
          console.warn('\n⚠️ Customer email not found or does not contain session ID');
          
          // Try getting session ID from session_fields as fallback
          if (customer && customer.session_fields && customer.session_fields.length > 0) {
            let sessionId = null;
            
            // First try direct index
            if (customer.session_fields[0] && customer.session_fields[0].session_id) {
              sessionId = customer.session_fields[0].session_id;
            } else {
              // Then try finding session_id field
              for (const field of customer.session_fields) {
                if (field.session_id) {
                  sessionId = field.session_id;
                  break;
                }
              }
            }
            
            if (sessionId) {
              console.log(`\n✅ Found session ID in session_fields: ${chatId} -> ${sessionId}`);
              
              // Store in memory
              if (!global.liveChatSessionMappings) {
                global.liveChatSessionMappings = new Map();
              }
              global.liveChatSessionMappings.set(chatId, sessionId);
              
              // Add to recent sessions
              if (!global.recentSessions) {
                global.recentSessions = new Set();
              }
              global.recentSessions.add(sessionId);
              
              // Store in MongoDB
              try {
                const { db } = await connectToDatabase();
                await db.collection('livechat_mappings').updateOne(
                  { chatId: chatId },
                  { $set: { sessionId: sessionId, updatedAt: new Date() } },
                  { upsert: true }
                );
              } catch (dbError) {
                console.warn('\n⚠️ MongoDB error:', dbError.message);
              }
            }
          }
        }
      } catch (error) {
        console.error('\n❌ Error processing incoming_chat webhook:', error);
        // Always return success for incoming_chat events
        return res.status(200).json({ 
          success: true, 
          preventCrash: true
        });
      }
    }
    
    // For incoming_event with message, process agent messages
    if (req.body.action === 'incoming_event' && 
        req.body.payload.event?.type === 'message') {
      
      const chatId = req.body.payload.chat_id;
      const event = req.body.payload.event;
      const authorId = event.author_id;
      const messageText = event.text;
      const messageId = event.id;
      
      console.log(`\n📨 Processing message: "${messageText}" from ${authorId} (ID: ${messageId})`);
      
      // NEW: Much stronger deduplication logic
      // Create multiple signatures to catch different variations of the same message
      const exactSignature = `${chatId}:${messageText}`;
      const trimmedSignature = `${chatId}:${messageText.slice(0, 50)}`;
      const strippedSignature = `${chatId}:${messageText.replace(/\s+/g, '').slice(0, 30)}`;
      
      // Check if we've seen this message before (exact or approximate match)
      if (global.recentSentMessages && 
          (global.recentSentMessages.has(exactSignature) || 
           global.recentSentMessages.has(trimmedSignature) || 
           global.recentSentMessages.has(strippedSignature))) {
        console.log('\n🔄 Ignoring echoed message that we just sent - SIGNATURE MATCH');
        console.log(`\n🔍 Matched signatures: exact=${global.recentSentMessages.has(exactSignature)}, trimmed=${global.recentSentMessages.has(trimmedSignature)}, stripped=${global.recentSentMessages.has(strippedSignature)}`);
        return res.status(200).json({ success: true });
      }
      
      // NEW: Check if message came from our system originally
      if (global.messageSourceTracker && global.messageSourceTracker.has(chatId)) {
        const sourceInfo = global.messageSourceTracker.get(chatId);
        // If we have recent outgoing messages to this chat, check for potential echoes
        if (Date.now() - sourceInfo.timestamp < 5000) { // Within last 5 seconds
          const outgoingText = sourceInfo.message;
          // Check for high similarity (could be fuzzy match)
          const similarity = calculateSimilarity(outgoingText, messageText);
          if (similarity > 0.8) { // 80% similarity threshold
            console.log(`\n🔄 Ignoring likely echo with ${similarity.toFixed(2)} similarity score`);
            console.log(`\n🔍 Original: "${outgoingText}", Echo: "${messageText}"`);
            return res.status(200).json({ success: true });
          }
        }
      }
      
      // Ignore system messages
      if (messageText.includes('URGENT: AI CHATBOT TRANSFER') || 
          messageText.includes('REMINDER: Customer waiting')) {
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
      
      // MODIFIED: Added fallback to recent sessions to prevent UI crashes
      if (!sessionId) {
        console.error(`\n❌ Could not find sessionId for chatId: ${chatId}`);
        
        // FALLBACK: Try to use most recent session
        if (global.recentSessions && global.recentSessions.size > 0) {
          const fallbackSessionId = [...global.recentSessions].pop();
          console.log(`\n⚠️ Using fallback session ID: ${fallbackSessionId}`);
          
          // Extract agent name (for better UX)
          let authorName = "Agent";
          if (authorId.includes('@')) {
            authorName = authorId.split('@')[0];
            // Capitalize first letter
            authorName = authorName.charAt(0).toUpperCase() + authorName.slice(1);
          }
          
          // Create agent message
          const agentMessage = {
            role: 'agent',
            content: messageText,
            author: authorName,
            timestamp: new Date().toISOString()
          };
          
          // Send to frontend via Pusher
          console.log(`\n📤 Broadcasting agent message to fallback session: ${fallbackSessionId}`);
          await pusher.trigger('chat-channel', 'agent-message', {
            sessionId: fallbackSessionId,
            message: agentMessage,
            chatId: chatId
          });
          
          console.log('\n✅ Agent message broadcast to fallback session');
          return res.status(200).json({ success: true });
        }
        
        // If no fallback, return error but prevent UI crashes
        return res.status(200).json({ 
          success: false, 
          error: 'Session not found',
          preventCrash: true  // Add this flag to signal the UI not to crash
        });
      }
      
      // Extract agent name (for better UX)
      let authorName = "Agent";
      if (authorId.includes('@')) {
        authorName = authorId.split('@')[0];
        // Capitalize first letter
        authorName = authorName.charAt(0).toUpperCase() + authorName.slice(1);
      }
      
      // Create agent message
      const agentMessage = {
        role: 'agent',
        content: messageText,
        author: authorName,
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
    
    // CRITICAL: Always return a 200 response to prevent LiveChat from retrying
    // This prevents the UI from potentially crashing on retry attempts
    return res.status(200).json({ 
      success: false, 
      error: error.message,
      // Flag to tell frontend not to crash if it receives this error
      preventCrash: true
    });
  }
}

// NEW: Helper function to calculate similarity between two strings (0-1 scale)
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  // Convert both to lowercase and trim
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1;
  
  // Length difference check
  if (Math.abs(s1.length - s2.length) / Math.max(s1.length, s2.length) > 0.5) {
    return 0; // Too different in length
  }
  
  // Simple character-based similarity
  let matches = 0;
  const minLength = Math.min(s1.length, s2.length);
  
  for (let i = 0; i < minLength; i++) {
    if (s1[i] === s2[i]) matches++;
  }
  
  return matches / minLength;
}