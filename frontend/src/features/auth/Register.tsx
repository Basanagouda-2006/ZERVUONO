import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { Lock, Mail, User, Building, AlertCircle, ArrowRight, Check, X } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        organization_name: orgName || undefined,
      });
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-brand-dark-card p-8 sm:p-10 rounded-3xl border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card">
        <div className="text-center">
          <Logo size="lg" />
          <h2 className="mt-6 text-2xl font-extrabold text-brand-evergreen dark:text-white font-sans">
            Create your organization
          </h2>
          <p className="mt-2 text-xs text-brand-forest/60 dark:text-brand-dark-muted">
            Start managing maintenance, technicians, and work orders
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Sarah Jenkins"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-brand-forest/40" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="sarah@apexlogistics.com"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
              Organization / Facility Name
            </label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3 top-3 text-brand-forest/40" />
              <input
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="Apex Logistics & Warehousing"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none transition-all"
              />
            </div>
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
            <span>Create Organization & Admin</span>
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
