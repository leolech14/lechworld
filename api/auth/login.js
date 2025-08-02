import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, email, password } = req.body;
    const loginIdentifier = username || email;
    
    console.log('Login attempt for:', loginIdentifier);

    // Find user in Supabase
    // The users table uses the email field to store usernames
    let query = supabase.from('users').select('*');
    
    // Since usernames are stored in the email field, check there
    query = query.eq('email', loginIdentifier.toLowerCase());
    
    const { data: users, error } = await query.limit(1);
    
    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const user = users?.[0];
    if (!user) {
      console.log('User not found:', loginIdentifier);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Found user:', { id: user.id, email: user.email, hasPassword: !!user.password });

    // Check password
    if (!user.password || user.password === '') {
      // First-time login - set the password
      console.log('First time login, setting password');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password: hashedPassword
        })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Password update error:', updateError);
        return res.status(500).json({ error: 'Failed to set password' });
      }
      
      console.log('Password set successfully');
    } else {
      // Verify existing password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log('Invalid password');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      console.log('Password verified');
    }

    // Create JWT token with user info
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        username: user.email // Use email as username since Supabase doesn't have username
      },
      process.env.JWT_SECRET || 'lechworld-jwt-secret',
      { expiresIn: '7d' }
    );

    // Set cookie with proper settings for production
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      `token=${token}`,
      'HttpOnly',
      'Path=/',
      `Max-Age=${7 * 24 * 60 * 60}`,
      isProduction ? 'SameSite=None; Secure' : 'SameSite=Lax'
    ].join('; ');
    
    res.setHeader('Set-Cookie', cookieOptions);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({ 
      user: userWithoutPassword,
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
}