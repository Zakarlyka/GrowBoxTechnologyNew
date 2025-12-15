import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2, Library } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LibraryStrainEditor } from './LibraryStrainEditor';
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

interface LibraryStrain {
  id: number;
  name: string;
  breeder: string | null;
  type: string | null;
  description: string | null;
  flowering_days: number | null;
  photo_url: string | null;
  presets: any;
  created_at: string | null;
  is_public: boolean | null;
}

export function LibraryStrainManager() {
  const [strains, setStrains] = useState<LibraryStrain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingStrain, setEditingStrain] = useState<LibraryStrain | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [strainToDelete, setStrainToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStrains = async () => {
    try {
      const { data, error } = await supabase
        .from('library_strains')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setStrains((data || []) as LibraryStrain[]);
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
    setIsEditorOpen(true);
  };

  const handleEdit = (strain: LibraryStrain) => {
    setEditingStrain(strain);
    setIsEditorOpen(true);
  };

  const handleDeleteClick = (strainId: number) => {
    setStrainToDelete(strainId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (strainToDelete === null) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('library_strains')
        .delete()
        .eq('id', strainToDelete);

      if (error) throw error;

      toast({
        title: 'Успіх',
        description: 'Сорт видалено з бібліотеки',
      });

      fetchStrains();
    } catch (error: any) {
      toast({
        title: 'Помилка видалення',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setStrainToDelete(null);
    }
  };

  const handleEditorSuccess = () => {
    setIsEditorOpen(false);
    setEditingStrain(null);
    fetchStrains();
  };

  const getTypeColor = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'indica':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'sativa':
        return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'hybrid':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'autoflower':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const hasPresets = (presets: any) => {
    if (!presets) return false;
    return Object.keys(presets).some(key => ['seedling', 'veg', 'bloom', 'flush'].includes(key));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Завантаження бібліотеки...</span>
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
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Library className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle>Бібліотека Сортів</CardTitle>
                <CardDescription>
                  Публічна бібліотека з пресетами для AI-оптимізації
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Додати Сорт
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {strains.length === 0 ? (
            <div className="text-center py-12">
              <Library className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Бібліотека порожня</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Додайте перший сорт з пресетами для користувачів
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Назва</TableHead>
                  <TableHead>Бридер</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Цвітіння</TableHead>
                  <TableHead>Пресети</TableHead>
                  <TableHead className="text-right">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strains.map((strain) => (
                  <TableRow key={strain.id}>
                    <TableCell className="font-medium">{strain.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {strain.breeder || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTypeColor(strain.type)}>
                        {strain.type || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {strain.flowering_days ? `${strain.flowering_days} днів` : '—'}
                    </TableCell>
                    <TableCell>
                      {hasPresets(strain.presets) ? (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/30">
                          ✓ Налаштовано
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Немає
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
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
                          className="text-destructive hover:text-destructive"
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

      <LibraryStrainEditor
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        strain={editingStrain as any}
        onSuccess={handleEditorSuccess}
        isAdmin={true}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити сорт?</AlertDialogTitle>
            <AlertDialogDescription>
              Ви впевнені, що хочете видалити цей сорт з бібліотеки? Рослини користувачів, прив'язані до цього сорту, втратять доступ до пресетів.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
