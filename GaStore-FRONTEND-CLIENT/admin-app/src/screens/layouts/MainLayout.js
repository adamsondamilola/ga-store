import { Outlet } from 'react-router';
import Header from '../../components/landing/Header';
import Footer from '../../components/landing/Footer';

const MainLayout = () => {

  const metadata = {
    title: 'GaStore - Admin',
    description: 'GaStore online store for different types of products',
  }

  return (
    <html lang="en">
      
      <body className="w-full font-sans">
    <Header/>
    <Outlet/>
        <Footer/>
        </body>

    </html>
  )
}
export default MainLayout
