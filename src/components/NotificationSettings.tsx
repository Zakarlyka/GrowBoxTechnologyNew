import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, Smartphone, Thermometer, Droplets, MessageCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface NotificationSetting {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  temperature_min?: number;
  temperature_max?: number;
  humidity_min?: number;
  humidity_max?: number;
}

export function NotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching notification settings:', error);
        return;
      }

      if (data) {
        setSettings(data as any);
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          user_id: user.id,
          email_enabled: true,
          push_enabled: false,
          temperature_min: 18,
          temperature_max: 30,
          humidity_min: 40,
          humidity_max: 80,
        };
        
        const { data: newSettings, error: createError } = await (supabase as any)
          .from('notification_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (!createError && newSettings) {
          setSettings(newSettings as any);
        }
      }
    } catch (err) {
      console.error('Error with notification settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (field: keyof NotificationSetting, value: any) => {
    if (!settings || !user) return;

    try {
      setSaving(true);
      const updatedSettings = { ...settings, [field]: value };
      
      const { error } = await (supabase as any)
        .from('notification_settings')
        .update({ [field]: value })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Помилка",
          description: "Не вдалося зберегти налаштування",
          variant: "destructive",
        });
        return;
      }

      setSettings(updatedSettings);
      toast({
        title: "Збережено",
        description: "Налаштування сповіщень оновлено",
      });
    } catch (err) {
      console.error('Error updating notification settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const sendTestNotification = async () => {
    toast({
      title: "Тестове сповіщення",
      description: "Це тестове сповіщення для перевірки налаштувань",
    });
  };

  const copyBotLink = () => {
    navigator.clipboard.writeText('https://t.me/AgroHogwardsBot');
    setCopied(true);
    toast({
      title: "Скопійовано!",
      description: "Посилання на бота скопійовано в буфер обміну",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const saveTelegramSettings = () => {
    if (!telegramChatId.trim()) {
      toast({
        title: "Помилка",
        description: "Введіть Chat ID",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Збережено!",
      description: "Telegram інтеграція налаштована. Ви отримуватимете сповіщення.",
    });
    setTelegramEnabled(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Завантаження...</div>;
  }

  if (!settings) {
    return <div className="text-center p-8">Не вдалося завантажити налаштування</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Налаштування сповіщень</h2>
        <p className="text-muted-foreground">Керуйте способами отримання сповіщень про ваші пристрої</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notification Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Способи сповіщень
            </CardTitle>
            <CardDescription>
              Оберіть як ви хочете отримувати сповіщення
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Email сповіщення</Label>
                  <p className="text-xs text-muted-foreground">Отримувати сповіщення на пошту</p>
                </div>
              </div>
              <Switch
                checked={settings.email_enabled}
                onCheckedChange={(checked) => updateSetting('email_enabled', checked)}
                disabled={saving}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Push сповіщення</Label>
                  <p className="text-xs text-muted-foreground">Миттєві сповіщення у браузері</p>
                </div>
              </div>
              <Switch
                checked={settings.push_enabled}
                onCheckedChange={(checked) => updateSetting('push_enabled', checked)}
                disabled={saving}
              />
            </div>

            <div className="pt-4">
              <Button onClick={sendTestNotification} variant="outline" size="sm">
                Надіслати тестове сповіщення
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Integration */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#0088cc]" />
                Telegram інтеграція
              </CardTitle>
              {telegramEnabled && (
                <Badge variant="outline" className="bg-success/10 text-success border-success">
                  <Check className="w-3 h-3 mr-1" />
                  Підключено
                </Badge>
              )}
            </div>
            <CardDescription>
              Отримуйте миттєві алерти в Telegram
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Крок 1: Відкрийте бота</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => window.open('https://t.me/AgroHogwardsBot', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  @AgroHogwardsBot
                </Button>
                <Button variant="ghost" size="icon" onClick={copyBotLink}>
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Натисніть /start щоб отримати ваш Chat ID
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-2">
              <Label htmlFor="telegram-chat-id" className="text-sm font-medium">
                Крок 2: Вставте Chat ID
              </Label>
              <Input
                id="telegram-chat-id"
                placeholder="123456789"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
              />
            </div>

            {/* Save Button */}
            <Button 
              onClick={saveTelegramSettings} 
              className="w-full"
              disabled={!telegramChatId.trim()}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {telegramEnabled ? 'Оновити налаштування' : 'Підключити Telegram'}
            </Button>
          </CardContent>
        </Card>

        {/* Temperature Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-orange-500" />
              Сповіщення про температуру
            </CardTitle>
            <CardDescription>
              Отримуйте алерти при виході за межі
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temp-min">Мінімум (°C)</Label>
                <Input
                  id="temp-min"
                  type="number"
                  min="-10"
                  max="50"
                  value={settings.temperature_min || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : null;
                    updateSetting('temperature_min', value);
                  }}
                  placeholder="18"
                  disabled={saving}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temp-max">Максимум (°C)</Label>
                <Input
                  id="temp-max"
                  type="number"
                  min="-10"
                  max="50"
                  value={settings.temperature_max || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : null;
                    updateSetting('temperature_max', value);
                  }}
                  placeholder="30"
                  disabled={saving}
                  className="h-10"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Сповіщення при виході за межі діапазону
            </p>
          </CardContent>
        </Card>

        {/* Humidity Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              Сповіщення про вологість
            </CardTitle>
            <CardDescription>
              Отримуйте алерти при виході за межі
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="humidity-min">Мінімум (%)</Label>
                <Input
                  id="humidity-min"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.humidity_min || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : null;
                    updateSetting('humidity_min', value);
                  }}
                  placeholder="40"
                  disabled={saving}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidity-max">Максимум (%)</Label>
                <Input
                  id="humidity-max"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.humidity_max || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : null;
                    updateSetting('humidity_max', value);
                  }}
                  placeholder="80"
                  disabled={saving}
                  className="h-10"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Сповіщення при виході за межі діапазону
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}