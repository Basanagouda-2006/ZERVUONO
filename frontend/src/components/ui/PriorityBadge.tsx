import React from 'react';
import { RequestPriority } from '../../types';

interface PriorityBadgeProps {
  priority: RequestPriority | string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const getStyle = (p: string) => {
    switch (p) {
      case 'Urgent':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800';
      case 'High':
        return 'bg-brand-coral/15 text-brand-coral border-brand-coral/30 dark:bg-brand-coral/20 dark:text-brand-coral dark:border-brand-coral/40';
      case 'Medium':
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      case 'Low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStyle(priority)}`}>
      {priority}
    </span>
  );
};
