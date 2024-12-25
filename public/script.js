// Constants
const WEBHOOK_URL = 'https://sky-lagoon-chat-2024.vercel.app/chat';
const API_KEY = 'sky-lagoon-secret-2024';  // This should match your .env API_KEY

console.log('Script loaded!'); // Add this line
console.log('WEBHOOK_URL:', WEBHOOK_URL); // Add this line

// Get DOM elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');

// Add welcome message when chat loads
window.onload = () => {
    addMessage("Welcome to Sky Lagoon! How may I assist you today?", 'bot');
};

// Send message function
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Clear input
    chatInput.value = '';

    // Add user message to chat
    addMessage(message, 'user');

    console.log('Sending request to:', WEBHOOK_URL);  // Add this
    console.log('With message:', message);  // Add this

    try {
        // Show loading indicator
        addMessage("...", 'bot', 'loading-message');

        // Send to webhook
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({ message: message })  // Changed to match new API format
        });

        console.log('Response status:', response.status);  // Add this
        const data = await response.json();
        console.log('Response data:', data);  // Add this
        
        // Remove loading indicator
        const loadingMessage = document.querySelector('.loading-message');
        if (loadingMessage) {
            loadingMessage.remove();
        }

        // Add bot response to chat
        if (data.message) {  // Changed to match new API format
            addMessage(data.message, 'bot');
        } else if (data.error) {
            addMessage(data.error, 'bot');
        } else {
            addMessage("I apologize, but I'm having trouble processing your request.", 'bot');
        }

    } catch (error) {
        console.error('Detailed error:', error);  // Changed this
        addMessage("I apologize, but I'm having trouble connecting right now.", 'bot');
    }
}

// Add message to chat
function addMessage(text, sender, className = '') {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    if (className) {
        messageDiv.classList.add(className);
    }
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Event listeners
sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});