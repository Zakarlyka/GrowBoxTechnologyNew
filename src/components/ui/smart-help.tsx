import { useState, ReactNode, cloneElement, isValidElement } from 'react';
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
 * When isHelpModeEnabled === false: Renders children normally (NO extra wrappers)
 * When isHelpModeEnabled === true: Children become the tooltip trigger
 * 
 * Desktop: Shows tooltip on hover
 * Mobile: Shows popover on tap
 * 
 * LAYOUT-SAFE: Uses className="contents" to avoid breaking grid/flex layouts
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

  // If help mode is disabled, just render children without any wrapper
  if (!isHelpModeEnabled) {
    return <>{children}</>;
  }

  // Visual styles when help mode is active - only apply decoration to text
  const helpActiveStyles = cn(
    "cursor-help",
    isText && "decoration-dotted underline underline-offset-4 decoration-primary/40",
    className
  );

  // Try to clone the child element and add the help styles directly
  // This avoids adding wrapper elements that break layouts
  const enhanceChild = (child: ReactNode) => {
    if (isValidElement(child)) {
      const existingClassName = (child.props as any).className || '';
      return cloneElement(child as React.ReactElement<any>, {
        className: cn(existingClassName, helpActiveStyles),
      });
    }
    // For non-element children (text, etc), wrap minimally
    return <span className={helpActiveStyles}>{child}</span>;
  };

  // Desktop: Tooltip on hover - uses contents to be layout-invisible
  const DesktopVersion = (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="contents">
            {enhanceChild(children)}
          </div>
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

  // Mobile: Popover on tap - uses contents to be layout-invisible
  const MobileVersion = (
    <Popover open={isMobileOpen} onOpenChange={setIsMobileOpen}>
      <PopoverTrigger asChild>
        <div className="contents touch-manipulation">
          {enhanceChild(children)}
        </div>
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
      {/* Desktop version - hidden on mobile, uses contents for layout transparency */}
      <div className="contents hidden md:contents">{DesktopVersion}</div>
      {/* Mobile version - hidden on desktop, uses contents for layout transparency */}
      <div className="contents md:hidden">{MobileVersion}</div>
    </>
  );
}
