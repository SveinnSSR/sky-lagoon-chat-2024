// contextSystem.js - Enhanced context management system

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
      activeTopicChain: [], // NEW: Track related topics in sequence
      topicRelationships: new Map(), // NEW: Track how topics relate to each other
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
      
      // ===== NEW: Enhanced Booking Context =====
      bookingContext: {
        hasBookingIntent: false,
        dates: [], // Track all mentioned dates
        preferredDate: null,
        dateModifications: [], // Track changes to dates
        lastDateMention: null,
        people: null,
        packages: null
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
 * Validates and provides information about a date mentioned in conversation
 * @param {string} dateString - The date string to validate
 * @returns {Object} - Date validation information
 */
export function validateDate(dateString) {
  try {
    // Extract date components
    const monthNames = ["january", "february", "march", "april", "may", "june", 
                      "july", "august", "september", "october", "november", "december"];
    
    // Extract year
    const yearMatch = dateString.match(/\b(202\d)\b/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
    
    // Extract month
    const monthMatch = dateString.toLowerCase().match(new RegExp(`\\b(${monthNames.join('|')})\\b`));
    const monthIndex = monthMatch ? monthNames.indexOf(monthMatch[1]) : -1;
    
    // Extract day
    const dayMatch = dateString.match(/\b(\d{1,2})(st|nd|rd|th)?\b/);
    const day = dayMatch ? parseInt(dayMatch[1]) : -1;
    
    // If we couldn't extract required components, return invalid
    if (monthIndex === -1 || day === -1) {
      return { isValid: false };
    }
    
    // Create a proper date object and validate it
    const dateObj = new Date(year, monthIndex, day);
    
    // Check if the date is valid (e.g., not February 30th)
    if (dateObj.getMonth() !== monthIndex || dateObj.getDate() !== day) {
      return { isValid: false };
    }
    
    // Get the day of week
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = daysOfWeek[dateObj.getDay()];
    
    console.log(`🗓️ Date Validation: ${dateString} in ${year} falls on ${dayOfWeek}`);
    
    return {
      isValid: true,
      year,
      month: monthNames[monthIndex],
      day,
      dayOfWeek,
      dateObject: dateObj,
      formattedDate: `${monthNames[monthIndex].charAt(0).toUpperCase() + monthNames[monthIndex].slice(1)} ${day}, ${year}`
    };
  } catch (error) {
    console.error('❌ Error validating date:', error);
    return { isValid: false, error: error.message };
  }
}

/**
 * Adds a message to the conversation history with enhanced context tracking
 * @param {Object} context - Session context
 * @param {Object} message - Message to add (role, content)
 */
export function addMessageToContext(context, message) {
  // Add message to history
  context.messages.push(message);
  
  // Update timestamps
  context.lastUpdated = new Date();
  context.lastInteraction = Date.now();
  
  // NEW: For very short messages, check if they match context patterns
  if (message.role === 'user' && message.content && message.content.split(' ').length <= 5) {
    const datePattern = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\b\d{1,2}(st|nd|rd|th)?\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\b/i;
    
    if (datePattern.test(message.content)) {
      // Validate the date to get accurate day of week information
      const dateValidation = validateDate(message.content);
      
      // If it's a valid date, log and store the information
      if (dateValidation && dateValidation.isValid) {
        console.log(`🧠 Date validated: ${dateValidation.formattedDate} (${dateValidation.dayOfWeek})`);
      }
      
      // Even if not fully valid, still track as a date mention
      console.log(`🧠 Date mention detected: "${message.content}"`);
      
      // Track in booking context if we have it
      if (!context.bookingContext) {
        context.bookingContext = {
          hasBookingIntent: false,
          dates: [],
          preferredDate: null,
          dateModifications: [],
          lastDateMention: null,
          people: null,
          packages: null
        };
      }
      
      context.bookingContext.lastDateMention = message.content;
      context.bookingContext.dates.push(message.content);
      
      // If it looks booking related, update booking intent
      if (context.lastTopic === 'booking' || context.topics.includes('booking')) {
        context.bookingContext.hasBookingIntent = true;
        
        // Also track modifications
        if (context.bookingContext.preferredDate && 
            context.bookingContext.preferredDate !== message.content) {
          context.bookingContext.dateModifications.push({
            previousDate: context.bookingContext.preferredDate,
            newDate: message.content,
            timestamp: Date.now()
          });
          
          console.log(`🧠 Date modification detected: "${context.bookingContext.preferredDate}" → "${message.content}"`);
        }
        
        context.bookingContext.preferredDate = message.content;
        context.lastTopic = 'booking';
      }
    }
  }
  
  // Keep a reasonable history size (10 messages)
  if (context.messages.length > 10) {
    context.messages = context.messages.slice(-10);
  }
}

/**
 * Detects topics from user message with enhanced relationship tracking
 * @param {Object} context - Session context
 * @param {string} message - User message
 */
export function updateTopicContext(context, message) {
  // Base topic patterns
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
  
  // NEW: Define related topics for better context maintenance
  const relatedTopics = {
    'booking': ['date', 'time', 'schedule', 'reservation', 'tickets'],
    'ritual': ['duration', 'steps', 'process', 'experience'],
    'transportation': ['directions', 'parking', 'bus', 'transfer'],
    'dining': ['food', 'restaurant', 'menu', 'bar'],
    'hours': ['open', 'close', 'schedule', 'time']
  };
  
  // Check for topics in the message
  let detectedTopics = [];
  for (const [topic, pattern] of Object.entries(topicPatterns)) {
    if (pattern.test(message) && !context.topics.includes(topic)) {
      context.topics.push(topic);
      detectedTopics.push(topic);
      
      // Also update lastTopic for backward compatibility
      context.lastTopic = topic;
      
      console.log(`🧠 New topic detected: "${topic}"`);
    }
  }
  
  // NEW: Check for date patterns in messages (for booking context)
  const datePattern = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\b\d{1,2}(st|nd|rd|th)?\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\b/i;
  if (datePattern.test(message)) {
    // Extract date information from message
    const dateMatches = message.match(datePattern);
    if (dateMatches && dateMatches.length > 0) {
      const dateInfo = dateMatches[0];
      
      // Add to booking context
      if (!context.bookingContext) {
        context.bookingContext = {
          hasBookingIntent: false,
          dates: [],
          preferredDate: null,
          dateModifications: [],
          lastDateMention: null
        };
      }
      
      // Update booking context with this date
      context.bookingContext.dates.push(dateInfo);
      context.bookingContext.lastDateMention = dateInfo;
      
      // If we have a booking topic, set this as preferred date
      if (context.topics.includes('booking') || context.lastTopic === 'booking') {
        context.bookingContext.preferredDate = dateInfo;
        context.bookingContext.hasBookingIntent = true;
      }
      
      console.log(`🧠 Date mention detected: "${dateInfo}"`);
    }
  }
  
  // NEW: Check for related topics to maintain context chains
  if (context.lastTopic && relatedTopics[context.lastTopic]) {
    for (const relatedTopic of relatedTopics[context.lastTopic]) {
      if (message.toLowerCase().includes(relatedTopic)) {
        // Keep track of related topics
        context.activeTopicChain = [context.lastTopic, relatedTopic];
        console.log(`🧠 Topic chain maintained: ${context.lastTopic} → ${relatedTopic}`);
        break;
      }
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
 * Gets relevant knowledge using vector search with enhanced context awareness
 * @param {string} message - User message
 * @param {Object} context - Session context
 * @returns {Promise<Array>} - Relevant knowledge entries with similarity scores
 */
export async function getVectorKnowledge(message, context) {
  try {
    console.log(`\n🔍 Performing vector search for: "${message}" in ${context.language}`);
    
    // Determine which language to use
    const language = context.language || 'en';
    
    // NEW: Enhance search query with context for short messages
    let searchQuery = message;
    
    // If this is a very short message and we have context, enhance the query
    if (message.split(' ').length <= 3 && context.lastTopic) {
      // For dates in booking context
      const datePattern = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\b\d{1,2}(st|nd|rd|th)?\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\b/i;
      
      if (datePattern.test(message) && context.lastTopic === 'booking') {
        // Enhance query with booking context
        searchQuery = `booking information for ${message}`;
        console.log(`\n🔍 Enhanced short query with booking context: "${searchQuery}"`);
      }
      // Add other context enhancements for different types of short messages
      else if (context.activeTopicChain && context.activeTopicChain.length > 0) {
        // Use the topic chain to enhance the query
        searchQuery = `${context.activeTopicChain.join(' ')} ${message}`;
        console.log(`\n🔍 Enhanced short query with topic chain: "${searchQuery}"`);
      }
    }
    
    // Import the vector search function from embeddings.js
    const { searchSimilarContent } = await import('./utils/embeddings.js');
    
    // Perform vector search with proper error handling
    const results = await searchSimilarContent(
      searchQuery,
      5,           // Top 5 results
      0.5,         // Similarity threshold
      language     // Language code (en/is)
    );
    
    // Validate results
    if (!results || !Array.isArray(results) || results.length === 0) {
      console.log(`\n🔍 No vector search results for "${searchQuery}"`);
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

/**
 * Extracts date information from a message
 * @param {string} message - User message
 * @returns {Object|null} - Extracted date information or null
 */
export function extractDateFromMessage(message) {
  // Simple date extraction - could be enhanced with a date parsing library
  const datePattern = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\b\d{1,2}(st|nd|rd|th)?\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\b/i;
  
  const matches = message.match(datePattern);
  if (!matches || matches.length === 0) return null;
  
  // Extract and normalize date information
  let dateInfo = matches[0];
  
  // Create a structured date object
  const result = {
    raw: dateInfo,
    normalized: dateInfo.toLowerCase(),
    timestamp: Date.now()
  };
  
  return result;
}

/**
 * Determines if a message is a date-only modification
 * @param {string} message - User message
 * @param {Object} context - Session context
 * @returns {boolean} - True if message is a date modification
 */
export function isDateModification(message, context) {
  // Check if message is very short
  if (message.split(' ').length > 5) return false;
  
  // Check if message contains date pattern
  const datePattern = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\b\d{1,2}(st|nd|rd|th)?\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\b/i;
  if (!datePattern.test(message)) return false;
  
  // Check if we have booking context
  if (!context.topics.includes('booking') && context.lastTopic !== 'booking') return false;
  
  // This is likely a date modification
  return true;
}