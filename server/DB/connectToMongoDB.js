/**
 * MongoDB Connection Module
 * Handles database connection with proper error handling
 */

import mongoose from "mongoose";

const connectToMongoDB = async () => {
  try {
    // Attempt to connect using the connection string from env
    const connection = await mongoose.connect(process.env.MONGO_URI);

    console.log(`📦 MongoDB Connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit the process if we can't connect to the database
    process.exit(1);
  }
};

export default connectToMongoDB;
