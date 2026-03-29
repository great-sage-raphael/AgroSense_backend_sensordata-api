/**
 * ESP32 Sensor Upload Firmware
 * 
 * Libraries required (install via Arduino Library Manager):
 *   - ArduinoJson  (Benoit Blanchon)
 *   - WiFi         (built-in for ESP32)
 *   - HTTPClient   (built-in for ESP32)
 * 
 * Fill in your WiFi credentials, server URL, and API key below.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ── Configuration ─────────────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Your server URL — change to your actual IP/domain in production
const char* SERVER_URL    = "http://YOUR_SERVER_IP:3001/api/sensor";

// Must match API_KEY in your server's .env
const char* API_KEY       = "your_secret_esp32_api_key";

// How often to send data (milliseconds)
const unsigned long SEND_INTERVAL = 10000; // 10 seconds

// ── Globals ───────────────────────────────────────────────────────────────────
unsigned long lastSendTime = 0;

// ── Mock sensor read functions ────────────────────────────────────────────────
// Replace these with your actual sensor library calls

float readNitrogen()     { return 45.2;  } // mg/kg
float readPhosphorus()   { return 30.1;  } // mg/kg
float readPotassium()    { return 120.5; } // mg/kg
float readPH()           { return 6.8;   } // 0–14
float readConductivity() { return 1.5;   } // mS/cm
float readTemperature()  { return 25.3;  } // °C
float readSalinity()     { return 0.8;   } // ppt
float readTDS()          { return 720.0; } // ppm
float readMoisture()     { return 55.0;  } // %

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n✅ WiFi connected — IP: " + WiFi.localIP().toString());
}

// ── Main loop ─────────────────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  if (now - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = now;
    sendSensorData();
  }
}

// ── Send data to API ──────────────────────────────────────────────────────────
void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi disconnected, skipping send");
    return;
  }

  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["device_id"]    = "esp32-field-01"; // change per device
  doc["nitrogen"]     = readNitrogen();
  doc["phosphorus"]   = readPhosphorus();
  doc["potassium"]    = readPotassium();
  doc["ph"]           = readPH();
  doc["conductivity"] = readConductivity();
  doc["temperature"]  = readTemperature();
  doc["salinity"]     = readSalinity();
  doc["tds"]          = readTDS();
  doc["moisture"]     = readMoisture();

  String payload;
  serializeJson(doc, payload);

  // Send HTTP POST
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);

  int statusCode = http.POST(payload);

  if (statusCode == 201) {
    Serial.println("✅ Data sent successfully");
  } else {
    Serial.printf("❌ HTTP error: %d\n", statusCode);
    Serial.println(http.getString());
  }

  http.end();
}
