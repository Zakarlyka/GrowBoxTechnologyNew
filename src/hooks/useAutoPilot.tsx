import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  calculateStageInfo, 
  getEnvironmentTargets, 
  GrowingParams 
} from './usePlantsWithStrains';
import { DeviceSettings } from '@/types';
import { Json } from '@/integrations/supabase/types';

interface AutoPilotResult {
  targetTemp: number;
  targetHum: number;
  lightHours: number;
  lightStartH: number;
  lightEndH: number;
  stageName: string;
}

interface PlantWithStrain {
  id: string;
  start_date: string | null;
  strain_name: string | null;
  growing_params: GrowingParams | null;
}

/**
 * Auto-Pilot Hook - The "Brain" of AI Mode
 * 
 * When ai_mode === 1, this hook:
 * 1. Fetches the active plant (is_main = true) for the current device
 * 2. Calculates current stage from start_date
 * 3. Gets environment targets from strain's growing_params
 * 4. Updates device settings if they don't match the targets
 */
export function useAutoPilot(
  deviceId: string | null,
  isAiActive: boolean,
  currentSettings: DeviceSettings | null
) {
  const lastAppliedRef = useRef<string>('');

  useEffect(() => {
    if (!deviceId || !isAiActive) {
      lastAppliedRef.current = '';
      return;
    }

    const calculateAndApply = async () => {
      try {
        // Step 1: Get active plant for this device
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { data: activePlant, error: plantError } = await supabase
          .from('plants')
          .select(`
            id,
            start_date,
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
          console.error('AutoPilot: Error fetching plant:', plantError);
          return;
        }

        if (!activePlant) {
          console.log('AutoPilot: No active plant for this device');
          return;
        }

        const strainData = activePlant.library_strains as {
          name: string;
          growing_params: Json | null;
        } | null;

        if (!strainData?.growing_params) {
          console.log('AutoPilot: No growing_params for strain');
          return;
        }

        const plant: PlantWithStrain = {
          id: activePlant.id,
          start_date: activePlant.start_date,
          strain_name: strainData.name,
          growing_params: strainData.growing_params as GrowingParams,
        };

        // Step 2: Calculate current stage
        const stageInfo = calculateStageInfo(plant.start_date, plant.growing_params);
        if (!stageInfo) {
          console.log('AutoPilot: Could not calculate stage info');
          return;
        }

        // Step 3: Get environment targets for current stage
        const targets = getEnvironmentTargets(plant.growing_params, stageInfo.stageName);
        if (!targets) {
          console.log('AutoPilot: No environment targets for stage:', stageInfo.stageName);
          return;
        }

        // Step 4: Calculate light schedule from light_hours
        const lightHours = targets.light_hours || 18; // Default 18h for veg
        const lightStartH = 6; // Default 6 AM start
        const lightEndH = (lightStartH + lightHours) % 24;

        const autoPilotResult: AutoPilotResult = {
          targetTemp: targets.temp,
          targetHum: targets.humidity,
          lightHours,
          lightStartH,
          lightEndH,
          stageName: stageInfo.stageName,
        };

        // Create fingerprint to avoid duplicate updates
        const fingerprint = JSON.stringify(autoPilotResult);
        if (fingerprint === lastAppliedRef.current) {
          return; // No changes needed
        }

        // Step 5: Check if settings need updating
        const needsUpdate = 
          currentSettings?.target_temp !== autoPilotResult.targetTemp ||
          currentSettings?.target_hum !== autoPilotResult.targetHum ||
          currentSettings?.light_start_h !== autoPilotResult.lightStartH ||
          currentSettings?.light_end_h !== autoPilotResult.lightEndH;

        if (!needsUpdate) {
          lastAppliedRef.current = fingerprint;
          return;
        }

        // Step 6: Apply settings update
        console.log('AutoPilot: Applying settings for stage:', stageInfo.stageName, autoPilotResult);

        const { error: updateError } = await supabase
          .from('devices')
          .update({
            settings: {
              ...currentSettings,
              // Climate targets
              target_temp: autoPilotResult.targetTemp,
              target_hum: autoPilotResult.targetHum,
              climate_mode: 1, // Ensure climate is ON
              // Light schedule
              light_mode: 1, // Ensure light is ON
              light_start_h: autoPilotResult.lightStartH,
              light_start_m: 0,
              light_end_h: autoPilotResult.lightEndH,
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
        toast.success(`🤖 AI Pilot: ${stageInfo.stageName} — ${autoPilotResult.targetTemp}°C, ${autoPilotResult.targetHum}% RH, ${lightHours}h світла`);

      } catch (error) {
        console.error('AutoPilot: Unexpected error:', error);
      }
    };

    // Run immediately
    calculateAndApply();

    // Set up interval to check every 5 minutes (in case plant data changes)
    const interval = setInterval(calculateAndApply, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [deviceId, isAiActive, currentSettings]);
}
