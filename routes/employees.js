
const router = require("express").Router();

const mongoose = require("mongoose");

const Employee = require("../models/Employee");
const AuditLog = require("../models/AuditLog");

const { requireRole } = require("../middleware/auth");
const auth = require("../middleware/auth");

router.use(auth);

// Allowed employee fields
const employeeFields = [
  "employeeId",
  "name",
  "email",
  "phone",
  "department",
  "branch",
  "nationality",
  "jobTitle",
  "joinDate",
  "status",
];

// Prepare employee data
const getEmployeeData = (body) => {
  const data = {};

  employeeFields.forEach((field) => {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  });

  return data;
};

// Audit log helper
const createAuditLog = async (req, action, employee) => {
  await AuditLog.create({
    organizationId: req.user.organizationId,
    userId: req.user.sub,
    action,
    entityType: "Employee",
    entityId: employee._id.toString(),
  });
};

// GET ALL EMPLOYEES
// GET /api/employees?page=1&limit=20&search=kamleen

router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const filter = {
      organizationId: req.user.organizationId,
    };

    if (req.query.search) {
      const search = String(req.query.search)
        .slice(0, 80)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Employee.countDocuments(filter),
    ]);

    res.json({
      success: true,
      employees,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (err) {
    console.error("Get employees error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
    });
  }
});
 
// CREATE EMPLOYEE
// POST /api/employees

router.post(
  "/",
  requireRole("owner", "admin", "hr"),
  async (req, res) => {
    console.log(req);
    try {
      const { employeeId, name } = req.body;

      if (!employeeId || !name) {
        return res.status(400).json({
          success: false,
          message: "Employee ID and name are required",
        });
      }

      const organizationId = req.user.organizationId;

      if (!organizationId) {
        return res.status(403).json({
          success: false,
          message: "User is not associated with a company",
        });
      }

      // Create employee
      const employee = await Employee.create({
        ...getEmployeeData(req.body),
        organizationId,
      });

      // Create audit log
      await createAuditLog(
        req,
        "employee.created",
        employee
      );

      // Return newly created employee
      return res.status(201).json({
        success: true,
        message: "Employee added successfully",
        employee,
      });

    } catch (err) {
      console.error("Create employee error:", err);

      return res.status(
        err.code === 11000 ? 409 : 400
      ).json({
        success: false,
        message:
          err.code === 11000
            ? "Employee ID already exists in this company"
            : err.message || "Failed to create employee",
      });
    }
  }
);
// GET SINGLE EMPLOYEE
// GET /api/employees/:id

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await Employee.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      employee,
    });

  } catch (err) {
    console.error("Get employee error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch employee",
    });
  }
});

// UPDATE EMPLOYEE
// PUT /api/employees/:id

router.put(
  "/:id",
  requireRole("owner", "admin", "hr"),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }

      const updateData = getEmployeeData(req.body);

      const employee = await Employee.findOneAndUpdate(
        {
          _id: req.params.id,
          organizationId: req.user.organizationId,
        },
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      await createAuditLog(
        req,
        "employee.updated",
        employee
      );

      res.json({
        success: true,
        message: "Employee updated successfully",
        employee,
      });

    } catch (err) {
      console.error("Update employee error:", err);

      res.status(err.code === 11000 ? 409 : 400).json({
        success: false,
        message:
          err.code === 11000
            ? "Employee ID already exists in this company"
            : err.message || "Failed to update employee",
      });
    }
  }
);

// DELETE EMPLOYEE
// DELETE /api/employees/:id

router.delete(
  "/:id",
  requireRole("owner", "admin"),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }

      const employee = await Employee.findOneAndDelete({
        _id: req.params.id,
        organizationId: req.user.organizationId,
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      await createAuditLog(
        req,
        "employee.deleted",
        employee
      );

      res.json({
        success: true,
        message: "Employee deleted successfully",
      });

    } catch (err) {
      console.error("Delete employee error:", err);

      res.status(500).json({
        success: false,
        message: "Failed to delete employee",
      });
    }
  }
);

module.exports = router;
