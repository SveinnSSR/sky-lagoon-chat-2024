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
    alwaysInclude: true,
    relatedTopics: [
      // General package terms
      'pricing', 'packages', 'booking', 'offerings', 'tickets', 'cost',
      'price', 'prices', 'how much', 'admission', 'pass', 'entry fee',
      'discount', 'special offer', 'sale', 'deal',
    
      // Package types
      'saman', 'ser', 'sér', 'multi-pass', 'multipass', 'hefð', 'venja',
      'standard', 'premium', 'basic', 'deluxe', 'for two', 'date night',
      'stefnumót', 'stefnumótspakki', 'couples', 'duo',
    
      // Legacy package names
      'pure', 'sky', 'pure lite', 'pure pass', 'sky pass', 'pure package',
      'sky package', 'pure-lite', 'sky aðgangur', 'pure aðgangur',
    
      // Currency terms
      'dollar', 'usd', 'euro', 'eur', 'pound', 'gbp', 'cad', 'isk',
      'krona', 'króna', 'krónum', 'currency', 'exchange rate', 'american dollars',
    
      // Gift card terms
      'gift card', 'gift certificate', 'gift voucher', 'gjafakort', 'gjafabréf',
      'yay', 'yay card', 'yay gjafakort', 'redeem', 'gift ticket', 'redemption',
      'gift card upgrade', 'uppfæra gjafakort', 'gift card code',
    
      // Third-party discount programs
      'fríða', 'frida', 'meniga', 'íslandsbanki', 'vís', 'vis', 'islandsbanki',
      'endurgreiðsla', 'endurgreiðslu', 'banking app', 'insurance', 'trygging',
    
      // Product information
      'scrub', 'body scrub', 'lotion', 'shampoo', 'conditioner', 'fragrance',
      'ship', 'shipping', 'products', 'buy online', 'purchase', 'salt scrub',
      'sky products', 'home fragrance', 'gift sets',
    
      // Amenities mentioned in packages
      'towel', 'handklæði', 'robe', 'slippers', 'flip-flops', 'changing room',
      'private changing', 'swimwear', 'sundföt', 'rental', 'premium amenities',
    
      // Icelandic terms
      'verð', 'pakki', 'pakkinn', 'aðgangur', 'bóka', 'kostar', 'tilboð',
      'afslátt', 'tvær leiðir', 'saman pakki', 'sér pakki', 'afsláttur',
    
      // Vector search intents
      'gift_cards_booking_upgrade_info_ser_from_saman',
      'packages_upgrades_response_with_gift_card',
      'packages_pricing', 'saman_vs_ser', 'multipass_info', 'packages_date_night',
      'packages_currency', 'product_info', 'discounts_promotions'
    ],
    category: 'services'
  },
  'services/ritual': {
    priority: 'high',
    description: 'Ritual information and process',
    relatedTopics: ['ritual', 'skjol', 'skjól', 'experience', 'steps', 'process', 'bathing'],
    category: 'services'
  },
  'services/facilities': {
    priority: 'high',
    description: 'Facility information',
    relatedTopics: [
      // English general terms
      'facilities', 'amenities', 'changing', 'shower', 'lockers', 'accessibility',
      // Swimwear terms
      'swimwear', 'rental', 'bathing suit', 'swimming trunks', 'bikini',
      // Accessibility terms
      'wheelchair', 'disabled', 'disability', 'mobility', 'accessible', 'chair lift',
      // Transportation-specific terms
      'bsi', 'bsí', 'bus terminal', 'terminal', 'get to', 'travel to', 'reach',
      'bus stop', 'bus station', 'tour bus', 'transfer service', 'excursion',
      // Massage-related (for negative responses)
      'massage', 'spa treatment', 'therapy',
      // Amenities specifics
      'towels', 'robes', 'slippers', 'flip-flops', 'hairdryer', 'hair dryer',
      // Location/transport
      'location', 'directions', 'transportation', 'shuttle', 'drive', 'parking',
      // Icelandic terms
      'sundföt', 'aðstaða', 'búningsaðstaða', 'nudd', 'staðsetning',
      // Vector-derived intents
      'facilities_amenities', 'facilities_services', 'facilities_accessibility'
    ],
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
    relatedTopics: [
      // English time-related terms
      'late', 'delay', 'missed', 'miss', 'arrival', 'time', 
      'grace period', 'window', 'after booking', 'check in window',
      'arrive late', 'late arrival', 'delayed', 'traffic', 'flight delay',
      '30 minutes', 'half hour', 'hour late', 'arrive before',
      // Scenario terms
      'stuck in traffic', 'flight delayed', 'lost', 'running late',
      'missing my time', 'past my booking', 'after my time',
      // Icelandic terms
      'seinkun', 'seinkar', 'sein', 'of sein', 'bókaðan tíma', 
      'svigrúm', 'umferðarteppa', 'missa af', 
      '30 mínútur', 'hálftíma', 'klst sein',
      // Vector intents
      'policy_late_arrival', 'arrival_policy'
    ],
    category: 'policies'
  },
  'policies/age_policy': {
    priority: 'high',
    description: 'Age restriction policies',
    relatedTopics: [
      // English terms
      'age', 'child', 'children', 'kid', 'kids', 'baby', 'minor', 'restriction',
      'minimum age', 'age limit', 'age policy', 'how old', 'allowed age',
      'bring kids', 'family friendly', 'child friendly', 'young', 'younglings',
      'teenager', 'teen', 'baby', 'infant', 'years old', 'under',
      // Icelandic terms
      'aldurstakmark', 'aldurstak', 'börn', 'barnið', 'barn', 
      'ungmenni', 'unglingar', 'má koma með', 'ára gamall',
      'ára gömul', 'unglingur', 'aldur', 'lágmarksaldur',
      // Vector intents
      'policy_age', 'policies_children', 'age_requirement'
    ],
    category: 'policies'
  },
  'policies/booking_change': {
    priority: 'high',
    description: 'Booking change and cancellation procedures',
    relatedTopics: [
      // English change/cancellation terms
      'cancel', 'change', 'modify', 'booking', 'reschedule', 'refund', 
      'modification', 'cancellation', 'rebook', 'different time',
      'different date', 'booking reference', 'reference number',
      'transaction', 'confirmation', 'receipt', 'order', 'booking id', 
      // Third-party booking terms
      'third party', 'agent', 'travel agent', 'viator', 'expedia', 
      'get your guide', 'getyourguide', 'tour operator',
      // Transportation terms
      'transportation', 'transfer', 'shuttle', 'add transfer',
      // Icelandic terms
      'breyta', 'breyting', 'hætta við', 'afbóka', 'afbókun', 'endurgreiðsla', 
      'bókunarnúmer', 'staðfestingarnúmer', 'bóka aftur', 'annar tími',
      'önnur dagsetning', 'þriðji aðili', 'ferð', 'rúta',
      // Vector intents
      'booking_change', 'cancellation', 'refund_policy', 'booking_modification'
    ],
    category: 'policies'
  },
  'formatting/links': {
    priority: 'medium',  // Change from 'low' to 'medium'
    description: 'Link formatting guidelines',
    alwaysInclude: true,
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
 * Maps knowledge topics to required modules with robust error handling
 * @param {Array} knowledgeItems - Knowledge items from vector search
 * @returns {Array<string>} - Module paths that must be included
 */
function getRequiredModulesFromKnowledge(knowledgeItems) {
  try {
    // Set performance timeout
    const startTime = Date.now();
    const MAPPING_TIMEOUT_MS = 100; // 100ms timeout
    
    const requiredModules = new Set();
    
    // Knowledge topic to module mapping
    const topicToModuleMap = {
      // Booking and payment related topics
      'booking_change': 'policies/booking_change',
      'cancellation': 'policies/booking_change',
      'refund': 'policies/booking_change',
      'policy_refund': 'policies/booking_change',
      'endurgreiðsla': 'policies/booking_change',
      'refund_policy': 'policies/booking_change',
      
      // Transportation related topics
      'transportation': 'services/facilities',
      'bus_schedule': 'services/facilities',
      'shuttle': 'services/facilities',
      'bus': 'services/facilities',
      'transport': 'services/facilities',
      'return_times': 'services/facilities',
      
      // Massage and spa related topics
      'massage': 'services/facilities',
      'spa': 'services/facilities',
      'nudd': 'services/facilities',
      'treatment': 'services/facilities',
      
      // Package related topics
      'packages': 'services/packages',
      'pricing': 'services/packages',
      'admission': 'services/packages',
      'tickets': 'services/packages',
      
      // Facility-related topics
      'facilities': 'services/facilities',
      'amenities': 'services/facilities',
      'accessibility': 'services/facilities',
      
      // Ritual related topics
      'ritual': 'services/ritual',
      'skjol': 'services/ritual',
      
      // Age policy related topics
      'age_requirement': 'policies/age_policy',
      'children': 'policies/age_policy',
      'age_policy': 'policies/age_policy'
    };
    
    // Process all knowledge items with performance monitoring
    for (const item of knowledgeItems) {
      // Check for timeout to avoid blocking response
      if (Date.now() - startTime > MAPPING_TIMEOUT_MS) {
        console.log('⚠️ [PERF-WARN] Knowledge mapping timeout - using partial results');
        break;
      }
      
      // Type-based mapping (direct lookup)
      if (item.type && typeof item.type === 'string') {
        const lookupType = item.type.toLowerCase();
        if (topicToModuleMap[lookupType]) {
          requiredModules.add(topicToModuleMap[lookupType]);
          console.log(`📊 [KNOWLEDGE-MODULE] Mapped ${item.type} to ${topicToModuleMap[lookupType]}`);
        }
      }
      
      // Content-based mapping for critical terms
      if (item.content) {
        const contentStr = typeof item.content === 'string' ? 
                          item.content.toLowerCase() : 
                          JSON.stringify(item.content).toLowerCase();
        
        // Check for important keywords in content
        if (contentStr.includes('refund') || contentStr.includes('cancel') || contentStr.includes('endurgreiðsla')) {
          requiredModules.add('policies/booking_change');
        }
        
        if (contentStr.includes('bus') || contentStr.includes('shuttle') || contentStr.includes('transport') || 
            contentStr.includes('return time') || contentStr.includes('bsi') || contentStr.includes('bsí')) {
          requiredModules.add('services/facilities');
        }
        
        if (contentStr.includes('massage') || contentStr.includes('nudd') || contentStr.includes('spa')) {
          requiredModules.add('services/facilities');
        }
      }
    }
    
    return Array.from(requiredModules);
  } catch (error) {
    // Critical error handling for production
    console.error(`❌ [CRITICAL] Error in knowledge-module mapping: ${error.message}`);
    // Don't crash in production - return empty array
    return [];
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

  // EARLY PREVENTION: Check for age-related terms BEFORE other processing
  const lowerCaseMessage = userMessage.toLowerCase();
  const ageTerms = ['age', 'child', 'children', 'kid', 'year old', 'yr old', 'son', 'daughter'];
  if (ageTerms.some(term => lowerCaseMessage.includes(term))) {
    moduleScores.set('policies/age_policy', 1.0); // Add with maximum confidence
    console.log('📋 [AGE-POLICY] Adding age policy module based on direct age terms detection');
  }

  // EARLY PREVENTION: Check for currency/price terms BEFORE other processing
  const currencyTerms = ['dollar', 'usd', 'euro', 'eur', 'price', 'cost', 'pound', 'currency', 'american dollar'];
  if (currencyTerms.some(term => lowerCaseMessage.includes(term))) {
    moduleScores.set('services/packages', 1.0); // Add with maximum confidence
    console.log('💱 [CURRENCY] Adding packages module based on currency terms detection');
  }

  // EARLY PREVENTION: Check for gift card terms BEFORE other processing
  const giftCardTerms = ['gift card', 'gjafakort', 'gjafabréf', 'sky aðgangur', 'pure aðgangur', 'pure lite'];
  if (giftCardTerms.some(term => lowerCaseMessage.includes(term))) {
    moduleScores.set('services/packages', 1.0); // Add with maximum confidence
    console.log('🎁 [GIFT-CARD] Adding packages module based on gift card terms detection');
  }

  // EARLY PREVENTION: Check for transportation terms BEFORE other processing
  const transportTerms = ['bus terminal', 'bsi', 'bsí', 'transfer', 'shuttle', 'bus', 'transportation', 'transport', 'get to you', 'get there', 'return time', 'return shuttle', 'return bus', 'return trip', 'return journey', 'schedule', 'departure', 'departing', 'pick up', 'pick-up', 'leaves', 'going back', 'back to', 'last bus'];
  if (transportTerms.some(term => lowerCaseMessage.includes(term))) {
    moduleScores.set('services/facilities', 1.0); // Add with maximum confidence
    console.log('🚌 [TRANSPORT] Adding facilities module based on transportation terms detection');
  }

  // EARLY PREVENTION: Check for location terms BEFORE other processing
  const locationTerms = ['where', 'location', 'address', 'town', 'city', 'center', 'downtown', 
      'close', 'near', 'distance', 'far', 'how far', 'directions', 'map'];
  if (locationTerms.some(term => lowerCaseMessage.includes(term))) {
  moduleScores.set('services/facilities', 1.0); // Add facilities with maximum confidence
  moduleScores.set('formatting/links', 1.0); // Also add links with maximum confidence  
  console.log('📍 [LOCATION] Adding facilities and links modules based on location terms detection');
  }

  // EARLY PREVENTION: Check for massage and spa terms BEFORE other processing
  const massageTerms = ['massage', 'spa', 'treatment', 'nudd', 'nudda', 'nuddmeðferð', 'nuddþjónusta', 'nuddari', 'nuddherbergi', 'spa treatment', 'therapy'];
  if (massageTerms.some(term => lowerCaseMessage.includes(term))) {
    moduleScores.set('services/facilities', 1.0); // Add with maximum confidence
    console.log('💆 [MASSAGE] Adding facilities module based on massage terms detection');
  }

  // EARLY PREVENTION: Check for refund terms BEFORE other processing
  const refundTerms = ['refund', 'cancel', 'cancellation', 'endurgreiðsla', 'hætta við', 'afbóka', 'change booking'];
  if (refundTerms.some(term => lowerCaseMessage.includes(term))) {
    moduleScores.set('policies/booking_change', 1.0); // Add with maximum confidence
    console.log('💰 [REFUND] Adding booking_change module based on refund terms detection');
  }

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
  // Apply adaptive threshold with category-specific values
  const CONFIDENCE_THRESHOLDS = {
    'services': 0.2,  // Lower threshold just for services
    'default': 0.4    // Default threshold for other categories
  };
  
  const selectedModules = [...moduleScores.entries()]
    .filter(([modulePath, score]) => {
      const category = moduleMetadata[modulePath]?.category || 'default';
      const threshold = CONFIDENCE_THRESHOLDS[category] || CONFIDENCE_THRESHOLDS.default;
      return score >= threshold;
    })
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
async function assemblePrompt(modules, sessionId, languageDecision, context, relevantKnowledge = [], sunsetData = null) {
  const language = languageDecision?.isIcelandic ? 'is' : 'en';
  
  // Log the modules being used
  logger.info(`Using prompt modules:`, modules);
  
  // Performance tracking
  const startTime = Date.now();
  const moduleSizes = {};
  
  // GROUP MODULES BY CATEGORY
  const modulesByCategory = {
    foundation: modules.filter(m => moduleMetadata[m]?.category === 'foundation'),
    language: modules.filter(m => moduleMetadata[m]?.category === 'language'),
    services: modules.filter(m => moduleMetadata[m]?.category === 'services'),
    policies: modules.filter(m => moduleMetadata[m]?.category === 'policies'),
    seasonal: modules.filter(m => moduleMetadata[m]?.category === 'seasonal'),
    formatting: modules.filter(m => moduleMetadata[m]?.category === 'formatting')
  };
  
  // PARALLEL LOADING OF ALL MODULES
  const modulePromises = {};
  
  // Create promises for each module
  for (const [category, categoryModules] of Object.entries(modulesByCategory)) {
    modulePromises[category] = categoryModules.map(modulePath => {
      return new Promise(resolve => {
        try {
          const content = getModuleContent(modulePath, languageDecision);
          if (content) {
            moduleSizes[modulePath] = content.length;
          }
          resolve({ modulePath, content: content || '' });
        } catch (err) {
          logger.error(`Error loading module ${modulePath}:`, err);
          resolve({ modulePath, content: '' });
        }
      });
    });
  }
  
  // Wait for all module loading to complete in each category
  const loadedModulesByCategory = {};
  for (const [category, promises] of Object.entries(modulePromises)) {
    loadedModulesByCategory[category] = await Promise.all(promises);
  }
  
  // ASSEMBLE PROMPT IN CORRECT ORDER
  let assembledPrompt = '';
  
  // Maintain the specific ordering of module categories
  const categoryOrder = ['foundation', 'language', 'services', 'policies', 'seasonal', 'formatting'];
  
  for (const category of categoryOrder) {
    const loadedModules = loadedModulesByCategory[category] || [];
    for (const { content } of loadedModules) {
      if (content) {
        assembledPrompt += content + '\n\n';
      }
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
  // Feature flag for knowledge-module linking (disabled by default for safety)
  const USE_KNOWLEDGE_MODULE_LINKING = process.env.USE_KNOWLEDGE_MODULE_LINKING === 'true';
  
  // Add clear indicator that modular system is active
  console.log('MODULAR-SYSTEM-ACTIVE'); 
  
  // Track performance
  const startTime = Date.now();
  let knowledgeStart = 0;
  let knowledgeEnd = 0;
  let modulesSelectionEnd = 0;
  let promptAssemblyEnd = 0;
  let moduleLinkingTime = 0;
  
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
    
    // CRITICAL CHANGE: Get knowledge FIRST before selecting modules
    knowledgeStart = Date.now();
    const relevantKnowledge = await getKnowledgeWithFallbacks(userMessage, context);
    knowledgeEnd = Date.now();
    
    // Knowledge-to-module linking with feature flag & error protection
    let knowledgeRequiredModules = [];
    
    if (USE_KNOWLEDGE_MODULE_LINKING) {
      const moduleLinkingStart = Date.now();
      try {
        // Set timeout for this operation
        const linkingPromise = new Promise((resolve) => {
          const requiredModules = getRequiredModulesFromKnowledge(relevantKnowledge);
          resolve(requiredModules);
        });
        
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => {
            console.log('⚠️ [TIMEOUT] Knowledge mapping timed out - using empty result');
            resolve([]);
          }, 200); // 200ms maximum timeout
        });
        
        // Race between normal operation and timeout
        knowledgeRequiredModules = await Promise.race([linkingPromise, timeoutPromise]);
        
        if (knowledgeRequiredModules && knowledgeRequiredModules.length > 0) {
          console.log(`🔗 [KNOWLEDGE-MODULE-LINK] Knowledge dictates modules: ${knowledgeRequiredModules.join(', ')}`);
        }
      } catch (linkingError) {
        console.error(`❌ [LINKING-ERROR] Knowledge-module linking failed: ${linkingError.message}`);
        knowledgeRequiredModules = []; // Safe fallback on error
      }
      
      moduleLinkingTime = Date.now() - moduleLinkingStart;
    }
    
    // Now determine modules through normal selection
    const modulesSelectionStart = Date.now();
    const contextSelectedModules = await determineRelevantModules(userMessage, context, languageDecision, isHoursQuery);
    modulesSelectionEnd = Date.now();
    
    // Merge both module sets (from knowledge and context)
    const allModules = [...contextSelectedModules];
    
    // Add knowledge-required modules if feature is enabled
    if (USE_KNOWLEDGE_MODULE_LINKING && knowledgeRequiredModules.length > 0) {
      // Add unique modules from knowledge
      for (const module of knowledgeRequiredModules) {
        if (!allModules.includes(module)) {
          allModules.push(module);
        }
      }
      
      // Log metrics on added modules
      const addedModules = knowledgeRequiredModules.filter(m => !contextSelectedModules.includes(m));
      if (addedModules.length > 0) {
        console.log(`📈 [KNOWLEDGE-ADDED] ${addedModules.length} modules from knowledge: ${addedModules.join(', ')}`);
      }
    }
    
    // Assemble the final prompt with the combined modules
    const promptAssemblyStart = Date.now();
    const assembledPrompt = await assemblePrompt(allModules, sessionId, languageDecision, context, relevantKnowledge, sunsetData);
    promptAssemblyEnd = Date.now();
    
    // Performance metrics
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const metrics = {
      modulesSelectionTime: modulesSelectionEnd - modulesSelectionStart,
      knowledgeTime: knowledgeEnd - knowledgeStart,
      promptTime: promptAssemblyEnd - promptAssemblyStart,
      moduleLinkingTime: moduleLinkingTime,
      totalTime: totalTime
    };
    
    logger.info(`Dynamic prompt generation complete:`, {
      promptLength: assembledPrompt.length,
      moduleCount: allModules.length,
      totalTime: totalTime,
      ...metrics
    });
    
    // Check performance 
    checkPerformance(metrics, userMessage, allModules);
    
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