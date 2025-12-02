import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart-simple';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Download,
  Calendar,
  Thermometer,
  Droplets,
  Sun,
  Sprout
} from 'lucide-react';

interface SensorData {
  created_at: string;
  temp?: number;
  hum?: number;
  soil_moisture?: number;
  light_level?: number;
  light_cycle_hours?: number;
  irrigation_time?: string;
}

interface Device {
  id: string;
  name: string;
  device_id: string;
  status: string;
}

interface ChartData {
  time: string;
  timestamp: string;
  [key: string]: string | number | undefined;
}

export function AdvancedCharts() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['temp', 'hum']);

  const metrics = [
    { key: 'temp', label: 'Air Temperature (°C)', color: '#3B82F6', icon: Thermometer },
    { key: 'hum', label: 'Air Humidity (%)', color: '#10B981', icon: Droplets },
    { key: 'soil_moisture', label: 'Soil Moisture (%)', color: '#8B5CF6', icon: Sprout },
    { key: 'light_level', label: 'Light Level (%)', color: '#F59E0B', icon: Sun },
    { key: 'light_cycle_hours', label: 'Photoperiod Length (h)', color: '#F97316', icon: Sun }
  ];

  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, [user]);

  useEffect(() => {
    if (devices.length > 0) {
      fetchChartData();
    }
  }, [devices, selectedDevice, timeRange, dateFrom, dateTo]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('device-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'device_logs'
        },
        () => {
          console.log('New log received, refreshing chart data');
          fetchChartData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [devices, selectedDevice, timeRange, dateFrom, dateTo]);

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('id, name, device_id, status')
        .eq('user_id', user!.id)
        .order('name');

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const fetchChartData = async () => {
    setLoading(true);
    try {
      let startTime: Date;
      let endTime: Date;

      // Use custom date range if both dates are selected
      if (dateFrom && dateTo) {
        startTime = new Date(dateFrom);
        startTime.setHours(0, 0, 0, 0);
        endTime = new Date(dateTo);
        endTime.setHours(23, 59, 59, 999);
      } else {
        // Otherwise use time range selector
        const hoursMap: Record<string, number> = {
          '1h': 1,
          '6h': 6,
          '24h': 24,
          '7d': 168,
          '30d': 720
        };
        const hours = hoursMap[timeRange] || 24;
        endTime = new Date();
        startTime = new Date();
        startTime.setHours(startTime.getHours() - hours);
      }

      let query = (supabase as any)
        .from('device_logs')
        .select('*')
        .gte('created_at', startTime.toISOString())
        .lte('created_at', endTime.toISOString())
        .order('created_at', { ascending: true });

      if (selectedDevice !== 'all') {
        query = query.eq('device_id', selectedDevice);
      } else {
        // Filter by user's devices
        const deviceIds = devices.map(d => d.id);
        if (deviceIds.length > 0) {
          query = query.in('device_id', deviceIds);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group data by time intervals for better visualization
      const groupedData = groupDataByTimeInterval((data as any) || [], timeRange);
      setChartData(groupedData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupDataByTimeInterval = (data: SensorData[], range: string): ChartData[] => {
    if (data.length === 0) return [];

    const intervalMinutes = range === '1h' ? 2 : range === '6h' ? 10 : range === '24h' ? 30 : range === '7d' ? 360 : 1440;
    const grouped: Record<string, SensorData[]> = {};

    data.forEach(point => {
      const date = new Date(point.created_at);
      const intervalKey = new Date(
        Math.floor(date.getTime() / (intervalMinutes * 60 * 1000)) * (intervalMinutes * 60 * 1000)
      ).toISOString();

      if (!grouped[intervalKey]) {
        grouped[intervalKey] = [];
      }
      grouped[intervalKey].push(point);
    });

    return Object.entries(grouped).map(([timestamp, points]) => {
      const averages: ChartData = {
        timestamp,
        time: formatTimeLabel(timestamp, range)
      };

      // Calculate averages for each metric
      metrics.forEach(metric => {
        const values = points
          .map(p => p[metric.key as keyof SensorData] as number)
          .filter(v => v !== undefined && v !== null && !isNaN(v));
        
        if (values.length > 0) {
          averages[metric.key as keyof ChartData] = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
        }
      });

      return averages;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const formatTimeLabel = (timestamp: string, range: string) => {
    const date = new Date(timestamp);
    
    switch (range) {
      case '1h':
      case '6h':
        return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
      case '24h':
        return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
      case '7d':
        return date.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric', hour: '2-digit' });
      case '30d':
        return date.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const toggleMetric = (metricKey: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricKey) 
        ? prev.filter(m => m !== metricKey)
        : [...prev, metricKey]
    );
  };

  const getStatistics = () => {
    if (chartData.length === 0) return null;

    const stats: Record<string, { current: number; avg: number; trend: 'up' | 'down' | 'stable' }> = {};

    selectedMetrics.forEach(metricKey => {
      const values = chartData
        .map(d => d[metricKey as keyof ChartData] as number)
        .filter(v => v !== undefined && !isNaN(v));

      if (values.length > 0) {
        const current = values[values.length - 1];
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const trend = values.length > 1 ? 
          (current > values[values.length - 2] ? 'up' : current < values[values.length - 2] ? 'down' : 'stable') 
          : 'stable';

        stats[metricKey] = { current, avg, trend };
      }
    });

    return stats;
  };

  const exportData = () => {
    if (chartData.length === 0) return;

    const csvContent = [
      ['Timestamp', ...selectedMetrics.map(m => metrics.find(metric => metric.key === m)?.label || m)],
      ...chartData.map(row => [
        row.timestamp,
        ...selectedMetrics.map(m => row[m as keyof ChartData] || '')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sensor_data_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const statistics = getStatistics();

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Advanced Analytics
          </h1>
          <p className="text-muted-foreground">
            Detailed sensor data visualization and analysis
          </p>
        </div>
        <Button onClick={exportData} variant="outline" className="glow-primary">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Device:</label>
          <Select value={selectedDevice} onValueChange={setSelectedDevice}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              {devices.map(device => (
                <SelectItem key={device.id} value={device.id}>
                  {device.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Quick Range:</label>
          <Select value={timeRange} onValueChange={(value) => {
            setTimeRange(value);
            setDateFrom(undefined);
            setDateTo(undefined);
          }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="6h">6 Hours</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Custom Range:</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                <Calendar className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "dd MMM yyyy") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="pointer-events-auto" />
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                <Calendar className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "dd MMM yyyy") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="pointer-events-auto" />
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
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {selectedMetrics.map(metricKey => {
            const metric = metrics.find(m => m.key === metricKey);
            const stat = statistics[metricKey];
            if (!metric || !stat) return null;

            const Icon = metric.icon || Activity;
            const TrendIcon = stat.trend === 'up' ? TrendingUp : stat.trend === 'down' ? TrendingDown : Activity;

            return (
              <Card key={metricKey} className="gradient-card border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.current.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <TrendIcon className={`h-3 w-3 mr-1 ${
                      stat.trend === 'up' ? 'text-success' : 
                      stat.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
                    }`} />
                    Avg: {stat.avg.toFixed(1)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Metric Selection */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>Select Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {metrics.map(metric => (
              <Badge
                key={metric.key}
                variant={selectedMetrics.includes(metric.key) ? "default" : "outline"}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => toggleMetric(metric.key)}
                style={{
                  backgroundColor: selectedMetrics.includes(metric.key) ? metric.color : undefined,
                  borderColor: metric.color
                }}
              >
                {metric.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="line" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="line">Line Chart</TabsTrigger>
          <TabsTrigger value="area">Area Chart</TabsTrigger>
          <TabsTrigger value="bar">Bar Chart</TabsTrigger>
        </TabsList>
        
        <TabsContent value="line">
          <Card className="gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-primary" />
                <span>Sensor Data Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="h-[400px] w-full">
                  <ChartContainer config={{}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend />
                        {selectedMetrics.map(metricKey => {
                          const metric = metrics.find(m => m.key === metricKey);
                          if (!metric) return null;
                          return (
                            <Line
                              key={metricKey}
                              type="monotone"
                              dataKey={metricKey}
                              stroke={metric.color}
                              strokeWidth={2}
                              name={metric.label}
                              connectNulls={false}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="area">
          <Card className="gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Area Chart View</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="h-[400px] w-full">
                  <ChartContainer config={{}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend />
                        {selectedMetrics.map((metricKey, index) => {
                          const metric = metrics.find(m => m.key === metricKey);
                          if (!metric) return null;
                          return (
                            <Area
                              key={metricKey}
                              type="monotone"
                              dataKey={metricKey}
                              stackId={index}
                              stroke={metric.color}
                              fill={metric.color}
                              fillOpacity={0.3}
                              name={metric.label}
                            />
                          );
                        })}
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bar">
          <Card className="gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Bar Chart View</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="h-[400px] w-full">
                  <ChartContainer config={{}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend />
                        {selectedMetrics.map(metricKey => {
                          const metric = metrics.find(m => m.key === metricKey);
                          if (!metric) return null;
                          return (
                            <Bar
                              key={metricKey}
                              dataKey={metricKey}
                              fill={metric.color}
                              name={metric.label}
                              fillOpacity={0.8}
                            />
                          );
                        })}
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}