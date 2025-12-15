import { useState } from 'react';
import { 
  Leaf, Clock, Thermometer, Droplets, Sun, FlaskConical, 
  Dna, TrendingUp, AlertTriangle, Ruler, Activity, Zap, User
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
import type { LibraryStrainFull, GrowingParams, ClimateScheduleEntry } from '@/types';

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

export function StrainDetailsDialog({
  open,
  onOpenChange,
  strain,
  onGrowThis,
}: StrainDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('passport');

  if (!strain) return null;

  const growingParams = strain.growing_params as GrowingParams | null;
  const climateSchedule = growingParams?.climate_schedule || [];
  const lighting = growingParams?.lighting;
  const nutrition = growingParams?.nutrition;
  const generalInfo = growingParams?.general_info;

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

              {/* Height Card */}
              {generalInfo?.height_indoor && (
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Ruler className="h-4 w-4 text-primary" />
                      Висота Indoor
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {generalInfo.height_indoor}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Smell Level Card */}
              {generalInfo?.smell_level && (
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Рівень запаху
                    </div>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                      {generalInfo.smell_level}
                    </Badge>
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

          {/* Environment Tab - Climate Schedule Table */}
          <TabsContent value="environment" className="mt-4 space-y-3">
            {climateSchedule.length > 0 ? (
              <Card className="bg-card/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-primary" />
                    Кліматичний розклад
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
                              День/Ніч
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
                        {climateSchedule.map((entry: ClimateScheduleEntry, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              {entry.stage === 'Seedling' && '🌱 '}
                              {entry.stage === 'Vegetation' && '🌿 '}
                              {entry.stage === 'Flowering' && '🌸 '}
                              {entry.stage}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {entry.weeks}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                                {entry.temp_day}°C / {entry.temp_night}°C
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                                {entry.humidity}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                                {entry.vpd} kPa
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
          </TabsContent>

          {/* Nutrients & Light Tab */}
          <TabsContent value="nutrients" className="mt-4 space-y-4">
            {/* Lighting PPFD */}
            {lighting && (
              <Card className="bg-card/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    Освітлення (PPFD µmol/m²/s)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="text-xs text-muted-foreground mb-1">🌱 Seedling</div>
                      <div className="text-lg font-bold text-green-400">
                        {lighting.seedling_ppfd}
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-xs text-muted-foreground mb-1">🌿 Veg</div>
                      <div className="text-lg font-bold text-emerald-400">
                        {lighting.veg_ppfd}
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="text-xs text-muted-foreground mb-1">🌸 Bloom</div>
                      <div className="text-lg font-bold text-amber-400">
                        {lighting.bloom_ppfd}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nutrition EC */}
            {nutrition && (
              <Card className="bg-card/50">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-purple-500" />
                    Живлення (EC mS/cm)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-xs text-muted-foreground mb-1">🌿 Vegetative EC</div>
                      <div className="text-lg font-bold text-emerald-400">
                        {nutrition.veg_ec}
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                      <div className="text-xs text-muted-foreground mb-1">🌸 Bloom EC</div>
                      <div className="text-lg font-bold text-pink-400">
                        {nutrition.bloom_ec}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!lighting && !nutrition && (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <FlaskConical className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p>Дані про живлення для цього сорту поки не налаштовано</p>
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
