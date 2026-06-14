import mongoose from "mongoose";
import { env } from "../config/env";

/**
 * Connects to the MongoDB database using Mongoose.
 */
export async function connectMongoDB() {
  const uri = (env as any).MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  try {
    mongoose.connection.on("connected", () => {
      console.log("Mongoose connected to MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("Mongoose disconnected from MongoDB");
    });

    // Auto-create indexes in development or test, disable in production for performance
    const autoIndex = process.env.NODE_ENV !== "production";

    await mongoose.connect(uri, {
      autoIndex,
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

/**
 * Disconnects from the MongoDB database.
 */
export async function disconnectMongoDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
