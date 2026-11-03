const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Organization = require("../models/Organization");
const auth = require("../middleware/auth");

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ email })
      .select("+password");
console.log(user);

    if (!user || !user.active) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const matched = await bcrypt.compare(
      password,
      user.password
    ); 

    if (!matched) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.role === "super_admin") {
      // Platform admin does not belong to a company.
    } else {
      if (!user.organizationId) {
        return res.status(403).json({
          message: "Organization not assigned",
        });
      }

      const organization = await Organization.findOne({
        _id: user.organizationId,
        active: true,
      });

      if (!organization) {
        return res.status(403).json({
          message: "Organization is inactive or unavailable",
        });
      }
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        organizationId: user.organizationId
          ? user.organizationId.toString()
          : null,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    next(error);
  }
});


router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub)
      .select("name email role active organizationId");

    if (!user || !user.active) {
      return res.status(401).json({
        message: "Account unavailable",
      });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load profile",
    });
  } 
});


module.exports = router;