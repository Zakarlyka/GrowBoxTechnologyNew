import { useState } from 'react';
import { 
  Leaf, Clock, Thermometer, Droplets, Sun, FlaskConical, 
  Dna, TrendingUp, AlertTriangle, Ruler, Activity, Zap, User,
  Wind, Beaker, BookOpen, GraduationCap, Lightbulb, Shield
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { LibraryStrainFull, GrowingParams, GrowingStage } from '@/types';

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
    case 'photoperiod':
    case 'photo':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
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

export function StrainDetailsDialog({
  open,
  onOpenChange,
  strain,
  onGrowThis,
}: StrainDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('passport');

  if (!strain) return null;

  // ========== EXPLICIT DATA EXTRACTION ==========
  const rawParams = strain.growing_params;
  const growingParams: any = rawParams 
    ? (typeof rawParams === 'string' ? JSON.parse(rawParams) : rawParams) 
    : null;
  
  // EXPLICIT: Extract genetic_passport object (NEW STRUCTURE)
  const geneticPassport = growingParams?.genetic_passport || null;
  
  // EXPLICIT: Extract stages array
  const stages: GrowingStage[] = growingParams?.stages && Array.isArray(growingParams.stages) 
    ? growingParams.stages 
    : [];
  
  // EXPLICIT: Extract risks array  
  const risks: string[] = growingParams?.risks && Array.isArray(growingParams.risks) 
    ? growingParams.risks 
    : [];
  
  // EXPLICIT: Extract phenotype object
  const phenotype = growingParams?.phenotype || null;
  
  // EXPLICIT: Extract recommendations object (legacy)
  const recommendations = growingParams?.recommendations || null;
  
  // EXPLICIT: Extract cultivation_tips object (NEW STRUCTURE)
  const cultivationTips = growingParams?.cultivation_tips || null;
  
  // EXPLICIT: Extract post_harvest object
  const postHarvest = growingParams?.post_harvest || null;

  // DEBUG LOG
  console.log('[StrainDetails] strain:', strain.name);
  console.log('[StrainDetails] growingParams:', growingParams);
  console.log('[StrainDetails] geneticPassport:', geneticPassport);
  console.log('[StrainDetails] cultivationTips:', cultivationTips);
  console.log('[StrainDetails] stages:', stages);

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

  // Get THC value - prefer genetic_passport, then numeric thc_percent, fallback to string
  const thcDisplay = geneticPassport?.thc_range 
    || (strain.thc_percent ? `${strain.thc_percent}%` : null)
    || strain.thc_content 
    || null;

  // Format temp array as "night°C / day°C"
  const formatTemp = (temp: [number, number] | number[] | undefined) => {
    if (!temp || !Array.isArray(temp) || temp.length < 2) return '--';
    return `${temp[0]}°C / ${temp[1]}°C`;
  };

  // Format weeks
  const formatWeeks = (stage: GrowingStage) => {
    if (stage.weeks) return stage.weeks;
    if (stage.weeks_duration) return `${stage.weeks_duration} тиж.`;
    return '--';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              {thcDisplay && (
                <Badge variant="outline" className="text-sm gap-1 bg-green-500/10 text-green-400 border-green-500/30">
                  THC {thcDisplay}
                </Badge>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {strain.genotype && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Dna className="h-4 w-4" />
                  {strain.genotype}
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

        {/* 4 TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="passport" className="gap-1 text-xs">
              <Dna className="h-4 w-4" />
              <span className="hidden sm:inline">Паспорт</span>
            </TabsTrigger>
            <TabsTrigger value="environment" className="gap-1 text-xs">
              <Thermometer className="h-4 w-4" />
              <span className="hidden sm:inline">Середовище</span>
            </TabsTrigger>
            <TabsTrigger value="nutrients" className="gap-1 text-xs">
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">Живлення</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-1 text-xs">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Wiki</span>
            </TabsTrigger>
          </TabsList>

          {/* ============ TAB 1: PASSPORT (Genetics & Phenotype) ============ */}
          <TabsContent value="passport" className="mt-4 space-y-4">
            
            {/* GENETICS BREAKDOWN - EXPLICIT FROM genetic_passport */}
            {geneticPassport && (
              <Card className="bg-gradient-to-br from-purple-500/10 to-orange-500/10 border-purple-500/20">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Dna className="h-4 w-4 text-purple-400" />
                    🧬 Генетичний склад
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  {/* Percentage Bars */}
                  <div className="space-y-3">
                    {/* Sativa */}
                    {geneticPassport.sativa_percent !== undefined && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-orange-400 font-medium">☀️ Sativa</span>
                          <span className="text-orange-400 font-bold">{geneticPassport.sativa_percent}%</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all"
                            style={{ width: `${geneticPassport.sativa_percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Indica */}
                    {geneticPassport.indica_percent !== undefined && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-purple-400 font-medium">🌙 Indica</span>
                          <span className="text-purple-400 font-bold">{geneticPassport.indica_percent}%</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all"
                            style={{ width: `${geneticPassport.indica_percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Ruderalis */}
                    {geneticPassport.ruderalis_percent !== undefined && geneticPassport.ruderalis_percent > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-green-400 font-medium">🌾 Ruderalis</span>
                          <span className="text-green-400 font-bold">{geneticPassport.ruderalis_percent}%</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
                            style={{ width: `${geneticPassport.ruderalis_percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* THC Range */}
                  {geneticPassport.thc_range && (
                    <div className="mt-4 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <FlaskConical className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">THC Діапазон</div>
                          <div className="text-lg font-bold text-green-400">{geneticPassport.thc_range}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* PHENOTYPE BOX - EXPLICIT RENDERING */}
            {phenotype && (
              <Card className="bg-card/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-primary" />
                    🌿 Фенотип
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Height Indoor */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Ruler className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">📏 Висота Indoor</div>
                        <div className="font-medium text-foreground">
                          {phenotype.height_indoor || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Height Outdoor */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Ruler className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">🌳 Висота Outdoor</div>
                        <div className="font-medium text-foreground">
                          {phenotype.height_outdoor || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Structure */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Leaf className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">🌲 Структура</div>
                        <div className="font-medium text-foreground">
                          {phenotype.structure || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Aroma - HIGHLIGHTED */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30">
                      <div className="h-10 w-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                        <span className="text-xl">🌸</span>
                      </div>
                      <div>
                        <div className="text-xs text-pink-300">✨ Аромат (Highlight!)</div>
                        <div className="font-bold text-pink-200">
                          {phenotype.aroma || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* RESISTANCE / RISKS - EXPLICIT RENDERING */}
            {risks.length > 0 && (
              <Alert className="bg-red-500/10 border-red-500/30">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <AlertTitle className="text-red-400 font-semibold">
                  🛡️ Стійкість та Ризики
                </AlertTitle>
                <AlertDescription>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {risks.map((risk: string, idx: number) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="bg-red-500/20 text-red-400 border-red-500/40 py-1.5"
                      >
                        ⚠️ {risk}
                      </Badge>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Basic Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {strain.type && (
                <Card className="bg-card/50">
                  <CardContent className="p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Тип</div>
                    <Badge className={`text-sm border ${getTypeColor(strain.type)}`}>
                      {strain.type}
                    </Badge>
                  </CardContent>
                </Card>
              )}
              {strain.breeder && (
                <Card className="bg-card/50">
                  <CardContent className="p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Бридер</div>
                    <div className="font-medium text-sm">{strain.breeder}</div>
                  </CardContent>
                </Card>
              )}
              {strain.flowering_days && (
                <Card className="bg-card/50">
                  <CardContent className="p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Цвітіння</div>
                    <div className="font-bold text-lg">{strain.flowering_days}д</div>
                  </CardContent>
                </Card>
              )}
              {strain.difficulty && (
                <Card className="bg-card/50">
                  <CardContent className="p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Складність</div>
                    <Badge className={`text-sm border ${getDifficultyColor(strain.difficulty)}`}>
                      {strain.difficulty}
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ============ TAB 2: ENVIRONMENT (Stage Table with Description) ============ */}
          <TabsContent value="environment" className="mt-4 space-y-4">
            {stages.length > 0 ? (
              <Card className="bg-card/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-primary" />
                    🌡️ Кліматичний розклад (Robot's Guide)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-medium">Стадія</TableHead>
                          <TableHead className="font-medium">Тижні</TableHead>
                          <TableHead className="font-medium">
                            <div className="flex items-center gap-1">
                              <Thermometer className="h-3 w-3 text-orange-400" />
                              Темп.
                            </div>
                          </TableHead>
                          <TableHead className="font-medium">
                            <div className="flex items-center gap-1">
                              <Droplets className="h-3 w-3 text-blue-400" />
                              RH%
                            </div>
                          </TableHead>
                          <TableHead className="font-medium">
                            <div className="flex items-center gap-1">
                              <Activity className="h-3 w-3 text-cyan-400" />
                              VPD
                            </div>
                          </TableHead>
                          <TableHead className="font-medium min-w-[200px]">
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3 text-violet-400" />
                              Опис
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stages.map((stage: GrowingStage, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium whitespace-nowrap">
                              {getStageIcon(stage.name || '')} {stage.label_ua || stage.name || `Stage ${idx + 1}`}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatWeeks(stage)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                                {formatTemp(stage.temp)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                                {stage.humidity ? `${stage.humidity}%` : '--'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                                {stage.vpd ? `${stage.vpd} kPa` : '--'}
                              </Badge>
                            </TableCell>
                            {/* DESCRIPTION COLUMN - EXPLICIT */}
                            <TableCell className="text-sm text-muted-foreground max-w-[250px]">
                              {(stage as any).description || '--'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Thermometer className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p>Дані про середовище для цього сорту ще не налаштовано</p>
                </CardContent>
              </Card>
            )}

            {/* Post-Harvest / Drying Instructions */}
            {postHarvest && (
              <Card className="bg-card/50 border-amber-500/20">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    🍂 Пост-харвест (Сушіння та Пролікування)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {postHarvest.drying_temp && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Температура:</span>
                        <Badge variant="outline" className="ml-2 bg-orange-500/10 text-orange-400">
                          {postHarvest.drying_temp}°C
                        </Badge>
                      </div>
                    )}
                    {postHarvest.drying_humidity && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Вологість:</span>
                        <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-400">
                          {postHarvest.drying_humidity}%
                        </Badge>
                      </div>
                    )}
                    {postHarvest.drying_days && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Тривалість:</span>
                        <span className="ml-2 font-medium">{postHarvest.drying_days} днів</span>
                      </div>
                    )}
                  </div>
                  {postHarvest.curing_notes && (
                    <p className="text-sm text-muted-foreground mt-3 italic">
                      💡 {postHarvest.curing_notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============ TAB 3: NUTRITION & LIGHT ============ */}
          <TabsContent value="nutrients" className="mt-4 space-y-4">
            {stages.length > 0 ? (
              <>
                {/* PPFD & EC per Stage Table */}
                <Card className="bg-card/50">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Sun className="h-4 w-4 text-yellow-500" />
                      🧪 PPFD та EC по стадіях
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-medium">Стадія</TableHead>
                            <TableHead className="font-medium">
                              <div className="flex items-center gap-1">
                                <Sun className="h-3 w-3 text-yellow-400" />
                                PPFD (µmol)
                              </div>
                            </TableHead>
                            <TableHead className="font-medium">
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-green-400" />
                                EC (mS/cm)
                              </div>
                            </TableHead>
                            <TableHead className="font-medium">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-amber-400" />
                                Світло (год)
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stages.map((stage: GrowingStage, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                {getStageIcon(stage.name || '')} {stage.label_ua || stage.name || `Stage ${idx + 1}`}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                  {stage.ppfd || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                                  {stage.ec || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {stage.light_hours ? (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                                    {stage.light_hours}h
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">--</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* LIGHT SCHEDULE FROM cultivation_tips */}
                {cultivationTips?.light_schedule && (
                  <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Sun className="h-4 w-4 text-yellow-400" />
                        💡 Світловий режим (Light Schedule)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <p className="text-sm text-foreground leading-relaxed">
                        {cultivationTips.light_schedule}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* pH Recommendations (legacy) */}
                {recommendations && (recommendations.ph_soil || recommendations.ph_hydro) && (
                  <Card className="bg-card/50">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Beaker className="h-4 w-4 text-cyan-500" />
                        🧪 Рекомендації pH
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="grid grid-cols-2 gap-4">
                        {recommendations.ph_soil && (
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                              <span className="text-lg">🌱</span>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">pH Ґрунт</div>
                              <div className="text-lg font-bold text-amber-400">{recommendations.ph_soil}</div>
                            </div>
                          </div>
                        )}
                        {recommendations.ph_hydro && (
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                              <span className="text-lg">💧</span>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">pH Гідро</div>
                              <div className="text-lg font-bold text-cyan-400">{recommendations.ph_hydro}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <FlaskConical className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p>Дані про живлення для цього сорту ще не налаштовано</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============ TAB 4: KNOWLEDGE BASE (Wiki) ============ */}
          <TabsContent value="knowledge" className="mt-4 space-y-4">
            
            {/* TRAINING ADVICE - EXPLICIT FROM cultivation_tips */}
            {cultivationTips?.training && (
              <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-violet-400" />
                    🎓 Тренування (Training Advice)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <p className="text-sm text-foreground leading-relaxed">
                    {cultivationTips.training}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* SUBSTRATE / pH - EXPLICIT FROM cultivation_tips */}
            {cultivationTips?.substrate && (
              <Card className="bg-card/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Beaker className="h-4 w-4 text-amber-400" />
                    🌱 Субстрат та pH
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <p className="text-sm text-foreground leading-relaxed">
                    {cultivationTips.substrate}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Legacy recommendations.training and notes */}
            {recommendations?.training && !cultivationTips?.training && (
              <Card className="bg-card/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-violet-400" />
                    🎓 Тренування
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <p className="text-sm text-foreground leading-relaxed">
                    {recommendations.training}
                  </p>
                  {recommendations.notes && (
                    <p className="text-sm text-muted-foreground mt-3 italic">
                      💡 {recommendations.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* WARNINGS - EXPLICIT FROM cultivation_tips */}
            {cultivationTips?.warnings && Array.isArray(cultivationTips.warnings) && cultivationTips.warnings.length > 0 && (
              <Alert className="bg-yellow-500/10 border-yellow-500/30">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <AlertTitle className="text-yellow-400 font-semibold">
                  ⚠️ Важливі Попередження
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

            {/* If no cultivation_tips at all */}
            {!cultivationTips?.training && !cultivationTips?.substrate && !cultivationTips?.warnings?.length && !recommendations?.training && (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p>База знань для цього сорту ще не заповнена</p>
                </CardContent>
              </Card>
            )}

            {/* Full Description */}
            {strain.description && (
              <Card className="bg-card/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    📝 Повний опис
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {strain.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Закрити
          </Button>
          <Button onClick={handleGrow} className="flex-1 bg-primary hover:bg-primary/90 gap-2">
            <Leaf className="h-4 w-4" />
            🌱 Вирощувати
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
