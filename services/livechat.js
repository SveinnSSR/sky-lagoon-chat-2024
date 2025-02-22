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
export async function createChat(customerId) {
    try {
        const credentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');

        const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/create_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                customer_id: customerId,
                active: true,
                properties: {
                    source: 'ai_chat'
                },
                group_ids: SKY_LAGOON_GROUPS  // Add this to ensure chat is created in correct groups
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Create chat error response:', errorText);
            throw new Error(`Create chat failed: ${response.status}`);
        }

        const data = await response.json();
        return data.chat_id;

    } catch (error) {
        console.error('Error creating chat:', error.message);
        return null;
    }
}

// Function to transfer chat to human agent
export async function transferChatToAgent(chatId, agentId) {
    try {
        const credentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');

        const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/transfer_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: chatId,
                target: {
                    type: 'agent',
                    ids: [agentId]
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Transfer error response:', errorText);
            throw new Error(`Transfer failed: ${response.status}`);
        }

        return true;

    } catch (error) {
        console.error('Error transferring chat:', error.message);
        return false;
    }
}
