import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="py-12 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-jade">Get in touch</span>
        <h1 className="text-4xl font-extrabold text-brand-evergreen dark:text-white mt-2 font-sans">
          Let’s discuss your maintenance operations
        </h1>
        <p className="mt-3 text-sm text-brand-forest/75 dark:text-brand-dark-muted">
          Our solutions specialists are ready to help you implement Zervuno.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-brand-dark-card p-8 rounded-3xl border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card">
        {/* Info */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-brand-evergreen dark:text-white">
            Reach out directly
          </h3>
          <p className="text-xs text-brand-forest/70 dark:text-brand-dark-muted leading-relaxed">
            Have questions about integrations, security reviews, or enterprise onboarding? We are here to support your operations team.
          </p>

          <div className="space-y-4 pt-4 text-xs text-brand-forest/80 dark:text-brand-dark-text">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-brand-jade" />
              <span>operations@zervuno.com</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-brand-jade" />
              <span>+1 (800) 555-ZERV</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-brand-jade" />
              <span>San Francisco, CA & Remote Global</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div>
          {submitted ? (
            <div className="p-8 text-center bg-brand-mint/20 rounded-2xl border border-brand-mint/40">
              <CheckCircle2 className="w-10 h-10 text-brand-jade mx-auto mb-3" />
              <h4 className="text-base font-bold text-brand-evergreen dark:text-white">Message received!</h4>
              <p className="text-xs text-brand-forest/70 dark:text-brand-dark-muted mt-1">
                An operations specialist will respond within 4 business hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/30 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="jane@company.com"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/30 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-forest dark:text-brand-dark-text mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us about your facilities or fleet..."
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-brand-evergreen/20 dark:border-brand-dark-border bg-brand-ivory/30 dark:bg-brand-dark-bg focus:ring-2 focus:ring-brand-jade outline-none"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full">
                <Send className="w-4 h-4 mr-2" /> Send message
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
