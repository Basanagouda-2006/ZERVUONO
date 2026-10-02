import React from 'react';
import { Link } from 'react-router-dom';
import { Warehouse, Building2, Factory, Stethoscope, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const TeamsPage: React.FC = () => {
  const industries = [
    {
      icon: <Warehouse className="w-8 h-8 text-brand-jade" />,
      title: 'Logistics & Warehouses',
      description: 'Keep conveyors moving, forklifts charged, and loading docks operational. Minimize shift bottlenecks with rapid technician dispatch.',
    },
    {
      icon: <Factory className="w-8 h-8 text-brand-jade" />,
      title: 'Manufacturing & Plants',
      description: 'Track heavy machinery, compressor pressure, and electrical panels. Execute preventive maintenance before line halts occur.',
    },
    {
      icon: <Building2 className="w-8 h-8 text-brand-jade" />,
      title: 'Commercial Facilities',
      description: 'Manage tenant comfort, HVAC balancing, elevator maintenance, and lighting repairs across corporate office parks.',
    },
    {
      icon: <Stethoscope className="w-8 h-8 text-brand-jade" />,
      title: 'Healthcare & Campuses',
      description: 'Maintain strict compliance, sanitation equipment, backup generators, and climate control with audit-grade logs.',
    },
  ];

  return (
    <div className="py-12 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-jade">Tailored Solutions</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-evergreen dark:text-white mt-2 font-sans">
          Built for teams that keep places running
        </h1>
        <p className="mt-4 text-base text-brand-forest/75 dark:text-brand-dark-muted max-w-2xl mx-auto">
          Whether managing a 200,000 sq ft logistics hub or a multi-tenant commercial center, Zervuno delivers calm operational control.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {industries.map((ind, i) => (
          <Card key={i} className="p-8 hoverEffect" hoverEffect>
            <div className="w-14 h-14 rounded-2xl bg-brand-mint/20 flex items-center justify-center mb-6">
              {ind.icon}
            </div>
            <h3 className="text-xl font-bold text-brand-evergreen dark:text-white mb-3">
              {ind.title}
            </h3>
            <p className="text-sm text-brand-forest/75 dark:text-brand-dark-muted leading-relaxed">
              {ind.description}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Link to="/register">
          <Button variant="primary" size="lg">
            Empower your team now →
          </Button>
        </Link>
      </div>
    </div>
  );
};
