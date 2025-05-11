// prompts/seasonal/current_season.js
// Contains current season determination and volcanic activity information

/**
 * Determines the current season based on date
 * This function is based on the original getCurrentSeason from systemPrompts.js
 * @returns {Object} Season information
 */
export function determineCurrentSeason() {
  // Get current date
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11
  const currentDay = currentDate.getDate();
  
  // Determine current season based on month
  let season = 'regular';
  let seasonalGreeting = '';
  
  // Check if it's Easter period 2025 (April 17-21, 2025)
  const isEasterPeriod2025 = 
    (currentMonth === 3 && currentDay >= 17 && currentDay <= 21 && currentDate.getFullYear() === 2025);
  
  if (isEasterPeriod2025) {
    season = 'holiday';
    seasonalGreeting = 'Easter Holiday';
  } else if (currentMonth === 4) { // May
    seasonalGreeting = 'Spring';
    season = 'spring';
  } else if (currentMonth >= 5 && currentMonth <= 8) { // June through September
    seasonalGreeting = 'Summer';
    season = 'summer';
  } else if (currentMonth >= 9 && currentMonth <= 10) { // October through November
    seasonalGreeting = 'Autumn';
    season = 'autumn';
  } else { // December through April (except Easter period)
    seasonalGreeting = 'Winter';
    season = 'winter';
  }
  
  // Default time values that will be overridden by seasonInfo
  const seasonInfo = {
    season: season,
    greeting: seasonalGreeting,
    openingTime: season === 'summer' ? '09:00' : '11:00',
    closingTime: '22:00',
    lastRitual: '21:00',
    barClose: '21:00',
    lagoonClose: '21:30'
  };
  
  // Special handling for Easter
  if (isEasterPeriod2025) {
    seasonInfo.openingTime = '10:00';
  }
  
  return seasonInfo;
}

/**
 * Gets seasonal prompt content based on language and season
 * @param {string} language - 'en' for English, 'is' for Icelandic
 * @param {Object} context - Session context if available
 * @returns {string} Seasonal content
 */
export function getPrompt(language, context = null) {
  const seasonInfo = determineCurrentSeason();
  const isIcelandic = language === 'is';
  
  let seasonalContent = '';
  
  // Add operating hours information
  seasonalContent += `
${isIcelandic ? 'NÚVERANDI OPNUNARTÍMI:' : 'CURRENT OPERATING HOURS:'}
${isIcelandic ? 
`- Opið frá kl. ${seasonInfo.openingTime} - ${seasonInfo.closingTime}
- Lónið sjálft lokar kl. ${seasonInfo.lagoonClose}
- Skjól Ritúalið og Gelmir Bar loka kl. ${seasonInfo.barClose}` 
: 
`- Open from ${seasonInfo.openingTime} - ${seasonInfo.closingTime} (GMT)
- The lagoon itself closes at ${seasonInfo.lagoonClose} (GMT)
- The Skjól Ritual and Gelmir Bar close at ${seasonInfo.barClose} (GMT)`}

${seasonInfo.season === 'holiday' ? 
(isIcelandic ?
`SÉRSTAKUR OPNUNARTÍMI:
Þessi opnunartími gildir um ${seasonInfo.greeting === 'Easter Holiday' ? 'Páska' : seasonInfo.greeting} tímabilið og er frábrugðinn hefðbundnum árstíðabundnum opnunartímum.

Fyrir páska 2025 sérstaklega:
- Skírdagur (17. apríl 2025)
- Föstudagurinn langi (18. apríl 2025)
- Páskadagur (20. apríl 2025)
- Annar í páskum (21. apríl 2025)

Við opnum fyrr klukkan 10:00 á þessum dögum til að þjóna gestum okkar betur.` 
: 
`SPECIAL NOTICE:
These hours are valid during the ${seasonInfo.greeting} period and differ from our regular seasonal hours.

For Easter 2025 specifically:
- Maundy Thursday (April 17, 2025)
- Good Friday (April 18, 2025)
- Easter Sunday (April 20, 2025)
- Easter Monday (April 21, 2025)

We open earlier at 10:00 (GMT) on these days to better serve our guests.`) 
: 
(isIcelandic ?
`Þetta er reglulegur opnunartími á ${
  seasonInfo.greeting === 'Spring' ? 'Vor' : 
  seasonInfo.greeting === 'Summer' ? 'Sumar' : 
  seasonInfo.greeting === 'Autumn' ? 'Haust' : 
  seasonInfo.greeting === 'Winter' ? 'Vetur' : 
  seasonInfo.greeting} tímabilinu.
${seasonInfo.season === 'winter' ? 'Yfir veturinn opnum við klukkan 11:00 á virkum dögum og klukkan 10:00 um helgar.' : ''}` 
: 
`These are our regular hours during the ${seasonInfo.greeting} season.
${seasonInfo.season === 'winter' ? 'During winter, we open at 11:00 (GMT) on weekdays and 10:00 (GMT) on weekends.' : ''}`)}
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