import React from "react";
import { PackageOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";

interface EmptyStateProps {
  message?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = "No data available at the moment.",
  onAction,
  actionLabel = "Back to Dashboard",
}) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      navigate(ROUTES.DASHBOARD);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <PackageOpen className="w-8 h-8 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        Nothing to see here
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        {message}
      </p>
      <button
        onClick={handleAction}
        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
      >
        {actionLabel}
      </button>
    </div>
  );
};
