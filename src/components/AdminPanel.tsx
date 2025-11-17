import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AdminPanel() {
  const { t } = useTranslation();
  const { isAdmin, isModerator, isLoading: roleLoading } = useUserRole();

  const { data: devices, isLoading: devicesLoading } = useQuery({
    queryKey: ['admin-devices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devices')
        .select(`
          id,
          name,
          device_id,
          status,
          last_seen,
          created_at,
          user_id
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: isAdmin || isModerator,
  });

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (!isAdmin && !isModerator) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Access denied. This page is only available to administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Database className="h-6 w-6" />
        <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.deviceLogs')}</CardTitle>
        </CardHeader>
        <CardContent>
          {devicesLoading ? (
            <p className="text-muted-foreground">{t('common.loading')}</p>
          ) : devices && devices.length > 0 ? (
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.timestamp')}</TableHead>
                    <TableHead>{t('admin.device')}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device: any) => (
                    <TableRow key={device.id}>
                      <TableCell className="text-sm">
                        {new Date(device.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{device.name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">
                            {device.device_id || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                          {device.status || 'offline'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No devices found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
