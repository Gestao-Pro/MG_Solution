import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Could be wired to a telemetry service
    console.error('React runtime error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ocorreu um erro inesperado</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Tente recarregar a página. Se persistir, entre em contato com o suporte.</p>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}