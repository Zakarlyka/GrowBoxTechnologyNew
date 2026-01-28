import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

interface Payment {
  id: string;
  created_at: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
}

export function PaymentHistory() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Mock data for now - will be replaced with real API call
      setPayments([
        {
          id: '1',
          created_at: new Date().toISOString(),
          amount: 0,
          status: 'completed',
          description: 'Free план активовано',
        },
      ]);
      setLoading(false);
    }
  }, [user]);

  const getStatusBadge = (status: Payment['status']) => {
    const variants = {
      completed: { variant: 'default' as const, text: 'Успішно', className: 'bg-success/10 text-success border-success' },
      pending: { variant: 'outline' as const, text: 'Очікується', className: 'bg-warning/10 text-warning border-warning' },
      failed: { variant: 'destructive' as const, text: 'Помилка', className: '' },
    };
    
    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-pulse text-muted-foreground">Завантаження...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Історія платежів
        </CardTitle>
        <CardDescription>
          Перегляд всіх ваших транзакцій та платежів
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Немає платежів</p>
            <p className="text-sm text-muted-foreground">Ваші платежі з'являться тут</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Опис</TableHead>
                <TableHead>Сума</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: uk })}
                  </TableCell>
                  <TableCell>{payment.description}</TableCell>
                  <TableCell>
                    {payment.amount === 0 ? 'Безкоштовно' : `${payment.amount} ₴`}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
