const router = require("express").Router();
const Document = require("../models/Document");
const Employee = require("../models/Employee");
const Task = require("../models/Task");
const auth = require("../middleware/auth");
router.use(auth);
router.get("/", async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);
    const scope = { organizationId };
    const expiryScope = { ...scope, expiryDate: { $exists: true, $ne: null } };
    const [
      employeeCount,
      activeEmployees,
      documentCount,
      expiredDocuments,
      expiringDocuments,
      pendingDocuments,
      openTasks,
      overdueTasks,
    ] = await Promise.all([
      Employee.countDocuments(scope),
      Employee.countDocuments({ ...scope, status: "active" }),
      Document.countDocuments(scope),
      Document.countDocuments({ ...expiryScope, expiryDate: { $lt: today } }),
      Document.countDocuments({
        ...expiryScope,
        expiryDate: { $gte: today, $lte: in30Days },
      }),
      Document.countDocuments({ ...scope, status: "pending" }),
      Task.countDocuments({ ...scope, status: { $ne: "completed" } }),
      Task.countDocuments({
        ...scope,
        status: { $ne: "completed" },
        dueDate: { $lt: today },
      }),
    ]);
    const validDocuments = Math.max(0, documentCount - expiredDocuments);
    const complianceScore = documentCount
      ? Math.round((validDocuments / documentCount) * 100)
      : 100;
    const priorityDocuments = await Document.find({
      ...expiryScope,
      expiryDate: { $lte: in30Days },
    })
      .select("title type expiryDate status employeeId")
      .populate("employeeId", "name employeeId")
      .sort({ expiryDate: 1 })
      .limit(10);
    res.json({
      employees: { total: employeeCount, active: activeEmployees },
      documents: {
        total: documentCount,
        expired: expiredDocuments,
        expiringIn30Days: expiringDocuments,
        pendingVerification: pendingDocuments,
      },
      tasks: { open: openTasks, overdue: overdueTasks },
      complianceScore,
      priorityDocuments,
    });
  } catch {
    res.status(500).json({ message: "Dashboard loading failed" });
  }
});
module.exports = router;
