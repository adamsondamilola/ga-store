// utils/errorLogger.js
import * as Sentry from '@sentry/nextjs'

export const logError = (error, context = {}) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      contexts: {
        ...context,
        timestamp: new Date().toISOString(),
      },
    })
  } else {
    console.error('Error:', error, context)
  }
}