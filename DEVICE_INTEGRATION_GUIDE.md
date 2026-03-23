# 📡 ESP32 Device Integration Guide

> **How to connect IoT devices (ESP32) to the Smart Health Kiosk Dashboard**

---

## Architecture Overview

```
┌──────────────┐        HTTPS POST        ┌──────────────────┐        Realtime        ┌──────────────┐
│  ESP32 +     │  ───────────────────────► │  Supabase REST   │  ──────────────────►   │  Dashboard   │
│  Sensors     │    (JSON over WiFi)       │  API (PostgreSQL)│    (WebSocket)         │  (React App) │
└──────────────┘                           └──────────────────┘                        └──────────────┘
```

- **ESP32** reads sensors and sends data via HTTP POST to the database REST API.
- **Dashboard** subscribes to real-time changes and updates the UI automatically.
- **No backend server needed** — devices talk directly to the database API.

---

## 1. Database Table Schema

The `vitals` table stores all readings:

| Column          | Type        | Description                          |
|-----------------|-------------|--------------------------------------|
| `id`            | `uuid`      | Auto-generated primary key           |
| `temperature`   | `float`     | Body temperature in °C               |
| `heart_rate`    | `integer`   | Heart rate in bpm                    |
| `spo2`          | `integer`   | Blood oxygen saturation in %         |
| `status`        | `text`      | `SAFE`, `WARNING`, or `ALERT`        |
| `recommendation`| `text`      | Human-readable health recommendation |
| `created_at`    | `timestamp` | Auto-set to current time             |

---

## 2. Health Status Logic

The device (or the insert trigger) must evaluate the health status **before inserting**:

```
IF temperature > 38°C  OR  spo2 < 94%  →  ALERT    → "Visit the clinic immediately"
IF heart_rate > 100 bpm                 →  WARNING  → "Rest and monitor your condition"
OTHERWISE                               →  SAFE     → "You are in good health"
```

---

## 3. ESP32 Arduino Code

### Required Libraries

Install these via Arduino Library Manager:

- `WiFi.h` (built-in for ESP32)
- `HTTPClient.h` (built-in for ESP32)
- `ArduinoJson` (by Benoit Blanchon)

### Full ESP32 Sketch

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ============================================
// CONFIGURATION — UPDATE THESE VALUES
// ============================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Supabase project credentials (found in your project settings)
const char* SUPABASE_URL  = "https://<your-project-id>.supabase.co";
const char* SUPABASE_KEY  = "<your-anon-key>";  // Use the anon/public key

// Sensor pins (adjust based on your wiring)
const int TEMP_SENSOR_PIN = 34;   // e.g., MLX90614 or DS18B20
const int PULSE_SENSOR_PIN = 35;  // e.g., MAX30102 or pulse sensor
// SpO2 is typically read from the same MAX30102 module as heart rate

// Reading interval (milliseconds)
const unsigned long READING_INTERVAL = 30000; // 30 seconds

// ============================================
// HEALTH EVALUATION (mirrors dashboard logic)
// ============================================
struct HealthResult {
  String status;
  String recommendation;
};

HealthResult evaluateHealth(float temperature, int heartRate, int spo2) {
  HealthResult result;

  if (temperature > 38.0 || spo2 < 94) {
    result.status = "ALERT";
    result.recommendation = "Visit the clinic immediately";
  } else if (heartRate > 100) {
    result.status = "WARNING";
    result.recommendation = "Rest and monitor your condition";
  } else {
    result.status = "SAFE";
    result.recommendation = "You are in good health";
  }

  return result;
}

// ============================================
// SEND DATA TO SUPABASE
// ============================================
bool sendVitals(float temperature, int heartRate, int spo2) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return false;
  }

  // Evaluate health status
  HealthResult health = evaluateHealth(temperature, heartRate, spo2);

  // Build JSON payload
  JsonDocument doc;
  doc["temperature"] = temperature;
  doc["heart_rate"] = heartRate;
  doc["spo2"] = spo2;
  doc["status"] = health.status;
  doc["recommendation"] = health.recommendation;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  // Send HTTP POST to Supabase REST API
  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/vitals";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
  http.addHeader("Prefer", "return=minimal");

  int httpCode = http.POST(jsonPayload);

  if (httpCode == 201) {
    Serial.println("✅ Data sent successfully!");
    Serial.println("   Status: " + health.status);
  } else {
    Serial.print("❌ Error sending data. HTTP code: ");
    Serial.println(httpCode);
    Serial.println(http.getString());
  }

  http.end();
  return httpCode == 201;
}

// ============================================
// READ SENSORS (replace with your actual sensor code)
// ============================================
float readTemperature() {
  // Example: Replace with MLX90614 or DS18B20 library call
  // For MLX90614:
  //   #include <Adafruit_MLX90614.h>
  //   Adafruit_MLX90614 mlx = Adafruit_MLX90614();
  //   return mlx.readObjectTempC();

  // Placeholder — returns simulated value
  return 36.5 + (random(0, 30) / 10.0);
}

int readHeartRate() {
  // Example: Replace with MAX30102 library call
  // For MAX30105:
  //   #include "MAX30105.h"
  //   #include "heartRate.h"
  //   (see SparkFun MAX3010x library examples)

  // Placeholder — returns simulated value
  return 70 + random(0, 40);
}

int readSpO2() {
  // Example: Replace with MAX30102 SpO2 algorithm
  // Usually read alongside heart rate from the same sensor

  // Placeholder — returns simulated value
  return 94 + random(0, 6);
}

// ============================================
// SETUP & LOOP
// ============================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("=================================");
  Serial.println(" Smart Health Kiosk - ESP32");
  Serial.println("=================================");

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("   IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi connection failed!");
  }
}

void loop() {
  // Read sensor values
  float temperature = readTemperature();
  int heartRate = readHeartRate();
  int spo2 = readSpO2();

  // Print to serial monitor
  Serial.println("--- New Reading ---");
  Serial.printf("  Temp: %.1f°C | HR: %d bpm | SpO2: %d%%\n",
                temperature, heartRate, spo2);

  // Send to Supabase
  sendVitals(temperature, heartRate, spo2);

  // Wait before next reading
  delay(READING_INTERVAL);
}
```

---

## 4. Testing with cURL

You can test the API without an ESP32 using `curl`:

```bash
# Insert a SAFE reading
curl -X POST "https://<your-project-id>.supabase.co/rest/v1/vitals" \
  -H "apikey: <your-anon-key>" \
  -H "Authorization: Bearer <your-anon-key>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "temperature": 36.5,
    "heart_rate": 72,
    "spo2": 98,
    "status": "SAFE",
    "recommendation": "You are in good health"
  }'

# Insert a WARNING reading
curl -X POST "https://<your-project-id>.supabase.co/rest/v1/vitals" \
  -H "apikey: <your-anon-key>" \
  -H "Authorization: Bearer <your-anon-key>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "temperature": 37.2,
    "heart_rate": 105,
    "spo2": 97,
    "status": "WARNING",
    "recommendation": "Rest and monitor your condition"
  }'

# Insert an ALERT reading
curl -X POST "https://<your-project-id>.supabase.co/rest/v1/vitals" \
  -H "apikey: <your-anon-key>" \
  -H "Authorization: Bearer <your-anon-key>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "temperature": 39.1,
    "heart_rate": 88,
    "spo2": 91,
    "status": "ALERT",
    "recommendation": "Visit the clinic immediately"
  }'
```

---

## 5. Testing with JavaScript (Browser / Node.js)

```javascript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://<your-project-id>.supabase.co",
  "<your-anon-key>"
);

// Insert a reading
const { error } = await supabase.from("vitals").insert({
  temperature: 36.8,
  heart_rate: 75,
  spo2: 98,
  status: "SAFE",
  recommendation: "You are in good health",
});

if (error) console.error("Insert failed:", error);
else console.log("Reading inserted successfully!");
```

---

## 6. Recommended Sensors

| Sensor       | Measures               | Interface | Library                    |
|--------------|------------------------|-----------|----------------------------|
| MLX90614     | Contactless temperature| I2C       | `Adafruit_MLX90614`        |
| MAX30102     | Heart rate + SpO2      | I2C       | `SparkFun MAX3010x`        |
| DS18B20      | Contact temperature    | OneWire   | `DallasTemperature`        |
| Pulse Sensor | Heart rate (analog)    | Analog    | `PulseSensorPlayground`    |

### Wiring Example (MAX30102 + MLX90614)

```
ESP32           MAX30102        MLX90614
─────           ────────        ────────
3.3V  ────────► VIN      ────► VCC
GND   ────────► GND      ────► GND
GPIO 21 (SDA) ► SDA      ────► SDA
GPIO 22 (SCL) ► SCL      ────► SCL
```

> Both sensors use I2C and can share the same SDA/SCL lines.

---

## 7. Troubleshooting

| Problem                        | Solution                                                |
|--------------------------------|---------------------------------------------------------|
| `401 Unauthorized`             | Check your API key is correct and matches the anon key  |
| `404 Not Found`                | Verify the table name is `vitals` (case-sensitive)      |
| `400 Bad Request`              | Ensure JSON fields match the schema exactly              |
| WiFi won't connect             | Check SSID/password, ensure 2.4GHz network              |
| Data not appearing on dashboard| Check RLS policies allow INSERT; verify realtime is on  |
| Readings are delayed           | Reduce `READING_INTERVAL` or check network latency      |

---

## 8. Security Notes

- The **anon key** is a public key — safe to embed in ESP32 firmware.
- RLS (Row Level Security) policies on the `vitals` table allow:
  - **Anyone** can `INSERT` (for IoT devices without auth)
  - **Anyone** can `SELECT` (for the public dashboard)
- For production: consider adding an Edge Function with API key validation for device authentication.

---

## 9. Data Flow Summary

1. **ESP32** reads temperature, heart rate, SpO2 from sensors
2. **ESP32** evaluates health status using the same logic as the dashboard
3. **ESP32** sends HTTP POST with JSON payload to the REST API
4. **Database** stores the record in the `vitals` table
5. **Realtime** broadcasts the new INSERT to all connected clients
6. **Dashboard** receives the event and updates the UI instantly

---

*For questions or support, refer to the project codebase or open an issue.*
