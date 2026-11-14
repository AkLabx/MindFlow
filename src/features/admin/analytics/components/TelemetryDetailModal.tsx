import React, { useId } from 'react';
import { X, Copy, Check, Clock, Smartphone, Globe, Shield } from 'lucide-react';
import { TelemetryEventRecord } from '../services/adminAnalyticsService';
import { NativeDialog } from '@/components/ui/NativeDialog';

interface TelemetryDetailModalProps {
  event: TelemetryEventRecord | null;
  onClose: () => void;
}

export const TelemetryDetailModal: React.FC<TelemetryDetailModalProps> = ({ event, onClose }) => {
  const titleId = useId();
  const [copied, setCopied] = React.useState(false);

  if (!event) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const platform = event.event_data?.platform || 'web';
  const isAndroid = platform === 'android';

  return (
    <NativeDialog
      isOpen={Boolean(event)}
      onClose={onClose}
      ariaLabelledBy={titleId}
      className="max-w-2xl"
      panelClassName="relative w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh]"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isAndroid ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
              {isAndroid ? <Smartphone className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id={titleId} className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {event.event_name}
                </h3>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase ${isAndroid ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'}`}>
                  {platform}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                {new Date(event.created_at).toLocaleString()} (UTC)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy JSON payload"
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Copy JSON Payload"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close telemetry inspector"
              className="p-2 min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Payload Visual Inspector */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Hardware & Environment summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Screen</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                {event.event_data?.screen_resolution || '—'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">DPR / Scale</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                {event.event_data?.device_pixel_ratio ? `${event.event_data.device_pixel_ratio}x` : '—'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Timezone</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono truncate block">
                {event.event_data?.timezone || '—'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Network</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono uppercase">
                {event.event_data?.network_type || '—'}
              </span>
            </div>
          </div>

          {/* Raw JSON Code block */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Complete JSON Payload</span>
              <span className="text-[11px] text-slate-400 font-mono">id: {event.id}</span>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-96">
              {JSON.stringify(event.event_data, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close Inspector
          </button>
        </div>
    </NativeDialog>
  );
};
