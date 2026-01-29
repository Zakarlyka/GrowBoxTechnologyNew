import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Thermometer, Droplets, CreditCard, Zap, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

type NotificationType = 'critical' | 'warning' | 'info' | 'success';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon?: React.ReactNode;
}

// Mock notifications for demo
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Висока температура!',
    message: 'GrowBox-1: Температура перевищила 32°C',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
    icon: <Thermometer className="w-4 h-4" />,
  },
  {
    id: '2',
    type: 'warning',
    title: 'Низька вологість',
    message: 'GrowBox-2: Вологість впала до 35%',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
    icon: <Droplets className="w-4 h-4" />,
  },
  {
    id: '3',
    type: 'info',
    title: 'Полив розпочато',
    message: 'Автоматичний полив активовано на 30 сек',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    read: true,
    icon: <Droplets className="w-4 h-4" />,
  },
  {
    id: '4',
    type: 'success',
    title: 'Підписка оновлена',
    message: 'Ваш план Pro активний до 28.02.2026',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
    icon: <CreditCard className="w-4 h-4" />,
  },
];

const typeStyles: Record<NotificationType, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-l-destructive' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-l-warning' },
  info: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-l-primary' },
  success: { bg: 'bg-success/10', text: 'text-success', border: 'border-l-success' },
};

export function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleOpenSettings = () => {
    setOpen(false);
    navigate('/account?tab=notifications');
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-9 w-9 md:h-10 md:w-10"
        >
          <Bell className="h-4 w-4 md:h-5 md:w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 md:w-96 p-0" 
        align="end" 
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h4 className="font-semibold">Сповіщення</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} нових
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={markAllAsRead}
            >
              <Check className="w-3 h-3 mr-1" />
              Прочитати всі
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Zap className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Немає сповіщень</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const styles = typeStyles[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "relative px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-l-4",
                      styles.border,
                      !notification.read && "bg-muted/30"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={cn(
                        "mt-0.5 p-1.5 rounded-full shrink-0",
                        styles.bg,
                        styles.text
                      )}>
                        {notification.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            !notification.read && "font-semibold"
                          )}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(notification.timestamp, { 
                            addSuffix: true, 
                            locale: uk 
                          })}
                        </p>
                      </div>

                      {/* Dismiss */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notification.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-4 py-2">
          <Button 
            variant="ghost" 
            className="w-full text-sm h-8" 
            onClick={handleOpenSettings}
          >
            Налаштування сповіщень
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
