import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sprout, Leaf, Flower2, Droplets, Sun, Droplet, BookOpen, Bell, Clock } from 'lucide-react';
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

export const ActiveGrowsSection = () => {
  const navigate = useNavigate();

  const { data: plants, isLoading } = useQuery({
    queryKey: ['active-plants'],
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
        .order('created_at', { ascending: false });

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
  });

  const handlePlantClick = (plant: Plant) => {
    if (plant.devices?.id) {
      navigate(`/device/${plant.devices.id}`);
    }
  };

  const getStageLabel = (stage: string | null) => {
    const found = PLANT_STAGES.find((s) => s.value === stage);
    return found?.label || stage || 'Unknown';
  };

  // Calculate which stage the plant is in and how many days into that stage
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
          stageStartDay: cumulativeDays,
        };
      }
      cumulativeDays += stage.days;
    }

    // Past all stages
    const lastStage = growingParams.stages[growingParams.stages.length - 1];
    return {
      stageName: lastStage?.name || 'Complete',
      dayInStage: age - (cumulativeDays - (lastStage?.days || 0)),
      stageDuration: lastStage?.days || 0,
      stageStartDay: cumulativeDays - (lastStage?.days || 0),
    };
  };

  // Find the next upcoming alert
  const getNextAlert = (startDate: string | null, growingParams: GrowingParams | null) => {
    if (!startDate || !growingParams?.timeline_alerts || !growingParams?.stages) return null;

    const age = calculatePlantAge(startDate);
    if (age === null) return null;

    // Build stage start days map
    const stageStartDays: Record<string, number> = {};
    let cumulativeDays = 0;
    for (const stage of growingParams.stages) {
      stageStartDays[stage.name.toLowerCase()] = cumulativeDays;
      cumulativeDays += stage.days;
    }

    // Find all alerts with their absolute day
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

  const calculateProgress = (startDate: string | null, floweringDays: number | null): { percentage: number; currentDay: number; totalDays: number } | null => {
    if (!startDate || !floweringDays) return null;
    const age = calculatePlantAge(startDate);
    if (age === null) return null;
    const percentage = Math.min(Math.round((age / floweringDays) * 100), 100);
    return { percentage, currentDay: age, totalDays: floweringDays };
  };

  const handleFeedClick = (e: React.MouseEvent, plantId: string) => {
    e.stopPropagation();
    const nutrientSection = document.getElementById('nutrient-calculator');
    if (nutrientSection) {
      nutrientSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDiaryClick = (e: React.MouseEvent, plant: Plant) => {
    e.stopPropagation();
    if (plant.devices?.id) {
      navigate(`/device/${plant.devices.id}`);
    }
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

  if (!plants || plants.length === 0) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20">
        <CardContent className="flex flex-col items-center justify-center py-6 md:py-8 text-center">
          <Sprout className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50 mb-2 md:mb-3" />
          <p className="text-sm md:text-base text-muted-foreground">Немає активних рослин</p>
          <p className="text-xs md:text-sm text-muted-foreground/70">
            Додайте рослину з Бібліотеки сортів
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
      {plants.map((plant) => {
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

        return (
          <Card
            key={plant.id}
            className="group cursor-pointer hover:border-primary/50 transition-all hover:shadow-xl relative overflow-hidden min-h-[180px] md:min-h-[200px]"
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
                  <h4 className="font-bold text-base md:text-lg text-foreground truncate leading-tight">
                    {plant.custom_name || 'Unnamed Plant'}
                  </h4>
                  {strainName && (
                    <Badge variant="secondary" className="mt-1 text-[10px] md:text-xs font-medium bg-background/60 backdrop-blur-sm">
                      {strainName}
                    </Badge>
                  )}
                </div>
                <div className={`p-1.5 md:p-2 rounded-lg bg-background/60 backdrop-blur-sm ${stageTextColor}`}>
                  <StageIcon className="h-4 w-4 md:h-5 md:w-5" />
                </div>
              </div>

              {/* Stage Info */}
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

              {/* Location */}
              {plant.devices?.name && (
                <p className="text-[10px] md:text-xs text-muted-foreground mb-2 md:mb-3 truncate">
                  📍 {plant.devices.name}
                </p>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Progress Bar */}
              {progress && (
                <div className="space-y-1 md:space-y-1.5 mb-2 md:mb-3">
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

              {/* Next Alert */}
              {nextAlert && (
                <div className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] md:text-xs">
                  <Bell className="h-3 w-3 md:h-3.5 md:w-3.5 text-amber-400 shrink-0" />
                  <span className="text-amber-200 truncate">
                    <span className="font-semibold">
                      {nextAlert.daysUntil === 1 ? 'Tomorrow' : `In ${nextAlert.daysUntil}d`}:
                    </span>{' '}
                    {nextAlert.message}
                  </span>
                </div>
              )}

              {/* Quick Actions Overlay - Hide on touch devices */}
              <div className="absolute inset-0 bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={(e) => handleFeedClick(e, plant.id)}
                >
                  <Droplet className="h-4 w-4 text-blue-500" />
                  Feed
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={(e) => handleDiaryClick(e, plant)}
                >
                  <BookOpen className="h-4 w-4 text-purple-500" />
                  Diary
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
