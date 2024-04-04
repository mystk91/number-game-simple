//Requests related to displaying the leaderboard for the game
function leaderboardRequests(app, mongoClient) {
  const bcrypt = require("bcryptjs");
  const uniqid = require("uniqid");
  const crypto = require("crypto");
  //Starting mongo
  /*
  const { MongoClient, Timestamp } = require("mongodb");
  let ObjectId = require("mongodb").ObjectId;
  const mongoClient = new MongoClient(process.env.mongoDB);
  */

  app.get("/api/getLeaderboards", async (req, res, next) => {
    const db = mongoClient.db("Leaderboards");
    let allLeaderboards = {};
    try {
      for (let digits = 2; digits <= 7; digits++) {
        let leaderboard = await db
          .collection("Leaderboard-" + digits)
          .find()
          .toArray();
          leaderboard.forEach(x=>{ 
            delete x._id;
            delete x.userId;
            delete x.strikes;
          });
        allLeaderboards[`Leaderboard-` + digits] = leaderboard;
      }
      res.send(allLeaderboards);
    } catch {
      res.send({ error: true });
    }
  });
}

module.exports = { leaderboardRequests };
