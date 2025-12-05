import React from 'react';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * A wrapper component that protects routes requiring authentication.
 *
 * It checks the current user session state.
 * - If loading, it displays a loading indicator.
 * - If not authenticated (no session), it renders the `AuthPage` (login/signup).
 * - If authenticated, it renders the protected children components.
 *
 * @param {AuthGuardProps} props - The component props.
 * @param {React.ReactNode} props.children - The protected content to render if authenticated.
 * @returns {JSX.Element} The guarded content or the authentication page.
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    // Note: onBack is currently a no-op as there is no 'back' from the forced auth guard
    return <AuthPage onBack={() => {}} />;
  }

  return <>{children}</>;
};

export default AuthGuard;
