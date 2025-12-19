import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlaskConical, Beaker, Thermometer, Droplets, ChevronDown, ChevronUp, Sprout, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NutrientCalculator } from '@/components/laboratory/NutrientCalculator';
import { VPDCalculator } from '@/components/laboratory/VPDCalculator';
import { WaterMixingCalculator } from '@/components/laboratory/WaterMixingCalculator';
import { ActiveGrowsSection } from '@/components/laboratory/ActiveGrowsSection';
import { AllPlantsDrawer } from '@/components/laboratory/AllPlantsDrawer';
import { MasterPlantController } from '@/components/laboratory/MasterPlantController';
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
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

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
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
            <FlaskConical className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('laboratory.title')}</h1>
            <p className="text-muted-foreground">{t('laboratory.subtitle')}</p>
          </div>
        </div>
        <AllPlantsDrawer />
      </div>

      {/* Master Plant Controller */}
      <Card className="border-2 border-amber-500/20 bg-amber-500/5">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">🎯 Climate Controller</CardTitle>
          </div>
          <CardDescription>Master Plant dictates the environment, neighbors must adapt</CardDescription>
        </CardHeader>
        <CardContent>
          <MasterPlantController />
        </CardContent>
      </Card>

      {/* Active Grows Section */}
      <Card className="border-2 border-green-500/20 bg-green-500/5">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-green-500" />
            <CardTitle className="text-lg">🧪 Експериментальні зразки</CardTitle>
          </div>
          <CardDescription>Ваші активні рослини</CardDescription>
        </CardHeader>
        <CardContent>
          <ActiveGrowsSection />
        </CardContent>
      </Card>

      {/* Tool Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Beaker className="h-5 w-5 text-primary" />
          Інструменти
        </h2>
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
                  'cursor-pointer transition-colors',
                  isExpanded ? tool.bgColor : 'hover:bg-muted/50'
                )}
                onClick={() => toggleTool(tool.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2.5 rounded-lg border', tool.bgColor, tool.borderColor)}>
                      <Icon className={cn('h-6 w-6', tool.color)} />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground">{t(tool.titleKey)}</CardTitle>
                      <CardDescription className="text-sm">{t(tool.descriptionKey)}</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 pb-6">
                  <div className="pt-4 border-t border-border/50">
                    <ToolComponent />
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LaboratoryPage;
