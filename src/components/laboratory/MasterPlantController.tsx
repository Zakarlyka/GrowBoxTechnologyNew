import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, 
  Users, 
  Thermometer, 
  Droplets, 
  Wind, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Star
} from 'lucide-react';
import { calculatePlantAge } from '@/hooks/usePlantData';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

interface GrowingParams {
  stages?: Array<{
    name: string;
    days: number;
  }>;
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

interface Plant {
  id: string;
  custom_name: string | null;
  current_stage: string | null;
  start_date: string | null;
  is_main: boolean | null;
  strain_id: number | null;
  library_strains?: {
    name: string;
    flowering_days: number | null;
    photo_url: string | null;
    growing_params: Json | null;
  } | null;
}

interface EnvironmentTarget {
  temp: number;
  humidity: number;
  vpd: number;
  stageName: string;
}

interface CompatibilityResult {
  status: 'sync' | 'warning' | 'critical';
  tempDiff: number;
  humidityDiff: number;
  vpdDiff: number;
  message: string;
}

export const MasterPlantController = () => {
  const queryClient = useQueryClient();

  const { data: plants, isLoading } = useQuery({
    queryKey: ['master-plants'],
    queryFn: async (): Promise<Plant[]> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from('plants')
        .select(`
          id,
          custom_name,
          current_stage,
          start_date,
          is_main,
          strain_id,
          library_strains (name, flowering_days, photo_url, growing_params)
        `)
        .eq('user_id', userData.user.id)
        .neq('current_stage', 'harvested')
        .order('is_main', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching plants:', error);
        return [];
      }

      return data || [];
    },
  });

  const setMasterMutation = useMutation({
    mutationFn: async (plantId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // First, unset all other plants as main
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
      queryClient.invalidateQueries({ queryKey: ['master-plants'] });
      queryClient.invalidateQueries({ queryKey: ['active-plants'] });
      toast.success('Master plant updated');
    },
    onError: () => {
      toast.error('Failed to update master plant');
    },
  });

  // Get current stage from days
  const getCurrentStage = (startDate: string | null, growingParams: GrowingParams | null): string | null => {
    if (!startDate || !growingParams?.stages) return null;
    
    const age = calculatePlantAge(startDate);
    if (age === null) return null;

    let cumulativeDays = 0;
    for (const stage of growingParams.stages) {
      if (age <= cumulativeDays + stage.days) {
        return stage.name.toLowerCase();
      }
      cumulativeDays += stage.days;
    }

    return growingParams.stages[growingParams.stages.length - 1]?.name.toLowerCase() || null;
  };

  // Get environment targets for a specific stage
  const getEnvironmentTargets = (growingParams: GrowingParams | null, stageName: string | null): EnvironmentTarget | null => {
    if (!growingParams?.environment_targets || !stageName) return null;

    const stageTarget = growingParams.environment_targets.find(
      t => t.stage?.toLowerCase() === stageName?.toLowerCase()
    );

    if (!stageTarget) return null;

    const avgTemp = stageTarget.temp_day 
      ? (stageTarget.temp_night ? (stageTarget.temp_day + stageTarget.temp_night) / 2 : stageTarget.temp_day)
      : 24;
    
    const avgHumidity = stageTarget.humidity_min !== undefined && stageTarget.humidity_max !== undefined
      ? (stageTarget.humidity_min + stageTarget.humidity_max) / 2
      : 60;

    return {
      temp: avgTemp,
      humidity: avgHumidity,
      vpd: stageTarget.vpd_target || 1.0,
      stageName: stageName,
    };
  };

  // Compare two plants' targets
  const compareCompatibility = (masterTargets: EnvironmentTarget, neighborTargets: EnvironmentTarget): CompatibilityResult => {
    const tempDiff = Math.abs(masterTargets.temp - neighborTargets.temp);
    const humidityDiff = Math.abs(masterTargets.humidity - neighborTargets.humidity);
    const vpdDiff = Math.abs(masterTargets.vpd - neighborTargets.vpd);

    // Determine status and message
    if (humidityDiff > 15) {
      if (masterTargets.humidity > neighborTargets.humidity) {
        return {
          status: 'critical',
          tempDiff,
          humidityDiff,
          vpdDiff,
          message: `Risk of Mold: Environment is too humid for ${neighborTargets.stageName} stage (needs ${neighborTargets.humidity}% RH)`,
        };
      } else {
        return {
          status: 'warning',
          tempDiff,
          humidityDiff,
          vpdDiff,
          message: `Low humidity stress: Environment is too dry for ${neighborTargets.stageName} stage`,
        };
      }
    }

    if (tempDiff > 4) {
      if (masterTargets.temp > neighborTargets.temp) {
        return {
          status: 'warning',
          tempDiff,
          humidityDiff,
          vpdDiff,
          message: `Heat stress risk: Temperature too high for ${neighborTargets.stageName} stage`,
        };
      } else {
        return {
          status: 'warning',
          tempDiff,
          humidityDiff,
          vpdDiff,
          message: `Cold stress risk: Temperature too low for ${neighborTargets.stageName} stage`,
        };
      }
    }

    if (vpdDiff > 0.3) {
      return {
        status: 'warning',
        tempDiff,
        humidityDiff,
        vpdDiff,
        message: `VPD mismatch: Transpiration rate may be suboptimal`,
      };
    }

    return {
      status: 'sync',
      tempDiff,
      humidityDiff,
      vpdDiff,
      message: 'Compatible environment',
    };
  };

  const masterPlant = useMemo(() => {
    return plants?.find(p => p.is_main) || plants?.[0] || null;
  }, [plants]);

  const neighborPlants = useMemo(() => {
    if (!masterPlant) return [];
    return plants?.filter(p => p.id !== masterPlant.id) || [];
  }, [plants, masterPlant]);

  const masterTargets = useMemo(() => {
    if (!masterPlant) return null;
    const strainData = masterPlant.library_strains;
    const growingParams = strainData?.growing_params as GrowingParams | null;
    const currentStage = getCurrentStage(masterPlant.start_date, growingParams);
    return getEnvironmentTargets(growingParams, currentStage);
  }, [masterPlant]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!plants || plants.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No active plants found. Add plants from the Strain Library to use the Master Plant Controller.
        </AlertDescription>
      </Alert>
    );
  }

  if (plants.length === 1) {
    return (
      <Alert>
        <Crown className="h-4 w-4" />
        <AlertDescription>
          Only one plant active. Add more plants to compare climate compatibility.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left Column: Master Plant */}
      <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg">Master Plant</CardTitle>
            </div>
            <Badge variant="outline" className="border-amber-500/50 text-amber-500">
              Controller
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {masterPlant && (
            <>
              {/* Master Plant Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                {masterPlant.library_strains?.photo_url && (
                  <div 
                    className="w-12 h-12 rounded-lg bg-cover bg-center border border-border"
                    style={{ backgroundImage: `url(${masterPlant.library_strains.photo_url})` }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">
                    {masterPlant.custom_name || 'Unnamed Plant'}
                  </h4>
                  {masterPlant.library_strains?.name && (
                    <p className="text-sm text-muted-foreground truncate">
                      {masterPlant.library_strains.name}
                    </p>
                  )}
                </div>
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              </div>

              {/* Active Targets */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Active Targets
                  {masterTargets && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {masterTargets.stageName}
                    </Badge>
                  )}
                </h5>
                
                {masterTargets ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                      <Thermometer className="h-4 w-4 text-red-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">{masterTargets.temp}°C</p>
                      <p className="text-xs text-muted-foreground">Temp</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                      <Droplets className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">{masterTargets.humidity}%</p>
                      <p className="text-xs text-muted-foreground">RH</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                      <Wind className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">{masterTargets.vpd.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">VPD</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No environment targets defined in strain passport
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Right Column: Neighbor Plants */}
      <Card className="border border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Neighbors</CardTitle>
            <Badge variant="secondary" className="ml-auto">
              {neighborPlants.length} plants
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {neighborPlants.map((plant) => {
            const strainData = plant.library_strains;
            const growingParams = strainData?.growing_params as GrowingParams | null;
            const currentStage = getCurrentStage(plant.start_date, growingParams);
            const neighborTargets = getEnvironmentTargets(growingParams, currentStage);

            let compatibility: CompatibilityResult | null = null;
            if (masterTargets && neighborTargets) {
              compatibility = compareCompatibility(masterTargets, neighborTargets);
            }

            return (
              <div
                key={plant.id}
                className={`p-3 rounded-lg border transition-colors ${
                  compatibility?.status === 'critical'
                    ? 'bg-red-500/5 border-red-500/30'
                    : compatibility?.status === 'warning'
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : 'bg-green-500/5 border-green-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Photo */}
                  {strainData?.photo_url && (
                    <div 
                      className="w-10 h-10 rounded-lg bg-cover bg-center border border-border shrink-0"
                      style={{ backgroundImage: `url(${strainData.photo_url})` }}
                    />
                  )}
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground truncate text-sm">
                        {plant.custom_name || 'Unnamed'}
                      </h4>
                      {currentStage && (
                        <Badge variant="outline" className="text-xs capitalize shrink-0">
                          {currentStage}
                        </Badge>
                      )}
                    </div>
                    {strainData?.name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {strainData.name}
                      </p>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="shrink-0">
                    {compatibility?.status === 'sync' && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {compatibility?.status === 'warning' && (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    )}
                    {compatibility?.status === 'critical' && (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    {!compatibility && (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </div>
                </div>

                {/* Compatibility Message */}
                {compatibility && (
                  <div className={`mt-2 text-xs flex items-start gap-1.5 ${
                    compatibility.status === 'critical'
                      ? 'text-red-400'
                      : compatibility.status === 'warning'
                      ? 'text-amber-400'
                      : 'text-green-400'
                  }`}>
                    {compatibility.status === 'sync' ? '✅' : '⚠️'}
                    <span>{compatibility.message}</span>
                  </div>
                )}

                {/* Target Comparison */}
                {neighborTargets && masterTargets && (
                  <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                    <span className={compatibility && compatibility.tempDiff > 4 ? 'text-amber-400' : ''}>
                      Δ{compatibility?.tempDiff.toFixed(0)}°C
                    </span>
                    <span className={compatibility && compatibility.humidityDiff > 15 ? 'text-red-400' : ''}>
                      Δ{compatibility?.humidityDiff.toFixed(0)}% RH
                    </span>
                    <span className={compatibility && compatibility.vpdDiff > 0.3 ? 'text-amber-400' : ''}>
                      Δ{compatibility?.vpdDiff.toFixed(2)} VPD
                    </span>
                  </div>
                )}

                {/* Set as Master Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs w-full"
                  onClick={() => setMasterMutation.mutate(plant.id)}
                  disabled={setMasterMutation.isPending}
                >
                  <Crown className="h-3 w-3 mr-1" />
                  Set as Master
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
