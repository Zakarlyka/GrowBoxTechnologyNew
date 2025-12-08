import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Droplets, Thermometer, Flame, Snowflake } from 'lucide-react';

export function WaterMixingCalculator() {
  const { t } = useTranslation();
  const [hotTemp, setHotTemp] = useState<number>(60);
  const [coldTemp, setColdTemp] = useState<number>(15);
  const [targetTemp, setTargetTemp] = useState<number>(22);
  const [totalVolume, setTotalVolume] = useState<number>(10);

  const calculations = useMemo(() => {
    // Using the mixing equation: T_target = (V_hot * T_hot + V_cold * T_cold) / (V_hot + V_cold)
    // Solving for V_hot: V_hot = V_total * (T_target - T_cold) / (T_hot - T_cold)
    
    if (hotTemp <= coldTemp) {
      return { hotVolume: 0, coldVolume: totalVolume, isValid: false };
    }

    if (targetTemp < coldTemp || targetTemp > hotTemp) {
      return { hotVolume: 0, coldVolume: totalVolume, isValid: false };
    }

    const hotVolume = totalVolume * (targetTemp - coldTemp) / (hotTemp - coldTemp);
    const coldVolume = totalVolume - hotVolume;

    return {
      hotVolume: Math.max(0, hotVolume),
      coldVolume: Math.max(0, coldVolume),
      isValid: true,
    };
  }, [hotTemp, coldTemp, targetTemp, totalVolume]);

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hot Water */}
        <div className="space-y-4 p-4 rounded-lg border border-red-500/30 bg-red-500/5">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-500" />
              {t('laboratory.hotWater', 'Гаряча вода')}
            </Label>
            <span className="text-xl font-bold text-red-500">{hotTemp}°C</span>
          </div>
          <Slider
            value={[hotTemp]}
            onValueChange={(v) => setHotTemp(v[0])}
            min={30}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Cold Water */}
        <div className="space-y-4 p-4 rounded-lg border border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-blue-500" />
              {t('laboratory.coldWater', 'Холодна вода')}
            </Label>
            <span className="text-xl font-bold text-blue-500">{coldTemp}°C</span>
          </div>
          <Slider
            value={[coldTemp]}
            onValueChange={(v) => setColdTemp(v[0])}
            min={0}
            max={25}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Target Temperature */}
      <div className="space-y-4 p-4 rounded-lg border border-green-500/30 bg-green-500/5">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-green-500" />
            {t('laboratory.targetTemp', 'Бажана температура')}
          </Label>
          <span className="text-2xl font-bold text-green-500">{targetTemp}°C</span>
        </div>
        <Slider
          value={[targetTemp]}
          onValueChange={(v) => setTargetTemp(v[0])}
          min={coldTemp}
          max={hotTemp}
          step={0.5}
          className="w-full"
        />
      </div>

      {/* Total Volume */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-primary" />
          {t('laboratory.totalVolume', 'Загальний об\'єм (літрів)')}
        </Label>
        <Input
          type="number"
          min={1}
          max={1000}
          value={totalVolume}
          onChange={(e) => setTotalVolume(Math.max(1, parseFloat(e.target.value) || 1))}
          className="bg-background text-foreground border-input max-w-xs"
        />
      </div>

      {/* Results */}
      {calculations.isValid ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-red-500/30 bg-red-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Flame className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('laboratory.hotWater', 'Гаряча вода')}</p>
                    <p className="text-xs text-muted-foreground">{hotTemp}°C</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-red-500">{calculations.hotVolume.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">літрів</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/30 bg-blue-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Snowflake className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('laboratory.coldWater', 'Холодна вода')}</p>
                    <p className="text-xs text-muted-foreground">{coldTemp}°C</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-blue-500">{calculations.coldVolume.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">літрів</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-yellow-500/30 bg-yellow-500/10">
          <CardContent className="pt-6 text-center">
            <p className="text-yellow-500 font-medium">
              {t('laboratory.invalidRange', 'Бажана температура має бути між холодною та гарячою водою')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {calculations.isValid && (
        <Card className="border-green-500/30 bg-green-500/10">
          <CardContent className="pt-4">
            <div className="flex items-center justify-center gap-2 text-center">
              <Droplets className="h-5 w-5 text-green-500" />
              <p className="text-lg text-foreground">
                <span className="font-bold text-red-500">{calculations.hotVolume.toFixed(1)}л</span>
                <span className="text-muted-foreground mx-2">+</span>
                <span className="font-bold text-blue-500">{calculations.coldVolume.toFixed(1)}л</span>
                <span className="text-muted-foreground mx-2">=</span>
                <span className="font-bold text-green-500">{totalVolume}л @ {targetTemp}°C</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
