import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  UserPlus,
  Building,
  FileText,
  MapPin,
  Tag,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Layers,
  Search,
  Filter,
  Wrench,
  ArrowRight
} from 'lucide-react';
import { MaintenanceRequest, Membership, Invitation, AuditEvent, Organization, Location, Asset } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { AssignmentModal } from '../manager/AssignmentModal';
import { RequestDetailView } from '../requests/RequestDetailView';
import { apiRequest } from '../../lib/api';

export const AdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedReqId = searchParams.get('request');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'requests' | 'members' | 'invitations' | 'audit' | 'locations' | 'org'>('requests');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [assigningReqId, setAssigningReqId] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Technician');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [generatedInvite, setGeneratedInvite] = useState<{ email: string; token: string; role: string } | null>(null);

  // Facility Locations state
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locName, setLocName] = useState('');
  const [locBuilding, setLocBuilding] = useState('');
  const [locFloor, setLocFloor] = useState('');
  const [locRoom, setLocRoom] = useState('');
  const [locAddress, setLocAddress] = useState('');

  // Queries
  const { data: requests = [], isLoading: requestsLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: ['requests', 'admin', statusFilter],
    queryFn: () =>
      apiRequest<MaintenanceRequest[]>(
        `/requests/${statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ''}`
      ),
    refetchInterval: 15000,
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['admin-locations'],
    queryFn: () => apiRequest<Location[]>('/locations/'),
  });

  const locationMutation = useMutation({
    mutationFn: () =>
      apiRequest('/locations/', {
        method: 'POST',
        body: JSON.stringify({
          name: locName,
          building: locBuilding || undefined,
          floor: locFloor || undefined,
          room: locRoom || undefined,
          address: locAddress || undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setLocationModalOpen(false);
      setLocName('');
      setLocBuilding('');
      setLocFloor('');
      setLocRoom('');
      setLocAddress('');
    },
  });

  const { data: members = [] } = useQuery<Membership[]>({
    queryKey: ['admin-members'],
    queryFn: () => apiRequest<Membership[]>('/organizations/members'),
  });

  const { data: invitations = [] } = useQuery<Invitation[]>({
    queryKey: ['admin-invitations'],
    queryFn: () => apiRequest<Invitation[]>('/organizations/invitations'),
  });

  const { data: auditLogs = [] } = useQuery<AuditEvent[]>({
    queryKey: ['admin-audit'],
    queryFn: () => apiRequest<AuditEvent[]>('/audit/'),
    refetchInterval: 15000,
  });

  const { data: currentOrg } = useQuery<Organization>({
    queryKey: ['current-org'],
    queryFn: () => apiRequest<Organization>('/organizations/current'),
  });

  // Invite Mutation
  const inviteMutation = useMutation({
    mutationFn: () =>
      apiRequest('/organizations/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
      setGeneratedInvite({ email: inviteEmail, token: data.token, role: inviteRole });
      setInviteEmail('');
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
            onClose={() => {
              setAssigningReqId(null);
              queryClient.invalidateQueries({ queryKey: ['requests'] });
            }}
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-evergreen dark:text-white font-sans flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-brand-jade" />
            Organization Governance & Administration
          </h1>
          <p className="text-xs text-brand-forest/70 dark:text-brand-dark-muted mt-1">
            Manage work requests, users, role permissions, invitations, and compliance audit logs
          </p>
        </div>
        <Button variant="primary" icon={<UserPlus className="w-4 h-4" />} onClick={() => setInviteModalOpen(true)}>
          Invite Team Member
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-evergreen/10 dark:border-brand-dark-border gap-2 sm:gap-6 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'requests'
              ? 'border-brand-jade text-brand-evergreen dark:text-brand-mint font-bold'
              : 'border-transparent text-brand-forest/60 hover:text-brand-forest'
          }`}
        >
          <Layers className="w-4 h-4" /> Work Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'members'
              ? 'border-brand-jade text-brand-evergreen dark:text-brand-mint font-bold'
              : 'border-transparent text-brand-forest/60 hover:text-brand-forest'
          }`}
        >
          <Users className="w-4 h-4" /> Organization Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('invitations')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'invitations'
              ? 'border-brand-jade text-brand-evergreen dark:text-brand-mint font-bold'
              : 'border-transparent text-brand-forest/60 hover:text-brand-forest'
          }`}
        >
          <UserPlus className="w-4 h-4" /> Pending Invitations ({invitations.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-brand-jade text-brand-evergreen dark:text-brand-mint font-bold'
              : 'border-transparent text-brand-forest/60 hover:text-brand-forest'
          }`}
        >
          <FileText className="w-4 h-4" /> Audit Log Trail
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'locations'
              ? 'border-brand-jade text-brand-evergreen dark:text-brand-mint font-bold'
              : 'border-transparent text-brand-forest/60 hover:text-brand-forest'
          }`}
        >
          <MapPin className="w-4 h-4" /> Facility Locations ({locations.length})
        </button>
        <button
          onClick={() => setActiveTab('org')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'org'
              ? 'border-brand-jade text-brand-evergreen dark:text-brand-mint font-bold'
              : 'border-transparent text-brand-forest/60 hover:text-brand-forest'
          }`}
        >
          <Building className="w-4 h-4" /> Tenancy Settings
        </button>
      </div>

      {/* TAB 0: REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-brand-forest/40" />
              <input
                type="text"
                placeholder="Search requests by title, number, or category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-brand-evergreen/15 bg-white dark:bg-brand-dark-card outline-none focus:ring-2 focus:ring-brand-jade"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-forest/60" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-brand-evergreen/15 bg-white dark:bg-brand-dark-card outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Submitted">Submitted (New)</option>
                <option value="Assigned">Assigned</option>
                <option value="Accepted">Accepted</option>
                <option value="In Progress">In Progress</option>
                <option value="Awaiting Verification">Awaiting Verification</option>
                <option value="Closed">Closed</option>
                <option value="Reopened">Reopened</option>
              </select>
            </div>
          </div>

          <Card className="overflow-hidden">
            {requestsLoading ? (
              <div className="p-8 text-center text-xs text-brand-forest/60">Loading organization requests...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-brand-forest/60">No maintenance requests found matching your filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-ivory/80 dark:bg-brand-dark-bg border-b border-brand-evergreen/10 text-brand-forest/70 uppercase text-[10px]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Request</th>
                      <th className="px-5 py-3 font-semibold">Category</th>
                      <th className="px-5 py-3 font-semibold">Priority</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Assigned Tech</th>
                      <th className="px-5 py-3 font-semibold">Created</th>
                      <th className="px-5 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-evergreen/5 dark:divide-brand-dark-border">
                    {filteredRequests.map(r => (
                      <tr key={r.id} className="hover:bg-brand-ivory/50 dark:hover:bg-brand-dark-hover">
                        <td className="px-5 py-3.5">
                          <div className="font-mono text-[11px] font-bold text-brand-jade">{r.request_number}</div>
                          <div className="font-bold text-brand-evergreen dark:text-white line-clamp-1">{r.title}</div>
                        </td>
                        <td className="px-5 py-3.5 text-brand-forest/80">{r.category}</td>
                        <td className="px-5 py-3.5">
                          <PriorityBadge priority={r.priority} />
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-5 py-3.5 text-brand-forest/70">
                          {r.assigned_technician?.full_name || (
                            <span className="italic text-brand-forest/40">Unassigned</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-brand-forest/60">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => setAssigningReqId(r.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-brand-jade/10 text-brand-evergreen hover:bg-brand-jade/20 transition-colors"
                          >
                            Assign
                          </button>
                          <button
                            onClick={() => {
                              searchParams.set('request', r.id);
                              setSearchParams(searchParams);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-brand-evergreen text-white hover:bg-brand-forest transition-colors"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 1: MEMBERS */}
      {activeTab === 'members' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-ivory/80 dark:bg-brand-dark-bg border-b border-brand-evergreen/10 text-brand-forest/70 uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Title / Department</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-evergreen/5 dark:divide-brand-dark-border">
                {members.map(m => (
                  <tr key={m.id} className="hover:bg-brand-ivory/50 dark:hover:bg-brand-dark-hover">
                    <td className="px-5 py-3.5 font-bold text-brand-evergreen dark:text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-evergreen text-white flex items-center justify-center text-xs uppercase font-bold">
                        {m.user?.full_name.charAt(0)}
                      </div>
                      {m.user?.full_name}
                    </td>
                    <td className="px-5 py-3.5 text-brand-forest/80">{m.user?.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        m.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                        m.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                        m.role === 'Technician' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-brand-forest/70">{m.title || 'Team Member'}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-brand-forest/60">
                      {new Date(m.joined_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: INVITATIONS */}
      {activeTab === 'invitations' && (
        <Card className="overflow-hidden">
          {invitations.length === 0 ? (
            <div className="p-12 text-center text-xs text-brand-forest/60">
              No pending invitations. Click "Invite Team Member" above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-ivory/80 dark:bg-brand-dark-bg border-b border-brand-evergreen/10 text-brand-forest/70 uppercase text-[10px]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Invitation Token Link</th>
                    <th className="px-5 py-3 font-semibold">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-evergreen/5">
                  {invitations.map(inv => (
                    <tr key={inv.id} className="hover:bg-brand-ivory/50">
                      <td className="px-5 py-3.5 font-bold text-brand-forest dark:text-brand-dark-text">{inv.email}</td>
                      <td className="px-5 py-3.5 font-semibold text-brand-jade">{inv.role}</td>
                      <td className="px-5 py-3.5">{inv.status}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px]">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/accept-invitation?token=${inv.token}`);
                            setCopiedToken(inv.id);
                            setTimeout(() => setCopiedToken(null), 2000);
                          }}
                          className="px-2.5 py-1 rounded bg-brand-ivory border border-brand-evergreen/15 flex items-center gap-1.5 text-brand-evergreen hover:bg-white"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedToken === inv.id ? 'Copied URL!' : 'Copy Invite Link'}</span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-brand-forest/60">
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-brand-evergreen/10 flex items-center justify-between">
            <h3 className="font-bold text-sm text-brand-evergreen dark:text-white">
              Immutable Organization Security Audit Stream
            </h3>
            <span className="text-xs text-brand-forest/60">Showing latest {auditLogs.length} events</span>
          </div>
          <div className="divide-y divide-brand-evergreen/5 max-h-[600px] overflow-y-auto">
            {auditLogs.map(audit => (
              <div key={audit.id} className="p-4 hover:bg-brand-ivory/40 text-xs flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-brand-forest/10 text-brand-evergreen dark:text-brand-mint">
                      {audit.entity_type}
                    </span>
                    <span className="font-bold text-brand-forest dark:text-brand-dark-text">
                      {audit.action}
                    </span>
                  </div>
                  <p className="text-brand-forest/80 dark:text-brand-dark-muted">
                    {audit.details || 'No additional details logged.'}
                  </p>
                  {audit.actor && (
                    <span className="text-[11px] text-brand-forest/60 block">
                      Actor: {audit.actor.full_name} ({audit.actor.email})
                    </span>
                  )}
                </div>
                <div className="text-right text-[11px] text-brand-forest/50 whitespace-nowrap">
                  <div>{new Date(audit.created_at).toLocaleDateString()}</div>
                  <div>{new Date(audit.created_at).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: ORG SETTINGS */}
      {activeTab === 'org' && currentOrg && (
        <Card className="p-6 max-w-xl space-y-4">
          <h3 className="text-base font-bold text-brand-evergreen dark:text-white font-sans">
            Tenancy Details
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-semibold text-brand-forest/60 block">Organization Name</span>
              <span className="text-sm font-bold text-brand-forest dark:text-brand-dark-text">{currentOrg.name}</span>
            </div>
            <div>
              <span className="font-semibold text-brand-forest/60 block">Tenant Identifier (Slug)</span>
              <code className="text-xs font-mono font-bold text-brand-jade">{currentOrg.slug}</code>
            </div>
            <div>
              <span className="font-semibold text-brand-forest/60 block">Corporate Domain</span>
              <span className="text-xs text-brand-forest dark:text-brand-dark-text">{currentOrg.domain || 'apexlogistics.com'}</span>
            </div>
            <div>
              <span className="font-semibold text-brand-forest/60 block">Database Scoping</span>
              <span className="text-xs text-brand-forest dark:text-brand-dark-text">Strict PostgreSQL Multi-Tenant Partitioning Active</span>
            </div>
          </div>
        </Card>
      )}

      {/* TAB: LOCATIONS */}
      {activeTab === 'locations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-brand-evergreen dark:text-white">Facility Locations & Work Areas</h2>
              <p className="text-xs text-brand-forest/70 dark:text-brand-dark-muted">
                Predefine physical sites, buildings, floors, and rooms for maintenance routing
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<MapPin className="w-3.5 h-3.5" />}
              onClick={() => setLocationModalOpen(true)}
            >
              Add Facility Location
            </Button>
          </div>

          {locations.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <MapPin className="w-10 h-10 text-brand-forest/30 mx-auto" />
              <p className="text-xs font-semibold text-brand-forest/60">No locations added yet.</p>
              <p className="text-[11px] text-brand-forest/50 max-w-sm mx-auto">
                Locations help technicians and customers pinpoint exactly where equipment breakdowns or maintenance work are occurring.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocationModalOpen(true)}
              >
                Create First Location
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map(loc => (
                <Card key={loc.id} className="p-4 space-y-2 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-brand-evergreen dark:text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-jade" />
                      {loc.name}
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                      Active
                    </span>
                  </div>
                  <div className="text-[11px] text-brand-forest/70 dark:text-brand-dark-muted space-y-0.5">
                    {loc.building && <div><span className="font-medium">Building:</span> {loc.building}</div>}
                    {loc.floor && <div><span className="font-medium">Floor:</span> {loc.floor}</div>}
                    {loc.room && <div><span className="font-medium">Room/Bay:</span> {loc.room}</div>}
                    {loc.address && <div className="text-[10px] text-brand-forest/50 truncate"><span className="font-medium">Address:</span> {loc.address}</div>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => {
          setInviteModalOpen(false);
          setGeneratedInvite(null);
        }}
        title={generatedInvite ? "Invitation Ready" : "Invite Team Member"}
        subtitle={
          generatedInvite
            ? `Share this activation link with ${generatedInvite.email}`
            : "Provision access for Customer, Technician, Manager, or Admin"
        }
        maxWidth="md"
      >
        {generatedInvite ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-brand-mint/20 border border-brand-jade/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-evergreen dark:text-brand-mint">
                <CheckCircle2 className="w-4 h-4 text-brand-jade" />
                <span>Invitation created for {generatedInvite.email} ({generatedInvite.role})</span>
              </div>
              <p className="text-[11px] text-brand-forest/70 dark:text-brand-dark-muted">
                Send this link directly to the invited colleague to let them complete account setup:
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/accept-invitation?token=${generatedInvite.token}`}
                  className="flex-1 px-3 py-2 text-[11px] font-mono rounded-lg border border-brand-evergreen/20 bg-white dark:bg-brand-dark-bg select-all outline-none"
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/accept-invitation?token=${generatedInvite.token}`);
                    setCopiedToken(generatedInvite.token);
                    setTimeout(() => setCopiedToken(null), 3000);
                  }}
                >
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  {copiedToken === generatedInvite.token ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratedInvite(null);
                  setInviteModalOpen(false);
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault();
              inviteMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
                Colleague Email Address *
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="technician@company.com"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-brand-evergreen/20 bg-brand-ivory/20 dark:bg-brand-dark-bg outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
                Select Role
              </label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 bg-brand-ivory/20 dark:bg-brand-dark-bg outline-none"
              >
                <option value="Technician">Technician — Field repairs, mobile logs, work evidence</option>
                <option value="Manager">Manager — Dispatch, review, assignments, workload</option>
                <option value="Customer">Customer — Report issues, track status, verify fixes</option>
                <option value="Admin">Admin — Full organization settings, user invitations</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setInviteModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={inviteMutation.isPending}>
                Generate Invitation
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Location Modal */}
      <Modal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        title="Add Facility Location"
        subtitle="Define physical areas, warehouses, or rooms for maintenance requests"
        maxWidth="md"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            locationMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
              Location / Area Name *
            </label>
            <input
              type="text"
              required
              value={locName}
              onChange={e => setLocName(e.target.value)}
              placeholder="e.g. Loading Dock West, Plant Alpha"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-brand-evergreen/20 bg-brand-ivory/20 dark:bg-brand-dark-bg outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
                Building
              </label>
              <input
                type="text"
                value={locBuilding}
                onChange={e => setLocBuilding(e.target.value)}
                placeholder="Building B"
                className="w-full px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 bg-brand-ivory/20 dark:bg-brand-dark-bg outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
                Floor
              </label>
              <input
                type="text"
                value={locFloor}
                onChange={e => setLocFloor(e.target.value)}
                placeholder="Level 2"
                className="w-full px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 bg-brand-ivory/20 dark:bg-brand-dark-bg outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
                Room / Bay
              </label>
              <input
                type="text"
                value={locRoom}
                onChange={e => setLocRoom(e.target.value)}
                placeholder="Bay 14"
                className="w-full px-3 py-2 text-xs rounded-xl border border-brand-evergreen/20 bg-brand-ivory/20 dark:bg-brand-dark-bg outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
              Physical Address or Notes
            </label>
            <input
              type="text"
              value={locAddress}
              onChange={e => setLocAddress(e.target.value)}
              placeholder="e.g. 500 Industrial Parkway, North Entrance"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-brand-evergreen/20 bg-brand-ivory/20 dark:bg-brand-dark-bg outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setLocationModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={locationMutation.isPending}>
              Create Location
            </Button>
          </div>
        </form>
      </Modal>

      {assigningReqId && (
        <AssignmentModal
          isOpen={!!assigningReqId}
          onClose={() => {
            setAssigningReqId(null);
            queryClient.invalidateQueries({ queryKey: ['requests'] });
          }}
          requestId={assigningReqId}
        />
      )}
    </div>
  );
};
