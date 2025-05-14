// scripts/addContactEmbeddings.js
import { generateEmbedding, storeEmbedding } from '../utils/embeddings.js';
import dotenv from 'dotenv';
dotenv.config();

async function addContactEmbeddings() {
  console.log('Adding high-quality contact embeddings for Icelandic...');
  
  // Create highly optimized contact information chunks
  const contactChunks = [
    {
      content: `
Sp: Hvernig get ég haft samband við Sky Lagoon? Þarf að fá samband við manneskju. Get ég talað við starfsmann?
Sv: Þú getur haft samband við þjónustuver Sky Lagoon með eftirfarandi hætti:

SÍMANÚMER: +354 527 6800
Opnunartími síma: Alla virka daga frá 9:00 til 18:00

TÖLVUPÓSTUR: reservations@skylagoon.is
Við svörum öllum fyrirspurnum eins fljótt og auðið er.

Ef þú þarft að ná sambandi við starfsfólk okkar varðandi bókanir, afbókanir, fyrirspurnir um þjónustu eða annað, ekki hika við að hafa samband. Starfsfólk okkar er alltaf tilbúið að aðstoða þig.
      `.trim(),
      metadata: {
        language: 'is',
        type: 'contact_information',
        section: 'customer_service',
        priority: 'high',
        keywords: 'samband, hafa samband, símanúmer, tölvupóstur, hringja, starfsfólk, manneskja, þjónustuver, netfang, email, hafa samband við manneskju, tala við starfsmann'
      }
    },
    
    {
      content: `
Sp: Get ég hringt í Sky Lagoon? Hvert er símanúmerið? Hvað er símanúmer Sky Lagoon?
Sv: Já, þú getur hringt í þjónustuver Sky Lagoon. Símanúmer okkar er +354 527 6800. Síminn er opinn alla virka daga frá 9:00 til 18:00. Við erum ávallt tilbúin að aðstoða þig með allar fyrirspurnir.
      `.trim(),
      metadata: {
        language: 'is',
        type: 'phone_contact',
        section: 'customer_service',
        priority: 'high',
        keywords: 'sími, símanúmer, hringja, símtal, get ég hringt'
      }
    },
    
    {
      content: `
Sp: Hvert á ég að senda tölvupóst? Hver er tölvupóstfangið ykkar? Hvert er netfangið?
Sv: Þú getur sent okkur tölvupóst á reservations@skylagoon.is. Við svörum öllum fyrirspurnum eins fljótt og auðið er. Tölvupóstur er góð leið til að fá ítarlegar upplýsingar eða aðstoð við bókanir.
      `.trim(),
      metadata: {
        language: 'is',
        type: 'email_contact',
        section: 'customer_service',
        priority: 'high',
        keywords: 'tölvupóstur, netfang, email, póstur, póstfang, senda tölvupóst'
      }
    },
    
    {
      content: `
Sp: Þarf að fá samband við manneskju. Hvernig næ ég sambandi við starfsmann? Get ég talað við einhvern?
Sv: Þú getur náð sambandi við starfsfólk Sky Lagoon með því að:

1. Hringja í síma +354 527 6800 (opinn virka daga 9:00-18:00)
2. Senda tölvupóst á reservations@skylagoon.is

Starfsfólk okkar er alltaf tilbúið að aðstoða þig með allar fyrirspurnir, bókanir, breytingar eða séróskir. Við svörum öllum fyrirspurnum eins fljótt og mögulegt er.
      `.trim(),
      metadata: {
        language: 'is',
        type: 'human_contact',
        section: 'customer_service',
        priority: 'high',
        keywords: 'manneskja, samband við manneskju, tala við, tala við starfsmann, starfsmaður, þjónustuver, starfsfólk, fá samband'
      }
    }
  ];
  
  console.log(`Created ${contactChunks.length} high-quality contact chunks for Icelandic`);
  
  // Store each chunk as an individual embedding
  for (const chunk of contactChunks) {
    try {
      const result = await storeEmbedding(chunk.content, chunk.metadata, 'is');
      console.log(`Successfully stored embedding for ${chunk.metadata.type}`);
    } catch (error) {
      console.error(`Error storing ${chunk.metadata.type} embedding:`, error);
    }
  }
  
  console.log('All contact embeddings have been added successfully!');
}

// Run the function
addContactEmbeddings();
