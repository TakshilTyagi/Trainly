import React from 'react';

interface TrainlyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  variant?: 'auto' | 'light' | 'dark' | 'original';
  iconOnly?: boolean;
}

export const TrainlyLogo: React.FC<TrainlyLogoProps> = ({
  className = '',
  size = 'md',
  variant: _variant = 'auto',
  iconOnly = false,
}) => {
  const sizeClasses = {
    sm: iconOnly ? 'h-7 w-7' : 'h-7 w-auto',
    md: iconOnly ? 'h-9 w-9' : 'h-9 w-auto',
    lg: iconOnly ? 'h-12 w-12' : 'h-12 w-auto',
    xl: iconOnly ? 'h-16 w-16' : 'h-16 w-auto',
    '2xl': iconOnly ? 'h-20 w-20' : 'h-20 sm:h-24 w-auto',
    '3xl': iconOnly ? 'h-24 w-24' : 'h-28 sm:h-32 w-auto',
  };

  const dim = sizeClasses[size];

  if (iconOnly) {
    return (
      <img
        src="/logo-icon.png"
        alt="Trainly"
        className={`${dim} object-contain select-none pointer-events-none ${className}`}
      />
    );
  }

  // Consistent Authentic Brand Logo across all modes
  return (
    <img
      src="/logo-original.png"
      alt="Trainly"
      className={`${dim} object-contain select-none pointer-events-none drop-shadow-2xs ${className}`}
    />
  );
};
