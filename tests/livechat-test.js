// livechat-test.js
import fetch from 'node-fetch';

// Your credentials
const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e';
const PAT = 'fra:mevbjK3jZjxom9Y9giWv49wpEE4'; // Your fra:... token

async function testLiveChatConnection() {
    try {
        console.log('Testing LiveChat connection...');

        // Create Basic auth credentials (Account ID:PAT)
        const credentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');

        // Using the get_license_info endpoint as it requires no special permissions
        const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_license_info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({})  // Empty object as required by API
        });

        console.log('\nRequest details:');
        console.log('URL:', 'https://api.livechatinc.com/v3.5/agent/action/get_license_info');
        console.log('Method:', 'POST');
        console.log('Headers:', {
            'Content-Type': 'application/json',
            'Authorization': 'Basic [HIDDEN]',
            'X-Region': 'fra'
        });
        console.log('Body:', '{}');
        
        console.log('\nResponse Info:');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        
        // Log all headers
        console.log('\nResponse Headers:');
        for (const [key, value] of response.headers.entries()) {
            console.log(`${key}: ${value}`);
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('\nError Response Body:', errorText);
            try {
                const errorJson = JSON.parse(errorText);
                console.error('Parsed Error:', JSON.stringify(errorJson, null, 2));
            } catch (e) {
                // If it's not JSON, we already logged the raw text
            }
            throw new Error(`API request failed: ${response.status}\nError: ${errorText}`);
        }

        const data = await response.json();
        console.log('\n✅ Successfully connected to LiveChat API');
        console.log('Data:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('\n❌ Error testing LiveChat connection:', error.message);
        if (error.cause) {
            console.error('Cause:', error.cause);
        }
    }
}

// Run the test
console.log('Using Account ID:', ACCOUNT_ID);
console.log('Using PAT (first 10 chars):', PAT.substring(0, 10));
testLiveChatConnection();
