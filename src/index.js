require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const { initDB } = require("./db");
const sensorRoutes = require("./routes/sensor");

const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS ─────────────────────────────────────────────────────────────────────
// Allows your Next.js frontend to call this API from the browser.
// Add more origins to the array if needed (e.g. production domain).
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    // "https://your-production-site.com",  ← uncomment & edit for prod
  ],
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-API-Key"],
}));

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/sensor", sensorRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// ── Boot ──────────────────────────────────────────────────────────────────────
(async () => {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🚀  Sensor API running on http://localhost:${PORT}`);
    console.log(`📡  ESP32  → POST   http://localhost:${PORT}/api/sensor`);
    console.log(`🌐  Next.js→ GET    http://localhost:${PORT}/api/sensor`);
  });
})();
