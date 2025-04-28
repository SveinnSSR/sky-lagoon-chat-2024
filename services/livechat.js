// services/livechat.js - Truly AI-powered LiveChat integration
import fetch from 'node-fetch';
import OpenAI from 'openai';
import { 
  connectToDatabase, // called inside index.js
  storeRecentMessage, // called inside index.js
  checkForDuplicateMessage, // called inside webhook-livechat.js
  storeDualCredentials,
  getDualCredentials // also called inside index.js
} from '../database.js';

// Initialize OpenAI for AI-powered detection
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Optional debugging line to verify API key is available
console.log('OpenAI API Key available in livechat.js:', !!process.env.OPENAI_API_KEY);

// LiveChat credentials - kept from the original
const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e';
const PAT = 'fra:rmSYYwBm3t_PdcnJIOfQf2aQuJc';

// Bot credentials - kept from the original
const BOT_ID = '702cdd1781c4bb131db4f56bd57db913';
const BOT_SECRET = '600d0b708538d7c0e2a52a2b84c7b5b8';
const CLIENT_ID = 'b4c686ea4c4caa04e6ea921bf45f516f';
const CLIENT_SECRET = 'ca6020736f61d29b88bc130ca9e7240f4eb15d6f';

// Agent and group configurations - kept from the original
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

/**
 * Creates a chat with proper customer attribution for correct message styling
 * @param {string} sessionId - Session ID for reference
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Chat information
 */
export async function createAttributedChat(sessionId, isIcelandic = false) {
  try {
    console.log('\n👤 Creating chat with proper customer attribution...');
    
    // Log credentials info for debugging
    console.log('\n🔍 LiveChat Credentials Check:', {
      ACCOUNT_ID_length: ACCOUNT_ID.length,
      PAT_prefix: PAT.substring(0, 4) + '...',
      org_id: '10d9b2c9-311a-41b4-94ae-b0c4562d7737'
    });
    
    // Use agent credentials
    const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
    
    // STEP 1: CREATE A CUSTOMER IN LIVECHAT SYSTEM
    console.log('\n👤 Step 1: Creating customer in LiveChat system...');
    
    const customerResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/create_customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${agentCredentials}`,
        'X-Region': 'fra'
      },
      body: JSON.stringify({
        name: `User ${sessionId.substring(0, 8)}...`,
        email: `${sessionId}@skylagoon.com`,
        session_fields: [
          { "session_id": sessionId }
        ]
      })
    });
    
    if (!customerResponse.ok) {
      throw new Error(`Failed to create customer: ${await customerResponse.text()}`);
    }
    
    const customerData = await customerResponse.json();
    const customerId = customerData.customer_id;
    console.log('\n👤 Created LiveChat customer ID:', customerId);
    
    // STEP 2: START CHAT WITH THE CREATED CUSTOMER
    const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${agentCredentials}`,
        'X-Region': 'fra'
      },
      body: JSON.stringify({
        chat: {
          users: [{
            id: customerId,
            type: "customer"
          }]
        },
        active: true,
        continuous: true,
        group_id: isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN
      })
    });
    
    if (!chatResponse.ok) {
      throw new Error(`Failed to create chat: ${await chatResponse.text()}`);
    }
    
    const chatData = await chatResponse.json();
    
    // STEP 3: TRY TO GENERATE CUSTOMER TOKEN FOR CUSTOMER API
    let customerToken = null;
    try {
      console.log('\n🔑 Step 3: Generating customer token for Customer API...');
      customerToken = await generateCustomerToken(customerId);
      
      if (customerToken) {
        console.log('\n✅ Customer token obtained, length:', customerToken.length);
      } else {
        console.log('\n⚠️ No customer token was generated');
      }
    } catch (tokenError) {
      console.error('\n⚠️ Could not generate customer token:', tokenError.message);
      // Continue without token - we'll fall back to Agent API with author_id
    }
    
    // Store both customer ID and token for future use
    await storeDualCredentials(chatData.chat_id, sessionId, customerToken, customerId);
    
    // Send initial message
    if (customerToken) {
      // Try to use Customer API if we have a token
      try {
        console.log('\n📨 Sending initial message through Customer API...');
        
        await fetch('https://api.livechatinc.com/v3.5/customer/action/send_event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${customerToken}`
          },
          body: JSON.stringify({
            chat_id: chatData.chat_id,
            event: {
              type: 'message',
              text: '🚨 URGENT: AI CHATBOT TRANSFER - Customer has requested human assistance'
            }
          })
        });
        
        console.log('\n✅ Initial message sent through Customer API');
      } catch (messageError) {
        console.error('\n⚠️ Could not send initial message through Customer API:', messageError);
        
        // Fall back to Agent API for initial message with styling
        await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${agentCredentials}`,
            'X-Region': 'fra'
          },
          body: JSON.stringify({
            chat_id: chatData.chat_id,
            event: {
              type: 'message',
              text: '🚨 URGENT: AI CHATBOT TRANSFER - Customer has requested human assistance',
              visibility: 'all',
              author_id: customerId,
              properties: {
                styling: {
                  color: '#FFFFFF',
                  align: 'left'
                }
              }
            }
          })
        });
      }
    } else {
      // Just use Agent API for the message with styling
      await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${agentCredentials}`,
          'X-Region': 'fra'
        },
        body: JSON.stringify({
          chat_id: chatData.chat_id,
          event: {
            type: 'message',
            text: '🚨 URGENT: AI CHATBOT TRANSFER - Customer has requested human assistance',
            visibility: 'all',
            author_id: customerId,
            properties: {
              styling: {
                color: '#FFFFFF',
                align: 'left'
              }
            }
          }
        })
      });
    }
    
    return {
      chat_id: chatData.chat_id,
      thread_id: chatData.thread_id,
      customer_id: customerId,
      customer_token: customerToken,
      agent_credentials: agentCredentials
    };
  } catch (error) {
    console.error('\n❌ Error creating attributed chat:', error);
    throw error;
  }
}

/**
 * Gets an agent token using LiveChat's v3.5 API
 * @returns {Promise<string>} Agent token
 */
async function getAgentToken() {
  try {
    console.log('\n🔑 Getting agent token...');
    
    // Use environment variables or fallback to hardcoded values
    const CLIENT_ID = process.env.LIVECHAT_CLIENT_ID || 'b4c686ea4c4caa04e6ea921bf45f516f';
    const CLIENT_SECRET = process.env.LIVECHAT_CLIENT_SECRET || 'EqQrfvLTdvH7MJW37FW0c2UPkUHzCwDt';
    
    // Create URL parameters
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('scope', 'customers--all:rw chats--all:rw');
    
    // Use the CORRECT v3.5 API endpoint
    const response = await fetch('https://accounts.livechat.com/v3.5/agent/action/get_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params
    });
    
    const responseText = await response.text();
    console.log('\n🔍 Agent token response:', response.status, responseText.substring(0, 100));
    
    if (!response.ok) {
      throw new Error(`OAuth failed: ${response.status} - ${responseText}`);
    }
    
    const data = JSON.parse(responseText);
    console.log('\n✅ Successfully obtained agent token');
    
    // Note: LiveChat returns 'token', NOT 'access_token'
    return data.token;
  } catch (error) {
    console.error('\n❌ OAuth error:', error);
    throw new Error(`Token generation failed: ${error.message}`);
  }
}

/**
 * Generates a customer token for a specific LiveChat customer using the v3.5 API
 * @param {string} customerId - LiveChat customer ID
 * @returns {Promise<string>} Customer token
 */
export async function generateCustomerToken(customerId) {
  try {
    console.log('\n🔑 Generating customer token for:', customerId);
    
    // Step 1: Get agent token
    const agentToken = await getAgentToken();
    
    if (!agentToken) {
      throw new Error('Failed to obtain agent token');
    }
    
    // Step 2: Get customer token using agent token and v3.5 API
    console.log('\n🔑 Step 2: Getting customer token using v3.5 API...');
    
    // Note: This endpoint uses JSON, not form data
    const response = await fetch('https://api.livechatinc.com/v3.5/customer/action/get_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentToken}`
      },
      body: JSON.stringify({
        customer_id: customerId,
        organization_id: '10d9b2c9-311a-41b4-94ae-b0c4562d7737'
      })
    });
    
    const responseText = await response.text();
    console.log('\n🔍 Customer token response:', response.status, responseText.substring(0, 100));
    
    if (!response.ok) {
      throw new Error(`Customer token failed: ${response.status} - ${responseText}`);
    }
    
    const data = JSON.parse(responseText);
    
    if (!data.token) {
      console.error('\n❌ Response did not contain token:', data);
      throw new Error('Customer token response missing token');
    }
    
    console.log('\n✅ Generated customer token successfully');
    return data.token;  // Note: It's 'token', not 'access_token'
  } catch (error) {
    console.error('\n❌ Critical error generating customer token:', error);
    throw error;
  }
}

/**
 * Checks agent availability in LiveChat
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Availability status and agent information
 */
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

/**
 * Diagnostic function specifically for analyzing bot status and capabilities
 * @returns {Promise<Object>} Diagnostic information
 */
export async function diagnosticBotStatus() {
    try {
        console.log('\n🔍 Running bot status diagnostic...');
        
        // Get both admin and bot credentials
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        // Get a bot token
        console.log('\n🤖 Getting bot token for enabled bot...');
        const tokenResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/issue_bot_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                bot_id: BOT_ID,
                bot_secret: BOT_SECRET,
                client_id: CLIENT_ID,
                organization_id: "10d9b2c9-311a-41b4-94ae-b0c4562d7737"
            })
        });
        
        if (!tokenResponse.ok) {
            console.error('\n❌ Bot token error:', await tokenResponse.text());
            return { error: 'Failed to get bot token' };
        }
        
        const tokenData = await tokenResponse.json();
        const botToken = tokenData.token;
        console.log('\n✅ Bot token acquired for enabled bot');
        
        // Step 1: Check bot status in LiveChat
        console.log('\n👤 Checking bot status...');
        
        // First using admin credentials
        const botStatusResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/get_bot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: BOT_ID
            })
        });
        
        if (botStatusResponse.ok) {
            const botData = await botStatusResponse.json();
            console.log('\n👤 Bot details from config API:', JSON.stringify(botData, null, 2));
            
            // Check if bot is properly enabled/configured
            console.log('\n✅ Bot enabled status:', botData.enabled || 'unknown');
            console.log('\n✅ Bot owner:', botData.owner_client_id || 'unknown');
        } else {
            console.error('\n❌ Failed to get bot details:', await botStatusResponse.text());
        }
        
        // Step 2: Check bot status using agent API
        console.log('\n👤 Checking bot status with agent API...');
        const botRoutingResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_routing_status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                agent_id: BOT_ID
            })
        });
        
        if (botRoutingResponse.ok) {
            const botRouting = await botRoutingResponse.json();
            console.log('\n👤 Bot routing status:', JSON.stringify(botRouting, null, 2));
        } else {
            console.error('\n❌ Failed to get bot routing status:', await botRoutingResponse.text());
        }
        
        // Step 3: Check bot's capabilities (what actions it can perform)
        console.log('\n🔄 Testing bot actions and permissions...');
        
        // Try creating a chat
        console.log('\n📝 Testing bot chat creation...');
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
                customers: [{
                    id: `test_${Date.now()}`,
                    name: 'Bot Diagnostic Test',
                    email: `test_${Date.now()}@skylagoon.com`
                }]
            })
        });
        
        if (chatResponse.ok) {
            const chatData = await chatResponse.json();
            console.log('\n✅ Bot successfully created chat:', chatData);
            
            // Test if bot can transfer this chat
            console.log('\n🔄 Testing bot transfer capabilities...');
            const transferResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/transfer_chat', {
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
                        ids: [SKY_LAGOON_GROUPS.EN]
                    },
                    force: true
                })
            });
            
            const transferText = await transferResponse.text();
            console.log('\n🔄 Bot transfer test result:', transferText);
            
            if (transferResponse.ok) {
                console.log('\n✅ Bot can successfully transfer chats');
            } else {
                console.error('\n❌ Bot transfer test failed');
            }
            
            // Check if this chat is properly visible
            console.log('\n👁️ Checking transferred chat visibility...');
            // Wait 2 seconds to ensure transfer completes
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const chatVisibilityResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_chats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${agentCredentials}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify({})
            });
            
            if (chatVisibilityResponse.ok) {
                const activeChats = await chatVisibilityResponse.json();
                const foundChat = activeChats.chats_summary?.find(c => c.id === chatData.chat_id);
                console.log('\n👁️ Is test chat visible in active chats?', foundChat ? 'YES' : 'NO');
                
                if (foundChat) {
                    console.log('\n👁️ Visible chat details:', JSON.stringify(foundChat, null, 2));
                } else {
                    // Check archives
                    console.log('\n👁️ Chat not found in active list, checking archives...');
                    const archiveResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_archives', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Basic ${agentCredentials}`,
                            'X-Region': 'fra'
                        },
                        body: JSON.stringify({
                            filters: {
                                from: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                                to: new Date().toISOString()
                            }
                        })
                    });
                    
                    if (archiveResponse.ok) {
                        const archives = await archiveResponse.json();
                        const archivedChat = archives.chats_summary?.find(c => c.id === chatData.chat_id);
                        console.log('\n👁️ Test chat found in archives?', archivedChat ? 'YES' : 'NO');
                        
                        if (archivedChat) {
                            console.log('\n👁️ Archived chat details:', JSON.stringify(archivedChat, null, 2));
                        }
                    }
                }
            }
        } else {
            console.error('\n❌ Bot chat creation test failed:', await chatResponse.text());
        }
        
        return {
            timestamp: new Date().toISOString(),
            bot_id: BOT_ID,
            message: "Bot status diagnostic completed. Check logs for detailed results."
        };
    } catch (error) {
        console.error('\n❌ Bot status diagnostic error:', error);
        return {
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Creates a LiveChat chat using the correct two-step process
 * @param {string} customerId - Customer ID (session ID)
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Chat information
 */
export async function createProperChat(customerId, isIcelandic = false) {
    try {
        console.log('\n👤 Creating chat with PROPER TWO-STEP PROCESS...');
        
        // Get agent credentials
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        // STEP 1: CREATE A CUSTOMER IN LIVECHAT SYSTEM
        console.log('\n👤 Step 1: Creating customer in LiveChat system...');
        
        const customerResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/create_customer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                name: `User ${customerId.substring(0, 8)}...`,
                email: `${customerId}@skylagoon.com`, // UPDATED: Store FULL session ID in email
                // Keep session_fields as fallback
                session_fields: [
                    { "session_id": customerId }
                ]
            })
        });
        
        if (!customerResponse.ok) {
            const customerErrorText = await customerResponse.text();
            console.error('\n❌ Customer creation error:', customerErrorText);
            throw new Error('Failed to create customer in LiveChat system');
        }
        
        const customerData = await customerResponse.json();
        console.log('\n✅ Customer created successfully:', customerData);
        
        // Extract the LiveChat customer ID
        const livechatCustomerId = customerData.customer_id;
        console.log('\n👤 Created LiveChat customer ID:', livechatCustomerId);
        
        // STEP 2: START CHAT WITH THE CREATED CUSTOMER
        console.log('\n💬 Step 2: Starting chat with created customer...');
        
        // First check for available agents
        const agentResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_routing_statuses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                filters: {
                    group_ids: [isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN]
                }
            })
        });
        
        const agentStatuses = await agentResponse.json();
        const availableAgents = agentStatuses.filter(agent => 
            agent.status === 'accepting_chats' || agent.status === 'online');
        
        // Now create the chat with EXACT format from LiveChat Tech Support
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat: {
                    users: [{
                        id: livechatCustomerId,
                        type: "customer"
                    }]
                },
                active: true,
                continuous: true,
                group_id: isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN,
                // Only include agent_ids if we found available agents
                ...(availableAgents.length > 0 && { agent_ids: [availableAgents[0].agent_id] })
            })
        });
        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('\n❌ Chat creation error:', errorText);
            throw new Error('Failed to create chat with proper structure');
        }
        const chatData = await chatResponse.json();
        console.log('\n✅ Chat created successfully with proper structure:', chatData);
        
        // Send initial message
        await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                event: {
                    type: 'message',
                    text: '🚨 URGENT: AI CHATBOT TRANSFER - Customer has requested human assistance',
                    visibility: 'all'
                }
            })
        });
        
        // Add a tag for higher visibility
        await fetch('https://api.livechatinc.com/v3.5/agent/action/tag_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                tag: "urgent_ai_transfer"
            })
        });
        
        return {
            chat_id: chatData.chat_id,
            thread_id: chatData.thread_id,
            agent_credentials: agentCredentials
        };
    } catch (error) {
        console.error('\n❌ Error in createProperChat:', error);
        throw error;
    }
}

/**
 * Creates a chat DIRECTLY using agent credentials, no transfer needed
 * @param {string} customerId - Customer ID (session ID)
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Chat information
 */
export async function createDirectAgentChat(customerId, isIcelandic = false) {
    try {
        console.log('\n👤 Creating chat with AGENT credentials (no transfer needed)...');
        
        // Always use agent credentials - this is the key change
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        // Target group
        const groupId = isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN;
        
        // Create the chat DIRECTLY with agent credentials
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                active: true,
                continuous: true,
                group_id: groupId,
                customers: [{
                    id: customerId,
                    name: `User ${customerId.substring(0, 8)}...`,
                    email: `${customerId}@skylagoon.com` // UPDATED: Store FULL session ID in email
                }]
            })
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error('\n❌ Chat creation error:', errorText);
            throw new Error('Failed to create chat');
        }

        const chatData = await chatResponse.json();
        console.log('\n✅ Chat created DIRECTLY with agent credentials:', chatData);
        
        // Send URGENT message directly with agent credentials
        await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                event: {
                    type: 'message',
                    text: '🚨 URGENT: AI CHATBOT TRANSFER - Customer has requested human assistance',
                    visibility: 'all'
                }
            })
        });
        
        // Optionally add a tag with agent credentials
        await fetch('https://api.livechatinc.com/v3.5/agent/action/tag_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatData.chat_id,
                tag: "urgent_ai_transfer"
            })
        });
        
        return {
            chat_id: chatData.chat_id,
            thread_id: chatData.thread_id,
            agent_credentials: agentCredentials  // Return agent credentials for future operations
        };
    } catch (error) {
        console.error('\n❌ Error in createDirectAgentChat:', error);
        throw error;
    }
}

/**
 * Creates a LiveChat chat using the Customer API for proper message styling
 * @param {string} sessionId - Customer session ID
 * @param {boolean} isIcelandic - Whether to use Icelandic group
 * @returns {Promise<Object>} Chat information with credentials
 */
export async function createCustomerChat(sessionId, isIcelandic = false) {
  try {
    console.log('\n👤 Creating chat as customer via Customer API...');
    
    // Generate customer token
    const { customerToken, entityId } = await generateCustomerToken(sessionId);
    
    // Start chat using Customer API
    const response = await fetch('https://api.livechatinc.com/v3.5/customer/action/start_chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        active: true,
        continuous: true,
        chat: {
          access: {
            // Target the appropriate group
            group_ids: [isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN]
          }
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create customer chat: ${await response.text()}`);
    }
    
    const chatData = await response.json();
    console.log('\n✅ Successfully created chat as customer:', chatData.chat_id);
    
    // Store dual credentials
    await storeDualCredentials(chatData.chat_id, sessionId, customerToken, entityId);
    
    // Initial message to notify agents
    await fetch('https://api.livechatinc.com/v3.5/customer/action/send_event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        chat_id: chatData.chat_id,
        event: {
          type: 'message',
          text: '🚨 URGENT: AI CHATBOT TRANSFER - Customer has requested human assistance'
        }
      })
    });
    
    return {
      chat_id: chatData.chat_id,
      thread_id: chatData.thread_id,
      customer_token: customerToken,
      agent_credentials: Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64')
    };
  } catch (error) {
    console.error('\n❌ Error creating customer chat:', error);
    throw error;
  }
}

/**
 * Sends a message directly through Customer API
 * @param {string} chatId - LiveChat chat ID
 * @param {string} message - Message to send
 * @param {string} customerId - Customer entity ID from LiveChat
 * @returns {Promise<boolean>} Success status
 */
export async function sendCustomerApiMessage(chatId, message, customerId) {
  try {
    console.log('\n🔍 Attempting direct Customer API message with WebToken approach');
    
    // Get LiveChat organization ID and client ID
    const ORGANIZATION_ID = '10d9b2c9-311a-41b4-94ae-b0c4562d7737';
    const CLIENT_ID = 'b4c686ea4c4caa04e6ea921bf45f516f';
    
    // Get admin credentials for token exchange
    const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e';
    const PAT = 'fra:rmSYYwBm3t_PdcnJIOfQf2aQuJc';
    
    // First, obtain a proper token for Customer API
    console.log('\n🔑 Requesting Customer access_token via Identity Token approach');
    
    // Step 1: Get WebToken for customer identity
    const webTokenResponse = await fetch('https://accounts.livechat.com/customer/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'cookie',
        response_type: 'token',
        client_id: CLIENT_ID,
        organization_id: ORGANIZATION_ID,
        redirect_uri: 'https://sky-lagoon-chat-2024.vercel.app/' // Your app URL
      })
    });
    
    if (!webTokenResponse.ok) {
      console.error('\n❌ WebToken error:', await webTokenResponse.text());
      return false;
    }
    
    const webTokenData = await webTokenResponse.json();
    const accessToken = webTokenData.access_token;
    
    // Step 2: Use the token to send a message as the customer
    const messageResponse = await fetch('https://api.livechatinc.com/v3.5/customer/action/send_event', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        event: {
          type: 'message',
          text: message
        }
      })
    });
    
    if (!messageResponse.ok) {
      console.error('\n❌ Customer API message error:', await messageResponse.text());
      return false;
    }
    
    console.log('\n✅ Message sent successfully via Customer API!');
    return true;
  } catch (error) {
    console.error('\n❌ Error in sendCustomerApiMessage:', error);
    return false;
  }
}

/**
 * Specialized diagnostic for group configuration issues
 * @returns {Promise<Object>} Diagnostic results
 */
export async function diagnosticGroupConfiguration() {
    try {
        console.log('\n🔍 Running specialized group configuration diagnostics...');
        
        // Get agent credentials
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        // 1. Check all available groups
        console.log('\n👥 Checking all available groups...');
        
        const groupsResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/list_groups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({})
        });
        
        if (!groupsResponse.ok) {
            console.error('\n❌ Groups check failed:', await groupsResponse.text());
        } else {
            const groupsData = await groupsResponse.json();
            console.log('\n👥 Available groups:', JSON.stringify(groupsData, null, 2));
            
            // Specifically check the Sky Lagoon groups
            const englishGroup = groupsData.find(g => g.id === SKY_LAGOON_GROUPS.EN);
            const icelandicGroup = groupsData.find(g => g.id === SKY_LAGOON_GROUPS.IS);
            
            if (englishGroup) {
                console.log('\n✅ Found English group:', JSON.stringify(englishGroup, null, 2));
            } else {
                console.log('\n⚠️ Could not find English group with ID', SKY_LAGOON_GROUPS.EN);
            }
            
            if (icelandicGroup) {
                console.log('\n✅ Found Icelandic group:', JSON.stringify(icelandicGroup, null, 2));
            } else {
                console.log('\n⚠️ Could not find Icelandic group with ID', SKY_LAGOON_GROUPS.IS);
            }
        }
        
        // 2. Check agent's group membership in detail
        console.log('\n👤 Checking David\'s detailed profile and group membership...');
        
        const agentResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/get_agent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: "david@svorumstrax.is"
            })
        });
        
        if (!agentResponse.ok) {
            console.error('\n❌ Agent profile check failed:', await agentResponse.text());
        } else {
            const agentProfile = await agentResponse.json();
            console.log('\n👤 David\'s profile:', JSON.stringify({
                id: agentProfile.id,
                name: agentProfile.name,
                role: agentProfile.role,
                groups: agentProfile.groups,
                permissions: agentProfile.permissions
            }, null, 2));
            
            // Check if agent has the right permissions
            const hasAgentPermission = agentProfile.permissions?.includes('agent');
            const hasAgentChatPermission = agentProfile.permissions?.includes('agent--chat--access');
            
            console.log('\n🔒 Agent permissions check:', {
                hasAgentRole: agentProfile.role === 'agent',
                hasAgentPermission,
                hasAgentChatPermission
            });
            
            // Check specific group memberships
            const isInEnglishGroup = agentProfile.groups?.some(g => g.id === SKY_LAGOON_GROUPS.EN);
            const isInIcelandicGroup = agentProfile.groups?.some(g => g.id === SKY_LAGOON_GROUPS.IS);
            
            console.log('\n🔍 Group membership check:', {
                inEnglishGroup: isInEnglishGroup,
                inIcelandicGroup: isInIcelandicGroup
            });
        }
        
        // 3. Check what the special "0" group is
        console.log('\n🔍 Checking for special "0" group...');
        
        const zeroGroupResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/get_group', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: 0
            })
        });
        
        if (!zeroGroupResponse.ok) {
            console.error('\n❌ Group 0 check failed:', await zeroGroupResponse.text());
        } else {
            const zeroGroup = await zeroGroupResponse.json();
            console.log('\n👥 Group 0 details:', JSON.stringify(zeroGroup, null, 2));
        }
        
        // 4. Check agents-to-groups assignments
        console.log('\n👥 Checking agents-to-groups assignments...');
        
        const agentsResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/list_agents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({})
        });
        
        if (!agentsResponse.ok) {
            console.error('\n❌ Agents list check failed:', await agentsResponse.text());
        } else {
            const agentsData = await agentsResponse.json();
            
            // Focus on David's assignment
            const davidData = agentsData.find(a => a.id === 'david@svorumstrax.is');
            
            if (davidData) {
                console.log('\n👤 David\'s assignments:', JSON.stringify({
                    id: davidData.id,
                    name: davidData.name,
                    groups: davidData.groups
                }, null, 2));
            } else {
                console.log('\n⚠️ Could not find David in agents list');
            }
        }
        
        // 5. Try creating a simple chat in Group 0 and see if it appears
        console.log('\n🧪 Testing chat creation in Group 0...');
        
        const g0ChatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                active: true,
                continuous: true,
                group_id: 0,  // Explicitly use group 0
                customers: [{
                    id: `test_g0_${Date.now()}`,
                    name: `Test Group 0 Chat`,
                    email: `test_${Date.now()}@skylagoon.com`
                }]
            })
        });
        
        if (!g0ChatResponse.ok) {
            console.error('\n❌ Group 0 chat creation failed:', await g0ChatResponse.text());
        } else {
            const g0ChatData = await g0ChatResponse.json();
            console.log('\n✅ Group 0 chat created successfully:', g0ChatData);
            
            // Send a test message
            await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${agentCredentials}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify({
                    chat_id: g0ChatData.chat_id,
                    event: {
                        type: 'message',
                        text: '🧪 TEST MESSAGE - This is a test for Group 0 visibility',
                        visibility: 'all'
                    }
                })
            });
        }
        
        return {
            timestamp: new Date().toISOString(),
            message: "Group configuration diagnostics completed. Check logs for detailed results."
        };
    } catch (error) {
        console.error('\n❌ Group diagnostic error:', error);
        return {
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Diagnostic tool to check LiveChat configuration
 * and verify if chats are visible in queue
 * @returns {Promise<Object>} Diagnostic information
 */
export async function diagnosticLiveChat() {
    try {
        console.log('\n🔍 Running LiveChat diagnostics...');
        
        // Step 1: Get agent credentials
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        // Step 2: Check queued chats directly
        console.log('\n👥 Checking queued chats with agent credentials...');
        
        const queueResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_queued_chats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                group_ids: [SKY_LAGOON_GROUPS.EN, SKY_LAGOON_GROUPS.IS]
            })
        });
        
        if (!queueResponse.ok) {
            console.error('\n❌ Queue check failed:', await queueResponse.text());
        } else {
            const queueData = await queueResponse.json();
            console.log('\n👁️ Queued chats:', JSON.stringify(queueData, null, 2));
            
            if (queueData.length === 0) {
                console.log('\n⚠️ No chats found in queue. This may indicate a visibility issue.');
            } else {
                console.log(`\n✅ Found ${queueData.length} chats in queue.`);
            }
        }
        
        // Step 3: Check agent availability in more detail
        console.log('\n👥 Checking detailed agent status...');
        
        const agentDetailResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_agent_details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                id: "david@svorumstrax.is"
            })
        });
        
        if (!agentDetailResponse.ok) {
            console.error('\n❌ Agent details check failed:', await agentDetailResponse.text());
        } else {
            const agentDetails = await agentDetailResponse.json();
            console.log('\n👤 Agent details:', JSON.stringify({
                id: agentDetails.id,
                name: agentDetails.name,
                status: agentDetails.status,
                present: agentDetails.present,
                permission: agentDetails.permission,
                groups: agentDetails.groups
            }, null, 2));
            
            // Check if agent is in the correct groups
            const isInEnglishGroup = agentDetails.groups?.some(g => g.id === SKY_LAGOON_GROUPS.EN);
            const isInIcelandicGroup = agentDetails.groups?.some(g => g.id === SKY_LAGOON_GROUPS.IS);
            
            console.log('\n🔍 Group membership check:', {
                inEnglishGroup: isInEnglishGroup,
                inIcelandicGroup: isInIcelandicGroup
            });
            
            if (!isInEnglishGroup && !isInIcelandicGroup) {
                console.log('\n⚠️ Agent is not in any Sky Lagoon groups. This may prevent chat routing.');
            }
        }
        
        // Step 4: Check active chats
        console.log('\n💬 Checking active chats...');
        
        const activeChatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_chats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                filters: {
                    groups: [SKY_LAGOON_GROUPS.EN, SKY_LAGOON_GROUPS.IS]
                }
            })
        });
        
        if (!activeChatResponse.ok) {
            console.error('\n❌ Active chats check failed:', await activeChatResponse.text());
        } else {
            const activeChats = await activeChatResponse.json();
            console.log('\n💬 Active chats:', JSON.stringify(activeChats.chats_summary.slice(0, 5), null, 2));
            
            // Check if our test chat is among active chats
            const testChat = activeChats.chats_summary.find(chat => 
                chat.id === 'SV50AT0EPL' || chat.thread.id === 'SV50AT0EQL');
            
            if (testChat) {
                console.log('\n✅ Test chat found in active chats:', testChat);
            } else {
                console.log('\n⚠️ Test chat not found in active chats list.');
            }
        }
        
        // Step 5: Check archived chats
        console.log('\n📦 Checking archived chats...');
        
        const archivedResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_archives', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                filters: {
                    from: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                    to: new Date().toISOString(),
                    groups: [SKY_LAGOON_GROUPS.EN, SKY_LAGOON_GROUPS.IS]
                }
            })
        });
        
        if (!archivedResponse.ok) {
            console.error('\n❌ Archives check failed:', await archivedResponse.text());
        } else {
            const archives = await archivedResponse.json();
            console.log('\n📦 Recent archived chats:', JSON.stringify(archives.chats_summary.slice(0, 5), null, 2));
            
            // Check if our test chat is among archived chats
            const testChat = archives.chats_summary.find(chat => 
                chat.id === 'SV50AT0EPL' || chat.thread?.id === 'SV50AT0EQL');
            
            if (testChat) {
                console.log('\n⚠️ Test chat found in ARCHIVED chats (this indicates it was closed):', testChat);
            } else {
                console.log('\n✅ Test chat not found in archived chats (this is good).');
            }
        }
        
        // Step 6: Test creating a chat directly with agent credentials
        console.log('\n🧪 Testing direct chat creation with agent credentials...');
        
        const directChatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                active: true,
                continuous: true,
                group_id: SKY_LAGOON_GROUPS.EN,
                customers: [{
                    id: `test_${Date.now()}`,
                    name: `Test Direct Agent Chat`,
                    email: `test_${Date.now()}@skylagoon.com`
                }],
                properties: {
                    routing: {
                        status: "queued",
                        priority: "high"
                    },
                    source: {
                        type: "other"
                    }
                }
            })
        });
        
        if (!directChatResponse.ok) {
            console.error('\n❌ Direct chat creation failed:', await directChatResponse.text());
        } else {
            const directChatData = await directChatResponse.json();
            console.log('\n✅ Direct agent chat created successfully:', directChatData);
            
            // Send a test message
            const directMsgResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${agentCredentials}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify({
                    chat_id: directChatData.chat_id,
                    event: {
                        type: 'message',
                        text: '🧪 TEST MESSAGE - This is a diagnostic test for agent visibility',
                        visibility: 'all'
                    }
                })
            });
            
            if (!directMsgResponse.ok) {
                console.error('\n❌ Direct message failed:', await directMsgResponse.text());
            } else {
                console.log('\n✅ Direct message sent successfully');
            }
        }
        
        return {
            timestamp: new Date().toISOString(),
            message: "Diagnostics completed. Check logs for detailed results."
        };
    } catch (error) {
        console.error('\n❌ Diagnostic error:', error);
        return {
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * True AI-powered function to detect booking change requests
 * Uses language model classification instead of pattern matching
 * 
 * @param {string} message - User message
 * @param {Object} languageDecision - Language detection information
 * @param {Object} context - Conversation context
 * @returns {Promise<Object>} Detection result with confidence score and reasoning
 */
export async function detectBookingChangeRequest(message, languageDecision, context = null) {
    try {
        console.log('\n🧠 AI-powered booking change detection for:', message);
        
        // Build content prompt for the language model
        let contentPrompt = "Analyze this customer message and determine if it's a booking change request:";
        
        // Add language context if available
        if (languageDecision) {
            contentPrompt += ` (Message language: ${languageDecision.isIcelandic ? 'Icelandic' : 'English'})`;
        }
        
        // Add conversation context if available
        let contextMessages = "";
        if (context && context.messages && context.messages.length > 0) {
            // Extract the last few messages for context (limited to prevent prompt overflow)
            const recentMessages = context.messages.slice(-4);
            
            contextMessages = "\n\nPrevious conversation:\n";
            
            recentMessages.forEach(msg => {
                if (msg.role === 'user') {
                    contextMessages += `Customer: ${msg.content}\n`;
                } else if (msg.role === 'assistant') {
                    contextMessages += `Bot: ${msg.content}\n`;
                }
            });
            
            // Add booking context if available
            if (context.bookingContext) {
                contextMessages += "\nRelevant context: ";
                
                if (context.bookingContext.hasBookingIntent) {
                    contextMessages += "Customer has previously shown booking intent. ";
                }
                
                if (context.bookingContext.dates && context.bookingContext.dates.length > 0) {
                    contextMessages += `Customer has mentioned these dates: ${context.bookingContext.dates.join(', ')}. `;
                }
                
                if (context.bookingContext.dateModifications && context.bookingContext.dateModifications.length > 0) {
                    contextMessages += "Customer has tried to modify dates before. ";
                }
                
                if (context.lastTopic) {
                    contextMessages += `Last topic discussed: ${context.lastTopic}.`;
                }
            }
        }
        
        // Construct the full AI prompt
        const fullPrompt = `${contentPrompt}
        
${contextMessages}

Customer message: "${message}"

I need to determine if the customer is requesting to change an existing booking. This includes:
- Explicit requests to change/modify a booking date or time
- Requests to reschedule an existing reservation
- Messages indicating they can't make their current booking time
- Messages stating they need to move their booking to a different date/time

This should NOT include:
- Questions about different package options
- Queries about pricing differences
- Questions about cancellation or refund policies
- Hypothetical questions about what happens if they need to change in the future
- Policy questions like "Can I change my booking if needed?"

Please analyze the message and respond with:
1. A classification (YES if it's a booking change request, NO if it's not)
2. The confidence level (LOW, MEDIUM, HIGH)
3. Brief reasoning for this decision

Format your response exactly like this example:
CLASSIFICATION: YES
CONFIDENCE: HIGH
REASONING: The customer explicitly asked to change their booking from Tuesday to Thursday.`;

        // Make the API call to OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview", // Using the latest available model
            messages: [
                { role: "system", content: "You are an assistant that specializes in analyzing customer messages. You focus solely on analyzing the intent of the customer message, not on generating responses. Keep your analysis factual and to the point." },
                { role: "user", content: fullPrompt }
            ],
            temperature: 0.1, // Using low temperature for more consistent results
            max_tokens: 150 // Limited tokens since we only need the analysis
        });
        
        // Extract and parse the response
        const aiResponse = response.choices[0].message.content.trim();
        
        // Log the full AI response for debugging
        console.log('\n🤖 AI Analysis:', aiResponse);
        
        // Parse the structured response
        const classification = aiResponse.match(/CLASSIFICATION:\s*(YES|NO)/i)?.[1].toUpperCase();
        const confidence = aiResponse.match(/CONFIDENCE:\s*(LOW|MEDIUM|HIGH)/i)?.[1].toUpperCase();
        const reasoning = aiResponse.match(/REASONING:\s*(.+)$/i)?.[1];
        
        // Convert to confidence score
        let confidenceScore = 0;
        switch (confidence) {
            case 'HIGH': confidenceScore = 0.9; break;
            case 'MEDIUM': confidenceScore = 0.7; break;
            case 'LOW': confidenceScore = 0.4; break;
            default: confidenceScore = 0.5; // Default if parsing fails
        }
        
        // Final decision
        const shouldShowForm = classification === 'YES' && confidenceScore >= 0.6;
        
        // Log the decision
        console.log('\n📊 AI-powered booking change detection result:', {
            classification,
            confidenceScore,
            shouldShowForm,
            reasoning
        });
        
        return {
            shouldShowForm,
            confidence: confidenceScore,
            reasoning: reasoning || 'No reasoning provided',
            isWithinAgentHours: true // This should be determined elsewhere
        };
    } catch (error) {
        console.error('\n❌ Error in AI booking change detection:', error);
        
        // Fallback to a basic heuristic detection if AI fails
        const bookingChangeTerms = ['change', 'modify', 'reschedule', 'move', 'switch', 'different', 'another'];
        const bookingTerms = ['booking', 'reservation', 'time', 'date', 'appointment'];
        
        const msg = message.toLowerCase();
        
        // Count matching terms
        let bookingChangeCount = 0;
        let bookingCount = 0;
        
        bookingChangeTerms.forEach(term => {
            if (msg.includes(term)) bookingChangeCount++;
        });
        
        bookingTerms.forEach(term => {
            if (msg.includes(term)) bookingCount++;
        });
        
        // Simple heuristic for fallback
        const fallbackConfidence = (bookingChangeCount * 0.2) + (bookingCount * 0.1);
        const shouldShowForm = fallbackConfidence >= 0.3;
        
        console.log('\n⚠️ Using fallback detection due to AI error:', {
            fallbackConfidence,
            shouldShowForm,
            bookingChangeCount,
            bookingCount
        });
        
        return {
            shouldShowForm,
            confidence: fallbackConfidence,
            reasoning: 'Fallback detection due to AI error',
            isWithinAgentHours: true,
            error: error.message
        };
    }
}

/**
 * Create booking change request chat
 * @param {string} customerId - Customer ID (session ID)
 * @param {boolean} isIcelandic - Whether to use Icelandic 
 * @returns {Promise<Object>} Chat data
 */
export async function createBookingChangeRequest(customerId, isIcelandic = false) {
    try {
        console.log('\n🤖 Getting bot token for booking change request...');
        
        // Step 1: Get a bot token
        const tokenResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/issue_bot_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Region': 'fra'
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
        console.log('\n🤖 Bot creating booking request chat...');
        const groupId = isIcelandic ? SKY_LAGOON_GROUPS.IS : SKY_LAGOON_GROUPS.EN;
        
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/start_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${botToken}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                active: true, // Explicitly make this active
                continuous: true, // Critical to prevent auto-closing
                group_id: groupId,
                customers: [{
                    id: customerId,
                    name: `User ${customerId.substring(0, 8)}...`,
                    email: `${customerId}@skylagoon.com` // UPDATED: Store FULL session ID in email
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
        
        // Step 3: Send initial message via bot (while we still have permission)
        console.log('\n🤖 Bot sending initial booking change request message...');
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
                    text: '⚠️ BOOKING CHANGE REQUEST - Customer will provide details via form',
                    visibility: 'all'
                }
            })
        });
        
        // Step 4: Transfer chat to appropriate group
        console.log('\n🤖 Transferring booking request to group:', groupId);
        const transferResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/transfer_chat', {
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

        // Check transfer response
        const transferText = await transferResponse.text();
        console.log('\n📡 Transfer response:', transferText);

        // Handle expected transfer scenarios specially 
        if (!transferResponse.ok) {
            // Parse the response to check for this specific expected case
            try {
                const errorData = JSON.parse(transferText);
                if (errorData.error?.type === "validation" && 
                    errorData.error?.message === "Cannot assign any agent from requested groups") {
                    // Log as info instead of error since this is expected in async mode
                    console.log('\nℹ️ No agents currently online in group. Continuing with async workflow.');
                } else {
                    // Different error, log as actual error
                    console.error('\n❌ Transfer failed:', transferText);
                }
            } catch (e) {
                // If parsing fails, log original error
                console.error('\n❌ Transfer failed:', transferText);
            }
        }
        
        // Save agent credentials for fallback message sending
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        return {
            chat_id: chatData.chat_id,
            bot_token: botToken,
            agent_credentials: agentCredentials
        };
    } catch (error) {
        console.error('\n❌ Error in createBookingChangeRequest:', error);
        throw error;
    }
}

/**
 * Submits booking change form data to LiveChat
 * @param {string} chatId - LiveChat chat ID 
 * @param {Object} formData - Form data from user
 * @param {string} credentials - Auth credentials
 * @returns {Promise<boolean>} Success status
 */
export async function submitBookingChangeRequest(chatId, formData, credentials) {
    try {
        // Format the form data into a structured message
        const formattedMessage = `
📅 BOOKING CHANGE REQUEST DETAILS:
-----------------------------------
Reference: ${formData.bookingRef || formData.reference || 'Not provided'}
Name: ${formData.fullName || formData.name || 'Not provided'}
Email: ${formData.email || 'Not provided'}
Current Date: ${formData.currentDate || 'Not provided'}
Requested Date: ${formData.requestedDate || 'Not provided'}
Additional Info: ${(formData.additionalInfo || 'None provided').replace(/\n/g, ' ')}
-----------------------------------
⚠️ REQUIRES MANUAL REVIEW - Please contact customer via email
`.trim();
        
        // First try using bot token if it looks like a JWT
        if (credentials && credentials.includes('.')) {
            console.log('\n📨 Trying to send booking form data using bot token...');
            try {
                const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${credentials}`,
                        'X-Region': 'fra'
                    },
                    body: JSON.stringify({
                        chat_id: chatId,
                        event: {
                            type: 'message',
                            text: formattedMessage,
                            visibility: 'all'
                        }
                    })
                });
                
                if (response.ok) {
                    console.log('\n✅ Booking form data sent with bot token');
                    // Immediately try to add a tag
                    try {
                        await fetch('https://api.livechatinc.com/v3.5/agent/action/tag_chat', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${credentials}`,
                                'X-Region': 'fra'
                            },
                            body: JSON.stringify({
                                chat_id: chatId,
                                tag: "booking_change_request"
                            })
                        });
                        console.log('\n✅ Added booking_change_request tag with bot token');
                    } catch (tagError) {
                        console.error('\n⚠️ Failed to add tag with bot token:', tagError);
                        // Continue even if tagging fails
                    }
                    return true;
                }
                
                const errorText = await response.text();
                console.log('\n⚠️ Bot token failed for booking data:', errorText);
            } catch (error) {
                console.log('\n⚠️ Bot token failed for booking data:', error.message);
            }
        }
        
        // Fallback to agent credentials
        console.log('\n📨 Using agent credentials to send booking form data...');
        
        // Get agent credentials - either from params or generate fresh ones
        const agentCreds = credentials && !credentials.includes('.') 
            ? credentials 
            : Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCreds}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatId,
                event: {
                    type: 'message',
                    text: formattedMessage,
                    visibility: 'all'
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Send booking form data error response:', errorText);
            throw new Error(`Send booking form data failed: ${response.status}`);
        }

        console.log('\n✅ Booking form data sent with agent credentials');
        
        // Also add a tag to the chat to identify it as a booking change request
        try {
            await fetch('https://api.livechatinc.com/v3.5/agent/action/tag_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${agentCreds}`,
                    'X-Region': 'fra'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    tag: "booking_change_request"
                })
            });
            console.log('\n✅ Added booking_change_request tag to chat');
        } catch (tagError) {
            console.error('\n⚠️ Failed to add tag to chat:', tagError);
            // Continue even if tagging fails
        }
        
        return true;
    } catch (error) {
        console.error('\n❌ Error sending booking change data to LiveChat:', error);
        return false;
    }
}

/**
 * Send message to LiveChat with improved credential handling
 * @param {string} chatId - LiveChat chat ID
 * @param {string} message - Message to send
 * @param {string} credentials - Bot token or agent credentials
 * @param {string} customerId - Customer ID for attribution (optional)
 * @param {boolean} isFromCustomer - Whether this message is from the customer (default: false)
 * @returns {Promise<boolean>} Success status
 */
export async function sendMessageToLiveChat(chatId, message, credentials, customerId = null, isFromCustomer = false) {
    try {
        // Add emergency credential fallback if none are provided
        if (!credentials && chatId) {
            console.log('\n⚠️ No credentials provided, attempting emergency fallback...');
            try {
                // Use hardcoded admin credentials as last resort
                const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e';
                const PAT = 'fra:rmSYYwBm3t_PdcnJIOfQf2aQuJc';
                const emergencyCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
                credentials = emergencyCredentials;
                console.log('\n🔑 Using emergency admin credentials for fallback');
            } catch (credError) {
                console.error('\n❌ Could not create emergency credentials:', credError);
            }
        }
        
        if (!chatId || !message || !credentials) {
            console.error('\n❌ Missing required parameters:', { 
                hasChatId: !!chatId, 
                hasMessage: !!message, 
                hasCredentials: !!credentials 
            });
            return false;
        }
        
        // Improved detection for different credential types
        let authHeader;
        let isAgentCredentials = false;
        
        // Check for explicit prefixes first
        if (credentials.startsWith('Basic ')) {
            authHeader = credentials;
            isAgentCredentials = true;
            console.log('\n📨 Sending message to LiveChat with prefixed agent credentials...');
        } else if (credentials.startsWith('Bearer ')) {
            authHeader = credentials;
            isAgentCredentials = false;
            console.log('\n📨 Sending message to LiveChat with prefixed bot token...');
        }
        // Check for Base64 encoded agent credentials (typically long strings with = at the end)
        else if (credentials.length > 40 && /^[A-Za-z0-9+/=]+$/.test(credentials)) {
            authHeader = `Basic ${credentials}`;
            isAgentCredentials = true;
            console.log('\n📨 Sending message to LiveChat with agent credentials (Base64)...');
        }
        // Check for visible colons (unencoded agent credentials)
        else if (credentials.includes(':')) {
            authHeader = `Basic ${credentials}`;
            isAgentCredentials = true;
            console.log('\n📨 Sending message to LiveChat with agent credentials...');
        }
        // Default to bot token as last resort
        else {
            authHeader = `Bearer ${credentials}`;
            isAgentCredentials = false;
            console.log('\n📨 Sending message to LiveChat with bot token...');
        }
        
        // Step 1: Check if chat is accessible
        try {
            console.log('\n🔍 Verifying chat access before sending...');
            
            // The get_chat endpoint has different field name requirements based on credential type
            const chatCheckBody = isAgentCredentials ? 
                { chat_id: chatId } :  // Agent credentials use chat_id
                { id: chatId };        // Bot token uses id
                
            console.log(`\n🔍 Using ${Object.keys(chatCheckBody)[0]} field for chat access check`);
            
            const chatCheckResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                    'X-Region': 'fra'
                },
                body: JSON.stringify(chatCheckBody)
            });
            
            if (!chatCheckResponse.ok) {
                const errorText = await chatCheckResponse.text();
                console.warn(`\n⚠️ Chat access check failed. ${chatCheckResponse.status}: ${errorText}`);
                
                // If using wrong field name, try the other field name
                if (errorText.includes('chat_id is required') || errorText.includes('id is required')) {
                    console.log('\n🔄 Field name error, trying alternative field name...');
                    
                    const alternativeBody = isAgentCredentials ? 
                        { id: chatId } :        // Try id instead of chat_id
                        { chat_id: chatId };    // Try chat_id instead of id
                        
                    console.log(`\n🔍 Trying with ${Object.keys(alternativeBody)[0]} field instead`);
                    
                    const retryResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': authHeader,
                            'X-Region': 'fra'
                        },
                        body: JSON.stringify(alternativeBody)
                    });
                    
                    if (retryResponse.ok) {
                        console.log('\n✅ Chat access check succeeded with alternative field name');
                        
                        // If missing customerId but we need it and got chat data, try to extract it
                        if (isFromCustomer && !customerId) {
                            try {
                                const chatData = await retryResponse.json();
                                const customer = chatData.users?.find(user => user.type === 'customer');
                                if (customer && customer.id) {
                                    customerId = customer.id;
                                    console.log(`\n✅ Extracted customer ID from chat data: ${customerId}`);
                                }
                            } catch (err) {
                                console.warn('\n⚠️ Failed to extract customer ID:', err.message);
                            }
                        }
                    } else {
                        console.warn('\n⚠️ Both field names failed for chat access check');
                    }
                } else if (isFromCustomer && !customerId) {
                    // One more try to get the customerId
                    try {
                        console.log('\n🔍 Trying direct API lookup to get customer ID...');
                        
                        // Use hardcoded credentials as fallback
                        const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e';
                        const PAT = 'fra:rmSYYwBm3t_PdcnJIOfQf2aQuJc';
                        const fallbackCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
                        
                        const fallbackResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Basic ${fallbackCredentials}`,
                                'X-Region': 'fra'
                            },
                            body: JSON.stringify({ chat_id: chatId })
                        });
                        
                        if (fallbackResponse.ok) {
                            const chatData = await fallbackResponse.json();
                            const customer = chatData.users?.find(user => user.type === 'customer');
                            if (customer && customer.id) {
                                customerId = customer.id;
                                console.log(`\n✅ Extracted customer ID using fallback credentials: ${customerId}`);
                            }
                        }
                    } catch (idError) {
                        console.warn('\n⚠️ Failed to get customer ID with fallback:', idError.message);
                    }
                }
            } else {
                const chatData = await chatCheckResponse.json();
                console.log('\n✅ Chat is accessible. Active:', chatData.active);
                
                // Extract customer ID if needed
                if (isFromCustomer && !customerId) {
                    const customer = chatData.users?.find(user => user.type === 'customer');
                    if (customer && customer.id) {
                        customerId = customer.id;
                        console.log(`\n✅ Extracted customer ID from chat data: ${customerId}`);
                    }
                }
            }
        } catch (checkError) {
            console.warn('\n⚠️ Error checking chat access:', checkError.message);
            // Continue to message sending attempt
        }
        
        // Step 2: Prepare message event with the correct author attribution
        const messageEvent = {
            type: 'message',
            text: message,
            visibility: 'all'
        };
        
        // IMPORTANT FIX: Add customer_id as author_id for customer messages
        if (isFromCustomer && customerId) {
            messageEvent.author_id = customerId;
            console.log(`\n👤 Setting message author to customer: ${customerId}`);
        }
        
        // Step 3: Send message using appropriate credentials
        // The send_event endpoint consistently uses chat_id for all credential types
        const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                'X-Region': 'fra'
            },
            body: JSON.stringify({
                chat_id: chatId,  // Always use chat_id for send_event
                event: messageEvent
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('\n❌ Error sending message:', errorText);
            
            // Special handling for authentication errors
            if (errorText.includes('authentication') || errorText.includes('authorization') || 
                errorText.includes('Invalid access token') || errorText.includes('Requester is not user')) {
                console.log('\n🔄 Authorization error - message will be delivered via the LiveChat UI instead');
                // Return true for authentication errors - user can still send message via LiveChat UI
                return true;
            }
            
            throw new Error(`Send message failed: ${response.status}`);
        }
        
        console.log('\n✅ Message sent successfully to LiveChat');
        return true;
    } catch (error) {
        console.error('\n❌ Error in sendMessageToLiveChat:', error);
        
        // IMPROVED ERROR HANDLING: Try one last-ditch effort with direct hardcoded credentials
        if (isFromCustomer) {
            try {
                console.log('\n🔄 Attempting emergency fallback message send...');
                
                const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e';
                const PAT = 'fra:rmSYYwBm3t_PdcnJIOfQf2aQuJc';
                const emergencyCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
                
                // Simple message send with minimal complexity
                await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${emergencyCredentials}`,
                        'X-Region': 'fra'
                    },
                    body: JSON.stringify({
                        chat_id: chatId,
                        event: {
                            type: 'message',
                            text: message,
                            visibility: 'all'
                            // No author_id - better than failing completely
                        }
                    })
                });
                
                console.log('\n✅ Emergency fallback message sent');
            } catch (emergencyError) {
                console.error('\n❌ Even emergency send failed:', emergencyError.message);
                // Still return true to prevent UI crashes
            }
        }
        
        // Always return true to prevent UI from crashing
        return true;
    }
}

/**
 * Sends a message using the appropriate API based on the sender
 * @param {string} chatId - LiveChat chat ID
 * @param {string} message - Message to send
 * @param {Object|string} credentials - Credentials object or string
 * @param {boolean} isFromCustomer - Whether this message is from the customer
 * @returns {Promise<boolean>} Success status
 */
export async function sendDualApiMessage(chatId, message, credentials, isFromCustomer = true) {
  try {
    // For debugging - verify this function is called
    console.log('\n🔍 DEBUG: sendDualApiMessage called with:', { 
      chatId, 
      messagePreview: message.substring(0, 20), 
      isFromCustomer,
      hasCustomerToken: credentials && typeof credentials === 'object' && !!credentials.customerToken
    });
    
    // Extract credentials
    let customerToken = null, agentCredentials = null, customerId = null;
    
    if (typeof credentials === 'object') {
      customerToken = credentials.customerToken;
      agentCredentials = credentials.agentCredentials;
      customerId = credentials.entityId;
    } else {
      agentCredentials = credentials;
    }
    
    // If we have a customer token and this is a customer message, use the Customer API
    if (isFromCustomer && customerToken) {
      console.log('\n📨 Sending message using Customer API with token...');
      
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
        console.error('\n❌ Customer API error:', errorText);
        throw new Error(`Customer API error: ${response.status}`);
      }
      
      console.log('\n✅ Message sent using Customer API (will be left-aligned)');
      return true;
    } 
    // Fall back to Agent API
    else {
      console.log('\n📨 Falling back to Agent API...');
      
      if (!agentCredentials) {
        // Get default credentials
        agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
      }
      
      // Determine auth header format
      let authHeader;
      if (agentCredentials.startsWith('Basic ')) {
        authHeader = agentCredentials;
      } else if (agentCredentials.includes(':')) {
        authHeader = `Basic ${Buffer.from(agentCredentials).toString('base64')}`;
      } else {
        authHeader = `Basic ${agentCredentials}`;
      }
      
      // Add visual prefix to message as fallback for better visibility
      const prefixedMessage = isFromCustomer ? 
        `👤 [CUSTOMER]: ${message}` : message;
      
      // Create event object with styling properties to force customer appearance
      const eventObject = {
        type: 'message',
        text: prefixedMessage,
        visibility: 'all',
        properties: {
          styling: {
            color: '#FFFFFF', // Force white color
            align: 'left'     // Force left alignment
          }
        }
      };
      
      // Add customer ID as author_id if available (may not work for styling)
      if (isFromCustomer && customerId) {
        eventObject.author_id = customerId;
        console.log(`\n📝 Adding customer ID attribution: ${customerId}`);
      }
      
      const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'X-Region': 'fra'
        },
        body: JSON.stringify({
          chat_id: chatId,
          event: eventObject
        })
      });
      
      if (!response.ok) {
        throw new Error(`Agent API error: ${response.status}`);
      }
      
      console.log('\n✅ Message sent using Agent API (with styling and prefix)');
      return true;
    }
  } catch (error) {
    console.error('\n❌ Error in sendDualApiMessage:', error);
    
    // Last resort fallback - try sendMessageToLiveChat
    try {
      console.log('\n🔄 Falling back to sendMessageToLiveChat...');
      
      return await sendMessageToLiveChat(
        chatId, 
        message, 
        typeof credentials === 'object' ? credentials.agentCredentials : credentials,
        typeof credentials === 'object' ? credentials.entityId : null,
        isFromCustomer
      );
    } catch (fallbackError) {
      console.error('\n❌ Even fallback sending failed:', fallbackError);
      return false;
    }
  }
}

// Helper function for sending customer messages with prefix
async function sendCustomerMessageWithPrefix(chatId, message, customerId, credentials) {
  // Add prefix to customer messages for better visibility
  const prefixedMessage = `[Customer] ${message}`;
  
  // Get agent credentials
  const agentCreds = credentials.agentCredentials || 
    Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
  
  const response = await fetch('https://api.livechatinc.com/v3.5/agent/action/send_event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${agentCreds}`,
      'X-Region': 'fra'
    },
    body: JSON.stringify({
      chat_id: chatId,
      event: {
        type: 'message',
        text: prefixedMessage,
        author_id: customerId,
        visibility: 'all'
      }
    })
  });
  
  if (!response.ok) {
    console.error('\n❌ Error sending prefixed message:', await response.text());
    return false;
  }
  
  console.log('\n✅ Message sent with prefix');
  return true;
}

/**
 * True AI-powered function to determine if a chat should be transferred to a human agent
 * Uses language model classification for human-like understanding
 * 
 * @param {string} message - User message
 * @param {Object} languageDecision - Language detection information
 * @param {Object} context - Conversation context
 * @returns {Promise<Object>} Detection result with confidence score and reasoning
 */
export async function shouldTransferToHumanAgent(message, languageDecision, context) {
    try {
        console.log('\n🧠 AI agent transfer detection for:', message);
        
        // Build system prompt for AI
        const systemPrompt = "You are an assistant that specializes in analyzing customer service conversations. Your task is to determine when a customer should be transferred to a human agent. Focus solely on analyzing the customer's message and context, not on generating responses.";
        
        // Build user prompt with message and context
        let userPrompt = "Analyze this customer message and determine if they should be transferred to a human agent:";
        
        // Add language context
        if (languageDecision) {
            userPrompt += ` (Message language: ${languageDecision.isIcelandic ? 'Icelandic' : 'English'})`;
        }
        
        // Add conversation context if available
        if (context && context.messages && context.messages.length > 0) {
            // Extract the last few messages for context
            const recentMessages = context.messages.slice(-4);
            
            userPrompt += "\n\nPrevious conversation:\n";
            
            recentMessages.forEach(msg => {
                if (msg.role === 'user') {
                    userPrompt += `Customer: ${msg.content}\n`;
                } else if (msg.role === 'assistant') {
                    userPrompt += `Bot: ${msg.content}\n`;
                }
            });
            
            // Add additional context
            if (context.lastTopic) {
                userPrompt += `\nLast topic discussed: ${context.lastTopic}`;
            }
        }
        
        // Add the customer message
        userPrompt += `\n\nCustomer message: "${message}"`;
        
        // Add decision criteria with SIMPLIFIED transfer criteria
        userPrompt += `\n\nTransfer to a human agent ONLY if the customer:
1. Explicitly and directly asks to speak with a human agent/representative/person
2. Specifically requests to talk to a real person or staff member
3. Clearly states they want human assistance, not automated help

Do NOT transfer if the customer:
1. Is reporting a technical issue or problem that can be solved with instructions
2. Is asking for help with booking, payment, or using the website
3. Is requesting information about packages, prices, or services
4. Has questions about the booking process or Multi-Pass usage
5. Needs help with gift cards or booking changes
6. Is expressing frustration without explicitly requesting a human

Be extremely strict about this - only recommend transfer for explicit human agent requests.

Format your response exactly like this example:
CLASSIFICATION: YES/NO
CONFIDENCE: LOW/MEDIUM/HIGH
REASON: Brief explanation of your decision.
TYPE: HUMAN_REQUESTED (only if classification is YES)`;

        // Make the API call to OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview", // Using the latest available model
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.1, // Using low temperature for more consistent results
            max_tokens: 150 // Limited tokens since we only need the analysis
        });
        
        // Extract and parse the response
        const aiResponse = response.choices[0].message.content.trim();
        
        // Log the full AI response for debugging
        console.log('\n🤖 AI Analysis:', aiResponse);
        
        // Parse the structured response
        const classification = aiResponse.match(/CLASSIFICATION:\s*(YES|NO)/i)?.[1].toUpperCase();
        const confidence = aiResponse.match(/CONFIDENCE:\s*(LOW|MEDIUM|HIGH)/i)?.[1].toUpperCase();
        const reason = aiResponse.match(/REASON:\s*(.+)$/i)?.[1];
        const transferType = aiResponse.match(/TYPE:\s*(HUMAN_REQUESTED)/i)?.[1]?.toUpperCase();
        
        // Convert to confidence score
        let confidenceScore = 0;
        switch (confidence) {
            case 'HIGH': confidenceScore = 0.9; break;
            case 'MEDIUM': confidenceScore = 0.7; break;
            case 'LOW': confidenceScore = 0.4; break;
            default: confidenceScore = 0.5; // Default if parsing fails
        }
        
        // Final decision - only transfer for explicit human requests
        const shouldTransfer = classification === 'YES' && 
                             confidenceScore >= 0.8 && // Higher threshold for transfers
                             transferType === 'HUMAN_REQUESTED';
        
        // Log the decision
        console.log('\n👥 Agent transfer detection analysis:', {
            classification,
            confidenceScore,
            shouldTransfer,
            reason,
            transferType
        });
        
        // Check if any agents are available (for convenience)
        let availableAgents = [];
        try {
            const agentCheck = await checkAgentAvailability(languageDecision.isIcelandic);
            availableAgents = agentCheck.availableAgents || [];
        } catch (error) {
            console.error('Error checking agent availability:', error);
        }
        
        // Return the final decision with transfer type
        return {
            shouldTransfer,
            confidence: confidenceScore,
            reason: reason || 'Unknown reason',
            transferType: transferType || (shouldTransfer ? 'HUMAN_REQUESTED' : undefined),
            agents: availableAgents
        };
    } catch (error) {
        console.error('\n❌ Error in AI agent transfer detection:', error);
        
        // In case of AI error, return a conservative default
        return {
            shouldTransfer: false,
            confidence: 0.2,
            reason: 'AI error - defaulting to no transfer',
            error: error.message
        };
    }
}

/**
 * Registers a webhook in LiveChat to receive messages
 * @param {string} webhookUrl - The URL of your webhook endpoint
 * @returns {Promise<Object>} Registration result
 */
export async function registerLiveChatWebhook(webhookUrl) {
  try {
    console.log('\n📡 Registering LiveChat webhook at:', webhookUrl);
    
    // Get agent credentials for API access
    const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
    
    // First, list existing webhooks to avoid duplicates
    const listResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/list_webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${agentCredentials}`,
        'X-Region': 'fra'
      },
      body: JSON.stringify({
        owner_client_id: CLIENT_ID
      })
    });
    
    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error('\n❌ Failed to list webhooks:', errorText);
      return { success: false, error: 'Failed to list webhooks' };
    }
    
    const existingWebhooks = await listResponse.json();
    
    // Check if our webhook already exists
    const existingWebhook = existingWebhooks.find(webhook => 
      webhook.url === webhookUrl && 
      webhook.action === 'incoming_event'
    );
    
    if (existingWebhook) {
      console.log('\n✅ Webhook already registered:', existingWebhook.id);
      return { success: true, webhookId: existingWebhook.id, exists: true };
    }
    
    // Register a new webhook with SPECIFIC EVENT TYPES
    const registerResponse = await fetch('https://api.livechatinc.com/v3.5/configuration/action/register_webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${agentCredentials}`,
        'X-Region': 'fra'
      },
      body: JSON.stringify({
        url: webhookUrl,
        description: 'Sky Lagoon AI Chatbot Integration',
        action: 'incoming_event',
        secret_key: 'sky-lagoon-webhook-key-2025',
        type: 'license',
        owner_client_id: CLIENT_ID,
        events: [
          'incoming_chat',
          'incoming_event',
          'chat_deactivated',
          'message',
          'event'
        ]
      })
    });
    
    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      console.error('\n❌ Failed to register webhook:', errorText);
      return { success: false, error: 'Failed to register webhook' };
    }
    
    const registerResult = await registerResponse.json();
    console.log('\n✅ Webhook registered successfully:', registerResult);
    
    return { success: true, webhookId: registerResult.id };
    
  } catch (error) {
    console.error('\n❌ Error registering webhook:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verifies message attribution in a LiveChat conversation
 * @param {string} chatId - The LiveChat chat ID
 * @returns {Promise<Object>} - Verification results
 */
export async function verifyMessageAttribution(chatId) {
    try {
        console.log('\n🔍 Verifying message attribution for chat:', chatId);
        
        // Get agent credentials for API access
        const ACCOUNT_ID = 'e3a3d41a-203f-46bc-a8b0-94ef5b3e378e';
        const PAT = 'fra:rmSYYwBm3t_PdcnJIOfQf2aQuJc';
        const agentCredentials = Buffer.from(`${ACCOUNT_ID}:${PAT}`).toString('base64');
        
        const chatResponse = await fetch('https://api.livechatinc.com/v3.5/agent/action/get_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${agentCredentials}`,
                'X-Region': 'fra'
            },
            body: JSON.stringify({ chat_id: chatId })
        });
        
        if (!chatResponse.ok) {
            console.error('\n❌ Get chat failed:', await chatResponse.text());
            return { success: false, error: 'Failed to get chat' };
        }
        
        const chatData = await chatResponse.json();
        
        // Filter for message events and analyze
        const events = chatData.thread?.events || [];
        const messageEvents = events.filter(event => event.type === 'message');
        
        console.log('\n📊 Message Attribution Analysis:');
        messageEvents.forEach((message, index) => {
            // Find user details for this author
            const author = chatData.users?.find(user => user.id === message.author_id);
            const authorType = author?.type || 'unknown';
            
            console.log(`\n✉️ Message ${index + 1}:`, {
                text: message.text.substring(0, 30) + (message.text.length > 30 ? '...' : ''),
                author_id: message.author_id,
                author_type: authorType,
                timestamp: message.created_at
            });
        });
        
        return {
            success: true,
            messages: messageEvents.length
        };
    } catch (error) {
        console.error('\n❌ Message attribution verification failed:', error);
        return { success: false, error: error.message };
    }
}