import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, FileText, Send, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      showDetails: false,
    };
    this.previousResetKeys = props.resetKeys || [];
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Auto-reset after 10 seconds if error count is low
    if (this.state.errorCount < 3) {
      this.resetTimeoutId = window.setTimeout(() => {
        this.resetErrorBoundary();
      }, 10000);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    // Reset on props change if enabled
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
      return;
    }

    // Reset if resetKeys have changed
    if (hasError && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== this.previousResetKeys[index]
      );
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
        this.previousResetKeys = resetKeys;
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    const { hasError, error, errorInfo, errorCount, showDetails } = this.state;
    const { children, fallback, isolate = false, level = 'component' } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Determine error UI based on level
      const errorUI = {
        page: <PageErrorFallback 
          error={error} 
          errorInfo={errorInfo}
          onReset={this.resetErrorBoundary}
          errorCount={errorCount}
          showDetails={showDetails}
          onToggleDetails={this.toggleDetails}
        />,
        section: <SectionErrorFallback 
          error={error}
          errorInfo={errorInfo}
          onReset={this.resetErrorBoundary}
          errorCount={errorCount}
          showDetails={showDetails}
          onToggleDetails={this.toggleDetails}
        />,
        component: <ComponentErrorFallback 
          error={error}
          errorInfo={errorInfo}
          onReset={this.resetErrorBoundary}
          isolate={isolate}
          showDetails={showDetails}
          onToggleDetails={this.toggleDetails}
        />,
      };

      return errorUI[level];
    }

    return children;
  }
}

// Page-level error fallback
function PageErrorFallback({ 
  error, 
  errorInfo, 
  onReset, 
  errorCount,
  showDetails,
  onToggleDetails 
}: {
  error: Error;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  errorCount: number;
  showDetails: boolean;
  onToggleDetails: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h1>
          <p className="text-gray-600 mb-6">
            We encountered an unexpected error. Don't worry, we've been notified and are working on a fix.
          </p>

          {errorCount > 2 && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Multiple errors detected. Please refresh the page or contact support if the issue persists.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <button
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </a>
          </div>

          <button
            onClick={onToggleDetails}
            className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
          >
            {showDetails ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show Details
              </>
            )}
          </button>

          {showDetails && (
            <div className="mt-4 text-left">
              <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-64">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Error Details:</h3>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                  {error.toString()}
                  {errorInfo && '\n\nComponent Stack:\n' + errorInfo.componentStack}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Section-level error fallback
function SectionErrorFallback({ 
  error, 
  errorInfo,
  onReset, 
  errorCount,
  showDetails,
  onToggleDetails
}: {
  error: Error;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  errorCount: number;
  showDetails: boolean;
  onToggleDetails: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Section Error</h3>
          <p className="text-gray-600 mb-4">
            This section couldn't load properly. You can try refreshing or continue with other sections.
          </p>
          
          {errorCount > 2 && (
            <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              Multiple attempts failed. Please contact support if needed.
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
            <button
              onClick={onToggleDetails}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>

          {showDetails && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                {error.message}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Component-level error fallback
function ComponentErrorFallback({ 
  error, 
  errorInfo,
  onReset, 
  isolate,
  showDetails,
  onToggleDetails
}: {
  error: Error;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  isolate: boolean;
  showDetails: boolean;
  onToggleDetails: () => void;
}) {
  if (isolate) {
    // Minimal UI for isolated component errors
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 text-gray-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Component unavailable</span>
          <button
            onClick={onReset}
            className="ml-auto text-xs text-blue-600 hover:text-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">Component Error</p>
          <p className="text-sm text-red-700 mt-1">{error.message}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onReset}
              className="text-xs text-red-600 hover:text-red-700 underline"
            >
              Try again
            </button>
            <span className="text-gray-400">•</span>
            <button
              onClick={onToggleDetails}
              className="text-xs text-gray-600 hover:text-gray-700"
            >
              {showDetails ? 'Hide' : 'Show'} details
            </button>
          </div>
          {showDetails && (
            <div className="mt-2 p-2 bg-white rounded border border-red-200">
              <pre className="text-xs text-gray-600 overflow-auto max-h-24">
                {error.stack}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Error Report Dialog Component
export function ErrorReportDialog({ 
  error, 
  onClose, 
  onSubmit 
}: {
  error: Error;
  onClose: () => void;
  onSubmit: (report: string) => void;
}) {
  const [report, setReport] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = () => {
    onSubmit(report);
    setSubmitted(true);
    setTimeout(onClose, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {submitted ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Sent</h3>
            <p className="text-gray-600">Thank you for helping us improve!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Report Error</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Help us fix this issue by describing what you were doing when the error occurred.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What were you trying to do?
              </label>
              <textarea
                value={report}
                onChange={(e) => setReport(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                rows={4}
                placeholder="I was trying to..."
              />
            </div>

            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Error:</p>
              <p className="text-xs text-gray-600">{error.message}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={!report.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Report
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Props
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for error handling
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = () => setError(null);
  const captureError = (error: Error) => setError(error);

  return { resetError, captureError };
}