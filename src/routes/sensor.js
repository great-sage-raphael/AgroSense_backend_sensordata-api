const express  = require("express");
const router   = express.Router();
const auth     = require("../middleware/auth");
const {
  createReading,
  getReadings,
  getLatestReading,
  getStats,
  deleteReading,
} = require("../controllers/sensorController");

// ── ESP32 write  ─────────────────────────────────────────────────────────────
// Protected by API key — add X-API-Key header in your ESP32 firmware
router.post("/",        auth, createReading);

// ── Next.js frontend reads (public) ─────────────────────────────────────────
router.get("/",         getReadings);       // paginated list
router.get("/latest",   getLatestReading);  // single latest reading
router.get("/stats",    getStats);          // aggregated stats

// ── Utility ──────────────────────────────────────────────────────────────────
router.delete("/:id",   auth, deleteReading);

module.exports = router;
