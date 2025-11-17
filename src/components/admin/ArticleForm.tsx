import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ArticleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: {
    id: string;
    title: string;
    category: string | null;
    content: string | null;
  } | null;
  onSuccess: () => void;
}

export function ArticleForm({ open, onOpenChange, article, onSuccess }: ArticleFormProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setCategory(article.category || '');
      setContent(article.content || '');
    } else {
      setTitle('');
      setCategory('');
      setContent('');
    }
  }, [article, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: 'Помилка валідації',
        description: 'Заголовок є обов\'язковим полем',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const data = {
        title: title.trim(),
        category: category.trim() || null,
        content: content.trim() || null,
      };

      if (article) {
        // Оновлення існуючої статті
        const { error } = await supabase
          .from('articles')
          .update(data)
          .eq('id', article.id);

        if (error) throw error;

        toast({
          title: 'Успіх',
          description: 'Статтю оновлено',
        });
      } else {
        // Створення нової статті
        const { error } = await supabase
          .from('articles')
          .insert([data]);

        if (error) throw error;

        toast({
          title: 'Успіх',
          description: 'Статтю створено',
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {article ? 'Редагувати Статтю' : 'Додати Статтю'}
          </DialogTitle>
          <DialogDescription>
            Заповніть поля нижче. Поле "Вміст" підтримує Markdown форматування.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Заголовок <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Назва статті"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Категорія</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Напр. Освітлення, Добрива, Полив"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              Вміст <span className="text-muted-foreground text-xs">(Markdown)</span>
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Введіть текст статті. Підтримує Markdown форматування..."
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Скасувати
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {article ? 'Зберегти Зміни' : 'Створити Статтю'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
