import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  Home,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  ShieldAlert
} from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    showDetails: false,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught uncaught runtime error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  private handleReturnToSafety = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.hash = '#/dashboard';
    window.location.reload();
  };

  private handleCopyDiagnostics = () => {
    const payload = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      errorName: this.state.error?.name,
      errorMessage: this.state.error?.message,
      errorStack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent
    };

    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2500);
  };

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'Unknown runtime error occurred';
      const errorStack = this.state.error?.stack || this.state.errorInfo?.componentStack;

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100 antialiased">
          <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 -left-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Icon Header */}
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-5 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            {/* Title & Subtitle */}
            <h1 className="text-2xl font-black tracking-tight text-white font-display mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
              {this.props.fallbackMessage ||
                "MindFlow encountered an unexpected error while rendering this view. You can reload the screen or return to the main dashboard."}
            </p>

            {/* Error Message Pill */}
            <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 mb-6 text-left flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block mb-0.5">
                  Error Details
                </span>
                <span className="text-xs text-slate-300 font-mono break-words leading-tight block">
                  {errorMsg}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full mb-4">
              <button
                onClick={this.handleReset}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reload Screen
              </button>
              <button
                onClick={this.handleReturnToSafety}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-all border border-slate-700/80 active:scale-95 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Safe Dashboard
              </button>
            </div>

            {/* Diagnostic Drawer Toggle */}
            <div className="w-full pt-4 border-t border-slate-800/80 flex flex-col items-center">
              <button
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 py-1"
              >
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>{this.state.showDetails ? 'Hide Stack Trace' : 'View Technical Diagnostics'}</span>
                {this.state.showDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {this.state.showDetails && (
                <div className="mt-4 w-full text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-slate-500 uppercase">
                      Component Stack
                    </span>
                    <button
                      onClick={this.handleCopyDiagnostics}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      {this.state.copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Diagnostics</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3.5 bg-slate-950 text-slate-400 text-[11px] font-mono rounded-xl border border-slate-800 overflow-x-auto max-h-48 leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
                    {errorStack || 'No stack trace captured.'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
