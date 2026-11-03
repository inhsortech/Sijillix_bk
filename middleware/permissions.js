
const permissions = {
  super_admin: ["*"],

  admin: [
    "dashboard:read",
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
    "users:read",
    "users:create",
    "users:update",
    "users:delete",
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
    "auditlogs:read",
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
    const role = req.user?.role;

    if (!role || !permissions[role]) {
      return res.status(403).json({
        message: "Permission denied",
      });
    }

    const allowed = permissions[role];

    if (
      !allowed.includes("*") &&
      !allowed.includes(permission)
    ) {
      return res.status(403).json({
        message: "You do not have permission",
        requiredPermission: permission,
      });
    }

    next();
  };
}

module.exports = { permissions, authorize };
