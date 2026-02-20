const mongoose = require("mongoose");

module.exports = async function connectDB() {
   const uri = process.env.MONGO_URI;
   if (!uri) throw new Error("MOngo_URI is missing in .env file");

   await mongoose.connect(uri);
   console.log("MOngoDB connected");


}