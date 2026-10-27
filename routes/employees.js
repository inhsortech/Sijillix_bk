const router = require("express").Router();
const Employee = require("../models/Employee");
const AuditLog = require("../models/AuditLog");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/auth");
router.use(auth);
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = { organizationId: req.user.organizationId };
    if (req.query.search) { const escaped = String(req.query.search).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); filter.name = { $regex: escaped, $options: "i" }; }
    const [employees, total] = await Promise.all([Employee.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Employee.countDocuments(filter)]);
    res.json({ employees, total, page, limit });
  } catch { res.status(500).json({ message: "Failed to fetch employees" }); }
});
router.post("/", requireRole("owner", "admin", "hr"), async (req, res) => {
  try {
    const employee = await Employee.create({ organizationId: req.user.organizationId, employeeId: req.body.employeeId, name: req.body.name, email: req.body.email, phone: req.body.phone, department: req.body.department, branch: req.body.branch, nationality: req.body.nationality, jobTitle: req.body.jobTitle, joinDate: req.body.joinDate, status: req.body.status });
    await AuditLog.create({ organizationId: req.user.organizationId, userId: req.user.sub, action: "employee.created", entityType: "Employee", entityId: employee._id.toString() });
    res.status(201).json(employee);
  } catch (err) { res.status(err.code === 11000 ? 409 : 400).json({ message: err.code === 11000 ? "Employee ID already exists" : "Invalid employee data" }); }
});
router.get("/:id", async (req, res) => {
  try { const employee = await Employee.findOne({ _id: req.params.id, organizationId: req.user.organizationId }); if (!employee) return res.status(404).json({ message: "Employee not found" }); res.json(employee); }
  catch { res.status(400).json({ message: "Invalid employee ID" }); }
});
module.exports = router;
