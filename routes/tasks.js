const router = require("express").Router();
const Task = require("../models/Task");
const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/auth");
router.use(auth);
router.get("/", async (req, res) => { try { const tasks = await Task.find({ organizationId: req.user.organizationId }).populate("assignedTo", "name email").populate("documentId", "title expiryDate type").sort({ dueDate: 1 }).limit(100); res.json(tasks); } catch { res.status(500).json({ message: "Failed to fetch tasks" }); } });
router.post("/", requireRole("owner", "admin", "hr", "compliance"), async (req, res) => {
  try { const { title, description, dueDate, priority, documentId } = req.body; if (!title) return res.status(400).json({ message: "Title is required" }); if (documentId && !(await Document.exists({ _id: documentId, organizationId: req.user.organizationId }))) return res.status(400).json({ message: "Invalid document" }); const task = await Task.create({ organizationId: req.user.organizationId, title, description, dueDate, priority, documentId }); await AuditLog.create({ organizationId: req.user.organizationId, userId: req.user.sub, action: "task.created", entityType: "Task", entityId: task._id.toString() }); res.status(201).json(task); }
  catch { res.status(400).json({ message: "Failed to create task" }); }
});
router.patch("/:id", requireRole("owner", "admin", "hr", "compliance"), async (req, res) => {
  try { const allowed = ["title", "description", "dueDate", "priority", "status"]; const update = {}; for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key]; const task = await Task.findOneAndUpdate({ _id: req.params.id, organizationId: req.user.organizationId }, { $set: update }, { new: true, runValidators: true }); if (!task) return res.status(404).json({ message: "Task not found" }); await AuditLog.create({ organizationId: req.user.organizationId, userId: req.user.sub, action: "task.updated", entityType: "Task", entityId: task._id.toString(), details: update }); res.json(task); }
  catch { res.status(400).json({ message: "Unable to update task" }); }
});
module.exports = router;
