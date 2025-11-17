# 🚀 Посібник з розгортання Grow Box Technology

## 📋 Зміст

1. [Огляд архітектури](#огляд-архітектури)
2. [Розгортання на Lovable](#розгортання-на-lovable)
3. [Конфігурація Supabase](#конфігурація-supabase)
4. [Тестування](#тестування)
5. [Моніторинг](#моніторинг)

## 🏗️ Огляд архітектури

### Технологічний стек

**Frontend:**
- React 18.3 + TypeScript
- Vite (build tool)
- TailwindCSS (стилізація)
- shadcn/ui (UI компоненти)
- Recharts (графіки)
- React Router (маршрутизація)

**Backend:**
- Supabase (база даних + аутентифікація)
- Edge Functions (Deno runtime)
- PostgreSQL (RLS policies)
- Realtime subscriptions

**IoT:**
- ESP8266 мікроконтролери
- REST API комунікація
- JSON протокол

### Структура проєкту

```
grow-box-technology/
├── src/
│   ├── components/        # React компоненти
│   │   ├── DeviceCard.tsx
│   │   ├── DeviceControls.tsx
│   │   ├── LogsTable.tsx
│   │   └── ui/            # UI компоненти (shadcn)
│   ├── hooks/             # Custom React hooks
│   │   ├── useDevices.tsx
│   │   ├── useDeviceLogs.tsx
│   │   └── useDeviceControls.tsx
│   ├── pages/             # Сторінки додатку
│   │   ├── Index.tsx      # Dashboard
│   │   ├── DeviceDetail.tsx
│   │   └── Auth.tsx
│   ├── integrations/      # Інтеграції
│   │   └── supabase/      # Supabase клієнт
│   └── i18n/              # Інтернаціоналізація
├── supabase/
│   ├── functions/         # Edge Functions
│   │   ├── device-api/
│   │   ├── confirm-device/
│   │   ├── generate-qr/
│   │   └── notification-system/
│   └── migrations/        # SQL міграції
└── public/                # Статичні файли
```

## 🌐 Розгортання на Lovable

### Крок 1: Публікація проєкту

1. Відкрийте проєкт на [Lovable](https://grow-box-technology.lovable.app/)
2. Натисніть кнопку **"Publish"** у правому верхньому куті
3. Оберіть домен:
   - **Subdomain Lovable**: `your-project.lovable.app` (безкоштовно)
   - **Custom domain**: Підключіть власний домен (потрібен платний план)

### Крок 2: Налаштування змінних оточення

Lovable автоматично налаштовує змінні з `.env`:

```env
VITE_SUPABASE_URL=https://ychnmaaximnoxvwnzrgs.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### Крок 3: Автоматичне розгортання

Lovable автоматично:
- ✅ Збирає React додаток (Vite)
- ✅ Розгортає Edge Functions на Supabase
- ✅ Налаштовує CDN для статичних файлів
- ✅ Увімкнює HTTPS сертифікати

### Крок 4: Перевірка

Після публікації перевірте:
- [ ] Сайт доступний за URL
- [ ] Авторизація працює
- [ ] Dashboard показує пристрої
- [ ] Графіки відображаються
- [ ] Realtime оновлення працюють

## 🗄️ Конфігурація Supabase

### База даних

#### Основні таблиці

1. **devices** - Пристрої користувачів
```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'grow_box',
  status TEXT DEFAULT 'offline',
  location TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

2. **device_logs** - Логи сенсорів
```sql
CREATE TABLE device_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  temp DOUBLE PRECISION,
  hum DOUBLE PRECISION,
  soil_moisture DOUBLE PRECISION,
  light_level DOUBLE PRECISION,
  light_cycle_hours INTEGER,
  irrigation_time TIME,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

3. **device_controls** - Керування пристроями
```sql
CREATE TABLE device_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  control_name TEXT NOT NULL,
  control_type TEXT NOT NULL,
  value BOOLEAN DEFAULT false,
  intensity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Row Level Security (RLS)

```sql
-- Користувачі бачать тільки свої пристрої
CREATE POLICY "Users can view own devices"
  ON devices FOR SELECT
  USING (auth.uid() = user_id);

-- Користувачі можуть оновлювати свої пристрої
CREATE POLICY "Users can update own devices"
  ON devices FOR UPDATE
  USING (auth.uid() = user_id);

-- Логи доступні тільки власникам пристроїв
CREATE POLICY "Users can view own device logs"
  ON device_logs FOR SELECT
  USING (
    device_id IN (
      SELECT device_id FROM devices WHERE user_id = auth.uid()
    )
  );
```

### Edge Functions

#### device-api

Основний API для ESP8266:

**Endpoints:**
- `POST /device-api/device/{device_id}/log` - Додати лог
- `GET /device-api/device/{device_id}/logs` - Отримати логи
- `GET /device-api/device/{device_id}/settings` - Отримати налаштування
- `POST /device-api/device/{device_id}/action` - Виконати дію

**Deployment:**
Edge Functions автоматично розгортаються Lovable.

### Аутентифікація

1. Увімкніть Email Auth у Supabase:
   - Project Settings → Authentication → Providers
   - Увімкніть Email provider
   - Налаштуйте email templates

2. Опціонально: Google OAuth
   - Додайте Google OAuth credentials
   - Налаштуйте redirect URLs

## 🧪 Тестування

### Тестування веб-додатку

#### 1. Локальне тестування

```bash
# Встановлення залежностей
npm install

# Запуск dev сервера
npm run dev

# Відкрийте http://localhost:5173
```

#### 2. Тестування API

```bash
# Тест додавання логу
curl -X POST https://ychnmaaximnoxvwnzrgs.supabase.co/functions/v1/device-api/device/growbox_001/log \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "growbox_001",
    "temp": 24.5,
    "hum": 65.2,
    "soil_moisture": 45,
    "light_level": 80
  }'

# Тест отримання логів
curl https://ychnmaaximnoxvwnzrgs.supabase.co/functions/v1/device-api/device/growbox_001/logs
```

### Тестування ESP8266

#### Приклад коду для тестування

```cpp
// Файл: test_connection.ino
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* apiUrl = "https://ychnmaaximnoxvwnzrgs.supabase.co/functions/v1/device-api";
const char* deviceId = "test_device_001";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected!");
  
  testAPI();
}

void testAPI() {
  HTTPClient http;
  WiFiClient client;
  
  String url = String(apiUrl) + "/device/" + deviceId + "/log";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  
  String json = "{\"device_id\":\"" + String(deviceId) + "\",\"temp\":25.0,\"hum\":60.0}";
  
  int httpCode = http.POST(json);
  Serial.println("HTTP Code: " + String(httpCode));
  Serial.println("Response: " + http.getString());
  
  http.end();
}

void loop() {
  delay(60000);
}
```

## 📊 Моніторинг

### Supabase Dashboard

1. **Database Logs**
   - https://supabase.com/dashboard/project/ychnmaaximnoxvwnzrgs/logs/postgres-logs

2. **Edge Function Logs**
   - https://supabase.com/dashboard/project/ychnmaaximnoxvwnzrgs/functions/device-api/logs

3. **Realtime Logs**
   - Перевірте активні підписки в Supabase Dashboard

### Метрики для відстеження

- **Кількість активних пристроїв** (online devices)
- **Частота логів** (logs per minute)
- **Час відповіді API** (response time)
- **Помилки API** (error rate)

### Алерти

Налаштуйте алерти для:
- ❌ Пристрій offline > 5 хвилин
- 🌡️ Температура поза межами (напр. < 15°C або > 35°C)
- 💧 Вологість поза межами (напр. < 40% або > 80%)
- 🚨 Помилки Edge Functions

## 🔐 Безпека

### Checklist

- ✅ RLS увімкнено на всіх таблицях
- ✅ Edge Functions захищені CORS
- ✅ API ключі не в коді (тільки .env)
- ✅ HTTPS для всіх запитів
- ✅ Валідація даних на сервері

### Приклад безпечної конфігурації

```typescript
// Ніколи не використовуйте service_role key на клієнті!
// ✅ ПРАВИЛЬНО (client-side)
const supabase = createClient(
  'https://ychnmaaximnoxvwnzrgs.supabase.co',
  'anon_key_here'
);

// ❌ НЕПРАВИЛЬНО (client-side)
// const supabase = createClient(url, service_role_key);
```

## 🆘 Troubleshooting

### Проблема: Пристрої не відображаються

**Рішення:**
1. Перевірте RLS policies на таблиці `devices`
2. Переконайтеся, що користувач авторизований
3. Перевірте Console для помилок JavaScript

### Проблема: Realtime не працює

**Рішення:**
1. Перевірте, чи увімкнено Realtime в Supabase
2. Додайте таблиці до `supabase_realtime` publication:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE device_logs;
```

### Проблема: ESP8266 не може відправити дані

**Рішення:**
1. Перевірте WiFi підключення
2. Перевірте URL Edge Function
3. Додайте логування HTTP кодів
4. Перевірте CORS headers

## 📚 Додаткові ресурси

- [Lovable Documentation](https://docs.lovable.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [ESP8266 Arduino Core](https://github.com/esp8266/Arduino)
- [React Documentation](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)

## 📞 Підтримка

**Email**: support@growbox.tech  
**Telegram**: @growbox_support  
**GitHub Issues**: https://github.com/your-repo/issues
