const router = require("express").Router();

const Employee = require("../models/Employee");
const Document = require("../models/Document");
const Task = require("../models/Task");

const auth = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

router.get("/", auth, authorize("dashboard:read"), async (req, res, next) => {
  try {
    const organizationId =
      req.user.role === "super_admin"
        ? req.query.organizationId
        : req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        message: "Please select an organization",
      });
    }

    const [employees, documents, tasks, pendingTasks, completedTasks] =
      await Promise.all([
        Employee.countDocuments({ organizationId }),
        Document.countDocuments({ organizationId }),
        Task.countDocuments({ organizationId }),
        Task.countDocuments({
          organizationId,
          status: "pending",
        }),
        Task.countDocuments({
          organizationId,
          status: "completed",
        }),
      ]);

    res.json({
      success: true,
      statistics: {
        employees,
        documents,
        tasks,
        pendingTasks,
        completedTasks,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
