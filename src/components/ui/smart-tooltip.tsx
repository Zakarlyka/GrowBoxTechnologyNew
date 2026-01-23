import { useState, ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useHelpMode } from '@/contexts/HelpModeContext';
import { cn } from '@/lib/utils';

interface SmartTooltipProps {
  term: string;
  content: string;
  children?: ReactNode;
  className?: string;
}

/**
 * SmartTooltip - Educational tooltip that only shows when Help Mode is enabled
 * 
 * Desktop: Shows tooltip on hover
 * Mobile: Shows popover on click
 */
export function SmartTooltip({ term, content, children, className }: SmartTooltipProps) {
  const { isHelpModeEnabled } = useHelpMode();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // If help mode is disabled, just render children or the term
  if (!isHelpModeEnabled) {
    return <>{children || term}</>;
  }

  // Desktop: Tooltip on hover
  const DesktopTooltip = (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center gap-1 cursor-help", className)}>
            {children || term}
            <HelpCircle className="w-3.5 h-3.5 text-primary/60 hover:text-primary transition-colors" />
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs bg-background border-border shadow-lg z-[100]"
        >
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{term}</p>
            <p className="text-sm text-muted-foreground">{content}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Mobile: Popover on click
  const MobilePopover = (
    <Popover open={isMobileOpen} onOpenChange={setIsMobileOpen}>
      <PopoverTrigger asChild>
        <span className={cn("inline-flex items-center gap-1 cursor-pointer touch-manipulation", className)}>
          {children || term}
          <HelpCircle className="w-4 h-4 text-primary/60 active:text-primary transition-colors min-w-[16px] min-h-[16px]" />
        </span>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        className="w-72 bg-background border-border shadow-lg z-[100]"
      >
        <div className="space-y-1.5">
          <p className="font-semibold text-foreground text-sm">{term}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <>
      {/* Desktop version - hidden on mobile */}
      <span className="hidden md:inline-flex">{DesktopTooltip}</span>
      {/* Mobile version - hidden on desktop */}
      <span className="inline-flex md:hidden">{MobilePopover}</span>
    </>
  );
}
