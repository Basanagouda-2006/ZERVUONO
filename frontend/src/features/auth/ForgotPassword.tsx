import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { apiRequest } from '../../lib/api';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiRequest<{ message: string; dev_token?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
      if (res.dev_token) {
        setDevToken(res.dev_token);
      }
    } catch {
      setSubmitted(true);
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
            Reset your password
          </h2>
          <p className="mt-2 text-xs text-brand-forest/60 dark:text-brand-dark-muted">
            Enter your account email to receive recovery instructions
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-brand-mint/20 border border-brand-mint/40 text-center">
              <CheckCircle2 className="w-8 h-8 text-brand-jade mx-auto mb-2" />
              <p className="text-xs font-semibold text-brand-evergreen dark:text-brand-mint">
                Recovery instructions sent
              </p>
              <p className="text-[11px] text-brand-forest/70 dark:text-brand-dark-muted mt-1">
                If an account with that email exists, a password reset link has been dispatched.
              </p>
            </div>

            {devToken && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-left">
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase block mb-1">
                  Local Dev Reset Token:
                </span>
                <code className="text-xs font-mono break-all text-amber-900 dark:text-amber-200 select-all">
                  {devToken}
                </code>
                <Link
                  to={`/reset-password?token=${devToken}`}
                  className="block mt-2 text-xs font-bold text-brand-jade hover:underline"
                >
                  Click here to complete password reset →
                </Link>
              </div>
            )}

            <Link to="/login" className="block text-center text-xs text-brand-forest/70 hover:text-brand-evergreen">
              ← Return to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
                Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-brand-forest/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/20 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Send reset instructions
            </Button>

            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center gap-1 text-xs text-brand-forest/70 hover:text-brand-evergreen">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
