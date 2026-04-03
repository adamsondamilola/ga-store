"use client"
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Log to error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="mb-4">
              <h1 className="text-4xl font-bold text-red-300">Oops!</h1>
              <h2 className="text-2xl font-semibold text-gray-800 mt-2">Something went wrong</h2>
              <p className="text-gray-600 mt-2">
                We're sorry, but something unexpected happened.
              </p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Refresh Page
              </button>
              
              <button 
                onClick={() => this.setState({ hasError: false, error: null })}
                className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary