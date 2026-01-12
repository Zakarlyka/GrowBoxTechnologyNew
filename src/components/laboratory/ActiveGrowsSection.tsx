import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sprout, 
  Leaf, 
  Flower2, 
  Droplets, 
  Sun, 
  Bell, 
  Clock,
  Crown,
  AlertTriangle,
  Plus,
  Layers
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  usePlantsWithStrains,
  calculateStageInfo,
  getEnvironmentTargets,
  getNextAlert,
  calculateProgress,
  getTotalLifecycleDays,
  PlantWithStrain
} from '@/hooks/usePlantsWithStrains';
import { AddPlantDialog } from '@/components/AddPlantDialog';
import { StrainDetailsDialog } from '@/components/library/StrainDetailsDialog';
import { supabase } from '@/integrations/supabase/client';
import { useDevices } from '@/hooks/useDevices';
import type { LibraryStrainFull } from '@/types';
import { toast } from 'sonner';

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

const stageBgColors: Record<string, string> = {
  seedling: 'bg-lime-500',
  vegetation: 'bg-emerald-500',
  flowering: 'bg-purple-500',
  flushing: 'bg-sky-500',
  drying: 'bg-amber-500',
};

export const ActiveGrowsSection = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const selectedDeviceUUID = searchParams.get('device');
  
  const { plants: allPlants, masterPlant: globalMasterPlant, isLoading, refetch } = usePlantsWithStrains();
  const { devices } = useDevices();
  const [addPlantOpen, setAddPlantOpen] = useState(false);
  const [selectedStrainId, setSelectedStrainId] = useState<number | null>(null);

  // Get the device_id (string ID like "demo-123") from the UUID
  const selectedDeviceStringId = useMemo(() => {
    if (!selectedDeviceUUID) return null;
    const device = devices.find(d => d.id === selectedDeviceUUID);
    return device?.device_id || null;
  }, [selectedDeviceUUID, devices]);

  // Filter plants by selected device OR group by device if "All Devices"
  const { filteredPlants, plantsByDevice, isAllDevices } = useMemo(() => {
    if (!selectedDeviceStringId) {
      // "All Devices" mode - group by device
      const grouped: Record<string, { deviceName: string; plants: PlantWithStrain[] }> = {};
      allPlants.forEach(plant => {
        const deviceId = plant.device_id || 'unassigned';
        const deviceName = plant.device?.name || 'Unknown Device';
        if (!grouped[deviceId]) {
          grouped[deviceId] = { deviceName, plants: [] };
        }
        grouped[deviceId].plants.push(plant);
      });
      return { filteredPlants: allPlants, plantsByDevice: grouped, isAllDevices: true };
    }
    
    // Filter to specific device
    const filtered = allPlants.filter(plant => plant.device_id === selectedDeviceStringId);
    return { filteredPlants: filtered, plantsByDevice: {}, isAllDevices: false };
  }, [allPlants, selectedDeviceStringId]);

  // Master plant for this specific device (or global if all devices)
  const masterPlant = useMemo(() => {
    if (isAllDevices) return globalMasterPlant;
    return filteredPlants.find(p => p.is_main) || filteredPlants[0] || null;
  }, [filteredPlants, globalMasterPlant, isAllDevices]);

  // Set master mutation - only affects plants in the same device
  const setMasterMutation = useMutation({
    mutationFn: async (plantId: string) => {
      const plant = filteredPlants.find(p => p.id === plantId);
      if (!plant) throw new Error('Plant not found');
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Only unset main for plants on the SAME device
      if (plant.device_id) {
        await supabase
          .from('plants')
          .update({ is_main: false })
          .eq('user_id', userData.user.id)
          .eq('device_id', plant.device_id);
      }

      // Set the selected plant as main
      const { error } = await supabase
        .from('plants')
        .update({ is_main: true })
        .eq('id', plantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants-with-strains'] });
      queryClient.invalidateQueries({ queryKey: ['main-plant'] });
      queryClient.invalidateQueries({ queryKey: ['master-plants'] });
      toast.success('Master plant updated for this device');
    },
    onError: () => {
      toast.error('Failed to update master plant');
    },
  });

  // Fetch selected strain for dialog
  const { data: selectedStrain } = useQuery({
    queryKey: ['strain-detail', selectedStrainId],
    queryFn: async () => {
      if (!selectedStrainId) return null;
      const { data, error } = await supabase
        .from('library_strains')
        .select('*')
        .eq('id', selectedStrainId)
        .single();
      if (error) throw error;
      return data as unknown as LibraryStrainFull;
    },
    enabled: !!selectedStrainId,
  });

  // Get master plant targets for compatibility check
  const masterStageInfo = masterPlant 
    ? calculateStageInfo(masterPlant.start_date, masterPlant.growing_params)
    : null;
  const masterTargets = masterStageInfo 
    ? getEnvironmentTargets(masterPlant?.growing_params || null, masterStageInfo.stageName)
    : null;

  const handlePlantClick = (plant: PlantWithStrain) => {
    // Open the strain details dialog if the plant has a strain_id
    if (plant.strain_id) {
      setSelectedStrainId(plant.strain_id);
    }
  };

  // Check if a plant has climate conflict with master (>15% deviation)
  const hasClimateConflict = (plant: PlantWithStrain): boolean => {
    if (!masterTargets || plant.is_main) return false;
    
    const stageInfo = calculateStageInfo(plant.start_date, plant.growing_params);
    const plantTargets = stageInfo 
      ? getEnvironmentTargets(plant.growing_params, stageInfo.stageName)
      : null;
    
    if (!plantTargets) return false;
    
    const humidityDiff = Math.abs(masterTargets.humidity - plantTargets.humidity);
    return humidityDiff > 15;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 md:h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  if (filteredPlants.length === 0) {
    return (
      <>
        <Card 
          className="border-dashed border-2 border-muted-foreground/20 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setAddPlantOpen(true)}
        >
          <CardContent className="flex flex-col items-center justify-center py-6 md:py-8 text-center">
            <Plus className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50 mb-2 md:mb-3" />
            <p className="text-sm md:text-base text-muted-foreground">
              {selectedDeviceStringId ? 'Немає рослин в цьому гроубоксі' : 'Немає активних рослин'}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground/70">
              Натисніть, щоб додати першу рослину
            </p>
          </CardContent>
        </Card>
        <AddPlantDialog
          open={addPlantOpen}
          onOpenChange={setAddPlantOpen}
          deviceId={selectedDeviceStringId || undefined}
          onPlantAdded={refetch}
        />
      </>
    );
  }

  // Render plant card helper
  const renderPlantCard = (plant: PlantWithStrain) => {
    const stage = plant.current_stage || 'seedling';
    const StageIcon = stageIcons[stage] || Sprout;
    const stageTextColor = stageColors[stage] || stageColors.seedling;
    const progressBarColor = stageBgColors[stage] || stageBgColors.seedling;
    
    const photoUrl = plant.photo_url || plant.strain_photo_url;
    const totalDays = getTotalLifecycleDays(plant.growing_params, plant.flowering_days);
    const progress = calculateProgress(plant.start_date, totalDays);
    const stageInfo = calculateStageInfo(plant.start_date, plant.growing_params);
    const nextAlert = getNextAlert(plant.start_date, plant.growing_params);
    const isConflict = hasClimateConflict(plant);
    const isMaster = plant.is_main;

    return (
      <Card
        key={plant.id}
        className={`group cursor-pointer transition-all hover:shadow-xl relative overflow-hidden min-h-[180px] md:min-h-[200px] ${
          isMaster 
            ? 'border-2 border-amber-500/40 hover:border-amber-500/60' 
            : isConflict 
              ? 'border-2 border-red-500/40 hover:border-red-500/60'
              : 'hover:border-primary/50'
        }`}
        onClick={() => handlePlantClick(plant)}
      >
        {/* Background Image */}
        {photoUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${photoUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/60" />
          </div>
        )}
        
        {/* Fallback gradient if no image */}
        {!photoUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted" />
        )}

        <CardContent className="relative p-3 md:p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2 md:mb-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {isMaster && (
                  <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                <h4 className="font-bold text-base md:text-lg text-foreground truncate leading-tight">
                  {plant.custom_name || 'Unnamed Plant'}
                </h4>
              </div>
              {plant.strain_name && (
                <Badge variant="secondary" className="mt-1 text-[10px] md:text-xs font-medium bg-background/60 backdrop-blur-sm">
                  {plant.strain_name}
                </Badge>
              )}
            </div>
            <div className={`p-1.5 md:p-2 rounded-lg bg-background/60 backdrop-blur-sm ${stageTextColor}`}>
              <StageIcon className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          </div>

          {/* Stage Info with Day Counter */}
          {stageInfo && (
            <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm mb-2 md:mb-3">
              <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
              <span className={`font-semibold capitalize ${stageTextColor}`}>
                {stageInfo.stageName}
              </span>
              <span className="text-muted-foreground">
                Day {stageInfo.dayInStage}/{stageInfo.stageDuration}
              </span>
            </div>
          )}

          {/* Location - only show in All Devices mode */}
          {isAllDevices && plant.device?.name && (
            <p className="text-[10px] md:text-xs text-muted-foreground mb-2 md:mb-3 truncate">
              📍 {plant.device.name}
            </p>
          )}

          {/* Climate Conflict Badge */}
          {isConflict && !isMaster && (
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs text-red-300">⚠️ Climate Conflict</span>
            </div>
          )}

          {/* Set as Master button - only if not already master */}
          {!isMaster && !isAllDevices && (
            <button
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-500/20 border border-border/50"
              onClick={(e) => {
                e.stopPropagation();
                setMasterMutation.mutate(plant.id);
              }}
              title="Set as Master Plant"
            >
              <Crown className="h-3.5 w-3.5 text-amber-500" />
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Timeline Progress Bar */}
          {progress && (
            <div className="space-y-1 md:space-y-1.5 mb-2 md:mb-3">
              <div className="flex justify-between text-[10px] md:text-xs">
                <span className="text-muted-foreground">Lifecycle</span>
                <span className="font-bold text-foreground">
                  Day {progress.currentDay} / {progress.totalDays}
                </span>
              </div>
              <div className="relative h-2 md:h-2.5 w-full overflow-hidden rounded-full bg-muted/60 backdrop-blur-sm">
                <div 
                  className={`h-full transition-all duration-500 ${progressBarColor}`}
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Next Alert - Prominent Display */}
          {nextAlert && (
            <div className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] md:text-xs">
              <Bell className="h-3 w-3 md:h-3.5 md:w-3.5 text-amber-400 shrink-0" />
              <span className="text-amber-200 truncate">
                <span className="font-semibold">
                  {nextAlert.daysUntil === 0 ? '🔔 Today' : 
                   nextAlert.daysUntil === 1 ? '📅 Tomorrow' : 
                   `⏰ In ${nextAlert.daysUntil}d`}:
                </span>{' '}
                {nextAlert.message}
              </span>
            </div>
          )}

        </CardContent>
      </Card>
    );
  };

  // Render "All Devices" grouped view
  if (isAllDevices) {
    return (
      <div className="space-y-6">
        {Object.entries(plantsByDevice).map(([deviceId, { deviceName, plants }]) => (
          <div key={deviceId} className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="h-4 w-4" />
              <span className="font-medium">{deviceName}</span>
              <Badge variant="outline" className="text-xs">{plants.length} plants</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {plants.map(renderPlantCard)}
            </div>
          </div>
        ))}
        
        {/* Add Plant Card */}
        <Card
          className="group cursor-pointer transition-all hover:shadow-xl border-dashed border-2 border-muted-foreground/20 hover:border-primary/50 min-h-[180px] md:min-h-[200px] flex items-center justify-center"
          onClick={() => setAddPlantOpen(true)}
        >
          <CardContent className="flex flex-col items-center justify-center text-center p-4">
            <div className="p-4 rounded-full bg-primary/10 mb-3">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Додати рослину</p>
          </CardContent>
        </Card>
        
        <AddPlantDialog
          open={addPlantOpen}
          onOpenChange={setAddPlantOpen}
          onPlantAdded={refetch}
        />
        
        {/* Strain Details Dialog */}
        {selectedStrainId && selectedStrain && (
          <StrainDetailsDialog
            strain={selectedStrain}
            open={!!selectedStrainId}
            onOpenChange={(open) => !open && setSelectedStrainId(null)}
            onGrowThis={() => setSelectedStrainId(null)}
          />
        )}
      </div>
    );
  }

  // Single device view
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
      {filteredPlants.map(renderPlantCard)}
      
      {/* Add Plant Card */}
      <Card
        className="group cursor-pointer transition-all hover:shadow-xl border-dashed border-2 border-muted-foreground/20 hover:border-primary/50 min-h-[180px] md:min-h-[200px] flex items-center justify-center"
        onClick={() => setAddPlantOpen(true)}
      >
        <CardContent className="flex flex-col items-center justify-center text-center p-4">
          <div className="p-4 rounded-full bg-primary/10 mb-3">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Додати рослину</p>
        </CardContent>
      </Card>
      
      {/* Add Plant Dialog - pre-select current device */}
      <AddPlantDialog
        open={addPlantOpen}
        onOpenChange={setAddPlantOpen}
        deviceId={selectedDeviceStringId || undefined}
        onPlantAdded={refetch}
      />
      
      {/* Strain Details Dialog */}
      {selectedStrainId && selectedStrain && (
        <StrainDetailsDialog
          strain={selectedStrain}
          open={!!selectedStrainId}
          onOpenChange={(open) => !open && setSelectedStrainId(null)}
          onGrowThis={() => setSelectedStrainId(null)}
        />
      )}
    </div>
  );
};
