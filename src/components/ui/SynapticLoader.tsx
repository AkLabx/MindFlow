import React from 'react';
import { BrandSpinner } from '../brand/BrandSpinner';

export interface SynapticLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

/**
 * SynapticLoader
 * 
 * Re-exports the unified MindFlow Signature Brand Loader (`BrandSpinner variant="synaptic"`).
 * Preserves backwards compatibility with legacy call sites across the application.
 */
export const SynapticLoader: React.FC<SynapticLoaderProps> = ({
  size = 'md',
  className = '',
  label,
}) => {
  return (
    <BrandSpinner
      variant="synaptic"
      size={size}
      className={className}
      label={label}
    />
  );
};

export default SynapticLoader;
