import { useLibrary } from '@/hooks/useLibrary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LibraryPage() {
  const { articles, loading } = useLibrary();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Group articles by category
  const articlesByCategory = articles.reduce((acc, article) => {
    const category = article.category || 'Інше';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(article);
    return acc;
  }, {} as Record<string, typeof articles>);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8" />
            Бібліотека Знань
          </h1>
          <p className="text-muted-foreground">
            Корисні матеріали та посібники для успішного вирощування
          </p>
        </div>

        {Object.keys(articlesByCategory).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Статей поки що немає. Зайдіть пізніше!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(articlesByCategory).map(([category, categoryArticles]) => (
              <div key={category}>
                <h2 className="text-2xl font-semibold mb-4">{category}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryArticles.map((article) => (
                    <Link key={article.id} to={`/library/${article.id}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                          <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                          <CardDescription className="line-clamp-3">
                            {article.content?.substring(0, 150)}...
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
