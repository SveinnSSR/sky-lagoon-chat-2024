// database.js
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

// Global singleton connection
if (!global.mongoConnection) {
  global.mongoConnection = {
    client: null,
    db: null,
    connecting: null, // Promise for connection in progress
    connectionTime: 0,
    lastUsed: Date.now()
  };
}

export async function connectToDatabase() {
  try {
    // Use existing connection if available
    if (global.mongoConnection.client && global.mongoConnection.db) {
      console.log('Using cached database connection');
      // Update last used timestamp
      global.mongoConnection.lastUsed = Date.now();
      return {
        client: global.mongoConnection.client,
        db: global.mongoConnection.db
      };
    }
    
    // If connection is in progress, wait for it instead of creating a new one
    if (global.mongoConnection.connecting) {
      console.log('Waiting for existing MongoDB connection to complete...');
      await global.mongoConnection.connecting;
      return {
        client: global.mongoConnection.client,
        db: global.mongoConnection.db
      };
    }
    
    // Check for MongoDB URI
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable not set');
      throw new Error('Please define the MONGODB_URI environment variable');
    }
    
    // Start new connection and set the connecting promise
    console.log('Connecting to MongoDB...');
    const startTime = Date.now();
    
    // Store connection promise to prevent parallel connection attempts
    global.mongoConnection.connecting = (async () => {
      try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const db = client.db();
        
        // Store connection globally
        global.mongoConnection.client = client;
        global.mongoConnection.db = db;
        global.mongoConnection.connectionTime = Date.now() - startTime;
        global.mongoConnection.lastUsed = Date.now();
        
        console.log(`MongoDB connected successfully in ${global.mongoConnection.connectionTime}ms`);
        return { client, db };
      } catch (error) {
        global.mongoConnection.connecting = null;
        throw error;
      }
    })();
    
    // Wait for connection
    const result = await global.mongoConnection.connecting;
    global.mongoConnection.connecting = null;
    return result;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    global.mongoConnection.connecting = null;
    throw error;
  }
}

// ---------------------------------------------------------
// Echo and Duplicate Message Prevention for LiveChat Customer API integration
// message is stored in MongoDB for echo detection
// ---------------------------------------------------------

// Message tracking for echo detection
export async function storeRecentMessage(chatId, messageText) {
  try {
    const { db } = await connectToDatabase();
    
    // Store the message with expiration
    await db.collection('recent_messages').insertOne({
      chatId,
      messageText,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 60000) // 1 minute expiration
    });
    
    console.log(`\n✅ Stored message in MongoDB for echo detection: "${messageText.substring(0, 30)}..."`);
    
    // Create TTL index if it doesn't exist (only needs to be done once)
    try {
      const indexExists = await db.collection('recent_messages').indexExists('expiresAt_1');
      if (!indexExists) {
        console.log('\n📊 Creating TTL index for recent_messages collection');
        await db.collection('recent_messages').createIndex(
          { "expiresAt": 1 },
          { expireAfterSeconds: 0 }
        );
      }
    } catch (indexError) {
      console.error('\n⚠️ Error checking/creating index:', indexError);
      // Continue anyway
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ Error storing message for echo detection:', error);
    return false;
  }
}

export async function checkForDuplicateMessage(chatId, messageText) {
  try {
    console.log('\n🔎 ECHO DEBUG - MongoDB check called for:', chatId, messageText);
    
    const { db } = await connectToDatabase();
    
    // Look for a matching message in the last 30 seconds
    const recentTimestamp = new Date(Date.now() - 30000);
    
    console.log('\n🔎 ECHO DEBUG - MongoDB query:', {
      chatId,
      messageText,
      timestamp: { $gte: recentTimestamp }
    });
    
    const match = await db.collection('recent_messages').findOne({
      chatId,
      messageText,
      timestamp: { $gte: recentTimestamp }
    });
    
    console.log('\n🔎 ECHO DEBUG - MongoDB match result:', !!match);
    
    if (match) {
      console.log(`\n🔄 Found duplicate message in MongoDB: "${messageText.substring(0, 30)}..."`);
    } else {
      console.log(`\n⚠️ No matching message found in MongoDB for: "${messageText.substring(0, 30)}..."`);
      
      // Add a debug query to check what messages exist for this chat
      const recentMessages = await db.collection('recent_messages')
        .find({ chatId })
        .sort({ timestamp: -1 })
        .limit(5)
        .toArray();
      
      console.log('\n🔎 ECHO DEBUG - Recent messages in MongoDB for this chat:', 
        recentMessages.map(msg => ({
          text: msg.messageText.substring(0, 20),
          age: Math.round((Date.now() - new Date(msg.timestamp).getTime())/1000) + 's ago'
        }))
      );
    }
    
    return !!match;
  } catch (error) {
    console.error('\n❌ Error checking for duplicate message:', error);
    return false; // On error, let message through
  }
}

// ---------------------------------------------------------
// Dual-credentials storage for LiveChat Customer API integration
// ---------------------------------------------------------

/**
 * Stores both agent and customer credentials for a chat
 * @param {string} chatId - LiveChat chat ID
 * @param {string} sessionId - Session ID
 * @param {string} customerToken - Customer API token
 * @param {string} entityId - Customer entity ID
 * @returns {Promise<boolean>} Success status
 */
export async function storeDualCredentials(chatId, sessionId, customerToken, entityId) {
  try {
    const { db } = await connectToDatabase();
    
    // Get agent credentials
    const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e';
    const PAT = 'fra:rmSYYwBm3t_PdcnJIOfQf2aQuJc';
    
    // Store both agent credentials and customer token
    await db.collection('dual_credentials').updateOne(
      { chatId },
      { 
        $set: { 
          sessionId,
          customerToken,
          entityId,
          agentCredentials: Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64'),
          expiresAt: new Date(Date.now() + 28800000), // 8 hours
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    // Also cache in memory
    if (!global.dualCredentials) {
      global.dualCredentials = new Map();
    }
    
    global.dualCredentials.set(chatId, {
      customerToken,
      entityId,
      agentCredentials: Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64'),
      expiresAt: new Date(Date.now() + 28800000)
    });
    
    console.log(`\n💾 Stored dual credentials for chat ${chatId}`);
    return true;
  } catch (error) {
    console.error('\n❌ Error storing dual credentials:', error);
    return false;
  }
}

/**
 * Retrieves dual credentials for a chat
 * @param {string} chatId - LiveChat chat ID
 * @returns {Promise<Object|null>} Credentials or null if not found
 */
export async function getDualCredentials(chatId) {
  try {
    // Check memory cache first
    if (global.dualCredentials && global.dualCredentials.has(chatId)) {
      const creds = global.dualCredentials.get(chatId);
      
      // Check expiration
      if (creds.expiresAt > new Date()) {
        return creds;
      }
    }
    
    // Then check database
    const { db } = await connectToDatabase();
    const creds = await db.collection('dual_credentials').findOne({ chatId });
    
    if (creds && creds.expiresAt > new Date()) {
      // Cache in memory
      if (!global.dualCredentials) {
        global.dualCredentials = new Map();
      }
      
      global.dualCredentials.set(chatId, {
        customerToken: creds.customerToken,
        entityId: creds.entityId,
        agentCredentials: creds.agentCredentials,
        expiresAt: creds.expiresAt
      });
      
      return {
        customerToken: creds.customerToken,
        entityId: creds.entityId,
        agentCredentials: creds.agentCredentials,
        expiresAt: creds.expiresAt
      };
    }
    
    return null;
  } catch (error) {
    console.error('\n❌ Error getting dual credentials:', error);
    return null;
  }
}

// Add connection monitoring function to periodically check connection health
// This helps prevent connection timeouts
setInterval(() => {
  if (global.mongoConnection.client && global.mongoConnection.db) {
    // If no activity for 10 minutes, ping the database to keep connection alive
    const timeSinceLastUse = Date.now() - global.mongoConnection.lastUsed;
    if (timeSinceLastUse > 10 * 60 * 1000) { // 10 minutes
      try {
        // Ping database but don't log it to avoid cluttering logs
        global.mongoConnection.db.command({ ping: 1 })
          .then(() => {
            global.mongoConnection.lastUsed = Date.now();
          })
          .catch(error => {
            console.warn('\n⚠️ MongoDB ping failed, connection might be stale:', error.message);
            // Reset connection so next request creates a fresh one
            global.mongoConnection.client = null;
            global.mongoConnection.db = null;
          });
      } catch (error) {
        // Do nothing on errors to avoid crashing the app
      }
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes