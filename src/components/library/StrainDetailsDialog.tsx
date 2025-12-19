import { useState, useMemo } from 'react';
import { 
  Leaf, Clock, Thermometer, Droplets, Sun, FlaskConical, 
  Dna, TrendingUp, AlertTriangle, Ruler, Activity, Zap,
  Wind, Beaker, BookOpen, GraduationCap, Shield, Target,
  Calendar, Bell, Cpu, Gauge, Bug, Snowflake, Flame
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import type { LibraryStrainFull, GrowingStage } from '@/types';

interface StrainDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strain: LibraryStrainFull | null;
  onGrowThis: (strain: LibraryStrainFull) => void;
}

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

export function StrainDetailsDialog({
  open,
  onOpenChange,
  strain,
  onGrowThis,
}: StrainDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('resistance');

  if (!strain) return null;

  // ========== DATA EXTRACTION ==========
  const rawParams = strain.growing_params;
  const growingParams: any = rawParams 
    ? (typeof rawParams === 'string' ? JSON.parse(rawParams) : rawParams) 
    : null;
  
  // Extract new Universal Plant Schema fields
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
  const difficultyLevel = growingParams?.difficulty_level || strain.difficulty || null;

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

  // Build Smart Timeline - combine stages with alerts
  const smartTimeline = useMemo(() => {
    if (!stages.length) return [];
    
    let cumulativeDay = 0;
    const timeline: { day: number; stageName: string; stageDay: number; event: string; type: 'stage_start' | 'alert' }[] = [];
    
    stages.forEach((stage, idx) => {
      const stageDays = (stage.weeks_duration || 0) * 7 || parseInt(stage.weeks || '0') * 7 || 14;
      const stageStartDay = cumulativeDay;
      
      // Add stage start marker
      timeline.push({
        day: stageStartDay,
        stageName: stage.label_ua || stage.name || `Stage ${idx + 1}`,
        stageDay: 0,
        event: `${getStageIcon(stage.name || '')} Початок: ${stage.label_ua || stage.name}`,
        type: 'stage_start'
      });
      
      // Find alerts for this stage
      const stageAlerts = timelineAlerts.filter((alert: any) => 
        alert.trigger_stage?.toLowerCase() === stage.name?.toLowerCase()
      );
      
      stageAlerts.forEach((alert: any) => {
        const alertDay = stageStartDay + (alert.day_offset || 0);
        timeline.push({
          day: alertDay,
          stageName: stage.label_ua || stage.name || '',
          stageDay: alert.day_offset || 0,
          event: alert.message || alert.alert_message || 'Alert',
          type: 'alert'
        });
      });
      
      cumulativeDay += stageDays;
    });
    
    return timeline.sort((a, b) => a.day - b.day);
  }, [stages, timelineAlerts]);

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

  const handleGrow = () => {
    onGrowThis(strain);
    onOpenChange(false);
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-0">
          <DialogTitle className="sr-only">{strain.name}</DialogTitle>
        </DialogHeader>

        {/* ========== HERO SECTION WITH MORPHOLOGY ========== */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Image + Basic Info */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-4 lg:w-64">
            {/* Image */}
            <div className="w-full sm:w-48 lg:w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0">
              {strain.photo_url ? (
                <img
                  src={getImageUrl(strain.photo_url) || ''}
                  alt={strain.name}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Leaf className="h-20 w-20 text-primary/30" />
                </div>
              )}
            </div>
            
            {/* Quick Info */}
            <div className="flex-1 lg:flex-none space-y-2">
              <h2 className="text-2xl font-bold text-foreground">{strain.name}</h2>
              {strain.breeder && (
                <p className="text-sm text-muted-foreground">🏭 {strain.breeder}</p>
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
                {!geneticPassport && strain.type && (
                  <Badge className={`border ${getTypeColor(strain.type)}`}>
                    {strain.type}
                  </Badge>
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
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-4" />

        {/* ========== 5 TABS ========== */}
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
                      {strain.flowering_days && (
                        <div>
                          <span className="text-muted-foreground">Flowering</span>
                          <div className="font-bold text-lg">{strain.flowering_days} days</div>
                        </div>
                      )}
                      {strain.yield_indoor && (
                        <div>
                          <span className="text-muted-foreground">Yield Indoor</span>
                          <div className="font-medium">{strain.yield_indoor}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ============ TAB 2: SMART TIMELINE ============ */}
          <TabsContent value="timeline" className="mt-4 space-y-4">
            <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-400" />
                  📅 Smart Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {smartTimeline.length > 0 ? (
                  <div className="space-y-3">
                    {smartTimeline.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-4 p-3 rounded-lg ${
                          item.type === 'stage_start' 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'bg-yellow-500/10 border border-yellow-500/20'
                        }`}
                      >
                        <div className={`min-w-[80px] text-center p-2 rounded-lg ${
                          item.type === 'stage_start' 
                            ? 'bg-primary/20' 
                            : 'bg-yellow-500/20'
                        }`}>
                          <div className="text-xs text-muted-foreground">Day</div>
                          <div className="text-xl font-bold">{item.day}</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {item.type === 'alert' && (
                              <Bell className="h-4 w-4 text-yellow-400" />
                            )}
                            <span className={`font-medium ${
                              item.type === 'stage_start' 
                                ? 'text-primary' 
                                : 'text-yellow-400'
                            }`}>
                              {item.event}
                            </span>
                          </div>
                          {item.type === 'alert' && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.stageName} Day {item.stageDay}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No timeline data configured</p>
                    <p className="text-xs mt-1">Add stages and timeline_alerts to populate</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ TAB 3: ENVIRONMENT TARGETS ============ */}
          <TabsContent value="environment" className="mt-4 space-y-4">
            <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-orange-400" />
                  🌡️ Environment Targets Grid
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
                  </div>
                )}
              </CardContent>
            </Card>
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

            {/* Example Rule Card */}
            {conditionalAlerts.length === 0 && (
              <Card className="bg-card/50 border-dashed">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">Example structure:</p>
                  <pre className="text-xs bg-muted/50 p-3 rounded overflow-x-auto">
{`{
  "name": "Heat Stress Rule",
  "condition": "temp > 30",
  "action": "Send High Priority Alert",
  "priority": "high"
}`}
                  </pre>
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

            {/* Description */}
            {strain.description && (
              <Card className="bg-card/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    📝 Full Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {strain.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {!cultivationTips?.training && !cultivationTips?.substrate && !cultivationTips?.warnings?.length && !strain.description && (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Wiki not populated for this strain</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Close
          </Button>
          <Button onClick={handleGrow} className="flex-1 bg-primary hover:bg-primary/90 gap-2">
            <Leaf className="h-4 w-4" />
            🌱 Grow This
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
