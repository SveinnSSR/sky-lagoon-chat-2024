// messageProcessor.js - Single source of truth for message handling

import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from './database.js';
import { normalizeConversation, normalizeMessage } from './dataModels.js';
import { getOrCreateSession } from './sessionManager.js';

// Deduplication cache
const processedMessages = new Set();

// Cache for tracking which messages have been sent to the analytics system
const analyticsSentMessages = new Map();

/**
 * Process a message pair (user message + bot response) with deduplication
 * 
 * This is the main entry point for all message processing in the system
 * 
 * @param {string} userMessage - The user's message
 * @param {string} botResponse - The bot's response
 * @param {Object} metadata - Additional metadata about the interaction
 * @returns {Promise<Object>} Processing result with IDs and status
 */
export async function processMessagePair(userMessage, botResponse, metadata = {}) {
  try {
    // Log detailed information about the message pair
    console.log(`\n📨 Processing message pair: 
      User: ${userMessage.substring(0, 30)}${userMessage.length > 30 ? '...' : ''}
      Bot: ${botResponse.substring(0, 30)}${botResponse.length > 30 ? '...' : ''}
      SessionID: ${metadata.sessionId || 'none'}
      Language: ${metadata.language || 'en'}`
    );

    // CRITICAL VALIDATION: Ensure we have both messages
    if (!userMessage || !botResponse) {
      console.error('❌ Missing message content - cannot process incomplete pair');
      return { 
        success: false, 
        error: 'incomplete_message_pair',
        reason: 'Both user message and bot response are required'
      };
    }

    // Get session information from the session manager
    const sessionInfo = await getOrCreateSession(metadata.sessionId);
    console.log(`📊 Using session ID: ${sessionInfo.sessionId}, conversation ID: ${sessionInfo.conversationId}`);

    // DEDUPLICATION CHECK: Create a unique signature for this message pair
    const messageSignature = `${sessionInfo.conversationId}:${userMessage.substring(0, 40)}:${botResponse.substring(0, 40)}`;
    
    // Check if we've already processed this exact message pair recently
    if (processedMessages.has(messageSignature)) {
      console.log(`⚠️ Prevented duplicate message processing: ${messageSignature}`);
      return { 
        success: false, 
        error: 'duplicate_message',
        reason: 'This exact message pair was recently processed'
      };
    }

    // Add to processed messages set for deduplication
    processedMessages.add(messageSignature);

    // Cleanup old entries occasionally
    if (processedMessages.size > 1000) {
      const oldEntries = Array.from(processedMessages).slice(0, 500);
      oldEntries.forEach(entry => processedMessages.delete(entry));
    }

    // Generate unique, trackable IDs for both messages
    // USING uuidv4: Add additional uniqueness to message IDs
    const userMessageId = `user-msg-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const botMessageId = `bot-msg-${Date.now() + 1}-${uuidv4().substring(0, 8)}`; // Ensure different timestamps

    // Create normalized messages
    const normalizedUserMessage = normalizeMessage({
      id: userMessageId,
      content: userMessage,
      role: 'user',
      sender: 'user',
      timestamp: new Date().toISOString(),
      language: metadata.language || 'en'
    });

    const normalizedBotMessage = normalizeMessage({
      id: botMessageId,
      content: botResponse,
      role: 'assistant',
      sender: 'bot',
      timestamp: new Date(Date.now() + 1).toISOString(), // 1ms later for ordering
      language: metadata.language || 'en'
    });

    // Create a conversation object using the normalized messages
    const conversationData = normalizeConversation({
      id: sessionInfo.conversationId,
      sessionId: sessionInfo.sessionId,
      clientId: metadata.clientId || 'sky-lagoon',
      messages: [normalizedUserMessage, normalizedBotMessage],
      startedAt: sessionInfo.startedAt,
      endedAt: new Date().toISOString(),
      language: metadata.language || 'en',
      topic: metadata.topic || 'general',
      status: 'active'
    });

    // Log normalized data for debugging
    console.log(`\n✅ Message pair normalized successfully:
      ConversationID: ${conversationData.id}
      UserMessageID: ${userMessageId}
      BotMessageID: ${botMessageId}
      Topic: ${metadata.topic || 'general'}`
    );

    // Save conversation to MongoDB for persistence
    await saveConversationToMongoDB(conversationData);

    // Send conversation to analytics system
    const analyticsResult = await sendConversationToAnalytics(conversationData);

    // Return success with message IDs and PostgreSQL ID (for feedback)
    return {
      success: true,
      conversationId: sessionInfo.conversationId,
      userMessageId: userMessageId,
      botMessageId: botMessageId,
      postgresqlId: analyticsResult?.postgresqlId || null
    };
  } catch (error) {
    console.error('❌ Error processing message pair:', error);
    console.error('Stack trace:', error.stack);
    return { 
      success: false, 
      error: 'processing_error',
      reason: error.message
    };
  }
}

/**
 * Save conversation data to MongoDB for persistent storage
 * 
 * @param {Object} conversationData - Normalized conversation data
 * @returns {Promise<boolean>} Success status
 */
async function saveConversationToMongoDB(conversationData) {
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // Check if conversation exists
    const existingConvo = await db.collection('conversations').findOne({
      id: conversationData.id
    });
    
    if (existingConvo) {
      // Update existing conversation with new messages
      await db.collection('conversations').updateOne(
        { id: conversationData.id },
        { 
          $push: { 
            messages: { 
              $each: conversationData.messages 
            } 
          },
          $set: {
            endedAt: conversationData.endedAt,
            lastActivity: new Date()
          }
        }
      );
      
      console.log(`💾 Updated existing conversation: ${conversationData.id}`);
    } else {
      // Insert new conversation
      await db.collection('conversations').insertOne({
        ...conversationData,
        createdAt: new Date(),
        lastActivity: new Date()
      });
      
      console.log(`💾 Created new conversation: ${conversationData.id}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error saving to MongoDB:', error);
    // Don't throw - continue processing even if DB storage fails
    return false;
  }
}

/**
 * Send conversation data to analytics system via its API
 * 
 * @param {Object} conversationData - Normalized conversation data
 * @returns {Promise<Object>} Analytics result with PostgreSQL ID
 */
async function sendConversationToAnalytics(conversationData) {
  try {
    // DEDUPLICATION CHECK: Create signature for this specific message set
    const botMessages = conversationData.messages.filter(m => m.role === 'assistant' || m.type === 'bot');
    
    if (botMessages.length > 0) {
      // Create signature based on content and timestamps
      const messageSignature = botMessages.map(m => 
        `${m.content?.substring(0, 50)}-${m.timestamp}`
      ).join('|');
      
      // Check if we've already sent these exact bot messages
      const previouslySent = analyticsSentMessages.get(messageSignature);
      
      if (previouslySent) {
        const timeSinceLastSent = Date.now() - previouslySent.timestamp;
        console.log(`🔍 Preventing duplicate analytics send. Same bot messages sent ${timeSinceLastSent}ms ago.`);
        
        // Return the previously recorded PostgreSQL ID so feedback still works
        return { 
          success: true, 
          postgresqlId: previouslySent.postgresqlId,
          deduplicated: true
        };
      }
    }

    // Log payload for analytics debugging
    console.log(`📤 Sending to analytics:
      ConversationID: ${conversationData.id}
      SessionID: ${conversationData.sessionId}
      MessageCount: ${conversationData.messages.length}
      Topic: ${conversationData.topic || 'general'}`
    );
    
    // Make HTTP request to analytics API
    const analyticsResponse = await fetch('https://hysing.svorumstrax.is/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANALYTICS_API_KEY || 'sky-lagoon-secret-2024'
      },
      body: JSON.stringify(conversationData)
    });
    
    // Process the response from analytics system
    if (analyticsResponse.ok) {
      try {
        const responseData = await analyticsResponse.json();
        console.log('✅ Analytics API response received');
        
        // Extract PostgreSQL message IDs for mapping
        let botMessagePostgresqlId = null;

        if (responseData && responseData.messages && Array.isArray(responseData.messages)) {
          console.log(`✅ Received ${responseData.messages.length} message IDs from analytics`);
          
          // Connect to MongoDB for ID mapping
          const { db } = await connectToDatabase();
          
          // Process each message ID mapping
          for (let i = 0; i < responseData.messages.length; i++) {
            const pgMessage = responseData.messages[i];
            const originalMessage = conversationData.messages[i];
            
            if (pgMessage && pgMessage.id && originalMessage && originalMessage.id) {
              // Store mapping between MongoDB ID and PostgreSQL ID
              await db.collection('message_id_mappings').insertOne({
                mongodbId: originalMessage.id,
                postgresqlId: pgMessage.id,
                content: originalMessage.content || '',
                createdAt: new Date()
              });
              
              console.log(`✅ Created ID mapping: ${originalMessage.id} -> ${pgMessage.id}`);
              
              // Store the PostgreSQL ID for bot messages
              if (originalMessage.role === 'assistant' || originalMessage.type === 'bot') {
                botMessagePostgresqlId = pgMessage.id;
              }
            }
          }
          
          // Record this message set as processed to prevent future duplicates
          if (botMessages.length > 0) {
            const messageSignature = botMessages.map(m => 
              `${m.content?.substring(0, 50)}-${m.timestamp}`
            ).join('|');
            
            analyticsSentMessages.set(messageSignature, {
              timestamp: Date.now(),
              postgresqlId: botMessagePostgresqlId
            });
            
            // Cleanup old entries occasionally
            if (analyticsSentMessages.size > 500) {
              const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
              for (const [key, value] of analyticsSentMessages.entries()) {
                if (value.timestamp < oneDayAgo) {
                  analyticsSentMessages.delete(key);
                }
              }
            }
          }
        }

        return { 
          success: true, 
          postgresqlId: botMessagePostgresqlId 
        };
      } catch (parseError) {
        console.error('❌ Error parsing analytics response:', parseError);
        // Return success if we sent the data but couldn't parse the response
        return { success: true, postgresqlId: null };
      }
    } else {
      // Handle API error
      const responseText = await analyticsResponse.text();
      console.error('❌ Error from analytics system:', responseText);
      return { success: false, postgresqlId: null };
    }
  } catch (error) {
    console.error('❌ Error sending to analytics:', error);
    return { success: false, postgresqlId: null };
  }
}

/**
 * Get feedback history for a specific message
 * 
 * @param {string} messageId - MongoDB or PostgreSQL message ID
 * @returns {Promise<Object|null>} Feedback data or null
 */
export async function getMessageFeedback(messageId) {
  try {
    console.log(`🔍 Looking up feedback for message: ${messageId}`);
    
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // Try to find mapping first (in case this is a MongoDB ID)
    const mapping = await db.collection('message_id_mappings').findOne({
      $or: [
        { mongodbId: messageId },
        { postgresqlId: messageId }
      ]
    });
    
    // Get the PostgreSQL ID from mapping or use messageId directly
    const pgId = mapping?.postgresqlId || messageId;
    
    // Look up feedback in MongoDB
    const feedback = await db.collection('message_feedback').findOne({
      $or: [
        { messageId: messageId },
        { postgresqlId: pgId }
      ]
    });
    
    // If found in MongoDB, return it
    if (feedback) {
      console.log(`✅ Found feedback in MongoDB: ${feedback.isPositive ? 'Positive' : 'Negative'}`);
      return {
        rating: feedback.isPositive,
        timestamp: feedback.timestamp || feedback.createdAt,
        comment: feedback.comment
      };
    }
    
    // If not in MongoDB, try the analytics API
    const apiResponse = await fetch(`https://hysing.svorumstrax.is/api/feedback/message?messageId=${encodeURIComponent(pgId)}`, {
      headers: {
        'x-api-key': process.env.ANALYTICS_API_KEY || 'sky-lagoon-secret-2024'
      }
    });
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      if (apiData && apiData.rating !== undefined) {
        console.log(`✅ Found feedback in Analytics API: ${apiData.rating ? 'Positive' : 'Negative'}`);
        return {
          rating: apiData.rating,
          timestamp: apiData.timestamp || new Date().toISOString(),
          comment: apiData.comment
        };
      }
    }
    
    // No feedback found
    console.log(`⚠️ No feedback found for message: ${messageId}`);
    return null;
    
  } catch (error) {
    console.error('❌ Error getting message feedback:', error);
    return null;
  }
}

/**
 * Submit feedback for a message
 * 
 * @param {string} messageId - MongoDB message ID
 * @param {boolean} isPositive - Whether feedback is positive
 * @param {string} comment - Optional feedback comment
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Result with success status
 */
export async function submitMessageFeedback(messageId, isPositive, comment = null, metadata = {}) {
  try {
    console.log(`📝 Submitting ${isPositive ? 'positive' : 'negative'} feedback for message: ${messageId}`);
    
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // Find mapping if it exists
    const mapping = await db.collection('message_id_mappings').findOne({
      mongodbId: messageId
    });
    
    const postgresqlId = mapping?.postgresqlId || null;
    
    // Store feedback in MongoDB
    await db.collection('message_feedback').insertOne({
      messageId,
      postgresqlId,
      isPositive,
      comment,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        source: 'message_processor'
      }
    });
    
    console.log(`💾 Feedback saved to MongoDB`);
    
    // Send feedback to analytics system
    try {
      console.log(`📤 Forwarding feedback to analytics system`);
      
      const analyticsResponse = await fetch('https://hysing.svorumstrax.is/api/public-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANALYTICS_API_KEY || 'sky-lagoon-secret-2024'
        },
        body: JSON.stringify({
          messageId: postgresqlId || messageId,
          rating: isPositive,
          comment,
          // Include additional metadata
          source: 'message_processor',
          timestamp: new Date().toISOString()
        })
      });
      
      if (analyticsResponse.ok) {
        console.log('✅ Feedback successfully forwarded to analytics');
      } else {
        console.warn('⚠️ Analytics feedback API returned non-OK response:', analyticsResponse.status);
      }
      
    } catch (analyticsError) {
      console.warn('⚠️ Could not forward feedback to analytics:', analyticsError.message);
      // Continue even if analytics fails - we already stored in MongoDB
    }
    
    return {
      success: true,
      messageId,
      postgresqlId
    };
    
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Creates or updates mapping between MongoDB and PostgreSQL IDs
 * 
 * @param {string} mongodbId - MongoDB message ID
 * @param {string} postgresqlId - PostgreSQL message ID
 * @param {string} content - Optional message content for validation
 * @returns {Promise<Object>} Result with success status
 */
export async function createMessageIdMapping(mongodbId, postgresqlId, content = null) {
  try {
    // USING uuidv4: Add fallback ID generation
    if (!mongodbId) mongodbId = `mongo-${uuidv4()}`;
    if (!postgresqlId) postgresqlId = `pg-${uuidv4()}`;
    
    console.log(`🔗 Creating mapping: ${mongodbId} -> ${postgresqlId}`);
    
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // Check if mapping already exists
    const existingMapping = await db.collection('message_id_mappings').findOne({
      $or: [
        { mongodbId },
        { postgresqlId }
      ]
    });
    
    if (existingMapping) {
      // Update existing mapping
      await db.collection('message_id_mappings').updateOne(
        { _id: existingMapping._id },
        { 
          $set: { 
            mongodbId, 
            postgresqlId,
            ...(content ? { content } : {}),
            updatedAt: new Date()
          } 
        }
      );
      
      console.log(`✅ Updated existing mapping: ${mongodbId} -> ${postgresqlId}`);
      return {
        success: true,
        updated: true,
        mapping: {
          mongodbId,
          postgresqlId
        }
      };
    } else {
      // Create new mapping with a UUID-based ID if needed
      const result = await db.collection('message_id_mappings').insertOne({
        mongodbId,
        postgresqlId,
        ...(content ? { content } : {}),
        // USING uuidv4: Add a unique tracking ID for this mapping
        trackingId: uuidv4(),
        createdAt: new Date()
      });
      
      console.log(`✅ Created new mapping: ${mongodbId} -> ${postgresqlId}`);
      return {
        success: true,
        created: true,
        mapping: {
          mongodbId,
          postgresqlId,
          _id: result.insertedId
        }
      };
    }
    
  } catch (error) {
    console.error('❌ Error creating message ID mapping:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  processMessagePair,
  getMessageFeedback,
  submitMessageFeedback,
  createMessageIdMapping
};