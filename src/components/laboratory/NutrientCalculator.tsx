import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Beaker, Droplets, Check, FlaskConical, Sparkles } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface NutrientItem {
  product: string;
  category: 'base' | 'additive';
  dose: number; // ml/L
}

interface WeekSchedule {
  week: number;
  phase: string;
  nutrients: NutrientItem[];
}

interface ScheduleData {
  weeks: WeekSchedule[];
}

interface NutrientSchedule {
  id: number;
  name: string;
  description: string | null;
  schedule_data: ScheduleData;
}

export function NutrientCalculator() {
  const { t } = useTranslation();
  const [tankVolume, setTankVolume] = useState<number>(10);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [feedModalOpen, setFeedModalOpen] = useState(false);

  // Fetch nutrient schedules
  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['nutrient-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutrient_schedules')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return (data as unknown as NutrientSchedule[]) || [];
    }
  });

  // Get current schedule
  const currentSchedule = schedules?.find(s => s.id.toString() === selectedScheduleId);
  const scheduleData = currentSchedule?.schedule_data as ScheduleData | undefined;
  const weeks = scheduleData?.weeks || [];
  const currentWeekData = weeks.find(w => w.week === selectedWeek);

  // Auto-select first schedule
  useEffect(() => {
    if (schedules?.length && !selectedScheduleId) {
      setSelectedScheduleId(schedules[0].id.toString());
    }
  }, [schedules, selectedScheduleId]);

  // Reset week when schedule changes
  useEffect(() => {
    if (weeks.length > 0) {
      setSelectedWeek(weeks[0].week);
    }
  }, [selectedScheduleId]);

  // Group nutrients by category
  const baseNutrients = currentWeekData?.nutrients.filter(n => n.category === 'base') || [];
  const additives = currentWeekData?.nutrients.filter(n => n.category === 'additive') || [];

  // Calculate totals
  const calculateTotal = (dose: number) => (dose * tankVolume).toFixed(1);
  const totalBase = baseNutrients.reduce((sum, n) => sum + n.dose * tankVolume, 0);
  const totalAdditives = additives.reduce((sum, n) => sum + n.dose * tankVolume, 0);
  const grandTotal = totalBase + totalAdditives;

  if (schedulesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!schedules?.length) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="py-12 text-center">
          <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {t('laboratory.noSchedules', 'No nutrient schedules available.')}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            {t('laboratory.addSchedulesHint', 'Add schedules via Admin Panel.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Section - Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Schedule Selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">
            {t('laboratory.nutrientSchedule', 'Nutrient Schedule')}
          </Label>
          <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
            <SelectTrigger className="bg-background text-foreground border-input">
              <SelectValue placeholder="Select schedule..." />
            </SelectTrigger>
            <SelectContent>
              {schedules.map(schedule => (
                <SelectItem key={schedule.id} value={schedule.id.toString()}>
                  {schedule.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentSchedule?.description && (
            <p className="text-xs text-muted-foreground">{currentSchedule.description}</p>
          )}
        </div>

        {/* Tank Volume */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">
            {t('laboratory.tankVolume', 'Tank Volume')}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={1000}
              value={tankVolume}
              onChange={(e) => setTankVolume(Math.max(1, parseFloat(e.target.value) || 1))}
              className="flex-1 bg-background text-foreground border-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-sm font-medium text-muted-foreground px-3 py-2 bg-muted rounded-md">
              L
            </span>
          </div>
        </div>
      </div>

      {/* Week Selector */}
      {weeks.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">
            {t('laboratory.growthPhase', 'Growth Phase / Week')}
          </Label>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {weeks.map((week) => (
                <Button
                  key={week.week}
                  variant={selectedWeek === week.week ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedWeek(week.week)}
                  className={`min-w-[80px] ${
                    selectedWeek === week.week 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent'
                  }`}
                >
                  <span className="text-xs font-medium">
                    {week.phase === 'Flush' ? '🚿 Flush' : `W${week.week}`}
                  </span>
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          {currentWeekData && (
            <p className="text-sm text-primary font-medium">
              📅 {currentWeekData.phase}
            </p>
          )}
        </div>
      )}

      {/* The Receipt - Nutrient List */}
      {currentWeekData && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Beaker className="h-5 w-5 text-primary" />
              {t('laboratory.mixRecipe', 'Mix Recipe')}
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {tankVolume}L Tank
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Base Nutrients */}
            {baseNutrients.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-green-500">
                  <Droplets className="h-4 w-4" />
                  {t('laboratory.baseNutrients', 'Base Nutrients')}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="text-muted-foreground">Product</TableHead>
                      <TableHead className="text-right text-muted-foreground">Dose</TableHead>
                      <TableHead className="text-right text-muted-foreground">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {baseNutrients.map((nutrient, idx) => (
                      <TableRow key={idx} className="border-border/30">
                        <TableCell className="font-medium text-foreground">
                          {nutrient.product}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {nutrient.dose} ml/L
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-500">
                          {calculateTotal(nutrient.dose)} ml
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Additives */}
            {additives.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-purple-500">
                  <Sparkles className="h-4 w-4" />
                  {t('laboratory.additives', 'Additives & Stimulators')}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="text-muted-foreground">Product</TableHead>
                      <TableHead className="text-right text-muted-foreground">Dose</TableHead>
                      <TableHead className="text-right text-muted-foreground">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {additives.map((nutrient, idx) => (
                      <TableRow key={idx} className="border-border/30">
                        <TableCell className="font-medium text-foreground">
                          {nutrient.product}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {nutrient.dose} ml/L
                        </TableCell>
                        <TableCell className="text-right font-bold text-purple-500">
                          {calculateTotal(nutrient.dose)} ml
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">
                  {t('common.total', 'Total')}
                </span>
                <div className="text-right">
                  <span className="text-3xl font-bold text-primary">
                    {grandTotal.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground ml-1">ml</span>
                </div>
              </div>
            </div>

            {/* Feed Button */}
            <Dialog open={feedModalOpen} onOpenChange={setFeedModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mt-4" size="lg">
                  <Check className="h-5 w-5 mr-2" />
                  {t('laboratory.fedMyPlants', '✅ I Fed My Plants')}
                </Button>
              </DialogTrigger>
              <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-primary" />
                    {t('laboratory.logFeeding', 'Log Feeding')}
                  </DialogTitle>
                </DialogHeader>
                <FeedingLogModal 
                  schedule={currentSchedule?.name || ''} 
                  week={selectedWeek}
                  onClose={() => setFeedModalOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* No data for selected week */}
      {!currentWeekData && selectedScheduleId && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {t('laboratory.noWeekData', 'No nutrient data for this week.')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Feeding Log Modal Component
interface FeedingLogModalProps {
  schedule: string;
  week: number;
  onClose: () => void;
}

function FeedingLogModal({ schedule, week, onClose }: FeedingLogModalProps) {
  const { t } = useTranslation();
  const [selectedPlant, setSelectedPlant] = useState<string>('');

  // Fetch active plants
  const { data: plants, isLoading } = useQuery({
    queryKey: ['active-plants-for-feeding'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('plants')
        .select(`
          id,
          custom_name,
          device_id,
          library_strains (name)
        `)
        .eq('user_id', user.id)
        .neq('current_stage', 'harvested');

      if (error) throw error;
      return data;
    }
  });

  const handleLogFeeding = () => {
    // TODO: Implement feeding log when table is ready
    console.log('Logged feeding:', { schedule, week, plantId: selectedPlant });
    onClose();
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">
          {t('laboratory.selectPlant', 'Select Plant')}
        </Label>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : plants?.length ? (
          <Select value={selectedPlant} onValueChange={setSelectedPlant}>
            <SelectTrigger className="bg-background text-foreground border-input">
              <SelectValue placeholder="Choose a plant..." />
            </SelectTrigger>
            <SelectContent>
              {plants.map(plant => (
                <SelectItem key={plant.id} value={plant.id}>
                  {plant.custom_name || (plant.library_strains as any)?.name || 'Unnamed Plant'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            {t('laboratory.noPlantsToFeed', 'No active plants to feed.')}
          </p>
        )}
      </div>

      <div className="bg-muted/50 rounded-lg p-3 space-y-1">
        <p className="text-sm">
          <span className="text-muted-foreground">Schedule:</span>{' '}
          <span className="font-medium text-foreground">{schedule}</span>
        </p>
        <p className="text-sm">
          <span className="text-muted-foreground">Week:</span>{' '}
          <span className="font-medium text-foreground">{week}</span>
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button 
          onClick={handleLogFeeding} 
          disabled={!selectedPlant}
          className="flex-1"
        >
          <Check className="h-4 w-4 mr-2" />
          {t('laboratory.logIt', 'Log It')}
        </Button>
      </div>
    </div>
  );
}
