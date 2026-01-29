import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { User, Mail, Shield, Lock, LogOut, Loader2, CreditCard, Bell, Settings, Globe, Moon, Sun } from 'lucide-react';
import { Header } from '@/components/Header';
import { BillingTab } from '@/components/billing/BillingTab';
import { NotificationSettings } from '@/components/NotificationSettings';
import { useTheme } from 'next-themes';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  units?: 'metric' | 'imperial';
}

export default function Account() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, role, signOut, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [fullName, setFullName] = useState('');
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  
  // Read tab from URL params, default to 'profile'
  const tabFromUrl = searchParams.get('tab');
  const validTabs = ['profile', 'billing', 'notifications', 'preferences'];
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  // Update active tab when URL changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setUnits(profile.units || 'metric');
    }
  }, [profile]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Помилка завантаження профілю:', error);
        toast({
          title: 'Помилка',
          description: 'Не вдалося завантажити профіль',
          variant: 'destructive',
        });
      } else if (!data) {
        const { data: newProfile, error: insertError } = await (supabase as any)
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Помилка створення профілю:', insertError);
          toast({
            title: 'Помилка',
            description: 'Не вдалося створити профіль',
            variant: 'destructive',
          });
        } else {
          setProfile({ ...newProfile, email: user.email || '' } as any);
        }
      } else {
        setProfile({ ...data, email: user.email || '' } as any);
      }
    } catch (err) {
      console.error('Помилка:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          units: units,
        })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: 'Помилка',
          description: 'Не вдалося оновити профіль',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Успіх!',
          description: 'Профіль успішно оновлено',
        });
        await loadProfile();
      }
    } catch (err) {
      console.error('Помилка оновлення профілю:', err);
      toast({
        title: 'Помилка',
        description: 'Не вдалося оновити профіль',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  }, [fullName, units, user]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Помилка',
        description: 'Заповніть обидва поля паролю',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Помилка',
        description: 'Паролі не співпадають',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Помилка',
        description: 'Пароль повинен містити щонайменше 6 символів',
        variant: 'destructive',
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: 'Помилка',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Успіх!',
          description: 'Пароль успішно оновлено',
        });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Помилка оновлення паролю:', err);
      toast({
        title: 'Помилка',
        description: 'Не вдалося оновити пароль',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    toast({
      title: 'Мову змінено',
      description: lang === 'uk' ? 'Українська' : 'English',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Адміністратор';
      case 'moderator':
        return 'Модератор';
      case 'user':
      default:
        return 'Користувач';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'moderator':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'user':
      default:
        return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <User className="h-8 w-8" />
          Мій Акаунт
        </h1>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Профіль</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Тарифи</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Сповіщення</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Уподобання</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile & Security Tab */}
          <TabsContent value="profile">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Profile Information Card */}
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Інформація профілю
                  </CardTitle>
                  <CardDescription>
                    Ваші дані акаунту
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">Повне ім'я</Label>
                      <Input
                        id="full-name"
                        type="text"
                        placeholder="Введіть ваше ім'я"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/20">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{profile.email}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Рівень доступу</Label>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/20">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span
                          className={`text-xs px-2 py-1 rounded-md border ${getRoleBadgeColor(role)}`}
                        >
                          {getRoleLabel(role)}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={updating}
                    >
                      {updating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Оновлення...
                        </>
                      ) : (
                        'Оновити профіль'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Security Card */}
              <div className="space-y-6">
                <Card className="gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Зміна паролю
                    </CardTitle>
                    <CardDescription>
                      Оновіть ваш пароль для безпеки
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Новий пароль</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Мінімум 6 символів"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Підтвердити пароль</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Повторіть новий пароль"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={updating}
                      >
                        {updating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Оновлення...
                          </>
                        ) : (
                          'Оновити пароль'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Sign Out Card */}
                <Card className="gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LogOut className="h-5 w-5" />
                      Вихід з акаунту
                    </CardTitle>
                    <CardDescription>
                      Завершіть сеанс на цьому пристрої
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Вийти з акаунту
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <BillingTab />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Language Settings */}
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Мова інтерфейсу
                  </CardTitle>
                  <CardDescription>
                    Оберіть мову для відображення
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={i18n.language} onValueChange={changeLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть мову" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uk">🇺🇦 Українська</SelectItem>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Theme Settings */}
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    Тема оформлення
                  </CardTitle>
                  <CardDescription>
                    Оберіть світлу чи темну тему
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть тему" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">☀️ Світла</SelectItem>
                      <SelectItem value="dark">🌙 Темна</SelectItem>
                      <SelectItem value="system">💻 Системна</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Units Settings */}
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Одиниці вимірювання
                  </CardTitle>
                  <CardDescription>
                    Температура та інші вимірювання
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleProfileUpdate}>
                    <Select value={units} onValueChange={(value: 'metric' | 'imperial') => setUnits(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть одиниці" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metric">🌡️ Метрична (°C)</SelectItem>
                        <SelectItem value="imperial">🌡️ Імперська (°F)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="submit" className="w-full mt-4" disabled={updating}>
                      {updating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Збереження...
                        </>
                      ) : (
                        'Зберегти'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
