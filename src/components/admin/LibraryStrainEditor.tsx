import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Thermometer, Droplets, Sun, FlaskConical, Zap, Activity } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { 
  LibraryStrainFull, GrowingParams, ClimateScheduleEntry, 
  GrowingLighting, GrowingNutrition, GrowingGeneralInfo 
} from '@/types';

interface LibraryStrainEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strain?: LibraryStrainFull | null;
  onSuccess: () => void;
  isAdmin?: boolean;
}

const DEFAULT_CLIMATE_SCHEDULE: ClimateScheduleEntry[] = [
  { stage: 'Seedling', weeks: '1-2', temp_day: 25, temp_night: 22, humidity: 70, vpd: '0.6-0.8' },
  { stage: 'Vegetation', weeks: '3-4', temp_day: 26, temp_night: 22, humidity: 60, vpd: '0.8-1.1' },
  { stage: 'Flowering', weeks: '5-9', temp_day: 24, temp_night: 20, humidity: 45, vpd: '1.2-1.5' },
];

const DEFAULT_LIGHTING: GrowingLighting = {
  seedling_ppfd: '150-300',
  veg_ppfd: '300-600',
  bloom_ppfd: '600-900',
};

const DEFAULT_NUTRITION: GrowingNutrition = {
  veg_ec: '1.0-1.4',
  bloom_ec: '1.5-1.8',
};

const DEFAULT_GENERAL_INFO: GrowingGeneralInfo = {
  height_indoor: '',
  smell_level: 'Medium',
};

export function LibraryStrainEditor({ open, onOpenChange, strain, onSuccess, isAdmin = false }: LibraryStrainEditorProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Basic info state
  const [name, setName] = useState('');
  const [breeder, setBreeder] = useState('');
  const [type, setType] = useState('hybrid');
  const [genotype, setGenotype] = useState('');
  const [thcPercent, setThcPercent] = useState('');
  const [description, setDescription] = useState('');
  const [floweringDays, setFloweringDays] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [genetics, setGenetics] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [yieldIndoor, setYieldIndoor] = useState('');

  // Growing params state
  const [climateSchedule, setClimateSchedule] = useState<ClimateScheduleEntry[]>(DEFAULT_CLIMATE_SCHEDULE);
  const [lighting, setLighting] = useState<GrowingLighting>(DEFAULT_LIGHTING);
  const [nutrition, setNutrition] = useState<GrowingNutrition>(DEFAULT_NUTRITION);
  const [generalInfo, setGeneralInfo] = useState<GrowingGeneralInfo>(DEFAULT_GENERAL_INFO);

  // Track initialization
  const [isInitialized, setIsInitialized] = useState(false);

  // Load strain data when dialog opens
  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      return;
    }
    
    if (isInitialized) return;
    
    if (strain) {
      // Basic info
      setName(strain.name || '');
      setBreeder(strain.breeder || '');
      setType(strain.type || 'hybrid');
      setGenotype(strain.genotype || '');
      setThcPercent(strain.thc_percent?.toString() || '');
      setDescription(strain.description || '');
      setFloweringDays(strain.flowering_days?.toString() || '');
      setPhotoUrl(strain.photo_url || '');
      setGenetics(strain.genetics || '');
      setDifficulty(strain.difficulty || 'medium');
      setYieldIndoor(strain.yield_indoor || '');
      setIsPublic(strain.is_public || false);

      // Parse growing_params
      const gp = strain.growing_params as GrowingParams | null;
      if (gp) {
        if (gp.climate_schedule?.length > 0) {
          setClimateSchedule(gp.climate_schedule);
        }
        if (gp.lighting) {
          setLighting(gp.lighting);
        }
        if (gp.nutrition) {
          setNutrition(gp.nutrition);
        }
        if (gp.general_info) {
          setGeneralInfo(gp.general_info);
        }
      }
    } else {
      // Reset form for new strain
      setName('');
      setBreeder('');
      setType('hybrid');
      setGenotype('');
      setThcPercent('');
      setDescription('');
      setFloweringDays('');
      setPhotoUrl('');
      setGenetics('');
      setDifficulty('medium');
      setYieldIndoor('');
      setIsPublic(isAdmin);
      setClimateSchedule(JSON.parse(JSON.stringify(DEFAULT_CLIMATE_SCHEDULE)));
      setLighting({ ...DEFAULT_LIGHTING });
      setNutrition({ ...DEFAULT_NUTRITION });
      setGeneralInfo({ ...DEFAULT_GENERAL_INFO });
    }
    
    setIsInitialized(true);
  }, [strain, open, isInitialized, isAdmin]);

  // Climate schedule management
  const updateClimateEntry = (index: number, field: keyof ClimateScheduleEntry, value: string | number) => {
    setClimateSchedule(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const addClimateEntry = () => {
    setClimateSchedule(prev => [...prev, {
      stage: 'Custom',
      weeks: '',
      temp_day: 24,
      temp_night: 20,
      humidity: 50,
      vpd: '1.0-1.2'
    }]);
  };

  const removeClimateEntry = (index: number) => {
    setClimateSchedule(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Помилка',
        description: 'Назва сорту обов\'язкова',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Build growing_params JSONB
      const growingParams: GrowingParams = {
        climate_schedule: climateSchedule,
        lighting,
        nutrition,
        general_info: generalInfo,
      };

      const currentPhotoUrl = photoUrl;
      const finalPhotoUrl = currentPhotoUrl && currentPhotoUrl.trim() !== '' 
        ? currentPhotoUrl.trim() 
        : null;

      console.log('[LibraryStrainEditor] Saving with photo_url:', finalPhotoUrl);

      const data = {
        name: name.trim(),
        breeder: breeder.trim() || null,
        type: type || null,
        genotype: genotype.trim() || null,
        thc_percent: thcPercent ? parseFloat(thcPercent) : null,
        description: description.trim() || null,
        flowering_days: floweringDays ? parseInt(floweringDays) : null,
        photo_url: finalPhotoUrl,
        genetics: genetics.trim() || null,
        difficulty: difficulty || null,
        yield_indoor: yieldIndoor.trim() || null,
        growing_params: growingParams as unknown as Record<string, unknown>,
        ...(isAdmin && { is_public: isPublic }),
      };

      if (strain?.id) {
        const { error } = await supabase
          .from('library_strains')
          .update(data as any)
          .eq('id', strain.id);

        if (error) throw error;

        toast({
          title: '✅ Успіх',
          description: 'Сорт оновлено',
        });
      } else {
        if (!user?.id) throw new Error('Ви не авторизовані');
        
        const { error } = await (supabase
          .from('library_strains') as any)
          .insert({ ...data, user_id: user.id, is_public: isPublic });

        if (error) throw error;

        toast({
          title: '✅ Успіх',
          description: 'Сорт додано до бібліотеки',
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('[LibraryStrainEditor] Submit error:', error);
      toast({
        title: 'Помилка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl">
            {strain ? '✏️ Редагувати Сорт' : '🌱 Новий Сорт'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic" className="text-xs sm:text-sm">📋 Основне</TabsTrigger>
                <TabsTrigger value="environment" className="text-xs sm:text-sm">🌡️ Середовище</TabsTrigger>
                <TabsTrigger value="nutrients" className="text-xs sm:text-sm">💡 Живлення</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="mt-4 space-y-4">
                <Card className="border-border/50">
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Назва сорту *</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Auto AK-47"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="breeder">Бридер / Seedbank</Label>
                        <Input
                          id="breeder"
                          value={breeder}
                          onChange={(e) => setBreeder(e.target.value)}
                          placeholder="FastBuds"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Генотип</Label>
                        <Input
                          value={genotype}
                          onChange={(e) => setGenotype(e.target.value)}
                          placeholder="Indica-dominant Hybrid"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Генетика (батьки)</Label>
                        <Input
                          value={genetics}
                          onChange={(e) => setGenetics(e.target.value)}
                          placeholder="Colombian × Mexican × Thai × Afghan"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Тип</Label>
                        <Select value={type} onValueChange={setType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="indica">Indica</SelectItem>
                            <SelectItem value="sativa">Sativa</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="autoflower">Autoflower</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Складність</Label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Дні цвітіння</Label>
                        <Input
                          type="number"
                          value={floweringDays}
                          onChange={(e) => setFloweringDays(e.target.value)}
                          placeholder="60"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>THC %</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={thcPercent}
                          onChange={(e) => setThcPercent(e.target.value)}
                          placeholder="22"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Урожай Indoor</Label>
                        <Input
                          value={yieldIndoor}
                          onChange={(e) => setYieldIndoor(e.target.value)}
                          placeholder="400-500 g/m²"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Висота Indoor</Label>
                        <Input
                          value={generalInfo.height_indoor}
                          onChange={(e) => setGeneralInfo(prev => ({ ...prev, height_indoor: e.target.value }))}
                          placeholder="60-100 cm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Рівень запаху</Label>
                      <Select 
                        value={generalInfo.smell_level} 
                        onValueChange={(v) => setGeneralInfo(prev => ({ ...prev, smell_level: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Very High">Very High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-2">
                      <Label>Фото сорту</Label>
                      <ImageUpload
                        value={photoUrl}
                        onChange={(url) => {
                          console.log('[LibraryStrainEditor] Image uploaded:', url);
                          setPhotoUrl(url || '');
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Опис</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Опис сорту, особливості вирощування..."
                        rows={3}
                      />
                    </div>

                    {isAdmin && (
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="is_public"
                          checked={isPublic}
                          onCheckedChange={(checked) => setIsPublic(checked === true)}
                        />
                        <Label htmlFor="is_public" className="text-sm cursor-pointer">
                          🌍 Зробити публічним
                        </Label>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Environment Tab - Climate Schedule */}
              <TabsContent value="environment" className="mt-4 space-y-4">
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-primary" />
                      Кліматичний розклад по стадіях
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {climateSchedule.map((entry, index) => (
                      <div key={index} className="grid grid-cols-7 gap-2 items-end p-3 rounded-lg bg-muted/50">
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Стадія</Label>
                          <Select 
                            value={entry.stage} 
                            onValueChange={(v) => updateClimateEntry(index, 'stage', v)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Seedling">🌱 Seedling</SelectItem>
                              <SelectItem value="Vegetation">🌿 Vegetation</SelectItem>
                              <SelectItem value="Flowering">🌸 Flowering</SelectItem>
                              <SelectItem value="Custom">📋 Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Тижні</Label>
                          <Input
                            value={entry.weeks}
                            onChange={(e) => updateClimateEntry(index, 'weeks', e.target.value)}
                            placeholder="1-2"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Thermometer className="h-3 w-3 text-orange-400" /> День
                          </Label>
                          <Input
                            type="number"
                            value={entry.temp_day}
                            onChange={(e) => updateClimateEntry(index, 'temp_day', parseInt(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Thermometer className="h-3 w-3 text-blue-400" /> Ніч
                          </Label>
                          <Input
                            type="number"
                            value={entry.temp_night}
                            onChange={(e) => updateClimateEntry(index, 'temp_night', parseInt(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Droplets className="h-3 w-3 text-blue-400" /> RH%
                          </Label>
                          <Input
                            type="number"
                            value={entry.humidity}
                            onChange={(e) => updateClimateEntry(index, 'humidity', parseInt(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        <div className="flex items-end gap-1">
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Activity className="h-3 w-3 text-cyan-400" /> VPD
                            </Label>
                            <Input
                              value={entry.vpd}
                              onChange={(e) => updateClimateEntry(index, 'vpd', e.target.value)}
                              placeholder="0.8-1.2"
                              className="h-9"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive"
                            onClick={() => removeClimateEntry(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addClimateEntry}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Додати стадію
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Nutrients & Light Tab */}
              <TabsContent value="nutrients" className="mt-4 space-y-4">
                {/* Lighting PPFD */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sun className="h-4 w-4 text-yellow-500" />
                      Освітлення (PPFD µmol/m²/s)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">🌱 Seedling</Label>
                        <Input
                          value={lighting.seedling_ppfd}
                          onChange={(e) => setLighting(prev => ({ ...prev, seedling_ppfd: e.target.value }))}
                          placeholder="150-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">🌿 Vegetative</Label>
                        <Input
                          value={lighting.veg_ppfd}
                          onChange={(e) => setLighting(prev => ({ ...prev, veg_ppfd: e.target.value }))}
                          placeholder="300-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">🌸 Bloom</Label>
                        <Input
                          value={lighting.bloom_ppfd}
                          onChange={(e) => setLighting(prev => ({ ...prev, bloom_ppfd: e.target.value }))}
                          placeholder="600-900"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Nutrition EC */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-purple-500" />
                      Живлення (EC mS/cm)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">🌿 Vegetative EC</Label>
                        <Input
                          value={nutrition.veg_ec}
                          onChange={(e) => setNutrition(prev => ({ ...prev, veg_ec: e.target.value }))}
                          placeholder="1.0-1.4"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">🌸 Bloom EC</Label>
                        <Input
                          value={nutrition.bloom_ec}
                          onChange={(e) => setNutrition(prev => ({ ...prev, bloom_ec: e.target.value }))}
                          placeholder="1.5-1.8"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {strain ? 'Зберегти' : 'Додати'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
