// sunsetTimes.js - Comprehensive database of sunset times in Iceland
// Based on Reykjavik coordinates (64.1466° N, 21.9426° W)

// Format: day: [hour, minute]
// Times are in 24-hour format

export const SUNSET_TIMES = {
    january: {
        1: [15, 43],
        5: [15, 49],
        10: [15, 57],
        15: [16, 6],
        20: [16, 17],
        25: [16, 28],
        31: [16, 43]
    },
    february: {
        1: [16, 45],
        5: [16, 54],
        10: [17, 6],
        15: [17, 19],
        20: [17, 32],
        25: [17, 45],
        28: [17, 52]
    },
    march: {
        1: [17, 55],
        5: [18, 4],
        10: [18, 16],
        15: [18, 28],
        20: [18, 40],
        25: [18, 52],
        31: [19, 7]
    },
    april: {
        1: [19, 9],
        5: [19, 19],
        10: [19, 31],
        15: [19, 44],
        20: [19, 57],
        25: [20, 10],
        30: [20, 23]
    },
    may: {
        1: [20, 26],
        5: [20, 37],
        10: [20, 51],
        15: [21, 5],
        20: [21, 19],
        25: [21, 32],
        31: [21, 47]
    },
    june: {
        1: [21, 49],
        5: [21, 56],
        10: [22, 4],
        15: [22, 10],
        20: [22, 13],
        21: [22, 13], // Summer solstice
        25: [22, 13],
        30: [22, 10]
    },
    july: {
        1: [22, 9],
        5: [22, 5],
        10: [21, 58],
        15: [21, 50],
        20: [21, 40],
        25: [21, 30],
        31: [21, 15]
    },
    august: {
        1: [21, 13],
        5: [21, 3],
        10: [20, 50],
        15: [20, 36],
        20: [20, 22],
        25: [20, 8],
        31: [19, 50]
    },
    september: {
        1: [19, 47],
        5: [19, 36],
        10: [19, 22],
        15: [19, 8],
        20: [18, 54],
        25: [18, 40],
        30: [18, 26]
    },
    october: {
        1: [18, 23],
        5: [18, 12],
        10: [17, 58],
        15: [17, 44],
        20: [17, 30],
        25: [17, 16],
        31: [17, 1]
    },
    november: {
        1: [16, 58],
        5: [16, 47],
        10: [16, 34],
        15: [16, 22],
        20: [16, 11],
        25: [16, 1],
        30: [15, 53]
    },
    december: {
        1: [15, 51],
        5: [15, 46],
        10: [15, 42],
        15: [15, 40],
        21: [15, 41], // Winter solstice
        25: [15, 44],
        31: [15, 51]
    }
};

// Helper function to get sunset time for a specific date
export const getSunsetTime = (date) => {
    // Convert string to Date if needed
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    
    // If invalid date, return null
    if (isNaN(targetDate.getTime())) return null;
    
    const month = targetDate.toLocaleString('en-US', { month: 'long' }).toLowerCase();
    const day = targetDate.getDate();
    
    const monthData = SUNSET_TIMES[month];
    if (!monthData) return null;
    
    // Find the closest day in our dataset
    const days = Object.keys(monthData).map(Number);
    const closestDay = days.reduce((prev, curr) => 
        Math.abs(curr - day) < Math.abs(prev - day) ? curr : prev
    );
    
    const [hour, minute] = monthData[closestDay];
    
    return {
        hour,
        minute,
        formatted: `${hour}:${minute.toString().padStart(2, '0')}`,
        formattedLocal: `${hour % 12 || 12}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
    };
};

// Helper function to get sunset time for a specific month (average)
export const getMonthAverageSunset = (month) => {
    const monthLower = month.toLowerCase();
    const monthData = SUNSET_TIMES[monthLower];
    if (!monthData) return null;
    
    // Calculate average sunset time for the month
    const days = Object.keys(monthData);
    let totalMinutes = 0;
    
    days.forEach(day => {
        const [hour, minute] = monthData[day];
        totalMinutes += (hour * 60) + minute;
    });
    
    const averageMinutes = totalMinutes / days.length;
    const hour = Math.floor(averageMinutes / 60);
    const minute = Math.round(averageMinutes % 60);
    
    return {
        hour,
        minute,
        formatted: `${hour}:${minute.toString().padStart(2, '0')}`,
        formattedLocal: `${hour % 12 || 12}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
    };
};

// Helper function to get today's sunset time
export const getTodaySunset = () => {
    return getSunsetTime(new Date());
};

// Helper function for Icelandic month names
export const icelandicMonths = {
    'january': 'janúar',
    'february': 'febrúar',
    'march': 'mars',
    'april': 'apríl',
    'may': 'maí',
    'june': 'júní',
    'july': 'júlí',
    'august': 'ágúst',
    'september': 'september',
    'october': 'október',
    'november': 'nóvember',
    'december': 'desember'
};

// Convert Icelandic month name to English
export const icelandicToEnglishMonth = (icelandicMonth) => {
    const lowerMonth = icelandicMonth.toLowerCase();
    
    // Create reverse mapping
    const reverseMapping = {};
    Object.entries(icelandicMonths).forEach(([english, icelandic]) => {
        reverseMapping[icelandic] = english;
    });
    
    return reverseMapping[lowerMonth] || null;
};

// Helper for matching month names in queries
export const matchMonthInQuery = (query, isIcelandic = false) => {
    const lowerQuery = query.toLowerCase();
    
    // Check for specific month mentions
    const monthsToCheck = isIcelandic ? 
        Object.values(icelandicMonths) : 
        Object.keys(icelandicMonths);
    
    for (const month of monthsToCheck) {
        if (lowerQuery.includes(month.toLowerCase())) {
            return isIcelandic ? 
                icelandicToEnglishMonth(month) : 
                month;
        }
    }
    
    // Check for "this month" or "current month"
    if ((lowerQuery.includes('this month') || lowerQuery.includes('current month')) ||
        (isIcelandic && (lowerQuery.includes('þennan mánuð') || lowerQuery.includes('núverandi mánuð')))) {
        const currentMonth = new Date().toLocaleString('en-US', { month: 'lowercase' });
        return currentMonth;
    }
    
    // Check for "next month"
    if (lowerQuery.includes('next month') || (isIcelandic && lowerQuery.includes('næsta mánuð'))) {
        const nextMonthDate = new Date();
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        const nextMonth = nextMonthDate.toLocaleString('en-US', { month: 'lowercase' });
        return nextMonth;
    }
    
    return null;
};
