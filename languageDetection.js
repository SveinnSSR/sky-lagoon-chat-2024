// languageDetection.js
export const detectLanguage = (message, context = null) => {
    // Clean the message
    const cleanMessage = message.toLowerCase().trim();
    
    // Exclude Sky Lagoon package names from language detection
    const packageExclusionRegex = /\b(saman|sér|ser|hefd|hefð|venja)\b/gi;
    const messageForDetection = cleanMessage
        .replace(/sky\s*lagoon/gi, '')
        .replace(packageExclusionRegex, '')
        .trim();
    
    // Enhanced English patterns
    const englishPatterns = {
        common_words: /\b(temperature|time|price|cost|open|close|hours|towel|food|drink|ritual|pass|package|admission|facilities|parking|booking|reservation|location|directions|transport|shuttle|bus|pure|water|pool|shower|changing|room|ticket|gift|card|stay|long|can|how)\b/i,
        greetings: /^(hi|hey|hello|good\s*(morning|afternoon|evening))/i,
        questions: /^(please|can|could|would|tell|what|when|where|why|how|is|are|do|does|if|did)/i,
        gratitude: /(thanks|thank you)/i,
        common: /\b(the|and|but|or|if|so|my|your|our|their|its|i|we|you|in|at|on|for|with|from|by|to|into|choose|chose)\b/i,
        follow_ups: /^(and|or|but|so|also|what about)/i
    };

    // Enhanced Icelandic patterns with additional common words
    const icelandicPatterns = {
        chars: /[þæðöáíúéó]/i,
        words: /\b(og|að|er|það|við|ekki|ég|þú|hann|hún|vera|hafa|vilja|þetta|góðan|daginn|kvöld|morgun|takk|fyrir|kemst|bóka|langar|vil|hvaða|strætó|fer|með|tíma|bílastæði|kaupa|multi|pass)\b/i,
        greetings: /^(góðan|halló|hæ|sæl|sæll|bless)/i,
        questions: /^(er|má|get|getur|hvað|hvenær|hvar|af hverju|hvernig|eru|geturðu)/i,
        acknowledgments: /^(takk|já|nei|ok|oki|okei|flott|gott|bara|allt|snilld|snillingur|jam|jamm|geggjað|geggjuð|magnað|hjálpsamt|snilldin|skil|æði|æðislegt|æðisleg)\b/i,
        common_verbs: /\b(kemst|bóka|langar|vil|fer)\b/i,
        booking_terms: /\b(bóka|panta|tíma|stefnumót)\b/i
    };

    // Check if the message has clear English sentence structure
    const hasEnglishSentenceStructure = (
        englishPatterns.questions.test(cleanMessage) || 
        /\bi\s+(?:am|was|have|had|would|will|want|need|chose|choose)\b/i.test(cleanMessage) ||
        /\bif\s+i\b/i.test(cleanMessage) ||
        /\bhow\s+(?:long|much|many|do|does|can|could)\b/i.test(cleanMessage)
    );
    
    if (hasEnglishSentenceStructure) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'english_sentence_structure',
            patterns: ['sentence_structure']
        };
    }

    // Check for strong English word count in the messageForDetection (with package names excluded)
    const englishWordCount = (messageForDetection.match(/\b(the|and|but|or|if|so|my|your|i|we|you|in|at|on|for|with|from|by|to|into|how|long|can|stay|chose|choose|transfer|selected)\b/gi) || []).length;
    const messageWords = messageForDetection.split(/\s+/).filter(w => w.length > 1).length;
    
    if (englishWordCount >= 3 || (messageWords > 0 && englishWordCount / messageWords > 0.4)) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'english_word_density',
            metrics: { englishWordCount, messageWords, ratio: englishWordCount / messageWords }
        };
    }

    // Your existing checks follow
    // Check for "multi pass" variations specifically
    if (/multi\s*-?\s*pass/i.test(cleanMessage)) {
        return {
            isIcelandic: true,
            confidence: 'high',
            reason: 'contains_multipass',
            patterns: {
                hasChars: false,
                hasWords: true,
                hasGreeting: false,
                hasQuestion: false
            }
        };
    }

    // Check Icelandic words using the filtered message
    if (icelandicPatterns.words.test(messageForDetection) || 
        icelandicPatterns.common_verbs.test(messageForDetection) ||
        icelandicPatterns.booking_terms.test(messageForDetection)) {
        return {
            isIcelandic: true,
            confidence: 'high',
            reason: 'icelandic_words_match',
            patterns: {
                hasChars: false,
                hasWords: true,
                hasGreeting: false,
                hasQuestion: false
            }
        };
    }

    // Add the acknowledgment check
    if (icelandicPatterns.acknowledgments.test(messageForDetection)) {
        return {
            isIcelandic: true,
            confidence: 'high',
            reason: 'icelandic_pattern_match',
            patterns: {
                hasChars: false,
                hasWords: true,
                hasGreeting: false,
                hasQuestion: false
            }
        };
    }

    // Check for single word English terms in cleaned message
    if (englishPatterns.common_words.test(messageForDetection)) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'english_term_match',
            patterns: ['common_words']
        };
    }

    // Check for definite English in cleaned message
    const hasEnglishMarkers = Object.values(englishPatterns).some(pattern => 
        pattern.test(messageForDetection));
    if (hasEnglishMarkers) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'english_pattern_match',
            patterns: Object.keys(englishPatterns).filter(key => 
                englishPatterns[key].test(messageForDetection))
        };
    }

    // Check for definite Icelandic
    const hasIcelandicChar = icelandicPatterns.chars.test(cleanMessage);
    const hasIcelandicWord = icelandicPatterns.words.test(messageForDetection);
    const hasIcelandicGreeting = icelandicPatterns.greetings.test(messageForDetection);
    const hasIcelandicQuestion = icelandicPatterns.questions.test(messageForDetection);

    if (hasIcelandicChar || hasIcelandicWord || hasIcelandicGreeting || hasIcelandicQuestion) {
        return {
            isIcelandic: true,
            confidence: 'high',
            reason: 'icelandic_pattern_match',
            patterns: {
                hasChars: hasIcelandicChar,
                hasWords: hasIcelandicWord,
                hasGreeting: hasIcelandicGreeting,
                hasQuestion: hasIcelandicQuestion
            }
        };
    }

    // Use context for follow-ups if available
    if (context?.lastLanguage) {
        // Check if it's a likely follow-up
        const isFollowUp = /^(and|or|but|so|also|what about)/i.test(cleanMessage);
        return {
            isIcelandic: context.lastLanguage === 'is',
            confidence: isFollowUp ? 'high' : 'medium',
            reason: 'context_based',
            isFollowUp
        };
    }

    // Default to English
    return {
        isIcelandic: false,
        confidence: 'low',
        reason: 'default_to_english',
        fallback: true
    };
};
