import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Leaf, Loader2, PackageX, Plug, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ImageUpload } from '@/components/ui/image-upload';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDevices } from '@/hooks/useDevices';
import { toast } from '@/hooks/use-toast';
import { PLANT_STAGES } from '@/hooks/usePlantData';

const formSchema = z.object({
  name: z.string().min(1, 'Назва обов\'язкова'),
  strainId: z.string().optional(),
  stage: z.string().default('seedling'),
  startDate: z.date().default(() => new Date()),
  isMain: z.boolean().default(true),
  deviceId: z.string().min(1, 'Оберіть пристрій'),
  photoUrl: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface LibraryStrain {
  id: number;
  name: string;
  breeder: string | null;
}

interface PreSelectedStrain {
  id: number;
  name: string;
}

interface AddPlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId?: string;
  onPlantAdded: () => void;
  preSelectedStrain?: PreSelectedStrain;
}

export function AddPlantDialog({ open, onOpenChange, deviceId: initialDeviceId, onPlantAdded, preSelectedStrain }: AddPlantDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { devices, loading: devicesLoading, fetchDevices } = useDevices();
  
  const [strains, setStrains] = useState<LibraryStrain[]>([]);
  const [isLoadingStrains, setIsLoadingStrains] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: preSelectedStrain?.name || '',
      strainId: preSelectedStrain ? String(preSelectedStrain.id) : undefined,
      stage: 'seedling',
      startDate: new Date(),
      isMain: true,
      deviceId: initialDeviceId || '',
      photoUrl: '',
    },
  });

  // Update form when preSelectedStrain changes
  useEffect(() => {
    if (preSelectedStrain) {
      form.setValue('name', preSelectedStrain.name);
      form.setValue('strainId', String(preSelectedStrain.id));
    }
  }, [preSelectedStrain, form]);

  // Set initial device ID or auto-select first device
  useEffect(() => {
    if (initialDeviceId) {
      form.setValue('deviceId', initialDeviceId);
    } else if (devices.length > 0 && !form.watch('deviceId')) {
      form.setValue('deviceId', devices[0].device_id);
    }
  }, [initialDeviceId, devices, form]);

  // Fetch strains when dialog opens
  useEffect(() => {
    if (open) {
      fetchStrains();
    }
  }, [open]);

  const fetchStrains = async () => {
    setIsLoadingStrains(true);
    try {
      const { data, error } = await supabase
        .from('library_strains')
        .select('id, name, breeder')
        .order('name');

      if (error) throw error;
      setStrains((data as LibraryStrain[]) || []);
    } catch (error: any) {
      console.error('Error fetching strains:', error);
    } finally {
      setIsLoadingStrains(false);
    }
  };

  const createDemoDevice = async () => {
    if (!user?.id) {
      toast({
        title: 'Помилка',
        description: 'Ви не авторизовані',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingDemo(true);
    try {
      const demoDeviceId = `demo-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('devices')
        .insert({
          device_id: demoDeviceId,
          user_id: user.id,
          name: 'Demo GrowBox',
          type: 'grow_box',
          status: 'offline',
          settings: {
            is_demo: true,
            target_temp: 24,
            target_hum: 60,
            temp_hyst: 2,
            hum_hyst: 5,
            seasonal_mode: 1,
            climate_mode: 1,
            light_mode: 1,
            light_start_h: 6,
            light_start_m: 0,
            light_end_h: 22,
            light_end_m: 0,
            pump_mode: 0,
            soil_min: 40,
            soil_max: 70,
            vent_mode: 1,
            vent_duration_sec: 300,
            vent_interval_sec: 1800,
          },
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✨ Demo пристрій створено!',
        description: 'Тепер ви можете почати грув',
      });

      // Refresh devices list
      await fetchDevices();
      
      // Auto-select the new demo device
      if (data) {
        form.setValue('deviceId', data.device_id);
      }

    } catch (error: any) {
      console.error('Error creating demo device:', error);
      toast({
        title: 'Помилка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreatingDemo(false);
    }
  };

  const handleConnectDevice = () => {
    onOpenChange(false);
    navigate('/devices');
  };

  const onSubmit = async (data: FormData) => {
    if (!user?.id) {
      toast({
        title: 'Помилка',
        description: 'Ви не авторизовані',
        variant: 'destructive',
      });
      return;
    }

    // Debug: Log the exact photo URL being saved
    const finalPhotoUrl = data.photoUrl?.trim() || null;
    console.log('[AddPlantDialog] Submitting with photo_url:', finalPhotoUrl);
    console.log('[AddPlantDialog] Full form data:', data);

    setIsSaving(true);
    try {
      // If this will be the main plant, first unset any existing main plant for this device
      if (data.isMain) {
        await supabase
          .from('plants')
          .update({ is_main: false })
          .eq('device_id', data.deviceId)
          .eq('is_main', true);
      }

      // Insert the new plant with explicit photo_url
      const insertPayload = {
        device_id: data.deviceId,
        user_id: user.id,
        custom_name: data.name,
        strain_id: data.strainId ? parseInt(data.strainId) : null,
        current_stage: data.stage,
        start_date: format(data.startDate, 'yyyy-MM-dd'),
        is_main: data.isMain,
        photo_url: finalPhotoUrl,
      };
      console.log('[AddPlantDialog] Insert payload:', insertPayload);
      
      const { error } = await supabase.from('plants').insert(insertPayload);

      if (error) throw error;

      toast({
        title: '🌱 Успішно посаджено!',
        description: `"${data.name}" готова до вирощування`,
      });

      // Invalidate all plant-related queries to force refresh
      await queryClient.invalidateQueries({ queryKey: ['main-plant'] });
      await queryClient.invalidateQueries({ queryKey: ['plants'] });
      
      form.reset();
      onOpenChange(false);
      onPlantAdded();
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasDevices = devices.length > 0;
  const isLoading = devicesLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Leaf className="h-5 w-5 text-accent" />
            Почати новий грув
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Завантаження...</p>
          </div>
        ) : !hasDevices ? (
          /* Empty State - No Devices */
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <PackageX className="h-10 w-10 text-muted-foreground" />
            </div>
            
            <h3 className="text-lg font-semibold text-foreground mb-2">
              GrowBox не знайдено
            </h3>
            
            <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
              Щоб почати вирощування, вам потрібен підключений пристрій або Demo-режим
            </p>

            <div className="flex flex-col gap-3 w-full max-w-[250px]">
              <Button
                variant="outline"
                onClick={handleConnectDevice}
                className="w-full gap-2"
              >
                <Plug className="h-4 w-4" />
                Підключити пристрій
              </Button>
              
              <Button
                onClick={createDemoDevice}
                disabled={isCreatingDemo}
                className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
              >
                {isCreatingDemo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isCreatingDemo ? 'Створення...' : 'Створити Demo та продовжити'}
              </Button>
            </div>
          </div>
        ) : (
          /* Standard Form - Has Devices */
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* Device Select */}
            <div className="space-y-2">
              <Label>Пристрій</Label>
              <Select
                value={form.watch('deviceId') || ''}
                onValueChange={(value) => form.setValue('deviceId', value)}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Оберіть пристрій" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.device_id}>
                      <div className="flex items-center gap-2">
                        <span>{device.name}</span>
                        {(device as any).settings?.is_demo && (
                          <span className="text-xs text-amber-500">(Demo)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.deviceId && (
                <p className="text-sm text-destructive">{form.formState.errors.deviceId.message}</p>
              )}
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">Назва рослини</Label>
              <Input
                id="name"
                placeholder="Наприклад: My Auto #1"
                {...form.register('name')}
                className="bg-background/50"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Strain Select */}
            <div className="space-y-2">
              <Label>Сорт (опціонально)</Label>
              <Select
                value={form.watch('strainId') || ''}
                onValueChange={(value) => form.setValue('strainId', value || undefined)}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder={isLoadingStrains ? 'Завантаження...' : 'Оберіть сорт'} />
                </SelectTrigger>
                <SelectContent className="bg-background border-border max-h-[200px]">
                  {strains.map((strain) => (
                    <SelectItem key={strain.id} value={String(strain.id)}>
                      <div className="flex flex-col">
                        <span>{strain.name}</span>
                        {strain.breeder && (
                          <span className="text-xs text-muted-foreground">{strain.breeder}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stage Select */}
            <div className="space-y-2">
              <Label>Стадія росту</Label>
              <Select
                value={form.watch('stage')}
                onValueChange={(value) => form.setValue('stage', value)}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {PLANT_STAGES.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Дата посадки</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-background/50',
                      !form.watch('startDate') && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('startDate') ? (
                      format(form.watch('startDate'), 'PPP')
                    ) : (
                      <span>Оберіть дату</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('startDate')}
                    onSelect={(date) => date && form.setValue('startDate', date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Фото рослини (опціонально)</Label>
              <ImageUpload
                value={form.watch('photoUrl')}
                onChange={(url) => {
                  console.log('[AddPlantDialog] Image uploaded, new URL:', url);
                  form.setValue('photoUrl', url || '', { shouldDirty: true, shouldTouch: true });
                }}
              />
              {form.watch('photoUrl') && (
                <p className="text-xs text-muted-foreground truncate">
                  ✅ URL: {form.watch('photoUrl')?.substring(0, 50)}...
                </p>
              )}
            </div>

            {/* Main Plant Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isMain" className="text-base">
                  Основна рослина
                </Label>
                <p className="text-sm text-muted-foreground">
                  Сенсори пристрою відстежують цю рослину
                </p>
              </div>
              <Switch
                id="isMain"
                checked={form.watch('isMain')}
                onCheckedChange={(checked) => form.setValue('isMain', checked)}
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Скасувати
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSaving ? 'Збереження...' : '🌱 Посадити'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
