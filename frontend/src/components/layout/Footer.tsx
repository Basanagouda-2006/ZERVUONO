import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { Shield, Sparkles, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-cream dark:bg-brand-dark-card border-t border-brand-evergreen/10 dark:border-brand-dark-border text-brand-forest dark:text-brand-dark-text transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <Logo size="md" />
            <p className="mt-3 text-sm text-brand-forest/75 dark:text-brand-dark-muted max-w-sm font-sans leading-relaxed">
              Zervuno brings maintenance requests, technicians, proof of work, and customer verification into one clear rhythm.
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs text-brand-forest/60 dark:text-brand-dark-muted">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-jade" /> Real PostgreSQL
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-brand-jade" /> Role-Based Access
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-jade" /> AI Assisted
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-evergreen dark:text-brand-mint mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm text-brand-forest/80 dark:text-brand-dark-muted">
              <li>
                <Link to="/how-it-works" className="hover:text-brand-evergreen dark:hover:text-white transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link to="/capabilities" className="hover:text-brand-evergreen dark:hover:text-white transition-colors">
                  Capabilities
                </Link>
              </li>
              <li>
                <Link to="/teams" className="hover:text-brand-evergreen dark:hover:text-white transition-colors">
                  For teams
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-brand-evergreen dark:hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Roles */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-evergreen dark:text-brand-mint mb-4">
              Roles & Workflows
            </h4>
            <ul className="space-y-2.5 text-sm text-brand-forest/80 dark:text-brand-dark-muted">
              <li>
                <Link to="/login" className="hover:text-brand-evergreen dark:hover:text-white transition-colors">
                  Customer Portal
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-evergreen dark:hover:text-white transition-colors">
                  Manager Dispatch
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-evergreen dark:hover:text-white transition-colors">
                  Technician Mobile App
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-evergreen dark:hover:text-white transition-colors">
                  Admin Governance
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-evergreen dark:text-brand-mint mb-4">
              Trust & Legal
            </h4>
            <ul className="space-y-2.5 text-sm text-brand-forest/80 dark:text-brand-dark-muted">
              <li>
                <Link to="/privacy" className="hover:text-brand-evergreen dark:hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-brand-evergreen dark:hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brand-evergreen dark:hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-brand-evergreen/10 dark:border-brand-dark-border flex flex-col sm:flex-row items-center justify-between text-xs text-brand-forest/60 dark:text-brand-dark-muted">
          <p>© {new Date().getFullYear()} Zervuno. All rights reserved. Keep work moving.</p>
          <p className="mt-2 sm:mt-0">Enterprise-grade maintenance operations SaaS.</p>
        </div>
      </div>
    </footer>
  );
};
