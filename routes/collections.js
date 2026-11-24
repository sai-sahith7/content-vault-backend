const express = require("express");
const router = express.Router();
const mongodb = require("mongodb");

const Collections = require("../models/collections");
const Items = require("../models/items");
const User = require("../models/user");

router.get("/", async (req, res) => {
  try {
    const collectionData = await Collections.find({
      ownerEmail: req.user.email,
    });
    res.status(200).json(collectionData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongodb.ObjectID.isValid(req.params.id)) {
      return res.status(404).json({ notFound: true });
    }
    const collectionId = new mongodb.ObjectID(req.params.id);
    const collectionData = await Collections.findById(collectionId);
    if (!collectionData) {
      return res.status(404).json({ notFound: true });
    }
    const isOwner =
      Boolean(req.user) && collectionData.ownerEmail === req.user.email;
    if (!isOwner && !collectionData.isPublic) {
      return res.status(200).json({ private: true });
    }
    const owner = await User.findOne({ email: collectionData.ownerEmail });
    res.status(200).json({
      _id: collectionData._id,
      name: collectionData.name,
      isPublic: collectionData.isPublic,
      count: collectionData.count,
      isOwner: isOwner,
      owner: {
        name: owner ? owner.name : "",
        avatar: owner ? owner.avatar : "",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  if (!req.body.name || !String(req.body.name).trim()) {
    return res.status(400).json({ error: "Name is required" });
  }

  const collection = new Collections({
    name: String(req.body.name).trim(),
    ownerEmail: req.user.email,
  });

  try {
    const newCollection = await collection.save();
    res.status(200).json(newCollection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!req.body.name || !String(req.body.name).trim()) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!mongodb.ObjectID.isValid(req.params.id)) {
      return res.status(404).json({ notFound: true });
    }
    const collectionId = new mongodb.ObjectID(req.params.id);
    const collection = await Collections.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ notFound: true });
    }
    if (collection.ownerEmail !== req.user.email) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    collection.name = String(req.body.name).trim();
    const updatedCollection = await collection.save();
    res.status(200).json(updatedCollection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/changeVisibility", async (req, res) => {
  try {
    if (!mongodb.ObjectID.isValid(req.body.id)) {
      return res.status(404).json({ notFound: true });
    }
    const collectionId = new mongodb.ObjectID(req.body.id);
    const collection = await Collections.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ notFound: true });
    }
    if (collection.ownerEmail !== req.user.email) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    collection.isPublic = !collection.isPublic;
    const updatedCollection = await collection.save();
    res.status(200).json(updatedCollection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongodb.ObjectID.isValid(req.params.id)) {
      return res.status(404).json({ notFound: true });
    }
    const collectionId = new mongodb.ObjectID(req.params.id);
    const collection = await Collections.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ notFound: true });
    }
    if (collection.ownerEmail !== req.user.email) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    await Collections.deleteOne({ _id: collectionId });
    await Items.deleteMany({ collectionId: req.params.id });
    res.status(200).json(collection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
