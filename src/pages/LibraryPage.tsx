import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Leaf, Clock, FlaskConical, BookOpen, Globe, User, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import { supabase } from '@/integrations/supabase/client';
import { AddPlantDialog } from '@/components/AddPlantDialog';
import { useDevices } from '@/hooks/useDevices';
import { useAuth } from '@/hooks/useAuth';
import { KnowledgeBase } from '@/components/library/KnowledgeBase';
import { StrainDetailsDialog } from '@/components/library/StrainDetailsDialog';
import { LibraryStrainEditor } from '@/components/admin/LibraryStrainEditor';
import { toast } from '@/hooks/use-toast';
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
  flowering_days: number | null;
  photo_url: string | null;
  description: string | null;
  presets: Record<string, any> | null;
  user_id: string;
  is_public: boolean | null;
}

export default function LibraryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { devices } = useDevices();
  const { user, role } = useAuth();
  const [globalStrains, setGlobalStrains] = useState<LibraryStrain[]>([]);
  const [myStrains, setMyStrains] = useState<LibraryStrain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [selectedStrain, setSelectedStrain] = useState<LibraryStrain | null>(null);
  const [addPlantOpen, setAddPlantOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  
  // Read tab from URL, default to 'global'
  const activeTab = searchParams.get('tab') || 'global';
  
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedStrainForDetails, setSelectedStrainForDetails] = useState<LibraryStrain | null>(null);
  
  // Strain Editor state
  const [strainEditorOpen, setStrainEditorOpen] = useState(false);
  const [editingStrain, setEditingStrain] = useState<LibraryStrain | null>(null);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [strainToDelete, setStrainToDelete] = useState<LibraryStrain | null>(null);

  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'developer';

  useEffect(() => {
    fetchStrains();
  }, [user?.id]);

  const fetchStrains = async () => {
    try {
      setLoading(true);
      
      // Fetch global strains: public OR system strains (user_id IS NULL)
      const { data: publicData, error: publicError } = await supabase
        .from('library_strains')
        .select('*')
        .or('is_public.eq.true,user_id.is.null')
        .order('name');

      if (publicError) throw publicError;
      setGlobalStrains((publicData as LibraryStrain[]) || []);

      // Fetch user's own strains (both public and private)
      if (user?.id) {
        const { data: userData, error: userError } = await supabase
          .from('library_strains')
          .select('*')
          .eq('user_id', user.id)
          .order('name');

        if (userError) throw userError;
        setMyStrains((userData as LibraryStrain[]) || []);
      }
    } catch (error) {
      console.error('Error loading strains:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortStrains = (strains: LibraryStrain[]) => {
    const sorted = [...strains];
    switch (sortBy) {
      case 'name-asc': return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc': return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'type': return sorted.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
      case 'thc-desc': return sorted.sort((a, b) => ((b as any).thc_percent || 0) - ((a as any).thc_percent || 0));
      case 'flowering-asc': return sorted.sort((a, b) => (a.flowering_days || 999) - (b.flowering_days || 999));
      default: return sorted;
    }
  };

  const getFilteredStrains = (strains: LibraryStrain[]) => {
    const filtered = strains.filter((strain) =>
      strain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strain.breeder?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return sortStrains(filtered);
  };

  const handleGrowThis = (strain: LibraryStrain) => {
    setSelectedStrain(strain);
    if (devices.length > 0) {
      setSelectedDeviceId(devices[0].device_id);
      setAddPlantOpen(true);
    } else {
      navigate('/devices/add');
    }
  };

  const handleOpenDetails = (strain: LibraryStrain) => {
    setSelectedStrainForDetails(strain);
    setDetailsDialogOpen(true);
  };

  const handlePlantAdded = () => {
    setAddPlantOpen(false);
    setSelectedStrain(null);
    navigate('/');
  };

  const handleAddStrain = () => {
    setEditingStrain(null);
    setStrainEditorOpen(true);
  };

  const handleEditStrain = (strain: LibraryStrain) => {
    setEditingStrain(strain);
    setStrainEditorOpen(true);
  };

  const handleDeleteStrain = (strain: LibraryStrain) => {
    setStrainToDelete(strain);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteStrain = async () => {
    if (!strainToDelete) return;
    
    try {
      const { error } = await supabase
        .from('library_strains')
        .delete()
        .eq('id', strainToDelete.id);
      
      if (error) throw error;
      
      toast({
        title: t('status.success'),
        description: t('library.strainDeleted', { name: strainToDelete.name }),
      });
      
      fetchStrains();
    } catch (error: any) {
      toast({
        title: t('status.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setStrainToDelete(null);
    }
  };

  const handleStrainSaved = () => {
    fetchStrains();
  };

  const getTypeColor = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'indica':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'sativa':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'hybrid':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'autoflower':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const renderSortDropdown = () => (
    <Select value={sortBy} onValueChange={setSortBy}>
      <SelectTrigger className="w-[180px] gap-2">
        <ArrowUpDown className="h-4 w-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="name-asc">{t('library.sortNameAZ', 'Name (A-Z)')}</SelectItem>
        <SelectItem value="name-desc">{t('library.sortNameZA', 'Name (Z-A)')}</SelectItem>
        <SelectItem value="type">{t('library.sortType', 'Type')}</SelectItem>
        <SelectItem value="thc-desc">{t('library.sortTHC', 'THC (High→Low)')}</SelectItem>
        <SelectItem value="flowering-asc">{t('library.sortFlowering', 'Flowering (Short→Long)')}</SelectItem>
      </SelectContent>
    </Select>
  );

  const renderStrainCard = (strain: LibraryStrain, showActions: boolean = false) => (
    <Card
      key={strain.id}
      className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-card group"
    >
      {/* Cover Image - Clickable */}
      <div 
        className="aspect-[16/10] bg-gradient-to-br from-primary/20 to-accent/20 relative overflow-hidden cursor-pointer"
        onClick={() => handleOpenDetails(strain)}
      >
        {strain.photo_url ? (
          <OptimizedImage
            src={getOptimizedImageUrl(strain.photo_url, { width: 400, height: 250, quality: 60 }) || ''}
            alt={strain.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <Leaf className="h-16 w-16 text-primary/30" />
              </div>
            }
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="h-16 w-16 text-primary/30" />
          </div>
        )}
        {/* Private badge for user strains */}
        {!strain.is_public && (
          <Badge className="absolute top-2 right-2 bg-background/80 text-foreground text-xs">
            🔒 {t('library.private')}
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title with Edit/Delete for user strains */}
        <div className="flex items-start justify-between gap-2">
          <h3 
            className="font-semibold text-lg text-foreground line-clamp-1 cursor-pointer hover:text-primary transition-colors flex-1"
            onClick={() => handleOpenDetails(strain)}
          >
            {strain.name}
          </h3>
          {showActions && (
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => { e.stopPropagation(); handleEditStrain(strain); }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); handleDeleteStrain(strain); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {strain.breeder && (
            <Badge variant="secondary" className="text-xs">
              {strain.breeder}
            </Badge>
          )}
          {strain.type && (
            <Badge className={`text-xs border ${getTypeColor(strain.type)}`}>
              {strain.type}
            </Badge>
          )}
          {strain.flowering_days && (
            <Badge variant="outline" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              {strain.flowering_days} {t('library.days')}
            </Badge>
          )}
        </div>

        {/* Description - Dynamic data, not translated */}
        {strain.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {strain.description}
          </p>
        )}

        {/* Action Button */}
        <Button
          onClick={() => handleGrowThis(strain)}
          className="w-full gap-2 mt-2"
          size="lg"
        >
          <Leaf className="h-4 w-4" />
          🌱 {t('library.growThisStrain')}
        </Button>
      </CardContent>
    </Card>
  );

  const renderStrainsGrid = (strains: LibraryStrain[], showActions: boolean = false) => {
    const filtered = getFilteredStrains(strains);
    
    if (filtered.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {searchQuery ? t('library.noStrainsFound') : t('library.emptyLibrary')}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((strain) => renderStrainCard(strain, showActions))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FlaskConical className="h-8 w-8 text-primary" />
              {t('library.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('library.subtitle')}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="global" className="gap-2">
              <Globe className="h-4 w-4" />
              {t('library.global')}
            </TabsTrigger>
            <TabsTrigger value="my-strains" className="gap-2">
              <User className="h-4 w-4" />
              {t('library.myStrains')}
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-2">
              <BookOpen className="h-4 w-4" />
              {t('library.knowledgeBase')}
            </TabsTrigger>
          </TabsList>

          {/* Global Library Tab */}
          <TabsContent value="global" className="space-y-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('library.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
              {renderSortDropdown()}
            </div>
            {renderStrainsGrid(globalStrains, false)}
          </TabsContent>

          {/* My Strains Tab */}
          <TabsContent value="my-strains" className="space-y-6">
            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('library.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
              {renderSortDropdown()}
              <Button onClick={handleAddStrain} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('library.addStrain')}
              </Button>
            </div>
            {renderStrainsGrid(myStrains, true)}
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge">
            <KnowledgeBase />
          </TabsContent>
        </Tabs>

        {/* Strain Details Dialog */}
        <StrainDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          strain={selectedStrainForDetails as any}
          onGrowThis={handleGrowThis}
        />

        {/* Strain Editor Dialog */}
        <LibraryStrainEditor
          open={strainEditorOpen}
          onOpenChange={setStrainEditorOpen}
          strain={editingStrain as any}
          onSuccess={handleStrainSaved}
          isAdmin={isAdmin}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('library.deleteStrain')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('library.deleteStrainConfirm', { name: strainToDelete?.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteStrain}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Plant Dialog with pre-selected strain */}
        {selectedDeviceId && (
          <AddPlantDialog
            open={addPlantOpen}
            onOpenChange={setAddPlantOpen}
            deviceId={selectedDeviceId}
            onPlantAdded={handlePlantAdded}
            preSelectedStrain={selectedStrain ? {
              id: selectedStrain.id,
              name: selectedStrain.name,
            } : undefined}
          />
        )}
      </div>
    </div>
  );
}