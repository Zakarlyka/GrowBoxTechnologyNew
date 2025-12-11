import { useState } from 'react';
import { Leaf, Clock, Thermometer, Droplets, Sun, FlaskConical } from 'lucide-react';
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

interface StrainPresets {
  [key: string]: {
    temp?: number;
    hum?: number;
    light_h?: number;
    soil_min?: number;
    soil_max?: number;
  };
}

interface LibraryStrainFull {
  id: number;
  name: string;
  breeder: string | null;
  type: string | null;
  flowering_days: number | null;
  photo_url: string | null;
  description: string | null;
  presets: StrainPresets | null;
}

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

export function StrainDetailsDialog({
  open,
  onOpenChange,
  strain,
  onGrowThis,
}: StrainDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState('phases');

  if (!strain) return null;

  const presets = strain.presets || {};
  const phases = Object.keys(presets);

  const handleGrow = () => {
    onGrowThis(strain);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="pb-0">
          <DialogTitle className="sr-only">{strain.name}</DialogTitle>
        </DialogHeader>

        {/* Hero Section */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Image */}
          <div className="w-full sm:w-48 h-48 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0">
            {strain.photo_url ? (
              <img
                src={strain.photo_url}
                alt={strain.name}
                className="w-full h-full object-cover"
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
              {strain.flowering_days && (
                <Badge variant="outline" className="text-sm gap-1">
                  <Clock className="h-3 w-3" />
                  {strain.flowering_days} днів цвітіння
                </Badge>
              )}
            </div>

            {/* Description */}
            {strain.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {strain.description}
              </p>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="phases" className="gap-2">
              <Thermometer className="h-4 w-4" />
              Фази росту
            </TabsTrigger>
            <TabsTrigger value="nutrients" className="gap-2">
              <FlaskConical className="h-4 w-4" />
              Живлення
            </TabsTrigger>
          </TabsList>

          {/* Growing Phases Tab */}
          <TabsContent value="phases" className="mt-4 space-y-3">
            {phases.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <p>Пресети для цього сорту ще не налаштовано</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {phases.map((phase) => {
                  const preset = presets[phase];
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
                            <Badge 
                              variant="outline" 
                              className="gap-1.5 py-1.5 px-3 bg-orange-500/10 text-orange-400 border-orange-500/30"
                            >
                              <Thermometer className="h-3.5 w-3.5" />
                              {preset.temp}°C
                            </Badge>
                          )}
                          {preset?.hum !== undefined && (
                            <Badge 
                              variant="outline" 
                              className="gap-1.5 py-1.5 px-3 bg-blue-500/10 text-blue-400 border-blue-500/30"
                            >
                              <Droplets className="h-3.5 w-3.5" />
                              {preset.hum}%
                            </Badge>
                          )}
                          {preset?.light_h !== undefined && (
                            <Badge 
                              variant="outline" 
                              className="gap-1.5 py-1.5 px-3 bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                            >
                              <Sun className="h-3.5 w-3.5" />
                              {preset.light_h}h ON
                            </Badge>
                          )}
                          {preset?.soil_min !== undefined && preset?.soil_max !== undefined && (
                            <Badge 
                              variant="outline" 
                              className="gap-1.5 py-1.5 px-3 bg-green-500/10 text-green-400 border-green-500/30"
                            >
                              <Leaf className="h-3.5 w-3.5" />
                              Soil: {preset.soil_min}-{preset.soil_max}%
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Nutrients Tab */}
          <TabsContent value="nutrients" className="mt-4">
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <FlaskConical className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p>Розклад живлення для цього сорту поки не налаштовано</p>
                <p className="text-xs mt-2">
                  Використовуйте Калькулятор Добрив в Лабораторії
                </p>
              </CardContent>
            </Card>
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
