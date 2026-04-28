import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import apiClient from '../api/axiosInstance';

const AuthContext = createContext();

// Configuration
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before logout

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0);

  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const warningCountdownRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // C4 - Initialize auth by calling /profile - cookie is sent automatically
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await apiClient.get('/auth/profile');
        setUser(response.data);
        lastActivityRef.current = Date.now();
        setupInactivityTracking();
      } catch {
        // 401 or network error = no valid session
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Setup inactivity tracking
  const setupInactivityTracking = () => {
    clearAllTimers();

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      setShowSessionWarning(false);
      clearAllTimers();
      startInactivityTimer();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    startInactivityTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  };

  const startInactivityTimer = () => {
    clearAllTimers();

    // Set timer for warning (5 minutes before logout)
    warningTimerRef.current = setTimeout(() => {
      setShowSessionWarning(true);
      startWarningCountdown();
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Set timer for actual logout
    inactivityTimerRef.current = setTimeout(() => {
      handleSessionExpire();
    }, INACTIVITY_TIMEOUT);
  };

  const startWarningCountdown = () => {
    let timeLeft = WARNING_TIME / 1000; // seconds

    warningCountdownRef.current = setInterval(() => {
      timeLeft--;
      setSessionTimeRemaining(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(warningCountdownRef.current);
      }
    }, 1000);
  };

  const clearAllTimers = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (warningCountdownRef.current) clearInterval(warningCountdownRef.current);
  };

  const handleSessionExpire = () => {
    setShowSessionWarning(false);
    logout();
  };

  const handleContinueSession = () => {
    lastActivityRef.current = Date.now();
    setShowSessionWarning(false);
    clearAllTimers();
    startInactivityTimer();
  };

  // C4 - Login: takes only userData (no token param)
  const login = (userData) => {
    setUser(userData);
    lastActivityRef.current = Date.now();
    setShowSessionWarning(false);
    clearAllTimers();
    setupInactivityTracking();
  };

  // C4 - Logout: async, calls backend to clear cookie
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Proceed even if the request fails — clear local state
    }
    setUser(null);
    setShowSessionWarning(false);
    clearAllTimers();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <AuthContext.Provider value={{ user, loading, login, logout }}>
        {children}

        {/* Session Warning Dialog */}
        <Dialog
          open={showSessionWarning}
          onClose={(_, reason) => {
            if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
              handleContinueSession();
            }
          }}
          disableEscapeKeyDown={showSessionWarning}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ backgroundColor: '#fff3cd', borderBottom: '1px solid #ffc107' }}>
            Session About to Expire
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body1" gutterBottom>
              Your session will expire due to inactivity.
            </Typography>
            <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                {formatTime(sessionTimeRemaining)}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Click "Continue Session" to stay logged in
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
              If you do not take action, you will be logged out for security purposes.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleSessionExpire} color="error">
              Logout
            </Button>
            <Button onClick={handleContinueSession} variant="contained" color="primary">
              Continue Session
            </Button>
          </DialogActions>
        </Dialog>
      </AuthContext.Provider>
    </>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
