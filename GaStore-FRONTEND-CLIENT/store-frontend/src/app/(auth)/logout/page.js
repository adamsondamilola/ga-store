'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const LogoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('redirect_url');
//    router.replace('/login'); // redirect to login
    router.replace('/'); // redirect to home
  }, []);

  return <p>Logging out...</p>;
};

export default LogoutPage;
