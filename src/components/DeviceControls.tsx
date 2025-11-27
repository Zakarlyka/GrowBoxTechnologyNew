import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Lightbulb, Thermometer, Droplets, Wind, Sparkles, Lock } from 'lucide-react';
import { useDeviceControls } from '../hooks/useDeviceControls';
import { cn } from '@/lib/utils';

interface DeviceControlsProps {
  deviceId: string;
}

export function DeviceControls({ deviceId }: DeviceControlsProps) {
  const { settings, sensorData, lastSeenAt, loading, isSaving, saveSettings } = useDeviceControls(deviceId);
  
  // 💡 Lighting
  const [lightMode, setLightMode] = useState(1);
  const [aiLightMode, setAiLightMode] = useState(0);
  const [lightStartH, setLightStartH] = useState(8);
  const [lightStartM, setLightStartM] = useState(0);
  const [lightEndH, setLightEndH] = useState(20);
  const [lightEndM, setLightEndM] = useState(0);
  
  // 🌡️ Climate
  const [seasonalMode, setSeasonalMode] = useState(0);
  const [aiVpdMode, setAiVpdMode] = useState(0);
  const [targetTemp, setTargetTemp] = useState(25);
  const [tempHyst, setTempHyst] = useState(2);
  const [targetHum, setTargetHum] = useState(60);
  const [humHyst, setHumHyst] = useState(5);
  
  // 💧 Irrigation
  const [pumpMode, setPumpMode] = useState(0);
  const [aiWateringMode, setAiWateringMode] = useState(0);
  const [soilMin, setSoilMin] = useState(30);
  const [soilMax, setSoilMax] = useState(80);
  
  // 🌬️ Ventilation
  const [ventMode, setVentMode] = useState(0);
  const [ventDurationSec, setVentDurationSec] = useState(60);
  const [ventIntervalSec, setVentIntervalSec] = useState(300);

  // Modified state tracking
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      // Lighting
      setLightMode(settings.light_mode ?? 1);
      setAiLightMode((settings as any).ai_mode ?? 0);
      setLightStartH(settings.light_start_h ?? 8);
      setLightStartM(settings.light_start_m ?? 0);
      setLightEndH(settings.light_end_h ?? 20);
      setLightEndM(settings.light_end_m ?? 0);
      
      // Climate
      setSeasonalMode(settings.seasonal_mode ?? 0);
      setAiVpdMode((settings as any).ai_vpd_mode ?? 0);
      setTargetTemp(settings.target_temp ?? 25);
      setTempHyst(settings.temp_hyst ?? 2);
      setTargetHum(settings.target_hum ?? 60);
      setHumHyst(settings.hum_hyst ?? 5);
      
      // Irrigation
      setPumpMode(settings.pump_mode ?? 0);
      setAiWateringMode((settings as any).ai_watering_mode ?? 0);
      setSoilMin(settings.soil_min ?? 30);
      setSoilMax(settings.soil_max ?? 80);
      
      // Ventilation
      setVentMode(settings.vent_mode ?? 0);
      setVentDurationSec(settings.vent_duration_sec ?? 60);
      setVentIntervalSec(settings.vent_interval_sec ?? 300);
      
      setHasChanges(false);
    }
  }, [settings]);

  const handleSave = async () => {
    const patch = {
      // Lighting
      light_mode: lightMode,
      ai_mode: aiLightMode,
      light_start_h: lightStartH,
      light_start_m: lightStartM,
      light_end_h: lightEndH,
      light_end_m: lightEndM,
      
      // Climate
      seasonal_mode: seasonalMode,
      ai_vpd_mode: aiVpdMode,
      target_temp: targetTemp,
      temp_hyst: tempHyst,
      target_hum: targetHum,
      hum_hyst: humHyst,
      
      // Irrigation
      pump_mode: pumpMode,
      ai_watering_mode: aiWateringMode,
      soil_min: soilMin,
      soil_max: soilMax,
      
      // Ventilation
      vent_mode: ventMode,
      vent_duration_sec: ventDurationSec,
      vent_interval_sec: ventIntervalSec,
    };
    
    await saveSettings(patch);
    setHasChanges(false);
  };

  // Online status
  const isOnline = lastSeenAt ? 
    (new Date().getTime() - new Date(lastSeenAt).getTime()) < 60000 : false;

  if (loading) {
    return (
      <div className="gradient-card border border-border/50 rounded-lg p-6">
        <p className="text-center text-muted-foreground">Завантаження...</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Панель Керування</h2>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? '🟢 Online' : '🔴 Offline'}
            </Badge>
            {sensorData.temperature !== null && (
              <span className="text-sm text-muted-foreground">
                🌡️ {sensorData.temperature.toFixed(1)}°C
              </span>
            )}
            {sensorData.humidity !== null && (
              <span className="text-sm text-muted-foreground">
                💧 {sensorData.humidity.toFixed(0)}%
              </span>
            )}
            {sensorData.soilMoisture !== null && sensorData.soilMoisture > 0 && (
              <span className="text-sm text-muted-foreground">
                🌱 {sensorData.soilMoisture.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4-Card Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Card A: Lighting 💡 */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="w-5 h-5" />
              Освітлення
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Режим</Label>
              <Select 
                value={String(lightMode)} 
                onValueChange={(v) => { setLightMode(Number(v)); setHasChanges(true); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">🔴 Вимкнено</SelectItem>
                  <SelectItem value="1">🔵 За Розкладом</SelectItem>
                  <SelectItem value="2">🟢 Увімкнено</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">AI Авто-Режим</Label>
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                </div>
                <Switch
                  checked={aiLightMode === 1}
                  onCheckedChange={(checked) => { setAiLightMode(checked ? 1 : 0); setHasChanges(true); }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                AI керує розкладом автоматично
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-border/30">
              <Label className="text-sm">Розклад</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Початок</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      value={lightStartH}
                      onChange={(e) => { setLightStartH(Number(e.target.value)); setHasChanges(true); }}
                      min="0"
                      max="23"
                      disabled={aiLightMode === 1}
                      className={cn(aiLightMode === 1 && "opacity-50")}
                    />
                    <Input
                      type="number"
                      value={lightStartM}
                      onChange={(e) => { setLightStartM(Number(e.target.value)); setHasChanges(true); }}
                      min="0"
                      max="59"
                      disabled={aiLightMode === 1}
                      className={cn(aiLightMode === 1 && "opacity-50")}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {String(lightStartH).padStart(2, '0')}:{String(lightStartM).padStart(2, '0')}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Кінець</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      value={lightEndH}
                      onChange={(e) => { setLightEndH(Number(e.target.value)); setHasChanges(true); }}
                      min="0"
                      max="23"
                      disabled={aiLightMode === 1}
                      className={cn(aiLightMode === 1 && "opacity-50")}
                    />
                    <Input
                      type="number"
                      value={lightEndM}
                      onChange={(e) => { setLightEndM(Number(e.target.value)); setHasChanges(true); }}
                      min="0"
                      max="59"
                      disabled={aiLightMode === 1}
                      className={cn(aiLightMode === 1 && "opacity-50")}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {String(lightEndH).padStart(2, '0')}:{String(lightEndM).padStart(2, '0')}
                  </p>
                </div>
              </div>
              {aiLightMode === 1 && (
                <div className="flex items-center gap-1 text-xs text-yellow-600">
                  <Sparkles className="w-3 h-3" />
                  <span>AI керує розкладом</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card B: Climate Control 🌡️ */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Thermometer className="w-5 h-5" />
              Клімат
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Сезон</Label>
              <Select 
                value={String(seasonalMode)} 
                onValueChange={(v) => { setSeasonalMode(Number(v)); setHasChanges(true); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">❄️ Зима (Обігрів)</SelectItem>
                  <SelectItem value="1">☀️ Літо (Охолодження)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Smart VPD</Label>
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                  <Lock className="w-3 h-3 text-primary" />
                </div>
                <Switch
                  checked={aiVpdMode === 1}
                  onCheckedChange={(checked) => { setAiVpdMode(checked ? 1 : 0); setHasChanges(true); }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                AI оптимізує VPD автоматично
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-border/30">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Темп. (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={targetTemp}
                    onChange={(e) => { setTargetTemp(Number(e.target.value)); setHasChanges(true); }}
                    disabled={aiVpdMode === 1}
                    className={cn(aiVpdMode === 1 && "opacity-50")}
                  />
                </div>
                <div>
                  <Label className="text-xs">±</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={tempHyst}
                    onChange={(e) => { setTempHyst(Number(e.target.value)); setHasChanges(true); }}
                    disabled={aiVpdMode === 1}
                    className={cn(aiVpdMode === 1 && "opacity-50")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Волог. (%)</Label>
                  <Input
                    type="number"
                    value={targetHum}
                    onChange={(e) => { setTargetHum(Number(e.target.value)); setHasChanges(true); }}
                    min="0"
                    max="100"
                    disabled={aiVpdMode === 1}
                    className={cn(aiVpdMode === 1 && "opacity-50")}
                  />
                </div>
                <div>
                  <Label className="text-xs">±</Label>
                  <Input
                    type="number"
                    value={humHyst}
                    onChange={(e) => { setHumHyst(Number(e.target.value)); setHasChanges(true); }}
                    min="0"
                    max="50"
                    disabled={aiVpdMode === 1}
                    className={cn(aiVpdMode === 1 && "opacity-50")}
                  />
                </div>
              </div>
              {aiVpdMode === 1 && (
                <div className="flex items-center gap-1 text-xs text-yellow-600">
                  <Sparkles className="w-3 h-3" />
                  <span>AI керує кліматом</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card C: Irrigation 💧 */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Droplets className="w-5 h-5" />
              Полив
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Режим</Label>
              <Select 
                value={String(pumpMode)} 
                onValueChange={(v) => { setPumpMode(Number(v)); setHasChanges(true); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">🔵 Авто (Сенсор)</SelectItem>
                  <SelectItem value="1">🟢 Полив Зараз</SelectItem>
                  <SelectItem value="2">🔴 Блокування</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Адаптивний Полив</Label>
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                  <Lock className="w-3 h-3 text-primary" />
                </div>
                <Switch
                  checked={aiWateringMode === 1}
                  onCheckedChange={(checked) => { setAiWateringMode(checked ? 1 : 0); setHasChanges(true); }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                AI оптимізує полив автоматично
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-border/30">
              <div>
                <Label className="text-xs">Мін. Вологість Ґрунту (%)</Label>
                <Input
                  type="number"
                  value={soilMin}
                  onChange={(e) => { setSoilMin(Number(e.target.value)); setHasChanges(true); }}
                  min="0"
                  max="100"
                  disabled={aiWateringMode === 1}
                  className={cn(aiWateringMode === 1 && "opacity-50")}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Старт поливу при &lt; {soilMin}%
                </p>
              </div>
              <div>
                <Label className="text-xs">Макс. Вологість Ґрунту (%)</Label>
                <Input
                  type="number"
                  value={soilMax}
                  onChange={(e) => { setSoilMax(Number(e.target.value)); setHasChanges(true); }}
                  min="0"
                  max="100"
                  disabled={aiWateringMode === 1}
                  className={cn(aiWateringMode === 1 && "opacity-50")}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Стоп поливу при &gt; {soilMax}%
                </p>
              </div>
              {aiWateringMode === 1 && (
                <div className="flex items-center gap-1 text-xs text-yellow-600">
                  <Sparkles className="w-3 h-3" />
                  <span>AI керує поливом</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card D: Ventilation 💨 */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wind className="w-5 h-5" />
              Вентиляція
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Авто-Вентиляція</Label>
                <p className="text-xs text-muted-foreground">
                  {ventMode === 0 ? '🔴 Вимкнено' : '🔵 Увімкнено'}
                </p>
              </div>
              <Switch
                checked={ventMode === 1}
                onCheckedChange={(checked) => { setVentMode(checked ? 1 : 0); setHasChanges(true); }}
              />
            </div>

            <div className="space-y-3 pt-3 border-t border-border/30">
              <div>
                <Label className="text-xs">Тривалість (сек)</Label>
                <Input
                  type="number"
                  value={ventDurationSec}
                  onChange={(e) => { setVentDurationSec(Number(e.target.value)); setHasChanges(true); }}
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {ventDurationSec} секунд роботи
                </p>
              </div>
              <div>
                <Label className="text-xs">Інтервал (сек)</Label>
                <Input
                  type="number"
                  value={ventIntervalSec}
                  onChange={(e) => { setVentIntervalSec(Number(e.target.value)); setHasChanges(true); }}
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {ventIntervalSec} секунд паузи
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground">
                <strong>Цикл:</strong> {ventDurationSec}с Вкл / {ventIntervalSec}с Пауза
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving || !hasChanges}
        className="fixed bottom-6 right-6 z-50 shadow-lg"
        size="lg"
      >
        <Save className="h-5 w-5 mr-2" />
        {isSaving ? 'Збереження...' : hasChanges ? 'Зберегти Конфігурацію' : 'Збережено'}
      </Button>
    </div>
  );
}
