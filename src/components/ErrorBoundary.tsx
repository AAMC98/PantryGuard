import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 w-full max-w-xl mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 shadow-sm">
            <span className="material-symbols-outlined text-3xl">restart_alt</span>
          </div>
          <h3 className="text-lg font-bold text-[#191c20] dark:text-white mb-2">
            {this.props.fallbackTitle || 'Hubo un detalle al cargar este contenido'}
          </h3>
          <p className="text-xs text-[#505a50] dark:text-[#bfc9bd] max-w-sm mb-6 leading-relaxed">
            {this.props.fallbackMessage ||
              'No te preocupes, tus alimentos y datos están a salvo. Pulsa el botón para recargar la vista.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-5 py-2.5 rounded-xl bg-[#096430] hover:bg-[#075026] text-white text-xs font-bold transition-transform active:scale-95 shadow-md flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span>Recargar Sección</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
