const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: { type: String, required: true },
  entityType: String,
  entityId: String,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String
}, { timestamps: true });
module.exports = mongoose.model("AuditLog", schema);
