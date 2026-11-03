require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = process.env.SUPER_ADMIN_EMAIL
      .trim()
      .toLowerCase();

    const existing = await User.findOne({ email });

    if (existing) {
      console.log("Super admin already exists.");
      return;
    }

    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!password || password.length < 12) {
      throw new Error("Set a strong super admin password in .env");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      organizationId: null,
      name: process.env.SUPER_ADMIN_NAME,
      email,
      password: hashedPassword,
      role: "super_admin",
      active: true,
    });

    console.log("Super admin created:", email);
  } catch (error) {
    console.error("Seed error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();