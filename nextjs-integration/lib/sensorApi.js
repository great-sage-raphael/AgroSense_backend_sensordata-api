/**
 * lib/sensorApi.js
 * 
 * Drop this file into your Next.js project at /lib/sensorApi.js
 * Set NEXT_PUBLIC_SENSOR_API_URL in your Next.js .env.local:
 *   NEXT_PUBLIC_SENSOR_API_URL=http://localhost:3001
 */

const BASE = process.env.NEXT_PUBLIC_SENSOR_API_URL || "http://localhost:3001";

/**
 * Fetch the latest single reading.
 * Great for a live "current status" card on your dashboard.
 */
export async function getLatestReading(deviceId) {
  const url = new URL(`${BASE}/api/sensor/latest`);
  if (deviceId) url.searchParams.set("device_id", deviceId);

  const res = await fetch(url.toString(), { next: { revalidate: 10 } }); // ISR every 10s
  if (!res.ok) throw new Error(`Failed to fetch latest reading: ${res.status}`);
  const json = await res.json();
  return json.data;
}

/**
 * Fetch a paginated list of readings.
 * @param {object} opts - { limit, offset, deviceId }
 */
export async function getReadings({ limit = 50, offset = 0, deviceId } = {}) {
  const url = new URL(`${BASE}/api/sensor`);
  url.searchParams.set("limit", limit);
  url.searchParams.set("offset", offset);
  if (deviceId) url.searchParams.set("device_id", deviceId);

  const res = await fetch(url.toString(), { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Failed to fetch readings: ${res.status}`);
  return res.json(); // { success, total, limit, offset, data: [] }
}

/**
 * Fetch aggregated stats over a time window.
 * @param {number} hours - How many hours back to look (default 24)
 */
export async function getSensorStats(hours = 24, deviceId) {
  const url = new URL(`${BASE}/api/sensor/stats`);
  url.searchParams.set("hours", hours);
  if (deviceId) url.searchParams.set("device_id", deviceId);

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  const json = await res.json();
  return json.data;
}

/**
 * Client-side polling hook example (use in a "use client" component).
 * 
 * import { useEffect, useState } from "react";
 * import { getLatestReading } from "@/lib/sensorApi";
 * 
 * export function useLiveReading(intervalMs = 5000) {
 *   const [reading, setReading] = useState(null);
 *   useEffect(() => {
 *     const refresh = async () => setReading(await getLatestReading());
 *     refresh();
 *     const id = setInterval(refresh, intervalMs);
 *     return () => clearInterval(id);
 *   }, [intervalMs]);
 *   return reading;
 * }
 */
