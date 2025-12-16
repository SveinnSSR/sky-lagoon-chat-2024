// prompts/seasonal/current_season.js
// Contains current season determination and volcanic activity information

/**
 * Determines the current season based on date
 * Based on Sky Lagoon website opening hours
 * @param {Date} targetDate - Optional specific date to check (defaults to current date)
 * @returns {Object} Season information
 */
export function determineCurrentSeason(targetDate = null) {
  // Use provided date or fall back to current date (preserves existing functionality)
  const checkDate = targetDate || new Date();
  const currentMonth = checkDate.getMonth(); // 0-11
  const currentDay = checkDate.getDate();
  const currentYear = checkDate.getFullYear();
  const dayOfWeek = checkDate.getDay(); // 0-6 (Sun-Sat)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isFriday = dayOfWeek === 5;
  
  // Determine current season based on month and day
  let season = 'regular';
  let seasonalGreeting = '';
  let openingTime = '11:00';
  let closingTime = '22:00';
  
  // Check if it's Easter period 2025 (April 17-21, 2025)
  const isEasterPeriod2025 = 
    (currentMonth === 3 && currentDay >= 17 && currentDay <= 21 && currentYear === 2025);
  
  // Check for specific holidays first
  if (isEasterPeriod2025) {
    season = 'holiday';
    seasonalGreeting = 'Easter Holiday';
    openingTime = '10:00';
    closingTime = '22:00';
  }
  else if (currentMonth === 11 && currentDay === 24) { // Christmas Eve
    season = 'holiday';
    seasonalGreeting = 'Christmas Eve';
    openingTime = '09:00';
    closingTime = '16:00';
  }
  else if (currentMonth === 11 && currentDay === 25) { // Christmas Day
    season = 'holiday';
    seasonalGreeting = 'Christmas Day';
    openingTime = '09:00';
    closingTime = '18:00';
  }
  else if (currentMonth === 11 && currentDay === 26) { // Boxing Day
    season = 'holiday';
    seasonalGreeting = 'Boxing Day';
    openingTime = '09:00';
    closingTime = '22:00';
  }
  else if (currentMonth === 11 && currentDay === 31) { // New Year's Eve
    season = 'holiday';
    seasonalGreeting = 'New Years Eve';  // Removed apostrophe to avoid escaping issues
    openingTime = '09:00';
    closingTime = '18:00';
  }
  else if (currentMonth === 0 && currentDay === 1) { // New Year's Day
    season = 'holiday';
    seasonalGreeting = 'New Years Day';  // Removed apostrophe to avoid escaping issues
    openingTime = '10:00';
    closingTime = '22:00';
  }
  // Regular seasonal periods based on Sky Lagoon website
  else if (currentMonth >= 10 || currentMonth <= 4) { 
    // November through May (Winter/Spring)
    seasonalGreeting = currentMonth === 3 || currentMonth === 4 ? 'Spring' : 'Winter';
    season = currentMonth === 3 || currentMonth === 4 ? 'spring' : 'winter';
    openingTime = isWeekend ? '10:00' : '11:00';
    closingTime = '22:00';
  }
  else if (currentMonth === 5) { 
    // June - 9am-11pm every day
    seasonalGreeting = 'June';  // Changed from 'Summer' to be more specific
    season = 'june';  // Changed to be more specific
    openingTime = '09:00';
    closingTime = '23:00';
  }
  else if (currentMonth === 6 || currentMonth === 7) { 
    // July-August - 8:30am-11pm (8am on Fridays)
    seasonalGreeting = currentMonth === 6 ? 'July' : 'August';  // More specific than just 'Summer'
    season = 'summer';
    if (isFriday) {
      openingTime = '08:00';
    } else {
      openingTime = '08:30';
    }
    closingTime = '23:00';
  }
  else if (currentMonth === 8) { 
    // September - 9am-11pm every day
    seasonalGreeting = 'September';  // Changed from 'Autumn' to be more specific
    season = 'september';  // Changed to be more specific
    openingTime = '09:00';
    closingTime = '23:00';
  }
  else if (currentMonth === 9) { 
    // October - 10am-10pm every day
    seasonalGreeting = 'October';  // Changed from 'Autumn' to be more specific
    season = 'october';  // Changed to be more specific
    openingTime = '10:00';
    closingTime = '22:00';
  }
  
  // Calculate closing times for different facilities
  const closingHour = parseInt(closingTime.split(':')[0]);
  const lagoonCloseHour = closingHour;
  const lagoonCloseMin = '30';
  const lagoonClose = `${lagoonCloseHour}:${lagoonCloseMin}`;
  
  const barCloseHour = closingHour - 1;
  const barClose = `${barCloseHour}:00`;
  const lastRitual = `${barCloseHour}:00`;
  
  const seasonInfo = {
    season: season,
    greeting: seasonalGreeting,
    openingTime: openingTime,
    closingTime: closingTime,
    lastRitual: lastRitual,
    barClose: barClose,
    lagoonClose: lagoonClose
  };
  
  return seasonInfo;
}

/**
 * Determines opening hours for a specific month
 * @param {number} monthIndex - Month index (0-11) or month name string
 * @param {number} year - Optional year (defaults to current year)
 * @returns {Object} Hours information for that month
 */
export function getMonthOpeningHours(monthIndex, year = null) {
  // Convert month name to index if needed
  let monthNum = monthIndex;
  if (typeof monthIndex === 'string') {
    const monthNames = {
      'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
      'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
    };
    monthNum = monthNames[monthIndex.toLowerCase()] || 0;
  }
  
  const targetYear = year || new Date().getFullYear();
  
  // Create dates for different days of the month
  const firstDay = new Date(targetYear, monthNum, 1);
  const midWeekday = new Date(targetYear, monthNum, 15); // Usually a weekday
  
  // Find first weekend day
  let weekend = new Date(targetYear, monthNum, 1);
  while (weekend.getDay() !== 0 && weekend.getDay() !== 6) {
    weekend.setDate(weekend.getDate() + 1);
  }
  
  // Get hours for different day types
  const firstDayHours = determineCurrentSeason(firstDay);
  const weekdayHours = determineCurrentSeason(midWeekday);
  const weekendHours = determineCurrentSeason(weekend);
  
  // For July/August, check Friday specifically
  let fridayHours = null;
  if (monthNum === 6 || monthNum === 7) { // July or August
    // Find first Friday of the month
    let friday = new Date(targetYear, monthNum, 1);
    while (friday.getDay() !== 5) {
      friday.setDate(friday.getDate() + 1);
    }
    fridayHours = determineCurrentSeason(friday);
  }
  
  return {
    month: monthNum,
    year: targetYear,
    standard: firstDayHours,
    weekday: weekdayHours,
    weekend: weekendHours,
    friday: fridayHours
  };
}

/**
 * Helper function to translate holiday names to Icelandic
 * @param {string} holidayName - English holiday name
 * @returns {string} Icelandic translation
 */
function getIcelandicHolidayName(holidayName) {
  const translations = {
    'Easter Holiday': 'Páska',
    'Christmas Eve': 'Aðfangadag',
    'Christmas Day': 'Jóladag',
    'Boxing Day': 'Annan í jólum',
    'New Years Eve': 'Gamlársdag',
    'New Years Day': 'Nýársdag'
  };
  return translations[holidayName] || holidayName;
}

/**
 * Gets seasonal prompt content based on language and season
 * @param {string} language - 'en' for English, 'is' for Icelandic
 * @param {Object} context - Session context if available
 * @returns {string} Seasonal content
 */
export function getPrompt(language, context = null) {
  // Check if context has a specific month query
  let targetDate = null;
  if (context && context.queryMonth) {
    // Create a date for the queried month
    const year = context.queryMonth.year || new Date().getFullYear();
    const month = context.queryMonth.index;
    const day = context.queryMonth.day || 15; // Default to middle of month
    targetDate = new Date(year, month, day);
    
    // For July/August, also check which day of week for Friday detection
    if (month === 6 || month === 7) {
      // Find a Friday in that month for accurate hours
      const testDate = new Date(year, month, 1);
      while (testDate.getDay() !== 5 && testDate.getMonth() === month) {
        testDate.setDate(testDate.getDate() + 1);
      }
      if (testDate.getMonth() === month) {
        targetDate = testDate; // Use the Friday for more accurate hours
      }
    }
    
    console.log(`📅 [SEASON-MODULE] Using specific date for hours: ${targetDate.toDateString()}`);
  }
  
  const seasonInfo = determineCurrentSeason(targetDate);
  const isIcelandic = language === 'is';
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear(); // why is this unused?
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate(); // why is this unused?
  const dayOfWeek = currentDate.getDay();
  const isFriday = dayOfWeek === 5;
  
  let seasonalContent = '';

// Add clear instruction for month-specific queries
if (context && context.queryMonth) {
  const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'][context.queryMonth.index];
  
  seasonalContent += isIcelandic ? 
    `\nSPURNING UM ${monthName.toUpperCase()}: Notaðu nákvæmlega þessa opnunartíma fyrir ${monthName}.\n` :
    `\nQUESTION ABOUT ${monthName.toUpperCase()}: Use these exact hours for ${monthName}.\n`;
}
  
// Add operating hours information with explicit month/season context
let hoursContext = '';
if (targetDate) {
  // We're answering about a specific month/date
  const monthName = targetDate.toLocaleString('en-US', { month: 'long' });
  const dayName = targetDate.toLocaleString('en-US', { weekday: 'long' });
  
  hoursContext = isIcelandic ? 
    `\n${monthName} opnunartími (${dayName} sem dæmi):` :
    `\nFor ${monthName} (using ${dayName} as example):`;
} else {
  hoursContext = isIcelandic ? 
    '\nÍ dag:' : 
    '\nToday:';
}

seasonalContent += `
${isIcelandic ? 'OPNUNARTÍMI' : 'OPERATING HOURS'}${hoursContext}
${isIcelandic ? 
`- Opið frá kl. ${seasonInfo.openingTime} - ${seasonInfo.closingTime}
- Lónið sjálft lokar kl. ${seasonInfo.lagoonClose}
- Skjól Ritúalið og Gelmir Bar loka kl. ${seasonInfo.barClose}` 
: 
`- Open from ${seasonInfo.openingTime} - ${seasonInfo.closingTime} (GMT)
- The lagoon itself closes at ${seasonInfo.lagoonClose} (GMT)
- The Skjól Ritual and Gelmir Bar close at ${seasonInfo.barClose} (GMT)`}

${seasonInfo.greeting === 'July' ? 
(isIcelandic ? 
`\nATHUGIÐ fyrir júlí: 
- Föstudagar: 08:00-23:00
- Aðrir dagar: 08:30-23:00` :
`\nIMPORTANT for July:
- Fridays: 08:00-23:00 (GMT)
- Other days: 08:30-23:00 (GMT)`) : ''}

${seasonInfo.greeting === 'August' ?
(isIcelandic ?
`\nATHUGIÐ fyrir ágúst:
- Föstudagar: 08:00-23:00
- Aðrir dagar: 08:30-23:00` :
`\nIMPORTANT for August:
- Fridays: 08:00-23:00 (GMT)  
- Other days: 08:30-23:00 (GMT)`) : ''}

${seasonInfo.season === 'holiday' ? 
(isIcelandic ?
`SÉRSTAKUR OPNUNARTÍMI:
Þessi opnunartími gildir um ${getIcelandicHolidayName(seasonInfo.greeting)} tímabilið og er frábrugðinn hefðbundnum árstíðabundnum opnunartímum.

${seasonInfo.greeting === 'Easter Holiday' ? 
`Fyrir páska 2025 sérstaklega:
- Skírdagur (17. apríl 2025)
- Föstudagurinn langi (18. apríl 2025)
- Páskadagur (20. apríl 2025)
- Annar í páskum (21. apríl 2025)

Við opnum fyrr klukkan 10:00 á þessum dögum til að þjóna gestum okkar betur.` : ''}` 
: 
`SPECIAL NOTICE:
These hours are valid during ${seasonInfo.greeting} and differ from our regular seasonal hours.

${seasonInfo.greeting === 'Easter Holiday' ?
`For Easter 2025 specifically:
- Maundy Thursday (April 17, 2025)
- Good Friday (April 18, 2025)  
- Easter Sunday (April 20, 2025)
- Easter Monday (April 21, 2025)

We open earlier at 10:00 (GMT) on these days to better serve our guests.` : ''}`) 
: 
(isIcelandic ?
`Þetta er reglulegur opnunartími á ${
  seasonInfo.greeting === 'Spring' ? 'Vor' : 
  seasonInfo.greeting === 'Summer' ? 'Sumar' :
  seasonInfo.greeting === 'June' ? 'Júní' :
  seasonInfo.greeting === 'July' ? 'Júlí' :
  seasonInfo.greeting === 'August' ? 'Ágúst' :
  seasonInfo.greeting === 'September' ? 'September' :
  seasonInfo.greeting === 'October' ? 'Október' :
  seasonInfo.greeting === 'Autumn' ? 'Haust' : 
  seasonInfo.greeting === 'Winter' ? 'Vetur' : 
  seasonInfo.greeting
} tímabilinu.
${(seasonInfo.season === 'winter' || seasonInfo.season === 'spring') ? 
  'Á virkum dögum opnum við klukkan 11:00 og um helgar klukkan 10:00.' : ''}
${currentMonth === 5 ? 'Í júní erum við opin frá 09:00 til 23:00 alla daga.' : ''}
${(currentMonth === 6 || currentMonth === 7) ? 
  (isFriday ? 'Á föstudögum opnum við klukkan 08:00.' : 'Á laugardögum til fimmtudaga opnum við klukkan 08:30.') + ' Lokað klukkan 23:00.' : ''}
${currentMonth === 8 ? 'Í september erum við opin frá 09:00 til 23:00 alla daga.' : ''}
${currentMonth === 9 ? 'Í október erum við opin frá 10:00 til 22:00 alla daga.' : ''}` 
: 
`These are our regular hours during the ${seasonInfo.greeting} season.
${(seasonInfo.season === 'winter' || seasonInfo.season === 'spring') ? 
  'We open at 11:00 (GMT) on weekdays and 10:00 (GMT) on weekends.' : ''}
${currentMonth === 5 ? 'In June, we are open from 09:00 to 23:00 (GMT) every day.' : ''}
${(currentMonth === 6 || currentMonth === 7) ? 
  (isFriday ? 'On Fridays, we open at 08:00 (GMT).' : 'Saturday through Thursday, we open at 08:30 (GMT).') + ' We close at 23:00 (GMT).' : ''}
${currentMonth === 8 ? 'In September, we are open from 09:00 to 23:00 (GMT) every day.' : ''}
${currentMonth === 9 ? 'In October, we are open from 10:00 to 22:00 (GMT) every day.' : ''}`)}

IMPORTANT SCHEDULE NOTES:
- Winter hours (Nov 1 - May 31): Mon-Fri 11:00-22:00, Sat-Sun 10:00-22:00
- June: 09:00-23:00 every day
- July-August: Sat-Thu 08:30-23:00, Fri 08:00-23:00
- September: 09:00-23:00 every day
- October: 10:00-22:00 every day
- December holidays have special hours
`;

  // Add volcanic information - this is directly from systemPrompts.js
  seasonalContent += isIcelandic ? 
`
CURRENT VOLCANIC ACTIVITY INFORMATION:
Sky Lagoon er algjörlega öruggt frá fyrri eldgosum á Reykjanesskaga. Aðstaða okkar er staðsett í Reykjavík, langt frá áhrifasvæðinu nálægt Grindavík. Á Reykjanesskaga hafa verið eldgos í gangi frá 2021 í Sundhnúkagígaröðinni, en það er ekki virkt eldgos núna.` 
: 
`
CURRENT VOLCANIC ACTIVITY INFORMATION:
Sky Lagoon is completely safe from previous volcanic eruptions on the Reykjanes peninsula. Our facility is located in Reykjavík, well away from the affected area near Grindavík. The Reykjanes peninsula has experienced volcanic activity since 2021 in the Sundhnúkagígaröðin volcanic system, but there is no active eruption at this time.

Sky Lagoon remains fully operational with no impact on our services or safety. Reykjavík and all services and attractions including Sky Lagoon continue to operate normally.

If asked specifically about Blue Lagoon status: Blue Lagoon is currently open and operational. However, focus on providing information about Sky Lagoon experiences and offerings.`;

  seasonalContent += `

When responding to questions about volcanic activity:
1. Always emphasize Sky Lagoon's safety and distance from previous eruption sites
2. Note that there is currently no active eruption on the Reykjanes peninsula
3. Only mention Blue Lagoon is open if specifically asked about it
4. Never suggest there is any safety concern for Sky Lagoon guests
5. Focus conversations back to Sky Lagoon experiences whenever possible
`;

  // Add monthly theme
  seasonalContent += `
${isIcelandic ? 'CURRENT MONTHLY THEME (MAÍ 2025):' : 'CURRENT MONTHLY THEME (MAY 2025):'}

${isIcelandic ? 
`MAÍ TIL HEIÐURS MÖMMUM:
Flest eiga mæðrum sínum mikið að þakka. Því langar okkur að hvetja ykkur til að að staldra við og heiðra þær fyrir allt sem þær hafa kennt okkur. Mæðradagurinn er 11. maí en Sky Lagoon tileinkar allan maímánuð mæðrum allsstaðar og af öllum toga: Nýbökuðum mömmum, tilvonandi mömmum, stjúpmömmum — öllum mömmum.` 
: 
`MAY IS FOR THE MOTHERS:
Mothers shape our lives in countless ways, each offering wisdom, love, and lessons in their own special way. As Mother's Day approaches on May 11, Sky Lagoon is dedicating the entire month of May to honoring all mothers everywhere.
We encourage you to celebrate a mom in your life, it might be your own mom, a new mom you know, an expecting mother, a stepmom, or maybe a mother figure. Join us as we take this opportunity to express our gratitude and appreciation for the remarkable role mothers play in our lives.`}

When responding to questions about the monthly theme:
1. Mention our May Mother's Day celebration when discussing visits in May
2. Suggest our Sky Lagoon for Two package as a thoughtful gift for mothers
3. Highlight our peaceful ambiance as perfect for a mother's retreat
4. For direct Mother's Day questions, suggest booking early for the best times
5. If asked about specific discounts, clarify we don't currently offer specific Mother's Day discounts but recommend the Multi-Pass for value
`;

  // Add seasonal context if available
  if (context && context.seasonalContext) {
    seasonalContent += `
SEASONAL CONTEXT:
- Current Season: ${context.seasonalContext.type}
- Subtopic: ${context.seasonalContext.subtopic}
- Last Follow-up: ${context.seasonalContext.lastFollowUp}
- Language: ${isIcelandic ? 'Icelandic' : 'English'}

MAINTAIN THIS SEASONAL CONTEXT IN RESPONSES.
IF user says "yes" to more information:
- FOR SUMMER: Offer summer-specific options only
- FOR WINTER: Offer winter-specific options only
`;
  }
  
  return seasonalContent;
}

/**
 * Exports the current season info for use by other modules
 * @returns {Object} Current season information
 */
export function getCurrentSeasonInfo() {
  return determineCurrentSeason();
}