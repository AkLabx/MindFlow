import React from 'react';
import { AuthPage } from './AuthPage';

export interface SignupPageProps {
  onBack?: () => void;
}

/**
 * SignupPage Component
 * Seamless proxy wrapping the unified AuthPage console with initialMode="signup".
 * Guarantees 100% parity, eliminate code duplication, and respects hash routing.
 */
export const SignupPage: React.FC<SignupPageProps> = ({ onBack }) => {
  return <AuthPage onBack={onBack} initialMode="signup" />;
};

export default SignupPage;
