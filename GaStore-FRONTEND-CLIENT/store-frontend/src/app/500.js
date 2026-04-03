import Link from 'next/link';

export default function Custom500() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4 sm:p-6">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-8 text-center border-t-4 border-red-500 transform hover:scale-105 transition-transform duration-300 ease-in-out">
        <div className="mb-6">
          <h1 className="text-8xl font-extrabold text-red-500 drop-shadow-lg animate-pulse-slow">500</h1>
          <h2 className="text-3xl font-bold text-gray-800 mt-4">Internal Server Error</h2>
          <p className="text-gray-600 mt-3 leading-relaxed">
            We're truly sorry, but something unexpected went wrong on our server. We're working to fix it!
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

          <button
            onClick={() => window.location.reload()}
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
                d="M4 2a1 1 0 011 1v2.162A8.955 8.955 0 0110 1c3.866 0 7 3.134 7 7s-3.134 7-7 7-7-3.134-7-7c0-.125.01-.249.029-.37A1 1 0 014 7v-1a1 1 0 112 0v1a1 1 0 001 1h1a1 1 0 000-2h-1a1 1 0 01-1-1V3a1 1 0 011-1zm3 8a1 1 0 100 2h1a1 1 0 100-2H7zm4-2a1 1 0 100 2h1a1 1 0 100-2h-1zm-4 4a1 1 0 100 2h1a1 1 0 100-2H7z"
                clipRule="evenodd"
              />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}