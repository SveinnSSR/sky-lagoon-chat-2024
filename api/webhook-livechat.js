// /api/webhook-livechat.js
import { MongoClient } from 'mongodb';
import Pusher from 'pusher';
import { checkForDuplicateMessage } from '../database.js';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'skylagoon-chat-db';

// LiveChat credentials for direct API access
const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e'; 
const PAT = 'fra:rmSYYwBm3t_PdcnJIOfQf2aQuJc';

// IMPROVED: Message tracking for duplicate detection
const recentMessageHashes = new Map();

// Initialize customer message tracker for echo detection
if (!global.customerMessageTracker) {
  global.customerMessageTracker = new Map();
}

// Clean up old tracked messages every 5 minutes to prevent memory leaks
setInterval(() => {
  if (global.customerMessageTracker) {
    const now = Date.now();
    for (const [chatId, messages] of global.customerMessageTracker.entries()) {
      const recentMessages = messages.filter(msg => now - msg.timestamp < 120000); // 2 minutes
      if (recentMessages.length === 0) {
        global.customerMessageTracker.delete(chatId);
      } else if (recentMessages.length < messages.length) {
        global.customerMessageTracker.set(chatId, recentMessages);
      }
    }
  }
  
  // Also clean up message hashes older than 30 seconds
  const now = Date.now();
  for (const [hash, timestamp] of recentMessageHashes.entries()) {
    if (now - timestamp > 30000) { // 30 seconds
      recentMessageHashes.delete(hash);
    }
  }
}, 300000);

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
      chat_id: req.body.payload?.chat_id || req.body.payload?.chat?.id
    });
    
    // Log full payload for debugging
    console.log('\n🔍 Full webhook payload:', JSON.stringify(req.body, null, 2));
    
    // Verify webhook is authentic
    if (!req.body.action || !req.body.payload) {
      console.warn('\n⚠️ Invalid webhook format');
      return res.status(400).json({ success: false, error: 'Invalid webhook format' });
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
    
      // Add these detailed logs
      console.log('\n🔎 ECHO DEBUG - Webhook message received:', {
        chatId: req.body.payload.chat_id,
        messageText: req.body.payload.event?.text?.substring(0, 30),
        authorId: req.body.payload.event?.author_id,
        messageId: req.body.payload.event?.id
      });
            
      const chatId = req.body.payload.chat_id;
      const event = req.body.payload.event;
      const authorId = event.author_id;
      const messageText = event.text || '';
      const messageId = event.id; // Add message ID tracking
      const properties = event.properties || {}; // Extract custom properties

      // Just before MongoDB check
      console.log('\n🔎 ECHO DEBUG - About to check MongoDB for:', req.body.payload.chat_id, req.body.payload.event?.text);

      // NEW: Check MongoDB for duplicate messages - this works across function instances
      try {
        const isDuplicate = await checkForDuplicateMessage(chatId, messageText);
        if (isDuplicate) {
          console.log(`\n🔄 MONGODB ECHO DETECTED: Message "${messageText.substring(0, 30)}..." is a duplicate`);
          return res.status(200).json({ success: true });
        }
      } catch (mongoError) {
        console.error('\n⚠️ Error checking MongoDB for duplicates:', mongoError);
        // Continue with local checks on error
      }      
    
      // ADD THESE DEBUG LOGS HERE
      console.log('\n🔍 ECHO CHECK: Inspecting customerMessageTracker...');
      if (global.customerMessageTracker) {
          console.log(`customerMessageTracker exists with ${global.customerMessageTracker.size} chats`);
          if (global.customerMessageTracker.has(chatId)) {
              const msgs = global.customerMessageTracker.get(chatId);
              console.log(`Found ${msgs.length} tracked messages for chatId ${chatId}`);
              msgs.forEach((msg, i) => {
                  console.log(`Message ${i}: "${msg.text.substring(0, 20)}...", age: ${(Date.now() - msg.timestamp)/1000}s`);
                  if (msg.text === messageText) {
                      console.log(`📣 MATCH FOUND: "${messageText}" matches tracked message!`);
                  }
              });
          } else {
              console.log(`No messages tracked for chatId ${chatId}`);
          }
      } else {
          console.log('customerMessageTracker does not exist in this context!');
      }
      
      // ENHANCED ECHO DETECTION: Check multiple conditions to catch echo messages
      if (
        // Check for our custom property (in case LiveChat preserves it)
        (properties && properties.source === 'chatbot_ui') ||
        // Check for custom property as nested object (common LiveChat structure)
        (properties && properties.chatbot_ui) ||
        // Check message tracker as a reliable fallback
        (authorId && authorId.includes('@') && 
          global.customerMessageTracker && 
          global.customerMessageTracker.has(chatId) &&
          global.customerMessageTracker.get(chatId).some(msg => 
            msg.text === messageText && 
            (Date.now() - msg.timestamp < 30000) // Within 30 seconds
          ))
      ) {
          console.log(`\n🔄 ECHO DETECTED: Message "${messageText.substring(0, 30)}..." originated from UI or matches recent customer message`);
          return res.status(200).json({ success: true });
      }

      // EXTENSIVE DEBUG LOGGING
      console.log('\n🔍 DETAILED MESSAGE DEBUG:', {
          messageText,
          authorId,
          isAgentAuthor: authorId && authorId.includes('@'),
          customerId: event.authorId, // Check the exact field names
          hasVisibility: !!event.visibility,
          visibility: event.visibility,
          messageId,
          eventType: event.type
      }); 
      
      console.log(`\n📨 Processing message: "${messageText}" from ${authorId} (ID: ${messageId})`);
      
      // Ignore system messages
      if (messageText.includes('URGENT: AI CHATBOT TRANSFER') || 
          messageText.includes('REMINDER: Customer waiting')) {
        console.log('\n📝 Ignoring system message');
        return res.status(200).json({ success: true });
      }
      
      // ENHANCED: Check if this is an echo of a customer message
      if (global.customerMessageTracker && global.customerMessageTracker.has(chatId)) {
        const chatMessages = global.customerMessageTracker.get(chatId);
        
        // Check if this message text matches any recent customer messages
        const isCustomerEcho = chatMessages.some(msg => 
            msg.text === messageText && 
            (Date.now() - msg.timestamp) < 30000 // Within 30 seconds
        );
        
        if (isCustomerEcho) {
            console.log(`\n🔄 ECHO DETECTED: "${messageText}" was recently sent by customer`);
            console.log('\n⚠️ Skipping to prevent duplication');
            return res.status(200).json({ success: true });
        }
      }

      // ENHANCED: Improved duplicate detection with simple hash-based approach
      const messageHash = messageText.trim(); // Use trimmed text as a simple "hash"
      const now = Date.now();
      
      // Check if we've seen this message recently (within 15 seconds)
      if (recentMessageHashes.has(messageHash)) {
        const timestamp = recentMessageHashes.get(messageHash);
        if (now - timestamp < 15000) { // 15 seconds
          console.log(`\n🔄 ENHANCED DUPLICATE DETECTION: "${messageText}" sent in last 15 seconds`);
          console.log('\n⚠️ Skipping to prevent duplication');
          return res.status(200).json({ success: true });
        }
      }
      
      // Store this message hash
      recentMessageHashes.set(messageHash, now);
      
      // Clean up old hashes if we have too many (keep Map size manageable)
      if (recentMessageHashes.size > 50) {
        // Delete the oldest entry (first key)
        const oldestKey = [...recentMessageHashes.keys()][0];
        recentMessageHashes.delete(oldestKey);
      }
      
      // ORIGINAL: Backup duplicate detection with global.recentMessages
      if (!global.recentMessages) {
        global.recentMessages = [];
      }
      
      // Check if this exact message text was recently processed (last 15 seconds)
      const isDuplicate = global.recentMessages.some(msg => 
        msg.text === messageText && (Date.now() - msg.timestamp < 15000)
      );
      
      if (isDuplicate) {
        console.log(`\n🔄 DUPLICATE DETECTED: "${messageText}" was recently processed`);
        console.log('\n⚠️ Skipping to prevent duplication');
        return res.status(200).json({ success: true });
      }
      
      // Add this message to tracking
      global.recentMessages.push({
        text: messageText,
        timestamp: Date.now()
      });
      
      // Keep only the most recent 20 messages to prevent memory issues
      if (global.recentMessages.length > 20) {
        global.recentMessages.shift();
      }
      
      // Check if this is an agent message
      const isAgentMessage = authorId && authorId.includes('@');
      if (!isAgentMessage) {
        console.log('\n📝 Ignoring non-agent message');
        return res.status(200).json({ success: true });
      }
      
      // Find the session ID for this chat - with defensive error handling
      try {
        const sessionId = await findSessionIdForChat(chatId);
        
        if (!sessionId) {
          console.log(`\n⚠️ Could not find sessionId for chatId: ${chatId}`);
          // CRITICAL: Return success instead of error to prevent webhook retries
          return res.status(200).json({ 
            success: false, 
            error: 'Session not found',
            preventCrash: true  // Signal to frontend not to crash
          });
        }
        
        // Extract agent name (for better UX)
        let authorName = "Agent";
        if (authorId && authorId.includes('@')) {
          try {
            authorName = authorId.split('@')[0];
            // Capitalize first letter
            authorName = authorName.charAt(0).toUpperCase() + authorName.slice(1);
          } catch (nameError) {
            console.log('\n⚠️ Could not extract agent name:', nameError.message);
            // Continue with default name
          }
        }
        
        // Create agent message with defensive default values
        const agentMessage = {
          role: 'agent',
          content: messageText || '',
          author: authorName || 'Agent',
          timestamp: new Date().toISOString()
        };
        
        // Send to frontend via Pusher with try/catch
        try {
          console.log(`\n📤 Broadcasting agent message to session: ${sessionId}`);
          // FINAL DEBUG LOG
          console.log('\n🔍 FINAL MESSAGE STATE:', {
            sessionId,
            role: 'agent',
            author: authorName,
            content: messageText.substring(0, 30) + (messageText.length > 30 ? '...' : ''),
            isAgentMessage,
            timestamp: new Date().toISOString()
          });

          await pusher.trigger('chat-channel', 'agent-message', {
            sessionId: sessionId,
            message: agentMessage,
            chatId: chatId
          });
          
          console.log('\n✅ Agent message broadcast successfully');
        } catch (pusherError) {
          console.error('\n❌ Pusher broadcast error:', pusherError);
          // Still return success to prevent webhook retries
          return res.status(200).json({ 
            success: false,
            error: 'Broadcast error',
            preventCrash: true
          });
        }
      } catch (error) {
        console.error('\n❌ Error processing agent message:', error);
        // CRITICAL: Return success status to prevent webhook retries
        return res.status(200).json({ 
          success: false, 
          error: error.message,
          preventCrash: true
        });
      }
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