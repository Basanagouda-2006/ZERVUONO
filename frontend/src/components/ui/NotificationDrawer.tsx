import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Bell, CheckCircle2, Clock, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { AppNotification } from '../../types';
import { apiRequest } from '../../lib/api';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRequest?: (requestId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onSelectRequest,
}) => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: () => apiRequest<AppNotification[]>('/notifications/'),
    enabled: isOpen,
    refetchInterval: isOpen ? 10000 : false,
  });

  const markReadMutation = useMutation({
    mutationFn: (markAll: boolean) =>
      apiRequest('/notifications/read', {
        method: 'POST',
        body: JSON.stringify({ mark_all: markAll }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  if (!isOpen) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'COMPLETED':
      case 'VERIFIED':
        return <CheckCircle2 className="w-5 h-5 text-brand-jade" />;
      case 'REOPENED':
      case 'DECLINED':
        return <AlertTriangle className="w-5 h-5 text-brand-coral" />;
      case 'ASSIGNED':
      case 'REQUEST_CREATED':
        return <Bell className="w-5 h-5 text-brand-amber" />;
      default:
        return <Clock className="w-5 h-5 text-brand-evergreen" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-brand-forest/40 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-brand-dark-card shadow-elevated border-l border-brand-evergreen/10 dark:border-brand-dark-border flex flex-col">
          {/* Header */}
          <div className="p-4 px-6 border-b border-brand-evergreen/10 dark:border-brand-dark-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-evergreen dark:text-brand-mint" />
              <h2 className="font-bold text-lg text-brand-evergreen dark:text-brand-mint font-sans">
                Notifications
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => markReadMutation.mutate(true)}
                title="Mark all as read"
                className="text-xs text-brand-jade hover:underline flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-brand-forest/5 dark:hover:bg-brand-dark-hover"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-brand-forest/60 hover:text-brand-forest dark:text-brand-dark-muted dark:hover:text-white rounded-lg hover:bg-brand-forest/5 dark:hover:bg-brand-dark-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-brand-evergreen/5 dark:divide-brand-dark-border/40">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-brand-forest/60 dark:text-brand-dark-muted">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="w-10 h-10 mx-auto text-brand-forest/20 dark:text-brand-dark-muted/30 mb-3" />
                <p className="text-sm font-medium text-brand-forest/70 dark:text-brand-dark-muted">
                  No notifications yet
                </p>
                <p className="text-xs text-brand-forest/50 dark:text-brand-dark-muted/60 mt-1">
                  Updates on work orders and team events will appear here in real time.
                </p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (notif.request_id && onSelectRequest) {
                      onSelectRequest(notif.request_id);
                      onClose();
                    }
                  }}
                  className={`p-4 hover:bg-brand-ivory/50 dark:hover:bg-brand-dark-hover transition-colors cursor-pointer flex gap-3 ${
                    !notif.is_read ? 'bg-brand-mint/10 dark:bg-brand-jade/10 font-medium' : ''
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">{getTypeIcon(notif.notification_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-brand-evergreen dark:text-brand-mint truncate">
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-brand-coral flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-brand-forest/80 dark:text-brand-dark-text mt-1 line-clamp-2">
                      {notif.message}
                    </p>
                    <span className="text-[11px] text-brand-forest/50 dark:text-brand-dark-muted mt-1.5 block">
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
