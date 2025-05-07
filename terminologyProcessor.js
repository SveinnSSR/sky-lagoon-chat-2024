/**
 * AI-powered terminology enforcement for Sky Lagoon
 * ES Module version
 */

// Cache for terminology processing results
const terminologyCache = new Map();
const TERMINOLOGY_CACHE_MAX_SIZE = 500; // Prevent unbounded growth

/**
 * Applies Sky Lagoon terminology rules to text using AI processing
 * 
 * @param {string} text - The text to process
 * @param {Object} openaiInstance - The initialized OpenAI client instance
 * @returns {Promise<string>} - Text with terminology applied
 */
export const enforceTerminology = async (text, openaiInstance) => {
  // Guard clause
  if (!text) return text;
  
  // Only use AI for messages above a certain length
  // Short responses are less likely to need processing
  if (text.length < 30) return text;
  
  // Check cache first
  const cacheKey = createCacheKey(text);
  
  // Debug logging to track cache status
  console.log(`🔍 Terminology cache check: size=${terminologyCache.size}, key="${cacheKey.slice(0, 30)}..."`);
  
  if (terminologyCache.has(cacheKey)) {
    console.log('📦 TERMINOLOGY CACHE HIT: Using cached processing');
    return terminologyCache.get(cacheKey);
  }
  
  console.log('\n📝 Applying AI terminology processing');
  const startTime = performance.now();
  
  try {
    // Detect if text contains Icelandic characters
    const containsIcelandic = /[áðéíóúýþæö]/i.test(text);
    
    // Determine language-specific instructions
    const languageInstructions = containsIcelandic ? 
      `ICELANDIC TERMINOLOGY RULES:
      - Replace "bókunarreferensnúmerinu" with "bókunarnúmerinu"
      - Replace "bókunarreferensnúmerið" with "bókunarnúmerið"
      - Replace "bókunarreferensnúmeri" with "bókunarnúmeri"
      - Replace "bókunarreferensnúmer" with "bókunarnúmer"` 
      : 
      `ENGLISH TERMINOLOGY RULES:
      - DO NOT replace "booking number" or "reference number" with "bókunarnúmer"
      - Keep all English terminology in English`;
    
    // Use a faster, smaller model since this is just for text processing
    const response = await openaiInstance.chat.completions.create({
      model: "gpt-4o", // Using main model until gpt-4o-mini is available
      messages: [
        { 
          role: "system", 
          content: `You are a specialized text processor for Sky Lagoon. Your job is to revise text to follow Sky Lagoon's terminology guidelines without changing meaning.
          
TERMINOLOGY RULES:
1. Replace "luxury" with "serenity"
2. Replace "pool" with "wellness"
3. Replace "swim" with "immerse"
4. Replace "hot" with "warmth"
5. Replace "staff" with "team members"
6. Replace "The Sky Lagoon" with "Sky Lagoon" (remove "the")
7. Replace "swimming pool" with "lagoon"
8. Replace "swimming" with "soak"
9. Replace "supplier" with "vendor"
10. Replace "bracelet" with "wristband"
11. Replace "in-water bar" or "in water bar" with "lagoon bar"
12. Replace "buy" with "purchase"
13. Replace standalone "water" with "geothermal water" EXCEPT in the following contexts:
   - "drinking water" (NEVER add "geothermal" to drinking water)
   - "water bottle" (NEVER replace with "geothermal water bottle")
   - "water shoes" (NEVER replace with "geothermal water shoes")
   - "fresh water" (keep as is)
   - "water stations" (keep as is)

${languageInstructions}

SPECIAL RULES:
- Fix "our our" to just "our"
- Always refer to the bar as "Gelmir lagoon bar" (not "in-water Gelmir bar")
- Fix any double phrases like "geothermal geothermal"
- NEVER add "geothermal" to "drinking water" phrases
- Maintain all emoji exactly as they are
- Preserve all factual information exactly

LANGUAGE-SPECIFIC PROCESSING:
- For English text: ONLY apply English terminology rules
- For Icelandic text: ONLY apply Icelandic terminology rules
- NEVER mix languages - don't insert Icelandic words into English text

Your task is ONLY to apply terminology changes. Do NOT:
- Change the meaning of the text
- Add or remove information
- Rephrase sentences unnecessarily
- Change the tone or style
- Remove or replace emoji

Revise the text to follow these guidelines while preserving the exact meaning, tone, and content.`
        },
        {
          role: "user",
          content: `Apply Sky Lagoon terminology guidelines to this text: ${text}`
        }
      ],
      temperature: 0.1, // Low temperature for consistent results
      max_tokens: 500   // Increased slightly for longer responses
    });
    
    const result = response.choices[0].message.content;
    const processingTime = (performance.now() - startTime).toFixed(2);
    
    console.log(`✨ AI terminology processing completed in ${processingTime}ms`);
    
    // Cache the result before returning
    terminologyCache.set(cacheKey, result);
    console.log(`💾 Added to terminology cache: size now ${terminologyCache.size}`);
    
    // Log the before and after to see what changes were made
    console.log(`🔄 Terminology changes: 
    BEFORE: "${text.slice(0, 100)}${text.length > 100 ? '...' : ''}"
    AFTER:  "${result.slice(0, 100)}${result.length > 100 ? '...' : ''}"`);
    
    // Clean up cache if it gets too large
    if (terminologyCache.size > TERMINOLOGY_CACHE_MAX_SIZE) {
      console.log(`\n🧹 Cleaning terminology cache (${terminologyCache.size} entries)`);
      const oldestKeys = [...terminologyCache.keys()].slice(0, 100);
      oldestKeys.forEach(key => terminologyCache.delete(key));
      console.log(`🧹 Removed ${oldestKeys.length} oldest terminology cache entries`);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ AI terminology processing error:', error);
    // Fallback to original text on error
    return text;
  }
};

/**
 * Filters out non-approved emojis from text
 * Keeps only Sky Lagoon approved emojis: 😊 ☁️ ✨ 🌞 🌅 📍
 * 
 * @param {string} text - The text containing emojis to filter
 * @param {string[]} approvedEmojis - Array of allowed emoji characters
 * @returns {string} - Text with only approved emojis
 */
export const filterEmojis = (text, approvedEmojis) => {
  let filteredText = text;
  let removedEmojis = [];
  
  // This regex finds all emoji characters in the text
  // In human terms: "Find any emoji character from the common emoji sets"
  // Examples of what it catches:
  // - Approved emojis we keep: 😊 ☁️ ✨ 🌞 🌅 📍
  // - Other emojis we remove: 🤖 🧠 📣 👀 😵‍💫 etc.
  filteredText = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{2600}-\u{26FF}]/gu, (match) => {
    if (approvedEmojis.includes(match)) {
      return match; // Keep approved emojis
    } else {
      removedEmojis.push(match); // Track removed emojis
      return ''; // Remove non-approved emojis
    }
  });
  
  // Log removed emojis if any were found
  if (removedEmojis.length > 0) {
    console.log(`🧹 Removed ${removedEmojis.length} non-approved emojis: ${removedEmojis.join(' ')}`);
  }
  
  return filteredText;
};

/**
 * Creates a normalized cache key from text
 * @param {string} text - The text to create a key from
 * @returns {string} - A normalized key for caching
 */
function createCacheKey(text) {
  // Create a simplified version of the text for caching
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim()
    .slice(0, 100);           // Use first 100 chars as basis for key
}