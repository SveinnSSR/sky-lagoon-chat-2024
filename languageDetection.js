// languageDetection.js - Enhanced version with Icelandic priority
export const detectLanguage = (message, context = null) => {
    // Add the helper function here
    function containsBotName(text) {
        return /\bs[oó]lr[uú]n\b/i.test(text);
    }

    // Clean the message
    const cleanMessage = message.toLowerCase().trim();
    
    // Create hotel and location exclusion regex
    const hotelAndLocationRegex = /\b(hótel|hotel|bus stop|strætóstoppistöð|hallgrímskirkja|óðinsvé|harpa|ráðhúsið|tjörnin|lækjargata|miðbakki|vesturbugt|höfðatorg|rauðarárstígur|austurbær|snorrabraut|skúlagata|reykjavík|kópavogur)\b/gi;
    
    // FOCUS PRIMARILY ON ICELANDIC VS ENGLISH DETECTION
    // Immediate check for uniquely Icelandic characters
    if (/[þæð]/i.test(cleanMessage)) { // Note: removed ö as it appears in many languages
        // Check if this is just an English message with Icelandic place names
        const messageWithoutLocations = cleanMessage.replace(hotelAndLocationRegex, '');
        if (!/[þæð]/i.test(messageWithoutLocations) && 
            /\b(i am|i'm|we are|we're|please|could you|would|will|can|how|what|where|when|if)\b/i.test(cleanMessage)) {
            return {
                isIcelandic: false,
                language: 'en',
                confidence: 'high',
                reason: 'english_with_icelandic_locations'
            };
        }
        
        return {
            isIcelandic: true,
            language: 'is',
            confidence: 'high',
            reason: 'icelandic_unique_chars_immediate'
        };
    }

    // Clear English detection
    if (/^(hello|hi|hey)\b/i.test(cleanMessage) ||
        /^(we are|we're|i am|i'm)\b/i.test(cleanMessage) || 
        /\b(what time|how far|how much|how many)\b/i.test(cleanMessage) ||
        /^(can|could|would|should|may)\b/i.test(cleanMessage)) {
        return {
            isIcelandic: false,
            language: 'en',
            confidence: 'high',
            reason: 'clear_english_detected'
        };
    }
    
// *****************************************************************
    // ENHANCED LANGUAGE DETECTION WITH SCORING SYSTEM
    // Instead of immediately marking as Icelandic when business terms are found,
    // we'll use a scoring approach to better handle mixed-language content

    // First check for definitive language markers (these take precedence)
    // Immediate check for uniquely Icelandic characters
    if (/[þð]/i.test(cleanMessage)) {
        // Check if this is just an English message with Icelandic place names
        const messageWithoutLocations = cleanMessage.replace(hotelAndLocationRegex, '');
        if (!/[þð]/i.test(messageWithoutLocations) && 
            /\b(i am|i'm|we are|we're|please|could you|would|will|can|how|what|where|when|if)\b/i.test(cleanMessage)) {
            return {
                isIcelandic: false,
                language: 'en',
                confidence: 'high',
                reason: 'english_with_icelandic_locations'
            };
        }
        
        return {
            isIcelandic: true,
            language: 'is',
            confidence: 'high',
            reason: 'icelandic_unique_chars_immediate'
        };
    }

    // Create a version of the message that removes hyphens for word matching
    const cleanMessageWithoutHyphens = cleanMessage.replace(/-/g, ' ');

    // BUSINESS TERMS DETECTION - New scoring approach
    // Check for Icelandic business terms - also check without hyphens
    const hasIcelandicBusinessTerms = 
        /\b(saman|sér|skjól|ritúal|pakkinn|pakkanum|pakka|leiðin|gjafakort|gjafabréf|lónið|hver er munurinn|milli pakka)\b/i.test(cleanMessage) ||
        /\b(hver er|hvað er|hvernig|hvenær|af hverju|get ég|er munurinn|kostar|má ég|opnunartími|verð)\b/i.test(cleanMessage) ||
        /\b(bóka|tíma|aðgangur|heimsókn|mæta seint|opið|lokað|helgi|vika|dagur)\b/i.test(cleanMessage) ||
        /\b(saman|sér|skjól|ritúal|pakkinn|pakkanum|pakka|leiðin|gjafakort|gjafabréf|lónið)\b/i.test(cleanMessageWithoutHyphens);

    // MULTI-LANGUAGE DETECTION FOR BUSINESS TERMS
    // This section detects various languages that might contain Icelandic business terms

    // English indicators
    const hasEnglishIndicators = 
        // Function words
        /\b(the|a|an|in|on|at|for|with|by|about|from|to|of)\b/i.test(cleanMessage) ||
        // Auxiliary verbs
        /\b(is|are|am|was|were|be|been|being|do|does|did|have|has|had|can|could|will|would|shall|should|may|might|must)\b/i.test(cleanMessage) ||
        // Pronouns
        /\b(i|we|you|he|she|it|they|me|us|him|her|them|my|our|your|his|her|its|their)\b/i.test(cleanMessage) ||
        // Question words and patterns
        /\b(what|when|where|who|whom|whose|why|how|which)\b/i.test(cleanMessage) ||
        // Common verbs
        /\b(want|need|like|book|offer|make|go|get|come|know|see|take|find|give|tell|think|say|let|ask|work|seem|feel|try|leave|call)\b/i.test(cleanMessage);

    // Spanish indicators
    const hasSpanishIndicators = 
        // Function words
        /\b(el|la|los|las|un|una|unos|unas|en|de|con|por|para|a|al|del)\b/i.test(cleanMessage) ||
        // Question words
        /\b(qué|cómo|cuándo|dónde|quién|cuál|cuánto|por qué)\b/i.test(cleanMessage) ||
        // Verbs and common words
        /\b(es|son|está|están|tiene|tienen|incluye|quiero|puedo|necesito|hay|ser|estar|tener|hacer|ir|venir|ver|dar|saber)\b/i.test(cleanMessage) ||
        // Spanish question marks or unique characters
        /[¿¡ñ]/i.test(cleanMessage);

    // French indicators
    const hasFrenchIndicators = 
        // Function words
        /\b(le|la|les|un|une|des|du|de la|au|aux|en|dans|sur|sous|avec|sans|pour|par|chez)\b/i.test(cleanMessage) ||
        // Verbs
        /\b(est|sont|a|ont|être|avoir|faire|aller|venir|voir|savoir|pouvoir|vouloir|devoir|falloir)\b/i.test(cleanMessage) ||
        // Pronouns
        /\b(je|tu|il|elle|nous|vous|ils|elles|mon|ton|son|notre|votre|leur|moi|toi|lui|eux)\b/i.test(cleanMessage) ||
        // Question words
        /\b(quoi|qui|quand|où|comment|pourquoi|combien|quel|quelle|quels|quelles|lequel|laquelle)\b/i.test(cleanMessage) ||
        // French-specific characters
        /[èêëçôœ]/i.test(cleanMessage);

    // German indicators - enhanced
    const hasGermanIndicators = 
        // Articles and common words
        /\b(der|die|das|den|dem|des|ein|eine|einer|eines|einem|einen|im)\b/i.test(cleanMessage) ||
        // Verbs
        /\b(ist|sind|war|waren|sein|haben|hatte|hatten|können|kann|könnte|müssen|muss|wollen|will|sollen|dürfen|enthalten)\b/i.test(cleanMessage) ||
        // Pronouns
        /\b(ich|du|er|sie|es|wir|ihr|mein|dein|sein|unser|euer|mir|dir|ihm|ihr|uns|euch|ihnen)\b/i.test(cleanMessage) ||
        // Question words
        /\b(was|wer|wo|wann|wie|warum|weshalb|welche|welcher|welches|wem|wen)\b/i.test(cleanMessage) ||
        // Prepositions
        /\b(in|an|auf|mit|nach|bei|zu|von|bis|über|unter|durch|für|gegen|ohne|um|zwischen)\b/i.test(cleanMessage) ||
        // German-specific characters
        /[äöüß]/i.test(cleanMessage) ||
        // Specific package-related German words
        /\b(paket|preis|kosten|beinhaltet|enthält|inbegriffen)\b/i.test(cleanMessage);

    // Add specific package query patterns for German
    const hasGermanPackageQuery = /\b(was|welche)\b.*\b(paket|pakete|enthält|enthalten|inbegriffen|beinhaltet|kosten)\b/i.test(cleanMessage) ||
                             /\b(preis|kosten)\b.*\b(paket|pakete)\b/i.test(cleanMessage);

    // Italian indicators - enhanced with more common words and verb forms
    const hasItalianIndicators = 
        // Articles and common words
        /\b(il|lo|la|i|gli|le|un|uno|una|del|dello|della|dei|degli|delle)\b/i.test(cleanMessage) ||
        // Verbs and verb forms
        /\b(è|sono|era|erano|essere|avere|ha|hanno|fare|va|vanno|venire|vedere|sapere|potere|volere|dovere|vorrei|voglio|prenotare|prenoto|prendo|prenoterò)\b/i.test(cleanMessage) ||
        // Pronouns
        /\b(io|tu|lui|lei|noi|voi|loro|mio|tuo|suo|nostro|vostro|me|te|lui|lei|noi|voi|loro)\b/i.test(cleanMessage) ||
        // Question words
        /\b(cosa|chi|quando|dove|come|perché|quanto|quale|quali|che)\b/i.test(cleanMessage) ||
        // Common Italian prepositions and adverbs
        /\b(per|con|da|su|tra|fra|dopo|prima|domani|oggi|ieri|qui|qua|lì|là)\b/i.test(cleanMessage) ||
        // Common Italian nouns
        /\b(pacchetto|prezzo|costo|biglietto|ingresso|visita|orario|giorno|ora|prenotazione)\b/i.test(cleanMessage);

    // Portuguese indicators 
    /*
    const hasPortugueseIndicators = 
        // Articles and common words
        /\b(o|a|os|as|um|uma|uns|umas|do|da|dos|das|no|na|nos|nas)\b/i.test(cleanMessage) ||
        // Verbs
        /\b(é|são|era|eram|ser|estar|tem|têm|tinha|tinham|fazer|ir|vir|ver|saber|poder|querer|dever)\b/i.test(cleanMessage) ||
        // Pronouns
        /\b(eu|tu|você|ele|ela|nós|vós|vocês|eles|elas|meu|teu|seu|nosso|vosso|me|te|lhe|nos)\b/i.test(cleanMessage) ||
        // Question words
        /\b(o que|quem|quando|onde|como|por que|quanto|qual|quais|que)\b/i.test(cleanMessage) ||
        // Portuguese-specific characters
        /[àâãêõç]/i.test(cleanMessage);
    */
    // Temporarily disabled Portuguese detection
    const hasPortugueseIndicators = false;

    // Calculate word densities for each language
    const businessTermMessageWords = cleanMessage.split(/\s+/).filter(w => w.length > 1).length;
    
    // English density
    const businessTermEnglishWordCount = (cleanMessage.match(/\b(the|and|but|or|if|so|my|your|i|we|you|in|at|on|for|with|from|by|to|into|how|long|can|stay|chose|choose|transfer|selected|about|between|differences|this|that|these|those|is|are|was|were|will|would|shall|should|has|have|had|been|being|do|does|did|doing|what|where|when|why|who|how|which)\b/gi) || []).length;
    const englishDensity = businessTermMessageWords > 0 ? businessTermEnglishWordCount / businessTermMessageWords : 0;
    
    // Spanish density
    const spanishWordCount = (cleanMessage.match(/\b(el|la|los|las|un|una|unos|unas|en|de|con|por|para|a|al|del|qué|cómo|cuándo|dónde|quién|cuál|cuánto|es|son|está|están|tiene|tienen|incluye|quiero|puedo|necesito|hay|ser|estar|tener|hacer|ir|venir|ver|dar|saber|y|o|pero|si|porque|cuando|como|donde)\b/gi) || []).length;
    const spanishDensity = businessTermMessageWords > 0 ? spanishWordCount / businessTermMessageWords : 0;
    
    // French density
    const frenchWordCount = (cleanMessage.match(/\b(le|la|les|un|une|des|du|de|la|au|aux|en|dans|sur|sous|avec|sans|pour|par|chez|est|sont|a|ont|être|avoir|faire|aller|venir|voir|savoir|pouvoir|vouloir|devoir|falloir|je|tu|il|elle|nous|vous|ils|elles|et|ou|mais|si|parce|que|quand|comme|où)\b/gi) || []).length;
    const frenchDensity = businessTermMessageWords > 0 ? frenchWordCount / businessTermMessageWords : 0;
    
    // German density - enhanced to handle hyphens better
    const germanWordCount = (cleanMessage.match(/\b(der|die|das|den|dem|des|ein|eine|einer|eines|einem|einen|ist|sind|war|waren|sein|haben|hatte|hatten|können|kann|könnte|müssen|muss|wollen|will|sollen|dürfen|ich|du|er|sie|es|wir|ihr|und|oder|aber|wenn|weil|dass|als|wie|wo|im|paket|enthalten)\b/gi) || []).length;
    const germanDensity = businessTermMessageWords > 0 ? germanWordCount / businessTermMessageWords : 0;

    // Italian density - enhanced with more Italian words
    const italianWordCount = (cleanMessage.match(/\b(il|lo|la|i|gli|le|un|uno|una|del|dello|della|dei|degli|delle|è|sono|era|erano|essere|avere|ha|hanno|fare|va|vanno|venire|vedere|sapere|potere|volere|dovere|vorrei|voglio|prenotare|prenoto|e|o|ma|se|perché|quando|come|dove|per|con|da|su|tra|fra|dopo|prima|domani|oggi|ieri|qui|qua|lì|là|pacchetto|prezzo|costo|biglietto|ingresso|visita|orario)\b/gi) || []).length;
    const italianDensity = businessTermMessageWords > 0 ? italianWordCount / businessTermMessageWords : 0;
    
    // Portuguese density
    /*
    const portugueseWordCount = (cleanMessage.match(/\b(o|a|os|as|um|uma|uns|umas|do|da|dos|das|no|na|nos|nas|é|são|era|eram|ser|estar|tem|têm|tinha|tinham|fazer|ir|vir|ver|saber|poder|querer|dever|e|ou|mas|se|porque|quando|como|onde)\b/gi) || []).length;
    const portugueseDensity = businessTermMessageWords > 0 ? portugueseWordCount / businessTermMessageWords : 0;
    */
    // Temporarily disabled
    const portugueseWordCount = 0;
    const portugueseDensity = 0;

    // COMPREHENSIVE LANGUAGE DECISION WITH BUSINESS TERMS
    if (hasIcelandicBusinessTerms) {
        // SHORT MESSAGE HANDLING - ADD THIS AS THE FIRST CHECK
        // For very short edge case messages with business terms
        if (cleanMessage.split(/\s+/).length <= 3) {
            // Check for common English words in short messages
            const hasCommonEnglishWords = /\b(price|cost|info|about|book|time|open|hour|ticket|help|need|want|get|buy|when|how|what|where|why|who|which)\b/i.test(cleanMessage);
            
            if (hasCommonEnglishWords) {
                return {
                    isIcelandic: false,
                    language: 'en',
                    confidence: 'high',
                    reason: 'short_english_with_business_term'
                };
            }
        }       

        // Find the dominant language by checking indicators and density
        
        // English detection - reusing existing variables
        if (hasEnglishIndicators && (englishDensity > 0.25 || businessTermEnglishWordCount >= 3)) {
            return {
                isIcelandic: false,
                language: 'en',
                confidence: 'high',
                reason: 'english_with_icelandic_terms'
            };
        }
        
        // Spanish detection - reusing existing variables from earlier in the code
        if (hasSpanishIndicators && (spanishDensity > 0.25 || spanishWordCount >= 2)) {
            return {
                isIcelandic: false,
                language: 'es',
                confidence: 'high',
                reason: 'spanish_with_icelandic_terms'
            };
        }
        
        // German detection - enhanced with lower threshold and package query detection
        if (hasGermanIndicators && (germanDensity > 0.2 || germanWordCount >= 2 || hasGermanPackageQuery)) {
            return {
                isIcelandic: false,
                language: 'de',
                confidence: 'high',
                reason: 'german_with_icelandic_terms'
            };
        }
        
        // French detection
        if (hasFrenchIndicators && (frenchDensity > 0.25 || frenchWordCount >= 2)) {
            return {
                isIcelandic: false,
                language: 'fr',
                confidence: 'high',
                reason: 'french_with_icelandic_terms'
            };
        }
        
        // Italian detection - FIXED: Changed language code from 'de' to 'it'
        if (hasItalianIndicators && (italianDensity > 0.25 || italianWordCount >= 2)) {
            return {
                isIcelandic: false,
                language: 'it',
                confidence: 'high',
                reason: 'italian_with_icelandic_terms'
            };
        }
        
        // Portuguese detection
        /*
        if (hasPortugueseIndicators && (portugueseDensity > 0.25 || portugueseWordCount >= 2)) {
            return {
                isIcelandic: false,
                language: 'pt',
                confidence: 'high',
                reason: 'portuguese_with_icelandic_terms'
            };
        }
        */
        
        // If no other language has strong indicators, it's likely Icelandic
        if (!hasEnglishIndicators && !hasSpanishIndicators && !hasFrenchIndicators && 
            !hasGermanIndicators && !hasItalianIndicators && !hasPortugueseIndicators) {
            return {
                isIcelandic: true,
                language: 'is',
                confidence: 'high',
                reason: 'icelandic_business_context_validated'
            };
        }
        
        // If densities of all languages are low, default to Icelandic
        if (englishDensity < 0.2 && spanishDensity < 0.2 && frenchDensity < 0.2 && 
            germanDensity < 0.2 && italianDensity < 0.2 && portugueseDensity < 0.2) {
            return {
                isIcelandic: true,
                language: 'is',
                confidence: 'medium',
                reason: 'icelandic_business_context_default'
            };
        }
    }
// *****************************************************************
    
    // Exclude Sky Lagoon package names and bot name from language detection
    const packageExclusionRegex = /\b(saman|sér|ser|hefd|hefð|venja|skjól|ritual|ritúal)\b/gi;
    // Add bot name exclusion - match both "sólrún" and "solrun"
    const botNameRegex = /\bs[oó]lr[uú]n\b/gi;
    
    const messageForDetection = cleanMessage
        .replace(/\b(sky\s*lagoon|pure\s*pass|sky\s*pass|saman\s*pass)\b/gi, '')
        .replace(packageExclusionRegex, '')
        .replace(botNameRegex, '') // Remove bot name before language detection
        .replace(hotelAndLocationRegex, '') // Remove hotel and location references
        .trim();
    
    // Check for English sentence structure patterns
    const hasEnglishSentenceStructure = (
        /^(tell|what|how|where|when|why|is|are|do|does|can|could|would|will|please|i want|i need|i would like|may i|could you|would you)/i.test(cleanMessage) ||
        /\bi\s+(?:am|was|have|had|would|will|want|need|chose|choose)\b/i.test(cleanMessage) ||
        /\bif\s+i\b/i.test(cleanMessage) ||
        /\bhow\s+(?:long|much|many|do|does|can|could)\b/i.test(cleanMessage)
    );
    
    if (hasEnglishSentenceStructure) {
        return {
            isIcelandic: false,
            language: 'en',
            confidence: 'high',
            reason: 'english_sentence_structure'
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
                language: 'en',
                confidence: 'high',
                reason: 'english_greeting_with_bot_name'
            };
        }
    }

    // Check for German detection in regular flow
    if (hasGermanIndicators && (germanDensity > 0.25 || germanWordCount >= 3 || hasGermanPackageQuery)) {
        return {
            isIcelandic: false,
            language: 'de',
            confidence: 'high',
            reason: 'german_detected'
        };
    }
    
    // Standalone Italian detection - ADDED: Better Italian detection
    if (hasItalianIndicators && (italianDensity > 0.2 || italianWordCount >= 2)) {
        return {
            isIcelandic: false,
            language: 'it',
            confidence: 'high',
            reason: 'italian_detected'
        };
    }
    
    //============================================================
    // DETECT OTHER LANGUAGES (Use ISO language codes, but let the system decide responses)
    //============================================================
    
    // Only run these checks if we haven't identified the language as English/Icelandic
    
    //-----------------------------------------------------
    // LANGUAGES WITH UNIQUE SCRIPTS - Check these first
    //-----------------------------------------------------
    
    // Thai detection (unique script)
    if (/[\u0E00-\u0E7F]/u.test(cleanMessage)) {
        return {
            isIcelandic: false,
            language: 'th',
            confidence: 'high',
            reason: 'other_language_detected'
        };
    }
    
    // Asian languages detection
    if (/[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF66-\uFF9F\u3131-\uD79D]/u.test(cleanMessage)) {
        // Detect specific East Asian language
        if (/[\u3040-\u309F\u30A0-\u30FF]/u.test(cleanMessage)) {
            return {
                isIcelandic: false,
                language: 'ja',
                confidence: 'high',
                reason: 'other_language_detected'
            };
        }
        if (/[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/u.test(cleanMessage)) {
            return {
                isIcelandic: false,
                language: 'ko',
                confidence: 'high',
                reason: 'other_language_detected'
            };
        }
        if (/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/u.test(cleanMessage)) {
            return {
                isIcelandic: false,
                language: 'zh',
                confidence: 'high',
                reason: 'other_language_detected'
            };
        }
    }
    
    // Cyrillic detection (Russian and other Slavic languages)
    if (/[\u0400-\u04FF]/u.test(cleanMessage)) {
        return {
            isIcelandic: false,
            language: 'ru',
            confidence: 'high',
            reason: 'other_language_detected'
        };
    }
    
    // Arabic script detection
    if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/u.test(cleanMessage)) {
        return {
            isIcelandic: false,
            language: 'ar',
            confidence: 'high',
            reason: 'other_language_detected'
        };
    }
    
    //-----------------------------------------------------
    // LANGUAGES WITH SPECIFIC CHARACTERS OR DIACRITICS
    // WITH ENHANCED EXCLUSION PATTERNS FOR LANGUAGES THAT 
    // SHARE CHARACTERS WITH ICELANDIC (á, é, í, ó, ú)
    //-----------------------------------------------------
    
    // Croatian detection (added)
    if (/[čćđšž]/i.test(cleanMessage) && 
        !/\b(hver|hvað|hvernig|af hverju|pakka|gjafakort|saman|sér)\b/i.test(cleanMessage)) {
        return {
            isIcelandic: false,
            language: 'hr',
            confidence: 'high',
            reason: 'other_language_detected'
        };
    }
    
    // Polish detection (with Icelandic exclusion)
    if ((/[ąćęłńśźż]/i.test(cleanMessage) || // Note: removed ó which is also in Icelandic
         /\b(dzień dobry|dziękuję|proszę|jak|gdzie|kiedy|dlaczego)\b/i.test(cleanMessage)) && 
        !/\b(hver|hvað|hvernig|pakka|gjafakort|saman|sér)\b/i.test(cleanMessage)) {
        return {
            isIcelandic: false,
            language: 'pl',
            confidence: 'high',
            reason: 'other_language_detected'
        };
    }
    
    // Spanish detection (with Icelandic exclusion)
    if (((/[ñ¿¡]/i.test(cleanMessage) || // Unique Spanish characters
          /\b(hola|gracias|buenos días|cuál|cómo|qué|dónde|cuándo)\b/i.test(cleanMessage)) && 
         !/\b(hver|hvað|hvernig|af hverju|pakka|gjafakort|saman|sér)\b/i.test(cleanMessage)) ||
        // Extra check for multiple Spanish indicators
        (/\b(cómo|cuándo|dónde|por qué|cuánto)\b/i.test(cleanMessage) && 
         /\b(hola|gracias|buenos días|buenas tardes|buenas noches)\b/i.test(cleanMessage))) {
        return {
            isIcelandic: false,
            language: 'es',
            confidence: 'high',
            reason: 'other_language_detected'
        };
    }

    // Spanish question patterns - additional check for Spanish questions
    if (/\b(cómo|cuándo|dónde|por qué|cuánto|qué|quién|cuál)\b.*\?/i.test(cleanMessage)) {
        return {
            isIcelandic: false,
            language: 'es',
            confidence: 'high',
            reason: 'spanish_question_pattern'
        };
    }    

    // Portuguese detection (modified to avoid Icelandic AND Spanish confusion)
    /*
    if (((/[àâãêõç]/i.test(cleanMessage) || // Characters unique to Portuguese, not shared with Icelandic or Spanish
          /\b(você|obrigado|todos|isso|muito|bem|não|sim|para|um|uma)\b/i.test(cleanMessage)) && 
         !/\b(hver|hvað|hvernig|af hverju|pakka|gjafakort|saman|sér)\b/i.test(cleanMessage) &&
         !/\b(hola|cómo|estás|qué tal|buenos días|buenas tardes)\b/i.test(cleanMessage)) || // Exclude Spanish
        // Extra check for multiple Portuguese indicators together
        (/\b(o que|quando|onde|por que|quanto)\b/i.test(cleanMessage) && 
         /\b(você|obrigado|todos|isso|muito|bem|não|sim)\b/i.test(cleanMessage) &&
         !/\b(hola|cómo|estás|qué)\b/i.test(cleanMessage))) { // Exclude Spanish
        return {
            isIcelandic: false,
            language: 'pt',
            confidence: 'high',
            reason: 'other_language_detected'
        };
    }
    */
    
    // French detection (with Icelandic exclusion)
    if (((/[èêëçôœ]/i.test(cleanMessage) || // Characters unique to French, not shared with Icelandic
          /\b(bonjour|merci|s'il vous plaît|où|comment|quand|pourquoi)\b/i.test(cleanMessage)) && 
         !/\b(hver|hvað|hvernig|af hverju|pakka|gjafakort|saman|sér)\b/i.test(cleanMessage)) ||
        // Extra check for multiple French indicators
        (/\b(je|tu|il|elle|nous|vous|ils|elles)\b/i.test(cleanMessage) && 
         /\b(suis|es|est|sommes|êtes|sont)\b/i.test(cleanMessage))) {
        return {
            isIcelandic: false,
            language: 'fr',
            confidence: 'high',
            reason: 'other_language_detected'
        };
    }
    
    // Italian detection (with Icelandic exclusion) - ENHANCED: More Italian patterns
    if ((/\b(ciao|grazie|prego|come|dove|quando|perché|buongiorno|buonasera|vorrei|pacchetto|prenotare|prenoto|domani|oggi|orario|prezzo|visita)\b/i.test(cleanMessage)) && 
        !/\b(hver|hvað|hvernig|af hverju|pakka|gjafakort|saman|sér)\b/i.test(cleanMessage)) {
        return {
            isIcelandic: false,
            language: 'it',
            confidence: 'high',
            reason: 'other_language_detected'
        };
    }
    
    //-----------------------------------------------------
    // NORDIC LANGUAGES - These often conflict with Icelandic
    // Special handling to distinguish from Icelandic
    //-----------------------------------------------------
    
    // Danish detection (with stronger differentiation from Icelandic)
    if ((/[æø]/i.test(cleanMessage) && // Danish-specific chars
        !/[þ]/i.test(cleanMessage) && // Not containing unique Icelandic chars
        /\b(jeg|du|han|hun|vi|de|er|var|har|havde|vil|skal|kan|kunne|må|at|med|og|eller|hvad|hvor|hvornår)\b/i.test(cleanMessage)) &&
        // Not containing Icelandic business terms or product names
        !/\b(hver|hvað|hvernig|af hverju|pakka|gjafakort|saman|sér|leiðin|ritúal)\b/i.test(cleanMessage)) {
        return {
            isIcelandic: false,
            language: 'da',
            confidence: 'high',
            reason: 'other_language_detected'
        };
    }
    
    // Norwegian detection (with stronger differentiation from Icelandic)
    if ((/[æø]/i.test(cleanMessage) && // Norwegian-specific chars
        !/[þ]/i.test(cleanMessage) && // Not containing unique Icelandic chars
        /\b(jeg|du|han|hun|vi|de|er|var|har|hadde|vil|skal|kan|kunne|må|at|med|og|eller|hva|hvor|når)\b/i.test(cleanMessage)) &&
        // Not containing Icelandic business terms or product names
        !/\b(hver|hvað|hvernig|af hverju|pakka|gjafakort|saman|sér|leiðin|ritúal)\b/i.test(cleanMessage)) {
        return {
            isIcelandic: false,
            language: 'no',
            confidence: 'high',
            reason: 'other_language_detected'
        };
    }
    
    // Swedish detection (with stronger differentiation from Icelandic)
    if ((/[åäö]/i.test(cleanMessage) && // Swedish-specific chars
        !/[þ]/i.test(cleanMessage) && // Not containing unique Icelandic chars
        /\b(är|för|och|att|om|den|det|hej|tack|välkommen|vilka|öppet|tider)\b/i.test(cleanMessage)) &&
        // Not containing Icelandic business terms or product names
        !/\b(hver|hvað|hvernig|af hverju|pakka|gjafakort|saman|sér|leiðin|ritúal)\b/i.test(cleanMessage)) {
        return {
            isIcelandic: false,
            language: 'sv',
            confidence: 'high',
            reason: 'other_language_detected'
        };
    }

    //===========================================================
    // CONTINUE WITH ICELANDIC DETECTION
    //===========================================================
    
    // Check for Icelandic characters after excluding packages, names, etc.
    if (/[öáíúéó]/i.test(messageForDetection)) {
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
                language: 'is',
                confidence: 'high',
                reason: 'icelandic_language_patterns'
            };
        }
    }
    
    // Check English word density
    const englishWordCount = (messageForDetection.match(/\b(the|and|but|or|if|so|my|your|i|we|you|in|at|on|for|with|from|by|to|into|how|long|can|stay|chose|choose|transfer|selected|about|between|differences)\b/gi) || []).length;
    const messageWords = messageForDetection.split(/\s+/).filter(w => w.length > 1).length;
    
    if (englishWordCount >= 3 || (messageWords > 0 && englishWordCount / messageWords > 0.4)) {
        return {
            isIcelandic: false,
            language: 'en',
            confidence: 'high',
            reason: 'english_word_density'
        };
    }
    
    // Early check for Icelandic questions at the start
    if (/^(hverjir|hver|hvert|hverju|hvort|hvers|hverja|er|má|get|getur|hvað|hvenær|hvar|af hverju|hvernig|eru|eruð|eruði|geturðu)\b/i.test(messageForDetection)) {
        return {
            isIcelandic: true,
            language: 'is',
            confidence: 'high',
            reason: 'icelandic_question_start'
        };
    }
    
    // Use context for follow-ups if available
    if (context?.language) {
        // Check if it's a likely follow-up
        const isFollowUp = /^(and|or|but|so|also|what about)/i.test(cleanMessage);
        return {
            isIcelandic: context.language === 'is',
            language: context.language,
            confidence: isFollowUp ? 'high' : 'medium',
            reason: 'context_based'
        };
    }

    // Default to English
    return {
        isIcelandic: false,
        language: 'en', 
        confidence: 'low',
        reason: 'default_to_english'
    };
};

// Export a helper function to get just the language code
export const detectLanguageCode = (message, context = null) => {
    const result = detectLanguage(message, context);
    return result.language || (result.isIcelandic ? 'is' : 'en');
};