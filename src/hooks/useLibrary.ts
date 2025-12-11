import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Article {
  id: number;
  title: string;
  category: string | null;
  content: string | null;
  created_at: string;
}

export function useLibrary() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setArticles(data || []);
      } catch (error) {
        console.error('Error loading articles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  return { articles, loading };
}
