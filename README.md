# Sensor API — ESP32 → PostgreSQL → Next.js

A REST API built with **Node.js + Express + PostgreSQL** that receives soil/water sensor data from an ESP32 and exposes it to your Next.js frontend.

---

## Project Structure

```
sensor-api/
├── src/
│   ├── index.js                  # Express app entry point
│   ├── db/index.js               # PostgreSQL pool + table init
│   ├── routes/sensor.js          # Route definitions
│   ├── controllers/
│   │   └── sensorController.js   # All business logic
│   └── middleware/auth.js        # API key guard (for ESP32 writes)
├── esp32/
│   └── sensor_upload.ino         # Arduino firmware for ESP32
├── nextjs-integration/
│   └── lib/sensorApi.js          # Drop-in helper for your Next.js app
├── .env.example
└── package.json
```

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and a secure API key
```

### 3. Create the PostgreSQL database
```sql
CREATE DATABASE sensor_db;
```
The table (`sensor_readings`) is created automatically on first run.

### 4. Start the server
```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/sensor` | ✅ API Key | ESP32 pushes a new reading |
| `GET` | `/api/sensor` | ❌ Public | Paginated list of readings |
| `GET` | `/api/sensor/latest` | ❌ Public | Most recent single reading |
| `GET` | `/api/sensor/stats` | ❌ Public | Aggregated stats (avg/min/max) |
| `GET` | `/health` | ❌ Public | Server health check |
| `DELETE` | `/api/sensor/:id` | ✅ API Key | Delete a reading by ID |

### POST `/api/sensor` — ESP32 payload

```json
{
  "device_id":    "esp32-field-01",
  "nitrogen":     45.2,
  "phosphorus":   30.1,
  "potassium":    120.5,
  "ph":           6.8,
  "conductivity": 1.5,
  "temperature":  25.3,
  "salinity":     0.8,
  "tds":          720.0,
  "moisture":     55.0
}
```

**Required header:** `X-API-Key: your_secret_esp32_api_key`

### GET `/api/sensor` — Query params

| Param | Default | Description |
|-------|---------|-------------|
| `limit` | 50 | Max 500 |
| `offset` | 0 | For pagination |
| `device_id` | — | Filter by device |

### GET `/api/sensor/stats` — Query params

| Param | Default | Description |
|-------|---------|-------------|
| `hours` | 24 | Time window in hours |
| `device_id` | — | Filter by device |

---

## Connecting to Next.js

### 1. Add to `.env.local` in your Next.js project
```
NEXT_PUBLIC_SENSOR_API_URL=http://localhost:3001
```
In production, replace with your server's public URL.

### 2. Copy the helper
Copy `nextjs-integration/lib/sensorApi.js` to your Next.js project at `lib/sensorApi.js`.

### 3. Use in a Server Component (App Router)
```jsx
import { getLatestReading, getSensorStats } from "@/lib/sensorApi";

export default async function DashboardPage() {
  const latest = await getLatestReading();
  const stats  = await getSensorStats(24);

  return (
    <div>
      <h1>Soil Monitor</h1>
      <p>pH: {latest.ph}</p>
      <p>Temperature: {latest.temperature}°C</p>
      <p>Moisture: {latest.moisture}%</p>
      <p>Avg TDS (24h): {stats.avg_tds} ppm</p>
    </div>
  );
}
```

### 4. Live polling (Client Component)
```jsx
"use client";
import { useEffect, useState } from "react";
import { getLatestReading } from "@/lib/sensorApi";

export default function LiveCard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const refresh = () => getLatestReading().then(setData);
    refresh();
    const id = setInterval(refresh, 5000); // poll every 5s
    return () => clearInterval(id);
  }, []);

  if (!data) return <p>Loading...</p>;
  return <p>pH: {data.ph} | Moisture: {data.moisture}%</p>;
}
```

---

## ESP32 Setup

1. Open `esp32/sensor_upload.ino` in Arduino IDE
2. Install required libraries via Library Manager:
   - **ArduinoJson** by Benoit Blanchon
3. Fill in your WiFi credentials, server URL, and API key
4. Replace the mock `read*()` functions with your actual sensor library calls
5. Flash to your ESP32

---

## Production Deployment Tips

- Run behind **Nginx** as a reverse proxy with HTTPS
- Use **PM2** to keep the Node process alive: `pm2 start src/index.js --name sensor-api`
- Set `FRONTEND_URL` to your actual production Next.js domain in `.env`
- Store a strong random `API_KEY` (e.g. `openssl rand -hex 32`)
# AgroSense_backend_sensordata-api
