import React, { useState, useCallback } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useLongPress } from '../../../hooks/useLongPress';

export interface MessageAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

interface MessageActionMenuProps {
  children: React.ReactNode;
  actions: MessageAction[];
  disabled?: boolean;
}

export const MessageActionMenu: React.FC<MessageActionMenuProps> = ({
  children,
  actions,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const handleOpen = useCallback((e: React.PointerEvent | React.MouseEvent, type: 'longPress' | 'contextMenu') => {
    if (disabled) return;

    if (type === 'contextMenu') {
      e.preventDefault();
    }

    // Position near the interaction point
    setPosition({
      x: 'clientX' in e ? e.clientX : 0,
      y: 'clientY' in e ? e.clientY : 0
    });
    setIsOpen(true);
  }, [disabled]);

  const longPressProps = useLongPress(
    (e) => handleOpen(e, 'longPress'),
    undefined,
    { disabled, delay: 400, movementThreshold: 15 } // Slightly lower delay for snappier mobile feel, generous threshold for touch jiggle
  );

  if (actions.length === 0) {
    return <>{children}</>;
  }

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      {/* We wrap the content in a div to capture events. */}
      {/* This element does not intercept standard text selection because it is just a normal container. */}
      {/* We use touch-action: pan-y or auto, allowing native scrolling/text selection unless captured. */}
      <div
        {...longPressProps}
        onContextMenu={(e) => handleOpen(e, 'contextMenu')}
        className="relative inline-block w-full h-full"
        style={{ WebkitTouchCallout: 'none' }} // Prevent standard iOS long-press popouts (like image save) if we are hijacking it, though text selection still works via native handles usually.
      >
        <DropdownMenu.Trigger asChild>
          {/* This is a hidden, absolutely positioned anchor that follows the pointer coordinates */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: position?.y ? `${position.y}px` : '50%',
              left: position?.x ? `${position.x}px` : '50%',
              position: 'fixed' // Fix to viewport for accurate Radix positioning
            }}
            aria-hidden="true"
          />
        </DropdownMenu.Trigger>

        {children}
      </div>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[180px] bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 p-1.5 animate-in fade-in zoom-in-95 duration-100"
          sideOffset={8}
          align="start"
        >
          {actions.map((action) => (
            <DropdownMenu.Item
              key={action.id}
              onSelect={action.onClick}
              className={`
                flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg
                outline-none cursor-pointer select-none transition-colors
                focus:bg-gray-100 dark:focus:bg-slate-800 focus:text-gray-900 dark:focus:text-slate-100
                data-[disabled]:opacity-50 data-[disabled]:pointer-events-none
                ${action.destructive ? 'text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-900/30' : 'text-gray-700 dark:text-slate-300'}
              `}
            >
              {action.icon && (
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5">
                  {action.icon}
                </span>
              )}
              {action.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
