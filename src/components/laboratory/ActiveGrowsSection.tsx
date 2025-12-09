import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Sprout, Leaf, Flower2, Droplets, Sun, Droplet, BookOpen } from 'lucide-react';
import { calculatePlantAge, PLANT_STAGES } from '@/hooks/usePlantData';

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
  seedling: 'bg-lime-500/20 text-lime-400 border-lime-500/50',
  vegetation: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
  flowering: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  flushing: 'bg-sky-500/20 text-sky-400 border-sky-500/50',
  drying: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
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
          library_strains (name, flowering_days)
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!plants || plants.length === 0) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Sprout className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Немає активних рослин</p>
          <p className="text-sm text-muted-foreground/70">
            Додайте рослину з Бібліотеки сортів
          </p>
        </CardContent>
      </Card>
    );
  }

  const calculateProgress = (startDate: string | null, floweringDays: number | null): { percentage: number; currentDay: number; totalDays: number } | null => {
    if (!startDate || !floweringDays) return null;
    const age = calculatePlantAge(startDate);
    if (age === null) return null;
    const percentage = Math.min(Math.round((age / floweringDays) * 100), 100);
    return { percentage, currentDay: age, totalDays: floweringDays };
  };

  const handleFeedClick = (e: React.MouseEvent, plantId: string) => {
    e.stopPropagation();
    // Scroll to nutrient calculator section
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {plants.map((plant) => {
        const stage = plant.current_stage || 'seedling';
        const StageIcon = stageIcons[stage] || Sprout;
        const stageColor = stageColors[stage] || stageColors.seedling;
        const progressBarColor = stageBgColors[stage] || stageBgColors.seedling;
        const strainData = plant.library_strains as { name: string; flowering_days: number | null } | null;
        const strainName = strainData?.name;
        const floweringDays = strainData?.flowering_days;
        const progress = calculateProgress(plant.start_date, floweringDays);

        return (
          <Card
            key={plant.id}
            className="group cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg relative overflow-hidden"
            onClick={() => handlePlantClick(plant)}
          >
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-lg border ${stageColor}`}>
                    <StageIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                      {plant.custom_name || strainName || 'Unnamed Plant'}
                    </h4>
                    {strainName && plant.custom_name && (
                      <p className="text-sm text-muted-foreground truncate">
                        {strainName}
                      </p>
                    )}
                  </div>
                </div>
                <Badge className={`${stageColor} border font-semibold shrink-0`}>
                  {getStageLabel(stage)}
                </Badge>
              </div>

              {/* Location */}
              {plant.devices?.name && (
                <p className="text-xs text-muted-foreground mt-2 truncate">
                  📍 {plant.devices.name}
                </p>
              )}

              {/* Progress Bar */}
              {progress && (
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Day {progress.currentDay} / {progress.totalDays}</span>
                    <span className="font-medium text-foreground">{progress.percentage}%</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div 
                      className={`h-full transition-all ${progressBarColor}`}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Quick Actions Overlay */}
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
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
