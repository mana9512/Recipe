import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import { Container } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Green shade
    },
    secondary: {
      main: '#FF8A65', // Orange shade
    },
  },
});

const App = () => {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <HomePage />
                    </PrivateRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Container>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App; 