import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { StrainForm } from './StrainForm';
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

interface Strain {
  id: string;
  name: string;
  type: string;
  description: string | null;
  settings_by_phase: any;
  fertilizer_schedule: any;
  info_url: string | null;
  seed_to_harvest_days: number | null;
  flowering_days: number | null;
  created_at: string;
}

export function StrainManager() {
  const [strains, setStrains] = useState<Strain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStrain, setEditingStrain] = useState<Strain | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [strainToDelete, setStrainToDelete] = useState<string | null>(null);

  const fetchStrains = async () => {
    try {
      const { data, error } = await supabase
        .from('strains')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStrains((data || []) as any);
    } catch (error: any) {
      toast({
        title: 'Помилка завантаження',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrains();
  }, []);

  const handleAdd = () => {
    setEditingStrain(null);
    setIsFormOpen(true);
  };

  const handleEdit = (strain: Strain) => {
    setEditingStrain(strain);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (strainId: string) => {
    setStrainToDelete(strainId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!strainToDelete) return;

    try {
      const { error } = await supabase
        .from('strains')
        .delete()
        .eq('id', strainToDelete);

      if (error) throw error;

      toast({
        title: 'Успіх',
        description: 'Сорт видалено',
      });

      fetchStrains();
    } catch (error: any) {
      toast({
        title: 'Помилка видалення',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setStrainToDelete(null);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingStrain(null);
    fetchStrains();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Керування Сортами</CardTitle>
              <CardDescription>
                Офіційні сорти для "Помічника"
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Додати Сорт
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {strains.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Немає сортів. Додайте перший сорт.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Назва</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Опис</TableHead>
                  <TableHead className="text-right">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strains.map((strain) => (
                  <TableRow key={strain.id}>
                    <TableCell className="font-medium">{strain.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{strain.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {strain.description || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(strain)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(strain.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <StrainForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        strain={editingStrain}
        onSuccess={handleFormSuccess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Підтвердження видалення</AlertDialogTitle>
            <AlertDialogDescription>
              Ви впевнені, що хочете видалити цей сорт? Цю дію не можна скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
