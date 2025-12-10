import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  bucketName?: string;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  bucketName = 'grow-images',
  className,
  disabled = false,
}: ImageUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Помилка',
        description: 'Будь ласка, оберіть файл зображення',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Помилка',
        description: 'Файл занадто великий (макс. 5MB)',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: 'Помилка',
        description: 'Ви не авторизовані',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique path
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      onChange(urlData.publicUrl);

      toast({
        title: '✅ Завантажено',
        description: 'Зображення успішно завантажено',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Помилка завантаження',
        description: error.message || 'Не вдалося завантажити зображення',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    // Try to delete from storage if it's a Supabase URL
    if (value.includes(bucketName)) {
      try {
        // Extract file path from URL
        const urlParts = value.split(`${bucketName}/`);
        if (urlParts[1]) {
          await supabase.storage.from(bucketName).remove([urlParts[1]]);
        }
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    onChange(null);
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {value ? (
        /* Image Preview */
        <div className="relative group">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
            <img
              src={value}
              alt="Preview"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
          
          {!disabled && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleClick}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span className="ml-2">Замінити</span>
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
                <span className="ml-2">Видалити</span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Upload Placeholder */
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || isUploading}
          className={cn(
            'relative flex flex-col items-center justify-center w-full aspect-video',
            'rounded-lg border-2 border-dashed border-muted-foreground/25',
            'bg-muted/50 hover:bg-muted hover:border-muted-foreground/50',
            'transition-colors cursor-pointer',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
              <span className="text-sm text-muted-foreground">Завантаження...</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <span className="text-sm text-muted-foreground">
                Натисніть для завантаження
              </span>
              <span className="text-xs text-muted-foreground/70 mt-1">
                PNG, JPG до 5MB
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
