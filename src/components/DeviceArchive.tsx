import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Archive, RotateCcw, Trash2, ChevronLeft, BarChart3 } from 'lucide-react';
import { useDevices } from '@/hooks/useDevices';
import { SensorChart } from '@/components/SensorChart';
import { DeviceControls } from '@/components/DeviceControls';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

export function DeviceArchive() {
  const { t } = useTranslation();
  const { devices, loading, deleteDevice, restoreDevice } = useDevices();
  const archived = useMemo(
    () => devices.filter(d => d.lifecycle === 'archived'),
    [devices]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const selected = archived.find(d => d.id === selectedId) || null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // ── Detail view ──
  if (selected) {
    return (
      <div className="flex-1 space-y-6 p-4 sm:p-6 pb-20 lg:pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="min-h-[44px]">
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('archive.backToList', 'Back to Archive')}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="min-h-[44px]"
              onClick={async () => {
                await restoreDevice(selected.id);
                setSelectedId(null);
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('archive.restore', 'Restore')}
            </Button>
            <Button
              variant="destructive"
              className="min-h-[44px]"
              onClick={() => setConfirmDeleteId(selected.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('archive.deletePermanently', 'Delete Permanently')}
            </Button>
          </div>
        </div>

        <Card className="gradient-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-xl">{selected.name}</CardTitle>
              <Badge variant="secondary">{t('archive.archived', 'Archived')}</Badge>
            </div>
            {selected.location && (
              <p className="text-sm text-muted-foreground">{selected.location}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <BarChart3 className="h-4 w-4" />
              {t('archive.historyTitle', 'Historical telemetry')}
            </div>
            <SensorChart deviceId={selected.device_id} deviceName={selected.name} />
          </CardContent>
        </Card>

        {/* Read-only configuration snapshot */}
        <DeviceControls deviceId={selected.device_id} isReadOnly />

        <AlertDialog open={!!confirmDeleteId} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('archive.confirmDeleteTitle', 'Delete permanently?')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  'archive.confirmDeleteDescription',
                  'This will permanently remove the device and all its telemetry. This cannot be undone.'
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground"
                onClick={async () => {
                  if (confirmDeleteId) {
                    await deleteDevice(confirmDeleteId);
                    setConfirmDeleteId(null);
                    setSelectedId(null);
                  }
                }}
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {t('archive.title', 'Archived Devices')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('archive.subtitle', 'Decommissioned devices kept for historical reference. Restore to control again.')}
        </p>
      </div>

      {archived.length === 0 ? (
        <Card className="gradient-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Archive className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-semibold mb-2">
              {t('archive.empty', 'Archive is empty')}
            </p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {t(
                'archive.emptyDescription',
                'Devices you delete from the fleet are moved here so their grow history stays accessible.'
              )}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {archived.map(device => (
            <Card
              key={device.id}
              className="gradient-card border-border/50 hover:border-primary/40 transition-all opacity-80 hover:opacity-100"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Archive className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{device.name}</h3>
                      {device.location && (
                        <p className="text-xs text-muted-foreground truncate">{device.location}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {t('archive.archived', 'Archived')}
                  </Badge>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-h-[44px]"
                    onClick={() => setSelectedId(device.id)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {t('archive.viewHistory', 'View History')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 min-h-[44px]"
                    onClick={() => restoreDevice(device.id)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {t('archive.restore', 'Restore')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive min-h-[44px]"
                    onClick={() => setConfirmDeleteId(device.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('archive.confirmDeleteTitle', 'Delete permanently?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'archive.confirmDeleteDescription',
                'This will permanently remove the device and all its telemetry. This cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={async () => {
                if (confirmDeleteId) {
                  await deleteDevice(confirmDeleteId);
                  setConfirmDeleteId(null);
                }
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
