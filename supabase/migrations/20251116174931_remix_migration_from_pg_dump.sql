--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: get_my_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_role() RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1),
    'user'::app_role
  )
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  
  return new;
end;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


SET default_table_access_method = heap;

--
-- Name: articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    category text NOT NULL,
    author_id uuid,
    published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: device_controls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_controls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    device_id uuid NOT NULL,
    control_type text NOT NULL,
    control_name text NOT NULL,
    value jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: device_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    device_id uuid NOT NULL,
    name text NOT NULL,
    action jsonb NOT NULL,
    schedule_time time without time zone NOT NULL,
    days_of_week integer[] NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    device_id text NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'offline'::text,
    last_seen timestamp with time zone,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    device_id uuid,
    parameter text NOT NULL,
    min_value numeric,
    max_value numeric,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sensor_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sensor_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    device_id uuid NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    temperature numeric,
    humidity numeric,
    light numeric,
    soil_moisture numeric,
    ph numeric,
    ec numeric,
    co2 numeric,
    data jsonb DEFAULT '{}'::jsonb
);


--
-- Name: strains; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.strains (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    description text,
    thc_content text,
    cbd_content text,
    flowering_time text,
    yield_info text,
    difficulty text,
    effects text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: device_controls device_controls_device_id_control_type_control_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_controls
    ADD CONSTRAINT device_controls_device_id_control_type_control_name_key UNIQUE (device_id, control_type, control_name);


--
-- Name: device_controls device_controls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_controls
    ADD CONSTRAINT device_controls_pkey PRIMARY KEY (id);


--
-- Name: device_schedules device_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_schedules
    ADD CONSTRAINT device_schedules_pkey PRIMARY KEY (id);


--
-- Name: devices devices_device_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_device_id_key UNIQUE (device_id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: notification_settings notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: sensor_data sensor_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensor_data
    ADD CONSTRAINT sensor_data_pkey PRIMARY KEY (id);


--
-- Name: strains strains_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strains
    ADD CONSTRAINT strains_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_device_controls_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_device_controls_device_id ON public.device_controls USING btree (device_id);


--
-- Name: idx_device_schedules_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_device_schedules_device_id ON public.device_schedules USING btree (device_id);


--
-- Name: idx_devices_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_devices_device_id ON public.devices USING btree (device_id);


--
-- Name: idx_devices_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_devices_user_id ON public.devices USING btree (user_id);


--
-- Name: idx_notification_settings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_settings_user_id ON public.notification_settings USING btree (user_id);


--
-- Name: idx_sensor_data_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sensor_data_device_id ON public.sensor_data USING btree (device_id);


--
-- Name: idx_sensor_data_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sensor_data_timestamp ON public.sensor_data USING btree ("timestamp" DESC);


--
-- Name: articles update_articles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: devices update_devices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: articles articles_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: device_controls device_controls_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_controls
    ADD CONSTRAINT device_controls_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id) ON DELETE CASCADE;


--
-- Name: device_schedules device_schedules_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_schedules
    ADD CONSTRAINT device_schedules_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id) ON DELETE CASCADE;


--
-- Name: devices devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notification_settings notification_settings_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id) ON DELETE CASCADE;


--
-- Name: notification_settings notification_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sensor_data sensor_data_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensor_data
    ADD CONSTRAINT sensor_data_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: articles Admins can manage articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage articles" ON public.articles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: strains Admins can manage strains; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage strains" ON public.strains USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: sensor_data Allow insert sensor data for device owners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert sensor data for device owners" ON public.sensor_data FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.devices
  WHERE ((devices.id = sensor_data.device_id) AND (devices.user_id = auth.uid())))));


--
-- Name: articles Anyone can view published articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published articles" ON public.articles FOR SELECT USING (((published = true) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: strains Anyone can view strains; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view strains" ON public.strains FOR SELECT USING (true);


--
-- Name: devices Users can delete their own devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own devices" ON public.devices FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: devices Users can insert their own devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own devices" ON public.devices FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: device_controls Users can manage controls for their devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage controls for their devices" ON public.device_controls USING ((EXISTS ( SELECT 1
   FROM public.devices
  WHERE ((devices.id = device_controls.device_id) AND (devices.user_id = auth.uid())))));


--
-- Name: device_schedules Users can manage schedules for their devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage schedules for their devices" ON public.device_schedules USING ((EXISTS ( SELECT 1
   FROM public.devices
  WHERE ((devices.id = device_schedules.device_id) AND (devices.user_id = auth.uid())))));


--
-- Name: notification_settings Users can manage their own notification settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own notification settings" ON public.notification_settings USING ((auth.uid() = user_id));


--
-- Name: devices Users can update their own devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own devices" ON public.devices FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: device_controls Users can view controls for their devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view controls for their devices" ON public.device_controls FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.devices
  WHERE ((devices.id = device_controls.device_id) AND (devices.user_id = auth.uid())))));


--
-- Name: device_schedules Users can view schedules for their devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view schedules for their devices" ON public.device_schedules FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.devices
  WHERE ((devices.id = device_schedules.device_id) AND (devices.user_id = auth.uid())))));


--
-- Name: sensor_data Users can view sensor data for their devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view sensor data for their devices" ON public.sensor_data FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.devices
  WHERE ((devices.id = sensor_data.device_id) AND (devices.user_id = auth.uid())))));


--
-- Name: devices Users can view their own devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own devices" ON public.devices FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notification_settings Users can view their own notification settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notification settings" ON public.notification_settings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: articles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

--
-- Name: device_controls; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.device_controls ENABLE ROW LEVEL SECURITY;

--
-- Name: device_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.device_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: devices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: sensor_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;

--
-- Name: strains; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.strains ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


