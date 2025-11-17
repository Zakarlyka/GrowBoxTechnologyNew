import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Edit, Settings } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  device_id: string;
  type: string;
  location?: string;
  status: string;
}

export function DeviceSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    device_id: '',
    type: 'grow_box',
    location: '',
  });

  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, [user]);

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити пристрої',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDemoDevice = async () => {
    if (!user) return;

    try {
      const demoDevice = {
        user_id: user.id,
        name: 'DemoGrowBox',
        device_id: `DEMO-${Date.now()}`,
        type: 'grow_box',
        location: 'Демо локація',
        status: 'online',
      };

      const { error } = await supabase
        .from('devices')
        .insert([demoDevice]);

      if (error) throw error;

      toast({
        title: 'Успішно',
        description: 'Демо-пристрій створено',
      });

      fetchDevices();
    } catch (error) {
      console.error('Error creating demo device:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося створити демо-пристрій',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingDevice) {
        // Update existing device
        const { error } = await supabase
          .from('devices')
          .update({
            name: formData.name,
            location: formData.location,
          })
          .eq('id', editingDevice.id);

        if (error) throw error;

        toast({
          title: 'Успішно',
          description: 'Пристрій оновлено',
        });
      } else {
        // Create new device
        const { error } = await supabase
          .from('devices')
          .insert([{
            ...formData,
            user_id: user.id,
            status: 'offline',
          }]);

        if (error) throw error;

        toast({
          title: 'Успішно',
          description: 'Пристрій додано',
        });
      }

      setDialogOpen(false);
      setEditingDevice(null);
      setFormData({ name: '', device_id: '', type: 'grow_box', location: '' });
      fetchDevices();
    } catch (error) {
      console.error('Error saving device:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося зберегти пристрій',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      device_id: device.device_id,
      type: device.type,
      location: device.location || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;

      toast({
        title: 'Успішно',
        description: 'Пристрій видалено',
      });

      fetchDevices();
    } catch (error) {
      console.error('Error deleting device:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити пристрій',
        variant: 'destructive',
      });
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingDevice(null);
    setFormData({ name: '', device_id: '', type: 'grow_box', location: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Налаштування пристроїв</h2>
          <p className="text-muted-foreground">Керуйте своїми пристроями</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddDemoDevice} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Демо-пристрій
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleDialogClose()}>
                <Plus className="w-4 h-4 mr-2" />
                Додати пристрій
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDevice ? 'Редагувати пристрій' : 'Додати новий пристрій'}
                </DialogTitle>
                <DialogDescription>
                  {editingDevice 
                    ? 'Оновіть інформацію про пристрій' 
                    : 'Заповніть дані для додавання нового пристрою'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Назва пристрою</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Моя теплиця"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="device_id">ID пристрою</Label>
                    <Input
                      id="device_id"
                      value={formData.device_id}
                      onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                      placeholder="ESP32-001"
                      required
                      disabled={!!editingDevice}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Локація (опціонально)</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Кімната 1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Скасувати
                  </Button>
                  <Button type="submit">
                    {editingDevice ? 'Оновити' : 'Додати'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <Card key={device.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {device.name}
                    <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                      {device.status === 'online' ? 'Онлайн' : 'Офлайн'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{device.device_id}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {device.location && (
                  <p className="text-sm text-muted-foreground">
                    📍 {device.location}
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(device)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Редагувати
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Видалити пристрій?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ця дія незворотна. Пристрій {device.name} буде видалено назавжди.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Скасувати</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(device.id)}>
                          Видалити
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {devices.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Немає пристроїв</h3>
            <p className="text-muted-foreground text-center mb-4">
              Додайте свій перший пристрій або створіть демо-пристрій для тесту
            </p>
            <div className="flex gap-2">
              <Button onClick={handleAddDemoDevice} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Створити демо-пристрій
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}