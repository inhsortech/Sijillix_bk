const router = require("express").Router();

const Document = require("../models/Document");
const auth = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

router.use(auth);

router.get("/", authorize("documents:read"), async (req, res, next) => {
  try {
    const documents = await Document.find({
      organizationId: req.user.organizationId,
    }).sort({ createdAt: -1 });

    res.json({ success: true, documents });
  } catch (error) {
    next(error);
  }
});

router.post("/", authorize("documents:create"), async (req, res, next) => {
  try {
    const { title, category, description, fileUrl, fileName, expiryDate } =
      req.body;

    if (!title) {
      return res.status(400).json({
        message: "Document title required",
      });
    }

    const document = await Document.create({
      organizationId: req.user.organizationId,
      title,
      category,
      description,
      fileUrl,
      fileName,
      expiryDate,
      uploadedBy: req.user.sub,
    });

    res.status(201).json({ success: true, document });
  } catch (error) {
    next(error);
  }
});

router.delete(
  "/:id",
  authorize("documents:delete"),
  async (req, res, next) => {
    try {
      const document = await Document.findOneAndDelete({
        _id: req.params.id,
        organizationId: req.user.organizationId,
      });

      if (!document) {
        return res.status(404).json({
          message: "Document not found",
        });
      }

      res.json({ success: true, message: "Document deleted" });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;