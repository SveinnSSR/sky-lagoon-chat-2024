// timeUtils.js
export const extractTimeInMinutes = (timeStr) => {
    const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(?:([AaPp][Mm])|([Hh]))?/);
    if (!match) return null;
    
    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const meridiem = match[3]?.toLowerCase();
    
    // Convert to 24-hour format if PM
    if (meridiem === 'pm' && hours !== 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
};

export const extractComplexTimeInMinutes = (text) => {
    // Standard time format first
    const standardMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(?:([AaPp][Mm])|([Hh]))?/);
    if (standardMatch) {
        let hours = parseInt(standardMatch[1]);
        const minutes = standardMatch[2] ? parseInt(standardMatch[2]) : 0;
        const meridiem = standardMatch[3]?.toLowerCase();
        
        // Convert to 24-hour format
        if (meridiem === 'pm' && hours !== 12) hours += 12;
        if (meridiem === 'am' && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
    }
    
    // Word-based time expressions
    const quarterPastMatch = text.match(/quarter\s+past\s+(\d{1,2})/i);
    if (quarterPastMatch) {
        let hours = parseInt(quarterPastMatch[1]);
        return hours * 60 + 15;
    }
    
    const halfPastMatch = text.match(/half\s+past\s+(\d{1,2})/i);
    if (halfPastMatch) {
        let hours = parseInt(halfPastMatch[1]);
        return hours * 60 + 30;
    }
    
    const quarterToMatch = text.match(/quarter\s+to\s+(\d{1,2})/i);
    if (quarterToMatch) {
        let hours = parseInt(quarterToMatch[1]);
        return (hours - 1) * 60 + 45;
    }
    
    return null;
};

// Add a time difference calculator for convenience
export const calculateTimeDifference = (time1, time2) => {
    if (time1 === null || time2 === null) return null;
    return Math.abs(time1 - time2);
};