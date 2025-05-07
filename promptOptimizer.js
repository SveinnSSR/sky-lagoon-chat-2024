// promptOptimizer.js - Enterprise-grade prompt optimization for Sky Lagoon chatbot

// Cache for optimized prompts to avoid regenerating them
const promptCache = new Map();
const PROMPT_CACHE_MAX_SIZE = 100;
const PROMPT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * AI-driven prompt optimization using context system
 * @param {string} originalPrompt - The full system prompt
 * @param {string} message - The user message
 * @param {Object} context - Session context with intent data
 * @returns {string} - The optimized prompt
 */
export function getOptimizedPrompt(originalPrompt, message, context) {
  // Extract essential base instructions (always included)
  const basePromptEndMarker = 'CRITICAL RESPONSE RULES:';
  const basePromptEndIndex = originalPrompt.indexOf(basePromptEndMarker);
  
  if (basePromptEndIndex === -1) {
    console.log('⚠️ Base prompt marker not found, using full prompt');
    return originalPrompt;
  }
  
  const basePromptEndPos = basePromptEndIndex + basePromptEndMarker.length + 500;
  const basePrompt = originalPrompt.substring(0, basePromptEndPos);
  
  // Use context system to determine intent
  const primaryIntent = context.intentHierarchy?.primaryIntent;
  const lastTopic = context.lastTopic || '';
  const topicHistory = context.topics || [];
  
  // Create cache key using context information
  const cacheKey = `${primaryIntent || 'general'}:${lastTopic}:${context.language}:${message.length < 25 ? 'short' : 'long'}`;
  
  // Check cache
  if (promptCache.has(cacheKey)) {
    const cached = promptCache.get(cacheKey);
    
    // Check if cache entry is still valid
    if (Date.now() - cached.timestamp < PROMPT_CACHE_TTL) {
      console.log(`📦 Using cached optimized prompt for: ${primaryIntent || 'general'} (${context.language})`);
      return cached.prompt;
    }
    
    // Expired entry, remove it
    promptCache.delete(cacheKey);
  }

  console.log(`🔧 Building optimized prompt for intent: ${primaryIntent || lastTopic || 'general'}`);
  
  // Start with base instructions
  let optimizedPrompt = basePrompt;
  
  // Add sections based on AI context determination
  const promptSections = [];
  
  // CRITICAL: Always include context awareness for short follow-up messages
  if (message.length < 25) {
    promptSections.push(`
FOLLOW-UP QUESTION CONTEXT:
The user has asked a short follow-up question: "${message}"
Their previous topic was "${lastTopic}" and the conversation is ongoing.
You MUST maintain context from the previous messages and provide a direct answer.
If they're asking about something mentioned earlier, respond assuming they're referring to what was discussed before.
Short messages like "What about X?" or "Is it for one person?" are follow-ups to the previous topic.
`);

    // Special handling for "one or two" type questions, especially in pricing context
    if (message.match(/for (one|two|1|2)/) || 
        message.match(/\b(one|two|1|2) (person|people)\b/) || 
        message.toLowerCase().includes("fyrir einn") || 
        message.toLowerCase().includes("fyrir tvo") || 
        message.toLowerCase().match(/\beinn eða tvo\b/)) {
      
      promptSections.push(`
PRICE PER PERSON CLARIFICATION CONTEXT:
The user is asking whether prices previously discussed are for one person or for multiple people.
ALWAYS clarify that:
- All prices are PER PERSON
- Each visitor needs their own ticket
- For two people, they would need to purchase two tickets/packages
- The Saman Package costs 12,990 ISK per person on weekdays
- The Sér Package costs 15,990 ISK per person on weekdays
This is a common question and requires a clear, direct answer about pricing being per person.
`);
    }
  }

    // ADD THIS NEW SECTION RIGHT HERE
    // Enhance context awareness for pricing follow-ups
    if (context.lastTopic && 
        (context.lastTopic === 'pricing' || 
         context.topics.includes('pricing') ||
         context.topics.includes('packages'))) {
      
      promptSections.push(`
CRITICAL CONTEXT AWARENESS INSTRUCTION:
The user asked about pricing previously and is now asking a follow-up question: "${message}"
This is a FOLLOW-UP question, not a new query. 
DO NOT repeat the full package format again.
Instead, provide a direct conversational answer to their specific question.
Remember that context awareness and natural conversation are MORE IMPORTANT than adhering to rigid format templates.
      `);
    }  

  // ALWAYS include these critical sections for conversation continuity
  promptSections.push(extractSection(originalPrompt, '4. Context Awareness:', '5. Response Guidelines:'));
  
  // Always include Icelandic-specific sections when applicable
  if (context.language === 'is' || 
      (context.language === 'auto' && /[áðéíóúýþæö]/i.test(message))) {
    promptSections.push(extractSection(originalPrompt, 'ICELANDIC RESPONSE GUIDELINES:', 'ICELANDIC LANGUAGE GUIDELINES:'));
    promptSections.push(extractSection(originalPrompt, 'ICELANDIC GRAMMAR PRECISION:', 'ALDURSTAKMÖRK OG BÖRN:'));
    promptSections.push(extractSection(originalPrompt, 'STANDARD PRICE INFORMATION FORMAT TO INCLUDE:', 'RITUAL INCLUSION POLICY:'));
  }
  
  // 1. Age restriction information
  if (matchesAnyTopic(context, ['age', 'children', 'kids', 'minimum', 'child', 'young']) || 
      message.toLowerCase().match(/\b(age|child|kid|young|minimum|family)\b/)) {
    promptSections.push(extractSection(originalPrompt, 'AGE POLICY AND CHILDREN:', 'WEBSITE LINKS GUIDELINES:'));
  }
  
// 2. Packages information
if (matchesAnyTopic(context, ['package', 'packages', 'saman', 'sér', 'ser', 'standard', 'premium', 'price', 'pricing', 'cost', 'pure', 'sky pass']) || 
    message.toLowerCase().match(/\b(package|saman|sér|ser|pure|sky pass|premium|standard|price|cost|pricing)\b/) ||
    (lastTopic === 'pricing' && message.length < 50)) {
    
  // IMPROVED: Check if this is a follow-up question using context signals
  const isFollowUpPriceQuestion = 
    // Short message following a pricing topic suggests follow-up
    (context.lastTopic === 'pricing' && message.length < 25) ||
    // Check context history for pricing topic continuity
    (context.intentHierarchy?.primaryIntent === 'pricing' && message.length < 30) ||
    // Using adaptiveMemory to detect conversation continuity
    (context.adaptiveMemory?.getRecentMemories(1).some(m => 
      m.category === 'assistant_response' && 
      m.content.includes('12.990') && 
      Date.now() - m.timestamp < 60000
    )) ||
    // Specific follow-up detected by contextSystem
    (context.bookingContext?.lastDateMention && message.length < 30) ||
    // Message patterns that strongly indicate price follow-up
    (message.toLowerCase().includes("fyrir einn") || message.toLowerCase().includes("fyrir tvo") || 
     message.toLowerCase().match(/\beinn eða tvo\b/));
  
  if (isFollowUpPriceQuestion) {
    // For follow-ups, prioritize the FOLLOW-UP PRICING RESPONSES section first
    promptSections.push(extractSection(originalPrompt, 'FOLLOW-UP PRICING RESPONSES:', 'STANDARD PRICE INFORMATION FORMAT TO INCLUDE:'));
    
    // Add context awareness override to make sure it responds conversationally
    promptSections.push(`
CRITICAL RESPONSE CONTEXT OVERRIDE:
This is a follow-up question about pricing. The user has already received information about package prices.
DO NOT repeat the full package details format again.
INSTEAD: Provide a direct, conversational answer focused on the specific follow-up question.
Prioritize context continuity over template formatting.
The user's query "${message}" is continuing from previous pricing discussion.
`);
  } else {
    // For initial questions, include standard price format
    promptSections.push(extractSection(originalPrompt, 'STANDARD PRICE INFORMATION FORMAT TO INCLUDE:', 'RITUAL INCLUSION POLICY:'));
  }
  
  // Always include these sections for both initial and follow-up questions
  promptSections.push(extractSection(originalPrompt, 'PRICING REFERENCE INFORMATION:', 'PRODUCT INFORMATION AND SHIPPING:'));
  promptSections.push(extractSection(originalPrompt, 'LEGACY PACKAGE NAME MAPPING', 'DIRECT PROBLEM SOLVING PRIORITY:'));
  promptSections.push(extractSection(originalPrompt, '22. For Package Comparison Queries:', '23. For Gift Ticket Queries:'));
  
  // Add specific instructions for Icelandic pricing responses
  if (context.language === 'is' || 
      (context.language === 'auto' && /[áðéíóúýþæö]/i.test(message))) {
    promptSections.push(`
ICELANDIC PRICING RESPONSE REQUIREMENTS:
When discussing prices in Icelandic, follow these rules:
1. Always refer to "Saman Package" as "Saman pakkinn" 
2. Always refer to "Sér Package" as "Sér pakkinn"
3. Use "Verð: 12.990 ISK" format for pricing
4. Clarify that prices are per person ("Verð er á mann")
5. For "Er það fyrir einn eða tvo?" be very clear that:
   - "Já, verðið er á mann. Fyrir tvo þarf að kaupa tvo miða."
   - "Verðið er á hvern gest, ekki fyrir par eða hóp."
`);
    }
  }
  
  // 3. Date Night / Sky Lagoon for Two
  if (message.toLowerCase().includes('date night') || 
      message.toLowerCase().includes('for two') || 
      message.toLowerCase().includes('stefnumót') ||
      message.toLowerCase().includes('couple') ||
      context.lastTopic === 'date_night') {
    promptSections.push(extractSection(originalPrompt, 'FOR DATE NIGHT / SKY LAGOON FOR TWO PACKAGES:', '22. For Package Comparison Queries:'));
  }
  
  // 4. Ritual information
  if (matchesAnyTopic(context, ['ritual', 'ritúal', 'skjól', 'skjol', 'steps', 'seven']) || 
      message.toLowerCase().match(/\b(ritual|skjol|skjól|step|seven|experience|process)\b/)) {
    promptSections.push(extractSection(originalPrompt, '5. Ritual Response Format:', 'AGE POLICY AND CHILDREN:'));
    promptSections.push(extractSection(originalPrompt, '15. For ritual-related queries:', '16. For seasonal questions:'));
  }
  
  // 5. Cancellation information
  if (matchesAnyTopic(context, ['cancel', 'refund', 'change', 'modification', 'reschedule']) || 
      message.toLowerCase().match(/\b(cancel|refund|change|modif|reschedule)\b/)) {
    promptSections.push(extractSection(originalPrompt, '17. For booking changes and cancellations:', '18. For Multi-Pass questions:'));
  }
  
  // 6. Booking process
  if (matchesAnyTopic(context, ['book', 'booking', 'reserve', 'reservation', 'ticket', 'purchase']) || 
      message.toLowerCase().match(/\b(book|booking|reserve|reservation|buy ticket|purchase|boka|panta)\b/)) {
    promptSections.push(extractSection(originalPrompt, 'AVAILABILITY INFORMATION', 'PRICING REFERENCE INFORMATION:'));
    promptSections.push(extractSection(originalPrompt, 'For booking-related queries:', 'Other relevant sections'));
    promptSections.push(extractSection(originalPrompt, 'BOOKING AND AVAILABILITY RESPONSES:', 'WELLNESS AND STRESS RELIEF RESPONSES:'));
  }
  
  // 7. Late arrival information
  if (matchesAnyTopic(context, ['late', 'delay', 'arrival', 'grace', 'minutes']) || 
      context.lateArrivalContext?.isLate ||
      message.toLowerCase().match(/\b(late|delay|miss|arrive|30 minute|grace|window)\b/)) {
    promptSections.push(extractSection(originalPrompt, 'LATE ARRIVAL POLICY', 'MONTHLY THEME INFORMATION'));
  }
  
  // 8. Hours information
  if (matchesAnyTopic(context, ['hour', 'time', 'open', 'close', 'opening', 'closing', 'schedule', 'when']) || 
      message.toLowerCase().match(/\b(hour|time|open|close|schedule|when|until|from|til)\b/)) {
    promptSections.push(extractSection(originalPrompt, 'TIME DURATION GUIDELINES:', 'TIME FORMATTING GUIDELINES:'));
    promptSections.push(extractSection(originalPrompt, 'TIME FORMATTING GUIDELINES:', 'CRITICAL RESPONSE RULES:'));
    promptSections.push(extractSection(originalPrompt, 'CURRENT OPERATING HOURS:', 'CRITICAL RESPONSE RULES:'));
  }
  
  // 9. Group bookings
  if (matchesAnyTopic(context, ['group', 'team', 'corporate', 'party', 'celebration']) || 
      message.toLowerCase().match(/\b(group|team|corporate|company|party|10 people|many people|celebration)\b/)) {
    promptSections.push(extractSection(originalPrompt, 'GROUP BOOKING INFORMATION:', 'INDIVIDUAL BOOKING INFORMATION:'));
  }
  
  // 10. Transportation/transfer
  if (matchesAnyTopic(context, ['transport', 'transfer', 'bus', 'shuttle', 'drive', 'location', 'directions', 'address']) || 
      message.toLowerCase().match(/\b(transport|transfer|bus|shuttle|drive|get there|location|address|directions|where)\b/)) {
    promptSections.push(extractSection(originalPrompt, 'TRANSPORTATION INFORMATION:', 'BOOKING INFORMATION:'));
    promptSections.push(extractSection(originalPrompt, '11. For transport/travel questions:', '12. For food/dining questions:'));
  }
  
  // 11. Discount/promo codes
  if (matchesAnyTopic(context, ['discount', 'promo', 'code', 'coupon', 'offer', 'deal', 'promotion']) || 
      message.toLowerCase().match(/\b(discount|promo|promotion|code|coupon|offer|deal|special|cheaper)\b/)) {
    promptSections.push(extractSection(originalPrompt, 'DISCOUNT AND PROMOTION INFORMATION:', 'STANDARD PRICING INFORMATION:'));
  }
  
  // 12. Product information and shipping
  if (matchesAnyTopic(context, ['product', 'purchase', 'buy', 'shopping', 'gift', 'souvenir', 'shipping', 'delivery']) || 
      message.toLowerCase().match(/\b(product|buy|purchase|ship|delivery|gift shop|souvenir|skin care|body scrub)\b/)) {
    promptSections.push(extractSection(originalPrompt, 'PRODUCT INFORMATION AND SHIPPING:', 'LEGACY PACKAGE NAME MAPPING'));
  }
  
  // 13. Amenities/facilities
  if (matchesAnyTopic(context, ['amenity', 'facility', 'facilities', 'locker', 'shower', 'changing', 'towel', 'robe']) || 
      message.toLowerCase().match(/\b(amenity|amenities|facility|facilities|locker|shower|changing|towel|robe|included)\b/)) {
    promptSections.push(extractSection(originalPrompt, 'AMENITIES GUIDELINES:', 'MENSTRUATION QUERIES GUIDELINES:'));
    promptSections.push(extractSection(originalPrompt, 'FACILITIES INFORMATION:', 'BOOKING ASSISTANCE:'));
  }
  
  // 14. Gift cards
  if (matchesAnyTopic(context, ['gift', 'card', 'present', 'gjafakort']) || 
      message.toLowerCase().match(/\b(gift|card|present|certificate|gjafakort|geschenk)\b/)) {
    promptSections.push(extractSection(originalPrompt, '23. For Gift Ticket Queries:', 'HANDLING INFORMATION LIMITATIONS:'));
    promptSections.push(extractSection(originalPrompt, 'GIFT CARD RESPONSES:', 'GENERAL RESPONSE GUIDELINES:'));
  }
  
  // ALWAYS include Voice and Tone Guidelines
  promptSections.push(extractSection(originalPrompt, 'VOICE AND TONE GUIDELINES:', 'REDIRECTING OFF-TOPIC QUESTIONS:'));
  promptSections.push(extractSection(originalPrompt, 'PERSONAL LANGUAGE REQUIREMENTS:', 'CRITICAL SAFETY RULES:'));

  // Add all selected sections to the prompt
  if (promptSections.length > 0) {
    optimizedPrompt += '\n\n' + promptSections.join('\n\n');
  }
  
  // Always add response language instruction at the end
  if (context.language === 'is') {
    optimizedPrompt += '\n\nRESPOND IN ICELANDIC.';
  } else if (context.language === 'en') {
    optimizedPrompt += '\n\nRESPOND IN ENGLISH.';
  } else if (context.language === 'auto') {
    optimizedPrompt += '\n\nIMPORTANT: RESPOND IN THE SAME LANGUAGE AS THE USER\'S QUESTION.';
  } else {
    optimizedPrompt += `\n\nCRITICAL: RESPOND IN ${context.language.toUpperCase()} LANGUAGE.`;
  }
  
  // Log optimization metrics
  const tokenEstimate = Math.round(originalPrompt.length / 4);
  const optimizedTokenEstimate = Math.round(optimizedPrompt.length / 4);
  const savedTokens = tokenEstimate - optimizedTokenEstimate;
  const percentSaved = Math.round((savedTokens / tokenEstimate) * 100);
  
  console.log(`📊 Prompt optimization: ${optimizedTokenEstimate} tokens (saved ~${savedTokens} tokens, ${percentSaved}%)`);
  
  // Cache the result
  promptCache.set(cacheKey, {
    prompt: optimizedPrompt,
    timestamp: Date.now()
  });
  
  // Clean up cache if needed
  if (promptCache.size > PROMPT_CACHE_MAX_SIZE) {
    const oldEntries = [...promptCache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 20);
      
    oldEntries.forEach(([key]) => promptCache.delete(key));
    console.log(`🧹 Cleaned up ${oldEntries.length} oldest prompt cache entries`);
  }
  
  return optimizedPrompt;
}

/**
 * Extract a section from the original prompt
 */
function extractSection(originalPrompt, startMarker, endMarker) {
  const startIndex = originalPrompt.indexOf(startMarker);
  if (startIndex === -1) return '';
  
  const endIndex = originalPrompt.indexOf(endMarker, startIndex);
  if (endIndex === -1) return originalPrompt.substring(startIndex);
  
  return originalPrompt.substring(startIndex, endIndex);
}

/**
 * Check if the context matches any of the specified topics
 */
function matchesAnyTopic(context, topics) {
  // Check primary intent
  if (context.intentHierarchy?.primaryIntent && 
      topics.some(topic => context.intentHierarchy.primaryIntent.toLowerCase().includes(topic.toLowerCase()))) {
    return true;
  }
  
  // Check lastTopic
  if (context.lastTopic && 
      topics.some(topic => context.lastTopic.toLowerCase().includes(topic.toLowerCase()))) {
    return true;
  }
  
  // Check topic history
  if (context.topics && Array.isArray(context.topics)) {
    for (const contextTopic of context.topics) {
      if (topics.some(topic => contextTopic.toLowerCase().includes(topic.toLowerCase()))) {
        return true;
      }
    }
  }
  
  return false;
}