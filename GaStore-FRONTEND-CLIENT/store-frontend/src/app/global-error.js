"use client"
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

function Error({ statusCode, hasGetInitialPropsRun, err }) {
  const router = useRouter();

  useEffect(() => {
    // Log error to your error reporting service, but only for client-side errors or if `err` object exists
    if (err && !hasGetInitialPropsRun) {
      // This ensures we don't double-log errors that were already caught server-side by getInitialProps
      console.error('Client-side Error occurred:', err);
      // Example: Sentry.captureException(err);
      // You might also send statusCode to your error tracking
      // Sentry.captureMessage(`Error Page - Status: ${statusCode}`);
    } else if (statusCode >= 500) {
      // For server errors, you might want to log even if no `err` object is passed directly
      // as `statusCode` being 500 implies an issue.
      console.error(`Server Error Page - Status: ${statusCode}`);
      // Sentry.captureMessage(`Server Error Page - Status: ${statusCode}`);
    }
  }, [err, statusCode, hasGetInitialPropsRun]);

  const getErrorMessage = () => {
    switch (statusCode) {
      case 400:
        return 'The request could not be understood or was malformed.';
      case 401:
        return 'You need to be authenticated to access this resource.';
      case 403:
        return 'You do not have permission to access this page.';
      case 404:
        return 'The page you are looking for does not exist.';
      case 408:
        return 'The server timed out waiting for the request.';
      case 429:
        return 'You have sent too many requests in a given amount of time.';
      case 500:
        return 'Something went wrong on our end. We are working to fix it!';
      case 502:
        return 'The server received an invalid response from an upstream server.';
      case 503:
        return 'The server is currently unable to handle the request due to maintenance or overload.';
      case 504:
        return 'The server did not receive a timely response from an upstream server.';
      default:
        return 'An unexpected error occurred. Please try again or contact support.';
    }
  };

  const getErrorTitle = () => {
    switch (statusCode) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized Access';
      case 403:
        return 'Access Denied';
      case 404:
        return 'Page Not Found';
      case 408:
        return 'Request Timeout';
      case 429:
        return 'Too Many Requests';
      case 500:
        return 'Internal Server Error';
      case 502:
        return 'Bad Gateway';
      case 503:
        return 'Service Unavailable';
      case 504:
        return 'Gateway Timeout';
      default:
        return 'Something Went Wrong';
    }
  };

  const getErrorColorClass = () => {
    if (statusCode >= 400 && statusCode < 500) {
      return 'text-orange-500'; // Client errors: 4xx
    } else if (statusCode >= 500) {
      return 'text-red-500'; // Server errors: 5xx
    }
    return 'text-gray-500'; // Default
  };

  const getBackgroundColorClass = () => {
    if (statusCode >= 400 && statusCode < 500) {
      return 'from-orange-50 to-amber-100';
    } else if (statusCode >= 500) {
      return 'from-red-50 to-pink-100';
    }
    return 'from-gray-50 to-blue-50'; // Default or other generic errors
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${getBackgroundColorClass()} p-4 sm:p-6`}>
      <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-8 text-center border-t-4 border-current transition-all duration-300 ease-in-out transform hover:scale-105"
           style={{ borderColor: getErrorColorClass().replace('text-', '') }}> {/* Dynamically set border color */}
        <div className="mb-6">
          <h1 className={`text-8xl font-extrabold ${getErrorColorClass()} drop-shadow-lg animate-pulse-slow`}>
            {statusCode}
          </h1>
          <h2 className="text-3xl font-bold text-gray-800 mt-4">
            {getErrorTitle()}
          </h2>
          <p className="text-gray-600 mt-3 leading-relaxed">
            {getErrorMessage()}
          </p>
        </div>

        <div className="space-y-4 mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Go to Homepage
          </Link>

          {/* Only show 'Go Back' if there's a history entry to go back to */}
          {router.back && (
            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414L7.5 9.086l-1.793-1.793a1 1 0 00-1.414 1.414l2.5 2.5a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Go Back
            </button>
          )}

          {statusCode === 500 && ( // Only show "Try Again" for server errors
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center w-full bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.162A8.955 8.955 0 0110 1c3.866 0 7 3.134 7 7s-3.134 7-7 7-7-3.134-7-7c0-.125.01-.249.029-.37A1 1 0 014 7v-1a1 1 0 112 0v1a1 1 0 001 1h1a1 1 0 000-2h-1a1 1 0 01-1-1V3a1 1 0 011-1zm3 8a1 1 0 100 2h1a1 1 0 100-2H7zm4-2a1 1 0 100 2h1a1 1 0 100-2h-1zm-4 4a1 1 0 100 2h1a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Next.js standard way to get initial props for error pages
Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, hasGetInitialPropsRun: true, err };
};

export default Error;