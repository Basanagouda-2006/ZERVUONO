import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, Wrench } from 'lucide-react';
import { MaintenanceRequest } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CreateRequestModal } from './CreateRequestModal';
import { RequestDetailView } from '../requests/RequestDetailView';
import { apiRequest } from '../../lib/api';

export const CustomerDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedReqId = searchParams.get('request');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: requests = [], isLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: ['requests', 'customer', statusFilter],
    queryFn: () =>
      apiRequest<MaintenanceRequest[]>(
        `/requests/?my_created=true${statusFilter ? `&status=${encodeURIComponent(statusFilter)}` : ''}`
      ),
    refetchInterval: 10000,
  });

  const filteredRequests = requests.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.request_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const awaitingVerification = requests.filter(r => r.status === 'Awaiting Verification');
  const activeCount = requests.filter(r => !['Closed', 'Cancelled'].includes(r.status)).length;
  const closedCount = requests.filter(r => r.status === 'Closed').length;

  if (selectedReqId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <RequestDetailView
          requestId={selectedReqId}
          onBack={() => {
            searchParams.delete('request');
            setSearchParams(searchParams);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Banner: Awaiting Verification Alert if any */}
      {awaitingVerification.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-brand-coral/15 border border-brand-coral/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-brand-coral flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-brand-evergreen dark:text-white">
                Action Required: {awaitingVerification.length} work order(s) awaiting your verification!
              </h3>
              <p className="text-xs text-brand-forest/75 dark:text-brand-dark-muted mt-0.5">
                Technicians reported work complete. Please review the resolution and verify or reopen.
              </p>
            </div>
          </div>
          <Button
            variant="mint"
            size="sm"
            onClick={() => {
              setSearchParams({ request: awaitingVerification[0].id });
            }}
          >
            Review {awaitingVerification[0].request_number} →
          </Button>
        </div>
      )}

      {/* Header and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-evergreen dark:text-white font-sans">
            Customer Maintenance Hub
          </h1>
          <p className="text-xs text-brand-forest/70 dark:text-brand-dark-muted mt-1">
            Report issues, track technician repairs, and verify resolution proof
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setCreateModalOpen(true)}>
          Report Maintenance Issue
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-brand-forest/60 dark:text-brand-dark-muted">Total Submitted</span>
          <div className="text-2xl font-black text-brand-evergreen dark:text-white mt-1">{requests.length}</div>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-brand-forest/60 dark:text-brand-dark-muted">In Progress / Active</span>
          <div className="text-2xl font-black text-brand-amber mt-1">{activeCount}</div>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-brand-forest/60 dark:text-brand-dark-muted">Awaiting Verification</span>
          <div className="text-2xl font-black text-brand-coral mt-1">{awaitingVerification.length}</div>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-brand-forest/60 dark:text-brand-dark-muted">Resolved & Closed</span>
          <div className="text-2xl font-black text-brand-jade mt-1">{closedCount}</div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-brand-forest/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by ticket #, issue title, or category..."
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-white dark:bg-brand-dark-card focus:ring-2 focus:ring-brand-jade outline-none"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-brand-forest/60" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-white dark:bg-brand-dark-card outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Awaiting Verification">Awaiting Verification</option>
            <option value="Reopened">Reopened</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Requests Table / Cards */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-brand-forest/60">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench className="w-10 h-10 mx-auto text-brand-forest/20 mb-3" />
            <p className="text-sm font-bold text-brand-evergreen dark:text-white">No requests found</p>
            <p className="text-xs text-brand-forest/60 dark:text-brand-dark-muted mt-1">
              Have an issue to report? Click "+ Report Maintenance Issue" above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-ivory/80 dark:bg-brand-dark-bg border-b border-brand-evergreen/10 text-brand-forest/70 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Request #</th>
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Priority</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Location</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
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
                    <td className="px-5 py-3.5 text-brand-forest/70 whitespace-nowrap">
                      {req.location?.name || 'General'}
                    </td>
                    <td className="px-5 py-3.5 text-brand-forest/60 whitespace-nowrap">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSearchParams({ request: req.id });
                        }}
                        className="text-xs font-semibold text-brand-jade hover:underline"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <CreateRequestModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={reqId => setSearchParams({ request: reqId })}
      />
    </div>
  );
};
