import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  to?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', to = '/' }) => {
  const barSizes = {
    sm: { w: 'w-1', h1: 'h-3.5', h2: 'h-5', h3: 'h-3', space: 'gap-0.5', text: 'text-base' },
    md: { w: 'w-1.5', h1: 'h-4.5', h2: 'h-6', h3: 'h-4', space: 'gap-1', text: 'text-xl' },
    lg: { w: 'w-2', h1: 'h-6', h2: 'h-8', h3: 'h-5', space: 'gap-1.5', text: 'text-2xl' },
  }[size];

  const content = (
    <div className={`inline-flex items-center gap-2.5 font-bold tracking-wider select-none ${className}`}>
      {/* 3 Vertical Bars from Screenshot */}
      <div className={`flex items-end ${barSizes.space} h-7 pb-0.5`}>
        <span className={`${barSizes.w} ${barSizes.h1} bg-brand-jade rounded-full`} />
        <span className={`${barSizes.w} ${barSizes.h2} bg-brand-turquoise rounded-full`} />
        <span className={`${barSizes.w} ${barSizes.h3} bg-brand-coral rounded-full`} />
      </div>
      <span className={`font-extrabold tracking-widest text-brand-evergreen dark:text-brand-mint font-sans ${barSizes.text}`}>
        ZERVUNO
      </span>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
};
