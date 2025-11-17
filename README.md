# IoT Platform - ESP32 Device Management

## Опис проєкту

Багатомовна IoT-платформа для підключення та керування ESP32-пристроями з веб-інтерфейсом у реальному часі.

## Реалізовані можливості

### Frontend (React + TypeScript)
- ✅ **Багатомовна підтримка** (українська, англійська, російська)  
- ✅ **Responsive дизайн** з темною tech-тематикою
- ✅ **PWA готовність** для мобільних пристроїв
- ✅ **Dashboard** з графіками телеметрії у реальному часі
- ✅ **Панель керування пристроями** з кнопками та слайдерами
- ✅ **Симуляція IoT даних** для демонстрації функціоналу

### Функціонал
- **Dashboard**: статистика пристроїв, графіки температури/вологості
- **Device Management**: керування ESP32 пристроями (помпи, освітлення, вентиляція, обігрівачі)
- **Real-time monitoring**: симуляція даних з датчиків
- **Responsive UI**: адаптивний дизайн для всіх пристроїв

## Технології

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Charts**: Recharts для візуалізації даних
- **Icons**: Lucide React
- **Internationalization**: react-i18next
- **Build**: Vite
- **UI Components**: shadcn/ui

## Швидкий старт

1. **Клонування репозиторію**
```bash
git clone <your-repo-url>
cd iot-platform
```

2. **Установка залежностей**
```bash
npm install
```

3. **Запуск у режимі розробки**
```bash
npm run dev
```

4. **Збірка для продакшн**
```bash
npm run build
```

## Наступні кроки

### Backend інтеграція
Для повної функціональності потрібно підключити **Supabase**:

- **Authentication** (email/password)
- **PostgreSQL** для зберігання користувачів та налаштувань
- **Real-time subscriptions** для живих даних
- **Edge Functions** для MQTT інтеграції

### MQTT інтеграція
```javascript
// Приклад MQTT топіків
grow/<user_id>/<device_id>/telemetry  // пристрій → сервер  
grow/<user_id>/<device_id>/command    // сервер → пристрій
grow/<user_id>/<device_id>/status     // online/offline
```

### ESP32 прошивка (приклад)
```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi та MQTT конфігурація
const char* ssid = "your-wifi";
const char* password = "your-password";
const char* mqtt_server = "your-mqtt-broker.com";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  // Підключення до WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  // Налаштування MQTT
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void callback(char* topic, byte* payload, unsigned int length) {
  // Обробка команд від сервера
  StaticJsonDocument<200> doc;
  deserializeJson(doc, payload, length);
  
  if (doc["command"] == "water_pump") {
    digitalWrite(WATER_PUMP_PIN, doc["value"]);
  }
  // ... інші команди
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Відправка телеметрії кожні 30 секунд
  static unsigned long lastMsg = 0;
  unsigned long now = millis();
  if (now - lastMsg > 30000) {
    lastMsg = now;
    sendTelemetry();
  }
}

void sendTelemetry() {
  StaticJsonDocument<200> doc;
  doc["temperature"] = 24.5;
  doc["humidity"] = 65;
  doc["soil_moisture"] = 72;
  doc["light_level"] = 85;
  doc["timestamp"] = millis();
  
  char jsonString[512];
  serializeJson(doc, jsonString);
  
  client.publish("grow/user123/device001/telemetry", jsonString);
}
```

## Структура проєкту

```
src/
├── components/           # React компоненти
│   ├── ui/              # Базові UI компоненти
│   ├── Header.tsx       # Заголовок з мовним перемикачем
│   ├── Navigation.tsx   # Бічна навігація
│   ├── Dashboard.tsx    # Головна панель
│   └── Devices.tsx      # Керування пристроями
├── i18n/               # Інтернаціоналізація
│   ├── locales/        # Переклади (uk, en, ru)
│   └── index.ts        # Конфігурація i18n
├── pages/              # Сторінки
└── lib/                # Утиліти

public/
└── manifest.json       # PWA маніфест
```

## Дизайн система

- **Кольори**: тьмно-синя/зелена техно-тематика
- **Акценти**: електричний синій (#2563eb) + зелений (#22c55e)
- **Градієнти**: використовуються для кнопок та карток
- **Анімації**: pulse-glow для онлайн статусів
- **Типографія**: сучасні шрифти з акцентом на читабельність

## Deployment

### Docker (рекомендовано)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Vercel/Netlify
```bash
npm run build
# Завантажити dist/ папку
```

## Ліцензія

MIT License - дивіться [LICENSE](LICENSE) для деталей.

## Контакти

Для питань та пропозицій створіть issue в цьому репозиторії.