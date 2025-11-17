import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Copy, RefreshCw, Wifi, ArrowLeft } from 'lucide-react';

export default function AddDevice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deviceId, setDeviceId] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const generateDeviceId = () => {
    const random1 = Math.random().toString(36).substring(2, 10).toUpperCase();
    const random2 = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newDeviceId = `ESP-${random1}-${random2}`;
    setDeviceId(newDeviceId);
  };

  useEffect(() => {
    if (!deviceId) {
      generateDeviceId();
    }
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(deviceId);
    toast.success('Device ID скопійовано');
  };

  const registerDevice = async () => {
    if (!deviceId || !name) {
      toast.error('Заповніть Device ID та Name');
      return;
    }

    if (!user) {
      toast.error('Необхідно увійти в систему');
      return;
    }

    setIsChecking(true);

    try {
      // Create pairing record in pending_devices (device_token is not needed here, we use device_id)
      const { error: pairingError } = await supabase
        .from('device_pairing_temp')
        .insert({
          device_id: deviceId,
          user_id: user.id,
          pairing_code: deviceId, // Use device_id as pairing code
        });

      if (pairingError) {
        console.error('Pairing error:', pairingError);
        toast.error('Помилка реєстрації пристрою');
        setIsChecking(false);
        return;
      }

      // Call setup function to register device
      const { data, error } = await supabase.functions.invoke('setup', {
        body: {
          device_id: deviceId,
          name: name,
          type: 'grow_box',
          location: location || null,
        },
      });

      if (error) {
        console.error('Setup error:', error);
        toast.error('Помилка налаштування пристрою');
        setIsChecking(false);
        return;
      }

      if (data?.success) {
        toast.success('✅ Пристрій успішно додано');
        navigate('/devices');
      } else {
        toast.error('Не вдалося зареєструвати пристрій');
      }
    } catch (err) {
      console.error('Registration error:', err);
      toast.error('Помилка реєстрації пристрою');
    } finally {
      setIsChecking(false);
    }
  };

  const qrUrl = `http://192.168.4.1/?deviceId=${deviceId}`;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад до Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-6 w-6" />
              Додати новий пристрій
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Device ID Input */}
            <div className="space-y-2">
              <Label htmlFor="deviceId">Device ID</Label>
              <div className="flex gap-2">
                <Input
                  id="deviceId"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className="font-mono"
                  placeholder="growbox001"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  title="Копіювати"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={generateDeviceId}
                  title="Згенерувати новий"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Grow Box"
                required
              />
            </div>

            {/* Location Input */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Kitchen"
              />
            </div>

            {/* QR Code */}
            <div className="flex justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <QRCodeSVG value={qrUrl} size={256} level="H" />
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Інструкція з підключення:
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>Відскануйте QR-код або скопіюйте Device ID</li>
                <li>Підключіться до Wi-Fi мережі <strong>GrowBox_Setup</strong></li>
                <li>У порталі виберіть вашу Wi-Fi мережу</li>
                <li>Введіть пароль від мережі</li>
                <li>Натисніть <strong>Connect</strong></li>
                <li>Після підключення натисніть кнопку нижче</li>
              </ol>
            </div>

            {/* Register Device Button */}
            <Button
              onClick={registerDevice}
              disabled={isChecking || !deviceId || !name}
              className="w-full"
              size="lg"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Реєстрація пристрою...
                </>
              ) : (
                'Зареєструвати пристрій'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
