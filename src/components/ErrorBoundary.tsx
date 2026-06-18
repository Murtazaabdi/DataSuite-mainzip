import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', this.props.label, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 gap-4"
          style={{ color: '#94A3B8', background: '#0B1120' }}>
          <div className="p-3 rounded-full" style={{ background: 'rgba(244, 63, 94, 0.1)' }}>
            <AlertTriangle className="h-6 w-6" style={{ color: '#F43F5E' }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium mb-1" style={{ color: '#F1F5F9' }}>
              Something went wrong{this.props.label ? ` in ${this.props.label}` : ''}
            </p>
            <p className="text-xs max-w-sm" style={{ color: '#64748B' }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            style={{ borderColor: 'rgba(148,163,184,0.2)', color: '#94A3B8' }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
