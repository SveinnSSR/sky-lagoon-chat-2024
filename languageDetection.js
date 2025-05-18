// languageDetection.js - Minimal version with brand term exclusions
export const detectLanguage = (message, context = null) => {
    // Clean the message
    const cleanMessage = message.toLowerCase().trim();
    
    // Create exclusion regexes for brand terms and locations
    const brandTermsRegex = /\b(sky\s*lagoon|pure\s*pass|sky\s*pass|saman\s*pass|saman|sér|ser|hefd|hefð|venja|skjól|ritual|ritúal|sólrún|solrun|sky\s*lei[ðd]in)\b/gi;
    const locationTermsRegex = /\b(reykjavík|kópavogur|hallgrímskirkja)\b/gi;
    
    // Create a version of the message with brand terms removed for detection
    const cleanedForDetection = cleanMessage
        .replace(brandTermsRegex, '')
        .replace(locationTermsRegex, '')
        .trim();
    
    // Only check for the truly unique Icelandic characters after removing brand terms
    // Note: The 'æ' character has potential overlap with other languages
    if (/[þðæ]/i.test(cleanedForDetection)) {
        return {
            isIcelandic: true,
            language: 'is',
            confidence: 'high',
            reason: 'unique_icelandic_characters',
            detectedLanguage: 'is'
        };
    }
    
    // For everything else, use auto-detection
    return {
        isIcelandic: false,
        language: 'auto',
        confidence: 'medium',
        reason: 'natural_language_detection',
        detectedLanguage: 'auto'
    };
};

// Helper function with same signature for compatibility
export const detectLanguageCode = (message, context = null) => {
    const result = detectLanguage(message, context);
    return result.language || (result.isIcelandic ? 'is' : 'auto');
};