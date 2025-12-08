import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart-simple';
import { 
  TrendingUp, 
  TrendingDown, 
  Download,
  Calendar,
  Thermometer,
  Droplets,
  Sprout,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Zap,
  Coins,
  Calculator
} from 'lucide-react';

interface Device {
  id: string;
  name: string;
  device_id: string;
}

interface LogEntry {
  id: string;
  device_id: string;
  created_at: string;
  temp?: number;
  hum?: number;
  soil_moisture?: number;
  light_level?: number;
}

interface ChartDataPoint {
  time: string;
  timestamp: string;
  temp?: number;
  hum?: number;
  soil_moisture?: number;
}

// Electricity Cost Calculator Section - context-aware based on device settings
interface ElectricityCostSectionProps {
  selectedDeviceId: string;
  devices: Device[];
}

const ElectricityCostSection = ({ selectedDeviceId, devices }: ElectricityCostSectionProps) => {
  const [wattage, setWattage] = useState<number>(400);
  const [hoursPerDay, setHoursPerDay] = useState<number>(18);
  const [costPerKwh, setCostPerKwh] = useState<number>(2.64);
  const [deviceLightHours, setDeviceLightHours] = useState<number | null>(null);

  // Fetch device settings when device changes
  useEffect(() => {
    const fetchDeviceSettings = async () => {
      if (!selectedDeviceId) return;
      
      try {
        const { data, error } = await supabase
          .from('devices')
          .select('settings')
          .eq('id', selectedDeviceId)
          .single();

        if (error) throw error;
        
        const settings = data?.settings as any;
        if (settings) {
          const startH = settings.light_start_h ?? 6;
          const endH = settings.light_end_h ?? 24;
          let hours = endH - startH;
          if (hours < 0) hours += 24;
          setDeviceLightHours(hours);
          setHoursPerDay(hours);
        }
      } catch (error) {
        console.error('Error fetching device settings:', error);
      }
    };

    fetchDeviceSettings();
  }, [selectedDeviceId]);

  const calculations = useMemo(() => {
    const kw = wattage / 1000;
    const kwhPerDay = kw * hoursPerDay;
    const kwhPerMonth = kwhPerDay * 30;
    const costPerDay = kwhPerDay * costPerKwh;
    const costPerMonth = kwhPerMonth * costPerKwh;
    const costPerYear = costPerMonth * 12;

    return { kw, kwhPerDay, kwhPerMonth, costPerDay, costPerMonth, costPerYear };
  }, [wattage, hoursPerDay, costPerKwh]);

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);

  return (
    <Card className="gradient-card border-yellow-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <Zap className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">
                Вартість електроенергії
              </CardTitle>
              <CardDescription className="text-sm">
                Калькулятор витрат для {selectedDevice?.name || 'пристрою'}
                {deviceLightHours !== null && (
                  <Badge variant="outline" className="ml-2 text-yellow-500 border-yellow-500/30">
                    Розклад: {deviceLightHours}год/день
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
          <Calculator className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Wattage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-yellow-500" />
                Потужність лампи
              </Label>
              <span className="text-lg font-bold text-foreground">{wattage} W</span>
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-blue-500" />
                Годин на день
              </Label>
              <span className="text-lg font-bold text-foreground">{hoursPerDay} год</span>
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
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm">
              <Coins className="h-4 w-4 text-green-500" />
              Тариф за кВт·год
            </Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={costPerKwh}
              onChange={(e) => setCostPerKwh(Math.max(0, parseFloat(e.target.value) || 0))}
              className="bg-background text-foreground border-input text-lg"
            />
            <p className="text-xs text-muted-foreground">
              Введіть тариф у вашій валюті (грн/kWh)
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-blue-500/30 bg-blue-500/10">
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">На день</p>
              <p className="text-2xl font-bold text-blue-500">{calculations.kwhPerDay.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">kWh</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/30 bg-green-500/10">
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">На місяць</p>
              <p className="text-2xl font-bold text-green-500">{calculations.kwhPerMonth.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">kWh</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/30 bg-yellow-500/10">
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">Вартість/день</p>
              <p className="text-2xl font-bold text-yellow-500">{calculations.costPerDay.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">грн</p>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/10">
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">Вартість/місяць</p>
              <p className="text-3xl font-bold text-primary">{calculations.costPerMonth.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">грн</p>
            </CardContent>
          </Card>
        </div>

        {/* Annual Summary */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3">
            <Calculator className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium text-foreground">Річна вартість</p>
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
  );
};

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleLines, setVisibleLines] = useState({
    temp: true,
    hum: true,
    soil_moisture: true
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  // Fetch user devices
  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, [user]);

  // Fetch logs when device or date range changes
  useEffect(() => {
    if (selectedDeviceId) {
      fetchLogs();
    }
  }, [selectedDeviceId, timeRange, dateFrom, dateTo]);

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('id, name, device_id')
        .eq('user_id', user!.id)
        .order('name');

      if (error) throw error;
      setDevices(data || []);
      if (data && data.length > 0) {
        setSelectedDeviceId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let startTime: Date;
      let endTime: Date = new Date();

      if (dateFrom && dateTo) {
        startTime = new Date(dateFrom);
        startTime.setHours(0, 0, 0, 0);
        endTime = new Date(dateTo);
        endTime.setHours(23, 59, 59, 999);
      } else {
        const hoursMap: Record<string, number> = {
          '24h': 24,
          '7d': 168,
          '30d': 720
        };
        const hours = hoursMap[timeRange] || 24;
        startTime = new Date();
        startTime.setHours(startTime.getHours() - hours);
      }

      const selectedDevice = devices.find(d => d.id === selectedDeviceId);
      if (!selectedDevice) return;

      const { data, error } = await (supabase as any)
        .from('device_logs')
        .select('*')
        .eq('device_id', selectedDevice.device_id)
        .gte('created_at', startTime.toISOString())
        .lte('created_at', endTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setLogs(data || []);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    if (logs.length === 0) return null;

    const temps = logs.map(l => l.temp).filter((v): v is number => v !== undefined && v !== null);
    const hums = logs.map(l => l.hum).filter((v): v is number => v !== undefined && v !== null);
    const soils = logs.map(l => l.soil_moisture).filter((v): v is number => v !== undefined && v !== null);

    const calcStats = (arr: number[]) => {
      if (arr.length === 0) return { avg: 0, min: 0, max: 0, trend: 'stable' as const };
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const trend = arr.length > 1 ? (arr[0] > arr[arr.length - 1] ? 'up' : arr[0] < arr[arr.length - 1] ? 'down' : 'stable') : 'stable';
      return { avg, min, max, trend };
    };

    return {
      temp: calcStats(temps),
      hum: calcStats(hums),
      soil: calcStats(soils)
    };
  }, [logs]);

  // Prepare chart data (reversed for chronological order)
  const chartData = useMemo(() => {
    const sortedLogs = [...logs].reverse();
    
    // Group by time intervals for cleaner chart
    const interval = timeRange === '24h' ? 30 : timeRange === '7d' ? 360 : 1440; // minutes
    const grouped: Record<string, LogEntry[]> = {};

    sortedLogs.forEach(log => {
      const date = new Date(log.created_at);
      const key = new Date(Math.floor(date.getTime() / (interval * 60 * 1000)) * (interval * 60 * 1000)).toISOString();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(log);
    });

    return Object.entries(grouped).map(([timestamp, points]) => {
      const avgTemp = points.filter(p => p.temp).reduce((a, b) => a + (b.temp || 0), 0) / points.filter(p => p.temp).length;
      const avgHum = points.filter(p => p.hum).reduce((a, b) => a + (b.hum || 0), 0) / points.filter(p => p.hum).length;
      const avgSoil = points.filter(p => p.soil_moisture).reduce((a, b) => a + (b.soil_moisture || 0), 0) / points.filter(p => p.soil_moisture).length;

      const date = new Date(timestamp);
      const timeLabel = timeRange === '24h' 
        ? date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', hour: '2-digit' });

      return {
        time: timeLabel,
        timestamp,
        temp: isNaN(avgTemp) ? undefined : Number(avgTemp.toFixed(1)),
        hum: isNaN(avgHum) ? undefined : Number(avgHum.toFixed(0)),
        soil_moisture: isNaN(avgSoil) ? undefined : Number(avgSoil.toFixed(0))
      };
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [logs, timeRange]);

  // Pagination for table
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return logs.slice(start, start + rowsPerPage);
  }, [logs, currentPage]);

  const totalPages = Math.ceil(logs.length / rowsPerPage);

  // Export CSV
  const exportCSV = () => {
    if (logs.length === 0) return;

    const selectedDevice = devices.find(d => d.id === selectedDeviceId);
    const csv = [
      ['Timestamp', 'Device', 'Temperature (°C)', 'Humidity (%)', 'Soil Moisture (%)', 'Light'].join(','),
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString('uk-UA'),
        selectedDevice?.name || '',
        log.temp ?? '',
        log.hum ?? '',
        log.soil_moisture ?? '',
        log.light_level ?? ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${selectedDevice?.name || 'device'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleLine = (line: 'temp' | 'hum' | 'soil_moisture') => {
    setVisibleLines(prev => ({ ...prev, [line]: !prev[line] }));
  };

  const handleQuickRange = (range: string) => {
    setTimeRange(range);
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Аналітика та історія
          </h1>
          <p className="text-muted-foreground">
            Детальний аналіз даних сенсорів
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" disabled={logs.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Експорт CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="gradient-card border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Device Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Пристрій:</label>
              <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Оберіть пристрій" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map(device => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick Ranges */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Період:</label>
              <div className="flex gap-1">
                {[
                  { value: '24h', label: '24 год' },
                  { value: '7d', label: '7 днів' },
                  { value: '30d', label: '30 днів' }
                ].map(range => (
                  <Button
                    key={range.value}
                    variant={timeRange === range.value && !dateFrom ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleQuickRange(range.value)}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Date Range Picker */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn('w-[130px] justify-start text-left font-normal', !dateFrom && 'text-muted-foreground')}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'dd MMM yyyy', { locale: uk }) : 'Від'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground">—</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn('w-[130px] justify-start text-left font-normal', !dateTo && 'text-muted-foreground')}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'dd MMM yyyy', { locale: uk }) : 'До'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}
                >
                  Скинути
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Середня температура
              </CardTitle>
              <Thermometer className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.temp.avg.toFixed(1)}°C</div>
              <div className="flex items-center gap-2 mt-1">
                {statistics.temp.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-red-500" />
                ) : statistics.temp.trend === 'down' ? (
                  <TrendingDown className="h-3 w-3 text-blue-500" />
                ) : null}
                <span className="text-xs text-muted-foreground">
                  Min: {statistics.temp.min.toFixed(1)}° / Max: {statistics.temp.max.toFixed(1)}°
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Середня вологість
              </CardTitle>
              <Droplets className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.hum.avg.toFixed(0)}%</div>
              <div className="flex items-center gap-2 mt-1">
                {statistics.hum.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                ) : statistics.hum.trend === 'down' ? (
                  <TrendingDown className="h-3 w-3 text-orange-500" />
                ) : null}
                <span className="text-xs text-muted-foreground">
                  Min: {statistics.hum.min.toFixed(0)}% / Max: {statistics.hum.max.toFixed(0)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Середня вологість ґрунту
              </CardTitle>
              <Sprout className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.soil.avg.toFixed(0)}%</div>
              <div className="flex items-center gap-2 mt-1">
                {statistics.soil.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : statistics.soil.trend === 'down' ? (
                  <TrendingDown className="h-3 w-3 text-yellow-500" />
                ) : null}
                <span className="text-xs text-muted-foreground">
                  Min: {statistics.soil.min.toFixed(0)}% / Max: {statistics.soil.max.toFixed(0)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Chart */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Графік показників
            </CardTitle>
            <div className="flex gap-2">
              <Badge
                variant={visibleLines.temp ? 'default' : 'outline'}
                className="cursor-pointer"
                style={{ backgroundColor: visibleLines.temp ? 'hsl(0 75% 60%)' : undefined }}
                onClick={() => toggleLine('temp')}
              >
                🌡️ Температура
              </Badge>
              <Badge
                variant={visibleLines.hum ? 'default' : 'outline'}
                className="cursor-pointer"
                style={{ backgroundColor: visibleLines.hum ? 'hsl(210 100% 56%)' : undefined }}
                onClick={() => toggleLine('hum')}
              >
                💧 Вологість
              </Badge>
              <Badge
                variant={visibleLines.soil_moisture ? 'default' : 'outline'}
                className="cursor-pointer"
                style={{ backgroundColor: visibleLines.soil_moisture ? 'hsl(120 60% 45%)' : undefined }}
                onClick={() => toggleLine('soil_moisture')}
              >
                🌱 Ґрунт
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Немає даних для відображення</p>
            </div>
          ) : (
            <div className="h-[400px] w-full">
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    {visibleLines.temp && (
                      <Line
                        type="monotone"
                        dataKey="temp"
                        stroke="hsl(0 75% 60%)"
                        strokeWidth={2}
                        name="Температура (°C)"
                        dot={false}
                      />
                    )}
                    {visibleLines.hum && (
                      <Line
                        type="monotone"
                        dataKey="hum"
                        stroke="hsl(210 100% 56%)"
                        strokeWidth={2}
                        name="Вологість (%)"
                        dot={false}
                      />
                    )}
                    {visibleLines.soil_moisture && (
                      <Line
                        type="monotone"
                        dataKey="soil_moisture"
                        stroke="hsl(120 60% 45%)"
                        strokeWidth={2}
                        name="Вологість ґрунту (%)"
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Детальні дані ({logs.length} записів)
            </CardTitle>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-muted-foreground">Немає даних за обраний період</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Час</TableHead>
                    <TableHead className="text-right">Температура</TableHead>
                    <TableHead className="text-right">Вологість</TableHead>
                    <TableHead className="text-right">Вологість ґрунту</TableHead>
                    <TableHead className="text-right">Освітлення</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {new Date(log.created_at).toLocaleString('uk-UA', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.temp !== null && log.temp !== undefined ? (
                          <Badge variant="outline" className="text-red-400 border-red-400/30">
                            {log.temp.toFixed(1)}°C
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.hum !== null && log.hum !== undefined ? (
                          <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                            {log.hum.toFixed(0)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.soil_moisture !== null && log.soil_moisture !== undefined ? (
                          <Badge variant="outline" className="text-green-400 border-green-400/30">
                            {log.soil_moisture.toFixed(0)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.light_level !== null && log.light_level !== undefined ? (
                          <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">
                            {log.light_level > 50 ? '☀️ ON' : '🌙 OFF'}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Insights - Electricity Cost Calculator */}
      <ElectricityCostSection 
        selectedDeviceId={selectedDeviceId} 
        devices={devices} 
      />
    </div>
  );
};

export default AnalyticsPage;