require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in server/.env");
  }

  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGO_DB_NAME,
  });

  const Admin = require("../src/models/doctorChanneling/Admin/Admin");

  const email = "centeradmin@healthcenter.com".toLowerCase();
  const deleted = await Admin.deleteOne({ email });

  console.log("Deleted:", deleted);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});