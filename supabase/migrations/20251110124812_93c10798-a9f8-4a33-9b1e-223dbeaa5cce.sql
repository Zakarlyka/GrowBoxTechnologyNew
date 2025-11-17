-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create app_role enum
create type public.app_role as enum ('admin', 'moderator', 'user');

-- Create profiles table
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'user',
  created_at timestamp with time zone default now() not null,
  unique (user_id, role)
);

-- Create devices table
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  device_id text not null unique,
  type text not null,
  status text default 'offline',
  last_seen timestamp with time zone,
  config jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create sensor_data table
create table public.sensor_data (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.devices(id) on delete cascade not null,
  timestamp timestamp with time zone default now() not null,
  temperature numeric,
  humidity numeric,
  light numeric,
  soil_moisture numeric,
  ph numeric,
  ec numeric,
  co2 numeric,
  data jsonb default '{}'::jsonb
);

-- Create device_controls table
create table public.device_controls (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.devices(id) on delete cascade not null,
  control_type text not null,
  control_name text not null,
  value jsonb not null,
  updated_at timestamp with time zone default now() not null,
  unique (device_id, control_type, control_name)
);

-- Create device_schedules table
create table public.device_schedules (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.devices(id) on delete cascade not null,
  name text not null,
  action jsonb not null,
  schedule_time time not null,
  days_of_week integer[] not null,
  enabled boolean default true,
  created_at timestamp with time zone default now() not null
);

-- Create notification_settings table
create table public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  device_id uuid references public.devices(id) on delete cascade,
  parameter text not null,
  min_value numeric,
  max_value numeric,
  enabled boolean default true,
  created_at timestamp with time zone default now() not null
);

-- Create articles table for library
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null,
  author_id uuid references auth.users(id) on delete set null,
  published boolean default false,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create strains table for library
create table public.strains (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  description text,
  thc_content text,
  cbd_content text,
  flowering_time text,
  yield_info text,
  difficulty text,
  effects text[],
  created_at timestamp with time zone default now() not null
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.devices enable row level security;
alter table public.sensor_data enable row level security;
alter table public.device_controls enable row level security;
alter table public.device_schedules enable row level security;
alter table public.notification_settings enable row level security;
alter table public.articles enable row level security;
alter table public.strains enable row level security;

-- Create security definer function for role checking
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- User roles policies
create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can manage all roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'));

-- Devices policies
create policy "Users can view their own devices"
  on public.devices for select
  using (auth.uid() = user_id);

create policy "Users can insert their own devices"
  on public.devices for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own devices"
  on public.devices for update
  using (auth.uid() = user_id);

create policy "Users can delete their own devices"
  on public.devices for delete
  using (auth.uid() = user_id);

-- Sensor data policies
create policy "Users can view sensor data for their devices"
  on public.sensor_data for select
  using (
    exists (
      select 1 from public.devices
      where devices.id = sensor_data.device_id
        and devices.user_id = auth.uid()
    )
  );

create policy "Allow insert sensor data for device owners"
  on public.sensor_data for insert
  with check (
    exists (
      select 1 from public.devices
      where devices.id = sensor_data.device_id
        and devices.user_id = auth.uid()
    )
  );

-- Device controls policies
create policy "Users can view controls for their devices"
  on public.device_controls for select
  using (
    exists (
      select 1 from public.devices
      where devices.id = device_controls.device_id
        and devices.user_id = auth.uid()
    )
  );

create policy "Users can manage controls for their devices"
  on public.device_controls for all
  using (
    exists (
      select 1 from public.devices
      where devices.id = device_controls.device_id
        and devices.user_id = auth.uid()
    )
  );

-- Device schedules policies
create policy "Users can view schedules for their devices"
  on public.device_schedules for select
  using (
    exists (
      select 1 from public.devices
      where devices.id = device_schedules.device_id
        and devices.user_id = auth.uid()
    )
  );

create policy "Users can manage schedules for their devices"
  on public.device_schedules for all
  using (
    exists (
      select 1 from public.devices
      where devices.id = device_schedules.device_id
        and devices.user_id = auth.uid()
    )
  );

-- Notification settings policies
create policy "Users can view their own notification settings"
  on public.notification_settings for select
  using (auth.uid() = user_id);

create policy "Users can manage their own notification settings"
  on public.notification_settings for all
  using (auth.uid() = user_id);

-- Articles policies (public read, admin write)
create policy "Anyone can view published articles"
  on public.articles for select
  using (published = true or public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage articles"
  on public.articles for all
  using (public.has_role(auth.uid(), 'admin'));

-- Strains policies (public read, admin write)
create policy "Anyone can view strains"
  on public.strains for select
  using (true);

create policy "Admins can manage strains"
  on public.strains for all
  using (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
create index idx_devices_user_id on public.devices(user_id);
create index idx_devices_device_id on public.devices(device_id);
create index idx_sensor_data_device_id on public.sensor_data(device_id);
create index idx_sensor_data_timestamp on public.sensor_data(timestamp desc);
create index idx_device_controls_device_id on public.device_controls(device_id);
create index idx_device_schedules_device_id on public.device_schedules(device_id);
create index idx_notification_settings_user_id on public.notification_settings(user_id);

-- Create updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers for updated_at
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_devices_updated_at before update on public.devices
  for each row execute function public.update_updated_at_column();

create trigger update_articles_updated_at before update on public.articles
  for each row execute function public.update_updated_at_column();

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable realtime for critical tables
alter publication supabase_realtime add table public.devices;
alter publication supabase_realtime add table public.sensor_data;
alter publication supabase_realtime add table public.device_controls;