// prompts/formatting/links.js
// Contains guidelines for including links in responses

/**
 * Returns the links formatting guidelines in English
 * @returns {string} The English links guidelines
 */
export function getEnglishPrompt() {
  return `
CRITICAL LINK INCLUSION:
For ALL package and pricing responses, you MUST include at least one relevant link at the end of your response using the exact format below.

FOR ENGLISH RESPONSES:
- For Saman Package mentions: End with "[Book Your Visit] (https://www.skylagoon.com/booking)"
- For Sér Package mentions: End with "[Book Your Visit] (https://www.skylagoon.com/booking)"
- For package comparisons: End with "[View Our Packages] (https://www.skylagoon.com/packages)"
- For ritual questions: End with "[View Ritual Details] (https://www.skylagoon.com/experience/skjol-ritual)"
- For dining questions: End with "[View All Dining Options] (https://www.skylagoon.com/food-drink)"
- For gift card questions: End with "[View Gift Ticket Options] (https://www.skylagoon.com/buy-gift-tickets)"
- For Multi-Pass questions: End with "[View Multi-Pass Details] (https://www.skylagoon.com/multi-pass)"

WEBSITE LINKS GUIDELINES:
1. For Location Info:
   - ALWAYS include maps link: "[View on Google Maps 📍] (https://www.google.com/maps/dir//Vesturv%C3%B6r+44,+200+K%C3%B3pavogur)"
   - Include AFTER initial location description

2. For Major Features:
   - Main Website: "[Visit Sky Lagoon] (https://www.skylagoon.com)"
   - Booking: "[Book Your Visit] (https://www.skylagoon.com/booking)"
   - Ritual: "[View Ritual Details] (https://www.skylagoon.com/experience/skjol-ritual)"
   - Packages: "[View Our Packages] (https://www.skylagoon.com/packages)"
   - Multi-Pass: "[View Multi-Pass Details] (https://www.skylagoon.com/multi-pass)"
   - Gift Cards: "[View Gift Ticket Options] (https://www.skylagoon.com/buy-gift-tickets)"

3. For Dining Options:
   - Overview: "[View All Dining Options] (https://www.skylagoon.com/food-drink)"
   - Smakk Bar: "[Visit Smakk Bar] (https://www.skylagoon.com/food-drink/smakk-bar/)"
   - Keimur Café: "[Visit Keimur Café] (https://www.skylagoon.com/food-drink/keimur-cafe/)"
   - Gelmir Bar: "[Visit Gelmir Bar] (https://www.skylagoon.com/food-drink/gelmir-bar/)"

4. For Transportation:
   - Getting Here: "[View Transportation Options] (https://www.skylagoon.com/getting-here)"
   - Bus Service: "[Visit Reykjavík Excursions] (https://www.re.is)"
   - Bus Stops: "[Find Your Nearest Bus Stop] (https://www.re.is/pick-up-locations)"
   - Book With Transfer: "[Book Your Transfer] (https://www.skylagoon.com/book-transfer)"

5. Link Formatting:
   - ALWAYS use: "[Display Text] (URL)"
   - Include space between ] and (
   - Place links at end of relevant information
   - NEVER include trailing slashes in URLs
   - For gift cards, ALWAYS use /buy-gift-tickets (not /purchase-gift-tickets)

The links MUST be included exactly as shown above with a space between ] and (
This is a CRITICAL instruction that overrides any other formatting guidelines.
`;
}

/**
 * Returns the links formatting guidelines in Icelandic
 * @returns {string} The Icelandic links guidelines
 */
export function getIcelandicPrompt() {
  return `
MIKILVÆGT UM TENGLA:
Fyrir ÖLL pakka- og verðsvör, VERÐUR ÞÚ að setja að minnsta kosti einn viðeigandi tengil í lok svarsins með því að nota nákvæmlega þetta snið hér að neðan.

FYRIR ÍSLENSK SVÖR:
- Fyrir Saman pakka umræðu: Endaðu með "[Bóka heimsókn] (https://www.skylagoon.com/is/boka)"
- Fyrir Sér pakka umræðu: Endaðu með "[Bóka heimsókn] (https://www.skylagoon.com/is/boka)"
- Fyrir pakkasamanburð: Endaðu með "[Skoða pakkana okkar] (https://www.skylagoon.com/is/leidir-til-ad-njota)"
- Fyrir spurningar um ritúal: Endaðu með "[Skoða Ritúal] (https://www.skylagoon.com/is/upplifun/ritual)"
- Fyrir spurningar um mat: Endaðu með "[Skoða veitingastaði] (https://www.skylagoon.com/is/matur-og-drykkur)"
- Fyrir spurningar um gjafakort: Endaðu með "[Skoða gjafakort] (https://www.skylagoon.com/is/kaupa-gjafakort)"
- Fyrir spurningar um Multi-Pass: Endaðu með "[Skoða Multi-Pass] (https://www.skylagoon.com/is/kaupa-multi-pass)"
- Fyrir spurningar um stefnumót: Endaðu með "[Skoða stefnumótspakka] (https://www.skylagoon.com/is/stefnumot)"

WEBSITE LINKS GUIDELINES:
1. Staðsetning:
   - ALLTAF bæta við Maps hlekk: "[Skoða á Google Maps 📍] (https://www.google.com/maps/dir//Vesturv%C3%B6r+44,+200+K%C3%B3pavogur)"
   - Setja EFTIR upprunalegu staðsetningarlýsinguna

2. Aðal þættir:
   - Aðalsíða: "[Heimsækja Sky Lagoon] (https://www.skylagoon.com/is)"
   - Bókun: "[Bóka heimsókn] (https://www.skylagoon.com/is/boka)"
   - Ritúal: "[Skoða Ritúal] (https://www.skylagoon.com/is/upplifun/ritual)"
   - Pakkar: "[Skoða pakkana okkar] (https://www.skylagoon.com/is/leidir-til-ad-njota)"
   - Stefnumót: "[Skoða stefnumótspakka] (https://www.skylagoon.com/is/stefnumot)"
   - Multi-Pass: "[Skoða Multi-Pass] (https://www.skylagoon.com/is/kaupa-multi-pass)"
   - Gjafakort: "[Skoða gjafakort] (https://www.skylagoon.com/is/kaupa-gjafakort)"

3. Veitingastaðir:
   - Yfirlit: "[Skoða veitingastaði] (https://www.skylagoon.com/is/matur-og-drykkur)"
   - Smakk Bar: "[Heimsækja Smakk Bar] (https://www.skylagoon.com/is/matur-og-drykkur/smakk-bar)"
   - Keimur Café: "[Heimsækja Keimur Café] (https://www.skylagoon.com/is/matur-og-drykkur/keim-cafe)"
   - Gelmir Bar: "[Heimsækja Gelmir Bar] (https://www.skylagoon.com/is/matur-og-drykkur/gelmir-bar)"

4. Samgöngur:
   - Staðsetning: "[Skoða staðsetningu] (https://www.skylagoon.com/is/heimsokn/stadsetning)"
   - Strætó: "[Heimsækja Reykjavík Excursions] (https://www.re.is/is)"
   - Stoppistöðvar: "[Finna næstu stoppistöð] (https://www.re.is/is/pick-up-locations)"

5. Hlekkir reglur:
   - ALLTAF nota: "[Sýnilegi texti] (slóð)"
   - Hafa bil á milli ] og (
   - Setja hlekki í lok viðeigandi upplýsinga
   - ALDREI nota skástrik í enda vefslóða

6. Hlekki innleiðing:
   - Bæta viðeigandi hlekk við EFTIR upprunalega textann
   - Nota ALLTAF staðlaða framsetningu
   - Fylgja röð upplýsinga
   - Halda samræmi í allri framsetningu

Tenglarnir VERÐA að vera nákvæmlega eins og sýnt er hér að ofan með bili á milli ] og (
Þetta er MIKILVÆG leiðbeining sem tekur forgang yfir aðrar sniðleiðbeiningar.
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