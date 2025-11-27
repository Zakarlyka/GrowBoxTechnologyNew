import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Droplets, Sprout, Sun, Moon, Wifi, WifiOff } from 'lucide-react';
import { Device } from '@/hooks/useDevices';
import { useDeviceLogs } from '@/hooks/useDeviceLogs';
import { useDeviceControls } from '@/hooks/useDeviceControls';
import { useDeviceSchedules } from '@/hooks/useDeviceSchedules';
import { useNavigate } from 'react-router-dom';

interface DeviceCardProps {
  device: Device;
}

export function DeviceCard({ device }: DeviceCardProps) {
  const { latestLog } = useDeviceLogs(device.id);
  const { settings } = useDeviceControls(device.device_id);
  const navigate = useNavigate();

  const isOnline = device.status === 'online';

  // Get light mode from settings
  const getLightMode = () => {
    if (!settings) return null;

    const lightMode = (settings as any).light_mode ?? 1;
    const isDay = lightMode === 2; // Manual ON = Day

    return {
      isDay,
      dayDuration: 12,
      nightDuration: 12,
    };
  };

  const lightMode = getLightMode();

  const SensorValue = ({ icon: Icon, label, value, unit }: any) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
      <div className="flex items-center space-x-2">
        <Icon className="h-4 w-4 text-accent" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-lg font-semibold text-foreground">
        {value !== null && value !== undefined ? `${value}${unit}` : '--'}
      </span>
    </div>
  );

  return (
    <Card 
      className="gradient-card border-border/50 hover:border-primary/50 transition-all cursor-pointer"
      onClick={() => navigate(`/device/${device.id}`)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{device.name}</CardTitle>
          <Badge 
            variant={isOnline ? 'default' : 'destructive'}
            className="flex items-center gap-1"
          >
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Offline
              </>
            )}
          </Badge>
        </div>
        {device.location && (
          <p className="text-sm text-muted-foreground">{device.location}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        <SensorValue
          icon={Thermometer}
          label="Температура"
          value={latestLog?.temperature?.toFixed(1) || device.last_temp?.toFixed(1)}
          unit="°C"
        />
        
        <SensorValue
          icon={Droplets}
          label="Вологість повітря"
          value={latestLog?.humidity?.toFixed(0) || device.last_hum?.toFixed(0)}
          unit="%"
        />
        
        <SensorValue
          icon={Sprout}
          label="Вологість ґрунту"
          value={latestLog?.soil_moisture?.toFixed(0)}
          unit="%"
        />
        
        <div 
          className={`flex items-center justify-between p-3 rounded-lg border border-border/30 transition-colors ${
            lightMode?.isDay 
              ? 'bg-yellow-500/10 border-yellow-500/30' 
              : 'bg-blue-500/10 border-blue-500/30'
          }`}
        >
          <div className="flex items-center space-x-2">
            {lightMode?.isDay ? (
              <Sun className="h-4 w-4 text-yellow-500" />
            ) : (
              <Moon className="h-4 w-4 text-blue-500" />
            )}
            <span className="text-sm text-muted-foreground">День / Ніч</span>
          </div>
          {lightMode ? (
            <span className="text-lg font-semibold text-foreground">
              {lightMode.isDay ? '🌞' : '🌙'} {lightMode.isDay ? 'День' : 'Ніч'} — {lightMode.isDay ? lightMode.dayDuration : lightMode.nightDuration} годин
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">— Режим не встановлено —</span>
          )}
        </div>

        {(device.last_seen || device.last_seen_at) && (
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground text-center">
              Остання активність: {(() => {
                const date = new Date(device.last_seen_at || device.last_seen!);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
              })()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
