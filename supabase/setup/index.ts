import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetupRequest {
  device_id: string;
  name?: string;
  type?: string;
  location?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Використовуємо service role key для доступу до всіх таблиць
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: 'public' },
      auth: { persistSession: false }
    });

    const body: SetupRequest = await req.json();
    const { device_id, name, type, location } = body;

    if (!device_id) {
      return new Response(
        JSON.stringify({ error: 'Missing device_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Setting up device ${device_id}`);

    // Знаходимо запис в device_pairing_temp для отримання user_id
    const { data: pairingData, error: pairingError } = await supabase
      .from('device_pairing_temp')
      .select('user_id, pairing_code')
      .eq('device_id', device_id)
      .maybeSingle();

    if (pairingError) {
      console.error('Error checking pairing temp:', pairingError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pairingData || !pairingData.user_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Device ID not found. Please generate QR code in dashboard first.',
          hint: 'The device must be registered through the web dashboard before setup.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = pairingData.user_id;

    // Перевіряємо чи пристрій вже існує
    const { data: existingDevice } = await supabase
      .from('devices')
      .select('id, user_id')
      .eq('device_id', device_id)
      .maybeSingle();

    if (existingDevice) {
      // Оновлюємо існуючий пристрій
      const { error: updateError } = await supabase
        .from('devices')
        .update({
          name: name || `GrowBox ${device_id.slice(-6)}`,
          type: type || 'grow_box',
          location: location || null,
          status: 'online',
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingDevice.id);

      if (updateError) {
        console.error('Error updating device:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update device' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Видаляємо запис з device_pairing_temp
      await supabase
        .from('device_pairing_temp')
        .delete()
        .eq('device_id', device_id);

      return new Response(
        JSON.stringify({ success: true, message: 'Device updated successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Створюємо новий пристрій
    const { data: newDevice, error: insertError } = await supabase
      .from('devices')
      .insert({
        user_id: userId,
        device_id: device_id,
        name: name || `GrowBox ${device_id.slice(-6)}`,
        type: type || 'grow_box',
        location: location || null,
        status: 'online',
        last_seen: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating device:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to register device' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Device registered successfully:', newDevice.id);

    // Видаляємо запис з device_pairing_temp
    await supabase
      .from('device_pairing_temp')
      .delete()
      .eq('device_id', device_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Device registered successfully',
        device: {
          id: newDevice.id,
          device_id: newDevice.device_id,
          name: newDevice.name,
        }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Setup error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
