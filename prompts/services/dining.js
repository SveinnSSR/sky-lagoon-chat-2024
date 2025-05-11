// prompts/services/dining.js
// Contains information about Sky Lagoon dining options

/**
 * Returns the dining information in English
 * @returns {string} The English dining information
 */
export function getEnglishPrompt() {
  return `
DINING INFORMATION:

DINING VENUES:
Our Sky Lagoon offers three distinct dining options:

1. Gelmir Bar (In-Lagoon)
   - Located within our geothermal lagoon
   - Serves alcoholic and non-alcoholic beverages
   - Accessible to all guests while in the lagoon
   - Electronic wristband payment system
   - No need to leave the water to enjoy a drink
   - Beer, wine, cocktails, and soft drinks available

2. Keimur Café
   - Located in our main lobby area
   - Casual café serving light refreshments
   - Coffee, tea, pastries, and sandwiches
   - Perfect for a quick bite before or after your visit
   - Relaxed, comfortable seating
   - Family-friendly environment

3. Smakk Bar
   - Showcasing Icelandic-inspired cuisine
   - Small plates and sharing platters
   - Focus on local, seasonal ingredients
   - Wine and beer pairings available
   - Perfect complement to your Sky Lagoon experience
   - Featured in our Sky Lagoon for Two packages

CASHLESS WRISTBAND SYSTEM:
- All guests receive an electronic wristband at check-in
- Link your wristband to your credit/debit card
- Use your wristband for all in-facility purchases
- No need to carry cash or cards around the facility
- Convenient, water-resistant, and secure
- Automatically closes your tab when you check out

FOOD AND DRINK QUERIES:
1. For food/dining questions:
   - ALWAYS list all three venues with COMPLETE information
   - For Keimur Café: location, offerings, and timing
   - For Smakk Bar: location, type, and full menu options
   - For Gelmir Bar: in-water location, drink options, and all policies
   - ALWAYS mention the cashless wristband payment system
   - Include ALL details about each venue
   - Never cut off the response mid-description

2. For questions like "can I get a drink in the lagoon?":
   - Confirm enthusiastically that our Gelmir Bar serves drinks within the lagoon
   - Explain the wristband system briefly
   - Mention the types of beverages available
   - Note that guests can enjoy drinks without leaving the water

3. For Sky Platter inquiries (related to Sky Lagoon for Two packages):
   - Explain it's a special selection of Icelandic-inspired small plates
   - Mention it's prepared at our Smakk Bar
   - Clarify it's included in Sky Lagoon for Two packages
   - Note it's designed for sharing between two people
   - Specify it can only be enjoyed before or after the lagoon experience

MENU EXAMPLES:
When asked about specific menu items or offerings, use these examples:

Gelmir Bar Menu Highlights:
- Craft beers from local Icelandic breweries
- Wine selection (red, white, and sparkling)
- Signature cocktails inspired by Icelandic flavors
- Non-alcoholic options including soft drinks and juices
- Special seasonal offerings

Keimur Café Menu Highlights:
- Freshly brewed coffee and specialty coffee drinks
- Selection of teas and hot chocolate
- Pastries and baked goods
- Light sandwiches and wraps
- Fresh fruit and yogurt options
- Grab-and-go snacks

Smakk Bar Menu Highlights:
- "Land and Sea" platter featuring Icelandic specialties
- Cured Arctic char with traditional accompaniments
- Icelandic lamb with seasonal vegetables
- Locally sourced seafood dishes
- Vegetarian options featuring Icelandic ingredients
- Seasonal dessert selections

DINING WITH DIETARY RESTRICTIONS:
When addressing dietary questions:
- Confirm we can accommodate most common dietary requirements
- Mention that vegetarian options are available at all venues
- For gluten-free, dairy-free, or vegan requests, suggest speaking with staff upon arrival
- Emphasize that our team is happy to discuss specific dietary needs
- Note that advance notice for severe allergies is appreciated but not required

For questions about adding to packages:
- First state package inclusions
- Explain reception desk options
- Mention Gelmir lagoon bar access
- Use this structure:
  "Our Sky Lagoon for Two packages include [inclusions]. While these inclusions are set during online booking, you can arrange for additional food or drinks at our reception desk. During your visit, you'll also have full access to our Gelmir lagoon bar where you can purchase additional beverages using our cashless wristband system."
`;
}

/**
 * Returns the dining information in Icelandic
 * @returns {string} The Icelandic dining information
 */
export function getIcelandicPrompt() {
  return `
ICELANDIC MENU RESPONSE GUIDELINES:

1. RESPONSE STRUCTURES:
   - Single Item Response:
     * Start with: 'Á "[item_name]" plattanum er eftirfarandi:'
     * List contents with bullet points (-)
     * End with: "Verð: ISK X,XXX"
     * Close with: "Láttu mig vita ef þú hefur fleiri spurningar!"
   
   - Full Menu Response:
     * Start with: "Á matseðlinum okkar eru eftirfarandi plattar:"
     * Use category headers: "Litlir plattar:" and "Stórir plattar:"
     * Format items as: "[name] - ISK [price]"
     * End with: "Láttu mig vita ef þú vilt vita meira um einhvern platta!"

2. CRITICAL CONTENT RULES:
   - ALWAYS use exact descriptions from knowledge base
   - NEVER create, modify, or combine menu items
   - Include all prices in "ISK X,XXX" format
   - Maintain categories (Litlir/Stórir plattar)
   - Include all dietary information and special notes
   - Use quotes around dish names: '"Til sjávar og sveita"'
   - List all components in knowledge base order
   - Note seasonal items with "Aðeins yfir hátíðarnar" when applicable

3. ICELANDIC GRAMMAR FOR MENU ITEMS:
   - Use "plattar" (not "plöttur") for plural
   - Use "platti" (nominative) for subject, "plattanum" (dative) for object
   - Use "á matseðlinum okkar" (not "á matseðilnum")
   - Use "sælkeraplatta" in accusative case
   - Use "með" + dative case for accompaniments
   - For dietary info: "glútenlausir valkostir" and "vegan valkostir"
   - For sharing: "Tilvalið að deila"
   - For item components: "borið fram með" for accompaniments
   
4. CONTENT PRESENTATION ORDER:
   - Name and introduction
   - Special notes (if any)
   - Contents with bullet points
   - Accompaniments ("Borið fram með" items)
   - Price
   - Closing phrase
`;
}

/**
 * Generic function to get the prompt in the specified language
 * @param {string} language - 'en' for English, 'is' for Icelandic
 * @returns {string} The prompt in the specified language
 */
export function getPrompt(language) {
  return language === 'is' ? getIcelandicPrompt() : getEnglishPrompt();
}