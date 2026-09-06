import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center text-white p-6">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Oops! Something went wrong.</h1>
          <p className="text-slate-400 mb-8 max-w-md text-center">
            The application encountered an unexpected error. Our team has been notified.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#8b5cf6] hover:bg-[#7c3aed] px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
