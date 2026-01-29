import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return new Response(JSON.stringify({ error: 'Bot not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase credentials not configured');
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const update: TelegramUpdate = await req.json();
    console.log('Received Telegram update:', JSON.stringify(update));

    const message = update.message;
    if (!message || !message.text) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const username = message.from.username || null;
    const firstName = message.from.first_name || 'Користувач';

    // Helper function to send Telegram message
    const sendMessage = async (text: string, parseMode: string = 'Markdown') => {
      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: parseMode,
        }),
      });
    };

    // ============================================
    // COMMAND: /start
    // ============================================
    if (text === '/start') {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('telegram_users')
        .select('*')
        .eq('chat_id', chatId)
        .maybeSingle();

      if (existingUser) {
        if (existingUser.is_verified && existingUser.user_id) {
          await sendMessage(
            `👋 Вітаю, *${firstName}*!\n\n` +
            `✅ Ваш Telegram вже підключено до AgroHogwards.\n\n` +
            `Ви отримуватимете сповіщення про:\n` +
            `• 🌡️ Критичні показники температури\n` +
            `• 💧 Відхилення вологості\n` +
            `• 🔴 Офлайн пристрої\n\n` +
            `Щоб відключитися, введіть /disconnect`
          );
        } else {
          await sendMessage(
            `👋 Вітаю, *${firstName}*!\n\n` +
            `Ваш Chat ID вже збережено, але акаунт ще не підключено.\n\n` +
            `📱 *Ваш Chat ID:* \`${chatId}\`\n\n` +
            `Щоб отримувати сповіщення, введіть цей ID у налаштуваннях AgroHogwards → Акаунт → Сповіщення → Telegram.`
          );
        }
      } else {
        // Save new telegram user
        const { error: insertError } = await supabase
          .from('telegram_users')
          .insert({
            chat_id: chatId,
            username: username,
            first_name: firstName,
            is_verified: false,
          });

        if (insertError) {
          console.error('Error saving telegram user:', insertError);
        }

        await sendMessage(
          `🌿 *Ласкаво просимо до AgroHogwards Bot!*\n\n` +
          `Я допоможу вам отримувати сповіщення про стан ваших гроубоксів.\n\n` +
          `📱 *Ваш Chat ID:* \`${chatId}\`\n\n` +
          `*Як підключити:*\n` +
          `1️⃣ Скопіюйте Chat ID вище\n` +
          `2️⃣ Відкрийте AgroHogwards\n` +
          `3️⃣ Перейдіть: Акаунт → Сповіщення\n` +
          `4️⃣ Вставте Chat ID та увімкніть Telegram\n` +
          `5️⃣ Натисніть "Тест з'єднання"\n\n` +
          `Або введіть команду:\n` +
          `/connect [ваш_user_uuid]`
        );
      }
      
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============================================
    // COMMAND: /connect <user_uuid>
    // ============================================
    if (text.startsWith('/connect ')) {
      const userUuid = text.replace('/connect ', '').trim();
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userUuid)) {
        await sendMessage(
          `❌ *Невірний формат UUID*\n\n` +
          `Будь ласка, введіть правильний User UUID з налаштувань AgroHogwards.`
        );
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check if user exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('user_id', userUuid)
        .maybeSingle();

      if (profileError || !profile) {
        await sendMessage(
          `❌ *Користувача не знайдено*\n\n` +
          `Перевірте правильність UUID.`
        );
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Upsert telegram_users record
      const { error: upsertError } = await supabase
        .from('telegram_users')
        .upsert({
          chat_id: chatId,
          user_id: userUuid,
          username: username,
          first_name: firstName,
          is_verified: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'chat_id',
        });

      if (upsertError) {
        console.error('Error linking telegram user:', upsertError);
        await sendMessage(`❌ Помилка при підключенні. Спробуйте пізніше.`);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update notification_settings with chat_id
      await supabase
        .from('notification_settings')
        .upsert({
          user_id: userUuid,
          telegram_chat_id: String(chatId),
          telegram_enabled: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      const displayName = profile.full_name || profile.email?.split('@')[0] || 'Користувач';
      
      await sendMessage(
        `✅ *Успішно підключено!*\n\n` +
        `👤 Акаунт: *${displayName}*\n` +
        `📱 Chat ID: \`${chatId}\`\n\n` +
        `Тепер ви отримуватимете сповіщення про:\n` +
        `• 🌡️ Критичні показники температури\n` +
        `• 💧 Відхилення вологості\n` +
        `• 🔴 Офлайн пристрої\n\n` +
        `Щоб відключитися, введіть /disconnect`
      );

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============================================
    // COMMAND: /disconnect
    // ============================================
    if (text === '/disconnect') {
      const { data: telegramUser } = await supabase
        .from('telegram_users')
        .select('user_id')
        .eq('chat_id', chatId)
        .maybeSingle();

      if (telegramUser?.user_id) {
        // Disable telegram in notification_settings
        await supabase
          .from('notification_settings')
          .update({
            telegram_enabled: false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', telegramUser.user_id);
      }

      // Update telegram_users
      await supabase
        .from('telegram_users')
        .update({
          is_verified: false,
          user_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('chat_id', chatId);

      await sendMessage(
        `👋 *Telegram відключено*\n\n` +
        `Ви більше не отримуватимете сповіщення.\n\n` +
        `Щоб підключитися знову, введіть /start`
      );

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============================================
    // COMMAND: /status
    // ============================================
    if (text === '/status') {
      const { data: telegramUser } = await supabase
        .from('telegram_users')
        .select('*, notification_settings!inner(telegram_enabled)')
        .eq('chat_id', chatId)
        .maybeSingle();

      if (telegramUser?.is_verified && telegramUser?.user_id) {
        // Get device count
        const { count: deviceCount } = await supabase
          .from('devices')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', telegramUser.user_id);

        await sendMessage(
          `📊 *Статус підключення*\n\n` +
          `✅ Telegram: Підключено\n` +
          `📱 Chat ID: \`${chatId}\`\n` +
          `🔧 Пристроїв: ${deviceCount || 0}\n\n` +
          `Сповіщення активні!`
        );
      } else {
        await sendMessage(
          `📊 *Статус підключення*\n\n` +
          `❌ Telegram: Не підключено\n` +
          `📱 Chat ID: \`${chatId}\`\n\n` +
          `Введіть /start для підключення.`
        );
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============================================
    // COMMAND: /help
    // ============================================
    if (text === '/help') {
      await sendMessage(
        `🌿 *AgroHogwards Bot - Команди*\n\n` +
        `/start - Почати та отримати Chat ID\n` +
        `/connect [uuid] - Підключити Telegram до акаунту\n` +
        `/disconnect - Відключити сповіщення\n` +
        `/status - Перевірити статус підключення\n` +
        `/help - Показати цю довідку\n\n` +
        `*Підтримка:* @AgroHogwardsSupport`
      );

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Unknown command - show help hint
    if (text.startsWith('/')) {
      await sendMessage(
        `❓ Невідома команда.\n\nВведіть /help для списку команд.`
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in telegram-webhook function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
