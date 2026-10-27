const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  employeeId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  email: String, phone: String, department: String, branch: String,
  nationality: String, jobTitle: String, joinDate: Date,
  status: { type: String, enum: ["active", "inactive", "on_leave"], default: "active" }
}, { timestamps: true });
schema.index({ organizationId: 1, employeeId: 1 }, { unique: true });
module.exports = mongoose.model("Employee", schema);
