-- Add Telegram fields to notification_settings table
ALTER TABLE public.notification_settings 
ADD COLUMN IF NOT EXISTS telegram_chat_id text,
ADD COLUMN IF NOT EXISTS telegram_enabled boolean DEFAULT false;

-- Create a function that will be called when new user_notification is inserted
CREATE OR REPLACE FUNCTION public.notify_user_telegram()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_settings RECORD;
  notification_payload jsonb;
BEGIN
  -- Get user's notification settings
  SELECT telegram_chat_id, telegram_enabled 
  INTO user_settings
  FROM public.notification_settings
  WHERE user_id = NEW.user_id;

  -- Only proceed if telegram is enabled and chat_id exists
  IF user_settings.telegram_enabled = true AND user_settings.telegram_chat_id IS NOT NULL THEN
    -- Build the payload
    notification_payload := jsonb_build_object(
      'chat_id', user_settings.telegram_chat_id,
      'title', NEW.title,
      'message', NEW.message,
      'type', NEW.type
    );

    -- Call the edge function via pg_net (async HTTP request)
    -- Note: This requires pg_net extension which is available in Supabase
    PERFORM net.http_post(
      url := 'https://ychnmaaximnoxvwnzrgs.supabase.co/functions/v1/telegram-notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := notification_payload
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger to call the function on new notifications
DROP TRIGGER IF EXISTS on_new_notification_telegram ON public.user_notifications;
CREATE TRIGGER on_new_notification_telegram
  AFTER INSERT ON public.user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_telegram();

-- Update RLS to allow users to update their telegram settings
-- (Already covered by existing "Users can manage own notification settings" policy)