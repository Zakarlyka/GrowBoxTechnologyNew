import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { latestLog } = useDeviceLogs(device.id);
  const { settings } = useDeviceControls(device.device_id);
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

  // 3-Stage Logic:
  // Stage A (0-20s): Online, show real data
  // Stage B (20-40s): Online, show 0/--
  // Stage C (>40s): Offline, show 0/--
  const isOnline = secondsSinceSeen <= 40;
  const isDataValid = secondsSinceSeen <= 20;

  // Calculate "last seen" time
  const getLastSeenText = () => {
    if (!device.last_seen_at) return t('common.unknown');
    const seconds = Math.floor((new Date().getTime() - new Date(device.last_seen_at).getTime()) / 1000);
    if (seconds < 60) return `${seconds} ${t('common.secsAgo')}`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} ${t('common.minsAgo')}`;
    const hours = Math.floor(minutes / 60);
    return `${hours} ${t('common.hoursAgo')}`;
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

  // Get display value based on 3-stage logic
  const getDisplayValue = (dbValue: number | null | undefined): number | null => {
    // Stage A: Show real DB data
    if (isDataValid && dbValue !== null && dbValue !== undefined) {
      return dbValue;
    }
    // Stage B & C: Force 0
    return null;
  };

  // Check if value should be shown as inactive (gray)
  const isValueInactive = (displayValue: number | null) => {
    if (!isOnline) return true;
    if (displayValue === null) return true;
    if (displayValue === 0) return true;
    return false;
  };

  const SensorValue = ({ icon: Icon, label, dbValue, unit, color }: { 
    icon: any; 
    label: string; 
    dbValue: number | null | undefined; 
    unit: string;
    color: 'orange' | 'blue' | 'green';
  }) => {
    const displayValue = getDisplayValue(dbValue);
    const inactive = isValueInactive(displayValue);
    const displayText = displayValue !== null ? `${displayValue}${unit}` : '--';
    
    const colorClasses = {
      orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: 'text-orange-500' },
      blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: 'text-blue-500' },
      green: { bg: 'bg-green-500/10', border: 'border-green-500/30', icon: 'text-green-500' },
    };
    
    const styles = colorClasses[color];
    
    return (
      <div className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${styles.bg} border ${styles.border}`}>
        <div className="flex items-center space-x-2">
          <Icon className={`h-4 w-4 ${inactive ? 'text-muted-foreground/50' : styles.icon}`} />
          <span className="text-xs sm:text-sm text-muted-foreground">{label}</span>
        </div>
        <span className={`text-base sm:text-lg font-semibold ${inactive ? 'text-muted-foreground' : 'text-foreground'}`}>
          {displayText}
        </span>
      </div>
    );
  };

  return (
    <Card 
      className="gradient-card border-border/50 hover:border-primary/50 transition-all cursor-pointer"
      onClick={() => navigate(`/dashboard?device=${device.id}`)}
    >
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl truncate pr-2">{device.name}</CardTitle>
          <Badge 
            variant={isOnline ? 'default' : 'destructive'}
            className="flex items-center gap-1 shrink-0"
          >
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3" />
                <span className="hidden sm:inline">{t('status.online')}</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                <span className="hidden sm:inline">{t('status.offline')}</span>
              </>
            )}
          </Badge>
        </div>
        {device.location && (
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{device.location}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-2 sm:space-y-3">
        <SensorValue
          icon={Thermometer}
          label={t('sensors.temperature')}
          dbValue={device.last_temp !== null && device.last_temp !== undefined ? parseFloat(device.last_temp.toFixed(1)) : null}
          unit="°C"
          color="orange"
        />
        
        <SensorValue
          icon={Droplets}
          label={t('sensors.airHumidity')}
          dbValue={device.last_hum !== null && device.last_hum !== undefined ? parseFloat(device.last_hum.toFixed(0)) : null}
          unit="%"
          color="blue"
        />
        
        <SensorValue
          icon={Sprout}
          label={t('sensors.soilMoisture')}
          dbValue={device.last_soil_moisture !== null && device.last_soil_moisture !== undefined ? parseFloat(device.last_soil_moisture.toFixed(0)) : null}
          unit="%"
          color="green"
        />
        
        <div 
          className={`flex flex-col gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg border border-border/30 transition-colors ${
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
              <span className="text-xs sm:text-sm text-muted-foreground">{t('sensors.lightCycle')}</span>
            </div>
            {lightMode && (
              <span className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-1">
                {lightMode.isDay ? `☀️ ${t('sensors.day')}` : `🌙 ${t('sensors.night')}`}
              </span>
            )}
          </div>
          {lightMode ? (
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('sensors.day')} {lightMode.dayHours}h / {t('sensors.night')} {lightMode.nightHours}h
            </div>
          ) : (
            <span className="text-xs sm:text-sm text-muted-foreground">--</span>
          )}
        </div>

        <div className="pt-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground text-center">
            {t('devices.lastSeen')}: {getLastSeenText()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
});
