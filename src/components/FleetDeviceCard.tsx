import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Settings2 } from 'lucide-react';
import { Device } from '@/hooks/useDevices';
import { useNavigate } from 'react-router-dom';

interface FleetDeviceCardProps {
  device: Device;
}

export const FleetDeviceCard = React.memo(function FleetDeviceCard({ device }: FleetDeviceCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [secondsSinceSeen, setSecondsSinceSeen] = React.useState<number>(Infinity);

  // Recalculate every 1 second for real-time status
  React.useEffect(() => {
    const calculate = () => {
      if (!device.last_seen_at) {
        setSecondsSinceSeen(Infinity);
        return;
      }
      const diff = (Date.now() - new Date(device.last_seen_at).getTime()) / 1000;
      setSecondsSinceSeen(diff);
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [device.last_seen_at]);

  // 3-Stage Logic: Stage A+B (0-40s) = Online
  const isOnline = secondsSinceSeen <= 40;

  const handleManage = () => {
    navigate(`/dashboard?device=${device.id}`);
  };

  return (
    <Card className="gradient-card border-border/50 hover:border-primary/50 transition-all">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Device Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isOnline ? 'bg-success/10' : 'bg-destructive/10'}`}>
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-success" />
                ) : (
                  <WifiOff className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate">{device.name}</h3>
                {device.location && (
                  <p className="text-xs text-muted-foreground truncate">{device.location}</p>
                )}
              </div>
            </div>
          </div>

          {/* Middle: Status Badge */}
          <Badge 
            variant={isOnline ? 'default' : 'destructive'}
            className="shrink-0"
          >
            {isOnline ? t('status.online') : t('status.offline')}
          </Badge>

          {/* Right: Manage Button */}
          <Button 
            onClick={handleManage}
            className="shrink-0 min-h-[44px]"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            {t('devices.manage')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
