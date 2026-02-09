import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SmartTooltip } from "@/components/ui/smart-tooltip";
import { SmartHelp } from "@/components/ui/smart-help";
import { Save, Lightbulb, Thermometer, Droplets, Wind, Sparkles, Bot, ShieldAlert, Leaf, Settings2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useDeviceControls } from "@/hooks/useDeviceControls";
import { useRelayStatus } from "@/hooks/useRelayStatus";
import { useDeviceError } from "@/hooks/useDeviceError";
import { useAuth } from "@/hooks/useAuth";
import { useAutoPilot } from "@/hooks/useAutoPilot";
import { DemoSimulationPanel } from "@/components/DemoSimulationPanel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DeviceControlsProps {
  deviceId: string;
}

export function DeviceControls({ deviceId }: DeviceControlsProps) {
  const { t } = useTranslation();
  const { settings, sensorData, lastSeenAt, deviceName, deviceType, deviceUuid, loading, isSaving, saveSettings, refetch } = useDeviceControls(deviceId);
  const { relayStatus } = useRelayStatus(deviceId);
  const { error: deviceError } = useDeviceError(deviceId);
  const { profile } = useAuth();

  // Check if this is a demo device
  const isDemoDevice = deviceType === 'demo' || deviceName === 'Demo Growbox';

  // Admin-controlled AI permission check
  const isAiAllowed = profile?.is_ai_allowed ?? false;

  // GLOBAL AI MODE (Single source of truth)
  const [aiMode, setAiMode] = useState(0);
  const isAiActive = aiMode === 1;

  // 🤖 Auto-Pilot Hook - returns calculated targets from Master Plant
  const { targets: aiTargets, masterPlant, isLoading: aiLoading } = useAutoPilot(deviceId, isAiActive, settings);

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
  const [targetTemp, setTargetTemp] = useState<number | string>(25);
  const [tempHyst, setTempHyst] = useState<number | string>(2);
  const [targetHum, setTargetHum] = useState<number | string>(60);
  const [humHyst, setHumHyst] = useState<number | string>(5);

  // 💧 Irrigation
  const [pumpMode, setPumpMode] = useState(0);
  const [soilMin, setSoilMin] = useState<number | string>(30);
  const [soilMax, setSoilMax] = useState<number | string>(80);
  const [isWatering, setIsWatering] = useState(false);

  // Pump dry lock error detection
  const isPumpDryLock = deviceError === 'PUMP_DRY_LOCK';

  // 🌬️ Ventilation
  const [ventMode, setVentMode] = useState(0);
  const [ventDurationSec, setVentDurationSec] = useState<number | string>(60);
  const [ventIntervalSec, setVentIntervalSec] = useState<number | string>(300);

  // Modified state tracking
  const [hasChanges, setHasChanges] = useState(false);

  // Advanced Mode toggle - hides Hysteresis by default
  const [showAdvancedClimate, setShowAdvancedClimate] = useState(false);
  const [showAdvancedSoil, setShowAdvancedSoil] = useState(false);

  // Load settings from database on initial load
  useEffect(() => {
    if (settings) {
      console.log('DeviceControls: Loading settings from DB:', settings);
      // Global AI
      const dbAiMode = (settings as any).ai_mode ?? 0;
      setAiMode(dbAiMode);

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

  // 🤖 AI Mode Auto-Fill: One-way sync - display AI values when active
  useEffect(() => {
    if (isAiActive && aiTargets) {
      console.log('DeviceControls: AI Mode ON - Displaying AI targets:', aiTargets);
      
      // Populate climate fields with AI-calculated values
      setTargetTemp(aiTargets.targetTemp);
      setTargetHum(aiTargets.targetHum);
      
      // Populate light schedule
      setLightStartH(aiTargets.lightStartH);
      setLightStartM(0);
      setLightEndH(aiTargets.lightEndH);
      setLightEndM(0);
      
      // Ensure modes are ON when AI is active
      setClimateMode(1);
      setLightMode(1);
    }
  }, [isAiActive, aiTargets]);

  const handleSave = async () => {
    // Ensure all values are numbers before saving
    const safeTargetTemp = targetTemp === '' ? 25 : Number(targetTemp);
    const safeTempHyst = tempHyst === '' ? 2 : Number(tempHyst);
    const safeTargetHum = targetHum === '' ? 60 : Number(targetHum);
    const safeHumHyst = humHyst === '' ? 5 : Number(humHyst);
    const safeSoilMin = soilMin === '' ? 30 : Number(soilMin);
    const safeSoilMax = soilMax === '' ? 80 : Number(soilMax);
    const safeVentDuration = ventDurationSec === '' ? 60 : Number(ventDurationSec);
    const safeVentInterval = ventIntervalSec === '' ? 300 : Number(ventIntervalSec);
    
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
      target_temp: safeTargetTemp,
      temp_hyst: safeTempHyst,
      target_hum: safeTargetHum,
      hum_hyst: safeHumHyst,
      // Irrigation
      pump_mode: pumpMode,
      soil_min: safeSoilMin,
      soil_max: safeSoilMax,
      // Ventilation
      vent_mode: ventMode,
      vent_duration_sec: safeVentDuration,
      vent_interval_sec: safeVentInterval,
    };
    await saveSettings(patch);
    setHasChanges(false);
  };

  // Toggle global AI mode - requires admin permission
  const toggleAiMode = (newMode: boolean) => {
    if (!isAiAllowed) {
      toast.error(t('controls.aiAccessBlocked'));
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
    <div className="relative space-y-4 pb-24 lg:pb-4">
      {/* Demo Simulation Panel - Only for demo devices */}
      {isDemoDevice && deviceUuid && (
        <DemoSimulationPanel deviceId={deviceUuid} />
      )}

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
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <SmartTooltip term="🤖 Smart AI Mode" content={t('help.aiMode')}>
                    <span className="font-semibold text-lg">🤖 Smart AI Mode</span>
                  </SmartTooltip>
                  {isAiActive && (
                    <Badge className="bg-yellow-500 text-black text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {t('controls.aiModeActive')}
                    </Badge>
                  )}
                </div>
                {isAiActive && masterPlant ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Leaf className="w-3 h-3 text-green-500" />
                    <span className="text-green-500 font-medium">{masterPlant.strainName}</span>
                    <span>→</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {masterPlant.currentStage}
                    </Badge>
                    {aiTargets && (
                      <span className="text-xs">
                        ({aiTargets.targetTemp}°C / {aiTargets.targetHum}% RH)
                      </span>
                    )}
                  </div>
                ) : isAiActive && aiLoading ? (
                  <p className="text-sm text-muted-foreground">{t('controls.aiLoadingProfile')}</p>
                ) : isAiActive && !masterPlant ? (
                  <p className="text-sm text-amber-500">⚠️ {t('controls.aiNoMasterPlant')}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('controls.aiEnableDescription')}
                  </p>
                )}
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
                    <p>🔒 {t('controls.contactAdmin')}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* 4-Card Grid - Unified Layout */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 items-stretch">
        {/* Card A: Lighting 💡 */}
        <Card className="gradient-card border-border/50 h-full flex flex-col">
          <CardHeader className="pb-3 px-5 pt-5">
            <div className="flex items-center justify-between">
              <SmartHelp content={t('help.lightingCard')}>
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <Lightbulb className={cn(
                    "w-5 h-5 transition-all duration-300",
                    relayStatus?.light === 1 
                      ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" 
                      : "text-muted-foreground"
                  )} />
                  {t('controls.lighting')}
                  {relayStatus?.light === 1 && (
                    <Badge variant="outline" className="ml-2 text-xs border-primary/50 text-primary">
                      {t('controls.active')}
                    </Badge>
                  )}
                </CardTitle>
              </SmartHelp>
              <Switch
                checked={lightMode === 1}
                onCheckedChange={(checked) => {
                  setLightMode(checked ? 1 : 0);
                  setHasChanges(true);
                }}
                disabled={isAiActive}
                className={cn(
                  "data-[state=checked]:bg-primary",
                  isAiActive && "opacity-50"
                )}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col px-5 pb-5 pt-0 space-y-4">
            {isAiActive && (
              <div className="flex items-center gap-1 text-xs text-yellow-600 pt-1">
                <Sparkles className="w-3 h-3" />
                <span>{t('controls.aiManagesSchedule')}</span>
              </div>
            )}
            {/* Time Inputs - Main content area (grows to fill) */}
            <div className="flex-1 space-y-4">
              {(lightMode === 1 || isAiActive) && (
                <>
                  {/* Group 1: Start Time */}
                  <div>
                    <SmartHelp content={t('help.lightStartTime')}>
                      <Label className="text-sm font-medium text-muted-foreground mb-2 block">☀️ {t('controls.startTime')}</Label>
                    </SmartHelp>
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
                          <SmartHelp content={t('help.lightStartTime')} isText={false}>
                            <SelectTrigger className={cn("h-10 bg-input", isAiActive && "opacity-50")}>
                              <SelectValue />
                            </SelectTrigger>
                          </SmartHelp>
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
                          <SmartHelp content={t('help.lightStartTime')} isText={false}>
                            <SelectTrigger className={cn("h-10 bg-input", isAiActive && "opacity-50")}>
                              <SelectValue />
                            </SelectTrigger>
                          </SmartHelp>
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
                    <SmartHelp content={t('help.lightEndTime')}>
                      <Label className="text-sm font-medium text-muted-foreground mb-2 block">🌙 {t('controls.endTime')}</Label>
                    </SmartHelp>
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
                          <SmartHelp content={t('help.lightEndTime')} isText={false}>
                            <SelectTrigger className={cn("h-10 bg-input", isAiActive && "opacity-50")}>
                              <SelectValue />
                            </SelectTrigger>
                          </SmartHelp>
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
                          <SmartHelp content={t('help.lightEndTime')} isText={false}>
                            <SelectTrigger className={cn("h-10 bg-input", isAiActive && "opacity-50")}>
                              <SelectValue />
                            </SelectTrigger>
                          </SmartHelp>
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

                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card B: Climate Control 🌡️ */}
        <Card className="gradient-card border-border/50 h-full flex flex-col">
          <CardHeader className="pb-3 px-5 pt-5">
            <div className="flex items-center justify-between">
              <SmartHelp content={t('help.climateCard')}>
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <Thermometer className={cn(
                    "w-5 h-5 transition-all duration-300",
                    relayStatus?.clim === 1 
                      ? "text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]" 
                      : "text-muted-foreground"
                  )} />
                  {t('controls.climate')}
                  {relayStatus?.clim === 1 && (
                    <Badge variant="outline" className="ml-2 text-xs border-primary/50 text-primary">
                      {t('controls.active')}
                    </Badge>
                  )}
                </CardTitle>
              </SmartHelp>
              <Switch
                checked={climateMode === 1}
                onCheckedChange={(checked) => {
                  setClimateMode(checked ? 1 : 0);
                  setHasChanges(true);
                }}
                disabled={isAiActive}
                className={cn(
                  "data-[state=checked]:bg-primary",
                  isAiActive && "opacity-50"
                )}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col px-5 pb-5 pt-0 space-y-4">
            {isAiActive && (
              <div className="flex items-center gap-1 text-xs text-yellow-600 pt-1">
                <Sparkles className="w-3 h-3" />
                <span>{t('controls.aiManagesClimate')}</span>
              </div>
            )}

            {/* Seasonal Toggle */}
            <div className="flex gap-2 pt-2 border-t border-border/30">
              <SmartHelp content={t('help.seasonalMode')} isText={false}>
                <Button
                  variant={seasonalMode === 0 ? "default" : "outline"}
                  className="flex-1 h-10"
                  onClick={() => {
                    setSeasonalMode(0);
                    setHasChanges(true);
                  }}
                >
                  ❄️ {t('controls.winter')}
                </Button>
              </SmartHelp>
              <SmartHelp content={t('help.seasonalMode')} isText={false}>
                <Button
                  variant={seasonalMode === 1 ? "default" : "outline"}
                  className="flex-1 h-10"
                  onClick={() => {
                    setSeasonalMode(1);
                    setHasChanges(true);
                  }}
                >
                  ☀️ {t('controls.summer')}
                </Button>
              </SmartHelp>
            </div>

            {/* Climate Inputs - Main content area (grows to fill) */}
            <div className="flex-1 space-y-3 pt-2 border-t border-border/30">
              {/* Target Temperature */}
              <div className="space-y-1">
                <SmartHelp content={t('help.targetTemp')}>
                  <Label className="text-sm font-medium text-muted-foreground">
                    🌡️ {t('controls.targetTemp')} (°C)
                  </Label>
                </SmartHelp>
                <div className="flex items-center gap-2">
                  <SmartHelp content={t('help.targetTemp')} isText={false}>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        step="0.1"
                        value={targetTemp ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTargetTemp(val === '' ? '' : Number(val));
                          setHasChanges(true);
                        }}
                        disabled={isAiActive}
                        className={cn("pr-12 h-10 bg-input", isAiActive && "opacity-50 cursor-not-allowed")}
                        placeholder="25"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        °C
                      </span>
                    </div>
                  </SmartHelp>
                </div>
              </div>

              {/* Target Humidity */}
              <div className="space-y-1">
                <SmartHelp content={t('help.targetHumidity')}>
                  <Label className="text-sm font-medium text-muted-foreground">
                    💧 {t('controls.targetHumidity')} (%)
                  </Label>
                </SmartHelp>
                <div className="flex items-center gap-2">
                  <SmartHelp content={t('help.targetHumidity')} isText={false}>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        value={targetHum ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTargetHum(val === '' ? '' : Number(val));
                          setHasChanges(true);
                        }}
                        min="0"
                        max="100"
                        disabled={isAiActive}
                        className={cn("pr-12 h-10 bg-input", isAiActive && "opacity-50 cursor-not-allowed")}
                        placeholder="60"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </SmartHelp>
                </div>
              </div>

              {/* Advanced Settings Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedClimate(!showAdvancedClimate)}
                className="w-full justify-between text-xs text-muted-foreground hover:text-foreground h-8"
              >
                <span className="flex items-center gap-2">
                  <Settings2 className="w-3 h-3" />
                  {t('controls.advancedSettings', 'Розширені налаштування')}
                </span>
                {showAdvancedClimate ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>

              {/* Advanced: Hysteresis (Hidden by default) */}
              {showAdvancedClimate && (
                <div className="grid grid-cols-2 gap-2 animate-fade-in">
                  <div className="space-y-1">
                    <SmartHelp content={t('help.hysteresis')}>
                      <Label className="text-sm font-medium text-muted-foreground">
                        ± {t('controls.hysteresis')} (°C)
                      </Label>
                    </SmartHelp>
                    <div className="flex items-center gap-2">
                      <SmartHelp content={t('help.hysteresis')} isText={false}>
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            step="0.1"
                            value={tempHyst ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTempHyst(val === '' ? '' : Number(val));
                              setHasChanges(true);
                            }}
                            disabled={isAiActive}
                            className={cn("pr-12 h-10 bg-input", isAiActive && "opacity-50 cursor-not-allowed")}
                            placeholder="2"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            °C
                          </span>
                        </div>
                      </SmartHelp>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <SmartHelp content={t('help.hysteresis')}>
                      <Label className="text-sm font-medium text-muted-foreground">
                        ± {t('controls.hysteresis')} (%)
                      </Label>
                    </SmartHelp>
                    <div className="flex items-center gap-2">
                      <SmartHelp content={t('help.hysteresis')} isText={false}>
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            value={humHyst ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setHumHyst(val === '' ? '' : Number(val));
                              setHasChanges(true);
                            }}
                            min="0"
                            max="50"
                            disabled={isAiActive}
                            className={cn("pr-12 h-10 bg-input", isAiActive && "opacity-50 cursor-not-allowed")}
                            placeholder="5"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            %
                          </span>
                        </div>
                      </SmartHelp>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </CardContent>
        </Card>

        {/* Card C: Irrigation 💧 */}
        <Card className={cn(
          "gradient-card border-border/50 h-full flex flex-col",
          isPumpDryLock && "border-destructive/50"
        )}>
          <CardHeader className="pb-3 px-5 pt-5">
            <div className="flex items-center justify-between">
              <SmartHelp content={t('help.irrigationCard')}>
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <Droplets className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isPumpDryLock
                      ? "text-destructive animate-pulse drop-shadow-[0_0_8px_hsl(var(--destructive))]"
                      : relayStatus?.pump === 1 
                        ? "text-blue-400 animate-pulse drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]" 
                        : "text-muted-foreground"
                  )} />
                  {t('controls.irrigation')}
                  {isPumpDryLock ? (
                    <div className="flex items-center gap-1 ml-2">
                      <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
                      <span className="text-xs font-bold text-destructive uppercase">{t('controls.noWater')}</span>
                    </div>
                  ) : relayStatus?.pump === 1 ? (
                    <Badge variant="outline" className="ml-2 text-xs border-primary/50 text-primary">
                      {t('controls.active')}
                    </Badge>
                  ) : null}
                </CardTitle>
              </SmartHelp>
              {/* Pump: ON = pump_mode 0 (Auto), OFF = pump_mode 2 (Manual Off) */}
              <Switch
                checked={pumpMode === 0}
                onCheckedChange={(checked) => {
                  setPumpMode(checked ? 0 : 2);
                  setHasChanges(true);
                }}
                disabled={isAiActive}
                className={cn(
                  "data-[state=checked]:bg-primary",
                  isPumpDryLock && "data-[state=checked]:bg-destructive",
                  isAiActive && "opacity-50"
                )}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col px-5 pb-5 pt-0 space-y-4">
            {isAiActive && (
              <div className="flex items-center gap-1 text-xs text-yellow-600 pt-1">
                <Sparkles className="w-3 h-3" />
                <span>{t('controls.aiManagesIrrigation')}</span>
              </div>
            )}

            {/* Separator between toggle and Water Now */}
            <div className="border-t border-border/30 my-2" />

            {/* Large Force Water Button */}
            <SmartHelp content={t('help.waterNow')} isText={false}>
              <Button
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 h-10"
                onClick={handleWaterNow}
                disabled={isWatering || isPumpDryLock}
              >
                <Droplets className={cn("w-5 h-5 mr-2", isWatering && "animate-pulse")} />
                {isPumpDryLock ? t('controls.pumpDryLocked') : isWatering ? `${t('controls.watering')} (10 ${t('controls.seconds')})` : t('devices.waterNow')}
              </Button>
            </SmartHelp>

            {/* Irrigation Inputs - Main content area (grows to fill) */}
            <div className="flex-1 space-y-3 pt-2 border-t border-border/30">
              <div className="space-y-1">
                <SmartHelp content={t('help.soilMin')}>
                  <Label className="text-sm font-medium text-muted-foreground">
                    📉 {t('controls.soilMoistureMin')} %
                  </Label>
                </SmartHelp>
                <div className="flex items-center gap-2">
                  <SmartHelp content={t('help.soilMin')} isText={false}>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        value={soilMin ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSoilMin(v === '' ? '' as any : Number(v));
                          setHasChanges(true);
                        }}
                        min="0"
                        max="100"
                        disabled={isAiActive}
                        className={cn("pr-12 h-10 bg-input", isAiActive && "opacity-50")}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </SmartHelp>
                </div>
              </div>
              <div className="space-y-1">
                <SmartHelp content={t('help.soilMax')}>
                  <Label className="text-sm font-medium text-muted-foreground">
                    📈 {t('controls.soilMoistureMax')} %
                  </Label>
                </SmartHelp>
                <div className="flex items-center gap-2">
                  <SmartHelp content={t('help.soilMax')} isText={false}>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        value={soilMax ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSoilMax(v === '' ? '' as any : Number(v));
                          setHasChanges(true);
                        }}
                        min="0"
                        max="100"
                        disabled={isAiActive}
                        className={cn("pr-12 h-10 bg-input", isAiActive && "opacity-50")}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </SmartHelp>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card D: Ventilation 💨 */}
        <Card className="gradient-card border-border/50 h-full flex flex-col">
          <CardHeader className="pb-3 px-5 pt-5">
            <div className="flex items-center justify-between">
              <SmartHelp content={t('help.ventilationCard')}>
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <Wind className={cn(
                    "w-5 h-5 transition-all duration-300",
                    relayStatus?.vent === 1 
                      ? "text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]" 
                      : "text-muted-foreground"
                  )} />
                  {t('controls.ventilation')}
                  {relayStatus?.vent === 1 && (
                    <Badge variant="outline" className="ml-2 text-xs border-primary/50 text-primary">
                      {t('controls.active')}
                    </Badge>
                  )}
                </CardTitle>
              </SmartHelp>
              <Switch
                checked={ventMode === 1}
                onCheckedChange={(checked) => {
                  setVentMode(checked ? 1 : 0);
                  setHasChanges(true);
                }}
                disabled={isAiActive}
                className={cn(
                  "data-[state=checked]:bg-primary",
                  isAiActive && "opacity-50"
                )}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col px-5 pb-5 pt-0 space-y-4">
            {isAiActive && (
              <div className="flex items-center gap-1 text-xs text-yellow-600 pt-1">
                <Sparkles className="w-3 h-3" />
                <span>{t('controls.aiManagesVentilation')}</span>
              </div>
            )}

            {/* Ventilation Inputs - Main content area (grows to fill) */}
            <div className="flex-1 space-y-3 pt-2 border-t border-border/30">
              <div className="space-y-1">
                <SmartHelp content={t('help.ventDuration')}>
                  <Label className="text-sm font-medium text-muted-foreground">
                    ⏱️ {t('controls.workDuration')} ({t('controls.seconds')})
                  </Label>
                </SmartHelp>
                <div className="flex items-center gap-2">
                  <SmartHelp content={t('help.ventDuration')} isText={false}>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        value={ventDurationSec ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setVentDurationSec(v === '' ? '' as any : Number(v));
                          setHasChanges(true);
                        }}
                        min="0"
                        disabled={isAiActive}
                        className={cn("pr-12 h-10 bg-input", isAiActive && "opacity-50")}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {t('controls.seconds')}
                      </span>
                    </div>
                  </SmartHelp>
                </div>
              </div>
              <div className="space-y-1">
                <SmartHelp content={t('help.ventPause')}>
                  <Label className="text-sm font-medium text-muted-foreground">
                    ⏸️ {t('controls.pauseDuration')} ({t('controls.seconds')})
                  </Label>
                </SmartHelp>
                <div className="flex items-center gap-2">
                  <SmartHelp content={t('help.ventPause')} isText={false}>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        value={ventIntervalSec ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setVentIntervalSec(v === '' ? '' as any : Number(v));
                          setHasChanges(true);
                        }}
                        min="0"
                        disabled={isAiActive}
                        className={cn("pr-12 h-10 bg-input", isAiActive && "opacity-50")}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {t('controls.seconds')}
                      </span>
                    </div>
                  </SmartHelp>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Save Action Bar - Separate container OUTSIDE the grid */}
      <div className="mt-6 flex justify-end">
        <SmartHelp content={t('help.saveButton')} isText={false}>
          <Button 
            size="lg" 
            className="shadow-lg h-12 px-8" 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving}
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? t('controls.saving') : t('controls.saveConfiguration')}
          </Button>
        </SmartHelp>
      </div>

      {/* Mobile Fixed Save Bar - Only shows on mobile when there are changes */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border/50 z-50 lg:hidden">
          <Button 
            size="lg" 
            className="w-full shadow-lg h-12" 
            onClick={handleSave} 
            disabled={isSaving}
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? t('controls.saving') : t('controls.saveConfiguration')}
          </Button>
        </div>
      )}
    </div>
  );
}
