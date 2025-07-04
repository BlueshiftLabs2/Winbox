import React, { useState } from 'react';
import { 
  TextField, Button, Typography, Box, Link, Paper, 
  Container, Grid, CircularProgress, Alert
} from '@mui/material';
import { authService } from '../services/api';

interface AuthFormsProps {
  onAuthSuccess: (token: string) => void;
}

const AuthForms: React.FC<AuthFormsProps> = ({ onAuthSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    if (isLoginView) {
      return email.trim() !== '' && password.trim() !== '';
    } else {
      if (password !== confirmPassword) {
        setError("Passwords don't match");
        return false;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return false;
      }
      return username.trim() !== '' && email.trim() !== '' && 
        password.trim() !== '' && confirmPassword.trim() !== '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      if (isLoginView) {
        // Login
        const result = await authService.login(email, password);
        localStorage.setItem('token', result.token);
        onAuthSuccess(result.token);
      } else {
        // Register
        const result = await authService.register(username, email, password);
        localStorage.setItem('token', result.token);
        onAuthSuccess(result.token);
      }
    } catch (err) {
      console.error(err);
      setError(isLoginView 
        ? "Login failed. Please check your credentials." 
        : "Registration failed. Email may already be in use."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError(null);
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          {isLoginView ? 'Sign In' : 'Create Account'}
        </Typography>
        
        <Typography variant="body1" align="center" color="textSecondary" paragraph>
          {isLoginView 
            ? 'Access your virtual machines' 
            : 'Create an account to get started with Winbox'
          }
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {!isLoginView && (
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          )}
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete={isLoginView ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!isLoginView && password.length > 0 && password.length < 8}
            helperText={!isLoginView && password.length > 0 && password.length < 8 
              ? "Password must be at least 8 characters" 
              : ""}
            disabled={isLoading}
          />
          
          {!isLoginView && (
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPassword && password !== confirmPassword}
              helperText={confirmPassword && password !== confirmPassword 
                ? "Passwords don't match" 
                : ""}
              disabled={isLoading}
            />
          )}
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2 }}
          >
            {isLoading ? (
              <CircularProgress size={24} />
            ) : isLoginView ? (
              'Sign In'
            ) : (
              'Sign Up'
            )}
          </Button>
          
          <Grid container justifyContent="center">
            <Grid item>
              <Link 
                component="button" 
                variant="body2" 
                onClick={toggleView}
                underline="hover"
              >
                {isLoginView 
                  ? "Don't have an account? Sign Up" 
                  : "Already have an account? Sign In"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default AuthForms;