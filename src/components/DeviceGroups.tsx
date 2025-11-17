import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Folder, Trash2, Edit, Palette } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DeviceGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
}

interface DeviceGroupsProps {
  groups: DeviceGroup[];
  onGroupsChange: () => void;
}

export function DeviceGroups({ groups, onGroupsChange }: DeviceGroupsProps) {
  const { user } = useAuth();
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DeviceGroup | null>(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    color: '#4F46E5',
  });

  const colors = [
    { name: 'Синій', value: '#4F46E5' },
    { name: 'Зелений', value: '#10B981' },
    { name: 'Помаранчевий', value: '#F59E0B' },
    { name: 'Червоний', value: '#EF4444' },
    { name: 'Фіолетовий', value: '#8B5CF6' },
    { name: 'Рожевий', value: '#EC4899' },
  ];

  const addGroup = async () => {
    if (!user || !newGroup.name) return;

    try {
      const { error } = await (supabase as any)
        .from('device_groups')
        .insert({
          user_id: user.id,
          name: newGroup.name,
          description: newGroup.description,
          color: newGroup.color,
        });

      if (error) {
        toast({
          title: "Помилка",
          description: "Не вдалося створити групу",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Успіх",
        description: "Групу створено",
      });

      setNewGroup({ name: '', description: '', color: '#4F46E5' });
      setAddGroupOpen(false);
      onGroupsChange();
    } catch (err) {
      console.error('Error adding group:', err);
    }
  };

  const updateGroup = async () => {
    if (!selectedGroup) return;

    try {
      const { error } = await (supabase as any)
        .from('device_groups')
        .update({
          name: newGroup.name,
          description: newGroup.description,
          color: newGroup.color,
        })
        .eq('id', selectedGroup.id);

      if (error) {
        toast({
          title: "Помилка",
          description: "Не вдалося оновити групу",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Успіх",
        description: "Групу оновлено",
      });

      setEditGroupOpen(false);
      setSelectedGroup(null);
      onGroupsChange();
    } catch (err) {
      console.error('Error updating group:', err);
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('device_groups')
        .delete()
        .eq('id', groupId);

      if (error) {
        toast({
          title: "Помилка",
          description: "Не вдалося видалити групу",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Успіх",
        description: "Групу видалено",
      });
      onGroupsChange();
    } catch (err) {
      console.error('Error deleting group:', err);
    }
  };

  const startEdit = (group: DeviceGroup) => {
    setSelectedGroup(group);
    setNewGroup({
      name: group.name,
      description: group.description || '',
      color: group.color,
    });
    setEditGroupOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Групи пристроїв</h2>
          <p className="text-muted-foreground">Організуйте свої пристрої у групи</p>
        </div>
        
        <Dialog open={addGroupOpen} onOpenChange={setAddGroupOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Створити групу
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Створити нову групу</DialogTitle>
              <DialogDescription>Додайте нову групу для організації пристроїв</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="group-name">Назва групи</Label>
                <Input
                  id="group-name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Світло, Вентиляція, Полив..."
                />
              </div>
              <div>
                <Label htmlFor="group-desc">Опис</Label>
                <Input
                  id="group-desc"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Опис групи (необов'язково)"
                />
              </div>
              <div>
                <Label>Колір</Label>
                <div className="flex gap-2 mt-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newGroup.color === color.value ? 'border-foreground' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setNewGroup(prev => ({ ...prev, color: color.value }))}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={addGroup} className="w-full" disabled={!newGroup.name}>
                Створити групу
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Folder className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Немає груп</h3>
            <p className="text-muted-foreground text-center mb-4">
              Створіть першу групу для організації ваших пристроїв
            </p>
            <Button onClick={() => setAddGroupOpen(true)}>
              Створити групу
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="transition-all hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(group)}
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
                          <AlertDialogTitle>Видалити групу?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ця дія незворотна. Пристрої будуть відв'язані від групи.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Скасувати</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteGroup(group.id)}>
                            Видалити
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {group.description && (
                  <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Створено: {new Date(group.created_at).toLocaleDateString('uk-UA')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editGroupOpen} onOpenChange={setEditGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редагувати групу</DialogTitle>
            <DialogDescription>Змініть налаштування групи</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-group-name">Назва групи</Label>
              <Input
                id="edit-group-name"
                value={newGroup.name}
                onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-group-desc">Опис</Label>
              <Input
                id="edit-group-desc"
                value={newGroup.description}
                onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>Колір</Label>
              <div className="flex gap-2 mt-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newGroup.color === color.value ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNewGroup(prev => ({ ...prev, color: color.value }))}
                  />
                ))}
              </div>
            </div>
            <Button onClick={updateGroup} className="w-full" disabled={!newGroup.name}>
              Зберегти зміни
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}