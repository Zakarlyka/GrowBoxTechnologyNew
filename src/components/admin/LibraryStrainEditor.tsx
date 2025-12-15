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
import { Loader2, Plus, Trash2, Thermometer, Droplets, Sun, Dna, FlaskConical, Activity, Zap, AlertTriangle, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import type { 
  StrainPresets, LabData, GeneticMix, EnvironmentPhase, 
  TimelinePhase, NutrientWeek, LibraryStrainFull 
} from '@/types';

interface LibraryStrainEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strain?: LibraryStrainFull | null;
  onSuccess: () => void;
  isAdmin?: boolean;
}

const DEFAULT_GENETICS: GeneticMix = { sativa: 50, indica: 50, ruderalis: 0 };

const DEFAULT_ENVIRONMENT: Record<string, EnvironmentPhase> = {
  seedling: { temp_day: 25, temp_night: 22, rh: 70, vpd: 0.6, ppfd: 200, ec: 0.4, light_h: 18 },
  veg: { temp_day: 26, temp_night: 22, rh: 60, vpd: 1.0, ppfd: 600, ec: 1.2, light_h: 18 },
  bloom: { temp_day: 24, temp_night: 20, rh: 50, vpd: 1.2, ppfd: 800, ec: 1.8, light_h: 12 },
  flush: { temp_day: 22, temp_night: 18, rh: 45, vpd: 1.0, ppfd: 600, ec: 0, light_h: 12 },
};

const PHASE_CONFIG = [
  { key: 'seedling', label: 'Проростання', icon: '🌱' },
  { key: 'veg', label: 'Вегетація', icon: '🌿' },
  { key: 'bloom', label: 'Цвітіння', icon: '🌸' },
  { key: 'flush', label: 'Промивка', icon: '💧' },
];

const RISK_OPTIONS = ['Mold', 'Pests', 'Odor', 'Stretch', 'Nutrient Sensitive', 'Heat Sensitive', 'Cold Sensitive'];

export function LibraryStrainEditor({ open, onOpenChange, strain, onSuccess, isAdmin = false }: LibraryStrainEditorProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [activePhaseTab, setActivePhaseTab] = useState('seedling');

  // Basic info state
  const [name, setName] = useState('');
  const [breeder, setBreeder] = useState('');
  const [type, setType] = useState('hybrid');
  const [description, setDescription] = useState('');
  const [floweringDays, setFloweringDays] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [thcContent, setThcContent] = useState('');
  const [genetics, setGenetics] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [yieldIndoor, setYieldIndoor] = useState('');

  // Lab Data state
  const [geneticsMix, setGeneticsMix] = useState<GeneticMix>(DEFAULT_GENETICS);
  const [heightIndoor, setHeightIndoor] = useState('');
  const [heightOutdoor, setHeightOutdoor] = useState('');
  const [cbd, setCbd] = useState('');
  const [lifecycleTotal, setLifecycleTotal] = useState('');
  const [risks, setRisks] = useState<string[]>([]);
  const [training, setTraining] = useState('');

  // Timeline state
  const [timeline, setTimeline] = useState<TimelinePhase[]>([]);

  // Environment state
  const [environmentSchedule, setEnvironmentSchedule] = useState<Record<string, EnvironmentPhase>>(
    JSON.parse(JSON.stringify(DEFAULT_ENVIRONMENT))
  );

  // Nutrient schedule state
  const [nutrientWeeks, setNutrientWeeks] = useState<NutrientWeek[]>([
    { week: 1, grow: 1, bloom: 0 },
    { week: 2, grow: 2, bloom: 0 },
    { week: 3, grow: 2.5, bloom: 0.5 },
    { week: 4, grow: 2, bloom: 1 },
  ]);

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
      setDescription(strain.description || '');
      setFloweringDays(strain.flowering_days?.toString() || '');
      setPhotoUrl(strain.photo_url || '');
      setThcContent(strain.thc_content || '');
      setGenetics(strain.genetics || '');
      setDifficulty(strain.difficulty || 'medium');
      setYieldIndoor(strain.yield_indoor || '');
      setIsPublic(strain.is_public || false);

      // Parse presets
      const presets = strain.presets as StrainPresets | null;
      if (presets) {
        // Lab data
        if (presets.lab_data) {
          const ld = presets.lab_data;
          setGeneticsMix(ld.genetics_mix || DEFAULT_GENETICS);
          setHeightIndoor(ld.height?.indoor || '');
          setHeightOutdoor(ld.height?.outdoor || '');
          setCbd(ld.cbd || '');
          setLifecycleTotal(ld.lifecycle_total || '');
          setRisks(ld.risks || []);
          setTraining(ld.training || '');
        }

        // Timeline
        if (presets.timeline) {
          setTimeline(presets.timeline);
        }

        // Environment schedule
        if (presets.environment_schedule) {
          setEnvironmentSchedule(presets.environment_schedule as Record<string, EnvironmentPhase>);
        } else {
          // Try legacy format
          const legacyEnv: Record<string, EnvironmentPhase> = {};
          for (const phase of PHASE_CONFIG) {
            const preset = (presets as any)[phase.key];
            if (preset) {
              legacyEnv[phase.key] = {
                temp_day: preset.temp_day ?? preset.temp ?? DEFAULT_ENVIRONMENT[phase.key].temp_day,
                temp_night: preset.temp_night ?? (preset.temp ? preset.temp - 3 : DEFAULT_ENVIRONMENT[phase.key].temp_night),
                rh: preset.hum ?? preset.rh ?? DEFAULT_ENVIRONMENT[phase.key].rh,
                vpd: preset.vpd ?? DEFAULT_ENVIRONMENT[phase.key].vpd,
                ppfd: preset.ppfd ?? DEFAULT_ENVIRONMENT[phase.key].ppfd,
                ec: preset.ec ?? DEFAULT_ENVIRONMENT[phase.key].ec,
                light_h: preset.light_h ?? DEFAULT_ENVIRONMENT[phase.key].light_h,
              };
            } else {
              legacyEnv[phase.key] = { ...DEFAULT_ENVIRONMENT[phase.key] };
            }
          }
          setEnvironmentSchedule(legacyEnv);
        }

        // Nutrient schedule
        if (presets.nutrient_schedule) {
          setNutrientWeeks(presets.nutrient_schedule);
        }
      }
    } else {
      // Reset form for new strain
      setName('');
      setBreeder('');
      setType('hybrid');
      setDescription('');
      setFloweringDays('');
      setPhotoUrl('');
      setThcContent('');
      setGenetics('');
      setDifficulty('medium');
      setYieldIndoor('');
      setIsPublic(isAdmin);
      setGeneticsMix(DEFAULT_GENETICS);
      setHeightIndoor('');
      setHeightOutdoor('');
      setCbd('');
      setLifecycleTotal('');
      setRisks([]);
      setTraining('');
      setTimeline([]);
      setEnvironmentSchedule(JSON.parse(JSON.stringify(DEFAULT_ENVIRONMENT)));
      setNutrientWeeks([
        { week: 1, grow: 1, bloom: 0 },
        { week: 2, grow: 2, bloom: 0 },
        { week: 3, grow: 2.5, bloom: 0.5 },
        { week: 4, grow: 2, bloom: 1 },
      ]);
    }
    
    setIsInitialized(true);
  }, [strain, open, isInitialized, isAdmin]);

  // Genetics slider handler - keep total at 100%
  const updateGenetics = (key: keyof GeneticMix, value: number) => {
    const total = geneticsMix.sativa + geneticsMix.indica + geneticsMix.ruderalis;
    const diff = value - geneticsMix[key];
    
    // Adjust other values proportionally
    const newMix = { ...geneticsMix, [key]: value };
    const others = Object.keys(newMix).filter(k => k !== key) as (keyof GeneticMix)[];
    
    if (diff > 0) {
      // Reduce others
      let remaining = diff;
      for (const other of others) {
        const reduction = Math.min(newMix[other], remaining / others.length);
        newMix[other] = Math.max(0, newMix[other] - reduction);
        remaining -= reduction;
      }
    }
    
    // Normalize to 100
    const newTotal = newMix.sativa + newMix.indica + newMix.ruderalis;
    if (newTotal !== 100 && newTotal > 0) {
      const scale = 100 / newTotal;
      newMix.sativa = Math.round(newMix.sativa * scale);
      newMix.indica = Math.round(newMix.indica * scale);
      newMix.ruderalis = Math.round(newMix.ruderalis * scale);
    }
    
    setGeneticsMix(newMix);
  };

  // Environment update
  const updateEnvironment = (phase: string, field: keyof EnvironmentPhase, value: number) => {
    setEnvironmentSchedule(prev => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        [field]: value,
      },
    }));
  };

  // Timeline management
  const addTimelinePhase = () => {
    setTimeline(prev => [...prev, { phase: '', duration: '', desc: '' }]);
  };

  const updateTimelinePhase = (index: number, field: keyof TimelinePhase, value: string) => {
    setTimeline(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const removeTimelinePhase = (index: number) => {
    setTimeline(prev => prev.filter((_, i) => i !== index));
  };

  // Nutrient week management
  const addNutrientWeek = () => {
    const nextWeek = nutrientWeeks.length + 1;
    setNutrientWeeks(prev => [...prev, { week: nextWeek, grow: 0, bloom: 0 }]);
  };

  const removeNutrientWeek = (index: number) => {
    setNutrientWeeks(prev => prev.filter((_, i) => i !== index).map((w, i) => ({ ...w, week: i + 1 })));
  };

  const updateNutrientWeek = (index: number, field: keyof NutrientWeek, value: number) => {
    setNutrientWeeks(prev => prev.map((w, i) => i === index ? { ...w, [field]: value } : w));
  };

  // Toggle risk
  const toggleRisk = (risk: string) => {
    setRisks(prev => prev.includes(risk) ? prev.filter(r => r !== risk) : [...prev, risk]);
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
      // Build lab_data
      const labData: LabData = {
        genetics_mix: geneticsMix,
        height: { indoor: heightIndoor, outdoor: heightOutdoor },
        cbd,
        lifecycle_total: lifecycleTotal,
        risks,
        training,
      };

      // Build complete presets
      const presets: StrainPresets = {
        lab_data: labData,
        timeline: timeline.filter(t => t.phase && t.duration),
        environment_schedule: environmentSchedule as Record<'seedling' | 'veg' | 'bloom' | 'flush', EnvironmentPhase>,
        nutrient_schedule: nutrientWeeks,
      };

      // Also add legacy format for backward compatibility
      for (const phase of PHASE_CONFIG) {
        const env = environmentSchedule[phase.key];
        (presets as any)[phase.key] = {
          temp: env.temp_day,
          temp_day: env.temp_day,
          temp_night: env.temp_night,
          hum: env.rh,
          light_h: env.light_h,
          vpd: env.vpd,
          ec: env.ec,
          ppfd: env.ppfd,
        };
      }

      const currentPhotoUrl = photoUrl;
      const finalPhotoUrl = currentPhotoUrl && currentPhotoUrl.trim() !== '' 
        ? currentPhotoUrl.trim() 
        : null;

      console.log('[LibraryStrainEditor] Saving with photo_url:', finalPhotoUrl);

      const data = {
        name: name.trim(),
        breeder: breeder.trim() || null,
        type: type || null,
        description: description.trim() || null,
        flowering_days: floweringDays ? parseInt(floweringDays) : null,
        photo_url: finalPhotoUrl,
        thc_content: thcContent.trim() || null,
        genetics: genetics.trim() || null,
        difficulty: difficulty || null,
        yield_indoor: yieldIndoor.trim() || null,
        presets: presets as unknown as Record<string, unknown>,
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
                <TabsTrigger value="basic" className="text-xs sm:text-sm">📋 Основне</TabsTrigger>
                <TabsTrigger value="lab" className="text-xs sm:text-sm">🧬 Лаб. дані</TabsTrigger>
                <TabsTrigger value="environment" className="text-xs sm:text-sm">🌡️ Середовище</TabsTrigger>
                <TabsTrigger value="nutrients" className="text-xs sm:text-sm">🧪 Живлення</TabsTrigger>
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
                          placeholder="Gorilla Glue"
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
                          value={thcContent}
                          onChange={(e) => setThcContent(e.target.value)}
                          placeholder="20-25%"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Генетика</Label>
                        <Input
                          value={genetics}
                          onChange={(e) => setGenetics(e.target.value)}
                          placeholder="OG Kush x Sour Diesel"
                        />
                      </div>
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
              </TabsContent>

              {/* Lab Data Tab */}
              <TabsContent value="lab" className="mt-4 space-y-4">
                {/* Genetics Sliders */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Dna className="h-4 w-4 text-primary" />
                      Генетичний склад (%)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <span className="w-20 text-sm text-orange-400">Sativa</span>
                        <Slider
                          value={[geneticsMix.sativa]}
                          onValueChange={([v]) => updateGenetics('sativa', v)}
                          max={100}
                          step={5}
                          className="flex-1"
                        />
                        <span className="w-12 text-sm text-right">{geneticsMix.sativa}%</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="w-20 text-sm text-purple-400">Indica</span>
                        <Slider
                          value={[geneticsMix.indica]}
                          onValueChange={([v]) => updateGenetics('indica', v)}
                          max={100}
                          step={5}
                          className="flex-1"
                        />
                        <span className="w-12 text-sm text-right">{geneticsMix.indica}%</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="w-20 text-sm text-green-400">Ruderalis</span>
                        <Slider
                          value={[geneticsMix.ruderalis]}
                          onValueChange={([v]) => updateGenetics('ruderalis', v)}
                          max={100}
                          step={5}
                          className="flex-1"
                        />
                        <span className="w-12 text-sm text-right">{geneticsMix.ruderalis}%</span>
                      </div>
                    </div>
                    
                    {/* Preview bar */}
                    <div className="flex h-4 rounded-full overflow-hidden border border-border">
                      <div className="bg-orange-500" style={{ width: `${geneticsMix.sativa}%` }} />
                      <div className="bg-purple-500" style={{ width: `${geneticsMix.indica}%` }} />
                      <div className="bg-green-500" style={{ width: `${geneticsMix.ruderalis}%` }} />
                    </div>
                  </CardContent>
                </Card>

                {/* Physical Stats */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">📏 Фізичні характеристики</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Висота Indoor</Label>
                        <Input
                          value={heightIndoor}
                          onChange={(e) => setHeightIndoor(e.target.value)}
                          placeholder="60-100 cm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Висота Outdoor</Label>
                        <Input
                          value={heightOutdoor}
                          onChange={(e) => setHeightOutdoor(e.target.value)}
                          placeholder="100-150 cm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">CBD</Label>
                        <Input
                          value={cbd}
                          onChange={(e) => setCbd(e.target.value)}
                          placeholder="< 1%"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Загальний цикл</Label>
                        <Input
                          value={lifecycleTotal}
                          onChange={(e) => setLifecycleTotal(e.target.value)}
                          placeholder="60-75 days"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risks */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Ризики
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {RISK_OPTIONS.map((risk) => (
                        <Badge
                          key={risk}
                          variant={risks.includes(risk) ? 'default' : 'outline'}
                          className={`cursor-pointer transition-colors ${
                            risks.includes(risk) 
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleRisk(risk)}
                        >
                          {risk}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Training */}
                <Card className="border-border/50">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <Label>Рекомендований тренінг</Label>
                      <Select value={training} onValueChange={setTraining}>
                        <SelectTrigger>
                          <SelectValue placeholder="Оберіть метод" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="None">None (Natural)</SelectItem>
                          <SelectItem value="LST Only">LST Only</SelectItem>
                          <SelectItem value="HST">HST (High Stress)</SelectItem>
                          <SelectItem value="Topping">Topping</SelectItem>
                          <SelectItem value="FIM">FIM</SelectItem>
                          <SelectItem value="ScrOG">ScrOG</SelectItem>
                          <SelectItem value="SOG">SOG</SelectItem>
                          <SelectItem value="Mainlining">Mainlining</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Таймлайн росту
                      </CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={addTimelinePhase} className="gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Фаза
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {timeline.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Натисніть "+ Фаза" щоб додати таймлайн
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {timeline.map((phase, index) => (
                          <div key={index} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-start">
                            <Input
                              placeholder="Week 1-2"
                              value={phase.duration}
                              onChange={(e) => updateTimelinePhase(index, 'duration', e.target.value)}
                              className="h-9 text-sm"
                            />
                            <Input
                              placeholder="Germination"
                              value={phase.phase}
                              onChange={(e) => updateTimelinePhase(index, 'phase', e.target.value)}
                              className="h-9 text-sm"
                            />
                            <Input
                              placeholder="Description..."
                              value={phase.desc}
                              onChange={(e) => updateTimelinePhase(index, 'desc', e.target.value)}
                              className="h-9 text-sm"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => removeTimelinePhase(index)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Environment Tab */}
              <TabsContent value="environment" className="mt-4 space-y-4">
                <Tabs value={activePhaseTab} onValueChange={setActivePhaseTab}>
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    {PHASE_CONFIG.map((phase) => (
                      <TabsTrigger key={phase.key} value={phase.key} className="text-xs">
                        {phase.icon} {phase.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {PHASE_CONFIG.map((phase) => (
                    <TabsContent key={phase.key} value={phase.key} className="space-y-4">
                      {/* Climate Row */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Thermometer className="h-3 w-3" /> Temp Day (°C)
                          </Label>
                          <Input
                            type="number"
                            value={environmentSchedule[phase.key]?.temp_day || ''}
                            onChange={(e) => updateEnvironment(phase.key, 'temp_day', parseFloat(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Thermometer className="h-3 w-3" /> Temp Night (°C)
                          </Label>
                          <Input
                            type="number"
                            value={environmentSchedule[phase.key]?.temp_night || ''}
                            onChange={(e) => updateEnvironment(phase.key, 'temp_night', parseFloat(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Droplets className="h-3 w-3" /> Humidity (%)
                          </Label>
                          <Input
                            type="number"
                            value={environmentSchedule[phase.key]?.rh || ''}
                            onChange={(e) => updateEnvironment(phase.key, 'rh', parseInt(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Activity className="h-3 w-3" /> VPD (kPa)
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={environmentSchedule[phase.key]?.vpd || ''}
                            onChange={(e) => updateEnvironment(phase.key, 'vpd', parseFloat(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                      </div>

                      {/* Light & Nutrition Row */}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="space-y-1 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Sun className="h-3 w-3" /> Light Hours
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max="24"
                            value={environmentSchedule[phase.key]?.light_h || ''}
                            onChange={(e) => updateEnvironment(phase.key, 'light_h', parseInt(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Zap className="h-3 w-3" /> PPFD (µmol/m²/s)
                          </Label>
                          <Input
                            type="number"
                            value={environmentSchedule[phase.key]?.ppfd || ''}
                            onChange={(e) => updateEnvironment(phase.key, 'ppfd', parseInt(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <FlaskConical className="h-3 w-3" /> EC (mS/cm)
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={environmentSchedule[phase.key]?.ec ?? ''}
                            onChange={(e) => updateEnvironment(phase.key, 'ec', parseFloat(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </TabsContent>

              {/* Nutrients Tab */}
              <TabsContent value="nutrients" className="mt-4">
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-primary" />
                        Графік живлення (ml/L)
                      </CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={addNutrientWeek} className="gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Тиждень
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {nutrientWeeks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Натисніть "+ Тиждень" щоб додати графік
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-[60px_1fr_1fr_1fr_40px] gap-2 text-xs text-muted-foreground font-medium px-1">
                          <span>Тиждень</span>
                          <span>Grow</span>
                          <span>Bloom</span>
                          <span>Micro</span>
                          <span></span>
                        </div>

                        {nutrientWeeks.map((week, index) => (
                          <div key={index} className="grid grid-cols-[60px_1fr_1fr_1fr_40px] gap-2 items-center p-2 rounded-lg bg-muted/30">
                            <span className="text-sm font-medium text-center">W{week.week}</span>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              value={week.grow}
                              onChange={(e) => updateNutrientWeek(index, 'grow', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              value={week.bloom}
                              onChange={(e) => updateNutrientWeek(index, 'bloom', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              value={week.micro || ''}
                              onChange={(e) => updateNutrientWeek(index, 'micro', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeNutrientWeek(index)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {strain ? 'Зберегти зміни' : 'Додати сорт'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
