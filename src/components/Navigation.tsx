import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Cpu, 
  BarChart3, 
  Wifi, 
  Settings as SettingsIcon, 
  FlaskConical,
  Shield,
  BookOpen
} from 'lucide-react';

export function Navigation() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      path: '/devices',
      label: t('navigation.myDevices'),
      icon: Cpu,
      roles: ['user', 'developer', 'admin', 'superadmin']
    },
    {
      path: '/dashboard',
      label: t('navigation.dashboard'),
      icon: Wifi,
      roles: ['user', 'developer', 'admin', 'superadmin']
    },
    {
      path: '/laboratory',
      label: t('navigation.laboratory'),
      icon: FlaskConical,
      roles: ['user', 'developer', 'admin', 'superadmin']
    },
    {
      path: '/analytics',
      label: t('navigation.analytics'),
      icon: BarChart3,
      roles: ['user', 'developer', 'admin', 'superadmin']
    },
    {
      path: '/library',
      label: t('navigation.library'),
      icon: BookOpen,
      roles: ['user', 'developer', 'admin', 'superadmin']
    },
    {
      path: '/admin',
      label: t('navigation.admin'),
      icon: Shield,
      roles: ['admin', 'superadmin']
    },
    {
      path: '/settings',
      label: t('navigation.settings'),
      icon: SettingsIcon,
      roles: ['user', 'developer', 'admin', 'superadmin']
    }
  ];

  const visibleItems = menuItems.filter(item => 
    item.roles.includes(role || 'user')
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-border/40 bg-card/50 flex-col">
        <div className="p-6">
          <nav className="space-y-2">
            {visibleItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 transition-all duration-200",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-md glow-primary" 
                        : "hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Connection Status */}
        <div className="mt-auto p-6 border-t border-border/40">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow"></div>
            <Wifi className="w-4 h-4 text-success" />
            <span className="text-muted-foreground">MQTT з'єднано</span>
          </div>
        </div>
      </aside>

      {/* Bottom Navigation for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border/40 p-2 z-30">
        <div className="flex justify-around">
          {visibleItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "flex-col h-auto py-2 px-3 gap-1 min-w-0",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-xs truncate">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}