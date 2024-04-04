//Requests that change things about your profile, like name, profile pic, password, account deletion
//Also handles routing that occurs when user isn't logged in
function profileRequests(app, mongoClient) {
  const bcrypt = require("bcryptjs");
  const uniqid = require("uniqid");
  const crypto = require("crypto");
  const nodemailer = require("nodemailer");
  const aws = require("@aws-sdk/client-ses");
  const ses = new aws.SES({
    apiVersion: "2010-12-01",
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.sesAccessKey,
      secretAccessKey: process.env.sesSecret,
    },
  });
  //Starting mongo
  /*
  const { MongoClient, Timestamp } = require("mongodb");
  let ObjectId = require("mongodb").ObjectId;
  const mongoClient = new MongoClient(process.env.mongoDB);
  */

  //Profanity filter
  const {
    RegExpMatcher,
    TextCensor,
    englishDataset,
    englishRecommendedTransformers,
  } = require("obscenity");

  const matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
  });

  /*
  //Redirects user to homepage if they are already logged in
  app.get("/login", async (req, res, next) => {
    try {
      if (req.user.session) {
        res.redirect("/");
      }
    } catch {
      next();
    }
  });
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

  //Sets a new username for the user if its a valid username
  app.post("/api/change-username", async (req, res, next) => {
    const db = mongoClient.db("Accounts");
    let accounts = db.collection("Accounts");
    let errors = {
      username: "",
    };
    //Error Checking
    //Swear filter & character filter
    let usernameRegExp = new RegExp("^(?=.*[a-zA-Z])[a-zA-Z0-9_]{3,16}$");
    if (
      matcher.hasMatch(req.body.newUsername) ||
      !usernameRegExp.test(req.body.newUsername)
    ) {
      errors.username = "Invalid username";
      res.send({ errors });
    } else {
      //Password error check
      try {
        /*
        let account = await accounts.findOne({
          session: req.body.user.session,
        });
        */
        let account = await getAccount("session", req.body.user.session);
        //Checks it name has been changed in past 30 days
        let today = new Date();
        if (today.getTime() - account.usernameDate.getTime() >= 2592000000) {
          await accounts.updateOne(
            { session: req.body.user.session },
            {
              $set: {
                username: req.body.newUsername,
                usernameDate: today,
                shadowbanned: false,
              },
            }
          );
          res.send({ success: true });
        } else {
          let numberOfDays = Math.floor(
            (today.getTime() - account.usernameDate.getTime()) / 86400000
          );
          numberOfDays = 30 - numberOfDays;
          let dayText = "day";
          if (numberOfDays != 1) {
            dayText += "s";
          }
          errors.username = `You can change your username in ${numberOfDays} ${dayText}`;
          res.send({ errors });
        }
      } catch {
        errors.username = "Error! Name could not be updated.";
        res.send({ errors });
      }
    }
  });

  //Tries to change the password of the user
  app.post("/api/profile-change-password", async (req, res, next) => {
    let session = req.body.user.session;
    let newPassword = req.body.newPassword;
    let currentPassword = req.body.currentPassword;

    //Error checking
    let errors = {
      currentPassword: "",
      newPassword: "",
    };

    //Checks if password is valid
    let passwordRegExp = new RegExp(
      "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*[!@#$%^&*_0-9]).{10,32}$"
    );
    if (!passwordRegExp.test(newPassword)) {
      errors.newPassword = `Passwords must have at least 10 characters, an upper and
    lowercase letter, and a number or special character.`;
    }

    if (errors.newPassword) {
      res.send({ errors });
    } else {
      const db = mongoClient.db("Accounts");
      let accounts = db.collection("Accounts");
      try {
        /*
        let account = await accounts.findOne({
          session: session,
        });
        */
        let account = await getAccount("session", session);
        if (await bcrypt.compare(currentPassword, account.password)) {
          bcrypt.hash(newPassword, 10, async (err, hashedPassword) => {
            try {
              await accounts.updateOne(
                { session: session },
                { $set: { password: hashedPassword } }
              );
              res.send({ success: true });
            } catch (err) {
              errors.currentPassword = "Incorrect password";
              res.send({ errors });
            }
          });
        } else {
          errors.currentPassword = "Incorrect password";
          res.send({ errors });
        }
      } catch {
        errors.currentPassword = "Incorrect password";
        res.send({ errors });
      }
    }
  });

  //Deletes the users account
  app.delete("/api/delete-my-account", async (req, res, next) => {
    const db = mongoClient.db("Accounts");
    let accounts = db.collection("Accounts");
    let errors = {
      email: "",
    };
    try {
      //let account = await accounts.findOne({ session: req.body.user.session });
      let account = await getAccount("session", req.body.user.session);
      if (account.email.toLowerCase() == req.body.email.toLowerCase()) {
        accounts.deleteOne(account);
        // create Nodemailer SES transporter
        let transporter = nodemailer.createTransport({
          SES: { ses, aws },
        });

        const mailOptions = {
          from: `"Numbler" <noreply@numbler.net>`,
          to: account.email,
          subject: "Numbler Account Deletion",
          html: `</p> Your account has been deleted. You do not need to take any further action. </p> 
          `,
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            //console.log(error);
          } else {
            //console.log("Email sent: " + info.response);
          }
        });
        res.send({ success: true });
      } else {
        errors.email = "Incorrect email";
        res.send({ errors });
      }
    } catch {
      errors.email = "Error deleting account";
      res.send({ errors });
    }
  });

  //Resets the statistics of the user for a single game mode
  app.post("/api/reset-stats", async (req, res, next) => {
    const db = mongoClient.db("Accounts");
    let accounts = db.collection("Accounts");
    //let account = await accounts.findOne({ session: req.body.session });
    let account = await getAccount("session", req.body.session);
    try {
      let modeName = req.body.mode.slice(1, req.body.mode.length);
      //Done to avoid user to unset different field parameters in DB
      if (modeName == "random" || modeName == "digits") {
        await accounts.updateOne(
          { session: req.body.session },
          {
            $unset: {
              [`${req.body.mode}-scores`]: "",
              [`${req.body.mode}`]: "",
            },
            $set: { lastStatReset: new Date() },
            $inc: {
              [`num-resetScores-${req.body.mode}`]:
                account[`${req.body.mode}-scores`].scores.length,
            },
          }
        );
        res.send({ success: true });
      } else {
        res.send({ error: true });
      }
    } catch {
      res.send({ error: true });
    }
  });
}

module.exports = { profileRequests };
