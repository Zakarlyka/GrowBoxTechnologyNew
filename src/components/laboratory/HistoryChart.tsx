import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface DataPoint {
  timestamp: string;
  value: number | null;
}

interface HistoryChartProps {
  data: DataPoint[];
  color: string;
  label: string;
  unit: string;
}

export function HistoryChart({ data, color, label, unit }: HistoryChartProps) {
  const chartData = useMemo(() => {
    return data
      .filter(d => d.value !== null)
      .map(d => ({
        timestamp: d.timestamp,
        time: format(parseISO(d.timestamp), 'dd.MM HH:mm'),
        value: d.value,
      }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            labelFormatter={(label) => label}
            formatter={(value: number) => [`${value.toFixed(2)}${unit}`, label]}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            name={label}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
