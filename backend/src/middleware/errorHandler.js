function notFoundHandler(_req, res) {
  return res.status(404).json({ message: "Route not found" });
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    message: err.message || "Unexpected server error",
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
