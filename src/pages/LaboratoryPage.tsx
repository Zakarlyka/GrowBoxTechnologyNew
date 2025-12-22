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
// AllPlantsDrawer moved to Dashboard
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
    <div className="space-y-4 md:space-y-6 p-3 md:p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 md:gap-3 flex-wrap">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-2 md:p-3 rounded-xl bg-primary/10 border border-primary/30">
            <FlaskConical className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">{t('laboratory.title')}</h1>
            <p className="text-xs md:text-base text-muted-foreground hidden sm:block">{t('laboratory.subtitle')}</p>
          </div>
        </div>
        {/* AllPlantsDrawer button removed - now in Dashboard */}
      </div>

      {/* Master Plant Controller */}
      <Card className="border-2 border-amber-500/20 bg-amber-500/5">
        <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
            <CardTitle className="text-base md:text-lg">🎯 Climate Controller</CardTitle>
          </div>
          <CardDescription className="text-xs md:text-sm">Master Plant dictates the environment</CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <MasterPlantController />
        </CardContent>
      </Card>

      {/* Active Grows Section */}
      <Card className="border-2 border-green-500/20 bg-green-500/5">
        <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
            <CardTitle className="text-base md:text-lg">🧪 Експериментальні зразки</CardTitle>
          </div>
          <CardDescription className="text-xs md:text-sm">Ваші активні рослини</CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <ActiveGrowsSection />
        </CardContent>
      </Card>

      {/* Tool Cards */}
      <div className="space-y-3 md:space-y-4">
        <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
          <Beaker className="h-4 w-4 md:h-5 md:w-5 text-primary" />
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
                  'cursor-pointer transition-colors p-3 md:p-6',
                  isExpanded ? tool.bgColor : 'hover:bg-muted/50'
                )}
                onClick={() => toggleTool(tool.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={cn('p-2 md:p-2.5 rounded-lg border', tool.bgColor, tool.borderColor)}>
                      <Icon className={cn('h-5 w-5 md:h-6 md:w-6', tool.color)} />
                    </div>
                    <div>
                      <CardTitle className="text-base md:text-lg text-foreground">{t(tool.titleKey)}</CardTitle>
                      <CardDescription className="text-xs md:text-sm hidden sm:block">{t(tool.descriptionKey)}</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 md:h-10 md:w-10">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="p-3 md:p-6 pt-0 md:pt-0 pb-4 md:pb-6">
                  <div className="pt-3 md:pt-4 border-t border-border/50">
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
