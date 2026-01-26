import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays, parseISO } from 'date-fns';
import { 
  ArrowLeft,
  Calendar,
  Trophy,
  Leaf,
  Clock,
  Camera,
  FileText,
  Thermometer,
  Droplets,
  Wind,
  Package
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HistoryChart } from '@/components/laboratory/HistoryChart';
import { supabase } from '@/integrations/supabase/client';

interface PlantDetails {
  id: string;
  custom_name: string | null;
  current_stage: string | null;
  start_date: string | null;
  photo_url: string | null;
  notes: string | null;
  strain_name: string | null;
  strain_photo_url: string | null;
  device_id: string | null;
  device_name: string | null;
  created_at: string | null;
}

interface JournalEvent {
  id: string;
  event_type: string;
  title: string | null;
  description: string | null;
  photo_url: string | null;
  day_of_grow: number | null;
  created_at: string;
}

export default function GrowArchiveDetails() {
  const { plantId } = useParams<{ plantId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch plant details
  const { data: plant, isLoading: plantLoading } = useQuery({
    queryKey: ['archived-plant', plantId],
    queryFn: async (): Promise<PlantDetails | null> => {
      if (!plantId) return null;

      const { data, error } = await supabase
        .from('plants')
        .select(`
          id,
          custom_name,
          current_stage,
          start_date,
          photo_url,
          notes,
          device_id,
          created_at,
          library_strains (
            name,
            photo_url
          )
        `)
        .eq('id', plantId)
        .single();

      if (error) {
        console.error('Error fetching plant:', error);
        return null;
      }

      // Fetch device name
      let deviceName = null;
      if (data.device_id) {
        const { data: deviceData } = await supabase
          .from('devices')
          .select('name')
          .eq('device_id', data.device_id)
          .maybeSingle();
        deviceName = deviceData?.name || null;
      }

      const strainData = data.library_strains as { name: string; photo_url: string | null } | null;

      return {
        id: data.id,
        custom_name: data.custom_name,
        current_stage: data.current_stage,
        start_date: data.start_date,
        photo_url: data.photo_url,
        notes: data.notes,
        device_id: data.device_id,
        device_name: deviceName,
        created_at: data.created_at,
        strain_name: strainData?.name || null,
        strain_photo_url: strainData?.photo_url || null,
      };
    },
    enabled: !!plantId,
  });

  // Fetch journal events
  const { data: journalEvents } = useQuery({
    queryKey: ['plant-journal', plantId],
    queryFn: async (): Promise<JournalEvent[]> => {
      if (!plantId) return [];

      const { data, error } = await supabase
        .from('plant_journal_events')
        .select('*')
        .eq('plant_id', plantId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching journal:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!plantId,
  });

  // Fetch sensor data history for the plant's device
  const { data: sensorHistory } = useQuery({
    queryKey: ['sensor-history', plant?.device_id, plant?.start_date],
    queryFn: async () => {
      if (!plant?.device_id) return [];

      // Get device UUID from device_id
      const { data: device } = await supabase
        .from('devices')
        .select('id')
        .eq('device_id', plant.device_id)
        .single();

      if (!device) return [];

      const { data, error } = await supabase
        .from('sensor_data')
        .select('*')
        .eq('device_id', device.id)
        .gte('timestamp', plant.start_date || '1970-01-01')
        .order('timestamp', { ascending: true })
        .limit(1000);

      if (error) {
        console.error('Error fetching sensor history:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!plant?.device_id,
  });

  // Calculate grow duration
  const growDuration = plant?.start_date
    ? differenceInDays(new Date(), parseISO(plant.start_date))
    : null;

  // Get photos from journal events
  const photos = journalEvents
    ?.filter(e => e.photo_url)
    .map(e => ({
      url: e.photo_url!,
      day: e.day_of_grow,
      title: e.title,
      date: e.created_at,
    })) || [];

  // Add plant photo if exists
  if (plant?.photo_url) {
    photos.unshift({
      url: plant.photo_url,
      day: null,
      title: t('growHistory.mainPhoto', 'Головне фото'),
      date: plant.created_at || '',
    });
  }

  if (plantLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-4 md:p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!plant) {
    return (
      <Layout>
        <div className="container mx-auto p-4 md:p-6">
          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t('growHistory.notFound', 'Рослину не знайдено')}
              </h3>
              <Button onClick={() => navigate('/grow-history')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common.back')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const coverPhoto = plant.photo_url || plant.strain_photo_url;

  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Back Button + Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/grow-history')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              {plant.custom_name || t('growHistory.unnamedPlant', 'Без назви')}
            </h1>
            {plant.strain_name && (
              <p className="text-sm text-muted-foreground">{plant.strain_name}</p>
            )}
          </div>
          <Badge className="bg-green-500/90 text-white gap-1">
            <Trophy className="h-3 w-3" />
            {plant.current_stage === 'archived' ? 'Archived' : 'Harvested'}
          </Badge>
        </div>

        {/* Hero Card with Stats */}
        <Card className="overflow-hidden">
          <div className="relative h-48 md:h-64">
            {coverPhoto ? (
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${coverPhoto})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10" />
            )}
            
            {/* Stats Overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {plant.start_date && (
                  <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs">{t('growHistory.startDate', 'Початок')}</span>
                    </div>
                    <p className="font-semibold">{format(parseISO(plant.start_date), 'dd.MM.yyyy')}</p>
                  </div>
                )}
                {growDuration !== null && (
                  <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">{t('growHistory.duration', 'Тривалість')}</span>
                    </div>
                    <p className="font-semibold">{growDuration} {t('common.days', 'днів')}</p>
                  </div>
                )}
                {plant.device_name && (
                  <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Package className="h-4 w-4" />
                      <span className="text-xs">{t('growHistory.device', 'Пристрій')}</span>
                    </div>
                    <p className="font-semibold truncate">{plant.device_name}</p>
                  </div>
                )}
                <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Leaf className="h-4 w-4" />
                    <span className="text-xs">{t('growHistory.stage', 'Стадія')}</span>
                  </div>
                  <p className="font-semibold capitalize">{plant.current_stage}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs: Charts | Gallery | Journal */}
        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="charts" className="gap-2">
              <Thermometer className="h-4 w-4" />
              <span className="hidden sm:inline">{t('growHistory.charts', 'Графіки')}</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">{t('growHistory.gallery', 'Галерея')}</span>
              {photos.length > 0 && (
                <Badge variant="secondary" className="ml-1">{photos.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="journal" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{t('growHistory.journal', 'Журнал')}</span>
              {journalEvents && journalEvents.length > 0 && (
                <Badge variant="secondary" className="ml-1">{journalEvents.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-4">
            {sensorHistory && sensorHistory.length > 0 ? (
              <div className="grid gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Thermometer className="h-4 w-4 text-destructive" />
                      {t('sensors.temperature')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HistoryChart
                      data={sensorHistory.map(d => ({
                        timestamp: d.timestamp,
                        value: d.temperature,
                      }))}
                      color="hsl(var(--destructive))"
                      label={t('sensors.temperature')}
                      unit="°C"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Droplets className="h-4 w-4 text-primary" />
                      {t('sensors.humidity')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HistoryChart
                      data={sensorHistory.map(d => ({
                        timestamp: d.timestamp,
                        value: d.humidity,
                      }))}
                      color="hsl(var(--primary))"
                      label={t('sensors.humidity')}
                      unit="%"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Wind className="h-4 w-4 text-accent-foreground" />
                      VPD
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HistoryChart
                      data={sensorHistory.map(d => {
                        // Calculate VPD from temp and humidity
                        const temp = d.temperature;
                        const rh = d.humidity;
                        if (temp == null || rh == null) return { timestamp: d.timestamp, value: null };
                        const svp = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
                        const vpd = svp * (1 - rh / 100);
                        return { timestamp: d.timestamp, value: vpd };
                      })}
                      color="hsl(var(--accent-foreground))"
                      label="VPD"
                      unit=" kPa"
                    />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-dashed border-2 border-muted-foreground/20">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Thermometer className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {t('growHistory.noSensorData', 'Немає даних сенсорів')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('growHistory.noSensorDataDesc', 'Історичні дані сенсорів недоступні для цього росту.')}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <Card key={index} className="overflow-hidden group cursor-pointer">
                    <div className="relative aspect-square">
                      <img
                        src={photo.url}
                        alt={photo.title || `Photo ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {photo.day !== null && (
                          <Badge variant="secondary" className="text-xs">
                            {t('growHistory.day', 'День')} {photo.day}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-muted-foreground/20">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Camera className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {t('growHistory.noPhotos', 'Немає фотографій')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('growHistory.noPhotosDesc', 'Фотографії не були додані під час цього росту.')}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Journal Tab */}
          <TabsContent value="journal">
            {journalEvents && journalEvents.length > 0 ? (
              <div className="space-y-4">
                {journalEvents.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg">
                            {event.event_type === 'watering' && '💧'}
                            {event.event_type === 'feeding' && '🍼'}
                            {event.event_type === 'training' && '✂️'}
                            {event.event_type === 'transplant' && '🪴'}
                            {event.event_type === 'stage_change' && '🔄'}
                            {event.event_type === 'note' && '📝'}
                            {event.event_type === 'photo' && '📷'}
                            {!['watering', 'feeding', 'training', 'transplant', 'stage_change', 'note', 'photo'].includes(event.event_type) && '📋'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold">{event.title || event.event_type}</span>
                            {event.day_of_grow !== null && (
                              <Badge variant="outline" className="text-xs">
                                {t('growHistory.day', 'День')} {event.day_of_grow}
                              </Badge>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(event.created_at), 'dd.MM.yyyy HH:mm')}
                          </p>
                        </div>
                        {event.photo_url && (
                          <div className="flex-shrink-0">
                            <img
                              src={event.photo_url}
                              alt="Event"
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-muted-foreground/20">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {t('growHistory.noJournal', 'Журнал порожній')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('growHistory.noJournalDesc', 'Записи журналу не були додані під час цього росту.')}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Notes Section */}
        {plant.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('growHistory.notes', 'Нотатки')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{plant.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
