import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Beaker, Droplets } from 'lucide-react';

interface NutrientDose {
  name: string;
  fullDose: number; // mL per liter
  color: string;
}

const NUTRIENTS: NutrientDose[] = [
  { name: 'Base A', fullDose: 2.0, color: 'text-green-500' },
  { name: 'Base B', fullDose: 2.0, color: 'text-blue-500' },
  { name: 'CalMag', fullDose: 1.0, color: 'text-purple-500' },
  { name: 'PK 13/14', fullDose: 0.5, color: 'text-orange-500' },
  { name: 'Root Stim', fullDose: 0.3, color: 'text-amber-600' },
];

const DOSE_MULTIPLIERS: { [key: string]: number } = {
  'quarter': 0.25,
  'half': 0.5,
  'three-quarter': 0.75,
  'full': 1.0,
};

export function NutrientCalculator() {
  const { t } = useTranslation();
  const [tankSize, setTankSize] = useState<number>(10);
  const [unit, setUnit] = useState<'liters' | 'gallons'>('liters');
  const [doseStrength, setDoseStrength] = useState<string>('full');

  // Convert gallons to liters if needed
  const volumeInLiters = unit === 'gallons' ? tankSize * 3.78541 : tankSize;
  const multiplier = DOSE_MULTIPLIERS[doseStrength] || 1.0;

  const calculateDose = (nutrient: NutrientDose): number => {
    return volumeInLiters * nutrient.fullDose * multiplier;
  };

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tank-size">{t('laboratory.tankSize', 'Об\'єм резервуару')}</Label>
          <div className="flex gap-2">
            <Input
              id="tank-size"
              type="number"
              min={1}
              max={1000}
              value={tankSize}
              onChange={(e) => setTankSize(Math.max(1, parseFloat(e.target.value) || 1))}
              className="flex-1 bg-background text-foreground border-input"
            />
            <Select value={unit} onValueChange={(v) => setUnit(v as 'liters' | 'gallons')}>
              <SelectTrigger className="w-28 bg-background text-foreground border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="liters">Літрів</SelectItem>
                <SelectItem value="gallons">Галонів</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>{t('laboratory.doseStrength', 'Концентрація')}</Label>
          <ToggleGroup
            type="single"
            value={doseStrength}
            onValueChange={(v) => v && setDoseStrength(v)}
            className="justify-start flex-wrap"
          >
            <ToggleGroupItem
              value="quarter"
              className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
            >
              25%
            </ToggleGroupItem>
            <ToggleGroupItem
              value="half"
              className="data-[state=on]:bg-green-500 data-[state=on]:text-white"
            >
              50%
            </ToggleGroupItem>
            <ToggleGroupItem
              value="three-quarter"
              className="data-[state=on]:bg-orange-500 data-[state=on]:text-white"
            >
              75%
            </ToggleGroupItem>
            <ToggleGroupItem
              value="full"
              className="data-[state=on]:bg-red-500 data-[state=on]:text-white"
            >
              100%
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Results Table */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            {t('laboratory.dosageResults', 'Результати дозування')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {NUTRIENTS.map((nutrient) => {
              const dose = calculateDose(nutrient);
              return (
                <div
                  key={nutrient.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <Beaker className={`h-5 w-5 ${nutrient.color}`} />
                    <span className="font-medium text-foreground">{nutrient.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-foreground">{dose.toFixed(1)}</span>
                    <span className="text-muted-foreground ml-1">mL</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">{t('common.total', 'Всього')}</span>
            <div className="text-right">
              <span className="text-3xl font-bold text-primary">
                {NUTRIENTS.reduce((sum, n) => sum + calculateDose(n), 0).toFixed(1)}
              </span>
              <span className="text-muted-foreground ml-1">mL</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
