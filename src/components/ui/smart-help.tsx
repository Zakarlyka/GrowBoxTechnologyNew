import { useState, ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useHelpMode } from '@/contexts/HelpModeContext';
import { cn } from '@/lib/utils';

interface SmartHelpProps {
  content: string;
  children: ReactNode;
  className?: string;
  /** Show icon alongside children (default: false - just wraps element) */
  showIcon?: boolean;
  /** Position of help icon */
  iconPosition?: 'left' | 'right';
}

/**
 * SmartHelp - Educational wrapper that adds help tooltips when Help Mode is enabled
 * 
 * When isHelpModeEnabled === false: Renders children normally
 * When isHelpModeEnabled === true: Wraps children with help interaction
 * 
 * Desktop: Shows tooltip on hover
 * Mobile: Shows popover on tap
 */
export function SmartHelp({ 
  content, 
  children, 
  className,
  showIcon = false,
  iconPosition = 'right'
}: SmartHelpProps) {
  const { isHelpModeEnabled } = useHelpMode();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // If help mode is disabled, just render children
  if (!isHelpModeEnabled) {
    return <>{children}</>;
  }

  const HelpIcon = (
    <HelpCircle className="w-3.5 h-3.5 text-primary/70 hover:text-primary transition-colors shrink-0" />
  );

  const contentElement = showIcon ? (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {iconPosition === 'left' && HelpIcon}
      {children}
      {iconPosition === 'right' && HelpIcon}
    </span>
  ) : (
    <span className={cn("cursor-help", className)}>
      {children}
    </span>
  );

  // Desktop: Tooltip on hover
  const DesktopVersion = (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center">
            {contentElement}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs bg-background border-border shadow-lg z-[100] p-3"
        >
          <p className="text-sm text-foreground leading-relaxed">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Mobile: Popover on tap
  const MobileVersion = (
    <Popover open={isMobileOpen} onOpenChange={setIsMobileOpen}>
      <PopoverTrigger asChild>
        <span className="inline-flex items-center touch-manipulation">
          {contentElement}
        </span>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        className="w-72 bg-background border-border shadow-lg z-[100] p-3"
      >
        <p className="text-sm text-foreground leading-relaxed">{content}</p>
      </PopoverContent>
    </Popover>
  );

  return (
    <>
      {/* Desktop version - hidden on mobile */}
      <span className="hidden md:inline-flex">{DesktopVersion}</span>
      {/* Mobile version - hidden on desktop */}
      <span className="inline-flex md:hidden">{MobileVersion}</span>
    </>
  );
}
