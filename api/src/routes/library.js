import { Router } from "express";
import { LibraryItem, VARIANTS } from "../models/LibraryItem.js";

const router = Router();

// /library — get THIS user's library items
router.get("/", async (req, res, next) => {
  try {
    const items = await LibraryItem.find({ userId: req.user.id }).sort({ addedAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// /library/:id — get single library item only if owned by user
router.get("/:id", async (req, res, next) => {
  try {
    const item = await LibraryItem.findOne({ _id: req.params.id, userId: req.user.id });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /library — create
router.post("/", async (req, res, next) => {
  try {
    const { kind } = req.body;
    const Model = VARIANTS[kind];
    if (!Model) return res.status(400).json({ error: `Invalid kind: ${kind}` });
    const item = await Model.create({ ...req.body, userId: req.user.id });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// POST library/:id update (patch)
router.patch("/:id", async (req, res, next) => {
  try {
    const { id: _id1, kind: _k, _id, __v, userId: _uid, ...updates } = req.body;
    const item = await LibraryItem.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, updates, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
});
// DELETE /library/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const item = await LibraryItem.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
