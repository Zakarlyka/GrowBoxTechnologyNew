import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Sprout, 
  Leaf, 
  Flower2, 
  Stethoscope, 
  FlaskConical,
  Search,
  ArrowLeft,
  BookOpen,
  Loader2
} from 'lucide-react';
import { ArticleReader } from './ArticleReader';

interface Article {
  id: number;
  title: string;
  category: string;
  content: string;
  created_at: string;
  image_url: string | null;
}

export function KnowledgeBase() {
  const { t } = useTranslation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Category definitions with translation keys
  const CATEGORIES = [
    { id: 'germination', translationKey: 'library.germination', icon: Sprout, emoji: '🌱', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' },
    { id: 'vegetation', translationKey: 'library.vegetation', icon: Leaf, emoji: '🌿', color: 'bg-green-500/10 border-green-500/30 text-green-500' },
    { id: 'flowering', translationKey: 'library.flowering', icon: Flower2, emoji: '🌸', color: 'bg-pink-500/10 border-pink-500/30 text-pink-500' },
    { id: 'troubleshooting', translationKey: 'library.troubleshooting', icon: Stethoscope, emoji: '🚑', color: 'bg-red-500/10 border-red-500/30 text-red-500' },
    { id: 'nutrients', translationKey: 'library.nutrients', icon: FlaskConical, emoji: '🧪', color: 'bg-purple-500/10 border-purple-500/30 text-purple-500' },
  ];

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles((data as Article[]) || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesCategory = !selectedCategory || 
      article.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getArticleExcerpt = (content: string) => {
    const plainText = content.replace(/[#*`_\[\]]/g, '').trim();
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  };

  const getCategoryInfo = (categoryName: string) => {
    return CATEGORIES.find(c => 
      c.id === categoryName.toLowerCase() || 
      categoryName.toLowerCase().includes(c.id)
    ) || CATEGORIES[0];
  };

  const getArticleCountByCategory = (categoryId: string) => {
    return articles.filter(a => 
      a.category?.toLowerCase() === categoryId.toLowerCase() ||
      a.category?.toLowerCase().includes(categoryId)
    ).length;
  };

  const getArticleCountText = (count: number) => {
    return `${count} ${count === 1 ? t('library.article') : t('library.articles')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Article Reader View
  if (selectedArticle) {
    return (
      <ArticleReader 
        article={selectedArticle} 
        onBack={() => setSelectedArticle(null)} 
      />
    );
  }

  // Category Articles View
  if (selectedCategory) {
    const categoryInfo = CATEGORIES.find(c => c.id === selectedCategory);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedCategory(null)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('library.back')}
          </Button>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {categoryInfo?.emoji} {categoryInfo ? t(categoryInfo.translationKey) : selectedCategory}
          </h2>
          <Badge variant="secondary">{getArticleCountText(filteredArticles.length)}</Badge>
        </div>

        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('library.noArticlesInCategory')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredArticles.map((article) => (
              <Card 
                key={article.id}
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                onClick={() => setSelectedArticle(article)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {article.image_url && (
                      <img 
                        src={article.image_url} 
                        alt={article.title}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      {/* Title is dynamic content - not translated */}
                      <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {getArticleExcerpt(article.content)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(article.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Categories Grid View (Default)
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('library.searchArticles')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-background/50"
        />
      </div>

      {/* Search Results */}
      {searchQuery ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {t('library.searchResults')} ({filteredArticles.length})
          </h2>
          {filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {t('library.nothingFound', { query: searchQuery })}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredArticles.map((article) => {
                const catInfo = getCategoryInfo(article.category);
                return (
                  <Card 
                    key={article.id}
                    className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-xs border ${catInfo.color}`}>
                          {catInfo.emoji} {article.category}
                        </Badge>
                      </div>
                      {/* Title is dynamic content - not translated */}
                      <h3 className="font-semibold text-foreground mb-1">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {getArticleExcerpt(article.content)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Categories Grid */
        <>
          <h2 className="text-lg font-semibold">{t('library.categories')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const articleCount = getArticleCountByCategory(category.id);
              
              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer hover:shadow-lg transition-all border-2 hover:scale-[1.02] ${category.color}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{category.emoji}</div>
                    <h3 className="font-semibold text-lg text-foreground mb-1">
                      {t(category.translationKey)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getArticleCountText(articleCount)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Articles */}
          {articles.length > 0 && (
            <div className="space-y-4 mt-8">
              <h2 className="text-lg font-semibold">{t('library.recentArticles')}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {articles.slice(0, 4).map((article) => {
                  const catInfo = getCategoryInfo(article.category);
                  return (
                    <Card 
                      key={article.id}
                      className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <CardContent className="p-4">
                        <Badge className={`text-xs border mb-2 ${catInfo.color}`}>
                          {catInfo.emoji} {article.category}
                        </Badge>
                        {/* Title is dynamic content - not translated */}
                        <h3 className="font-semibold text-foreground line-clamp-1">
                          {article.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {getArticleExcerpt(article.content)}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}