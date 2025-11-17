import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 confirm-device called');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2));
    
    const { device_token, device_id, name, type, location } = body;

    if (!device_token || !device_id) {
      console.error('❌ Missing required fields:', { device_token: !!device_token, device_id: !!device_id });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: device_token and device_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Confirming device:', { device_id, device_token, name, type, location });

    // Verify token in pending_devices
    const { data: pendingDevice, error: tokenError } = await supabase
      .from('pending_devices')
      .select('*')
      .eq('device_token', device_token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !pendingDevice) {
      console.error('❌ Invalid or expired token:', tokenError);
      console.log('🔍 Token searched:', device_token);
      console.log('📅 Current time:', new Date().toISOString());
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Valid token found for user:', pendingDevice.user_id);

    // Create device record
    const deviceData = {
      user_id: pendingDevice.user_id,
      device_id: device_id,
      name: name || 'New Device',
      type: type || 'grow_box',
      location: location || null,
      status: 'online',
      last_seen: new Date().toISOString(),
    };
    
    console.log('📝 Creating device with data:', JSON.stringify(deviceData, null, 2));

    const { data: newDevice, error: deviceError } = await supabase
      .from('devices')
      .insert(deviceData)
      .select()
      .single();

    if (deviceError) {
      console.error('❌ Error creating device:', deviceError);
      return new Response(
        JSON.stringify({ error: 'Failed to create device', details: deviceError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Device created successfully:', newDevice.id);

    // Delete used token
    const { error: deleteError } = await supabase
      .from('pending_devices')
      .delete()
      .eq('device_token', device_token);

    if (deleteError) {
      console.error('⚠️ Error deleting token:', deleteError);
    } else {
      console.log('✅ Token deleted from pending_devices');
    }

    console.log('🎉 Device confirmed successfully:', newDevice);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Device confirmed',
        device: newDevice,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in confirm-device function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
