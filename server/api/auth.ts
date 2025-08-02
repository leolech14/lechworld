import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq, or } from 'drizzle-orm';
import { db } from '../index.js';
import { users, families } from '../../shared/schemas/database.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const router = Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create family for this user
    const [family] = await db.insert(families).values({ name: `${name}'s family` }).returning();

    // Create user linked to family
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      familyId: family.id,
    }).returning();

    // Create session
    req.session.userId = newUser.id;
    req.session.familyId = newUser.familyId;

    // Return user (without password)
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const loginIdentifier = email || username; // Accept either field

    if (!loginIdentifier || /[^\w@.-]/.test(loginIdentifier)) {
      return res.status(400).json({ error: 'Invalid login identifier' });
    }

    console.log('Login attempt for:', loginIdentifier);

    // Find user by email OR username
    const userResults = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, loginIdentifier),
          eq(users.username, loginIdentifier)
        )
      )
      .limit(1);
    
    const user = userResults[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if first-time login
    if (!user.password || user.isFirstLogin) {
      // For first-time login, set the password
      const hashedPassword = await bcrypt.hash(password, 10);
      await db
        .update(users)
        .set({ 
          password: hashedPassword, 
          isFirstLogin: false,
          passwordChangedAt: new Date()
        })
        .where(eq(users.id, user.id));
    } else {
      // Verify existing password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Create JWT token for Vercel
    const token = jwt.sign(
      { userId: user.id, familyId: user.familyId, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);

    // Store session info
    req.session.userId = user.id;
    req.session.familyId = user.familyId;

    // Return user (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.session.familyId = user.familyId;

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;