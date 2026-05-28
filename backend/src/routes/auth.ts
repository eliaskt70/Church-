import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
import db from '../config/database';
import { generateToken } from '../middleware/auth';
import { requestOtpValidator, verifyOtpValidator, googleAuthValidator } from '../utils/validators';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = Router();

// In-memory OTP store for MVP (phone -> { hash, expiresAt })
const otpStore = new Map<string, { hash: string; expiresAt: Date }>();

// Rate limit: 5 requests per phone per 10 minutes
const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: (req: Request) => req.body.phone || 'unknown',
  message: { success: false, error: 'Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// POST /api/auth/request-otp
router.post('/request-otp', otpRateLimiter, requestOtpValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return;
  }

  try {
    const { phone } = req.body;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP
    otpStore.set(phone, { hash, expiresAt });

    // Log OTP to console for MVP (no SMS integration)
    console.log(`[OTP] Phone: ${phone}, Code: ${otp}`);

    res.json({ success: true, data: { message: 'OTP sent successfully' } });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtpValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return;
  }

  try {
    const { phone, code } = req.body;

    const stored = otpStore.get(phone);
    if (!stored) {
      res.status(400).json({ success: false, error: 'No OTP requested for this phone' });
      return;
    }

    if (new Date() > stored.expiresAt) {
      otpStore.delete(phone);
      res.status(400).json({ success: false, error: 'OTP has expired' });
      return;
    }

    const isValid = await bcrypt.compare(code, stored.hash);
    if (!isValid) {
      res.status(400).json({ success: false, error: 'Invalid OTP code' });
      return;
    }

    // Remove used OTP
    otpStore.delete(phone);

    // Find or create user
    let user = await db('users').where('phone', phone).first();

    if (!user) {
      const [newUser] = await db('users')
        .insert({
          id: crypto.randomUUID(),
          phone,
          account_type: 'beneficiary',
        })
        .returning('*');
      user = newUser;
    }

    const token = generateToken({ userId: user.id, accountType: user.account_type });

    res.json({
      success: true,
      data: { token, user: { id: user.id, phone: user.phone, account_type: user.account_type } },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
});

// POST /api/auth/google
router.post('/google', googleAuthValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return;
  }

  try {
    const { token, email, name } = req.body;

    if (!token) {
      res.status(400).json({ success: false, error: 'Google token is required' });
      return;
    }

    // Verify the Google ID token server-side
    let gId: string;
    let verifiedEmail: string | undefined;
    let verifiedName: string | undefined;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.sub) {
        res.status(401).json({ success: false, error: 'Invalid Google token' });
        return;
      }
      gId = payload.sub;
      verifiedEmail = payload.email || email;
      verifiedName = payload.name || name;
    } catch {
      res.status(401).json({ success: false, error: 'Google token verification failed' });
      return;
    }

    let user = await db('users').where('google_id', gId).first();

    if (!user && verifiedEmail) {
      user = await db('users').where('email', verifiedEmail).first();
      if (user) {
        await db('users').where('id', user.id).update({ google_id: gId });
        user.google_id = gId;
      }
    }

    if (!user) {
      const [newUser] = await db('users')
        .insert({
          id: crypto.randomUUID(),
          google_id: gId,
          email: verifiedEmail || null,
          name: verifiedName || null,
          account_type: 'beneficiary',
        })
        .returning('*');
      user = newUser;
    }

    const jwtToken = generateToken({ userId: user.id, accountType: user.account_type });

    res.json({
      success: true,
      data: { token: jwtToken, user: { id: user.id, email: user.email, account_type: user.account_type } },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, error: 'Failed to authenticate with Google' });
  }
});

// Export for testing
export { otpStore };
export default router;
