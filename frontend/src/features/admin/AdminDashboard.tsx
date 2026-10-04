import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Clock
} from 'lucide-react';
import { Membership, Invitation, AuditEvent, Organization, Location, Asset } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { apiRequest } from '../../lib/api';

export const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'audit' | 'org'>('members');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Technician');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [generatedInvite, setGeneratedInvite] = useState<{ email: string; token: string; role: string } | null>(null);

  // Queries
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
            Manage users, role permissions, invitations, and compliance audit logs
          </p>
        </div>
        <Button variant="primary" icon={<UserPlus className="w-4 h-4" />} onClick={() => setInviteModalOpen(true)}>
          Invite Team Member
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-evergreen/10 dark:border-brand-dark-border gap-2 sm:gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
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
    </div>
  );
};
