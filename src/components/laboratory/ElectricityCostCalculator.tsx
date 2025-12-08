import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Zap, Clock, Coins, Calculator } from 'lucide-react';

export function ElectricityCostCalculator() {
  const { t } = useTranslation();
  const [wattage, setWattage] = useState<number>(400);
  const [hoursPerDay, setHoursPerDay] = useState<number>(18);
  const [costPerKwh, setCostPerKwh] = useState<number>(2.64); // UAH default

  const calculations = useMemo(() => {
    const kw = wattage / 1000;
    const kwhPerDay = kw * hoursPerDay;
    const kwhPerMonth = kwhPerDay * 30;
    const costPerDay = kwhPerDay * costPerKwh;
    const costPerMonth = kwhPerMonth * costPerKwh;
    const costPerYear = costPerMonth * 12;

    return {
      kw,
      kwhPerDay,
      kwhPerMonth,
      costPerDay,
      costPerMonth,
      costPerYear,
    };
  }, [wattage, hoursPerDay, costPerKwh]);

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wattage */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              {t('laboratory.wattage', 'Потужність')}
            </Label>
            <span className="text-xl font-bold text-foreground">{wattage} W</span>
          </div>
          <Slider
            value={[wattage]}
            onValueChange={(v) => setWattage(v[0])}
            min={50}
            max={2000}
            step={50}
            className="w-full"
          />
          <Input
            type="number"
            value={wattage}
            onChange={(e) => setWattage(Math.max(1, parseInt(e.target.value) || 0))}
            className="bg-background text-foreground border-input"
          />
        </div>

        {/* Hours per Day */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              {t('laboratory.hoursPerDay', 'Годин на день')}
            </Label>
            <span className="text-xl font-bold text-foreground">{hoursPerDay} {t('time.hours', 'год')}</span>
          </div>
          <Slider
            value={[hoursPerDay]}
            onValueChange={(v) => setHoursPerDay(v[0])}
            min={1}
            max={24}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 год</span>
            <span>12 год</span>
            <span>18 год</span>
            <span>24 год</span>
          </div>
        </div>

        {/* Cost per kWh */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-green-500" />
              {t('laboratory.costPerKwh', 'Тариф за кВт·год')}
            </Label>
          </div>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={costPerKwh}
            onChange={(e) => setCostPerKwh(Math.max(0, parseFloat(e.target.value) || 0))}
            className="bg-background text-foreground border-input text-lg"
          />
          <p className="text-xs text-muted-foreground">
            {t('laboratory.currencyHint', 'Введіть тариф у вашій валюті (грн/kWh)')}
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-blue-500/30 bg-blue-500/10">
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">{t('laboratory.perDay', 'На день')}</p>
            <p className="text-2xl font-bold text-blue-500">{calculations.kwhPerDay.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">kWh</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-green-500/10">
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">{t('laboratory.perMonth', 'На місяць')}</p>
            <p className="text-2xl font-bold text-green-500">{calculations.kwhPerMonth.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">kWh</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30 bg-yellow-500/10">
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">{t('laboratory.costPerDay', 'Вартість/день')}</p>
            <p className="text-2xl font-bold text-yellow-500">{calculations.costPerDay.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">грн</p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/10">
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">{t('laboratory.costPerMonth', 'Вартість/місяць')}</p>
            <p className="text-3xl font-bold text-primary">{calculations.costPerMonth.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">грн</p>
          </CardContent>
        </Card>
      </div>

      {/* Annual Summary */}
      <Card className="border-primary/30 bg-card">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium text-foreground">{t('laboratory.annualCost', 'Річна вартість')}</p>
                <p className="text-sm text-muted-foreground">
                  {calculations.kw.toFixed(2)} kW × {hoursPerDay} год × 365 днів
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{calculations.costPerYear.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">грн/рік</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
