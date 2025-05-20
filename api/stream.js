// api/stream.js
export const config = { runtime: 'edge' };

export default async (req) => {
  // Create a reusable corsHeaders object to ensure consistency
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
    'Access-Control-Max-Age': '86400'
  };

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // 1. Auth + Validation
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders  // IMPORTANT: Include CORS headers
      }
    });
  }
  
  if (req.headers.get('x-api-key') !== process.env.API_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders  // IMPORTANT: Include CORS headers
      }
    });
  }
  
  // 2. Proxy to Express (streaming)
  try {
    const body = await req.text();
    const bodyObj = JSON.parse(body);
    
    // Add streaming flag to body
    const enhancedBody = JSON.stringify({
      ...bodyObj, 
      _streamRequest: true
    });
    
    console.log("Proxying to backend with body:", enhancedBody.substring(0, 100));
    
    const expressRes = await fetch(`${process.env.BASE_URL || 'https://sky-lagoon-chat-2024.vercel.app'}/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': req.headers.get('x-api-key')
      },
      body: enhancedBody
    });
    
    // 3. Stream response (SSE)
    return new Response(expressRes.body, {
      headers: { 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...corsHeaders  // IMPORTANT: Include CORS headers
      }
    });
  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders  // IMPORTANT: Include CORS headers
      }
    });
  }
};