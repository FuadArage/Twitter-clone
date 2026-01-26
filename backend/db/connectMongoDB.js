import mongoose from "mongoose";

const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(`mongoDB connected:${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connection to mongoB:${error.message}`);
    process.exit(1);
  }
};

export default connectMongoDB;
