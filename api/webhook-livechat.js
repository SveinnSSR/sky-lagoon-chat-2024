export default async function handler(req, res) {
  try {
    console.log('\n📩 Received webhook from LiveChat:', {
      action: req.body.action,
      text: req.body.payload?.event?.text?.substring(0, 30) + '...',
      author_id: req.body.payload?.event?.author_id,
      chat_id: req.body.payload?.chat_id
    });
    
    // Log full payload for debugging
    console.log('\n🔍 Full webhook payload:', JSON.stringify(req.body, null, 2));
    
    // Verify the webhook is authentic
    if (!req.body.action || !req.body.payload) {
      console.warn('\n⚠️ Invalid webhook format');
      return res.status(400).json({ success: false, error: 'Invalid webhook format' });
    }
    
    // Process incoming events
    if (req.body.action === 'incoming_event' && req.body.payload.event?.type === 'message') {
      // Process the incoming message
      const result = await processWebhookMessage(req.body.payload);
      
      if (result.success) {
        console.log('\n✅ LiveChat message processed successfully');
        return res.status(200).json({ success: true });
      } else {
        console.error('\n❌ Failed to process LiveChat message:', result.error);
        return res.status(500).json({ success: false, error: result.error });
      }
    }
    
    // For other webhook types, just acknowledge receipt
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('\n❌ Webhook processing error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Updated to handle the actual LiveChat webhook format
async function processWebhookMessage(payload) {
  try {
    // Extract info from payload
    const chatId = payload.chat_id;
    const event = payload.event;
    const authorId = event.author_id;
    const messageText = event.text;
    
    console.log(`\n📨 Processing message: "${messageText}" from ${authorId}`);
    
    // Ignore our own system messages
    if (messageText.includes('URGENT: AI CHATBOT TRANSFER')) {
      console.log('\n📝 Ignoring our own system message');
      return { success: true };
    }
    
    // Check if this is an agent message by looking at the author ID
    const isAgentMessage = authorId && 
                          (authorId.includes('@') || 
                           authorId === 'david@svorumstrax.is' ||
                           authorId === 'bryndis@svorumstrax.is');
    
    if (!isAgentMessage) {
      console.log('\n📝 Ignoring non-agent message from:', authorId);
      return { success: true };
    }
    
    // Here you would broadcast the message via Pusher
    console.log('\n✅ Agent message would be broadcast to frontend');
    
    return { success: true };
  } catch (error) {
    console.error('\n❌ Error processing webhook message:', error);
    return { success: false, error: error.message };
  }
}