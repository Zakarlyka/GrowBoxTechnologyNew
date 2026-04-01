import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Clock, Search, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useDevices } from '@/hooks/useDevices';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TIMEZONE_MAP = [
  { city: 'Kyiv', region: 'Europe', utc: '+2/+3', posix: 'EET-2EEST,M3.5.0/3,M10.5.0/4', offset: 2 },
  { city: 'Warsaw', region: 'Europe', utc: '+1/+2', posix: 'CET-1CEST,M3.5.0/2,M10.5.0/3', offset: 1 },
  { city: 'Berlin', region: 'Europe', utc: '+1/+2', posix: 'CET-1CEST,M3.5.0/2,M10.5.0/3', offset: 1 },
  { city: 'Paris', region: 'Europe', utc: '+1/+2', posix: 'CET-1CEST,M3.5.0/2,M10.5.0/3', offset: 1 },
  { city: 'London', region: 'Europe', utc: '+0/+1', posix: 'GMT0BST,M3.5.0/1,M10.5.0/2', offset: 0 },
  { city: 'Moscow', region: 'Europe', utc: '+3', posix: 'MSK-3', offset: 3 },
  { city: 'Istanbul', region: 'Europe', utc: '+3', posix: 'TRT-3', offset: 3 },
  { city: 'Helsinki', region: 'Europe', utc: '+2/+3', posix: 'EET-2EEST,M3.5.0/3,M10.5.0/4', offset: 2 },
  { city: 'Bucharest', region: 'Europe', utc: '+2/+3', posix: 'EET-2EEST,M3.5.0/3,M10.5.0/4', offset: 2 },
  { city: 'Athens', region: 'Europe', utc: '+2/+3', posix: 'EET-2EEST,M3.5.0/3,M10.5.0/4', offset: 2 },
  { city: 'Madrid', region: 'Europe', utc: '+1/+2', posix: 'CET-1CEST,M3.5.0/2,M10.5.0/3', offset: 1 },
  { city: 'Rome', region: 'Europe', utc: '+1/+2', posix: 'CET-1CEST,M3.5.0/2,M10.5.0/3', offset: 1 },
  { city: 'Amsterdam', region: 'Europe', utc: '+1/+2', posix: 'CET-1CEST,M3.5.0/2,M10.5.0/3', offset: 1 },
  { city: 'Lisbon', region: 'Europe', utc: '+0/+1', posix: 'WET0WEST,M3.5.0/1,M10.5.0/2', offset: 0 },
  { city: 'New York', region: 'Americas', utc: '-5/-4', posix: 'EST5EDT,M3.2.0,M11.1.0', offset: -5 },
  { city: 'Chicago', region: 'Americas', utc: '-6/-5', posix: 'CST6CDT,M3.2.0,M11.1.0', offset: -6 },
  { city: 'Denver', region: 'Americas', utc: '-7/-6', posix: 'MST7MDT,M3.2.0,M11.1.0', offset: -7 },
  { city: 'Los Angeles', region: 'Americas', utc: '-8/-7', posix: 'PST8PDT,M3.2.0,M11.1.0', offset: -8 },
  { city: 'São Paulo', region: 'Americas', utc: '-3', posix: 'BRT3', offset: -3 },
  { city: 'Buenos Aires', region: 'Americas', utc: '-3', posix: 'ART3', offset: -3 },
  { city: 'Toronto', region: 'Americas', utc: '-5/-4', posix: 'EST5EDT,M3.2.0,M11.1.0', offset: -5 },
  { city: 'Dubai', region: 'Asia', utc: '+4', posix: 'GST-4', offset: 4 },
  { city: 'Mumbai', region: 'Asia', utc: '+5:30', posix: 'IST-5:30', offset: 5.5 },
  { city: 'Bangkok', region: 'Asia', utc: '+7', posix: 'ICT-7', offset: 7 },
  { city: 'Singapore', region: 'Asia', utc: '+8', posix: 'SGT-8', offset: 8 },
  { city: 'Hong Kong', region: 'Asia', utc: '+8', posix: 'HKT-8', offset: 8 },
  { city: 'Shanghai', region: 'Asia', utc: '+8', posix: 'CST-8', offset: 8 },
  { city: 'Tokyo', region: 'Asia', utc: '+9', posix: 'JST-9', offset: 9 },
  { city: 'Seoul', region: 'Asia', utc: '+9', posix: 'KST-9', offset: 9 },
  { city: 'Sydney', region: 'Oceania', utc: '+10/+11', posix: 'AEST-10AEDT,M10.1.0,M4.1.0/3', offset: 10 },
  { city: 'Auckland', region: 'Oceania', utc: '+12/+13', posix: 'NZST-12NZDT,M9.5.0,M4.1.0/3', offset: 12 },
  { city: 'Honolulu', region: 'Americas', utc: '-10', posix: 'HST10', offset: -10 },
  { city: 'Anchorage', region: 'Americas', utc: '-9/-8', posix: 'AKST9AKDT,M3.2.0,M11.1.0', offset: -9 },
  { city: 'Cairo', region: 'Africa', utc: '+2', posix: 'EET-2', offset: 2 },
  { city: 'Johannesburg', region: 'Africa', utc: '+2', posix: 'SAST-2', offset: 2 },
  { city: 'Lagos', region: 'Africa', utc: '+1', posix: 'WAT-1', offset: 1 },
  { city: 'Nairobi', region: 'Africa', utc: '+3', posix: 'EAT-3', offset: 3 },
];

function getTimeForOffset(offsetHours: number): string {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const targetMs = utcMs + offsetHours * 3600000;
  const d = new Date(targetMs);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function ClockTimezoneWidget() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { devices } = useDevices();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [selectedPosix, setSelectedPosix] = useState('EET-2EEST,M3.5.0/3,M10.5.0/4');

  // Find the active device
  const activeDeviceId = searchParams.get('device');
  const activeDevice = useMemo(() => {
    if (activeDeviceId) return devices.find(d => d.id === activeDeviceId);
    return devices[0] || null;
  }, [devices, activeDeviceId]);

  // Load timezone from active device settings
  useEffect(() => {
    if (!activeDevice) return;
    const loadTz = async () => {
      const { data } = await supabase
        .from('devices')
        .select('settings')
        .eq('id', activeDevice.id)
        .single();
      if (data?.settings) {
        const tz = (data.settings as any).timezone;
        if (tz) setSelectedPosix(tz);
      }
    };
    loadTz();
  }, [activeDevice?.id]);

  const selectedTz = useMemo(() => 
    TIMEZONE_MAP.find(tz => tz.posix === selectedPosix) || TIMEZONE_MAP[0],
  [selectedPosix]);

  // Update clock every 30s
  useEffect(() => {
    const update = () => setCurrentTime(getTimeForOffset(selectedTz.offset));
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [selectedTz.offset]);

  const filtered = useMemo(() => {
    if (!search.trim()) return TIMEZONE_MAP;
    const q = search.toLowerCase();
    return TIMEZONE_MAP.filter(tz => 
      tz.city.toLowerCase().includes(q) || 
      tz.region.toLowerCase().includes(q) ||
      tz.utc.includes(q)
    );
  }, [search]);

  const handleSelect = async (posix: string) => {
    setSelectedPosix(posix);
    setOpen(false);
    setSearch('');

    if (!activeDevice) {
      toast.error('No active device selected');
      return;
    }

    // Load current settings, merge timezone
    const { data } = await supabase
      .from('devices')
      .select('settings')
      .eq('id', activeDevice.id)
      .single();

    const currentSettings = (data?.settings as Record<string, unknown>) || {};
    const { error } = await supabase
      .from('devices')
      .update({ settings: { ...currentSettings, timezone: posix } })
      .eq('id', activeDevice.id);

    if (error) {
      toast.error('Failed to save timezone');
    } else {
      toast.success(`Timezone updated: ${TIMEZONE_MAP.find(tz => tz.posix === posix)?.city}`);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 md:h-10 px-2 md:px-3 gap-1.5 font-mono text-sm tabular-nums"
        >
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="hidden sm:inline">{currentTime || '--:--'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-72 sm:w-80 p-0 bg-background border-border z-[100]"
        sideOffset={8}
      >
        {/* Current time display */}
        <div className="p-4 border-b border-border/50 text-center">
          <p className="text-3xl font-mono font-bold tabular-nums tracking-wider">
            {currentTime || '--:--'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedTz.city} · UTC{selectedTz.offset >= 0 ? '+' : ''}{selectedTz.offset}
          </p>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('controls.searchTimezone') || 'Search city...'}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>

        {/* Timezone list */}
        <ScrollArea className="h-56">
          <div className="p-1">
            {filtered.map((tz) => (
              <button
                key={tz.city}
                onClick={() => handleSelect(tz.posix)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                  "hover:bg-accent/50 cursor-pointer",
                  selectedPosix === tz.posix && "bg-accent text-accent-foreground"
                )}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{tz.city}</span>
                  <span className="text-xs text-muted-foreground">{tz.region} · UTC{tz.offset >= 0 ? '+' : ''}{tz.offset}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground tabular-nums">
                    {getTimeForOffset(tz.offset)}
                  </span>
                  {selectedPosix === tz.posix && <Check className="w-4 h-4 text-primary" />}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">No results</p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
