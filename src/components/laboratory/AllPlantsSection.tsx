import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sprout, 
  Leaf, 
  Flower2, 
  Droplets, 
  Sun, 
  Clock,
  Crown,
  Plus,
  Pencil,
  Archive,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  usePlantsWithStrains,
  calculateStageInfo,
  calculateProgress,
  getTotalLifecycleDays,
  PlantWithStrain
} from '@/hooks/usePlantsWithStrains';
import { AddPlantDialog } from '@/components/AddPlantDialog';
import { EditPlantDialog } from '@/components/EditPlantDialog';
import { PlantDetailsDialog } from '@/components/laboratory/PlantDetailsDialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDevices } from '@/hooks/useDevices';
import { useQueryClient } from '@tanstack/react-query';

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

/**
 * All Plants Section with device context awareness
 * - Filters plants by selected device
 * - Archive functionality
 * - Card click opens edit dialog
 */
export const AllPlantsSection = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const selectedDeviceId = searchParams.get('device');
  
  const { devices } = useDevices();
  const selectedDevice = devices.find(d => d.id === selectedDeviceId);
  
  const [showArchived, setShowArchived] = useState(false);
  const { plants, isLoading, refetch, isSettingMaster } = usePlantsWithStrains({ 
    excludeHarvested: !showArchived 
  });
  const [addPlantOpen, setAddPlantOpen] = useState(false);
  const [editPlant, setEditPlant] = useState<PlantWithStrain | null>(null);
  const [detailsPlant, setDetailsPlant] = useState<PlantWithStrain | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);

  // Filter plants by selected device
  const filteredPlants = selectedDevice 
    ? plants?.filter(p => p.device_id === selectedDevice.device_id) || []
    : plants || [];
  
  // Sort: master first, then by created_at
  const sortedPlants = [...filteredPlants].sort((a, b) => {
    if (a.is_main && !b.is_main) return -1;
    if (!a.is_main && b.is_main) return 1;
    return 0;
  });

  // Filter archived vs active
  const activePlants = sortedPlants.filter(p => p.current_stage !== 'harvested');
  const archivedPlants = sortedPlants.filter(p => p.current_stage === 'harvested');
  const displayPlants = showArchived ? archivedPlants : activePlants;

  const handleSetMaster = async (plantId: string) => {
    if (!selectedDevice) {
      toast({
        title: 'Error',
        description: 'Please select a device first',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Unset all masters for THIS device only
      await supabase
        .from('plants')
        .update({ is_main: false })
        .eq('device_id', selectedDevice.device_id);

      // Set the selected plant as master
      const { error } = await supabase
        .from('plants')
        .update({ is_main: true })
        .eq('id', plantId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['plants-with-strains'] });
      queryClient.invalidateQueries({ queryKey: ['main-plant'] });
      
      toast({
        title: '👑 Master Plant Updated',
        description: 'Environment targets will now follow this plant.',
      });
      
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to set master plant',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (plantId: string) => {
    setArchiving(plantId);
    try {
      const { error } = await supabase
        .from('plants')
        .update({ current_stage: 'harvested', is_main: false })
        .eq('id', plantId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['plants-with-strains'] });
      
      toast({
        title: '📦 Plant Archived',
        description: 'Moved to harvest/archive.',
      });
      
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to archive plant',
        variant: 'destructive',
      });
    } finally {
      setArchiving(null);
    }
  };

  // Click on card body -> open details
  const handleCardClick = (plant: PlantWithStrain) => {
    setDetailsPlant(plant);
  };
  
  // Click on pencil icon -> open edit
  const handleEditClick = (plant: PlantWithStrain, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditPlant(plant);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  // No device selected message
  if (!selectedDevice && devices.length > 0) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Sprout className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Select a device to view plants</p>
          <p className="text-xs text-muted-foreground/70">Use the dropdown in the header</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Archive Toggle */}
      {(activePlants.length > 0 || archivedPlants.length > 0) && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">
            {showArchived 
              ? `${archivedPlants.length} archived` 
              : `${activePlants.length} active`
            }
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                Show Active
              </>
            ) : archivedPlants.length > 0 ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                View Archive ({archivedPlants.length})
              </>
            ) : null}
          </Button>
        </div>
      )}

      {displayPlants.length === 0 && !showArchived ? (
        <Card 
          className="border-dashed border-2 border-muted-foreground/20 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setAddPlantOpen(true)}
        >
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Plus className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No plants yet</p>
            <p className="text-xs text-muted-foreground/70">Click to add your first plant</p>
          </CardContent>
        </Card>
      ) : displayPlants.length === 0 && showArchived ? (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Archive className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No archived plants</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayPlants.map((plant) => {
            const stage = plant.current_stage || 'seedling';
            const StageIcon = stageIcons[stage] || Sprout;
            const stageTextColor = stageColors[stage] || stageColors.seedling;
            const progressBarColor = stageBgColors[stage] || stageBgColors.seedling;
            
            const photoUrl = plant.photo_url || plant.strain_photo_url;
            const totalDays = getTotalLifecycleDays(plant.growing_params, plant.flowering_days);
            const progress = calculateProgress(plant.start_date, totalDays);
            const stageInfo = calculateStageInfo(plant.start_date, plant.growing_params);
            const isMaster = plant.is_main;
            const isArchived = plant.current_stage === 'harvested';

            return (
              <Card
                key={plant.id}
                className={`group relative overflow-hidden transition-all cursor-pointer ${
                  isMaster
                    ? 'border-2 border-warning/40 bg-warning/5'
                    : isArchived
                    ? 'opacity-60 border-muted'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleCardClick(plant)}
              >
                <CardContent className="p-3 space-y-2">
                  {/* Header */}
                  <div className="flex items-start gap-2">
                    {/* Photo */}
                    {photoUrl ? (
                      <div
                        className="w-10 h-10 rounded-lg bg-cover bg-center border border-border shrink-0"
                        style={{ backgroundImage: `url(${photoUrl})` }}
                      />
                    ) : (
                      <div className={`p-2 rounded-lg bg-muted/50 ${stageTextColor}`}>
                        <StageIcon className="h-5 w-5" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isMaster && <Crown className="h-3.5 w-3.5 text-warning shrink-0" />}
                        <h4 className="font-semibold text-sm text-foreground truncate">
                          {plant.custom_name || 'Unnamed'}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {plant.strain_name || 'Unknown Strain'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {stageInfo && (
                          <Badge variant="outline" className={`text-[10px] capitalize px-1.5 py-0 ${stageTextColor}`}>
                            {stageInfo.stageName}
                          </Badge>
                        )}
                        {progress && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            Day {progress.currentDay}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {progress && !isArchived && (
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                      <div
                        className={`h-full transition-all duration-500 ${progressBarColor}`}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  {!isArchived && (
                    <div className="flex items-center gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                      {!isMaster && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs h-7 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetMaster(plant.id);
                          }}
                          disabled={isSettingMaster}
                        >
                          <Crown className="h-3 w-3" />
                          Set Master
                        </Button>
                      )}
                      {isMaster && (
                        <Badge className="flex-1 justify-center bg-warning/20 text-warning border-warning/30 text-xs h-7">
                          👑 Current Master
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={(e) => handleEditClick(plant, e)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(plant.id);
                        }}
                        disabled={archiving === plant.id}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          
          {/* Add Plant Card - only show in active view */}
          {!showArchived && (
            <Card
              className="cursor-pointer transition-all hover:shadow-lg border-dashed border-2 border-muted-foreground/20 hover:border-primary/50 flex items-center justify-center min-h-[140px]"
              onClick={() => setAddPlantOpen(true)}
            >
              <CardContent className="flex flex-col items-center justify-center text-center p-4">
                <div className="p-3 rounded-full bg-primary/10 mb-2">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Add Plant</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Dialogs */}
      <AddPlantDialog
        open={addPlantOpen}
        onOpenChange={setAddPlantOpen}
        onPlantAdded={refetch}
        deviceId={selectedDevice?.device_id}
      />
      
      {editPlant && (
        <EditPlantDialog
          plant={editPlant}
          open={!!editPlant}
          onOpenChange={(open) => !open && setEditPlant(null)}
          onPlantUpdated={refetch}
          onPlantDeleted={refetch}
        />
      )}
      
      {detailsPlant && (
        <PlantDetailsDialog
          plant={detailsPlant}
          open={!!detailsPlant}
          onOpenChange={(open) => !open && setDetailsPlant(null)}
        />
      )}
    </>
  );
};
