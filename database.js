// database.js
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

// MongoDB Connection
let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  try {
    // If we already have a connection, use it
    if (cachedClient && cachedDb) {
      console.log('Using cached database connection');
      return { client: cachedClient, db: cachedDb };
    }

    // Check for MongoDB URI
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable not set');
      throw new Error('Please define the MONGODB_URI environment variable');
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    // Cache the connection
    cachedClient = client;
    cachedDb = db;
    
    console.log('MongoDB connected successfully');
    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

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
    const { db } = await connectToDatabase();
    
    // Look for a matching message in the last 30 seconds
    const recentTimestamp = new Date(Date.now() - 30000);
    
    const match = await db.collection('recent_messages').findOne({
      chatId,
      messageText,
      timestamp: { $gte: recentTimestamp }
    });
    
    if (match) {
      console.log(`\n🔄 Found duplicate message in MongoDB: "${messageText.substring(0, 30)}..."`);
    }
    
    return !!match;
  } catch (error) {
    console.error('\n❌ Error checking for duplicate message:', error);
    return false; // On error, let message through
  }
}