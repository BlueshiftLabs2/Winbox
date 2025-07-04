import React, { useState, useEffect } from 'react';
import { 
  CssBaseline, ThemeProvider, createTheme, 
  AppBar, Toolbar, Typography, IconButton, 
  Button, Box, CircularProgress, Container
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import { authService } from './services/api';
import Dashboard from './components/Dashboard';
import AuthForms from './components/AuthForms';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(localStorage.getItem('darkMode') === 'true');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#3f51b5',
      },
      secondary: {
        main: '#f50057',
      },
    },
  });

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Authentication failed', error);
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const handleAuthSuccess = (token: string) => {
    setIsAuthenticated(true);
    // Get user info
    authService.getCurrentUser().then(userData => {
      setUser(userData);
    });
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Winbox
            </Typography>

            <IconButton color="inherit" onClick={toggleDarkMode}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>

            {isAuthenticated && (
              <>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  {user?.username}
                </Typography>
                <Button 
                  color="inherit" 
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
          {isAuthenticated ? (
            <Dashboard />
          ) : (
            <AuthForms onAuthSuccess={handleAuthSuccess} />
          )}
        </Box>

        <Box 
          component="footer"
          sx={{ 
            py: 3, 
            px: 2,
            mt: 'auto',
            backgroundColor: theme => 
              theme.palette.mode === 'light' 
                ? theme.palette.grey[200] 
                : theme.palette.grey[900]
          }}
        >
          <Container maxWidth="sm">
            <Typography variant="body2" color="text.secondary" align="center">
              Winbox - Browser-based VM Management Platform
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;