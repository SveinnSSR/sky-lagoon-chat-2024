// promptManager.js
// Advanced Dynamic Prompt System with contextSystem.js Integration
// Handles sophisticated assembly of prompt modules for Sky Lagoon chatbot

// Feature flag to control whether to use the new modular system
// Initially set to false to allow A/B testing and gradual rollout
const USE_MODULAR_PROMPTS = process.env.USE_MODULAR_PROMPTS === 'true' || false;

// Import the original getSystemPrompt to use when feature flag is off
import { getSystemPrompt } from './systemPrompts.js';

// Import context system components
import { 
  getSessionContext, 
  updateTopicContext,
  IntentHierarchy,
  TopicGraph, // Not used currently. Should we implement it?
  AdaptiveMemory, // Not used currently. Should we implement it?
  getVectorKnowledge,
  getKnowledgeWithFallbacks,
  updateLanguageContext
} from './contextSystem.js';

// Import knowledge base components
import { getRelevantKnowledge } from './knowledgeBase.js';
import { getRelevantKnowledge_is } from './knowledgeBase_is.js';

// Configure logging
const DEBUG_LEVEL = process.env.PROMPT_DEBUG_LEVEL || 'info'; // 'debug', 'info', 'warn', 'error'

// Logger utility
const logger = {
  debug: (...args) => DEBUG_LEVEL === 'debug' && console.log('\n🔍 [PROMPT-DEBUG]', ...args),
  info: (...args) => ['debug', 'info'].includes(DEBUG_LEVEL) && console.log('\n📝 [PROMPT-INFO]', ...args),
  warn: (...args) => ['debug', 'info', 'warn'].includes(DEBUG_LEVEL) && console.log('\n⚠️ [PROMPT-WARN]', ...args),
  error: (...args) => console.error('\n❌ [PROMPT-ERROR]', ...args)
};

// Simple module usage logger
function logModuleUsage(modules) {
  const moduleNames = modules.map(modulePath => {
    // Extract friendly name from path (e.g., 'core/identity' -> 'Identity')
    const parts = modulePath.split('/');
    const name = parts[parts.length - 1];
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');
  });
  
  console.log(`\n📊 [MODULES USED]: ${JSON.stringify(moduleNames)}`);
  return modules; // Return modules for chaining
}

// Performance watchdog
function checkPerformance(metrics, query, modules) {
  const warnings = [];
  
  if (metrics.knowledgeTime > 3500) {
    warnings.push(`Slow knowledge retrieval (${metrics.knowledgeTime}ms)`);
  }
  
  if (metrics.promptTime > 2000) {
    warnings.push(`Slow prompt assembly (${metrics.promptTime}ms)`);
  }
  
  if (metrics.totalTime > 8000) {
    warnings.push(`Slow total processing (${metrics.totalTime}ms)`);
  }
  
  if (warnings.length > 0) {
    const moduleNames = modules.map(m => m.split('/').pop());
    console.log(`\n⚠️ [QA FLAG] ${warnings.join(', ')} for query: "${query.substring(0, 50)}..." Modules: ${JSON.stringify(moduleNames)} Total time: ${metrics.totalTime}ms`);
  }
}

// Explicitly import all modules
// Core modules
import * as identityModule from './prompts/core/identity.js';
import * as responseRulesModule from './prompts/core/response_rules.js';
import * as personalityModule from './prompts/core/personality.js';

// Services modules
import * as packagesModule from './prompts/services/packages.js';
import * as ritualModule from './prompts/services/ritual.js';
import * as facilitiesModule from './prompts/services/facilities.js';
import * as diningModule from './prompts/services/dining.js';

// Policies modules
import * as lateArrivalModule from './prompts/policies/late_arrival.js';
import * as agePolicyModule from './prompts/policies/age_policy.js';
import * as bookingChangeModule from './prompts/policies/booking_change.js';

// Formatting modules
import * as linksModule from './prompts/formatting/links.js';
import * as timeFormatModule from './prompts/formatting/time_format.js';
import * as responseFormatModule from './prompts/formatting/response_format.js';

// Language modules
import * as icelandicRulesModule from './prompts/language/icelandic_rules.js';
import * as englishRulesModule from './prompts/language/english_rules.js';

// Seasonal modules
import * as currentSeasonModule from './prompts/seasonal/current_season.js';

// Module registry for easy lookup
const moduleRegistry = {
  'core/identity': identityModule,
  'core/response_rules': responseRulesModule,
  'core/personality': personalityModule,
  'services/packages': packagesModule,
  'services/ritual': ritualModule,
  'services/facilities': facilitiesModule,
  'services/dining': diningModule,
  'policies/late_arrival': lateArrivalModule,
  'policies/age_policy': agePolicyModule,
  'policies/booking_change': bookingChangeModule,
  'formatting/links': linksModule,
  'formatting/time_format': timeFormatModule,
  'formatting/response_format': responseFormatModule,
  'language/icelandic_rules': icelandicRulesModule,
  'language/english_rules': englishRulesModule,
  'seasonal/current_season': currentSeasonModule,
};

// Module metadata for advanced selection
const moduleMetadata = {
  'core/identity': {
    priority: 'critical',
    description: 'Core identity and branding for Sólrún',
    alwaysInclude: true,
    category: 'foundation'
  },
  'core/response_rules': {
    priority: 'critical',
    description: 'Critical response guidelines and rules',
    alwaysInclude: true,
    category: 'foundation'
  },
  'core/personality': {
    priority: 'high',
    description: 'Conversational tone and personality',
    alwaysInclude: true,
    category: 'foundation'
  },
  'services/packages': {
    priority: 'high',
    description: 'Package information and pricing',
    relatedTopics: ['pricing', 'packages', 'booking', 'offerings', 'tickets', 'cost'],
    category: 'services'
  },
  'services/ritual': {
    priority: 'high',
    description: 'Ritual information and process',
    relatedTopics: ['ritual', 'skjol', 'skjól', 'experience', 'steps', 'process', 'bathing'],
    category: 'services'
  },
  'services/facilities': {
    priority: 'medium',
    description: 'Facility information',
    relatedTopics: ['facilities', 'amenities', 'changing', 'shower', 'lockers', 'accessibility'],
    category: 'services'
  },
  'services/dining': {
    priority: 'medium',
    description: 'Dining options and information',
    relatedTopics: ['food', 'dining', 'restaurant', 'bar', 'drink', 'eat', 'menu'],
    category: 'services'
  },
  'policies/late_arrival': {
    priority: 'medium',
    description: 'Late arrival policy and handling',
    relatedTopics: ['late', 'delay', 'miss', 'arrival', 'time', 'booking'],
    category: 'policies'
  },
  'policies/age_policy': {
    priority: 'medium',
    description: 'Age restriction policies',
    relatedTopics: ['age', 'child', 'children', 'kid', 'baby', 'minor', 'restriction'],
    category: 'policies'
  },
  'policies/booking_change': {
    priority: 'high',
    description: 'Booking change and cancellation procedures',
    relatedTopics: ['cancel', 'change', 'booking', 'reschedule', 'refund', 'modify'],
    category: 'policies'
  },
  'formatting/links': {
    priority: 'low',
    description: 'Link formatting guidelines',
    alwaysInclude: false,
    category: 'formatting'
  },
  'formatting/time_format': {
    priority: 'low',
    description: 'Time formatting standards',
    relatedTopics: ['time', 'hour', 'opening', 'closing', 'schedule'],
    category: 'formatting'
  },
  'formatting/response_format': {
    priority: 'medium',
    description: 'Response structure guidelines',
    alwaysInclude: true,
    category: 'formatting'
  },
  'language/icelandic_rules': {
    priority: 'medium',
    description: 'Icelandic language rules',
    includeWhen: (context) => context.language === 'is' || context.languageInfo?.isIcelandic,
    category: 'language'
  },
  'language/english_rules': {
    priority: 'medium',
    description: 'English language rules',
    includeWhen: (context) => context.language === 'en' || !context.languageInfo?.isIcelandic,
    category: 'language'
  },
  'seasonal/current_season': {
    priority: 'medium',
    description: 'Current season information',
    alwaysInclude: true,
    category: 'seasonal'
  },
};

/**
 * Gets content from a specified module for the appropriate language
 * @param {string} modulePath - Module identifier (e.g., 'core/identity')
 * @param {Object} languageDecision - Information about detected language
 * @returns {string} The prompt content for the specified language
 */
function getModuleContent(modulePath, languageDecision) {
  try {
    const module = moduleRegistry[modulePath];
    if (!module) {
      logger.warn(`Module not found: ${modulePath}`);
      return '';
    }
    
    const language = languageDecision?.isIcelandic ? 'is' : 'en';
    
    // Get content based on language
    const content = language === 'is' ? 
      (module.getIcelandicPrompt ? module.getIcelandicPrompt() : module.getPrompt('is')) :
      (module.getEnglishPrompt ? module.getEnglishPrompt() : module.getPrompt('en'));
    
    return content || '';
  } catch (error) {
    logger.error(`Error loading module ${modulePath}:`, error);
    return ''; // Return empty string on error
  }
}

/**
 * Analyzes a message using contextSystem's topic detection 
 * @param {string} message - User message
 * @param {Object} context - Session context
 * @returns {Object} Analyzed topic information
 */
async function analyzeMessageIntent(message, context) {
  // Update topic context using contextSystem's sophisticated detection
  updateTopicContext(context, message);
  
  // Get intent hierarchy from context or create if needed
  if (!context.intentHierarchy || typeof context.intentHierarchy.updateIntent !== 'function') {
    logger.info('Creating new intent hierarchy for message analysis');
    context.intentHierarchy = new IntentHierarchy();
  }
  
  // Extract topics from the message using contextSystem.js capabilities
  const normalizedMessage = message.toLowerCase();
  
  // Get vector knowledge to enhance topic understanding (this leverages embeddings)
  try {
    const vectorResults = await getVectorKnowledge(message, context);
    
    // Use vector results to inform intent detection
    if (vectorResults && vectorResults.length > 0) {
      // Extract topics from vector results
      for (const result of vectorResults) {
        if (result.type && typeof result.type === 'string') {
          // Boost relevant intents based on vector search results
          context.intentHierarchy.updateIntent(result.type, 0.5 * (result.similarity || 0.5));
          logger.debug(`Enhanced intent from vector search: ${result.type} (${result.similarity || 'unknown'} similarity)`);
        }
      }
    }
  } catch (error) {
    logger.warn('Error in vector knowledge enhancement:', error.message);
    // Continue without vector enhancement
  }
  
  // Prepare result with intent information
  const result = {
    primaryIntent: context.intentHierarchy.primaryIntent,
    secondaryIntents: context.intentHierarchy.secondaryIntents || [],
    allIntents: Object.fromEntries(context.intentHierarchy.intentStrength || new Map()),
    lastTopic: context.lastTopic,
    topics: context.topics || [],
    isQuestion: normalizedMessage.endsWith('?'),
    isGreeting: /^(hello|hi|hey|good\s(morning|afternoon|evening)|hæ|halló|góðan\s(dag|morgun|kvöld))/i.test(normalizedMessage),
    intentProbabilities: {},
    topicPredictions: []
  };
  
  // Add intent probabilities
  if (context.intentHierarchy && typeof context.intentHierarchy.intentProbability === 'function') {
    for (const intent of [result.primaryIntent, ...result.secondaryIntents]) {
      if (intent) {
        result.intentProbabilities[intent] = context.intentHierarchy.intentProbability(intent);
      }
    }
  }
  
  // Add topic predictions if available
  if (context.topicGraph && typeof context.topicGraph.predictNextTopics === 'function' && context.lastTopic) {
    result.topicPredictions = context.topicGraph.predictNextTopics(context.lastTopic);
  }

  // Special detection for time queries using contextSystem's patterns
  const timePatterns = /(hour|open|close|time|opin|opið|lokað|lokar)/i;
  result.isTimeQuery = timePatterns.test(normalizedMessage);
  
  // Add booking change detection
  if (context.bookingContext && context.bookingContext.hasBookingChangeIntent) {
    result.isBookingChangeQuery = true;
    result.bookingChangeConfidence = context.bookingContext.bookingChangeConfidence || 0;
    
    // Force booking_change as primary intent for high confidence booking changes
    if (context.bookingContext.bookingChangeConfidence >= 0.8) {
      result.primaryIntent = 'booking_change';
    }
  }
  
  // Add late arrival detection
  if (context.lateArrivalContext && context.lateArrivalContext.isLate) {
    result.isLateArrivalQuery = true;
    
    // Force late_arrival as primary intent for confirmed late arrival context
    if (context.lateArrivalContext.isLate === true) {
      result.primaryIntent = 'late_arrival';
    }
  }

  logger.info(`Message intent analysis:`, {
    primaryIntent: result.primaryIntent,
    secondaryIntents: result.secondaryIntents.slice(0, 2),
    lastTopic: result.lastTopic,
    isQuestion: result.isQuestion,
    isTimeQuery: result.isTimeQuery,
    isBookingChange: result.isBookingChangeQuery,
    isLateArrival: result.isLateArrivalQuery
  });
  
  return result;
}

/**
 * Determines which modules are relevant based on sophisticated context analysis
 * Leverages the advanced contextSystem.js for intent and topic detection
 * 
 * @param {string} userMessage - The user's message
 * @param {Object} context - The session context
 * @param {Object} languageDecision - Information about detected language
 * @param {boolean} isHoursQuery - Whether this is a hours-related query
 * @returns {Array<string>} Array of module paths to include
 */
async function determineRelevantModules(userMessage, context, languageDecision, isHoursQuery) {
  // Analyze message for intent and topic detection using contextSystem.js
  const intentAnalysis = await analyzeMessageIntent(userMessage, context);
  
  // Track modules and their confidence scores
  const moduleScores = new Map();
  
  // Start with critical modules (always included)
  const criticalModules = Object.entries(moduleMetadata)
    .filter(([, metadata]) => metadata.priority === 'critical' || metadata.alwaysInclude === true)
    .map(([modulePath]) => modulePath);
    
  for (const modulePath of criticalModules) {
    moduleScores.set(modulePath, 1.0); // Maximum confidence for critical modules
  }
  
  // Add language-specific modules
  const languageModule = languageDecision?.isIcelandic ? 'language/icelandic_rules' : 'language/english_rules';
  moduleScores.set(languageModule, 1.0);
  
  // Add formatting module (generally useful)
  moduleScores.set('formatting/response_format', 0.9);
  
  // Add modules based on intent hierarchy (sophisticated approach)
  if (intentAnalysis.primaryIntent) {
    // Find modules related to primary intent
    for (const [modulePath, metadata] of Object.entries(moduleMetadata)) {
      if (criticalModules.includes(modulePath)) continue; // Skip already added modules
      
      const relatedTopics = metadata.relatedTopics || [];
      
      // Check if module is related to primary intent
      if (relatedTopics.includes(intentAnalysis.primaryIntent) || 
          modulePath.includes(intentAnalysis.primaryIntent)) {
        
        // Add with high confidence (scaled by intent probability)
        const intentProb = intentAnalysis.intentProbabilities[intentAnalysis.primaryIntent] || 0.8;
        moduleScores.set(modulePath, 0.9 * intentProb);
        logger.debug(`Adding module ${modulePath} based on primary intent (${intentAnalysis.primaryIntent}) with score ${0.9 * intentProb}`);
      }
    }
  }
  
  // Add modules based on secondary intents (with lower confidence)
  for (const secondaryIntent of intentAnalysis.secondaryIntents.slice(0, 2)) { // Consider top 2 secondary intents
    if (!secondaryIntent) continue;
    
    // Find modules related to secondary intent
    for (const [modulePath, metadata] of Object.entries(moduleMetadata)) {
      if (criticalModules.includes(modulePath)) continue; // Skip already added
      if (moduleScores.has(modulePath)) continue; // Skip if already scored
      
      const relatedTopics = metadata.relatedTopics || [];
      
      // Check if module is related to secondary intent
      if (relatedTopics.includes(secondaryIntent) || 
          modulePath.includes(secondaryIntent)) {
        
        // Add with moderate confidence (scaled by intent probability)
        const intentProb = intentAnalysis.intentProbabilities[secondaryIntent] || 0.5;
        moduleScores.set(modulePath, 0.7 * intentProb);
        logger.debug(`Adding module ${modulePath} based on secondary intent (${secondaryIntent}) with score ${0.7 * intentProb}`);
      }
    }
  }
  
  // Add modules based on topic predictions from topic graph (context continuity)
  if (intentAnalysis.topicPredictions && intentAnalysis.topicPredictions.length > 0) {
    for (const prediction of intentAnalysis.topicPredictions.slice(0, 2)) { // Top 2 predictions
      // Find modules related to predicted topics
      for (const [modulePath, metadata] of Object.entries(moduleMetadata)) {
        if (moduleScores.has(modulePath)) continue; // Skip if already scored
        
        const relatedTopics = metadata.relatedTopics || [];
        
        // Check if module is related to predicted topic
        if (relatedTopics.includes(prediction.topic) || 
            modulePath.includes(prediction.topic)) {
          
          // Add with lower confidence based on prediction strength
          const predictionScore = Math.min(prediction.strength / 10, 0.6); // Normalize and cap
          moduleScores.set(modulePath, predictionScore);
          logger.debug(`Adding module ${modulePath} based on topic prediction (${prediction.topic}) with score ${predictionScore}`);
        }
      }
    }
  }
  
  // Special case handling based on contextSystem.js detection
  
  // Time queries
  if (intentAnalysis.isTimeQuery || isHoursQuery) {
    moduleScores.set('formatting/time_format', 0.95);
    logger.debug('Adding time_format module for time query');
  }
  
  // Booking change queries
  if (intentAnalysis.isBookingChangeQuery || 
      context.bookingContext?.hasBookingChangeIntent ||
      intentAnalysis.primaryIntent === 'booking_change') {
    moduleScores.set('policies/booking_change', 0.95);
    logger.debug('Adding booking_change module for booking modification query');
  }
  
  // Late arrival queries
  if (intentAnalysis.isLateArrivalQuery || 
      context.lateArrivalContext?.isLate ||
      intentAnalysis.primaryIntent === 'late_arrival') {
    moduleScores.set('policies/late_arrival', 0.95);
    logger.debug('Adding late_arrival module for late arrival query');
  }
  
  // Add seasonal context (generally useful)
  moduleScores.set('seasonal/current_season', 0.8);
  
  // Special context-driven additions from contextSystem.js context
  
  // Add ritual information for new users or during first interactions
  if (context.messageCount <= 3) {
    moduleScores.set('services/ritual', 0.75);
    logger.debug('Adding ritual module for new conversation');
  }
  
  // Apply adaptive threshold - use modules with confidence above threshold
  const CONFIDENCE_THRESHOLD = 0.5;
  const selectedModules = [...moduleScores.entries()]
    .filter(([, score]) => score >= CONFIDENCE_THRESHOLD)
    .sort((a, b) => b[1] - a[1]) // Sort by descending confidence
    .map(([modulePath]) => modulePath);
  
  // Make sure we don't have too many modules - limit to reasonable size
  const MAX_MODULES = 12;
  const finalModules = selectedModules.slice(0, MAX_MODULES);
  
  logger.info(`Selected ${finalModules.length} modules:`, finalModules);
  
  // Log modules using our custom module logger
  logModuleUsage(finalModules);
  
  return finalModules;
}

/**
 * Assembles the final prompt from the selected modules
 * @param {Array<string>} modules - Array of module paths
 * @param {string} sessionId - The session ID
 * @param {Object} languageDecision - Information about detected language
 * @param {Object} context - The session context
 * @param {Array} relevantKnowledge - Relevant knowledge base entries
 * @returns {string} The assembled prompt
 */
function assemblePrompt(modules, sessionId, languageDecision, context, relevantKnowledge = [], sunsetData = null) {
  const language = languageDecision?.isIcelandic ? 'is' : 'en';
  let assembledPrompt = '';
  
  // Log the modules being used
  logger.info(`Using prompt modules:`, modules);
  
  // Performance tracking
  const startTime = Date.now();
  const moduleSizes = {};
  
  // Load each module and append to the assembled prompt in priority order
  // First add critical foundation modules
  const foundationModules = modules.filter(m => moduleMetadata[m]?.category === 'foundation');
  for (const modulePath of foundationModules) {
    const moduleContent = getModuleContent(modulePath, languageDecision);
    if (moduleContent) {
      assembledPrompt += moduleContent + '\n\n';
      moduleSizes[modulePath] = moduleContent.length;
    }
  }
  
  // Then add language modules
  const languageModules = modules.filter(m => moduleMetadata[m]?.category === 'language');
  for (const modulePath of languageModules) {
    const moduleContent = getModuleContent(modulePath, languageDecision);
    if (moduleContent) {
      assembledPrompt += moduleContent + '\n\n';
      moduleSizes[modulePath] = moduleContent.length;
    }
  }
  
  // Then add service modules
  const serviceModules = modules.filter(m => moduleMetadata[m]?.category === 'services');
  for (const modulePath of serviceModules) {
    const moduleContent = getModuleContent(modulePath, languageDecision);
    if (moduleContent) {
      assembledPrompt += moduleContent + '\n\n';
      moduleSizes[modulePath] = moduleContent.length;
    }
  }
  
  // Then add policy modules
  const policyModules = modules.filter(m => moduleMetadata[m]?.category === 'policies');
  for (const modulePath of policyModules) {
    const moduleContent = getModuleContent(modulePath, languageDecision);
    if (moduleContent) {
      assembledPrompt += moduleContent + '\n\n';
      moduleSizes[modulePath] = moduleContent.length;
    }
  }
  
  // Then add seasonal modules
  const seasonalModules = modules.filter(m => moduleMetadata[m]?.category === 'seasonal');
  for (const modulePath of seasonalModules) {
    const moduleContent = getModuleContent(modulePath, languageDecision);
    if (moduleContent) {
      assembledPrompt += moduleContent + '\n\n';
      moduleSizes[modulePath] = moduleContent.length;
    }
  }
  
  // Finally add formatting modules
  const formattingModules = modules.filter(m => moduleMetadata[m]?.category === 'formatting');
  for (const modulePath of formattingModules) {
    const moduleContent = getModuleContent(modulePath, languageDecision);
    if (moduleContent) {
      assembledPrompt += moduleContent + '\n\n';
      moduleSizes[modulePath] = moduleContent.length;
    }
  }
  
  // Add sunset information if available
  if (sunsetData) {
    assembledPrompt += `\n\nSUNSET INFORMATION:
Today's sunset time in Reykjavik is at ${sunsetData.todaySunset.formatted} (${sunsetData.todaySunset.formattedLocal}).
Today's opening hours are ${sunsetData.todayOpeningHours}.
`;
    
    if (sunsetData.specificMonth && !sunsetData.specificMonth.isCurrentMonth) {
      assembledPrompt += `\nFor ${sunsetData.specificMonth.name}, the average sunset time is ${sunsetData.specificMonth.sunsetTime.formatted} (${sunsetData.specificMonth.sunsetTime.formattedLocal}).\n`;
    }
    
    assembledPrompt += `\nFor ideal sunset viewing at Sky Lagoon, guests should arrive 1-2 hours before sunset. The views of the sunset from our infinity edge are spectacular.\n`;
  }
  
  // Add the knowledge base content if available
  if (relevantKnowledge.length > 0) {
    assembledPrompt += '\n\nKNOWLEDGE BASE DATA:';
    relevantKnowledge.forEach(info => {
      assembledPrompt += `\n\n${info.type.toUpperCase()}:\n${JSON.stringify(info.content, null, 2)}`;
    });
  }
  
  // Add conversation context information
  const conversationContext = [];
  
  // Add message history context if available (most recent messages)
  if (context.messages && context.messages.length > 0) {
    const recentMessages = context.messages.slice(-3); // Last 3 messages
    if (recentMessages.length > 0) {
      const messageHistory = recentMessages.map(m => 
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.substring(0, 100)}${m.content.length > 100 ? '...' : ''}`
      ).join('\n');
      
      conversationContext.push(`Recent interaction: ${messageHistory}`);
    }
  }
  
  // Add primary intent context if available
  if (context.intentHierarchy && context.intentHierarchy.primaryIntent) {
    conversationContext.push(`Primary user intent: ${context.intentHierarchy.primaryIntent}`);
  }
  
  // Add time context if relevant
  if (context.timeContext && context.timeContext.lastDiscussedTime) {
    const timeCtx = context.timeContext.lastDiscussedTime;
    conversationContext.push(`Time context: ${timeCtx.type || 'general'} - ${timeCtx.time || ''}`);
  }
  
  // Add booking context if relevant
  if (context.bookingContext && context.bookingContext.hasBookingIntent) {
    const bookingCtx = [];
    if (context.bookingContext.preferredDate) bookingCtx.push(`date: ${context.bookingContext.preferredDate}`);
    if (context.bookingContext.people) bookingCtx.push(`people: ${context.bookingContext.people}`);
    if (context.bookingContext.packages) bookingCtx.push(`package: ${context.bookingContext.packages}`);
    
    if (bookingCtx.length > 0) {
      conversationContext.push(`Booking context: ${bookingCtx.join(', ')}`);
    }
  }
  
  // Add late arrival context if active
  if (context.lateArrivalContext && context.lateArrivalContext.isLate) {
    conversationContext.push(`Late arrival context: active`);
  }
  
  // Add seasonal context if available
  if (context.currentSeason) {
    conversationContext.push(`Current season: ${context.currentSeason}`);
  }
  
  // Add the conversation context if we have any
  if (conversationContext.length > 0) {
    assembledPrompt += '\n\nCONVERSATION CONTEXT:\n';
    assembledPrompt += conversationContext.join('\n');
  }
  
  // Add final language instruction
  if (language === 'is') {
    assembledPrompt += `\n\nRESPOND IN ICELANDIC.`;
  } else {
    assembledPrompt += `\n\nRESPOND IN ENGLISH.`;
  }
  
  // Performance metrics
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  logger.info(`Prompt assembly stats:`, {
    promptLength: assembledPrompt.length,
    moduleCount: modules.length,
    assemblyTime: `${totalTime}ms`
  });
  
  // Log module sizes for optimization insights
  logger.debug('Module sizes:', moduleSizes);
  
  return assembledPrompt;
}

/**
 * Main function to get the system prompt, with the same API as the original
 * @param {string} sessionId - The session ID
 * @param {boolean} isHoursQuery - Whether this is a hours-related query
 * @param {string} userMessage - The user's message
 * @param {Object} languageDecision - Information about detected language
 * @param {Object} sunsetData - Optional sunset data
 * @returns {string} The system prompt
 */
export async function getOptimizedSystemPrompt(sessionId, isHoursQuery, userMessage, languageDecision, sunsetData = null) {
  // Add clear indicator that modular system is active
  console.log('MODULAR-SYSTEM-ACTIVE'); // No emoji, simple text - see if this log appears on vercel now
  
  // Track performance
  const startTime = Date.now();
  let knowledgeStart = 0;
  let knowledgeEnd = 0;
  let modulesSelectionEnd = 0;
  let promptAssemblyEnd = 0;
  
  // If feature flag is off, use the original getSystemPrompt
  if (!USE_MODULAR_PROMPTS) {
    logger.info('Using legacy monolithic prompt system (feature flag off)');
    return getSystemPrompt(sessionId, isHoursQuery, userMessage, languageDecision, sunsetData);
  }
  
  try {
    // Get the session context
    const context = getSessionContext(sessionId);
    
    // Update language context for this interaction
    updateLanguageContext(context, userMessage);
    
    // Determine which modules to include using advanced context analysis
    const modulesSelectionStart = Date.now();
    const modules = await determineRelevantModules(userMessage, context, languageDecision, isHoursQuery);
    modulesSelectionEnd = Date.now();
    
    // Get relevant knowledge base entries using advanced retrieval
    knowledgeStart = Date.now();
    const relevantKnowledge = await getKnowledgeWithFallbacks(userMessage, context);
    knowledgeEnd = Date.now();
    
    // Assemble the final prompt using the dynamic module system
    const promptAssemblyStart = Date.now();
    const assembledPrompt = assemblePrompt(modules, sessionId, languageDecision, context, relevantKnowledge, sunsetData);
    promptAssemblyEnd = Date.now();
    
    // Performance metrics
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const metrics = {
      modulesSelectionTime: modulesSelectionEnd - modulesSelectionStart,
      knowledgeTime: knowledgeEnd - knowledgeStart,
      promptTime: promptAssemblyEnd - promptAssemblyStart,
      totalTime: totalTime
    };
    
    logger.info(`Dynamic prompt generation complete:`, {
      promptLength: assembledPrompt.length,
      moduleCount: modules.length,
      totalTime: `${totalTime}ms`,
      ...metrics
    });
    
    // Check performance 
    checkPerformance(metrics, userMessage, modules);
    
    return assembledPrompt;
  } catch (error) {
    logger.error(`Error in dynamic prompt generation:`, error);
    logger.error(`Stack trace:`, error.stack);
    
    // Fallback to original system in case of errors
    logger.info(`Falling back to legacy prompt system due to error`);
    return getSystemPrompt(sessionId, isHoursQuery, userMessage, languageDecision, sunsetData);
  }
}

export default getOptimizedSystemPrompt;