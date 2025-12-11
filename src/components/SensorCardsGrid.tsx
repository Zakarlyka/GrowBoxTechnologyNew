import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Thermometer, Droplets, Sprout, Sun, Moon } from 'lucide-react';
import { DraggableSensorCard } from './DraggableSensorCard';

interface SensorCardsGridProps {
  temperature: number | null;
  humidity: number | null;
  soilMoisture: number | null | undefined;
  lightMode: {
    isDay: boolean;
    dayHours: number;
    nightHours: number;
  } | null;
}

type SensorId = 'temperature' | 'humidity' | 'soil' | 'light';

const DEFAULT_ORDER: SensorId[] = ['temperature', 'humidity', 'soil', 'light'];
const STORAGE_KEY = 'dashboard-sensor-order';

export function SensorCardsGrid({ temperature, humidity, soilMoisture, lightMode }: SensorCardsGridProps) {
  const [sensorOrder, setSensorOrder] = useState<SensorId[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate that all sensors are present
        if (Array.isArray(parsed) && parsed.length === 4 && DEFAULT_ORDER.every(id => parsed.includes(id))) {
          return parsed;
        }
      } catch {
        // Invalid data, use default
      }
    }
    return DEFAULT_ORDER;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSensorOrder((items) => {
        const oldIndex = items.indexOf(active.id as SensorId);
        const newIndex = items.indexOf(over.id as SensorId);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

  const renderSensorCard = (id: SensorId) => {
    switch (id) {
      case 'temperature':
        return (
          <DraggableSensorCard key={id} id={id}>
            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 h-full">
              <div className="flex items-center space-x-2">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Температура</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {temperature ? `${temperature.toFixed(1)}°C` : '-- °C'}
              </span>
            </div>
          </DraggableSensorCard>
        );
      case 'humidity':
        return (
          <DraggableSensorCard key={id} id={id}>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 h-full">
              <div className="flex items-center space-x-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Вологість</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {humidity ? `${humidity.toFixed(0)}%` : '-- %'}
              </span>
            </div>
          </DraggableSensorCard>
        );
      case 'soil':
        return (
          <DraggableSensorCard key={id} id={id}>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30 h-full">
              <div className="flex items-center space-x-2">
                <Sprout className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Ґрунт</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                {soilMoisture !== null && soilMoisture !== undefined
                  ? `${soilMoisture.toFixed(0)}%` : '-- %'}
              </span>
            </div>
          </DraggableSensorCard>
        );
      case 'light':
        return (
          <DraggableSensorCard key={id} id={id}>
            <div className={`flex flex-col gap-1 p-3 rounded-lg border transition-colors h-full ${
              lightMode?.isDay ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-blue-500/10 border-blue-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {lightMode?.isDay ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-blue-500" />}
                  <span className="text-sm text-muted-foreground">Світло</span>
                </div>
                {lightMode && (
                  <span className="text-lg font-semibold text-foreground">
                    {lightMode.isDay ? '☀️ День' : '🌙 Ніч'}
                  </span>
                )}
              </div>
              {lightMode && (
                <div className="text-xs text-muted-foreground">
                  День {lightMode.dayHours}год / Ніч {lightMode.nightHours}год
                </div>
              )}
            </div>
          </DraggableSensorCard>
        );
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sensorOrder} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {sensorOrder.map(renderSensorCard)}
        </div>
      </SortableContext>
    </DndContext>
  );
}
