import { useState, useMemo, useEffect } from 'react';
import { 
  Leaf, Clock, Thermometer, Droplets, Sun, 
  TrendingUp, Ruler, Wind, Shield, Target,
  Calendar, GraduationCap, Gauge, Plus, Droplet,
  Scissors, FlaskConical, Camera, AlertTriangle, StickyNote,
  Loader2, X
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import type { PlantWithStrain } from '@/hooks/usePlantsWithStrains';

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

interface PlantDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plant: PlantWithStrain | null;
}

const eventTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  watering: { icon: Droplet, color: 'text-blue-400', label: 'Watering' },
  defoliation: { icon: Scissors, color: 'text-green-400', label: 'Defoliation' },
  nutrients: { icon: FlaskConical, color: 'text-purple-400', label: 'Nutrients' },
  photo: { icon: Camera, color: 'text-pink-400', label: 'Photo' },
  issue: { icon: AlertTriangle, color: 'text-red-400', label: 'Issue' },
  note: { icon: StickyNote, color: 'text-yellow-400', label: 'Note' },
  stage_change: { icon: Leaf, color: 'text-emerald-400', label: 'Stage Change' },
};

const IntensityBar = ({ value, max = 10, color = 'primary' }: { value: number; max?: number; color?: string }) => {
  const percentage = (value / max) * 100;
  const colorClasses: Record<string, string> = {
    primary: 'bg-primary',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${colorClasses[color] || colorClasses.primary}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium w-6 text-right">{value}/{max}</span>
    </div>
  );
};

export function PlantDetailsDialog({
  open,
  onOpenChange,
  plant,
}: PlantDetailsDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('journal');
  const [journalEvents, setJournalEvents] = useState<JournalEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    event_type: 'note',
    title: '',
    description: '',
  });

  // Extract growing params from strain
  const rawParams = plant?.growing_params;
  const growingParams: any = rawParams 
    ? (typeof rawParams === 'string' ? JSON.parse(rawParams) : rawParams) 
    : null;
  
  const morphology = growingParams?.morphology || null;
  const resistanceRating = growingParams?.resistance_rating || null;
  const environmentTargets = growingParams?.environment_targets || null;

  // Calculate day of grow
  const dayOfGrow = plant?.start_date 
    ? differenceInDays(new Date(), new Date(plant.start_date)) 
    : 0;

  // Build Radar Chart data for resistance
  const radarData = useMemo(() => {
    if (!resistanceRating) return [];
    return [
      { subject: 'Mold', value: resistanceRating.mold || 0, fullMark: 5 },
      { subject: 'Pests', value: resistanceRating.pests || 0, fullMark: 5 },
      { subject: 'Cold', value: resistanceRating.cold || 0, fullMark: 5 },
      { subject: 'Heat', value: resistanceRating.heat || 0, fullMark: 5 },
      { subject: 'Drought', value: resistanceRating.drought || 0, fullMark: 5 },
    ].filter(item => item.value > 0);
  }, [resistanceRating]);

  // Fetch journal events
  useEffect(() => {
    if (open && plant) {
      fetchJournalEvents();
    }
  }, [open, plant]);

  const fetchJournalEvents = async () => {
    if (!plant) return;
    setIsLoadingEvents(true);
    try {
      const { data, error } = await supabase
        .from('plant_journal_events')
        .select('*')
        .eq('plant_id', plant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJournalEvents((data as JournalEvent[]) || []);
    } catch (error) {
      console.error('Error fetching journal events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleAddEvent = async () => {
    if (!plant || !newEvent.title.trim()) {
      toast({ title: 'Please enter a title', variant: 'destructive' });
      return;
    }

    setIsSavingEvent(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('plant_journal_events')
        .insert({
          plant_id: plant.id,
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
      fetchJournalEvents();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('plant_journal_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      setJournalEvents(prev => prev.filter(e => e.id !== eventId));
      toast({ title: 'Event deleted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (!plant) return null;

  const photoUrl = plant.photo_url || plant.strain_photo_url;

  const formatTempRange = (temp: any) => {
    if (!temp) return 'N/A';
    if (Array.isArray(temp)) return `${temp[0]}°C - ${temp[1]}°C`;
    if (typeof temp === 'object') {
      if (temp.day !== undefined && temp.night !== undefined) {
        return `${temp.night}°C / ${temp.day}°C`;
      }
      if (temp.min !== undefined && temp.max !== undefined) {
        return `${temp.min}°C - ${temp.max}°C`;
      }
    }
    return `${temp}°C`;
  };

  const formatHumidity = (hum: any) => {
    if (!hum) return 'N/A';
    if (Array.isArray(hum)) return `${hum[0]}% - ${hum[1]}%`;
    if (typeof hum === 'object' && hum.min !== undefined && hum.max !== undefined) {
      return `${hum.min}% - ${hum.max}%`;
    }
    return `${hum}%`;
  };

  // Normalize environment targets to array
  const envTargetsArray = useMemo(() => {
    if (!environmentTargets) return [];
    if (Array.isArray(environmentTargets)) return environmentTargets;
    return Object.entries(environmentTargets).map(([key, val]: [string, any]) => ({
      stage: key,
      ...val
    }));
  }, [environmentTargets]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-0">
          <DialogTitle className="sr-only">{plant.custom_name || plant.strain_name}</DialogTitle>
        </DialogHeader>

        {/* ========== HERO SECTION ========== */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Left: Image */}
          <div className="w-full sm:w-48 h-48 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={plant.custom_name || 'Plant'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Leaf className="h-16 w-16 text-primary/30" />
              </div>
            )}
          </div>
          
          {/* Right: Info + Morphology */}
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {plant.custom_name || 'Unnamed Plant'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {plant.strain_name || 'Unknown Strain'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="capitalize">
                  {plant.current_stage || 'seedling'}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Day {dayOfGrow}
                </Badge>
                {plant.is_main && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    👑 Master
                  </Badge>
                )}
              </div>
            </div>

            {/* Morphology Cards */}
            {morphology && (
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="h-3 w-3 text-green-400" />
                    <span className="text-[10px] text-muted-foreground">Stretch</span>
                  </div>
                  <div className="text-lg font-bold text-green-400">
                    x{morphology.stretch_ratio || 'N/A'}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-1 mb-1">
                    <Target className="h-3 w-3 text-purple-400" />
                    <span className="text-[10px] text-muted-foreground">Density</span>
                  </div>
                  <div className="text-sm font-bold text-purple-400 capitalize">
                    {morphology.bud_density || 'N/A'}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-1 mb-1">
                    <Wind className="h-3 w-3 text-pink-400" />
                    <span className="text-[10px] text-muted-foreground">Odor</span>
                  </div>
                  {morphology.odor_intensity !== undefined ? (
                    <IntensityBar value={morphology.odor_intensity} max={10} color="purple" />
                  ) : (
                    <span className="text-xs text-muted-foreground">N/A</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* ========== TABS ========== */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="journal" className="gap-1 text-xs">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Journal</span>
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

          {/* ============ TAB: JOURNAL ============ */}
          <TabsContent value="journal" className="mt-4 space-y-4">
            {/* Add Event Button / Form */}
            {showAddEvent ? (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Add Journal Entry</h4>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setShowAddEvent(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Event Type</Label>
                      <Select
                        value={newEvent.event_type}
                        onValueChange={(v) => setNewEvent(prev => ({ ...prev, event_type: v }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(eventTypeConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <config.icon className={`h-4 w-4 ${config.color}`} />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Day</Label>
                      <Input 
                        value={`Day ${dayOfGrow}`} 
                        disabled 
                        className="h-9 bg-muted/50"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Title</Label>
                    <Input
                      placeholder="What happened?"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Notes (optional)</Label>
                    <Textarea
                      placeholder="Additional details..."
                      value={newEvent.description}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleAddEvent}
                    disabled={isSavingEvent}
                  >
                    {isSavingEvent && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Save Entry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => setShowAddEvent(true)}
              >
                <Plus className="h-4 w-4" />
                Add Note / Event
              </Button>
            )}

            {/* Events List */}
            {isLoadingEvents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : journalEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No journal entries yet</p>
                <p className="text-xs">Start documenting your grow!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {journalEvents.map((event) => {
                  const config = eventTypeConfig[event.event_type] || eventTypeConfig.note;
                  const Icon = config.icon;
                  return (
                    <div 
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 group"
                    >
                      <div className={`p-2 rounded-lg bg-background ${config.color}`}>
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
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
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
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ============ TAB: RESISTANCE ============ */}
          <TabsContent value="resistance" className="mt-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  🛡️ Resistance Matrix
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
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
                        fillOpacity={0.4} 
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
                  <Thermometer className="h-4 w-4 text-orange-400" />
                  🌡️ Environment Targets
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {envTargetsArray.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 font-medium text-muted-foreground">Stage</th>
                          <th className="text-center py-2 font-medium text-muted-foreground">
                            <Thermometer className="h-3 w-3 inline mr-1" />Temp
                          </th>
                          <th className="text-center py-2 font-medium text-muted-foreground">
                            <Droplets className="h-3 w-3 inline mr-1" />Hum
                          </th>
                          <th className="text-center py-2 font-medium text-muted-foreground">
                            <Sun className="h-3 w-3 inline mr-1" />Light
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {envTargetsArray.map((target: any, idx: number) => (
                          <tr key={idx} className="border-b border-border/30">
                            <td className="py-2 capitalize font-medium">{target.stage}</td>
                            <td className="py-2 text-center">{formatTempRange(target.temp)}</td>
                            <td className="py-2 text-center">{formatHumidity(target.humidity)}</td>
                            <td className="py-2 text-center">
                              {target.ppfd ? `${target.ppfd} PPFD` : target.light_hours ? `${target.light_hours}h` : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
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
                  <GraduationCap className="h-4 w-4 text-blue-400" />
                  📖 Strain Info
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                {plant.notes ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {plant.notes}
                  </p>
                ) : plant.strain_name ? (
                  <p className="text-sm text-muted-foreground">
                    Growing {plant.strain_name}. Check the strain library for detailed info.
                  </p>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No strain info available</p>
                    <p className="text-xs">Link a strain from the library</p>
                  </div>
                )}
                
                {/* Quick stats */}
                {plant.flowering_days && (
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/50">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Flowering</p>
                      <p className="font-bold">{plant.flowering_days} days</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Strain</p>
                      <p className="font-bold text-sm">{plant.strain_name || 'Unknown'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
