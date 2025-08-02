import jwt from 'jsonwebtoken';

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lechworld-jwt-secret');
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