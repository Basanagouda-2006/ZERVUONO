import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { Lock, Mail, User, Building, AlertCircle, ArrowRight, Check, X, Wrench, Shield, Briefcase, Users } from 'lucide-react';
import { apiRequest } from '../../lib/api';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [availableOrgs, setAvailableOrgs] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('new');
  const [role, setRole] = useState<UserRole>('Customer');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    apiRequest<{ id: string; name: string; slug: string }[]>('/organizations/public-list')
      .then(orgs => {
        if (orgs && orgs.length > 0) {
          setAvailableOrgs(orgs);
          setSelectedOrgId(orgs[0].id);
        }
      })
      .catch(() => {
        // Fall back gracefully
      });
  }, []);

  // Live password validation
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNum = /\d/.test(password);
  const isPasswordValid = hasMinLen && hasUpper && hasLower && hasNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please satisfy all password security criteria.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const user = await register({
        email,
        password,
        full_name: fullName,
        organization_id: selectedOrgId !== 'new' ? selectedOrgId : undefined,
        organization_name: selectedOrgId === 'new' && orgName.trim() ? orgName.trim() : undefined,
        role: role,
      });

      // Route directly into intended workspace
      if (user.role === 'Customer') navigate('/customer');
      else if (user.role === 'Technician') navigate('/technician');
      else if (user.role === 'Manager') navigate('/manager');
      else if (user.role === 'Admin') navigate('/admin');
      else navigate('/customer');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions: { role: UserRole; title: string; desc: string; icon: any }[] = [
    {
      role: 'Customer',
      title: 'Customer / Requester',
      desc: 'Report facility issues, track tickets, confirm repairs & give ratings',
      icon: Users,
    },
    {
      role: 'Technician',
      title: 'Technician',
      desc: 'Accept field jobs, use AI diagnostics, log hours & upload photo proof',
      icon: Wrench,
    },
    {
      role: 'Manager',
      title: 'Operations Manager',
      desc: 'Review queue, prioritize issues, assign technicians & track SLAs',
      icon: Briefcase,
    },
    {
      role: 'Admin',
      title: 'Administrator',
      desc: 'Full workspace control, user roles, invitations, assets & audit logs',
      icon: Shield,
    },
  ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-7 bg-white dark:bg-brand-dark-card p-8 sm:p-10 rounded-3xl border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card">
        <div className="text-center">
          <Logo size="lg" />
          <h2 className="mt-6 text-2xl font-extrabold text-brand-evergreen dark:text-white font-sans">
            Create your account
          </h2>
          <p className="mt-2 text-xs text-brand-forest/60 dark:text-brand-dark-muted">
            Select your role to connect directly to the operational workflow
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection Grid */}
          <div>
            <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map(opt => {
                const IconComponent = opt.icon;
                const isSelected = role === opt.role;
                return (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => setRole(opt.role)}
                    className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand-jade bg-brand-jade/10 text-brand-evergreen dark:text-white ring-2 ring-brand-jade/20'
                        : 'border-brand-evergreen/10 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg hover:border-brand-jade/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <IconComponent className={`w-4 h-4 ${isSelected ? 'text-brand-jade' : 'text-brand-forest/60 dark:text-brand-dark-muted'}`} />
                        <span className="text-xs font-bold">{opt.title}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-jade" />}
                    </div>
                    <p className="text-[10px] text-brand-forest/65 dark:text-brand-dark-muted leading-tight">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
              Your Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-brand-forest/40" />
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-brand-forest/40" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@company.com"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text">
                Workspace / Organization
              </label>
              <span className="text-[10px] text-brand-forest/50 dark:text-brand-dark-muted">
                {selectedOrgId !== 'new' ? 'Shared team workspace' : 'New organization'}
              </span>
            </div>
            
            {availableOrgs.length > 0 ? (
              <div className="space-y-2">
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-3 text-brand-forest/40" />
                  <select
                    value={selectedOrgId}
                    onChange={e => setSelectedOrgId(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none transition-all"
                  >
                    {availableOrgs.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.slug})
                      </option>
                    ))}
                    <option value="new">+ Create a new organization...</option>
                  </select>
                </div>

                {selectedOrgId === 'new' && (
                  <div className="relative">
                    <input
                      type="text"
                      value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      placeholder="e.g. Acme Industrial Services"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none transition-all"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-3 text-brand-forest/40" />
                <input
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Industrial Services"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none transition-all"
                />
              </div>
            )}
            <p className="mt-1 text-[10px] text-brand-forest/50 dark:text-brand-dark-muted">
              {selectedOrgId !== 'new'
                ? 'Your account will be connected directly to this shared organization.'
                : 'Enter a name to create a new shared organization.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
              Password (Argon2id Hashed)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-brand-forest/40" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none transition-all"
              />
            </div>

            {/* Live Password Strength Criteria */}
            <div className="mt-2.5 grid grid-cols-2 gap-1 text-[11px] text-brand-forest/60 dark:text-brand-dark-muted">
              <span className={`flex items-center gap-1 ${hasMinLen ? 'text-brand-jade font-semibold' : ''}`}>
                {hasMinLen ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-red-500" />} 8+ characters
              </span>
              <span className={`flex items-center gap-1 ${hasUpper ? 'text-brand-jade font-semibold' : ''}`}>
                {hasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-red-500" />} 1 uppercase
              </span>
              <span className={`flex items-center gap-1 ${hasLower ? 'text-brand-jade font-semibold' : ''}`}>
                {hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-red-500" />} 1 lowercase
              </span>
              <span className={`flex items-center gap-1 ${hasNum ? 'text-brand-jade font-semibold' : ''}`}>
                {hasNum ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-red-500" />} 1 number
              </span>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} disabled={!isPasswordValid}>
            <span>Create Account as {role}</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-brand-forest/70 dark:text-brand-dark-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-jade hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
