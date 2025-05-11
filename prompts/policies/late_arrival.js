// prompts/policies/late_arrival.js
// Contains late arrival policy information in both English and Icelandic

/**
 * Returns the late arrival policy prompt in English
 * @returns {string} The English late arrival policy
 */
export function getEnglishPrompt() {
  return `
# Late Arrival Policy

- Guests have a 30-minute grace period after their booking time.
- Example: For an 18:00 booking, guests can arrive any time between 18:00-18:30.
- Guests CANNOT arrive before their booked time.
- For arrivals more than 30 minutes late:
  - We recommend changing the booking to a more suitable time
  - Contact options: Phone +354 527 6800 (9 AM - 6 PM) or email reservations@skylagoon.is
  - Without rebooking, entry is not guaranteed and may involve waiting
  - For 1-2 hour delays, rebooking is essential

# Common Late Arrival Scenarios

## Early Arrival (Before Booking Time)
- Not permitted - guests must arrive at or after their booked time
- Recommend arriving at the booked time or contacting us to check earlier availability

## Within Grace Period (0-30 minutes late)
- Can proceed directly to reception
- May experience a brief wait during busy periods
- No rebooking needed

## Moderate Delay (31-60 minutes late)
- Rebooking recommended, especially during busy periods
- Entry not guaranteed without rebooking
- May need to wait if arriving without rebooking

## Significant Delay (60+ minutes late)
- Rebooking necessary
- Entry unlikely without a new booking

## Special Cases
- Flight delays: We understand air travel can be unpredictable. Contact us to arrange a solution.
- Traffic or transport issues: The 30-minute grace period usually accommodates these situations.
- Group delays: Same rules apply, but please notify us as soon as possible.

When discussing late arrivals, maintain a helpful, understanding tone. Explain the policy conversationally, adapting to the specific situation mentioned by the guest.
`;
}

/**
 * Returns the late arrival policy prompt in Icelandic
 * @returns {string} The Icelandic late arrival policy
 */
export function getIcelandicPrompt() {
  return `
# Reglur um seinkun

- Gestir hafa 30 mínútna svigrúm eftir bókaðan tíma.
- Dæmi: Fyrir bókun kl. 18:00 geta gestir mætt hvenær sem er milli 18:00-18:30.
- Gestir GETA EKKI mætt fyrir bókaðan tíma.
- Fyrir komur meira en 30 mínútum seint:
  - Við mælum með að breyta bókuninni í hentugri tíma
  - Samskiptamöguleikar: Sími +354 527 6800 (9-18) eða tölvupóstur reservations@skylagoon.is
  - Án endurmótunar er inngangur ekki tryggður og getur falið í sér bið
  - Fyrir 1-2 klukkustunda seinkanir er nauðsynlegt að endurbóka

# Algeng tilvik um seinkun

## Koma fyrir bókaðan tíma
- Ekki er hægt að mæta fyrir bókaðan tíma
- Mælt er með að mæta á bókaðan tíma eða hafa samband til að athuga með fyrri tíma

## Innan svigrúms (0-30 mínútum seint)
- Gestir geta farið beint að móttöku
- Gæti þurft að bíða aðeins á annatímum
- Ekki þarf að breyta bókun

## Miðlungs seinkun (31-60 mínútum seint)
- Mælt er með að endurbóka, sérstaklega á annatímum
- Inngangur ekki tryggður án endurbótunar
- Gæti þurft að bíða ef komið er án endurbótunar

## Veruleg seinkun (60+ mínútum seint)
- Endurbókun nauðsynleg
- Inngangur ólíklegur án nýrrar bókunar

## Sérstök tilvik
- Flugseinkanir: Við skiljum að flugferðir geta verið ófyrirsjáanlegar. Hafðu samband við okkur til að finna lausn.
- Umferðar- eða samgönguvandamál: 30 mínútna svigrúmið nær venjulega yfir þessar aðstæður.
- Hópseinkanir: Sömu reglur gilda, en vinsamlegast láttu okkur vita eins fljótt og auðið er.

Þegar rætt er um seinkanir, viðhaldið hjálplegum, skilningsríkum tóni. Útskýrðu reglurnar á samræðumáta, aðlagaðu að sérstökum aðstæðum sem gesturinn nefnir.
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