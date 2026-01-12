import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { uk } from "date-fns/locale";
import { 
  Calendar, 
  Bell, 
  PenLine, 
  Plus, 
  CheckCircle2, 
  Loader2,
  Sprout,
  Leaf,
  Flower2,
  Droplets,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  PlantWithStrain, 
  GrowingStage, 
  TimelineAlert,
  calculateStageInfo 
} from "@/hooks/usePlantsWithStrains";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface DaySummaryPanelProps {
  plant: PlantWithStrain;
  selectedDate: Date;
  journalEvents?: {
    id: string;
    created_at: string;
    event_type: string;
    title: string | null;
    description: string | null;
    day_of_grow: number | null;
  }[];
  onNoteAdded?: () => void;
}

const stageIcons: Record<string, React.ElementType> = {
  seedling: Sprout,
  germination: Sprout,
  vegetation: Leaf,
  veg: Leaf,
  flowering: Flower2,
  bloom: Flower2,
  flushing: Droplets,
  flush: Droplets,
  drying: Sun,
  harvest: Sun,
};

const stageColors: Record<string, string> = {
  seedling: "text-lime-400",
  germination: "text-lime-400",
  vegetation: "text-emerald-400",
  veg: "text-emerald-400",
  flowering: "text-purple-400",
  bloom: "text-purple-400",
  flushing: "text-sky-400",
  flush: "text-sky-400",
  drying: "text-amber-400",
  harvest: "text-amber-400",
};

function getStageDays(stage: GrowingStage): number {
  if (stage.days_duration) return stage.days_duration;
  if (stage.days) return stage.days;
  if (stage.weeks_duration) return stage.weeks_duration * 7;
  if (stage.weeks) {
    const match = stage.weeks.match(/(\d+)(?:-(\d+))?/);
    if (match) {
      const start = parseInt(match[1]);
      const end = match[2] ? parseInt(match[2]) : start;
      return Math.round(((start + end) / 2) * 7);
    }
  }
  return 7;
}

function getStageForDay(growDay: number, stages: GrowingStage[]): { stageName: string; dayInStage: number; stageDuration: number } | null {
  if (!stages || stages.length === 0) return null;
  
  let cumulativeDays = 0;
  for (const stage of stages) {
    const stageDays = getStageDays(stage);
    if (growDay < cumulativeDays + stageDays) {
      return {
        stageName: stage.name,
        dayInStage: growDay - cumulativeDays,
        stageDuration: stageDays,
      };
    }
    cumulativeDays += stageDays;
  }
  
  // Past all stages - return last stage
  const lastStage = stages[stages.length - 1];
  const lastStageDays = getStageDays(lastStage);
  return {
    stageName: lastStage.name,
    dayInStage: growDay - (cumulativeDays - lastStageDays),
    stageDuration: lastStageDays,
  };
}

function getAlertsForDay(growDay: number, stages: GrowingStage[], alerts: TimelineAlert[]): TimelineAlert[] {
  if (!stages || !alerts || stages.length === 0) return [];
  
  // Build stage start days map
  const stageStartDays: Record<string, number> = {};
  let cumulativeDays = 0;
  for (const stage of stages) {
    stageStartDays[stage.name.toLowerCase()] = cumulativeDays;
    cumulativeDays += getStageDays(stage);
  }
  
  // Find alerts for this exact day
  return alerts.filter(alert => {
    const stageKey = alert.trigger_stage?.toLowerCase() || '';
    const stageStart = stageStartDays[stageKey] ?? 0;
    const absoluteDay = stageStart + (alert.day_offset || 0);
    return absoluteDay === growDay;
  });
}

export function DaySummaryPanel({ 
  plant, 
  selectedDate, 
  journalEvents = [],
  onNoteAdded 
}: DaySummaryPanelProps) {
  const queryClient = useQueryClient();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const plantStartDate = plant.start_date ? new Date(plant.start_date) : new Date();
  const growDay = differenceInDays(selectedDate, plantStartDate);
  const stages = plant.growing_params?.stages || [];
  const timelineAlerts = plant.growing_params?.timeline_alerts || [];
  
  const stageInfo = growDay >= 0 ? getStageForDay(growDay, stages) : null;
  const alerts = growDay >= 0 ? getAlertsForDay(growDay, stages, timelineAlerts) : [];
  
  // Filter journal events for the selected date
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayEvents = journalEvents.filter(event => 
    event.created_at?.startsWith(dateStr)
  );
  
  const StageIcon = stageInfo 
    ? stageIcons[stageInfo.stageName.toLowerCase()] || Leaf 
    : Leaf;
  const stageColor = stageInfo 
    ? stageColors[stageInfo.stageName.toLowerCase()] || "text-muted-foreground" 
    : "text-muted-foreground";

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    
    setIsSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");
      
      const { error } = await supabase.from("plant_journal_events").insert({
        plant_id: plant.id,
        user_id: userData.user.id,
        event_type: "note",
        title: `Day ${growDay} Note`,
        description: noteText.trim(),
        day_of_grow: growDay,
        created_at: selectedDate.toISOString(),
      });
      
      if (error) throw error;
      
      toast.success("Note saved!");
      setNoteText("");
      setIsAddingNote(false);
      queryClient.invalidateQueries({ queryKey: ['plant-journal', plant.id] });
      onNoteAdded?.();
    } catch (error) {
      console.error("Failed to save note:", error);
      toast.error("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{format(selectedDate, "EEE, dd MMM yyyy", { locale: uk })}</span>
          </div>
          {growDay >= 0 && (
            <Badge variant="secondary" className="text-xs font-bold">
              День {growDay}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stage Info */}
        {stageInfo && growDay >= 0 ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className={`p-2 rounded-lg bg-background/60 ${stageColor}`}>
              <StageIcon className="h-5 w-5" />
            </div>
            <div>
              <p className={`font-semibold capitalize ${stageColor}`}>
                {stageInfo.stageName}
              </p>
              <p className="text-xs text-muted-foreground">
                Day {stageInfo.dayInStage + 1} of {stageInfo.stageDuration}
              </p>
            </div>
          </div>
        ) : growDay < 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Before plant started</p>
            <p className="text-xs">{Math.abs(growDay)} days before start</p>
          </div>
        ) : null}
        
        {/* Tasks/Alerts for this day */}
        {alerts.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-amber-500" />
                TASKS FOR TODAY
              </h4>
              {alerts.map((alert, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
                >
                  <span className="text-lg">🏥</span>
                  <span className="text-sm text-amber-200">{alert.message}</span>
                </div>
              ))}
            </div>
          </>
        )}
        
        {/* Journal Events for this day */}
        {dayEvents.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <PenLine className="h-3.5 w-3.5 text-blue-500" />
                YOUR NOTES
              </h4>
              {dayEvents.map((event) => (
                <div 
                  key={event.id}
                  className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20"
                >
                  {event.title && (
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                  )}
                  {event.description && (
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {format(new Date(event.created_at), "HH:mm")}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
        
        {/* Add Note Section */}
        <Separator />
        {isAddingNote ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Write your note for this day..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[80px] text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveNote}
                disabled={isSaving || !noteText.trim()}
                className="flex-1"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                )}
                Save Note
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAddingNote(false);
                  setNoteText("");
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingNote(true)}
            className="w-full gap-2"
            disabled={growDay < 0}
          >
            <Plus className="h-4 w-4" />
            Add Note for Day {growDay >= 0 ? growDay : ''}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
