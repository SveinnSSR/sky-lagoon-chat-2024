// contextSystem.js - Enhanced context management system

// Import required dependencies
import { detectLanguage as oldDetectLanguage } from './knowledgeBase_is.js';
import { detectLanguage as newDetectLanguage } from './languageDetection.js';

// Store sessions in memory
const sessions = new Map();

// Constants - Migrated from index.js
const MAX_CONTEXT_MESSAGES = 10; // Maximum messages to keep in history
const CONTEXT_MEMORY_LIMIT = 5;  // Keep last 5 interactions

// Enhanced context tracking patterns - Migrated from index.js
const CONTEXT_PATTERNS = {
    reference: {
        en: [
            'you mentioned',
            'as discussed',
            'like you said',
            'about that',
            'regarding',
            'as for',
            'speaking of'
        ],
        is: [
            'þú nefndir',
            'eins og við ræddum',
            'varðandi það',
            'um það',
            'hvað varðar',
            'talandi um'
        ]
    },
    followUp: {
        en: [
            'what about',
            'and then',
            'what else',
            'how about',
            'tell me more about'
        ],
        is: [
            'hvað með',
            'og svo',
            'hvað fleira',
            'segðu mér meira um'
        ]
    }
};

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
      
      // ===== Sky Lagoon Specific Context =====
      lastTopic: null,
      lastResponse: null,
      conversationStarted: true,
      messageCount: 0,
      
      // ===== MIGRATED: Legacy system fields =====
      bookingTime: null,
      lateArrival: null,
      conversationMemory: {
        topics: [],
        lastResponse: null,
        contextualQuestions: {},
        previousInteractions: [],
        addTopic: function(topic, details) {
          this.topics.unshift({ 
            topic, 
            details, 
            timestamp: Date.now(),
            language: sessions.get(sessionId).language
          });
          if (this.topics.length > 5) this.topics.pop();
        },
        getLastTopic: function() {
          return this.topics[0]?.topic || null;
        },
        getTopicDetails: function(topic) {
          return this.topics.find(t => t.topic === topic)?.details || null;
        }
      },
      
      // ===== MIGRATED: Late arrival tracking =====
      lateArrivalContext: {
        isLate: false,
        type: null,
        minutes: null,
        lastUpdate: null,
        previousResponses: [],
        addResponse: function(response) {
          this.previousResponses.unshift({
            response,
            timestamp: Date.now(),
            language: sessions.get(sessionId).language
          });
          if (this.previousResponses.length > 3) this.previousResponses.pop();
        },
        hasRecentInteraction: function() {
          return this.lastUpdate && 
                 (Date.now() - this.lastUpdate) < 5 * 60 * 1000;
        }
      },
      
      // ===== MIGRATED: Time tracking context =====
      timeContext: {
        bookingTime: null,
        activityDuration: {
          ritual: 45,
          dining: 60,
          bar: 30
        },
        sequence: [],
        lastDiscussedTime: null
      },
      
      // ===== MIGRATED: Question context tracking =====
      lastQuestion: null,
      lastAnswer: null,
      prevQuestions: [],
      contextualReferences: [],
      relatedTopics: [],
      questionContext: null,
      
      // ===== MIGRATED: Greeting and acknowledgment tracking =====
      selectedGreeting: null,
      isFirstGreeting: true,
      selectedAcknowledgment: null,
      isAcknowledgment: false,
      
      // ===== Enhanced Seasonal Context (Merged from both systems) =====
      seasonalContext: {
        type: null,
        subtopic: null,
        lastFollowUp: null,
        previousSeason: null,
        holidayContext: {
          isHoliday: false,
          holidayType: null,
          specialHours: null
        },
        transitionDate: null,
        currentInfo: null
      },
      currentSeason: null,
      
      // ===== MIGRATED: Other specialized context =====
      referenceContext: null,
      lateArrivalScenario: null,
      soldOutStatus: false,
      lastTransition: null,
      bookingModification: {
        requested: false,
        type: null,
        originalTime: null
      },
      
      // ===== Enhanced Booking Context (Merged from both systems) =====
      bookingContext: {
        hasBookingIntent: false,
        dates: [], // Track all mentioned dates
        preferredDate: null,
        dateModifications: [], // Track changes to dates
        lastDateMention: null,
        people: null,
        packages: null,
        
        // MIGRATED: Availability tracking
        availabilityQuery: false,
        dayMentioned: null
      },
      
      // ===== NEW: Track used vector queries to improve context =====
      vectorQueryHistory: [],
      
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
    
    // ENHANCED: Stronger language persistence logic from legacy system
    const previousLanguage = context.language;
    
    // Only override language in specific cases
    if (languageDecision.confidence === 'high') {
      // Strong signal to change language
      context.language = languageDecision.isIcelandic ? 'is' : 'en';
    } else if (previousLanguage === 'is') {
      // If previous context was Icelandic, maintain it strongly
      context.language = 'is';
    } else if (/[þæðöáíúéó]/i.test(message)) {
      // If message contains Icelandic characters, set to Icelandic
      context.language = 'is';
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
  
  // Increment message count (from legacy system)
  context.messageCount++;
  
  // MIGRATED: Enhanced conversation memory tracking from legacy system
  if (message.role === 'user') {
    // Store question and update history
    context.lastQuestion = message.content;
    context.prevQuestions = [
      ...(context.prevQuestions || []).slice(-2),
      message.content
    ];

    // Add to conversation memory
    context.conversationMemory.previousInteractions.push({
      type: 'user',
      content: message.content,
      timestamp: Date.now(),
      topic: context.lastTopic || null
    });
  }
  
  if (message.role === 'assistant') {
    // Store answer
    context.lastAnswer = message.content;
    context.lastResponse = message.content;
    
    // Track response in conversation memory
    context.conversationMemory.previousInteractions.push({
      type: 'assistant',
      content: message.content,
      timestamp: Date.now(),
      topic: context.lastTopic || null
    });
    
    // MIGRATED: Detect references to previous content
    const referencePatterns = CONTEXT_PATTERNS.reference[context.language === 'is' ? 'is' : 'en'];
    if (referencePatterns.some(pattern => message.content.toLowerCase().includes(pattern))) {
      context.contextualReferences.push({
        topic: context.lastTopic,
        timestamp: Date.now()
      });
    }
  }
  
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
      
      // Track in booking context
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
      
      // Check for ANY previous booking intent or booking-related history
      const hasExistingBookingHistory = context.lastTopic === 'booking' || 
                                       context.topics.includes('booking') || 
                                       context.bookingContext?.hasBookingIntent || 
                                       context.bookingContext?.dates?.length > 0;

      if (hasExistingBookingHistory) {
        console.log(`🔄 Maintaining booking context for date: "${message.content}"`);
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
  
  // MIGRATED: Late arrival context detection
  if (message.role === 'user') {
    const isLateArrivalTopic = isLateArrivalMessage(message.content, context.language === 'is');
    
    if (isLateArrivalTopic) {
      console.log('\n🕒 Late arrival topic detected in message');
      context.lateArrivalContext = {
        ...context.lateArrivalContext,
        isLate: true,
        lastUpdate: Date.now()
      };
      context.lastTopic = 'late_arrival';
    } else if (context.lastTopic === 'late_arrival' && 
               !isLateArrivalTopic && 
               !message.content.match(/it|that|this|these|those|they|there/i)) {
      // Clear late arrival context if conversation moves to a different topic
      context.lateArrivalContext = {
        ...context.lateArrivalContext,
        isLate: false,
        lastUpdate: Date.now()
      };
      // Only clear lastTopic if we're sure we're moving to a different subject
      if (!message.content.toLowerCase().includes('book')) {
        context.lastTopic = null;
      }
    }
  }
  
  // Maintain reasonable history size
  if (context.messages.length > MAX_CONTEXT_MESSAGES) {
    context.messages = context.messages.slice(-MAX_CONTEXT_MESSAGES);
  }
  
  // MIGRATED: Maintain memory limit from legacy system
  if (context.conversationMemory.previousInteractions.length > CONTEXT_MEMORY_LIMIT * 2) {
    context.conversationMemory.previousInteractions = 
      context.conversationMemory.previousInteractions.slice(-CONTEXT_MEMORY_LIMIT * 2);
  }
  
  return context;
}

/**
 * Detects topics from user message with enhanced relationship tracking
 * @param {Object} context - Session context
 * @param {string} message - User message
 */
export function updateTopicContext(context, message) {
  // Base topic patterns - ENHANCED from both systems
  const topicPatterns = {
    // Sky Lagoon specific topics
    ritual: /(ritual|skjól|skjol)/i,
    packages: /(package|saman|sér|ser|pure|sky)/i,
    hours: /(hour|open|close|time|opin|opið|lokað|lokar)/i,
    transportation: /(transport|bus|shuttle|drive|transfer|strætó|keyra)/i,
    dining: /(restaurant|food|eat|drink|dine|dining|matur|veitingar|borða|matseðil)/i,
    facilities: /(facilities|changing|shower|lockers|búningsklef)/i,
    booking: /(book|reserve|bóka|panta)/i,
    weather: /(weather|cold|rain|snow|veður|rigning)/i,
    late_arrival: /(late|delay|miss|sein|töf)/i,
    seasonal: /(winter|summer|light|vetur|sumar|ljós|norðurljós)/i,
    group_bookings: /(group|hóp|manna|hópabókun)/i,
    availability: /(availab|laust|pláss|lausir tímar|eigið laust)/i
  };
  
  // Define related topics for better context maintenance
  const relatedTopics = {
    'booking': ['date', 'time', 'schedule', 'reservation', 'tickets', 'availability'],
    'ritual': ['duration', 'steps', 'process', 'experience', 'skjol', 'skjól'],
    'transportation': ['directions', 'parking', 'bus', 'transfer', 'drive', 'strætó'],
    'dining': ['food', 'restaurant', 'menu', 'bar', 'matur', 'veitingar'],
    'hours': ['open', 'close', 'schedule', 'time', 'opin', 'lokar'],
    'late_arrival': ['late', 'missed', 'delay', 'after', 'sein', 'töf'],
    'facilities': ['changing', 'shower', 'locker', 'towel', 'búningsklef', 'sturta']
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
  
  // Check for date patterns in messages (for booking context)
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
  
  // Check for related topics to maintain context chains
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

  // MIGRATED: Track topics discussed in specific languages from legacy system
  if (detectedTopics.length > 0 && context.language === 'is') {
    context.icelandicTopics = [...(context.icelandicTopics || [])];
    
    for (const topic of detectedTopics) {
      if (!context.icelandicTopics.includes(topic)) {
        context.icelandicTopics.push(topic);
      }
    }
    
    console.log(`🌍 Updated Icelandic Topics: ${context.icelandicTopics.join(', ')}`);
  }
  
  // MIGRATED: Detect follow-up patterns from legacy system
  const followUpPatterns = CONTEXT_PATTERNS.followUp[context.language === 'is' ? 'is' : 'en'];
  if (followUpPatterns.some(pattern => message.toLowerCase().includes(pattern))) {
    context.questionContext = context.lastTopic;
    console.log(`🔄 Follow-up question detected, maintaining context: ${context.lastTopic}`);
  }
  
  // MIGRATED: Track topic relationships from legacy system
  if (context.lastTopic) {
    context.relatedTopics = [...new Set([
      ...(context.relatedTopics || []),
      context.lastTopic
    ])];
  }
  
  // Update the conversationMemory topics (from legacy system) 
  if (detectedTopics.length > 0) {
    const mainTopic = detectedTopics[0];
    context.conversationMemory.addTopic(mainTopic, {
      query: message,
      timestamp: Date.now(),
      language: context.language
    });
  }
  
  return context.topics;
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
    
    // ENHANCED: Improve search query with context for short messages
    let searchQuery = message;
    let usedContext = false;
    
    // If this is a very short message and we have context, enhance the query
    if (message.split(' ').length <= 3) {
      // For dates in booking context
      const datePattern = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\b\d{1,2}(st|nd|rd|th)?\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\b/i;
      
      if (datePattern.test(message) && (context.lastTopic === 'booking' || context.bookingContext?.hasBookingIntent)) {
        // Enhance query with booking context
        searchQuery = `booking information for ${message}`;
        usedContext = true;
        console.log(`\n🔍 Enhanced short query with booking context: "${searchQuery}"`);
      }
      // For follow-up questions using topic chains
      else if (context.activeTopicChain && context.activeTopicChain.length > 0) {
        // Use the topic chain to enhance the query
        searchQuery = `${context.activeTopicChain.join(' ')} ${message}`;
        usedContext = true;
        console.log(`\n🔍 Enhanced short query with topic chain: "${searchQuery}"`);
      }
      // For messages with lastTopic
      else if (context.lastTopic) {
        searchQuery = `${context.lastTopic} ${message}`;
        usedContext = true;
        console.log(`\n🔍 Enhanced short query with lastTopic: "${searchQuery}"`);
      }
    } 
    // For medium-length messages that look like follow-ups
    else if (message.split(' ').length <= 5 && 
            (message.toLowerCase().startsWith('and ') || 
             message.toLowerCase().startsWith('what about ') ||
             message.toLowerCase().startsWith('how about ') ||
             message.toLowerCase().startsWith('og ') || 
             message.toLowerCase().startsWith('hvað með '))) {
      
      if (context.lastTopic) {
        searchQuery = `${context.lastTopic} ${message}`;
        usedContext = true;
        console.log(`\n🔍 Enhanced follow-up query with lastTopic: "${searchQuery}"`);
      }
    }
    
    // Track the vector query used (for analysis and improvement)
    if (usedContext) {
      context.vectorQueryHistory.push({
        original: message,
        enhanced: searchQuery,
        strategy: context.activeTopicChain ? 'topic_chain' : 
                 context.lastTopic ? 'last_topic' : 'none',
        timestamp: Date.now()
      });
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
function normalizeVectorResults(results) {
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
 * Checks if a message is about late arrival
 * @param {string} message - User message
 * @param {boolean} isIcelandic - Whether the message is in Icelandic
 * @returns {boolean} - Whether the message is about late arrival
 */
export function isLateArrivalMessage(message, isIcelandic) {
  const lowerMessage = message.toLowerCase();
  
  // Simple pattern matching just to identify the topic (not for response generation)
  return lowerMessage.includes('late') || 
         lowerMessage.includes('delay') || 
         (lowerMessage.includes('arrive') && lowerMessage.includes('after')) ||
         // Icelandic terms
         (isIcelandic && (
             lowerMessage.includes('sein') || 
             lowerMessage.includes('töf') ||
             lowerMessage.includes('eftir bókun')
         ));
}

/**
 * Get all active sessions
 * @returns {Map} - All active sessions
 */
export function getAllSessions() {
  return sessions;
}

/**
 * MIGRATED: Enhanced time context tracking from legacy system
 * @param {string} message - User message
 * @param {Object} context - Session context
 * @param {Object} seasonInfo - Season information
 * @returns {Object} - Time context information
 */
export function updateTimeContext(message, context, seasonInfo) {
  const msg = message.toLowerCase();
  const isIcelandic = context.language === 'is';
  
  // Pattern matching
  const timePatterns = {
    duration: /how long|hversu lengi|what time|hvað tekur|hvað langan tíma|hve lengi|hversu langan|takes how long|how much time|does it take/i,
    booking: /book for|bóka fyrir|at|kl\.|klukkan|time slot|tíma|mæta|coming at|arrive at/i,
    specific: /(\d{1,2})[:\.]?(\d{2})?\s*(pm|am)?/i,
    dining: /mat|dinner|food|borða|máltíð|veitingar|restaurant|bar|eat|dining/i,
    activities: /ritual|ritúal|dinner|food|mat|borða/i,
    closing: /close|closing|lok|loka|lokar|lokun/i
  };

  // MIGRATED: Track if message is asking about duration
  if (timePatterns.duration.test(msg)) {
    if (context.lastTopic || msg.includes('ritual')) {
      context.timeContext.lastDiscussedTime = {
        topic: msg.includes('ritual') ? 'ritual' : context.lastTopic,
        type: 'duration',
        timestamp: Date.now(),
        activity: msg.includes('ritual') ? 'ritual' : context.lastTopic
      };
      console.log('\n⏰ Duration Question Detected:', message);
    }
  }

  // MIGRATED: Track activities mentioned together
  if (timePatterns.activities.test(msg)) {
    const activities = [];
    if (msg.match(/ritual|ritúal/i)) activities.push('ritual');
    if (msg.match(/dinner|food|mat|borða|dining/i)) activities.push('dining');
    if (activities.length > 0) {
      context.timeContext.sequence = activities;
      console.log('\n🔄 Activity Sequence Updated:', activities);
    }
  }

  // MIGRATED: Track specific times mentioned
  const timeMatch = msg.match(timePatterns.specific);
  if (timeMatch) {
    const time = timeMatch[0];
    context.timeContext.lastDiscussedTime = {
      time: time,
      type: 'specific',
      timestamp: Date.now()
    };
    
    // If booking-related, update booking time
    if (timePatterns.booking.test(msg)) {
      context.timeContext.bookingTime = time;
      console.log('\n⏰ Booking Time Updated:', time);
    }
  }

  // Build and return the time context result
  const result = {
    type: timePatterns.duration.test(msg) ? 'duration' : 
          timePatterns.closing.test(msg) ? 'hours' : null,
    activity: msg.match(/ritual|ritúal/i) ? 'ritual' : 
             msg.match(/dinner|food|mat|borða|dining/i) ? 'dining' : null,
    season: seasonInfo?.season || 'regular',
    operatingHours: seasonInfo ? {
      closing: seasonInfo.closingTime,
      lastRitual: seasonInfo.lastRitual,
      barClose: seasonInfo.barClose,
      lagoonClose: seasonInfo.lagoonClose
    } : null
  };

  return result;
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
 * Updates booking context with more precise change intent detection
 * @param {Object} context - Session context
 * @param {string} message - User message
 * @param {Object} detectionResult - Result from shouldShowBookingForm
 * @returns {Object} Updated context
 */
export function updateBookingChangeContext(context, message, detectionResult) {
  // Initialize booking context if it doesn't exist
  if (!context.bookingContext) {
    context.bookingContext = {
      hasBookingIntent: false,
      hasBookingChangeIntent: false,
      dates: [],
      preferredDate: null,
      dateModifications: [],
      lastDateMention: null,
      people: null,
      packages: null,
      bookingChangeConfidence: 0
    };
  }
  
  // Log the detection result
  console.log('\n🧠 Booking change detection result:', {
    shouldShowForm: detectionResult?.shouldShowForm || false,
    confidence: detectionResult?.confidence || 0,
    reasoning: detectionResult?.reasoning || null
  });
  
  // Update booking change intent based on detection result
  if (detectionResult && detectionResult.shouldShowForm === true) {
    console.log('\n✅ Setting hasBookingChangeIntent = true based on detection');
    context.bookingContext.hasBookingChangeIntent = true;
    context.bookingContext.bookingChangeConfidence = detectionResult.confidence || 0.9;
    context.lastTopic = 'booking_change';
  } 
  // Special case: If we explicitly detect this is NOT a booking change request, reset it
  else if (detectionResult && 
          detectionResult.shouldShowForm === false && 
          (detectionResult.confidence > 0.7 || message.toLowerCase().includes('package'))) {
    console.log('\n❌ Explicitly setting hasBookingChangeIntent = false based on detection');
    context.bookingContext.hasBookingChangeIntent = false;
    context.bookingContext.bookingChangeConfidence = 0;
  }
  
  // Clear booking change intent if message is about packages or differences
  const lowercaseMsg = message.toLowerCase();
  if ((lowercaseMsg.includes('difference') || lowercaseMsg.includes('different')) && 
      (lowercaseMsg.includes('package') || lowercaseMsg.includes('saman') || 
       lowercaseMsg.includes('pure') || lowercaseMsg.includes('sér'))) {
    console.log('\n❌ Clearing booking change intent due to package difference question');
    context.bookingContext.hasBookingChangeIntent = false;
    context.bookingContext.bookingChangeConfidence = 0;
  }
  
  // Return the updated context
  return context;
}

/**
 * Processes the result from shouldShowBookingForm to update context
 * and determine if the form should be shown
 * @param {Object} bookingFormCheck - Result from shouldShowBookingForm
 * @param {Object} context - Session context
 * @returns {Object} Updated check result
 */
export function processBookingFormCheck(bookingFormCheck, context) {
  // Default values if check is incomplete
  const result = {
    shouldShowForm: bookingFormCheck?.shouldShowForm || false,
    isWithinAgentHours: bookingFormCheck?.isWithinAgentHours || false,
    confidence: bookingFormCheck?.confidence || 0
  };
  
  // Only show form if we have high confidence or explicit detection
  const shouldShow = result.shouldShowForm || 
                    (context.bookingContext?.hasBookingChangeIntent === true && 
                     context.bookingContext?.bookingChangeConfidence >= 0.8);
  
  // Low confidence scenarios where we should not show the form
  const lowConfidenceScenarios = [
    // Check for package questions or pricing that should not trigger booking change
    context.topics?.includes('packages') && !context.topics?.includes('booking_change'),
    context.lastTopic === 'packages' && context.bookingContext?.bookingChangeConfidence < 0.8,
    // If this is an informational query about options or differences
    context.messages?.length > 0 && 
      context.messages[context.messages.length-1]?.content?.toLowerCase().includes('difference')
  ];
  
  // If any of our low confidence scenarios match, don't show the form
  const definitelyDontShow = lowConfidenceScenarios.some(scenario => scenario === true);
  
  if (definitelyDontShow) {
    console.log('\n❌ Blocking form display due to low confidence scenario');
    result.shouldShowForm = false;
  } else {
    result.shouldShowForm = shouldShow;
  }
  
  console.log('\n📝 Final booking form decision:', {
    shouldShowForm: result.shouldShowForm,
    confidence: context.bookingContext?.bookingChangeConfidence || 0,
    lastTopic: context.lastTopic,
    hasExplicitDetection: bookingFormCheck?.shouldShowForm || false
  });
  
  return result;
}