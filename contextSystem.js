// contextSystem.js - Enhanced context management system

// Global caches shared across all sessions
if (!global.skyLagoonCaches) {
  global.skyLagoonCaches = {
    knowledge: new Map(),
    vector: new Map(),
    // Configuration
    KNOWLEDGE_CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours
    KNOWLEDGE_CACHE_MAX_SIZE: 500,
    VECTOR_CACHE_TTL: 24 * 60 * 60 * 1000,
    VECTOR_CACHE_MAX_SIZE: 1000
  };
  
  console.log('🌐 Initialized global knowledge caching system');
}

// Import required dependencies
import { detectLanguage as oldDetectLanguage } from './knowledgeBase_is.js';
import { detectLanguage as newDetectLanguage } from './languageDetection.js';
import { connectToDatabase } from './database.js';
// Import knowledge base functions at the top of contextSystem.js
// import { getRelevantKnowledge } from './knowledgeBase.js'; - handled inside getKnowledgeWithFallbacks function further below
// import { getRelevantKnowledge_is } from './knowledgeBase_is.js'; - handled inside getKnowledgeWithFallbacks function further below

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
 * Manages and tracks user intents throughout a conversation with time-based decay
 */
export class IntentHierarchy {
  constructor() {
    this.primaryIntent = null;
    this.secondaryIntents = [];
    this.intentStrength = new Map(); // Topic name -> strength
    this.lastUpdate = Date.now();
  }
  
  /**
   * Updates the intent hierarchy with a new intent
   * @param {string} newIntent - The intent/topic to update
   * @param {number} confidence - Confidence level (0-1)
   * @returns {IntentHierarchy} - This instance for chaining
   */
  updateIntent(newIntent, confidence = 0.5) {
    if (!newIntent) return this;
    
    const now = Date.now();
    
    // Always track this intent
    if (!this.intentStrength.has(newIntent)) {
      this.intentStrength.set(newIntent, 0);
    }
    
    // Update intent strength
    const currentStrength = this.intentStrength.get(newIntent);
    this.intentStrength.set(newIntent, currentStrength + confidence);
    
    // Apply time decay to all intents (except the new one)
    for (const [intent, strength] of this.intentStrength.entries()) {
      if (intent !== newIntent) {
        // 20% decay - adjust based on desired persistence
        const decayedStrength = strength * 0.8; 
        this.intentStrength.set(intent, decayedStrength);
      }
    }
    
    // Update hierarchy
    const sortedIntents = [...this.intentStrength.entries()]
      .sort((a, b) => b[1] - a[1]);
    
    this.primaryIntent = sortedIntents[0]?.[0] || null;
    this.secondaryIntents = sortedIntents.slice(1, 3).map(entry => entry[0]);
    this.lastUpdate = now;
    
    return this;
  }
  
  /**
   * Gets the current intent context
   * @returns {Object} Intent context information
   */
  getIntentContext() {
    return {
      primary: this.primaryIntent,
      secondary: this.secondaryIntents,
      all: Object.fromEntries(this.intentStrength)
    };
  }
  
  /**
   * Gets the most relevant intent for a given topic
   * @param {string} topic - Topic to check
   * @returns {Object} Relevant intent information
   */
  getRelevantIntent(topic) {
    if (this.primaryIntent === topic) {
      return { intent: this.primaryIntent, strength: this.intentStrength.get(this.primaryIntent) || 0 };
    }
    
    if (this.secondaryIntents.includes(topic)) {
      return { intent: topic, strength: this.intentStrength.get(topic) || 0 };
    }
    
    return { intent: this.primaryIntent, strength: this.intentStrength.get(this.primaryIntent) || 0 };
  }
  
  /**
   * Calculates probability that user is still talking about an intent
   * @param {string} intent - Intent to check
   * @returns {number} Probability (0-1)
   */
  intentProbability(intent) {
    const totalStrength = Array.from(this.intentStrength.values()).reduce((a, b) => a + b, 0);
    const intentStrength = this.intentStrength.get(intent) || 0;
    
    if (totalStrength === 0) return 0;
    return intentStrength / totalStrength;
  }
}

/**
 * Tracks relationships between conversation topics and predicts transitions
 */
export class TopicGraph {
  constructor() {
    this.nodes = new Map(); // Topic name -> metadata
    this.edges = new Map(); // Source-Target -> relationship data
  }
  
  /**
   * Adds or updates a topic in the graph
   * @param {string} topic - Topic name
   * @param {Object} metadata - Additional topic information
   */
  addTopic(topic, metadata = {}) {
    if (!topic) return;
    
    if (!this.nodes.has(topic)) {
      this.nodes.set(topic, {
        count: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        ...metadata
      });
    } else {
      const node = this.nodes.get(topic);
      node.count++;
      node.lastSeen = Date.now();
      // Merge any new metadata
      Object.assign(node, metadata);
    }
  }
  
  /**
   * Adds or strengthens a relationship between topics
   * @param {string} sourceTopic - Source topic name
   * @param {string} targetTopic - Target topic name
   * @param {number} weight - Relationship strength to add
   */
  addRelationship(sourceTopic, targetTopic, weight = 1) {
    if (!sourceTopic || !targetTopic || sourceTopic === targetTopic) return;
    
    // Ensure both topics exist as nodes
    this.addTopic(sourceTopic);
    this.addTopic(targetTopic);
    
    // Track the relationship
    const edgeKey = `${sourceTopic}→${targetTopic}`;
    
    if (!this.edges.has(edgeKey)) {
      this.edges.set(edgeKey, { 
        count: weight,
        lastUsed: Date.now() 
      });
    } else {
      const edge = this.edges.get(edgeKey);
      edge.count += weight;
      edge.lastUsed = Date.now();
    }
  }
  
  /**
   * Gets topics related to the specified topic
   * @param {string} topic - Topic to find relationships for
   * @param {number} limit - Maximum number of results
   * @returns {Array} Related topics with relationship strength
   */
  getRelatedTopics(topic, limit = 3) {
    if (!topic) return [];
    
    const related = [];
    
    // Find edges from this topic
    for (const [edgeKey, edge] of this.edges.entries()) {
      const [source, target] = edgeKey.split('→');
      
      if (source === topic) {
        related.push({
          topic: target,
          strength: edge.count,
          lastUsed: edge.lastUsed
        });
      }
    }
    
    // Sort by strength and return top results
    return related
      .sort((a, b) => b.strength - a.strength)
      .slice(0, limit);
  }
  
  /**
   * Predicts likely next topics based on current topic
   * @param {string} currentTopic - Current conversation topic
   * @param {number} limit - Maximum predictions to return
   * @returns {Array} Predicted next topics
   */
  predictNextTopics(currentTopic, limit = 3) {
    return this.getRelatedTopics(currentTopic, limit);
  }
  
  /**
   * Calculates probability of transition between topics
   * @param {string} fromTopic - Source topic
   * @param {string} toTopic - Target topic
   * @returns {number} Transition probability (0-1)
   */
  transitionProbability(fromTopic, toTopic) {
    if (!fromTopic || !toTopic) return 0;
    
    // Get all outgoing edges from the source topic
    let totalOutgoing = 0;
    let targetWeight = 0;
    
    for (const [edgeKey, edge] of this.edges.entries()) {
      const [source, target] = edgeKey.split('→');
      
      if (source === fromTopic) {
        totalOutgoing += edge.count;
        
        if (target === toTopic) {
          targetWeight = edge.count;
        }
      }
    }
    
    if (totalOutgoing === 0) return 0;
    return targetWeight / totalOutgoing;
  }
}

/**
 * Stores and manages conversation memories with importance and recency weighting
 */
export class AdaptiveMemory {
  constructor(capacity = 20) {
    this.memories = [];
    this.capacity = capacity;
    this.categories = new Set();
  }
  
  /**
   * Adds a new memory with metadata
   * @param {any} content - Memory content (can be string or object)
   * @param {Object} metadata - Additional memory information
   * @returns {Object} - The created memory
   */
  addMemory(content, metadata = {}) {
    const memory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      content,
      importance: metadata.importance || 0.5,
      category: metadata.category || 'general',
      timestamp: Date.now(),
      metadata
    };
    
    // Add category to tracking set
    this.categories.add(memory.category);
    
    // Add to memories
    this.memories.push(memory);
    
    // Prune if we exceed capacity
    if (this.memories.length > this.capacity) {
      this.prune();
    }
    
    return memory;
  }
  
  /**
   * Prunes memories based on importance and recency
   */
  prune() {
    // Calculate recency scores (0-1 where 1 is most recent)
    const now = Date.now();
    const oldestTime = Math.min(...this.memories.map(m => m.timestamp));
    const timespan = now - oldestTime;
    
    // Score each memory
    const scoredMemories = this.memories.map(memory => {
      const recencyScore = timespan ? (now - memory.timestamp) / timespan : 0;
      const score = (memory.importance * 0.7) + ((1 - recencyScore) * 0.3);
      return { memory, score };
    });
    
    // Sort by score and keep the top ones
    scoredMemories.sort((a, b) => b.score - a.score);
    this.memories = scoredMemories.slice(0, this.capacity).map(item => item.memory);
  }
  
  /**
   * Gets memories relevant to a query, using recency and category
   * @param {string} query - Search query
   * @param {string} category - Optional category filter
   * @param {number} limit - Maximum results to return
   * @returns {Array} - Relevant memories
   */
  getRelevantMemories(query, category = null, limit = 3) {
    // Calculate recency scores
    const now = Date.now();
    const oldestTime = Math.min(...this.memories.map(m => m.timestamp));
    const timespan = now - oldestTime;
    
    // Filter and score memories
    const scoredMemories = this.memories
      .filter(memory => !category || memory.category === category)
      .map(memory => {
        // Recency score (0-1)
        const recencyScore = timespan ? 1 - ((now - memory.timestamp) / timespan) : 1;
        
        // Relevance score based on term overlap (simple approach)
        const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
        const contentStr = typeof memory.content === 'string' ? memory.content : JSON.stringify(memory.content);
        const contentTerms = contentStr.toLowerCase().split(/\s+/);
        
        let relevanceScore = 0;
        if (queryTerms.length > 0) {
          const matchingTerms = queryTerms.filter(term => contentTerms.includes(term));
          relevanceScore = matchingTerms.length / queryTerms.length;
        }
        
        // Combined score
        const score = (memory.importance * 0.4) + (recencyScore * 0.3) + (relevanceScore * 0.3);
        
        return { memory, score, relevanceScore, recencyScore };
      });
    
    // Sort by score and return top results
    return scoredMemories
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.memory);
  }
  
  /**
   * Gets memories by category
   * @param {string} category - Category to filter by
   * @param {number} limit - Maximum results
   * @returns {Array} - Memories in the category
   */
  getMemoriesByCategory(category, limit = 5) {
    return this.memories
      .filter(memory => memory.category === category)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
  
  /**
   * Gets most recent memories
   * @param {number} limit - Maximum results
   * @returns {Array} - Most recent memories
   */
  getRecentMemories(limit = 5) {
    return [...this.memories]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}

// Use global caches for knowledge retrieval
const knowledgeCache = global.skyLagoonCaches.knowledge;
const KNOWLEDGE_CACHE_TTL = global.skyLagoonCaches.KNOWLEDGE_CACHE_TTL;
const KNOWLEDGE_CACHE_MAX_SIZE = global.skyLagoonCaches.KNOWLEDGE_CACHE_MAX_SIZE;

// Helper function to create normalized cache keys
function createCacheKey(message, language) {
  // Normalize the message by removing punctuation, excess whitespace, and converting to lowercase
  const normalizedMessage = message.toLowerCase()
    .replace(/[^\w\s?]/g, '') // Remove punctuation except question marks
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
  
  return `${normalizedMessage}:${language || 'en'}`;
}

// Periodic cache cleanup function
function cleanupKnowledgeCache() {
  if (knowledgeCache.size > KNOWLEDGE_CACHE_MAX_SIZE) {
    console.log(`\n🧹 Cleaning knowledge cache (${knowledgeCache.size} entries)`);
    const now = Date.now();
    
    // First remove expired entries
    let expiredCount = 0;
    for (const [key, entry] of knowledgeCache.entries()) {
      if (now - entry.timestamp > KNOWLEDGE_CACHE_TTL) {
        knowledgeCache.delete(key);
        expiredCount++;
      }
    }
    
    // If still too large, remove oldest entries
    if (knowledgeCache.size > KNOWLEDGE_CACHE_MAX_SIZE - 100) {
      const entries = [...knowledgeCache.entries()];
      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 100 entries
      let oldestRemoved = 0;
      for (let i = 0; i < 100 && i < entries.length; i++) {
        knowledgeCache.delete(entries[i][0]);
        oldestRemoved++;
      }
      
      console.log(`🧹 Removed ${expiredCount} expired and ${oldestRemoved} oldest cache entries`);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupKnowledgeCache, 60 * 60 * 1000);

// Use global caches for vector knowledge
const vectorCache = global.skyLagoonCaches.vector;
const VECTOR_CACHE_TTL = global.skyLagoonCaches.VECTOR_CACHE_TTL;
const VECTOR_CACHE_MAX_SIZE = global.skyLagoonCaches.VECTOR_CACHE_MAX_SIZE;

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
      
      // ===== Intent Tracking System =====
      intentHierarchy: new IntentHierarchy(),

      // ===== Topic Relationship Tracking =====
      topicGraph: new TopicGraph(),

      // ===== Memory Management System =====
      adaptiveMemory: new AdaptiveMemory(30), // Store up to 30 memories      

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

  // NEW: Store in adaptive memory with moderate importance
  if (!context.adaptiveMemory) {
    console.log('Creating new adaptiveMemory for context');
    context.adaptiveMemory = new AdaptiveMemory(30);
  }

  // Check if addMemory is a function and reinitialize if needed
  if (typeof context.adaptiveMemory.addMemory !== 'function') {
    console.log('Reinitializing adaptiveMemory - method missing');
    // Save existing memories if available
    const oldMemories = context.adaptiveMemory.memories || [];
    context.adaptiveMemory = new AdaptiveMemory(30);
    context.adaptiveMemory.memories = oldMemories;
  }

  try {
    context.adaptiveMemory.addMemory(message.content, {
      importance: 0.6, // User messages are moderately important
      category: 'user_message',
      topic: context.lastTopic,
      timestamp: Date.now()
    });
  } catch (memoryError) {
    console.error('Error adding to adaptiveMemory:', memoryError);
    // Continue processing without failing
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
    
    // NEW: Reinforce current intent with assistant responses
    if (context.intentHierarchy && context.lastTopic) {
      // Smaller confidence boost from assistant responses
      context.intentHierarchy.updateIntent(context.lastTopic, 0.2);
    }
  }

  // NEW: Store in adaptive memory with high importance
  if (!context.adaptiveMemory) {
    console.log('Creating new adaptiveMemory for assistant response');
    context.adaptiveMemory = new AdaptiveMemory(30);
  }

  // Check if addMemory is a function and reinitialize if needed
  if (typeof context.adaptiveMemory.addMemory !== 'function') {
    console.log('Reinitializing adaptiveMemory - method missing');
    // Save existing memories if available
    const oldMemories = context.adaptiveMemory.memories || [];
    context.adaptiveMemory = new AdaptiveMemory(30);
    context.adaptiveMemory.memories = oldMemories;
  }

  try {
    context.adaptiveMemory.addMemory(message.content, {
      importance: 0.7, // Assistant responses are high importance
      category: 'assistant_response',
      topic: context.lastTopic,
      timestamp: Date.now()
    });
  } catch (memoryError) {
    console.error('Error adding to adaptiveMemory:', memoryError);
    // Continue processing without failing
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
  
  // NEW: Update intent hierarchy with detected topics
  if (detectedTopics.length > 0) {
    if (!context.intentHierarchy) {
      console.log('Creating new intentHierarchy');
      context.intentHierarchy = new IntentHierarchy();
    }
    
    // Check if updateIntent is a function and reinitialize if needed
    if (typeof context.intentHierarchy.updateIntent !== 'function') {
      console.log('Reinitializing intentHierarchy - method missing');
      // Save existing data if available
      const primaryIntent = context.intentHierarchy.primaryIntent || null;
      const secondaryIntents = context.intentHierarchy.secondaryIntents || [];
      const intentStrength = context.intentHierarchy.intentStrength || new Map();
      const lastUpdate = context.intentHierarchy.lastUpdate || Date.now();
      
      // Create a new instance
      context.intentHierarchy = new IntentHierarchy();
      
      // Restore previous data
      context.intentHierarchy.primaryIntent = primaryIntent;
      context.intentHierarchy.secondaryIntents = secondaryIntents;
      context.intentHierarchy.lastUpdate = lastUpdate;
      
      // Handle Map restoration - Maps don't serialize well in MongoDB
      if (intentStrength && typeof intentStrength === 'object') {
        // If it's a plain object, convert back to Map
        if (!intentStrength.set && !intentStrength.get) {
          const newMap = new Map();
          Object.keys(intentStrength).forEach(key => {
            newMap.set(key, intentStrength[key]);
          });
          context.intentHierarchy.intentStrength = newMap;
        } else {
          // It's already a Map
          context.intentHierarchy.intentStrength = intentStrength;
        }
      }
    }
    
    try {
      // Update hierarchy with the first (most important) detected topic
      // Higher confidence (0.7) for explicitly mentioned topics
      context.intentHierarchy.updateIntent(detectedTopics[0], 0.7);
      
      console.log(`\n🧠 Updated intent hierarchy: primary=${context.intentHierarchy.primaryIntent}, secondary=[${context.intentHierarchy.secondaryIntents.join(', ')}]`);
    } catch (intentError) {
      console.error('Error updating intentHierarchy:', intentError);
      // Continue processing without failing
    }
  } else if (context.lastTopic) {
    // If no new topics but we have a last topic, reinforce it with lower confidence
    if (!context.intentHierarchy) {
      console.log('Creating new intentHierarchy for reinforcement');
      context.intentHierarchy = new IntentHierarchy();
    }
    
    // Check if updateIntent is a function and reinitialize if needed
    if (typeof context.intentHierarchy.updateIntent !== 'function') {
      console.log('Reinitializing intentHierarchy for reinforcement - method missing');
      // Create a new instance with default values
      context.intentHierarchy = new IntentHierarchy();
      context.intentHierarchy.primaryIntent = context.lastTopic;
    }
    
    try {
      context.intentHierarchy.updateIntent(context.lastTopic, 0.3);
    } catch (intentError) {
      console.error('Error reinforcing intentHierarchy:', intentError);
      // Continue processing without failing
    }
  }

  // NEW: Update topic graph with transitions
  if (detectedTopics.length > 0) {
    // Initialize topic graph if needed
    if (!context.topicGraph) {
      console.log('Creating new topicGraph');
      context.topicGraph = new TopicGraph();
    }
    
    // Check if addTopic is a function and reinitialize if needed
    if (typeof context.topicGraph.addTopic !== 'function') {
      console.log('Reinitializing topicGraph - method missing');
      // Save existing data if available
      const oldNodes = context.topicGraph.nodes || new Map();
      const oldEdges = context.topicGraph.edges || new Map();
      
      // Create new instance
      context.topicGraph = new TopicGraph();
      
      // Handle Map restoration for nodes
      if (oldNodes && typeof oldNodes === 'object') {
        if (!oldNodes.set && !oldNodes.get) {
          const newNodesMap = new Map();
          Object.keys(oldNodes).forEach(key => {
            newNodesMap.set(key, oldNodes[key]);
          });
          context.topicGraph.nodes = newNodesMap;
        } else {
          context.topicGraph.nodes = oldNodes;
        }
      }
      
      // Handle Map restoration for edges
      if (oldEdges && typeof oldEdges === 'object') {
        if (!oldEdges.set && !oldEdges.get) {
          const newEdgesMap = new Map();
          Object.keys(oldEdges).forEach(key => {
            newEdgesMap.set(key, oldEdges[key]);
          });
          context.topicGraph.edges = newEdgesMap;
        } else {
          context.topicGraph.edges = oldEdges;
        }
      }
    }
    
    try {
      // Add each detected topic to the graph
      for (const topic of detectedTopics) {
        context.topicGraph.addTopic(topic, {
          query: message,
          language: context.language
        });
      }
      
      // Track transition from previous topic to new topic
      if (context.lastTopic && context.lastTopic !== detectedTopics[0]) {
        context.topicGraph.addRelationship(context.lastTopic, detectedTopics[0]);
        console.log(`\n🔄 Topic transition: ${context.lastTopic} → ${detectedTopics[0]}`);
        
        // Get predictions for future topics
        const predictions = context.topicGraph.predictNextTopics(detectedTopics[0]);
        if (predictions.length > 0) {
          console.log(`\n🔮 Predicted next topics: ${predictions.map(t => t.topic).join(', ')}`);
        }
      }
    } catch (graphError) {
      console.error('Error updating topicGraph:', graphError);
      // Continue processing without failing
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
    
    // Check if conversationMemory exists and has addTopic method
    if (!context.conversationMemory || typeof context.conversationMemory.addTopic !== 'function') {
      console.log('Reinitializing conversationMemory - addTopic method missing');
      
      // Save existing data
      const oldTopics = context.conversationMemory?.topics || [];
      const oldLastResponse = context.conversationMemory?.lastResponse || null;
      const oldContextualQuestions = context.conversationMemory?.contextualQuestions || {};
      const oldPreviousInteractions = context.conversationMemory?.previousInteractions || [];
      
      // Create new conversationMemory with all required methods
      context.conversationMemory = {
        topics: oldTopics,
        lastResponse: oldLastResponse,
        contextualQuestions: oldContextualQuestions,
        previousInteractions: oldPreviousInteractions,
        addTopic: function(topic, details) {
          this.topics.unshift({ 
            topic, 
            details, 
            timestamp: Date.now(),
            language: context.language
          });
          if (this.topics.length > 5) this.topics.pop();
        },
        getLastTopic: function() {
          return this.topics[0]?.topic || null;
        },
        getTopicDetails: function(topic) {
          return this.topics.find(t => t.topic === topic)?.details || null;
        }
      };
    }
    
    try {
      context.conversationMemory.addTopic(mainTopic, {
        query: message,
        timestamp: Date.now(),
        language: context.language
      });
    } catch (memoryError) {
      console.error('Error adding topic to conversationMemory:', memoryError);
      // Continue processing without failing
    }
  }
  
  return context.topics;
}

/**
 * Gets relevant knowledge using vector search with enhanced context awareness and caching
 * @param {string} message - User message
 * @param {Object} context - Session context
 * @returns {Promise<Array>} - Relevant knowledge entries with similarity scores
 */
export async function getVectorKnowledge(message, context) {
  try {
    console.log(`\n🔍 Vector search for: "${message}" in ${context.language}`);
    
    // Determine which language to use
    const language = context.language || 'en';
    
    // ENHANCED: Improve search query with context for short messages
    let searchQuery = message;
    let usedContext = false;
    let enhancementStrategy = 'none';
    
    // Check if this is a short or follow-up query
    const isShortQuery = message.split(' ').length <= 4;
    const isFollowUp = /^(and|what about|how about|is there|what if|og|hvað með|en hvað|er það)/i.test(message);
    
    // Build contextual enhancement based on various signals
    if (isShortQuery || isFollowUp) {
      // Create array to collect context pieces
      const contextPieces = [];
      
      // 1. For dates in booking context
      const datePattern = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\b\d{1,2}(st|nd|rd|th)?\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\b/i;
      
      if (datePattern.test(message) && (context.lastTopic === 'booking' || context.bookingContext?.hasBookingIntent)) {
        // Add booking context
        contextPieces.push('booking information');
        
        // If we have a preferred date, mention it
        if (context.bookingContext?.preferredDate) {
          contextPieces.push(`for ${context.bookingContext.preferredDate}`);
        }
        
        enhancementStrategy = 'booking_date';
      }
      
      // 2. For follow-up questions using topic chains
      if (context.activeTopicChain && context.activeTopicChain.length > 0) {
        // Use the topic chain for context
        contextPieces.push(...context.activeTopicChain);
        enhancementStrategy = 'topic_chain';
      }
      
      // 3. Add last topic if available and not yet included
      if (context.lastTopic && 
          !contextPieces.includes(context.lastTopic) && 
          !context.activeTopicChain?.includes(context.lastTopic)) {
        contextPieces.push(context.lastTopic);
        if (enhancementStrategy === 'none') enhancementStrategy = 'last_topic';
      }
      
      // 4. Add most recent user message for context (if different)
      const lastUserMessages = context.messages
        .filter(m => m.role === 'user')
        .slice(-3); // Get last 3 user messages
        
      // Get the previous message (not the current one)
      const previousMessage = lastUserMessages.length > 1 ? 
                              lastUserMessages[lastUserMessages.length - 2]?.content : null;
      
      if (previousMessage && 
          !message.includes(previousMessage) && 
          previousMessage !== message) {
        
        // Extract keywords from previous message (words with 4+ characters)
        const keywords = previousMessage.split(' ')
          .filter(word => word.length >= 4 && !message.includes(word))
          .slice(0, 2); // Take up to 2 keywords
          
        if (keywords.length > 0) {
          contextPieces.push(keywords.join(' '));
          if (enhancementStrategy === 'none') enhancementStrategy = 'previous_message';
        }
      }
      
      // 5. Add intent information if available
      if (context.intentHierarchy?.primaryIntent && 
          !contextPieces.includes(context.intentHierarchy.primaryIntent)) {
        contextPieces.push(context.intentHierarchy.primaryIntent);
        if (enhancementStrategy === 'none') enhancementStrategy = 'primary_intent';
      }

      // 6. Add predicted topic information if available
      if (context.topicGraph && context.lastTopic) {
        const predictions = context.topicGraph.predictNextTopics(context.lastTopic, 1);
        if (predictions.length > 0 && 
            !contextPieces.includes(predictions[0].topic) && 
            predictions[0].strength > 2) { // Only use strong predictions
          contextPieces.push(predictions[0].topic);
          if (enhancementStrategy === 'none') enhancementStrategy = 'predicted_topic';
        }
      }      

      // 7. Add relevant memories for very short queries
      if (message.split(' ').length <= 2 && context.adaptiveMemory) {
        // Get recent highly relevant memories
        const relevantMemories = context.adaptiveMemory.getRelevantMemories(message, null, 1);
        
        if (relevantMemories.length > 0) {
          // Extract keywords from memory (words with 4+ characters)
          const memoryContent = typeof relevantMemories[0].content === 'string' ? 
                                 relevantMemories[0].content : 
                                 JSON.stringify(relevantMemories[0].content);
                                 
          const keywords = memoryContent.split(' ')
            .filter(word => word.length >= 4 && !contextPieces.includes(word) && !message.includes(word))
            .slice(0, 2); // Take up to 2 keywords
            
          if (keywords.length > 0) {
            contextPieces.push(keywords.join(' '));
            if (enhancementStrategy === 'none') enhancementStrategy = 'memory_keywords';
          }
        }
      }      

      // Create enhanced query if we have context pieces
      if (contextPieces.length > 0) {
        // Remove duplicates
        const uniqueContextPieces = [...new Set(contextPieces)];
        const contextPrefix = uniqueContextPieces.join(' ');
        
        // Don't repeat information that's already in the message
        if (!message.includes(contextPrefix)) {
          searchQuery = `${contextPrefix} ${message}`;
          usedContext = true;
          
          console.log(`\n🧠 Enhanced query with ${enhancementStrategy}: "${searchQuery}"`);
        }
      }
    } 
    // Special case for medium-length messages that look like follow-ups
    else if (message.split(' ').length <= 5 && 
            (message.toLowerCase().startsWith('and ') || 
             message.toLowerCase().startsWith('what about ') ||
             message.toLowerCase().startsWith('how about ') ||
             message.toLowerCase().startsWith('og ') || 
             message.toLowerCase().startsWith('hvað með '))) {
      
      if (context.lastTopic) {
        searchQuery = `${context.lastTopic} ${message}`;
        usedContext = true;
        enhancementStrategy = 'follow_up';
        console.log(`\n🔍 Enhanced follow-up query with lastTopic: "${searchQuery}"`);
      }
    }
    
    // Track the vector query used (for analysis and improvement)
    if (usedContext) {
      if (!context.vectorQueryHistory) {
        context.vectorQueryHistory = [];
      }
      
      context.vectorQueryHistory.push({
        original: message,
        enhanced: searchQuery,
        strategy: enhancementStrategy,
        timestamp: Date.now()
      });
    }
    
    // CHECK CACHE before proceeding with the search
    const vectorCacheKey = `vector:${searchQuery.toLowerCase().replace(/[^\w\s]/g, '').trim()}:${language}`;
    
    if (vectorCache.has(vectorCacheKey)) {
      const cached = vectorCache.get(vectorCacheKey);
      
      // Check if cache entry is still valid
      if (Date.now() - cached.timestamp < VECTOR_CACHE_TTL) {
        console.log(`\n📦 Using cached vector results for: "${searchQuery}"`);
        return cached.results;
      } else {
        // Expired entry, remove it
        vectorCache.delete(vectorCacheKey);
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
    
    console.log(`\n🔍 Found ${results.length} vector search results using ${usedContext ? 'enhanced' : 'standard'} query`);
    
    // Transform and normalize results to expected format
    const transformedResults = results.map(result => ({
      type: result.metadata?.type || 'unknown',
      content: result.content,
      metadata: result.metadata || {},
      similarity: result.similarity
    }));

    // NEW: Save important vector search results to memory
    if (transformedResults.length > 0 && context.adaptiveMemory) {
      // Store the first (most relevant) result
      const firstResult = transformedResults[0];
      if (firstResult.similarity > 0.8) { // Only store high-quality matches
        context.adaptiveMemory.addMemory(firstResult.content, {
          importance: 0.8, // High importance for knowledge results
          category: 'knowledge',
          topic: firstResult.type,
          query: message,
          timestamp: Date.now()
        });
      }
    }    
    
    const normalizedResults = normalizeVectorResults(transformedResults);
    
    // Cache the results before returning
    if (normalizedResults && normalizedResults.length > 0) {
      vectorCache.set(vectorCacheKey, {
        results: normalizedResults,
        timestamp: Date.now()
      });
      
      // Cleanup if cache gets too big
      if (vectorCache.size > VECTOR_CACHE_MAX_SIZE) {
        cleanupVectorCache();
      }
    }
    
    return normalizedResults;
    
  } catch (error) {
    console.error('\n❌ Error in vector search:', error);
    console.error('\n❌ Stack trace:', error.stack);
    return []; // Return empty array on error
  }
}

// Helper function to clean up the vector cache
function cleanupVectorCache() {
  console.log(`\n🧹 Cleaning vector cache (${vectorCache.size} entries)`);
  const now = Date.now();
  
  // First remove expired entries
  let expiredCount = 0;
  for (const [key, entry] of vectorCache.entries()) {
    if (now - entry.timestamp > VECTOR_CACHE_TTL) {
      vectorCache.delete(key);
      expiredCount++;
    }
  }
  
  // If still too large, remove oldest entries
  if (vectorCache.size > VECTOR_CACHE_MAX_SIZE - 200) {
    const entries = [...vectorCache.entries()];
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 200 entries
    let oldestRemoved = 0;
    for (let i = 0; i < 200 && i < entries.length; i++) {
      vectorCache.delete(entries[i][0]);
      oldestRemoved++;
    }
    
    console.log(`🧹 Removed ${expiredCount} expired and ${oldestRemoved} oldest vector cache entries`);
  }
}

/**
 * Comprehensive knowledge retrieval with fallback mechanisms and caching
 * @param {string} message - User message
 * @param {Object} context - Session context
 * @returns {Promise<Array>} - Knowledge entries with fallback handling
 */
export async function getKnowledgeWithFallbacks(message, context) {
  try {
    console.log(`\n📚 Starting knowledge retrieval for: "${message}"`);
    
    // Track retrieval attempts for analytics
    if (!context.retrievalStats) {
      context.retrievalStats = {
        attempts: 0,
        fallbacks: 0,
        successRate: 0,
        history: []
      };
    }
    
    // Check cache first
    const cacheKey = createCacheKey(message, context.language);
    if (knowledgeCache.has(cacheKey)) {
      const cached = knowledgeCache.get(cacheKey);
      
      // Check if cache entry is still valid
      if (Date.now() - cached.timestamp < KNOWLEDGE_CACHE_TTL) {
        console.log(`\n📦 Using cached knowledge for: "${message}"`);
        return cached.results;
      } else {
        // Expired entry, remove it
        knowledgeCache.delete(cacheKey);
      }
    }
    
    // Increment attempt counter
    context.retrievalStats.attempts++;
    
    // 1. Primary retrieval using enhanced vector search
    console.log(`\n🔍 ATTEMPT 1: Primary vector search`);
    let results = await getVectorKnowledge(message, context);
    
    // Track this attempt
    context.retrievalStats.history.push({
      strategy: 'primary_vector',
      query: message,
      resultCount: results?.length || 0,
      timestamp: Date.now()
    });
    
    // If we got results, cache and return them
    if (results && results.length > 0) {
      console.log(`\n✅ Primary vector search successful: ${results.length} results`);
      
      // Cache the results
      knowledgeCache.set(cacheKey, {
        results: results,
        timestamp: Date.now()
      });
      
      return results;
    }
    
    // 2. If no results, try with topic-enhanced query
    console.log(`\n🔍 ATTEMPT 2: Topic fallback`);
    
    // Use topics from context to enhance query
    if (context.lastTopic) {
      const topicEnhancedQuery = `${context.lastTopic} ${message}`;
      console.log(`\n🔍 Trying topic-enhanced query: "${topicEnhancedQuery}"`);
      
      results = await getVectorKnowledge(topicEnhancedQuery, context);
      
      // Track this attempt
      context.retrievalStats.history.push({
        strategy: 'topic_fallback',
        query: topicEnhancedQuery,
        resultCount: results?.length || 0,
        timestamp: Date.now()
      });
      
      if (results && results.length > 0) {
        console.log(`\n✅ Topic fallback successful: ${results.length} results`);
        
        // Cache under the original query
        knowledgeCache.set(cacheKey, {
          results: results,
          timestamp: Date.now()
        });
        
        return results;
      }
    }
    
    // 3. If still no results, try with intent-based fallback
    console.log(`\n🔍 ATTEMPT 3: Intent fallback`);
    
    // Use intent hierarchy for query enhancement
    if (context.intentHierarchy?.primaryIntent) {
      const intentEnhancedQuery = `${context.intentHierarchy.primaryIntent} ${message}`;
      console.log(`\n🔍 Trying intent-enhanced query: "${intentEnhancedQuery}"`);
      
      results = await getVectorKnowledge(intentEnhancedQuery, context);
      
      // Track this attempt
      context.retrievalStats.history.push({
        strategy: 'intent_fallback',
        query: intentEnhancedQuery,
        resultCount: results?.length || 0,
        timestamp: Date.now()
      });
      
      if (results && results.length > 0) {
        console.log(`\n✅ Intent fallback successful: ${results.length} results`);
        
        // Cache under the original query
        knowledgeCache.set(cacheKey, {
          results: results,
          timestamp: Date.now()
        });
        
        return results;
      }
    }
    
    // 4. Try with secondary intents if available
    if (context.intentHierarchy?.secondaryIntents?.length > 0) {
      console.log(`\n🔍 ATTEMPT 4: Secondary intent fallback`);
      
      // Try each secondary intent
      for (const intent of context.intentHierarchy.secondaryIntents) {
        const secondaryIntentQuery = `${intent} ${message}`;
        console.log(`\n🔍 Trying secondary intent query: "${secondaryIntentQuery}"`);
        
        results = await getVectorKnowledge(secondaryIntentQuery, context);
        
        // Track this attempt
        context.retrievalStats.history.push({
          strategy: 'secondary_intent_fallback',
          intent,
          query: secondaryIntentQuery,
          resultCount: results?.length || 0,
          timestamp: Date.now()
        });
        
        if (results && results.length > 0) {
          console.log(`\n✅ Secondary intent fallback successful: ${results.length} results`);
          
          // Cache under the original query
          knowledgeCache.set(cacheKey, {
            results: results,
            timestamp: Date.now()
          });
          
          return results;
        }
      }
    }
    
    // 5. Last resort - try keyword extraction
    console.log(`\n🔍 ATTEMPT 5: Keyword fallback`);
    
    // Extract keywords (words with 4+ chars)
    const keywords = message.split(' ')
      .filter(word => word.length >= 4)
      .slice(0, 3);
      
    if (keywords.length > 0) {
      const keywordQuery = keywords.join(' ');
      console.log(`\n🔍 Trying keyword search: "${keywordQuery}"`);
      
      results = await getVectorKnowledge(keywordQuery, context);
      
      // Track this attempt
      context.retrievalStats.history.push({
        strategy: 'keyword_fallback',
        keywords,
        query: keywordQuery,
        resultCount: results?.length || 0,
        timestamp: Date.now()
      });
      
      if (results && results.length > 0) {
        console.log(`\n✅ Keyword fallback successful: ${results.length} results`);
        
        // Cache under the original query
        knowledgeCache.set(cacheKey, {
          results: results,
          timestamp: Date.now()
        });
        
        return results;
      }
    }
    
    // All fallbacks failed, update stats
    context.retrievalStats.fallbacks++;
    context.retrievalStats.successRate = 
      (context.retrievalStats.attempts - context.retrievalStats.fallbacks) / 
      context.retrievalStats.attempts;
    
    console.log(`\n⚠️ Knowledge retrieval failed after all fallback attempts`);
    console.log(`📊 Retrieval stats: ${context.retrievalStats.successRate * 100}% success rate after ${context.retrievalStats.attempts} attempts`);
    
    // Try to use a traditional search method if all fallbacks failed
    try {
      // Import the getRelevantKnowledge functions
      const { getRelevantKnowledge } = await import('./knowledgeBase.js');
      const { getRelevantKnowledge_is } = await import('./knowledgeBase_is.js');
      
      console.log(`\n🔍 FINAL ATTEMPT: Traditional search fallback`);
      
      // Use the appropriate function based on language
      const traditionalResults = context.language === 'is' ? 
        await getRelevantKnowledge_is(message) : 
        await getRelevantKnowledge(message);
      
      // Track this attempt
      context.retrievalStats.history.push({
        strategy: 'traditional_search',
        query: message,
        resultCount: traditionalResults?.length || 0,
        timestamp: Date.now()
      });
      
      if (traditionalResults && traditionalResults.length > 0) {
        console.log(`\n✅ Traditional search fallback successful: ${traditionalResults.length} results`);
        
        // We don't cache these results since they're last-resort fallbacks
        
        return traditionalResults;
      }
    } catch (traditionalError) {
      console.error(`\n❌ Traditional search failed:`, traditionalError);
    }

    // Check if this is an ongoing conversation
    if (context && context.messages && context.messages.filter(m => m.role === 'assistant').length > 0) {
        // This is an ongoing conversation, not the first interaction
        console.log('\n🔄 Adding conversation continuity context for failed knowledge retrieval');
        
        return [{
            type: 'conversation_context',
            content: {
                isOngoing: true,
                messageCount: context.messages.length,
                shouldAvoidGreeting: true,
                lastTopic: context.lastTopic || 'general'
            }
        }];
    }    
    
    // Return empty array if all fallbacks failed
    return [];
    
  } catch (error) {
    console.error(`\n❌ Error in comprehensive knowledge retrieval:`, error);
    
    // Log detailed error info
    console.error(`Stack trace: ${error.stack}`);
    console.error(`Message: ${message}`);
    console.error(`Context: ${JSON.stringify({
      language: context.language,
      lastTopic: context.lastTopic,
      topics: context.topics && context.topics.length
    })}`);
    
    return []; // Ensure we always return something, even on error
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
 * Get session context with MongoDB persistence to prevent session loss
 * @param {string} sessionId - Unique session ID
 * @returns {Object} - Session context
 */
export async function getPersistentSessionContext(sessionId) {
  try {
    // First check in-memory cache
    if (sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      session.lastInteraction = Date.now();
      return session;
    }
    
    console.log(`🔍 Session not found in memory, attempting recovery for ${sessionId}`);
    
    // Check MongoDB for existing session
    const { db } = await connectToDatabase();
    const sessionCollection = db.collection('chat_sessions');
    
    const savedSession = await sessionCollection.findOne({ sessionId });
    
    if (savedSession) {
        console.log(`✅ Recovered session ${sessionId} from MongoDB`);
        
        // Convert MongoDB format to context format
        const recoveredContext = {
            ...savedSession,
            lastInteraction: Date.now()
        };
        
        // Ensure adaptiveMemory is properly initialized as a class instance
        if (!recoveredContext.adaptiveMemory || typeof recoveredContext.adaptiveMemory.addMemory !== 'function') {
            console.log('Initializing AdaptiveMemory for recovered session');
            const oldMemories = recoveredContext.adaptiveMemory?.memories || [];
            recoveredContext.adaptiveMemory = new AdaptiveMemory(30);
            recoveredContext.adaptiveMemory.memories = oldMemories;
        }
        
        // Ensure intentHierarchy is properly initialized as a class instance
        if (!recoveredContext.intentHierarchy || typeof recoveredContext.intentHierarchy.updateIntent !== 'function') {
            console.log('Initializing IntentHierarchy for recovered session');
            
            // Save existing data
            const oldPrimaryIntent = recoveredContext.intentHierarchy?.primaryIntent || null;
            const oldSecondaryIntents = recoveredContext.intentHierarchy?.secondaryIntents || [];
            const oldIntentStrength = recoveredContext.intentHierarchy?.intentStrength || {};
            const oldLastUpdate = recoveredContext.intentHierarchy?.lastUpdate || Date.now();
            
            // Create new instance
            recoveredContext.intentHierarchy = new IntentHierarchy();
            
            // Restore data
            recoveredContext.intentHierarchy.primaryIntent = oldPrimaryIntent;
            recoveredContext.intentHierarchy.secondaryIntents = oldSecondaryIntents;
            recoveredContext.intentHierarchy.lastUpdate = oldLastUpdate;
            
            // Handle Map restoration
            if (oldIntentStrength && typeof oldIntentStrength === 'object') {
                if (!oldIntentStrength.set && !oldIntentStrength.get) {
                    const newMap = new Map();
                    Object.keys(oldIntentStrength).forEach(key => {
                        newMap.set(key, oldIntentStrength[key]);
                    });
                    recoveredContext.intentHierarchy.intentStrength = newMap;
                } else {
                    recoveredContext.intentHierarchy.intentStrength = oldIntentStrength;
                }
            }
        }
        
        // Ensure topicGraph is properly initialized as a class instance
        if (!recoveredContext.topicGraph || typeof recoveredContext.topicGraph.addTopic !== 'function') {
            console.log('Initializing TopicGraph for recovered session');
            
            // Save existing data
            const oldNodes = recoveredContext.topicGraph?.nodes || new Map();
            const oldEdges = recoveredContext.topicGraph?.edges || new Map();
            
            // Create new instance
            recoveredContext.topicGraph = new TopicGraph();
            
            // Handle Map restoration for nodes
            if (oldNodes && typeof oldNodes === 'object') {
                if (!oldNodes.set && !oldNodes.get) {
                    const newNodesMap = new Map();
                    Object.keys(oldNodes).forEach(key => {
                        newNodesMap.set(key, oldNodes[key]);
                    });
                    recoveredContext.topicGraph.nodes = newNodesMap;
                } else {
                    recoveredContext.topicGraph.nodes = oldNodes;
                }
            }
            
            // Handle Map restoration for edges
            if (oldEdges && typeof oldEdges === 'object') {
                if (!oldEdges.set && !oldEdges.get) {
                    const newEdgesMap = new Map();
                    Object.keys(oldEdges).forEach(key => {
                        newEdgesMap.set(key, oldEdges[key]);
                    });
                    recoveredContext.topicGraph.edges = newEdgesMap;
                } else {
                    recoveredContext.topicGraph.edges = oldEdges;
                }
            }
        }
        
        // Ensure conversationMemory is properly initialized with methods
        if (!recoveredContext.conversationMemory || typeof recoveredContext.conversationMemory.addTopic !== 'function') {
            console.log('Initializing conversationMemory for recovered session');
            
            // Save existing data
            const oldTopics = recoveredContext.conversationMemory?.topics || [];
            const oldLastResponse = recoveredContext.conversationMemory?.lastResponse || null;
            const oldContextualQuestions = recoveredContext.conversationMemory?.contextualQuestions || {};
            const oldPreviousInteractions = recoveredContext.conversationMemory?.previousInteractions || [];
            
            // Create new conversationMemory with all required methods
            recoveredContext.conversationMemory = {
                topics: oldTopics,
                lastResponse: oldLastResponse,
                contextualQuestions: oldContextualQuestions,
                previousInteractions: oldPreviousInteractions,
                addTopic: function(topic, details) {
                    this.topics.unshift({ 
                        topic, 
                        details, 
                        timestamp: Date.now(),
                        language: recoveredContext.language
                    });
                    if (this.topics.length > 5) this.topics.pop();
                },
                getLastTopic: function() {
                    return this.topics[0]?.topic || null;
                },
                getTopicDetails: function(topic) {
                    return this.topics.find(t => t.topic === topic)?.details || null;
                }
            };
        }
        
        // Update in-memory cache
        sessions.set(sessionId, recoveredContext);
        return recoveredContext;
    }
    
    // If no session found, create new one
    console.log(`🧠 Creating new session context for ${sessionId}`);
    const newContext = getSessionContext(sessionId);
    
    // Save to MongoDB for persistence
    await sessionCollection.insertOne({
      ...newContext,
      sessionId,
      createdAt: new Date(),
      lastInteraction: Date.now()
    });
    
    return newContext;
  } catch (error) {
    console.error(`❌ Error in persistent session recovery:`, error);
    // Fallback to in-memory session
    return getSessionContext(sessionId);
  }
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
    closing: /close|closing|lok|loka|lokar|lokun/i,
    // Add opening pattern
    opening: /open|opens|opening|when do you open|what time (do|does) you open|opið|opnið|opnar|hvenær opið|hvenær opnið|hvenær opnar/i,
    // Add date-specific patterns
    dateSpecific: /tomorrow|next day|tonight|today|this evening|for the weekend|weekend|á morgun|næsta dag|í kvöld|í dag|þetta kvöld|um helgina|helgina/i,
    // Add holiday patterns
    holiday: /easter|holiday|christmas|new year|special|páska|hátíðar|jól|áramót|sérstakur/i
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

  // NEW: Track if message is asking about opening times
  if (timePatterns.opening.test(msg)) {
    const isHoliday = seasonInfo.season === 'holiday';
    const hasDate = timePatterns.dateSpecific.test(msg);
    
    context.timeContext.lastDiscussedTime = {
      type: 'opening',
      timestamp: Date.now(),
      holiday: isHoliday,
      dateSpecific: hasDate,
      text: msg
    };
    
    console.log('\n⏰ Opening Time Question Detected:', {
      message: message,
      holiday: isHoliday, 
      dateSpecific: hasDate,
      season: seasonInfo.season,
      openingTime: seasonInfo.openingTime || 'Not specified'
    });
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

  // NEW: Track date-specific queries (tomorrow, weekend, etc.)
  if (timePatterns.dateSpecific.test(msg)) {
    // Extract the date reference
    const dateMatches = msg.match(/tomorrow|next day|tonight|today|this evening|for the weekend|weekend|á morgun|næsta dag|í kvöld|í dag|þetta kvöld|um helgina|helgina/i);
    const dateReference = dateMatches ? dateMatches[0] : null;
    
    if (dateReference) {
      context.timeContext.dateReference = {
        text: dateReference,
        timestamp: Date.now()
      };
      
      console.log('\n📅 Date-Specific Query Detected:', {
        dateReference,
        message: message
      });
    }
  }

  // NEW: Track holiday-specific queries (Easter, Christmas, etc.)
  if (timePatterns.holiday.test(msg)) {
    // Extract holiday reference
    const holidayMatches = msg.match(/easter|christmas|new year|páska|jól|áramót/i);
    const holidayReference = holidayMatches ? holidayMatches[0] : null;
    
    if (holidayReference) {
      context.timeContext.holidayReference = {
        text: holidayReference,
        timestamp: Date.now()
      };
      
      console.log('\n🎉 Holiday-Specific Query Detected:', {
        holidayReference,
        message: message
      });
    }
  }

  // Build and return the time context result with enhanced information
  const result = {
    type: timePatterns.duration.test(msg) ? 'duration' : 
          timePatterns.opening.test(msg) ? 'opening' :
          timePatterns.closing.test(msg) ? 'closing' : 
          (timePatterns.opening.test(msg) || timePatterns.closing.test(msg)) ? 'hours' : null,
    activity: msg.match(/ritual|ritúal/i) ? 'ritual' : 
             msg.match(/dinner|food|mat|borða|dining/i) ? 'dining' : null,
    season: seasonInfo?.season || 'regular',
    isDateSpecific: timePatterns.dateSpecific.test(msg),
    isHolidayRelated: timePatterns.holiday.test(msg),
    operatingHours: seasonInfo ? {
      opening: seasonInfo.openingTime || 'Not specified',
      closing: seasonInfo.closingTime || 'Not specified',
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