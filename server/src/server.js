require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 8081;

(async () => {
   try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
 } catch (error) {
    console.error("Startup error:", error.message);
    process.exit(1);
 }

}) ();