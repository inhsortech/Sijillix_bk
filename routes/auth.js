const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");



router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = req.body.password;
 
    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email }).select("+password");
 

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }
 
    if (!user.active) {
      return res.status(401).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "Password hash not found for this user",
      });
    }

    // Compare password
    // const isMatch = await bcrypt.compare(password, user.password);
    const isMatch = password == user.password;
 

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    if (!user.organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization is not assigned to this user",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        sub: user._id.toString(),
        organizationId: user.organizationId.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
 
    
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

 
router.get("/me", auth, async (req, res) => {
  try { 
    const user = await User.findById( req.user.sub).select("name email role active");
 
    if (!user || !user.active) {
      return res.status(401).json({
        message: "Account unavailable",
      });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Unable to load profile",
    });
  }
});

module.exports = router;
