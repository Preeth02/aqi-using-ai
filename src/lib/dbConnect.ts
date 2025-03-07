import mongoose from "mongoose";

type connectionObject = {
  isConnected?: number;
};

const connection: connectionObject = {};

async function connectDB(): Promise<void> {
  if (connection.isConnected) {
    console.log("Already connected to the database");
    return;
  }
  try {
    const db = await mongoose.connect(process.env.MONGODB_URL || "");
    // console.log("DB:...............", db);
    // console.log("DB connections:...............", db.connections);
    connection.isConnected = db.connections[0].readyState;
  } catch (error) {
    console.log("Database connection failed", error);
    process.exit(1);
  }
}

export default connectDB;