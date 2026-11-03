
const permissions = {
  super_admin: ["*"],

  admin: [
    "dashboard:read",

    "users:read",
    "users:create",
    "users:update",
    "users:delete",

    "employees:read",
    "employees:create",
    "employees:update",
    "employees:delete",

    "documents:read",
    "documents:create",
    "documents:update",
    "documents:delete",

    "tasks:read",
    "tasks:create",
    "tasks:update",
    "tasks:delete",

    "auditlogs:read",
  ],

  manager: [
    "dashboard:read",
    "employees:read",
    "employees:create",
    "employees:update",
    "documents:read",
    "documents:create",
    "documents:update",
    "tasks:read",
    "tasks:create",
    "tasks:update",
  ],

  viewer: [
    "dashboard:read",
    "employees:read",
    "documents:read",
    "tasks:read",
  ],
};

function authorize(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const allowed = permissions[req.user.role] || [];

    if (!allowed.includes("*") && !allowed.includes(permission)) {
      return res.status(403).json({
        message: "You do not have permission",
      });
    }

    next();
  };
}

module.exports = { authorize, permissions };
