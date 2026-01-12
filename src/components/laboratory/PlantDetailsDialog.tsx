import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Leaf, Calendar, Thermometer, Bell, Crown, Clock, 
  Sprout, Flower2, Droplets, Sun, Target, ExternalLink,
  X, Shield, Cpu, GraduationCap
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  PlantWithStrain,
  calculateStageInfo,
  getEnvironmentTargets,
  getNextAlert,
  calculateProgress,
  getTotalLifecycleDays,
} from '@/hooks/usePlantsWithStrains';
import { PlantTimelineCalendar } from './PlantTimelineCalendar';
import { DaySummaryPanel } from './DaySummaryPanel';

interface PlantDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plant: PlantWithStrain | null;
  onNavigateToDevice?: (deviceId: string) => void;
}

const stageIcons: Record<string, React.ElementType> = {
  seedling: Sprout,
  germination: Sprout,
  vegetation: Leaf,
  veg: Leaf,
  flowering: Flower2,
  bloom: Flower2,
  flushing: Droplets,
  flush: Droplets,
  drying: Sun,
  harvest: Sun,
};

const stageColors: Record<string, string> = {
  seedling: 'text-lime-400',
  germination: 'text-lime-400',
  vegetation: 'text-emerald-400',
  veg: 'text-emerald-400',
  flowering: 'text-purple-400',
  bloom: 'text-purple-400',
  flushing: 'text-sky-400',
  flush: 'text-sky-400',
  drying: 'text-amber-400',
  harvest: 'text-amber-400',
};

const stageBgColors: Record<string, string> = {
  seedling: 'bg-lime-500',
  germination: 'bg-lime-500',
  vegetation: 'bg-emerald-500',
  veg: 'bg-emerald-500',
  flowering: 'bg-purple-500',
  bloom: 'bg-purple-500',
  flushing: 'bg-sky-500',
  flush: 'bg-sky-500',
  drying: 'bg-amber-500',
  harvest: 'bg-amber-500',
};

export function PlantDetailsDialog({
  open,
  onOpenChange,
  plant,
  onNavigateToDevice,
}: PlantDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('timeline');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch journal events for this plant
  const { data: journalEvents, refetch: refetchJournal } = useQuery({
    queryKey: ['plant-journal', plant?.id],
    queryFn: async () => {
      if (!plant?.id) return [];
      const { data, error } = await supabase
        .from('plant_journal_events')
        .select('*')
        .eq('plant_id', plant.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!plant?.id && open,
  });

  // Calculate plant info
  const plantInfo = useMemo(() => {
    if (!plant) return null;
    
    const stage = plant.current_stage || 'seedling';
    const stageInfo = calculateStageInfo(plant.start_date, plant.growing_params);
    const totalDays = getTotalLifecycleDays(plant.growing_params, plant.flowering_days);
    const progress = calculateProgress(plant.start_date, totalDays);
    const nextAlert = getNextAlert(plant.start_date, plant.growing_params);
    const targets = stageInfo 
      ? getEnvironmentTargets(plant.growing_params, stageInfo.stageName)
      : null;
    
    return {
      stage,
      stageInfo,
      totalDays,
      progress,
      nextAlert,
      targets,
    };
  }, [plant]);

  if (!plant) return null;

  const StageIcon = stageIcons[plantInfo?.stage || 'seedling'] || Sprout;
  const stageTextColor = stageColors[plantInfo?.stage || 'seedling'] || 'text-muted-foreground';
  const progressBarColor = stageBgColors[plantInfo?.stage || 'seedling'] || 'bg-muted';
  const photoUrl = plant.photo_url || plant.strain_photo_url;

  const handleGoToDevice = () => {
    if (plant.device?.id && onNavigateToDevice) {
      onNavigateToDevice(plant.device.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>{plant.custom_name || 'Plant Details'}</DialogTitle>
        </DialogHeader>

        {/* Hero Section */}
        <div className="relative h-40 overflow-hidden">
          {photoUrl ? (
            <>
              <div 
                className="absolute inset-0 bg-cover bg-center scale-110 blur-sm"
                style={{ backgroundImage: `url(${photoUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
          )}
          
          <div className="relative h-full p-4 flex flex-col justify-end">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {plant.is_main && (
                    <Crown className="h-5 w-5 text-amber-500" />
                  )}
                  <h2 className="text-2xl font-bold text-foreground truncate">
                    {plant.custom_name || 'Unnamed Plant'}
                  </h2>
                </div>
                {plant.strain_name && (
                  <Badge variant="secondary" className="text-sm bg-background/60 backdrop-blur-sm">
                    🧬 {plant.strain_name}
                  </Badge>
                )}
                {plant.device?.name && (
                  <p className="text-sm text-muted-foreground mt-1">
                    📍 {plant.device.name}
                  </p>
                )}
              </div>
              
              <div className={`p-3 rounded-xl bg-background/60 backdrop-blur-sm ${stageTextColor}`}>
                <StageIcon className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Info Bar */}
        <div className="px-4 py-3 flex items-center gap-4 border-b border-border/50 flex-wrap">
          {plantInfo?.stageInfo && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className={`font-semibold capitalize ${stageTextColor}`}>
                {plantInfo.stageInfo.stageName}
              </span>
              <span className="text-muted-foreground">
                Day {plantInfo.stageInfo.dayInStage}/{plantInfo.stageInfo.stageDuration}
              </span>
            </div>
          )}
          
          {plantInfo?.progress && (
            <div className="flex items-center gap-2 flex-1 min-w-[150px]">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className={`h-full transition-all ${progressBarColor}`}
                  style={{ width: `${plantInfo.progress.percentage}%` }}
                />
              </div>
              <span className="text-xs font-bold text-foreground whitespace-nowrap">
                Day {plantInfo.progress.currentDay}/{plantInfo.progress.totalDays}
              </span>
            </div>
          )}
          
          {plantInfo?.nextAlert && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
              <Bell className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-amber-200">
                {plantInfo.nextAlert.daysUntil === 0 ? '🔔 Today' : 
                 plantInfo.nextAlert.daysUntil === 1 ? '📅 Tomorrow' : 
                 `⏰ In ${plantInfo.nextAlert.daysUntil}d`}
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className="mx-4 mt-2 grid grid-cols-4 w-auto shrink-0">
            <TabsTrigger value="timeline" className="gap-1.5 text-xs">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="environment" className="gap-1.5 text-xs">
              <Thermometer className="h-4 w-4" />
              <span className="hidden sm:inline">Environment</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1.5 text-xs">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-1.5 text-xs">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Info</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
            {/* Timeline Tab - Calendar View */}
            <TabsContent value="timeline" className="mt-4 space-y-4 data-[state=inactive]:hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Calendar */}
                <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20 overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-violet-400" />
                      📅 Grow Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 overflow-x-auto">
                    <PlantTimelineCalendar
                      plant={plant}
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                      journalEvents={journalEvents}
                    />
                  </CardContent>
                </Card>
                
                {/* Day Summary */}
                <DaySummaryPanel
                  plant={plant}
                  selectedDate={selectedDate}
                  journalEvents={journalEvents}
                  onNoteAdded={refetchJournal}
                />
              </div>
            </TabsContent>

            {/* Environment Tab */}
            <TabsContent value="environment" className="mt-4 space-y-4 data-[state=inactive]:hidden">
              <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-400" />
                    🌡️ Current Targets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {plantInfo?.targets ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-background/50 border border-border/30 text-center">
                        <Thermometer className="h-5 w-5 mx-auto mb-1 text-orange-400" />
                        <p className="text-2xl font-bold text-foreground">{plantInfo.targets.temp}°C</p>
                        <p className="text-xs text-muted-foreground">Temperature</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50 border border-border/30 text-center">
                        <Droplets className="h-5 w-5 mx-auto mb-1 text-blue-400" />
                        <p className="text-2xl font-bold text-foreground">{plantInfo.targets.humidity}%</p>
                        <p className="text-xs text-muted-foreground">Humidity</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50 border border-border/30 text-center">
                        <Target className="h-5 w-5 mx-auto mb-1 text-cyan-400" />
                        <p className="text-2xl font-bold text-foreground">{plantInfo.targets.vpd}</p>
                        <p className="text-xs text-muted-foreground">VPD (kPa)</p>
                      </div>
                      {plantInfo.targets.light_hours && (
                        <div className="p-3 rounded-lg bg-background/50 border border-border/30 text-center">
                          <Sun className="h-5 w-5 mx-auto mb-1 text-yellow-400" />
                          <p className="text-2xl font-bold text-foreground">{plantInfo.targets.light_hours}h</p>
                          <p className="text-xs text-muted-foreground">Light</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Thermometer className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No environment targets configured</p>
                      <p className="text-xs mt-1">Add a strain with growing parameters</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="mt-4 space-y-4 data-[state=inactive]:hidden">
              <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-400" />
                    🔔 Upcoming Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {plant.growing_params?.timeline_alerts && plant.growing_params.timeline_alerts.length > 0 ? (
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                      {plant.growing_params.timeline_alerts.map((alert, idx) => (
                        <div 
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30"
                        >
                          <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
                            <Bell className="h-4 w-4 text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{alert.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {alert.trigger_stage} • Day {alert.day_offset}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No alerts configured</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Info Tab */}
            <TabsContent value="info" className="mt-4 space-y-4 data-[state=inactive]:hidden">
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-green-400" />
                    🌿 Plant Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Start Date</span>
                      <p className="font-medium">
                        {plant.start_date 
                          ? format(new Date(plant.start_date), 'dd MMM yyyy')
                          : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Stage</span>
                      <p className={`font-medium capitalize ${stageTextColor}`}>
                        {plant.current_stage || 'Unknown'}
                      </p>
                    </div>
                    {plant.flowering_days && (
                      <div>
                        <span className="text-muted-foreground">Flowering Days</span>
                        <p className="font-medium">{plant.flowering_days} days</p>
                      </div>
                    )}
                    {plantInfo?.totalDays && (
                      <div>
                        <span className="text-muted-foreground">Total Lifecycle</span>
                        <p className="font-medium">{plantInfo.totalDays} days</p>
                      </div>
                    )}
                  </div>
                  
                  {plant.notes && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-sm text-muted-foreground">Notes</span>
                        <p className="text-sm mt-1">{plant.notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              {plant.device?.id && (
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={handleGoToDevice}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Device Dashboard
                </Button>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
