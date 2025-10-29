// prompts/formatting/time_format.js
// Contains time formatting rules and time awareness information

/**
 * Returns time formatting rules based on language
 * @param {string} language - 'en' for English, 'is' for Icelandic
 * @param {Object} seasonInfo - Current season information
 * @param {Object} context - Session context if available
 * @param {Object} sunsetData - Optional sunset data
 * @param {Object} languageDecision - Language detection information
 * @returns {string} Time formatting content
 */
export function getPrompt(language, seasonInfo, context = null, sunsetData = null, languageDecision = null) {
  let timeFormatContent = '';
  
  // Add specific distinction for phone service hours vs. facility hours
  timeFormatContent += `
PHONE SERVICE VS FACILITY HOURS DISTINCTION:
1. For questions about "phone hours", "customer service hours", or with terms like "síminn" (phone):
   - ALWAYS state phone service hours, not facility hours
   - Phone service (customer service) hours: 09:00-18:00, every day, all year round
   - Chat service (Sólrún): Always available 24/7
   - Include phone number: +354 527 6800
   - Include email: reservations@skylagoon.is

2. Phone query detection patterns:
   - English: "phone hours", "phone open", "call", "customer service hours", "chat hours", "chatbot hours"
   - Icelandic: "síminn", "símavakt", "þjónustuver", "símþjónusta", "spjallþjónusta", "netspjall"
   
3. Phone service hours response templates:
   - For English: "Our customer service phone line (+354 527 6800) is open from 09:00 to 18:00 (GMT) every day, all year round. Our chat service is always available 24/7. You can also email us at reservations@skylagoon.is."
   - For Icelandic: "Þjónustuver okkar í síma (+354 527 6800) er opið frá 09:00 til 18:00 alla daga allan ársins hring. Netspjallið okkar er alltaf opið. Þú getur einnig sent okkur tölvupóst á reservations@skylagoon.is."

4. For general opening hours questions (no phone terms mentioned):
   - Provide the FACILITY opening hours according to seasonInfo
`;
  
  // Add the time duration and formatting guidelines
  timeFormatContent += `
TIME DURATION GUIDELINES:
1. When asked about duration, ALWAYS use these specific times:
   - Ritual: 45 minutes average duration
   - Dining: 60 minutes average duration
   - Bar: 30 minutes average duration

2. For Ritual Duration Questions:
   - ALWAYS mention "45 minutes" specifically
   - Explain it's self-guided but has a recommended time
   - Note they can take longer if they wish
   
3. For Activity Combinations:
   IF timeContext.sequence includes multiple activities:
   - Add up the times (ritual 45 min + dining 60 min = 105 min)
   - Consider closing times when making recommendations
   - Always mention last entry times for each activity

4. For Evening Timing:
   Remember these closing times by season:
   - Winter (Nov 1 - May 31): Facility closes at 22:00 (GMT)
   - June: Facility closes at 23:00 (GMT)
   - July-August: Facility closes at 23:00 (GMT)
   - September: Facility closes at 23:00 (GMT)
   - October: Facility closes at 22:00 (GMT)
   - Lagoon closes 30 minutes before facility closing
   - Ritual & Bar close 1 hour before facility closing
   - Last food orders 30 minutes before closing

5. For Opening Time Queries:
   - ALWAYS mention exact opening time: "${seasonInfo.openingTime} (GMT)"
   - For holiday periods, emphasize special hours: "During ${seasonInfo.greeting}, we open at ${seasonInfo.openingTime} (GMT)"
   - For weekend vs weekday differences: "We open at ${seasonInfo.season === 'winter' ? '11:00 (GMT) on weekdays and 10:00 (GMT) on weekends' : seasonInfo.openingTime + ' (GMT) every day'}"
   - Always include "(GMT)" after time values

6. For Date-Specific Queries:
   - For "tomorrow" or specific dates, check if it's a holiday or weekend
   - Holiday periods: "Tomorrow is part of our ${seasonInfo.greeting} period, so we open at ${seasonInfo.openingTime} (GMT)"
   - Weekend in winter: "Tomorrow is a weekend, so we open at 10:00 (GMT) during winter"
   - Regular day: "Tomorrow we open at our regular time of ${seasonInfo.openingTime} (GMT)"

TIME FORMATTING GUIDELINES:
1. For English Responses:
   - ALWAYS add "(GMT)" after specific times
   - Format: "${seasonInfo.openingTime} (GMT) - ${seasonInfo.closingTime} (GMT)"
   - Examples:
     * "We open at ${seasonInfo.openingTime} (GMT)"
     * "Last entry is at ${(parseInt(seasonInfo.closingTime) - 1) + ":00"} (GMT)"
     * "The ritual closes at ${seasonInfo.barClose} (GMT)"

2. For Icelandic Responses:
   - NEVER add "GMT" after times - use natural Icelandic formatting
   - Format: "klukkan ${seasonInfo.openingTime} til ${seasonInfo.closingTime}"
   - Examples:
     * "Við opnum klukkan ${seasonInfo.openingTime}"
     * "Síðasti aðgangur er klukkan ${(parseInt(seasonInfo.closingTime) - 1) + ":00"}"
     * "Ritúalið lokar klukkan ${seasonInfo.lastRitual}"
   - Use "klukkan" before the time or "kl." for abbreviation

3. For Scheduling Information:
   - For English and other languages:
     * Opening hours: "${seasonInfo.openingTime} (GMT)"
     * Closing times: "${seasonInfo.closingTime} (GMT)"
     * Last entry times: "${(parseInt(seasonInfo.closingTime) - 1) + ":00"} (GMT)"
     * Shuttle departure times with GMT
     * Booking deadlines with GMT
   - For Icelandic:
     * Opening hours: "klukkan ${seasonInfo.openingTime}"
     * Closing times: "klukkan ${seasonInfo.closingTime}"
     * Last entry times: "klukkan ${(parseInt(seasonInfo.closingTime) - 1) + ":00"}"
     * Shuttle departure times without GMT
     * Booking deadlines without GMT

4. For Facility Hours:
   - For English and other languages:
     * Lagoon hours: "${seasonInfo.openingTime} (GMT) - ${seasonInfo.lagoonClose} (GMT)"
     * Bar hours: "${seasonInfo.openingTime} (GMT) - ${seasonInfo.barClose} (GMT)"
     * Restaurant hours: "${seasonInfo.openingTime} (GMT) - ${seasonInfo.barClose} (GMT)"
     * Ritual times: "${seasonInfo.openingTime} (GMT) - ${seasonInfo.lastRitual} (GMT)"
   - For Icelandic:
     * Lagoon hours: "klukkan ${seasonInfo.openingTime} til ${seasonInfo.lagoonClose}"
     * Bar hours: "klukkan ${seasonInfo.openingTime} til ${seasonInfo.barClose}"
     * Restaurant hours: "klukkan ${seasonInfo.openingTime} til ${seasonInfo.barClose}" 
     * Ritual times: "klukkan ${seasonInfo.openingTime} til ${seasonInfo.lastRitual}"

5. For Shuttle Services:
   - For English and other languages:
     * Format departure times with GMT: "13:00 (GMT), 15:00 (GMT), 17:00 (GMT)"
     * Include GMT for all return times
     * For seasonal changes: "Winter shuttle times: 11:00 (GMT), 13:00 (GMT), 15:00 (GMT)"
     * For holiday adjustments: "During ${seasonInfo.greeting}, shuttles run at: 10:00 (GMT), 12:00 (GMT), 14:00 (GMT)"
   - For Icelandic:
     * Format departure times without GMT: "klukkan 13:00, 15:00, 17:00"
     * For seasonal changes: "Vetrar strætótímar: klukkan 11:00, 13:00, 15:00"
     * For holiday adjustments: "Yfir ${seasonInfo.greeting}, ganga strætóar klukkan: 10:00, 12:00, 14:00"

6. For Package-Specific Times:
   - For English and other languages:
     * Include GMT for booking deadlines: "Last booking at ${(parseInt(seasonInfo.closingTime) - 3) + ":00"} (GMT)"
     * Include GMT for special event times
     * For date night packages: "Date Night packages can only be booked until 18:00 (GMT)"
   - For Icelandic:
     * Format without GMT: "Síðasta bókun klukkan ${(parseInt(seasonInfo.closingTime) - 3) + ":00"}"
     * For date night packages: "Stefnumótspakka er aðeins hægt að bóka til klukkan 18:00"

7. For Current Day Information:
   - For English and other languages:
     * Be precise about today's hours: "Today we open at ${seasonInfo.openingTime} (GMT) and close at ${seasonInfo.closingTime} (GMT)"
     * For holidays/special days: "Since today is ${seasonInfo.greeting}, we have special hours"
     * For tomorrow: "Tomorrow we will open at ${seasonInfo.openingTime} (GMT)"
   - For Icelandic:
     * Natural time format: "Í dag opnum við klukkan ${seasonInfo.openingTime} og lokum klukkan ${seasonInfo.closingTime}"
     * For holidays: "Þar sem í dag er ${seasonInfo.greeting}, erum við með sérstakan opnunartíma"
     * For tomorrow: "Á morgun munum við opna klukkan ${seasonInfo.openingTime}"

8. For Special Period Queries:
   - For English and other languages:
     * Winter schedule (Nov 1 - May 31): "From November to May 31, we open at 11:00 (GMT) on weekdays and 10:00 (GMT) on weekends, closing at 22:00 (GMT)"
     * June: "In June, we open at 09:00 (GMT) and close at 23:00 (GMT) every day"
     * July-August: "In July and August, we open at 08:30 (GMT) Saturday through Thursday and 08:00 (GMT) on Fridays, closing at 23:00 (GMT)"
     * September: "In September, we open at 09:00 (GMT) and close at 23:00 (GMT) every day"
     * October: "In October, we open at 10:00 (GMT) and close at 22:00 (GMT) every day"
     * Easter 2025: "During Easter 2025 (April 17-21), we open at 10:00 (GMT) and close at 22:00 (GMT)"
     * Christmas Eve: "On Christmas Eve, we have limited hours: 09:00 (GMT) - 16:00 (GMT)"
     * Christmas Day: "On Christmas Day, we open at 09:00 (GMT) and close at 18:00 (GMT)"
     * Boxing Day: "On December 26, we open at 09:00 (GMT) and close at 22:00 (GMT)"
     * New Year's Eve: "On New Year's Eve, we open at 09:00 (GMT) and close at 18:00 (GMT)"
     * New Year's Day: "On New Year's Day, we open at 10:00 (GMT) and close at 22:00 (GMT)"
   - For Icelandic:
     * Winter schedule: "Frá 1. nóvember til 31. maí, opnum við klukkan 11:00 á virkum dögum og klukkan 10:00 um helgar, lokum klukkan 22:00"
     * June: "Í júní, opnum við klukkan 09:00 og lokum klukkan 23:00 alla daga"
     * July-August: "Í júlí og ágúst, opnum við klukkan 08:30 laugardaga til fimmtudaga og klukkan 08:00 á föstudögum, lokum klukkan 23:00"
     * September: "Í september, opnum við klukkan 09:00 og lokum klukkan 23:00 alla daga"
     * October: "Í október, opnum við klukkan 10:00 og lokum klukkan 22:00 alla daga"
     * Easter 2025: "Yfir páska 2025 (17.-21. apríl), opnum við klukkan 10:00 og lokum klukkan 22:00"
     * Christmas Eve: "Á aðfangadag eru takmarkaðir opnunartímar: klukkan 09:00 til 16:00"
     * Christmas Day: "Á jóladag opnum við klukkan 09:00 og lokum klukkan 18:00"
     * Boxing Day: "Annan í jólum opnum við klukkan 09:00 og lokum klukkan 22:00"
     * New Year's Eve: "Á gamlársdag opnum við klukkan 09:00 og lokum klukkan 18:00"
     * New Year's Day: "Á nýársdag opnum við klukkan 10:00 og lokum klukkan 22:00"

9. ALWAYS use dynamic times from seasonInfo rather than hardcoded values
`;

  // Add time context if available
  if (context && context.timeContext && context.timeContext.sequence.length > 0) {
    timeFormatContent += `
CURRENT ACTIVITY CONTEXT:
    Planned Activities: ${context.timeContext.sequence.join(', ')}
    Total Time Needed: ${context.timeContext.sequence.reduce((total, activity) => 
        total + (context.timeContext.activityDuration[activity] || 0), 0)} minutes
    Booking Time: ${context.timeContext.bookingTime || 'not specified'}
    Language: ${languageDecision && languageDecision.isIcelandic ? 'Icelandic' : 'English'}
    
    ENSURE RESPONSE:
    1. Mentions specific duration for each activity
    2. Considers closing times
    3. Suggests optimal timing
    4. Includes practical scheduling advice
`;
  }

  // Special handling for phone time queries if detected in context
  if (context && (context.isPhoneTimeQuery || (context.timeContext && context.timeContext.isPhoneQuery))) {
    timeFormatContent += `
PHONE QUERY DETECTED - CRITICAL INSTRUCTIONS:
1. This is specifically a PHONE HOURS query
2. DO NOT provide facility hours (${seasonInfo.openingTime}-${seasonInfo.closingTime})
3. ONLY provide phone customer service hours (09:00-18:00, every day, all year round)
4. Include phone number: +354 527 6800
5. Mention chat service: Always available 24/7
6. Mention email alternative: reservations@skylagoon.is
7. For Icelandic: "Þjónustuver okkar í síma (+354 527 6800) er opið frá 09:00 til 18:00 alla daga allan ársins hring. Netspjallið okkar er alltaf opið."
8. For English: "Our customer service phone line (+354 527 6800) is open from 09:00 to 18:00 (GMT) every day, all year round. Our chat service is always available 24/7."
`;
  }

  // Add context-aware response flexibility
  timeFormatContent += `
CONTEXT-AWARE RESPONSE FLEXIBILITY:
1. Context awareness OVERRIDES formatting requirements:
   - When a user asks a follow-up question, provide a direct answer
   - Do not force standard templates for follow-up questions
   - Short, conversational responses are better than repetitive templates

2. Response structure priorities:
   - For initial questions: Use standard templates and formatting
   - For follow-ups: Use conversational, direct responses
   - For clarifications: Focus on answering the specific question without repeating
   
3. Short message detection:
   - Messages under 25 characters are likely follow-ups
   - Check context.lastTopic to maintain topic continuity
   - Respond in the context of previous questions
   
4. Message-appropriate formatting:
   - Use full formatting only for comprehensive information requests
   - Use conversational style for quick questions and follow-ups
   - Tailor response length to question complexity
   
5. Always prioritize understanding over templates
`;

  // Add current schedule
  timeFormatContent += `
CURRENT SCHEDULE:
- Facility closes: ${seasonInfo.closingTime}
- Last ritual: ${seasonInfo.lastRitual}
- Bar service until: ${seasonInfo.barClose}
- Lagoon access until: ${seasonInfo.lagoonClose}
- Customer service phone hours: 09:00-18:00 (every day, all year round)
- Chat service: Always available 24/7
`;

  // Add sunset information if available
  if (sunsetData) {
    timeFormatContent += `
SUNSET INFORMATION:
Today's sunset time in Reykjavik is at ${sunsetData.todaySunset.formatted} (${sunsetData.todaySunset.formattedLocal}).
Today's opening hours are ${sunsetData.todayOpeningHours}.
`;
    
    if (sunsetData.specificMonth && !sunsetData.specificMonth.isCurrentMonth) {
      timeFormatContent += `\nFor ${sunsetData.specificMonth.name}, the average sunset time is ${sunsetData.specificMonth.sunsetTime.formatted} (${sunsetData.specificMonth.sunsetTime.formattedLocal}).\n`;
    }
    
    timeFormatContent += `\nFor ideal sunset viewing at Sky Lagoon, guests should arrive 1-2 hours before sunset. The views of the sunset from our infinity edge are spectacular.\n`;
  }
  
  // Add time awareness information
  timeFormatContent += `
TIME AWARENESS INFORMATION:
Current date: ${new Date().toDateString()}
Current local time: ${new Date().toLocaleTimeString()}
Season type: ${seasonInfo.season}
${seasonInfo.season === 'holiday' ? `Holiday period: ${seasonInfo.greeting}` : 'Regular season period'}

Today's hours:
- Opening time: ${seasonInfo.openingTime} (GMT)
- Closing time: ${seasonInfo.closingTime} (GMT)
- Last ritual: ${seasonInfo.lastRitual} (GMT)
- Bar closes: ${seasonInfo.barClose} (GMT)
- Lagoon closes: ${seasonInfo.lagoonClose} (GMT)
- Phone customer service: 09:00-18:00 (GMT) every day, all year round
- Chat service: Always available 24/7
`;

  // Add Easter information if applicable
  if (seasonInfo.season === 'holiday' && seasonInfo.greeting === 'Easter Holiday') {
    timeFormatContent += `
IMPORTANT EASTER INFORMATION:
- Easter 2025 period is April 17-21
- Special opening time of 10:00 (GMT) for all Easter dates
- These special hours apply to: Maundy Thursday, Good Friday, Easter Sunday, and Easter Monday
- This is different from our regular winter hours
`;
  }

  return timeFormatContent;
}