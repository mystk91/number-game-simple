//Requests that involve updating stats information about the site, such as visitor counts, game completes
//Also has admin functions
function visitorCounterRequests(app, mongoClient) {
  const bcrypt = require("bcryptjs");
  const uniqid = require("uniqid");
  const crypto = require("crypto");
  //Starting mongo
  /*
  const { MongoClient, Timestamp } = require("mongodb");
  let ObjectId = require("mongodb").ObjectId;
  const mongoClient = new MongoClient(process.env.mongoDB);
  */

  //Increments the visitor count when a new person visits the site without saved localstorage
  app.post("/api/add-visitor", async (req, res, next) => {
    const db = mongoClient.db("Website");
    let Stats = db.collection("Stats");
    Stats.updateOne({ title: "visitors" }, { $inc: { visitors: 1 } });
  });

  //Increments the total daily games played counter when a game is completed
  app.post("/api/update-game-count-daily", async (req, res, next) => {
    const db = mongoClient.db("Website");
    let Stats = db.collection("Stats");
    Stats.updateOne(
      { title: "gamesCompleted" },
      { $inc: { gamesCompleted: 1, dailyGamesCompleted: 1 } }
    );
  });

  //Increments the total random games played counter when a game is completed
  app.post("/api/update-game-count-random", async (req, res, next) => {
    const db = mongoClient.db("Website");
    let Stats = db.collection("Stats");
    Stats.updateOne(
      { title: "gamesCompleted" },
      { $inc: { gamesCompleted: 1, randomGamesCompleted: 1 } }
    );
  });

  //Increments the number of users that have purchase premium
  app.post("/api/add-premium-user", async (req, res, next) => {
    const db = mongoClient.db("Website");
    let Stats = db.collection("Stats");
    Stats.updateOne({ title: "visitors" }, { $inc: { premiumUsers: 1 } });
  });

}

module.exports = { visitorCounterRequests };
