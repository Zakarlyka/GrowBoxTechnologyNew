import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Trash2, Loader2, Crown, Link2, Box } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(1, 'Назва обов\'язкова'),
  startDate: z.date(),
  strainId: z.string().optional(),
  deviceId: z.string().optional(),
  isMain: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface LibraryStrain {
  id: number;
  name: string;
  breeder: string | null;
}

interface Device {
  id: string;
  device_id: string;
  name: string;
}

interface EditPlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plant: {
    id: string;
    custom_name: string | null;
    start_date: string | null;
    strain_id?: number | null;
    device_id?: string | null;
    is_main?: boolean | null;
  };
  onPlantUpdated: () => void;
  onPlantDeleted: () => void;
}

export function EditPlantDialog({
  open,
  onOpenChange,
  plant,
  onPlantUpdated,
  onPlantDeleted,
}: EditPlantDialogProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [strains, setStrains] = useState<LibraryStrain[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoadingStrains, setIsLoadingStrains] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: plant.custom_name || '',
      startDate: plant.start_date ? new Date(plant.start_date) : new Date(),
      strainId: plant.strain_id ? String(plant.strain_id) : undefined,
      deviceId: plant.device_id || undefined,
      isMain: plant.is_main || false,
    },
  });

  // Fetch strains and devices when dialog opens
  useEffect(() => {
    if (open) {
      fetchStrains();
      fetchDevices();
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

  const fetchDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('devices')
        .select('id, device_id, name')
        .eq('user_id', userData.user.id)
        .order('name');

      if (error) throw error;
      setDevices((data as Device[]) || []);
    } catch (error: any) {
      console.error('Error fetching devices:', error);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  // Reset form when plant changes
  useEffect(() => {
    form.reset({
      name: plant.custom_name || '',
      startDate: plant.start_date ? new Date(plant.start_date) : new Date(),
      strainId: plant.strain_id ? String(plant.strain_id) : undefined,
      deviceId: plant.device_id || undefined,
      isMain: plant.is_main || false,
    });
  }, [plant, form]);

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // If setting as main, first unset other main plants on the same device
      if (data.isMain && data.deviceId) {
        await supabase
          .from('plants')
          .update({ is_main: false })
          .eq('user_id', userData.user.id)
          .eq('device_id', data.deviceId)
          .neq('id', plant.id);
      }

      const { error } = await supabase
        .from('plants')
        .update({
          custom_name: data.name,
          start_date: format(data.startDate, 'yyyy-MM-dd'),
          strain_id: data.strainId ? parseInt(data.strainId) : null,
          device_id: data.deviceId === 'none' ? null : data.deviceId,
          is_main: data.isMain,
        })
        .eq('id', plant.id);

      if (error) throw error;

      toast({
        title: 'Збережено',
        description: 'Інформацію про рослину оновлено',
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['plants-with-strains'] });
      queryClient.invalidateQueries({ queryKey: ['main-plant'] });
      queryClient.invalidateQueries({ queryKey: ['master-plants'] });

      onOpenChange(false);
      onPlantUpdated();
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', plant.id);

      if (error) throw error;

      toast({
        title: 'Видалено',
        description: 'Рослину було видалено',
      });

      queryClient.invalidateQueries({ queryKey: ['plants-with-strains'] });

      setShowDeleteConfirm(false);
      onOpenChange(false);
      onPlantDeleted();
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Редагувати рослину</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Назва рослини</Label>
              <Input
                id="edit-name"
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
              <Label className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Сорт з бібліотеки
              </Label>
              <Select
                value={form.watch('strainId') || 'none'}
                onValueChange={(value) => form.setValue('strainId', value === 'none' ? undefined : value)}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder={isLoadingStrains ? 'Завантаження...' : 'Оберіть сорт'} />
                </SelectTrigger>
                <SelectContent className="bg-background border-border max-h-[200px]">
                  <SelectItem value="none">Без сорту</SelectItem>
                  {strains.filter(strain => strain.id).map((strain) => (
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

            {/* Device Select - CRITICAL: Move plant to different GrowBox */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Box className="h-4 w-4" />
                GrowBox (пристрій)
              </Label>
              <Select
                value={form.watch('deviceId') || 'none'}
                onValueChange={(value) => form.setValue('deviceId', value === 'none' ? undefined : value)}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder={isLoadingDevices ? 'Завантаження...' : 'Оберіть пристрій'} />
                </SelectTrigger>
                <SelectContent className="bg-background border-border max-h-[200px]">
                  <SelectItem value="none">Без пристрою</SelectItem>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.device_id}>
                      <div className="flex items-center gap-2">
                        <Box className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{device.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Виберіть гроубокс, в якому росте рослина
              </p>
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
                <Label htmlFor="isMain" className="text-base flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  Основна рослина
                </Label>
                <p className="text-sm text-muted-foreground">
                  Клімат-контроль буде орієнтуватись на цю рослину
                </p>
              </div>
              <Switch
                id="isMain"
                checked={form.watch('isMain')}
                onCheckedChange={(checked) => form.setValue('isMain', checked)}
              />
            </div>

            {/* Delete Section */}
            <div className="pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="destructive"
                className="w-full gap-2"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
                Видалити рослину
              </Button>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Скасувати
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Зберегти
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити рослину?</AlertDialogTitle>
            <AlertDialogDescription>
              Ви впевнені, що хочете видалити "{plant.custom_name || 'цю рослину'}"? Цю дію неможливо скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
