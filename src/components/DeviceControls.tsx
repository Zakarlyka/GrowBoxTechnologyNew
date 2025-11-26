import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Droplets, Sun, Wind, Thermometer } from 'lucide-react';
import { useDeviceControls } from '../hooks/useDeviceControls';

interface DeviceControlsProps {
  deviceId: string;
}

export function DeviceControls({ deviceId }: DeviceControlsProps) {
  const { settings, controls, loading, isSaving, saveSettings, updateControl } = useDeviceControls(deviceId);
  
  // 🌡️ Клімат
  const [targetTemp, setTargetTemp] = useState(25);
  const [tempHyst, setTempHyst] = useState(2);
  const [targetHum, setTargetHum] = useState(60);
  const [humHyst, setHumHyst] = useState(5);
  const [seasonalMode, setSeasonalMode] = useState(0);
  
  // 💡 Освітлення
  const [lightMode, setLightMode] = useState(1);
  const [lightStartH, setLightStartH] = useState(8);
  const [lightStartM, setLightStartM] = useState(0);
  const [lightEndH, setLightEndH] = useState(20);
  const [lightEndM, setLightEndM] = useState(0);
  
  // 💧 Полив
  const [pumpMode, setPumpMode] = useState(0);
  const [soilMin, setSoilMin] = useState(30);
  const [soilMax, setSoilMax] = useState(80);
  
  // 🌬️ Вентиляція
  const [ventMode, setVentMode] = useState(0);
  const [ventDurationSec, setVentDurationSec] = useState(60);
  const [ventIntervalSec, setVentIntervalSec] = useState(300);

  // Локальні інтенсивності для слайдерів
  const [localIntensities, setLocalIntensities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (settings) {
      // 🌡️ Клімат
      setTargetTemp(settings.target_temp ?? 25);
      setTempHyst(settings.temp_hyst ?? 2);
      setTargetHum(settings.target_hum ?? 60);
      setHumHyst(settings.hum_hyst ?? 5);
      setSeasonalMode(settings.seasonal_mode ?? 0);
      
      // 💡 Освітлення
      setLightMode(settings.light_mode ?? 1);
      setLightStartH(settings.light_start_h ?? 8);
      setLightStartM(settings.light_start_m ?? 0);
      setLightEndH(settings.light_end_h ?? 20);
      setLightEndM(settings.light_end_m ?? 0);
      
      // 💧 Полив
      setPumpMode(settings.pump_mode ?? 0);
      setSoilMin(settings.soil_min ?? 30);
      setSoilMax(settings.soil_max ?? 80);
      
      // 🌬️ Вентиляція
      setVentMode(settings.vent_mode ?? 0);
      setVentDurationSec(settings.vent_duration_sec ?? 60);
      setVentIntervalSec(settings.vent_interval_sec ?? 300);
    }
  }, [settings]);

  const getControlState = (controlName: string) => {
    const control = controls.find(c => c.control_name === controlName);
    return {
      value: control?.value || false,
      intensity: control?.intensity || 50,
    };
  };

  const handleToggle = async (controlName: string, checked: boolean) => {
    const state = getControlState(controlName);
    await updateControl(controlName, checked, state.intensity);
  };

  const handleIntensityChange = (controlName: string, value: number[]) => {
    setLocalIntensities(prev => ({ ...prev, [controlName]: value[0] }));
  };

  const handleIntensityCommit = async (controlName: string) => {
    const state = getControlState(controlName);
    const intensity = localIntensities[controlName] ?? state.intensity;
    await updateControl(controlName, state.value, intensity);
  };

  const handleSaveSettings = async () => {
    const newSettings = {
      // 🌡️ Клімат
      target_temp: targetTemp,
      temp_hyst: tempHyst,
      target_hum: targetHum,
      hum_hyst: humHyst,
      seasonal_mode: seasonalMode,
      
      // 💡 Освітлення
      light_mode: lightMode,
      light_start_h: lightStartH,
      light_start_m: lightStartM,
      light_end_h: lightEndH,
      light_end_m: lightEndM,
      
      // 💧 Полив
      pump_mode: pumpMode,
      soil_min: soilMin,
      soil_max: soilMax,
      
      // 🌬️ Вентиляція
      vent_mode: ventMode,
      vent_duration_sec: ventDurationSec,
      vent_interval_sec: ventIntervalSec,
    };
    await saveSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="gradient-card border border-border/50 rounded-lg p-6">
        <p className="text-center text-muted-foreground">Завантаження...</p>
      </div>
    );
  }

  const lightState = getControlState('light');
  const lightIntensity = localIntensities['light'] ?? lightState.intensity;

  return (
    <div className="relative space-y-4">
      <h2 className="text-2xl font-bold">🎛️ Панель Керування</h2>
      
      <Button
        onClick={handleSaveSettings}
        disabled={isSaving}
        className="fixed bottom-6 right-6 z-50 shadow-lg"
        size="lg"
      >
        <Save className="h-5 w-5 mr-2" />
        {isSaving ? 'Збереження...' : 'Зберегти Налаштування'}
      </Button>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        
        {/* 🌡️ КЛІМАТ-КОНТРОЛЬ */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5" />
              🌡️ Клімат-Контроль
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Сезонний Режим (seasonal_mode)</Label>
              <Select value={String(seasonalMode)} onValueChange={(v) => setSeasonalMode(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">❄️ Зима (Обігрів)</SelectItem>
                  <SelectItem value="1">☀️ Літо (Охолодження)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Цільова Темп. (target_temp)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={targetTemp}
                  onChange={(e) => setTargetTemp(Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-xs">Гістерезис (temp_hyst)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={tempHyst}
                  onChange={(e) => setTempHyst(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Цільова Вол. (target_hum)</Label>
                <Input
                  type="number"
                  value={targetHum}
                  onChange={(e) => setTargetHum(Number(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label className="text-xs">Гістерезис (hum_hyst)</Label>
                <Input
                  type="number"
                  value={humHyst}
                  onChange={(e) => setHumHyst(Number(e.target.value))}
                  min="0"
                  max="50"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground">
                <strong>Автоматика:</strong><br />
                • Обігрів: &lt; {(targetTemp - tempHyst).toFixed(1)}°C<br />
                • Охолодження: &gt; {(targetTemp + tempHyst).toFixed(1)}°C<br />
                • Вологість: {targetHum - humHyst}% - {targetHum + humHyst}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 💡 ОСВІТЛЕННЯ */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="w-5 h-5" />
              💡 Освітлення
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Режим Світла (light_mode)</Label>
              <Select value={String(lightMode)} onValueChange={(v) => setLightMode(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">🔴 Manual OFF (Вимкн)</SelectItem>
                  <SelectItem value="1">🔵 AUTO / Schedule (Таймер)</SelectItem>
                  <SelectItem value="2">🟢 Manual ON (Ввімкн)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ручне керування (коли Manual ON) */}
            <div className="space-y-3 pt-3 border-t border-border/30">
              <div className="flex items-center justify-between">
                <Label>Ручне керування</Label>
                <Switch
                  checked={lightState.value}
                  onCheckedChange={(checked) => handleToggle('light', checked)}
                />
              </div>
              
              {lightState.value && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Інтенсивність</Label>
                    <span className="text-sm font-medium">{lightIntensity}%</span>
                  </div>
                  <Slider
                    value={[lightIntensity]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(value) => handleIntensityChange('light', value)}
                    onValueCommit={() => handleIntensityCommit('light')}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 pt-3 border-t border-border/30">
              <Label className="text-sm font-medium">Розклад (Години:Хвилини)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Початок (Год)</Label>
                  <Input
                    type="number"
                    value={lightStartH}
                    onChange={(e) => setLightStartH(Number(e.target.value))}
                    min="0"
                    max="23"
                  />
                </div>
                <div>
                  <Label className="text-xs">Початок (Хв)</Label>
                  <Input
                    type="number"
                    value={lightStartM}
                    onChange={(e) => setLightStartM(Number(e.target.value))}
                    min="0"
                    max="59"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Кінець (Год)</Label>
                  <Input
                    type="number"
                    value={lightEndH}
                    onChange={(e) => setLightEndH(Number(e.target.value))}
                    min="0"
                    max="23"
                  />
                </div>
                <div>
                  <Label className="text-xs">Кінець (Хв)</Label>
                  <Input
                    type="number"
                    value={lightEndM}
                    onChange={(e) => setLightEndM(Number(e.target.value))}
                    min="0"
                    max="59"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Світло: {String(lightStartH).padStart(2, '0')}:{String(lightStartM).padStart(2, '0')} - {String(lightEndH).padStart(2, '0')}:{String(lightEndM).padStart(2, '0')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 💧 ПОЛИВ */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5" />
              💧 Полив
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Режим Помпи (pump_mode)</Label>
              <Select value={String(pumpMode)} onValueChange={(v) => setPumpMode(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">🔵 AUTO (Сенсор)</SelectItem>
                  <SelectItem value="1">🟢 Manual ON (Полив зараз)</SelectItem>
                  <SelectItem value="2">🔴 Manual OFF (Блокування)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Мін. вологість ґрунту (soil_min, %)</Label>
              <Input
                type="number"
                value={soilMin}
                onChange={(e) => setSoilMin(Number(e.target.value))}
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">Старт поливу при &lt; {soilMin}%</p>
            </div>
            
            <div>
              <Label>Макс. вологість ґрунту (soil_max, %)</Label>
              <Input
                type="number"
                value={soilMax}
                onChange={(e) => setSoilMax(Number(e.target.value))}
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">Стоп поливу при &gt; {soilMax}%</p>
            </div>
          </CardContent>
        </Card>

        {/* 🌬️ ВЕНТИЛЯЦІЯ */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="w-5 h-5" />
              🌬️ Вентиляція
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Режим Вентиляції</Label>
                <p className="text-xs text-muted-foreground">
                  {ventMode === 0 ? '🔴 OFF' : '🔵 AUTO (Клімат + Таймер)'}
                </p>
              </div>
              <Switch
                checked={ventMode === 1}
                onCheckedChange={(checked) => setVentMode(checked ? 1 : 0)}
              />
            </div>
            
            <div>
              <Label>Тривалість роботи (vent_duration_sec)</Label>
              <Input
                type="number"
                value={ventDurationSec}
                onChange={(e) => setVentDurationSec(Number(e.target.value))}
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">{ventDurationSec} секунд</p>
            </div>
            
            <div>
              <Label>Інтервал паузи (vent_interval_sec)</Label>
              <Input
                type="number"
                value={ventIntervalSec}
                onChange={(e) => setVentIntervalSec(Number(e.target.value))}
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">{ventIntervalSec} секунд</p>
            </div>

            <div className="pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground">
                <strong>Цикл:</strong> {ventDurationSec}с Вкл / {ventIntervalSec}с Пауза
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
