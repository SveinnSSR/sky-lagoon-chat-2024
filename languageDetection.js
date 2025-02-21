// Create a new file: languageDetection.js
export const detectLanguage = (message, context = null) => {
    // Clean the message
    const cleanMessage = message.toLowerCase().trim();

    // Enhanced English patterns
    const englishPatterns = {
        common_words: /\b(temperature|time|price|cost|open|close|hours|towel|food|drink|ritual|pass|package|admission|facilities|parking|booking|reservation|location|directions|transport|shuttle|bus|pure|sky|water|pool|shower|changing|room|ticket|gift|card)\b/i,
        greetings: /^(hi|hey|hello|good\s*(morning|afternoon|evening))/i,
        questions: /^(please|can|could|would|tell|what|when|where|why|how|is|are|do|does)/i,
        gratitude: /(thanks|thank you)/i,
        common: /\b(the|and|but|or|if|so|my|your|our|their|its)\b/i,
        follow_ups: /^(and|or|but|so|also|what about)/i
    };

    // Enhanced Icelandic patterns
    const icelandicPatterns = {
        chars: /[þæðöáíúéó]/i,
        words: /\b(og|að|er|það|við|ekki|ég|þú|hann|hún|vera|hafa|vilja|þetta|góðan|daginn|kvöld|morgun|takk|fyrir)\b/i,
        greetings: /^(góðan|halló|hæ|sæl|sæll|bless)/i,
        questions: /^(er|má|get|getur|hvað|hvenær|hvar|af hverju|hvernig|eru|geturðu)/i,
        acknowledgments: /^(takk|já|nei|ok|oki|okei|flott|gott|bara|allt|snilld|snillingur|jam|jamm|geggjað|geggjuð|magnað|hjálpsamt|snilldin|skil|æði|æðislegt|æðisleg)\b/i
    };

    // Add the acknowledgment check HERE, before any English checks
    if (icelandicPatterns.acknowledgments.test(cleanMessage)) {
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

    // Check for single word English terms first
    if (englishPatterns.common_words.test(cleanMessage)) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'english_term_match',
            patterns: ['common_words']
        };
    }

    // Check for definite English
    const hasEnglishMarkers = Object.values(englishPatterns).some(pattern => pattern.test(cleanMessage));
    if (hasEnglishMarkers) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'english_pattern_match',
            patterns: Object.keys(englishPatterns).filter(key => englishPatterns[key].test(cleanMessage))
        };
    }

    // Check for definite Icelandic
    const hasIcelandicChar = icelandicPatterns.chars.test(cleanMessage);
    const hasIcelandicWord = icelandicPatterns.words.test(cleanMessage);
    const hasIcelandicGreeting = icelandicPatterns.greetings.test(cleanMessage);
    const hasIcelandicQuestion = icelandicPatterns.questions.test(cleanMessage);

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
