import { useState, ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useHelpMode } from '@/contexts/HelpModeContext';
import { cn } from '@/lib/utils';

interface SmartHelpProps {
  content: string;
  children: ReactNode;
  className?: string;
  /** If true, applies text decoration (for inline text). Defaults to true */
  isText?: boolean;
}

/**
 * SmartHelp - Educational wrapper that adds help tooltips when Help Mode is enabled
 * 
 * When isHelpModeEnabled === false: Renders children normally (NO extra icons)
 * When isHelpModeEnabled === true: Children become the tooltip trigger
 * 
 * Desktop: Shows tooltip on hover
 * Mobile: Shows popover on tap
 * 
 * Visual cues when active:
 * - cursor-help on hover
 * - Subtle dotted underline for text elements (controlled by isText prop)
 */
export function SmartHelp({ 
  content, 
  children, 
  className,
  isText = true 
}: SmartHelpProps) {
  const { isHelpModeEnabled } = useHelpMode();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // If help mode is disabled, just render children
  if (!isHelpModeEnabled) {
    return <>{children}</>;
  }

  // Visual styles when help mode is active - only apply decoration to text
  const helpActiveStyles = cn(
    "cursor-help",
    isText && "decoration-dotted underline underline-offset-4 decoration-primary/40",
    className
  );

  // Desktop: Tooltip on hover
  const DesktopVersion = (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={helpActiveStyles}>
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs bg-primary/10 border-primary/30 shadow-lg z-[100] p-3 backdrop-blur-sm"
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
        <span className={cn(helpActiveStyles, "touch-manipulation")}>
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        className="w-72 bg-primary/10 border-primary/30 shadow-lg z-[100] p-3 backdrop-blur-sm"
      >
        <p className="text-sm text-foreground leading-relaxed">{content}</p>
      </PopoverContent>
    </Popover>
  );

  return (
    <>
      {/* Desktop version - hidden on mobile */}
      <span className="hidden md:inline">{DesktopVersion}</span>
      {/* Mobile version - hidden on desktop */}
      <span className="inline md:hidden">{MobileVersion}</span>
    </>
  );
}
