import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Droplets, Sprout, Sun, Moon, Wifi, WifiOff } from 'lucide-react';
import { Device } from '@/hooks/useDevices';
import { useDeviceLogs } from '@/hooks/useDeviceLogs';
import { useDeviceControls } from '@/hooks/useDeviceControls';
import { useDeviceSchedules } from '@/hooks/useDeviceSchedules';
import { useNavigate } from 'react-router-dom';
import { calculatePhotoperiod, isWithinLightSchedule, formatTime } from '@/lib/utils';

interface DeviceCardProps {
  device: Device;
}

export const DeviceCard = React.memo(function DeviceCard({ device }: DeviceCardProps) {
  const { latestLog } = useDeviceLogs(device.id);
  const { settings } = useDeviceControls(device.device_id);
  const navigate = useNavigate();

  // Fixed: Use last_seen_at timestamp comparison instead of status column
  const isOnline = device.last_seen_at 
    ? (new Date().getTime() - new Date(device.last_seen_at).getTime()) < 60000
    : false;

  // Calculate "last seen" time
  const getLastSeenText = () => {
    if (!device.last_seen_at) return 'Невідомо';
    const seconds = Math.floor((new Date().getTime() - new Date(device.last_seen_at).getTime()) / 1000);
    if (seconds < 60) return `${seconds} сек тому`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} хв тому`;
    const hours = Math.floor(minutes / 60);
    return `${hours} год тому`;
  };

  // Get light mode from settings
  const getLightMode = () => {
    if (!settings) return null;

    const lightMode = (settings as any).light_mode ?? 1;
    const startH = (settings as any).light_start_h ?? 6;
    const startM = (settings as any).light_start_m ?? 0;
    const endH = (settings as any).light_end_h ?? 22;
    const endM = (settings as any).light_end_m ?? 0;

    const { dayHours, nightHours } = calculatePhotoperiod(startH, endH);
    const isDay = isWithinLightSchedule(startH, startM, endH, endM);

    return {
      isDay,
      dayHours,
      nightHours,
      startTime: formatTime(startH, startM),
      endTime: formatTime(endH, endM),
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
          value={device.last_temp?.toFixed(1)}
          unit="°C"
        />
        
        <SensorValue
          icon={Droplets}
          label="Вологість повітря"
          value={device.last_hum?.toFixed(0)}
          unit="%"
        />
        
        <SensorValue
          icon={Sprout}
          label="Вологість ґрунту"
          value={device.last_soil_moisture !== null && device.last_soil_moisture !== undefined ? device.last_soil_moisture.toFixed(0) : null}
          unit="%"
        />
        
        <div 
          className={`flex flex-col gap-2 p-3 rounded-lg border border-border/30 transition-colors ${
            lightMode?.isDay 
              ? 'bg-yellow-500/10 border-yellow-500/30' 
              : 'bg-blue-500/10 border-blue-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {lightMode?.isDay ? (
                <Sun className="h-4 w-4 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 text-blue-500" />
              )}
              <span className="text-sm text-muted-foreground">Світловий Цикл</span>
            </div>
            {lightMode && (
              <span className="text-lg font-semibold text-foreground flex items-center gap-1">
                {lightMode.isDay ? '☀️ День' : '🌙 Ніч'}
              </span>
            )}
          </div>
          {lightMode ? (
            <div className="text-sm text-muted-foreground">
              День {lightMode.dayHours}год / Ніч {lightMode.nightHours}год
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Режим не встановлено</span>
          )}
        </div>

        <div className="pt-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground text-center">
            Востаннє онлайн: {getLastSeenText()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
});
