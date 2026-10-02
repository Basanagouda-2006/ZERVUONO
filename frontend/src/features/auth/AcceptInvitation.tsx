import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { User, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api';

export const AcceptInvitation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Missing invitation token.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      await apiRequest('/organizations/accept-invitation', {
        method: 'POST',
        body: JSON.stringify({ token, full_name: fullName, password }),
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-brand-dark-card p-8 sm:p-10 rounded-3xl border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card">
        <div className="text-center">
          <Logo size="lg" />
          <h2 className="mt-6 text-2xl font-extrabold text-brand-evergreen dark:text-white font-sans">
            Accept team invitation
          </h2>
          <p className="mt-2 text-xs text-brand-forest/60 dark:text-brand-dark-muted">
            Complete your profile to join your maintenance team
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-4 bg-brand-mint/20 border border-brand-mint/40 rounded-2xl text-center">
            <CheckCircle2 className="w-8 h-8 text-brand-jade mx-auto mb-2" />
            <p className="text-xs font-bold text-brand-evergreen">Invitation accepted!</p>
            <p className="text-[11px] text-brand-forest/60 mt-1">Redirecting to sign in...</p>
          </div>
        ) : (
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
                  placeholder="Alex Vance"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
                Set Account Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-brand-forest/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Join organization
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
