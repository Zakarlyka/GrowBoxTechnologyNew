import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Clock, Calendar, Trash2, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Device {
  id: string;
  name: string;
  device_id: string;
}

interface Schedule {
  id: string;
  device_id: string;
  control_name: string;
  schedule_type: string; // Changed from union type to string
  start_time?: string;
  end_time?: string;
  interval_minutes?: number;
  days_of_week?: number[];
  is_active: boolean;
  created_at: string;
}

interface DeviceSchedulesProps {
  devices: Device[];
}

export function DeviceSchedules({ devices }: DeviceSchedulesProps) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [addScheduleOpen, setAddScheduleOpen] = useState(false);
  const [editScheduleOpen, setEditScheduleOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [newSchedule, setNewSchedule] = useState({
    device_id: '',
    control_name: 'light_system',
    schedule_type: 'timer',
    start_time: '08:00',
    end_time: '20:00',
    interval_minutes: 60,
    days_of_week: [1, 2, 3, 4, 5, 6, 0] as number[],
    is_active: true,
  });

  const controls = [
    { value: 'light_system', label: 'Система освітлення' },
    { value: 'water_pump', label: 'Водяна помпа' },
    { value: 'ventilation', label: 'Вентиляція' },
    { value: 'heater', label: 'Обігрівач' },
  ];

  const days = [
    { value: 1, label: 'Пн', short: 'Пн' },
    { value: 2, label: 'Вт', short: 'Вт' },
    { value: 3, label: 'Ср', short: 'Ср' },
    { value: 4, label: 'Чт', short: 'Чт' },
    { value: 5, label: 'Пт', short: 'Пт' },
    { value: 6, label: 'Сб', short: 'Сб' },
    { value: 0, label: 'Нд', short: 'Нд' },
  ];

  const scheduleTypes = [
    { value: 'timer', label: 'Таймер (час старту/зупинки)' },
    { value: 'daily', label: 'Щодня в певний час' },
    { value: 'interval', label: 'Інтервал (кожні N хвилин)' },
  ];

  useEffect(() => {
    if (user) {
      fetchSchedules();
    }
  }, [user]);

  const fetchSchedules = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('device_schedules')
        .select(`
          *,
          devices!inner(name, user_id)
        `)
        .eq('devices.user_id', user.id);

      if (!error && data) {
        setSchedules(data as any);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
    }
  };

  const addSchedule = async () => {
    if (!user || !newSchedule.device_id) return;

    try {
      const scheduleData = {
        device_id: newSchedule.device_id,
        control_name: newSchedule.control_name,
        schedule_type: newSchedule.schedule_type,
        is_active: newSchedule.is_active,
        ...(newSchedule.schedule_type === 'timer' && {
          start_time: newSchedule.start_time,
          end_time: newSchedule.end_time,
        }),
        ...(newSchedule.schedule_type === 'daily' && {
          start_time: newSchedule.start_time,
          days_of_week: newSchedule.days_of_week,
        }),
        ...(newSchedule.schedule_type === 'interval' && {
          interval_minutes: newSchedule.interval_minutes,
        }),
      };

      const { error } = await (supabase as any)
        .from('device_schedules')
        .insert(scheduleData);

      if (error) {
        toast({
          title: "Помилка",
          description: "Не вдалося створити розклад",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Успіх",
        description: "Розклад створено",
      });

      setAddScheduleOpen(false);
      resetForm();
      fetchSchedules();
    } catch (err) {
      console.error('Error adding schedule:', err);
    }
  };

  const updateSchedule = async () => {
    if (!selectedSchedule) return;

    try {
      const scheduleData = {
        control_name: newSchedule.control_name,
        schedule_type: newSchedule.schedule_type,
        is_active: newSchedule.is_active,
        start_time: newSchedule.schedule_type === 'interval' ? null : newSchedule.start_time,
        end_time: newSchedule.schedule_type === 'timer' ? newSchedule.end_time : null,
        days_of_week: newSchedule.schedule_type === 'daily' ? newSchedule.days_of_week : null,
        interval_minutes: newSchedule.schedule_type === 'interval' ? newSchedule.interval_minutes : null,
      };

      const { error } = await (supabase as any)
        .from('device_schedules')
        .update(scheduleData)
        .eq('id', selectedSchedule.id);

      if (error) {
        toast({
          title: "Помилка",
          description: "Не вдалося оновити розклад",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Успіх",
        description: "Розклад оновлено",
      });

      setEditScheduleOpen(false);
      setSelectedSchedule(null);
      fetchSchedules();
    } catch (err) {
      console.error('Error updating schedule:', err);
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from('device_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) {
        toast({
          title: "Помилка",
          description: "Не вдалося видалити розклад",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Успіх",
        description: "Розклад видалено",
      });
      fetchSchedules();
    } catch (err) {
      console.error('Error deleting schedule:', err);
    }
  };

  const toggleSchedule = async (schedule: Schedule) => {
    try {
      const { error } = await (supabase as any)
        .from('device_schedules')
        .update({ is_active: !schedule.is_active })
        .eq('id', schedule.id);

      if (error) {
        toast({
          title: "Помилка",
          description: "Не вдалося змінити статус розкладу",
          variant: "destructive",
        });
        return;
      }

      fetchSchedules();
    } catch (err) {
      console.error('Error toggling schedule:', err);
    }
  };

  const startEdit = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setNewSchedule({
      device_id: schedule.device_id,
      control_name: schedule.control_name,
      schedule_type: schedule.schedule_type,
      start_time: schedule.start_time || '08:00',
      end_time: schedule.end_time || '20:00',
      interval_minutes: schedule.interval_minutes || 60,
      days_of_week: schedule.days_of_week || [1, 2, 3, 4, 5, 6, 0],
      is_active: schedule.is_active,
    });
    setEditScheduleOpen(true);
  };

  const resetForm = () => {
    setNewSchedule({
      device_id: '',
      control_name: 'light_system',
      schedule_type: 'timer',
      start_time: '08:00',
      end_time: '20:00',
      interval_minutes: 60,
      days_of_week: [1, 2, 3, 4, 5, 6, 0],
      is_active: true,
    });
  };

  const toggleDay = (dayValue: number) => {
    setNewSchedule(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(dayValue)
        ? prev.days_of_week.filter(d => d !== dayValue)
        : [...prev.days_of_week, dayValue]
    }));
  };

  const getDeviceName = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device?.name || 'Невідомий пристрій';
  };

  const getControlLabel = (controlName: string) => {
    const control = controls.find(c => c.value === controlName);
    return control?.label || controlName;
  };

  const getScheduleDescription = (schedule: Schedule) => {
    switch (schedule.schedule_type) {
      case 'timer':
        return `${schedule.start_time} - ${schedule.end_time}`;
      case 'daily':
        const selectedDays = schedule.days_of_week?.map(d => days.find(day => day.value === d)?.short).join(', ') || '';
        return `${schedule.start_time}, ${selectedDays}`;
      case 'interval':
        return `Кожні ${schedule.interval_minutes} хв.`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Розклад пристроїв</h2>
          <p className="text-muted-foreground">Автоматичне керування пристроями за розкладом</p>
        </div>
        
        <Dialog open={addScheduleOpen} onOpenChange={setAddScheduleOpen}>
          <DialogTrigger asChild>
            <Button disabled={devices.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Створити розклад
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Створити розклад</DialogTitle>
              <DialogDescription>Налаштуйте автоматичне керування пристроєм</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Пристрій</Label>
                <Select value={newSchedule.device_id} onValueChange={(value) => setNewSchedule(prev => ({ ...prev, device_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Виберіть пристрій" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Керування</Label>
                <Select value={newSchedule.control_name} onValueChange={(value) => setNewSchedule(prev => ({ ...prev, control_name: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {controls.map((control) => (
                      <SelectItem key={control.value} value={control.value}>
                        {control.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Тип розкладу</Label>
                <Select value={newSchedule.schedule_type} onValueChange={(value: string) => setNewSchedule(prev => ({ ...prev, schedule_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scheduleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newSchedule.schedule_type === 'timer' && (
                <>
                  <div>
                    <Label>Час початку</Label>
                    <Input
                      type="time"
                      value={newSchedule.start_time}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Час закінчення</Label>
                    <Input
                      type="time"
                      value={newSchedule.end_time}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </>
              )}

              {newSchedule.schedule_type === 'daily' && (
                <>
                  <div>
                    <Label>Час запуску</Label>
                    <Input
                      type="time"
                      value={newSchedule.start_time}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Дні тижня</Label>
                    <div className="flex gap-1 mt-2">
                      {days.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={newSchedule.days_of_week.includes(day.value) ? "default" : "outline"}
                          size="sm"
                          className="w-10 h-10 p-0"
                          onClick={() => toggleDay(day.value)}
                        >
                          {day.short}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {newSchedule.schedule_type === 'interval' && (
                <div>
                  <Label>Інтервал (хвилини)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newSchedule.interval_minutes}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, interval_minutes: parseInt(e.target.value) || 60 }))}
                  />
                </div>
              )}

              <Button onClick={addSchedule} className="w-full" disabled={!newSchedule.device_id}>
                Створити розклад
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {devices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Немає пристроїв</h3>
            <p className="text-muted-foreground text-center">
              Додайте пристрої для створення розкладів
            </p>
          </CardContent>
        </Card>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Немає розкладів</h3>
            <p className="text-muted-foreground text-center mb-4">
              Створіть перший розклад для автоматичного керування
            </p>
            <Button onClick={() => setAddScheduleOpen(true)}>
              Створити розклад
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="transition-all hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      {getDeviceName(schedule.device_id)} - {getControlLabel(schedule.control_name)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getScheduleDescription(schedule)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={schedule.is_active}
                      onCheckedChange={() => toggleSchedule(schedule)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(schedule)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Видалити розклад?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ця дія незворотна. Розклад буде видалено назавжди.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Скасувати</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteSchedule(schedule.id)}>
                            Видалити
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog - Similar to Add Dialog but for editing */}
      <Dialog open={editScheduleOpen} onOpenChange={setEditScheduleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редагувати розклад</DialogTitle>
            <DialogDescription>Змініть налаштування розкладу</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Керування</Label>
              <Select value={newSchedule.control_name} onValueChange={(value) => setNewSchedule(prev => ({ ...prev, control_name: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {controls.map((control) => (
                    <SelectItem key={control.value} value={control.value}>
                      {control.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Тип розкладу</Label>
              <Select value={newSchedule.schedule_type} onValueChange={(value: string) => setNewSchedule(prev => ({ ...prev, schedule_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scheduleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Same conditional fields as in Add Dialog */}
            {newSchedule.schedule_type === 'timer' && (
              <>
                <div>
                  <Label>Час початку</Label>
                  <Input
                    type="time"
                    value={newSchedule.start_time}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Час закінчення</Label>
                  <Input
                    type="time"
                    value={newSchedule.end_time}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </>
            )}

            {newSchedule.schedule_type === 'daily' && (
              <>
                <div>
                  <Label>Час запуску</Label>
                  <Input
                    type="time"
                    value={newSchedule.start_time}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Дні тижня</Label>
                  <div className="flex gap-1 mt-2">
                    {days.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={newSchedule.days_of_week.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        className="w-10 h-10 p-0"
                        onClick={() => toggleDay(day.value)}
                      >
                        {day.short}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {newSchedule.schedule_type === 'interval' && (
              <div>
                <Label>Інтервал (хвилини)</Label>
                <Input
                  type="number"
                  min="1"
                  value={newSchedule.interval_minutes}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, interval_minutes: parseInt(e.target.value) || 60 }))}
                />
              </div>
            )}

            <Button onClick={updateSchedule} className="w-full">
              Зберегти зміни
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}