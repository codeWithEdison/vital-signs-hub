# 📡 ESP32 Device Integration Guide

> **How to connect your IoT hardware to the Smart Health Kiosk Dashboard**

---

## Hardware Components

| Component                        | Role                              |
|----------------------------------|-----------------------------------|
| **ESP32**                        | Main microcontroller (WiFi)       |
| **MAX30205**                     | Body temperature sensor (I2C)     |
| **MAX30102**                     | Heart rate + SpO₂ sensor (I2C)    |
| **Ultrasonic Sensor (HC-SR04)**  | Presence/proximity detection      |
| **Breadboard 830pt + Jumpers**   | Prototyping connections           |

---

## Architecture Overview

```
                                 HTTPS POST
┌─────────────────────┐        (JSON / WiFi)        ┌──────────────┐       Realtime        ┌──────────────┐
│  ESP32              │  ──────────────────────────► │  Database    │  ───────────────────►  │  Dashboard   │
│  ├─ MAX30205 (Temp) │                              │  REST API    │     (WebSocket)       │  (React App) │
│  ├─ MAX30102 (HR/O₂)│                              └──────────────┘                       └──────────────┘
│  └─ Ultrasonic (Det)│
└─────────────────────┘
```

1. **Ultrasonic sensor** detects a person standing at the kiosk
2. **MAX30205** reads body temperature via I2C
3. **MAX30102** reads heart rate and SpO₂ via I2C
4. **ESP32** evaluates health status, sends JSON to the REST API
5. **Dashboard** receives real-time update and displays results

---

## Wiring Diagram

```
ESP32 Pin        Sensor              Pin
──────────       ──────              ───
3.3V  ─────────► MAX30205            VIN
3.3V  ─────────► MAX30102            VIN
5V    ─────────► Ultrasonic          VCC
GND   ─────────► MAX30205            GND
GND   ─────────► MAX30102            GND
GND   ─────────► Ultrasonic          GND
GPIO 21 (SDA) ─► MAX30205 SDA ──┐
                  MAX30102 SDA ──┘   (shared I2C bus)
GPIO 22 (SCL) ─► MAX30205 SCL ──┐
                  MAX30102 SCL ──┘   (shared I2C bus)
GPIO 12 ───────► Ultrasonic          TRIG
GPIO 13 ◄─────── Ultrasonic          ECHO
```

> **Note:** MAX30205 and MAX30102 both use I2C and have different addresses, so they share the same SDA/SCL lines. No address conflict.
>
> - MAX30205 default I2C address: `0x48`
> - MAX30102 default I2C address: `0x57`

---

## Required Arduino Libraries

Install via **Arduino IDE → Library Manager**:

| Library                         | For               | Author          |
|---------------------------------|-------------------|-----------------|
| `Protocentral MAX30205`         | Temperature       | Protocentral    |
| `SparkFun MAX3010x`             | Heart rate + SpO₂ | SparkFun        |
| `ArduinoJson`                   | JSON serialization| Benoit Blanchon |
| `WiFi` (built-in)               | Network           | Espressif       |
| `HTTPClient` (built-in)         | HTTP requests     | Espressif       |
| `Wire` (built-in)               | I2C bus           | Arduino         |

---

## Database Schema

The `vitals` table stores all readings:

| Column          | Type        | Default                    | Description                        |
|-----------------|-------------|----------------------------|------------------------------------|
| `id`            | `uuid`      | auto-generated             | Primary key                        |
| `temperature`   | `float`     | —                          | Body temperature in °C             |
| `heart_rate`    | `integer`   | —                          | Heart rate in bpm                  |
| `spo2`          | `integer`   | —                          | Blood oxygen saturation %          |
| `status`        | `text`      | `'SAFE'`                   | `SAFE` / `WARNING` / `ALERT`      |
| `recommendation`| `text`      | `'You are in good health'` | Health advice                      |
| `created_at`    | `timestamp` | `now()`                    | Auto-set on insert                 |

---

## Health Status Logic

Evaluate **on the ESP32 before sending**:

```
IF  temperature > 38.0°C  OR  spo2 < 94%   →  ALERT    →  "Visit the clinic immediately"
IF  heart_rate > 100 bpm                    →  WARNING  →  "Rest and monitor your condition"
OTHERWISE                                   →  SAFE     →  "You are in good health"
```

---

## Full ESP32 Arduino Sketch

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "Protocentral_MAX30205.h"
#include "MAX30105.h"
#include "heartRate.h"
#include "spo2_algorithm.h"

// =============================================
// CONFIGURATION — UPDATE THESE VALUES
// =============================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

const char* SUPABASE_URL  = "https://<your-project-id>.supabase.co";
const char* SUPABASE_KEY  = "<your-anon-key>";

// Ultrasonic sensor pins
const int TRIG_PIN = 12;
const int ECHO_PIN = 13;

// Presence detection threshold (cm)
const float PRESENCE_DISTANCE = 50.0;

// Reading interval after detection (ms)
const unsigned long READING_DELAY = 5000;

// =============================================
// SENSOR OBJECTS
// =============================================
MAX30205 tempSensor;
MAX30105 particleSensor;

// =============================================
// HEALTH EVALUATION
// =============================================
struct HealthResult {
  String status;
  String recommendation;
};

HealthResult evaluateHealth(float temp, int hr, int spo2) {
  HealthResult result;
  if (temp > 38.0 || spo2 < 94) {
    result.status = "ALERT";
    result.recommendation = "Visit the clinic immediately";
  } else if (hr > 100) {
    result.status = "WARNING";
    result.recommendation = "Rest and monitor your condition";
  } else {
    result.status = "SAFE";
    result.recommendation = "You are in good health";
  }
  return result;
}

// =============================================
// ULTRASONIC — PRESENCE DETECTION
// =============================================
float getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // timeout 30ms
  if (duration == 0) return 999.0;
  return (duration * 0.0343) / 2.0; // cm
}

bool isPersonPresent() {
  float dist = getDistance();
  Serial.printf("  Ultrasonic distance: %.1f cm\n", dist);
  return dist > 0 && dist < PRESENCE_DISTANCE;
}

// =============================================
// READ TEMPERATURE (MAX30205)
// =============================================
float readTemperature() {
  float temp = tempSensor.getTemperature();
  Serial.printf("  MAX30205 Temp: %.2f °C\n", temp);
  return temp;
}

// =============================================
// READ HEART RATE & SPO2 (MAX30102)
// =============================================
struct PulseOxResult {
  int heartRate;
  int spo2;
  bool valid;
};

PulseOxResult readPulseOx() {
  PulseOxResult result = {0, 0, false};

  const int BUFFER_LENGTH = 100;
  uint32_t irBuffer[BUFFER_LENGTH];
  uint32_t redBuffer[BUFFER_LENGTH];

  // Collect samples
  for (int i = 0; i < BUFFER_LENGTH; i++) {
    while (!particleSensor.available())
      particleSensor.check();

    redBuffer[i] = particleSensor.getRed();
    irBuffer[i] = particleSensor.getIR();
    particleSensor.nextSample();
  }

  // Calculate HR and SpO2
  int32_t spo2Val;
  int8_t spo2Valid;
  int32_t hrVal;
  int8_t hrValid;

  maxim_heart_rate_and_oxygen_saturation(
    irBuffer, BUFFER_LENGTH,
    redBuffer,
    &spo2Val, &spo2Valid,
    &hrVal, &hrValid
  );

  if (hrValid && spo2Valid) {
    result.heartRate = hrVal;
    result.spo2 = spo2Val;
    result.valid = true;
    Serial.printf("  MAX30102 HR: %d bpm | SpO2: %d%%\n", hrVal, spo2Val);
  } else {
    Serial.println("  MAX30102: Invalid reading — finger may not be placed correctly");
  }

  return result;
}

// =============================================
// SEND DATA TO DATABASE
// =============================================
bool sendVitals(float temperature, int heartRate, int spo2) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return false;
  }

  HealthResult health = evaluateHealth(temperature, heartRate, spo2);

  JsonDocument doc;
  doc["temperature"] = round(temperature * 10.0) / 10.0; // 1 decimal
  doc["heart_rate"]  = heartRate;
  doc["spo2"]        = spo2;
  doc["status"]      = health.status;
  doc["recommendation"] = health.recommendation;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/vitals";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
  http.addHeader("Prefer", "return=minimal");

  int httpCode = http.POST(jsonPayload);

  if (httpCode == 201) {
    Serial.println("  ✅ Sent! Status: " + health.status);
  } else {
    Serial.printf("  ❌ HTTP Error %d: %s\n", httpCode, http.getString().c_str());
  }

  http.end();
  return httpCode == 201;
}

// =============================================
// SETUP
// =============================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("========================================");
  Serial.println("  Smart Health Kiosk — ESP32 Controller");
  Serial.println("========================================");

  // Ultrasonic pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // I2C init
  Wire.begin(21, 22);

  // MAX30205 init
  tempSensor.begin();
  Serial.println("✅ MAX30205 (Temperature) ready");

  // MAX30102 init
  if (particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    particleSensor.setup(60, 4, 2, 100, 411, 4096);
    Serial.println("✅ MAX30102 (HR/SpO2) ready");
  } else {
    Serial.println("❌ MAX30102 not found! Check wiring.");
  }

  // WiFi connect
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n❌ WiFi failed — will retry in loop");
  }
}

// =============================================
// MAIN LOOP
// =============================================
void loop() {
  Serial.println("\n--- Checking for presence ---");

  if (!isPersonPresent()) {
    Serial.println("  No person detected. Waiting...");
    delay(2000);
    return;
  }

  Serial.println("  👤 Person detected! Reading vitals...");
  delay(READING_DELAY); // Allow user to place finger on MAX30102

  // Read sensors
  float temperature = readTemperature();
  PulseOxResult pulseOx = readPulseOx();

  if (!pulseOx.valid) {
    Serial.println("  ⚠️ Could not get valid HR/SpO2. Skipping.");
    delay(3000);
    return;
  }

  // Send to database
  Serial.println("  📡 Sending to dashboard...");
  sendVitals(temperature, pulseOx.heartRate, pulseOx.spo2);

  // Cooldown before next reading
  Serial.println("  ⏳ Cooldown 30s...");
  delay(30000);
}
```

---

## Testing Without Hardware

### Using cURL

```bash
# SAFE reading
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

# WARNING reading
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

# ALERT reading
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

### Using JavaScript

```javascript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://<your-project-id>.supabase.co",
  "<your-anon-key>"
);

const { error } = await supabase.from("vitals").insert({
  temperature: 36.8,
  heart_rate: 75,
  spo2: 98,
  status: "SAFE",
  recommendation: "You are in good health",
});

if (error) console.error("Insert failed:", error);
else console.log("Reading sent!");
```

---

## Troubleshooting

| Problem                          | Solution                                                    |
|----------------------------------|-------------------------------------------------------------|
| `401 Unauthorized`               | Verify the anon API key is correct                          |
| `404 Not Found`                  | Table name must be exactly `vitals`                         |
| MAX30102 not detected            | Check I2C wiring (SDA→21, SCL→22), ensure 3.3V power       |
| MAX30205 reads 0 or garbage      | Confirm I2C address `0x48`, check solder joints             |
| Ultrasonic reads 999             | Verify TRIG/ECHO pins, ensure 5V power                     |
| Invalid HR/SpO2 readings         | User must place finger firmly on MAX30102 sensor window     |
| Dashboard not updating           | Confirm realtime is enabled on the `vitals` table           |
| WiFi won't connect               | ESP32 only supports **2.4GHz** networks                    |

---

## Data Flow Summary

```
1. Ultrasonic detects person → triggers reading
2. MAX30205 reads temperature (I2C, address 0x48)
3. MAX30102 reads heart rate + SpO₂ (I2C, address 0x57)
4. ESP32 evaluates health status locally
5. ESP32 sends HTTP POST (JSON) to REST API
6. Database stores record in `vitals` table
7. Realtime broadcasts INSERT to all connected clients
8. Dashboard updates instantly with new reading
```

---

## Security Notes

- The **anon key** is a publishable key — safe to embed in firmware.
- RLS policies allow public INSERT and SELECT on `vitals`.
- For production, consider adding an Edge Function to validate device payloads.

---

*University of Rwanda — Smart Health Kiosk Project*
