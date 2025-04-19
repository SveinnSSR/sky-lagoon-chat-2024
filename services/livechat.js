// services/livechat.js - Truly AI-powered LiveChat integration
import fetch from 'node-fetch';
import OpenAI from 'openai';

// Initialize OpenAI for AI-powered detection
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Optional debugging line to verify API key is available
console.log('OpenAI API Key available in livechat.js:', !!process.env.OPENAI_API_KEY);

// LiveChat credentials - kept from the original
const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e';
const PAT = 'fra:rmSYYwBm3t_PdcnJIOfQf2aQuJc';

// Bot credentials - kept from the original
const BOT_ID = '702cdd1781c4bb131db4f56bd57db913';
const BOT_SECRET = '600d0b708538d7c0e2a52a2b84c7b5b8';
const CLIENT_ID = 'b4c686ea4c4caa04e6ea921bf45f516f';
const CLIENT_SECRET = 'ca6020736f61d29b88bc130ca9e7240f4eb15d6f';

// Agent and group configurations - kept from the original
const LIVECHAT_AGENTS = [
    'david@svorumstrax.is',
    'bryndis@svorumstrax.is',
    'elma.j@svorumstrax.is',
    'oddny@svorumstrax.is',
    'thordis@svorumstrax.is'
];

const SKY_LAGOON_GROUPS = {
    EN: 69,
    IS: 70,
    urls: {
        69: 'https://www.skylagoon.com/',
        70: 'https://www.skylagoon.com/is/'
    },
    names: {
        69: 'Sky Lagoon',
        70: 'Sky Lagoon IS'
    }
};

/**
 * Checks agent availability in LiveChat
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Availability status and agent information
 */
export async function checkAgentAvailability(isIcelandic = false) {
    try {
        const credentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        const groupId = isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN;

        const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_routing_statuses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                filters: {
                    group_ids: [SKY_LAGOON_GROUPS.EN, SKY_LAGOON_GROUPS.IS]
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('\n👥 Agent statuses:', JSON.stringify(data, null, 2));
        
        // Consider any non-offline agent as available
        const availableAgents = data.filter(agent => 
            agent.status !== 'offline' &&
            LIVECHAT_AGENTS.includes(agent.agent_id)
        );

        // Add the hardcoded agent if none found
        if (availableAgents.length === 0) {
            console.log('\n👤 Using default agent: david@svorumstrax.is');
            availableAgents.push({
                agent_id: 'david@svorumstrax.is',
                status: 'online'
            });
        }

        return {
            areAgentsAvailable: availableAgents.length > 0,
            availableAgents: availableAgents,
            agentCount: availableAgents.length,
            groupId: groupId
        };

    } catch (error) {
        console.error('Error checking agent status:', error.message);
        // IMPORTANT: Return hardcoded agent even if check fails
        return {
            areAgentsAvailable: true,
            availableAgents: [{
                agent_id: 'david@svorumstrax.is',
                status: 'online'
            }],
            agentCount: 1,
            error: error.message
        };
    }
}

/**
 * Creates a LiveChat chat using bot
 * @param {string} customerId - Customer ID (session ID)
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Chat information
 */
export async function createChat(customerId, isIcelandic = false) {
    try {
        console.log('\n🤖 Getting bot token...');
        
        // Step 1: Get a bot token
        const tokenResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/issue_bot_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                bot_id: BOT_ID,
                bot_secret: BOT_SECRET,
                client_id: CLIENT_ID,
                organization_id: "10d9b2c9-311a-41b4-94ae-b0c4562d7737"
            })
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('\n❌ Bot token error:', errorText);
            throw new Error('Failed to get bot token');
        }

        const tokenData = await tokenResponse.json();
        const botToken = tokenData.token;
        console.log('\n✅ Bot token acquired');
        
        // Step 2: Bot creates a chat
        console.log('\n🤖 Bot creating chat...');
        const groupId = isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN;
        
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                active: true, // Explicitly make this active
                continuous: true, // Critical to prevent auto-closing
                group_id: groupId,
                customers: [{
                    id: customerId,
                    name: `User ${customerId}`,
                    email: `${customerId}@skylagoon.com`
                }],
                properties: {
                    source: {
                        type: "other"
                    }
                }
            })
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('\n❌ Chat creation error:', errorText);
            throw new Error('Failed to create chat');
        }

        const chatData = await chatResponse.json();
        console.log('\n✅ Chat created with details:', chatData);
        
        // Step 3: Send initial message via bot (while we still have permission)
        console.log('\n🤖 Bot sending initial message...');
        await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                event: {
                    type: 'message',
                    text: 'Customer requesting assistance with booking change',
                    visibility: 'all'
                }
            })
        });
        
        // Step 4: Transfer chat to appropriate group - THIS IS THE KEY STEP FOR PROPER GROUP ASSIGNMENT
        console.log('\n🤖 Transferring chat to group:', groupId);
        const transferResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/transfer_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: chatData.chat_id,
                target: {
                    type: "group",
                    ids: [groupId]
                }
            })
        });

        // Check transfer response
        const transferText = await transferResponse.text();
        console.log('\n📡 Transfer response:', transferText);

        if (!transferResponse.ok) {
            console.error('\n❌ Transfer failed:', transferText);
        }
        
        // Save agent credentials for fallback message sending
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        return {
            chat_id: chatData.chat_id,
            bot_token: botToken,
            agent_credentials: agentCredentials
        };
    } catch (error) {
        console.error('\n❌ Error in createChat:', error);
        throw error;
    }
}

/**
 * True AI-powered function to detect booking change requests
 * Uses language model classification instead of pattern matching
 * 
 * @param {string} message - User message
 * @param {Object} languageDecision - Language detection information
 * @param {Object} context - Conversation context
 * @returns {Promise<Object>} Detection result with confidence score and reasoning
 */
export async function detectBookingChangeRequest(message, languageDecision, context = null) {
    try {
        console.log('\n🧠 AI-powered booking change detection for:', message);
        
        // Build content prompt for the language model
        let contentPrompt = "Analyze this customer message and determine if it's a booking change request:";
        
        // Add language context if available
        if (languageDecision) {
            contentPrompt += ` (Message language: ${languageDecision.isIcelandic ? 'Icelandic' : 'English'})`;
        }
        
        // Add conversation context if available
        let contextMessages = "";
        if (context && context.messages && context.messages.length > 0) {
            // Extract the last few messages for context (limited to prevent prompt overflow)
            const recentMessages = context.messages.slice(-4);
            
            contextMessages = "\n\nPrevious conversation:\n";
            
            recentMessages.forEach(msg => {
                if (msg.role === 'user') {
                    contextMessages += `Customer: ${msg.content}\n`;
                } else if (msg.role === 'assistant') {
                    contextMessages += `Bot: ${msg.content}\n`;
                }
            });
            
            // Add booking context if available
            if (context.bookingContext) {
                contextMessages += "\nRelevant context: ";
                
                if (context.bookingContext.hasBookingIntent) {
                    contextMessages += "Customer has previously shown booking intent. ";
                }
                
                if (context.bookingContext.dates && context.bookingContext.dates.length > 0) {
                    contextMessages += `Customer has mentioned these dates: ${context.bookingContext.dates.join(', ')}. `;
                }
                
                if (context.bookingContext.dateModifications && context.bookingContext.dateModifications.length > 0) {
                    contextMessages += "Customer has tried to modify dates before. ";
                }
                
                if (context.lastTopic) {
                    contextMessages += `Last topic discussed: ${context.lastTopic}.`;
                }
            }
        }
        
        // Construct the full AI prompt
        const fullPrompt = `${contentPrompt}
        
${contextMessages}

Customer message: "${message}"

I need to determine if the customer is requesting to change an existing booking. This includes:
- Explicit requests to change/modify a booking date or time
- Requests to reschedule an existing reservation
- Messages indicating they can't make their current booking time
- Messages stating they need to move their booking to a different date/time

This should NOT include:
- Questions about different package options
- Queries about pricing differences
- Questions about cancellation or refund policies
- Hypothetical questions about what happens if they need to change in the future
- Policy questions like "Can I change my booking if needed?"

Please analyze the message and respond with:
1. A classification (YES if it's a booking change request, NO if it's not)
2. The confidence level (LOW, MEDIUM, HIGH)
3. Brief reasoning for this decision

Format your response exactly like this example:
CLASSIFICATION: YES
CONFIDENCE: HIGH
REASONING: The customer explicitly asked to change their booking from Tuesday to Thursday.`;

        // Make the API call to OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview", // Using the latest available model
            messages: [
                { role: "system", content: "You are an assistant that specializes in analyzing customer messages. You focus solely on analyzing the intent of the customer message, not on generating responses. Keep your analysis factual and to the point." },
                { role: "user", content: fullPrompt }
            ],
            temperature: 0.1, // Using low temperature for more consistent results
            max_tokens: 150 // Limited tokens since we only need the analysis
        });
        
        // Extract and parse the response
        const aiResponse = response.choices[0].message.content.trim();
        
        // Log the full AI response for debugging
        console.log('\n🤖 AI Analysis:', aiResponse);
        
        // Parse the structured response
        const classification = aiResponse.match(/CLASSIFICATION:\s*(YES|NO)/i)?.[1].toUpperCase();
        const confidence = aiResponse.match(/CONFIDENCE:\s*(LOW|MEDIUM|HIGH)/i)?.[1].toUpperCase();
        const reasoning = aiResponse.match(/REASONING:\s*(.+)$/i)?.[1];
        
        // Convert to confidence score
        let confidenceScore = 0;
        switch (confidence) {
            case 'HIGH': confidenceScore = 0.9; break;
            case 'MEDIUM': confidenceScore = 0.7; break;
            case 'LOW': confidenceScore = 0.4; break;
            default: confidenceScore = 0.5; // Default if parsing fails
        }
        
        // Final decision
        const shouldShowForm = classification === 'YES' && confidenceScore >= 0.6;
        
        // Log the decision
        console.log('\n📊 AI-powered booking change detection result:', {
            classification,
            confidenceScore,
            shouldShowForm,
            reasoning
        });
        
        return {
            shouldShowForm,
            confidence: confidenceScore,
            reasoning: reasoning || 'No reasoning provided',
            isWithinAgentHours: true // This should be determined elsewhere
        };
    } catch (error) {
        console.error('\n❌ Error in AI booking change detection:', error);
        
        // Fallback to a basic heuristic detection if AI fails
        const bookingChangeTerms = ['change', 'modify', 'reschedule', 'move', 'switch', 'different', 'another'];
        const bookingTerms = ['booking', 'reservation', 'time', 'date', 'appointment'];
        
        const msg = message.toLowerCase();
        
        // Count matching terms
        let bookingChangeCount = 0;
        let bookingCount = 0;
        
        bookingChangeTerms.forEach(term => {
            if (msg.includes(term)) bookingChangeCount++;
        });
        
        bookingTerms.forEach(term => {
            if (msg.includes(term)) bookingCount++;
        });
        
        // Simple heuristic for fallback
        const fallbackConfidence = (bookingChangeCount * 0.2) + (bookingCount * 0.1);
        const shouldShowForm = fallbackConfidence >= 0.3;
        
        console.log('\n⚠️ Using fallback detection due to AI error:', {
            fallbackConfidence,
            shouldShowForm,
            bookingChangeCount,
            bookingCount
        });
        
        return {
            shouldShowForm,
            confidence: fallbackConfidence,
            reasoning: 'Fallback detection due to AI error',
            isWithinAgentHours: true,
            error: error.message
        };
    }
}

/**
 * Create booking change request chat
 * @param {string} customerId - Customer ID (session ID)
 * @param {boolean} isIcelandic - Whether to use Icelandic 
 * @returns {Promise<Object>} Chat data
 */
export async function createBookingChangeRequest(customerId, isIcelandic = false) {
    try {
        console.log('\n🤖 Getting bot token for booking change request...');
        
        // Step 1: Get a bot token
        const tokenResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/issue_bot_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                bot_id: BOT_ID,
                bot_secret: BOT_SECRET,
                client_id: CLIENT_ID,
                organization_id: "10d9b2c9-311a-41b4-94ae-b0c4562d7737"
            })
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('\n❌ Bot token error:', errorText);
            throw new Error('Failed to get bot token');
        }

        const tokenData = await tokenResponse.json();
        const botToken = tokenData.token;
        console.log('\n✅ Bot token acquired');
        
        // Step 2: Bot creates a chat
        console.log('\n🤖 Bot creating booking request chat...');
        const groupId = isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN;
        
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                active: true, // Explicitly make this active
                continuous: true, // Critical to prevent auto-closing
                group_id: groupId,
                customers: [{
                    id: customerId,
                    name: `User ${customerId}`,
                    email: `${customerId}@skylagoon.com`
                }],
                properties: {
                    source: {
                        type: "other"
                    }
                }
            })
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('\n❌ Chat creation error:', errorText);
            throw new Error('Failed to create chat');
        }

        const chatData = await chatResponse.json();
        console.log('\n✅ Chat created with details:', chatData);
        
        // Step 3: Send initial message via bot (while we still have permission)
        console.log('\n🤖 Bot sending initial booking change request message...');
        await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                event: {
                    type: 'message',
                    text: '⚠️ BOOKING CHANGE REQUEST - Customer will provide details via form',
                    visibility: 'all'
                }
            })
        });
        
        // Step 4: Transfer chat to appropriate group
        console.log('\n🤖 Transferring booking request to group:', groupId);
        const transferResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/transfer_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: chatData.chat_id,
                target: {
                    type: "group",
                    ids: [groupId]
                }
            })
        });

        // Check transfer response
        const transferText = await transferResponse.text();
        console.log('\n📡 Transfer response:', transferText);

        // Handle expected transfer scenarios specially 
        if (!transferResponse.ok) {
            // Parse the response to check for this specific expected case
            try {
                const errorData = JSON.parse(transferText);
                if (errorData.error?.type === "validation" && 
                    errorData.error?.message === "Cannot assign any agent from requested groups") {
                    // Log as info instead of error since this is expected in async mode
                    console.log('\nℹ️ No agents currently online in group. Continuing with async workflow.');
                } else {
                    // Different error, log as actual error
                    console.error('\n❌ Transfer failed:', transferText);
                }
            } catch (e) {
                // If parsing fails, log original error
                console.error('\n❌ Transfer failed:', transferText);
            }
        }
        
        // Save agent credentials for fallback message sending
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        return {
            chat_id: chatData.chat_id,
            bot_token: botToken,
            agent_credentials: agentCredentials
        };
    } catch (error) {
        console.error('\n❌ Error in createBookingChangeRequest:', error);
        throw error;
    }
}

/**
 * Submits booking change form data to LiveChat
 * @param {string} chatId - LiveChat chat ID 
 * @param {Object} formData - Form data from user
 * @param {string} credentials - Auth credentials
 * @returns {Promise<boolean>} Success status
 */
export async function submitBookingChangeRequest(chatId, formData, credentials) {
    try {
        // Format the form data into a structured message
        const formattedMessage = `
📅 BOOKING CHANGE REQUEST DETAILS:
-----------------------------------
Reference: ${formData.bookingRef || formData.reference || 'Not provided'}
Name: ${formData.fullName || formData.name || 'Not provided'}
Email: ${formData.email || 'Not provided'}
Current Date: ${formData.currentDate || 'Not provided'}
Requested Date: ${formData.requestedDate || 'Not provided'}
Additional Info: ${(formData.additionalInfo || 'None provided').replace(/\n/g, ' ')}
-----------------------------------
⚠️ REQUIRES MANUAL REVIEW - Please contact customer via email
`.trim();
        
        // First try using bot token if it looks like a JWT
        if (credentials && credentials.includes('.')) {
            console.log('\n📨 Trying to send booking form data using bot token...');
            try {
                const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${credentials}`,
                        'X-Region': 'fra'
                    },
                    body: JSON.stringify({
                        chat_id: chatId,
                        event: {
                            type: 'message',
                            text: formattedMessage,
                            visibility: 'all'
                        }
                    })
                });
                
                if (response.ok) {
                    console.log('\n✅ Booking form data sent with bot token');
                    // Immediately try to add a tag
                    try {
                        await fetch('https://api.livechatinc.com/v3.5/agent/action/tag_chat', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${credentials}`,
                                'X-Region': 'fra'
                            },
                            body: JSON.stringify({
                                chat_id: chatId,
                                tag: "booking_change_request"
                            })
                        });
                        console.log('\n✅ Added booking_change_request tag with bot token');
                    } catch (tagError) {
                        console.error('\n⚠️ Failed to add tag with bot token:', tagError);
                        // Continue even if tagging fails
                    }
                    return true;
                }
                
                const errorText = await response.text();
                console.log('\n⚠️ Bot token failed for booking data:', errorText);
            } catch (error) {
                console.log('\n⚠️ Bot token failed for booking data:', error.message);
            }
        }
        
        // Fallback to agent credentials
        console.log('\n📨 Using agent credentials to send booking form data...');
        
        // Get agent credentials - either from params or generate fresh ones
        const agentCreds = credentials && !credentials.includes('.') 
            ? credentials 
            : Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCreds}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatId,
                event: {
                    type: 'message',
                    text: formattedMessage,
                    visibility: 'all'
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Send booking form data error response:', errorText);
            throw new Error(`Send booking form data failed: ${response.status}`);
        }

        console.log('\n✅ Booking form data sent with agent credentials');
        
        // Also add a tag to the chat to identify it as a booking change request
        try {
            await fetch('https://api.livechatinc.com/v3.5/agent/action/tag_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${agentCreds}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    tag: "booking_change_request"
                })
            });
            console.log('\n✅ Added booking_change_request tag to chat');
        } catch (tagError) {
            console.error('\n⚠️ Failed to add tag to chat:', tagError);
            // Continue even if tagging fails
        }
        
        return true;
    } catch (error) {
        console.error('\n❌ Error sending booking change data to LiveChat:', error);
        return false;
    }
}

/**
 * Send message to LiveChat with fallback
 * @param {string} chatId - LiveChat chat ID
 * @param {string} message - Message to send
 * @param {string} credentials - Auth credentials
 * @returns {Promise<boolean>} Success status
 */
export async function sendMessageToLiveChat(chatId, message, credentials) {
    try {
        // First try using bot token if it looks like a JWT (contains periods)
        if (credentials && credentials.includes('.')) {
            console.log('\n📨 Trying to send message using bot token...');
            try {
                const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${credentials}`,
                        'X-Region': 'fra'
                    },
                    body: JSON.stringify({
                        chat_id: chatId,
                        event: {
                            type: 'message',
                            text: message,
                            visibility: 'all'
                        }
                    })
                });
                
                if (response.ok) {
                    console.log('\n✅ Message sent with bot token');
                    return true;
                }
                
                const errorText = await response.text();
                console.log('\n⚠️ Bot token failed:', errorText);
            } catch (error) {
                console.log('\n⚠️ Bot token failed:', error.message);
            }
        }
        
        // Fallback to agent credentials
        console.log('\n📨 Using agent credentials to send message...');
        
        // Get agent credentials - either from params or generate fresh ones
        const agentCreds = credentials && !credentials.includes('.') 
            ? credentials 
            : Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCreds}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatId,
                event: {
                    type: 'message',
                    text: message,
                    visibility: 'all'
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Send message error response:', errorText);
            throw new Error(`Send message failed: ${response.status}`);
        }

        console.log('\n✅ Message sent with agent credentials');
        return true;
    } catch (error) {
        console.error('\n❌ Error sending message to LiveChat:', error);
        return false;
    }
}

/**
 * True AI-powered function to determine if a chat should be transferred to a human agent
 * Uses language model classification for human-like understanding
 * 
 * @param {string} message - User message
 * @param {Object} languageDecision - Language detection information
 * @param {Object} context - Conversation context
 * @returns {Promise<Object>} Detection result with confidence score and reasoning
 */
export async function shouldTransferToHumanAgent(message, languageDecision, context) {
    try {
        console.log('\n🧠 AI agent transfer detection for:', message);
        
        // Build system prompt for AI
        const systemPrompt = "You are an assistant that specializes in analyzing customer service conversations. Your task is to determine when a customer should be transferred to a human agent. Focus solely on analyzing the customer's message and context, not on generating responses.";
        
        // Build user prompt with message and context
        let userPrompt = "Analyze this customer message and determine if they should be transferred to a human agent:";
        
        // Add language context
        if (languageDecision) {
            userPrompt += ` (Message language: ${languageDecision.isIcelandic ? 'Icelandic' : 'English'})`;
        }
        
        // Add conversation context if available
        if (context && context.messages && context.messages.length > 0) {
            // Extract the last few messages for context
            const recentMessages = context.messages.slice(-4);
            
            userPrompt += "\n\nPrevious conversation:\n";
            
            recentMessages.forEach(msg => {
                if (msg.role === 'user') {
                    userPrompt += `Customer: ${msg.content}\n`;
                } else if (msg.role === 'assistant') {
                    userPrompt += `Bot: ${msg.content}\n`;
                }
            });
            
            // Add additional context
            if (context.lastTopic) {
                userPrompt += `\nLast topic discussed: ${context.lastTopic}`;
            }
            
            // Add frustration indicators if available
            const userMessages = context.messages.filter(m => m.role === 'user');
            const repeatCount = userMessages.length >= 3 ? 
                new Set(userMessages.slice(-3).map(m => m.content)).size : 0;
                
            if (repeatCount === 1) {
                userPrompt += "\nNote: Customer has repeated the same message multiple times.";
            }
        }
        
        // Add the customer message
        userPrompt += `\n\nCustomer message: "${message}"`;
        
        // Add decision criteria
        userPrompt += `\n\nTransfer to a human agent if the customer:
1. Explicitly requests to speak with a human agent/representative/person
2. Shows clear signs of frustration with the automated service
3. Has repeated the same question multiple times without satisfaction
4. Has a complex issue that requires human judgment
5. Is using emotional language indicating dissatisfaction
6. Has a time-sensitive or urgent matter
7. Has a technical issue that can't be resolved through standard procedures

Do NOT transfer if the customer:
1. Is asking simple informational questions
2. Is just browsing options or prices
3. Is making general comments or chitchat
4. Can be adequately helped by automated systems
5. Is not showing any signs of frustration or urgency

Analyze the message carefully and respond with:
1. A classification (YES if they should be transferred, NO if not)
2. The confidence level (LOW, MEDIUM, HIGH)
3. The primary reason for this decision

Format your response exactly like this example:
CLASSIFICATION: YES
CONFIDENCE: HIGH
REASON: The customer explicitly asked to speak with a human agent.`;

        // Make the API call to OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview", // Using the latest available model
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.1, // Using low temperature for more consistent results
            max_tokens: 150 // Limited tokens since we only need the analysis
        });
        
        // Extract and parse the response
        const aiResponse = response.choices[0].message.content.trim();
        
        // Log the full AI response for debugging
        console.log('\n🤖 AI Analysis:', aiResponse);
        
        // Parse the structured response
        const classification = aiResponse.match(/CLASSIFICATION:\s*(YES|NO)/i)?.[1].toUpperCase();
        const confidence = aiResponse.match(/CONFIDENCE:\s*(LOW|MEDIUM|HIGH)/i)?.[1].toUpperCase();
        const reason = aiResponse.match(/REASON:\s*(.+)$/i)?.[1];
        
        // Convert to confidence score
        let confidenceScore = 0;
        switch (confidence) {
            case 'HIGH': confidenceScore = 0.9; break;
            case 'MEDIUM': confidenceScore = 0.7; break;
            case 'LOW': confidenceScore = 0.4; break;
            default: confidenceScore = 0.5; // Default if parsing fails
        }
        
        // Final decision
        const shouldTransfer = classification === 'YES' && confidenceScore >= 0.6;
        
        // Log the decision
        console.log('\n👥 Agent transfer detection analysis:', {
            classification,
            confidenceScore,
            shouldTransfer,
            reason
        });
        
        // Check if any agents are available (for convenience)
        let availableAgents = [];
        try {
            const agentCheck = await checkAgentAvailability(languageDecision.isIcelandic);
            availableAgents = agentCheck.availableAgents || [];
        } catch (error) {
            console.error('Error checking agent availability:', error);
        }
        
        // Return the final decision
        return {
            shouldTransfer,
            confidence: confidenceScore,
            reason: reason || 'Unknown reason',
            agents: availableAgents
        };
    } catch (error) {
        console.error('\n❌ Error in AI agent transfer detection:', error);
        
        // Fallback to a very basic heuristic in case of error
        const msg = message.toLowerCase();
        const directTerms = ['human', 'agent', 'person', 'representative', 'real person', 'speak to'];
        const frustrationTerms = ['not helpful', 'frustrating', 'annoying', 'waste of time', 'stupid'];
        
        // Count matches
        let directCount = 0;
        let frustrationCount = 0;
        
        directTerms.forEach(term => {
            if (msg.includes(term)) directCount++;
        });
        
        frustrationTerms.forEach(term => {
            if (msg.includes(term)) frustrationCount++;
        });
        
        // Simple heuristic
        const shouldTransfer = directCount >= 1 || frustrationCount >= 1;
        const confidence = directCount >= 1 ? 0.8 : (frustrationCount >= 1 ? 0.6 : 0.2);
        
        console.log('\n⚠️ Using fallback detection due to AI error:', {
            shouldTransfer,
            confidence,
            directCount,
            frustrationCount
        });
        
        return {
            shouldTransfer,
            confidence,
            reason: 'Fallback detection due to AI error',
            error: error.message
        };
    }
}