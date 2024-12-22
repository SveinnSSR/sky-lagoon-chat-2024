import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';
import { getRelevantKnowledge } from './knowledgeBase.js';
import { getRelevantKnowledge_is, detectLanguage } from './knowledgeBase_is.js';
import dotenv from 'dotenv';
dotenv.config();

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
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: "Too many requests. Please try again later." }
});

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

// Chat endpoint
app.post('/chat', verifyApiKey, async (req, res) => {
    try {
        console.log('\n🔍 Full request body:', req.body);  // Add this line
        console.log('\n📥 Incoming Message:', req.body.message);

        const userMessage = req.body.message;
        
        // Detect language
        const isIcelandic = detectLanguage(userMessage);
        console.log('\n🌍 Language detected:', isIcelandic ? 'Icelandic' : 'English');

        // Get relevant knowledge base content
        const knowledgeBaseResults = isIcelandic ? 
            getRelevantKnowledge_is(userMessage) : 
            getRelevantKnowledge(userMessage);

        console.log('\n📚 Knowledge Base Match:', JSON.stringify(knowledgeBaseResults, null, 2));

        // Create system prompt
        let systemPrompt = `You are Sky Lagoon's customer service AI. You provide friendly, helpful, and accurate responses about Sky Lagoon's services and facilities. 

ONLY use information from the knowledge base provided. If information isn't in the knowledge base, respond with "${isIcelandic ? 
            'Ég er ekki með þessar upplýsingar tiltækar.' : 
            'I don\'t have that information available.'}"

RESPOND IN ${isIcelandic ? 'ICELANDIC' : 'ENGLISH'}.`;

        // Get GPT response
        const completion = await openai.chat.completions.create({
            model: "gpt-4-1106-preview",
            messages: [
                { 
                    role: "system", 
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: `Knowledge Base Information: ${JSON.stringify(knowledgeBaseResults)}
                    
                    User Question: ${userMessage}
                    
                    Please provide a natural, conversational response using ONLY the information from the knowledge base.`
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const response = completion.choices[0].message.content;
        console.log('\n🤖 GPT Response:', response);

        // Return simple response format for web chat
        return res.status(200).json({
            message: response
        });

    } catch (error) {
        console.error('\n❌ Error:', error);
        return res.status(500).json({
            error: "I apologize, but I'm having trouble processing your request right now. Could you please try again?"
        });
    }
});

// Start server
const PORT = config.PORT;
const server = app.listen(PORT, () => {
    console.log('\n🚀 Server Status:');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Port: ${PORT}`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log('\n⚙️ Configuration:');
    console.log(`OpenAI API Key configured: ${!!config.OPENAI_API_KEY}`);
    console.log(`API Key configured: ${!!config.API_KEY}`);
});

// Error handling for server startup
server.on('error', (error) => {
    console.error('\n❌ Server failed to start:', error);
    process.exit(1);
});