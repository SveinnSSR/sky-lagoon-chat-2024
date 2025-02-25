// create-bot.js
import fetch from 'node-fetch';

// LiveChat credentials
const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e';
const PAT = 'fra:rmSYYwBm3t_PdcnJIOfQf2aQuJc';

// The Client ID from your App Authorization block
const OWNER_CLIENT_ID = 'b4c686ea4c4caa04e6ea921bf45f516f'; 

// Sky Lagoon groups configuration
const SKY_LAGOON_GROUPS = {
    EN: 69,
    IS: 70
};

async function createLiveChatBot() {
    try {
        const credentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        const response = await fetch('https://api.livechatinc.com/v3.5/configuration/action/create_bot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                name: "Sky Lagoon Transfer Bot",
                default_group_priority: "normal",
                groups: [
                    {
                        id: SKY_LAGOON_GROUPS.EN,
                        priority: "normal"
                    },
                    {
                        id: SKY_LAGOON_GROUPS.IS,
                        priority: "normal"
                    }
                ],
                owner_client_id: OWNER_CLIENT_ID
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Bot creation error:', errorText);
            return;
        }

        const data = await response.json();
        console.log("Bot created successfully!");
        console.log("BOT_ID:", data.id);
        console.log("BOT_SECRET:", data.secret);
        
        return data;
    } catch (error) {
        console.error('Error creating bot:', error);
    }
}

// Run the function
createLiveChatBot();
