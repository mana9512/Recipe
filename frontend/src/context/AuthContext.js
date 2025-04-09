import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

// Helper function to validate user data
const isValidUserData = (userData) => {
  return userData && 
         typeof userData === 'object' && 
         userData.id && 
         userData.email && 
         userData.accessToken && 
         typeof userData.accessToken === 'string' && 
         userData.accessToken.length > 0;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Verify the user object has the required properties
        if (isValidUserData(parsedUser)) {
          console.log('User loaded from localStorage, token length:', parsedUser.accessToken.length);
          setUser(parsedUser);
        } else {
          console.error('Invalid user data in localStorage');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    // Ensure we're storing valid user data with an access token
    if (!isValidUserData(userData)) {
      console.error('Invalid user data provided during login');
      return false;
    }
    
    console.log('Logging in user with token length:', userData.accessToken.length);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    console.log('Logging out user');
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 