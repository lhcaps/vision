import type { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className = '' }: PanelProps) {
  return (
    <div
      className={`bg-graphite-900/75 inner-border-subtle min-w-0 rounded-md shadow-panel ${className}`}
    >
      {children}
    </div>
  );
}
