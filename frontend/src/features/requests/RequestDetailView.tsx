import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  MapPin,
  Tag,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileText,
  Wrench,
  Package,
  Sparkles,
  ArrowLeft,
  Star,
  ExternalLink
} from 'lucide-react';
import { MaintenanceRequest } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Button } from '../../components/ui/Button';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { VerifyModal } from '../customer/VerifyModal';

interface RequestDetailViewProps {
  requestId: string;
  onBack: () => void;
  onOpenAssign?: () => void;
  onOpenWorkLog?: () => void;
  onOpenComplete?: () => void;
  onOpenAITroubleshoot?: () => void;
}

export const RequestDetailView: React.FC<RequestDetailViewProps> = ({
  requestId,
  onBack,
  onOpenAssign,
  onOpenWorkLog,
  onOpenComplete,
  onOpenAITroubleshoot,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  const { data: request, isLoading, error } = useQuery<MaintenanceRequest>({
    queryKey: ['request', requestId],
    queryFn: () => apiRequest<MaintenanceRequest>(`/requests/${requestId}`),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="p-12 text-center text-sm text-brand-forest/60 dark:text-brand-dark-muted">
        Loading maintenance request details...
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-12 text-center text-sm text-red-600">
        Failed to load request or access denied.
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isCustomer = user?.role === 'Customer';
  const isManager = user?.role === 'Manager' || user?.role === 'Admin';
  const isTechnician = user?.role === 'Technician';
  const isAssignedToMe = request.assigned_technician_id === user?.id;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-evergreen/10 dark:border-brand-dark-border">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-brand-evergreen/15 hover:bg-brand-forest/5 text-brand-forest dark:text-brand-dark-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-jade">
                {request.request_number}
              </span>
              <StatusBadge status={request.status} />
              <PriorityBadge priority={request.priority} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-brand-evergreen dark:text-white mt-1 font-sans">
              {request.title}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Manager Actions */}
          {isManager && (
            <Button variant="primary" size="sm" onClick={onOpenAssign}>
              {request.assigned_technician_id ? 'Reassign Technician' : 'Assign Technician'}
            </Button>
          )}

          {/* Technician Actions */}
          {isTechnician && isAssignedToMe && (
            <>
              {request.status === 'Assigned' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    await apiRequest(`/requests/${request.id}/accept`, { method: 'POST' });
                    await queryClient.invalidateQueries({ queryKey: ['request', requestId] });
                    queryClient.invalidateQueries({ queryKey: ['requests'] });
                  }}
                >
                  Accept Assignment
                </Button>
              )}
              {request.status === 'Accepted' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    await apiRequest(`/requests/${request.id}/start`, { method: 'POST' });
                    await queryClient.invalidateQueries({ queryKey: ['request', requestId] });
                    queryClient.invalidateQueries({ queryKey: ['requests'] });
                  }}
                >
                  Start Work On-Site
                </Button>
              )}
              {request.status === 'In Progress' && (
                <>
                  <Button variant="outline" size="sm" onClick={onOpenAITroubleshoot}>
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-jade" /> AI Troubleshoot
                  </Button>
                  <Button variant="outline" size="sm" onClick={onOpenWorkLog}>
                    <Wrench className="w-3.5 h-3.5 mr-1" /> Log Work / Parts
                  </Button>
                  <Button variant="primary" size="sm" onClick={onOpenComplete}>
                    Submit Completion
                  </Button>
                </>
              )}
            </>
          )}

          {/* Customer Action: Verify when Awaiting Verification */}
          {request.status === 'Awaiting Verification' && (isCustomer || isManager) && (
            <Button
              variant="mint"
              size="sm"
              onClick={() => setVerifyModalOpen(true)}
              className="font-bold shadow-soft animate-bounce-subtle"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Verify Work Resolution
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Details Left, Timeline & Meta Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Description */}
          <div className="p-6 rounded-2xl bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-forest/70 dark:text-brand-dark-muted mb-2">
              Issue Description
            </h3>
            <p className="text-sm text-brand-forest dark:text-brand-dark-text leading-relaxed whitespace-pre-line">
              {request.description}
            </p>

            {/* Manager instructions if assigned */}
            {request.manager_instructions && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-200 block mb-1">
                  Manager Dispatch Instructions:
                </span>
                <p className="text-amber-800 dark:text-amber-300">
                  {request.manager_instructions}
                </p>
              </div>
            )}

            {/* Completion Summary if resolved */}
            {request.completion_summary && (
              <div className="mt-4 p-4 rounded-xl bg-brand-mint/20 dark:bg-brand-jade/15 border border-brand-mint/40 dark:border-brand-jade/30">
                <span className="text-xs font-bold text-brand-evergreen dark:text-brand-mint flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-brand-jade" /> Technician Resolution Report
                </span>
                <p className="text-xs text-brand-forest dark:text-brand-dark-text">
                  {request.completion_summary}
                </p>
              </div>
            )}

            {/* Reopen Warning if reopened */}
            {request.reopen_reason && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <span className="text-xs font-bold text-red-800 dark:text-red-300 flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-600" /> Customer Reopen Reason (Reopen Count: {request.reopen_count})
                </span>
                <p className="text-xs text-red-700 dark:text-red-200">
                  {request.reopen_reason}
                </p>
              </div>
            )}
          </div>

          {/* Work Logs & Material Consumption */}
          <div className="p-6 rounded-2xl bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-forest/70 dark:text-brand-dark-muted flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-brand-jade" />
                  Technician Work Logs ({request.work_logs?.length || 0})
                </h3>
              </div>
              {request.work_logs && request.work_logs.length > 0 ? (
                <div className="space-y-3">
                  {request.work_logs.map(log => (
                    <div key={log.id} className="p-3.5 rounded-xl bg-brand-ivory/40 dark:bg-brand-dark-bg border border-brand-evergreen/10 dark:border-brand-dark-border text-xs">
                      <div className="flex items-center justify-between font-semibold text-brand-evergreen dark:text-brand-mint mb-1">
                        <span>{log.technician?.full_name || 'Technician'}</span>
                        <span className="text-brand-forest/60 dark:text-brand-dark-muted font-normal">
                          {log.hours_spent} hours logged
                        </span>
                      </div>
                      {log.diagnosis && (
                        <p className="text-brand-forest/80 dark:text-brand-dark-muted mb-1">
                          <strong className="text-brand-forest dark:text-brand-dark-text">Diagnosis:</strong> {log.diagnosis}
                        </p>
                      )}
                      <p className="text-brand-forest dark:text-brand-dark-text">
                        <strong className="text-brand-forest dark:text-brand-dark-text">Actions:</strong> {log.actions_taken}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-brand-forest/50 dark:text-brand-dark-muted italic">
                  No work logs recorded yet.
                </p>
              )}
            </div>

            {/* Materials Used */}
            <div className="pt-4 border-t border-brand-evergreen/10 dark:border-brand-dark-border">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-forest/70 dark:text-brand-dark-muted flex items-center gap-1.5 mb-3">
                <Package className="w-4 h-4 text-brand-jade" />
                Materials & Replacement Parts Consumed ({request.materials?.length || 0})
              </h3>
              {request.materials && request.materials.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {request.materials.map(mat => (
                    <div key={mat.id} className="p-2.5 rounded-xl bg-brand-ivory/40 dark:bg-brand-dark-bg border border-brand-evergreen/10 text-xs flex items-center justify-between">
                      <span className="font-medium text-brand-forest dark:text-brand-dark-text">{mat.item_name}</span>
                      <span className="font-mono font-bold text-brand-evergreen dark:text-brand-mint">
                        {mat.quantity} {mat.unit} {mat.cost ? `($${mat.cost.toFixed(2)})` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-brand-forest/50 dark:text-brand-dark-muted italic">
                  No spare parts consumed for this request.
                </p>
              )}
            </div>

            {/* Photo Evidence & Attachments */}
            <div className="pt-4 border-t border-brand-evergreen/10 dark:border-brand-dark-border">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-forest/70 dark:text-brand-dark-muted flex items-center gap-1.5 mb-3">
                <FileText className="w-4 h-4 text-brand-jade" />
                Visual Evidence & Attachments ({request.attachments?.length || 0})
              </h3>
              {request.attachments && request.attachments.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {request.attachments.map(att => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block p-2 rounded-xl bg-brand-ivory/50 border border-brand-evergreen/10 hover:border-brand-jade transition-all overflow-hidden"
                    >
                      {att.mime_type.startsWith('image/') ? (
                        <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-1.5">
                          <img src={att.url} alt={att.file_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-brand-forest/5 flex items-center justify-center rounded-lg mb-1.5">
                          <FileText className="w-6 h-6 text-brand-jade" />
                        </div>
                      )}
                      <span className="text-[11px] font-medium text-brand-forest dark:text-brand-dark-text truncate block">
                        {att.file_name}
                      </span>
                      <span className="text-[10px] text-brand-forest/50 dark:text-brand-dark-muted block">
                        {att.attachment_type} · {(att.file_size / 1024).toFixed(0)} KB
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-brand-forest/50 dark:text-brand-dark-muted italic">
                  No photo attachments uploaded.
                </p>
              )}
            </div>

            {/* Feedback Review if Closed */}
            {request.feedback && (
              <div className="pt-4 border-t border-brand-evergreen/10 dark:border-brand-dark-border">
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-forest/70 dark:text-brand-dark-muted flex items-center gap-1.5 mb-2">
                  <Star className="w-4 h-4 text-brand-amber fill-brand-amber" />
                  Customer Feedback Rating
                </h3>
                <div className="p-3.5 rounded-xl bg-brand-mint/15 border border-brand-mint/30 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1 text-brand-amber">
                      {[...Array(request.feedback.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-brand-amber" />
                      ))}
                      <span className="ml-1 font-bold text-brand-evergreen dark:text-brand-mint">
                        {request.feedback.rating} / 5 Stars
                      </span>
                    </div>
                    {request.feedback.comments && (
                      <p className="mt-1 text-brand-forest dark:text-brand-dark-text italic">
                        "{request.feedback.comments}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Meta & Chronological Audit Timeline */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card space-y-4 text-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-forest/70 dark:text-brand-dark-muted pb-2 border-b border-brand-evergreen/10">
              Operational Attributes
            </h3>

            <div>
              <span className="text-brand-forest/60 dark:text-brand-dark-muted block text-[11px]">Category</span>
              <span className="font-semibold text-brand-evergreen dark:text-brand-mint text-sm">{request.category}</span>
            </div>

            <div>
              <span className="text-brand-forest/60 dark:text-brand-dark-muted block text-[11px]">Facility Location</span>
              <span className="font-semibold text-brand-forest dark:text-brand-dark-text flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-brand-jade" />
                {request.location?.name || 'Unassigned location'}
              </span>
              {request.location_details && (
                <span className="text-[11px] text-brand-forest/60 block mt-0.5">
                  Spot: {request.location_details}
                </span>
              )}
            </div>

            <div>
              <span className="text-brand-forest/60 dark:text-brand-dark-muted block text-[11px]">Associated Equipment</span>
              <span className="font-semibold text-brand-forest dark:text-brand-dark-text flex items-center gap-1 mt-0.5">
                <Tag className="w-3.5 h-3.5 text-brand-jade" />
                {request.asset ? `${request.asset.name} [${request.asset.asset_tag}]` : 'None linked'}
              </span>
            </div>

            <div>
              <span className="text-brand-forest/60 dark:text-brand-dark-muted block text-[11px]">Reported By</span>
              <span className="font-semibold text-brand-forest dark:text-brand-dark-text flex items-center gap-1 mt-0.5">
                <User className="w-3.5 h-3.5 text-brand-jade" />
                {request.requester?.full_name || 'Customer'}
              </span>
            </div>

            <div>
              <span className="text-brand-forest/60 dark:text-brand-dark-muted block text-[11px]">Assigned Technician</span>
              <span className="font-semibold text-brand-forest dark:text-brand-dark-text flex items-center gap-1 mt-0.5">
                <Wrench className="w-3.5 h-3.5 text-brand-amber" />
                {request.assigned_technician?.full_name || 'Pending assignment'}
              </span>
            </div>

            <div>
              <span className="text-brand-forest/60 dark:text-brand-dark-muted block text-[11px]">Due Target Date</span>
              <span className="font-semibold text-brand-forest dark:text-brand-dark-text flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-brand-forest/50" />
                {request.due_date ? new Date(request.due_date).toLocaleDateString() : 'None set'}
              </span>
            </div>
          </div>

          {/* Chronological Audit Timeline */}
          <div className="p-6 rounded-2xl bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-forest/70 dark:text-brand-dark-muted mb-4 pb-2 border-b border-brand-evergreen/10">
              Audit Status Trail
            </h3>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-evergreen/15 dark:before:bg-brand-dark-border">
              {request.status_history?.map(hist => (
                <div key={hist.id} className="relative text-xs">
                  <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-brand-jade border-2 border-white dark:border-brand-dark-card" />
                  <div className="flex items-center justify-between font-semibold text-brand-evergreen dark:text-brand-mint">
                    <span>{hist.action.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-brand-forest/50 font-normal">
                      {new Date(hist.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {hist.actor && (
                    <span className="text-[11px] text-brand-forest/70 dark:text-brand-dark-muted block">
                      by {hist.actor.full_name}
                    </span>
                  )}
                  {hist.comment && (
                    <p className="text-[11px] text-brand-forest/80 dark:text-brand-dark-muted mt-1 bg-brand-ivory/50 dark:bg-brand-dark-bg p-2 rounded-lg">
                      {hist.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Verification Modal */}
      <VerifyModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        request={request}
      />
    </div>
  );
};
