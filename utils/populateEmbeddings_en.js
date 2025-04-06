// utils/populateEmbeddings_en.js
import { knowledgeBase } from '../knowledgeBase.js';
import { bulkStoreEmbeddings } from './embeddings.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Helper function to safely access nested object properties
 */
function safeGet(obj, key, defaultValue = '') {
  if (!obj || typeof obj !== 'object') return defaultValue;
  return obj[key] !== undefined ? obj[key] : defaultValue;
}

/**
 * Main function to extract text chunks from the knowledge base
 */
async function extractTextChunks() {
  const chunks = [];
  const processedContent = new Set();
  let duplicateCount = 0;
  let sectionsProcessed = 0;
  
  // Configuration for balanced chunks
  const MIN_CHUNK_LENGTH = 250;
  const MAX_CHUNK_LENGTH = 1000;
  
  /**
   * Add a chunk with proper deduplication and size checking
   */
  function addChunk(content, metadata = {}) {
    if (!content || content.trim().length === 0) return;
    
    // Normalize content to avoid minor differences causing duplicates
    const normalizedContent = content.trim().replace(/\s+/g, ' ');
    
    // Skip if content is too short
    if (normalizedContent.length < MIN_CHUNK_LENGTH) return;
    
    // Skip if we've already processed this content
    if (processedContent.has(normalizedContent)) {
      duplicateCount++;
      return;
    }
    
    // Split into smaller chunks if too long
    if (normalizedContent.length > MAX_CHUNK_LENGTH) {
      // Split by sentence for more natural chunks
      const sentences = normalizedContent.match(/[^.!?]+[.!?]+/g) || [normalizedContent];
      let currentChunk = '';
      let chunkSentences = [];
      
      for (const sentence of sentences) {
        if ((currentChunk.length + sentence.length > MAX_CHUNK_LENGTH) && currentChunk.length > MIN_CHUNK_LENGTH) {
          const combinedChunk = chunkSentences.join(' ');
          processedContent.add(combinedChunk);
          chunks.push({
            content: combinedChunk,
            metadata: { language: 'en', ...metadata }
          });
          currentChunk = '';
          chunkSentences = [];
        }
        
        currentChunk += sentence + ' ';
        chunkSentences.push(sentence);
      }
      
      // Add the last chunk if it meets minimum size
      if (currentChunk.length >= MIN_CHUNK_LENGTH) {
        const finalChunk = chunkSentences.join(' ');
        processedContent.add(finalChunk);
        chunks.push({
          content: finalChunk,
          metadata: { language: 'en', ...metadata }
        });
      }
    } else {
      // For content that doesn't need splitting
      processedContent.add(normalizedContent);
      chunks.push({
        content: normalizedContent,
        metadata: { language: 'en', ...metadata }
      });
    }
  }
  
  console.log('Processing the knowledge base...');
  
  // Process main sections of the knowledge base
  for (const [sectionKey, sectionValue] of Object.entries(knowledgeBase)) {
    console.log(`Processing section: ${sectionKey}...`);
    sectionsProcessed++;
    
    // Skip function imports at the top of the file
    if (sectionKey === 'searchSimilarContent' || sectionKey === 'getRelevantKnowledge') {
      continue;
    }
    
    // Process section directly
    processSection(sectionKey, sectionValue, sectionKey);
  }
  
  /**
   * Process a section of the knowledge base recursively
   */
  function processSection(key, value, type) {
    // Handle arrays of strings or objects
    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'string') {
        addChunk(`${key}: ${value.join('. ')}`, { type, section: key });
      } else if (value.length > 0 && typeof value[0] === 'object') {
        // Process arrays of objects
        const combinedTexts = value.map(item => {
          const parts = [];
          for (const [itemKey, itemValue] of Object.entries(item)) {
            if (typeof itemValue === 'string' && itemValue.trim()) {
              parts.push(`${itemKey}: ${itemValue}`);
            }
          }
          return parts.join('. ');
        }).filter(text => text.trim());
        
        if (combinedTexts.length > 0) {
          addChunk(`${key}: ${combinedTexts.join(' | ')}`, { type, section: key });
        }
        
        // Also process each item individually
        value.forEach((item, index) => {
          processSection(`${key}_${index}`, item, type);
        });
      }
      return;
    }
    
    // Handle objects
    if (value && typeof value === 'object') {
      // Create a combined chunk for this object's text values
      const textValues = [];
      
      for (const [propKey, propValue] of Object.entries(value)) {
        if (propKey.startsWith('_') || propKey === 'type' || propKey === 'section') continue;
        
        if (typeof propValue === 'string' && propValue.trim()) {
          textValues.push(`${propKey}: ${propValue}`);
        }
      }
      
      if (textValues.length > 0) {
        addChunk(`${key}: ${textValues.join('. ')}`, { type, section: key });
      }
      
      // Process each property recursively
      for (const [propKey, propValue] of Object.entries(value)) {
        if (propKey.startsWith('_') || propKey === 'type' || propKey === 'section') continue;
        
        const propType = `${type}_${propKey}`;
        processSection(propKey, propValue, propType);
      }
      return;
    }
    
    // Handle strings and other primitive values
    if (typeof value === 'string' && value.trim()) {
      if (value.length >= MIN_CHUNK_LENGTH) {
        addChunk(`${key}: ${value}`, { type, section: key });
      }
    }
  }
  
  // Add high-quality chunks for critical information areas
  addCriticalInformationChunks();
  
  console.log(`Skipped ${duplicateCount} duplicate chunks`);
  console.log(`Processed ${sectionsProcessed} sections`);
  
  return chunks;
}

/**
 * Create high-quality chunks for critical information
 */
function addCriticalInformationChunks() {
  console.log("Adding optimized chunks for critical information...");
  
  const chunks = [];
  
  // OPENING HOURS - Comprehensive chunk with all hours information
  const openingHoursChunk = createOpeningHoursChunk();
  if (openingHoursChunk) chunks.push(openingHoursChunk);
  
  // DINING OPTIONS - Comprehensive and detailed
  const diningOptionsChunk = createDiningOptionsChunk();
  if (diningOptionsChunk) chunks.push(diningOptionsChunk);
  
  // TRANSPORTATION - Focus on shuttle service
  const transportationChunk = createTransportationChunk();
  if (transportationChunk) chunks.push(transportationChunk);
  
  // RITUAL - Detailed description
  const ritualChunk = createRitualChunk();
  if (ritualChunk) chunks.push(ritualChunk);
  
  // Return all created chunks
  return chunks;
}

/**
 * Create a comprehensive opening hours chunk
 */
function createOpeningHoursChunk() {
  const openingHours = safeGet(knowledgeBase, 'opening_hours', {});
  
  // Craft a comprehensive chunk formatted as natural language Q&A
  let content = `
Q: What are your opening hours? When are you open?
A: Sky Lagoon opening hours vary by season:

SUMMER (June 1 - September 30): Open daily from 09:00 to 23:00.
AUTUMN (October 1 - October 31): Open daily from 10:00 to 23:00.
WINTER (November 1 - May 31): 
  • Monday to Friday: 11:00 to 22:00
  • Weekends (Saturday & Sunday): 10:00 to 22:00

HOLIDAY HOURS:
  • Christmas Eve (December 24): 09:00 to 16:00
  • Christmas Day (December 25): 09:00 to 18:00
  • Boxing Day (December 26): 09:00 to 22:00
  • New Year's Eve (December 31): 09:00 to 18:00
  • New Year's Day (January 1): 10:00 to 22:00

IMPORTANT: The lagoon area closes 30 minutes before closing time. The Skjól Ritual and Gelmir Bar close one hour before facility closing. Last entry is always 2 hours before closing time.
`.trim();

  // Only return if we have actual content
  if (content) {
    return {
      content,
      metadata: {
        language: 'en',
        type: 'opening_hours',
        section: 'comprehensive',
        priority: 'high',
        keywords: 'opening hours, hours, when open, schedule, times, closing time, open, close, schedule, seasonal hours, summer hours, winter hours'
      }
    };
  }
  
  return null;
}

/**
 * Create a comprehensive dining options chunk
 */
function createDiningOptionsChunk() {
  const dining = safeGet(knowledgeBase, 'dining', {});
  
  // Craft a comprehensive chunk formatted as natural language Q&A
  let content = `
Q: What dining options do you have? What restaurants are available?
A: Sky Lagoon offers three dining venues:

1. SMAKK BAR - Our main restaurant serving Icelandic cuisine with a focus on local ingredients. Offers tasting platters featuring products from local producers, plus wine, beer and other drinks. Perfect for completing your Sky Lagoon experience with authentic Icelandic flavors. Menu includes small platters (cheese, seafood, chocolate), large sharing platters, and both alcoholic and non-alcoholic beverages. Vegan and gluten-free options available.

2. KEIMUR CAFÉ - Casual café serving quality coffee from Te & Kaffi, refreshing drinks, hearty soups, and freshly baked treats from one of Iceland's oldest bakeries, Sandholt Bakery. Find gluten-free and vegan options here as well.

3. GELMIR BAR - In-water bar located within the lagoon where you can enjoy Icelandic beer, mixed drinks or wine right at the water's edge. Simply scan your wristband to make purchases. Maximum three alcoholic drinks per guest.

All venues offer cashless payment using your electronic wristband which is linked to your credit card at check-in.
`.trim();

  // Only return if we have actual content
  if (content) {
    return {
      content,
      metadata: {
        language: 'en',
        type: 'dining',
        section: 'comprehensive',
        priority: 'high',
        keywords: 'dining, restaurant, food, eat, menu, café, cafe, bar, smakk, keimur, gelmir, vegan, vegetarian, drinks, options, meal'
      }
    };
  }
  
  return null;
}

/**
 * Create a comprehensive transportation chunk
 */
function createTransportationChunk() {
  const transportation = safeGet(knowledgeBase, 'transportation', {});
  
  // Craft a comprehensive chunk formatted as natural language Q&A
  let content = `
Q: How do I get to Sky Lagoon? Is there a shuttle service?
A: Sky Lagoon is located at Vesturvör 44-48, 200 Kópavogur, just 7 kilometers (about 15 minutes drive) from central Reykjavík. Several transportation options are available:

SHUTTLE SERVICE:
Sky Lagoon offers a dedicated shuttle service operated by Reykjavík Excursions. Shuttles depart from BSÍ bus terminal at:
  • 13:00 (GMT)
  • 15:00 (GMT)
  • 17:00 (GMT)
  • 19:00 (GMT)

Hotel pickup is available starting 30 minutes before your selected time. Return shuttles depart from Sky Lagoon at: 14:30, 15:30, 16:30, 17:30, 18:30, 19:30, 20:30, and 21:30 (GMT).

PUBLIC TRANSPORTATION:
Take bus #4 from Hlemmur square to Hamraborg (15 minutes), then transfer to bus #35 and exit at Hafnarbraut (4 minutes). A short 10-minute walk along the ocean will take you to Sky Lagoon.

DRIVING:
Free parking is available for all guests with no time limits. Follow Kringlumýrarbraut (Route 40) to Kársnesbraut, then to Vesturvör.

WALKING/CYCLING:
Walking and cycling paths lead to Sky Lagoon, making environmentally friendly transportation options available.
`.trim();

  // Only return if we have actual content
  if (content) {
    return {
      content,
      metadata: {
        language: 'en',
        type: 'transportation',
        section: 'comprehensive',
        priority: 'high',
        keywords: 'transportation, shuttle, bus, driving, directions, how to get, location, shuttle service, getting there, reykjavik excursions, bsi'
      }
    };
  }
  
  return null;
}

/**
 * Create a comprehensive ritual chunk
 */
function createRitualChunk() {
  const ritual = safeGet(knowledgeBase, 'ritual', {});
  
  // Craft a comprehensive chunk formatted as natural language Q&A
  let content = `
Q: What is the Skjól ritual? Can you tell me about the ritual steps?
A: The Skjól ritual is our signature seven-step wellness journey included with all Sky Lagoon packages. The ritual connects you with ancient Icelandic bathing culture through these seven steps:

1. LAUG (Warm Lagoon): Begin in our geothermal lagoon (38-40°C), relaxing in the warm water while enjoying panoramic ocean views.

2. KULDI (Cold Plunge): Invigorate your body with a brief dip in our cold plunge pool (5°C), stimulating circulation and awakening your senses.

3. YLUR (Sauna): Experience tranquility in our sauna (80-90°C) with breathtaking sea views. Choose between our classic or phone-free sauna.

4. SÚLD (Cold Mist): Feel refreshed with our rejuvenating cold mist (5°C) that cools your warmed skin.

5. MÝKT (Sky Body Scrub): Apply our signature exfoliating body scrub with almond and sesame seed oils to revitalize your skin.

6. GUFA (Steam): Enter our steam room (46°C) where the warm humidity helps your skin absorb the benefits of the body scrub.

7. SAFT (Refreshment): Complete your journey with a taste of traditional Icelandic crowberry "krækiber" elixir.

The entire ritual typically takes about 45 minutes, though you're welcome to take your time and fully immerse in each step. One full journey through all seven steps is included with every visit to Sky Lagoon.
`.trim();

  // Only return if we have actual content
  if (content) {
    return {
      content,
      metadata: {
        language: 'en',
        type: 'ritual',
        section: 'comprehensive',
        priority: 'high',
        keywords: 'ritual, skjol, skjól, steps, seven steps, process, wellness, bathing culture, laug, kuldi, ylur, suld, mykt, gufa, saft'
      }
    };
  }
  
  return null;
}

/**
 * Main function to populate embeddings
 */
async function populateEmbeddings() {
  try {
    console.log('Starting comprehensive extraction from English knowledge base...');
    
    // Get regular chunks from knowledge base
    const baseChunks = await extractTextChunks();
    
    // Add critical information chunks
    const criticalChunks = addCriticalInformationChunks();
    
    // Combine all chunks
    const allChunks = [...baseChunks, ...criticalChunks];
    
    console.log(`Extracted ${allChunks.length} chunks from the knowledge base`);
    console.log(`Average chunk length: ${Math.round(allChunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / allChunks.length)} characters`);
    
    // Store embeddings
    console.log(`Storing ${allChunks.length} embeddings in the database...`);
    await bulkStoreEmbeddings(allChunks, 'en');
    console.log('Successfully stored all embeddings!');
  } catch (error) {
    console.error('Error populating embeddings:', error);
  }
}

// Run the population process
populateEmbeddings();