import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  }
});

let dbInstance = null;

const connectDB = async () => {
  try {
    // Connect the client to the server
    console.log("Mongo URI:", process.env.MONGODB_URI);

    await client.connect();
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    
    // Store the database instance
    dbInstance = client.db('recipe_app');
    
    return dbInstance;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Get database instance
export const getDB = () => {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }
  return dbInstance;
};

// Get MongoDB client
export const getClient = () => client;

export default connectDB; 