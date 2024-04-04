//This will change the daily game to a new value every midnight EST
//Starting mongo
/*
const { MongoClient, Timestamp } = require("mongodb");
let ObjectId = require("mongodb").ObjectId;
const mongoClient = new MongoClient(process.env.mongoDB);
*/
const bcrypt = require("bcryptjs");
const uniqid = require("uniqid");
const crypto = require("crypto");
const nodeCron = require("node-cron");

function scheduledTasks(app, mongoClient) {
  //Used to create the daily game every day at midnight EST
  let createDailyGames = nodeCron.schedule(
    `0 0 * * *`,
    async () => {
      const dbDailyGames = mongoClient.db("DailyGames");
      let dailyGames = dbDailyGames.collection(`DailyGames`);
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      function generateString(length) {
        let result = "";
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
          result += characters.charAt(
            Math.floor(
              (characters.length * crypto.getRandomValues(new Uint32Array(1))) /
                Math.pow(2, 32)
            )
          );
        }
        return result;
      }
      let date = new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
      });
      for (let i = 2; i <= 7; i++) {
        let targetNumber = Math.floor(
          Math.random() * Math.pow(10, i)
        ).toString();
        while (targetNumber.length < i) {
          targetNumber = "0" + targetNumber;
        }

        let todaysGame = await dailyGames.findOne({ digits: i });
        let oldGames = dbDailyGames.collection(`OldGames-` + i);
        if (todaysGame) {
          await oldGames.insertOne({
            digits: todaysGame.digits,
            targetNumber: todaysGame.targetNumber,
            gameId: todaysGame.gameId,
            date: date,
          });

          let oldGameIdNumber = todaysGame.gameId.slice(
            todaysGame.gameId.length - 5,
            todaysGame.gameId.length
          );
          let newGameIdNumber = Number(oldGameIdNumber) + 1;
          while (newGameIdNumber.toString().length < 5) {
            newGameIdNumber = "0" + newGameIdNumber;
          }
          let newGameId = i + generateString(6) + newGameIdNumber;

          await dailyGames.updateOne(
            { digits: i },
            {
              $set: {
                digits: i,
                targetNumber: targetNumber,
                gameId: newGameId,
                date: date,
              },
            }
          );
        } else {
          await dailyGames.insertOne({
            digits: i,
            targetNumber: targetNumber,
            gameId: i + generateString(6) + `00001`,
          });
        }
      }
    },
    {
      scheduled: true,
      timezone: "America/New_York",
    }
  );
  createDailyGames.start();

  //Updates the leaderboards for each random category on an hourly basis
  let updateLeaderboards = nodeCron.schedule(
    `*/5 * * * *`,
    async () => {
      const accountsDb = mongoClient.db("Accounts");
      let accounts = accountsDb.collection(`Accounts`);
      let inactives = accountsDb.collection(`Inactive`);
      let premiumAccounts = await accounts
        .find({ $and: [{ premium: true }, { shadowbanned: false }] })
        .toArray();
      let premiumInactives = await inactives
        .find({ $and: [{ premium: true }, { shadowbanned: false }] })
        .toArray();
      const leaderboardsDb = mongoClient.db("Leaderboards");

      let todaysDate = new Date();
      let todaysTime = todaysDate.getTime();

      for (let digits = 2; digits <= 7; digits++) {
        let eligibleAccounts = [];
        premiumAccounts.forEach((x) => {
          try {
            let oldestDate = new Date(
              x[digits + `random-scores`].average30.date
            );
            if (
              x[digits + `random-scores`].average30.numberOfGames == 30 &&
              todaysTime - oldestDate.getTime() <= 1000 * 60 * 60 * 24 * 30
            ) {
              eligibleAccounts.push(x);
            } else {
            }
          } catch {}
        });
        premiumInactives.forEach((x) => {
          try {
            let oldestDate = new Date(
              x[digits + `random-scores`].average30.date
            );
            if (
              x[digits + `random-scores`].average30.numberOfGames == 30 &&
              todaysTime - oldestDate.getTime() <= 1000 * 60 * 60 * 24 * 30
            ) {
              eligibleAccounts.push(x);
            } else {
            }
          } catch {}
        });
        //This is assuming there will always be at least 2 accounts
        eligibleAccounts = eligibleAccounts.sort(function (a, b) {
          return (
            a[digits + `random-scores`].average30.average -
            b[digits + `random-scores`].average30.average
          );
        });

        let leaderboard = leaderboardsDb.collection("Leaderboard-" + digits);

        await leaderboard.deleteMany({});

        let numberOfEntries = Math.min(50, eligibleAccounts.length);
        let currentAccount = eligibleAccounts[0];

        let leaderboardEntries = [];
        for (let i = 0; i < numberOfEntries; i++) {
          let currentAccount = eligibleAccounts[i];
          let leaderboardEntry = {
            userId: currentAccount._id,
            strikes: currentAccount.accountStrikes,
            rank: i + 1,
            username: currentAccount.username,
            average: currentAccount[digits + `random-scores`].average30.average,
          };
          leaderboardEntries.push(leaderboardEntry);
          //await leaderboard.insertOne(leaderboardEntry);
        }
        await leaderboard.insertMany(leaderboardEntries);
      }
    },
    {
      scheduled: true,
      timezone: "America/New_York",
    }
  );

  updateLeaderboards.start();

  //Removes all accounts that haven't been active in the past day and moves them to Inactive so they don't dillute the session queries
  //let moveInactiveAccounts = nodeCron.schedule(`0 1 * * *`, async () => {
  let moveInactiveAccounts = nodeCron.schedule(
    `*/3 * * * *`,
    async () => {
      const accountsDb = mongoClient.db("Accounts");
      let accounts = accountsDb.collection(`Accounts`);
      let inactives = accountsDb.collection(`Inactive`);
      let allAccounts = await accounts.find().toArray();
      const currentDate = new Date();
      const currentTime = currentDate.getTime();
      for (const x of allAccounts) {
        try {
          if (currentTime - x.lastGameDate.getTime() > 86400000) {
            // Step 1: Start a Client Session
            const session = mongoClient.startSession();
            try {
              //Step 2: Perform transactions
              await session.withTransaction(async () => {
                await inactives.insertOne(x, { session });
                await accounts.deleteOne({ _id: x._id }, { session });
              }, {});
            } finally {
              //Step 3: End the session
              await session.endSession();
            }
          }
        } catch {}
      }
    },
    {
      scheduled: true,
      timezone: "America/New_York",
    }
  );

  moveInactiveAccounts.start();
}

module.exports = { scheduledTasks };
