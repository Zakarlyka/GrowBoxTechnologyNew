import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Beaker, Thermometer, Droplets, ChevronDown, ChevronUp, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NutrientCalculator } from '@/components/laboratory/NutrientCalculator';
import { VPDCalculator } from '@/components/laboratory/VPDCalculator';
import { WaterMixingCalculator } from '@/components/laboratory/WaterMixingCalculator';
import { AllPlantsSection } from '@/components/laboratory/AllPlantsSection';
import { useDevices } from '@/hooks/useDevices';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ToolConfig {
  id: string;
  icon: React.ElementType;
  titleKey: string;
  descriptionKey: string;
  color: string;
  bgColor: string;
  borderColor: string;
  component: React.ComponentType;
}

const LaboratoryPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  
  const { devices } = useDevices();
  const selectedDeviceId = searchParams.get('device');
  const selectedDevice = devices.find(d => d.id === selectedDeviceId);

  const handleDeviceSelect = (deviceId: string) => {
    setSearchParams({ device: deviceId });
  };

  const tools: ToolConfig[] = [
    {
      id: 'nutrient-calculator',
      icon: Beaker,
      titleKey: 'laboratory.nutrientCalculator',
      descriptionKey: 'laboratory.nutrientCalculatorDesc',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      component: NutrientCalculator,
    },
    {
      id: 'vpd-chart',
      icon: Thermometer,
      titleKey: 'laboratory.vpdChart',
      descriptionKey: 'laboratory.vpdChartDesc',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      component: VPDCalculator,
    },
    {
      id: 'water-mixing',
      icon: Droplets,
      titleKey: 'laboratory.waterMixing',
      descriptionKey: 'laboratory.waterMixingDesc',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      component: WaterMixingCalculator,
    },
  ];

  const toggleTool = (toolId: string) => {
    setExpandedTool(expandedTool === toolId ? null : toolId);
  };

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6 pb-20 md:pb-6">
      {/* Header with Device Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-2 md:p-3 rounded-xl bg-primary/10 border border-primary/30">
            <FlaskConical className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">{t('laboratory.title')}</h1>
            <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">{t('laboratory.subtitle')}</p>
          </div>
        </div>
        
        {/* Device Selector */}
        {devices.length > 0 && (
          <Select value={selectedDeviceId || ''} onValueChange={handleDeviceSelect}>
            <SelectTrigger className="w-full sm:w-[240px] min-h-[44px]">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Select Device" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {devices.map(device => (
                <SelectItem key={device.id} value={device.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      device.last_seen_at && (Date.now() - new Date(device.last_seen_at).getTime()) < 40000
                        ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    {device.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Selected Device Badge */}
      {selectedDevice && (
        <Badge variant="outline" className="gap-2">
          <Cpu className="h-3 w-3" />
          Viewing: {selectedDevice.name}
        </Badge>
      )}

      {/* All Plants List */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🌱</span>
          <h2 className="text-lg font-semibold text-foreground">My Garden</h2>
        </div>
        <AllPlantsSection />
      </section>

      {/* Tools Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Beaker className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">🧪 Tools</h2>
        </div>
        
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isExpanded = expandedTool === tool.id;
          const ToolComponent = tool.component;

          return (
            <Card
              key={tool.id}
              className={cn(
                'overflow-hidden transition-all duration-300',
                isExpanded ? `border-2 ${tool.borderColor}` : 'border border-border/50'
              )}
            >
              <CardHeader
                className={cn(
                  'cursor-pointer transition-colors p-3 md:p-4',
                  isExpanded ? tool.bgColor : 'hover:bg-muted/50'
                )}
                onClick={() => toggleTool(tool.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={cn('p-2 rounded-lg border', tool.bgColor, tool.borderColor)}>
                      <Icon className={cn('h-5 w-5', tool.color)} />
                    </div>
                    <div>
                      <CardTitle className="text-base text-foreground">{t(tool.titleKey)}</CardTitle>
                      <CardDescription className="text-xs hidden sm:block">{t(tool.descriptionKey)}</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="p-3 md:p-4 pt-0">
                  <div className="pt-3 border-t border-border/50">
                    <ToolComponent />
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </section>
    </div>
  );
};

export default LaboratoryPage;
