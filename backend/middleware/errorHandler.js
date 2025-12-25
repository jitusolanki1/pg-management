export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err)

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      details: Object.values(err.errors).map((e) => e.message),
    })
  }

  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid ID format" })
  }

  if (err.code === 11000) {
    return res.status(400).json({ error: "Duplicate entry found" })
  }

  res.status(err.statusCode || 500).json({
    error: err.message || "Internal server error",
  })
}
