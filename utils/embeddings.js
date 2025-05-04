// utils/embeddings.js
import pg from 'pg';
const { Pool } = pg;
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Global embedding cache shared across all sessions
if (!global.embeddingsCache) {
  global.embeddingsCache = {
    cache: new Map(),
    TTL: 7 * 24 * 60 * 60 * 1000, // 7 days
    MAX_SIZE: 2000
  };
  
  console.log('🌐 Initialized global embeddings caching system');
}

// Use global embedding cache
const embeddingsCache = global.embeddingsCache.cache;
const EMBEDDINGS_CACHE_TTL = global.embeddingsCache.TTL;
const EMBEDDINGS_CACHE_MAX_SIZE = global.embeddingsCache.MAX_SIZE;

// Helper function to create normalized cache keys
function createEmbeddingsCacheKey(query, limit, threshold, language) {
  // Normalize the query by removing punctuation, excess whitespace, and converting to lowercase
  const normalizedQuery = query.toLowerCase()
    .replace(/[^\w\s?]/g, '') // Remove punctuation except question marks
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
  
  return `${normalizedQuery}:${language}:${limit}:${threshold}`;
}

// Cleanup function for embeddings cache
function cleanupEmbeddingsCache() {
  if (embeddingsCache.size > EMBEDDINGS_CACHE_MAX_SIZE) {
    console.log(`Cleaning embeddings cache (${embeddingsCache.size} entries)`);
    const now = Date.now();
    
    // First remove expired entries
    let expiredCount = 0;
    for (const [key, entry] of embeddingsCache.entries()) {
      if (now - entry.timestamp > EMBEDDINGS_CACHE_TTL) {
        embeddingsCache.delete(key);
        expiredCount++;
      }
    }
    
    // If still too large, remove oldest entries
    if (embeddingsCache.size > EMBEDDINGS_CACHE_MAX_SIZE - 500) {
      const entries = [...embeddingsCache.entries()];
      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest entries
      let oldestRemoved = 0;
      for (let i = 0; i < 500 && i < entries.length; i++) {
        embeddingsCache.delete(entries[i][0]);
        oldestRemoved++;
      }
      
      console.log(`Removed ${expiredCount} expired and ${oldestRemoved} oldest embeddings cache entries`);
    }
  }
}

// Run embeddings cache cleanup every 12 hours
setInterval(cleanupEmbeddingsCache, 12 * 60 * 60 * 1000);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Generate an embedding for a text using OpenAI
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector
 */
export async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Store a text and its embedding in the database
 * @param {string} content - Text content
 * @param {Object} metadata - Additional metadata
 * @param {string} language - 'en' or 'is'
 * @returns {Promise<Object>} - Result of the insertion
 */
export async function storeEmbedding(content, metadata = {}, language = 'en') {
  try {
    const embedding = await generateEmbedding(content);
    const client = await pool.connect();
    
    try {
      // Format the embedding array as a string
      const embeddingString = `[${embedding.join(',')}]`;
      
      // Choose the correct table based on language
      const tableName = language === 'is' ? 'knowledge_embeddings_is' : 'knowledge_embeddings_en';
      
      const result = await client.query(
        `INSERT INTO ${tableName} (content, metadata, embedding) VALUES ($1, $2, $3::vector) RETURNING id`,
        [content, metadata, embeddingString]
      );
      
      return {
        id: result.rows[0].id,
        content,
        metadata
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error storing embedding:', error);
    throw error;
  }
}

/**
 * Search for similar content based on a query with caching
 * @param {string} query - Query text
 * @param {number} limit - Maximum number of results
 * @param {number} similarityThreshold - Minimum similarity score (0-1)
 * @param {string} language - 'en' or 'is'
 * @returns {Promise<Array>} - Array of matching results
 */
export async function searchSimilarContent(query, limit = 5, similarityThreshold = 0.6, language = 'en') {
  try {
    // Check cache first
    const cacheKey = createEmbeddingsCacheKey(query, limit, similarityThreshold, language);
    
    if (embeddingsCache.has(cacheKey)) {
      const cached = embeddingsCache.get(cacheKey);
      
      // Check if cache entry is still valid
      if (Date.now() - cached.timestamp < EMBEDDINGS_CACHE_TTL) {
        console.log(`📦 Using cached embeddings results for: "${query}"`);
        return cached.results;
      } else {
        // Expired entry, remove it
        embeddingsCache.delete(cacheKey);
      }
    }
    
    // Cache miss - proceed with database query
    const queryEmbedding = await generateEmbedding(query);
    const client = await pool.connect();
    
    try {
      // Format the embedding array as a string
      const embeddingString = `[${queryEmbedding.join(',')}]`;
      
      // Choose the correct table based on language
      const tableName = language === 'is' ? 'knowledge_embeddings_is' : 'knowledge_embeddings_en';
      
      const result = await client.query(
        `SELECT id, content, metadata, 
         1 - (embedding <=> $1::vector) AS similarity
         FROM ${tableName}
         WHERE 1 - (embedding <=> $1::vector) > $3
         ORDER BY similarity DESC
         LIMIT $2`,
        [embeddingString, limit, similarityThreshold]
      );
      
      // Cache the results
      embeddingsCache.set(cacheKey, {
        results: result.rows,
        timestamp: Date.now()
      });
      
      // Check if cache is getting too large
      if (embeddingsCache.size > EMBEDDINGS_CACHE_MAX_SIZE) {
        cleanupEmbeddingsCache();
      }
      
      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error searching similar content:', error);
    return []; // Return empty array in case of error
  }
}

/**
 * Bulk store multiple entries with their embeddings
 * @param {Array<Object>} entries - Array of {content, metadata} objects
 * @param {string} language - 'en' or 'is'
 * @returns {Promise<Array>} - Result of the insertions
 */
export async function bulkStoreEmbeddings(entries, language = 'en') {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Choose the correct table based on language
    const tableName = language === 'is' ? 'knowledge_embeddings_is' : 'knowledge_embeddings_en';
    
    const results = [];
    for (const entry of entries) {
      const embedding = await generateEmbedding(entry.content);
      
      // Format the embedding array as a string
      const embeddingString = `[${embedding.join(',')}]`;
      
      const result = await client.query(
        `INSERT INTO ${tableName} (content, metadata, embedding) VALUES ($1, $2, $3::vector) RETURNING id`,
        [entry.content, entry.metadata || {}, embeddingString]
      );
      
      results.push({
        id: result.rows[0].id,
        content: entry.content,
        metadata: entry.metadata
      });
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error bulk storing embeddings:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Export all functions
export default {
  generateEmbedding,
  storeEmbedding,
  searchSimilarContent,
  bulkStoreEmbeddings,
};
