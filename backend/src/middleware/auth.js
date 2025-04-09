import jwt from 'jsonwebtoken';
import axios from 'axios';

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to verify Google access token
export const verifyGoogleToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Google authentication required' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token length:', token?.length);
    console.log('Token format:', token?.split('.').length === 3 ? 'JWT format' : 'Not JWT format');

    try {
      // Verify the access token by making a request to Google's userinfo endpoint
      console.log('Making request to Google userinfo endpoint...');
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Google response status:', response.status);
      console.log('Google response data:', response.data ? 'Present' : 'Missing');

      if (!response.data || !response.data.email) {
        throw new Error('Invalid user data received from Google');
      }
      
      // Store the user info in the request
      req.googleUser = response.data;
      next();
    } catch (error) {
      console.error('Google auth error:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      return res.status(401).json({ 
        message: 'Invalid Google token',
        details: error.response?.data || error.message
      });
    }
  } catch (error) {
    console.error('Unexpected error in Google auth:', error);
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
}; 