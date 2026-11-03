const router = require("express").Router();

const Organization = require("../models/Organization");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

router.use(auth);
router.use(authorize("organizations:manage"));

// CREATE ORGANIZATION
router.post("/", async (req, res, next) => {
  try {
    const { name, code, email, phone, address } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        message: "Organization name and code required",
      });
    }

    const organization = await Organization.create({
      name,
      code: code.toUpperCase().trim(),
      email,
      phone,
      address,
    });

    res.status(201).json({
      success: true,
      organization,
    });
  } catch (error) {
    next(error);
  }
});

// LIST ORGANIZATIONS
router.get("/", async (req, res, next) => {
  try {
    const organizations = await Organization.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      organizations,
    });
  } catch (error) {
    next(error);
  }
});

// UPDATE ORGANIZATION DETAILS
// UPDATE ORGANIZATION DETAILS
router.patch("/:id", async (req, res, next) => {
  try {
    const { name, code, email, phone, address, country } = req.body;

    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message: "Organization name cannot be empty",
        });
      }

      updates.name = name.trim();
    }

    if (code !== undefined) {
      if (!code.trim()) {
        return res.status(400).json({
          message: "Organization code cannot be empty",
        });
      }

      updates.code = code.trim().toUpperCase();
    }

    if (email !== undefined) {
      updates.email = email.trim().toLowerCase();
    }

    if (phone !== undefined) {
      updates.phone = phone.trim();
    }

    if (address !== undefined) {
      updates.address = address.trim();
    }

    if (country !== undefined) {
      updates.country = country.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No organization details provided",
      });
    }

    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!organization) {
      return res.status(404).json({
        message: "Organization not found",
      });
    }

    return res.json({
      success: true,
      message: "Organization updated successfully",
      organization,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Organization code already exists",
      });
    }

    next(error);
  }
});


// ACTIVATE / DEACTIVATE ORGANIZATION
router.patch("/:id/status", async (req, res, next) => {
  try {
    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      { active: Boolean(req.body.active) },
      { new: true, runValidators: true }
    );

    if (!organization) {
      return res.status(404).json({
        message: "Organization not found",
      });
    }

    res.json({ success: true, organization });
  } catch (error) {
    next(error);
  }
});

module.exports = router;