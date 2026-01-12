import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDevices } from '@/hooks/useDevices';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, User, Settings, LogOut, Globe, Layers } from 'lucide-react';
import logoAgroHogwards from '@/assets/logo-agro-hogwards-new.png';

// Pages that support device filtering via URL params
const DEVICE_AWARE_PAGES = ['/dashboard', '/laboratory', '/analytics'];

export function Header() {
  const { t, i18n } = useTranslation();
  const { user, role, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { devices, loading: devicesLoading } = useDevices();

  // Check if current page supports device filtering
  const isDeviceAwarePage = DEVICE_AWARE_PAGES.some(page => location.pathname.startsWith(page));

  // Get selected device from URL (bidirectional sync)
  const selectedDeviceId = searchParams.get('device');
  const selectedDevice = useMemo(() => {
    if (selectedDeviceId) {
      return devices.find(d => d.id === selectedDeviceId);
    }
    return null;
  }, [devices, selectedDeviceId]);

  const handleDeviceSelect = (deviceId: string) => {
    if (deviceId === 'all') {
      // Remove device param to show all devices
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('device');
      setSearchParams(newParams);
    } else {
      setSearchParams({ device: deviceId });
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const languages = [
    { code: 'uk', name: 'Українська', flag: '🇺🇦' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img 
            src={logoAgroHogwards} 
            alt="Agro Hogwards Logo" 
            className="w-10 h-10 object-contain"
          />
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:block">
            Agro Hogwards
          </h1>
        </Link>

        <div className="flex items-center gap-2">
          {/* Global Device Selector - only show on device-aware pages */}
          {isDeviceAwarePage && !devicesLoading && devices.length > 0 && (
            <Select 
              value={selectedDeviceId || 'all'} 
              onValueChange={handleDeviceSelect}
            >
              <SelectTrigger className="w-[140px] sm:w-[200px] h-9 bg-background border-border">
                <div className="flex items-center gap-2 truncate">
                  {selectedDevice ? (
                    <>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        selectedDevice.last_seen_at && (Date.now() - new Date(selectedDevice.last_seen_at).getTime()) < 40000
                          ? 'bg-success' : 'bg-destructive'
                      }`} />
                      <span className="truncate">{selectedDevice.name}</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">Усі пристрої</span>
                    </>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className="bg-background border-border z-[100]">
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <span>Усі пристрої</span>
                  </div>
                </SelectItem>
                {devices.map(device => (
                  <SelectItem key={device.id} value={device.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        device.last_seen_at && (Date.now() - new Date(device.last_seen_at).getTime()) < 40000
                          ? 'bg-success' : 'bg-destructive'
                      }`} />
                      <span>{device.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Globe className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{currentLanguage.flag}</span>
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border-border z-[100]">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className="flex items-center gap-2"
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline max-w-32 truncate">
                  {profile?.full_name || user?.email?.split('@')[0] || 'Користувач'}
                </span>
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border-border z-[100]">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile?.full_name || 'Користувач'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                {role && (
                <Badge variant="outline" className="mt-1 text-xs">
                    {role === 'user' ? 'Користувач' : 
                     role === 'developer' ? 'Розробник' : 'Адміністратор'}
                  </Badge>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/account')}>
                <Settings className="w-4 h-4 mr-2" />
                {t('navigation.settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                {t('navigation.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
