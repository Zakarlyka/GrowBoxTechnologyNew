import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Thermometer, Droplets, Sun, Sprout, Cpu, Activity, TrendingUp, Plus, Settings, Trash2, Wifi, WifiOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart-simple';
import { useDevices } from '@/hooks/useDevices';
import { useSensorData } from '@/hooks/useSensorData';
import { AddDeviceDialog } from './AddDeviceDialog';
import { DeviceCard } from './DeviceCard';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
interface SensorData {
  time: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightLevel: number;
}
interface DeviceStatus {
  id: string;
  name: string;
  status: 'online' | 'offline';
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightLevel: number;
  lastSeen: string;
}
export function Dashboard() {
  const {
    t
  } = useTranslation();
  const {
    devices,
    loading,
    deleteDevice,
    fetchDevices
  } = useDevices();
  const {
    sensorData
  } = useSensorData();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const handleDeleteClick = (deviceId: string) => {
    setDeviceToDelete(deviceId);
    setDeleteDialogOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (deviceToDelete) {
      await deleteDevice(deviceToDelete);
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
    }
  };

  // Mock sensor data for chart (in real app, use data from useSensorData)
  const [chartData, setChartData] = useState<SensorData[]>([]);

  // Generate mock chart data
  useEffect(() => {
    const generateData = () => {
      const now = new Date();
      const newData: SensorData[] = [];
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        newData.push({
          time: time.toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          temperature: 22 + Math.random() * 8,
          humidity: 60 + Math.random() * 20,
          soilMoisture: 45 + Math.random() * 30,
          lightLevel: Math.max(0, 80 + Math.sin(i / 4) * 60 + Math.random() * 20)
        });
      }
      setChartData(newData);
    };
    generateData();
    const interval = setInterval(generateData, 5000);
    return () => clearInterval(interval);
  }, []);
  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const totalDevices = devices.length;
  const StatCard = ({
    title,
    value,
    unit,
    icon: Icon,
    trend
  }: any) => {
    return (
      <Card className="gradient-card border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {value}{unit}
          </div>
          {trend && (
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span>+2.5% from last hour</span>
            </p>
          )}
        </CardContent>
      </Card>
    );
  };
  return <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('dashboard.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <Button className="gradient-primary" onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('devices.addDevice')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('dashboard.totalDevices')} value={devices.length} unit="" icon={Cpu} />
        <StatCard title={t('dashboard.onlineDevices')} value={onlineDevices} unit="" icon={Activity} />
        <StatCard title={t('dashboard.temperature')} value={devices.length > 0 && devices[0].last_temp ? devices[0].last_temp.toFixed(1) : '--'} unit="°C" icon={Thermometer} trend={true} />
        <StatCard title={t('dashboard.humidity')} value={devices.length > 0 && devices[0].last_hum ? devices[0].last_hum.toFixed(0) : '--'} unit="%" icon={Droplets} />
      </div>

      {loading ? <div className="text-center py-12">
          <p className="text-muted-foreground">Завантаження пристроїв...</p>
        </div> : devices.length === 0 ? <Card className="gradient-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Cpu className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold mb-2">Немає пристроїв</p>
            <p className="text-muted-foreground mb-4">Додайте свій перший пристрій для моніторингу</p>
            <Button onClick={() => setAddDialogOpen(true)} className="gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Додати пристрій
            </Button>
          </CardContent>
        </Card> : <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {devices.map(device => <DeviceCard key={device.id} device={device} />)}
        </div>}

      <AddDeviceDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onDeviceAdded={fetchDevices} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити пристрій?</AlertDialogTitle>
            <AlertDialogDescription>
              Цю дію неможливо скасувати. Пристрій буде видалено назавжди.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}