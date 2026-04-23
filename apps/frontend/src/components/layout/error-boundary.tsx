import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorPage } from './error-page';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // En producción, enviar a Sentry (sprint futuro)
    console.error('ErrorBoundary capturó:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          title="Algo inesperado ha ocurrido"
          message={
            this.state.error?.message ||
            'Prueba a refrescar la página o volver al inicio.'
          }
          onRetry={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}