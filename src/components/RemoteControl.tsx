import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import { 
  Power, 
  Lightbulb, 
  Fan, 
  Droplets, 
  Thermometer, 
  Activity,
  Gauge,
  Monitor,
  Joystick as JoystickIcon 
} from 'lucide-react';

interface RemoteControlProps {
  deviceId: string;
  deviceName: string;
  onControlChange: (control: string, value: any) => void;
}

interface JoystickData {
  x: number;
  y: number;
  active: boolean;
}

export function RemoteControl({ deviceId, deviceName, onControlChange }: RemoteControlProps) {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(true);
  const [controls, setControls] = useState({
    power: false,
    light: false,
    lightIntensity: [50],
    lightDuration: [12],
    fan: false,
    fanDuration: [8],
    waterPump: false,
    pumpDuration: [10],
    heater: false,
    temperature: [22],
  });

  const [joystick, setJoystick] = useState<JoystickData>({ x: 0, y: 0, active: false });
  const [sensors, setSensors] = useState({
    temperature: 23.5,
    humidity: 65,
    soilMoisture: 45,
    lightLevel: 80,
    waterLevel: 70,
  });

  const joystickRef = useRef<HTMLDivElement>(null);

  const handleControlChange = (control: string, value: any) => {
    setControls(prev => ({ ...prev, [control]: value }));
    onControlChange(control, value);
  };

  const handleJoystickMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!joystickRef.current || !joystick.active) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = Math.max(-1, Math.min(1, (clientX - rect.left - centerX) / centerX));
    const y = Math.max(-1, Math.min(1, (clientY - rect.top - centerY) / centerY));
    
    setJoystick(prev => ({ ...prev, x, y }));
    onControlChange('joystick', { x, y });
  }, [joystick.active, onControlChange]);

  const handleJoystickStart = () => {
    setJoystick(prev => ({ ...prev, active: true }));
  };

  const handleJoystickEnd = () => {
    setJoystick({ x: 0, y: 0, active: false });
    onControlChange('joystick', { x: 0, y: 0 });
  };

  // Simulate real-time sensor data updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prev => ({
        temperature: prev.temperature + (Math.random() - 0.5) * 2,
        humidity: Math.max(0, Math.min(100, prev.humidity + (Math.random() - 0.5) * 5)),
        soilMoisture: Math.max(0, Math.min(100, prev.soilMoisture + (Math.random() - 0.5) * 3)),
        lightLevel: Math.max(0, Math.min(100, prev.lightLevel + (Math.random() - 0.5) * 5)),
        waterLevel: Math.max(0, Math.min(100, prev.waterLevel - Math.random() * 0.5)),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Device Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            {deviceName}
          </CardTitle>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? t('devices.online') : t('devices.offline')}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
              <span>{t('devices.power')}</span>
              <Switch 
                checked={controls.power}
                onCheckedChange={(value) => handleControlChange('power', value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lighting Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            {t('devices.lighting')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <span>{t('devices.lightControl')}</span>
            <Switch 
              checked={controls.light}
              onCheckedChange={(value) => handleControlChange('light', value)}
              disabled={!controls.power}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('devices.intensity')}: {controls.lightIntensity[0]}%</label>
            <Slider
              value={controls.lightIntensity}
              onValueChange={(value) => handleControlChange('lightIntensity', value)}
              max={100}
              step={1}
              disabled={!controls.light || !controls.power}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Тривалість: {controls.lightDuration[0]} год</label>
            <Slider
              value={controls.lightDuration}
              onValueChange={(value) => handleControlChange('lightDuration', value)}
              max={24}
              min={1}
              step={1}
              disabled={!controls.light || !controls.power}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ventilation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fan className="w-5 h-5" />
            {t('devices.ventilation')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <span>{t('devices.fanControl')}</span>
            <Switch 
              checked={controls.fan}
              onCheckedChange={(value) => handleControlChange('fan', value)}
              disabled={!controls.power}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Тривалість: {controls.fanDuration[0]} год</label>
            <Slider
              value={controls.fanDuration}
              onValueChange={(value) => handleControlChange('fanDuration', value)}
              max={24}
              min={1}
              step={1}
              disabled={!controls.fan || !controls.power}
            />
          </div>
        </CardContent>
      </Card>

      {/* Water System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            {t('devices.watering')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <span>{t('devices.waterPump')}</span>
            <Switch 
              checked={controls.waterPump}
              onCheckedChange={(value) => handleControlChange('waterPump', value)}
              disabled={!controls.power}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('devices.duration')}: {controls.pumpDuration[0]}s</label>
            <Slider
              value={controls.pumpDuration}
              onValueChange={(value) => handleControlChange('pumpDuration', value)}
              max={60}
              min={5}
              step={5}
              disabled={!controls.power}
            />
          </div>
          <Button 
            onClick={() => onControlChange('waterPumpTrigger', controls.pumpDuration[0])}
            disabled={!controls.power}
            className="w-full"
          >
            {t('devices.waterNow')}
          </Button>
        </CardContent>
      </Card>

      {/* Joystick Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <JoystickIcon className="w-5 h-5" />
            {t('devices.joystickControl')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <div 
              ref={joystickRef}
              className="relative w-32 h-32 bg-muted rounded-full border-2 border-border cursor-pointer"
              onMouseDown={handleJoystickStart}
              onMouseMove={handleJoystickMove}
              onMouseUp={handleJoystickEnd}
              onMouseLeave={handleJoystickEnd}
              onTouchStart={handleJoystickStart}
              onTouchMove={handleJoystickMove}
              onTouchEnd={handleJoystickEnd}
            >
              <div 
                className="absolute w-6 h-6 bg-primary rounded-full transition-all duration-100"
                style={{
                  left: `calc(50% + ${joystick.x * 50}px - 12px)`,
                  top: `calc(50% + ${joystick.y * 50}px - 12px)`,
                }}
              />
            </div>
            <div className="text-sm text-center">
              <div>X: {joystick.x.toFixed(2)}</div>
              <div>Y: {joystick.y.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Sensors */}
      <Card className="lg:col-span-2 xl:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {t('sensors.realTime')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4" />
                <span className="text-sm">{t('sensors.temperature')}</span>
              </div>
              <span className="font-mono text-sm">{sensors.temperature.toFixed(1)}°C</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{t('sensors.humidity')}</span>
                <span>{sensors.humidity.toFixed(0)}%</span>
              </div>
              <Progress value={sensors.humidity} className="h-2" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{t('sensors.soilMoisture')}</span>
                <span>{sensors.soilMoisture.toFixed(0)}%</span>
              </div>
              <Progress value={sensors.soilMoisture} className="h-2" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{t('sensors.lightLevel')}</span>
                <span>{sensors.lightLevel.toFixed(0)}%</span>
              </div>
              <Progress value={sensors.lightLevel} className="h-2" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{t('sensors.waterLevel')}</span>
                <span>{sensors.waterLevel.toFixed(0)}%</span>
              </div>
              <Progress 
                value={sensors.waterLevel} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}