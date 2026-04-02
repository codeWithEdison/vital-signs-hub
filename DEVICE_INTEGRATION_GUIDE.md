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
const char* WIFI_SSID     = "Edison";
const char* WIFI_PASSWORD = "password";

const char* SUPABASE_URL  = "https://jyzzceseztsujhlvzzpv.supabase.co";
const char* SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5enpjZXNlenRzdWpobHZ6enB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzUwMDEsImV4cCI6MjA4OTg1MTAwMX0.hsnJrZTJJ1tM9T5jAebmbzZiIRzcV4kCNkI914di-rI";

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