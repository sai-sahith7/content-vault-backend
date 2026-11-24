const express = require("express");
const router = express.Router();
const mongodb = require("mongodb");
const axios = require("axios");
const getType = require("../utils/getType");

const Collections = require("../models/collections");
const Items = require("../models/items");

const isValidURL = (url) => {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch (error) {
    return false;
  }
};

router.get("/:collectionId", async (req, res) => {
  try {
    if (!mongodb.ObjectID.isValid(req.params.collectionId)) {
      return res.status(404).json({ notFound: true });
    }
    const collectionId = new mongodb.ObjectID(req.params.collectionId);
    const collection = await Collections.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ notFound: true });
    }
    const isOwner =
      Boolean(req.user) && collection.ownerEmail === req.user.email;
    if (!isOwner && !collection.isPublic) {
      return res.status(200).json({ private: true });
    }
    const itemData = await Items.find({
      collectionId: req.params.collectionId,
    });
    res.status(200).json(itemData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const collectionId = req.body.collectionId;
    const url = String(req.body.url || "").trim();

    if (!isValidURL(url)) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    if (!mongodb.ObjectID.isValid(collectionId)) {
      return res.status(404).json({ notFound: true });
    }

    const collection = await Collections.findById(
      new mongodb.ObjectID(collectionId)
    );

    if (!collection) {
      return res.status(404).json({ notFound: true });
    }

    if (collection.ownerEmail !== req.user.email) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const response = await axios
      .get(`${process.env.LINKPREVIEW_API_URL}?q=${encodeURIComponent(url)}`, {
        headers: {
          "X-Linkpreview-Api-Key": process.env.LINKPREVIEW_API_KEY,
        },
      })
      .catch((error) => {
        return {
          data: {
            title: "",
            description: "",
            image: "",
          },
        };
      });

    const title = response.data.title;
    const description = response.data.description;
    const image = response.data.image;
    const type = getType(url);

    const item = new Items({
      collectionId: collectionId,
      url: url,
      title: title,
      description: description,
      image: image,
      type: type,
    });
    const newItem = await item.save();

    await Collections.updateOne(
      { _id: new mongodb.ObjectID(collectionId) },
      { $inc: { count: 1 } }
    );

    res.status(200).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongodb.ObjectID.isValid(req.params.id)) {
      return res.status(404).json({ notFound: true });
    }
    const itemId = new mongodb.ObjectID(req.params.id);
    const item = await Items.findById(itemId);
    if (!item) {
      return res.status(404).json({ notFound: true });
    }
    const collectionId = new mongodb.ObjectID(item.collectionId);
    const collection = await Collections.findById(collectionId);
    if (!collection || collection.ownerEmail !== req.user.email) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    await Items.deleteOne({ _id: itemId });

    await Collections.updateOne(
      { _id: new mongodb.ObjectID(collectionId) },
      { $inc: { count: -1 } }
    );

    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
