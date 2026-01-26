import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import { 
  History, 
  Calendar, 
  Trophy, 
  Star, 
  Leaf,
  Clock,
  ArrowLeft,
  Package,
  Scale
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface ArchivedPlant {
  id: string;
  custom_name: string | null;
  current_stage: string | null;
  start_date: string | null;
  photo_url: string | null;
  notes: string | null;
  strain_name: string | null;
  strain_photo_url: string | null;
  device_name: string | null;
  created_at: string | null;
}

export default function GrowHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: archivedPlants, isLoading } = useQuery({
    queryKey: ['archived-plants'],
    queryFn: async (): Promise<ArchivedPlant[]> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from('plants')
        .select(`
          id,
          custom_name,
          current_stage,
          start_date,
          photo_url,
          notes,
          created_at,
          device_id,
          library_strains (
            name,
            photo_url
          )
        `)
        .eq('user_id', userData.user.id)
        .in('current_stage', ['harvested', 'archived'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching archived plants:', error);
        return [];
      }

      // Fetch device names
      const plantsWithDevices = await Promise.all(
        (data || []).map(async (plant) => {
          let deviceName = null;
          if (plant.device_id) {
            const { data: deviceData } = await supabase
              .from('devices')
              .select('name')
              .eq('device_id', plant.device_id)
              .maybeSingle();
            deviceName = deviceData?.name || null;
          }

          const strainData = plant.library_strains as { name: string; photo_url: string | null } | null;

          return {
            id: plant.id,
            custom_name: plant.custom_name,
            current_stage: plant.current_stage,
            start_date: plant.start_date,
            photo_url: plant.photo_url,
            notes: plant.notes,
            created_at: plant.created_at,
            strain_name: strainData?.name || null,
            strain_photo_url: strainData?.photo_url || null,
            device_name: deviceName,
          };
        })
      );

      return plantsWithDevices;
    },
  });

  const calculateGrowDuration = (startDate: string | null): number | null => {
    if (!startDate) return null;
    return differenceInDays(new Date(), new Date(startDate));
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-4 md:p-6 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/laboratory')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <History className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t('growHistory.title', 'Історія Вирощування')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('growHistory.subtitle', 'Завершені цикли вирощування')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {archivedPlants && archivedPlants.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{archivedPlants.length}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('growHistory.completedGrows', 'Завершених циклів')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Leaf className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {new Set(archivedPlants.map(p => p.strain_name).filter(Boolean)).size}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('growHistory.uniqueStrains', 'Унікальних сортів')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Archived Plants Grid */}
        {archivedPlants && archivedPlants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedPlants.map((plant) => {
              const photoUrl = plant.photo_url || plant.strain_photo_url;
              const duration = calculateGrowDuration(plant.start_date);

              return (
                <Card 
                  key={plant.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/grow-history/${plant.id}`)}
                >
                  {/* Background Image */}
                  <div className="relative h-32">
                    {photoUrl ? (
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${photoUrl})` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/10" />
                    )}
                    
                    {/* Harvested Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-green-500/90 text-white gap-1">
                        <Trophy className="h-3 w-3" />
                        {plant.current_stage === 'archived' ? 'Archived' : 'Harvested'}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Plant Name & Strain */}
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {plant.custom_name || 'Unnamed Plant'}
                      </h3>
                      {plant.strain_name && (
                        <p className="text-sm text-muted-foreground">{plant.strain_name}</p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {plant.start_date && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(plant.start_date), 'dd.MM.yyyy')}</span>
                        </div>
                      )}
                      {duration !== null && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{duration} {t('common.days', 'днів')}</span>
                        </div>
                      )}
                    </div>

                    {/* Device */}
                    {plant.device_name && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Package className="h-3.5 w-3.5" />
                        <span>{plant.device_name}</span>
                      </div>
                    )}

                    {/* Notes */}
                    {plant.notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2 border-t border-border/50 pt-2 mt-2">
                        {plant.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-muted-foreground/20">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t('growHistory.empty', 'Немає завершених циклів')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {t('growHistory.emptyDesc', 'Коли ви завершите вирощування рослини, вона з\'явиться тут в архіві.')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
