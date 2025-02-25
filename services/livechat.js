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
                'X-Region': 'fra' // Add this X-Region header
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
        
        // Step 3: Send initial message via bot
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
        
        // Step 4: Transfer chat to appropriate group
        console.log('\n🤖 Transferring chat to group:', groupId);
        await fetch('https://api.livechatinc.com/v3.5/agent/action/transfer_chat', {
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
        
        return {
            chat_id: chatData.chat_id,
            bot_token: botToken
        };
    } catch (error) {
        console.error('\n❌ Error in createChat:', error);
        throw error;
    }
}

// Updated sendMessageToLiveChat function
export async function sendMessageToLiveChat(chatId, message, botToken) {
    try {
        console.log('\n🤖 Bot sending message...');
        const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
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

        return true;
    } catch (error) {
        console.error('\n❌ Error sending message to LiveChat:', error);
        return false;
    }
}
