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
export async function createChat(customerId, isIcelandic = false) {  // Add language parameter
    try {
        const credentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');

        // Create customer with minimal info first
        const customerResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/create_customer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                name: `User ${customerId}`,
                email: `user_${customerId}@temp.com`
            })
        });

        if (!customerResponse.ok) {
            const errorText = await customerResponse.text();
            console.error('Create customer error response:', errorText);
            throw new Error(`Create customer failed: ${customerResponse.status}`);
        }

        const customerData = await customerResponse.json();
        console.log('\n✅ Customer created:', customerData);

        // Select group based on language
        const groupId = isIcelandic ? SKY_LAGOON_GROUPS[1] : SKY_LAGOON_GROUPS[0];
        console.log('\n📋 Using group ID:', groupId);

        // Start chat with more explicit settings
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
                continuous: true,
                assigned_agent: {
                    id: 'david@svorumstrax.is'
                },
                group_id: groupId,
                initial_state: 'chatting',  // Changed from 'open' to 'chatting'
                started_by: 'customer',
                properties: {
                    source: 'chatbot',
                    routing_scope: 'agents',
                    requires_agent_response: true  // Add this
                },
                welcome_message: {
                    text: isIcelandic ? 
                        'Nýtt spjall frá spjallmenni' : 
                        'New chat transfer from chatbot'
                }
            })
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('Start chat error response:', errorText);
            throw new Error(`Start chat failed: ${chatResponse.status}`);
        }

        const chatData = await chatResponse.json();
        console.log('\n✅ Chat created with full details:', chatData);
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
        
        console.log('\n📨 Sending message to LiveChat:', {
            chatId,
            message,
            customerId
        });

        // Use send_event endpoint
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
                    recipients: 'all',
                    visibility: 'all'
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Send message error response:', errorText);
            throw new Error(`Send message failed: ${response.status}`);
        }

        console.log('\n✅ Message sent to LiveChat successfully');
        return true;

    } catch (error) {
        console.error('\n❌ Error sending message to LiveChat:', error);
        return false;
    }
}
