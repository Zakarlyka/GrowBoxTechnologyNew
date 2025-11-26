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

    const { device_id, temp, hum, soil_moisture, light_level, climate_relay, vent_relay } = await req.json();

    // 1. Перевіряємо, чи пристрій вже існує
    const { data: existingDevice } = await supabase
      .from('devices')
      .select('id')
      .eq('device_id', device_id)
      .maybeSingle();

    let finalDeviceUuid = existingDevice?.id;

    // 2. Активація (якщо пристрій новий)
    if (!finalDeviceUuid) {
      console.log(`New device check: ${device_id}`);
      const { data: pending } = await supabase
        .from('pending_devices')
        .select('*')
        .eq('device_token', device_id)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (pending) {
        const { data: newDevice, error: createError } = await supabase
          .from('devices')
          .insert({
            user_id: pending.user_id,
            device_id: device_id,
            name: 'New GrowBox',
            status: 'online',
            type: 'grow_box',
            last_seen_at: new Date().toISOString(),
            settings: { target_temp: 25, target_hum: 60 } 
          })
          .select()
          .single();

        if (createError) throw createError;
        finalDeviceUuid = newDevice.id;
        await supabase.from('pending_devices').delete().eq('device_token', device_id);
      } else {
        throw new Error(`Device ${device_id} not found and no pending token.`);
      }
    }

    // 3. Запис логів
    const { error: logError } = await supabase
      .from('device_logs')
      .insert({
        device_id: device_id,
        temp,
        hum,
        soil_moisture, // Записуємо в історію
        light_level
      });

    if (logError) throw logError;

    // 4. Оновлення статусу "Online" та ПОТОЧНИХ показників
    await supabase
      .from('devices')
      .update({
        status: 'online',
        last_seen_at: new Date().toISOString(),
        last_temp: temp,
        last_hum: hum,
        last_soil_moisture: soil_moisture // <--- ДОДАНО: Оновлення ґрунту на картці
      })
      .eq('device_id', device_id);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
