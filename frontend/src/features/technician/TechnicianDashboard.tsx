import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Wrench,
  Clock,
  MapPin,
  Tag,
  CheckCircle2,
  Play,
  Check,
  AlertTriangle,
  Sparkles,
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import { MaintenanceRequest } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { WorkLogModal } from './WorkLogModal';
import { CompleteJobModal } from './CompleteJobModal';
import { AITroubleshootDrawer } from './AITroubleshootDrawer';
import { RequestDetailView } from '../requests/RequestDetailView';
import { apiRequest } from '../../lib/api';

export const TechnicianDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedReqId = searchParams.get('request');
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'active' | 'assigned' | 'completed' | 'unassigned'>('active');
  const [activeWorkLogId, setActiveWorkLogId] = useState<string | null>(null);
  const [activeCompleteId, setActiveCompleteId] = useState<string | null>(null);
  const [activeTroubleshootId, setActiveTroubleshootId] = useState<string | null>(null);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: ['requests', 'technician'],
    queryFn: () => apiRequest<MaintenanceRequest[]>('/requests/?my_assigned=true'),
    refetchInterval: 10000,
  });

  const { data: allOrgJobs = [], isLoading: allOrgLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: ['requests', 'technician', 'open_queue'],
    queryFn: () => apiRequest<MaintenanceRequest[]>('/requests/'),
    refetchInterval: 10000,
  });

  const assignedJobs = jobs.filter(j => j.status === 'Assigned');
  const inProgressJobs = jobs.filter(j => ['Accepted', 'In Progress', 'Reopened'].includes(j.status));
  const completedJobs = jobs.filter(j => ['Awaiting Verification', 'Closed'].includes(j.status));
  const unassignedJobs = allOrgJobs.filter(j => j.status === 'Submitted' || (!j.assigned_technician_id && j.status !== 'Closed'));

  const isLoading = jobsLoading || allOrgLoading;

  const displayJobs =
    activeTab === 'assigned'
      ? assignedJobs
      : activeTab === 'completed'
      ? completedJobs
      : activeTab === 'unassigned'
      ? unassignedJobs
      : inProgressJobs;

  if (selectedReqId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <RequestDetailView
          requestId={selectedReqId}
          onBack={() => {
            searchParams.delete('request');
            setSearchParams(searchParams);
          }}
          onOpenWorkLog={() => setActiveWorkLogId(selectedReqId)}
          onOpenComplete={() => setActiveCompleteId(selectedReqId)}
          onOpenAITroubleshoot={() => setActiveTroubleshootId(selectedReqId)}
        />
        {activeWorkLogId && (
          <WorkLogModal
            isOpen={!!activeWorkLogId}
            onClose={() => setActiveWorkLogId(null)}
            requestId={activeWorkLogId}
          />
        )}
        {activeCompleteId && (
          <CompleteJobModal
            isOpen={!!activeCompleteId}
            onClose={() => setActiveCompleteId(null)}
            requestId={activeCompleteId}
          />
        )}
        {activeTroubleshootId && (
          <AITroubleshootDrawer
            isOpen={!!activeTroubleshootId}
            onClose={() => setActiveTroubleshootId(null)}
            requestId={activeTroubleshootId}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-evergreen dark:text-white font-sans flex items-center gap-2">
            <Wrench className="w-7 h-7 text-brand-jade" />
            Technician Field Hub
          </h1>
          <p className="text-xs text-brand-forest/70 dark:text-brand-dark-muted mt-1">
            Mobile-optimized work orders, labor logs, parts consumption, and diagnostic tools
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-2xl bg-brand-forest/10 dark:bg-brand-dark-card border border-brand-evergreen/10">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'active'
              ? 'bg-white dark:bg-brand-dark-bg text-brand-evergreen dark:text-brand-mint shadow-sm'
              : 'text-brand-forest/70 dark:text-brand-dark-muted hover:text-brand-evergreen'
          }`}
        >
          <span>Active in-flight ({inProgressJobs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('assigned')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'assigned'
              ? 'bg-white dark:bg-brand-dark-bg text-brand-evergreen dark:text-brand-mint shadow-sm'
              : 'text-brand-forest/70 dark:text-brand-dark-muted hover:text-brand-evergreen'
          }`}
        >
          <span>New Assignments ({assignedJobs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'completed'
              ? 'bg-white dark:bg-brand-dark-bg text-brand-evergreen dark:text-brand-mint shadow-sm'
              : 'text-brand-forest/70 dark:text-brand-dark-muted hover:text-brand-evergreen'
          }`}
        >
          <span>Completed ({completedJobs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('unassigned')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'unassigned'
              ? 'bg-white dark:bg-brand-dark-bg text-brand-evergreen dark:text-brand-mint shadow-sm'
              : 'text-brand-forest/70 dark:text-brand-dark-muted hover:text-brand-evergreen'
          }`}
        >
          <span>Facility Open Queue ({unassignedJobs.length})</span>
        </button>
      </div>

      {/* Job Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-brand-forest/60">Loading assigned jobs...</div>
        ) : displayJobs.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-brand-jade/40 mx-auto mb-3" />
            <p className="text-sm font-bold text-brand-evergreen dark:text-white">
              No jobs in this view
            </p>
            <p className="text-xs text-brand-forest/60 dark:text-brand-dark-muted mt-1">
              You are all caught up! New dispatch assignments will appear here.
            </p>
          </Card>
        ) : (
          displayJobs.map(job => (
            <Card
              key={job.id}
              className="p-5 sm:p-6 hover:shadow-elevated transition-all border-l-4 border-l-brand-jade"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-brand-jade">
                      {job.request_number}
                    </span>
                    <StatusBadge status={job.status} size="sm" />
                    <PriorityBadge priority={job.priority} />
                    <span className="text-xs font-semibold text-brand-forest/60 dark:text-brand-dark-muted">
                      · {job.category}
                    </span>
                  </div>

                  <h3
                    onClick={() => setSearchParams({ request: job.id })}
                    className="text-base sm:text-lg font-bold text-brand-evergreen dark:text-white hover:text-brand-jade cursor-pointer font-sans"
                  >
                    {job.title}
                  </h3>

                  <p className="text-xs text-brand-forest/80 dark:text-brand-dark-muted mt-1.5 line-clamp-2">
                    {job.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-brand-forest/70 dark:text-brand-dark-muted">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-jade" />
                        {job.location.name}
                      </span>
                    )}
                    {job.asset && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-brand-jade" />
                        {job.asset.name}
                      </span>
                    )}
                    {job.due_date && (
                      <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        Target: {new Date(job.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct Action Buttons on Card for quick mobile tap */}
                <div className="flex flex-wrap sm:flex-col items-stretch gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-brand-evergreen/10">
                  {job.status === 'Submitted' && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={async () => {
                          await apiRequest(`/requests/${job.id}/claim`, { method: 'POST' });
                          await queryClient.invalidateQueries({ queryKey: ['requests'] });
                          await queryClient.invalidateQueries({ queryKey: ['reports'] });
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Claim Job
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchParams({ request: job.id })}
                      >
                        Inspect
                      </Button>
                    </div>
                  )}

                  {job.status === 'Assigned' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={async () => {
                        await apiRequest(`/requests/${job.id}/accept`, { method: 'POST' });
                        await queryClient.invalidateQueries({ queryKey: ['requests'] });
                        await queryClient.invalidateQueries({ queryKey: ['reports'] });
                      }}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Accept Job
                    </Button>
                  )}

                  {job.status === 'Accepted' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={async () => {
                        await apiRequest(`/requests/${job.id}/start`, { method: 'POST' });
                        await queryClient.invalidateQueries({ queryKey: ['requests'] });
                        await queryClient.invalidateQueries({ queryKey: ['reports'] });
                      }}
                    >
                      <Play className="w-3.5 h-3.5 mr-1" /> Start Work
                    </Button>
                  )}

                  {['In Progress', 'Reopened'].includes(job.status) && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setActiveCompleteId(job.id)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete Job
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveWorkLogId(job.id)}
                      >
                        <Wrench className="w-3.5 h-3.5 mr-1" /> Log Work / Parts
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTroubleshootId(job.id)}
                        className="text-brand-jade"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Troubleshoot
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchParams({ request: job.id })}
                    className="text-xs"
                  >
                    View Details →
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      {activeWorkLogId && (
        <WorkLogModal
          isOpen={!!activeWorkLogId}
          onClose={() => setActiveWorkLogId(null)}
          requestId={activeWorkLogId}
        />
      )}
      {activeCompleteId && (
        <CompleteJobModal
          isOpen={!!activeCompleteId}
          onClose={() => setActiveCompleteId(null)}
          requestId={activeCompleteId}
        />
      )}
      {activeTroubleshootId && (
        <AITroubleshootDrawer
          isOpen={!!activeTroubleshootId}
          onClose={() => setActiveTroubleshootId(null)}
          requestId={activeTroubleshootId}
        />
      )}
    </div>
  );
};
