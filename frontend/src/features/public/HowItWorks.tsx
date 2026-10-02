import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, ArrowRight, ShieldCheck, Clock, FileCheck } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  return (
    <div className="py-12 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-jade">The Lifecycle</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-evergreen dark:text-white mt-2 font-sans">
          How Zervuno keeps work moving
        </h1>
        <p className="mt-4 text-base text-brand-forest/75 dark:text-brand-dark-muted max-w-2xl mx-auto">
          From the first symptom report to final customer verification and closed-loop feedback, every step is transparent, validated, and accountable.
        </p>
      </div>

      <div className="space-y-12">
        {/* Step 1 */}
        <div className="p-8 rounded-3xl bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card flex flex-col md:flex-row gap-8 items-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-evergreen text-white flex items-center justify-center text-2xl font-black flex-shrink-0">
            1
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-brand-evergreen dark:text-brand-mint">
              Instant Issue Reporting with Visual Context
            </h3>
            <p className="text-sm text-brand-forest/80 dark:text-brand-dark-muted mt-2 leading-relaxed">
              Anyone with access can quickly lodge an issue. Select the location or scan an asset tag, attach high-res smartphone photos of the malfunction, and submit. Zervuno’s AI engine immediately suggests the proper category and recommends an initial priority.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-8 rounded-3xl bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card flex flex-col md:flex-row gap-8 items-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-jade text-white flex items-center justify-center text-2xl font-black flex-shrink-0">
            2
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-brand-evergreen dark:text-brand-mint">
              Manager Dispatch & Prioritization
            </h3>
            <p className="text-sm text-brand-forest/80 dark:text-brand-dark-muted mt-2 leading-relaxed">
              Facility managers review incoming requests in real-time. They can set target due dates, add managerial notes or safety advisories, and assign the most appropriate technician based on live workload metrics.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-8 rounded-3xl bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card flex flex-col md:flex-row gap-8 items-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-amber text-white flex items-center justify-center text-2xl font-black flex-shrink-0">
            3
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-brand-evergreen dark:text-brand-mint">
              Field Execution, Work Logs & Proof
            </h3>
            <p className="text-sm text-brand-forest/80 dark:text-brand-dark-muted mt-2 leading-relaxed">
              Technicians receive instant in-app alerts on mobile. They can accept the assignment, access AI diagnostic tips and past resolution history, record hours and replacement parts, take before-and-after photos, and submit a completion report.
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="p-8 rounded-3xl bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 dark:border-brand-dark-border shadow-card flex flex-col md:flex-row gap-8 items-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-turquoise text-brand-forest flex items-center justify-center text-2xl font-black flex-shrink-0">
            4
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-brand-evergreen dark:text-brand-mint">
              Customer Verification & Closed-Loop Quality
            </h3>
            <p className="text-sm text-brand-forest/80 dark:text-brand-dark-muted mt-2 leading-relaxed">
              Work does not simply disappear into a closed state. The requesting customer inspects the proof and either confirms resolution with a 1-5 star rating or reopens the work order with specific feedback for manager review.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center">
        <Link to="/register">
          <Button variant="primary" size="lg">
            Start moving work today →
          </Button>
        </Link>
      </div>
    </div>
  );
};
