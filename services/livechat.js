// services/livechat.js
import fetch from 'node-fetch';

// LiveChat credentials
const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e';
const PAT = 'fra:rmSYYwBm3t_PdcnJIOfQf2aQuJc';

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

// Check agent availability
export async function checkAgentAvailability(isIcelandic = false) {
    try {
        const credentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        const groupId = isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN;

        // Get agents by license rather than by group to see all agents
        const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_agents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                fields: ["id", "name", "status", "groups"]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('\n👥 All agents:', JSON.stringify(data, null, 2));
        
        // Filter for our agents that are online
        const availableAgents = data.filter(agent => 
            LIVECHAT_AGENTS.includes(agent.id) && 
            agent.status === 'accepting_chats' || agent.status === 'online'
        );

        // If none are accepting chats, just use any online agent
        const fallbackAgents = data.filter(agent => 
            LIVECHAT_AGENTS.includes(agent.id) && 
            agent.status !== 'offline'
        );

        const agents = availableAgents.length > 0 ? availableAgents : fallbackAgents;

        return {
            areAgentsAvailable: agents.length > 0,
            availableAgents: agents,
            agentCount: agents.length,
            groupId: groupId
        };

    } catch (error) {
        console.error('Error checking agent status:', error.message);
        return {
            areAgentsAvailable: false,
            availableAgents: [],
            agentCount: 0,
            error: error.message
        };
    }
}

// Create chat function
export async function createChat(customerId, isIcelandic = false) {
    try {
        const credentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        const groupId = isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN;
        
        // Skip customer registration and just create the chat directly
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                license_id: "12638850",
                organization_id: "10d9b2c9-311a-41b4-94ae-b0c4562d7737",
                group_id: groupId,
                continuous: true,
                active: true,
                customer: {
                    name: `User ${customerId}`,
                    email: `${customerId}@skylagoon.com`
                },
                properties: {
                    source: {
                        type: "widget",
                        url: isIcelandic ? "https://www.skylagoon.com/is/" : "https://www.skylagoon.com/"
                    },
                    routing: {
                        group_id: groupId
                    },
                    chat: {
                        access: {
                            group_ids: [groupId]
                        }
                    }
                }
            })
        });

        const rawResponse = await chatResponse.text();
        console.log('\n📝 Raw chat response:', rawResponse);

        let chatData;
        try {
            chatData = JSON.parse(rawResponse);
            console.log('\n✅ Chat created with details:', chatData);
        } catch (e) {
            console.error('\n❌ Error parsing response:', e);
            throw new Error("Failed to parse chat response");
        }

        if (!chatData.chat_id) {
            throw new Error(`Failed to create chat: ${JSON.stringify(chatData)}`);
        }

        // Send initial customer message
        await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
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

        // Keep using customerId as a string rather than trying to get a real customer_id
        return {
            chat_id: chatData.chat_id,
            customer_id: customerId
        };

    } catch (error) {
        console.error('\n❌ Error in createChat:', error);
        throw error;
    }
}

// Transfer chat to agent
export async function transferChatToAgent(chatId, agentId) {
    try {
        const credentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        const groupId = 69; // Default to English group

        // First make sure the chat is marked as active
        await fetch('https://api.livechatinc.com/v3.5/agent/action/activate_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: chatId
            })
        });

        // Fix the transfer format - using ids array as required
        const transferResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/transfer_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: chatId,
                target: {
                    type: "agent", 
                    ids: [agentId] // Use ids array as required
                },
                force: true
            })
        });

        const transferText = await transferResponse.text();
        console.log('\n📡 Chat transfer response:', transferText);

        // System message for activity
        await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatId,
                event: {
                    type: 'system_message',
                    text: 'An agent will be with you shortly.',
                    system_message_type: 'system_info', 
                    recipients: 'all'
                }
            })
        });

        // Try a different approach - move the chat to a group explicitly
        const moveResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/move_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: chatId,
                group_id: groupId
            })
        });

        console.log('\n📁 Move chat response:', await moveResponse.text());

        return true;

    } catch (error) {
        console.error('\n❌ Error in transferChatToAgent:', error);
        return false;
    }
}

// Add this at the end of livechat.js
export async function sendMessageToLiveChat(chatId, message, customerId) {
    try {
        const credentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');

        // Send message with proper customer ID
        const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatId,
                event: {
                    type: 'message',
                    text: message,
                    author_id: customerId, // This needs to be the real customer ID
                    visibility: 'all'
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Send message error response:', errorText);
            throw new Error(`Send message failed: ${response.status}`);
        }

        return true;

    } catch (error) {
        console.error('\n❌ Error sending message to LiveChat:', error);
        return false;
    }
}
