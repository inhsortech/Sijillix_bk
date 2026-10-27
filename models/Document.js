const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
  title: { type: String, required: true },
  type: { type: String, enum: ["iqama", "passport", "contract", "commercial_registration", "work_permit", "vehicle_registration", "insurance", "other"], default: "other" },
  documentNumber: String, issueDate: Date, expiryDate: { type: Date, index: true },
  filePath: String, originalFileName: String,
  status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, version: { type: Number, default: 1 }
}, { timestamps: true });
schema.index({ organizationId: 1, expiryDate: 1 });
module.exports = mongoose.model("Document", schema);
