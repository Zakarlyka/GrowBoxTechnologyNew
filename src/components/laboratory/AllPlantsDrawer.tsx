import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Leaf, 
  ExternalLink, 
  Bell, 
  Target, 
  Sprout, 
  Flower2, 
  Droplets,
  Sun,
  Clock,
  Crown
} from 'lucide-react';
import { calculatePlantAge } from '@/hooks/usePlantData';
import { 
  usePlantsWithStrains,
  calculateStageInfo,
  getEnvironmentTargets,
  getNextAlert,
  calculateProgress,
  getTotalLifecycleDays,
  PlantWithStrain
} from '@/hooks/usePlantsWithStrains';

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

interface AllPlantsDrawerProps {
  children?: React.ReactNode;
  deviceFilter?: string; // Optional: filter plants by device_id
}

export const AllPlantsDrawer = ({ children, deviceFilter }: AllPlantsDrawerProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { plants: allPlants, isLoading, setMaster, isSettingMaster } = usePlantsWithStrains();
  
  // Filter plants by device if deviceFilter is provided
  const plants = deviceFilter 
    ? allPlants?.filter(p => p.device_id === deviceFilter)
    : allPlants;

  const handleGoToDevice = (deviceId: string) => {
    setOpen(false);
    navigate(`/device/${deviceId}`);
  };

  const handleSetAsMaster = (e: React.MouseEvent, plantId: string) => {
    e.stopPropagation();
    setMaster(plantId);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <Leaf className="h-4 w-4" />
            🌿 Всі рослини
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-[400px] p-0 overflow-x-hidden">
        <SheetHeader className="p-4 md:p-6 pb-3 md:pb-4 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 text-base md:text-lg">
            <div className="p-1.5 md:p-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <Leaf className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
            </div>
            Мої рослини
          </SheetTitle>
          <SheetDescription className="text-xs md:text-sm">
            {plants?.length || 0} активних рослин
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] md:h-[calc(100vh-120px)]">
          <div className="p-3 md:p-4 space-y-2.5 md:space-y-3">
            {isLoading ? (
              <div className="space-y-2.5 md:space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-36 md:h-44 w-full rounded-xl" />
                ))}
              </div>
            ) : !plants || plants.length === 0 ? (
              <div className="text-center py-12 md:py-16">
                <Leaf className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/30 mx-auto mb-3 md:mb-4" />
                <p className="text-sm md:text-base text-muted-foreground">Немає активних рослин</p>
              </div>
            ) : (
              plants.map((plant) => {
                const stage = plant.current_stage || 'seedling';
                const StageIcon = stageIcons[stage] || Sprout;
                const stageTextColor = stageColors[stage] || stageColors.seedling;
                const progressBarColor = stageBgColors[stage] || stageBgColors.seedling;
                
                const photoUrl = plant.photo_url || plant.strain_photo_url;
                const totalDays = getTotalLifecycleDays(plant.growing_params, plant.flowering_days);
                const progress = calculateProgress(plant.start_date, totalDays);
                const stageInfo = calculateStageInfo(plant.start_date, plant.growing_params);
                const nextAlert = getNextAlert(plant.start_date, plant.growing_params);
                const stageTargets = stageInfo 
                  ? getEnvironmentTargets(plant.growing_params, stageInfo.stageName)
                  : null;
                const isMaster = plant.is_main;

                return (
                  <div
                    key={plant.id}
                    className={`relative rounded-xl overflow-hidden border transition-all cursor-pointer group ${
                      isMaster 
                        ? 'border-2 border-amber-500/40 hover:border-amber-500/60' 
                        : 'border-border/50 hover:border-primary/50'
                    }`}
                    onClick={() => plant.device?.id && handleGoToDevice(plant.device.id)}
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0">
                      {photoUrl ? (
                        <>
                          <div 
                            className="absolute inset-0 bg-cover bg-center scale-110 blur-sm"
                            style={{ backgroundImage: `url(${photoUrl})` }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-muted to-background" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="relative p-3 md:p-4 space-y-2.5 md:space-y-3">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-2 md:gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {isMaster && (
                              <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                            )}
                            <h4 className="text-base md:text-lg font-bold text-foreground truncate">
                              {plant.custom_name || 'Unnamed Plant'}
                            </h4>
                          </div>
                          {plant.strain_name && (
                            <Badge 
                              variant="secondary" 
                              className="mt-1 bg-background/60 backdrop-blur-sm text-[10px] md:text-xs"
                            >
                              {plant.strain_name}
                            </Badge>
                          )}
                        </div>
                        <div className={`p-2 md:p-2.5 rounded-xl bg-background/60 backdrop-blur-sm ${stageTextColor}`}>
                          <StageIcon className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                      </div>

                      {/* Stage Info */}
                      {stageInfo && (
                        <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                          <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                          <span className={`font-semibold capitalize ${stageTextColor}`}>
                            {stageInfo.stageName}
                          </span>
                          <span className="text-muted-foreground">
                            Day {stageInfo.dayInStage}/{stageInfo.stageDuration}
                          </span>
                          {plant.device?.name && (
                            <span className="text-[10px] md:text-xs text-muted-foreground ml-auto">
                              📍 {plant.device.name}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Progress Bar */}
                      {progress && (
                        <div className="space-y-1 md:space-y-1.5">
                          <div className="flex justify-between text-[10px] md:text-xs">
                            <span className="text-muted-foreground">Progress</span>
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

                      {/* Bottom Row: Next Alert OR Stage Targets */}
                      {nextAlert ? (
                        <div className="flex items-start gap-1.5 md:gap-2 p-2 md:p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 min-w-0 overflow-hidden">
                          <Bell className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-amber-200 min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">
                            <span className="font-semibold">
                              {nextAlert.daysUntil === 0 
                                ? 'Today' 
                                : nextAlert.daysUntil === 1 
                                  ? 'Tomorrow' 
                                  : `In ${nextAlert.daysUntil} days`}:
                            </span>{' '}
                            {nextAlert.message}
                          </span>
                        </div>
                      ) : stageTargets ? (
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20 min-w-0 overflow-hidden">
                          <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground/80 min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">
                            <span className="font-semibold">Target:</span>{' '}
                            {stageTargets.vpd && `VPD ${stageTargets.vpd.toFixed(1)}`}
                            {stageTargets.humidity && ` • ${stageTargets.humidity}% RH`}
                            {stageTargets.temp && ` • ${stageTargets.temp}°C`}
                          </span>
                        </div>
                      ) : null}

                      {/* Set as Master Button */}
                      {!isMaster && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full text-xs gap-1.5 h-8 mt-1"
                          onClick={(e) => handleSetAsMaster(e, plant.id)}
                          disabled={isSettingMaster}
                        >
                          <Crown className="h-3.5 w-3.5" />
                          Set as Main Plant
                        </Button>
                      )}

                      {/* Hover Overlay */}
                      {plant.device?.id && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center">
                          <Button variant="outline" className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Open Dashboard
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
