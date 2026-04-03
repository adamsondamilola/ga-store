import { Outlet } from 'react-router';
import AppStrings from '../../constants/Strings';

const AuthLayout = () => {

  return (

    <html lang="en">
      <body
        className={`antialiased`}
      >
    <div className="min-h-screen bg-gray-100">
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black-50 p-4">
      <main className="container mx-auto md:px-4 px-4 py-8">
      
      <Outlet/>

      </main>
      </div>
      {/*<BottomNav/>*/}
      <footer className="hidden lg:block md:block inset-x-0 bottom-0 bg-white shadow py-4">
        <div className="container mx-auto md:px-4 px-4 text-center text-gray-600">
          &copy; 2025 {AppStrings.website}. All rights reserved.
        </div>
      </footer>
    </div>
      </body>
    </html>
  )
}
export default AuthLayout