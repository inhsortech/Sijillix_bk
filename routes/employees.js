const router = require("express").Router();

const Employee = require("../models/Employee");
const auth = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

router.use(auth);

// GET
router.get("/", authorize("employees:read"), async (req, res, next) => {
  try {
    const employees = await Employee.find({
      organizationId: req.user.organizationId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      employees,
      total: employees.length,
    });
  } catch (error) {
    next(error);
  }
});

// CREATE
router.post("/", authorize("employees:create"), async (req, res, next) => {
  try {
    const {
      employeeId, name, email, phone,
      department, branch, nationality, jobTitle, joinDate,
    } = req.body;

    if (!employeeId || !name) {
      return res.status(400).json({
        message: "Employee ID and name required",
      });
    }

    const employee = await Employee.create({
      organizationId: req.user.organizationId,
      employeeId,
      name,
      email,
      phone,
      department,
      branch,
      nationality,
      jobTitle,
      joinDate,
    });

    res.status(201).json({
      success: true,
      employee,
    });
  } catch (error) {
    next(error);
  }
});

// UPDATE
router.put("/:id", authorize("employees:update"), async (req, res, next) => {
  try {
    const allowedFields = [
      "name", "email", "phone", "department",
      "branch", "nationality", "jobTitle", "joinDate", "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const employee = await Employee.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: req.user.organizationId,
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    res.json({ success: true, employee });
  } catch (error) {
    next(error);
  }
});

// DELETE
router.delete("/:id", authorize("employees:delete"), async (req, res, next) => {
  try {
    const employee = await Employee.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      message: "Employee deleted",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;