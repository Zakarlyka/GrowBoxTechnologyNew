import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Leaf, Clock, FlaskConical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AddPlantDialog } from '@/components/AddPlantDialog';
import { useDevices } from '@/hooks/useDevices';

interface LibraryStrain {
  id: number;
  name: string;
  breeder: string | null;
  type: string | null;
  flowering_days: number | null;
  photo_url: string | null;
  description: string | null;
}

export default function LibraryPage() {
  const navigate = useNavigate();
  const { devices } = useDevices();
  const [strains, setStrains] = useState<LibraryStrain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStrain, setSelectedStrain] = useState<LibraryStrain | null>(null);
  const [addPlantOpen, setAddPlantOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  useEffect(() => {
    fetchStrains();
  }, []);

  const fetchStrains = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('library_strains')
        .select('*')
        .order('name');

      if (error) throw error;
      setStrains((data as LibraryStrain[]) || []);
    } catch (error) {
      console.error('Error loading strains:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStrains = strains.filter((strain) =>
    strain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    strain.breeder?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGrowThis = (strain: LibraryStrain) => {
    setSelectedStrain(strain);
    // Use first available device, or prompt user to add one
    if (devices.length > 0) {
      setSelectedDeviceId(devices[0].device_id);
      setAddPlantOpen(true);
    } else {
      // No devices - navigate to add device page
      navigate('/devices/add');
    }
  };

  const handlePlantAdded = () => {
    setAddPlantOpen(false);
    setSelectedStrain(null);
    // Navigate to dashboard to see the new plant
    navigate('/');
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
              Бібліотека Сортів
            </h1>
            <p className="text-muted-foreground mt-1">
              Оберіть сорт для нового грову
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Додати власний сорт
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Пошук за назвою або бридером..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50"
          />
        </div>

        {/* Strains Grid */}
        {filteredStrains.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchQuery ? 'Сортів не знайдено' : 'Бібліотека сортів порожня'}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredStrains.map((strain) => (
              <Card
                key={strain.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-card group"
              >
                {/* Cover Image */}
                <div className="aspect-[16/10] bg-gradient-to-br from-primary/20 to-accent/20 relative overflow-hidden">
                  {strain.photo_url ? (
                    <img
                      src={strain.photo_url}
                      alt={strain.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Leaf className="h-16 w-16 text-primary/30" />
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Title */}
                  <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                    {strain.name}
                  </h3>

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
                        {strain.flowering_days} днів
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
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
                    🌱 Вирощувати цей сорт
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
