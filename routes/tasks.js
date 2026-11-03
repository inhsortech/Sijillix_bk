const router = require("express").Router();

const Task = require("../models/Task");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

router.use(auth);

router.get("/", authorize("tasks:read"), async (req, res, next) => {
  try {
    const tasks = await Task.find({
      organizationId: req.user.organizationId,
    })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name");

    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
});

router.post("/", authorize("tasks:create"), async (req, res, next) => {
  try {
    const {
      title, description, assignedTo, dueDate, priority,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Task title required",
      });
    }

    if (assignedTo) {
      const assignee = await User.findOne({
        _id: assignedTo,
        organizationId: req.user.organizationId,
        active: true,
      });

      if (!assignee) {
        return res.status(400).json({
          message: "Invalid task assignee",
        });
      }
    }

    const task = await Task.create({
      organizationId: req.user.organizationId,
      title,
      description,
      assignedTo,
      dueDate,
      priority,
      createdBy: req.user.sub,
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", authorize("tasks:update"), async (req, res, next) => {
  try {
    const allowedFields = [
      "title", "description", "dueDate", "priority", "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: req.user.organizationId,
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
});

module.exports = router;