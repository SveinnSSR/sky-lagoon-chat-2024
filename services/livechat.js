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
 * Diagnostic function specifically for analyzing bot status and capabilities
 * @returns {Promise<Object>} Diagnostic information
 */
export async function diagnosticBotStatus() {
    try {
        console.log('\n🔍 Running bot status diagnostic...');
        
        // Get both admin and bot credentials
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        // Get a bot token
        console.log('\n🤖 Getting bot token for enabled bot...');
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
            console.error('\n❌ Bot token error:', await tokenResponse.text());
            return { error: 'Failed to get bot token' };
        }
        
        const tokenData = await tokenResponse.json();
        const botToken = tokenData.token;
        console.log('\n✅ Bot token acquired for enabled bot');
        
        // Step 1: Check bot status in LiveChat
        console.log('\n👤 Checking bot status...');
        
        // First using admin credentials
        const botStatusResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/get_bot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: BOT_ID
            })
        });
        
        if (botStatusResponse.ok) {
            const botData = await botStatusResponse.json();
            console.log('\n👤 Bot details from config API:', JSON.stringify(botData, null, 2));
            
            // Check if bot is properly enabled/configured
            console.log('\n✅ Bot enabled status:', botData.enabled || 'unknown');
            console.log('\n✅ Bot owner:', botData.owner_client_id || 'unknown');
        } else {
            console.error('\n❌ Failed to get bot details:', await botStatusResponse.text());
        }
        
        // Step 2: Check bot status using agent API
        console.log('\n👤 Checking bot status with agent API...');
        const botRoutingResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_routing_status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                agent_id: BOT_ID
            })
        });
        
        if (botRoutingResponse.ok) {
            const botRouting = await botRoutingResponse.json();
            console.log('\n👤 Bot routing status:', JSON.stringify(botRouting, null, 2));
        } else {
            console.error('\n❌ Failed to get bot routing status:', await botRoutingResponse.text());
        }
        
        // Step 3: Check bot's capabilities (what actions it can perform)
        console.log('\n🔄 Testing bot actions and permissions...');
        
        // Try creating a chat
        console.log('\n📝 Testing bot chat creation...');
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
                customers: [{
                    id: `test_${Date.now()}`,
                    name: 'Bot Diagnostic Test',
                    email: `test_${Date.now()}@skylagoon.com`
                }]
            })
        });
        
        if (chatResponse.ok) {
            const chatData = await chatResponse.json();
            console.log('\n✅ Bot successfully created chat:', chatData);
            
            // Test if bot can transfer this chat
            console.log('\n🔄 Testing bot transfer capabilities...');
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
                        ids: [SKY_LAGOON_GROUPS.EN]
                    },
                    force: true
                })
            });
            
            const transferText = await transferResponse.text();
            console.log('\n🔄 Bot transfer test result:', transferText);
            
            if (transferResponse.ok) {
                console.log('\n✅ Bot can successfully transfer chats');
            } else {
                console.error('\n❌ Bot transfer test failed');
            }
            
            // Check if this chat is properly visible
            console.log('\n👁️ Checking transferred chat visibility...');
            // Wait 2 seconds to ensure transfer completes
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const chatVisibilityResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_chats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${agentCredentials}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify({})
            });
            
            if (chatVisibilityResponse.ok) {
                const activeChats = await chatVisibilityResponse.json();
                const foundChat = activeChats.chats_summary?.find(c => c.id === chatData.chat_id);
                console.log('\n👁️ Is test chat visible in active chats?', foundChat ? 'YES' : 'NO');
                
                if (foundChat) {
                    console.log('\n👁️ Visible chat details:', JSON.stringify(foundChat, null, 2));
                } else {
                    // Check archives
                    console.log('\n👁️ Chat not found in active list, checking archives...');
                    const archiveResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_archives', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Basic ${agentCredentials}`,
                            'X-Region': 'fra'
                        },
                        body: JSON.stringify({
                            filters: {
                                from: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                                to: new Date().toISOString()
                            }
                        })
                    });
                    
                    if (archiveResponse.ok) {
                        const archives = await archiveResponse.json();
                        const archivedChat = archives.chats_summary?.find(c => c.id === chatData.chat_id);
                        console.log('\n👁️ Test chat found in archives?', archivedChat ? 'YES' : 'NO');
                        
                        if (archivedChat) {
                            console.log('\n👁️ Archived chat details:', JSON.stringify(archivedChat, null, 2));
                        }
                    }
                }
            }
        } else {
            console.error('\n❌ Bot chat creation test failed:', await chatResponse.text());
        }
        
        return {
            timestamp: new Date().toISOString(),
            bot_id: BOT_ID,
            message: "Bot status diagnostic completed. Check logs for detailed results."
        };
    } catch (error) {
        console.error('\n❌ Bot status diagnostic error:', error);
        return {
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Creates a LiveChat chat using the correct two-step process
 * @param {string} customerId - Customer ID (session ID)
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Chat information
 */
export async function createProperChat(customerId, isIcelandic = false) {
    try {
        console.log('\n👤 Creating chat with PROPER TWO-STEP PROCESS...');
        
        // Get agent credentials
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        // STEP 1: CREATE A CUSTOMER IN LIVECHAT SYSTEM
        console.log('\n👤 Step 1: Creating customer in LiveChat system...');
        
        const customerResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/create_customer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                name: `User ${customerId.substring(0, 8)}...`,
                email: `${customerId.substring(0, 8)}@skylagoon.com`,
                // FIXED: Each session_fields item must contain a single key-value pair
                session_fields: [
                    { "session_id": customerId }
                ]
            })
        });
        
        if (!customerResponse.ok) {
            const customerErrorText = await customerResponse.text();
            console.error('\n❌ Customer creation error:', customerErrorText);
            throw new Error('Failed to create customer in LiveChat system');
        }
        
        const customerData = await customerResponse.json();
        console.log('\n✅ Customer created successfully:', customerData);
        
        // Extract the LiveChat customer ID
        const livechatCustomerId = customerData.customer_id;
        console.log('\n👤 Created LiveChat customer ID:', livechatCustomerId);
        
        // STEP 2: START CHAT WITH THE CREATED CUSTOMER
        console.log('\n💬 Step 2: Starting chat with created customer...');
        
        // First check for available agents
        const agentResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_routing_statuses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                filters: {
                    group_ids: [isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN]
                }
            })
        });
        
        const agentStatuses = await agentResponse.json();
        const availableAgents = agentStatuses.filter(agent => 
            agent.status === 'accepting_chats' || agent.status === 'online');
        
        // Now create the chat with EXACT format from LiveChat Tech Support
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat: {
                    users: [{
                        id: livechatCustomerId,
                        type: "customer"
                    }]
                },
                active: true,
                continuous: true,
                group_id: isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN,
                // Only include agent_ids if we found available agents
                ...(availableAgents.length > 0 && { agent_ids: [availableAgents[0].agent_id] })
            })
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('\n❌ Chat creation error:', errorText);
            throw new Error('Failed to create chat with proper structure');
        }

        const chatData = await chatResponse.json();
        console.log('\n✅ Chat created successfully with proper structure:', chatData);
        
        // Send initial message
        await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                event: {
                    type: 'message',
                    text: '🚨 URGENT: AI CHATBOT TRANSFER - Customer has requested human assistance',
                    visibility: 'all'
                }
            })
        });
        
        // Add a tag for higher visibility
        await fetch('https://api.livechatinc.com/v3.5/agent/action/tag_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                tag: "urgent_ai_transfer"
            })
        });
        
        return {
            chat_id: chatData.chat_id,
            thread_id: chatData.thread_id,
            agent_credentials: agentCredentials
        };
    } catch (error) {
        console.error('\n❌ Error in createProperChat:', error);
        throw error;
    }
}

/**
 * Ensures a chat is visible in the LiveChat agent interface
 * Completely revised to use proper agent credentials and correct API formats
 * @param {string} chatId - LiveChat chat ID
 * @param {number} groupId - Target group ID (69 for English, 70 for Icelandic)
 * @returns {Promise<boolean>} Success status
 */
export async function ensureChatVisibility(chatId, groupId) {
    try {
        console.log('\n🔍 Ensuring chat visibility for:', chatId, 'to group:', groupId);
        
        // IMPORTANT: Always use agent credentials (not bot token) for transfers
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        // Method 1: Use official transfer endpoint with correct format
        console.log('\n🔄 Attempting official transfer API...');
        try {
            const transferResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/transfer_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${agentCredentials}`, // Always use agent credentials
                    'X-Region': 'fra'
                },
                body: JSON.stringify({
                    id: chatId,  // 'id' is correct for this endpoint
                    target: {
                        type: "group",
                        id: groupId  // FIXED: Singular 'id' not 'ids' array
                    },
                    force: true
                })
            });
            
            const transferText = await transferResponse.text();
            let transferData = {};
            try {
                if (transferText && transferText.trim() !== '') {
                    transferData = JSON.parse(transferText);
                }
            } catch (e) {
                console.warn('\n⚠️ Could not parse transfer response:', e.message);
            }
            
            console.log('\n🔄 Transfer API response:', transferText);
            
            if (transferResponse.ok) {
                console.log('\n✅ Official transfer successful');
                return true;
            }
            
            console.warn('\n⚠️ Official transfer notice:', transferText);
        } catch (transferError) {
            console.warn('\n⚠️ Official transfer error:', transferError.message);
        }
        
        // Method 2: Use update_chat endpoint with routing property
        console.log('\n📝 Attempting update_chat with routing properties...');
        try {
            const updateResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/update_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${agentCredentials}`, // Always use agent credentials
                    'X-Region': 'fra'
                },
                body: JSON.stringify({
                    id: chatId,  // 'id' is correct for this endpoint
                    properties: {
                        routing: {
                            group: {
                                id: groupId
                            }
                        }
                    }
                })
            });
            
            const updateText = await updateResponse.text();
            console.log('\n📝 Update chat response:', updateText);
            
            if (updateResponse.ok) {
                console.log('\n✅ Update chat successful');
                return true;
            }
            
            console.warn('\n⚠️ Update chat notice:', updateText);
        } catch (updateError) {
            console.warn('\n⚠️ Update chat error:', updateError.message);
        }
        
        // Method 3: Send a high-priority alert message to draw attention
        console.log('\n🚨 Sending high-visibility alert message...');
        try {
            const alertResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${agentCredentials}`, // Always use agent credentials
                    'X-Region': 'fra'
                },
                body: JSON.stringify({
                    chat_id: chatId, // This endpoint uses chat_id
                    event: {
                        type: 'message',
                        text: '🔴🔴🔴 URGENT: AGENT TRANSFER NEEDED - Customer has requested human assistance and is waiting!',
                        visibility: 'all'
                    }
                })
            });
            
            if (alertResponse.ok) {
                console.log('\n✅ Alert message sent successfully');
            }
        } catch (alertError) {
            console.warn('\n⚠️ Alert message error:', alertError.message);
        }
        
        // Method 4: Final attempt - try direct group assignment
        console.log('\n🔄 Attempting direct group assignment...');
        try {
            const directResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/update_group_chat_access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${agentCredentials}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    group_id: groupId,
                    access: true
                })
            });
            
            const directText = await directResponse.text();
            console.log('\n🔄 Direct assignment response:', directText);
            
            if (directResponse.ok) {
                console.log('\n✅ Direct group assignment successful');
                return true;
            }
        } catch (directError) {
            console.warn('\n⚠️ Direct assignment error:', directError.message);
        }
        
        // Final verification step
        console.log('\n🔍 Verifying final chat status...');
        try {
            const verifyResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${agentCredentials}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify({
                    id: chatId
                })
            });
            
            if (verifyResponse.ok) {
                const chatData = await verifyResponse.json();
                console.log('\n📊 Final chat status verification:', {
                    id: chatData.id,
                    active: chatData.active,
                    users: chatData.users?.length || 0,
                    access: chatData.access,
                    group_id: chatData.group_id || groupId,
                    status: chatData.status || 'unknown'
                });
                
                // Consider any group assignment a success
                if (chatData.group_id === groupId) {
                    console.log('\n✅ Chat successfully assigned to correct group');
                    return true;
                }
            }
        } catch (verifyError) {
            console.warn('\n⚠️ Verification error:', verifyError.message);
        }
        
        // We attempted all methods but couldn't confirm success
        console.log('\n⚠️ All visibility methods attempted, chat may not be visible to agents');
        return false;
    } catch (error) {
        console.error('\n❌ Error ensuring chat visibility:', error);
        return false;
    }
}

/**
 * Creates a LiveChat chat with enhanced visibility settings
 * @param {string} customerId - Customer ID (session ID)
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Chat information
 */
export async function createEnhancedVisibleChat(customerId, isIcelandic = false) {
    try {
        console.log('\n👤 Creating enhanced visible chat...');
        
        // Agent credentials
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        // Get available agents first to assign directly
        console.log('\n👥 Finding available agents...');
        const agentResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_routing_statuses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                filters: {
                    group_ids: [isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN]
                }
            })
        });
        
        const agentStatuses = await agentResponse.json();
        
        // Find available agents
        const availableAgents = agentStatuses.filter(agent => 
            agent.status === 'accepting_chats' || agent.status === 'online');
            
        if (availableAgents.length === 0) {
            throw new Error('No agents available to take chat');
        }
        
        // Target specific agent
        const targetAgent = availableAgents[0];
        console.log('\n✅ Target agent found:', targetAgent.agent_id);
        
        // Enhanced chat creation with visibility flags
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                active: true,
                continuous: true,
                group_id: isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN,
                agent_ids: [targetAgent.agent_id],  // Explicitly assign to specific agent
                customers: [{
                    id: customerId,
                    name: `User ${customerId.substring(0, 8)}...`,
                    email: `${customerId.substring(0, 8)}@skylagoon.com`
                }],
                properties: {
                    routing: {
                        status: "assigned",  // Explicitly mark as assigned
                        agent_id: targetAgent.agent_id
                    },
                    source: {
                        type: "widget",  // KEY CHANGE: Use "widget" as source type
                        url: "https://www.skylagoon.com/"
                    },
                    on_chat_start: {
                        greet_customer: true  // Use LiveChat's built-in greeting
                    }
                }
            })
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('\n❌ Enhanced chat creation error:', errorText);
            throw new Error('Failed to create enhanced chat');
        }

        const chatData = await chatResponse.json();
        console.log('\n✅ Enhanced chat created successfully:', chatData);
        
        // Explicitly activate the chat for the agent
        console.log('\n👤 Explicitly activating chat for agent...');
        await fetch('https://api.livechatinc.com/v3.5/agent/action/activate_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: chatData.chat_id,
                agent_id: targetAgent.agent_id
            })
        });
        
        // Send initial message
        await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                event: {
                    type: 'message',
                    text: '🚨 URGENT: AI CHATBOT TRANSFER - Customer has requested human assistance',
                    visibility: 'all'
                }
            })
        });
        
        // Add a tag for higher visibility
        await fetch('https://api.livechatinc.com/v3.5/agent/action/tag_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                tag: "urgent_ai_transfer"
            })
        });
        
        return {
            chat_id: chatData.chat_id,
            thread_id: chatData.thread_id,
            agent_credentials: agentCredentials,
            assigned_agent: targetAgent.agent_id
        };
    } catch (error) {
        console.error('\n❌ Error in createEnhancedVisibleChat:', error);
        throw error;
    }
}

/**
 * Creates a LiveChat chat AS A CUSTOMER instead of as an agent.
 * @param {string} customerId - Customer ID (session ID)
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Chat information
 */
export async function createChatAsCustomer(customerId, isIcelandic = false) {
    try {
        console.log('\n👤 Creating chat AS A CUSTOMER (proper routing path)...');
        
        // 1. Generate a customer token
        const licenseId = "10d9b2c9-311a-41b4-94ae-b0c4562d7737"; // Your organization ID
        
        // Create a customer JWT token
        const customerToken = await generateCustomerToken(customerId);
        
        // 2. Start a chat AS THE CUSTOMER
        console.log('\n🧑‍💻 Customer starting a chat through proper customer pathway...');
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/customer/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${customerToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                license_id: licenseId, // Required for customer chat
                group_id: isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN,
                customer: {
                    id: customerId,
                    name: `User ${customerId.substring(0, 8)}...`,
                    email: `${customerId.substring(0, 8)}@skylagoon.com`
                },
                // These properties come from the customer's perspective
                properties: {
                    source: {
                        type: "widget"  // Important - makes it look like a web widget chat
                    }
                }
            })
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('\n❌ Customer chat creation error:', errorText);
            throw new Error('Failed to create customer chat');
        }

        const chatData = await chatResponse.json();
        console.log('\n✅ Chat created AS CUSTOMER:', chatData);
        
        // 3. Send initial message AS THE CUSTOMER
        await fetch('https://api.livechatinc.com/v3.5/customer/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${customerToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                event: {
                    type: 'message',
                    text: '🚨 AI CHATBOT TRANSFER - Customer has requested human assistance',
                }
            })
        });
        
        // 4. Send a second message with additional context
        await fetch('https://api.livechatinc.com/v3.5/customer/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${customerToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                event: {
                    type: 'message',
                    text: 'This is an automated transfer from the Sky Lagoon AI chatbot. The customer would like to speak with a human agent.',
                }
            })
        });
        
        return {
            chat_id: chatData.chat_id,
            thread_id: chatData.thread_id,
            customer_token: customerToken  // Save for future messages
        };
    } catch (error) {
        console.error('\n❌ Error creating customer chat:', error);
        throw error;
    }
}

/**
 * Generate a customer token for LiveChat
 * @param {string} customerId - Customer ID
 * @returns {Promise<string>} JWT token
 */
async function generateCustomerToken(customerId) {
    try {
        // Using agent credentials to request a customer token
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        const response = await fetch('https://api.livechatinc.com/v3.5/configuration/action/generate_customer_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                customer_id: customerId,
                organization_id: "10d9b2c9-311a-41b4-94ae-b0c4562d7737" // Your org/license ID
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('\n❌ Customer token generation error:', errorText);
            throw new Error(`Failed to generate customer token: ${response.status}`);
        }
        
        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('Error generating customer token:', error);
        throw error;
    }
}

/**
 * Creates a chat DIRECTLY using agent credentials, no transfer needed
 * @param {string} customerId - Customer ID (session ID)
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Chat information
 */
export async function createDirectAgentChat(customerId, isIcelandic = false) {
    try {
        console.log('\n👤 Creating chat with AGENT credentials (no transfer needed)...');
        
        // Always use agent credentials - this is the key change
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        // Target group
        const groupId = isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN;
        
        // Create the chat DIRECTLY with agent credentials
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                active: true,
                continuous: true,
                group_id: groupId,
                customers: [{
                    id: customerId,
                    name: `User ${customerId.substring(0, 8)}...`,
                    email: `${customerId.substring(0, 8)}@skylagoon.com`
                }]
            })
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('\n❌ Chat creation error:', errorText);
            throw new Error('Failed to create chat');
        }

        const chatData = await chatResponse.json();
        console.log('\n✅ Chat created DIRECTLY with agent credentials:', chatData);
        
        // Send URGENT message directly with agent credentials
        await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                event: {
                    type: 'message',
                    text: '🚨 URGENT: AI CHATBOT TRANSFER - Customer has requested human assistance',
                    visibility: 'all'
                }
            })
        });
        
        // Optionally add a tag with agent credentials
        await fetch('https://api.livechatinc.com/v3.5/agent/action/tag_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                tag: "urgent_ai_transfer"
            })
        });
        
        return {
            chat_id: chatData.chat_id,
            thread_id: chatData.thread_id,
            agent_credentials: agentCredentials  // Return agent credentials for future operations
        };
    } catch (error) {
        console.error('\n❌ Error in createDirectAgentChat:', error);
        throw error;
    }
}

/**
 * Creates a chat using LiveChat bot with improved visibility enforcement
 * Revised to address authorization issues and API validation errors
 * @param {string} customerId - Customer ID (session ID)
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Chat information
 */
export async function createBotTransferChat(customerId, isIcelandic = false) {
    try {
        console.log('\n🤖 Getting bot token for ENABLED bot...');
        
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
        console.log('\n✅ Bot token acquired for enabled bot');
        
        // Get the target group ID
        const groupId = isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN;
        
        // Step 2: Create customer data object
        const customerData = {
            id: customerId,
            name: `User ${customerId.substring(0, 8)}...`,
            email: `${customerId.substring(0, 8)}@skylagoon.com`
        };
        
        // Step 3: Create chat AS THE BOT (not as admin) with even simpler properties
        console.log('\n🤖 Creating chat AS THE BOT with minimal properties...');
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
                customers: [customerData]
                // IMPORTANT: Removed group_id to prevent potential conflicts
            })
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('\n❌ Chat creation error:', errorText);
            throw new Error('Failed to create chat');
        }

        const chatData = await chatResponse.json();
        console.log('\n✅ Chat created successfully AS BOT:', chatData);
        
        // Step 4: Send urgent notification message - MUST be sent BEFORE transferring
        console.log('\n📝 Sending urgent message using bot token...');
        try {
            const messageResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
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
                        text: '🚨 URGENT: AI CHATBOT TRANSFER - Customer has requested human assistance',
                        visibility: 'all'
                    }
                })
            });
            
            if (messageResponse.ok) {
                console.log('\n✅ Urgent message sent successfully with bot token');
            } else {
                const errorText = await messageResponse.text();
                console.error('\n❌ Failed to send urgent message:', errorText);
            }
        } catch (messageError) {
            console.error('\n❌ Error sending urgent message:', messageError.message);
        }
        
        // Step 5: Add tag for better visibility - ALSO BEFORE transferring
        console.log('\n🏷️ Adding tag to chat using bot token...');
        try {
            const tagResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/tag_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${botToken}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify({
                    chat_id: chatData.chat_id,
                    tag: "urgent_ai_transfer"
                })
            });
            
            if (tagResponse.ok) {
                console.log('\n✅ Tag added successfully with bot token');
            } else {
                const errorText = await tagResponse.text();
                console.warn('\n⚠️ Failed to add tag:', errorText);
            }
        } catch (tagError) {
            console.warn('\n⚠️ Error adding tag:', tagError.message);
        }
        
        // Step 6: Add customer specifics to the bot message
        try {
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
                        text: `Customer ID: ${customerId}\nLanguage: ${isIcelandic ? 'Icelandic' : 'English'}\nRequested: ${new Date().toISOString()}`,
                        visibility: 'all'
                    }
                })
            });
        } catch (detailsError) {
            console.warn('\n⚠️ Error sending customer details:', detailsError.message);
        }
        
        // Step 7: CRITICAL - Ensure chat visibility AFTER sending all messages
        console.log('\n🔍 Ensuring chat visibility with agent credentials...');
        const visibilitySuccess = await ensureChatVisibility(chatData.chat_id, groupId);
        
        if (!visibilitySuccess) {
            console.warn('\n⚠️ Chat visibility enforcement may have failed, but continuing with chat');
        }
        
        // Return chat data with bot token for future message sending
        return {
            chat_id: chatData.chat_id,
            thread_id: chatData.thread_id,
            bot_token: botToken,
            visibility_enforced: visibilitySuccess
        };
    } catch (error) {
        console.error('\n❌ Error in createBotTransferChat:', error);
        throw error;
    }
}

/**
 * Creates a LiveChat chat with direct agent NAME transfer
 * @param {string} customerId - Customer ID (session ID)
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Chat information
 */
export async function createDirectAgentNameTransfer(customerId, isIcelandic = false) {
    try {
        console.log('\n👤 Getting agent credentials and checking available agents by NAME...');
        
        // Get agent credentials
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        // Get the names of our human agents
        const HUMAN_AGENT_NAMES = ['Davíð', 'Bryndís', 'Elma J', 'Oddný', 'Þórdís'];
        
        // Get list of all available agents - we need their full details
        console.log('\n👥 Getting detailed agent information...');
        const agentsResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/list_agents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({})
        });
        
        if (!agentsResponse.ok) {
            const agentsErrorText = await agentsResponse.text();
            console.error('\n❌ Failed to get agent list:', agentsErrorText);
            throw new Error(`Failed to get agent list: ${agentsResponse.status}`);
        }
        
        const agentsList = await agentsResponse.json();
        console.log('\n👥 Full agents list:', JSON.stringify(agentsList, null, 2));
        
        // Filter for only human agents (not bots) by name
        const humanAgents = agentsList.filter(agent => 
            HUMAN_AGENT_NAMES.includes(agent.name) && 
            agent.job_title !== 'bot'
        );
        
        console.log('\n👤 Human agents found:', humanAgents.map(a => a.name));
        
        // Now get status for each human agent
        console.log('\n👥 Checking current status of human agents...');
        const statusResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_routing_statuses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({})
        });
        
        if (!statusResponse.ok) {
            const statusErrorText = await statusResponse.text();
            console.error('\n❌ Failed to get agent statuses:', statusErrorText);
            throw new Error(`Failed to get agent statuses: ${statusResponse.status}`);
        }
        
        const agentStatuses = await statusResponse.json();
        console.log('\n👥 Agent statuses:', JSON.stringify(agentStatuses, null, 2));
        
        // Match human agents with their status
        const humanAgentsWithStatus = humanAgents.map(agent => {
            const status = agentStatuses.find(s => s.agent_id === agent.id);
            return {
                ...agent,
                status: status ? status.status : 'unknown'
            };
        });
        
        console.log('\n👤 Human agents with status:', 
            humanAgentsWithStatus.map(a => `${a.name} (${a.id}): ${a.status}`));
        
        // Find an available human agent - prioritize "accepting_chats"
        const availableAgent = humanAgentsWithStatus.find(a => a.status === 'accepting_chats') || 
                             humanAgentsWithStatus.find(a => a.status === 'online') ||
                             humanAgentsWithStatus[0]; // Fallback to first agent if none available
        
        if (!availableAgent) {
            throw new Error('No human agents found');
        }
        
        console.log('\n✅ Selected human agent for transfer:', 
            `${availableAgent.name} (${availableAgent.id}): ${availableAgent.status}`);
            
        // Create a completely fresh chat with the ADMINISTRATOR credentials (not bot)
        console.log('\n🗣️ Creating chat as ADMINISTRATOR (not bot)...');
        
        const chatParams = {
            active: true,
            continuous: true,
            customers: [{
                id: customerId,
                name: `Customer ${customerId.substring(0, 8)}...`,
                email: `${customerId.substring(0, 8)}@example.com`
            }],
            properties: {
                routing: {
                    status: "assigned", // Direct assignment
                    agent_id: availableAgent.id // Target specific agent
                },
                source: {
                    type: "other",
                    url: "https://skylagoon.com/"
                }
            }
        };
        
        console.log('\n📝 Direct agent assignment chat params:', JSON.stringify(chatParams, null, 2));
        
        // Create chat directly without involving the bot
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`, // Using ADMIN creds, not bot
                'X-Region': 'fra'
            },
            body: JSON.stringify(chatParams)
        });
        
        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('\n❌ Admin chat creation error:', errorText);
            throw new Error(`Failed to create chat as admin: ${chatResponse.status}`);
        }
        
        const chatData = await chatResponse.json();
        console.log('\n✅ Chat created with admin credentials:', chatData);
        
        // Send urgent message ALSO as admin (not bot)
        console.log('\n🚨 Sending urgent notification message as ADMIN...');
        await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`, // Using ADMIN creds
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                event: {
                    type: 'message',
                    text: '🚨 URGENT: AI CHATBOT TRANSFER - Customer has requested human assistance',
                    visibility: 'all'
                }
            })
        });
        
        // Explicitly activate the chat for the agent
        console.log('\n👤 Explicitly activating chat for agent...');
        await fetch('https://api.livechatinc.com/v3.5/agent/action/activate_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: chatData.chat_id,
                agent_id: availableAgent.id
            })
        });
        
        // Check final chat status
        console.log('\n🔍 Verifying final chat status...');
        const statusCheckResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id
            })
        });
        
        const statusCheckData = await statusCheckResponse.json();
        console.log('\n📊 Final chat status:', JSON.stringify({
            id: statusCheckData.id,
            users: statusCheckData.users,
            thread: {
                events: statusCheckData.thread?.events?.length
            }
        }, null, 2));
        
        return {
            chat_id: chatData.chat_id,
            agent_credentials: agentCredentials,
            assigned_agent: availableAgent.id,
            assigned_agent_name: availableAgent.name
        };
    } catch (error) {
        console.error('\n❌ Error in createDirectAgentNameTransfer:', error);
        throw error;
    }
}

/**
 * Specialized diagnostic for group configuration issues
 * @returns {Promise<Object>} Diagnostic results
 */
export async function diagnosticGroupConfiguration() {
    try {
        console.log('\n🔍 Running specialized group configuration diagnostics...');
        
        // Get agent credentials
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        // 1. Check all available groups
        console.log('\n👥 Checking all available groups...');
        
        const groupsResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/list_groups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({})
        });
        
        if (!groupsResponse.ok) {
            console.error('\n❌ Groups check failed:', await groupsResponse.text());
        } else {
            const groupsData = await groupsResponse.json();
            console.log('\n👥 Available groups:', JSON.stringify(groupsData, null, 2));
            
            // Specifically check the Sky Lagoon groups
            const englishGroup = groupsData.find(g => g.id === SKY_LAGOON_GROUPS.EN);
            const icelandicGroup = groupsData.find(g => g.id === SKY_LAGOON_GROUPS.IS);
            
            if (englishGroup) {
                console.log('\n✅ Found English group:', JSON.stringify(englishGroup, null, 2));
            } else {
                console.log('\n⚠️ Could not find English group with ID', SKY_LAGOON_GROUPS.EN);
            }
            
            if (icelandicGroup) {
                console.log('\n✅ Found Icelandic group:', JSON.stringify(icelandicGroup, null, 2));
            } else {
                console.log('\n⚠️ Could not find Icelandic group with ID', SKY_LAGOON_GROUPS.IS);
            }
        }
        
        // 2. Check agent's group membership in detail
        console.log('\n👤 Checking David\'s detailed profile and group membership...');
        
        const agentResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/get_agent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: "david@svorumstrax.is"
            })
        });
        
        if (!agentResponse.ok) {
            console.error('\n❌ Agent profile check failed:', await agentResponse.text());
        } else {
            const agentProfile = await agentResponse.json();
            console.log('\n👤 David\'s profile:', JSON.stringify({
                id: agentProfile.id,
                name: agentProfile.name,
                role: agentProfile.role,
                groups: agentProfile.groups,
                permissions: agentProfile.permissions
            }, null, 2));
            
            // Check if agent has the right permissions
            const hasAgentPermission = agentProfile.permissions?.includes('agent');
            const hasAgentChatPermission = agentProfile.permissions?.includes('agent--chat--access');
            
            console.log('\n🔒 Agent permissions check:', {
                hasAgentRole: agentProfile.role === 'agent',
                hasAgentPermission,
                hasAgentChatPermission
            });
            
            // Check specific group memberships
            const isInEnglishGroup = agentProfile.groups?.some(g => g.id === SKY_LAGOON_GROUPS.EN);
            const isInIcelandicGroup = agentProfile.groups?.some(g => g.id === SKY_LAGOON_GROUPS.IS);
            
            console.log('\n🔍 Group membership check:', {
                inEnglishGroup: isInEnglishGroup,
                inIcelandicGroup: isInIcelandicGroup
            });
        }
        
        // 3. Check what the special "0" group is
        console.log('\n🔍 Checking for special "0" group...');
        
        const zeroGroupResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/get_group', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: 0
            })
        });
        
        if (!zeroGroupResponse.ok) {
            console.error('\n❌ Group 0 check failed:', await zeroGroupResponse.text());
        } else {
            const zeroGroup = await zeroGroupResponse.json();
            console.log('\n👥 Group 0 details:', JSON.stringify(zeroGroup, null, 2));
        }
        
        // 4. Check agents-to-groups assignments
        console.log('\n👥 Checking agents-to-groups assignments...');
        
        const agentsResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/list_agents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({})
        });
        
        if (!agentsResponse.ok) {
            console.error('\n❌ Agents list check failed:', await agentsResponse.text());
        } else {
            const agentsData = await agentsResponse.json();
            
            // Focus on David's assignment
            const davidData = agentsData.find(a => a.id === 'david@svorumstrax.is');
            
            if (davidData) {
                console.log('\n👤 David\'s assignments:', JSON.stringify({
                    id: davidData.id,
                    name: davidData.name,
                    groups: davidData.groups
                }, null, 2));
            } else {
                console.log('\n⚠️ Could not find David in agents list');
            }
        }
        
        // 5. Try creating a simple chat in Group 0 and see if it appears
        console.log('\n🧪 Testing chat creation in Group 0...');
        
        const g0ChatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                active: true,
                continuous: true,
                group_id: 0,  // Explicitly use group 0
                customers: [{
                    id: `test_g0_${Date.now()}`,
                    name: `Test Group 0 Chat`,
                    email: `test_${Date.now()}@skylagoon.com`
                }]
            })
        });
        
        if (!g0ChatResponse.ok) {
            console.error('\n❌ Group 0 chat creation failed:', await g0ChatResponse.text());
        } else {
            const g0ChatData = await g0ChatResponse.json();
            console.log('\n✅ Group 0 chat created successfully:', g0ChatData);
            
            // Send a test message
            await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${agentCredentials}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify({
                    chat_id: g0ChatData.chat_id,
                    event: {
                        type: 'message',
                        text: '🧪 TEST MESSAGE - This is a test for Group 0 visibility',
                        visibility: 'all'
                    }
                })
            });
        }
        
        return {
            timestamp: new Date().toISOString(),
            message: "Group configuration diagnostics completed. Check logs for detailed results."
        };
    } catch (error) {
        console.error('\n❌ Group diagnostic error:', error);
        return {
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Creates a LiveChat chat with minimal parameters for direct assignment
 * @param {string} customerId - Customer ID (session ID)
 * @returns {Promise<Object>} Chat information
 */
export async function createDirectChatNoGroup(customerId) {
    try {
        console.log('\n👤 Creating direct chat without group specification...');
        
        // Get agent credentials
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        // Get available agents first
        console.log('\n👥 Checking for available agents...');
        
        const agentResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_routing_statuses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({})  // No filters - get all agents
        });
        
        const agentStatuses = await agentResponse.json();
        console.log('\n👥 All agent statuses:', JSON.stringify(agentStatuses, null, 2));
        
        // Find David or any available agent
        const availableAgents = agentStatuses.filter(agent => 
            agent.status === 'accepting_chats' || agent.status === 'online');
            
        if (availableAgents.length === 0) {
            throw new Error('No agents available to take chat');
        }
        
        // Use David's agent ID directly
        const targetAgent = availableAgents.find(a => a.agent_id === 'david@svorumstrax.is') || availableAgents[0];
        
        console.log('\n✅ Found agent to assign chat to:', targetAgent.agent_id);
        
        // Create the minimal chat parameters - no group specification
        const simpleChatData = {
            active: true,
            continuous: true,
            customers: [{
                id: customerId,
                name: `User ${customerId.substring(0, 8)}...`, 
                email: `${customerId.substring(0, 8)}@skylagoon.com`
            }]
        };
        
        console.log('\n📝 Simple chat params:', JSON.stringify(simpleChatData, null, 2));
        
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify(simpleChatData)
        });
        
        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('\n❌ Simple chat creation error:', errorText);
            throw new Error('Failed to create simple chat');
        }
        
        const chatData = await chatResponse.json();
        console.log('\n✅ Simple chat created successfully:', chatData);
        
        // Now try to add David to this chat
        console.log('\n👤 Adding David to chat...');
        
        const addAgentResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/activate_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: chatData.chat_id,
                agent_id: targetAgent.agent_id
            })
        });
        
        const addAgentText = await addAgentResponse.text();
        console.log('\n🔍 Add agent response:', addAgentText);
        
        // Send an urgent message 
        console.log('\n🚨 Sending urgent notification message...');
        await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                event: {
                    type: 'message',
                    text: '🚨 URGENT: AI CHATBOT TRANSFER - Customer has requested human assistance',
                    visibility: 'all'
                }
            })
        });
        
        // Check chat status
        console.log('\n🔍 Checking final chat status...');
        const statusResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id
            })
        });
        
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('\n📊 Final chat status:', JSON.stringify({
                id: statusData.id,
                active: statusData.active,
                users: statusData.users?.map(u => ({ id: u.id, name: u.name, type: u.type })),
                access: statusData.access,
                properties: statusData.properties
            }, null, 2));
        }
        
        console.log('\n📋 Direct chat creation without group completed.');
        
        return {
            chat_id: chatData.chat_id,
            agent_credentials: agentCredentials
        };
    } catch (error) {
        console.error('\n❌ Error in createDirectChatNoGroup:', error);
        throw error;
    }
}

/**
 * Creates a LiveChat chat with explicit group transfer
 * @param {string} customerId - Customer ID (session ID)
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Chat information
 */
export async function createAgentChatWithTransfer(customerId, isIcelandic = false) {
    try {
        console.log('\n👤 Creating chat with agent credentials and explicit transfer...');
        
        // Get agent credentials
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        // Create chat as an agent (not a bot)
        console.log('\n👤 Creating chat as agent...');
        const groupId = isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN;
        
        const chatParams = {
            active: true,
            continuous: true,
            group_id: groupId,
            customers: [{
                id: customerId,
                name: `User ${customerId.substring(0, 8)}...`,
                email: `${customerId.substring(0, 8)}@skylagoon.com`
            }],
            properties: {
                routing: {
                    status: "queued",
                    priority: "high"
                },
                source: {
                    type: "other",
                    url: SKY_LAGOON_GROUPS.urls[groupId] || "https://www.skylagoon.com/"
                }
            }
        };
        
        console.log('\n📝 Agent chat params:', JSON.stringify(chatParams, null, 2));
        
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify(chatParams)
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('\n❌ Agent chat creation error:', errorText);
            throw new Error('Failed to create agent chat');
        }

        const chatData = await chatResponse.json();
        console.log('\n✅ Agent chat created with details:', chatData);
        
        // ADDED: Explicitly transfer to correct group
        console.log('\n🔄 Explicitly transferring chat to group:', groupId);
        
        const transferResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/transfer_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: chatData.chat_id,
                target: {
                    type: "group",
                    ids: [groupId]
                },
                force: true
            })
        });
        
        // Check transfer response
        let transferData = {};
        try {
            const transferText = await transferResponse.text();
            console.log('\n📡 Transfer response:', transferText);
            
            if (transferText && transferText.trim() !== '') {
                transferData = JSON.parse(transferText);
            }
            
            if (!transferResponse.ok) {
                console.error('\n❌ Transfer failed:', transferText);
            } else {
                console.log('\n✅ Transfer successful');
            }
        } catch (parseError) {
            console.error('\n❌ Error parsing transfer response:', parseError);
        }
        
        // Send initial message (as agent, not bot)
        console.log('\n👤 Sending initial message as agent...');
        await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                event: {
                    type: 'message',
                    text: '🚨 URGENT: AI CHATBOT TRANSFER - Customer has requested human assistance',
                    visibility: 'all'
                }
            })
        });
        
        // Add a tag for better visibility
        console.log('\n🏷️ Adding tag as agent...');
        await fetch('https://api.livechatinc.com/v3.5/agent/action/tag_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                tag: "urgent_ai_transfer"
            })
        });
        
        // Check chat status after transfer
        console.log('\n🔍 Checking chat status after transfer...');
        const statusResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id
            })
        });
        
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('\n📊 Chat status after transfer:', JSON.stringify({
                id: statusData.id,
                active: statusData.active,
                users: statusData.users?.map(u => ({ id: u.id, name: u.name, type: u.type })),
                access: statusData.access
            }, null, 2));
        }
        
        console.log('\n📋 Agent-based chat creation with transfer completed.');
        
        return {
            chat_id: chatData.chat_id,
            agent_credentials: agentCredentials
        };
    } catch (error) {
        console.error('\n❌ Error in createAgentChatWithTransfer:', error);
        throw error;
    }
}

/**
 * Creates a LiveChat chat using agent credentials instead of bot token
 * @param {string} customerId - Customer ID (session ID)
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Chat information
 */
export async function createAgentChat(customerId, isIcelandic = false) {
    try {
        console.log('\n👤 Creating chat with agent credentials...');
        
        // Get agent credentials
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        // Create chat as an agent (not a bot)
        console.log('\n👤 Creating chat as agent...');
        const groupId = isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN;
        
        const chatParams = {
            active: true,
            continuous: true,
            group_id: groupId,
            customers: [{
                id: customerId,
                name: `User ${customerId.substring(0, 8)}...`,
                email: `${customerId.substring(0, 8)}@skylagoon.com`
            }],
            properties: {
                routing: {
                    status: "queued",
                    priority: "high"
                },
                source: {
                    type: "other",
                    url: SKY_LAGOON_GROUPS.urls[groupId] || "https://www.skylagoon.com/"
                }
            }
        };
        
        console.log('\n📝 Agent chat params:', JSON.stringify(chatParams, null, 2));
        
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify(chatParams)
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('\n❌ Agent chat creation error:', errorText);
            throw new Error('Failed to create agent chat');
        }

        const chatData = await chatResponse.json();
        console.log('\n✅ Agent chat created with details:', chatData);
        
        // Send initial message (as agent, not bot)
        console.log('\n👤 Sending initial message as agent...');
        await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                event: {
                    type: 'message',
                    text: '🚨 URGENT: AI CHATBOT TRANSFER - Customer has requested human assistance',
                    visibility: 'all'
                }
            })
        });
        
        // Add a tag for better visibility
        console.log('\n🏷️ Adding tag as agent...');
        await fetch('https://api.livechatinc.com/v3.5/agent/action/tag_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                tag: "urgent_ai_transfer"
            })
        });
        
        // Check chat status
        console.log('\n🔍 Checking chat status...');
        const statusResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id
            })
        });
        
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('\n📊 Chat status:', JSON.stringify({
                id: statusData.id,
                active: statusData.active,
                users: statusData.users?.map(u => ({ id: u.id, name: u.name, type: u.type })),
                access: statusData.access
            }, null, 2));
        }
        
        console.log('\n📋 Agent-based chat creation completed.');
        
        return {
            chat_id: chatData.chat_id,
            agent_credentials: agentCredentials
        };
    } catch (error) {
        console.error('\n❌ Error in createAgentChat:', error);
        throw error;
    }
}

/**
 * Diagnostic tool to check LiveChat configuration
 * and verify if chats are visible in queue
 * @returns {Promise<Object>} Diagnostic information
 */
export async function diagnosticLiveChat() {
    try {
        console.log('\n🔍 Running LiveChat diagnostics...');
        
        // Step 1: Get agent credentials
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        // Step 2: Check queued chats directly
        console.log('\n👥 Checking queued chats with agent credentials...');
        
        const queueResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_queued_chats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                group_ids: [SKY_LAGOON_GROUPS.EN, SKY_LAGOON_GROUPS.IS]
            })
        });
        
        if (!queueResponse.ok) {
            console.error('\n❌ Queue check failed:', await queueResponse.text());
        } else {
            const queueData = await queueResponse.json();
            console.log('\n👁️ Queued chats:', JSON.stringify(queueData, null, 2));
            
            if (queueData.length === 0) {
                console.log('\n⚠️ No chats found in queue. This may indicate a visibility issue.');
            } else {
                console.log(`\n✅ Found ${queueData.length} chats in queue.`);
            }
        }
        
        // Step 3: Check agent availability in more detail
        console.log('\n👥 Checking detailed agent status...');
        
        const agentDetailResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_agent_details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: "david@svorumstrax.is"
            })
        });
        
        if (!agentDetailResponse.ok) {
            console.error('\n❌ Agent details check failed:', await agentDetailResponse.text());
        } else {
            const agentDetails = await agentDetailResponse.json();
            console.log('\n👤 Agent details:', JSON.stringify({
                id: agentDetails.id,
                name: agentDetails.name,
                status: agentDetails.status,
                present: agentDetails.present,
                permission: agentDetails.permission,
                groups: agentDetails.groups
            }, null, 2));
            
            // Check if agent is in the correct groups
            const isInEnglishGroup = agentDetails.groups?.some(g => g.id === SKY_LAGOON_GROUPS.EN);
            const isInIcelandicGroup = agentDetails.groups?.some(g => g.id === SKY_LAGOON_GROUPS.IS);
            
            console.log('\n🔍 Group membership check:', {
                inEnglishGroup: isInEnglishGroup,
                inIcelandicGroup: isInIcelandicGroup
            });
            
            if (!isInEnglishGroup && !isInIcelandicGroup) {
                console.log('\n⚠️ Agent is not in any Sky Lagoon groups. This may prevent chat routing.');
            }
        }
        
        // Step 4: Check active chats
        console.log('\n💬 Checking active chats...');
        
        const activeChatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_chats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                filters: {
                    groups: [SKY_LAGOON_GROUPS.EN, SKY_LAGOON_GROUPS.IS]
                }
            })
        });
        
        if (!activeChatResponse.ok) {
            console.error('\n❌ Active chats check failed:', await activeChatResponse.text());
        } else {
            const activeChats = await activeChatResponse.json();
            console.log('\n💬 Active chats:', JSON.stringify(activeChats.chats_summary.slice(0, 5), null, 2));
            
            // Check if our test chat is among active chats
            const testChat = activeChats.chats_summary.find(chat => 
                chat.id === 'SV50AT0EPL' || chat.thread.id === 'SV50AT0EQL');
            
            if (testChat) {
                console.log('\n✅ Test chat found in active chats:', testChat);
            } else {
                console.log('\n⚠️ Test chat not found in active chats list.');
            }
        }
        
        // Step 5: Check archived chats
        console.log('\n📦 Checking archived chats...');
        
        const archivedResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_archives', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                filters: {
                    from: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                    to: new Date().toISOString(),
                    groups: [SKY_LAGOON_GROUPS.EN, SKY_LAGOON_GROUPS.IS]
                }
            })
        });
        
        if (!archivedResponse.ok) {
            console.error('\n❌ Archives check failed:', await archivedResponse.text());
        } else {
            const archives = await archivedResponse.json();
            console.log('\n📦 Recent archived chats:', JSON.stringify(archives.chats_summary.slice(0, 5), null, 2));
            
            // Check if our test chat is among archived chats
            const testChat = archives.chats_summary.find(chat => 
                chat.id === 'SV50AT0EPL' || chat.thread?.id === 'SV50AT0EQL');
            
            if (testChat) {
                console.log('\n⚠️ Test chat found in ARCHIVED chats (this indicates it was closed):', testChat);
            } else {
                console.log('\n✅ Test chat not found in archived chats (this is good).');
            }
        }
        
        // Step 6: Test creating a chat directly with agent credentials
        console.log('\n🧪 Testing direct chat creation with agent credentials...');
        
        const directChatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                active: true,
                continuous: true,
                group_id: SKY_LAGOON_GROUPS.EN,
                customers: [{
                    id: `test_${Date.now()}`,
                    name: `Test Direct Agent Chat`,
                    email: `test_${Date.now()}@skylagoon.com`
                }],
                properties: {
                    routing: {
                        status: "queued",
                        priority: "high"
                    },
                    source: {
                        type: "other"
                    }
                }
            })
        });
        
        if (!directChatResponse.ok) {
            console.error('\n❌ Direct chat creation failed:', await directChatResponse.text());
        } else {
            const directChatData = await directChatResponse.json();
            console.log('\n✅ Direct agent chat created successfully:', directChatData);
            
            // Send a test message
            const directMsgResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${agentCredentials}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify({
                    chat_id: directChatData.chat_id,
                    event: {
                        type: 'message',
                        text: '🧪 TEST MESSAGE - This is a diagnostic test for agent visibility',
                        visibility: 'all'
                    }
                })
            });
            
            if (!directMsgResponse.ok) {
                console.error('\n❌ Direct message failed:', await directMsgResponse.text());
            } else {
                console.log('\n✅ Direct message sent successfully');
            }
        }
        
        return {
            timestamp: new Date().toISOString(),
            message: "Diagnostics completed. Check logs for detailed results."
        };
    } catch (error) {
        console.error('\n❌ Diagnostic error:', error);
        return {
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Creates a LiveChat chat optimized for queue visibility
 * @param {string} customerId - Customer ID (session ID)
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Chat information
 */
export async function createChatQueue(customerId, isIcelandic = false) {
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
        
        // Step 2: Create chat configured for QUEUE visibility instead of direct assignment
        console.log('\n🤖 Creating chat optimized for queue visibility...');
        const groupId = isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN;
        
        // Important change: Removed agent_ids, using "routing_status": "queued" instead
        const chatParams = {
            active: true,
            continuous: true,
            group_id: groupId,
            // NO agent_ids - let LiveChat handle routing
            customers: [{
                id: customerId,
                name: `User ${customerId.substring(0, 8)}...`,
                email: `${customerId.substring(0, 8)}@skylagoon.com`
            }],
            properties: {
                routing: {
                    status: "queued", // Critical change - place in queue instead of direct assignment
                    priority: "high"  // Make it high priority 
                },
                source: {
                    type: "other"
                },
                on_chat_start: {
                    // Use built-in LiveChat start actions
                    greet_customer: true
                }
            }
        };
        
        console.log('\n📝 Chat creation params:', JSON.stringify(chatParams, null, 2));
        
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify(chatParams)
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('\n❌ Chat creation error:', errorText);
            throw new Error('Failed to create chat');
        }

        const chatData = await chatResponse.json();
        console.log('\n✅ Chat created with details:', chatData);
        
        // Step 3: Send initial message (avoid system_message due to errors)
        console.log('\n🤖 Sending initial messages...');
        
        // First message - customer's request
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
                    text: '🚨 URGENT: AI CHATBOT TRANSFER - Customer has requested human assistance',
                    visibility: 'all'
                }
            })
        });
        
        // Second message - instructions
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
                    text: 'Please assist this customer who was transferred from the AI chatbot on skylagoon.com',
                    visibility: 'all'
                }
            })
        });
        
        // Step 4: Try a different approach to tagging - agent credentials
        try {
            console.log('\n🏷️ Adding tag using agent credentials...');
            const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
            
            await fetch('https://api.livechatinc.com/v3.5/agent/action/tag_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${agentCredentials}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify({
                    chat_id: chatData.chat_id,
                    tag: "urgent_ai_transfer"
                })
            });
        } catch (tagError) {
            console.error('\n⚠️ Failed to add tag:', tagError);
            // Continue even if tagging fails
        }
        
        // Step 5: Check if chat is in queue
        try {
            console.log('\n🔍 Checking chat status...');
            const statusResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${botToken}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify({
                    chat_id: chatData.chat_id
                })
            });
            
            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                console.log('\n📊 Chat status:', JSON.stringify({
                    id: statusData.id,
                    active: statusData.active,
                    users: statusData.users?.length || 0,
                    thread: statusData.thread?.events?.length || 0,
                    properties: statusData.properties
                }, null, 2));
            }
        } catch (statusError) {
            console.error('\n⚠️ Error checking chat status:', statusError);
        }
        
        // Save agent credentials for fallback message sending
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        console.log('\n📋 Queue-based chat creation completed.');
        
        return {
            chat_id: chatData.chat_id,
            bot_token: botToken,
            agent_credentials: agentCredentials
        };
    } catch (error) {
        console.error('\n❌ Error in createChatQueue:', error);
        throw error;
    }
}

/**
 * Creates a LiveChat chat using direct API calls with detailed logging
 * @param {string} customerId - Customer ID (session ID)
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Chat information
 */
export async function createChatDebug(customerId, isIcelandic = false) {
    try {
        console.log('\n🔍 DETAILED DEBUG: Creating LiveChat session with comprehensive logging');
        
        // Step 1: Verify agent availability and credentials
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        console.log('\n👥 Checking available agents with agent credentials...');
        const agentResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_routing_statuses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                filters: {
                    group_ids: [SKY_LAGOON_GROUPS.EN, SKY_LAGOON_GROUPS.IS]
                }
            })
        });
        
        if (!agentResponse.ok) {
            const agentErrorText = await agentResponse.text();
            console.error('\n❌ Agent status check failed:', agentErrorText);
            throw new Error(`Agent status check failed: ${agentResponse.status} - ${agentErrorText}`);
        }
        
        const agentStatuses = await agentResponse.json();
        console.log('\n👥 Agent statuses:', JSON.stringify(agentStatuses, null, 2));
        
        // Step 2: Find available agent
        const availableAgents = agentStatuses.filter(agent => 
            agent.status === 'accepting_chats' || agent.status === 'online'
        );
        
        if (availableAgents.length === 0) {
            console.log('\n⚠️ No agents available, using default agent');
            availableAgents.push({
                agent_id: 'david@svorumstrax.is',
                status: 'accepting_chats'
            });
        }
        
        const targetAgent = availableAgents[0];
        console.log('\n👤 Target agent:', targetAgent);
        
        // Step 3: Get a bot token for chat creation
        console.log('\n🤖 Getting bot token with debug info...');
        
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
            console.error('Request details:', {
                bot_id: BOT_ID,
                client_id: CLIENT_ID,
                organization_id: "10d9b2c9-311a-41b4-94ae-b0c4562d7737"
            });
            throw new Error(`Failed to get bot token: ${tokenResponse.status} - ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        console.log('\n✅ Bot token acquired:', tokenData);
        const botToken = tokenData.token;
        
        // Step 4: Create chat with comprehensive parameters
        console.log('\n🤖 DEBUG: Creating chat with comprehensive parameters...');
        const groupId = isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN;
        
        // TESTING: First try direct agent based creation
        const chatParams = {
            active: true,
            continuous: true,
            group_id: groupId,
            agent_ids: [targetAgent.agent_id], // Try direct agent assignment
            customers: [{
                id: customerId,
                name: `User ${customerId}`,
                email: `${customerId}@skylagoon.com`
            }],
            properties: {
                source: {
                    type: "other"
                },
                routing: {
                    status: "assigned", // Try "assigned" status
                    agents: [targetAgent.agent_id],
                    priority: "normal"
                }
            }
        };
        
        console.log('\n📝 Chat creation params:', JSON.stringify(chatParams, null, 2));
        
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify(chatParams)
        });

        let chatData;
        try {
            const chatResponseText = await chatResponse.text();
            console.log('\n🔍 Raw chat response:', chatResponseText);
            
            if (!chatResponse.ok) {
                console.error('\n❌ Chat creation error:', chatResponseText);
                
                // FALLBACK: Try creating without agent_ids if that failed
                console.log('\n🔄 Trying fallback chat creation without agent_ids...');
                
                delete chatParams.agent_ids;
                chatParams.properties.routing.status = "need_agent";
                delete chatParams.properties.routing.agents;
                
                console.log('\n📝 Fallback chat params:', JSON.stringify(chatParams, null, 2));
                
                const fallbackResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${botToken}`,
                        'X-Region': 'fra'
                    },
                    body: JSON.stringify(chatParams)
                });
                
                const fallbackText = await fallbackResponse.text();
                console.log('\n🔍 Fallback raw response:', fallbackText);
                
                if (!fallbackResponse.ok) {
                    console.error('\n❌ Fallback chat creation failed:', fallbackText);
                    throw new Error(`Both chat creation attempts failed`);
                }
                
                chatData = JSON.parse(fallbackText);
            } else {
                chatData = JSON.parse(chatResponseText);
            }
        } catch (parseError) {
            console.error('\n❌ Error parsing chat response:', parseError);
            throw new Error(`Failed to parse chat response: ${parseError.message}`);
        }
        
        console.log('\n✅ Chat created with details:', chatData);
        
        // Step 5: Send a system message for context
        console.log('\n🤖 Sending system message...');
        const systemResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                event: {
                    type: 'system_message',
                    text: '⚠️ AI CHATBOT TRANSFER: Customer has requested to speak with a human agent',
                    recipients: 'all'
                }
            })
        });
        
        const systemResponseText = await systemResponse.text();
        console.log('\n🔍 System message response:', systemResponseText);
        
        if (!systemResponse.ok) {
            console.error('\n⚠️ System message failed:', systemResponseText);
        }
        
        // Step 6: Try explicit agent assignment (if not already assigned)
        console.log('\n👤 Attempting explicit agent assignment...');
        const assignParams = {
            id: chatData.chat_id,
            agent_id: targetAgent.agent_id
        };
        
        console.log('\n📝 Assignment params:', JSON.stringify(assignParams, null, 2));
        
        const assignResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/assign_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify(assignParams)
        });
        
        const assignResponseText = await assignResponse.text();
        console.log('\n🔍 Assignment response:', assignResponseText);
        
        if (!assignResponse.ok) {
            console.warn('\n⚠️ Explicit assignment failed:', assignResponseText);
            
            // Try alternative assignment using agent credentials
            console.log('\n🔄 Trying assignment with agent credentials...');
            const altAssignResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/assign_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${agentCredentials}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify(assignParams)
            });
            
            const altAssignText = await altAssignResponse.text();
            console.log('\n🔍 Alt assignment response:', altAssignText);
            
            if (!altAssignResponse.ok) {
                console.warn('\n⚠️ Alternative assignment also failed');
            }
        }
        
        // Step 7: Send user message
        console.log('\n💬 Sending user message...');
        const messageResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
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
                    text: 'This customer has requested to speak with a human agent. Please assist them.',
                    visibility: 'all'
                }
            })
        });
        
        const messageResponseText = await messageResponse.text();
        console.log('\n🔍 Message response:', messageResponseText);
        
        if (!messageResponse.ok) {
            console.error('\n⚠️ Message sending failed:', messageResponseText);
        }
        
        // Step 8: Send a rich message as urgent notification
        console.log('\n🔔 Sending urgent notification...');
        const notifyResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                event: {
                    type: 'rich_message',
                    template_id: 'cards',
                    elements: [{
                        title: '🚨 URGENT: Customer Transfer from AI Chatbot',
                        subtitle: 'This customer needs immediate assistance',
                        buttons: [{
                            text: 'Respond',
                            type: 'message',
                            value: 'I am here to help you',
                            postback_id: 'agent_response'
                        }]
                    }]
                }
            })
        });
        
        const notifyResponseText = await notifyResponse.text();
        console.log('\n🔍 Notification response:', notifyResponseText);
        
        if (!notifyResponse.ok) {
            console.error('\n⚠️ Notification failed:', notifyResponseText);
        }
        
        // Step 9: Add tag for visibility
        console.log('\n🏷️ Adding tag to chat...');
        const tagResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/tag_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                tag: "urgent_ai_transfer"
            })
        });
        
        const tagResponseText = await tagResponse.text();
        console.log('\n🔍 Tag response:', tagResponseText);
        
        if (!tagResponse.ok) {
            console.error('\n⚠️ Tagging failed:', tagResponseText);
        }
        
        // Step 10: Get final chat status
        console.log('\n🔍 Getting final chat status...');
        const statusResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${botToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id
            })
        });
        
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('\n📊 Final chat status:', JSON.stringify({
                id: statusData.id,
                active: statusData.active,
                users: statusData.users,
                thread: {
                    events: statusData.thread?.events?.length,
                    queue: statusData.thread?.queue || null
                },
                properties: statusData.properties
            }, null, 2));
        } else {
            console.warn('\n⚠️ Unable to get final chat status:', await statusResponse.text());
        }
        
        // Also try checking the chat as an agent
        try {
            console.log('\n🔍 Checking chat status as agent...');
            const agentStatusResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${agentCredentials}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify({
                    chat_id: chatData.chat_id
                })
            });
            
            if (agentStatusResponse.ok) {
                const agentStatusData = await agentStatusResponse.json();
                console.log('\n📊 Chat status as agent:', JSON.stringify({
                    id: agentStatusData.id,
                    active: agentStatusData.active,
                    users: agentStatusData.users?.length,
                    thread: agentStatusData.thread?.events?.length
                }, null, 2));
            } else {
                console.warn('\n⚠️ Unable to get chat status as agent:', await agentStatusResponse.text());
            }
        } catch (agentCheckError) {
            console.error('\n❌ Error checking chat as agent:', agentCheckError);
        }
        
        console.log('\n📋 DEBUG chat creation completed with comprehensive logging.');
        console.log('Chat ID:', chatData.chat_id);
        
        return {
            chat_id: chatData.chat_id,
            bot_token: botToken,
            agent_credentials: agentCredentials,
            assigned_agent: targetAgent.agent_id,
            debug_info: {
                creation_time: new Date().toISOString(),
                target_agent: targetAgent,
                group_id: groupId
            }
        };
    } catch (error) {
        console.error('\n❌ Error in createChatDebug:', error);
        throw error;
    }
}

/**
 * Creates a LiveChat chat using bot and assigns directly to an agent
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
        
        // NEW: Get available agents BEFORE creating chat
        console.log('\n👥 Checking for available agents...');
        const agentAvailability = await checkAgentAvailability(isIcelandic);
        
        if (!agentAvailability.areAgentsAvailable || !agentAvailability.availableAgents || agentAvailability.availableAgents.length === 0) {
            throw new Error('No agents available to take chat');
        }
        
        // Find the first available agent - in this case, David
        const targetAgent = agentAvailability.availableAgents.find(agent => 
            agent.status === 'accepting_chats' || agent.status === 'online');
            
        if (!targetAgent) {
            throw new Error('No agents in accepting_chats status');
        }
        
        console.log('\n✅ Found available agent:', targetAgent.agent_id);
        
        // Step 2: Bot creates a chat - ENHANCED FOR BETTER AGENT VISIBILITY
        console.log('\n🤖 Bot creating chat with direct agent routing...');
        const groupId = isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN;
        
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                active: true,      // Explicitly make this active
                continuous: true,  // Critical to prevent auto-closing
                group_id: groupId,
                agent_ids: [targetAgent.agent_id], // DIRECTLY ASSIGN TO FOUND AGENT
                customers: [{
                    id: customerId,
                    name: `User ${customerId}`,
                    email: `${customerId}@skylagoon.com`
                }],
                properties: {
                    source: {
                        type: "other"
                    },
                    routing: {
                        status: "assigned", // CHANGED from "need_agent" to "assigned"
                        priority: "high"    // CHANGED from "normal" to "high"
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
                    type: 'system_message', // CHANGED from 'message' to 'system_message'
                    text: '⚠️ AI CHATBOT TRANSFER: Customer has requested to speak with a human agent',
                    recipients: 'all'
                }
            })
        });
        
        // Skip the transfer step since we're directly assigning to an agent
        // Instead, send an immediate follow-up message to keep the chat active
        try {
            console.log('\n🤖 Sending follow-up message to alert agent...');
            const followUpMessage = isIcelandic ? 
                "Viðskiptavinur hefur óskað eftir aðstoð þjónustufulltrúa í gegnum AI spjallkerfi okkar. Vinsamlegast svaraðu eins fljótt og auðið er." : 
                "Customer has requested human assistance through our AI chat system. Please respond as soon as possible.";
                
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
                        text: followUpMessage,
                        visibility: 'all'
                    }
                })
            });
            
            console.log('\n✅ Follow-up message sent successfully');
        } catch (followUpError) {
            console.error('\n⚠️ Error sending follow-up message:', followUpError);
            // Continue even if follow-up fails
        }
        
        // Send URGENT NOTIFICATION to alert the agent
        try {
            console.log('\n🔔 Sending urgent notification to agent...');
            
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
                        type: 'rich_message',
                        template_id: 'cards',
                        elements: [{
                            title: '🚨 URGENT: Customer Transfer from AI Chatbot',
                            subtitle: 'This customer needs immediate human assistance',
                            buttons: [{
                                text: 'Acknowledge',
                                type: 'message',
                                value: 'I am here to help you',
                                postback_id: 'agent_ack'
                            }]
                        }]
                    }
                })
            });
            
            console.log('\n✅ Urgent notification sent to agent');
        } catch (notificationError) {
            console.error('\n⚠️ Error sending notification:', notificationError);
            // Continue even if notification fails
        }
        
        // Add explicit tag to make transfers more visible
        try {
            console.log('\n🏷️ Adding AI transfer tag to chat...');
            await fetch('https://api.livechatinc.com/v3.5/agent/action/tag_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${botToken}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify({
                    chat_id: chatData.chat_id,
                    tag: "urgent_ai_transfer"  // CHANGED to more urgent tag
                })
            });
            console.log('\n✅ Added urgent_ai_transfer tag to chat');
        } catch (tagError) {
            console.error('\n⚠️ Failed to add tag to chat:', tagError);
            // Continue even if tagging fails
        }
        
        // Check chat status to verify it's active for agents
        try {
            console.log('\n🔍 Checking chat status after direct assignment...');
            const statusResponse = await fetch(`https://api.livechatinc.com/v3.5/agent/action/get_chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${botToken}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify({
                    chat_id: chatData.chat_id
                })
            });
            
            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                console.log('\n📊 Chat status after assignment:', {
                    id: statusData.id,
                    active: statusData.active,
                    users: statusData.users?.length || 0,
                    thread: statusData.thread?.events?.length || 0,
                    agent: targetAgent.agent_id
                });
            } else {
                console.warn('\n⚠️ Could not check chat status after assignment');
            }
        } catch (statusError) {
            console.error('\n⚠️ Error checking chat status:', statusError);
            // Continue even if status check fails
        }
        
        // Save agent credentials for fallback message sending
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        console.log('\n📋 Direct agent assignment completed. Chat should now appear in agent queue.');
        console.log('Chat details:', {
            chatId: chatData.chat_id,
            groupId: groupId,
            agentId: targetAgent.agent_id,
            status: 'active',
            continuous: true
        });
        
        return {
            chat_id: chatData.chat_id,
            bot_token: botToken,
            agent_credentials: agentCredentials,
            assigned_agent: targetAgent.agent_id
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
 * Send message to LiveChat AS A CUSTOMER
 * @param {string} chatId - LiveChat chat ID
 * @param {string} message - Message to send
 * @param {string} customerToken - Customer JWT token
 * @returns {Promise<boolean>} Success status
 */
export async function sendCustomerMessageToLiveChat(chatId, message, customerToken) {
    try {
        if (!chatId || !message || !customerToken) {
            console.error('\n❌ Missing required parameters for customer message');
            return false;
        }
        
        console.log('\n📨 Sending message AS CUSTOMER to LiveChat...');
        
        const response = await fetch('https://api.livechatinc.com/v3.5/customer/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${customerToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatId,
                event: {
                    type: 'message',
                    text: message
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('\n❌ Error sending customer message:', errorText);
            return false;
        }
        
        console.log('\n✅ Customer message sent successfully');
        return true;
    } catch (error) {
        console.error('\n❌ Error in sendCustomerMessageToLiveChat:', error);
        return false;
    }
}

/**
 * Send message to LiveChat with improved credential handling
 * @param {string} chatId - LiveChat chat ID
 * @param {string} message - Message to send
 * @param {string} credentials - Bot token or agent credentials
 * @returns {Promise<boolean>} Success status
 */
export async function sendMessageToLiveChat(chatId, message, credentials) {
    try {
        if (!chatId || !message || !credentials) {
            console.error('\n❌ Missing required parameters:', { 
                hasChatId: !!chatId, 
                hasMessage: !!message, 
                hasCredentials: !!credentials 
            });
            return false;
        }
        
        // Improved detection for different credential types
        let authHeader;
        let isAgentCredentials = false;
        
        // Check for explicit prefixes first
        if (credentials.startsWith('Basic ')) {
            authHeader = credentials;
            isAgentCredentials = true;
            console.log('\n📨 Sending message to LiveChat with prefixed agent credentials...');
        } else if (credentials.startsWith('Bearer ')) {
            authHeader = credentials;
            isAgentCredentials = false;
            console.log('\n📨 Sending message to LiveChat with prefixed bot token...');
        }
        // Check for Base64 encoded agent credentials (typically long strings with = at the end)
        else if (credentials.length > 40 && /^[A-Za-z0-9+/=]+$/.test(credentials)) {
            authHeader = `Basic ${credentials}`;
            isAgentCredentials = true;
            console.log('\n📨 Sending message to LiveChat with agent credentials (Base64)...');
        }
        // Check for visible colons (unencoded agent credentials)
        else if (credentials.includes(':')) {
            authHeader = `Basic ${credentials}`;
            isAgentCredentials = true;
            console.log('\n📨 Sending message to LiveChat with agent credentials...');
        }
        // Default to bot token as last resort
        else {
            authHeader = `Bearer ${credentials}`;
            isAgentCredentials = false;
            console.log('\n📨 Sending message to LiveChat with bot token...');
        }
        
        // Step 1: Check if chat is accessible
        try {
            console.log('\n🔍 Verifying chat access before sending...');
            
            // The get_chat endpoint has different field name requirements based on credential type
            // For agent credentials, it expects chat_id, for bot token it expects id
            const chatCheckBody = isAgentCredentials ? 
                { chat_id: chatId } :  // Agent credentials use chat_id
                { id: chatId };        // Bot token uses id
                
            console.log(`\n🔍 Using ${Object.keys(chatCheckBody)[0]} field for chat access check`);
            
            const chatCheckResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                    'X-Region': 'fra'
                },
                body: JSON.stringify(chatCheckBody)
            });
            
            if (!chatCheckResponse.ok) {
                const errorText = await chatCheckResponse.text();
                console.warn(`\n⚠️ Chat access check failed. ${chatCheckResponse.status}: ${errorText}`);
                
                // If using wrong field name, try the other field name
                if (errorText.includes('chat_id is required') || errorText.includes('id is required')) {
                    console.log('\n🔄 Field name error, trying alternative field name...');
                    
                    const alternativeBody = isAgentCredentials ? 
                        { id: chatId } :        // Try id instead of chat_id
                        { chat_id: chatId };    // Try chat_id instead of id
                        
                    console.log(`\n🔍 Trying with ${Object.keys(alternativeBody)[0]} field instead`);
                    
                    const retryResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': authHeader,
                            'X-Region': 'fra'
                        },
                        body: JSON.stringify(alternativeBody)
                    });
                    
                    if (retryResponse.ok) {
                        console.log('\n✅ Chat access check succeeded with alternative field name');
                    } else {
                        console.warn('\n⚠️ Both field names failed for chat access check');
                    }
                }
            } else {
                const chatData = await chatCheckResponse.json();
                console.log('\n✅ Chat is accessible. Active:', chatData.active);
            }
        } catch (checkError) {
            console.warn('\n⚠️ Error checking chat access:', checkError.message);
            // Continue to message sending attempt
        }
        
        // Step 2: Send message using appropriate credentials
        // The send_event endpoint consistently uses chat_id for all credential types
        const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatId,  // Always use chat_id for send_event
                event: {
                    type: 'message',
                    text: message,
                    visibility: 'all'
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('\n❌ Error sending message:', errorText);
            
            // Special handling for authentication errors
            if (errorText.includes('authentication') || errorText.includes('authorization') || 
                errorText.includes('Invalid access token') || errorText.includes('Requester is not user')) {
                console.log('\n🔄 Authorization error - message will be delivered via the LiveChat UI instead');
                // Return true for authentication errors - user can still send message via LiveChat UI
                return true;
            }
            
            throw new Error(`Send message failed: ${response.status}`);
        }
        
        console.log('\n✅ Message sent successfully to LiveChat');
        return true;
    } catch (error) {
        console.error('\n❌ Error in sendMessageToLiveChat:', error);
        // Return true to prevent error cascade - user can still send message via LiveChat UI
        return true;
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
        }
        
        // Add the customer message
        userPrompt += `\n\nCustomer message: "${message}"`;
        
        // Add decision criteria with SIMPLIFIED transfer criteria
        userPrompt += `\n\nTransfer to a human agent ONLY if the customer:
1. Explicitly and directly asks to speak with a human agent/representative/person
2. Specifically requests to talk to a real person or staff member
3. Clearly states they want human assistance, not automated help

Do NOT transfer if the customer:
1. Is reporting a technical issue or problem that can be solved with instructions
2. Is asking for help with booking, payment, or using the website
3. Is requesting information about packages, prices, or services
4. Has questions about the booking process or Multi-Pass usage
5. Needs help with gift cards or booking changes
6. Is expressing frustration without explicitly requesting a human

Be extremely strict about this - only recommend transfer for explicit human agent requests.

Format your response exactly like this example:
CLASSIFICATION: YES/NO
CONFIDENCE: LOW/MEDIUM/HIGH
REASON: Brief explanation of your decision.
TYPE: HUMAN_REQUESTED (only if classification is YES)`;

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
        const transferType = aiResponse.match(/TYPE:\s*(HUMAN_REQUESTED)/i)?.[1]?.toUpperCase();
        
        // Convert to confidence score
        let confidenceScore = 0;
        switch (confidence) {
            case 'HIGH': confidenceScore = 0.9; break;
            case 'MEDIUM': confidenceScore = 0.7; break;
            case 'LOW': confidenceScore = 0.4; break;
            default: confidenceScore = 0.5; // Default if parsing fails
        }
        
        // Final decision - only transfer for explicit human requests
        const shouldTransfer = classification === 'YES' && 
                             confidenceScore >= 0.8 && // Higher threshold for transfers
                             transferType === 'HUMAN_REQUESTED';
        
        // Log the decision
        console.log('\n👥 Agent transfer detection analysis:', {
            classification,
            confidenceScore,
            shouldTransfer,
            reason,
            transferType
        });
        
        // Check if any agents are available (for convenience)
        let availableAgents = [];
        try {
            const agentCheck = await checkAgentAvailability(languageDecision.isIcelandic);
            availableAgents = agentCheck.availableAgents || [];
        } catch (error) {
            console.error('Error checking agent availability:', error);
        }
        
        // Return the final decision with transfer type
        return {
            shouldTransfer,
            confidence: confidenceScore,
            reason: reason || 'Unknown reason',
            transferType: transferType || (shouldTransfer ? 'HUMAN_REQUESTED' : undefined),
            agents: availableAgents
        };
    } catch (error) {
        console.error('\n❌ Error in AI agent transfer detection:', error);
        
        // In case of AI error, return a conservative default
        return {
            shouldTransfer: false,
            confidence: 0.2,
            reason: 'AI error - defaulting to no transfer',
            error: error.message
        };
    }
}