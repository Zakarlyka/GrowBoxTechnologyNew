import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, 
  Thermometer, 
  Droplets, 
  Wind, 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  Star,
  ArrowRight
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
  details: string;
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

      await supabase
        .from('plants')
        .update({ is_main: false })
        .eq('user_id', userData.user.id);

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
      temp: Math.round(avgTemp),
      humidity: Math.round(avgHumidity),
      vpd: stageTarget.vpd_target || 1.0,
      stageName: stageName,
    };
  };

  const compareCompatibility = (masterTargets: EnvironmentTarget, neighborTargets: EnvironmentTarget): CompatibilityResult => {
    const tempDiff = Math.abs(masterTargets.temp - neighborTargets.temp);
    const humidityDiff = Math.abs(masterTargets.humidity - neighborTargets.humidity);
    const vpdDiff = Math.abs(masterTargets.vpd - neighborTargets.vpd);

    // Humidity conflict > 10%
    if (humidityDiff > 10) {
      const wantsMore = neighborTargets.humidity > masterTargets.humidity;
      return {
        status: 'critical',
        tempDiff,
        humidityDiff,
        vpdDiff,
        message: wantsMore 
          ? `Wants ${Math.round(neighborTargets.humidity)}% RH, but Master set to ${Math.round(masterTargets.humidity)}%!`
          : `Risk of Mold: ${Math.round(masterTargets.humidity)}% is too humid for ${neighborTargets.stageName}`,
        details: `Needs ${Math.round(neighborTargets.humidity)}% RH for optimal ${neighborTargets.stageName} growth`,
      };
    }

    if (tempDiff > 4) {
      return {
        status: 'warning',
        tempDiff,
        humidityDiff,
        vpdDiff,
        message: `Temperature ${tempDiff > 0 && masterTargets.temp > neighborTargets.temp ? 'too high' : 'too low'} for ${neighborTargets.stageName}`,
        details: `Needs ${neighborTargets.temp}°C, Master set to ${masterTargets.temp}°C`,
      };
    }

    if (vpdDiff > 0.3) {
      return {
        status: 'warning',
        tempDiff,
        humidityDiff,
        vpdDiff,
        message: `VPD mismatch may affect transpiration`,
        details: `Target VPD: ${neighborTargets.vpd.toFixed(1)}, Current: ${masterTargets.vpd.toFixed(1)}`,
      };
    }

    return {
      status: 'sync',
      tempDiff,
      humidityDiff,
      vpdDiff,
      message: 'Environment compatible',
      details: 'Both plants thrive in current conditions',
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

  const masterCurrentStage = useMemo(() => {
    if (!masterPlant) return null;
    const strainData = masterPlant.library_strains;
    const growingParams = strainData?.growing_params as GrowingParams | null;
    return getCurrentStage(masterPlant.start_date, growingParams);
  }, [masterPlant]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!plants || plants.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No active plants found. Add plants from the Strain Library to use the Climate Controller.
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

  const masterStrainData = masterPlant?.library_strains;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: Master Plant Dashboard */}
      <Card className="relative overflow-hidden border-2 border-amber-500/30">
        {/* Background Image */}
        {masterStrainData?.photo_url && (
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0 bg-cover bg-center scale-110 blur-md opacity-30"
              style={{ backgroundImage: `url(${masterStrainData.photo_url})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          </div>
        )}
        
        <CardContent className="relative p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40">
              <Crown className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-foreground">Master Plant</h3>
              <p className="text-sm text-muted-foreground">Controls the environment</p>
            </div>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">
              👑 Controller
            </Badge>
          </div>

          {/* Plant Info with Photo */}
          {masterPlant && (
            <div className="flex items-center gap-4 p-3 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50">
              {masterStrainData?.photo_url ? (
                <div 
                  className="w-16 h-16 rounded-xl bg-cover bg-center border-2 border-amber-500/30 shrink-0"
                  style={{ backgroundImage: `url(${masterStrainData.photo_url})` }}
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                  <Star className="h-6 w-6 text-amber-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground truncate text-lg">
                  {masterPlant.custom_name || 'Unnamed Plant'}
                </h4>
                <p className="text-sm text-muted-foreground truncate">
                  {masterStrainData?.name || 'Unknown Strain'}
                </p>
                {masterCurrentStage && (
                  <Badge variant="secondary" className="mt-1 capitalize text-xs">
                    {masterCurrentStage}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Active Targets - Big Metrics */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
              Active Environment Targets
            </div>
            
            {masterTargets ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                  <Thermometer className="h-5 w-5 text-red-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{masterTargets.temp}°</p>
                  <p className="text-xs text-muted-foreground mt-1">Temperature</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <Droplets className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{masterTargets.humidity}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Humidity</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                  <Wind className="h-5 w-5 text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{masterTargets.vpd.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground mt-1">VPD</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground">
                  No environment targets defined in strain passport
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Right: Neighbors Analysis */}
      <Card className="border border-border/50">
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-foreground">Neighbors Analysis</h3>
              <p className="text-sm text-muted-foreground">Climate compatibility check</p>
            </div>
            <Badge variant="secondary">
              {neighborPlants.length} plants
            </Badge>
          </div>

          {/* Neighbor Cards */}
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {neighborPlants.map((plant) => {
              const strainData = plant.library_strains;
              const growingParams = strainData?.growing_params as GrowingParams | null;
              const currentStage = getCurrentStage(plant.start_date, growingParams);
              const neighborTargets = getEnvironmentTargets(growingParams, currentStage);

              let compatibility: CompatibilityResult | null = null;
              if (masterTargets && neighborTargets) {
                compatibility = compareCompatibility(masterTargets, neighborTargets);
              }

              const statusStyles = {
                sync: 'bg-green-500/5 border-green-500/30',
                warning: 'bg-amber-500/5 border-amber-500/30',
                critical: 'bg-red-500/5 border-red-500/30',
              };

              const StatusIcon = compatibility?.status === 'sync' 
                ? CheckCircle2 
                : compatibility?.status === 'critical' 
                  ? XCircle 
                  : AlertTriangle;

              const statusColor = {
                sync: 'text-green-500',
                warning: 'text-amber-500',
                critical: 'text-red-500',
              };

              return (
                <div
                  key={plant.id}
                  className={`p-3 rounded-xl border transition-all ${
                    compatibility ? statusStyles[compatibility.status] : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Photo */}
                    {strainData?.photo_url ? (
                      <div 
                        className="w-12 h-12 rounded-lg bg-cover bg-center border border-border shrink-0"
                        style={{ backgroundImage: `url(${strainData.photo_url})` }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                        <Star className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground truncate">
                          {plant.custom_name || 'Unnamed'}
                        </h4>
                        {currentStage && (
                          <Badge variant="outline" className="text-xs capitalize shrink-0">
                            {currentStage}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {strainData?.name || 'Unknown Strain'}
                      </p>
                    </div>

                    {/* Status Icon */}
                    <div className="shrink-0">
                      {compatibility ? (
                        <StatusIcon className={`h-6 w-6 ${statusColor[compatibility.status]}`} />
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </div>

                  {/* Compatibility Message */}
                  {compatibility && (
                    <div className={`mt-2 p-2 rounded-lg ${
                      compatibility.status === 'critical' ? 'bg-red-500/10' : 
                      compatibility.status === 'warning' ? 'bg-amber-500/10' : 
                      'bg-green-500/10'
                    }`}>
                      <p className={`text-sm font-medium ${statusColor[compatibility.status]}`}>
                        {compatibility.status === 'sync' ? '✅' : '⚠️'} {compatibility.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {compatibility.details}
                      </p>
                    </div>
                  )}

                  {/* Set as Master Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 text-xs w-full hover:bg-amber-500/10"
                    onClick={() => setMasterMutation.mutate(plant.id)}
                    disabled={setMasterMutation.isPending}
                  >
                    <Crown className="h-3 w-3 mr-1.5" />
                    Set as Master
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
