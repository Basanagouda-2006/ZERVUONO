import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Layers,
  Users,
  Calendar,
  BarChart3,
  Search,
  Filter,
  AlertCircle,
  UserPlus,
  Play,
  CheckCircle2,
  Clock,
  Tag,
  Wrench,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { MaintenanceRequest, ReportSummary, Asset, PreventivePlan, Membership } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { AssignmentModal } from './AssignmentModal';
import { RequestDetailView } from '../requests/RequestDetailView';
import { apiRequest } from '../../lib/api';

export const ManagerDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedReqId = searchParams.get('request');
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'queue' | 'workload' | 'assets' | 'preventive' | 'reports'>('queue');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [assigningReqId, setAssigningReqId] = useState<string | null>(null);

  // Queries
  const { data: requests = [], isLoading: requestsLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: ['requests', 'manager', statusFilter],
    queryFn: () =>
      apiRequest<MaintenanceRequest[]>(
        `/requests/${statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ''}`
      ),
    refetchInterval: 15000,
  });

  const { data: report } = useQuery<ReportSummary>({
    queryKey: ['reports', 'summary'],
    queryFn: () => apiRequest<ReportSummary>('/reports/summary'),
    refetchInterval: 20000,
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: () => apiRequest<Asset[]>('/assets/'),
    enabled: activeTab === 'assets',
  });

  const { data: preventivePlans = [] } = useQuery<PreventivePlan[]>({
    queryKey: ['preventive-plans'],
    queryFn: () => apiRequest<PreventivePlan[]>('/preventive/'),
    enabled: activeTab === 'preventive',
  });

  const triggerPMMutation = useMutation({
    mutationFn: (planId: string) =>
      apiRequest(`/preventive/${planId}/trigger`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preventive-plans'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      alert('Preventive maintenance work order triggered successfully!');
    },
  });

  const filteredRequests = requests.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.request_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedReqId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <RequestDetailView
          requestId={selectedReqId}
          onBack={() => {
            searchParams.delete('request');
            setSearchParams(searchParams);
          }}
          onOpenAssign={() => setAssigningReqId(selectedReqId)}
        />
        {assigningReqId && (
          <AssignmentModal
            isOpen={!!assigningReqId}
            onClose={() => setAssigningReqId(null)}
            requestId={assigningReqId}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-evergreen dark:text-white font-sans">
            Operations & Dispatch Control
          </h1>
          <p className="text-xs text-brand-forest/70 dark:text-brand-dark-muted mt-1">
            Dispatch technicians, monitor active work orders, preventive schedules, and KPIs
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-3.5 border-l-4 border-l-blue-500">
            <span className="text-[11px] font-semibold text-brand-forest/70 dark:text-brand-dark-muted">Open Requests</span>
            <div className="text-2xl font-black text-brand-evergreen dark:text-white mt-1">{report.open_requests}</div>
          </Card>
          <Card className="p-3.5 border-l-4 border-l-red-500">
            <span className="text-[11px] font-semibold text-brand-forest/70 dark:text-brand-dark-muted">Unassigned</span>
            <div className="text-2xl font-black text-red-600 mt-1">{report.unassigned_requests}</div>
          </Card>
          <Card className="p-3.5 border-l-4 border-l-amber-500">
            <span className="text-[11px] font-semibold text-brand-forest/70 dark:text-brand-dark-muted">In Progress</span>
            <div className="text-2xl font-black text-brand-amber mt-1">{report.in_progress_requests}</div>
          </Card>
          <Card className="p-3.5 border-l-4 border-l-brand-coral">
            <span className="text-[11px] font-semibold text-brand-forest/70 dark:text-brand-dark-muted">Awaiting Verif.</span>
            <div className="text-2xl font-black text-brand-coral mt-1">{report.awaiting_verification}</div>
          </Card>
          <Card className="p-3.5 border-l-4 border-l-brand-jade">
            <span className="text-[11px] font-semibold text-brand-forest/70 dark:text-brand-dark-muted">Avg Resolution</span>
            <div className="text-2xl font-black text-brand-evergreen dark:text-white mt-1">{report.avg_resolution_hours}h</div>
          </Card>
          <Card className="p-3.5 border-l-4 border-l-purple-500">
            <span className="text-[11px] font-semibold text-brand-forest/70 dark:text-brand-dark-muted">Reopen Rate</span>
            <div className="text-2xl font-black text-brand-forest dark:text-brand-dark-text mt-1">{report.reopen_rate_percent}%</div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-brand-evergreen/10 dark:border-brand-dark-border gap-2 sm:gap-6 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 px-1 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'queue'
              ? 'border-brand-jade text-brand-evergreen dark:text-brand-mint font-bold'
              : 'border-transparent text-brand-forest/60 hover:text-brand-forest'
          }`}
        >
          <Layers className="w-4 h-4" /> Request Queue ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('workload')}
          className={`pb-3 px-1 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'workload'
              ? 'border-brand-jade text-brand-evergreen dark:text-brand-mint font-bold'
              : 'border-transparent text-brand-forest/60 hover:text-brand-forest'
          }`}
        >
          <Users className="w-4 h-4" /> Team Workload
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`pb-3 px-1 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'assets'
              ? 'border-brand-jade text-brand-evergreen dark:text-brand-mint font-bold'
              : 'border-transparent text-brand-forest/60 hover:text-brand-forest'
          }`}
        >
          <Tag className="w-4 h-4" /> Assets Registry
        </button>
        <button
          onClick={() => setActiveTab('preventive')}
          className={`pb-3 px-1 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'preventive'
              ? 'border-brand-jade text-brand-evergreen dark:text-brand-mint font-bold'
              : 'border-transparent text-brand-forest/60 hover:text-brand-forest'
          }`}
        >
          <Calendar className="w-4 h-4" /> Preventive Schedules
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-1 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'border-brand-jade text-brand-evergreen dark:text-brand-mint font-bold'
              : 'border-transparent text-brand-forest/60 hover:text-brand-forest'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Operational Analytics
        </button>
      </div>

      {/* TAB 1: REQUEST QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-brand-forest/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter by ticket #, equipment, title..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-white dark:bg-brand-dark-card focus:ring-2 focus:ring-brand-jade outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-white dark:bg-brand-dark-card outline-none"
            >
              <option value="">All States</option>
              <option value="Submitted">Submitted (Needs Dispatch)</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Awaiting Verification">Awaiting Verification</option>
              <option value="Reopened">Reopened</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-ivory/80 dark:bg-brand-dark-bg border-b border-brand-evergreen/10 text-brand-forest/70 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Request #</th>
                    <th className="px-5 py-3 font-semibold">Title</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Priority</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Technician</th>
                    <th className="px-5 py-3 font-semibold">Location</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-evergreen/5 dark:divide-brand-dark-border">
                  {filteredRequests.map(req => (
                    <tr
                      key={req.id}
                      onClick={() => setSearchParams({ request: req.id })}
                      className="hover:bg-brand-ivory/50 dark:hover:bg-brand-dark-hover transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-brand-jade whitespace-nowrap">
                        {req.request_number}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-brand-forest dark:text-brand-dark-text max-w-xs truncate">
                        {req.title}
                      </td>
                      <td className="px-5 py-3.5 text-brand-forest/80 whitespace-nowrap">
                        {req.category}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <PriorityBadge priority={req.priority} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-3.5 text-brand-forest/80 whitespace-nowrap">
                        {req.assigned_technician ? (
                          req.assigned_technician.full_name
                        ) : (
                          <span className="text-red-600 font-bold">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-brand-forest/70 whitespace-nowrap">
                        {req.location?.name || 'General'}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setAssigningReqId(req.id)}
                            className="px-2.5 py-1 rounded bg-brand-forest/10 hover:bg-brand-forest/20 text-brand-forest dark:text-brand-dark-text text-xs font-semibold"
                          >
                            {req.assigned_technician ? 'Reassign' : 'Assign'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: TEAM WORKLOAD */}
      {activeTab === 'workload' && report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.technicians_workload.map(tech => (
            <Card key={tech.technician_id} className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-evergreen text-white flex items-center justify-center font-bold text-sm uppercase">
                  {tech.technician_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-brand-evergreen dark:text-white">{tech.technician_name}</h4>
                  <span className="text-[11px] text-brand-forest/60">Field Specialist</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-brand-evergreen/10 text-center">
                <div>
                  <span className="text-[10px] text-brand-forest/60 block">Active Jobs</span>
                  <span className="text-base font-bold text-brand-amber">{tech.active_jobs}</span>
                </div>
                <div>
                  <span className="text-[10px] text-brand-forest/60 block">Resolved</span>
                  <span className="text-base font-bold text-brand-jade">{tech.completed_jobs}</span>
                </div>
                <div>
                  <span className="text-[10px] text-brand-forest/60 block">Avg Hours</span>
                  <span className="text-base font-bold text-brand-forest dark:text-brand-dark-text">{tech.avg_hours_per_job}h</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 3: ASSET REGISTRY */}
      {activeTab === 'assets' && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-brand-evergreen/10 flex items-center justify-between">
            <h3 className="font-bold text-sm text-brand-evergreen dark:text-white">Equipment & Assets Inventory</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-ivory/80 dark:bg-brand-dark-bg border-b border-brand-evergreen/10 text-brand-forest/70 uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-3">Tag</th>
                  <th className="px-5 py-3">Asset Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Criticality</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Manufacturer / Model</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-evergreen/5">
                {assets.map(asset => (
                  <tr key={asset.id} className="hover:bg-brand-ivory/50">
                    <td className="px-5 py-3.5 font-mono font-bold text-brand-jade">{asset.asset_tag}</td>
                    <td className="px-5 py-3.5 font-semibold text-brand-forest dark:text-brand-dark-text">{asset.name}</td>
                    <td className="px-5 py-3.5">{asset.category}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium">{asset.criticality}</td>
                    <td className="px-5 py-3.5">{asset.location?.name || 'General'}</td>
                    <td className="px-5 py-3.5 text-brand-forest/70">{asset.manufacturer} {asset.model}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: PREVENTIVE MAINTENANCE */}
      {activeTab === 'preventive' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {preventivePlans.map(plan => (
              <Card key={plan.id} className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-mint/30 text-brand-evergreen uppercase">
                      {plan.frequency} Recurrence
                    </span>
                    <h4 className="text-base font-bold text-brand-evergreen dark:text-white mt-1.5">{plan.title}</h4>
                    <p className="text-xs text-brand-forest/70 dark:text-brand-dark-muted mt-1">{plan.description}</p>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 bg-brand-ivory/50 dark:bg-brand-dark-bg p-3 rounded-xl border border-brand-evergreen/10">
                  <div className="flex justify-between">
                    <span className="text-brand-forest/60">Target Equipment:</span>
                    <span className="font-semibold text-brand-forest dark:text-brand-dark-text">{plan.asset?.name || 'General'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-forest/60">Next Scheduled Due:</span>
                    <span className="font-bold text-brand-jade">{plan.next_due_date}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-brand-forest/60">
                    Assigned: {plan.assigned_technician?.full_name || 'Unassigned'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => triggerPMMutation.mutate(plan.id)}
                    isLoading={triggerPMMutation.isPending}
                  >
                    <Play className="w-3.5 h-3.5 mr-1 text-brand-jade" /> Trigger Work Order
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: OPERATIONAL REPORTS */}
      {activeTab === 'reports' && report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-sm text-brand-evergreen dark:text-white uppercase tracking-wider">
              Workload by Category Breakdown
            </h3>
            <div className="space-y-3">
              {report.categories_breakdown.map(cat => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{cat.category}</span>
                    <span>{cat.count} requests ({cat.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-brand-forest/10 overflow-hidden">
                    <div className="h-full bg-brand-jade rounded-full" style={{ width: `${cat.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-sm text-brand-evergreen dark:text-white uppercase tracking-wider">
              Status Distribution Pipeline
            </h3>
            <div className="space-y-3">
              {report.status_breakdown.map(st => (
                <div key={st.status} className="flex items-center justify-between text-xs p-2 rounded-xl bg-brand-ivory/50">
                  <StatusBadge status={st.status} size="sm" />
                  <span className="font-mono font-bold text-sm text-brand-forest dark:text-brand-dark-text">{st.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Assignment Modal */}
      {assigningReqId && (
        <AssignmentModal
          isOpen={!!assigningReqId}
          onClose={() => setAssigningReqId(null)}
          requestId={assigningReqId}
        />
      )}
    </div>
  );
};
