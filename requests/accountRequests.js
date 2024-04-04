//Requests that involve account creation, password resets and logins
function accountRequests(app, mongoClient) {
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

  //Authentication Constants
  const passport = require("passport");
  const session = require("express-session");
  const MemoryStore = require("memorystore")(session);

  app.use(
    session({
      name: "session",
      secret: process.env.sessionSecret,
      //maxAge: 365 * 24 * 60 * 60 * 1000,
      maxAge: 24 * 60 * 60 * 1000,
      store: new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      sameSite: "strict",
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  //Local Strategy
  const LocalStrategy = require("passport-local").Strategy;

  //Google Authentication
  const GoogleStrategy = require("passport-google-oauth20");
  const Google_Client_Id = process.env.googleClientId;
  const Google_Client_Secret = process.env.googleClientSecret;

  //Facebook Authentication
  const FacebookStrategy = require("passport-facebook");
  const Facebook_Client_Id = process.env.facebookClientId;
  const Facebook_Client_Secret = process.env.facebookClientSecret;

  //Twitter Authentication
  const TwitterStrategy = require("@superfaceai/passport-twitter-oauth2");
  const Twitter_Client_Id = process.env.twitterClientId;
  const Twitter_Client_Secret = process.env.twitterClientSecret;

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

  /////////////////////
  /* Account Creation
  /* Creates a new unverified account and sends a verification email. */
  app.post("/api/create-account", async (req, res, next) => {
    const db = mongoClient.db("Accounts");
    let accounts = db.collection("Accounts");
    let unverifieds = db.collection("Unverified-Accounts");

    //Error checking
    let errors = {
      email: "",
      password: "",
    };
    let errorFound = false;

    //Checks if email address if valid
    let emailRegExp = new RegExp(
      "^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,})$"
    );
    if (!emailRegExp.test(req.body.email)) {
      errors.email = "Invalid email address";
      errorFound = true;
    }
    //Checks if email address already exists
    /*
    let dupeAccount = await accounts.findOne({
      email: req.body.email.toLowerCase(),
    });
    */
    let dupeAccount = await getAccount("email", req.body.email.toLowerCase());
    //Checks if password is valid
    let passwordRegExp = new RegExp(
      "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*[!@#$%^&*_0-9]).{10,32}$"
    );
    if (!passwordRegExp.test(req.body.password)) {
      errors.password = `Passwords must be at least 10 characters long, have an upper and
      lowercase letter, and have a number or special character.`;
    }
    //Username validity and profanity filter
    let usernameRegExp = new RegExp("^(?=.*[a-zA-Z])[a-zA-Z0-9_]{3,16}$");
    if (
      matcher.hasMatch(req.body.username) ||
      !usernameRegExp.test(req.body.username)
    ) {
      errors.username = "Invalid username";
      errorFound = true;
    }
    if (dupeAccount) {
      //Sends back a fake account completion if email already exists
      res.sendStatus(200);
      /*
      // create Nodemailer SES transporter
      let transporter = nodemailer.createTransport({
        SES: { ses, aws },
      });

      const mailOptions = {
        from: `"Numbler" <noreply@numbler.net>`,
        to: req.body.email,
        subject: "Numbler Email Verification",
        html: `</p> You have already created a Numbler account. </p> 
        <p>If you didn't just try to sign up to Numbler, someone else may have tried to sign up with your email. 
        If so, your account information is hidden and you can ignore this. </p>
        <p>If you need to reset your password, visit 
        <a href='${process.env.protocol}${process.env.domain}/reset-password'>${process.env.protocol}${process.env.domain}/reset-password</a></p>
        `,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          //console.log(error);
        } else {
          //console.log("Email sent: " + info.response);
        }
      });
      //errors.email = "That email is already associated with an account";
      //errorFound = true;
      */
    } else if (errorFound) {
      res.status(400).send(errors);
    } else {
      res.sendStatus(200);

      //Checks to see if user has attempted many account creations within one day
      const accountDupes = await unverifieds
        .find({ email: req.body.email.toLowerCase() })
        .toArray();
      if (accountDupes.length < 5) {
        //Creates the account if parameters are correct
        let random = Math.floor(Math.random() * 6) + 4;

        let verificationCode = generateString(32);

        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
          try {
            const user = {
              email: req.body.email.toLowerCase(),
              username: req.body.username,
              password: hashedPassword,
              verificationCode: verificationCode,
              createdAt: new Date(),
            };
            await unverifieds.insertOne(user);
            //res.send(302);
          } catch (err) {}
        });

        // create Nodemailer SES transporter
        let transporter = nodemailer.createTransport({
          SES: { ses, aws },
        });

        const mailOptions = {
          from: `"Numbler" <noreply@numbler.net>`,
          to: req.body.email,
          subject: "Numbler Email Verification",
          html: `</p> Click below to verify your email address. </p> <br>
        <a href='${process.env.protocol}${process.env.domain}/verify-email/${verificationCode}'>${process.env.protocol}${process.env.domain}/verify-email/${verificationCode}</a>
        <p>If you did not just sign up to Numbler, please ignore this.</p>
        `,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            //console.log("Email sent: " + info.response);
          }
        });
      }
    }
  });

  /////////////////////
  /* Email Verification 
  /* Verifies the email if user goes to verification URL */
  app.post("/api/verify-email/:verificationCode", async (req, res, next) => {
    const db = mongoClient.db("Accounts");
    let accounts = db.collection("Accounts");
    let unverifieds = db.collection("Unverified-Accounts");

    let vCode = req.params["verificationCode"];

    const unverifiedUser = await unverifieds.findOne({
      verificationCode: vCode,
    });

    if (unverifiedUser) {
      const newestUnverifiedAccount = unverifieds
        .find({ email: unverifiedUser.email.toLowerCase() })
        .sort({ createdAt: -1 })
        .limit(1);

      const arr = await newestUnverifiedAccount.toArray();
      let newestVerificationCode = arr[0].verificationCode;

      /*
      const previouslyCreatedAccount = await accounts.findOne({
        email: unverifiedUser.email.toLowerCase(),
      });
      */
      let previouslyCreatedAccount = await getAccount(
        "email",
        unverifiedUser.email.toLowerCase()
      );

      let newSession = generateString(32);

      if (
        unverifiedUser.verificationCode === newestVerificationCode &&
        !previouslyCreatedAccount
      ) {
        const verifiedUser = {
          email: unverifiedUser.email.toLowerCase(),
          password: unverifiedUser.password,
          username: unverifiedUser.username,
          usernameDate: new Date("Wed Jan 01 2020 00:00:00 GMT-0500"),
          premium: false,
          session: newSession,
          createdAt: new Date(),
          lastGamePlayed: new Date(),
        };
        await accounts.insertOne(verifiedUser);
        res.sendStatus(200);
        res.end();
      } else {
        res.sendStatus(400);
      }
    } else {
      res.sendStatus(400);
    }
  });

  /////////////////////
  /* Reset Password / Forgot Password
  /* Sends a password reset link to to a verified email */
  app.post("/api/forgot-password", async (req, res, next) => {
    const db = mongoClient.db("Accounts");
    let accounts = db.collection("Accounts");
    let needsReset = db.collection("Needs-Password-Reset");

    //Error checking
    let errors = {
      email: "",
    };
    let errorFound = false;

    //Checks if email address if valid
    let emailRegExp = new RegExp(
      "^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,})$"
    );
    if (!emailRegExp.test(req.body.email)) {
      errors.email = "Invalid email address";
      errorFound = true;
    }

    //Checks if email address exists
    /*
    let accountExists = await accounts.findOne({
      email: req.body.email.toLowerCase(),
    });
    */
    let accountExists = await getAccount("email", req.body.email.toLowerCase());

    if (errorFound) {
      res.status(400).send(errors);
    } else if (!accountExists) {
      //Checks if account exists, sends email notifiying them that they can create an account
      res.sendStatus(200);
      // create Nodemailer SES transporter
      /*
      let transporter = nodemailer.createTransport({
        SES: { ses, aws },
      });

      const mailOptions = {
        from: `"Numbler" <noreply@numbler.net>`,
        to: req.body.email,
        subject: "Numbler Password Rest",
        html: `</p> You have requsted a password reset, but you do not have a Numbler account associated with this email. </p> 
        <p>If you want to create an account, visit 
        <a href='${process.env.protocol}${process.env.domain}/signup'>${process.env.protocol}${process.env.domain}/signup</a></p>
        <p>If you didn't just request a password reset, you can ignore this. </p>
        `,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          //console.log(error);
        } else {
          //console.log("Email sent: " + info.response);
        }
      });
      /*
      errors.email = "There is no account associated with that email";
      errorFound = true;
      */
    } else {
      res.sendStatus(200);
      //Checks to see if user has attempted many password resets within one day
      const accountDupes = await needsReset
        .find({ email: req.body.email.toLowerCase() })
        .toArray();
      if (accountDupes.length < 5) {
        try {
          await accounts.updateOne(
            { email: req.body.email.toLowerCase() },
            { $set: { needsPasswordReset: true } }
          );
        } catch {
          res.sendStatus(400);
        }
        //Sends a password reset if the email address exists
        let random = Math.floor(Math.random() * 6) + 4;

        let verificationCode = generateString(32);

        const user = {
          email: req.body.email.toLowerCase(),
          verificationCode: verificationCode,
          createdAt: new Date(),
        };
        await needsReset.insertOne(user);

        // create Nodemailer SES transporter
        let transporter = nodemailer.createTransport({
          SES: { ses, aws },
        });

        const mailOptions = {
          from: `"Numbler" <noreply@numbler.net>`,
          to: req.body.email.toLowerCase(),
          subject: "Numbler Password Reset",
          html: `<p>Click here to reset your password. If you didn't request a password reset, you can ignore this. </p>
        <a href='${process.env.protocol}${process.env.domain}/new-password/${verificationCode}'>${process.env.protocol}${process.env.domain}/new-password/${verificationCode}</a>`,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            //console.log(error);
          } else {
            //console.log("Email sent: " + info.response);
          }
        });
      }
    }
  });

  /////////////////////
  /* Changing Password / New Password
  /* Handles the form that inputs the changed password */
  app.post("/api/change-password", async (req, res, next) => {
    let newPassword = req.body.password;
    let vCode = req.body.verificationCode;

    //Error checking
    let errors = {
      password: "",
      errorFound: false,
    };
    let errorFound = false;

    //Checks if password is valid
    let passwordRegExp = new RegExp(
      "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*[!@#$%^&*_0-9]).{10,32}$"
    );
    if (!passwordRegExp.test(newPassword)) {
      errors.password = `Passwords must be at least 10 characters long, have an upper and
      lowercase letter, and have a number or special character.`;
      errors.errorFound = true;
    }

    if (errors.errorFound) {
      res.status(400).send(errors);
    } else {
      const db = mongoClient.db("Accounts");
      let accounts = db.collection("Accounts");
      let needsReset = db.collection("Needs-Password-Reset");

      const needsResetUser = await needsReset.findOne({
        verificationCode: vCode,
      });

      if (needsResetUser) {
        try {
          /*
          const user = await accounts.findOne({
            email: needsResetUser.email.toLowerCase(),
          });
          */
          const user = await getAccount(
            "email",
            needsResetUser.email.toLowerCase()
          );
          if (user.needsPasswordReset) {
            bcrypt.hash(newPassword, 10, async (err, hashedPassword) => {
              await accounts.updateOne(
                { email: needsResetUser.email.toLowerCase() },
                {
                  $set: {
                    password: hashedPassword,
                    needsPasswordReset: false,
                  },
                }
              );
              res.sendStatus(200);
            });
          } else {
            res.status(400).send(errors);
          }
        } catch {
          res.status(400).send(errors);
        }
      } else {
        res.status(400).send(errors);
      }
    }
  });

  //Local Strategy Authentication
  //Logs a user in
  app.post(
    "/api/login",
    passport.authenticate("local", {
      failureRedirect: "/login",
    }),
    (req, res) => {
      res.sendStatus(302);
    }
  );

  //Validates form and then sends to /api/login if successful
  app.post("/api/validate", async (req, res, next) => {
    const db = mongoClient.db("Accounts");
    let accounts = db.collection("Accounts");
    let errors = {
      email: "",
      password: "",
      errorFound: false,
    };
    //Error Checking
    let errorExists = false;
    /*
    const user = await accounts.findOne({
      email: req.body.email.toLowerCase(),
    });
    */
    const user = await getAccount("email", req.body.email.toLowerCase());
    if (!user) {
      errors.password = "Incorrect email or password";
      errors.errorFound = true;
    } else {
      if (await bcrypt.compare(req.body.password, user.password)) {
        res.sendStatus(302);
      } else {
        errors.password = "Incorrect email or password";
        errors.errorFound = true;
      }
    }
    if (errors.errorFound) {
      res.send(errors);
    }
  });

  //Local strategy to log user in at /api/login
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        const db = mongoClient.db("Accounts");
        let accounts = db.collection("Accounts");
        let errors = {
          email: "",
          password: "",
        };
        //Error Checking
        let errorExists = false;
        //const user = await accounts.findOne({ email: email.toLowerCase() });
        const user = await getAccount("email", email.toLowerCase());
        let newUser = {};
        if (!user) {
          errors.email = "No account exists with that email.";
          errorExists = true;
        } else {
          if (await bcrypt.compare(password, user.password)) {
            let session = generateString(48);
            newUser.session = session;
            newUser.loginType = "email";
            newUser.profile_picture =
              "/images/account/profile-images/logged-in.png";
          } else {
            errors.password = "Wrong password. Try again.";
            errorExists = true;
          }
        }

        if (errorExists) {
          return done(null, false, errors);
        } else {
          await accounts.updateOne(
            { _id: user._id },
            { $set: { session: newUser.session } }
          );
          return done(null, newUser);
        }
      }
    )
  );

  //Logs the user out
  app.post("/api/logout", async (req, res, next) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
    });
    try {
      const db = mongoClient.db("Accounts");
      let accounts = db.collection("Accounts");

      let newSession = generateString(48);
      await accounts.updateOne(
        { session: req.body.session },
        {
          $set: {
            session: newSession,
          },
        }
      );
    } catch {}

    res.sendStatus(302);
  });

  //Google Authentication
  app.get(
    "/api/login/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  passport.use(
    new GoogleStrategy(
      {
        clientID: Google_Client_Id,
        clientSecret: Google_Client_Secret,
        callbackURL: `${process.env.protocol}${process.env.domain}/api/login/google/callback`,
      },
      async function (accessToken, refreshToken, profile, done) {
        let session = generateString(48);
        let returnedAccount = {
          profile_picture: profile.photos[0].value,
          loginType: "google",
          session: session,
        };
        const db = mongoClient.db("Accounts");
        let accounts = db.collection("Accounts");
        //let account = await accounts.findOne({ googleId: profile.id });
        let account = await getAccount("googleId", profile.id);
        //console.log(profile.email);
        if (!account) {
          account = await accounts.findOne({
            email: profile.emails[0].value.toLowerCase(),
          });
          account = await getAccount(
            "email",
            profile.emails[0].value.toLowerCase()
          );
        }
        if (!account) {
          let password = await bcrypt.hash(uniqid(), 16);
          let newAccount = {
            googleId: profile.id,
            email: profile.emails[0].value,
            password: password,
            premium: false,
            username: generateUsername(),
            usernameDate: new Date("Wed Jan 01 2020 00:00:00 GMT-0500"),
            session: session,
            lastGamePlayed: new Date(),
          };
          await accounts.insertOne(newAccount);
          done(null, returnedAccount);
        } else {
          if (!account.googleId) {
            await accounts.updateOne(
              { email: profile.emails[0].value.toLowerCase() },
              {
                $set: {
                  googleId: profile.id,
                  session: session,
                },
              }
            );
          } else {
            await accounts.updateOne(
              { googleId: profile.id },
              {
                $set: {
                  session: session,
                },
              }
            );
          }
          done(null, returnedAccount);
        }
      }
    )
  );

  app.get(
    "/api/login/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    async function (req, res) {
      res.redirect(
        `${process.env.protocol}${process.env.domain}/login/complete`
      );
    }
  );

  //Facebook Authentication
  /*
  app.get(
    "/login/facebook",
    passport.authenticate("facebook", {
      scope: ["public_profile"],
    })
  );
  passport.use(
    new FacebookStrategy(
      {
        clientID: Facebook_Client_Id,
        clientSecret: Facebook_Client_Secret,
        callbackURL: `${process.env.protocol}${process.env.domain}/login/facebook/callback`,
      },
      async function (accessToken, refreshToken, profile, done) {

        let session = generateString(48);
        let returnedAccount = {
          facebookProfilePicture: public_profile.picture,
          loginType: "facebook",
          session: session,
        };
        const db = mongoClient.db("Accounts");
        let accounts = db.collection("Accounts");
        let account = await accounts.findOne({ facebookId: public_profile.id });
        console.log(public_profile.email);
        if (!account) {
          account = await accounts.findOne({ email: public_proile.email.toLowerCase() });
        }
        if (!account) {
          let password = await bcrypt.hash(uniqid(), 10);
          let newAccount = {
            email: public_profile.email.toLowerCase(),
            facebookId: public_profile.id,
            password: password,
            session: session,
          };
          await accounts.insertOne(newAccount);
          done(null, returnedAccount);
        } else {
          if (!account.facebookId) {
            await accounts.updateOne(
              { email: public_profile.email.toLowerCase() },
              {
                $set: {
                  facebookId: public_profile.id,
                  session: session,
                },
              }
            );
          } else {
            await accounts.updateOne(
              { facebookId: public_profile.id },
              {
                $set: {
                  session: session,
                },
              }
            );
          }
          done(null, returnedAccount);
        }
      }
    )
  );

  app.get(
    "/login/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/login" }),
    async function (req, res) {
      res.redirect(`${process.env.protocol}${process.env.domain}`);
    }
  );
  */

  /*
  //Twitter Authentication
  app.get(
    "/login/twitter",
    passport.authenticate("twitter", {
      scope: ["profile"],
    })
  );
  passport.use(
    new TwitterStrategy(
      {
        clientType: 'confidential',
        clientID: Twitter_Client_Id,
        clientSecret: Twitter_Client_Secret,
        callbackURL: `${process.env.protocol}${process.env.domain}/login/twitter/callback`,
      },
      async function (token, tokenSecret, profile, done) {

        let session = generateString(48);
        let returnedAccount = {
          twitterProfilePicture: profile.photos[0],
          loginType: "twitter",
          session: session,
        };
        const db = mongoClient.db("Accounts");
        let accounts = db.collection("Accounts");
        let account = await accounts.findOne({ twitterId: profile.id });
        if (!account) {
          account = await accounts.findOne({ email: profile.email[0].toLowerCase() });
        }
        if (!account) {
          let password = await bcrypt.hash(uniqid(), 10);
          let newAccount = {
            email: profile.email.toLowerCase(),
            twitterId: profile.id,
            password: password,
            session: session,
          };
          await accounts.insertOne(newAccount);
          done(null, returnedAccount);
        } else {
          if (!account.twitterId) {
            await accounts.updateOne(
              { email: profile.email.toLowerCase() },
              {
                $set: {
                  twitterId: profile.id,
                  session: session,
                },
              }
            );
          } else {
            await accounts.updateOne(
              { twitterId: profile.id },
              {
                $set: {
                  session: session,
                },
              }
            );
          }
          done(null, returnedAccount);
        }
      }
    )
  );

  app.get(
    "/login/twitter/callback",
    passport.authenticate("twitter", { failureRedirect: "/login" }),
    async function (req, res) {
      res.redirect(`${process.env.protocol}${process.env.domain}`);
    }
  );
  */

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser(async (user, done) => {
    if (user.session) {
      const db = mongoClient.db("Accounts");
      let accounts = db.collection("Accounts");
      //let sessionUser = await accounts.findOne({ session: user.session });
      let sessionUser = await getAccount("session", user.session);
      if (sessionUser) {
        done(null, user);
      } else {
        done(null, null);
      }
    } else {
      done(null, null);
    }
  });

  //Returns the info of the current user
  app.get("/api/current_user", async (req, res) => {
    //console.log(req.user);
    res.send(req.user);
  });

  //Returns the account info of the current user
  //Returns if they are logged in, if they have premium, and their profile picture
  app.post("/api/account-info", async (req, res) => {
    try {
      const db = mongoClient.db("Accounts");
      let accounts = db.collection("Accounts");
      //let account = await accounts.findOne({ session: req.body.session });
      let account = await getAccount("session", req.body.session);
      if (account) {
        res.send({
          loggedIn: true,
          premium: account.premium,
          imageUrl: req.body.profile_picture,
        });
      } else {
        res.send({
          loggedIn: false,
          premium: false,
          imageUrl: "/images/site/account2.png",
        });
      }
    } catch {
      res.send({
        loggedIn: false,
        premium: false,
        imageUrl: "/images/site/account2.png",
      });
    }
  });

  //Returns the username associated with the current session and a statistcs object with their game info, and if they have premium
  app.post("/api/profile", async (req, res) => {
    try {
      if (req.body.session) {
        const db = mongoClient.db("Accounts");
        let accounts = db.collection("Accounts");
        //let account = await accounts.findOne({ session: req.body.session });
        let account = await getAccount("session", req.body.session);
        let statsObj = {};

        for (let i = 2; i <= 7; i++) {
          if (account[`${i}digits-scores`]) {
            statsObj[`${i}digits-scores`] = account[`${i}digits-scores`];
          }
          if (account[`${i}random-scores`]) {
            statsObj[`${i}random-scores`] = account[`${i}random-scores`];
          }
        }

        //console.log(statsObj);

        res.send({
          username: account.username,
          premium: account.premium,
          statsObj: statsObj,
        });
      } else {
        res.send({ username: "", premium: false, statsObj: {} });
      }
    } catch {
      res.send({ username: "", premium: false, statsObj: {} });
    }
  });

  //Returns a random string, used for creating passwords and sessions
  function generateString(length) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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

  //Creates a generic username for the user to start with
  function generateUsername() {
    let prefixes = ["Unnamed", "Nameless", "Unknown"];
    let suffixes = [
      "Saffron",
      "Chestnut",
      "Carrot",
      "Parsnip",
      "Potato",
      "Pumpkin",
      "Turnip",
      "Ox",
      "Pepper",
      "Tomato",
      "Barley",
      "Barrel",
      "Apple",
      "Celery",
      "Pear",
      "Horse",
      "Goose",
      "Orange",
      "Shovel",
      "Fork",
      "Truffle",
      "Olive",
      "Lettuce",
      "Juniper",
      "Cedar",
      "Deer",
      "Ivy",
      "Maple",
      "Cricket",
      "Pine",
      "Peat",
      "Coal",
      "Dog",
      "Nitrate",
      "Granite",
      "Clay",
      "Slate",
      "Rabbit",
      "Flint",
      "Marble",
      "Gypsum",
      "Salt",
      "Iron",
      "Copper",
      "Cat",
      "Tin",
      "Lead",
      "Zinc",
      "Mercury",
      "Laurel",
      "Snowdrop",
      "Axe",
      "Bull",
      "Grass",
      "Hazel",
      "Goat",
      "Violet",
      "Willow",
      "Elm",
      "Mandrake",
      "Parsley",
      "Tuna",
      "Twine",
      "Sleigh",
      "Tulip",
      "Hen",
      "Birch",
      "Bee",
      "Hemlock",
      "Radish",
      "Pigeon",
      "Hawthorn",
      "Oak",
      "Rose",
      "Silkworm",
      "Carp",
      "Duck",
      "Scythe",
      "Thyme",
      "Quail",
      "Cart",
      "Oat",
      "Rye",
      "Onion",
      "Rosemary",
      "Sickle",
      "Clove",
      "Lavender",
      "Mint",
      "Sage",
      "Garlic",
      "Wheat",
      "Basil",
      "Lock",
      "Otter",
      "Mill",
      "Plum",
      "Salmon",
      "Fennel",
      "Water",
      "Walnut",
      "Trout",
      "Basket",
      "Armor",
      "Snow",
      "Rain",
      "Amber",
      "Anchor",
      "Emerald",
      "Silver",
      "Gold",
      "Jade",
      "Bear",
    ];

    return (
      prefixes[Math.floor(Math.random() * prefixes.length)] +
      suffixes[Math.floor(Math.random() * suffixes.length)]
    );
  }
}

module.exports = { accountRequests };
