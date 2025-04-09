import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';
import { verifyGoogleToken } from '../middleware/auth.js';

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const payload = await verifyGoogleToken(token);

    if (!payload) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Check if user exists
    let user = await UserModel.findByGoogleId(payload.sub);

    if (!user) {
      // Create new user if doesn't exist
      user = await UserModel.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 