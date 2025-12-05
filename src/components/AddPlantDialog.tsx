import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Leaf, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { PLANT_STAGES } from '@/hooks/usePlantData';

const formSchema = z.object({
  name: z.string().min(1, 'Назва обов\'язкова'),
  strainId: z.string().optional(),
  stage: z.string().default('seedling'),
  startDate: z.date().default(() => new Date()),
  isMain: z.boolean().default(true),
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
  deviceId: string;
  onPlantAdded: () => void;
  preSelectedStrain?: PreSelectedStrain;
}

export function AddPlantDialog({ open, onOpenChange, deviceId, onPlantAdded, preSelectedStrain }: AddPlantDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [strains, setStrains] = useState<LibraryStrain[]>([]);
  const [isLoadingStrains, setIsLoadingStrains] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: preSelectedStrain?.name || '',
      strainId: preSelectedStrain ? String(preSelectedStrain.id) : undefined,
      stage: 'seedling',
      startDate: new Date(),
      isMain: true,
    },
  });

  // Update form when preSelectedStrain changes
  useEffect(() => {
    if (preSelectedStrain) {
      form.setValue('name', preSelectedStrain.name);
      form.setValue('strainId', String(preSelectedStrain.id));
    }
  }, [preSelectedStrain, form]);

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

  const onSubmit = async (data: FormData) => {
    if (!user?.id) {
      toast({
        title: 'Помилка',
        description: 'Ви не авторизовані',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // If this will be the main plant, first unset any existing main plant for this device
      if (data.isMain) {
        await supabase
          .from('plants')
          .update({ is_main: false })
          .eq('device_id', deviceId)
          .eq('is_main', true);
      }

      // Insert the new plant
      const { error } = await supabase.from('plants').insert({
        device_id: deviceId,
        user_id: user.id,
        custom_name: data.name,
        strain_id: data.strainId ? parseInt(data.strainId) : null,
        current_stage: data.stage,
        start_date: format(data.startDate, 'yyyy-MM-dd'),
        is_main: data.isMain,
      });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Leaf className="h-5 w-5 text-accent" />
            Почати новий грув
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
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
      </DialogContent>
    </Dialog>
  );
}
