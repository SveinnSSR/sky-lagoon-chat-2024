// languageDetection.js
export const detectLanguage = (message, context = null) => {
    // Add the helper function here
    function containsBotName(text) {
        return /\bs[oó]lr[uú]n\b/i.test(text);
    }

    // Clean the message
    const cleanMessage = message.toLowerCase().trim();
    
    // Exclude Sky Lagoon package names and bot name from language detection
    const packageExclusionRegex = /\b(saman|sér|ser|hefd|hefð|venja|skjól|ritual|ritúal)\b/gi;
    // Add bot name exclusion - match both "sólrún" and "solrun"
    const botNameRegex = /\bs[oó]lr[uú]n\b/gi;
    
    const messageForDetection = cleanMessage
        .replace(/sky\s*lagoon/gi, '')
        .replace(packageExclusionRegex, '')
        .replace(botNameRegex, '') // Remove bot name before language detection
        .trim();
    
    // Check if the message has clear English sentence structure
    const hasEnglishSentenceStructure = (
        /^(tell|what|how|where|when|why|is|are|do|does|can|could|would|will|please|i want|i need|i would like|may i|could you|would you)/i.test(cleanMessage) ||
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
    
    // Check for strong English word count in the messageForDetection
    const englishWordCount = (messageForDetection.match(/\b(the|and|but|or|if|so|my|your|i|we|you|in|at|on|for|with|from|by|to|into|how|long|can|stay|chose|choose|transfer|selected|about|between|differences)\b/gi) || []).length;
    const messageWords = messageForDetection.split(/\s+/).filter(w => w.length > 1).length;
    
    // Stronger check for English word density
    if (englishWordCount >= 3 || (messageWords > 0 && englishWordCount / messageWords > 0.4)) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'english_word_density',
            metrics: { englishWordCount, messageWords, ratio: englishWordCount / messageWords }
        };
    }
    
    // Check if this is a greeting with bot name - if so, check for English greeting patterns
    if (botNameRegex.test(cleanMessage)) {
        // Reset the regex since we used it once already
        botNameRegex.lastIndex = 0;
        
        // Check if it starts with an English greeting and contains the bot name
        if (/^(hi|hello|hey|good morning|good afternoon|good evening|howdy|yo|wassup|whats up|what's up|sup|whazzup|whaddup|heya|hae)\b/i.test(cleanMessage) && 
            containsBotName(cleanMessage)) {
            return {
                isIcelandic: false,
                confidence: 'high',
                reason: 'english_greeting_with_bot_name',
                patterns: ['greeting_with_name']
            };
        }
    }
    
    // Only check for Icelandic special characters AFTER excluding packages, bot name, and checking English structure
    if (/[þæðöáíúéó]/i.test(messageForDetection)) {
        return {
            isIcelandic: true,
            confidence: 'high',
            reason: 'icelandic_special_chars',
            patterns: {
                hasChars: true
            }
        };
    }
    
    // Early check for Icelandic questions at the start
    if (/^(er|má|get|getur|hvað|hvenær|hvar|af hverju|hvernig|eru|eruð|eruði|geturðu)\b/i.test(messageForDetection)) {
        return {
            isIcelandic: true,
            confidence: 'high',
            reason: 'icelandic_question_start',
            patterns: {
                hasQuestion: true
            }
        };
    }
    
    // Rest of the function remains unchanged...
    // Early check for Icelandic discount terms
    if (/\b(afsláttur|afslætti|afsláttarkjör|verðlækkun|tilboð|sérkjör|betra verð|spara|sparnaður|ódýrara|lækkað verð|hagstætt verð|hagstæðara|lægra verð|afslættir|afsláttarkóði|afsláttarkóða)\b/i.test(messageForDetection)) {
        return {
            isIcelandic: true,
            confidence: 'high',
            reason: 'icelandic_discount_terms',
            patterns: {
                hasDiscountTerms: true
            }
        };
    }
    
    // Enhanced English patterns
    const englishPatterns = {
        common_words: /\b(temperature|time|price|cost|open|close|hours|towel|food|drink|ritual|pass|package|admission|facilities|parking|booking|reservation|location|directions|transport|shuttle|bus|pure|water|pool|shower|changing|room|ticket|gift|card|stay|long|can|how|about|what|difference|differences|between)\b/i,
        greetings: /^(hi|hey|hello|good\s*(morning|afternoon|evening))/i,
        questions: /^(please|can|could|would|tell|what|when|where|why|how|is|are|do|does|if|did)/i,
        gratitude: /(thanks|thank you)/i,
        common: /\b(the|and|but|or|if|so|my|your|our|their|its|i|we|you|in|at|on|for|with|from|by|to|into|choose|chose)\b/i,
        follow_ups: /^(and|or|but|so|also|what about)/i
    };

    // Enhanced Icelandic patterns
    const icelandicPatterns = {
        chars: /[þæðöáíúéó]/i,
        words: /\b(og|að|er|það|við|ekki|ég|þú|hann|hún|vera|hafa|vilja|þetta|góðan|daginn|kvöld|morgun|takk|fyrir|kemst|bóka|langar|vil|hvaða|strætó|fer|með|tíma|bílastæði|kaupa|multi|pass|þið|einhverja|eruð|eruði|þið|með)\b/i,
        greetings: /^(góðan|halló|hæ|sæl|sæll|bless)/i,
        questions: /^(er|má|get|getur|hvað|hvenær|hvar|af hverju|hvernig|eru|eruð|eruði|geturðu)/i,
        acknowledgments: /^(takk|já|nei|ok|oki|okei|flott|gott|bara|allt|snilld|snillingur|jam|jamm|geggjað|geggjuð|magnað|hjálpsamt|snilldin|skil|æði|æðislegt|æðisleg)\b/i,
        common_verbs: /\b(kemst|bóka|langar|vil|fer)\b/i,
        booking_terms: /\b(bóka|panta|tíma|stefnumót)\b/i,
        discount_terms: /\b(afsláttur|afslætti|afsláttarkjör|verðlækkun|tilboð|sérkjör|betra verð|spara|sparnaður|ódýrara|lækkað verð|hagstætt verð|hagstæðara|lægra verð|afslættir|afsláttarkóði|afsláttarkóða)\b/i
    };

    // Check for "multi pass" variations specifically
    if (/multi\s*-?\s*pass/i.test(messageForDetection)) {
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

    // Check Icelandic words using the filtered message
    if (icelandicPatterns.words.test(messageForDetection) || 
        icelandicPatterns.common_verbs.test(messageForDetection) ||
        icelandicPatterns.booking_terms.test(messageForDetection) ||
        icelandicPatterns.discount_terms.test(messageForDetection)) {
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

    // Special check for follow-up questions about packages
    if (/^what about\b/i.test(cleanMessage) && packageExclusionRegex.test(cleanMessage)) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'english_package_question',
            patterns: ['package_question']
        };
    }

    // Check for definite Icelandic
    const hasIcelandicChar = icelandicPatterns.chars.test(messageForDetection);
    const hasIcelandicWord = icelandicPatterns.words.test(messageForDetection);
    const hasIcelandicGreeting = icelandicPatterns.greetings.test(messageForDetection);
    const hasIcelandicQuestion = icelandicPatterns.questions.test(messageForDetection);
    const hasIcelandicDiscountTerms = icelandicPatterns.discount_terms.test(messageForDetection);

    if (hasIcelandicChar || hasIcelandicWord || hasIcelandicGreeting || hasIcelandicQuestion || hasIcelandicDiscountTerms) {
        return {
            isIcelandic: true,
            confidence: 'high',
            reason: 'icelandic_pattern_match',
            patterns: {
                hasChars: hasIcelandicChar,
                hasWords: hasIcelandicWord,
                hasGreeting: hasIcelandicGreeting,
                hasQuestion: hasIcelandicQuestion,
                hasDiscountTerms: hasIcelandicDiscountTerms
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
