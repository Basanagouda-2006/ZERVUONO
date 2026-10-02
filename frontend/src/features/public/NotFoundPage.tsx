import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-full bg-brand-forest/10 flex items-center justify-center text-brand-evergreen mb-6 text-2xl font-bold font-mono">
        404
      </div>
      <h1 className="text-3xl font-extrabold text-brand-evergreen dark:text-white font-sans">
        Page Not Found
      </h1>
      <p className="mt-3 text-sm text-brand-forest/70 dark:text-brand-dark-muted max-w-sm">
        The maintenance route or record you are trying to reach does not exist or has moved.
      </p>
      <Link to="/" className="mt-8">
        <Button variant="primary" icon={<Home className="w-4 h-4" />}>
          Return Home
        </Button>
      </Link>
    </div>
  );
};
