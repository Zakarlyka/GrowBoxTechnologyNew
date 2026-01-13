import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ParsedStrainData {
  name?: string;
  breeder?: string;
  type?: string;
  genotype?: string;
  genetics?: string;
  thc_percent?: number;
  flowering_days?: number;
  difficulty?: string;
  yield_indoor?: string;
  description?: string;
  growing_params?: {
    stages?: Array<{
      name: string;
      days_duration?: number;
      temp?: [number, number];
      humidity?: number;
      vpd?: string;
      ppfd?: string;
      ec?: string;
    }>;
    risks?: string[];
    morphology?: {
      stretch_ratio?: number;
      bud_density?: string;
      odor_intensity?: number;
    };
    resistance_rating?: {
      mold?: number;
      pests?: number;
      heat?: number;
      cold?: number;
    };
    nutrition_profile?: {
      feeder_type?: string;
    };
    phenotype?: {
      height_indoor?: string;
      aroma?: string;
      structure?: string;
    };
    recommendations?: {
      ph_soil?: string;
      ph_hydro?: string;
      training?: string;
      notes?: string;
    };
  };
}

interface AIStrainImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataParsed: (data: ParsedStrainData) => void;
}

export function AIStrainImportModal({ open, onOpenChange, onDataParsed }: AIStrainImportModalProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<ParsedStrainData | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast({
        title: 'Помилка',
        description: 'Вставте текст з даними про сорт',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setParsedPreview(null);

    try {
      const { data, error } = await supabase.functions.invoke('parse-strain-text', {
        body: { text: text.trim() }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.success && data?.data) {
        setParsedPreview(data.data);
        toast({
          title: '✅ Дані розпарсені',
          description: `Знайдено сорт: ${data.data.name || 'Невідомий'}`,
        });
      } else {
        throw new Error('Неочікувана відповідь від AI');
      }
    } catch (error: any) {
      console.error('[AIStrainImportModal] Error:', error);
      toast({
        title: 'Помилка аналізу',
        description: error.message || 'Не вдалося проаналізувати текст',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (parsedPreview) {
      onDataParsed(parsedPreview);
      onOpenChange(false);
      setText('');
      setParsedPreview(null);
      toast({
        title: '✅ Форму заповнено',
        description: 'Перевірте дані та збережіть сорт',
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setText('');
    setParsedPreview(null);
  };

  const exampleText = `Auto AK-47 Feminised by FastBuds
Sativa 60% / Indica 30% / Ruderalis 10%
Genetics: Colombian × Mexican × Thai × Afghan
THC: 20-24%
Flowering: 63-70 days from seed
Height: 80-120cm indoor
Yield: 400-500 g/m²

Climate Requirements:
- Seedling: 24-26°C, RH 70-80%
- Vegetation: 24-28°C, RH 55-65%
- Flowering: 22-26°C, RH 40-50%

Characteristics:
- High stretch ratio (x2.5)
- Dense buds
- Strong earthy/skunky aroma
- Medium mold resistance
- High heat tolerance
- Heavy feeder

Recommendations: LST and SCROG training recommended. Watch for calcium deficiency.`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Імпорт Даних Сорту
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="bg-primary/5 border-primary/20">
            <FileText className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Вставте текст з datasheet або опису сорту. AI автоматично розпарсить дані та заповнить форму.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="strain-text">Текст з даними про сорт</Label>
            <Textarea
              id="strain-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={exampleText}
              className="min-h-[200px] font-mono text-sm"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Підтримувані дані: назва, бридер, генетика, THC%, дні цвітіння, кліматичні умови по стадіям, резистентність, морфологія
            </p>
          </div>

          {parsedPreview && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Розпарсені дані
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                {parsedPreview.name && (
                  <div><span className="text-muted-foreground">Назва:</span> {parsedPreview.name}</div>
                )}
                {parsedPreview.breeder && (
                  <div><span className="text-muted-foreground">Бридер:</span> {parsedPreview.breeder}</div>
                )}
                {parsedPreview.type && (
                  <div><span className="text-muted-foreground">Тип:</span> {parsedPreview.type}</div>
                )}
                {parsedPreview.thc_percent && (
                  <div><span className="text-muted-foreground">THC:</span> {parsedPreview.thc_percent}%</div>
                )}
                {parsedPreview.flowering_days && (
                  <div><span className="text-muted-foreground">Цвітіння:</span> {parsedPreview.flowering_days} днів</div>
                )}
                {parsedPreview.difficulty && (
                  <div><span className="text-muted-foreground">Складність:</span> {parsedPreview.difficulty}</div>
                )}
              </div>

              {parsedPreview.growing_params?.stages && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">Стадії росту:</div>
                  <div className="flex flex-wrap gap-1">
                    {parsedPreview.growing_params.stages.map((stage, i) => (
                      <span key={i} className="text-xs bg-primary/10 px-2 py-1 rounded">
                        {stage.name}: {stage.temp?.[0]}-{stage.temp?.[1]}°C, {stage.humidity}% RH
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {parsedPreview.growing_params?.resistance_rating && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">Резистентність (1-5):</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span>Плісінь: {parsedPreview.growing_params.resistance_rating.mold}</span>
                    <span>Шкідники: {parsedPreview.growing_params.resistance_rating.pests}</span>
                    <span>Спека: {parsedPreview.growing_params.resistance_rating.heat}</span>
                    <span>Холод: {parsedPreview.growing_params.resistance_rating.cold}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Скасувати
          </Button>
          
          {!parsedPreview ? (
            <Button onClick={handleAnalyze} disabled={loading || !text.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Аналізую...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Аналізувати
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleApply} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Заповнити Форму
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
