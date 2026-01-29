import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramNotifyRequest {
  chat_id: string;
  title?: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  test?: boolean;
}

const TYPE_EMOJIS: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  error: '🚨',
  success: '✅',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Telegram bot not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: TelegramNotifyRequest = await req.json();
    const { chat_id, title, message, type = 'info', test = false } = body;

    if (!chat_id) {
      return new Response(
        JSON.stringify({ error: 'chat_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the message
    const emoji = TYPE_EMOJIS[type] || 'ℹ️';
    let formattedMessage = '';

    if (test) {
      formattedMessage = `🤖 *Тестове з'єднання*\n\n✅ Ваш Telegram успішно підключено до AgroHogwards!\n\nТепер ви отримуватимете сповіщення про:\n• Критичні показники температури\n• Відхилення вологості\n• Стан ваших пристроїв`;
    } else if (title) {
      formattedMessage = `${emoji} *${title}*\n\n${message}`;
    } else {
      formattedMessage = `${emoji} ${message}`;
    }

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat_id,
        text: formattedMessage,
        parse_mode: 'Markdown',
      }),
    });

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
      console.error('Telegram API error:', telegramResult);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send Telegram message', 
          details: telegramResult.description 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Telegram message sent successfully to chat_id:', chat_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: telegramResult.result?.message_id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in telegram-notify function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
