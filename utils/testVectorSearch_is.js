// utils/testVectorSearch_is.js
import { getRelevantKnowledge_is } from '../knowledgeBase_is.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSearch() {
  try {
    // Test queries in Icelandic
    const queries = [
      "Hvenær er opið?",
      "Segðu mér frá Skjól helgisiðnum",
      "Hvað kostar Pure Lite pakkinn?",
      "Er skutluþjónusta?",
      "Hvaða veitingamöguleikar eru í boði?",
      "Geta börn heimsótt Sky Lagoon?",
      "Hvernig kemst ég að Sky Lagoon frá Reykjavík?"
    ];
    
    console.log('=== PRÓFUN Á ÍSLENSKU VEKTÓRLEIT ===');
    for (const query of queries) {
      console.log(`\n📝 Fyrirspurn: "${query}"`);
      const startTime = Date.now();
      const results = await getRelevantKnowledge_is(query);
      const endTime = Date.now();
      
      if (results.length === 0) {
        console.log("❌ Engar viðeigandi upplýsingar fundust.");
      } else {
        console.log(`✅ Fann ${results.length} viðeigandi hluta (tók ${endTime - startTime}ms):`);
        for (const [i, result] of results.entries()) {
          console.log(`\n#${i+1} (${Math.round((result.similarity || 0) * 100)}% samsvörun):`);
          console.log(`Tegund: ${result.type || 'óþekkt'}`);
          console.log(`Efni: ${result.content ? result.content.substring(0, 200) + (result.content.length > 200 ? '...' : '') : 'Ekkert efni'}`);
        }
      }
    }
  } catch (error) {
    console.error('Villa við prófun á vektórleit:', error);
  }
}

testSearch().catch(console.error);
