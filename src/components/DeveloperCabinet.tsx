import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Settings, BarChart3, Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// 1. ⭐️ ІНТЕРФЕЙС, ЯКИЙ ПОВЕРТАЄ RPC
interface UserProfileWithRole {
  id: string; // profile id
  user_id: string; // auth.users id
  email: string;
  full_name?: string;
  role: string; // 'user', 'developer', 'admin', 'superadmin'
  category: string;
  developer_id?: string;
  created_at: string;
  device_count?: number;
}

// 2. ⭐️ ФУНКЦІЯ ЗАВАНТАЖЕННЯ КІЛЬКОСТІ ПРИСТРОЇВ (ОКРЕМО)
// Ми не можемо робити це в RPC, тому робимо це на клієнті
const fetchDeviceCounts = async (users: UserProfileWithRole[]): Promise<UserProfileWithRole[]> => {
  const usersWithDeviceCount = await Promise.all(
    users.map(async (userProfile) => {
      // Адмінам/Девелоперам дозволено читати 'devices' (ми виправили RLS)
      const { count } = await supabase
        .from('devices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile.user_id);
      
      return {
        ...userProfile,
        device_count: count || 0
      };
    })
  );
  return usersWithDeviceCount;
};

const DeveloperCabinet = () => {
  const { user, role } = useAuth(); // Використовуємо роль з useAuth
  const [users, setUsers] = useState<UserProfileWithRole[]>([]); // "Мої" користувачі
  const [allUsers, setAllUsers] = useState<UserProfileWithRole[]>([]); // "Всі" користувачі
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const { toast } = useToast();
  
  // 3. ⭐️ ОНОВЛЮЄМО ФУНКЦІЇ ЗАВАНТАЖЕННЯ
  const loadAllUsersData = useCallback(async () => {
    if (!user || !(role === 'admin' || role === 'superadmin' || role === 'developer')) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // 4. ⭐️ ВИКЛИКАЄМО БЕЗПЕЧНУ RPC-ФУНКЦІЮ
      const { data, error } = await supabase.rpc('admin_get_all_users' as any) as { data: UserProfileWithRole[] | null, error: any };
      if (error) throw error;

      const allUsersData = data || [];
      
      // Фільтруємо "Моїх" користувачів (для 'developer')
      const myUsersData = allUsersData.filter(u => u.developer_id === user.id);
      
      // Фільтруємо "Всіх" користувачів (для 'admin')
      const otherUsersData = allUsersData.filter(u => u.user_id !== user.id);

      // Завантажуємо кількість пристроїв
      // Ми запускаємо fetchDeviceCounts ТІЛЬКИ на тих даних,
      // які нам потрібні для відображення, щоб зменшити навантаження
      const [usersWithCount, allUsersWithCount] = await Promise.all([
         fetchDeviceCounts(myUsersData),
         fetchDeviceCounts(otherUsersData)
      ]);

      setUsers(usersWithCount);
      setAllUsers(allUsersWithCount);

    } catch (err: any) {
      console.error('Error fetching users data:', err);
      toast({
        title: "Помилка",
        description: `Не вдалося завантажити дані: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [role, user, toast]); // Додав toast

  useEffect(() => {
    loadAllUsersData();
  }, [loadAllUsersData]); // Викликаємо оновлену функцію

  // Решта функцій: assignUserToDeveloper, updateUserCategory
  const assignUserToDeveloper = useCallback(async () => {
    if (!selectedUser || !user) return;
    setLoading(true); // Блокуємо UI
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ developer_id: user.id })
        .eq('user_id', selectedUser);

      if (error) throw error;
      toast({ title: "Успіх", description: "Користувача успішно призначено" });
      
      await loadAllUsersData(); // Перезавантажуємо всі дані
      setSelectedUser('');
    } catch (err: any) {
      console.error('Error assigning user:', err);
      toast({ title: "Помилка", description: "Не вдалося призначити користувача", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedUser, user, toast, loadAllUsersData]); // Додав залежності

  const updateUserCategory = useCallback(async (userId: string, category: string) => {
    setLoading(true); // Блокуємо UI
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ category })
        .eq('user_id', userId);

      if (error) throw error;
      toast({ title: "Успіх", description: "Категорію користувача оновлено" });
      
      await loadAllUsersData(); // Перезавантажуємо всі дані
    } catch (err: any) {
      console.error('Error updating category:', err);
      toast({ title: "Помилка", description: "Не вдалося оновити категорію", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, loadAllUsersData]); // Додав залежності

  // 5. ⭐️ ФУНКЦІЯ GETROLEBADGE (БЕЗ ЗМІН)
  const getRoleBadge = (role: string) => {
    const colors = {
      user: 'default',
      developer: 'secondary',
      admin: 'destructive',
      moderator: 'secondary',
      superadmin: 'destructive'
    };
    
    const labels = {
      user: 'Користувач',
      developer: 'Розробник',
      admin: 'Адміністратор',
      moderator: 'Модератор',
      superadmin: 'Супер-Адмін'
    };

    return (
      <Badge variant={colors[role as keyof typeof colors] as any}>
        {labels[role as keyof typeof labels]}
      </Badge>
    );
  };

  // 6. ⭐️ ПЕРЕВІРКА ДОСТУПУ
  if (role !== 'developer' && role !== 'admin' && role !== 'superadmin') {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Доступ обмежено</h3>
            <p className="text-muted-foreground text-center">
              Цей розділ доступний лише для розробників та адміністраторів
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 7. ⭐️ ЗАВАНТАЖЕННЯ (БЕЗ ЗМІН)
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 8. ⭐️ РЕШТА JSX (БЕЗ ЗМІН, АЛЕ ТЕПЕР БЕЗПЕЧНО)
  return (
    <div className="flex-1 p-4 space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Кабінет розробника
          </h1>
          <p className="text-muted-foreground mt-1">
            Керування користувачами та системою
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Мої користувачі ({users.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Аналітика
          </TabsTrigger>
          {(role === 'admin' || role === 'superadmin') && (
            <TabsTrigger value="admin">
              <Settings className="w-4 h-4 mr-2" />
              Адміністрування
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          {users.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Немає закріплених користувачів</h3>
                <p className="text-muted-foreground text-center">
                  Користувачі будуть з'являтися тут після призначення
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {users.map((userProfile) => (
                <Card key={userProfile.id} className="transition-all hover:shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {userProfile.full_name || userProfile.email}
                        </CardTitle>
                        <CardDescription>{userProfile.email}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(userProfile.role)} 
                        <Badge variant="outline">{userProfile.category}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Пристроїв</Label>
                        <p className="text-sm font-medium">{userProfile.device_count || 0}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Категорія</Label>
                        <Select
                          value={userProfile.category}
                          onValueChange={(value) => updateUserCategory(userProfile.user_id, value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Стандарт</SelectItem>
                            <SelectItem value="premium">Преміум</SelectItem>
                            <SelectItem value="enterprise">Підприємство</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Реєстрація</Label>
                        <p className="text-sm">
                          {new Date(userProfile.created_at).toLocaleDateString('uk-UA')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Дії</Label>
                        <Button variant="outline" size="sm" className="h-8 w-full">
                          Деталі
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Моїх користувачів</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Активних пристроїв (моїх)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.reduce((sum, user) => sum + (user.device_count || 0), 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {(role === 'admin' || role === 'superadmin') && (
          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Призначення користувачів</CardTitle>
                <CardDescription>
                  Призначте користувачів (девелоперам) для керування
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Виберіть користувача</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть користувача..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allUsers
                          .filter(u => !u.developer_id && u.role === 'user') 
                          .map((user) => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              {user.full_name || user.email}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={assignUserToDeveloper}
                      disabled={!selectedUser}
                      className="gradient-primary text-primary-foreground"
                    >
                      Призначити (мені)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Статистика системи</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Всього користувачів (всіх)</Label>
                    <p className="text-2xl font-bold">{allUsers.length + 1}</p> 
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Розробників (всіх)</Label>
                    <p className="text-2xl font-bold">
                      {allUsers.filter(u => u.role === 'developer').length}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Незакріплених (всіх)</Label>
                    <p className="text-2xl font-bold">
                      {allUsers.filter(u => !u.developer_id && u.role === 'user').length} 
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Адмінів (всіх)</Label>
                    <p className="text-2xl font-bold">
                      {allUsers.filter(u => u.role === 'admin' || u.role === 'superadmin').length + 1} 
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default DeveloperCabinet;
