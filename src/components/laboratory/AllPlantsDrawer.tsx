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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Leaf, ExternalLink } from 'lucide-react';
import { calculatePlantAge, PLANT_STAGES } from '@/hooks/usePlantData';
import { format } from 'date-fns';

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

const stageColors: Record<string, string> = {
  seedling: 'bg-lime-500/10 text-lime-500 border-lime-500/30',
  vegetation: 'bg-green-500/10 text-green-500 border-green-500/30',
  flowering: 'bg-pink-500/10 text-pink-500 border-pink-500/30',
  flushing: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  drying: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  harvested: 'bg-muted text-muted-foreground border-muted',
};

interface AllPlantsDrawerProps {
  children?: React.ReactNode;
}

export const AllPlantsDrawer = ({ children }: AllPlantsDrawerProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: plants, isLoading } = useQuery({
    queryKey: ['all-plants-master'],
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
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-500" />
            Всі активні рослини
          </SheetTitle>
          <SheetDescription>
            Огляд всіх рослин у вашій теплиці
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !plants || plants.length === 0 ? (
            <div className="text-center py-12">
              <Leaf className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Немає активних рослин</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Назва</TableHead>
                    <TableHead>Сорт</TableHead>
                    <TableHead>Локація</TableHead>
                    <TableHead>Стадія</TableHead>
                    <TableHead className="text-right">Вік</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plants.map((plant) => {
                    const stage = plant.current_stage || 'seedling';
                    const stageColor = stageColors[stage] || stageColors.seedling;
                    const age = calculatePlantAge(plant.start_date);
                    const strainName = (plant.library_strains as any)?.name;

                    return (
                      <TableRow key={plant.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          {plant.custom_name || strainName || 'Без назви'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {strainName || '—'}
                        </TableCell>
                        <TableCell>
                          {plant.devices?.name ? (
                            <span className="text-sm">📍 {plant.devices.name}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${stageColor} border text-xs`}>
                            {getStageLabel(stage)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {age !== null ? (
                            <span className="text-sm">{age} д.</span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          {plant.devices?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleGoToDevice(plant.devices!.id)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {plants && plants.length > 0 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Всього: {plants.length} активних рослин
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
