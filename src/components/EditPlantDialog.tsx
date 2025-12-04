import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Trash2, Loader2 } from 'lucide-react';
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
});

type FormData = z.infer<typeof formSchema>;

interface EditPlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plant: {
    id: string;
    custom_name: string | null;
    start_date: string | null;
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
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: plant.custom_name || '',
      startDate: plant.start_date ? new Date(plant.start_date) : new Date(),
    },
  });

  // Reset form when plant changes
  useEffect(() => {
    form.reset({
      name: plant.custom_name || '',
      startDate: plant.start_date ? new Date(plant.start_date) : new Date(),
    });
  }, [plant, form]);

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('plants')
        .update({
          custom_name: data.name,
          start_date: format(data.startDate, 'yyyy-MM-dd'),
        })
        .eq('id', plant.id);

      if (error) throw error;

      toast({
        title: 'Збережено',
        description: 'Інформацію про рослину оновлено',
      });

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
        <DialogContent className="sm:max-w-[400px] bg-background border-border">
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
