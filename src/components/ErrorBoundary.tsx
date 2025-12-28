import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
  section?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(`[ErrorBoundary] ${this.props.section || 'Component'} error:`, error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-lg border border-red-200">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            {this.props.section ? `${this.props.section} Error` : 'Something went wrong'}
          </h3>
          <p className="text-red-600 mb-4 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred while loading this section.'}
          </p>
          {this.props.onRetry && (
            <Button
              onClick={this.handleRetry}
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Hook version for functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('[useErrorHandler] Error caught:', error);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
};

// Simple error fallback component
export const ErrorFallback: React.FC<{
  error?: Error;
  onRetry?: () => void;
  message?: string;
}> = ({ error, onRetry, message }) => (
  <div className="flex flex-col items-center justify-center p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
    <AlertTriangle className="w-8 h-8 text-gray-500 mb-3" />
    <p className="text-gray-600 mb-3">
      {message || error?.message || 'Failed to load content'}
    </p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </Button>
    )}
  </div>
);