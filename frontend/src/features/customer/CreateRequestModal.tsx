import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Sparkles, Upload, AlertCircle, CheckCircle2, MapPin, Tag } from 'lucide-react';
import { Location, Asset } from '../../types';
import { apiRequest } from '../../lib/api';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (requestId: string) => void;
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('HVAC');
  const [priority, setPriority] = useState('Medium');
  const [locationId, setLocationId] = useState('');
  const [customLocationName, setCustomLocationName] = useState('');
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [locationDetails, setLocationDetails] = useState('');
  const [assetId, setAssetId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch locations
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: () => apiRequest('/locations/'),
    enabled: isOpen,
  });

  // Fetch assets
  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: () => apiRequest('/assets/'),
    enabled: isOpen,
  });

  // AI Recommendation mutation
  const handleAiRecommend = async () => {
    if (!title && !description) {
      setError('Please enter a title or description first for AI analysis.');
      return;
    }
    setError(null);
    setAiLoading(true);
    try {
      const res = await apiRequest<{ category: string; priority: string; reasoning: string }>('/ai/recommend', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      });
      if (res.category) setCategory(res.category);
      if (res.priority) setPriority(res.priority);
      setAiNote(`AI suggested ${res.category} & ${res.priority} priority: ${res.reasoning}`);
    } catch (e: any) {
      setError('AI suggestion unavailable right now.');
    } finally {
      setAiLoading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      // 1. Create request
      const effectiveLocationId = (!isCustomLocation && locationId) ? locationId : undefined;
      const effectiveLocationName = (isCustomLocation || locations.length === 0) ? (customLocationName.trim() || undefined) : undefined;

      const req = await apiRequest('/requests/', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
          location_id: effectiveLocationId,
          location_name: effectiveLocationName,
          location_details: locationDetails || undefined,
          asset_id: assetId || undefined,
        }),
      });

      // 2. Upload file if selected
      if (selectedFile && req.id) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('request_id', req.id);
        formData.append('attachment_type', 'Initial');
        await apiRequest('/files/upload', {
          method: 'POST',
          body: formData,
        });
      }

      return req;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      onClose();
      onSuccess(data.id);
      // Reset
      setTitle('');
      setDescription('');
      setLocationId('');
      setCustomLocationName('');
      setIsCustomLocation(false);
      setLocationDetails('');
      setAssetId('');
      setSelectedFile(null);
      setAiNote(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to submit maintenance request.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Maintenance Issue"
      subtitle="Submit request for immediate facility or technician review"
      maxWidth="lg"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {aiNote && (
        <div className="mb-4 p-3 rounded-xl bg-brand-mint/20 border border-brand-mint/40 text-xs text-brand-evergreen flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-jade flex-shrink-0" />
          <span>{aiNote}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
            Issue Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Hydraulic leak near Loading Dock 4"
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text">
              Detailed Description *
            </label>
            <button
              type="button"
              onClick={handleAiRecommend}
              disabled={aiLoading}
              className="text-[11px] font-semibold text-brand-jade hover:text-brand-evergreen flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>{aiLoading ? 'Analyzing...' : 'AI Category & Priority'}</span>
            </button>
          </div>
          <textarea
            required
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe what happened, any unusual noises, smells, or error codes..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
            >
              <option value="HVAC">HVAC & Climate Control</option>
              <option value="Mechanical">Mechanical & Conveyors</option>
              <option value="Electrical">Electrical & Lighting</option>
              <option value="Plumbing">Plumbing & Drainage</option>
              <option value="Safety">Safety & Hazardous</option>
              <option value="IT">IT & Network Infrastructure</option>
              <option value="Janitorial">Janitorial & Sanitation</option>
              <option value="Other">Other Facility Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
              Urgency / Priority
            </label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
            >
              <option value="Low">Low — Routine maintenance</option>
              <option value="Medium">Medium — Standard turnaround</option>
              <option value="High">High — Impairs workflow</option>
              <option value="Urgent">Urgent — Immediate shutdown risk</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            {locations.length === 0 ? (
              <>
                <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-brand-jade" /> Facility / Area Name
                </label>
                <input
                  type="text"
                  value={customLocationName}
                  onChange={e => setCustomLocationName(e.target.value)}
                  placeholder="e.g. Main Plant, Warehouse Bay 4"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
                />
              </>
            ) : isCustomLocation ? (
              <>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-brand-forest dark:text-brand-dark-text flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-brand-jade" /> New Area Name
                  </label>
                  <button
                    type="button"
                    onClick={() => { setIsCustomLocation(false); setCustomLocationName(''); }}
                    className="text-[11px] font-medium text-brand-jade hover:underline"
                  >
                    Select existing
                  </button>
                </div>
                <input
                  type="text"
                  value={customLocationName}
                  onChange={e => setCustomLocationName(e.target.value)}
                  placeholder="e.g. Loading Dock West, Lab 3"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
                />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-brand-forest dark:text-brand-dark-text flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-brand-jade" /> Location
                  </label>
                  <button
                    type="button"
                    onClick={() => { setIsCustomLocation(true); setLocationId(''); }}
                    className="text-[11px] font-medium text-brand-jade hover:underline"
                  >
                    + New Area
                  </button>
                </div>
                <select
                  value={locationId}
                  onChange={e => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
                >
                  <option value="">Select facility location...</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.building ? `(${loc.building})` : ''}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-brand-jade" /> Related Asset (Optional)
            </label>
            <select
              value={assetId}
              onChange={e => setAssetId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
            >
              <option value="">Select equipment / asset...</option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} [{asset.asset_tag}]
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
            Exact Location Details (Bay / Room / Aisle)
          </label>
          <input
            type="text"
            value={locationDetails}
            onChange={e => setLocationDetails(e.target.value)}
            placeholder="e.g. Aisle 7, Bay 12, next to emergency exit"
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
            Photograph or Evidence (Optional)
          </label>
          <div className="relative border-2 border-dashed border-brand-evergreen/20 dark:border-brand-dark-border rounded-xl p-3 text-center hover:bg-brand-ivory/30 dark:hover:bg-brand-dark-bg cursor-pointer">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex items-center justify-center gap-2 text-xs text-brand-forest/70 dark:text-brand-dark-muted">
              <Upload className="w-4 h-4 text-brand-jade" />
              <span>{selectedFile ? selectedFile.name : 'Click or tap to upload photo (max 20MB)'}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};
