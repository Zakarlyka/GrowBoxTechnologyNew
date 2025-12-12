import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Library, FileText, Users } from 'lucide-react';
import { LibraryStrainManager } from '@/components/admin/LibraryStrainManager';
import { ArticleManager } from '@/components/admin/ArticleManager';
import { UserManager } from '@/components/admin/UserManager';

export default function AdminPage() {
  const { role, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read tab from URL, default to 'library'
  const currentTab = searchParams.get('tab') || 'library';
  
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (role !== 'admin' && role !== 'superadmin') {
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

        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="library" className="gap-2">
              <Library className="h-4 w-4" />
              Бібліотека Сортів
            </TabsTrigger>
            <TabsTrigger value="articles" className="gap-2">
              <FileText className="h-4 w-4" />
              Статті
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Користувачі
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-6">
            <LibraryStrainManager />
          </TabsContent>

          <TabsContent value="articles" className="mt-6">
            <ArticleManager />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
