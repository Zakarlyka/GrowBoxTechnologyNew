import * as React from "react";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, DayProps } from "react-day-picker";
import { format, addDays, differenceInDays, startOfMonth, endOfMonth, isSameDay, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { PlantWithStrain, GrowingParams, GrowingStage, TimelineAlert } from "@/hooks/usePlantsWithStrains";

interface PlantTimelineCalendarProps {
  plant: PlantWithStrain;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  journalEvents?: { created_at: string; event_type: string }[];
}

interface DayData {
  growDay: number;
  stageName: string;
  stageColor: string;
  hasEvent: boolean;
  alerts: TimelineAlert[];
  isHarvestDay?: boolean;
}

// Stage colors for calendar backgrounds
const stageColorMap: Record<string, string> = {
  seedling: "bg-lime-500/20 hover:bg-lime-500/30",
  germination: "bg-lime-500/20 hover:bg-lime-500/30",
  vegetation: "bg-emerald-500/20 hover:bg-emerald-500/30",
  veg: "bg-emerald-500/20 hover:bg-emerald-500/30",
  "pre-flowering": "bg-pink-500/20 hover:bg-pink-500/30",
  preflower: "bg-pink-500/20 hover:bg-pink-500/30",
  flowering: "bg-purple-500/20 hover:bg-purple-500/30",
  bloom: "bg-purple-500/20 hover:bg-purple-500/30",
  flushing: "bg-sky-500/20 hover:bg-sky-500/30",
  flush: "bg-sky-500/20 hover:bg-sky-500/30",
  ripening: "bg-amber-500/20 hover:bg-amber-500/30",
  drying: "bg-amber-500/20 hover:bg-amber-500/30",
  harvest: "bg-amber-500/20 hover:bg-amber-500/30",
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

function getTotalLifecycleDays(stages: GrowingStage[]): number {
  if (!stages || stages.length === 0) return 0;
  return stages.reduce((total, stage) => total + getStageDays(stage), 0);
}

function getStageForDay(growDay: number, stages: GrowingStage[], totalDays: number): { stageName: string; stageColor: string } | null {
  if (!stages || stages.length === 0) {
    return { stageName: "unknown", stageColor: "bg-muted/20" };
  }
  
  // Past harvest - return null to indicate no stage
  if (growDay >= totalDays) {
    return null;
  }
  
  let cumulativeDays = 0;
  for (const stage of stages) {
    const stageDays = getStageDays(stage);
    if (growDay < cumulativeDays + stageDays) {
      const name = stage.name.toLowerCase();
      return {
        stageName: stage.name,
        stageColor: stageColorMap[name] || "bg-muted/20",
      };
    }
    cumulativeDays += stageDays;
  }
  
  return null;
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

export function PlantTimelineCalendar({
  plant,
  selectedDate,
  onSelectDate,
  journalEvents = [],
}: PlantTimelineCalendarProps) {
  const plantStartDate = plant.start_date ? new Date(plant.start_date) : new Date();
  const stages = plant.growing_params?.stages || [];
  const timelineAlerts = plant.growing_params?.timeline_alerts || [];
  const totalLifecycleDays = getTotalLifecycleDays(stages);
  const harvestDay = totalLifecycleDays - 1; // Last day is harvest day (0-indexed)
  
  // Build day data map for visible month
  const getDayData = (date: Date): DayData | null => {
    const growDay = differenceInDays(date, plantStartDate);
    if (growDay < 0) return null; // Before plant started
    
    // After harvest - return null (no stage data)
    if (growDay > harvestDay) return null;
    
    // Check if it's harvest day
    const isHarvestDay = growDay === harvestDay;
    
    const stageData = getStageForDay(growDay, stages, totalLifecycleDays);
    const alerts = getAlertsForDay(growDay, stages, timelineAlerts);
    
    // Check if there's a journal event on this date
    const dateStr = format(date, 'yyyy-MM-dd');
    const hasEvent = journalEvents.some(event => 
      event.created_at?.startsWith(dateStr)
    );
    
    return {
      growDay,
      stageName: stageData?.stageName || "",
      stageColor: stageData?.stageColor || "",
      hasEvent,
      alerts,
      isHarvestDay,
    };
  };

  // Custom day render component
  const CustomDay = (props: DayProps) => {
    const { date, ...dayProps } = props;
    const dayData = getDayData(date);
    const isSelected = isSameDay(date, selectedDate);
    const isToday = isSameDay(date, new Date());
    const isAfterHarvest = !dayData && differenceInDays(date, plantStartDate) > harvestDay;
    const isBeforeStart = differenceInDays(date, plantStartDate) < 0;
    
    return (
      <button
        {...dayProps}
        onClick={() => onSelectDate(date)}
        className={cn(
          "relative h-12 w-12 flex flex-col items-center justify-center rounded-lg transition-all text-sm p-0 m-0.5",
          // Harvest day special styling
          dayData?.isHarvestDay 
            ? "bg-gradient-to-br from-amber-500/30 to-orange-500/30 hover:from-amber-500/40 hover:to-orange-500/40 border border-amber-500/30"
            : dayData?.stageColor || "bg-muted/10 hover:bg-muted/20",
          isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          isToday && !isSelected && "ring-2 ring-accent ring-offset-1 ring-offset-background"
        )}
      >
        {/* Day number */}
        <span className={cn(
          "font-medium text-xs",
          isSelected ? "text-foreground" : "text-muted-foreground"
        )}>
          {format(date, 'd')}
        </span>
        
        {/* Harvest Day Icon */}
        {dayData?.isHarvestDay ? (
          <span className="text-[10px]">🏁</span>
        ) : dayData && dayData.growDay >= 0 ? (
          /* Grow Day (only shown if within lifecycle) */
          <span className={cn(
            "text-[10px] font-bold",
            isSelected ? "text-primary" : "text-foreground/70"
          )}>
            D{dayData.growDay}
          </span>
        ) : null}
        
        {/* Event/Alert Indicators */}
        <div className="absolute bottom-0.5 flex gap-0.5">
          {dayData?.hasEvent && (
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          )}
          {dayData?.alerts && dayData.alerts.length > 0 && (
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="w-full">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onSelectDate(date)}
        defaultMonth={selectedDate}
        showOutsideDays={false}
        className="p-2 w-full"
        classNames={{
          months: "flex flex-col w-full",
          month: "space-y-3 w-full",
          caption: "flex justify-center pt-1 relative items-center mb-2",
          caption_label: "text-base font-semibold text-foreground",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "h-8 w-8 bg-transparent p-0 hover:bg-muted"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse",
          head_row: "flex w-full justify-around mb-1",
          head_cell: "text-muted-foreground font-medium text-xs w-12 text-center",
          row: "flex w-full justify-around",
          cell: "p-0",
          day: "p-0",
          day_outside: "opacity-30",
          day_disabled: "opacity-30 cursor-not-allowed",
        }}
        components={{
          IconLeft: () => <ChevronLeft className="h-4 w-4" />,
          IconRight: () => <ChevronRight className="h-4 w-4" />,
          Day: CustomDay,
        }}
      />
      
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-3 px-2 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-lime-500/30" />
          <span className="text-muted-foreground">Seedling</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-emerald-500/30" />
          <span className="text-muted-foreground">Veg</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-purple-500/30" />
          <span className="text-muted-foreground">Flower</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-sky-500/30" />
          <span className="text-muted-foreground">Flush</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-gradient-to-br from-amber-500/40 to-orange-500/40" />
          <span className="text-muted-foreground">🏁 Harvest</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Note</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">Task</span>
        </div>
      </div>
    </div>
  );
}
