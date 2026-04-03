export default function NotFoundPage() {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-900">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-xl mt-2">Page Not Found</p>
        <p className="mt-4 text-gray-600">Oops! The page you are looking for doesn't exist.</p>
        <a
          href="/"
          className="mt-6 px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          Go Home
        </a>
      </div>
    );
  }
  