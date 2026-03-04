import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SmartHelp } from '@/components/ui/smart-help';
import { useTranslation } from 'react-i18next';
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
  Layers,
  Package,
  Pencil,
  CheckCircle } from
'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  usePlantsWithStrains,
  calculateStageInfo,
  getEnvironmentTargets,
  getNextAlert,
  calculateProgress,
  getTotalLifecycleDays,
  PlantWithStrain } from
'@/hooks/usePlantsWithStrains';
import {
  useAutoStageTransition,
  getStageDisplayInfo,
  calculateStageFromAge,
  normalizeStageNameForDB } from
'@/hooks/usePlantLifecycle';
import { AddPlantDialog } from '@/components/AddPlantDialog';
import { PlantDetailsDialog } from '@/components/laboratory/PlantDetailsDialog';
import { EditPlantDialog } from '@/components/EditPlantDialog';
import { supabase } from '@/integrations/supabase/client';
import { useDevices } from '@/hooks/useDevices';
import { toast } from 'sonner';

const stageIcons: Record<string, React.ElementType> = {
  seedling: Sprout,
  vegetation: Leaf,
  flowering: Flower2,
  flushing: Droplets,
  drying: Sun,
  harvested: CheckCircle
};

const stageColors: Record<string, string> = {
  seedling: 'text-lime-400',
  vegetation: 'text-emerald-400',
  flowering: 'text-purple-400',
  flushing: 'text-sky-400',
  drying: 'text-amber-400',
  harvested: 'text-green-500'
};

const stageBgColors: Record<string, string> = {
  seedling: 'bg-lime-500',
  vegetation: 'bg-emerald-500',
  flowering: 'bg-purple-500',
  flushing: 'bg-sky-500',
  drying: 'bg-amber-500',
  harvested: 'bg-green-600'
};

export const ActiveGrowsSection = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedDeviceUUID = searchParams.get('device');

  const { plants: allPlants, masterPlant: globalMasterPlant, isLoading, refetch } = usePlantsWithStrains();
  const { devices } = useDevices();
  const [addPlantOpen, setAddPlantOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<PlantWithStrain | null>(null);
  const [editingPlant, setEditingPlant] = useState<PlantWithStrain | null>(null);

  // AUTO-TRANSITION: Check and update plant stages on mount
  // This ensures stages are always synchronized with the timeline
  useAutoStageTransition(allPlants);

  // Get the device_id (string ID like "demo-123") from the UUID
  const selectedDeviceStringId = useMemo(() => {
    if (!selectedDeviceUUID) return null;
    const device = devices.find((d) => d.id === selectedDeviceUUID);
    return device?.device_id || null;
  }, [selectedDeviceUUID, devices]);

  // Filter plants by selected device OR group by device if "All Devices"
  const { filteredPlants, plantsByDevice, isAllDevices } = useMemo(() => {
    if (!selectedDeviceStringId) {
      // "All Devices" mode - group by device with proper ordering
      const grouped: Record<string, {deviceName: string;plants: PlantWithStrain[];}> = {};
      const unassigned: PlantWithStrain[] = [];

      allPlants.forEach((plant) => {
        if (!plant.device_id) {
          unassigned.push(plant);
          return;
        }
        const deviceId = plant.device_id;
        const deviceName = plant.device?.name || 'Unknown Device';
        if (!grouped[deviceId]) {
          grouped[deviceId] = { deviceName, plants: [] };
        }
        grouped[deviceId].plants.push(plant);
      });

      // Build ordered result: devices first, then unassigned
      const orderedGroups: Record<string, {deviceName: string;plants: PlantWithStrain[];}> = {};
      Object.entries(grouped).
      sort(([, a], [, b]) => a.deviceName.localeCompare(b.deviceName)).
      forEach(([key, val]) => {orderedGroups[key] = val;});

      if (unassigned.length > 0) {
        orderedGroups['__unassigned__'] = { deviceName: '📦 Без пристрою', plants: unassigned };
      }

      return { filteredPlants: allPlants, plantsByDevice: orderedGroups, isAllDevices: true };
    }

    // Filter to specific device
    const filtered = allPlants.filter((plant) => plant.device_id === selectedDeviceStringId);
    return { filteredPlants: filtered, plantsByDevice: {}, isAllDevices: false };
  }, [allPlants, selectedDeviceStringId]);

  // Master plant for this specific device (or global if all devices)
  const masterPlant = useMemo(() => {
    if (isAllDevices) return globalMasterPlant;
    return filteredPlants.find((p) => p.is_main) || filteredPlants[0] || null;
  }, [filteredPlants, globalMasterPlant, isAllDevices]);

  // Set master mutation - only affects plants in the same device
  const setMasterMutation = useMutation({
    mutationFn: async (plantId: string) => {
      const plant = filteredPlants.find((p) => p.id === plantId);
      if (!plant) throw new Error('Plant not found');

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Only unset main for plants on the SAME device
      if (plant.device_id) {
        await supabase.
        from('plants').
        update({ is_main: false }).
        eq('user_id', userData.user.id).
        eq('device_id', plant.device_id);
      }

      // Set the selected plant as main
      const { error } = await supabase.
      from('plants').
      update({ is_main: true }).
      eq('id', plantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants-with-strains'] });
      queryClient.invalidateQueries({ queryKey: ['main-plant'] });
      queryClient.invalidateQueries({ queryKey: ['master-plants'] });
      toast.success(t('plants.masterUpdated'));
    },
    onError: () => {
      toast.error(t('plants.masterUpdateFailed'));
    }
  });

  // Get master plant targets for compatibility check
  const masterStageInfo = masterPlant ?
  calculateStageInfo(masterPlant.start_date, masterPlant.growing_params) :
  null;
  const masterTargets = masterStageInfo ?
  getEnvironmentTargets(masterPlant?.growing_params || null, masterStageInfo.stageName) :
  null;

  const handlePlantClick = (plant: PlantWithStrain) => {
    setSelectedPlant(plant);
  };

  const handleNavigateToDevice = (deviceId: string) => {
    navigate(`/device/${deviceId}`);
  };
  // Check if a plant has climate conflict with master (>15% deviation)
  const hasClimateConflict = (plant: PlantWithStrain): boolean => {
    if (!masterTargets || plant.is_main) return false;

    const stageInfo = calculateStageInfo(plant.start_date, plant.growing_params);
    const plantTargets = stageInfo ?
    getEnvironmentTargets(plant.growing_params, stageInfo.stageName) :
    null;

    if (!plantTargets) return false;

    const humidityDiff = Math.abs(masterTargets.humidity - plantTargets.humidity);
    return humidityDiff > 15;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {[1, 2, 3].map((i) =>
        <Skeleton key={i} className="h-40 md:h-48 rounded-xl" />
        )}
      </div>);

  }

  if (filteredPlants.length === 0) {
    return (
      <>
        <Card
          className="border-dashed border-2 border-muted-foreground/20 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setAddPlantOpen(true)}>
          
          <CardContent className="flex flex-col items-center justify-center py-6 md:py-8 text-center">
            <Plus className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50 mb-2 md:mb-3" />
            <p className="text-sm md:text-base text-muted-foreground">
              {selectedDeviceStringId ? t('plants.noPlants') : t('plants.noActivePlants')}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground/70">
              {t('plants.clickToAdd')}
            </p>
          </CardContent>
        </Card>
        <AddPlantDialog
          open={addPlantOpen}
          onOpenChange={setAddPlantOpen}
          deviceId={selectedDeviceStringId || undefined}
          onPlantAdded={refetch} />
        
      </>);

  }

  // Render plant card helper
  const renderPlantCard = (plant: PlantWithStrain) => {
    // Check for missing critical data
    const hasMissingData = !plant.start_date || !plant.strain_id;

    // USE SMART LIFECYCLE CALCULATION instead of raw DB data
    const smartStageInfo = getStageDisplayInfo(
      plant.start_date,
      plant.current_stage,
      plant.growing_params
    );

    // Use calculated stage (not raw DB) for icon/color lookups
    const displayStageName = normalizeStageNameForDB(smartStageInfo.stageName);
    const StageIcon = stageIcons[displayStageName] || Sprout;
    const stageTextColor = stageColors[displayStageName] || stageColors.seedling;
    const progressBarColor = stageBgColors[displayStageName] || stageBgColors.seedling;

    const photoUrl = plant.photo_url || plant.strain_photo_url;
    const totalDays = getTotalLifecycleDays(plant.growing_params, plant.flowering_days);
    const progress = calculateProgress(plant.start_date, totalDays);
    const nextAlert = getNextAlert(plant.start_date, plant.growing_params);
    const isConflict = hasClimateConflict(plant);
    const isMaster = plant.is_main;

    return (
      <SmartHelp content={t('help.plantCard')} isText={false}>
        <Card
          key={plant.id}
          className={`group cursor-pointer transition-all hover:shadow-xl relative overflow-hidden min-h-[180px] md:min-h-[200px] ${
          isMaster ?
          'border-2 border-amber-500/40 hover:border-amber-500/60' :
          isConflict ?
          'border-2 border-red-500/40 hover:border-red-500/60' :
          'hover:border-primary/50'}`
          }
          onClick={() => handlePlantClick(plant)}>
          
        {/* Background Image */}
        {photoUrl &&
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${photoUrl})` }}>
            
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/60" />
          </div>
          }
        
        {/* Fallback gradient if no image */}
        {!photoUrl &&
          <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted" />
          }

        <CardContent className="relative p-3 md:p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2 md:mb-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {isMaster &&
                  <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                  }
                <h4 className="font-bold text-base md:text-lg text-foreground truncate leading-tight">
                  {plant.custom_name || t('plants.unnamedPlant')}
                </h4>
              </div>
              {plant.strain_name &&
                <Badge variant="secondary" className="mt-1 text-[10px] md:text-xs font-medium bg-background/60 backdrop-blur-sm">
                  {plant.strain_name}
                </Badge>
                }
            </div>
            <div className={`p-1.5 md:p-2 rounded-lg bg-background/60 backdrop-blur-sm ${stageTextColor}`}>
              <StageIcon className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          </div>

          {/* Stage Info with Day Counter - USES SMART CALCULATION */}
          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm mb-2 md:mb-3">
            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
            <span className={`font-semibold capitalize ${stageTextColor}`}>
              {smartStageInfo.stageName}
            </span>
            <span className="text-muted-foreground">
              {smartStageInfo.dayLabel}
            </span>
            {smartStageInfo.isOverdue &&
              <Badge variant="destructive" className="text-[9px] px-1 py-0">
                {t('plants.overdue')}
              </Badge>
              }
          </div>

          {/* Location - only show in All Devices mode */}
          {isAllDevices && plant.device?.name &&
            <p className="text-[10px] md:text-xs text-muted-foreground mb-2 md:mb-3 truncate">
              📍 {plant.device.name}
            </p>
            }

          {/* Missing Data Badge */}
          {hasMissingData &&
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-xs text-yellow-300">⚠️ {!plant.strain_id ? t('plants.noStrain') : t('plants.dataMissing')}</span>
            </div>
            }

          {/* Climate Conflict Badge */}
          {isConflict && !isMaster && !hasMissingData &&
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs text-red-300">⚠️ {t('plants.climateConflict')}</span>
            </div>
            }

          {/* Action Buttons - Top Right Corner */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Edit Button - ALWAYS visible on hover */}
            <button
                className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-primary/20 border border-border/50"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingPlant(plant);
                }}
                title={t('plants.editPlant')}>
                
              <Pencil className="h-3.5 w-3.5 text-primary" />
            </button>
            
            {/* Set as Master button - only if not already master */}
            {!isMaster && !isAllDevices &&
              <button
                className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-amber-500/20 border border-border/50"
                onClick={(e) => {
                  e.stopPropagation();
                  setMasterMutation.mutate(plant.id);
                }}
                title={t('plants.setAsMaster')}>
                
                <Crown className="h-3.5 w-3.5 text-amber-500" />
              </button>
              }
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Timeline Progress Bar - CAPPED AT 100% */}
          {progress &&
            <div className="space-y-1 md:space-y-1.5 mb-2 md:mb-3">
              <div className="flex justify-between text-[10px] md:text-xs">
                <span className="text-muted-foreground">{t('plants.lifecycle')}</span>
                <span className="font-bold text-foreground">
                  {t('growHistory.day')} {Math.min(progress.currentDay, progress.totalDays)} / {progress.totalDays}
                  {progress.currentDay > progress.totalDays && ' ✓'}
                </span>
              </div>
              <div className="relative h-2 md:h-2.5 w-full overflow-hidden rounded-full bg-muted/60 backdrop-blur-sm">
                <div
                  className={`h-full transition-all duration-500 ${progressBarColor}`}
                  style={{ width: `${Math.min(progress.percentage, 100)}%` }} />
                
              </div>
            </div>
            }

          {/* Next Alert - Prominent Display */}
          {nextAlert &&
            <div className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] md:text-xs">
              <Bell className="h-3 w-3 md:h-3.5 md:w-3.5 text-amber-400 shrink-0" />
              <span className="text-amber-200 truncate">
                <span className="font-semibold">
                  {nextAlert.daysUntil === 0 ? `🔔 ${t('plants.today')}` :
                  nextAlert.daysUntil === 1 ? `📅 ${t('plants.tomorrow')}` :
                  `⏰ ${t('plants.inDays', { days: nextAlert.daysUntil })}`}:
                </span>{' '}
                {nextAlert.message}
              </span>
            </div>
            }

        </CardContent>
        </Card>
      </SmartHelp>);

  };

  // Render "All Devices" grouped view
  if (isAllDevices) {
    return (
      <div className="space-y-6">
        {Object.entries(plantsByDevice).map(([deviceId, { deviceName, plants }]) =>
        <div key={deviceId} className="border border-border/20 rounded-xl p-4 md:p-6 bg-muted">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                {deviceId === '__unassigned__' ?
              <Package className="h-4 w-4 text-primary" /> :
              <Layers className="h-4 w-4 text-primary" />
              }
              </div>
              <span className="text-base md:text-lg font-bold text-foreground">
                {deviceId === '__unassigned__' ? '📦 Без пристрою' : `🌱 ${deviceName}`}
              </span>
              <Badge variant="outline" className="text-xs">{plants.length}</Badge>
            </div>
            <Separator className="mt-3" />
            {plants.length === 0 ?
          <p className="text-sm text-muted-foreground mt-4">{t('plants.noActivePlants')}</p> :

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {plants.map(renderPlantCard)}
              </div>
          }
          </div>
        )}
        
        {/* Add Plant Card */}
        <Card
          className="group cursor-pointer transition-all hover:shadow-xl border-dashed border-2 border-muted-foreground/20 hover:border-primary/50 min-h-[180px] md:min-h-[200px] flex items-center justify-center"
          onClick={() => setAddPlantOpen(true)}>
          
          <CardContent className="flex flex-col items-center justify-center text-center p-4">
            <div className="p-4 rounded-full bg-primary/10 mb-3">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{t('plants.addPlant')}</p>
          </CardContent>
        </Card>
        
        <AddPlantDialog
          open={addPlantOpen}
          onOpenChange={setAddPlantOpen}
          onPlantAdded={refetch} />
        
        
        {/* Plant Details Dialog */}
        <PlantDetailsDialog
          plant={selectedPlant}
          open={!!selectedPlant}
          onOpenChange={(open) => !open && setSelectedPlant(null)}
          onNavigateToDevice={handleNavigateToDevice}
          onEditPlant={(plant) => {
            setSelectedPlant(null);
            setEditingPlant(plant);
          }} />
        
        
        {/* Edit Plant Dialog */}
        {editingPlant &&
        <EditPlantDialog
          open={!!editingPlant}
          onOpenChange={(open) => !open && setEditingPlant(null)}
          plant={{
            id: editingPlant.id,
            custom_name: editingPlant.custom_name,
            start_date: editingPlant.start_date,
            strain_id: editingPlant.strain_id,
            device_id: editingPlant.device_id,
            is_main: editingPlant.is_main
          }}
          onPlantUpdated={() => {
            refetch();
            setEditingPlant(null);
          }}
          onPlantDeleted={() => {
            refetch();
            setEditingPlant(null);
          }} />

        }
      </div>);

  }

  // Single device view
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
      {filteredPlants.map(renderPlantCard)}
      
      {/* Add Plant Card */}
      <Card
        className="group cursor-pointer transition-all hover:shadow-xl border-dashed border-2 border-muted-foreground/20 hover:border-primary/50 min-h-[180px] md:min-h-[200px] flex items-center justify-center"
        onClick={() => setAddPlantOpen(true)}>
        
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
        onPlantAdded={refetch} />
      
      
      {/* Plant Details Dialog */}
      <PlantDetailsDialog
        plant={selectedPlant}
        open={!!selectedPlant}
        onOpenChange={(open) => !open && setSelectedPlant(null)}
        onNavigateToDevice={handleNavigateToDevice}
        onEditPlant={(plant) => {
          setSelectedPlant(null);
          setEditingPlant(plant);
        }} />
      
      
      {/* Edit Plant Dialog */}
      {editingPlant &&
      <EditPlantDialog
        open={!!editingPlant}
        onOpenChange={(open) => !open && setEditingPlant(null)}
        plant={{
          id: editingPlant.id,
          custom_name: editingPlant.custom_name,
          start_date: editingPlant.start_date,
          strain_id: editingPlant.strain_id,
          device_id: editingPlant.device_id,
          is_main: editingPlant.is_main
        }}
        onPlantUpdated={() => {
          refetch();
          setEditingPlant(null);
        }}
        onPlantDeleted={() => {
          refetch();
          setEditingPlant(null);
        }} />

      }
    </div>);

};