import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { calculatePlantAge } from './usePlantData';

// =============================================================================
// TYPES
// =============================================================================

export interface GrowingStage {
  name: string;
  days?: number;
  days_duration?: number;
  weeks?: string;
  weeks_duration?: number;
}

export interface EnvironmentTarget {
  stage: string;
  temp_day?: number;
  temp_night?: number;
  humidity_min?: number;
  humidity_max?: number;
  vpd_target?: number;
  light_hours?: number;
}

export interface TimelineAlert {
  trigger_stage: string;
  day_offset: number;
  message: string;
  type?: string;
}

export interface LifecycleEstimate {
  total_days?: number;
  flowering_start_day?: number;
}

export interface GrowingParams {
  stages?: GrowingStage[];
  environment_targets?: EnvironmentTarget[] | Record<string, EnvironmentTarget>;
  timeline_alerts?: TimelineAlert[];
  lifecycle_estimates?: LifecycleEstimate;
  nutrition_profile?: { feeder_type?: string };
  morphology?: { stretch_ratio?: number };
  resistance_rating?: { mold?: number; pests?: number; heat?: number; cold?: number };
  [key: string]: unknown;
}

export interface PlantWithStrain {
  id: string;
  custom_name: string | null;
  current_stage: string | null;
  start_date: string | null;
  is_main: boolean | null;
  strain_id: number | null;
  device_id: string | null;
  photo_url: string | null;
  notes: string | null;
  strain_name: string | null;
  strain_photo_url: string | null;
  flowering_days: number | null;
  growing_params: GrowingParams | null;
  device?: {
    id: string;
    name: string;
  } | null;
}

export interface CalculatedTargets {
  temp: number;
  humidity: number;
  vpd: number;
  light_hours?: number;
  stageName: string;
}

export interface NextAlert {
  message: string;
  daysUntil: number;
  type: string;
}

export interface StageInfo {
  stageName: string;
  dayInStage: number;
  stageDuration: number;
  stageStartDay: number;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Safely get environment_targets as an array (handles both array and object formats)
 */
export function normalizeEnvironmentTargets(targets: EnvironmentTarget[] | Record<string, EnvironmentTarget> | null | undefined): EnvironmentTarget[] {
  if (!targets) return [];
  if (Array.isArray(targets)) return targets;
  if (typeof targets === 'object') {
    return Object.values(targets).filter(t => t && typeof t === 'object');
  }
  return [];
}

/**
 * Get stage duration in days (handles multiple formats)
 */
function getStageDays(stage: GrowingStage): number {
  if (stage.days_duration) return stage.days_duration;
  if (stage.days) return stage.days;
  if (stage.weeks_duration) return stage.weeks_duration * 7;
  if (stage.weeks) {
    // Parse "1-2" or "2" format
    const match = stage.weeks.match(/(\d+)(?:-(\d+))?/);
    if (match) {
      const start = parseInt(match[1]);
      const end = match[2] ? parseInt(match[2]) : start;
      return Math.round(((start + end) / 2) * 7);
    }
  }
  return 7; // Default 1 week
}

/**
 * Calculate current stage info based on plant age and growing params
 */
export function calculateStageInfo(startDate: string | null, growingParams: GrowingParams | null): StageInfo | null {
  if (!startDate || !growingParams?.stages || growingParams.stages.length === 0) return null;
  
  const age = calculatePlantAge(startDate);
  if (age === null) return null;

  let cumulativeDays = 0;
  for (const stage of growingParams.stages) {
    const stageDays = getStageDays(stage);
    if (age < cumulativeDays + stageDays) {
      return {
        stageName: stage.name.toLowerCase(),
        dayInStage: age - cumulativeDays,
        stageDuration: stageDays,
        stageStartDay: cumulativeDays,
      };
    }
    cumulativeDays += stageDays;
  }

  // Past all stages - return last stage
  const lastStage = growingParams.stages[growingParams.stages.length - 1];
  const lastStageDays = getStageDays(lastStage);
  return {
    stageName: lastStage.name.toLowerCase(),
    dayInStage: age - (cumulativeDays - lastStageDays),
    stageDuration: lastStageDays,
    stageStartDay: cumulativeDays - lastStageDays,
  };
}

/**
 * Get environment targets for a specific stage
 */
export function getEnvironmentTargets(growingParams: GrowingParams | null, stageName: string | null): CalculatedTargets | null {
  if (!growingParams || !stageName) return null;
  
  const targets = normalizeEnvironmentTargets(growingParams.environment_targets);
  if (targets.length === 0) return null;

  // Find matching target (case-insensitive)
  const stageKey = stageName.toLowerCase();
  const stageTarget = targets.find(t => {
    const targetStage = t?.stage?.toLowerCase() || '';
    return targetStage === stageKey || 
           targetStage.includes(stageKey) || 
           stageKey.includes(targetStage);
  });

  if (!stageTarget) return null;

  const avgTemp = stageTarget.temp_day 
    ? (stageTarget.temp_night ? (stageTarget.temp_day + stageTarget.temp_night) / 2 : stageTarget.temp_day)
    : 24;
  
  const avgHumidity = stageTarget.humidity_min !== undefined && stageTarget.humidity_max !== undefined
    ? (stageTarget.humidity_min + stageTarget.humidity_max) / 2
    : 60;

  return {
    temp: Math.round(avgTemp),
    humidity: Math.round(avgHumidity),
    vpd: stageTarget.vpd_target || 1.0,
    light_hours: stageTarget.light_hours,
    stageName,
  };
}

/**
 * Calculate next upcoming alert
 */
export function getNextAlert(startDate: string | null, growingParams: GrowingParams | null): NextAlert | null {
  if (!startDate || !growingParams?.timeline_alerts || !growingParams?.stages) return null;

  const age = calculatePlantAge(startDate);
  if (age === null) return null;

  // Build stage start days map
  const stageStartDays: Record<string, number> = {};
  let cumulativeDays = 0;
  for (const stage of growingParams.stages) {
    stageStartDays[stage.name.toLowerCase()] = cumulativeDays;
    cumulativeDays += getStageDays(stage);
  }

  // Find upcoming alerts
  const alertsWithDays = growingParams.timeline_alerts
    .map(alert => {
      const stageKey = alert.trigger_stage?.toLowerCase() || '';
      const stageStart = stageStartDays[stageKey] ?? 0;
      const absoluteDay = stageStart + (alert.day_offset || 0);
      return { ...alert, absoluteDay };
    })
    .filter(alert => alert.absoluteDay > age)
    .sort((a, b) => a.absoluteDay - b.absoluteDay);

  if (alertsWithDays.length === 0) return null;

  const nextAlert = alertsWithDays[0];
  return {
    message: nextAlert.message,
    daysUntil: nextAlert.absoluteDay - age,
    type: nextAlert.type || 'info',
  };
}

/**
 * Calculate lifecycle progress
 */
export function calculateProgress(startDate: string | null, totalDays: number | null): { percentage: number; currentDay: number; totalDays: number } | null {
  if (!startDate || !totalDays) return null;
  const age = calculatePlantAge(startDate);
  if (age === null) return null;
  const percentage = Math.min(Math.round((age / totalDays) * 100), 100);
  return { percentage, currentDay: age, totalDays };
}

/**
 * Get total lifecycle days from growing_params
 */
export function getTotalLifecycleDays(growingParams: GrowingParams | null, floweringDays: number | null): number | null {
  if (growingParams?.lifecycle_estimates?.total_days) {
    return growingParams.lifecycle_estimates.total_days;
  }
  if (growingParams?.stages) {
    return growingParams.stages.reduce((sum, stage) => sum + getStageDays(stage), 0);
  }
  return floweringDays;
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function usePlantsWithStrains(options?: { excludeHarvested?: boolean }) {
  const queryClient = useQueryClient();
  const { excludeHarvested = true } = options || {};

  const query = useQuery({
    queryKey: ['plants-with-strains', excludeHarvested],
    queryFn: async (): Promise<PlantWithStrain[]> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      // Query with join to library_strains
      let queryBuilder = supabase
        .from('plants')
        .select(`
          id,
          custom_name,
          current_stage,
          start_date,
          is_main,
          strain_id,
          device_id,
          photo_url,
          notes,
          library_strains (
            name,
            photo_url,
            flowering_days,
            growing_params
          )
        `)
        .eq('user_id', userData.user.id)
        .order('is_main', { ascending: false })
        .order('created_at', { ascending: false });

      if (excludeHarvested) {
        queryBuilder = queryBuilder.neq('current_stage', 'harvested');
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error fetching plants:', error);
        return [];
      }

      // Transform and fetch device names
      const plantsWithDevices = await Promise.all(
        (data || []).map(async (plant) => {
          // Fetch device if device_id exists
          let device = null;
          if (plant.device_id) {
            const { data: deviceData } = await supabase
              .from('devices')
              .select('id, name')
              .eq('device_id', plant.device_id)
              .maybeSingle();
            device = deviceData;
          }

          const strainData = plant.library_strains as {
            name: string;
            photo_url: string | null;
            flowering_days: number | null;
            growing_params: Json | null;
          } | null;

          return {
            id: plant.id,
            custom_name: plant.custom_name,
            current_stage: plant.current_stage,
            start_date: plant.start_date,
            is_main: plant.is_main,
            strain_id: plant.strain_id,
            device_id: plant.device_id,
            photo_url: plant.photo_url,
            notes: plant.notes,
            strain_name: strainData?.name || null,
            strain_photo_url: strainData?.photo_url || null,
            flowering_days: strainData?.flowering_days || null,
            growing_params: strainData?.growing_params as GrowingParams | null,
            device,
          };
        })
      );

      return plantsWithDevices;
    },
  });

  // Mutation to set a plant as master
  const setMasterMutation = useMutation({
    mutationFn: async (plantId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // First, unset all plants as main
      await supabase
        .from('plants')
        .update({ is_main: false })
        .eq('user_id', userData.user.id);

      // Set the selected plant as main
      const { error } = await supabase
        .from('plants')
        .update({ is_main: true })
        .eq('id', plantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants-with-strains'] });
      queryClient.invalidateQueries({ queryKey: ['main-plant'] });
      queryClient.invalidateQueries({ queryKey: ['master-plants'] });
      queryClient.invalidateQueries({ queryKey: ['active-plants'] });
      toast.success('Master plant updated');
    },
    onError: () => {
      toast.error('Failed to update master plant');
    },
  });

  // Derived data
  const masterPlant = query.data?.find(p => p.is_main) || query.data?.[0] || null;
  const neighborPlants = query.data?.filter(p => p.id !== masterPlant?.id) || [];

  return {
    plants: query.data || [],
    masterPlant,
    neighborPlants,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    setMaster: setMasterMutation.mutate,
    isSettingMaster: setMasterMutation.isPending,
  };
}
