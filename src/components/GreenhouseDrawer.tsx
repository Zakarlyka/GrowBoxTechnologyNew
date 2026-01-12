import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Leaf, Star, Trash2, Archive, Loader2, ChevronRight, Sprout } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PLANT_STAGES, calculatePlantAge } from '@/hooks/usePlantData';

interface PlantItem {
  id: string;
  custom_name: string | null;
  photo_url: string | null;
  start_date: string | null;
  current_stage: string | null;
  is_main: boolean | null;
  strain_id: number | null;
  strain_name?: string | null;
}

interface GreenhouseDrawerProps {
  deviceId: string; // UUID
  deviceUuid: string; // text device_id for queries
  onPlantsChanged: () => void;
  children?: React.ReactNode;
}

export function GreenhouseDrawer({ deviceId, deviceUuid, onPlantsChanged, children }: GreenhouseDrawerProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; plant: PlantItem | null; isMain: boolean }>({
    open: false,
    plant: null,
    isMain: false,
  });
  const [archiveDialog, setArchiveDialog] = useState<{ open: boolean; plant: PlantItem | null }>({
    open: false,
    plant: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch ALL plants for this device
  const { data: plants, isLoading, refetch } = useQuery({
    queryKey: ['all-plants', deviceUuid],
    queryFn: async (): Promise<PlantItem[]> => {
      if (!deviceUuid) return [];

      const { data, error } = await supabase
        .from('plants')
        .select(`
          id,
          custom_name,
          photo_url,
          start_date,
          current_stage,
          is_main,
          strain_id,
          library_strains (
            name
          )
        `)
        .eq('device_id', deviceUuid)
        .neq('current_stage', 'harvested') // Exclude harvested/archived
        .order('is_main', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching plants:', error);
        return [];
      }

      return (data || []).map((p: any) => ({
        id: p.id,
        custom_name: p.custom_name,
        photo_url: p.photo_url,
        start_date: p.start_date,
        current_stage: p.current_stage,
        is_main: p.is_main,
        strain_id: p.strain_id,
        strain_name: p.library_strains?.name || null,
      }));
    },
    enabled: open && !!deviceUuid,
  });

  const getStageLabel = (stage: string | null): string => {
    const found = PLANT_STAGES.find((s) => s.value === stage);
    return found?.label || stage || 'Невідомо';
  };

  const handleMakeMain = async (plant: PlantItem) => {
    setIsProcessing(true);
    try {
      // First, unset current main plant
      await supabase
        .from('plants')
        .update({ is_main: false })
        .eq('device_id', deviceUuid)
        .eq('is_main', true);

      // Set new main plant
      const { error } = await supabase
        .from('plants')
        .update({ is_main: true })
        .eq('id', plant.id);

      if (error) throw error;

      toast({
        title: '⭐ Основну рослину змінено',
        description: `"${plant.custom_name || 'Рослина'}" тепер основна`,
      });

      // Refresh all plant queries
      await queryClient.invalidateQueries({ queryKey: ['main-plant', deviceId] });
      await queryClient.invalidateQueries({ queryKey: ['all-plants', deviceUuid] });
      await refetch();
      onPlantsChanged();
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.plant) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', deleteDialog.plant.id);

      if (error) throw error;

      toast({
        title: '🗑️ Рослину видалено',
        description: `"${deleteDialog.plant.custom_name || 'Рослина'}" видалено`,
      });

      // Refresh queries
      await queryClient.invalidateQueries({ queryKey: ['main-plant', deviceId] });
      await queryClient.invalidateQueries({ queryKey: ['all-plants', deviceUuid] });
      await refetch();
      onPlantsChanged();
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setDeleteDialog({ open: false, plant: null, isMain: false });
    }
  };

  const handleArchive = async () => {
    if (!archiveDialog.plant) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('plants')
        .update({ 
          current_stage: 'harvested',
          is_main: false // Remove main status when harvesting
        })
        .eq('id', archiveDialog.plant.id);

      if (error) throw error;

      toast({
        title: '🌾 Урожай зібрано!',
        description: `"${archiveDialog.plant.custom_name || 'Рослина'}" переміщено до архіву`,
      });

      // Refresh queries
      await queryClient.invalidateQueries({ queryKey: ['main-plant', deviceId] });
      await queryClient.invalidateQueries({ queryKey: ['all-plants', deviceUuid] });
      await refetch();
      onPlantsChanged();
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setArchiveDialog({ open: false, plant: null });
    }
  };

  const activePlants = plants?.filter(p => p.current_stage !== 'harvested') || [];
  const mainPlant = activePlants.find(p => p.is_main);
  const secondaryPlants = activePlants.filter(p => !p.is_main);

  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {children || (
            <Button variant="outline" className="gap-2">
              <Sprout className="h-4 w-4" />
              Мої рослини
              {activePlants.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activePlants.length}
                </Badge>
              )}
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh] w-full max-w-full flex flex-col overflow-hidden">
          <DrawerHeader className="text-left shrink-0 px-4">
            <DrawerTitle className="flex items-center gap-2 break-words">
              <Sprout className="h-5 w-5 text-accent shrink-0" />
              <span className="truncate">🌿 Мої рослини</span>
            </DrawerTitle>
            <DrawerDescription className="break-words whitespace-normal">
              Керуйте всіма рослинами цього пристрою
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 min-h-0 px-4 pb-4 overflow-y-auto overflow-x-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : activePlants.length === 0 ? (
              <div className="text-center py-8">
                <Leaf className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Немає активних рослин</p>
                <p className="text-sm text-muted-foreground/70">
                  Додайте рослину через "Посадити нову рослину"
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Main Plant Section */}
                {mainPlant && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Основна рослина
                    </h4>
                    <PlantCard
                      plant={mainPlant}
                      isMain={true}
                      onMakeMain={() => {}}
                      onDelete={() => setDeleteDialog({ open: true, plant: mainPlant, isMain: true })}
                      onArchive={() => setArchiveDialog({ open: true, plant: mainPlant })}
                      getStageLabel={getStageLabel}
                      isProcessing={isProcessing}
                    />
                  </div>
                )}

                {/* Secondary Plants Section */}
                {secondaryPlants.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-4">
                      Додаткові рослини ({secondaryPlants.length})
                    </h4>
                    {secondaryPlants.map((plant) => (
                      <PlantCard
                        key={plant.id}
                        plant={plant}
                        isMain={false}
                        onMakeMain={() => handleMakeMain(plant)}
                        onDelete={() => setDeleteDialog({ open: true, plant, isMain: false })}
                        onArchive={() => setArchiveDialog({ open: true, plant })}
                        getStageLabel={getStageLabel}
                        isProcessing={isProcessing}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Закрити</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🗑️ Видалити рослину?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Ви впевнені, що хочете видалити "{deleteDialog.plant?.custom_name || 'Рослина'}"?
              </p>
              {deleteDialog.isMain && (
                <p className="text-amber-500 font-medium">
                  ⚠️ Це основна рослина! Після видалення автоматизація зупиниться, 
                  доки ви не оберете нову основну рослину.
                </p>
              )}
              <p className="text-muted-foreground">
                Цю дію неможливо скасувати. Якщо ви хочете зберегти історію, скористайтеся опцією "Зібрати урожай".
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Видалити назавжди
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialog.open} onOpenChange={(open) => setArchiveDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🌾 Зібрати урожай?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Перемістити "{archiveDialog.plant?.custom_name || 'Рослина'}" до архіву?
              </p>
              <p className="text-muted-foreground">
                Рослина буде позначена як "Урожай зібрано" і зникне з активного списку, 
                але її історія збережеться для аналітики.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={isProcessing}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              🌾 Зібрати урожай
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Individual Plant Card Component
interface PlantCardProps {
  plant: PlantItem;
  isMain: boolean;
  onMakeMain: () => void;
  onDelete: () => void;
  onArchive: () => void;
  getStageLabel: (stage: string | null) => string;
  isProcessing: boolean;
}

function PlantCard({ plant, isMain, onMakeMain, onDelete, onArchive, getStageLabel, isProcessing }: PlantCardProps) {
  const plantAge = calculatePlantAge(plant.start_date);

  return (
    <div className={`p-3 sm:p-4 rounded-lg border transition-colors max-w-full overflow-hidden ${
      isMain 
        ? 'bg-accent/10 border-accent/50' 
        : 'bg-card border-border/50 hover:border-border'
    }`}>
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Avatar */}
        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-border/50 shrink-0">
          <AvatarImage src={plant.photo_url || undefined} alt={plant.custom_name || 'Plant'} />
          <AvatarFallback className="bg-accent/10">
            <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <h4 className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none text-sm sm:text-base">
              {plant.custom_name || 'Безіменна рослина'}
            </h4>
            {isMain && (
              <Badge variant="outline" className="text-[10px] sm:text-xs text-accent border-accent/50 shrink-0 px-1.5 sm:px-2">
                <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 fill-current" />
                <span className="hidden sm:inline">Основна</span>
                <span className="sm:hidden">★</span>
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
            {plant.strain_name && <span className="truncate max-w-[100px] sm:max-w-none">{plant.strain_name}</span>}
            {plant.strain_name && plantAge !== null && <span>•</span>}
            {plantAge !== null && <span className="whitespace-nowrap">День {plantAge}</span>}
          </div>
          <Badge variant="secondary" className="text-[10px] sm:text-xs mt-1">
            {getStageLabel(plant.current_stage)}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {!isMain && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
              onClick={onMakeMain}
              disabled={isProcessing}
              title="Зробити основною"
            >
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
            onClick={onArchive}
            disabled={isProcessing}
            title="Зібрати урожай"
          >
            <Archive className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
            disabled={isProcessing}
            title="Видалити"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
