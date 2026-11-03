const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = header.slice(7);

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(payload.sub)
      .select("name email role organizationId active");

    if (!user || !user.active) {
      return res.status(401).json({
        message: "Account unavailable",
      });
    }

    if (user.role !== payload.role) {
      return res.status(401).json({
        message: "Account permissions changed. Login again.",
      });
    }

    if (
      user.role !== "super_admin" &&
      String(user.organizationId) !==
        String(payload.organizationId)
    ) {
      return res.status(401).json({
        message: "Invalid organization session",
      });
    }

    req.user = {
      sub: user._id.toString(),
      organizationId: user.organizationId
        ? user.organizationId.toString()
        : null,
      role: user.role,
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    next(error);
  }
}

module.exports = auth;