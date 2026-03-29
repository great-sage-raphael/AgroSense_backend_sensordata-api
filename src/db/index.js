const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Create the sensor_readings table if it doesn't exist
async function initDB() {
  const query = `
    CREATE TABLE IF NOT EXISTS sensor_readings (
      id            SERIAL PRIMARY KEY,
      device_id     VARCHAR(64)   NOT NULL DEFAULT 'esp32',
      nitrogen      FLOAT,
      phosphorus    FLOAT,
      potassium     FLOAT,
      ph            FLOAT,
      conductivity  FLOAT,
      temperature   FLOAT,
      salinity      FLOAT,
      tds           FLOAT,
      moisture      FLOAT,
      created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_sensor_created_at
      ON sensor_readings (created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_sensor_device
      ON sensor_readings (device_id);
  `;
  await pool.query(query);
  console.log("✅  Database table ready");
}

module.exports = { pool, initDB };
