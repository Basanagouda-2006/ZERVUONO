import React from 'react';
import { RequestStatus } from '../../types';

interface StatusBadgeProps {
  status: RequestStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  const getStyle = (s: string) => {
    switch (s) {
      case 'Submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
      case 'Under Review':
        return 'bg-brand-lavender/20 text-indigo-800 border-brand-lavender/40 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
      case 'Assigned':
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      case 'Accepted':
        return 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800';
      case 'In Progress':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-semibold animate-pulse-slow dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700';
      case 'Awaiting Verification':
        return 'bg-brand-coral/15 text-brand-coral border-brand-coral/30 font-semibold dark:bg-brand-coral/20 dark:text-brand-coral dark:border-brand-coral/40';
      case 'Reopened':
        return 'bg-red-100 text-red-800 border-red-300 font-bold dark:bg-red-950/50 dark:text-red-300 dark:border-red-800';
      case 'Closed':
        return 'bg-brand-mint/30 text-brand-evergreen border-brand-mint/60 font-semibold dark:bg-brand-jade/30 dark:text-brand-mint dark:border-brand-jade/50';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${sizeClasses} ${getStyle(status)}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status}
    </span>
  );
};
