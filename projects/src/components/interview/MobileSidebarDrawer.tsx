'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileSidebarDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function MobileSidebarDrawer({ open, onClose, children }: MobileSidebarDrawerProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-40 lg:hidden',
        open ? 'pointer-events-auto' : 'pointer-events-none'
      )}
      aria-hidden={!open}
      inert={!open}
    >
      <button
        className={cn(
          'absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ease-out',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
        aria-label="关闭侧边栏遮罩"
        tabIndex={open ? 0 : -1}
      />
      <div
        className={cn(
          'absolute inset-y-0 left-0 will-change-transform',
          'transition-[transform,opacity,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          open ? 'translate-x-0 opacity-100 blur-0' : '-translate-x-full opacity-0 blur-[1px]'
        )}
      >
        {children}
      </div>
    </div>
  );
}
