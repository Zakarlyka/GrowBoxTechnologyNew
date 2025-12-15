import { useState } from 'react';
import { 
  Leaf, Clock, Thermometer, Droplets, Sun, FlaskConical, 
  Dna, TrendingUp, AlertTriangle, Ruler, Activity, Zap
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
import type { LibraryStrainFull, StrainPresets, LabData, EnvironmentPhase } from '@/types';

interface StrainDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strain: LibraryStrainFull | null;
  onGrowThis: (strain: LibraryStrainFull) => void;
}

const PHASE_LABELS: Record<string, string> = {
  seedling: '🌱 Проростання',
  seedlings: '🌱 Проростання',
  veg: '🌿 Вегетація',
  vegetative: '🌿 Вегетація',
  vegetation: '🌿 Вегетація',
  bloom: '🌸 Цвітіння',
  flower: '🌸 Цвітіння',
  flowering: '🌸 Цвітіння',
  flush: '💧 Промивка',
  flushing: '💧 Промивка',
};

const getPhaseLabel = (phase: string): string => {
  return PHASE_LABELS[phase.toLowerCase()] || phase;
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
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getDifficultyColor = (difficulty: string | null) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'hard':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

// Genetics Bar Component
function GeneticsBar({ genetics }: { genetics: { sativa: number; indica: number; ruderalis: number } }) {
  const total = genetics.sativa + genetics.indica + genetics.ruderalis;
  if (total === 0) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Dna className="h-4 w-4 text-primary" />
        Генетичний склад
      </div>
      <div className="flex h-4 rounded-full overflow-hidden border border-border">
        {genetics.sativa > 0 && (
          <div 
            className="bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white"
            style={{ width: `${(genetics.sativa / total) * 100}%` }}
          >
            {genetics.sativa > 15 && `${genetics.sativa}%`}
          </div>
        )}
        {genetics.indica > 0 && (
          <div 
            className="bg-purple-500 flex items-center justify-center text-[10px] font-bold text-white"
            style={{ width: `${(genetics.indica / total) * 100}%` }}
          >
            {genetics.indica > 15 && `${genetics.indica}%`}
          </div>
        )}
        {genetics.ruderalis > 0 && (
          <div 
            className="bg-green-500 flex items-center justify-center text-[10px] font-bold text-white"
            style={{ width: `${(genetics.ruderalis / total) * 100}%` }}
          >
            {genetics.ruderalis > 15 && `${genetics.ruderalis}%`}
          </div>
        )}
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          Sativa {genetics.sativa}%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          Indica {genetics.indica}%
        </span>
        {genetics.ruderalis > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Ruderalis {genetics.ruderalis}%
          </span>
        )}
      </div>
    </div>
  );
}

// Environment Phase Card Component
function EnvironmentCard({ phase, data }: { phase: string; data: EnvironmentPhase }) {
  return (
    <Card className="bg-card/50">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base font-medium">
          {getPhaseLabel(phase)}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3 bg-orange-500/10 text-orange-400 border-orange-500/30 justify-start">
            <Thermometer className="h-3.5 w-3.5" />
            {data.temp_day}°C / {data.temp_night}°C
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3 bg-blue-500/10 text-blue-400 border-blue-500/30 justify-start">
            <Droplets className="h-3.5 w-3.5" />
            {data.rh}% RH
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3 bg-yellow-500/10 text-yellow-400 border-yellow-500/30 justify-start">
            <Sun className="h-3.5 w-3.5" />
            {data.light_h}h ON
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3 bg-cyan-500/10 text-cyan-400 border-cyan-500/30 justify-start">
            <Activity className="h-3.5 w-3.5" />
            VPD {data.vpd} kPa
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3 bg-purple-500/10 text-purple-400 border-purple-500/30 justify-start">
            <FlaskConical className="h-3.5 w-3.5" />
            EC {data.ec}
          </Badge>
          {data.ppfd > 0 && (
            <Badge variant="outline" className="gap-1.5 py-1.5 px-3 bg-amber-500/10 text-amber-400 border-amber-500/30 justify-start">
              <Zap className="h-3.5 w-3.5" />
              {data.ppfd} PPFD
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function StrainDetailsDialog({
  open,
  onOpenChange,
  strain,
  onGrowThis,
}: StrainDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('passport');

  if (!strain) return null;

  const presets = (strain.presets || {}) as StrainPresets;
  const labData = presets.lab_data;
  const timeline = presets.timeline || [];
  const environmentSchedule = presets.environment_schedule;
  const nutrientSchedule = presets.nutrient_schedule || [];

  // Legacy support: check for old-style phase presets
  const legacyPhases = Object.keys(presets).filter(
    key => !['lab_data', 'timeline', 'environment_schedule', 'nutrient_schedule'].includes(key)
  );

  // Helper to add cache busting to Supabase Storage URLs only
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-0">
          <DialogTitle className="sr-only">{strain.name}</DialogTitle>
        </DialogHeader>

        {/* Hero Section */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Image */}
          <div className="w-full sm:w-48 h-48 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0">
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

          {/* Info */}
          <div className="flex-1 space-y-3">
            <h2 className="text-2xl font-bold text-foreground">{strain.name}</h2>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {strain.breeder && (
                <Badge variant="secondary" className="text-sm">
                  🏭 {strain.breeder}
                </Badge>
              )}
              {strain.type && (
                <Badge className={`text-sm border ${getTypeColor(strain.type)}`}>
                  {strain.type}
                </Badge>
              )}
              {strain.difficulty && (
                <Badge className={`text-sm border ${getDifficultyColor(strain.difficulty)}`}>
                  {strain.difficulty}
                </Badge>
              )}
              {strain.flowering_days && (
                <Badge variant="outline" className="text-sm gap-1">
                  <Clock className="h-3 w-3" />
                  {strain.flowering_days}d bloom
                </Badge>
              )}
              {strain.thc_content && (
                <Badge variant="outline" className="text-sm gap-1 bg-green-500/10 text-green-400 border-green-500/30">
                  THC {strain.thc_content}
                </Badge>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {strain.genetics && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Dna className="h-4 w-4" />
                  {strain.genetics}
                </div>
              )}
              {strain.yield_indoor && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  {strain.yield_indoor}
                </div>
              )}
            </div>

            {/* Description */}
            {strain.description && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {strain.description}
              </p>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="passport" className="gap-2 text-xs sm:text-sm">
              <Dna className="h-4 w-4" />
              <span className="hidden sm:inline">Паспорт</span>
            </TabsTrigger>
            <TabsTrigger value="environment" className="gap-2 text-xs sm:text-sm">
              <Thermometer className="h-4 w-4" />
              <span className="hidden sm:inline">Середовище</span>
            </TabsTrigger>
            <TabsTrigger value="nutrients" className="gap-2 text-xs sm:text-sm">
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">Живлення</span>
            </TabsTrigger>
          </TabsList>

          {/* Passport Tab - Lab Data */}
          <TabsContent value="passport" className="mt-4 space-y-4">
            {labData ? (
              <>
                {/* Genetics Bar */}
                {labData.genetics_mix && (
                  <GeneticsBar genetics={labData.genetics_mix} />
                )}

                {/* Lab Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {labData.height && (
                    <Card className="bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <Ruler className="h-4 w-4 text-primary" />
                          Висота
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Indoor: {labData.height.indoor}</div>
                          <div>Outdoor: {labData.height.outdoor}</div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {labData.lifecycle_total && (
                    <Card className="bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <Clock className="h-4 w-4 text-primary" />
                          Цикл
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {labData.lifecycle_total}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {labData.cbd && (
                    <Card className="bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <FlaskConical className="h-4 w-4 text-primary" />
                          CBD
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {labData.cbd}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {labData.training && (
                    <Card className="bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <Leaf className="h-4 w-4 text-primary" />
                          Тренування
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          {labData.training}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Risks */}
                {labData.risks && labData.risks.length > 0 && (
                  <Card className="bg-amber-500/5 border-amber-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-sm font-medium mb-2 text-amber-500">
                        <AlertTriangle className="h-4 w-4" />
                        Ризики
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {labData.risks.map((risk, idx) => (
                          <Badge key={idx} variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                            {risk}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Timeline */}
                {timeline.length > 0 && (
                  <Card className="bg-card/50">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Таймлайн росту
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="space-y-3">
                        {timeline.map((phase, idx) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <div className="w-20 text-xs font-medium text-muted-foreground shrink-0">
                              {phase.duration}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{phase.phase}</div>
                              <div className="text-xs text-muted-foreground">{phase.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Dna className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p>Лабораторні дані для цього сорту ще не налаштовано</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Environment Tab */}
          <TabsContent value="environment" className="mt-4 space-y-3">
            {environmentSchedule ? (
              <div className="grid gap-3">
                {Object.entries(environmentSchedule).map(([phase, data]) => (
                  <EnvironmentCard key={phase} phase={phase} data={data} />
                ))}
              </div>
            ) : legacyPhases.length > 0 ? (
              // Legacy support for old presets format
              <div className="grid gap-3">
                {legacyPhases.map((phase) => {
                  const preset = (presets as any)[phase];
                  if (!preset) return null;
                  
                  return (
                    <Card key={phase} className="bg-card/50">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-base font-medium">
                          {getPhaseLabel(phase)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0">
                        <div className="flex flex-wrap gap-2">
                          {preset?.temp !== undefined && (
                            <Badge variant="outline" className="gap-1.5 py-1.5 px-3 bg-orange-500/10 text-orange-400 border-orange-500/30">
                              <Thermometer className="h-3.5 w-3.5" />
                              {preset.temp}°C
                            </Badge>
                          )}
                          {preset?.hum !== undefined && (
                            <Badge variant="outline" className="gap-1.5 py-1.5 px-3 bg-blue-500/10 text-blue-400 border-blue-500/30">
                              <Droplets className="h-3.5 w-3.5" />
                              {preset.hum}%
                            </Badge>
                          )}
                          {preset?.light_h !== undefined && (
                            <Badge variant="outline" className="gap-1.5 py-1.5 px-3 bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                              <Sun className="h-3.5 w-3.5" />
                              {preset.light_h}h ON
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <p>Пресети середовища для цього сорту ще не налаштовано</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Nutrients Tab */}
          <TabsContent value="nutrients" className="mt-4">
            {nutrientSchedule.length > 0 ? (
              <Card className="bg-card/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-primary" />
                    Графік живлення (ml/L)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b border-border">
                      <span>Тиждень</span>
                      <span>Grow</span>
                      <span>Bloom</span>
                      <span>Micro</span>
                    </div>
                    
                    {nutrientSchedule.map((week, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-2 text-sm py-1.5">
                        <span className="font-medium">W{week.week}</span>
                        <span className="text-green-400">{week.grow}</span>
                        <span className="text-pink-400">{week.bloom}</span>
                        <span className="text-purple-400">{week.micro || '-'}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <FlaskConical className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p>Розклад живлення для цього сорту поки не налаштовано</p>
                  <p className="text-xs mt-2">
                    Використовуйте Калькулятор Добрив в Лабораторії
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="pt-4">
          <Button 
            onClick={handleGrow} 
            className="w-full gap-2" 
            size="lg"
          >
            <Leaf className="h-5 w-5" />
            🌱 Вирощувати цей сорт
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
