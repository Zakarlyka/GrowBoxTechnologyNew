import { useEffect, useRef, useCallback, useState } from 'react';
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

interface MasterPlantInfo {
  plantId: string;
  strainName: string;
  currentStage: string;
}

export interface AutoPilotTargets {
  targetTemp: number;
  targetHum: number;
  lightHours: number;
  lightStartH: number;
  lightEndH: number;
  stageName: string;
  vpdTarget: number | null;
}

export interface UseAutoPilotResult {
  /** Calculated targets from strain data, null if no master plant */
  targets: AutoPilotTargets | null;
  /** Info about the master plant being used */
  masterPlant: MasterPlantInfo | null;
  /** Whether targets are being fetched */
  isLoading: boolean;
  /** Manual trigger to recalculate targets */
  recalculate: () => Promise<void>;
  /** Apply targets to device settings */
  applyTargets: () => Promise<boolean>;
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
  
  // Handle common variations - comprehensive mapping
  const stageMap: Record<string, string> = {
    // Vegetation variations
    'veg': 'vegetation',
    'vegetative': 'vegetation',
    'vegetative_stage': 'vegetation',
    'veg_stage': 'vegetation',
    'growth': 'vegetation',
    // Flowering variations
    'bloom': 'flowering',
    'flower': 'flowering',
    'flowering_stage': 'flowering',
    'bloom_stage': 'flowering',
    'pre-flower': 'pre-flowering',
    'preflower': 'pre-flowering',
    'pre_flower': 'pre-flowering',
    'preflowering': 'pre-flowering',
    'pre_flowering': 'pre-flowering',
    // Seedling variations
    'seed': 'seedling',
    'germination': 'seedling',
    'sprout': 'seedling',
    'seedling_stage': 'seedling',
    // Late stage variations
    'ripen': 'ripening',
    'ripe': 'ripening',
    'late_flowering': 'ripening',
    'late_bloom': 'ripening',
    'flush': 'ripening',
    'flushing': 'ripening',
    // Harvest
    'harvest': 'harvested',
    'harvesting': 'harvested',
    'done': 'harvested',
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
  if (!stageName) return null;
  
  const normalizedStage = normalizeStage(stageName);
  
  console.log('AutoPilot: Looking for stage:', {
    original: stageName,
    normalized: normalizedStage,
    hasGrowingParams: !!growingParams,
    paramsKeys: growingParams ? Object.keys(growingParams) : [],
  });
  
  // If we have growing params, try to find explicit targets
  if (growingParams) {
    // Priority 1: Check optimal_environments (new schema from AI import)
    if (growingParams.optimal_environments) {
      const envs = growingParams.optimal_environments;
      const envKeys = Object.keys(envs);
      console.log('AutoPilot: optimal_environments keys:', envKeys);
      
      // Direct match with normalized stage
      if (envs[normalizedStage]) {
        console.log('AutoPilot: Found direct match (normalized):', normalizedStage, envs[normalizedStage]);
        return envs[normalizedStage];
      }
      
      // Direct match with original (lowercase)
      const lowerStage = stageName.toLowerCase().trim();
      if (envs[lowerStage]) {
        console.log('AutoPilot: Found direct match (lowercase):', lowerStage, envs[lowerStage]);
        return envs[lowerStage];
      }
      
      // Direct match with original (as-is)
      if (envs[stageName]) {
        console.log('AutoPilot: Found direct match (original):', stageName, envs[stageName]);
        return envs[stageName];
      }
      
      // Fuzzy match - try all variations
      for (const [key, value] of Object.entries(envs)) {
        const normalizedKey = normalizeStage(key);
        const lowerKey = key.toLowerCase().trim();
        
        if (normalizedKey === normalizedStage || 
            lowerKey === lowerStage ||
            normalizedKey.includes(normalizedStage) || 
            normalizedStage.includes(normalizedKey) ||
            lowerKey.includes(lowerStage) ||
            lowerStage.includes(lowerKey)) {
          console.log('AutoPilot: Found fuzzy match:', { key, normalizedKey, lowerKey }, value);
          return value;
        }
      }
    }
    
    // Priority 2: Check environment_targets (older schema)
    if (growingParams.environment_targets) {
      const targets = growingParams.environment_targets;
      console.log('AutoPilot: Checking environment_targets, isArray:', Array.isArray(targets));
      
      // Array format
      if (Array.isArray(targets)) {
        const match = targets.find(t => {
          const targetStage = normalizeStage(t?.stage);
          const lowerTargetStage = (t?.stage || '').toLowerCase().trim();
          const lowerStage = stageName.toLowerCase().trim();
          return targetStage === normalizedStage || 
                 lowerTargetStage === lowerStage ||
                 targetStage.includes(normalizedStage) || 
                 normalizedStage.includes(targetStage);
        });
        if (match) {
          console.log('AutoPilot: Found array match:', match);
          return match;
        }
      }
      
      // Object format
      if (typeof targets === 'object' && !Array.isArray(targets)) {
        const objTargets = targets as Record<string, EnvironmentTarget>;
        const targetKeys = Object.keys(objTargets);
        console.log('AutoPilot: environment_targets (object) keys:', targetKeys);
        
        const lowerStage = stageName.toLowerCase().trim();
        
        // Direct matches
        if (objTargets[normalizedStage]) {
          console.log('AutoPilot: Found object match (normalized):', normalizedStage);
          return objTargets[normalizedStage];
        }
        if (objTargets[lowerStage]) {
          console.log('AutoPilot: Found object match (lowercase):', lowerStage);
          return objTargets[lowerStage];
        }
        if (objTargets[stageName]) {
          console.log('AutoPilot: Found object match (original):', stageName);
          return objTargets[stageName];
        }
        
        // Fuzzy match
        for (const [key, value] of Object.entries(objTargets)) {
          const normalizedKey = normalizeStage(key);
          const lowerKey = key.toLowerCase().trim();
          if (normalizedKey === normalizedStage || 
              lowerKey === lowerStage ||
              normalizedKey.includes(normalizedStage) || 
              normalizedStage.includes(normalizedKey)) {
            console.log('AutoPilot: Found object fuzzy match:', key, value);
            return value;
          }
        }
      }
    }
  }
  
  // Priority 3: Return stage-based defaults if no explicit targets found
  // These are research-based optimal values for cannabis growing
  const stageDefaults: Record<string, EnvironmentTarget> = {
    'germination': {
      temp_day: 25,
      temp_night: 22,
      rh: 75,
      vpd_target: 0.5,
      light_hours: 18,
    },
    'seedling': {
      temp_day: 25,
      temp_night: 22,
      rh: 70,
      vpd_target: 0.7,
      light_hours: 18,
    },
    'vegetation': {
      temp_day: 26,
      temp_night: 22,
      rh: 60,
      vpd_target: 1.0,
      light_hours: 18,
    },
    'pre-flowering': {
      temp_day: 25,
      temp_night: 21,
      rh: 55,
      vpd_target: 1.1,
      light_hours: 12,
    },
    'flowering': {
      temp_day: 24,
      temp_night: 20,
      rh: 45,
      vpd_target: 1.3,
      light_hours: 12,
    },
    'ripening': {
      temp_day: 22,
      temp_night: 18,
      rh: 40,
      vpd_target: 1.4,
      light_hours: 12,
    },
  };
  
  // Try to match stage to defaults
  const defaultKey = Object.keys(stageDefaults).find(key => {
    const normalizedKey = normalizeStage(key);
    return normalizedKey === normalizedStage ||
           normalizedKey.includes(normalizedStage) ||
           normalizedStage.includes(normalizedKey);
  });
  
  if (defaultKey) {
    console.log(`AutoPilot: Using default targets for stage "${stageName}" (matched: ${defaultKey})`);
    return stageDefaults[defaultKey];
  }
  
  // Fallback to vegetation defaults for unknown stages
  console.log(`AutoPilot: Unknown stage "${stageName}", using vegetation defaults`);
  return stageDefaults['vegetation'];
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
 * When ai_mode is enabled, this hook:
 * 1. Fetches the Master Plant (is_main = true) for the current device
 * 2. Uses the plant's current_stage (NOT calculated from start_date)
 * 3. Extracts environment targets from strain's growing_params
 * 4. Returns calculated targets for UI to display and apply
 * 5. Subscribes to real-time changes in plants table
 */
export function useAutoPilot(
  deviceId: string | null,
  isAiActive: boolean,
  currentSettings: DeviceSettings | null
): UseAutoPilotResult {
  const [targets, setTargets] = useState<AutoPilotTargets | null>(null);
  const [masterPlant, setMasterPlant] = useState<MasterPlantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const lastFingerprintRef = useRef<string>('');
  const isApplyingRef = useRef<boolean>(false);
  const currentSettingsRef = useRef(currentSettings);

  // Keep settings ref up to date
  useEffect(() => {
    currentSettingsRef.current = currentSettings;
  }, [currentSettings]);

  /**
   * Fetch master plant and calculate targets
   */
  const fetchAndCalculate = useCallback(async (triggerSource: string): Promise<AutoPilotTargets | null> => {
    if (!deviceId) {
      console.log('AutoPilot: No device ID');
      return null;
    }

    try {
      setIsLoading(true);
      console.log(`AutoPilot: Fetching targets (${triggerSource})`);

      // Step 1: Get authenticated user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.log('AutoPilot: No authenticated user');
        return null;
      }

      // Step 2: Fetch Master Plant for this device
      const { data: masterPlantData, error: plantError } = await supabase
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
        return null;
      }

      if (!masterPlantData) {
        console.log('AutoPilot: No master plant found for device:', deviceId);
        setMasterPlant(null);
        setTargets(null);
        return null;
      }

      // Step 3: Extract strain data
      const strainData = masterPlantData.library_strains as {
        name: string;
        growing_params: Json | null;
      } | null;

      if (!strainData?.growing_params) {
        console.log('AutoPilot: No growing_params in strain data');
        setMasterPlant({
          plantId: masterPlantData.id,
          strainName: strainData?.name || 'Unknown',
          currentStage: masterPlantData.current_stage || 'unknown',
        });
        return null;
      }

      const growingParams = strainData.growing_params as GrowingParams;
      const currentStage = masterPlantData.current_stage;

      if (!currentStage) {
        console.log('AutoPilot: Plant has no current_stage set');
        setMasterPlant({
          plantId: masterPlantData.id,
          strainName: strainData.name,
          currentStage: 'not set',
        });
        return null;
      }

      // Update master plant info
      setMasterPlant({
        plantId: masterPlantData.id,
        strainName: strainData.name,
        currentStage: currentStage,
      });

      // Step 4: Extract environment targets for current stage
      const stageTarget = extractStageTargets(growingParams, currentStage);

      if (!stageTarget) {
        console.log('AutoPilot: No targets found for stage:', currentStage);
        console.log('AutoPilot: Available data:', JSON.stringify(growingParams, null, 2).slice(0, 500));
        return null;
      }

      // Step 5: Calculate autopilot settings
      const calculatedTargets = calculateAutoPilotTargets(stageTarget, currentStage);

      console.log('AutoPilot: Calculated targets:', {
        strain: strainData.name,
        stage: currentStage,
        ...calculatedTargets,
      });

      setTargets(calculatedTargets);
      return calculatedTargets;

    } catch (error) {
      console.error('AutoPilot: Unexpected error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  /**
   * Apply calculated targets to device settings
   */
  const applyTargets = useCallback(async (): Promise<boolean> => {
    if (!deviceId || !targets) {
      console.log('AutoPilot: Cannot apply - no device or no targets');
      return false;
    }

    if (isApplyingRef.current) {
      console.log('AutoPilot: Already applying');
      return false;
    }

    try {
      isApplyingRef.current = true;

      // Create fingerprint to avoid duplicate updates
      const fingerprint = JSON.stringify({
        temp: targets.targetTemp,
        hum: targets.targetHum,
        lightStart: targets.lightStartH,
        lightEnd: targets.lightEndH,
        stage: targets.stageName,
      });

      if (fingerprint === lastFingerprintRef.current) {
        console.log('AutoPilot: Settings unchanged, skipping');
        return true;
      }

      // Check if update is needed
      const settings = currentSettingsRef.current;
      const needsUpdate =
        settings?.target_temp !== targets.targetTemp ||
        settings?.target_hum !== targets.targetHum ||
        settings?.light_start_h !== targets.lightStartH ||
        settings?.light_end_h !== targets.lightEndH;

      if (!needsUpdate) {
        lastFingerprintRef.current = fingerprint;
        console.log('AutoPilot: Device already has correct settings');
        return true;
      }

      console.log('AutoPilot: Applying settings for stage:', targets.stageName);

      const { error: updateError } = await supabase
        .from('devices')
        .update({
          settings: {
            ...settings,
            // Climate targets
            target_temp: targets.targetTemp,
            target_hum: targets.targetHum,
            climate_mode: 1,
            // Light schedule
            light_mode: 1,
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
        return false;
      }

      lastFingerprintRef.current = fingerprint;

      if (masterPlant) {
        toast.success(
          `🤖 AI Pilot: ${masterPlant.strainName} → ${targets.stageName} — ${targets.targetTemp}°C, ${targets.targetHum}% RH, ${targets.lightHours}h світла`,
          { duration: 5000 }
        );
      }

      return true;
    } catch (error) {
      console.error('AutoPilot: Unexpected error:', error);
      return false;
    } finally {
      isApplyingRef.current = false;
    }
  }, [deviceId, targets, masterPlant]);

  /**
   * Manual recalculate function
   */
  const recalculate = useCallback(async () => {
    await fetchAndCalculate('manual');
  }, [fetchAndCalculate]);

  // ==========================================================================
  // EFFECT: Initial fetch when AI mode is activated
  // ==========================================================================
  useEffect(() => {
    if (!deviceId) return;

    if (isAiActive) {
      // Fetch targets when AI mode is turned on
      fetchAndCalculate('ai-activated').then((newTargets) => {
        if (!newTargets) {
          // No master plant or no targets - warn user
          toast.warning('AI Mode: Не знайдено Master Plant для цього пристрою', {
            description: 'Призначте рослину як "Master" у Лабораторії',
            duration: 5000,
          });
        }
      });
    } else {
      // Clear targets when AI mode is off
      setTargets(null);
      setMasterPlant(null);
      lastFingerprintRef.current = '';
    }
  }, [deviceId, isAiActive, fetchAndCalculate]);

  // ==========================================================================
  // EFFECT: Auto-apply when targets change and AI is active
  // ==========================================================================
  useEffect(() => {
    if (isAiActive && targets) {
      applyTargets();
    }
  }, [isAiActive, targets, applyTargets]);

  // ==========================================================================
  // EFFECT: Real-time subscription to plants table changes
  // ==========================================================================
  useEffect(() => {
    if (!deviceId || !isAiActive) {
      return;
    }

    console.log('AutoPilot: Setting up real-time subscription for device:', deviceId);

    const channel = supabase
      .channel(`autopilot-plants-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plants',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          console.log('AutoPilot: Plants table changed:', payload.eventType);
          
          if (payload.eventType === 'UPDATE') {
            const newRecord = payload.new as { 
              current_stage?: string; 
              is_main?: boolean;
            };
            const oldRecord = payload.old as { 
              current_stage?: string; 
              is_main?: boolean;
            };
            
            if (
              newRecord.current_stage !== oldRecord.current_stage ||
              newRecord.is_main !== oldRecord.is_main
            ) {
              console.log('AutoPilot: Relevant change detected - recalculating');
              fetchAndCalculate('realtime-update');
            }
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            fetchAndCalculate(`realtime-${payload.eventType.toLowerCase()}`);
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
  }, [deviceId, isAiActive, fetchAndCalculate]);

  // ==========================================================================
  // EFFECT: Periodic refresh every 5 minutes
  // ==========================================================================
  useEffect(() => {
    if (!deviceId || !isAiActive) return;

    const interval = setInterval(() => {
      fetchAndCalculate('interval');
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [deviceId, isAiActive, fetchAndCalculate]);

  return {
    targets,
    masterPlant,
    isLoading,
    recalculate,
    applyTargets,
  };
}
