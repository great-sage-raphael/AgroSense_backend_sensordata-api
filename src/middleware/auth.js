/**
 * API Key middleware — only applies to POST /api/sensor (ESP32 writes).
 * Your Next.js frontend reads data via GET, which is public.
 * To lock down GET routes too, apply this middleware globally in index.js.
 */
function apiKeyAuth(req, res, next) {
  const key = req.headers["x-api-key"];

  if (!key || key !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized — invalid or missing API key",
    });
  }

  next();
}

module.exports = apiKeyAuth;
