import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Leaf, Sparkles, Check, Plus, Loader2, Pencil, Sprout } from 'lucide-react';
import { usePlantData, PLANT_STAGES, getPresetsForStage, calculatePlantAge } from '@/hooks/usePlantData';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AddPlantDialog } from './AddPlantDialog';
import { useQuery } from '@tanstack/react-query';
import { EditPlantDialog } from './EditPlantDialog';
import { GreenhouseDrawer } from './GreenhouseDrawer';
import { Json } from '@/integrations/supabase/types';

interface GrowingParams {
  stages?: Array<{ name: string; days: number }>;
  environment_targets?: Array<{
    stage: string;
    temp_day?: number;
    temp_night?: number;
    humidity_min?: number;
    humidity_max?: number;
    vpd_target?: number;
  }>;
  [key: string]: unknown;
}

interface PlantHeaderProps {
  deviceId: string;
  deviceUuid: string; // The actual device_id (text) for settings
  currentSettings: any;
  onSettingsOptimized?: () => void;
}

export function PlantHeader({ deviceId, deviceUuid, currentSettings, onSettingsOptimized }: PlantHeaderProps) {
  const { plant, isLoading, updateStage, isUpdatingStage, refetch } = usePlantData(deviceId);
  const { isPremium } = usePremiumStatus();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [addPlantOpen, setAddPlantOpen] = useState(false);
  const [editPlantOpen, setEditPlantOpen] = useState(false);

  // Fetch growing_params from library_strains
  const { data: strainData } = useQuery({
    queryKey: ['strain-growing-params', plant?.strain_id],
    queryFn: async () => {
      if (!plant?.strain_id) return null;
      const { data, error } = await supabase
        .from('library_strains')
        .select('growing_params')
        .eq('id', plant.strain_id)
        .maybeSingle();
      if (error) return null;
      return data?.growing_params as GrowingParams | null;
    },
    enabled: !!plant?.strain_id,
  });

  // Get targets from growing_params.environment_targets
  const getEnvironmentTargets = useMemo(() => {
    if (!strainData?.environment_targets || !plant?.current_stage) return null;
    
    // Handle both array and object formats for environment_targets
    let targets = strainData.environment_targets;
    if (!Array.isArray(targets)) {
      if (typeof targets === 'object') {
        targets = Object.values(targets);
      } else {
        return null;
      }
    }
    
    const stageTarget = targets.find(
      (t: any) => t?.stage?.toLowerCase() === plant.current_stage?.toLowerCase()
    );
    
    if (!stageTarget) return null;
    
    return {
      temp: stageTarget.temp_day,
      hum: stageTarget.humidity_min !== undefined && stageTarget.humidity_max !== undefined
        ? Math.round((stageTarget.humidity_min + stageTarget.humidity_max) / 2)
        : undefined,
      vpd: stageTarget.vpd_target,
    };
  }, [strainData, plant?.current_stage]);

  if (isLoading) {
    return (
      <Card className="gradient-card border-border/50">
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state - no plant found
  if (!plant) {
    return (
      <>
        <Card className="gradient-card border-border/50 border-dashed">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Leaf className="h-8 w-8 text-accent" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">Немає активної рослини</p>
                <p className="text-sm text-muted-foreground">Додайте рослину для відстеження та AI-оптимізації</p>
              </div>
              <Button variant="outline" className="gap-2" onClick={() => setAddPlantOpen(true)}>
                <Plus className="h-4 w-4" />
                Посадити нову рослину
              </Button>
            </div>
          </CardContent>
        </Card>
        <AddPlantDialog
          open={addPlantOpen}
          onOpenChange={setAddPlantOpen}
          deviceId={deviceUuid}
          onPlantAdded={refetch}
        />
      </>
    );
  }

  const plantAge = calculatePlantAge(plant.start_date);
  
  // Try presets first, then fall back to environment_targets from growing_params
  const stagePresets = getPresetsForStage(plant.strain?.presets, plant.current_stage);
  const effectiveTargets = stagePresets || (getEnvironmentTargets ? {
    temp: getEnvironmentTargets.temp,
    hum: getEnvironmentTargets.hum,
    light_h: undefined, // environment_targets doesn't have light info
  } : null);
  
  // Has any target data available
  const hasTargetData = effectiveTargets && (effectiveTargets.temp !== undefined || effectiveTargets.hum !== undefined);

  // Check if current settings match the presets for this stage
  const settingsMatch = checkSettingsMatch(currentSettings, effectiveTargets);

  const handleOptimize = async () => {
    if (!effectiveTargets || !deviceUuid) return;

    setIsOptimizing(true);
    try {
      // Build the optimized settings object
      const optimizedSettings: Record<string, any> = { ...currentSettings };

      if (effectiveTargets.temp !== undefined) {
        optimizedSettings.target_temp = effectiveTargets.temp;
      }
      if (effectiveTargets.hum !== undefined) {
        optimizedSettings.target_hum = effectiveTargets.hum;
      }
      if (effectiveTargets.light_h !== undefined) {
        // Calculate light schedule based on hours
        // Default: start at 6:00, end based on light_h
        const lightHours = effectiveTargets.light_h;
        optimizedSettings.light_start_h = 6;
        optimizedSettings.light_start_m = 0;
        optimizedSettings.light_end_h = (6 + lightHours) % 24;
        optimizedSettings.light_end_m = 0;
        optimizedSettings.light_mode = 1; // AUTO mode
      }

      const { error } = await supabase
        .from('devices')
        .update({ settings: optimizedSettings })
        .eq('device_id', deviceUuid);

      if (error) throw error;

      toast({
        title: '✨ Оптимізовано!',
        description: `Налаштування застосовано для стадії "${getStageLabel(plant.current_stage)}"`,
      });

      onSettingsOptimized?.();
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <>
      <Card className="gradient-card border-border/50 overflow-hidden">
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left Section - Identity */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-accent/30">
                <AvatarImage src={plant.photo_url || undefined} alt={plant.custom_name || 'Plant'} />
                <AvatarFallback className="bg-accent/10">
                  <Leaf className="h-8 w-8 text-accent" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {plant.custom_name || 'Безіменна рослина'}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setEditPlantOpen(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {plant.strain && (
                  <p className="text-sm text-muted-foreground">{plant.strain.name}</p>
                )}
                <div className="flex items-center gap-2">
                  {plantAge !== null && (
                    <Badge variant="secondary" className="text-xs">
                      День {plantAge}
                    </Badge>
                  )}
                  {plant.is_main && (
                    <Badge variant="outline" className="text-xs text-accent border-accent/50">
                      Основна
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Section - Stage Display (Read-Only) */}
            <div className="flex flex-col items-start md:items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Поточна стадія</span>
              <Badge variant="outline" className="px-4 py-2 text-base font-medium capitalize">
                {getStageLabel(plant.current_stage)}
              </Badge>
            </div>

            {/* Right Section - AI Actions + Add More */}
            <div className="flex items-center gap-3">
              {hasTargetData ? (
                settingsMatch ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-500">Середовище оптимізовано</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleOptimize}
                    disabled={isOptimizing || !isPremium}
                    className={`gap-2 ${
                      isPremium
                        ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/50 hover:border-yellow-500/80 text-yellow-500 hover:text-yellow-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    variant="outline"
                  >
                    {isOptimizing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Оптимізувати для {getStageLabel(plant.current_stage)}
                    {!isPremium && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Premium
                      </Badge>
                    )}
                  </Button>
                )
              ) : (
                <div className="text-sm text-amber-500/80 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/30">
                  ⚠️ Немає пресету для стадії "{getStageLabel(plant.current_stage)}". Перевірте дані в Бібліотеці.
                </div>
              )}
              
              {/* Greenhouse Management Button */}
              <GreenhouseDrawer
                deviceId={deviceId}
                deviceUuid={deviceUuid}
                onPlantsChanged={refetch}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-accent/50 text-accent hover:bg-accent/10"
                >
                  <Sprout className="h-4 w-4" />
                  Мої рослини
                </Button>
              </GreenhouseDrawer>
              
              {/* Add More Plants Button */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-dashed border-accent/50 text-accent hover:bg-accent/10"
                onClick={() => setAddPlantOpen(true)}
                title="Додати ще рослину"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Presets Preview (if available) */}
          {effectiveTargets && !settingsMatch && (
            <div className="mt-4 pt-4 border-t border-border/30">
              <div className="flex items-center gap-6 text-sm">
                <span className="text-muted-foreground">Рекомендовані налаштування:</span>
                {effectiveTargets.temp !== undefined && (
                  <span className="text-orange-500">🌡️ {effectiveTargets.temp}°C</span>
                )}
                {effectiveTargets.hum !== undefined && (
                  <span className="text-blue-500">💧 {effectiveTargets.hum}%</span>
                )}
                {effectiveTargets.light_h !== undefined && (
                  <span className="text-yellow-500">☀️ {effectiveTargets.light_h}год світла</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Plant Dialog */}
      <AddPlantDialog
        open={addPlantOpen}
        onOpenChange={setAddPlantOpen}
        deviceId={deviceUuid}
        onPlantAdded={refetch}
      />

      {/* Edit Plant Dialog */}
      {plant && (
        <EditPlantDialog
          open={editPlantOpen}
          onOpenChange={setEditPlantOpen}
          plant={{
            id: plant.id,
            custom_name: plant.custom_name,
            start_date: plant.start_date,
          }}
          onPlantUpdated={refetch}
          onPlantDeleted={refetch}
        />
      )}
    </>
  );
}

// Helper to check if current settings match presets
function checkSettingsMatch(
  settings: any,
  presets: { temp?: number; hum?: number; light_h?: number } | null
): boolean {
  if (!settings || !presets) return false;

  const tempMatch = presets.temp === undefined || settings.target_temp === presets.temp;
  const humMatch = presets.hum === undefined || settings.target_hum === presets.hum;
  
  // For light, check if the photoperiod matches
  let lightMatch = true;
  if (presets.light_h !== undefined) {
    const startH = settings.light_start_h ?? 6;
    const endH = settings.light_end_h ?? 22;
    const currentLightHours = endH > startH ? endH - startH : 24 - startH + endH;
    lightMatch = currentLightHours === presets.light_h;
  }

  return tempMatch && humMatch && lightMatch;
}

// Helper to get stage label
function getStageLabel(stage: string | null): string {
  const found = PLANT_STAGES.find((s) => s.value === stage);
  return found?.label || stage || 'Невідомо';
}
