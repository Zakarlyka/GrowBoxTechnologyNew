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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { value: 'germination', label: '🌱 Пророщування' },
  { value: 'vegetation', label: '🌿 Вегетація' },
  { value: 'flowering', label: '🌸 Цвітіння' },
  { value: 'troubleshooting', label: '🚑 Вирішення проблем' },
  { value: 'nutrients', label: '🧪 Живлення' },
];

interface ArticleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: {
    id: number;
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
  const [aiTopic, setAiTopic] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
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
    setAiTopic('');
  }, [article, open]);

  const generateWithAI = async () => {
    if (!aiTopic.trim()) {
      toast({
        title: 'Введіть тему',
        description: 'Вкажіть тему для генерації статті',
        variant: 'destructive',
      });
      return;
    }

    setAiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: { topic: aiTopic.trim(), category }
      });

      if (error) throw error;

      if (data?.title) setTitle(data.title);
      if (data?.content) setContent(data.content);

      toast({
        title: '✨ Стаття згенерована',
        description: 'Перегляньте та відредагуйте перед збереженням',
      });
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast({
        title: 'Помилка генерації',
        description: error.message || 'Не вдалося згенерувати статтю',
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  };

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
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Оберіть категорію" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Generation Section */}
          <div className="space-y-2 p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <Label className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Sparkles className="h-4 w-4" />
              Написати з AI
            </Label>
            <div className="flex gap-2">
              <Input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Тема статті (напр. Дефіцит азоту)"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={generateWithAI}
                disabled={aiLoading || !aiTopic.trim()}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
              >
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Генерувати
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              AI згенерує структуровану статтю: вступ, симптоми, рішення
            </p>
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
