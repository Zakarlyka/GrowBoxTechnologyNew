import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sprout, 
  Plus, 
  AlertTriangle, 
  Leaf, 
  Crown,
  Flower2,
  Droplets,
  Sun,
  Clock,
  Link2
} from 'lucide-react';
import { AllPlantsDrawer } from '@/components/laboratory/AllPlantsDrawer';
import { AddPlantDialog } from '@/components/AddPlantDialog';
import { 
  usePlantsWithStrains, 
  calculateStageInfo, 
  getEnvironmentTargets,
  getNextAlert 
} from '@/hooks/usePlantsWithStrains';
import { calculatePlantAge } from '@/hooks/usePlantData';

const stageIcons: Record<string, React.ElementType> = {
  seedling: Sprout,
  vegetation: Leaf,
  flowering: Flower2,
  flushing: Droplets,
  drying: Sun,
};

const stageColors: Record<string, string> = {
  seedling: 'text-lime-400',
  vegetation: 'text-emerald-400',
  flowering: 'text-purple-400',
  flushing: 'text-sky-400',
  drying: 'text-amber-400',
};

interface ActivePlantContextProps {
  deviceId: string; // UUID (id column)
  deviceStringId: string; // String device_id column
}

export function ActivePlantContext({ deviceId, deviceStringId }: ActivePlantContextProps) {
  const [addPlantOpen, setAddPlantOpen] = useState(false);
  const { plants, isLoading } = usePlantsWithStrains();
  
  // Filter plants for this device
  const devicePlants = plants?.filter(p => p.device_id === deviceStringId) || [];
  
  // Find master plant for this device (is_main AND matches device)
  const activePlant = devicePlants.find(p => p.is_main) || devicePlants[0];
  
  // Calculate stage info for active plant
  const stageInfo = activePlant 
    ? calculateStageInfo(activePlant.start_date, activePlant.growing_params)
    : null;
  
  const plantAge = activePlant?.start_date 
    ? calculatePlantAge(activePlant.start_date)
    : null;
  
  const nextAlert = activePlant
    ? getNextAlert(activePlant.start_date, activePlant.growing_params)
    : null;
  
  const stageTargets = stageInfo && activePlant
    ? getEnvironmentTargets(activePlant.growing_params, stageInfo.stageName)
    : null;
  
  const stage = stageInfo?.stageName || 'seedling';
  const StageIcon = stageIcons[stage] || Sprout;
  const stageColor = stageColors[stage] || stageColors.seedling;

  // Determine alert message
  const getAlertMessage = () => {
    if (!activePlant) {
      return null;
    }
    
    // Missing strain preset
    if (!activePlant.strain_id) {
      return {
        type: 'warning' as const,
        message: 'No preset for this plant',
        icon: Link2,
        action: 'Link to Strain Library'
      };
    }
    
    // Missing targets for stage
    if (!stageTargets && stageInfo) {
      return {
        type: 'warning' as const,
        message: `No preset for ${stageInfo.stageName} stage`,
        icon: AlertTriangle,
        action: null
      };
    }
    
    // Next alert from timeline
    if (nextAlert && nextAlert.daysUntil <= 3) {
      return {
        type: 'info' as const,
        message: `${nextAlert.daysUntil === 0 ? 'Today' : nextAlert.daysUntil === 1 ? 'Tomorrow' : `In ${nextAlert.daysUntil} days`}: ${nextAlert.message}`,
        icon: Clock,
        action: null
      };
    }
    
    return null;
  };

  const alertInfo = getAlertMessage();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card/50 animate-pulse">
        <div className="w-10 h-10 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-xl border border-border/50 bg-card/50">
      {/* Left: Master Plant Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {activePlant ? (
          <>
            {/* Plant Icon/Photo */}
            <div className={`p-2.5 rounded-lg bg-background/60 border border-border/30 ${stageColor}`}>
              {activePlant.photo_url || activePlant.strain_photo_url ? (
                <img 
                  src={activePlant.photo_url || activePlant.strain_photo_url || ''} 
                  alt={activePlant.custom_name || 'Plant'}
                  className="w-8 h-8 rounded object-cover"
                />
              ) : (
                <StageIcon className="h-5 w-5" />
              )}
            </div>
            
            {/* Name & Badges */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {activePlant.is_main && (
                  <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                <span className="font-semibold text-foreground truncate">
                  {activePlant.custom_name || 'Unnamed Plant'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {plantAge && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    Day {plantAge}
                  </Badge>
                )}
                {stageInfo && (
                  <Badge variant="secondary" className={`text-xs px-1.5 py-0 capitalize ${stageColor}`}>
                    {stageInfo.stageName}
                  </Badge>
                )}
                {activePlant.strain_name && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">
                    {activePlant.strain_name}
                  </Badge>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
              <Sprout className="h-5 w-5" />
            </div>
            <span className="text-sm">No active plant selected</span>
          </div>
        )}
      </div>

      {/* Center: Alerts Area */}
      {alertInfo && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          alertInfo.type === 'warning' 
            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            : 'bg-primary/10 border border-primary/20 text-primary'
        }`}>
          <alertInfo.icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{alertInfo.message}</span>
        </div>
      )}

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <AllPlantsDrawer deviceFilter={deviceStringId}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Leaf className="h-4 w-4" />
            <span className="hidden sm:inline">🌿 My Plants</span>
            <span className="sm:hidden">🌿</span>
            {devicePlants.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center text-xs">
                {devicePlants.length}
              </Badge>
            )}
          </Button>
        </AllPlantsDrawer>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9"
          onClick={() => setAddPlantOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <AddPlantDialog 
        open={addPlantOpen} 
        onOpenChange={setAddPlantOpen}
        deviceId={deviceStringId}
        onPlantAdded={() => {}}
      />
    </div>
  );
}
