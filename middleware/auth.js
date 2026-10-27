const jwt = require("jsonwebtoken");
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return res.status(401).json({ message: "Authentication required" });
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    if (!payload.sub || !payload.organizationId || !payload.role) return res.status(401).json({ message: "Invalid token" });
    req.user = payload;
    next();
  } catch { return res.status(401).json({ message: "Invalid or expired token" }); }
}
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: "Permission denied" });
  next();
};
module.exports = auth;
module.exports.requireRole = requireRole;
