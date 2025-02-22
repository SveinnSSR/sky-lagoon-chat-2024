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

        // Create a customer with minimal info
        const customerResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/create_customer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                name: `User ${customerId}`
                // Removed session_fields entirely for now
            })
        });

        if (!customerResponse.ok) {
            const errorText = await customerResponse.text();
            console.error('Create customer error response:', errorText);
            throw new Error(`Create customer failed: ${customerResponse.status}`);
        }

        const customerData = await customerResponse.json();
        console.log('\n✅ Customer created:', customerData);  // Added logging

        // Start chat with this customer
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                customer_id: customerData.customer_id,
                active: true,
                group_id: SKY_LAGOON_GROUPS[0]
            })
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('Start chat error response:', errorText);
            throw new Error(`Start chat failed: ${chatResponse.status}`);
        }

        const chatData = await chatResponse.json();
        return chatData.chat_id;

    } catch (error) {
        console.error('Error creating chat:', error.message);
        return null;
    }
}

// Function to transfer chat to human agent
export async function transferChatToAgent(chatId, agentId) {
    try {
        const credentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');

        // First check if agent is already in chat
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

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('Get chat error response:', errorText);
            throw new Error(`Get chat failed: ${chatResponse.status}`);
        }

        const chatData = await chatResponse.json();
        
        // If agent is already in chat, consider it a success
        if (chatData.users?.some(user => user.id === agentId)) {
            return true;
        }

        // If not, transfer the chat
        const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/transfer_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatId,  // Changed from 'id' to 'chat_id'
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

// Add this at the end of livechat.js
export async function sendMessageToLiveChat(chatId, message, customerId) {
    try {
        const credentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
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
                    author_id: customerId
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
        console.error('Error sending message to LiveChat:', error);
        return false;
    }
}
