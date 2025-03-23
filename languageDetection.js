// languageDetection.js
export const detectLanguage = (message, context = null) => {
    // Add the helper function here
    function containsBotName(text) {
        return /\bs[oó]lr[uú]n\b/i.test(text);
    }

    // Clean the message
    const cleanMessage = message.toLowerCase().trim();
    
    // NEW ADDITION: Create hotel and location exclusion regex
    const hotelAndLocationRegex = /\b(hótel|hotel|bus stop|strætóstoppistöð|hallgrímskirkja|óðinsvé|harpa|ráðhúsið|tjörnin|lækjargata|miðbakki|vesturbugt|höfðatorg|rauðarárstígur|austurbær|snorrabraut|skúlagata|reykjavík|kópavogur)\b/gi;
    
    // NEW ADDITION: IMMEDIATE CHECK for exclusively English message structures
    if (/^hello|^hi\b|thank you|regards|\bmy question is\b|would like to|will we be|is at the|\bor\b/i.test(cleanMessage)) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'clear_english_message_structure',
            patterns: ['english_structure']
        };
    }
    
    // NEW ADDITION: IMMEDIATE CHECK for uniquely Icelandic characters before anything else
    if (/[þæðö]/i.test(cleanMessage)) {
        // NEW ADDITION: But first check if this is just an English message with Icelandic place names
        const messageWithoutLocations = cleanMessage.replace(hotelAndLocationRegex, '');
        if (!/[þæðö]/i.test(messageWithoutLocations) && 
            /\b(i am|i'm|we are|we're|please|could you|would|will|can|how|what|where|when|if)\b/i.test(cleanMessage)) {
            return {
                isIcelandic: false,
                confidence: 'high',
                reason: 'english_with_icelandic_locations',
                patterns: ['english_structure_with_icelandic_nouns']
            };
        }
        
        return {
            isIcelandic: true,
            confidence: 'high',
            reason: 'icelandic_unique_chars_immediate',
            patterns: {
                hasChars: true
            }
        };
    }

    // ADD SAFEGUARD HERE: Clear English detection
    if (/^(we are|we're|i am|i'm)\b/i.test(cleanMessage) || 
        /\b(what time|how far|how much|how many)\b/i.test(cleanMessage)) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'clear_english_detected',
            patterns: ['clear_english']
        };
    }    
    
    // Exclude Sky Lagoon package names and bot name from language detection
    const packageExclusionRegex = /\b(saman|sér|ser|hefd|hefð|venja|skjól|ritual|ritúal)\b/gi;
    // Add bot name exclusion - match both "sólrún" and "solrun"
    const botNameRegex = /\bs[oó]lr[uú]n\b/gi;
    
    const messageForDetection = cleanMessage
        .replace(/\b(sky\s*lagoon|pure\s*pass|sky\s*pass|saman\s*pass)\b/gi, '')
        .replace(packageExclusionRegex, '')
        .replace(botNameRegex, '') // Remove bot name before language detection
        .replace(hotelAndLocationRegex, '') // NEW: Remove hotel and location references
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
    
    // REMOVED FROM HERE: English word density check (moved below)
    
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
    
    // Check for non-supported languages
    
    // Spanish patterns - Strong but flexible with safeguard
    if (
        // EITHER has Spanish-unique characters
        /[ñ¿¡]/i.test(cleanMessage) ||
        // OR has multiple strong Spanish indicators AND NOT clear English
        ((/\b(está|estás|estoy|estamos|están|tiene|tienen|tengo)\b/i.test(cleanMessage) || // Spanish verb forms
          /\b(cómo|cuándo|dónde|cuánto|qué|quién|cuál)\b/i.test(cleanMessage)) && // Spanish question words
         // AND more Spanish context
         (/\b(por favor|gracias|aquí|allí|ahora|después|antes)\b/i.test(cleanMessage) || 
          /\b(el|la|los|las)\b.*\b(es|son|está)\b/i.test(cleanMessage)) &&
         // NOT clear English
         !(/\b(we are|we're|i am|i'm|what time|how far|how much|can i|can we|could you|will you)\b/i.test(cleanMessage)))
    ) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'non_supported_language',
            detectedLanguage: 'spanish'
        };
    }
    
    // French patterns - Strong but flexible with safeguard
    if (
        // EITHER has uniquely French character patterns
        (/\b(\w*[éèêëçôœ]\w*)\b/i.test(cleanMessage) && /\b(je|tu|il|elle|nous|vous|ils)\b/i.test(cleanMessage) ||
        // OR has multiple strong French indicators AND NOT clear English
        ((/\b(je suis|tu es|il est|elle est|nous sommes|vous êtes)\b/i.test(cleanMessage) || // French verb phrases
          /\b(pourquoi|comment|quand|combien|où|quel|quelle)\b/i.test(cleanMessage)) && // French question words
         // AND more French context
         (/\b(s'il vous plaît|merci|votre|notre|cette|celui|celle)\b/i.test(cleanMessage) ||
          /\b(le|la|les|un|une)\b.*\b(est|sont|sera)\b/i.test(cleanMessage)) &&
         // NOT clear English
         !(/\b(we are|we're|i am|i'm|what time|how far|how much|can i|can we|could you|will you)\b/i.test(cleanMessage))))
    ) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'non_supported_language',
            detectedLanguage: 'french'
        };
    }
    
    // German patterns - Strong but flexible with safeguard
    if (
        // EITHER has uniquely German characters
        /[äöüß]/i.test(cleanMessage) ||
        // OR has multiple strong German indicators AND NOT clear English
        ((/\b(ich bin|du bist|er ist|sie ist|wir sind|ihr seid|sie sind)\b/i.test(cleanMessage) || // German verb phrases
          /\b(warum|wie|wann|wo|welche|wessen|wem|wen)\b/i.test(cleanMessage)) && // German question words
         // AND more German context
         (/\b(bitte|danke|nicht|auch|sehr|jetzt|hier|dort)\b/i.test(cleanMessage) ||
          /\b(der|die|das|ein|eine)\b.*\b(ist|sind|war)\b/i.test(cleanMessage)) &&
         // NOT clear English
         !(/\b(we are|we're|i am|i'm|what time|how far|how much|can i|can we|could you|will you)\b/i.test(cleanMessage)))
    ) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'non_supported_language',
            detectedLanguage: 'german'
        };
    }

    // Italian patterns - Strong but flexible
    if (
        // Multiple strong Italian indicators
        ((/\b(sono|sei|è|siamo|siete|sono|ho|hai|ha|abbiamo)\b/i.test(cleanMessage) || // Italian verb forms
          /\b(perché|come|quando|dove|quanto|quale|chi|cosa)\b/i.test(cleanMessage)) && // Italian question words
         // AND more Italian context
         (/\b(grazie|prego|scusi|per favore|questo|questa|questi)\b/i.test(cleanMessage) ||
          /\b(il|lo|la|i|gli|le)\b.*\b(è|sono|ha)\b/i.test(cleanMessage))) // Italian article+verb patterns
    ) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'non_supported_language',
            detectedLanguage: 'italian'
        };
    }
    
    // Asian languages detection (Korean, Chinese, Japanese, etc.)
    // Korean (Hangul) character range
    if (/[\uAC00-\uD7AF\u1100-\u11FF]/u.test(cleanMessage)) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'non_supported_language',
            detectedLanguage: 'korean'
        };
    }
    
    // Chinese character range
    if (/[\u4E00-\u9FFF]/u.test(cleanMessage)) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'non_supported_language',
            detectedLanguage: 'chinese'
        };
    }
    
    // Japanese character ranges
    if (/[\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/u.test(cleanMessage)) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'non_supported_language',
            detectedLanguage: 'japanese'
        };
    }
    
    // Russian Cyrillic character range
    if (/[\u0400-\u04FF]/u.test(cleanMessage)) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'non_supported_language',
            detectedLanguage: 'russian'
        };
    }
    
    // Thai character range
    if (/[\u0E00-\u0E7F]/u.test(cleanMessage)) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'non_supported_language',
            detectedLanguage: 'thai'
        };
    }

    // Arabic script detection (used in Arabic, Persian/Farsi, Urdu, etc.)
    if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/u.test(cleanMessage)) {
        return {
            isIcelandic: false,
            confidence: 'high',
            reason: 'non_supported_language',
            detectedLanguage: 'arabic_script'
        };
    }    
    
    // Only check for Icelandic special characters AFTER excluding packages, bot name, and checking English structure
    if (/[þæðöáíúéó]/i.test(messageForDetection)) {
        // First check for uniquely Icelandic characters (þ, æ, ð, ö)
        if (/[þæðö]/i.test(messageForDetection)) {
            return {
                isIcelandic: true,
                confidence: 'high',
                reason: 'icelandic_unique_chars',
                patterns: {
                    hasChars: true
                }
            };
        }
        
        // For shared characters (á, í, ú, é, ó), require additional Icelandic context
        // Comprehensive check for Icelandic words and patterns
        const hasIcelandicWords = /\b(og|að|er|það|við|ekki|ég|þú|hann|hún|eru|sé|má|mér|þetta|þessi|hafa|vera|eða|en|því|svona|hér|þar|nú|með|fyrir|frá|til|um|hjá|úr|inn|út|upp|niður|yfir|undir)\b/i.test(messageForDetection);
        
        // Check for Icelandic grammatical patterns
        const hasIcelandicGrammar = /\b(er að|var að|hefur|höfum|höfðu|verið að|mun|myndi|vildi|gæti|ætti|getur|má|skal|þarf að|á að|get|getum|vilji)\b/i.test(messageForDetection);
        
        // Check for common Icelandic phrases
        const hasIcelandicPhrases = /\b(takk fyrir|takk|góðan daginn|góðan dag|halló|hæ|sæll|sæl|já|nei|gott kvöld|gott að vita|get ég|er hægt)\b/i.test(messageForDetection);
        
        // Icelandic question starters
        const hasIcelandicQuestions = /^(hvað|hvernig|hvenær|hvar|hver|hvers vegna|af hverju|hvort|hverjir|hvaða|get ég|má ég|er hægt að|eruð þið)\b/i.test(messageForDetection);
        
        if (hasIcelandicWords || hasIcelandicGrammar || hasIcelandicPhrases || hasIcelandicQuestions) {
            return {
                isIcelandic: true,
                confidence: 'high',
                reason: 'icelandic_language_patterns',
                patterns: {
                    hasChars: true,
                    hasWords: hasIcelandicWords,
                    hasGrammar: hasIcelandicGrammar,
                    hasPhrases: hasIcelandicPhrases,
                    hasQuestions: hasIcelandicQuestions
                }
            };
        }
    }
    
    // MOVED TO HERE: English word density check
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
    
    // Early check for Icelandic questions at the start
    if (/^(hverjir|hver|hvert|hverju|hvort|hvers|hverja|er|má|get|getur|hvað|hvenær|hvar|af hverju|hvernig|eru|eruð|eruði|geturðu)\b/i.test(messageForDetection)) {
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