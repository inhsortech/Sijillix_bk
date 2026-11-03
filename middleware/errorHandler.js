function errorHandler(error, req, res, next) {
  console.error(error);

  if (error.code === 11000) {
    return res.status(409).json({
      message: "A record with these details already exists",
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: error.message,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID",
    });
  }

  res.status(500).json({
    message: "Internal server error",
  });
}

module.exports = errorHandler;