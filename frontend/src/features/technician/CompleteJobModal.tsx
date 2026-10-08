import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { apiRequest } from '../../lib/api';

interface CompleteJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
}

export const CompleteJobModal: React.FC<CompleteJobModalProps> = ({
  isOpen,
  onClose,
  requestId,
}) => {
  const queryClient = useQueryClient();

  const [completionSummary, setCompletionSummary] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [hoursSpent, setHoursSpent] = useState('0.5');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/requests/${requestId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          completion_summary: completionSummary,
          actions_taken: actionsTaken || undefined,
          hours_spent: parseFloat(hoursSpent) || 0.0,
        }),
      });

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('request_id', requestId);
        formData.append('attachment_type', 'After');
        await apiRequest('/files/upload', {
          method: 'POST',
          body: formData,
        });
      }

      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      onClose();
      setCompletionSummary('');
      setSelectedFile(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to submit completion report.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionSummary.trim()) {
      setError('Please provide a completion summary for customer verification.');
      return;
    }
    setError(null);
    completeMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Work Completion Report"
      subtitle="Summarize resolution for customer inspection and sign-off"
      maxWidth="md"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
            Resolution Summary for Customer *
          </label>
          <textarea
            required
            rows={4}
            value={completionSummary}
            onChange={e => setCompletionSummary(e.target.value)}
            placeholder="e.g. Replaced leaking gasket on hydraulic pump line 2. Verified zero leakage under 3,000 PSI operating pressure for 20 minutes."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
            Additional Final Labor Hours (Optional)
          </label>
          <input
            type="number"
            step="0.25"
            min="0"
            value={hoursSpent}
            onChange={e => setHoursSpent(e.target.value)}
            className="w-32 px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1 flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-brand-jade" />
            Attach Completion Proof / After Photo (Optional)
          </label>
          <div className="relative border-2 border-dashed border-brand-evergreen/20 dark:border-brand-dark-border rounded-xl p-3 text-center cursor-pointer hover:bg-brand-ivory/30 dark:hover:bg-brand-dark-bg transition-colors">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <span className="text-xs text-brand-forest/70 dark:text-brand-dark-muted">
              {selectedFile ? selectedFile.name : 'Click to upload completion photo (proves work resolution)'}
            </span>
          </div>
        </div>

        <div className="p-3 bg-brand-mint/15 dark:bg-brand-jade/10 rounded-xl border border-brand-mint/30 text-xs text-brand-evergreen dark:text-brand-mint flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-brand-jade" />
          <span>
            Upon submission, the request moves to <strong>Awaiting Verification</strong> and the customer receives an instant notification to inspect and confirm resolution.
          </span>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={completeMutation.isPending}>
            Submit Completion
          </Button>
        </div>
      </form>
    </Modal>
  );
};
