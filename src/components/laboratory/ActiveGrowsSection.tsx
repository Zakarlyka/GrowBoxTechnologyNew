import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sprout, Leaf, Flower2, Droplets, Sun } from 'lucide-react';
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
  seedling: 'bg-lime-500/10 text-lime-500 border-lime-500/30',
  vegetation: 'bg-green-500/10 text-green-500 border-green-500/30',
  flowering: 'bg-pink-500/10 text-pink-500 border-pink-500/30',
  flushing: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  drying: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
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
          library_strains (name)
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {plants.map((plant) => {
        const stage = plant.current_stage || 'seedling';
        const StageIcon = stageIcons[stage] || Sprout;
        const stageColor = stageColors[stage] || stageColors.seedling;
        const age = calculatePlantAge(plant.start_date);
        const strainName = (plant.library_strains as any)?.name;

        return (
          <Card
            key={plant.id}
            className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
            onClick={() => handlePlantClick(plant)}
          >
            <CardContent className="p-4">
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
                {age !== null && (
                  <Badge variant="outline" className="shrink-0">
                    {age} днів
                  </Badge>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <Badge className={`${stageColor} border`}>
                  {getStageLabel(stage)}
                </Badge>
                {plant.devices?.name && (
                  <span className="text-xs text-muted-foreground truncate">
                    📍 {plant.devices.name}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
