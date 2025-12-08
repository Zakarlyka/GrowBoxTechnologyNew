import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FlaskConical, Beaker, Thermometer, Zap, Droplets } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ToolCard {
  id: string;
  icon: React.ElementType;
  titleKey: string;
  descriptionKey: string;
  color: string;
  bgColor: string;
  borderColor: string;
  href: string;
  comingSoon?: boolean;
}

const LaboratoryPage = () => {
  const { t } = useTranslation();

  const tools: ToolCard[] = [
    {
      id: 'nutrient-calculator',
      icon: Beaker,
      titleKey: 'laboratory.nutrientCalculator',
      descriptionKey: 'laboratory.nutrientCalculatorDesc',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      href: '/laboratory/nutrients',
      comingSoon: true
    },
    {
      id: 'vpd-chart',
      icon: Thermometer,
      titleKey: 'laboratory.vpdChart',
      descriptionKey: 'laboratory.vpdChartDesc',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      href: '/laboratory/vpd',
      comingSoon: true
    },
    {
      id: 'electricity-cost',
      icon: Zap,
      titleKey: 'laboratory.electricityCost',
      descriptionKey: 'laboratory.electricityCostDesc',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      href: '/laboratory/electricity',
      comingSoon: true
    },
    {
      id: 'water-mixing',
      icon: Droplets,
      titleKey: 'laboratory.waterMixing',
      descriptionKey: 'laboratory.waterMixingDesc',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      href: '/laboratory/water',
      comingSoon: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
          <FlaskConical className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('laboratory.title')}</h1>
          <p className="text-muted-foreground">{t('laboratory.subtitle')}</p>
        </div>
      </div>

      {/* Tool Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          
          return (
            <Card 
              key={tool.id}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer border ${tool.borderColor} ${tool.bgColor}`}
            >
              {tool.comingSoon && (
                <div className="absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                  {t('laboratory.comingSoon')}
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${tool.bgColor} border ${tool.borderColor}`}>
                    <Icon className={`h-6 w-6 ${tool.color}`} />
                  </div>
                  <CardTitle className="text-lg text-foreground">
                    {t(tool.titleKey)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-muted-foreground">
                  {t(tool.descriptionKey)}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LaboratoryPage;
