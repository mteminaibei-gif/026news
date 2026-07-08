'use client'

import { Component, type ReactNode } from 'react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallbackHref?: string
  fallbackLabel?: string
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      const { fallbackHref = '/', fallbackLabel = 'Go home' } = this.props
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <span className="text-5xl mb-4">⚠️</span>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            An unexpected error occurred. Please try refreshing the page.
            {this.state.message && (
              <span className="block mt-1 text-xs text-red-400 font-mono">{this.state.message}</span>
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Try again
            </button>
            <Link
              href={fallbackHref}
              className="border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              {fallbackLabel}
            </Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
