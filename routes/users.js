
const router = require("express").Router();
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Organization = require("../models/Organization");
const auth = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

router.use(auth);

// LIST USERS
router.get("/", authorize("users:read"), async (req, res, next) => {
  try {
    let filter = {};

    // Super Admin can see users from all organizations
    if (req.user.role === "super_admin") {
      if (req.query.organizationId) {
        filter.organizationId = req.query.organizationId;
      }
    } else {
      // Other users can only see users from their organization
      filter.organizationId = req.user.organizationId;
    }

    const users = await User.find(filter)
      .select("-password")
      .populate("organizationId", "name code")
      .sort({ createdAt: -1 });

    const formattedUsers = users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      organizationId: user.organizationId?._id || null,
      organizationName: user.organizationId?.name || null,
    }));

    res.json({
      success: true,
      users: formattedUsers,
    });
  } catch (error) {
    next(error);
  }
});

// CREATE USER
router.post("/", authorize("users:create"), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const allowedRoles = ["admin", "manager", "employee"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    // SUPER ADMIN SELECTS ORGANIZATION
    let organizationId;

    if (req.user.role === "super_admin") {
      organizationId = req.body.organizationId;
    } else {
      // ORGANIZATION ADMIN USES OWN ORGANIZATION
      organizationId = req.user.organizationId;
    }

    if (!organizationId) {
      return res.status(400).json({
        message: "Please select an organization",
      });
    }

    const organization = await Organization.findOne({
      _id: organizationId,
      active: true,
    });

    if (!organization) {
      return res.status(404).json({
        message: "Organization not found or inactive",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await User.findOne({
      organizationId,
      email: normalizedEmail,
    });

    if (existing) {
      return res.status(409).json({
        message: "User already exists in this organization",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      organizationId,
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      active: true,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    next(error);
  }
});

// CHANGE ROLE OR ACCOUNT STATUS
// REPLACE your existing PATCH /:id endpoint with this

router.patch("/:id", authorize("users:update"), async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === "super_admin";

    const filter = { _id: req.params.id };

    // Organization admins can edit only users in their organization
    if (!isSuperAdmin) {
      filter.organizationId = req.user.organizationId;
    }

    const user = await User.findOne(filter);

    if (!user || user.role === "super_admin") {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const { name, email, password, role, active, organizationId } = req.body;

    // Update name
    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ message: "Name is required" });
      }
      user.name = String(name).trim();
    }

    // Update email
    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();

      const existing = await User.findOne({
        _id: { $ne: user._id },
        organizationId: user.organizationId,
        email: normalizedEmail,
      });

      if (existing) {
        return res.status(409).json({
          message: "Email already exists in this organization",
        });
      }

      user.email = normalizedEmail;
    }

    // Update password
    if (password !== undefined && password !== "") {
      if (password.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters",
        });
      }

      user.password = await bcrypt.hash(password, 12);
    }

    // Update role. Never allow ordinary user editing to create a Super Admin.
    if (role !== undefined) {
      const allowedRoles = ["admin", "manager", "viewer"];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      user.role = role;
    }

    if (typeof active === "boolean") {
      user.active = active;
    }

    // Only Super Admin can move a user to another organization
    if (organizationId !== undefined) {
      if (!isSuperAdmin) {
        return res.status(403).json({
          message: "Only Super Admin can change organization",
        });
      }

      const organization = await Organization.findOne({
        _id: organizationId,
        active: true,
      });

      if (!organization) {
        return res.status(404).json({
          message: "Organization not found or inactive",
        });
      }

      const duplicate = await User.findOne({
        _id: { $ne: user._id },
        organizationId,
        email: user.email,
      });

      if (duplicate) {
        return res.status(409).json({
          message: "Email already exists in the selected organization",
        });
      }

      user.organizationId = organizationId;
    }

    await user.save();

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
