import React from 'react';
import { BrandSpinner, BrandSpinnerVariant } from '../brand/BrandSpinner';

export interface SynapticLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: BrandSpinnerVariant;
  className?: string;
  label?: string;
}

/**
 * SynapticLoader
 * 
 * Re-exports the unified MindFlow Brand Loader (`BrandSpinner`).
 * Defaults to the active configured brand loader (or `variant="morphing"` for ultra-compact 32px spots).
 * Preserves 100% backwards compatibility with legacy call sites across the application.
 */
export const SynapticLoader: React.FC<SynapticLoaderProps> = ({
  size = 'md',
  variant,
  className = '',
  label,
}) => {
  return (
    <BrandSpinner
      variant={variant}
      size={size}
      className={className}
      label={label}
    />
  );
};

export default SynapticLoader;
