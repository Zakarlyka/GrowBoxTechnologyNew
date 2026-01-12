import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Camera,
  Clock,
  FlaskConical,
  GraduationCap,
  Leaf,
  Loader2,
  Plus,
  Scissors,
  Shield,
  StickyNote,
  Thermometer,
  Wind,
  X,
} from 'lucide-react';
import { addDays, differenceInDays, format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { PlantWithStrain } from '@/hooks/usePlantsWithStrains';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

interface JournalEvent {
  id: string;
  plant_id: string;
  user_id: string;
  event_type: string;
  title: string | null;
  description: string | null;
  photo_url: string | null;
  day_of_grow: number | null;
  created_at: string;
}

type StrainRow = {
  id: number;
  name: string;
  photo_url: string | null;
  description: string | null;
  genetics: string | null;
  flowering_days: number | null;
  presets: unknown | null;
  growing_params: unknown | null;
};

type PlantDetailsRow = {
  id: string;
  custom_name: string | null;
  current_stage: string | null;
  start_date: string | null;
  is_main: boolean | null;
  strain_id: number | null;
  photo_url: string | null;
  notes: string | null;
  library_strains: StrainRow | null;
};

interface PlantDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plant: PlantWithStrain | null;
}

type ColorToken = 'primary' | 'accent' | 'warning' | 'destructive' | 'muted' | 'success';

const tokenTextClass: Record<ColorToken, string> = {
  primary: 'text-primary',
  accent: 'text-accent',
  warning: 'text-warning',
  destructive: 'text-destructive',
  muted: 'text-muted-foreground',
  success: 'text-success',
};

const tokenBgClass: Record<ColorToken, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  muted: 'bg-muted',
  success: 'bg-success',
};

const eventTypeConfig: Record<
  string,
  { icon: React.ElementType; color: ColorToken; label: string }
> = {
  watering: { icon: Leaf, color: 'primary', label: 'Watering' },
  defoliation: { icon: Scissors, color: 'accent', label: 'Defoliation' },
  nutrients: { icon: FlaskConical, color: 'success', label: 'Nutrients' },
  photo: { icon: Camera, color: 'primary', label: 'Photo' },
  issue: { icon: AlertTriangle, color: 'destructive', label: 'Issue' },
  note: { icon: StickyNote, color: 'muted', label: 'Note' },
  stage_change: { icon: Leaf, color: 'accent', label: 'Stage Change' },
};

function safeJsonObject(value: unknown): Record<string, any> | null {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? (parsed as any) : null;
    } catch {
      return null;
    }
  }
  return typeof value === 'object' ? (value as any) : null;
}

function avgMinMax(v: unknown): number | null {
  if (typeof v === 'number') return v;
  const obj = safeJsonObject(v);
  if (!obj) return null;
  const min = typeof obj.min === 'number' ? obj.min : null;
  const max = typeof obj.max === 'number' ? obj.max : null;
  if (min === null && max === null) return null;
  if (min !== null && max !== null) return Math.round((min + max) / 2);
  return min ?? max;
}

type EnvTarget = {
  temp_day?: number;
  temp_night?: number;
  humidity_min?: number;
  humidity_max?: number;
  vpd_target?: number;
  ppfd_target?: number;
  light_hours?: number;
};

function normalizeEnvironmentTargets(
  raw: unknown,
  presetsRaw: unknown
): Record<string, EnvTarget> {
  const asObj = safeJsonObject(raw);
  if (asObj) return asObj as Record<string, EnvTarget>;

  // Fallback: presets (veg/bloom/flush)
  const presets = safeJsonObject(presetsRaw);
  if (!presets) return {};

  const out: Record<string, EnvTarget> = {};
  if (presets.veg) {
    out.vegetation = {
      temp_day: presets.veg.temp,
      humidity_min: presets.veg.hum,
      humidity_max: presets.veg.hum,
      light_hours: presets.veg.light_h,
    };
  }
  if (presets.bloom) {
    out.flowering = {
      temp_day: presets.bloom.temp,
      humidity_min: presets.bloom.hum,
      humidity_max: presets.bloom.hum,
      light_hours: presets.bloom.light_h,
    };
  }
  if (presets.flush) {
    out.ripening = {
      temp_day: presets.flush.temp,
      humidity_min: presets.flush.hum,
      humidity_max: presets.flush.hum,
      light_hours: presets.flush.light_h,
    };
  }
  return out;
}

function fmtTemp(t?: EnvTarget): string {
  if (!t) return '—';
  const day = typeof t.temp_day === 'number' ? `${t.temp_day}°C` : '—';
  const night = typeof t.temp_night === 'number' ? `${t.temp_night}°C` : '—';
  return night !== '—' ? `${day} / ${night}` : day;
}

function fmtRh(t?: EnvTarget): string {
  if (!t) return '—';
  const min = typeof t.humidity_min === 'number' ? t.humidity_min : null;
  const max = typeof t.humidity_max === 'number' ? t.humidity_max : null;
  if (min === null && max === null) return '—';
  if (min !== null && max !== null) return `${min}–${max}%`;
  return `${min ?? max}%`;
}

function fmtVpd(t?: EnvTarget): string {
  if (!t || typeof t.vpd_target !== 'number') return '—';
  return `${t.vpd_target} kPa`;
}

function fmtPpfdOrLight(t?: EnvTarget): string {
  if (!t) return '—';
  if (typeof t.ppfd_target === 'number') return `${t.ppfd_target} PPFD`;
  if (typeof t.light_hours === 'number') return `${t.light_hours}h`;
  return '—';
}

type PredStage = {
  name: string;
  startDay: number;
  endDay: number;
  startDate: Date;
  endDate: Date;
};

function buildPredictedTimeline(opts: {
  startDate: Date;
  currentDay: number;
  growingParams: Record<string, any> | null;
  fallbackFloweringDays?: number | null;
}): { stages: PredStage[]; estTotalDays: number | null; estHarvestDate: Date | null } {
  const { startDate, currentDay, growingParams, fallbackFloweringDays } = opts;

  const estTotalDays =
    avgMinMax(growingParams?.lifecycle_estimates?.seed_to_harvest_days) ??
    (typeof growingParams?.lifecycle_estimates?.total_days === 'number'
      ? growingParams.lifecycle_estimates.total_days
      : null);

  const rawStages = Array.isArray(growingParams?.stages) ? growingParams!.stages : null;
  const stageDefs: Array<{ name: string; days: number }> = [];

  if (rawStages) {
    for (const s of rawStages) {
      const name = typeof s?.name === 'string' ? s.name : null;
      const days =
        typeof s?.days_duration === 'number'
          ? s.days_duration
          : typeof s?.days === 'number'
            ? s.days
            : null;
      if (name && days) stageDefs.push({ name, days });
    }
  }

  if (stageDefs.length === 0) {
    const flower = fallbackFloweringDays ?? 56;
    stageDefs.push(
      { name: 'Seedling', days: 14 },
      { name: 'Vegetation', days: 21 },
      { name: 'Flowering', days: flower },
      { name: 'Ripening', days: 10 }
    );
  }

  const sumRaw = stageDefs.reduce((acc, s) => acc + s.days, 0);
  const targetTotal = estTotalDays ?? sumRaw;
  const scale = sumRaw > 0 ? targetTotal / sumRaw : 1;

  const scaled = stageDefs.map((s) => ({
    name: s.name,
    days: Math.max(1, Math.round(s.days * scale)),
  }));

  // Fix rounding drift to match targetTotal
  const sumScaled = scaled.reduce((acc, s) => acc + s.days, 0);
  const drift = targetTotal - sumScaled;
  if (scaled.length > 0 && drift !== 0) {
    scaled[scaled.length - 1].days = Math.max(1, scaled[scaled.length - 1].days + drift);
  }

  let cursorDay = 0;
  const stages: PredStage[] = scaled.map((s) => {
    const startDay = cursorDay;
    const endDay = cursorDay + s.days;
    const stage: PredStage = {
      name: s.name,
      startDay,
      endDay,
      startDate: addDays(startDate, startDay),
      endDate: addDays(startDate, endDay),
    };
    cursorDay = endDay;
    return stage;
  });

  const estHarvestDate = targetTotal ? addDays(startDate, targetTotal) : null;

  // If currentDay is beyond computed (happens with missing start date), keep timeline stable.
  void currentDay;

  return { stages, estTotalDays: targetTotal ?? null, estHarvestDate };
}

const IntensityBar = ({
  value,
  max = 10,
  color = 'primary',
}: {
  value: number;
  max?: number;
  color?: ColorToken;
}) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${tokenBgClass[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium w-12 text-right text-muted-foreground">
        {value}/{max}
      </span>
    </div>
  );
};

export function PlantDetailsDialog({ open, onOpenChange, plant }: PlantDetailsDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'timeline' | 'resistance' | 'environment' | 'wiki'>('timeline');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    event_type: 'note',
    title: '',
    description: '',
  });

  const plantId = plant?.id;

  const plantQuery = useQuery({
    queryKey: ['plant-details', plantId],
    enabled: open && !!plantId,
    queryFn: async (): Promise<PlantDetailsRow | null> => {
      if (!plantId) return null;
      const { data, error } = await supabase
        .from('plants')
        .select(
          `
            id,
            custom_name,
            current_stage,
            start_date,
            is_main,
            strain_id,
            photo_url,
            notes,
            library_strains (
              id,
              name,
              photo_url,
              description,
              genetics,
              flowering_days,
              presets,
              growing_params
            )
          `
        )
        .eq('id', plantId)
        .maybeSingle();

      if (error) throw error;
      return (data as any) ?? null;
    },
  });

  const eventsQuery = useQuery({
    queryKey: ['plant-journal-events', plantId],
    enabled: open && !!plantId,
    queryFn: async (): Promise<JournalEvent[]> => {
      if (!plantId) return [];
      const { data, error } = await supabase
        .from('plant_journal_events')
        .select('*')
        .eq('plant_id', plantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as JournalEvent[]) || [];
    },
  });

  const effectivePlant = plantQuery.data ?? null;

  if (!plant) return null;

  const customName = effectivePlant?.custom_name ?? plant.custom_name ?? 'Unnamed Plant';
  const stage = effectivePlant?.current_stage ?? plant.current_stage ?? 'seedling';
  const startDateStr = effectivePlant?.start_date ?? plant.start_date ?? null;
  const isMaster = effectivePlant?.is_main ?? plant.is_main ?? false;

  const strain = effectivePlant?.library_strains ?? null;
  const strainName = strain?.name ?? plant.strain_name ?? 'Unknown Strain';
  const strainPhotoUrl = strain?.photo_url ?? plant.strain_photo_url ?? null;
  const flowerDays = strain?.flowering_days ?? plant.flowering_days ?? null;

  const photoUrl = effectivePlant?.photo_url ?? plant.photo_url ?? strainPhotoUrl;

  const dayOfGrow = useMemo(() => {
    if (!startDateStr) return 0;
    return Math.max(0, differenceInDays(new Date(), new Date(startDateStr)));
  }, [startDateStr]);

  const growingParams = useMemo(() => {
    // Primary source must be library_strains.growing_params
    return safeJsonObject(strain?.growing_params ?? plant.growing_params) ?? null;
  }, [strain?.growing_params, plant.growing_params]);

  const morphology = (growingParams?.morphology ?? null) as
    | { stretch_ratio?: number; bud_density?: string; odor_intensity?: number }
    | null;

  const resistance = (growingParams?.resistance_rating ?? growingParams?.resistance_data ?? null) as
    | { mold?: number; pests?: number; cold?: number; heat?: number }
    | null;

  const envTargetsRecord = useMemo(() => {
    return normalizeEnvironmentTargets(
      growingParams?.environment_targets ?? growingParams?.optimal_environments,
      strain?.presets
    );
  }, [growingParams, strain?.presets]);

  const protocol = useMemo(
    () => [
      { key: 'seedling', label: 'Seedling', target: envTargetsRecord.seedling },
      { key: 'vegetation', label: 'Veg', target: envTargetsRecord.vegetation ?? envTargetsRecord.veg },
      { key: 'flowering', label: 'Bloom', target: envTargetsRecord.flowering ?? envTargetsRecord.bloom },
    ],
    [envTargetsRecord]
  );

  const radarData = useMemo(() => {
    if (!resistance) return [];
    return [
      { subject: 'Mold', value: resistance.mold ?? 0, fullMark: 5 },
      { subject: 'Pests', value: resistance.pests ?? 0, fullMark: 5 },
      { subject: 'Cold', value: resistance.cold ?? 0, fullMark: 5 },
      { subject: 'Heat', value: resistance.heat ?? 0, fullMark: 5 },
    ];
  }, [resistance]);

  const predicted = useMemo(() => {
    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    return buildPredictedTimeline({
      startDate,
      currentDay: dayOfGrow,
      growingParams,
      fallbackFloweringDays: flowerDays,
    });
  }, [startDateStr, dayOfGrow, growingParams, flowerDays]);

  const handleAddEvent = async () => {
    if (!plantId || !newEvent.title.trim()) {
      toast({ title: 'Please enter a title', variant: 'destructive' });
      return;
    }

    setIsSavingEvent(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase.from('plant_journal_events').insert({
        plant_id: plantId,
        user_id: userData.user.id,
        event_type: newEvent.event_type,
        title: newEvent.title,
        description: newEvent.description || null,
        day_of_grow: dayOfGrow,
      });

      if (error) throw error;

      toast({ title: '✅ Event added', description: `Day ${dayOfGrow}` });
      setNewEvent({ event_type: 'note', title: '', description: '' });
      setShowAddEvent(false);
      queryClient.invalidateQueries({ queryKey: ['plant-journal-events', plantId] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!plantId) return;
    try {
      const { error } = await supabase
        .from('plant_journal_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      toast({ title: 'Event deleted' });
      queryClient.invalidateQueries({ queryKey: ['plant-journal-events', plantId] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const wikiDescription = strain?.description ?? null;
  const wikiGenetics = strain?.genetics ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader className="pb-0 sr-only">
          <DialogTitle>{customName || strainName || 'Plant Details'}</DialogTitle>
        </DialogHeader>

        {/* ========== HERO SECTION / PASSPORT ========== */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Left: Strain image */}
          <div className="w-full sm:w-56 h-56 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`${customName} – ${strainName}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Leaf className="h-16 w-16 text-primary/30" />
              </div>
            )}
          </div>

          {/* Right: identity + morphology */}
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{customName}</h2>
              <p className="text-sm text-muted-foreground">{strainName}</p>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline" className="capitalize">
                  {stage}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Day {dayOfGrow}
                </Badge>
                {isMaster && (
                  <Badge className="bg-warning/20 text-warning border-warning/30">
                    👑 Master
                  </Badge>
                )}
              </div>
            </div>

            {/* Morphology cards (always keep layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">Stretch Ratio</span>
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {typeof morphology?.stretch_ratio === 'number' ? `x${morphology.stretch_ratio}` : 'N/A'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">Bud Density</span>
                </div>
                <div className="text-lg font-semibold text-foreground capitalize">
                  {morphology?.bud_density ?? 'N/A'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Odor Intensity</span>
                </div>
                <IntensityBar
                  value={typeof morphology?.odor_intensity === 'number' ? morphology.odor_intensity : 0}
                  max={10}
                  color="primary"
                />
              </div>
            </div>

            {plantQuery.isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading strain passport…
              </div>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* ========== TABS ========== */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="timeline" className="gap-1 text-xs">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="resistance" className="gap-1 text-xs">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Resistance</span>
            </TabsTrigger>
            <TabsTrigger value="environment" className="gap-1 text-xs">
              <Thermometer className="h-4 w-4" />
              <span className="hidden sm:inline">Environment</span>
            </TabsTrigger>
            <TabsTrigger value="wiki" className="gap-1 text-xs">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Wiki</span>
            </TabsTrigger>
          </TabsList>

          {/* ============ TAB: TIMELINE (Predicted + Journal) ============ */}
          <TabsContent value="timeline" className="mt-4 space-y-4">
            <Card className="border-border/50">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  🧬 Predicted Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                  {predicted.estHarvestDate ? (
                    <span>
                      Estimated harvest: <span className="text-foreground font-medium">{format(predicted.estHarvestDate, 'PPP')}</span>
                    </span>
                  ) : (
                    <span>Estimated harvest: —</span>
                  )}
                  {predicted.estTotalDays ? (
                    <Badge variant="secondary" className="text-[10px]">~{predicted.estTotalDays} days</Badge>
                  ) : null}
                </div>

                <div className="relative pl-4">
                  <div className="absolute left-1 top-0 bottom-0 w-px bg-border/60" />
                  <div className="space-y-3">
                    {predicted.stages.map((s, idx) => {
                      const isNow = dayOfGrow >= s.startDay && dayOfGrow < s.endDay;
                      return (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-background border border-border" />
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{s.name}</span>
                                {isNow && (
                                  <Badge className="bg-accent/20 text-accent border-accent/30 text-[10px]">Now</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(s.startDate, 'MMM d')} → {format(s.endDate, 'MMM d')} • Days {s.startDay}–{s.endDay}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Journal */}
            <Card className="border-border/50">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-muted-foreground" />
                  📓 Journal
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                {showAddEvent ? (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Add Entry</h4>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddEvent(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={newEvent.event_type}
                          onValueChange={(v) => setNewEvent((p) => ({ ...p, event_type: v }))}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(eventTypeConfig).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <cfg.icon className={`h-4 w-4 ${tokenTextClass[cfg.color]}`} />
                                  {cfg.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Day</Label>
                        <Input value={`Day ${dayOfGrow}`} disabled className="h-9 bg-muted/50" />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input
                        placeholder="What happened?"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))}
                        className="h-9"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Notes (optional)</Label>
                      <Textarea
                        placeholder="Additional details…"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))}
                        rows={2}
                      />
                    </div>

                    <Button className="w-full" onClick={handleAddEvent} disabled={isSavingEvent}>
                      {isSavingEvent && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Save Entry
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full gap-2" onClick={() => setShowAddEvent(true)}>
                    <Plus className="h-4 w-4" />
                    Add Note / Event
                  </Button>
                )}

                {eventsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (eventsQuery.data?.length ?? 0) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No journal entries yet</p>
                    <p className="text-xs">Start documenting your grow!</p>
                  </div>
                ) : (
                  <div className="relative pl-4 max-h-[320px] overflow-y-auto pr-2">
                    <div className="absolute left-1 top-0 bottom-0 w-px bg-border/60" />
                    <div className="space-y-3">
                      {eventsQuery.data!.map((event) => {
                        const cfg = eventTypeConfig[event.event_type] || eventTypeConfig.note;
                        const Icon = cfg.icon;
                        return (
                          <div key={event.id} className="relative group">
                            <div className="absolute -left-[7px] top-2 h-3 w-3 rounded-full bg-background border border-border" />
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 ${tokenTextClass[cfg.color]}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{event.title}</span>
                                  <Badge variant="secondary" className="text-[10px] px-1.5">
                                    Day {event.day_of_grow ?? '?'}
                                  </Badge>
                                </div>
                                {event.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                                    {event.description}
                                  </p>
                                )}
                                <p className="text-[10px] text-muted-foreground/60 mt-1">
                                  {format(new Date(event.created_at), 'PPP')}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ TAB: RESISTANCE ============ */}
          <TabsContent value="resistance" className="mt-4">
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  🛡️ Resistance Matrix
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 5]}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      />
                      <Radar
                        name="Resistance"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.35}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No resistance data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ TAB: ENVIRONMENT ============ */}
          <TabsContent value="environment" className="mt-4">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-warning" />
                  🌡️ Climate Protocol
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 font-medium text-muted-foreground">Stage</th>
                        <th className="text-center py-2 font-medium text-muted-foreground">Temp</th>
                        <th className="text-center py-2 font-medium text-muted-foreground">RH</th>
                        <th className="text-center py-2 font-medium text-muted-foreground">VPD</th>
                        <th className="text-center py-2 font-medium text-muted-foreground">Light</th>
                      </tr>
                    </thead>
                    <tbody>
                      {protocol.map((row) => (
                        <tr key={row.key} className="border-b border-border/30">
                          <td className="py-2 font-medium">{row.label}</td>
                          <td className="py-2 text-center">{fmtTemp(row.target)}</td>
                          <td className="py-2 text-center">{fmtRh(row.target)}</td>
                          <td className="py-2 text-center">{fmtVpd(row.target)}</td>
                          <td className="py-2 text-center">{fmtPpfdOrLight(row.target)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {Object.keys(envTargetsRecord).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Thermometer className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No environment targets available</p>
                    <p className="text-xs">Link a strain to see recommended settings</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ TAB: WIKI ============ */}
          <TabsContent value="wiki" className="mt-4">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  📖 Wiki
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-4">
                {wikiDescription ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{wikiDescription}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No description available for this strain.
                  </p>
                )}

                {wikiGenetics ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Genetics</p>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{wikiGenetics}</p>
                  </div>
                ) : null}

                {effectivePlant?.notes ? (
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Your notes</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{effectivePlant.notes}</p>
                  </div>
                ) : null}

                {flowerDays ? (
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/50">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Flowering</p>
                      <p className="font-semibold">{flowerDays} days</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Strain</p>
                      <p className="font-semibold text-sm">{strainName}</p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
