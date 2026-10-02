import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const PricingPage: React.FC = () => {
  return (
    <div className="py-12 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-jade">Plans & Investment</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-evergreen dark:text-white mt-2 font-sans">
          Simple, honest pricing for growing teams
        </h1>
        <p className="mt-4 text-base text-brand-forest/75 dark:text-brand-dark-muted max-w-2xl mx-auto">
          Scale your maintenance operations seamlessly. Every plan includes full access to all 4 connected roles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Starter */}
        <div className="p-8 rounded-3xl bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-brand-evergreen dark:text-white">Starter</h3>
            <p className="text-xs text-brand-forest/60 dark:text-brand-dark-muted mt-1">For single facility operations</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-black text-brand-evergreen dark:text-white">$49</span>
              <span className="text-xs text-brand-forest/60 dark:text-brand-dark-muted">/ month</span>
            </div>
            <ul className="mt-8 space-y-3.5 text-xs text-brand-forest/80 dark:text-brand-dark-text">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade flex-shrink-0" /> Up to 5 technicians & managers</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade flex-shrink-0" /> Unlimited customer requests</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade flex-shrink-0" /> Photo evidence & work logs</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade flex-shrink-0" /> Basic operational metrics</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade flex-shrink-0" /> Email notifications</li>
            </ul>
          </div>
          <Link to="/register" className="mt-8">
            <Button variant="outline" className="w-full">Get started</Button>
          </Link>
        </div>

        {/* Professional */}
        <div className="p-8 rounded-3xl bg-brand-evergreen text-white dark:bg-brand-dark-card dark:border-brand-jade shadow-elevated relative flex flex-col justify-between">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-jade text-white text-[10px] font-bold uppercase tracking-wider">
            Most popular
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Professional</h3>
            <p className="text-xs text-white/70 mt-1">For multi-building campuses & logistics</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">$149</span>
              <span className="text-xs text-white/70">/ month</span>
            </div>
            <ul className="mt-8 space-y-3.5 text-xs text-white/90">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-mint flex-shrink-0" /> Up to 25 technicians & managers</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-mint flex-shrink-0" /> Preventive maintenance scheduler</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-mint flex-shrink-0" /> AI diagnostics & auto-categorization</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-mint flex-shrink-0" /> Comprehensive audit logs</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-mint flex-shrink-0" /> Priority SLA alerts & push</li>
            </ul>
          </div>
          <Link to="/register" className="mt-8">
            <Button variant="mint" className="w-full">Start moving work →</Button>
          </Link>
        </div>

        {/* Enterprise */}
        <div className="p-8 rounded-3xl bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-brand-evergreen dark:text-white">Enterprise</h3>
            <p className="text-xs text-brand-forest/60 dark:text-brand-dark-muted mt-1">For nationwide operations</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-black text-brand-evergreen dark:text-white">$399</span>
              <span className="text-xs text-brand-forest/60 dark:text-brand-dark-muted">/ month</span>
            </div>
            <ul className="mt-8 space-y-3.5 text-xs text-brand-forest/80 dark:text-brand-dark-text">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade flex-shrink-0" /> Unlimited technicians & facilities</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade flex-shrink-0" /> Dedicated PostgreSQL instance</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade flex-shrink-0" /> Custom ERP / CMMS integrations</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade flex-shrink-0" /> 99.9% uptime SLA</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade flex-shrink-0" /> 24/7 dedicated support team</li>
            </ul>
          </div>
          <Link to="/contact" className="mt-8">
            <Button variant="outline" className="w-full">Contact sales</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
