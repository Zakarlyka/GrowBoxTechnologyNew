import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GrowingParams, GrowingStage } from './usePlantsWithStrains';
import { format, subDays, differenceInDays } from 'date-fns';

// =============================================================================
// TYPES
// =============================================================================

export interface StageDefinition {
  name: string;
  durationDays: number;
  startDay: number; // Cumulative start day from lifecycle beginning
  endDay: number;   // Cumulative end day
}

export interface CalculatedStage {
  stageName: string;
  normalizedName: string;
  dayInStage: number;
  stageDuration: number;
  totalAge: number;
  isOverdue: boolean; // If we're past the expected duration
}

// =============================================================================
// STAGE NORMALIZATION
// =============================================================================

/**
 * Normalize stage name to standard format (lowercase, canonical)
 */
export function normalizeStageNameForDB(stageName: string): string {
  const name = stageName.toLowerCase().trim();
  
  const normalizeMap: Record<string, string> = {
    // Seedling variants
    'seedling': 'seedling',
    'seed': 'seedling',
    'germination': 'seedling',
    'sprouting': 'seedling',
    
    // Vegetation variants
    'vegetation': 'vegetation',
    'vegetative': 'vegetation',
    'veg': 'vegetation',
    'grow': 'vegetation',
    'growing': 'vegetation',
    
    // Pre-flowering
    'pre-flowering': 'pre-flowering',
    'preflowering': 'pre-flowering',
    'pre-flower': 'pre-flowering',
    'preflower': 'pre-flowering',
    'stretch': 'pre-flowering',
    
    // Flowering variants
    'flowering': 'flowering',
    'flower': 'flowering',
    'bloom': 'flowering',
    'blooming': 'flowering',
    
    // Ripening/Flushing
    'ripening': 'flushing',
    'flushing': 'flushing',
    'flush': 'flushing',
    'late-flowering': 'flushing',
    
    // Drying
    'drying': 'drying',
    'dry': 'drying',
    'curing': 'drying',
    'cure': 'drying',
    
    // Harvested
    'harvested': 'harvested',
    'harvest': 'harvested',
    'done': 'harvested',
  };
  
  return normalizeMap[name] || name;
}

/**
 * Get stage duration in days from GrowingStage object
 */
export function getStageDurationDays(stage: GrowingStage): number {
  // Priority: days_duration > days > weeks_duration > weeks (parsed)
  if (stage.days_duration && stage.days_duration > 0) return stage.days_duration;
  if (stage.days && stage.days > 0) return stage.days;
  if (stage.weeks_duration && stage.weeks_duration > 0) return stage.weeks_duration * 7;
  
  if (stage.weeks) {
    // Parse "1-2" or "2" format, take average
    const match = stage.weeks.match(/(\d+)(?:-(\d+))?/);
    if (match) {
      const start = parseInt(match[1]);
      const end = match[2] ? parseInt(match[2]) : start;
      return Math.round(((start + end) / 2) * 7);
    }
  }
  
  return 7; // Default 1 week if nothing found
}

/**
 * Build stage definitions with cumulative days from growing_params
 */
export function buildStageDefinitions(growingParams: GrowingParams | null): StageDefinition[] {
  if (!growingParams?.stages || growingParams.stages.length === 0) {
    // Return default stages if none defined
    return [
      { name: 'Seedling', durationDays: 14, startDay: 0, endDay: 14 },
      { name: 'Vegetation', durationDays: 28, startDay: 14, endDay: 42 },
      { name: 'Flowering', durationDays: 56, startDay: 42, endDay: 98 },
      { name: 'Flushing', durationDays: 14, startDay: 98, endDay: 112 },
    ];
  }
  
  const definitions: StageDefinition[] = [];
  let cumulativeDays = 0;
  
  for (const stage of growingParams.stages) {
    const duration = getStageDurationDays(stage);
    definitions.push({
      name: stage.name,
      durationDays: duration,
      startDay: cumulativeDays,
      endDay: cumulativeDays + duration,
    });
    cumulativeDays += duration;
  }
  
  return definitions;
}

// =============================================================================
// CORE CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate the current stage based on plant age and strain timeline
 * This is the CORE function that determines what stage a plant should be in
 * 
 * CRITICAL: When a plant exceeds a stage's duration, it MUST roll over
 * to the next stage. "Flowering Day 53/47" should become "Flushing Day 6".
 */
export function calculateStageFromAge(
  startDate: string | null,
  growingParams: GrowingParams | null
): CalculatedStage | null {
  if (!startDate) return null;
  
  const start = new Date(startDate);
  const now = new Date();
  const totalAge = differenceInDays(now, start);
  
  if (totalAge < 0) return null; // Future date
  
  const stages = buildStageDefinitions(growingParams);
  
  console.log(`[calculateStageFromAge] Plant age: ${totalAge} days, checking ${stages.length} stages`);
  
  // Find which stage we're in based on cumulative days
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    
    // Check if current day falls within this stage's range
    if (totalAge >= stage.startDay && totalAge < stage.endDay) {
      const result = {
        stageName: stage.name,
        normalizedName: normalizeStageNameForDB(stage.name),
        dayInStage: totalAge - stage.startDay + 1, // Day 1 is first day
        stageDuration: stage.durationDays,
        totalAge,
        isOverdue: false,
      };
      console.log(`[calculateStageFromAge] In stage "${stage.name}": Day ${result.dayInStage}/${stage.durationDays}`);
      return result;
    }
  }
  
  // Past ALL stages - plant has completed its lifecycle
  // Return the last stage as "overdue" or could be "harvested"
  const lastStage = stages[stages.length - 1];
  if (lastStage && totalAge >= lastStage.endDay) {
    // Calculate how many days past the lifecycle
    const daysOverdue = totalAge - lastStage.endDay + 1;
    
    console.log(`[calculateStageFromAge] OVERDUE: Past all stages by ${daysOverdue} days. Total lifecycle was ${lastStage.endDay} days.`);
    
    // If significantly overdue, suggest harvest
    return {
      stageName: 'Harvested',
      normalizedName: 'harvested',
      dayInStage: daysOverdue,
      stageDuration: 1, // No expected duration for harvest
      totalAge,
      isOverdue: true,
    };
  }
  
  // Fallback
  console.log(`[calculateStageFromAge] Could not determine stage for age ${totalAge}`);
  return null;
}

/**
 * Calculate what the start_date should be if user manually sets a specific stage
 * This allows "forcing" a stage change by adjusting the start date
 */
export function calculateStartDateForStage(
  targetStage: string,
  dayInStage: number, // Usually 1 when forcing a stage
  growingParams: GrowingParams | null
): Date {
  const stages = buildStageDefinitions(growingParams);
  const normalizedTarget = normalizeStageNameForDB(targetStage);
  
  // Find the target stage
  let targetStartDay = 0;
  for (const stage of stages) {
    if (normalizeStageNameForDB(stage.name) === normalizedTarget) {
      targetStartDay = stage.startDay;
      break;
    }
  }
  
  // Calculate: Today should be (targetStartDay + dayInStage - 1) days after start
  const totalDaysFromStart = targetStartDay + (dayInStage - 1);
  return subDays(new Date(), totalDaysFromStart);
}

/**
 * Determine the initial stage when adding a new plant
 * Based on the planting date and strain's growing timeline
 */
export function calculateInitialStage(
  startDate: Date,
  growingParams: GrowingParams | null
): string {
  const result = calculateStageFromAge(
    format(startDate, 'yyyy-MM-dd'),
    growingParams
  );
  
  return result?.normalizedName || 'seedling';
}

// =============================================================================
// AUTO-TRANSITION HOOK
// =============================================================================

interface PlantForTransition {
  id: string;
  current_stage: string | null;
  start_date: string | null;
  strain_id: number | null;
  growing_params?: GrowingParams | null;
}

/**
 * Hook that checks and auto-updates plant stages on mount
 * Should be used in Dashboard or app-level component
 */
export function useAutoStageTransition(plants: PlantForTransition[]) {
  const queryClient = useQueryClient();
  
  const updateStageMutation = useMutation({
    mutationFn: async ({ plantId, newStage }: { plantId: string; newStage: string }) => {
      const { error } = await supabase
        .from('plants')
        .update({ current_stage: newStage })
        .eq('id', plantId);
      
      if (error) throw error;
      return { plantId, newStage };
    },
    onSuccess: ({ plantId, newStage }) => {
      console.log(`[AutoTransition] Updated plant ${plantId} to stage: ${newStage}`);
    },
  });
  
  useEffect(() => {
    if (!plants || plants.length === 0) return;
    
    const checkAndUpdate = async () => {
      for (const plant of plants) {
        if (!plant.start_date || !plant.id) continue;
        
        // Skip harvested plants
        if (plant.current_stage?.toLowerCase() === 'harvested') continue;
        
        const calculated = calculateStageFromAge(
          plant.start_date,
          plant.growing_params || null
        );
        
        if (!calculated) continue;
        
        const currentNormalized = normalizeStageNameForDB(plant.current_stage || '');
        
        // If calculated stage is different from stored stage, update
        if (calculated.normalizedName !== currentNormalized) {
          console.log(
            `[AutoTransition] Plant "${plant.id}" should be in "${calculated.normalizedName}" ` +
            `(day ${calculated.dayInStage}/${calculated.stageDuration}) but is in "${currentNormalized}"`
          );
          
          updateStageMutation.mutate({
            plantId: plant.id,
            newStage: calculated.normalizedName,
          });
        }
      }
    };
    
    checkAndUpdate();
  }, [plants]);
  
  // Invalidate queries when mutations complete
  useEffect(() => {
    if (updateStageMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['plants-with-strains'] });
      queryClient.invalidateQueries({ queryKey: ['main-plant'] });
      queryClient.invalidateQueries({ queryKey: ['active-plants'] });
    }
  }, [updateStageMutation.isSuccess, queryClient]);
  
  return {
    isUpdating: updateStageMutation.isPending,
  };
}

// =============================================================================
// MANUAL STAGE OVERRIDE HOOK
// =============================================================================

/**
 * Hook for manually overriding a plant's stage
 * This recalculates the start_date to align with the new stage
 */
export function useStageOverride() {
  const queryClient = useQueryClient();
  
  const overrideMutation = useMutation({
    mutationFn: async ({
      plantId,
      newStage,
      growingParams,
      dayInStage = 1,
    }: {
      plantId: string;
      newStage: string;
      growingParams: GrowingParams | null;
      dayInStage?: number;
    }) => {
      const normalizedStage = normalizeStageNameForDB(newStage);
      const newStartDate = calculateStartDateForStage(newStage, dayInStage, growingParams);
      
      console.log(
        `[StageOverride] Setting plant ${plantId} to stage "${normalizedStage}" ` +
        `(Day ${dayInStage}), recalculating start_date to ${format(newStartDate, 'yyyy-MM-dd')}`
      );
      
      const { error } = await supabase
        .from('plants')
        .update({
          current_stage: normalizedStage,
          start_date: format(newStartDate, 'yyyy-MM-dd'),
        })
        .eq('id', plantId);
      
      if (error) throw error;
      return { plantId, newStage: normalizedStage, newStartDate };
    },
    onSuccess: ({ newStage }) => {
      queryClient.invalidateQueries({ queryKey: ['plants-with-strains'] });
      queryClient.invalidateQueries({ queryKey: ['main-plant'] });
      queryClient.invalidateQueries({ queryKey: ['active-plants'] });
      
      toast.success(`Stage changed to ${newStage}`, {
        description: 'Plant timeline has been recalculated',
      });
    },
    onError: (error) => {
      toast.error('Failed to update stage', {
        description: error.message,
      });
    },
  });
  
  return {
    overrideStage: overrideMutation.mutate,
    isOverriding: overrideMutation.isPending,
  };
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Get formatted stage display info
 */
export function getStageDisplayInfo(
  startDate: string | null,
  currentStage: string | null,
  growingParams: GrowingParams | null
): {
  stageName: string;
  dayLabel: string;
  progress: number;
  isOverdue: boolean;
} {
  const calculated = calculateStageFromAge(startDate, growingParams);
  
  if (!calculated) {
    return {
      stageName: currentStage || 'Unknown',
      dayLabel: 'Day ?',
      progress: 0,
      isOverdue: false,
    };
  }
  
  const progress = Math.min(
    Math.round((calculated.dayInStage / calculated.stageDuration) * 100),
    100
  );
  
  return {
    stageName: calculated.stageName,
    dayLabel: `Day ${calculated.dayInStage}/${calculated.stageDuration}`,
    progress,
    isOverdue: calculated.isOverdue,
  };
}
