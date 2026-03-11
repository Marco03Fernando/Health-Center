const session = require("express-session");
const { create } = require("connect-mongo"); // Destructure the create function

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "your_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,  // 1 day session lifetime
    secure: process.env.NODE_ENV === "production", // Secure cookies for HTTPS
    httpOnly: true,  // Helps prevent XSS attacks
    sameSite: "strict", // Helps prevent CSRF attacks
  },
  store: create({  // Use the destructured `create()` function for v6.x.x
    mongoUrl: process.env.MONGO_URI,  // MongoDB URI for storing sessions
    collectionName: "sessions",  // Store sessions in the "sessions" collection
  }),
});

module.exports = sessionMiddleware;