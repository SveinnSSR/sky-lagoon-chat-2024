// tests/livechat-agent-status.js
import fetch from 'node-fetch';

// Your credentials
const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e';
const PAT = 'fra:mevbjK3jZjxom9Y9giWv49wpEE4'; // Your fra:... token
const SKY_LAGOON_GROUPS = [69, 70]; // Sky Lagoon EN and IS groups

async function checkAgentStatus() {
    try {
        console.log('Checking agent status for Sky Lagoon groups...');

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
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status}\nError: ${errorText}`);
        }

        const data = await response.json();
        
        // Filter for human agents (emails, not IDs) who are accepting chats
        const availableAgents = data.filter(agent => 
            agent.agent_id.includes('@') && // Only email addresses (human agents)
            agent.status === 'accepting_chats'
        );

        console.log('\n=== Sky Lagoon Agent Availability ===');
        console.log('\nTotal Agents:', data.length);
        console.log('Available Agents:', availableAgents.length);
        
        if (availableAgents.length > 0) {
            console.log('\nAgents ready for chat:');
            availableAgents.forEach(agent => {
                console.log(`- ${agent.agent_id}`);
            });
        }

        // Return object for use in main chatbot
        return {
            areAgentsAvailable: availableAgents.length > 0,
            availableAgents: availableAgents,
            agentCount: availableAgents.length,
            operatingHours: true, // We'll implement this check later
            shouldOfferTransfer: availableAgents.length > 0
        };

    } catch (error) {
        console.error('\n❌ Error checking agent status:', error.message);
        return null;
    }
}

// Run the test
console.log('Using Account ID:', ACCOUNT_ID);
console.log('Using PAT (first 10 chars):', PAT.substring(0, 10));
checkAgentStatus();
