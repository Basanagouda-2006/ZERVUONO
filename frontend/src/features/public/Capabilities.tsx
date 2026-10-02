import React from 'react';
import { Database, ShieldCheck, Sparkles, Smartphone, BarChart3, Wrench, Clock, FileCheck2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export const Capabilities: React.FC = () => {
  const capabilities = [
    {
      icon: <Database className="w-6 h-6 text-brand-jade" />,
      title: 'Real PostgreSQL Persistence',
      description: 'Built on normalized PostgreSQL tables with strict foreign keys, timezone-aware timestamps, and multi-tenant organization scoping on every query.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-brand-jade" />,
      title: 'State Machine & RBAC Security',
      description: 'Rigorous backend-enforced transitions across 9 workflow states. Argon2id password hashing, HttpOnly session cookies, and granular role permissions.',
    },
    {
      icon: <Smartphone className="w-6 h-6 text-brand-jade" />,
      title: 'Field-Ready Mobile Interface',
      description: 'Optimized touch experience for technicians on the move. Large touch targets, high contrast, smooth photo evidence uploads, and real-time alerts.',
    },
    {
      icon: <Sparkles className="w-6 h-6 text-brand-jade" />,
      title: 'Grounded AI & RAG Insights',
      description: 'Intelligent category detection, similar historical issue matching, diagnostic suggestions, and automated hand-off summaries using Gemini API.',
    },
    {
      icon: <Clock className="w-6 h-6 text-brand-jade" />,
      title: 'Preventive Maintenance Automation',
      description: 'Scheduled recurrence engines for recurring inspections (weekly, monthly, quarterly) to prevent equipment failure before it causes downtime.',
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-brand-jade" />,
      title: 'True Operational Metrics',
      description: 'Calculated from real database timestamps: average response time, time-to-resolution, technician workload, first-time fix rates, and reopening percentages.',
    },
  ];

  return (
    <div className="py-12 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-jade">Architecture & Tech</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-evergreen dark:text-white mt-2 font-sans">
          Built for production scale and reliability
        </h1>
        <p className="mt-4 text-base text-brand-forest/75 dark:text-brand-dark-muted max-w-2xl mx-auto">
          Zervuno combines rock-solid database engineering with thoughtful user experience for all four operational roles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {capabilities.map((cap, i) => (
          <Card key={i} className="p-8 hoverEffect" hoverEffect>
            <div className="w-12 h-12 rounded-xl bg-brand-mint/30 flex items-center justify-center mb-6">
              {cap.icon}
            </div>
            <h3 className="text-lg font-bold text-brand-evergreen dark:text-white mb-2">
              {cap.title}
            </h3>
            <p className="text-xs text-brand-forest/70 dark:text-brand-dark-muted leading-relaxed">
              {cap.description}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};
