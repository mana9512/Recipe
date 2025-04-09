import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Box, Button, Typography, Container, Paper, Alert } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const handleGoogleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (response) => {
      try {
        setLoading(true);
        setError(null);
        console.log('Google login successful, access token received');
        
        // Get user info from Google
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${response.access_token}`,
            },
          }
        );
        
        if (!userInfoResponse.ok) {
          const errorData = await userInfoResponse.json();
          console.error('Error fetching user info:', errorData);
          setError(`Failed to get user info: ${errorData.error_description || 'Unknown error'}`);
          return;
        }
        
        const userInfo = await userInfoResponse.json();
        console.log('User info received from Google:', userInfo.email);
        
        // Save user data with Google token
        const userData = {
          id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          accessToken: response.access_token, // Store the Google access token
        };
        
        console.log('Storing user data with token length:', userData.accessToken.length);
        login(userData);

        // Verify token was stored correctly
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || !storedUser.accessToken) {
          setError('Failed to store authentication token');
          return;
        }
        
        console.log('Stored user token length:', storedUser.accessToken.length);
        
        // Redirect to home page
        navigate('/');
      } catch (error) {
        console.error('Error fetching user info:', error);
        setError(`Login error: ${error.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      setError(`Google login failed: ${error.error_description || 'Unknown error'}`);
    },
    popup: false, // Disable popup mode to avoid COOP issues
  });

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            Welcome to Recipe Portal
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Please sign in to continue
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
              {error}
            </Alert>
          )}
          
          <Button
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={() => handleGoogleLogin()}
            fullWidth
            disabled={loading}
            sx={{
              mt: 2,
              backgroundColor: '#fff',
              color: '#757575',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              border: '1px solid #dadce0',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 