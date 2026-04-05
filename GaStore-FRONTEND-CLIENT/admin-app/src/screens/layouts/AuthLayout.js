import { Outlet } from 'react-router';
import AppStrings from '../../constants/Strings';

const AuthLayout = () => {

  return (

    <html lang="en">
      <body
        className={`antialiased`}
      >
    <div className="min-h-screen bg-[#edf4ff]">
      <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.16),_transparent_22%),linear-gradient(180deg,#f8fbff_0%,#edf4ff_45%,#f8fafc_100%)]" />
      <div className="pointer-events-none absolute left-[-120px] top-20 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-[-120px] h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl items-center justify-center py-6">
      
      <Outlet/>

      </main>
      </div>
      {/*<BottomNav/>*/}
      <footer className="hidden border-t border-white/60 bg-white/70 py-4 backdrop-blur md:block lg:block">
        <div className="container mx-auto px-4 text-center text-sm text-slate-600">
          &copy; 2025 {AppStrings.website}. All rights reserved.
        </div>
      </footer>
    </div>
      </body>
    </html>
  )
}
export default AuthLayout
