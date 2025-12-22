import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Sprout, 
  Leaf, 
  Flower2, 
  Droplets, 
  Sun, 
  Droplet, 
  BookOpen, 
  Bell, 
  Clock,
  Crown,
  AlertTriangle
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

export const ActiveGrowsSection = () => {
  const navigate = useNavigate();
  const { plants, masterPlant, isLoading } = usePlantsWithStrains();

  // Get master plant targets for compatibility check
  const masterStageInfo = masterPlant 
    ? calculateStageInfo(masterPlant.start_date, masterPlant.growing_params)
    : null;
  const masterTargets = masterStageInfo 
    ? getEnvironmentTargets(masterPlant?.growing_params || null, masterStageInfo.stageName)
    : null;

  const handlePlantClick = (plant: PlantWithStrain) => {
    if (plant.device?.id) {
      navigate(`/device/${plant.device.id}`);
    }
  };

  const handleFeedClick = (e: React.MouseEvent, plantId: string) => {
    e.stopPropagation();
    const nutrientSection = document.getElementById('nutrient-calculator');
    if (nutrientSection) {
      nutrientSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDiaryClick = (e: React.MouseEvent, plant: PlantWithStrain) => {
    e.stopPropagation();
    if (plant.device?.id) {
      navigate(`/device/${plant.device.id}`);
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

              {/* Location */}
              {plant.device?.name && (
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
