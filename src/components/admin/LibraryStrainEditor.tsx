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
import { Loader2, Plus, Trash2, Thermometer, Droplets, Sun, Beaker, Gauge, FlaskConical } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

// Phase configuration types
interface PhaseSettings {
  temp_day: number;
  temp_night: number;
  hum: number;
  light_h: number;
  light_intensity?: number;
  vpd_min?: number;
  vpd_max?: number;
  ec?: number;
  ph_min?: number;
  ph_max?: number;
}

interface NutrientWeek {
  week: number;
  grow: number;
  bloom: number;
  micro?: number;
  cal_mag?: number;
}

interface LibraryStrain {
  id: number;
  name: string;
  breeder: string | null;
  type: string | null;
  description: string | null;
  flowering_days: number | null;
  photo_url: string | null;
  presets: any;
  is_public: boolean | null;
}

interface LibraryStrainEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strain?: LibraryStrain | null;
  onSuccess: () => void;
  isAdmin?: boolean;
}

const DEFAULT_PHASE_SETTINGS: Record<string, PhaseSettings> = {
  seedling: { temp_day: 25, temp_night: 22, hum: 70, light_h: 18, light_intensity: 40, vpd_min: 0.4, vpd_max: 0.8, ec: 0.4, ph_min: 5.8, ph_max: 6.2 },
  veg: { temp_day: 26, temp_night: 22, hum: 60, light_h: 18, light_intensity: 75, vpd_min: 0.8, vpd_max: 1.2, ec: 1.2, ph_min: 5.8, ph_max: 6.5 },
  bloom: { temp_day: 24, temp_night: 20, hum: 50, light_h: 12, light_intensity: 100, vpd_min: 1.0, vpd_max: 1.5, ec: 1.8, ph_min: 6.0, ph_max: 6.5 },
  flush: { temp_day: 22, temp_night: 18, hum: 45, light_h: 12, light_intensity: 80, vpd_min: 0.8, vpd_max: 1.2, ec: 0, ph_min: 6.0, ph_max: 6.5 },
};

const PHASE_CONFIG = [
  { key: 'seedling', label: 'Проростання', icon: '🌱' },
  { key: 'veg', label: 'Вегетація', icon: '🌿' },
  { key: 'bloom', label: 'Цвітіння', icon: '🌸' },
  { key: 'flush', label: 'Промивка', icon: '💧' },
];

export function LibraryStrainEditor({ open, onOpenChange, strain, onSuccess, isAdmin = false }: LibraryStrainEditorProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activePhaseTab, setActivePhaseTab] = useState('seedling');

  // Basic info state
  const [name, setName] = useState('');
  const [breeder, setBreeder] = useState('');
  const [type, setType] = useState('hybrid');
  const [description, setDescription] = useState('');
  const [floweringDays, setFloweringDays] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Phase settings state
  const [phaseSettings, setPhaseSettings] = useState<Record<string, PhaseSettings>>(
    JSON.parse(JSON.stringify(DEFAULT_PHASE_SETTINGS))
  );

  // Nutrient schedule state
  const [nutrientWeeks, setNutrientWeeks] = useState<NutrientWeek[]>([
    { week: 1, grow: 1, bloom: 0 },
    { week: 2, grow: 2, bloom: 0 },
    { week: 3, grow: 2.5, bloom: 0 },
    { week: 4, grow: 2, bloom: 0.5 },
  ]);

  // Track if we've initialized for this dialog session
  const [isInitialized, setIsInitialized] = useState(false);

  // Load strain data when dialog opens (not on every render)
  useEffect(() => {
    if (!open) {
      // Reset initialized flag when dialog closes
      setIsInitialized(false);
      return;
    }
    
    // Only initialize once per dialog open
    if (isInitialized) return;
    
    if (strain) {
      setName(strain.name || '');
      setBreeder(strain.breeder || '');
      setType(strain.type || 'hybrid');
      setDescription(strain.description || '');
      setFloweringDays(strain.flowering_days?.toString() || '');
      setPhotoUrl(strain.photo_url || '');

      // Parse presets
      if (strain.presets) {
        const parsedPhases: Record<string, PhaseSettings> = {};
        for (const phase of PHASE_CONFIG) {
          const preset = strain.presets[phase.key];
          if (preset) {
            parsedPhases[phase.key] = {
              temp_day: preset.temp ?? preset.temp_day ?? DEFAULT_PHASE_SETTINGS[phase.key].temp_day,
              temp_night: preset.temp_night ?? (preset.temp ? preset.temp - 3 : DEFAULT_PHASE_SETTINGS[phase.key].temp_night),
              hum: preset.hum ?? DEFAULT_PHASE_SETTINGS[phase.key].hum,
              light_h: preset.light_h ?? DEFAULT_PHASE_SETTINGS[phase.key].light_h,
              light_intensity: preset.light_intensity ?? DEFAULT_PHASE_SETTINGS[phase.key].light_intensity,
              vpd_min: preset.vpd_min ?? DEFAULT_PHASE_SETTINGS[phase.key].vpd_min,
              vpd_max: preset.vpd_max ?? DEFAULT_PHASE_SETTINGS[phase.key].vpd_max,
              ec: preset.ec ?? DEFAULT_PHASE_SETTINGS[phase.key].ec,
              ph_min: preset.ph_min ?? DEFAULT_PHASE_SETTINGS[phase.key].ph_min,
              ph_max: preset.ph_max ?? DEFAULT_PHASE_SETTINGS[phase.key].ph_max,
            };
          } else {
            parsedPhases[phase.key] = { ...DEFAULT_PHASE_SETTINGS[phase.key] };
          }
        }
        setPhaseSettings(parsedPhases);
      }

      // Parse nutrient schedule if exists
      if (strain.presets?.nutrient_schedule) {
        setNutrientWeeks(strain.presets.nutrient_schedule);
      }
      // Set is_public from strain data
      setIsPublic(strain.is_public || false);
    } else {
      // Reset form for new strain
      setName('');
      setBreeder('');
      setType('hybrid');
      setDescription('');
      setFloweringDays('');
      setPhotoUrl('');
      setIsPublic(isAdmin); // Default to true for admins, false for regular users
      setPhaseSettings(JSON.parse(JSON.stringify(DEFAULT_PHASE_SETTINGS)));
      setNutrientWeeks([
        { week: 1, grow: 1, bloom: 0 },
        { week: 2, grow: 2, bloom: 0 },
        { week: 3, grow: 2.5, bloom: 0 },
        { week: 4, grow: 2, bloom: 0.5 },
      ]);
    }
    
    setIsInitialized(true);
  }, [strain, open, isInitialized, isAdmin]);

  const updatePhaseSetting = (phase: string, field: keyof PhaseSettings, value: number) => {
    setPhaseSettings(prev => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        [field]: value,
      },
    }));
  };

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
      // Build presets JSON from structured data
      const presets: Record<string, any> = {};

      for (const phase of PHASE_CONFIG) {
        const settings = phaseSettings[phase.key];
        presets[phase.key] = {
          temp: settings.temp_day,
          temp_day: settings.temp_day,
          temp_night: settings.temp_night,
          hum: settings.hum,
          light_h: settings.light_h,
          ...(settings.light_intensity !== undefined && { light_intensity: settings.light_intensity }),
          ...(settings.vpd_min !== undefined && { vpd_min: settings.vpd_min }),
          ...(settings.vpd_max !== undefined && { vpd_max: settings.vpd_max }),
          ...(settings.ec !== undefined && { ec: settings.ec }),
          ...(settings.ph_min !== undefined && { ph_min: settings.ph_min }),
          ...(settings.ph_max !== undefined && { ph_max: settings.ph_max }),
        };
      }

      // Add nutrient schedule
      if (nutrientWeeks.length > 0) {
        presets.nutrient_schedule = nutrientWeeks;
      }

      // CRITICAL FIX: Explicitly capture the current photoUrl state value
      // This ensures we always use the latest value from ImageUpload
      const currentPhotoUrl = photoUrl; // Capture the current state directly
      const finalPhotoUrl = currentPhotoUrl && currentPhotoUrl.trim() !== '' 
        ? currentPhotoUrl.trim() 
        : null;
      
      console.log('[LibraryStrainEditor] Current photoUrl state:', currentPhotoUrl);
      console.log('[LibraryStrainEditor] Final photo_url to save:', finalPhotoUrl);

      // Build the data object with explicit photo_url assignment
      const data = {
        name: name.trim(),
        breeder: breeder.trim() || null,
        type: type || null,
        description: description.trim() || null,
        flowering_days: floweringDays ? parseInt(floweringDays) : null,
        photo_url: finalPhotoUrl, // EXPLICIT: Use the captured photo URL
        presets,
        ...(isAdmin && { is_public: isPublic }),
      };

      console.log('[LibraryStrainEditor] Full payload:', JSON.stringify(data, null, 2));

      if (strain?.id) {
        // Update existing strain
        console.log('[LibraryStrainEditor] Updating strain ID:', strain.id);
        
        const { error } = await supabase
          .from('library_strains')
          .update(data)
          .eq('id', strain.id);

        if (error) {
          console.error('[LibraryStrainEditor] Update error:', error);
          throw error;
        }

        toast({
          title: '✅ Успіх',
          description: `Сорт оновлено${finalPhotoUrl ? ' (з фото)' : ''}`,
        });
      } else {
        // Insert new strain - user_id is required
        if (!user?.id) {
          throw new Error('Ви не авторизовані');
        }
        
        const insertData = { ...data, user_id: user.id, is_public: isPublic };
        console.log('[LibraryStrainEditor] Inserting new strain:', JSON.stringify(insertData, null, 2));
        
        const { error } = await supabase
          .from('library_strains')
          .insert(insertData);

        if (error) {
          console.error('[LibraryStrainEditor] Insert error:', error);
          throw error;
        }

        toast({
          title: '✅ Успіх',
          description: `Сорт додано до бібліотеки${finalPhotoUrl ? ' (з фото)' : ''}`,
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
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl">
            {strain ? '✏️ Редагувати Сорт' : '🌱 Новий Сорт'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-6">
            {/* Basic Info Section */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">📋 Основна інформація</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Тип</Label>
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
                    <Label htmlFor="flowering_days">Дні цвітіння</Label>
                    <Input
                      id="flowering_days"
                      type="number"
                      value={floweringDays}
                      onChange={(e) => setFloweringDays(e.target.value)}
                      placeholder="60"
                    />
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="space-y-2">
                  <Label>Фото сорту</Label>
                  <ImageUpload
                    value={photoUrl}
                    onChange={(url) => {
                      console.log('[LibraryStrainEditor] Image uploaded, new URL:', url);
                      setPhotoUrl(url || '');
                    }}
                  />
                  {photoUrl && (
                    <p className="text-xs text-muted-foreground truncate">
                      URL: {photoUrl.substring(0, 50)}...
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Опис</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Опис сорту, особливості вирощування..."
                    rows={2}
                  />
                </div>

                {/* Public visibility checkbox - only for admins */}
                {isAdmin && (
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="is_public"
                      checked={isPublic}
                      onCheckedChange={(checked) => setIsPublic(checked === true)}
                    />
                    <Label htmlFor="is_public" className="text-sm cursor-pointer">
                      🌍 Зробити публічним (видимий для всіх користувачів)
                    </Label>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Phase Configuration Section */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">⚙️ Налаштування по фазах</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activePhaseTab} onValueChange={setActivePhaseTab}>
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    {PHASE_CONFIG.map((phase) => (
                      <TabsTrigger key={phase.key} value={phase.key} className="text-xs">
                        {phase.icon} {phase.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {PHASE_CONFIG.map((phase) => (
                    <TabsContent key={phase.key} value={phase.key} className="mt-0 space-y-4">
                      {/* Row 1: Climate */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-orange-500">
                          <Thermometer className="h-4 w-4" />
                          🌡️ Climate
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {/* Temperature Day */}
                          <div className="space-y-1 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                            <Label className="text-xs text-muted-foreground">Target Temp Day (°C)</Label>
                            <Input
                              type="number"
                              value={phaseSettings[phase.key]?.temp_day || ''}
                              onChange={(e) => updatePhaseSetting(phase.key, 'temp_day', parseFloat(e.target.value) || 0)}
                              className="h-9"
                            />
                          </div>
                          {/* Temperature Night */}
                          <div className="space-y-1 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                            <Label className="text-xs text-muted-foreground">Target Temp Night (°C)</Label>
                            <Input
                              type="number"
                              value={phaseSettings[phase.key]?.temp_night || ''}
                              onChange={(e) => updatePhaseSetting(phase.key, 'temp_night', parseFloat(e.target.value) || 0)}
                              className="h-9"
                            />
                          </div>
                          {/* Humidity */}
                          <div className="space-y-1 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                            <Label className="text-xs text-muted-foreground">Target Humidity (%)</Label>
                            <Input
                              type="number"
                              value={phaseSettings[phase.key]?.hum || ''}
                              onChange={(e) => updatePhaseSetting(phase.key, 'hum', parseInt(e.target.value) || 0)}
                              className="h-9"
                            />
                          </div>
                          {/* VPD Range */}
                          <div className="space-y-1 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Gauge className="h-3 w-3" /> VPD Range (kPa)
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="Min"
                                value={phaseSettings[phase.key]?.vpd_min || ''}
                                onChange={(e) => updatePhaseSetting(phase.key, 'vpd_min', parseFloat(e.target.value) || 0)}
                                className="h-9 text-sm"
                              />
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="Max"
                                value={phaseSettings[phase.key]?.vpd_max || ''}
                                onChange={(e) => updatePhaseSetting(phase.key, 'vpd_max', parseFloat(e.target.value) || 0)}
                                className="h-9 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Lighting */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-yellow-500">
                          <Sun className="h-4 w-4" />
                          💡 Lighting
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Light Hours */}
                          <div className="space-y-1 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                            <Label className="text-xs text-muted-foreground">Light Hours (ON duration)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="24"
                              value={phaseSettings[phase.key]?.light_h || ''}
                              onChange={(e) => updatePhaseSetting(phase.key, 'light_h', parseInt(e.target.value) || 0)}
                              className="h-9"
                            />
                          </div>
                          {/* Light Intensity */}
                          <div className="space-y-1 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                            <Label className="text-xs text-muted-foreground">Light Intensity (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={phaseSettings[phase.key]?.light_intensity || ''}
                              onChange={(e) => updatePhaseSetting(phase.key, 'light_intensity', parseInt(e.target.value) || 0)}
                              placeholder="100"
                              className="h-9"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Nutrition */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-purple-500">
                          <FlaskConical className="h-4 w-4" />
                          🧪 Nutrition Guidelines
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Target EC */}
                          <div className="space-y-1 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                            <Label className="text-xs text-muted-foreground">Target EC (mS/cm)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={phaseSettings[phase.key]?.ec ?? ''}
                              onChange={(e) => updatePhaseSetting(phase.key, 'ec', parseFloat(e.target.value) || 0)}
                              placeholder="1.2"
                              className="h-9"
                            />
                          </div>
                          {/* pH Range */}
                          <div className="space-y-1 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                            <Label className="text-xs text-muted-foreground">Target pH Range</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="Min"
                                value={phaseSettings[phase.key]?.ph_min || ''}
                                onChange={(e) => updatePhaseSetting(phase.key, 'ph_min', parseFloat(e.target.value) || 0)}
                                className="h-9 text-sm"
                              />
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="Max"
                                value={phaseSettings[phase.key]?.ph_max || ''}
                                onChange={(e) => updatePhaseSetting(phase.key, 'ph_max', parseFloat(e.target.value) || 0)}
                                className="h-9 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Nutrient Schedule Section */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">🧪 Графік живлення (ml/L)</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addNutrientWeek}
                    className="gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Тиждень
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {nutrientWeeks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Натисніть "+ Тиждень" щоб додати графік живлення
                  </p>
                ) : (
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-[60px_1fr_1fr_40px] gap-2 text-xs text-muted-foreground font-medium px-1">
                      <span>Тиждень</span>
                      <span>Grow (ml/L)</span>
                      <span>Bloom (ml/L)</span>
                      <span></span>
                    </div>

                    {nutrientWeeks.map((week, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[60px_1fr_1fr_40px] gap-2 items-center p-2 rounded-lg bg-muted/30"
                      >
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeNutrientWeek(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </form>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
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
