import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { StrainManager } from '@/components/admin/StrainManager';
import { ArticleManager } from '@/components/admin/ArticleManager';
import { UserManager } from '@/components/admin/UserManager';

export default function AdminPage() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Доступ заборонено. Ця сторінка доступна лише для адміністраторів.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Адмін-панель
            </CardTitle>
            <CardDescription>
              Керування системою Grow Box Technology
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="strains" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="strains">Керування Сортами</TabsTrigger>
            <TabsTrigger value="library">Керування Бібліотекою</TabsTrigger>
            <TabsTrigger value="users">Керування Користувачами</TabsTrigger>
          </TabsList>

          <TabsContent value="strains">
            <StrainManager />
          </TabsContent>

          <TabsContent value="library">
            <ArticleManager />
          </TabsContent>

          <TabsContent value="users">
            <UserManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
