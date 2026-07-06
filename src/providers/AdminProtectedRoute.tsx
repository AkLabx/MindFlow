import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/context/AuthContext";
import { SynapticLoader } from "../components/ui/SynapticLoader";
import { RestoreAccountModal } from "../features/auth/components/RestoreAccountModal";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <SynapticLoader size="xl" />
      </div>
    );
  }

  if (!user || user.email !== "admin@mindflow.com") {
    return <Navigate to="/dashboard" replace />;
  }

  return <><RestoreAccountModal />{children}</>;
};
