import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Crown, 
  Sprout, 
  Leaf, 
  Flower2, 
  Droplets, 
  Sun,
  AlertTriangle,
  ArrowRight,
  Thermometer,
  Wind,
  Clock,
  Link2
} from 'lucide-react';
import { calculatePlantAge } from '@/hooks/usePlantData';
import { 
  usePlantsWithStrains,
  calculateStageInfo,
  getEnvironmentTargets,
} from '@/hooks/usePlantsWithStrains';

const stageIcons: Record<string, React.ElementType> = {
  seedling: Sprout,
  vegetation: Leaf,
  flowering: Flower2,
  flushing: Droplets,
  drying: Sun,
};

const stageColors: Record<string, string> = {
  seedling: 'text-lime-400 border-lime-500/30 bg-lime-500/10',
  vegetation: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  flowering: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  flushing: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  drying: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
};

interface MasterPlantCardProps {
  deviceId: string; // UUID (id column)
  deviceStringId: string; // String device_id column
}

/**
 * Compact Master Plant Card for Dashboard cockpit view.
 * Shows ONLY the current Master Plant with key targets.
 */
export function MasterPlantCard({ deviceId, deviceStringId }: MasterPlantCardProps) {
  const navigate = useNavigate();
  const { plants, masterPlant, isLoading } = usePlantsWithStrains();
  
  // Filter plants for this device
  const devicePlants = plants?.filter(p => p.device_id === deviceStringId) || [];
  
  // Get the master plant for this device (or the global master)
  const activePlant = devicePlants.find(p => p.is_main) || masterPlant;
  
  // Calculate stage info
  const stageInfo = activePlant 
    ? calculateStageInfo(activePlant.start_date, activePlant.growing_params)
    : null;
  
  const targets = activePlant && stageInfo
    ? getEnvironmentTargets(activePlant.growing_params, stageInfo.stageName)
    : null;
  
  const plantAge = activePlant?.start_date 
    ? calculatePlantAge(activePlant.start_date)
    : null;
  
  const stage = stageInfo?.stageName || 'seedling';
  const StageIcon = stageIcons[stage] || Sprout;
  const stageStyle = stageColors[stage] || stageColors.seedling;
  const displayPhoto = activePlant?.photo_url || activePlant?.strain_photo_url;

  if (isLoading) {
    return (
      <Card className="border border-border/50 bg-card/50">
        <CardContent className="p-4">
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  // No Master Plant - Show placeholder with CTA
  if (!activePlant) {
    return (
      <Card className="border-2 border-dashed border-muted-foreground/30 bg-muted/20">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-muted/50 border border-border/30">
              <Sprout className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">No Active Plant</h3>
              <p className="text-sm text-muted-foreground">Select a plant to control the environment</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/laboratory')}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <ArrowRight className="h-4 w-4" />
            Go to Lab
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Master Plant exists - Cockpit card
  return (
    <Card className="relative overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
      {/* Subtle background photo */}
      {displayPhoto && (
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute inset-0 bg-cover bg-center scale-110 blur-xl opacity-20"
            style={{ backgroundImage: `url(${displayPhoto})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
        </div>
      )}
      
      <CardContent className="relative p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Left: Plant identity */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Photo or Icon */}
            {displayPhoto ? (
              <div 
                className="w-14 h-14 rounded-xl bg-cover bg-center border-2 border-amber-500/40 shrink-0 shadow-lg"
                style={{ backgroundImage: `url(${displayPhoto})` }}
              />
            ) : (
              <div className={`p-3 rounded-xl border ${stageStyle} shrink-0`}>
                <StageIcon className="h-6 w-6" />
              </div>
            )}
            
            {/* Name & Meta */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="font-bold text-foreground truncate">
                  {activePlant.custom_name || 'Master Plant'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {stageInfo && (
                  <Badge variant="secondary" className={`text-xs capitalize px-2 py-0.5 ${stageStyle}`}>
                    {stageInfo.stageName}
                  </Badge>
                )}
                {plantAge !== null && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Day {plantAge}
                  </span>
                )}
                {activePlant.strain_name && (
                  <span className="text-xs text-muted-foreground truncate hidden sm:block">
                    • {activePlant.strain_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center: Environment Targets (compact) */}
          {targets ? (
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-red-400">
                  <Thermometer className="h-3.5 w-3.5" />
                  <span className="font-bold text-lg">{targets.temp}°</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Target</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-blue-400">
                  <Droplets className="h-3.5 w-3.5" />
                  <span className="font-bold text-lg">{targets.humidity}%</span>
                </div>
                <span className="text-[10px] text-muted-foreground">RH</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-purple-400">
                  <Wind className="h-3.5 w-3.5" />
                  <span className="font-bold text-lg">{targets.vpd.toFixed(1)}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">VPD</span>
              </div>
            </div>
          ) : !activePlant.strain_id ? (
            /* Missing strain warning */
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
              onClick={() => navigate('/library')}
            >
              <AlertTriangle className="h-4 w-4" />
              <Link2 className="h-4 w-4" />
              Link Strain
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">No targets defined</span>
          )}

          {/* Right: Lab button */}
          <Button 
            variant="ghost" 
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => navigate('/laboratory')}
          >
            <span className="hidden sm:inline">Manage</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
