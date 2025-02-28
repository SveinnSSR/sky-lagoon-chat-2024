// api/feedback.js
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { messageId, isPositive, messageContent, timestamp, chatId, language } = req.body;
    
    // Connect to MongoDB (adjust your connection string)
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    // Determine message type (simplified version)
    const messageType = 'general';
    
    // Store feedback in database
    await db.collection('message_feedback').insertOne({
      messageId,
      isPositive,
      messageContent,
      messageType,
      timestamp: new Date(timestamp),
      chatId,
      language,
      createdAt: new Date()
    });
    
    await client.close();
    
    return res.status(200).json({
      success: true,
      message: 'Feedback stored successfully',
      messageType: messageType
    });
  } catch (error) {
    console.error('Error storing feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to store feedback'
    });
  }
}
