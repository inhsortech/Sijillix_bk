const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  title: { type: String, required: true }, description: String,
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, dueDate: Date,
  priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
  status: { type: String, enum: ["open", "in_progress", "completed"], default: "open" }
}, { timestamps: true });
module.exports = mongoose.model("Task", schema);
