const { pool } = require("../db");

// POST /api/sensor
// Called by the ESP32 to push a new reading
async function createReading(req, res) {
  const {
    device_id = "esp32",
    nitrogen,
    phosphorus,
    potassium,
    ph,
    conductivity,
    temperature,
    salinity,
    tds,
    moisture,
  } = req.body;

  // Basic validation — at least one sensor value must be present
  const values = [nitrogen, phosphorus, potassium, ph, conductivity, temperature, salinity, tds, moisture];
  if (values.every((v) => v === undefined || v === null)) {
    return res.status(400).json({
      success: false,
      error: "Request body must contain at least one sensor value",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO sensor_readings
         (device_id, nitrogen, phosphorus, potassium, ph,
          conductivity, temperature, salinity, tds, moisture)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [device_id, nitrogen, phosphorus, potassium, ph,
       conductivity, temperature, salinity, tds, moisture]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("createReading error:", err);
    return res.status(500).json({ success: false, error: "Database error" });
  }
}

// GET /api/sensor
// Returns paginated readings, newest first
// Query params: limit (default 50), offset (default 0), device_id
async function getReadings(req, res) {
  const limit  = Math.min(parseInt(req.query.limit)  || 50, 500);
  const offset = parseInt(req.query.offset) || 0;
  const device = req.query.device_id;

  try {
    let query = `SELECT * FROM sensor_readings`;
    const params = [];

    if (device) {
      params.push(device);
      query += ` WHERE device_id = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Total count for pagination
    const countQuery = device
      ? `SELECT COUNT(*) FROM sensor_readings WHERE device_id = $1`
      : `SELECT COUNT(*) FROM sensor_readings`;
    const countResult = await pool.query(countQuery, device ? [device] : []);

    return res.json({
      success: true,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
      data: result.rows,
    });
  } catch (err) {
    console.error("getReadings error:", err);
    return res.status(500).json({ success: false, error: "Database error" });
  }
}

// GET /api/sensor/latest
// Returns the single most recent reading (useful for live dashboard widgets)
async function getLatestReading(req, res) {
  const device = req.query.device_id;

  try {
    let query = `SELECT * FROM sensor_readings`;
    const params = [];

    if (device) {
      params.push(device);
      query += ` WHERE device_id = $1`;
    }

    query += ` ORDER BY created_at DESC LIMIT 1`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "No readings found" });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("getLatestReading error:", err);
    return res.status(500).json({ success: false, error: "Database error" });
  }
}

// GET /api/sensor/stats
// Returns min/max/avg for each sensor field over a time window
// Query param: hours (default 24)
async function getStats(req, res) {
  const hours  = parseFloat(req.query.hours) || 24;
  const device = req.query.device_id;

  try {
    const params = [hours];
    let whereClause = `WHERE created_at >= NOW() - ($1 || ' hours')::INTERVAL`;

    if (device) {
      params.push(device);
      whereClause += ` AND device_id = $${params.length}`;
    }

    const query = `
      SELECT
        COUNT(*)                   AS total_readings,
        ROUND(AVG(nitrogen)::NUMERIC, 2)     AS avg_nitrogen,
        ROUND(AVG(phosphorus)::NUMERIC, 2)   AS avg_phosphorus,
        ROUND(AVG(potassium)::NUMERIC, 2)    AS avg_potassium,
        ROUND(AVG(ph)::NUMERIC, 2)           AS avg_ph,
        ROUND(MIN(ph)::NUMERIC, 2)           AS min_ph,
        ROUND(MAX(ph)::NUMERIC, 2)           AS max_ph,
        ROUND(AVG(conductivity)::NUMERIC, 2) AS avg_conductivity,
        ROUND(AVG(temperature)::NUMERIC, 2)  AS avg_temperature,
        ROUND(MIN(temperature)::NUMERIC, 2)  AS min_temperature,
        ROUND(MAX(temperature)::NUMERIC, 2)  AS max_temperature,
        ROUND(AVG(salinity)::NUMERIC, 2)     AS avg_salinity,
        ROUND(AVG(tds)::NUMERIC, 2)          AS avg_tds,
        ROUND(AVG(moisture)::NUMERIC, 2)     AS avg_moisture
      FROM sensor_readings
      ${whereClause}
    `;

    const result = await pool.query(query, params);
    return res.json({ success: true, window_hours: hours, data: result.rows[0] });
  } catch (err) {
    console.error("getStats error:", err);
    return res.status(500).json({ success: false, error: "Database error" });
  }
}

// DELETE /api/sensor/:id  (optional utility)
async function deleteReading(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM sensor_readings WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Reading not found" });
    }
    return res.json({ success: true, deleted_id: id });
  } catch (err) {
    console.error("deleteReading error:", err);
    return res.status(500).json({ success: false, error: "Database error" });
  }
}

module.exports = { createReading, getReadings, getLatestReading, getStats, deleteReading };
