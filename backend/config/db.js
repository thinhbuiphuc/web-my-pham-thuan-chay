const mongoose = require("mongoose");

/**
 * Ket noi den MongoDB Atlas thong qua Mongoose.
 * Su dung trong server.js khi khoi dong ung dung.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Loi ket noi MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
