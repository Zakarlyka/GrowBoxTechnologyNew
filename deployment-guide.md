# IoT Platform - Deployment Guide

## Швидке розгортання на VPS (Ubuntu 20.04/22.04)

### 1. Підготовка сервера

```bash
# Оновлення системи
sudo apt update && sudo apt upgrade -y

# Встановлення Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Встановлення Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перезавантаження для застосування змін
sudo reboot
```

### 2. Клонування та налаштування

```bash
# Клонування репозиторію
git clone https://github.com/your-username/iot-platform.git
cd iot-platform

# Створення environment файлу
cp .env.example .env
nano .env
```

### 3. Налаштування .env файлу

```bash
# .env file
DOMAIN=your-domain.com
EMAIL=your-email@domain.com

# Database
POSTGRES_PASSWORD=secure_postgres_password
JWT_SECRET=your-super-secret-jwt-key

# InfluxDB
INFLUX_TOKEN=your-influxdb-super-secret-token

# Redis
REDIS_PASSWORD=secure_redis_password

# MQTT
MQTT_USERNAME=mqtt_user
MQTT_PASSWORD=secure_mqtt_password

# Email (optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 4. Налаштування DNS

В налаштуваннях вашого домену додайте A-записи:

```
your-domain.com        → IP_ADDRESS
www.your-domain.com    → IP_ADDRESS
api.your-domain.com    → IP_ADDRESS
mqtt.your-domain.com   → IP_ADDRESS
```

### 5. Запуск платформи

```bash
# Перший запуск (з SSL сертифікатами)
./deploy.sh --setup-ssl

# Або простий запуск без SSL (для тестування)
docker-compose up -d
```

### 6. Перевірка статусу

```bash
# Перевірка всіх контейнерів
docker-compose ps

# Логи всіх сервісів
docker-compose logs -f

# Логи конкретного сервісу
docker-compose logs -f backend
```

## Доступ до сервісів

После успішного розгортання:

- **Frontend**: https://your-domain.com
- **Backend API**: https://your-domain.com/api
- **MQTT Broker**: mqtt://your-domain.com:1883
- **MQTT WebSocket**: wss://your-domain.com/mqtt
- **EMQX Dashboard**: http://your-domain.com:18083 (admin/public)
- **Grafana**: http://your-domain.com:3000 (admin/admin_grafana)
- **InfluxDB**: http://your-domain.com:8086 (admin/admin_password)

## Конфігурація ESP32 пристроїв

### Автоматична конфігурація через Captive Portal

1. Завантажте прошивку на ESP32
2. При першому запуску ESP32 створить WiFi точку "GrowBox-Config"
3. Підключіться до неї з паролем "12345678"
4. Відкриється сторінка конфігурації
5. Введіть дані WiFi та IoT платформи

### Ручна конфігурація

```cpp
// У файлі grow_box_controller.ino змініть:
const char* mqtt_server = "your-domain.com";
const char* user_id = "your-user-id";
const char* device_id = "unique-device-id";
```

## Структура MQTT топіків

```
grow/{user_id}/{device_id}/telemetry    # ESP32 → Platform (дані датчиків)
grow/{user_id}/{device_id}/command      # Platform → ESP32 (команди)
grow/{user_id}/{device_id}/status       # ESP32 ↔ Platform (online/offline)
```

### Приклад телеметрії (ESP32 → Platform)

```json
{
  "device_id": "grow-box-001",
  "timestamp": 1640995200000,
  "temperature": 24.5,
  "humidity": 65,
  "soil_moisture": 72,
  "light_level": 85,
  "controls": {
    "water_pump": false,
    "light_system": true,
    "ventilation": true,
    "heater": false,
    "light_intensity": 80,
    "fan_speed": 60
  }
}
```

### Приклад команди (Platform → ESP32)

```json
{
  "command": "water_pump",
  "value": true
}
```

## Моніторинг та обслуговування

### Логи

```bash
# Всі логи
docker-compose logs -f

# Окремі сервіси
docker-compose logs -f backend
docker-compose logs -f emqx
docker-compose logs -f postgres
```

### Backup бази даних

```bash
# PostgreSQL backup
docker-compose exec postgres pg_dump -U iot_user iot_platform > backup_$(date +%Y%m%d).sql

# InfluxDB backup
docker-compose exec influxdb influx backup /tmp/backup
docker cp $(docker-compose ps -q influxdb):/tmp/backup ./influx_backup_$(date +%Y%m%d)
```

### Оновлення платформи

```bash
# Зупинка сервісів
docker-compose down

# Оновлення коду
git pull origin main

# Перебудова та запуск
docker-compose up -d --build
```

### SSL сертифікати

```bash
# Оновлення сертифікатів Let's Encrypt
docker-compose run --rm certbot renew

# Перезапуск Nginx
docker-compose restart nginx
```

## Налаштування firewall

```bash
# Базові правила
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 1883/tcp  # MQTT
sudo ufw enable
```

## Тестування

### Тест MQTT підключення

```bash
# Установка клієнта
sudo apt install mosquitto-clients

# Підписка на топік
mosquitto_sub -h your-domain.com -p 1883 -t "grow/+/+/telemetry"

# Публікація тестового повідомлення
mosquitto_pub -h your-domain.com -p 1883 -t "grow/test/device001/telemetry" -m '{"temperature":25,"humidity":60}'
```

### Тест API

```bash
# Реєстрація користувача
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Логін
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Troubleshooting

### Часті проблеми

1. **Контейнер не запускається**
   ```bash
   docker-compose logs service-name
   ```

2. **SSL сертифікати не працюють**
   ```bash
   # Перевірка DNS
   nslookup your-domain.com
   
   # Ручне отримання сертифіката
   docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot --email your-email@domain.com --agree-tos --no-eff-email -d your-domain.com
   ```

3. **MQTT підключення не працює**
   ```bash
   # Перевірка портів
   netstat -tlnp | grep :1883
   
   # Логи EMQX
   docker-compose logs -f emqx
   ```

4. **База даних недоступна**
   ```bash
   # Перевірка статусу
   docker-compose exec postgres pg_isready -U iot_user
   
   # Підключення до бази
   docker-compose exec postgres psql -U iot_user -d iot_platform
   ```

## Підтримка

Для питань та підтримки:
- GitHub Issues: https://github.com/your-username/iot-platform/issues
- Email: support@your-domain.com
- Документація: https://docs.your-domain.com