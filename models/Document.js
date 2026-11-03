const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
    },

    category: String,
    description: String,
    fileUrl: String,
    fileName: String,

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    expiryDate: Date,

    status: {
      type: String,
      enum: ["active", "expired", "pending"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);