// utils/testVectorSearch_en.js
import { getRelevantKnowledge } from '../knowledgeBase.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSearch() {
  try {
    // Test queries - these are common questions your users might ask
    const queries = [
      "What are your opening hours?",
      "Tell me about the Skjól ritual",
      "How much is the Pure Lite package?",
      "Do you have a shuttle service?",
      "What dining options do you have?",
      "Can children visit Sky Lagoon?",
      "How do I get to Sky Lagoon from Reykjavik?"
    ];
    
    console.log('=== TESTING ENGLISH VECTOR SEARCH ===');
    for (const query of queries) {
      console.log(`\n📝 Query: "${query}"`);
      const startTime = Date.now();
      const results = await getRelevantKnowledge(query);
      const endTime = Date.now();
      
      if (results.length === 0) {
        console.log("❌ No relevant knowledge found.");
      } else {
        console.log(`✅ Found ${results.length} relevant chunks (took ${endTime - startTime}ms):`);
        for (const [i, result] of results.entries()) {
          console.log(`\n#${i+1} (${Math.round((result.similarity || 0) * 100)}% match):`);
          console.log(`Type: ${result.type || 'unknown'}`);
          console.log(`Content: ${result.content ? result.content.substring(0, 200) + (result.content.length > 200 ? '...' : '') : 'No content'}`);
        }
      }
    }
  } catch (error) {
    console.error('Error testing vector search:', error);
  }
}

testSearch().catch(console.error);
