# 🌿 Agro Hogwards - Complete Migration & Restoration Guide

> **Version:** 2.1 | **Last Updated:** 2026-01-21  
> **Purpose:** Full project backup for recreation on any platform (Cursor, VS Code, new Lovable instance)  
> **Recent Updates:** Archive system, GrowHistoryPage, smart lifecycle logic

---

## 📁 1. FILE STRUCTURE MAP

```
agro-hogwards/
├── public/
│   ├── favicon.ico
│   ├── manifest.json              # PWA manifest
│   ├── robots.txt
│   ├── sitemap.xml
│   └── esp8266-setup-example.html # Device setup reference
│
├── src/
│   ├── assets/
│   │   └── logo-agro-hogwards.png
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components (button, card, dialog, etc.)
│   │   ├── admin/                 # Admin panel components
│   │   │   ├── ArticleManager.tsx
│   │   │   ├── LibraryStrainEditor.tsx   # 🔑 Strain passport editor with AI import
│   │   │   ├── LibraryStrainManager.tsx
│   │   │   ├── AIStrainImportModal.tsx   # 🔑 AI-powered strain data parser UI
│   │   │   ├── StrainManager.tsx
│   │   │   └── UserManager.tsx
│   │   │
│   │   ├── laboratory/            # Plant lifecycle management
│   │   │   ├── ActiveGrowsSection.tsx    # 🔑 Main plant cards grid with auto-stage
│   │   │   ├── PlantDetailsDialog.tsx
│   │   │   ├── PlantTimelineCalendar.tsx
│   │   │   ├── MasterPlantController.tsx
│   │   │   ├── DaySummaryPanel.tsx
│   │   │   ├── VPDCalculator.tsx
│   │   │   ├── NutrientCalculator.tsx
│   │   │   └── ElectricityCostCalculator.tsx
│   │   │
│   │   ├── library/               # Knowledge base
│   │   │   ├── KnowledgeBase.tsx
│   │   │   ├── ArticleReader.tsx
│   │   │   └── StrainDetailsDialog.tsx
│   │   │
│   │   ├── ActivePlantContext.tsx
│   │   ├── AddDeviceDialog.tsx
│   │   ├── AddPlantDialog.tsx     # 🔑 Smart stage auto-calculation on add
│   │   ├── AuthForm.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DeviceCard.tsx
│   │   ├── DeviceControls.tsx     # 🔑 Main device control panel (Light/Climate/Pump/Vent)
│   │   ├── DeviceManagement.tsx
│   │   ├── DeviceSettings.tsx
│   │   ├── EditPlantDialog.tsx    # 🔑 Plant editing with archive functionality
│   │   ├── Header.tsx
│   │   ├── Layout.tsx
│   │   ├── Navigation.tsx
│   │   ├── RemoteControl.tsx
│   │   ├── SensorCardsGrid.tsx
│   │   ├── SensorChart.tsx
│   │   └── Terminal.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.tsx            # 🔑 Authentication context & session management
│   │   ├── useAutoPilot.tsx       # 🔑 AI Smart Mode - calculates targets from strain data
│   │   ├── useDeviceControls.tsx  # Device settings CRUD
│   │   ├── useDeviceLogs.tsx
│   │   ├── useDeviceSchedules.tsx
│   │   ├── useDevices.tsx
│   │   ├── useLibrary.ts
│   │   ├── usePlantData.tsx       # 🔑 Plant data with smart stage override
│   │   ├── usePlantLifecycle.tsx  # 🔑 Auto-stage calculation & transitions
│   │   ├── usePlantsWithStrains.tsx
│   │   ├── usePremiumStatus.tsx
│   │   ├── useSensorData.tsx
│   │   └── useUserRole.tsx
│   │
│   ├── pages/
│   │   ├── Account.tsx
│   │   ├── AdminPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── Auth.tsx
│   │   ├── DashboardPage.tsx      # Main cockpit
│   │   ├── DeviceDetail.tsx
│   │   ├── DevicesPage.tsx
│   │   ├── GrowHistoryPage.tsx    # 🔑 Archived/harvested plants
│   │   ├── Index.tsx
│   │   ├── LaboratoryPage.tsx
│   │   ├── LibraryPage.tsx
│   │   ├── NotFound.tsx
│   │   ├── QRConnection.tsx
│   │   ├── RemoteControlPage.tsx
│   │   └── Settings.tsx
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Supabase client initialization
│   │       └── types.ts           # Auto-generated types (DO NOT EDIT)
│   │
│   ├── types/
│   │   ├── index.ts               # 🔑 DeviceSettings, GrowingParams, LibraryStrainFull
│   │   └── supabase-v2.8.ts
│   │
│   ├── lib/
│   │   ├── utils.ts               # cn() helper
│   │   ├── validations.ts
│   │   └── vpd.ts                 # VPD calculation formulas
│   │
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── en.json
│   │       ├── ru.json
│   │       └── uk.json
│   │
│   ├── App.tsx                    # Router setup
│   ├── App.css
│   ├── index.css                  # 🔑 Design system tokens (HSL colors)
│   └── main.tsx
│
├── supabase/
│   ├── config.toml
│   └── functions/
│       ├── confirm-device/        # Device pairing confirmation
│       ├── device-api/            # 🔑 ESP8266 API endpoint
│       ├── generate-article/      # AI article generation
│       ├── generate-qr/
│       ├── notification-system/
│       ├── parse-strain-text/     # 🔑 AI strain passport parser
│       └── setup/
│
├── .env                           # Environment variables
├── tailwind.config.ts
├── vite.config.ts
├── package.json
└── index.html
```

---

## 🗄️ 2. DATABASE SCHEMA (SQL)

### 2.1 ENUM Types

```sql
-- User roles
CREATE TYPE public.app_role AS ENUM ('user', 'developer', 'admin', 'superadmin');

-- Measurement units preference
CREATE TYPE public.preferred_units AS ENUM ('metric', 'imperial');

-- Subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
```

### 2.2 Core Tables

#### profiles
```sql
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  category TEXT DEFAULT 'standard',
  units preferred_units NOT NULL DEFAULT 'metric',
  is_ai_allowed BOOLEAN NOT NULL DEFAULT false,
  developer_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all, Users manage their own"
ON public.profiles FOR ALL
USING (is_admin() OR (auth.uid() = user_id))
WITH CHECK (is_admin() OR (auth.uid() = user_id));
```

#### user_roles
```sql
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  app_role app_role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow_SELECT_for_self_or_system"
ON public.user_roles FOR SELECT
USING ((auth.uid() = user_id) OR (SESSION_USER = 'postgres'));

CREATE POLICY "Allow_INSERT_for_admins"
ON public.user_roles FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Allow_UPDATE_for_admins"
ON public.user_roles FOR UPDATE
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Allow_DELETE_for_admins"
ON public.user_roles FOR DELETE
USING (is_admin());
```

#### devices
```sql
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Unnamed Device',
  type TEXT NOT NULL DEFAULT 'grow_box',
  location TEXT,
  status TEXT NOT NULL DEFAULT 'offline',
  settings JSONB DEFAULT '{}'::jsonb,
  group_id UUID,
  last_temp DOUBLE PRECISION,
  last_hum DOUBLE PRECISION,
  last_soil_moisture DOUBLE PRECISION DEFAULT 0,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all, Users manage their own"
ON public.devices FOR ALL
USING (is_admin() OR (auth.uid() = user_id))
WITH CHECK (is_admin() OR (auth.uid() = user_id));
```

#### plants
```sql
CREATE TABLE public.plants (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id TEXT,
  strain_id BIGINT,
  custom_name TEXT,
  photo_url TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  current_stage TEXT DEFAULT 'seedling',
  is_main BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own plants"
ON public.plants FOR ALL
USING (auth.uid() = user_id);
```

#### library_strains
```sql
CREATE TABLE public.library_strains (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  breeder TEXT,
  type TEXT,
  genotype TEXT,
  thc_percent NUMERIC,
  thc_content TEXT,
  genetics TEXT DEFAULT 'Autoflower',
  flowering_days INTEGER,
  difficulty TEXT DEFAULT 'Medium',
  yield_indoor TEXT,
  description TEXT,
  photo_url TEXT,
  presets JSONB DEFAULT '{"veg": {"hum": 70, "temp": 26, "light_h": 18}, "bloom": {"hum": 50, "temp": 24, "light_h": 12}, "flush": {"hum": 40, "temp": 22, "light_h": 12}}'::jsonb,
  growing_params JSONB,
  is_public BOOLEAN DEFAULT false,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.library_strains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read Access"
ON public.library_strains FOR SELECT
USING ((is_public = true) OR (auth.uid() = user_id));

CREATE POLICY "Modify Strains"
ON public.library_strains FOR ALL
USING ((auth.uid() = user_id) OR is_admin())
WITH CHECK ((auth.uid() = user_id) OR is_admin());

CREATE POLICY "Create Access"
ON public.library_strains FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND ((is_public = false) OR (is_public IS NULL)));

CREATE POLICY "Admin Create Access"
ON public.library_strains FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND is_admin());
```

#### device_logs
```sql
CREATE TABLE public.device_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  device_id_uuid UUID,
  user_id UUID,
  temp DOUBLE PRECISION,
  hum DOUBLE PRECISION,
  soil_moisture DOUBLE PRECISION,
  light_level DOUBLE PRECISION,
  metric TEXT DEFAULT 'env',
  value NUMERIC,
  light_cycle_hours INTEGER,
  irrigation_time TIME,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.device_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for their devices"
ON public.device_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM devices
  WHERE devices.device_id = device_logs.device_id
  AND devices.user_id = auth.uid()
));
```

#### device_controls
```sql
CREATE TABLE public.device_controls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL,
  user_id UUID,
  control_name TEXT NOT NULL,
  control_type TEXT NOT NULL,
  value BOOLEAN DEFAULT false,
  intensity INTEGER DEFAULT 0,
  schedule JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.device_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own"
ON public.device_controls FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### articles
```sql
CREATE TABLE public.articles (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  user_id UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read articles"
ON public.articles FOR SELECT USING (true);

CREATE POLICY "Admin can manage articles"
ON public.articles FOR ALL
USING (auth.uid() = user_id);
```

#### plant_journal_events
```sql
CREATE TABLE public.plant_journal_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  photo_url TEXT,
  day_of_grow INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plant_journal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own journal events"
ON public.plant_journal_events FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### plans & subscriptions
```sql
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price_monthly NUMERIC DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  plan_id UUID NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.3 Database Functions

```sql
-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND app_role IN ('admin', 'developer')
  )
$$;

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE sql STABLE
AS $$
  SELECT app_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Admin function to get all users
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(user_id uuid, email text, app_role app_role, full_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.user_id,
    p.email,
    COALESCE(ur.app_role, 'user'::app_role) as app_role,
    p.full_name
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  WHERE public.is_admin();
$$;

-- Handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SET LOCAL role 'postgres'; 

  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, app_role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Update device state from sensor logs
CREATE OR REPLACE FUNCTION public.update_device_latest_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.devices
  SET
    last_temp = NEW.temp,
    last_hum = NEW.hum,
    last_soil_moisture = NEW.soil_moisture,
    last_seen_at = NEW.created_at,
    status = 'online'
  WHERE device_id = NEW.device_id;
  RETURN NEW;
END;
$$;

-- Get device settings (for ESP8266 API)
CREATE OR REPLACE FUNCTION public.get_device_settings(device_uuid text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    device_settings jsonb;
    device_found boolean;
BEGIN
    SELECT EXISTS(SELECT 1 FROM devices WHERE device_id = device_uuid) INTO device_found;
    
    IF NOT device_found THEN
        RETURN json_build_object('error', 'device_not_found', 'device_id', device_uuid);
    END IF;

    SELECT settings INTO device_settings
    FROM devices
    WHERE device_id = device_uuid;

    IF device_settings IS NULL OR device_settings = '{}'::jsonb THEN
        RETURN json_build_object(
            'target_temp', 25.0,
            'target_hum', 60,
            'soil_min', 30,
            'soil_max', 70,
            'light_start_h', 6,
            'light_start_m', 0,
            'light_end_h', 22,
            'light_end_m', 0,
            'light_mode', 1,
            'pump_mode', 0,
            'pump_pulse', 0,
            'climate_mode', 0
        );
    END IF;

    RETURN json_build_object(
        'target_temp', COALESCE((device_settings->>'target_temp')::float, 25.0),
        'target_hum', COALESCE((device_settings->>'target_hum')::int, 60),
        'soil_min', COALESCE((device_settings->>'soil_min')::int, 30),
        'soil_max', COALESCE((device_settings->>'soil_max')::int, 70),
        'light_start_h', COALESCE((device_settings->>'light_start_h')::int, 6),
        'light_start_m', COALESCE((device_settings->>'light_start_m')::int, 0),
        'light_end_h', COALESCE((device_settings->>'light_end_h')::int, 22),
        'light_end_m', COALESCE((device_settings->>'light_end_m')::int, 0),
        'light_mode', COALESCE((device_settings->>'light_mode')::int, 1),
        'pump_mode', COALESCE((device_settings->>'pump_mode')::int, 0),
        'pump_pulse', COALESCE((device_settings->>'pump_pulse')::int, 0),
        'climate_mode', COALESCE((device_settings->>'climate_mode')::int, 0)
    );
END;
$$;

-- Secure device registration
CREATE OR REPLACE FUNCTION public.secure_register_device(
  p_device_id text, 
  p_name text, 
  p_type text, 
  p_location text DEFAULT NULL
)
RETURNS TABLE(id uuid, device_id text, name text, type text, user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.devices (user_id, device_id, name, type, location, status)
  VALUES (auth.uid(), p_device_id, p_name, p_type, p_location, 'offline')
  RETURNING devices.id, devices.device_id, devices.name, devices.type, devices.user_id;
END;
$$;

-- Mark offline devices
CREATE OR REPLACE FUNCTION public.check_and_zero_offline_devices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.devices
  SET status = 'offline', last_temp = 0, last_hum = 0, last_soil_moisture = 0
  WHERE last_seen_at < (now() - interval '45 seconds')
  AND status = 'online';
END;
$$;

-- Reset main plant flag
CREATE OR REPLACE FUNCTION public.reset_main_plant()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_main = true THEN
    UPDATE public.plants
    SET is_main = false
    WHERE user_id = NEW.user_id 
    AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

### 2.4 Triggers

```sql
-- Create profile and role on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update device state when new log arrives
CREATE TRIGGER update_device_on_log
  AFTER INSERT ON public.device_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_device_latest_state();

-- Reset main plant when setting new main
CREATE TRIGGER trigger_reset_main_plant
  BEFORE INSERT OR UPDATE ON public.plants
  FOR EACH ROW EXECUTE FUNCTION public.reset_main_plant();

-- Auto-update timestamps
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_devices
  BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### 2.5 Storage Buckets

```sql
-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('grow-images', 'grow-images', true);

-- Storage policies
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'grow-images');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'grow-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'grow-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'grow-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🔐 3. ENVIRONMENT VARIABLES

### Frontend (.env)
```env
# Supabase Configuration (Public/Publishable)
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."  # anon key
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

### Supabase Edge Functions (Secrets)
```env
# Set via Supabase Dashboard > Settings > Functions
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # NEVER expose publicly
SUPABASE_DB_URL="postgresql://..."

# AI Integration (for parse-strain-text & generate-article)
LOVABLE_API_KEY="your-lovable-api-key"
```

---

## 📦 4. DEPENDENCIES

### Core Dependencies
```json
{
  "@supabase/supabase-js": "^2.80.0",
  "@tanstack/react-query": "^5.83.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.1"
}
```

### UI Framework
```json
{
  "tailwindcss": "^3.x",
  "tailwindcss-animate": "^1.0.7",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0",
  "lucide-react": "^0.462.0"
}
```

### shadcn/ui Components
```json
{
  "@radix-ui/react-dialog": "^1.1.14",
  "@radix-ui/react-dropdown-menu": "^2.1.15",
  "@radix-ui/react-tabs": "^1.1.12",
  "@radix-ui/react-select": "^2.2.5",
  "@radix-ui/react-switch": "^1.2.5",
  "@radix-ui/react-slider": "^1.3.5",
  "@radix-ui/react-progress": "^1.1.7",
  "@radix-ui/react-toast": "^1.2.14",
  "@radix-ui/react-tooltip": "^1.2.7",
  "sonner": "^1.7.4",
  "vaul": "^0.9.9",
  "cmdk": "^1.1.1"
}
```

### Data & Forms
```json
{
  "react-hook-form": "^7.61.1",
  "@hookform/resolvers": "^3.10.0",
  "zod": "^3.25.76",
  "date-fns": "^4.1.0",
  "recharts": "^3.2.1"
}
```

### Utilities
```json
{
  "i18next": "^25.5.2",
  "react-i18next": "^15.7.3",
  "react-qr-code": "^2.0.18",
  "react-markdown": "^10.1.0",
  "remark-gfm": "^4.0.1",
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0"
}
```

### Build Tools
```json
{
  "vite": "^5.x",
  "@vitejs/plugin-react": "^5.0.3",
  "typescript": "^5.x"
}
```

---

## 🧠 5. LOGIC SUMMARY (Black Box Details)

### 5.1 AI Strain Import (`parse-strain-text` Edge Function)

**Purpose:** Convert raw datasheet text into structured JSON for Scientific Passport.

**Flow:**
1. User pastes text (e.g., from seed bank website) into `AIStrainImportModal`
2. Frontend calls `supabase.functions.invoke('parse-strain-text', { body: { text } })`
3. Edge Function sends to Lovable AI Gateway with structured prompt
4. AI returns JSON matching `GrowingParams` schema
5. UI populates `LibraryStrainEditor` form fields

**AI Prompt Structure:**
```
System: You are an expert cannabis cultivation data parser.
Parse the text into JSON with:
- passport: { name, breeder, type, genotype, thc_percent, flowering_days }
- genetics: { sativa, indica, ruderalis percentages }
- morphology: { stretch_ratio }
- nutrition_profile: { feeder_type: light|medium|heavy }
- resistance_rating: { mold, pests, heat, cold: 1-5 }
- stages: Array of { name, days_duration, temp: [night, day], humidity, vpd, ppfd, ec }
- wiki: { training, warnings[] }
- timeline_alerts: [{ stage, day_offset, message }]
```

### 5.2 Smart AI Mode (`useAutoPilot` Hook)

**Purpose:** Automatically calculate and apply device settings based on plant's current growth stage.

**Flow:**
```
┌─────────────────────────────────────────────────────────┐
│                    useAutoPilot Hook                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. FETCH Master Plant (is_main = true for device)       │
│     ↓                                                    │
│  2. GET Strain's growing_params from library_strains     │
│     ↓                                                    │
│  3. CALCULATE Current Stage (from start_date + timeline) │
│     ↓                                                    │
│  4. EXTRACT Stage Targets (temp, humidity, light_hours)  │
│     ↓                                                    │
│  5. TRANSFORM to DeviceSettings format                   │
│     ↓                                                    │
│  6. APPLY to devices.settings via saveSettings()         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key Functions:**
- `normalizeStage(stage)`: Maps aliases (veg → vegetation, bloom → flowering)
- `extractStageTargets(growingParams, stageName)`: Gets temp/humidity/VPD for stage
- `calculateAutoPilotTargets(stageTarget, stageName)`: Converts to DeviceSettings format

**Target Calculation:**
```typescript
// Example output
{
  target_temp: 25,           // Day temp from stage
  target_hum: 60,            // RH from stage
  light_start_h: 6,          // Calculated from light_hours
  light_start_m: 0,
  light_end_h: 24,           // 6 + 18 = 24:00
  light_end_m: 0,
  climate_mode: 1,           // Always ON in AI mode
  light_mode: 1,             // AUTO schedule
}
```

### 5.3 Plant Lifecycle Auto-Transition (`usePlantLifecycle` Hook)

**Purpose:** Automatically update plant stage in database based on elapsed time.

**Key Functions:**
- `calculateStageFromAge(startDate, growingParams)` - Core function that determines stage from age
- `buildStageDefinitions(growingParams)` - Builds cumulative timeline from strain stages
- `normalizeStageNameForDB(stageName)` - Maps aliases to standard names
- `getStageDisplayInfo(startDate, currentStage, growingParams)` - UI display helper

**Stage Normalization Map:**
```typescript
const normalizeMap = {
  'seedling': 'seedling',
  'germination': 'seedling',
  'vegetation': 'vegetation', 
  'veg': 'vegetation',
  'flowering': 'flowering',
  'bloom': 'flowering',
  'ripening': 'flushing',
  'flushing': 'flushing',
  'harvested': 'harvested',
  'archived': 'archived',
};
```

**Flow:**
```
┌─────────────────────────────────────────────────────────┐
│              useAutoStageTransition Hook                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ON MOUNT (ActiveGrowsSection):                          │
│  ↓                                                       │
│  FOR EACH active plant:                                  │
│    1. Get start_date and strain.growing_params           │
│    2. Build stage definitions with cumulative days:      │
│       Seedling: days 0-14 (startDay: 0, endDay: 14)      │
│       Vegetation: days 14-42 (startDay: 14, endDay: 42)  │
│       Flowering: days 42-98 (startDay: 42, endDay: 98)   │
│       Flushing: days 98-112 (startDay: 98, endDay: 112)  │
│    3. Calculate totalAge = differenceInDays(now, start)  │
│    4. Find stage where totalAge >= startDay && < endDay  │
│    5. Calculate dayInStage = totalAge - startDay + 1     │
│    6. IF past all stages → return 'harvested' (overdue)  │
│    7. IF calculated ≠ stored → UPDATE database           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Critical: Rollover Logic**
```typescript
// When plant exceeds stage duration, it MUST roll over
// "Flowering Day 53/47" → "Flushing Day 6"

// In calculateStageFromAge():
if (totalAge >= stage.startDay && totalAge < stage.endDay) {
  return {
    stageName: stage.name,
    dayInStage: totalAge - stage.startDay + 1,
    stageDuration: stage.durationDays,
    isOverdue: false,
  };
}

// Past ALL stages:
if (totalAge >= lastStage.endDay) {
  return {
    stageName: 'Harvested',
    normalizedName: 'harvested',
    isOverdue: true,
  };
}
```

**Stage Override (Manual):**
```typescript
// When user forces a stage change:
useStageOverride().overrideStage({
  plantId: 'uuid',
  newStage: 'flowering',
  growingParams: strain.growing_params,
  dayInStage: 1  // Start at day 1 of new stage
});

// This RECALCULATES start_date to make the math align:
// new_start_date = today - (cumulative_days_before_stage + dayInStage - 1)
```

### 5.4 Plant Archive System

**Purpose:** Move completed/harvested plants to history while keeping them visible.

**Database Stage Values:**
- Active plants: `seedling`, `vegetation`, `pre-flowering`, `flowering`, `flushing`, `drying`
- Archived plants: `harvested`, `archived`

**Archive Flow:**
```
┌─────────────────────────────────────────────────────────┐
│              Archive Workflow                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  EditPlantDialog → "Move to Archive" button              │
│  ↓                                                       │
│  Confirmation Dialog                                     │
│  ↓                                                       │
│  UPDATE plants SET                                       │
│    current_stage = 'harvested',                          │
│    is_main = false                                       │
│  ↓                                                       │
│  Invalidate queries: ['plants-with-strains'],            │
│    ['archived-plants'], ['main-plant']                   │
│  ↓                                                       │
│  Plant disappears from ActiveGrowsSection                │
│  Plant appears in GrowHistoryPage                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Data Fetching (usePlantsWithStrains):**
```typescript
// Active plants - EXCLUDE archived
.not('current_stage', 'in', '("harvested","archived")')

// Archived plants (GrowHistoryPage)
.in('current_stage', ['harvested', 'archived'])
```

**GrowHistoryPage Features:**
- Stats: Completed grows count, unique strains count
- Card display: Photo, name, strain, start date, grow duration, device, notes
- Status badges: "Harvested" or "Archived"

### 5.4 DeviceSettings Protocol (ESP8266 Communication)

**Settings JSONB Structure:**
```typescript
interface DeviceSettings {
  // Climate
  climate_mode: number;    // 0: OFF, 1: ON
  target_temp: number;     // Target temperature °C
  temp_hyst: number;       // Hysteresis °C
  target_hum: number;      // Target humidity %
  hum_hyst: number;        // Hysteresis %
  seasonal_mode: number;   // 0: Winter/Heat, 1: Summer/Cool
  
  // Lighting
  light_mode: number;      // 0: Manual OFF, 1: AUTO, 2: Manual ON
  light_start_h: number;   // Start hour (0-23)
  light_start_m: number;   // Start minute (0-59)
  light_end_h: number;     // End hour (0-23)
  light_end_m: number;     // End minute (0-59)
  
  // Irrigation
  pump_mode: number;       // 0: AUTO (sensor), 1: Manual ON, 2: Manual OFF
  pump_pulse: number;      // 1: Trigger 10s watering, 0: Idle
  soil_min: number;        // Min soil moisture %
  soil_max: number;        // Max soil moisture %
  
  // Ventilation
  vent_mode: number;       // 0: OFF, 1: AUTO (timer)
  vent_duration_sec: number;
  vent_interval_sec: number;
  
  // AI (Premium)
  ai_mode?: number;        // 0: User, 1: AI Pilot
}
```

**ESP8266 Polling:**
```
GET /functions/v1/device-api?action=get_settings&device_id=XXX
→ Returns: { target_temp, target_hum, light_mode, ... }

POST /functions/v1/device-api?action=send_data&device_id=XXX
Body: { temp: 25.5, hum: 60, soil_moisture: 45 }
→ Triggers: update_device_latest_state() function
→ Updates: devices.last_temp, last_hum, last_soil_moisture, status='online'
```

---

## 🚀 6. QUICK START FOR NEW INSTANCE

### Step 1: Clone & Install
```bash
git clone <repo-url>
cd agro-hogwards
npm install
```

### Step 2: Supabase Setup
1. Create new Supabase project
2. Run SQL migrations (Section 2)
3. Enable Email Auth in Dashboard
4. Create storage bucket `grow-images`
5. Set Edge Function secrets

### Step 3: Configure Environment
```bash
# Create .env
echo 'VITE_SUPABASE_URL="https://xxx.supabase.co"' > .env
echo 'VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."' >> .env
```

### Step 4: Deploy Edge Functions
```bash
# Using Supabase CLI
supabase functions deploy device-api
supabase functions deploy parse-strain-text
supabase functions deploy generate-article
```

### Step 5: Run Development
```bash
npm run dev
```

---

## 📋 7. VERIFICATION CHECKLIST

### Core Features
- [ ] User registration creates profile + role
- [ ] Device registration works with QR code
- [ ] ESP8266 can send/receive data
- [ ] AI Import parses strain datasheets
- [ ] Smart AI Mode calculates targets from strain
- [ ] Admin panel manages users/strains/articles

### Plant Lifecycle (v2.1)
- [ ] `calculateStageFromAge()` returns correct stage from start_date
- [ ] Stages auto-transition on mount via `useAutoStageTransition()`
- [ ] Overdue plants roll to next stage (no "Flowering 53/47")
- [ ] Progress bars capped at 100%
- [ ] "Overdue" badge displays when plant past expected duration
- [ ] Stage override recalculates start_date correctly

### Archive System (v2.1)
- [ ] "Move to Archive" button in EditPlantDialog
- [ ] Archived plants disappear from ActiveGrowsSection
- [ ] GrowHistoryPage shows harvested/archived plants
- [ ] Stats display: completed grows, unique strains
- [ ] Missing data plants show "Data Missing" badge (not hidden)

---

## 🆕 8. CHANGELOG

### v2.1 (2026-01-21)
- **Fixed:** Stage calculation rollover logic (Flowering→Flushing auto-transition)
- **Fixed:** Progress bars capped at 100%
- **Added:** "Overdue" badge for plants past lifecycle
- **Added:** `harvested` and `archived` stage support
- **Added:** GrowHistoryPage for completed grows
- **Added:** "Move to Archive" button in EditPlantDialog
- **Fixed:** ActiveGrowsSection shows plants with missing data (with badge)
- **Updated:** usePlantsWithStrains excludes `harvested`/`archived` from active view

### v2.0 (2026-01-20)
- Initial comprehensive migration guide
- Complete SQL schema documentation
- AI Smart Mode logic documentation
- ESP8266 communication protocol

---

**🔒 BACKUP COMPLETE - This document contains everything needed to recreate Agro Hogwards from scratch.**
