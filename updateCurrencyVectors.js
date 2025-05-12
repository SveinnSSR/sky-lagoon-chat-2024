// updateCurrencyVectors.js
import { storeEmbedding } from './utils/embeddings.js';
import dotenv from 'dotenv';
dotenv.config();

async function addCurrencyInfo() {
  try {
    console.log('Starting to add currency information to vector database...');
    
    const currencyContent = `
CURRENCY INFORMATION: Sky Lagoon offers multiple currency options including EUR, USD, GBP, and CAD.
Users can change currency by clicking the currency dropdown in the top-right corner of the website.
Prices are displayed in ISK by default, but can be viewed in US Dollars (USD), Euros (EUR), British Pounds (GBP), or Canadian Dollars (CAD) using the currency selector.
When asked about prices in specific currencies such as American dollars or USD, users should be directed to use the currency selector on the website.
All packages are priced in Icelandic Krona (ISK) by default but can be viewed in other currencies through the website's currency selector.
The currency selector is located in the top-right corner of the website next to the Book Now button.
`;
    
    await storeEmbedding(currencyContent, {
      type: 'currency',
      section: 'pricing',
      priority: 'high',
      keywords: 'dollar, usd, euro, eur, gbp, pound, cad, price, currency, exchange rate, conversion, american dollars'
    }, 'en');
    
    // Also add an Icelandic version
    const currencyContentIs = `
UPPLÝSINGAR UM GJALDMIÐIL: Sky Lagoon býður upp á marga gjaldmiðla, þar á meðal EUR, USD, GBP og CAD.
Notendur geta breytt gjaldmiðli með því að smella á gjaldmiðilsvalið efst í hægra horni vefsíðunnar.
Verð er sýnt í ISK sem sjálfgefið, en hægt er að skoða það í Bandaríkjadölum (USD), Evrum (EUR), Breskum pundum (GBP) eða Kanadískum dölum (CAD) með gjaldmiðilsvalinu.
Þegar spurt er um verð í ákveðnum gjaldmiðli eins og Bandaríkjadölum eða USD, ætti að beina notendum að nota gjaldmiðilsvalið á vefsíðunni.
Allir pakkar eru verðlagðir í íslenskum krónum (ISK) sem sjálfgefið en hægt er að skoða þá í öðrum gjaldmiðlum í gegnum gjaldmiðilsval vefsíðunnar.
Gjaldmiðilsvalið er staðsett efst í hægra horni vefsíðunnar við hliðina á Book Now hnappnum.
`;
    
    await storeEmbedding(currencyContentIs, {
      type: 'currency',
      section: 'pricing',
      priority: 'high',
      keywords: 'dollar, usd, euro, eur, gbp, pound, cad, verð, gjaldmiðill, gengisumreiknivél, umreikningur, bandaríkjadali'
    }, 'is');
    
    console.log('✅ Currency information successfully added to vector database in both English and Icelandic');
  } catch (error) {
    console.error('Error adding currency information:', error);
    console.error(error.stack);
  }
}

// Run the function
(async () => {
  try {
    await addCurrencyInfo();
    console.log('Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Script failed with error:', error);
    process.exit(1);
  }
})();
