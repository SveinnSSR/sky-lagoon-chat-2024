// sessionManager.js
import { connectToDatabase } from './database.js';

// Define session timeout (20 minutes - updated for better UX)
const SESSION_TIMEOUT = 20 * 60 * 1000; 

// Create a global session cache
if (!global.sessionCache) {
  global.sessionCache = new Map();
}

/**
 * Get or create a persistent session from MongoDB
 * Enhanced with session timeout and better conversation separation
 * Uses the frontend session ID to maintain conversation continuity
 * FIXED: Now generates STABLE conversation IDs that persist across messages
 * 
 * @param {string} sessionId - The client session ID
 * @returns {Promise<Object>} Session information
 */
export async function getOrCreateSession(sessionId) {
  try {
    // Use provided sessionId or generate a new one
    const frontendSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    
    console.log(`🔍 Session lookup for: ${frontendSessionId}`);
    
    // Check local cache first - this prevents generating new sessions during temporary DB issues
    if (global.sessionCache.has(frontendSessionId)) {
      const cachedSession = global.sessionCache.get(frontendSessionId);
      
      // TIMEOUT CHECK: If the session has been inactive longer than the timeout period, create a new session
      const lastActivity = new Date(cachedSession.lastActivity).getTime();
      const currentTime = Date.now();
      
      if (currentTime - lastActivity > SESSION_TIMEOUT) {
        console.log(`⏰ Session timeout detected for ${frontendSessionId} (${Math.round((currentTime - lastActivity)/1000/60)} minutes inactive)`);
        
        // Generate a new unique conversation ID that includes the original session ID for traceability
        // CRITICAL: Only add timestamp on TIMEOUT, not on every message
        const newConversationId = `${frontendSessionId}_timeout_${Date.now()}`;
        
        // Create a new session with the timeout marker
        const timeoutSession = {
          sessionId: frontendSessionId, // Keep the same session ID for frontend consistency
          conversationId: newConversationId, // Use a new conversation ID to separate in analytics
          startedAt: new Date().toISOString(),
          lastActivity: Date.now(),
          isNewSession: true
        };
        
        // Cache the new session
        global.sessionCache.set(frontendSessionId, timeoutSession);
        console.log(`🆕 Created timeout session with new conversation ID: ${newConversationId}`);
        
        // Try to update this in MongoDB too
        try {
          const dbConnection = await connectToDatabase();
          const db = dbConnection.db;
          const globalSessionCollection = db.collection('globalSessions');
          
          await globalSessionCollection.insertOne({
            type: 'chat_session',
            frontendSessionId: frontendSessionId,
            frontendSessionIds: [frontendSessionId],
            sessionId: frontendSessionId,
            conversationId: newConversationId,
            startedAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            previousConversationId: cachedSession.conversationId,
            isTimeoutSession: true
          });
        } catch (dbError) {
          console.error('❌ Error updating MongoDB with timeout session:', dbError);
          // Continue with the cached timeout session anyway
        }
        
        return timeoutSession;
      }
      
      // If no timeout, update the last activity time and return the cached session
      // CRITICAL: Return SAME conversationId - don't create a new one!
      cachedSession.lastActivity = Date.now();
      global.sessionCache.set(frontendSessionId, cachedSession);
      console.log(`🔄 Using cached session: ${cachedSession.conversationId} for frontend session: ${frontendSessionId}`);
      
      // Try to update last activity in MongoDB too
      try {
        const dbConnection = await connectToDatabase();
        const db = dbConnection.db;
        const globalSessionCollection = db.collection('globalSessions');
        
        await globalSessionCollection.updateOne(
          { conversationId: cachedSession.conversationId },
          { $set: { lastActivity: new Date().toISOString() } }
        );
      } catch (dbError) {
        console.warn('⚠️ Could not update session activity time in MongoDB:', dbError);
        // Continue with the cached session anyway
      }
      
      return cachedSession;
    }
    
    // Connect to MongoDB
    let db;
    try {
      const dbConnection = await connectToDatabase();
      db = dbConnection.db;
    } catch (dbConnectionError) {
      console.error('❌ Error connecting to MongoDB:', dbConnectionError);
      // Instead of throwing the error, create a session but cache it
      // FIXED: Use stable ID without timestamp for temp sessions
      const tempSession = {
        sessionId: frontendSessionId, // Use the frontend session ID directly!
        conversationId: `${frontendSessionId}_temp`, // STABLE - no timestamp unless timeout
        startedAt: new Date().toISOString(),
        lastActivity: Date.now()
      };
      
      // Cache this session
      global.sessionCache.set(frontendSessionId, tempSession);
      console.log(`⚠️ Created temporary session: ${tempSession.conversationId} due to DB connection error`);
      return tempSession;
    }
    
    // Try to find an existing session for this frontend session
    const globalSessionCollection = db.collection('globalSessions');
    let existingSession = null;
    
    try {
      existingSession = await globalSessionCollection.findOne({ 
        frontendSessionId: frontendSessionId 
      });
    } catch (findError) {
      console.error('❌ Error finding session:', findError);
      // Continue with existingSession as null
    }
    
    const now = new Date();
    
    // If we found an existing session for this frontend session, check for timeout
    if (existingSession && existingSession.conversationId) {
      // TIMEOUT CHECK: If the session has been inactive longer than the timeout period, create a new session
      const lastActivity = new Date(existingSession.lastActivity).getTime();
      const currentTime = now.getTime();
      
      if (currentTime - lastActivity > SESSION_TIMEOUT) {
        console.log(`⏰ Session timeout detected in DB for ${frontendSessionId} (${Math.round((currentTime - lastActivity)/1000/60)} minutes inactive)`);
        
        // Generate a new unique conversation ID
        // CRITICAL: Only add timestamp on TIMEOUT
        const newConversationId = `${frontendSessionId}_timeout_${Date.now()}`;
        
        // Create a new session record
        const newSession = {
          type: 'chat_session',
          frontendSessionId: frontendSessionId,
          frontendSessionIds: [frontendSessionId],
          sessionId: frontendSessionId, // Keep the same session ID for frontend consistency
          conversationId: newConversationId, // New conversation ID for analytics
          startedAt: now.toISOString(),
          lastActivity: now.toISOString(),
          previousConversationId: existingSession.conversationId,
          isTimeoutSession: true
        };
        
        try {
          await globalSessionCollection.insertOne(newSession);
          console.log(`🆕 Created timeout session in DB with new conversation ID: ${newConversationId}`);
        } catch (insertError) {
          console.warn('⚠️ Could not save timeout session to MongoDB:', insertError);
        }
        
        const sessionInfo = {
          sessionId: newSession.sessionId,
          conversationId: newSession.conversationId,
          startedAt: newSession.startedAt,
          lastActivity: Date.now(),
          isNewSession: true
        };
        
        // Cache this session for future use
        global.sessionCache.set(frontendSessionId, sessionInfo);
        
        return sessionInfo;
      }
      
      // If no timeout, use the existing session and update last activity
      // CRITICAL: Return SAME conversationId from database!
      console.log(`🔄 Using existing session: ${existingSession.conversationId} for frontend session: ${frontendSessionId}`);
      
      // Update last activity time
      try {
        await globalSessionCollection.updateOne(
          { conversationId: existingSession.conversationId },
          { $set: { lastActivity: now.toISOString() } }
        );
      } catch (updateError) {
        console.warn('⚠️ Could not update session activity time:', updateError);
      }
      
      const sessionInfo = {
        sessionId: existingSession.sessionId,
        conversationId: existingSession.conversationId,
        startedAt: existingSession.startedAt,
        lastActivity: Date.now()
      };
      
      // Cache this session for future use
      global.sessionCache.set(frontendSessionId, sessionInfo);
      
      return sessionInfo;
    }

    // Create a new session if no matching session was found
    // Use a new conversation ID that includes the frontend session ID plus timestamp for uniqueness
    // FIXED: Use stable suffix instead of timestamp for first-time sessions
    const newConversationId = `${frontendSessionId}_new`;
    
    const newSession = {
      type: 'chat_session',
      frontendSessionId: frontendSessionId, // Store the frontend session ID
      frontendSessionIds: [frontendSessionId], // Keep track of all associated session IDs
      sessionId: frontendSessionId, // Use the frontend session ID directly
      conversationId: newConversationId, // Use a unique conversation ID
      startedAt: now.toISOString(),
      lastActivity: now.toISOString()
    };
    
    // Save to MongoDB
    try {
      await globalSessionCollection.insertOne(newSession);
      console.log(`🌐 Created new session: ${newSession.conversationId} for frontend session: ${frontendSessionId}`);
    } catch (insertError) {
      console.warn('⚠️ Could not save new session to MongoDB:', insertError);
    }
    
    const sessionInfo = {
      sessionId: newSession.sessionId,
      conversationId: newSession.conversationId,
      startedAt: newSession.startedAt,
      lastActivity: Date.now(),
      isNewSession: true
    };
    
    // Cache this session for future use
    global.sessionCache.set(frontendSessionId, sessionInfo);
    
    return sessionInfo;
  } catch (error) {
    console.error('❌ Error with session management:', error);
    
    // Create a fallback session using the frontend session ID plus timestamp
    // FIXED: Use stable suffix for fallback sessions
    const fallbackConversationId = `${sessionId || 'unknown'}_fallback`;
    
    const fallbackSession = {
      sessionId: sessionId || `emergency_${Date.now()}`, 
      conversationId: fallbackConversationId, 
      startedAt: new Date().toISOString(),
      lastActivity: Date.now()
    };
    
    // Cache this session
    global.sessionCache.set(sessionId || `emergency_${Date.now()}`, fallbackSession);
    
    console.log(`⚠️ Using fallback session: ${fallbackSession.conversationId}`);
    return fallbackSession;
  }
}

/**
 * Force create a new conversation (called when user clicks "New Chat")
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} New session information
 */
export async function createNewConversation(sessionId) {
  const frontendSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  
  // Generate a NEW conversation ID with timestamp (explicit new chat)
  const newConversationId = `${frontendSessionId}_new_${Date.now()}`;
  
  const newSession = {
    sessionId: frontendSessionId,
    conversationId: newConversationId,
    startedAt: new Date().toISOString(),
    lastActivity: Date.now(),
    isNewSession: true
  };
  
  // Update cache
  global.sessionCache.set(frontendSessionId, newSession);
  console.log(`🆕 User started NEW chat: ${newConversationId}`);
  
  // Update MongoDB
  try {
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    
    await db.collection('globalSessions').insertOne({
      type: 'chat_session',
      frontendSessionId: frontendSessionId,
      sessionId: frontendSessionId,
      conversationId: newConversationId,
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      isUserInitiated: true
    });
  } catch (dbError) {
    console.error('❌ Error saving new conversation:', dbError);
  }
  
  return newSession;
}

/**
 * Checks if a session exists
 * @param {string} sessionId - Session ID to check
 * @returns {boolean} - Whether session exists
 */
export function sessionExists(sessionId) {
  return global.sessionCache.has(sessionId);
}

/**
 * Gets all active sessions
 * @returns {Map} - Map of all active sessions
 */
export function getAllSessions() {
  return global.sessionCache;
}

// Export default for ESM compatibility
export default {
  getOrCreateSession,
  createNewConversation,
  sessionExists,
  getAllSessions
};