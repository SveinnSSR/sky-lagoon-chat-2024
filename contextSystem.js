// contextSystem.js - Create this new file

// Import required dependencies
import { detectLanguage as oldDetectLanguage } from './knowledgeBase_is.js';
import { detectLanguage as newDetectLanguage } from './languageDetection.js';

// Store sessions in memory
const sessions = new Map();

/**
 * Gets or creates a session context with enhanced structure
 * @param {string} sessionId - Unique session ID
 * @returns {Object} - Session context
 */
export function getSessionContext(sessionId) {
  if (!sessions.has(sessionId)) {
    console.log(`🧠 Creating new session context for ${sessionId}`);
    
    // Initialize with a clean, structured format
    sessions.set(sessionId, {
      // ===== Core Messaging =====
      messages: [],
      
      // ===== Language Handling (Critical feature from old system) =====
      language: 'en',  // Default language code (en/is)
      languageInfo: {  // Detailed language detection information
        isIcelandic: false,
        confidence: 'medium',
        reason: 'default',
        lastUpdate: Date.now()
      },
      
      // ===== Enhanced Context Tracking (From BM Vallá) =====
      topics: [],
      userIntent: {
        mainGoal: null,
        projectDetails: {}
      },
      conversationSummary: "",
      
      // ===== Sky Lagoon Specific Context =====
      lastTopic: null,
      seasonalContext: {
        type: null,
        subtopic: null
      },
      
      // ===== Metadata =====
      createdAt: new Date(),
      lastUpdated: new Date(),
      lastInteraction: Date.now()
    });

    // Set up session expiration (24 hours)
    setTimeout(() => {
      if (sessions.has(sessionId)) {
        console.log(`🧠 Cleaning up inactive session ${sessionId}`);
        sessions.delete(sessionId);
      }
    }, 24 * 60 * 60 * 1000);
  }
  
  return sessions.get(sessionId);
}

/**
 * Updates the user's language preference in context
 * @param {Object} context - Session context
 * @param {string} message - User message
 * @returns {Object} - Updated language decision
 */
export function updateLanguageContext(context, message) {
  // Use new detection system first
  const languageDecision = newDetectLanguage(message, context);
  
  // Store language information
  if (languageDecision) {
    context.languageInfo = {
      isIcelandic: languageDecision.isIcelandic,
      confidence: languageDecision.confidence,
      reason: languageDecision.reason,
      lastUpdate: Date.now()
    };
    
    // Only set explicit language code for high confidence
    if (languageDecision.confidence === 'high') {
      context.language = languageDecision.isIcelandic ? 'is' : 'en';
    }
  }
  
  return languageDecision;
}

/**
 * Adds a message to the conversation history
 * @param {Object} context - Session context
 * @param {Object} message - Message to add (role, content)
 */
export function addMessageToContext(context, message) {
  // Add message to history
  context.messages.push(message);
  
  // Update timestamps
  context.lastUpdated = new Date();
  context.lastInteraction = Date.now();
  
  // Keep a reasonable history size (10 messages)
  if (context.messages.length > 10) {
    context.messages = context.messages.slice(-10);
  }
}

/**
 * Detects topics from user message
 * @param {Object} context - Session context
 * @param {string} message - User message
 */
export function updateTopicContext(context, message) {
  const topicPatterns = {
    // Sky Lagoon specific topics
    ritual: /(ritual|skjól|skjol)/i,
    packages: /(package|saman|sér|ser|pure|sky)/i,
    hours: /(hour|open|close|time|opin|opið|lokað|lokar)/i,
    transportation: /(transport|bus|shuttle|drive|transfer)/i,
    dining: /(restaurant|food|eat|drink|dine|dining|matur|veitingar)/i,
    facilities: /(facilities|changing|shower|lockers|búningsklef)/i,
    booking: /(book|reserve|bóka|panta)/i,
    weather: /(weather|cold|rain|snow|veður|rigning)/i
  };
  
  // Check for topics in the message
  for (const [topic, pattern] of Object.entries(topicPatterns)) {
    if (pattern.test(message) && !context.topics.includes(topic)) {
      context.topics.push(topic);
      
      // Also update lastTopic for backward compatibility
      context.lastTopic = topic;
      
      console.log(`🧠 New topic detected: "${topic}"`);
    }
  }
  
  return context.topics;
}

/**
 * Get all active sessions
 * @returns {Map} - All active sessions
 */
export function getAllSessions() {
  return sessions;
}

/**
 * Gets relevant knowledge using vector search
 * @param {string} message - User message
 * @param {Object} context - Session context
 * @returns {Promise<Array>} - Relevant knowledge entries with similarity scores
 */
export async function getVectorKnowledge(message, context) {
  try {
    console.log(`\n🔍 Performing vector search for: "${message}" in ${context.language}`);
    
    // Determine which language to use
    const language = context.language || 'en';
    
    // Import the vector search function from embeddings.js
    const { searchSimilarContent } = await import('./utils/embeddings.js');
    
    // Perform vector search with proper error handling
    const results = await searchSimilarContent(
      message,
      5,           // Top 5 results
      0.5,         // Similarity threshold
      language     // Language code (en/is)
    );
    
    // Validate results
    if (!results || !Array.isArray(results) || results.length === 0) {
      console.log(`\n🔍 No vector search results for "${message}"`);
      return [];
    }
    
    console.log(`\n🔍 Found ${results.length} vector search results`);
    
    // Transform and normalize results to expected format
    const transformedResults = results.map(result => ({
      type: result.metadata?.type || 'unknown',
      content: result.content,
      metadata: result.metadata || {},
      similarity: result.similarity
    }));
    
    return normalizeVectorResults(transformedResults);
    
  } catch (error) {
    console.error('\n❌ Error in vector search:', error);
    console.error('\n❌ Stack trace:', error.stack);
    return []; // Return empty array on error
  }
}

/**
 * Normalizes vector search results to match expected format
 * @param {Array} results - Vector search results
 * @returns {Array} - Normalized results that match expected structure
 */
export function normalizeVectorResults(results) {
  if (!results || !Array.isArray(results)) {
    return [];
  }
  
  return results.map(result => {
    // Ensure each result has a type and content
    const normalized = {
      type: result.metadata?.type || result.type || 'unknown',
      content: result.content || {},
    };
    
    // Add other properties if they exist
    if (result.similarity !== undefined) {
      normalized.similarity = result.similarity;
    }
    
    if (result.metadata) {
      normalized.metadata = result.metadata;
    }
    
    return normalized;
  });
}

// Additional helper functions can be added here as needed
