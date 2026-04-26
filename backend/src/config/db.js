const mongoose = require("mongoose");

const { env } = require("./env");

let cachedConnection = null;
let cachedPromise = null;

const connectDatabase = async () => {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI is required to start the API.");
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  if (!cachedPromise) {
    // Serverless functions should reuse a small pool across warm invocations.
    cachedPromise = mongoose.connect(env.mongoUri, {
      maxPoolSize: 5,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
    });
  }

  cachedConnection = await cachedPromise;

  console.log("MongoDB connected");

  return cachedConnection;
};

module.exports = { connectDatabase };