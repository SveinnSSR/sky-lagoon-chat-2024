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
 * Creates a LiveChat chat with direct agent assignment
 * @param {string} customerId - Customer ID (session ID)
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Chat information
 */
export async function createDirectAgentChat(customerId, isIcelandic = false) {
    try {
        console.log('\n👤 Getting agent credentials and checking available agents...');
        
        // Get agent credentials
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        // Get available agents first to confirm David is available
        console.log('\n👥 Checking for available agents...');
        
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
        
        const agentStatuses = await agentResponse.json();
        
        // Find David (or any available agent)
        const availableAgents = agentStatuses.filter(agent => 
            agent.status === 'accepting_chats' || agent.status === 'online');
            
        if (availableAgents.length === 0) {
            throw new Error('No agents available to take chat');
        }
        
        // Use David's agent ID directly
        const targetAgent = availableAgents.find(a => a.agent_id === 'david@svorumstrax.is') || availableAgents[0];
        
        console.log('\n✅ Found agent to assign chat to:', targetAgent.agent_id);
        
        // Create the chat for the direct agent
        console.log('\n👤 Creating chat for direct assignment...');
        const groupId = isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN;
        
        // Prepare data for direct agent chat
        const directChatData = {
            active: true,
            continuous: true,
            agent_ids: [targetAgent.agent_id], // Direct agent assignment
            group_id: groupId,
            customers: [{
                id: customerId,
                name: `User ${customerId.substring(0, 8)}...`, 
                email: `${customerId.substring(0, 8)}@skylagoon.com`
            }],
            properties: {
                routing: {
                    status: "assigned", // Mark as directly assigned
                    agent_ids: [targetAgent.agent_id], // Redundant but helpful
                    priority: "urgent", // Highest priority
                    force: true
                },
                source: {
                    type: "other",
                    url: SKY_LAGOON_GROUPS.urls[groupId] || "https://www.skylagoon.com/"
                }
            }
        };
        
        console.log('\n📝 Direct agent chat params:', JSON.stringify(directChatData, null, 2));
        
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify(directChatData)
        });
        
        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('\n❌ Direct agent chat creation error:', errorText);
            
            // Try fallback without agent_ids
            console.log('\n🔄 Trying fallback chat creation...');
            delete directChatData.agent_ids;
            directChatData.properties.routing = {
                status: "queued",
                priority: "urgent"
            };
            
            const fallbackResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${agentCredentials}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify(directChatData)
            });
            
            if (!fallbackResponse.ok) {
                const fallbackError = await fallbackResponse.text();
                console.error('\n❌ Fallback chat creation error:', fallbackError);
                throw new Error('All chat creation attempts failed');
            }
            
            var chatData = await fallbackResponse.json();
            console.log('\n✅ Fallback chat created successfully:', chatData);
        } else {
            var chatData = await chatResponse.json();
            console.log('\n✅ Direct agent chat created successfully:', chatData);
        }
        
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
        
        // First, verify the chat properties
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
        
        console.log('\n📋 Direct agent chat creation completed.');
        
        return {
            chat_id: chatData.chat_id,
            agent_credentials: agentCredentials
        };
    } catch (error) {
        console.error('\n❌ Error in createDirectAgentChat:', error);
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