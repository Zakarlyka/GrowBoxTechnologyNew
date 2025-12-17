import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Loader2, Library, Search, Crown, Users, ArrowUpCircle } from 'lucide-react';
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
  genotype: string | null;
  genetics: string | null;
  thc_percent: number | null;
  description: string | null;
  flowering_days: number | null;
  photo_url: string | null;
  presets: any;
  growing_params: any;
  created_at: string | null;
  is_public: boolean | null;
  user_id: string | null;
  difficulty: string | null;
  yield_indoor: string | null;
}

interface StrainWithUser extends LibraryStrain {
  user_email?: string;
}

export function LibraryStrainManager() {
  const [systemStrains, setSystemStrains] = useState<LibraryStrain[]>([]);
  const [userStrains, setUserStrains] = useState<StrainWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingStrain, setEditingStrain] = useState<LibraryStrain | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [strainToDelete, setStrainToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('system');
  const [isPromoting, setIsPromoting] = useState(false);

  const fetchStrains = async () => {
    setLoading(true);
    try {
      // Fetch system strains (user_id IS NULL)
      const { data: systemData, error: systemError } = await supabase
        .from('library_strains')
        .select('*')
        .is('user_id', null)
        .order('name', { ascending: true });

      if (systemError) throw systemError;
      setSystemStrains((systemData || []) as LibraryStrain[]);

      // Fetch user strains (user_id IS NOT NULL) with user email
      const { data: userData, error: userError } = await supabase
        .from('library_strains')
        .select('*')
        .not('user_id', 'is', null)
        .order('created_at', { ascending: false });

      if (userError) throw userError;

      // Get user emails for user strains
      const userIds = [...new Set((userData || []).map(s => s.user_id).filter(Boolean))];
      
      let userEmailMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', userIds);
        
        if (profiles) {
          userEmailMap = profiles.reduce((acc, p) => {
            acc[p.user_id] = p.email;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const strainsWithEmail = (userData || []).map(strain => ({
        ...strain,
        user_email: strain.user_id ? userEmailMap[strain.user_id] || 'Unknown' : undefined
      })) as StrainWithUser[];

      setUserStrains(strainsWithEmail);
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

  // Filter strains based on search query
  const filteredSystemStrains = useMemo(() => {
    if (!searchQuery.trim()) return systemStrains;
    const query = searchQuery.toLowerCase();
    return systemStrains.filter(s => 
      s.name?.toLowerCase().includes(query) || 
      s.breeder?.toLowerCase().includes(query)
    );
  }, [systemStrains, searchQuery]);

  const filteredUserStrains = useMemo(() => {
    if (!searchQuery.trim()) return userStrains;
    const query = searchQuery.toLowerCase();
    return userStrains.filter(s => 
      s.name?.toLowerCase().includes(query) || 
      s.breeder?.toLowerCase().includes(query) ||
      s.user_email?.toLowerCase().includes(query)
    );
  }, [userStrains, searchQuery]);

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

  const handlePromoteToSystem = async (strain: StrainWithUser) => {
    setIsPromoting(true);
    try {
      // Clone the strain data (excluding id and timestamps)
      const clonedData = {
        name: `${strain.name} (System)`,
        breeder: strain.breeder,
        type: strain.type,
        genotype: strain.genotype,
        genetics: strain.genetics,
        thc_percent: strain.thc_percent,
        description: strain.description,
        flowering_days: strain.flowering_days,
        photo_url: strain.photo_url,
        presets: strain.presets,
        growing_params: strain.growing_params,
        difficulty: strain.difficulty,
        yield_indoor: strain.yield_indoor,
        user_id: null, // System strain
        is_public: true, // Public by default
      };

      const { data, error } = await supabase
        .from('library_strains')
        .insert(clonedData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✨ Сорт скопійовано',
        description: 'Відкривається редактор для фінальних правок...',
      });

      // Refresh the list first
      await fetchStrains();

      // Open editor with the new cloned strain for admin to review/edit
      setEditingStrain(data as LibraryStrain);
      setIsEditorOpen(true);
      setActiveTab('system'); // Switch to system tab to see the new strain

    } catch (error: any) {
      toast({
        title: 'Помилка копіювання',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsPromoting(false);
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
      case 'auto':
      case 'autoflower':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'photo':
      case 'photoperiod':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const hasGrowingParams = (params: any) => {
    if (!params) return false;
    return params.stages?.length > 0 || params.phenotype || params.risks?.length > 0;
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
                <CardTitle>Менеджер Бібліотеки</CardTitle>
                <CardDescription>
                  Системні сорти та користувацькі внески
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Додати Системний Сорт
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Пошук за назвою або бридером..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="system" className="gap-2">
                <Crown className="h-4 w-4" />
                Системні / Офіційні
                <Badge variant="secondary" className="ml-1">{systemStrains.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="user" className="gap-2">
                <Users className="h-4 w-4" />
                Користувацькі
                <Badge variant="secondary" className="ml-1">{userStrains.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* System Strains Tab */}
            <TabsContent value="system" className="mt-4">
              {filteredSystemStrains.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <Crown className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Нічого не знайдено' : 'Системні сорти відсутні'}
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
                      <TableHead>Параметри</TableHead>
                      <TableHead className="text-right">Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSystemStrains.map((strain) => (
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
                          {hasGrowingParams(strain.growing_params) ? (
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
                              title="Редагувати"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(strain.id)}
                              title="Видалити"
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
            </TabsContent>

            {/* User Strains Tab */}
            <TabsContent value="user" className="mt-4">
              {filteredUserStrains.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Нічого не знайдено' : 'Користувацькі сорти відсутні'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Назва</TableHead>
                      <TableHead>Бридер</TableHead>
                      <TableHead>Створено</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Параметри</TableHead>
                      <TableHead className="text-right">Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUserStrains.map((strain) => (
                      <TableRow key={strain.id}>
                        <TableCell className="font-medium">{strain.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {strain.breeder || '—'}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {strain.user_email || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTypeColor(strain.type)}>
                            {strain.type || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {hasGrowingParams(strain.growing_params) ? (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/30">
                              ✓ Дані
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Базовий
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-primary hover:text-primary"
                              onClick={() => handlePromoteToSystem(strain)}
                              disabled={isPromoting}
                              title="Скопіювати в Системну Бібліотеку"
                            >
                              {isPromoting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowUpCircle className="h-4 w-4" />
                              )}
                              <span className="hidden sm:inline">Promote</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(strain)}
                              title="Редагувати"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(strain.id)}
                              title="Видалити"
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
            </TabsContent>
          </Tabs>
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
