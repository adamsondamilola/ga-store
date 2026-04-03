import { Outlet, useNavigate } from 'react-router';
import { DashboardNavBarComponent } from '../../components/NavBar/dashboardNav';
import AsideComponent from '../../components/NavBar/aside';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Modal, Button, Typography, Box, CircularProgress } from '@mui/material';

const DashboardLayout = () => {
  const navigate = useNavigate();

  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Store timers in refs (NOT state)
  const logoutTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // ================================
  // LOGOUT FUNCTION
  // ================================
  const handleLogout = useCallback(() => {
    // Clear timers
    clearTimeout(logoutTimerRef.current);
    clearTimeout(warningTimerRef.current);
    clearInterval(countdownIntervalRef.current);

    // Clear stored auth
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate('/login');
  }, [navigate]);

  // ================================
  // RESET IDLE TIMER
  // ================================
  const resetIdleTimer = useCallback(() => {

    // Clear existing timers
    clearTimeout(logoutTimerRef.current);
    clearTimeout(warningTimerRef.current);
    clearInterval(countdownIntervalRef.current);

    // Reset UI
    setShowTimeoutModal(false);
    setCountdown(60);

    // 29.5 min warning
    warningTimerRef.current = setTimeout(() => {
      setShowTimeoutModal(true);

      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 29.5 * 60 * 1000);

    // 30 min auto logout
    logoutTimerRef.current = setTimeout(handleLogout, 30 * 60 * 1000);

  }, [handleLogout]);

  // ================================
  // USER ACTIVITY HANDLER
  // ================================
  const handleUserActivity = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  // ================================
  // SETUP EVENT LISTENERS
  // ================================
  useEffect(() => {
    resetIdleTimer();

    const events = [
      'mousedown', 'mousemove', 'keydown',
      'touchstart', 'scroll', 'click'
    ];

    events.forEach(e => window.addEventListener(e, handleUserActivity));

    return () => {
      // Cleanup on unmount
      events.forEach(e => window.removeEventListener(e, handleUserActivity));
      clearTimeout(logoutTimerRef.current);
      clearTimeout(warningTimerRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, [handleUserActivity, resetIdleTimer]);

  // ================================
  // HELPERS
  // ================================
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStayLoggedIn = () => resetIdleTimer();
  const handleLogoutFromModal = () => handleLogout();

  // ================================
  // JSX LAYOUT
  // ================================
  return (
    <div className="text-black w-full font-family-karla">

      <header className="fixed w-full z-10 shadow">
        <DashboardNavBarComponent />
      </header>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 pt-16">
        <div className="flex">
          <aside className="w-1/4 h-screen hidden md:block relative overflow-y-auto no-scrollbar">
            <AsideComponent />
          </aside>

          <main className="w-full p-5 overflow-y-auto no-scrollbar">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={showTimeoutModal}
        onClose={handleStayLoggedIn}
        aria-labelledby="timeout-modal-title"
        aria-describedby="timeout-modal-description"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{
          width: 400,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}>
          <Typography variant="h6" gutterBottom>
            Session Timeout Warning
          </Typography>

          <Typography sx={{ mt: 2, mb: 3 }}>
            Your session will expire in{" "}
            <strong style={{ color: countdown <= 10 ? '#dc2626' : '#2563eb' }}>
              {formatTime(countdown)}
            </strong>
            {" "}due to inactivity.
          </Typography>

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <CircularProgress
              variant="determinate"
              value={(countdown / 60) * 100}
              size={28}
              thickness={5}
              sx={{
                mr: 2,
                color: countdown <= 10 ? '#dc2626' : '#2563eb'
              }}
            />
            <Typography variant="body2">
              Time remaining: {formatTime(countdown)}
            </Typography>
          </div>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleStayLoggedIn}
              sx={{
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' },
              }}
            >
              Stay Logged In
            </Button>

            <Button
              variant="outlined"
              onClick={handleLogoutFromModal}
              sx={{
                borderColor: '#dc2626',
                color: '#dc2626',
                '&:hover': {
                  borderColor: '#b91c1c',
                  color: '#b91c1c',
                },
              }}
            >
              Logout Now
            </Button>
          </Box>

          <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
            Click "Stay Logged In" to continue your session
          </Typography>
        </Box>
      </Modal>

    </div>
  );
};

export default DashboardLayout;
