import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Droplets, Lightbulb, Wind, Flame, Thermometer, Snowflake, CloudRain } from 'lucide-react';
import { useDeviceControls } from '../hooks/useDeviceControls';

interface DeviceControlsProps {
  deviceId: string;
}

export function DeviceControls({ deviceId }: DeviceControlsProps) {
  // --- Хук ---
  const { settings, controls, loading, isSaving, saveSettings, updateControl } = useDeviceControls(deviceId);
  
  // --- Локальний стан ---
  const [localIntensities, setLocalIntensities] = useState<Record<string, number>>({});
  const [targetTemp, setTargetTemp] = useState(26.0);
  const [hysteresis, setHysteresis] = useState(2.0);
  const [targetHumidity, setTargetHumidity] = useState(60);
  const [humidityHysteresis, setHumidityHysteresis] = useState(5);
  const [isACInstalled, setIsACInstalled] = useState(false);
  const [seasonalMode, setSeasonalMode] = useState(0);
  const [ventMode, setVentMode] = useState(1);
  const [minSoilMoisture, setMinSoilMoisture] = useState(30);
  const [maxSoilMoisture, setMaxSoilMoisture] = useState(80);
  const [irrigationDuration, setIrrigationDuration] = useState(10);
  const [irrigationPause, setIrrigationPause] = useState(1);
  const [ventWorkMinutes, setVentWorkMinutes] = useState(2);
  const [ventPauseMinutes, setVentPauseMinutes] = useState(5);
  const [ventIntervalSec, setVentIntervalSec] = useState(300);
  const [ventDurationSec, setVentDurationSec] = useState(120);
  const [lightStartH, setLightStartH] = useState(8);
  const [lightStartM, setLightStartM] = useState(0);
  const [lightEndH, setLightEndH] = useState(20);
  const [lightEndM, setLightEndM] = useState(0);

  // --- Завантаження даних в стан ---
  useEffect(() => {
    if (settings) {
      setTargetTemp(settings.target_temp ?? 26.0);
      setHysteresis(settings.temp_hyst ?? 2.0);
      setTargetHumidity(settings.target_hum ?? 60);
      setHumidityHysteresis(settings.hum_hyst ?? 5);
      setIsACInstalled(settings.is_ac_installed ?? false);
      setSeasonalMode(settings.seasonal_mode ?? 0);
      setVentMode(settings.vent_mode ?? 1);
      setMinSoilMoisture(settings.min_soil_moisture ?? 30);
      setMaxSoilMoisture(settings.max_soil_moisture ?? 80);
      setIrrigationDuration(settings.irrigation_duration_sec ?? 10);
      setIrrigationPause(settings.irrigation_pause_min ?? 1);
      setVentWorkMinutes(settings.vent_work_minutes ?? 2);
      setVentPauseMinutes(settings.vent_pause_minutes ?? 5);
      setVentIntervalSec(settings.vent_interval_sec ?? 300);
      setVentDurationSec(settings.vent_duration_sec ?? 120);
      setLightStartH(settings.light_start_h ?? 8);
      setLightStartM(settings.light_start_m ?? 0);
      setLightEndH(settings.light_end_h ?? 20);
      setLightEndM(settings.light_end_m ?? 0);
    }
  }, [settings]);
  
  // --- Обробники ---
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
      target_temp: targetTemp,
      temp_hyst: hysteresis,
      target_hum: targetHumidity,
      hum_hyst: humidityHysteresis,
      is_ac_installed: isACInstalled,
      seasonal_mode: seasonalMode,
      vent_mode: ventMode,
      vent_work_minutes: ventWorkMinutes,
      vent_pause_minutes: ventPauseMinutes,
      vent_interval_sec: ventIntervalSec,
      vent_duration_sec: ventDurationSec,
      min_soil_moisture: minSoilMoisture,
      max_soil_moisture: maxSoilMoisture,
      irrigation_duration_sec: irrigationDuration,
      irrigation_pause_min: irrigationPause,
      light_start_h: lightStartH,
      light_start_m: lightStartM,
      light_end_h: lightEndH,
      light_end_m: lightEndM,
      // Deprecated fields (for backward compatibility):
      light_start_time: `${String(lightStartH).padStart(2, '0')}:${String(lightStartM).padStart(2, '0')}`,
      light_end_time: `${String(lightEndH).padStart(2, '0')}:${String(lightEndM).padStart(2, '0')}`,
    };
    await saveSettings(newSettings);
  };

  // --- Стан завантаження ---
  if (loading) {
    return (
      <div className="gradient-card border border-border/50 rounded-lg p-6">
        <p className="text-center text-muted-foreground">Завантаження...</p>
      </div>
    );
  }

  // --- Отримання станів для UI ---
  const heaterState = getControlState('heater');
  const acState = getControlState('air_conditioner');
  const ventState = getControlState('ventilation');
  const ventIntensity = localIntensities['ventilation'] ?? ventState.intensity;
  const pumpState = getControlState('water_pump');
  const lightState = getControlState('light');
  const lightIntensity = localIntensities['light'] ?? lightState.intensity;

  // --- Рендер ---
  return (
    <div className="relative space-y-4">
      <h2 className="text-2xl font-bold">Панель Керування</h2>
      
      {/* --- Кнопка Зберегти --- */}
      <Button
        onClick={handleSaveSettings}
        disabled={isSaving}
        className="fixed bottom-6 right-6 z-50 shadow-lg"
        size="lg"
      >
        <Save className="h-5 w-5 mr-2" />
        {isSaving ? 'Збереження...' : 'Зберегти'}
      </Button>
      
      {/* --- Сітка Карток (ЗІ ЗМІНЕНИМ ПОРЯДКОМ) --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        
        {/* === 1. Картка "Клімат-Контроль" === */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-orange-400" />
              Клімат-Контроль
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seasonal Mode */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Сезонний Режим</Label>
              <Select value={String(seasonalMode)} onValueChange={(v) => setSeasonalMode(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">❄️ Зима (Обігрів)</SelectItem>
                  <SelectItem value="1">☀️ Літо (Кондиціонер)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Humidity settings */}
            <div className="space-y-3 pt-3 border-t border-border/30">
              <Label className="text-sm font-medium">Вологість</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Бажана Вологість (%)</Label>
                  <Input
                    type="number"
                    value={targetHumidity}
                    onChange={(e) => setTargetHumidity(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Гістерезис (+/- %)</Label>
                  <Input
                    type="number"
                    value={humidityHysteresis}
                    onChange={(e) => setHumidityHysteresis(Number(e.target.value))}
                    min={0}
                    max={50}
                    className="mt-1 h-9"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20">
                <div className="flex items-center gap-2">
                  <CloudRain className="h-4 w-4 text-indigo-400" />
                  <Label htmlFor="humidifier" className="text-sm cursor-pointer">Зволожувач</Label>
                </div>
                <Switch
                  id="humidifier"
                  checked={getControlState('humidifier').value}
                  onCheckedChange={(checked) => handleToggle('humidifier', checked)}
                />
              </div>
            </div>

            {/* Temperature settings */}
            <div className="space-y-3 pt-3 border-t border-border/30">
              <Label className="text-sm font-medium">Температура</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Бажана Темп. (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={targetTemp}
                    onChange={(e) => setTargetTemp(Number(e.target.value))}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Гістерезис (+/- °C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={hysteresis}
                    onChange={(e) => setHysteresis(Number(e.target.value))}
                    className="mt-1 h-9"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <Label htmlFor="heater" className="text-sm cursor-pointer">Обігрівач</Label>
                </div>
                <Switch
                  id="heater"
                  checked={heaterState.value}
                  onCheckedChange={(checked) => handleToggle('heater', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20">
                <div className="flex items-center gap-2">
                  <Snowflake className="h-4 w-4 text-blue-300" />
                  <Label htmlFor="ac-installed" className="text-sm cursor-pointer">Кондиціонер підключено</Label>
                </div>
                <Switch
                  id="ac-installed"
                  checked={isACInstalled}
                  onCheckedChange={setIsACInstalled}
                />
              </div>
              {isACInstalled && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20 ml-4">
                  <div className="flex items-center gap-2">
                    <Snowflake className="h-4 w-4 text-blue-300" />
                    <Label htmlFor="ac" className="text-sm cursor-pointer">Кондиціонер</Label>
                  </div>
                  <Switch
                    id="ac"
                    checked={acState.value}
                    onCheckedChange={(checked) => handleToggle('air_conditioner', checked)}
                  />
                </div>
              )}
            </div>

            {/* Explanation text */}
            <div className="pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Автоматична логіка:</strong><br />
                • Обігрівач (якщо &lt; {(targetTemp - hysteresis).toFixed(1)}°C)<br />
                • Зволожувач (якщо &lt; {targetHumidity - humidityHysteresis}%)<br />
                • Витяжку (якщо вологість &gt; {targetHumidity + humidityHysteresis}%)<br />
                {isACInstalled ? (
                  <>• Кондиціонер (якщо темп. &gt; {(targetTemp + hysteresis).toFixed(1)}°C)</>
                ) : (
                  <>• Витяжку (якщо темп. &gt; {(targetTemp + hysteresis).toFixed(1)}°C)</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* === 2. Картка "Освітлення" (ПЕРЕМІЩЕНО) === */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              Освітлення
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Manual control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  <Label htmlFor="light" className="text-sm cursor-pointer font-medium">Світло</Label>
                </div>
                <Switch
                  id="light"
                  checked={lightState.value}
                  onCheckedChange={(checked) => handleToggle('light', checked)}
                />
              </div>

              {lightState.value && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Інтенсивність</Label>
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

            {/* Schedule settings */}
            <div className="space-y-3 pt-3 border-t border-border/30">
              <Label className="text-sm font-medium">Розклад (Години:Хвилини)</Label>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Початок</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Год</Label>
                    <Input
                      type="number"
                      value={lightStartH}
                      onChange={(e) => setLightStartH(Number(e.target.value))}
                      min={0}
                      max={23}
                      className="mt-1 h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Хв</Label>
                    <Input
                      type="number"
                      value={lightStartM}
                      onChange={(e) => setLightStartM(Number(e.target.value))}
                      min={0}
                      max={59}
                      className="mt-1 h-9"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Кінець</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Год</Label>
                    <Input
                      type="number"
                      value={lightEndH}
                      onChange={(e) => setLightEndH(Number(e.target.value))}
                      min={0}
                      max={23}
                      className="mt-1 h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Хв</Label>
                    <Input
                      type="number"
                      value={lightEndM}
                      onChange={(e) => setLightEndM(Number(e.target.value))}
                      min={0}
                      max={59}
                      className="mt-1 h-9"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Світло: {String(lightStartH).padStart(2, '0')}:{String(lightStartM).padStart(2, '0')} - {String(lightEndH).padStart(2, '0')}:{String(lightEndM).padStart(2, '0')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* === 3. Картка "Вентиляція" === */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-cyan-400" />
              Вентиляція
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ventilation Mode Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-cyan-400" />
                  <Label htmlFor="vent-mode" className="text-sm cursor-pointer font-medium">Дозвіл роботи вентилятора</Label>
                </div>
                <Switch
                  id="vent-mode"
                  checked={ventMode === 1}
                  onCheckedChange={(checked) => setVentMode(checked ? 1 : 0)}
                />
              </div>
            </div>

            {/* Manual control */}
            <div className="space-y-3 pt-3 border-t border-border/30">
              <Label className="text-sm font-medium">Ручне керування</Label>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-cyan-400" />
                  <Label htmlFor="vent" className="text-sm cursor-pointer">Витяжка</Label>
                </div>
                <Switch
                  id="vent"
                  checked={ventState.value}
                  onCheckedChange={(checked) => handleToggle('ventilation', checked)}
                />
              </div>

              {ventState.value && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Швидкість</Label>
                    <span className="text-sm font-medium">{ventIntensity}%</span>
                  </div>
                  <Slider
                    value={[ventIntensity]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(value) => handleIntensityChange('ventilation', value)}
                    onValueCommit={() => handleIntensityCommit('ventilation')}
                  />
                </div>
              )}
            </div>

            {/* Ventilation Settings */}
            <div className="space-y-3 pt-3 border-t border-border/30">
              <Label className="text-sm font-medium">Налаштування Провітрювання</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Інтервал (СЕК)</Label>
                  <Input
                    type="number"
                    value={ventIntervalSec}
                    onChange={(e) => setVentIntervalSec(Number(e.target.value))}
                    min={1}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Тривалість (СЕК)</Label>
                  <Input
                    type="number"
                    value={ventDurationSec}
                    onChange={(e) => setVentDurationSec(Number(e.target.value))}
                    min={1}
                    className="mt-1 h-9"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Провітрювання: {ventDurationSec} сек кожні {ventIntervalSec} сек
              </p>
            </div>

            {/* Legacy Timer settings */}
            <div className="space-y-3 pt-3 border-t border-border/30">
              <Label className="text-sm font-medium">Таймер (Застарілий)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Робота (ХВ)</Label>
                  <Input
                    type="number"
                    value={ventWorkMinutes}
                    onChange={(e) => setVentWorkMinutes(Number(e.target.value))}
                    min={1}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Пауза (ХВ)</Label>
                  <Input
                    type="number"
                    value={ventPauseMinutes}
                    onChange={(e) => setVentPauseMinutes(Number(e.target.value))}
                    min={1}
                    className="mt-1 h-9"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Цикл: {ventWorkMinutes} хв робота, {ventPauseMinutes} хв пауза
              </p>
            </div>
          </CardContent>
        </Card>

        {/* === 4. Картка "Полив" === */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-400" />
              Полив
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Manual control */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Ручний полив</Label>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleToggle('water_pump', !pumpState.value)}
              >
                <Droplets className="h-4 w-4 mr-2" />
                {pumpState.value ? 'Зупинити полив' : 'Полив (10 сек)'}
              </Button>
            </div>

            {/* Auto settings */}
            <div className="space-y-3 pt-3 border-t border-border/30">
              <Label className="text-sm font-medium">Автоматичний цикл</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Мін. ґрунт (%)</Label>
                  <Input
                    type="number"
                    value={minSoilMoisture}
                    onChange={(e) => setMinSoilMoisture(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Макс. ґрунт (%)</Label>
                  <Input
                    type="number"
                    value={maxSoilMoisture}
                    onChange={(e) => setMaxSoilMoisture(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="mt-1 h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Тривалість (СЕК)</Label>
                  <Input
                    type="number"
                    value={irrigationDuration}
                    onChange={(e) => setIrrigationDuration(Number(e.target.value))}
                    min={1}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Пауза (ХВ)</Label>
                  <Input
                    type="number"
                    value={irrigationPause}
                    onChange={(e) => setIrrigationPause(Number(e.target.value))}
                    min={1}
                    className="mt-1 h-9"
                  />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  • Вмикається при &lt; {minSoilMoisture}%
                </p>
                <p className="text-xs text-muted-foreground">
                  • Вимикається при &gt; {maxSoilMoisture}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
