import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PlantData {
  id: string;
  custom_name: string | null;
  photo_url: string | null;
  start_date: string | null;
  current_stage: string | null;
  is_main: boolean | null;
  strain_id: number | null;
  strain?: {
    id: number;
    name: string;
    presets: {
      veg?: { temp?: number; hum?: number; light_h?: number };
      bloom?: { temp?: number; hum?: number; light_h?: number };
      flush?: { temp?: number; hum?: number; light_h?: number };
      seedling?: { temp?: number; hum?: number; light_h?: number };
      drying?: { temp?: number; hum?: number; light_h?: number };
    } | null;
  } | null;
}

export type PlantStage = 'seedling' | 'vegetation' | 'flowering' | 'flushing' | 'drying';

export const PLANT_STAGES: { value: PlantStage; label: string }[] = [
  { value: 'seedling', label: 'Проростання' },
  { value: 'vegetation', label: 'Вегетація' },
  { value: 'flowering', label: 'Цвітіння' },
  { value: 'flushing', label: 'Промивка' },
  { value: 'drying', label: 'Сушка' },
];

export function usePlantData(deviceId: string | null) {
  const queryClient = useQueryClient();

  const { data: plant, isLoading, refetch } = useQuery({
    queryKey: ['main-plant', deviceId],
    queryFn: async (): Promise<PlantData | null> => {
      if (!deviceId) return null;

      // First get the device to find its device_id (text)
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('device_id')
        .eq('id', deviceId)
        .maybeSingle();

      if (deviceError || !deviceData) return null;

      const { data, error } = await supabase
        .from('plants')
        .select(`
          id,
          custom_name,
          photo_url,
          start_date,
          current_stage,
          is_main,
          strain_id,
          library_strains (
            id,
            name,
            presets
          )
        `)
        .eq('device_id', deviceData.device_id)
        .eq('is_main', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching plant:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        custom_name: data.custom_name,
        photo_url: data.photo_url,
        start_date: data.start_date,
        current_stage: data.current_stage,
        is_main: data.is_main,
        strain_id: data.strain_id,
        strain: data.library_strains ? {
          id: (data.library_strains as any).id,
          name: (data.library_strains as any).name,
          presets: (data.library_strains as any).presets,
        } : null,
      };
    },
    enabled: !!deviceId,
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ plantId, stage }: { plantId: string; stage: PlantStage }) => {
      const { error } = await supabase
        .from('plants')
        .update({ current_stage: stage })
        .eq('id', plantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['main-plant', deviceId] });
      toast({
        title: 'Успіх',
        description: 'Стадію рослини оновлено',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Помилка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateStage = (stage: PlantStage) => {
    if (plant?.id) {
      updateStageMutation.mutate({ plantId: plant.id, stage });
    }
  };

  return {
    plant,
    isLoading,
    updateStage,
    isUpdatingStage: updateStageMutation.isPending,
    refetch,
  };
}

// Helper to get presets for a specific stage
export function getPresetsForStage(
  presets: PlantData['strain']['presets'] | null | undefined,
  stage: string | null
): { temp?: number; hum?: number; light_h?: number } | null {
  if (!presets || !stage) return null;

  const stageMap: Record<string, keyof NonNullable<PlantData['strain']['presets']>> = {
    seedling: 'seedling',
    vegetation: 'veg',
    flowering: 'bloom',
    flushing: 'flush',
    drying: 'drying',
  };

  const presetKey = stageMap[stage];
  if (!presetKey) return null;

  return presets[presetKey] || null;
}

// Calculate days since start date
export function calculatePlantAge(startDate: string | null): number | null {
  if (!startDate) return null;
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays : null;
}
