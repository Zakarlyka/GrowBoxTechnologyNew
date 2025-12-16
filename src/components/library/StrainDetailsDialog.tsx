import { useState } from 'react';
import { 
  Leaf, Clock, Thermometer, Droplets, Sun, FlaskConical, 
  Dna, TrendingUp, AlertTriangle, Ruler, Activity, Zap, User,
  Wind, Beaker
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
  const name = stageName.toLowerCase();
  if (name.includes('seedling') || name.includes('germination')) return '🌱';
  if (name.includes('veg')) return '🌿';
  if (name.includes('pre-flower') || name.includes('preflower')) return '🌼';
  if (name.includes('flower') || name.includes('bloom')) return '🌸';
  if (name.includes('flush')) return '💧';
  if (name.includes('dry') || name.includes('harvest')) return '🍂';
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

  const growingParams = strain.growing_params as GrowingParams | null;
  const stages = growingParams?.stages || [];
  const risks = growingParams?.risks || [];
  const phenotype = growingParams?.phenotype;
  const recommendations = growingParams?.recommendations;
  const postHarvest = growingParams?.post_harvest;

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

  // Get THC value (prefer numeric thc_percent, fallback to string thc_content)
  const thcDisplay = strain.thc_percent 
    ? `${strain.thc_percent}%` 
    : strain.thc_content || null;

  // Format temp array as "night°C / day°C"
  const formatTemp = (temp: [number, number] | undefined) => {
    if (!temp || !Array.isArray(temp)) return '--';
    return `${temp[0]}°C / ${temp[1]}°C`;
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
              {strain.genetics && !strain.genotype && (
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

          {/* Passport Tab */}
          <TabsContent value="passport" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Genotype Card */}
              {strain.genotype && (
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Dna className="h-4 w-4 text-primary" />
                      Генотип
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {strain.genotype}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* THC Card */}
              {thcDisplay && (
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <FlaskConical className="h-4 w-4 text-green-500" />
                      THC
                    </div>
                    <div className="text-lg font-bold text-green-400">
                      {thcDisplay}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Type Card */}
              {strain.type && (
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Leaf className="h-4 w-4 text-primary" />
                      Тип
                    </div>
                    <Badge className={`text-sm border ${getTypeColor(strain.type)}`}>
                      {strain.type}
                    </Badge>
                  </CardContent>
                </Card>
              )}

              {/* Breeder Card */}
              {strain.breeder && (
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <User className="h-4 w-4 text-primary" />
                      Бридер
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {strain.breeder}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Flowering Days Card */}
              {strain.flowering_days && (
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Цвітіння
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {strain.flowering_days} днів
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Difficulty Card */}
              {strain.difficulty && (
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Складність
                    </div>
                    <Badge className={`text-sm border ${getDifficultyColor(strain.difficulty)}`}>
                      {strain.difficulty}
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Phenotype Section */}
            {phenotype && (Object.keys(phenotype).length > 0) && (
              <Card className="bg-card/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-primary" />
                    Фенотип
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {phenotype.height_indoor && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Висота Indoor:</span>
                        <span className="ml-2 font-medium">{phenotype.height_indoor}</span>
                      </div>
                    )}
                    {phenotype.height_outdoor && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Висота Outdoor:</span>
                        <span className="ml-2 font-medium">{phenotype.height_outdoor}</span>
                      </div>
                    )}
                    {phenotype.aroma && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Аромат:</span>
                        <span className="ml-2 font-medium">{phenotype.aroma}</span>
                      </div>
                    )}
                    {phenotype.structure && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Структура:</span>
                        <span className="ml-2 font-medium">{phenotype.structure}</span>
                      </div>
                    )}
                    {phenotype.color && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Колір:</span>
                        <span className="ml-2 font-medium">{phenotype.color}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Risks Warning Box */}
            {risks.length > 0 && (
              <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/30 text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Ризики та особливості</AlertTitle>
                <AlertDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {risks.map((risk, idx) => (
                      <Badge key={idx} variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        ⚠️ {risk}
                      </Badge>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Full Description */}
            {strain.description && (
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {strain.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Environment Tab - Dynamic Stages Timeline */}
          <TabsContent value="environment" className="mt-4 space-y-4">
            {stages.length > 0 ? (
              <Card className="bg-card/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-primary" />
                    Кліматичний розклад по стадіях
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
                              Ніч/День
                            </div>
                          </TableHead>
                          <TableHead className="font-medium">
                            <div className="flex items-center gap-1">
                              <Droplets className="h-3 w-3 text-blue-400" />
                              RH %
                            </div>
                          </TableHead>
                          <TableHead className="font-medium">
                            <div className="flex items-center gap-1">
                              <Activity className="h-3 w-3 text-cyan-400" />
                              VPD
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stages.map((stage: GrowingStage, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              {getStageIcon(stage.name)} {stage.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {stage.weeks || '--'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                                {formatTemp(stage.temp)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                                {stage.humidity}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                                {stage.vpd} kPa
                              </Badge>
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
                    🍂 Пост-харвест (Сушіння)
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

          {/* Nutrients & Light Tab - PPFD/EC from Stages */}
          <TabsContent value="nutrients" className="mt-4 space-y-4">
            {stages.length > 0 ? (
              <>
                {/* PPFD & EC per Stage */}
                <Card className="bg-card/50">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Sun className="h-4 w-4 text-yellow-500" />
                      Освітлення та Живлення по стадіях
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
                                PPFD
                              </div>
                            </TableHead>
                            <TableHead className="font-medium">
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-green-400" />
                                EC
                              </div>
                            </TableHead>
                            {stages.some(s => s.light_hours) && (
                              <TableHead className="font-medium">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-amber-400" />
                                  Світло
                                </div>
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stages.map((stage: GrowingStage, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                {getStageIcon(stage.name)} {stage.name}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                  {stage.ppfd} µmol
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                                  {stage.ec} mS/cm
                                </Badge>
                              </TableCell>
                              {stages.some(s => s.light_hours) && (
                                <TableCell>
                                  {stage.light_hours ? (
                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                                      {stage.light_hours}h ON
                                    </Badge>
                                  ) : '--'}
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* pH Recommendations */}
                {recommendations && (recommendations.ph_soil || recommendations.ph_hydro) && (
                  <Card className="bg-card/50">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Beaker className="h-4 w-4 text-cyan-500" />
                        Рекомендації pH
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
                      {recommendations.training && (
                        <div className="mt-4 pt-3 border-t border-border">
                          <div className="text-sm text-muted-foreground">Тренування:</div>
                          <div className="font-medium">{recommendations.training}</div>
                        </div>
                      )}
                      {recommendations.notes && (
                        <p className="text-sm text-muted-foreground mt-3 italic">
                          💡 {recommendations.notes}
                        </p>
                      )}
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
