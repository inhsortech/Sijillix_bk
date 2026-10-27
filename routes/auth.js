const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = req.body.password; 
    if (!email || typeof password !== "string") return res.status(400).json({ message: "Email and password required" });
    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.active || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign({ sub: user._id.toString(), organizationId: user.organizationId.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch { res.status(500).json({ message: "Login failed" }); }
});
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.sub, organizationId: req.user.organizationId }).select("name email role active");
    if (!user || !user.active) return res.status(401).json({ message: "Account unavailable" });
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch { res.status(500).json({ message: "Unable to load profile" }); }
});
module.exports = router;
