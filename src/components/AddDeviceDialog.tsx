import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { QRDeviceSetup } from './QRDeviceSetup';

interface AddDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeviceAdded: () => void;
}

export function AddDeviceDialog({ open, onOpenChange, onDeviceAdded }: AddDeviceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showQRSetup, setShowQRSetup] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [manualData, setManualData] = useState({
    device_id: '',
    name: '',
    type: 'grow_box',
    location: '',
  });
  const { user } = useAuth();

  const handleQRPairing = async () => {
    if (!pairingCode.trim()) {
      toast({
        title: 'Помилка',
        description: 'Введіть код пристрою',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Check if pairing code exists in device_pairing_temp
      const { data: pairingData, error: pairingError } = await supabase
        .from('device_pairing_temp' as any)
        .select('*')
        .eq('pairing_code', pairingCode)
        .single();

      if (pairingError || !pairingData) {
        toast({
          title: 'Невірний код',
          description: 'Код пристрою не знайдено або застарів',
          variant: 'destructive',
        });
        return;
      }

      // Create device
      const { error: deviceError } = await supabase
        .from('devices')
        .insert({
          user_id: user?.id,
          device_id: (pairingData as any).device_id,
          name: `Пристрій ${(pairingData as any).device_id}`,
          type: 'grow_box',
          status: 'offline',
        });

      if (deviceError) throw deviceError;

      // Delete pairing code
      await supabase
        .from('device_pairing_temp' as any)
        .delete()
        .eq('pairing_code', pairingCode);

      toast({
        title: 'Успіх',
        description: 'Пристрій успішно додано',
      });

      setPairingCode('');
      onDeviceAdded();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Pairing error:', error);
      toast({
        title: 'Помилка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manualData.device_id || !manualData.name) {
      toast({
        title: 'Помилка',
        description: 'Заповніть всі обов\'язкові поля',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('devices')
        .insert({
          user_id: user?.id,
          device_id: manualData.device_id,
          name: manualData.name,
          type: manualData.type,
          location: manualData.location,
          status: 'offline',
        });

      if (error) throw error;

      toast({
        title: 'Успіх',
        description: 'Пристрій успішно додано',
      });

      setManualData({
        device_id: '',
        name: '',
        type: 'grow_box',
        location: '',
      });
      onDeviceAdded();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Manual add error:', error);
      toast({
        title: 'Помилка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Додати пристрій</DialogTitle>
            <DialogDescription>
              Оберіть спосіб додавання пристрою
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="qr" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr">
                <QrCode className="mr-2 h-4 w-4" />
                QR-код
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Plus className="mr-2 h-4 w-4" />
                Вручну
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <p className="text-sm text-muted-foreground">
                  Натисніть кнопку нижче, щоб згенерувати QR-код для підключення пристрою
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowQRSetup(true);
                  onOpenChange(false);
                }}
                className="w-full"
              >
                <QrCode className="mr-2 h-4 w-4" />
                Згенерувати QR-код
              </Button>
            </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="device-id">ID пристрою *</Label>
              <Input
                id="device-id"
                placeholder="esp32-grow-001"
                value={manualData.device_id}
                onChange={(e) => setManualData({ ...manualData, device_id: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="device-name">Назва *</Label>
              <Input
                id="device-name"
                placeholder="Grow Box Alpha"
                value={manualData.name}
                onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Локація</Label>
              <Input
                id="location"
                placeholder="Кімната 1"
                value={manualData.location}
                onChange={(e) => setManualData({ ...manualData, location: e.target.value })}
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleManualAdd}
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Додати пристрій
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    <QRDeviceSetup
      open={showQRSetup}
      onOpenChange={setShowQRSetup}
      onDeviceAdded={() => {
        setShowQRSetup(false);
        onDeviceAdded();
      }}
    />
  </>
  );
}
