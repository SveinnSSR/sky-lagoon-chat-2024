import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';
import { getRelevantKnowledge } from './knowledgeBase.js';
import { getRelevantKnowledge_is, detectLanguage, getLanguageContext } from './knowledgeBase_is.js';

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
    specialPhrases: {
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
        
        // Double replacement prevention
        'geothermal geothermal': 'geothermal',
        'the geothermal geothermal': 'the geothermal',
        'the geothermal geothermal water': 'the geothermal water',
        'geothermal geothermal water': 'geothermal water',

        // Complex water terms
        'in-geothermal water Gelmir lagoon bar': 'Gelmir lagoon bar',
        'in-water Gelmir lagoon bar': 'Gelmir lagoon bar',
        'in geothermal water Gelmir lagoon bar': 'Gelmir lagoon bar',
        'in-geothermal water Gelmir': 'Gelmir',
        'the Gelmir lagoon bar located in': 'the Gelmir lagoon bar in',
        'in-geothermal Gelmir': 'Gelmir',
        'Access to the in-geothermal water Gelmir lagoon bar': 'Access to the Gelmir lagoon bar',
        'Access to the in-geothermal Gelmir lagoon bar': 'Access to the Gelmir lagoon bar',
        
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
        
        // Prevent double "lagoon bar"
        'lagoon bar lagoon bar': 'lagoon bar'
    }
};

// Then add the enforceTerminology function after the guidelines
const enforceTerminology = (text) => {
    // Guard clause - if no text, return as is
    if (!text) return text;
    
    let modifiedText = text;
    
    // Log for debugging
    console.log('\n📝 Checking terminology for:', text);

    // Preserve certain phrases from replacement
    const preservePhrases = [
        'drinking water',
        'fresh water',
        'water stations',
        'water fountain'
    ];

    // First preserve phrases we don't want modified
    preservePhrases.forEach(phrase => {
        const preserveRegex = new RegExp(phrase, 'gi');
        modifiedText = modifiedText.replace(preserveRegex, `__PRESERVE_${phrase.toUpperCase()}__`);
    });

    // Handle special phrases first
    Object.entries(SKY_LAGOON_GUIDELINES.terminology.preferred).forEach(([correct, incorrect]) => {
        const phraseRegex = new RegExp(`\\b${incorrect}\\b`, 'gi');
        if (phraseRegex.test(modifiedText)) {
            console.log(`📝 Replacing "${incorrect}" with "${correct}"`);
            modifiedText = modifiedText.replace(phraseRegex, correct);
        }
    });

    // Restore preserved phrases
    preservePhrases.forEach(phrase => {
        const restoreRegex = new RegExp(`__PRESERVE_${phrase.toUpperCase()}__`, 'g');
        modifiedText = modifiedText.replace(restoreRegex, phrase);
    });

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

// Confidence Scoring System
const CONFIDENCE_THRESHOLDS = {
    HIGH: 0.8,
    MEDIUM: 0.4,
    LOW: 0.2  // Lower threshold to allow more knowledge base responses
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

// Detection Patterns
const smallTalkPatterns = [
    'how are you',
    'who are you',
    'what can you do',
    'what do you do',
    'tell me about yourself',
    'your name',
    'who made you'
];

const acknowledgmentPatterns = {
    simple: [
        'thanks', 'ok', 'got it', 'perfect', 'understood', 
        'sure', 'alright', 'yep'
    ],
    positive: [
        'great', 'helpful', 'good', 'comfortable', 'excellent'
    ],
    continuity: [
        'a few more questions', 'can i ask', 'actually',
        'have questions', 'want to ask', 'few more',
        'another question'
    ]
};

// Helper functions for response handling
const getContextualResponse = (type, previousResponses = []) => {
    let responses;
    switch(type) {
        case 'acknowledgment':
            responses = ACKNOWLEDGMENT_RESPONSES;
            break;
        case 'small_talk':
            responses = SMALL_TALK_RESPONSES;
            break;
        case 'confirmation':
            responses = CONFIRMATION_RESPONSES;
            break;
        default:
            responses = ACKNOWLEDGMENT_RESPONSES;
    }
    
    const availableResponses = responses.filter(r => !previousResponses.includes(r));
    return availableResponses[Math.floor(Math.random() * availableResponses.length)];
};

const getContextualTransition = (prevTopic, newTopic) => {
    const transitionKey = `${prevTopic}_to_${newTopic}`;
    if (CONTEXT_TRANSITIONS[transitionKey]) {
        return CONTEXT_TRANSITIONS[transitionKey];
    }
    
    const generalTransition = getRandomResponse(TRANSITION_PHRASES.topic_switch);
    
    const followUps = FOLLOW_UP_SUGGESTIONS[newTopic];
    if (followUps) {
        return `${generalTransition} ${getRandomResponse(followUps)}`;
    }
    
    return generalTransition;
};

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

// Helper function for late arrival detection
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

const seasonInfo = getCurrentSeason();

// System prompts
const getSystemPrompt = (sessionId, isHoursQuery, userMessage) => {
    const context = getContext(sessionId);
    console.log('\n👀 Context Check:', {
        hasContext: !!context,
        sessionId,
        message: userMessage
    });

    // Enhanced language detection
    const languageCheck = {
        hasIcelandicChars: /[þæðöáíúéó]/i.test(userMessage),
        rawDetection: detectLanguage(userMessage),
        languageContext: getLanguageContext(userMessage)
    };

    // Stricter language determination
    const isIcelandic = languageCheck.rawDetection && languageCheck.hasIcelandicChars;
    
    const relevantKnowledge = isIcelandic ? 
        getRelevantKnowledge_is(userMessage) : 
        getRelevantKnowledge(userMessage);
    
    console.log('\n📚 Knowledge Base Match:', JSON.stringify(relevantKnowledge, null, 2));

    let basePrompt = `You are SkyBot, Sky Lagoon's virtual assistant. Today is ${new Date().toLocaleDateString()}, during our ${seasonInfo.greeting} season.

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
   - END with relevant follow-up options

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
   
   - IF user responds with 'yes' AND context.offeredMoreInfo is true:
     - CHECK context.lastTopic:
       - IF lastTopic is 'winter':
         - MUST RESPOND EXACTLY:
         "Would you like to know more about:
         - Our winter activities and experiences?
         - Northern lights viewing opportunities?
         - Our facilities during winter?

         Please let me know which aspect interests you most."

       - IF lastTopic is 'summer':
         - MUST RESPOND EXACTLY:
         "Would you like to know more about:
         - Our summer activities and experiences?
         - Midnight sun viewing opportunities?
         - Our facilities during summer?

         Please let me know which aspect interests you most."

     - NEVER respond with generic greetings
     - NEVER revert to the other season
     - NEVER repeat the previous response
     - ALWAYS wait for user to specify their interest before providing detailed information
   
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
   - IF user responds just "yes" to an offer of more information:
     - CHECK previous topic and provide RELEVANT options:
     - IF previous topic was northern lights/winter:
       "Would you like to know more about:
       - Our winter activities and experiences?
       - Northern lights viewing opportunities?
       - Our facilities during winter?"
     - IF previous topic was summer:
       [similar structure for summer options]
   - For other unclear queries, VARY the phrasing:
     - "Would you like to know about [topic1] or [topic2]?"
     - "Are you interested in hearing about [likely_topic]?"
     - "I can tell you about [topic1] or [topic2]. Which would you prefer?"
   - AVOID the phrase "To better assist you, could you specify..."
   - When possible, PROVIDE general information FIRST, then offer to be more specific

10. For response transitions:
   - WHEN providing detailed information:
     - USE VARIED TRANSITIONS:
       - "Let me explain how this works..."
       - "Here's what you need to know..."
       - "I'd be happy to explain..."
       - "That's a great question about..."
   - WHEN adding related information:
     - USE CONNECTING PHRASES:
       - "You might also be interested to know..."
       - "Additionally..."
       - "It's worth mentioning that..."

11. For follow-up suggestions:
   - AFTER package information:
     - Suggest transportation options
     - Mention booking process
   - AFTER facility information:
     - Offer ritual information
     - Mention dining options
   - AFTER transportation answers:
     - Suggest booking information
     - Mention parking details
   - INSTEAD of just "Let me know if you need anything else":
     - "Would you like to know about [related_topic] as well?"
     - "I can also provide information about [relevant_service] if you're interested."
     - "Many guests also ask about [related_topic]. Would you like to learn more?"

12. For questions specifically about age requirements or children:
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

13. For transport/travel questions:
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

14. For food/dining questions:
   - ALWAYS list all three venues with COMPLETE information
   - For Keimur Café: location, offerings, and timing
   - For Smakk Bar: location, type, and full menu options
   - For Gelmir Bar: in-water location, drink options, and all policies
   - ALWAYS mention the cashless wristband payment system
   - Include ALL details about each venue
   - Never cut off the response mid-description

15. For package questions:
   - Start with package name and designation
   - List ALL included amenities
   - ALWAYS include specific pricing
   - Mention private vs public facilities

16. For availability/capacity questions:
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

17. For ritual-related queries:
   - ALWAYS state that the Skjól ritual is included in both Sér and Saman packages
   - NEVER suggest ritual can be booked separately
   - NEVER suggest packages without ritual are available
   - IF asked about ritual inclusion:
     - Clearly state "Yes, our signature Skjól ritual is included in both the Sér and Saman packages. It's an integral part of the Sky Lagoon experience."
   - IF asked about booking without ritual:
     - Clearly state "The Skjól ritual is included in all our packages as it's an essential part of the Sky Lagoon experience. We do not offer admission without the ritual."

18. For seasonal questions:
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
    - IF context.topicDetails is 'winter_options':
      - MUST RESPOND EXACTLY:
      "Would you like to know more about:
      - Our winter activities and experiences?
      - Northern lights viewing opportunities?
      - Our facilities during winter?

      Please let me know which aspect interests you most."
    - IF context.topicDetails is 'summer_options':
      - MUST RESPOND EXACTLY:
      "Would you like to know more about:
      - Our summer activities and experiences?
      - Late evening sun viewing opportunities?
      - Our facilities during summer?

      Please let me know which aspect interests you most."
    - IF context.referenceContext exists:
      - IF context.referenceContext.topic is 'winter_experience':
        - SWITCH context.referenceContext.point:
          - CASE 1:
            "During winter at Sky Lagoon, the possibility of seeing the northern lights adds a magical element to your visit. While viewing depends on natural conditions like clear skies and solar activity, our location away from city lights provides good viewing opportunities. The best viewing times are during our evening hours in winter months (November to March). Would you like to know about optimal viewing times during winter?"
          - CASE 2:
            "The snow-covered surroundings create a stunning winter landscape that enhances your Sky Lagoon experience. The contrast between the white snow and the steaming geothermal waters creates a uniquely Icelandic atmosphere. Would you like to know more about our winter facilities?"
          - CASE 3:
            "Experience the invigorating contrast between our perfectly heated 38-40°C geothermal waters and the crisp winter air. This temperature difference creates a cozy and refreshing sensation that's particularly enjoyable during the winter months. Would you like to know more about what makes winter visits special?"
          - CASE 4:
            "Our indoor facilities are heated year-round, providing a cozy retreat during your winter visit. The warm changing rooms, comfortable relaxation areas, and heated indoor spaces ensure a comfortable experience regardless of the outdoor temperature. Would you like to know more about our facility amenities?"
          - CASE 5:
            "Our infinity edge offers spectacular winter sunset views across the ocean. The low winter sun creates beautiful colors and atmospheric scenes, especially during the shorter daylight hours of winter. Would you like to know about the best times to visit for sunset viewing?"
    - IF about specific season:
      - Give that season's highlights
      - Include practical information
    - ONLY ask for clarification if question is highly ambiguous
    - End with specific follow-up options rather than generic clarification
    - For northern lights questions:
      - Be clear about winter viewing possibilities
      - Mention it depends on natural conditions
      - Include winter operating hours
      - Never guarantee sightings

19. For booking changes and cancellations:
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
    - NEVER use "To better assist you, could you specify..."
    
20. For follow-up responses:
    - IF discussing seasonal information AND user wants more details:
      - FOR winter highlights:
        "During winter at Sky Lagoon, you can enjoy:
        - The contrast between warm 38-40°C water and crisp winter air
        - Snow-covered surroundings creating a magical atmosphere
        - Beautiful winter sunset views from our infinity edge
        - Generally less crowded than summer months
        - Cozy winter atmosphere with indoor heated facilities"
      - FOR summer highlights:
        [similar structure for summer]
    - ALWAYS end with relevant follow-up options
    - NEVER revert to generic greetings

21. For Multi-Pass questions:
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
    
22. For Late Arrivals and Booking Changes:
    - IF context.lateArrivalScenario exists:
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
        - "Would you like to check availability for a different date?"
        - "Our team can help find the next available time."
      - PROVIDE contact options:
        - "Call us at +354 527 6800 (9 AM - 7 PM)"
        - "Email reservations@skylagoon.is"
      - NEVER suggest walk-ins during sold-out periods

    - PHONE SUPPORT HOURS:
      - ALWAYS mention "9 AM - 7 PM" when providing phone number
      - Outside these hours, emphasize email support first

23. For Food and Drink Queries:
    - IF asked about adding to packages:
      - First state package inclusions
      - Explain reception desk options
      - Mention Gelmir lagoon bar access
      - Use this structure:
        "Our Sky Lagoon for Two packages include [inclusions]. While these inclusions are set during online booking, you can arrange for additional food or drinks at our reception desk. During your visit, you'll also have full access to our Gelmir lagoon bar where you can purchase additional beverages using our cashless wristband system."      

24. For Late Time Slot Queries:
    - IF asked about booking after 18:00:
      - NEVER suggest checking availability
      - ALWAYS state clearly: "Our Sky Lagoon for Two package can only be booked until 18:00 to ensure you can fully enjoy all inclusions, including our Sky Platter and drinks service."
      - Offer to provide information about available time slots
    - IF asking about sunset or evening visits with Sky Lagoon for Two:
      - ALWAYS mention 18:00 last booking time
      - Include reason (to enjoy all inclusions)
      - Suggest booking times based on season if relevant

25. For Package Comparison Queries:
    - WHEN comparing packages:
      - Start with "Our [Package Name] is designed for..."
      - Use bullet points for clear comparison
      - ALWAYS use "our" before:
         * Package names
         * Facilities
         * Amenities
         * Services
      - Structure as:
        1. "Our [Package 1]:"
           - List inclusions
        2. "Our [Package 2]:"
           - List inclusions
      - End with offer for more information

26. For Gift Ticket Queries:
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
      
CURRENT SCHEDULE:
- Facility closes: ${seasonInfo.closingTime}
- Last ritual: ${seasonInfo.lastRitual}
- Bar service until: ${seasonInfo.barClose}
- Lagoon access until: ${seasonInfo.lagoonClose}`;

    // Add seasonal context instructions
    if (context && context.seasonalContext) {
        basePrompt += `
SEASONAL CONTEXT:
- Current Season: ${context.seasonalContext.type}
- Subtopic: ${context.seasonalContext.subtopic}
- Last Follow-up: ${context.seasonalContext.lastFollowUp}

MAINTAIN THIS SEASONAL CONTEXT IN RESPONSES.
IF user says "yes" to more information:
- FOR SUMMER: Offer summer-specific options only
- FOR WINTER: Offer winter-specific options only
`;
    }

    // Check for active transition
    if (context && context.activeTransition) {
        basePrompt += `
USE THIS TRANSITION: "${context.activeTransition}"
`;
    }

    if (relevantKnowledge.length > 0) {
        basePrompt += '\n\nKNOWLEDGE BASE DATA:';
        relevantKnowledge.forEach(info => {
            basePrompt += `\n\n${info.type.toUpperCase()}:\n${JSON.stringify(info.content, null, 2)}`;
        });
    }

    // Add explicit age policy if question might be age-related // NOT SURE IF NECCESSARY. SEEMS TO WORK OK WITHOUT IT.
    //const ageRelatedTerms = ['minimum age', 'age limit', 'age policy', 'age restriction'];
    //const ageRelatedPhrases = [
    //'how old', 'age requirement',
    //'bring kids', 'bring children', 'with kids',
    //'with children', 'for kids', 'for children',
    //'can children', 'can kids', 'allowed age',
    //'family friendly', 'child friendly'
    //];
    
    //if (ageRelatedTerms.some(term => userMessage.toLowerCase().includes(term)) ||
    //    ageRelatedPhrases.some(phrase => userMessage.toLowerCase().includes(phrase))) {
    //    basePrompt += '\n\nMANDATORY AGE POLICY RESPONSE REQUIRED';
    //}    

    basePrompt += `\n\nRESPOND IN ${isIcelandic ? 'ICELANDIC' : 'ENGLISH'}.`;

    console.log('\n🤖 Final System Prompt:', basePrompt);
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
        'https://sveinnssr.github.io/sky-lagoon-chat-2024',
        'https://raw.githubusercontent.com/SveinnSSR/sky-lagoon-chat-2024/main/server/index.js'
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

// Context management
const updateContext = (sessionId, message, response) => {
    // Initialize context with all required properties
    let context = conversationContext.get(sessionId) || {
        messages: [],
        bookingTime: null,
        lateArrival: null,
        lastInteraction: Date.now(),
        conversationStarted: false,
        messageCount: 0,
        lastTopic: null,
        offeredMoreInfo: false,
        expectingTopicResponse: false,
        topicDetails: null,
        lastResponse: null,
        // New properties for greetings and acknowledgments
        selectedGreeting: null,
        isFirstGreeting: true,
        selectedAcknowledgment: null,
        isAcknowledgment: false,
        // Existing seasonal context
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
        activeTransition: null,
        lateArrivalScenario: null,
        soldOutStatus: false,
        lastTransition: null,
        bookingModification: {
            requested: false,
            type: null,
            originalTime: null
        }
    };

    // Reset specific contexts when appropriate
    if (message.toLowerCase().includes('reschedule') || 
        message.toLowerCase().includes('change') || 
        message.toLowerCase().includes('modify')) {
        // Reset late arrival context when explicitly asking about booking changes
        context.lateArrivalScenario = null;
        // Reset sold out status unless explicitly mentioned in current message
        if (!message.toLowerCase().includes('sold out')) {
            context.soldOutStatus = false;
        }
    }

    // Clear late arrival scenario if not talking about lateness
    if (!message.toLowerCase().includes('late') && 
        !message.toLowerCase().includes('delay')) {
        context.lateArrivalScenario = null;
    }

    // Increment message count
    context.messageCount++;

    // Track if a follow-up was offered
    if (response && response.toLowerCase().includes('would you like')) {
        context.offeredMoreInfo = true;
    }

    // Update messages array
    context.messages.push({
        role: 'user',
        content: message
    });
    context.messages.push({
        role: 'assistant',
        content: response
    });

    // Maintain reasonable history size
    if (context.messages.length > 10) {
        context.messages = context.messages.slice(-10);
    }

    // Update last interaction time
    context.lastInteraction = Date.now();
    context.lastResponse = response;
    
    // Save context
    conversationContext.set(sessionId, context);
    return context;
};

const getContext = (sessionId) => conversationContext.get(sessionId);

// Enhanced chat endpoint with GPT-4 optimization
app.post('/chat', verifyApiKey, async (req, res) => {
    // Declare context at the top level of the function
    let context;    
    try {
        console.log('\n🔍 Full request body:', req.body);
        console.log('\n📥 Incoming Message:', req.body.message);

        const userMessage = req.body.message;

        // Add this before the cache check
        const sessionId = req.sessionId || `session_${Date.now()}`;        
        
        // Initialize context before any usage
        let context = conversationContext.get(sessionId) || {
            messages: [],
            bookingTime: null,
            lateArrival: null,
            lastInteraction: Date.now(),
            conversationStarted: false,
            messageCount: 0,
            lastTopic: null,
            offeredMoreInfo: false,
            expectingTopicResponse: false,
            topicDetails: null,
            lastResponse: null,
            // New properties for greetings and acknowledgments
            selectedGreeting: null,
            isFirstGreeting: true,
            selectedAcknowledgment: null,
            isAcknowledgment: false,
            // Existing seasonal context
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
            activeTransition: null,
            lateArrivalScenario: null,
            soldOutStatus: false,
            lastTransition: null,
            bookingModification: {
                requested: false,
                type: null,
                originalTime: null
            }
        };

        // Update context with the current message
        context = updateContext(sessionId, userMessage, null);        

        // Then use it in cache check
        const cacheKey = `${sessionId}:${userMessage.toLowerCase().trim()}`;
        const cached = responseCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('\n📦 Using cached response');
            return res.json(cached.response);
        }

        // Greeting handling
        const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
        if (greetings.includes(userMessage.toLowerCase().trim())) {
            const greeting = GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
            return res.status(200).json({
                message: greeting
            });
        }

        // Small talk handling
        const msg = userMessage.toLowerCase();  // Define msg once here
        if (smallTalkPatterns.some(pattern => msg.includes(pattern))) {
            context.lastTopic = 'small_talk';
            context.conversationStarted = true;
            return res.status(200).json({
                message: getContextualResponse('small_talk', context.messages.map(m => m.content))
            });
        }

        // Acknowledgment and continuity handling
        // Check for conversation continuity first
        if (acknowledgmentPatterns.continuity.some(pattern => msg.includes(pattern))) {
            return res.status(200).json({
                message: "Of course! Please go ahead and ask your questions."
            });
        }

        // Check for positive feedback
        if (acknowledgmentPatterns.positive.some(word => msg.includes(word))) {
            const response = context.lastTopic ?
                `I'm glad I could help! If you have any more questions about ${context.lastTopic}, or anything else, feel free to ask.` :
                `I'm glad I could help! What else would you like to know about Sky Lagoon?`;
            return res.status(200).json({
                message: response
            });
        }

        // Check for simple acknowledgments (1-4 words)
        if (userMessage.split(' ').length <= 4 && 
            acknowledgmentPatterns.simple.some(word => msg.includes(word))) {
            return res.status(200).json({
                message: "Is there anything else you'd like to know about Sky Lagoon?"
            });
        }

        // Yes/Confirmation handling
        if (userMessage.toLowerCase().trim() === 'yes' && context.lastTopic) {
            let response = getContextualResponse('confirmation', context.messages.map(m => m.content));
            
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
            } else {
                response += ` ${getContextualTransition(context.lastTopic, 'confirmation')}`;
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

        // ADD NEW CODE HERE - Unknown Query Check
        const confidenceScore = calculateConfidence(userMessage, knowledgeBaseResults);
        const shouldUseUnknownHandler = handleUnknownQuery(userMessage, confidenceScore, knowledgeBaseResults);
        if (shouldUseUnknownHandler && !userMessage.toLowerCase().startsWith('welcome')) {
            // Log that we're using unknown query handler response
            console.log('\n📝 Using Unknown Query Handler Response');
            
            // Update context and cache
            updateContext(sessionId, userMessage, shouldUseUnknownHandler.response);
            responseCache.set(`${sessionId}:${userMessage.toLowerCase().trim()}`, {
                response: {
                    message: shouldUseUnknownHandler.response,
                    language: {
                        detected: isIcelandic ? 'Icelandic' : 'English',
                        confidence: 'high'
                    }
                },
                timestamp: Date.now()
            });

            // Return the unknown query response
            return res.status(200).json({
                message: shouldUseUnknownHandler.response,
                language: {
                    detected: isIcelandic ? 'Icelandic' : 'English',
                    confidence: 'high'
                }
            });
        }

        // Detect topic for appropriate transitions and follow-ups
        const { topic, transition: topicTransition } = detectTopic(userMessage, knowledgeBaseResults, context);
        
        // Enhanced seasonal handling
        if (topic === 'seasonal') {
            let seasonalInfo = knowledgeBaseResults.find(k => k.type === 'seasonal_information');
            if (seasonalInfo) {
                // Store previous season if it's changing
                const newType = userMessage.toLowerCase().includes('winter') || 
                               userMessage.toLowerCase().includes('northern lights') ? 
                               'winter' : 'summer';
                               
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

                console.log('\n🌍 Seasonal Context Updated:', {
                    newSeason: newType,
                    previousSeason: context.seasonalContext.previousSeason,
                    holiday: context.seasonalContext.holidayContext,
                    transitionDate: context.seasonalContext.transitionDate ? 
                        new Date(context.seasonalContext.transitionDate).toLocaleString() : null
                });
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
        let systemPrompt = getSystemPrompt(sessionId, isHoursQuery, userMessage);

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

        // Apply terminology enhancement
        const enhancedResponse = enforceTerminology(response);
        console.log('\n✨ Enhanced Response:', enhancedResponse);

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