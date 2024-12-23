import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';
import { getRelevantKnowledge } from './knowledgeBase.js';
import { getRelevantKnowledge_is, detectLanguage } from './knowledgeBase_is.js';

// Cache and state management
const responseCache = new Map();
const conversationContext = new Map();

// Brand Guidelines and Constants
const SKY_LAGOON_GUIDELINES = {
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
    voice: {
        personal: [
            'Use "our" instead of "the" when referring to facilities',
            'Speak as a knowledgeable team member',
            'Show enthusiasm about features',
            'Maintain warmth and pride in descriptions'
        ]
    }
};

// Greeting responses
const GREETING_RESPONSES = [
    "Hello! I'd be happy to assist you. Would you like to know about our unique geothermal lagoon experience, our Sér and Saman packages, or how to get here?",
    "Hi there! Welcome to Sky Lagoon. I can help you with booking, information about our packages, or tell you about our signature Skjól ritual. What interests you?",
    "Greetings! I'm here to help plan your Sky Lagoon visit. Would you like to learn about our experiences, discuss transportation options, or hear about our packages?",
    "Welcome! I can assist with everything from booking to facility information. What would you like to know about Sky Lagoon?",
    "Hi! I'm here to help with any questions about Sky Lagoon. Would you like to know about our experiences, packages, or how to reach us?"
];

// Conversation Enhancement Arrays from original index.js
const TRANSITION_PHRASES = {
    general: [
        "Let me tell you about that...",
        "I'd be happy to explain...",
        "Here's what you need to know...",
        "Let me share the details..."
    ],
    adding_info: [
        "You might also be interested to know...",
        "It's worth mentioning that...",
        "Additionally...",
        "Something else that guests often appreciate..."
    ],
    topic_switch: [
        "Speaking of that...",
        "On a related note...",
        "That reminds me...",
        "This connects well with..."
    ]
};

const FOLLOW_UP_SUGGESTIONS = {
    packages: [
        "Would you like to learn about our transportation options to Sky Lagoon?",
        "I can tell you about our signature Skjól ritual if you're interested.",
        "Would you like to know more about what's included in each package?"
    ],
    ritual: [
        "Would you like to know about the different packages that include our ritual?",
        "I can tell you more about the seven steps of the ritual experience.",
        "Would you like to learn about the traditional elements we use in the ritual?"
    ],
    transportation: [
        "Would you like to know about our convenient parking facilities?",
        "I can tell you about our shuttle service schedule if you're interested.",
        "Would you like information about public transport options?"
    ],
    seasonal: {
        winter: [
            "Would you like to know about potential northern lights viewing during winter visits?",
            "I can tell you about our winter-specific features.",
            "Would you like to learn about our cozy winter facilities?"
        ],
        summer: [
            "Would you like to know about our extended summer hours?",
            "I can tell you about our summer evening experiences.",
            "Would you like to learn about optimal viewing times for the late evening sun?"
        ]
    },
    booking: [
        "Would you like to know about our different packages?",
        "I can tell you about our current availability.",
        "Would you like information about group bookings?"
    ]
};

const CONTEXT_TRANSITIONS = {
    normal_to_late: "I understand you'll be running late. Let me help you with your options.",
    late_to_modification: "Since you'll be delayed, would you like to know about changing your booking time?",
    modification_to_contact: "Our team can help with this change. Would you like our contact information?",
    package_to_ritual: "Since you're interested in our packages, would you like to know more about our signature Skjól ritual that's included?",
    ritual_to_facilities: "To complement the ritual experience, would you like to know about our facilities?",
    facilities_to_dining: "Speaking of our facilities, would you like to know about our dining options?",
    transportation_to_parking: "In addition to transportation, would you like to know about our parking facilities?",
    booking_to_packages: "Before you book, would you like to know more about our different packages?",
    seasonal_to_experiences: {
        winter: "To make the most of your winter visit, would you like to know about our unique seasonal experiences?",
        summer: "For the best summer experience, would you like to know about the special features of visiting during summer?"
    }
};

// Add this after CONTEXT_TRANSITIONS
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

const SMALL_TALK_RESPONSES = [
    "I'm here to help you learn all about Sky Lagoon. What would you like to know?",
    "I'd be happy to tell you about our unique experiences at Sky Lagoon.",
    "I can help you discover what makes Sky Lagoon special. What interests you most?",
    "Let me share information about Sky Lagoon with you. What would you like to know?"
];

const CONFIRMATION_RESPONSES = [
    "Great! ",
    "Excellent! ",
    "Perfect! ",
    "Wonderful! ",
    "I understand! "
];

// Late Arrival and Booking Constants
const LATE_ARRIVAL_THRESHOLDS = {
    GRACE_PERIOD: 30,
    MODIFICATION_RECOMMENDED: 60
};

const BOOKING_RESPONSES = {
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

// Constants
const RATE_LIMIT_MINUTES = 15;   // Duration in minutes for rate limiting window
const RATE_LIMIT_MAX_REQUESTS = 100;  // Maximum requests per window
const CACHE_TTL = 3600000; // 1 hour
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

// Confidence Scoring System
const CONFIDENCE_THRESHOLDS = {
    HIGH: 0.8,
    MEDIUM: 0.4,
    LOW: 0.2  // Lower threshold to allow more knowledge base responses
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

const calculateConfidence = (userMessage, relevantKnowledge) => {
    // Guard clause
    if (!userMessage || !relevantKnowledge) return 0;

    const message = userMessage.toLowerCase();
    let score = 0;
    let matchDetails = [];
    
    // Enhanced acknowledgment check
    const acknowledgmentWords = [
        'great', 'good', 'helpful', 'comfortable', 'perfect',
        'thanks', 'thank', 'ok', 'okay', 'got it', 'understood',
        'more questions', 'another question', 'few questions'
    ];
    
    // Check for multi-part questions
    const isMultiPart = message.includes('?') && message.split('?').length > 2;
    
    if (message.split(' ').length <= 6 && 
        acknowledgmentWords.some(word => message.includes(word))) {
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
        const contentStr = JSON.stringify(info.content).toLowerCase();
        
        // Calculate match percentage based on key terms
        const words = message.split(' ').filter(word => word.length > 3);
        let matches = 0;
        let totalWords = 0;
        
        words.forEach(word => {
            // Ignore common words
            if (!['what', 'how', 'when', 'where', 'does', 'about'].includes(word)) {
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

    // Log confidence calculation
    console.log('\n📊 Confidence Calculation:', {
        originalMessage: userMessage,
        score: score,
        level: score >= CONFIDENCE_THRESHOLDS.HIGH ? 'HIGH' : 
              score >= CONFIDENCE_THRESHOLDS.MEDIUM ? 'MEDIUM' : 
              score >= CONFIDENCE_THRESHOLDS.LOW ? 'LOW' : 'VERY LOW',
        matches: matchDetails,
        relevantSections: relevantKnowledge.map(k => k.type)
    });

    return score;
};

const handleUnknownQuery = (userMessage, confidenceScore, relevantKnowledge) => {
    // Log analysis start
    console.log('\n❓ Unknown Query Analysis:', {
        message: userMessage,
        confidence: confidenceScore,
        matchedTopics: relevantKnowledge.map(k => k.type)
    });

    // If we have ANY relevant knowledge, prioritize it
    if (relevantKnowledge && relevantKnowledge.length > 0) {
        console.log('📝 Found relevant knowledge, using knowledge base response');
        return null;
    }

    // Skip unknown handling for acknowledgments
    if (userMessage.length < 20 && userMessage.split(' ').length <= 4) {
        console.log('📝 Short message detected, skipping unknown query handling');
        return null;
    }

    // Only treat as completely unknown if we have zero knowledge and zero confidence
    if (confidenceScore === 0 && (!relevantKnowledge || relevantKnowledge.length === 0)) {
        console.log('📝 Query Type: COMPLETELY_UNKNOWN');
        const isIcelandic = detectLanguage(userMessage);
        return {
            type: UNKNOWN_QUERY_TYPES.COMPLETELY_UNKNOWN,
            response: getRandomResponse(isIcelandic ? 
                UNKNOWN_QUERY_RESPONSES.COMPLETELY_UNKNOWN_IS : 
                UNKNOWN_QUERY_RESPONSES.COMPLETELY_UNKNOWN)
        };
    }

    // In all other cases, let the normal response system handle it
    return null;
};

const detectLateArrivalScenario = (message) => {
    const timePatterns = [
        /(\d+)\s*(?:minute|min|minutes|mins?)\s*late/i,
        /late\s*(?:by\s*)?(\d+)\s*(?:minute|min|minutes|mins?)/i,
        /(\d+)\s*(?:minute|min|minutes|mins?)\s*delay/i
    ];

    let minutes = null;
    for (const pattern of timePatterns) {
        const match = message.match(pattern);
        if (match) {
            minutes = parseInt(match[1]);
            break;
        }
    }

    if (!minutes) return null;

    return {
        type: minutes <= LATE_ARRIVAL_THRESHOLDS.GRACE_PERIOD ? 'within_grace' :
              minutes <= LATE_ARRIVAL_THRESHOLDS.MODIFICATION_RECOMMENDED ? 'moderate_delay' :
              'significant_delay',
        minutes: minutes
    };
};

// Enhanced System Prompts
const getSystemPrompt = (isIcelandic) => {
    const basePrompt = `You are Sky Lagoon's customer service AI. You provide friendly, helpful, and accurate responses about Sky Lagoon's services and facilities.

CRITICAL RESPONSE RULES:
1. ONLY use information from the knowledge base provided
2. If information isn't in the knowledge base, respond with "${isIcelandic ? 'Ég er ekki með þessar upplýsingar tiltækar.' : 'I don\'t have that information available.'}"
3. ALWAYS RESPOND IN ${isIcelandic ? 'ICELANDIC' : 'ENGLISH'}
4. Use a warm, welcoming tone
5. Be concise but thorough

PERSONAL LANGUAGE REQUIREMENTS:
1. Always Use "Our":
   - "Our geothermal lagoon" NOT "The geothermal lagoon"
   - "Our Saman Package" NOT "The Saman Package"
   - "Our facilities" NOT "The facilities"

2. Team Member Perspective:
   - Use phrases like "At our facilities..."
   - "When you visit us..."
   - "We offer..."
   - "Our team provides..."

3. Warmth and Pride:
   - Show enthusiasm about features
   - Example: "Our beautiful infinity edge..."
   - Example: "Our pristine geothermal waters..."

RESPONSE STRUCTURE:
1. For specific questions:
   - Start with direct answer
   - Add relevant details
   - End with related information offer

2. For multi-part questions:
   - Address each part clearly
   - Use clear transitions
   - Maintain logical flow

3. For unclear queries:
   - Provide most relevant information
   - Offer specific follow-up options
   - Never ask for generic clarification`;

    return basePrompt;
};

// Token management - optimized for GPT-4
const getMaxTokens = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Complex topics that need more space
    const complexTopics = [
        'ritual', 'changing', 'facilities', 
        'packages', 'gift', 'menu', 'food',
        'transport', 'accommodation', 'ritual'
    ];

    const isComplex = complexTopics.some(topic => message.includes(topic));
    const isMultiPart = message.includes(' and ') || (message.match(/\?/g) || []).length > 1;

    if (isComplex && isMultiPart) return 800;
    if (isComplex) return 600;
    if (isMultiPart) return 500;
    return 400;
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

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: config.OPENAI_API_KEY
});

// CORS Configuration
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:8080',
        'https://sveinnssr.github.io',
        'https://sveinnssr.github.io/sky-lagoon-chat-2024'
    ],
    methods: ['POST', 'OPTIONS', 'GET'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'webhook-headers'],
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
            timestamp: new Date().toISOString()
        }
    });
};

// API Key verification middleware
const verifyApiKey = (req, res, next) => {
    const apiKey = req.header('x-api-key');
    console.log('\n🔑 API Key Check:', {
        receivedKey: apiKey,
        configuredKey: config.API_KEY,
        matches: apiKey === config.API_KEY
    });
    
    if (!apiKey || apiKey !== config.API_KEY) {
        console.error('❌ Invalid or missing API key');
        return res.status(401).json({ error: "Unauthorized request" });
    }
    next();
};

// Middleware
app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json());

// Health check endpoint
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

// Enhanced chat endpoint with GPT-4 optimization
app.post('/chat', verifyApiKey, async (req, res) => {
    try {
        console.log('\n🔍 Full request body:', req.body);
        console.log('\n📥 Incoming Message:', req.body.message);

        const userMessage = req.body.message;

        // Add this before the cache check
        const sessionId = req.sessionId || `session_${Date.now()}`;        

        // Then use it in cache check
        const cacheKey = `${sessionId}:${userMessage.toLowerCase().trim()}`;
        const cached = responseCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('\n📦 Using cached response');
            return res.json(cached.response);
        }

        // And use the same sessionId here
        let context = conversationContext.get(sessionId) || {
            soldOutStatus: false,
            lateArrivalScenario: null,
            bookingModification: {
                requested: false
            },
            conversationStarted: false,
            lastTopic: null,
            seasonalContext: {
                type: null,
                subtopic: null,
                lastFollowUp: null
            }
        };

        // Greeting handling
        const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
        if (greetings.includes(userMessage.toLowerCase().trim())) {
            const greeting = GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
            return res.status(200).json({
                message: greeting
            });
        }

        // Acknowledgment handling
        const acknowledgmentWords = [
            'great', 'good', 'helpful', 'comfortable', 'perfect',
            'thanks', 'thank', 'ok', 'okay', 'got it', 'understood'
        ];
        
        if (userMessage.split(' ').length <= 4 && 
            acknowledgmentWords.some(word => userMessage.toLowerCase().includes(word))) {
            let response;
            
            // If there's a previous topic, include it in the response
            if (context.lastTopic) {
                response = `${getRandomResponse(CONFIRMATION_RESPONSES)}${getRandomResponse(ACKNOWLEDGMENT_RESPONSES)} ${
                    context.lastTopic === 'seasonal' && context.seasonalContext?.type ?
                    `Would you like to know more about our ${context.seasonalContext.type} experiences?` :
                    FOLLOW_UP_SUGGESTIONS[context.lastTopic] ?
                    getRandomResponse(FOLLOW_UP_SUGGESTIONS[context.lastTopic]) :
                    "What else would you like to know about Sky Lagoon?"
                }`;
            } else {
                response = `${getRandomResponse(CONFIRMATION_RESPONSES)}${getRandomResponse(ACKNOWLEDGMENT_RESPONSES)}`;
            }
            
            return res.status(200).json({
                message: response
            });
        }

        // Small talk handling
        const msg = userMessage.toLowerCase();  // Define msg here
        const smallTalkPatterns = [
            'how are you',
            'who are you',
            'what can you do',
            'what do you do',
            'tell me about yourself',
            'your name',
            'who made you'
        ];

        if (smallTalkPatterns.some(pattern => msg.includes(pattern))) {
            context.lastTopic = 'small_talk';
            context.conversationStarted = true;

            const response = getRandomResponse(SMALL_TALK_RESPONSES);
            return res.status(200).json({
                message: response
            });
        }

        // Add this new section - Yes/Confirmation handling
        if (userMessage.toLowerCase().trim() === 'yes' && context.lastTopic) {
            let response = `${getRandomResponse(CONFIRMATION_RESPONSES)}`;
            
            // Add topic-specific follow-up
            if (context.lastTopic === 'seasonal') {
                if (context.seasonalContext?.type === 'winter') {
                    response += " Would you like to know about:\n" +
                              "- Our winter activities and experiences?\n" +
                              "- Northern lights viewing opportunities?\n" +
                              "- Our facilities during winter?\n\n" +
                              "Please let me know which aspect interests you most.";
                } else if (context.seasonalContext?.type === 'summer') {
                    response += " Would you like to know about:\n" +
                              "- Our summer activities and experiences?\n" +
                              "- Late evening sun viewing opportunities?\n" +
                              "- Our facilities during summer?\n\n" +
                              "Please let me know which aspect interests you most.";
                }
            } else if (FOLLOW_UP_SUGGESTIONS[context.lastTopic]) {
                response += ` ${getRandomResponse(FOLLOW_UP_SUGGESTIONS[context.lastTopic])}`;
            }

            return res.status(200).json({
                message: response
            });
        }        

        // Late arrival handling
        const lateScenario = detectLateArrivalScenario(userMessage);
        if (lateScenario) {
            let response;
            if (lateScenario.type === 'within_grace') {
                response = getRandomResponse(BOOKING_RESPONSES.within_grace);
            } else if (lateScenario.type === 'moderate_delay') {
                response = getRandomResponse(context.soldOutStatus ? 
                    BOOKING_RESPONSES.moderate_delay.sold_out : 
                    BOOKING_RESPONSES.moderate_delay.normal);
            } else {
                response = getRandomResponse(BOOKING_RESPONSES.significant_delay);
            }
            return res.status(200).json({
                message: response,
                lateArrivalHandled: true
            });
        }

        // Enhanced language detection
        const isIcelandic = detectLanguage(userMessage) && /[þæðöáíúéó]/i.test(userMessage);
        console.log('\n🌍 Language detected:', isIcelandic ? 'Icelandic' : 'English');

        // Get relevant knowledge base content with better logging
        const knowledgeBaseResults = isIcelandic ? 
            getRelevantKnowledge_is(userMessage) : 
            getRelevantKnowledge(userMessage);

        console.log('\n📚 Knowledge Base Match:', {
            matches: knowledgeBaseResults.length,
            types: knowledgeBaseResults.map(k => k.type),
            details: JSON.stringify(knowledgeBaseResults, null, 2)
        });

        // Detect topic for appropriate transitions and follow-ups
        const { topic, transition: topicTransition } = detectTopic(userMessage, knowledgeBaseResults, context);
        
        // Enhanced seasonal handling
        if (topic === 'seasonal') {
            let seasonalInfo = knowledgeBaseResults.find(k => k.type === 'seasonal_information');
            if (seasonalInfo) {
                context.seasonalContext = {
                    type: userMessage.toLowerCase().includes('winter') || userMessage.toLowerCase().includes('northern lights') ? 
                          'winter' : 'summer',
                    subtopic: userMessage.toLowerCase().includes('northern lights') ? 'northern_lights' : 
                             userMessage.toLowerCase().includes('midnight sun') ? 'midnight_sun' : 'general'
                };
            }
        }

        // Check if this is an hours-related query
        const isHoursQuery = userMessage.toLowerCase().includes('hour') || 
                           userMessage.toLowerCase().includes('open') || 
                           userMessage.toLowerCase().includes('close') ||
                           userMessage.toLowerCase().includes('time');

        // Detect topic and get initial transitions
        let topicResult = detectTopic(userMessage, knowledgeBaseResults, context);

        // Now handle first-time messages (moved here to check knowledge base first)
        if (!context.conversationStarted && 
            !knowledgeBaseResults.length && 
            !topicResult.topic && 
            !isHoursQuery) { 
            context.conversationStarted = true;
            const introResponse = `${getRandomResponse(SMALL_TALK_RESPONSES)} `;
            return res.status(200).json({
                message: introResponse
            });
        }

        // Force hours topic if it's an hours query
        if (isHoursQuery) {
            topicResult = {
                topic: 'hours',
                transition: getRandomResponse(TRANSITION_PHRASES.general)
            };
            const seasonInfo = getCurrentSeason();
            context.operatingHours = seasonInfo;
        }

        // Get transition and follow-up after seasonal context is set
        const transition = topicResult.transition || (topicResult.topic ? getRandomResponse(TRANSITION_PHRASES.general) : '');
        const followUp = topicResult.topic && FOLLOW_UP_SUGGESTIONS[topicResult.topic] ? 
            getRandomResponse(context.seasonalContext?.type === 'winter' ? 
                FOLLOW_UP_SUGGESTIONS.seasonal.winter : 
                context.seasonalContext?.type === 'summer' ? 
                    FOLLOW_UP_SUGGESTIONS.seasonal.summer : 
                    FOLLOW_UP_SUGGESTIONS[topicResult.topic]) : '';

        // Enhanced system prompt with all context
        let systemPrompt = getSystemPrompt(isIcelandic);

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

        if (transition) {
            systemPrompt += `\n\nUSE THIS TRANSITION: "${transition}"`;
        }
        if (followUp) {
            systemPrompt += `\n\nEND WITH THIS FOLLOW-UP: "${followUp}"`;
        }

        // Prepare messages array
        const messages = [
            { 
                role: "system", 
                content: systemPrompt
            }
        ];

        // Add context awareness for late arrivals
        if (context?.lateArrivalScenario || context?.bookingModification?.requested) {
            messages.push({
                role: "system",
                content: `CURRENT CONTEXT:
                    Late Arrival: ${context.lateArrivalScenario ? JSON.stringify(context.lateArrivalScenario) : 'No'}
                    Sold Out Status: ${context.soldOutStatus ? 'Yes' : 'No'}
                    Booking Modification: ${context.bookingModification?.requested ? 'Requested' : 'No'}
                    Time of Day: ${new Date().getHours() >= 9 && new Date().getHours() < 19 ? 'During support hours' : 'After hours'}`
            });
        }

        // Add user message
        messages.push({
            role: "user",
            content: `Knowledge Base Information: ${JSON.stringify(knowledgeBaseResults)}
            
            User Question: ${userMessage}
            
            Please provide a natural, conversational response using ONLY the information from the knowledge base. 
            Maintain our brand voice and use "our" instead of "the" when referring to facilities and services.
            ${transition ? `Start with: "${transition}"` : ''}
            ${followUp ? `End with: "${followUp}"` : ''}`
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
                    status: error.response?.status
                });
                if (attempt === MAX_RETRIES) throw error;
                console.log(`Retrying in ${INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1)}ms...`);
                await sleep(INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1));
            }
        }

        const response = completion.choices[0].message.content;
        console.log('\n🤖 GPT Response:', response);

        // Cache the response
        responseCache.set(cacheKey, {
            response: {
                message: response,
                language: {
                    detected: isIcelandic ? 'Icelandic' : 'English',
                    confidence: 'high'
                }
            },
            timestamp: Date.now()
        });

        // Update conversation context
        context.lastInteraction = Date.now();
        conversationContext.set(sessionId, context);

        // Return enhanced response format
        return res.status(200).json({
            message: response,
            language: {
                detected: isIcelandic ? 'Icelandic' : 'English',
                confidence: 'high'
            }
        });

    } catch (error) {
        // Update last interaction time even on error
        if (context) {
            context.lastInteraction = Date.now();
            conversationContext.set(sessionId, context);
        }

        logError(error, {
            message: req.body?.message,
            language: detectLanguage(req.body?.message)
        });
        
        return res.status(500).json({
            error: "I apologize, but I'm having trouble processing your request right now. Could you please try again?"
        });
    }
});

// Helper function to detect topic from message and knowledge base results
const detectTopic = (message, knowledgeBaseResults, context) => {
    const msg = message.toLowerCase();
    let topic = null;
    let transition = null;
    
    // Check previous topic from context
    const previousTopic = context?.lastTopic;
    
    // Detect current topic
    if (msg.includes('package') || msg.includes('sér') || msg.includes('saman')) {
        topic = 'packages';
        if (previousTopic && previousTopic !== 'packages') {
            transition = CONTEXT_TRANSITIONS.booking_to_packages;
        }
    } else if (msg.includes('ritual') || msg.includes('skjol') || msg.includes('skjól')) {
        topic = 'ritual';
        if (previousTopic === 'packages') {
            transition = CONTEXT_TRANSITIONS.package_to_ritual;
        }
    } else if (msg.includes('transport') || msg.includes('bus') || msg.includes('drive')) {
        topic = 'transportation';
        if (previousTopic === 'booking') {
            transition = CONTEXT_TRANSITIONS.booking_to_packages;
        }
    } else if (msg.includes('facilities') || msg.includes('changing') || msg.includes('amenities')) {
        topic = 'facilities';
        if (previousTopic === 'ritual') {
            transition = CONTEXT_TRANSITIONS.ritual_to_facilities;
        }
    } else if (msg.includes('winter') || msg.includes('northern lights')) {
        topic = 'seasonal';
        if (context) {
            context.seasonalContext = {
                type: 'winter',
                subtopic: msg.includes('northern lights') ? 'northern_lights' : 'general'
            };
            transition = CONTEXT_TRANSITIONS.seasonal_to_experiences.winter;
        }
    } else if (msg.includes('summer') || msg.includes('midnight sun')) {
        topic = 'seasonal';
        if (context) {
            context.seasonalContext = {
                type: 'summer',
                subtopic: msg.includes('midnight sun') ? 'midnight_sun' : 'general'
            };
            transition = CONTEXT_TRANSITIONS.seasonal_to_experiences.summer;
        }
    } else if (msg.includes('dining') || msg.includes('food') || msg.includes('restaurant')) {
        topic = 'dining';
        if (previousTopic === 'facilities') {
            transition = CONTEXT_TRANSITIONS.facilities_to_dining;
        }
    } else if (msg.includes('late') || msg.includes('delay')) {
        topic = 'booking';
        transition = CONTEXT_TRANSITIONS.normal_to_late;
    }
    
    // Check knowledge base results if no topic found in message
    if (!topic) {
        if (knowledgeBaseResults.some(r => r.type === 'packages')) topic = 'packages';
        if (knowledgeBaseResults.some(r => r.type === 'ritual')) topic = 'ritual';
        if (knowledgeBaseResults.some(r => r.type === 'transportation')) topic = 'transportation';
    }
    
    // Update context with new topic
    if (context && topic) {
        context.lastTopic = topic;
    }
    
    return { topic, transition };
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