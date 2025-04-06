// utils/populateEmbeddings_is.js
import { knowledgeBase_is } from '../knowledgeBase_is.js';
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
  
  // Special handling for questions across the knowledge base
  const questionSets = [];
  
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
            metadata: { language: 'is', ...metadata }
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
          metadata: { language: 'is', ...metadata }
        });
      }
    } else {
      // For content that doesn't need splitting
      processedContent.add(normalizedContent);
      chunks.push({
        content: normalizedContent,
        metadata: { language: 'is', ...metadata }
      });
    }
  }
  
  console.log('Processing the Icelandic knowledge base...');
  
  // Process the knowledge base by iterating through top-level sections
  for (const [sectionKey, sectionValue] of Object.entries(knowledgeBase_is)) {
    console.log(`Processing section: ${sectionKey}...`);
    sectionsProcessed++;
    
    // Skip language detection, import sections
    if (sectionKey === 'searchSimilarContent' || 
        sectionKey === 'getRelevantKnowledge_is' || 
        sectionKey === 'detectLanguage' || 
        sectionKey === 'getLanguageContext') {
      continue;
    }
    
    // Special handling for questions - collect them for Icelandic content
    const questions = extractQuestions(sectionValue, sectionKey);
    if (questions.length > 0) {
      questionSets.push({
        section: sectionKey,
        questions: questions
      });
    }
    
    // Process section directly
    processSection(sectionKey, sectionValue, sectionKey);
  }
  
  // Process all collected question sets
  processQuestionSets(questionSets);
  
  /**
   * Extract all questions from an object recursively
   */
  function extractQuestions(obj, section) {
    const questions = [];
    
    if (!obj || typeof obj !== 'object') {
      return questions;
    }
    
    // Check for direct questions array
    const directQuestions = safeGet(obj, 'questions', []);
    if (Array.isArray(directQuestions) && directQuestions.length > 0) {
      directQuestions.forEach(q => {
        if (typeof q === 'string' && q.trim()) {
          questions.push({
            section: section,
            question: q.trim()
          });
        }
      });
    }
    
    // Check nested properties for questions
    if (!Array.isArray(obj)) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          const nestedQuestions = extractQuestions(value, `${section}_${key}`);
          questions.push(...nestedQuestions);
        }
      }
    } else {
      // For arrays, check each item
      obj.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          const nestedQuestions = extractQuestions(item, `${section}_${index}`);
          questions.push(...nestedQuestions);
        }
      });
    }
    
    return questions;
  }
  
  /**
   * Process all collected question sets
   */
  function processQuestionSets(questionSets) {
    console.log(`Found ${questionSets.length} question sets with questions for better search`);
    
    // Process each section's questions
    questionSets.forEach(set => {
      const { section, questions } = set;
      
      if (questions.length === 0) return;
      
      // Create a combined questions chunk for the whole section
      const allQuestions = questions.map(q => q.question);
      const combinedContent = `Algengar spurningar um ${section}: ${allQuestions.join('. ')}`;
      addChunk(combinedContent, {
        type: 'questions',
        section: section,
        isQuestions: true,
        keywords: allQuestions.join(', ')
      });
    });
  }
  
  /**
   * Process a section of the knowledge base
   */
  function processSection(key, value, type) {
    // Special handling for answers
    const answer = safeGet(value, 'answer', null);
    if (answer && typeof answer === 'string' && answer.trim().length >= MIN_CHUNK_LENGTH) {
      addChunk(`${key}: ${answer}`, {
        type: 'answer',
        section: key,
        isAnswer: true
      });
    } else if (answer && typeof answer === 'object') {
      // Process object answers
      const answerTexts = [];
      
      for (const [ansKey, ansValue] of Object.entries(answer)) {
        if (typeof ansValue === 'string' && ansValue.trim()) {
          answerTexts.push(`${ansKey}: ${ansValue}`);
        }
      }
      
      if (answerTexts.length > 0) {
        const combinedAnswer = answerTexts.join('. ');
        addChunk(`${key} svar: ${combinedAnswer}`, {
          type: 'answer',
          section: key,
          isAnswer: true
        });
      }
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      // For arrays of strings, combine them into a single chunk
      if (value.length > 0 && typeof value[0] === 'string') {
        // Skip already processed questions
        if (key === 'questions' || key.endsWith('_questions')) {
          return;
        }
        
        // Join with proper sentence separators
        const combinedContent = value.join('. ');
        if (combinedContent.trim()) {
          addChunk(`${key}: ${combinedContent}`, {
            type: type,
            section: key
          });
        }
      }
      // For arrays of objects, process each object
      else if (value.length > 0 && typeof value[0] === 'object') {
        // First create combined overview
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
          const groupContent = `${key}: ${combinedTexts.join(' | ')}`;
          addChunk(groupContent, {
            type: type,
            section: key,
            isOverview: true
          });
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
        // Skip metadata and already processed fields
        if (propKey.startsWith('_') || propKey === 'type' || propKey === 'section' || 
            propKey === 'questions' || propKey === 'answer') {
          continue;
        }
        
        if (typeof propValue === 'string' && propValue.trim()) {
          textValues.push(`${propKey}: ${propValue}`);
        }
      }
      
      if (textValues.length > 0) {
        const combinedText = textValues.join('. ');
        addChunk(`${key}: ${combinedText}`, {
          type: type,
          section: key
        });
      }
      
      // Process each property recursively
      for (const [propKey, propValue] of Object.entries(value)) {
        // Skip already processed fields
        if (propKey.startsWith('_') || propKey === 'type' || propKey === 'section' || 
            propKey === 'questions' || propKey === 'answer') {
          continue;
        }
        
        const propType = `${type}_${propKey}`;
        processSection(propKey, propValue, propType);
      }
      return;
    }
    
    // Handle strings
    if (typeof value === 'string' && value.trim()) {
      if (value.length >= MIN_CHUNK_LENGTH) {
        addChunk(`${key}: ${value}`, {
          type: type,
          section: key
        });
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
  
  return chunks;
}

/**
 * Create a comprehensive opening hours chunk
 */
function createOpeningHoursChunk() {
  const openingHours = safeGet(knowledgeBase_is, 'opening_hours', {});
  
  // Craft a comprehensive chunk formatted as natural language Q&A
  let content = `
Sp: Hvenær er opið? Hvernig eru opnunartímarnir?
Sv: Opnunartímar Sky Lagoon eru mismunandi eftir árstíðum:

SUMAR (1. júní - 30. september): Opið alla daga frá 09:00 til 23:00.
HAUST (1. október - 31. október): Opið alla daga frá 10:00 til 23:00.
VETUR (1. nóvember - 31. maí): 
  • Mánudaga til föstudaga: 11:00 til 22:00
  • Helgar (laugardaga og sunnudaga): 10:00 til 22:00

SÉRSTAKIR OPNUNARTÍMAR:
  • Aðfangadagur (24. desember): 09:00 til 16:00
  • Jóladagur (25. desember): 09:00 til 18:00
  • Annar í jólum (26. desember): 09:00 til 22:00
  • Gamlársdagur (31. desember): 09:00 til 18:00
  • Nýársdagur (1. janúar): 10:00 til 22:00

MIKILVÆGT: Lónið lokar 30 mínútum fyrir auglýstan lokunartíma. Skjól ritúalið og Gelmir bar loka klukkutíma fyrir lokun. Síðasta innritun er alltaf 2 klukkustundum fyrir lokun.
`.trim();

  // Only return if we have actual content
  if (content) {
    return {
      content,
      metadata: {
        language: 'is',
        type: 'opening_hours',
        section: 'comprehensive',
        priority: 'high',
        keywords: 'opnunartímar, opið, tími, lokunartími, lokað, hvenær, afgreiðslutími, sumar, vetur, haust, opnun, lokun'
      }
    };
  }
  
  return null;
}

/**
 * Create a comprehensive dining options chunk
 */
function createDiningOptionsChunk() {
  const dining = safeGet(knowledgeBase_is, 'dining', {});
  
  // Craft a comprehensive chunk formatted as natural language Q&A
  let content = `
Sp: Hvaða veitingamöguleikar eru í boði? Eruð þið með veitingastaði? Hvar get ég fengið að borða?
Sv: Sky Lagoon býður upp á þrjá veitingastaði:

1. SMAKK BAR - Aðalveitingastaðurinn okkar þar sem boðið er upp á íslenskan mat með áherslu á hráefni úr héraði. Þar eru í boði nokkrir sérvaldir íslenskir sælkeraplattarnir ásamt frábæru úrvali af víni, bjór og öðrum drykkjum. Sælkeraplattarnir innihalda sérvalda bita sem mynda fullkomið jafnvægi og eru settir saman úr árstíðabundnu hráefni frá íslenskum framleiðendum. Tilvalin leið til að ljúka góðri heimsókn í Sky Lagoon með íslenskri matarupplifun. Matseðillinn inniheldur litla platta (ostar, sjávarréttir, súkkulaði), stóra platta til að deila, og bæði áfenga og óáfenga drykki. Vegan og glúteinlausir valkostir í boði.

2. KEIMUR CAFÉ - Notalegt kaffihús sem býður upp á gæðakaffi frá Te & Kaffi, frískandi drykki, ljúffengar súpur og nýbakað lostæti frá einu elsta bakaríi landsins, Sandholt Bakaríi. Hér finnur þú einnig glútenlausa og vegan valkosti.

3. GELMIR BAR - Bar staðsettur í lóninu sjálfu þar sem þú getur notið íslensks bjórs, blandaðra drykkja eða víns beint í heita vatninu. Þú skannar einfaldlega armbandið þitt til að ganga frá pöntun. Hámark þrír áfengir drykkir á gest.

Allir staðirnir bjóða upp á peningalausar greiðslur með því að nota rafræna armbandið sem er tengt við greiðslukortið þitt við innritun.
`.trim();

  // Only return if we have actual content
  if (content) {
    return {
      content,
      metadata: {
        language: 'is',
        type: 'dining',
        section: 'comprehensive',
        priority: 'high',
        keywords: 'veitingar, matur, veitingastaðir, drykkir, kaffihús, bar, matsölustaðir, smakk, keimur, gelmir, vegan, matseðill'
      }
    };
  }
  
  return null;
}

/**
 * Create a comprehensive transportation chunk
 */
function createTransportationChunk() {
  const transportation = safeGet(knowledgeBase_is, 'transportation', {});
  
  // Craft a comprehensive chunk formatted as natural language Q&A
  let content = `
Sp: Hvernig kemst ég að Sky Lagoon? Er skutluþjónusta? Hvernig kemst ég í Sky Lagoon frá Reykjavík?
Sv: Sky Lagoon er staðsett að Vesturvör 44-48, 200 Kópavogi, aðeins 7 kílómetra frá miðborg Reykjavíkur (um 15 mínútna akstur). Nokkrir samgöngumöguleikar eru í boði:

SKUTLUÞJÓNUSTA:
Sky Lagoon býður upp á sérstaka skutluþjónustu frá Reykjavík Excursions. Rútur leggja af stað frá BSÍ rútumiðstöð á eftirfarandi tímum:
  • 13:00
  • 15:00
  • 17:00
  • 19:00

Hótelupptaka er í boði og hefst 30 mínútum fyrir valinn tíma. Skutlur til baka frá Sky Lagoon fara á eftirfarandi tímum: 14:30, 15:30, 16:30, 17:30, 18:30, 19:30, 20:30 og 21:30.

ALMENNINGSSAMGÖNGUR:
Taktu strætó númer 4 frá Hlemmi að Hamraborg (15 mínútur), síðan strætó númer 35 og farðu út við Hafnarbraut (4 mínútur). Stutt 10 mínútna ganga meðfram sjónum mun taka þig að Sky Lagoon.

AKSTUR:
Ókeypis bílastæði eru í boði fyrir alla gesti án tímamarka. Fylgdu Kringlumýrarbraut (leið 40) að Kársnesbraut, þaðan á Vesturvör.

GANGA/HJÓL:
Göngu- og hjólaleiðir liggja að Sky Lagoon sem gerir umhverfisvæna ferðamáta mögulega.
`.trim();

  // Only return if we have actual content
  if (content) {
    return {
      content,
      metadata: {
        language: 'is',
        type: 'transportation',
        section: 'comprehensive',
        priority: 'high',
        keywords: 'samgöngur, skutla, rúta, strætó, akstur, keyra, staðsetning, heimilisfang, áfangastaður, skutluþjónusta, reykjavík excursions, bsi'
      }
    };
  }
  
  return null;
}

/**
 * Create a comprehensive ritual chunk
 */
function createRitualChunk() {
  const ritual = safeGet(knowledgeBase_is, 'ritual', {});
  
  // Craft a comprehensive chunk formatted as natural language Q&A
  let content = `
Sp: Hvað er Skjól ritúalið? Segðu mér frá ritúalinu. Hvernig virkar ritúalið? Hver eru skrefin?
Sv: Skjól ritúalið er sérstök sjö skrefa vellíðunarmeðferð sem er innifalin í öllum Sky Lagoon pökkum. Ritúalið tengir þig við forna íslenska baðmenningu í gegnum þessi sjö skref:

1. LAUG: Byrjaðu ferðalagið í heitum jarðhitatjörninni (38-40°C), þar sem þú slakar á í hlýju vatninu og nýtur útsýnis yfir hafið.

2. KULDI: Örvið líkamann með stuttri dýfu í köldum potti (5°C), sem örvar blóðrás og vekur skynfæri þín.

3. YLUR: Upplifðu kyrrð í sánunni okkar (80-90°C) með stórbrotnu sjávarútsýni. Veldu milli klassískri eða símalausri sánu.

4. SÚLD: Finndu endurnýjaða orku með frískandi köldum úða (5°C) sem kælir húðina þína.

5. MÝKT: Notaðu okkar sérstaka skrúbb með möndlu- og sesamolíum til að endurnýja húðina þína.

6. GUFA: Farðu inn í gufubaðið okkar (46°C) þar sem rakinn hjálpar húðinni að drekka í sig ávinning líkamsskrúbbsins.

7. SAFT: Ljúktu ferðalaginu þínu með smakki af íslenska krækiberjadrykk.

Allt ritúalið tekur venjulega um 45 mínútur, en þér er velkomið að taka þér góðan tíma í hvert skref. Eitt ferðalag í gegnum öll sjö skrefin er innifalið í hverri heimsókn í Sky Lagoon.
`.trim();

  // Only return if we have actual content
  if (content) {
    return {
      content,
      metadata: {
        language: 'is',
        type: 'ritual',
        section: 'comprehensive',
        priority: 'high',
        keywords: 'ritúal, skjol, skjól, skref, sjö skref, vellíðun, baðmenning, ferli, laug, kuldi, ylur, súld, mýkt, gufa, saft'
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
    console.log('Starting comprehensive extraction from Icelandic knowledge base...');
    
    // Get regular chunks from knowledge base
    const baseChunks = await extractTextChunks();
    
    // Add critical information chunks
    const criticalChunks = addCriticalInformationChunks();
    
    // Combine all chunks
    const allChunks = [...baseChunks, ...criticalChunks];
    
    console.log(`Extracted ${allChunks.length} chunks from the Icelandic knowledge base`);
    console.log(`Average chunk length: ${Math.round(allChunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / allChunks.length)} characters`);
    
    // Store embeddings
    console.log(`Storing ${allChunks.length} embeddings in the database...`);
    await bulkStoreEmbeddings(allChunks, 'is');
    console.log('Successfully stored all Icelandic embeddings!');
  } catch (error) {
    console.error('Error populating Icelandic embeddings:', error);
  }
}

// Run the population process
populateEmbeddings();