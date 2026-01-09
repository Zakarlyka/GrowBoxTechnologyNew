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
  Bell,
  Sprout,
  Leaf,
  Flower2,
  Sun
} from 'lucide-react';
import { calculatePlantAge } from '@/hooks/usePlantData';
import { 
  usePlantsWithStrains,
  calculateStageInfo,
  getEnvironmentTargets,
  getNextAlert,
  CalculatedTargets
} from '@/hooks/usePlantsWithStrains';

const stageIcons: Record<string, React.ElementType> = {
  seedling: Sprout,
  vegetation: Leaf,
  flowering: Flower2,
  flushing: Droplets,
  drying: Sun,
};

const stageGradients: Record<string, string> = {
  seedling: 'from-lime-500/20 to-lime-500/5',
  vegetation: 'from-emerald-500/20 to-emerald-500/5',
  flowering: 'from-purple-500/20 to-purple-500/5',
  flushing: 'from-sky-500/20 to-sky-500/5',
  drying: 'from-amber-500/20 to-amber-500/5',
};

const stageTextColors: Record<string, string> = {
  seedling: 'text-lime-400',
  vegetation: 'text-emerald-400',
  flowering: 'text-purple-400',
  flushing: 'text-sky-400',
  drying: 'text-amber-400',
};

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
  
  const stage = masterStageInfo?.stageName || 'seedling';
  const StageIcon = stageIcons[stage] || Sprout;
  const stageGradient = stageGradients[stage] || stageGradients.seedling;
  const stageColor = stageTextColors[stage] || stageTextColors.seedling;

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Master Plant Hero Card - DOMINANT */}
      <Card className={`relative overflow-hidden border-2 border-amber-500/40 bg-gradient-to-br ${stageGradient} shadow-lg shadow-amber-500/10`}>
        {/* Background Image with Active Glow */}
        {displayPhoto && (
          <div className="absolute inset-0 pointer-events-none">
            <div 
              className="absolute inset-0 bg-cover bg-center scale-110 blur-xl opacity-30"
              style={{ backgroundImage: `url(${displayPhoto})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background/95" />
          </div>
        )}
        
        {/* Active Glow Ring */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-transparent to-primary/20 blur-xl opacity-50" />
        </div>
        
        <CardContent className="relative p-4 md:p-6 space-y-4">
          {/* Header with Crown Badge */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 shadow-inner">
                <Crown className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg md:text-xl text-foreground">🌟 The Master Plant</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Dictates the environment</p>
              </div>
            </div>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-xs md:text-sm px-3 py-1">
              👑 Controller
            </Badge>
          </div>

          {/* Plant Identity Card */}
          {masterPlant && (
            <div className="flex items-center gap-4 p-3 md:p-4 rounded-2xl bg-background/70 backdrop-blur-sm border border-border/50 shadow-sm">
              {displayPhoto ? (
                <div 
                  className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-cover bg-center border-2 border-amber-500/40 shrink-0 shadow-lg"
                  style={{ backgroundImage: `url(${displayPhoto})` }}
                />
              ) : (
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br ${stageGradient} border border-border/50 flex items-center justify-center shrink-0`}>
                  <StageIcon className={`h-8 w-8 ${stageColor}`} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg md:text-xl text-foreground truncate">
                  {masterPlant.custom_name || 'Unnamed Plant'}
                </h4>
                <p className="text-sm text-muted-foreground truncate">
                  {masterPlant.strain_name || 'Unknown Strain'}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {masterStageInfo && (
                    <Badge variant="secondary" className={`capitalize text-xs ${stageColor} bg-background/50`}>
                      {masterStageInfo.stageName}
                    </Badge>
                  )}
                  {masterAge !== null && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Day {masterAge}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Missing Strain Warning */}
          {masterPlant && !masterPlant.strain_id && (
            <Button 
              variant="outline" 
              className="w-full gap-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 h-12"
              onClick={() => navigate('/library')}
            >
              <AlertTriangle className="h-4 w-4" />
              <Link2 className="h-4 w-4" />
              ⚠️ Link Strain to Enable AI
            </Button>
          )}

          {/* Next Alert */}
          {masterNextAlert && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <Bell className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-sm text-amber-200">
                <span className="font-semibold">
                  {masterNextAlert.daysUntil === 0 ? '🔔 Today' : 
                   masterNextAlert.daysUntil === 1 ? '📅 Tomorrow' : 
                   `⏰ In ${masterNextAlert.daysUntil} days`}:
                </span>{' '}
                {masterNextAlert.message}
              </span>
            </div>
          )}

          {/* Active Environment Targets - Prominent Display */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ArrowRight className="h-4 w-4 text-primary" />
              Active Environment Targets
            </div>
            
            {masterTargets ? (
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div className="p-3 md:p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center shadow-sm">
                  <Thermometer className="h-5 w-5 text-red-400 mx-auto mb-1" />
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{masterTargets.temp}°</p>
                  <p className="text-xs text-muted-foreground">Temperature</p>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center shadow-sm">
                  <Droplets className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{masterTargets.humidity}%</p>
                  <p className="text-xs text-muted-foreground">Humidity</p>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center shadow-sm">
                  <Wind className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{masterTargets.vpd.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">VPD kPa</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-center">
                <p className="text-sm text-muted-foreground">
                  {masterPlant?.strain_id 
                    ? 'No environment targets defined in strain preset'
                    : 'Link a strain from the Library to see targets'}
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
