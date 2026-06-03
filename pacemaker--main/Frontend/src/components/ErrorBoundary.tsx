'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    // Option to reload current route / refresh window
    window.location.reload();
  };

  private handleGoBack = () => {
    window.history.back();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#fdfbf7]">
          <div className="bg-white border-2 border-red-500 rounded-[2.5rem] p-8 md:p-12 max-w-lg w-full text-center shadow-xl space-y-6">
            
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
              <AlertTriangle className="w-8 h-8 text-red-500 animate-bounce" />
            </div>

            {/* Error Text */}
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900">Something went wrong</h2>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">
                An unexpected Javascript error occurred while loading this section of the platform.
              </p>
              {this.state.error?.message && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs font-mono text-red-700 text-left overflow-x-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleGoBack}
                className="flex-1 px-5 py-3 border border-gray-300 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Go Back
              </button>
              <button
                onClick={this.handleRetry}
                className="flex-1 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <RotateCcw className="w-4 h-4" /> Retry Page
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
