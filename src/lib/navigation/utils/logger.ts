export const NavigationLogger = {
  log: (source: string, reason: string, destination: string) => {
    if (import.meta.env.DEV) {
      console.log(`[Navigation]
Source: ${source}
Reason: ${reason}
Destination: ${destination}
Timestamp: ${new Date().toISOString()}`);
    }
  }
};
