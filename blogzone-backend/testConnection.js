require('dotenv').config();
const { connectToDatabase, closeConnection } = require('./db');

async function test() {
  try {
    const db = await connectToDatabase();
    
    // List collections to verify connection
    const collections = await db.listCollections().toArray();
    console.log('Collections in blogzone database:', collections);
    
    // Try a simple insert
    const testCollection = db.collection('testConnection');
    await testCollection.insertOne({ test: new Date() });
    console.log('Test document inserted successfully');
    
    // Clean up
    await testCollection.deleteMany({});
  } catch (error) {
    console.error('Connection test failed:', error);
  } finally {
    await closeConnection();
  }
}

test();