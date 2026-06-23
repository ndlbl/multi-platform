import { Router } from "express";
import { Task } from "../models/Task.js";

const router = Router();

// /tasks — get THIS user's tasks
router.get("/", async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// /tasks/:id — get single task only if owned by user
router.get("/:id", async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// POST /tasks — create
router.post("/", async (req, res, next) => {
  try {
    const { title, done } = req.body;
    const task = await Task.create({ title, done, userId: req.user.id });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// POST tasks/:id update (patch)
router.patch("/:id", async (req, res, next) => {
  try {
    const { title, done } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (done !== undefined) updates.done = done;

    const task = await Task.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, updates, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
