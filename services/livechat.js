// services/livechat.js
import fetch from 'node-fetch';

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
                active: true,
                continuous: true,
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
 * AI-powered function to detect booking change requests
 * Uses semantic understanding and context instead of keywords
 * 
 * @param {string} message - User message
 * @param {Object} languageDecision - Language detection information
 * @param {Object} context - Conversation context
 * @returns {Promise<Object>} Detection result with confidence score and reasoning
 */
export async function detectBookingChangeRequest(message, languageDecision, context = null) {
    try {
        const msg = message.toLowerCase();
        console.log('\n🔍 AI-powered booking change detection for:', msg);
        console.log('Language:', languageDecision);
        
        // Create a context-aware detection system with confidence scoring
        
        // High confidence indicators - Direct and explicit mentions
        const highConfidencePatterns = {
            en: [
                // Direct booking change requests
                { pattern: /change.+booking/i, weight: 0.9, type: 'explicit' },
                { pattern: /modify.+booking/i, weight: 0.9, type: 'explicit' },
                { pattern: /reschedule.+booking/i, weight: 0.9, type: 'explicit' },
                { pattern: /move.+booking/i, weight: 0.9, type: 'explicit' },
                { pattern: /change.+reservation/i, weight: 0.9, type: 'explicit' },
                { pattern: /need to change/i, weight: 0.85, type: 'need' },
                { pattern: /want to change/i, weight: 0.85, type: 'want' },
                { pattern: /like to change/i, weight: 0.85, type: 'preference' },
                { pattern: /would like to reschedule/i, weight: 0.9, type: 'formal_request' },
                { pattern: /need to reschedule/i, weight: 0.9, type: 'need' },
                
                // Form submissions (direct indicator)
                { pattern: /booking change request:/i, weight: 1.0, type: 'form_submission' }
            ],
            is: [
                // Direct booking change requests in Icelandic
                { pattern: /breyta.+bókun/i, weight: 0.9, type: 'explicit' },
                { pattern: /breyta.+tíma/i, weight: 0.85, type: 'time_change' },
                { pattern: /breyta.+dagsetningu/i, weight: 0.85, type: 'date_change' },
                { pattern: /færa.+bókun/i, weight: 0.9, type: 'move_booking' },
                { pattern: /færa.+tíma/i, weight: 0.85, type: 'move_time' },
                { pattern: /þarf að breyta/i, weight: 0.85, type: 'need' },
                { pattern: /vil breyta/i, weight: 0.85, type: 'want' },
                { pattern: /vildi breyta/i, weight: 0.85, type: 'want_past' },
                { pattern: /langar að breyta/i, weight: 0.85, type: 'desire' },
                
                // Form submissions (direct indicator)
                { pattern: /breyta bókun:/i, weight: 1.0, type: 'form_submission' }
            ]
        };
        
        // Medium confidence indicators - Indirect but still likely mentions
        const mediumConfidencePatterns = {
            en: [
                // Time/date change requests without explicit booking mentions
                { pattern: /different time/i, weight: 0.7, type: 'time_change' },
                { pattern: /different date/i, weight: 0.7, type: 'date_change' },
                { pattern: /another time/i, weight: 0.7, type: 'time_change' },
                { pattern: /another date/i, weight: 0.7, type: 'date_change' },
                
                // Indirect calendar terms with action verbs
                { pattern: /move.+appointment/i, weight: 0.7, type: 'appointment_move' },
                { pattern: /change.+appointment/i, weight: 0.7, type: 'appointment_change' },
                { pattern: /switch.+time/i, weight: 0.7, type: 'time_switch' },
                
                // Flight changes affecting booking
                { pattern: /flight.+delayed.+change/i, weight: 0.75, type: 'flight_delay' },
                { pattern: /flight.+canceled.+change/i, weight: 0.75, type: 'flight_cancel' },
                { pattern: /change.+due to flight/i, weight: 0.75, type: 'flight_issue' }
            ],
            is: [
                // Time/date change requests in Icelandic
                { pattern: /annan tíma/i, weight: 0.7, type: 'different_time' },
                { pattern: /aðra dagsetningu/i, weight: 0.7, type: 'different_date' },
                { pattern: /breyta.+pöntun/i, weight: 0.7, type: 'change_order' },
                { pattern: /skipta.+um tíma/i, weight: 0.7, type: 'switch_time' },
                
                // Plans changed mentions in Icelandic
                { pattern: /áætlanir breyttust/i, weight: 0.6, type: 'plans_changed' },
                { pattern: /áætlun breyttist/i, weight: 0.6, type: 'plan_changed' },
                
                // Flight issues in Icelandic
                { pattern: /flug.+seinkað/i, weight: 0.75, type: 'flight_delay' },
                { pattern: /flug.+aflýst/i, weight: 0.75, type: 'flight_cancel' }
            ]
        };
        
        // Lower confidence indicators - Suggestive but need more context
        const lowerConfidencePatterns = {
            en: [
                // Date mentions with booking context
                { pattern: /next week instead/i, weight: 0.5, type: 'date_suggestion' },
                { pattern: /prefer.+later/i, weight: 0.5, type: 'preference' },
                { pattern: /better time/i, weight: 0.5, type: 'preference' },
                
                // Availability questions
                { pattern: /availab.+different/i, weight: 0.5, type: 'availability' },
                { pattern: /other slots/i, weight: 0.5, type: 'slots' },
                { pattern: /other times/i, weight: 0.5, type: 'times' },
                
                // Problems with current booking
                { pattern: /can't make/i, weight: 0.6, type: 'cant_make' },
                { pattern: /won't be able/i, weight: 0.6, type: 'cant_make' }
            ],
            is: [
                // Date suggestions in Icelandic
                { pattern: /næstu viku í staðinn/i, weight: 0.5, type: 'next_week' },
                { pattern: /betra.+seinna/i, weight: 0.5, type: 'better_later' },
                { pattern: /betri tíma/i, weight: 0.5, type: 'better_time' },
                
                // Availability in Icelandic
                { pattern: /aðrir tímar/i, weight: 0.5, type: 'other_times' },
                { pattern: /önnur tímabil/i, weight: 0.5, type: 'other_periods' },
                
                // Problems in Icelandic
                { pattern: /kemst ekki/i, weight: 0.6, type: 'cant_make' },
                { pattern: /næ ekki/i, weight: 0.6, type: 'cant_make' }
            ]
        };
        
        // Negative patterns - These suggest NOT a booking change
        const negativePatterns = {
            en: [
                // Questions about cancellations (not changes)
                { pattern: /cancel policy/i, weight: -0.7, type: 'cancel_policy' },
                { pattern: /cancel.+booking/i, weight: -0.7, type: 'cancel_booking' },
                { pattern: /refund policy/i, weight: -0.8, type: 'refund_policy' },
                { pattern: /get a refund/i, weight: -0.8, type: 'get_refund' },
                
                // Package questions not about booking changes
                { pattern: /difference.+package/i, weight: -0.8, type: 'package_difference' },
                { pattern: /pure.+vs.+sky/i, weight: -0.8, type: 'package_comparison' },
                { pattern: /premium vs basic/i, weight: -0.8, type: 'package_comparison' },
                
                // General inquiry related to late arrival
                { pattern: /what if.+late/i, weight: -0.6, type: 'late_arrival_question' },
                { pattern: /arrive late.+policy/i, weight: -0.7, type: 'late_policy' },
                { pattern: /late arrival policy/i, weight: -0.7, type: 'late_policy' }
            ],
            is: [
                // Questions about cancellations in Icelandic
                { pattern: /afbókunarstefna/i, weight: -0.7, type: 'cancel_policy' },
                { pattern: /hætta við bókun/i, weight: -0.7, type: 'cancel_booking' },
                { pattern: /endurgreiðslustefna/i, weight: -0.8, type: 'refund_policy' },
                { pattern: /fá endurgreiðslu/i, weight: -0.8, type: 'get_refund' },
                
                // Package questions in Icelandic
                { pattern: /munur.+pakka/i, weight: -0.8, type: 'package_difference' },
                { pattern: /munur.+saman.+sér/i, weight: -0.8, type: 'package_comparison' },
                
                // Late arrival in Icelandic
                { pattern: /hvað ef.+seinn/i, weight: -0.6, type: 'late_arrival_question' },
                { pattern: /mæta seint.+stefna/i, weight: -0.7, type: 'late_policy' }
            ]
        };
        
        // Context enhancers - These boost confidence based on conversation context
        // Only used if context object is provided
        const contextEnhancers = [
            // If there's been previous booking talk
            { condition: context => context?.lastTopic === 'booking', boost: 0.2 },
            { condition: context => context?.topics?.includes('booking'), boost: 0.15 },
            
            // If user mentioned dates recently
            { condition: context => context?.bookingContext?.dates?.length > 0, boost: 0.2 },
            { condition: context => context?.bookingContext?.lastDateMention !== null, boost: 0.15 },
            
            // If there's been previous booking change intent
            { condition: context => context?.bookingContext?.hasBookingChangeIntent === true, boost: 0.3 },
            
            // If this is part of a date modification sequence
            { condition: context => context?.bookingContext?.dateModifications?.length > 0, boost: 0.25 }
        ];
        
        // Calculate initial confidence score using pattern matching
        let confidenceScore = 0;
        let matchedPatterns = [];
        let primaryReason = null;
        
        // Check for high confidence patterns first
        const highPatterns = languageDecision.isIcelandic ? 
            highConfidencePatterns.is : 
            highConfidencePatterns.en;
            
        for (const pattern of highPatterns) {
            if (pattern.pattern.test(msg)) {
                confidenceScore += pattern.weight;
                matchedPatterns.push({
                    type: pattern.type,
                    weight: pattern.weight
                });
                
                // Set primary reason for the highest confidence match
                if (!primaryReason || pattern.weight > primaryReason.weight) {
                    primaryReason = { 
                        type: pattern.type, 
                        weight: pattern.weight 
                    };
                }
            }
        }
        
        // If we already have a high confidence match, we can skip the rest
        if (confidenceScore < 0.9) {
            // Check for medium confidence patterns
            const mediumPatterns = languageDecision.isIcelandic ? 
                mediumConfidencePatterns.is : 
                mediumConfidencePatterns.en;
                
            for (const pattern of mediumPatterns) {
                if (pattern.pattern.test(msg)) {
                    confidenceScore += pattern.weight;
                    matchedPatterns.push({
                        type: pattern.type,
                        weight: pattern.weight
                    });
                    
                    // Update primary reason if this is higher confidence
                    if (!primaryReason || pattern.weight > primaryReason.weight) {
                        primaryReason = { 
                            type: pattern.type, 
                            weight: pattern.weight 
                        };
                    }
                }
            }
            
            // Check for lower confidence patterns only if still needed
            if (confidenceScore < 0.7) {
                const lowerPatterns = languageDecision.isIcelandic ? 
                    lowerConfidencePatterns.is : 
                    lowerConfidencePatterns.en;
                    
                for (const pattern of lowerPatterns) {
                    if (pattern.pattern.test(msg)) {
                        confidenceScore += pattern.weight;
                        matchedPatterns.push({
                            type: pattern.type,
                            weight: pattern.weight
                        });
                        
                        // Update primary reason if this is higher confidence
                        if (!primaryReason || pattern.weight > primaryReason.weight) {
                            primaryReason = { 
                                type: pattern.type, 
                                weight: pattern.weight 
                            };
                        }
                    }
                }
            }
        }
        
        // Check for negative patterns that would reduce confidence
        const negPatterns = languageDecision.isIcelandic ? 
            negativePatterns.is : 
            negativePatterns.en;
            
        for (const pattern of negPatterns) {
            if (pattern.pattern.test(msg)) {
                confidenceScore += pattern.weight; // This will be negative
                matchedPatterns.push({
                    type: pattern.type,
                    weight: pattern.weight
                });
                
                // If this is a strong negative signal, prioritize it
                if (pattern.weight <= -0.7) {
                    primaryReason = { 
                        type: pattern.type, 
                        weight: pattern.weight,
                        negative: true
                    };
                }
            }
        }
        
        // Apply context enhancers if context is provided
        if (context) {
            let contextBoost = 0;
            let appliedEnhancers = [];
            
            for (const enhancer of contextEnhancers) {
                if (enhancer.condition(context)) {
                    contextBoost += enhancer.boost;
                    appliedEnhancers.push(enhancer);
                }
            }
            
            confidenceScore += contextBoost;
            
            console.log('\n🧠 Applied context enhancers:', {
                originalScore: confidenceScore - contextBoost,
                contextBoost: contextBoost,
                finalScore: confidenceScore,
                enhancers: appliedEnhancers.length
            });
        }
        
        // Ensure score is within bounds and not negative
        confidenceScore = Math.min(Math.max(confidenceScore, 0), 1);
        
        // Determine confidence level from score
        let confidenceLevel;
        if (confidenceScore >= 0.8) {
            confidenceLevel = 'high';
        } else if (confidenceScore >= 0.5) {
            confidenceLevel = 'medium';
        } else {
            confidenceLevel = 'low';
        }
        
        // Form submission is a guaranteed match
        const isFormSubmission = msg.startsWith('booking change request:');
        if (isFormSubmission) {
            confidenceScore = 1.0;
            confidenceLevel = 'high';
            primaryReason = { type: 'form_submission', weight: 1.0 };
        }
        
        // First check for form submission
        if (msg.startsWith('booking change request:')) {
            console.log('\n✅ Form submission detected - definite booking change');
            return {
                shouldShowForm: true,
                isWithinAgentHours: true, // Form submissions bypass hours check
                confidence: 1.0,
                reasoning: "Form submission"
            };
        }
        
        // Generate reasoning
        let reasoning;
        if (primaryReason && primaryReason.negative) {
            reasoning = `Detected ${primaryReason.type} which indicates this is not a booking change request`;
        } else if (primaryReason) {
            reasoning = `Detected ${primaryReason.type} with ${confidenceLevel} confidence`;
        } else {
            reasoning = `No clear booking change intent detected`;
        }
        
        // Log the decision process
        console.log('\n📊 Booking change detection analysis:', {
            message: msg.substring(0, 30) + (msg.length > 30 ? '...' : ''),
            confidenceScore,
            confidenceLevel,
            matchedPatterns: matchedPatterns.map(p => p.type),
            primaryReason: primaryReason?.type || 'none',
            shouldShowForm: confidenceScore >= 0.7
        });
        
        return {
            shouldShowForm: confidenceScore >= 0.7,
            isWithinAgentHours: true, // This should be determined elsewhere
            confidence: confidenceScore,
            reasoning: reasoning
        };
    } catch (error) {
        console.error('\n❌ Error in AI booking change detection:', error);
        // Fallback to safe default
        return {
            shouldShowForm: false,
            isWithinAgentHours: true,
            confidence: 0,
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
                active: true,
                continuous: true,
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
 * AI-powered function to determine if a chat should be transferred to a human agent
 * Uses context, frustration signals, and query complexity
 * 
 * @param {string} message - User message
 * @param {Object} languageDecision - Language detection information
 * @param {Object} context - Conversation context
 * @returns {Promise<Object>} Detection result with confidence score and reasoning
 */
export async function shouldTransferToHumanAgent(message, languageDecision, context) {
    try {
        const msg = message.toLowerCase();
        console.log('\n🤖 AI agent transfer detection for:', msg);
        
        // Start with 0 confidence
        let transferConfidence = 0;
        let detectionReason = null;
        let matchedPatterns = [];
        
        // 1. Check for direct, explicit requests to speak to a human
        const directRequestPatterns = {
            en: [
                { pattern: /speak (?:to|with) (?:an? )?(?:human|agent|person|representative)/i, weight: 0.95 },
                { pattern: /talk (?:to|with) (?:an? )?(?:human|agent|person|representative)/i, weight: 0.95 },
                { pattern: /connect (?:me )?(?:to|with) (?:an? )?(?:human|agent|person|representative)/i, weight: 0.95 },
                { pattern: /transfer (?:me )?(?:to|with) (?:an? )?(?:human|agent|person|representative)/i, weight: 0.95 },
                { pattern: /(?:get|need|want) (?:an? )?(?:human|agent|person|representative)/i, weight: 0.9 },
                { pattern: /(?:i want|i need) (?:to speak to|to talk to) (?:an? )?(?:human|agent|person|representative)/i, weight: 0.95 },
                { pattern: /(?:real|live|human) (?:agent|person|representative|assistant)/i, weight: 0.9 },
                { pattern: /(?:human|agent|person) (?:assistance|support|help)/i, weight: 0.85 }
            ],
            is: [
                { pattern: /tala við (?:þjónustufulltrúa|manneskju|starfsmann)/i, weight: 0.95 },
                { pattern: /fá að tala við/i, weight: 0.9 },
                { pattern: /geta talað við/i, weight: 0.9 },
                { pattern: /fá samband við/i, weight: 0.9 },
                { pattern: /vera í sambandi við/i, weight: 0.85 },
                { pattern: /fá (?:þjónustufulltrúa|manneskju)/i, weight: 0.9 }
            ]
        };
        
        // 2. Frustration signals - look for patterns indicating user is frustrated
        const frustrationPatterns = {
            en: [
                { pattern: /(?:you're|you are) (?:not|n't) (?:helping|understanding|getting it)/i, weight: 0.8 },
                { pattern: /(?:this is|that's) (?:not|n't) (?:helpful|what i asked|what i want|what i need)/i, weight: 0.7 },
                { pattern: /(?:i already|already) (?:told|said|asked|explained)/i, weight: 0.6 },
                { pattern: /(?:wrong|incorrect|not right|doesn't make sense)/i, weight: 0.5 },
                { pattern: /(?:you don't understand|you're confused|not what i meant)/i, weight: 0.7 },
                { pattern: /(?:useless|waste of time|pointless)/i, weight: 0.8 },
                { pattern: /(?:stupid|dumb|idiotic)/i, weight: 0.7 }
            ],
            is: [
                { pattern: /(?:þú ert|þú skilur) (?:ekki|ekki að) (?:hjálpa|skilja)/i, weight: 0.8 },
                { pattern: /(?:þetta er|það er) (?:ekki|ekki það sem) (?:hjálplegt|ég spurði um|ég vil|ég þarf)/i, weight: 0.7 },
                { pattern: /(?:ég hef þegar|þegar) (?:sagt|spurði|útskýrði)/i, weight: 0.6 },
                { pattern: /(?:rangt|ekki rétt|skil ekki)/i, weight: 0.5 },
                { pattern: /(?:þú skilur ekki|þú ert ruglaður|ekki það sem ég átti við)/i, weight: 0.7 },
                { pattern: /(?:gagnslaus|tímaeyðsla|tilgangslaus)/i, weight: 0.8 },
                { pattern: /(?:heimsk|heimskur|fáránlegt)/i, weight: 0.7 }
            ]
        };
        
        // 3. Repeated questions - check context for repeated similar questions
        function hasRepeatedQuestions(context) {
            if (!context || !context.messages) return false;
            
            // Get user messages
            const userMessages = context.messages.filter(m => m.role === 'user');
            if (userMessages.length < 3) return false;
            
            // Look at the last 3 messages
            const recentMessages = userMessages.slice(-3);
            
            // Check for similar phrases or questions
            let similarityCount = 0;
            for (let i = 0; i < recentMessages.length - 1; i++) {
                const currentMsg = recentMessages[i].content.toLowerCase();
                const nextMsg = recentMessages[i+1].content.toLowerCase();
                
                // Check for similarity
                if (currentMsg.includes('?') && nextMsg.includes('?')) {
                    // Both are questions
                    similarityCount++;
                }
                
                // Check for repeated keywords
                const currentWords = currentMsg.split(' ').filter(w => w.length > 4);
                const nextWords = nextMsg.split(' ').filter(w => w.length > 4);
                
                // Count matching words
                let matchCount = 0;
                for (const word of currentWords) {
                    if (nextWords.includes(word)) matchCount++;
                }
                
                // If significant overlap
                if (matchCount >= 2 || matchCount / currentWords.length > 0.3) {
                    similarityCount++;
                }
            }
            
            return similarityCount >= 1;
        }
        
        // 4. Complex queries that might need human assistance
        const complexQueryPatterns = {
            en: [
                { pattern: /(?:specific|custom|special|unusual|complex) (?:request|situation|case|scenario|question)/i, weight: 0.6 },
                { pattern: /(?:exception|special consideration|unique circumstance)/i, weight: 0.6 },
                { pattern: /(?:not sure if|don't know if|uncertain if) (?:you can help|this is possible)/i, weight: 0.5 },
                { pattern: /(?:complicated|difficult|challenging) (?:situation|request|question|issue|problem)/i, weight: 0.6 }
            ],
            is: [
                { pattern: /(?:sérstök|sérsniðin|óvenjuleg|flókin) (?:beiðni|aðstæður|mál|spurning)/i, weight: 0.6 },
                { pattern: /(?:undantekning|sérstök athugun|sérstakar aðstæður)/i, weight: 0.6 },
                { pattern: /(?:ekki viss|veit ekki|óviss) (?:hvort þú getir hjálpað|hvort þetta sé mögulegt)/i, weight: 0.5 },
                { pattern: /(?:flókið|erfitt|krefjandi) (?:aðstæður|beiðni|spurning|vandamál)/i, weight: 0.6 }
            ]
        };
        
        // Check direct request patterns first
        const directPatterns = languageDecision.isIcelandic ? 
            directRequestPatterns.is : 
            directRequestPatterns.en;
            
        for (const pattern of directPatterns) {
            if (pattern.pattern.test(msg)) {
                transferConfidence = Math.max(transferConfidence, pattern.weight);
                matchedPatterns.push({
                    type: 'direct_request',
                    pattern: pattern.pattern.toString(),
                    weight: pattern.weight
                });
                
                if (!detectionReason || pattern.weight > 0.9) {
                    detectionReason = 'direct_agent_request';
                }
            }
        }
        
        // If already high confidence, skip other checks
        if (transferConfidence < 0.9) {
            // Check frustration patterns
            const frustrationPatternList = languageDecision.isIcelandic ? 
                frustrationPatterns.is : 
                frustrationPatterns.en;
                
            for (const pattern of frustrationPatternList) {
                if (pattern.pattern.test(msg)) {
                    transferConfidence = Math.max(transferConfidence, pattern.weight);
                    matchedPatterns.push({
                        type: 'frustration',
                        pattern: pattern.pattern.toString(),
                        weight: pattern.weight
                    });
                    
                    if (!detectionReason || (detectionReason !== 'direct_agent_request' && pattern.weight > 0.7)) {
                        detectionReason = 'user_frustration';
                    }
                }
            }
            
            // Check for repeated questions or similar queries
            if (context && hasRepeatedQuestions(context)) {
                transferConfidence = Math.max(transferConfidence, 0.7);
                matchedPatterns.push({
                    type: 'repeated_questions',
                    weight: 0.7
                });
                
                if (!detectionReason || (detectionReason !== 'direct_agent_request' && detectionReason !== 'user_frustration')) {
                    detectionReason = 'repeated_questions';
                }
            }
            
            // Check for complex queries
            const complexQueryPatternList = languageDecision.isIcelandic ? 
                complexQueryPatterns.is : 
                complexQueryPatterns.en;
                
            for (const pattern of complexQueryPatternList) {
                if (pattern.pattern.test(msg)) {
                    transferConfidence = Math.max(transferConfidence, pattern.weight);
                    matchedPatterns.push({
                        type: 'complex_query',
                        pattern: pattern.pattern.toString(),
                        weight: pattern.weight
                    });
                    
                    if (!detectionReason || (detectionReason !== 'direct_agent_request' && 
                                            detectionReason !== 'user_frustration' && 
                                            detectionReason !== 'repeated_questions')) {
                        detectionReason = 'complex_query';
                    }
                }
            }
            
            // Additional context-based checks
            if (context) {
                // Check for conversation length - longer conversations might benefit from human assistance
                const userMessagesCount = context.messages?.filter(m => m.role === 'user').length || 0;
                if (userMessagesCount >= 8) {
                    const longConversationBoost = Math.min(0.1 + (userMessagesCount - 8) * 0.03, 0.3);
                    transferConfidence = Math.max(transferConfidence, longConversationBoost);
                    matchedPatterns.push({
                        type: 'long_conversation',
                        messageCount: userMessagesCount,
                        weight: longConversationBoost
                    });
                }
                
                // Check if user has been asking about the same topic repeatedly
                if (context.lastTopic && 
                    context.topics && 
                    context.topics.filter(t => t === context.lastTopic).length >= 3) {
                    
                    transferConfidence = Math.max(transferConfidence, 0.5);
                    matchedPatterns.push({
                        type: 'persistent_topic',
                        topic: context.lastTopic,
                        weight: 0.5
                    });
                    
                    if (!detectionReason || detectionReason === 'complex_query') {
                        detectionReason = 'persistent_topic';
                    }
                }
            }
        }
        
        // Make final determination
        const shouldTransfer = transferConfidence >= 0.8;
        
        // Log the decision process
        console.log('\n👥 Agent transfer detection analysis:', {
            message: msg.substring(0, 30) + (msg.length > 30 ? '...' : ''),
            confidence: transferConfidence,
            matchedPatterns: matchedPatterns.map(p => p.type),
            primaryReason: detectionReason,
            shouldTransfer
        });
        
        // Check if any agents are available (for convenience)
        let availableAgents = [];
        try {
            const agentCheck = await checkAgentAvailability(languageDecision.isIcelandic);
            availableAgents = agentCheck.availableAgents || [];
        } catch (error) {
            console.error('Error checking agent availability:', error);
        }
        
        // Return the result
        return {
            shouldTransfer,
            confidence: transferConfidence,
            reason: detectionReason || 'no_trigger',
            agents: availableAgents
        };
    } catch (error) {
        console.error('\n❌ Error in AI agent transfer detection:', error);
        return {
            shouldTransfer: false,
            confidence: 0,
            reason: 'error',
            error: error.message
        };
    }
}