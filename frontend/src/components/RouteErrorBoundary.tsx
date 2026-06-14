import { Component, type ErrorInfo, type ReactNode } from 'react';

interface RouteErrorBoundaryProps {
  routeName: string;
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Route "${this.props.routeName}" render failed`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <section className="route-fallback" role="alert">
          <h2>Something went wrong</h2>
          <p>
            The <strong>{this.props.routeName}</strong> view failed to render.
          </p>
          <button type="button" className="btn btn-primary" onClick={this.handleRetry}>
            Try again
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
