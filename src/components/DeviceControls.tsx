import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Save, Lightbulb, Thermometer, Droplets, Wind, Sparkles, Lock, Bot, ShieldAlert } from "lucide-react";
import { useDeviceControls } from "@/hooks/useDeviceControls";
import { useAuth } from "@/hooks/useAuth";
import { useAutoPilot } from "@/hooks/useAutoPilot";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DeviceControlsProps {
  deviceId: string;
}

export function DeviceControls({ deviceId }: DeviceControlsProps) {
  const { t } = useTranslation();
  const { settings, sensorData, lastSeenAt, loading, isSaving, saveSettings } = useDeviceControls(deviceId);
  const { profile } = useAuth();

  // Admin-controlled AI permission check
  const isAiAllowed = profile?.is_ai_allowed ?? false;

  // GLOBAL AI MODE (Single source of truth)
  const [aiMode, setAiMode] = useState(0);
  const isAiActive = aiMode === 1;

  // 🤖 Auto-Pilot Hook - calculates and applies strain-based settings
  useAutoPilot(deviceId, isAiActive, settings);

  // 💡 Lighting
  const [lightMode, setLightMode] = useState(1);
  const [lightStartH, setLightStartH] = useState(8);
  const [lightStartM, setLightStartM] = useState(0);
  const [lightEndH, setLightEndH] = useState(20);
  const [lightEndM, setLightEndM] = useState(0);

  // Generate dropdown options
  const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

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
      light_start_h: parseInt(String(lightStartH), 10),
      light_start_m: parseInt(String(lightStartM), 10),
      light_end_h: parseInt(String(lightEndH), 10),
      light_end_m: parseInt(String(lightEndM), 10),
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
      vent_interval_sec: ventIntervalSec,
    };
    await saveSettings(patch);
    setHasChanges(false);
  };

  // Toggle global AI mode - requires admin permission
  const toggleAiMode = (newMode: boolean) => {
    if (!isAiAllowed) {
      toast.error("AI доступ заблокований. Зверніться до Адміністратора.");
      return;
    }
    setAiMode(newMode ? 1 : 0);
    setHasChanges(true);
  };

  // Force Water Now (Pulse logic using pump_pulse trigger)
  const handleWaterNow = async () => {
    if (!deviceId || isWatering) return;

    setIsWatering(true);

    try {
      // Step 1: Trigger pump pulse (pump_pulse: 1)
      await saveSettings({ pump_pulse: 1 });

      // Step 2: Wait 10 seconds
      setTimeout(async () => {
        try {
          // Step 3: Reset pulse trigger (pump_pulse: 0)
          await saveSettings({ pump_pulse: 0 });
          setIsWatering(false);
        } catch (error: any) {
          toast.error(`${t('common.error')}: ${error.message}`);
          setIsWatering(false);
        }
      }, 10000);
    } catch (error: any) {
      toast.error(`${t('common.error')}: ${error.message}`);
      setIsWatering(false);
    }
  };

  // 3-Stage Time-Based Status (1-second refresh)
  const [secondsSinceSeen, setSecondsSinceSeen] = useState<number>(Infinity);
  
  useEffect(() => {
    const calculate = () => {
      if (!lastSeenAt) {
        setSecondsSinceSeen(Infinity);
        return;
      }
      const diff = (Date.now() - new Date(lastSeenAt).getTime()) / 1000;
      setSecondsSinceSeen(diff);
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [lastSeenAt]);

  // Stage A (0-20s): Online, valid data | Stage B (20-40s): Online, expired data | Stage C (>40s): Offline
  const isOnline = secondsSinceSeen <= 40;
  const isDataValid = secondsSinceSeen <= 20;

  if (loading) {
    return (
      <div className="gradient-card border border-border/50 rounded-lg p-6">
        <p className="text-center text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }


  return (
    <div className="relative space-y-4 pb-20 lg:pb-4">
      {/* 🤖 Smart AI Mode Toggle - Main Header */}
      <Card className={cn(
        "gradient-card border-2 transition-all",
        isAiActive ? "border-yellow-500/50 bg-yellow-500/5" : "border-border/50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full transition-all",
                isAiActive ? "bg-yellow-500/20 text-yellow-500" : "bg-muted text-muted-foreground"
              )}>
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">🤖 Smart AI Mode</span>
                  {isAiActive && (
                    <Badge className="bg-yellow-500 text-black text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Активний
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isAiActive 
                    ? "AI керує налаштуваннями на основі профілю рослини" 
                    : "Увімкніть для автоматичного керування"}
                </p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    {!isAiAllowed && (
                      <ShieldAlert className="w-5 h-5 text-destructive" />
                    )}
                    <Switch
                      checked={isAiActive}
                      onCheckedChange={toggleAiMode}
                      disabled={!isAiAllowed}
                      className={cn(
                        "data-[state=checked]:bg-yellow-500",
                        !isAiAllowed && "opacity-50 cursor-not-allowed"
                      )}
                    />
                  </div>
                </TooltipTrigger>
                {!isAiAllowed && (
                  <TooltipContent side="left">
                    <p>🔒 Зверніться до Адміністратора для активації AI</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* 4-Card Grid - Responsive */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Card A: Lighting 💡 */}
        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <Lightbulb className="w-5 h-5" />
              {t('controls.lighting')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Button Group: OFF | ON */}
            <div className={cn("flex gap-2", isAiActive && "opacity-50 pointer-events-none")}>
              <Button
                variant={lightMode === 0 ? "destructive" : "outline"}
                className={cn("flex-1 transition-all min-h-[44px]", lightMode === 0 && "bg-destructive text-destructive-foreground")}
                onClick={() => {
                  setLightMode(0);
                  setHasChanges(true);
                }}
                disabled={isAiActive}
              >
                {t('controls.off')}
              </Button>
              <Button
                variant={lightMode === 1 ? "default" : "outline"}
                className={cn(
                  "flex-1 transition-all min-h-[44px]",
                  lightMode === 1 && "bg-green-600 hover:bg-green-700 text-white",
                )}
                onClick={() => {
                  setLightMode(1);
                  setHasChanges(true);
                }}
                disabled={isAiActive}
              >
                {t('controls.on')}
              </Button>
            </div>

            {/* Time Inputs (visible if ON or AI) */}
            {(lightMode === 1 || isAiActive) && (
              <div className="space-y-4 pt-2 border-t border-border/30">
                {/* Group 1: Start Time */}
                <div className="mb-4">
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">☀️ {t('controls.startTime')}</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">{t('controls.hours')}</p>
                      <Select
                        value={String(lightStartH).padStart(2, '0')}
                        onValueChange={(value) => {
                          setLightStartH(parseInt(value, 10));
                          setHasChanges(true);
                        }}
                        disabled={isAiActive}
                      >
                        <SelectTrigger className={cn("h-10", isAiActive && "opacity-50")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {hourOptions.map((hour) => (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">{t('controls.minutes')}</p>
                      <Select
                        value={String(lightStartM).padStart(2, '0')}
                        onValueChange={(value) => {
                          setLightStartM(parseInt(value, 10));
                          setHasChanges(true);
                        }}
                        disabled={isAiActive}
                      >
                        <SelectTrigger className={cn("h-10", isAiActive && "opacity-50")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {minuteOptions.map((minute) => (
                            <SelectItem key={minute} value={minute}>
                              {minute}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Group 2: End Time */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">🌙 {t('controls.endTime')}</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">{t('controls.hours')}</p>
                      <Select
                        value={String(lightEndH).padStart(2, '0')}
                        onValueChange={(value) => {
                          setLightEndH(parseInt(value, 10));
                          setHasChanges(true);
                        }}
                        disabled={isAiActive}
                      >
                        <SelectTrigger className={cn("h-10", isAiActive && "opacity-50")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {hourOptions.map((hour) => (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">{t('controls.minutes')}</p>
                      <Select
                        value={String(lightEndM).padStart(2, '0')}
                        onValueChange={(value) => {
                          setLightEndM(parseInt(value, 10));
                          setHasChanges(true);
                        }}
                        disabled={isAiActive}
                      >
                        <SelectTrigger className={cn("h-10", isAiActive && "opacity-50")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {minuteOptions.map((minute) => (
                            <SelectItem key={minute} value={minute}>
                              {minute}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {isAiActive && (
                  <div className="flex items-center gap-1 text-xs text-yellow-600">
                    <Sparkles className="w-3 h-3" />
                    <span>{t('controls.aiManagesSchedule')}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card B: Climate Control 🌡️ */}
        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <Thermometer className="w-5 h-5" />
              {t('controls.climate')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Button Group: OFF | ON */}
            <div className={cn("flex gap-2", isAiActive && "opacity-50 pointer-events-none")}>
              <Button
                variant={climateMode === 0 ? "destructive" : "outline"}
                className={cn(
                  "flex-1 transition-all min-h-[44px]",
                  climateMode === 0 && "bg-destructive text-destructive-foreground",
                )}
                onClick={() => {
                  setClimateMode(0);
                  setHasChanges(true);
                }}
                disabled={isAiActive}
              >
                {t('controls.off')}
              </Button>
              <Button
                variant={climateMode === 1 ? "default" : "outline"}
                className={cn(
                  "flex-1 transition-all min-h-[44px]",
                  climateMode === 1 && "bg-green-600 hover:bg-green-700 text-white",
                )}
                onClick={() => {
                  setClimateMode(1);
                  setHasChanges(true);
                }}
                disabled={isAiActive}
              >
                {t('controls.on')}
              </Button>
            </div>

            {/* Seasonal Toggle */}
            <div className="flex gap-2 pt-2 border-t border-border/30">
              <Button
                variant={seasonalMode === 0 ? "default" : "outline"}
                className="flex-1 min-h-[44px]"
                onClick={() => {
                  setSeasonalMode(0);
                  setHasChanges(true);
                }}
              >
                ❄️ {t('controls.winter')}
              </Button>
              <Button
                variant={seasonalMode === 1 ? "default" : "outline"}
                className="flex-1 min-h-[44px]"
                onClick={() => {
                  setSeasonalMode(1);
                  setHasChanges(true);
                }}
              >
                ☀️ {t('controls.summer')}
              </Button>
            </div>

            {/* Climate Inputs */}
            <div className="space-y-3 pt-2 border-t border-border/30">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    🌡️ {t('controls.targetTemp')} (°C)
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        step="0.1"
                        value={targetTemp}
                        onChange={(e) => {
                          setTargetTemp(Number(e.target.value));
                          setHasChanges(true);
                        }}
                        disabled={isAiActive}
                        className={cn("pr-12 h-10", isAiActive && "opacity-50")}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        °C
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    ± {t('controls.hysteresis')} (°C)
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        step="0.1"
                        value={tempHyst}
                        onChange={(e) => {
                          setTempHyst(Number(e.target.value));
                          setHasChanges(true);
                        }}
                        disabled={isAiActive}
                        className={cn("pr-12 h-10", isAiActive && "opacity-50")}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        °C
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    💧 {t('controls.targetHumidity')} (%)
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        value={targetHum}
                        onChange={(e) => {
                          setTargetHum(Number(e.target.value));
                          setHasChanges(true);
                        }}
                        min="0"
                        max="100"
                        disabled={isAiActive}
                        className={cn("pr-12 h-10", isAiActive && "opacity-50")}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    ± {t('controls.hysteresis')} (%)
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        value={humHyst}
                        onChange={(e) => {
                          setHumHyst(Number(e.target.value));
                          setHasChanges(true);
                        }}
                        min="0"
                        max="50"
                        disabled={isAiActive}
                        className={cn("pr-12 h-10", isAiActive && "opacity-50")}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {isAiActive && (
                <div className="flex items-center gap-1 text-xs text-yellow-600">
                  <Sparkles className="w-3 h-3" />
                  <span>{t('controls.aiManagesClimate')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card C: Irrigation 💧 */}
        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <Droplets className="w-5 h-5" />
              {t('controls.irrigation')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Button Group: OFF | ON */}
            <div className={cn("flex gap-2", isAiActive && "opacity-50 pointer-events-none")}>
              <Button
                variant={pumpMode === 2 ? "destructive" : "outline"}
                className={cn("flex-1 transition-all min-h-[44px]", pumpMode === 2 && "bg-destructive text-destructive-foreground")}
                onClick={() => {
                  setPumpMode(2);
                  setHasChanges(true);
                }}
                disabled={isAiActive || isWatering}
              >
                {t('controls.off')}
              </Button>
              <Button
                variant={pumpMode === 0 ? "default" : "outline"}
                className={cn(
                  "flex-1 transition-all min-h-[44px]",
                  pumpMode === 0 && "bg-green-600 hover:bg-green-700 text-white",
                )}
                onClick={() => {
                  setPumpMode(0);
                  setHasChanges(true);
                }}
                disabled={isAiActive || isWatering}
              >
                {t('controls.on')}
              </Button>
            </div>

            {/* Large Force Water Button */}
            <Button
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 min-h-[48px]"
              onClick={handleWaterNow}
              disabled={isWatering}
            >
              <Droplets className={cn("w-6 h-6 mr-2", isWatering && "animate-pulse")} />
              {isWatering ? `${t('controls.watering')} (10 ${t('controls.seconds')})` : t('devices.waterNow')}
            </Button>

            {/* Irrigation Inputs */}
            <div className="space-y-3 pt-2 border-t border-border/30">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">
                  📉 {t('controls.soilMoistureMin')} %
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      value={soilMin}
                      onChange={(e) => {
                        setSoilMin(Number(e.target.value));
                        setHasChanges(true);
                      }}
                      min="0"
                      max="100"
                      disabled={isAiActive}
                      className={cn("pr-12 h-10", isAiActive && "opacity-50")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">
                  📈 {t('controls.soilMoistureMax')} %
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      value={soilMax}
                      onChange={(e) => {
                        setSoilMax(Number(e.target.value));
                        setHasChanges(true);
                      }}
                      min="0"
                      max="100"
                      disabled={isAiActive}
                      className={cn("pr-12 h-10", isAiActive && "opacity-50")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
              </div>
              {isAiActive && (
                <div className="flex items-center gap-1 text-xs text-yellow-600">
                  <Sparkles className="w-3 h-3" />
                  <span>{t('controls.aiManagesIrrigation')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card D: Ventilation 💨 */}
        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <Wind className="w-5 h-5" />
              {t('controls.ventilation')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Button Group: OFF | ON */}
            <div className={cn("flex gap-2", isAiActive && "opacity-50 pointer-events-none")}>
              <Button
                variant={ventMode === 0 ? "destructive" : "outline"}
                className={cn("flex-1 transition-all min-h-[44px]", ventMode === 0 && "bg-destructive text-destructive-foreground")}
                onClick={() => {
                  setVentMode(0);
                  setHasChanges(true);
                }}
                disabled={isAiActive}
              >
                {t('controls.off')}
              </Button>
              <Button
                variant={ventMode === 1 ? "default" : "outline"}
                className={cn(
                  "flex-1 transition-all min-h-[44px]",
                  ventMode === 1 && "bg-green-600 hover:bg-green-700 text-white",
                )}
                onClick={() => {
                  setVentMode(1);
                  setHasChanges(true);
                }}
                disabled={isAiActive}
              >
                {t('controls.on')}
              </Button>
            </div>

            {/* Ventilation Inputs */}
            <div className="space-y-3 pt-2 border-t border-border/30">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">
                  ⏱️ {t('controls.workDuration')} ({t('controls.seconds')})
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      value={ventDurationSec}
                      onChange={(e) => {
                        setVentDurationSec(Number(e.target.value));
                        setHasChanges(true);
                      }}
                      min="0"
                      disabled={isAiActive}
                      className={cn("pr-12 h-10", isAiActive && "opacity-50")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {t('controls.seconds')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">
                  ⏸️ {t('controls.pauseDuration')} ({t('controls.seconds')})
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      value={ventIntervalSec}
                      onChange={(e) => {
                        setVentIntervalSec(Number(e.target.value));
                        setHasChanges(true);
                      }}
                      min="0"
                      disabled={isAiActive}
                      className={cn("pr-12 h-10", isAiActive && "opacity-50")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {t('controls.seconds')}
                    </span>
                  </div>
                </div>
              </div>
              {isAiActive && (
                <div className="flex items-center gap-1 text-xs text-yellow-600">
                  <Sparkles className="w-3 h-3" />
                  <span>{t('controls.aiManagesVentilation')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button - Fixed on mobile, normal on desktop */}
      <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 z-50">
        <Button 
          size="lg" 
          className="w-full lg:w-auto shadow-lg min-h-[48px]" 
          onClick={handleSave} 
          disabled={!hasChanges || isSaving}
        >
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? t('controls.saving') : t('controls.saveConfiguration')}
        </Button>
      </div>
    </div>
  );
}
