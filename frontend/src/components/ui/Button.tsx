import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'mint';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconRight,
  className = '',
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5 font-semibold',
  }[size];

  const variants = {
    primary: 'bg-brand-evergreen hover:bg-brand-forest text-white focus:ring-brand-jade shadow-soft dark:bg-brand-jade dark:hover:bg-brand-evergreen dark:text-white',
    secondary: 'bg-brand-forest/10 hover:bg-brand-forest/20 text-brand-forest dark:bg-brand-dark-card dark:text-brand-dark-text dark:hover:bg-brand-dark-hover border border-brand-forest/15 dark:border-brand-dark-border',
    mint: 'bg-brand-mint text-brand-evergreen hover:bg-brand-sage font-semibold focus:ring-brand-jade',
    outline: 'border border-brand-evergreen/25 text-brand-evergreen hover:bg-brand-evergreen/5 dark:border-brand-mint/40 dark:text-brand-mint dark:hover:bg-brand-mint/10',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm',
    ghost: 'text-brand-forest hover:bg-brand-forest/5 dark:text-brand-dark-text dark:hover:bg-brand-dark-hover',
  }[variant];

  return (
    <button
      className={`${base} ${sizes} ${variants} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
          {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
        </>
      )}
    </button>
  );
};
