import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Wrench, Package, Upload, AlertCircle, Plus } from 'lucide-react';
import { apiRequest } from '../../lib/api';

interface WorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
}

export const WorkLogModal: React.FC<WorkLogModalProps> = ({
  isOpen,
  onClose,
  requestId,
}) => {
  const queryClient = useQueryClient();

  const [diagnosis, setDiagnosis] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [hoursSpent, setHoursSpent] = useState('1.0');

  // Materials
  const [includePart, setIncludePart] = useState(false);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [cost, setCost] = useState('');

  // Evidence photo
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState('Before');
  const [error, setError] = useState<string | null>(null);

  const logMutation = useMutation({
    mutationFn: async () => {
      // 1. Submit work log
      await apiRequest(`/requests/${requestId}/work-logs`, {
        method: 'POST',
        body: JSON.stringify({
          diagnosis: diagnosis || undefined,
          actions_taken: actionsTaken,
          hours_spent: parseFloat(hoursSpent) || 0.0,
        }),
      });

      // 2. Submit material if entered
      if (includePart && itemName.trim()) {
        await apiRequest(`/requests/${requestId}/materials`, {
          method: 'POST',
          body: JSON.stringify({
            item_name: itemName.trim(),
            quantity: parseFloat(quantity) || 1,
            unit,
            cost: cost ? parseFloat(cost) : undefined,
          }),
        });
      }

      // 3. Upload photo if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('request_id', requestId);
        formData.append('attachment_type', attachmentType);
        await apiRequest('/files/upload', {
          method: 'POST',
          body: formData,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      onClose();
      setDiagnosis('');
      setActionsTaken('');
      setIncludePart(false);
      setSelectedFile(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to record work log.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionsTaken.trim()) {
      setError('Please specify actions taken.');
      return;
    }
    setError(null);
    logMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Work Log & Evidence"
      subtitle="Log technician labor, diagnostic findings, and replacement parts"
      maxWidth="lg"
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
            Diagnostic Findings / Cause (Optional)
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={e => setDiagnosis(e.target.value)}
            placeholder="e.g. Worn drive-shaft seal allowing hydraulic weepage"
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
            Actions Taken *
          </label>
          <textarea
            required
            rows={3}
            value={actionsTaken}
            onChange={e => setActionsTaken(e.target.value)}
            placeholder="e.g. Dismantled housing, flushed fluid lines, fitted new Buna-N seal, torqued to 45 Nm."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
            Hours Spent *
          </label>
          <input
            type="number"
            step="0.25"
            min="0.25"
            max="40"
            required
            value={hoursSpent}
            onChange={e => setHoursSpent(e.target.value)}
            className="w-32 px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
          />
        </div>

        {/* Consumed Materials / Spare Parts Toggle */}
        <div className="pt-2 border-t border-brand-evergreen/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-brand-evergreen dark:text-brand-mint flex items-center gap-1.5">
              <Package className="w-4 h-4 text-brand-jade" /> Include Replacement Part / Material
            </span>
            <input
              type="checkbox"
              checked={includePart}
              onChange={e => setIncludePart(e.target.checked)}
              className="w-4 h-4 accent-brand-jade rounded"
            />
          </div>

          {includePart && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded-xl bg-brand-ivory/50 dark:bg-brand-dark-bg border border-brand-evergreen/10">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Part name (e.g. V-Belt B-42)"
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-brand-evergreen/20 bg-white dark:bg-brand-dark-card outline-none"
                />
              </div>
              <div>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  placeholder="Qty"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-brand-evergreen/20 bg-white dark:bg-brand-dark-card outline-none"
                />
              </div>
              <div>
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-brand-evergreen/20 bg-white dark:bg-brand-dark-card outline-none"
                >
                  <option value="pcs">pcs</option>
                  <option value="liters">liters</option>
                  <option value="kg">kg</option>
                  <option value="meters">meters</option>
                  <option value="sets">sets</option>
                  <option value="boxes">boxes</option>
                </select>
              </div>
              <div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Cost ($)"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-brand-evergreen/20 bg-white dark:bg-brand-dark-card outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Evidence Photo Upload */}
        <div className="pt-2 border-t border-brand-evergreen/10">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-brand-evergreen dark:text-brand-mint flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-brand-jade" /> Attach Photo Evidence
            </label>
            <select
              value={attachmentType}
              onChange={e => setAttachmentType(e.target.value)}
              className="text-[11px] px-2 py-1 rounded-lg border border-brand-evergreen/20 bg-brand-ivory/30 outline-none"
            >
              <option value="Before">Before Evidence</option>
              <option value="After">After Evidence</option>
              <option value="Diagnostic">Diagnostic Reading</option>
            </select>
          </div>
          <div className="relative border-2 border-dashed border-brand-evergreen/20 rounded-xl p-3 text-center cursor-pointer hover:bg-brand-ivory/30">
            <input
              type="file"
              accept="image/*"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <span className="text-xs text-brand-forest/70 dark:text-brand-dark-muted">
              {selectedFile ? selectedFile.name : 'Take photo or choose from gallery'}
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={logMutation.isPending}>
            Save Work Log
          </Button>
        </div>
      </form>
    </Modal>
  );
};
