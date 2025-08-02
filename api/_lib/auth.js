import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export function getUserFromRequest(req) {
  try {
    // Get token from cookie or Authorization header
    const cookieHeader = req.headers.cookie || '';
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => c.split('='))
    );

    const token = cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    // Verify and decode JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}