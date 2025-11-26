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

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
