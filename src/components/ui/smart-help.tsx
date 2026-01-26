import { useState, ReactNode, isValidElement, Fragment } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useHelpMode } from '@/contexts/HelpModeContext';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Slot } from '@radix-ui/react-slot';

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
 * When isHelpModeEnabled === false: Renders children AS-IS (no wrapper at all)
 * When isHelpModeEnabled === true: Wraps with tooltip/popover using display:contents
 * 
 * Desktop: Shows tooltip on hover
 * Mobile: Shows popover on tap
 * 
 * LAYOUT-SAFE: The wrapper div uses display:contents to be invisible to CSS layout
 */
export function SmartHelp({ 
  content, 
  children, 
  className,
  isText = true 
}: SmartHelpProps) {
  const { isHelpModeEnabled } = useHelpMode();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  // If help mode is disabled, render children without ANY wrapper
  if (!isHelpModeEnabled) {
    return <>{children}</>;
  }

  // Visual styles when help mode is active
  const helpActiveStyles = cn(
    "cursor-help",
    isText && "decoration-dotted underline underline-offset-4 decoration-primary/40",
    className
  );

  // IMPORTANT: Do NOT use display:contents wrappers around grid/flex items.
  // Instead, use Radix Slot so TooltipTrigger/PopoverTrigger can attach directly
  // to the child without inserting layout-breaking wrapper nodes.
  const triggerChild =
    isValidElement(children) && children.type !== Fragment ? (
      <Slot className={helpActiveStyles}>{children}</Slot>
    ) : (
      // Fallback for text/fragments: minimal wrapper (safe for inline usage)
      <span className={helpActiveStyles}>{children}</span>
    );

  // Single render path - detect mobile at runtime to avoid duplicate children
  if (isMobile) {
    return (
      <Popover open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <PopoverTrigger asChild>{triggerChild}</PopoverTrigger>
        <PopoverContent
          side="top"
          className="w-72 bg-primary/10 border-primary/30 shadow-lg z-[100] p-3 backdrop-blur-sm"
        >
          <p className="text-sm text-foreground leading-relaxed">{content}</p>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{triggerChild}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs bg-primary/10 border-primary/30 shadow-lg z-[100] p-3 backdrop-blur-sm"
        >
          <p className="text-sm text-foreground leading-relaxed">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
