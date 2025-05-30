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

// Creates a random ID that changes with each deployment
const DEPLOYMENT_ID = Math.random().toString(36).substring(2, 10);

console.log(`\n🚀 [SYSTEM] Server initialized with deployment ID: ${DEPLOYMENT_ID}`);

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
      'saman', 'ser', 'sér', 'hefð', 'venja',
      'standard', 'premium', 'basic', 'deluxe', 'for two', 'date night',
      'stefnumót', 'stefnumótspakki', 'couples', 'duo',
    
      // Legacy package names
      'pure', 'sky', 'pure lite', 'sky pass', 'pure package',
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
    alwaysInclude: true,
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
      'cancel', 'change', 'modify', 'booking', 'reservation', 'reschedule', 'refund', 
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
    priority: 'medium',
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
    includeWhen: (context) => context.language === 'en',
    category: 'language'
  },
  'seasonal/current_season': {
    priority: 'medium',
    description: 'Current season information',
    alwaysInclude: true,
    category: 'seasonal'
  },
};

// =============================================
// PERFORMANCE OPTIMIZATION 1: CONTENT CACHING
// =============================================

// Module content cache to avoid reloading the same modules repeatedly
const moduleContentCache = new Map();
const MODULE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours - longer caching for better performance

/**
 * Gets content from a specified module for the appropriate language with caching
 * @param {string} modulePath - Module identifier (e.g., 'core/identity')
 * @param {Object} languageDecision - Information about detected language
 * @returns {Promise<string>} The prompt content for the specified language
 */
async function getModuleContent(modulePath, languageDecision, seasonInfo = null) {
  try {
    const module = moduleRegistry[modulePath];
    if (!module) {
      logger.warn(`Module not found: ${modulePath}`);
      return '';
    }
    
    const language = languageDecision?.isIcelandic ? 'is' : 'en';
    
    // Create a cache key
    const cacheKey = `${DEPLOYMENT_ID}:${modulePath}:${language}:${seasonInfo?.season || 'none'}`;
    
    // Check cache first
    if (moduleContentCache.has(cacheKey)) {
      const cached = moduleContentCache.get(cacheKey);
      if (Date.now() - cached.timestamp < MODULE_CACHE_TTL) {
        logger.debug(`Using cached module content for ${modulePath} (${language})`);
        return cached.content;
      }
      moduleContentCache.delete(cacheKey); // Remove expired entry
    }
    
    // Not in cache, load content
    let content;
    if (language === 'is') {
      content = module.getIcelandicPrompt ? 
                await module.getIcelandicPrompt() : 
                (module.getPrompt ? await module.getPrompt('is', seasonInfo) : '');
    } else {
      content = module.getEnglishPrompt ? 
                await module.getEnglishPrompt() : 
                (module.getPrompt ? await module.getPrompt('en', seasonInfo) : '');
    }
    
    // Cache the content
    if (content) {
      moduleContentCache.set(cacheKey, {
        content,
        timestamp: Date.now()
      });
    }
    
    return content || '';
  } catch (error) {
    logger.error(`Error loading module ${modulePath}:`, error);
    return ''; // Return empty string on error
  }
}

// Preload commonly used modules during initialization
async function preloadCommonModules() {
  // Get modules that are always included based on metadata
  const alwaysIncludedModules = Object.entries(moduleMetadata)
    .filter(([, metadata]) => metadata.alwaysInclude)
    .map(([path]) => path);
  
  logger.info(`Preloading ${alwaysIncludedModules.length} common modules...`);
  
  for (const modulePath of alwaysIncludedModules) {
    try {
      // Preload English content
      await getModuleContent(
        modulePath, 
        { isIcelandic: false, language: 'en' }
      );
      
      // Preload Icelandic content
      await getModuleContent(
        modulePath, 
        { isIcelandic: true, language: 'is' }
      );
      
      logger.debug(`Preloaded module: ${modulePath}`);
    } catch (error) {
      logger.error(`Error preloading module ${modulePath}:`, error);
    }
  }
  
  logger.info(`Preloaded ${moduleContentCache.size} module content variants`);
}

// Run preloading in the background
setTimeout(() => {
  preloadCommonModules().catch(err => {
    logger.error('Error in module preloading:', err);
  });
}, 100); // Small delay to avoid blocking startup

// Clean up module content cache periodically
setInterval(() => {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [key, entry] of moduleContentCache.entries()) {
    if (now - entry.timestamp > MODULE_CACHE_TTL) {
      moduleContentCache.delete(key);
      expiredCount++;
    }
  }
  
  if (expiredCount > 0) {
    logger.debug(`Cleaned up ${expiredCount} expired module content entries`);
  }
}, 30 * 60 * 1000); // Every 30 minutes

// =============================================
// PERFORMANCE OPTIMIZATION 2: PROMPT CACHING
// =============================================

// Assembled prompt cache to avoid rebuilding the same prompts
const promptCache = new Map();
const PROMPT_CACHE_TTL = 8 * 60 * 60 * 1000;  // 8 hours - longer caching for better performance
const PROMPT_CACHE_MAX_SIZE = 500;

/**
 * Gets cached prompt if available
 * @param {string} cacheKey - The cache key
 * @returns {string|null} - The cached prompt or null
 */
function getCachedPrompt(cacheKey) {
  if (promptCache.has(cacheKey)) {
    const cached = promptCache.get(cacheKey);
    
    // Check if cache entry is still valid
    if (Date.now() - cached.timestamp < PROMPT_CACHE_TTL) {
      logger.info(`Using cached prompt for key: "${cacheKey.substring(0, 30)}..."`);
      return cached.prompt;
    }
    
    // Expired entry, remove it
    promptCache.delete(cacheKey);
  }
  
  return null;
}

/**
 * Caches a prompt for future use
 * @param {string} cacheKey - The cache key
 * @param {string} prompt - The prompt to cache
 * @returns {string} - The cached prompt
 */
function cachePrompt(cacheKey, prompt) {
  promptCache.set(cacheKey, {
    prompt,
    timestamp: Date.now()
  });
  
  // Clean cache if it gets too large
  if (promptCache.size > PROMPT_CACHE_MAX_SIZE) {
    cleanupPromptCache();
  }
  
  return prompt;
}

/**
 * Cleans up the prompt cache
 */
function cleanupPromptCache() {
  logger.info(`Cleaning prompt cache (${promptCache.size} entries)`);
  
  const now = Date.now();
  
  // First remove expired entries
  let expiredCount = 0;
  for (const [key, entry] of promptCache.entries()) {
    if (now - entry.timestamp > PROMPT_CACHE_TTL) {
      promptCache.delete(key);
      expiredCount++;
    }
  }
  
  // If still too large, remove oldest entries
  if (promptCache.size > PROMPT_CACHE_MAX_SIZE - 50) {
    const entries = [...promptCache.entries()];
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest entries
    let oldestRemoved = 0;
    for (let i = 0; i < 50 && i < entries.length; i++) {
      promptCache.delete(entries[i][0]);
      oldestRemoved++;
    }
    
    logger.info(`Removed ${expiredCount} expired and ${oldestRemoved} oldest prompt cache entries`);
  }
}

// Run prompt cache cleanup periodically
setInterval(cleanupPromptCache, 30 * 60 * 1000); // Every 30 minutes

/**
 * Maps knowledge topics to required modules with robust error handling
 * @param {Array} knowledgeItems - Knowledge items from vector search
 * @returns {Array<string>} - Module paths that must be included
 */
function getRequiredModulesFromKnowledge(knowledgeItems) {
  try {
    // Set performance timeout
    const startTime = Date.now();
    const MAPPING_TIMEOUT_MS = 250; // 250ms timeout (increased from 100ms)
    
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
      
      // Content-based mapping for critical terms - OPTIMIZED
      if (item.content) {
        // Fast path for string content
        if (typeof item.content === 'string') {
          const contentStr = item.content.toLowerCase();
          
          // Add modules based on keywords (using single-pass checks)
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
        // Faster handling for non-string content
        else if (typeof item.content === 'object' && item.content !== null) {
          // Check key properties directly without expensive JSON.stringify
          const hasRefundProps = item.content.refund || item.content.cancel || item.content.cancellation;
          const hasTransportProps = item.content.bus || item.content.transport || item.content.shuttle;
          
          if (hasRefundProps) requiredModules.add('policies/booking_change');
          if (hasTransportProps) requiredModules.add('services/facilities');
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

// =============================================
// Updated Pricing Enforcer
// =============================================

/**
 * Replaces outdated prices with current prices for summer season 2025 (last updated June 1, 2025)
 * This function acts as a safety net to catch any old prices that might come through
 * from vector search or cached knowledge base entries
 * @param {string} prompt - The assembled prompt
 * @returns {string} The prompt with updated prices
 */
function updateOutdatedPrices(prompt) {
  // Define old price patterns and their replacements
  const priceReplacements = [
    // Saman Package - Old weekday/weekend prices to new uniform price
    { pattern: /12[,.]990\s*ISK\s*(?:weekdays?|virka\s*daga)/gi, replacement: '15,990 ISK' },
    { pattern: /14[,.]990\s*ISK\s*(?:weekends?|um\s*helgar)/gi, replacement: '15,990 ISK' },
    { pattern: /12\.990\s*ISK\s*(?:weekdays?|virka\s*daga)/gi, replacement: '15.990 ISK' },
    { pattern: /14\.990\s*ISK\s*(?:weekends?|um\s*helgar)/gi, replacement: '15.990 ISK' },
    
    // Sér Package - Old weekday/weekend prices to new uniform price
    { pattern: /15[,.]990\s*ISK\s*(?:weekdays?|virka\s*daga)/gi, replacement: '19,990 ISK' },
    { pattern: /17[,.]990\s*ISK\s*(?:weekends?|um\s*helgar)/gi, replacement: '19,990 ISK' },
    { pattern: /15\.990\s*ISK\s*(?:weekdays?|virka\s*daga)/gi, replacement: '19.990 ISK' },
    { pattern: /17\.990\s*ISK\s*(?:weekends?|um\s*helgar)/gi, replacement: '19.990 ISK' },
    
    // Youth Saman - Old prices
    { pattern: /6[,.]495\s*ISK\s*(?:weekdays?|virka\s*daga)/gi, replacement: '7,995 ISK' },
    { pattern: /7[,.]495\s*ISK\s*(?:weekends?|um\s*helgar)/gi, replacement: '7,995 ISK' },
    { pattern: /6\.495\s*ISK\s*(?:weekdays?|virka\s*daga)/gi, replacement: '7.995 ISK' },
    { pattern: /7\.495\s*ISK\s*(?:weekends?|um\s*helgar)/gi, replacement: '7.995 ISK' },
    
    // Youth Sér - Old prices
    { pattern: /7[,.]995\s*ISK\s*(?:weekdays?|virka\s*daga)/gi, replacement: '9,995 ISK' },
    { pattern: /8[,.]995\s*ISK\s*(?:weekends?|um\s*helgar)/gi, replacement: '9,995 ISK' },
    { pattern: /7\.995\s*ISK\s*(?:weekdays?|virka\s*daga)/gi, replacement: '9.995 ISK' },
    { pattern: /8\.995\s*ISK\s*(?:weekends?|um\s*helgar)/gi, replacement: '9.995 ISK' },
    
    // Old Multi-Pass prices if they appear
    { pattern: /44[,.]970\s*ISK/gi, replacement: (match) => 
      match.includes(',') ? '47,970 ISK' : '47.970 ISK' },
    { pattern: /35[,.]970\s*ISK/gi, replacement: (match) => 
      match.includes(',') ? '38,970 ISK' : '38.970 ISK' },
    
    // Replace any mention of different weekday/weekend pricing structure
    { pattern: /weekdays?\s*\/\s*weekends?/gi, replacement: '(all days)' },
    { pattern: /virka\s*daga\s*\/\s*um\s*helgar/gi, replacement: '(alla daga)' },
  ];
  
  let updatedPrompt = prompt;
  
  // Apply all replacements
  priceReplacements.forEach(({ pattern, replacement }) => {
    updatedPrompt = updatedPrompt.replace(pattern, replacement);
  });
  
  // Add a warning if we detect any discussion of weekday/weekend price differences
  const weekdayWeekendPattern = /different\s*(?:prices?|pricing)\s*(?:for|on)\s*weekdays?\s*and\s*weekends?|mismunandi\s*verð\s*(?:fyrir|á)\s*virka\s*daga\s*og\s*helgar/gi;
  if (weekdayWeekendPattern.test(updatedPrompt)) {
    logger.warn('Detected outdated weekday/weekend pricing structure in prompt');
  }
  
  return updatedPrompt;
}

// =============================================
// PERFORMANCE OPTIMIZATION 3: FAST PATH DETECTION
// =============================================

/**
 * Fast path detection for common message patterns
 * Allows bypassing expensive processing for common query types while
 * still using the same modules
 */
function detectFastPath(message, context, languageDecision) {
  // Skip if message is too complex
  if (!message || message.split(' ').length > 5) {
    return null;
  }

  const lowerCaseMessage = message.toLowerCase();
  
  // Common fast path patterns
  const FAST_PATHS = {
    greeting: {
      patterns: [
        /^(hello|hi|hey|good\s(morning|afternoon|evening)|greetings)/i,
        /^(hæ|halló|sæl|sæll|sælar|góðan\s(dag|morgun|kvöld)|blessaður|blessuð)/i
      ],
      modules: [
        'core/identity',
        'core/response_rules',
        'core/personality',
        'formatting/response_format',
        'seasonal/current_season'
      ]
    },
    thanks: {
      patterns: [
        /^(thanks|thank you|thx|ty)/i,
        /^(takk|þakka|kærar þakkir)/i
      ],
      modules: [
        'core/identity',
        'core/response_rules',
        'core/personality',
        'formatting/response_format'
      ]
    },
    simple_question: {
      patterns: [
        /^(what|how|when|where|why|who|is|are|do|does)/i,
        /^(hvað|hvernig|hvenær|hvar|af hverju|hver|er|eru|gerir|gerið)/i
      ],
      // This doesn't provide modules - it's just flagging that this might be a simple question
      // but we should still use standard module selection to get correct category modules
      skipFastPath: true
    }
  };
  
  // Check each fast path
  for (const [pathName, pathConfig] of Object.entries(FAST_PATHS)) {
    const { patterns, modules, skipFastPath } = pathConfig;
    
    // Check if message matches any pattern for this path
    const matchesPath = patterns.some(pattern => pattern.test(lowerCaseMessage));
    
    if (matchesPath) {
      if (skipFastPath) {
        // This path indicates we should use the normal flow, but we've identified a pattern
        logger.debug(`Detected ${pathName} pattern, but proceeding with standard module selection`);
        return null;
      }
      
      logger.info(`🚀 Fast path activated: ${pathName}`);
      
      // Add language module based on detected language
      const languageModule = (languageDecision?.isIcelandic || context?.language === 'is') 
        ? 'language/icelandic_rules'
        : 'language/english_rules';
      
      return [...modules, languageModule];
    }
  }
  
  // No fast path matched
  return null;
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
    isGreeting: /^(hello|hi|hey|good\s(morning|afternoon|evening)|hæ|halló|sæl|góðan\s(dag|morgun|kvöld))/i.test(normalizedMessage),
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
  // Check for fast path first - optimization for common simple patterns
  const fastPathModules = detectFastPath(userMessage, context, languageDecision);
  if (fastPathModules) {
    return fastPathModules;
  }
  
  // EARLY PREVENTION: Check for greeting patterns BEFORE other processing
  const lowerCaseMessage = userMessage.toLowerCase();
  const greetingPatterns = [
    // English greetings
    /^(hello|hi|hey|good\s(morning|afternoon|evening)|greetings)/i,
    // Icelandic greetings
    /^(hæ|halló|sæl|sæll|sælar|góðan\s(dag|morgun|kvöld)|blessaður|blessuð)/i
  ];
  
  // Check if message is just a simple greeting
  const isSimpleGreeting = greetingPatterns.some(pattern => pattern.test(lowerCaseMessage)) && 
                           lowerCaseMessage.split(' ').length <= 3;
  
  if (isSimpleGreeting) {
    console.log('👋 [GREETING] Detected simple greeting pattern - bypassing vector search');
    
    // Update context with greeting info
    if (context.intentHierarchy && typeof context.intentHierarchy.updateIntent === 'function') {
      context.intentHierarchy.updateIntent('greeting', 1.0); // Set with maximum confidence
    }
    context.lastTopic = 'greeting';
    
    // Return basic modules for greeting without going through other processing
    return [
      'core/identity',
      'core/response_rules',
      'core/personality',
      'formatting/response_format',
      'seasonal/current_season',
      (languageDecision?.language === 'is' || context.language === 'is') ? 
        'language/icelandic_rules' : 
        (languageDecision?.isIcelandic ? 'language/icelandic_rules' : 'language/english_rules')
      ];
  }
  
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
  
  // Add language-specific modules - prioritize explicit language settings
  const languageModule = (languageDecision?.language === 'is' || context.language === 'is') ? 
    'language/icelandic_rules' : 
    (languageDecision?.isIcelandic ? 'language/icelandic_rules' : 'language/english_rules');
  moduleScores.set(languageModule, 1.0);
  
  // Add formatting module (generally useful)
  moduleScores.set('formatting/response_format', 0.9);

  // EARLY PREVENTION: Force Icelandic for common Icelandic greetings
  const icelandicGreetingPatterns = /^(hæ|halló|sæl|sæll|góðan dag|góðan daginn)/i;
  if (icelandicGreetingPatterns.test(lowerCaseMessage)) {
    console.log('🇮🇸 [ICELANDIC] Detected specific Icelandic greeting - forcing Icelandic response');
    
    // Force Icelandic language settings
    if (languageDecision) {
      languageDecision.language = 'is';
      languageDecision.isIcelandic = true;
    }
    
    // Update context language
    if (context) {
      context.language = 'is';
    }
    
    // Set the language to Icelandic before building modules
    console.log('🇮🇸 Forcing exact Icelandic greeting template usage');
    
    // Return modules with Icelandic rules prioritized and give it higher priority
    return [
      'language/icelandic_rules', // Put this FIRST to ensure highest priority
      'core/identity',
      'core/response_rules',
      'core/personality',
      'formatting/response_format',
      'seasonal/current_season'
    ];
  }

  // EARLY PREVENTION: Check for booking change with reference number
  const bookingRefPattern = /\b(\d{7,8}|[A-Z]+-\d{5,8}|confirmation.*\d{5,8})\b/i;
  const changeTerms = ['færa', 'breyta', 'flytja', 'move', 'change', 'modify', 'reschedule'];
  
  // Check for both booking reference and change terms
  const hasBookingRef = bookingRefPattern.test(lowerCaseMessage);
  const hasChangeIntent = changeTerms.some(term => lowerCaseMessage.includes(term));
  const hasPreviousBookingIntent = context && 
    (context.lastTopic === 'booking_change' || context.status === 'booking_change');
    
  // Detect booking change request with reference number
  if ((hasBookingRef && hasChangeIntent) || (hasBookingRef && hasPreviousBookingIntent)) {
    // Set booking change status in context
    if (context) {
      context.status = 'booking_change';
      context.lastTopic = 'booking_change';
      
      // Extract booking reference if available
      const bookingRefMatch = lowerCaseMessage.match(/\b(\d{7,8})\b/);
      if (bookingRefMatch) {
        context.bookingDetails = context.bookingDetails || {};
        context.bookingDetails.reference = bookingRefMatch[0];
      }
    }
    
    console.log('📝 [BOOKING-CHANGE] Detected booking reference with change request');
    
    // Ensure booking_change module is prioritized
    moduleScores.set('policies/booking_change', 1.0);
  }

  // EARLY PREVENTION: Check for phone-related queries
  const phoneTerms = ['phone', 'call', 'sími', 'síminn', 'símanum', 'þjónustuver'];
  const isPhoneQuery = phoneTerms.some(term => lowerCaseMessage.includes(term));

  if (isPhoneQuery && (lowerCaseMessage.includes('hour') || lowerCaseMessage.includes('open') || 
                    lowerCaseMessage.includes('time') || lowerCaseMessage.includes('opinn') || 
                    lowerCaseMessage.includes('tími') || lowerCaseMessage.includes('lengi'))) {
    // Set flag in context
    if (context) {
      context.isPhoneTimeQuery = true;
      if (context.timeContext) context.timeContext.isPhoneQuery = true;
    }
  
    console.log('📞 [PHONE-HOURS] Detected phone hours query');
  
    // Ensure time_format module is prioritized
    moduleScores.set('formatting/time_format', 1.0);
  }
  
  // EARLY PREVENTION: Check for age-related terms BEFORE other processing
  const ageTerms = [
    'age', 'child', 'children', 'kid', 'year old', 'yr old', 'son', 'daughter',
    // Add terms for infants and babies
    'month old', 'infant', 'baby', 'babies', 'toddler', 'newborn', 'months old',
    // Add truncated words that could appear
    'month', 'infant', 'baby'
  ];
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
async function assemblePrompt(modules, sessionId, languageDecision, context, relevantKnowledge = [], sunsetData = null, seasonInfo = null) {
  // Determine language categories similar to the legacy system
  const language = languageDecision?.language || (languageDecision?.isIcelandic ? 'is' : 'en');
  const isIcelandic = language === 'is' || languageDecision?.isIcelandic;
  const isEnglish = language === 'en';
  const isAuto = language === 'auto';
  const isStandardLanguage = isEnglish || isIcelandic;
  const isOtherLanguage = !isStandardLanguage || isAuto;
  
  // Log the language determination decisions for debugging
  console.log('\n🌐 Language determination:', {
    language,
    isAuto,
    isEnglish,
    isIcelandic,
    isOtherLanguage
  });
  
  // Log the modules being used
  logger.info(`Using prompt modules:`, modules);
  
  // Detailed performance tracking
  const timings = {
    groupingStart: Date.now(),
    groupingEnd: 0,
    loadingStart: 0,
    loadingEnd: 0,
    assemblyStart: 0,
    assemblyEnd: 0
  };
  
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
  
  // Performance timing - grouping completed
  timings.groupingEnd = Date.now();
  timings.loadingStart = Date.now();
  
  // PARALLEL LOADING OF ALL MODULES
  const modulePromises = {};

  // Create promises for each module
  for (const [category, categoryModules] of Object.entries(modulesByCategory)) {
    modulePromises[category] = categoryModules.map(modulePath => {
      return new Promise(async (resolve) => {
        try {
          const content = await getModuleContent(modulePath, languageDecision, seasonInfo);
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
  
  // Performance timing - loading completed
  timings.loadingEnd = Date.now();
  timings.assemblyStart = Date.now();
  
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
  
  // Add final language instruction using the more sophisticated approach from legacy system
  if (isIcelandic) {
    assembledPrompt += `\n\nRESPOND IN ICELANDIC.`;
  } else if (isEnglish) {
    assembledPrompt += `\n\nRESPOND IN ENGLISH.`;
  } else if (isAuto) {
    // Add the critical safety net from the legacy system
    assembledPrompt += `\n\nIMPORTANT: RESPOND IN THE SAME LANGUAGE AS THE USER'S QUESTION. If the user writes in Icelandic, respond in Icelandic. If they write in English, respond in English. If they write in any other language, respond in that same language.`;
  } else {
    // For other explicit languages
    assembledPrompt += `\n\nCRITICAL: RESPOND IN ${language.toUpperCase()} LANGUAGE. DO NOT RESPOND IN ENGLISH OR ICELANDIC UNLESS THE USER MESSAGE IS IN THOSE LANGUAGES.`;
  }
  
  // Performance timing - assembly completed
  timings.assemblyEnd = Date.now();
  
  // Performance metrics
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  logger.info(`Prompt assembly stats:`, {
    promptLength: assembledPrompt.length,
    moduleCount: modules.length,
    assemblyTime: `${totalTime}ms`
  });
  
  // Detailed performance metrics
  logger.info(`Prompt assembly detailed performance:`, {
    grouping: `${timings.groupingEnd - timings.groupingStart}ms`,
    loading: `${timings.loadingEnd - timings.loadingStart}ms`,
    assembly: `${timings.assemblyEnd - timings.assemblyStart}ms`,
    total: `${timings.assemblyEnd - timings.groupingStart}ms`,
    moduleCount: modules.length
  });
  
  logger.debug('Module sizes:', moduleSizes);

  // Apply price updates as final step
  const originalAssembledPrompt = assembledPrompt;
  assembledPrompt = updateOutdatedPrices(assembledPrompt);
  
  // Log if any price updates were made
  if (assembledPrompt !== originalAssembledPrompt) {
    logger.info('Updated outdated prices in assembled prompt');
  }

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
export async function getOptimizedSystemPrompt(sessionId, isHoursQuery, userMessage, languageDecision, sunsetData = null, preRetrievedKnowledge = null, seasonInfo = null) {
  // Feature flag for knowledge-module linking (disabled by default for safety)
  const USE_KNOWLEDGE_MODULE_LINKING = process.env.USE_KNOWLEDGE_MODULE_LINKING === 'true';
  
  // Add clear indicator that modular system is active
  console.log('MODULAR-SYSTEM-ACTIVE'); 
  
  // Track performance
  const startTime = Date.now();
  let knowledgeStart = 0;
  let knowledgeEnd = 0;
  let modulesSelectionEnd = 0;
  let promptAssemblyStart = 0;
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
    
    // Honor client-specified language if available
    if (languageDecision && languageDecision.language === 'is') {
      languageDecision.isIcelandic = true;
      console.log('🇮🇸 [LANGUAGE] Honoring client-specified Icelandic language');
    }

    // Enhanced logging similar to legacy system
    console.log('\n👀 Language Context Check:', {
      hasContext: !!context,
      sessionId,
      message: userMessage && userMessage.substring(0, 50),
      language: {
        isIcelandic: languageDecision?.isIcelandic,
        language: languageDecision?.language,
        confidence: languageDecision?.confidence,
        reason: languageDecision?.reason
      }
    });
    
    // Update language context for this interaction
    updateLanguageContext(context, userMessage);
    
    // Store the user message in context for Icelandic detection
    if (context && userMessage) {
      context.lastMessage = userMessage;
    }
    
    // =============================================
    // PERFORMANCE OPTIMIZATION 4: PROMPT CACHING
    // =============================================
    
    // Generate a cache key based on critical parameters (without including full user message)
    const primaryIntent = context?.intentHierarchy?.primaryIntent || 'none';
    const language = languageDecision?.language || (languageDecision?.isIcelandic ? 'is' : 'en');
    const lastTopic = context?.lastTopic || 'none';
    const isLateArrival = context?.lateArrivalContext?.isLate ? 'late' : 'normal';
    const isBookingChange = context?.bookingContext?.hasBookingChangeIntent ? 'change' : 'normal';
    const seasonKey = seasonInfo?.season || 'regular';
    
    // Include basic message fingerprint in cache key (avoid full message for privacy and uniqueness)
    const messageFingerprint = userMessage ? 
      `${userMessage.length}:${userMessage.split(' ').length}:${userMessage.substring(0, 10).replace(/[^a-z0-9]/gi, '')}` : 
      'empty';
    
    // Create a normalized cache key
    const cacheKey = `${DEPLOYMENT_ID}:${primaryIntent}|${language}|${lastTopic}|${isLateArrival}|${isBookingChange}|${isHoursQuery ? 'hours' : 'normal'}|${seasonKey}|${messageFingerprint}`;
    
    // Check cache first before doing any expensive operations
    const cachedPrompt = getCachedPrompt(cacheKey);
    if (cachedPrompt) {
      // Log performance and use cached prompt
      const endTime = Date.now();
      console.log(`\n⚡ Using cached prompt: ${endTime - startTime}ms total time (cache hit)`);
      return cachedPrompt;
    }
    
    // Use pre-retrieved knowledge if provided or retrieve if needed
    let relevantKnowledge = preRetrievedKnowledge;
    if (!relevantKnowledge) {
      // Only retrieve if not provided (fallback)
      knowledgeStart = Date.now();
      relevantKnowledge = await getKnowledgeWithFallbacks(userMessage, context);
      knowledgeEnd = Date.now();
    } else {
      console.log('📦 Using pre-retrieved knowledge, skipping redundant retrieval');
      knowledgeEnd = knowledgeStart = Date.now(); // Set both to same value for metrics
    }
    
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
          }, 500); // 500ms maximum timeout (increased from 200ms)
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
    promptAssemblyStart = Date.now();
    const assembledPrompt = await assemblePrompt(allModules, sessionId, languageDecision, context, relevantKnowledge, sunsetData, seasonInfo);
    promptAssemblyEnd = Date.now();
    
    // Apply final price safety check
    const finalPrompt = updateOutdatedPrices(assembledPrompt);
    
    // Cache the result before returning
    cachePrompt(cacheKey, finalPrompt);
    
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
      ...metrics,
      moduleLoadingTime: `${Math.round((promptAssemblyEnd - promptAssemblyStart) * 0.7)}ms (est.)`
    });
    
    // Check performance 
    checkPerformance(metrics, userMessage, allModules);
    
    return finalPrompt;
  } catch (error) {
    logger.error(`Error in dynamic prompt generation:`, error);
    logger.error(`Stack trace:`, error.stack);
    
    // Fallback to original system in case of errors
    logger.info(`Falling back to legacy prompt system due to error`);
    return getSystemPrompt(sessionId, isHoursQuery, userMessage, languageDecision, sunsetData);
  }
}

export default getOptimizedSystemPrompt;