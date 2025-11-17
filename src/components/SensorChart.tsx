import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Download, RefreshCw, Pause, Play } from 'lucide-react';

interface SensorData {
  timestamp: string;
  time: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightLevel: number;
  waterLevel: number;
}

interface SensorChartProps {
  deviceId: string;
  deviceName: string;
}

export function SensorChart({ deviceId, deviceName }: SensorChartProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<SensorData[]>([]);
  const [isRealTime, setIsRealTime] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState({
    temperature: true,
    humidity: true,
    soilMoisture: true,
    lightLevel: false,
    waterLevel: false,
  });

  // Generate initial data
  useEffect(() => {
    const initialData: SensorData[] = [];
    const now = new Date();
    
    for (let i = 19; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 30000); // 30 seconds intervals
      initialData.push({
        timestamp: timestamp.toISOString(),
        time: timestamp.toLocaleTimeString(),
        temperature: 22 + Math.sin(i * 0.1) * 3 + Math.random() * 2,
        humidity: 60 + Math.sin(i * 0.15) * 15 + Math.random() * 5,
        soilMoisture: 45 + Math.sin(i * 0.08) * 10 + Math.random() * 5,
        lightLevel: 70 + Math.sin(i * 0.12) * 20 + Math.random() * 5,
        waterLevel: 80 - i * 0.5 + Math.random() * 3,
      });
    }
    
    setData(initialData);
  }, []);

  // Real-time data updates
  useEffect(() => {
    if (!isRealTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const newPoint: SensorData = {
        timestamp: now.toISOString(),
        time: now.toLocaleTimeString(),
        temperature: 22 + Math.sin(Date.now() * 0.0001) * 3 + Math.random() * 2,
        humidity: 60 + Math.sin(Date.now() * 0.00015) * 15 + Math.random() * 5,
        soilMoisture: 45 + Math.sin(Date.now() * 0.00008) * 10 + Math.random() * 5,
        lightLevel: 70 + Math.sin(Date.now() * 0.00012) * 20 + Math.random() * 5,
        waterLevel: Math.max(20, 80 - Math.random() * 2),
      };

      setData(prev => {
        const updated = [...prev.slice(1), newPoint]; // Keep last 20 points
        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isRealTime]);

  const toggleMetric = (metric: keyof typeof selectedMetrics) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const exportData = () => {
    const csvContent = [
      ['Timestamp', 'Temperature (°C)', 'Humidity (%)', 'Soil Moisture (%)', 'Light Level (%)', 'Water Level (%)'].join(','),
      ...data.map(point => [
        point.timestamp,
        point.temperature.toFixed(1),
        point.humidity.toFixed(1),
        point.soilMoisture.toFixed(1),
        point.lightLevel.toFixed(1),
        point.waterLevel.toFixed(1)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deviceName}-sensor-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const refreshData = () => {
    // Force a refresh of the chart
    setIsRealTime(false);
    setTimeout(() => setIsRealTime(true), 100);
  };

  const metricColors = {
    temperature: '#ef4444', // red
    humidity: '#3b82f6',    // blue
    soilMoisture: '#10b981', // green
    lightLevel: '#f59e0b',   // yellow
    waterLevel: '#06b6d4',   // cyan
  };

  const metricLabels = {
    temperature: t('sensors.temperature'),
    humidity: t('sensors.humidity'),
    soilMoisture: t('sensors.soilMoisture'),
    lightLevel: t('sensors.lightLevel'),
    waterLevel: t('sensors.waterLevel'),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {t('sensors.realTimeChart')} - {deviceName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isRealTime ? "default" : "secondary"}>
              {isRealTime ? t('sensors.live') : t('sensors.paused')}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsRealTime(!isRealTime)}
            >
              {isRealTime ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={refreshData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={exportData}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {Object.entries(selectedMetrics).map(([metric, selected]) => (
            <Button
              key={metric}
              variant={selected ? "default" : "outline"}
              size="sm"
              onClick={() => toggleMetric(metric as keyof typeof selectedMetrics)}
              className="text-xs"
            >
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ 
                  backgroundColor: selected 
                    ? metricColors[metric as keyof typeof metricColors]
                    : 'transparent',
                  border: selected ? 'none' : '2px solid currentColor'
                }}
              />
              {metricLabels[metric as keyof typeof metricLabels]}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(label) => `Time: ${label}`}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}${name.includes('temperature') ? '°C' : '%'}`,
                  metricLabels[name as keyof typeof metricLabels] || name
                ]}
              />
              <Legend />
              
              {selectedMetrics.temperature && (
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke={metricColors.temperature}
                  strokeWidth={2}
                  dot={false}
                  name="temperature"
                />
              )}
              {selectedMetrics.humidity && (
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke={metricColors.humidity}
                  strokeWidth={2}
                  dot={false}
                  name="humidity"
                />
              )}
              {selectedMetrics.soilMoisture && (
                <Line
                  type="monotone"
                  dataKey="soilMoisture"
                  stroke={metricColors.soilMoisture}
                  strokeWidth={2}
                  dot={false}
                  name="soilMoisture"
                />
              )}
              {selectedMetrics.lightLevel && (
                <Line
                  type="monotone"
                  dataKey="lightLevel"
                  stroke={metricColors.lightLevel}
                  strokeWidth={2}
                  dot={false}
                  name="lightLevel"
                />
              )}
              {selectedMetrics.waterLevel && (
                <Line
                  type="monotone"
                  dataKey="waterLevel"
                  stroke={metricColors.waterLevel}
                  strokeWidth={2}
                  dot={false}
                  name="waterLevel"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}