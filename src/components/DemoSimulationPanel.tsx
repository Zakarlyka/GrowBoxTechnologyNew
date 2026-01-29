import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Flame, Snowflake, Droplets, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DemoSimulationPanelProps {
  deviceId: string;
}

export function DemoSimulationPanel({ deviceId }: DemoSimulationPanelProps) {
  const [isSending, setIsSending] = useState<string | null>(null);

  const simulateSensor = async (
    label: string,
    data: { temperature?: number; humidity?: number; soil_moisture?: number }
  ) => {
    setIsSending(label);
    
    try {
      const { error } = await supabase
        .from('sensor_data')
        .insert({
          device_id: deviceId,
          temperature: data.temperature ?? null,
          humidity: data.humidity ?? null,
          soil_moisture: data.soil_moisture ?? null,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;

      toast.success(`⚡ Симуляція: ${label}`, {
        description: 'Дані відправлено. Перевірте сповіщення в Telegram!'
      });
    } catch (error: any) {
      console.error('Simulation error:', error);
      toast.error('Помилка симуляції', { description: error.message });
    } finally {
      setIsSending(null);
    }
  };

  const simulations = [
    {
      id: 'critical_temp',
      label: '🔥 Критична температура (45°C)',
      icon: Flame,
      data: { temperature: 45, humidity: 30 },
      color: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
    },
    {
      id: 'freezing',
      label: '❄️ Заморозки (5°C)',
      icon: Snowflake,
      data: { temperature: 5, humidity: 80 },
      color: 'bg-blue-500 hover:bg-blue-600 text-white'
    },
    {
      id: 'dry_soil',
      label: '💧 Сухий ґрунт (10%)',
      icon: Droplets,
      data: { temperature: 24, humidity: 50, soil_moisture: 10 },
      color: 'bg-warning hover:bg-warning/90 text-warning-foreground'
    },
    {
      id: 'normal',
      label: '✅ Норма (24°C, 60%)',
      icon: CheckCircle,
      data: { temperature: 24, humidity: 60, soil_moisture: 60 },
      color: 'bg-success hover:bg-success/90 text-success-foreground'
    }
  ];

  return (
    <Card className="border-2 border-warning/50 bg-warning/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="w-5 h-5 text-warning" />
          ⚡ Панель Симуляції Сенсорів
          <Badge variant="outline" className="ml-auto border-warning text-warning">
            Demo Mode
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Натисніть кнопку, щоб згенерувати тестові дані сенсорів. 
          Якщо порогові значення перевищено, ви отримаєте сповіщення в Telegram.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {simulations.map((sim) => (
            <Button
              key={sim.id}
              className={`h-auto py-3 px-4 flex items-center gap-2 justify-start ${sim.color}`}
              onClick={() => simulateSensor(sim.label, sim.data)}
              disabled={isSending !== null}
            >
              <sim.icon className="w-5 h-5 shrink-0" />
              <span className="text-left text-sm">
                {isSending === sim.label ? 'Відправка...' : sim.label}
              </span>
            </Button>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
          💡 Переконайтесь, що Telegram підключено в налаштуваннях акаунту та встановлено порогові значення.
        </p>
      </CardContent>
    </Card>
  );
}
