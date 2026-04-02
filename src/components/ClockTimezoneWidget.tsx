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
  { city: 'Kyiv', region: 'Europe', iana: 'Europe/Kyiv', posix: 'EET-2EEST,M3.5.0/3,M10.5.0/4' },
  { city: 'Warsaw', region: 'Europe', iana: 'Europe/Warsaw', posix: 'CET-1CEST,M3.5.0/2,M10.5.0/3' },
  { city: 'Berlin', region: 'Europe', iana: 'Europe/Berlin', posix: 'CET-1CEST,M3.5.0/2,M10.5.0/3' },
  { city: 'Paris', region: 'Europe', iana: 'Europe/Paris', posix: 'CET-1CEST,M3.5.0/2,M10.5.0/3' },
  { city: 'London', region: 'Europe', iana: 'Europe/London', posix: 'GMT0BST,M3.5.0/1,M10.5.0/2' },
  { city: 'Moscow', region: 'Europe', iana: 'Europe/Moscow', posix: 'MSK-3' },
  { city: 'Istanbul', region: 'Europe', iana: 'Europe/Istanbul', posix: 'TRT-3' },
  { city: 'Helsinki', region: 'Europe', iana: 'Europe/Helsinki', posix: 'EET-2EEST,M3.5.0/3,M10.5.0/4' },
  { city: 'Bucharest', region: 'Europe', iana: 'Europe/Bucharest', posix: 'EET-2EEST,M3.5.0/3,M10.5.0/4' },
  { city: 'Athens', region: 'Europe', iana: 'Europe/Athens', posix: 'EET-2EEST,M3.5.0/3,M10.5.0/4' },
  { city: 'Madrid', region: 'Europe', iana: 'Europe/Madrid', posix: 'CET-1CEST,M3.5.0/2,M10.5.0/3' },
  { city: 'Rome', region: 'Europe', iana: 'Europe/Rome', posix: 'CET-1CEST,M3.5.0/2,M10.5.0/3' },
  { city: 'Amsterdam', region: 'Europe', iana: 'Europe/Amsterdam', posix: 'CET-1CEST,M3.5.0/2,M10.5.0/3' },
  { city: 'Lisbon', region: 'Europe', iana: 'Europe/Lisbon', posix: 'WET0WEST,M3.5.0/1,M10.5.0/2' },
  { city: 'New York', region: 'Americas', iana: 'America/New_York', posix: 'EST5EDT,M3.2.0,M11.1.0' },
  { city: 'Chicago', region: 'Americas', iana: 'America/Chicago', posix: 'CST6CDT,M3.2.0,M11.1.0' },
  { city: 'Denver', region: 'Americas', iana: 'America/Denver', posix: 'MST7MDT,M3.2.0,M11.1.0' },
  { city: 'Los Angeles', region: 'Americas', iana: 'America/Los_Angeles', posix: 'PST8PDT,M3.2.0,M11.1.0' },
  { city: 'São Paulo', region: 'Americas', iana: 'America/Sao_Paulo', posix: 'BRT3' },
  { city: 'Buenos Aires', region: 'Americas', iana: 'America/Argentina/Buenos_Aires', posix: 'ART3' },
  { city: 'Toronto', region: 'Americas', iana: 'America/Toronto', posix: 'EST5EDT,M3.2.0,M11.1.0' },
  { city: 'Dubai', region: 'Asia', iana: 'Asia/Dubai', posix: 'GST-4' },
  { city: 'Mumbai', region: 'Asia', iana: 'Asia/Kolkata', posix: 'IST-5:30' },
  { city: 'Bangkok', region: 'Asia', iana: 'Asia/Bangkok', posix: 'ICT-7' },
  { city: 'Singapore', region: 'Asia', iana: 'Asia/Singapore', posix: 'SGT-8' },
  { city: 'Hong Kong', region: 'Asia', iana: 'Asia/Hong_Kong', posix: 'HKT-8' },
  { city: 'Shanghai', region: 'Asia', iana: 'Asia/Shanghai', posix: 'CST-8' },
  { city: 'Tokyo', region: 'Asia', iana: 'Asia/Tokyo', posix: 'JST-9' },
  { city: 'Seoul', region: 'Asia', iana: 'Asia/Seoul', posix: 'KST-9' },
  { city: 'Sydney', region: 'Oceania', iana: 'Australia/Sydney', posix: 'AEST-10AEDT,M10.1.0,M4.1.0/3' },
  { city: 'Auckland', region: 'Oceania', iana: 'Pacific/Auckland', posix: 'NZST-12NZDT,M9.5.0,M4.1.0/3' },
  { city: 'Honolulu', region: 'Americas', iana: 'Pacific/Honolulu', posix: 'HST10' },
  { city: 'Anchorage', region: 'Americas', iana: 'America/Anchorage', posix: 'AKST9AKDT,M3.2.0,M11.1.0' },
  { city: 'Cairo', region: 'Africa', iana: 'Africa/Cairo', posix: 'EET-2' },
  { city: 'Johannesburg', region: 'Africa', iana: 'Africa/Johannesburg', posix: 'SAST-2' },
  { city: 'Lagos', region: 'Africa', iana: 'Africa/Lagos', posix: 'WAT-1' },
  { city: 'Nairobi', region: 'Africa', iana: 'Africa/Nairobi', posix: 'EAT-3' },
];

function getTimeForIana(iana: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: iana,
    }).format(new Date());
  } catch {
    return '--:--';
  }
}

function getUtcOffsetLabel(iana: string): string {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: iana,
      timeZoneName: 'shortOffset',
    }).formatToParts(now);
    const offsetPart = parts.find(p => p.type === 'timeZoneName');
    return offsetPart?.value?.replace('GMT', 'UTC') || '';
  } catch {
    return '';
  }
}

export function ClockTimezoneWidget() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { devices } = useDevices();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [selectedPosix, setSelectedPosix] = useState('EET-2EEST,M3.5.0/3,M10.5.0/4');

  const activeDeviceId = searchParams.get('device');
  const activeDevice = useMemo(() => {
    if (activeDeviceId) return devices.find(d => d.id === activeDeviceId);
    return devices[0] || null;
  }, [devices, activeDeviceId]);

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

  useEffect(() => {
    const update = () => setCurrentTime(getTimeForIana(selectedTz.iana));
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [selectedTz.iana]);

  const filtered = useMemo(() => {
    if (!search.trim()) return TIMEZONE_MAP;
    const q = search.toLowerCase();
    return TIMEZONE_MAP.filter(tz =>
      tz.city.toLowerCase().includes(q) ||
      tz.region.toLowerCase().includes(q)
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
        className="w-72 sm:w-80 p-0 bg-popover border-border z-[100]"
        sideOffset={8}
      >
        <div className="p-4 border-b border-border text-center">
          <p className="text-3xl font-mono font-bold tabular-nums tracking-wider text-foreground">
            {currentTime || '--:--'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedTz.city} · {getUtcOffsetLabel(selectedTz.iana)}
          </p>
        </div>

        <div className="p-2 border-b border-border">
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

        <ScrollArea className="h-56">
          <div className="p-1">
            {filtered.map((tz) => {
              const isSelected = selectedPosix === tz.posix;
              return (
                <button
                  key={tz.city}
                  onClick={() => handleSelect(tz.posix)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                    "hover:bg-accent/50 cursor-pointer",
                    isSelected && "bg-accent text-accent-foreground"
                  )}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-foreground">{tz.city}</span>
                    <span className="text-xs text-muted-foreground">
                      {tz.region} · {getUtcOffsetLabel(tz.iana)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground tabular-nums">
                      {getTimeForIana(tz.iana)}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">No results</p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
