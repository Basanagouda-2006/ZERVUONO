import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  TrendingUp,
  Shield,
  Clock,
  Sparkles,
  Smartphone,
  Wrench,
  Users,
  ChevronRight,
  FileCheck2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-ivory dark:bg-brand-dark-bg text-brand-forest dark:text-brand-dark-text transition-colors">
      {/* HERO SECTION — EXACT RECREATION OF REFERENCE SCREENSHOT */}
      <section className="relative pt-6 sm:pt-12 lg:pt-16 pb-16 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-6 space-y-6 sm:space-y-8">
              {/* Badge from screenshot: Pink/coral dot + THE CALM BEHIND EVERY OPERATION */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-forest/5 dark:bg-brand-dark-card border border-brand-evergreen/10 dark:border-brand-dark-border">
                <span className="w-2 h-2 rounded-full bg-brand-coral animate-pulse" />
                <span className="text-xs font-bold tracking-widest uppercase text-brand-forest/80 dark:text-brand-mint font-sans">
                  The calm behind every operation
                </span>
              </div>

              {/* Headline from screenshot: Maintenance that moves work forward. */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-brand-evergreen dark:text-white leading-[1.1] font-sans">
                Maintenance that{' '}
                <span className="text-brand-jade underline decoration-brand-mint/40 decoration-wavy decoration-2">
                  moves
                </span>{' '}
                work forward.
              </h1>

              {/* Subtitle from screenshot */}
              <p className="text-base sm:text-lg text-brand-forest/80 dark:text-brand-dark-muted max-w-xl leading-relaxed font-sans">
                Zervuno brings requests, people, and proof of work into one clear rhythm — so teams can spend less time chasing updates and more time making progress.
              </p>

              {/* CTAs from screenshot */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link to="/register">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-brand-evergreen hover:bg-brand-forest text-white font-semibold text-sm shadow-soft transition-all active:scale-[0.98]">
                    <span>Start moving work</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-semibold text-brand-forest dark:text-brand-dark-text hover:text-brand-evergreen transition-colors"
                >
                  <span>See how it works</span>
                  <ArrowDown className="w-4 h-4" />
                </a>
              </div>

              {/* Social Proof from screenshot: 4 avatars + rating */}
              <div className="pt-4 flex items-center gap-4">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-brand-evergreen text-white flex items-center justify-center text-[10px] font-bold border-2 border-brand-ivory dark:border-brand-dark-bg">
                    AM
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand-coral text-white flex items-center justify-center text-[10px] font-bold border-2 border-brand-ivory dark:border-brand-dark-bg">
                    JL
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand-amber text-white flex items-center justify-center text-[10px] font-bold border-2 border-brand-ivory dark:border-brand-dark-bg">
                    RK
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand-mint text-brand-evergreen flex items-center justify-center text-[11px] font-bold border-2 border-brand-ivory dark:border-brand-dark-bg">
                    +
                  </div>
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-brand-forest dark:text-brand-dark-text">
                    Trusted by teams that keep places running
                  </p>
                  <p className="text-brand-forest/60 dark:text-brand-dark-muted">
                    4.9/5 average experience rating
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Media Card matching screenshot */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-elevated border border-brand-evergreen/15 dark:border-brand-dark-border bg-white dark:bg-brand-dark-card aspect-[4/3] sm:aspect-[16/11]">
                {/* Workplace Technician Photography */}
                <img
                  src="/hero-technician.jpg"
                  alt="Operations specialist in warehouse facility"
                  className="w-full h-full object-cover object-center"
                />

                {/* Subtle dark gradient overlay at top/bottom for card contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-forest/80 via-transparent to-brand-forest/20 pointer-events-none" />

                {/* Floating Notification Card: Top-Left */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-white/95 dark:bg-brand-dark-card/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-card border border-brand-evergreen/10 dark:border-brand-dark-border flex items-center gap-3 animate-fade-in">
                  <div className="w-7 h-7 rounded-full bg-brand-mint/50 flex items-center justify-center text-brand-evergreen flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-brand-jade" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-evergreen dark:text-white leading-tight">
                        Work order resolved
                      </span>
                      <span className="text-[10px] text-brand-forest/50 dark:text-brand-dark-muted">
                        now
                      </span>
                    </div>
                    <span className="text-[11px] text-brand-forest/70 dark:text-brand-dark-muted block">
                      HVAC · North wing
                    </span>
                  </div>
                </div>

                {/* Floating Metric Card: Bottom-Right */}
                <div className="absolute bottom-12 right-4 sm:bottom-14 sm:right-6 bg-white/95 dark:bg-brand-dark-card/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-card border border-brand-evergreen/10 dark:border-brand-dark-border flex items-center gap-3 animate-fade-in">
                  <div className="w-7 h-7 rounded-lg bg-brand-mint/30 flex items-center justify-center text-brand-jade flex-shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-brand-forest/70 dark:text-brand-dark-muted block">
                      Team efficiency
                    </span>
                    <span className="text-xs font-bold text-brand-evergreen dark:text-brand-mint">
                      +18.4% this month
                    </span>
                  </div>
                </div>

                {/* Bottom Bar Indicator from Screenshot: 01 / 04 & ONE CONNECTED VIEW */}
                <div className="absolute bottom-3 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between text-[11px] font-mono font-bold tracking-wider text-white/90">
                  <span>01 / 04</span>
                  <span className="uppercase text-[10px] tracking-widest text-white/80">
                    ONE CONNECTED VIEW
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: 4 CONNECTED ROLES WORKFLOW */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white dark:bg-brand-dark-card border-y border-brand-evergreen/10 dark:border-brand-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-jade mb-3">
              Connected Operations Rhythm
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-brand-evergreen dark:text-white font-sans">
              Customer → Manager → Technician → Customer
            </h3>
            <p className="mt-4 text-base text-brand-forest/80 dark:text-brand-dark-muted">
              Every request follows an audited state machine. Never lose track of an open issue, missing spare part, or unverified repair.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1: Customer Report */}
            <div className="p-6 rounded-2xl bg-brand-ivory/50 dark:bg-brand-dark-bg border border-brand-evergreen/10 dark:border-brand-dark-border flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-evergreen text-white flex items-center justify-center font-bold text-sm mb-4">
                  01
                </div>
                <h4 className="text-lg font-bold text-brand-evergreen dark:text-brand-mint mb-2">
                  Customer Reports
                </h4>
                <p className="text-xs text-brand-forest/70 dark:text-brand-dark-muted leading-relaxed">
                  Submits issue with title, description, category, photo evidence, and location. AI recommends priority instantly.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-brand-evergreen/10 dark:border-brand-dark-border flex items-center gap-2 text-xs font-medium text-brand-evergreen dark:text-brand-mint">
                <span>State: Submitted</span>
              </div>
            </div>

            {/* Step 2: Manager Review & Assign */}
            <div className="p-6 rounded-2xl bg-brand-ivory/50 dark:bg-brand-dark-bg border border-brand-evergreen/10 dark:border-brand-dark-border flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-jade text-white flex items-center justify-center font-bold text-sm mb-4">
                  02
                </div>
                <h4 className="text-lg font-bold text-brand-evergreen dark:text-brand-mint mb-2">
                  Manager Dispatches
                </h4>
                <p className="text-xs text-brand-forest/70 dark:text-brand-dark-muted leading-relaxed">
                  Reviews urgency, specifies instructions, and assigns a skilled technician. Real-time notification delivered.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-brand-evergreen/10 dark:border-brand-dark-border flex items-center gap-2 text-xs font-medium text-brand-amber">
                <span>State: Assigned</span>
              </div>
            </div>

            {/* Step 3: Technician Work */}
            <div className="p-6 rounded-2xl bg-brand-ivory/50 dark:bg-brand-dark-bg border border-brand-evergreen/10 dark:border-brand-dark-border flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-amber text-white flex items-center justify-center font-bold text-sm mb-4">
                  03
                </div>
                <h4 className="text-lg font-bold text-brand-evergreen dark:text-brand-mint mb-2">
                  Technician Repairs
                </h4>
                <p className="text-xs text-brand-forest/70 dark:text-brand-dark-muted leading-relaxed">
                  Accepts assignment on mobile, runs diagnostics, records time and materials, and submits resolution proof.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-brand-evergreen/10 dark:border-brand-dark-border flex items-center gap-2 text-xs font-medium text-brand-coral">
                <span>State: In Progress</span>
              </div>
            </div>

            {/* Step 4: Customer Verification */}
            <div className="p-6 rounded-2xl bg-brand-ivory/50 dark:bg-brand-dark-bg border border-brand-evergreen/10 dark:border-brand-dark-border flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-turquoise text-brand-forest flex items-center justify-center font-bold text-sm mb-4">
                  04
                </div>
                <h4 className="text-lg font-bold text-brand-evergreen dark:text-brand-mint mb-2">
                  Customer Verifies
                </h4>
                <p className="text-xs text-brand-forest/70 dark:text-brand-dark-muted leading-relaxed">
                  Customer inspects repair proof. Confirms resolution to close with 5-star rating, or reopens with specific reason.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-brand-evergreen/10 dark:border-brand-dark-border flex items-center gap-2 text-xs font-medium text-brand-jade">
                <span>State: Closed or Reopened</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: CAPABILITIES */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card">
            <div className="w-12 h-12 rounded-xl bg-brand-mint/30 flex items-center justify-center text-brand-evergreen mb-6">
              <Smartphone className="w-6 h-6 text-brand-jade" />
            </div>
            <h3 className="text-xl font-bold text-brand-evergreen dark:text-white mb-2">
              Mobile-First for Technicians
            </h3>
            <p className="text-sm text-brand-forest/70 dark:text-brand-dark-muted leading-relaxed">
              Large touch targets, high contrast, offline resilience, and fast photo evidence capture designed specifically for field teams with gloves and tools.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card">
            <div className="w-12 h-12 rounded-xl bg-brand-mint/30 flex items-center justify-center text-brand-evergreen mb-6">
              <Sparkles className="w-6 h-6 text-brand-jade" />
            </div>
            <h3 className="text-xl font-bold text-brand-evergreen dark:text-white mb-2">
              Pragmatic AI Assistance
            </h3>
            <p className="text-sm text-brand-forest/70 dark:text-brand-dark-muted leading-relaxed">
              Auto-categorize complex symptoms, retrieve similar past equipment failures, and draft concise hand-off briefings without gimmicks or hallucinated records.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card">
            <div className="w-12 h-12 rounded-xl bg-brand-mint/30 flex items-center justify-center text-brand-evergreen mb-6">
              <Clock className="w-6 h-6 text-brand-jade" />
            </div>
            <h3 className="text-xl font-bold text-brand-evergreen dark:text-white mb-2">
              Preventive Maintenance
            </h3>
            <p className="text-sm text-brand-forest/70 dark:text-brand-dark-muted leading-relaxed">
              Automate weekly, monthly, and quarterly inspection checklists for critical assets before catastrophic downtime interrupts your operations.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION: PRICING */}
      <section className="py-16 sm:py-24 bg-white dark:bg-brand-dark-card border-t border-brand-evergreen/10 dark:border-brand-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-jade mb-3">
              Simple, Predictable Plans
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-brand-evergreen dark:text-white font-sans">
              Keep your team moving without hidden fees
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="p-8 rounded-2xl bg-brand-ivory/40 dark:bg-brand-dark-bg border border-brand-evergreen/10 dark:border-brand-dark-border flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-brand-evergreen dark:text-white">Starter</h4>
                <p className="text-xs text-brand-forest/60 dark:text-brand-dark-muted mt-1">For single facility operations</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-brand-evergreen dark:text-white">$49</span>
                  <span className="text-xs text-brand-forest/60 dark:text-brand-dark-muted">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-brand-forest/80 dark:text-brand-dark-text">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade" /> Up to 5 technicians</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade" /> Unlimited customer requests</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade" /> Photo evidence & work logs</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade" /> Basic operational metrics</li>
                </ul>
              </div>
              <Link to="/register" className="mt-8">
                <Button variant="outline" className="w-full">Get started</Button>
              </Link>
            </div>

            {/* Pro - Highlighted */}
            <div className="p-8 rounded-2xl bg-brand-evergreen text-white dark:bg-brand-dark-card dark:border-brand-jade shadow-elevated relative flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-jade text-white text-[10px] font-bold uppercase tracking-wider">
                Most popular
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Professional</h4>
                <p className="text-xs text-white/70 mt-1">For multi-building campuses & logistics</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">$149</span>
                  <span className="text-xs text-white/70">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-white/90">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-mint" /> Up to 25 technicians & managers</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-mint" /> Preventive maintenance scheduler</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-mint" /> AI diagnosis & troubleshooting</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-mint" /> Comprehensive audit event history</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-mint" /> Priority SLA notifications</li>
                </ul>
              </div>
              <Link to="/register" className="mt-8">
                <Button variant="mint" className="w-full">Start moving work →</Button>
              </Link>
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-2xl bg-brand-ivory/40 dark:bg-brand-dark-bg border border-brand-evergreen/10 dark:border-brand-dark-border flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-brand-evergreen dark:text-white">Enterprise</h4>
                <p className="text-xs text-brand-forest/60 dark:text-brand-dark-muted mt-1">For nationwide operations</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-brand-evergreen dark:text-white">$399</span>
                  <span className="text-xs text-brand-forest/60 dark:text-brand-dark-muted">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-brand-forest/80 dark:text-brand-dark-text">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade" /> Unlimited technicians & locations</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade" /> Dedicated PostgreSQL connection</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade" /> Custom ERP / CMMS integrations</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-jade" /> 24/7 dedicated support team</li>
                </ul>
              </div>
              <Link to="/contact" className="mt-8">
                <Button variant="outline" className="w-full">Contact sales</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="py-16 sm:py-20 bg-brand-evergreen text-white dark:bg-brand-dark-card border-t border-brand-evergreen/20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-sans">
            Ready to bring clarity to maintenance operations?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/80 max-w-xl mx-auto">
            Join logistics hubs, facilities, and maintenance managers keeping work moving with Zervuno.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/register">
              <Button variant="mint" size="lg">
                Create free organization →
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/10">
                Sign in to workspace
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
