import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // MongoDB Connection
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected...");
  } catch (error) {
    console.error("MongoDB connection error :", error);
  }
};
