
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const startExpiryJob = require("./jobs/expiryJob");

const app = express();

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

// ==========================================
// HEALTH CHECK
// ==========================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "docutrack-api",
  });
});

// ==========================================
// API ROUTES
// ==========================================
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
  }),
  require("./routes/auth")
);

app.use("/api/employees", require("./routes/employees"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/dashboard", require("./routes/dashboard"));

// ==========================================
// ROOT ROUTE
// ==========================================
app.get("/", (req, res) => {
  res.send("DocuTrack Server Running...");
});

// ==========================================
// 404 HANDLER
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      err.status && err.message
        ? err.message
        : "Internal server error",
  });
});

// ==========================================
// START SERVER
// ==========================================
async function startServer() {
  if (
    !process.env.MONGO_URI ||
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32
  ) {
    throw new Error(
      "Configure MONGO_URI and JWT_SECRET (at least 32 characters)"
    );
  }

  await connectDB();

  if (process.env.NODE_ENV === "production") {
    startExpiryJob();
  }

  const port = process.env.PORT || 5000;

  app.listen(port, () => {
    console.log(`DocuTrack API running on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error("Server startup failed:", err.message);
  process.exit(1);
});
