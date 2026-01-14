import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DeviceSettings } from '@/types';
import { Json } from '@/integrations/supabase/types';

// =============================================================================
// TYPES
// =============================================================================

interface EnvironmentTarget {
  stage?: string;
  temp_day?: number;
  temp_night?: number;
  humidity_min?: number;
  humidity_max?: number;
  rh?: number;
  vpd_target?: number;
  vpd_range?: string;
  light_hours?: number;
  duration_days?: number;
}

interface GrowingParams {
  environment_targets?: EnvironmentTarget[] | Record<string, EnvironmentTarget>;
  optimal_environments?: Record<string, EnvironmentTarget>;
  stages?: Array<{ name: string; days?: number }>;
  [key: string]: unknown;
}

interface MasterPlantData {
  id: string;
  current_stage: string | null;
  device_id: string | null;
  strain_name: string | null;
  growing_params: GrowingParams | null;
}

interface AutoPilotTargets {
  targetTemp: number;
  targetHum: number;
  lightHours: number;
  lightStartH: number;
  lightEndH: number;
  stageName: string;
  vpdTarget: number | null;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Normalize stage name for matching (lowercase, trim, handle variations)
 */
function normalizeStage(stage: string | null | undefined): string {
  if (!stage) return '';
  const s = stage.toLowerCase().trim();
  
  // Handle common variations
  const stageMap: Record<string, string> = {
    'veg': 'vegetation',
    'vegetative': 'vegetation',
    'bloom': 'flowering',
    'flower': 'flowering',
    'seed': 'seedling',
    'germination': 'seedling',
  };
  
  return stageMap[s] || s;
}

/**
 * Extract environment targets for a specific stage from growing_params
 * Handles both array and object formats
 */
function extractStageTargets(
  growingParams: GrowingParams | null,
  stageName: string | null
): EnvironmentTarget | null {
  if (!growingParams || !stageName) return null;
  
  const normalizedStage = normalizeStage(stageName);
  
  // Priority 1: Check optimal_environments (new schema from AI import)
  if (growingParams.optimal_environments) {
    const envs = growingParams.optimal_environments;
    
    // Direct match
    if (envs[normalizedStage]) return envs[normalizedStage];
    if (envs[stageName]) return envs[stageName];
    
    // Fuzzy match
    for (const [key, value] of Object.entries(envs)) {
      const normalizedKey = normalizeStage(key);
      if (normalizedKey === normalizedStage || 
          normalizedKey.includes(normalizedStage) || 
          normalizedStage.includes(normalizedKey)) {
        return value;
      }
    }
  }
  
  // Priority 2: Check environment_targets (older schema)
  if (growingParams.environment_targets) {
    const targets = growingParams.environment_targets;
    
    // Array format
    if (Array.isArray(targets)) {
      const match = targets.find(t => {
        const targetStage = normalizeStage(t?.stage);
        return targetStage === normalizedStage || 
               targetStage.includes(normalizedStage) || 
               normalizedStage.includes(targetStage);
      });
      if (match) return match;
    }
    
    // Object format
    if (typeof targets === 'object' && !Array.isArray(targets)) {
      const objTargets = targets as Record<string, EnvironmentTarget>;
      if (objTargets[normalizedStage]) return objTargets[normalizedStage];
      if (objTargets[stageName]) return objTargets[stageName];
      
      for (const [key, value] of Object.entries(objTargets)) {
        const normalizedKey = normalizeStage(key);
        if (normalizedKey === normalizedStage || 
            normalizedKey.includes(normalizedStage) || 
            normalizedStage.includes(normalizedKey)) {
          return value;
        }
      }
    }
  }
  
  return null;
}

/**
 * Convert environment target to autopilot settings
 */
function calculateAutoPilotTargets(
  stageTarget: EnvironmentTarget,
  stageName: string
): AutoPilotTargets {
  // Temperature: prefer temp_day, fallback to average of day/night
  const tempDay = stageTarget.temp_day ?? 24;
  const tempNight = stageTarget.temp_night ?? tempDay - 2;
  const targetTemp = Math.round((tempDay + tempNight) / 2);
  
  // Humidity: prefer rh, then average of min/max, then fallback
  let targetHum: number;
  if (stageTarget.rh !== undefined) {
    targetHum = stageTarget.rh;
  } else if (stageTarget.humidity_min !== undefined && stageTarget.humidity_max !== undefined) {
    targetHum = Math.round((stageTarget.humidity_min + stageTarget.humidity_max) / 2);
  } else {
    // Stage-based defaults
    const humDefaults: Record<string, number> = {
      seedling: 70,
      vegetation: 60,
      flowering: 45,
    };
    targetHum = humDefaults[normalizeStage(stageName)] ?? 55;
  }
  
  // Light hours: use stage value or stage-based defaults
  let lightHours: number;
  if (stageTarget.light_hours !== undefined) {
    lightHours = stageTarget.light_hours;
  } else {
    const lightDefaults: Record<string, number> = {
      seedling: 18,
      vegetation: 18,
      flowering: 12,
    };
    lightHours = lightDefaults[normalizeStage(stageName)] ?? 18;
  }
  
  // Calculate light schedule (6 AM start)
  const lightStartH = 6;
  const lightEndH = (lightStartH + lightHours) % 24;
  
  // VPD target
  let vpdTarget: number | null = null;
  if (stageTarget.vpd_target !== undefined) {
    vpdTarget = stageTarget.vpd_target;
  } else if (stageTarget.vpd_range) {
    // Parse "0.8-1.1" format
    const match = stageTarget.vpd_range.match(/([\d.]+)-([\d.]+)/);
    if (match) {
      vpdTarget = (parseFloat(match[1]) + parseFloat(match[2])) / 2;
    }
  }
  
  return {
    targetTemp,
    targetHum,
    lightHours,
    lightStartH,
    lightEndH,
    stageName,
    vpdTarget,
  };
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Auto-Pilot Hook - The "Brain" of AI Mode
 * 
 * When ai_mode === 1, this hook:
 * 1. Fetches the Master Plant (is_main = true) for the current device
 * 2. Uses the plant's current_stage (NOT calculated from start_date)
 * 3. Extracts environment targets from strain's growing_params
 * 4. Updates device settings when targets change
 * 5. Subscribes to real-time changes in plants table
 */
export function useAutoPilot(
  deviceId: string | null,
  isAiActive: boolean,
  currentSettings: DeviceSettings | null
) {
  const lastAppliedRef = useRef<string>('');
  const isApplyingRef = useRef<boolean>(false);

  /**
   * Core function: Fetch master plant and apply settings
   */
  const calculateAndApply = useCallback(async (triggerSource: string) => {
    if (!deviceId || !isAiActive) {
      console.log('AutoPilot: Skipping - AI inactive or no device');
      return;
    }

    if (isApplyingRef.current) {
      console.log('AutoPilot: Skipping - already applying');
      return;
    }

    try {
      isApplyingRef.current = true;
      console.log(`AutoPilot: Triggered by ${triggerSource}`);

      // Step 1: Get authenticated user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.log('AutoPilot: No authenticated user');
        return;
      }

      // Step 2: Fetch Master Plant for this device
      // plants.device_id stores the device_id string (not UUID)
      const { data: masterPlant, error: plantError } = await supabase
        .from('plants')
        .select(`
          id,
          current_stage,
          device_id,
          library_strains (
            name,
            growing_params
          )
        `)
        .eq('user_id', userData.user.id)
        .eq('is_main', true)
        .eq('device_id', deviceId)
        .maybeSingle();

      if (plantError) {
        console.error('AutoPilot: Error fetching master plant:', plantError);
        return;
      }

      if (!masterPlant) {
        console.log('AutoPilot: No master plant found for device:', deviceId);
        // Could apply defaults here, but for now just return
        return;
      }

      // Step 3: Extract strain data
      const strainData = masterPlant.library_strains as {
        name: string;
        growing_params: Json | null;
      } | null;

      if (!strainData?.growing_params) {
        console.log('AutoPilot: No growing_params in strain data');
        return;
      }

      const growingParams = strainData.growing_params as GrowingParams;
      const currentStage = masterPlant.current_stage;

      if (!currentStage) {
        console.log('AutoPilot: Plant has no current_stage set');
        return;
      }

      // Step 4: Extract environment targets for current stage
      const stageTarget = extractStageTargets(growingParams, currentStage);

      if (!stageTarget) {
        console.log('AutoPilot: No targets found for stage:', currentStage);
        console.log('AutoPilot: Available data:', JSON.stringify(growingParams, null, 2).slice(0, 500));
        return;
      }

      // Step 5: Calculate autopilot settings
      const targets = calculateAutoPilotTargets(stageTarget, currentStage);

      console.log('AutoPilot: Calculated targets:', {
        strain: strainData.name,
        stage: currentStage,
        ...targets,
      });

      // Step 6: Create fingerprint to avoid duplicate updates
      const fingerprint = JSON.stringify({
        temp: targets.targetTemp,
        hum: targets.targetHum,
        lightStart: targets.lightStartH,
        lightEnd: targets.lightEndH,
        stage: targets.stageName,
      });

      if (fingerprint === lastAppliedRef.current) {
        console.log('AutoPilot: Settings unchanged, skipping update');
        return;
      }

      // Step 7: Check if device settings need updating
      const needsUpdate =
        currentSettings?.target_temp !== targets.targetTemp ||
        currentSettings?.target_hum !== targets.targetHum ||
        currentSettings?.light_start_h !== targets.lightStartH ||
        currentSettings?.light_end_h !== targets.lightEndH;

      if (!needsUpdate) {
        lastAppliedRef.current = fingerprint;
        console.log('AutoPilot: Device already has correct settings');
        return;
      }

      // Step 8: Apply settings to device
      console.log('AutoPilot: Applying new settings for stage:', currentStage);

      const { error: updateError } = await supabase
        .from('devices')
        .update({
          settings: {
            ...currentSettings,
            // Climate targets
            target_temp: targets.targetTemp,
            target_hum: targets.targetHum,
            climate_mode: 1, // Ensure climate is ON
            // Light schedule
            light_mode: 1, // Ensure light is ON
            light_start_h: targets.lightStartH,
            light_start_m: 0,
            light_end_h: targets.lightEndH,
            light_end_m: 0,
            // Keep AI mode on
            ai_mode: 1,
          },
        })
        .eq('device_id', deviceId);

      if (updateError) {
        console.error('AutoPilot: Error updating settings:', updateError);
        toast.error('AI Pilot: Помилка оновлення налаштувань');
        return;
      }

      lastAppliedRef.current = fingerprint;
      
      toast.success(
        `🤖 AI Pilot: ${strainData.name} → ${currentStage} — ${targets.targetTemp}°C, ${targets.targetHum}% RH, ${targets.lightHours}h світла`,
        { duration: 5000 }
      );

    } catch (error) {
      console.error('AutoPilot: Unexpected error:', error);
    } finally {
      isApplyingRef.current = false;
    }
  }, [deviceId, isAiActive, currentSettings]);

  // ==========================================================================
  // EFFECT: Initial calculation + interval
  // ==========================================================================
  useEffect(() => {
    if (!deviceId || !isAiActive) {
      lastAppliedRef.current = '';
      return;
    }

    // Run immediately when AI mode is activated
    calculateAndApply('initial');

    // Set up interval to check every 5 minutes
    const interval = setInterval(() => {
      calculateAndApply('interval');
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [deviceId, isAiActive, calculateAndApply]);

  // ==========================================================================
  // EFFECT: Real-time subscription to plants table changes
  // ==========================================================================
  useEffect(() => {
    if (!deviceId || !isAiActive) {
      return;
    }

    console.log('AutoPilot: Setting up real-time subscription for device:', deviceId);

    // Subscribe to changes in plants table
    const channel = supabase
      .channel(`autopilot-plants-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'plants',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          console.log('AutoPilot: Plants table changed:', payload.eventType);
          
          // Check if relevant fields changed
          if (payload.eventType === 'UPDATE') {
            const newRecord = payload.new as { 
              current_stage?: string; 
              is_main?: boolean;
              device_id?: string;
            };
            const oldRecord = payload.old as { 
              current_stage?: string; 
              is_main?: boolean;
              device_id?: string;
            };
            
            // Trigger update if stage or master flag changed
            if (
              newRecord.current_stage !== oldRecord.current_stage ||
              newRecord.is_main !== oldRecord.is_main
            ) {
              console.log('AutoPilot: Relevant change detected - recalculating');
              calculateAndApply('realtime-update');
            }
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            // New plant added or plant removed - recalculate
            calculateAndApply(`realtime-${payload.eventType.toLowerCase()}`);
          }
        }
      )
      .subscribe((status) => {
        console.log('AutoPilot: Subscription status:', status);
      });

    return () => {
      console.log('AutoPilot: Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [deviceId, isAiActive, calculateAndApply]);
}
