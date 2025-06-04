const { MongoClient } = require('mongodb');
require('dotenv').config();

let db;
let client;

async function connectToDatabase() {
  if (db) return db;
  
  try {
    client = await MongoClient.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Adjust based on your needs
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
      socketTimeoutMS: 45000 // Close sockets after 45s of inactivity
    });
    
    db = client.db('blogzone'); // Explicitly specify the database name
    console.log('Successfully connected to MongoDB Atlas');
    
    // Verify connection by pinging the database
    await db.command({ ping: 1 });
    console.log('Database ping successful');
    
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB Atlas:', error);
    throw error;
  }
}

// Graceful shutdown handler
async function closeConnection() {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Close connection on process termination
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

module.exports = { connectToDatabase, closeConnection };