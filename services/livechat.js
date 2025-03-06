// services/livechat.js
import fetch from 'node-fetch';

// LiveChat credentials
const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e';
const PAT = 'fra:rmSYYwBm3t_PdcnJIOfQf2aQuJc';

// Bot credentials
const BOT_ID = '702cdd1781c4bb131db4f56bd57db913';
const BOT_SECRET = '600d0b708538d7c0e2a52a2b84c7b5b8';
const CLIENT_ID = 'b4c686ea4c4caa04e6ea921bf45f516f';
const CLIENT_SECRET = 'ca6020736f61d29b88bc130ca9e7240f4eb15d6f';

// Agent and group configurations
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

// Booking change patterns for detection
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
        'cancel booking',
        // New stronger patterns
        'update booking',
        'alter booking',
        'shift booking',
        'postpone booking',
        'advance booking',
        'need to change',
        'want to change',
        'change my reservation',
        'edit booking',
        'adjust booking',
        'switch time',
        // Additional common patterns
        'like to change',
        'would like to change',
        'arrive later',
        'arrive earlier',
        'can\'t make it',
        'won\'t make it',
        'running late',
        'rebook',
        'too early',
        'too late'
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
        'afbóka',
        // New stronger patterns
        'uppfæra bókun',
        'fresta bókun',
        'flýta bókun',
        'þarf að breyta',
        'vil breyta',
        'breyta pöntun',
        'breyta pantanir',
        'aðlaga bókun',
        'skipta um tíma',
        // Additional common Icelandic patterns & variations
        'getur þú breytt',
        'getið þið breytt',
        'getum við breytt',
        'get ég breytt',
        'viljum breyta',
        'vildi breyta',
        'langar að breyta',
        'geta breytt',
        'vera seinn',
        'of snemmt',
        'of seint',
        'ekki tími',
        'ekki hægt',
        'breytingar á bókun',
        'aðrar dagsetningar',
        'breyta skráningu',
        'færa pantanir',
        'breytingu á bókun',
        'bókunarbreytingar',
        'bókunartíma',
        'komumst ekki',
        'verð ekki',
        'seinka ferðinni',
        'flýta ferðinni'
    ]
};

// Check agent availability
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

// Create chat function (new implementation using bot)
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

// Function to detect booking change requests with context-awareness and improved Icelandic support
export async function detectBookingChangeRequest(message, languageDecision) {
    try {
        const msg = message.toLowerCase();
        console.log('\n🔍 Analyzing message for booking change:', msg);
        console.log('Language decision:', languageDecision);
        
        // First check if this is a form submission (starts with "booking change request:")
        if (msg.startsWith('booking change request:')) {
            console.log('✅ Form submission detected');
            return true;
        }
        
        // FIX: Properly determine language - don't override Icelandic detection with confidence
        const isIcelandic = languageDecision.isIcelandic;
        
        console.log(`Using ${isIcelandic ? 'Icelandic' : 'English'} patterns for detection`);
        
        // Root words for more flexible matching in Icelandic
        const icelandicRootWords = [
            'bók', // For bókun, bókunin, bókuninni, bókunina, etc.
            'breyt', // For breyta, breyting, breytum, etc.
            'fær', // For færa, færum, etc.
            'flyt', // For flytja, flutning, etc.
            'fresta', // For fresta, frestun, etc.
            'aðr', // For annar, aðra, etc.
            'uppfær', // For uppfæra, uppfærslu, etc.
            'pönt', // For pöntun, pantanir, etc.
            'tím', // For tíma, tímann, etc.
            'dagsetn', // For dagsetning, dagsetninguna, etc.
            'skráning', // For skráningu, etc.
            'afbók', // For afbóka, afbókun, etc.
            'hætt', // For hætta
            'annan', // For annan tíma
            'aðra', // For aðra dagsetningu
            'seink', // For seinka, seinkun
        ];
        
        // Check for booking change request patterns using standard method
        const hasPatternMatch = (isIcelandic ? 
            BOOKING_CHANGE_PATTERNS.is : 
            BOOKING_CHANGE_PATTERNS.en).some(pattern => msg.includes(pattern));
            
        // NEW: For Icelandic, also check for root word matches to handle grammatical variations
        let hasRootMatch = false;
        if (isIcelandic) {
            hasRootMatch = icelandicRootWords.some(root => msg.includes(root));
            console.log('Root word match?', hasRootMatch);
        }
        
        // Also detect date-related patterns (improved for Icelandic date formats)
        const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{1,2}\.\d{1,2}\.\d{2,4}\b|\b\d{1,2}\s*\.\s*[a-zíáéúóþæðö]+\b/i;
        const hasDateMention = datePattern.test(msg);
        console.log('Date mention detected?', hasDateMention);

        // Look for change-related words near dates with added Icelandic words
        const changeNearDate = hasDateMention && (
            msg.includes('change') || 
            msg.includes('modify') || 
            msg.includes('reschedule') ||
            msg.includes('breyt') || // Root for various forms
            msg.includes('fær') ||   // Root for various forms
            msg.includes('flytj') || // Root for moving
            msg.includes('aðr') ||   // Root for 'other'
            msg.includes('nýj') ||   // Root for 'new'
            msg.includes('seink')    // Root for 'delay'
        );
        
        // Additional Icelandic phrase detection for common questions
        const hasCommonQuestion = isIcelandic && (
            msg.includes('get') && (msg.includes('breyt') || msg.includes('fær')) ||
            msg.includes('vilj') && (msg.includes('breyt') || msg.includes('fær')) ||
            msg.includes('hvernig') && (msg.includes('breyt') || msg.includes('fær')) ||
            msg.includes('er hægt að') && (msg.includes('breyt') || msg.includes('fær'))
        );
        
        // NEW: Context-aware booking change detection
        // Check for situations that typically imply booking changes
        
        // Situation contexts for English and Icelandic
        const situationContexts = [
            ...(isIcelandic ? [
                // Icelandic flight delay
                'flug seinka', 'seinkun á flugi', 'tafið flug', 
                'flugseinkun', 'flug er seint',
                
                // Icelandic arrival issues
                'komast ekki á réttum tíma', 'ná ekki tímanum', 
                'mæta ekki á réttum tíma', 'verð sein',
                'kem of seint', 'komumst ekki',
                
                // Icelandic time-related problems
                'missi af tímanum', 'mun ekki ná', 
                'er að verða sein'
            ] : [
                // English flight issues
                'flight delayed', 'flight is delayed', 'flight delay', 
                'plane is delayed', 'flight got delayed', 'plane got delayed',
                
                // English arrival problems
                'running late', 'be late for', 'won\'t make it on time',
                'can\'t make it at', 'won\'t be able to make', 'arrive late',
                
                // English timing issues
                'won\'t make the time', 'will miss the time', 
                'getting late', 'running behind'
            ])
        ];
        
        // Time-related patterns that often indicate wanting to shift a booking
        const timeShiftPatterns = [
            ...(isIcelandic ? [
                'of seint', 'verð sein', 'er sein',
                'seinni tími', 'annar tími',
                'seinka', 'fresta', 'koma seinna',
                'ná því ekki'
            ] : [
                'too late', 'arriving late', 'be late',
                'later time', 'different time',
                'postpone', 'delay visit', 'come later',
                'won\'t make it'
            ])
        ];
        
        // Question patterns about options for shifting booking
        const optionQuestions = [
            ...(isIcelandic ? [
                'hvað get ég gert', 'hvað getum við gert',
                'hvaða valkostir', 'hvaða möguleikar',
                'er hægt að', 'get ég fengið',
                'hvað á ég að gera', 'hvernig get ég',
                'hvað skal ég gera'
            ] : [
                'what can i do', 'what should i do',
                'what are my options', 'what are the options',
                'is it possible to', 'can i get',
                'how can i', 'what are the alternatives',
                'what do i do'
            ])
        ];
        
        // Check if message contains booking-related words
        const hasBookingReference = 
            msg.includes('book') || 
            msg.includes('reserv') || 
            msg.includes('time') ||
            msg.includes('appointment') ||
            msg.includes('visit') ||
            (isIcelandic && (
                msg.includes('bók') || 
                msg.includes('pant') || 
                msg.includes('tíma') ||
                msg.includes('heim')
            ));
        
        // Check for situation context + booking reference
        const hasSituationContext = situationContexts.some(context => 
            msg.includes(context)) && hasBookingReference;
        
        // Check for time shift pattern + booking reference
        const hasTimeShiftPattern = timeShiftPatterns.some(pattern => 
            msg.includes(pattern)) && hasBookingReference;
        
        // Check for option questions + booking reference
        const hasOptionQuestion = optionQuestions.some(question => 
            msg.includes(question)) && hasBookingReference;
            
        // NEW: Flight delay & specific time issue detection
        const hasFlightDelayMention = 
            (msg.includes('flight') && 
             (msg.includes('delay') || msg.includes('late') || msg.includes('miss'))) ||
            (isIcelandic && 
             (msg.includes('flug') && 
              (msg.includes('sein') || msg.includes('töf') || msg.includes('miss'))));
              
        // Late arrival mentions that imply needing booking changes
        const hasLateArrivalMention =
            (msg.includes('won\'t make it') || 
             msg.includes('can\'t make it') ||
             msg.includes('miss my time') ||
             msg.includes('miss the booking')) ||
            (isIcelandic && 
             (msg.includes('næ ekki') || 
              msg.includes('kemst ekki') ||
              msg.includes('missa af')));
              
        // Combine all context-aware checks
        const hasContextAwareMatch = 
            hasSituationContext || 
            hasTimeShiftPattern || 
            hasOptionQuestion ||
            hasFlightDelayMention ||
            hasLateArrivalMention;
            
        console.log('Context-aware checks:', {
            hasSituationContext,
            hasTimeShiftPattern,
            hasOptionQuestion,
            hasFlightDelayMention,
            hasLateArrivalMention
        });
        
        // Combine all detection methods for final result
        const result = 
            hasPatternMatch || 
            hasRootMatch || 
            changeNearDate || 
            hasCommonQuestion || 
            hasContextAwareMatch;
            
        console.log('Final detection result:', result);
        return result;
    } catch (error) {
        console.error('\n❌ Error in detectBookingChangeRequest:', error);
        return false;
    }
}

// Create booking change request (similar to createChat but with booking-specific messaging)
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

// Function to send booking change form data to LiveChat
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

// Updated sendMessageToLiveChat function with fallback
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
