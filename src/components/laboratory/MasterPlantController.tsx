import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowRight,
  Link2,
  Clock,
  Bell
} from 'lucide-react';
import { calculatePlantAge } from '@/hooks/usePlantData';
import { 
  usePlantsWithStrains,
  calculateStageInfo,
  getEnvironmentTargets,
  getNextAlert,
  CalculatedTargets
} from '@/hooks/usePlantsWithStrains';

interface CompatibilityResult {
  status: 'sync' | 'warning' | 'critical';
  tempDiff: number;
  humidityDiff: number;
  vpdDiff: number;
  message: string;
  details: string;
}

export const MasterPlantController = () => {
  const navigate = useNavigate();
  const { 
    plants, 
    masterPlant, 
    neighborPlants, 
    isLoading, 
    setMaster, 
    isSettingMaster 
  } = usePlantsWithStrains();

  // Calculate master plant targets
  const masterStageInfo = useMemo(() => {
    if (!masterPlant) return null;
    return calculateStageInfo(masterPlant.start_date, masterPlant.growing_params);
  }, [masterPlant]);

  const masterTargets = useMemo(() => {
    if (!masterPlant || !masterStageInfo) return null;
    return getEnvironmentTargets(masterPlant.growing_params, masterStageInfo.stageName);
  }, [masterPlant, masterStageInfo]);

  const masterNextAlert = useMemo(() => {
    if (!masterPlant) return null;
    return getNextAlert(masterPlant.start_date, masterPlant.growing_params);
  }, [masterPlant]);

  // Compare compatibility between master and neighbor
  const compareCompatibility = (masterTargets: CalculatedTargets, neighborTargets: CalculatedTargets): CompatibilityResult => {
    const tempDiff = Math.abs(masterTargets.temp - neighborTargets.temp);
    const humidityDiff = Math.abs(masterTargets.humidity - neighborTargets.humidity);
    const vpdDiff = Math.abs(masterTargets.vpd - neighborTargets.vpd);

    // Humidity conflict > 15% (as per user request)
    if (humidityDiff > 15) {
      const wantsMore = neighborTargets.humidity > masterTargets.humidity;
      return {
        status: 'critical',
        tempDiff,
        humidityDiff,
        vpdDiff,
        message: wantsMore 
          ? `⚠️ Climate Conflict: Wants ${Math.round(neighborTargets.humidity)}% RH`
          : `⚠️ Climate Conflict: ${Math.round(masterTargets.humidity)}% is too humid`,
        details: `Needs ${Math.round(neighborTargets.humidity)}% RH for optimal ${neighborTargets.stageName} growth`,
      };
    }

    if (tempDiff > 4) {
      return {
        status: 'warning',
        tempDiff,
        humidityDiff,
        vpdDiff,
        message: `Temperature ${masterTargets.temp > neighborTargets.temp ? 'too high' : 'too low'}`,
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <Skeleton className="h-56 md:h-72" />
        <Skeleton className="h-56 md:h-72" />
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

  const masterAge = masterPlant ? calculatePlantAge(masterPlant.start_date) : null;
  const displayPhoto = masterPlant?.photo_url || masterPlant?.strain_photo_url;

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Master Plant Dashboard */}
      <Card className="relative overflow-hidden border-2 border-amber-500/30">
        {/* Background Image */}
        {displayPhoto && (
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0 bg-cover bg-center scale-110 blur-md opacity-30"
              style={{ backgroundImage: `url(${displayPhoto})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          </div>
        )}
        
        <CardContent className="relative p-4 md:p-5 space-y-3 md:space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-lg bg-amber-500/20 border border-amber-500/40">
              <Crown className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base md:text-lg text-foreground">Master Plant</h3>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Controls the environment</p>
            </div>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-xs">
              👑 Controller
            </Badge>
          </div>

          {/* Plant Info with Photo */}
          {masterPlant && (
            <div className="flex items-center gap-3 p-2.5 md:p-3 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50">
              {displayPhoto ? (
                <div 
                  className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-cover bg-center border-2 border-amber-500/30 shrink-0"
                  style={{ backgroundImage: `url(${displayPhoto})` }}
                />
              ) : (
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                  <Star className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground truncate text-base md:text-lg">
                  {masterPlant.custom_name || 'Unnamed Plant'}
                </h4>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {masterPlant.strain_name || 'Unknown Strain'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {masterStageInfo && (
                    <Badge variant="secondary" className="capitalize text-xs">
                      {masterStageInfo.stageName}
                    </Badge>
                  )}
                  {masterAge !== null && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Day {masterAge}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Missing Strain Warning */}
          {masterPlant && !masterPlant.strain_id && (
            <Button 
              variant="outline" 
              className="w-full gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              onClick={() => navigate('/library')}
            >
              <Link2 className="h-4 w-4" />
              🔗 Link to Strain Library
            </Button>
          )}

          {/* Next Alert */}
          {masterNextAlert && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Bell className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-sm text-amber-200 truncate">
                <span className="font-semibold">
                  {masterNextAlert.daysUntil === 0 ? 'Today' : 
                   masterNextAlert.daysUntil === 1 ? 'Tomorrow' : 
                   `In ${masterNextAlert.daysUntil}d`}:
                </span>{' '}
                {masterNextAlert.message}
              </span>
            </div>
          )}

          {/* Active Targets */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground">
              <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Active Environment Targets
            </div>
            
            {masterTargets ? (
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div className="p-2.5 md:p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                  <Thermometer className="h-4 w-4 md:h-5 md:w-5 text-red-400 mx-auto mb-1 md:mb-2" />
                  <p className="text-lg md:text-2xl font-bold text-foreground">{masterTargets.temp}°</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">Temp</p>
                </div>
                <div className="p-2.5 md:p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <Droplets className="h-4 w-4 md:h-5 md:w-5 text-blue-400 mx-auto mb-1 md:mb-2" />
                  <p className="text-lg md:text-2xl font-bold text-foreground">{masterTargets.humidity}%</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">RH</p>
                </div>
                <div className="p-2.5 md:p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                  <Wind className="h-4 w-4 md:h-5 md:w-5 text-purple-400 mx-auto mb-1 md:mb-2" />
                  <p className="text-lg md:text-2xl font-bold text-foreground">{masterTargets.vpd.toFixed(1)}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">VPD</p>
                </div>
              </div>
            ) : (
              <div className="p-3 md:p-4 rounded-xl bg-muted/30 text-center">
                <p className="text-xs md:text-sm text-muted-foreground">
                  {masterPlant?.strain_id 
                    ? 'No environment targets defined in strain passport'
                    : 'Link a strain to see environment targets'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Neighbors Analysis */}
      {neighborPlants.length > 0 && (
        <Card className="border border-border/50">
          <CardContent className="p-4 md:p-5 space-y-3 md:space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-base md:text-lg text-foreground">Neighbors</h3>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Compatibility check</p>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">
                {neighborPlants.length} plants
              </Badge>
            </div>

            {/* Neighbor Cards */}
            <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none">
              {neighborPlants.map((plant) => {
                const stageInfo = calculateStageInfo(plant.start_date, plant.growing_params);
                const neighborTargets = getEnvironmentTargets(plant.growing_params, stageInfo?.stageName || null);
                const nextAlert = getNextAlert(plant.start_date, plant.growing_params);
                const plantAge = calculatePlantAge(plant.start_date);

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

                const displayPhoto = plant.photo_url || plant.strain_photo_url;

                return (
                  <div
                    key={plant.id}
                    className={`min-w-[280px] md:min-w-0 snap-start p-3 rounded-xl border transition-all ${
                      compatibility ? statusStyles[compatibility.status] : 'bg-muted/30 border-border/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Photo */}
                      {displayPhoto ? (
                        <div 
                          className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-cover bg-center border border-border shrink-0"
                          style={{ backgroundImage: `url(${displayPhoto})` }}
                        />
                      ) : (
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                          <Star className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm md:text-base text-foreground truncate">
                          {plant.custom_name || 'Unnamed'}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {plant.strain_name || 'Unknown Strain'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {stageInfo && (
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {stageInfo.stageName}
                            </Badge>
                          )}
                          {plantAge !== null && (
                            <span className="text-[10px] text-muted-foreground">
                              Day {plantAge}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Icon */}
                      {compatibility && (
                        <StatusIcon className={`h-5 w-5 shrink-0 ${statusColor[compatibility.status]}`} />
                      )}
                    </div>

                    {/* Compatibility Message */}
                    {compatibility && (
                      <div className="mt-2.5 text-xs">
                        <p className={`font-medium ${statusColor[compatibility.status]}`}>
                          {compatibility.message}
                        </p>
                        <p className="text-muted-foreground mt-0.5">{compatibility.details}</p>
                      </div>
                    )}

                    {/* Next Alert */}
                    {nextAlert && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
                        <Bell className="h-3 w-3" />
                        <span className="truncate">
                          {nextAlert.daysUntil === 0 ? 'Today' : 
                           nextAlert.daysUntil === 1 ? 'Tomorrow' : 
                           `In ${nextAlert.daysUntil}d`}: {nextAlert.message}
                        </span>
                      </div>
                    )}

                    {/* Set as Master Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full mt-2 text-xs gap-1.5 h-8"
                      onClick={() => setMaster(plant.id)}
                      disabled={isSettingMaster}
                    >
                      <Crown className="h-3.5 w-3.5" />
                      Set as Master
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
