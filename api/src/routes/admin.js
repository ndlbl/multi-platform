import { Router } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";
import { LibraryItem } from "../models/LibraryItem.js";

const router = Router();

router.get("/users", async (_req, res, next) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "userId",
          as: "_tasks",
        },
      },
      {
        $lookup: {
          from: "libraryitems",
          localField: "_id",
          foreignField: "userId",
          as: "_library",
        },
      },
      {
        $project: {
          _id: 0,
          id: { $toString: "$_id" },
          email: 1,
          role: 1,
          createdAt: 1,
          updatedAt: 1,
          taskCount: { $size: "$_tasks" },
          libraryCount: { $size: "$_library" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.get("/users/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.get("/users/:id/tasks", async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.params.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.get("/users/:id/library", async (req, res, next) => {
  try {
    const items = await LibraryItem.find({ userId: req.params.id }).sort({ addedAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

export default router;
