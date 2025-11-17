# Інтеграція ESP8266 з Grow Box Technology

## 📋 Огляд

Цей документ описує інтеграцію ESP8266 мікроконтролера з веб-платформою Grow Box Technology через Supabase Edge Functions.

## 🔌 Підключення пристрою

### Бібліотеки для Arduino IDE

```cpp
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
```

### Конфігурація WiFi

```cpp
const char* ssid = "ВАШ_WIFI_SSID";
const char* password = "ВАШ_WIFI_PASSWORD";

// API endpoint
const char* apiUrl = "https://ychnmaaximnoxvwnzrgs.supabase.co/functions/v1/device-api";
const char* deviceId = "УНІКАЛЬНИЙ_ID_ПРИСТРОЮ"; // Наприклад: "growbox_001"
```

### Ініціалізація сенсорів

```cpp
#define DHTPIN D4        // DHT22 на піні D4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

#define SOIL_PIN A0      // Датчик вологості ґрунту на A0
#define LIGHT_PIN D1     // Фоторезистор на D1
```

## 📤 Відправка даних на сервер

### Основний код для надсилання логів

```cpp
void sendSensorData() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    WiFiClient client;
    
    // Читання сенсорів
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    int soilMoisture = analogRead(SOIL_PIN);
    int lightLevel = analogRead(LIGHT_PIN);
    
    // Конвертація в відсотки
    int soilPercent = map(soilMoisture, 1024, 0, 0, 100);
    int lightPercent = map(lightLevel, 0, 1024, 0, 100);
    
    // Створення JSON
    StaticJsonDocument<256> doc;
    doc["device_id"] = deviceId;
    doc["temp"] = temperature;
    doc["hum"] = humidity;
    doc["soil_moisture"] = soilPercent;
    doc["light_level"] = lightPercent;
    doc["light_cycle_hours"] = 16; // Приклад фотоперіоду
    doc["irrigation_time"] = "00:00:30"; // Час останнього поливу
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Відправка POST запиту
    String url = String(apiUrl) + "/device/" + deviceId + "/log";
    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");
    
    int httpCode = http.POST(jsonString);
    
    if (httpCode > 0) {
      String response = http.getString();
      Serial.println("Response: " + response);
    } else {
      Serial.println("Error: " + String(httpCode));
    }
    
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  
  // Підключення до WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
}

void loop() {
  sendSensorData();
  checkDeviceControls(); // Перевірка команд керування
  delay(10000); // Відправка даних кожні 10 секунд
}
```

## 🎮 Отримання команд керування

### Функція для отримання налаштувань пристрою

```cpp
void checkDeviceControls() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    WiFiClient client;
    
    String url = String(apiUrl) + "/device/" + deviceId + "/settings";
    http.begin(client, url);
    
    int httpCode = http.GET();
    
    if (httpCode == 200) {
      String response = http.getString();
      
      StaticJsonDocument<512> doc;
      deserializeJson(doc, response);
      
      // Обробка керування
      JsonArray controls = doc["settings"]["device_controls"];
      
      for (JsonObject control : controls) {
        String controlName = control["control_name"];
        bool value = control["value"];
        int intensity = control["intensity"] | 0;
        
        if (controlName == "light") {
          digitalWrite(LIGHT_RELAY_PIN, value ? HIGH : LOW);
          analogWrite(LIGHT_PWM_PIN, map(intensity, 0, 100, 0, 255));
        }
        else if (controlName == "water_pump") {
          digitalWrite(PUMP_RELAY_PIN, value ? HIGH : LOW);
        }
        else if (controlName == "ventilation") {
          digitalWrite(FAN_RELAY_PIN, value ? HIGH : LOW);
          analogWrite(FAN_PWM_PIN, map(intensity, 0, 100, 0, 255));
        }
        else if (controlName == "heater") {
          digitalWrite(HEATER_RELAY_PIN, value ? HIGH : LOW);
        }
      }
    }
    
    http.end();
  }
}
```

## 🔧 Схема підключення

### Пініи ESP8266

```
D1 (GPIO5)  → Фоторезистор (через дільник напруги)
D2 (GPIO4)  → Реле освітлення
D3 (GPIO0)  → Реле водяної помпи
D4 (GPIO2)  → DHT22 (температура/вологість)
D5 (GPIO14) → Реле вентилятора
D6 (GPIO12) → Реле обігрівача
D7 (GPIO13) → PWM для вентилятора
D8 (GPIO15) → PWM для освітлення
A0          → Датчик вологості ґрунту
```

## 📊 Формат даних API

### POST `/device-api/device/{device_id}/log`

**Request Body:**
```json
{
  "device_id": "growbox_001",
  "temp": 24.5,
  "hum": 65.2,
  "soil_moisture": 45,
  "light_level": 80,
  "light_cycle_hours": 16,
  "irrigation_time": "00:00:30"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "device_id": "growbox_001",
    "temp": 24.5,
    "hum": 65.2,
    "created_at": "2025-10-25T12:00:00Z"
  }
}
```

### GET `/device-api/device/{device_id}/settings`

**Response:**
```json
{
  "settings": {
    "configuration": {},
    "device_controls": [
      {
        "control_name": "light",
        "value": true,
        "intensity": 80
      },
      {
        "control_name": "water_pump",
        "value": false,
        "intensity": 0
      }
    ]
  }
}
```

## 🚀 Розширення

### MQTT інтеграція (майбутнє)

Для більш надійного зв'язку можна інтегрувати MQTT:

```cpp
#include <PubSubClient.h>

const char* mqttServer = "mqtt.supabase.co";
const int mqttPort = 1883;

PubSubClient mqttClient(espClient);

void callback(char* topic, byte* payload, unsigned int length) {
  // Обробка команд через MQTT
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  StaticJsonDocument<256> doc;
  deserializeJson(doc, message);
  
  // Обробка команд
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    if (mqttClient.connect(deviceId)) {
      mqttClient.subscribe("devices/growbox_001/commands");
    }
  }
}
```

## ⚠️ Важливі зауваження

1. **Безпека**: Не зберігайте API ключі в коді. Використовуйте конфігураційний файл або EEPROM.
2. **Інтервал відправки**: Не відправляйте дані частіше ніж кожні 10 секунд, щоб не перевантажувати сервер.
3. **Обробка помилок**: Завжди перевіряйте статус WiFi та HTTP код перед обробкою відповіді.
4. **Watchdog**: Використовуйте watchdog timer для автоматичного перезавантаження в разі зависання.

## 📞 Підтримка

Для питань та підтримки:
- Telegram: @your_support
- Email: support@growbox.tech
- GitHub: https://github.com/your-repo
