import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Save, Lightbulb, Thermometer, Droplets, Wind, Sparkles, Lock } from 'lucide-react';
import { useDeviceControls } from '@/hooks/useDeviceControls';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
interface DeviceControlsProps {
  deviceId: string;
}
export function DeviceControls({
  deviceId
}: DeviceControlsProps) {
  const {
    settings,
    sensorData,
    lastSeenAt,
    loading,
    isSaving,
    saveSettings
  } = useDeviceControls(deviceId);
  const {
    isPremium
  } = usePremiumStatus();

  // GLOBAL AI MODE (Single source of truth)
  const [aiMode, setAiMode] = useState(0);

  // 💡 Lighting
  const [lightMode, setLightMode] = useState(1);
  const [lightStartH, setLightStartH] = useState(8);
  const [lightStartM, setLightStartM] = useState(0);
  const [lightEndH, setLightEndH] = useState(20);
  const [lightEndM, setLightEndM] = useState(0);

  // 🌡️ Climate
  const [climateMode, setClimateMode] = useState(1);
  const [seasonalMode, setSeasonalMode] = useState(0);
  const [targetTemp, setTargetTemp] = useState(25);
  const [tempHyst, setTempHyst] = useState(2);
  const [targetHum, setTargetHum] = useState(60);
  const [humHyst, setHumHyst] = useState(5);

  // 💧 Irrigation
  const [pumpMode, setPumpMode] = useState(0);
  const [soilMin, setSoilMin] = useState(30);
  const [soilMax, setSoilMax] = useState(80);
  const [isWatering, setIsWatering] = useState(false);

  // 🌬️ Ventilation
  const [ventMode, setVentMode] = useState(0);
  const [ventDurationSec, setVentDurationSec] = useState(60);
  const [ventIntervalSec, setVentIntervalSec] = useState(300);

  // Modified state tracking
  const [hasChanges, setHasChanges] = useState(false);
  useEffect(() => {
    if (settings) {
      // Global AI
      setAiMode((settings as any).ai_mode ?? 0);

      // Lighting
      setLightMode(settings.light_mode ?? 1);
      setLightStartH(settings.light_start_h ?? 8);
      setLightStartM(settings.light_start_m ?? 0);
      setLightEndH(settings.light_end_h ?? 20);
      setLightEndM(settings.light_end_m ?? 0);

      // Climate
      setClimateMode(settings.climate_mode ?? 1);
      setSeasonalMode(settings.seasonal_mode ?? 0);
      setTargetTemp(settings.target_temp ?? 25);
      setTempHyst(settings.temp_hyst ?? 2);
      setTargetHum(settings.target_hum ?? 60);
      setHumHyst(settings.hum_hyst ?? 5);

      // Irrigation
      setPumpMode(settings.pump_mode ?? 0);
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
      // Global AI
      ai_mode: aiMode,
      // Lighting
      light_mode: lightMode,
      light_start_h: lightStartH,
      light_start_m: lightStartM,
      light_end_h: lightEndH,
      light_end_m: lightEndM,
      // Climate
      climate_mode: climateMode,
      seasonal_mode: seasonalMode,
      target_temp: targetTemp,
      temp_hyst: tempHyst,
      target_hum: targetHum,
      hum_hyst: humHyst,
      // Irrigation
      pump_mode: pumpMode,
      soil_min: soilMin,
      soil_max: soilMax,
      // Ventilation
      vent_mode: ventMode,
      vent_duration_sec: ventDurationSec,
      vent_interval_sec: ventIntervalSec
    };
    await saveSettings(patch);
    setHasChanges(false);
  };

  // Toggle global AI mode
  const toggleAiMode = () => {
    if (!isPremium) return;
    const newMode = aiMode === 1 ? 0 : 1;
    setAiMode(newMode);
    setHasChanges(true);
  };

  // Force Water Now (Pulse logic)
  const handleWaterNow = async () => {
    if (!deviceId || isWatering) return;
    
    setIsWatering(true);
    const originalMode = pumpMode; // Store current mode (0 or 2)
    
    try {
      // Step 1: Turn on pump (pump_mode: 1)
      await saveSettings({ pump_mode: 1 });
      
      // Step 2: Wait 10 seconds
      setTimeout(async () => {
        try {
          // Step 3: Revert to original mode
          await saveSettings({ pump_mode: originalMode });
          setIsWatering(false);
        } catch (error: any) {
          toast.error(`Помилка відновлення режиму: ${error.message}`);
          setIsWatering(false);
        }
      }, 10000);
    } catch (error: any) {
      toast.error(`Помилка поливу: ${error.message}`);
      setIsWatering(false);
    }
  };

  // Online status
  const isOnline = lastSeenAt ? new Date().getTime() - new Date(lastSeenAt).getTime() < 60000 : false;
  if (loading) {
    return <div className="gradient-card border border-border/50 rounded-lg p-6">
        <p className="text-center text-muted-foreground">Завантаження...</p>
      </div>;
  }
  const isAiActive = aiMode === 1;
  return <div className="relative space-y-4">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        
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
            {/* Button Group: OFF | ON | AI */}
            <div className="flex gap-2">
              <Button variant={lightMode === 0 ? "destructive" : "outline"} className={cn("flex-1 transition-all", lightMode === 0 && "bg-destructive text-destructive-foreground")} onClick={() => {
              setLightMode(0);
              setHasChanges(true);
            }} disabled={isAiActive}>
                OFF
              </Button>
              <Button variant={lightMode === 1 && !isAiActive ? "default" : "outline"} className={cn("flex-1 transition-all", lightMode === 1 && !isAiActive && "bg-green-600 hover:bg-green-700 text-white")} onClick={() => {
              setLightMode(1);
              setHasChanges(true);
            }} disabled={isAiActive}>
                ON
              </Button>
              <Button variant={isAiActive ? "default" : "outline"} className={cn("flex-1 transition-all", isAiActive && "bg-yellow-500 hover:bg-yellow-600 text-black", !isPremium && "opacity-50 cursor-not-allowed")} onClick={toggleAiMode} disabled={!isPremium}>
                {!isPremium && <Lock className="w-3 h-3 mr-1" />}
                AI
              </Button>
            </div>

            {/* Time Inputs (visible if ON or AI) */}
            {(lightMode === 1 || isAiActive) && <div className="space-y-3 pt-2 border-t border-border/30">
                <Label className="text-sm">Розклад</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Початок</Label>
                    <div className="flex gap-1">
                      <Input type="number" value={lightStartH} onChange={e => {
                    setLightStartH(Number(e.target.value));
                    setHasChanges(true);
                  }} min="0" max="23" disabled={isAiActive} className={cn(isAiActive && "opacity-50")} />
                      <Input type="number" value={lightStartM} onChange={e => {
                    setLightStartM(Number(e.target.value));
                    setHasChanges(true);
                  }} min="0" max="59" disabled={isAiActive} className={cn(isAiActive && "opacity-50")} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {String(lightStartH).padStart(2, '0')}:{String(lightStartM).padStart(2, '0')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Кінець</Label>
                    <div className="flex gap-1">
                      <Input type="number" value={lightEndH} onChange={e => {
                    setLightEndH(Number(e.target.value));
                    setHasChanges(true);
                  }} min="0" max="23" disabled={isAiActive} className={cn(isAiActive && "opacity-50")} />
                      <Input type="number" value={lightEndM} onChange={e => {
                    setLightEndM(Number(e.target.value));
                    setHasChanges(true);
                  }} min="0" max="59" disabled={isAiActive} className={cn(isAiActive && "opacity-50")} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {String(lightEndH).padStart(2, '0')}:{String(lightEndM).padStart(2, '0')}
                    </p>
                  </div>
                </div>
                {isAiActive && <div className="flex items-center gap-1 text-xs text-yellow-600">
                    <Sparkles className="w-3 h-3" />
                    <span>AI керує розкладом</span>
                  </div>}
              </div>}
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
            {/* Button Group: OFF | ON | AI */}
            <div className="flex gap-2">
              <Button variant={climateMode === 0 ? "destructive" : "outline"} className={cn("flex-1 transition-all", climateMode === 0 && "bg-destructive text-destructive-foreground")} onClick={() => {
              setClimateMode(0);
              setHasChanges(true);
            }} disabled={isAiActive}>
                OFF
              </Button>
              <Button variant={climateMode === 1 && !isAiActive ? "default" : "outline"} className={cn("flex-1 transition-all", climateMode === 1 && !isAiActive && "bg-green-600 hover:bg-green-700 text-white")} onClick={() => {
              setClimateMode(1);
              setHasChanges(true);
            }} disabled={isAiActive}>
                ON
              </Button>
              <Button variant={isAiActive ? "default" : "outline"} className={cn("flex-1 transition-all", isAiActive && "bg-yellow-500 hover:bg-yellow-600 text-black", !isPremium && "opacity-50 cursor-not-allowed")} onClick={toggleAiMode} disabled={!isPremium}>
                {!isPremium && <Lock className="w-3 h-3 mr-1" />}
                AI
              </Button>
            </div>

            {/* Seasonal Toggle */}
            <div className="flex gap-2 pt-2 border-t border-border/30">
              <Button variant={seasonalMode === 0 ? "default" : "outline"} className="flex-1" onClick={() => {
              setSeasonalMode(0);
              setHasChanges(true);
            }}>
                ❄️ Зима
              </Button>
              <Button variant={seasonalMode === 1 ? "default" : "outline"} className="flex-1" onClick={() => {
              setSeasonalMode(1);
              setHasChanges(true);
            }}>
                ☀️ Літо
              </Button>
            </div>

            {/* Climate Inputs */}
            <div className="space-y-3 pt-2 border-t border-border/30">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Темп. (°C)</Label>
                  <Input type="number" step="0.1" value={targetTemp} onChange={e => {
                  setTargetTemp(Number(e.target.value));
                  setHasChanges(true);
                }} disabled={isAiActive} className={cn(isAiActive && "opacity-50")} />
                </div>
                <div>
                  <Label className="text-xs">±</Label>
                  <Input type="number" step="0.1" value={tempHyst} onChange={e => {
                  setTempHyst(Number(e.target.value));
                  setHasChanges(true);
                }} disabled={isAiActive} className={cn(isAiActive && "opacity-50")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Волог. (%)</Label>
                  <Input type="number" value={targetHum} onChange={e => {
                  setTargetHum(Number(e.target.value));
                  setHasChanges(true);
                }} min="0" max="100" disabled={isAiActive} className={cn(isAiActive && "opacity-50")} />
                </div>
                <div>
                  <Label className="text-xs">±</Label>
                  <Input type="number" value={humHyst} onChange={e => {
                  setHumHyst(Number(e.target.value));
                  setHasChanges(true);
                }} min="0" max="50" disabled={isAiActive} className={cn(isAiActive && "opacity-50")} />
                </div>
              </div>
              {isAiActive && <div className="flex items-center gap-1 text-xs text-yellow-600">
                  <Sparkles className="w-3 h-3" />
                  <span>AI керує кліматом</span>
                </div>}
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
            {/* Button Group: OFF | ON | AI */}
            <div className="flex gap-2">
              <Button variant={pumpMode === 2 ? "destructive" : "outline"} className={cn("flex-1 transition-all", pumpMode === 2 && "bg-destructive text-destructive-foreground")} onClick={() => {
              setPumpMode(2);
              setHasChanges(true);
            }} disabled={isAiActive || isWatering}>
                OFF
              </Button>
              <Button variant={pumpMode === 0 && !isAiActive ? "default" : "outline"} className={cn("flex-1 transition-all", pumpMode === 0 && !isAiActive && "bg-green-600 hover:bg-green-700 text-white")} onClick={() => {
              setPumpMode(0);
              setHasChanges(true);
            }} disabled={isAiActive || isWatering}>
                ON
              </Button>
              <Button variant={isAiActive ? "default" : "outline"} className={cn("flex-1 transition-all", isAiActive && "bg-yellow-500 hover:bg-yellow-600 text-black", !isPremium && "opacity-50 cursor-not-allowed")} onClick={toggleAiMode} disabled={!isPremium || isWatering}>
                {!isPremium && <Lock className="w-3 h-3 mr-1" />}
                AI
              </Button>
            </div>

            {/* Large Force Water Button */}
            <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50" onClick={handleWaterNow} disabled={isWatering}>
              <Droplets className={cn("w-6 h-6 mr-2", isWatering && "animate-pulse")} />
              {isWatering ? 'Полив... (10 сек)' : 'Полити Зараз'}
            </Button>

            {/* Irrigation Inputs */}
            <div className="space-y-3 pt-2 border-t border-border/30">
              <div>
                <Label className="text-xs">Мін. Вологість Ґрунту (%)</Label>
                <Input type="number" value={soilMin} onChange={e => {
                setSoilMin(Number(e.target.value));
                setHasChanges(true);
              }} min="0" max="100" disabled={isAiActive} className={cn(isAiActive && "opacity-50")} />
                <p className="text-xs text-muted-foreground mt-1">
                  Старт поливу при &lt; {soilMin}%
                </p>
              </div>
              <div>
                <Label className="text-xs">Макс. Вологість Ґрунту (%)</Label>
                <Input type="number" value={soilMax} onChange={e => {
                setSoilMax(Number(e.target.value));
                setHasChanges(true);
              }} min="0" max="100" disabled={isAiActive} className={cn(isAiActive && "opacity-50")} />
                <p className="text-xs text-muted-foreground mt-1">
                  Стоп поливу при &gt; {soilMax}%
                </p>
              </div>
              {isAiActive && <div className="flex items-center gap-1 text-xs text-yellow-600">
                  <Sparkles className="w-3 h-3" />
                  <span>AI керує поливом</span>
                </div>}
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
            {/* Button Group: OFF | ON | AI */}
            <div className="flex gap-2">
              <Button variant={ventMode === 0 ? "destructive" : "outline"} className={cn("flex-1 transition-all", ventMode === 0 && "bg-destructive text-destructive-foreground")} onClick={() => {
              setVentMode(0);
              setHasChanges(true);
            }} disabled={isAiActive}>
                OFF
              </Button>
              <Button variant={ventMode === 1 && !isAiActive ? "default" : "outline"} className={cn("flex-1 transition-all", ventMode === 1 && !isAiActive && "bg-green-600 hover:bg-green-700 text-white")} onClick={() => {
              setVentMode(1);
              setHasChanges(true);
            }} disabled={isAiActive}>
                ON
              </Button>
              <Button variant={isAiActive ? "default" : "outline"} className={cn("flex-1 transition-all", isAiActive && "bg-yellow-500 hover:bg-yellow-600 text-black", !isPremium && "opacity-50 cursor-not-allowed")} onClick={toggleAiMode} disabled={!isPremium}>
                {!isPremium && <Lock className="w-3 h-3 mr-1" />}
                AI
              </Button>
            </div>

            {/* Ventilation Inputs */}
            <div className="space-y-3 pt-2 border-t border-border/30">
              <div>
                <Label className="text-xs">Тривалість (сек)</Label>
                <Input type="number" value={ventDurationSec} onChange={e => {
                setVentDurationSec(Number(e.target.value));
                setHasChanges(true);
              }} min="0" disabled={isAiActive} className={cn(isAiActive && "opacity-50")} />
              </div>
              <div>
                <Label className="text-xs">Інтервал (сек)</Label>
                <Input type="number" value={ventIntervalSec} onChange={e => {
                setVentIntervalSec(Number(e.target.value));
                setHasChanges(true);
              }} min="0" disabled={isAiActive} className={cn(isAiActive && "opacity-50")} />
              </div>
              {isAiActive && <div className="flex items-center gap-1 text-xs text-yellow-600">
                  <Sparkles className="w-3 h-3" />
                  <span>AI керує вентиляцією</span>
                </div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button size="lg" className="shadow-lg" onClick={handleSave} disabled={!hasChanges || isSaving}>
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? 'Збереження...' : 'Зберегти Налаштування'}
        </Button>
      </div>
    </div>;
}