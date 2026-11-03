const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["super_admin", "admin", "manager", "viewer"],
      default: "viewer",
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.index(
  { organizationId: 1, email: 1 },
  { unique: true }
);

module.exports = mongoose.model("User", userSchema);