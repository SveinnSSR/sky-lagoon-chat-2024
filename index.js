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
// Knowledge base and language detection
import { getRelevantKnowledge } from './knowledgeBase.js';
import { 
    knowledgeBase_is,
    getRelevantKnowledge_is, 
    detectLanguage, 
    getLanguageContext 
} from './knowledgeBase_is.js';
import { detectLanguage as newDetectLanguage } from './languageDetection.js';
// LiveChat Integration
import { checkAgentAvailability, transferChatToAgent, createChat, sendMessageToLiveChat } from './services/livechat.js';

// WebSocket can be removed as noted
// import { WebSocketServer } from 'ws';

// Initialize Pusher with your credentials
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
});

// Add this right after your Pusher initialization
const broadcastConversation = async (userMessage, botResponse, language, topic = 'general', type = 'chat') => {
    try {
        // First check if it's a simple Icelandic message
        const languageCheck = newDetectLanguage(userMessage);
        
        // Enhanced logging with language info
        console.log('\n📨 Processing message:', {
            userMessage,
            language,
            type,
            languageCheck,
            hasIcelandicChars: /[þæðöáíúéó]/i.test(userMessage)
        });

        // Create language info object using our new detection
        const languageInfo = {
            isIcelandic: language === 'is' || languageCheck.isIcelandic,
            confidence: languageCheck.confidence,
            reason: languageCheck.reason
        };

        const conversationData = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            userMessage,
            botResponse,
            language: languageInfo.isIcelandic ? 'is' : 'en',
            topic,
            type
        };

        return await handleConversationUpdate(conversationData, languageInfo);
    } catch (error) {
        console.error('❌ Error in broadcastConversation:', error);
        return false;
    }
};

// Cache and state management
const responseCache = new Map();
const conversationContext = new Map();

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
        }
    },
    specialPhrases: {
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
        'buy-gift-tickets'  // Add this to preserve URLs
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

    // Restore preserved phrases using markers
    Object.entries(markers).forEach(([phrase, marker]) => {
        const restoreRegex = new RegExp(marker, 'g');
        modifiedText = modifiedText.replace(restoreRegex, phrase);
    });

    // Comprehensive hydration and experience safety checks - Moved here after other replacements
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
    END: 23     // 11 PM
};

// Transfer trigger patterns
const AGENT_REQUEST_PATTERNS = {
    en: [
        'speak to agent',
        'talk to agent',
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

const BOOKING_CHANGE_PATTERNS = {
    en: [
        'change booking',
        'modify booking',
        'reschedule',
        'change time',
        'change date',
        'different time',
        'different date',
        'another time',
        'another date',
        'move booking',
        'cancel booking'
    ],
    is: [
        'breyta bókun',
        'breyta tíma',
        'breyta dagsetningu',
        'færa bókun',
        'færa tíma',
        'annan tíma',
        'aðra dagsetningu',
        'hætta við bókun',
        'afbóka'
    ]
};

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

        // First check if it's a transfer request
        const hasAgentRequest = (useEnglish ? 
            AGENT_REQUEST_PATTERNS.en : 
            AGENT_REQUEST_PATTERNS.is).some(pattern => msg.includes(pattern));

        // Check for booking change request
        const hasBookingChange = (useEnglish ? 
            BOOKING_CHANGE_PATTERNS.en : 
            BOOKING_CHANGE_PATTERNS.is).some(pattern => msg.includes(pattern));

        // Only check hours if they're requesting transfer
        if (hasAgentRequest || hasBookingChange) {
            // Now check operating hours
            if (!isWithinOperatingHours()) {
                return {
                    shouldTransfer: false,
                    reason: 'outside_hours',
                    response: useEnglish ? 
                        "Our customer service team is available from 9 AM to 4 PM (GMT). Please contact us during these hours for assistance." :
                        "Þjónustufulltrúar okkar eru til staðar frá 9-16 (GMT). Vinsamlegast hafðu samband á þeim tíma fyrir aðstoð."
                };
            }

            // Check agent availability
            const { areAgentsAvailable, availableAgents } = await checkAgentAvailability();

            if (!areAgentsAvailable) {
                return {
                    shouldTransfer: false,
                    reason: 'no_agents',
                    response: useEnglish ?
                        "Our agents are currently assisting other customers. Please call us at +354 527 6800 or email reservations@skylagoon.is for help." :
                        "Þjónustufulltrúar okkar eru uppteknir. Vinsamlegast hringdu í +354 527 6800 eða sendu tölvupóst á reservations@skylagoon.is fyrir aðstoð."
                };
            }

            return {
                shouldTransfer: true,
                reason: hasAgentRequest ? 'explicit_request' : 'booking_change',
                agents: availableAgents
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

// Greeting responses - Updated the constant to use Sky Lagoon's specific greetings
const GREETING_RESPONSES = {
    english: [
        "Hello! I'm Rán your AI chatbot. I am new here and still learning but, will happily do my best to assist you. What can I do for you today?"
    ],
    icelandic: [
        "Hæ! Ég heiti Rán og er AI spjallmenni. Ég er ný og enn að læra en mun aðstoða þig með glöðu geði. Hvað get ég gert fyrir þig í dag?"
    ]
};

const isBookingQuery = (message) => {
    const msg = message.toLowerCase();
    return msg.includes('bóka') || 
           msg.includes('panta') || 
           msg.includes('tíma') || 
           msg.includes('stefnumót') ||
           msg.includes('hvernig bóka');
};

// Response Templates and Patterns
const ACKNOWLEDGMENT_RESPONSES = [
    "Let me know if you need anything else!",
    "What else would you like to know about Sky Lagoon?",
    "Is there anything else you'd like to know?",
    "Feel free to ask if you have any other questions.",
    "Is there something specific you'd like to learn more about?",
    "Let me know what other information would be helpful.",
    "Would you like to know about any other aspects of Sky Lagoon?",
    "I'm here if you have any other questions!",
    "I'm here to share more information about Sky Lagoon.",
    "Please don't hesitate to ask if you need more information.",
    "I'm happy to help with any other questions!",
    "What aspects of Sky Lagoon interest you most?",
    "What else would you like to know?",
    "Would you like to know more about any particular aspect?",
    "I can tell you more about our experiences if you're interested.",
    "I'm happy to provide more details about any area you're curious about.",
    "Shall we explore another aspect of Sky Lagoon?"
];

const SMALL_TALK_RESPONSES = {
    en: {
        // General chat responses
        casual: [
            "I'm doing great! I'd love to tell you about our experiences at Sky Lagoon. What interests you most?",
            "I'm wonderful, thank you! Would you like to learn about our unique experiences at Sky Lagoon?",
            "Doing well! Let me tell you what makes Sky Lagoon special. What would you like to know?",
            "Great, thanks for asking! I'd be happy to share what makes Sky Lagoon unique. What interests you?"
        ],
        // For when they say "good" or similar
        positive: [
            "That's great to hear! Would you like to learn about our experiences at Sky Lagoon?",
            "Wonderful! I can tell you all about Sky Lagoon - what interests you most?",
            "Excellent! I'd be happy to share what makes Sky Lagoon special.",
            "Perfect! How can I help you plan your Sky Lagoon visit?"
        ],
        // For "nice to meet you" responses
        greeting: [
            "Nice to meet you too! I'd be happy to tell you about our unique geothermal lagoon experience. What would you like to know?",
            "Lovely to meet you as well! Would you like to learn about our experiences at Sky Lagoon?",
            "Great to meet you too! I'm here to help you learn about Sky Lagoon. What interests you most?",
            "Wonderful to meet you! I'd love to tell you about what makes Sky Lagoon special. What would you like to know?"
        ],
        // For identity questions (who are you, etc.)
        identity: [
            "I'm Rán, an AI assistant dedicated to helping guests discover Sky Lagoon. What would you like to know?",
            "I'm Rán, your AI guide to Sky Lagoon. What aspects of our experience would you like to learn about?",
            "I'm Rán, an AI assistant here to help you learn about Sky Lagoon. What interests you most?",
            "I'm Rán, your AI assistant for all things Sky Lagoon. How can I help you today?"
        ]
    },
    is: {
        // Icelandic casual responses
        casual: [
            "Allt gott, takk fyrir að spyrja! Hvernig get ég aðstoðað þig?",
            "Mér líður vel, takk fyrir! Get ég sagt þér frá Sky Lagoon?",
            "Allt frábært! Hvernig get ég hjálpað þér?",
            "Bara gott! Get ég hjálpað þér að skipuleggja heimsókn í Sky Lagoon?"
        ],
        // For when they say "gott" or similar
        positive: [
            "Frábært að heyra! Langar þig að fræðast um upplifunina hjá okkur?",
            "Minnsta málið! Ef þú hefur fleiri spurningar eða þarft aðstoð, láttu mig vita.",
            "Flott! Get ég aðstoðað þig meira?",
            "Æði! Hvernig get ég aðstoðað þig?"
        ],
        // For "gaman að hitta þig" responses
        greeting: [
            "Gaman að hitta þig líka! Langar þig að heyra meira um upplifunina í lóninu okkar?",
            "Sömuleiðis! Hvernig get ég aðstoðað þig?",
            "Gaman að kynnast þér líka! Hvernig get ég aðstoðað þig?",
            "Sömuleiðis! Hvernig get ég aðstoðað þig?"
        ],
        // For identity questions (who are you, etc.)
        identity: [
            "Ég er Rán, gervigreindaraðstoðarmaður sem hjálpar gestum að kynnast Sky Lagoon. Hvernig get ég aðstoðað þig?",
            "Ég er Rán, gervigreindin þín fyrir Sky Lagoon. Hvað viltu vita um upplifunina okkar?",
            "Ég er Rán, gervigreindaraðstoðarmaður fyrir Sky Lagoon. Hvað langar þig að fræðast um?",
            "Ég er Rán, gervigreindarráðgjafinn þinn fyrir allt sem viðkemur Sky Lagoon. Hvernig get ég hjálpað?"
        ]
    }
};

// Enhanced follow-up greeting detection
const isFollowUpGreeting = (message, languageDecision) => {
    const msg = message.toLowerCase().trim();
    
    // Log follow-up check
    console.log('\n👋 Follow-up Greeting Check:', {
        message: msg,
        patterns: {
            hasName: msg.includes('rán'),
            startsWithEnglish: simpleEnglishGreetings.some(g => msg.startsWith(g)),
            startsWithIcelandic: simpleIcelandicGreetings.some(g => msg.startsWith(g)),
            isContextual: /^(?:hi|hello|hey|hæ|halló)\s+(?:again|back|there|rán)\b/i.test(msg),
            hasFollowUpWord: /\b(?:again|back|now|once more)\b/i.test(msg)
        }
    });

    // Check for explicit follow-up patterns first
    if (/^(?:hi|hello|hey)\s+(?:again|back)\b/i.test(msg)) {
        return !languageDecision.isIcelandic;
    }

    // Check for Icelandic follow-up patterns
    if (/^(?:hæ|halló|sæl)\s+(?:aftur|enn)\b/i.test(msg)) {
        return languageDecision.isIcelandic;
    }

    // Check for greetings with Rán's name
    const hasRánWithGreeting = (
        // English greetings with Rán
        (simpleEnglishGreetings.some(g => msg.startsWith(g)) && msg.includes('rán')) ||
        // Icelandic greetings with Rán
        (simpleIcelandicGreetings.some(g => msg.startsWith(g)) && msg.includes('rán'))
    );

    if (hasRánWithGreeting) {
        return true;
    }

    // Check for contextual follow-ups (when we have previous interaction)
    if (msg.match(/^(?:hi|hello|hey|hæ|halló)\s+(?:there|again|back|aftur)\b/i)) {
        return true;
    }

    return false;
};

const FOLLOWUP_RESPONSES = {
    en: [
        "How can I help you today?",
        "What would you like to know about Sky Lagoon?",
        "I'd be happy to help you plan your visit. What interests you most?",
        "What can I tell you about Sky Lagoon?",
        "Nice to see you again! What can I help you with?",
        "Welcome back! How can I assist you today?"
    ],
    is: [
        "Hvernig get ég aðstoðað þig?",
        "Hvað viltu vita um Sky Lagoon?",
        "Ég get hjálpað þér að skipuleggja heimsóknina. Hvað langar þig að vita?",
        "Get ég veitt þér einhverjar upplýsingar um Sky Lagoon?",
        "Gaman að sjá þig aftur! Hvernig get ég aðstoðað?",
        "Velkomin/n aftur! Hvað get ég gert fyrir þig?"
    ]
};

// Add logging helper for response selection
const logFollowUpResponse = (languageDecision, response) => {
    console.log('\n🗣️ Selected Follow-up Response:', {
        language: {
            isIcelandic: languageDecision.isIcelandic,
            confidence: languageDecision.confidence,
            reason: languageDecision.reason
        },
        response: response,
        totalOptions: FOLLOWUP_RESPONSES[languageDecision.isIcelandic ? 'is' : 'en'].length
    });
};

const CONFIRMATION_RESPONSES = [
    "Great! ",
    "Excellent! ",
    "Perfect! ",
    "Wonderful! ",
    "I understand! "
];

// Enhanced greeting detection with patterns
const simpleEnglishGreetings = [
    // Basic greetings with variations
    'hi', 'hello', 'hey', 'howdy',
    'hii', 'hiii', 'hiiii',
    'heyy', 'heyyy', 'heyyyy',
    'helloo', 'hellooo',
    // Variations with "there"
    'hi there', 'hello there', 'hey there',
    'greetings', 'hiya', 'hullo',
    // Time-based greetings
    'good morning', 'good afternoon', 'good evening', 'good day',
    // Welcome variations
    'welcome', 'welcome back',
    // Casual variations
    'yo', 'heya', 'hi folks',
    // Double greetings
    'hi hi', 'hello hello',
    // With name
    'hi rán', 'hello rán', 'hey rán'
];

// Composite Icelandic greetings - ordered by complexity
const compositeIcelandicGreetings = [
    // Time-based formal greetings
    'góðan dag',
    'góðan daginn',
    'gott kvöld',
    'góða kvöldið',
    // Formal greetings with gender
    'sæll og blessaður',
    'sæl og blessuð',
    'komdu sæll',
    'komdu sæl',
    // Additional formal variations
    'verið velkomin',
    'góðan og blessaðan'
];

// Simple Icelandic greetings - categorized and sorted
const simpleIcelandicGreetings = [
    // Basic greetings
    'hæ', 'hæhæ', 'hææ', 'halló', 
    'sæl', 'sæll',
    // Time components
    'góðan', 'góða', 'morgunn',
    'daginn', 'kvöld', 'morguninn', 'kvöldið',
    // Full time-based greetings
    'góðan daginn', 'góðan dag',
    'gott kvöld', 'góða kvöldið',
    // Formal variations
    'blessaður', 'blessuð',
    'komdu blessaður', 'komdu blessuð',
    // Welcome variations
    'velkomin', 'velkominn',
    // Multiple greetings
    'hæhæ hæ', 'halló halló', 'hæ hæ',
    // Additional formal phrases
    'kær kveðja', 'heilsað þér'
];

// Add enhanced logging for greeting pattern usage
const logGreetingMatch = (message, matches, languageDecision) => {
    console.log('\n👋 Greeting Pattern Match:', {
        message: message,
        language: {
            isIcelandic: languageDecision.isIcelandic,
            confidence: languageDecision.confidence,
            reason: languageDecision.reason
        },
        matches: {
            simpleEnglish: simpleEnglishGreetings.filter(g => message.toLowerCase().includes(g.toLowerCase())),
            compositeIcelandic: compositeIcelandicGreetings.filter(g => message.toLowerCase().includes(g.toLowerCase())),
            simpleIcelandic: simpleIcelandicGreetings.filter(g => message.toLowerCase().includes(g.toLowerCase()))
        },
        finalMatch: matches
    });
};

// Common Icelandic question words and starters
const icelandicQuestionStarters = [
    'er ', 'má ', 'get ', 'getur ', 'hefur ',
    'fylgja ', 'kostar ', 'þarf ', 'hvar ',
    'hvenær ', 'hvernig ', 'hvað ', 'hver ',
    'verð ', 'eru ', 'eigið ', 'eigum ',
    'geturðu ', 'mætti ', 'megið ', 'væri '
];

const isSimpleGreeting = (message, languageDecision) => {
    // Remove emojis, emoticons, and extra punctuation, normalize repeated characters
    const msg = message.toLowerCase()
        .trim()
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')  // Remove emojis
        .replace(/:[D\)dPp\(\)]+/g, '')         // Remove common emoticons :D :) :P etc
        .replace(/[!.,?]+$/, '')                // Remove trailing punctuation
        .replace(/(.)\1{2,}/g, '$1$1')          // Normalize repeated characters (e.g., hiii -> hii)
        .replace(/\s+/g, ' ')                   // Normalize spaces
        .replace(/\brán\b/gi, '')               // Remove mentions of Rán
        .trim();                                // Final trim
    
    // Enhanced logging with language detection
    console.log('\n👋 Enhanced Greeting Check:', {
        original: message,
        cleaned: msg,
        language: {
            isIcelandic: languageDecision.isIcelandic,
            confidence: languageDecision.confidence,
            reason: languageDecision.reason
        },
        patterns: {
            simpleEnglish: simpleEnglishGreetings.some(g => msg === g || msg === g + '!'),
            simpleIcelandic: simpleIcelandicGreetings.some(g => msg === g || msg === g + '!'),
            compositeIcelandic: compositeIcelandicGreetings.some(g => msg === g || msg === g + '!'),
            hasQuestion: msg.includes('?'),
            hasNumbers: /\d/.test(msg),
            hasIcelandicStarter: icelandicQuestionStarters.some(starter => msg.startsWith(starter)),
            isStandaloneGreeting: /^(?:hi+|he+y+|hello+)\b$/i.test(msg)
        }
    });

    // Early validation - prevent processing of invalid messages
    if (!msg) return false;                    // Empty message
    if (msg.includes('?')) return false;       // Questions
    if (msg.includes('@')) return false;       // Emails/mentions
    if (msg.includes('http')) return false;    // URLs
    if (/\d/.test(msg)) return false;          // Numbers

    // Handle common greeting variations with repeated characters
    if (/^(?:hi+|he+y+|hello+)\b$/i.test(msg)) {
        return true;
    }

    // Standalone English greetings (highest priority)
    if (/^(?:hi|hello|hey|hi there)\b$/i.test(msg)) {
        return true;
    }

    // Icelandic language check using new detection
    if (languageDecision.isIcelandic) {
        // Check for Icelandic greetings first
        if (/^(?:hæ|halló|sæl|sæll)\b$/i.test(msg)) {
            return true;
        }
    }

    // Check for Icelandic questions
    if (icelandicQuestionStarters.some(starter => msg.startsWith(starter))) {
        return false;
    }

    // Check for exact greeting matches with punctuation variations
    const exactGreetingMatch = languageDecision.isIcelandic ?
        (simpleIcelandicGreetings.some(g => msg === g || msg === g + '!') ||
         compositeIcelandicGreetings.some(g => msg === g || msg === g + '!')) :
        simpleEnglishGreetings.some(g => msg === g || msg === g + '!');
    
    if (exactGreetingMatch) return true;

    // Add explicit standalone Icelandic greeting check
    if (/^(?:hæ|halló|sæl|sæll)\b$/i.test(msg)) {
        return true;
    }

    // Check for compound greetings that start with known greetings
    const hasGreetingStart = languageDecision.isIcelandic ?
        simpleIcelandicGreetings.some(g => msg.startsWith(g + ' ')) :
        simpleEnglishGreetings.some(g => msg.startsWith(g + ' '));
    
    if (hasGreetingStart) return false;
    
    // Enhanced non-greeting indicators
    const notSimpleGreeting = [
        // English question/request words
        'can', 'could', 'would', 'do', 'does', 'is', 'are', 
        'what', 'when', 'where', 'why', 'how', 'should', 
        'may', 'might', 'please', 'thanks', 'thank',
        // Action words
        'help', 'need', 'want', 'looking', 'trying', 'get',
        'book', 'find', 'know', 'tell', 'show',
        // Icelandic indicators
        'má', 'er', 'hefur', 'getur', 'hvernig', 'hvar',
        'viltu', 'geturðu', 'mig langar', 'ég er', 'ég vil',
        'gætirðu', 'væri', 'get ég', 'má ég'
    ];
    
    // Check for any non-greeting indicators more thoroughly
    if (notSimpleGreeting.some(word => {
        // Check for word boundaries to prevent partial matches
        const pattern = new RegExp(`(^|\\s)${word}\\b`, 'i');
        return pattern.test(msg);
    })) {
        return false;
    }

    // If message is longer than 4 words, it's probably not a simple greeting
    if (msg.split(' ').length > 4) return false;

    // Final check - must explicitly match one of our greeting patterns or variations
    return languageDecision.isIcelandic ?
        (/^(?:hæ|halló|sæl|sæll)\b(?:\s*(?:there|rán))?\s*$/i.test(msg)) :
        (/^(?:hi+|he+y+|hello+)\b(?:\s*(?:there|rán))?\s*$/i.test(msg));
};

// Enhanced small talk patterns with better categorization
const smallTalkPatterns = {
    en: {
        wellbeing: [
            'how are you',
            'how\'s it going',
            'how do you do',
            'how are things',
            'what\'s up',
            'how you doing',
            'everything good',
            'all good'
        ],
        identity: [
            'who are you',
            'what can you do',
            'what do you do',
            'tell me about yourself',
            'your name',
            'who made you'
        ],
        greeting: [
            'nice to meet you',
            'good to meet you',
            'pleased to meet you',
            'great to meet you',
            'lovely to meet you',
            'wonderful to meet you'
        ],
        return: [
            'nice to see you',
            'good to see you',
            'great to see you',
            'glad to see you'
        ]
    },
    is: {
        wellbeing: [
            'hvernig hefurðu það',
            'allt gott',
            'hvað segirðu',
            'hvernig gengur',
            'allt í lagi'
        ],
        greeting: [
            'gaman að hitta þig',
            'gaman að kynnast þér',
            'gott að hitta þig',
            'gaman að sjá þig',
            'gott að sjá þig'
        ],
        identity: [
            'hver ert þú',
            'hvað geturðu',
            'segðu mér frá þér',
            'hvað heitirðu',
            'hver bjó þig til'
        ]
    }
};

// Add helper function for small talk detection
const detectSmallTalk = (message, languageDecision) => {
    const msg = message.toLowerCase().trim();

    // Log detection attempt
    console.log('\n💬 Small Talk Pattern Check:', {
        message: msg,
        language: {
            isIcelandic: languageDecision.isIcelandic,
            confidence: languageDecision.confidence,
            reason: languageDecision.reason
        },
        patterns: {
            enWellbeing: smallTalkPatterns.en.wellbeing.some(p => msg.includes(p)),
            enIdentity: smallTalkPatterns.en.identity.some(p => msg.includes(p)),
            enGreeting: smallTalkPatterns.en.greeting.some(p => msg.includes(p)),
            isWellbeing: smallTalkPatterns.is.wellbeing.some(p => msg.includes(p)),
            isGreeting: smallTalkPatterns.is.greeting.some(p => msg.includes(p))
        }
    });

    // Use language detection for initial check
    if (!languageDecision.isIcelandic || languageDecision.confidence === 'high') {
        for (const category in smallTalkPatterns.en) {
            if (smallTalkPatterns.en[category].some(pattern => msg.includes(pattern))) {
                return { isSmallTalk: true, language: 'en', category };
            }
        }
    }

    // Then check both languages if not confident
    for (const lang of ['en', 'is']) {
        for (const category in smallTalkPatterns[lang]) {
            if (smallTalkPatterns[lang][category].some(pattern => msg.includes(pattern))) {
                return { isSmallTalk: true, language: lang, category };
            }
        }
    }

    return { isSmallTalk: false, language: null, category: null };
};

// Add response selector helper
const getSmallTalkResponse = (result, languageDecision) => {
    // Use our new language detection
    const useEnglish = !languageDecision.isIcelandic || languageDecision.confidence === 'high';
    
    // Log response selection
    console.log('\n💬 Small Talk Response Selection:', {
        category: result.category || 'casual',
        language: {
            isIcelandic: languageDecision.isIcelandic,
            confidence: languageDecision.confidence,
            reason: languageDecision.reason
        }
    });

    // Get responses array with fallback to casual category
    const selectedLanguage = useEnglish ? SMALL_TALK_RESPONSES.en : SMALL_TALK_RESPONSES.is;
    const category = result.category || 'casual';
    const responses = selectedLanguage[category] || selectedLanguage.casual;

    // Select random response from the array
    return responses[Math.floor(Math.random() * responses.length)];
};

const acknowledgmentPatterns = {
    simple: {
        en: [
            // Single word acknowledgments
            'thanks', 'ok', 'okay', 'perfect', 'great', 'good', 'noted',
            'understood', 'alright', 'sure', 'yep', 'cool', 'right',
            'clear', 'fine', 'brilliant', 'excellent', 'wonderful',
            'sweet', 'fab', 'indeed', 'absolutely', 'certainly',
            // Two word variations
            'got it', 'i see', 'makes sense', 'thank you',
            'sounds good', 'fair enough', 'very good', 'very well',
            'got that', 'understand completely', 'crystal clear',
            'makes perfect', 'thanks alot', 'thanks so',
            // Three+ word variations
            'that makes sense', 'i got it', 'i understand that',
            'that sounds good', 'that works fine', 'makes perfect sense',
            'thanks a lot', 'thanks so much', 'thank you very',
            'that makes perfect', 'that is clear', 'that is good',
            'that is perfect', 'i see that', 'got it thanks',
            'makes sense now', 'understand it now', 'that helps alot',
            // Ah variations  
            'ah ok', 'ah okay', 'ah right', 'ah yes', 'ah perfect',
            // That's variations
            'thats good', 'thats great', 'thats perfect', 'thats fine',
            'thats clear', 'thats right', 'thats wonderful', 'thats excellent',
            'thats brilliant', "that's good", "that's great", "that's perfect",
            "that's fine", "that's clear", "that's right", "that's wonderful",
            "that's excellent", "that's brilliant"
        ],
        is: [
            'æði', 'takk', 'takk fyrir', 'allt í lagi', 'frábært', 'flott', 'skil', 'já',
            'geggjað', 'næs', 'gott að vita', 'skil þetta', 'érna', 'einmitt',
            'ég skil', 'ókei', 'í góðu', 'allt skýrt', 'mhm', 'jebb', 'jepp',
            'akkúrat', 'nákvæmlega', 'nákvæmlega þetta', 'skil vel', 
            'þetta er skýrt', 'allt skilið', 'í fínu', 'snilld', 'frábært mál',
            'flott mál', 'góð punktar', 'skil þetta vel', 'algjörlega', 
            'klárlega', 'augljóslega', 'hiklaust', 'örugglega', 'vissulega',
            'alveg rétt', 'rétt hjá þér', 'þetta er rétt', 'já einmitt',
            'ah já', 'ah ok', 'ah ókei', 'mm', 'mmm', 'mmmhm', 'aha', 
            'ekkert mál', 'ekkert núna'
        ]
    },
    positive: {
        en: [
            'very helpful', 'so helpful', 'really helpful',
            'really good', 'very good', 'so good',
            'perfect', 'excellent', 'wonderful', 'fantastic', 'amazing',
            'appreciate', 'thanks for', 'thank you for',
            'that helps', 'that helped', 'this helps', 'helps a lot',
            'super helpful', 'extremely helpful', 'incredibly helpful',
            'great help', 'perfect help', 'exactly what i needed',
            'just what i needed', 'that was perfect', 'that was great',
            'that was wonderful', 'that was fantastic', 'that was amazing',
            'that was excellent', 'brilliant', 'superb', 'outstanding',
            'magnificent', 'splendid', 'marvelous', 'terrific',
            'thank you so much', 'thanks so much', 'much appreciated',
            'greatly appreciated', 'really appreciate', 'appreciate it',
            'appreciate that', 'appreciate your help', 'appreciate the help',
            'thank you for your help', 'thanks for your help',
            'this is perfect', 'this is excellent', 'this is great',
            'this is wonderful', 'this is fantastic', 'this is amazing',
            'answered perfectly', 'perfect answer', 'great answer',
            'excellent answer', 'wonderful answer', 'fantastic answer'
        ],
        is: [
            'frábært', 'hjálplegt', 'gott', 'þægilegt', 'æðislegt',
            'dásamlegt', 'geggjað', 'ótrúlegt', 'snilld', 'snilld takk', 'gott að vita',
            'þetta hjálpaði', 'hjálpaði mikið', 'rosalega hjálplegt',
            'alveg frábært', 'alveg æðislegt', 'alveg dásamlegt',
            'alveg geggjað', 'alveg ótrúlegt', 'alveg snilld',
            'þetta var frábært', 'þetta var æðislegt', 'þetta var dásamlegt',
            'þetta var geggjað', 'þetta var ótrúlegt', 'þetta var snilld',
            'þetta er nákvæmlega það sem ég þurfti', 'nákvæmlega það sem ég var að leita að',
            'kærar þakkir', 'þakka þér fyrir', 'þakka þér kærlega',
            'þúsund þakkir', 'mjög þakklát/ur', 'innilega þakkir',
            'frábær hjálp', 'fullkomin hjálp', 'ómetanleg hjálp',
            'þetta er nákvæmlega það', 'þetta er fullkomið',
            'algjör snilld', 'algjört æði', 'hrein snilld',
            'stórkostlegt', 'magnað', 'meiriháttar', 'framúrskarandi',
            'þetta var akkúrat', 'þetta hjálpaði mikið',
            'rosa gott', 'rosalega gott', 'virkilega gott',
            'virkilega hjálplegt', 'rosalega hjálplegt', 'hjálpsamt'
        ]
    },
    continuity: {
        en: [
            'a few more questions', 'can i ask', 'actually',
            'have questions', 'want to ask', 'few more',
            'another question', 'one more thing', 'one more question',
            'something else', 'also wanted to ask', 'also wondering',
            'while i have you', 'since i have you', 'before you go',
            'just one more', 'quick question', 'quick follow up',
            'follow up question', 'related question', 'similar question',
            'on that note', 'speaking of that', 'that reminds me',
            'that made me think', 'that brings up', 'that leads me to',
            // Remove 'wondering about' and similar general inquiry patterns
            'could i also ask', 'mind if i ask', 'if i could ask',
            'one other thing', 'couple more things', 'few other things',
            'additional question', 'furthermore', 'additionally',
            'on a related note', 'in addition', 'moreover'
        ],
        is: [
            'fleiri spurningar', 'má ég spyrja', 'reyndar',
            'er með spurningar', 'vil spyrja', 'aðra spurningu',
            'spyrja meira', 'ein spurning í viðbót', 'ein spurning enn',
            'eitthvað annað', 'vildi líka spyrja', 'er líka að pæla',
            'fyrst ég er kominn', 'áður en þú ferð', 'bara ein í viðbót',
            'stutt spurning', 'svona tengt þessu', 'tengd spurning',
            'sambærileg spurning', 'það minnir mig á', 'það fær mig til að hugsa',
            'það leiðir mig að', 'er að velta fyrir mér', 'forvitinn um',
            'langar að vita', 'þarf að vita', 'vil vita meira um',
            'mætti ég líka spyrja', 'ef ég mætti spyrja',
            'eitt annað', 'nokkur önnur atriði', 'aðeins meira',
            'aukaleg spurning', 'að auki', 'ennfremur',
            'í framhaldi af því', 'annað svipað', 'samt sem áður',
            'þó að lokum', 'ein síðasta spurning', 'þegar ég hugsa um það',
            'það kom mér í hug', 'mér datt í hug', 'hélt ég myndi spyrja',
            'úr því að ég er kominn', 'úr því að við erum að ræða þetta'
        ]
    },
    general: {
        en: [
            'impressed with this chat',
            'impressed with you',
            'chat is helpful',
            'chat is great',
            'really cool system',
            'works well',
            'works great',
            'loving this',
            'love this',
            'really like this',
            'good chat',
            'great chat',
            'nice chat'
        ],
        is: [
            'gaman að spjalla',
            'gott spjall',
            'virkar vel',
            'þetta er frábært',
            'þetta er geggjað',
            'mjög gott kerfi',
            'þetta er snilld',
            'virkar mjög vel',
            'gott að geta spjallað'
        ]
    },
    finished: {
        en: [
            'nothing else',
            'nothing now',
            'not right now',
            'nothing more',
            'no more questions',
            'that is all',
            "that's all",
            'nothing else thanks',
            'nothing else right now',
            'thats all for now',
            "that's all for now",
            // Add new variations
            'nothing right now',
            'not now',
            'nothing at the moment',
            'maybe later',
            'another time',
            'just saying hi',
            'just saying hello',
            'just wanted to say hi',
            'just wanted to say hello',
            'just greeting',
            'just saying hey'
        ],
        is: [
            'ekkert annað',
            'ekkert núna',
            'ekkert meira',
            'ekkert að sinni',
            'ekkert fleira',
            'það er allt',
            'það er allt í bili',
            'ekkert annað takk',
            'ekkert meira takk',
            'ekkert fleira takk',
            'þetta var það',
            // Add new variations
            'bara að heilsa',
            'bara heilsa',      // Need to add this variation
            'er bara að heilsa',
            'var bara að heilsa',
            'bara að prufa',
            'bara prufa',
            'bara að kíkja',
            'bara að líta við',
            'kannski seinna',
            'seinna meir',
            'ekki núna',
            'ekki að sinni',
            'ekki í augnablikinu',
            'bara að skoða',
            'bara að kveðja'
        ]
    }
};

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
        en: ['how', 'what', 'when', 'where', 'why', 'can', 'do', 'does', 'which'],
        is: ['hvernig', 'hvað', 'hvenær', 'hvar', 'af hverju', 'get', 'er', 'má', 'hver']
    }
};

// Helper functions for response handling
const getContextualResponse = (type, previousResponses = [], languageDecision) => {
    let responses;
    switch(type) {
        case 'acknowledgment':
            responses = languageDecision.isIcelandic ? ACKNOWLEDGMENT_RESPONSES.is : ACKNOWLEDGMENT_RESPONSES.en;
            break;
        case 'small_talk':
            responses = languageDecision.isIcelandic ? SMALL_TALK_RESPONSES.is : SMALL_TALK_RESPONSES.en;
            break;
        case 'confirmation':
            responses = languageDecision.isIcelandic ? CONFIRMATION_RESPONSES.is : CONFIRMATION_RESPONSES.en;
            break;
        default:
            responses = languageDecision.isIcelandic ? ACKNOWLEDGMENT_RESPONSES.is : ACKNOWLEDGMENT_RESPONSES.en;
    }
    
    const availableResponses = responses.filter(r => !previousResponses.includes(r));
    return availableResponses[Math.floor(Math.random() * availableResponses.length)];
};

// Add this with your other constants/helper functions, before the chat endpoint
const checkSimpleResponse = (message, languageDecision) => {
    const strictIcelandicResponses = [
        // Basic responses
        'allt í lagi', 'frábært', 'takk', 'flott', 'næs', 'æðislegt', 'æðisleg',  // Added æðisleg
        // Thank you variations
        'takk fyrir', 'takk kærlega', 'kærar þakkir', 'takk fyrir þetta', 
        'takk fyrir aðstoðina', 'takk kæra', 'þúsund þakkir', 'ók takk',
        'okei takk', 'oki takk', 'ókei takk',
        // Positive feedback
        'mjög gott', 'algjör snilld', 'gott að heyra',
        'það er frábært', 'glæsilegt', 'snilld', 'snillingur',
        // Additional variations
        'flott er', 'flott takk'
    ];
    const strictEnglishResponses = [
        'perfect', 'great', 'thanks', 'thank you', 'alright',
        "that's it", "that's all", "that's all thanks", "that's it thanks"  // Added these
    ];
    
    const msg = message.toLowerCase().trim().replace(/[!.?]/g, '');
    
    // Use languageDecision for initial check
    if (languageDecision.isIcelandic && languageDecision.confidence === 'high') {
        return 'is';
    }

    // Handle 'gott að vita' specifically
    if (msg === 'gott að vita') {
        return 'is';
    }

    // Handle "bara" phrases
    if (msg.startsWith('bara ') || msg === 'bara heilsa' || msg === 'bara að heilsa') {
        return 'is';
    }
    
    // Handle standalone oki/okei variations
    if (msg === 'oki' || msg === 'okei' || msg === 'óki' || msg === 'ókei') return 'is';

    // Enhanced ok/oki/okei handling - KEEPING THE ORIGINAL WORKING VERSION
    if (msg.startsWith('ok ')) {
        const afterOk = msg.slice(3);
        if (strictEnglishResponses.some(word => afterOk === word)) return 'en';
        if (strictIcelandicResponses.some(word => afterOk === word)) return 'is';
    }
    
    // Check if message starts with any Icelandic responses
    if (strictIcelandicResponses.some(word => msg.startsWith(word))) return 'is';
    
    // Check if message contains certain Icelandic positive phrases
    const icelandicPhrases = ['snilld', 'frábært', 'gott', 'æðislegt', 'glæsilegt'];
    if (icelandicPhrases.some(phrase => msg.includes(phrase))) return 'is';
    
    // Basic exact matches
    if (strictIcelandicResponses.some(word => msg === word)) return 'is';
    if (strictEnglishResponses.some(word => msg === word)) return 'en';
    
    // Handle standalone 'ok' based on context - MOVED TO END
    if (msg === 'ok' || msg === 'okay') {
        // First check language detection
        if (languageDecision.isIcelandic) {
            return 'is';
        }
        // Fall back to context checks
        const currentSession = conversationContext.get('currentSession');
        const context = currentSession ? conversationContext.get(currentSession) : null;
        if (context?.language === 'is') {
            return 'is';
        }
        if (context?.lastResponse?.includes('þú') || 
            context?.icelandicTopics?.length > 0 ||
            context?.messages?.some(m => m.content.includes('þú'))) {
            return 'is';
        }
        return 'en';
    }

    // Default to previous language context if available
    const currentSession = conversationContext.get('currentSession');
    const context = currentSession ? conversationContext.get(currentSession) : null;
    if (context?.language === 'is' && !strictEnglishResponses.some(word => msg.includes(word))) {
        return 'is';
    }
    
    // If no specific matches, use languageDecision
    return languageDecision.isIcelandic ? 'is' : 'en';
};

// Late Arrival and Booking Constants
const LATE_ARRIVAL_THRESHOLDS = {
    GRACE_PERIOD: 30,
    MODIFICATION_RECOMMENDED: 60
};

// Enhanced time and delay qualifiers
const LATE_QUALIFIERS = [
    'very late',
    'really late',
    'quite late',
    'so late',
    'too late',
    'pretty late',
    'an hour late',
    'one hour late',
    'hour late',
    'much later',
    'way later',
    'significantly late',
    'way too late',
    'extremely late',
    'super late'
];

// Add new time conversion helpers
const TIME_CONVERSIONS = {
    hour: 60,
    hr: 60,
    h: 60,
    minute: 1,
    min: 1,
    mins: 1,
    half: 30,      // For "hour and a half"
    quarter: 15,   // For "quarter of an hour"
};

const BOOKING_RESPONSES = {
    unspecified_delay: [
        "Could you let us know approximately how late you'll be? This will help us assist you better. For delays up to 30 minutes, you can proceed directly to reception. For longer delays, we'll help you find a better time.",
        "To help you best, could you tell us roughly how late you expect to be? We have a 30-minute grace period, but for longer delays we'll need to find you a more suitable time."
    ],
    flight_delay: [
        "I understand you're experiencing flight delays. Since your arrival time is uncertain, we'll help find a solution. Please call us at +354 527 6800 (9 AM - 7 PM) or email reservations@skylagoon.is - we regularly assist guests with flight delays and will help arrange the best option for you.",
        "Due to your flight delay situation, let's help you arrange a better time. Please call +354 527 6800 (9 AM - 7 PM) or email reservations@skylagoon.is - we're experienced in handling flight delays and will find the best solution for your visit."
    ],
    within_grace: [
        "Don't worry - we have a 30-minute grace period for all bookings. You can proceed directly to our reception when you arrive. You might experience a brief wait during busy periods, but our reception team will accommodate you.",
        "Thank you for letting us know. Since you're within our 30-minute grace period, you can proceed directly to reception when you arrive. You might experience a brief wait during busy periods, but our reception team will accommodate you.",
        "No problem - you're within our 30-minute grace period. Just come when you can and our reception team will take care of you. You might experience a brief wait during busy periods, but we'll accommodate you."
    ],
    moderate_delay: {
        normal: [
            "Since you'll be more than 30 minutes late, we'd be happy to help change your booking to a time that works better. You can call us at +354 527 6800 (9 AM - 7 PM) or email: reservations@skylagoon.is.",
            "As you'll be delayed by more than 30 minutes, we recommend changing your booking. Our team can help find a perfect new time - just call +354 527 6800 (9 AM - 7 PM) or email us."
        ],
        sold_out: [
            "Since we're fully booked today and you'll be more than 30 minutes late, we recommend changing your booking to ensure the best experience. Please call us at +354 527 6800 (9 AM - 7 PM) to find a suitable time.",
            "As today is sold out and you'll be more than 30 minutes delayed, let's find you a better time. Call us at +354 527 6800 (9 AM - 7 PM) and we'll help arrange this."
        ]
    },
    significant_delay: [
        "For a delay of this length, we recommend rebooking for a time that works better for you. Our team is ready to help at +354 527 6800 (9 AM - 7 PM) or via email at: reservations@skylagoon.is.",
        "Let's find you a more suitable time since you'll be significantly delayed. Please call us at +354 527 6800 (9 AM - 7 PM) or email us, and we'll gladly help arrange this."
    ]
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
        "I'm still learning about that aspect of Sky Lagoon. Would you like to speak with a team member? You can reach us at +354 527 6800 (available 9 AM - 7 PM local time) or by email at: reservations@skylagoon.is.",
        "I'm not fully familiar with that yet. Would you like me to connect you with our team? You can reach them at +354 527 6800 (9 AM - 7 PM local time) or by email at: reservations@skylagoon.is",
        "I want to make sure you receive accurate information. For this specific query, please contact our team at +354 527 6800 (9 AM - 7 PM local time) or by email at: reservations@skylagoon.is"
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

// Handle Unknown Query
const handleUnknownQuery = (userMessage, confidenceScore, relevantKnowledge, languageDecision) => {
    // Log analysis start
    console.log('\n❓ Unknown Query Analysis:', {
        message: userMessage,
        confidence: confidenceScore,
        language: {
            isIcelandic: languageDecision.isIcelandic,
            confidence: languageDecision.confidence,
            reason: languageDecision.reason
        },
        matchedTopics: relevantKnowledge.map(k => k.type)
    });

    // If we have ANY relevant knowledge, prioritize it
    if (relevantKnowledge && relevantKnowledge.length > 0) {
        console.log('📝 Found relevant knowledge, using knowledge base response');
        return null;
    }

    // Only skip for very short acknowledgments (changed from 20/4 to 10/2)
    if (userMessage.length < 10 && userMessage.split(' ').length <= 2) {
        console.log('📝 Very short acknowledgment detected, skipping unknown query handling');
        return null;
    }

    // Only treat as completely unknown if we have zero knowledge and zero confidence
    if (confidenceScore === 0 && (!relevantKnowledge || relevantKnowledge.length === 0)) {
        console.log('📝 Query Type: COMPLETELY_UNKNOWN');
        return {
            type: UNKNOWN_QUERY_TYPES.COMPLETELY_UNKNOWN,
            response: getRandomResponse(languageDecision.isIcelandic ? 
                UNKNOWN_QUERY_RESPONSES.COMPLETELY_UNKNOWN_IS : 
                UNKNOWN_QUERY_RESPONSES.COMPLETELY_UNKNOWN)
        };
    }

    // In all other cases, let the normal response system handle it
    return null;
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

// ADD THE NEW CONSTANTS HERE 👇
const activeConnections = new Map();  // Track active WebSocket connections
const conversationBuffer = new Map(); // Buffer recent conversations

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

// Helper function for late arrival detection.
const detectLateArrivalScenario = (message, languageDecision, context) => {
    const lowerMessage = message.toLowerCase();

    // Add time extraction helper at the top
    const extractTimeInMinutes = (timeStr) => {
        const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(?:([AaPp][Mm])|([Hh]))?/);
        if (!match) return null;
        
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const meridiem = match[3]?.toLowerCase();
        
        // Convert to 24-hour format if PM
        if (meridiem === 'pm' && hours !== 12) hours += 12;
        if (meridiem === 'am' && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
    };

    // Early check for "bara" greetings using regex
    if (/^bara\s+(heilsa|að heilsa|prufa)$/i.test(lowerMessage)) {
        console.log('\n👋 Bara greeting detected');
        return null;
    }    
    
    // Helper function to check if a word exists as a complete word
    const hasCompleteWord = (text, word) => {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(text);
    };

    // MOST IMPORTANT: Log what we're detecting
    console.log('\n🔍 Analyzing message for late arrival/booking change:', {
        message: lowerMessage,
        language: {
            isIcelandic: languageDecision?.isIcelandic,
            confidence: languageDecision?.confidence,
            reason: languageDecision?.reason
        },
        hasDateChange: lowerMessage.includes('tomorrow') || lowerMessage.includes('next') ||
                      (languageDecision?.isIcelandic && (lowerMessage.includes('á morgun') || lowerMessage.includes('næst'))),
        hasBSI: lowerMessage.includes('bsi') || lowerMessage.includes('transfer'),
        hasBookingReference: /SKY-[A-Z0-9]+/.test(message),
        hasFlightDelay: lowerMessage.includes('flight') || 
                       (languageDecision?.isIcelandic && lowerMessage.includes('flug')),
        hasTransfer: lowerMessage.includes('transfer') || 
                    (languageDecision?.isIcelandic && lowerMessage.includes('rútu'))
    });

    // Add debug log here
    console.log('\n🔎 FLIGHT DELAY DEBUG:', {
        message: lowerMessage,
        hasFlight: lowerMessage.includes('flight') || 
                  (languageDecision?.isIcelandic && lowerMessage.includes('flug')),
        hasDelay: lowerMessage.includes('delay') || lowerMessage.includes('delayed') ||
                 (languageDecision?.isIcelandic && (lowerMessage.includes('seinn') || lowerMessage.includes('töf'))),
        hasAirport: lowerMessage.includes('airport') ||
                   (languageDecision?.isIcelandic && lowerMessage.includes('flugvöll')),
        hasTime: lowerMessage.match(/\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?/),
        fullMessage: message
    });

    // FIRST: Check for flight delay situations 
    if (
        // Check for "just leave/left airport" patterns first
        (/just\s+(?:leave|left|leaving)\s+airport/.test(lowerMessage) ||
         (languageDecision?.isIcelandic && /rétt\s+(?:fór|farinn|farin)\s+(?:frá)?\s*flugvöll/.test(lowerMessage))) ||
        // Flight delay combination
        ((lowerMessage.includes('flight') || (languageDecision?.isIcelandic && lowerMessage.includes('flug'))) && 
         (lowerMessage.includes('delay') || lowerMessage.includes('delayed') ||
          (languageDecision?.isIcelandic && (lowerMessage.includes('seinn') || lowerMessage.includes('töf'))))) ||
        // Airport combination with leave/wait
        ((lowerMessage.includes('airport') || (languageDecision?.isIcelandic && lowerMessage.includes('flugvöll'))) && 
         (lowerMessage.includes('just leave') || 
          lowerMessage.includes('just left') ||
          lowerMessage.includes('waiting') ||
          lowerMessage.includes('delayed') ||
          (languageDecision?.isIcelandic && (
              lowerMessage.includes('rétt farinn') ||
              lowerMessage.includes('bíð') ||
              lowerMessage.includes('seinn')
          ))))
    ) {
        console.log('\n✈️ Flight delay detected');
        return {
            type: 'flight_delay',
            minutes: null
        };
    }

    // SECOND: Check time differences and booking modifications
    const times = lowerMessage.match(/\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?/g);
    if (times && times.length >= 2) {
        const time1 = extractTimeInMinutes(times[0]);
        const time2 = extractTimeInMinutes(times[1]);
        
        if (time1 !== null && time2 !== null) {
            const difference = Math.abs(time1 - time2);
            console.log('\n⏰ Extracted minutes:', {
                time1: time1,
                time2: time2,
                difference: difference
            });
            
            // Only then check for booking modifications
            if (difference > 30 && (
                lowerMessage.includes('earlier') ||
                lowerMessage.includes('adjust') ||
                lowerMessage.includes('change') ||
                lowerMessage.includes('move') ||
                lowerMessage.includes('instead') ||
                (languageDecision?.isIcelandic && (
                    lowerMessage.includes('fyrr') ||
                    lowerMessage.includes('breyta') ||
                    lowerMessage.includes('færa') ||
                    lowerMessage.includes('í staðinn')
                ))
            )) {
                console.log('\n📅 Booking modification detected - significant time difference');
                return null;
            }
        }
    }

    // THIRD: Check for BSÍ/transfer changes
    if (
        // BSÍ mentions
        lowerMessage.includes('bsi') ||
        lowerMessage.includes('transfer') ||
        (languageDecision?.isIcelandic && (
            lowerMessage.includes('rútu') ||
            lowerMessage.includes('strætó')
        )) ||
        // Transfer time changes
        (lowerMessage.match(/\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?/) && 
         (lowerMessage.includes('shuttle') || 
          lowerMessage.includes('bus') || 
          lowerMessage.includes('transport') ||
          (languageDecision?.isIcelandic && (
              lowerMessage.includes('rútu') ||
              lowerMessage.includes('strætó') ||
              lowerMessage.includes('ferð')
          ))))
    ) {
        console.log('\n🚌 Transfer change detected');
        return null;  // Let regular booking change handling take over
    }

    // FOURTH: Check for future date/time changes (not late arrival)
    if (
        // Future dates
        lowerMessage.includes('tomorrow') ||
        lowerMessage.includes('next day') ||
        lowerMessage.includes('next week') ||
        lowerMessage.includes('another day') ||
        lowerMessage.includes('different day') ||
        // Specific date change requests
        (lowerMessage.includes('date') && 
         (lowerMessage.includes('change') || 
          lowerMessage.includes('move') || 
          lowerMessage.includes('switch'))) ||
        // Alternative dates
        lowerMessage.includes('day after') ||
        lowerMessage.includes('different date') ||
        // Icelandic date changes
        (languageDecision?.isIcelandic && (
            lowerMessage.includes('á morgun') ||
            lowerMessage.includes('næsta dag') ||
            lowerMessage.includes('næstu viku') ||
            lowerMessage.includes('annan dag') ||
            lowerMessage.includes('breyta dagsetningu') ||
            lowerMessage.includes('færa daginn')
        ))
    ) {
        console.log('\n📅 Future date change request detected');
        return null;
    }

    // FIFTH: Check for alternative time requests (not late arrival)
    if (
        // BSÍ transfer changes
        ((lowerMessage.includes('bsi') || lowerMessage.includes('transfer') ||
          (languageDecision?.isIcelandic && lowerMessage.includes('rútu'))) &&
         (lowerMessage.includes('instead') || 
          lowerMessage.includes('change') || 
          lowerMessage.includes('earlier') ||
          lowerMessage.includes('different') ||
          (languageDecision?.isIcelandic && (
              lowerMessage.includes('í staðinn') ||
              lowerMessage.includes('breyta') ||
              lowerMessage.includes('fyrr') ||
              lowerMessage.includes('annan')
          )) ||
          lowerMessage.match(/(?:from|at)\s+\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?\s+to/))) ||
        // Time preference queries
        (lowerMessage.includes('possible') && 
         lowerMessage.match(/\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?/)) ||
        // Availability questions
        ((lowerMessage.includes('available') || 
          (languageDecision?.isIcelandic && lowerMessage.includes('laust'))) && 
         lowerMessage.includes('time')) ||
        // Clear booking changes
        lowerMessage.includes('earlier time') || 
        lowerMessage.includes('move up') ||
        (languageDecision?.isIcelandic && (
            lowerMessage.includes('fyrri tíma') ||
            lowerMessage.includes('færa fram')
        )) ||
        // Moving TO a specific time (booking change)
        lowerMessage.match(/(?:move|change).*to.*\d{1,2}(?:\s*:\s*\d{2})?(?:\s*[AaPp][Mm])?/) ||
        (languageDecision?.isIcelandic && 
         lowerMessage.match(/(?:færa|breyta).*til.*\d{1,2}(?:\s*:\s*\d{2})?/)) ||
        // "Change booking" without late/delay context
        ((lowerMessage.includes('change') && 
          lowerMessage.includes('booking') && 
          !lowerMessage.includes('late') &&
          !lowerMessage.includes('delay')) ||
         (languageDecision?.isIcelandic && (
             lowerMessage.includes('breyta') && 
             lowerMessage.includes('bókun') && 
             !lowerMessage.includes('sein') &&
             !lowerMessage.includes('töf')
         ))) ||
        // Has booking reference
        /SKY-[A-Z0-9]+/.test(message) ||
        // Moving to earlier in day (booking change)
        (lowerMessage.match(/\d{1,2}(?:\s*:\s*\d{2})?(?:\s*[AaPp][Mm])?/) && 
         (lowerMessage.includes('earlier') || 
          lowerMessage.includes('move') ||
          lowerMessage.includes('change') ||
          (languageDecision?.isIcelandic && (
              lowerMessage.includes('fyrr') ||
              lowerMessage.includes('færa') ||
              lowerMessage.includes('breyta')
          )))) ||
        // Plans changed mentions
        ((lowerMessage.includes('plans') && 
          lowerMessage.includes('changed') &&
          !lowerMessage.includes('delay')) ||
         (languageDecision?.isIcelandic && (
             lowerMessage.includes('plön') && 
             lowerMessage.includes('breyttust') &&
             !lowerMessage.includes('töf')
         ))) ||
        // Match Icelandic time change format (15:00, 17:00, etc.)
        (lowerMessage.match(/\d{1,2}[:;]\d{2}/) && 
         (lowerMessage.includes('færa') || lowerMessage.includes('breyta')))
    ) {
        console.log('\n⏰ Alternative time request detected');
        return null;
    }

    // Check for explicit time difference mentions with enhanced patterns
    const bookingTimeMatch = lowerMessage.match(/(?:book(?:ed|ing)?|ticket|reservation|booking)\s+(?:is|for|at|was)?\s*(?:at|for)?\s*(\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?)/);
    let arrivalTimeMatch = lowerMessage.match(/(?:arrive|coming|there|visit|get there|be there|make it|show up|will arrive)\s+(?:at|by|around|near)?\s*(\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?)/);

    // Debug log for initial matches
    console.log('\n🕒 Time Pattern Matches:', {
        message: lowerMessage,
        bookingMatch: bookingTimeMatch ? bookingTimeMatch[1] : null,
        arrivalMatch: arrivalTimeMatch ? arrivalTimeMatch[1] : null
    });

    // Additional pattern for "running late" scenarios
    if (!arrivalTimeMatch) {
        const lateTimeMatch = lowerMessage.match(/(?:if|can|would|will)?\s*(?:we|i)?\s*(?:come|arrive|be there|get there|make it)\s*(?:at|by|around|until|near)?\s*(\d{1,2}(?::\d{2})?(?:\s*[AaPp][Mm])?)/);
        if (lateTimeMatch) {
            arrivalTimeMatch = lateTimeMatch;
            console.log('\n🕒 Late Pattern Match Found:', lateTimeMatch[1]);
        }
    }

    if (bookingTimeMatch && arrivalTimeMatch) {
        const bookingTime = extractTimeInMinutes(bookingTimeMatch[1]);
        const arrivalTime = extractTimeInMinutes(arrivalTimeMatch[1]);
        
        // Debug log for extracted times
        console.log('\n⏲️ Extracted Times:', {
            booking: {
                raw: bookingTimeMatch[1],
                minutes: bookingTime
            },
            arrival: {
                raw: arrivalTimeMatch[1],
                minutes: arrivalTime
            }
        });

        if (bookingTime !== null && arrivalTime !== null) {
            // Check if trying to arrive earlier than booking
            if (arrivalTime < bookingTime) {
                console.log('\n⏰ Early Arrival Request:', {
                    bookingTime,
                    arrivalTime,
                    difference: bookingTime - arrivalTime
                });
                // Not a late arrival scenario - early arrival request
                return {
                    type: 'early_arrival',
                    minutes: bookingTime - arrivalTime
                };
            }

            const difference = arrivalTime - bookingTime;
            console.log('\n⏰ Time Difference Analysis:', {
                bookingTime,
                arrivalTime,
                difference,
                category: difference > 60 ? 'significant_delay' :
                         difference > 30 ? 'moderate_delay' :
                         difference > 0 ? 'within_grace' : 'invalid'
            });
            
            // Direct time difference handling without nesting
            if (difference <= 0) {
                return null;  // Invalid time difference
            }
            
            if (difference > 60) {
                return {
                    type: 'significant_delay',
                    minutes: difference
                };
            }
            
            if (difference > 30) {  // Will catch 31-60 minutes
                return {
                    type: 'moderate_delay',
                    minutes: difference
                };
            }
            
            // Will catch 1-30 minutes
            return {
                type: 'within_grace',
                minutes: difference
            };
        }
    }

    // Only now check for actual late arrival time patterns
    const timePatterns = [
        // Complex hour and minute combinations first
        /(?:about|around|maybe|perhaps)?\s*(\d+)\s*hours?\s+and\s+(\d+)\s*(?:minute|min|minutes|mins?)\s*(?:late|delay)?/i,
        /(\d+)\s*hours?\s+and\s+(\d+)\s*(?:minute|min|minutes|mins?)\s*(?:late|delay)?/i,
        
        // Half and quarter hour expressions
        /(?:an?|one)\s+and\s+(?:a\s+)?half\s+hours?\s*(?:late|delay)?/i,
        /(?:a|an?)?\s*hour\s+and\s+(?:a\s+)?half\s*(?:late|delay)?/i,
        /(\d+)\s*and\s+(?:a\s+)?half\s+hours?\s*(?:late|delay)?/i,
        /quarter\s+(?:of\s+)?(?:an?\s+)?hour\s*(?:late|delay)?/i,
        /(?:a|an?)?\s*hour\s+and\s+(?:a\s+)?quarter\s*(?:late|delay)?/i,
        
        // Single hour patterns
        /(\d+)\s*(?:hour|hr|hours|hrs?)\s*(?:late|delay)?/i,
        /(?:an?|one)\s*(?:hour|hr|h)\s*(?:late|delay)?/i,
        
        // Minutes with various prefixes
        /(?:about|around|maybe|perhaps)\s+(\d+)\s(?:minute|min|minutes|mins?)\s*(?:late|delay)?/i,
        /(\d+)\s(?:minute|min|minutes|mins?)\s*(?:late|delay)?/i,
        /late\s(?:by\s)?(\d+)\s(?:minute|min|minutes|mins?)/i,
        
        // General time mentions WITH late/delay context only
        /(?:minute|min|minutes|mins?)\s*(\d+)\s*(?:late|delay)/i,

        // Add Icelandic time patterns
        ...(languageDecision?.isIcelandic ? [
            /(\d+)\s*klst?\s*og\s*(\d+)\s*mín?/i,
            /(\d+)\s*klst?/i,
            /(\d+)\s*mín?/i,
            /hálftími/i,
            /korter/i
        ] : [])
    ];

    let minutes = null;
    for (const pattern of timePatterns) {
        const match = message.match(pattern);
        if (match) {
            console.log('\n🕐 Time Match Found:', {
                pattern: pattern.toString(),
                match: match
            });

            if (pattern.toString().includes('hours? and') || pattern.toString().includes('klst?\\s*og')) {
                // Handle "X hours and Y minutes" explicitly
                const hours = parseInt(match[1]);
                const mins = parseInt(match[2]);
                minutes = (hours * TIME_CONVERSIONS.hour) + (mins * TIME_CONVERSIONS.minute);
            } else if (pattern.toString().includes('half') || pattern.toString().includes('hálf')) {
                if (match[1]) {
                    // "2 and a half hours"
                    minutes = (parseInt(match[1]) * TIME_CONVERSIONS.hour) + TIME_CONVERSIONS.half;
                } else {
                    // "hour and a half" or "one and a half hours" or "hálftími"
                    minutes = TIME_CONVERSIONS.hour + TIME_CONVERSIONS.half;
                }
            } else if (pattern.toString().includes('quarter') || pattern.toString().includes('korter')) {
                if (pattern.toString().includes('hour and')) {
                    minutes = TIME_CONVERSIONS.hour + TIME_CONVERSIONS.quarter;
                } else {
                    minutes = TIME_CONVERSIONS.quarter;
                }
            } else if (pattern.toString().includes('hour') || pattern.toString().includes('klst')) {
                if (match[1] === undefined && pattern.toString().includes('an|one|a')) {
                    minutes = TIME_CONVERSIONS.hour;
                } else {
                    minutes = parseInt(match[1]) * TIME_CONVERSIONS.hour;
                }
            } else {
                minutes = parseInt(match[1]) * TIME_CONVERSIONS.minute;
            }

            console.log('\n⏰ Time Calculation:', {
                input: message,
                hours: Math.floor(minutes / 60),
                minutes: minutes % 60,
                totalMinutes: minutes
            });

            break;
        }
    }

    // ONLY process minutes if we have a clear late/delay context
    if (minutes !== null) {
        // Extra check - make sure we have late/delay context
        const hasLateContext = lowerMessage.includes('late') || 
                             lowerMessage.includes('delay') || 
                             (languageDecision?.isIcelandic && (
                                 lowerMessage.includes('sein') ||
                                 lowerMessage.includes('töf')
                             )) ||
                             context?.lastTopic === 'late_arrival' ||  // Check context
                             context?.lateArrivalContext?.isLate;      // Check late arrival state

        if (!hasLateContext) {
            console.log('\n⚠️ Time found but no late/delay context - not treating as late arrival');
            return null;
        }
        
        return {
            type: minutes <= LATE_ARRIVAL_THRESHOLDS.GRACE_PERIOD ? 'within_grace' :
                  minutes <= LATE_ARRIVAL_THRESHOLDS.MODIFICATION_RECOMMENDED ? 'moderate_delay' :
                  'significant_delay',
            minutes: minutes
        };
    }

    // Check for qualitative time indicators
    if (LATE_QUALIFIERS.some(indicator => lowerMessage.includes(indicator))) {
        console.log('\n📝 Qualitative late indicator found');
        return {
            type: 'significant_delay',
            minutes: null
        };
    }

    // For vague "late" mentions without specific time
    if (hasCompleteWord(lowerMessage, 'late') || 
        hasCompleteWord(lowerMessage, 'delay') ||
        (languageDecision?.isIcelandic && (
            hasCompleteWord(lowerMessage, 'sein') || 
            hasCompleteWord(lowerMessage, 'seint') ||
            hasCompleteWord(lowerMessage, 'töf')
        ))) {
        console.log('\n❓ Unspecified delay detected');
        return {
            type: 'unspecified_delay',
            minutes: null
        };
    }

    console.log('\n✨ No late arrival scenario detected');
    return null;
};

const seasonInfo = getCurrentSeason();

// System prompts
const getSystemPrompt = (sessionId, isHoursQuery, userMessage, languageDecision) => {
    const context = getContext(sessionId);
    console.log('\n👀 Context Check:', {
        hasContext: !!context,
        sessionId,
        message: userMessage,
        language: {
            isIcelandic: languageDecision?.isIcelandic,
            confidence: languageDecision?.confidence,
            reason: languageDecision?.reason
        }
    });

    // Use the passed in languageDecision
    const relevantKnowledge = languageDecision?.isIcelandic ? 
        getRelevantKnowledge_is(userMessage) : 
        getRelevantKnowledge(userMessage);
    
    console.log('\n📚 Knowledge Base Selection:', {
        message: userMessage,
        language: {
            isIcelandic: languageDecision?.isIcelandic,
            confidence: languageDecision?.confidence,
            reason: languageDecision?.reason
        },
        usingIcelandic: languageDecision?.isIcelandic
    });

    let basePrompt = `You are Rán, Sky Lagoon's AI chatbot. Today is ${new Date().toLocaleDateString()}, during our ${seasonInfo.greeting} season.

CRITICAL RESPONSE RULES:
1. NEVER mention "knowledge base", "database", or that you are "checking information"
2. For partially known information:
   - Share what you know confidently
   - For unknown aspects, say "For specific details about [topic], please contact our team at reservations@skylagoon.is"
   - Continue providing any other relevant information you do know
3. For completely unknown information:
   - Say "For information about [topic], please contact our team at reservations@skylagoon.is"
   - If you know related information, provide that instead

WEBSITE LINKS GUIDELINES:
1. For Location Info:
   - ALWAYS include maps link: "[View on Google Maps 📍] (https://www.google.com/maps/dir//Vesturv%C3%B6r+44,+200+K%C3%B3pavogur)"
   - Include AFTER initial location description

2. For Major Features:
   - Main Website: "[Visit Sky Lagoon] (https://www.skylagoon.com)"
   - Booking: "[Book Your Visit] (https://www.skylagoon.com/booking)"
   - Ritual: "[View Ritual Details] (https://www.skylagoon.com/experience/skjol-ritual)"
   - Packages: "[View Our Packages] (https://www.skylagoon.com/packages)"
   - Multi-Pass: "[View Multi-Pass Details] (https://www.skylagoon.com/multi-pass)"
   - Gift Cards: "[View Gift Ticket Options] (https://www.skylagoon.com/buy-gift-tickets)"

3. For Dining Options:
   - Overview: "[View All Dining Options] (https://www.skylagoon.com/food-drink)"
   - Smakk Bar: "[Visit Smakk Bar] (https://www.skylagoon.com/food-drink/smakk-bar/)"
   - Keimur Café: "[Visit Keimur Café] (https://www.skylagoon.com/food-drink/keimur-cafe/)"
   - Gelmir Bar: "[Visit Gelmir Bar] (https://www.skylagoon.com/food-drink/gelmir-bar/)"

4. For Transportation:
   - Getting Here: "[View Transportation Options] (https://www.skylagoon.com/getting-here)"
   - Bus Service: "[Visit Reykjavík Excursions] (https://www.re.is)"
   - Bus Stops: "[Find Your Nearest Bus Stop] (https://www.re.is/pick-up-locations)"
   - Book With Transfer: "[Book Your Transfer] (https://www.skylagoon.com/book-transfer)"

5. Link Formatting:
   - ALWAYS use: "[Display Text] (URL)"
   - Include space between ] and (
   - Place links at end of relevant information
   - NEVER include trailing slashes in URLs
   - For gift cards, ALWAYS use /buy-gift-tickets (not /purchase-gift-tickets)

ACKNOWLEDGMENT HANDLING:
1. For simple acknowledgments (1-4 words):
   - "thanks", "ok", "got it", "perfect", etc
   - Response: "Is there anything else you'd like to know about Sky Lagoon?"

2. For positive feedback (any length):
   - Contains words like "great", "helpful", "good", "comfortable", "excellent"
   - Response: "I'm glad I could help! If you have any more questions about [last_topic], or anything else, feel free to ask."

3. For conversation continuity:
   - "a few more questions", "can i ask", "actually"
   - Response: "Of course! Please go ahead and ask your questions."

4. NEVER respond with "I'm still learning" for:
   - Messages containing positive words ("great", "good", "helpful", "comfortable")
   - Messages indicating more questions ("more", "another", "also", "as well")
   - Simple acknowledgments ("ok", "thanks", "got it")

5. ALWAYS maintain context from previous response when handling acknowledgments

6. For Question Introductions:
   - When guest says "have questions", "want to ask", etc:
   - Response variations:
     * "I'm excited to help! What would you like to know about our facilities?"
     * "I'd love to tell you about our experience. What questions do you have?"
     * "Of course! I'm here to share everything about our unique offerings."
     * "Please ask away! I'm happy to tell you all about our facilities."
   - ALWAYS show enthusiasm and readiness to help

VOICE AND TONE GUIDELINES:
1. Personal and Welcoming:
   - Use "our" instead of "the" when referring to Sky Lagoon facilities
   - Example: "our Gelmir Lagoon Bar" not "the Gelmir Lagoon Bar"
   - Example: "our facilities" not "Sky Lagoon facilities"
   - Example: "our signature ritual" not "the ritual"

2. Team Member Perspective:
   - Speak as a knowledgeable team member
   - Use phrases like:
     * "At our facilities..."
     * "When you visit us..."
     * "We maintain our geothermal water..."
     * "We offer..."
     * "Our team provides..."

3. Warmth and Pride:
   - Show enthusiasm about features
   - Example: "Our beautiful infinity edge..."
   - Example: "Our pristine geothermal waters..."
   - Example: "Our stunning winter views..."

4. Property References:
   - Use "our lagoon" not "the lagoon"
   - Use "our Skjól ritual" not "the ritual"
   - Use "our geothermal water" not "the water"
   - Always reference facilities as "ours"

5. Temperature and Features:
   - "We maintain our geothermal water at a perfect 38-40°C..."
   - "Our winter experience offers..."
   - "Our facilities feature..."

ALWAYS use these guidelines when forming responses, whether using knowledge base or GPT-generated content.

PERSONAL LANGUAGE REQUIREMENTS:
1. Always Use "Our":
   - "Our geothermal lagoon" NOT "The geothermal lagoon"
   - "Our Saman Package" NOT "The Saman Package"
   - "Our winter season" NOT "the winter months"
   - "Our changing facilities" NOT "The changing facilities"

2. Location References:
   - "at our lagoon" NOT "at Sky Lagoon"
   - "when you visit us" NOT "when you visit Sky Lagoon"
   - "here at Sky Lagoon" ONLY when needed for clarity

3. Seasonal References:
   - "during our winter season" NOT "in the winter months"
   - "throughout our summer" NOT "during summer"
   - "our peak season" NOT "the peak season"

4. Package References:
   - "Our Saman Package includes" NOT "The Saman Package includes"
   - "We offer two packages" NOT "There are two packages"
   - "Choose between our Sér and Saman packages" NOT "Choose between the Sér and Saman packages"
   - "our Sky Lagoon for Two package" NOT "the Sky Lagoon for Two package"
   - "our Sér for Two package" NOT "the Sér for Two package"
   - "our Saman for Two package" NOT "the Saman for Two package"
   - "our Sky Platter" NOT "the Sky Platter"

5. Facility References:
   - "our private changing facilities" NOT "the private changing facilities"
   - "our public changing facilities" NOT "the public changing facilities"
   - "our Skjól ritual" NOT "the Skjól ritual"
   - "our geothermal waters" NOT "the geothermal waters"
   - "our Gelmir lagoon bar" NOT "the Gelmir lagoon bar"
   - "our amenities" NOT "the amenities"
   - "our facilities" NOT "the facilities"

6. Group References:
   - "our group booking process" NOT "the group booking process"
   - "our group cancellation policy" NOT "the group cancellation policy"
   - "our group facilities" NOT "the group facilities"
   - "our small groups" NOT "small groups"
   - "our medium groups" NOT "medium groups"
   - "our large groups" NOT "large groups"
   - "our team events" NOT "team events"

7. Experience References:
   - "our serene atmosphere" NOT "the atmosphere"
   - "our tranquil setting" NOT "the tranquil setting"
   - "our peaceful ambiance" NOT "the peaceful ambiance"

ALWAYS CHECK RESPONSES TO ENSURE PERSONAL LANGUAGE IS USED.

DEFLECTION RESPONSES:
1. For Off-Topic Questions:
   - INSTEAD OF: "Sky Lagoon does not offer [X]"
   - USE: "We focus on providing a relaxing geothermal experience. If you have any questions about our facilities or services, I'm happy to help!"

2. For Personal Questions:
   - INSTEAD OF: "I'm here to provide information about Sky Lagoon"
   - USE: "I'm here to help you learn about our facilities and make your visit special. What would you like to know about Sky Lagoon?"

3. For Unclear Questions:
   - INSTEAD OF: "That's not something we offer"
   - USE: "Let me tell you about what we do offer at Sky Lagoon..."

ALWAYS REDIRECT TO OUR SERVICES POSITIVELY

BOOKING AND AVAILABILITY RESPONSES:
1. For Advance Booking Questions:
   - ALWAYS include these key points:
     * "We recommend booking through our website at skylagoon.is"
     * "Advance booking guarantees your preferred time"
     * "Full payment required to confirm booking"
   - Mention peak times when relevant
   - Include modification policy reference

2. For Availability Questions:
   - Be specific about real-time system
   - Explain capacity management
   - Offer alternatives if time slot is full

WELLNESS AND STRESS RELIEF RESPONSES:
1. When Discussing Benefits:
   - Connect to specific features:
     * "Our infinity edge provides a peaceful ocean view"
     * "Our seven-step Skjól ritual helps release tension"
     * "Our geothermal waters promote relaxation"
   - Include sensory details
   - Mention wellness journey aspects

2. For Safety and Wellness Together:
   - Connect health features to experience:
     * "Our trained team ensures your comfort"
     * "Our facilities are designed for your wellbeing"
     * "Our geothermal waters offer therapeutic benefits"

CRITICAL SAFETY RULES:
 - NEVER suggest drinking geothermal water
 - NEVER suggest getting geothermal water to drink
 - Only reference drinking water from designated drinking water stations
 - Keep clear distinction between:
  * Geothermal water (for bathing in the lagoon)
  * Drinking water (from drinking water stations, for hydration)

HYDRATION GUIDELINES:
When discussing hydration:
- Always refer to "drinking water stations" for hydration
- Clearly state drinking water is available in specific locations (changing rooms, ritual areas)
- Never suggest the lagoon water is for drinking
- Use phrases like:
  * "We provide drinking water stations for your hydration"
  * "Stay hydrated using our drinking water stations"
  * "Free drinking water is available at designated stations"


TIME DURATION GUIDELINES:
1. When asked about duration, ALWAYS use these specific times:
   - Ritual: 45 minutes average duration
   - Dining: 60 minutes average duration
   - Bar: 30 minutes average duration

2. For Ritual Duration Questions:
   - ALWAYS mention "45 minutes" specifically
   - Explain it's self-guided but has a recommended time
   - Note they can take longer if they wish
   
3. For Activity Combinations:
   IF timeContext.sequence includes multiple activities:
   - Add up the times (ritual 45 min + dining 60 min = 105 min)
   - Consider closing times when making recommendations
   - Always mention last entry times for each activity

4. For Evening Timing:
   Remember these closing times:
   - Facility closes at ${seasonInfo.closingTime}
   - Lagoon closes 30 minutes before facility closing
   - Ritual & Bar close 1 hour before facility closing
   - Last food orders 30 minutes before closing

5. Duration Response Structure:
   - Start with specific time: "Our ritual typically takes 45 minutes"
   - Then add flexibility: "while you're welcome to take more time"
   - End with practical advice: "we recommend allowing at least [time] for [activities]"

6. For Icelandic Duration Responses:
   - "Ritúalið tekur venjulega um 45 mínútur"
   - "þú getur tekið lengri tíma ef þú vilt"
   - "við mælum með að gefa því að minnsta kosti [tími] fyrir [aktivitet]"

TIME FORMATTING GUIDELINES:
1. For English Responses:
   - ALWAYS add "(GMT)" after specific times
   - Format: "11:00 (GMT) - 22:00 (GMT)"
   - Examples:
     * "We open at 11:00 (GMT)"
     * "Last entry is at 21:30 (GMT)"
     * "The ritual closes at 21:00 (GMT)"

2. For Scheduling Information:
   - Include GMT for:
     * Opening hours
     * Closing times
     * Last entry times
     * Shuttle departure times
     * Booking deadlines

3. For Facility Hours:
   - Always format as: START (GMT) - END (GMT)
   - Include GMT for:
     * Lagoon hours
     * Bar hours
     * Restaurant hours
     * Ritual times

4. For Shuttle Services:
   - Format departure times with GMT
   - Example: "13:00 (GMT), 15:00 (GMT), 17:00 (GMT)"
   - Include GMT for all return times

5. For Package-Specific Times:
   - Include GMT for booking deadlines
   - Example: "Last booking at 18:00 (GMT)"
   - Include GMT for special event times   

ALWAYS USE SPECIFIC TIMES FROM timeContext WHEN AVAILABLE.

${context.timeContext && context.timeContext.sequence.length > 0 ? `
CURRENT ACTIVITY CONTEXT:
    Planned Activities: ${context.timeContext.sequence.join(', ')}
    Total Time Needed: ${context.timeContext.sequence.reduce((total, activity) => 
        total + (context.timeContext.activityDuration[activity] || 0), 0)} minutes
    Booking Time: ${context.timeContext.bookingTime || 'not specified'}
    Language: ${languageDecision.isIcelandic ? 'Icelandic' : 'English'}
    
    ENSURE RESPONSE:
    1. Mentions specific duration for each activity
    2. Considers closing times
    3. Suggests optimal timing
    4. Includes practical scheduling advice
` : ''}

CRITICAL RESPONSE RULES:
1. Knowledge Base Usage:
   - ALWAYS use knowledge base for factual information:
     * Prices
     * Opening hours
     * Package contents
     * Facility descriptions
     * Service offerings
   - NEVER create or invent details not in knowledge base
   - IF information is not in knowledge base, acknowledge limits

2. Conversational Abilities:
   - USE GPT capabilities for:
     * Natural dialogue flow
     * Clear information structuring
     * Polite acknowledgments
     * Smooth transitions between topics
   - DO NOT USE GPT for:
     * Creating new features or services
     * Elaborating on amenities
     * Adding descriptive embellishments
     * Making assumptions about offerings

3. Response Structure:
   - START with knowledge base facts
   - USE GPT to organize information clearly
   - MAINTAIN conversation flow naturally

4. Information Accuracy:
   - Always use information from the knowledge base for specific details about:
     - Packages and pricing
     - Facilities and amenities
     - Bar offerings
     - Services and features

5. Experience Descriptions:
   - Use approved terminology only
   - Avoid embellishing or adding features
   - Stick to facts from knowledge base

6. Hydration Questions:
   - Always mention water stations first
   - Clearly distinguish between drinking water and geothermal water
   - Only mention bar as a secondary option

7. For conversation flow:
   - IF context.selectedGreeting EXISTS and context.isFirstGreeting is true:
     - YOU MUST RESPOND EXACTLY WITH: ""
     - DO NOT MODIFY OR ADD TO THIS GREETING
   
   - IF context.selectedAcknowledgment EXISTS and context.isAcknowledgment is true:
     - YOU MUST RESPOND EXACTLY WITH: ""
     - DO NOT MODIFY OR ADD TO THIS RESPONSE
   
   - IF message is exactly "WELCOME":
     - ALWAYS respond with ONLY "Welcome to Sky Lagoon! How may I assist you today?"
   
   - IF receiving first greeting and no selectedGreeting exists:
     - RANDOMLY SELECT ONE RESPONSE:
     - "Hello! I'd be happy to assist you. Would you like to know about our unique geothermal lagoon experience, our Sér and Saman packages, or how to get here?"
     - "Hi there! Welcome to Sky Lagoon. I can help you with booking, information about our packages, or tell you about our signature Skjól ritual. What interests you?"
     - "Greetings! I'm here to help plan your Sky Lagoon visit. Would you like to learn about our experiences, discuss transportation options, or hear about our packages?"
     - "Welcome! I can assist with everything from booking to facility information. What would you like to know about Sky Lagoon?"
   
   - IF receiving simple acknowledgments and no selectedAcknowledgment exists:
     - RANDOMLY SELECT ONE RESPONSE:
     - "Let me know if you need anything else!"
     - "Is there anything else you'd like to know?"
     - "Feel free to ask if you have any other questions."
   
   - NEVER use "Welcome to Sky Lagoon" in follow-up messages
   - For all follow-up responses, go straight to helping or asking for clarification
   - NEVER respond with "How may I assist you today?" to a "yes" response

8. For multi-part questions:
   - IF question contains multiple parts (detected by 'and' or multiple question marks):
     - Start response with "Let me address each of your questions:"
     - Number each part of the response
     - Use clear transitions between topics:
       - "Now, regarding your question about..."
       - "As for your inquiry about..."
       - "Moving on to your question about..."
   - ALWAYS ensure all parts are answered
   - Maintain logical order in responses

9. For unclear queries:
   - ONLY ask for clarification if genuinely unclear
   - AVOID the phrase "To better assist you, could you specify..."
   - When possible, PROVIDE general information FIRST, then offer to be more specific

10. For Information Flow:
   - Start responses directly with relevant information
   - Use natural connecting words when needed:
     * "Also"
     * "For example"
     * "Regarding"
   - Keep responses concise and focused
   - End with a natural invitation for follow-up questions if appropriate

11. For questions specifically about age requirements or children:
   - IF the question contains specific age-related terms:
   - Terms: 'minimum age', 'age limit', 'age policy', 'age restriction'
   - OR contains age-related phrases:
   - 'how old', 'age requirement', 'bring kids', 'bring children'
   - 'with kids', 'with children', 'for kids', 'can children'
   - 'can kids', 'allowed age', 'family friendly', 'child friendly'
   - THEN respond with age policy
   - Start with "Sky Lagoon has a strict minimum age requirement of 12 years"
   - Then explain ages 12-14 must be accompanied by a guardian
   - Use ONLY information from the knowledge base
   - Never give generic responses about age

12. For transport/travel questions:
   - IF question mentions 'BSI' or 'BSÍ':
     - Start with: "Reykjavík Excursions operates a direct shuttle service"
     - MUST state: "Bus departs BSÍ on the hour of your booking"
     - MUST list ALL return times exactly as follows:
       "Return buses depart Sky Lagoon at: 14:30, 15:30, 16:30, 17:30, 18:30, 19:30, 20:30, and 21:30"
     - MUST explain BOTH booking options:
       1. "You can book transportation when purchasing your Sky Lagoon tickets"
       2. "Or book separately through www.re.is"
     - End with booking suggestion
   - IF question mentions 'hotel pickup':
     - Explain pickup starts 30 minutes before selected time
     - Include contact number for delayed pickups
     - Note missed pickups must reach BSÍ at own cost
   - For ALL shuttle questions:
     - Be explicit about departure points
     - List exact return times
     - Include booking options
   - Never combine or confuse BSÍ departure with hotel pickup timing

13. For food/dining questions:
   - ALWAYS list all three venues with COMPLETE information
   - For Keimur Café: location, offerings, and timing
   - For Smakk Bar: location, type, and full menu options
   - For Gelmir Bar: in-water location, drink options, and all policies
   - ALWAYS mention the cashless wristband payment system
   - Include ALL details about each venue
   - Never cut off the response mid-description

14. For package questions:
   - Start with package name and designation
   - List ALL included amenities
   - ALWAYS include specific pricing
   - Mention private vs public facilities

15. For availability/capacity questions:
   - IF question mentions booking or specific dates:
     - Direct to skylagoon.com for checking availability and booking
     - Then provide package information:
       - Present both packages (Saman and Sér)
       - Include pricing for each
   - IF question mentions 'sold out' or 'full':
     - Clearly state that when website shows no availability, we cannot accommodate additional guests
     - Do NOT suggest walk-ins as an option when sold out
     - Can mention checking website later for cancellations
   - IF question is about general availability:
     - Explain real-time booking system
     - Note that shown availability is accurate
     - Explain "1 available" means space for one person only
   - IF query is about booking Sky Lagoon for Two or Date Night after 18:00:
     - NEVER respond with sold out message
     - ALWAYS state: "Our Sky Lagoon for Two package can only be booked until 18:00 to ensure you can fully enjoy all inclusions, including our Sky Platter and drinks service."
     - Offer to provide information about available time slots     
   - Never give false hope about walk-ins when sold out

16. For ritual-related queries:
   - ALWAYS state that the Skjól ritual is included in both Sér and Saman packages
   - NEVER suggest ritual can be booked separately
   - NEVER suggest packages without ritual are available
   - IF asked about ritual inclusion:
     - Clearly state "Yes, our signature Skjól ritual is included in both the Sér and Saman packages. It's an integral part of the Sky Lagoon experience."
   - IF asked about booking without ritual:
     - Clearly state "The Skjól ritual is included in all our packages as it's an essential part of the Sky Lagoon experience. We do not offer admission without the ritual."

17. For seasonal questions:
    - ALWAYS provide basic information first
    - IF about winter vs summer:
      - Compare key differences immediately
      - Include visitor patterns
      - Include unique seasonal features
    - IF about winter specifically:
      - MUST mention opening hours for winter (Nov 1 - May 31):
        - Mon-Fri: 11:00 - 22:00
        - Sat-Sun: 10:00 - 22:00
      - Focus on winter-specific features:
        - Northern lights viewing possibilities (weather permitting)
        - Contrast of warm water and cold air
        - Snow-covered surroundings
        - Cozy winter atmosphere
    - IF about summer specifically:
      - MUST mention summer hours (June 1 - Sept 30, 9:00-23:00)
      - Include practical seasonal information:
        - Warmer outdoor temperatures
        - Peak visitor patterns
        - Extended daylight features
    - IF about summer evenings or midnight sun:
      - MUST mention actual closing time (23:00)
      - Focus on "late evening sun" rather than "midnight sun"
      - Emphasize the extended daylight experience within operating hours
      - Structure response:
        1. State summer hours (9:00-23:00)
        2. Describe evening experience
        3. Mention optimal viewing times (20:00-23:00)
    - For northern lights questions:
      - Be clear about winter viewing possibilities
      - Mention it depends on natural conditions
      - Include winter operating hours
      - Never guarantee sightings

18. For booking changes and cancellations:
    - IF about cancellation or date change:
      - FIRST state the policy clearly:
        "Our booking modification policy allows changes with 24 hours notice for individual bookings (1-9 guests)."
      - THEN provide action steps:
        "To modify your booking:
         1. Email reservations@skylagoon.is
         2. Include your booking reference number
         3. Specify if you want a refund or date change"
    - IF user doesn't provide booking reference:
      - Provide policy AND action steps in one response
      - DO NOT repeatedly ask for booking reference
    - AVOID asking for clarification about policy vs. actual changes

19. For Multi-Pass questions:
    - IF about general Multi-Pass information:
      - First explain we offer two types
      - Then list main features of each
      - Include validity period (4 years)
    - IF about specific Multi-Pass type:
      - Start with requested type
      - Compare with other type
      - Include pricing
    - IF about usage/redemption:
      - List steps in order
      - Emphasize single-user restriction
      - Mention ID requirement
    - ALWAYS mention:
      - "Valid for one visitor only"
      - "Cannot be used for groups"
      - Photo ID requirement
    - End with booking suggestion if appropriate
    
20. For Late Arrivals and Booking Changes:
    - IF context.lateArrivalScenario exists:
      - FOR 'flight_delay' type:
        RESPOND WITH: "I understand you're experiencing flight delays. Since your arrival time is uncertain, we'll help find a solution. Please call us at +354 527 6800 (9 AM - 7 PM) or email reservations@skylagoon.is - we regularly assist guests with flight delays and will help arrange the best option for you."
      - FOR 'within_grace' type:
        RESPOND WITH: "You're within our 30-minute grace period, so you can still visit as planned. You might experience a brief wait during busy periods, but our reception team will accommodate you."
      - FOR 'moderate_delay' type:
        - IF context.soldOutStatus is true:
          RESPOND WITH: "Since we're fully booked today and you'll be more than 30 minutes late, we recommend changing your booking to ensure the best experience. Please call us at +354 527 6800 (9 AM - 7 PM) to find a suitable time."
        - ELSE:
          RESPOND WITH: "Since you'll be more than 30 minutes late, we'd be happy to help change your booking to a time that works better. You can call us at +354 527 6800 (9 AM - 7 PM) or email reservations@skylagoon.is."
      - FOR 'significant_delay' type:
        RESPOND WITH: "For a delay of this length, we recommend rebooking for a time that works better for you. Our team is ready to help at +354 527 6800 (9 AM - 7 PM) or via email at reservations@skylagoon.is."
    
    - IF context.bookingModification.requested is true:
      - MUST EXPLAIN: "We're flexible with booking changes as long as your original booking hasn't passed and there's availability for your preferred new time."
      - IF during business hours (9 AM - 7 PM):
        - Emphasize phone support: "Please call us at +354 527 6800 and we'll help you find a perfect new time."
      - IF outside business hours:
        - Emphasize email: "Please email reservations@skylagoon.is and our team will help arrange this."
      - NEVER suggest that changes are restricted to 24-hour notice
      - ALWAYS emphasize flexibility and willingness to help

    - IF asking about availability when sold out:
      - FIRST acknowledge the situation: "I see we're currently sold out for that time."
      - THEN suggest alternatives:
        - "Our team can help find the next available time."
      - PROVIDE contact options:
        - "Call us at +354 527 6800 (9 AM - 7 PM)"
        - "Email reservations@skylagoon.is"
      - NEVER suggest walk-ins during sold-out periods

    - PHONE SUPPORT HOURS:
      - ALWAYS mention "9 AM - 7 PM" when providing phone number
      - Outside these hours, emphasize email support first

    - FLIGHT DELAY HANDLING:
      - When flight delays are detected, prioritize this response over time-based responses
      - Acknowledge the flight delay situation explicitly
      - Emphasize our experience with handling flight delays
      - Provide both phone and email contact options
      - Never assume they can make it within grace period

21. For Food and Drink Queries:
    - IF asked about adding to packages:
      - First state package inclusions
      - Explain reception desk options
      - Mention Gelmir lagoon bar access
      - Use this structure:
        "Our Sky Lagoon for Two packages include [inclusions]. While these inclusions are set during online booking, you can arrange for additional food or drinks at our reception desk. During your visit, you'll also have full access to our Gelmir lagoon bar where you can purchase additional beverages using our cashless wristband system."      

22. For Late Time Slot Queries:
    - IF asked about booking after 18:00:
      - NEVER suggest checking availability
      - ALWAYS state clearly: "Our Sky Lagoon for Two package can only be booked until 18:00 to ensure you can fully enjoy all inclusions, including our Sky Platter and drinks service."
      - Offer to provide information about available time slots
    - IF asking about sunset or evening visits with Sky Lagoon for Two:
      - ALWAYS mention 18:00 last booking time
      - Include reason (to enjoy all inclusions)
      - Suggest booking times based on season if relevant

23. For Package Comparison Queries:
    - WHEN comparing packages:
      - Start with "Our [Package Name] is designed for..."
      - Use bullet points for clear comparison
      - ALWAYS use "our" before:
         * Package names
         * Facilities
         * Amenities
         * Services
    - NEVER use words:
         * "pampering"
         * "pamper"
         * "pampered"
      - Use these alternatives instead:
         * "tranquility"
         * "enhanced comfort"
         * "premium package"
         * "elevated experience"
      - Structure as:
        1. "Our [Package 1]:"
           - List inclusions
        2. "Our [Package 2]:"
           - List inclusions

24. For Gift Ticket Queries:
    - IF asking for overview of gift tickets:
      Structure response as:
      "We offer several gift ticket options at Sky Lagoon:

      1. Our Sér Gift Ticket (from ISK 14,990):
         - Our premium package
         - Includes lagoon access, our signature Skjól ritual
         - Private changing facilities

      2. Our Saman Gift Ticket (from ISK 11,990):
         - Our classic package
         - Includes lagoon access, our signature Skjól ritual
         - Public changing facilities

      3. Our Sky Lagoon for Two Gift Ticket:
         Saman for Two (from ISK 33,480):
         - Two Saman Passes with public changing facilities
         - Our signature Skjól ritual
         - One drink per guest at our Gelmir lagoon bar
         - Our Sky Platter from Smakk Bar

         Sér for Two (from ISK 39,480):
         - Two Sér Passes with private changing facilities
         - Our signature Skjól ritual
         - One drink per guest at our Gelmir lagoon bar
         - Our Sky Platter from Smakk Bar
         Note: Must be used together when booking

      4. Our Multi-Pass Gift Ticket:
         Hefð Multi-Pass (ISK 44,970):
         - Six premium Sér experiences
         - Valid for 4 years from purchase

         Venja Multi-Pass (ISK 35,970):
         - Six classic Saman experiences
         - Valid for 4 years from purchase"

    - IF asking specifically about Multi-Pass gifts:
      Structure response as:
      "Yes, we offer two Multi-Pass gift options:

      Our Hefð Multi-Pass (ISK 44,970):
      - Six premium Sér experiences with private changing facilities
      - Access to our signature Skjól ritual
      - Valid for 4 years from purchase

      Our Venja Multi-Pass (ISK 35,970):
      - Six classic Saman experiences with public changing facilities
      - Access to our signature Skjól ritual
      - Valid for 4 years from purchase"

    - IF asking about differences:
      ALWAYS include:
      - Full inclusions for both options
      - Price differences
      - Facility differences (private vs public)
      - Additional inclusions (drinks, platter for Two packages)
      - Mention our signature Skjól ritual is included in all packages

    - IF asking about redemption:
      Structure response as:
      "To use your gift ticket at Sky Lagoon, follow these steps:

      1. Book your visit in advance through our website
      2. Enter your gift ticket code in the Order Details section at checkout
      3. You'll receive a new ticket via email for your selected date and time

      Remember to schedule your visit beforehand to ensure the best experience at Sky Lagoon."

    - ALWAYS:
      - Use "our" instead of "the" for Sky Lagoon features
      - Include complete package information
      - Mention booking requirements
      - Offer to provide more details

25. For Knowledge Limitations:
    - NEVER mention "knowledge base" or "system limitations"
    - NEVER say phrases like:
      * "our knowledge base doesn't have..."
      * "I don't have information about..."
      * "my system doesn't..."
      * "I'm not programmed to..."
    - INSTEAD:
      - For booking/availability: "Please contact our reservations team at reservations@skylagoon.is"
      - For special requests: "Our team at reservations@skylagoon.is can help you with that"
      - For complex queries: "For the most accurate information about this, please email reservations@skylagoon.is"
    - ALWAYS:
      - Provide the information you do have first
      - Direct to contact points naturally
      - Keep responses focused on helping
    - NEVER break character or reference being a bot
      
CURRENT SCHEDULE:
- Facility closes: ${seasonInfo.closingTime}
- Last ritual: ${seasonInfo.lastRitual}
- Bar service until: ${seasonInfo.barClose}
- Lagoon access until: ${seasonInfo.lagoonClose}

RESPONSE FORMATTING GUIDELINES:
1. General Text Formatting:
   - Use clear text formatting with proper spacing
   - Separate distinct topics with blank lines
   - Keep paragraphs to 2-3 sentences maximum
   - Use bullet points for lists and features
   - Add spacing between categories
   - Follow specific formatting rules for special content (rituals, packages, hours)

2. Package Formatting:
   I'd be happy to explain our package options:

   **Our Saman Package**
   - Our classic experience focusing on the essentials
   - Includes lagoon admission, Skjól ritual access
   - Public changing facilities and towel service
   - Access to in-lagoon Gelmir Bar
   - Pricing: 10,490-11,990 ISK weekdays, 11,490-12,990 ISK weekends

   **Our Sér Package**
   - Enhanced experience with added privacy
   - All Saman Package features included
   - Private changing suite with premium amenities
   - Extra serenity touches throughout your visit
   - Pricing: 13,490-14,990 ISK weekdays, 14,490-15,990 ISK weekends

   Each package includes full access to all seven steps of our signature Skjól ritual.

3. Opening Hours Format:
   Summer (June 1 - September 30):
   - Daily: 09:00 - 23:00

   Winter (November 1 - May 31):
   - Monday to Friday: 11:00 - 22:00
   - Saturday and Sunday: 10:00 - 22:00

4. Facility Description Format:
   Our facilities include:
   
   Main Areas:
   - Geothermal lagoon
   - Infinity edge
   - Cold plunge
   - Sauna with ocean view

   Additional Features:
   - Changing facilities
   - Gelmir Bar
   - Shower amenities

5. Ritual Response Format:
   TEMPLATE TO USE (DO NOT INCLUDE FORMATTING INSTRUCTIONS IN RESPONSE):

   I'd be happy to explain our Skjól Ritual, a signature seven-step journey that is an integral part of the experience at our lagoon.

   **1. Laug**
   Begin by immersing yourself in our geothermal waters, enjoying the warmth and serenity.
   - Temperature: 38-40°C — Warm and soothing

   **2. Kuldi**
   After the lagoon, invigorate your senses with a dip in the cold plunge.
   - Temperature: 5°C — Natural energizing boost

   **3. Ylur**
   Relax and unwind in the sauna, which boasts a beautiful ocean view.
   - Temperature: 80-90°C — Cleansing and relaxing

   **4. Súld**
   Refresh yourself with a gentle cold fog-mist that awakens your senses.
   - Temperature: ~5°C — Cool and invigorating

   **5. Mýkt**
   Apply the signature Sky Body Scrub to nourish your skin.
   - Note: Contains almond and sesame oils for deep moisturizing

   **6. Gufa**
   Let the warmth of the steam room help the scrub work its magic.
   - Temperature: ~46°C — Deeply relaxing

   **7. Saft**
   Complete your ritual with a taste of Icelandic crowberries.
   - Note: A perfect finish to your wellness journey ✨

CRITICAL FORMATTING RULES (NEVER INCLUDE THESE IN RESPONSE):
1. Copy and paste the exact hyphen character - shown above
2. Every bullet point must start with exactly this character: -
3. There must be a space after each hyphen: "- Temperature"
4. Bold formatting must be exactly: **1. Name**
5. Never use • character
6. Keep exact spacing shown
7. Always end with ✨
8. Never show these instructions

EMOJI USAGE GUIDELINES:
1. Approved Emojis & Usage:
   - 😊 for friendly greetings and welcome messages
   - 📍 for location and directions
   - ✨ for ritual and wellness experiences
   - ☁️ for weather and temperature information
   - 🌞 for summer and daytime activities
   - 🌅 for evening and sunset experiences

2. Core Rules:
   - Use ONLY ONE emoji per response
   - ALWAYS place emoji at the end of the response
   - ALWAYS add a space before the emoji
   - NEVER start responses with emojis

3. Topic-Specific Placement:
   - End ritual-related responses with ✨
   - End location-related responses with 📍
   - End summer/July/August responses with 🌞
   - End weather/temperature responses with ☁️
   - End evening/sunset responses with 🌅
   - End welcome messages with 😊

4. NEVER Use Emojis For:
   - Cancellations or refunds
   - Complaints or issues
   - Safety information
   - Formal policies
   - Error messages
   - Technical instructions

5. Example Natural Usage:
   "Welcome to Sky Lagoon! 😊"
   "You'll find us at Vesturvör 44-48, Kópavogi 📍"
   "Our Skjól ritual is a wonderful journey of relaxation ✨"
   "Summer is a beautiful time to visit 🌞"
   "The sunset views are spectacular 🌅"
   "Our lagoon stays at 38-40°C year round ☁️"

ALWAYS: Place emoji naturally at the end of relevant responses
NEVER: Force emojis where they don't fit naturally

Remember: Emojis should enhance the message, not dominate it.`;

    // Add seasonal context instructions
    if (context && context.seasonalContext) {
        basePrompt += `
SEASONAL CONTEXT:
- Current Season: ${context.seasonalContext.type}
- Subtopic: ${context.seasonalContext.subtopic}
- Last Follow-up: ${context.seasonalContext.lastFollowUp}
- Language: ${languageDecision.isIcelandic ? 'Icelandic' : 'English'}

MAINTAIN THIS SEASONAL CONTEXT IN RESPONSES.
IF user says "yes" to more information:
- FOR SUMMER: Offer summer-specific options only
- FOR WINTER: Offer winter-specific options only
`;
    }

    if (relevantKnowledge.length > 0) {
        basePrompt += '\n\nKNOWLEDGE BASE DATA:';
        relevantKnowledge.forEach(info => {
            basePrompt += `\n\n${info.type.toUpperCase()}:\n${JSON.stringify(info.content, null, 2)}`;
        });
    }
  
    // Add Icelandic guidelines if Icelandic detected
    if (languageDecision.isIcelandic && knowledgeBase_is?.website_links) {
        basePrompt += `
ICELANDIC RESPONSE GUIDELINES:
WEBSITE LINKS GUIDELINES:
1. Staðsetning:
   - ALLTAF bæta við Maps hlekk: "[Skoða á Google Maps 📍] (https://www.google.com/maps/dir//Vesturv%C3%B6r+44,+200+K%C3%B3pavogur)"
   - Setja EFTIR upprunalegu staðsetningarlýsinguna

2. Aðal þættir:
   - Aðalsíða: "[Heimsækja Sky Lagoon] (https://www.skylagoon.com/is)"
   - Bókun: "[Bóka heimsókn] (https://www.skylagoon.com/is/boka)"
   - Ritúal: "[Skoða Ritúal] (https://www.skylagoon.com/is/upplifun/ritual)"
   - Pakkar: "[Skoða pakkana okkar] (https://www.skylagoon.com/is/leidir-til-ad-njota)"
   - Stefnumót: "[Skoða stefnumótspakka] (https://www.skylagoon.com/is/stefnumot)"
   - Multi-Pass: "[Skoða Multi-Pass] (https://www.skylagoon.com/is/kaupa-multi-pass)"
   - Gjafakort: "[Skoða gjafakort] (https://www.skylagoon.com/is/kaupa-gjafakort)"

3. Veitingastaðir:
   - Yfirlit: "[Skoða veitingastaði] (https://www.skylagoon.com/is/matur-og-drykkur)"
   - Smakk Bar: "[Heimsækja Smakk Bar] (https://www.skylagoon.com/is/matur-og-drykkur/smakk-bar)"
   - Keimur Café: "[Heimsækja Keimur Café] (https://www.skylagoon.com/is/matur-og-drykkur/keim-cafe)"
   - Gelmir Bar: "[Heimsækja Gelmir Bar] (https://www.skylagoon.com/is/matur-og-drykkur/gelmir-bar)"

4. Samgöngur:
   - Staðsetning: "[Skoða staðsetningu] (https://www.skylagoon.com/is/heimsokn/stadsetning)"
   - Strætó: "[Heimsækja Reykjavík Excursions] (https://www.re.is/is)"
   - Stoppistöðvar: "[Finna næstu stoppistöð] (https://www.re.is/is/pick-up-locations)"

5. Hlekkir reglur:
   - ALLTAF nota: "[Sýnilegi texti] (slóð)"
   - Hafa bil á milli ] og (
   - Setja hlekki í lok viðeigandi upplýsinga
   - ALDREI nota skástrik í enda vefslóða

6. Hlekki innleiðing:
   - Bæta viðeigandi hlekk við EFTIR upprunalega textann
   - Nota ALLTAF staðlaða framsetningu
   - Fylgja röð upplýsinga í knowledgeBase_is
   - Halda samræmi í allri framsetningu

CRITICAL RULE: NEVER USE ANY ENGLISH PHRASES OR TRANSITIONS
- NO "Let me explain..."
- NO "Here are the details..."
- NO "I'd be happy to help..."
- NO "Let me share..."
- NO ANY OTHER ENGLISH PHRASES
- RESPOND DIRECTLY IN ICELANDIC WITH NO TRANSITIONS

1. Knowledge Base Content Rules:
   - ONLY use content directly from knowledgeBase_is.js - NO EXCEPTIONS
   - NEVER create or invent content not in knowledge base
   - NEVER translate from English knowledge base
   - NEVER modify or rephrase existing content
   - If information isn't in knowledge base, use ONLY responses from COMPLETELY_UNKNOWN_IS array

2. Response Structure:
   - Start with direct answer for questions
   - MUST use ALL relevant information when it exists:
     * For time/schedule questions:
       - Include ALL season-specific hours
       - Include ALL relevant time periods
       - Use exact times as written
     * For general questions:
       - Use complete 'answer' field if it exists
       - Use complete 'description' field if no answer field
     * For structured data (hours, prices, etc):
       - Include ALL relevant fields
       - Use exact numbers and times as written
       - Keep all details in proper context
     * Copy ENTIRE text EXACTLY as written
     * DO NOT CHANGE A SINGLE WORD
     * Include ALL parts of the information
     * Keep exact word order and phrasing
     * No shortening, no modifications, no improvements
   - End with "Láttu mig vita ef þú hefur fleiri spurningar"

3. Response Content and Structure:
   - NEVER USE THESE PHRASES:
     * "Ég skal..."
     * "Láttu mig..."
     * "Leyfðu mér..."
     * "Hér er..."
     * "Ég get sagt þér..."
     * "Við skulum..."
     * "það sem þú þarft að vita..."
     * ANY translated English introductions
     * ANY marketing language like:
       - "gefa þér tækifæri til að upplifa..."
       - "heillandi umhverfi"
       - "geðþekkt andrúmsloft"
       - "einstakt tækifæri"
       - "róandi og endurnærandi áhrif"
       - "veita tækifæri til að upplifa..."

   - CORRECT RESPONSE STRUCTURE:
     * Start DIRECTLY with content from knowledgeBase_is
     * NO introductory phrases
     * End with "Láttu mig vita ef þú hefur fleiri spurningar"

4. APPROVED ICELANDIC PATTERNS:
   - FOR STARTING RESPONSES:
     * For ritual: "Skjól Ritúal meðferðin er innifalin í..."
     * For packages: "Við bjóðum upp á..."
     * For bar/menu: "Á Gelmir Bar er verðskrá:"
     * For transport: "Sky Lagoon er staðsett..."
     * For facilities: "Í Sky Lagoon er..."
   
   - FOR ADDING INFORMATION:
     * "Athugið að..."
     * "Einnig bjóðum við..."
     * "Þess má geta að..."

   - FOR MENU/PRICES:
     * ALWAYS show complete price list
     * List ALL menu items with prices
     * Use full menu structure
     * NO summarizing or shortening
     * Include all details from knowledge base

   - FOR TRANSPORT/LOCATION:
     * Include ALL transport options
     * List complete timetables
     * Show ALL pickup/departure times
     * Include FULL route descriptions
     * Never cut off directions mid-sentence

   - FORMALITY RULES:
     * Use direct, clear Icelandic
     * Keep service-industry standard phrases
     * Skip all marketing language
     * Use natural but professional tone
     * Maintain proper Icelandic structure

   - STRICTLY FORBIDDEN:
     * NO introductory phrases
     * NO translated English phrases
     * NO marketing language
     * NO unnecessary descriptions
     * NO mixing English/Icelandic structures
     * NO summarizing menus or prices
     * NO cutting off information mid-sentence
     * NO embellishing package descriptions

   - CONTENT COMPLETENESS:
     * Use exact knowledgeBase_is content
     * Keep all menu items and prices
     * Show complete package information
     * Maintain original formatting
     * List full details
     * Never truncate responses

5. Essential Grammar Rules:
   Package References:
   - ALWAYS use "pakkanum" (never "pakknum")
   - Use "pakkana" (never "pökkana") in accusative plural
   - With "í": Use "Í Saman pakkanum" or "Í Sér pakkanum"
   
   Ritual References:
   - Use exact phrases from knowledge base
   - Maintain exact names and terminology

6. Forbidden Practices:
   - NO creating new Icelandic phrases
   - NO combining phrases in new ways
   - NO translating or paraphrasing
   - NO adding transitions or connections
   - NO cultural or contextual additions
   - NO conversational enhancements
   - NO natural language adjustments

7. Response Completeness:
   - Always provide FULL information from knowledge base
   - Never default to shortened versions
   - Never summarize or paraphrase
   - Keep exact phrasing from knowledge base
   - Include all details as written in knowledge base

8. When Information is Missing:
   - Use ONLY responses from COMPLETELY_UNKNOWN_IS array
   - Do not attempt to create or generate content
   - Do not translate from English knowledge base
   - Do not combine partial information
   - Do not try to answer with incomplete information
   - Direct users to contact team with provided contact details

RITUAL QUERIES:
1. When asking about skipping ritual:
   - IF message contains:
     * "bara ofaní"
     * "bara lón"
     * "án ritúal"
     * "sleppa ritúal"
     * "sleppa ritual"
     * "kaupa bara"
     * "bara aðgang"
   - THEN respond with EXACTLY:
     "Skjól ritúal meðferðin er innifalin í öllum pökkum okkar og er órjúfanlegur hluti af Sky Lagoon upplifuninni. Þú getur valið á milli tveggja pakka - Saman eða Sér - sem báðir innihalda aðgang að lóninu og Skjól ritúal meðferðina."

2. NEVER:
   - Suggest ritual can be skipped
   - Mention possibility of lagoon-only access
   - Create alternative options
   - Modify the standard response   

FACILITIES RESPONSE TEMPLATES:
KNOWLEDGE BASE PRIMACY AND LINK INCLUSION:
- Use exact descriptions from knowledgeBase_is as the core content
- Always include relevant website links after content sections
- Maintain accurate information while allowing natural flow
- If information isn't in knowledge base, use simpler factual response

1. For "Hvað er innifalið" and comparison queries, ALWAYS use this structure:
   "Við bjóðum upp á tvenns konar búningsaðstöðu:

   Saman aðstaða:
   - Almennir búningsklefar
   - Sturtuaðstaða 
   - Læstir skápar
   - Sky Lagoon snyrtivörur
   - Handklæði innifalið
   - Hárþurrkur
   [Skoða Saman aðgang] (${knowledgeBase_is.website_links.packages})

   Sér aðstaða:
   - Einkaklefi með sturtu (rúmar tvo)
   - Læstir skápar
   - Sky Lagoon snyrtivörur
   - Handklæði innifalið
   - Hárþurrkur
   [Skoða Sér aðgang] (${knowledgeBase_is.website_links.packages})

   Láttu mig vita ef þú hefur fleiri spurningar!"

2. For two-person queries:
   ALWAYS use: "Já, Sér klefarnir eru hannaðir fyrir tvo gesti. Þeir eru rúmgóðir einkaklefar með sturtu. [Skoða Sér aðgang] (${knowledgeBase_is.website_links.packages})"

3. For amenities queries:
   ALWAYS use: "Já, Sky Lagoon snyrtivörur eru í boði í öllum búningsklefum. [Skoða aðstöðu] (${knowledgeBase_is.website_links.packages})"

STRICT RULES:
1. ALWAYS include relevant website links after content sections
2. NEVER explain differences in sentences - use bullet points
3. NEVER combine features in new ways
4. NEVER add extra explanations
5. Keep responses clear and structured

FORBIDDEN PHRASES:
- "örugglega"
- "þú getur"
- "bæta við þinni heilsufar"
- Any English words or transitions

FORBIDDEN PHRASES: 
- "færir þú" (use "færð þú" instead)
- "á hinn bóginn"
- "sérstök þjónusta"
- "þægindi"
- "bæta við heilsufar"
- "örugglega"
- "einnig"
- "færir þú" (use "færð þú" instead)
- "á hinn bóginn"
- "sérstök þjónusta"
- "þægindi"
- "bæta við heilsufar"
- "örugglega"
- "einnig"
- "hárþurrk" (use "hárþurrkur" instead)
- "rúmar fyrir tvo" (use "rúmar tvo" instead)
- "innihalda" (when listing features)
- "á meðan"
- "ásamt"
- "innifela"
- Any variations of "while" or "whereas"
- Any attempts to create sentences instead of bullet points
- Any attempt to explain differences in prose

ALWAYS:
- Use EXACT descriptions from knowledge base
- Keep original word order and phrasing
- Include ALL parts of the information
- Use bullet points for listing features
- End with "Láttu mig vita ef þú hefur fleiri spurningar!"

NEVER:
- Create new descriptions
- Modify knowledge base content
- Combine descriptions in new ways
- Add marketing language
- Mention the ritual unless specifically asked
- Use "einnig" or "líka" unnecessarily

ACCESSIBILITY RESPONSE TEMPLATES:
KNOWLEDGE BASE PRIMACY:
- ALWAYS use exact phrases from knowledgeBase_is.facilities.accessibility
- NEVER create new descriptions or modify existing ones
- NEVER combine descriptions in new ways
- COPY content EXACTLY as written
- If information isn't in knowledge base, use ONLY: "Við mælum með að hafa samband við okkur á reservations@skylagoon.is fyrir nákvæmar upplýsingar um þessa þjónustu."

1. For General Accessibility Queries, ALWAYS use this structure:
   First: "Já. Öll okkar aðstaða, þ.m.t. búningsklefar og sturtur, veita gott aðgengi fyrir hjólastóla, auk þess sem stólalyfta er við lónið sjálft."
   Then: "Við erum með góða aðstöðu fyrir hjólastóla, bjóðum upp á aðgangs-svítuna sem er hjólastóla væn og sérbúna einkaklefa með betri og stærri aðstöðu."
   Then: "Við erum með lyftu til þess að hjálpa einstaklingum í og úr lóninu. Þá erum við með hjólastóla sem einstaklingar geta notað á meðan þeir fara í gegnum ritúalið."
   End: "Við mælum með að hafa samband við okkur fyrirfram á reservations@skylagoon.is ef þú þarft sérstaka aðstoð eða aðbúnað."

2. For Pool Access Queries:
   USE EXACTLY: "Við erum með lyftu til þess að hjálpa einstaklingum í og úr lóninu."

3. For Ritual Access Queries:
   USE EXACTLY: "Þá erum við með hjólastóla sem einstaklingar geta notað á meðan þeir fara í gegnum ritúalið."

4. For Companion Queries:
   USE EXACTLY: "Við bjóðum frían aðgang fyrir fylgdarmenn."

FORBIDDEN PHRASES:
- "geymum vatninu"
- "án vandræða"
- "með þægindi"
- Any attempts to explain accessibility in new words
- Any variations of prepared phrases
- Any connecting phrases not in knowledge base

ALWAYS:
- Use EXACT phrases from knowledge base
- Include ALL relevant accessibility features
- End with contact information
- Add "Láttu mig vita ef þú hefur fleiri spurningar!"

NEVER:
- Create new descriptions
- Modify knowledge base content
- Add marketing language
- Assume features not listed
- Skip any relevant accessibility information

ICELANDIC LATE ARRIVAL RESPONSES:
1. Query Pattern Detection:
   ACTION QUESTIONS (CHECK FIRST):
   - Contains "hvað get ég" / "hvað getum við"
   - Contains "hvað á ég að" / "hvað eigum við að"
   - Contains "breyta tímanum" / "breyta bókun"
   - Contains "er hægt að breyta"
   THEN: Use grace period response unless specific time mentioned
   
   PLURAL FORMS (CHECK SECOND):
   - "við verðum" / "við erum" / "við komum"
   - Any sentence starting with "við"
   - Multiple names ("Jón og Páll", etc.)
   
   QUESTION PATTERNS:
   - Ends with "í lagi?"
   - Starts with "er í lagi"
   - Contains "get ég" / "getum við"
   - Contains "má ég" / "megum við"
   THEN: Start with "Já, "
   
   UNCERTAINTY PATTERNS:
   - "ég held" / "held ég"
   - "kannski" / "mögulega"
   - "hugsanlega" / "líklega"
   THEN: Start with "Ekki hafa áhyggjur - "

2. Time Detection (After Pattern Checks):
   OVER 30 MINUTES (CHECK FIRST):
   - Contains any of these time indicators:
     * "klukkutíma" / "klst" / "60 mínútur"
     * "40 mínútur" / "45 mínútur" / "35 mínútur"
     * Any number above 30 + "mínútur"
     * Phrase patterns:
       - "klukkutíma of seinn"
       - "klukkutíma of sein"
       - "klst of seinn"
       - "klst of sein"
     * ALWAYS triggers over 30 minutes response
   
   EXPLICIT WITHIN GRACE PERIOD:
   - "20 mínútur" / "15 mínútur" / "korter"
   - "hálftíma" / "30 mínútur"
   - Any number up to 30 + "mínútur"
   
   NO TIME MENTIONED:
   - If action question detected, use grace period response
   - If changing time mentioned, use grace period response
   - If only "sein/seinn" mentioned, use grace period response

3. Response Templates:
   FOR ACTION QUESTIONS:
   Singular: "Þú hefur 30 mínútna svigrúm til að mæta. Ef þú verður seinni en það, hafðu samband við okkur í síma 527 6800 eða með tölvupósti á reservations@skylagoon.is og við finnum tíma sem hentar þér betur. Láttu mig vita ef þú hefur fleiri spurningar!"
   
   Plural: "Þið hafið 30 mínútna svigrúm til að mæta. Þið getið mætt beint í móttöku þegar þið komið. Ef þið verðið seinni, hafið samband við okkur í síma 527 6800 eða með tölvupósti á reservations@skylagoon.is. Látið mig vita ef þið hafið fleiri spurningar!"

   FOR DELAYS OVER 30 MINUTES:
   Singular: "Fyrir svona langa seinkun mælum við með að breyta bókuninni. Hafðu samband við okkur í síma 527 6800 eða með tölvupósti á reservations@skylagoon.is og við finnum tíma sem hentar þér betur. Láttu mig vita ef þú hefur fleiri spurningar!"
   
   Plural: "Fyrir svona langa seinkun mælum við með að breyta bókuninni. Hafið samband við okkur í síma 527 6800 eða með tölvupósti á reservations@skylagoon.is og við finnum tíma sem hentar ykkur betur. Látið mig vita ef þið hafið fleiri spurningar!"

   FOR WITHIN GRACE PERIOD:
   Singular base: "Þú hefur 30 mínútna svigrúm til að mæta. Þú getur mætt beint í móttöku þegar þú kemur. Ef þú verður seinni, hafðu samband við okkur í síma 527 6800 eða með tölvupósti á reservations@skylagoon.is. Láttu mig vita ef þú hefur fleiri spurningar!"
   
   Plural base: "Þið hafið 30 mínútna svigrúm til að mæta. Þið getið mætt beint í móttöku þegar þið komið. Ef þið verðið seinni, hafið samband við okkur í síma 527 6800 eða með tölvupósti á reservations@skylagoon.is. Látið mig vita ef þið hafið fleiri spurningar!"

4. Response Assembly Rules:
   STEP 1: Check for explicit time indicators (klukkutíma/specific minutes)
   STEP 2: Check for action questions
   STEP 3: Check if plural
   STEP 4: Check if question (needs "Já")
   STEP 5: Check if uncertain (needs "Ekki hafa áhyggjur")
   STEP 6: Select appropriate template
   STEP 7: Add prefix if needed

5. Question Handling Examples:
   "klukkutíma of seinn" → Use over 30 minutes template
   "hvað get ég gert?" → Use action question template
   "hvað getum við gert?" → Use plural action question template
   "er það í lagi?" → Start with "Já, "
   "getum við" → Start with "Já, "
   "má ég" → Start with "Já, "
   
   FOR PLURAL QUESTIONS:
   "er það í lagi?" + plural → "Já, þið hafið..."
   "getum við" → "Já, þið hafið..."

6. Contact Information Format:
   Singular:
   - "hafðu samband við okkur í síma 527 6800"
   - "með tölvupósti á reservations@skylagoon.is"
   
   Plural:
   - "hafið samband við okkur í síma 527 6800"
   - "með tölvupósti á reservations@skylagoon.is"

7. Follow-up Format:
   Singular: "Láttu mig vita ef þú hefur fleiri spurningar"
   Plural: "Látið mig vita ef þið hafið fleiri spurningar"

8. Response Priorities:
   1. Explicit time indicators (klukkutíma/minutes) override all other patterns
   2. Action questions take precedence if no specific time given
   3. Questions about changing times use action template unless specific time mentioned
   4. Default to grace period response when no specific time given

9. STRICTLY FORBIDDEN:
   - Mixed singular/plural in same response
   - "til að mæta" after "seinn/sein"
   - "til að fá frekari leiðbeiningar"
   - Starting response without required prefix
   - Skipping direct question acknowledgment
   - Using long delay response without explicit time mention
   - Giving grace period response when klukkutíma/over 30 minutes is mentioned
   
FOR MENU RESPONSES:
1. Single Menu Item Response:
   WHEN_ASKING_ABOUT_SPECIFIC_ITEM:
   - Start: 'Á "[item_name]" er:'
   - Add description exactly as in knowledge base
   - End with: "Verð: [price]"
   - Close with: "Láttu mig vita ef þú hefur fleiri spurningar!"

2. Full Menu Response:
   WHEN_ASKING_ABOUT_FULL_MENU:
   - Start: "Á matseðlinum okkar eru eftirfarandi plattar:"
   - First category: "Litlir plattar:"
   - Second category: "Stórir plattar:"
   - List each item with price
   - End with: "Láttu mig vita ef þú vilt vita meira um einhvern platta!"

3. Content Formatting:
   - ALWAYS use exact descriptions from knowledge base
   - NEVER create or modify menu items
   - ALWAYS include prices
   - ALWAYS keep categories separate
   - Use bullet points for item contents
   - Keep all subtitle information (e.g., "Tilvalið að deila")

4. Price Formatting:
   - Use format: "Verð: ISK X,XXX"
   - Keep exact price from knowledge base
   - Place price at end of description

5. Menu Overview Format:
   Start: "Á matseðlinum okkar eru eftirfarandi plattar:"
   Structure:
   1. Litlir plattar:
      - [name] - ISK [price]
      - [name] - ISK [price]
      - [name] - ISK [price]

   2. Stórir plattar:
      - [name] - ISK [price]
      - [name] - ISK [price]
      - [name] - ISK [price]

6. Specific Rules:
   - Use quotes around dish names: '"Til sjávar og sveita"'
   - Keep exact descriptions
   - Include all dietary notes
   - Maintain original price formatting
   - Keep all subtitle information
   - End all responses with standard closing phrase

7. Vocabulary and Terms:
   - "plattur" not "platti" when referring to menu
   - "á matseðlinum okkar" not "á matseðilnum"
   - "borið fram með" for accompaniments
   - Always use complete dish names
   - Keep exact subtitles (e.g., "Tilvalið að deila")

8. DO NOT:
   - Create new menu items
   - Modify descriptions
   - Change prices
   - Add ingredients not listed
   - Mix categories
   - Omit any information from knowledge base

MENU TERMINOLOGY AND GRAMMAR:
1. Basic Forms:
   - Use "plattar" not "plöttur"
   - Use "á matseðlinum okkar" not "á matseðlinum"
   - Use "sælkeraplatta" in accusative case
   - Always use accusative case for menu items
   - Use "platti" (nominative) not "platta" when it's the subject

2. Platter Grammar:
   - Nominative: "þessi platti", "einn af stóru plöttunum"
   - Accusative: "um platta", "velja platta"
   - Genitive: "innihaldsefni plattans"
   - Definite: "plattinn", "plattana"
   - Plural: "plattar", "plattarnir", "plöttum"

3. Menu Introductions:
   - "Á matseðlinum okkar er meðal annars að finna eftirfarandi platta:"
   - "Á matseðlinum okkar eru meðal annars eftirfarandi plattar:"
   - "Hér eru plattar sem þú getur valið á milli:"

4. Item Descriptions:
   - For full menu: "Á matseðlinum okkar eru nokkrir sérvaldir plattar:"
   - For single item: "Á [name] platta er eftirfarandi:"
   - Always include price: " - ISK X,XXX"
   - Use quotes for dish names: '"Til sjávar og sveita"'
   - End descriptions with period
   - List items with bullet points: "- [item]"

5. Content Descriptions:
   - Keep exact descriptions from knowledge base
   - Never modify ingredients or contents
   - Use "með" + dative case for accompaniments
   - Always mention "borið fram með" for bread/sides
   - List all components in order as shown in knowledge base

6. Dietary Information:
   - Use "glútenlausir valkostir" not "glútenlaust"
   - Use "glútenlaust mataræði" not "fæði"
   - Use "vegan valkostir" for vegan options
   - When mentioning both: "glútenlausir og vegan valkostir"
   - Always specify if options available at both venues

7. Standard Phrases:
   - Overview: "Á matseðlinum okkar eru nokkrir sérvaldir plattar..."
   - Single item: "Hér eru innihaldsefni [name]:"
   - Sharing: "Tilvalið að deila"
   - Conclusion: "Láttu mig vita ef þú hefur fleiri spurningar!"

8. ALWAYS:
   - Use complete descriptions from knowledge base
   - Include all prices exactly as listed
   - Use proper categories (Litlir/Stórir plattar)
   - Include dietary options when relevant
   - End with offer for more information

9. NEVER:
   - Create new descriptions
   - Modify menu items
   - Change prices
   - Combine items
   - Add ingredients not in knowledge base
   - Make assumptions about availability

10. Response Structure for Menu Items:
    - Start with item name in quotes
    - List all components with bullet points
    - Include price
    - Add any special notes (seasonal, sharing suggestion)
    - End with standard closing phrase

11. Full Menu Response Structure:
    1. Overview sentence
    2. Category headers (Litlir/Stórir plattar)
    3. Items with prices
    4. Dietary options
    5. Closing phrase

12. Seasonal Information:
    - Always specify if item is seasonal
    - Note "Aðeins yfir hátíðarnar" for holiday items
    - Include current availability when relevant
    
13. Response Grammar Consistency:
    - For single items: 'Á "[name]" plattanum er eftirfarandi:'
    - Use "plattanum" (dative) when referring to specific item
    - Keep "er eftirfarandi" not "eru eftirfarandi" for single items
    - List contents with bullet points starting with hyphen (-)
    - One item per line
    - Special notes in parentheses when needed
    - Price on its own line at end

14. Content Ordering:
    - Name and introduction
    - Special notes (if any)
    - Contents with bullet points
    - "Borið fram með" items
    - Price
    - Closing phrase
    
GIFT CARD RESPONSES:
1. Price Query Format:
   WHEN_ASKING_ABOUT_PRICES:
   - Start with tagline from marketing
   - MUST use this exact structure:
   "Við bjóðum upp á eftirfarandi gjafakort:

   Einstaklingsgjafakort:
   - Sér gjafakort: ISK 14,990
   - Saman gjafakort: ISK 11,990

   Stefnumótsgjafakort:
   - Saman stefnumót: frá ISK 33,480
   - Sér stefnumót: frá ISK 39,480

   Öll gjafakort innihalda aðgang að lóninu og Skjól ritúalinu okkar."

2. Purchase Instructions Format:
   WHEN_EXPRESSING_INTEREST_IN_BUYING:
   - MUST use this exact structure:
   "Gjafakort Sky Lagoon er fullkomið fyrir öll þau sem vilja gefa gjöf sem endurnærir bæði sál og líkama.

   Til að kaupa gjafabréf á netinu:
   1. Farðu á skylagoon.is
   2. Veldu 'Kaupa gjafakort'
   3. Veldu tegund gjafakorts
   4. Kláraðu kaupin í gegnum örugga greiðslugátt

   Einnig er hægt að kaupa gjafabréf í móttökunni okkar."

   Patterns that trigger this response:
   - "Mig langar að kaupa"
   - "Vil kaupa"
   - "Hef áhuga á að kaupa"
   - "Vantar gjafabréf"
   - "Hvernig kaupi ég"

3. Grammar Rules for Gift Cards:
   - Use "gjafakort" not "gjafabref" when referring to product
   - Use "gjafabréf" when referring to physical item
   - Keep exact pricing format: "ISK X,XXX"
   - Use "frá ISK X,XXX" for variable pricing
   - Maintain word order in descriptions

4. ALWAYS:
   - Include marketing tagline for purchase queries
   - List all available options when discussing prices
   - Keep exact prices from knowledge base
   - End with "Láttu mig vita ef þú hefur fleiri spurningar"

5. NEVER:
   - Create new gift card types
   - Modify prices
   - Change descriptions
   - Mix singular/plural forms
   - Add features not in knowledge base

6. Response Structure:
   - Start with marketing or direct answer
   - Include all relevant information
   - Keep exact formatting
   - End with standard closing phrase

7. Gift Card Grammar:
   Singular forms:
   - "gjafakortið"
   - "gjafabréfið"
   
   Plural forms:
   - "gjafakortin"
   - "gjafabréfin"
   
   With prepositions:
   - "með gjafakorti"
   - "fyrir gjafakort"
   - "í gjafakorti"`;
}

    basePrompt += `\n\nRESPOND IN ${languageDecision.isIcelandic ? 'ICELANDIC' : 'ENGLISH'}.`;

    console.log('\n🤖 Final System Prompt:', {
        prompt: basePrompt,
        language: {
            isIcelandic: languageDecision.isIcelandic,
            confidence: languageDecision.confidence,
            reason: languageDecision.reason
        }
    });
    return basePrompt;
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

// Enhanced casual chat handler with better language detection
const handleCasualChat = (message, languageDecision) => {
    try {
        const msg = message.toLowerCase();
        
        // Add early return for booking queries
        if (msg.includes('bóka') || 
            msg.includes('panta') || 
            msg.includes('tíma') || 
            msg.includes('stefnumót') ||
            msg.includes('hvernig bóka')) {
            return null;
        }
        
        // Log chat analysis
        console.log('\n💬 Casual Chat Analysis:', {
            message: msg,
            isIcelandic: languageDecision.isIcelandic,
            confidence: languageDecision.confidence,
            reason: languageDecision.reason,
            patterns: {
                isGreeting: /^(?:hi|hello|hey|hæ|halló)\b/i.test(msg),
                isCasualGreeting: msg.includes('bara heilsa') || msg.includes('bara að heilsa'),
                isHowAreYou: /how are you|how\'s it going|hvað segir|hvernig hefur/i.test(msg),
                isPositive: /^(?:good|great|fine|ok|okay|gott|frábært|geggjað|flott)$/i.test(msg)
            }
        });

        // Use new language detection
        const useEnglish = !languageDecision.isIcelandic;

        // Handle casual greetings first - keep existing functionality
        if (!useEnglish && (msg.includes('bara heilsa') || 
            msg.includes('bara að heilsa') || 
            msg.includes('bara að kíkja'))) {
            return "Vertu velkomin/n! Láttu mig vita ef þú hefur einhverjar spurningar eða ef ég get aðstoðað þig með eitthvað varðandi Sky Lagoon. 😊";
        }

        // Check for "nice to meet you" variations
        if (useEnglish) {
            if (msg.includes('nice to meet') || 
                msg.includes('good to meet') || 
                msg.includes('pleased to meet') || 
                msg.includes('great to meet')) {
                return SMALL_TALK_RESPONSES.en.greeting[Math.floor(Math.random() * SMALL_TALK_RESPONSES.en.greeting.length)];
            }
            // English "how are you" variations
            if (msg.includes('how are you') || 
                msg.includes('how do you do') || 
                msg.includes('how\'s it going')) {
                return SMALL_TALK_RESPONSES.en.casual[Math.floor(Math.random() * SMALL_TALK_RESPONSES.en.casual.length)];
            }
            // English positive responses
            if (/^(?:good|great|fine|ok|okay)$/i.test(msg)) {
                return SMALL_TALK_RESPONSES.en.positive[Math.floor(Math.random() * SMALL_TALK_RESPONSES.en.positive.length)];
            }
        } else {
            // Icelandic greeting variations
            if (msg.includes('gaman að hitta') || 
                msg.includes('gaman að kynnast') || 
                msg.includes('gott að hitta')) {
                return SMALL_TALK_RESPONSES.is.greeting[Math.floor(Math.random() * SMALL_TALK_RESPONSES.is.greeting.length)];
            }
            // Icelandic "how are you" variations
            if (msg.includes('hvað segir') || 
                msg.includes('hvernig hefur') || 
                msg.includes('allt gott')) {
                return SMALL_TALK_RESPONSES.is.casual[Math.floor(Math.random() * SMALL_TALK_RESPONSES.is.casual.length)];
            }
            // Icelandic positive responses
            if (/^(?:gott|frábært|geggjað|flott)$/i.test(msg)) {
                return SMALL_TALK_RESPONSES.is.positive[Math.floor(Math.random() * SMALL_TALK_RESPONSES.is.positive.length)];
            }
        }

        // Check for enhanced small talk patterns with new language detection
        const smallTalkResult = detectSmallTalk(msg, languageDecision);
        if (smallTalkResult.isSmallTalk) {
            return getSmallTalkResponse(smallTalkResult, languageDecision);
        }

        return null;

    } catch (error) {
        console.error('\n❌ Error in handleCasualChat:', {
            error: error.message,
            stack: error.stack,
            input: {
                message,
                languageDecision
            }
        });
        return null;
    }
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
        'https://hysing.svorumstrax.is'  // Add your new domain here
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

    // Reset specific contexts when appropriate
    if (message.toLowerCase().includes('reschedule') || 
        message.toLowerCase().includes('change') || 
        message.toLowerCase().includes('modify')) {
        // Reset late arrival context when explicitly asking about booking changes
        context.lateArrivalContext = {
            ...context.lateArrivalContext,
            isLate: false,
            type: null,
            minutes: null
        };
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
        const arrivalCheck = detectLateArrivalScenario(message, languageDecision, context);  // Added context
        if (!arrivalCheck && !message.match(/it|that|this|these|those|they|there/i)) {
            context.lateArrivalContext = {
                ...context.lateArrivalContext,
                isLate: false,
                type: null,
                minutes: null
            };
            // Only clear lastTopic if we're sure we're moving to a different subject
            if (!message.toLowerCase().includes('book')) {
                context.lastTopic = null;
            }
        }
    }

    // Update late arrival context if detected
    const arrivalCheck = detectLateArrivalScenario(message, languageDecision, context);  // Added context
    if (arrivalCheck) {
        context.lateArrivalContext = {
            ...context.lateArrivalContext,
            isLate: true,
            type: arrivalCheck.type,
            minutes: arrivalCheck.minutes,
            lastUpdate: Date.now()
        };
        context.lastTopic = 'late_arrival';
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

// Enhanced chat endpoint with GPT-4 optimization
app.post('/chat', verifyApiKey, async (req, res) => {
    let context;  // Single declaration at the top
    
    try {
        // Initialize session first
        const currentSession = conversationContext.get('currentSession');
        const sessionId = currentSession || `session_${Date.now()}`;
        
        console.log('\n🔍 Full request body:', req.body);
        
        // Get message from either question or message field
        const userMessage = req.body.message || req.body.question;
        
        console.log('\n📥 Incoming Message:', userMessage);
        
        // Store new session if needed
        if (!currentSession) {
            conversationContext.set('currentSession', sessionId);
            console.log('\n🆕 New Session Created:', sessionId);
        }

        // Get initial context
        context = conversationContext.get(sessionId);

        // Do language detection first, with null context if we don't have one yet
        const languageDecision = newDetectLanguage(userMessage, context);        

        // Keep old system during testing (modified to work without languageResult)
        const oldSystemResult = {
            isIcelandic: detectLanguage(userMessage),  // Simplified old system check
            source: 'old_system'
        };

        // Now initialize context if it doesn't exist, using our language detection
        if (!context) {
            context = initializeContext(sessionId, languageDecision);
            conversationContext.set(sessionId, context);
        }

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

        // Check if we should transfer to human agent
        const transferCheck = await shouldTransferToAgent(userMessage, languageDecision, context);
        
        console.log('\n🔄 Transfer Check Result:', {
            shouldTransfer: transferCheck.shouldTransfer,
            reason: transferCheck.reason,
            withinHours: isWithinOperatingHours(),
            availableAgents: transferCheck.agents?.length || 0
        });

        if (transferCheck.shouldTransfer) {
            try {
                // Create chat as customer
                console.log('\n📝 Creating new LiveChat chat for:', sessionId);
                const chatData = await createChat(sessionId, languageDecision.isIcelandic);

                if (!chatData.chat_id) {
                    throw new Error('Failed to create chat');
                }

                console.log('\n✅ Chat created successfully:', chatData.chat_id);

                // Send initial message to LiveChat (if not already sent in welcome_message)
                const messageSent = await sendMessageToLiveChat(chatData.chat_id, userMessage, chatData.customer_token);
                console.log('\n📝 Initial message sent:', messageSent);
                
                // Prepare transfer message based on language
                const transferMessage = languageDecision.isIcelandic ?
                    "Ég er að tengja þig við þjónustufulltrúa. Eitt andartak..." :
                    "I'm connecting you with a customer service representative. One moment...";

                // Broadcast the transfer message
                await broadcastConversation(
                    userMessage,
                    transferMessage,
                    languageDecision.isIcelandic ? 'is' : 'en',
                    'transfer',
                    'direct_response'
                );

                // No need to explicitly transfer - LiveChat's routing will handle it
                console.log('\n✅ Chat created - LiveChat will handle routing');

                return res.status(200).json({
                    message: transferMessage,
                    transferred: true,
                    chatId: chatData.chat_id,
                    customerToken: chatData.customer_token, // Include customer token
                    initiateWidget: true,
                    language: {
                        detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                        confidence: languageDecision.confidence
                    }
                });
            } catch (error) {
                console.error('\n❌ Transfer Error:', error);
                // Fall through to AI response if transfer fails
                
                // Provide fallback response when transfer fails
                const fallbackMessage = languageDecision.isIcelandic ?
                    "Því miður er ekki hægt að tengja þig við þjónustufulltrúa núna. Vinsamlegast hringdu í +354 527 6800 eða sendu tölvupóst á reservations@skylagoon.is fyrir aðstoð." :
                    "I'm sorry, I couldn't connect you with an agent at the moment. Please call us at +354 527 6800 or email reservations@skylagoon.is for assistance.";

                await broadcastConversation(
                    userMessage,
                    fallbackMessage,
                    languageDecision.isIcelandic ? 'is' : 'en',
                    'transfer_failed',
                    'direct_response'
                );

                return res.status(200).json({
                    message: fallbackMessage,
                    transferred: false,
                    error: error.message,
                    language: {
                        detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                        confidence: languageDecision.confidence
                    }
                });
            }
        } else if (transferCheck.response) {
            // If we have a specific response (e.g., outside hours), send it
            await broadcastConversation(
                userMessage,
                transferCheck.response,
                languageDecision.isIcelandic ? 'is' : 'en',
                'transfer_unavailable',
                'direct_response'
            );

            return res.status(200).json({
                message: transferCheck.response,
                language: {
                    detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence
                }
            });
        }
        // Handle messages when in agent mode
        if (req.body.chatId && req.body.isAgentMode) {
            try {
                // Send message to LiveChat using customer token
                await sendMessageToLiveChat(req.body.chatId, userMessage, req.body.customerToken);
                
                return res.status(200).json({
                    success: true,
                    chatId: req.body.chatId,
                    customerToken: req.body.customerToken, // Pass token back
                    suppressMessage: true,  // Add this flag
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

        // Check for flight delays BEFORE any other processing
        const lateScenario = detectLateArrivalScenario(userMessage, languageDecision, context);
        if (lateScenario && lateScenario.type === 'flight_delay') {
            // Use our new language detection for response selection
            const useEnglish = !languageDecision.isIcelandic || languageDecision.confidence === 'high';
            const response = getRandomResponse(BOOKING_RESPONSES.flight_delay);

            await broadcastConversation(
                userMessage,
                response,
                useEnglish ? 'en' : 'is',
                'late_arrival',
                'direct_response'
            );

            return res.status(200).json({
                message: response,
                lateArrivalHandled: true,
                lateScenarioType: 'flight_delay'
            });
        }

        // Early greeting check
        const isGreeting = isSimpleGreeting(userMessage, languageDecision);  // Pass languageDecision
        if (isGreeting) {
            const msg = userMessage.toLowerCase().replace(/\brán\b/gi, '').trim();
            const isEnglishGreeting = !languageDecision.isIcelandic && 
                                    (languageDecision.confidence === 'high' || 
                                    /^(?:hi|hello|hey|hi there|good morning|good afternoon)\b/i.test(msg));
                                    (simpleEnglishGreetings.some(g => 
                                        msg === g || msg === g + '!' || msg.startsWith(g + ' ')
                                    ));

            // Log greeting detection with pattern match (use stored result)
            logGreetingMatch(userMessage, isGreeting, languageDecision);

            // Log enhanced greeting check
            console.log('\n👋 Enhanced Greeting Check:', {
                original: userMessage,
                cleaned: msg,
                isEnglishDetected: !languageDecision.isIcelandic,
                confidence: languageDecision.confidence,
                isEnglishGreeting: isEnglishGreeting,
                patterns: {
                    isSimpleHi: /^(?:hi|hello|hey)\b$/i.test(msg),
                    isEnglishGreetingWithMore: /^(?:hi|hello|hey)\b.+/i.test(msg),
                    matchesSimpleGreetings: simpleEnglishGreetings.some(g => msg === g)
                }
            });
            
            // Check for follow-up greeting with new language system
            const isFollowUp = isFollowUpGreeting(userMessage, languageDecision) || context.conversationStarted;
            
            // Always use follow-up responses since ChatWidget handles initial greeting
            const response = isFollowUp ? 
                (!languageDecision.isIcelandic ? 
                    FOLLOWUP_RESPONSES.en[Math.floor(Math.random() * FOLLOWUP_RESPONSES.en.length)] :
                    FOLLOWUP_RESPONSES.is[Math.floor(Math.random() * FOLLOWUP_RESPONSES.is.length)]) :
                (!languageDecision.isIcelandic ? 
                    GREETING_RESPONSES.english[0] : 
                    GREETING_RESPONSES.icelandic[0]);

            // Log the follow-up response selection
            if (isFollowUp) {
                logFollowUpResponse(languageDecision, response);
            }

            // Update context and save
            context.language = languageDecision.isIcelandic ? 'is' : 'en';
            context.conversationStarted = true;
            conversationContext.set(sessionId, context);
            
            // Broadcast the greeting
            await broadcastConversation(
                userMessage,
                response,
                languageDecision.isIcelandic ? 'is' : 'en',
                'greeting',
                'direct_response'
            );
    
            return res.status(200).json({
                message: response,
                language: {
                    detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence,
                    reason: languageDecision.reason
                }
            });
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

        // ADD THE NEW CODE RIGHT HERE 👇
            // Add timestamp for performance tracking
            const startTime = Date.now();

            // Add logging before check
            console.log('\n🔍 Processing Query:', {
                message: userMessage,
                isIcelandic,
                timestamp: new Date().toISOString()
            });        
        
            // Enhanced booking detection/Simplified for better performance - Add this BEFORE late arrival check
            const isAvailabilityQuery = isIcelandic && (
                userMessage.toLowerCase().includes('eigið laust') ||
                userMessage.toLowerCase().includes('laust pláss') ||
                userMessage.toLowerCase().includes('hægt að bóka') ||
                userMessage.toLowerCase().includes('á morgun') ||
                userMessage.toLowerCase().includes('laust fyrir')  // Add this simple check instead of regex
            );

            // Add logging after check
            console.log('\n✅ Availability Check:', {
                isAvailabilityQuery,
                message: userMessage,
                processingTime: Date.now() - startTime
            });     

            const msg = userMessage.toLowerCase();            

        // Add late arrival context tracking
        const arrivalCheck = detectLateArrivalScenario(userMessage, languageDecision, context);
        if (arrivalCheck) {
            context.lastTopic = 'late_arrival';
            context.lateArrivalContext = {
                ...context.lateArrivalContext,
                isLate: true,
                type: arrivalCheck.type,
                minutes: arrivalCheck.minutes,
                lastUpdate: Date.now()
            };

            let response;
            const useEnglish = !languageDecision.isIcelandic || languageDecision.confidence === 'high';

            if (arrivalCheck.type === 'unspecified_delay') {
                response = getRandomResponse(BOOKING_RESPONSES.unspecified_delay);
            } else if (arrivalCheck.type === 'within_grace') {
                response = getRandomResponse(BOOKING_RESPONSES.within_grace);
            } else if (arrivalCheck.type === 'early_arrival') {
                response = "We recommend booking for the actual time you plan to arrive. Our capacity is managed in real-time, and we cannot guarantee availability if you arrive earlier than your booked time. Please book directly for your preferred arrival time to ensure your spot.";    
            } else if (arrivalCheck.type === 'moderate_delay') {
                response = getRandomResponse(context.soldOutStatus ? 
                    BOOKING_RESPONSES.moderate_delay.sold_out : 
                    BOOKING_RESPONSES.moderate_delay.normal);
            } else if (arrivalCheck.type === 'significant_delay') {
                response = getRandomResponse(BOOKING_RESPONSES.significant_delay);
            } else {
                response = getRandomResponse(BOOKING_RESPONSES.moderate_delay.normal);
            }

            await broadcastConversation(
                userMessage,
                response,
                useEnglish ? 'en' : 'is',
                'late_arrival',
                'direct_response'
            );

            return res.status(200).json({
                message: response,
                lateArrivalHandled: true,
                lateScenarioType: arrivalCheck.type,
                language: {
                    detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence,
                    reason: languageDecision.reason
                }
            });
        }

        // ADD NEW SMART CONTEXT CODE Right HERE 👇 .
        // Smart context-aware knowledge base selection
        const getRelevantContent = (userMessage) => {  // Remove isIcelandic parameter
            // Use our new language detection with existing context
            const contentLanguageDecision = newDetectLanguage(userMessage, context);

            // Get knowledge base results immediately based on language decision
            const baseResults = contentLanguageDecision.isIcelandic ? 
                getRelevantKnowledge_is(userMessage) : 
                getRelevantKnowledge(userMessage);

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
                const results = contentLanguageDecision.isIcelandic ? 
                    getRelevantKnowledge_is(userMessage) : 
                    getRelevantKnowledge(userMessage);
                    
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
            let results = contentLanguageDecision.isIcelandic ? 
                getRelevantKnowledge_is(userMessage) : 
                getRelevantKnowledge(userMessage);

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

        // Use the smart context function instead of direct knowledge base calls
        let knowledgeBaseResults = getRelevantContent(userMessage);  // Remove isIcelandic parameter

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

        // Enhanced question pattern detection using new language system
        const hasBookingPattern = !languageDecision.isIcelandic ? 
            questionPatterns.booking.en.some(pattern => msg.includes(pattern)) :
            (languageDecision.confidence === 'high' ? 
                questionPatterns.booking.is.some(pattern => msg.includes(pattern)) :
                questionPatterns.booking.en.some(pattern => msg.includes(pattern)));

        // Check question words with new language detection
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

        // Only proceed with acknowledgment check if no booking/question patterns detected
        if (knowledgeBaseResults.length === 0) {
            if (!hasBookingPattern && !hasQuestionWord) {
                // Use new language detection system for acknowledgments
                const useEnglish = !languageDecision.isIcelandic && languageDecision.confidence === 'high';

                // Enhanced logging for acknowledgment detection
                console.log('\n🤝 Acknowledgment Pattern Check:', {
                    message: msg,
                    language: {
                        isIcelandic: languageDecision.isIcelandic,
                        confidence: languageDecision.confidence,
                        reason: languageDecision.reason
                    }
                });

                // Check all acknowledgment patterns
                if (acknowledgmentPatterns.finished.en.some(pattern => msg.includes(pattern)) ||
                    acknowledgmentPatterns.finished.is.some(pattern => msg.includes(pattern))) {
                    const response = useEnglish ?
                        "Thanks for chatting! I'm here if you need any more information later." :
                        "Takk fyrir spjallið! Ef þú þarft frekari upplýsingar seinna meir er ég hérna.";
                        
                    await broadcastConversation(userMessage, response, languageDecision.isIcelandic ? 'is' : 'en', 
                        'finished', 'direct_response');
                    return res.status(200).json({ message: response, 
                        language: { detected: languageDecision.isIcelandic ? 'Icelandic' : 'English', confidence: languageDecision.confidence }});
                }
                
                if (acknowledgmentPatterns.continuity.en.some(pattern => msg.includes(pattern)) ||
                    acknowledgmentPatterns.continuity.is.some(pattern => msg.includes(pattern))) {
                    const response = useEnglish ? "Of course! Please go ahead and ask your questions." :
                        "Endilega spurðu!";
                        
                    await broadcastConversation(userMessage, response, languageDecision.isIcelandic ? 'is' : 'en', 
                        'continuity', 'direct_response');
                    return res.status(200).json({ message: response, 
                        language: { detected: languageDecision.isIcelandic ? 'Icelandic' : 'English', confidence: languageDecision.confidence }});
                }
                
                if (acknowledgmentPatterns.positive.en.some(pattern => msg.includes(pattern)) ||
                    acknowledgmentPatterns.positive.is.some(pattern => msg.includes(pattern))) {
                    const response = useEnglish ?
                        "I'm glad I could help! What else would you like to know about Sky Lagoon?" :
                        "Gott að geta hjálpað! Ef þú hefur fleiri spurningar, ekki hika við að spyrja.";
                        
                    await broadcastConversation(userMessage, response, languageDecision.isIcelandic ? 'is' : 'en', 
                        'positive', 'direct_response');
                    return res.status(200).json({ message: response, 
                        language: { detected: languageDecision.isIcelandic ? 'Icelandic' : 'English', confidence: languageDecision.confidence }});
                }
                
                if (acknowledgmentPatterns.general.en.some(pattern => msg.includes(pattern)) ||
                    acknowledgmentPatterns.general.is.some(pattern => msg.includes(pattern))) {
                    const response = useEnglish ?
                        "Thank you! What else would you like to know about Sky Lagoon?" :
                        "Gaman að heyra! Er eitthvað fleira sem þú vilt vita um Sky Lagoon?";
                        
                    await broadcastConversation(userMessage, response, languageDecision.isIcelandic ? 'is' : 'en', 
                        'general', 'direct_response');
                    return res.status(200).json({ message: response, 
                        language: { detected: languageDecision.isIcelandic ? 'Icelandic' : 'English', confidence: languageDecision.confidence }});
                }
                
                // Finally check simple acknowledgments with word limit
                if (userMessage.split(' ').length <= 4) {
                    // First check with checkSimpleResponse
                    const simpleResponseType = checkSimpleResponse(userMessage, languageDecision);
                    const useEnglish = simpleResponseType === 'en' ||  
                                    (!simpleResponseType && !languageDecision.isIcelandic && 
                                    /^(?:ok|okay|alright|sure|got it|right|perfect|great|thanks)\b/i.test(userMessage));

                    // Enhanced logging for acknowledgment detection
                    console.log('\n🔍 Checking Simple Acknowledgment:', {
                        message: userMessage,
                        language: {
                            isIcelandic: languageDecision.isIcelandic,
                            confidence: languageDecision.confidence,
                            reason: languageDecision.reason
                        },
                        wordCount: userMessage.split(' ').length,
                        cleanedMessage: msg
                    });

                    const isAcknowledgment = useEnglish ?
                        // Enhanced English acknowledgment check
                        (acknowledgmentPatterns.simple.en.some(word => msg === word.toLowerCase()) ||
                         /^(?:nothing|maybe|very|that was|one more|tell me)\b/i.test(msg)) :
                        // Icelandic check - JUST CHANGE THIS LINE:
                        acknowledgmentPatterns.simple.is.some(word => msg.includes(word.toLowerCase())) ||
                        msg === 'oki' || msg === 'okei' || msg === 'ókei';  // Add explicit checks
                            
                    if (isAcknowledgment) {
                        // Ensure English patterns get English responses
                        const forceEnglish = /^(?:ok|okay|alright|sure|perfect|great|got it)\b/i.test(msg);
                        const response = (useEnglish || forceEnglish) ?
                            "Is there anything else you'd like to know about Sky Lagoon?" :
                            "Láttu mig vita ef þú hefur fleiri spurningar!";

                        await broadcastConversation(userMessage, response, languageDecision.isIcelandic ? 'is' : 'en', 
                            'acknowledgment', 'direct_response');
                        return res.status(200).json({ message: response, 
                            language: { detected: languageDecision.isIcelandic ? 'Icelandic' : 'English', confidence: languageDecision.confidence }});
                    }
                }
            }
        }

        // Check if this is a completely unrelated query first
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
                                  // Add these discount-related terms
                                  userMessage.toLowerCase().includes('discount') ||
                                  userMessage.toLowerCase().includes('offer') ||
                                  userMessage.toLowerCase().includes('deal') ||
                                  userMessage.toLowerCase().includes('price') ||
                                  userMessage.toLowerCase().includes('cost') ||
                                  // Add these booking-specific terms
                                  userMessage.toLowerCase().includes('tíma') ||
                                  userMessage.toLowerCase().includes('stefnumót') ||
                                  userMessage.toLowerCase().includes('hvernig bóka') ||
                                  userMessage.toLowerCase().includes('bóka tíma');

        // Add shouldBeUnknown check first
        const shouldBeUnknown = !knowledgeBaseResults.length && !isKnownBusinessTopic;

        // Enhanced small talk handling with new language detection system
        if (knowledgeBaseResults.length === 0 && 
            !originalResults && 
            !shouldBeUnknown && 
            !isServiceQuestion(userMessage, languageDecision) && 
            !isBookingQuery(userMessage)) {
                const simpleResponseType = checkSimpleResponse(msg, languageDecision);
                const casualResponse = handleCasualChat(msg, languageDecision.isIcelandic, languageDecision);
                if (simpleResponseType || casualResponse || Object.values(smallTalkPatterns).some(category => 
                    Object.values(category).some(patterns => 
                        patterns.some(pattern => msg.includes(pattern))
                    ))
                ) {
                context.lastTopic = 'small_talk';
                context.conversationStarted = true;
                
                // Enhanced logging with new language system
                console.log('\n💬 Small Talk Detection:', {
                    message: msg,
                    language: {
                        isIcelandic: languageDecision.isIcelandic,
                        confidence: languageDecision.confidence,
                        reason: languageDecision.reason
                    },
                    simpleResponseType,
                    patterns: {
                        hasCasualResponse: !!casualResponse,
                        matchesPattern: true
                    }
                });
            
                const response = casualResponse || (() => {
                    // Check for specific small talk with new language system
                    const smallTalkResult = detectSmallTalk(msg, languageDecision);
                    if (smallTalkResult.isSmallTalk) {
                        return getSmallTalkResponse(smallTalkResult, languageDecision);
                    }
            
                    // Fallback to casual responses using new language system
                    return !languageDecision.isIcelandic ? 
                        SMALL_TALK_RESPONSES.en.casual[Math.floor(Math.random() * SMALL_TALK_RESPONSES.en.casual.length)] :
                        (languageDecision.confidence === 'high' ? 
                            SMALL_TALK_RESPONSES.is.casual[Math.floor(Math.random() * SMALL_TALK_RESPONSES.is.casual.length)] :
                            SMALL_TALK_RESPONSES.en.casual[Math.floor(Math.random() * SMALL_TALK_RESPONSES.en.casual.length)]);
                })();
            
                // Update context with new language detection
                context.language = languageDecision.isIcelandic ? 'is' : 'en';
            
                // Broadcast the small talk conversation with new language system
                await broadcastConversation(
                    userMessage,
                    response,
                    languageDecision.isIcelandic ? 'is' : 'en',
                    'small_talk',
                    'direct_response'
                );    
            
                return res.status(200).json({
                    message: response,
                    language: {
                        detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                        confidence: languageDecision.confidence
                    }
                });
            }
        }
        
        // Acknowledgment and continuity handling
        // Check for conversation continuity first
        if (acknowledgmentPatterns.continuity.en.some(pattern => msg.includes(pattern)) ||
            acknowledgmentPatterns.continuity.is.some(pattern => msg.includes(pattern))) {
            const response = languageDecision.isIcelandic ?
                "Endilega spurðu!" :
                "Of course! Please go ahead and ask your questions.";

            await broadcastConversation(
                userMessage,
                response,
                languageDecision.isIcelandic ? 'is' : 'en',
                'continuity',
                'direct_response'
            );

            return res.status(200).json({
                message: response,
                language: {
                    detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence
                }
            });
        }

        // Check for positive feedback
        if (acknowledgmentPatterns.positive.en.some(word => msg.includes(word)) ||
            acknowledgmentPatterns.positive.is.some(word => msg.includes(word))) {
            const response = languageDecision.isIcelandic ?
                "Gott að geta hjálpað! Ef þú hefur fleiri spurningar, ekki hika við að spyrja." :
                "I'm glad I could help! What else would you like to know about Sky Lagoon?";
    
            await broadcastConversation(
                userMessage,
                response,
                languageDecision.isIcelandic ? 'is' : 'en',
                'acknowledgment',
                'direct_response'
            );

            return res.status(200).json({
                message: response,
                language: {
                    detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence
                }
            });
        }

        // Check for general chat praise
        if (acknowledgmentPatterns.general.en.some(pattern => msg.includes(pattern)) ||
            acknowledgmentPatterns.general.is.some(pattern => msg.includes(pattern))) {
            const response = languageDecision.isIcelandic ?
                "Gaman að heyra! Er eitthvað fleira sem þú vilt vita um Sky Lagoon?" :
                "Thank you for the kind words! What else would you like to know about Sky Lagoon?";

            await broadcastConversation(
                userMessage,
                response,
                languageDecision.isIcelandic ? 'is' : 'en',
                'acknowledgment',
                'direct_response'
            );

            return res.status(200).json({
                message: response,
                language: {
                    detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence
                }
            });
        }

        // Check for conversation ending
        if (acknowledgmentPatterns.finished.en.some(pattern => 
            msg.replace(/[:;][\-]?[\)|\(]/g, '').trim().includes(pattern)) ||
            acknowledgmentPatterns.finished.is.some(pattern => 
            msg.replace(/[:;][\-]?[\)|\(]/g, '').trim().includes(pattern))) {
            const response = languageDecision.isIcelandic ?
                msg.includes('heil') || msg.includes('bara að heilsa') ?
                    "Vertu velkomin/n! Láttu mig vita ef þú hefur einhverjar spurningar eða ef ég get aðstoðað þig með eitthvað varðandi Sky Lagoon. 😊" :
                    "Takk fyrir spjallið! Ef þú þarft frekari upplýsingar seinna meir er ég hérna." :
                msg.includes('just say') || msg.includes('greeting') ?
                    "Hi there! Feel free to ask if you have any questions about Sky Lagoon. I'm here to help! 😊" :
                    "Thanks for chatting! I'm here if you need any more information later.";

            await broadcastConversation(
                userMessage,
                response,
                languageDecision.isIcelandic ? 'is' : 'en',
                'finished',
                'direct_response'
            );

            return res.status(200).json({
                message: response,
                language: {
                    detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence
                }
            });
        } 

        // Yes/Confirmation handling
        if (userMessage.toLowerCase().trim() === 'yes' && context.lastTopic) {
            let response = getContextualResponse('confirmation', context.messages.map(m => m.content));
            
            // Use new language detection system
            const useEnglish = !languageDecision.isIcelandic || languageDecision.confidence === 'high';
            
            if (context.lastTopic === 'seasonal') {
                if (context.seasonalContext?.type === 'winter') {
                    response += useEnglish ? 
                        " Would you like to know about:\n" +
                        "- Our winter activities and experiences?\n" +
                        "- Northern lights viewing opportunities?\n" +
                        "- Our facilities during winter?\n\n" +
                        "Please let me know which aspect interests you most." :
                        " Viltu fá að vita meira um:\n" +
                        "- Vetrarupplifunina okkar og afþreyingu?\n" +
                        "- Norðurljósaskoðun?\n" +
                        "- Aðstöðuna okkar á veturna?\n\n" +
                        "Láttu mig vita hvaða þáttur áhugaverðastur.";
                } else if (context.seasonalContext?.type === 'summer') {
                    response += useEnglish ?
                        " Would you like to know about:\n" +
                        "- Our summer activities and experiences?\n" +
                        "- Late evening sun viewing opportunities?\n" +
                        "- Our facilities during summer?\n\n" +
                        "Please let me know which aspect interests you most." :
                        " Viltu fá að vita meira um:\n" +
                        "- Sumarupplifunina okkar og afþreyingu?\n" +
                        "- Miðnætursólina?\n" +
                        "- Aðstöðuna okkar á sumrin?\n\n" +
                        "Láttu mig vita hvaða þáttur áhugaverðastur.";
                }
            } else {
                response += ` ${'Would you like to know anything else about our offerings?'}`;
            }

            await broadcastConversation(
                userMessage,
                response,
                languageDecision.isIcelandic ? 'is' : 'en',
                'confirmation',
                'direct_response'
            );

            return res.status(200).json({
                message: response,
                language: {
                    detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence
                }
            });
        }

        // Check if it's a group booking query but DON'T return immediately
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

            // Add broadcast for tracking group booking queries
            await broadcastConversation(
                userMessage,
                'group_booking_detection',  // Not a response, just tracking the detection
                languageDecision.isIcelandic ? 'is' : 'en',
                'group_bookings',
                'detection'
            );
            
            // Continue to normal flow to let GPT handle with knowledge base content
        }

        // If no knowledge base matches found, check if it's a hours query first
        if (knowledgeBaseResults.length === 0) {
            // PASTE THE UNKNOWN QUERY BLOCK HERE FIRST
            // If message has no relation to our business and no knowledge base matches
            if (!isKnownBusinessTopic && knowledgeBaseResults.length === 0) {
                const unknownResponse = languageDecision.isIcelandic ? 
                    UNKNOWN_QUERY_RESPONSES.COMPLETELY_UNKNOWN_IS[
                        Math.floor(Math.random() * UNKNOWN_QUERY_RESPONSES.COMPLETELY_UNKNOWN_IS.length)
                    ] :
                    UNKNOWN_QUERY_RESPONSES.COMPLETELY_UNKNOWN[
                        Math.floor(Math.random() * UNKNOWN_QUERY_RESPONSES.COMPLETELY_UNKNOWN.length)
                    ];

                // Add broadcast with new language system
                await broadcastConversation(
                    userMessage,
                    unknownResponse,
                    languageDecision.isIcelandic ? 'is' : 'en',
                    'unknown_query',
                    'direct_response'
                );

                return res.status(200).json({
                    message: unknownResponse,
                    language: {
                        detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                        confidence: languageDecision.confidence
                    }
                });
            }

            // THEN KEEP ALL THE EXISTING CODE HERE
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
                                // Add these crucial pattern checks
                                userMessage.toLowerCase().includes('með veitinga') ||   // Catches "eruð þið með veitinga..."
                                userMessage.toLowerCase().includes('sýna matseðil') ||  // Catches "getið þið sýnt matseðil..."
                                userMessage.toLowerCase().includes('sýnt mér') ||       // Catches menu show requests
                                userMessage.toLowerCase().includes('eruð þið með') ||
                                userMessage.toLowerCase().includes('hafið þið') ||
                                userMessage.toLowerCase().includes('er hægt að fá mat') ||
                                userMessage.toLowerCase().includes('hægt að borða');

            // The critical part - force knowledge base lookup for ANY dining query
            if (isHoursQuery || isDiningQuery) {
                // Use language detection with confidence check
                knowledgeBaseResults = languageDecision.isIcelandic && languageDecision.confidence === 'high' ? 
                    getRelevantKnowledge_is(userMessage) : 
                    getRelevantKnowledge(userMessage);

                // Enhanced debug logging
                console.log('\n🍽️ Dining Query Debug:', {
                    message: userMessage,
                    isDiningQuery,
                    language: {
                        isIcelandic: languageDecision.isIcelandic,
                        confidence: languageDecision.confidence,
                        reason: languageDecision.reason,
                        patterns: languageDecision.patterns
                    },
                    gotResults: knowledgeBaseResults.length > 0
                });
            }

            // Only check for simple response if it's not an hours query or service question
            if (!isHoursQuery && !isServiceQuestion(userMessage, languageDecision)) {
                const simpleResponseLanguage = languageDecision.isIcelandic ? 'is' : 'en';
                const response = simpleResponseLanguage === 'is' ? 
                    "Láttu mig vita ef þú hefur fleiri spurningar!" :
                    "Is there anything else you'd like to know about Sky Lagoon?";

                // Add broadcast with new language detection
                await broadcastConversation(
                    userMessage,
                    response,
                    simpleResponseLanguage,
                    'acknowledgment',
                    'direct_response'
                );
                        
                return res.status(200).json({
                    message: response,
                    language: {
                        detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                        confidence: languageDecision.confidence
                    }
                });
            }
        }

        // Enhanced logging with new language system
        console.log('\n📚 Knowledge Base Match:', {
            language: {
                isIcelandic: languageDecision.isIcelandic,
                confidence: languageDecision.confidence,
                reason: languageDecision.reason,
                patterns: languageDecision.patterns
            },
            matches: knowledgeBaseResults.length,
            types: knowledgeBaseResults.map(k => k.type),
            details: JSON.stringify(knowledgeBaseResults, null, 2)
        });

        // Enhanced Unknown Query Check
        const confidenceScore = calculateConfidence(userMessage, knowledgeBaseResults, languageDecision);
        const shouldUseUnknownHandler = handleUnknownQuery(userMessage, confidenceScore, knowledgeBaseResults, languageDecision);       
        if (shouldUseUnknownHandler && !userMessage.toLowerCase().startsWith('welcome')) {
            // Enhanced logging
            console.log('\n📝 Using Unknown Query Handler Response:', {
                message: userMessage,
                language: {
                    isIcelandic: languageDecision.isIcelandic,
                    confidence: languageDecision.confidence,
                    reason: languageDecision.reason
                }
            });

            // Add broadcast with new language system
            await broadcastConversation(
                userMessage,
                shouldUseUnknownHandler.response,
                languageDecision.isIcelandic ? 'is' : 'en',
                'unknown_query',
                'direct_response'
            );

            // Update context and cache with new language information
            updateContext(sessionId, userMessage, shouldUseUnknownHandler.response);
            responseCache.set(`${sessionId}:${userMessage.toLowerCase().trim()}`, {
                response: {
                    message: shouldUseUnknownHandler.response,
                    language: {
                        detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                        confidence: languageDecision.confidence,
                        reason: languageDecision.reason
                    }
                },
                timestamp: Date.now()
            });

            // Return the unknown query response with enhanced language info
            return res.status(200).json({
                message: shouldUseUnknownHandler.response,
                language: {
                    detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence,
                    reason: languageDecision.reason
                }
            });
        }

        // Detect topic for appropriate transitions and follow-ups
        const { topic } = detectTopic(userMessage, knowledgeBaseResults, context, languageDecision);
        
        // Enhanced seasonal handling
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

        // Now handle first-time messages (moved here to check knowledge base first)
        if (!context.conversationStarted && 
            !knowledgeBaseResults.length && 
            !topicResult.topic && 
            !isHoursQuery) { 
            context.conversationStarted = true;
            const introResponse = `${getRandomResponse(SMALL_TALK_RESPONSES)} `;

            // Add broadcast with new language system
            await broadcastConversation(
                userMessage,
                introResponse,
                languageDecision.isIcelandic ? 'is' : 'en',
                'first_time',
                'direct_response'
            );

            return res.status(200).json({
                message: introResponse,
                language: {
                    detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
                    confidence: languageDecision.confidence
                }
            });
        }

        // Force hours topic if it's an hours query
        if (isHoursQuery) {
            topicResult = {
                topic: 'hours'
            };
            const seasonInfo = getCurrentSeason();
            context.operatingHours = seasonInfo;
        }

        // Enhanced system prompt with all context
        let systemPrompt = getSystemPrompt(sessionId, isHoursQuery, userMessage, languageDecision);

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

        // Add user message with new language system
        messages.push({
            role: "user",
            content: `Knowledge Base Information: ${JSON.stringify(knowledgeBaseResults)}
                
                User Question: ${userMessage}
                
                Please provide a natural, conversational response using ONLY the information from the knowledge base. 
                Maintain our brand voice and use "our" instead of "the" when referring to facilities and services.
                Response MUST be in ${languageDecision.isIcelandic ? 'Icelandic' : 'English'}`
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

        // Broadcast with new language system
        if (completion && req.body.message) {
            await broadcastConversation(
                req.body.message,
                completion.choices[0].message.content,
                languageDecision.isIcelandic ? 'is' : 'en',
                context?.lastTopic || 'general',
                'gpt_response'
            );
        }

        const response = completion.choices[0].message.content;
        console.log('\n🤖 GPT Response:', response);

        // Apply terminology enhancement
        const enhancedResponse = enforceTerminology(response);
            
        console.log('\n✨ Enhanced Response:', enhancedResponse);

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

        // Return enhanced response with new language system
        return res.status(200).json({
            message: enhancedResponse,
            language: {
                detected: languageDecision.isIcelandic ? 'Icelandic' : 'English',
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

        // Add broadcast for error scenarios with proper language
        await broadcastConversation(
            userMsg || 'unknown_message',
            errorMessage,
            errorLanguageDecision.isIcelandic ? 'is' : 'en',
            'error',
            'error_response'
        );

        return res.status(500).json({
            message: errorMessage,
            language: {
                detected: errorLanguageDecision.isIcelandic ? 'Icelandic' : 'English',
                confidence: errorLanguageDecision.confidence
            }
        });
    }
});

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
        
        return pusher.trigger('chat-channel', 'conversation-update', conversationData)
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
                throw error;
            });
    } catch (error) {
        console.error('❌ Error in handleConversationUpdate:', error);
        return Promise.resolve();
    }
}

// Helper function to detect topic with enhanced language detection
const detectTopic = (message, knowledgeBaseResults, context, languageDecision) => {
    const msg = message.toLowerCase();
    let topic = null;
    let transition = null;
    
    // Check previous topic from context
    const previousTopic = context?.lastTopic;
    
    // Detect current topic with new language detection
    const isIcelandic = languageDecision?.isIcelandic || false;
    
    // Detect current topic with language awareness
    if (msg.includes('package') || msg.includes('sér') || msg.includes('saman') || 
        (isIcelandic && msg.includes('pakki'))) {
        topic = 'packages';
    } else if (msg.includes('ritual') || msg.includes('skjol') || msg.includes('skjól') ||
               (isIcelandic && msg.includes('meðferð'))) {
        topic = 'ritual';
    } else if (msg.includes('transport') || msg.includes('bus') || msg.includes('drive') ||
               (isIcelandic && (msg.includes('strætó') || msg.includes('keyra')))) {
        topic = 'transportation';
    } else if (msg.includes('facilities') || msg.includes('changing') || msg.includes('amenities') ||
               (isIcelandic && (msg.includes('aðstaða') || msg.includes('búningsklefar')))) {
        topic = 'facilities';
    } else if (msg.includes('winter') || msg.includes('northern lights') ||
               (isIcelandic && (msg.includes('vetur') || msg.includes('norðurljós')))) {
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
    } else if (msg.includes('summer') || msg.includes('midnight sun') ||
               (isIcelandic && (msg.includes('sumar') || msg.includes('miðnætursól')))) {
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
    } else if (msg.includes('dining') || msg.includes('food') || msg.includes('restaurant') ||
               (isIcelandic && (msg.includes('matur') || msg.includes('veitingar')))) {
        topic = 'dining';
    } else if (msg.includes('late') || msg.includes('delay') ||
               (isIcelandic && (msg.includes('seinn') || msg.includes('seinka')))) {
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
            isIcelandic: languageDecision.isIcelandic,
            confidence: languageDecision.confidence,
            reason: languageDecision.reason
        };
    }
    
    return { topic };
};

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