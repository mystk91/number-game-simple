const { error } = require("console");
const { inflateSync } = require("zlib");

//Requests related to maintaining game state
function gameRequests(app, mongoClient) {
  const bcrypt = require("bcryptjs");
  const uniqid = require("uniqid");
  const crypto = require("crypto");
  //Starting mongo
  /*
  const { MongoClient, Timestamp } = require("mongodb");
  let ObjectId = require("mongodb").ObjectId;
  const mongoClient = new MongoClient(process.env.mongoDB);
  */

  //Gets the users account, moves it from inactive to Accounts if they've been inactive
  async function getAccount(field, value) {
    const db = mongoClient.db("Accounts");
    let accounts = db.collection("Accounts");
    try {
      let account = await accounts.findOne({ [field]: value });
      if (account) {
        return account;
      } else {
        let inactives = db.collection("Inactive");
        account = await inactives.findOne({ [field]: value });
        if (account) {
          account.lastGameDate = new Date();
          let success = false;
          // Step 1: Start a Client Session
          const session = mongoClient.startSession();
          try {
            //Step 2: Perform transactions
            await session.withTransaction(async () => {
              let insertOperation = await accounts.insertOne(account, {
                session,
              });
              let deleteOperation = await inactives.deleteOne(
                { [field]: value },
                { session }
              );
              if (insertOperation && deleteOperation) {
                success = true;
              }
            }, {});
          } finally {
            //Step 3: End the session
            await session.endSession();
          }
          if (success) {
            return account;
          } else {
            return null;
          }
        } else {
          return null;
        }
      }
    } catch {
      return null;
    }
  }

  //Returns the gameboard saved to the user in the database. RANDOM
  async function getCurrentGameRandom(req, res, next) {
    try {
      //const db = mongoClient.db("Accounts");
      //let accounts = db.collection("Accounts");
      //let account = await accounts.findOne({ session: req.body.session });
      let account = await getAccount("session", req.body.session);

      let randomGameString = req.body.digits + "random";
      //Checks if user actually has random mode / premium
      if (account.premium) {
        if (!account[randomGameString]) {
          resetGameRandom(req, res, next);
        } else {
          if (account[randomGameString].status == "playing") {
            res.send({
              gameObj: {
                board: account[randomGameString].board,
                currentRow: account[randomGameString].currentRow,
                hints: account[randomGameString].hints,
                status: account[randomGameString].status,
              },
            });
          } else {
            res.send({
              gameObj: {
                board: account[randomGameString].board,
                currentRow: account[randomGameString].currentRow,
                hints: account[randomGameString].hints,
                status: account[randomGameString].status,
                targetNumber: account[randomGameString].targetNumber,
              },
              scoresObj: {
                average: account[randomGameString + `-scores`].average,
                average30: account[randomGameString + `-scores`].average30,
                scores: account[randomGameString + `-scores`].scores,
                scores30: account[randomGameString + `-scores`].scores30,
              },
            });
          }
        }
      } else {
        res.redirect("/login");
      }
    } catch {
      res.redirect("/login");
    }
  }

  //Resets the gameboard and starts a new one save to the user in the database. RANDOM
  async function resetGameRandom(req, res, next) {
    try {
      //console.log("starting to reset your game");
      const db = mongoClient.db("Accounts");
      let accounts = db.collection("Accounts");
      //let account = await accounts.findOne({ session: req.body.session });
      let account = await getAccount("session", req.body.session);

      //Checks if user actually has random mode / premium
      if (account.premium) {
        let randomGameString = req.body.digits + "random";
        let condition = false;
        if (account[randomGameString]) {
          if (account[randomGameString].status != "playing") {
            condition = true;
          }
        } else {
          condition = true;
        }

        if (condition) {
          let targetNumber = Math.floor(
            Math.random() * Math.pow(10, req.body.digits)
          ).toString();
          while (targetNumber.length < req.body.digits) {
            targetNumber = "0" + targetNumber;
          }
          //Sets up the board
          let props = {
            attempts: 6,
          };
          let board = new Array(6);
          for (let i = 0; i < 6; i++) {
            board[i] = "";
          }
          //Sets up the hints
          let hintsArr = new Array(6);
          for (let i = 0; i < 6; i++) {
            hintsArr[i] = "";
          }

          let randomGameObj = {
            board: board,
            currentRow: 0,
            hints: hintsArr,
            status: "playing",
            targetNumber: targetNumber,
          };

          //console.log(randomGameObj);

          let randomGameString = req.body.digits + "random";
          await accounts.updateOne(
            { session: req.body.session },
            {
              $set: {
                [randomGameString]: randomGameObj,
              },
            }
          );

          let gameObj = {
            board: board,
            currentRow: 0,
            hints: hintsArr,
            status: "playing",
          };
          let resObj = {
            gameObj: gameObj,
          };
          //console.log("reseting the game");

          res.send(resObj);
        } else {
          getCurrentGameRandom(req, res, next);
        }
      } else {
        res.redirect("/login");
      }
    } catch {
      //console.log(error);
      res.redirect("/login");
    }
  }

  //Checks to see if guess has a valid number of digits and characters
  //Returns true in the number is valid, otherwise will refresh the page
  function numberValidation(number, digits) {
    try {
      if (
        isFinite(number) &&
        number.length == digits &&
        digits >= 2 &&
        digits <= 7
      ) {
        return true;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }

  //Checks a guess for the random vesion of the game. RANDOM
  async function checkGuessRandom(req, res, next) {
    try {
      const db = mongoClient.db("Accounts");
      let accounts = db.collection("Accounts");
      //let account = await accounts.findOne({ session: req.body.session });

      let account = await getAccount("session", req.body.session);

      //Checks if user actually has random mode / premium
      if (account.premium) {
        let randomGameString = req.body.digits + "random";
        let validateNumber = numberValidation(req.body.number, req.body.digits);
        if (!validateNumber) {
          res.send({
            error: true,
          });
        }
        //Checks if user is still playing the game, this can be relevant with multiple windows open
        else if (account[randomGameString].status !== "playing") {
          res.send({
            gameObj: account[randomGameString],
            scoresObj: account[`${randomGameString}-scores`],
          });
        } else {
          function checkNumber(number) {
            let result = "";
            //Compares the number with target number and creates color hints for it
            let target = account[randomGameString].targetNumber;
            let tempTarget = "";
            for (let i = 0; i < req.body.digits; i++) {
              if (number[i] === target[i]) {
                tempTarget += "G";
              } else {
                tempTarget += target[i];
              }
            }
            for (let i = 0; i < req.body.digits; i++) {
              if (tempTarget[i] === "G") {
                result += "G";
              } else if (tempTarget.includes(number[i])) {
                result += "Y";
              } else {
                result += "X";
              }
            }
            //Compares the number with target number numerically and creates a hint
            target = Number(target);
            number = Number(number);
            if (number > target) {
              result += "L";
            } else if (number < target) {
              result += "H";
            } else if (number === target) {
              result += "E";
            }
            return result;
          }

          let boardCopy = [];
          Object.values(account[randomGameString].board).forEach((x) => {
            boardCopy.push(x);
          });
          boardCopy[account[randomGameString].currentRow] = req.body.number;

          let result = checkNumber(req.body.number);
          let hintsCopy = [];
          Object.values(account[randomGameString].hints).forEach((x) => {
            hintsCopy.push(x);
          });
          hintsCopy[account[randomGameString].currentRow] = result;

          let currentRow = account[randomGameString].currentRow + 1;

          let randomGameObj = {
            board: boardCopy,
            currentRow: currentRow,
            hints: hintsCopy,
            status: "playing",
          };

          let randomGameTargetObj = {
            board: boardCopy,
            currentRow: currentRow,
            hints: hintsCopy,
            status: "playing",
            targetNumber: account[randomGameString].targetNumber,
          };

          //console.log(randomGameTargetObj);

          //Adds a score to the users database entry. Keeps track past 30 scores and 1k scores
          //Returns an object containing the scores/averages that need to be updated in the DB
          // score - the score player recieved for that game
          // account - the users account that was retrieved from the DB
          async function updateScores(score, account) {
            //This updates the games completed stat
            try {
              const webDb = mongoClient.db("Website");
              let stats = webDb.collection("Stats");
              await stats.updateOne(
                { title: "gamesCompleted" },
                {
                  $inc: {
                    gamesCompleted: 1,
                    randomGamesCompleted: 1,
                    [`random${req.body.digits}-games`]: 1,
                    [`random${req.body.digits}-scoresTotal`]: score,
                  },
                }
              );
            } catch {}

            let currentDate = new Date();

            let scoresObjDb = account[randomGameString + `-scores`];
            let scores30;
            let best30;
            if (scoresObjDb) {
              scores30 = scoresObjDb.scores30;
              best30 = scoresObjDb.best30;
              while (
                currentDate.getTime() - scores30[0].date.getTime() >
                2592000000
              ) {
                scores30.shift();
              }
              if (scores30.length >= 30) {
                scores30.shift();
              }
            } else {
              scores30 = [];
              best30 = { average: 8, date: currentDate, scores: [] };
            }

            let scores30entry = {
              score: score,
              date: currentDate,
            };
            scores30.push(scores30entry);

            let average30 =
              scores30.reduce((total, x) => {
                return total + x.score;
              }, 0) / scores30.length;

            if (scores30.length == 30) {
              if (average30 < best30.average) {
                best30.average = average30;
                best30.date = currentDate;
                best30.scores = scores30;
              }
            }

            let average30obj = {
              average: average30,
              numberOfGames: scores30.length,
              date: scores30[0].date,
            };

            let scores;
            if (scoresObjDb) {
              scores = scoresObjDb.scores;
            }
            if (!scores) {
              scores = [];
            }
            while (scores.length > 999) {
              scores.shift();
            }
            scores.push(score);
            let average =
              scores.reduce((total, x) => {
                return total + x;
              }, 0) / scores.length;

            let scoresObj = {
              average: average,
              average30: average30obj,
              scores: scores,
              scores30: scores30,
              best30: best30,
            };

            return scoresObj;
          }

          let correctResult = "";
          for (let i = 0; i < req.body.digits; i++) {
            correctResult += "G";
          }
          correctResult += "E";

          if (result == correctResult) {
            randomGameTargetObj.status = "victory";
            let scoresObj = await updateScores(
              account[randomGameString].currentRow + 1,
              account
            );
            //console.log(scoresObj);

            await accounts.updateOne(
              { session: req.body.session },
              {
                $set: {
                  lastGameDate: new Date(),
                  [randomGameString]: randomGameTargetObj,
                  [randomGameString + `-scores`]: {
                    average: scoresObj.average,
                    average30: scoresObj.average30,
                    scores: scoresObj.scores,
                    scores30: scoresObj.scores30,
                    best30: scoresObj.best30,
                  },
                },
              }
            );

            res.send({
              gameObj: randomGameTargetObj,
              scoresObj: scoresObj,
            });
          } else if (currentRow == 6) {
            randomGameTargetObj.status = "defeat";
            let scoresObj = await updateScores(7, account);
            //console.log(scoresObj);
            await accounts.updateOne(
              { session: req.body.session },
              {
                $set: {
                  lastGameDate: new Date(),
                  [randomGameString]: randomGameTargetObj,
                  [randomGameString + `-scores`]: {
                    average: scoresObj.average,
                    average30: scoresObj.average30,
                    scores: scoresObj.scores,
                    scores30: scoresObj.scores30,
                    best30: scoresObj.best30,
                  },
                },
              }
            );

            res.send({
              gameObj: randomGameTargetObj,
              scoresObj: scoresObj,
            });
          } else {
            await accounts.updateOne(
              { session: req.body.session },
              { $set: { [randomGameString]: randomGameTargetObj } }
            );

            res.send({
              gameObj: randomGameObj,
            });
          }
        }
      } else {
        res.send({ error: true });
        //res.redirect("/login");
      }
    } catch {
      res.send({ error: true });
      //res.redirect("/login");
    }
  }

  //Returns the gameboard saved to the user in the database. REGULAR
  async function getCurrentGameRegular(req, res, next) {
    try {
      //const db = mongoClient.db("Accounts");
      //let accounts = db.collection("Accounts");
      //let account = await accounts.findOne({ session: req.body.session });
      let account = await getAccount("session", req.body.session);
      let regularGameString = req.body.digits + "digits";
      if (!account[regularGameString]) {
        resetGameRegular(req, res, next);
      } else {
        if (account[regularGameString].status == "playing") {
          if (account[regularGameString].board[0] == "") {
            resetGameRegular(req, res, next);
          } else {
            res.send({
              gameObj: {
                board: account[regularGameString].board,
                currentRow: account[regularGameString].currentRow,
                hints: account[regularGameString].hints,
                status: account[regularGameString].status,
              },
            });
          }
        } else {
          const dbDailyGames = mongoClient.db("DailyGames");
          let todaysGame = await dbDailyGames
            .collection("DailyGames")
            .findOne({ digits: req.body.digits });
          let nextGameAvailable = false;
          if (todaysGame.gameId != account[regularGameString].gameId) {
            nextGameAvailable = true;
          }
          /*
          console.log(
            "it is " + nextGameAvailable + " that the next game is available"
          );
          */
          if (req.body.firstCall && nextGameAvailable) {
            resetGameRegular(req, res, next);
          } else {
            //console.log(account[regularGameString].board);
            res.send({
              gameObj: {
                board: account[regularGameString].board,
                currentRow: account[regularGameString].currentRow,
                hints: account[regularGameString].hints,
                status: account[regularGameString].status,
                targetNumber: account[regularGameString].targetNumber,
                //gameId: account[gameString].gameId,
                nextGameAvailable: account[regularGameString].nextGameAvailable,
              },
              scoresObj: {
                average: account[regularGameString + `-scores`].average,
                average30: account[regularGameString + `-scores`].average30,
                scores: account[regularGameString + `-scores`].scores,
                scores30: account[regularGameString + `-scores`].scores30,
              },
            });
          }
        }
      }
    } catch {
      //console.log("error");
      res.redirect("/login");
    }
  }

  //Resets the gameboard and starts a new one save to the user in the database. REGULAR
  async function resetGameRegular(req, res, next) {
    try {
      //console.log("starting to reset your game");
      const db = mongoClient.db("Accounts");
      let accounts = db.collection("Accounts");
      //let account = await accounts.findOne({ session: req.body.session });
      let account = await getAccount("session", req.body.session);
      let gameString = req.body.digits + "digits";
      let condition = false;
      if (account[gameString]) {
        if (
          account[gameString].status != "playing" ||
          account[gameString].board[0] == ""
        ) {
          condition = true;
        }
      } else {
        condition = true;
      }

      if (condition) {
        const dbDailyGames = mongoClient.db("DailyGames");
        let todaysGame = await dbDailyGames
          .collection("DailyGames")
          .findOne({ digits: req.body.digits });

        //Sets up the board
        let props = {
          attempts: 6,
        };
        let board = new Array(6);
        for (let i = 0; i < 6; i++) {
          board[i] = "";
        }
        //Sets up the hints
        let hintsArr = new Array(6);
        for (let i = 0; i < 6; i++) {
          hintsArr[i] = "";
        }

        let regularGameObj = {
          board: board,
          currentRow: 0,
          hints: hintsArr,
          status: "playing",
          targetNumber: todaysGame.targetNumber,
          gameId: todaysGame.gameId,
          date: todaysGame.date,
        };

        //console.log(regularGameObj);

        let gameString = req.body.digits + "digits";
        await accounts.updateOne(
          { session: req.body.session },
          {
            $set: {
              [gameString]: regularGameObj,
            },
          }
        );

        let gameObj = {
          board: board,
          currentRow: 0,
          hints: hintsArr,
          status: "playing",
          date: regularGameObj.date,
        };
        let resObj = {
          gameObj: gameObj,
        };
        //console.log("reseting the game");

        res.send(resObj);
      } else {
        getCurrentGameRegular(req, res, next);
      }
    } catch {
      //console.log(error);
      res.redirect("/login");
    }
  }

  //Checks a guess for the regular vesion of the game. REGULAR
  async function checkGuessRegular(req, res, next) {
    try {
      const db = mongoClient.db("Accounts");
      let accounts = db.collection("Accounts");
      //let account = await accounts.findOne({ session: req.body.session });
      let account = await getAccount("session", req.body.session);
      let regularGameString = req.body.digits + "digits";
      let validateNumber = numberValidation(req.body.number, req.body.digits);
      if (!validateNumber) {
        res.send({
          error: true,
        });
      }
      //Checks if user is still playing the game, this can be relevant with multiple windows open
      else if (account[regularGameString].status !== "playing") {
        let gameObj = account[regularGameString];
        const dbDailyGames = mongoClient.db("DailyGames");
        let todaysGame = await dbDailyGames
          .collection("DailyGames")
          .findOne({ digits: req.body.digits });
        if (todaysGame.gameId != account[regularGameString].gameId) {
          gameObj.nextGameAvailable = true;
        }
        res.send({
          gameObj: gameObj,
          scoresObj: account[`${regularGameString}-scores`],
        });
      } else {
        function checkNumber(number) {
          let result = "";
          //Compares the number with target number and creates color hints for it
          let target = account[regularGameString].targetNumber;
          let tempTarget = "";
          for (let i = 0; i < req.body.digits; i++) {
            if (number[i] === target[i]) {
              tempTarget += "G";
            } else {
              tempTarget += target[i];
            }
          }
          for (let i = 0; i < req.body.digits; i++) {
            if (tempTarget[i] === "G") {
              result += "G";
            } else if (tempTarget.includes(number[i])) {
              result += "Y";
            } else {
              result += "X";
            }
          }
          //Compares the number with target number numerically and creates a hint
          target = Number(target);
          number = Number(number);
          if (number > target) {
            result += "L";
          } else if (number < target) {
            result += "H";
          } else if (number === target) {
            result += "E";
          }
          return result;
        }

        let boardCopy = [];
        Object.values(account[regularGameString].board).forEach((x) => {
          boardCopy.push(x);
        });
        boardCopy[account[regularGameString].currentRow] = req.body.number;

        let result = checkNumber(req.body.number);
        let hintsCopy = [];
        Object.values(account[regularGameString].hints).forEach((x) => {
          hintsCopy.push(x);
        });
        hintsCopy[account[regularGameString].currentRow] = result;

        let currentRow = account[regularGameString].currentRow + 1;

        let regularGameObj = {
          board: boardCopy,
          currentRow: currentRow,
          hints: hintsCopy,
          status: "playing",
        };

        let regularGameOverObj = {
          board: boardCopy,
          currentRow: currentRow,
          hints: hintsCopy,
          status: "playing",
          targetNumber: account[regularGameString].targetNumber,
          nextGameAvailable: false,
          gameId: account[regularGameString].gameId,
          date: account[regularGameString].date,
        };

        //console.log(regularGameOverObj);

        //Adds a score to the users database entry. Keeps track past 30 scores and 1k scores
        //Returns an object containing the scores/averages that need to be updated in the DB
        // score - the score player recieved for that game
        // account - the users account that was retrieved from the DB
        async function updateScores(score, account) {
          //This updates the games completed stat
          try {
            const webDb = mongoClient.db("Website");
            let stats = webDb.collection("Stats");
            await stats.updateOne(
              { title: "gamesCompleted" },
              {
                $inc: {
                  gamesCompleted: 1,
                  dailyGamesCompleted: 1,
                  [`daily${req.body.digits}-games`]: 1,
                },
              }
            );
          } catch {}

          let currentDate = new Date();

          let scoresObjDb = account[regularGameString + `-scores`];
          let scores30;
          if (scoresObjDb) {
            scores30 = scoresObjDb.scores30;
            if (scores30.length >= 30) {
              scores30.shift();
            }
          } else {
            scores30 = [];
          }

          let scores30entry = {
            score: score,
            date: currentDate,
          };
          scores30.push(scores30entry);

          let average30 =
            scores30.reduce((total, x) => {
              return total + x.score;
            }, 0) / scores30.length;

          let average30obj = {
            average: average30,
          };

          let scores;
          if (scoresObjDb) {
            scores = scoresObjDb.scores;
          }
          if (!scores) {
            scores = [];
          }
          while (scores.length > 999) {
            scores.shift();
          }
          scores.push(score);
          let average =
            scores.reduce((total, x) => {
              return total + x;
            }, 0) / scores.length;

          let scoresObj = {
            average: average,
            average30: average30obj,
            scores: scores,
            scores30: scores30,
          };

          return scoresObj;
        }

        let correctResult = "";
        for (let i = 0; i < req.body.digits; i++) {
          correctResult += "G";
        }
        correctResult += "E";

        if (result == correctResult) {
          regularGameOverObj.status = "victory";
          let scoresObj = await updateScores(
            account[regularGameString].currentRow + 1,
            account
          );
          //console.log(scoresObj);

          await accounts.updateOne(
            { session: req.body.session },
            {
              $set: {
                lastGameDate: new Date(),
                [regularGameString]: regularGameOverObj,
                [regularGameString + `-scores`]: {
                  average: scoresObj.average,
                  average30: scoresObj.average30,
                  scores: scoresObj.scores,
                  scores30: scoresObj.scores30,
                },
              },
            }
          );

          const dbDailyGames = mongoClient.db("DailyGames");
          let todaysGame = await dbDailyGames
            .collection("DailyGames")
            .findOne({ digits: req.body.digits });
          if (todaysGame.gameId != account[regularGameString].gameId) {
            regularGameOverObj.nextGameAvailable = true;
          }

          /*
          console.log(
            "it is " +
              regularGameOverObj.nextGameAvailable +
              " that the next game is available"
          );
          */

          res.send({
            gameObj: regularGameOverObj,
            scoresObj: scoresObj,
          });
        } else if (currentRow == 6) {
          regularGameOverObj.status = "defeat";
          let scoresObj = await updateScores(7, account);
          //console.log(scoresObj);
          await accounts.updateOne(
            { session: req.body.session },
            {
              $set: {
                lastGameDate: new Date(),
                [regularGameString]: regularGameOverObj,
                [regularGameString + `-scores`]: {
                  average: scoresObj.average,
                  average30: scoresObj.average30,
                  scores: scoresObj.scores,
                  scores30: scoresObj.scores30,
                },
              },
            }
          );

          const dbDailyGames = mongoClient.db("DailyGames");
          let todaysGame = await dbDailyGames
            .collection("DailyGames")
            .findOne({ digits: req.body.digits });
          if (todaysGame.gameId != account[regularGameString].gameId) {
            regularGameOverObj.nextGameAvailable = true;
          }

          res.send({
            gameObj: regularGameOverObj,
            scoresObj: scoresObj,
          });
        } else {
          await accounts.updateOne(
            { session: req.body.session },
            { $set: { [regularGameString]: regularGameOverObj } }
          );

          res.send({
            gameObj: regularGameObj,
          });
        }
      }
    } catch {
      //res.redirect("/login");
      res.send({ error: true });
    }
  }

  //Used by Local version of the game to see if its gameId matches the current one
  async function getGameId(req, res, next) {
    //console.log("getting todays game ID");
    const dbDailyGames = mongoClient.db("DailyGames");
    let todaysGame = await dbDailyGames
      .collection("DailyGames")
      .findOne({ digits: req.body.digits });
    res.send({ gameId: todaysGame.gameId });
    //console.log("it is " + todaysGame.gameId);
  }

  /*Used by Local version of the game to retreieve the gameId and its number,
    Will send back either today's game info or their current game's info */
  async function getLocalGame(req, res, next) {
    const dbDailyGames = mongoClient.db("DailyGames");
    let todaysGame = await dbDailyGames
      .collection("DailyGames")
      .findOne({ digits: req.body.digits });
    if (
      todaysGame.gameId === req.body.gameId ||
      !req.body.gameId ||
      req.body.gameStatus != "playing"
    ) {
      //console.log("getting todays game ID");
      //console.log("it is " + todaysGame.gameId);
      res.send({
        gameId: todaysGame.gameId,
        date: todaysGame.date,
        targetNumber: todaysGame.targetNumber,
      });
    } else {
      const dbDailyGames = mongoClient.db("DailyGames");
      let oldGame = await dbDailyGames
        .collection("OldGames-" + req.body.digits)
        .findOne({ gameId: req.body.gameId });
      if (oldGame) {
        //console.log("retreiving an old game");
        //console.log("it is " + oldGame.gameId);
        res.send({
          gameId: oldGame.gameId,
          date: todaysGame.date,
          targetNumber: oldGame.targetNumber,
        });
      } else {
        res.send({ error: true });
      }
    }
  }

  //Checks if the next game is availabe and adds game score to total site statistics
  async function gameOverLocal(req, res, next) {
    let nextGameAvailable = false;
    try {
      if (req.body.gameOver) {
        if (
          isFinite(req.body.digits) &&
          req.body.digits >= 2 &&
          req.body.digits <= 7
        ) {
          const webDb = mongoClient.db("Website");
          let stats = webDb.collection("Stats");
          await stats.updateOne(
            { title: "gamesCompleted" },
            {
              $inc: {
                gamesCompleted: 1,
                dailyGamesCompleted: 1,
                [`daily${req.body.digits}-games`]: 1,
              },
            }
          );
        }
      }
      const dbDailyGames = mongoClient.db("DailyGames");

      let todaysGame = await dbDailyGames
        .collection("DailyGames")
        .findOne({ gameId: req.body.gameId });
      if (!todaysGame) {
        nextGameAvailable = true;
      }
      res.send({ nextGameAvailable: nextGameAvailable });
    } catch {
      res.send({ nextGameAvailable: nextGameAvailable });
    }
  }

  //Checks a guess for the local vesion of the game. Local
  /*
  async function checkGuessLocal(req, res, next) {
    try {
      let validateNumber = numberValidation(req.body.number, req.body.digits);
      if (!validateNumber) {
        res.send({
          error: true,
        });
      } else {
        let regularGameString = req.body.digits + "digits";
        async function checkNumber(number) {
          let result = "";
          //Retreiving the target number, first looks it DailyGames DB, then old games
          let target;
          let date;
          let nextGameAvailable = false;
          const dbDailyGames = mongoClient.db("DailyGames");
          let todaysGame = await dbDailyGames
            .collection("DailyGames")
            .findOne({ gameId: req.body.gameId });
          if (todaysGame) {
            target = todaysGame.targetNumber;
            date = todaysGame.date;
          } else {
            const dbDailyGames = mongoClient.db("DailyGames");
            let oldGame = await dbDailyGames
              .collection("OldGames-" + req.body.digits)
              .findOne({ gameId: req.body.gameId });
            if (oldGame) {
              target = oldGame.targetNumber;
              date = oldGame.date;
              nextGameAvailable = true;
            } else {
              throw new Error();
            }
          }
          //Compares the number with target number and creates hints for it
          let tempTarget = "";
          for (let i = 0; i < req.body.digits; i++) {
            if (number[i] === target[i]) {
              tempTarget += "G";
            } else {
              tempTarget += target[i];
            }
          }
          for (let i = 0; i < req.body.digits; i++) {
            if (tempTarget[i] === "G") {
              result += "G";
            } else if (tempTarget.includes(number[i])) {
              result += "Y";
            } else {
              result += "X";
            }
          }
          //Compares the number with target number numerically and creates a hint
          let targetNum = Number(target);
          number = Number(number);
          if (number > targetNum) {
            result += "L";
          } else if (number < targetNum) {
            result += "H";
          } else if (number === targetNum) {
            result += "E";
          }
          return {
            result: result,
            targetNumber: target,
            nextGameAvailable: nextGameAvailable,
            date: date,
          };
        }

        let { result, targetNumber, nextGameAvailable, date } =
          await checkNumber(req.body.number);

        let hintsCopy = [];
        Object.values(req.body.hints).forEach((x) => {
          hintsCopy.push(x);
        });
        hintsCopy[req.body.currentRow] = result;

        let localGameObj = {
          hints: hintsCopy,
          status: "playing",
          date: date,
        };

        let localGameOverObj = {
          hints: hintsCopy,
          status: "playing",
          nextGameAvailable: false,
          targetNumber: targetNumber,
          date: date,
        };
        console.log(localGameOverObj);

        let correctResult = "";
        for (let i = 0; i < req.body.digits; i++) {
          correctResult += "G";
        }
        correctResult += "E";

        console.log(correctResult);
        console.log(result);
        if (result == correctResult) {
          //This updates the games completed stat
          try {
            const webDb = mongoClient.db("Website");
            let stats = webDb.collection("Stats");
            await stats.updateOne(
              { title: "gamesCompleted" },
              {
                $inc: {
                  gamesCompleted: 1,
                  dailyGamesCompleted: 1,
                  [`daily${req.body.digits}-games`]: 1,
                },
              }
            );
          } catch {}
          localGameOverObj.status = "victory";
          console.log("victory");

          const dbDailyGames = mongoClient.db("DailyGames");

          if (nextGameAvailable) {
            localGameOverObj.nextGameAvailable = true;
          }

          console.log(
            "it is " +
              localGameOverObj.nextGameAvailable +
              " that the next game is available"
          );

          res.send({
            gameObj: localGameOverObj,
          });
        } else if (req.body.currentRow == 5) {
          //This updates the games completed stat
          try {
            const webDb = mongoClient.db("Website");
            let stats = webDb.collection("Stats");
            await stats.updateOne(
              { title: "gamesCompleted" },
              {
                $inc: {
                  gamesCompleted: 1,
                  dailyGamesCompleted: 1,
                  [`daily${req.body.digits}-games`]: 1,
                },
              }
            );
          } catch {}
          localGameOverObj.status = "defeat";
          console.log("defeat");

          if (nextGameAvailable) {
            localGameOverObj.nextGameAvailable = true;
          }

          res.send({
            gameObj: localGameOverObj,
          });
        } else {
          console.log("the game continues");
          res.send({
            gameObj: localGameObj,
          });
        }
      }
    } catch {
      res.send({ error: true });
    }
  }
  */

  //Returns the random game the user has going if it exists, setting up the board
  app.put("/api/getCurrentGameRandom", async (req, res, next) => {
    getCurrentGameRandom(req, res, next);
  });

  //Checks the users guess, updates the game on the database, returns graphics update
  app.put("/api/checkGuessRandom", async (req, res, next) => {
    checkGuessRandom(req, res, next);
  });

  //Sets up or resets the random game, beginning a new game board if the game is completed
  app.put("/api/resetGameRandom", async (req, res, next) => {
    resetGameRandom(req, res, next);
  });

  //Returns the random game the user has going if it exists, setting up the board
  app.put("/api/getCurrentGameRegular", async (req, res, next) => {
    getCurrentGameRegular(req, res, next);
  });

  //Checks the users guess, updates the game on the database, returns graphics update
  app.put("/api/checkGuessRegular", async (req, res, next) => {
    checkGuessRegular(req, res, next);
  });

  //Sets up or resets the random game, beginning a new game board if the game is completed
  app.put("/api/resetGameRegular", async (req, res, next) => {
    resetGameRegular(req, res, next);
  });
  //Checks the users guess, updates the game on the database, returns graphics update
  app.put("/api/checkGuessLocal", async (req, res, next) => {
    checkGuessLocal(req, res, next);
  });

  //Gets the game id for the local game so it can be compared against the current one
  app.put("/api/gameId", async (req, res, next) => {
    getGameId(req, res, next);
  });

  /*Used by Local version of the game to retreieve the gameId and its number,
    Will send back either today's game info or their current game's info */
  app.put("/api/getLocalGame", async (req, res, next) => {
    getLocalGame(req, res, next);
  });

  //Checks if the next game is availabe and adds game score to total site statistics
  app.put("/api/nextGameAvailable", async (req, res, next) => {
    gameOverLocal(req, res, next);
  });
}

module.exports = { gameRequests };
