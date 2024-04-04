const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser"); //Converts forms to JSON
require("dotenv").config({ path: ".env" }); //Imports .env file
const app = express();
const bcrypt = require("bcryptjs");
const uniqid = require("uniqid");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

//Starting mongo
const { MongoClient, Timestamp } = require("mongodb");
let ObjectId = require("mongodb").ObjectId;
const mongoClient = new MongoClient(process.env.mongoDB, {maxPoolSize: 500});
async function connectMongo() {
  await mongoClient.connect();
}
connectMongo();

//Cookies
var cookieParser = require("cookie-parser");
app.use(cookieParser());

//Body Parser
//app.use(bodyParser.json());
app.use((req, res, next) => {
  if (req.originalUrl === "/complete-premium-purchase") {
    next(); // Do nothing with the body because I need it in a raw state.
  } else {
    bodyParser.json()(req, res, next); // ONLY do express.json() if the received request is NOT a WebHook from Stripe.
  }
});
app.use(bodyParser.urlencoded({ extended: false }));

//Cors Options
const corsOptions = {
  option: "*",
  //origin: true,
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

//Error Handler
let errorhandler = require("errorhandler");
if (process.env.NODE_ENV === "development") {
  // only use in development
  app.use(errorhandler());
}

//Compression
const compression = require("compression");
app.use(compression());

//Helmet Antihack
const helmet = require("helmet");
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src": ["'self'", "code.jquery.com", "cdn.jsdelivr.net"],
      "img-src": ["'self'", "https: data: blob:"],
    },
  })
);

// Rate limiter: maximum of six hundred requests per minute
const RateLimit = require("express-rate-limit");
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 60 seconds
  max: 600,
});
app.use(limiter);

//Authentication  (now in account requests)
/*
const passport = require("passport");
const session = require('express-session');
app.use(
  session({name:"session0", secret: process.env.sessionSecret, maxAge: 24 * 60 * 60 * 100,})
);
app.use(passport.initialize());
app.use(passport.session());

//Local Strategy
const LocalStrategy = require("passport-local").Strategy;

//Google Authentication
let GoogleStrategy = require('passport-google-oauth20');
let Google_Client_Id = process.env.googleClientId;
let Google_Client_Secret = process.env.googleClientSecret;
*/

//Launch the Server
const port = process.env.PORT || 5000;

//Socket.IO
const server = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

server.listen(port);

//Scheduled Tasks
let scheduledTasks = require("./scheduledTasks.js");
scheduledTasks.scheduledTasks(app, mongoClient);

//////////////////////////////////////////////////////////////////////////////////
//Requests

let accountRequests = require("./requests/accountRequests.js");
accountRequests.accountRequests(app, mongoClient);

let profileRequests = require("./requests/profileRequests.js");
profileRequests.profileRequests(app, mongoClient);

let gameRequests = require("./requests/gameRequests.js");
gameRequests.gameRequests(app, mongoClient);

let leaderboardRequests = require("./requests/leaderboardRequests.js");
leaderboardRequests.leaderboardRequests(app, mongoClient);

let visitorCounterRequests = require("./requests/visitorCounterRequests.js");
visitorCounterRequests.visitorCounterRequests(app, mongoClient);

let paymentRequests = require("./requests/paymentRequests.js");
paymentRequests.paymentRequests(app, bodyParser, mongoClient);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, "client/build")));

// Handles any requests that don't match the ones above
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/client/build/index.html"));
});

// handles % errors
app.use((err, req, res, next) => {
  if (!err) return next();
  res.redirect("/");
});

// Export the MongoClient instance
module.exports = { mongoClient };