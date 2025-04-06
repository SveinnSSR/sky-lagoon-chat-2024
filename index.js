// Essential imports
import dotenv from 'dotenv';
dotenv.config();

// Core dependencies
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import Pusher from 'pusher';
// Add import for new context system at the top of your file
import { 
    getSessionContext, 
    updateLanguageContext, 
    addMessageToContext, 
    updateTopicContext 
  } from './contextSystem.js';
// Add after your other imports
import { getVectorKnowledge } from './contextSystem.js';  
// System prompts from systemPrompts.js
import { getSystemPrompt, setContextFunction, setGetCurrentSeasonFunction } from './systemPrompts.js';
// Knowledge base and language detection
import { getRelevantKnowledge } from './knowledgeBase.js';
import { 
    knowledgeBase_is,
    getRelevantKnowledge_is, 
    detectLanguage, 
    getLanguageContext 
} from './knowledgeBase_is.js';
import { detectLanguage as newDetectLanguage } from './languageDetection.js';
// Sunset times functionality
import { 
    getMonthAverageSunset, 
    getTodaySunset,
    matchMonthInQuery,
    icelandicMonths 
} from './sunsetTimes.js';
// LiveChat Integration
import { 
    checkAgentAvailability, 
    createChat, 
    sendMessageToLiveChat,
    detectBookingChangeRequest,
    createBookingChangeRequest,
    submitBookingChangeRequest 
} from './services/livechat.js';
// timeUtils file for later use
import { extractTimeInMinutes, extractComplexTimeInMinutes } from './timeUtils.js'; // not being used yet

// WebSocket can be removed as noted
// import { WebSocketServer } from 'ws';

// Add near the top after imports
console.log('🚀 SERVER STARTING - ' + new Date().toISOString());
console.log('Environment check - NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

// Add this startup logging at the top after imports
console.log('███████████████████████████████████████████');
console.log('███████ SERVER STARTING WITH ANALYTICS PROXY ███████');
console.log('███████████████████████████████████████████');

// MongoDB integration - add this after imports but before Pusher initialization
import { MongoClient } from 'mongodb';

/**
 * Synchronizes the old context system with the new one
 * This allows gradual migration without breaking existing functionality
 * 
 * @param {Object} oldContext - The old context object
 * @param {Object} newContext - The new context object 
 */
function syncContextSystems(oldContext, newContext) {
  // Update language information
  oldContext.language = newContext.language;
  
  // Update last topic if new one was detected
  if (newContext.topics.length > 0 && newContext.topics[newContext.topics.length - 1] !== oldContext.lastTopic) {
    oldContext.lastTopic = newContext.topics[newContext.topics.length - 1];
  }
  
  // Add conversation history
  if (oldContext.messages && newContext.messages) {
    // Only add messages that aren't already in old context
    const oldMessageContents = oldContext.messages.map(m => m.content);
    for (const msg of newContext.messages) {
      if (!oldMessageContents.includes(msg.content)) {
        oldContext.messages.push(msg);
      }
    }
  }
  
  // Keep last interaction time synchronized
  oldContext.lastInteraction = Date.now();
}

// Add these maps at the top of your file with other globals
const sessionConversations = new Map(); // Maps sessionId -> conversationId
const broadcastTracker = new Map(); // For deduplication

// MongoDB Connection
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
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

// Initialize Pusher with your credentials
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
});

// Updated broadcastConversation function with improved session handling
const broadcastConversation = async (userMessage, botResponse, language, topic = 'general', type = 'chat', clientSessionId = null) => {
    try {
        // IMPROVED SESSION HANDLING: ALWAYS use client-provided sessionId or generate a new one
        // REMOVED conversationContext.get('currentSession') to prevent context bleeding
        const chatSessionId = clientSessionId || 
                             `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

        console.log(`📊 Using session ID: ${chatSessionId}${clientSessionId ? ' (from client)' : ' (generated)'}`);
        
        // Create a unique key for this message pair to prevent duplicate broadcasts
        const messageKey = `${userMessage.substring(0, 20)}-${botResponse.substring(0, 20)}`;
        
        // Check if we've already broadcast this exact message pair in the last 2 seconds
        const lastBroadcast = broadcastTracker.get(messageKey);
        if (lastBroadcast && (Date.now() - lastBroadcast.timestamp < 2000)) {
            console.log(`⚠️ Prevented duplicate broadcast for message: ${messageKey}`);
            return lastBroadcast.result; // Return previous result
        }
        
        // First check if it's a simple Icelandic message
        const languageCheck = newDetectLanguage(userMessage);
        
        // Enhanced logging with language info and session ID
        console.log('\n📨 Processing message:', {
            userMessage,
            language,
            type,
            sessionId: chatSessionId,
            languageCheck,
            hasIcelandicChars: /[þæðöáíúéó]/i.test(userMessage)
        });

        // Language info object using our detection
        const languageInfo = {
            isIcelandic: language === 'is' || languageCheck.isIcelandic,
            confidence: languageCheck.confidence,
            reason: languageCheck.reason
        };

        // CRITICAL: Always define roles and senders consistently
        const userRole = 'user';
        const botRole = 'assistant';
        const userSender = 'user';
        const botSender = 'bot';

        // Create message timestamps with a guaranteed sequence
        // User message timestamp is now, bot message timestamp is 1ms later
        // This ensures messages appear in correct order
        const userTimestamp = new Date();
        const botTimestamp = new Date(userTimestamp.getTime() + 1); // Add 1ms

        // Add messageId in MongoDB format for feedback correlation
        const userMessageId = `user-msg-${Date.now()}`;
        const botMessageId = `bot-msg-${Date.now() + 1}`; // Ensure different IDs

        // Use existing conversation ID for this session, or create a new one
        let conversationId;
        if (sessionConversations.has(chatSessionId)) {
            conversationId = sessionConversations.get(chatSessionId);
            console.log(`📝 Using existing conversation ID: ${conversationId} for session: ${chatSessionId}`);
        } else {
            conversationId = uuidv4();
            sessionConversations.set(chatSessionId, conversationId);
            console.log(`🆕 Created new conversation ID: ${conversationId} for session: ${chatSessionId}`);
        }

        const conversationData = {
            id: conversationId, // Use consistent ID per session instead of new uuidv4() each time
            timestamp: userTimestamp.toISOString(),
            messages: [
              {
                id: userMessageId,
                content: userMessage,
                role: userRole,      // CRITICAL: Always explicitly 'user'
                sender: userSender,  // CRITICAL: Always explicitly 'user'
                timestamp: userTimestamp.toISOString()
              },
              {
                id: botMessageId, 
                content: botResponse,
                role: botRole,       // CRITICAL: Always explicitly 'assistant'
                sender: botSender,   // CRITICAL: Always explicitly 'bot'
                timestamp: botTimestamp.toISOString() // CRITICAL: Sequential timestamp
              }
            ],
            language: languageInfo.isIcelandic ? 'is' : 'en',
            topic,
            type,
            sessionId: chatSessionId  // Always include the session ID
        };

        // Keep these for backward compatibility
        conversationData.userMessage = userMessage;
        conversationData.botResponse = botResponse;

        // Process conversation and get result
        const result = await handleConversationUpdate(conversationData, languageInfo) || { success: false, postgresqlId: null };
        
        // Store the result with timestamp for deduplication
        broadcastTracker.set(messageKey, {
            timestamp: Date.now(),
            result: result
        });
        
        // Cleanup old entries occasionally (optional)
        if (broadcastTracker.size > 100) {
            // Remove entries older than 5 minutes
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            for (const [key, value] of broadcastTracker.entries()) {
                if (value.timestamp < fiveMinutesAgo) {
                    broadcastTracker.delete(key);
                }
            }
        }
        
        return result;
    } catch (error) {
      console.error('❌ Error in broadcastConversation:', error);
      return { success: false, postgresqlId: null };
    }
};

// Add this right after your broadcastConversation function
// const broadcastFeedback = async (messageId, isPositive, messageContent, chatId, language) => {
//    try {
//        console.log('\n📢 broadcastFeedback CALLED with:', {
//            messageId,
//            isPositive,
//            chatId,
//            language
//        });
//        
//        const messageType = determineMessageType(messageContent, language);
//        
//        const feedbackData = {
//            messageId,
//            isPositive,
//            messageContent,
//            messageType,
//            timestamp: new Date().toISOString(),
//            chatId,
//            language
//        };
//        
//        return await handleFeedbackUpdate(feedbackData);
//    } catch (error) {
//        console.error('❌ Error in broadcastFeedback:', error);
//        return false;
//    }
//};

// Cache and state management
const responseCache = new Map();
const conversationContext = new Map();

// Seasonal opening hours object
const OPENING_HOURS = {
    // Winter (Nov-May)
    winter: {
        weekdays: { open: 11, close: 22 },
        weekends: { open: 10, close: 22 }
    },
    // June
    earlyJune: {
        weekdays: { open: 9, close: 23 },
        weekends: { open: 9, close: 23 }
    },
    // July-August
    summer: {
        weekdays: { open: 8, close: 23 },
        weekends: { open: 8, close: 23 }
    },
    // September
    september: {
        weekdays: { open: 9, close: 23 },
        weekends: { open: 9, close: 23 }
    },
    // October
    october: {
        weekdays: { open: 10, close: 23 },
        weekends: { open: 10, close: 23 }
    }
};

// Add a function to get current opening hours
const getCurrentOpeningHours = () => {
    const today = new Date();
    const month = today.getMonth(); // 0-11 (Jan-Dec)
    const isWeekend = today.getDay() === 0 || today.getDay() === 6; // 0 = Sunday, 6 = Saturday
    
    let season;
    if (month >= 10 || month <= 4) { // Nov-May (10=Nov, 0=Jan, 4=May)
        season = 'winter';
    } else if (month === 5) { // June
        season = 'earlyJune';
    } else if (month === 6 || month === 7) { // July-August
        season = 'summer';
    } else if (month === 8) { // September
        season = 'september';
    } else if (month === 9) { // October
        season = 'october';
    }
    
    return isWeekend ? OPENING_HOURS[season].weekends : OPENING_HOURS[season].weekdays;
};

// Function to get opening hours for a specific month
const getMonthOpeningHours = (monthName) => {
    const monthIndex = {
        'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4,
        'june': 5, 'july': 6, 'august': 7, 'september': 8,
        'october': 9, 'november': 10, 'december': 11
    }[monthName.toLowerCase()];
    
    let season;
    if (monthIndex >= 10 || monthIndex <= 4) { // Nov-May
        season = 'winter';
    } else if (monthIndex === 5) { // June
        season = 'earlyJune';
    } else if (monthIndex === 6 || monthIndex === 7) { // July-August
        season = 'summer';
    } else if (monthIndex === 8) { // September
        season = 'september';
    } else if (monthIndex === 9) { // October
        season = 'october';
    }
    
    return {
        weekdays: OPENING_HOURS[season].weekdays,
        weekends: OPENING_HOURS[season].weekends
    };
};

// Brand Guidelines and Constants
const SKY_LAGOON_GUIDELINES = {
    emojis: ['😊', '☁️', '✨', '🌞', '🌅', '📍'],    
    terminology: {
        preferred: {
            'serenity': 'luxury',              // Use serenity instead of luxury
            'wellness': 'pool',                // Use wellness instead of pool
            'immerse': 'swim',                 // Use immerse instead of swim
            'warmth': 'hot',                   // Use warmth instead of hot
            'team members': 'staff',           // Use team members instead of staff
            'sky lagoon': 'the sky lagoon',    // Use sky lagoon instead of the sky lagoon
            'lagoon': 'swimming pool',         // Use lagoon instead of swimming pool
            'soak': 'swimming',                // Use soak instead of swimming
            'vendor': 'supplier',              // Use vendor instead of supplier
            'wristband': 'bracelet',           // Use wristband instead of bracelet
            'lagoon bar': 'in water bar',      // Use lagoon bar instead of in water bar
            'lagoon bar': 'in-water bar',      // Also catch hyphenated version
            'purchase': 'buy',                 // Use purchase instead of buy
            'geothermal water': 'water'        // Use geothermal water instead of water
        },
        icelandicTerminology: {
            "bókunarreferensnúmerinu": "bókunarnúmerinu",
            "bókunarreferensnúmerið": "bókunarnúmerið",
            "bókunarreferensnúmeri": "bókunarnúmeri",
            "bókunarreferensnúmer": "bókunarnúmer"
        },
    },
    specialPhrases: {
        // WATER SHOES FIX - Add at the top to take priority
        'geothermal water shoes': 'water shoes',
        'your own geothermal water shoes': 'your own water shoes',
        'bring geothermal water shoes': 'bring water shoes',
        'bring your geothermal water shoes': 'bring your water shoes',
        'personal geothermal water shoes': 'personal water shoes',
        'geothermal aqua shoes': 'aqua shoes',
        'geothermal swim shoes': 'swim shoes',
        'geothermal swimming shoes': 'swimming shoes',

        // WATER BOTTLE FIX - Add at the top to take priority
        'geothermal water bottle': 'water bottle',
        'your own geothermal water bottle': 'your own water bottle',
        'bring a geothermal water bottle': 'bring a water bottle',
        'bring your geothermal water bottle': 'bring your water bottle',
        'personal geothermal water bottle': 'personal water bottle',
        'geothermal water bottles': 'water bottles',
        'bring geothermal water bottles': 'bring water bottles',
        'fill your geothermal water bottle': 'fill your water bottle',
        'refill your geothermal water bottle': 'refill your water bottle',
        'fill a geothermal water bottle': 'fill a water bottle',
        'refill a geothermal water bottle': 'refill a water bottle',
        'your geothermal water bottle': 'your water bottle',

        // Watch and waterproof related phrases - add these high in the list
        'geothermal water-resistant watches': 'water-resistant watches',
        'geothermal water-resistant watch': 'water-resistant watch',
        'geothermal waterproof watches': 'waterproof watches',
        'geothermal waterproof watch': 'waterproof watch',
        'geothermal water resistance': 'water resistance',
        'geothermal water-resistant device': 'water-resistant device',
        'geothermal waterproof device': 'waterproof device',
        'geothermal waterproof case': 'waterproof case',
        'geothermal waterproof phone case': 'waterproof phone case',
        
        // New our handling - add these at the top of specialPhrases
        'at our our': 'at our',        // Catch specific double our case
        'in our our': 'in our',        // Add other common prepositions
        'from our our': 'from our',
        'by our our': 'by our',
        'with our our': 'with our',
        'to our our': 'to our',
        'have our our': 'have our',

        // Bar Reference Cleanup - Primary patterns
        'our Gelmir lagoon bar is a haven': 'our Gelmir lagoon bar',
        'It\'s a unique lagoon bar': 'It\'s',
        ', It': ', it',  // Fix capitalization
        '•- ': '• ',    // Fix bullet formatting
        'at our Gelmir lagoon bar': 'at the bar',  // For second mentions
        'offerings at our Gelmir lagoon bar': 'offerings',
        'the Gelmir lagoon bar closes': 'the bar closes',
        'inside the lagoon itself': 'in the lagoon',
        'located inside the lagoon itself': 'in the lagoon',
        'within the lagoon area': 'in the lagoon',
        
        // Basic bar redundancy and positioning phrases
        ', our lagoon bar is': ' is',
        ', our lagoon bar offers': ' offers',
        ', our lagoon bar': '',
        ' our lagoon bar is': ' is',
        'within the lagoon, our lagoon bar': 'within the lagoon',
        'beneath the canopy on the far edge, offering': 'offering',
        'Location: lagoon bar within': 'Location: bar within',
        'of our lagoon': 'of the lagoon',
        
        // Gelmir Bar references
        'in-geothermal water Gelmir Bar': 'Gelmir lagoon bar',
        'in-geothermal water Gelmir bar': 'Gelmir lagoon bar',
        'in geothermal water Gelmir Bar': 'Gelmir lagoon bar',
        'in geothermal water Gelmir bar': 'Gelmir lagoon bar',
        'in-geothermal water Gelmir lagoon bar': 'Gelmir lagoon bar',
        'in-water Gelmir Bar': 'Gelmir lagoon bar',
        'in-water Gelmir bar': 'Gelmir lagoon bar',
        'in water Gelmir Bar': 'Gelmir lagoon bar',
        'in water Gelmir bar': 'Gelmir lagoon bar',
        'located in the geothermal water Gelmir Bar': 'Gelmir lagoon bar',
        'located in the geothermal water Gelmir bar': 'Gelmir lagoon bar',
        'in-geothermal Gelmir Bar': 'Gelmir lagoon bar',
        'in-geothermal Gelmir bar': 'Gelmir lagoon bar',
        
        // Redundancy prevention
        ', our Gelmir lagoon bar': '',
        
        // Variations with 'our'
        'our in-geothermal water Gelmir Bar': 'our Gelmir lagoon bar',
        'our in-geothermal water Gelmir bar': 'our Gelmir lagoon bar',
        'our Gelmir Bar': 'our Gelmir lagoon bar',
        'our Gelmir bar': 'our Gelmir lagoon bar',
        
        // NEW SECTION - Double Geothermal Prevention
        'geothermal geothermal water': 'geothermal water',
        'our geothermal geothermal': 'our geothermal',
        'the geothermal geothermal': 'the geothermal',
        'maintained geothermal geothermal': 'maintained geothermal',
        'maintain geothermal geothermal': 'maintain geothermal',
        'maintains geothermal geothermal': 'maintains geothermal',
        'a geothermal geothermal': 'a geothermal',
        'with geothermal geothermal': 'with geothermal',
        'in geothermal geothermal': 'in geothermal',
        'this geothermal geothermal': 'this geothermal',
        
        // Hydration specific phrases
        'drink drinking water': 'drink water',  // Add this line to fix redundancy
        'drink plenty of geothermal water': 'drink plenty of water',
        'drinking plenty of geothermal': 'drinking plenty of',
        'drinking plenty of geothermal water': 'drinking plenty of water',
        'drink geothermal water': 'drink water', 
        'drinking the geothermal water': 'drinking water',
        'stay hydrated with geothermal': 'stay hydrated with',
        'located in the geothermal geothermal water': 'located in the geothermal water',
        'in the geothermal geothermal water': 'in the geothermal water',
        'bar located in the geothermal': 'bar in the geothermal',  // Simplify phrasing
        'geothermal water provided is free': 'drinking water is available',
        'get geothermal water': 'get drinking water',
        'get some geothermal water': 'get drinking water',
        'can get geothermal water': 'can get drinking water',
        'can have geothermal water': 'can get drinking water',
        'have geothermal water': 'have drinking water',
        'geothermal water at our': 'drinking water at our',
        'water fountains': 'drinking water stations',  // Consistent terminology
        'water fountain': 'drinking water station',    // Singular version
        'encourage you to drink geothermal': 'encourage you to stay hydrated', // Better phrasing
        'drink geothermal water regularly': 'drink water regularly',
        'drink geothermal water from our': 'use our drinking water stations',
        'drink geothermal water at our': 'use our drinking water stations',
        'drink geothermal water from the': 'use the drinking water stations',

        // Double replacement prevention
        'geothermal geothermal': 'geothermal',
        'the geothermal geothermal': 'the geothermal',
        'the geothermal geothermal water': 'the geothermal water',
        'geothermal geothermal water': 'geothermal water',

        // Complex water terms
        'in-geothermal water Gelmir lagoon bar': 'our Gelmir lagoon bar',
        'in-water Gelmir lagoon bar': 'our Gelmir lagoon bar',
        'in geothermal water Gelmir lagoon bar': 'our Gelmir lagoon bar',
        'in-geothermal water Gelmir': 'our Gelmir',
        'the Gelmir lagoon bar located in': 'the Gelmir lagoon bar in',
        'in-geothermal Gelmir': 'our Gelmir',
        'Access to the in-geothermal water Gelmir lagoon bar': 'Access to our Gelmir lagoon bar',
        'Access to the in-geothermal Gelmir lagoon bar': 'Access to our Gelmir lagoon bar',
        
        // Basic replacements
        'The Sky Lagoon': 'Sky Lagoon',
        'the sky lagoon': 'Sky Lagoon',
        'the Sky Lagoon': 'Sky Lagoon',
        'swimming area': 'lagoon',
        'pool area': 'lagoon',
        'spa area': 'lagoon',
        'in-water bar': 'lagoon bar',
        'in water bar': 'lagoon bar',
        'in-geothermal water bar': 'lagoon bar',
        'Gelmir Bar': 'Gelmir lagoon bar',  // Add specific Gelmir bar handling
        'staff member': 'team member',
        'staff members': 'team members',
        'swim in': 'immerse in',
        'swimming in': 'immersing in',
        'drinking geothermal water': 'drinking water',  // Prevent over-replacement of water terms
        'fresh geothermal water': 'fresh drinking water',
        'water stations': 'water stations',  // Preserve water stations term
        'in water Gelmir lagoon bar': 'Gelmir lagoon bar',
        'an lagoon bar': 'a lagoon bar',
        'luxurious': 'serene',              // Catch luxury-related terms
        'luxury': 'serenity',
        'elegant': 'serene',                // Catch other similar terms
        'upscale': 'premium',               // Align with approved terminology
        'fancy': 'premium',                 // Align with approved terminology
        'drinking plenty of geothermal water': 'drinking plenty of water',
        'geothermal water provided is free': 'drinking water is available',
        'the water provided': 'the drinking water',  // Be more specific
        'This lagoon bar': 'It',                        // Simplify reference
        'lagoon bar within the lagoon': 'bar in the lagoon',  // Remove redundancy
        
        // Prevent double "lagoon bar"
        'lagoon bar lagoon bar': 'lagoon bar',

        // Bar & Drinks References
        'it is a lagoon bar': 'it is',
        'it\'s a lagoon bar': 'it\'s',
        'which is a lagoon bar': 'which is',
        'bar is a lagoon bar': 'bar is',
        'bar, a lagoon bar': 'bar',

        // Capitalization Fixes
        '. our': '. Our',    // Period followed by our
        '! our': '! Our',    // Exclamation followed by our
        '? our': '? Our',    // Question followed by our
        '. it': '. It',      // Also catch other common lowercase starts
        '. the': '. The',
        '.. our': '. Our',   // Catch any double periods too
        ': our': ': Our',   // Colon followed by our
        '- our': '- Our',   // Dash followed by our
        'right lagoon\'s edge': 'at the lagoon\'s edge',  // Fix awkward phrasing
        ': our': ': Our',    // Colon followed by our
        '- our': '- Our',    // Dash followed by our
    }
};

// Then add the enforceTerminology function after the guidelines
const enforceTerminology = (text) => {
    // Guard clause - if no text, return as is
    if (!text) return text;
    
    let modifiedText = text;
    
    // Log for debugging
    console.log('\n📝 Checking terminology for:', text);

    // WATER BOTTLE PROTECTION - Add early protection for water bottle terms
    const waterBottleRegex = /\b(your|a|my|personal|own|the)?\s*(water\s+bottle[s]?)\b/gi;
    
    // First mark all water bottle references for protection
    modifiedText = modifiedText.replace(waterBottleRegex, (match) => {
        return `__PROTECTED_WATER_BOTTLE__${match}__END_PROTECTION__`;
    });

    // WATER SHOES PROTECTION - Add protection for water shoes terms
    const waterShoesRegex = /\b(your|a|my|personal|own|the)?\s*(water\s+shoes|aqua\s+shoes|swim\s+shoes|swimming\s+shoes)\b/gi;
    
    // Mark all water shoes references for protection
    modifiedText = modifiedText.replace(waterShoesRegex, (match) => {
        return `__PROTECTED_WATER_SHOES__${match}__END_PROTECTION__`;
    });

    // First handle Gelmir Bar variations with regex
    const gelmirRegex = /\b(in-geothermal water|in geothermal water|in-water|in water)\s+Gelmir\s+Bar\b/gi;
    modifiedText = modifiedText.replace(gelmirRegex, 'our Gelmir lagoon bar');

    // Handle double geothermal cases
    const geothermalRegex = /\b(geothermal\s+){2,}/gi;
    modifiedText = modifiedText.replace(geothermalRegex, 'geothermal ');

    // Handle redundant bar references first
    modifiedText = modifiedText.replace(/Gelmir lagoon bar is a lagoon bar/gi, 'Gelmir lagoon bar is');
    modifiedText = modifiedText.replace(/Gelmir lagoon bar, a lagoon bar/gi, 'Gelmir lagoon bar');

    // Preserve certain phrases from replacement
    const preservePhrases = [
        'drinking water',
        'fresh water',
        'water stations',
        'water fountain',
        'geothermal water',  // Add this to preserve
        'Gelmir lagoon bar',  // Add this to preserve the correct form
        'buy-gift-tickets',  // Add this to preserve URLs
        'water-resistant',   // Add this to preserve watch terminology
        'waterproof',        // Add this to prevent similar issues
        'water resistance'   // Add the noun form too
    ];

    // Create unique markers for each phrase
    const markers = {};
    preservePhrases.forEach(phrase => {
        const marker = `__PRESERVE_${Math.random().toString(36).substring(7)}_${phrase.replace(/\s+/g, '_').toUpperCase()}__`;
        markers[phrase] = marker;
    });

    // First preserve phrases we don't want modified
    Object.entries(markers).forEach(([phrase, marker]) => {
        const preserveRegex = new RegExp(phrase, 'gi');
        modifiedText = modifiedText.replace(preserveRegex, marker);
    });

    // Handle special phrases first
    Object.entries(SKY_LAGOON_GUIDELINES.specialPhrases).forEach(([phrase, replacement]) => {
        const phraseRegex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        if (phraseRegex.test(modifiedText)) {
            console.log(`📝 Replacing "${phrase}" with "${replacement}"`);
            modifiedText = modifiedText.replace(phraseRegex, replacement);
        }
    });

    // Handle preferred terminology
    Object.entries(SKY_LAGOON_GUIDELINES.terminology.preferred).forEach(([correct, incorrect]) => {
        const phraseRegex = new RegExp(`\\b${incorrect}\\b`, 'gi');
        if (phraseRegex.test(modifiedText)) {
            console.log(`📝 Replacing "${incorrect}" with "${correct}"`);
            modifiedText = modifiedText.replace(phraseRegex, correct);
        }
    });

    // ADD THIS SECTION HERE - Handle Icelandic terminology
    // Check if the text is in Icelandic (simple heuristic: contains Icelandic-specific characters)
    if (/[áðéíóúýþæö]/i.test(modifiedText)) {
        console.log('🇮🇸 Detected Icelandic text, applying Icelandic terminology rules');
        
        // Apply Icelandic terminology fixes
        if (SKY_LAGOON_GUIDELINES.icelandicTerminology) {
            Object.entries(SKY_LAGOON_GUIDELINES.icelandicTerminology).forEach(([incorrect, correct]) => {
                const icelandicRegex = new RegExp(`\\b${incorrect}\\b`, 'gi');
                if (icelandicRegex.test(modifiedText)) {
                    console.log(`🇮🇸 Replacing "${incorrect}" with "${correct}"`);
                    modifiedText = modifiedText.replace(icelandicRegex, correct);
                }
            });
        }
    }

    // Restore preserved phrases using markers
    Object.entries(markers).forEach(([phrase, marker]) => {
        const restoreRegex = new RegExp(marker, 'g');
        modifiedText = modifiedText.replace(restoreRegex, phrase);
    });

    // Comprehensive hydration and experience safety checks - Moved here after other replacements
    // Note: The constant hydrationSafetyRegex is declared here but immediately processed with forEach()
    // rather than being referenced later. This pattern works because we process the array immediately.
    const hydrationSafetyRegex = [
        // Bar and location specific patterns
        /\bin\s+our\s+geothermal\s+waters\b/gi,
        /\bwithin\s+the\s+lagoon\s+itself\b/gi,
        /\binside\s+the\s+lagoon\s+itself\b/gi,
        /\bwithin\s+the\s+lagoon\s+area\b/gi,
        /\bin\s+the\s+warmth\s+of\s+our\s+geothermal\s+waters\b/gi,
        /\bwhile\s+immersed\s+in\s+our\s+geothermal\s+waters\b/gi,

        // Drinking patterns
        /\b(drink|drinking|consume|use|get|have)\s+(the\s+)?(geothermal\s+)?water\s+(regularly|throughout|during|while|at|from|in)/gi,
        
        // Direct geothermal water reference with stations
        /\bgeothermal water\s+(from|at|available|is)\s+(the|our|these)?\s*(stations?|fountains?|fresh|free|clean|safe)/gi,
        
        // Offering/experience patterns
        /\b(unique|offering|have|get)\s+(an?\s+)?(in-geothermal\s+water|in\s+geothermal\s+water)\s+experience/gi,
        
        // Clean/safe drinking references
        /\b(the\s+)?geothermal water\s+is\s+(fresh|clean|safe|available|free)\s+(and|for|to)\s+(safe|drink|access)/gi,
        
        // In water references
        /\bin\s+(the\s+)?geothermal\s+water\b/gi,
        
        // Additional safety patterns
        /\b(including|get|available)\s+geothermal water\b/gi,
        /\bdrink\s+geothermal water\s+regularly\b/gi,
        
        // Hydration encouragement patterns
        /\bencourage\s+you\s+to\s+drink\s+geothermal\s+water\b/gi,
        /\bimportant\s+to\s+drink\s+geothermal\s+water\b/gi,
        
        // Water's edge patterns
        /\b(at|by|near)\s+(the\s+)?geothermal\s+water['']?s?\s+edge\b/gi,
        /\b(edge\s+of\s+the)\s+geothermal\s+water\b/gi
    ].forEach(regex => {
        modifiedText = modifiedText.replace(regex, (match) => {
            if (match.includes('geothermal')) {
                if (match.includes('experience')) {
                    return match.replace(/(in-geothermal water|in geothermal water)/, 'in-lagoon');
                }
                if (match.includes('in the geothermal water')) {
                    return 'in our lagoon';
                }
                if (match.includes('including geothermal water')) {
                    return 'including refreshing beverages';
                }
                if (match.includes('geothermal water\'s edge') || match.includes('edge of the geothermal water')) {
                    return 'at the lagoon\'s edge';
                }
                if (match.includes('in our geothermal waters')) {
                    return 'in our lagoon';
                }
                if (match.match(/within\s+the\s+lagoon\s+(itself|area)/)) {
                    return 'in the lagoon';
                }
                if (match.match(/inside\s+the\s+lagoon\s+itself/)) {
                    return 'in the lagoon';
                }
                if (match.includes('warmth of our geothermal waters') || 
                    match.includes('immersed in our geothermal waters')) {
                    return 'in the lagoon';
                }
                return match.replace('geothermal water', 'drinking water');
            }
            return match;
        });
    });

    // WATER BOTTLE UNPROTECTION - Now restore all protected water bottle references
    modifiedText = modifiedText.replace(/__PROTECTED_WATER_BOTTLE__(.*?)__END_PROTECTION__/gi, '$1');
    
    // WATER SHOES UNPROTECTION - Restore all protected water shoes references
    modifiedText = modifiedText.replace(/__PROTECTED_WATER_SHOES__(.*?)__END_PROTECTION__/gi, '$1');
    
    // Final cleanup for any "geothermal water bottle" that might have slipped through
    modifiedText = modifiedText.replace(/geothermal\s+water\s+bottle/gi, 'water bottle');
    
    // Final cleanup for any "geothermal water shoes" that might have slipped through
    modifiedText = modifiedText.replace(/geothermal\s+water\s+shoes/gi, 'water shoes');
    modifiedText = modifiedText.replace(/geothermal\s+aqua\s+shoes/gi, 'aqua shoes');
    modifiedText = modifiedText.replace(/geothermal\s+swim(ming)?\s+shoes/gi, 'swim$1 shoes');

    // Final check for any remaining double geothermal
    modifiedText = modifiedText.replace(geothermalRegex, 'geothermal ');

    // Final cleanup of any remaining preserve markers
    modifiedText = modifiedText.replace(/__PRESERVE_[A-Z0-9_]+__/g, '');

    // Log any changes made
    if (modifiedText !== text) {
        console.log('✨ Text modified for terminology:', {
            original: text,
            modified: modifiedText
        });
    } else {
        console.log('✅ No terminology changes needed');
    }

    return modifiedText;
};

// Constants
const RATE_LIMIT_MINUTES = 15;   // Duration in minutes for rate limiting window
const RATE_LIMIT_MAX_REQUESTS = 100;  // Maximum requests per window
const CACHE_TTL = 3600000; // 1 hour
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const OPENAI_TIMEOUT = 15000;  // 15 seconds

// Confidence Scoring System
const CONFIDENCE_THRESHOLDS = {
    HIGH: 0.8,
    MEDIUM: 0.4,
    LOW: 0.2  // Lower threshold to allow more knowledge base responses
};

// LiveChat Constants
// And for testing, let's extend the hours:
const LIVECHAT_HOURS = {
    START: 0,    // Midnight
    END: 23.99,     // 11 PM
};

// Transfer trigger patterns
const AGENT_REQUEST_PATTERNS = {
    en: [
        'speak to agent',
        'talk to agent',
        'chat to agent',
        'speak to human',
        'talk to human',
        'speak with someone',
        'talk with someone',
        'speak to representative',
        'talk to representative',
        'connect me with',
        'transfer me to',
        'live agent',
        'live person',
        'real person',
        'human agent',
        'human assistance',
        'agent assistance'
    ],
    is: [
        'tala við þjónustufulltrúa',
        'tala við manneskju',
        'fá að tala við',
        'geta talað við',
        'fá samband við',
        'tala við starfsmann',
        'fá þjónustufulltrúa',
        'fá manneskju',
        'vera í sambandi við'
    ]
};
// Removed unused constant - patterns are defined in livechat.js
//const BOOKING_CHANGE_PATTERNS = {
//    en: [
//        'change booking',
//        'modify booking',
//        'reschedule',
//        'change time',
//        'change date',
//        'different time',
//        'different date',
//        'another time',
//        'another date',
//        'move booking',
//        'cancel booking'
//    ],
//    is: [
//        'breyta bókun',
//       'breyta tíma',
//        'breyta dagsetningu',
//        'færa bókun',
//        'færa tíma',
//        'annan tíma',
//        'aðra dagsetningu',
//        'hætta við bókun',
//        'afbóka'
//    ]
//};

// Helper function to check if within operating hours
const isWithinOperatingHours = () => {
    const now = new Date();
    const hours = now.getHours(); // Use local time instead of UTC
    console.log('\n⏰ Hours Check:', {
        currentHour: hours,
        start: LIVECHAT_HOURS.START,
        end: LIVECHAT_HOURS.END,
        isWithin: hours >= LIVECHAT_HOURS.START && hours < LIVECHAT_HOURS.END
    });
    return hours >= LIVECHAT_HOURS.START && hours < LIVECHAT_HOURS.END;
};

// Helper function to check if booking change form should be shown
const shouldShowBookingForm = async (message, languageDecision) => {
    try {
        // Use the detectBookingChangeRequest function from livechat.js
        const isBookingChange = await detectBookingChangeRequest(message, languageDecision);
        
        console.log('\n📅 Booking Change Form Check:', {
            message: message.substring(0, 30) + '...',
            isBookingChange: isBookingChange,
            language: languageDecision.isIcelandic ? 'Icelandic' : 'English'
        });
        
        return {
            shouldShowForm: isBookingChange,
            isWithinAgentHours: isWithinOperatingHours()
        };
    } catch (error) {
        console.error('\n❌ Error in shouldShowBookingForm:', error);
        return {
            shouldShowForm: false,
            isWithinAgentHours: isWithinOperatingHours(),
            error: error.message
        };
    }
};

// Helper function to check if agent transfer is needed
const shouldTransferToAgent = async (message, languageDecision, context) => {
    try {
        const msg = message.toLowerCase();
        const useEnglish = !languageDecision.isIcelandic || languageDecision.confidence === 'high';

        // Log transfer check
        console.log('\n👥 Agent Transfer Check:', {
            message: msg,
            withinHours: isWithinOperatingHours(),
            language: {
                isIcelandic: languageDecision.isIcelandic,
                confidence: languageDecision.confidence
            }
        });

        // First check if it's an explicit agent request (not a booking change)
        const hasAgentRequest = (useEnglish ? 
            AGENT_REQUEST_PATTERNS.en : 
            AGENT_REQUEST_PATTERNS.is).some(pattern => msg.includes(pattern));

        // Temporarily disable all live agent transfers
        if (hasAgentRequest) {
            // Return a helpful message redirecting to booking form
            const redirectMessage = useEnglish ? 
                "Our live agent chat system is currently unavailable. For booking changes, please use our booking request form. For immediate assistance, please call us at +354 527 6800." :
                "Því miður er ekki hægt að tengja þig við þjónustufulltrúa í augnablikinu. Fyrir bókunarbreytingar, vinsamlegast notaðu eyðublaðið okkar. Fyrir tafarlausa aðstoð, vinsamlegast hringdu í +354 527 6800.";
            
            return {
                shouldTransfer: false,
                reason: 'transfer_disabled',
                response: redirectMessage
            };
        }

        return {
            shouldTransfer: false,
            reason: 'no_trigger'
        };

    } catch (error) {
        console.error('\n❌ Error in shouldTransferToAgent:', error);
        return {
            shouldTransfer: false,
            reason: 'error',
            error: error.message
        };
    }
};

// Add this helper function to detect sunset-related queries
const isSunsetQuery = (message, languageDecision) => {
    const msg = message.toLowerCase();
    
    // English sunset patterns
    const englishSunsetPatterns = [
        'sunset', 'sun set', 'sun sets', 'sundown', 
        'watch the sunset', 'see the sunset',
        'sunset time', 'sun go down', 'golden hour',
        'evening sky', 'twilight'
    ];
    
    // Icelandic sunset patterns
    const icelandicSunsetPatterns = [
        'sólsetur', 'sólarlag', 'sólin sest', 
        'horfa á sólarlagið', 'sjá sólarlagið',
        'sólarlagstími', 'sólin fer niður', 'gyllta stund',
        'kvöldroði', 'rökkur'
    ];
    
    // Check patterns based on language
    const patternsToCheck = languageDecision.isIcelandic ? 
        icelandicSunsetPatterns : 
        englishSunsetPatterns;
    
    // Check if any patterns match
    return patternsToCheck.some(pattern => msg.includes(pattern));
};

// Add this function to generate sunset responses
const generateSunsetResponse = (message, languageDecision) => {
    const msg = message.toLowerCase();
    const isIcelandic = languageDecision.isIcelandic;
    
    // Get today's sunset time
    const todaySunset = getTodaySunset();
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' }).toLowerCase();
    const currentDay = currentDate.getDate();
    
    // Check if query is about a specific month
    const monthInQuery = matchMonthInQuery(msg, isIcelandic);
    
    let sunsetTime;
    let monthName;
    let isCurrentMonth = false;
    
    if (monthInQuery) {
        // If asking about the current month, use today's sunset time instead of average
        if (monthInQuery === currentMonth) {
            sunsetTime = todaySunset;
            isCurrentMonth = true;
        } else {
            sunsetTime = getMonthAverageSunset(monthInQuery);
        }
        
        monthName = isIcelandic ? 
            icelandicMonths[monthInQuery] : 
            monthInQuery.charAt(0).toUpperCase() + monthInQuery.slice(1);
    } else {
        // Default to today's sunset
        sunsetTime = todaySunset;
        monthName = isIcelandic ? 
            icelandicMonths[currentMonth] : 
            currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);
    }
    
    if (!sunsetTime) {
        return isIcelandic ?
            "Því miður get ég ekki fundið nákvæmar upplýsingar um sólarlagstíma fyrir þennan tíma. Vinsamlegast spurðu um annan mánuð eða hafðu samband við þjónustuver okkar fyrir nákvæmari upplýsingar." :
            "I'm sorry, I couldn't find precise sunset time information for that period. Please ask about a different month or contact our service desk for more accurate information.";
    }
    
    // Get today's opening hours
    const todayHours = getCurrentOpeningHours();
    const todayHoursString = `${todayHours.open}:00-${todayHours.close}:00`;
    
    // Get month-specific opening hours if needed
    let monthHours;
    let monthHoursString;
    if (monthInQuery) {
        monthHours = getMonthOpeningHours(monthInQuery);
        
        if (monthInQuery === 'june' || monthInQuery === 'july' || 
            monthInQuery === 'august' || monthInQuery === 'september' || 
            monthInQuery === 'october') {
            // For months with same hours all week
            const openHour = monthHours.weekdays.open;
            const closeHour = monthHours.weekdays.close;
            monthHoursString = isIcelandic ? 
                `${openHour}:00-${closeHour}:00 alla daga` : 
                `${openHour}:00-${closeHour}:00 every day`;
        } else {
            // For winter months with different weekend/weekday hours
            monthHoursString = isIcelandic ? 
                `${monthHours.weekdays.open}:00-${monthHours.weekdays.close}:00 á virkum dögum og ${monthHours.weekends.open}:00-${monthHours.weekends.close}:00 um helgar` : 
                `${monthHours.weekdays.open}:00-${monthHours.weekdays.close}:00 on weekdays and ${monthHours.weekends.open}:00-${monthHours.weekends.close}:00 on weekends`;
        }
    }
    
    // Generate response based on language
    if (isIcelandic) {
        // For specific month query
        if (monthInQuery) {
            if (isCurrentMonth) {
                return `Í dag, ${currentDay}. ${monthName}, sest sólin um kl. ${sunsetTime.formatted} í Reykjavík. Frá Sky Lagoon er frábært útsýni yfir sólarlagið, þar sem þú getur slakað á í heitu lóninu okkar og notið þess að horfa á himininn fyllast af litum. Til að upplifa þetta sem best er mælt með að koma 1-2 klukkustundum fyrir sólsetur. Opnunartími okkar er ${todayHoursString}.`;
            } else {
                return `Í ${monthName} sest sólin að meðaltali um kl. ${sunsetTime.formatted} í Reykjavík. Frá Sky Lagoon er frábært útsýni yfir sólarlagið, þar sem þú getur slakað á í heitu lóninu okkar og notið þess að horfa á himininn fyllast af litum. Til að upplifa þetta sem best er mælt með að koma 1-2 klukkustundum fyrir sólsetur. Opnunartími okkar er ${monthHoursString}.`;
            }
        }
        
        // For today/general query
        return `Í dag sest sólin um kl. ${sunsetTime.formatted} í Reykjavík. Frá Sky Lagoon er einstakt útsýni yfir sólarlagið, þar sem þú getur slakað á í jarðhitavatninu og notið töfrandi litbrigða himinsins. Til að upplifa þetta sem best mælum við með að koma 1-2 klukkustundum fyrir sólsetur. Opnunartími okkar í dag er ${todayHoursString}.`;
    } else {
        // For specific month query
        if (monthInQuery) {
            if (isCurrentMonth) {
                return `Today, ${monthName} ${currentDay}, the sun sets at ${sunsetTime.formatted} (${sunsetTime.formattedLocal}) in Reykjavik. Sky Lagoon offers an exceptional view of the sunset where you can enjoy watching the sky fill with colors while relaxing in our warm lagoon. We recommend arriving 1-2 hours before sunset for the best experience. Our opening hours today are ${todayHoursString}.`;
            } else {
                return `In ${monthName}, the sun sets at approximately ${sunsetTime.formatted} (${sunsetTime.formattedLocal}) in Reykjavik. Sky Lagoon offers an exceptional view of the sunset where you can enjoy watching the sky fill with colors while relaxing in our warm lagoon. We recommend arriving 1-2 hours before sunset for the best experience. Our opening hours are ${monthHoursString}.`;
            }
        }
        
        // For today/general query
        return `Today, the sun sets at ${sunsetTime.formatted} (${sunsetTime.formattedLocal}) in Reykjavik. Sky Lagoon offers a spectacular view of the sunset where you can enjoy the magical colors of the sky while relaxing in our geothermal waters. We recommend arriving 1-2 hours before sunset to get the full experience. Our opening hours today are ${todayHoursString}.`;
    }
};

const isBookingQuery = (message) => {
    const msg = message.toLowerCase();
    return msg.includes('bóka') || 
           msg.includes('panta') || 
           msg.includes('tíma') || 
           msg.includes('stefnumót') ||
           msg.includes('hvernig bóka');
};

// Helper function to check if a pattern matches as a whole word
function matchesWholeWord(text, pattern) {
    // Escape special regex characters in the pattern
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Create regex with word boundaries
    const regex = new RegExp(`\\b${escapedPattern}\\b`, 'i');
    // Test if the pattern matches as a whole word
    return regex.test(text);
}

// Common Icelandic question words and starters
const icelandicQuestionStarters = [
    'er ', 'má ', 'get ', 'getur ', 'hefur ',
    'fylgja ', 'kostar ', 'þarf ', 'hvar ',
    'hvenær ', 'hvernig ', 'hvað ', 'hver ',
    'verð ', 'eru ', 'eigið ', 'eigum ',
    'geturðu ', 'mætti ', 'megið ', 'væri '
];

const questionPatterns = {
    booking: {
        en: [
            'how do i book', 'how to book', 'can i book',
            'want to book', 'book a ticket', 'make a booking',
            'book tickets', 'booking process'
        ],
        is: [
            'hvernig bóka', 'hvernig get ég bókað', 'get ég bókað',
            'vil bóka', 'bóka miða', 'gera bókun',
            'bóka tíma', 'bókunarferli'
        ]
    },
    question: {
        en: ['how', 'what', 'when', 'where', 'why', 'can', 'do', 'does', 'which', 'are', 'is', 'will', 'should'],
        is: ['hvernig', 'hvað', 'hvenær', 'hvar', 'af hverju', 'get', 'er', 'má', 'hver']    
    }
};

// Helper functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getCurrentSeason = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    if (month === 12 && day === 24) {
        return {
            season: 'holiday',
            closingTime: '16:00',
            lastRitual: '14:00',
            barClose: '15:00',
            lagoonClose: '15:30',
            greeting: 'Christmas Eve'
        };
    }
    
    if (month === 12 && day === 25) {
        return {
            season: 'holiday',
            closingTime: '18:00',
            lastRitual: '16:00',
            barClose: '17:00',
            lagoonClose: '17:30',
            greeting: 'Christmas Day'
        };
    }
    
    if (month === 12 && day === 31) {
        return {
            season: 'holiday',
            closingTime: '22:00',
            lastRitual: '20:00',
            barClose: '21:00',
            lagoonClose: '21:30',
            greeting: 'New Year\'s Eve'
        };
    }
    
    if (month === 1 && day === 1) {
        return {
            season: 'holiday',
            closingTime: '22:00',
            lastRitual: '20:00',
            barClose: '21:00',
            lagoonClose: '21:30',
            greeting: 'New Year\'s Day'
        };
    }

    // Regular seasons
    if (month >= 11 || month <= 5) {
        return {
            season: 'winter',
            closingTime: '22:00',
            lastRitual: '20:00',
            barClose: '21:00',
            lagoonClose: '21:30',
            greeting: 'winter'
        };
    }
    
    if (month >= 6 && month <= 9) {
        return {
            season: 'summer',
            closingTime: '23:00',
            lastRitual: '21:00',
            barClose: '22:00',
            lagoonClose: '22:30',
            greeting: 'summer'
        };
    }
    
    return {
        season: 'autumn',
        closingTime: '23:00',
        lastRitual: '21:00',
        barClose: '22:00',
        lagoonClose: '22:30',
        greeting: 'autumn'
    };
};

setGetCurrentSeasonFunction(getCurrentSeason);

// Time context tracking helper
const detectTimeContext = (message, seasonInfo, languageDecision) => {
    const msg = message.toLowerCase();
    
    // First check for follow-up time queries (now language-aware)
    const isFollowUpQuery = languageDecision.isIcelandic ?
        msg.match(/^og\s+(hvað|hvernig|um)/i) || msg.match(/^og\s+(matur|borða|ritúal)/i) :
        msg.match(/^and\s+(what|how|about)/i) || msg.match(/^and\s+(dinner|food|eating|ritual)/i);
    
    // Check for hours queries with language-specific terms
    const isHoursQuery = (
        (languageDecision.isIcelandic ? 
            msg.match(/opin|opið|lokað|lokar|opnun|lokun/) :
            msg.match(/hours?|open|close|time|opening|closing/)) &&
        !msg.match(/how long|take|duration|hvað tekur|hversu lengi/)
    );
                        
    // Check for duration queries with language-specific terms
    const isDurationQuery = languageDecision.isIcelandic ?
        msg.match(/hvað tekur|hversu lengi|hve lengi|hversu langan/) :
        msg.match(/how long|take|duration|takes how long|how much time|does it take/);
    
    // Check for ritual timing sequence
    const isRitualQuery = languageDecision.isIcelandic ?
        msg.match(/ritúal|skjol|skjól/) :
        msg.match(/ritual/);
    
    // Check for dining timing with language-specific patterns
    const isDiningQuery = languageDecision.isIcelandic ?
        (msg.match(/matur|veitingar|borða|veitingastað|veitingarstað|veitingastaður|matseðil|eruði með|hafið þið|er hægt að fá mat|hægt að borða/) ||
         isFollowUpQuery && msg.includes('matur')) :
        (msg.match(/dining|restaurant|food|eating/) ||
         isFollowUpQuery && msg.includes('dinner'));
    
    // Enhanced logging with language detection
    console.log('\n⏰ Time Context Detection:', {
        message: msg,
        language: {
            isIcelandic: languageDecision.isIcelandic,
            confidence: languageDecision.confidence,
            reason: languageDecision.reason
        },
        isHoursQuery,
        isDurationQuery,
        isRitualQuery,
        isDiningQuery,
        isFollowUp: isFollowUpQuery,
        currentSeason: seasonInfo.season,
        currentHours: seasonInfo.closingTime
    });
    
    // Determine the context type based on query
    let type = null;
    let activity = null;
    
    if (isDurationQuery || isFollowUpQuery) {
        type = 'duration';
        if (isRitualQuery) activity = 'ritual';
        else if (isDiningQuery) activity = 'dining';
    } else if (isHoursQuery) {
        type = 'hours';
    }
    
    // Enhanced follow-up logging with language info
    if (isFollowUpQuery) {
        console.log('\n🔄 Follow-up Query Detected:', {
            original: message,
            language: {
                isIcelandic: languageDecision.isIcelandic,
                confidence: languageDecision.confidence
            },
            type,
            activity,
            isDining: isDiningQuery
        });
    }
    
    return {
        type,
        activity,
        season: seasonInfo.season,
        operatingHours: {
            closing: seasonInfo.closingTime,
            lastRitual: seasonInfo.lastRitual,
            barClose: seasonInfo.barClose,
            lagoonClose: seasonInfo.lagoonClose
        }
    };
};

const UNKNOWN_QUERY_TYPES = {
    COMPLETELY_UNKNOWN: 'completely_unknown',    // No relevant knowledge found
};

const UNKNOWN_QUERY_RESPONSES = {
    COMPLETELY_UNKNOWN: [
        "I'm still learning about that aspect of Sky Lagoon. Would you like to speak with a team member? You can reach us at +354 527 6800 (available 9 AM - 6 PM local time) or by email at: reservations@skylagoon.is.",
        "I'm not fully familiar with that yet. Would you like me to connect you with our team? You can reach them at +354 527 6800 (9 AM - 6 PM local time) or by email at: reservations@skylagoon.is",
        "I want to make sure you receive accurate information. For this specific query, please contact our team at +354 527 6800 (9 AM - 6 PM local time) or by email at: reservations@skylagoon.is"
    ],
    COMPLETELY_UNKNOWN_IS: [
        "Ég er enn að læra um þennan þátt hjá Sky Lagoon. Viltu ræða við einhvern úr teyminu okkar? Þú getur haft samband við okkur í síma 527 6800 eða gegnum netfangið: reservations@skylagoon.is",
        "Ég er ekki alveg með þessar upplýsingar á hreinu. Viltu heyra í þjónustufulltrúa? Þú getur hringt í okkur í síma 527 6800 eða haft samband í gegnum netfangið: reservations@skylagoon.is",
        "Ég er ekki alveg viss um þetta, en teymið okkar getur örugglega hjálpað þér! Til að tryggja að þú fáir réttar upplýsingar, vinsamlegast hafðu samband við teymið okkar í síma 527 6800 eða netfangið: reservations@skylagoon.is"
    ]
};

// Helper function to get random response
const getRandomResponse = (responses) => {
    return responses[Math.floor(Math.random() * responses.length)];
};

// Calculate Confidence Helper
const calculateConfidence = (userMessage, relevantKnowledge, languageDecision) => {
    // Guard clause
    if (!userMessage || !relevantKnowledge) return 0;

    const message = userMessage.toLowerCase();
    let score = 0;
    let matchDetails = [];
    
    // Enhanced acknowledgment check with language-specific words
    const acknowledgmentWords = languageDecision.isIcelandic ? {
        general: ['frábært', 'gott', 'hjálplegt', 'þægilegt', 'fullkomið', 'takk', 'skil', 'allt í lagi'],
        questions: ['fleiri spurningar', 'önnur spurning', 'nokkrar spurningar'],
        understood: ['skil', 'nákvæmlega', 'einmitt', 'allt skýrt']
    } : {
        general: ['great', 'good', 'helpful', 'comfortable', 'perfect', 'thanks', 'thank', 'understood', 'okay', 'got it'],
        questions: ['more questions', 'another question', 'few questions'],
        understood: ['understood', 'exactly', 'clear', 'makes sense']
    };
    
    // Check for multi-part questions
    const isMultiPart = message.includes('?') && message.split('?').length > 2;
    
    // Enhanced logging for acknowledgment check
    console.log('\n📝 Acknowledgment Check:', {
        message,
        language: {
            isIcelandic: languageDecision.isIcelandic,
            confidence: languageDecision.confidence,
            reason: languageDecision.reason
        },
        wordCount: message.split(' ').length,
        hasAcknowledgmentWords: Object.values(acknowledgmentWords).some(
            wordList => wordList.some(word => message.includes(word))
        )
    });

    // Check for short acknowledgments
    if (message.split(' ').length <= 6 && 
        Object.values(acknowledgmentWords).some(
            wordList => wordList.some(word => message.includes(word))
        )) {
        console.log('📝 Acknowledgment detected');
        return 0.1;  // Small non-zero value to prevent unknown query handling
    }

    // Give higher confidence for multi-part questions with matches
    if (isMultiPart && relevantKnowledge.length > 1) {
        console.log('📝 Multi-part question with multiple matches detected');
        return 0.9;  // High confidence for multiple relevant matches
    }

    // Check for direct matches in knowledge base sections
    relevantKnowledge.forEach(info => {
        // Safety check for info.content
        const contentToCheck = info.content || info;
        const contentStr = JSON.stringify(contentToCheck).toLowerCase();
        
        // Calculate match percentage based on key terms
        const words = message.split(' ').filter(word => word.length > 3);
        let matches = 0;
        let totalWords = 0;
        
        words.forEach(word => {
            // Language-specific common words to ignore
            const commonWords = languageDecision.isIcelandic ? 
                ['hvað', 'hvernig', 'hvenær', 'hvar', 'gerir', 'um'] :
                ['what', 'how', 'when', 'where', 'does', 'about'];

            if (!commonWords.includes(word)) {
                totalWords++;
                if (contentStr.includes(word)) {
                    matches++;
                    matchDetails.push({
                        term: word,
                        type: info.type,
                        matched: true
                    });
                } else {
                    matchDetails.push({
                        term: word,
                        type: info.type,
                        matched: false
                    });
                }
            }
        });
        
        // Calculate section score
        if (totalWords > 0) {
            const sectionScore = matches / totalWords;
            score = Math.max(score, sectionScore);
        }
    });

    // Enhanced logging with language info
    console.log('\n📊 Confidence Calculation:', {
        originalMessage: userMessage,
        language: {
            isIcelandic: languageDecision.isIcelandic,
            confidence: languageDecision.confidence,
            reason: languageDecision.reason
        },
        score: score,
        level: score >= CONFIDENCE_THRESHOLDS.HIGH ? 'HIGH' : 
              score >= CONFIDENCE_THRESHOLDS.MEDIUM ? 'MEDIUM' : 
              score >= CONFIDENCE_THRESHOLDS.LOW ? 'LOW' : 'VERY LOW',
        matches: matchDetails,
        relevantSections: relevantKnowledge.map(k => k.type)
    });

    return score;
};

// Add the service question checker here
const isServiceQuestion = (message, languageDecision) => {
    const msg = message.toLowerCase();
    return languageDecision.isIcelandic ?
        msg.includes('bjóð') || msg.includes('með') || msg.includes('hafið') :
        msg.includes('offer') || msg.includes('have') || msg.includes('with');
};

const ERROR_MESSAGES = {
    en: {
        rateLimited: "I'm experiencing high traffic. Please try again in a moment.",
        general: "I apologize, but I'm having trouble processing your request right now. Could you please try again?",
        connectionError: "I'm having trouble connecting. Please try again shortly."
    },
    is: {
        rateLimited: "Ég er að fá of margar fyrirspurnir. Vinsamlegast reyndu aftur eftir smá stund.",
        general: "Ég biðst afsökunar, en ég er að lenda í vandræðum með að svara fyrirspurninni þinni. Vinsamlegast reyndu aftur.",
        connectionError: "Ég er að lenda í vandræðum með tengingu. Vinsamlegast reyndu aftur eftir smá stund."
    }
};

// Add helper function for error messages
const getErrorMessage = (isIcelandic) => {
    return isIcelandic ? 
        ERROR_MESSAGES.is.general : 
        ERROR_MESSAGES.en.general;
};

// ADD THE NEW CONSTANTS HERE 👇 (These seem unused)
const activeConnections = new Map();  // Track active WebSocket connections
const conversationBuffer = new Map(); // Buffer recent conversations

// Track active chat sessions
const chatSessions = new Map();

// This Map tracks messages already sent to analytics to prevent duplicates (then referenced later in the sendConversationToAnalytics function)
const analyticsSentMessages = new Map();

// Define session timeout (period after which we create a new conversation) - getOrCreateSession function then uses this
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes of inactivity = new conversation (15 seconds in milliseconds)

/**
 * Get or create a persistent session from MongoDB
 * Enhanced with session timeout and better conversation separation
 * Uses the frontend session ID to maintain conversation continuity
 * Includes in-memory caching to prevent duplicate sessions during DB issues
 * 
 * @param {Object} conversationData - The conversation data including session information
 * @returns {Promise<Object>} Session information
 */
async function getOrCreateSession(conversationData) {
  try {
    // Extract the frontend session ID first - we'll need this even if DB connection fails
    const frontendSessionId = conversationData?.sessionId || 'unknown-session';
    
    // Create a local cache of sessions if one doesn't exist
    if (!global.sessionCache) {
      global.sessionCache = new Map();
    }
    
    // Extract the user's IP address if available (for analytics purposes)
    const userIp = conversationData?.ip || 
                  conversationData?.req?.ip || 
                  conversationData?.req?.headers?.['x-forwarded-for'] || 
                  'unknown-ip';
    
    // Check local cache first - this prevents generating new sessions during temporary DB issues
    if (global.sessionCache.has(frontendSessionId)) {
      const cachedSession = global.sessionCache.get(frontendSessionId);
      
      // TIMEOUT CHECK: If the session has been inactive longer than the timeout period, create a new session
      const lastActivity = new Date(cachedSession.lastActivity).getTime();
      const currentTime = Date.now();
      
      if (currentTime - lastActivity > SESSION_TIMEOUT) {
        console.log(`\n⏰ Session timeout detected for ${frontendSessionId} (${Math.round((currentTime - lastActivity)/1000/60)} minutes inactive)`);
        
        // Generate a new unique conversation ID that includes the original session ID for traceability
        const newConversationId = `${frontendSessionId}_${Date.now()}`;
        
        // Create a new session with the timeout marker
        const timeoutSession = {
          sessionId: frontendSessionId, // Keep the same session ID for frontend consistency
          conversationId: newConversationId, // Use a new conversation ID to separate in analytics
          startedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          isNewSession: true
        };
        
        // Cache the new session
        global.sessionCache.set(frontendSessionId, timeoutSession);
        console.log(`\n🆕 Created timeout session with new conversation ID: ${newConversationId}`);
        
        // Try to update this in MongoDB too
        try {
          const dbConnection = await connectToDatabase();
          const db = dbConnection.db;
          const globalSessionCollection = db.collection('globalSessions');
          
          await globalSessionCollection.insertOne({
            type: 'chat_session',
            frontendSessionId: frontendSessionId,
            frontendSessionIds: [frontendSessionId],
            userIp: userIp,
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
      cachedSession.lastActivity = new Date().toISOString();
      global.sessionCache.set(frontendSessionId, cachedSession);
      console.log(`\n🔄 Using cached session: ${cachedSession.conversationId} for frontend session: ${frontendSessionId}`);
      
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
      const tempSession = {
        sessionId: frontendSessionId, // Use the frontend session ID directly!
        conversationId: `${frontendSessionId}_${Date.now()}`, // Use timestamp to ensure uniqueness
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
      
      // Cache this session
      global.sessionCache.set(frontendSessionId, tempSession);
      console.log(`\n⚠️ Created temporary session: ${tempSession.conversationId} due to DB connection error`);
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
        console.log(`\n⏰ Session timeout detected in DB for ${frontendSessionId} (${Math.round((currentTime - lastActivity)/1000/60)} minutes inactive)`);
        
        // Generate a new unique conversation ID
        const newConversationId = `${frontendSessionId}_${Date.now()}`;
        
        // Create a new session record
        const newSession = {
          type: 'chat_session',
          frontendSessionId: frontendSessionId,
          frontendSessionIds: [frontendSessionId],
          userIp: userIp,
          sessionId: frontendSessionId, // Keep the same session ID for frontend consistency
          conversationId: newConversationId, // New conversation ID for analytics
          startedAt: now.toISOString(),
          lastActivity: now.toISOString(),
          previousConversationId: existingSession.conversationId,
          isTimeoutSession: true
        };
        
        try {
          await globalSessionCollection.insertOne(newSession);
          console.log(`\n🆕 Created timeout session in DB with new conversation ID: ${newConversationId}`);
        } catch (insertError) {
          console.warn('⚠️ Could not save timeout session to MongoDB:', insertError);
        }
        
        const sessionInfo = {
          sessionId: newSession.sessionId,
          conversationId: newSession.conversationId,
          startedAt: newSession.startedAt,
          lastActivity: newSession.lastActivity,
          isNewSession: true
        };
        
        // Cache this session for future use
        global.sessionCache.set(frontendSessionId, sessionInfo);
        
        return sessionInfo;
      }
      
      // If no timeout, use the existing session and update last activity
      console.log(`\n🔄 Using existing session: ${existingSession.conversationId} for frontend session: ${frontendSessionId}`);
      
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
        lastActivity: now.toISOString()
      };
      
      // Cache this session for future use
      global.sessionCache.set(frontendSessionId, sessionInfo);
      
      return sessionInfo;
    }
    
    // REMOVED: IP-based session reuse code to prevent grouping different users

    // Create a new session if no matching session was found
    // Use a new conversation ID that includes the frontend session ID plus timestamp for uniqueness
    const newConversationId = `${frontendSessionId}_${Date.now()}`;
    
    const newSession = {
      type: 'chat_session',
      frontendSessionId: frontendSessionId, // Store the frontend session ID
      frontendSessionIds: [frontendSessionId], // Keep track of all associated session IDs
      userIp: userIp, // Store IP for analytics only (not for session matching)
      sessionId: frontendSessionId, // Use the frontend session ID directly
      conversationId: newConversationId, // Use a unique conversation ID
      startedAt: now.toISOString(),
      lastActivity: now.toISOString()
    };
    
    // Save to MongoDB
    try {
      await globalSessionCollection.insertOne(newSession);
      console.log(`\n🌐 Created new session: ${newSession.conversationId} for frontend session: ${frontendSessionId} from IP: ${userIp}`);
    } catch (insertError) {
      console.warn('⚠️ Could not save new session to MongoDB:', insertError);
    }
    
    const sessionInfo = {
      sessionId: newSession.sessionId,
      conversationId: newSession.conversationId,
      startedAt: newSession.startedAt,
      lastActivity: newSession.lastActivity,
      isNewSession: true
    };
    
    // Cache this session for future use
    global.sessionCache.set(frontendSessionId, sessionInfo);
    
    return sessionInfo;
  } catch (error) {
    console.error('❌ Error with session management:', error);
    
    // Create a fallback session using the frontend session ID plus timestamp
    const frontendSessionId = conversationData?.sessionId || 'unknown-session';
    const fallbackConversationId = `${frontendSessionId}_${Date.now()}`;
    
    const fallbackSession = {
      sessionId: frontendSessionId, // Use the original ID!
      conversationId: fallbackConversationId, // Use a unique conversation ID
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    
    // Cache this session
    if (!global.sessionCache) {
      global.sessionCache = new Map();
    }
    global.sessionCache.set(frontendSessionId, fallbackSession);
    
    console.log(`\n⚠️ Using fallback session: ${fallbackSession.conversationId}`);
    return fallbackSession;
  }
}

// Context tracking constants
const CONTEXT_TTL = 3600000; // 1 hour - matches existing CACHE_TTL
const MAX_CONTEXT_MESSAGES = 10; // Maximum messages to keep in history
const CONTEXT_MEMORY_LIMIT = 5;  // Keep last 5 interactions

// Enhanced context tracking patterns
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

// Initialize context before any usage
const initializeContext = (sessionId, languageDecision) => {
    return {
        messages: [],
        bookingTime: null,
        lateArrival: null,
        lastInteraction: Date.now(),
        language: languageDecision.isIcelandic ? 'is' : 'en',  // Use languageDecision
        languageInfo: {  // Add new language tracking
            isIcelandic: languageDecision.isIcelandic,
            confidence: languageDecision.confidence,
            reason: languageDecision.reason,
            lastUpdate: Date.now()
        },
        conversationStarted: true,  // Initialize as true since ChatWidget handles first greeting
        messageCount: 0,
        lastTopic: null,
        lastResponse: null,
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
                    language: languageDecision.isIcelandic ? 'is' : 'en'  // Add language tracking to topics
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
                    language: languageDecision.isIcelandic ? 'is' : 'en'  // Add language tracking to responses
                });
                if (this.previousResponses.length > 3) this.previousResponses.pop();
            },
            hasRecentInteraction: function() {
                return this.lastUpdate && 
                       (Date.now() - this.lastUpdate) < 5 * 60 * 1000;
            }
        },
        icelandicTopics: [],
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
        lastQuestion: null,
        lastAnswer: null,
        prevQuestions: [],
        contextualReferences: [],
        relatedTopics: [],
        questionContext: null,
        selectedGreeting: null,
        isFirstGreeting: true,
        selectedAcknowledgment: null,
        isAcknowledgment: false,
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
        referenceContext: null,
        lateArrivalScenario: null,
        soldOutStatus: false,
        lastTransition: null,
        bookingModification: {
            requested: false,
            type: null,
            originalTime: null
        }
    };
};

// Add new code here
const EMOJI_MAPPING = {
    greeting: '😊',
    location: '📍',
    ritual: '✨',
    weather: '☁️',
    summer: '🌞',
    sunset: '🌅'
};

// Get Appropriate Suffix helper
const getAppropriateSuffix = (message, languageDecision) => {
    // Skip emojis for serious topics
    if (message.toLowerCase().includes('cancel') || 
        message.toLowerCase().includes('complaint') || 
        message.toLowerCase().includes('refund') || 
        message.toLowerCase().includes('error') ||
        // Add Icelandic terms
        (languageDecision.isIcelandic && (
            message.toLowerCase().includes('hætta við') ||
            message.toLowerCase().includes('kvörtun') ||
            message.toLowerCase().includes('endurgreiðslu')
        ))) {
        return "";
    }

    // Check for specific topics
    if (message.toLowerCase().includes('ritual') || 
        message.toLowerCase().includes('skjól') ||
        message.toLowerCase().includes('ritúal')) {
        return " ✨";
    }
    if (message.toLowerCase().includes('where') || 
        message.toLowerCase().includes('location') || 
        message.toLowerCase().includes('address') ||
        (languageDecision.isIcelandic && (
            message.toLowerCase().includes('hvar') ||
            message.toLowerCase().includes('staðsetning') ||
            message.toLowerCase().includes('heimilisfang')
        ))) {
        return " 📍";
    }
    if (message.toLowerCase().includes('summer') || 
        message.toLowerCase().includes('july') || 
        message.toLowerCase().includes('august') ||
        (languageDecision.isIcelandic && (
            message.toLowerCase().includes('sumar') ||
            message.toLowerCase().includes('júlí') ||
            message.toLowerCase().includes('ágúst')
        ))) {
        return " 🌞";
    }
    if (message.toLowerCase().includes('weather') || 
        message.toLowerCase().includes('temperature') ||
        (languageDecision.isIcelandic && (
            message.toLowerCase().includes('veður') ||
            message.toLowerCase().includes('hitastig')
        ))) {
        return " ☁️";
    }
    if (message.toLowerCase().includes('evening') || 
        message.toLowerCase().includes('sunset') ||
        (languageDecision.isIcelandic && (
            message.toLowerCase().includes('kvöld') ||
            message.toLowerCase().includes('sólsetur')
        ))) {
        return " 🌅";
    }
    // Use language-aware greeting check
    const greetingPattern = languageDecision.isIcelandic ?
        /^(hæ|halló|sæl|sæll|góðan|komdu)/i :
        /^(hi|hello|hey|good|welcome)/i;
    
    if (message.match(greetingPattern)) {
        return " 😊";
    }
    return "";
};

const isLateArrivalTopic = (message, languageDecision) => {
    const lowerMessage = message.toLowerCase();
    
    // Simple pattern matching just to identify the topic (not for response generation)
    return lowerMessage.includes('late') || 
           lowerMessage.includes('delay') || 
           (lowerMessage.includes('arrive') && lowerMessage.includes('after')) ||
           // Icelandic terms
           (languageDecision?.isIcelandic && (
               lowerMessage.includes('sein') || 
               lowerMessage.includes('töf') ||
               lowerMessage.includes('eftir bókun')
           ));
};

// Token management - optimized for GPT-4
const getMaxTokens = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Complex topics that need more space
    const complexTopics = [
        // English topics
        'ritual', 'changing', 'facilities', 
        'packages', 'gift', 'menu', 'food',
        'transport', 'accommodation',
        
        // Icelandic topics
        'ritúal', 'búningsklefi', 'aðstaða', 
        'saman', 'sér', 'matseðill', 'veitingar',
        'stefnumót', 'fyrir tvo', 'platta',
        'sælkera', 'smakk bar', 'keimur', 'gelmir',
        
        // Additional Icelandic facility terms
        'búningsklefa', 'sturtu', 'skáp', 'einkaklefi',
        'almenningsklefi', 'kynhlutlaus', 'kynsegin',
        'snyrtivör', 'handklæði', 'þægindi'
    ];

    // Add ritual detection first
    if (message.includes('ritual') || 
        message.includes('ritúal') || 
        message.includes('skjól') ||
        message.includes('skref') ||
        message.includes('þrep')) {
        return 1000;  // Increased from 800 for ritual
    }

    // Transportation detection
    if (message.includes('kemst') ||
        message.includes('komast') ||
        message.includes('strætó') ||
        message.includes('rútu') ||
        message.includes('bíl') ||
        message.includes('hjóla') ||
        message.includes('ganga') ||
        message.includes('samgöngur') ||
        message.includes('transport') ||
        message.includes('directions')) {
        return 1000;  // Increased from 800 for transport info
    }

    // Bar/Menu content detection
    if (message.includes('matseðil') ||
        message.includes('matseðli') || 
        message.includes('platta') || 
        message.includes('plattar') ||
        message.includes('sælkera') ||
        message.includes('smakk bar') ||
        message.includes('keimur') ||
        message.includes('gelmir') ||
        message.includes('veitingar') ||
        message.includes('bar') ||
        message.includes('drykkir')) {
        return 1200;  // Increased from 800 for menu content
    }    

    // Enhanced multi-part detection for both languages
    const isMultiPart = message.includes(' and ') || 
                       message.includes(' og ') || 
                       (message.match(/\?/g) || []).length > 1;

    // Facility comparison detection
    const isComparisonQuery = message.includes('munur') || 
                             message.includes('muninn') ||
                             (message.includes('hver') && message.includes('mismunur')) ||
                             (message.includes('hvað') && message.includes('öðruvísi'));

    // Facilities query detection
    const isFacilitiesQuery = message.includes('búningsklefi') ||
                             message.includes('búningsklefa') ||
                             message.includes('aðstaða') ||
                             message.includes('aðstöðu') ||
                             message.includes('klefi') ||
                             message.includes('klefa');

    const isComplex = complexTopics.some(topic => message.includes(topic));
    
    // Token allocation with Icelandic consideration
    if (isComparisonQuery && isFacilitiesQuery) return 1200;  // Facility comparisons // Increased from 1000
    if (isComplex && isMultiPart) return 1000;   // Complex multi-part // Increased from 800
    if (isComplex) return 800;                  // Single complex topic // Increased from 600
    if (isMultiPart) return 600;                // Multi-part questions // Increased from 500
    if (isFacilitiesQuery) return 800;          // Facility queries // Increased from 600

    return 500;  // Default token count
};

console.log('Environment Check:');
console.log('PORT:', process.env.PORT);
console.log('API_KEY set:', !!process.env.API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length);

// Configuration
const config = {
    PORT: process.env.PORT || "8080",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    API_KEY: process.env.API_KEY
};

// Initialize Express
const app = express();
app.set('trust proxy', 1);  // Add this line to fix X-Forwarded-For error

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`⚡ REQUEST: ${req.method} ${req.path}`);
    next();
  });

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: config.OPENAI_API_KEY
});

// CORS Configuration
const corsOptions = {
    origin: [
        'http://localhost:3000', // for local development
        'http://localhost:8080', // local server
        'https://sveinnssr.github.io',
        'https://sveinnssr.github.io/sky-lagoon-chat-2024', // your specific GitHub Pages path
        'https://sky-lagoon-chat-2024.vercel.app', // your Vercel React app URL
        'https://sky-lagoon-chat-2024-git-main-svorum-straxs-projects.vercel.app', // secondary Vercel URL (if any)
        'https://sky-lagoon-chat-2024-rayuxftbk-svorum-straxs-projects.vercel.app', // another Vercel URL
        'https://sky-lagoon-chatbot-server.vercel.app',
        'https://skylagoon-chat-demo.vercel.app', // your new frontend URL
        'https://chatbot-analytics-beta.vercel.app', // your dashboard URL
        'https://hysing.svorumstrax.is',  // new domain for dashboard
        'https://skylagoon.com',
        'https://www.skylagoon.com'
    ],
    methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
        'Content-Type', 
        'x-api-key', 
        'webhook-headers',
        'Upgrade',
        'Connection',
        'Sec-WebSocket-Key',
        'Sec-WebSocket-Version'
    ],
    credentials: true
};

// Rate limiter
const limiter = rateLimit({
    windowMs: RATE_LIMIT_MINUTES * 60 * 1000,  // Using our constant
    max: RATE_LIMIT_MAX_REQUESTS,              // Using our constant
    message: { error: "Too many requests. Please try again later." }
});

// Enhanced error logging
const logError = (error, context = {}) => {
    console.error('\n❌ Error Details:', {
        message: error.message,
        stack: error.stack,
        type: error.name,
        context: {
            ...context,
            // Update this line to use languageDecision
            language: context.languageDecision?.isIcelandic ? 'Icelandic' : 'English',
            timestamp: new Date().toISOString()
        }
    });
};

// API Key verification middleware
const verifyApiKey = (req, res, next) => {
    const apiKey = req.header('x-api-key');
    console.log('\n🔑 API Key Check:', {
        receivedKey: apiKey,
        configuredKey: process.env.API_KEY,
        matches: apiKey === process.env.API_KEY
    });
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
        console.error('❌ Invalid or missing API key');
        return res.status(401).json({ error: "Unauthorized request" });
    }
    next();
};

// Middleware
app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json());

// Health check endpoint for root path
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        config: {
            openaiConfigured: !!config.OPENAI_API_KEY,
            apiKeyConfigured: !!config.API_KEY
        }
    });
});

// Test endpoint for server status (add this before your main routes)
app.get('/ping', (req, res) => {
    res.status(200).json({
      message: 'Server is running',
      mongodb_uri_exists: !!process.env.MONGODB_URI,
      timestamp: new Date().toISOString()
    });
  });

// MongoDB test endpoint
app.get('/mongo-test', async (req, res) => {
    try {
      console.log('MongoDB test endpoint accessed');
      const { db } = await connectToDatabase();
      
      // Check if connection works by listing collections
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      res.status(200).json({
        success: true,
        message: 'MongoDB connected successfully',
        collections: collectionNames,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('MongoDB test endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to connect to MongoDB',
        error: error.message
      });
    }
  });

// Health check endpoint for chat path
app.get('/chat', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Chat server is running',
        timestamp: new Date().toISOString()
    });
});

// Add this new function before your chat endpoint
const formatErrorMessage = (error, userMessage, languageDecision) => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    // Update this line to use languageDecision
    const messages = languageDecision?.isIcelandic ? ERROR_MESSAGES.is : ERROR_MESSAGES.en;

    if (error.message.includes('rate_limit_exceeded')) {
        return messages.rateLimited;
    }
    
    return isDevelopment ? 
        `Development Error: ${error.message}` : 
        messages.general;
};

// Context management
const updateContext = (sessionId, message, response, languageDecision) => {
    let context = conversationContext.get(sessionId) || 
                 initializeContext(sessionId, languageDecision?.isIcelandic ? 'is' : 'en');
    
    // Enhanced language context maintenance
    const previousContext = conversationContext.get(sessionId);
    
    // If previous context exists, strongly maintain its language
    if (previousContext) {
        context.language = previousContext.language;
    }
    
    // Only override if current message has clear language indicators from new system
    if (languageDecision) {
        if (languageDecision.isIcelandic && languageDecision.confidence === 'high') {
            context.language = 'is';
        } else if (!languageDecision.isIcelandic && languageDecision.confidence === 'high') {
            context.language = 'en';
        }
    }

    // NEW: Improved topic detection - check if message is about arrival time/period but not late arrival
    const isAboutArrivalPeriod = 
        message.toLowerCase().includes('arrival period') || 
        message.toLowerCase().includes('check-in window') || 
        message.toLowerCase().includes('when should i arrive') ||
        message.toLowerCase().includes('how early can i arrive') ||
        message.toLowerCase().includes('when can i arrive');

    // NEW: Better detection for price/purchase topics
    const isAboutPricing = 
        message.toLowerCase().includes('price') || 
        message.toLowerCase().includes('cost') || 
        message.toLowerCase().includes('isk') || 
        message.toLowerCase().includes('package') ||
        message.toLowerCase().includes('purchase') ||
        message.toLowerCase().includes('buy') ||
        /\d+,\d+/.test(message.toLowerCase()) || // Price format with commas
        (message.toLowerCase().includes('child') && /\d+/.test(message.toLowerCase())) || // Children pricing
        (message.toLowerCase().includes('adult') && /\d+/.test(message.toLowerCase()));   // Adult pricing

    // NEW: Better detection for transportation status
    const isAboutTransportation = 
        (message.toLowerCase().includes('bus') || 
         message.toLowerCase().includes('transfer') || 
         message.toLowerCase().includes('shuttle')) &&
        (message.toLowerCase().includes('arrived') || 
         message.toLowerCase().includes('waiting') || 
         message.toLowerCase().includes('stop')) &&
        !message.toLowerCase().includes('booking') && 
        !message.toLowerCase().includes('reservation');

    // Reset specific contexts when appropriate
    if (message.toLowerCase().includes('reschedule') || 
        message.toLowerCase().includes('change') || 
        message.toLowerCase().includes('modify') ||
        isAboutArrivalPeriod ||
        isAboutPricing ||
        isAboutTransportation) {
        // Reset late arrival context when explicitly asking about booking changes
        // or when asking about unrelated topics
        context.lateArrivalContext = {
            ...context.lateArrivalContext,
            isLate: false,
            lastUpdate: Date.now()
        };

        // Set topic based on content
        if (isAboutArrivalPeriod) {
            context.lastTopic = 'arrival_info';
        } else if (isAboutPricing) {
            context.lastTopic = 'pricing';
        } else if (isAboutTransportation) {
            context.lastTopic = 'transportation';
        }

        // Reset sold out status unless explicitly mentioned in current message
        if (!message.toLowerCase().includes('sold out')) {
            context.soldOutStatus = false;
        }
    }

    // Clear late arrival context if conversation moves to a different topic
    if (!message.toLowerCase().includes('late') && 
        !message.toLowerCase().includes('delay') &&
        !message.toLowerCase().includes('flight') &&
        context.lastTopic === 'late_arrival') {
        // Use simple pattern matching instead of complex detection
        if (!isLateArrivalTopic(message, languageDecision) && !message.match(/it|that|this|these|those|they|there/i)) {
            context.lateArrivalContext = {
                ...context.lateArrivalContext,
                isLate: false,
                lastUpdate: Date.now()
            };
            // Only clear lastTopic if we're sure we're moving to a different subject
            if (!message.toLowerCase().includes('book')) {
                context.lastTopic = null;
            }
        }
    }

    // Update late arrival context if detected with simplified detection
    if (isLateArrivalTopic(message, languageDecision)) {
        context.lateArrivalContext = {
            ...context.lateArrivalContext,
            isLate: true,
            lastUpdate: Date.now()
        };
        context.lastTopic = 'late_arrival';
        console.log('\n🕒 Late arrival topic detected in context update');
    }

    // Enhanced context tracking
    if (message) {
        // Store question and update history
        context.lastQuestion = message;
        context.prevQuestions = [
            ...(context.prevQuestions || []).slice(-2),
            message
        ];

        // Enhanced conversation memory tracking
        context.conversationMemory.previousInteractions.push({
            type: 'user',
            content: message,
            timestamp: Date.now(),
            topic: context.lastTopic || null
        });

        // Maintain memory limit
        if (context.conversationMemory.previousInteractions.length > CONTEXT_MEMORY_LIMIT * 2) {
            context.conversationMemory.previousInteractions = 
                context.conversationMemory.previousInteractions.slice(-CONTEXT_MEMORY_LIMIT * 2);
        }

        // Detect follow-up patterns
        const patterns = CONTEXT_PATTERNS.followUp[context.language === 'is' ? 'is' : 'en'];
        if (patterns.some(pattern => message.toLowerCase().includes(pattern))) {
            context.questionContext = context.lastTopic;
        }

        // Track topic relationships
        if (context.lastTopic) {
            context.relatedTopics = [...new Set([
                ...(context.relatedTopics || []),
                context.lastTopic
            ])];
        }
    }

    if (response) {
        // Store answer and track references
        context.lastAnswer = response;

        // Track response in conversation memory
        context.conversationMemory.previousInteractions.push({
            type: 'assistant',
            content: response,
            timestamp: Date.now(),
            topic: context.lastTopic || null
        });        

        // Detect references to previous content
        const referencePatterns = CONTEXT_PATTERNS.reference[context.language === 'is' ? 'is' : 'en'];
        if (referencePatterns.some(pattern => response.toLowerCase().includes(pattern))) {
            context.contextualReferences.push({
                topic: context.lastTopic,
                timestamp: Date.now()
            });
        }
    }

    // Increment message count
    context.messageCount++;

    // Track topics discussed in specific languages
    if (message) {
        const currentTopic = detectTopic(message, 
            languageDecision?.isIcelandic ? 
            getRelevantKnowledge_is(message) : 
            getRelevantKnowledge(message),
            context,
            languageDecision
        ).topic;

        if (currentTopic) {
            if (languageDecision?.isIcelandic) {
                context.icelandicTopics = [...new Set([
                    ...(context.icelandicTopics || []),
                    currentTopic
                ])];
                console.log('\n🌍 Updated Icelandic Topics:', {
                    topics: context.icelandicTopics,
                    language: {
                        isIcelandic: languageDecision.isIcelandic,
                        confidence: languageDecision.confidence
                    }
                });
            }
        }
    }

    // ADD NEW TIME TRACKING CODE HERE 👇
    // Check for time-related queries
    if (message) {
        const timePatterns = {
            duration: /how long|hversu lengi|what time|hvað tekur|hvað langan tíma|hve lengi|hversu langan|takes how long|how much time|does it take/i,  // Added "does it take"
            booking: /book for|bóka fyrir|at|kl\.|klukkan|time slot|tíma|mæta|coming at|arrive at/i,
            specific: /(\d{1,2})[:\.]?(\d{2})?\s*(pm|am)?/i,
            dining: /mat|dinner|food|borða|máltíð|veitingar|restaurant|bar|eat|dining/i,
            activities: /ritual|ritúal|dinner|food|mat|borða/i,  // Moved ritual first
            closing: /close|closing|lok|loka|lokar|lokun/i
        };
    
        // Track if message is asking about duration
        if (timePatterns.duration.test(message)) {
            if (context.lastTopic || message.toLowerCase().includes('ritual')) {
                context.timeContext.lastDiscussedTime = {
                    topic: message.toLowerCase().includes('ritual') ? 'ritual' : context.lastTopic,
                    type: 'duration',
                    timestamp: Date.now(),
                    activity: message.toLowerCase().includes('ritual') ? 'ritual' : context.lastTopic
                };
                console.log('\n⏰ Duration Question Detected:', message);
            }
        }

        // Track activities mentioned together
        if (timePatterns.activities.test(message)) {
            const activities = [];
            if (message.match(/ritual|ritúal/i)) activities.push('ritual');
            if (message.match(/dinner|food|mat|borða|dining/i)) activities.push('dining');
            if (activities.length > 0) {
                context.timeContext.sequence = activities;
                console.log('\n🔄 Activity Sequence Updated:', activities);
            }
        }

        // Track specific times mentioned
        const timeMatch = message.match(timePatterns.specific);
        if (timeMatch) {
            const time = timeMatch[0];
            context.timeContext.lastDiscussedTime = {
                time: time,
                type: 'specific',
                timestamp: Date.now()
            };
            
            // If booking-related, update booking time
            if (timePatterns.booking.test(message)) {
                context.timeContext.bookingTime = time;
                console.log('\n⏰ Booking Time Updated:', time);
            }
        }

        // Enhanced logging
        if (context.timeContext.lastDiscussedTime || context.timeContext.sequence.length > 0) {
            console.log('\n⏰ Time Context Updated:', {
                lastDiscussed: context.timeContext.lastDiscussedTime,
                bookingTime: context.timeContext.bookingTime,
                sequence: context.timeContext.sequence,
                message: message,
                totalDuration: context.timeContext.sequence.reduce((total, activity) => 
                    total + (context.timeContext.activityDuration[activity] || 0), 0)
            });
        }
    }

    // Track if a follow-up was offered
    if (response && response.toLowerCase().includes('would you like')) {
        context.offeredMoreInfo = true;
    }

    // Update messages array
    if (message) {
        context.messages.push({
            role: 'user',
            content: message
        });
    }
    if (response) {
        context.messages.push({
            role: 'assistant',
            content: response
        });
    }

    // Maintain reasonable history size
    if (context.messages.length > MAX_CONTEXT_MESSAGES) {
        context.messages = context.messages.slice(-MAX_CONTEXT_MESSAGES);
    }

    // Update last interaction time
    context.lastInteraction = Date.now();
    context.lastResponse = response;
    
    // Enhanced language context persistence
    if (response) {
        // If previous context was Icelandic, maintain it strongly
        if (previousContext?.language === 'is') {
            context.language = 'is';
        } 
        // If response contains Icelandic characters, set to Icelandic
        else if (/[þæðöáíúéó]/i.test(response)) {
            context.language = 'is';
        }
        // If response is clearly in Icelandic, set to Icelandic
        else if (context.lastResponse?.includes('þú') || 
                context.messages?.some(m => m.content.includes('þú'))) {
            context.language = 'is';
        }
    }

    // Save context
    conversationContext.set(sessionId, context);
    return context;
};

const getContext = (sessionId) => conversationContext.get(sessionId);

setContextFunction(getContext);

// Enhanced chat endpoint with GPT-4 optimization
app.post('/chat', verifyApiKey, async (req, res) => {
    let context;  // Single declaration at the top
    
    // Unified function to broadcast but NOT send response
    const sendBroadcastAndPrepareResponse = async (responseObj) => {
        // Default values for language if not provided
        const languageInfo = responseObj.language || {
            detected: 'English',
            confidence: 'medium',
            reason: 'default'
        };
        
        // Extract the session ID from the request
        const sessionId = req.body.sessionId || null;

        // Only broadcast if we have a message to send (skip for suppressed messages)
        if (responseObj.message && !responseObj.suppressMessage) {
            try {
                console.log(`📨 Broadcasting response with session ID: ${sessionId || 'None provided'}`);
                
                // Single broadcast point with session ID
                const broadcastResult = await broadcastConversation(
                    req.body.message || req.body.question || "unknown_message",
                    responseObj.message,
                    languageInfo.detected === 'Icelandic' ? 'is' : 'en',
                    responseObj.topicType || 'general',
                    responseObj.responseType || 'direct_response',
                    sessionId // Pass the session ID from the client
                );
                
                // Store PostgreSQL ID if available
                if (broadcastResult && broadcastResult.postgresqlId) {
                    responseObj.postgresqlMessageId = broadcastResult.postgresqlId;
                }
            } catch (error) {
                console.error('❌ Error in broadcast function:', error);
            }
        }
        
        // Return the response object without sending it
        return responseObj;
    };
    
    try {
        // Keep variable for backward compatibility with other code references
        const currentSession = conversationContext.get('currentSession');
        
        // IMPORTANT CHANGE: Get sessionId directly from the request body - ALWAYS prioritize this
        // Never fall back to the global currentSession to prevent context bleeding
        const sessionId = req.body.sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        
        console.log('\n🔍 Full request body:', req.body);
        console.log('\n🆔 Using session ID:', sessionId);
        
        // Get message from either question or message field
        const userMessage = req.body.message || req.body.question;
        
        console.log('\n📥 Incoming Message:', userMessage);
        
        // No longer storing in global 'currentSession' to prevent context bleeding
        // Other parts of code may still need to read it, but we don't update it here
        
        // Get or create context using the new system
        const newContext = getSessionContext(sessionId);

        // Get initial context for this specific session (for backward compatibility)
        context = conversationContext.get(sessionId);

        // Do language detection first, with null context if we don't have one yet
        const languageDecision = newDetectLanguage(userMessage, context || newContext);        

        // NEW CODE: Extract language code in addition to isIcelandic
        const language = languageDecision.language || (languageDecision.isIcelandic ? 'is' : 'en');
        
        // Update language info in the new context
        updateLanguageContext(newContext, userMessage);
        
        // Enhanced logging for language detection
        console.log('\n🌍 Enhanced Language Detection:', {
            message: userMessage,
            language: language,
            isIcelandic: languageDecision.isIcelandic,
            confidence: languageDecision.confidence,
            reason: languageDecision.reason,
            sessionId: sessionId // Add session ID to logs for traceability
        });

        // NEW: Check for non-supported languages
        if (languageDecision.reason === 'non_supported_language') {
            console.log('\n🌐 Non-supported language detected:', {
                message: userMessage,
                detectedLanguage: languageDecision.detectedLanguage || 'unknown',
                confidence: languageDecision.confidence
            });
            
            const unsupportedLanguageResponse = "Unfortunately, I haven't been trained in this language yet. Please contact info@skylagoon.is who will be happy to assist.";
            
            // Add to new context system before responding
            addMessageToContext(newContext, { role: 'user', content: userMessage });
            
            // Use the unified broadcast system but don't send response yet
            const responseData = await sendBroadcastAndPrepareResponse({
                message: unsupportedLanguageResponse,
                language: {
                    detected: 'non-supported',
                    detectedSpecific: languageDecision.detectedLanguage || 'unknown',
                    confidence: languageDecision.confidence
                },
                topicType: 'language_not_supported',
                responseType: 'direct_response'
            });
            return res.status(responseData.status || 200).json(responseData);
        }

        // Keep old system during testing (modified to work without languageResult)
        const oldSystemResult = {
            isIcelandic: detectLanguage(userMessage),  // Simplified old system check
            source: 'old_system'
        };

        // Now initialize old context if it doesn't exist, using our language detection
        if (!context) {
            context = initializeContext(sessionId, languageDecision);
            conversationContext.set(sessionId, context);
        }
        
        // Add this message to the new context system
        addMessageToContext(newContext, { role: 'user', content: userMessage });
        
        // Update topics in the new context system
        updateTopicContext(newContext, userMessage);

        // Log session info for debugging
        console.log('\n🔍 Session ID:', {
            sessionId,
            isNewSession: !currentSession,
            currentSession: conversationContext.get('currentSession')
        });

        // Enhanced logging for language detection results
        console.log('\n🔬 Enhanced Language Detection Test:', {
            message: userMessage,
            newSystem: languageDecision,
            patterns: {
                hasGreeting: /^(hi|hey|hello|good\s*(morning|afternoon|evening))/i.test(userMessage),
                hasQuestion: /^(what|how|where|when|why|can|could|would|will|do|does|is|are|should)\b/i.test(userMessage),
                hasPackageTerms: /\b(pure|sky|admission|pass|package|ritual|facilities)\b/i.test(userMessage),
                isFollowUp: /^(and|or|but|so|also|what about|how about)/i.test(userMessage),
                hasIcelandicChars: /[þæðöáíúéó]/i.test(userMessage),
                hasIcelandicWords: /\b(og|að|er|það|við|ekki|ég|þú|hann|hún)\b/i.test(userMessage),
                isPriceQuery: /\b(cost|price|how much|prices|pricing)\b/i.test(userMessage),
                isTimeQuery: /\b(time|hours|when|open|close|opening|closing)\b/i.test(userMessage),
                isLocationQuery: /\b(where|location|address|directions|find|get there)\b/i.test(userMessage),
                hasPersonalPronouns: /\b(i|we|my|our|me|us)\b/i.test(userMessage),
                hasAmenityTerms: /\b(towel|robe|locker|shower|changing room|food|drink)\b/i.test(userMessage)
            }
        });

        // Enhanced logging to compare systems
        console.log('\n🔍 Language Detection Comparison:', {
            message: userMessage,
            oldSystem: oldSystemResult,
            newSystem: languageDecision,
            match: oldSystemResult.isIcelandic === languageDecision.isIcelandic
        });

        // During testing phase, still use old system result
        const isIcelandic = oldSystemResult.isIcelandic;

        // Add simplified languageCheck object using new system
        const languageCheck = {
            hasDefiniteEnglish: !languageDecision.isIcelandic && languageDecision.confidence === 'high',
            hasIcelandicStructure: languageDecision.isIcelandic,
            hasEnglishStructure: !languageDecision.isIcelandic,
            hasIcelandicChars: /[þæðöáíúéó]/i.test(userMessage),
            rawDetection: languageDecision
        };

        // Enhanced language decision logging
        console.log('\n🌍 Language Decision:', {
            message: userMessage,
            decision: languageDecision,
            finalDecision: languageDecision.isIcelandic ? 'Icelandic' : 'English'
        });
        
        // Endpoint Booking Change Request System structure
        // FIRST: Handle booking form submissions
        if (req.body.isBookingChangeRequest) {
            try {
                // Parse the message as form data
                const formData = JSON.parse(req.body.formData || '{}');
                
                console.log('\n📝 Submitting booking change form data:', formData);
                
                // Create a NEW chat for the form submission
                console.log('\n📝 Creating new LiveChat booking change request for form submission');
                const chatData = await createBookingChangeRequest(sessionId, languageDecision.isIcelandic);

                if (!chatData.chat_id) {
                    throw new Error('Failed to create booking change request chat');
                }
                
                // Submit the booking change request to the NEW chat
                const submitted = await submitBookingChangeRequest(
                    chatData.chat_id,  // Use the new chat ID
                    formData, 
                    chatData.bot_token // Use the new bot token
                );
                
                if (!submitted) {
                    throw new Error('Failed to submit booking change request');
                }
                
                // Return success response
                const confirmationMessage = languageDecision.isIcelandic ?
                    "Takk fyrir beiðnina um breytingu á bókun. Teymi okkar mun yfirfara hana og svara tölvupóstinum þínum innan 24 klukkustunda." :
                    "Thank you for your booking change request. Our team will review it and respond to your email within 24 hours.";
                
                // Use the unified broadcast system but don't send response yet
                const responseData = await sendBroadcastAndPrepareResponse({
                    message: confirmationMessage,
                    success: true,
                    language: {
                        detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                        confidence: languageDecision.confidence
                    },
                    topicType: 'booking_change_submitted',
                    responseType: 'direct_response'
                });
                return res.status(responseData.status || 200).json(responseData);
            } catch (error) {
                console.error('\n❌ Booking Form Submission Error:', error);
                
                // Return error response
                const errorMessage = languageDecision.isIcelandic ?
                    "Því miður get ég ekki sent beiðnina þína núna. Vinsamlegast reyndu aftur síðar eða hringdu í +354 527 6800." :
                    "I'm sorry, I couldn't submit your request at this time. Please try again later or call us at +354 527 6800.";
                
                // Use the unified broadcast system but don't send response yet
                const errorResponseData = await sendBroadcastAndPrepareResponse({
                    message: errorMessage,
                    success: false,
                    status: 500,
                    error: error.message,
                    language: {
                        detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                        confidence: languageDecision.confidence
                    },
                    topicType: 'booking_change_failed',
                    responseType: 'direct_response'
                });
                return res.status(errorResponseData.status || 500).json(errorResponseData);
            }
        }

        // SECOND: Check if we should show booking change form.
        const bookingFormCheck = await shouldShowBookingForm(userMessage, languageDecision);

        if (bookingFormCheck.shouldShowForm) {
            try {
                // Create chat using bot for the booking change request
                console.log('\n📝 Creating new LiveChat booking change request for:', sessionId);
                const chatData = await createBookingChangeRequest(sessionId, languageDecision.isIcelandic);

                if (!chatData.chat_id) {
                    throw new Error('Failed to create booking change request');
                }

                console.log('\n✅ Booking change request created:', chatData.chat_id);

                // Prepare booking change message based on language and agent hours
                const bookingChangeMessage = languageDecision.isIcelandic ?
                    `Ég sé að þú vilt breyta bókuninni þinni. ${!bookingFormCheck.isWithinAgentHours ? 'Athugaðu að þjónustufulltrúar okkar starfa frá kl. 9-16 (GMT) virka daga. ' : ''}Fyrir bókanir innan 48 klukkustunda, vinsamlegast hringdu í +354 527 6800. Fyrir framtíðarbókanir, geturðu sent beiðni um breytingu með því að fylla út eyðublaðið hér að neðan. Vinsamlegast athugaðu að allar breytingar eru háðar framboði.` :
                    `I see you'd like to change your booking. ${!bookingFormCheck.isWithinAgentHours ? 'Please note that our customer service team works from 9 AM to 4 PM (GMT) on weekdays. ' : ''}For immediate assistance with bookings within 48 hours, please call us at +354 527 6800. For future bookings, you can submit a change request using the form below. Our team will review your request and respond via email within 24 hours.`;

                // Use the unified broadcast system but don't send response yet
                const responseData = await sendBroadcastAndPrepareResponse({
                    message: bookingChangeMessage,
                    showBookingChangeForm: true,
                    chatId: chatData.chat_id,
                    bot_token: chatData.bot_token,
                    agent_credentials: chatData.agent_credentials,
                    language: {
                        detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                        confidence: languageDecision.confidence
                    },
                    topicType: 'booking_change_request',
                    responseType: 'direct_response'
                });
                return res.status(responseData.status || 200).json(responseData);
            } catch (error) {
                console.error('\n❌ Booking Change Request Error:', error);
                // Fall through to AI response if request fails
                
                // Provide fallback response when request fails
                const fallbackMessage = languageDecision.isIcelandic ?
                    "Því miður er ekki hægt að senda beiðni um breytingu á bókun núna. Vinsamlegast hringdu í +354 527 6800 eða sendu tölvupóst á reservations@skylagoon.is fyrir aðstoð." :
                    "I'm sorry, I couldn't submit your booking change request at the moment. Please call us at +354 527 6800 or email reservations@skylagoon.is for assistance.";

                // Use the unified broadcast system but don't send response yet
                const errorResponseData = await sendBroadcastAndPrepareResponse({
                    message: fallbackMessage,
                    error: error.message,
                    language: {
                        detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                        confidence: languageDecision.confidence
                    },
                    topicType: 'booking_change_failed',
                    responseType: 'direct_response'
                });
                return res.status(errorResponseData.status || 500).json(errorResponseData);
            }
        }

        // Check if we should transfer to human agent (only if not a booking change)
        const transferCheck = await shouldTransferToAgent(userMessage, languageDecision, context);
        
        console.log('\n🔄 Transfer Check Result:', {
            shouldTransfer: transferCheck.shouldTransfer,
            reason: transferCheck.reason,
            withinHours: isWithinOperatingHours(),
            availableAgents: transferCheck.agents?.length || 0
        });

        if (transferCheck.shouldTransfer) {
            try {
                // Create chat using bot
                console.log('\n📝 Creating new LiveChat chat for:', sessionId);
                const chatData = await createChat(sessionId, languageDecision.isIcelandic);

                if (!chatData.chat_id) {
                    throw new Error('Failed to create chat');
                }

                console.log('\n✅ Chat created successfully:', chatData.chat_id);

                // Send initial message to LiveChat (if not already sent in welcome_message)
                const messageSent = await sendMessageToLiveChat(chatData.chat_id, userMessage, chatData.bot_token);
                console.log('\n📝 Initial message sent:', messageSent);
                
                // Prepare transfer message based on language
                const transferMessage = languageDecision.isIcelandic ?
                    "Ég er að tengja þig við þjónustufulltrúa. Eitt andartak..." :
                    "I'm connecting you with a customer service representative. One moment...";

                // Use the unified broadcast system but don't send response yet
                const responseData = await sendBroadcastAndPrepareResponse({
                    message: transferMessage,
                    transferred: true,
                    chatId: chatData.chat_id,
                    bot_token: chatData.bot_token,
                    agent_credentials: chatData.agent_credentials,
                    initiateWidget: true,
                    language: {
                        detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                        confidence: languageDecision.confidence
                    },
                    topicType: 'transfer',
                    responseType: 'direct_response'
                });
                return res.status(responseData.status || 200).json(responseData);
            } catch (error) {
                console.error('\n❌ Transfer Error:', error);
                // Fall through to AI response if transfer fails
                
                // Provide fallback response when transfer fails
                const fallbackMessage = languageDecision.isIcelandic ?
                    "Því miður er ekki hægt að tengja þig við þjónustufulltrúa núna. Vinsamlegast hringdu í +354 527 6800 eða sendu tölvupóst á reservations@skylagoon.is fyrir aðstoð." :
                    "I'm sorry, I couldn't connect you with an agent at the moment. Please call us at +354 527 6800 or email reservations@skylagoon.is for assistance.";

                // Use the unified broadcast system but don't send response yet
                const errorResponseData = await sendBroadcastAndPrepareResponse({
                    message: fallbackMessage,
                    transferred: false,
                    error: error.message,
                    language: {
                        detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                        confidence: languageDecision.confidence
                    },
                    topicType: 'transfer_failed',
                    responseType: 'direct_response'
                });
                return res.status(errorResponseData.status || 500).json(errorResponseData);
            }
        } else if (transferCheck.response) {
            // If we have a specific response (e.g., outside hours), send it
            // Use the unified broadcast system but don't send response yet
            const responseData = await sendBroadcastAndPrepareResponse({
                message: transferCheck.response,
                language: {
                    detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence
                },
                topicType: 'transfer_unavailable',
                responseType: 'direct_response'
            });
            return res.status(responseData.status || 200).json(responseData);
        }
        
        // Handle messages when in agent mode
        if (req.body.chatId && req.body.isAgentMode) {
            try {
                // Try bot token first, fall back to agent credentials
                const credentials = req.body.bot_token || req.body.agent_credentials;
                await sendMessageToLiveChat(req.body.chatId, userMessage, credentials);
                
                // No broadcast needed for agent mode messages - just forward them
                return res.status(200).json({
                    success: true,
                    chatId: req.body.chatId,
                    bot_token: req.body.bot_token,
                    agent_credentials: req.body.agent_credentials,
                    suppressMessage: true,
                    language: {
                        detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                        confidence: languageDecision.confidence
                    }
                });
            } catch (error) {
                console.error('\n❌ LiveChat Message Error:', error);
                return res.status(500).json({
                    message: languageDecision.isIcelandic ? 
                        "Villa kom upp við að senda skilaboð" :
                        "Error sending message to agent",
                    error: error.message
                });
            }
        }

        // If not transferring or transfer failed, continue with regular chatbot flow...

        // Simplified greeting context setting (replacing the entire previous block)
        if (userMessage && userMessage.trim()) {
            // Set conversation started flag for any message
            if (!context.conversationStarted) {
                context.conversationStarted = true;
                console.log('\n👋 Setting conversation started flag');
            }
            
            // Update language in context
            if (languageDecision) {
                context.language = languageDecision.isIcelandic ? 'is' : 'en';
            }
            
            // Save context
            conversationContext.set(sessionId, context);
        }

        // MOVE TOPIC CONTEXT CODE HERE - after context initialization
        if (userMessage.toLowerCase().includes('ritual') || 
            (context.lastTopic === 'ritual' && 
             userMessage.toLowerCase().match(/how long|take|duration|time/i))) {
            context.lastTopic = 'ritual';
            context.timeContext = context.timeContext || {};
            context.timeContext.activityDuration = context.timeContext.activityDuration || {
                ritual: 45,
                dining: 60,
                bar: 30
            };
        }

        // Late arrival simple detection
        if (isLateArrivalTopic(userMessage, languageDecision)) {
                console.log('\n🕒 Late arrival topic detected via simple pattern matching');
                context.lastTopic = 'late_arrival';
                // Simplified context - no complex categorization
                context.lateArrivalContext = {
                        isLate: true,
                        lastUpdate: Date.now()
                };
        }        

        // ADD THE NEW CODE RIGHT HERE 👇
            // Add timestamp for performance tracking
            const startTime = Date.now();

            // Add logging before check
            console.log('\n🔍 Processing Query:', {
                message: userMessage,
                isIcelandic,
                timestamp: new Date().toISOString()
            });        
        
            // First check for ritual skipping queries
            const isRitualSkippingQuery = isIcelandic && (
                (userMessage.toLowerCase().includes('bara') && (userMessage.toLowerCase().includes('lón') || userMessage.toLowerCase().includes('laug'))) ||
                (userMessage.toLowerCase().includes('án') && userMessage.toLowerCase().includes('ritúal')) ||
                (userMessage.toLowerCase().includes('sleppa') && userMessage.toLowerCase().includes('ritúal')) ||
                (userMessage.toLowerCase().includes('bóka') && userMessage.toLowerCase().includes('bara') && userMessage.toLowerCase().includes('laug')) ||
                (userMessage.toLowerCase().includes('hægt') && userMessage.toLowerCase().includes('bara') && userMessage.toLowerCase().includes('laug'))
            );
            
            // Add ritual skipping check logging
            console.log('\n🧘 Ritual Skipping Check:', {
                isRitualSkippingQuery,
                message: userMessage
            });
            
            // Handle ritual skipping queries
            if (isRitualSkippingQuery) {
                console.log('\n❌ Skip Ritual Query Found');
                
                const response = "Skjól ritúal meðferðin er innifalin í öllum pökkum okkar og er órjúfanlegur hluti af Sky Lagoon upplifuninni. Þú getur valið á milli tveggja pakka - Saman eða Sér - sem báðir innihalda aðgang að lóninu og Skjól ritúal meðferðina.";
                
                // Update context
                context.lastTopic = 'ritual';
                conversationContext.set(sessionId, context);
                
                // Use the unified broadcast system but don't send response yet
                const responseData = await sendBroadcastAndPrepareResponse({
                    message: response,
                    language: {
                        detected: 'Icelandic',
                        confidence: languageDecision.confidence,
                        reason: 'ritual_mandatory'
                    },
                    topicType: 'ritual',
                    responseType: 'direct_response'
                });
                return res.status(responseData.status || 200).json(responseData);
            }
        
            // Enhanced booking detection/Simplified for better performance - Add this BEFORE late arrival check
            const isAvailabilityQuery = isIcelandic && (
                userMessage.toLowerCase().includes('eigið laust') ||
                userMessage.toLowerCase().includes('laust pláss') ||
                userMessage.toLowerCase().includes('laus pláss') ||   // Add this variation
                userMessage.toLowerCase().includes('lausar tímar') ||  // Add this variation (available times)
                userMessage.toLowerCase().includes('lausir tímar') ||  // Add this variation (another gender form)
                userMessage.toLowerCase().includes('hægt að bóka') ||
                userMessage.toLowerCase().includes('á morgun') ||
                userMessage.toLowerCase().includes('laust fyrir') || 
                userMessage.toLowerCase().includes('pláss á') ||      // Add this more generic check
                userMessage.toLowerCase().includes('pláss í') ||
                userMessage.toLowerCase().includes('eitthvað laust') ||  // Add this pattern
                userMessage.toLowerCase().includes('er laust')           // Add this pattern   
            );

            // Add logging after check
            console.log('\n✅ Availability Check:', {
                isAvailabilityQuery,
                message: userMessage,
                processingTime: Date.now() - startTime
            });
            
            // Add availability handler
            if (isAvailabilityQuery) {
                console.log('\n🗓️ Handling availability query');
                
                // Extract day from message if present
                let dayMentioned = "";
                if (userMessage.toLowerCase().includes('mánudag')) dayMentioned = "mánudegi";
                else if (userMessage.toLowerCase().includes('þriðjudag')) dayMentioned = "þriðjudegi";
                else if (userMessage.toLowerCase().includes('miðvikudag')) dayMentioned = "miðvikudegi";
                else if (userMessage.toLowerCase().includes('fimmtudag')) dayMentioned = "fimmtudegi";
                else if (userMessage.toLowerCase().includes('föstudag')) dayMentioned = "föstudegi";
                else if (userMessage.toLowerCase().includes('laugardag')) dayMentioned = "laugardegi";
                else if (userMessage.toLowerCase().includes('sunnudag')) dayMentioned = "sunnudegi";
                
                // Create a dynamic response based on context with proper link formatting
                let response = "";
                if (dayMentioned) {
                    response = `Við erum oft með laus pláss á ${dayMentioned}, en framboð getur verið takmarkað, sérstaklega á annatímum. Til að sjá nákvæma tíma sem eru lausir og bóka beint, mælum við með að heimsækja vefsíðuna okkar: [Bóka heimsókn] (https://www.skylagoon.com/is/boka)`;
                } else {
                    response = "Til að sjá nákvæmt framboð og bóka tíma mælum við með að heimsækja vefsíðuna okkar: [Bóka heimsókn] (https://www.skylagoon.com/is/boka). Þar sérðu í rauntíma hvaða tímar eru lausir á þeim degi sem þú vilt heimsækja okkur.";
                }
                
                // Update context
                context.lastTopic = 'availability';
                conversationContext.set(sessionId, context);
                
                // Use the unified broadcast system but don't send response yet
                const responseData = await sendBroadcastAndPrepareResponse({
                    message: response,
                    language: {
                        detected: 'Icelandic',
                        confidence: languageDecision.confidence,
                        reason: 'availability_query'
                    },
                    topicType: 'availability',
                    responseType: 'direct_response'
                });
                return res.status(responseData.status || 200).json(responseData);
            }  

            const msg = userMessage.toLowerCase();            

        // Simple context setting for small talk/identity/greeting questions
        if (userMessage) {
            // Detect small talk for context (but don't handle it directly)
            const isSmallTalkQuestion = 
                /^how (?:are you|(?:you )?doing|is it going)/i.test(userMessage) ||
                /^(?:what'?s up|what up|sup|yo|wassup)/i.test(userMessage) || 
                /^(?:who are you|are you (?:ai|a bot|human|real))/i.test(userMessage) ||
                // Icelandic equivalents
                /^(?:hvernig|hvað) (?:hefur[ðd]u (?:það|það)|gengu[rd]|líður þér)/i.test(userMessage) ||
                /^(?:hvað segir[uð]|sæll og blessaður|sæl og blessuð)/i.test(userMessage) ||
                /^(?:hver ert þú|ertu (?:ai|gervigreind|vélmenni|bot))/i.test(userMessage);
            
            if (isSmallTalkQuestion) {
                console.log('\n💬 Small talk question detected, setting context');
                context.lastTopic = 'small_talk';
                // No return - continue to ChatGPT
            }
        }

        // ADD NEW SMART CONTEXT CODE Right HERE 👇 .
        // Smart context-aware knowledge base selection
        const getRelevantContent = (userMessage) => {  // Remove isIcelandic parameter
            // Use our new language detection with existing context
            const contentLanguageDecision = newDetectLanguage(userMessage, context);

            // Get knowledge base results immediately based on language decision
            let baseResults = [];
            try {
                baseResults = contentLanguageDecision.isIcelandic ? 
                    getRelevantKnowledge_is(userMessage) : 
                    getRelevantKnowledge(userMessage);
                
                // Ensure baseResults is an array
                if (!Array.isArray(baseResults)) {
                    console.warn('⚠️ baseResults is not an array, using empty array instead');
                    baseResults = [];
                }
            } catch (error) {
                console.error('❌ Error getting knowledge base results:', error.message);
                // Keep baseResults as empty array
            }

            // Time context detection
            const timeContext = detectTimeContext(userMessage, getCurrentSeason(), contentLanguageDecision);
            if (timeContext.type && context) {
                // Update existing timeContext with new information
                context.timeContext = {
                    ...context.timeContext,
                    lastDiscussedTime: {
                        type: timeContext.type,
                        activity: timeContext.activity,
                        timestamp: Date.now()
                    },
                    // Keep existing sequence and activityDuration
                    sequence: timeContext.activity ? 
                        [...context.timeContext.sequence, timeContext.activity] :
                        context.timeContext.sequence,
                    // Keep existing durations
                    activityDuration: context.timeContext.activityDuration
                };
                
                console.log('\n⏰ Time Context Updated:', {
                    type: timeContext.type,
                    activity: timeContext.activity,
                    sequence: context.timeContext.sequence,
                    operatingHours: timeContext.operatingHours,
                    language: {
                        isIcelandic: contentLanguageDecision.isIcelandic,
                        confidence: contentLanguageDecision.confidence
                    }
                });
            }

            // Enhanced package detection
            const isSamanQuery = userMessage.toLowerCase().includes('saman');
            const isSerQuery = userMessage.toLowerCase().match(/private|changing|sér|einkaaðstöðu/);
            
            // Update package context
            if (context) {
                // Update package type if explicitly mentioned
                if (isSamanQuery) context.lastPackage = 'saman';
                if (isSerQuery) context.lastPackage = 'ser';
                
                // Maintain existing package context for follow-up questions
                if (!context.lastPackage && (context.lastTopic === 'packages' || context.previousPackage)) {
                    context.lastPackage = context.previousPackage;
                }
                
                // Store current package as previous for next query
                if (context.lastPackage) {
                    context.previousPackage = context.lastPackage;
                }

                // Persist package context for dining queries
                if (userMessage.toLowerCase().match(/food|eat|dining|restaurant|bar|matur|veitingar/)) {
                    context.lastTopic = 'dining';
                    // Ensure package context carries over to dining
                    if (context.previousPackage && !context.lastPackage) {
                        context.lastPackage = context.previousPackage;
                    }
                }
            }

            // Enhanced context logging
            console.log('\n🧠 Context Analysis:', {
                message: userMessage,
                lastTopic: context?.lastTopic,
                lastPackage: context?.lastPackage,
                lastLocation: context?.lastLocation,
                language: {
                    isIcelandic: contentLanguageDecision.isIcelandic,
                    confidence: contentLanguageDecision.confidence,
                    reason: contentLanguageDecision.reason
                },
                packageDetected: isSamanQuery ? 'saman' : isSerQuery ? 'ser' : null
            });

            // Add package context debug log
            if (context?.lastPackage) {
                console.log('\n📦 Package Context:', {
                    current: context.lastPackage,
                    previous: context.previousPackage,
                    topic: context.lastTopic,
                    language: {
                        isIcelandic: contentLanguageDecision.isIcelandic,
                        confidence: contentLanguageDecision.confidence
                    }
                });
            }

            // Check for package upgrade or modification questions first
            const isPackageContext = context?.lastTopic === 'packages';
            const isSamanMention = userMessage.toLowerCase().includes('saman');
            const isSerMention = userMessage.toLowerCase().match(/private|changing|sér|einkaaðstöðu/);

            if (isPackageContext || isSamanMention || isSerMention) {
                // Handle upgrade to private changing
                if (userMessage.toLowerCase().match(/private|changing|sér|upgrade|better/)) {
                    console.log('\n📦 Package Upgrade Detected:', {
                        language: {
                            isIcelandic: contentLanguageDecision.isIcelandic,
                            confidence: contentLanguageDecision.confidence
                        }
                    });
                    return [{
                        type: 'packages',
                        content: {
                            type: 'ser',
                            context: 'upgrade',
                            previousPackage: context?.lastPackage || 'saman'
                        }
                    }];
                }

                // Handle dining within package context
                if (userMessage.toLowerCase().match(/food|eat|dining|restaurant|bar|smakk|keimur|gelmir|matur|veitingar|innifalinn/)) {
                    const currentPackage = context?.lastPackage || 'standard';
                    
                    console.log('\n🍽️ Package Dining Query Detected:', {
                        package: currentPackage,
                        query: userMessage,
                        language: {
                            isIcelandic: contentLanguageDecision.isIcelandic,
                            confidence: contentLanguageDecision.confidence
                        }
                    });
                    
                    return [{
                        type: 'dining',
                        content: {
                            packageType: currentPackage,
                            dining: {
                                options: ['Smakk Bar', 'Keimur Café', 'Gelmir Bar'],
                                packageInclusions: currentPackage === 'ser' ? 
                                    ['Premium Dining Access', 'Sky Products'] :
                                    currentPackage === 'stefnumot' ? 
                                    ['Sky Platter', 'Welcome Drink'] : []
                            },
                            isIncluded: userMessage.toLowerCase().includes('innifalinn'),
                            packageSpecific: true
                        }
                    }];
                }
            }

            // Handle location/facilities context
            if (context?.lastServiceType === 'ser' || 
                context?.lastPackage === 'ser' || 
                userMessage.toLowerCase().includes('facilities')) {
                
                if (userMessage.toLowerCase().match(/where|location|facilities|changing|locker|shower|private/)) {
                    console.log('\n🏢 Facilities Query Detected', {
                        language: {
                            isIcelandic: contentLanguageDecision.isIcelandic,
                            confidence: contentLanguageDecision.confidence
                        }
                    });
                    return [{
                        type: 'facilities',
                        content: {
                            type: 'ser',
                            facilities: {
                                changingRooms: 'private',
                                amenities: ['Sky Products', 'Private Shower', 'Hair Dryer']
                            }
                        }
                    }];
                }
            }

            // Check for context-dependent words (follow-up questions)
            const contextWords = /it|that|this|these|those|they|there/i;
            const isContextQuestion = userMessage.toLowerCase().match(contextWords);

            // More specific question type detection
            const isDurationQuestion = userMessage.toLowerCase().match(/how long|take|duration|time|hvað tekur|hversu lengi/i) || 
                                     userMessage.toLowerCase().match(/how much time/i);
            const isPriceQuestion = userMessage.toLowerCase().match(/how much (?!time)|cost|price|expensive/i);
            const isLocationQuestion = userMessage.toLowerCase().match(/where|location|address|find|get there/i);
            const isComparisonQuestion = userMessage.toLowerCase().match(/difference|compare|versus|vs|better/i);

            // Enhanced logging for question type detection
            console.log('\n❓ Question Analysis:', {
                isDuration: !!isDurationQuestion,
                isPrice: !!isPriceQuestion,
                isLocation: !!isLocationQuestion,
                isComparison: !!isComparisonQuestion,
                isFollowUp: !!isContextQuestion,
                lastTopic: context?.lastTopic || null,
                language: {
                    isIcelandic: contentLanguageDecision.isIcelandic,
                    confidence: contentLanguageDecision.confidence,
                    reason: contentLanguageDecision.reason
                }
            });
            
            // If we have context and it's a follow-up question
            if (context?.lastTopic) {
                console.log('\n🧠 Using Context:', {
                    lastTopic: context.lastTopic,
                    previousTopic: context.prevQuestions,
                    question: userMessage,
                    isDuration: isDurationQuestion,
                    isLateArrival: context.lastTopic === 'late_arrival',
                    language: {
                        isIcelandic: contentLanguageDecision.isIcelandic,
                        confidence: contentLanguageDecision.confidence
                    }
                });
                
                // Use our new language detection system directly
                let results = [];
                try {
                    results = contentLanguageDecision.isIcelandic ? 
                        getRelevantKnowledge_is(userMessage) : 
                        getRelevantKnowledge(userMessage);
                    
                    // Ensure results is an array
                    if (!Array.isArray(results)) {
                        console.warn('⚠️ results is not an array, using empty array instead');
                        results = [];
                    }
                } catch (error) {
                    console.error('❌ Error getting contextual knowledge results:', error.message);
                    // Keep results as empty array
                }
                    
                // Enhanced contextual results filtering
                const contextualResults = results.filter(k => {
                    // Only process content matching our current topic
                    if (k.type !== context.lastTopic) return false;
                    
                    // For duration questions
                    if (isDurationQuestion) {
                        // Get topic from conversationMemory
                        const lastTopic = context.conversationMemory.getLastTopic();
                        
                        if (lastTopic === 'ritual') {
                            console.log('\n⏱️ Ritual Duration Question:', {
                                language: {
                                    isIcelandic: contentLanguageDecision.isIcelandic,
                                    confidence: contentLanguageDecision.confidence
                                }
                            });
                            return {
                                type: 'ritual',
                                content: {
                                    duration: {
                                        answer: contentLanguageDecision.isIcelandic ?
                                            "Skjól ritúalið okkar tekur venjulega 45 mínútur. Þú getur tekið þinn tíma og notið hvers skrefs á þínum hraða. ✨" :
                                            "Our Skjól ritual typically takes 45 minutes. You're welcome to take your time and fully enjoy each step at your own pace. ✨"
                                    }
                                }
                            };
                        }
                        
                        if (lastTopic === 'packages') {
                            console.log('\n⏱️ Package Duration Question:', {
                                language: {
                                    isIcelandic: contentLanguageDecision.isIcelandic,
                                    confidence: contentLanguageDecision.confidence
                                }
                            });
                            return {
                                type: 'packages',
                                content: {
                                    duration: {
                                        answer: contentLanguageDecision.isIcelandic ?
                                            "Venjuleg heimsókn tekur 1,5-2 klukkustundir, sem felur í sér 45 mínútna ritúal. Þú getur að sjálfsögðu dvalið lengur og slakað á í lóninu okkar. ✨" :
                                            "A typical visit takes 1.5-2 hours, which includes the 45-minute ritual. You're welcome to stay longer and relax in our lagoon. ✨"
                                    }
                                }
                            };
                        }
                    }
                    
                    // For non-duration questions
                    return true;
                });
                
                if (contextualResults.length > 0) {
                    // Enhanced logging for custom responses
                    console.log('\n🎯 Using Contextual Results:', {
                        count: contextualResults.length,
                        types: contextualResults.map(r => r.type),
                        language: {
                            isIcelandic: contentLanguageDecision.isIcelandic,
                            confidence: contentLanguageDecision.confidence,
                            reason: contentLanguageDecision.reason
                        }
                    });

                    // If we have a custom response, prevent caching
                    if (contextualResults.some(r => r.forceCustomResponse)) {
                        console.log('\n🚫 Using custom response - bypassing cache');
                        contextualResults.forEach(r => r.bypassCache = true);
                    }
                    return contextualResults;
                }
            }
            
            // Use our new language detection consistently
            console.log('\n🔍 Knowledge Base Selection:', {
                message: userMessage,
                language: {
                    isIcelandic: contentLanguageDecision.isIcelandic,
                    confidence: contentLanguageDecision.confidence,
                    reason: contentLanguageDecision.reason
                }
            });

            // Get knowledge base results based on language
            let results = [];
            try {
                results = contentLanguageDecision.isIcelandic ? 
                    getRelevantKnowledge_is(userMessage) : 
                    getRelevantKnowledge(userMessage);
                
                // Ensure results is an array
                if (!Array.isArray(results)) {
                    console.warn('⚠️ results is not an array, using empty array instead');
                    results = [];
                }
            } catch (error) {
                console.error('❌ Error getting knowledge base results:', error.message);
                // Keep results as empty array
            }

            // Store the original results length
            const hasResults = results && results.length > 0;

            // Enhanced results logging
            console.log('\n📚 Knowledge Base Results:', {
                count: results.length,
                types: results.map(r => r.type),
                language: {
                    isIcelandic: contentLanguageDecision.isIcelandic,
                    confidence: contentLanguageDecision.confidence,
                    reason: contentLanguageDecision.reason
                }
            });

            // Only proceed with filtering if we have results
            if (hasResults) {
                // Filter results based on time context
                if (timeContext.type) {
                    // For duration questions about specific activities
                    if (timeContext.type === 'duration' && timeContext.activity) {
                        const filteredResults = results.filter(r => r.type === timeContext.activity)
                            .map(r => ({
                                ...r,
                                priority: 'duration',
                                activityDuration: context.timeContext.activityDuration[timeContext.activity],
                                language: {
                                    isIcelandic: contentLanguageDecision.isIcelandic,
                                    confidence: contentLanguageDecision.confidence
                                }
                            }));
                        // Only return filtered results if we found matches
                        if (filteredResults.length > 0) {
                            return filteredResults;
                        }
                    }

                    // For hours queries
                    if (timeContext.type === 'hours') {
                        const filteredResults = results.filter(r => r.type === 'hours' || r.type === 'seasonal_information')
                            .map(r => ({
                                ...r,
                                operatingHours: timeContext.operatingHours,
                                language: {
                                    isIcelandic: contentLanguageDecision.isIcelandic,
                                    confidence: contentLanguageDecision.confidence
                                }
                            }));
                        // Only return filtered results if we found matches
                        if (filteredResults.length > 0) {
                            return filteredResults;
                        }
                    }
                }
            }

            // Return original results if we had them
            return hasResults ? results : [];
        };

        // Use vector search with fallback to traditional search
        let knowledgeBaseResults = [];
        try {
            // First try vector search with the new context system
            console.log('\n🔍 Attempting vector search...');
            knowledgeBaseResults = await getVectorKnowledge(userMessage, newContext);
            
            // Log vector search results
            console.log('\n🔍 Vector search results:', {
                count: knowledgeBaseResults.length,
                language: newContext.language,
                query: userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : '')
            });
            
            // If vector search yielded no results, fall back to traditional search
            if (!knowledgeBaseResults || knowledgeBaseResults.length === 0) {
                console.log('\n🔍 No vector results, falling back to traditional search');
                try {
                    const results = getRelevantContent(userMessage);
                    // Ensure results is an array
                    knowledgeBaseResults = Array.isArray(results) ? results : [];
                } catch (error) {
                    console.error('\n❌ Traditional search fallback error:', error.message);
                    knowledgeBaseResults = []; // Empty array on error
                }
            }
        } catch (error) {
            // If vector search fails, log error and fall back to traditional search
            console.error('\n❌ Vector search error:', error.message);
            console.log('\n🔍 Falling back to traditional search after error');
            try {
                const results = getRelevantContent(userMessage);
                // Ensure results is an array
                knowledgeBaseResults = Array.isArray(results) ? results : [];
            } catch (fallbackError) {
                console.error('\n❌ Traditional search also failed:', fallbackError.message);
                knowledgeBaseResults = []; // Empty array as last resort
            }
        }

        // Preserve non-zero results by making a copy
        let originalResults = null;
        if (knowledgeBaseResults && knowledgeBaseResults.length > 0) {
            originalResults = [...knowledgeBaseResults];
            // Log to confirm we have results
            console.log('\n📝 Preserving Knowledge Base Results:', {
                count: originalResults.length,
                types: originalResults.map(r => r.type)
            });
        }

        // Log full results
        console.log('\n📝 Full Knowledge Base Results:', {
            count: knowledgeBaseResults.length,
            message: userMessage,
            hasDefiniteEnglish: !languageDecision.isIcelandic && languageDecision.confidence === 'high',
            finalLanguage: languageDecision.isIcelandic ? 'is' : 'en'
        });

        // Update conversation memory with current topic
        if (knowledgeBaseResults.length > 0) {
            const mainTopic = knowledgeBaseResults[0].type;
            // Add language info to topic tracking
            context.conversationMemory.addTopic(mainTopic, {
                query: userMessage,
                response: knowledgeBaseResults[0].content,
                language: languageDecision.isIcelandic ? 'is' : 'en'
            });
        }

        // Update context with the current message and language info
        let updatedContext = updateContext(sessionId, userMessage, null, languageDecision); // Pass languageDecision here
        context = {
            ...updatedContext,
            language: languageDecision.isIcelandic ? 'is' : 'en'
        };

        // Add language info to cache key using new language detection
        const cacheKey = `${sessionId}:${userMessage.toLowerCase().trim()}:${languageDecision.isIcelandic ? 'is' : 'en'}`;
        const cached = responseCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('\n📦 Using cached response:', {
                message: userMessage,
                language: languageDecision.isIcelandic ? 'is' : 'en',
                confidence: languageDecision.confidence
            });
           return res.json(cached.response);
       }

        // Keep just this question pattern detection logging (but remove handlers)
        const hasBookingPattern = !languageDecision.isIcelandic ? 
            questionPatterns.booking.en.some(pattern => msg.includes(pattern)) :
            (languageDecision.confidence === 'high' ? 
                questionPatterns.booking.is.some(pattern => msg.includes(pattern)) :
                questionPatterns.booking.en.some(pattern => msg.includes(pattern)));

        const hasQuestionWord = !languageDecision.isIcelandic ?
            questionPatterns.question.en.some(word => msg.includes(word)) :
            (languageDecision.confidence === 'high' ? 
                questionPatterns.question.is.some(word => msg.includes(word)) :
                questionPatterns.question.en.some(word => msg.includes(word)));

        // Enhanced logging for question detection
        console.log('\n❓ Question Pattern Detection:', {
            message: userMessage,
            language: {
                isIcelandic: languageDecision.isIcelandic,
                confidence: languageDecision.confidence,
                reason: languageDecision.reason
            },
            hasBookingPattern,
            hasQuestionWord,
            patterns: {
                booking: hasBookingPattern,
                question: hasQuestionWord,
                detectedLanguage: languageDecision.isIcelandic ? 'is' : 'en'
            }
        });

        // Optional: Simple context setting (no early returns)
        if (knowledgeBaseResults.length === 0 && !hasBookingPattern && !hasQuestionWord) {
            // Set context but DON'T return - just let it flow to ChatGPT
            if (userMessage.split(' ').length <= 4) {
                context.lastTopic = 'acknowledgment';
                console.log('\n👍 Simple acknowledgment detected, but continuing to ChatGPT');
            }
        }

        // Keep just the business topic detection for context (but remove all handlers)
        const isKnownBusinessTopic = userMessage.toLowerCase().includes('lagoon') ||
                                  userMessage.toLowerCase().includes('ritual') ||
                                  userMessage.toLowerCase().includes('package') ||
                                  userMessage.toLowerCase().includes('booking') ||
                                  userMessage.toLowerCase().includes('bóka') ||
                                  userMessage.toLowerCase().includes('panta') ||
                                  userMessage.toLowerCase().includes('pakk') ||
                                  userMessage.toLowerCase().includes('ritúal') ||
                                  userMessage.toLowerCase().includes('swim') ||
                                  userMessage.toLowerCase().includes('pool') ||
                                  userMessage.toLowerCase().includes('water') ||
                                  userMessage.toLowerCase().includes('facilities') ||
                                  userMessage.toLowerCase().includes('discount') ||
                                  userMessage.toLowerCase().includes('offer') ||
                                  userMessage.toLowerCase().includes('deal') ||
                                  userMessage.toLowerCase().includes('price') ||
                                  userMessage.toLowerCase().includes('cost') ||
                                  userMessage.toLowerCase().includes('tíma') ||
                                  userMessage.toLowerCase().includes('stefnumót') ||
                                  userMessage.toLowerCase().includes('hvernig bóka') ||
                                  userMessage.toLowerCase().includes('bóka tíma');

        // Add shouldBeUnknown check
        const shouldBeUnknown = !knowledgeBaseResults.length && !isKnownBusinessTopic;

        // Simplified logging for business topic detection
        console.log('\n🏢 Business Topic Check:', {
            isKnownBusinessTopic,
            shouldBeUnknown,
            hasResults: knowledgeBaseResults.length > 0
        });

        // Optional: Add to context but don't return early
        if (isKnownBusinessTopic) {
            context.isBusinessRelated = true;
        }

        // Group booking context setting
        const groupBookingTerms = ['hóp', 'manna', 'hópabókun', 'group', 'booking for', 'people'];
        if (groupBookingTerms.some(term => userMessage.toLowerCase().includes(term))) {
            // Just set the context topic
            context.lastTopic = 'group_bookings';
            
            // Enhanced logging with complete language detection info
            console.log('\n👥 Group Booking Query Detected:', {
                message: userMessage,
                language: {
                    isIcelandic: languageDecision.isIcelandic,
                    confidence: languageDecision.confidence,
                    reason: languageDecision.reason,
                    patterns: languageDecision.patterns
                }
            });

            // Use the unified broadcast system for tracking (not a user-visible response)
            await sendBroadcastAndPrepareResponse({
                message: 'group_booking_detection',  // Not a response, just tracking the detection
                suppressMessage: true, // Don't actually send a message to the user
                language: {
                    detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence
                },
                topicType: 'group_bookings',
                responseType: 'detection'
            });
            // Continue to normal flow to let GPT handle with knowledge base content
        }

        // Simplified Yes confirmation handling (just sets context, no early return)
        if (userMessage.toLowerCase().trim() === 'yes' && context.lastTopic) {
            console.log('\n👍 "Yes" confirmation detected for topic:', context.lastTopic);
            
            // Set seasonal context if relevant
            if (context.lastTopic === 'seasonal') {
                context.confirmedSeasonalInterest = true;
                context.seasonalContextConfirmed = context.seasonalContext?.type || 'current';
            }
            
            // Add confirmation context but don't return - let ChatGPT handle it
            context.lastConfirmation = {
                topic: context.lastTopic,
                timestamp: Date.now(),
                confirmed: true
            };
        }

        // Hours and dining query detection with forced knowledge base lookup
        if (knowledgeBaseResults.length === 0) {
            const isHoursQuery = userMessage.toLowerCase().includes('hour') || 
                                userMessage.toLowerCase().includes('open') || 
                                userMessage.toLowerCase().includes('close') ||
                                userMessage.toLowerCase().includes('time') ||
                                userMessage.toLowerCase().includes('opin') ||
                                userMessage.toLowerCase().includes('opið') ||
                                userMessage.toLowerCase().includes('lokað') ||
                                userMessage.toLowerCase().includes('lokar') ||
                                userMessage.toLowerCase().includes('opnun') ||
                                userMessage.toLowerCase().includes('lokun') ||
                                userMessage.toLowerCase().includes('í dag') ||
                                userMessage.toLowerCase().includes('á morgun') ||
                                userMessage.toLowerCase().includes('hvenær');

            const isDiningQuery = userMessage.toLowerCase().includes('veitingastað') ||
                                userMessage.toLowerCase().includes('veitingar') ||
                                userMessage.toLowerCase().includes('veitingarstað') ||
                                userMessage.toLowerCase().includes('veitingastaður') ||
                                userMessage.toLowerCase().includes('restaurant') ||
                                userMessage.toLowerCase().includes('food') ||
                                userMessage.toLowerCase().includes('dining') ||
                                userMessage.toLowerCase().includes('matur') ||
                                userMessage.toLowerCase().includes('borða') ||
                                userMessage.toLowerCase().includes('matseðil') ||
                                userMessage.toLowerCase().includes('með veitinga') ||
                                userMessage.toLowerCase().includes('sýna matseðil') ||
                                userMessage.toLowerCase().includes('sýnt mér') ||
                                userMessage.toLowerCase().includes('eruð þið með') ||
                                userMessage.toLowerCase().includes('hafið þið') ||
                                userMessage.toLowerCase().includes('er hægt að fá mat') ||
                                userMessage.toLowerCase().includes('hægt að borða');

            // Force knowledge base lookup for dining/hours queries
            if (isHoursQuery || isDiningQuery) {
                try {
                    // Use language detection with confidence check
                    const results = languageDecision.isIcelandic && languageDecision.confidence === 'high' ? 
                        getRelevantKnowledge_is(userMessage) : 
                        getRelevantKnowledge(userMessage);
                        
                    // Ensure results is an array
                    knowledgeBaseResults = Array.isArray(results) ? results : [];
                    
                    // Set relevant topic in context
                    context.lastTopic = isHoursQuery ? 'hours' : 'dining';

                    // Enhanced debug logging
                    console.log('\n🍽️ Forced Knowledge Base Lookup:', {
                        message: userMessage,
                        isDiningQuery,
                        isHoursQuery,
                        gotResults: knowledgeBaseResults.length > 0
                    });
                } catch (error) {
                    console.error('\n❌ Forced Knowledge Base Error:', error.message);
                    knowledgeBaseResults = []; // Use empty array on error
                }
            }
        }

        // Knowledge base match logging
        console.log('\n📚 Knowledge Base Match:', {
            language: {
                isIcelandic: languageDecision.isIcelandic,
                confidence: languageDecision.confidence,
                reason: languageDecision.reason,
                patterns: languageDecision.patterns
            },
            matches: Array.isArray(knowledgeBaseResults) ? knowledgeBaseResults.length : 0,
            types: Array.isArray(knowledgeBaseResults) ? knowledgeBaseResults.map(k => k.type) : []
        });

        // Confidence score calculation and logging (without early returns)
        const confidenceScore = calculateConfidence(userMessage, knowledgeBaseResults, languageDecision);
        console.log('\n📊 Query Confidence Score:', {
            score: confidenceScore,
            hasKnowledgeResults: knowledgeBaseResults.length > 0,
            isBusinessTopic: isKnownBusinessTopic
        });

        // Flag potential unknown topics but don't return early
        if (!isKnownBusinessTopic && 
            confidenceScore < 0.1 && 
            knowledgeBaseResults.length === 0 && 
            userMessage.split(' ').length > 3 && 
            !userMessage.toLowerCase().startsWith('welcome')) {
            
            console.log('\n⚠️ Potential unknown topic outside of business domain');
            // Set context flag but don't return - let ChatGPT try to handle it
            context.potentiallyUnknownTopic = true;
        }
        
        // Sunset query handling WITH early return (since it provides specialized data)
        if (isSunsetQuery(userMessage, languageDecision)) {
            console.log('\n🌅 Sunset query detected');
            
            // Generate sunset response
            const sunsetResponse = generateSunsetResponse(userMessage, languageDecision);
            
            // Apply brand terminology enforcement
            const formattedResponse = enforceTerminology(sunsetResponse);
            
            // Add appropriate emoji suffix
            const formattedResponseWithEmoji = formattedResponse + " 🌅";
            
            // Log the response
            console.log('\n✅ Providing sunset information:', {
                query: userMessage,
                response: formattedResponseWithEmoji,
                language: {
                    isIcelandic: languageDecision.isIcelandic,
                    confidence: languageDecision.confidence,
                    reason: languageDecision.reason
                }
            });
            
            // Update context with this interaction
            updateContext(sessionId, userMessage, formattedResponseWithEmoji, languageDecision);
            
            // Add to response cache
            responseCache.set(`${sessionId}:${userMessage.toLowerCase().trim()}`, {
                response: {
                    message: formattedResponseWithEmoji,
                    language: {
                        detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                        confidence: languageDecision.confidence,
                        reason: languageDecision.reason
                    }
                },
                timestamp: Date.now()
            });
            
            // Use the unified broadcast system but don't send response yet
            const responseData = await sendBroadcastAndPrepareResponse({
                message: formattedResponseWithEmoji,
                language: {
                    detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence,
                    reason: languageDecision.reason
                },
                topicType: 'sunset',
                responseType: 'direct_response'
            });
            return res.status(responseData.status || 200).json(responseData);
        }      

        // Detect topic for appropriate transitions and follow-ups (KEEP AS IS)
        const { topic } = detectTopic(userMessage, knowledgeBaseResults, context, languageDecision);

        // Enhanced seasonal handling (KEEP COMPLETELY AS IS)
        if (topic === 'seasonal') {
            let seasonalInfo = knowledgeBaseResults.find(k => k.type === 'seasonal_information');
            if (seasonalInfo) {
                // Use new language detection for seasonal terms
                const isWinter = userMessage.toLowerCase().includes('winter') || 
                               userMessage.toLowerCase().includes('northern lights') ||
                               (languageDecision.isIcelandic && (
                                   userMessage.toLowerCase().includes('vetur') ||
                                   userMessage.toLowerCase().includes('vetrar') ||
                                   userMessage.toLowerCase().includes('norðurljós')
                               ));
                               
                // Store previous season if it's changing
                const newType = isWinter ? 'winter' : 'summer';
                               
                if (context.seasonalContext.type && context.seasonalContext.type !== newType) {
                    context.seasonalContext.previousSeason = context.seasonalContext.type;
                    context.seasonalContext.transitionDate = Date.now();
                }

                // Update holiday context if needed
                const currentSeason = getCurrentSeason();
                context.seasonalContext.holidayContext = {
                    isHoliday: currentSeason.season === 'holiday',
                    holidayType: currentSeason.greeting || null,
                    specialHours: currentSeason.season === 'holiday' ? {
                        closing: currentSeason.closingTime,
                        lastRitual: currentSeason.lastRitual,
                        barClose: currentSeason.barClose,
                        lagoonClose: currentSeason.lagoonClose
                    } : null
                };

                // Update the main seasonal context
                context.seasonalContext = {
                    ...context.seasonalContext,
                    type: newType,
                    subtopic: userMessage.toLowerCase().includes('northern lights') ? 'northern_lights' : 
                             userMessage.toLowerCase().includes('midnight sun') ? 'midnight_sun' : 'general',
                    currentInfo: seasonalInfo.content,
                    language: {
                        isIcelandic: languageDecision.isIcelandic,
                        confidence: languageDecision.confidence
                    }
                };

                console.log('\n🌍 Seasonal Context Updated:', {
                    newSeason: newType,
                    previousSeason: context.seasonalContext.previousSeason,
                    holiday: context.seasonalContext.holidayContext,
                    language: {
                        isIcelandic: languageDecision.isIcelandic,
                        confidence: languageDecision.confidence,
                        reason: languageDecision.reason
                    },
                    transitionDate: context.seasonalContext.transitionDate ? 
                        new Date(context.seasonalContext.transitionDate).toLocaleString() : null
                });
            }
        }

        // Check if this is an hours-related query
        const isHoursQuery = userMessage.toLowerCase().includes('hour') || 
                           userMessage.toLowerCase().includes('open') || 
                           userMessage.toLowerCase().includes('close') ||
                           userMessage.toLowerCase().includes('time') ||
                           // Add these Icelandic patterns
                           userMessage.toLowerCase().includes('opin') ||
                           userMessage.toLowerCase().includes('opið') ||
                           userMessage.toLowerCase().includes('lokað') ||
                           userMessage.toLowerCase().includes('lokar') ||
                           userMessage.toLowerCase().includes('opnun') ||
                           userMessage.toLowerCase().includes('lokun') ||
                           userMessage.toLowerCase().includes('í dag') ||  // "today" often used with hours
                           userMessage.toLowerCase().includes('á morgun');  // "tomorrow" often used with hours

        // Detect topic and get initial transitions
        let topicResult = detectTopic(userMessage, knowledgeBaseResults, context, languageDecision);

        // Simplified first-time message handling (no early return)
        if (!context.conversationStarted) { 
            context.conversationStarted = true;
            console.log('\n👋 Setting conversation started flag for first-time message');
            // No return - continue to ChatGPT
        }

        // Force hours topic if it's an hours query
        if (isHoursQuery) {
            topicResult = {
                topic: 'hours'
            };
            const seasonInfo = getCurrentSeason();
            context.operatingHours = seasonInfo;
        }

        // Enhanced system prompt with all context - MODIFIED TO PASS LANGUAGE
        let systemPrompt = getSystemPrompt(sessionId, isHoursQuery, userMessage, {
            ...languageDecision,
            language: language // Pass explicit language code
        });

        // Get current season information
        const seasonInfo = getCurrentSeason();
        
        // Add seasonal context to prompt if relevant
        if (topic === 'hours' || topic === 'seasonal' || userMessage.toLowerCase().includes('hour') || 
            userMessage.toLowerCase().includes('open') || userMessage.toLowerCase().includes('close')) {
            systemPrompt += `\n\nCURRENT OPERATING HOURS:
            Today (${seasonInfo.greeting}):
            Opening Hours: ${seasonInfo.season === 'summer' ? '09:00' : 
                          seasonInfo.season === 'winter' ? '11:00 weekdays, 10:00 weekends' : '10:00'}
            Closing Time: ${seasonInfo.closingTime}
            Last Ritual: ${seasonInfo.lastRitual}
            Bar Service Until: ${seasonInfo.barClose}
            Lagoon Access Until: ${seasonInfo.lagoonClose}
            
            Please include these specific times in your response.`;
        }

        // Sync new context system with old context before generating response
        syncContextSystems(context, newContext);
        
        // Prepare messages array
        const messages = [
            { 
                role: "system", 
                content: systemPrompt
            }
        ];

        // Add context awareness
        if (context.messages && context.messages.length > 0) {
            messages.push(...context.messages.slice(-5));
        }

        if (context?.lateArrivalScenario || context?.bookingModification?.requested) {
            messages.push({
                role: "system",
                content: `CURRENT CONTEXT:
                    Language: ${languageDecision.isIcelandic ? 'Icelandic' : 'English'}
                    Late Arrival: ${context.lateArrivalScenario ? JSON.stringify(context.lateArrivalScenario) : 'No'}
                    Sold Out Status: ${context.soldOutStatus ? 'Yes' : 'No'}
                    Booking Modification: ${context.bookingModification?.requested ? 'Requested' : 'No'}
                    Time of Day: ${new Date().getHours() >= 9 && new Date().getHours() < 19 ? 'During support hours' : 'After hours'}`
            });
        }

        // ADD THIS NEW PART: Additional context message for likely conversational messages
        if (userMessage.split(' ').length <= 4 || 
            /^(hi|hello|hey|hæ|halló|thanks|takk|ok|how are you|who are you)/i.test(userMessage)) {
            
            messages.push({
                role: "system",
                content: `This appears to be a conversational message rather than a factual question. Handle it naturally with appropriate small talk, greeting, or acknowledgment responses while maintaining Sky Lagoon's brand voice.`
            });
        }

        // MODIFY THIS PART: Updated user message to include language instructions
        messages.push({
            role: "user",
            content: `Knowledge Base Information: ${JSON.stringify(knowledgeBaseResults)}
                
                User Question: ${userMessage}
                
                Please provide a natural, conversational response. For factual information about Sky Lagoon, use ONLY the information from the knowledge base.
                For greetings, small talk, or acknowledgments, respond naturally without requiring knowledge base information.
                
                Maintain our brand voice and use "our" instead of "the" when referring to facilities and services.
                Response MUST be in ${language} language.`
        });

        // Make GPT-4 request with retries
        let attempt = 0;
        let completion;
        while (attempt < MAX_RETRIES) {
            try {
                completion = await openai.chat.completions.create({
                    model: "gpt-4-1106-preview",
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: getMaxTokens(userMessage)
                });
                break;
            } catch (error) {
                attempt++;
                console.error(`OpenAI request failed (Attempt ${attempt}/${MAX_RETRIES}):`, {
                    error: error.message,
                    status: error.response?.status,
                    attempt: attempt,
                    maxRetries: MAX_RETRIES
                });

                if (attempt === MAX_RETRIES) {
                    throw new Error(`Failed after ${MAX_RETRIES} attempts: ${error.message}`);
                }

                const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
                console.log(`⏳ Retrying in ${delay}ms... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        // If we get here, we have a successful completion
        if (!completion) {
            throw new Error('Failed to get completion after retries');
        }

        // Use the unified broadcast system for the GPT response
        let postgresqlMessageId = null;
        if (completion && req.body.message) {
            // Create an intermediate response object that sendBroadcastAndPrepareResponse will use
            const responseObj = {
                message: completion.choices[0].message.content,
                language: {
                    detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence,
                    reason: languageDecision.reason
                },
                topicType: context?.lastTopic || 'general',
                responseType: 'gpt_response'
            };
            
            // We'll pass this through sendBroadcastAndPrepareResponse to broadcast without responding yet
            const result = await sendBroadcastAndPrepareResponse(responseObj);
            
            // Extract the PostgreSQL ID if available from the result
            postgresqlMessageId = result.postgresqlMessageId || null;
            
            console.log('\n📊 PostgreSQL message ID:', postgresqlMessageId || 'Not available');
        }

        const response = completion.choices[0].message.content;
        console.log('\n🤖 GPT Response:', response);

        // Also add AI response to the new context system
        addMessageToContext(newContext, { role: 'assistant', content: response });

        // Apply terminology enhancement
        const enhancedResponse = enforceTerminology(response);
            
        console.log('\n✨ Enhanced Response:', enhancedResponse);

        // Update assistant message in new context with enhanced response
        addMessageToContext(newContext, { role: 'assistant', content: enhancedResponse });

        // Remove any non-approved emojis
        const approvedEmojis = SKY_LAGOON_GUIDELINES.emojis;
        const filteredResponse = enhancedResponse.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{2600}-\u{26FF}]/gu, (match) => {
            return approvedEmojis.includes(match) ? match : '';
        });

        console.log('\n🧹 Emoji Filtered Response:', filteredResponse);

        // Cache the response with new language system
        responseCache.set(cacheKey, {
            response: {
                message: enhancedResponse,
                postgresqlMessageId: postgresqlMessageId, // Add PostgreSQL ID to cache
                language: {
                    detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence,
                    reason: languageDecision.reason
                }
            },
            timestamp: Date.now()
        });

        // Update conversation context with new language system
        context.lastInteraction = Date.now();
        context.language = languageDecision.isIcelandic ? 'is' : 'en';
        conversationContext.set(sessionId, context);

        // MODIFY THE RESPONSE: Include language in the response
        return res.status(200).json({
            message: enhancedResponse,
            postgresqlMessageId: postgresqlMessageId, // Add PostgreSQL ID to response
            language: {
                detected: language,
                isIcelandic: languageDecision.isIcelandic,
                confidence: languageDecision.confidence,
                reason: languageDecision.reason
            }
        });

    } catch (error) {
        console.error('\n❌ Error Details:', {
            message: error.message,
            stack: error.stack,
            type: error.constructor.name,
            timestamp: new Date().toISOString()
        });

        const errorMessage = "I apologize, but I'm having trouble connecting right now. Please try again shortly.";

        // Get language using new detection system
        const userMsg = req.body?.message || req.body?.question || '';
        const errorLanguageDecision = newDetectLanguage(userMsg, context);

        // Enhanced error logging
        console.log('\n🚨 Error Language Detection:', {
            message: userMsg,
            language: {
                isIcelandic: errorLanguageDecision.isIcelandic,
                confidence: errorLanguageDecision.confidence,
                reason: errorLanguageDecision.reason
            }
        });

        // Use the unified broadcast system but don't send response yet
        await sendBroadcastAndPrepareResponse({
            message: errorMessage,
            status: 500,
            language: {
                detected: errorLanguageDecision.language || (errorLanguageDecision.isIcelandic ? 'Icelandic' : 'English'),
                confidence: errorLanguageDecision.confidence
            },
            topicType: 'error',
            responseType: 'error_response'
        });
        
        // Send error response separately to ensure it reaches the client
        return res.status(500).json({
            message: errorMessage,
            language: {
                detected: errorLanguageDecision.language || (errorLanguageDecision.isIcelandic ? 'Icelandic' : 'English'),
                confidence: errorLanguageDecision.confidence
            }
        });
    }
});

// Feedback endpoint - Add this right after your main chat endpoint.
//app.post('/chat/feedback', async (req, res) => {
//    try {
//      const { messageId, isPositive, messageContent, timestamp, chatId, language } = req.body;
//      
//      console.log('\n📝 /chat/feedback endpoint CALLED with:', {
//        messageId,
//        isPositive,
//        chatId,
//        language
//      });
//      
//      // Determine message type
//      const messageType = determineMessageType(messageContent, language);
//      
//      // Store feedback in your database with message type
//      await db.collection('message_feedback').insertOne({
//        messageId,
//        isPositive,
//        messageContent,
//        messageType,
//        timestamp: new Date(timestamp),
//        chatId,
//        language,
//        createdAt: new Date()
//      });
//      
//      console.log('\n💾 Feedback saved to MongoDB, now broadcasting...');
//      
//      // Always call broadcastFeedback - this is critical!
//      const broadcastResult = await broadcastFeedback(
//        messageId, 
//        isPositive, 
//        messageContent, 
//        chatId, 
//        language
//     );
//      
//      console.log('\n📣 Broadcast result:', broadcastResult ? 'Success' : 'Failed');
//      
//      return res.status(200).json({
//        success: true,
//        message: 'Feedback received and broadcast',
//        messageType: messageType,
//        broadcastSuccess: broadcastResult
//      });
//    } catch (error) {
//      console.error('\n❌ Error in /chat/feedback endpoint:', error);
//      
//      return res.status(500).json({
//        success: false,
//        message: 'Failed to process feedback'
//      });
//    }
//});

// =====================================================================
// HELPER FUNCTIONS FOR FEEDBACK PROCESSING.
// =====================================================================

/**
 * Find the PostgreSQL ID for a MongoDB message ID by calling the analytics API
 * @param {string} mongoDbId - The MongoDB ID (e.g., bot-msg-1741308335605)
 * @returns {Promise<string|null>} - The PostgreSQL ID or null if not found
 */
async function findPostgresqlIdForMessage(mongoDbId) {
  try {
    console.log(`🔍 Looking up mapping for MongoDB ID: ${mongoDbId}`);
    
    // Call the analytics API to look up the mapping
    const response = await fetch(`https://hysing.svorumstrax.is/api/message-mapping?mongodbId=${encodeURIComponent(mongoDbId)}`, {
      headers: {
        'x-api-key': 'sky-lagoon-secret-2024'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ Failed to fetch mapping: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.success && data.postgresqlId) {
      console.log(`✅ Found PostgreSQL ID: ${data.postgresqlId}${data.newMapping ? ' (new mapping created)' : ''}`);
      return data.postgresqlId;
    } else {
      console.log(`❌ No PostgreSQL ID found: ${data.error || 'Unknown reason'}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error finding PostgreSQL ID: ${error}`);
    console.error(`Stack trace: ${error.stack}`);
    return null;
  }
}

// Keep your /feedback endpoint for MongoDB storage
app.post('/feedback', verifyApiKey, async (req, res) => {
    try {
      let { messageId, isPositive, messageContent, timestamp, chatId, language, postgresqlId } = req.body;
      
      // If no PostgreSQL ID is provided, try to find one
      if (!postgresqlId && messageId) {
        console.log(`🔍 No PostgreSQL ID provided, attempting to find match for: ${messageId}`);
        postgresqlId = await findPostgresqlIdForMessage(messageId);
        
        if (postgresqlId) {
          console.log(`✅ Found PostgreSQL ID: ${postgresqlId} for MongoDB ID: ${messageId}`);
        } else {
          console.log(`⚠️ Could not find PostgreSQL ID for MongoDB ID: ${messageId}`);
        }
      }
      
      // Determine message type
      const messageType = determineMessageType(messageContent, language);
      
      console.log('\n📝 Feedback received for storage:', {
        messageId,
        postgresqlId, // Log the PostgreSQL ID (may be null)
        isPositive,
        messageType
      });
      
      // Connect to MongoDB  
      const { db } = await connectToDatabase();
      
      // Store feedback in MongoDB with PostgreSQL ID reference
      await db.collection('message_feedback').insertOne({
        messageId,
        postgresqlId, // Store the PostgreSQL ID reference (may be null)
        isPositive,
        messageContent,
        messageType,
        timestamp: new Date(timestamp),
        chatId,
        language,
        createdAt: new Date()
      });
      
      console.log('💾 Feedback saved to MongoDB');

      // Forward feedback to analytics system
      try {
        console.log('📤 Forwarding feedback to analytics system');
        
        const analyticsResponse = await fetch('https://hysing.svorumstrax.is/api/public-feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messageId: messageId,
            postgresqlId: postgresqlId, // Include the PostgreSQL ID (may be null)
            rating: isPositive, // Field name expected by analytics
            comment: messageContent,
            messageType: messageType
          })
        });  
        
        const responseText = await analyticsResponse.text();
        
        if (analyticsResponse.ok) {
          console.log('✅ Feedback successfully forwarded to analytics');
        } else {
          console.error('❌ Error from analytics:', responseText);
        }
      } catch (forwardError) {
        console.error('❌ Error forwarding feedback:', forwardError);
        // We don't fail the request if forwarding fails
      }
      
      return res.status(200).json({
        success: true,
        message: 'Feedback stored successfully',
        messageType: messageType
      });
    } catch (error) {
      console.error('\n❌ Error storing feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to store feedback'
      });
    }
});

// Add this helper function right after the feedback endpoint
function determineMessageType(content, language) {
    // Ensure we have content to analyze
    if (!content) return 'unknown';
    
    // Convert to lowercase for easier pattern matching
    const lowerContent = content.toLowerCase();
    const isIcelandic = language === 'is';
    
    // Check for patterns that indicate message type
    if (lowerContent.includes('opening hour') || lowerContent.includes('close') || 
        lowerContent.includes('open') || 
        (isIcelandic && (lowerContent.includes('opnunartím') || lowerContent.includes('lokunartím')))) {
      return 'hours';
    }
    
    if (lowerContent.includes('price') || lowerContent.includes('cost') || lowerContent.includes('fee') || 
        (isIcelandic && (lowerContent.includes('verð') || lowerContent.includes('gjald')))) {
      return 'pricing';
    }
    
    if (lowerContent.includes('ritual') || lowerContent.includes('skjól') || 
        lowerContent.includes('treatment') || 
        (isIcelandic && lowerContent.includes('meðferð'))) {
      return 'ritual';
    }
    
    if (lowerContent.includes('package') || lowerContent.includes('bundle') ||
        (isIcelandic && (lowerContent.includes('pakki') || lowerContent.includes('pakka')))) {
      return 'packages';
    }
    
    if (lowerContent.includes('transport') || lowerContent.includes('bus') || 
        lowerContent.includes('get to') || lowerContent.includes('arrive') ||
        (isIcelandic && (lowerContent.includes('strætó') || lowerContent.includes('komast')))) {
      return 'transportation';
    }
    
    if (lowerContent.includes('restaurant') || lowerContent.includes('food') || 
        lowerContent.includes('eat') || lowerContent.includes('drink') ||
        (isIcelandic && (lowerContent.includes('matur') || lowerContent.includes('veitinga')))) {
      return 'dining';
    }
    
    if (lowerContent.includes('locker') || lowerContent.includes('changing') || 
        lowerContent.includes('shower') || lowerContent.includes('amenities') ||
        (isIcelandic && (lowerContent.includes('skáp') || lowerContent.includes('sturtu')))) {
      return 'facilities';
    }
    
    if (lowerContent.includes('booking') || lowerContent.includes('reservation') || 
        lowerContent.includes('cancel') || 
        (isIcelandic && (lowerContent.includes('bókun') || lowerContent.includes('pöntun')))) {
      return 'booking';
    }
    
    if (lowerContent.includes('northern light') || lowerContent.includes('midnight sun') ||
        (isIcelandic && (lowerContent.includes('norðurljós') || lowerContent.includes('miðnætursól')))) {
      return 'natural_phenomena';
    }
    
    if (lowerContent.includes('weather') || lowerContent.includes('cold') || 
        lowerContent.includes('rain') || lowerContent.includes('snow') ||
        (isIcelandic && (lowerContent.includes('veður') || lowerContent.includes('rigning')))) {
      return 'weather';
    }
    
    if (lowerContent.includes('towel') || lowerContent.includes('swimsuit') || 
        lowerContent.includes('bring') || lowerContent.includes('need to') ||
        (isIcelandic && (lowerContent.includes('handklæði') || lowerContent.includes('sundföt')))) {
      return 'items_needed';
    }
    
    // Default category for messages that don't fit specific patterns
    return 'general';
}

// =====================================================================
// FEEDBACK PUSHER ENDPOINT
// =====================================================================
// This endpoint triggers Pusher events for feedback, which are listened for
// by the analytics system through the WebSocketContext
// =====================================================================
// app.post('/feedback-pusher', verifyApiKey, async (req, res) => {
//    try {
//        const feedbackData = req.body;
//        console.log('Feedback pusher event received:', feedbackData);
//
//        // Trigger the Pusher event for the feedback
//        pusher.trigger('chat-channel', 'feedback_event', feedbackData);
//        console.log('Feedback sent to Pusher');
//
//        res.status(200).json({ success: true });
//    } catch (error) {
//        console.error('Error processing feedback event:', error);
//        res.status(500).json({ error: 'Failed to process feedback' });
//    }
// });

// Pusher broadcast function with enhanced language detection
function handleConversationUpdate(conversationData, languageInfo) {
  try {
    console.log('🚀 Broadcasting conversation via Pusher:', {
      event: 'conversation-update',
      channel: 'chat-channel',
      data: {
        ...conversationData,
        language: languageInfo
      },
      timestamp: new Date().toISOString()
    });
    
    // Ensure consistent message format for all downstream systems
    const normalizedData = normalizeConversationData(conversationData);
    
    // STEP 1: Continue broadcasting via Pusher for real-time updates
    const pusherPromise = pusher.trigger('chat-channel', 'conversation-update', normalizedData)
      .then(() => {
        console.log('✅ Pusher message sent successfully');
        return true;
      })
      .catch(error => {
        console.error('❌ Pusher error:', error);
        console.log('Environment check:', {
          hasAppId: !!process.env.PUSHER_APP_ID,
          hasKey: !!process.env.PUSHER_KEY,
          hasSecret: !!process.env.PUSHER_SECRET,
          hasCluster: !!process.env.PUSHER_CLUSTER
        });
        // Don't throw the error, instead return false so other methods can continue
        return false;
      });
    
    // DEBUG: Log the normalized data being passed to other functions
    console.log('🔍 normalizedData for MongoDB/Analytics:', {
      id: normalizedData?.id,
      hasMessages: !!normalizedData?.messages?.length,
      messageCount: normalizedData?.messages?.length || 0
    });
    
    // STEP 2: Save to MongoDB directly
    const dbPromise = saveConversationToMongoDB(normalizedData, languageInfo);
    
    // STEP 3: Send directly to Analytics API
    const apiPromise = sendConversationToAnalytics(normalizedData, languageInfo);
    
    // Wait for all operations to complete but don't fail if one fails
    return Promise.all([pusherPromise, dbPromise, apiPromise])
        .then(results => {
            // Check if we got a PostgreSQL ID from the analytics API
            const analyticsResult = results[2]; // This is the result from sendConversationToAnalytics
            
            // Extract PostgreSQL ID if available
            const postgresqlId = analyticsResult && 
                                 analyticsResult.postgresqlId ? 
                                 analyticsResult.postgresqlId : null;
            
            // Return both success status and PostgreSQL ID
            return { 
                success: results.some(r => r === true || (r && r.success === true)), 
                postgresqlId: postgresqlId 
            };
        });
      
  } catch (error) {
    console.error('❌ Error in handleConversationUpdate:', error);
    return Promise.resolve({ success: false, postgresqlId: null });
  }
}

/**
 * Normalize conversation data to ensure consistent format
 * @param {Object} data - Original conversation data
 * @returns {Object} - Normalized conversation data
 */
function normalizeConversationData(data) {
  // Create a deep copy so we don't modify the original
  const normalized = JSON.parse(JSON.stringify(data));
  
  // Ensure messages array exists
  if (!normalized.messages || !Array.isArray(normalized.messages)) {
    normalized.messages = [];
    
    // Convert legacy format to messages array if needed
    if (normalized.userMessage) {
      normalized.messages.push({
        id: normalized.userMessageId || `user-msg-${Date.now()}`,
        content: normalized.userMessage,
        role: 'user',
        sender: 'user',
        timestamp: normalized.timestamp || new Date().toISOString()
      });
    }
    
    if (normalized.botResponse) {
      // Ensure bot message has timestamp 1ms after user message for order
      const botTimestamp = normalized.timestamp 
        ? new Date(new Date(normalized.timestamp).getTime() + 1).toISOString() 
        : new Date().toISOString();
        
      normalized.messages.push({
        id: normalized.botMessageId || `bot-msg-${Date.now()}`,
        content: normalized.botResponse,
        role: 'assistant',
        sender: 'bot',
        timestamp: botTimestamp
      });
    }
  }
  
  // IMPROVED ROLE/SENDER CONSISTENCY: 
  // This new logic more reliably identifies message types based on multiple signals
  normalized.messages = normalized.messages.map((msg, index) => {
    // First, determine message type based on existing explicit roles/senders
    let isUserMessage = false;
    let isAssistantMessage = false;
    
    // Check explicit role/sender values first (these are most reliable)
    if (msg.role === 'user' || msg.sender === 'user') {
      isUserMessage = true;
    } else if (msg.role === 'assistant' || msg.sender === 'bot') {
      isAssistantMessage = true;
    } 
    // If no explicit role/sender, use position as a fallback
    else {
      // In conversation sequence, even indices are typically user messages in most chat systems
      isUserMessage = index % 2 === 0;
      isAssistantMessage = !isUserMessage;
    }
    
    // Always enforce completely consistent role and sender pairs
    // This ensures they never get out of sync
    return {
      id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      content: msg.content || '',
      // Always set both role and sender to matching values
      role: isUserMessage ? 'user' : 'assistant',
      sender: isUserMessage ? 'user' : 'bot',
      // Ensure timestamps maintain sequence
      timestamp: msg.timestamp || new Date(Date.now() + index).toISOString()
    };
  });
  
  return normalized;
}

/**
 * Save conversation data directly to MongoDB.
 * 
 * Stores a local copy of conversation data in MongoDB for backup and redundancy.
 * This ensures data persistence even if the analytics API call fails.
 * 
 * @param {Object} conversationData - The conversation data including messages
 * @param {Object} languageInfo - Information about detected language
 * @returns {Promise<boolean>} - True if save was successful, false otherwise
 */
async function saveConversationToMongoDB(conversationData, languageInfo) {
    try {
        // Connect to MongoDB
        const { db } = await connectToDatabase();
        
        // Prepare conversation document for MongoDB
        const conversationDoc = {
            ...conversationData,
            languageInfo,
            createdAt: new Date(),
            savedDirectly: true // Flag to indicate direct save
        };
        
        // Save to a conversations collection
        await db.collection('conversations').insertOne(conversationDoc);
        
        console.log('💾 Conversation saved directly to MongoDB:', conversationData.id);
        return true;
    } catch (error) {
        console.error('❌ Error saving conversation to MongoDB:', error);
        return false;
    }
}

/**
 * Send conversation data to analytics system
 * 
 * Makes a direct HTTP POST request to the analytics API with conversation data.
 * Uses a persistent MongoDB session for conversation continuity.
 * 
 * @param {Object} conversationData - The conversation data including user and bot messages
 * @param {Object} languageInfo - Information about detected language
 * @returns {Promise<{success: boolean, postgresqlId: string|null}>} - Success status and PostgreSQL ID
 */
async function sendConversationToAnalytics(conversationData, languageInfo) {
  try {
    // Add stack trace to see where this function is being called from
    const stackTrace = new Error().stack;
    console.log('📤 Sending conversation to analytics system FROM:', stackTrace);
    console.log('📦 Conversation data check:', {
      hasData: !!conversationData,
      hasId: !!conversationData?.id,
      hasMessages: !!conversationData?.messages?.length,
      messageCount: conversationData?.messages?.length || 0
    });
    
    // CRITICAL FIX: Add validation for conversation data
    if (!conversationData || !conversationData.id) {
      console.error('❌ Cannot send undefined conversation data - SKIPPING');
      return { success: false, postgresqlId: null };
    }

    // DEDUPLICATION CHECK: Create a signature for this specific message set
    const botMessages = conversationData.messages ? 
                        conversationData.messages.filter(m => m.role === 'assistant' || m.sender === 'bot') : 
                        [];
    
    if (botMessages.length > 0) {
      // Create signature from bot message content + timestamps
      const messageSignature = botMessages.map(m => 
        `${m.content?.substring(0, 50)}-${m.timestamp}`
      ).join('|');
      
      // Check if we've already sent this exact set of bot messages
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

    // Extract the frontend session ID from the request context
    if (!conversationData.sessionId) {
      // Try to find the session ID in various places
      const sessionId = conversationData.sessionId || 
                        conversationData.chatId || 
                        (conversationData.req && conversationData.req.session && conversationData.req.session.id);
      
      if (sessionId) {
        conversationData.sessionId = sessionId;
      } else {
        console.log('ℹ️ No session ID found in conversation data');
      }
    }

    // Get persistent session from MongoDB - now passing the conversation data
    let sessionInfo;
    try {
      sessionInfo = await getOrCreateSession(conversationData);
      
      // CRITICAL FIX: Validate session info
      if (!sessionInfo || !sessionInfo.conversationId || !sessionInfo.sessionId) {
        console.error('❌ Invalid session information:', sessionInfo);
        // Generate new valid IDs if missing
        sessionInfo = {
          conversationId: uuidv4(),
          sessionId: uuidv4(),
          startedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        };
        console.log('🔄 Generated new session info due to invalid data');
      }
    } catch (sessionError) {
      console.error('❌ Error getting session:', sessionError);
      // Fallback to generating new IDs
      sessionInfo = {
        conversationId: uuidv4(),
        sessionId: uuidv4(),
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
      console.log('🔄 Generated fallback session info due to error');
    }
    
    // Transform messages array to analytics format
    const analyticsMessages = conversationData.messages && conversationData.messages.length > 0 
      ? conversationData.messages.map(msg => ({
          id: msg.id, // Include message ID for later reference
          content: msg.content || "",
          role: msg.role || (msg.sender === 'user' ? 'user' : 'assistant'),
          language: conversationData.language || 'en',
          timestamp: msg.timestamp || new Date().toISOString()
        }))
      : [
          // Legacy format fallback
          {
            content: conversationData.userMessage || "No message content",
            role: 'user',
            language: conversationData.language || 'en',
            timestamp: conversationData.timestamp || new Date().toISOString()
          },
          {
            content: conversationData.botResponse || "No response content",
            role: 'assistant',
            language: conversationData.language || 'en',
            timestamp: new Date().toISOString()
          }
        ];
    
    // Log the payload being sent to the analytics API
    console.log('📤 Sending payload to analytics API:', {
      id: sessionInfo.conversationId,
      sessionId: sessionInfo.sessionId,
      messageCount: analyticsMessages.length,
      topic: conversationData.topic || 'general'
    });
    
    const analyticsResponse = await fetch('https://hysing.svorumstrax.is/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'sky-lagoon-secret-2024'
      },
      body: JSON.stringify({
        // Use the consistent session IDs with validation
        id: sessionInfo.conversationId,
        sessionId: sessionInfo.sessionId,
        clientId: 'sky-lagoon',
        topic: conversationData.topic || 'general',
        status: 'active',
        responseTime: 0,
        startedAt: sessionInfo.startedAt,
        endedAt: new Date().toISOString(),
        messages: analyticsMessages
      })
    });
    
    // Store the PostgreSQL message IDs for future feedback correlation
    if (analyticsResponse.ok) {
      try {
        const responseData = await analyticsResponse.json();
        
        // Log response structure for debugging
        console.log(`📦 Analytics API response structure: ${typeof responseData} with keys: ${responseData ? Object.keys(responseData).join(', ') : 'none'}`);
        
        // If we get back PostgreSQL IDs, store mappings for them
        let botMessagePostgresqlId = null;

        if (responseData && responseData.messages && Array.isArray(responseData.messages)) {
            console.log('✅ Received message IDs from analytics:', responseData.messages.length);
            
            // Connect to MongoDB
            const { db } = await connectToDatabase();
            
            // Store mappings for each message
            for (let i = 0; i < responseData.messages.length; i++) {
                const pgMessage = responseData.messages[i];
                const originalMessage = conversationData.messages && i < conversationData.messages.length ? 
                                       conversationData.messages[i] : null;
                
                if (pgMessage && pgMessage.id) {
                    console.log(`🔄 Processing PostgreSQL message: ${pgMessage.id} (role: ${pgMessage.role || 'unknown'})`);
                    
                    if (originalMessage && originalMessage.id) {
                        // Store mapping between MongoDB ID and PostgreSQL ID
                        await db.collection('message_id_mappings').insertOne({
                            mongodbId: originalMessage.id,
                            postgresqlId: pgMessage.id,
                            content: originalMessage.content || '',
                            createdAt: new Date()
                        });
                        
                        console.log(`✅ Created ID mapping: ${originalMessage.id} -> ${pgMessage.id}`);
                    } else {
                        console.log(`⚠️ No matching original message for PostgreSQL ID: ${pgMessage.id}`);
                    }
                    
                    // Capture the PostgreSQL ID for bot messages
                    const isBot = pgMessage.role === 'assistant' || 
                                 (originalMessage && (originalMessage.role === 'assistant' || originalMessage.sender === 'bot'));
                                 
                    if (isBot) {
                        botMessagePostgresqlId = pgMessage.id;
                        console.log(`🤖 Found bot message PostgreSQL ID: ${botMessagePostgresqlId}`);
                    }
                }
            }
            
            // RECORD THIS MESSAGE SET AS PROCESSED to prevent future duplicates
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
        } else {
            console.log('⚠️ Response does not contain messages array or has unexpected format');
            if (responseData) {
                console.log('📊 Response data sample:', 
                           JSON.stringify(responseData).substring(0, 300) + 
                           (JSON.stringify(responseData).length > 300 ? '...' : ''));
            }
        }

        console.log('✅ Conversation successfully sent to analytics system');
        return { success: true, postgresqlId: botMessagePostgresqlId };

      } catch (parseError) {
        console.error('❌ Error parsing analytics response:', parseError);
        console.log('✅ Conversation sent, but could not parse response');
        return { success: true, postgresqlId: null }; // Still return success since the conversation was sent
      }
    } else {
      const responseText = await analyticsResponse.text();
      console.error('❌ Error from analytics system:', responseText);
      return { success: false, postgresqlId: null };
    }
  } catch (error) {
    console.error('❌ Error sending conversation to analytics system:', error);
    console.error('❌ Stack trace:', error.stack);
    return { success: false, postgresqlId: null };
  }
}

// Add this right near the handleConversationUpdate function (possibly unused currently - handleFeedbackUpdate is declared but it's value is never read)
function handleFeedbackUpdate(feedbackData) {
    try {
        console.log('🚀 Broadcasting feedback via Pusher:', {
            event: 'feedback_event',
            channel: 'chat-channel',
            data: feedbackData,
            timestamp: new Date().toISOString()
        });
        
        return pusher.trigger('chat-channel', 'feedback_event', feedbackData)
            .then(() => {
                console.log('✅ Feedback Pusher message sent successfully');
                return true;
            })
            .catch(error => {
                console.error('❌ Pusher error in feedback:', error);
                console.log('Environment check:', {
                    hasAppId: !!process.env.PUSHER_APP_ID,
                    hasKey: !!process.env.PUSHER_KEY,
                    hasSecret: !!process.env.PUSHER_SECRET,
                    hasCluster: !!process.env.PUSHER_CLUSTER
                });
                throw error;
            });
    } catch (error) {
        console.error('❌ Error in handleFeedbackUpdate:', error);
        return Promise.resolve(false);
    }
}

// Helper function to detect topic with enhanced language detection
const detectTopic = (message, knowledgeBaseResults, context, languageDecision) => {
    // Defensive check for knowledgeBaseResults
    if (!knowledgeBaseResults || !Array.isArray(knowledgeBaseResults)) {
        console.error('❌ detectTopic received invalid knowledgeBaseResults:', knowledgeBaseResults);
        knowledgeBaseResults = []; // Default to empty array
    }   
    const msg = message.toLowerCase();
    let topic = null;
    let transition = null;
    
    // Check previous topic from context
    const previousTopic = context?.lastTopic;
    
    // Detect current topic with new language detection
    const isIcelandic = languageDecision?.isIcelandic || false;
    
    // Detect current topic with language awareness
    if (matchesWholeWord(msg, 'package') || matchesWholeWord(msg, 'sér') || matchesWholeWord(msg, 'saman') || 
        (isIcelandic && matchesWholeWord(msg, 'pakki'))) {
        topic = 'packages';
    } else if (matchesWholeWord(msg, 'ritual') || matchesWholeWord(msg, 'skjol') || matchesWholeWord(msg, 'skjól') ||
               (isIcelandic && matchesWholeWord(msg, 'meðferð'))) {
        topic = 'ritual';
    } else if (matchesWholeWord(msg, 'transport') || matchesWholeWord(msg, 'bus') || matchesWholeWord(msg, 'drive') ||
               (isIcelandic && (matchesWholeWord(msg, 'strætó') || matchesWholeWord(msg, 'keyra')))) {
        topic = 'transportation';
    } else if (matchesWholeWord(msg, 'facilities') || matchesWholeWord(msg, 'changing') || matchesWholeWord(msg, 'amenities') ||
               (isIcelandic && (matchesWholeWord(msg, 'aðstaða') || matchesWholeWord(msg, 'búningsklefar')))) {
        topic = 'facilities';
    } else if (matchesWholeWord(msg, 'winter') || msg.includes('northern lights') ||
               (isIcelandic && (matchesWholeWord(msg, 'vetur') || msg.includes('norðurljós')))) {
        topic = 'seasonal';
        if (context) {
            context.seasonalContext = {
                type: 'winter',
                subtopic: msg.includes('northern lights') || msg.includes('norðurljós') ? 'northern_lights' : 'general',
                language: {
                    isIcelandic: languageDecision.isIcelandic,
                    confidence: languageDecision.confidence
                }
            };
        }
    } else if (matchesWholeWord(msg, 'summer') || msg.includes('midnight sun') ||
               (isIcelandic && (matchesWholeWord(msg, 'sumar') || msg.includes('miðnætursól')))) {
        topic = 'seasonal';
        if (context) {
            context.seasonalContext = {
                type: 'summer',
                subtopic: msg.includes('midnight sun') || msg.includes('miðnætursól') ? 'midnight_sun' : 'general',
                language: {
                    isIcelandic: languageDecision.isIcelandic,
                    confidence: languageDecision.confidence
                }
            };
        }
    } else if (matchesWholeWord(msg, 'dining') || matchesWholeWord(msg, 'food') || matchesWholeWord(msg, 'restaurant') ||
               (isIcelandic && (matchesWholeWord(msg, 'matur') || matchesWholeWord(msg, 'veitingar')))) {
        topic = 'dining';
    } else if (matchesWholeWord(msg, 'late') || matchesWholeWord(msg, 'delay') ||
               (isIcelandic && (matchesWholeWord(msg, 'seinn') || matchesWholeWord(msg, 'seinka')))) {
        topic = 'booking';
    }
    
    // Check knowledge base results if no topic found in message
    if (!topic) {
        if (knowledgeBaseResults.some(r => r.type === 'packages')) topic = 'packages';
        if (knowledgeBaseResults.some(r => r.type === 'ritual')) topic = 'ritual';
        if (knowledgeBaseResults.some(r => r.type === 'transportation')) topic = 'transportation';
    }
    
    // Update context with new topic and language info
    if (context && topic) {
        context.lastTopic = topic;
        context.topicLanguage = {
            isIcelandic: languageDecision?.isIcelandic || false,
            confidence: languageDecision?.confidence || 'low',
            reason: languageDecision?.reason || 'default'
        };
    }
    
    return { topic };
};

// =====================================================================
// ANALYTICS SYSTEM CORS PROXY
// =====================================================================
// This endpoint solves cross-origin resource sharing (CORS) issues between 
// the chat widget and the analytics system (https://hysing.svorumstrax.is).
//
// PROBLEM SOLVED:
// - Browser blocks direct cross-domain requests from skylagoon-chat-demo to hysing.svorumstrax.is
// - All previous CORS configuration attempts in the analytics system were insufficient
//
// HOW IT WORKS:
// 1. Frontend sends feedback data to this proxy endpoint instead of directly to analytics
// 2. This proxy forwards the request server-side (no CORS restrictions apply)
// 3. Analytics system processes the data and responds
// 4. This proxy returns the response to the frontend
//
// RELATED FILES:
// - Frontend: ChatWidget.jsx (handleMessageFeedback function)
// - Analytics: src/app/api/public-feedback/route.ts
//
// Added: February 2025 to fix feedback system
// =====================================================================
// Test GET endpoint for the analytics proxy

// Cleanup old contexts and cache
setInterval(() => {
    const oneHourAgo = Date.now() - CACHE_TTL;
    for (const [key, value] of conversationContext.entries()) {
        if (value.lastInteraction < oneHourAgo) conversationContext.delete(key);
    }
    for (const [key, value] of responseCache.entries()) {
        if (Date.now() - value.timestamp > CACHE_TTL) responseCache.delete(key);
    }
}, CACHE_TTL);

console.log('███████████████████████████████████████████');
console.log('███████ REGISTERING ANALYTICS PROXY ROUTES ███████');
console.log('███████████████████████████████████████████');


// Special test endpoint with a unique name - use this to test route registration
app.get('/skylagoon-test-2025', (req, res) => {
    console.log('Special test route accessed!');
    res.send('Special test route is working!');
});

// Consolidated analytics proxy endpoints (remove any duplicates)
app.get('/analytics-proxy', (req, res) => {
    console.log('GET request received on analytics-proxy');
    res.send('Analytics proxy endpoint is working!');
});

app.post('/analytics-proxy', async (req, res) => {
    console.log('POST request received on analytics-proxy:', req.body);
    try {
      // Node.js 18+ has fetch built-in, for older versions you might need:
      // const fetch = (await import('node-fetch')).default;
      
      const response = await fetch('https://hysing.svorumstrax.is/api/public-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json();
      console.log('Analytics system response:', data);
      res.json(data);
    } catch (error) {
      console.error('Error proxying to analytics:', error);
      res.status(500).json({ error: 'Proxy error', message: error.message });
    }
});

// Start server with enhanced logging
const PORT = config.PORT;
const server = app.listen(PORT, () => {
    console.log('\n🚀 Server Status:');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Port: ${PORT}`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log('\n⚙️ Configuration:');
    console.log(`OpenAI API Key configured: ${!!config.OPENAI_API_KEY}`);
    console.log(`API Key configured: ${!!config.API_KEY}`);
    console.log('\n🔒 Security:');
    console.log('CORS origins:', corsOptions.origin);
    console.log('Rate limiting:', `${limiter.windowMs/60000} minutes, ${limiter.max} requests`);
});

// Enhanced error handling for server startup
server.on('error', (error) => {
    logError(error, {
        context: 'Server Startup',
        port: PORT,
        environment: process.env.NODE_ENV
    });
    process.exit(1);
});

// Process-level error handling
process.on('uncaughtException', (error) => {
    logError(error, {
        context: 'Uncaught Exception',
        critical: true
    });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logError(reason, {
        context: 'Unhandled Rejection',
        promise: promise
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n⚠️ SIGTERM received: closing HTTP server');
    server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
    });
});