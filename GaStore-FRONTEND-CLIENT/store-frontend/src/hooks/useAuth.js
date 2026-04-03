import endpointsPath from '@/constants/EndpointsPath';
import requestHandler from '@/utils/requestHandler';

// Check if user is logged in and get user data
export const checkAuthStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { isAuthenticated: false, user: null };
    }
    
    const resp = await requestHandler.get(`${endpointsPath.auth}/logged-in-user`, true);
    
    if (resp.statusCode === 200) {
      return { 
        isAuthenticated: true, 
        user: resp.result?.data,
        statusCode: resp.statusCode
      };
    }
    
    // Clear invalid token
    localStorage.removeItem('token');
    return { isAuthenticated: false, user: null, statusCode: resp.statusCode };
  } catch (error) {
    console.error('Auth check error:', error);
    return { isAuthenticated: false, user: null, error };
  }
};

// Helper to check if user is logged in (quick check)
export const isUserLoggedIn = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
};