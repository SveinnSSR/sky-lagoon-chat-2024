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
// Enhanced context management system
import { 
    getSessionContext, 
    getPersistentSessionContext,
    updateLanguageContext, 
    addMessageToContext, 
    updateTopicContext,
    isLateArrivalMessage,
    updateTimeContext,
    // getVectorKnowledge is used internally by getKnowledgeWithFallbacks
    getKnowledgeWithFallbacks
} from './contextSystem.js';
// Import at the top of your file
import { updateBookingChangeContext, processBookingFormCheck } from './contextSystem.js';
// System prompts from systemPrompts.js
import { getSystemPrompt, setGetCurrentSeasonFunction } from './systemPrompts.js';
// Legacy knowledge base imports - kept for reference
// These are now handled through contextSystem.js getKnowledgeWithFallbacks
// import { getRelevantKnowledge } from './knowledgeBase.js';
// import { 
//     knowledgeBase_is,
//     getRelevantKnowledge_is, 
//     detectLanguage, 
//     getLanguageContext 
// } from './knowledgeBase_is.js';
import { detectLanguage as newDetectLanguage } from './languageDetection.js';
// Sunset times functionality
import { 
    getMonthAverageSunset, 
    getTodaySunset,
    matchMonthInQuery,
    icelandicMonths 
} from './sunsetTimes.js';
// Terminology Processor - enforce terminology based on Sky Lagoon guidelines
import { enforceTerminology, filterEmojis } from './terminologyProcessor.js';
// AI aware LiveChat Integration - Both Agent Handover and Booking Change Request System
import { 
    checkAgentAvailability,
    diagnosticLiveChat,
    diagnosticGroupConfiguration,
    diagnosticBotStatus,
    createProperChat, // Use Customer API instead from createCustomerChat
    createDirectAgentChat,
    sendMessageToLiveChat,
    detectBookingChangeRequest,
    createBookingChangeRequest, // Most likely unused. Remove?
    submitBookingChangeRequest,
    shouldTransferToHumanAgent,
    registerLiveChatWebhook,
    // Add these new functions:
    generateCustomerToken, // Used internally inside livechat.js by createCustomerChat and sendDualApiMessage - Unused at the moment (use createAttributedChat instead)
    createCustomerChat, // Unusued - used createAttributedChat instead now
    createAttributedChat,
    sendCustomerApiMessage,  // Add this new function
    sendDualApiMessage
} from './services/livechat.js';
// Mongo DB integration:
// Database, Echo and Duplicate message prevention and Dual-credentials storage for Livechat (Customer and Agent credentials)
import { 
    connectToDatabase, 
    storeRecentMessage, 
    checkForDuplicateMessage, // called inside webhook-livechat.js
    // Add these new functions:  
    storeDualCredentials, // called inside livechat.js
    getDualCredentials 
} from './database.js';
// Import from Data Models - You can safely remove these imports as it's handled inside messageProcessor.js
import { normalizeConversation, normalizeMessage } from './dataModels.js';
// Import from sessionManager
import { getOrCreateSession } from './sessionManager.js';
// Add this import near the top of index.js with your other imports
import { processMessagePair } from './messageProcessor.js';
// timeUtils file for later use
import { extractTimeInMinutes, extractComplexTimeInMinutes } from './timeUtils.js'; // not being used yet

// Override environment variable to disable prompt optimizer
process.env.USE_PROMPT_OPTIMIZER = 'false';

// Add near the top after imports
console.log('🚀 SERVER STARTING - ' + new Date().toISOString());
console.log('Environment check - NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

// Add this startup logging at the top after imports
console.log('███████████████████████████████████████████');
console.log('███████ SERVER STARTING WITH ANALYTICS PROXY ███████');
console.log('███████████████████████████████████████████');

// Global cache for incoming webhooks (livechat)
if (!global.recentWebhooks) {
  global.recentWebhooks = new Map();
}

// Initialize recent sessions tracking - helps with failsafe message delivery
if (!global.recentSessions) {
  global.recentSessions = new Set();
}

// Initialize Pusher with your credentials
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
});

// Optimized broadcastConversation that preserves Pusher functionality and uses the message processor
const broadcastConversation = async (userMessage, botResponse, language, topic = 'general', type = 'chat', clientSessionId = null, status = 'active') => {
    try {
        // Skip processing for empty messages
        if (!userMessage || !botResponse) {
            console.log('Skipping broadcast for empty message');
            return { success: false, reason: 'empty_message' };
        }

        // Use the message processor for MongoDB and analytics
        const processResult = await processMessagePair(
            userMessage,
            botResponse,
            {
                sessionId: clientSessionId,
                language: language,
                topic: topic,
                type: type,
                clientId: 'sky-lagoon',
                status: status  // Pass the status to analytics
            }
        );
        
        // Check if processing was successful
        if (processResult.success) {
            // Handle Pusher broadcasting which isn't in messageProcessor.js yet
            try {
                const sessionInfo = await getOrCreateSession(clientSessionId);
                
                // Create minimal conversation data for Pusher (retaining backward compatibility)
                const conversationData = {
                    id: sessionInfo.conversationId,
                    sessionId: sessionInfo.sessionId,
                    clientId: 'sky-lagoon',
                    userMessage: userMessage,   // Keep for compatibility
                    botResponse: botResponse,   // Keep for compatibility
                    messages: [
                        {
                            id: processResult.userMessageId,
                            content: userMessage,
                            role: 'user',
                            type: 'user'
                        },
                        {
                            id: processResult.botMessageId,
                            content: botResponse,
                            role: 'assistant',
                            type: 'bot'
                        }
                    ],
                    startedAt: sessionInfo.startedAt,
                    endedAt: new Date().toISOString(),
                    language: language,
                    topic: topic
                };
                
                // Pusher-only broadcast (MongoDB and analytics already handled by processMessagePair)
                await pusher.trigger('chat-channel', 'conversation-update', conversationData);
            } catch (pusherError) {
                console.error('Pusher error:', pusherError.message);
                // Continue even if Pusher fails - critical data is already saved
            }
            
            return {
                success: true,
                postgresqlId: processResult.postgresqlId
            };
        } else if (processResult.error === 'duplicate_message') {
            return { 
                success: true,
                postgresqlId: null,
                deduplicated: true
            };
        } else {
            console.log('Message processor error:', processResult.error, processResult.reason);
            return { 
                success: false, 
                postgresqlId: null,
                error: processResult.error || 'processing_error'
            };
        }
    } catch (error) {
        console.error('Error in broadcastConversation:', error.message);
        return { success: false, postgresqlId: null };
    }
};

// Cache and state management
const responseCache = new Map();

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
    },
    // Holiday periods
    holiday: {
        easter: { open: 10, close: 22 },
        christmasEve: { open: 11, close: 16 },
        christmasDay: { open: 11, close: 18 },
        newYearsEve: { open: 11, close: 22 },
        newYearsDay: { open: 11, close: 22 }
    }
};

// Add a function to get current opening hours
const getCurrentOpeningHours = () => {
    const today = new Date();
    const month = today.getMonth(); // 0-11 (Jan-Dec)
    const day = today.getDate();
    const isWeekend = today.getDay() === 0 || today.getDay() === 6; // 0 = Sunday, 6 = Saturday
    
    // Check for holiday periods first - just like in getCurrentSeason()
    if (isEasterPeriod2025(today)) {
        // For Easter, return fixed hours regardless of weekday/weekend
        return { open: 10, close: 22 };
    }
    
    // Check for other specific holidays
    if (month === 11 && day === 24) { // Christmas Eve
        return { open: 11, close: 16 };
    }
    
    if (month === 11 && day === 25) { // Christmas Day
        return { open: 11, close: 18 };
    }
    
    if (month === 11 && day === 31) { // New Year's Eve
        return { open: 11, close: 22 };
    }
    
    if (month === 0 && day === 1) { // New Year's Day
        return { open: 11, close: 22 };
    }
    
    // Regular seasonal logic (unchanged)
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

// Function to get opening hours for a specific month - currently unused but maintained for consistency
// Example usage: answering "What are your hours in December?"
const getMonthOpeningHours = (monthName) => {
    const monthIndex = {
        'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4,
        'june': 5, 'july': 6, 'august': 7, 'september': 8,
        'october': 9, 'november': 10, 'december': 11
    }[monthName.toLowerCase()];
    
    // Special case for April 2025 (Easter month)
    if (monthName.toLowerCase() === 'april' && new Date().getFullYear() === 2025) {
        // Return an object that indicates Easter period exists
        return {
            weekdays: { open: 11, close: 22 },
            weekends: { open: 10, close: 22 },
            easter: { open: 10, close: 22, days: [17, 18, 19, 20, 21] }
        };
    }
    
    // Regular seasonal logic (unchanged)
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
// These are the brand approved emojis. 
// We use terminologyProcessor.js to enforce them
const SKY_LAGOON_GUIDELINES = {
    // Sky Lagoon approved emojis for filtering
    emojis: ['😊', '☁️', '✨', '🌞', '🌅', '📍']
};

// Constants
const RATE_LIMIT_MINUTES = 15;   // Duration in minutes for rate limiting window
const RATE_LIMIT_MAX_REQUESTS = 100;  // Maximum requests per window
const CACHE_TTL = 3600000; // 1 hour
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const OPENAI_TIMEOUT = 15000;  // 15 seconds

// LiveChat Constants
// Hours during which agents may be available
// Open every day of the week from 9am to 4pm - Closed for now
const LIVECHAT_HOURS = {
    START: 21,    // 9 AM
    END: 22,     // 4 PM (24-hour format)
};

/**
 * Helper function to check if current time is within operating hours
 * @returns {boolean} Whether current time is within operating hours
 */
const isWithinOperatingHours = () => {
    const now = new Date();
    const hours = now.getHours(); // Use local time
    const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
    
    // We're open every day of the week from 9am-4pm
    const isWithinHours = hours >= LIVECHAT_HOURS.START && hours < LIVECHAT_HOURS.END;
    
    console.log('\n⏰ Hours Check:', {
        currentHour: hours,
        start: LIVECHAT_HOURS.START,
        end: LIVECHAT_HOURS.END,
        day: dayOfWeek,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isWithin: isWithinHours
    });
    
    // Only check hours, since we're open every day
    return isWithinHours;
};

/**
 * Enhanced function to check if any agents are actually available
 * @returns {Promise<boolean>} Whether any agents are available
 */
const areAgentsAvailable = async () => {
    try {
        // Use your existing function to check real agent availability
        const agentStatus = await checkAgentAvailability(false); // false for English
        
        const agentsAvailable = agentStatus.areAgentsAvailable && 
                               agentStatus.availableAgents && 
                               agentStatus.availableAgents.length > 0;
        
        console.log('\n👥 Agent availability check:', {
            agentsAvailable,
            agentCount: agentStatus.availableAgents?.length || 0,
            status: agentStatus
        });
        
        return agentsAvailable;
    } catch (error) {
        console.error('\n❌ Error checking agent availability:', error);
        return false; // Default to unavailable if check fails
    }
};

/**
 * AI-powered function to check if booking change form should be shown.
 * no form is shown anymore after updates but keeping this for data and analytics benefits
 * Delete this soon since we're adding GPT changing bookings and sending to analytics system
 * @param {string} message - User message
 * @param {Object} languageDecision - Language detection information
 * @param {Object} context - Conversation context (optional)
 * @returns {Promise<Object>} Result with confidence score and reasoning
 */
const shouldShowBookingForm = async (message, languageDecision, context = null) => {
    try {
        // Form submission check (direct indicator - skip other checks)
        if (message.toLowerCase().startsWith('booking change request:')) {
            console.log('\n✅ Form submission detected');
            return {
                shouldShowForm: true,
                isWithinAgentHours: isWithinOperatingHours(),
                confidence: 1.0,
                reasoning: "Form submission"
            };
        }
        
        // Check for package difference questions - these should NOT trigger the form
        const lowercaseMsg = message.toLowerCase();
        if ((lowercaseMsg.includes('difference') || lowercaseMsg.includes('different')) && 
            (lowercaseMsg.includes('package') || lowercaseMsg.includes('saman') || 
             lowercaseMsg.includes('pure') || lowercaseMsg.includes('sér'))) {
            console.log('\n❌ Package difference question detected - NOT a booking change request');
            return {
                shouldShowForm: false,
                isWithinAgentHours: isWithinOperatingHours(),
                confidence: 0.9,
                reasoning: "Package difference question"
            };
        }
        
        // Use the AI-powered detection function from livechat.js
        const isBookingChange = await detectBookingChangeRequest(message, languageDecision, context);
        
        console.log('\n📅 Booking Change Form Check:', {
            message: message.substring(0, 30) + '...',
            shouldShowForm: isBookingChange.shouldShowForm,
            confidence: isBookingChange.confidence,
            reasoning: isBookingChange.reasoning,
            language: languageDecision.isIcelandic ? 'Icelandic' : 'English'
        });
        
        return {
            shouldShowForm: isBookingChange.shouldShowForm,
            isWithinAgentHours: isWithinOperatingHours(),
            confidence: isBookingChange.confidence,
            reasoning: isBookingChange.reasoning
        };
    } catch (error) {
        console.error('\n❌ Error in shouldShowBookingForm:', error);
        return {
            shouldShowForm: false,
            isWithinAgentHours: isWithinOperatingHours(),
            confidence: 0,
            error: error.message
        };
    }
};

/**
 * AI-powered function to check if user should be transferred to a human agent
 * @param {string} message - User message
 * @param {Object} languageDecision - Language detection information
 * @param {Object} context - Conversation context
 * @returns {Promise<Object>} Result with transfer decision and reasoning
 */
const shouldTransferToAgent = async (message, languageDecision, context) => {
    try {
        // ADDED: First check if within operating hours before proceeding
        if (!isWithinOperatingHours()) {
            console.log('\n⏰ Outside operating hours (9am-4pm), preventing transfer');
            
            // Create message for outside hours
            const outsideHoursMessage = languageDecision.isIcelandic ? 
                "Þjónustuver okkar er opið daglega frá kl. 9-16. Ég get þó reynt að aðstoða þig með spurningar þínar." :
                "Our customer service team is available daily from 9 AM to 4 PM. I'll do my best to assist you with your questions.";
            
            return {
                shouldTransfer: false,
                reason: 'outside_operating_hours',
                response: outsideHoursMessage
            };
        }
        
        // Log transfer check
        console.log('\n👥 Agent Transfer Check:', {
            message: message.substring(0, 30) + '...',
            language: {
                isIcelandic: languageDecision.isIcelandic,
                confidence: languageDecision.confidence
            }
        });

        // Use the AI-powered detection from livechat.js
        const transferCheck = await shouldTransferToHumanAgent(message, languageDecision, context);
        
        console.log('\n🔍 Transfer Check Details:', {
            shouldTransfer: transferCheck.shouldTransfer,
            confidence: transferCheck.confidence,
            reason: transferCheck.reason,
            transferType: transferCheck.transferType || 'NONE'
        });
        
        // ENHANCED: Check for ACTUAL agent availability instead of just hours
        const agentsAvailable = await areAgentsAvailable();
        
        // SIMPLIFIED: Only handle explicit human requests
        if (transferCheck.shouldTransfer && !agentsAvailable) {
            // If human requested but unavailable, provide operating hours
            const humanRequestedMessage = languageDecision.isIcelandic ? 
                "Því miður er þjónustuverið okkar lokað núna. Opnunartími þjónustuvers er virka daga frá kl. 9-18 og um helgar frá kl. 9-16. Ég get þó reynt að aðstoða þig með spurningar þínar." :
                "Our customer service team is currently unavailable. Our service hours are weekdays from 9 AM to 6 PM and weekends from 9 AM to 4 PM. I'll do my best to assist you with your questions.";
            
            return {
                shouldTransfer: false,
                reason: 'human_requested_but_no_agents',
                response: humanRequestedMessage
            };
        }
        
        // If transfer is needed and agents are available
        if (transferCheck.shouldTransfer && agentsAvailable) {
            return {
                shouldTransfer: true,
                confidence: transferCheck.confidence,
                reason: transferCheck.reason,
                transferType: transferCheck.transferType,
                agents: transferCheck.agents
            };
        }
        
        // Default case - no transfer needed
        return {
            shouldTransfer: false,
            confidence: transferCheck.confidence,
            reason: transferCheck.reason
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

// Add these with other helper functions, AFTER imports but BEFORE endpoints
// ===============================================================

/**
 * Processes incoming messages from LiveChat agents
 * @param {Object} payload - The webhook payload from LiveChat
 * @returns {Promise<Object>} - Success status and any errors
 */
async function processLiveChatMessage(payload) {
  // Add these constants for direct access
  const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e'; 
  const PAT = 'fra:rmSYYwBm3t_PdcnJIOfQf2aQuJc';
  
  try {
    // Extract the relevant data from the payload
    const chatId = payload.chat_id;
    const event = payload.event;
    const authorId = event.author_id;
    const messageText = event.text;
    
    console.log(`\n📨 Processing message: "${messageText}" from ${authorId}`);
    
    // Ignore system messages (like transfer notifications)
    if (messageText.includes('URGENT: AI CHATBOT TRANSFER') || 
        messageText.includes('REMINDER: Customer waiting')) {
      console.log('\n📝 Ignoring system message');
      return { success: true };
    }
    
    // Check if this is an agent message
    const isAgentMessage = authorId && authorId.includes('@');
    if (!isAgentMessage) {
      console.log('\n📝 Ignoring non-agent message');
      return { success: true };
    }
    
    // Try to get session ID directly from memory cache first (fastest)
    let sessionId = null;
    if (global.liveChatSessionMappings && global.liveChatSessionMappings.has(chatId)) {
      sessionId = global.liveChatSessionMappings.get(chatId);
      console.log(`\n✅ Found session mapping in memory: ${chatId} -> ${sessionId}`);
    }
    
    // If not in memory, try direct API lookup to get customer email
    if (!sessionId) {
      try {
        console.log('\n🔍 Direct API lookup of chat data to extract session ID...');
        
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${agentCredentials}`,
            'X-Region': 'fra'
          },
          body: JSON.stringify({ chat_id: chatId })
        });
        
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          
          // Find customer and extract session ID from email
          const customer = chatData.users?.find(user => user.type === 'customer');
          
          // CRITICAL PART: Extract session ID from email
          if (customer && customer.email && customer.email.includes('@skylagoon.com')) {
            sessionId = customer.email.replace('@skylagoon.com', '');
            console.log(`\n✅ DIRECT API: Extracted session ID from email: ${chatId} -> ${sessionId}`);
            
            // Store for future use
            if (!global.liveChatSessionMappings) {
              global.liveChatSessionMappings = new Map();
            }
            global.liveChatSessionMappings.set(chatId, sessionId);
            
            // Also add to recent sessions
            if (!global.recentSessions) {
              global.recentSessions = new Set();
            }
            global.recentSessions.add(sessionId);
            
            // Try to store in MongoDB too as backup
            try {
              await storeChatSessionMapping(chatId, sessionId);
            } catch (storageError) {
              console.warn('\n⚠️ Could not store in MongoDB:', storageError.message);
            }
          } else if (customer && customer.session_fields && customer.session_fields.length > 0) {
            // Fallback to session_fields
            const sessionField = customer.session_fields.find(field => field.session_id);
            if (sessionField && sessionField.session_id) {
              sessionId = sessionField.session_id;
              console.log(`\n✅ DIRECT API: Extracted session ID from session_fields: ${chatId} -> ${sessionId}`);
            }
          }
        } else {
          console.warn('\n⚠️ Failed to get chat data:', await chatResponse.text());
        }
      } catch (error) {
        console.error('\n❌ Error in direct API lookup:', error);
      }
    }
    
    // FALLBACK: If we still couldn't find a session ID, try recent sessions
    if (!sessionId && global.recentSessions && global.recentSessions.size > 0) {
      sessionId = [...global.recentSessions].pop();
      console.log(`\n⚠️ Using most recent session as fallback: ${sessionId}`);
    }
    
    // If we still don't have a session ID, return error
    if (!sessionId) {
      console.error(`\n❌ Could not find sessionId for chatId: ${chatId}`);
      return { success: false, error: 'Session not found' };
    }
    
    // Get agent name for better UX
    let authorName = "Agent";
    try {
      // Extract name from email if possible
      if (authorId.includes('@')) {
        authorName = authorId.split('@')[0];
        // Capitalize first letter
        authorName = authorName.charAt(0).toUpperCase() + authorName.slice(1);
      }
    } catch (error) {
      console.warn('\n⚠️ Could not extract agent name:', error.message);
    }
    
    // Create agent message
    const agentMessage = {
      role: 'agent',
      content: messageText,
      author: authorName,
      timestamp: new Date().toISOString()
    };
    
    // Send to frontend via Pusher
    console.log(`\n📤 Broadcasting agent message to session: ${sessionId}`);
    await pusher.trigger('chat-channel', 'agent-message', {
      sessionId: sessionId,
      message: agentMessage,
      chatId: chatId
    });
    
    console.log('\n✅ Agent message broadcast successfully');
    
    // Also update context if available
    try {
      const context = await getPersistentSessionContext(sessionId);
      if (context) {
        addMessageToContext(context, {
          role: 'agent', 
          content: messageText,
          author: authorName
        });
        console.log('\n✅ Updated conversation context with agent message');
      }
    } catch (contextError) {
      console.warn('\n⚠️ Could not update context:', contextError.message);
      // Continue anyway
    }
    
    return { success: true };
  } catch (error) {
    console.error('\n❌ Error processing LiveChat message:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Finds the session ID associated with a LiveChat chat ID
 * @param {string} chatId - The LiveChat chat ID
 * @returns {Promise<string|null>} - The session ID or null if not found
 */
async function findSessionIdForChat(chatId) {
  try {
    console.log(`\n🔍 Looking up mapping for chat ID: ${chatId}`);
    
    // 1. First check in-memory (fastest)
    if (global.liveChatSessionMappings && global.liveChatSessionMappings.has(chatId)) {
      const sessionId = global.liveChatSessionMappings.get(chatId);
      console.log(`\n✅ Found session mapping in memory: ${chatId} -> ${sessionId}`);
      return sessionId;
    }
    
    // 2. DIRECT API LOOKUP - Most reliable method for email extraction
    try {
      console.log('\n🔍 Direct API lookup to get customer email...');
      
      // Get agent credentials - hardcoded for reliability
      const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e'; // From your livechat.js
      const PAT = 'fra:rmSYYwBm3t_PdcnJIOfQf2aQuJc'; // From your livechat.js
      const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
      
      const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${agentCredentials}`,
          'X-Region': 'fra'
        },
        body: JSON.stringify({ chat_id: chatId })
      });
      
      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        console.log('\n✅ Successfully retrieved chat data from LiveChat API');
        
        // Find customer in the users array
        const customer = chatData.users?.find(user => user.type === 'customer');
        
        if (customer && customer.email && customer.email.includes('@skylagoon.com')) {
          // Extract session ID from email - THIS IS THE KEY PART
          const sessionId = customer.email.replace('@skylagoon.com', '');
          console.log(`\n✅ Extracted session ID from email: ${chatId} -> ${sessionId}`);
          
          // Store for future use
          if (!global.liveChatSessionMappings) {
            global.liveChatSessionMappings = new Map();
          }
          global.liveChatSessionMappings.set(chatId, sessionId);
          
          // Also try to store in persistent storage
          try {
            await storeChatSessionMapping(chatId, sessionId);
          } catch (storageError) {
            console.warn(`\n⚠️ Could not store in persistent storage: ${storageError.message}`);
          }
          
          return sessionId;
        } else {
          console.log('\n⚠️ Customer found but email does not contain session ID:', 
                     customer ? customer.email : 'No customer found');
                     
          // Try session_fields as fallback
          if (customer && customer.session_fields && customer.session_fields.length > 0) {
            let sessionId = null;
            
            // First try direct index
            if (customer.session_fields[0].session_id) {
              sessionId = customer.session_fields[0].session_id;
            } else {
              // Then try finding session_id field
              const sessionField = customer.session_fields.find(field => field.session_id);
              if (sessionField) {
                sessionId = sessionField.session_id;
              }
            }
            
            if (sessionId) {
              console.log(`\n✅ Found session ID in LiveChat session_fields: ${chatId} -> ${sessionId}`);
              
              // Store for future use
              if (!global.liveChatSessionMappings) {
                global.liveChatSessionMappings = new Map();
              }
              global.liveChatSessionMappings.set(chatId, sessionId);
              
              return sessionId;
            }
          }
        }
      } else {
        console.warn('\n⚠️ Failed to get chat:', await chatResponse.text());
      }
    } catch (apiError) {
      console.warn('\n⚠️ Error in direct API lookup:', apiError.message);
    }
    
    // 3. Check webhooks cache for customer email
    if (global.recentWebhooks && global.recentWebhooks.has(chatId)) {
      console.log('\n🔍 Checking recent webhooks for customer email...');
      const chat = global.recentWebhooks.get(chatId);
      
      if (chat && chat.users) {
        const customer = chat.users.find(user => user.type === 'customer');
        
        if (customer && customer.email && customer.email.includes('@skylagoon.com')) {
          // Extract session ID from email
          const sessionId = customer.email.replace('@skylagoon.com', '');
          console.log(`\n✅ Found session ID in webhook email: ${chatId} -> ${sessionId}`);
          
          // Store for future use
          if (!global.liveChatSessionMappings) {
            global.liveChatSessionMappings = new Map();
          }
          global.liveChatSessionMappings.set(chatId, sessionId);
          
          return sessionId;
        }
        
        // Try session_fields as fallback
        if (customer && customer.session_fields && customer.session_fields.length > 0) {
          let sessionId = null;
          
          // Try to find session_id
          for (const field of customer.session_fields) {
            if (field.session_id) {
              sessionId = field.session_id;
              break;
            }
          }
          
          if (sessionId) {
            console.log(`\n✅ Found session ID in webhook session_fields: ${chatId} -> ${sessionId}`);
            
            // Store for future use
            if (!global.liveChatSessionMappings) {
              global.liveChatSessionMappings = new Map();
            }
            global.liveChatSessionMappings.set(chatId, sessionId);
            
            return sessionId;
          }
        }
      }
    }
    
    // 4. Try file-based API store (fallback)
    try {
      console.log('\n🔍 Trying file-based storage API...');
      const response = await fetch(`${process.env.BASE_URL || 'https://sky-lagoon-chat-2024.vercel.app'}/api/mapping-store?chatId=${chatId}`);
      const data = await response.json();
      
      if (data.success && data.sessionId) {
        console.log(`\n✅ Found session mapping via API: ${chatId} -> ${data.sessionId}`);
        
        // Cache for future lookups
        if (!global.liveChatSessionMappings) {
          global.liveChatSessionMappings = new Map();
        }
        global.liveChatSessionMappings.set(chatId, data.sessionId);
        
        return data.sessionId;
      }
    } catch (apiError) {
      console.warn(`\n⚠️ API lookup error: ${apiError.message}`);
    }
    
    // 5. Try MongoDB as last fallback
    try {
      console.log('\n🔍 Trying MongoDB as last fallback...');
      const { db } = await connectToDatabase();
      
      // Try multiple collection names for robustness
      const collectionNames = ['livechat_mappings', 'livechatMappings'];
      
      for (const collName of collectionNames) {
        try {
          const mapping = await db.collection(collName).findOne({ chatId: chatId });
          
          if (mapping && mapping.sessionId) {
            console.log(`\n✅ Found session mapping in MongoDB (${collName}): ${chatId} -> ${mapping.sessionId}`);
            
            // Cache for future
            if (!global.liveChatSessionMappings) {
              global.liveChatSessionMappings = new Map();
            }
            global.liveChatSessionMappings.set(chatId, mapping.sessionId);
            
            return mapping.sessionId;
          }
        } catch (collError) {
          console.warn(`\n⚠️ Error checking ${collName}: ${collError.message}`);
        }
      }
    } catch (dbError) {
      console.warn(`\n⚠️ MongoDB lookup error: ${dbError.message}`);
    }
    
    console.log(`\n❌ No mapping found for chat ID: ${chatId} after trying all methods`);
    return null;
  } catch (error) {
    console.error('\n❌ Error retrieving mapping:', error);
    return null;
  }
}

/**
 * Stores a mapping between LiveChat chat ID and session ID
 * @param {string} chatId - LiveChat chat ID
 * @param {string} sessionId - Chatbot session ID
 * @returns {Promise<boolean>} - Success status
 */
async function storeChatSessionMapping(chatId, sessionId) {
  try {
    console.log(`\n🔗 Storing mapping: ${chatId} -> ${sessionId}`);
    
    // 1. Store in-memory for immediate use
    if (!global.liveChatSessionMappings) {
      global.liveChatSessionMappings = new Map();
    }
    global.liveChatSessionMappings.set(chatId, sessionId);
    
    // 2. Store via API endpoint (reliable across function instances)
    try {
      const response = await fetch(`${process.env.BASE_URL || 'https://sky-lagoon-chat-2024.vercel.app'}/api/mapping-store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chatId, sessionId })
      });
      
      if (response.ok) {
        console.log(`\n🔗 Mapping stored via API`);
      } else {
        console.warn(`\n⚠️ API storage failed: ${await response.text()}`);
      }
    } catch (apiError) {
      console.warn(`\n⚠️ Could not store mapping via API: ${apiError.message}`);
    }
    
    // 3. Also try MongoDB
    try {
      const { db } = await connectToDatabase();
      
      // Ensure the collection exists
      let collections = await db.listCollections({name: 'livechat_mappings'}).toArray();
      if (collections.length === 0) {
        await db.createCollection('livechat_mappings');
        console.log('\n✅ Created livechat_mappings collection');
      }
      
      // Store the mapping
      await db.collection('livechat_mappings').updateOne(
        { chatId },
        { $set: { 
            sessionId,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      
      console.log(`\n🔗 Mapping stored in MongoDB`);
    } catch (dbError) {
      console.warn(`\n⚠️ Could not store in MongoDB: ${dbError.message}`);
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ Error storing chat mapping:', error);
    return false;
  }
}

/**
 * Ensures the livechat_mappings collection exists in MongoDB
 * @returns {Promise<void>}
 */
async function ensureMappingCollection() {
  try {
    const { db } = await connectToDatabase();
    const collections = await db.listCollections({name: 'livechat_mappings'}).toArray();
    
    if (collections.length === 0) {
      console.log('\n📊 Creating livechat_mappings collection...');
      await db.createCollection('livechat_mappings');
      console.log('\n✅ livechat_mappings collection created');
    } else {
      console.log('\n✅ livechat_mappings collection already exists');
    }
  } catch (error) {
    console.error('\n❌ Error ensuring mapping collection:', error);
  }
}

/**
 * Modern intent-based booking change detection with multilingual support
 * ChatGPT based - not Livechat. Will delete the Livechat functions above this one at some point.
 * @param {string} userMessage - The user's message
 * @param {Object} context - The conversation context
 * @returns {boolean} - Whether a booking change intent was detected
 */
const detectBookingChangeIntent = (userMessage, context) => {
  // Detect language
  const isIcelandic = context.language === 'is';
  
  // Create a more sophisticated detection pattern - with Icelandic support
  const bookingTerms = isIcelandic 
    ? ['miði', 'miða', 'bókun', 'pöntun', 'tími', 'tíma', 'pantaði'] 
    : ['ticket', 'booking', 'reservation', 'slot', 'appointment', 'booked'];
    
  const changeTerms = isIcelandic
    ? ['breyta', 'breyting', 'skipta', 'uppfæra', 'endurskipuleggja', 'öðruvísi', 'aðrar']
    : ['change', 'modify', 'switch', 'update', 'reschedule', 'different'];
    
  const timePattern = /\d{1,2}[\.:]\d{2}/;
  const datePattern = isIcelandic
    ? /(?:jan|feb|mar|apr|maí|jún|júl|ágú|sep|okt|nóv|des)(?:úar|rúar|s|íl|st|tember|óber|ember)?\.?\s+\d{1,2}/i
    : /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:uary|ruary|ch|il|ust|tember|ober|ember)?\.?\s+\d{1,2}/i;
  
  // Intent markers
  let hasBookingReference = false;
  let hasChangeIntent = false;
  let hasTimeChange = false;
  
  // Convert message to lowercase for consistent matching
  const lowercaseMsg = userMessage.toLowerCase();
  
  // Check for booking terms
  hasBookingReference = bookingTerms.some(term => lowercaseMsg.includes(term));
  
  // Check for bought + date/time pattern (common in booking change requests)
  if ((isIcelandic && lowercaseMsg.includes('keypti')) || 
      (!isIcelandic && lowercaseMsg.includes('bought'))) {
    if (timePattern.test(userMessage) || datePattern.test(userMessage)) {
      hasBookingReference = true;
    }
  }
  
  // Check for change intent
  hasChangeIntent = changeTerms.some(term => lowercaseMsg.includes(term));
  
  // Check for time changes (like "3:00" vs "3:30")
  const timeMatches = userMessage.match(timePattern);
  if (timeMatches && timeMatches.length >= 2) {
    hasTimeChange = true;
  } else if (timePattern.test(userMessage)) {
    // Check for contextual indicators of change in either language
    const changeContextIndicators = isIcelandic
      ? ['í staðinn', 'frekar', 'en', 'ekki', 'heldur']
      : ['instead', 'rather', 'but', 'not', 'instead of'];
      
    if (changeContextIndicators.some(indicator => lowercaseMsg.includes(indicator))) {
      hasTimeChange = true;
    }
  }
  
  // Calculate confidence score based on intent markers
  const confidenceScore = 
    (hasBookingReference ? 0.4 : 0) + 
    (hasChangeIntent ? 0.4 : 0) + 
    (hasTimeChange ? 0.2 : 0);
  
  console.log('\n🔍 Booking change detection analysis:', {
    language: isIcelandic ? 'Icelandic' : 'English',
    hasBookingReference,
    hasChangeIntent, 
    hasTimeChange,
    confidenceScore
  });
  
  // If we have reasonable confidence, update the intent tracking
  if (confidenceScore >= 0.4) {
    console.log(`\n✅ Detected booking change intent with confidence: ${confidenceScore}`);
    
    // Update intent hierarchy
    if (context.intentHierarchy) {
      context.intentHierarchy.updateIntent('booking_change', confidenceScore);
    }
    
    // Add to topic graph
    if (context.topicGraph) {
      context.topicGraph.addTopic('booking_change', {
        detected: Date.now(),
        confidence: confidenceScore,
        language: isIcelandic ? 'is' : 'en'
      });
      
      // Create relationship from previous topic if any
      if (context.lastTopic && context.lastTopic !== 'booking_change') {
        context.topicGraph.addRelationship(context.lastTopic, 'booking_change', 0.8);
      }
    }
    
    // Set status and other context flags
    context.bookingContext = context.bookingContext || {};
    context.bookingContext.hasBookingIntent = true;
    context.bookingContext.hasBookingChangeIntent = true;
    context.bookingContext.confidenceScore = confidenceScore;
    context.lastTopic = 'booking_change';
    
    // Add to topics tracking
    if (!context.topics) context.topics = [];
    if (!context.topics.includes('booking_change')) {
      context.topics.push('booking_change');
    }
    
    // Mark status for analytics visibility
    context.status = 'booking_change';
    
    // Store in adaptive memory
    if (context.adaptiveMemory) {
      context.adaptiveMemory.addMemory(userMessage, {
        category: 'booking_change',
        importance: 0.8,
        language: isIcelandic ? 'is' : 'en',
        metadata: {
          confidenceScore,
          detectedTime: timeMatches ? timeMatches[0] : null,
          hasExplicitChangeWord: hasChangeIntent
        }
      });
    }
    
    return true;
  }
  
  return false;
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
// STEP 3: Replace generateSunsetResponse with this new function
const getSunsetDataForContext = (userMessage, languageDecision) => {
    const isIcelandic = languageDecision.isIcelandic;
    const msg = userMessage.toLowerCase();
    
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
    
    // Get today's opening hours
    const todayHours = getCurrentOpeningHours();
    
    return {
        isSunsetRelated: true,
        todaySunset: todaySunset ? {
            formatted: todaySunset.formatted,
            formattedLocal: todaySunset.formattedLocal
        } : null,
        specificMonth: monthInQuery ? {
            name: monthName,
            sunsetTime: sunsetTime ? {
                formatted: sunsetTime.formatted,
                formattedLocal: sunsetTime.formattedLocal
            } : null,
            isCurrentMonth
        } : null,
        todayOpeningHours: `${todayHours.open}:00-${todayHours.close}:00`
    };
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

// Helper functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Add a function to get current opening hours
const getCurrentSeason = () => {
    const today = new Date();
    const month = today.getMonth(); // 0-11 (Jan-Dec)
    const day = today.getDate();
    const isWeekend = today.getDay() === 0 || today.getDay() === 6; // 0 = Sunday, 6 = Saturday
    
    // Handle Easter 2025 (April 17-21, 2025)
    if (month === 3 && day >= 17 && day <= 21) { // April is month 3 (0-indexed)
        console.log(`🐣 Easter period detected: April ${day}, 2025`);
        return {
            season: 'holiday',
            closingTime: '22:00',
            lastRitual: '20:00',
            barClose: '21:00',
            lagoonClose: '21:30',
            greeting: 'Easter Holiday',
            openingTime: '10:00' // Special Easter opening time
        };
    }
    
    // Other holiday checks
    if (month === 11 && day === 24) { // Dec is month 11 (0-indexed)
        return {
            season: 'holiday',
            closingTime: '16:00',
            lastRitual: '14:00',
            barClose: '15:00',
            lagoonClose: '15:30',
            greeting: 'Christmas Eve',
            openingTime: '11:00'
        };
    }
    
    if (month === 11 && day === 25) {
        return {
            season: 'holiday',
            closingTime: '18:00',
            lastRitual: '16:00',
            barClose: '17:00',
            lagoonClose: '17:30',
            greeting: 'Christmas Day',
            openingTime: '11:00'
        };
    }
    
    if (month === 11 && day === 31) {
        return {
            season: 'holiday',
            closingTime: '22:00',
            lastRitual: '20:00',
            barClose: '21:00',
            lagoonClose: '21:30',
            greeting: 'New Year\'s Eve',
            openingTime: '11:00'
        };
    }
    
    if (month === 0 && day === 1) { // Jan is month 0 (0-indexed)
        return {
            season: 'holiday',
            closingTime: '22:00',
            lastRitual: '20:00',
            barClose: '21:00',
            lagoonClose: '21:30',
            greeting: 'New Year\'s Day',
            openingTime: '11:00'
        };
    }

    // Regular seasons
    if (month >= 10 || month <= 4) { // Nov-May (10=Nov, 0=Jan, 4=May)
        return {
            season: 'winter',
            closingTime: '22:00',
            lastRitual: '20:00',
            barClose: '21:00',
            lagoonClose: '21:30',
            greeting: 'winter',
            openingTime: isWeekend ? '10:00' : '11:00' // Weekend vs weekday opening times
        };
    }
    
    if (month >= 5 && month <= 8) { // June-Sept (5=June, 8=Sept)
        return {
            season: 'summer',
            closingTime: '23:00',
            lastRitual: '21:00',
            barClose: '22:00',
            lagoonClose: '22:30',
            greeting: 'summer',
            openingTime: '08:00' // Summer opening time
        };
    }
    
    return {
        season: 'autumn',
        closingTime: '23:00',
        lastRitual: '21:00',
        barClose: '22:00',
        lagoonClose: '22:30',
        greeting: 'autumn',
        openingTime: '10:00'
    };
};

setGetCurrentSeasonFunction(getCurrentSeason);

// Helper function to check if a date is during Easter 2025
const isEasterPeriod2025 = (date = new Date()) => {
    // Easter 2025 period: April 17-21
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed, so April is 3
    const day = date.getDate();
    
    if (year === 2025 && month === 3 && day >= 17 && day <= 21) {
        console.log(`🐣 Date ${date.toDateString()} is during Easter 2025 period`);
        return true;
    }
    
    return false;
};

// Helper to get Easter info for a specific date
// Currently not being used - Helper function for future date-specific Easter queries
// Can be used to interpret dates like "tomorrow" in relation to Easter period
const getEasterInfo = (dateStr = null) => {
    let targetDate;
    
    if (dateStr) {
        // Parse date string like "tomorrow", "next day", etc.
        if (dateStr.toLowerCase() === 'tomorrow') {
            targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 1);
        } else if (dateStr.toLowerCase() === 'today' || dateStr.toLowerCase() === 'this evening') {
            targetDate = new Date();
        } else {
            // Try to parse the date string (simplified)
            try {
                targetDate = new Date(dateStr);
                if (isNaN(targetDate.getTime())) {
                    // If invalid date, default to today
                    targetDate = new Date();
                }
            } catch (e) {
                targetDate = new Date();
            }
        }
    } else {
        targetDate = new Date();
    }
    
    if (isEasterPeriod2025(targetDate)) {
        return {
            isEaster: true,
            date: targetDate,
            easterDay: getEasterDayName(targetDate),
            openingTime: '10:00',
            closingTime: '22:00',
            lastRitual: '20:00',
            barClose: '21:00',
            lagoonClose: '21:30'
        };
    }
    
    return {
        isEaster: false,
        date: targetDate
    };
};

// Helper to get Easter day name
const getEasterDayName = (date) => {
    // Easter 2025: April 17-21
    const month = date.getMonth();
    const day = date.getDate();
    
    if (month === 3) { // April
        if (day === 17) return "Maundy Thursday";
        if (day === 18) return "Good Friday";
        if (day === 19) return "Holy Saturday";
        if (day === 20) return "Easter Sunday";
        if (day === 21) return "Easter Monday";
    }
    
    return null;
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

// This Map tracks messages already sent to analytics to prevent duplicates (then referenced later in the sendConversationToAnalytics function)
const analyticsSentMessages = new Map();

// Add new code here
const EMOJI_MAPPING = {
    greeting: '😊',
    location: '📍',
    ritual: '✨',
    weather: '☁️',
    summer: '🌞',
    sunset: '🌅'
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

// Add session tracker middleware to keep track of active sessions
app.use((req, res, next) => {
  if (req.body && req.body.sessionId) {
    // Store this session ID
    if (!global.recentSessions) {
      global.recentSessions = new Set();
    }
    global.recentSessions.add(req.body.sessionId);
    
    // Keep only the last 10 sessions
    if (global.recentSessions.size > 10) {
      const oldestSession = [...global.recentSessions][0];
      global.recentSessions.delete(oldestSession);
    }
  }
  next();
});

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

// Add a diagnostic endpoint - Livechat testing
app.get('/api/livechat-diagnostic', async (req, res) => {
  try {
    const results = await diagnosticLiveChat();
    res.json({ success: true, results });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Add a group configuration diagnostic endpoint - Livechat testing pt 2
app.get('/api/livechat-group-diagnostic', async (req, res) => {
  try {
    const results = await diagnosticGroupConfiguration();
    res.json({ success: true, results });
  } catch (error) {
    console.error('Group diagnostic error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Add a diagnostic endpoint for bot status - Livechat testing pt 3
app.get('/api/livechat-bot-diagnostic', async (req, res) => {
  try {
    const results = await diagnosticBotStatus();
    res.json({ success: true, results });
  } catch (error) {
    console.error('Bot status diagnostic error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
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

// Modified chat endpoint using only the new context system
app.post('/chat', verifyApiKey, async (req, res) => {
    // Add performance tracking
    const startTime = Date.now();
    const metrics = {
        sessionTime: 0,
        languageTime: 0,
        knowledgeTime: 0,
        transferTime: 0,
        // bookingTime removed
        totalTime: 0
    };

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
                    sessionId, // Pass the session ID from the client
                    responseObj.status || 'active' // MODIFY THIS LINE to use responseObj instead of context
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
        // MIGRATION: Get sessionId directly from the request body
        const sessionId = req.body.sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        
        console.log('\n🔍 Full request body:', req.body);
        console.log('\n🆔 Using session ID:', sessionId);
        
        // Get message from either question or message field
        const userMessage = req.body.message || req.body.question;
        
        console.log('\n📥 Incoming Message:', userMessage);
        
        // Handle messages when in agent mode - KEEP THIS ENTIRE BLOCK INTACT
        if (req.body.chatId && req.body.isAgentMode) {
            console.log('\n🚨 AGENT MODE HANDLER TRIGGERED:', {
                chatId: req.body.chatId,
                message: userMessage,
                isAgentMode: req.body.isAgentMode
            });
            try {
                // Store message in MongoDB for echo detection
                console.log('\n💾 ABOUT TO STORE MESSAGE IN MONGODB:', req.body.chatId, userMessage);
                try {
                    await storeRecentMessage(req.body.chatId, userMessage);
                    console.log('\n✅ SUCCESSFULLY STORED MESSAGE IN MONGODB');
                } catch (storeError) {
                    console.error('\n⚠️ Error storing message in MongoDB:', storeError);
                }
                
                // Get dual credentials for this chat
                console.log(`\n🔍 Looking up dual credentials for chat: ${req.body.chatId}`);
                const dualCreds = await getDualCredentials(req.body.chatId);
                
                // ENHANCED: Log what we found
                console.log('\n🔍 Dual credentials lookup result:', {
                    found: !!dualCreds,
                    hasCustomerToken: dualCreds?.customerToken ? true : false,
                    hasEntityId: dualCreds?.entityId ? true : false
                });
                
                // Always use agent credentials as fallback
                const agentCredentials = req.body.agent_credentials || req.body.bot_token;
                
                if (!dualCreds && !agentCredentials) {
                    throw new Error('Missing credentials for agent mode');
                }
                
                // Track message for echo detection
                try {
                    if (!global.customerMessageTracker) {
                        global.customerMessageTracker = new Map();
                    }
                    
                    const chatMessages = global.customerMessageTracker.get(req.body.chatId) || [];
                    chatMessages.push({
                        text: userMessage,
                        timestamp: Date.now()
                    });
                    
                    global.customerMessageTracker.set(req.body.chatId, chatMessages);
                    
                    if (chatMessages.length > 10) {
                        chatMessages.shift();
                    }
                    
                    console.log(`\n🔒 Tracked customer message for echo detection: "${userMessage}"`);
                } catch (trackError) {
                    console.error('\n⚠️ Error tracking message:', trackError);
                }
                
                // Attempt to send message with all available methods, trying each in turn
                let messageSent = false;
                
                // ENHANCED: Use Customer API if we have customer token
                if (!messageSent && dualCreds && dualCreds.customerToken) {
                    console.log('\n🔑 Using Customer API with token for proper message styling');
                    
                    try {
                        const ORGANIZATION_ID = '10d9b2c9-311a-41b4-94ae-b0c4562d7737';
                        
                        // Use the chat_id exactly as provided by LiveChat
                        const chatId = req.body.chatId;
                        
                        console.log(`\n🔍 Using exact chat ID: "${chatId}" for Customer API`);
                        
                        // Use Bearer token as instructed by LiveChat
                        const bearerToken = `Bearer ${dualCreds.customerToken}`;
                        
                        const apiUrl = `https://api.livechatinc.com/v3.5/customer/action/send_event?organization_id=${ORGANIZATION_ID}`;
                        
                        const response = await fetch(apiUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json', // Explicitly confirmed by Tomasz
                                'Authorization': bearerToken 
                            },
                            body: JSON.stringify({
                                chat_id: chatId,
                                event: {
                                    type: 'message',
                                    text: userMessage,
                                    custom_id: `customer_msg_${Date.now()}`,
                                    recipients: 'all' // KEY CHANGE: 'recipients' instead of 'visibility' per Tomasz
                                }
                            })
                        });
                        
                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error('\n❌ Customer API error:', errorText);
                            console.log('\n🔄 Will try next fallback method...');
                        } else {
                            console.log('\n✅ Message sent using Customer API (customer styling)');
                            messageSent = true;
                        }
                    } catch (customerApiError) {
                        console.error('\n❌ Customer API failed:', customerApiError.message);
                    }
                }
                
                // Fallback to Agent API with customer ID attribution
                if (!messageSent && dualCreds && dualCreds.entityId) {
                    console.log('\n🔑 Using Agent API with customer ID attribution');
                    
                    try {
                        // Determine auth and create proper headers
                        let authHeader;
                        if (agentCredentials.startsWith('Basic ')) {
                            authHeader = agentCredentials;
                        } else if (agentCredentials.startsWith('Bearer ')) {
                            authHeader = agentCredentials;
                        } else if (agentCredentials.includes(':')) {
                            authHeader = `Basic ${agentCredentials}`;
                        } else {
                            authHeader = `Basic ${agentCredentials}`;
                        }
                        
                        // ENHANCED: Create message with prominent customer formatting
                        const enhancedMessage = `══════ 👤 CUSTOMER MESSAGE ══════\n${userMessage}\n═══════════════════════════════`;
                        
                        // Create message event with customer attribution if we have a customer ID
                        const eventObject = {
                            type: 'message',
                            text: enhancedMessage, // Enhanced formatting
                            visibility: 'all',
                            author_id: dualCreds.entityId // Set author to customer for attribution
                        };
                        
                        console.log(`\n📝 Adding customer attribution (author_id: ${dualCreds.entityId})`);
                        console.log('\n📝 Event JSON structure:', JSON.stringify(eventObject, null, 2));
                        
                        // Send the message with proper attribution
                        const sendResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': authHeader,
                                'X-Region': 'fra'
                            },
                            body: JSON.stringify({
                                chat_id: req.body.chatId,
                                event: eventObject
                            })
                        });
                        
                        if (!sendResponse.ok) {
                            const errorText = await sendResponse.text();
                            console.error('\n❌ Error sending message to LiveChat:', errorText);
                            console.log('\n🔄 Will try final fallback method...');
                        } else {
                            console.log('\n✅ Message sent with customer ID attribution');
                            messageSent = true;
                        }
                    } catch (attributionError) {
                        console.error('\n❌ Attribution approach failed:', attributionError.message);
                        // Continue to final fallback - no throw here
                    }
                }
                
                // Final fallback - just use Agent API normally
                if (!messageSent) {
                    console.log('\n🔑 Falling back to Agent API without customer attribution');
                    
                    // Determine auth and create proper headers
                    let authHeader;
                    if (agentCredentials.startsWith('Basic ')) {
                        authHeader = agentCredentials;
                    } else if (agentCredentials.startsWith('Bearer ')) {
                        authHeader = agentCredentials;
                    } else if (agentCredentials.includes(':')) {
                        authHeader = `Basic ${agentCredentials}`;
                    } else {
                        authHeader = `Basic ${agentCredentials}`;
                    }
                    
                    // ENHANCED: Create message with prominent customer formatting
                    const enhancedMessage = `══════ 👤 CUSTOMER MESSAGE ══════\n${userMessage}\n═══════════════════════════════`;
                    
                    // Create basic message event
                    const eventObject = {
                        type: 'message',
                        text: enhancedMessage, // Enhanced formatting
                        visibility: 'all'
                    };
                    
                    console.log('\n📝 Event JSON structure:', JSON.stringify(eventObject, null, 2));
                    
                    // Send the message
                    const sendResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': authHeader,
                            'X-Region': 'fra'
                        },
                        body: JSON.stringify({
                            chat_id: req.body.chatId,
                            event: eventObject
                        })
                    });
                    
                    if (!sendResponse.ok) {
                        const errorText = await sendResponse.text();
                        console.error('\n❌ Error sending message to LiveChat:', errorText);
                        throw new Error(`LiveChat API error: ${sendResponse.status}`);
                    }
                    
                    console.log('\n✅ Message sent with prefix only (no attribution)');
                    messageSent = true;
                }
                
                metrics.totalTime = Date.now() - startTime;
                console.log(`\n⏱️ Total processing time (agent mode): ${metrics.totalTime}ms`);
                
                // Return success response
                return res.status(200).json({
                    success: true,
                    chatId: req.body.chatId,
                    agent_credentials: req.body.agent_credentials,
                    bot_token: req.body.bot_token,
                    suppressMessage: true,
                    language: {
                        detected: 'English', // Default since we don't have language detection yet
                        confidence: 'medium'
                    }
                });
            } catch (error) {
                console.error('\n❌ LiveChat Message Error:', error);
                metrics.totalTime = Date.now() - startTime;
                console.log(`\n⏱️ Total processing time (agent mode error): ${metrics.totalTime}ms`);
                
                return res.status(500).json({
                    message: "Error sending message to agent",
                    error: error.message
                });
            }
        }

        // TARGETED PARALLELIZATION: Core operations in parallel
        console.log('\n⏱️ Starting parallel initialization...');
        const parallelStart = Date.now();
        
        // MIGRATION: Get or create context and perform language detection in parallel
        let context, languageDecision;
        
        try {
            [context, languageDecision] = await Promise.all([
                getPersistentSessionContext(sessionId),
                newDetectLanguage(userMessage)
            ]);
            
            metrics.sessionTime = Date.now() - parallelStart;
            console.log(`\n⏱️ Session and language detection completed in ${metrics.sessionTime}ms`);
        } catch (sessionError) {
            console.error(`❌ Session recovery error:`, sessionError);
            // Fallback to in-memory session
            context = getSessionContext(sessionId);
            languageDecision = newDetectLanguage(userMessage, context);
        }

        // Extract language code in addition to isIcelandic
        const language = languageDecision.language || (languageDecision.isIcelandic ? 'is' : 'en');
        
        // Update language info in the context
        updateLanguageContext(context, userMessage);
        
        // Enhanced logging for language detection
        console.log('\n🌍 Enhanced Language Detection:', {
            message: userMessage,
            language: language,
            isIcelandic: languageDecision.isIcelandic,
            confidence: languageDecision.confidence,
            reason: languageDecision.reason,
            sessionId: sessionId // Add session ID to logs for traceability
        });

        // Check for non-supported languages
        if (languageDecision.reason === 'non_supported_language') {
            console.log('\n🌐 Non-supported language detected:', {
                message: userMessage,
                detectedLanguage: languageDecision.detectedLanguage || 'unknown',
                confidence: languageDecision.confidence
            });
            
            const unsupportedLanguageResponse = "Unfortunately, I haven't been trained in this language yet. Please contact info@skylagoon.is who will be happy to assist.";
            
            // Add to new context system before responding
            addMessageToContext(context, { role: 'user', content: userMessage });
            
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
            
            metrics.totalTime = Date.now() - startTime;
            console.log(`\n⏱️ Total processing time (non-supported language): ${metrics.totalTime}ms`);
            
            return res.status(responseData.status || 200).json(responseData);
        }

        // Add this message to the context system
        addMessageToContext(context, { role: 'user', content: userMessage });
        
        // Update topics in the context system
        updateTopicContext(context, userMessage);

        // Log session info for debugging
        console.log('\n🔍 Session ID:', {
            sessionId,
            language: context.language,
            lastTopic: context.lastTopic,
            topics: context.topics
        });

        // TARGETED PARALLELIZATION: Run key checks in parallel
        // NOTE: I kept the detection part for changing bookings but removed the form display part (showing the LiveChat form)
        console.log('\n⏱️ Starting parallel operations...');
        const operationsStart = Date.now();
        
        const [
            transferCheck,       // Check if we should transfer to a human agent
            knowledgeBaseResults // Get relevant knowledge
        ] = await Promise.all([
            shouldTransferToAgent(userMessage, languageDecision, context)
                .then(result => {
                    metrics.transferTime = Date.now() - operationsStart;
                    return result;
                }),
            getKnowledgeWithFallbacks(userMessage, context)
                .then(result => {
                    metrics.knowledgeTime = Date.now() - operationsStart;
                    return result;
                })
        ]);
        
        console.log(`\n⏱️ Parallel operations completed in ${Date.now() - operationsStart}ms`);

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

        // Modern intent-based booking change detection
        // This is the Booking Change Request System that is broadcasted to Analytics
        if (detectBookingChangeIntent(userMessage, context)) {
            console.log('\n📝 Booking change intent detected through advanced context analysis');
            // The function already set all required context flags
        }

        // MIGRATION: Check if we should transfer to human agent with AI-powered detection

        console.log('\n🔄 Transfer Check Result:', {
            shouldTransfer: transferCheck.shouldTransfer,
            reason: transferCheck.reason,
            confidence: transferCheck.confidence,
            withinHours: isWithinOperatingHours(),
            availableAgents: transferCheck.agents?.length || 0
        });

        // Check if user is already transferred to prevent duplicate transfers
        if (context.transferStatus && context.transferStatus.transferred) {
            console.log('\n📝 User already transferred to agent, skipping transfer');
            
            // IMPORTANT: For agent mode messages, just forward to LiveChat without bot response
            if (req.body.isAgentMode) {
                // Store message in MongoDB for echo detection
                console.log('\n💾 ABOUT TO STORE MESSAGE IN MONGODB:', context.transferStatus.chatId, userMessage);
                try {
                    await storeRecentMessage(context.transferStatus.chatId, userMessage);
                    console.log('\n✅ SUCCESSFULLY STORED MESSAGE IN MONGODB');
                } catch (storeError) {
                    console.error('\n⚠️ Error storing message in MongoDB:', storeError);
                }
                
                // Send the message to LiveChat using the stored credentials
                await sendMessageToLiveChat(
                    context.transferStatus.chatId, 
                    userMessage, 
                    req.body.agent_credentials || req.body.bot_token
                );
                
                metrics.totalTime = Date.now() - startTime;
                console.log(`\n⏱️ Total processing time (already transferred agent mode): ${metrics.totalTime}ms`);
                
                // Return success but suppress any bot message
                return res.status(200).json({
                    success: true,
                    chatId: context.transferStatus.chatId,
                    agent_credentials: req.body.agent_credentials || req.body.bot_token,
                    suppressMessage: true,
                    transferred: true
                });
            }
            
            // For non-agent messages, still show the reminder
            const alreadyTransferredMessage = languageDecision.isIcelandic ?
                "Þú ert þegar tengd(ur) við þjónustufulltrúa. Vinsamlegast haltu áfram samtalinu." :
                "You are already connected with a live agent. Please continue your conversation here.";
            
            // Add response to context
            addMessageToContext(context, { role: 'assistant', content: alreadyTransferredMessage });
            
            // Use the unified broadcast system to update the UI without creating a new transfer
            const responseData = await sendBroadcastAndPrepareResponse({
                message: alreadyTransferredMessage,
                transferred: true,
                chatId: context.transferStatus.chatId,
                language: {
                    detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence,
                    reason: languageDecision.reason
                },
                topicType: 'transfer_reminder',
                responseType: 'direct_response'
            });
            
            metrics.totalTime = Date.now() - startTime;
            console.log(`\n⏱️ Total processing time (already transferred): ${metrics.totalTime}ms`);
            
            return res.status(responseData.status || 200).json(responseData);
        }
        
        if (transferCheck.shouldTransfer) {
            try {
                // Create chat with correct customer attribution
                console.log('\n📝 Creating new LiveChat chat with customer attribution:', sessionId);
                const chatData = await createAttributedChat(sessionId, languageDecision.isIcelandic);

                // Store mapping between LiveChat chat ID and our session ID in memory and MongoDB
                if (chatData && chatData.chat_id) {
                    // Use the persistent storage function
                    await storeChatSessionMapping(chatData.chat_id, sessionId);
                }
                
                if (!chatData || !chatData.chat_id) {
                    throw new Error('Failed to create chat or get chat ID');
                }
                
                console.log('\n✅ Chat created successfully with dual API approach:', chatData.chat_id);
                
                // Prepare transfer message based on language
                const transferMessage = languageDecision.isIcelandic ?
                    "Ég er að tengja þig við þjónustufulltrúa. Eitt andartak..." :
                    "I'm connecting you with a customer service representative. One moment...";
                
                // Add response to context
                addMessageToContext(context, { role: 'assistant', content: transferMessage });
                
                // Use the unified broadcast system to update the UI
                const responseData = await sendBroadcastAndPrepareResponse({
                    message: transferMessage,
                    transferred: true,
                    chatId: chatData.chat_id,
                    customer_token: chatData.customer_token, // Add customer token
                    agent_credentials: chatData.agent_credentials,
                    initiateWidget: true,
                    language: {
                        detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                        confidence: languageDecision.confidence,
                        reason: languageDecision.reason
                    },
                    topicType: 'transfer',
                    responseType: 'direct_response'
                });
                
                // Verification check using agent credentials - keeping this from the original code
                setTimeout(async () => {
                    try {
                        console.log('\n⏱️ Running visibility verification check with agent credentials...');
                        
                        // Verify the chat exists and is active using agent credentials
                        const verifyResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Basic ${chatData.agent_credentials}`,
                                'X-Region': 'fra'
                            },
                            body: JSON.stringify({
                                chat_id: chatData.chat_id
                            })
                        });
                        
                        if (verifyResponse.ok) {
                            const chatStatus = await verifyResponse.json();
                            console.log('\n🔍 Chat status verification:', {
                                id: chatData.chat_id,
                                active: chatStatus.active,
                                thread: chatStatus.thread || {},
                                users: chatStatus.users?.length || 0
                            });
                            
                            // If the chat looks inactive, send a follow-up message to alert agents
                            if (!chatStatus.active || !chatStatus.thread?.events?.length) {
                                console.log('\n⚠️ Chat visibility check - sending reminder message...');
                                
                                // Send a reminder message using agent credentials
                                await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Basic ${chatData.agent_credentials}`,
                                        'X-Region': 'fra'
                                    },
                                    body: JSON.stringify({
                                        chat_id: chatData.chat_id,
                                        event: {
                                            type: 'message',
                                            text: '🚨🚨 REMINDER: Customer waiting for assistance',
                                            visibility: 'all'
                                        }
                                    })
                                });
                            }
                        }
                    } catch (verifyError) {
                        console.error('\n⚠️ Verification error:', verifyError);
                        // Don't throw - this is just an additional check
                    }
                }, 2000);

                // Mark user as transferred to prevent duplicate transfers
                context.transferStatus = {
                    transferred: true,
                    chatId: chatData.chat_id,
                    timestamp: new Date().toISOString()
                };
                
                metrics.totalTime = Date.now() - startTime;
                console.log(`\n⏱️ Total processing time (new transfer): ${metrics.totalTime}ms`);
                
                return res.status(responseData.status || 200).json(responseData);
            } catch (error) {
                console.error('\n❌ Transfer Error:', error);
                
                // Provide fallback response
                const fallbackMessage = languageDecision.isIcelandic ?
                    "Því miður get ég ekki tengt þig við þjónustufulltrúa núna. Vinsamlegast hringdu í +354 527 6800." :
                    "I'm sorry, I couldn't connect you with a customer service representative. Please call +354 527 6800 for assistance.";
                
                // Add fallback response to context
                addMessageToContext(context, { role: 'assistant', content: fallbackMessage });
                
                // Return error response
                const errorResponseData = await sendBroadcastAndPrepareResponse({
                    message: fallbackMessage,
                    error: error.message,
                    language: {
                        detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                        confidence: languageDecision.confidence,
                        reason: languageDecision.reason
                    },
                    topicType: 'transfer_failed',
                    responseType: 'direct_response'
                });
                
                metrics.totalTime = Date.now() - startTime;
                console.log(`\n⏱️ Total processing time (transfer error): ${metrics.totalTime}ms`);
                
                return res.status(errorResponseData.status || 500).json(errorResponseData);
            }
        }

        // Detect late arrival scenario - now using context system's late arrival tracking
        if (isLateArrivalMessage(userMessage, languageDecision.isIcelandic)) {
            console.log('\n🕒 Late arrival message detected');
            context.lateArrivalContext.isLate = true;
            context.lastTopic = 'late_arrival';
        }

        // Get current season info for hours
        const seasonInfo = getCurrentSeason();
        
        // Update time context tracking if relevant
        if (userMessage.toLowerCase().match(/hour|time|opin|lokar|when|hvenær|ritual|duration/i)) {
            const timeContext = updateTimeContext(userMessage, context, seasonInfo);
            console.log('\n⏰ Time context updated:', timeContext);
        }

        // Update conversation memory with current topic if we found knowledge
        if (knowledgeBaseResults.length > 0) {
            const mainTopic = knowledgeBaseResults[0].type;
            context.lastTopic = mainTopic;
            
            // Add to conversation memory with language info
            context.conversationMemory.addTopic(mainTopic, {
                query: userMessage,
                response: knowledgeBaseResults[0].content,
                language: context.language
            });
        }

        // MIGRATION: Detect if sunset information is relevant
        let sunsetData = null;
        if (isSunsetQuery(userMessage, languageDecision)) {
            console.log('\n🌅 Sunset-related query detected - adding data to context');
            sunsetData = getSunsetDataForContext(userMessage, languageDecision);
        }

        // Check for seasonal context
        if (context.lastTopic === 'seasonal' || 
            userMessage.toLowerCase().match(/winter|summer|holiday|season|vetur|sumar|hátíð|árstíð/i)) {
            
            let seasonalInfo = knowledgeBaseResults.find(k => k.type === 'seasonal_information');
            
            if (seasonalInfo) {
                // Determine season type
                const isWinter = userMessage.toLowerCase().includes('winter') || 
                                userMessage.toLowerCase().includes('northern lights') ||
                                (context.language === 'is' && (
                                    userMessage.toLowerCase().includes('vetur') ||
                                    userMessage.toLowerCase().includes('vetrar') ||
                                    userMessage.toLowerCase().includes('norðurljós')
                                ));
                
                // Store season info
                const newType = isWinter ? 'winter' : 'summer';
                context.lastTopic = 'seasonal';
                
                // Update seasonal context
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
                    currentInfo: seasonalInfo.content
                };
                
                console.log('\n🌍 Seasonal Context Updated:', context.seasonalContext);
            }
        }

        // Add cache key with language
        const cacheKey = `${sessionId}:${userMessage.toLowerCase().trim()}:${context.language}`;
        const cached = responseCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('\n📦 Using cached response:', {
                message: userMessage,
                language: languageDecision.isIcelandic ? 'is' : 'en',
                confidence: languageDecision.confidence
            });
            
           metrics.totalTime = Date.now() - startTime;
           console.log(`\n⏱️ Total processing time (cached): ${metrics.totalTime}ms`);
           
           return res.json(cached.response);
       }

        // Enhanced system prompt with all context
        let systemPrompt = getSystemPrompt(sessionId, 
            userMessage.toLowerCase().match(/hour|open|close|time/i), 
            userMessage, 
            {
                ...languageDecision,
                language: language // Pass explicit language code
            }, 
            sunsetData
        );

        // Add seasonal context to prompt if relevant
        if (context.lastTopic === 'hours' || 
            context.lastTopic === 'seasonal' || 
            userMessage.toLowerCase().includes('hour') || 
            userMessage.toLowerCase().includes('open') || 
            userMessage.toLowerCase().includes('close')) {
            
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
        
        // Prepare messages array
        const messages = [
            { 
                role: "system", 
                content: systemPrompt
            }
        ];

        // Add context awareness from conversation history
        if (context.messages && context.messages.length > 0) {
            messages.push(...context.messages.slice(-5));
        }

        // Add special context for late arrival or booking modification
        if (context.lateArrivalContext?.isLate || context.bookingContext?.hasBookingIntent) {
            messages.push({
                role: "system",
                content: `CURRENT CONTEXT:
                    Language: ${context.language === 'is' ? 'Icelandic' : 'English'}
                    Late Arrival: ${context.lateArrivalContext?.isLate ? 'Yes' : 'No'}
                    Sold Out Status: ${context.soldOutStatus ? 'Yes' : 'No'}
                    Booking Modification: ${context.bookingContext?.hasBookingIntent ? 'Requested' : 'No'}
                    Time of Day: ${new Date().getHours() >= 9 && new Date().getHours() < 19 ? 'During support hours' : 'After hours'}`
            });
        }

        // Handle human agent requests outside hours
        if (transferCheck && transferCheck.enhancePrompt && 
            transferCheck.promptContext?.situation === 'human_requested_outside_hours') {
            
            messages.push({
                role: "system",
                content: `IMPORTANT: The user has specifically requested to speak with a human agent, but our 
                customer service is only available during ${transferCheck.promptContext.operatingHours}.
                
                Generate a helpful, empathetic response that:
                1. Acknowledges their desire to speak with a human agent
                2. Explains when human agents are available
                3. Offers alternative contact methods (phone: ${transferCheck.promptContext.phoneNumber}, 
                   email: ${transferCheck.promptContext.email})
                4. Offers to help with their question yourself where possible
                5. Is conversational and natural, not like a generic message`
            });
        }

        // Conversation continuity check - Check if this is an ongoing conversation
        const isOngoingConversation = context.messages && 
                                     context.messages.filter(m => m.role === 'assistant').length > 0;

        if (isOngoingConversation) {
            messages.push({
                role: "system",
                content: `Note: This is a continuing conversation. Maintain conversation flow without 
                introducing new greetings like "Hello" or "Hello there".`
            });
        }        

        // Add special context for likely conversational messages
        if (userMessage.split(' ').length <= 4 || 
            /^(hi|hello|hey|hæ|halló|thanks|takk|ok|how are you|who are you)/i.test(userMessage)) {
            
            messages.push({
                role: "system",
                content: `This appears to be a conversational message rather than a factual question. Handle it naturally with appropriate small talk, greeting, or acknowledgment responses while maintaining Sky Lagoon's brand voice.`
            });
        }

        // Updated user message with language instructions
        messages.push({
            role: "user",
            content: `Knowledge Base Information: ${JSON.stringify(knowledgeBaseResults)}
            
                User Question: ${userMessage}
            
                Please provide a natural, conversational response. For factual information about Sky Lagoon, use ONLY the information from the knowledge base.
                For greetings, small talk, or acknowledgments, respond naturally without requiring knowledge base information.
            
                Maintain our brand voice and use "our" instead of "the" when referring to facilities and services.
                ${language === 'auto' ? 'IMPORTANT: Respond in the same language as the user\'s question.' : `Response MUST be in ${language} language.`}`
        });

        // Record time before making GPT request
        const gptStart = Date.now();
        
        // Make GPT-4 request with retries
        let attempt = 0;
        let completion;
        while (attempt < MAX_RETRIES) {
            try {
                completion = await openai.chat.completions.create({
                    // Updated to newer model with improved latency and performance
                    model: "gpt-4o", // Previously: "gpt-4-1106-preview"
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
        
        // Record GPT request time
        metrics.gptTime = Date.now() - gptStart;
        console.log(`\n⏱️ GPT request completed in ${metrics.gptTime}ms`);

        // If we get here, we have a successful completion
        if (!completion) {
            throw new Error('Failed to get completion after retries');
        }
        
        // Get the response from GPT
        const response = completion.choices[0].message.content;
        console.log('\n🤖 GPT Response:', response);
        
        // Add AI response to the context system
        addMessageToContext(context, { role: 'assistant', content: response });
        
        // APPLY TERMINOLOGY ENHANCEMENT - Now asynchronous and passing the OpenAI instance
        const enhancedResponse = await enforceTerminology(response, openai);
        console.log('\n✨ Enhanced Response:', enhancedResponse);
        
        // FILTER EMOJIS BEFORE SENDING TO ANALYTICS - using imported function
        const approvedEmojis = SKY_LAGOON_GUIDELINES.emojis;
        const filteredResponse = filterEmojis(enhancedResponse, approvedEmojis);
        console.log('\n🧹 Emoji Filtered Response:', filteredResponse);
        
        // Update assistant message in context with filtered response
        context.messages[context.messages.length - 1].content = filteredResponse;
        
        // Use the unified broadcast system for the GPT response - NOW WITH ENHANCED RESPONSE AND FILTERED EMOJIS
        let postgresqlMessageId = null;
        if (completion && req.body.message) {
            // Create an intermediate response object - WITH ENHANCED RESPONSE AND FILTERED EMOJIS
            const responseObj = {
                message: filteredResponse, // FIXED: Now using fully processed response
                language: {
                    detected: context.language === 'is' ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence,
                    reason: languageDecision.reason
                },
                topicType: context?.lastTopic || 'general',
                responseType: 'gpt_response',
                status: context.status || 'active' // ADD THIS LINE
            };
            
            // Pass through sendBroadcastAndPrepareResponse to broadcast
            const result = await sendBroadcastAndPrepareResponse(responseObj);
            
            // Extract the PostgreSQL ID if available from the result
            postgresqlMessageId = result.postgresqlMessageId || null;
            
            console.log('\n📊 PostgreSQL message ID:', postgresqlMessageId || 'Not available');
        }
        
        // Cache the response
        responseCache.set(cacheKey, {
            response: {
                message: filteredResponse, // Use the fully processed response
                postgresqlMessageId: postgresqlMessageId,
                language: {
                    detected: context.language === 'is' ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence,
                    reason: languageDecision.reason
                }
            },
            timestamp: Date.now()
        });
        
        // Record total processing time
        metrics.totalTime = Date.now() - startTime;
        console.log('\n⏱️ Performance Metrics:', {
            sessionAndLanguage: `${metrics.sessionTime}ms`,
            knowledge: `${metrics.knowledgeTime}ms`,
            transfer: `${metrics.transferTime}ms`,
            // booking metric removed
            gpt: `${metrics.gptTime}ms`,
            total: `${metrics.totalTime}ms`
        });

        // Return the response
        return res.status(200).json({
            message: filteredResponse, // Return the fully processed response
            postgresqlMessageId: postgresqlMessageId,
            language: {
                detected: context.language,
                isIcelandic: context.language === 'is',
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

        // Get language using detection system
        const userMsg = req.body?.message || req.body?.question || '';
        const sessionId = req.body?.sessionId || null;
        
        // Try to get context if possible, for language determination
        let context;
        try {
            context = sessionId ? getSessionContext(sessionId) : null;
        } catch (ctxError) {
            console.error('Error getting context for error handler:', ctxError);
            context = null;
        }
        
        // Detect language for error message
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
        
        metrics.totalTime = Date.now() - startTime;
        console.log(`\n⏱️ Error occurred after ${metrics.totalTime}ms`);
        
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

// Pusher broadcast function with enhanced language detection
// Is this unused? 'handleConversationUpdate' is declared but its value is never read. Used in a different function?
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

    // FIXED: Get persistent session from MongoDB - now passing just the sessionId
    let sessionInfo;
    try {
      // Extract just the sessionId string, not the entire object
      sessionInfo = await getOrCreateSession(conversationData.sessionId);
      
      // CRITICAL FIX: Validate session info
      if (!sessionInfo || !sessionInfo.conversationId || !sessionInfo.sessionId) {
        console.error('❌ Invalid session information:', sessionInfo);
        // Generate new valid IDs if missing
        sessionInfo = {
          conversationId: uuidv4(),
          sessionId: conversationData.sessionId || uuidv4(),
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
        sessionId: conversationData.sessionId || uuidv4(),
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

// Cleanup old cache entries
setInterval(() => {
    const oneHourAgo = Date.now() - CACHE_TTL;
    for (const [key, value] of responseCache.entries()) {
        if (value.timestamp < oneHourAgo) responseCache.delete(key);
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

// Simple test endpoint to check if webhook is reachable
app.get('/webhook/test', (req, res) => {
  console.log('\n✅ Webhook test endpoint reached');
  res.status(200).send('Webhook endpoint is reachable');
});

// Debug webhook to capture all incoming webhook data
app.post('/webhook-debug', (req, res) => {
  console.log('\n📝 DEBUG WEBHOOK RECEIVED:', {
    headers: req.headers,
    body: req.body
  });
  res.status(200).send('OK');
});

// Add this AFTER your existing endpoints but BEFORE app.listen
// ===============================================================
// LiveChat webhook endpoint for receiving agent messages
// This route is currently not being used, but kept for reference
app.post('/webhook/livechat', async (req, res) => {
  // Add these constants at the top of your webhook handler for direct access
  const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e'; 
  const PAT = 'fra:rmSYYwBm3t_PdcnJIOfQf2aQuJc';
  
  try {
    console.log('\n📩 Received webhook from LiveChat:', {
      action: req.body.action,
      type: req.body.payload?.event?.type,
      author: req.body.payload?.event?.author_id,
      chat_id: req.body.payload?.chat_id || req.body.payload?.chat?.id
    });
    
    // Log full payload for debugging
    console.log('\n🔍 Full webhook payload:', JSON.stringify(req.body, null, 2));
    
    // Verify the webhook is authentic
    if (!req.body.action || !req.body.payload) {
      console.warn('\n⚠️ Invalid webhook format');
      return res.status(400).json({ success: false, error: 'Invalid webhook format' });
    }
    
    // Handle incoming_chat events - this contains customer info
    if (req.body.action === 'incoming_chat') {
      try {
        console.log('\n📝 Processing incoming_chat webhook...');
        
        // Extract chat ID and customer info
        const chat = req.body.payload.chat;
        if (!chat || !chat.id) {
          console.warn('\n⚠️ Invalid chat payload in incoming_chat webhook');
          return res.status(200).json({ success: true });
        }
        
        const chatId = chat.id;
        console.log('\n🔍 Processing incoming_chat for chat ID:', chatId);
        
        // Store in global cache
        if (!global.recentWebhooks) {
          global.recentWebhooks = new Map();
        }
        global.recentWebhooks.set(chatId, chat);
        console.log('\n💾 Stored webhook in memory cache');
        
        // Extract session ID from customer email - NEW PRIMARY APPROACH
        const users = chat.users || [];
        const customer = users.find(user => user.type === 'customer');
        
        if (customer && customer.email && customer.email.includes('@skylagoon.com')) {
          // Extract session ID from email
          const sessionId = customer.email.replace('@skylagoon.com', '');
          console.log(`\n✅ Extracted session ID from email: ${chatId} -> ${sessionId}`);
          
          // Store this mapping in memory for immediate use
          if (!global.liveChatSessionMappings) {
            global.liveChatSessionMappings = new Map();
          }
          global.liveChatSessionMappings.set(chatId, sessionId);
          console.log(`\n🔗 Stored mapping in memory: ${chatId} -> ${sessionId}`);
          
          // Also add to recent sessions for failsafe
          if (!global.recentSessions) {
            global.recentSessions = new Set();
          }
          global.recentSessions.add(sessionId);
          console.log(`\n📝 Added ${sessionId} to recent sessions`);
          
          // Also try to store in MongoDB and file-based API for persistence
          try {
            await storeChatSessionMapping(chatId, sessionId);
            console.log('\n✅ Stored mapping in persistent storage');
          } catch (storageError) {
            console.warn('\n⚠️ Could not store in persistent storage:', storageError.message);
          }
        } 
        // Fallback to session_fields if email doesn't contain the session ID
        else if (customer && customer.session_fields && customer.session_fields.length > 0) {
          let sessionId = null;
          
          // First try direct index
          if (customer.session_fields[0].session_id) {
            sessionId = customer.session_fields[0].session_id;
          } else {
            // Then try finding session_id field
            const sessionField = customer.session_fields.find(field => field.session_id);
            if (sessionField) {
              sessionId = sessionField.session_id;
            }
          }
          
          if (sessionId) {
            console.log(`\n✅ Found session ID in session_fields: ${chatId} -> ${sessionId}`);
            
            // Store this mapping in memory for immediate use
            if (!global.liveChatSessionMappings) {
              global.liveChatSessionMappings = new Map();
            }
            global.liveChatSessionMappings.set(chatId, sessionId);
            console.log(`\n🔗 Stored mapping in memory: ${chatId} -> ${sessionId}`);
            
            // Also add to recent sessions for failsafe
            if (!global.recentSessions) {
              global.recentSessions = new Set();
            }
            global.recentSessions.add(sessionId);
            console.log(`\n📝 Added ${sessionId} to recent sessions`);
            
            // Also try to store in persistent storage
            try {
              await storeChatSessionMapping(chatId, sessionId);
            } catch (storageError) {
              console.warn('\n⚠️ Could not store in persistent storage:', storageError.message);
            }
          } else {
            console.warn('\n⚠️ No session_id found in session_fields');
          }
        } else {
          console.warn('\n⚠️ No customer email or session_fields found for extracting session ID');
        }
      } catch (error) {
        console.error('\n❌ Error processing incoming_chat webhook:', error);
      }
      
      // Always return success for incoming_chat events
      return res.status(200).json({ success: true });
    }
    
    // Handle incoming message events - THIS IS THE IMPORTANT PART
    if (req.body.action === 'incoming_event' && req.body.payload.event?.type === 'message') {
      // Call the existing processLiveChatMessage function instead of inline processing
      const result = await processLiveChatMessage(req.body.payload);
      
      if (result.success) {
        console.log('\n✅ LiveChat message processed successfully');
        return res.status(200).json({ success: true });
      } else {
        console.error('\n❌ Failed to process LiveChat message:', result.error);
        return res.status(500).json({ success: false, error: result.error });
      }
    }
    
    // For other webhook types, just acknowledge receipt
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('\n❌ Webhook processing error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Register LiveChat webhook on server startup
(async () => {
  try {
    // Wait a moment for server to be fully started
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Production URL (can be overridden with environment variable)
    const webhookUrl = process.env.WEBHOOK_URL || 'https://sky-lagoon-chat-2024.vercel.app/api/webhook-livechat';
    
    console.log('\n🔄 Registering LiveChat webhook at:', webhookUrl);
    
    const result = await registerLiveChatWebhook(webhookUrl);
    
    if (result.success) {
      console.log('\n✅ LiveChat webhook registration successful:', result.webhookId);
    } else {
      console.error('\n❌ LiveChat webhook registration failed:', result.error);
    }
    
    // Register a secondary debug webhook
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const debugWebhookUrl = process.env.WEBHOOK_URL
      ? process.env.WEBHOOK_URL.replace('/api/webhook-livechat', '/api/webhook-debug')
      : 'https://sky-lagoon-chat-2024.vercel.app/api/webhook-debug';
    
    console.log('\n🔄 Registering DEBUG webhook at:', debugWebhookUrl);
    
    const debugResult = await registerLiveChatWebhook(debugWebhookUrl);
    
    if (debugResult.success) {
      console.log('\n✅ DEBUG webhook registration successful:', debugResult.webhookId);
    } else {
      console.error('\n❌ DEBUG webhook registration failed:', debugResult.error);
    }

    // NEW CODE: Ensure the livechat_mappings collection exists
    console.log('\n🔄 Ensuring livechat_mappings collection exists...');
    await ensureMappingCollection();

  } catch (error) {
    console.error('\n❌ Error during webhook registration:', error);
  }
})();

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