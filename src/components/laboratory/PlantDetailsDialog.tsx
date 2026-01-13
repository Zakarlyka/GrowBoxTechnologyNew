import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Leaf, Calendar, Thermometer, Bell, Crown, Clock, 
  Sprout, Flower2, Droplets, Sun, Target, ExternalLink,
  Shield, Cpu, GraduationCap, Pencil, TrendingUp, Wind,
  Gauge, Ruler, Bug, Snowflake, Flame, AlertTriangle,
  Activity, BookOpen, Beaker
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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
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
import type { GrowingStage } from '@/types';

interface PlantDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plant: PlantWithStrain | null;
  onNavigateToDevice?: (deviceId: string) => void;
  onEditPlant?: (plant: PlantWithStrain) => void;
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

const getTypeColor = (type: string | null) => {
  switch (type?.toLowerCase()) {
    case 'indica':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'sativa':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'hybrid':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'autoflower':
    case 'auto':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getDifficultyColor = (difficulty: string | null) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
    case 'beginner':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'medium':
    case 'intermediate':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'hard':
    case 'expert':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getStageIcon = (stageName: string) => {
  const name = (stageName || '').toLowerCase();
  if (name.includes('seedling') || name.includes('germination') || name.includes('проростання')) return '🌱';
  if (name.includes('veg') || name.includes('вегетація')) return '🌿';
  if (name.includes('pre-flower') || name.includes('preflower') || name.includes('перед')) return '🌼';
  if (name.includes('flower') || name.includes('bloom') || name.includes('цвітіння')) return '🌸';
  if (name.includes('flush') || name.includes('промивка')) return '💧';
  if (name.includes('dry') || name.includes('harvest') || name.includes('сушіння')) return '🍂';
  return '📊';
};

// Intensity bar component for 1-10 scale
const IntensityBar = ({ value, max = 10, color = 'primary' }: { value: number; max?: number; color?: string }) => {
  const percentage = (value / max) * 100;
  const colorClasses: Record<string, string> = {
    primary: 'bg-primary',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${colorClasses[color] || colorClasses.primary}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium w-6 text-right">{value}/{max}</span>
    </div>
  );
};

export function PlantDetailsDialog({
  open,
  onOpenChange,
  plant,
  onNavigateToDevice,
  onEditPlant,
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

  // Parse growing_params from plant
  const rawParams = plant?.growing_params;
  const growingParams: any = rawParams 
    ? (typeof rawParams === 'string' ? JSON.parse(rawParams) : rawParams) 
    : null;
  
  // Extract Universal Plant Schema fields
  const geneticPassport = growingParams?.genetic_passport || null;
  const morphology = growingParams?.morphology || null;
  const resistanceRating = growingParams?.resistance_rating || null;
  const environmentTargets = growingParams?.environment_targets || null;
  const timelineAlerts = growingParams?.timeline_alerts || [];
  const conditionalAlerts = growingParams?.conditional_alerts || [];
  const stages: GrowingStage[] = growingParams?.stages && Array.isArray(growingParams.stages) 
    ? growingParams.stages 
    : [];
  const phenotype = growingParams?.phenotype || null;
  const cultivationTips = growingParams?.cultivation_tips || null;
  const difficultyLevel = growingParams?.difficulty_level || null;

  // Build Radar Chart data for resistance
  const radarData = useMemo(() => {
    if (!resistanceRating) return [];
    return [
      { subject: 'Mold', value: resistanceRating.mold || 0, fullMark: 5 },
      { subject: 'Pests', value: resistanceRating.pests || 0, fullMark: 5 },
      { subject: 'Cold', value: resistanceRating.cold || 0, fullMark: 5 },
      { subject: 'Heat', value: resistanceRating.heat || 0, fullMark: 5 },
      { subject: 'Drought', value: resistanceRating.drought || 0, fullMark: 5 },
    ].filter(item => item.value > 0);
  }, [resistanceRating]);

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

  // Format temperature display
  const formatTempRange = (temp: any) => {
    if (!temp) return 'N/A';
    if (Array.isArray(temp)) return `${temp[0]}°C - ${temp[1]}°C`;
    if (typeof temp === 'object') {
      if (temp.day !== undefined && temp.night !== undefined) {
        return `${temp.night}°C / ${temp.day}°C`;
      }
      if (temp.min !== undefined && temp.max !== undefined) {
        return `${temp.min}°C - ${temp.max}°C`;
      }
    }
    return `${temp}°C`;
  };

  const formatHumidity = (hum: any) => {
    if (!hum) return 'N/A';
    if (Array.isArray(hum)) return `${hum[0]}% - ${hum[1]}%`;
    if (typeof hum === 'object') {
      if (hum.min !== undefined && hum.max !== undefined) {
        return `${hum.min}% - ${hum.max}%`;
      }
    }
    return `${hum}%`;
  };

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

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.includes('supabase')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}t=${Date.now()}`;
    }
    return url;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/placeholder.svg';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-0">
          <DialogTitle className="sr-only">{plant.custom_name || 'Plant Details'}</DialogTitle>
        </DialogHeader>

        {/* ========== HERO SECTION WITH MORPHOLOGY (Library Style) ========== */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Image + Basic Info */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-4 lg:w-64">
            {/* Image */}
            <div className="w-full sm:w-48 lg:w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0 relative">
              {photoUrl ? (
                <img
                  src={getImageUrl(photoUrl) || ''}
                  alt={plant.custom_name || 'Plant'}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Leaf className="h-20 w-20 text-primary/30" />
                </div>
              )}
              {/* Edit Button Overlay */}
              {onEditPlant && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-background/80 backdrop-blur-sm"
                  onClick={() => onEditPlant(plant)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Quick Info */}
            <div className="flex-1 lg:flex-none space-y-2">
              <div className="flex items-center gap-2">
                {plant.is_main && (
                  <Crown className="h-5 w-5 text-amber-500" />
                )}
                <h2 className="text-2xl font-bold text-foreground truncate">
                  {plant.custom_name || 'Unnamed Plant'}
                </h2>
              </div>
              {plant.strain_name && (
                <p className="text-sm text-muted-foreground">🧬 {plant.strain_name}</p>
              )}
              {plant.device?.name && (
                <p className="text-sm text-muted-foreground">📍 {plant.device.name}</p>
              )}
              
              {/* Type Badges */}
              <div className="flex flex-wrap gap-2">
                {geneticPassport && (
                  <>
                    {geneticPassport.sativa_percent > 0 && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        ☀️ {geneticPassport.sativa_percent}% Sativa
                      </Badge>
                    )}
                    {geneticPassport.indica_percent > 0 && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        🌙 {geneticPassport.indica_percent}% Indica
                      </Badge>
                    )}
                  </>
                )}
                {difficultyLevel && (
                  <Badge className={`border ${getDifficultyColor(difficultyLevel)}`}>
                    {difficultyLevel}
                  </Badge>
                )}
              </div>
              
              {geneticPassport?.thc_range && (
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                  THC {geneticPassport.thc_range}
                </Badge>
              )}

              {/* Progress Bar */}
              {plantInfo?.progress && (
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Day {plantInfo.progress.currentDay}</span>
                    <span>{plantInfo.progress.totalDays} days total</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className={`h-full transition-all ${progressBarColor}`}
                      style={{ width: `${plantInfo.progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Morphology Dashboard */}
          <div className="flex-1">
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 h-full">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-cyan-400" />
                  📊 Морфологія
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {morphology ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Stretch Ratio */}
                    <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-xs text-muted-foreground">Stretch Ratio</span>
                      </div>
                      <div className="text-2xl font-bold text-green-400">
                        x{morphology.stretch_ratio || 'N/A'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {morphology.stretch_ratio >= 2.5 ? 'High stretch' : 
                         morphology.stretch_ratio >= 1.5 ? 'Moderate' : 'Low stretch'}
                      </p>
                    </div>
                    
                    {/* Bud Density */}
                    <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-purple-400" />
                        <span className="text-xs text-muted-foreground">Bud Density</span>
                      </div>
                      <div className="text-lg font-bold text-purple-400 capitalize">
                        {morphology.bud_density || 'N/A'}
                      </div>
                    </div>
                    
                    {/* Odor Intensity */}
                    <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Wind className="h-4 w-4 text-pink-400" />
                        <span className="text-xs text-muted-foreground">Odor Intensity</span>
                      </div>
                      {morphology.odor_intensity !== undefined ? (
                        <IntensityBar value={morphology.odor_intensity} max={10} color="purple" />
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Gauge className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Morphology data not available</p>
                    <p className="text-xs mt-1">Link a strain with growing_params</p>
                  </div>
                )}

                {/* Additional phenotype info */}
                {phenotype && (
                  <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-3">
                    {phenotype.height_indoor && (
                      <div className="flex items-center gap-2 text-sm">
                        <Ruler className="h-4 w-4 text-green-400" />
                        <span className="text-muted-foreground">Indoor:</span>
                        <span className="font-medium">{phenotype.height_indoor}</span>
                      </div>
                    )}
                    {phenotype.aroma && (
                      <div className="flex items-center gap-2 text-sm col-span-2">
                        <span className="text-lg">🌸</span>
                        <span className="text-pink-300 font-medium">{phenotype.aroma}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Current Stage Info */}
                {plantInfo?.stageInfo && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StageIcon className={`h-5 w-5 ${stageTextColor}`} />
                        <span className={`font-semibold capitalize ${stageTextColor}`}>
                          {plantInfo.stageInfo.stageName}
                        </span>
                      </div>
                      <Badge variant="outline">
                        Day {plantInfo.stageInfo.dayInStage}/{plantInfo.stageInfo.stageDuration}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-4" />

        {/* ========== 5 TABS (Timeline exclusive for Lab) ========== */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="resistance" className="gap-1 text-xs">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Resistance</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1 text-xs">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="environment" className="gap-1 text-xs">
              <Thermometer className="h-4 w-4" />
              <span className="hidden sm:inline">Environment</span>
            </TabsTrigger>
            <TabsTrigger value="watchdog" className="gap-1 text-xs">
              <Cpu className="h-4 w-4" />
              <span className="hidden sm:inline">AI Watchdog</span>
            </TabsTrigger>
            <TabsTrigger value="wiki" className="gap-1 text-xs">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Wiki</span>
            </TabsTrigger>
          </TabsList>

          {/* ============ TAB 1: RESISTANCE MATRIX ============ */}
          <TabsContent value="resistance" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Radar Chart */}
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-400" />
                    🛡️ Resistance Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  {radarData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          />
                          <PolarRadiusAxis 
                            angle={90} 
                            domain={[0, 5]} 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          />
                          <Radar
                            name="Resistance"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.4}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    /* Fallback: Progress bars */
                    <div className="space-y-4 py-4">
                      {resistanceRating ? (
                        <>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm flex items-center gap-2">
                                <Bug className="h-4 w-4 text-amber-400" /> Mold
                              </span>
                              <span className="text-sm font-medium">{resistanceRating.mold || 0}/5</span>
                            </div>
                            <Progress value={(resistanceRating.mold || 0) * 20} className="h-2" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm flex items-center gap-2">
                                <Bug className="h-4 w-4 text-red-400" /> Pests
                              </span>
                              <span className="text-sm font-medium">{resistanceRating.pests || 0}/5</span>
                            </div>
                            <Progress value={(resistanceRating.pests || 0) * 20} className="h-2" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm flex items-center gap-2">
                                <Snowflake className="h-4 w-4 text-blue-400" /> Cold
                              </span>
                              <span className="text-sm font-medium">{resistanceRating.cold || 0}/5</span>
                            </div>
                            <Progress value={(resistanceRating.cold || 0) * 20} className="h-2" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm flex items-center gap-2">
                                <Flame className="h-4 w-4 text-orange-400" /> Heat
                              </span>
                              <span className="text-sm font-medium">{resistanceRating.heat || 0}/5</span>
                            </div>
                            <Progress value={(resistanceRating.heat || 0) * 20} className="h-2" />
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <Shield className="h-12 w-12 mx-auto mb-2 opacity-30" />
                          <p>No resistance data available</p>
                          <p className="text-xs mt-1">Link a strain with resistance_rating</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Difficulty & Stats */}
              <div className="space-y-4">
                {/* Difficulty Badge */}
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Difficulty Level</span>
                      <Badge className={`text-lg px-4 py-1 ${getDifficultyColor(difficultyLevel)}`}>
                        {difficultyLevel || 'Unknown'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Resistance Details */}
                {resistanceRating && (
                  <Card className="bg-card/50">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm font-medium">Resistance Details</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0 space-y-2">
                      {Object.entries(resistanceRating).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-muted-foreground">{key}</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className={`h-3 w-3 rounded-full ${
                                  i <= (value as number) 
                                    ? 'bg-green-500' 
                                    : 'bg-muted'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Quick Stats */}
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {plant.flowering_days && (
                        <div>
                          <span className="text-muted-foreground">Flowering</span>
                          <div className="font-bold text-lg">{plant.flowering_days} days</div>
                        </div>
                      )}
                      {plantInfo?.totalDays && (
                        <div>
                          <span className="text-muted-foreground">Total Lifecycle</span>
                          <div className="font-medium">{plantInfo.totalDays} days</div>
                        </div>
                      )}
                      {plant.start_date && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Started</span>
                          <div className="font-medium">{format(new Date(plant.start_date), 'dd MMM yyyy')}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ============ TAB 2: TIMELINE (LAB EXCLUSIVE - Interactive Calendar) ============ */}
          <TabsContent value="timeline" className="mt-4 space-y-4">
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

          {/* ============ TAB 3: ENVIRONMENT TARGETS ============ */}
          <TabsContent value="environment" className="mt-4 space-y-4">
            <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-orange-400" />
                  🌡️ Climate Protocol
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {(environmentTargets || stages.length > 0) ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-medium">Stage</TableHead>
                          <TableHead className="font-medium">
                            <div className="flex items-center gap-1">
                              <Thermometer className="h-3 w-3 text-orange-400" />
                              Temp (D/N)
                            </div>
                          </TableHead>
                          <TableHead className="font-medium">
                            <div className="flex items-center gap-1">
                              <Droplets className="h-3 w-3 text-blue-400" />
                              Humidity
                            </div>
                          </TableHead>
                          <TableHead className="font-medium">
                            <div className="flex items-center gap-1 text-cyan-400">
                              <Activity className="h-3 w-3" />
                              <span className="font-bold">VPD ⭐</span>
                            </div>
                          </TableHead>
                          <TableHead className="font-medium">
                            <div className="flex items-center gap-1">
                              <Sun className="h-3 w-3 text-yellow-400" />
                              PPFD
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Prefer environment_targets if available */}
                        {environmentTargets ? (
                          Object.entries(environmentTargets).map(([stageName, targets]: [string, any]) => (
                            <TableRow key={stageName}>
                              <TableCell className="font-medium whitespace-nowrap">
                                {getStageIcon(stageName)} {stageName}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                                  {formatTempRange(targets.temp)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                                  {formatHumidity(targets.humidity)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/40 font-bold">
                                  {targets.vpd ? `${targets.vpd} kPa` : 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                  {targets.ppfd || 'N/A'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          /* Fallback to stages */
                          stages.map((stage, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium whitespace-nowrap">
                                {getStageIcon(stage.name || '')} {stage.label_ua || stage.name}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                                  {formatTempRange(stage.temp)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                                  {stage.humidity ? `${stage.humidity}%` : 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/40 font-bold">
                                  {stage.vpd ? `${stage.vpd} kPa` : 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                  {stage.ppfd || 'N/A'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Thermometer className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No environment targets configured</p>
                    <p className="text-xs mt-1">Link a strain with growing_params</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Targets Quick View */}
            {plantInfo?.targets && (
              <Card className="bg-card/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Current Stage Targets
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
                      <Thermometer className="h-5 w-5 mx-auto mb-1 text-orange-400" />
                      <p className="text-2xl font-bold text-foreground">{plantInfo.targets.temp}°C</p>
                      <p className="text-xs text-muted-foreground">Temperature</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                      <Droplets className="h-5 w-5 mx-auto mb-1 text-blue-400" />
                      <p className="text-2xl font-bold text-foreground">{plantInfo.targets.humidity}%</p>
                      <p className="text-xs text-muted-foreground">Humidity</p>
                    </div>
                    <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-center">
                      <Activity className="h-5 w-5 mx-auto mb-1 text-cyan-400" />
                      <p className="text-2xl font-bold text-foreground">{plantInfo.targets.vpd}</p>
                      <p className="text-xs text-muted-foreground">VPD (kPa)</p>
                    </div>
                    {plantInfo.targets.light_hours && (
                      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
                        <Sun className="h-5 w-5 mx-auto mb-1 text-yellow-400" />
                        <p className="text-2xl font-bold text-foreground">{plantInfo.targets.light_hours}h</p>
                        <p className="text-xs text-muted-foreground">Light</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============ TAB 4: AI WATCHDOG (Conditional Alerts) ============ */}
          <TabsContent value="watchdog" className="mt-4 space-y-4">
            <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-red-400" />
                  🤖 AI Watchdog - Active Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {conditionalAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {conditionalAlerts.map((alert: any, idx: number) => (
                      <Alert 
                        key={idx} 
                        className={`${
                          alert.priority === 'high' || alert.severity === 'critical'
                            ? 'bg-red-500/10 border-red-500/30' 
                            : alert.priority === 'medium' 
                              ? 'bg-yellow-500/10 border-yellow-500/30'
                              : 'bg-blue-500/10 border-blue-500/30'
                        }`}
                      >
                        <AlertTriangle className={`h-5 w-5 ${
                          alert.priority === 'high' || alert.severity === 'critical'
                            ? 'text-red-500' 
                            : alert.priority === 'medium'
                              ? 'text-yellow-500'
                              : 'text-blue-500'
                        }`} />
                        <AlertTitle className="font-semibold flex items-center gap-2">
                          {alert.priority === 'high' && '🔥'}
                          {alert.priority === 'medium' && '⚠️'}
                          {alert.priority === 'low' && 'ℹ️'}
                          {alert.name || alert.rule_name || `Rule ${idx + 1}`}
                          <Badge variant="outline" className="text-xs capitalize">
                            {alert.priority || 'normal'}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                          <div className="text-sm space-y-1">
                            <p className="font-mono bg-background/50 p-2 rounded text-xs">
                              IF {alert.condition || alert.trigger_condition || 'condition'} → {alert.action || alert.message || 'Send Alert'}
                            </p>
                            {alert.description && (
                              <p className="text-muted-foreground text-xs mt-2">
                                {alert.description}
                              </p>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Cpu className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No conditional alerts configured</p>
                    <p className="text-xs mt-1">Add conditional_alerts to enable AI monitoring</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline Alerts */}
            {timelineAlerts.length > 0 && (
              <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-400" />
                    🔔 Timeline Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto overflow-x-hidden pr-1">
                    {timelineAlerts.map((alert: any, idx: number) => (
                      <div 
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30"
                      >
                        <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
                          <Bell className="h-4 w-4 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground break-words">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {alert.trigger_stage || alert.stage} • Day {alert.day_offset}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============ TAB 5: WIKI / KNOWLEDGE BASE ============ */}
          <TabsContent value="wiki" className="mt-4 space-y-4">
            {/* Training Advice */}
            {cultivationTips?.training && (
              <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-violet-400" />
                    🎓 Training Advice
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <p className="text-sm leading-relaxed">{cultivationTips.training}</p>
                </CardContent>
              </Card>
            )}

            {/* Substrate */}
            {cultivationTips?.substrate && (
              <Card className="bg-card/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Beaker className="h-4 w-4 text-amber-400" />
                    🌱 Substrate & pH
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <p className="text-sm leading-relaxed">{cultivationTips.substrate}</p>
                </CardContent>
              </Card>
            )}

            {/* Warnings */}
            {cultivationTips?.warnings && Array.isArray(cultivationTips.warnings) && cultivationTips.warnings.length > 0 && (
              <Alert className="bg-yellow-500/10 border-yellow-500/30">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <AlertTitle className="text-yellow-400 font-semibold">
                  ⚠️ Critical Warnings
                </AlertTitle>
                <AlertDescription>
                  <ul className="mt-3 space-y-2">
                    {cultivationTips.warnings.map((warning: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-yellow-200">
                        <span className="text-yellow-400">•</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Plant Notes */}
            {plant.notes && (
              <Card className="bg-card/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    📝 Plant Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {plant.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Plant Info Card */}
            <Card className="bg-card/50">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-green-400" />
                  🌿 Quick Info
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
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
              </CardContent>
            </Card>

            {/* Empty state */}
            {!cultivationTips?.training && !cultivationTips?.substrate && !cultivationTips?.warnings?.length && !plant.notes && (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Wiki not populated for this strain</p>
                  <p className="text-xs mt-1">Add cultivation_tips to the linked strain</p>
                </CardContent>
              </Card>
            )}
            
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
