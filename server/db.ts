import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL || process.env.DATABASE_URL;

if (!MONGODB_URL) {
  throw new Error(
    "MONGODB_URL or DATABASE_URL must be set. Did you forget to add your MongoDB connection string?",
  );
}

export async function connectDB() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URL as string);
      console.log("MongoDB connected successfully");
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

export { mongoose };
