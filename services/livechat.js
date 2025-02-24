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
                    group_ids: [groupId]
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        // Filter for our specific agents who are accepting chats
        const availableAgents = data.filter(agent => 
            LIVECHAT_AGENTS.includes(agent.agent_id) && 
            agent.status === 'accepting_chats'
        );

        return {
            areAgentsAvailable: availableAgents.length > 0,
            availableAgents: availableAgents,
            agentCount: availableAgents.length,
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

        // First, create customer identity to get proper customer_id
        const customerResponse = await fetch('https://api.livechatinc.com/v3.5/customer/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`
            },
            body: JSON.stringify({
                license_id: "12638850",
                customer: {
                    name: `User ${customerId}`,
                    email: `${customerId}@skylagoon.com`,
                }
            })
        });

        const customerData = await customerResponse.json();
        console.log('\n👤 Customer created:', customerData);
        
        // Now create the chat using the customer's real ID
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
                customer_id: customerData.customer_id, // Use the real customer ID
                continuous: true,
                active: true,
                properties: {
                    source: {
                        type: "widget",
                        url: isIcelandic ? "https://www.skylagoon.com/is/" : "https://www.skylagoon.com/"
                    },
                    routing: {
                        group_id: groupId,
                        assigned_group: groupId
                    },
                    chat: {
                        access: {
                            group_ids: [groupId] // Explicitly define access
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

        // Send initial customer message using customer's real ID
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
                    author_id: customerData.customer_id, // Use customer's real ID
                    visibility: 'all'
                }
            })
        });

        // Activate the chat explicitly
        await fetch('https://api.livechatinc.com/v3.5/agent/action/activate_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                status: "active"
            })
        });

        return {
            chat_id: chatData.chat_id,
            customer_id: customerData.customer_id
        };

    } catch (error) {
        console.error('\n❌ Error in createChat:', error);
        throw error;
    }
}

export async function transferChatToAgent(chatId, agentId) {
    try {
        const credentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        const groupId = 69; // Default to English

        // Check if agent is available
        const availabilityCheck = await checkAgentAvailability(false);
        if (!availabilityCheck.areAgentsAvailable) {
            throw new Error("No available agents to transfer.");
        }

        // Assign agent with explicit group
        const assignResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/assign_agent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatId,
                agent_id: agentId,
                group_id: groupId
            })
        });

        console.log('\n📡 Agent assignment response:', await assignResponse.text());

        // Keep chat active with a system message
        const messageResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
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

        console.log('\n💬 System message response:', await messageResponse.text());

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
