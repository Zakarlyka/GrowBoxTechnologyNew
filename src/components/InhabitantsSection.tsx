import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sprout, 
  Leaf, 
  Flower2, 
  Droplets, 
  Sun,
  Users
} from 'lucide-react';
import { 
  usePlantsWithStrains,
  calculateStageInfo,
  PlantWithStrain
} from '@/hooks/usePlantsWithStrains';

const stageIcons: Record<string, React.ElementType> = {
  seedling: Sprout,
  vegetation: Leaf,
  flowering: Flower2,
  flushing: Droplets,
  drying: Sun,
};

const stageColors: Record<string, string> = {
  seedling: 'text-lime-400',
  vegetation: 'text-emerald-400',
  flowering: 'text-purple-400',
  flushing: 'text-sky-400',
  drying: 'text-amber-400',
};

interface InhabitantsSectionProps {
  deviceStringId: string;
}

/**
 * Compact list of other plants (neighbors) assigned to this device.
 * Excludes the Master Plant.
 */
export function InhabitantsSection({ deviceStringId }: InhabitantsSectionProps) {
  const navigate = useNavigate();
  const { plants, isLoading } = usePlantsWithStrains({ excludeHarvested: true });
  
  // Filter plants for this device, excluding master
  const devicePlants = plants?.filter(p => p.device_id === deviceStringId) || [];
  const neighbors = devicePlants.filter(p => !p.is_main);

  if (isLoading || neighbors.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          Inhabitants ({neighbors.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        <div className="space-y-2">
          {neighbors.slice(0, 5).map((plant) => (
            <InhabitantRow key={plant.id} plant={plant} />
          ))}
          {neighbors.length > 5 && (
            <button 
              className="text-xs text-primary hover:underline w-full text-center pt-1"
              onClick={() => navigate('/laboratory')}
            >
              +{neighbors.length - 5} more in Lab
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InhabitantRow({ plant }: { plant: PlantWithStrain }) {
  const stageInfo = calculateStageInfo(plant.start_date, plant.growing_params);
  const stage = stageInfo?.stageName || plant.current_stage || 'seedling';
  const StageIcon = stageIcons[stage] || Sprout;
  const stageColor = stageColors[stage] || stageColors.seedling;

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      {/* Icon or Photo */}
      {plant.photo_url || plant.strain_photo_url ? (
        <div 
          className="w-7 h-7 rounded-md bg-cover bg-center border border-border shrink-0"
          style={{ backgroundImage: `url(${plant.photo_url || plant.strain_photo_url})` }}
        />
      ) : (
        <div className={`p-1.5 rounded-md bg-muted ${stageColor}`}>
          <StageIcon className="h-4 w-4" />
        </div>
      )}
      
      {/* Name */}
      <span className="flex-1 text-sm font-medium text-foreground truncate">
        {plant.custom_name || 'Unnamed'}
      </span>
      
      {/* Stage Badge */}
      <Badge variant="outline" className={`text-[10px] capitalize px-1.5 py-0 ${stageColor}`}>
        {stage}
      </Badge>
    </div>
  );
}
