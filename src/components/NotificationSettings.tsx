import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, Smartphone, Thermometer, Droplets } from 'lucide-react';
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

      <div className="grid gap-6">
        {/* Notification Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Способи сповіщень
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Email сповіщення</Label>
                  <p className="text-xs text-muted-foreground">Отримувати сповіщення на електронну пошту</p>
                </div>
              </div>
              <Switch
                checked={settings.email_enabled}
                onCheckedChange={(checked) => updateSetting('email_enabled', checked)}
                disabled={saving}
              />
            </div>

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

        {/* Temperature Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5" />
              Сповіщення про температуру
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="temp-min">Мінімальна температура (°C)</Label>
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
                />
              </div>
              <div>
                <Label htmlFor="temp-max">Максимальна температура (°C)</Label>
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
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Ви отримаєте сповіщення, коли температура буде нижче мінімальної або вище максимальної
            </p>
          </CardContent>
        </Card>

        {/* Humidity Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5" />
              Сповіщення про вологість
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="humidity-min">Мінімальна вологість (%)</Label>
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
                />
              </div>
              <div>
                <Label htmlFor="humidity-max">Максимальна вологість (%)</Label>
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
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Ви отримаєте сповіщення, коли вологість буде нижче мінімальної або вище максимальної
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}