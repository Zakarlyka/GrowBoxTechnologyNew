import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface StrainFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strain?: {
    id: string;
    name: string;
    type: string;
    description: string | null;
    settings_by_phase: any;
    fertilizer_schedule: any;
    info_url: string | null;
    seed_to_harvest_days: number | null;
    flowering_days: number | null;
  } | null;
  onSuccess: () => void;
}

export function StrainForm({ open, onOpenChange, strain, onSuccess }: StrainFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('photoperiod');
  const [description, setDescription] = useState('');
  const [settingsByPhase, setSettingsByPhase] = useState('');
  const [fertilizerSchedule, setFertilizerSchedule] = useState('');
  const [infoUrl, setInfoUrl] = useState('');
  const [seedToHarvest, setSeedToHarvest] = useState('');
  const [floweringDays, setFloweringDays] = useState('');

  useEffect(() => {
    if (strain) {
      setName(strain.name);
      setType(strain.type);
      setDescription(strain.description || '');
      setSettingsByPhase(
        strain.settings_by_phase ? JSON.stringify(strain.settings_by_phase, null, 2) : ''
      );
      setFertilizerSchedule(
        strain.fertilizer_schedule ? JSON.stringify(strain.fertilizer_schedule, null, 2) : ''
      );
      setInfoUrl(strain.info_url || '');
      setSeedToHarvest(strain.seed_to_harvest_days?.toString() || '');
      setFloweringDays(strain.flowering_days?.toString() || '');
    } else {
      setName('');
      setType('photoperiod');
      setDescription('');
      setSettingsByPhase('');
      setFertilizerSchedule('');
      setInfoUrl('');
      setSeedToHarvest('');
      setFloweringDays('');
    }
  }, [strain, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Валідація JSON
      let settingsJson = null;
      let fertilizerJson = null;

      if (settingsByPhase.trim()) {
        try {
          settingsJson = JSON.parse(settingsByPhase);
        } catch {
          toast({
            title: 'Помилка',
            description: 'Невалідний JSON в полі "Налаштування по фазах"',
            variant: 'destructive',
          });
          return;
        }
      }

      if (fertilizerSchedule.trim()) {
        try {
          fertilizerJson = JSON.parse(fertilizerSchedule);
        } catch {
          toast({
            title: 'Помилка',
            description: 'Невалідний JSON в полі "Графік удобрення"',
            variant: 'destructive',
          });
          return;
        }
      }

      const data = {
        name,
        type,
        description: description.trim() || null,
        settings_by_phase: settingsJson,
        fertilizer_schedule: fertilizerJson,
        info_url: infoUrl.trim() || null,
        seed_to_harvest_days: seedToHarvest ? parseInt(seedToHarvest) : null,
        flowering_days: floweringDays ? parseInt(floweringDays) : null,
      };

      if (strain) {
        // Оновлення
        const { error } = await supabase
          .from('strains')
          .update(data)
          .eq('id', strain.id);

        if (error) throw error;

        toast({
          title: 'Успіх',
          description: 'Сорт оновлено',
        });
      } else {
        // Створення
        const { error } = await supabase
          .from('strains')
          .insert(data);

        if (error) throw error;

        toast({
          title: 'Успіх',
          description: 'Сорт додано',
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {strain ? 'Редагувати Сорт' : 'Додати Сорт'}
          </DialogTitle>
          <DialogDescription>
            Заповніть інформацію про сорт для "Помічника"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Назва *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Northern Lights"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Тип *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="autoflower">Autoflower</SelectItem>
                <SelectItem value="photoperiod">Photoperiod</SelectItem>
                <SelectItem value="clone">Clone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Опис</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опис сорту..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="info_url">Посилання на Info (Seedfinder)</Label>
            <Input
              id="info_url"
              value={infoUrl}
              onChange={(e) => setInfoUrl(e.target.value)}
              placeholder="https://en.seedfinder.eu/..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seed_to_harvest_days">Дні (Авто)</Label>
              <Input
                id="seed_to_harvest_days"
                type="number"
                value={seedToHarvest}
                onChange={(e) => setSeedToHarvest(e.target.value)}
                placeholder="Напр. 70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flowering_days">Дні Цвітіння (Фото)</Label>
              <Input
                id="flowering_days"
                type="number"
                value={floweringDays}
                onChange={(e) => setFloweringDays(e.target.value)}
                placeholder="Напр. 55"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings">Налаштування по фазах (JSON)</Label>
            <Textarea
              id="settings"
              value={settingsByPhase}
              onChange={(e) => setSettingsByPhase(e.target.value)}
              placeholder={`{\n  "seedling": { "target_temp": 25, "target_hum": 70, "light_hours": 18 },\n  "vegetative": { "target_temp": 24, "target_hum": 60, "light_hours": 18 },\n  "flowering": { "target_temp": 22, "target_hum": 45, "light_hours": 12 }\n}`}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fertilizer">Графік удобрення (JSON, опційно)</Label>
            <Textarea
              id="fertilizer"
              value={fertilizerSchedule}
              onChange={(e) => setFertilizerSchedule(e.target.value)}
              placeholder={`{\n  "week_1": { "grow": 2, "bloom": 0 },\n  "week_2": { "grow": 3, "bloom": 0 }\n}`}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Скасувати
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Збереження...' : strain ? 'Оновити' : 'Додати'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
