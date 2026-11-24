const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const passport = require("passport");
require("dotenv").config();
require("./config/passport");
require("./config/init");
require("./middleware/checkJWT");

app.use(cors());
app.use(bodyParser.json());
app.use(passport.initialize());

const collectionsRouter = require("./routes/collections");
const googleAuth = require("./routes/googleAuth");
const userRouter = require("./routes/user");
const itemRouter = require("./routes/items");

const userAuthMiddleware = passport.authenticate("checkJWT", {
  session: false,
});

const optionalAuthMiddleware = (req, res, next) => {
  passport.authenticate("checkJWT", { session: false }, (error, user) => {
    req.user = user || null;
    next();
  })(req, res, next);
};

const publicReadMiddleware = (req, res, next) => {
  if (req.method === "GET" && req.path !== "/") {
    return optionalAuthMiddleware(req, res, next);
  }
  return userAuthMiddleware(req, res, next);
};

app.get("/", (req, res) => {
  res.send("API is up and running !!");
});

app.use("/user", userAuthMiddleware, userRouter);
app.use("/collections", publicReadMiddleware, collectionsRouter);
app.use("/items", publicReadMiddleware, itemRouter);
app.use("/auth", googleAuth);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server is running on port:", PORT));
