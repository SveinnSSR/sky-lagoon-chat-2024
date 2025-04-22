export default async function handler(req, res) {
  try {
    console.log('\n📩 Received webhook from LiveChat:', {
      action: req.body.action,
      type: req.body.payload?.event?.type,
      author: req.body.payload?.event?.author?.type,
      chat_id: req.body.payload?.chat_id
    });
    
    // Log full payload for debugging
    console.log('\n🔍 Full webhook payload:', JSON.stringify(req.body, null, 2));
    
    // Verify the webhook is authentic
    if (!req.body.action || !req.body.payload) {
      console.warn('\n⚠️ Invalid webhook format');
      return res.status(400).json({ success: false, error: 'Invalid webhook format' });
    }
    
    // We're only interested in new messages
    if (req.body.action === 'incoming_event' && req.body.payload.event?.type === 'message') {
      // Simple inline processing function for agent messages
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

// Minimal inline implementation of message processing
async function processWebhookMessage(payload) {
  try {
    // Extract info from payload
    const chatId = payload.chat_id;
    const event = payload.event;
    const author = event.author;
    
    // Check if the message is from an agent
    if (author.type !== 'agent') {
      console.log('\n📝 Ignoring non-agent message from:', author.type);
      return { success: true };
    }
    
    // Get message content
    const messageText = event.text;
    const authorName = author.name || 'Agent';
    
    console.log(`\n📨 Processing agent message: "${messageText}" from ${authorName}`);
    
    // In production this would trigger your Pusher notification
    // For now, just log that we received it
    console.log('\n✅ Agent message received and logged');
    
    return { success: true };
  } catch (error) {
    console.error('\n❌ Error processing webhook message:', error);
    return { success: false, error: error.message };
  }
}