import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download } from 'lucide-react';
import { useDeviceLogs } from '@/hooks/useDeviceLogs';

interface LogsTableProps {
  deviceId: string;
}

export function LogsTable({ deviceId }: LogsTableProps) {
  const { logs, loading } = useDeviceLogs(deviceId);
  const [timeFilter, setTimeFilter] = useState<string>('24h');

  const filterLogs = () => {
    const now = new Date();
    const hours: Record<string, number> = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720,
    };

    const cutoff = new Date(now.getTime() - (hours[timeFilter] || 24) * 60 * 60 * 1000);
    return logs.filter(log => new Date(log.timestamp) >= cutoff);
  };

  const exportToCSV = () => {
    const filteredLogs = filterLogs();
    const csv = [
      ['Time', 'Temperature', 'Humidity', 'Soil Moisture', 'Light Level'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString('uk-UA'),
        log.temperature || '--',
        log.humidity || '--',
        log.soil_moisture || '--',
        log.light_level || '--',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `device_logs_${timeFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredLogs = filterLogs();

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Таблиця логів
          </CardTitle>
          <div className="flex items-center gap-3">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 година</SelectItem>
                <SelectItem value="6h">6 годин</SelectItem>
                <SelectItem value="24h">24 години</SelectItem>
                <SelectItem value="7d">7 днів</SelectItem>
                <SelectItem value="30d">30 днів</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Експорт
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Завантаження...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
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
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {new Date(log.timestamp).toLocaleString('uk-UA', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.temperature !== null && log.temperature !== undefined ? (
                        <Badge variant="outline" className="text-red-400 border-red-400/30">
                          {log.temperature.toFixed(1)}°C
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.humidity !== null && log.humidity !== undefined ? (
                        <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                          {log.humidity.toFixed(0)}%
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
                          {log.light_level.toFixed(0)}%
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
  );
}
