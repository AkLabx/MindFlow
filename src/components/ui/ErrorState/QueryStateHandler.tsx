import React, { useState } from 'react';
import { ErrorState } from './ErrorState';
import { SynapticLoader } from '../SynapticLoader';
import { useRecoveryStore } from '../../../stores/useRecoveryStore';
import { triggerAppRecovery } from '../../../lib/recovery/RecoveryManager';

interface QueryStateHandlerProps {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry: () => void;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export const QueryStateHandler: React.FC<QueryStateHandlerProps> = ({
  isLoading,
  isError,
  error,
  onRetry,
  children,
  loadingComponent,
}) => {
  const recoveryStatus = useRecoveryStore((state) => state.status);
  const [isManualRecovering, setIsManualRecovering] = useState(false);

  const handleManualRetry = async () => {
    setIsManualRecovering(true);
    try {
      // Run the recovery sequence first (this tests network and auth session)
      const recovered = await triggerAppRecovery('In-page Manual Retry');
      if (recovered) {
          // If successful, tell React Query to refetch
          onRetry();
      }
    } finally {
      setIsManualRecovering(false);
    }
  };

  // If a recovery is active, show the friendly loading state instead of raw errors
  if (recoveryStatus === 'CHECKING' || recoveryStatus === 'RECOVERING' || isManualRecovering) {
      return (
          <div className="flex flex-col justify-center items-center h-48 w-full gap-4 text-slate-500">
              {loadingComponent || <SynapticLoader />}
              <p className="text-sm font-medium">Reconnecting and refreshing data...</p>
          </div>
      );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48 w-full">
        {loadingComponent || <SynapticLoader />}
      </div>
    );
  }

  if (isError) {
    // Map known technical errors to friendly messages
    let friendlyMessage = "Failed to load data. Please try again.";

    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Network offline')) {
         friendlyMessage = "Connection lost. Please check your internet and try again.";
    } else if (error?.name === 'AbortError' || error?.message?.includes('Lock broken')) {
         friendlyMessage = "Session interrupted. Please try again.";
    } else if (error?.message) {
         // Fallback to original if we don't recognize it
         friendlyMessage = error.message;
    }

    return (
      <ErrorState
        onRetry={handleManualRetry}
        message={friendlyMessage}
      />
    );
  }

  return <>{children}</>;
};
