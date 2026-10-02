import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { User, AlertCircle, Calendar } from 'lucide-react';
import { Membership } from '../../types';
import { apiRequest } from '../../lib/api';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  currentTechId?: string | null;
  currentPriority?: string;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  requestId,
  currentTechId,
  currentPriority = 'Medium',
}) => {
  const queryClient = useQueryClient();

  const [techId, setTechId] = useState(currentTechId || '');
  const [priority, setPriority] = useState(currentPriority);
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: technicians = [] } = useQuery<Membership[]>({
    queryKey: ['technicians'],
    queryFn: () => apiRequest<Membership[]>('/organizations/technicians'),
    enabled: isOpen,
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/requests/${requestId}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          technician_id: techId,
          priority,
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
          manager_instructions: instructions || undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to assign technician.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!techId) {
      setError('Please select a technician.');
      return;
    }
    setError(null);
    assignMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch & Assign Technician"
      subtitle="Select technician and set priority and target completion SLA"
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
            Assign to Field Technician *
          </label>
          <select
            required
            value={techId}
            onChange={e => setTechId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
          >
            <option value="">Select available technician...</option>
            {technicians.map(t => (
              <option key={t.user_id} value={t.user_id}>
                {t.user?.full_name} ({t.title || 'Technician'})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
              Priority SLA
            </label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
              Due Date (Target)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
            Manager Instructions / Work Notes
          </label>
          <textarea
            rows={3}
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder="e.g. Please bring replacement thermocouple and multimeter. Ensure main breaker is locked out."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
          />
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={assignMutation.isPending}>
            Confirm Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
