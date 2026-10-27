const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Document = require("../models/Document");
const Employee = require("../models/Employee");
const AuditLog = require("../models/AuditLog");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/auth");
const uploadDir = path.resolve("private_uploads"); fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({ destination: uploadDir, filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()) });
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024, files: 1 }, fileFilter: (req, file, cb) => cb(null, ["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype)) });
router.use(auth);
router.get("/", async (req, res) => {
  try { const filter = { organizationId: req.user.organizationId }; if (req.query.status) filter.status = req.query.status; if (req.query.type) filter.type = req.query.type; const docs = await Document.find(filter).select("-filePath").populate("employeeId", "name employeeId").sort({ expiryDate: 1 }).limit(100); res.json(docs); }
  catch { res.status(500).json({ message: "Failed to fetch documents" }); }
});
router.post("/", requireRole("owner", "admin", "hr", "compliance"), (req, res, next) => upload.single("file")(req, res, err => err ? res.status(400).json({ message: "Upload rejected. Check file type and 10 MB size limit." }) : next()), async (req, res) => {
  let file = req.file;
  try {
    if (!req.body.title || !req.body.type) { if (file) fs.unlinkSync(file.path); return res.status(400).json({ message: "Title and type required" }); }
    if (req.body.employeeId && !(await Employee.exists({ _id: req.body.employeeId, organizationId: req.user.organizationId }))) { if (file) fs.unlinkSync(file.path); return res.status(400).json({ message: "Invalid employee" }); }
    const doc = await Document.create({ organizationId: req.user.organizationId, employeeId: req.body.employeeId || null, title: req.body.title, type: req.body.type, documentNumber: req.body.documentNumber, issueDate: req.body.issueDate || undefined, expiryDate: req.body.expiryDate || undefined, filePath: file?.path, originalFileName: file ? path.basename(file.originalname) : undefined, uploadedBy: req.user.sub });
    await AuditLog.create({ organizationId: req.user.organizationId, userId: req.user.sub, action: "document.created", entityType: "Document", entityId: doc._id.toString() });
    const result = doc.toObject(); delete result.filePath; res.status(201).json({ document: result });
  } catch { if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path); res.status(400).json({ message: "Document upload failed" }); }
});
router.patch("/:id/status", requireRole("owner", "admin", "compliance"), async (req, res) => {
  try {
    if (!["pending", "verified", "rejected"].includes(req.body.status)) return res.status(400).json({ message: "Invalid status" });
    const doc = await Document.findOneAndUpdate({ _id: req.params.id, organizationId: req.user.organizationId }, { $set: { status: req.body.status } }, { new: true, runValidators: true }).select("-filePath");
    if (!doc) return res.status(404).json({ message: "Document not found" });
    await AuditLog.create({ organizationId: req.user.organizationId, userId: req.user.sub, action: "document.status_changed", entityType: "Document", entityId: doc._id.toString(), details: { status: doc.status } }); res.json(doc);
  } catch { res.status(400).json({ message: "Unable to update document" }); }
});
module.exports = router;
