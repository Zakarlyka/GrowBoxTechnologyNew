import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  skeletonClassName?: string;
}

export function OptimizedImage({
  src,
  alt,
  className,
  fallback,
  skeletonClassName,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error || !src) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <Skeleton className={cn('absolute inset-0 rounded-none', skeletonClassName)} />
      )}
      <img
        src={src}
        alt={alt || ''}
        loading="lazy"
        className={cn(
          'transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        {...props}
      />
    </div>
  );
}
