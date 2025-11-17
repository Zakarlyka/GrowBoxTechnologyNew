import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert, Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AdminPanel() {
  const { t } = useTranslation();
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useUserRole();

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['admin-device-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('device_logs')
        .select(`
          id,
          metric,
          value,
          created_at,
          device:devices(
            id,
            name,
            device_id,
            user:profiles(
              full_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: isAdmin || isSuperAdmin,
  });

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (!isAdmin && !isSuperAdmin) {
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
          {logsLoading ? (
            <p className="text-muted-foreground">{t('common.loading')}</p>
          ) : logs && logs.length > 0 ? (
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.timestamp')}</TableHead>
                    <TableHead>{t('admin.device')}</TableHead>
                    <TableHead>{t('admin.user')}</TableHead>
                    <TableHead>{t('admin.metric')}</TableHead>
                    <TableHead className="text-right">{t('admin.value')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.device?.name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">
                            {log.device?.device_id || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {log.device?.user?.full_name || 'Unknown'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {log.device?.user?.email || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.metric}</TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(log.value).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t('admin.noLogs')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
