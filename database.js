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