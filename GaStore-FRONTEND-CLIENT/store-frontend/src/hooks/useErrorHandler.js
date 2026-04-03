import { useState, useCallback } from 'react'
import { useRouter } from 'next/router'

export const useErrorHandler = () => {
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleError = useCallback((error, redirectTo) => {
    console.error('Error occurred:', error)
    
    // Log to error reporting service
    // Example: Sentry.captureException(error)
    
    setError(error)
    
    // Optionally redirect
    if (redirectTo) {
      router.push(redirectTo)
    }
  }, [router])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, clearError }
}