const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    action: {
      type: String,
      required: true,
    },

    module: String,
    description: String,

    ipAddress: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);