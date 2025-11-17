import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Wifi, WifiOff, Thermometer, Droplets, Sun, Beaker, Edit, Trash2, Bell, Shield, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { DeviceGroups } from './DeviceGroups';
import { DeviceSchedules } from './DeviceSchedules';
import { NotificationSettings } from './NotificationSettings';

interface Device {
  id: string;
  device_id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'error';
  location?: string;
  last_seen: string;
  sensor_data?: {
    temperature?: number;
    humidity?: number;
    soil_moisture?: number;
    light_level?: number;
    ph_level?: number;
  }[];
}

const UserCabinet = () => {
  const { user, role, profile, refreshProfile } = useAuth();
  const { t } = useTranslation();
  const [devices, setDevices] = useState<Device[]>([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_id: '',
    name: '',
    location: '',
    group_id: '',
  });
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      fetchDevices();
      fetchGroups();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        email: user?.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, user]);

  const fetchDevices = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('devices')
        .select(`
          *,
          sensor_data:sensor_data(temperature, humidity, soil_moisture, light_level, ph_level)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Помилка",
          description: "Не вдалося завантажити пристрої",
          variant: "destructive",
        });
        return;
      }

      setDevices((data || []) as Device[]);
    } catch (err) {
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('device_groups')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) {
        setGroups(data);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const addDevice = async () => {
    if (!user || !newDevice.device_id || !newDevice.name) return;

    try {
      const { error } = await (supabase as any)
        .from('devices')
        .insert({
          user_id: user.id,
          device_id: newDevice.device_id,
          name: newDevice.name,
          type: 'grow_box',
          location: newDevice.location,
          group_id: newDevice.group_id || null,
        });

      if (error) {
        toast({
          title: "Помилка",
          description: "Не вдалося додати пристрій",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Успіх",
        description: "Пристрій успішно додано",
      });

      setNewDevice({ device_id: '', name: '', location: '', group_id: '' });
      setAddDeviceOpen(false);
      fetchDevices();
    } catch (err) {
      console.error('Error adding device:', err);
    }
  };

  const deleteDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId);

      if (error) {
        toast({
          title: "Помилка",
          description: "Не вдалося видалити пристрій",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Успіх",
        description: "Пристрій видалено",
      });
      fetchDevices();
    } catch (err) {
      console.error('Error deleting device:', err);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
        })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Помилка",
          description: "Не вдалося оновити профіль",
          variant: "destructive",
        });
        return;
      }

      // Update email if changed
      if (profileForm.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileForm.email,
        });

        if (emailError) {
          toast({
            title: "Помилка",
            description: "Не вдалося змінити email",
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Успіх",
        description: "Профіль оновлено",
      });
      setEditProfileOpen(false);
      refreshProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Помилка",
        description: "Паролі не співпадають",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) {
        toast({
          title: "Помилка",
          description: "Не вдалося змінити пароль",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Успіх",
        description: "Пароль змінено",
      });
      setChangePasswordOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Error changing password:', err);
    }
  };

  const deleteAccount = async () => {
    try {
      // Delete user profile first
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user?.id);

      toast({
        title: "Успіх",
        description: "Акаунт видалено. Ви будете перенаправлені на сторінку входу.",
      });

      // Sign out user
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error deleting account:', err);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити акаунт",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'online' ? (
      <Wifi className="w-4 h-4 text-success" />
    ) : (
      <WifiOff className="w-4 h-4 text-muted-foreground" />
    );
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'online' ? 'default' : 'secondary';
    const text = status === 'online' ? 'Онлайн' : 'Офлайн';
    
    return <Badge variant={variant}>{text}</Badge>;
  };

  const getLatestSensorData = (device: Device) => {
    if (!device.sensor_data || device.sensor_data.length === 0) return null;
    return device.sensor_data[0];
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Завантаження...</div>;
  }

  return (
    <div className="flex-1 p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Кабінет користувача
          </h1>
          <p className="text-muted-foreground mt-1">
            Керуйте своїми пристроями Grow Box
          </p>
        </div>
        
        <Dialog open={addDeviceOpen} onOpenChange={setAddDeviceOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Додати пристрій
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Додати новий пристрій</DialogTitle>
              <DialogDescription>
                Введіть інформацію про ваш Grow Box пристрій
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="device-id">ID пристрою</Label>
                <Input
                  id="device-id"
                  placeholder="GB-12345678"
                  value={newDevice.device_id}
                  onChange={(e) => setNewDevice({ ...newDevice, device_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="device-name">Назва пристрою</Label>
                <Input
                  id="device-name"
                  placeholder="Мій Grow Box"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="device-location">Місцезнаходження (опціонально)</Label>
                <Input
                  id="device-location"
                  placeholder="Кухня, Балкон..."
                  value={newDevice.location}
                  onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                />
              </div>
              <Button
                onClick={addDevice}
                className="w-full gradient-primary text-primary-foreground"
                disabled={!newDevice.device_id || !newDevice.name}
              >
                Додати пристрій
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="devices">Пристрої ({devices.length})</TabsTrigger>
          <TabsTrigger value="profile">Профіль</TabsTrigger>
          <TabsTrigger value="groups">Групи</TabsTrigger>
          <TabsTrigger value="schedules">Розклад</TabsTrigger>
          <TabsTrigger value="notifications">Сповіщення</TabsTrigger>
        </TabsList>
        
        <TabsContent value="devices" className="space-y-4">
          {devices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Немає пристроїв</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Додайте свій перший Grow Box пристрій для початку роботи
                </p>
                <Button onClick={() => setAddDeviceOpen(true)}>
                  Додати пристрій
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {devices.map((device) => {
                const sensorData = getLatestSensorData(device);
                
                return (
                  <Card key={device.id} className="transition-all hover:shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{device.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(device.status)}
                          {getStatusBadge(device.status)}
                        </div>
                      </div>
                      <CardDescription>
                        ID: {device.device_id}
                        {device.location && ` • ${device.location}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {sensorData ? (
                        <div className="grid grid-cols-2 gap-3">
                          {sensorData.temperature && (
                            <div className="flex items-center gap-2">
                              <Thermometer className="w-4 h-4 text-orange-500" />
                              <span className="text-sm">{sensorData.temperature}°C</span>
                            </div>
                          )}
                          {sensorData.humidity && (
                            <div className="flex items-center gap-2">
                              <Droplets className="w-4 h-4 text-blue-500" />
                              <span className="text-sm">{sensorData.humidity}%</span>
                            </div>
                          )}
                          {sensorData.light_level && (
                            <div className="flex items-center gap-2">
                              <Sun className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm">{sensorData.light_level} lux</span>
                            </div>
                          )}
                          {sensorData.ph_level && (
                            <div className="flex items-center gap-2">
                              <Beaker className="w-4 h-4 text-purple-500" />
                              <span className="text-sm">pH {sensorData.ph_level}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Немає даних з датчиків
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Останнє з'єднання: {new Date(device.last_seen).toLocaleString('uk-UA')}
                        </p>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Видалити пристрій?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Ця дія незворотна. Всі дані пристрою будуть видалені.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Скасувати</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteDevice(device.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Видалити
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Профіль</CardTitle>
                  <CardDescription>Ваші особисті дані</CardDescription>
                </div>
                <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Редагувати
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Редагування профілю</DialogTitle>
                      <DialogDescription>Змініть свої особисті дані</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="full_name">Повне ім'я</Label>
                        <Input
                          id="full_name"
                          value={profileForm.full_name}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Телефон</Label>
                        <Input
                          id="phone"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <Button onClick={updateProfile} className="w-full">
                        Зберегти зміни
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                </div>
                <div>
                  <Label>Повне ім'я</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile?.full_name || 'Не вказано'}
                  </p>
                </div>
                <div>
                  <Label>Телефон</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile?.phone || 'Не вказано'}
                  </p>
                </div>
                <div>
                  <Label>Роль</Label>
                  <Badge variant="outline" className="mt-1">
                    {role === 'user' ? 'Користувач' : 
                     role === 'developer' ? 'Розробник' : 'Адміністратор'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Безпека
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Змінити пароль
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Зміна паролю</DialogTitle>
                      <DialogDescription>Введіть новий пароль для вашого акаунта</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="current_password">Поточний пароль</Label>
                        <Input
                          id="current_password"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="new_password">Новий пароль</Label>
                        <Input
                          id="new_password"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirm_password">Підтвердити пароль</Label>
                        <Input
                          id="confirm_password"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        />
                      </div>
                      <Button onClick={changePassword} className="w-full">
                        Змінити пароль
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="w-5 h-5" />
                  Видалити акаунт
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Видалити акаунт
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ця дія незворотна. Всі ваші дані, пристрої та налаштування будуть видалені назавжди.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Скасувати</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground">
                        Так, видалити акаунт
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="groups">
          <DeviceGroups groups={groups} onGroupsChange={fetchGroups} />
        </TabsContent>

        <TabsContent value="schedules">
          <DeviceSchedules devices={devices} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserCabinet;