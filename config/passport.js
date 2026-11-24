const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const jwt = require("jsonwebtoken");

const User = require("../models/user");

const serverUrl = process.env.SERVER_URL;

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

const googleLogin = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${serverUrl}${process.env.GOOGLE_CALLBACK_URL}`,
  },
  async (accessToken, refreshToken, profile, done) => {
    const token = jwt.sign(
      {
        email: profile.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    try {
      const user = await User.findOneAndUpdate(
        { email: profile.email },
        { name: profile.displayName, avatar: profile.picture },
        { new: true, upsert: true }
      );
      user.token = token;
      return done(null, user);
    } catch (err) {
      console.log(err.message);
      return done(null, false);
    }
  }
);

passport.use(googleLogin);
