import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
  Clock
} from 'lucide-react';
import { calculatePlantAge, PLANT_STAGES } from '@/hooks/usePlantData';
import { Json } from '@/integrations/supabase/types';

interface GrowingParams {
  stages?: Array<{
    name: string;
    days: number;
  }>;
  timeline_alerts?: Array<{
    trigger_stage: string;
    day_offset: number;
    message: string;
    type?: string;
  }>;
  environment_targets?: Array<{
    stage: string;
    temp_day?: number;
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
  device_id: string | null;
  strain_id: number | null;
  library_strains?: {
    name: string;
    flowering_days: number | null;
    photo_url: string | null;
    growing_params: Json | null;
  } | null;
  devices?: {
    id: string;
    name: string;
  } | null;
}

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
}

export const AllPlantsDrawer = ({ children }: AllPlantsDrawerProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: plants, isLoading } = useQuery({
    queryKey: ['all-plants-drawer'],
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
          device_id,
          strain_id,
          library_strains (name, flowering_days, photo_url, growing_params)
        `)
        .eq('user_id', userData.user.id)
        .neq('current_stage', 'harvested')
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching plants:', error);
        return [];
      }

      // Fetch device names for each plant
      const plantsWithDevices = await Promise.all(
        (data || []).map(async (plant) => {
          if (plant.device_id) {
            const { data: deviceData } = await supabase
              .from('devices')
              .select('id, name')
              .eq('device_id', plant.device_id)
              .maybeSingle();
            return { ...plant, devices: deviceData };
          }
          return { ...plant, devices: null };
        })
      );

      return plantsWithDevices;
    },
    enabled: open,
  });

  const getStageLabel = (stage: string | null) => {
    const found = PLANT_STAGES.find((s) => s.value === stage);
    return found?.label || stage || 'Unknown';
  };

  // Calculate which stage the plant is in
  const calculateStageInfo = (startDate: string | null, growingParams: GrowingParams | null) => {
    if (!startDate || !growingParams?.stages) return null;
    
    const age = calculatePlantAge(startDate);
    if (age === null) return null;

    let cumulativeDays = 0;
    for (const stage of growingParams.stages) {
      if (age <= cumulativeDays + stage.days) {
        const dayInStage = age - cumulativeDays;
        return {
          stageName: stage.name,
          dayInStage,
          stageDuration: stage.days,
        };
      }
      cumulativeDays += stage.days;
    }

    const lastStage = growingParams.stages[growingParams.stages.length - 1];
    return {
      stageName: lastStage?.name || 'Complete',
      dayInStage: age - (cumulativeDays - (lastStage?.days || 0)),
      stageDuration: lastStage?.days || 0,
    };
  };

  // Find the next upcoming alert
  const getNextAlert = (startDate: string | null, growingParams: GrowingParams | null) => {
    if (!startDate || !growingParams?.timeline_alerts || !growingParams?.stages) return null;

    const age = calculatePlantAge(startDate);
    if (age === null) return null;

    const stageStartDays: Record<string, number> = {};
    let cumulativeDays = 0;
    for (const stage of growingParams.stages) {
      stageStartDays[stage.name.toLowerCase()] = cumulativeDays;
      cumulativeDays += stage.days;
    }

    const alertsWithDays = growingParams.timeline_alerts
      .map(alert => {
        const stageKey = alert.trigger_stage?.toLowerCase() || '';
        const stageStart = stageStartDays[stageKey] ?? 0;
        const absoluteDay = stageStart + (alert.day_offset || 0);
        return { ...alert, absoluteDay };
      })
      .filter(alert => alert.absoluteDay > age)
      .sort((a, b) => a.absoluteDay - b.absoluteDay);

    if (alertsWithDays.length === 0) return null;

    const nextAlert = alertsWithDays[0];
    const daysUntil = nextAlert.absoluteDay - age;

    return {
      message: nextAlert.message,
      daysUntil,
      type: nextAlert.type || 'info',
    };
  };

  // Get current stage targets
  const getStageTargets = (growingParams: GrowingParams | null, currentStage: string | null) => {
    if (!growingParams?.environment_targets || !currentStage) return null;

    const stageTarget = growingParams.environment_targets.find(
      t => t.stage?.toLowerCase() === currentStage?.toLowerCase()
    );

    if (!stageTarget) return null;

    return {
      vpd: stageTarget.vpd_target,
      humidity: stageTarget.humidity_min !== undefined && stageTarget.humidity_max !== undefined
        ? Math.round((stageTarget.humidity_min + stageTarget.humidity_max) / 2)
        : undefined,
      temp: stageTarget.temp_day,
    };
  };

  const calculateProgress = (startDate: string | null, floweringDays: number | null) => {
    if (!startDate || !floweringDays) return null;
    const age = calculatePlantAge(startDate);
    if (age === null) return null;
    const percentage = Math.min(Math.round((age / floweringDays) * 100), 100);
    return { percentage, currentDay: age, totalDays: floweringDays };
  };

  const handleGoToDevice = (deviceId: string) => {
    setOpen(false);
    navigate(`/device/${deviceId}`);
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
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
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
                
                const strainData = plant.library_strains as Plant['library_strains'];
                const strainName = strainData?.name;
                const floweringDays = strainData?.flowering_days;
                const photoUrl = strainData?.photo_url;
                const growingParams = strainData?.growing_params as GrowingParams | null;
                
                const progress = calculateProgress(plant.start_date, floweringDays);
                const stageInfo = calculateStageInfo(plant.start_date, growingParams);
                const nextAlert = getNextAlert(plant.start_date, growingParams);
                const stageTargets = getStageTargets(growingParams, stage);

                return (
                  <div
                    key={plant.id}
                    className="relative rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all cursor-pointer group"
                    onClick={() => plant.devices?.id && handleGoToDevice(plant.devices.id)}
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
                          <h4 className="text-base md:text-lg font-bold text-foreground truncate">
                            {plant.custom_name || 'Unnamed Plant'}
                          </h4>
                          {strainName && (
                            <Badge 
                              variant="secondary" 
                              className="mt-1 bg-background/60 backdrop-blur-sm text-[10px] md:text-xs"
                            >
                              {strainName}
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
                          {plant.devices?.name && (
                            <span className="text-[10px] md:text-xs text-muted-foreground ml-auto">
                              📍 {plant.devices.name}
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
                        <div className="flex items-center gap-1.5 md:gap-2 p-2 md:p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <Bell className="h-4 w-4 text-amber-400 shrink-0" />
                          <span className="text-sm text-amber-200 truncate">
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
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                          <Target className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm text-foreground/80">
                            <span className="font-semibold">Target:</span>{' '}
                            {stageTargets.vpd && `VPD ${stageTargets.vpd}`}
                            {stageTargets.humidity && ` • ${stageTargets.humidity}% RH`}
                            {stageTargets.temp && ` • ${stageTargets.temp}°C`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
                          <span className="text-sm text-muted-foreground italic">
                            {getStageLabel(stage)}
                          </span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      {plant.devices?.id && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
