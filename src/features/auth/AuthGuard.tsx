
import React from 'react';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <AuthPage onBack={() => {}} />;
  }

  return <>{children}</>;
};

export default AuthGuard;
