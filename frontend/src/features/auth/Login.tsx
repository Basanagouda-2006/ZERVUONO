import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { Lock, Mail, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(email, password);
      // Route by role
      if (user.role === 'Customer') navigate('/customer');
      else if (user.role === 'Technician') navigate('/technician');
      else if (user.role === 'Manager') navigate('/manager');
      else if (user.role === 'Admin') navigate('/admin');
      else navigate('/workspace');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-brand-dark-card p-8 sm:p-10 rounded-3xl border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card">
        <div className="text-center">
          <Logo size="lg" />
          <h2 className="mt-6 text-2xl font-extrabold text-brand-evergreen dark:text-white font-sans">
            Sign in to your workspace
          </h2>
          <p className="mt-2 text-xs text-brand-forest/60 dark:text-brand-dark-muted">
            Maintenance operations platform for connected teams
          </p>
        </div>

        {/* Quick Demo Switcher Pills */}
        <div className="p-3.5 rounded-2xl bg-brand-ivory/60 dark:bg-brand-dark-bg border border-brand-evergreen/10 dark:border-brand-dark-border">
          <div className="text-[11px] font-bold uppercase tracking-wider text-brand-forest/70 dark:text-brand-dark-muted mb-2 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-brand-jade" />
            <span>1-Click Demo Profiles</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('manager@zervuno.com')}
              className="px-2.5 py-1.5 text-left rounded-lg bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 hover:border-brand-jade transition-colors"
            >
              <div className="font-bold text-brand-evergreen dark:text-brand-mint">Manager</div>
              <div className="text-[10px] text-brand-forest/60 truncate">David Miller</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('tech@zervuno.com')}
              className="px-2.5 py-1.5 text-left rounded-lg bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 hover:border-brand-jade transition-colors"
            >
              <div className="font-bold text-brand-evergreen dark:text-brand-mint">Technician</div>
              <div className="text-[10px] text-brand-forest/60 truncate">Alex Vance</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('customer@zervuno.com')}
              className="px-2.5 py-1.5 text-left rounded-lg bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 hover:border-brand-jade transition-colors"
            >
              <div className="font-bold text-brand-evergreen dark:text-brand-mint">Customer</div>
              <div className="text-[10px] text-brand-forest/60 truncate">Elena Rostova</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@zervuno.com')}
              className="px-2.5 py-1.5 text-left rounded-lg bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 hover:border-brand-jade transition-colors"
            >
              <div className="font-bold text-brand-evergreen dark:text-brand-mint">Admin</div>
              <div className="text-[10px] text-brand-forest/60 truncate">Sarah Jenkins</div>
            </button>
          </div>
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
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-brand-forest/40" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text">
                Password
              </label>
              <Link to="/forgot-password" className="text-[11px] text-brand-jade hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-brand-forest/40" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none transition-all"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            <span>Sign in</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-brand-forest/70 dark:text-brand-dark-muted">
            New organization?{' '}
            <Link to="/register" className="font-semibold text-brand-jade hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
