import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white dark:bg-brand-dark-card border border-brand-evergreen/10 dark:border-brand-dark-border rounded-xl shadow-card transition-all duration-200 ${
        hoverEffect ? 'hover:shadow-elevated hover:border-brand-jade/30' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
