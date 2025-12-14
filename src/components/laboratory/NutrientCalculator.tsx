import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Beaker, Check, FlaskConical, Droplets, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NutrientItem {
  name: string;
  dose: number; // ml/L
}

interface WeekSchedule {
  week: number;
  phase: string;
  nutrients: NutrientItem[];
}

interface ScheduleData {
  phases?: string[];
  weeks: WeekSchedule[];
}

interface NutrientSchedule {
  id: number;
  name: string;
  description: string | null;
  schedule_data: ScheduleData;
}

// Base nutrient names (case-insensitive matching)
const BASE_NUTRIENT_PATTERNS = [
  'grow', 'micro', 'bloom', 'flora', 'base', 'canna', 'terra'
];

function isBaseNutrient(name: string): boolean {
  const lowerName = name.toLowerCase();
  return BASE_NUTRIENT_PATTERNS.some(pattern => lowerName.includes(pattern));
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
  const baseNutrients = currentWeekData?.nutrients.filter(n => isBaseNutrient(n.name)) || [];
  const additives = currentWeekData?.nutrients.filter(n => !isBaseNutrient(n.name)) || [];

  // Calculate totals
  const calculateTotal = (dose: number) => (dose * tankVolume).toFixed(1);
  const grandTotal = currentWeekData?.nutrients.reduce((sum, n) => sum + n.dose * tankVolume, 0) || 0;

  if (schedulesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full bg-zinc-800" />
        <Skeleton className="h-32 w-full bg-zinc-800" />
        <Skeleton className="h-48 w-full bg-zinc-800" />
      </div>
    );
  }

  if (!schedules?.length) {
    return (
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-8 text-center">
        <FlaskConical className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
        <p className="text-zinc-400">
          {t('laboratory.noSchedules', 'No nutrient schedules available.')}
        </p>
        <p className="text-sm text-zinc-500 mt-2">
          {t('laboratory.addSchedulesHint', 'Add schedules via Admin Panel.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* BudLabs-style Dark Card */}
      <div className="rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 p-5 shadow-xl">
        
        {/* Header with Schedule Selector */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Beaker className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="font-bold text-white text-lg">Mix Calculator</span>
          </div>
          <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
            <SelectTrigger className="w-[160px] bg-zinc-800/80 border-zinc-700 text-white text-sm">
              <SelectValue placeholder="Schedule..." />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {schedules.map(schedule => (
                <SelectItem 
                  key={schedule.id} 
                  value={schedule.id.toString()}
                  className="text-white hover:bg-zinc-800"
                >
                  {schedule.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Water Volume Input - Prominent */}
        <div className="mb-5">
          <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 block">
            💧 Water Volume
          </Label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                type="number"
                min={1}
                max={1000}
                value={tankVolume}
                onChange={(e) => setTankVolume(Math.max(1, parseFloat(e.target.value) || 1))}
                className="bg-zinc-800/80 border-zinc-700 text-white text-2xl font-bold h-14 pl-4 pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">
                Liters
              </span>
            </div>
            {/* Quick volume buttons */}
            <div className="flex gap-1">
              {[5, 10, 20].map(vol => (
                <Button
                  key={vol}
                  variant="ghost"
                  size="sm"
                  onClick={() => setTankVolume(vol)}
                  className={cn(
                    "h-10 w-10 rounded-lg text-xs font-bold",
                    tankVolume === vol 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" 
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  )}
                >
                  {vol}L
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Week Selector - Horizontal Pills */}
        {weeks.length > 0 && (
          <div className="mb-5">
            <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 block">
              📅 Growth Week
            </Label>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {weeks.map((week) => {
                  const isFlush = week.phase?.toLowerCase().includes('flush');
                  const isSelected = selectedWeek === week.week;
                  return (
                    <Button
                      key={week.week}
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedWeek(week.week)}
                      className={cn(
                        "min-w-[56px] h-12 rounded-xl flex flex-col gap-0.5 px-3 transition-all",
                        isSelected 
                          ? isFlush
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" 
                          : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
                      )}
                    >
                      <span className="text-[10px] opacity-70">
                        {isFlush ? '🚿' : 'Week'}
                      </span>
                      <span className="text-sm font-bold">
                        {isFlush ? 'Flush' : week.week}
                      </span>
                    </Button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            {currentWeekData && (
              <p className="text-sm text-emerald-400 font-medium mt-2">
                {currentWeekData.phase}
              </p>
            )}
          </div>
        )}
      </div>

      {/* The Receipt Card */}
      {currentWeekData && currentWeekData.nutrients.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 overflow-hidden shadow-xl">
          
          {/* Base Nutrients Section */}
          {baseNutrients.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Droplets className="h-4 w-4 text-pink-400" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Base Nutrients
                </span>
                <div className="flex-1 h-[2px] bg-gradient-to-r from-pink-500 to-transparent ml-2" />
              </div>
              <div className="space-y-2">
                {baseNutrients.map((nutrient, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/60 transition-colors"
                  >
                    <span className="text-zinc-200 font-medium">{nutrient.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500">{nutrient.dose} ml/L</span>
                      <span className="text-pink-400 font-bold text-lg min-w-[70px] text-right">
                        {calculateTotal(nutrient.dose)} ml
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additives Section */}
          {additives.length > 0 && (
            <div className="p-4 pt-0">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Additives
                </span>
                <div className="flex-1 h-[2px] bg-gradient-to-r from-violet-500 to-transparent ml-2" />
              </div>
              <div className="space-y-2">
                {additives.map((nutrient, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/60 transition-colors"
                  >
                    <span className="text-zinc-200 font-medium">{nutrient.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500">{nutrient.dose} ml/L</span>
                      <span className="text-violet-400 font-bold text-lg min-w-[70px] text-right">
                        {calculateTotal(nutrient.dose)} ml
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer - Total & Action */}
          <div className="bg-zinc-800/50 p-4 border-t border-zinc-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                <span className="text-zinc-400 font-medium">Total Mix</span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-white">
                  {grandTotal.toFixed(1)}
                </span>
                <span className="text-zinc-400 ml-1">ml</span>
              </div>
            </div>

            {/* Big Action Button */}
            <Dialog open={feedModalOpen} onOpenChange={setFeedModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-lg shadow-lg shadow-emerald-500/25 transition-all"
                  size="lg"
                >
                  <Check className="h-6 w-6 mr-2" />
                  Mix & Feed
                </Button>
              </DialogTrigger>
              <DialogContent 
                className="bg-zinc-900 border-zinc-700"
                onInteractOutside={(e) => e.preventDefault()}
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-white">
                    <Droplets className="h-5 w-5 text-emerald-400" />
                    Log Feeding
                  </DialogTitle>
                </DialogHeader>
                <FeedingLogModal 
                  schedule={currentSchedule?.name || ''} 
                  week={selectedWeek}
                  onClose={() => setFeedModalOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {/* No data for selected week */}
      {(!currentWeekData || currentWeekData.nutrients.length === 0) && selectedScheduleId && (
        <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-8 text-center">
          <FlaskConical className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400">
            {t('laboratory.noWeekData', 'No nutrient data for this week.')}
          </p>
        </div>
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
        <Label className="text-sm text-zinc-400">
          {t('laboratory.selectPlant', 'Select Plant')}
        </Label>
        {isLoading ? (
          <Skeleton className="h-10 w-full bg-zinc-800" />
        ) : plants?.length ? (
          <Select value={selectedPlant} onValueChange={setSelectedPlant}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
              <SelectValue placeholder="Choose a plant..." />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {plants.map(plant => (
                <SelectItem 
                  key={plant.id} 
                  value={plant.id}
                  className="text-white hover:bg-zinc-800"
                >
                  {plant.custom_name || (plant.library_strains as any)?.name || 'Unnamed Plant'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-zinc-500 py-2">
            {t('laboratory.noPlantsToFeed', 'No active plants to feed.')}
          </p>
        )}
      </div>

      <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Schedule</span>
          <span className="font-medium text-white">{schedule}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Week</span>
          <span className="font-medium text-white">{week}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button 
          variant="outline" 
          onClick={onClose} 
          className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleLogFeeding} 
          disabled={!selectedPlant}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <Check className="h-4 w-4 mr-2" />
          Log It
        </Button>
      </div>
    </div>
  );
}
