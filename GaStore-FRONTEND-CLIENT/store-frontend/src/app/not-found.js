import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300 ease-in-out border border-blue-200">
        <div className="mb-6">
          {/* Using a more vibrant and distinct 404 number */}
          <h1 className="text-8xl font-extrabold text-blue-400 drop-shadow-lg animate-bounce-slow">404</h1>
          <h2 className="text-3xl font-bold text-gray-800 mt-4">Page Not Found</h2>
          <p className="text-gray-600 mt-3 leading-relaxed">
            Oops! It seems the page you're looking for doesn't exist. It might have been moved or deleted.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          {/* Added a small icon for visual appeal */}
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
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}