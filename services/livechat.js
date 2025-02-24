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

        // Go back to the routing statuses endpoint that worked
        const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_routing_statuses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                filters: {
                    // Include both groups to maximize agent detection
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
            areAgentsAvailable: true,  // Always say yes to attempt transfer
            availableAgents: [{
                agent_id: 'david@svorumstrax.is',
                status: 'online'
            }],
            agentCount: 1,
            error: error.message
        };
    }
}

// Create chat function
export async function createChat(customerId, isIcelandic = false) {
    try {
        // Create a temporary access token for this customer
        const tokenResponse = await fetch('https://accounts.livechatinc.com/customer/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                licence_id: "12638850",
                client_id: customerId
            })
        });

        const tokenData = await tokenResponse.json();
        console.log('\n🔑 Customer token created:', tokenData);

        // Use the customer token to start a chat
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/customer/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenData.access_token}`
            },
            body: JSON.stringify({
                license_id: "12638850",
                group_id: isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN,
                customer: {
                    name: `User ${customerId}`,
                    email: `${customerId}@skylagoon.com`
                },
                welcome_message: 'Customer requesting assistance with booking change'
            })
        });

        const chatData = await chatResponse.json();
        console.log('\n✅ Chat created with details:', chatData);

        return {
            chat_id: chatData.chat_id,
            customer_token: tokenData.access_token
        };

    } catch (error) {
        console.error('\n❌ Error in createChat:', error);
        throw error;
    }
}

// Add this at the end of livechat.js
export async function sendMessageToLiveChat(chatId, message, customerToken) {
    try {
        // Send message using the customer token
        const response = await fetch('https://api.livechatinc.com/v3.5/customer/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${customerToken}`
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
            console.error('Send message error response:', errorText);
            throw new Error(`Send message failed: ${response.status}`);
        }

        return true;

    } catch (error) {
        console.error('\n❌ Error sending message to LiveChat:', error);
        return false;
    }
}
