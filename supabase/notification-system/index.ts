import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  user_id: string;
  type: 'email' | 'telegram';
  subject: string;
  message: string;
  device_name?: string;
  alert_type?: string;
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

  try {
    const { user_id, type, subject, message, device_name, alert_type }: NotificationRequest = await req.json();

    // Get user's notification settings
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (settingsError) {
      console.error('Error fetching notification settings:', settingsError);
      return new Response(JSON.stringify({ error: 'Settings not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile for contact info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', user_id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let notificationSent = false;

    // Send email notification
    if (type === 'email' && settings.email_enabled && profile.email) {
      try {
        const emailResponse = await sendEmailNotification({
          to: profile.email,
          name: profile.full_name || 'User',
          subject,
          message,
          device_name,
          alert_type
        });
        
        console.log('Email sent successfully:', emailResponse);
        notificationSent = true;
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    // Send Telegram notification
    if (type === 'telegram' && settings.push_enabled) {
      try {
        const telegramResponse = await sendTelegramNotification({
          user_id,
          message: `🚨 *${subject}*\n\n${message}${device_name ? `\n📱 Device: ${device_name}` : ''}`,
          alert_type
        });
        
        console.log('Telegram sent successfully:', telegramResponse);
        notificationSent = true;
      } catch (telegramError) {
        console.error('Error sending Telegram:', telegramError);
      }
    }

    return new Response(JSON.stringify({ 
      success: notificationSent,
      message: notificationSent ? 'Notification sent successfully' : 'No notifications sent'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in notification-system function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

async function sendEmailNotification(params: {
  to: string;
  name: string;
  subject: string;
  message: string;
  device_name?: string;
  alert_type?: string;
}) {
  // This would integrate with a service like Resend or SendGrid
  // For now, just log the email
  console.log('Email notification:', params);
  
  // TODO: Implement actual email sending
  // Example with Resend:
  /*
  const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
  
  return await resend.emails.send({
    from: 'alerts@yourdomain.com',
    to: params.to,
    subject: params.subject,
    html: `
      <h2>IoT Alert: ${params.subject}</h2>
      <p>Hello ${params.name},</p>
      <p>${params.message}</p>
      ${params.device_name ? `<p><strong>Device:</strong> ${params.device_name}</p>` : ''}
      <p>Please check your device immediately.</p>
      <p>Best regards,<br>Your IoT System</p>
    `
  });
  */
  
  return { id: 'mock-email-id', status: 'sent' };
}

async function sendTelegramNotification(params: {
  user_id: string;
  message: string;
  alert_type?: string;
}) {
  // This would integrate with Telegram Bot API
  // For now, just log the message
  console.log('Telegram notification:', params);
  
  // TODO: Implement actual Telegram sending
  // Example with Telegram Bot API:
  /*
  const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
  
  // Get user's Telegram chat ID from your database
  const { data: telegramSettings } = await supabase
    .from('telegram_settings')
    .select('chat_id')
    .eq('user_id', params.user_id)
    .single();
  
  if (telegramSettings?.chat_id) {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramSettings.chat_id,
        text: params.message,
        parse_mode: 'Markdown'
      })
    });
    
    return await response.json();
  }
  */
  
  return { ok: true, result: { message_id: 'mock-telegram-id' } };
}

serve(handler);