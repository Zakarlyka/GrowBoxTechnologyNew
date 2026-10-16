> **DEPRECATED** — may be outdated. See HANDOVER.md and docs/handover/.

# 🌱 AGRO HOGWARDS - ПОВНИЙ МАЙСТЕР-ПРОМПТ ДЛЯ ВІДТВОРЕННЯ ПРОЕКТУ

**Версія:** 5.0 ULTIMATE  
**Дата:** 2025-11-19  
**Призначення:** Повне відтворення IoT платформи з нуля

---

## 📋 ЗМІСТ

1. [Загальний Опис](#загальний-опис)
2. [Технологічний Стек](#технологічний-стек)
3. [Структура Проекту](#структура-проекту)
4. [База Даних Supabase](#база-даних-supabase)
5. [Row Level Security (RLS)](#row-level-security-rls)
6. [Database Functions](#database-functions)
7. [Database Triggers](#database-triggers)
8. [Edge Functions](#edge-functions)
9. [Frontend Архітектура](#frontend-архітектура)
10. [Ключові Компоненти](#ключові-компоненти)
11. [Hooks та Утиліти](#hooks-та-утиліти)
12. [Дизайн Система](#дизайн-система)
13. [IoT Інтеграція](#iot-інтеграція)
14. [Розгортання](#розгортання)

---

## 🎯 ЗАГАЛЬНИЙ ОПИС

**Agro Hogwards** - це повноцінна IoT платформа для керування grow box системами (боксами для вирощування рослин) з можливостями:

- 📊 **Моніторинг сенсорів**: температура, вологість, освітлення, pH, EC, CO2, вологість ґрунту
- 🎮 **Дистанційне керування**: лампи, водяні помпи, вентиляція, обігрівачі
- 📈 **Аналітика**: візуалізація даних у реальному часі з графіками
- ⏰ **Автоматизація**: розклади для автоматичного керування пристроями
- 📚 **База знань**: статті про вирощування, каталог сортів рослин
- 👥 **Мультироль**: 4 ролі (user, developer, admin, superadmin)
- 🌐 **Багатомовність**: українська, російська, англійська
- 🔐 **Безпека**: RLS на рівні бази даних, OAuth підтримка

---

## 🛠 ТЕХНОЛОГІЧНИЙ СТЕК

### Frontend
- **Framework**: React 18.3.1 + TypeScript
- **Build Tool**: Vite 5.0.3
- **Routing**: React Router DOM 6.30.1
- **Styling**: Tailwind CSS 3.x з HSL змінними
- **State Management**: TanStack React Query 5.83.0
- **UI Components**: Shadcn/UI (Radix UI primitives)
- **Charts**: Recharts 3.2.1
- **i18n**: react-i18next 15.7.3
- **Icons**: Lucide React 0.462.0
- **Forms**: React Hook Form 7.61.1 + Zod 3.25.76

### Backend
- **Database**: Supabase (PostgreSQL 15+)
- **Auth**: Supabase Auth (Email + OAuth)
- **API**: Supabase Client (@supabase/supabase-js 2.80.0)
- **Serverless**: Supabase Edge Functions (Deno runtime)
- **Real-time**: Supabase Realtime (WebSockets)

### Security
- **RLS**: Row Level Security на всіх таблицях
- **Functions**: SECURITY DEFINER для адмін-функцій
- **Auth**: JWT токени, refresh tokens

---

## 📁 СТРУКТУРА ПРОЕКТУ

```
agro-hogwards/
├── public/
│   ├── _redirects                          # Netlify redirects
│   ├── favicon.png
│   ├── icons/icon-512x512.png
│   ├── manifest.json                       # PWA manifest
│   ├── robots.txt
│   ├── sitemap.xml
│   └── esp8266-setup-example.html
│
├── src/
│   ├── assets/
│   │   ├── logo-agro-hogwards.png
│   │   └── logo-agro-hogwards-new.png
│   │
│   ├── components/
│   │   ├── ui/                             # 40+ Shadcn компонентів
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   └── ... (всі Shadcn компоненти)
│   │   │
│   │   ├── admin/                          # Адміністративні компоненти
│   │   │   ├── UserManager.tsx             # Керування користувачами
│   │   │   ├── ArticleManager.tsx          # Керування статтями
│   │   │   ├── ArticleForm.tsx
│   │   │   ├── StrainManager.tsx           # Керування сортами
│   │   │   └── StrainForm.tsx
│   │   │
│   │   ├── AddDeviceDialog.tsx             # Діалог додавання пристрою
│   │   ├── AdminPanel.tsx                  # Головна адмін-панель
│   │   ├── AdvancedCharts.tsx              # Розширені графіки
│   │   ├── AuthForm.tsx                    # Форма автентифікації
│   │   ├── Dashboard.tsx                   # Головна панель (dashboard)
│   │   ├── DeveloperCabinet.tsx            # Кабінет розробника
│   │   ├── DeviceCard.tsx                  # Картка пристрою
│   │   ├── DeviceControls.tsx              # Елементи керування
│   │   ├── DeviceGroups.tsx                # Групи пристроїв
│   │   ├── DeviceManagement.tsx            # Управління пристроями
│   │   ├── DeviceSchedules.tsx             # Розклади для пристроїв
│   │   ├── DeviceSettings.tsx              # Налаштування пристроїв
│   │   ├── Devices.tsx                     # Список пристроїв
│   │   ├── Header.tsx                      # Шапка сайту
│   │   ├── Layout.tsx                      # Головний layout
│   │   ├── LogsTable.tsx                   # Таблиця логів
│   │   ├── Navigation.tsx                  # Навігація
│   │   ├── NotificationSettings.tsx        # Налаштування сповіщень
│   │   ├── QRDeviceSetup.tsx               # QR-підключення пристроїв
│   │   ├── RemoteControl.tsx               # Дистанційне керування
│   │   ├── SensorChart.tsx                 # Графік сенсорів
│   │   ├── Terminal.tsx                    # Термінал для ESP
│   │   └── UserCabinet.tsx                 # Кабінет користувача
│   │
│   ├── pages/
│   │   ├── Account.tsx                     # Сторінка акаунту
│   │   ├── AddDevice.tsx                   # Сторінка додавання пристрою
│   │   ├── AdminPage.tsx                   # Сторінка адміністратора
│   │   ├── AnalyticsPage.tsx               # Сторінка аналітики
│   │   ├── ArticleDetailPage.tsx           # Детальна сторінка статті
│   │   ├── Auth.tsx                        # Сторінка автентифікації
│   │   ├── DashboardPage.tsx               # Головна сторінка dashboard
│   │   ├── DeveloperPage.tsx               # Сторінка розробника
│   │   ├── DeviceDetail.tsx                # Деталі пристрою
│   │   ├── Devices.tsx                     # Сторінка пристроїв
│   │   ├── DevicesPage.tsx                 # Альтернативна сторінка пристроїв
│   │   ├── Index.tsx                       # Головна сторінка (landing)
│   │   ├── LibraryPage.tsx                 # Бібліотека знань
│   │   ├── NotFound.tsx                    # 404 сторінка
│   │   ├── QRConnection.tsx                # Підключення через QR
│   │   ├── RemoteControlPage.tsx           # Сторінка дист. керування
│   │   └── Settings.tsx                    # Налаштування
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx                  # Детектор мобільного
│   │   ├── use-toast.ts                    # Toast нотифікації
│   │   ├── useAuth.tsx                     # ⭐ КРИТИЧНИЙ хук автентифікації
│   │   ├── useDeviceControls.tsx           # Хук для керування пристроями
│   │   ├── useDeviceLogs.tsx               # Хук для логів пристроїв
│   │   ├── useDeviceSchedules.tsx          # Хук для розкладів
│   │   ├── useDevices.tsx                  # Хук для роботи з пристроями
│   │   ├── useLibrary.ts                   # Хук для бібліотеки
│   │   ├── useSensorData.tsx               # Хук для даних сенсорів
│   │   └── useUserRole.tsx                 # ⭐ Хук для перевірки ролей
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts                   # ⭐ Клієнт Supabase
│   │       └── types.ts                    # AUTO-GENERATED (не змінювати)
│   │
│   ├── types/
│   │   ├── index.ts                        # Загальні типи
│   │   └── supabase-v2.8.ts                # ⭐ Ручні override типи
│   │
│   ├── lib/
│   │   ├── utils.ts                        # Утиліти (cn, тощо)
│   │   └── validations.ts                  # Схеми валідації Zod
│   │
│   ├── i18n/
│   │   ├── index.ts                        # Ініціалізація i18n
│   │   └── locales/
│   │       ├── en.json                     # Англійська
│   │       ├── uk.json                     # Українська
│   │       └── ru.json                     # Російська
│   │
│   ├── App.tsx                             # Головний компонент
│   ├── App.css                             # Глобальні стилі
│   ├── main.tsx                            # Entry point
│   ├── index.css                           # ⭐ Tailwind + Semantic tokens
│   └── vite-env.d.ts                       # Vite type declarations
│
├── supabase/
│   ├── config.toml                         # ⭐ Конфігурація Supabase
│   └── functions/                          # Edge Functions
│       ├── device-api/
│       │   └── index.ts                    # API для пристроїв (ESP)
│       ├── generate-qr/
│       │   └── index.ts                    # Генерація QR кодів
│       ├── notification-system/
│       │   └── index.ts                    # Система сповіщень
│       ├── setup/
│       │   └── index.ts                    # Налаштування системи
│       └── confirm-device/
│           ├── index.ts                    # Підтвердження пристроїв
│           ├── README.md
│           └── LICENSE
│
├── nginx/
│   └── default.conf                        # Nginx конфігурація
│
├── .env                                     # Environment змінні
├── docker-compose.yml                       # Docker Compose
├── Dockerfile.frontend                      # Dockerfile
├── netlify.toml                            # Netlify конфігурація
├── vercel.json                             # Vercel конфігурація
├── tailwind.config.ts                      # ⭐ Tailwind конфігурація
├── vite.config.ts                          # Vite конфігурація
├── tsconfig.json                           # TypeScript конфігурація
├── package.json                            # Dependencies
├── index.html                              # HTML entry point
│
└── Документація/
    ├── README.md                           # Основний README
    ├── DEPLOYMENT.md                       # Інструкції з розгортання
    ├── DEPLOYMENT_GUIDE.md                 # Розширений гайд
    ├── ESP8266_INTEGRATION.md              # Інтеграція ESP8266
    └── deployment-guide.md                 # Детальний гайд
```

---

## 💾 БАЗА ДАНИХ SUPABASE

### 🔐 ENUM Типи

```sql
-- Ролі користувачів
CREATE TYPE public.app_role AS ENUM (
    'user',
    'developer',
    'admin',
    'superadmin'
);

-- Одиниці вимірювання
CREATE TYPE public.preferred_units AS ENUM (
    'metric',
    'imperial'
);
```

### 📊 ТАБЛИЦІ (Повна Схема)

#### 1. **profiles** - Профілі користувачів

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    category TEXT DEFAULT 'standard',
    developer_id UUID REFERENCES public.profiles(id),
    units preferred_units NOT NULL DEFAULT 'metric',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Індекси
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_developer_id ON public.profiles(developer_id);

-- Коментарі
COMMENT ON TABLE public.profiles IS 'Профілі користувачів з додатковою інформацією';
COMMENT ON COLUMN public.profiles.developer_id IS 'Посилання на розробника (для користувачів категорії developer)';
COMMENT ON COLUMN public.profiles.category IS 'Категорія користувача: standard, premium, enterprise';
```

#### 2. **user_roles** - Ролі користувачів

```sql
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    app_role app_role DEFAULT 'user'::app_role,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)  -- Один користувач = одна роль
);

-- Індекси
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_app_role ON public.user_roles(app_role);

COMMENT ON TABLE public.user_roles IS '⭐ КРИТИЧНА таблиця: ролі користувачів для контролю доступу';
COMMENT ON COLUMN public.user_roles.app_role IS 'Роль: user, developer, admin, superadmin';
```

#### 3. **devices** - Пристрої IoT

```sql
CREATE TABLE public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL UNIQUE,  -- Унікальний ID пристрою (ESP MAC)
    name TEXT NOT NULL DEFAULT 'Unnamed Device',
    type TEXT NOT NULL DEFAULT 'grow_box',
    location TEXT,
    status TEXT NOT NULL DEFAULT 'offline',  -- online, offline, error
    settings JSONB DEFAULT '{}',
    group_id UUID REFERENCES public.device_groups(id) ON DELETE SET NULL,
    last_temp DOUBLE PRECISION,
    last_hum DOUBLE PRECISION,
    last_activity TIMESTAMPTZ,
    last_seen TIMESTAMPTZ DEFAULT now(),
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Індекси
CREATE INDEX idx_devices_user_id ON public.devices(user_id);
CREATE INDEX idx_devices_device_id ON public.devices(device_id);
CREATE INDEX idx_devices_status ON public.devices(status);
CREATE INDEX idx_devices_group_id ON public.devices(group_id);

COMMENT ON TABLE public.devices IS 'IoT пристрої (grow boxes, ESP8266/ESP32)';
COMMENT ON COLUMN public.devices.settings IS 'JSONB налаштування: target_temp, target_hum, schedules, etc.';
COMMENT ON COLUMN public.devices.last_seen_at IS 'Останній раз коли пристрій надіслав дані';
```

#### 4. **device_controls** - Керування пристроями

```sql
CREATE TABLE public.device_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    user_id UUID,
    control_name TEXT NOT NULL,  -- water_pump, light_system, ventilation, heater
    control_type TEXT NOT NULL,  -- switch, slider, toggle
    value BOOLEAN DEFAULT false,
    intensity INTEGER DEFAULT 0,  -- ⭐ Для диммування (0-100)
    schedule JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(device_id, control_name)
);

-- Індекси
CREATE INDEX idx_device_controls_device_id ON public.device_controls(device_id);
CREATE INDEX idx_device_controls_user_id ON public.device_controls(user_id);

COMMENT ON TABLE public.device_controls IS 'Стан елементів керування пристроями';
COMMENT ON COLUMN public.device_controls.intensity IS 'Інтенсивність 0-100 (для диммування світла, швидкості вентиляції)';
```

#### 5. **device_logs** - Логи телеметрії

```sql
CREATE TABLE public.device_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,  -- TEXT для зворотної сумісності
    device_id_uuid UUID REFERENCES public.devices(id) ON DELETE CASCADE,
    user_id UUID,
    metric TEXT DEFAULT 'env',  -- temperature, humidity, env (environmental)
    temp DOUBLE PRECISION,
    hum DOUBLE PRECISION,
    soil_moisture DOUBLE PRECISION,
    light_level DOUBLE PRECISION,
    light_cycle_hours INTEGER,
    irrigation_time TIME,
    value NUMERIC,  -- Загальне значення
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Індекси
CREATE INDEX idx_device_logs_device_id ON public.device_logs(device_id);
CREATE INDEX idx_device_logs_device_id_uuid ON public.device_logs(device_id_uuid);
CREATE INDEX idx_device_logs_created_at ON public.device_logs(created_at DESC);
CREATE INDEX idx_device_logs_metric ON public.device_logs(metric);

COMMENT ON TABLE public.device_logs IS 'Телеметрія від пристроїв (time-series data)';
COMMENT ON COLUMN public.device_logs.device_id_uuid IS 'UUID reference для нових пристроїв';
```

#### 6. **sensor_data** - Дані сенсорів (структуровані)

```sql
CREATE TABLE public.sensor_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    temperature NUMERIC,
    humidity NUMERIC,
    soil_moisture NUMERIC,
    light_level NUMERIC,
    ph_level NUMERIC,
    ec_level NUMERIC,
    water_level NUMERIC,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Індекси
CREATE INDEX idx_sensor_data_device_id ON public.sensor_data(device_id);
CREATE INDEX idx_sensor_data_timestamp ON public.sensor_data(timestamp DESC);

COMMENT ON TABLE public.sensor_data IS 'Структуровані дані сенсорів (альтернатива device_logs)';
```

#### 7. **device_schedules** - Розклади для пристроїв

```sql
CREATE TABLE public.device_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    control_name TEXT NOT NULL,  -- water_pump, light_system
    schedule_type TEXT NOT NULL,  -- time_range, interval, daily
    start_time TIME,
    end_time TIME,
    interval_minutes INTEGER,
    days_of_week INTEGER[],  -- [0,1,2,3,4,5,6] для Mon-Sun
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Індекси
CREATE INDEX idx_device_schedules_device_id ON public.device_schedules(device_id);
CREATE INDEX idx_device_schedules_is_active ON public.device_schedules(is_active);

COMMENT ON TABLE public.device_schedules IS 'Розклади автоматизації для пристроїв';
```

#### 8. **schedules** - Загальні розклади (legacy)

```sql
CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    action TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    repeat TEXT NOT NULL DEFAULT 'daily',
    days_of_week INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_schedules_device_id ON public.schedules(device_id);
```

#### 9. **device_groups** - Групи пристроїв

```sql
CREATE TABLE public.device_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#4F46E5',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_device_groups_user_id ON public.device_groups(user_id);

COMMENT ON TABLE public.device_groups IS 'Групи для організації пристроїв';
```

#### 10. **device_group_members** - Зв'язок пристроїв та груп

```sql
CREATE TABLE public.device_group_members (
    group_id UUID NOT NULL REFERENCES public.device_groups(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (group_id, device_id)
);

CREATE INDEX idx_dgm_group_id ON public.device_group_members(group_id);
CREATE INDEX idx_dgm_device_id ON public.device_group_members(device_id);
```

#### 11. **strains** - Каталог сортів рослин

```sql
CREATE TABLE public.strains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'photoperiod',  -- photoperiod, autoflower
    description TEXT,
    settings_by_phase JSONB,  -- Налаштування по фазам росту
    fertilizer_schedule JSONB,  -- Графік внесення добрив
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_strains_type ON public.strains(type);

COMMENT ON TABLE public.strains IS 'Публічний каталог сортів рослин';
```

#### 12. **custom_strains** - Користувацькі сорти

```sql
CREATE TABLE public.custom_strains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    notes TEXT,
    start_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_custom_strains_user_id ON public.custom_strains(user_id);
```

#### 13. **articles** - Статті бази знань

```sql
CREATE TABLE public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_articles_category ON public.articles(category);

COMMENT ON TABLE public.articles IS 'База знань: статті про вирощування';
```

#### 14. **notifications** - Налаштування сповіщень

```sql
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
    type TEXT NOT NULL,  -- temperature, humidity, offline
    config JSONB DEFAULT '{}',
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_device_id ON public.notifications(device_id);
```

#### 15. **notification_settings** - Глобальні налаштування сповіщень

```sql
CREATE TABLE public.notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT false,
    temperature_min NUMERIC,
    temperature_max NUMERIC,
    humidity_min NUMERIC,
    humidity_max NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notification_settings_user_id ON public.notification_settings(user_id);
```

#### 16. **pending_devices** - Тимчасові токени для підключення пристроїв

```sql
CREATE TABLE public.pending_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_token TEXT NOT NULL UNIQUE,
    user_id UUID,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pending_devices_device_token ON public.pending_devices(device_token);
CREATE INDEX idx_pending_devices_expires_at ON public.pending_devices(expires_at);

COMMENT ON TABLE public.pending_devices IS 'Тимчасові токени для QR-підключення нових пристроїв';
```

#### 17. **device_pairing_temp** - Тимчасові коди спарювання

```sql
CREATE TABLE public.device_pairing_temp (
    device_id TEXT NOT NULL PRIMARY KEY,
    pairing_code TEXT NOT NULL,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dpt_pairing_code ON public.device_pairing_temp(pairing_code);

COMMENT ON TABLE public.device_pairing_temp IS 'Тимчасові коди для ручного спарювання пристроїв';
```

---

## 🔒 ROW LEVEL SECURITY (RLS)

### Загальні Принципи

1. **RLS увімкнено на ВСІХ таблицях**
2. **Політики використовують функцію `is_admin()` для перевірки прав**
3. **Superadmin має повний доступ через is_admin()**
4. **Користувачі бачать тільки свої дані через `auth.uid() = user_id`**

### RLS Policies по таблицях

#### 1. **profiles**

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Admins та Superadmins керують всіма, користувачі - тільки своїм профілем
CREATE POLICY "Admins manage all, Users manage their own"
ON public.profiles
FOR ALL
USING (is_admin() OR auth.uid() = user_id)
WITH CHECK (is_admin() OR auth.uid() = user_id);
```

#### 2. **user_roles** ⭐ КРИТИЧНА

```sql
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- SELECT: Користувач бачить свою роль АБО система postgres (для обходу рекурсії)
CREATE POLICY "Allow_SELECT_for_self_or_system"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR SESSION_USER = 'postgres');

-- INSERT/UPDATE/DELETE: Тільки адміни
CREATE POLICY "Allow_INSERT_for_admins"
ON public.user_roles
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Allow_UPDATE_for_admins"
ON public.user_roles
FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Allow_DELETE_for_admins"
ON public.user_roles
FOR DELETE
USING (is_admin());
```

**⚠️ ВАЖЛИВО**: Політика SELECT НЕ викликає `is_admin()` для уникнення рекурсії! Використовується `SESSION_USER = 'postgres'`.

#### 3. **devices**

```sql
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all, Users manage their own"
ON public.devices
FOR ALL
USING (is_admin() OR auth.uid() = user_id)
WITH CHECK (is_admin() OR auth.uid() = user_id);
```

#### 4. **device_controls**

```sql
ALTER TABLE public.device_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own"
ON public.device_controls
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### 5. **device_logs**

```sql
ALTER TABLE public.device_logs ENABLE ROW LEVEL SECURITY;

-- ⚠️ Користувачі можуть ТІЛЬКИ читати свої логи, НЕ можуть вставляти/змінювати
-- (Вставка відбувається через service role або тригери)
```

#### 6. **sensor_data**

```sql
ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;

-- Користувачі бачать дані тільки своїх пристроїв
CREATE POLICY "Users can view own device sensor data only"
ON public.sensor_data
FOR SELECT
USING (
    auth.uid() IS NOT NULL 
    AND device_id IN (
        SELECT id FROM public.devices WHERE user_id = auth.uid()
    )
);

-- Користувачі можуть вставляти дані для своїх пристроїв
CREATE POLICY "Users can insert sensor data for own devices"
ON public.sensor_data
FOR INSERT
WITH CHECK (
    device_id IN (
        SELECT id FROM public.devices WHERE user_id = auth.uid()
    )
);
```

#### 7. **device_schedules**

```sql
ALTER TABLE public.device_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage schedules for own devices"
ON public.device_schedules
FOR ALL
USING (
    device_id IN (
        SELECT id FROM public.devices WHERE user_id = auth.uid()
    )
);
```

#### 8. **schedules**

```sql
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view schedules for their devices"
ON public.schedules
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.devices
        WHERE devices.id = schedules.device_id
        AND devices.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert schedules for their devices"
ON public.schedules
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.devices
        WHERE devices.id = schedules.device_id
        AND devices.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update schedules for their devices"
ON public.schedules
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.devices
        WHERE devices.id = schedules.device_id
        AND devices.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete schedules for their devices"
ON public.schedules
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.devices
        WHERE devices.id = schedules.device_id
        AND devices.user_id = auth.uid()
    )
);
```

#### 9. **device_groups**

```sql
ALTER TABLE public.device_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own device groups"
ON public.device_groups
FOR ALL
USING (auth.uid() = user_id);

-- Або окремі політики:
CREATE POLICY "Users can view their own groups"
ON public.device_groups
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own groups"
ON public.device_groups
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own groups"
ON public.device_groups
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own groups"
ON public.device_groups
FOR DELETE
USING (auth.uid() = user_id);
```

#### 10. **device_group_members**

```sql
ALTER TABLE public.device_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of their groups"
ON public.device_group_members
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.device_groups
        WHERE device_groups.id = device_group_members.group_id
        AND device_groups.user_id = auth.uid()
    )
);

CREATE POLICY "Users can add devices to their groups"
ON public.device_group_members
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.device_groups
        WHERE device_groups.id = device_group_members.group_id
        AND device_groups.user_id = auth.uid()
    )
);

CREATE POLICY "Users can remove devices from their groups"
ON public.device_group_members
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.device_groups
        WHERE device_groups.id = device_group_members.group_id
        AND device_groups.user_id = auth.uid()
    )
);
```

#### 11. **strains** (Публічна таблиця)

```sql
ALTER TABLE public.strains ENABLE ROW LEVEL SECURITY;

-- Всі можуть читати
CREATE POLICY "Public can read strains"
ON public.strains
FOR SELECT
USING (true);

-- Тільки адміни можуть змінювати (політики INSERT/UPDATE/DELETE не створені = заборонено)
```

#### 12. **custom_strains**

```sql
ALTER TABLE public.custom_strains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own"
ON public.custom_strains
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### 13. **articles** (Публічна таблиця)

```sql
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read articles"
ON public.articles
FOR SELECT
USING (true);
```

#### 14. **notifications**

```sql
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);
```

#### 15. **notification_settings**

```sql
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification settings"
ON public.notification_settings
FOR ALL
USING (auth.uid() = user_id);
```

#### 16. **pending_devices**

```sql
ALTER TABLE public.pending_devices ENABLE ROW LEVEL SECURITY;

-- Без політик = тільки service role має доступ
```

#### 17. **device_pairing_temp**

```sql
ALTER TABLE public.device_pairing_temp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can read all pairing codes"
ON public.device_pairing_temp
FOR SELECT
USING (true);  -- Service role bypasses RLS anyway

CREATE POLICY "Users can insert their own pairing codes"
ON public.device_pairing_temp
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow cleanup of old pairing codes"
ON public.device_pairing_temp
FOR DELETE
USING (created_at < now() - interval '1 hour');
```

---

## 🔧 DATABASE FUNCTIONS

### 1. **get_my_role()** ⭐ КРИТИЧНА

```sql
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE sql
STABLE
AS $$
  SELECT app_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- ВАЖЛИВО: НЕ SECURITY DEFINER (щоб уникнути рекурсії з RLS)
-- Використовується ТІЛЬКИ у useAuth.tsx
```

**Призначення**: Повертає роль поточного користувача. Викликається один раз при завантаженні додатку.

### 2. **is_admin()** ⭐ КРИТИЧНА

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND app_role IN ('admin', 'superadmin', 'developer')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
```

**Призначення**: Перевіряє чи користувач є адміністратором (admin/superadmin/developer). Використовується ТІЛЬКИ у RLS політиках.

### 3. **admin_get_all_users()** ⭐ АДМІН-ФУНКЦІЯ

```sql
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  app_role app_role,
  full_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.email,
    COALESCE(ur.app_role, 'user'::app_role) AS app_role,
    p.full_name
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  WHERE public.is_admin();  -- Внутрішня перевірка прав
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO authenticated;
```

**Призначення**: Повертає список ВСІХ користувачів (тільки для адмінів). Використовується у `UserManager.tsx`.

### 4. **has_role()** - Перевірка ролі (2 версії)

```sql
-- Версія 1: TEXT параметр
CREATE OR REPLACE FUNCTION public.has_role(_user UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user AND ur.app_role = _role::app_role
  );
$$;

-- Версія 2: ENUM параметр
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND app_role = _role
  );
$$;
```

### 5. **handle_new_user()** - Тригер при реєстрації

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ⭐ КРИТИЧНИЙ ФІКС: Обхід RLS
  SET LOCAL role 'postgres';

  -- Створюємо профіль
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Призначаємо роль 'user' за замовчуванням
  INSERT INTO public.user_roles (user_id, app_role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Тригер на auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**⚠️ КРИТИЧНО**: `SET LOCAL role 'postgres'` обходить RLS, щоб функція могла записувати в таблиці.

### 6. **secure_register_device()** - Безпечна реєстрація пристрою

```sql
CREATE OR REPLACE FUNCTION public.secure_register_device(
  p_device_id TEXT,
  p_name TEXT,
  p_type TEXT,
  p_location TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  device_id TEXT,
  name TEXT,
  type TEXT,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.devices (user_id, device_id, name, type, location, status)
  VALUES (auth.uid(), p_device_id, p_name, p_type, p_location, 'offline')
  RETURNING devices.id, devices.device_id, devices.name, devices.type, devices.user_id;
END;
$$;
```

### 7. **update_updated_at_column()** - Тригер оновлення часу

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Застосовується до всіх таблиць з updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- І т.д. для інших таблиць
```

### 8. **update_device_on_new_log()** - Оновлення статусу при новому лозі

```sql
CREATE OR REPLACE FUNCTION public.update_device_on_new_log()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.devices
  SET 
    last_seen_at = now(),
    status = 'online',
    updated_at = now()
  WHERE device_id = NEW.device_id;

  -- Оновлюємо last_temp та last_hum
  IF NEW.metric = 'temperature' THEN
    UPDATE public.devices SET last_temp = NEW.value WHERE device_id = NEW.device_id;
  ELSIF NEW.metric = 'humidity' THEN
    UPDATE public.devices SET last_hum = NEW.value WHERE device_id = NEW.device_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER device_logs_update_device
  AFTER INSERT ON public.device_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_device_on_new_log();
```

### 9. **mark_devices_offline()** - Позначає пристрої офлайн

```sql
CREATE OR REPLACE FUNCTION public.mark_devices_offline()
RETURNS VOID
LANGUAGE sql
AS $$
  UPDATE public.devices
  SET status = 'offline'
  WHERE status = 'online'
    AND last_activity < now() - interval '2 minutes';
$$;

-- Викликати через pg_cron або Edge Function кожні 5 хвилин
```

### 10. **cleanup_old_pairing_records()** - Очищення старих кодів

```sql
CREATE OR REPLACE FUNCTION public.cleanup_old_pairing_records()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.device_pairing_temp
  WHERE created_at < (now() - interval '1 hour');
END;
$$;
```

### 11. **verify_and_consume_pending_token()** - Перевірка токену підключення

```sql
CREATE OR REPLACE FUNCTION public.verify_and_consume_pending_token(p_token TEXT)
RETURNS TABLE(
  user_id UUID,
  device_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user UUID;
BEGIN
  SELECT user_id INTO v_user 
  FROM public.pending_devices 
  WHERE device_token = p_token 
    AND expires_at > now();
    
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Пристрій надсилає свій device_id у payload
  RETURN QUERY SELECT v_user, NULL::TEXT;
END;
$$;
```

---

## 🎣 DATABASE TRIGGERS

### 1. Тригер на створення користувача

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 2. Тригери оновлення updated_at

```sql
-- Для profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Для devices
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Для device_controls
CREATE TRIGGER update_device_controls_updated_at
  BEFORE UPDATE ON public.device_controls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Для всіх інших таблиць з updated_at...
```

### 3. Тригер оновлення статусу пристрою при новому лозі

```sql
CREATE TRIGGER device_logs_update_device
  AFTER INSERT ON public.device_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_device_on_new_log();
```

### 4. Тригер оновлення активності пристрою

```sql
CREATE OR REPLACE FUNCTION public.update_device_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.devices
  SET 
    last_activity = now(),
    status = 'online'
  WHERE id::text = NEW.device_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER update_device_activity_trigger
  AFTER INSERT ON public.sensor_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_device_activity();
```

---

## ⚡ EDGE FUNCTIONS

### Структура Edge Functions

```
supabase/
├── config.toml                 # ⭐ Конфігурація
└── functions/
    ├── device-api/             # API для ESP пристроїв
    │   └── index.ts
    ├── generate-qr/            # Генерація QR для підключення
    │   └── index.ts
    ├── notification-system/    # Система сповіщень
    │   └── index.ts
    ├── setup/                  # Налаштування системи
    │   └── index.ts
    └── confirm-device/         # Підтвердження пристроїв
        ├── index.ts
        ├── README.md
        └── LICENSE
```

### Конфігурація (supabase/config.toml)

```toml
project_id = "ychnmaaximnoxvwnzrgs"

[functions.device-api]
verify_jwt = false  # Публічний endpoint для ESP

[functions.generate-qr]
verify_jwt = true

[functions.notification-system]
verify_jwt = true

[functions.setup]
verify_jwt = true

[functions.confirm-device]
verify_jwt = true
```

### 1. device-api (ESP API)

**Файл**: `supabase/functions/device-api/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { device_id, temp, hum, soil_moisture, light_level } = await req.json();

    // Вставка логу
    const { error: logError } = await supabase
      .from('device_logs')
      .insert({
        device_id,
        temp,
        hum,
        soil_moisture,
        light_level,
        metric: 'env'
      });

    if (logError) throw logError;

    // Оновлення статусу пристрою
    const { error: deviceError } = await supabase
      .from('devices')
      .update({
        status: 'online',
        last_seen_at: new Date().toISOString(),
        last_temp: temp,
        last_hum: hum
      })
      .eq('device_id', device_id);

    if (deviceError) throw deviceError;

    // Отримання команд для пристрою
    const { data: controls } = await supabase
      .from('device_controls')
      .select('control_name, value, intensity')
      .eq('device_id', device_id);

    return new Response(
      JSON.stringify({ success: true, controls }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 2. generate-qr (Генерація QR)

**Файл**: `supabase/functions/generate-qr/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Генерація унікального токену
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 хвилин

    // Вставка токену
    const { error } = await supabase
      .from('pending_devices')
      .insert({
        device_token: token,
        user_id: user.id,
        expires_at: expiresAt.toISOString()
      });

    if (error) throw error;

    // Формування QR даних
    const qrData = {
      token,
      supabase_url: Deno.env.get('SUPABASE_URL'),
      supabase_anon_key: Deno.env.get('SUPABASE_ANON_KEY')
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        token,
        qr_data: JSON.stringify(qrData),
        expires_at: expiresAt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 3. notification-system (Сповіщення)

**Файл**: `supabase/functions/notification-system/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Логіка сповіщень про критичні значення температури/вологості
    const { data: devices } = await supabase
      .from('devices')
      .select('*, notification_settings(*)')
      .eq('status', 'online');

    const notifications = [];

    for (const device of devices || []) {
      const settings = device.notification_settings;
      if (!settings) continue;

      if (device.last_temp > settings.temperature_max) {
        notifications.push({
          user_id: device.user_id,
          device_id: device.id,
          type: 'temperature_high',
          message: `Temperature too high: ${device.last_temp}°C`
        });
      }

      // Інші перевірки...
    }

    // Відправка сповіщень (email, push, тощо)
    // TODO: Інтеграція з email сервісом

    return new Response(
      JSON.stringify({ success: true, notifications_sent: notifications.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 4. setup (Початкове налаштування)

**Файл**: `supabase/functions/setup/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Перевірка чи користувач адмін
    const { data: role } = await supabase.rpc('get_my_role');
    if (role !== 'admin' && role !== 'superadmin') {
      throw new Error('Unauthorized');
    }

    const { action } = await req.json();

    let result;

    switch (action) {
      case 'create_default_strains':
        // Створення дефолтних сортів
        result = await createDefaultStrains(supabase);
        break;
      case 'create_default_articles':
        // Створення дефолтних статей
        result = await createDefaultArticles(supabase);
        break;
      default:
        throw new Error('Unknown action');
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createDefaultStrains(supabase: any) {
  const defaultStrains = [
    {
      name: 'Northern Lights',
      type: 'photoperiod',
      description: 'Classic indica strain...'
    },
    // Інші сорти...
  ];

  const { data, error } = await supabase
    .from('strains')
    .insert(defaultStrains);

  if (error) throw error;
  return data;
}

async function createDefaultArticles(supabase: any) {
  // Аналогічно для статей
  return [];
}
```

### 5. confirm-device (Підтвердження пристрою)

**Файл**: `supabase/functions/confirm-device/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, device_id, device_name } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Перевірка токену
    const { data: pending, error: pendingError } = await supabase
      .from('pending_devices')
      .select('*')
      .eq('device_token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (pendingError || !pending) {
      throw new Error('Invalid or expired token');
    }

    // Створення пристрою
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .insert({
        user_id: pending.user_id,
        device_id,
        name: device_name || 'New Device',
        type: 'grow_box',
        status: 'offline'
      })
      .select()
      .single();

    if (deviceError) throw deviceError;

    // Видалення токену
    await supabase
      .from('pending_devices')
      .delete()
      .eq('device_token', token);

    return new Response(
      JSON.stringify({ success: true, device }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 🎨 FRONTEND АРХІТЕКТУРА

### Supabase Client Configuration

**Файл**: `src/integrations/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ychnmaaximnoxvwnzrgs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaG5tYWF4aW1ub3h2d256cmdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDAyOTQsImV4cCI6MjA3NDExNjI5NH0.JBlfMFXVsuZ_-HqSz-Fl1OTMtdX5vY2GRd8BdHfJaD0";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

**⚠️ КРИТИЧНО**: НЕ використовувати `import.meta.env.VITE_*` змінні - Lovable їх не підтримує!

### Ручні Типи (Override)

**Файл**: `src/types/supabase-v2.8.ts`

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ENUM типи
export type AppRole = "user" | "admin" | "superadmin" | "developer";

// RPC типи
export type AdminUser = {
  user_id: string;
  email: string;
  app_role: AppRole;
  full_name: string | null;
};

export interface RpcFunctionDefinitions {
  get_my_role: {
    Args: Record<string, never>;
    Returns: AppRole;
  };
  admin_get_all_users: {
    Args: Record<string, never>;
    Returns: AdminUser[];
  };
  is_admin: {
    Args: Record<string, never>;
    Returns: boolean;
  };
}
```

---

## 🪝 КЛЮЧОВІ КОМПОНЕНТИ

### 1. useAuth.tsx ⭐ КРИТИЧНИЙ

**Файл**: `src/hooks/useAuth.tsx`

```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/supabase-v2.8';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  category?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithGitHub: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>('user');
  const [loading, setLoading] = useState(true);

  const loadProfileAndRole = async (userId: string) => {
    try {
      // Завантаження профілю
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      }

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // ⭐ Завантаження ролі (викликається ОДИН РАЗ)
      const { data: roleData, error: roleError } = await (supabase.rpc as any)('get_my_role');

      if (roleError) {
        console.error('Error loading role:', roleError);
        setRole('user');
      } else {
        setRole((roleData as AppRole) || 'user');
      }
    } catch (error) {
      console.error('Error in loadProfileAndRole:', error);
      setRole('user');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfileAndRole(user.id);
    }
  };

  useEffect(() => {
    // Ініціалізація сесії
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfileAndRole(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Підписка на зміни автентифікації
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadProfileAndRole(session.user.id);
        } else {
          setProfile(null);
          setRole('user');
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { error };
  };

  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithGitHub,
        signOut,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**Ключові моменти**:
- `get_my_role()` викликається ОДИН РАЗ при завантаженні
- Використовується `.maybeSingle()` для профілю
- Підписка на `onAuthStateChange` для real-time оновлень

### 2. useUserRole.tsx

**Файл**: `src/hooks/useUserRole.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'user' | 'admin' | 'developer' | 'superadmin';

export function useUserRole() {
  const { user } = useAuth();

  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('app_role')
        .eq('user_id', user.id) as any;

      if (error) throw error;
      return (data as any[]).map((r: any) => r.app_role as AppRole);
    },
    enabled: !!user,
  });

  const hasRole = (role: AppRole): boolean => {
    return roles?.includes(role) ?? false;
  };

  const isAdmin = hasRole('admin') || hasRole('superadmin');
  const isDeveloper = hasRole('developer');
  const isSuperadmin = hasRole('superadmin');
  const isUser = hasRole('user');

  return {
    roles: roles ?? [],
    hasRole,
    isAdmin,
    isDeveloper,
    isSuperadmin,
    isUser,
    isLoading,
    error,
  };
}
```

### 3. UserManager.tsx (Адмін-панель)

**Файл**: `src/components/admin/UserManager.tsx`

```typescript
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Loader2 } from "lucide-react";
import type { AdminUser } from '@/types/supabase-v2.8';

export function UserManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // ⭐ ВИКОРИСТОВУЄМО RPC admin_get_all_users
      const { data, error } = await (supabase.rpc as any)('admin_get_all_users');

      if (error) throw error;
      
      setUsers(data as AdminUser[] || []);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast({
        title: "Помилка",
        description: `Не вдалося завантажити список користувачів: ${error.message}`,
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      // ⭐ ВИКОРИСТОВУЄМО app_role (не role!)
      const { error } = await supabase
        .from("user_roles")
        .update({ app_role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Успіх",
        description: `Роль користувача змінено на ${newRole}`,
      });

      // Оновлюємо локальний стан
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.user_id === userId ? { ...u, app_role: newRole as AdminUser['app_role'] } : u
        )
      );
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити роль користувача",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Керування Користувачами
        </CardTitle>
        <CardDescription>
          Перегляд та зміна ролей користувачів системи
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ім'я</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Поточна Роль</TableHead>
              <TableHead>Змінити Роль</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell>{user.full_name || "Не вказано"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className="capitalize">{user.app_role}</span>
                </TableCell>
                <TableCell>
                  <Select
                    value={user.app_role}
                    onValueChange={(value) => handleRoleChange(user.user_id, value)}
                    disabled={updatingId === user.user_id}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Оберіть роль" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Superadmin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default UserManager;
```

### 4. Account.tsx

**Файл**: `src/pages/Account.tsx`

```typescript
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Account() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) throw new Error('No user');

      // Перевірка чи існує профіль
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();  // ⭐ ВИКОРИСТОВУЄМО maybeSingle()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingProfile) {
        // Оновлення існуючого профілю
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Створення нового профілю
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email || '',  // ⭐ EMAIL обов'язковий!
            full_name: fullName,
          });

        if (error) throw error;
      }

      await refreshProfile();

      toast({
        title: "Успіх",
        description: "Профіль оновлено",
      });
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Мій Акаунт</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="fullName">Повне ім'я</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Збереження...' : 'Зберегти'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 5. AdminPage.tsx (Захищена сторінка)

**Файл**: `src/pages/AdminPage.tsx`

```typescript
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminPanel } from "@/components/AdminPanel";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ⭐ ДОСТУП ДЛЯ ADMIN та SUPERADMIN
  if (role !== 'admin' && role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            У вас немає доступу до адміністративної панелі.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminPanel />
    </div>
  );
}
```

---

## 🎨 ДИЗАЙН СИСТЕМА

### Tailwind Configuration

**Файл**: `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### CSS Variables (index.css)

**Файл**: `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ⭐ СЕМАНТИЧНІ HSL ТОКЕНИ */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 142 76% 36%;  /* Зелений для grow theme */
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 142 76% 36%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 142 76% 36%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 142 76% 36%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**⚠️ КРИТИЧНО**: ВСІ кольори ПОВИННІ бути HSL формату! НЕ використовувати RGB або HEX в компонентах.

---

## 🤖 IOT ІНТЕГРАЦІЯ (ESP8266/ESP32)

### Приклад Прошивки ESP8266

**Файл**: `esp8266-firmware.ino` (Arduino)

```cpp
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// WiFi налаштування
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Supabase налаштування
const char* supabaseUrl = "https://ychnmaaximnoxvwnzrgs.supabase.co";
const char* deviceApiUrl = "https://ychnmaaximnoxvwnzrgs.supabase.co/functions/v1/device-api";

// Унікальний ID пристрою (MAC address)
String deviceId = "";

// Пін налаштування
#define DHT_PIN D4
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

#define WATER_PUMP_PIN D1
#define LIGHT_PIN D2
#define VENT_PIN D3
#define HEATER_PIN D5

// Стан пристрою
struct DeviceState {
  bool waterPump = false;
  bool light = false;
  bool ventilation = false;
  bool heater = false;
  int lightIntensity = 0;
} state;

void setup() {
  Serial.begin(115200);
  delay(10);

  // Ініціалізація пінів
  pinMode(WATER_PUMP_PIN, OUTPUT);
  pinMode(LIGHT_PIN, OUTPUT);
  pinMode(VENT_PIN, OUTPUT);
  pinMode(HEATER_PIN, OUTPUT);

  // Ініціалізація DHT
  dht.begin();

  // Підключення до WiFi
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  // Отримання MAC address як device_id
  deviceId = WiFi.macAddress();
  deviceId.replace(":", "");
  Serial.print("Device ID: ");
  Serial.println(deviceId);
}

void loop() {
  // Читання сенсорів
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  if (isnan(temp) || isnan(hum)) {
    Serial.println("Failed to read from DHT sensor!");
    delay(2000);
    return;
  }

  // Відправка даних на сервер
  sendTelemetry(temp, hum);

  // Затримка 10 секунд
  delay(10000);
}

void sendTelemetry(float temp, float hum) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    http.begin(client, deviceApiUrl);
    http.addHeader("Content-Type", "application/json");

    // Формування JSON
    StaticJsonDocument<256> doc;
    doc["device_id"] = deviceId;
    doc["temp"] = temp;
    doc["hum"] = hum;
    doc["soil_moisture"] = analogRead(A0) / 10.23; // 0-100%
    doc["light_level"] = analogRead(A0) / 10.23;   // Приклад

    String requestBody;
    serializeJson(doc, requestBody);

    Serial.print("Sending: ");
    Serial.println(requestBody);

    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println(httpResponseCode);
      Serial.println(response);

      // Парсинг відповіді (команди від сервера)
      DynamicJsonDocument responseDoc(1024);
      deserializeJson(responseDoc, response);

      if (responseDoc.containsKey("controls")) {
        JsonArray controls = responseDoc["controls"];
        for (JsonObject control : controls) {
          String name = control["control_name"];
          bool value = control["value"];
          int intensity = control["intensity"] | 0;

          // Застосування команд
          if (name == "water_pump") {
            digitalWrite(WATER_PUMP_PIN, value ? HIGH : LOW);
            state.waterPump = value;
          } else if (name == "light_system") {
            analogWrite(LIGHT_PIN, map(intensity, 0, 100, 0, 1023));
            state.light = value;
            state.lightIntensity = intensity;
          } else if (name == "ventilation") {
            digitalWrite(VENT_PIN, value ? HIGH : LOW);
            state.ventilation = value;
          } else if (name == "heater") {
            digitalWrite(HEATER_PIN, value ? HIGH : LOW);
            state.heater = value;
          }
        }
      }
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }
}
```

### MQTT Альтернатива (Опціонально)

Якщо потрібна MQTT інтеграція:

**Topics:**
- `agro-hogwards/{device_id}/telemetry` - Телеметрія від пристрою
- `agro-hogwards/{device_id}/commands` - Команди до пристрою
- `agro-hogwards/{device_id}/status` - Статус пристрою

---

## 🚀 РОЗГОРТАННЯ

### 1. Environment Variables

**Файл**: `.env`

```env
# Supabase
VITE_SUPABASE_URL=https://ychnmaaximnoxvwnzrgs.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# ⚠️ НЕ ВИКОРИСТОВУВАТИ у коді Lovable!
# Замість цього використовувати хардкодні значення в src/integrations/supabase/client.ts
```

### 2. Build Script

**Файл**: `build-for-hosting.sh`

```bash
#!/bin/bash

echo "🌱 Building Agro Hogwards for production..."

# Очистка
rm -rf dist
rm -f grow-box-technology-website.zip

# Build
npm run build

# Створення архіву
cd dist
zip -r ../grow-box-technology-website.zip .
cd ..

echo "✅ Build complete! Upload grow-box-technology-website.zip to your hosting."
```

### 3. Netlify Configuration

**Файл**: `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 4. Vercel Configuration

**Файл**: `vercel.json`

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### 5. Docker (Опціонально)

**Файл**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
```

**Файл**: `Dockerfile.frontend`

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 📝 ІНСТРУКЦІЇ З ВІДТВОРЕННЯ

### Крок 1: Створення Supabase проекту

1. Перейти на [supabase.com](https://supabase.com)
2. Створити новий проект
3. Скопіювати Project URL та Anon Key

### Крок 2: Створення Бази Даних

1. Відкрити SQL Editor у Supabase Dashboard
2. Виконати усі SQL команди з розділу "База Даних" цього документу:
   - Створення ENUM типів
   - Створення таблиць
   - Увімкнення RLS
   - Створення RLS політик
   - Створення функцій
   - Створення тригерів

### Крок 3: Налаштування Frontend

1. Клонувати репозиторій або створити новий проект:
```bash
npm create vite@latest agro-hogwards -- --template react-ts
cd agro-hogwards
```

2. Встановити залежності:
```bash
npm install @supabase/supabase-js@2.80.0
npm install @tanstack/react-query@5.83.0
npm install react-router-dom@6.30.1
npm install react-i18next@15.7.3 i18next@25.5.2
npm install recharts@3.2.1
npm install lucide-react@0.462.0
npm install react-hook-form@7.61.1
npm install zod@3.25.76
npm install @hookform/resolvers@3.10.0
npm install sonner@1.7.4
npm install tailwindcss-animate@1.0.7
npm install class-variance-authority@0.7.1
npm install clsx@2.1.1
npm install tailwind-merge@2.6.0

# Shadcn UI (встановити вручну або через CLI)
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label select table dialog toast
# ... (всі інші компоненти з ui/)
```

3. Скопіювати всі файли з цього документу у відповідні папки

4. Оновити `src/integrations/supabase/client.ts` з вашими credentials:
```typescript
const SUPABASE_URL = "YOUR_PROJECT_URL";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_ANON_KEY";
```

### Крок 4: Розгортання Edge Functions

1. Встановити Supabase CLI:
```bash
npm install -g supabase
```

2. Login:
```bash
supabase login
```

3. Link проекту:
```bash
supabase link --project-ref YOUR_PROJECT_ID
```

4. Deploy functions:
```bash
supabase functions deploy device-api
supabase functions deploy generate-qr
supabase functions deploy notification-system
supabase functions deploy setup
supabase functions deploy confirm-device
```

### Крок 5: Запуск Локально

```bash
npm run dev
```

### Крок 6: Build для Production

```bash
npm run build
```

### Крок 7: Створення Першого Superadmin

1. Зареєструвати користувача через UI
2. У Supabase Dashboard знайти user_id
3. Виконати SQL:
```sql
UPDATE public.user_roles
SET app_role = 'superadmin'
WHERE user_id = 'YOUR_USER_ID';
```

---

## ✅ CHECKLIST ВІДТВОРЕННЯ

- [ ] Створено Supabase проект
- [ ] Створено всі ENUM типи
- [ ] Створено всі таблиці з правильними колонками
- [ ] Увімкнено RLS на всіх таблицях
- [ ] Створено всі RLS політики
- [ ] Створено всі database functions
- [ ] Створено всі triggers
- [ ] Створено перший superadmin акаунт
- [ ] Встановлено Node.js проект
- [ ] Встановлено всі npm залежності
- [ ] Скопійовано всі frontend файли
- [ ] Налаштовано Supabase client з правильними credentials
- [ ] Розгорнуто всі Edge Functions
- [ ] Протестовано локальний запуск
- [ ] Протестовано автентифікацію
- [ ] Протестовано доступ до Admin Panel
- [ ] Протестовано підключення ESP пристрою (опціонально)
- [ ] Зроблено production build
- [ ] Розгорнуто на хостинг

---

## 🎓 ДОДАТКОВІ РЕСУРСИ

- **Supabase Docs**: https://supabase.com/docs
- **React Router Docs**: https://reactrouter.com/
- **TanStack Query**: https://tanstack.com/query/latest
- **Shadcn UI**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **ESP8266 Arduino Core**: https://arduino-esp8266.readthedocs.io/

---

## 📧 ПІДТРИМКА

Для питань та підтримки:
- GitHub Issues: [link to repo]
- Email: support@agro-hogwards.com
- Discord: [link to discord]

---

**🎉 ВІТАЄМО! Ви маєте повну документацію для відтворення проекту Agro Hogwards!**

**Версія:** 5.0 ULTIMATE  
**Останнє оновлення:** 2025-11-19  
**Автор:** Lovable AI + User

---

## 🔑 КРИТИЧНІ МОМЕНТИ (TL;DR)

1. **user_roles.app_role** - НЕ `role`!
2. **device_controls.intensity** - Існує!
3. **devices.last_seen_at** - Існує!
4. **is_admin()** - Тільки у RLS політиках!
5. **get_my_role()** - Тільки у useAuth.tsx!
6. **admin_get_all_users()** - Тільки у UserManager.tsx!
7. **RLS SELECT на user_roles** - БЕЗ is_admin()!
8. **Account.tsx** - Використовувати .maybeSingle()!
9. **ENUM app_role** - 'user', 'developer', 'admin', 'superadmin'
10. **HSL кольори** - ЗАВЖДИ у index.css!
11. **Superadmin** - Повний доступ через is_admin()
12. **НЕ використовувати VITE_*** - Хардкод у client.ts!

---

**ЦЬОГО ДОКУМЕНТУ ДОСТАТНЬО ДЛЯ ПОВНОГО ВІДТВОРЕННЯ ПРОЕКТУ З НУЛЯ! 🚀**
