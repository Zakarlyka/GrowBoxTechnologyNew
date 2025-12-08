import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Thermometer, Droplets, AlertTriangle, CheckCircle2, Leaf, Flower2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VPDZone {
  min: number;
  max: number;
  label: string;
  labelKey: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
  description: string;
}

const VPD_ZONES: VPDZone[] = [
  {
    min: 0,
    max: 0.4,
    label: 'Danger (Wet)',
    labelKey: 'vpd.dangerWet',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500',
    icon: AlertTriangle,
    description: 'Ризик плісняви та грибкових захворювань',
  },
  {
    min: 0.4,
    max: 0.8,
    label: 'Vegetation',
    labelKey: 'vpd.vegetation',
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500',
    icon: Leaf,
    description: 'Оптимально для вегетативної стадії',
  },
  {
    min: 0.8,
    max: 1.2,
    label: 'Early Flower',
    labelKey: 'vpd.earlyFlower',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500',
    icon: Flower2,
    description: 'Оптимально для раннього цвітіння',
  },
  {
    min: 1.2,
    max: 1.6,
    label: 'Late Flower',
    labelKey: 'vpd.lateFlower',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500',
    icon: Flower2,
    description: 'Оптимально для пізнього цвітіння',
  },
  {
    min: 1.6,
    max: Infinity,
    label: 'Danger (Dry)',
    labelKey: 'vpd.dangerDry',
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500',
    icon: AlertTriangle,
    description: 'Стрес рослини, закриття продихів',
  },
];

// Calculate Saturated Vapor Pressure (SVP) using Tetens formula
const calculateSVP = (tempC: number): number => {
  return 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
};

// Calculate VPD
const calculateVPD = (tempC: number, humidity: number): number => {
  const svp = calculateSVP(tempC);
  const avp = svp * (humidity / 100);
  return svp - avp;
};

export function VPDCalculator() {
  const { t } = useTranslation();
  const [temperature, setTemperature] = useState<number>(25);
  const [humidity, setHumidity] = useState<number>(60);

  const vpd = useMemo(() => calculateVPD(temperature, humidity), [temperature, humidity]);

  const currentZone = useMemo(() => {
    return VPD_ZONES.find((zone) => vpd >= zone.min && vpd < zone.max) || VPD_ZONES[VPD_ZONES.length - 1];
  }, [vpd]);

  const ZoneIcon = currentZone.icon;

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Temperature */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-500" />
              {t('sensors.temperature', 'Температура')}
            </Label>
            <span className="text-2xl font-bold text-foreground">{temperature}°C</span>
          </div>
          <Slider
            value={[temperature]}
            onValueChange={(v) => setTemperature(v[0])}
            min={15}
            max={35}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>15°C</span>
            <span>35°C</span>
          </div>
        </div>

        {/* Humidity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              {t('sensors.humidity', 'Вологість')}
            </Label>
            <span className="text-2xl font-bold text-foreground">{humidity}%</span>
          </div>
          <Slider
            value={[humidity]}
            onValueChange={(v) => setHumidity(v[0])}
            min={20}
            max={90}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>20%</span>
            <span>90%</span>
          </div>
        </div>
      </div>

      {/* VPD Result */}
      <Card className={cn('border-2 transition-colors', currentZone.borderColor, currentZone.bgColor)}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn('p-3 rounded-full', currentZone.bgColor)}>
                <ZoneIcon className={cn('h-8 w-8', currentZone.color)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">VPD (Дефіцит Тиску Пари)</p>
                <p className={cn('text-4xl font-bold', currentZone.color)}>{vpd.toFixed(2)} kPa</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className={cn('text-xl font-semibold', currentZone.color)}>{currentZone.label}</p>
              <p className="text-sm text-muted-foreground">{currentZone.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VPD Zones Legend */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {VPD_ZONES.map((zone) => {
          const isActive = zone === currentZone;
          return (
            <div
              key={zone.label}
              className={cn(
                'p-3 rounded-lg border text-center transition-all',
                isActive ? `${zone.bgColor} ${zone.borderColor} border-2` : 'border-border/50 bg-card/50'
              )}
            >
              <p className={cn('text-xs font-medium', isActive ? zone.color : 'text-muted-foreground')}>
                {zone.min.toFixed(1)} - {zone.max === Infinity ? '∞' : zone.max.toFixed(1)}
              </p>
              <p className={cn('text-xs mt-1', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                {zone.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
