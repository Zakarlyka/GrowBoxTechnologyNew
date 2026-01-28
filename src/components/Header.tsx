import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDevices } from '@/hooks/useDevices';
import { useHelpMode } from '@/contexts/HelpModeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, User, Settings, LogOut, Globe, Layers, HelpCircle, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Navigation } from '@/components/Navigation';
import { SmartHelp } from '@/components/ui/smart-help';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { cn } from '@/lib/utils';

// Pages that support device filtering via URL params
const DEVICE_AWARE_PAGES = ['/dashboard', '/laboratory', '/analytics'];

export function Header() {
  const { t, i18n } = useTranslation();
  const { user, role, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { devices, loading: devicesLoading } = useDevices();
  const { isHelpModeEnabled, toggleHelpMode } = useHelpMode();

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
      <div className="flex h-14 md:h-16 items-center justify-between px-3 md:px-6">
        {/* Left side: Mobile menu + Logo */}
        <div className="flex items-center gap-2">
          {/* Mobile Hamburger Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-10 w-10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border/50">
                  <Link to="/" className="flex items-center gap-2">
                    <img 
                      alt="Agro Hogwards Logo" 
                      className="w-8 h-8 object-contain" 
                      src="/lovable-uploads/b40bf314-fa68-43d6-b408-5682467b4f49.png" 
                    />
                    <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Agro Hogwards
                    </span>
                  </Link>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <Navigation />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              alt="Agro Hogwards Logo" 
              className="w-8 h-8 md:w-10 md:h-10 object-contain" 
              src="/lovable-uploads/b40bf314-fa68-43d6-b408-5682467b4f49.png" 
            />
            <h1 className="text-base md:text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:block">
              Agro Hogwards
            </h1>
          </Link>
        </div>

        {/* Right side: Controls */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Global Device Selector - only show on device-aware pages */}
          {isDeviceAwarePage && !devicesLoading && devices.length > 0 && (
            <SmartHelp content={t('help.deviceSelector')} isText={false}>
              <Select value={selectedDeviceId || 'all'} onValueChange={handleDeviceSelect}>
                <SelectTrigger className="w-[100px] sm:w-[160px] md:w-[200px] h-9 bg-background border-border text-sm">
                  <div className="flex items-center gap-2 truncate">
                    {selectedDevice ? (
                      <>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          selectedDevice.last_seen_at && Date.now() - new Date(selectedDevice.last_seen_at).getTime() < 40000 
                            ? 'bg-success' 
                            : 'bg-destructive'
                        }`} />
                        <span className="truncate">{selectedDevice.name}</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <span className="truncate hidden sm:inline">{t('header.allDevices')}</span>
                        <span className="truncate sm:hidden">{t('header.all')}</span>
                      </>
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-[100]">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-muted-foreground" />
                      <span>{t('header.allDevices')}</span>
                    </div>
                  </SelectItem>
                  {devices.map(device => (
                    <SelectItem key={device.id} value={device.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          device.last_seen_at && Date.now() - new Date(device.last_seen_at).getTime() < 40000 
                            ? 'bg-success' 
                            : 'bg-destructive'
                        }`} />
                        <span>{device.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SmartHelp>
          )}

          {/* Notification Center Bell */}
          <NotificationCenter />

          {/* Help Mode Toggle - Education Mode */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isHelpModeEnabled ? "default" : "ghost"}
                  size="icon"
                  onClick={toggleHelpMode}
                  className={cn(
                    "h-9 w-9 md:h-10 md:w-10 transition-all relative",
                    isHelpModeEnabled && "bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                  )}
                >
                  <HelpCircle className={cn(
                    "h-4 w-4 md:h-5 md:w-5",
                    isHelpModeEnabled && "animate-pulse"
                  )} />
                  {isHelpModeEnabled && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full animate-ping" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-background border-border z-[100]">
                <p>{isHelpModeEnabled ? '🎓 Режим Навчання: ON — Вимкнути' : '🎓 Увімкнути Режим Навчання'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Language Selector */}
          <SmartHelp content={t('help.languageSelector')} isText={false}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 md:h-10 px-2 md:px-3">
                  <Globe className="w-4 h-4 md:mr-1" />
                  <span className="hidden md:inline">{currentLanguage.flag}</span>
                  <ChevronDown className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border-border z-[100]">
                {languages.map(lang => (
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
          </SmartHelp>

          {/* User Menu */}
          <SmartHelp content={t('help.userMenu')} isText={false}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 md:h-10 px-2 md:px-3">
                  <User className="w-4 h-4 md:mr-1" />
                  <span className="hidden md:inline max-w-24 truncate">
                    {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <ChevronDown className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border-border z-[100]">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  {role && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {t(`roles.${role}`)}
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
          </SmartHelp>
        </div>
      </div>
    </header>
  );
}