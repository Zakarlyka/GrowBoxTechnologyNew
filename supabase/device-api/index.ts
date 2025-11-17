import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeviceLogRequest {
  device_id: string;
  temp?: number;
  hum?: number;
  soil_moisture?: number;
  light_level?: number;
  light_cycle_hours?: number;
  irrigation_time?: string;
}

interface DeviceActionRequest {
  device_id: string;
  control_name: string;
  value?: boolean;
  intensity?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  
  try {
    // GET /device-api/device/:id/logs - Get device sensor logs
    if (req.method === 'GET' && segments[1] === 'device' && segments[3] === 'logs') {
      const deviceId = segments[2];
      const limit = url.searchParams.get('limit') || '100';
      const hours = url.searchParams.get('hours') || '24';
      
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - parseInt(hours));

      const { data: logs, error } = await supabase
        .from('device_logs')
        .select('*')
        .eq('device_id', deviceId)
        .gte('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (error) throw error;

      return new Response(JSON.stringify({ logs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /device-api/device/:id/log - Add sensor data
    if (req.method === 'POST' && segments[1] === 'device' && segments[3] === 'log') {
      const deviceId = segments[2];
      const logData: DeviceLogRequest = await req.json();

      // Update device last_seen_at
      await supabase
        .from('devices')
        .update({ 
          last_seen_at: new Date().toISOString(),
          status: 'online'
        })
        .eq('device_id', deviceId);

      // Insert sensor data to device_logs
      const { data, error } = await supabase
        .from('device_logs')
        .insert({
          device_id: deviceId,
          temp: logData.temp,
          hum: logData.hum,
          soil_moisture: logData.soil_moisture,
          light_level: logData.light_level,
          light_cycle_hours: logData.light_cycle_hours,
          irrigation_time: logData.irrigation_time
        })
        .select()
        .single();

      if (error) throw error;

      // Check for alerts
      if (logData.temp !== undefined || logData.hum !== undefined) {
        await checkAlerts(supabase, deviceId, logData);
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /device-api/device/:id/settings - Get device settings
    if (req.method === 'GET' && segments[1] === 'device' && segments[3] === 'settings') {
      const deviceId = segments[2];

      const { data: device, error } = await supabase
        .from('devices')
        .select('configuration, device_controls(*)')
        .eq('device_id', deviceId)
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ settings: device }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT /device-api/device/:id/settings - Update device settings
    if (req.method === 'PUT' && segments[1] === 'device' && segments[3] === 'settings') {
      const deviceId = segments[2];
      const settings = await req.json();

      const { data, error } = await supabase
        .from('devices')
        .update({ 
          configuration: settings,
          updated_at: new Date().toISOString()
        })
        .eq('device_id', deviceId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /device-api/device/:id/action - Control device
    if (req.method === 'POST' && segments[1] === 'device' && segments[3] === 'action') {
      const deviceId = segments[2];
      const actionData: DeviceActionRequest = await req.json();

      // Update or insert device control
      const { data, error } = await supabase
        .from('device_controls')
        .upsert({
          device_id: deviceId,
          control_name: actionData.control_name,
          control_type: actionData.intensity !== undefined ? 'slider' : 'switch',
          value: actionData.value,
          intensity: actionData.intensity,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'device_id,control_name'
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /device-api/device/:id/schedules - Get device schedules
    if (req.method === 'GET' && segments[1] === 'device' && segments[3] === 'schedules') {
      const deviceId = segments[2];

      const { data: schedules, error } = await supabase
        .from('device_schedules')
        .select('*')
        .eq('device_id', deviceId)
        .eq('is_active', true);

      if (error) throw error;

      return new Response(JSON.stringify({ schedules }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /device-api/register - Register new device
    if (req.method === 'POST' && segments[1] === 'register') {
      const { device_id, name, type, user_id } = await req.json();

      const { data, error } = await supabase
        .from('devices')
        .insert({
          device_id,
          name,
          type: type || 'grow_box',
          user_id,
          status: 'online',
          last_seen_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });

  } catch (error: any) {
    console.error('Error in device-api function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

async function checkAlerts(supabase: any, deviceId: string, data: DeviceLogRequest) {
  // Get device owner's notification settings
  const { data: device } = await supabase
    .from('devices')
    .select('user_id, notification_settings(*)')
    .eq('device_id', deviceId)
    .single();

  if (!device?.notification_settings) return;

  const settings = device.notification_settings;
  let alertTriggered = false;
  let alertMessage = '';

  if (data.temp !== undefined) {
    if (settings.temperature_min && data.temp < settings.temperature_min) {
      alertTriggered = true;
      alertMessage += `Temperature too low: ${data.temp}°C (min: ${settings.temperature_min}°C). `;
    }
    if (settings.temperature_max && data.temp > settings.temperature_max) {
      alertTriggered = true;
      alertMessage += `Temperature too high: ${data.temp}°C (max: ${settings.temperature_max}°C). `;
    }
  }

  if (data.hum !== undefined) {
    if (settings.humidity_min && data.hum < settings.humidity_min) {
      alertTriggered = true;
      alertMessage += `Humidity too low: ${data.hum}% (min: ${settings.humidity_min}%). `;
    }
    if (settings.humidity_max && data.hum > settings.humidity_max) {
      alertTriggered = true;
      alertMessage += `Humidity too high: ${data.hum}% (max: ${settings.humidity_max}%). `;
    }
  }

  if (alertTriggered && (settings.email_enabled || settings.push_enabled)) {
    // Trigger notification (could call another edge function for email/telegram)
    console.log(`Alert triggered for device ${deviceId}: ${alertMessage}`);
    // TODO: Implement actual notification sending
  }
}

serve(handler);