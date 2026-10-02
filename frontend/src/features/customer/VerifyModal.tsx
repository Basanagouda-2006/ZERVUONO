import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, RotateCcw, Star, AlertCircle } from 'lucide-react';
import { MaintenanceRequest } from '../../types';
import { apiRequest } from '../../lib/api';

interface VerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: MaintenanceRequest | null;
}

export const VerifyModal: React.FC<VerifyModalProps> = ({
  isOpen,
  onClose,
  request,
}) => {
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<'confirm' | 'reopen'>('confirm');
  const [rating, setRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!request) return;
      return apiRequest(`/requests/${request.id}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          confirmed: mode === 'confirm',
          reopen_reason: mode === 'reopen' ? reopenReason : undefined,
          feedback_rating: mode === 'confirm' ? rating : undefined,
          feedback_comments: mode === 'confirm' ? feedbackComments : undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', request?.id] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.message || 'Verification update failed.');
    },
  });

  if (!request) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Verify Work Resolution: ${request.request_number}`}
      subtitle="Inspect technician completion summary and confirm or reopen"
      maxWidth="md"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Completion Summary Card */}
      <div className="mb-4 p-4 rounded-xl bg-brand-ivory/60 dark:bg-brand-dark-bg border border-brand-evergreen/10 dark:border-brand-dark-border">
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60 dark:text-brand-dark-muted block mb-1">
          Technician Completion Report
        </span>
        <p className="text-xs text-brand-forest dark:text-brand-dark-text italic leading-relaxed">
          "{request.completion_summary || 'Technician reported work complete.'}"
        </p>
      </div>

      {/* Choice Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => { setMode('confirm'); setError(null); }}
          className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            mode === 'confirm'
              ? 'border-brand-jade bg-brand-mint/20 text-brand-evergreen dark:text-brand-mint shadow-sm'
              : 'border-brand-evergreen/15 text-brand-forest/70 hover:bg-brand-forest/5'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-brand-jade" />
          <span>Issue is Fixed (Close)</span>
        </button>
        <button
          type="button"
          onClick={() => { setMode('reopen'); setError(null); }}
          className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            mode === 'reopen'
              ? 'border-brand-coral bg-brand-coral/15 text-brand-coral shadow-sm'
              : 'border-brand-evergreen/15 text-brand-forest/70 hover:bg-brand-forest/5'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-brand-coral" />
          <span>Not Fixed (Reopen)</span>
        </button>
      </div>

      {mode === 'confirm' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-2">
              Service Rating (1 to 5 Stars)
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating ? 'text-brand-amber fill-brand-amber' : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-bold text-brand-forest/70 dark:text-brand-dark-muted">
                {rating} / 5
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
              Feedback / Comments (Optional)
            </label>
            <textarea
              rows={2}
              value={feedbackComments}
              onChange={e => setFeedbackComments(e.target.value)}
              placeholder="e.g. Prompt repair, equipment is running quietly now."
              className="w-full px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-300">
            Reopening will escalate this issue back to the facility manager and notify the technician.
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
              Reason for Reopening *
            </label>
            <textarea
              required
              rows={3}
              value={reopenReason}
              onChange={e => setReopenReason(e.target.value)}
              placeholder="Explain why the issue is not resolved or what symptoms persist..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
            />
          </div>
        </div>
      )}

      <div className="mt-6 pt-3 border-t border-brand-evergreen/10 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={mode === 'confirm' ? 'primary' : 'danger'}
          onClick={() => verifyMutation.mutate()}
          isLoading={verifyMutation.isPending}
        >
          {mode === 'confirm' ? 'Confirm Resolution' : 'Submit Reopen Reason'}
        </Button>
      </div>
    </Modal>
  );
};
