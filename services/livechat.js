// Create a new file: services/livechat.js
import fetch from 'node-fetch';

// LiveChat credentials
const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e';
const PAT = 'fra:mevbjK3jZjxom9Y9giWv49wpEE4'; // Your fra:... token
const SKY_LAGOON_GROUPS = [69, 70]; // Sky Lagoon EN and IS groups

export async function checkAgentAvailability() {
    try {
        // Create Basic auth credentials
        const credentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');

        const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_routing_statuses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                filters: {
                    group_ids: SKY_LAGOON_GROUPS
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        // Filter for human agents who are accepting chats
        const availableAgents = data.filter(agent => 
            agent.agent_id.includes('@') && 
            agent.status === 'accepting_chats'
        );

        return {
            areAgentsAvailable: availableAgents.length > 0,
            availableAgents: availableAgents,
            agentCount: availableAgents.length
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

// Function to create a new chat
export async function createChat(customerId, isIcelandic = false) {
    try {
        const credentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        const licenseId = '12638850';
        const groupId = isIcelandic ? 70 : 69;

        // First create a presence check
        const presenceResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_routing_statuses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                filters: {
                    group_ids: [groupId]
                }
            })
        });

        const presenceData = await presenceResponse.json();
        console.log('\n🌟 Presence check:', presenceData);

        // Create customer with group info in a different way
        const customerResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/create_customer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                name: `User ${customerId}`,
                email: `${customerId}@skylagoon.com`,
                properties: {
                    group_id: groupId,
                    origin: 'chatbot_transfer'
                }
            })
        });

        if (!customerResponse.ok) {
            const errorText = await customerResponse.text();
            console.error('Create customer error response:', errorText);
            throw new Error(`Create customer failed: ${customerResponse.status}`);
        }

        const customerData = await customerResponse.json();
        console.log('\n✅ Customer created:', customerData);

        // Get active agent from presence check
        const activeAgent = presenceData.find(agent => agent.status === 'accepting_chats');
        const agentId = activeAgent ? activeAgent.agent_id : 'david@svorumstrax.is';

        // Start chat with the active agent
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                customer_id: customerData.customer_id,
                group_id: groupId,
                active: true,
                properties: {
                    source: 'chatbot_transfer',
                    assignee: {
                        id: agentId,
                        type: 'agent'
                    }
                }
            })
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('Start chat error response:', errorText);
            throw new Error(`Start chat failed: ${chatResponse.status}`);
        }

        const chatData = await chatResponse.json();
        console.log('\n✅ Chat created with details:', chatData);

        // Send message
        const messageResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
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
                    text: '⚠️ Customer requesting booking change assistance',
                    author_id: agentId,
                    visibility: 'all'
                }
            })
        });

        console.log('\n📨 Message response:', await messageResponse.text());

        return chatData.chat_id;

    } catch (error) {
        console.error('Detailed error in createChat:', error);
        throw error;
    }
}

// Function to transfer chat to human agent
export async function transferChatToAgent(chatId, agentId) {
    try {
        const credentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');

        // First get chat details
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatId
            })
        });

        console.log('\n📝 Chat details response:', await chatResponse.text());

        // Then try to assign the agent using assign_agent
        const assignResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/assign_agent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatId,
                agent_id: agentId
            })
        });

        console.log('\n📡 Assign agent response:', await assignResponse.text());

        // Then try to deactivate the bot
        const deactivateResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/deactivate_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: chatId,
                ignore_requester_presence: true
            })
        });

        console.log('\n🔄 Deactivate response:', await deactivateResponse.text());

        return true;

    } catch (error) {
        console.error('Error transferring chat:', error.message);
        return false;
    }
}

// Add this at the end of livechat.js
export async function sendMessageToLiveChat(chatId, message, customerId) {
    try {
        const credentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');

        // Send message directly without any pre-checks
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
                    author_id: customerId,
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
