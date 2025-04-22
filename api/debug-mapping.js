export default async function handler(req, res) {
  try {
    // Get MongoDB connection from your database.js file
    const { db } = await connectToDatabase();
    
    // Find all mappings
    const mappings = await db.collection('livechat_mappings').find({}).toArray();
    
    return res.status(200).json({
      success: true,
      count: mappings.length,
      mappings: mappings
    });
  } catch (error) {
    console.error('Debug mapping error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}