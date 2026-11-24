const express = require("express");
const router = express.Router();

const User = require("../models/user");

router.get("/me", async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
