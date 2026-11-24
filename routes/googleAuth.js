const express = require("express");
const router = express.Router();
const passport = require("passport");

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${new URL("/?auth=failed", process.env.FRONTEND_URL)}`,
    session: false,
  }),
  (req, res) => {
    res.redirect(
      `${new URL("/googleToken", process.env.FRONTEND_URL)}#token=${
        req.user.token
      }`
    );
  }
);

module.exports = router;
