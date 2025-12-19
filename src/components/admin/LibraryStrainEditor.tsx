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
import { Loader2, Plus, Trash2, Thermometer, Droplets, Sun, FlaskConical, Zap, Activity, AlertTriangle, Beaker, Bell, BookOpen, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { 
  LibraryStrainFull, GrowingParams, GrowingStage, 
  GrowingPhenotype, GrowingRecommendations, PostHarvest 
} from '@/types';

interface LibraryStrainEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strain?: LibraryStrainFull | null;
  onSuccess: () => void;
  isAdmin?: boolean;
}

const DEFAULT_STAGES: GrowingStage[] = [
  { name: 'Seedling', weeks: '1-2', temp: [22, 25], humidity: 70, vpd: '0.6-0.8', ppfd: '150-300', ec: '0.6-0.8' },
  { name: 'Vegetation', weeks: '3-4', temp: [22, 26], humidity: 60, vpd: '0.8-1.1', ppfd: '300-600', ec: '1.0-1.4' },
  { name: 'Flowering', weeks: '5-9', temp: [20, 24], humidity: 45, vpd: '1.2-1.5', ppfd: '600-900', ec: '1.5-1.8' },
];

const DEFAULT_PHENOTYPE: GrowingPhenotype = {
  height_indoor: '',
  aroma: '',
  structure: '',
};

const DEFAULT_RECOMMENDATIONS: GrowingRecommendations = {
  ph_soil: '6.0-7.0',
  ph_hydro: '5.5-6.5',
  training: '',
  notes: '',
};

const DEFAULT_POST_HARVEST: PostHarvest = {
  drying_temp: 18,
  drying_humidity: 55,
  drying_days: '7-14',
  curing_notes: '',
};

// Wiki structure
interface WikiData {
  training: string;
  warnings: string[];
}

const DEFAULT_WIKI: WikiData = {
  training: '',
  warnings: [],
};

// Timeline Alert structure
interface TimelineAlert {
  stage: string;
  day_offset: number;
  message: string;
}

const STAGE_OPTIONS = [
  'Seedling',
  'Vegetation', 
  'Pre-flowering',
  'Flowering',
  'Flushing',
  'Drying',
];

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

  // Growing params state (new structure)
  const [stages, setStages] = useState<GrowingStage[]>(DEFAULT_STAGES);
  const [risks, setRisks] = useState<string[]>([]);
  const [newRisk, setNewRisk] = useState('');
  const [phenotype, setPhenotype] = useState<GrowingPhenotype>(DEFAULT_PHENOTYPE);
  const [recommendations, setRecommendations] = useState<GrowingRecommendations>(DEFAULT_RECOMMENDATIONS);
  const [postHarvest, setPostHarvest] = useState<PostHarvest>(DEFAULT_POST_HARVEST);
  
  // Wiki & Alerts state
  const [wiki, setWiki] = useState<WikiData>(DEFAULT_WIKI);
  const [newWarning, setNewWarning] = useState('');
  const [timelineAlerts, setTimelineAlerts] = useState<TimelineAlert[]>([]);
  const [newAlert, setNewAlert] = useState<TimelineAlert>({ stage: 'Flowering', day_offset: 1, message: '' });

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

      // Parse growing_params (new v3.0 structure)
      const gp = strain.growing_params as GrowingParams | null;
      if (gp) {
        if (gp.stages?.length > 0) {
          // Convert weeks_duration (number) to weeks (string) for editing
          const normalizedStages = gp.stages.map(stage => ({
            ...stage,
            weeks: stage.weeks || (stage.weeks_duration ? `${stage.weeks_duration}` : ''),
          }));
          setStages(normalizedStages);
        }
        if (gp.risks) {
          setRisks(gp.risks);
        }
        if (gp.phenotype) {
          setPhenotype({ ...DEFAULT_PHENOTYPE, ...gp.phenotype });
        }
        if (gp.recommendations) {
          setRecommendations({ ...DEFAULT_RECOMMENDATIONS, ...gp.recommendations });
        }
        if (gp.post_harvest) {
          setPostHarvest({ ...DEFAULT_POST_HARVEST, ...gp.post_harvest });
        }
        // Load wiki data
        if ((gp as any).wiki) {
          setWiki({
            training: (gp as any).wiki.training || '',
            warnings: (gp as any).wiki.warnings || [],
          });
        }
        // Load timeline alerts
        if ((gp as any).timeline_alerts) {
          setTimelineAlerts((gp as any).timeline_alerts || []);
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
      setStages(JSON.parse(JSON.stringify(DEFAULT_STAGES)));
      setRisks([]);
      setPhenotype({ ...DEFAULT_PHENOTYPE });
      setRecommendations({ ...DEFAULT_RECOMMENDATIONS });
      setPostHarvest({ ...DEFAULT_POST_HARVEST });
      setWiki({ ...DEFAULT_WIKI });
      setTimelineAlerts([]);
    }
    
    setIsInitialized(true);
  }, [strain, open, isInitialized, isAdmin]);

  // Stage management
  const updateStage = (index: number, field: keyof GrowingStage, value: any) => {
    setStages(prev => prev.map((stage, i) => 
      i === index ? { ...stage, [field]: value } : stage
    ));
  };

  const updateStageTemp = (index: number, tempIndex: 0 | 1, value: number) => {
    setStages(prev => prev.map((stage, i) => {
      if (i !== index) return stage;
      const currentTemp = stage.temp || [20, 24];
      const newTemp: [number, number] = [...currentTemp] as [number, number];
      newTemp[tempIndex] = value;
      return { ...stage, temp: newTemp };
    }));
  };

  const addStage = () => {
    setStages(prev => [...prev, {
      name: 'Custom',
      weeks: '',
      temp: [20, 24],
      humidity: 50,
      vpd: '1.0-1.2',
      ppfd: '400-600',
      ec: '1.2-1.6'
    }]);
  };

  const removeStage = (index: number) => {
    setStages(prev => prev.filter((_, i) => i !== index));
  };

  // Risk management
  const addRisk = () => {
    if (newRisk.trim() && !risks.includes(newRisk.trim())) {
      setRisks(prev => [...prev, newRisk.trim()]);
      setNewRisk('');
    }
  };

  const removeRisk = (risk: string) => {
    setRisks(prev => prev.filter(r => r !== risk));
  };

  // Wiki warnings management
  const addWarning = () => {
    if (newWarning.trim() && !wiki.warnings.includes(newWarning.trim())) {
      setWiki(prev => ({ ...prev, warnings: [...prev.warnings, newWarning.trim()] }));
      setNewWarning('');
    }
  };

  const removeWarning = (warning: string) => {
    setWiki(prev => ({ ...prev, warnings: prev.warnings.filter(w => w !== warning) }));
  };

  // Timeline alerts management
  const addTimelineAlert = () => {
    if (newAlert.message.trim()) {
      setTimelineAlerts(prev => [...prev, { ...newAlert, message: newAlert.message.trim() }]);
      setNewAlert({ stage: 'Flowering', day_offset: 1, message: '' });
    }
  };

  const removeTimelineAlert = (index: number) => {
    setTimelineAlerts(prev => prev.filter((_, i) => i !== index));
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
      // Build growing_params JSONB (v3.0 structure)
      const growingParams: any = {
        stages,
        risks: risks.length > 0 ? risks : undefined,
        phenotype: Object.values(phenotype).some(v => v) ? phenotype : undefined,
        recommendations: Object.values(recommendations).some(v => v) ? recommendations : undefined,
        post_harvest: postHarvest.drying_temp ? postHarvest : undefined,
        // Wiki & Alerts
        wiki: (wiki.training || wiki.warnings.length > 0) ? {
          training: wiki.training || undefined,
          warnings: wiki.warnings.length > 0 ? wiki.warnings : undefined,
        } : undefined,
        timeline_alerts: timelineAlerts.length > 0 ? timelineAlerts : undefined,
      };

      const currentPhotoUrl = photoUrl;
      const finalPhotoUrl = currentPhotoUrl && currentPhotoUrl.trim() !== '' 
        ? currentPhotoUrl.trim() 
        : null;

      console.log('[LibraryStrainEditor] Saving with growing_params:', growingParams);

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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="text-xs sm:text-sm">📋 Паспорт</TabsTrigger>
                <TabsTrigger value="environment" className="text-xs sm:text-sm">🌡️ Середовище</TabsTrigger>
                <TabsTrigger value="nutrients" className="text-xs sm:text-sm">💡 Живлення</TabsTrigger>
                <TabsTrigger value="wiki" className="text-xs sm:text-sm">📖 Wiki</TabsTrigger>
              </TabsList>

              {/* Basic Info / Passport Tab */}
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
                          placeholder="Colombian × Mexican × Thai"
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
                            <SelectItem value="photoperiod">Photoperiod</SelectItem>
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

                {/* Phenotype Card */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      🧬 Фенотип
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Висота Indoor</Label>
                        <Input
                          value={phenotype.height_indoor || ''}
                          onChange={(e) => setPhenotype(prev => ({ ...prev, height_indoor: e.target.value }))}
                          placeholder="60-100 cm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Аромат</Label>
                        <Input
                          value={phenotype.aroma || ''}
                          onChange={(e) => setPhenotype(prev => ({ ...prev, aroma: e.target.value }))}
                          placeholder="Spicy, Earthy"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Структура</Label>
                        <Input
                          value={phenotype.structure || ''}
                          onChange={(e) => setPhenotype(prev => ({ ...prev, structure: e.target.value }))}
                          placeholder="Bushy, Compact"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risks Card */}
                <Card className="border-border/50 border-amber-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      Ризики та особливості
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {risks.map((risk, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="bg-amber-500/10 text-amber-400 border-amber-500/30 gap-1"
                        >
                          ⚠️ {risk}
                          <button
                            type="button"
                            onClick={() => removeRisk(risk)}
                            className="ml-1 text-amber-300 hover:text-amber-100"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newRisk}
                        onChange={(e) => setNewRisk(e.target.value)}
                        placeholder="Mold, Odor, Heat Stress..."
                        className="flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRisk())}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addRisk}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Environment Tab - Dynamic Stages */}
              <TabsContent value="environment" className="mt-4 space-y-4">
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-primary" />
                      Кліматичний розклад по стадіях
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stages.map((stage, index) => (
                      <div key={index} className="p-3 rounded-lg bg-muted/50 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Назва стадії</Label>
                            <Select 
                              value={stage.name} 
                              onValueChange={(v) => updateStage(index, 'name', v)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Seedling">🌱 Seedling</SelectItem>
                                <SelectItem value="Vegetation">🌿 Vegetation</SelectItem>
                                <SelectItem value="Pre-flowering">🌼 Pre-flowering</SelectItem>
                                <SelectItem value="Flowering">🌸 Flowering</SelectItem>
                                <SelectItem value="Flushing">💧 Flushing</SelectItem>
                                <SelectItem value="Drying">🍂 Drying</SelectItem>
                                <SelectItem value="Custom">📋 Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Тижні</Label>
                            <Input
                              value={stage.weeks || ''}
                              onChange={(e) => updateStage(index, 'weeks', e.target.value)}
                              placeholder="1-2"
                              className="h-9"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-destructive"
                              onClick={() => removeStage(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-5 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Thermometer className="h-3 w-3 text-blue-400" /> Ніч °C
                            </Label>
                            <Input
                              type="number"
                              value={stage.temp?.[0] ?? 20}
                              onChange={(e) => updateStageTemp(index, 0, parseInt(e.target.value) || 0)}
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Thermometer className="h-3 w-3 text-orange-400" /> День °C
                            </Label>
                            <Input
                              type="number"
                              value={stage.temp?.[1] ?? 24}
                              onChange={(e) => updateStageTemp(index, 1, parseInt(e.target.value) || 0)}
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Droplets className="h-3 w-3 text-blue-400" /> RH%
                            </Label>
                            <Input
                              type="number"
                              value={stage.humidity}
                              onChange={(e) => updateStage(index, 'humidity', parseInt(e.target.value) || 0)}
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Activity className="h-3 w-3 text-cyan-400" /> VPD
                            </Label>
                            <Input
                              value={stage.vpd}
                              onChange={(e) => updateStage(index, 'vpd', e.target.value)}
                              placeholder="0.8-1.2"
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Sun className="h-3 w-3 text-amber-400" /> Світло
                            </Label>
                            <Input
                              type="number"
                              value={stage.light_hours || ''}
                              onChange={(e) => updateStage(index, 'light_hours', e.target.value ? parseInt(e.target.value) : undefined)}
                              placeholder="18"
                              className="h-9"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addStage}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Додати стадію
                    </Button>
                  </CardContent>
                </Card>

                {/* Post-Harvest Settings */}
                <Card className="border-border/50 border-amber-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      🍂 Пост-харвест (Сушіння)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Температура °C</Label>
                        <Input
                          type="number"
                          value={postHarvest.drying_temp || ''}
                          onChange={(e) => setPostHarvest(prev => ({ ...prev, drying_temp: parseInt(e.target.value) || undefined }))}
                          placeholder="18"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Вологість %</Label>
                        <Input
                          type="number"
                          value={postHarvest.drying_humidity || ''}
                          onChange={(e) => setPostHarvest(prev => ({ ...prev, drying_humidity: parseInt(e.target.value) || undefined }))}
                          placeholder="55"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Тривалість</Label>
                        <Input
                          value={postHarvest.drying_days || ''}
                          onChange={(e) => setPostHarvest(prev => ({ ...prev, drying_days: e.target.value }))}
                          placeholder="7-14 днів"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Примітки</Label>
                        <Input
                          value={postHarvest.curing_notes || ''}
                          onChange={(e) => setPostHarvest(prev => ({ ...prev, curing_notes: e.target.value }))}
                          placeholder="Cure 2-4 weeks"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Nutrients & Light Tab - PPFD/EC per Stage */}
              <TabsContent value="nutrients" className="mt-4 space-y-4">
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sun className="h-4 w-4 text-yellow-500" />
                      PPFD та EC по стадіях
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stages.map((stage, index) => (
                      <div key={index} className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="font-medium text-sm flex items-center">
                          {stage.name === 'Seedling' && '🌱'}
                          {stage.name === 'Vegetation' && '🌿'}
                          {stage.name === 'Pre-flowering' && '🌼'}
                          {stage.name === 'Flowering' && '🌸'}
                          {stage.name === 'Flushing' && '💧'}
                          {stage.name === 'Drying' && '🍂'}
                          <span className="ml-1">{stage.name}</span>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Sun className="h-3 w-3 text-yellow-400" /> PPFD µmol
                          </Label>
                          <Input
                            value={stage.ppfd}
                            onChange={(e) => updateStage(index, 'ppfd', e.target.value)}
                            placeholder="300-600"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Zap className="h-3 w-3 text-green-400" /> EC mS/cm
                          </Label>
                          <Input
                            value={stage.ec}
                            onChange={(e) => updateStage(index, 'ec', e.target.value)}
                            placeholder="1.0-1.4"
                            className="h-9"
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* pH Recommendations */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Beaker className="h-4 w-4 text-cyan-500" />
                      Рекомендації pH
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">🌱 pH Ґрунт</Label>
                        <Input
                          value={recommendations.ph_soil || ''}
                          onChange={(e) => setRecommendations(prev => ({ ...prev, ph_soil: e.target.value }))}
                          placeholder="6.0-7.0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">💧 pH Гідро</Label>
                        <Input
                          value={recommendations.ph_hydro || ''}
                          onChange={(e) => setRecommendations(prev => ({ ...prev, ph_hydro: e.target.value }))}
                          placeholder="5.5-6.5"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label className="text-xs">🏋️ Тренування</Label>
                        <Input
                          value={recommendations.training || ''}
                          onChange={(e) => setRecommendations(prev => ({ ...prev, training: e.target.value }))}
                          placeholder="LST, SCROG, Topping"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">📝 Примітки</Label>
                        <Input
                          value={recommendations.notes || ''}
                          onChange={(e) => setRecommendations(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Additional tips..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Wiki & Alerts Tab */}
              <TabsContent value="wiki" className="mt-4 space-y-4">
                {/* Phenotype Details */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      🧬 Фенотип
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">🌿 Аромат</Label>
                      <Textarea
                        value={phenotype.aroma || ''}
                        onChange={(e) => setPhenotype(prev => ({ ...prev, aroma: e.target.value }))}
                        placeholder="Описуйте аромат: Earthy, Spicy, Citrus, Diesel..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">🌳 Структура рослини</Label>
                      <Textarea
                        value={phenotype.structure || ''}
                        onChange={(e) => setPhenotype(prev => ({ ...prev, structure: e.target.value }))}
                        placeholder="Bushy, Compact, Tall, Multiple colas..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Training Advice */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Поради з тренування
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={wiki.training}
                      onChange={(e) => setWiki(prev => ({ ...prev, training: e.target.value }))}
                      placeholder="LST (Low Stress Training) рекомендується з 3-го тижня. Topping можна робити після 4-5 вузлів..."
                      rows={4}
                    />
                  </CardContent>
                </Card>

                {/* Critical Warnings */}
                <Card className="border-border/50 border-red-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      Критичні попередження
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {wiki.warnings.map((warning, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="bg-red-500/10 text-red-400 border-red-500/30 gap-1"
                        >
                          ⚠️ {warning}
                          <button
                            type="button"
                            onClick={() => removeWarning(warning)}
                            className="ml-1 text-red-300 hover:text-red-100"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newWarning}
                        onChange={(e) => setNewWarning(e.target.value)}
                        placeholder="Чутливий до перегодовування, Низька толерантність до вологості..."
                        className="flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWarning())}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addWarning}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline Alerts Configuration */}
                <Card className="border-border/50 border-amber-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
                      <Bell className="h-4 w-4" />
                      Таймлайн Сповіщення
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Налаштуйте автоматичні сповіщення для конкретних етапів вирощування
                    </p>
                    
                    {/* Existing alerts */}
                    {timelineAlerts.length > 0 && (
                      <div className="space-y-2">
                        {timelineAlerts.map((alert, idx) => (
                          <Alert key={idx} className="bg-amber-500/10 border-amber-500/30">
                            <Bell className="h-4 w-4 text-amber-400" />
                            <AlertTitle className="text-sm flex items-center justify-between">
                              <span>
                                <Badge variant="outline" className="mr-2">{alert.stage}</Badge>
                                День +{alert.day_offset}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => removeTimelineAlert(idx)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertTitle>
                            <AlertDescription className="text-xs text-muted-foreground">
                              {alert.message}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}

                    {/* Add new alert */}
                    <div className="p-3 rounded-lg bg-muted/50 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Стадія</Label>
                          <Select 
                            value={newAlert.stage} 
                            onValueChange={(v) => setNewAlert(prev => ({ ...prev, stage: v }))}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STAGE_OPTIONS.map(stage => (
                                <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" /> День +
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            value={newAlert.day_offset}
                            onChange={(e) => setNewAlert(prev => ({ ...prev, day_offset: parseInt(e.target.value) || 1 }))}
                            className="h-9"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addTimelineAlert}
                            className="w-full h-9 gap-1"
                          >
                            <Plus className="h-4 w-4" />
                            Додати
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Повідомлення</Label>
                        <Input
                          value={newAlert.message}
                          onChange={(e) => setNewAlert(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Перевірте висоту лампи та DLI..."
                          className="h-9"
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
